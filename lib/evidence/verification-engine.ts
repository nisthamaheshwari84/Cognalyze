/**
 * lib/evidence/verification-engine.ts
 * 
 * COGNALYZE EVIDENCE VERIFICATION ENGINE (Phase 3 Core Architecture)
 * 
 * Rules:
 * 1. Source Authenticity & Anti-Spoofing: Verifies domains, flags phishing/typosquatting, prevents SSRF.
 * 2. Author Attribution (Scenario 6 & 11): Differentiates solo, team contributor, uncertain (<15%),
 *    fork without contributions, and template clones.
 * 3. Verification Hierarchy: Level A (Document Inspection) vs Level B (Issuer/API Direct) vs Level C (Cryptographic).
 * 4. Cross-Source Corroboration: Differentiates genuine multi-source corroboration from circular self-reporting.
 * 5. Tamper-Evident Audit Signatures: Generates deterministic SHA-256 audit hashes for every verification event.
 */

import crypto from "crypto";
import {
  CanonicalSourceType,
  CanonicalVerificationEvent,
  CanonicalVerificationStatus,
  VerificationLevel,
  VerificationMethod,
} from "./canonical-types";

// ─── 1. CONSTANTS & DOMAIN REGISTRIES ───

export const RECOGNIZED_CODE_PLATFORMS = new Set([
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "sourceforge.net",
]);

export const RECOGNIZED_ASSESSMENT_PLATFORMS = new Set([
  "leetcode.com",
  "hackerrank.com",
  "codeforces.com",
  "kaggle.com",
  "codewars.com",
]);

export const RECOGNIZED_CREDENTIAL_ISSUERS = new Set([
  "coursera.org",
  "udemy.com",
  "credly.com",
  "edx.org",
  "aws.training",
  "learn.microsoft.com",
  "cloud.google.com",
  "badgr.com",
  "datacamp.com",
]);

export const SUSPICIOUS_DOMAIN_PATTERNS = [
  /g1thub/i,
  /git-hub/i,
  /githhub/i,
  /linked1n/i,
  /linkdin/i,
  /leetc0de/i,
  /coursera-verify/i,
  /credential-check-online/i,
  /fake-cert/i,
];

// ─── 2. TYPES & CONTRACTS ───

export type SourceAuthorityLevel =
  | "RECOGNIZED_PLATFORM"
  | "VERIFIED_ISSUER"
  | "UNVERIFIED_THIRD_PARTY"
  | "SUSPICIOUS_DOMAIN"
  | "BLOCKED_SSRF";

export interface SourceAuthenticityResult {
  isAuthentic: boolean;
  issuerAuthorityLevel: SourceAuthorityLevel;
  confidenceScore: number;
  riskFactors: string[];
  canonicalDomain: string;
  isSsrfSafe: boolean;
}

export type AuthorAttributionStatus =
  | "PRIMARY_AUTHOR"
  | "VERIFIED_CONTRIBUTOR"
  | "UNCERTAIN_ATTRIBUTION"
  | "FORK_WITHOUT_CONTRIBUTIONS"
  | "TEMPLATE_CLONE_DETECTED";

export interface AuthorAttributionInput {
  candidateId: string;
  candidateUsername?: string;
  repoOwner: string;
  repoName: string;
  isFork: boolean;
  isTemplate?: boolean;
  candidateCommitsCount: number;
  totalTeamCommits: number;
  hasCandidateOriginalCommits: boolean;
  prsAuthoredCount?: number;
  linesAddedCount?: number;
}

export interface AuthorAttributionResult {
  attributionStatus: AuthorAttributionStatus;
  authorshipRatio: number;
  attributionConfidence: number; // 0.0 to 1.0
  rationale: string;
  flags: string[];
}

export interface VerificationHierarchyResult {
  level: VerificationLevel;
  maxConfidence: number;
  description: string;
}

export interface CorroborationEvaluationResult {
  corroborationType: "INDEPENDENT_CORROBORATION" | "CIRCULAR_SELF_REPORTING" | "SINGLE_SOURCE";
  independentSourcesCount: number;
  selfDeclaredSourcesCount: number;
  confidenceBonus: number;
  rationale: string;
}

// ─── 3. SOURCE AUTHENTICITY & ANTI-SPOOFING ───

/**
 * Validates domain authenticity, anti-spoofing patterns, and SSRF defenses.
 */
export function evaluateSourceAuthenticity(
  urlOrDomain: string,
  candidateIdentity?: { name?: string; handle?: string }
): SourceAuthenticityResult {
  const riskFactors: string[] = [];

  if (!urlOrDomain || typeof urlOrDomain !== "string") {
    return {
      isAuthentic: false,
      issuerAuthorityLevel: "UNVERIFIED_THIRD_PARTY",
      confidenceScore: 0.0,
      riskFactors: ["Empty or invalid URL provided"],
      canonicalDomain: "",
      isSsrfSafe: false,
    };
  }

  const trimmed = urlOrDomain.trim();

  // 1. SSRF & Loopback/Private IP Defense
  const isLoopbackOrPrivate =
    /^(?:https?:\/\/)?(?:127\.\d+\.\d+\.\d+|localhost|0\.0\.0\.0|169\.254\.169\.254|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(?::\d+)?(?:\/|$)/i.test(
      trimmed
    );

  if (isLoopbackOrPrivate) {
    return {
      isAuthentic: false,
      issuerAuthorityLevel: "BLOCKED_SSRF",
      confidenceScore: 0.0,
      riskFactors: ["Target URL resolves to private loopback or cloud metadata address (SSRF blocked)"],
      canonicalDomain: "private_network",
      isSsrfSafe: false,
    };
  }

  // 2. Extract hostname
  let hostname = "";
  try {
    const urlObj = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    hostname = urlObj.hostname.toLowerCase();
  } catch {
    return {
      isAuthentic: false,
      issuerAuthorityLevel: "UNVERIFIED_THIRD_PARTY",
      confidenceScore: 0.0,
      riskFactors: ["Malformed URL syntax"],
      canonicalDomain: "",
      isSsrfSafe: false,
    };
  }

  // Strip leading www.
  const cleanDomain = hostname.replace(/^www\./, "");

  // 3. Phishing & Typosquatting Detection
  for (const pattern of SUSPICIOUS_DOMAIN_PATTERNS) {
    if (pattern.test(cleanDomain)) {
      riskFactors.push(`Domain matches known suspicious or typosquatted pattern: ${pattern.source}`);
      return {
        isAuthentic: false,
        issuerAuthorityLevel: "SUSPICIOUS_DOMAIN",
        confidenceScore: 0.0,
        riskFactors,
        canonicalDomain: cleanDomain,
        isSsrfSafe: true,
      };
    }
  }

  // 4. Recognized Platform Authorities
  if (RECOGNIZED_CODE_PLATFORMS.has(cleanDomain) || RECOGNIZED_ASSESSMENT_PLATFORMS.has(cleanDomain)) {
    // Identity verification check
    if (candidateIdentity?.handle) {
      const normalizedHandle = candidateIdentity.handle.toLowerCase();
      const pathParts = trimmed.split("/").filter(Boolean);
      const urlHasHandle = pathParts.some((p) => p.toLowerCase() === normalizedHandle);
      if (!urlHasHandle && cleanDomain === "github.com") {
        riskFactors.push(`GitHub profile path does not match candidate handle '${candidateIdentity.handle}'`);
      }
    }

    return {
      isAuthentic: true,
      issuerAuthorityLevel: "RECOGNIZED_PLATFORM",
      confidenceScore: riskFactors.length === 0 ? 0.95 : 0.70,
      riskFactors,
      canonicalDomain: cleanDomain,
      isSsrfSafe: true,
    };
  }

  if (RECOGNIZED_CREDENTIAL_ISSUERS.has(cleanDomain)) {
    return {
      isAuthentic: true,
      issuerAuthorityLevel: "VERIFIED_ISSUER",
      confidenceScore: 0.90,
      riskFactors: [],
      canonicalDomain: cleanDomain,
      isSsrfSafe: true,
    };
  }

  // Generic / Custom domain (e.g. personal portfolio or enterprise website)
  return {
    isAuthentic: true,
    issuerAuthorityLevel: "UNVERIFIED_THIRD_PARTY",
    confidenceScore: 0.50,
    riskFactors: ["Issuer domain is not in the recognized registry; requires Level A inspection"],
    canonicalDomain: cleanDomain,
    isSsrfSafe: true,
  };
}

// ─── 4. AUTHOR ATTRIBUTION SCORING (SCENARIOS 6 & 11) ───

/**
 * Evaluates candidate code ownership, authorship ratio, team contributions, forks, and template clones.
 */
export function evaluateAuthorAttribution(input: AuthorAttributionInput): AuthorAttributionResult {
  const flags: string[] = [];
  const totalCommits = Math.max(0, input.totalTeamCommits);
  const candidateCommits = Math.max(0, input.candidateCommitsCount);

  // 1. Fork Without Contributions Check (Scenario 11)
  if (input.isFork && !input.hasCandidateOriginalCommits) {
    flags.push("FORK_NO_ORIGINAL_COMMITS");
    return {
      attributionStatus: "FORK_WITHOUT_CONTRIBUTIONS",
      authorshipRatio: 0.0,
      attributionConfidence: 0.0,
      rationale: "Repository is an upstream fork with zero verified candidate original commits.",
      flags,
    };
  }

  // 2. Template / Boilerplate Clone Check
  if (input.isTemplate && candidateCommits <= 1) {
    flags.push("TEMPLATE_CLONE_MINIMAL_COMMITS");
    return {
      attributionStatus: "TEMPLATE_CLONE_DETECTED",
      authorshipRatio: totalCommits > 0 ? candidateCommits / totalCommits : 0.05,
      attributionConfidence: 0.1,
      rationale: "Repository appears to be a cloned template or starter boilerplate with minimal novel commits.",
      flags,
    };
  }

  // 3. Team Repository Attribution (Scenario 6)
  const isTeam = totalCommits > candidateCommits && totalCommits > 1;

  if (isTeam) {
    const authorshipRatio = totalCommits > 0 ? candidateCommits / totalCommits : 0;
    const roundedRatio = Math.round(authorshipRatio * 1000) / 1000;

    // Below 15% threshold without confirmed PRs
    const prCount = input.prsAuthoredCount || 0;
    if (authorshipRatio < 0.15 && prCount === 0) {
      flags.push("LOW_COMMIT_RATIO_TEAM_PROJECT", "UNCERTAIN_ATTRIBUTION");
      return {
        attributionStatus: "UNCERTAIN_ATTRIBUTION",
        authorshipRatio: roundedRatio,
        attributionConfidence: Math.max(0.15, Math.round(authorshipRatio * 100) / 100),
        rationale: `Candidate authored ${candidateCommits} of ${totalCommits} commits (${(authorshipRatio * 100).toFixed(1)}%) in a team repository without verified merged PRs.`,
        flags,
      };
    }

    // Substantive Contributor
    const confidence = Math.min(0.95, Math.round((0.45 + (authorshipRatio * 0.55)) * 100) / 100);
    flags.push("VERIFIED_TEAM_CONTRIBUTOR");
    return {
      attributionStatus: "VERIFIED_CONTRIBUTOR",
      authorshipRatio: roundedRatio,
      attributionConfidence: confidence,
      rationale: `Candidate demonstrates verified contributor role (${(authorshipRatio * 100).toFixed(1)}% commit share) in a team repository.`,
      flags,
    };
  }

  // 4. Solo / Primary Author
  flags.push("PRIMARY_AUTHOR_CONFIRMED");
  return {
    attributionStatus: "PRIMARY_AUTHOR",
    authorshipRatio: 1.0,
    attributionConfidence: 1.0,
    rationale: "Candidate is the primary author of the repository.",
    flags,
  };
}

// ─── 5. VERIFICATION HIERARCHY (LEVEL A, B, C) ───

/**
 * Classifies verification into Document Inspection (Level A), Direct Platform API (Level B),
 * or Cryptographic / Verifiable Credential (Level C).
 */
export function classifyVerificationHierarchy(input: {
  sourceType: CanonicalSourceType;
  isDirectPlatformApi?: boolean;
  isCryptographicCredential?: boolean;
  hasDocumentMetadataOnly?: boolean;
}): VerificationHierarchyResult {
  if (input.isCryptographicCredential) {
    return {
      level: "LEVEL_C_CRYPTOGRAPHIC",
      maxConfidence: 1.0,
      description: "Cryptographically verified credential with digital signature or tamper-evident hash proof.",
    };
  }

  if (
    input.isDirectPlatformApi ||
    input.sourceType === "github" ||
    input.sourceType === "leetcode" ||
    input.sourceType === "interview" ||
    input.sourceType === "practical_assessment"
  ) {
    return {
      level: "LEVEL_B_ISSUER_DIRECT",
      maxConfidence: 0.90,
      description: "Direct platform verification via authenticated API, live code tree inspection, or interactive evaluation.",
    };
  }

  return {
    level: "LEVEL_A_DOCUMENT",
    maxConfidence: 0.65,
    description: "Document inspection based on candidate-provided resume, unverified link, or claimed profile metadata.",
  };
}

// ─── 6. CROSS-SOURCE CORROBORATION EVALUATION ───

/**
 * Differentiates independent multi-source corroboration from circular self-reporting.
 */
export function evaluateCrossSourceCorroboration(sources: CanonicalSourceType[]): CorroborationEvaluationResult {
  const independentTypes = new Set<CanonicalSourceType>([
    "github",
    "leetcode",
    "codeforces",
    "deployment",
    "practical_assessment",
    "interview",
  ]);

  const selfDeclaredTypes = new Set<CanonicalSourceType>([
    "resume",
    "linkedin",
    "self_declaration",
  ]);

  const uniqueSources = Array.from(new Set(sources));
  let indCount = 0;
  let selfCount = 0;

  for (const s of uniqueSources) {
    if (independentTypes.has(s)) indCount++;
    if (selfDeclaredTypes.has(s)) selfCount++;
    if (s === "certification" || s === "hackathon") indCount++;
  }

  if (indCount >= 2 || (indCount >= 1 && selfCount >= 1)) {
    return {
      corroborationType: "INDEPENDENT_CORROBORATION",
      independentSourcesCount: indCount,
      selfDeclaredSourcesCount: selfCount,
      confidenceBonus: 0.20,
      rationale: `Independently corroborated across ${uniqueSources.length} distinct source types including verified artifacts.`,
    };
  }

  if (selfCount > 1 && indCount === 0) {
    return {
      corroborationType: "CIRCULAR_SELF_REPORTING",
      independentSourcesCount: 0,
      selfDeclaredSourcesCount: selfCount,
      confidenceBonus: 0.0,
      rationale: "Claim was re-declared across multiple documents (e.g. resume and LinkedIn) without external corroboration.",
    };
  }

  return {
    corroborationType: "SINGLE_SOURCE",
    independentSourcesCount: indCount,
    selfDeclaredSourcesCount: selfCount,
    confidenceBonus: 0.0,
    rationale: "Single source observation without secondary corroboration.",
  };
}

// ─── 7. IMMUTABLE VERIFICATION EVENT CREATOR ───

/**
 * Generates an immutable CanonicalVerificationEvent with a deterministic SHA-256 audit signature.
 */
export function createCanonicalVerificationEvent(params: {
  eventId?: string;
  claimId?: string;
  evidenceId: string;
  verifier: string;
  method: VerificationMethod | string;
  verificationLevel: VerificationLevel;
  result: "PASS" | "FAIL" | "PARTIAL" | "UNAVAILABLE";
  attributionConfidence?: number;
  authenticityConfidence?: number;
  corroborationType?: "INDEPENDENT_CORROBORATION" | "CIRCULAR_SELF_REPORTING" | "SINGLE_SOURCE";
  details?: string;
  limitations?: string[];
}): CanonicalVerificationEvent {
  const checkedAt = new Date().toISOString();
  const eventId = params.eventId || `ve_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  // Deterministic audit signature over core verification properties
  const payloadToSign = [
    eventId,
    params.claimId || "",
    params.evidenceId,
    params.verifier,
    params.method,
    params.verificationLevel,
    params.result,
    checkedAt,
  ].join("::");

  const auditSignature = crypto.createHash("sha256").update(payloadToSign).digest("hex");

  return {
    id: eventId,
    evidenceId: params.evidenceId,
    claimId: params.claimId,
    verifier: params.verifier,
    method: params.method,
    verificationLevel: params.verificationLevel,
    result: params.result,
    attributionConfidence: params.attributionConfidence ?? 1.0,
    authenticityConfidence: params.authenticityConfidence ?? 1.0,
    auditSignature,
    corroborationType: params.corroborationType,
    checkedAt,
    details: params.details,
    limitations: params.limitations,
  };
}

