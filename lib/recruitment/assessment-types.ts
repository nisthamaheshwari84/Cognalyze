/**
 * lib/recruitment/assessment-types.ts
 * 
 * Type definitions for company-calibrated modular assessments:
 * Algorithmic Coding, SQL Database, Cognitive Aptitude, and Work Simulation.
 */

export interface AssessmentTestCase {
  id: string;
  description?: string;
  args?: any[];
  stdin?: string;
  expected: any;
  isHidden?: boolean;
}

export interface CodingAssessmentProblem {
  id: string;
  stageId: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
  descriptionMarkdown: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  entryFunction: string;
  starterCode: {
    python: string;
    cpp?: string;
    java?: string;
  };
  testCases: AssessmentTestCase[];
  timeLimitMs: number;
}

export interface SqlAssessmentProblem {
  id: string;
  stageId: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  datasetId: string;
  descriptionMarkdown: string;
  schemaDocumentation: string;
  starterSql: string;
  referenceSql: string;
  expectedColumns: string[];
  strictOrdering: boolean;
  explanation: string;
}

export interface AptitudeQuestion {
  id: string;
  stageId: string;
  section: "quantitative" | "logical" | "verbal" | "core_cs";
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topicTag: string;
}

export interface WorkSimulationScenario {
  id: string;
  stageId: string;
  scenarioTitle: string;
  contextNarrative: string;
  emailsOrChats: Array<{
    sender: string;
    role: string;
    timestamp: string;
    content: string;
  }>;
  decisionPrompt: string;
  options: Array<{
    id: string;
    text: string;
    leadershipPrincipleScore: Record<string, number>; // e.g. { customer_obsession: 1.0, ownership: 0.8 }
    feedback: string;
  }>;
}

export interface StageAssessmentBundle {
  stageId: string;
  companyId: string;
  format: "coding" | "sql" | "aptitude" | "work_simulation" | "case_study" | "interview";
  durationMinutes: number;
  codingProblems?: CodingAssessmentProblem[];
  sqlProblems?: SqlAssessmentProblem[];
  aptitudeQuestions?: AptitudeQuestion[];
  workSimulationScenarios?: WorkSimulationScenario[];
}

export interface StageEvaluationResult {
  stageId: string;
  success: boolean;
  stagePassed: boolean;
  rawScore: number;
  maxScore: number;
  percentageScore: number;
  passingThreshold: number;
  telemetry: Record<string, any>;
  rubricEvaluations: Record<string, number>;
  evaluatorFeedback: string;
}

