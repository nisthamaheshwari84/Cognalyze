/**
 * lib/dna/contracts.ts
 * COGNALYZE STUDENT DNA — EVIDENCE AND CLAIM DATA CONTRACTS
 * 
 * Formal contracts established in Phase 1 for canonical evidence representation,
 * source connection lifecycles, and claim verification states.
 * 
 * Guarantees zero fabrication, explicit error states, and strict separation between:
 * 1. Source connection state (OAuth/API connection status)
 * 2. Retrieval state (whether raw content was fetched)
 * 3. Inspection state (whether AST/code/text was analyzed)
 * 4. Verification state (whether claim is proven by corroborated evidence)
 */

export type DNASourceConnectionStatus =
  | "NOT_PROVIDED"
  | "NOT_CONNECTED"
  | "PENDING"
  | "RETRIEVAL_FAILED"
  | "CONTENT_RETRIEVED"
  | "EXTRACTION_FAILED"
  | "INSPECTION_PENDING"
  | "INSPECTED"
  | "STALE";

export type DNAClaimStatus =
  | "SELF_REPORTED"
  | "SOURCE_REPORTED"
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "CONFLICTING_EVIDENCE"
  | "NOT_FOUND_IN_INSPECTED_SOURCES"
  | "NOT_INSPECTED"
  | "NOT_ASSESSED"
  | "SOURCE_UNAVAILABLE"
  | "PENDING_VERIFICATION"
  | "INDEPENDENTLY_VERIFIED";

export type DNASourceProviderType =
  | "resume"
  | "github"
  | "linkedin"
  | "leetcode"
  | "codeforces"
  | "hackathon"
  | "certification"
  | "live_deployment"
  | "internal_assessment"
  | "group_discussion"
  | "mock_interview";

export interface SourceArtifactContract {
  sourceType: DNASourceProviderType;
  sourceIdentifier: string; // URL, repo name, handle, or upload ID
  userId: string;
  connectionStatus: DNASourceConnectionStatus;
  lastConnectedAt?: string;
  lastRetrievedAt?: string;
  lastInspectedAt?: string;
  retrievalError?: string;
  rawPayloadSize?: number;
  isStale: boolean;
  metadata?: Record<string, any>;
}

export interface ClaimEvidenceContract {
  claimId: string;
  userId: string;
  claimType: "skill" | "project" | "education" | "experience" | "achievement";
  claimValue: string; // e.g. "Python", "Full-Stack Distributed Chat Engine"
  reportedProficiency?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  learningMethod?: "Self-learned" | "Coursework" | "Bootcamp" | "On-the-job" | "Open Source";
  claimStatus: DNAClaimStatus;
  corroboratingSourceIds: string[];
  conflictingSourceIds?: string[];
  confidenceScore: number; // 0.0 to 1.0
  firstClaimedAt: string;
  lastEvaluatedAt: string;
  notes?: string;
}

export const CANONICAL_CONNECTION_STATUSES: Record<DNASourceConnectionStatus, { label: string; description: string }> = {
  NOT_PROVIDED: { label: "Not Provided", description: "Candidate has not provided a link or credential for this source." },
  NOT_CONNECTED: { label: "Not Connected", description: "Link provided but account has not completed authentication or verification." },
  PENDING: { label: "Sync Pending", description: "Source has been queued for data ingestion." },
  RETRIEVAL_FAILED: { label: "Retrieval Unavailable", description: "Network timeout, rate limit, or private repository access limitation." },
  CONTENT_RETRIEVED: { label: "Content Retrieved", description: "Raw files, commits, or documents successfully fetched." },
  EXTRACTION_FAILED: { label: "Extraction Failed", description: "Document text extraction or parsing failed." },
  INSPECTION_PENDING: { label: "Queued for Inspection", description: "Artifact stored and waiting for semantic/AST analyzer." },
  INSPECTED: { label: "Inspected", description: "Source code, commits, and documents parsed into evidence items." },
  STALE: { label: "Stale / Refresh Needed", description: "Cached data is older than the 14-day freshness window." }
};

export const CANONICAL_CLAIM_STATUSES: Record<DNAClaimStatus, { label: string; badgeVariant: "neutral" | "warning" | "success" | "danger" }> = {
  SELF_REPORTED: { label: "Self-Reported Claim", badgeVariant: "neutral" },
  SOURCE_REPORTED: { label: "Source-Reported", badgeVariant: "neutral" },
  SUPPORTED: { label: "Evidence Supported", badgeVariant: "success" },
  PARTIALLY_SUPPORTED: { label: "Partially Evidenced", badgeVariant: "warning" },
  CONFLICTING_EVIDENCE: { label: "Conflicting Signals", badgeVariant: "danger" },
  NOT_FOUND_IN_INSPECTED_SOURCES: { label: "Not Found in Inspected Repos", badgeVariant: "warning" },
  NOT_INSPECTED: { label: "Uninspected Source", badgeVariant: "neutral" },
  NOT_ASSESSED: { label: "Not Assessed", badgeVariant: "neutral" },
  SOURCE_UNAVAILABLE: { label: "Source Inaccessible", badgeVariant: "warning" },
  PENDING_VERIFICATION: { label: "Verification in Progress", badgeVariant: "neutral" },
  INDEPENDENTLY_VERIFIED: { label: "Independently Verified", badgeVariant: "success" }
};
