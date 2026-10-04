/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — CANONICAL DATA CONTRACTS
 * 
 * Core Principles:
 * 1. Evidence-First Matching: Never rely on raw keyword overlap.
 * 2. Independent Eligibility: Eligibility is not the same as ranking. Hard constraints override skills.
 * 3. Transparent Provenance: Every recommendation answers "Why this candidate?", "Why this opportunity?", "Why now?".
 * 4. Multi-Source Ingestion: Extensible adapter architecture preserving source attribution.
 * 5. Actionable Gaps: "Build Evidence First" turns skill gaps into tangible project action plans.
 */

import { EpistemicStatus, EvidenceLevel } from "@/lib/intelligence/student-intelligence";

export type OpportunitySourceType =
  | "UNSTOP"
  | "DEVPOST"
  | "DEVFOLIO"
  | "MLH"
  | "HACK2SKILL"
  | "IIT"
  | "HACKERRANK"
  | "HACKEREARTH"
  | "KAGGLE"
  | "CODECHEF"
  | "OPEN_SOURCE"
  | "COMPANY_CAREER"
  | "ATS"
  | "JOB_API"
  | "STARTUP"
  | "UNIVERSITY"
  | "ADMIN_IMPORT"
  | "PARTNER";

export type CanonicalOpportunityType =
  | "HACKATHON"
  | "INTERNSHIP"
  | "JOB"
  | "COMPETITION"
  | "CHALLENGE"
  | "FELLOWSHIP"
  | "SCHOLARSHIP"
  | "RESEARCH"
  | "PROGRAM"
  | "OTHER";

export type RemoteType = "remote" | "hybrid" | "onsite";

export type EmploymentType = "internship" | "full_time" | "part_time" | "fellowship";

export type ExperienceLevel = "intern" | "entry_level" | "mid_level" | "senior";

export type OpportunityLifecycleStatus =
  | "DISCOVERED"
  | "VERIFYING"
  | "ACTIVE"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "SUBMISSION_OPEN"
  | "SUBMISSION_CLOSED"
  | "UPDATED"
  | "STALE"
  | "EXPIRED"
  | "CANCELLED"
  | "REMOVED"
  | "ARCHIVED"
  | "UNVERIFIED"
  | "QUARANTINED";

export type LinkStatus =
  | "VERIFIED_ACTIVE"
  | "VERIFIED_UPCOMING"
  | "REDIRECTED_VERIFIED"
  | "LOGIN_REQUIRED"
  | "REGISTRATION_CLOSED"
  | "SUBMISSION_CLOSED"
  | "EXPIRED"
  | "NOT_FOUND"
  | "REMOVED"
  | "UNAVAILABLE"
  | "SOURCE_UNREACHABLE"
  | "UNKNOWN"
  | "UNVERIFIED";

export type VerificationStatus =
  | "VERIFIED"
  | "UNVERIFIED"
  | "QUARANTINED"
  | "FAILED";

export type ClaimType = "VERIFIED" | "INFERRED" | "RECOMMENDED";

export type OpportunityClassification =
  | "CODING_CONTEST"
  | "DSA_CONTEST"
  | "HACKATHON"
  | "AI_HACKATHON"
  | "ML_COMPETITION"
  | "API_BUILDATHON"
  | "PRODUCT_HACKATHON"
  | "STARTUP_CHALLENGE"
  | "CASE_COMPETITION"
  | "HIRING_CHALLENGE"
  | "INTERNSHIP"
  | "OPEN_SOURCE_PROGRAM"
  | "SCHOLARSHIP"
  | "FELLOWSHIP"
  | "RESEARCH_CHALLENGE"
  | "OTHER";

export interface EvidenceClaim {
  id: string;
  opportunityId: string;
  field: string;
  value: any;
  sourceUrl?: string;
  sourceType?: OpportunitySourceType;
  status: ClaimType;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  extractedAt: string;
  reasoning?: string;
}

export interface LinkVerificationResult {
  url: string;
  finalUrl: string;
  httpStatus: number;
  status: LinkStatus;
  isVerified: boolean;
  isActionable: boolean;
  redirectChain: string[];
  failureReason?: string;
  pageTitle?: string;
  checkedAt: string;
  contentSignals: {
    has404Text: boolean;
    hasExpiredText: boolean;
    hasClosedText: boolean;
    hasLoginWall: boolean;
    titleMatches: boolean;
    organizerMatches: boolean;
  };
}

export interface OpportunityDNA {
  id: string;
  classification: OpportunityClassification;
  objective: string;
  problemStatement?: string;
  targetUser?: string;
  tracks: string[];
  eligibility: string[];
  teamSize?: string;
  deadline: string | null;
  eventDates?: { start?: string; end?: string };
  requiredSkills: string[];
  requiredTechnologies: string[];
  optionalTechnologies: string[];
  requiredAPIs: string[];
  requiredSDKs: string[];
  dataRequirements?: string[];
  submissionFormat?: string;
  demoRequirements?: string;
  repositoryRequirements?: string;
  videoRequirements?: string;
  judgingCriteria: { criterion: string; weightPercent?: number; description?: string }[];
  restrictions: string[];
  officialConstraints: string[];
  prizes: string[];
  organizerExpectations?: string;
  claims: EvidenceClaim[];
}

export type FreshnessState = "FRESH" | "ACTIVE" | "AGING" | "STALE" | "EXPIRED";

export type ConnectorStatus =
  | "ACTIVE"
  | "AUTHORIZED"
  | "LIMITED"
  | "DISABLED"
  | "ERROR"
  | "REQUIRES_AUTH"
  | "REQUIRES_APPROVAL";

export type EligibilityStatus =
  | "ELIGIBLE"
  | "POTENTIALLY_ELIGIBLE"
  | "INELIGIBLE"
  | "UNKNOWN";

export type RecommendationTier =
  | "APPLY_NOW"
  | "BUILD_EVIDENCE"
  | "EXPLORE"
  | "VERIFY"
  | "LOW_PRIORITY"
  | "NOT_ELIGIBLE";

export type ApplicationStage =
  | "Saved"
  | "Considering"
  | "Applied"
  | "Assessment"
  | "Interview"
  | "Offer"
  | "Accepted"
  | "Rejected"
  | "Withdrawn";

export type EvidenceStatus = "PROVEN" | "SUPPORTED" | "CLAIMED" | "WEAK" | "MISSING";

export interface SourceInstance {
  source: string;
  sourceType: OpportunitySourceType;
  sourceUrl: string;
  applicationUrl: string;
  retrievedAt: string;
  lastVerifiedAt: string;
}

export interface RoleDNA {
  roleCategory: string;
  mustHaveSkills: string[];
  preferredSkills: string[];
  experienceYearsMin: number;
  experienceYearsMax: number;
  educationSummary: string;
  graduationWindow: string;
  locationMode: string;
  disqualifiers: string[];
}

export interface EducationRequirements {
  degreesAllowed: string[]; // e.g. ["B.Tech", "B.E.", "B.S.", "M.Tech", "MCA"]
  fieldsAllowed: string[];  // e.g. ["Computer Science", "Information Technology", "AI/ML", "Related"]
  minEducationLevel?: "bachelors" | "masters" | "phd";
  isMandatory: boolean;
}

export interface GraduationRequirements {
  minGradYear?: number;
  maxGradYear?: number;
  allowedYears?: number[];
  currentlyEnrolledRequired?: boolean;
  isMandatory: boolean;
}

export interface WorkAuthRequirements {
  country: string;
  sponsorshipAvailable: boolean;
  requiresCitizenshipOrPR: boolean;
  isMandatory: boolean;
}

export interface OpportunityCompensation {
  min?: number;
  max?: number;
  currency?: string;
  period?: "month" | "year" | "hourly";
  stipendText?: string;
}

export interface CanonicalOpportunity {
  id: string;
  canonicalOpportunityId?: string;
  source: string;
  sourceType: OpportunitySourceType;
  sourceId?: string;
  sourceUrl: string;
  sourceUrls?: string[];
  applicationUrl: string;
  canonicalUrl?: string;

  companyId: string;
  companyName: string;
  organizer?: string;
  companyLogo?: string;
  companyType?: "enterprise" | "mid_market" | "startup" | "scaleup" | "university";
  startupStage?: "Seed" | "Series A" | "Series B+" | "Bootstrapped";

  title: string;
  normalizedTitle: string;
  opportunityType?: CanonicalOpportunityType;
  classification?: OpportunityClassification;

  description: string;
  rawDescription?: string;
  responsibilities?: string[];

  location: string;
  locations?: string[];
  country: string;
  city: string;

  remoteType: RemoteType;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;

  educationRequirements: EducationRequirements;
  graduationRequirements: GraduationRequirements;
  workAuthRequirements?: WorkAuthRequirements;

  requiredSkills: string[]; // MUST HAVE
  preferredSkills: string[]; // PREFERRED
  technologies?: string[];
  domains?: string[];
  tags?: string[];

  eligibilityRequirements: string[];
  disqualifiers: string[];

  teamSize?: string;
  prize?: string;
  compensation?: OpportunityCompensation;

  postedAt: string;
  updatedAt: string;
  deadline: string | null;

  status: OpportunityLifecycleStatus;
  verificationStatus?: VerificationStatus;
  linkStatus?: LinkStatus;
  sourceConfidence?: "HIGH" | "MEDIUM" | "LOW";
  contentConfidence?: "HIGH" | "MEDIUM" | "LOW";
  freshness: FreshnessState;

  roleDNA: RoleDNA;
  opportunityDNA?: OpportunityDNA;
  claims?: EvidenceClaim[];
  verificationResult?: LinkVerificationResult;

  createdAt: string;
  lastFetchedAt?: string;
  lastVerifiedAt: string;
  nextVerificationAt?: string;
  contentHash?: string;
  sourceVersion?: number;

  rawSourceData?: any;
  sourceMetadata?: Record<string, any>;
  sourceInstances?: SourceInstance[];
}

export interface RawOpportunity {
  id: string;
  source: string;
  sourceType: OpportunitySourceType;
  sourceId?: string;
  sourceUrl: string;
  applicationUrl: string;
  companyName: string;
  organizer?: string;
  title: string;
  opportunityType?: CanonicalOpportunityType;
  description: string;
  location?: string;
  locations?: string[];
  remoteType?: string;
  employmentType?: string;
  experienceLevel?: string;
  requirements?: string[];
  eligibilityText?: string;
  postedAt?: string;
  deadline?: string;
  compensationText?: string;
  prize?: string;
  teamSize?: string;
  tags?: string[];
  domainTags?: string[];
  technologies?: string[];
  metadata?: Record<string, any>;
}

export interface SourceRegistryEntry {
  id: string;
  name: string;
  type: OpportunitySourceType;
  status: ConnectorStatus;
  description: string;
  refreshIntervalMs: number;
  lastSyncedAt: string;
  lastRunAt?: string;
  lastSuccessfulRunAt?: string;
  lastFailureAt?: string;
  lastError?: string;
  totalOpportunities: number;
  recordsFetched: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsDeduplicated: number;
  recordsExpired: number;
  durationMs: number;
  successRate: number;
  rateLimitConfig?: {
    requestsPerMinute: number;
    dailyLimit: number;
  };
}

export interface EligibilityResult {
  status: EligibilityStatus;
  hardRequirements: string[];
  satisfiedRequirements: string[];
  failedRequirements: string[];
  unknownRequirements: string[];
  blockers: string[];
  explanation: string;
}

export interface SupportingEvidenceDetail {
  claim: string;
  source: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  artifactName?: string;
  extractedSnippet?: string;
}

export interface EvidenceMappingItem {
  requirement: string;
  isMustHave: boolean;
  status: EvidenceStatus;
  evidenceCount: number;
  supportingEvidence: SupportingEvidenceDetail[];
}

export interface EvidenceGapItem {
  skill: string;
  isMustHave: boolean;
  recommendationAction?: string;
}

export interface OpportunityActionPlan {
  title: string;
  description: string;
  projectIdea: string;
  deliverable: string;
  targetSkills: string[];
  actionUrl: string;
}

export interface OpportunityPreparationPlan {
  opportunityId: string;
  classification: OpportunityClassification;
  headline: string;
  whatOpportunityAsks: string;
  whatYouAlreadyHave: string[];
  whatYouAreMissing: string[];
  learningChecklist: { topic: string; estimatedHours: number; reason: string; status: ClaimType }[];
  whatToBuild: string;
  architecture: {
    overview: string;
    components: { name: string; role: string; technology: string; reason: string; status: ClaimType }[];
    dataFlow: string[];
  };
  apisAndSDKs: { name: string; purpose: string; isOfficialRequirement: boolean }[];
  datasetsNeeded: string[];
  mvpMilestones: { phase: string; deliverable: string; targetDuration: string }[];
  demoMoment: {
    whatJudgeSees: string;
    whyItProvesSuccess: string;
    requirementDemonstrated: string;
  };
  submissionChecklist: { item: string; requiredBySource: boolean; isCompleted?: boolean }[];
  judgingAlignment: { criterion: string; ourAdvantage: string; defenseStrategy: string }[];
  judgeQuestions: { question: string; defensePoints: string[] }[];
  timelineSchedule: { period: string; focus: string; tasks: string[] }[];
  requirementEvidenceCoverage: {
    totalRequirements: number;
    supportedCount: number;
    partialCount: number;
    missingCount: number;
    coveragePercentage: number;
  };
}

export interface CandidateOpportunityMatch {
  candidateId: string;
  opportunityId: string;
  opportunity: CanonicalOpportunity;

  eligibilityResult: EligibilityResult;

  recommendation: RecommendationTier;
  recommendationReason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";

  internalScore: number; // Internal ranking heuristic only; never shown as hiring probability

  matchBreakdown: {
    roleAlignment: "Strong" | "Moderate" | "Weak";
    coreRequirementCoverage: { total: number; matched: number; percentage: number };
    evidenceStrength: "Strong" | "Supported" | "Claimed" | "Weak" | "Missing";
    projectRelevance: "Strong" | "Moderate" | "Low";
    experienceFit: "Strong" | "Moderate" | "Mismatch";
    preferenceFit: "Strong" | "Moderate" | "Conflict";
    trajectoryFit: "Strong" | "Moderate" | "Weak";
  };

  evidenceMapping: EvidenceMappingItem[];
  matchedRequirements: string[];
  missingRequirements: string[];
  evidenceGaps: EvidenceGapItem[];

  why: {
    whyThisCandidate: string;
    whyThisOpportunity: string;
    whyNow: string;
    summary: string;
  };

  actionPlan?: OpportunityActionPlan;

  generatedAt: string;
  expiresAt: string;
}

export interface StudentOpportunityPreferences {
  candidateId: string;
  targetRoles: string[];
  experienceLevel: "intern" | "entry_level" | "mid_level";
  locations: string[];
  remotePreferences: RemoteType[];
  preferredCompanyTypes: ("startup" | "enterprise" | "mid_market")[];
  preferredStartupStages?: ("Seed" | "Series A" | "Series B+" | "Bootstrapped")[];
  dislikedIndustries?: string[];
  minimumStipend?: number;
  updatedAt: string;
}

export interface ApplicationTrackerRecord {
  id: string;
  candidateId: string;
  opportunityId: string;
  stage: ApplicationStage;
  appliedAt?: string;
  updatedAt: string;
  notes?: string;
  outcomeReason?: string;
  feedbackNotes?: string;
}

export interface OpportunityResearchSummary {
  totalResearched: number;
  activeCount: number;
  uniqueAfterDeduplication: number;
  personalizedCount: number;
  applyNowCount: number;
  buildEvidenceCount: number;
  exploreCount: number;
  newSinceLastVisit: number;
  closingSoonCount: number;
  sourcesActive: number;
  lastResearchedAt: string;
}
