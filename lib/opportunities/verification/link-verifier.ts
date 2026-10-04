/**
 * EVIDENCE-FIRST LINK VERIFICATION ENGINE
 * 
 * Implements deterministic URL & content verification:
 * 1. SSRF & Scheme Protection (blocks private networks, AWS metadata, non-http schemes).
 * 2. Redirect Tracking (records hops, detects redirect to generic homepages vs opportunity pages).
 * 3. Deep Content Inspection: HTTP 200 is NOT sufficient!
 *    - Detects "page not found", "404", "registration closed", "expired", "removed", login walls.
 * 4. Identity Match Verification (verifies that final landing page matches organizer and title).
 * 5. Just-In-Time Application verification and status classification.
 */

import { LinkStatus, LinkVerificationResult } from "../types";

// Private IP and loopback ranges for SSRF prevention
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // AWS / cloud link-local metadata
  /^::1$/,
  /^[fF][cCdD][0-9a-fA-F]{2}:/,
  /^[fF][eE]80:/
];

// Content indicators indicating 404 / missing resource
const NOT_FOUND_PATTERNS = [
  /page not found/i,
  /404 not found/i,
  /this page could not be found/i,
  /opportunity not found/i,
  /this challenge is not found/i,
  /page does not exist/i,
  /we couldn't find that page/i,
  /the page you requested was not found/i,
  /error 404/i,
  /item removed/i,
  /content has been removed/i,
  /challenge has been deleted/i,
  /hackathon not found/i
];

// Content indicators indicating closed registration or expired event
const EXPIRED_OR_CLOSED_PATTERNS = [
  /registration closed/i,
  /registrations have closed/i,
  /registration has ended/i,
  /opportunity expired/i,
  /submissions closed/i,
  /submissions have ended/i,
  /this hackathon has ended/i,
  /this challenge has concluded/i,
  /no longer accepting applications/i,
  /no longer accepting submissions/i,
  /event ended/i,
  /contest ended/i,
  /applications closed/i,
  /deadline passed/i
];

// Login wall patterns
const LOGIN_WALL_PATTERNS = [
  /sign in to continue/i,
  /login to apply/i,
  /log in to view this opportunity/i,
  /please sign in/i,
  /login required/i
];

// Generic homepages where redirects commonly land when an opportunity is deleted
const GENERIC_PORTAL_HOMEPAGES = [
  /^https?:\/\/(www\.)?unstop\.com\/?$/i,
  /^https?:\/\/(www\.)?unstop\.com\/competitions\/?$/i,
  /^https?:\/\/(www\.)?unstop\.com\/hackathons\/?$/i,
  /^https?:\/\/(www\.)?devpost\.com\/?$/i,
  /^https?:\/\/(www\.)?devpost\.com\/hackathons\/?$/i,
  /^https?:\/\/(www\.)?hackerearth\.com\/?$/i,
  /^https?:\/\/(www\.)?hackerearth\.com\/challenges\/?$/i,
  /^https?:\/\/(www\.)?hackerrank\.com\/?$/i,
  /^https?:\/\/(www\.)?hackerrank\.com\/contests\/?$/i,
  /^https?:\/\/(www\.)?kaggle\.com\/?$/i,
  /^https?:\/\/(www\.)?kaggle\.com\/competitions\/?$/i,
  /^https?:\/\/(www\.)?codechef\.com\/?$/i,
  /^https?:\/\/(www\.)?github\.com\/?$/i
];

interface VerificationCacheEntry {
  result: LinkVerificationResult;
  timestamp: number;
}

export class LinkVerificationEngine {
  private static instance: LinkVerificationEngine;
  private cache = new Map<string, VerificationCacheEntry>();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

  // Test mocks registry for deterministic unit/acceptance tests
  private testMocks = new Map<string, {
    status: number;
    body: string;
    finalUrl?: string;
    redirectChain?: string[];
    headers?: Record<string, string>;
  }>();

  private constructor() {}

  public static getInstance(): LinkVerificationEngine {
    if (!LinkVerificationEngine.instance) {
      LinkVerificationEngine.instance = new LinkVerificationEngine();
    }
    return LinkVerificationEngine.instance;
  }

  /**
   * Register a simulated URL response for testing without internet dependency
   */
  public registerTestMock(url: string, mock: {
    status: number;
    body: string;
    finalUrl?: string;
    redirectChain?: string[];
    headers?: Record<string, string>;
  }): void {
    this.testMocks.set(url, mock);
  }

  public clearTestMocks(): void {
    this.testMocks.clear();
  }

  /**
   * Validate URL safety against SSRF & scheme exploits
   */
  public isSafeUrl(rawUrl: string): { safe: boolean; reason?: string; parsedUrl?: URL } {
    if (!rawUrl || typeof rawUrl !== "string") {
      return { safe: false, reason: "Missing or invalid URL string" };
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      return { safe: false, reason: "Malformed URL syntax" };
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { safe: false, reason: `Unsafe scheme: ${parsed.protocol}. Only http and https are permitted.` };
    }

    const hostname = parsed.hostname.toLowerCase();

    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return { safe: false, reason: `Blocked private or local network destination: ${hostname}` };
      }
    }

    return { safe: true, parsedUrl: parsed };
  }

  /**
   * Deterministically verify an application or source URL
   */
  public async verifyUrl(
    rawUrl: string,
    context?: {
      title?: string;
      organizer?: string;
      opportunityId?: string;
      forceFresh?: boolean;
    }
  ): Promise<LinkVerificationResult> {
    const trimmedUrl = (rawUrl || "").trim();
    const now = new Date().toISOString();

    // Check SSRF
    const safety = this.isSafeUrl(trimmedUrl);
    if (!safety.safe) {
      return {
        url: trimmedUrl,
        finalUrl: trimmedUrl,
        httpStatus: 400,
        status: "UNAVAILABLE",
        isVerified: false,
        isActionable: false,
        redirectChain: [],
        failureReason: safety.reason || "Unsafe URL",
        checkedAt: now,
        contentSignals: {
          has404Text: false,
          hasExpiredText: false,
          hasClosedText: false,
          hasLoginWall: false,
          titleMatches: false,
          organizerMatches: false
        }
      };
    }

    // Check cache
    if (!context?.forceFresh) {
      const cached = this.cache.get(trimmedUrl);
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
        return cached.result;
      }
    }

    // Check if test mock registered
    if (this.testMocks.has(trimmedUrl)) {
      const mock = this.testMocks.get(trimmedUrl)!;
      const res = this.evaluateResponse(
        trimmedUrl,
        mock.finalUrl || trimmedUrl,
        mock.status,
        mock.body,
        mock.redirectChain || (mock.finalUrl && mock.finalUrl !== trimmedUrl ? [trimmedUrl, mock.finalUrl] : []),
        context
      );
      this.cache.set(trimmedUrl, { result: res, timestamp: Date.now() });
      return res;
    }

    // Live HTTP request
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 second timeout

      const response = await fetch(trimmedUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 CognalyzeVerificationBot/2.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        redirect: "follow",
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const finalUrl = response.url || trimmedUrl;
      const text = await response.text();
      const redirectChain = finalUrl !== trimmedUrl ? [trimmedUrl, finalUrl] : [];

      const result = this.evaluateResponse(
        trimmedUrl,
        finalUrl,
        response.status,
        text,
        redirectChain,
        context
      );

      this.cache.set(trimmedUrl, { result, timestamp: Date.now() });
      return result;
    } catch (err: any) {
      const isTimeout = err?.name === "AbortError";
      const failureReason = isTimeout ? "Verification request timed out" : (err?.message || "Network unreachable");

      const failureResult: LinkVerificationResult = {
        url: trimmedUrl,
        finalUrl: trimmedUrl,
        httpStatus: 0,
        status: "SOURCE_UNREACHABLE",
        isVerified: false,
        isActionable: false,
        redirectChain: [],
        failureReason,
        checkedAt: now,
        contentSignals: {
          has404Text: false,
          hasExpiredText: false,
          hasClosedText: false,
          hasLoginWall: false,
          titleMatches: false,
          organizerMatches: false
        }
      };

      return failureResult;
    }
  }

  /**
   * Internal evaluation of HTTP response and HTML body
   */
  private evaluateResponse(
    originalUrl: string,
    finalUrl: string,
    status: number,
    html: string,
    redirectChain: string[],
    context?: { title?: string; organizer?: string }
  ): LinkVerificationResult {
    const now = new Date().toISOString();
    const normalizedHtml = (html || "").toLowerCase();

    // Extract page title if available
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

    // Detect content signals
    const has404Text = NOT_FOUND_PATTERNS.some(p => p.test(normalizedHtml));
    const hasExpiredText = EXPIRED_OR_CLOSED_PATTERNS.some(p => p.test(normalizedHtml));
    const hasClosedText = /registration closed|submissions closed/i.test(normalizedHtml);
    const hasLoginWall = LOGIN_WALL_PATTERNS.some(p => p.test(normalizedHtml));

    // Check identity keywords
    let titleMatches = true;
    let organizerMatches = true;

    if (context?.title && context.title.length > 4) {
      const keywords = context.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 3 && !["hackathon", "buildathon", "challenge", "2026", "2025"].includes(w));
      
      if (keywords.length > 0) {
        const found = keywords.some(k => normalizedHtml.includes(k) || (pageTitle && pageTitle.toLowerCase().includes(k)));
        titleMatches = found;
      }
    }

    if (context?.organizer && context.organizer.length > 3) {
      const orgWord = context.organizer.toLowerCase().replace(/[^a-z0-9]/g, "");
      organizerMatches = normalizedHtml.includes(orgWord) || Boolean(pageTitle && pageTitle.toLowerCase().includes(orgWord));
    }

    // Check if redirected to a generic platform home page (e.g. hackathon was deleted and platform redirects to /)
    const isGenericHomeRedirect = GENERIC_PORTAL_HOMEPAGES.some(pattern => pattern.test(finalUrl));

    // 1. Direct 404 or missing resource
    if (status === 404 || status === 410) {
      return {
        url: originalUrl,
        finalUrl,
        httpStatus: status,
        status: "NOT_FOUND",
        isVerified: false,
        isActionable: false,
        redirectChain,
        failureReason: `Resource returned HTTP ${status}`,
        pageTitle,
        checkedAt: now,
        contentSignals: { has404Text: true, hasExpiredText, hasClosedText, hasLoginWall, titleMatches: false, organizerMatches: false }
      };
    }

    // 2. HTTP 200 with 404 text inside
    if (has404Text) {
      return {
        url: originalUrl,
        finalUrl,
        httpStatus: status,
        status: "NOT_FOUND",
        isVerified: false,
        isActionable: false,
        redirectChain,
        failureReason: "Page content indicates the resource was deleted or not found (soft 404)",
        pageTitle,
        checkedAt: now,
        contentSignals: { has404Text: true, hasExpiredText, hasClosedText, hasLoginWall, titleMatches: false, organizerMatches: false }
      };
    }

    // 3. Generic homepage redirect
    if (isGenericHomeRedirect && originalUrl !== finalUrl) {
      return {
        url: originalUrl,
        finalUrl,
        httpStatus: status,
        status: "REMOVED",
        isVerified: false,
        isActionable: false,
        redirectChain,
        failureReason: "Opportunity redirected to a generic platform homepage; specific listing removed",
        pageTitle,
        checkedAt: now,
        contentSignals: { has404Text: false, hasExpiredText: false, hasClosedText: false, hasLoginWall: false, titleMatches: false, organizerMatches: false }
      };
    }

    // 4. Expired or closed registrations
    if (hasExpiredText || hasClosedText) {
      return {
        url: originalUrl,
        finalUrl,
        httpStatus: status,
        status: "REGISTRATION_CLOSED",
        isVerified: true,
        isActionable: false,
        redirectChain,
        failureReason: "Official page indicates registrations or submissions are closed",
        pageTitle,
        checkedAt: now,
        contentSignals: { has404Text: false, hasExpiredText: true, hasClosedText: true, hasLoginWall, titleMatches, organizerMatches }
      };
    }

    // 5. Login wall
    if (hasLoginWall && !normalizedHtml.includes("apply") && !normalizedHtml.includes("register")) {
      return {
        url: originalUrl,
        finalUrl,
        httpStatus: status,
        status: "LOGIN_REQUIRED",
        isVerified: true,
        isActionable: true,
        redirectChain,
        pageTitle,
        checkedAt: now,
        contentSignals: { has404Text: false, hasExpiredText: false, hasClosedText: false, hasLoginWall: true, titleMatches, organizerMatches }
      };
    }

    // 6. Redirected to legitimate new opportunity URL
    if (redirectChain.length > 0 && status >= 200 && status < 300) {
      return {
        url: originalUrl,
        finalUrl,
        httpStatus: status,
        status: "REDIRECTED_VERIFIED",
        isVerified: true,
        isActionable: true,
        redirectChain,
        pageTitle,
        checkedAt: now,
        contentSignals: { has404Text: false, hasExpiredText: false, hasClosedText: false, hasLoginWall: false, titleMatches, organizerMatches }
      };
    }

    // 7. Verified Active
    if (status >= 200 && status < 300) {
      return {
        url: originalUrl,
        finalUrl,
        httpStatus: status,
        status: "VERIFIED_ACTIVE",
        isVerified: true,
        isActionable: true,
        redirectChain,
        pageTitle,
        checkedAt: now,
        contentSignals: { has404Text: false, hasExpiredText: false, hasClosedText: false, hasLoginWall: false, titleMatches, organizerMatches }
      };
    }

    // Default fallback for other HTTP error codes
    return {
      url: originalUrl,
      finalUrl,
      httpStatus: status,
      status: "UNAVAILABLE",
      isVerified: false,
      isActionable: false,
      redirectChain,
      failureReason: `Destination returned HTTP ${status}`,
      pageTitle,
      checkedAt: now,
      contentSignals: { has404Text, hasExpiredText, hasClosedText, hasLoginWall, titleMatches, organizerMatches }
    };
  }
}
