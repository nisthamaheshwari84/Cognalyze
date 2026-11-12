/**
 * lib/recruitment/types.ts
 * 
 * Core Type Definitions for the Cognalyze Recruitment Arena.
 * Shared between Student Mode and Recruiter Mode.
 */

export type ConfidenceLevel = "VERIFIED" | "REPORTED" | "INFERRED" | "UNKNOWN" | "HISTORICAL";

export type VerificationStatus = "APPROVED" | "PENDING_REVIEW" | "DEPRECATED";

export type HiringChannel =
  | "campus"
  | "off_campus"
  | "internship"
  | "experienced"
  | "lateral"
  | "graduate_scheme";

export type RoleFamily =
  | "sde"
  | "frontend_engineer"
  | "backend_engineer"
  | "fullstack_engineer"
  | "ai_ml"
  | "ai_ml_engineer"
  | "data_scientist"
  | "data_engineer"
  | "data_analyst"
  | "devops_cloud_engineer"
  | "cybersecurity_engineer"
  | "qa_sdet"
  | "product_manager"
  | "business_analyst"
  | "quantitative_analyst"
  | "ui_ux_engineer"
  | "custom";

export type CompanyTierCategory =
  | "TIER_1_FAANG"
  | "HIGH_GROWTH_PRODUCT"
  | "ENTERPRISE_SERVICE"
  | "FINTECH_GLOBAL"
  | "UNICORN_STARTUP"
  | "EARLY_STAGE_STARTUP"
  | "GLOBAL_CONSULTING"
  | "MID_MARKET_ENTERPRISE";

export type CanonicalStageType =
  | "application_screening"
  | "resume_screening"
  | "eligibility_verification"
  | "quantitative_aptitude"
  | "logical_reasoning"
  | "verbal_ability"
  | "algorithmic_coding"
  | "core_computer_science"
  | "sql_database"
  | "code_debugging"
  | "work_simulation"
  | "case_study"
  | "group_discussion"
  | "technical_interview_dsa"
  | "technical_interview_project"
  | "system_design_lld"
  | "system_design_hld"
  | "ai_ml_interview"
  | "behavioral_competency"
  | "managerial_interview"
  | "holistic_verdict";

export type AssessmentFormat =
  | "coding"
  | "aptitude"
  | "sql"
  | "case_study"
  | "peer_discussion"
  | "interview"
  | "document_review"
  | "work_simulation"
  | "communication_assessment";

export interface ResearchClaim {
  id: string;
  companyId: string;
  roleFamily: RoleFamily;
  country: string;
  hiringChannel: HiringChannel;
  stageOrder: number;
  stageName: string;
  stageType: CanonicalStageType;
  formatDescription: string;
  durationMinutes: number;
  evaluationFocus: string[];
  sourceUrl: string;
  sourceType:
    | "official_careers_site"
    | "official_interview_guide"
    | "placement_cell_circular"
    | "verified_candidate_report";
  publishedDate?: string;
  lastVerifiedDate: string;
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
}

export interface BlueprintStageDefinition {
  id: string;
  stageType: CanonicalStageType;
  title: string;
  order: number;
  durationMinutes: number;
  dependsOn: string[]; // List of predecessor stage IDs that must be completed first
  isOptional: boolean;
  formatDescription: string;
  assessmentFormat: AssessmentFormat;
  evaluationCriteria: string[];
  targetCompetencies: string[];
  passingThresholdScore?: number;
  instructions: string;
  config?: Record<string, any>;
}

export interface RecruitmentBlueprint {
  id: string;
  companyId: string;
  roleFamily: RoleFamily;
  hiringChannel: HiringChannel;
  country: string;
  version: string;
  isPublished: boolean;
  title: string;
  overview: string;
  stages: BlueprintStageDefinition[];
  competencyRubric: Record<string, { weight: number; description: string }>;
  verifiedSources: ResearchClaim[];
  lastVerifiedDate: string;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  domain?: string;
  tierCategory: CompanyTierCategory;
  headquarters: string;
  regionalOffices?: string[];
  overview: string;
  officialCareersUrl: string;
  supportedRoleFamilies: RoleFamily[];
  supportedChannels: HiringChannel[];
  hiringGeographies?: string[];
  competencyFrameworkId?: string;
  isCustomCompany?: boolean;
  discoveredAt?: string;
  confidenceScore?: number;
}

export interface CompetencyPrinciple {
  id: string;
  name: string;
  definition: string;
  positiveIndicators: string[];
  negativeIndicators: string[];
  sampleProbingQuestions: string[];
}

export interface CompetencyFramework {
  id: string;
  companyId: string;
  name: string;
  description: string;
  principles: CompetencyPrinciple[];
}

export type JourneyStatus =
  | "IN_PROGRESS"
  | "OFFER_EXTENDED"
  | "DID_NOT_PASS"
  | "ABANDONED"
  | "FAST_TRACKED";

export type StageAttemptStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "SKIPPED";

export interface StageProgressItem {
  stageId: string;
  stageType: CanonicalStageType;
  title: string;
  order: number;
  status: StageAttemptStatus;
  rawScore: number;
  maxScore: number;
  percentageScore: number;
  completedAt?: string;
  evaluatorFeedback?: string;
  attemptCount: number;
  durationSeconds?: number;
  telemetry?: Record<string, any>;
  rubricEvaluations?: Record<string, number>;
  sessionReferenceId?: string;
}

export interface StudentRecruitmentJourney {
  id: string;
  studentId: string;
  companyId: string;
  blueprintId: string;
  blueprintVersion: string;
  roleFamily: RoleFamily;
  hiringChannel: HiringChannel;
  currentStageId: string;
  status: JourneyStatus;
  overallScore: number;
  stageProgress: Record<string, StageProgressItem>;
  competencyScores: Record<string, number>;
  recruiterPipelineId?: string;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface StageAttemptSubmission {
  journeyId: string;
  stageId: string;
  rawScore: number;
  maxScore: number;
  durationSeconds: number;
  telemetry?: Record<string, any>;
  rubricEvaluations?: Record<string, number>;
  evaluatorFeedback?: string;
  sessionReferenceId?: string;
}

