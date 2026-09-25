/**
 * COGNALYZE MENTOR — ADAPTIVE LEARNING SURFACE ENGINE
 * Dynamically constructs and evolves the visual & interactive workspace
 * around the conversation without requiring manual mode buttons.
 * 
 * Supported Surfaces:
 * 1. Concept Surface (Visual trees, call stacks, contextual analogies, prediction checkpoints)
 * 2. Problem-Solving Surface (LeetCode progressive disclosure: problem, constraints, approach, code, tests)
 * 3. Debugging Surface (Code snippet, highlighted line, expected vs actual, variable inspection)
 * 4. System Design Surface (Architecture canvas, dynamic scaling 10x/100x traffic, failure simulations)
 * 5. Interview Surface (Formal interview question, defense probing, rubric calibration, evidence debrief)
 * 6. Visual Explanation Surface (Interactive graph traversal, attention matrix, token flow)
 * 7. Quiz / Prediction Surface (In-flow misconception checks with A/B/C/D option chips)
 */

import {
  LearningSurfaceState,
  LearningSurfaceType,
  IntentAnalysisResult,
  MentorTeachingAction,
  ProgressiveStep,
  ConceptVisualData,
  ProblemWorkspaceData,
  DebuggingWorkspaceData,
  SystemDesignCanvasData,
  InterviewWorkspaceData,
  QuizCheckpointData
} from "./types";
import { PrerequisiteCheckResult } from "./prerequisite-graph";

export interface SurfaceGenerationContext {
  userText: string;
  intent: IntentAnalysisResult;
  teachingAction: MentorTeachingAction;
  previousSurface?: LearningSurfaceState;
  prerequisiteCheck?: PrerequisiteCheckResult;
  activeMisconception?: string;
}

/**
 * Builds the adaptive learning surface state tailored to the current conversational turn.
 */
export function constructAdaptiveLearningSurface(
  context: SurfaceGenerationContext
): LearningSurfaceState {
  const { userText, intent, teachingAction, previousSurface, prerequisiteCheck, activeMisconception } = context;
  const lower = userText.toLowerCase();

  // 1. Determine Surface Type based on Intent & Context
  let surfaceType: LearningSurfaceType = "concept";

  if (
    intent.taskType === "interview_simulation" ||
    intent.intent === "interview" ||
    lower.includes("interview ki tarah") ||
    lower.includes("mock interview")
  ) {
    surfaceType = "interview";
  } else if (
    intent.taskType === "debugging" ||
    intent.intent === "debugging" ||
    lower.includes("why isn't my code working") ||
    lower.includes("wrong output") ||
    lower.includes("500")
  ) {
    surfaceType = "code_debugging";
  } else if (
    intent.taskType === "system_design" ||
    lower.includes("system design") ||
    lower.includes("tinyurl") ||
    lower.includes("instagram") ||
    lower.includes("youtube") ||
    lower.includes("architecture")
  ) {
    surfaceType = "system_design";
  } else if (
    intent.taskType === "problem_solving" ||
    intent.intent === "problem_solving" ||
    previousSurface?.surfaceType === "problem_solving" ||
    lower.includes("leetcode") ||
    lower.includes("spiral matrix") ||
    lower.includes("two sum") ||
    lower.includes("ek question do") ||
    lower.includes("give me a problem")
  ) {
    surfaceType = "problem_solving";
  } else if (
    lower.includes("quiz do") ||
    lower.includes("quiz me") ||
    lower.includes("prediction") ||
    teachingAction === "PREDICT" ||
    activeMisconception
  ) {
    surfaceType = "quiz_prediction";
  } else if (
    intent.taskType === "visual_explanation" ||
    lower.includes("visualize") ||
    lower.includes("diagram") ||
    lower.includes("visual tree")
  ) {
    surfaceType = "visual_interactive";
  } else {
    surfaceType = previousSurface?.surfaceType || "concept";
  }

  // 2. Dispatch to specific surface builders
  switch (surfaceType) {
    case "problem_solving":
      return buildProblemSolvingSurface(context);

    case "code_debugging":
      return buildDebuggingSurface(context);

    case "system_design":
      return buildSystemDesignSurface(context);

    case "interview":
      return buildInterviewSurface(context);

    case "quiz_prediction":
      return buildQuizSurface(context);

    case "visual_interactive":
      return buildVisualInteractiveSurface(context);

    case "concept":
    default:
      return buildConceptSurface(context);
  }
}

// -------------------------------------------------------------
// 1. CONCEPT SURFACE BUILDER
// -------------------------------------------------------------
function buildConceptSurface(context: SurfaceGenerationContext): LearningSurfaceState {
  const { userText, intent, teachingAction } = context;
  const lower = userText.toLowerCase();

  const isRecursion =
    intent.topic.toLowerCase().includes("recursion") ||
    lower.includes("recursion") ||
    context.previousSurface?.title?.toLowerCase().includes("recursion") ||
    context.previousSurface?.conceptVisual?.diagramType === "call_stack";
  const isBinarySearch = intent.topic.toLowerCase().includes("binary search") || lower.includes("binary search");
  const isTransformers = intent.topic.toLowerCase().includes("transformer") || lower.includes("transformer") || lower.includes("attention");

  let conceptVisual: ConceptVisualData;
  let subtitle = "Conceptual Mental Model";

  if (isRecursion) {
    subtitle = "Call Stack & Recursive Self-Similarity";
    conceptVisual = {
      diagramType: "call_stack",
      nodes: [
        { id: "f4", label: "factorial(4)", status: "waiting", value: "4 * factorial(3)" },
        { id: "f3", label: "factorial(3)", status: "waiting", value: "3 * factorial(2)" },
        { id: "f2", label: "factorial(2)", status: "active", value: "2 * factorial(1)" },
        { id: "f1", label: "factorial(1)", status: "waiting", value: "1 (Base Case)" }
      ],
      edges: [
        { from: "f4", to: "f3", label: "calls" },
        { from: "f3", to: "f2", label: "calls" },
        { from: "f2", to: "f1", label: "calls" }
      ],
      activeNodeId: "f2",
      analogySnippet: "Like Russian nesting dolls: each layer asks an identical smaller doll for the answer until the solid core doll (base case) is reached."
    };
  } else if (isBinarySearch) {
    subtitle = "Monotonic Decision Boundary Elimination";
    conceptVisual = {
      diagramType: "pipeline",
      nodes: [
        { id: "left", label: "Left: 0 [val: 2]", status: "completed" },
        { id: "mid", label: "Mid: 3 [val: 11] > Target", status: "active", value: "Discard Right Half" },
        { id: "right", label: "Right: 6 [val: 25]", status: "completed" }
      ],
      activeNodeId: "mid",
      analogySnippet: "Like opening a physical dictionary directly in the middle: if your word starts with 'M' and you open to 'T', you tear away the entire right half without reading it."
    };
  } else if (isTransformers) {
    subtitle = "Multi-Head Self-Attention Token Flow";
    conceptVisual = {
      diagramType: "attention_matrix",
      nodes: [
        { id: "q", label: "Query (Q)", status: "active", value: "What am I looking for?" },
        { id: "k", label: "Key (K)", status: "active", value: "What information do I hold?" },
        { id: "v", label: "Value (V)", status: "active", value: "What content do I provide?" }
      ],
      activeNodeId: "q",
      analogySnippet: "Like searching YouTube: Query is your search phrase, Keys are video tags/titles, and Values are the actual video streams returned."
    };
  } else {
    conceptVisual = {
      diagramType: "pipeline",
      nodes: [
        { id: "n1", label: "Core Invariant", status: "completed" },
        { id: "n2", label: "Application Scenario", status: "active" },
        { id: "n3", label: "Edge Case Boundary", status: "waiting" }
      ],
      activeNodeId: "n2",
      analogySnippet: "Focus on the invariant that holds true across every state change."
    };
  }

  return {
    surfaceType: "concept",
    title: intent.topic,
    subtitle,
    progressiveStep: "problem_understanding",
    conceptVisual,
    quizCheckpoint: {
      question: isRecursion
        ? "Before factorial(1) returns, what does factorial(2) do?"
        : "If the array is unsorted, why does binary search fail?",
      options: isRecursion
        ? [
            { id: "A", text: "It executes the base case directly" },
            { id: "B", text: "It pauses on the call stack waiting for factorial(1) to return" },
            { id: "C", text: "It returns undefined" },
            { id: "D", text: "It terminates the entire program" }
          ]
        : [
            { id: "A", text: "Because we cannot eliminate 50% of the candidates with certainty" },
            { id: "B", text: "Because arrays do not support O(1) random indexing" },
            { id: "C", text: "Because sorting is an O(1) operation" },
            { id: "D", text: "Because pointers cannot be moved backward" }
          ],
      correctOption: isRecursion ? "B" : "A",
      explanation: isRecursion
        ? "Each stack frame remains paused until its inner function returns its evaluated value."
        : "Binary search fundamentally relies on a monotonic decision boundary to discard half the space.",
      conceptId: isRecursion ? "recursion" : "binary_search",
      difficulty: "easy"
    },
    actionPills: [
      { label: "💡 Need a hint?", actionQuery: "Give me a small hint to guide my thinking." },
      { label: "🔄 Explain with Analogy", actionQuery: "Can you explain this using a real-world analogy?" },
      { label: "⚡ Check My Understanding", actionQuery: "Ask me a targeted question to test if I really get this." }
    ]
  };
}

// -------------------------------------------------------------
// 2. PROBLEM-SOLVING (LEETCODE) SURFACE BUILDER
// -------------------------------------------------------------
function buildProblemSolvingSurface(context: SurfaceGenerationContext): LearningSurfaceState {
  const { userText, intent, teachingAction, previousSurface } = context;
  const lower = userText.toLowerCase();

  // Progressive Disclosure Step Progression
  let step: ProgressiveStep = previousSurface?.progressiveStep || "problem_understanding";

  if (lower.includes("test") || lower.includes("edge case") || lower.includes("passed")) {
    step = "testing";
  } else if (
    /\bcode\b/i.test(lower.replace(/leetcode/gi, "")) ||
    lower.includes("implement") ||
    lower.includes("show code") ||
    teachingAction === "APPLY" ||
    teachingAction === "DIRECT_ANSWER"
  ) {
    step = "code";
  } else if (lower.includes("downward") || lower.includes("left") || lower.includes("approach") || lower.includes("hashmap") || lower.includes("o(n)")) {
    step = "approach";
  } else if (lower.includes("constraint") || lower.includes("boundary") || lower.includes("row by row") || lower.includes("scale") || lower.includes("thought") || lower.includes("we can")) {
    step = "constraints";
  }

  const isSpiral =
    intent.topic.toLowerCase().includes("spiral") ||
    lower.includes("59") ||
    lower.includes("spiral") ||
    previousSurface?.title?.toLowerCase().includes("spiral") ||
    previousSurface?.problemWorkspace?.problemId === "59";

  const problemData: ProblemWorkspaceData = isSpiral
    ? {
        problemId: "59",
        title: "LeetCode 59 — Spiral Matrix II",
        difficulty: "Medium",
        description: "Given a positive integer n, generate an n x n matrix filled with elements from 1 to n² in spiral order.",
        examples: [
          { input: "n = 3", output: "[[1,2,3],[8,9,4],[7,6,5]]", explanation: "Follow outer clockwise perimeter then spiral inward." }
        ],
        constraints: ["1 <= n <= 20", "Matrix cells filled sequentially from 1 to n²"],
        suggestedApproach: step === "approach" || step === "code" ? "Maintain 4 boundaries: top, bottom, left, right." : undefined,
        codeStarter:
          step === "code" || step === "testing"
            ? `function generateMatrix(n: number): number[][] {\n  const matrix = Array.from({ length: n }, () => Array(n).fill(0));\n  let top = 0, bottom = n - 1, left = 0, right = n - 1;\n  let val = 1;\n\n  while (top <= bottom && left <= right) {\n    // 1. Traverse top row\n    for (let c = left; c <= right; c++) matrix[top][c] = val++;\n    top++;\n    // 2. Traverse right column\n    for (let r = top; r <= bottom; r++) matrix[r][right] = val++;\n    right--;\n    // 3. Traverse bottom row\n    for (let c = right; c >= left; c--) matrix[bottom][c] = val++;\n    bottom--;\n    // 4. Traverse left column\n    for (let r = bottom; r >= top; r--) matrix[r][left] = val++;\n    left++;\n  }\n  return matrix;\n}`
            : undefined,
        highlightedLine: step === "code" ? 10 : undefined,
        testCases: [
          { input: "n = 1", expected: "[[1]]", status: "passed" },
          { input: "n = 3", expected: "[[1,2,3],[8,9,4],[7,6,5]]", status: "passed" }
        ]
      }
    : {
        title: previousSurface?.problemWorkspace?.title || intent.topic,
        difficulty: previousSurface?.problemWorkspace?.difficulty || "Medium",
        description: previousSurface?.problemWorkspace?.description || `Solve the algorithmic problem for ${intent.topic}. Formulate approach, verify constraints, and write clean code.`,
        examples: previousSurface?.problemWorkspace?.examples || [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }],
        constraints: previousSurface?.problemWorkspace?.constraints || ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        suggestedApproach: previousSurface?.problemWorkspace?.suggestedApproach || "Hashmap complement lookup O(N) time, O(N) space.",
        codeStarter:
          step === "code" || step === "testing"
            ? previousSurface?.problemWorkspace?.codeStarter ||
              `function solve(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`
            : undefined
      };

  return {
    surfaceType: "problem_solving",
    title: problemData.title,
    subtitle: `Step: ${step.toUpperCase().replace("_", " ")}`,
    progressiveStep: step,
    problemWorkspace: problemData,
    quizCheckpoint: {
      question: isSpiral
        ? "When traversing the spiral clockwise, which four boundary pointers are mandatory to prevent overwriting?"
        : "What is the time complexity difference between brute-force nested loops and hashmap lookup?",
      options: isSpiral
        ? [
            { id: "A", text: "top, bottom, left, right" },
            { id: "B", text: "row, col, diagonal, counter" },
            { id: "C", text: "head, tail, mid, pivot" },
            { id: "D", text: "i, j, k, l" }
          ]
        : [
            { id: "A", text: "O(n²) brute-force vs O(n) hashmap" },
            { id: "B", text: "O(n log n) vs O(1)" },
            { id: "C", text: "O(n³) vs O(n²)" },
            { id: "D", text: "They have identical complexity" }
          ],
      correctOption: "A",
      explanation: isSpiral
        ? "Shrinking top, bottom, left, and right after each perimeter traversal guarantees inner boundary isolation."
        : "Hashmap provides O(1) complement lookup, reducing nested iterations from quadratic to linear time.",
      conceptId: isSpiral ? "matrix_boundaries" : "hashmap_lookup",
      difficulty: "medium"
    },
    actionPills: [
      { label: "💡 Need a hint?", actionQuery: "Give me a directional hint for this step." },
      { label: "🛡️ Don't Give Answer", actionQuery: "Guide me through questions, do not give direct code." },
      { label: "📋 Show Solution Code", actionQuery: "I've made my attempt. Show me the optimal solution code." }
    ]
  };
}

// -------------------------------------------------------------
// 3. DEBUGGING SURFACE BUILDER
// -------------------------------------------------------------
function buildDebuggingSurface(context: SurfaceGenerationContext): LearningSurfaceState {
  const { userText, intent } = context;

  const debugData: DebuggingWorkspaceData = {
    language: "typescript",
    codeSnippet: `async function handleUserCheckout(req: Request) {\n  const { userId, cartItems } = await req.json();\n  const user = await db.users.findById(userId);\n  if (!user) throw new NotFoundError("User missing");\n\n  let totalAmount = 0;\n  for (let i = 0; i <= cartItems.length; i++) { // LINE 7: Off-by-one!\n    const item = cartItems[i];\n    totalAmount += item.price * item.quantity;\n  }\n\n  const payment = await stripe.charges.create({ amount: totalAmount });\n  return Response.json({ success: true, paymentId: payment.id });\n}`,
    errorLog: "TypeError: Cannot read properties of undefined (reading 'price') at handleUserCheckout (checkout.ts:8:26) -> HTTP 500",
    expectedOutput: "HTTP 200 OK with payment confirmation",
    actualOutput: "HTTP 500 Internal Server Error (crash on last loop iteration)",
    suspectLine: 7,
    variableInspector: [
      { name: "cartItems.length", expectedValue: "3", actualValue: "3" },
      { name: "i at termination", expectedValue: "2 (last index)", actualValue: "3 (out of bounds)" },
      { name: "cartItems[3]", expectedValue: "N/A", actualValue: "undefined" }
    ],
    hypothesisProbe: "Look closely at line 7: what happens when index i reaches cartItems.length?"
  };

  return {
    surfaceType: "code_debugging",
    title: "Debugging Workspace — Root Cause Isolation",
    subtitle: "Suspect Area: Line 7 (Array Boundary)",
    debuggingWorkspace: debugData,
    quizCheckpoint: {
      question: "Why does line 7 cause a runtime TypeError on line 8?",
      options: [
        { id: "A", text: "i <= cartItems.length accesses an index that is undefined" },
        { id: "B", text: "db.users.findById is asynchronous and unawaited" },
        { id: "C", text: "totalAmount is initialized to 0 instead of null" },
        { id: "D", text: "stripe.charges.create takes string instead of number" }
      ],
      correctOption: "A",
      explanation: "Array indices are 0-indexed. When i === cartItems.length, cartItems[i] evaluates to undefined, causing item.price to throw.",
      conceptId: "off_by_one_boundary",
      difficulty: "easy"
    },
    actionPills: [
      { label: "🔍 Inspect Line 7", actionQuery: "Why is line 7 causing the out-of-bounds error?" },
      { label: "💡 How to Fix", actionQuery: "What is the cleanest way to fix this loop invariant?" }
    ]
  };
}

// -------------------------------------------------------------
// 4. SYSTEM DESIGN SURFACE BUILDER
// -------------------------------------------------------------
function buildSystemDesignSurface(context: SurfaceGenerationContext): LearningSurfaceState {
  const { userText, intent } = context;
  const lower = userText.toLowerCase();

  const is1M = lower.includes("1,000,000") || lower.includes("1m") || lower.includes("scale");

  const canvasData: SystemDesignCanvasData = {
    systemName: intent.topic,
    scaleTier: is1M ? "1M" : "100k",
    trafficQps: is1M ? 16666 : 166,
    activeComponents: [
      { id: "client", name: "Mobile / Web Clients", type: "client", status: "healthy" },
      { id: "lb", name: "Nginx / ALB (Round-Robin)", type: "lb", status: "healthy" },
      { id: "api", name: "Stateless Node Services (x6)", type: "api", status: is1M ? "overloaded" : "healthy" },
      { id: "cache", name: "Redis Cluster (Read Cache)", type: "cache", status: "healthy" },
      { id: "db_master", name: "PostgreSQL Primary Database (Writes)", type: "database", status: is1M ? "bottleneck" : "healthy" },
      { id: "db_replica", name: "PostgreSQL Read Replicas (x3)", type: "database", status: "healthy" }
    ],
    dataFlowEdges: [
      { from: "client", to: "lb", latencyMs: 25 },
      { from: "lb", to: "api", latencyMs: 3 },
      { from: "api", to: "cache", latencyMs: 2 },
      { from: "api", to: "db_master", latencyMs: 45 }
    ],
    currentBottleneck: is1M ? "Single Primary Database Write Throughput & Connection Pool Exhaustion" : undefined,
    activeSimulations: ["Read/Write Ratio: 90:10", "P99 Target: < 100ms"]
  };

  return {
    surfaceType: "system_design",
    title: `${intent.topic} — High-Scale Architecture`,
    subtitle: is1M ? "Traffic Tier: 1,000,000 RPM (Stress State)" : "Traffic Tier: 100,000 RPM (Nominal)",
    systemDesignCanvas: canvasData,
    quizCheckpoint: {
      question: "When writes exceed the IOPS capacity of the single Primary Database, what is the correct architectural remedy?",
      options: [
        { id: "A", text: "Horizontal Sharding / Partitioning based on a Shard Key" },
        { id: "B", text: "Adding 10 more Read Replicas" },
        { id: "C", text: "Increasing Nginx worker connections" },
        { id: "D", text: "Adding an in-memory client-side cache" }
      ],
      correctOption: "A",
      explanation: "Read replicas only scale read throughput. To scale write IOPS, you must partition writes across multiple master shards.",
      conceptId: "sharding_vs_replication",
      difficulty: "hard"
    },
    actionPills: [
      { label: "⚡ 10x Traffic Stress Test", actionQuery: "What happens when traffic surges to 1,000,000 requests per minute?" },
      { label: "💥 Database Master Failure", actionQuery: "How does our system handle failover if the Primary DB crashes?" },
      { label: "🛡️ Introduce Sharding", actionQuery: "How should we shard our database tables?" }
    ]
  };
}

// -------------------------------------------------------------
// 5. INTERVIEW SURFACE BUILDER
// -------------------------------------------------------------
function buildInterviewSurface(context: SurfaceGenerationContext): LearningSurfaceState {
  const { userText, intent } = context;

  const interviewData: InterviewWorkspaceData = {
    role: "Senior Distributed Systems & ML Engineer",
    interviewType: "system_design",
    currentQuestion: "How would you architect a globally distributed rate limiter that enforces a strict 100 req/sec limit per API key without introducing cross-region database latency?",
    questionIndex: 1,
    totalQuestions: 4,
    evaluationRubric: [
      { category: "Technical Accuracy & Trade-offs", score: 85, observation: "Identified in-memory Redis token bucket vs sliding window log." },
      { category: "Scalability & Resilience", score: 80, observation: "Recognized cross-region sync penalty vs eventual consistency trade-off." },
      { category: "Socratic Defense", score: 90, observation: "Defended local synchronization with periodic batch aggregation." }
    ],
    debriefReport: undefined
  };

  return {
    surfaceType: "interview",
    title: "Technical Mock Interview Session",
    subtitle: `Question 1 of 4: Rate Limiter Architecture`,
    interviewWorkspace: interviewData,
    quizCheckpoint: {
      question: "For a distributed rate limiter, which algorithm consumes the least memory per active user?",
      options: [
        { id: "A", text: "Token Bucket / Leaky Bucket (2 integer counters)" },
        { id: "B", text: "Sliding Window Log (stores every timestamp in a sorted set)" },
        { id: "C", text: "Full distributed lock across all nodes" },
        { id: "D", text: "B-Tree disk index" }
      ],
      correctOption: "A",
      explanation: "Token bucket only requires storing the last refill timestamp and current token count, using O(1) memory per key.",
      conceptId: "rate_limiter_algorithms",
      difficulty: "medium"
    },
    actionPills: [
      { label: "🎯 Answer Question", actionQuery: "Here is my proposed approach for the distributed rate limiter:" },
      { label: "⚡ Ask Follow-up Probe", actionQuery: "What follow-up constraint would an interviewer ask next?" },
      { label: "📊 End & View Debrief", actionQuery: "Let's conclude the interview and view my evidence-based evaluation debrief." }
    ]
  };
}

// -------------------------------------------------------------
// 6. VISUAL INTERACTIVE SURFACE BUILDER
// -------------------------------------------------------------
function buildVisualInteractiveSurface(context: SurfaceGenerationContext): LearningSurfaceState {
  const { intent, userText, previousSurface } = context;
  const lower = userText.toLowerCase();

  const isRecursion =
    intent.topic.toLowerCase().includes("recursion") ||
    lower.includes("recursion") ||
    previousSurface?.title?.toLowerCase().includes("recursion") ||
    previousSurface?.conceptVisual?.diagramType === "call_stack";

  if (isRecursion) {
    return buildConceptSurface(context);
  }

  const visualData: ConceptVisualData = {
    diagramType: "graph",
    nodes: [
      { id: "A", label: "Node A (Source)", status: "completed", value: "Dist: 0" },
      { id: "B", label: "Node B", status: "completed", value: "Dist: 1" },
      { id: "C", label: "Node C", status: "active", value: "Dist: 1" },
      { id: "D", label: "Node D", status: "waiting", value: "Dist: 2" },
      { id: "E", label: "Node E (Target)", status: "waiting", value: "Dist: 2" }
    ],
    edges: [
      { from: "A", to: "B", label: "weight: 1" },
      { from: "A", to: "C", label: "weight: 1" },
      { from: "B", to: "D", label: "weight: 1" },
      { from: "C", to: "E", label: "weight: 1" }
    ],
    activeNodeId: "C",
    analogySnippet: "BFS ripples outward like water waves level-by-level, guaranteeing the first time a node is reached is the shortest path in an unweighted graph."
  };

  return {
    surfaceType: "visual_interactive",
    title: "Graph Traversal — Breadth-First Search (BFS) vs Depth-First Search (DFS)",
    subtitle: "Rippling Frontier Queue State",
    conceptVisual: visualData,
    quizCheckpoint: {
      question: "Why does BFS guarantee the shortest path in unweighted graphs, while DFS does not?",
      options: [
        { id: "A", text: "BFS explores all vertices at distance k before any vertex at distance k+1" },
        { id: "B", text: "DFS uses more stack memory than BFS" },
        { id: "C", text: "BFS uses recursion while DFS uses an explicit queue" },
        { id: "D", text: "BFS can only be used on trees, not cyclic graphs" }
      ],
      correctOption: "A",
      explanation: "By processing nodes in FIFO queue order, BFS discovers vertices in strictly non-decreasing order of distance from the source.",
      conceptId: "bfs_shortest_path",
      difficulty: "easy"
    },
    actionPills: [
      { label: "▶ Step to Next Node", actionQuery: "Watch what happens when we pop Node C and queue Node E." },
      { label: "🔄 Switch to DFS", actionQuery: "How would the traversal order change if we used DFS stack instead?" }
    ]
  };
}

// -------------------------------------------------------------
// 7. QUIZ / PREDICTION SURFACE BUILDER
// -------------------------------------------------------------
function buildQuizSurface(context: SurfaceGenerationContext): LearningSurfaceState {
  const { userText, intent, activeMisconception } = context;

  const quiz: QuizCheckpointData = activeMisconception?.includes("sharding")
    ? {
        question: "Misconception Check: What is the fundamental difference between Database Replication and Database Sharding?",
        options: [
          { id: "A", text: "Replication copies identical data for read availability; Sharding splits data across nodes for write capacity" },
          { id: "B", text: "Replication is for SQL databases; Sharding is only for NoSQL databases" },
          { id: "C", text: "Replication increases latency; Sharding eliminates the need for backups" },
          { id: "D", text: "They are identical techniques with different names" }
        ],
        correctOption: "A",
        explanation: "Replicas duplicate data to survive failures and scale reads. Shards partition disjoint rows across multiple nodes to scale write volume.",
        conceptId: "sharding_vs_replication",
        difficulty: "medium",
        targetedMisconception: activeMisconception
      }
    : {
        question: `Adaptive Checkpoint: In ${intent.topic}, which principle guarantees correctness under edge cases?`,
        options: [
          { id: "A", text: "Strict boundary invariant validation before state mutation" },
          { id: "B", text: "Assuming inputs never exceed nominal constraints" },
          { id: "C", text: "Catching all runtime exceptions silently" },
          { id: "D", text: "Running asynchronous background threads without locks" }
        ],
        correctOption: "A",
        explanation: "Verifying invariants before state changes prevents corrupt state from propagating downstream.",
        conceptId: "invariants_and_boundaries",
        difficulty: "easy"
      };

  return {
    surfaceType: "quiz_prediction",
    title: "Adaptive Understanding Checkpoint",
    subtitle: "Misconception Isolation & Concept Transfer",
    quizCheckpoint: quiz,
    actionPills: [
      { label: "💡 Explain Why", actionQuery: "Why is Option A the correct invariant?" },
      { label: "⚡ Increase Difficulty", actionQuery: "Give me a harder follow-up challenge." }
    ]
  };
}
