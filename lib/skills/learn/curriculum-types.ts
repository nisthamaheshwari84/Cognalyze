/**
 * COGNALYZE DSA LEARN — CONCEPT MASTERY PLATFORM
 * Core Curriculum & Micro-Concept Architecture Types
 * 
 * Multi-Level Hierarchy:
 * Step → Topic → Subtopic → Micro-concept → Learning Unit
 */

export type ConceptDifficulty = "beginner" | "easy" | "medium" | "hard" | "advanced";

export type NodeStatus = "draft" | "verified" | "reviewed" | "published";

export interface LearningUnit {
  id: string;
  microConceptId: string;
  title: string;
  order: number;
  durationMinutes: number;
  interactiveType:
    | "reading"
    | "visual_dryrun"
    | "code_trace"
    | "socratic_derivation"
    | "misconception_check"
    | "prediction";
  learningObjectives: string[];
}

export interface FearPoint {
  fearPointId: string;
  subtopicId: string;
  microConceptId: string;
  title: string;
  difficultyReason: string;
  commonWrongAssumption: string;
  correctExplanation: string;
  recommendedVisual: string;
  verificationQuestionIds: string[];
}

export interface MicroConcept {
  id: string;
  subtopicId: string;
  title: string;
  order: number;
  prerequisites: string[]; // Micro-concept IDs
  difficulty: ConceptDifficulty;
  learningObjectives: string[];
  status: NodeStatus;
  contentVersion: string;
  coverageStatus: "covered" | "in_development" | "planned";
  associatedMisconceptions: string[]; // Fear point IDs
  learningUnits: LearningUnit[];
}

export interface CurriculumSubtopic {
  id: string;
  topicId: string;
  stepId: string;
  title: string;
  order: number;
  prerequisites: string[]; // Subtopic IDs
  difficulty: ConceptDifficulty;
  description: string;
  status: NodeStatus;
  microConcepts: MicroConcept[];
  fearPoints: FearPoint[];
  practiceProblemRefs: string[]; // Striver 455 or Canonical Problem IDs
  striverSheetMapping?: string;
  loveBabbarSheetMapping?: string;
}

export interface CurriculumTopic {
  id: string;
  stepId: string;
  title: string;
  order: number;
  description: string;
  subtopics: CurriculumSubtopic[];
}

export interface CurriculumStep {
  id: string;
  stepNumber: number;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  prerequisiteStepIds: string[];
  topics: CurriculumTopic[];
}

export interface PrerequisiteNode {
  id: string;
  title: string;
  type: "step" | "topic" | "subtopic" | "micro_concept";
  prerequisites: string[];
}

export interface CurriculumCoverageStats {
  totalSteps: number;
  totalTopics: number;
  totalSubtopics: number;
  totalMicroConcepts: number;
  totalFearPoints: number;
  totalLearningUnits: number;
  stepBreakdown: Array<{
    stepNumber: number;
    stepId: string;
    stepTitle: string;
    topicsCount: number;
    subtopicsCount: number;
    microConceptsCount: number;
    fearPointsCount: number;
  }>;
}
