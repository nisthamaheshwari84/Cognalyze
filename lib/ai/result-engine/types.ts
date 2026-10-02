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
}

export interface ParsedJD {
  jobTitle: string;
  company?: string;
  seniority?: string;
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
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
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

export interface DeterministicScoreBreakdown {
  overallEvidenceMatch: number; // 0-100
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
