/**
 * lib/evidence/canonical-types.ts
 * 
 * COGNALYZE CANONICAL EVIDENCE DATA MODEL (Truth Contract Phase 1)
 * 
 * Defines the shared, immutable evidence foundation uniting:
 * - Student DNA (`lib/dna/`)
 * - Source Intelligence Dossier (`lib/evidence/candidate-evidence-engine.ts`)
 * - Claim-Level Verification Engine (`lib/evidence/claim-verification-engine.ts`)
 * - Recruiter Screening & Match Engine (`lib/screening/`)
 * - Decision Room (`lib/decision-room/`)
 * - Interview Arena (`lib/ai/interview-engine.ts`)
 * 
 * Core Architectural Law:
 * 1. An EVIDENCE ITEM is an inspectable artifact, observation, source record, or assessment result.
 * 2. A CLAIM is a statement that may be supported or contradicted by evidence.
 * 3. A VERIFICATION is a documented process establishing what was checked and the exact result.
 * 4. A CONCLUSION is an evaluated interpretation of the evidence.
 * These four concepts must NEVER be collapsed into one.
 */

export type CanonicalSourceType =
  | "github"
  | "resume"
  | "linkedin"
  | "leetcode"
  | "codeforces"
  | "deployment"
  | "certification"
  | "hackathon"
  | "interview"
  | "practical_assessment"
  | "self_declaration";

export type CanonicalVerificationStatus =
  | "VERIFIED"               // Independently verified via source artifact inspection, AST, or test execution
  | "DEMONSTRATED"          // Completed in assessment, interview, or functional project
  | "STUDENT_REPORTED"       // Declared on resume or profile, awaiting independent repository inspection
  | "UNVERIFIED"             // Claim identified, but no supporting implementation found
  | "CONFLICTING"            // Discrepancy observed across sources (e.g. resume vs GitHub)
  | "INACCESSIBLE"           // Source could not be reached (404, auth required, rate limit)
  | "STALE"                  // Evidence was previously verified but has exceeded freshness TTL
  | "NOT_CONNECTED";         // Source category not provided by candidate

export type EvidenceDirectness =
  | "DIRECT_IMPLEMENTATION"  // Source code authored by candidate (functions, components, algorithms)
  | "TEST_ASSERTION"         // Automated test suites verifying functionality
  | "CONFIGURED_DEPENDENCY"  // Dependency declared in manifest (package.json, Cargo.toml)
  | "DOCUMENTED_MENTION"     // Mentioned in README, resume bullet, or project description
  | "ASSESSMENT_RESPONSE"    // Real-time answer or coding output in Interview Arena
  | "THIRD_PARTY_CREDENTIAL"; // Certificate or contest ranking

export interface CanonicalEvidenceItem {
  id: string;                               // Unique immutable UUID (e.g. "ev_12345")
  userId: string;                           // Permanent Student UUID
  sourceId: string;                         // Source identifier (e.g. "gh_repo_owner_name")
  sourceType: CanonicalSourceType;
  sourceUrl?: string;                       // Web/repository URL
  artifactRef?: string;                     // File path, commit SHA, line range, document offset
  commitSha?: string;                       // Git commit SHA if derived from code repository
  verbatimQuote?: string;                   // Verbatim quote, code snippet, or test assertion
  skillId: string;                          // Normalized canonical skill ID (e.g. "python", "react")
  skillName?: string;                       // Human-readable skill name
  category?: string;                        // Taxonomy category (e.g. "Languages", "Backend & APIs")
  claimId?: string;                         // Linked claim ID if supporting a specific claim
  evidenceType: string;                     // Descriptive type (e.g. "source_file", "manifest_dependency")
  strength: number;                         // 0.0 to 1.0 (calibrated strength)
  directness: EvidenceDirectness;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  verificationStatus: CanonicalVerificationStatus;
  verificationMethod: string;               // e.g. "ast_import_parser", "quote_verifier_nfkc", "rest_api"
  verificationTimestamp: string;            // ISO timestamp of verification event
  occurredAt?: string;                      // When candidate committed code or achieved credential
  observedAt: string;                       // When Cognalyze observed the artifact
  contentHash?: string;                     // SHA-256 hash of raw artifact for tamper detection
  metadata?: Record<string, any>;
}

export interface CanonicalClaimRecord {
  id: string;                               // Unique claim ID (e.g. "cl_12345")
  userId: string;
  sourceType: CanonicalSourceType;
  category: "technical_skill" | "project" | "experience" | "education" | "certification" | "achievement";
  statement: string;                        // Exact statement (e.g. "Architected distributed caching with Redis")
  skillId?: string;                         // Associated canonical skill ID
  claimedProficiency?: 1 | 2 | 3 | 4 | 5;
  supportingEvidenceIds: string[];          // Pointers to CanonicalEvidenceItem.id
  contradictingEvidenceIds: string[];       // Pointers to conflicting CanonicalEvidenceItem.id
  status: "SUPPORTED" | "PARTIALLY_SUPPORTED" | "UNVERIFIED" | "CONFLICTING" | "SOURCE_UNAVAILABLE";
  extractedAt: string;
}

export type VerificationLevel = "LEVEL_A_DOCUMENT" | "LEVEL_B_ISSUER_DIRECT" | "LEVEL_C_CRYPTOGRAPHIC";
export type VerificationMethod =
  | "AUTOMATED_CODE_INSPECTION"
  | "ISSUER_DIRECT"
  | "DOCUMENT_AUTHENTICITY"
  | "HUMAN_EXPERT_REVIEW"
  | "CROSS_SOURCE_CORROBORATION";

export interface CanonicalVerificationEvent {
  id: string;
  evidenceId: string;
  claimId?: string;
  verifier: string;                         // e.g. "quote_verifier", "github_tree_inspector", "recruiter_screen"
  method: string | VerificationMethod;
  verificationLevel?: VerificationLevel;
  result: "PASS" | "FAIL" | "PARTIAL" | "UNAVAILABLE";
  attributionConfidence?: number;           // 0.0 to 1.0
  authenticityConfidence?: number;          // 0.0 to 1.0
  auditSignature?: string;                  // SHA-256 tamper-evident hash
  corroborationType?: "INDEPENDENT_CORROBORATION" | "CIRCULAR_SELF_REPORTING" | "SINGLE_SOURCE";
  checkedAt: string;
  details?: string;
  limitations?: string[];
}

export interface CanonicalCapabilityAssessment {
  skillId: string;                          // Canonical ID from CANONICAL_SKILL_TAXONOMY
  skillName: string;
  category: string;
  demonstratedProficiency: 1 | 2 | 3 | 4 | 5; // 1=Familiar, 2=Beginner, 3=Intermediate, 4=Advanced, 5=Strongly Demonstrated
  selfReportedProficiency?: 1 | 2 | 3 | 4 | 5;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  coveragePercent: number;                  // 0-100% of capability requirements evidenced
  freshnessState: "CURRENT" | "RECENT" | "AGING" | "STALE";
  supportingEvidenceIds: string[];
  gapsIdentified: string[];
  lastEvaluated: string;
}

/**
 * Normalizes disparate source status strings into canonical verification status.
 */
export function toCanonicalStatus(rawStatus: string): CanonicalVerificationStatus {
  if (!rawStatus) return "UNVERIFIED";
  const upper = rawStatus.toUpperCase();

  if (upper === "VERIFIED" || upper === "ESTABLISHED" || upper === "INDEPENDENTLY_VERIFIED" || upper === "CONFIRMED") {
    return "VERIFIED";
  }
  if (upper === "DEMONSTRATED" || upper === "OBSERVED" || upper === "CONTENT_RETRIEVED" || upper === "SUPPORTED") {
    return "DEMONSTRATED";
  }
  if (upper === "STUDENT_REPORTED" || upper === "CLAIMED" || upper === "PARTIAL" || upper === "PARTIALLY_SUPPORTED") {
    return "STUDENT_REPORTED";
  }
  if (upper === "CONFLICTING" || upper === "CONFLICTING_EVIDENCE" || upper === "CONTRADICTED") {
    return "CONFLICTING";
  }
  if (upper === "INACCESSIBLE" || upper === "SOURCE_UNAVAILABLE" || upper === "FETCH_FAILED" || upper === "RATE_LIMITED") {
    return "INACCESSIBLE";
  }
  if (upper === "STALE" || upper === "STALE_EVIDENCE") {
    return "STALE";
  }
  if (upper === "NOT_CONNECTED" || upper === "NOT_PROVIDED") {
    return "NOT_CONNECTED";
  }
  return "UNVERIFIED";
}

