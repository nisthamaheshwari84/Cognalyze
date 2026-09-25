/**
 * COGNALYZE — EVIDENCE-FIRST HIRING INTELLIGENCE ENGINE
 * Core Data Models & Provenance Types
 */

// ============================================================================
// Core Evidence Pipeline Contract (Sections 1-6)
// ============================================================================

export type EvidenceSourceType =
  | "resume_text"
  | "jd_text"
  | "github_repo"
  | "github_commit_stats"
  | "leetcode_stats"
  | "hackathon_submission"
  | "interview_transcript";

export interface Evidence {
  id: string; // stable id, e.g. "ev_resume_0007"
  source_type: EvidenceSourceType;
  source_ref: string; // e.g. "resume.txt:L34-L36", "github.com/user/repo#commit_history", "transcript:00:12:03"
  quote_or_fact: string; // exact extracted fact, NOT paraphrase — short, verifiable
  extracted_at: string; // ISO timestamp
}

export type CriterionVerdict = "met" | "not_met" | "partial" | "insufficient_evidence";

export interface CriterionResult {
  criterion: string; // e.g. "2+ years React experience"
  verdict: CriterionVerdict;
  evidence_ids: string[]; // MUST reference real Evidence.id values. Empty array only allowed if verdict is "insufficient_evidence".
  reasoning: string; // one line, plain language, must only restate the evidence, not add new claims
}

export interface CandidateDecision {
  candidate_id: string;
  stage: "resume_jd_match" | "github_review" | "deep_review" | "final_selection";
  outcome: "advance" | "reject" | "hold";
  criteria_results: CriterionResult[];
  overall_confidence: "high" | "medium" | "low"; // derived from % of criteria with real evidence vs insufficient_evidence
  rejection_summary?: string; // human-readable, built FROM criteria_results, never freeform
  created_at: string;
}

// Validation helper — every agent output MUST pass this before being saved or shown to a recruiter.
export function validateCandidateDecision(
  decision: CandidateDecision,
  evidencePool: Evidence[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validIds = new Set(evidencePool.map((e) => e.id));

  for (const cr of decision.criteria_results) {
    if (cr.verdict !== "insufficient_evidence" && cr.evidence_ids.length === 0) {
      errors.push(
        `Criterion "${cr.criterion}" has verdict "${cr.verdict}" but no evidence_ids — not allowed.`
      );
    }
    for (const id of cr.evidence_ids) {
      if (!validIds.has(id)) {
        errors.push(`Criterion "${cr.criterion}" references unknown evidence id "${id}".`);
      }
    }
  }

  if (decision.criteria_results.length === 0) {
    errors.push("Decision has zero criteria_results — cannot be evidence-based.");
  }

  return { valid: errors.length === 0, errors };
}

// Confidence is computed, never asserted by the LLM directly.
export function computeConfidence(criteria: CriterionResult[]): "high" | "medium" | "low" {
  if (criteria.length === 0) return "low";
  const insufficient = criteria.filter((c) => c.verdict === "insufficient_evidence").length;
  const ratio = insufficient / criteria.length;
  if (ratio === 0) return "high";
  if (ratio <= 0.3) return "medium";
  return "low";
}

// ============================================================================
// Extended Dossier & Platform Spine Models
// ============================================================================

// 1. Fact Classification System (Section 2)
export type FactClassification =
  | "SOURCE_FACT"
  | "DERIVED_FACT"
  | "CANDIDATE_REPORTED"
  | "ASSESSMENT"
  | "UNKNOWN"
  | "AMBIGUITY"
  | "CONTRADICTION"
  | "SYSTEM_EVENT"
  | "RECRUITER_INPUT"
  | "CANDIDATE_STATEMENT";

// 2. Controlled 17 Evidence Match States (Section 4)
export type EvidenceMatchState =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "CANDIDATE_REPORTED"
  | "CORROBORATED"
  | "PARTIALLY_CORROBORATED"
  | "UNVERIFIED"
  | "EVIDENCE_NOT_FOUND"
  | "INACCESSIBLE"
  | "FETCH_FAILED"
  | "RATE_LIMITED"
  | "AUTH_REQUIRED"
  | "PARSER_FAILED"
  | "IDENTITY_AMBIGUOUS"
  | "IDENTITY_UNVERIFIED"
  | "CONFLICTING"
  | "NEEDS_HUMAN_REVIEW"
  | "NOT_APPLICABLE";

// 3. Source Hierarchy (Section 5)
export type SourceHierarchyLevel =
  | "LEVEL_1_CANDIDATE_REPORTED"
  | "LEVEL_2_PUBLIC_SOURCE"
  | "LEVEL_3_CORROBORATED"
  | "LEVEL_4_IMPLEMENTATION_EVIDENCE"
  | "LEVEL_5_HUMAN_VERIFIED";

// 4. Identity Resolution State (Section 6)
export type IdentityResolutionState =
  | "VERIFIED"
  | "PROBABLE"
  | "AMBIGUOUS"
  | "UNVERIFIED";

// 5. Technical Depth Levels (Section 24)
export type TechnicalDepthLevel =
  | "MENTIONED"
  | "CONFIGURED"
  | "IMPLEMENTED"
  | "TESTED"
  | "INTEGRATED"
  | "DEPLOYED"
  | "ITERATED";

// 6. Funnel Stages (Section 15)
export type FunnelStageId =
  | "APPLICATION"
  | "INITIAL_EVIDENCE_REVIEW"
  | "DEEP_EVIDENCE_REVIEW"
  | "DECISION_ROOM"
  | "RECRUITER_REVIEW"
  | "INTERVIEW"
  | "FINAL_DECISION";

// 7. Decision Sources (Section 18)
export type ProgressionDecisionSource =
  | "COGNALYZE_ASSISTED"
  | "RECRUITER_DECISION"
  | "CONFIGURED_WORKFLOW"
  | "ASSESSMENT_RESULT"
  | "CANDIDATE_ACTION"
  | "SYSTEM_EVENT";

// 8. Source Category
export type SourceCategory =
  | "PRIMARY_RESUME"
  | "PUBLIC_GITHUB"
  | "PUBLIC_CODING_PROFILE"
  | "PUBLIC_HACKATHON"
  | "PUBLIC_PORTFOLIO"
  | "PROFESSIONAL_SOURCE"
  | "ACADEMIC_SOURCE"
  | "INTERVIEW_SOURCE"
  | "RECRUITER_OBSERVATION";

// ─────────────────────────────────────────────────────────────
// Entity Interfaces
// ─────────────────────────────────────────────────────────────

export interface EvidenceSource {
  sourceId: string;
  candidateId: string;
  category: SourceCategory;
  name: string;
  url?: string;
  identifier?: string;
  isCandidateProvided: boolean;
  retrievalStatus:
    | "SUCCESS"
    | "PARTIAL_SUCCESS"
    | "RATE_LIMITED"
    | "AUTH_REQUIRED"
    | "FETCH_FAILED"
    | "PARSER_FAILED"
    | "INACCESSIBLE"
    | "UNAVAILABLE"
    | "IDENTITY_AMBIGUOUS";
  errorMessage?: string;
  identityStatus: IdentityResolutionState;
  identityReason: string;
  retrievedAt: string;
  lastCheckedAt: string;
  sourceVersion: number;
}

export interface EvidenceItem {
  evidenceId: string;
  candidateId: string;
  sourceId: string;
  sourceType: SourceCategory;
  sourceUrl?: string;
  sourceTitle: string;
  retrievedAt: string;
  classification: FactClassification;
  hierarchyLevel: SourceHierarchyLevel;
  evidenceStatus: EvidenceMatchState;
  verbatimSnippet: string;
  structuredObservation: string;
  sourceLocation: string; // e.g. "resume.pdf p.1:Experience", "github.com/repo/backend/server.py:L14"
  evidenceVersion: number;
}

export interface ClaimRecord {
  claimId: string;
  candidateId: string;
  claimText: string;
  claimType: "TECHNICAL_EXPERIENCE" | "PROJECT_OWNERSHIP" | "PRODUCTION_SCALE" | "EMPLOYMENT_DURATION" | "EDUCATION";
  sourceIds: string[];
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  status: EvidenceMatchState;
  whatItSupports: string;
  whatItDoesNotEstablish: string[];
  verificationNeed?: string;
  suggestedInterviewQuestion?: string;
}

export interface ProjectForensicItem {
  projectId: string;
  candidateId: string;
  name: string;
  claimedDescription: string;
  repositoryUrl?: string;
  deploymentUrl?: string;
  technologies: {
    name: string;
    depth: TechnicalDepthLevel;
    evidenceSnippet: string;
    sourceFile?: string;
  }[];
  architecturePatterns: string[];
  testSuiteEvidence?: {
    hasTests: boolean;
    framework?: string;
    testFilesCount: number;
    ciConfigured: boolean;
  };
  deploymentEvidence?: {
    hasDocker: boolean;
    hasKubernetes: boolean;
    hasCiCd: boolean;
    manifestFiles: string[];
  };
  developmentHistory: {
    totalCommits: number;
    activeSpanMonths: number;
    isIncremental: boolean;
    hasRefactoring: boolean;
    hasBugFixCommits: boolean;
  };
  ownershipAnalysis: {
    isTeamProject: boolean;
    contributorsCount: number;
    candidateCommitsRatio?: number;
    attributedComponents: string[];
    unknownOwnershipComponents: string[];
    verificationNote?: string;
  };
  aiAssistanceAnalysis: {
    indicatorsDetected: string[];
    counterSignals: string[];
    summary: string;
  };
}

export interface CandidateRequirementMapping {
  requirementId: string;
  requirementText: string;
  category: "required" | "preferred" | "experience" | "education" | "eligibility" | "other";
  isBlocking: boolean;
  status: EvidenceMatchState;
  candidateEvidenceIds: string[];
  summaryClaim: string;
  whatItSupports: string;
  whatItDoesNotEstablish: string[];
  verificationNeeded?: string;
  suggestedQuestion?: string;
}

export interface StageTransitionRecord {
  transitionId: string;
  candidateId: string;
  roleId: string;
  roleVersion: number;
  fromStage: FunnelStageId;
  toStage: FunnelStageId;
  requirementsEvaluated: string[];
  evidenceIds: string[];
  reasonCode: string;
  reasonText: string;
  decisionSource: ProgressionDecisionSource;
  actorType: "SYSTEM" | "RECRUITER";
  actorId: string;
  timestamp: string;
  evidenceVersion: number;
}

export interface RecruiterDecisionRecord {
  decisionId: string;
  candidateId: string;
  roleId: string;
  roleVersion: number;
  evidenceVersion: number;
  systemRecommendation: string;
  recruiterAction: "ADVANCE" | "HOLD" | "REJECT" | "REQUEST_VERIFICATION";
  recruiterReason: string;
  isOverride: boolean;
  overrideJustification?: string;
  evidenceSnapshotHash: string;
  timestamp: string;
  actorId: string;
}
