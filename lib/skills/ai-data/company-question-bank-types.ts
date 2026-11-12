/**
 * lib/skills/ai-data/company-question-bank-types.ts
 *
 * Comprehensive Type System for Company-Oriented Question Bank & Practice Engine.
 * Supports:
 * - Minimum 50 questions per topic and subtopic
 * - Provenance tracking (Verified Company-Reported, Public Interview Experience, Company-Style Practice, Industry Standard)
 * - 8 Assessment Patterns (Conceptual, MCQ, Coding, Output Prediction, Debugging, Scenario, Interview, Advanced Problem-Solving)
 * - Complete metadata: hidden test cases, constraints, explanations, time complexity, and adaptive performance metrics.
 */

import { TargetRoleSlug } from "./types";

export type QuestionPatternType =
  | "conceptual"
  | "mcq"
  | "coding"
  | "output_prediction"
  | "debugging"
  | "scenario"
  | "interview"
  | "advanced_problem";

export type QuestionDifficultyLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "interview"
  | "challenge";

export type CompanyStyleClassification =
  | "VERIFIED_REPORTED"
  | "PUBLIC_INTERVIEW_EXP"
  | "COMPANY_STYLE_PRACTICE"
  | "INDUSTRY_STANDARD";

export type VerificationStatus =
  | "VERIFIED"
  | "CANDIDATE_REPORTED"
  | "CURATED_PATTERN";

export interface CompanyTag {
  name: string;
  slug: string;
  interviewYear?: number;
  role?: string;
  frequency?: "HIGH" | "MEDIUM" | "EMERGING";
}

export interface QuestionTestCase {
  input: string;
  output: string;
  explanation?: string;
  isHidden?: boolean;
}

export interface CompanyQuestion {
  id: string;
  subjectId: string;
  moduleId: string;
  topicId: string;
  subtopicId: string;
  questionText: string;
  questionType: QuestionPatternType;
  difficulty: QuestionDifficultyLevel;
  skillsTested: string[];
  relevantCompanies: CompanyTag[];
  companyStyleClassification: CompanyStyleClassification;
  roleRelevance: TargetRoleSlug[];
  sourceUrl?: string;
  sourceVerificationStatus: VerificationStatus;
  expectedTimeMinutes: number;
  prerequisites: string[];
  hints: string[];
  correctAnswer: string;
  detailedExplanation: string;
  evaluationCriteria: string[];
  relatedConcepts: string[];
  
  // MCQ specific
  options?: string[];

  // Code / Debugging / Output Prediction specific
  codeSnippet?: string;
  functionSignature?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string[];
  sampleCases?: QuestionTestCase[];
  hiddenTestCases?: QuestionTestCase[];
  edgeCases?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  referenceSolution?: string;
  alternativeApproaches?: string[];

  // Versioning and Audit
  version: number;
  publishedAt: string;
}

export interface QuestionSubmission {
  candidateId: string;
  questionId: string;
  userAnswer: string;
  timeSpentSeconds: number;
  codeExecutionOutput?: {
    passed: boolean;
    stdout?: string;
    errorMessage?: string;
    testCasesPassed: number;
    totalTestCases: number;
  };
}

export interface QuestionAttemptRecord {
  id: string;
  candidateId: string;
  questionId: string;
  topicId: string;
  subtopicId: string;
  questionType: QuestionPatternType;
  difficulty: QuestionDifficultyLevel;
  userAnswer: string;
  isCorrect: boolean;
  scoreAwarded: number; // 0 - 100
  timeSpentSeconds: number;
  attemptedAt: string;
  feedback: string;
}

export interface SubtopicQuestionBankSummary {
  subtopicId: string;
  subtopicTitle: string;
  topicId: string;
  subjectId: string;
  totalQuestions: number;
  byPattern: Record<QuestionPatternType, number>;
  byDifficulty: Record<QuestionDifficultyLevel, number>;
  topCompanies: string[];
}

export interface CandidatePracticeAnalytics {
  candidateId: string;
  totalAttempted: number;
  totalSolved: number;
  totalIncorrect: number;
  overallAccuracyPercent: number;
  averageTimeSpentSeconds: number;
  difficultyAccuracy: Record<QuestionDifficultyLevel, { attempted: number; solved: number; accuracy: number }>;
  typeAccuracy: Record<QuestionPatternType, { attempted: number; solved: number; accuracy: number }>;
  weakConcepts: Array<{ concept: string; failureCount: number; recommendedSubtopicId: string }>;
  repeatedMistakes: Array<{ questionId: string; failureCount: number; topicId: string }>;
  bookmarkedQuestionIds: string[];
}

export interface AdaptivePracticeRecommendation {
  id: string;
  subtopicId: string;
  subtopicTitle: string;
  topicId: string;
  subjectId: string;
  rationale: string;
  urgency: "HIGH" | "MEDIUM" | "MAINTENANCE";
  focusArea: "concept" | "code_execution" | "debugging" | "speed";
  targetQuestionIds: string[];
}

