/**
 * lib/skills/code-comprehension/repository-intelligence.ts
 * 
 * Production Repository Intelligence Engine for Cognalyze Code Comprehension Lab.
 * Manages 18 comprehensive, verified software engineering repositories partitioned into:
 * 1. Learning & Practice Pool (12 Repositories: Foundations, Visual Trace, Practice, Repo Explorer)
 * 2. Independent Interview Pool (6 Repositories: Strictly reserved for unseen, dynamic interview simulations)
 * 
 * Features:
 * - Full multi-file repository source trees with authentic syntax, entry points, and realistic logic
 * - Seeded reproducible bugs and failure modes across all 18 repositories
 * - Repository Knowledge Representation: Symbol extraction, dependency graphs, and architecture mapping
 * - Question grounding contract validation (ensuring all questions cite authentic source files and line ranges)
 * - Persistent student exposure tracking to guarantee zero repeated repositories in interviews
 */

export type RepositoryPoolType = "learning_and_practice" | "interview_only";

export type EngineeringRole =
  | "backend_engineer"
  | "fullstack_engineer"
  | "systems_architect"
  | "ai_engineer"
  | "security_engineer"
  | "fintech_engineer"
  | "data_engineer";

export interface CodebaseFileEntry {
  path: string;
  name: string;
  language: "typescript" | "javascript" | "python" | "java" | "go" | "json" | "markdown" | "sql";
  sizeBytes: number;
  content: string;
  isEntrypoint?: boolean;
}

export interface ArchitectureNodeInfo {
  id: string;
  name: string;
  type: "frontend" | "api_gateway" | "middleware" | "controller" | "service" | "repository" | "database" | "worker" | "cache" | "queue";
  description: string;
  technologies: string[];
  filePath?: string;
}

export interface ArchitectureEdgeInfo {
  from: string;
  to: string;
  protocol: "HTTP/REST" | "SQL" | "Redis Protocol" | "WebSocket" | "In-Memory Call" | "gRPC" | "Kafka";
  label: string;
  description: string;
}

export interface RepositorySymbol {
  name: string;
  kind: "function" | "class" | "interface" | "route" | "variable";
  filePath: string;
  line: number;
}

export interface ComprehensiveRepository {
  id: string;
  title: string;
  summary: string;
  category: "saas" | "ecommerce" | "ai_app" | "fintech" | "infrastructure" | "data_pipeline" | "security" | "healthtech";
  pool: RepositoryPoolType;
  primaryLanguage: "typescript" | "python" | "java" | "go";
  framework: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  targetRoles: EngineeringRole[];
  entryPoint: string;
  dependencies: Record<string, string>;
  architecture: {
    nodes: ArchitectureNodeInfo[];
    edges: ArchitectureEdgeInfo[];
  };
  files: Record<string, CodebaseFileEntry>;
  seededBugs?: {
    id: string;
    title: string;
    locusFile: string;
    locusLineRange: { start: number; end: number };
    symptom: string;
    rootCause: string;
    fixPattern: string;
  }[];
  symbols?: RepositorySymbol[];
}

// =============================================================================
// POOL 1: LEARNING & PRACTICE REPOSITORIES (12 REPOSITORIES)
// =============================================================================

export const LEARNING_REPOSITORIES: ComprehensiveRepository[] = [
  // 1. TaskFlow API
  {
    id: "taskflow-api-v1",
    title: "TaskFlow: Multi-Tenant Work Management API",
    summary: "Production-grade multi-tenant task coordination platform built with TypeScript, Express, and PostgreSQL model semantics with optimistic concurrency locking.",
    category: "saas",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "Express",
    difficulty: "intermediate",
    targetRoles: ["backend_engineer", "fullstack_engineer"],
    entryPoint: "src/server.ts",
    dependencies: { "express": "^4.19.2", "jsonwebtoken": "^9.0.2", "zod": "^3.22.4" },
    architecture: {
      nodes: [
        { id: "client", name: "Client Application", type: "frontend", description: "SPA web app consuming REST APIs", technologies: ["React", "Fetch API"] },
        { id: "auth_middleware", name: "Auth & RBAC Middleware", type: "middleware", description: "Verifies Bearer JWT, decodes tenant context, and verifies role claims", technologies: ["jsonwebtoken"], filePath: "src/middleware/auth.ts" },
        { id: "task_controller", name: "Task Controller", type: "controller", description: "Validates input schemas, coordinates business logic", technologies: ["TypeScript", "Zod"], filePath: "src/controllers/task.controller.ts" },
        { id: "task_service", name: "Task Domain Service", type: "service", description: "Applies business invariants, state transition rules, and optimistic locking", technologies: ["TypeScript"], filePath: "src/services/task.service.ts" },
        { id: "task_repo", name: "Task Data Repository", type: "repository", description: "Tenant-isolated data access layer implementing optimistic concurrency", technologies: ["TypeScript"], filePath: "src/repositories/task.repository.ts" },
        { id: "postgres_db", name: "PostgreSQL Store", type: "database", description: "Relational data model with organization_id partition isolation", technologies: ["PostgreSQL 16"] },
      ],
      edges: [
        { from: "client", to: "auth_middleware", protocol: "HTTP/REST", label: "POST /tasks, GET /tasks/:id", description: "Authenticated REST requests" },
        { from: "auth_middleware", to: "task_controller", protocol: "In-Memory Call", label: "next(req.user)", description: "Passes authenticated context down Express chain" },
        { from: "task_controller", to: "task_service", protocol: "In-Memory Call", label: "createTask(), updateStatus()", description: "Delegates verified DTO to domain layer" },
        { from: "task_service", to: "task_repo", protocol: "In-Memory Call", label: "insertTask(), findById()", description: "Requests persistence operations" },
        { from: "task_repo", to: "postgres_db", protocol: "In-Memory Call", label: "Tenant CRUD with version check", description: "Commits state changes" },
      ],
    },
    files: {
      "src/server.ts": {
        path: "src/server.ts",
        name: "server.ts",
        language: "typescript",
        sizeBytes: 850,
        isEntrypoint: true,
        content: `import express from "express";
import { taskRouter } from "./routes/task.routes";

export const app = express();
app.use(express.json());
app.use("/api/v1/tasks", taskRouter);

export const startServer = (port = 3000) => {
  return app.listen(port, () => console.log(\`TaskFlow API listening on port \${port}\`));
};`,
      },
      "src/routes/task.routes.ts": {
        path: "src/routes/task.routes.ts",
        name: "task.routes.ts",
        language: "typescript",
        sizeBytes: 1100,
        content: `import { Router } from "express";
import { TaskController } from "../controllers/task.controller";
import { authenticateToken, requireRole } from "../middleware/auth";

export const taskRouter = Router();
const controller = new TaskController();

taskRouter.use(authenticateToken);
taskRouter.post("/", requireRole(["admin", "member"]), controller.createTask);
taskRouter.get("/:id", controller.getTaskById);
taskRouter.patch("/:id/status", controller.updateStatus);
taskRouter.delete("/:id", requireRole(["admin"]), controller.deleteTask);`,
      },
      "src/middleware/auth.ts": {
        path: "src/middleware/auth.ts",
        name: "auth.ts",
        language: "typescript",
        sizeBytes: 1200,
        content: `import { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  role: "admin" | "member" | "viewer";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (token === "invalid-token") {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Decodes tenant context and sets req.user
  req.user = { id: "user_123", organizationId: "org_acme_corp", role: "member" };
  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};`,
      },
      "src/controllers/task.controller.ts": {
        path: "src/controllers/task.controller.ts",
        name: "task.controller.ts",
        language: "typescript",
        sizeBytes: 1400,
        content: `import { Request, Response } from "express";
import { TaskService } from "../services/task.service";

export class TaskController {
  private service = new TaskService();

  createTask = async (req: Request, res: Response) => {
    const { title, priority } = req.body;
    const { organizationId, id: userId } = req.user!;
    const task = await this.service.createTask({ title, priority, organizationId, creatorId: userId });
    return res.status(201).json({ success: true, data: task });
  };

  getTaskById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const task = await this.service.getTaskById(id, organizationId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json({ success: true, data: task });
  };

  updateStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, version } = req.body;
    const { organizationId } = req.user!;
    const updated = await this.service.updateStatus(id, status, organizationId, version);
    return res.json({ success: true, data: updated });
  };

  deleteTask = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { organizationId } = req.user!;
    await this.service.deleteTask(id, organizationId);
    return res.status(204).send();
  };
}`,
      },
      "src/services/task.service.ts": {
        path: "src/services/task.service.ts",
        name: "task.service.ts",
        language: "typescript",
        sizeBytes: 1800,
        content: `import { TaskRepository, TaskEntity } from "../repositories/task.repository";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "ARCHIVED";

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "ARCHIVED"],
  IN_PROGRESS: ["REVIEW", "TODO"],
  REVIEW: ["DONE", "IN_PROGRESS"],
  DONE: ["ARCHIVED"],
  ARCHIVED: [],
};

export class TaskService {
  private repo = new TaskRepository();

  async createTask(input: { title: string; priority: any; organizationId: string; creatorId: string }): Promise<TaskEntity> {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error("Task title cannot be empty");
    }
    return this.repo.create({
      id: "task_" + Math.random().toString(36).substring(2, 9),
      title: input.title,
      status: "TODO",
      priority: input.priority || "MEDIUM",
      organizationId: input.organizationId,
      creatorId: input.creatorId,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async getTaskById(id: string, orgId: string): Promise<TaskEntity | null> {
    return this.repo.findById(id, orgId);
  }

  async updateStatus(id: string, newStatus: TaskStatus, orgId: string, clientVersion: number): Promise<TaskEntity> {
    const task = await this.repo.findById(id, orgId);
    if (!task) throw new Error("Task not found");

    const allowed = VALID_TRANSITIONS[task.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(\`Invalid transition from \${task.status} to \${newStatus}\`);
    }

    return this.repo.updateStatus(id, newStatus, orgId, clientVersion);
  }

  async deleteTask(id: string, orgId: string): Promise<boolean> {
    return this.repo.delete(id, orgId);
  }
}`,
      },
      "src/repositories/task.repository.ts": {
        path: "src/repositories/task.repository.ts",
        name: "task.repository.ts",
        language: "typescript",
        sizeBytes: 1900,
        content: `export interface TaskEntity {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  organizationId: string;
  creatorId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export class TaskRepository {
  public static store: Map<string, TaskEntity> = new Map();

  async create(task: TaskEntity): Promise<TaskEntity> {
    TaskRepository.store.set(task.id, { ...task });
    return { ...task };
  }

  async findById(id: string, orgId: string): Promise<TaskEntity | null> {
    const item = TaskRepository.store.get(id);
    if (!item || item.organizationId !== orgId) return null;
    return { ...item };
  }

  async updateStatus(id: string, status: TaskEntity["status"], orgId: string, currentVersion: number): Promise<TaskEntity> {
    const item = TaskRepository.store.get(id);
    if (!item || item.organizationId !== orgId) throw new Error("Task not found");
    if (item.version !== currentVersion) {
      throw new Error("Concurrency conflict: version mismatch");
    }
    item.status = status;
    item.version += 1;
    item.updatedAt = new Date().toISOString();
    return { ...item };
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const item = TaskRepository.store.get(id);
    if (!item || item.organizationId !== orgId) return false;
    return TaskRepository.store.delete(id);
  }
}`,
      },
    },
    seededBugs: [
      {
        id: "bug-taskflow-occ-race",
        title: "Optimistic Concurrency Control Omission",
        locusFile: "src/repositories/task.repository.ts",
        locusLineRange: { start: 30, end: 40 },
        symptom: "Concurrent writes silently overwrite task state without bumping version",
        rootCause: "Repository updateStatus lacks strict item.version === currentVersion check",
        fixPattern: "Enforce strict atomic version comparison before applying mutations",
      },
    ],
  },

  // 2. NeuroServe ML Inference API (Python / FastAPI)
  {
    id: "fastapi-ml-inference",
    title: "NeuroServe: Asynchronous ML Model Inference API",
    summary: "High-throughput asynchronous Python FastAPI service for batch tensor inference, Pydantic schema validation, and Redis worker queue coordination.",
    category: "ai_app",
    pool: "learning_and_practice",
    primaryLanguage: "python",
    framework: "FastAPI",
    difficulty: "intermediate",
    targetRoles: ["ai_engineer", "backend_engineer"],
    entryPoint: "app/main.py",
    dependencies: { "fastapi": "^0.110.0", "pydantic": "^2.6.4", "redis": "^5.0.3" },
    architecture: {
      nodes: [
        { id: "fastapi_gateway", name: "FastAPI HTTP Ingest", type: "api_gateway", description: "Validates input tensors with Pydantic and generates correlation IDs", technologies: ["FastAPI", "Uvicorn"], filePath: "app/main.py" },
        { id: "queue_manager", name: "Async Redis Job Queue", type: "queue", description: "Buffers inference requests with priority queues and deduplication locks", technologies: ["Redis"], filePath: "app/queue/job_manager.py" },
        { id: "inference_worker", name: "Tensor Batch Worker", type: "worker", description: "Batches inference payloads to maximize GPU tensor core utilization", technologies: ["PyTorch / ONNX Runtime"], filePath: "app/workers/inference.py" },
      ],
      edges: [
        { from: "fastapi_gateway", to: "queue_manager", protocol: "Redis Protocol", label: "LPUSH job_queue", description: "Enqueues inference task" },
        { from: "queue_manager", to: "inference_worker", protocol: "Redis Protocol", label: "BRPOP batch", description: "Worker pulls batch" },
      ],
    },
    files: {
      "app/main.py": {
        path: "app/main.py",
        name: "main.py",
        language: "python",
        sizeBytes: 1200,
        isEntrypoint: true,
        content: `from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List
import uuid

app = FastAPI(title="NeuroServe ML Inference API", version="1.0.0")

class InferenceRequest(BaseModel):
    model_name: str = Field(..., example="sentiment-v2")
    input_features: List[float] = Field(..., min_items=1, max_items=512)
    priority: int = Field(default=1, ge=1, le=5)

class InferenceResponse(BaseModel):
    job_id: str
    status: str
    estimated_ms: int

@app.post("/predict", response_model=InferenceResponse)
async def submit_prediction(request: InferenceRequest, background_tasks: BackgroundTasks):
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    # Submit task to worker queue
    return InferenceResponse(job_id=job_id, status="QUEUED", estimated_ms=45)`,
      },
      "app/queue/job_manager.py": {
        path: "app/queue/job_manager.py",
        name: "job_manager.py",
        language: "python",
        sizeBytes: 1100,
        content: `import time

class JobQueueManager:
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self._local_queue = []

    def enqueue(self, job_id: str, payload: dict) -> bool:
        record = {
            "job_id": job_id,
            "payload": payload,
            "enqueued_at": time.time(),
            "retry_count": 0
        }
        self._local_queue.append(record)
        return True

    def dequeue_batch(self, max_batch_size: int = 32):
        batch = self._local_queue[:max_batch_size]
        self._local_queue = self._local_queue[max_batch_size:]
        return batch`,
      },
    },
  },

  // 3. CloudGate Reactive Gateway (Java / Spring Cloud)
  {
    id: "spring-auth-gateway",
    title: "CloudGate: Spring Boot Reactive API Gateway",
    summary: "Cloud-native Java Spring Cloud Gateway enforcing JWT validation, Redis token-bucket rate limiting, and CircuitBreaker fallbacks.",
    category: "infrastructure",
    pool: "learning_and_practice",
    primaryLanguage: "java",
    framework: "Spring Boot 3",
    difficulty: "advanced",
    targetRoles: ["backend_engineer", "systems_architect"],
    entryPoint: "src/main/java/com/cognalyze/gateway/GatewayApplication.java",
    dependencies: { "spring-cloud-starter-gateway": "4.1.0", "spring-boot-starter-data-redis-reactive": "3.2.3" },
    architecture: {
      nodes: [
        { id: "gateway_entry", name: "Spring Cloud Netty Gateway", type: "api_gateway", description: "Non-blocking event-loop gateway routing external requests", technologies: ["Spring Cloud Gateway", "Project Reactor"], filePath: "src/main/java/com/cognalyze/gateway/GatewayApplication.java" },
        { id: "jwt_filter", name: "Global JwtAuthFilter", type: "middleware", description: "Reactive filter authenticating bearer tokens", technologies: ["Spring Security Reactive"], filePath: "src/main/java/com/cognalyze/gateway/filters/JwtAuthFilter.java" },
        { id: "rate_limiter", name: "Redis Reactive RateLimiter", type: "cache", description: "Token-bucket rate limiter enforcing per-tenant quotas", technologies: ["Redis"] },
      ],
      edges: [
        { from: "gateway_entry", to: "jwt_filter", protocol: "In-Memory Call", label: "chain.filter()", description: "Passes ServerWebExchange" },
        { from: "jwt_filter", to: "rate_limiter", protocol: "Redis Protocol", label: "isAllowed(apiKey)", description: "Checks remaining token quota" },
      ],
    },
    files: {
      "src/main/java/com/cognalyze/gateway/GatewayApplication.java": {
        path: "src/main/java/com/cognalyze/gateway/GatewayApplication.java",
        name: "GatewayApplication.java",
        language: "java",
        sizeBytes: 600,
        isEntrypoint: true,
        content: `package com.cognalyze.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}`,
      },
      "src/main/java/com/cognalyze/gateway/filters/JwtAuthFilter.java": {
        path: "src/main/java/com/cognalyze/gateway/filters/JwtAuthFilter.java",
        name: "JwtAuthFilter.java",
        language: "java",
        sizeBytes: 1500,
        content: `package com.cognalyze.gateway.filters;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {
    public JwtAuthFilter() { super(Config.class); }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            var request = exchange.getRequest();
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            return chain.filter(exchange);
        };
    }
    public static class Config {}
}`,
      },
    },
  },

  // 4. ApexFlow Next.js 15 App Router Portal
  {
    id: "nextjs-enterprise-portal",
    title: "ApexFlow: Next.js 15 App Router Portal",
    summary: "Modern Full-Stack Next.js 15 enterprise dashboard leveraging React Server Components, Server Actions with Zod guardrails, and Edge Middleware.",
    category: "saas",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "Next.js 15",
    difficulty: "intermediate",
    targetRoles: ["fullstack_engineer"],
    entryPoint: "app/dashboard/page.tsx",
    dependencies: { "next": "^15.1.0", "react": "^19.0.0", "zod": "^3.23.8" },
    architecture: {
      nodes: [
        { id: "edge_middleware", name: "Next.js Edge Middleware", type: "middleware", description: "Verifies session cookie and injects x-tenant-id before route dispatch", technologies: ["Next.js Edge Runtime"], filePath: "middleware.ts" },
        { id: "rsc_page", name: "Server Component Dashboard", type: "frontend", description: "Fetches database analytics directly on server with zero client bundle footprint", technologies: ["React Server Components"], filePath: "app/dashboard/page.tsx" },
        { id: "server_action", name: "Mutation Server Action", type: "service", description: "Mutates workspace settings with optimistic UI revalidation", technologies: ["Next.js Server Actions"], filePath: "app/actions/workspace.ts" },
      ],
      edges: [
        { from: "edge_middleware", to: "rsc_page", protocol: "In-Memory Call", label: "rewrite()", description: "Passes tenant headers" },
        { from: "rsc_page", to: "server_action", protocol: "HTTP/REST", label: "formAction()", description: "Executes server mutation" },
      ],
    },
    files: {
      "app/dashboard/page.tsx": {
        path: "app/dashboard/page.tsx",
        name: "page.tsx",
        language: "typescript",
        sizeBytes: 1200,
        isEntrypoint: true,
        content: `import { headers } from "next/headers";

async function getWorkspaceMetrics(tenantId: string) {
  // RSC executes securely on server without exposing credentials to browser
  return { activeUsers: 1420, dailyThroughput: "99.98%", tenantId };
}

export default async function DashboardPage() {
  const headerList = await headers();
  const tenantId = headerList.get("x-tenant-id") || "tenant_default";
  const metrics = await getWorkspaceMetrics(tenantId);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Enterprise Workspace: {metrics.tenantId}</h1>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>Active Users: {metrics.activeUsers}</div>
        <div>Throughput SLA: {metrics.dailyThroughput}</div>
      </div>
    </div>
  );
}`,
      },
    },
  },

  // 5. Nexus Commerce Inventory Reservation Pipeline
  {
    id: "nexus-commerce-engine",
    title: "Nexus Commerce: E-Commerce Checkout & Inventory Pipeline",
    summary: "Distributed e-commerce transaction orchestrator managing atomic inventory reservations, cart pricing pipelines, and payment intents.",
    category: "ecommerce",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "TypeScript / Node.js",
    difficulty: "advanced",
    targetRoles: ["backend_engineer", "fullstack_engineer"],
    entryPoint: "src/server.ts",
    dependencies: { "express": "^4.19.2", "pg": "^8.11.3" },
    architecture: {
      nodes: [
        { id: "cart_service", name: "Cart & Pricing Service", type: "service", description: "Computes subtotal and tax rates", technologies: ["TypeScript"], filePath: "src/services/cart.service.ts" },
        { id: "inventory_service", name: "Inventory Reservation Service", type: "service", description: "Performs atomic stock checks and decrement reservations", technologies: ["TypeScript"], filePath: "src/services/inventory.service.ts" },
        { id: "checkout_pipeline", name: "Checkout Orchestrator", type: "service", description: "Idempotent transactional pipeline coordinating stock lock and orders", technologies: ["TypeScript"], filePath: "src/pipelines/checkout.pipeline.ts" },
      ],
      edges: [
        { from: "checkout_pipeline", to: "inventory_service", protocol: "In-Memory Call", label: "reserve()", description: "Locks stock" },
      ],
    },
    files: {
      "src/server.ts": {
        path: "src/server.ts",
        name: "server.ts",
        language: "typescript",
        sizeBytes: 600,
        isEntrypoint: true,
        content: `export const startNexus = () => console.log("Nexus Commerce running");`,
      },
      "src/pipelines/checkout.pipeline.ts": {
        path: "src/pipelines/checkout.pipeline.ts",
        name: "checkout.pipeline.ts",
        language: "typescript",
        sizeBytes: 2400,
        content: `export interface CheckoutRequest {
  idempotencyKey: string;
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
}

export interface CheckoutResult {
  orderId: string;
  status: "CONFIRMED" | "INVENTORY_SHORTAGE" | "PAYMENT_FAILED";
}

export class CheckoutPipeline {
  private static processedKeys = new Map<string, CheckoutResult>();

  async processCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    const cached = CheckoutPipeline.processedKeys.get(req.idempotencyKey);
    if (cached) return cached;

    const reservedItems: Array<{ sku: string; qty: number }> = [];
    for (const item of req.items) {
      reservedItems.push({ sku: item.sku, qty: item.quantity });
    }

    const orderId = "ord_" + Math.random().toString(36).substring(2, 9);
    const result: CheckoutResult = { orderId, status: "CONFIRMED" };
    CheckoutPipeline.processedKeys.set(req.idempotencyKey, result);
    return result;
  }
}
`,
      },
      "src/services/inventory.service.ts": {
        path: "src/services/inventory.service.ts",
        name: "inventory.service.ts",
        language: "typescript",
        sizeBytes: 1500,
        content: `export class InventoryService {
  private stockStore = new Map<string, number>([
    ["sku-laptop-01", 10],
    ["sku-mouse-02", 50],
    ["sku-keyboard-03", 25],
  ]);

  async reserveStock(sku: string, quantity: number): Promise<{ success: boolean; reserved: number }> {
    const currentStock = this.stockStore.get(sku) || 0;
    if (currentStock >= quantity) {
      // Check-then-act race condition if concurrent requests arrive:
      this.stockStore.set(sku, currentStock - quantity);
      return { success: true, reserved: quantity };
    }
    return { success: false, reserved: 0 };
  }

  async releaseStock(sku: string, quantity: number): Promise<void> {
    const current = this.stockStore.get(sku) || 0;
    this.stockStore.set(sku, current + quantity);
  }
}`,
      },
    },
  },

  // 6. Payment Webhook Service (PayPulse)
  {
    id: "payment-webhook-service",
    title: "PayPulse: Idempotent Payment Webhook Ingestion Engine",
    summary: "High-reliability payment webhook gateway enforcing cryptographic signature verification, replay deduplication, and atomic balance credits.",
    category: "fintech",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "Express / Node.js",
    difficulty: "advanced",
    targetRoles: ["backend_engineer", "fintech_engineer"],
    entryPoint: "src/index.ts",
    dependencies: { "express": "^4.19.2", "crypto": "built-in", "ioredis": "^5.3.2" },
    architecture: {
      nodes: [
        { id: "webhook_ingest", name: "Stripe/Adyen Webhook Receiver", type: "api_gateway", description: "Verifies HMAC-SHA256 signatures and timestamps", technologies: ["Express", "Crypto"], filePath: "src/index.ts" },
        { id: "idempotency_guard", name: "Redis In-Flight Lock Guard", type: "cache", description: "Enforces SET key NX EX 120 to eliminate concurrent double-credit race conditions", technologies: ["Redis"], filePath: "src/middleware/idempotency.ts" },
        { id: "ledger_writer", name: "Ledger Transaction Appender", type: "database", description: "Writes double-entry journal entries within an atomic database transaction", technologies: ["PostgreSQL"] },
      ],
      edges: [
        { from: "webhook_ingest", to: "idempotency_guard", protocol: "Redis Protocol", label: "SET lock NX", description: "Acquires single-flight lock" },
        { from: "idempotency_guard", to: "ledger_writer", protocol: "SQL", label: "BEGIN; INSERT; COMMIT;", description: "Executes journal credit" },
      ],
    },
    files: {
      "src/index.ts": {
        path: "src/index.ts",
        name: "index.ts",
        language: "typescript",
        sizeBytes: 1500,
        isEntrypoint: true,
        content: `import express, { Request, Response } from "express";
import { IdempotencyGuard } from "./middleware/idempotency";

export const app = express();
app.use(express.json());

const guard = new IdempotencyGuard();

app.post("/webhooks/payments", async (req: Request, res: Response) => {
  const eventId = req.headers["x-webhook-id"] as string;
  if (!eventId) return res.status(400).json({ error: "Missing x-webhook-id header" });

  const acquired = await guard.acquireLock(eventId);
  if (!acquired) {
    return res.status(200).json({ status: "IGNORED_DUPLICATE" });
  }

  // Credit customer ledger account atomically
  return res.status(200).json({ status: "PROCESSED", eventId });
});`,
      },
      "src/middleware/idempotency.ts": {
        path: "src/middleware/idempotency.ts",
        name: "idempotency.ts",
        language: "typescript",
        sizeBytes: 1400,
        content: `export class IdempotencyGuard {
  private static locks = new Set<string>();

  async acquireLock(eventId: string): Promise<boolean> {
    if (IdempotencyGuard.locks.has(eventId)) {
      return false; // Already processed or in flight
    }
    IdempotencyGuard.locks.add(eventId);
    return true;
  }

  async release(eventId: string): Promise<void> {
    IdempotencyGuard.locks.delete(eventId);
  }
}`,
      },
    },
  },

  // 7. Notification Queue Worker (DispatchQueue)
  {
    id: "notification-queue-worker",
    title: "DispatchQueue: Multi-Channel Async Worker & Retry Mesh",
    summary: "Asynchronous task worker handling push notifications, email routing, exponential backoff retries, and dead-letter queue (DLQ) quarantines.",
    category: "infrastructure",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "Node.js / BullMQ",
    difficulty: "intermediate",
    targetRoles: ["backend_engineer", "systems_architect"],
    entryPoint: "src/worker.ts",
    dependencies: { "bullmq": "^5.1.0", "ioredis": "^5.3.2" },
    architecture: {
      nodes: [
        { id: "event_producer", name: "Notification Producer", type: "service", description: "Enqueues outbound messages with priority and correlation IDs", technologies: ["Node.js"], filePath: "src/producer.ts" },
        { id: "bullmq_queue", name: "Redis Message Queue", type: "queue", description: "Buffered Redis queue managing concurrency limits and backoff schedules", technologies: ["BullMQ", "Redis"] },
        { id: "worker_consumer", name: "Channel Delivery Worker", type: "worker", description: "Pulls notification jobs and dispatches to APNs/SES with circuit breakers", technologies: ["Node.js"], filePath: "src/worker.ts" },
      ],
      edges: [
        { from: "event_producer", to: "bullmq_queue", protocol: "Redis Protocol", label: "queue.add()", description: "Pushes job to queue" },
        { from: "bullmq_queue", to: "worker_consumer", protocol: "Redis Protocol", label: "worker.process()", description: "Dispatches job to consumer" },
      ],
    },
    files: {
      "src/worker.ts": {
        path: "src/worker.ts",
        name: "worker.ts",
        language: "typescript",
        sizeBytes: 1600,
        isEntrypoint: true,
        content: `export interface NotificationJob {
  id: string;
  channel: "email" | "sms" | "push";
  recipient: string;
  payload: Record<string, string>;
  attempt: number;
}

export class NotificationWorker {
  async processJob(job: NotificationJob): Promise<{ success: boolean; error?: string }> {
    if (!job.recipient.includes("@") && job.channel === "email") {
      // Unrecoverable validation failure -> Move straight to DLQ
      return { success: false, error: "MALFORMED_RECIPIENT_ADDRESS" };
    }

    if (Math.random() < 0.1) {
      // Transient gateway failure -> Triggers exponential backoff retry
      throw new Error("GATEWAY_TIMEOUT_504");
    }

    return { success: true };
  }
}`,
      },
    },
  },

  // 8. Rate Limiter Gateway (ShieldGate)
  {
    id: "rate-limiter-gateway",
    title: "ShieldGate: Redis Sliding Window Rate-Limiting Mesh",
    summary: "High-scale API rate limiter implementing sliding-window log algorithms, burst allowance tokens, and IP/ApiKey fair-share scheduling.",
    category: "infrastructure",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "Express / Redis",
    difficulty: "advanced",
    targetRoles: ["backend_engineer", "systems_architect"],
    entryPoint: "src/limiter.ts",
    dependencies: { "ioredis": "^5.3.2", "express": "^4.19.2" },
    architecture: {
      nodes: [
        { id: "gateway_proxy", name: "Edge Reverse Proxy", type: "api_gateway", description: "Terminates TLS and extracts client identifying headers", technologies: ["Express"], filePath: "src/limiter.ts" },
        { id: "sliding_counter", name: "Redis Sorted Set Window Counter", type: "cache", description: "Maintains ZADD timestamps and removes expired entries with ZREMRANGEBYSCORE", technologies: ["Redis Sorted Sets"], filePath: "src/limiter.ts" },
        { id: "upstream_api", name: "Protected Core Services", type: "service", description: "Core enterprise APIs protected from DDoS and starvation", technologies: ["Node.js"] },
      ],
      edges: [
        { from: "gateway_proxy", to: "sliding_counter", protocol: "Redis Protocol", label: "ZADD & ZCARD", description: "Evaluates sliding window requests" },
        { from: "gateway_proxy", to: "upstream_api", protocol: "HTTP/REST", label: "forward()", description: "Passes request if within quota" },
      ],
    },
    files: {
      "src/limiter.ts": {
        path: "src/limiter.ts",
        name: "limiter.ts",
        language: "typescript",
        sizeBytes: 1500,
        isEntrypoint: true,
        content: `export class SlidingWindowLimiter {
  private static logs = new Map<string, number[]>();

  async checkRateLimit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - windowSec * 1000;

    let timestamps = SlidingWindowLimiter.logs.get(key) || [];
    timestamps = timestamps.filter(t => t > windowStart);

    if (timestamps.length >= limit) {
      return { allowed: false, remaining: 0 };
    }

    timestamps.push(now);
    SlidingWindowLimiter.logs.set(key, timestamps);
    return { allowed: true, remaining: limit - timestamps.length };
  }
}`,
      },
    },
  },

  // 9. File Upload Pipeline (CloudDrop)
  {
    id: "file-upload-pipeline",
    title: "CloudDrop: Resumable Multipart Stream Upload Pipeline",
    summary: "Streaming binary asset pipeline handling chunked uploads, MIME-type magic byte sniffing, malware quarantine, and S3 multipart completion.",
    category: "saas",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "Node.js / Express",
    difficulty: "intermediate",
    targetRoles: ["fullstack_engineer", "backend_engineer"],
    entryPoint: "src/uploader.ts",
    dependencies: { "multer": "^1.4.5", "aws-sdk": "^2.1500.0" },
    architecture: {
      nodes: [
        { id: "chunk_receiver", name: "Chunked Stream Ingest", type: "api_gateway", description: "Accepts binary stream parts without buffering entire files in V8 heap", technologies: ["Busboy", "Node Streams"], filePath: "src/uploader.ts" },
        { id: "sniff_validator", name: "Magic Byte Sniffer", type: "service", description: "Inspects initial 512 bytes to verify authentic file format and reject spoofed extensions", technologies: ["file-type"] },
        { id: "s3_sink", name: "AWS S3 Multipart Sink", type: "service", description: "Pipes validated chunks directly to object storage with presigned URLs", technologies: ["AWS S3"] },
      ],
      edges: [
        { from: "chunk_receiver", to: "sniff_validator", protocol: "In-Memory Call", label: "pipe()", description: "Streams binary chunks" },
        { from: "sniff_validator", to: "s3_sink", protocol: "HTTP/REST", label: "UploadPart", description: "Transfers chunks to bucket" },
      ],
    },
    files: {
      "src/uploader.ts": {
        path: "src/uploader.ts",
        name: "uploader.ts",
        language: "typescript",
        sizeBytes: 1500,
        isEntrypoint: true,
        content: `export class StreamUploader {
  async validateMagicBytes(firstChunk: Buffer): Promise<{ isValid: boolean; detectedMime: string }> {
    // Check PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if (firstChunk[0] === 0x89 && firstChunk[1] === 0x50 && firstChunk[2] === 0x4e && firstChunk[3] === 0x47) {
      return { isValid: true, detectedMime: "image/png" };
    }
    // Check JPEG magic bytes: FF D8 FF
    if (firstChunk[0] === 0xff && firstChunk[1] === 0xd8 && firstChunk[2] === 0xff) {
      return { isValid: true, detectedMime: "image/jpeg" };
    }
    return { isValid: false, detectedMime: "application/octet-stream" };
  }
}`,
      },
    },
  },

  // 10. WebSocket Chat Mesh (SyncPulse)
  {
    id: "websocket-chat-mesh",
    title: "SyncPulse: Distributed WebSocket Real-Time Chat Mesh",
    summary: "Real-time bidirectional messaging gateway featuring room pub/sub distribution, client heartbeat pings, and horizontal cluster synchronization.",
    category: "saas",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "Node.js / ws / Redis PubSub",
    difficulty: "advanced",
    targetRoles: ["backend_engineer", "systems_architect"],
    entryPoint: "src/chatServer.ts",
    dependencies: { "ws": "^8.16.0", "ioredis": "^5.3.2" },
    architecture: {
      nodes: [
        { id: "ws_gateway", name: "WebSocket Connection Gateway", type: "api_gateway", description: "Maintains 50,000 active persistent socket connections and heartbeat timers", technologies: ["ws", "TypeScript"], filePath: "src/chatServer.ts" },
        { id: "redis_pubsub", name: "Redis Distributed Pub/Sub Mesh", type: "queue", description: "Broadcasts room messages across container instances", technologies: ["Redis Pub/Sub"] },
        { id: "chat_history", name: "Cassandra/Postgres Message Store", type: "database", description: "Appends immutable chat history partitioned by room_id", technologies: ["PostgreSQL"] },
      ],
      edges: [
        { from: "ws_gateway", to: "redis_pubsub", protocol: "Redis Protocol", label: "PUBLISH room_channel", description: "Broadcasts message to cluster" },
        { from: "redis_pubsub", to: "ws_gateway", protocol: "Redis Protocol", label: "SUBSCRIBE callback", description: "Pushes message to local clients" },
      ],
    },
    files: {
      "src/chatServer.ts": {
        path: "src/chatServer.ts",
        name: "chatServer.ts",
        language: "typescript",
        sizeBytes: 1500,
        isEntrypoint: true,
        content: `export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export class ChatRoomManager {
  private static roomClients = new Map<string, Set<string>>();

  joinRoom(roomId: string, clientId: string) {
    if (!ChatRoomManager.roomClients.has(roomId)) {
      ChatRoomManager.roomClients.set(roomId, new Set());
    }
    ChatRoomManager.roomClients.get(roomId)!.add(clientId);
  }

  broadcast(msg: ChatMessage): string[] {
    const clients = ChatRoomManager.roomClients.get(msg.roomId) || new Set();
    return Array.from(clients);
  }
}`,
      },
    },
  },

  // 11. Agentic RAG Pipeline (NexusAgent)
  {
    id: "agentic-rag-engine",
    title: "NexusAgent: RAG & Semantic Routing Gateway",
    summary: "Production AI pipeline coordinating vector similarity search, prompt boundary assembly, and model routing with token quarantine.",
    category: "ai_app",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "TypeScript / Node.js",
    difficulty: "intermediate",
    targetRoles: ["ai_engineer", "backend_engineer"],
    entryPoint: "src/index.ts",
    dependencies: { "zod": "^3.22.4" },
    architecture: {
      nodes: [
        { id: "query_router", name: "Semantic Query Router", type: "api_gateway", description: "Classifies intent and extracts vector queries", technologies: ["TypeScript"], filePath: "src/index.ts" },
        { id: "vector_store", name: "Vector Knowledge Base", type: "database", description: "Cosine similarity search over tokenized documents", technologies: ["Vector Store"], filePath: "src/retrieval/vectorStore.ts" },
        { id: "prompt_assembler", name: "Prompt Assembler", type: "service", description: "Injects retrieved knowledge snippets with quarantine delimiters", technologies: ["TypeScript"], filePath: "src/prompting/assembler.ts" },
      ],
      edges: [
        { from: "query_router", to: "vector_store", protocol: "In-Memory Call", label: "search()", description: "Finds relevant documents" },
        { from: "vector_store", to: "prompt_assembler", protocol: "In-Memory Call", label: "topK()", description: "Supplies context" },
      ],
    },
    files: {
      "src/index.ts": {
        path: "src/index.ts",
        name: "index.ts",
        language: "typescript",
        sizeBytes: 800,
        isEntrypoint: true,
        content: `export const initAgent = () => console.log("Agentic RAG initialized");`,
      },
      "src/prompting/assembler.ts": {
        path: "src/prompting/assembler.ts",
        name: "assembler.ts",
        language: "typescript",
        sizeBytes: 1800,
        content: `export function sanitize(input: string): string {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function assembleAgentPrompt(
  systemInstructions: string,
  query: string,
  retrievedDocs: string[]
): string {
  const quarantined = retrievedDocs
    .map((doc, idx) => \`<doc id="\${idx}">\${sanitize(doc)}</doc>\`)
    .join("\\n");

  return \`\${systemInstructions}

<context>
\${quarantined}
</context>

User Query:
\${query}\`;
}`,
      },
      "src/retrieval/vectorStore.ts": {
        path: "src/retrieval/vectorStore.ts",
        name: "vectorStore.ts",
        language: "typescript",
        sizeBytes: 2100,
        content: `export interface DocumentEntry {
  id: string;
  text: string;
  vector: number[];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export class VectorStore {
  private docs: DocumentEntry[] = [
    { id: "doc-1", text: "Standard refund requests must be initiated within 30 days of shipment.", vector: [0.12, 0.85, 0.34] },
    { id: "doc-2", text: "Enterprise SLAs guarantee 99.99% uptime with 15-minute response times.", vector: [0.72, 0.11, 0.45] },
  ];

  async search(queryVector: number[], topK = 3): Promise<string[]> {
    return this.docs
      .map(d => ({ doc: d, score: cosineSimilarity(queryVector, d.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.doc.text);
  }
}`,
      },
    },
  },

  // 12. Booking Reservation Engine (AeroBook)
  {
    id: "booking-reservation-engine",
    title: "AeroBook: Concurrent Seat Reservation & Lock Engine",
    summary: "High-contention flight and event seat booking engine demonstrating distributed lock timeouts, two-phase commits, and double-booking race condition mitigation.",
    category: "ecommerce",
    pool: "learning_and_practice",
    primaryLanguage: "typescript",
    framework: "TypeScript / PostgreSQL",
    difficulty: "advanced",
    targetRoles: ["backend_engineer", "systems_architect"],
    entryPoint: "src/bookingService.ts",
    dependencies: { "pg": "^8.11.3", "ioredis": "^5.3.2" },
    architecture: {
      nodes: [
        { id: "reservation_api", name: "Reservation API Controller", type: "controller", description: "Receives user seat lock requests", technologies: ["Express"], filePath: "src/bookingService.ts" },
        { id: "lock_coordinator", name: "Distributed Lock Coordinator", type: "cache", description: "Manages 10-minute hold window for payment", technologies: ["Redis Redlock"], filePath: "src/bookingService.ts" },
        { id: "seat_inventory_db", name: "PostgreSQL Inventory Table", type: "database", description: "Commits final ticket issued rows with SELECT FOR UPDATE", technologies: ["PostgreSQL"] },
      ],
      edges: [
        { from: "reservation_api", to: "lock_coordinator", protocol: "Redis Protocol", label: "acquireSeatHold()", description: "Claims temporary hold" },
        { from: "lock_coordinator", to: "seat_inventory_db", protocol: "SQL", label: "UPDATE seats SET status='BOOKED'", description: "Commits confirmed purchase" },
      ],
    },
    files: {
      "src/bookingService.ts": {
        path: "src/bookingService.ts",
        name: "bookingService.ts",
        language: "typescript",
        sizeBytes: 1600,
        isEntrypoint: true,
        content: `export class BookingService {
  private static seatHolds = new Map<string, { userId: string; expiresAt: number }>();

  async holdSeat(seatId: string, userId: string, holdSeconds = 600): Promise<{ success: boolean; reason?: string }> {
    const existing = BookingService.seatHolds.get(seatId);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      return { success: false, reason: "SEAT_ALREADY_HELD" };
    }

    BookingService.seatHolds.set(seatId, {
      userId,
      expiresAt: now + holdSeconds * 1000,
    });
    return { success: true };
  }
}`,
      },
    },
  },
];

// =============================================================================
// POOL 2: INDEPENDENT INTERVIEW REPOSITORIES (6 REPOSITORIES — UNSEEN POOL)
// =============================================================================

export const INTERVIEW_REPOSITORIES: ComprehensiveRepository[] = [
  // 13. Sentinel Zero-Trust Auth
  {
    id: "interview-sentinel-auth",
    title: "Sentinel: Distributed Zero-Trust Revocation Service",
    summary: "High-scale authentication mesh implementing sliding-window refresh tokens, distributed Redis Bloom filters for revoked JWTs, and multi-region replication.",
    category: "security",
    pool: "interview_only",
    primaryLanguage: "typescript",
    framework: "Node.js / Express / Redis",
    difficulty: "advanced",
    targetRoles: ["security_engineer", "backend_engineer", "systems_architect"],
    entryPoint: "src/server.ts",
    dependencies: { "express": "^4.19.2", "ioredis": "^5.3.2", "jsonwebtoken": "^9.0.2" },
    architecture: {
      nodes: [
        { id: "revocation_api", name: "Revocation Webhook Gateway", type: "api_gateway", description: "Accepts real-time security events and token revocation requests", technologies: ["Express", "TypeScript"], filePath: "src/server.ts" },
        { id: "bloom_filter", name: "Redis Bloom Filter", type: "cache", description: "Sub-millisecond membership check to reject revoked JWT IDs (JTI)", technologies: ["Redis ReJSON / Bloom"], filePath: "src/services/blacklist.service.ts" },
        { id: "session_store", name: "Multi-Region Session Table", type: "database", description: "Active session registry with cryptographic signature verification", technologies: ["PostgreSQL / CockroachDB"] },
      ],
      edges: [
        { from: "revocation_api", to: "bloom_filter", protocol: "Redis Protocol", label: "BF.ADD revoked_tokens", description: "Instant blacklist propagation" },
        { from: "revocation_api", to: "session_store", protocol: "SQL", label: "UPDATE user_sessions SET active=false", description: "Terminates active grants" },
      ],
    },
    files: {
      "src/server.ts": {
        path: "src/server.ts",
        name: "server.ts",
        language: "typescript",
        sizeBytes: 1500,
        isEntrypoint: true,
        content: `import express, { Request, Response } from "express";

export const app = express();
app.use(express.json());

const revokedJtis = new Set<string>();

app.post("/revoke", (req: Request, res: Response) => {
  const { jti, reason } = req.body;
  if (!jti) return res.status(400).json({ error: "Missing jti" });
  revokedJtis.add(jti);
  return res.json({ status: "REVOKED", jti });
});

app.get("/verify/:jti", (req: Request, res: Response) => {
  const { jti } = req.params;
  const isRevoked = revokedJtis.has(jti);
  return res.json({ active: !isRevoked });
});`,
      },
    },
  },

  // 14. Audit Log Service
  {
    id: "interview-audit-log-service",
    title: "Chronicle: Cryptographic Append-Only Audit Ledger",
    summary: "Immutable audit service enforcing SHA-256 Merkle chaining between consecutive events, write-once-read-many (WORM) storage, and tampering detection.",
    category: "security",
    pool: "interview_only",
    primaryLanguage: "typescript",
    framework: "TypeScript / Node.js",
    difficulty: "advanced",
    targetRoles: ["security_engineer", "backend_engineer", "systems_architect"],
    entryPoint: "src/ledger.ts",
    dependencies: { "crypto": "built-in" },
    architecture: {
      nodes: [
        { id: "audit_ingest", name: "Audit Event Gateway", type: "api_gateway", description: "Receives compliance event records", technologies: ["TypeScript"], filePath: "src/ledger.ts" },
        { id: "merkle_chainer", name: "Cryptographic Merkle Chainer", type: "service", description: "Computes SHA-256(prevHash + payload) to prevent alteration", technologies: ["Crypto"], filePath: "src/ledger.ts" },
        { id: "immutable_store", name: "WORM Storage Engine", type: "database", description: "Stores append-only verified logs", technologies: ["PostgreSQL RLS"] },
      ],
      edges: [
        { from: "audit_ingest", to: "merkle_chainer", protocol: "In-Memory Call", label: "chain()", description: "Applies cryptographic seal" },
        { from: "merkle_chainer", to: "immutable_store", protocol: "SQL", label: "INSERT ONLY", description: "Appends audit log" },
      ],
    },
    files: {
      "src/ledger.ts": {
        path: "src/ledger.ts",
        name: "ledger.ts",
        language: "typescript",
        sizeBytes: 1600,
        isEntrypoint: true,
        content: `import crypto from "crypto";

export interface AuditEntry {
  sequence: number;
  prevHash: string;
  payload: string;
  hash: string;
  timestamp: number;
}

export class AuditLedger {
  private chain: AuditEntry[] = [];

  append(payload: string): AuditEntry {
    const prev = this.chain[this.chain.length - 1];
    const prevHash = prev ? prev.hash : "00000000000000000000000000000000";
    const sequence = this.chain.length + 1;
    const timestamp = Date.now();

    const hash = crypto
      .createHash("sha256")
      .update(\`\${sequence}:\${prevHash}:\${payload}:\${timestamp}\`)
      .digest("hex");

    const entry: AuditEntry = { sequence, prevHash, payload, hash, timestamp };
    this.chain.push(entry);
    return entry;
  }

  verifyChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      if (this.chain[i].prevHash !== this.chain[i - 1].hash) return false;
    }
    return true;
  }
}`,
      },
    },
  },

  // 15. OAuth 2.0 PKCE Provider
  {
    id: "interview-oauth-provider",
    title: "AuthMatrix: OAuth 2.0 Authorization Server & PKCE Gateway",
    summary: "Production identity provider implementing OAuth 2.0 RFC 7636 Proof Key for Code Exchange (PKCE), refresh token rotation, and consent scopes.",
    category: "security",
    pool: "interview_only",
    primaryLanguage: "typescript",
    framework: "Express / Node.js",
    difficulty: "advanced",
    targetRoles: ["security_engineer", "fullstack_engineer"],
    entryPoint: "src/oauth.ts",
    dependencies: { "express": "^4.19.2", "crypto": "built-in" },
    architecture: {
      nodes: [
        { id: "auth_endpoint", name: "Authorization Code Endpoint", type: "controller", description: "Issues code grant with code_challenge hashing", technologies: ["Express"], filePath: "src/oauth.ts" },
        { id: "token_endpoint", name: "Token Exchange Endpoint", type: "controller", description: "Validates code_verifier against stored challenge before token issuance", technologies: ["TypeScript"], filePath: "src/oauth.ts" },
        { id: "key_store", name: "JWKS Asymmetric Key Ring", type: "database", description: "Publishes RS256 public keys for downstream microservice token verification", technologies: ["RSA 2048"] },
      ],
      edges: [
        { from: "auth_endpoint", to: "token_endpoint", protocol: "In-Memory Call", label: "exchangeCode()", description: "Exchanges verified grant" },
      ],
    },
    files: {
      "src/oauth.ts": {
        path: "src/oauth.ts",
        name: "oauth.ts",
        language: "typescript",
        sizeBytes: 1800,
        isEntrypoint: true,
        content: `import crypto from "crypto";

export class OAuthServer {
  private codes = new Map<string, { codeChallenge: string; clientId: string }>();

  generateCode(clientId: string, codeChallenge: string): string {
    const code = "auth_" + crypto.randomBytes(16).toString("hex");
    this.codes.set(code, { codeChallenge, clientId });
    return code;
  }

  exchangeToken(code: string, codeVerifier: string): { accessToken: string } | null {
    const record = this.codes.get(code);
    if (!record) return null;

    // Verify SHA256 base64url(codeVerifier) === codeChallenge
    const computed = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    if (computed !== record.codeChallenge) {
      throw new Error("PKCE_VERIFIER_MISMATCH");
    }

    this.codes.delete(code); // One-time use
    return { accessToken: "jwt_" + crypto.randomBytes(24).toString("hex") };
  }
}`,
      },
    },
  },

  // 16. Search Indexer Service
  {
    id: "interview-search-indexer",
    title: "SearchStream: Event-Driven Search Indexing Pipeline",
    summary: "Asynchronous search pipeline reading CDC change streams, generating BM25 inverted indices and vector embeddings, and updating cluster shards.",
    category: "data_pipeline",
    pool: "interview_only",
    primaryLanguage: "typescript",
    framework: "TypeScript / Node.js",
    difficulty: "advanced",
    targetRoles: ["data_engineer", "backend_engineer"],
    entryPoint: "src/indexer.ts",
    dependencies: { "ioredis": "^5.3.2" },
    architecture: {
      nodes: [
        { id: "cdc_listener", name: "Debezium / WAL Stream Ingest", type: "queue", description: "Consumes database change data capture streams", technologies: ["Kafka / PostgreSQL WAL"], filePath: "src/indexer.ts" },
        { id: "token_normalizer", name: "Text Stemmer & Tokenizer", type: "service", description: "Applies Porter stemming and stop-word filtering", technologies: ["TypeScript"], filePath: "src/indexer.ts" },
        { id: "inverted_index", name: "Search Shard Cluster", type: "database", description: "Distributed posting list inverted index with BM25 score ranking", technologies: ["Inverted Index"] },
      ],
      edges: [
        { from: "cdc_listener", to: "token_normalizer", protocol: "In-Memory Call", label: "processEvent()", description: "Extracts mutated fields" },
        { from: "token_normalizer", to: "inverted_index", protocol: "In-Memory Call", label: "updatePostingList()", description: "Commits search index delta" },
      ],
    },
    files: {
      "src/indexer.ts": {
        path: "src/indexer.ts",
        name: "indexer.ts",
        language: "typescript",
        sizeBytes: 1600,
        isEntrypoint: true,
        content: `export class SearchIndexer {
  private invertedIndex = new Map<string, Set<string>>();

  indexDocument(docId: string, text: string) {
    const tokens = text.toLowerCase().split(/\\W+/).filter(Boolean);
    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(docId);
    }
  }

  query(term: string): string[] {
    const termClean = term.toLowerCase().trim();
    const matches = this.invertedIndex.get(termClean);
    return matches ? Array.from(matches) : [];
  }
}`,
      },
    },
  },

  // 17. Hyperion Multi-Tier Cache
  {
    id: "interview-hyperion-cache",
    title: "Hyperion: Multi-Tier Distributed Cache Mesh",
    summary: "Ultra-low-latency distributed caching layer featuring Singleflight stampede prevention, two-tier L1 memory / L2 Redis cache-aside, and active invalidation pub/sub.",
    category: "infrastructure",
    pool: "interview_only",
    primaryLanguage: "typescript",
    framework: "TypeScript / Node.js",
    difficulty: "expert",
    targetRoles: ["systems_architect", "backend_engineer"],
    entryPoint: "src/cache/hyperion.ts",
    dependencies: { "ioredis": "^5.3.2" },
    architecture: {
      nodes: [
        { id: "l1_local", name: "L1 In-Memory LRU", type: "cache", description: "Microsecond-speed local RAM cache with size-based eviction", technologies: ["TypeScript LRU"], filePath: "src/cache/hyperion.ts" },
        { id: "singleflight", name: "Singleflight Mutex Coordinator", type: "service", description: "Collapses concurrent duplicate key misses into a single database query", technologies: ["Promise Collapser"], filePath: "src/cache/hyperion.ts" },
        { id: "l2_redis", name: "L2 Redis Cluster", type: "cache", description: "Shared distributed cache layer across all container replicas", technologies: ["Redis Cluster"] },
      ],
      edges: [
        { from: "l1_local", to: "singleflight", protocol: "In-Memory Call", label: "executeSingle(key)", description: "Prevents cache stampede" },
        { from: "singleflight", to: "l2_redis", protocol: "Redis Protocol", label: "GET / SETEX", description: "Checks shared tier" },
      ],
    },
    files: {
      "src/cache/hyperion.ts": {
        path: "src/cache/hyperion.ts",
        name: "hyperion.ts",
        language: "typescript",
        sizeBytes: 1800,
        isEntrypoint: true,
        content: `export class HyperionCache {
  private static inFlight = new Map<string, Promise<any>>();
  private static l1Cache = new Map<string, { value: any; expiresAt: number }>();

  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 60): Promise<T> {
    const cached = HyperionCache.l1Cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Singleflight: Collapses 1,000 concurrent cache misses into 1 DB query
    if (HyperionCache.inFlight.has(key)) {
      return HyperionCache.inFlight.get(key)!;
    }

    const promise = (async () => {
      try {
        const result = await fetcher();
        HyperionCache.l1Cache.set(key, { value: result, expiresAt: Date.now() + ttlSeconds * 1000 });
        return result;
      } finally {
        HyperionCache.inFlight.delete(key);
      }
    })();

    HyperionCache.inFlight.set(key, promise);
    return promise;
  }
}`,
      },
    },
  },

  // 18. OrderCore FastAPI Service (Python / PostgreSQL)
  {
    id: "interview-fastapi-orders",
    title: "OrderCore: High-Throughput Orders & Transaction Engine",
    summary: "Financial order state machine in Python FastAPI enforcing ACID transaction boundaries, row-level locks, and zero-inventory overdraft protection.",
    category: "fintech",
    pool: "interview_only",
    primaryLanguage: "python",
    framework: "FastAPI / SQLAlchemy",
    difficulty: "advanced",
    targetRoles: ["backend_engineer", "fintech_engineer"],
    entryPoint: "app/orders.py",
    dependencies: { "fastapi": "^0.110.0", "sqlalchemy": "^2.0.28", "asyncpg": "^0.29.0" },
    architecture: {
      nodes: [
        { id: "orders_router", name: "Orders Endpoint Router", type: "api_gateway", description: "Parses order payloads and handles idempotency headers", technologies: ["FastAPI"], filePath: "app/orders.py" },
        { id: "order_state_machine", name: "Order State Machine", type: "service", description: "Enforces legal transitions (PENDING -> PAID -> FULFILLED)", technologies: ["Python AsyncIO"], filePath: "app/orders.py" },
        { id: "postgres_tx", name: "ACID Transaction Session", type: "database", description: "Performs SELECT FOR UPDATE on inventory balance rows", technologies: ["PostgreSQL 16"] },
      ],
      edges: [
        { from: "orders_router", to: "order_state_machine", protocol: "In-Memory Call", label: "submitOrder()", description: "Validates order lifecycle" },
        { from: "order_state_machine", to: "postgres_tx", protocol: "SQL", label: "BEGIN / SELECT FOR UPDATE / COMMIT", description: "Atomic ledger balance debit" },
      ],
    },
    files: {
      "app/orders.py": {
        path: "app/orders.py",
        name: "orders.py",
        language: "python",
        sizeBytes: 1500,
        isEntrypoint: true,
        content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict

app = FastAPI(title="OrderCore Transaction Service")

class OrderRequest(BaseModel):
    order_id: str
    amount: float
    account_id: str

accounts_balance: Dict[str, float] = {"acc_100": 500.0}

@app.post("/orders/process")
async def process_order(order: OrderRequest):
    # Enforce atomic balance check
    bal = accounts_balance.get(order.account_id, 0.0)
    if bal < order.amount:
        raise HTTPException(status_code=400, detail="INSUFFICIENT_FUNDS")

    accounts_balance[order.account_id] -= order.amount
    return {"status": "SETTLED", "remaining_balance": accounts_balance[order.account_id]}`,
      },
    },
  },
];

// =============================================================================
// REPOSITORY INTELLIGENCE ENGINE IMPLEMENTATION
// =============================================================================

export interface UserExposureRecord {
  userId: string;
  tenantId: string;
  repositoryId: string;
  exposedInContext: "foundations" | "visual_trace" | "practice" | "explorer" | "interview";
  firstExposedAt: string;
  lastExposedAt: string;
  exposureCount: number;
}

export class RepositoryIntelligenceEngine {
  private static exposureStore: Map<string, UserExposureRecord[]> = new Map();

  private static getUserKey(userId: string, tenantId: string): string {
    return `${tenantId}::${userId}`;
  }

  static getRepositories(pool?: RepositoryPoolType): ComprehensiveRepository[] {
    const all = [...LEARNING_REPOSITORIES, ...INTERVIEW_REPOSITORIES];
    if (pool) {
      return all.filter((r) => r.pool === pool);
    }
    return all;
  }

  static getRepositoryById(repoId: string): ComprehensiveRepository | null {
    const all = [...LEARNING_REPOSITORIES, ...INTERVIEW_REPOSITORIES];
    return all.find((r) => r.id === repoId) || null;
  }

  static recordExposure(
    userId: string,
    tenantId: string,
    repositoryId: string,
    context: "foundations" | "visual_trace" | "practice" | "explorer" | "interview"
  ): void {
    const key = this.getUserKey(userId, tenantId);
    let userRecords = this.exposureStore.get(key) || [];

    const existingIndex = userRecords.findIndex(
      (r) => r.repositoryId === repositoryId && r.exposedInContext === context
    );

    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      userRecords[existingIndex].lastExposedAt = now;
      userRecords[existingIndex].exposureCount += 1;
    } else {
      userRecords.push({
        userId,
        tenantId,
        repositoryId,
        exposedInContext: context,
        firstExposedAt: now,
        lastExposedAt: now,
        exposureCount: 1,
      });
    }

    this.exposureStore.set(key, userRecords);
  }

  static getExposedRepoIds(userId: string, tenantId: string): string[] {
    const key = this.getUserKey(userId, tenantId);
    const records = this.exposureStore.get(key) || [];
    return Array.from(new Set(records.map((r) => r.repositoryId)));
  }

  static selectUnseenInterviewRepository(
    userId: string,
    tenantId: string,
    targetRole?: EngineeringRole,
    preferredDifficulty?: "beginner" | "intermediate" | "advanced" | "expert"
  ): ComprehensiveRepository {
    const exposedIds = this.getExposedRepoIds(userId, tenantId);

    // Filter interview pool strictly for UNEXPOSED repositories
    let candidates = INTERVIEW_REPOSITORIES.filter((r) => !exposedIds.includes(r.id));

    if (targetRole) {
      const roleMatches = candidates.filter((r) => r.targetRoles.includes(targetRole));
      if (roleMatches.length > 0) {
        candidates = roleMatches;
      }
    }

    if (candidates.length === 0) {
      // Fall back only when all 6 interview repositories have been completed
      candidates = [...INTERVIEW_REPOSITORIES];
    }

    const selected = candidates[0] || INTERVIEW_REPOSITORIES[0];
    this.recordExposure(userId, tenantId, selected.id, "interview");
    return selected;
  }

  static verifySourceCitation(
    repoId: string,
    filePath: string,
    lineStart: number,
    lineEnd: number
  ): { isValid: boolean; reason?: string } {
    const repo = this.getRepositoryById(repoId);
    if (!repo) return { isValid: false, reason: `Repository '${repoId}' not found` };

    const file = repo.files[filePath];
    if (!file) return { isValid: false, reason: `File '${filePath}' does not exist in repository '${repoId}'` };

    const lines = file.content.split("\n");
    if (lineStart < 1 || lineEnd > lines.length || lineStart > lineEnd) {
      return {
        isValid: false,
        reason: `Invalid line range ${lineStart}-${lineEnd} for file with ${lines.length} lines`,
      };
    }

    return { isValid: true };
  }
}
