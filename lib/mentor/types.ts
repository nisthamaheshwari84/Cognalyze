/**
 * COGNALYZE MENTOR — TYPES & INTERFACES
 * Canonical definitions for Learning Twin, Diagnostic Engine, Knowledge Graph,
 * Confusion Detection, Progressive Hint Ladder, and Evidence Records.
 */

export type LanguageCode = "en" | "hi" | "hinglish";

export type TeachingMode = "learn" | "practice" | "challenge" | "interview";

export type TeachingStyle = "simple" | "deep" | "socratic" | "practical";

export type ConceptUnderstanding =
  | "demonstrated"
  | "mostly_understood"
  | "partially_understood"
  | "weak"
  | "unknown"
  | "misconception_detected";

export type TeachingLoopStep =
  | "EXPLAIN"
  | "SHOW"
  | "DO"
  | "EXPLAIN_BACK"
  | "DEFEND"
  | "APPLY"
  | "CHALLENGE"
  | "VERIFY"
  | "COMPLETE";

export type HintLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface LearningGoal {
  id: string;
  title: string;                 // e.g. "Become a Backend Engineer", "Learn System Design"
  domain: string;                // "System Design" | "DSA" | "AI/ML" | "Web Development" | "Cloud"
  timeCommitmentPerWeekHours?: number;
  targetRole?: string;
  priorExperience?: "beginner" | "intermediate" | "advanced";
  preferredLanguage: LanguageCode;
  technicalTermLanguage: "en";   // Technical terms always remain English
  teachingStyle: TeachingStyle;
}

export interface ConceptMastery {
  conceptId: string;
  conceptName: string;
  domain: string;
  status: ConceptUnderstanding;
  attemptsCount: number;
  independentSuccessCount: number;
  hintAssistedSuccessCount: number;
  misconceptionsObserved: string[];
  lastDemonstratedAt?: string;
  confidenceScore: number;       // 0-100 self-reported or inferred
  confidenceAccuracy: "aligned" | "overconfident" | "underconfident" | "uncalibrated";
  evidenceNotes: string[];
}

export interface ConfusionSignal {
  id: string;
  timestamp: string;
  type: "repeated_incorrect" | "re_explanation_request" | "contradiction" | "inability_to_apply" | "guessing";
  conceptId: string;
  triggerSnippet: string;
  resolved: boolean;
}

export interface HintRecord {
  level: HintLevel;
  clue: string;
  description: string;
}

export interface MentorEvidenceRecord {
  id: string;
  studentId: string;
  conceptId: string;
  conceptName: string;
  domain: string;
  demonstratedLevel: "Demonstrated" | "Developing" | "Weak";
  assistanceLevel: "Independent" | "Hint-Assisted" | "Guided";
  hintsUsed: number;
  verbatimExcerpt: string;
  reasoningJustification: string;
  whyExplanation: string;
  createdAt: string;
}

export interface LearningTwinState {
  studentId: string;
  activeGoal: LearningGoal;
  diagnosticCompleted: boolean;
  diagnosticResults?: {
    demonstratedConcepts: string[];
    weakConcepts: string[];
    misconceptions: string[];
    estimatedStartingConcept: string;
  };
  concepts: Record<string, ConceptMastery>;
  activeConceptId: string;
  currentLoopStep: TeachingLoopStep;
  currentMode: TeachingMode;
  dontGiveAnswerMode: boolean;
  currentHintLevel: HintLevel;
  activeConfusionSignal?: ConfusionSignal;
  sessionEvidence: MentorEvidenceRecord[];
  sessionStartedAt: string;
  lastActiveAt: string;
}

export interface KnowledgeGraphNode {
  id: string;
  title: string;
  domain: string;
  prerequisites: string[];       // conceptIds that should be understood first
  coreQuestions: string[];       // Socratic probes for diagnostic or teaching
  commonMisconceptions: {
    misconception: string;
    correctionScenario: string;
  }[];
  practicalChallenge: {
    task: string;
    defensePrompt: string;       // "Why did you choose this approach?"
    constraints: string[];
  };
  hintLadder: {
    level1: string;              // Small conceptual clue
    level2: string;              // Directional clue
    level3: string;              // Approach clue
    level4: string;              // Partial solution / schema / pseudocode
    level5: string;              // Complete architectural or code solution
  };
}

export interface ConversationalMessage {
  id: string;
  role: "user" | "mentor" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    mode?: TeachingMode;
    intent?: MentorIntent;
    topic?: string;
    conceptId?: string;
    loopStep?: TeachingLoopStep;
    hintLevel?: HintLevel;
    confusionDetected?: boolean;
    whyContext?: string;
    isDefenseQuestion?: boolean;
    voiceState?: VoiceState;
    evaluation?: StructuredEvaluationResult;
    teachingAction?: MentorTeachingAction;
    decisionRationale?: string;
    voiceExcerpt?: string;
    visualCanvas?: VisualCanvasPayload;
    learningSurface?: LearningSurfaceState;
    sessionLearningState?: SessionLearningState;
    interruptionContext?: InterruptionContext;
  };
}

export type VoiceState =
  | "IDLE"
  | "LISTENING"
  | "PROCESSING"
  | "RESPONDING"
  | "SPEAKING"
  | "INTERRUPTED"
  | "WAITING_FOR_STUDENT"
  | "ERROR_RECOVERY"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

export interface VisualCanvasPayload {
  type: "code" | "architecture" | "schema" | "equation" | "checklist";
  title: string;
  content: string;
  language?: string;
  highlightSnippet?: string;
}

export type LearningTaskType =
  | "concept_learning"
  | "problem_solving"
  | "debugging"
  | "system_design"
  | "interview_simulation"
  | "project_building"
  | "visual_explanation"
  | "general_inquiry";

export type ExplanationDepthLevel =
  | "L0_intuition"
  | "L1_simple"
  | "L2_example"
  | "L3_visual"
  | "L4_technical_mechanism"
  | "L5_math"
  | "L6_implementation"
  | "L7_tradeoffs";

export type LearningSurfaceType =
  | "concept"
  | "problem_solving"
  | "code_debugging"
  | "system_design"
  | "interview"
  | "visual_interactive"
  | "quiz_prediction"
  | "project";

export type ProgressiveStep =
  | "problem_understanding"
  | "constraints"
  | "approach"
  | "code"
  | "testing"
  | "complexity"
  | "debrief";

export interface ConceptVisualData {
  diagramType: "call_stack" | "tree" | "graph" | "attention_matrix" | "pipeline";
  nodes: { id: string; label: string; status?: "active" | "completed" | "waiting"; value?: string }[];
  edges?: { from: string; to: string; label?: string }[];
  activeNodeId?: string;
  analogySnippet?: string;
}

export interface ProblemWorkspaceData {
  problemId?: string;
  title: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  suggestedApproach?: string;
  codeStarter?: string;
  highlightedLine?: number;
  testCases?: { input: string; expected: string; actual?: string; status?: "passed" | "failed" | "untested" }[];
}

export interface DebuggingWorkspaceData {
  language: string;
  codeSnippet: string;
  errorLog?: string;
  expectedOutput?: string;
  actualOutput?: string;
  suspectLine?: number;
  variableInspector?: { name: string; expectedValue: string; actualValue: string }[];
  hypothesisProbe?: string;
}

export interface SystemDesignCanvasData {
  systemName: string;
  scaleTier: "10k" | "100k" | "1M" | "10M" | "100M";
  trafficQps: number;
  activeComponents: { id: string; name: string; type: "client" | "lb" | "api" | "cache" | "database" | "storage" | "cdn"; status: "healthy" | "overloaded" | "bottleneck" }[];
  dataFlowEdges: { from: string; to: string; latencyMs?: number }[];
  currentBottleneck?: string;
  activeSimulations: string[];
}

export interface InterviewWorkspaceData {
  role: string;
  interviewType: "system_design" | "machine_learning" | "data_structures" | "behavioral";
  currentQuestion: string;
  questionIndex: number;
  totalQuestions: number;
  evaluationRubric: { category: string; score: number; observation: string }[];
  debriefReport?: {
    strengths: string[];
    gaps: string[];
    verbatimHighlights: string[];
    recommendations: string[];
  };
}

export interface QuizCheckpointData {
  question: string;
  options: { id: "A" | "B" | "C" | "D"; text: string }[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  targetedMisconception?: string;
  conceptId: string;
  difficulty: "easy" | "medium" | "hard";
  selectedOption?: "A" | "B" | "C" | "D";
  isResolved?: boolean;
}

export interface ProjectWorkspaceData {
  projectName: string;
  currentMilestone: string;
  architectureNotes: string[];
  tasks: { id: string; task: string; completed: boolean }[];
  currentDecision: string;
}

export interface LearningSurfaceState {
  surfaceType: LearningSurfaceType;
  title: string;
  subtitle?: string;
  progressiveStep?: ProgressiveStep;
  conceptVisual?: ConceptVisualData;
  problemWorkspace?: ProblemWorkspaceData;
  debuggingWorkspace?: DebuggingWorkspaceData;
  systemDesignCanvas?: SystemDesignCanvasData;
  interviewWorkspace?: InterviewWorkspaceData;
  quizCheckpoint?: QuizCheckpointData;
  projectWorkspace?: ProjectWorkspaceData;
  highlightSnippet?: string;
  actionPills?: { label: string; actionQuery: string }[];
}

export interface ResolvedReference {
  rawTerm: string;
  resolvedEntity: string;
  entityType: "visual_element" | "code_line" | "approach" | "domain_concept" | "variable";
  confidence: number;
}

export interface SessionLearningState {
  sessionId: string;
  currentGoal: string;
  currentTopic: string;
  currentSubtopic?: string;
  taskType: LearningTaskType;
  knownConcepts: string[];
  uncertainConcepts: string[];
  activeMisconceptions: string[];
  currentAttempt?: string;
  reasoningQuality: "novice" | "intermediate" | "advanced";
  confidence: number;
  assistanceLevel: AssistancePreference;
  currentDifficulty: "easy" | "medium" | "hard";
  depthLevel: ExplanationDepthLevel;
  preferredExplanationPattern?: string;
  currentLearningObjective: string;
  surfaceState: LearningSurfaceState;
  activeReferences?: ResolvedReference[];
  prerequisiteStack?: string[];
}

export interface InterruptionContext {
  wasInterrupted: boolean;
  interruptedSnippet?: string;
  studentInterruption?: string;
}

export interface SpokenTurnPayload {
  spokenResponse: string;
  visualCanvas?: VisualCanvasPayload;
  learningSurface?: LearningSurfaceState;
  teachingAction: MentorTeachingAction;
  decisionRationale: string;
  waitTimeoutSeconds?: number;
  sessionLearningState?: SessionLearningState;
}

export type MentorIntent =
  | "learning"
  | "problem_solving"
  | "interview"
  | "code_review"
  | "debugging"
  | "project_guidance"
  | "concept_clarification"
  | "revision"
  | "challenge"
  | "time_budgeted"
  | "off_topic";

export type MentorTeachingAction =
  | "ASK"
  | "PROBE"
  | "CLARIFY"
  | "LISTEN"
  | "EXPLAIN"
  | "SIMPLIFY"
  | "REFRAME"
  | "ANALOGY"
  | "EXAMPLE"
  | "COUNTEREXAMPLE"
  | "PREDICT"
  | "HINT"
  | "PARTIAL_HINT"
  | "GUIDE"
  | "CHALLENGE"
  | "APPLY"
  | "PRACTICE"
  | "DEBUG"
  | "SIMULATE"
  | "INTERVIEW"
  | "ASK_TO_EXPLAIN"
  | "ASK_TO_DEFEND"
  | "CORRECT_MISCONCEPTION"
  | "REVISIT_PREREQUISITE"
  | "CONNECT_TO_PRIOR_KNOWLEDGE"
  | "INCREASE_DIFFICULTY"
  | "DECREASE_DIFFICULTY"
  | "SUMMARIZE"
  | "VERIFY"
  | "MOVE_FORWARD"
  | "PAUSE"
  | "STOP"
  | "DIRECT_ANSWER";

export type MentorObservationState =
  | "DEMONSTRATED"
  | "DEVELOPING"
  | "NEEDS_PRACTICE"
  | "NOT_YET_DEMONSTRATED"
  | "INSUFFICIENT_EVIDENCE";

export interface MentorDecisionContext {
  studentIntent: MentorIntent;
  priorDemonstratedCapabilities: string[];
  knownGaps: string[];
  attemptedApproach?: string;
  currentReasoning?: string;
  stuckPoint?: string;
  detectedMisconception?: string;
  selectedAction: MentorTeachingAction;
  minimumInterventionRationale: string;
  nextExpectedStudentAction: string;
}

export type AssistancePreference =
  | "independent"
  | "guided"
  | "hint_only"
  | "no_answers"
  | "solution_requested";

export type TargetDepth =
  | "beginner"
  | "intermediate"
  | "deep_technical"
  | "interview_level";

export interface IntentAnalysisResult {
  intent: MentorIntent;
  taskType?: LearningTaskType;
  depthLevel?: ExplanationDepthLevel;
  topic: string;
  scope: string;
  assistancePreference: AssistancePreference;
  depth: TargetDepth;
  language: LanguageCode;
  timeBudgetMinutes?: number;
  isOffTopic: boolean;
  redirectMessage?: string;
  wantsAnalogy: boolean;
  wantsRealWorldExample: boolean;
  strategyShiftTrigger: boolean;
  forbidDirectAnswer: boolean;
  isThinkingOutLoud?: boolean;
  explicitIntent?: string;
  implicitIntent?: string;
}

export interface SilentStudentContext {
  studentId: string;
  targetRole?: string;
  demonstratedCapabilities: string[];
  assessedCapabilities: string[];
  verifiedProjects: string[];
  knownGaps: string[];
  recentMisconceptions: string[];
  priorExperienceSummary: string;
}

export interface StructuredEvaluationResult {
  concept: string;
  demonstratedState: "demonstrated" | "developing" | "weak" | "insufficient_evidence";
  assistanceLevel: "Independent" | "Hint-Assisted" | "Guided" | "Solution-Revealed";
  hintsUsed: number;
  verbatimExcerpt: string;
  reasoningJustification: string;
  whyExplanation: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  misconceptionObserved?: string;
}

export interface MentorSessionRecord {
  id: string;
  studentId: string;
  title: string;
  domain: string;
  topic?: string;
  intent?: MentorIntent;
  conceptId: string;
  conceptTitle: string;
  mode: TeachingMode;
  language: LanguageCode;
  messages: ConversationalMessage[];
  evidenceGenerated: MentorEvidenceRecord[];
  startedAt: string;
  endedAt?: string;
  status: "active" | "completed";
}

