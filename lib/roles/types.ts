/**
 * ROLES & REQUIREMENTS TYPES (Phase 2 Spine)
 * 
 * Maps to roles and role_requirements tables in Drizzle schema.
 */

export type RoleRequirementCategory = "core" | "trainable" | "evaluated" | "context";

export type RequirementOrigin =
  | "llm_proposed"
  | "deterministic"
  | "recruiter_added"
  | "recruiter_edited";

export type RequirementStatus = "active" | "dismissed";

export interface JdSpan {
  startChar: number;
  endChar: number;
  rawSnippet: string;
}

export interface JdRequirement {
  id: string;
  roleId?: string;
  text: string;
  category: RoleRequirementCategory;
  origin: RequirementOrigin;
  jdSpan?: JdSpan;
  status: RequirementStatus;
  version: number;
  createdAt?: string;
}

export interface JdReviewFinding {
  requirementId: string;
  requirementText: string;
  issue: "over_restrictive_niche" | "better_suited_for_validation" | "on_the_job_trainable" | "excessive_tenure_expectation";
  currentCategory: RoleRequirementCategory;
  recommendedCategory: RoleRequirementCategory;
  rationale: string;
}

export interface JdReviewLensResult {
  overRestrictiveCount: number;
  summary: string;
  findings: JdReviewFinding[];
  historicalCaveat?: string;
}

export interface JdIntakeResult {
  roleTitle: string;
  seniority: string;
  hiresTarget: number;
  requirements: JdRequirement[];
  reviewLens: JdReviewLensResult;
}

// ────────────────────────────────────────────────────────────
// SEMANTIC ROLE DNA INTELLIGENCE TYPES
// ────────────────────────────────────────────────────────────

export type SemanticRequirementCategory =
  | "MUST_HAVE"
  | "PREFERRED"
  | "ELIGIBILITY"
  | "RESPONSIBILITY"
  | "EVIDENCE_SIGNAL"
  | "DOMAIN_CONTEXT"
  | "CONSTRAINT"
  | "UNKNOWN";

export type EvidenceTier =
  | "TIER_1_DIRECT"
  | "TIER_2_SUPPORTING"
  | "TIER_3_WEAK_CLAIM";

export type AmbiguityStatus =
  | "CLEAR"
  | "INFERRED"
  | "AMBIGUOUS";

export type RequirementType =
  | "programming_language"
  | "framework"
  | "tool"
  | "domain_knowledge"
  | "education"
  | "experience"
  | "project_experience"
  | "behavioral"
  | "certification"
  | "location"
  | "work_authorization"
  | "competition"
  | "open_source"
  | "deployment"
  | "database"
  | "cloud"
  | "communication"
  | "technical_skill"
  | "soft_skill"
  | "operational_task";

export type ImportanceLevel = "mandatory" | "preferred" | "conditional";

export type EvidenceExpectation = "implementation" | "certification" | "portfolio" | "interview" | "documentation" | "assessment";

export interface SemanticRequirementItem {
  id: string;
  canonical_name: string;
  category: SemanticRequirementCategory;
  subtype:
    | "technical_skill"
    | "soft_skill"
    | "domain_knowledge"
    | "experience_tenure"
    | "education_degree"
    | "work_authorization"
    | "evidence_source"
    | "operational_task"
    | "work_constraint";
  mandatory: boolean;
  confidence: number;
  source_text: string;
  source_section: string;
  rationale: string;
  evidence_signals: string[];
  verification_strategy: string[];
  ambiguity_status: AmbiguityStatus;
  ambiguity_reason?: string;
  related_capabilities?: {
    name: string;
    confidence: number;
    explanation: string;
  }[];

  // Enhanced Role DNA fields (all optional for backward compatibility)
  requirement_type?: RequirementType;
  importance?: ImportanceLevel;
  evidence_expectation?: EvidenceExpectation;
  acceptable_options?: string[];  // For OR relationships: "PyTorch or TensorFlow"
  needs_review?: boolean;
  minimum_experience_years?: number;
  acceptable_fields?: string[];  // For education: "Computer Science, AI/ML, ..."
  graduation_year_min?: number;
  graduation_year_max?: number;
}

// ────────────────────────────────────────────────────────────
// RESPONSIBILITY-TO-CAPABILITY GRAPH TYPES (Decision 1 & Section 6)
// ────────────────────────────────────────────────────────────

export type OwnershipLevel = "assist" | "own" | "lead" | "architect";
export type TaskComplexity = "foundational" | "intermediate" | "advanced" | "mission_critical";

export interface ConnectedCapabilityRequirement {
  capabilityId: string;
  canonicalName: string;
  requiredDepth: "awareness" | "practical_implementation" | "independent_architecture" | "expert_optimization";
  assessmentMethod: "code_execution" | "system_design" | "debugging" | "work_sample" | "targeted_interview";
  importance: "mandatory" | "preferred";
  evidenceSignals: string[];
}

export interface ResponsibilityGraphNode {
  id: string;
  description: string;
  ownershipLevel: OwnershipLevel;
  complexity: TaskComplexity;
  requiredCapabilities: ConnectedCapabilityRequirement[];
  expectedOutcomes: string[];
  deliverables?: string[];
  sourceText: string;
}

export interface AdaptiveRecruiterQuestion {
  id: string;
  category: "business_problem" | "team_context" | "ownership_level" | "seniority_clarification" | "dealbreaker_confirmation";
  question: string;
  contextWhy: string;
  suggestedAnswers?: string[];
  fieldToUpdate: string;
}

export interface RoleDNAStructure {
  roleTitle: string;
  department: string;
  seniority: "Junior" | "Mid-Level" | "Senior" | "Staff" | "Principal";
  targetHires: number;
  workMode?: "Remote" | "Hybrid" | "On-site";
  location?: string;
  domainContext: string[];
  mustHaves: SemanticRequirementItem[];
  preferred: SemanticRequirementItem[];
  eligibility: SemanticRequirementItem[];
  responsibilities: SemanticRequirementItem[];
  evidenceSignals: SemanticRequirementItem[];
  constraints: SemanticRequirementItem[];
  ambiguities: SemanticRequirementItem[];
  responsibilityGraph?: ResponsibilityGraphNode[];
  adaptiveQuestions?: AdaptiveRecruiterQuestion[];
  summary: {
    mustHaveCount: number;
    preferredCount: number;
    eligibilityCount: number;
    responsibilityCount: number;
    evidenceSignalCount: number;
    constraintCount: number;
    ambiguityCount: number;
  };
}

