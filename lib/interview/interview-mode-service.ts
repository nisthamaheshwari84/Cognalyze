/**
 * COGNALYZE INTERVIEW SYSTEM — INTERVIEW EXPERIENCE MODE SERVICE
 * 
 * Manages the two distinct interview experiences:
 * 1. INTERVIEW PRACTICE MODE (coaching, selectable hints, explanations, learning recommendations)
 * 2. PROFESSIONAL EVALUATION MODE (strict objective assessment, no hints, recruiter-ready report)
 * 
 * Strict Law: Both modes share the same candidate intelligence, role intelligence,
 * and conversation engine. Only assistance policies and evaluation behavior differ.
 */

export type InterviewExperienceMode = "practice" | "evaluation";

export type HintPreferenceLevel =
  | "no_hints"
  | "subtle_hints"
  | "guided_hints"
  | "explanation";

export interface HintDecision {
  isAllowed: boolean;
  hintLevel: HintPreferenceLevel | "none";
  responseMessage: string;
  isAssisted: boolean;
}

export interface PracticeLearningRecommendation {
  topic: string;
  category: "DSA" | "System Design" | "CS Fundamentals" | "Frameworks" | "Architecture";
  priority: "HIGH" | "MEDIUM" | "LOW";
  observedGap: string;
  suggestedAction: string;
  practiceProblemOrModule?: string;
}

export interface PracticeModeReport {
  overallInterviewSummary: string;
  strongestSkills: string[];
  weakestSkills: string[];
  assistedTurnsCount: number;
  independentTurnsCount: number;
  questionWiseFeedback: Array<{
    turnIndex: number;
    question: string;
    answerExcerpt: string;
    feedback: string;
    modelExplanation?: string;
    wasAssisted: boolean;
    assistanceLevel?: string;
  }>;
  technicalMisconceptions: string[];
  projectExplanationFeedback: string[];
  problemSolvingObservations: string[];
  communicationImprovements: string[];
  personalizedLearningRecommendations: PracticeLearningRecommendation[];
  recommendedCodingPractice: string[];
  nextSteps: string[];
}

export interface ProfessionalEvaluationReport {
  candidateId: string;
  targetRole: string;
  experienceMode: string;
  evaluationMode: "PROFESSIONAL_EVALUATION";
  finalHiringRecommendation:
    | "STRONGLY_RECOMMEND"
    | "RECOMMEND"
    | "FURTHER_EVALUATION_REQUIRED"
    | "NOT_RECOMMENDED";
  recommendationJustification: string;
  confidenceScore: number;
  competencyScores: Record<
    string,
    {
      score: number | null;
      status: string;
      level: string;
      weight: number;
    }
  >;
  technicalStrengths: string[];
  technicalWeaknesses: string[];
  projectOwnershipObservations: string[];
  problemSolvingPerformance: string;
  systemDesignPerformance?: string;
  communicationAssessment: string;
  unassessedCompetencies: string[];
  evidenceReferences: Array<{
    competency: string;
    verbatimQuote: string;
    turnIndex: number;
    hash: string;
  }>;
  interviewLimitations: string[];
}

/**
 * Evaluates whether a hint should be provided and generates the appropriate guidance.
 */
export function handleHintRequest(params: {
  interviewMode: InterviewExperienceMode;
  hintPreference: HintPreferenceLevel;
  currentQuestion: string;
  currentCompetency?: string;
  turnIndex: number;
}): HintDecision {
  const { interviewMode, hintPreference, currentQuestion, currentCompetency, turnIndex } = params;

  // 1. PROFESSIONAL EVALUATION MODE — Strictly no hints or coaching
  if (interviewMode === "evaluation") {
    return {
      isAllowed: false,
      hintLevel: "none",
      responseMessage:
        "In Professional Evaluation Mode, hints and coaching are not permitted to ensure an objective assessment standard. Please share your current understanding or reasoning, or let me know if you would like to move on to the next question.",
      isAssisted: false,
    };
  }

  // 2. PRACTICE MODE — Disabled hints preference
  if (hintPreference === "no_hints") {
    return {
      isAllowed: false,
      hintLevel: "no_hints",
      responseMessage:
        "Hints are currently disabled in your practice session settings. Would you like to share your current thoughts or approach, or should we move forward to the next topic?",
      isAssisted: false,
    };
  }

  // 3. PRACTICE MODE — Contextual hint generation
  const topic = currentCompetency || "this problem";
  const qLower = currentQuestion.toLowerCase();

  let hintText = "";
  if (hintPreference === "subtle_hints") {
    if (qLower.includes("complexity") || qLower.includes("time") || qLower.includes("space")) {
      hintText = `Here's a subtle hint: think about whether a hash table or two-pointer approach could reduce the time complexity from O(n²) to O(n).`;
    } else if (qLower.includes("database") || qLower.includes("query") || qLower.includes("sql") || qLower.includes("index")) {
      hintText = `Here's a subtle hint: consider how an index affects read latency versus write throughput, and whether composite index leftmost prefix ordering applies here.`;
    } else if (qLower.includes("concurrency") || qLower.includes("race") || qLower.includes("lock")) {
      hintText = `Here's a subtle hint: think about optimistic versus pessimistic locking, or whether an atomic compare-and-swap (CAS) operation can avoid deadlocks.`;
    } else if (qLower.includes("cache") || qLower.includes("redis")) {
      hintText = `Here's a subtle hint: consider cache eviction policies (e.g., LRU) and how to prevent cache stampedes or thundering herds.`;
    } else {
      hintText = `Here's a subtle direction: consider the core constraints of ${topic} and how data flows through each step of the pipeline.`;
    }
  } else if (hintPreference === "guided_hints") {
    if (qLower.includes("database") || qLower.includes("schema") || qLower.includes("postgres")) {
      hintText = `Guided hint: 1) Identify the primary key and foreign key relationships; 2) Check if you need an associative junction table for many-to-many cardinality; 3) Add an index on the foreign key column to optimize JOIN performance.`;
    } else if (qLower.includes("tree") || qLower.includes("graph") || qLower.includes("bfs") || qLower.includes("dfs")) {
      hintText = `Guided hint: 1) Consider whether level-order traversal (BFS using a queue) or depth-first recursion fits the search requirement; 2) Track visited nodes to prevent cycles; 3) Handle null or disconnected subgraphs as base cases.`;
    } else {
      hintText = `Guided hint: Step 1: Break down the input and output requirements. Step 2: Formulate the brute-force baseline. Step 3: Identify duplicate work or repeated traversals that can be cached.`;
    }
  } else if (hintPreference === "explanation") {
    hintText = `Conceptual walkthrough: In real-world engineering, this pattern is addressed by decoupling the state storage from compute. For ${topic}, the standard industry solution involves establishing clear boundaries, ensuring idempotency, and validating edge conditions before state mutations. How would you apply this to your implementation?`;
  }

  return {
    isAllowed: true,
    hintLevel: hintPreference,
    responseMessage: hintText,
    isAssisted: true,
  };
}

/**
 * Builds personalized learning recommendations for Practice Mode based on observed performance.
 */
export function generatePracticeLearningPlan(params: {
  weakCompetencies: string[];
  strongCompetencies: string[];
  assistedTurns: number;
  totalTurns: number;
  experienceMode: string;
}): PracticeLearningRecommendation[] {
  const { weakCompetencies, strongCompetencies, assistedTurns, totalTurns, experienceMode } = params;
  const recommendations: PracticeLearningRecommendation[] = [];

  for (const weak of weakCompetencies) {
    const wLower = weak.toLowerCase();
    if (wLower.includes("algorithm") || wLower.includes("data structure") || wLower.includes("dsa") || wLower.includes("problem solving")) {
      recommendations.push({
        topic: "Data Structures & Two-Pointer / Sliding Window Patterns",
        category: "DSA",
        priority: "HIGH",
        observedGap: `Struggled with optimal complexity or edge cases in ${weak}.`,
        suggestedAction: "Practice Striver A2Z DSA Sheet: Step 3 (Arrays & Two Pointers) and Step 7 (Recursion).",
        practiceProblemOrModule: "Longest Substring Without Repeating Characters, 3Sum, Kadane's Algorithm",
      });
    } else if (wLower.includes("database") || wLower.includes("dbms") || wLower.includes("sql") || wLower.includes("postgres")) {
      recommendations.push({
        topic: "Relational Schema Design & Index Optimization",
        category: "CS Fundamentals",
        priority: "HIGH",
        observedGap: `Gaps identified in database constraints, indexing, or transaction isolation.`,
        suggestedAction: "Review PostgreSQL B-Tree Index mechanics and ACID transaction anomalies.",
        practiceProblemOrModule: "Composite Index Ordering & N+1 Query Optimization in Prisma/TypeORM",
      });
    } else if (wLower.includes("system design") || wLower.includes("architecture") || wLower.includes("scalability")) {
      recommendations.push({
        topic: "High-Throughput Systems & Distributed Caching",
        category: "System Design",
        priority: experienceMode === "fresher" ? "MEDIUM" : "HIGH",
        observedGap: `High-level architecture lacked failure domain isolation or cache coherency strategies.`,
        suggestedAction: "Study Cache-Aside pattern, Redis replication, and rate limiter design.",
        practiceProblemOrModule: "Design a Distributed Rate Limiter & URL Shortener with Sharding",
      });
    } else {
      recommendations.push({
        topic: weak,
        category: "Frameworks",
        priority: "MEDIUM",
        observedGap: `Need deeper familiarity with production best practices in ${weak}.`,
        suggestedAction: `Implement a hands-on project utilizing ${weak} with automated integration tests.`,
        practiceProblemOrModule: `Cognalyze Skill Practice: ${weak} Module`,
      });
    }
  }

  // If candidate used significant hints, recommend independent drills
  if (assistedTurns >= 2) {
    recommendations.push({
      topic: "Independent Problem Solving & Debugging Without Hints",
      category: "DSA",
      priority: "HIGH",
      observedGap: `${assistedTurns} of ${totalTurns} turns required interviewer hints to reach solutions.`,
      suggestedAction: "Practice solving technical questions with a strict 20-minute timer without external coaching.",
      practiceProblemOrModule: "Timed Mock Technical Assessment on Cognalyze Practice Arena",
    });
  }

  return recommendations;
}

