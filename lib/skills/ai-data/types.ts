/**
 * lib/skills/ai-data/types.ts
 * 
 * Core domain types and interfaces for the Cognalyze AI, Data & Intelligence Arena.
 * Pure TypeScript definitions safe for import across server and client components.
 */

export type AiDataTrackSlug =
  | "ai_ml"
  | "data_science_analytics"
  | "genai_llm"
  | "data_eng"
  | "mlops"
  | "applied_projects";

export type TargetRoleSlug =
  | "ai_engineer"
  | "ml_engineer"
  | "data_scientist"
  | "data_analyst"
  | "data_engineer"
  | "genai_llm_engineer"
  | "mlops_engineer"
  | "applied_ai_engineer"
  | "nlp_engineer"
  | "cv_engineer";

export type TopicMasteryStatus =
  | "not_started"
  | "learning"
  | "practiced"
  | "assessment_passed"
  | "demonstrated"
  | "mastered_verified";

export type LearningPhaseId =
  | "understand"
  | "observe"
  | "try_code"
  | "comprehend"
  | "practical_lab"
  | "assess"
  | "apply";

export interface LearningPosition {
  subjectId: string;
  moduleId: string;
  topicId: string;
  subtopicId: string;
  phase: LearningPhaseId;
  updatedAt: string;
}

export interface TopicMasteryRecord {
  topicId: string;
  status: TopicMasteryStatus;
  conceptStepsCompleted: string[]; // subtopic IDs where micro-check passed
  codingPassed: boolean;
  comprehensionPassed: boolean;
  labPassed: boolean;
  assessmentScore: number | null;
  assessmentPassed: boolean;
  explanationPassed: boolean;
  weakConcepts: string[];
  remediationRequired: boolean;
  attemptsCount: number;
  exemptedByEvidence: boolean;
  lastUpdatedAt: string;
  verifiedAt?: string;
}

export interface CustomTargetRoleConfig {
  slug: string;
  title: string;
  summary: string;
  requiredSubjectIds: string[];
  requiredSkills: string[];
}

export type QuestionProvenanceType =
  | "verified_historical"
  | "reported_historical"
  | "company_pattern"
  | "public_platform"
  | "cognalyze_simulation";

export type ExerciseType =
  | "code_lab"
  | "sql_lab"
  | "agent_builder"
  | "experiment_studio"
  | "conceptual_challenge"
  | "project_milestone";

export interface TargetRoleProfile {
  slug: TargetRoleSlug;
  title: string;
  badge: string;
  icon: string;
  summary: string;
  typicalCompanies: string[];
  primaryInterviewFormats: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  primaryTrack: AiDataTrackSlug;
  secondaryTracks: AiDataTrackSlug[];
  salaryTier: string;
}

export interface VideoLessonMetadata {
  hasVideo: boolean;
  mediaType: "INTERACTIVE_VISUAL" | "ANIMATED_WALKTHROUGH" | "STATIC_DIAGRAM" | "VIDEO_CLIP";
  durationSeconds: number;
  transcript: string;
  captionUrl?: string;
}

export interface AiDataLesson {
  id: string;
  slug: string;
  trackSlug: AiDataTrackSlug;
  stageNumber: number;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  canonicalSkill: string;
  summary: string;
  contentMarkdown: string;
  exerciseType: ExerciseType;
  provenance: QuestionProvenanceType;
  starterCode?: string;
  starterQuery?: string;
  datasetRef?: string;
  testCases?: Array<{
    id: string;
    description: string;
    input: any;
    expected: any;
    isHidden?: boolean;
  }>;
  solutionSnippet?: string;
  mediaMetadata?: VideoLessonMetadata;
}

export interface AiDataStage {
  stageNumber: number;
  title: string;
  objective: string;
  lessons: AiDataLesson[];
}

export interface AiDataTrack {
  slug: AiDataTrackSlug;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  description: string;
  prerequisites: AiDataTrackSlug[];
  targetRoles: TargetRoleSlug[];
  stages: AiDataStage[];
  estimatedHours: number;
}

export interface StudentArenaAttempt {
  id: string;
  candidateId: string;
  trackSlug: AiDataTrackSlug;
  lessonSlug: string;
  exerciseType: ExerciseType;
  score: number;
  passed: boolean;
  assisted: boolean;
  dimensions?: Record<string, number>;
  executionReport?: {
    totalTests: number;
    passedCount: number;
    executionTimeMs: number;
    errorMessage?: string;
    stdout?: string;
  };
  evidenceDossierId?: string;
  completedAt: string;
}

export interface AiDataArenaSummary {
  candidateId: string;
  selectedRole: TargetRoleSlug;
  completedLessonsCount: number;
  totalLessonsCount: number;
  overallScoreAverage: number;
  verifiedEvidenceCount: number;
  activeTrackSlug: AiDataTrackSlug;
  recentAttempts: StudentArenaAttempt[];
  dnaSkillGaps: Array<{
    skillId: string;
    skillName: string;
    currentLevel: number;
    targetLevel: number;
    gapStatus: "CRITICAL" | "MODERATE" | "ALIGNED";
  }>;
}

