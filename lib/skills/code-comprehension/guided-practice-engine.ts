/**
 * Code Comprehension Lab — Stage 3: Guided Practice & 4-Tier Progressive Hint Engine
 * 
 * Provides interactive "What-If" scenarios, clickable source-line selection validation,
 * and a 4-tier progressive hint engine that rewards independent problem solving while
 * scaffolding struggling students.
 */

export interface HintTier {
  tierNumber: 1 | 2 | 3 | 4 | 5;
  name: "Direction" | "Concept" | "Evidence" | "Guided Reasoning" | "Complete Solution";
  scorePenaltyPercent: number;
  content: string;
}

export interface WhatIfScenario {
  id: string;
  codebaseId: string;
  title: string;
  category: "security" | "concurrency" | "validation" | "layer_violation" | "state_machine";
  difficulty: "beginner" | "intermediate" | "advanced";
  contextDescription: string;
  targetFile: string;
  targetLineRange: { start: number; end: number };
  question: string;
  promptType: "line_selection" | "multiple_choice" | "hybrid";
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  expectedOutcome: string;
  hints: HintTier[];
}

export const GUIDED_PRACTICE_SCENARIOS: WhatIfScenario[] = [
  {
    id: "whatif-auth-middleware-removed",
    codebaseId: "taskflow-api-v1",
    title: "What If: Authentication Middleware Is Removed?",
    category: "security",
    difficulty: "beginner",
    contextDescription: "In 'src/routes/task.routes.ts', a developer accidentally comments out 'authenticateToken' in router.post('/tasks').",
    targetFile: "src/controllers/task.controller.ts",
    targetLineRange: { start: 28, end: 32 },
    question: "When an unauthenticated HTTP POST /tasks request arrives, exactly which file and line will crash, and with what runtime error?",
    promptType: "hybrid",
    options: [
      {
        id: "opt-crash-typeerror",
        text: "src/controllers/task.controller.ts (lines 28-30) throws 'TypeError: Cannot destructure property organizationId of req.user as it is undefined'.",
        isCorrect: true,
        explanation: "Correct! Because authenticateToken was removed, req.user was never populated. The non-null assertion `req.user!` crashes when destructuring `organizationId`.",
      },
      {
        id: "opt-db-null",
        text: "src/repositories/task.repository.ts inserts a task with organizationId = null.",
        isCorrect: false,
        explanation: "Incorrect. Execution never reaches the repository because the controller crashes synchronously when destructuring req.user.",
      },
      {
        id: "opt-silent-401",
        text: "Express automatically detects missing credentials and returns HTTP 401 Unauthorized.",
        isCorrect: false,
        explanation: "Incorrect. Express has no built-in authentication magic; without middleware, Express blindly invokes the controller handler.",
      },
    ],
    expectedOutcome: "Runtime TypeError crash on req.user dereference due to missing upstream auth boundary.",
    hints: [
      {
        tierNumber: 1,
        name: "Direction",
        scorePenaltyPercent: 5,
        content: "Trace how req.user gets set in the request lifecycle and follow what the controller does in its first few lines.",
      },
      {
        tierNumber: 2,
        name: "Concept",
        scorePenaltyPercent: 10,
        content: "TypeScript's non-null assertion operator ('!') only silences the compiler at build time. It provides zero runtime protection if the value is actually undefined.",
      },
      {
        tierNumber: 3,
        name: "Evidence",
        scorePenaltyPercent: 15,
        content: "Examine src/controllers/task.controller.ts line 29: 'const { organizationId, id: userId } = req.user!;'. What is the value of req.user if auth middleware did not execute?",
      },
      {
        tierNumber: 4,
        name: "Guided Reasoning",
        scorePenaltyPercent: 20,
        content: "Because req.user is undefined, attempting to destructure '{ organizationId }' from undefined throws an unhandled TypeError in Node.js.",
      },
      {
        tierNumber: 5,
        name: "Complete Solution",
        scorePenaltyPercent: 25,
        content: "File: src/controllers/task.controller.ts, line 29. Solution: Always keep authenticateToken in the route chain, and implement an explicit runtime guard `if (!req.user) throw new UnauthorizedError();` before destructuring.",
      },
    ],
  },
  {
    id: "whatif-concurrency-version-check-deleted",
    codebaseId: "taskflow-api-v1",
    title: "What If: Optimistic Concurrency Check Is Omitted?",
    category: "concurrency",
    difficulty: "intermediate",
    contextDescription: "In 'src/repositories/task.repository.ts', a developer deletes the check `if (item.version !== currentVersion)` to 'prevent annoying 409 conflict errors'.",
    targetFile: "src/repositories/task.repository.ts",
    targetLineRange: { start: 70, end: 74 },
    question: "What catastrophic failure mode is introduced into production if this check is eliminated?",
    promptType: "hybrid",
    options: [
      {
        id: "opt-lost-updates",
        text: "Silent Lost Updates: The second concurrent request will blindly overwrite the first request's updates without anyone noticing.",
        isCorrect: true,
        explanation: "Correct! Without optimistic locking or atomic database CAS operations, concurrent writes result in race conditions where the last write silently overwrites earlier writes.",
      },
      {
        id: "opt-deadlock",
        text: "A database transaction deadlock that freezes the Node.js event loop.",
        isCorrect: false,
        explanation: "Incorrect. Removing an in-memory or query comparison does not create a database transaction deadlock.",
      },
      {
        id: "opt-memory-leak",
        text: "A V8 memory leak due to uncollected Promise rejections.",
        isCorrect: false,
        explanation: "Incorrect. There are no uncollected promises involved in version checking.",
      },
    ],
    expectedOutcome: "Silent lost update race conditions across concurrent operations.",
    hints: [
      {
        tierNumber: 1,
        name: "Direction",
        scorePenaltyPercent: 5,
        content: "Consider two users editing the same task simultaneously in different browser tabs.",
      },
      {
        tierNumber: 2,
        name: "Concept",
        scorePenaltyPercent: 10,
        content: "Optimistic concurrency control relies on comparing the entity version at read time with the entity version at write time.",
      },
      {
        tierNumber: 3,
        name: "Evidence",
        scorePenaltyPercent: 15,
        content: "Look at src/repositories/task.repository.ts line 70-74. If item.version is never verified, Client B will overwrite whatever Client A saved moments earlier.",
      },
      {
        tierNumber: 4,
        name: "Guided Reasoning",
        scorePenaltyPercent: 20,
        content: "User A changes status to 'DONE'. User B changes priority to 'LOW' based on stale data. User B's write overwrites status back to 'TODO' or clobbers history silently.",
      },
      {
        tierNumber: 5,
        name: "Complete Solution",
        scorePenaltyPercent: 25,
        content: "File: src/repositories/task.repository.ts, lines 71-73. Solution: Never remove version comparison. In SQL databases, execute: UPDATE tasks SET ... WHERE id = $1 AND version = $2.",
      },
    ],
  },
  {
    id: "whatif-org-scoping-omitted",
    codebaseId: "taskflow-api-v1",
    title: "What If: Organization ID Check Is Omitted from Repository Lookup?",
    category: "security",
    difficulty: "intermediate",
    contextDescription: "In 'src/repositories/task.repository.ts', 'findById' is simplified to `return TaskRepository.store.get(id) || null` without checking item.organizationId.",
    targetFile: "src/repositories/task.repository.ts",
    targetLineRange: { start: 58, end: 65 },
    question: "What security vulnerability does this introduce, and how can an attacker exploit it?",
    promptType: "hybrid",
    options: [
      {
        id: "opt-idor-leak",
        text: "BOLA / IDOR (Broken Object Level Authorization): Any authenticated tenant user can read or modify another corporate tenant's confidential tasks simply by guessing or knowing the task ID.",
        isCorrect: true,
        explanation: "Correct! Without organization scoping on lookups, authorization fails at the object level, exposing private corporate tasks to external tenants.",
      },
      {
        id: "opt-sql-injection",
        text: "SQL Injection: The client can inject SQL keywords through the ID parameter.",
        isCorrect: false,
        explanation: "Incorrect. Removing a tenant comparison in Map or parameterized query does not introduce SQL injection.",
      },
      {
        id: "opt-dos",
        text: "Denial of Service due to hash collision in JavaScript Map.",
        isCorrect: false,
        explanation: "Incorrect. Map lookups remain O(1).",
      },
    ],
    expectedOutcome: "Critical multi-tenant IDOR vulnerability exposing customer data across tenants.",
    hints: [
      {
        tierNumber: 1,
        name: "Direction",
        scorePenaltyPercent: 5,
        content: "Think about multi-tenancy: multiple distinct companies share the same database tables.",
      },
      {
        tierNumber: 2,
        name: "Concept",
        scorePenaltyPercent: 10,
        content: "BOLA (Broken Object Level Authorization), also known as IDOR, is OWASP API #1 vulnerability.",
      },
      {
        tierNumber: 3,
        name: "Evidence",
        scorePenaltyPercent: 15,
        content: "In src/repositories/task.repository.ts line 60, if you remove `if (item.organizationId !== orgId) return null;`, the lookup only cares about task ID.",
      },
      {
        tierNumber: 4,
        name: "Guided Reasoning",
        scorePenaltyPercent: 20,
        content: "If Tenant A user requests GET /tasks/task_secret_99 belonging to Tenant B, the system would gladly return Tenant B's confidential task.",
      },
      {
        tierNumber: 5,
        name: "Complete Solution",
        scorePenaltyPercent: 25,
        content: "File: src/repositories/task.repository.ts, lines 60-63. Solution: Every data lookup must be scoped by BOTH primary key and tenant identifier (id AND organizationId).",
      },
    ],
  },
  {
    id: "whatif-state-transition-bypassed",
    codebaseId: "taskflow-api-v1",
    title: "What If: State Transition Matrix Is Ignored?",
    category: "state_machine",
    difficulty: "advanced",
    contextDescription: "In 'src/services/task.service.ts', a developer bypasses 'VALID_TRANSITIONS' and allows any string to be assigned to status.",
    targetFile: "src/services/task.service.ts",
    targetLineRange: { start: 75, end: 80 },
    question: "What business logic corruption happens when an ARCHIVED task is transitioned directly to IN_PROGRESS?",
    promptType: "hybrid",
    options: [
      {
        id: "opt-invalid-state",
        text: "The state machine invariant is violated: archived or closed tasks can be revived without audit review, corrupting billing and compliance workflows.",
        isCorrect: true,
        explanation: "Correct! The state machine guarantees that tasks only progress through defined lifecycles. Bypassing it allows invalid business transitions.",
      },
      {
        id: "opt-syntax-error",
        text: "The Node runtime throws a SyntaxError.",
        isCorrect: false,
        explanation: "Incorrect. State machine validation is domain logic, not syntax.",
      },
    ],
    expectedOutcome: "Violation of domain invariants and corrupt business lifecycle states.",
    hints: [
      {
        tierNumber: 1,
        name: "Direction",
        scorePenaltyPercent: 5,
        content: "Check VALID_TRANSITIONS definition at the top of src/services/task.service.ts.",
      },
      {
        tierNumber: 2,
        name: "Concept",
        scorePenaltyPercent: 10,
        content: "Domain state machines protect business rules from illegal jumps between states.",
      },
      {
        tierNumber: 3,
        name: "Evidence",
        scorePenaltyPercent: 15,
        content: "Lines 75-80 check `if (!allowed.includes(newStatus))`. Without this, any status can be set.",
      },
      {
        tierNumber: 4,
        name: "Guided Reasoning",
        scorePenaltyPercent: 20,
        content: "An ARCHIVED task might have already generated billing statements or passed audit deadlines. Reviving it violates compliance guarantees.",
      },
      {
        tierNumber: 5,
        name: "Complete Solution",
        scorePenaltyPercent: 25,
        content: "File: src/services/task.service.ts, lines 75-80. Solution: Keep VALID_TRANSITIONS enforced in the domain service layer.",
      },
    ],
  },
];

/**
 * Validate student's clicked or selected source file and line number
 */
export function validateSourceLineSelection(
  scenarioId: string,
  selectedFile: string,
  selectedLine: number
): { isMatch: boolean; feedback: string; proximity: "exact" | "close" | "far" } {
  const scenario = GUIDED_PRACTICE_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) {
    return { isMatch: false, feedback: "Scenario not found", proximity: "far" };
  }

  // Normalize path comparisons
  const normalize = (p: string) => p.replace(/^\.\//, "").replace(/\\/g, "/");
  const isFileMatch = normalize(selectedFile).endsWith(normalize(scenario.targetFile));

  if (!isFileMatch) {
    return {
      isMatch: false,
      feedback: `You selected '${selectedFile}', but the critical failure occurs in '${scenario.targetFile}'.`,
      proximity: "far",
    };
  }

  const { start, end } = scenario.targetLineRange;
  if (selectedLine >= start && selectedLine <= end) {
    return {
      isMatch: true,
      feedback: `Bullseye! Line ${selectedLine} in ${scenario.targetFile} is the exact locus of this behavior.`,
      proximity: "exact",
    };
  }

  // Tolerance of +- 5 lines
  if (Math.abs(selectedLine - start) <= 5 || Math.abs(selectedLine - end) <= 5) {
    return {
      isMatch: true,
      feedback: `Very close! You selected line ${selectedLine}, which is within the target region (${start}-${end}) of ${scenario.targetFile}.`,
      proximity: "close",
    };
  }

  return {
    isMatch: false,
    feedback: `Line ${selectedLine} is in the right file, but look closer to lines ${start}-${end} where the operation is executed.`,
    proximity: "far",
  };
}

/**
 * Request next progressive hint tier
 */
export function getNextHintTier(
  scenarioId: string,
  currentTier: number
): { hint: HintTier | null; totalPenalty: number; remainingPoints: number } {
  const scenario = GUIDED_PRACTICE_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) {
    return { hint: null, totalPenalty: 0, remainingPoints: 100 };
  }

  const nextTierNumber = (currentTier + 1) as 1 | 2 | 3 | 4 | 5;
  const hint = scenario.hints.find((h) => h.tierNumber === nextTierNumber) || null;

  // Calculate cumulative penalty
  const usedHints = scenario.hints.filter((h) => h.tierNumber <= nextTierNumber);
  const totalPenalty = usedHints.reduce((sum, h) => sum + h.scorePenaltyPercent, 0);
  const remainingPoints = Math.max(0, 100 - totalPenalty);

  return { hint, totalPenalty, remainingPoints };
}

