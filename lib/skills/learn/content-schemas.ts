/**
 * COGNALYZE DSA LEARN — CONCEPT MASTERY PLATFORM
 * Educational Content Architecture & Schemas (Phase 3)
 * 
 * Defines the 10 Non-Negotiable Educational Layers for every published concept module,
 * the bilingual schema (English & natural conversational Hinglish), interactive visual
 * dry-run simulation schemas, C++20 annotated code schemas, verification rubrics,
 * and publication lifecycle management.
 */

import { ConceptDifficulty, NodeStatus } from "./curriculum-types";

// ============================================================================
// BILINGUAL & MULTI-LINGUAL PRIMITIVES
// ============================================================================

export interface BilingualText {
  en: string;
  hinglish: string;
}

export interface BilingualCodeAnnotation {
  lineNumber: number;
  annotation: BilingualText;
  invariantChecked?: string;
  isCriticalSection?: boolean;
}

// ============================================================================
// LAYER 1: WHY IT EXISTS (GENESIS & MOTIVATION)
// ============================================================================

export interface NaiveApproachComparison {
  title: BilingualText;
  algorithmicIntuition: BilingualText;
  timeComplexity: string;
  spaceComplexity: string;
  bottleneckReason: BilingualText;
  failureScenario: {
    inputExample: string;
    whyItFailsOrTimesOut: BilingualText;
  };
}

export interface EducationalLayer1WhyExists {
  historicalGenesis: BilingualText;
  coreProblemStatement: BilingualText;
  naiveApproaches: NaiveApproachComparison[];
  breakthroughInsight: BilingualText;
  complexityComparisonTable: {
    approachName: string;
    timeComplexity: string;
    spaceComplexity: string;
    scalabilityThreshold: string; // e.g. "N <= 10^3 only", "N <= 10^7"
  }[];
}

// ============================================================================
// LAYER 2: INTUITION & MENTAL MODEL
// ============================================================================

export interface AnalogyItem {
  metaphorTitle: BilingualText;
  narrativeExplanation: BilingualText;
  mappingToAlgorithmicElements: {
    realWorldEntity: string;
    algorithmEquivalent: string;
    roleExplanation: BilingualText;
  }[];
}

export interface EducationalLayer2Intuition {
  highLevelOverview: BilingualText;
  primaryAnalogy: AnalogyItem;
  secondaryAnalogy?: AnalogyItem;
  mentalVisualPrompt: BilingualText;
}

// ============================================================================
// LAYER 3: MATHEMATICAL & ALGORITHMIC INVARIANTS
// ============================================================================

export interface AlgorithmicInvariant {
  name: string;
  formalStatement: string; // LaTeX-compatible formal expression
  plainEnglishExplanation: BilingualText;
  whyItMustHold: BilingualText;
}

export interface EducationalLayer3Invariants {
  preConditions: string[];
  loopInvariants: AlgorithmicInvariant[];
  postConditions: string[];
  inductiveProofBasis: BilingualText;
  invariantPreservationRules: {
    atInitialization: BilingualText;
    duringMaintenance: BilingualText;
    uponTermination: BilingualText;
  };
}

// ============================================================================
// LAYER 4: INTERACTIVE VISUAL DRY-RUN SIMULATION
// ============================================================================

export type ElementVisualState = 
  | "unvisited" 
  | "active" 
  | "comparing" 
  | "included" 
  | "excluded" 
  | "discarded" 
  | "updated" 
  | "sorted" 
  | "highlight";

export interface ArrayElementState {
  index: number;
  value: string | number;
  state: ElementVisualState;
  annotation?: string;
}

export interface PointerState {
  name: string; // e.g. "i", "mid", "low", "high", "curr"
  index: number;
  label?: string;
  color?: "blue" | "emerald" | "amber" | "rose" | "purple" | "cyan";
}

export interface SimulationVariableAccumulator {
  name: string;
  value: string | number | boolean;
  delta?: string; // e.g. "+5", "reset to 0", "swapped"
  isHighlighted?: boolean;
}

export interface SimulationFrame {
  frameIndex: number;
  title: BilingualText;
  codeLineNumber: number;
  explanation: BilingualText;
  arrayState?: ArrayElementState[];
  pointers?: PointerState[];
  variables: SimulationVariableAccumulator[];
  calloutAlert?: {
    type: "info" | "warning" | "success" | "decision";
    message: BilingualText;
  };
}

export interface EducationalLayer4VisualDryRun {
  defaultInputDataset: {
    description: BilingualText;
    data: (string | number)[];
    targetOrConstraint?: string | number;
  };
  stepByStepFrames: SimulationFrame[];
  edgeCaseDataset?: {
    description: BilingualText;
    data: (string | number)[];
    stepByStepFrames: SimulationFrame[];
  };
}

// ============================================================================
// LAYER 5: SOCRATIC GUIDED SELF-DERIVATION
// ============================================================================

export interface SocraticStep {
  stepIndex: number;
  promptQuestion: BilingualText;
  contextSituation: BilingualText;
  thoughtOptions: {
    optionId: string;
    text: BilingualText;
    isOptimalThought: boolean;
    feedback: BilingualText;
  }[];
  hintProgression: {
    level1GentleNudge: BilingualText;
    level2StructuralHint: BilingualText;
    level3BreakthroughReveal: BilingualText;
  };
  socraticResolution: BilingualText;
}

export interface EducationalLayer5SocraticDerivation {
  derivationGoal: BilingualText;
  guidedSteps: SocraticStep[];
  synthesisSummary: BilingualText;
}

// ============================================================================
// LAYER 6: TIME & SPACE COMPLEXITY FORMAL DERIVATION
// ============================================================================

export interface ComplexityProfile {
  notation: string; // e.g. "O(N)", "O(N log N)", "O(1)"
  formalDerivation: BilingualText;
  governingFactors: string[];
}

export interface EducationalLayer6Complexity {
  timeComplexity: {
    bestCase: ComplexityProfile;
    averageCase: ComplexityProfile;
    worstCase: ComplexityProfile;
    amortizedProof?: BilingualText;
  };
  spaceComplexity: {
    auxiliarySpace: ComplexityProfile;
    stackMemorySpace: ComplexityProfile;
    totalWorkingSpace: ComplexityProfile;
    whyLessSpaceIsImpossible: BilingualText;
  };
  scalingBehaviorGraphSummary: {
    inputScaleN: string;
    expectedOperations: string;
    typicalWallClockDuration: string;
  }[];
}

// ============================================================================
// LAYER 7: COMMON PITFALLS, TRAPS & EDGE CASES
// ============================================================================

export interface MistakeTrap {
  trapId: string;
  fearPointRefId?: string; // Cross-references fear-points-registry.ts
  title: BilingualText;
  falseAssumption: BilingualText;
  buggyCodeSnippet: string;
  correctCodeSnippet: string;
  explanationOfFix: BilingualText;
  testCaseThatExposesIt: {
    input: string;
    buggyOutput: string;
    expectedOutput: string;
  };
}

export interface EducationalLayer7CommonPitfalls {
  criticalEdgeCases: {
    edgeCaseName: BilingualText;
    inputScenario: string;
    handlingStrategy: BilingualText;
  }[];
  mistakeTraps: MistakeTrap[];
}

// ============================================================================
// LAYER 8: PATTERN RECOGNITION TRIGGERS
// ============================================================================

export interface PatternTriggerClue {
  clueType: "keyword" | "constraint" | "problem_property" | "subproblem_structure";
  clueDescription: BilingualText;
  examplePhrases: string[];
  algorithmicImplication: BilingualText;
}

export interface EducationalLayer8PatternTriggers {
  primaryTriggers: PatternTriggerClue[];
  constraintSignatures: {
    inputSizeConstraint: string; // e.g. "N <= 10^5"
    compatibleComplexities: string[];
    immediateDeductions: BilingualText;
  }[];
  counterSignals: {
    misleadingClue: BilingualText;
    whyThisAlgorithmFailsHere: BilingualText;
    alternativePatternRecommended: string;
  }[];
}

// ============================================================================
// LAYER 9: CONCEPTUAL VERIFICATION RUBRIC & DIAGNOSTIC QUESTIONING
// ============================================================================

export interface EssentialIdeaCriterion {
  id: string;
  conceptLabel: string;
  semanticExpectation: BilingualText;
  requiredKeywords: string[];
  weightPercentage: number;
}

export interface MisconceptionDetector {
  id: string;
  associatedFearPointId?: string;
  misconceptionLabel: string;
  detectionTriggers: string[]; // Keywords or regex patterns indicating flawed understanding
  remediationAdvice: BilingualText;
}

export interface DiagnosticAssessmentQuestion {
  id: string;
  questionType: "conceptual_explanation" | "code_output_prediction" | "edge_case_trap" | "invariant_check";
  questionPrompt: BilingualText;
  options?: {
    optionId: string;
    text: BilingualText;
    isCorrect: boolean;
    explanation: BilingualText;
  }[];
  correctAnswerSummary?: BilingualText;
  essentialRubricCriteria?: EssentialIdeaCriterion[];
  misconceptionDetectors?: MisconceptionDetector[];
}

export interface EducationalLayer9VerificationRubric {
  minimumPassingMasteryScore: number; // e.g. 80 out of 100
  essentialCoreIdeas: EssentialIdeaCriterion[];
  misconceptionDetectors: MisconceptionDetector[];
  diagnosticQuestions: DiagnosticAssessmentQuestion[];
}

// ============================================================================
// LAYER 10: BRIDGE TO PRACTICE
// ============================================================================

export interface PracticeProblemBridge {
  problemId: string; // Links to Striver 455 or Canonical Problem ID
  title: string;
  striverSheetUrl?: string;
  difficulty: ConceptDifficulty;
  conceptApplicationNotes: BilingualText;
  subtleVariationFromCore: BilingualText;
}

export interface EducationalLayer10BridgeToPractice {
  canonicalPracticeProblems: PracticeProblemBridge[];
  progressionRoadmap: {
    level: "standard" | "variation" | "advanced_application";
    description: BilingualText;
    problemIds: string[];
  }[];
  recommendedImmediateAction: BilingualText;
}

// ============================================================================
// ANNOTATED CODE SNIPPETS SCHEMA
// ============================================================================

export interface AnnotatedCodeSnippet {
  language: "cpp" | "java" | "python" | "javascript";
  standardVersion: string; // e.g. "C++20 (G++ / Clang++)"
  fullSourceCode: string;
  lineAnnotations: BilingualCodeAnnotation[];
  compilationMetadata: {
    testedCompiler: string;
    compilerFlags: string[];
    isVerifiedCompilable: boolean;
  };
}

// ============================================================================
// COMPLETE 10-LAYER LEARNING MODULE
// ============================================================================

export interface LearningModule {
  moduleId: string;
  microConceptId: string;
  subtopicId: string;
  stepId: string;
  title: BilingualText;
  version: string;
  difficulty: ConceptDifficulty;
  estimatedReadTimeMinutes: number;
  status: NodeStatus;
  
  // The 10 Non-Negotiable Educational Layers
  layer1WhyExists: EducationalLayer1WhyExists;
  layer2Intuition: EducationalLayer2Intuition;
  layer3Invariants: EducationalLayer3Invariants;
  layer4VisualDryRun: EducationalLayer4VisualDryRun;
  layer5SocraticDerivation: EducationalLayer5SocraticDerivation;
  layer6Complexity: EducationalLayer6Complexity;
  layer7CommonPitfalls: EducationalLayer7CommonPitfalls;
  layer8PatternTriggers: EducationalLayer8PatternTriggers;
  layer9VerificationRubric: EducationalLayer9VerificationRubric;
  layer10BridgeToPractice: EducationalLayer10BridgeToPractice;
  
  // Implementation Reference
  annotatedCodeSnippets: AnnotatedCodeSnippet[];
  
  // Publication and Review Metadata
  auditMetadata: {
    author: string;
    lastAuditedDate: string;
    verifiedPassCount: number; // 9/9 passes required for "published"
    humanReviewSignoff?: string;
  };
}
