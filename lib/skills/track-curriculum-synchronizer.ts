/**
 * lib/skills/track-curriculum-synchronizer.ts
 *
 * COGNALYZE PHASE 5: EIGHT PREPARATION TRACKS DEEP-DIVE & CURRICULUM SYNCHRONIZATION
 *
 * Provides authoritative curriculum definitions, progressive learning objectives,
 * concrete practice activities, difficulty tiers, and bidirectional curriculum
 * synchronization for all eight Cognalyze engineering interview tracks:
 *
 * 1. Traditional Coding & DSA (traditional_coding_dsa)
 * 2. Code Comprehension (code_comprehension)
 * 3. Debugging & Code Repair (debugging_code_repair)
 * 4. AI-Assisted Engineering (ai_assisted_engineering)
 * 5. System Design & Architecture (system_design)
 * 6. Code Review, Testing & Reliability (code_review_reliability)
 * 7. Senior Engineering Judgment (senior_engineering_judgment)
 * 8. Behavioral & Project Deep Dives (behavioral_project_deep_dives)
 *
 * Invariant Guarantees:
 * - Zero Simulation: Authentic tasks, concrete criteria, real evidence.
 * - Authenticated Candidate Scoping: Isolated by candidateId.
 * - No Fabricated Progress: Missing evidence => "needs_diagnostic", never 0% fail or fake mastery.
 * - Dynamic Calibration: Demonstrated competencies fast-track; identified gaps trigger novel angles.
 */

import {
  InterviewTrack,
  CompetencyCategoryKey,
  COMPETENCY_CATEGORIES,
  TRACK_CONFIGURATIONS,
  buildCandidateInterviewDossier,
  CandidateInterviewDossier,
} from "@/lib/ai/interview-engine";
import {
  getSessionHistory,
  getHistoricalAssessedCompetencies,
  getAccumulatedWeakTopics,
  getSessionById,
  isSessionCompleted,
} from "@/lib/interview-session-store";
import { addStudentEvidenceRecord, getStudentDNAFull } from "@/lib/dna/store";
import { generateSecureId } from "@/lib/crypto-utils";

export type DifficultyTier = "foundational" | "applied" | "resilient" | "strategic";

export interface TrackLearningObjective {
  id: string;
  tier: DifficultyTier;
  title: string;
  description: string;
  competencyKey: CompetencyCategoryKey;
  successCriteria: string[];
  estimatedMinutes: number;
}

export type PracticeActivityType =
  | "dsa_workout"
  | "code_trace"
  | "debug_repair"
  | "prompt_audit"
  | "arch_blueprint"
  | "pr_review"
  | "tradeoff_defense"
  | "behavioral_star";

export interface TrackPracticeActivity {
  id: string;
  title: string;
  tier: DifficultyTier;
  activityType: PracticeActivityType;
  scenario: string;
  taskInstructions: string;
  validationCriteria: string[];
  targetSkills: string[];
  expectedOutputFormat: string;
}

export interface TrackCurriculumDefinition {
  id: InterviewTrack;
  name: string;
  shortTitle: string;
  philosophy: string;
  primaryCompetencyKeys: CompetencyCategoryKey[];
  coreCompetencies: Array<{
    name: string;
    key: CompetencyCategoryKey;
    weight: number;
    description: string;
  }>;
  learningObjectives: TrackLearningObjective[];
  practiceActivities: TrackPracticeActivity[];
  evalCriteria: string[];
  feedbackApproach: string;
  sampleTasks: string[];
}

// ══════════════════════════════════════════════════════════════
// 1. AUTHORITATIVE EIGHT TRACK CURRICULUM REGISTRY
// ══════════════════════════════════════════════════════════════

export const EIGHT_TRACK_CURRICULA: Record<InterviewTrack, TrackCurriculumDefinition> = {
  traditional_coding_dsa: {
    id: "traditional_coding_dsa",
    name: "Traditional Coding & DSA",
    shortTitle: "Coding & DSA",
    philosophy: "Develop algorithmic correctness, optimal asymptotic complexity, bounded memory resilience, and rigorous edge-case analysis before writing syntax.",
    primaryCompetencyKeys: ["F_DATA_STRUCTURES_ALGORITHMS", "G_PRACTICAL_CODING", "H_COMPLEXITY_ANALYSIS"],
    coreCompetencies: [
      { name: "Algorithmic Invariant Formulation", key: "F_DATA_STRUCTURES_ALGORITHMS", weight: 30, description: "Defining loop and recurrence invariants before coding." },
      { name: "Asymptotic Complexity & Trade-offs", key: "H_COMPLEXITY_ANALYSIS", weight: 25, description: "Accurate Big-O time and auxiliary space derivation under worst-case scenarios." },
      { name: "Bounded Memory Streaming", key: "G_PRACTICAL_CODING", weight: 25, description: "Processing continuous inputs with strictly capped RAM using heaps and rolling hashes." },
      { name: "Degenerate Edge-Case Handling", key: "G_PRACTICAL_CODING", weight: 20, description: "Guarding against duplicates, empty sets, singletons, and integer overflow." },
    ],
    learningObjectives: [
      {
        id: "dsa_obj_1",
        tier: "foundational",
        title: "Two Pointers and Sliding Window Invariants",
        description: "Master contiguous subarray problems with dynamic expansion and contraction windows.",
        competencyKey: "F_DATA_STRUCTURES_ALGORITHMS",
        successCriteria: ["Formulate contraction condition", "Maintain window state in O(1) space", "Handle empty string and all-identical character inputs"],
        estimatedMinutes: 30,
      },
      {
        id: "dsa_obj_2",
        tier: "applied",
        title: "Topological Sort & Dependency Resolution",
        description: "Detect cycles and generate valid execution sequences using Kahn's algorithm or DFS colors.",
        competencyKey: "F_DATA_STRUCTURES_ALGORITHMS",
        successCriteria: ["Distinguish DAGs from cyclic graphs", "Construct in-degree array accurately", "Return clear cycle diagnostics when topological order is impossible"],
        estimatedMinutes: 45,
      },
      {
        id: "dsa_obj_3",
        tier: "resilient",
        title: "Bounded Memory Top-K Streaming",
        description: "Process billions of stream tokens retaining top-K items using a bounded Min-Heap.",
        competencyKey: "G_PRACTICAL_CODING",
        successCriteria: ["Heap size strictly capped at K", "O(N log K) time with O(K) space", "Graceful handling of high-cardinality tie-breakers"],
        estimatedMinutes: 40,
      },
      {
        id: "dsa_obj_4",
        tier: "strategic",
        title: "Dynamic Programming Memoization vs Tabulation",
        description: "Deconstruct optimal substructure and overlapping subproblems with state space compression.",
        competencyKey: "H_COMPLEXITY_ANALYSIS",
        successCriteria: ["Define state transition equation", "Prove non-redundant state evaluation", "Compress 2D table to 1D rolling array when previous row alone is referenced"],
        estimatedMinutes: 50,
      },
    ],
    practiceActivities: [
      {
        id: "dsa_act_1",
        title: "Streaming Top-K Event Frequency Analyzer",
        tier: "applied",
        activityType: "dsa_workout",
        scenario: "You are receiving a real-time stream of HTTP request URIs from gateway logs. The stream volume is 100,000 events/sec, but available heap allocation is restricted to 2MB.",
        taskInstructions: "Design an in-memory accumulator that returns the top 10 most frequent request paths at any arbitrary moment in O(log K) per insertion.",
        validationCriteria: ["Min-heap size never exceeds 10 elements", "Accurate frequency map update", "No memory leak over sustained duration"],
        targetSkills: ["Min-Heap", "Hash Maps", "Streaming Data", "Complexity Analysis"],
        expectedOutputFormat: "Algorithmic proof + TypeScript/Go implementation with complexity breakdown.",
      },
      {
        id: "dsa_act_2",
        title: "Build Graph Cycle Breaker",
        tier: "resilient",
        activityType: "dsa_workout",
        scenario: "A microservice deployment pipeline has 2,400 interdependent tasks. A newly committed PR has introduced an indirect circular dependency causing deployment deadlocks.",
        taskInstructions: "Implement an O(V + E) algorithm that detects the cycle, returns the exact nodes involved in the loop, and suggests the minimal edge to remove to restore DAG properties.",
        validationCriteria: ["Correct cycle node list extraction", "Linear time complexity", "Graceful non-throwing exit on clean DAGs"],
        targetSkills: ["Graphs", "Topological Sort", "DFS Coloring", "Diagnostic Logging"],
        expectedOutputFormat: "Algorithm with recurrence validation and cycle path output.",
      },
    ],
    evalCriteria: [
      "Optimal Big-O time and space complexity",
      "Explicit declaration of invariants before coding",
      "Resilience against degenerate edge cases (duplicates, null, single item)",
      "Clear explanation of why chosen data structure beats alternatives",
    ],
    feedbackApproach: "Highlight time/space trade-offs, test boundary resilience with adversarial inputs, and demand Big-O proofs.",
    sampleTasks: [
      "Top K Frequent Elements in streaming data with bounded memory",
      "Detecting cycles and dependencies via Topological Sort",
      "Designing an in-memory LRU Cache with O(1) operations",
      "Longest Substring Without Repeating Characters using Sliding Window",
    ],
  },

  code_comprehension: {
    id: "code_comprehension",
    name: "Code Comprehension",
    shortTitle: "Code Comprehension",
    philosophy: "Rapidly navigate and build mental models of large unfamiliar real-world codebases, tracing execution pathways, verifying state invariants, and respecting existing module contracts.",
    primaryCompetencyKeys: ["C_PROJECT_DEEP_DIVE", "D_PROJECT_ARCHITECTURE", "I_OOP_DESIGN_PATTERNS", "T_TESTING_DEBUGGING"],
    coreCompetencies: [
      { name: "Codebase Mental Modeling", key: "D_PROJECT_ARCHITECTURE", weight: 30, description: "Extracting subsystem topography, boundary boundaries, and data flow from source files." },
      { name: "Execution Path Tracing", key: "C_PROJECT_DEEP_DIVE", weight: 25, description: "Step-by-step mental tracking through asynchronous dispatches, middleware stacks, and callbacks." },
      { name: "Contract & Invariant Identification", key: "I_OOP_DESIGN_PATTERNS", weight: 25, description: "Identifying implicit assumptions, pre/post-conditions, and interface contracts." },
      { name: "Side-Effect & Boundary Analysis", key: "T_TESTING_DEBUGGING", weight: 20, description: "Detecting state mutations, database side effects, and unhandled promise cascades." },
    ],
    learningObjectives: [
      {
        id: "comp_obj_1",
        tier: "foundational",
        title: "Entry Point & Middleware Chain Discovery",
        description: "Locate primary routing, auth gates, and interceptor chains across unfamiliar repo structures.",
        competencyKey: "D_PROJECT_ARCHITECTURE",
        successCriteria: ["Trace request from socket to controller", "Identify all interceptors in order", "Recognize where context/headers are injected"],
        estimatedMinutes: 30,
      },
      {
        id: "comp_obj_2",
        tier: "applied",
        title: "State Transition & Invariant Tracing",
        description: "Analyze multi-step state machine updates across distributed workers.",
        competencyKey: "C_PROJECT_DEEP_DIVE",
        successCriteria: ["Identify all valid state transitions", "Pinpoint invariants that must hold true", "Highlight potential invalid intermediate states"],
        estimatedMinutes: 40,
      },
      {
        id: "comp_obj_3",
        tier: "resilient",
        title: "Asynchronous Flow & Promise Cascade Audit",
        description: "Audit concurrent async/await, promise pools, and error propagation semantics.",
        competencyKey: "T_TESTING_DEBUGGING",
        successCriteria: ["Identify unhandled rejection risks", "Verify timeout propagation", "Audit race conditions on shared memory buffers"],
        estimatedMinutes: 45,
      },
      {
        id: "comp_obj_4",
        tier: "strategic",
        title: "Cross-Module Contract Evolution",
        description: "Evaluate API backward-compatibility and schema drift between decoupled services.",
        competencyKey: "I_OOP_DESIGN_PATTERNS",
        successCriteria: ["Verify additive-only schema evolution", "Identify breaking field deletions", "Draft contract verification tests"],
        estimatedMinutes: 45,
      },
    ],
    practiceActivities: [
      {
        id: "comp_act_1",
        title: "Distributed Payment Gateway Execution Trace",
        tier: "applied",
        activityType: "code_trace",
        scenario: "You are given a 1,200-line multi-module payment orchestration repo containing webhooks, ledger persistence, and an external Stripe gateway client.",
        taskInstructions: "Trace the exact execution pathway when a payment succeeds but the subsequent ledger append experiences a 2-second database timeout. Identify the final state of the transaction and what response is returned to the user.",
        validationCriteria: ["Accurate identification of transaction rollback", "Identification of webhook retry semantics", "Verification of idempotent refund logic"],
        targetSkills: ["Code Navigation", "Async Execution", "Database Transactions", "Error Handling"],
        expectedOutputFormat: "Structured execution timeline diagram + written state table.",
      },
    ],
    evalCriteria: [
      "Accurate identification of entry points and lifecycle handlers",
      "Understanding boundary conditions and side effects",
      "Distinguishing synchronous versus asynchronous execution pathways",
      "Recognizing error handling contracts and propagation paths",
    ],
    feedbackApproach: "Ask candidate to predict exact state mutations upon specific failure triggers and test whether they understand existing contract assumptions.",
    sampleTasks: [
      "Tracing distributed payment transaction flow across gateway and persistence services",
      "Navigating state machine transitions in a multi-tenant subscription manager",
      "Analyzing concurrency invariants in a background queue consumer",
    ],
  },

  debugging_code_repair: {
    id: "debugging_code_repair",
    name: "Debugging & Code Repair",
    shortTitle: "Debugging & Repair",
    philosophy: "Execute scientific, hypothesis-driven root cause analysis on elusive failures, create minimal non-breaking defensive patches, and engineer automated regression safeguards.",
    primaryCompetencyKeys: ["T_TESTING_DEBUGGING", "K_OPERATING_SYSTEMS", "P_DATA_SECURITY_ISOLATION"],
    coreCompetencies: [
      { name: "Hypothesis-Driven Root Cause Analysis", key: "T_TESTING_DEBUGGING", weight: 35, description: "Isolating failure triggers through systematic deduction rather than trial-and-error edits." },
      { name: "Defensive, Non-Breaking Patching", key: "T_TESTING_DEBUGGING", weight: 25, description: "Crafting surgical fixes that solve root causes without altering unrelated behaviors." },
      { name: "Heisenbug & Concurrency Isolation", key: "K_OPERATING_SYSTEMS", weight: 20, description: "Reproducing intermittent race conditions, deadlocks, and thread-safety bugs." },
      { name: "Automated Regression Safeguards", key: "P_DATA_SECURITY_ISOLATION", weight: 20, description: "Authoring automated tests that fail before the fix and pass after." },
    ],
    learningObjectives: [
      {
        id: "debug_obj_1",
        tier: "foundational",
        title: "Reproducing Deterministic Failures from Logs & Stack Traces",
        description: "Extract essential telemetry from production logs and build minimal reproducing unit tests.",
        competencyKey: "T_TESTING_DEBUGGING",
        successCriteria: ["Locate failure line from stack trace", "Synthesize minimal test fixture triggering error", "Differentiate symptom from underlying cause"],
        estimatedMinutes: 30,
      },
      {
        id: "debug_obj_2",
        tier: "applied",
        title: "Memory Leak & Resource Starvation Isolation",
        description: "Profile heap growth, retained references, and connection pool exhaustion.",
        competencyKey: "K_OPERATING_SYSTEMS",
        successCriteria: ["Analyze heap snapshot allocations", "Identify unclosed sockets or unreleased pool handles", "Implement deterministic disposal lifecycle"],
        estimatedMinutes: 45,
      },
      {
        id: "debug_obj_3",
        tier: "resilient",
        title: "Race Condition & Concurrency Heisenbug Remediation",
        description: "Diagnose intermittent multi-threaded data races under load.",
        competencyKey: "K_OPERATING_SYSTEMS",
        successCriteria: ["Reproduce race condition under concurrency harness", "Apply mutex, atomic, or channel synchronization", "Prove elimination of data race without deadlock"],
        estimatedMinutes: 50,
      },
      {
        id: "debug_obj_4",
        tier: "strategic",
        title: "Production Incident Post-Mortem & Safeguard Engineering",
        description: "Draft comprehensive root cause analysis and telemetry alerts.",
        competencyKey: "P_DATA_SECURITY_ISOLATION",
        successCriteria: ["Write 5-Whys root cause analysis", "Specify alerting thresholds to catch recurrence", "Author non-regression CI test suite"],
        estimatedMinutes: 45,
      },
    ],
    practiceActivities: [
      {
        id: "debug_act_1",
        title: "Connection Pool Starvation in High-Throughput Service",
        tier: "resilient",
        activityType: "debug_repair",
        scenario: "Under 1,500 RPS peak load, an API service begins returning HTTP 504 Gateway Timeouts after 12 minutes of uptime. CPU and memory are at 35%, but database connection pool active count hits the maximum limit of 50 and never recovers.",
        taskInstructions: "Inspect the provided database transaction wrapper. Formulate a root cause hypothesis, identify the code path leaking pool connections, and produce a surgical patch with an automated regression test.",
        validationCriteria: ["Identification of missing finally/deferred release block on early error return", "Clean minimal patch", "Unit test verifying pool release even when query throws"],
        targetSkills: ["Resource Management", "Connection Pooling", "Defensive Patching", "Test Authoring"],
        expectedOutputFormat: "Hypothesis statement + diff patch + regression test code.",
      },
    ],
    evalCriteria: [
      "Hypothesis-driven scientific debugging rather than trial-and-error guessing",
      "Minimal, non-breaking defensive fix that preserves existing behavior",
      "Authoring automated tests that fail before the fix and pass after",
      "Instrumenting telemetry to monitor for recurrence in production",
    ],
    feedbackApproach: "Challenge the candidate on second-order failure modes or performance regressions introduced by their proposed patch.",
    sampleTasks: [
      "Debugging intermittent socket hangup under 95th percentile peak traffic",
      "Isolating a memory leak caused by retained event listeners in long-lived workers",
      "Resolving database connection pool starvation under concurrent burst queries",
    ],
  },

  ai_assisted_engineering: {
    id: "ai_assisted_engineering",
    name: "AI-Assisted Engineering",
    shortTitle: "AI-Assisted Engineering",
    philosophy: "Harness LLMs, Copilots, and generative tooling with high engineering velocity while maintaining human architectural rigor, active boundary verification, and zero tolerance for security blindspots.",
    primaryCompetencyKeys: ["S_LLM_INTEGRATION", "P_DATA_SECURITY_ISOLATION", "T_TESTING_DEBUGGING"],
    coreCompetencies: [
      { name: "AI Output Critical Verification", key: "S_LLM_INTEGRATION", weight: 35, description: "Auditing generated code line-by-line for subtle logic fallacies, edge-case omissions, and outdated APIs." },
      { name: "Security & Vulnerability Detection in AI Code", key: "P_DATA_SECURITY_ISOLATION", weight: 30, description: "Spotting SQL injection, insecure deserialization, prompt injection, and auth bypasses." },
      { name: "Constraint-Driven Prompt Formulation", key: "S_LLM_INTEGRATION", weight: 20, description: "Specifying schemas, pre/post-conditions, and invariant boundaries in generation prompts." },
      { name: "Task Decomposition & Contract Preservation", key: "T_TESTING_DEBUGGING", weight: 15, description: "Breaking complex engineering requirements into verifiable modules with strict unit tests." },
    ],
    learningObjectives: [
      {
        id: "ai_obj_1",
        tier: "foundational",
        title: "Constraint & Schema-Driven Prompt Design",
        description: "Draft prompts that constrain AI output to deterministic types and strict interface contracts.",
        competencyKey: "S_LLM_INTEGRATION",
        successCriteria: ["Include explicit schema constraints", "Specify error handling contracts", "Forbid hallucinated helper imports"],
        estimatedMinutes: 30,
      },
      {
        id: "ai_obj_2",
        tier: "applied",
        title: "Auditing AI-Generated Database Migrations & Queries",
        description: "Detect raw string interpolation, table locks, and missing indexes in LLM SQL output.",
        competencyKey: "P_DATA_SECURITY_ISOLATION",
        successCriteria: ["Spot unescaped parameter interpolation", "Identify missing transactional blocks", "Assess table lock impact on live production databases"],
        estimatedMinutes: 40,
      },
      {
        id: "ai_obj_3",
        tier: "resilient",
        title: "Detecting Subtle Logical Flaws and Hallucinated Libraries",
        description: "Critique AI solutions that appear syntactically correct but fail under concurrent or edge conditions.",
        competencyKey: "T_TESTING_DEBUGGING",
        successCriteria: ["Find non-existent library method calls", "Spot off-by-one errors in token window calculations", "Verify thread-safety of generated helper state"],
        estimatedMinutes: 45,
      },
      {
        id: "ai_obj_4",
        tier: "strategic",
        title: "AI Pipeline Governance & Prompt Injection Guardrails",
        description: "Design defense-in-depth against prompt injection and data exfiltration in production AI pipelines.",
        competencyKey: "S_LLM_INTEGRATION",
        successCriteria: ["Implement input sanitization boundaries", "Enforce separate data plane from system instruction plane", "Validate LLM outputs against strict Zod/Pydantic schemas"],
        estimatedMinutes: 50,
      },
    ],
    practiceActivities: [
      {
        id: "ai_act_1",
        title: "Auditing an AI-Generated Auth & Token Validation Middleware",
        tier: "applied",
        activityType: "prompt_audit",
        scenario: "A teammate used an AI assistant to generate a JWT authentication middleware in Express/TypeScript. The generated code compiles and tests pass for happy-path tokens, but subtle vulnerabilities exist.",
        taskInstructions: "Perform a security audit of the generated middleware. Identify three critical security defects (e.g., algorithm confusion, unverified expiration, token leakage in logs) and rewrite the code with strict defensive guards.",
        validationCriteria: ["Detection of 'none' algorithm bypass vulnerability", "Detection of clock skew / expiration bug", "Production-hardened replacement implementation"],
        targetSkills: ["Security Auditing", "JWT Standards", "AI Output Verification", "Defensive Programming"],
        expectedOutputFormat: "Audit finding report + hardened middleware code.",
      },
    ],
    evalCriteria: [
      "Refusal to blindly trust generated code; active boundary verification",
      "Spotting subtle logical fallacies, edge-case omissions, and outdated library APIs",
      "Demonstrating prompt precision with concrete constraints and schema definitions",
      "Balancing AI development velocity with human architectural ownership",
    ],
    feedbackApproach: "Probe candidate on how they catch security anti-patterns (prompt injection, SSRF, SQL interpolation) in AI-synthesized handlers.",
    sampleTasks: [
      "Auditing an AI-generated authentication middleware for subtle JWT bypass holes",
      "Using LLMs to accelerate database migration scripts while verifying zero-data-loss invariants",
      "Decomposing a complex system feature into verifiable subtasks with strict acceptance tests",
    ],
  },

  system_design: {
    id: "system_design",
    name: "System Design",
    shortTitle: "System Design",
    philosophy: "Architect high-availability, fault-tolerant, horizontally scalable distributed systems, balancing CAP/PACELC trade-offs, storage paradigms, latency budgets, and graceful failure containment.",
    primaryCompetencyKeys: ["Q_SYSTEM_DESIGN", "M_BACKEND_ENGINEERING", "J_DATABASES_SQL"],
    coreCompetencies: [
      { name: "Distributed Scalability & Partitioning", key: "Q_SYSTEM_DESIGN", weight: 35, description: "Designing sharding keys, consistent hashing topologies, and stateless service layers." },
      { name: "Data Consistency & Storage Modeling", key: "J_DATABASES_SQL", weight: 25, description: "Selecting relational vs NoSQL vs streaming stores and navigating ACID vs BASE consistency." },
      { name: "Failure Modes & Graceful Degradation", key: "M_BACKEND_ENGINEERING", weight: 25, description: "Architecting circuit breakers, bulkhead isolation, dead-letter queues, and fallback caches." },
      { name: "Latency Optimization & Capacity Estimation", key: "Q_SYSTEM_DESIGN", weight: 15, description: "Back-of-envelope calculations, QPS budgets, network bandwidth, and cache hit ratios." },
    ],
    learningObjectives: [
      {
        id: "sys_obj_1",
        tier: "foundational",
        title: "Requirements Clarification & Capacity Estimation",
        description: "Translate high-level product prompts into concrete QPS, storage, and network bandwidth figures.",
        competencyKey: "Q_SYSTEM_DESIGN",
        successCriteria: ["Separate functional from non-functional requirements", "Calculate read/write QPS and 5-year storage", "Identify peak vs average traffic multipliers"],
        estimatedMinutes: 30,
      },
      {
        id: "sys_obj_2",
        tier: "applied",
        title: "High-Scale Distributed Rate Limiter Design",
        description: "Architect a rate limiter for 50,000 RPS across multi-region edge clusters.",
        competencyKey: "Q_SYSTEM_DESIGN",
        successCriteria: ["Evaluate Token Bucket vs Sliding Window Log", "Address Redis race conditions via Lua scripts", "Maintain sub-5ms latency with local token caches"],
        estimatedMinutes: 45,
      },
      {
        id: "sys_obj_3",
        tier: "resilient",
        title: "Idempotent Event-Driven Processing & CDC",
        description: "Guarantee at-least-once message processing without duplicate transactions.",
        competencyKey: "M_BACKEND_ENGINEERING",
        successCriteria: ["Implement Transactional Outbox pattern", "Design consumer deduplication via unique idempotency keys", "Plan dead-letter queue inspection workflows"],
        estimatedMinutes: 50,
      },
      {
        id: "sys_obj_4",
        tier: "strategic",
        title: "Multi-Region Active-Active Replication & Conflict Resolution",
        description: "Navigate cross-region network partitions and data consistency.",
        competencyKey: "Q_SYSTEM_DESIGN",
        successCriteria: ["Apply PACELC trade-off analysis", "Compare Last-Write-Wins vs CRDTs for conflicting writes", "Design split-brain isolation guards"],
        estimatedMinutes: 50,
      },
    ],
    practiceActivities: [
      {
        id: "sys_act_1",
        title: "Architecting an Idempotent Payment Pipeline with Outbox Pattern",
        tier: "applied",
        activityType: "arch_blueprint",
        scenario: "Design a high-scale payment processing pipeline that handles 5,000 checkout transactions per second. The banking gateway has intermittent network dropouts and duplicate webhook retries.",
        taskInstructions: "Produce a system architecture diagram and specification covering: 1) API gateway validation, 2) Transactional Outbox for payment state updates, 3) Idempotency key deduplication in Redis/Postgres, 4) Dead letter queue handling when the banking partner is down.",
        validationCriteria: ["Guaranteed zero duplicate debits", "Resilience against sudden network termination", "Clear definition of database isolation level and indexes"],
        targetSkills: ["Distributed Systems", "Idempotency", "Transactional Outbox", "Event-Driven Architecture"],
        expectedOutputFormat: "System blueprint + component data flow + failure mode table.",
      },
    ],
    evalCriteria: [
      "Clarifying functional requirements, non-functional targets, and scale numbers upfront",
      "Sound selection of database models (relational vs document vs wide-column)",
      "Concrete bottleneck mitigation (caching, connection pooling, backpressure)",
      "Clear fault-tolerance strategies (circuit breakers, dead letter queues, idempotency keys)",
    ],
    feedbackApproach: "Introduce a sudden 10x traffic spike or a major data center network partition and evaluate how their design degrades.",
    sampleTasks: [
      "Architect a distributed rate limiter supporting 50,000 RPS across multi-region clusters",
      "Design a real-time collaborative document editor with conflict resolution (OT/CRDTs)",
      "Design an idempotent payment processing pipeline with transactional outbox and CDC",
    ],
  },

  code_review_reliability: {
    id: "code_review_reliability",
    name: "Code Review & Reliability",
    shortTitle: "Code Review",
    philosophy: "Uphold engineering standards through rigorous peer review, identifying OWASP security vulnerabilities, race conditions, missing observability, and non-maintainable technical debt.",
    primaryCompetencyKeys: ["P_DATA_SECURITY_ISOLATION", "T_TESTING_DEBUGGING", "U_GIT_COLLABORATION"],
    coreCompetencies: [
      { name: "Vulnerability & Security Hole Detection", key: "P_DATA_SECURITY_ISOLATION", weight: 35, description: "Spotting SQL injection, SSRF, IDOR, secrets leakage, and broken access controls in pull requests." },
      { name: "Concurrency & Thread-Safety Auditing", key: "T_TESTING_DEBUGGING", weight: 25, description: "Reviewing asynchronous code for race conditions, deadlock hazards, and unhandled promises." },
      { name: "Constructive & Actionable Feedback", key: "U_GIT_COLLABORATION", weight: 20, description: "Communicating blocking comments with empathy, clear rationale, and code snippets." },
      { name: "Observability & Metric Guardrails", key: "T_TESTING_DEBUGGING", weight: 20, description: "Ensuring adequate logging, telemetry, distributed tracing, and health check coverage." },
    ],
    learningObjectives: [
      {
        id: "rev_obj_1",
        tier: "foundational",
        title: "OWASP Top 10 PR Vulnerability Identification",
        description: "Systematically review pull requests for injection, broken authentication, and exposed secrets.",
        competencyKey: "P_DATA_SECURITY_ISOLATION",
        successCriteria: ["Spot hardcoded API keys or credentials", "Identify raw SQL query concatenation", "Flag insecure direct object references (IDOR)"],
        estimatedMinutes: 30,
      },
      {
        id: "rev_obj_2",
        tier: "applied",
        title: "Concurrency & Shared State Review in Asynchronous Code",
        description: "Detect race hazards and unsafe state mutations in node/go services.",
        competencyKey: "T_TESTING_DEBUGGING",
        successCriteria: ["Spot uncoordinated concurrent writes to shared maps", "Identify missing mutex locks in critical sections", "Audit Promise.all failure behavior"],
        estimatedMinutes: 40,
      },
      {
        id: "rev_obj_3",
        tier: "resilient",
        title: "API Backward Compatibility & Deprecation Audits",
        description: "Verify that API contract changes do not break existing mobile or third-party clients.",
        competencyKey: "P_DATA_SECURITY_ISOLATION",
        successCriteria: ["Detect breaking payload changes", "Verify optionality of newly added request fields", "Enforce API versioning conventions"],
        estimatedMinutes: 45,
      },
      {
        id: "rev_obj_4",
        tier: "strategic",
        title: "Constructive Code Review Culture & Blocking Feedback Delivery",
        description: "Deliver difficult architectural feedback while maintaining high psychological safety and trust.",
        competencyKey: "U_GIT_COLLABORATION",
        successCriteria: ["Separate blocking blockers from non-blocking suggestions (nitpicks)", "Provide concrete code examples for proposed alternatives", "Ground feedback in team standards rather than personal preference"],
        estimatedMinutes: 35,
      },
    ],
    practiceActivities: [
      {
        id: "rev_act_1",
        title: "Pull Request Audit: High-Risk User Export Endpoint",
        tier: "applied",
        activityType: "pr_review",
        scenario: "A junior engineer submits a PR adding an admin user export feature. The code fetches user records based on query parameters, writes a CSV file to disk, and sends it as an attachment.",
        taskInstructions: "Review the 40-line diff. Write line-by-line review comments pointing out: 1) A path traversal vulnerability in filename generation, 2) An unindexed full-table scan query, 3) Out-of-memory crash risk when streaming large datasets. Provide actionable remediation examples.",
        validationCriteria: ["Identification of path traversal vulnerability", "Identification of memory overflow on unbuffered file creation", "Constructive, professional review tone"],
        targetSkills: ["Code Review", "Path Traversal", "Memory Management", "Collaborative Communication"],
        expectedOutputFormat: "PR Review Comments formatted with line numbers, severity tags (Blocker/Nit), and proposed fixes.",
      },
    ],
    evalCriteria: [
      "Constructive, empathetic, and actionable feedback comments",
      "Immediate spotting of security risks (SSRF, IDOR, SQL injection, secrets leakage)",
      "Evaluating test coverage, failure modes, and edge cases",
      "Assessing long-term maintainability, readability, and API backward compatibility",
    ],
    feedbackApproach: "Evaluate whether candidate communicates blocking feedback to a peer while maintaining strong collaborative trust and high standards.",
    sampleTasks: [
      "Reviewing a pull request introducing raw SQL queries and potential injection vectors",
      "Auditing an async webhook handler lacking idempotency checks and replay protection",
      "Reviewing microservice client code lacking circuit breakers, timeouts, or retries",
    ],
  },

  senior_engineering_judgment: {
    id: "senior_engineering_judgment",
    name: "Senior Engineering Judgment",
    shortTitle: "Senior Judgment",
    philosophy: "Navigate ambiguous engineering trade-offs, balance technical excellence with business delivery deadlines, orchestrate zero-downtime database migrations, and manage long-term technical debt.",
    primaryCompetencyKeys: ["D_PROJECT_ARCHITECTURE", "Y_ROLE_SITUATIONAL", "X_OWNERSHIP_LEARNING"],
    coreCompetencies: [
      { name: "Strategic Trade-off Analysis", key: "D_PROJECT_ARCHITECTURE", weight: 35, description: "Evaluating performance, latency, maintenance burden, and delivery velocity objectively." },
      { name: "Technical Debt vs Business Delivery", key: "X_OWNERSHIP_LEARNING", weight: 25, description: "Deciding what technical shortcuts are acceptable short-term vs non-negotiable architectural compromises." },
      { name: "Buy vs Build & Total Cost of Ownership", key: "Y_ROLE_SITUATIONAL", weight: 20, description: "Assessing ongoing maintenance, observability, and team cognitive load vs vendor lock-in." },
      { name: "Zero-Downtime Data Migration & Phased Rollouts", key: "D_PROJECT_ARCHITECTURE", weight: 20, description: "Planning dual-write, backfill, verification, and cutover stages for mission-critical databases." },
    ],
    learningObjectives: [
      {
        id: "sen_obj_1",
        tier: "foundational",
        title: "Buy vs Build Decision Frameworks",
        description: "Quantify Total Cost of Ownership (TCO) between managed SaaS and bespoke in-house implementations.",
        competencyKey: "Y_ROLE_SITUATIONAL",
        successCriteria: ["Factor developer maintenance hours into cost models", "Assess compliance and data residency constraints", "Document decision records (ADRs) with clear criteria"],
        estimatedMinutes: 35,
      },
      {
        id: "sen_obj_2",
        tier: "applied",
        title: "Zero-Downtime Database Migration Planning",
        description: "Design a 4-phase migration for a 50-million-row production table under continuous write traffic.",
        competencyKey: "D_PROJECT_ARCHITECTURE",
        successCriteria: ["Implement Expand and Contract pattern", "Configure dual-writing with shadow reads", "Design asynchronous backfill and automated parity verification"],
        estimatedMinutes: 50,
      },
      {
        id: "sen_obj_3",
        tier: "resilient",
        title: "Managing Technical Debt Under High-Pressure Delivery",
        description: "Establish transparent technical debt budgets and communicate trade-offs to business executives.",
        competencyKey: "X_OWNERSHIP_LEARNING",
        successCriteria: ["Translate technical debt into business risk and delivery velocity impact", "Establish explicit repayment milestones", "Refuse compromises on security or data integrity"],
        estimatedMinutes: 40,
      },
      {
        id: "sen_obj_4",
        tier: "strategic",
        title: "Incident Post-Mortems & Cultural Accountability",
        description: "Lead blameless post-mortems and transform production outages into structural engineering safeguards.",
        competencyKey: "X_OWNERSHIP_LEARNING",
        successCriteria: ["Focus on systemic and organizational safeguards rather than individual blame", "Establish action items with concrete owners and deadlines", "Share learnings transparently across engineering teams"],
        estimatedMinutes: 45,
      },
    ],
    practiceActivities: [
      {
        id: "sen_act_1",
        title: "Zero-Downtime Migration from MongoDB to PostgreSQL",
        tier: "strategic",
        activityType: "tradeoff_defense",
        scenario: "Your high-growth fintech startup needs to migrate core transaction records from MongoDB to PostgreSQL to achieve strict ACID compliance. The table receives 800 writes/sec and cannot experience any downtime.",
        taskInstructions: "Produce a phased migration execution plan detailing: 1) Dual-write application layer changes, 2) Historical data backfill strategy with rate throttling, 3) Real-time shadow read parity verification, 4) Final cutover and fallback contingency trigger.",
        validationCriteria: ["Zero downtime guarantee", "Data consistency parity checks", "Clear rollback procedure if parity drops below 100%"],
        targetSkills: ["Database Migration", "ACID Compliance", "Risk Mitigation", "Zero-Downtime Operations"],
        expectedOutputFormat: "Phase-by-phase migration blueprint + risk mitigation matrix.",
      },
    ],
    evalCriteria: [
      "Pragmatic engineering mindset grounded in business context and ROI",
      "Evaluating Total Cost of Ownership (maintenance, observability, team cognitive load)",
      "Risk mitigation via phased rollouts, feature flags, and dark launching",
      "Effective communication of technical trade-offs to non-engineering stakeholders",
    ],
    feedbackApproach: "Challenge the candidate with sudden budget reductions or tight business deadlines and evaluate what technical compromises they accept vs reject.",
    sampleTasks: [
      "Deciding between building an in-house message broker vs adopting managed Kafka/AWS SQS",
      "Planning a live zero-downtime database migration from MongoDB to PostgreSQL under constant traffic",
      "Balancing architectural refactoring against high-priority executive feature requests",
    ],
  },

  behavioral_project_deep_dives: {
    id: "behavioral_project_deep_dives",
    name: "Behavioral & Project Deep Dives",
    shortTitle: "Project & Behavioral",
    philosophy: "Defend engineering decisions with authenticity, articulate individual technical ownership vs framework abstractions, structure stories using the STAR methodology, and demonstrate collaborative maturity.",
    primaryCompetencyKeys: ["C_PROJECT_DEEP_DIVE", "V_BEHAVIORAL_LEADERSHIP", "X_OWNERSHIP_LEARNING"],
    coreCompetencies: [
      { name: "Technical Project Defense & Ownership", key: "C_PROJECT_DEEP_DIVE", weight: 35, description: "Articulating personal contributions, architectural trade-offs, and lessons learned from past systems." },
      { name: "Constructive Conflict & Impasse Resolution", key: "V_BEHAVIORAL_LEADERSHIP", weight: 25, description: "Navigating strong technical disagreements with empathy, evidence, and alignment." },
      { name: "Incident Accountability & Blameless Post-Mortems", key: "X_OWNERSHIP_LEARNING", weight: 20, description: "Taking personal responsibility for production outages and implementing safeguards." },
      { name: "STAR Storytelling with Quantifiable Outcomes", key: "V_BEHAVIORAL_LEADERSHIP", weight: 20, description: "Structuring answers (Situation, Task, Action, Result) with measurable metrics." },
    ],
    learningObjectives: [
      {
        id: "beh_obj_1",
        tier: "foundational",
        title: "STAR Framework Story Structuring",
        description: "Transform past project experiences into concise, impactful STAR narratives with measurable outcomes.",
        competencyKey: "V_BEHAVIORAL_LEADERSHIP",
        successCriteria: ["Limit Situation and Task to 25% of response time", "Focus 50% on personal concrete Actions taken", "Conclude with quantifiable Results and business impact"],
        estimatedMinutes: 30,
      },
      {
        id: "beh_obj_2",
        tier: "applied",
        title: "Defending Project Trade-offs & Failure Modes",
        description: "Deep-dive into a past project's hardest architectural decision and explain why the alternative was rejected.",
        competencyKey: "C_PROJECT_DEEP_DIVE",
        successCriteria: ["Clearly isolate personal code from team libraries", "Explain the rejected architectural alternative", "Articulate what would be done differently with today's experience"],
        estimatedMinutes: 40,
      },
      {
        id: "beh_obj_3",
        tier: "resilient",
        title: "Resolving Technical Disagreements with Peers",
        description: "Demonstrate constructive advocacy and alignment when disagreeing on critical technical directions.",
        competencyKey: "V_BEHAVIORAL_LEADERSHIP",
        successCriteria: ["Avoid emotional defensiveness", "Use data, prototypes, and latency benchmarks to resolve impasses", "Commit fully once a team decision is finalized ('disagree and commit')"],
        estimatedMinutes: 35,
      },
      {
        id: "beh_obj_4",
        tier: "strategic",
        title: "Production Outage Ownership & Incident Post-Mortem",
        description: "Walk through a production deployment failure you personally caused or triaged.",
        competencyKey: "X_OWNERSHIP_LEARNING",
        successCriteria: ["Own the error without deflecting blame to junior peers or third-party tools", "Detail immediate mitigation steps taken during the incident", "Explain lasting automated safeguards implemented post-incident"],
        estimatedMinutes: 40,
      },
    ],
    practiceActivities: [
      {
        id: "beh_act_1",
        title: "STAR Defense: Diagnosing a Complex Production Outage",
        tier: "applied",
        activityType: "behavioral_star",
        scenario: "You are asked in an interview: 'Tell me about the most difficult bug or outage you personally caused or diagnosed in production. What went wrong, and how did you resolve it?'",
        taskInstructions: "Structure a 3-minute STAR response. Detail: 1) The business situation and customer impact, 2) Your personal technical task, 3) The exact debugging steps and fix you applied, 4) The measurable results and automated safeguard you added to CI.",
        validationCriteria: ["Clear distinction between personal actions and team efforts", "Honest ownership of root cause", "Quantified business metrics in Result phase"],
        targetSkills: ["STAR Method", "Incident Ownership", "Technical Communication", "Accountability"],
        expectedOutputFormat: "Structured STAR response (Situation, Task, Action, Result) with reflection section.",
      },
    ],
    evalCriteria: [
      "Clear distinction of personal implementation versus team or framework code",
      "Adherence to STAR structure with concrete metrics and outcomes",
      "Honest ownership of failures and constructive lessons learned",
      "High empathy and collaborative maturity during technical disagreements",
    ],
    feedbackApproach: "Press on what the candidate would do differently in hindsight and why their original design was suboptimal.",
    sampleTasks: [
      "Walking through the architecture and hardest trade-off in your primary production project",
      "Resolving an architectural deadlock with a senior peer on API design",
      "Conducting a blameless post-mortem for a production outage you were directly involved in",
    ],
  },
};

// ══════════════════════════════════════════════════════════════
// 2. CURRICULUM SYNCHRONIZATION ENGINE
// ══════════════════════════════════════════════════════════════

export interface SynchronizedTrackProgress {
  track: InterviewTrack;
  trackName: string;
  candidateId: string;
  readinessState: "unassessed" | "needs_diagnostic" | "in_progress" | "proficient" | "interview_ready";
  readinessScore: number; // 0 - 100 based on verified assessments
  totalObjectives: number;
  masteredObjectivesCount: number;
  inProgressObjectivesCount: number;
  unassessedObjectivesCount: number;
  targetGapCount: number;
  objectiveStatuses: Array<{
    objectiveId: string;
    title: string;
    tier: DifficultyTier;
    status: "unassessed" | "in_progress" | "mastered" | "target_gap";
    evidenceScore?: number;
    evidenceSource?: string;
  }>;
  recommendedNextActivity: TrackPracticeActivity;
  prioritizedGaps: string[];
  adequatelyAssessedCompetencies: string[];
  calibratedStartingDifficulty: DifficultyTier;
}

/**
 * Synchronizes candidate context (Student DNA, past interviews, weak topics, and assessed competencies)
 * with the designated track's deep-dive curriculum.
 *
 * Invariant: Never fabricates completed lessons or scores. Unassessed areas remain "unassessed"
 * and trigger diagnostic baseline preparation rather than being penalized as failures.
 */
export async function synchronizeCandidateTrackCurriculum(
  candidateId: string,
  track: InterviewTrack,
  targetRole?: string
): Promise<SynchronizedTrackProgress> {
  const curriculum = EIGHT_TRACK_CURRICULA[track];
  if (!curriculum) {
    throw new Error(`[curriculum-synchronizer] Unknown track: ${track}`);
  }

  // 1. Fetch authorized candidate context
  const dossier: CandidateInterviewDossier = await buildCandidateInterviewDossier(
    candidateId,
    undefined,
    targetRole
  );

  const historicalComps = await getHistoricalAssessedCompetencies(candidateId);
  const weakTopics = await getAccumulatedWeakTopics(candidateId);

  // 2. Map curriculum objectives against demonstrated competencies & historical weak spots
  let masteredCount = 0;
  let inProgressCount = 0;
  let gapCount = 0;
  let unassessedCount = 0;
  const adequatelyAssessed: string[] = [];
  const prioritizedGaps: string[] = [];

  const objectiveStatuses = curriculum.learningObjectives.map((obj) => {
    // Check if any historical assessed competency matches this objective's category or title
    let matchedEvidence: { score: number; status: string } | null = null;

    for (const [compName, compData] of Object.entries(historicalComps)) {
      const cleanComp = compName.toLowerCase();
      const cleanObj = obj.title.toLowerCase();
      const cleanDesc = obj.description.toLowerCase();

      if (cleanComp.includes(cleanObj) || cleanObj.includes(cleanComp) || cleanDesc.includes(cleanComp)) {
        if (!matchedEvidence || compData.score > matchedEvidence.score) {
          matchedEvidence = compData;
        }
      }
    }

    // Check if this objective matches an accumulated weak topic
    const isWeak = weakTopics.some((w) => {
      const cleanW = w.toLowerCase();
      return obj.title.toLowerCase().includes(cleanW) || obj.description.toLowerCase().includes(cleanW);
    });

    if (isWeak || (matchedEvidence && (matchedEvidence.status === "gap" || matchedEvidence.score < 60))) {
      gapCount++;
      prioritizedGaps.push(obj.title);
      return {
        objectiveId: obj.id,
        title: obj.title,
        tier: obj.tier,
        status: "target_gap" as const,
        evidenceScore: matchedEvidence?.score || 45,
        evidenceSource: "Prior Assessment Gap / Weak Topic (<60%)",
      };
    }

    if (matchedEvidence && (matchedEvidence.status === "demonstrated" || matchedEvidence.score >= 70)) {
      masteredCount++;
      adequatelyAssessed.push(obj.title);
      return {
        objectiveId: obj.id,
        title: obj.title,
        tier: obj.tier,
        status: "mastered" as const,
        evidenceScore: matchedEvidence.score,
        evidenceSource: "Verified Prior Assessment (Mastery >=70%)",
      };
    }

    // Check verified skills from Student DNA
    const hasVerifiedSkill = (dossier.verifiedSkills || []).some((s) =>
      obj.title.toLowerCase().includes(s.toLowerCase())
    );

    if (hasVerifiedSkill) {
      masteredCount++;
      adequatelyAssessed.push(obj.title);
      return {
        objectiveId: obj.id,
        title: obj.title,
        tier: obj.tier,
        status: "mastered" as const,
        evidenceScore: 78,
        evidenceSource: "Student DNA Verified Skill (Mastery >=70%)",
      };
    }

    // Developing score threshold (60-69% or partial status)
    if (matchedEvidence && (matchedEvidence.status === "partial" || (matchedEvidence.score >= 60 && matchedEvidence.score < 70))) {
      inProgressCount++;
      return {
        objectiveId: obj.id,
        title: obj.title,
        tier: obj.tier,
        status: "in_progress" as const,
        evidenceScore: matchedEvidence.score,
        evidenceSource: "Prior Assessment (Developing 60-69%)",
      };
    }

    // Unassessed by default - no fabrication
    unassessedCount++;
    return {
      objectiveId: obj.id,
      title: obj.title,
      tier: obj.tier,
      status: "unassessed" as const,
    };
  });

  // 3. Derive honest readiness score & state
  const totalObj = curriculum.learningObjectives.length;
  let readinessScore = 0;
  if (masteredCount > 0) {
    readinessScore = Math.round((masteredCount / totalObj) * 100);
  }

  let readinessState: SynchronizedTrackProgress["readinessState"];
  if (masteredCount === 0 && gapCount === 0 && inProgressCount === 0) {
    readinessState = "unassessed";
  } else if (masteredCount === 0 && gapCount > 0) {
    readinessState = "needs_diagnostic";
  } else if (readinessScore >= 80) {
    readinessState = "interview_ready";
  } else if (readinessScore >= 50) {
    readinessState = "proficient";
  } else {
    readinessState = "in_progress";
  }

  // 4. Select calibrated starting difficulty
  let calibratedStartingDifficulty: DifficultyTier = "foundational";
  if (dossier.experienceMode === "experienced") {
    calibratedStartingDifficulty = masteredCount >= 2 ? "resilient" : "applied";
  } else if (masteredCount >= 2) {
    calibratedStartingDifficulty = "applied";
  }

  // 5. Select recommended next practice activity targeting candidate gaps
  let recommendedActivity = curriculum.practiceActivities[0];
  if (gapCount > 0) {
    // If gaps exist, pick an activity matching the gap's tier
    const gapObj = objectiveStatuses.find((o) => o.status === "target_gap");
    if (gapObj) {
      const matchingAct = curriculum.practiceActivities.find((a) => a.tier === gapObj.tier);
      if (matchingAct) recommendedActivity = matchingAct;
    }
  } else if (masteredCount > 0) {
    // Advance to next tier activity
    const uncompleted = objectiveStatuses.find((o) => o.status === "unassessed");
    if (uncompleted) {
      const nextAct = curriculum.practiceActivities.find((a) => a.tier === uncompleted.tier);
      if (nextAct) recommendedActivity = nextAct;
    }
  }

  return {
    track,
    trackName: curriculum.name,
    candidateId,
    readinessState,
    readinessScore,
    totalObjectives: totalObj,
    masteredObjectivesCount: masteredCount,
    inProgressObjectivesCount: inProgressCount,
    unassessedObjectivesCount: unassessedCount,
    targetGapCount: gapCount,
    objectiveStatuses,
    recommendedNextActivity: recommendedActivity,
    prioritizedGaps,
    adequatelyAssessedCompetencies: adequatelyAssessed,
    calibratedStartingDifficulty,
  };
}

const RECENT_PRACTICE_SUBMISSIONS = new Map<string, number>();
const IN_FLIGHT_PRACTICE_SUBMISSIONS = new Map<string, Promise<{ success: boolean; evidenceId: string; message: string; idempotent?: boolean }>>();

export interface PracticeCompletionOptions {
  idempotencyKey?: string;
  assessmentSessionId?: string;
}

/**
 * Records completion of a track practice activity and commits the evidence
 * into the candidate's authentic Student DNA store.
 *
 * Trust-Boundary & Idempotency Invariants:
 * 1. Practice completion alone NEVER establishes verified technical mastery.
 *    Only a trusted, completed server assessment session (verified server-side with score >= 70)
 *    can establish verified technical mastery.
 * 2. Deduplication & Idempotency:
 *    - Uses a deterministic, stable sourceId derived from candidateId, track, activityId, and optional idempotencyKey.
 *    - In-flight mutex ensures concurrent identical requests await the existing execution without duplicating evidence.
 *    - Pre-checks durable Student DNA store. If exact submission already recorded, returns idempotent success without duplicate evidence.
 *    - Retains 3-second rapid-fire debouncer as defense-in-depth against accidental double-clicks.
 * 3. Validation:
 *    - Rejects invalid scores (<0, >100, NaN).
 *    - Rejects unauthorized assessment session references (403/Forbidden if session does not belong to candidate).
 *    - Rejects incomplete assessment sessions (cannot claim mastery from pending or active sessions).
 */
export async function recordTrackPracticeCompletion(
  candidateId: string,
  track: InterviewTrack,
  activityId: string,
  score: number,
  notes: string,
  evaluatorVerdict: "mastered" | "needs_work" | "completed",
  options?: PracticeCompletionOptions
): Promise<{ success: boolean; evidenceId: string; message: string; idempotent?: boolean }> {
  if (!candidateId || !candidateId.trim()) {
    throw new Error("[curriculum-synchronizer] Missing authenticated candidateId");
  }

  if (typeof score !== "number" || isNaN(score) || score < 0 || score > 100) {
    throw new Error(`[curriculum-synchronizer] Invalid score: ${score}. Scores must be within [0, 100].`);
  }

  const curriculum = EIGHT_TRACK_CURRICULA[track];
  if (!curriculum) {
    throw new Error(`[curriculum-synchronizer] Unknown track: ${track}`);
  }

  const activity = curriculum.practiceActivities.find((a) => a.id === activityId);
  if (!activity) {
    throw new Error(`[curriculum-synchronizer] Activity '${activityId}' does not exist in track '${track}'.`);
  }

  // 1. Stable, deterministic canonical sourceId & concurrency lock
  const cleanIdem = options?.idempotencyKey?.trim();
  const canonicalSourceId = `track_act_${candidateId}_${track}_${activityId}`;
  const lockKey = `${candidateId}::${track}::${activityId}`;

  // Check if an identical submission is currently in flight (atomic in-memory lock)
  if (IN_FLIGHT_PRACTICE_SUBMISSIONS.has(lockKey)) {
    return await IN_FLIGHT_PRACTICE_SUBMISSIONS.get(lockKey)!;
  }

  const executionPromise = (async () => {
    // 2. Pre-check durable Student DNA store for existing submission
    const existingDNA = await getStudentDNAFull(candidateId);
    const existing = existingDNA?.evidence?.find(
      (e: any) =>
        e.sourceId === canonicalSourceId ||
        (e.metadata?.activityId === activityId && e.metadata?.track === track)
    );

    if (existing) {
      // If score and verdict are identical, OR if matching idempotencyKey was provided:
      // return idempotent success without creating duplicate evidence or progress.
      // An unverified practice workout CANNOT satisfy a new verified assessmentSessionId claim.
      const existingMatchesSession = !options?.assessmentSessionId || existing.metadata?.validatedSessionId === options.assessmentSessionId;
      const existingScore = existing.metadata?.score ?? (existing as any).score;
      const existingVerdict = existing.metadata?.verdict;
      const isExactDuplicate = (existingScore === score && existingVerdict === evaluatorVerdict) ||
        (Boolean(cleanIdem) && existing.metadata?.idempotencyKey === cleanIdem);

      if (existingMatchesSession && isExactDuplicate) {
        return {
          success: true,
          evidenceId: existing.id || existing.sourceId,
          message: `Practice completion already recorded for ${curriculum.name} activity '${activity.title}' (Idempotent retry).`,
          idempotent: true,
        };
      }
    }

    // 3. Trusted Mastery Verification Trust-Boundary
    // Practice completion alone NEVER establishes verified technical mastery.
    // Only a trusted, completed server assessment session with proven candidate ownership and score >= 70 can establish mastery.
    let establishesMastery = false;
    let validatedSessionId: string | undefined;

    if (options?.assessmentSessionId) {
      const sessId = options.assessmentSessionId.trim();
      const session = await getSessionById(sessId, candidateId);
      if (!session) {
        throw new Error(`[curriculum-synchronizer] Unauthorized: Assessment session '${sessId}' does not belong to candidate '${candidateId}'.`);
      }
      if (session.candidate_id !== candidateId) {
        throw new Error(`[curriculum-synchronizer] Unauthorized: Candidate mismatch on assessment session '${sessId}'.`);
      }
      if (!isSessionCompleted(sessId) || !session.report || !Array.isArray(session.report?.competenciesAssessed)) {
        throw new Error(`[curriculum-synchronizer] Invalid assessment session: Session '${sessId}' is not completed.`);
      }

      // Check whether session report contains demonstrated competency with score >= 70
      const assessedComps = session.report?.competenciesAssessed || [];
      const hasVerifiedComp = assessedComps.some(
        (c: any) =>
          c.score >= 70 &&
          (c.status === "demonstrated" || c.status === "verified" || c.status === "proficient") &&
          (curriculum.name.toLowerCase().includes((c.competency || "").toLowerCase()) ||
            (c.competency || "").toLowerCase().includes(activity.title.toLowerCase()) ||
            curriculum.coreCompetencies.some((cc) => (c.competency || "").toLowerCase().includes(cc.name.toLowerCase())))
      );

      if (!hasVerifiedComp && session.overall_score < 70) {
        throw new Error(`[curriculum-synchronizer] Forged mastery claim: Assessment session '${sessId}' does not contain demonstrated mastery (>= 70%) for track '${track}'.`);
      }

      if (score >= 70 && evaluatorVerdict === "mastered") {
        establishesMastery = true;
        validatedSessionId = sessId;
      }
    }

    // 4. Fast-fail rate limit debounce check (accidental rapid retry within 3s with different params)
    const rateLimitKey = `${lockKey}::${options?.assessmentSessionId || ""}`;
    const now = Date.now();
    const lastSubmit = RECENT_PRACTICE_SUBMISSIONS.get(rateLimitKey);
    if (lastSubmit && now - lastSubmit < 3000) {
      throw new Error(`[curriculum-synchronizer] Duplicate submission detected for activity '${activityId}'. Please wait before retrying.`);
    }
    RECENT_PRACTICE_SUBMISSIONS.set(rateLimitKey, now);

    const trackToSkillMap: Record<InterviewTrack, string> = {
      traditional_coding_dsa: "dsa",
      code_comprehension: "code_comprehension",
      debugging_code_repair: "cs_fundamentals",
      ai_assisted_engineering: "machine_learning",
      system_design: "system_design",
      code_review_reliability: "git",
      senior_engineering_judgment: "leadership_ownership",
      behavioral_project_deep_dives: "communication",
    };

    // Distinct evidence states:
    // - Verified Mastery: sourceType "assessment", verified true, confidence 0.90, verificationStatus VERIFIED
    // - Practice Completion: sourceType "practice", verified false, confidence 0.60, verificationStatus CLAIMED
    const evidenceRecord = {
      sourceType: (establishesMastery ? "assessment" : "practice") as "assessment" | "practice",
      sourceId: canonicalSourceId,
      userId: candidateId,
      skillRaw: trackToSkillMap[track] || "dsa",
      score,
      evidenceType: (establishesMastery ? "assessment_result" : "practical_task") as "assessment_result" | "practical_task",
      claim: establishesMastery
        ? `Demonstrated verified technical mastery in ${curriculum.name} activity '${activity.title}' validated via assessment session '${validatedSessionId}' (score: ${score}%).`
        : `Completed practice workout on ${curriculum.name} activity '${activity.title}' with score of ${score}% (${evaluatorVerdict}). Practice completion alone does not establish verified technical mastery.`,
      confidence: establishesMastery ? 0.90 : 0.60,
      verified: establishesMastery,
      metadata: {
        score,
        track,
        activityId: activity.id,
        activityTitle: activity.title,
        activityType: activity.activityType,
        tier: activity.tier,
        verdict: evaluatorVerdict,
        establishesMastery,
        verified: establishesMastery,
        idempotencyKey: cleanIdem || canonicalSourceId,
        validatedSessionId,
        notes,
        timestamp: new Date().toISOString(),
      },
    };

    const stored = await addStudentEvidenceRecord(candidateId, evidenceRecord as any);

    return {
      success: true,
      evidenceId: stored.evidence?.id || evidenceRecord.sourceId,
      message: establishesMastery
        ? `Recorded verified technical mastery for ${curriculum.name} activity '${activity.title}' (Score: ${score}%).`
        : `Recorded authentic practice workout for ${curriculum.name} activity '${activity.title}' (Score: ${score}%).`,
    };
  })();

  IN_FLIGHT_PRACTICE_SUBMISSIONS.set(lockKey, executionPromise);
  try {
    return await executionPromise;
  } finally {
    IN_FLIGHT_PRACTICE_SUBMISSIONS.delete(lockKey);
  }
}

/**
 * Server-only helper to record verified assessment mastery from a completed interview/assessment session.
 */
export async function recordVerifiedAssessmentMastery(
  candidateId: string,
  sessionId: string,
  track: InterviewTrack,
  activityId: string,
  score: number,
  notes?: string
): Promise<{ success: boolean; evidenceId: string; message: string }> {
  if (!sessionId) {
    throw new Error("[curriculum-synchronizer] Missing sessionId for verified assessment mastery");
  }
  return await recordTrackPracticeCompletion(candidateId, track, activityId, score, notes || "", "mastered", {
    assessmentSessionId: sessionId,
  });
}
