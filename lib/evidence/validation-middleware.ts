/**
 * COGNALYZE — EVIDENCE VALIDATION MIDDLEWARE (Section 42 & 45)
 * 
 * Enforces:
 * 1. NO EVIDENCE = NO CLAIM.
 * 2. Unverified identity blocks external attribution.
 * 3. Inaccessible / Fetch Failed sources NEVER convert to negative candidate judgments.
 * 4. Dangerous / ungrounded superlative language ("expert", "best", "fake", "guaranteed") is strictly banned.
 * 5. Structured generation validation before UI rendering.
 */

import { FactClassification, EvidenceMatchState, IdentityResolutionState } from "./types";

export interface ClaimValidationRequest {
  statement: string;
  classification: FactClassification;
  evidenceIds: string[];
  identityStatus?: IdentityResolutionState;
  fetchStatus?: string;
  sourceType?: string;
}

export interface ClaimValidationResult {
  isValid: boolean;
  sanitizedStatement: string;
  status: EvidenceMatchState;
  rejectionReason?: string;
  violatesAbsenceFallacy?: boolean;
}

// Banned hyperbolic / unsupported labels (Section 45 & 61)
const DANGEROUS_WORDS_REGEX = /\b(definitely|certainly|expert|flawless|top-tier|best candidate|worst candidate|fake|cheating|liar|lying|guaranteed|will succeed|will perform well|faang-level)\b/gi;

/**
 * Validates a claim against underlying evidence objects and provenance rules.
 */
export function validateClaimAgainstEvidence(request: ClaimValidationRequest): ClaimValidationResult {
  const { statement, classification, evidenceIds, identityStatus, fetchStatus, sourceType } = request;

  // 1. Technical Fetch Failure Handling (Section 9 & 45)
  if (fetchStatus === "RATE_LIMITED") {
    return {
      isValid: false,
      sanitizedStatement: "Public source was rate-limited during inspection. Verification recommended.",
      status: "RATE_LIMITED",
      rejectionReason: "Source returned rate limit response."
    };
  }

  if (fetchStatus === "AUTH_REQUIRED") {
    return {
      isValid: false,
      sanitizedStatement: "Authentication required to access source. Independent verification recommended.",
      status: "AUTH_REQUIRED",
      rejectionReason: "Source requires authentication."
    };
  }

  if (fetchStatus === "FETCH_FAILED" || fetchStatus === "INACCESSIBLE") {
    return {
      isValid: false,
      sanitizedStatement: "Source is currently inaccessible. Technical limitation recorded without candidate penalty.",
      status: "INACCESSIBLE",
      rejectionReason: "Source inaccessible."
    };
  }

  // 2. Identity Ambiguity Protection (Section 6 & 45)
  if (identityStatus === "AMBIGUOUS" || identityStatus === "UNVERIFIED") {
    return {
      isValid: false,
      sanitizedStatement: "Potential public profile identified, but identity cannot be independently established without risk of misattribution.",
      status: "IDENTITY_AMBIGUOUS",
      rejectionReason: "Identity resolution failed or ambiguous. Evidence must not be attributed to candidate."
    };
  }

  // 3. Absence of Evidence Fallacy Guard (Section 1 & 62)
  // Statements asserting candidate lacks skill or has zero ability based purely on missing data are rejected.
  const isNegativeAssertion = /\b(lacks|has no ability|incompetent|unqualified|failed to learn|no coding ability)\b/i.test(statement);
  if (isNegativeAssertion && evidenceIds.length === 0) {
    return {
      isValid: false,
      sanitizedStatement: "No evidence was identified in the sources currently inspected.",
      status: "EVIDENCE_NOT_FOUND",
      violatesAbsenceFallacy: true,
      rejectionReason: "Negative judgment derived from absence of evidence."
    };
  }

  // 4. Zero Evidence Check (Section 1)
  if (classification === "ASSESSMENT" && (!evidenceIds || evidenceIds.length === 0)) {
    return {
      isValid: false,
      sanitizedStatement: "Currently unverified (insufficient accessible evidence).",
      status: "UNVERIFIED",
      rejectionReason: "Assessment lacks supporting evidence IDs."
    };
  }

  // 5. Dangerous Superlative Language Sanitization
  if (DANGEROUS_WORDS_REGEX.test(statement)) {
    const sanitized = statement.replace(DANGEROUS_WORDS_REGEX, (match) => {
      const lower = match.toLowerCase();
      if (lower === "expert" || lower === "top-tier" || lower === "faang-level") return "experienced";
      if (lower === "fake" || lower === "lying" || lower === "liar") return "unverified";
      return "";
    }).trim();

    return {
      isValid: true,
      sanitizedStatement: sanitized || "Evidence recorded without unsupported superlative claims.",
      status: evidenceIds.length > 0 ? "SUPPORTED" : "CANDIDATE_REPORTED",
      rejectionReason: "Dangerous or ungrounded superlative terms sanitized."
    };
  }

  return {
    isValid: true,
    sanitizedStatement: statement,
    status: evidenceIds.length > 0 ? "SUPPORTED" : "CANDIDATE_REPORTED"
  };
}
