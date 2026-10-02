"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";

export interface CompanyLogoProps {
  companyName?: string;
  companyDomain?: string;
  logoUrl?: string;
  source?: string;
  sourceUrl?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface CacheEntry {
  companyDomain: string;
  logoUrl: string;
  fetchedAt: number;
}

// In-memory cache for the browser session
const memoryLogoCache = new Map<string, CacheEntry>();

/**
 * Normalizes company names to avoid duplicate logo entries and strip legal suffixes.
 * Examples:
 *  "Google India" -> "Google"
 *  "Google LLC" -> "Google"
 *  "Microsoft Corporation" -> "Microsoft"
 */
export function normalizeCompanyName(name?: string): string {
  if (!name) return "";
  let clean = name.trim();

  // Strip source platform annotations (e.g., "(via Unstop)", "[Unstop]", etc.)
  clean = clean.replace(/\s*[\(\[][^)\]]*[\)\]]/g, "").trim();

  const lower = clean.toLowerCase();

  // Well-known corporate aliases
  if (lower.startsWith("google")) return "Google";
  if (lower.startsWith("microsoft")) return "Microsoft";
  if (lower.startsWith("flipkart")) return "Flipkart";
  if (lower.startsWith("amazon")) return "Amazon";
  if (lower.startsWith("meta") || lower.startsWith("facebook")) return "Meta";
  if (lower.startsWith("apple")) return "Apple";
  if (lower.startsWith("netflix")) return "Netflix";
  if (lower.startsWith("nvidia")) return "NVIDIA";
  if (lower.startsWith("adobe")) return "Adobe";
  if (lower.startsWith("uber")) return "Uber";
  if (lower.startsWith("salesforce")) return "Salesforce";
  if (lower.startsWith("atlassian")) return "Atlassian";
  if (lower.startsWith("swiggy")) return "Swiggy";
  if (lower.startsWith("zomato")) return "Zomato";
  if (lower.startsWith("razorpay")) return "Razorpay";
  if (lower.startsWith("zoho")) return "Zoho";
  if (lower.startsWith("cred")) return "CRED";
  if (lower.startsWith("goldman sachs")) return "Goldman Sachs";
  if (lower.startsWith("morgan stanley")) return "Morgan Stanley";
  if (lower.startsWith("jp morgan") || lower.startsWith("jpmorgan")) return "JPMorgan Chase";
  if (lower.startsWith("oracle")) return "Oracle";
  if (lower.startsWith("cisco")) return "Cisco";
  if (lower.startsWith("intel")) return "Intel";
  if (lower.startsWith("ibm")) return "IBM";

  // General corporate suffix stripping
  clean = clean
    .replace(
      /\b(private\s+limited|pvt\.?\s*ltd\.?|pvt\.?|ltd\.?|limited|inc\.?|incorporated|corp\.?|corporation|llc|holdings|technologies|solutions|services|group|labs|india|global)\b/gi,
      ""
    )
    .trim();

  clean = clean.replace(/[,.-]+$/, "").trim();
  return clean || name.trim();
}

/**
 * Resolves the official or derived web domain for a company.
 */
export function resolveCompanyDomain(companyName?: string, explicitDomain?: string): string {
  if (explicitDomain && explicitDomain.trim()) {
    let d = explicitDomain.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    return d;
  }

  const norm = normalizeCompanyName(companyName).toLowerCase();
  if (!norm) return "";

  const knownDomains: Record<string, string> = {
    google: "google.com",
    microsoft: "microsoft.com",
    flipkart: "flipkart.com",
    amazon: "amazon.com",
    meta: "meta.com",
    apple: "apple.com",
    netflix: "netflix.com",
    nvidia: "nvidia.com",
    adobe: "adobe.com",
    uber: "uber.com",
    salesforce: "salesforce.com",
    atlassian: "atlassian.com",
    swiggy: "swiggy.com",
    zomato: "zomato.com",
    razorpay: "razorpay.com",
    zoho: "zoho.com",
    cred: "cred.club",
    "goldman sachs": "goldmansachs.com",
    "morgan stanley": "morganstanley.com",
    "jpmorgan chase": "jpmorgan.com",
    oracle: "oracle.com",
    cisco: "cisco.com",
    intel: "intel.com",
    ibm: "ibm.com",
  };

  if (knownDomains[norm]) {
    return knownDomains[norm];
  }

  // Automatic domain derivation for arbitrary companies/startups
  const slug = norm.replace(/[^a-z0-9]/g, "");
  return slug ? `${slug}.com` : "";
}

/**
 * Generates polished initials for fallback avatar.
 * Examples:
 *  "NovaTech" -> "NT"
 *  "Acme AI" -> "AA"
 *  "Microsoft" -> "M"
 *  "Goldman Sachs" -> "GS"
 */
export function generateInitials(companyName?: string): string {
  if (!companyName) return "CO";
  const norm = normalizeCompanyName(companyName);

  // Multi-word names: take first letter of first two words
  const words = norm.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Single word: check camelCase (e.g. NovaTech -> NT)
  const single = words[0] || norm;
  const uppercaseMatches = single.match(/[A-Z]/g);
  if (uppercaseMatches && uppercaseMatches.length >= 2) {
    return (uppercaseMatches[0] + uppercaseMatches[1]).toUpperCase();
  }

  // Single word without camelCase: return first initial
  return single.slice(0, 1).toUpperCase();
}

/**
 * Resolves the primary logo URL following priority rules:
 * 1. Explicit logoUrl
 * 2. Cached logoUrl
 * 3. Official domain high-res favicon service
 */
export function resolveCompanyLogoUrl(companyName?: string, domain?: string, explicitUrl?: string): string | null {
  if (explicitUrl && explicitUrl.trim()) {
    return explicitUrl.trim();
  }

  const resolvedDomain = resolveCompanyDomain(companyName, domain);
  if (!resolvedDomain) return null;

  // Check memory cache
  const cached = memoryLogoCache.get(resolvedDomain);
  if (cached && cached.logoUrl) {
    return cached.logoUrl;
  }

  // Check localStorage cache on browser
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("cognalyze_company_logo_cache");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[resolvedDomain]?.logoUrl) {
          memoryLogoCache.set(resolvedDomain, parsed[resolvedDomain]);
          return parsed[resolvedDomain].logoUrl;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  // Highly reliable, non-scraping Google Favicon CDN for official company domain
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(resolvedDomain)}&sz=128`;
}

/**
 * Reusable Dynamic Company Logo Resolver
 */
export default function CompanyLogo({
  companyName,
  companyDomain,
  logoUrl,
  source,
  sourceUrl,
  size = 36,
  className = "",
  style = {},
}: CompanyLogoProps) {
  const { isDark } = useTheme();
  const [imgError, setImgError] = useState(false);

  const normalizedName = useMemo(() => normalizeCompanyName(companyName), [companyName]);
  const domain = useMemo(() => resolveCompanyDomain(companyName, companyDomain), [companyName, companyDomain]);
  const targetLogoUrl = useMemo(
    () => resolveCompanyLogoUrl(companyName, domain, logoUrl),
    [companyName, domain, logoUrl]
  );

  const initials = useMemo(() => generateInitials(companyName), [companyName]);

  // Persist resolved logo in cache when successfully loaded
  const handleImageLoad = () => {
    if (domain && targetLogoUrl && typeof window !== "undefined") {
      const entry: CacheEntry = {
        companyDomain: domain,
        logoUrl: targetLogoUrl,
        fetchedAt: Date.now(),
      };
      memoryLogoCache.set(domain, entry);
      try {
        const raw = localStorage.getItem("cognalyze_company_logo_cache");
        const cacheObj = raw ? JSON.parse(raw) : {};
        cacheObj[domain] = entry;
        localStorage.setItem("cognalyze_company_logo_cache", JSON.stringify(cacheObj));
      } catch {
        // storage quota or private browsing
      }
    }
  };

  const handleImageError = () => {
    setImgError(true);
  };

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.max(6, Math.floor(size * 0.2)),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    position: "relative",
    backgroundColor: isDark ? "#13243A" : "#F6F5F1",
    border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
    transition: "all 0.15s ease",
    ...style,
  };

  if (!targetLogoUrl || imgError) {
    // Polished Initials Fallback
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          backgroundColor: isDark ? "#13243A" : "#EEF4FD",
          borderColor: isDark ? "#2A435F" : "#D1E2FB",
          color: isDark ? "#F2F6FC" : "#356AE6",
          fontWeight: 700,
          fontSize: Math.max(10, Math.floor(size * 0.38)),
          letterSpacing: "-0.5px",
          userSelect: "none",
        }}
        title={normalizedName || "Company"}
        aria-label={normalizedName || "Company Logo"}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        ...containerStyle,
        padding: Math.max(3, Math.floor(size * 0.1)),
      }}
      title={normalizedName || "Company"}
    >
      <img
        src={targetLogoUrl}
        alt={normalizedName ? `${normalizedName} logo` : "Company logo"}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: Math.max(4, Math.floor(size * 0.15)),
        }}
        loading="lazy"
      />
    </div>
  );
}

export { CompanyLogo };
