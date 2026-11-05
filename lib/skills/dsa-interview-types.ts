/**
 * lib/skills/dsa-interview-types.ts
 * 
 * Production Data Contracts & Domain Types for the Upgraded DSA Arena Interview Mode.
 * 
 * Supports:
 * - 5, 6, and 7 question configurations
 * - All six mandatory assessment areas:
 *   1. technical_reasoning
 *   2. live_coding
 *   3. debugging
 *   4. code_comprehension
 *   5. complexity_optimization
 *   6. adaptive_followup
 * - Multi-language execution (C++, Python 3, JavaScript, Java)
 * - Persistent question history & repeat prevention ledger
 * - Evidence-backed 100-point scoring dossiers
 */

import { SuiteExecutionSummary } from "./dsa-code-runner";

export type AssessmentArea =
  | "technical_reasoning"
  | "live_coding"
  | "debugging"
  | "code_comprehension"
  | "complexity_optimization"
  | "adaptive_followup";

export type InterviewLength = 5 | 6 | 7;

export type TargetRole = "intern" | "fresher" | "experienced";

export type InterviewDifficulty = "easy" | "medium" | "hard" | "mixed";

export type InterviewType =
  | "technical_screening"
  | "dsa_coding"
  | "debugging_focused"
  | "mixed_assessment";

export type SupportedLanguage = "cpp" | "python" | "javascript" | "java";

export interface CandidateQuestionHistoryEntry {
  candidateId: string;
  questionId: string;
  canonicalId?: string;
  area: AssessmentArea;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  semanticFingerprint: string;
  presentedAt: string;
  sessionId: string;
}

export interface QuestionRubricDimension {
  name: string;
  weight: number; // percentage (e.g. 30 = 30%)
  description: string;
  criteria: Array<{
    scoreThreshold: number;
    description: string;
  }>;
}

export interface BaseInterviewQuestion {
  id: string;
  canonicalId?: string;
  title: string;
  area: AssessmentArea;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  expectedDurationMinutes: number;
  prompt: string;
  rubric: QuestionRubricDimension[];
  semanticFingerprint: string;
  companyProvenance?: {
    company: string;
    role: string;
    confidence: "verified" | "reported" | "pattern_simulation";
  };
}

export interface TechnicalReasoningQuestion extends BaseInterviewQuestion {
  area: "technical_reasoning";
  scenario: string;
  invariantQuestion: string;
  candidateOptions?: string[]; // Optional multiple choice or open defense
  requiredKeyConcepts: string[];
  referenceInvariantExplanation: string;
  edgeCasesToConsider: string[];
}

export interface LiveCodingQuestion extends BaseInterviewQuestion {
  area: "live_coding";
  problemId: string;
  functionName: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterCode: Record<SupportedLanguage, string>;
  publicTestCases: Array<{ id: string; input: string; expected: string; argsJson: string }>;
  hiddenTestCases: Array<{ id: string; input: string; expected: string; argsJson: string; isHidden?: boolean }>;
  referenceSolution: Record<SupportedLanguage, string>;
  optimalComplexity: { time: string; space: string };
}

export interface DebuggingQuestion extends BaseInterviewQuestion {
  area: "debugging";
  bugType: "off_by_one" | "integer_overflow" | "unhandled_edge_case" | "incorrect_base_case" | "pointer_desync" | "graph_cycle" | "state_mutation";
  buggyCode: string;
  buggyLanguage: SupportedLanguage;
  buggyLineNumber?: number;
  observedSymptom: string;
  failingTestCase: {
    input: string;
    expected: string;
    actualFaultyOutput: string;
  };
  correctCode: string;
  rootCauseExplanation: string;
  regressionTestCases: Array<{ id: string; input: string; expected: string; argsJson: string }>;
}

export interface CodeComprehensionQuestion extends BaseInterviewQuestion {
  area: "code_comprehension";
  codeSnippet: string;
  snippetLanguage: SupportedLanguage;
  executionTraceTarget: string; // e.g., "State of pointers (left, right) after iteration 2"
  traceInputs: Array<{
    inputName: string;
    inputValue: string;
    expectedOutput: string;
  }>;
  expectedStateEvolution: Array<{
    step: number;
    description: string;
    variableState: Record<string, string | number>;
  }>;
  recursionDepthLimit?: number;
  referenceExplanation: string;
}

export interface ComplexityQuestion extends BaseInterviewQuestion {
  area: "complexity_optimization";
  codeSnippet: string;
  snippetLanguage: SupportedLanguage;
  expectedTimeComplexity: string;
  expectedSpaceComplexity: string;
  bottleneckExplanation: string;
  optimizationOpportunity: string;
  alternativeApproaches: Array<{
    name: string;
    time: string;
    space: string;
    tradeOff: string;
  }>;
}

export interface AdaptiveFollowUpQuestion extends BaseInterviewQuestion {
  area: "adaptive_followup";
  triggerCondition: "after_brute_force" | "after_edge_case_failure" | "after_optimal_solution" | "general_probe";
  probePrompt: string;
  expectedInsight: string;
  constraintsAdjustment?: string;
}

export type AnyInterviewQuestion =
  | TechnicalReasoningQuestion
  | LiveCodingQuestion
  | DebuggingQuestion
  | CodeComprehensionQuestion
  | ComplexityQuestion
  | AdaptiveFollowUpQuestion;

export interface QuestionCandidateAnswer {
  questionId: string;
  area: AssessmentArea;
  submittedAt: string;
  // Payload variants depending on area
  code?: string;
  language?: SupportedLanguage;
  testResults?: SuiteExecutionSummary;
  // Reasoning & Explanation
  explanation?: string;
  invariantDefense?: string;
  identifiedBugLine?: number;
  identifiedRootCause?: string;
  proposedPatchCode?: string;
  predictedOutput?: string;
  variableTrace?: string;
  submittedTimeComplexity?: string;
  submittedSpaceComplexity?: string;
  optimizationDefense?: string;
  followUpResponse?: string;
}

export interface QuestionEvaluationResult {
  questionId: string;
  title: string;
  area: AssessmentArea;
  weight: number; // max points in 100-pt rubric
  earnedScore: number;
  percentageScore: number;
  verdict: "Mastered" | "Proficient" | "Developing" | "Needs Practice" | "Unattempted";
  evidence: {
    passedPublicTests?: number;
    totalPublicTests?: number;
    passedHiddenTests?: number;
    totalHiddenTests?: number;
    bugIdentifiedAccurately?: boolean;
    traceAccurate?: boolean;
    complexityAccurate?: boolean;
    reasoningSoundness?: "high" | "moderate" | "low" | "none";
  };
  specificFeedback: string;
  actionableGuidance: string;
}

export interface ProctoringTelemetryEvent {
  id: string;
  type: "tab_switch" | "camera_status" | "window_blur";
  timestamp: string;
  details: string;
}

export interface UpgradedFinalScorecard {
  overallScore: number; // 0 to 100
  verdict: "Strong Hire" | "Hire" | "Borderline" | "Needs Practice" | "No Hire";
  rubricVersion: string;
  evaluatedAt: string;
  // Explicit six-area competency scores
  areaCompetencies: {
    technicalReasoning: { score: number; maxPoints: number; evidence: string };
    liveCoding: { score: number; maxPoints: number; evidence: string };
    debugging: { score: number; maxPoints: number; evidence: string };
    codeComprehension: { score: number; maxPoints: number; evidence: string };
    complexityOptimization: { score: number; maxPoints: number; evidence: string };
    adaptiveFollowUp: { score: number; maxPoints: number; evidence: string };
  };
  questionEvaluations: QuestionEvaluationResult[];
  strengths: string[];
  weaknesses: string[];
  curriculumGaps: Array<{
    stepTitle: string;
    topic: string;
    recommendedPracticeIds: string[];
  }>;
  proctoringSummary: {
    tabSwitches: number;
    cameraActive: boolean;
    flagged: boolean;
  };
  interviewerDossierSummary: string;
}

export interface UpgradedDsaInterviewSession {
  sessionId: string;
  candidateId: string;
  targetCompany?: string;
  targetRole: TargetRole;
  difficulty: InterviewDifficulty;
  topics: string[];
  stepId?: string;
  interviewType: InterviewType;
  language: SupportedLanguage;
  questionCount: InterviewLength; // 5, 6, or 7
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  completedAt?: string;
  status: "in_progress" | "completed" | "timed_out" | "incomplete";
  currentQuestionIndex: number;
  questions: AnyInterviewQuestion[];
  answers: Record<string, QuestionCandidateAnswer>;
  proctoringEvents: ProctoringTelemetryEvent[];
  finalScorecard?: UpgradedFinalScorecard;
}
