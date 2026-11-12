/**
 * COGNALYZE CAREER LAUNCH PATHWAYS & PREPARATIONS ARENA
 * Canonical Data Contracts & Type Definitions
 * 
 * Location: Cognalyze → Skill Practice Hub → Preparations
 * Strictly integrates with existing Cognalyze Student DNA, Skill Arenas, and Design Tokens.
 */

export type PreparationCategory =
  | "OPEN_SOURCE"
  | "COMPANY_HACKATHON"
  | "COMPANY_HIRING"
  | "SPECIALIZED_INTERNSHIP";

export type StartingLevel =
  | "absolute_beginner"
  | "beginner"
  | "intermediate"
  | "advanced";

export type LinkedSkillDomain =
  | "dsa"
  | "ai_data"
  | "cs_fundamentals"
  | "code_comprehension"
  | "system_design"
  | "behavioral"
  | "project"
  | "github";

export type TaskStatus = "pending" | "in_progress" | "completed" | "verified";

export interface ArenaTask {
  id: string;
  phase: number;
  phaseName: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  linkedDomain: LinkedSkillDomain;
  targetHref: string;
  actionLabel: string;
  minLevelRequired: StartingLevel;
  learningOutcomes: string[];
  deliverable?: string;
  evidenceGenerated: string;
}

export interface RoadmapPhase {
  phaseNumber: number;
  phaseName: string;
  description: string;
  totalEstimatedHours: number;
  tasks: ArenaTask[];
}

export interface ArenaProject {
  id: string;
  title: string;
  tagline: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedDays: number;
  architectureSummary: string;
  techStack: string[];
  systemComponents: {
    component: string;
    technology: string;
    responsibility: string;
  }[];
  milestones: {
    milestoneNumber: number;
    title: string;
    description: string;
    deliverable: string;
  }[];
  acceptanceCriteria: string[];
  demoRequirements: string;
  sampleSubmissionHint?: string;
}

export interface OpenSourceRepo {
  name: string;
  org: string;
  url: string;
  stars?: string;
  techStack: string[];
  goodFirstIssuesUrl: string;
  contributionGuideUrl: string;
  architectureOverview: string;
  recommendedFirstPRFocus: string;
  maintainerTips: string[];
}

export interface MockQuestion {
  id: string;
  question: string;
  type: "coding" | "architecture" | "conceptual" | "proposal";
  starterCode?: string;
  solution?: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
  rubric: string;
}

export interface MockAssessment {
  id: string;
  title: string;
  type: "technical_oa" | "system_design_defense" | "proposal_presentation" | "hackathon_simulation";
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  questions: MockQuestion[];
}

export interface PreparationArena {
  id: string;
  slug: string;
  title: string;
  shortName: string;
  companyOrOrg: string;
  category: PreparationCategory;
  categoryLabel: string;
  tagline: string;
  description: string;
  badge: string;
  icon: string;
  officialUrl: string;
  sourceAttribution: string;
  stipendOrPrize: string;
  confirmedStipendAmount?: number;
  currency?: string;
  duration: string;
  applicationDeadline: string;
  eventOrProgramDates: string;
  cycleYear?: number;
  cycleStatus?: "active" | "upcoming_unannounced" | "historical_completed";
  dateVerificationStatus?: "verified_official" | "estimated_from_previous_cycle" | "rolling";
  cycleNotes?: string;
  eligibility: {
    degreesAllowed: string[];
    graduationYears: number[];
    minCgpaOrGpa?: string;
    branchRestrictions: string[];
    otherRequirements: string[];
  };
  selectionRounds: {
    roundNumber: number;
    name: string;
    description: string;
    format: string;
    eliminatory: boolean;
  }[];
  requiredSkills: {
    skill: string;
    proficiency: "Beginner" | "Intermediate" | "Advanced";
    isMustHave: boolean;
    provenance: "VERIFIED" | "INFERRED" | "RECOMMENDED";
  }[];
  primaryDomains: LinkedSkillDomain[];
  phases: {
    absolute_beginner: RoadmapPhase[];
    beginner: RoadmapPhase[];
    intermediate: RoadmapPhase[];
    advanced: RoadmapPhase[];
  };
  projects: ArenaProject[];
  openSourceRepos?: OpenSourceRepo[];
  mockAssessments: MockAssessment[];
  proposalTemplate?: {
    title: string;
    sections: {
      sectionTitle: string;
      guidingQuestions: string[];
      exampleExcerpt: string;
    }[];
    scoringRubric: {
      criterion: string;
      weightage: number;
      description: string;
    }[];
  };
  hackathonSubmissionChecklist?: {
    category: string;
    items: string[];
  }[];
  diagnosticQuestions: {
    id: string;
    question: string;
    options: {
      label: string;
      recommendedLevel: StartingLevel;
    }[];
  }[];
}

export interface StudentArenaState {
  candidateId: string;
  arenaId: string;
  selectedLevel: StartingLevel;
  completedTaskIds: string[];
  activeTaskIndex: number;
  submittedProjectIds: string[];
  mockAssessmentScores: Record<string, { score: number; percentage: number; passed: boolean; completedAt: string }>;
  proposalDraft?: string;
  proposalEvaluation?: {
    overallScore: number;
    verdict: "STRONG_SUBMISSION" | "MEETS_CRITERIA" | "NEEDS_REVISION";
    strengths: string[];
    gaps: string[];
    actionableFeedback: string;
    reviewedAt: string;
  };
  readinessScore: number;
  evidenceCount: number;
  lastActiveAt: string;
}

export interface CrossOpportunityOptimization {
  targetArenas: {
    arenaId: string;
    title: string;
    company: string;
    deadline: string;
  }[];
  sharedFoundations: {
    skill: string;
    commonToAll: boolean;
    applicableArenas: string[];
    recommendedArenaLink: string;
  }[];
  arenaUniqueRequirements: {
    arenaId: string;
    uniqueSkills: string[];
    uniqueProjects: string[];
  }[];
  estimatedTotalWeeks: number;
  timeSavingsWeeks: number;
  weeklyBalancedSchedule: {
    weekNumber: number;
    focus: string;
    sharedTasks: string[];
    opportunityTasks: { arenaId: string; task: string }[];
  }[];
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTONOMOUS ENGINE, REAL-WORLD EXPERIENCE & ORCHESTRATION CONTRACTS
// ═════════════════════════════════════════════════════════════════════════════

export type RoadmapNodeMasteryState =
  | "not_started"
  | "learning"
  | "practiced"
  | "demonstrated"
  | "independently_verified";

export interface DependencyRoadmapNode {
  id: string;
  phaseNumber: number;
  title: string;
  learningObjective: string;
  prerequisiteNodeIds: string[];
  recommendedResources: {
    title: string;
    url: string;
    resourceType: "cognalyze_arena" | "official_docs" | "video_insight" | "written_experience";
    provenanceNote: string;
  }[];
  practicalExercises: {
    label: string;
    targetHref: string;
    estimatedMinutes: number;
  }[];
  relevantRepoOrProject: string;
  expectedCompetency: string;
  verificationCriteria: string;
  masteryState: RoadmapNodeMasteryState;
  evidenceSources: string[];
  isBlockedByPrerequisites: boolean;
}

export interface StudentIntelligenceSnapshot {
  candidateId: string;
  isAuthenticated: boolean;
  verifiedSkills: Array<{ skill: string; evidenceCount: number; sourceTypes: string[]; lastVerifiedAt?: string }>;
  demonstratedSkills: Array<{ skill: string; evidenceCount: number; sourceTypes: string[] }>;
  inferredOrClaimedSkills: Array<{ skill: string; sourceTypes: string[] }>;
  projects: Array<{ title: string; techStack: string[]; repoUrl?: string; verified: boolean }>;
  githubConnected: boolean;
  githubUsername?: string;
  githubRepos: Array<{ name: string; fullName: string; url: string; language?: string; stars?: number; hasTests?: boolean }>;
  externalPRs: Array<{ repoFullName: string; title: string; url: string; state: "open" | "closed" | "merged"; verifiedAt: string }>;
  programmingLanguages: string[];
  identifiedSkillGaps: Array<{ skill: string; importance: "core" | "important" | "preferred"; reason: string }>;
  evidenceCoverage: {
    requiredCount: number;
    verifiedCount: number;
    demonstratedCount: number;
    claimedOnlyCount: number;
    missingCount: number;
  };
  confidenceAndFreshness: {
    confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
    lastSyncedAt: string;
    stalenessWarning?: string;
  };
}

export interface EightPillarProgress {
  learning: { completedNodes: number; totalNodes: number; verifiedNodes: number; summary: string };
  projects: { activeCount: number; completedCount: number; verifiedCount: number; summary: string };
  repositoryUnderstanding: { inspectedRepos: number; summary: string };
  contributions: { activeWorkspaces: number; verifiedPRsCount: number; summary: string };
  assessments: { attemptsCount: number; passedCount: number; latestScorePct?: number; summary: string };
  interviews: { sessionsCount: number; latestVerdict?: string; summary: string };
  proposalDevelopment: { hasDraft: boolean; wordCount: number; aiRubricScore?: number; summary: string };
  applicationReadiness: {
    status: "Early Foundation" | "Building Evidence" | "Interview & Contribution Ready" | "Submission Ready";
    blockingFactors: string[];
  };
}

export type OrchestratorAgentName =
  | "StudentIntelligenceAgent"
  | "OpportunityDiscoveryAgent"
  | "RepositoryAnalysisAgent"
  | "SkillGapAgent"
  | "LearningPlannerAgent"
  | "AssessmentAgent"
  | "ProjectArchitectAgent"
  | "InterviewAgent"
  | "ProposalReviewerAgent"
  | "ProgressEvidenceAgent";

export interface AgentTraceEntry {
  id: string;
  agentName: OrchestratorAgentName;
  timestamp: string;
  inputEvidence: string;
  agentDecision: string;
  reasoningSummary: string;
  recommendedAction: string;
  executionStatus: "executed" | "queued" | "fallback_used" | "failed";
  outcome: string;
}

export interface ContributionWorkspaceState {
  issueId: string;
  repoFullName: string;
  issueNumber: number;
  issueTitle: string;
  issueUrl: string;
  completedStepIds: number[];
  notes: string;
  prUrl?: string;
  prVerificationStatus: "not_submitted" | "verified_open" | "verified_merged" | "verified_closed" | "unverified_check_failed";
  prLastCheckedAt?: string;
  updatedAt: string;
}

export interface AssessmentTurnRecord {
  questionId: string;
  question: string;
  format: string;
  difficulty: "easy" | "medium" | "hard";
  competency: string;
  studentAnswer: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback: string;
  mistakeExplanation?: string;
  timeSpentSeconds?: number;
}

export interface PersistedAssessmentAttempt {
  sessionId: string;
  arenaId: string;
  candidateId: string;
  startedAt: string;
  completedAt?: string;
  status: "in_progress" | "completed";
  targetedWeakConcepts: string[];
  turns: AssessmentTurnRecord[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  verdict?: "EXEMPLARY" | "MEETS_SELECTION_BAR" | "NEEDS_REMEDIATION";
  recommendedPracticeLinks: Array<{ concept: string; targetHref: string; actionLabel: string }>;
  nextAssessmentObjective?: string;
  generatedBy: "llm_adaptive" | "deterministic_adaptive";
}

export type InterviewModeType =
  | "technical_interview"
  | "project_deep_dive"
  | "code_walkthrough"
  | "debugging_interview"
  | "open_source_contribution"
  | "architecture_discussion"
  | "behavioral_lp";

export interface InterviewTurn {
  turnNumber: number;
  interviewerQuestion: string;
  focusCompetency: string;
  studentResponse?: string;
  evaluation?: {
    technicalCorrectness: number; // 0-10
    reasoningQuality: number;     // 0-10
    communicationClarity: number; // 0-10
    depth: number;                // 0-10
    strengths: string[];
    gaps: string[];
    coachingFeedback: string;
  };
  timestamp: string;
}

export interface PersistedInterviewSession {
  sessionId: string;
  arenaId: string;
  candidateId: string;
  mode: InterviewModeType;
  targetContextSummary: string;
  status: "active" | "completed";
  turns: InterviewTurn[];
  finalReport?: {
    overallVerdict: "Strong Hire / Select" | "Borderline — Needs Targeted Polish" | "Not Ready Yet";
    averages: {
      technicalCorrectness: number;
      reasoningQuality: number;
      communicationClarity: number;
      depth: number;
    };
    keyStrengths: string[];
    criticalGaps: string[];
    improvementPlan: Array<{ action: string; targetHref: string }>;
  };
  createdAt: string;
  updatedAt: string;
}

// Real-World Experience & Video Intelligence Contracts
export type ExperienceTrustTier =
  | "Official primary source"
  | "Verified first-person participant experience"
  | "Publicly documented finalist/winner experience"
  | "Community-reported experience"
  | "Editorial preparation material"
  | "AI-derived synthesis";

export interface VideoTimestampSegment {
  seconds: number;
  formattedTime: string;
  topic: string;
  preparationStage: string;
  summary: string;
  watchAtTimestampUrl: string;
}

export interface RealExperienceResource {
  id: string;
  title: string;
  url: string;
  authorOrSpeaker: string;
  programId: string; // e.g. "gsoc", "flipkart-grid", "amazon-hackon", "walmart-sparkathon", "jpmc-cfg", "imagine-cup", "sih"
  organizationOrCompany: string;
  programYear: number;
  resourceType: "youtube_video" | "article_blog" | "official_documentation" | "github_repo_guide";
  publicationDate: string;
  verificationStatus: "verified_accessible" | "pending_verification" | "link_unavailable";
  trustClassification: ExperienceTrustTier;
  preparationStage:
    | "Organization & Problem Selection"
    | "Codebase Exploration & First PR"
    | "Online Assessment & DSA"
    | "System Architecture & Prototype"
    | "Proposal & Application"
    | "Technical Interview"
    | "Community Bonding & Execution";
  technicalDomains: string[];
  topicsCovered: string[];
  outcomeType: "selected_or_winner" | "finalist" | "rejection_and_lessons" | "maintainer_guidance" | "official_guideline";
  hasVerifiedSelectionClaim: boolean;
  difficultySuitability: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  keyTakeaways: string[];
  mistakesAndWarnings: string[];
  recommendedPracticeArenaHref?: string;
  recommendedPracticeArenaLabel?: string;
  transcriptStatus: "verified_captions" | "unavailable" | "not_analyzed" | "not_applicable";
  extractedTranscriptSnippet?: string;
  videoTimestamps?: VideoTimestampSegment[];
  lastVerifiedDate: string;
}

export interface ReconstructedJourney {
  id: string;
  programId: string;
  programYear: number;
  candidateLabel: string;
  sourceResourceIds: string[];
  trustClassification: ExperienceTrustTier;
  startingSkillLevel: string; // Explicit "[Not disclosed in source]" if absent
  startingPoint: string;
  preparationDuration: string;
  learningResourcesUsed: string[];
  projectsBuilt: string[];
  contributionsMade: string[];
  assessmentsAndRounds: string[];
  outcome: string;
  lessonsLearned: string[];
  mappedCognalyzeActions: Array<{ skill: string; arenaHref: string; label: string }>;
}

export interface SourceCoverageReport {
  generatedAt: string;
  totalResources: number;
  verifiedAccessibleCount: number;
  transcriptAnalyzedVideosCount: number;
  byProgram: Record<string, number>;
  byYear: Record<number, number>;
  byFormat: Record<string, number>;
  byStage: Record<string, number>;
  byTrustTier: Record<string, number>;
}


