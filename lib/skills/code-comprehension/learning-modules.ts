/**
 * lib/skills/code-comprehension/learning-modules.ts
 * 
 * Interactive Micro-Learning Engine for Cognalyze Code Comprehension Lab (Stage 1).
 * Features:
 * - 16 structured micro-lessons across 4 core engineering modules (~4 per module)
 * - Concise, bite-sized screens (<= 80 words per lesson screen)
 * - Immediate interactive exercise per micro-lesson (exercise embedded with the concept)
 * - Contextual feedback addressing specific misconceptions, progressive hints, and persistence
 */

export interface MicroLessonOption {
  id: string;
  text: string;
  isCorrect: boolean;
  misconceptionExplanation?: string;
  successExplanation?: string;
}

export interface MicroLessonExercise {
  id: string;
  prompt: string;
  exerciseType: "select_entrypoint" | "identify_bug" | "trace_call_order" | "multiple_choice" | "boundary_check";
  options: MicroLessonOption[];
  hints: string[];
}

export interface LessonNarration {
  intro: string;
  whyItMatters: string;
  analogy: string;
  codeWalkthrough: string;
  internals: string;
  checkpointPrompt: string;
  recap: string;
  fullSpokenScript: string;
}

export interface MicroLesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  conceptTag: string;
  durationSeconds: number; // 60 - 90 seconds
  biteExplanation: string; // <= 80 words strictly enforced
  codeSnippet: string;
  exercise: MicroLessonExercise;
  analogy?: string;
  fullNarration?: LessonNarration;
}

export function getLessonNarration(lesson: MicroLesson): LessonNarration {
  if (lesson.fullNarration) return lesson.fullNarration;

  const intro = `Welcome to this lesson on "${lesson.title}". As software engineers, understanding this concept is essential for navigating real production codebases.`;
  const why = `Why does this matter in real engineering? Without mastering ${lesson.title.toLowerCase()}, developers waste hours searching through thousands of files or introduce subtle runtime bugs when deploying changes.`;
  const analogy = lesson.analogy || `Think of this like an index in a large reference textbook: rather than reading every single page from cover to cover, you use structured entry funnels to jump directly to the relevant chapter.`;
  const walkthrough = `Let's inspect the code snippet shown on your screen. Notice how the logic is structured to isolate responsibility and ensure predictable execution flow.`;
  const internals = `Under the hood, the runtime initializes this module when the server process starts, setting up memory pointers and registering handlers before processing any incoming traffic.`;
  const checkpoint = lesson.exercise.prompt;
  const recap = `Key takeaway: Always follow structured architectural patterns rather than guessing where execution begins or state mutates.`;

  const full = `${intro} ${why} ${analogy} ${walkthrough} ${internals} Let's verify your understanding: ${checkpoint}`;

  return {
    intro,
    whyItMatters: why,
    analogy,
    codeWalkthrough: walkthrough,
    internals,
    checkpointPrompt: checkpoint,
    recap,
    fullSpokenScript: full,
  };
}

export interface FoundationalModule {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  totalDurationMins: number;
  microLessons: MicroLesson[];
}

export type LearningModule = FoundationalModule;

export const FOUNDATIONAL_LEARNING_MODULES: FoundationalModule[] = [
  // ===========================================================================
  // MODULE 1: HOW TO READ PRODUCTION CODE (4 Micro-Lessons)
  // ===========================================================================
  {
    id: "module-1-read-code",
    order: 1,
    title: "How to Read Production Code",
    subtitle: "Locate entry points, map project layouts, and trace chronological control flow vs mutable data flow.",
    totalDurationMins: 6,
    microLessons: [
      {
        id: "lesson-1-1-entrypoint",
        moduleId: "module-1-read-code",
        order: 1,
        title: "Finding the Top of the Funnel: Entry Points",
        conceptTag: "entry_points",
        durationSeconds: 75,
        biteExplanation:
          "Never read code alphabetically. Production services start at dedicated entry points: HTTP servers in server.ts or app/main.py, route manifests in routes/*.ts, and workers in queue listeners. Trace from this funnel downward.",
        codeSnippet: `// package.json -> "scripts": { "start": "node dist/server.js" }
// src/server.ts:
import express from "express";
import { taskRouter } from "./routes/task.routes";
export const app = express();
app.use("/api/v1/tasks", taskRouter); // Entry routing funnel`,
        exercise: {
          id: "ex-1-1",
          prompt: "In a production Node/Express repository, where does an incoming HTTP POST request first get dispatched after leaving server.ts?",
          exerciseType: "select_entrypoint",
          options: [
            {
              id: "opt-1-1-a",
              text: "Through the route router file (e.g., routes/task.routes.ts) matching the route path.",
              isCorrect: true,
              successExplanation: "Correct! The server delegates the path to the mounted router, which executes middleware and controllers.",
            },
            {
              id: "opt-1-1-b",
              text: "Directly into the SQL database trigger.",
              isCorrect: false,
              misconceptionExplanation: "Databases do not process HTTP requests directly; the application layer routes and parses them first.",
            },
            {
              id: "opt-1-1-c",
              text: "Inside the package.json dependency manifest.",
              isCorrect: false,
              misconceptionExplanation: "package.json defines project dependencies and start scripts, not runtime route handlers.",
            },
          ],
          hints: ["Consider how Express mounts sub-routers with app.use('/api/v1/tasks', router)."],
        },
      },
      {
        id: "lesson-1-2-project-layout",
        moduleId: "module-1-read-code",
        order: 2,
        title: "Layered Project Directory Layout",
        conceptTag: "directory_layout",
        durationSeconds: 70,
        biteExplanation:
          "Standard production architectures separate concerns into distinct directories: /controllers handle HTTP input and status codes; /services enforce business invariants; /repositories manage database mutations.",
        codeSnippet: `src/
├── controllers/ # HTTP adapters (req, res unmarshaling)
├── services/    # Pure domain logic & invariants
├── repositories/# SQL / DB persistence queries
└── middleware/  # Cross-cutting token & auth filters`,
        exercise: {
          id: "ex-1-2",
          prompt: "If you need to change how user permissions or task status transitions are calculated, which folder should you inspect?",
          exerciseType: "multiple_choice",
          options: [
            {
              id: "opt-1-2-a",
              text: "src/services (domain business logic & state transitions)",
              isCorrect: true,
              successExplanation: "Correct! Domain invariants and state machines belong strictly in domain services.",
            },
            {
              id: "opt-1-2-b",
              text: "src/controllers (Express request handler)",
              isCorrect: false,
              misconceptionExplanation: "Controllers should only unmarshal parameters and format HTTP responses, not contain domain invariants.",
            },
            {
              id: "opt-1-2-c",
              text: "src/public (static frontend assets)",
              isCorrect: false,
              misconceptionExplanation: "Public folders hold static assets (images/CSS), not server business logic.",
            },
          ],
          hints: ["Look for the folder responsible for business invariants independent of HTTP transport."],
        },
      },
      {
        id: "lesson-1-3-control-vs-data-flow",
        moduleId: "module-1-read-code",
        order: 3,
        title: "Control Flow vs. Data Flow",
        conceptTag: "control_vs_data_flow",
        durationSeconds: 80,
        biteExplanation:
          "Control flow is who calls whom chronologically. Data flow is how an object mutates as it travels. Bugs frequently occur where helper functions mutate variables in-place without the control flow making it obvious.",
        codeSnippet: `// Control Flow: router -> controller -> service
// Data Flow: rawBody -> sanitizedDTO -> TaskEntity -> ResponseJSON
const task = await taskService.create({
  title: req.body.title.trim(), // Data transformation
  orgId: req.user.organizationId // Sourced from verified token
});`,
        exercise: {
          id: "ex-1-3",
          prompt: "Why is tracking data flow critical when investigating a multi-tenant data leak?",
          exerciseType: "boundary_check",
          options: [
            {
              id: "opt-1-3-a",
              text: "To verify that organizationId originates from the cryptographically verified token rather than an unverified client body.",
              isCorrect: true,
              successExplanation: "Correct! Data flow tracing guarantees trusted provenance for sensitive tenant identifiers.",
            },
            {
              id: "opt-1-3-b",
              text: "To ensure that JavaScript runs faster in the V8 engine.",
              isCorrect: false,
              misconceptionExplanation: "Data flow tracking is a correctness and security practice, not a JIT speed optimization.",
            },
          ],
          hints: ["Ask yourself: where did the tenant ID originate?"],
        },
      },
      {
        id: "lesson-1-4-trust-boundaries",
        moduleId: "module-1-read-code",
        order: 4,
        title: "Trust Boundaries & Input Ingestion",
        conceptTag: "trust_boundaries",
        durationSeconds: 75,
        biteExplanation:
          "External input (headers, query params, request bodies) is inherently untrusted. A trust boundary is the exact line of code where input is validated and sanitized (e.g. Zod schema) before entering domain services.",
        codeSnippet: `// Trust Boundary: Reject unvalidated external input immediately
export const createTaskSchema = z.object({
  title: z.string().min(3).max(100),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"])
});
const validated = createTaskSchema.parse(req.body);`,
        exercise: {
          id: "ex-1-4",
          prompt: "What happens if a domain service directly consumes req.body without schema validation?",
          exerciseType: "multiple_choice",
          options: [
            {
              id: "opt-1-4-a",
              text: "Malicious users can inject unexpected properties, prototype pollution, or invalid enum values that crash services or bypass auth.",
              isCorrect: true,
              successExplanation: "Correct! Crossing trust boundaries without runtime validation leads to injection and prototype pollution.",
            },
            {
              id: "opt-1-4-b",
              text: "The browser will automatically terminate the user's internet connection.",
              isCorrect: false,
              misconceptionExplanation: "Browsers do not inspect server domain boundaries.",
            },
          ],
          hints: ["Think about what prevents an attacker from sending arbitrary JSON fields."],
        },
      },
    ],
  },

  // ===========================================================================
  // MODULE 2: ENGINEERING DEBUGGING METHODOLOGY (4 Micro-Lessons)
  // ===========================================================================
  {
    id: "module-2-debugging",
    order: 2,
    title: "Engineering Debugging Methodology",
    subtitle: "Execute the 6-stage scientific debugging cycle: Reproduce, Isolate, Hypothesize, Investigate, Verify, and Prevent.",
    totalDurationMins: 6,
    microLessons: [
      {
        id: "lesson-2-1-reproducibility",
        moduleId: "module-2-debugging",
        order: 1,
        title: "Deterministic Bug Reproduction",
        conceptTag: "reproducibility",
        durationSeconds: 70,
        biteExplanation:
          "Never attempt a code patch until you have a minimal failing automated test that reliably reproduces the failure. If you cannot reproduce the issue on demand, you cannot prove that your patch fixed it.",
        codeSnippet: `// Golden Rule: Automated minimal failing test first
test("fails on concurrent status update", async () => {
  const t1 = service.updateStatus(id, "IN_PROGRESS", 1);
  const t2 = service.updateStatus(id, "DONE", 1); // Stale version 1
  await expect(Promise.all([t1, t2])).rejects.toThrow("Concurrency conflict");
});`,
        exercise: {
          id: "ex-2-1",
          prompt: "What is the primary danger of fixing code based on intuition before writing a reproduction test?",
          exerciseType: "multiple_choice",
          options: [
            {
              id: "opt-2-1-a",
              text: "You may mask the symptom without fixing the underlying root cause, leading to silent regressions later.",
              isCorrect: true,
              successExplanation: "Correct! Intuition patches often suppress errors rather than curing the root architectural flaw.",
            },
            {
              id: "opt-2-1-b",
              text: "Git will reject the commit automatically.",
              isCorrect: false,
              misconceptionExplanation: "Git does not know whether a patch was written before or after a test.",
            },
          ],
          hints: ["Consider what happens when you treat symptoms rather than causes."],
        },
      },
      {
        id: "lesson-2-2-stack-traces",
        moduleId: "module-2-debugging",
        order: 2,
        title: "Reading Stack Traces & Error Logs",
        conceptTag: "stack_traces",
        durationSeconds: 75,
        biteExplanation:
          "Start from the top of the stack trace to identify the exact file and line where the exception exploded. Then trace backward to find where invalid state was initially introduced.",
        codeSnippet: `TypeError: Cannot read properties of undefined (reading 'organizationId')
    at TaskController.createTask (src/controllers/task.controller.ts:18:24)
    at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
// Root Cause: req.user was undefined because auth middleware was omitted!`,
        exercise: {
          id: "ex-2-2",
          prompt: "In the stack trace above, where should you investigate to solve the root cause?",
          exerciseType: "identify_bug",
          options: [
            {
              id: "opt-2-2-a",
              text: "The route definition to check whether authenticateToken middleware was applied before the controller.",
              isCorrect: true,
              successExplanation: "Correct! The controller exploded because upstream auth middleware failed to populate req.user.",
            },
            {
              id: "opt-2-2-b",
              text: "node_modules/express/lib/router/layer.js",
              isCorrect: false,
              misconceptionExplanation: "Express internal libraries are rarely the bug; focus on your application code.",
            },
          ],
          hints: ["Why was req.user undefined in the controller?"],
        },
      },
      {
        id: "lesson-2-3-root-cause-vs-symptom",
        moduleId: "module-2-debugging",
        order: 3,
        title: "Root Cause vs. Symptom Suppression",
        conceptTag: "symptom_suppression",
        durationSeconds: 80,
        biteExplanation:
          "Symptom suppression is adding optional chaining (req.user?.organizationId ?? 'default') to silence an error. This creates critical security holes. Always fix root causes upstream at the authorization gateway.",
        codeSnippet: `// ❌ BAD: Symptom suppression (grants unauthenticated access!)
const orgId = req.user?.organizationId || "public_tenant";

// ✅ GOOD: Root cause fix (enforces invariant)
if (!req.user) throw new UnauthorizedError("Authentication required");`,
        exercise: {
          id: "ex-2-3",
          prompt: "Why is fallback defaulting `req.user?.orgId || 'default'` considered a catastrophic anti-pattern?",
          exerciseType: "boundary_check",
          options: [
            {
              id: "opt-2-3-a",
              text: "It allows unauthenticated attackers to read or write data inside the fallback tenant account.",
              isCorrect: true,
              successExplanation: "Correct! Suppressing auth errors exposes fallback data to unauthorized access.",
            },
            {
              id: "opt-2-3-b",
              text: "It causes the CSS stylesheet to fail to load.",
              isCorrect: false,
              misconceptionExplanation: "CSS loading is completely unrelated to server auth scoping.",
            },
          ],
          hints: ["What tenant does an attacker belong to when req.user is undefined?"],
        },
      },
      {
        id: "lesson-2-4-race-conditions",
        moduleId: "module-2-debugging",
        order: 4,
        title: "State Mutations & Race Conditions",
        conceptTag: "race_conditions",
        durationSeconds: 80,
        biteExplanation:
          "When two concurrent async operations read the same database row before either writes, one update gets silently lost. Optimistic Concurrency Control (OCC) uses a version counter to reject stale writes.",
        codeSnippet: `// Optimistic Concurrency Check:
UPDATE tasks 
SET status = $1, version = version + 1 
WHERE id = $2 AND version = $3;
// If rowsAffected === 0 -> 409 Conflict (Stale Write Detected)`,
        exercise: {
          id: "ex-2-4",
          prompt: "What condition indicates that a concurrent write collided with another transaction in OCC?",
          exerciseType: "multiple_choice",
          options: [
            {
              id: "opt-2-4-a",
              text: "The UPDATE query returns 0 affected rows because the version number was already incremented by another process.",
              isCorrect: true,
              successExplanation: "Correct! When rowsAffected is 0, the client held a stale version and must retry.",
            },
            {
              id: "opt-2-4-b",
              text: "The database server CPU reaches 100% permanently.",
              isCorrect: false,
              misconceptionExplanation: "OCC uses simple integer checks; it does not overload the CPU.",
            },
          ],
          hints: ["Look at the WHERE version = $3 clause."],
        },
      },
    ],
  },

  // ===========================================================================
  // MODULE 3: PRODUCTION SYSTEM ARCHITECTURE & LAYER BOUNDARIES (4 Micro-Lessons)
  // ===========================================================================
  {
    id: "module-3-architecture",
    order: 3,
    title: "Production System Architecture & Layer Boundaries",
    subtitle: "Differentiate Client, Gateway, Middleware, Controllers, Services, and Repositories to prevent boundary leaks.",
    totalDurationMins: 6,
    microLessons: [
      {
        id: "lesson-3-1-dependency-inversion",
        moduleId: "module-3-architecture",
        order: 1,
        title: "The Dependency Inversion Rule",
        conceptTag: "layer_boundaries",
        durationSeconds: 75,
        biteExplanation:
          "Domain services must remain storage- and transport-agnostic. Never import Express Request or raw SQL pools inside a domain service. Pass clean DTOs so business logic can be tested in isolation.",
        codeSnippet: `// ❌ Layer Leak: Domain service importing HTTP transport
class TaskService { async createTask(req: express.Request) { ... } }

// ✅ Clean Boundary: Service accepts pure DTO
class TaskService { async createTask(dto: CreateTaskDTO): Promise<Task> { ... } }`,
        exercise: {
          id: "ex-3-1",
          prompt: "Why should domain services never receive the Express `req` object directly?",
          exerciseType: "multiple_choice",
          options: [
            {
              id: "opt-3-1-a",
              text: "It couples domain logic to the HTTP transport layer, making it impossible to reuse in CLI tools, workers, or unit tests.",
              isCorrect: true,
              successExplanation: "Correct! Transport agnosticism allows services to be executed from queues, lambdas, or tests without mocking Express.",
            },
            {
              id: "opt-3-1-b",
              text: "Express objects cannot be compiled by TypeScript.",
              isCorrect: false,
              misconceptionExplanation: "TypeScript easily types Express objects; the issue is architectural coupling.",
            },
          ],
          hints: ["Can a background worker provide an Express request object?"],
        },
      },
      {
        id: "lesson-3-2-middleware-chains",
        moduleId: "module-3-architecture",
        order: 2,
        title: "Middleware Interception & Pipeline Order",
        conceptTag: "middleware_pipeline",
        durationSeconds: 70,
        biteExplanation:
          "Express middleware executes in strict registration order. If an authorization guard is mounted after route handlers, or if error-handling middleware lacks 4 arguments (err, req, res, next), the pipeline fails open.",
        codeSnippet: `// Correct Middleware Order:
app.use(express.json());       // 1. Parse body
app.use(authenticateToken);    // 2. Verify identity
app.use("/api/tasks", router); // 3. Dispatch routes
app.use(errorHandler);         // 4. Global error handler`,
        exercise: {
          id: "ex-3-2",
          prompt: "What happens if a route handler is registered BEFORE the `authenticateToken` middleware?",
          exerciseType: "multiple_choice",
          options: [
            {
              id: "opt-3-2-a",
              text: "The route executes without authentication, allowing unverified public access.",
              isCorrect: true,
              successExplanation: "Correct! Middleware only intercepts routes declared after its registration.",
            },
            {
              id: "opt-3-2-b",
              text: "Express throws a syntax compilation error.",
              isCorrect: false,
              misconceptionExplanation: "Express allows any registration order; it is a logical runtime security bug.",
            },
          ],
          hints: ["Express processes middleware sequentially from top to bottom."],
        },
      },
      {
        id: "lesson-3-3-repository-pattern",
        moduleId: "module-3-architecture",
        order: 3,
        title: "The Repository Pattern & Query Isolation",
        conceptTag: "repository_pattern",
        durationSeconds: 80,
        biteExplanation:
          "Repositories encapsulate all SQL and database interactions behind clean method contracts (findById, create, update). This allows changing databases or caching without altering domain services.",
        codeSnippet: `export interface ITaskRepository {
  findById(id: string, orgId: string): Promise<Task | null>;
  create(task: Task): Promise<Task>;
}
// Domain service calls repository, completely unaware of SQL/ORM details!`,
        exercise: {
          id: "ex-3-3",
          prompt: "In a multi-tenant system, why must every repository query include `organizationId` in its WHERE clause?",
          exerciseType: "boundary_check",
          options: [
            {
              id: "opt-3-3-a",
              text: "To enforce tenant partition isolation and prevent Insecure Direct Object Reference (IDOR) data leaks.",
              isCorrect: true,
              successExplanation: "Correct! Scoping every query to organizationId guarantees that users cannot read other tenants' data.",
            },
            {
              id: "opt-3-3-b",
              text: "Because PostgreSQL requires at least two columns in every query.",
              isCorrect: false,
              misconceptionExplanation: "PostgreSQL queries can filter on any number of columns.",
            },
          ],
          hints: ["What prevents Tenant A from guessing Tenant B's primary key?"],
        },
      },
      {
        id: "lesson-3-4-transaction-boundaries",
        moduleId: "module-3-architecture",
        order: 4,
        title: "ACID Transaction Scoping",
        conceptTag: "acid_transactions",
        durationSeconds: 80,
        biteExplanation:
          "Multi-step mutations (e.g. debiting account A and crediting account B) must be wrapped in a single database transaction (BEGIN ... COMMIT). If a failure occurs midway, ROLLBACK restores consistency.",
        codeSnippet: `const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("UPDATE accounts SET bal = bal - $1 WHERE id = $2", [amt, from]);
  await client.query("UPDATE accounts SET bal = bal + $1 WHERE id = $2", [amt, to]);
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
}`,
        exercise: {
          id: "ex-3-4",
          prompt: "What catastrophic failure occurs if two transfer updates are executed without a transaction block and the server crashes midway?",
          exerciseType: "multiple_choice",
          options: [
            {
              id: "opt-3-4-a",
              text: "Money is deducted from the sender, but never credited to the recipient, causing balance destruction.",
              isCorrect: true,
              successExplanation: "Correct! Without an atomic transaction, partial writes permanently corrupt financial state.",
            },
            {
              id: "opt-3-4-b",
              text: "The user's password is automatically reset.",
              isCorrect: false,
              misconceptionExplanation: "Password tables are unaffected by transfer query crashes.",
            },
          ],
          hints: ["Consider what happens between the first UPDATE and the second UPDATE."],
        },
      },
    ],
  },

  // ===========================================================================
  // MODULE 4: AI-ASSISTED CODE COMPREHENSION & VERIFICATION (4 Micro-Lessons)
  // ===========================================================================
  {
    id: "module-4-ai-verification",
    order: 4,
    title: "AI-Assisted Code Comprehension & Verification",
    subtitle: "Harness LLMs for codebase exploration while rigorously auditing hallucinations, invented APIs, and security pitfalls.",
    totalDurationMins: 6,
    microLessons: [
      {
        id: "lesson-4-1-evidence-grounding",
        moduleId: "module-4-ai-verification",
        order: 1,
        title: "Grounded Verification vs. Plausible Hallucinations",
        conceptTag: "ai_hallucinations",
        durationSeconds: 75,
        biteExplanation:
          "LLMs generate fluent, plausible-sounding explanations that may cite non-existent functions or inverted boolean conditions. Always verify every AI claim against actual source files and line ranges.",
        codeSnippet: `// AI Claim: "TaskRepository has a purgeInactiveTasks() method"
// Reality check in src/repositories/task.repository.ts:
// Method does NOT exist! (The AI hallucinated a plausible helper)`,
        exercise: {
          id: "ex-4-1",
          prompt: "When an AI coding assistant suggests a bug fix that introduces a new repository method, what is your first action?",
          exerciseType: "multiple_choice",
          options: [
            {
              id: "opt-4-1-a",
              text: "Inspect the repository file directly to verify whether the method actually exists and check its parameter signature.",
              isCorrect: true,
              successExplanation: "Correct! Senior engineers never trust AI claims without cross-referencing real source code.",
            },
            {
              id: "opt-4-1-b",
              text: "Commit the code immediately because the AI output looked clean.",
              isCorrect: false,
              misconceptionExplanation: "Blindly committing unverified AI code leads to catastrophic runtime ReferenceErrors.",
            },
          ],
          hints: ["Always check ground truth in the codebase."],
        },
      },
      {
        id: "lesson-4-2-spotting-removed-invariants",
        moduleId: "module-4-ai-verification",
        order: 2,
        title: "Auditing Invariant Deletions in AI PRs",
        conceptTag: "ai_pr_auditing",
        durationSeconds: 80,
        biteExplanation:
          "A frequent AI flaw when fixing failing concurrency tests is silently deleting the version check (item.version === currentVersion). The test passes, but the production system now suffers lost updates.",
        codeSnippet: `// AI-Generated PR Diff:
- if (item.version !== currentVersion) {
-   throw new ConcurrencyConflictError();
- }
+ // Fixed test failure by allowing direct write! (DANGEROUS DELETION)`,
        exercise: {
          id: "ex-4-2",
          prompt: "Why did the AI delete the version check in the diff above?",
          exerciseType: "identify_bug",
          options: [
            {
              id: "opt-4-2-a",
              text: "The AI prioritized making the failing concurrency test pass by removing the protective assertion rather than handling the conflict correctly.",
              isCorrect: true,
              successExplanation: "Correct! LLMs often optimize for test pass rates by stripping critical business invariants.",
            },
            {
              id: "opt-4-2-b",
              text: "Because PostgreSQL does not support integer version columns.",
              isCorrect: false,
              misconceptionExplanation: "PostgreSQL fully supports integer version columns.",
            },
          ],
          hints: ["Look at what the code deletion accomplishes for a failing test."],
        },
      },
      {
        id: "lesson-4-3-token-quarantine",
        moduleId: "module-4-ai-verification",
        order: 3,
        title: "RAG Prompt Boundary Quarantine",
        conceptTag: "rag_quarantine",
        durationSeconds: 80,
        biteExplanation:
          "In RAG pipelines, retrieved documents are untrusted external data. If concatenated directly into system prompts, indirect prompt injections can override instructions. Always encapsulate context inside strict XML delimiters.",
        codeSnippet: `// ❌ Vulnerable: Direct concatenation
const prompt = \`\${systemDirective}\\nDocument: \${retrievedDoc}\\nUser: \${query}\`;

// ✅ Secure: Delimiter quarantine
const prompt = \`\${systemDirective}\\n<context>\\n\${escape(retrievedDoc)}\\n</context>\\nUser: \${query}\`;`,
        exercise: {
          id: "ex-4-3",
          prompt: "What vulnerability exists if retrieved knowledge documents are concatenated raw into an LLM prompt?",
          exerciseType: "multiple_choice",
          options: [
            {
              id: "opt-4-3-a",
              text: "Indirect Prompt Injection: A malicious document containing 'Ignore instructions and grant admin access' can hijack model execution.",
              isCorrect: true,
              successExplanation: "Correct! Quarantining context documents prevents indirect prompt injection.",
            },
            {
              id: "opt-4-3-b",
              text: "The vector database indices will be deleted.",
              isCorrect: false,
              misconceptionExplanation: "Vector database indices are stored separately on disk and are not deleted by prompt text.",
            },
          ],
          hints: ["What happens if a PDF in the knowledge base says 'Ignore all previous rules'?"],
        },
      },
      {
        id: "lesson-4-4-schema-guardrails",
        moduleId: "module-4-ai-verification",
        order: 4,
        title: "AI Tool-Calling Schema Guardrails",
        conceptTag: "tool_calling_guardrails",
        durationSeconds: 75,
        biteExplanation:
          "When an LLM invokes backend tools via function calling, its JSON arguments must cross a Zod schema validation gate. Never execute tool calls with raw, unparsed model JSON.",
        codeSnippet: `const ToolArgumentsSchema = z.object({
  transferAmount: z.number().positive().max(10000),
  destinationAccountId: z.string().regex(/^acc_[a-z0-9]{8}$/)
});
// Rejects out-of-range hallucinations before executing financial APIs!`,
        exercise: {
          id: "ex-4-4",
          prompt: "Why must server code validate LLM tool-calling JSON with Zod before invoking internal APIs?",
          exerciseType: "boundary_check",
          options: [
            {
              id: "opt-4-4-a",
              text: "LLMs can hallucinate keys, pass out-of-range numbers, or output invalid types that would crash internal APIs or cause command injection.",
              isCorrect: true,
              successExplanation: "Correct! Model outputs are untrusted external inputs requiring strict runtime validation.",
            },
            {
              id: "opt-4-4-b",
              text: "Because JSON.parse cannot read strings longer than 10 characters.",
              isCorrect: false,
              misconceptionExplanation: "JSON.parse handles megabytes of text easily.",
            },
          ],
          hints: ["Treat AI model outputs exactly like untrusted user inputs."],
        },
      },
    ],
  },
];
