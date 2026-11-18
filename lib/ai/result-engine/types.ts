/**
 * COGNALYZE RESULT ENGINE — CANONICAL TYPE DEFINITIONS
 * Single Source of Truth for all JD-vs-Resume intelligence.
 */

import {
  AuditLogEntry,
  CandidateClaimRecord,
  DiscoveredSourceRecord,
  EvidenceRecord,
  VerificationCheck,
  VerificationStatus,
} from '@/lib/evidence/evidence-ledger';

export type {
  AuditLogEntry,
  CandidateClaimRecord,
  DiscoveredSourceRecord,
  EvidenceRecord,
  VerificationCheck,
  VerificationStatus,
};

export type RequirementPriority = 'CRITICAL' | 'IMPORTANT' | 'PREFERRED' | 'NICE_TO_HAVE';

export type EvidenceStrengthLevel =
  | 'LEVEL_5_INDEPENDENTLY_VERIFIED'
  | 'LEVEL_4_ARTIFACT_BACKED'
  | 'LEVEL_3_IMPLEMENTATION'
  | 'LEVEL_2_CONTEXTUAL'
  | 'LEVEL_1_MENTIONED'
  | 'LEVEL_0_NO_EVIDENCE';

export type RoleArchetype =
  | 'ai_ml_engineer'
  | 'frontend_engineer'
  | 'backend_engineer'
  | 'fullstack_engineer'
  | 'data_engineer'
  | 'devops_cloud_engineer'
  | 'data_analyst'
  | 'general_software_engineer';

export type RiskCategory =
  | 'INFORMATIONAL'
  | 'NEEDS_CLARIFICATION'
  | 'EVIDENCE_CONCERN'
  | 'MATERIAL_CONTRADICTION'
  | 'INFORMATION_NEEDED'
  | 'UNVERIFIED_CLAIM'
  | 'SOURCE_CONTRADICTION'
  | 'TECHNICAL_REVIEW_REQUIRED'
  | 'VERIFIED_DISCREPANCY';

export type RequirementCategory =
  | 'technical'
  | 'domain'
  | 'education'
  | 'experience'
  | 'soft_skill'
  | 'responsibility'
  | 'tool'
  | 'certification'
  | 'deployment'
  | 'leadership'
  | 'communication';

export type RequirementType =
  | 'skill'
  | 'tool'
  | 'framework'
  | 'language'
  | 'domain_knowledge'
  | 'responsibility'
  | 'credential'
  | 'experience_level';

export type Explicitness = 'explicit' | 'implicit';

export type EvidencePolicy =
  | 'direct_or_project_evidence'
  | 'direct_only'
  | 'contextual_allowed'
  | 'educational_or_project';

export interface CanonicalJDRequirement {
  id: string;
  original_text: string;
  original_jd_quote?: string; // Exact verbatim quote from JD
  normalized_requirement: string;
  category: RequirementCategory;
  subcategory: string;
  priority: RequirementPriority;
  priority_source_text: string;
  requirement_type: RequirementType;
  synonyms: string[];
  explicitness: Explicitness;
  evidence_policy: EvidencePolicy;
  priority_reasoning?: string;
  expected_proficiency?: string;
  evidence_expectations?: string;
  evaluation_criteria?: string;
  parent_compound_requirement?: string;
  is_decomposed?: boolean;
  weight?: number; // Critical = 3.0, Important = 2.0, Preferred = 1.0, Nice to Have = 0.5
  demonstrableLevelRequired?: "none" | "knowledge" | "hands_on_project" | "production_scale";
  source_location?: {
    section?: string;
    lineRef?: string;
  };
  observable_indicators?: string[];
  minimumYearsExperience?: number;
  requirement_logic?: 'AND' | 'OR' | 'OPTIONAL' | 'PREFERRED' | 'CONDITIONAL';
  alternative_group_id?: string;
  alternatives?: string[];
  acceptance_rule?: string;
  is_alternative?: boolean;
  parent_requirement_id?: string;
}

export interface JDQualityAudit {
  vaguenessScore: number; // 0-100 (lower is crisper)
  ambiguousStatements: Array<{ statement: string; reason: string }>;
  contradictoryExperienceRanges: Array<{ titleSeniority: string; statedTenure: string; reason: string }>;
  unrealisticCombinations: string[];
  missingSections: string[];
  unassessableRequirements: string[];
  duplicateRequirements: string[];
  recruiterReviewRequired: boolean;
}

export interface CanonicalRoleSpec {
  id: string;
  title: string;
  seniorityLevel: "intern" | "entry" | "mid" | "senior" | "lead" | "principal";
  roleArchetype: RoleArchetype;
  atomicRequirements: CanonicalJDRequirement[];
  rawJDVerbatim: string;
  sourceDocHash: string;
  documentMetadata: {
    source: "pasted_text" | "pdf" | "docx" | "url" | "text_file";
    fileName?: string;
    extractedAt: string;
    version: number;
    extractionQualityScore: number;
  };
  qualityAudit: JDQualityAudit;
}

export interface ParsedJD {
  jobTitle: string;
  company?: string;
  seniority?: string;
  roleArchetype?: RoleArchetype;
  educationRequirements?: string[];
  yearsExperience?: string;
  requiredTechnicalSkills: string[];
  requiredSoftSkills: string[];
  responsibilities: string[];
  toolsAndFrameworks: string[];
  programmingLanguages: string[];
  domainKnowledge: string[];
  certifications: string[];
  preferredQualifications: string[];
  locationRequirements?: string;
  workAuthorization?: string;
  deploymentRequirements?: string[];
  leadershipRequirements?: string[];
  communicationRequirements?: string[];
  requirements: CanonicalJDRequirement[];
  rawJDVerbatim?: string;
  sourceHash?: string;
  qualityAudit?: JDQualityAudit;
  documentMetadata?: {
    source: string;
    fileName?: string;
    extractedAt: string;
    extractionQualityScore: number;
  };
}

// ============================================================
// 2. RESUME EVIDENCE CONTRACTS
// ============================================================

export type EvidenceSectionType =
  | 'SUMMARY'
  | 'EDUCATION'
  | 'EXPERIENCE'
  | 'INTERNSHIPS'
  | 'PROJECTS'
  | 'SKILLS'
  | 'CERTIFICATIONS'
  | 'ACHIEVEMENTS'
  | 'PUBLICATIONS'
  | 'OPEN_SOURCE'
  | 'HACKATHONS'
  | 'LEADERSHIP'
  | 'POSITIONS_OF_RESPONSIBILITY';

export interface EvidenceSourceLocation {
  section: EvidenceSectionType;
  item?: string;
  bullet?: number;
  line?: number;
}

export type EvidenceType =
  | 'DIRECT_IMPLEMENTATION'
  | 'PROJECT_USAGE'
  | 'EXPLICIT_CLAIM'
  | 'SKILL_LIST'
  | 'PROFILE_LINK'
  | 'EDUCATION'
  | 'CERTIFICATION'
  | 'EMPLOYMENT'
  | 'INTERNSHIP'
  | 'INDIRECT_CONTEXT'
  | 'NO_EVIDENCE';

export type EvidenceStrength = 'DIRECT' | 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE';

export interface RejectedEvidenceItem {
  retrievedText: string;
  reason: string;
  decision: 'REJECTED';
  evidenceId?: string;
}

export interface CanonicalResumeEvidence {
  id: string;
  type: string;
  evidence_type: EvidenceType;
  canonical_evidence_id?: string;
  occurrences?: EvidenceSourceLocation[];
  section: EvidenceSectionType;
  title: string;
  text: string;
  technologies: string[];
  source_location: EvidenceSourceLocation;
  verbatim_quote: string;
  evidence_id?: string;
  claim_id?: string;
  source_type?: string;
  source_url?: string;
  observed_fact?: string;
  verification_status?: VerificationStatus;
  supports?: string[];
  does_not_prove?: string[];
  checks_performed?: VerificationCheck[];
}

export interface ParsedResume {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  links: string[];
  summary?: string;
  rawResumeVerbatim?: string;
  sourceHash?: string;
  experienceBreakdown?: {
    totalNonOverlappingYears: number;
    fullTimeYears: number;
    internshipYears: number;
    totalNonOverlappingMonths: number;
    rangesFound: string[];
  };
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
    gpaScale?: number;
    details?: string;
  }[];
  experience: {
    role: string;
    company: string;
    period: string;
    location?: string;
    bullets: string[];
  }[];
  projects: {
    title: string;
    technologies: string[];
    bullets: string[];
    link?: string;
  }[];
  skillsCategorized: {
    category: string;
    items: string[];
  }[];
  languages?: string[];
  frameworks?: string[];
  databases?: string[];
  cloud?: string[];
  tools?: string[];
  uniqueSourcesCount?: number;
  certifications: string[];
  achievements: string[];
  publications: string[];
  openSource: string[];
  hackathons: string[];
  leadership: string[];
  evidenceItems: CanonicalResumeEvidence[];
}

export interface NormalizedCandidateProfile {
  id: string;
  sourceHash: string;
  rawResumeVerbatim: string;
  contact: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    links: string[];
  };
  experienceBreakdown: {
    totalNonOverlappingYears: number;
    fullTimeYears: number;
    internshipYears: number;
    totalNonOverlappingMonths: number;
    rangesFound: string[];
  };
  education: Array<{
    degree: string;
    institution: string;
    graduationYear?: string;
    cgpa?: string;
    cgpaScale?: number;
  }>;
  workHistory: Array<{
    title: string;
    company: string;
    dateRange: string;
    isInternship: boolean;
    responsibilities: string[];
    technologies: string[];
  }>;
  projects: Array<{
    title: string;
    purpose?: string;
    technologies: string[];
    implementationBullets: string[];
    liveUrl?: string;
    repoUrl?: string;
  }>;
  skillsCategorized: Array<{ category: string; items: string[] }>;
}

// ============================================================
// 3. EVIDENCE RELATIONSHIPS & STATUS MODEL
// ============================================================

export type EvidenceRelationship =
  | 'DIRECT'
  | 'PARTIAL'
  | 'INDIRECT'
  | 'CLAIM_ONLY'
  | 'NO_EVIDENCE'
  | 'CONTRADICTED';

export type EvidenceStatus =
  | 'SUPPORTED'
  | 'PARTIAL'
  | 'CLAIM_ONLY'
  | 'EVIDENCE_GAP'
  | 'SKILL_GAP'
  | 'MISSING'
  | 'CONTRADICTED';

export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';

export interface RequirementEvidenceMatch {
  requirementId: string;
  requirementName: string;
  priority: RequirementPriority;
  prioritySourceText?: string;
  relationship: EvidenceRelationship;
  status: EvidenceStatus;
  evidenceStrength: EvidenceStrength;
  evidenceStrengthLevel?: EvidenceStrengthLevel;
  evidenceContribution?: number; // 0.10, 0.35, 0.65, 0.85, 1.00, or 0.00
  relevanceFactor?: number;      // 0.80 - 1.00
  evidenceType: EvidenceType;
  confidence: number; // 0.0 - 1.0
  confidenceTier: ConfidenceTier;
  matchedEvidenceIds: string[];
  evidenceQuotes: string[];
  reasoning: string;
  actionableRecommendation: string;
  verificationStatus?: VerificationStatus;
  supports?: string[];
  doesNotProve?: string[];
  checksPerformed?: VerificationCheck[];
  rejectedEvidence?: RejectedEvidenceItem[];
  requirement_weight: number;
  status_multiplier: number;
  earned_points: number;
  possible_points: number;
  decomposedFrom?: string;
  limitations?: string[];
  review_required?: boolean;
  supporting_reason?: string;
  demonstrableCheckPassed?: boolean;
  nonEquivalenceApplied?: boolean;
  requirement_logic?: 'AND' | 'OR' | 'OPTIONAL' | 'PREFERRED' | 'CONDITIONAL';
  alternative_group_id?: string;
  alternatives?: string[];
  acceptance_rule?: string;
  is_alternative?: boolean;
  alternative_satisfied?: boolean;
  accepted_alternative?: string;
}

export interface RequirementEvaluationRecord {
  requirement_id: string;
  candidate_id: string;
  status: EvidenceStatus | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CLAIM_ONLY' | 'EVIDENCE_GAP' | 'SKILL_GAP' | 'MISSING' | 'CONTRADICTED';
  evidence_ids: string[];
  supporting_reason: string;
  limitations: string[];
  confidence: number;
  review_required: boolean;
  demonstrableCheckPassed?: boolean;
  nonEquivalenceApplied?: boolean;
  requirement_logic?: 'AND' | 'OR' | 'OPTIONAL' | 'PREFERRED' | 'CONDITIONAL';
  alternative_group_id?: string;
  alternatives?: string[];
  acceptance_rule?: string;
  is_alternative?: boolean;
  alternative_satisfied?: boolean;
  accepted_alternative?: string;
}

// ============================================================
// 4. DETERMINISTIC SCORE ENGINE CONTRACTS
// ============================================================

export interface ScoreCategoryStats {
  supported: number;
  partial: number;
  claimOnly: number;
  evidenceGap: number;
  skillGap: number;
  missing: number;
  contradicted: number;
  total: number;
  categoryScore: number; // 0-100
}

export interface TriPartiteScoreContract {
  roleAlignmentPercentage: number;   // 0.00 - 100.00 (points-based: sum earned / sum possible)
  evidenceConfidencePercentage: number; // 0.00 - 100.00 (weighted average of evidence confidence)
  requirementCoveragePercentage: number; // 0.00 - 100.00 (assessed requirements / total requirements)
  breakdown: {
    totalRequirements: number;
    totalAssessedRequirements: number;
    totalUnassessedRequirements: number;
    totalEarnedPoints: number;
    totalPossiblePoints: number;
    criticalCoverage: number; // 0-100
    scoringDefensibility: 'STRONG' | 'MODERATE' | 'WEAK';
    confidenceTier: ConfidenceTier;
  };
}

export interface ScoringWeightConfig {
  priorityWeights: {
    CRITICAL: number;
    IMPORTANT: number;
    PREFERRED: number;
    NICE_TO_HAVE: number;
  };
  contributionLevels: {
    LEVEL_5_INDEPENDENTLY_VERIFIED: number;
    LEVEL_4_ARTIFACT_BACKED: number;
    LEVEL_3_IMPLEMENTATION: number;
    LEVEL_2_CONTEXTUAL: number;
    LEVEL_1_MENTIONED: number;
    LEVEL_0_NO_EVIDENCE: number;
  };
  version: string;
}

export interface DeterministicScoreBreakdown {
  overallEvidenceMatch: number; // 0-100
  roleAlignmentPercentage?: number;
  evidenceConfidencePercentage?: number;
  requirementCoveragePercentage?: number;
  triPartiteScore?: TriPartiteScoreContract;
  scoringModelVersion?: string;
  evaluationId?: string;
  criticalScore: number;
  importantScore: number;
  preferredScore: number;
  niceToHaveScore?: number;
  criticalStats: ScoreCategoryStats;
  importantStats: ScoreCategoryStats;
  preferredStats: ScoreCategoryStats;
  niceToHaveStats?: ScoreCategoryStats;
  totalEarnedPoints: number;
  totalPossiblePoints: number;
  pointsAuditPassed: boolean;
  summaryCounts: {
    supported: number;
    partial: number;
    claimOnly: number;
    evidenceGaps: number;
    skillGaps: number;
    missing: number;
    contradicted: number;
    totalRequirements: number;
  };
  levelCounts?: {
    level5Verified: number;
    level4ArtifactBacked: number;
    level3Implementation: number;
    level2Contextual: number;
    level1Mentioned: number;
    level0NoEvidence: number;
  };
  scoreVerdictExplanation: string; // Personalized "WHY"
  formulaExplanation: string;
  calculatedAt: string;
}

// ============================================================
// 5. DERIVED INTELLIGENCE CONTRACTS
// ============================================================

export type DefensibilityRating = 'STRONG' | 'MODERATE' | 'WEAK';

export interface StrengthItem {
  id: string;
  requirement_id: string;
  evidence_id: string;
  strength: string;
  evidence: string;
  whyItMatters: string;
  targetRequirement: string;
}

export interface GapItem {
  id: string;
  requirement: string;
  currentEvidence: string;
  missingEvidence: string;
  gapType: 'Evidence Gap' | 'Skill Gap' | 'Partial Evidence' | 'Missing';
  impact: string;
  action: string;
}

export interface RiskItem {
  id: string;
  claim: string;
  verificationRecommended: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  sourceQuote: string;
  category?: RiskCategory;
  explanation?: string;
  flagType?: string;
  source?: string;
  confidence?: number;
  supporting_evidence?: string;
  limitations?: string[];
  recommended_action?: string;
}

export interface ExperienceAnalysis {
  professionalExperience: {
    level: 'EXTENSIVE' | 'MODERATE' | 'EARLY' | 'NO_PROFESSIONAL_FOUND';
    detail: string;
  };
  internshipExperience: {
    documented: boolean;
    detail: string;
  };
  projectEvidence: {
    count: number;
    level: 'STRONG' | 'MODERATE' | 'LIMITED';
    detail: string;
  };
  technicalBreadth: {
    level: 'BROAD' | 'FOCUSED' | 'NARROW';
    detail: string;
  };
  implementationDepth: {
    level: 'DEEP' | 'MODERATE' | 'SURFACE';
    detail: string;
  };
  engineeringDepth: {
    level: 'DEEP' | 'MODERATE' | 'SURFACE';
    detail: string;
  };
  ownershipAndScale: {
    detail: string;
  };
  impactEvidence: {
    level: 'MEASURABLE' | 'OBSERVABLE_PROCESS' | 'LIMITED';
    detail: string;
  };
  fresherFairnessAssessment: string;
}

export interface ProjectQualityItem {
  projectName: string;
  problem: string;
  technicalImplementation: string;
  technologies: string[];
  architecture: string;
  complexity: 'HIGH' | 'MODERATE' | 'FOUNDATIONAL';
  ownership: string;
  measurableResult: string;
  deployment: string;
  scale: string;
  engineeringDepth: 'DEEP' | 'MODERATE' | 'BASIC';
  relevanceToJD: string;
  interviewDefensibility: DefensibilityRating;
  evaluatorNote: string;
}

// Full Truthful Resume Rewriter contracts
export interface RewrittenBullet {
  bulletId: string;
  section: string;
  originalText: string;
  rewrittenText: string;
  transformationRationale: string;
  sourceVerbatimQuote: string;
  newFactsAdded: string; // Must strictly be "NONE - Grounded strictly in original source"
  evidenceStatus: 'SUPPORTED' | 'EVIDENCE_GAP';
  targetRequirement?: string;
  interviewDefensibility: DefensibilityRating;
  original_evidence_ids?: string[];
}

export interface FullRewrittenResume {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    links: string[];
  };
  summary: string;
  skills: { category: string; items: string[] }[];
  experience: {
    role: string;
    company: string;
    period: string;
    location?: string;
    bullets: RewrittenBullet[];
  }[];
  projects: {
    title: string;
    technologies: string[];
    bullets: RewrittenBullet[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    details?: string;
  }[];
  certifications: string[];
  achievements: string[];
  leadership: string[];
  additionalInformation?: string[];
  atsScore: 'STRONG' | 'ADEQUATE' | 'NEEDS_ATTENTION';
  atsNotes: string[];
  zeroFabricationCertified: boolean;
}

export interface RoadmapMilestone {
  milestoneId: string;
  priority: number;
  phase: string;
  title: string;
  targetGapRequirement: string;
  currentStatus: EvidenceStatus;
  reason: string;
  action: string;
  deliverableArtifact: string;
  evidenceGenerated: string;
  realisticEffort: string;
}

export interface RoadmapPlan {
  readyToApplyStatus: 'READY_TO_APPLY' | 'APPLY_WITH_GAPS' | 'BUILD_MORE_EVIDENCE' | 'INSUFFICIENT_DATA';
  verdictReason: string;
  milestones: RoadmapMilestone[];
}

export interface InterviewProbeQuestion {
  questionId: string;
  requirementId: string;
  evidenceId: string;
  reasonForQuestion: string;
  targetRequirement: string;
  claimBeingProbed: string;
  question: string;
  whyAsked: string;
  questionType:
    | 'RESUME_VERIFICATION'
    | 'TECHNICAL_DEPTH'
    | 'PROJECT_OWNERSHIP'
    | 'ARCHITECTURE'
    | 'PROBLEM_SOLVING'
    | 'MISSING_CRITICAL_EVIDENCE'
    | 'CONTRADICTION';
  evidenceTested: string;
  whatStrongProofLooksLike: string;
  candidateDefensibility: DefensibilityRating;
  unresolvedQuestion?: string;
  expectedAnswerIndicators?: {
    strongSignals: string[];
    weakSignals: string[];
  };
  followUpQuestions?: string[];
  evaluationRubric?: string;
}

export interface InterviewFocusPlan {
  focusSummary: string;
  likelyAreasToProbe: string[];
  probeQuestions: InterviewProbeQuestion[];
  verificationRecommendations: {
    claim: string;
    verificationTarget: string;
    recommendedVerification: string;
  }[];
  defensibilityOverview: {
    strongCount: number;
    moderateCount: number;
    weakCount: number;
    rationale: string;
  };
}

export interface MarketPositionAnalysis {
  benchmarkStatus: 'BENCHMARK_UNAVAILABLE' | 'COHORT_BENCHMARK';
  explanation: string;
  evidenceProfileSummary: string;
  requiredCohortForPercentile: string;
}

export interface FinalVerdict {
  oneLineVerdict: string;
  primaryStrengths: string[];
  primaryDocumentedLimitations: string[];
  recommendedApplicationStrategy: string;
  evidenceBasedSynthesis: string;
  overallPanelSummary: string;
}

export interface CrossSectionAuditCheck {
  checkNumber: number;
  name: string;
  passed: boolean;
  detail?: string;
}

export interface ValidationReport {
  passed: boolean;
  scoreConsistent: boolean;
  zeroFabricationCertified: boolean;
  crossSectionConsistent: boolean;
  hallucinationFree: boolean;
  auditPassed: boolean;
  traceabilityStatus: 'ZERO_FABRICATION_CERTIFIED' | 'TRACEABILITY_AUDIT_INCOMPLETE';
  crossSectionChecks: CrossSectionAuditCheck[];
  violations: string[];
  withheldSections: string[];
}

// ============================================================
// 6. MASTER CANONICAL ANALYSIS OBJECT (ONE SOURCE OF TRUTH)
// ============================================================

export interface CanonicalAnalysisObject {
  candidate: ParsedResume;
  jd: ParsedJD;
  requirements: CanonicalJDRequirement[];
  evidence: CanonicalResumeEvidence[];
  matches: RequirementEvidenceMatch[];
  score: DeterministicScoreBreakdown;
  strengths: StrengthItem[];
  gaps: GapItem[];
  risks: RiskItem[];
  experienceAnalysis: ExperienceAnalysis;
  projectAnalysis: ProjectQualityItem[];
  resumeRewrite: FullRewrittenResume;
  roadmap: RoadmapPlan;
  interviewFocus: InterviewFocusPlan;
  marketPosition: MarketPositionAnalysis;
  finalVerdict: FinalVerdict;
  validation: ValidationReport;
  evidenceLedger?: EvidenceRecord[];
  claimLedger?: CandidateClaimRecord[];
  discoveredSources?: DiscoveredSourceRecord[];
  auditTrail?: AuditLogEntry[];
  metadata: {
    version: string;
    timestamp: string;
    executionTimeMs?: number;
  };
}
