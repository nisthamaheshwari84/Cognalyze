/**
 * Code Comprehension Lab — Stage 2: Execution Tracer & Visual Dry Run Studio
 * 
 * Provides deterministic, multi-layer visual execution traces across:
 * - Client -> Middleware -> Controller -> Service -> Repository -> Database
 * 
 * Implements "I DO" (teacher demonstration), "WE DO" (guided interactive checkpoints),
 * and "YOU DO" (independent tracing) modes.
 * 
 * GUARANTEE: Every single execution frame is actively educational with:
 * - Spoken/written pedagogical explanation (tellExplanation)
 * - Targeted checkpoint question (askQuestion)
 * - Why this question matters in production (whyThisQuestionMatters)
 * - Interactive prediction options with detailed explanations (prediction)
 * - Level 1 intuitive analogy (beginnerAnalogy)
 * - Runtime internals breakdown (internalDeepDive)
 * - Architectural invariants (expectedInvariants)
 */

export type ArchitectureStage = "client" | "middleware" | "controller" | "service" | "repository" | "database";
export type PedagogicalMode = "I_DO" | "WE_DO" | "YOU_DO";

export interface StackFrame {
  functionName: string;
  filePath: string;
  line: number;
  depth: number;
}

export interface VariableSnapshot {
  value: string;
  type: string;
  scope: "local" | "closure" | "param" | "return";
  mutated?: boolean;
}

export interface PredictionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
  misconceptionTag?: string;
}

export interface PredictionCheckpoint {
  id: string;
  question: string;
  options: PredictionOption[];
}

export interface ExecutionFrame {
  stepIndex: number;
  totalSteps: number;
  title: string;
  description: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  functionName: string;
  codeSnippet: string;
  callStack: StackFrame[];
  variables: Record<string, VariableSnapshot>;
  architectureStage: ArchitectureStage;
  componentName: string;
  dataFlowSummary: string;
  tellExplanation: string;
  askQuestion: string;
  whyThisQuestionMatters: string;
  beginnerAnalogy: string;
  internalDeepDive: string;
  expectedInvariants: string[];
  prediction: PredictionCheckpoint;
}

export interface TraceWorkflow {
  id: string;
  codebaseId: string;
  title: string;
  subtitle: string;
  description: string;
  scenarioType: "happy_path" | "concurrency_conflict" | "security_violation" | "error_propagation";
  initialPayload: Record<string, unknown>;
  frames: ExecutionFrame[];
}

// -----------------------------------------------------------------------------
// WORKFLOW 1: TaskFlow Task Creation (Happy Path: 7 Layers)
// -----------------------------------------------------------------------------
const TASKFLOW_CREATE_TASK_FRAMES: ExecutionFrame[] = [
  {
    stepIndex: 1,
    totalSteps: 7,
    title: "Client Dispatches HTTP POST Request",
    description: "The frontend client dispatches an HTTP POST request to '/api/v1/tasks' with JSON body and Bearer Authorization header.",
    filePath: "src/routes/task.routes.ts",
    lineStart: 12,
    lineEnd: 16,
    functionName: "router.post",
    codeSnippet: `router.post(
  "/tasks",
  authenticateToken,
  validateRequestBody(createTaskSchema),
  taskController.createTask
);`,
    callStack: [
      { functionName: "Express.handle(req, res)", filePath: "node_modules/express/lib/router.js", line: 134, depth: 0 },
      { functionName: "taskRouter.post('/tasks')", filePath: "src/routes/task.routes.ts", line: 12, depth: 1 },
    ],
    variables: {
      "req.method": { value: '"POST"', type: "string", scope: "param" },
      "req.url": { value: '"/tasks"', type: "string", scope: "param" },
      "headers.authorization": { value: '"Bearer eyJhbGciOi..."', type: "string", scope: "param" },
      "req.body": { value: '{ title: "Implement Auth", priority: "HIGH" }', type: "object", scope: "param" },
    },
    architectureStage: "client",
    componentName: "Client HTTP Dispatcher",
    dataFlowSummary: "Raw HTTP request received on socket; Express router matches '/tasks' route handler chain.",
    tellExplanation: "When a user hits submit, the browser opens an HTTP connection. Notice how in src/routes/task.routes.ts, the request is not immediately sent to the controller. It is queued into an ordered pipeline: authenticateToken runs first, then validateRequestBody, and only then taskController.createTask.",
    askQuestion: "Why does the route handler register middleware functions in this exact sequence before the controller?",
    whyThisQuestionMatters: "Executing authorization and schema validation before controller invocation guarantees that controllers and business services never deal with unauthenticated or malformed inputs.",
    beginnerAnalogy: "Like airport security: you show your ticket and passport at the checkpoint before you are ever allowed near the boarding gates.",
    internalDeepDive: "In Node.js, Express maintains an internal layer stack. Each middleware must invoke next() to advance execution. If any middleware sends a response or calls next(err), downstream handlers are bypassed immediately.",
    expectedInvariants: ["middleware pipeline enforces security checks before controller execution", "untrusted request must be authenticated first"],
    prediction: {
      id: "pred-step-1",
      question: "When this HTTP request arrives, what happens if the Authorization header is missing?",
      options: [
        {
          id: "opt-1",
          text: "The authenticateToken middleware halts execution and returns HTTP 401 Unauthorized before reaching the controller.",
          isCorrect: true,
          explanation: "Exactly! The middleware guards the trust boundary and prevents unauthenticated requests from touching controllers.",
        },
        {
          id: "opt-2",
          text: "The controller executes anyway and assigns the task to a random administrator.",
          isCorrect: false,
          explanation: "Incorrect. The middleware halts request progression and never invokes next().",
        },
      ],
    },
  },
  {
    stepIndex: 2,
    totalSteps: 7,
    title: "Authentication Middleware Validates JWT",
    description: "The authentication middleware extracts the Bearer token, verifies its signature against the secret, and injects decoded tenant claims into req.user.",
    filePath: "src/middleware/auth.ts",
    lineStart: 24,
    lineEnd: 36,
    functionName: "authenticateToken",
    codeSnippet: `const token = authHeader.split(" ")[1];
const decoded = verifyJwtToken(token, JWT_SECRET);
req.user = {
  id: decoded.sub,
  organizationId: decoded.orgId,
  role: decoded.role,
};
next();`,
    callStack: [
      { functionName: "Express.handle(req, res)", filePath: "node_modules/express/lib/router.js", line: 134, depth: 0 },
      { functionName: "authenticateToken(req, res, next)", filePath: "src/middleware/auth.ts", line: 24, depth: 1 },
    ],
    variables: {
      "token": { value: '"eyJhbGciOi..."', type: "string", scope: "local" },
      "decoded.sub": { value: '"usr_dev_42"', type: "string", scope: "local" },
      "decoded.orgId": { value: '"org_acme_corp"', type: "string", scope: "local" },
      "decoded.role": { value: '"DEVELOPER"', type: "string", scope: "local" },
      "req.user": { value: '{ id: "usr_dev_42", organizationId: "org_acme_corp", role: "DEVELOPER" }', type: "object", scope: "closure", mutated: true },
    },
    architectureStage: "middleware",
    componentName: "Auth & RBAC Middleware",
    dataFlowSummary: "Untrusted Bearer header validated; verified claims attached to req.user. Trust boundary crossed.",
    tellExplanation: "Notice line 114: req.user is populated directly from the cryptographically verified JWT payload. The user ID and organization ID are now attached to the request context in server memory.",
    askQuestion: "Why must organizationId be extracted from the verified JWT token rather than from req.body?",
    whyThisQuestionMatters: "If organizationId were read from req.body, a rogue user could change the JSON payload to target another tenant's data, causing a catastrophic Multi-Tenant IDOR security breach.",
    beginnerAnalogy: "Your employee badge has an official security hologram. The building receptionist reads the hologram rather than asking you to write your department on a sticky note.",
    internalDeepDive: "verifyJwtToken performs HMAC-SHA256 signature verification. If the payload or signature is modified by a single byte, it throws JsonWebTokenError and terminates request processing.",
    expectedInvariants: ["tenant identity must be cryptographically verified", "req.user contains verified claims"],
    prediction: {
      id: "pred-step-2",
      question: "Why must organizationId be extracted from decoded JWT rather than req.body?",
      options: [
        {
          id: "opt-1",
          text: "Because the client might tamper with req.body to access or create records under a rival organization (Multi-tenant IDOR).",
          isCorrect: true,
          explanation: "Spot on! The verified JWT signature guarantees that the tenant identity is cryptographic and tamper-proof.",
        },
        {
          id: "opt-2",
          text: "Because JSON bodies do not support string types for organization IDs.",
          isCorrect: false,
          explanation: "JSON bodies certainly support strings. The restriction is strictly for security and tenant isolation.",
        },
      ],
    },
  },
  {
    stepIndex: 3,
    totalSteps: 7,
    title: "Request Schema Validation Middleware",
    description: "The validation middleware executes Zod schema parsing on req.body, stripping unknown keys and enforcing type invariants.",
    filePath: "src/middleware/validation.ts",
    lineStart: 18,
    lineEnd: 26,
    functionName: "validateRequestBody",
    codeSnippet: `const result = schema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ error: "Validation Failed", issues: result.error.issues });
}
req.validatedBody = result.data;
next();`,
    callStack: [
      { functionName: "Express.handle(req, res)", filePath: "node_modules/express/lib/router.js", line: 134, depth: 0 },
      { functionName: "validateRequestBody(schema)", filePath: "src/middleware/validation.ts", line: 18, depth: 1 },
    ],
    variables: {
      "result.success": { value: "true", type: "boolean", scope: "local" },
      "result.data": { value: '{ title: "Implement Auth", priority: "HIGH" }', type: "object", scope: "local" },
      "req.validatedBody": { value: '{ title: "Implement Auth", priority: "HIGH" }', type: "object", scope: "closure", mutated: true },
    },
    architectureStage: "middleware",
    componentName: "Zod Schema Validator",
    dataFlowSummary: "Payload confirmed valid according to CreateTaskSchema; untrusted inputs sanitized.",
    tellExplanation: "Look at line 166: req.validatedBody is set to result.data. Notice how Zod safeParse strips unknown keys and coerces types. The controller will only ever consume req.validatedBody, never the raw untrusted req.body.",
    askQuestion: "What failure scenario does safeParse prevent if a client maliciously sends extra fields like { isAdmin: true } in the body?",
    whyThisQuestionMatters: "Prevents mass assignment vulnerabilities and prototype pollution by enforcing a strict schema boundary before parameters enter domain logic.",
    beginnerAnalogy: "Like a mail scanner at a secure facility that opens packages, discards unauthorized contraband, and only forwards the requested document.",
    internalDeepDive: "Zod constructs an entirely new object containing only declared schema fields, leaving the original raw req.body isolated and preventing prototype pollution.",
    expectedInvariants: ["untrusted input is sanitized into req.validatedBody", "unknown fields are stripped"],
    prediction: {
      id: "pred-step-3",
      question: "If the client payload contains { title: '', priority: 'INVALID_PRIORITY' }, what does this middleware do?",
      options: [
        {
          id: "opt-1",
          text: "result.success is false, so it immediately returns HTTP 400 Bad Request with validation issues and halts the request.",
          isCorrect: true,
          explanation: "Correct! The validation gate ensures invalid payloads never trigger database operations or domain errors.",
        },
        {
          id: "opt-2",
          text: "It ignores the error, sets priority to 'LOW' silently, and continues to the controller.",
          isCorrect: false,
          explanation: "Incorrect. Strict schema validation rejects malformed requests rather than guessing client intent.",
        },
      ],
    },
  },
  {
    stepIndex: 4,
    totalSteps: 7,
    title: "Task Controller Coordinates Domain Call",
    description: "The controller unmarshals validated inputs from req.validatedBody and user claims from req.user, passing clean DTO to the TaskService.",
    filePath: "src/controllers/task.controller.ts",
    lineStart: 28,
    lineEnd: 37,
    functionName: "createTask",
    codeSnippet: `const { title, priority } = req.validatedBody;
const { organizationId, id: userId } = req.user!;
const task = await this.taskService.createTask({
  title,
  priority,
  organizationId,
  creatorId: userId,
});
return res.status(201).json({ success: true, data: task });`,
    callStack: [
      { functionName: "Express.handle(req, res)", filePath: "node_modules/express/lib/router.js", line: 134, depth: 0 },
      { functionName: "taskController.createTask(req, res)", filePath: "src/controllers/task.controller.ts", line: 28, depth: 1 },
    ],
    variables: {
      "title": { value: '"Implement Auth"', type: "string", scope: "local" },
      "priority": { value: '"HIGH"', type: "string", scope: "local" },
      "organizationId": { value: '"org_acme_corp"', type: "string", scope: "local" },
      "userId": { value: '"usr_dev_42"', type: "string", scope: "local" },
    },
    architectureStage: "controller",
    componentName: "Task Controller",
    dataFlowSummary: "HTTP protocol details stripped away; domain input object constructed for TaskService.",
    tellExplanation: "Notice the role of the controller here: it does not query SQL or write files. Its sole job is coordination: extract validated HTTP parameters, combine them with verified user identity, call the domain service, and serialize the HTTP response.",
    askQuestion: "Why is business logic kept inside TaskService rather than written directly inside this controller?",
    whyThisQuestionMatters: "Separation of concerns allows the same domain business logic to be invoked from CLI commands, background queue workers, and tests without spinning up an HTTP server.",
    beginnerAnalogy: "The controller is like a restaurant waiter: they take your order and communicate it clearly to the kitchen, but they don't cook the meal themselves.",
    internalDeepDive: "By decoupling Express (req, res) from the domain service, the service can be pure TypeScript with zero framework dependencies.",
    expectedInvariants: ["controller orchestrates without executing database SQL directly", "domain service receives pure DTO"],
    prediction: {
      id: "pred-step-4",
      question: "Which component executes next when this.taskService.createTask(...) is invoked?",
      options: [
        {
          id: "opt-1",
          text: "The TaskService.createTask method executes in the domain service layer to apply business invariants.",
          isCorrect: true,
          explanation: "Spot on! Execution transitions from the transport layer (controller) to the domain layer (service).",
        },
        {
          id: "opt-2",
          text: "The PostgreSQL database immediately executes a raw SQL INSERT before the service runs.",
          isCorrect: false,
          explanation: "Incorrect. The service layer must first enforce business rules and prepare the entity model.",
        },
      ],
    },
  },
  {
    stepIndex: 5,
    totalSteps: 7,
    title: "Task Service Enforces Business Rules & State Invariants",
    description: "TaskService initializes task status to 'TODO', assigns version=1 for optimistic locking, and delegates to the repository.",
    filePath: "src/services/task.service.ts",
    lineStart: 38,
    lineEnd: 52,
    functionName: "createTask",
    codeSnippet: `if (!input.title || input.title.trim().length === 0) {
  throw new ValidationError("Task title cannot be empty");
}
const entity = await this.repo.create({
  title: input.title.trim(),
  description: input.description ?? "",
  status: "TODO",
  priority: input.priority,
  organizationId: input.organizationId,
  creatorId: input.creatorId,
  assigneeId: null,
  version: 1,
});
return entity;`,
    callStack: [
      { functionName: "taskController.createTask(req, res)", filePath: "src/controllers/task.controller.ts", line: 30, depth: 1 },
      { functionName: "taskService.createTask(input)", filePath: "src/services/task.service.ts", line: 38, depth: 2 },
    ],
    variables: {
      "input.title": { value: '"Implement Auth"', type: "string", scope: "param" },
      "input.priority": { value: '"HIGH"', type: "string", scope: "param" },
      "status": { value: '"TODO"', type: "string", scope: "local" },
      "version": { value: "1", type: "number", scope: "local" },
    },
    architectureStage: "service",
    componentName: "Task Domain Service",
    dataFlowSummary: "Domain invariants checked; initial entity prepared with status='TODO' and version=1.",
    tellExplanation: "Look at lines 228 and 233: TaskService guarantees two critical invariants. Every task is born with status='TODO' (a client cannot create a task directly in 'DONE'), and version is initialized to 1 for Optimistic Concurrency Control.",
    askQuestion: "Why is initializing 'version: 1' crucial for multi-user collaboration in production?",
    whyThisQuestionMatters: "Optimistic Concurrency Control prevents 'lost update' race conditions where two teammates edit the same task simultaneously and silently overwrite each other's changes.",
    beginnerAnalogy: "Like a revision number on an architectural blueprint: if two builders have version 1, and builder A submits version 2, builder B cannot submit changes without reviewing version 2 first.",
    internalDeepDive: "When an update occurs later, the repository will execute an atomic compare-and-swap: UPDATE tasks SET status=$1, version=version+1 WHERE id=$2 AND version=$3.",
    expectedInvariants: ["initial status is TODO", "version initialized to 1 for OCC concurrency"],
    prediction: {
      id: "pred-step-5",
      question: "What is the purpose of initializing 'version: 1' on the task entity?",
      options: [
        {
          id: "opt-1",
          text: "Optimistic Concurrency Control: ensures simultaneous updates detect version conflicts and prevent silent overwrites.",
          isCorrect: true,
          explanation: "Correct! If two clients attempt to mutate this entity simultaneously, the second will fail the version match check.",
        },
        {
          id: "opt-2",
          text: "It tracks how many times the user has visited the task detail page.",
          isCorrect: false,
          explanation: "Incorrect. Version numbers are used for concurrency control, not page view counters.",
        },
      ],
    },
  },
  {
    stepIndex: 6,
    totalSteps: 7,
    title: "Task Repository Persists Entity with Tenant Key",
    description: "The repository generates a cryptographically secure ID, sets timestamp metadata, and commits the entity to storage with organizationId scoping.",
    filePath: "src/repositories/task.repository.ts",
    lineStart: 42,
    lineEnd: 55,
    functionName: "create",
    codeSnippet: `const id = generateSecureId("task", 9);
const now = new Date().toISOString();
const entity: TaskEntity = {
  id,
  ...data,
  createdAt: now,
  updatedAt: now,
};
TaskRepository.store.set(id, entity);
return { ...entity };`,
    callStack: [
      { functionName: "taskService.createTask(input)", filePath: "src/services/task.service.ts", line: 42, depth: 2 },
      { functionName: "taskRepository.create(data)", filePath: "src/repositories/task.repository.ts", line: 42, depth: 3 },
    ],
    variables: {
      "id": { value: '"task_9k3f8d2"', type: "string", scope: "local", mutated: true },
      "entity.organizationId": { value: '"org_acme_corp"', type: "string", scope: "local" },
      "entity.version": { value: "1", type: "number", scope: "local" },
      "entity.status": { value: '"TODO"', type: "string", scope: "local" },
      "store.size": { value: "4", type: "number", scope: "closure", mutated: true },
    },
    architectureStage: "repository",
    componentName: "Task Data Repository",
    dataFlowSummary: "Entity committed to tenant-isolated storage; immutable copy returned to service layer.",
    tellExplanation: "Here at the data access boundary, the repository generates a collision-resistant ID and saves the entity with the organizationId attached. Notice that an immutable clone ({ ...entity }) is returned to prevent mutation leaks.",
    askQuestion: "Why does the repository return a cloned copy { ...entity } rather than the raw in-memory reference?",
    whyThisQuestionMatters: "Returning cloned copies prevents downstream callers from mutating internal repository state outside of authorized transactions.",
    beginnerAnalogy: "Like handing someone a certified photocopy of an official record instead of the one-and-only original master ledger.",
    internalDeepDive: "In production PostgreSQL repositories, this translates to an INSERT statement returning row data over the TCP pool socket.",
    expectedInvariants: ["entity committed to repository", "organizationId bound to stored record"],
    prediction: {
      id: "pred-step-6",
      question: "What state change occurs in the repository upon executing TaskRepository.store.set(id, entity)?",
      options: [
        {
          id: "opt-1",
          text: "The persistent store size increments, and the entity is now indexed by its unique ID with tenant scoping.",
          isCorrect: true,
          explanation: "Spot on! The task is now officially persisted and can be retrieved by queries scoped to org_acme_corp.",
        },
        {
          id: "opt-2",
          text: "The entity is immediately sent in an email to all company shareholders.",
          isCorrect: false,
          explanation: "Incorrect. The repository simply commits data to storage.",
        },
      ],
    },
  },
  {
    stepIndex: 7,
    totalSteps: 7,
    title: "HTTP 201 Created Response Returned to Client",
    description: "Controller completes the promise, packages the created entity in a standard response envelope, and sends 201 Created.",
    filePath: "src/controllers/task.controller.ts",
    lineStart: 36,
    lineEnd: 37,
    functionName: "createTask",
    codeSnippet: `return res.status(201).json({ success: true, data: task });`,
    callStack: [
      { functionName: "taskController.createTask(req, res)", filePath: "src/controllers/task.controller.ts", line: 36, depth: 1 },
    ],
    variables: {
      "res.statusCode": { value: "201", type: "number", scope: "local", mutated: true },
      "task.id": { value: '"task_9k3f8d2"', type: "string", scope: "local" },
      "task.status": { value: '"TODO"', type: "string", scope: "local" },
    },
    architectureStage: "controller",
    componentName: "HTTP Response Serializer",
    dataFlowSummary: "HTTP 201 Created sent across socket. Round-trip execution completed successfully.",
    tellExplanation: "The round trip is complete! The controller takes the persisted task entity, sets the HTTP status code to 201 Created, serializes the response envelope, and flushes the buffer down the TCP socket back to the browser.",
    askQuestion: "Why is HTTP status 201 Created preferred over generic HTTP 200 OK for resource creation?",
    whyThisQuestionMatters: "REST standards specify 201 Created to allow HTTP proxies, caches, and API consumers to know that a new persistent resource was successfully minted on the server.",
    beginnerAnalogy: "Receiving a stamped receipt confirming your new account number, rather than just a thumbs up.",
    internalDeepDive: "Express sets Content-Type to application/json, writes HTTP response headers, flushes the response body buffer, and closes the request stream.",
    expectedInvariants: ["HTTP 201 status code sent", "response envelope contains serialized task DTO"],
    prediction: {
      id: "pred-step-7",
      question: "After res.status(201).json(...) executes, what happens to the Express request/response lifecycle?",
      options: [
        {
          id: "opt-1",
          text: "The response stream is finished (res.writableEnded is true), and the TCP socket completes the HTTP exchange.",
          isCorrect: true,
          explanation: "Exact! The HTTP request-response cycle is finalized.",
        },
        {
          id: "opt-2",
          text: "Express restarts the entire server process from scratch.",
          isCorrect: false,
          explanation: "Incorrect. The server stays online and ready for the next incoming socket connection.",
        },
      ],
    },
  },
];

// -----------------------------------------------------------------------------
// WORKFLOW 2: Optimistic Concurrency Conflict (Failure/Race Condition Path: 6 Layers)
// -----------------------------------------------------------------------------
const TASKFLOW_CONCURRENCY_CONFLICT_FRAMES: ExecutionFrame[] = [
  {
    stepIndex: 1,
    totalSteps: 6,
    title: "Client A and Client B Read Same Task Version 1",
    description: "Both clients fetch task 'task_101' concurrently. Both observe version=1 and status='TODO'.",
    filePath: "src/services/task.service.ts",
    lineStart: 62,
    lineEnd: 66,
    functionName: "getById",
    codeSnippet: `const task = await this.repo.findById(id, orgId);
if (!task) throw new NotFoundError("Task not found");
return task;`,
    callStack: [
      { functionName: "taskService.getById(id, orgId)", filePath: "src/services/task.service.ts", line: 62, depth: 1 },
    ],
    variables: {
      "task.id": { value: '"task_101"', type: "string", scope: "local" },
      "task.status": { value: '"TODO"', type: "string", scope: "local" },
      "task.version": { value: "1", type: "number", scope: "local" },
    },
    architectureStage: "service",
    componentName: "Task Domain Service",
    dataFlowSummary: "Task entity retrieved with version=1; distributed to concurrent clients.",
    tellExplanation: "Imagine two teammates, Alice and Bob, both opening the exact same task on their screens at 10:00 AM. Both receive version=1 with status='TODO'. Neither knows the other is about to make an edit.",
    askQuestion: "What is the danger if two clients read version 1 and both try to update the record without version checks?",
    whyThisQuestionMatters: "This is the classic 'Lost Update' anomaly in concurrent systems. Whoever commits second will silently overwrite the first person's work without warning.",
    beginnerAnalogy: "Two people looking at an empty parking spot from different sides of a lot at the same second.",
    internalDeepDive: "In non-isolated systems without row-level locking or OCC, simultaneous UPDATE statements overwrite columns based purely on clock arrival.",
    expectedInvariants: ["both clients hold snapshot of version 1", "concurrent mutations are imminent"],
    prediction: {
      id: "pred-concurrency-1",
      question: "What state do Client A and Client B hold in their browser memory at this moment?",
      options: [
        {
          id: "opt-1",
          text: "Both hold identical task data with version=1 and status='TODO'.",
          isCorrect: true,
          explanation: "Correct! The conflict has not occurred yet; both clients start with the same baseline state.",
        },
        {
          id: "opt-2",
          text: "Client B has already received a warning that Client A is typing.",
          isCorrect: false,
          explanation: "In standard REST APIs without WebSockets, clients do not know about each other's local views.",
        },
      ],
    },
  },
  {
    stepIndex: 2,
    totalSteps: 6,
    title: "Client A Updates Status to 'IN_PROGRESS'",
    description: "Client A submits status transition with expectedVersion=1. State machine permits TODO -> IN_PROGRESS.",
    filePath: "src/services/task.service.ts",
    lineStart: 75,
    lineEnd: 84,
    functionName: "transitionStatus",
    codeSnippet: `const allowed = VALID_TRANSITIONS[current.status];
if (!allowed.includes(newStatus)) {
  throw new InvalidTransitionError(\`Cannot transition from \${current.status} to \${newStatus}\`);
}
return await this.repo.updateStatus(id, newStatus, orgId, currentVersion);`,
    callStack: [
      { functionName: "taskService.transitionStatus(id, newStatus, orgId, 1)", filePath: "src/services/task.service.ts", line: 75, depth: 1 },
    ],
    variables: {
      "current.status": { value: '"TODO"', type: "string", scope: "local" },
      "newStatus": { value: '"IN_PROGRESS"', type: "string", scope: "local" },
      "currentVersion": { value: "1", type: "number", scope: "param" },
    },
    architectureStage: "service",
    componentName: "Task Domain Service",
    dataFlowSummary: "Transition validated. Repository invoked with expected currentVersion=1.",
    tellExplanation: "Client A moves first: they transition the task to 'IN_PROGRESS' and supply currentVersion=1. The domain service validates the finite state machine transition and prepares to commit.",
    askQuestion: "Why does the service pass 'currentVersion' down to the repository update call?",
    whyThisQuestionMatters: "Passing the version allows the repository to verify that the entity hasn't changed since Client A originally read it.",
    beginnerAnalogy: "Telling the bank cashier: 'Transfer from account 101, assuming its balance is still $100.'",
    internalDeepDive: "The state machine VALID_TRANSITIONS dictionary ensures illegal transitions (e.g. ARCHIVED -> TODO) throw InvalidTransitionError before touching storage.",
    expectedInvariants: ["state transition is valid in finite state machine", "expected version 1 passed to repository"],
    prediction: {
      id: "pred-concurrency-2",
      question: "Will Client A's transition from 'TODO' to 'IN_PROGRESS' be allowed by the state machine?",
      options: [
        {
          id: "opt-1",
          text: "Yes, 'TODO' to 'IN_PROGRESS' is a valid transition in the task lifecycle.",
          isCorrect: true,
          explanation: "Spot on! The state machine permits this transition.",
        },
        {
          id: "opt-2",
          text: "No, tasks can only transition directly to 'ARCHIVED'.",
          isCorrect: false,
          explanation: "Incorrect. 'TODO' to 'IN_PROGRESS' is the standard initial development lifecycle step.",
        },
      ],
    },
  },
  {
    stepIndex: 3,
    totalSteps: 6,
    title: "Client A Commit Succeeds: Version Incremented to 2",
    description: "Repository verifies existing version (1) matches currentVersion (1). Updates status and increments version to 2.",
    filePath: "src/repositories/task.repository.ts",
    lineStart: 70,
    lineEnd: 82,
    functionName: "updateStatus",
    codeSnippet: `if (item.version !== currentVersion) {
  throw new ConcurrencyConflictError(\`Task was modified by another process. Expected v\${currentVersion}, found v\${item.version}\`);
}
item.status = status;
item.version += 1;
item.updatedAt = new Date().toISOString();
return { ...item };`,
    callStack: [
      { functionName: "taskRepository.updateStatus(id, 'IN_PROGRESS', orgId, 1)", filePath: "src/repositories/task.repository.ts", line: 70, depth: 2 },
    ],
    variables: {
      "item.version (before)": { value: "1", type: "number", scope: "local" },
      "currentVersion": { value: "1", type: "number", scope: "param" },
      "item.version (after)": { value: "2", type: "number", scope: "local", mutated: true },
      "item.status": { value: '"IN_PROGRESS"', type: "string", scope: "local", mutated: true },
    },
    architectureStage: "repository",
    componentName: "Task Data Repository",
    dataFlowSummary: "Client A's write committed. Stored task now has version=2, status='IN_PROGRESS'.",
    tellExplanation: "Notice line 393: item.version += 1. Because the stored version was 1 and Client A expected 1, the write succeeds. But now the stored record has version=2! Anyone still holding version 1 is now holding stale data.",
    askQuestion: "What is now true about Client B's in-memory view of this task?",
    whyThisQuestionMatters: "Client B has no idea Client A committed. Client B's local state is now officially out of sync with the database.",
    beginnerAnalogy: "Client A just bought the last concert seat. Client B is still looking at the seat on their screen thinking it's available.",
    internalDeepDive: "Atomic version increment ensures monotonic ordering of mutations without needing expensive pessimistic database locks.",
    expectedInvariants: ["stored task version is now 2", "client B's version 1 is stale"],
    prediction: {
      id: "pred-concurrency-3",
      question: "Now that Client A's commit succeeded, what is the current version stored in the database?",
      options: [
        {
          id: "opt-1",
          text: "Version 2, because the repository incremented it upon successful status update.",
          isCorrect: true,
          explanation: "Exact! The database state has moved forward to version 2.",
        },
        {
          id: "opt-2",
          text: "It resets back to 0.",
          isCorrect: false,
          explanation: "Incorrect. Version counters increment monotonically.",
        },
      ],
    },
  },
  {
    stepIndex: 4,
    totalSteps: 6,
    title: "Client B Attempts Stale Write with Version 1",
    description: "Client B (unaware of Client A's commit) attempts to transition task to 'ARCHIVED' using stale version=1.",
    filePath: "src/services/task.service.ts",
    lineStart: 75,
    lineEnd: 84,
    functionName: "transitionStatus",
    codeSnippet: `// Client B calls with currentVersion: 1
return await this.repo.updateStatus(id, "ARCHIVED", orgId, 1);`,
    callStack: [
      { functionName: "taskService.transitionStatus(id, 'ARCHIVED', orgId, 1)", filePath: "src/services/task.service.ts", line: 75, depth: 1 },
    ],
    variables: {
      "newStatus": { value: '"ARCHIVED"', type: "string", scope: "local" },
      "currentVersion": { value: "1", type: "number", scope: "param" },
    },
    architectureStage: "service",
    componentName: "Task Domain Service",
    dataFlowSummary: "Client B sends stale version=1 into repository.",
    tellExplanation: "Here comes Client B's request! Client B clicks 'Archive' and sends currentVersion=1. But the database is already at version=2. This is the moment of collision.",
    askQuestion: "What should the system do when it detects Client B's version mismatch?",
    whyThisQuestionMatters: "Silently overwriting would lose Client A's 'IN_PROGRESS' update. Rejecting with a conflict error allows Client B to refresh and resolve the change gracefully.",
    beginnerAnalogy: "Like trying to cash an old check after a newer one has already cleared the account.",
    internalDeepDive: "This check translates to: UPDATE tasks SET status='ARCHIVED', version=2 WHERE id='task_101' AND version=1. The query matches 0 rows in PostgreSQL, triggering a conflict exception in the ORM/data layer.",
    expectedInvariants: ["client B supplied stale version 1", "repository will compare with stored version 2"],
    prediction: {
      id: "pred-concurrency-4",
      question: "What will happen in the repository when Client B's updateStatus executes with version=1?",
      options: [
        {
          id: "opt-1",
          text: "The repository detects item.version (2) !== currentVersion (1) and throws ConcurrencyConflictError.",
          isCorrect: true,
          explanation: "Exact! The optimistic concurrency lock detects the collision and refuses to overwrite Client A's work.",
        },
        {
          id: "opt-2",
          text: "Client B's write quietly overwrites Client A's work because Client B was second.",
          isCorrect: false,
          explanation: "Incorrect. Without optimistic locking that would be a lost update bug, but TaskFlow enforces version checks.",
        },
      ],
    },
  },
  {
    stepIndex: 5,
    totalSteps: 6,
    title: "Repository Throws ConcurrencyConflictError",
    description: "Repository identifies that item.version is now 2, whereas caller supplied 1. Execution halts and throws exception.",
    filePath: "src/repositories/task.repository.ts",
    lineStart: 71,
    lineEnd: 73,
    functionName: "updateStatus",
    codeSnippet: `if (item.version !== currentVersion) {
  throw new ConcurrencyConflictError(
    \`Task was modified by another process. Expected v\${currentVersion}, found v\${item.version}\`
  );
}`,
    callStack: [
      { functionName: "taskRepository.updateStatus(id, 'ARCHIVED', orgId, 1)", filePath: "src/repositories/task.repository.ts", line: 71, depth: 2 },
    ],
    variables: {
      "item.version": { value: "2", type: "number", scope: "local" },
      "currentVersion": { value: "1", type: "number", scope: "param" },
      "error.name": { value: '"ConcurrencyConflictError"', type: "string", scope: "local" },
    },
    architectureStage: "repository",
    componentName: "Task Data Repository",
    dataFlowSummary: "Concurrency conflict detected; exception propagated up call stack to error handling middleware.",
    tellExplanation: "Look at the condition: item.version (2) !== currentVersion (1). The repository halts immediately and throws ConcurrencyConflictError. Notice that no database records were corrupted or overwritten.",
    askQuestion: "Why is throwing an exception better than returning a boolean 'false' here?",
    whyThisQuestionMatters: "Throwing a dedicated domain error allows the global error middleware to catch it centrally and translate it into a semantic HTTP 409 status code.",
    beginnerAnalogy: "A referee blowing the whistle to stop the play immediately when an offside rule is triggered.",
    internalDeepDive: "The exception unwinds the call stack, bypassing remaining service code and landing in the Express global error-handling middleware.",
    expectedInvariants: ["database record remains untouched at version 2", "exception unwinds the call stack"],
    prediction: {
      id: "pred-concurrency-5",
      question: "Does the repository modify the database when ConcurrencyConflictError is thrown?",
      options: [
        {
          id: "opt-1",
          text: "No, execution halts before any mutation occurs; the database remains completely safe at version 2.",
          isCorrect: true,
          explanation: "Correct! The database write is aborted, ensuring data integrity.",
        },
        {
          id: "opt-2",
          text: "Yes, it deletes the task entirely.",
          isCorrect: false,
          explanation: "Incorrect. The existing record is preserved exactly as Client A left it.",
        },
      ],
    },
  },
  {
    stepIndex: 6,
    totalSteps: 6,
    title: "Error Middleware Returns HTTP 409 Conflict",
    description: "The global error middleware catches ConcurrencyConflictError, maps it to HTTP 409 Conflict, and advises client to refresh and retry.",
    filePath: "src/middleware/error-handler.ts",
    lineStart: 15,
    lineEnd: 22,
    functionName: "errorHandler",
    codeSnippet: `if (err instanceof ConcurrencyConflictError) {
  return res.status(409).json({
    error: "Conflict",
    message: err.message,
    code: "CONCURRENCY_CONFLICT",
  });
}`,
    callStack: [
      { functionName: "errorHandler(err, req, res, next)", filePath: "src/middleware/error-handler.ts", line: 15, depth: 1 },
    ],
    variables: {
      "res.statusCode": { value: "409", type: "number", scope: "local", mutated: true },
      "response.code": { value: '"CONCURRENCY_CONFLICT"', type: "string", scope: "local" },
    },
    architectureStage: "middleware",
    componentName: "Global Error Handler",
    dataFlowSummary: "HTTP 409 Conflict dispatched to Client B. Lost update prevented.",
    tellExplanation: "The global error handler maps the ConcurrencyConflictError into an HTTP 409 Conflict response. Client B's UI can now display a banner: 'This task was updated by another user. Click to reload latest changes.'",
    askQuestion: "Why is HTTP 409 Conflict the standard response rather than HTTP 500 Internal Server Error?",
    whyThisQuestionMatters: "HTTP 500 indicates an unexpected bug on the server. HTTP 409 accurately tells the client that the business state conflicted, allowing the UI to reload and prompt the user to reconcile.",
    beginnerAnalogy: "Telling the customer 'That seat was just taken, please pick another' instead of telling them the whole stadium collapsed.",
    internalDeepDive: "Maps directly to RFC 7231 Section 6.5.8: The 409 (Conflict) status code indicates that the request could not be completed due to a conflict with the current state of the target resource.",
    expectedInvariants: ["HTTP 409 returned", "lost update prevented cleanly"],
    prediction: {
      id: "pred-concurrency-6",
      question: "How should a modern web application frontend respond to an HTTP 409 Conflict response?",
      options: [
        {
          id: "opt-1",
          text: "Fetch the latest entity state from the server and prompt the user to merge or reconcile their changes.",
          isCorrect: true,
          explanation: "Spot on! The user can see what changed and decide whether to reapply their modification.",
        },
        {
          id: "opt-2",
          text: "Log the user out and delete their browser cookies.",
          isCorrect: false,
          explanation: "Incorrect. A concurrency conflict is an expected collaboration occurrence, not an authentication failure.",
        },
      ],
    },
  },
];

// -----------------------------------------------------------------------------
// WORKFLOW 3: Cross-Tenant Multi-Tenant Isolation Rejection (5 Layers)
// -----------------------------------------------------------------------------
const TASKFLOW_TENANT_ISOLATION_FRAMES: ExecutionFrame[] = [
  {
    stepIndex: 1,
    totalSteps: 5,
    title: "Client Authenticates as Tenant Beta",
    description: "Candidate request arrives with valid JWT belonging to Tenant Beta (org_beta_99).",
    filePath: "src/middleware/auth.ts",
    lineStart: 30,
    lineEnd: 34,
    functionName: "authenticateToken",
    codeSnippet: `req.user = {
  id: decoded.sub,
  organizationId: decoded.orgId, // "org_beta_99"
  role: decoded.role,
};
next();`,
    callStack: [
      { functionName: "authenticateToken(req, res, next)", filePath: "src/middleware/auth.ts", line: 30, depth: 1 },
    ],
    variables: {
      "req.user.organizationId": { value: '"org_beta_99"', type: "string", scope: "closure" },
      "req.params.id": { value: '"task_alpha_101"', type: "string", scope: "closure" },
    },
    architectureStage: "middleware",
    componentName: "Auth Middleware",
    dataFlowSummary: "Caller validated as user in Tenant Beta. Target task belongs to Tenant Alpha.",
    tellExplanation: "In multi-tenant SaaS architecture, multiple companies share the same database tables. Here, a user from Tenant Beta (org_beta_99) submits a request to view 'task_alpha_101'. Let's see how our code prevents them from spying on Tenant Alpha.",
    askQuestion: "What prevents Tenant Beta from accessing Tenant Alpha's data in a well-architected SaaS backend?",
    whyThisQuestionMatters: "Cross-tenant data exposure is the most critical vulnerability in SaaS engineering. The backend must enforce logical tenant isolation at every layer.",
    beginnerAnalogy: "Like an apartment building: having a key to Apartment 4B does not let you open the lock on Apartment 3A.",
    internalDeepDive: "Every query dispatched to the database must strictly mandate a WHERE organization_id = :orgId predicate or utilize Postgres Row-Level Security (RLS).",
    expectedInvariants: ["caller verified as Tenant Beta", "requested task belongs to foreign tenant"],
    prediction: {
      id: "pred-tenant-1",
      question: "Where should the tenant constraint originate from for all subsequent database queries?",
      options: [
        {
          id: "opt-1",
          text: "From req.user.organizationId verified by the cryptographic JWT.",
          isCorrect: true,
          explanation: "Correct! The verified token claims are the single source of truth for tenant identity.",
        },
        {
          id: "opt-2",
          text: "From an HTTP query parameter '?tenant=acme' passed in the URL.",
          isCorrect: false,
          explanation: "Incorrect. URL query parameters can be easily tampered with by any client.",
        },
      ],
    },
  },
  {
    stepIndex: 2,
    totalSteps: 5,
    title: "Controller Extracts Scoped Tenant Context",
    description: "Controller receives GET /tasks/task_alpha_101 and passes req.user.organizationId into taskService.getTaskById.",
    filePath: "src/controllers/task.controller.ts",
    lineStart: 45,
    lineEnd: 50,
    functionName: "getTaskById",
    codeSnippet: `const { id } = req.params;
const { organizationId } = req.user!;
const task = await this.taskService.getTaskById(id, organizationId);
return res.status(200).json({ success: true, data: task });`,
    callStack: [
      { functionName: "taskController.getTaskById(req, res)", filePath: "src/controllers/task.controller.ts", line: 45, depth: 1 },
    ],
    variables: {
      "id": { value: '"task_alpha_101"', type: "string", scope: "local" },
      "organizationId": { value: '"org_beta_99"', type: "string", scope: "local" },
    },
    architectureStage: "controller",
    componentName: "Task Controller",
    dataFlowSummary: "Controller binds caller's verified orgId with query parameter id.",
    tellExplanation: "Notice line 545: the controller calls getTaskById(id, organizationId). It refuses to query by ID alone! Both the resource ID and the tenant organizationId are coupled together as a compound constraint.",
    askQuestion: "What would happen if the controller called getTaskById(id) without passing organizationId?",
    whyThisQuestionMatters: "If organizationId is omitted, the service would look up the task globally and inadvertently leak Tenant Alpha's confidential task to Tenant Beta.",
    beginnerAnalogy: "Looking up an employee by their employee badge number AND company name, so duplicate badge numbers in other companies aren't confused.",
    internalDeepDive: "In defensive programming, repository interfaces should mandate tenant context in every read and write method signature.",
    expectedInvariants: ["organizationId is coupled with id", "no un-scoped lookups are permitted"],
    prediction: {
      id: "pred-tenant-2",
      question: "If a developer mistakenly wrote this.taskService.getTaskById(id) without orgId, what bug would be introduced?",
      options: [
        {
          id: "opt-1",
          text: "Insecure Direct Object Reference (IDOR), allowing any tenant to view any other tenant's tasks by guessing the ID.",
          isCorrect: true,
          explanation: "Spot on! That is the textbook definition of an IDOR vulnerability.",
        },
        {
          id: "opt-2",
          text: "A memory leak in the Node.js garbage collector.",
          isCorrect: false,
          explanation: "Incorrect. The issue is security and authorization scoping, not garbage collection.",
        },
      ],
    },
  },
  {
    stepIndex: 3,
    totalSteps: 5,
    title: "Service Queries Repository with Multi-Tenant Scoping",
    description: "TaskService calls repository findById(id, orgId). Domain layer never queries by id alone.",
    filePath: "src/services/task.service.ts",
    lineStart: 60,
    lineEnd: 65,
    functionName: "getTaskById",
    codeSnippet: `const task = await this.repo.findById(id, orgId);
if (!task) {
  throw new NotFoundError("Task not found in tenant organization");
}
return task;`,
    callStack: [
      { functionName: "taskService.getTaskById(id, orgId)", filePath: "src/services/task.service.ts", line: 60, depth: 2 },
    ],
    variables: {
      "id": { value: '"task_alpha_101"', type: "string", scope: "param" },
      "orgId": { value: '"org_beta_99"', type: "string", scope: "param" },
    },
    architectureStage: "service",
    componentName: "Task Domain Service",
    dataFlowSummary: "Tenant constraint propagated to repository.",
    tellExplanation: "The domain service enforces the null-check invariant: if the repository returns null, the service throws a NotFoundError. Notice the message: 'Task not found in tenant organization'.",
    askQuestion: "Why does the service treat a missing task and a foreign-tenant task identically as 'NotFoundError'?",
    whyThisQuestionMatters: "Treating them identically prevents side-channel information leakage. An attacker cannot find out whether an ID exists in another company's account.",
    beginnerAnalogy: "If a stranger asks a hotel clerk if a celebrity is staying in room 204, the clerk simply says 'No such guest under your name' rather than confirming the celebrity is there.",
    internalDeepDive: "Returning 404 instead of 403 prevents timing attacks and identifier enumeration across multi-tenant clusters.",
    expectedInvariants: ["repository called with compound key", "null result maps to NotFoundError"],
    prediction: {
      id: "pred-tenant-3",
      question: "What does the service do if this.repo.findById returns null?",
      options: [
        {
          id: "opt-1",
          text: "It throws NotFoundError, indicating the task does not exist within the caller's tenant scope.",
          isCorrect: true,
          explanation: "Exact! The domain layer handles missing or foreign tasks uniformly.",
        },
        {
          id: "opt-2",
          text: "It creates a brand new blank task with that ID automatically.",
          isCorrect: false,
          explanation: "Incorrect. A GET request should never mutate or create resources.",
        },
      ],
    },
  },
  {
    stepIndex: 4,
    totalSteps: 5,
    title: "Repository Enforces Tenant Boundary Check",
    description: "Repository looks up record by id, checks item.organizationId !== orgId, and returns null instead of leaking the foreign tenant record.",
    filePath: "src/repositories/task.repository.ts",
    lineStart: 58,
    lineEnd: 67,
    functionName: "findById",
    codeSnippet: `const item = TaskRepository.store.get(id);
if (!item) return null;
if (item.organizationId !== orgId) {
  // Enforce multi-tenant logical isolation boundary
  return null;
}
return { ...item };`,
    callStack: [
      { functionName: "taskRepository.findById('task_alpha_101', 'org_beta_99')", filePath: "src/repositories/task.repository.ts", line: 58, depth: 3 },
    ],
    variables: {
      "item.id": { value: '"task_alpha_101"', type: "string", scope: "local" },
      "item.organizationId": { value: '"org_alpha_01"', type: "string", scope: "local" },
      "orgId (caller)": { value: '"org_beta_99"', type: "string", scope: "param" },
      "boundaryCheck": { value: '"org_alpha_01 !== org_beta_99 -> null"', type: "string", scope: "local" },
    },
    architectureStage: "repository",
    componentName: "Task Data Repository",
    dataFlowSummary: "Tenant mismatch detected; null returned. Cross-tenant leakage prevented.",
    tellExplanation: "Look at line 594: item.organizationId !== orgId. The task actually exists in memory (it belongs to org_alpha_01), but the caller is org_beta_99. The repository immediately returns null. The foreign record is protected!",
    askQuestion: "Why does the repository return null instead of throwing an explicit 'AccessDeniedError'?",
    whyThisQuestionMatters: "To avoid leaking existence of IDs across tenants (prevents tenant enumeration and ID probing attacks).",
    beginnerAnalogy: "Like a private PO Box: the key won't open anyone else's box, and the clerk won't tell you who owns box 101.",
    internalDeepDive: "In SQL, this is equivalent to: SELECT * FROM tasks WHERE id = $1 AND organization_id = $2. Zero rows match, so the database driver returns null.",
    expectedInvariants: ["foreign tenant record hidden", "null returned to enforce isolation"],
    prediction: {
      id: "pred-tenant-4",
      question: "Why does the repository return null instead of throwing an explicit 'AccessDeniedError'?",
      options: [
        {
          id: "opt-1",
          text: "To avoid leaking existence of IDs across tenants (prevents tenant enumeration / ID probing attacks).",
          isCorrect: true,
          explanation: "Excellent security practice! Returning 404 Not Found prevents malicious tenants from discovering what IDs exist in other tenant organizations.",
        },
        {
          id: "opt-2",
          text: "Because TypeScript cannot throw errors inside repository methods.",
          isCorrect: false,
          explanation: "Incorrect. Any TypeScript method can throw errors.",
        },
      ],
    },
  },
  {
    stepIndex: 5,
    totalSteps: 5,
    title: "HTTP 404 Not Found Returned to Beta Tenant",
    description: "Service throws NotFoundError, mapped to HTTP 404. Tenant Beta receives zero information about Tenant Alpha's tasks.",
    filePath: "src/middleware/error-handler.ts",
    lineStart: 25,
    lineEnd: 30,
    functionName: "errorHandler",
    codeSnippet: `if (err instanceof NotFoundError) {
  return res.status(404).json({ error: "Not Found", message: err.message });
}`,
    callStack: [
      { functionName: "errorHandler(err, req, res, next)", filePath: "src/middleware/error-handler.ts", line: 25, depth: 1 },
    ],
    variables: {
      "res.statusCode": { value: "404", type: "number", scope: "local", mutated: true },
      "error.message": { value: '"Task not found in tenant organization"', type: "string", scope: "local" },
    },
    architectureStage: "middleware",
    componentName: "Global Error Handler",
    dataFlowSummary: "404 Not Found dispatched. Tenant boundary intact.",
    tellExplanation: "The request completes with an HTTP 404 Not Found. Tenant Beta receives an error message indicating no such task exists in their organization. The isolation boundary held completely intact.",
    askQuestion: "What is the final security guarantee established by this full execution path?",
    whyThisQuestionMatters: "Complete tenant data privacy: a customer can never view, mutate, or detect the existence of another customer's records, even when sharing the same application and database.",
    beginnerAnalogy: "Complete soundproofing between two hotel rooms.",
    internalDeepDive: "Clean error serialization with HTTP 404 terminates the socket exchange without exposing internal stack traces or database schema details.",
    expectedInvariants: ["HTTP 404 dispatched", "zero data leakage occurred"],
    prediction: {
      id: "pred-tenant-5",
      question: "What information did Tenant Beta learn about Tenant Alpha's task?",
      options: [
        {
          id: "opt-1",
          text: "Absolutely nothing: Tenant Beta only received a standard 404 Not Found error.",
          isCorrect: true,
          explanation: "Spot on! The multi-tenant boundary is impenetrable.",
        },
        {
          id: "opt-2",
          text: "They learned the task title and the database password.",
          isCorrect: false,
          explanation: "Incorrect. Zero data or metadata was leaked.",
        },
      ],
    },
  },
];

// -----------------------------------------------------------------------------
// WORKFLOW REGISTRY
// -----------------------------------------------------------------------------
export const TRACE_WORKFLOWS: Record<string, TraceWorkflow> = {
  "taskflow_create_task": {
    id: "taskflow_create_task",
    codebaseId: "taskflow-api-v1",
    title: "TaskFlow: End-to-End Task Creation Lifecycle",
    subtitle: "Follow an HTTP POST request across all 6 architectural layers from client to repository.",
    description: "Step through request validation, JWT claim extraction, domain validation, optimistic versioning, and repository persistence.",
    scenarioType: "happy_path",
    initialPayload: { title: "Implement Auth", priority: "HIGH" },
    frames: TASKFLOW_CREATE_TASK_FRAMES,
  },
  "taskflow_concurrency_conflict": {
    id: "taskflow_concurrency_conflict",
    codebaseId: "taskflow-api-v1",
    title: "TaskFlow: Optimistic Concurrency Race Condition",
    subtitle: "Observe two clients attempting simultaneous mutations and see how version locking prevents lost updates.",
    description: "Step through concurrent updates, version counter mismatch detection, and HTTP 409 Conflict error mapping.",
    scenarioType: "concurrency_conflict",
    initialPayload: { taskId: "task_101", targetStatus: "ARCHIVED", expectedVersion: 1 },
    frames: TASKFLOW_CONCURRENCY_CONFLICT_FRAMES,
  },
  "taskflow_cross_tenant_rejection": {
    id: "taskflow_cross_tenant_rejection",
    codebaseId: "taskflow-api-v1",
    title: "TaskFlow: Multi-Tenant Boundary Enforcement",
    subtitle: "Witness how tenant isolation prevents cross-organization data leakage.",
    description: "Trace how a tenant querying another tenant's task ID is cleanly rejected with 404 to prevent resource enumeration.",
    scenarioType: "security_violation",
    initialPayload: { requestedTaskId: "task_alpha_101", tenantToken: "org_beta_99" },
    frames: TASKFLOW_TENANT_ISOLATION_FRAMES,
  },
};

/**
 * Helper to fetch a trace workflow by ID
 */
export function getTraceWorkflow(workflowId: string): TraceWorkflow | null {
  return TRACE_WORKFLOWS[workflowId] || null;
}

/**
 * Helper to validate a student prediction during "WE DO" or "YOU DO" mode
 */
export function evaluatePrediction(
  workflowId: string,
  stepIndex: number,
  selectedOptionId: string
): { isCorrect: boolean; explanation: string; nextRecommendedStep?: number } {
  const workflow = getTraceWorkflow(workflowId);
  if (!workflow) {
    return { isCorrect: false, explanation: "Unknown workflow ID" };
  }

  const frame = workflow.frames.find((f) => f.stepIndex === stepIndex);
  if (!frame || !frame.prediction) {
    return { isCorrect: false, explanation: "No prediction checkpoint at this step" };
  }

  const option = frame.prediction.options.find((o) => o.id === selectedOptionId);
  if (!option) {
    return { isCorrect: false, explanation: "Invalid option selected" };
  }

  return {
    isCorrect: option.isCorrect,
    explanation: option.explanation,
    nextRecommendedStep: stepIndex < workflow.frames.length ? stepIndex + 1 : undefined,
  };
}
