/**
 * Code Comprehension Lab — Stage 4: Repository Blueprint System & Knowledge Graph
 * 
 * Provides Zod validation schema for codebases, automated knowledge graph extraction
 * (Files -> Functions -> Calls -> Dependencies -> Data Flow), seeded bug definitions,
 * and reproducible test harness verifications.
 */

import { z } from "zod";

// -----------------------------------------------------------------------------
// KNOWLEDGE GRAPH SCHEMAS
// -----------------------------------------------------------------------------
export const GraphNodeTypeSchema = z.enum([
  "file",
  "endpoint",
  "middleware",
  "controller",
  "service",
  "repository",
  "database_table",
  "type_definition",
]);
export type GraphNodeType = z.infer<typeof GraphNodeTypeSchema>;

export const GraphEdgeTypeSchema = z.enum([
  "imports",
  "routes_to",
  "invokes",
  "depends_on",
  "reads_from",
  "writes_to",
  "validates_with",
]);
export type GraphEdgeType = z.infer<typeof GraphEdgeTypeSchema>;

export const KnowledgeGraphNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: GraphNodeTypeSchema,
  filePath: z.string(),
  lineStart: z.number().optional(),
  lineEnd: z.number().optional(),
  description: z.string(),
  exportedSymbols: z.array(z.string()).default([]),
});
export type KnowledgeGraphNode = z.infer<typeof KnowledgeGraphNodeSchema>;

export const KnowledgeGraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: GraphEdgeTypeSchema,
  description: z.string().optional(),
});
export type KnowledgeGraphEdge = z.infer<typeof KnowledgeGraphEdgeSchema>;

export const KnowledgeGraphSchema = z.object({
  nodes: z.array(KnowledgeGraphNodeSchema),
  edges: z.array(KnowledgeGraphEdgeSchema),
});
export type KnowledgeGraph = z.infer<typeof KnowledgeGraphSchema>;

// -----------------------------------------------------------------------------
// SEEDED BUGS & REPRODUCIBLE TEST SUITE SCHEMAS
// -----------------------------------------------------------------------------
export const SeededBugCategorySchema = z.enum([
  "detective",
  "bug_hunter",
  "architecture_explorer",
  "ai_auditor",
  "concurrency",
  "security",
]);
export type SeededBugCategory = z.infer<typeof SeededBugCategorySchema>;

export const SeededBugSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: SeededBugCategorySchema,
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string(),
  symptom: z.string(),
  locusFile: z.string(),
  locusLineRange: z.object({
    start: z.number(),
    end: z.number(),
  }),
  rootCause: z.string(),
  failingTestName: z.string(),
  expectedFixSummary: z.string(),
});
export type SeededBug = z.infer<typeof SeededBugSchema>;

export const RepositoryBlueprintSchema = z.object({
  repoId: z.string(),
  name: z.string(),
  version: z.string(),
  domain: z.enum(["saas", "ecommerce", "ai_rag", "fintech"]),
  entryPoint: z.string(),
  description: z.string(),
  architectureModel: z.enum(["layered_monolith", "hexagonal", "event_driven", "microservices"]),
  knowledgeGraph: KnowledgeGraphSchema,
  seededBugs: z.array(SeededBugSchema),
  techStack: z.array(z.string()),
});
export type RepositoryBlueprint = z.infer<typeof RepositoryBlueprintSchema>;

// -----------------------------------------------------------------------------
// CANONICAL BLUEPRINT: TaskFlow API v1
// -----------------------------------------------------------------------------
export const TASKFLOW_BLUEPRINT: RepositoryBlueprint = {
  repoId: "taskflow-api-v1",
  name: "TaskFlow Multi-Tenant Work Management API",
  version: "1.0.4",
  domain: "saas",
  entryPoint: "src/server.ts",
  description: "Production-grade multi-tenant task coordination platform built with TypeScript, Express, and PostgreSQL model semantics with optimistic locking.",
  architectureModel: "layered_monolith",
  techStack: ["TypeScript 5", "Node.js 20", "Express 4", "Zod", "PostgreSQL 16 Semantics", "JWT"],
  knowledgeGraph: {
    nodes: [
      {
        id: "server",
        name: "server.ts",
        type: "file",
        filePath: "src/server.ts",
        description: "Application bootstrap, middleware wiring, and HTTP listener lifecycle.",
        exportedSymbols: ["app", "startServer"],
      },
      {
        id: "router_tasks",
        name: "task.routes.ts",
        type: "endpoint",
        filePath: "src/routes/task.routes.ts",
        description: "RESTful HTTP route declarations for /api/v1/tasks.",
        exportedSymbols: ["taskRouter"],
      },
      {
        id: "middleware_auth",
        name: "auth.ts",
        type: "middleware",
        filePath: "src/middleware/auth.ts",
        description: "Cryptographic JWT verification, tenant claims decoding, and RBAC enforcement.",
        exportedSymbols: ["authenticateToken", "requireRole"],
      },
      {
        id: "middleware_val",
        name: "validation.ts",
        type: "middleware",
        filePath: "src/middleware/validation.ts",
        description: "Zod schema validation middleware preventing malformed payloads from reaching controllers.",
        exportedSymbols: ["validateRequestBody"],
      },
      {
        id: "controller_task",
        name: "task.controller.ts",
        type: "controller",
        filePath: "src/controllers/task.controller.ts",
        description: "HTTP transport adapter unpacks validated body and user context, delegates to task service.",
        exportedSymbols: ["TaskController"],
      },
      {
        id: "service_task",
        name: "task.service.ts",
        type: "service",
        filePath: "src/services/task.service.ts",
        description: "Domain logic enforcing state transition matrix, priority validation, and optimistic concurrency version increments.",
        exportedSymbols: ["TaskService"],
      },
      {
        id: "repo_task",
        name: "task.repository.ts",
        type: "repository",
        filePath: "src/repositories/task.repository.ts",
        description: "Tenant-isolated data access layer implementing PostgreSQL relational semantics with optimistic locking.",
        exportedSymbols: ["TaskRepository", "TaskEntity"],
      },
      {
        id: "table_tasks",
        name: "tasks (PostgreSQL Model)",
        type: "database_table",
        filePath: "src/repositories/task.repository.ts",
        description: "Relational task entity model indexed on (organization_id, id) for multi-tenant partition isolation.",
        exportedSymbols: ["TaskEntity"],
      },
    ],
    edges: [
      { source: "server", target: "router_tasks", type: "imports", description: "Registers task router at /api/v1/tasks" },
      { source: "router_tasks", target: "middleware_auth", type: "invokes", description: "Enforces authenticateToken on all task endpoints" },
      { source: "router_tasks", target: "middleware_val", type: "invokes", description: "Validates request payload schema" },
      { source: "router_tasks", target: "controller_task", type: "routes_to", description: "Dispatches sanitized requests to controller methods" },
      { source: "controller_task", target: "service_task", type: "invokes", description: "Delegates business operations with tenant orgId" },
      { source: "service_task", target: "repo_task", type: "invokes", description: "Performs atomic domain queries with optimistic locking" },
      { source: "repo_task", target: "table_tasks", type: "writes_to", description: "Executes tenant-scoped CRUD operations" },
    ],
  },
  seededBugs: [
    {
      id: "bug-detective-rbac",
      name: "RBAC Status Check Bypass (Detective)",
      category: "detective",
      severity: "high",
      description: "Non-admin team members can transition tasks directly to ARCHIVED status due to flawed condition in requireRole middleware.",
      symptom: "A DEVELOPER role user successfully sends PATCH /tasks/:id/status with 'ARCHIVED', bypassing administrative review.",
      locusFile: "src/middleware/auth.ts",
      locusLineRange: { start: 45, end: 55 },
      rootCause: "requireRole middleware uses 'roles.some()' with inverted check or missing role hierarchy mapping.",
      failingTestName: "should reject DEVELOPER transitioning task to ARCHIVED with 403 Forbidden",
      expectedFixSummary: "Enforce strict role hierarchy check: only ADMIN or LEAD roles can archive tasks.",
    },
    {
      id: "bug-hunter-concurrency",
      name: "Lost Update Race Condition (Bug Hunter)",
      category: "bug_hunter",
      severity: "critical",
      description: "Concurrent updates overwrite each other without version increment verification.",
      symptom: "When two requests update the same task simultaneously, the second write silently overwrites the first.",
      locusFile: "src/repositories/task.repository.ts",
      locusLineRange: { start: 70, end: 76 },
      rootCause: "Missing atomic version comparison or failure to increment version upon update.",
      failingTestName: "should throw ConcurrencyConflictError when expectedVersion does not match currentVersion",
      expectedFixSummary: "Compare currentVersion against stored version and atomically increment version upon successful update.",
    },
    {
      id: "bug-arch-layer-leak",
      name: "Controller-to-Repository Layer Leak (Architecture Explorer)",
      category: "architecture_explorer",
      severity: "medium",
      description: "TaskController directly invokes TaskRepository.store.set(), bypassing TaskService domain state transition validation.",
      symptom: "Tasks can enter illegal statuses (e.g., TODO directly to ARCHIVED) when updated through batch route.",
      locusFile: "src/controllers/task.controller.ts",
      locusLineRange: { start: 58, end: 68 },
      rootCause: "Controller bypasses Service layer and accesses repository directly.",
      failingTestName: "should reject invalid state transitions even via batch operations",
      expectedFixSummary: "Route all batch updates through TaskService.transitionStatus to enforce the state machine.",
    },
    {
      id: "bug-ai-auditor-insecure-regex",
      name: "AI Hallucinated Regex DoS Vulnerability (AI Auditor)",
      category: "ai_auditor",
      severity: "high",
      description: "An AI-generated title sanitizer uses an evil catastrophic backtracking regular expression.",
      symptom: "Specially crafted long task titles cause 100% CPU spike and hang the Node.js event loop for seconds.",
      locusFile: "src/services/task.service.ts",
      locusLineRange: { start: 20, end: 26 },
      rootCause: "ReDoS pattern `^([a-zA-Z0-9]+ )+$` in title validation.",
      failingTestName: "should sanitize title in linear time without event loop lag",
      expectedFixSummary: "Replace catastrophic backtracking regex with safe linear character scanner or standard Zod string constraints.",
    },
  ],
};

/**
 * Validates a repository blueprint against the schema
 */
export function validateBlueprint(blueprint: unknown): { success: boolean; data?: RepositoryBlueprint; error?: string } {
  const result = RepositoryBlueprintSchema.safeParse(blueprint);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }
  return { success: true, data: result.data };
}

/**
 * Analyzes knowledge graph connectivity and returns architectural summary
 */
export function analyzeKnowledgeGraph(graph: KnowledgeGraph): {
  totalNodes: number;
  totalEdges: number;
  entryNodes: string[];
  dataSinks: string[];
  maxCallDepth: number;
} {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const node of graph.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1);
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
  }

  const entryNodes = graph.nodes.filter((n) => (incoming.get(n.id) || 0) === 0).map((n) => n.id);
  const dataSinks = graph.nodes.filter((n) => (outgoing.get(n.id) || 0) === 0).map((n) => n.id);

  // Compute maximum dependency path depth via simple DAG traversal
  let maxCallDepth = 1;
  const visit = (currentId: string, currentDepth: number, visited: Set<string>) => {
    if (visited.has(currentId)) return;
    visited.add(currentId);
    maxCallDepth = Math.max(maxCallDepth, currentDepth);
    const children = graph.edges.filter((e) => e.source === currentId).map((e) => e.target);
    for (const child of children) {
      visit(child, currentDepth + 1, new Set(visited));
    }
  };

  for (const entry of entryNodes) {
    visit(entry, 1, new Set());
  }

  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    entryNodes,
    dataSinks,
    maxCallDepth,
  };
}

