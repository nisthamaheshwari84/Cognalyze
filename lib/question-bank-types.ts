export type QuestionType =
  | "Coding"
  | "DSA"
  | "MCQ"
  | "Conceptual"
  | "Debugging"
  | "Output prediction"
  | "SQL"
  | "System Design"
  | "AI/ML"
  | "GenAI"
  | "OOP"
  | "DBMS"
  | "Operating Systems"
  | "Computer Networks"
  | "Web Development"
  | "Aptitude"
  | "Logical Reasoning"
  | "HR / Behavioral"
  | "Situational"
  | "Resume-based"
  | "Project-based";

export type CompanyRound =
  | "Online Assessment"
  | "Coding Round"
  | "Technical Round 1"
  | "Technical Round 2"
  | "Technical Round 3"
  | "System Design"
  | "Machine Coding"
  | "Managerial"
  | "HR"
  | "Behavioral"
  | "Group Discussion"
  | "Aptitude"
  | "Other";

export type QuestionSourceType =
  | "Verified Company Question"
  | "Reported Question"
  | "Community-Sourced Question"
  | "AI-Generated Practice Question";

export type QuestionDifficulty = "Easy" | "Medium" | "Hard";

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface QuestionItem {
  id: string;
  title: string;
  question: string;
  type: QuestionType;
  company?: string;
  role?: string;
  round?: CompanyRound;
  domain: string;
  topic: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  sourceType: QuestionSourceType;
  source?: string;
  sourceUrl?: string;
  verified: boolean;
  codeSnippet?: string;
  starterCode?: Record<string, string>; // e.g. python, java, cpp, javascript
  testCases?: TestCase[];
  hints?: string[];
  explanation: string;
  solution: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  tags: string[];
  recommendedForRoles?: string[];
  whyRecommended?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPrepGuide {
  company: string;
  logoText: string;
  overview: string;
  rolesAvailable: string[];
  hiringRounds: {
    round: CompanyRound;
    description: string;
    keyFocusTopics: string[];
    typicalEliminationRate: string;
  }[];
  topicWeightage: { topic: string; percentage: number }[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
  sampleQuestionIds: string[];
}
