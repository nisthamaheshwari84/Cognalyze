/**
 * lib/skills/curriculum/types.ts
 * 
 * Core type contracts for the Cognalyze Unified Curriculum and Learning Registry.
 * Implements the canonical hierarchy:
 * Learning → Subject → Chapter → Topic → Subtopic → Learning Experience.
 */

export type CanonicalSubjectSlug =
  | "python"
  | "numpy"
  | "pandas"
  | "visualization"
  | "scikit_learn"
  | "sql"
  | "math_stats"
  | "data_science"
  | "machine_learning"
  | "deep_learning"
  | "artificial_intelligence"
  | "genai_llm"
  | "agentic_ai"
  | "data_engineering"
  | "mlops"
  | "applied_projects"
  | "dsa";

export type SubjectCategory =
  | "Programming & Data Stack"
  | "Data & Databases"
  | "AI & Modern ML"
  | "Algorithms";

export type ExecutionEnvironment =
  | "python_sandbox"
  | "sql_sandbox"
  | "ml_studio"
  | "agent_builder"
  | "visual_tracer"
  | "dsa_runner";

export type VisualDemonstrationType =
  | "memory_graph"
  | "sql_table"
  | "dataframe"
  | "distribution"
  | "training_curve"
  | "rag_pipeline"
  | "agent_dag"
  | "array_pointers";

export type MasteryState =
  | "not_started"
  | "learning"
  | "practising"
  | "needs_review"
  | "provisional_mastery"
  | "demonstrated_mastery"
  | "review_due";

export interface DemonstrationStep {
  stepNumber: number;
  title: string;
  explanation: string;
  codeOrQuery: string;
  outputSummary: string;
}

export interface CoBuildSlot {
  slotId: string;
  instruction: string;
  starterSnippet: string;
  expectedPattern: string;
  hint1: string;
  hint2: string;
  validationExplanation: string;
}

export interface InjectedDebugFault {
  faultId: string;
  title: string;
  buggyCodeOrConfig: string;
  correctCodeOrConfig: string;
  diagnosticHint: string;
  explanation: string;
}

export interface ComprehensionCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface IndependentChallengeTestCase {
  input: string;
  expectedOutput: string;
  description: string;
  isHidden?: boolean;
}

export interface IndependentChallenge {
  challengeId: string;
  title: string;
  description: string;
  starterCode: string;
  solutionCode: string;
  testCases: IndependentChallengeTestCase[];
  rubric: {
    correctness: number;
    codeQuality: number;
    efficiency: number;
  };
}

export interface CanonicalSubtopic {
  id: string;
  slug: string;
  title: string;
  subjectSlug: CanonicalSubjectSlug;
  chapterSlug: string;
  topicSlug: string;
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  canonicalSkill: string; // Key in CANONICAL_SKILL_TAXONOMY
  prerequisites: string[]; // Slugs of prerequisite subtopics

  // ── 1. Understand (Concept & Intuition) ───────────────────────
  learningGoal: string;
  intuitiveStory: string;
  analogy: string;
  formalConcept: string;
  mathFormula?: string; // KaTeX markdown syntax
  productionSignificance: string;

  // ── 2. Demonstrate (Visual & Narrative Demonstration) ─────────
  visualType: VisualDemonstrationType;
  mermaidDiagram: string;
  demonstrationSteps: DemonstrationStep[];
  audioNarrationScript: string;

  // ── 3. Practise (AI Mentor Co-Build) ──────────────────────────
  coBuildSlot: CoBuildSlot;

  // ── 4. Execute & Debug (Real Runtime Sandbox) ──────────────────
  executionEnvironment: ExecutionEnvironment;
  starterCodeOrQuery: string;
  debugFault: InjectedDebugFault;

  // ── 5. Assess & Master (Independent Challenge & Mastery) ──────
  comprehensionChecks: ComprehensionCheckQuestion[];
  independentChallenge: IndependentChallenge;
}

export interface CanonicalTopic {
  slug: string;
  title: string;
  summary: string;
  subtopics: CanonicalSubtopic[];
}

export interface CanonicalChapter {
  slug: string;
  chapterNumber: number;
  title: string;
  description: string;
  topics: CanonicalTopic[];
}

export interface CanonicalSubject {
  slug: CanonicalSubjectSlug;
  name: string;
  icon: string;
  category: SubjectCategory;
  tagline: string;
  description: string;
  estimatedHours: number;
  prerequisites: CanonicalSubjectSlug[];
  chapters: CanonicalChapter[];
}

export interface CurriculumCoverageReport {
  totalSubjects: number;
  totalChapters: number;
  totalTopics: number;
  totalSubtopics: number;
  subjectsBreakdown: Array<{
    subjectSlug: CanonicalSubjectSlug;
    name: string;
    chaptersCount: number;
    topicsCount: number;
    subtopicsCount: number;
    estimatedHours: number;
  }>;
}

