/**
 * lib/ai/interview-competency-engine.ts
 * 
 * Interconnected Competency & Track Intelligence Engine for Cognalyze Personalized Interview Arena.
 * 
 * Non-Negotiable Core Principles:
 *   1. Zero Predefined Questions: Competency maps define WHAT to assess, NOT static questions.
 *   2. 8 Interconnected Preparation Tracks: Primary competency is dominant, with organic transitions to supporting concepts.
 *   3. 4 Calibrated Experience Levels: Fresher / Student, Early Career, Experienced, Career Switcher.
 *   4. Semantic Navigation Graph: Maps concepts, prerequisites, advanced dimensions, and valid transitions.
 */

export type ExperienceLevel = "fresher" | "early_career" | "experienced" | "career_switcher";

export type PreparationTrackId =
  | "traditional_coding_dsa"
  | "code_comprehension"
  | "debugging_code_repair"
  | "ai_assisted_engineering"
  | "system_design_scale"
  | "code_review_reliability"
  | "senior_engineering_judgment"
  | "behavioral_project_deep_dives";

export interface ExperienceLevelDefinition {
  level: ExperienceLevel;
  title: string;
  badge: string;
  coreFocus: string[];
  expectedDepth: string;
  complexityFloor: "foundational" | "intermediate" | "advanced";
  avoidExpectations: string[];
  evaluationStandards: string;
}

export const EXPERIENCE_LEVEL_DEFINITIONS: Record<ExperienceLevel, ExperienceLevelDefinition> = {
  fresher: {
    level: "fresher",
    title: "Fresher / Student",
    badge: "CS Fundamentals & Projects",
    coreFocus: [
      "Core CS fundamentals (Data Structures, OOP, OS basics, DBMS, Networks)",
      "Programming fundamentals and logic building",
      "Academic, hackathon, and personal projects",
      "Baseline problem solving and complexity intuition",
      "Basic debugging and error tracing",
      "Technical curiosity and learning adaptability",
    ],
    expectedDepth: "Evaluates conceptual clarity, willingness to think aloud, correct data structure choices, and authentic personal contribution to student projects. Does not demand distributed production warfare.",
    complexityFloor: "foundational",
    avoidExpectations: [
      "Multi-datacenter consensus and zero-downtime database sharding",
      "Deep production SRE on-call war stories",
      "Multi-year technical leadership and organizational roadmaps",
    ],
    evaluationStandards: "Focus on clean reasoning, algorithmic correctness, foundational understanding, and genuine project curiosity.",
  },
  early_career: {
    level: "early_career",
    title: "Early Career (1-3 Years)",
    badge: "Production Code Ownership",
    coreFocus: [
      "Production code ownership and feature delivery",
      "Practical API and database query decisions",
      "Defensive debugging, log analysis, and root-cause tracing",
      "Unit, integration, and regression testing habits",
      "Code maintainability, refactoring, and code review participation",
      "Cross-team engineering collaboration and technical communication",
    ],
    expectedDepth: "Evaluates day-to-day software engineering reality: writing clean production features, handling edge-case bugs, understanding database indexes and API contracts, and taking personal responsibility for code in staging/production.",
    complexityFloor: "intermediate",
    avoidExpectations: [
      "Multi-million dollar infrastructure budget decisions",
      "Executive staff-level organizational alignment",
    ],
    evaluationStandards: "Focus on personal implementation evidence, defensive coding, testing discipline, and understanding trade-offs in real libraries and databases.",
  },
  experienced: {
    level: "experienced",
    title: "Experienced Engineer (Senior / Lead)",
    badge: "Scale, Reliability & Architecture",
    coreFocus: [
      "Distributed architecture, partitioning, and replication",
      "High availability, fault tolerance, and graceful degradation",
      "Concurrency, locks, deadlocks, and race condition prevention",
      "Database schema design, indexing strategies, and query optimization",
      "Performance bottlenecks, latency profiling, and caching strategies",
      "System evolution, technical debt management, and architectural trade-offs",
    ],
    expectedDepth: "Evaluates architectural judgment, handling 10x-100x traffic scaling, identifying single points of failure, designing idempotent pipelines, and defending technical decisions against rigorous alternatives.",
    complexityFloor: "advanced",
    avoidExpectations: [
      "Superficial buzzword drops without architectural mechanics",
      "Trivial syntax questions with no systems depth",
    ],
    evaluationStandards: "Focus on distributed system mechanics, failure containment, latency SLAs, concurrency safety, and end-to-end reliability trade-offs.",
  },
  career_switcher: {
    level: "career_switcher",
    title: "Career Switcher",
    badge: "Transferable Problem-Solving",
    coreFocus: [
      "Transferable problem-solving and domain analytical skills",
      "Rigorous self-taught software engineering fundamentals",
      "Practical standalone projects demonstrating end-to-end execution",
      "Demonstrated programming fluency in chosen primary stack",
      "Learning agility, adaptability, and constructive response to feedback",
    ],
    expectedDepth: "Evaluates genuine technical ability and self-directed grit: can they write working code, explain how their full-stack project operates, and apply disciplined problem-solving to real engineering tasks?",
    complexityFloor: "foundational",
    avoidExpectations: [
      "Obscure academic compiler internals unless relevant to background",
      "Assuming lack of previous professional maturity",
    ],
    evaluationStandards: "Focus on demonstrated programming competence, clarity of explanation, project execution, and ability to grasp new concepts quickly.",
  },
};

export interface SupportingCompetencyRelationship {
  concept: string;
  dimension: string;
  transitionTrigger: string;
  exampleScenario: string;
}

export interface TrackCompetencyModel {
  trackId: PreparationTrackId;
  name: string;
  tagline: string;
  primaryCompetency: string;
  primaryFocusAreas: string[];
  supportingConcepts: string[];
  interconnectedRelationships: SupportingCompetencyRelationship[];
  prerequisiteConcepts: string[];
  advancedConcepts: string[];
  evaluationDimensions: string[];
  interviewerQuestioningStrategy: string;
}

export const TRACK_COMPETENCY_MODELS: Record<PreparationTrackId, TrackCompetencyModel> = {
  traditional_coding_dsa: {
    trackId: "traditional_coding_dsa",
    name: "Traditional Coding & DSA",
    tagline: "Algorithmic Reasoning, Data Structures & Complexity",
    primaryCompetency: "Algorithmic Problem Solving & Data Structures",
    primaryFocusAreas: [
      "Arrays, Strings, and Sliding Window / Two Pointers",
      "Linked Lists, Stacks, Queues, and Monotonic Structures",
      "Trees, Binary Search Trees, Tries, and Traversals",
      "Graphs, BFS, DFS, Topological Sort, and Shortest Paths",
      "Hashing, Collision Resolution, and Hash Maps",
      "Recursion, Backtracking, and Dynamic Programming",
      "Greedy Algorithms, Sorting, and Binary Search",
      "Asymptotic Complexity (Big-O Time and Space)",
    ],
    supportingConcepts: [
      "Memory management and stack vs heap allocation",
      "Edge cases (empty inputs, integer overflow, cycles, nulls)",
      "Data structure selection trade-offs",
      "Code readability, modularity, and testability",
      "Cache locality and runtime hardware considerations",
    ],
    interconnectedRelationships: [
      {
        concept: "Memory & Cache Locality",
        dimension: "Systems Engineering",
        transitionTrigger: "Candidate chooses between Array and Linked List",
        exampleScenario: "Discuss cache misses and contiguous memory in contiguous array vs node-pointer allocations.",
      },
      {
        concept: "Concurrency Safety",
        dimension: "Production Scalability",
        transitionTrigger: "Candidate describes an in-memory queue or cache",
        exampleScenario: "Explore what happens if multiple threads read/write this structure simultaneously.",
      },
      {
        concept: "Production Fault Tolerance",
        dimension: "Reliability",
        transitionTrigger: "Candidate finishes algorithmic solution",
        exampleScenario: "Investigate how the algorithm handles corrupted input or streaming data that exceeds memory.",
      },
    ],
    prerequisiteConcepts: ["Basic Arrays", "Control Flow", "Function Recursion", "Linear Search"],
    advancedConcepts: ["Segment Trees", "Disjoint Set Union", "Bitmask DP", "Amortized Complexity"],
    evaluationDimensions: [
      "Problem Understanding & Clarifying Questions",
      "Approach & Brute Force Explanation",
      "Optimization & Trade-off Reasoning",
      "Time & Space Complexity Rigor",
      "Edge Case Anticipation & Correctness",
    ],
    interviewerQuestioningStrategy:
      "Understand the candidate's intuition first. Ask them to explain the approach before code. Challenge brute force politely. Probe edge cases and complexity. Never reveal the complete solution prematurely.",
  },

  code_comprehension: {
    trackId: "code_comprehension",
    name: "Code Comprehension",
    tagline: "Tracing Execution Flow, State Invariants & Contracts",
    primaryCompetency: "Code Tracing, Mental Modeling & Invariant Verification",
    primaryFocusAreas: [
      "Reading and understanding unfamiliar production code",
      "Execution flow tracing across asynchronous functions",
      "Variable state mutation and invariant validation",
      "Control flow, conditional branching, and early returns",
      "Function call hierarchy and dependency graph understanding",
      "Output prediction and side-effect identification",
      "Module interfaces and contract boundary comprehension",
    ],
    supportingConcepts: [
      "Time and space complexity of traced code",
      "Memory retention and potential memory leaks",
      "Concurrency, race conditions, and event loop behavior",
      "Error handling, exception bubbling, and fallback contracts",
      "Security implications (e.g. unvalidated inputs, injection)",
      "Behavior within a larger distributed service",
    ],
    interconnectedRelationships: [
      {
        concept: "Concurrency & Event Loop",
        dimension: "Runtime Systems",
        transitionTrigger: "Candidate traces asynchronous promises or goroutines",
        exampleScenario: "Probe whether two parallel calls could interleave state mutations unpredictably.",
      },
      {
        concept: "System-Level Impact",
        dimension: "Distributed Systems",
        transitionTrigger: "Candidate explains a single service method",
        exampleScenario: "Ask how this method's database queries affect downstream read replicas under high load.",
      },
    ],
    prerequisiteConcepts: ["Function Call Stack", "Scope & Closures", "Basic Data Structures"],
    advancedConcepts: ["Lock-Free State Tracing", "Distributed Trace Context", "Memory Layout Optimization"],
    evaluationDimensions: [
      "Execution Flow Clarity",
      "State Invariant Recognition",
      "Edge-Case Output Prediction",
      "Subtle Bug & Side-Effect Identification",
      "Architectural Contract Understanding",
    ],
    interviewerQuestioningStrategy:
      "Present concrete code scenarios or snippets. Ask candidate to trace line-by-line execution and predict output. Probe why that output occurs, introduce edge cases, and ask how the module guarantees state consistency.",
  },

  debugging_code_repair: {
    trackId: "debugging_code_repair",
    name: "Debugging & Code Repair",
    tagline: "Root-Cause Analysis, Bug Reproduction & Defensive Repair",
    primaryCompetency: "Root-Cause Identification & Systematic Debugging",
    primaryFocusAreas: [
      "Systematic root-cause analysis (scientific hypothesis testing)",
      "Isolating elusive, intermittent bugs ('heisenbugs')",
      "Stack trace and application log diagnosis",
      "Runtime state inspection and memory leak diagnosis",
      "Defensive patching without breaking external contracts",
      "Automated regression test creation to prevent re-emergence",
    ],
    supportingConcepts: [
      "Database connection starvation and deadlock detection",
      "Network timeouts, retries, and cascading failures",
      "Race conditions, atomic operations, and thread safety",
      "Telemetry, observability metrics, and alerting",
      "Performance regressions introduced by bug fixes",
    ],
    interconnectedRelationships: [
      {
        concept: "Database Deadlocks",
        dimension: "Data Engineering",
        transitionTrigger: "Candidate discusses concurrent transactions",
        exampleScenario: "Ask how they differentiate application thread deadlocks from database lock contention.",
      },
      {
        concept: "Production Telemetry",
        dimension: "Reliability & SRE",
        transitionTrigger: "Candidate proposes a bug fix",
        exampleScenario: "Investigate what metrics or logs would alert them if the fix fails in production.",
      },
    ],
    prerequisiteConcepts: ["Basic Error Handling", "Print/Log Debugging", "Reproducible Test Cases"],
    advancedConcepts: ["Distributed Tracing", "Core Dump Analysis", "eBPF Profiling", "Atomic CAS Primitives"],
    evaluationDimensions: [
      "Hypothesis-Driven Debugging Methodology",
      "Root Cause vs Symptom Differentiation",
      "Defensive & Minimal Patch Design",
      "Regression Test Coverage",
      "Production Verification Strategy",
    ],
    interviewerQuestioningStrategy:
      "Ask candidates to walk through their diagnostic process step by step, not merely present a patch. Probe how they isolate variables, how they test the hypothesis, and how they guarantee no regression occurs.",
  },

  ai_assisted_engineering: {
    trackId: "ai_assisted_engineering",
    name: "AI-Assisted Engineering",
    tagline: "LLM Integration, Prompt Engineering & Code Verification",
    primaryCompetency: "AI Tool Verification, Hallucination Detection & LLM Integration",
    primaryFocusAreas: [
      "Critical verification of AI-generated code and architecture",
      "Detecting subtle hallucinations, logic bugs, and security holes",
      "Structured prompt engineering, task decomposition, and constraints",
      "LLM API integration (token limits, latency, cost, streaming)",
      "Model evaluation, grounding, and RAG architectures",
      "Maintaining human architectural ownership and rigor",
    ],
    supportingConcepts: [
      "Security boundaries (prompt injection, SSRF, data leakage)",
      "Testing AI-augmented features with deterministic assertions",
      "Fallback strategies when LLMs fail, timeout, or hallucinate",
      "Cost optimization, caching, and rate limit handling",
      "System reliability and regression prevention",
    ],
    interconnectedRelationships: [
      {
        concept: "Security & Guardrails",
        dimension: "Application Security",
        transitionTrigger: "Candidate discusses user inputs fed to LLM",
        exampleScenario: "Probe indirect prompt injection and sanitization before tool execution.",
      },
      {
        concept: "Latency & Streaming",
        dimension: "Backend Architecture",
        transitionTrigger: "Candidate describes LLM API calls in user flows",
        exampleScenario: "Explore UX and timeout mitigation for 10-second LLM response times.",
      },
    ],
    prerequisiteConcepts: ["Basic REST APIs", "String Formatting", "Unit Testing"],
    advancedConcepts: ["Vector Indexing & Hybrid Search", "Tool Calling Sandboxes", "Constitutional AI Guardrails"],
    evaluationDimensions: [
      "Critical Verification of Generated Code",
      "Hallucination & Bug Detection",
      "Prompt Decomposition & Constraints",
      "Security & Data Boundary Awareness",
      "Independent Architectural Ownership",
    ],
    interviewerQuestioningStrategy:
      "Test whether the candidate blindly trusts AI outputs or exercises independent engineering judgment. Ask them to audit potentially flawed AI-generated snippets, identify subtle bugs, and explain verification procedures.",
  },

  system_design_scale: {
    trackId: "system_design_scale",
    name: "System Design & Scale",
    tagline: "Distributed Architecture, High Scale & Fault Tolerance",
    primaryCompetency: "Distributed System Architecture & Scalability",
    primaryFocusAreas: [
      "High-level architecture and component decomposition",
      "Data partitioning, sharding, and replication strategies",
      "Database selection (Relational, Key-Value, Document, Wide-Column)",
      "Caching tiers, eviction policies, and cache invalidation",
      "Load balancing, reverse proxies, and API gateways",
      "Asynchronous processing, message queues, and event streams",
      "High availability, fault tolerance, and disaster recovery",
    ],
    supportingConcepts: [
      "Concurrency, locks, and consistency models (CAP / PACELC)",
      "Network protocols (gRPC, WebSockets, REST, HTTP/3)",
      "Monitoring, distributed tracing, and health checks",
      "Security boundaries, authentication, and rate limiting",
      "Cost modeling and infrastructure efficiency",
    ],
    interconnectedRelationships: [
      {
        concept: "Data Consistency",
        dimension: "Database Systems",
        transitionTrigger: "Candidate introduces read replicas or distributed caches",
        exampleScenario: "Examine read-your-writes consistency and cache invalidation under race conditions.",
      },
      {
        concept: "Network Partition Failure",
        dimension: "Distributed Algorithms",
        transitionTrigger: "Candidate designs multi-region architecture",
        exampleScenario: "Investigate what happens when inter-region network split occurs between primary and replica.",
      },
    ],
    prerequisiteConcepts: ["Client-Server Architecture", "Basic SQL Queries", "HTTP Verbs & Status Codes"],
    advancedConcepts: ["Consensus (Raft/Paxos)", "CRDTs & Eventual Consistency", "Multi-Region Active-Active"],
    evaluationDimensions: [
      "Requirements Clarification & Scale Estimation",
      "High-Level Architecture & Clean Decomposition",
      "Storage, Indexing & Data Flow Soundness",
      "Bottleneck Identification & Mitigations",
      "Fault Tolerance & Failure Mode Defense",
    ],
    interviewerQuestioningStrategy:
      "Adapt to experience level: freshers focus on component communication and basic schemas; experienced engineers focus on distributed consensus, partition failures, and zero-downtime migrations. Always challenge single points of failure.",
  },

  code_review_reliability: {
    trackId: "code_review_reliability",
    name: "Code Review & Reliability",
    tagline: "Code Quality, Maintainability, Security & Review Rigor",
    primaryCompetency: "Code Quality, Maintainability & Review Rigor",
    primaryFocusAreas: [
      "Auditing pull requests for logical correctness and edge cases",
      "Maintainability, readability, and clean architecture",
      "Defensive error handling and boundary condition validation",
      "Security vulnerability identification (OWASP Top 10)",
      "Testing coverage, mocking hazards, and test hygiene",
      "Technical debt identification and actionable feedback",
    ],
    supportingConcepts: [
      "Performance implications of suboptimal loops and queries",
      "Design patterns (Factory, Strategy, Observer, Decorator)",
      "Dependency management, backward compatibility, and semantic versioning",
      "Constructive, empathetic technical communication with peers",
    ],
    interconnectedRelationships: [
      {
        concept: "Database N+1 Queries",
        dimension: "Performance & Persistence",
        transitionTrigger: "Candidate reviews ORM code inside a loop",
        exampleScenario: "Probe how they spot and fix N+1 query antipatterns in PRs.",
      },
      {
        concept: "Security Exploits",
        dimension: "Application Security",
        transitionTrigger: "Candidate reviews input parsing code",
        exampleScenario: "Ask them to identify whether unvalidated input could trigger SQL injection or denial-of-service.",
      },
    ],
    prerequisiteConcepts: ["Coding Standards", "Basic Unit Testing", "Git PR Workflows"],
    advancedConcepts: ["Static Analysis AST Rules", "API Contract Breaking Changes", "Zero-Allocation Design"],
    evaluationDimensions: [
      "Risk & Bug Spotting Accuracy",
      "Maintainability & Readability Standards",
      "Security & Boundary Validation",
      "Constructive Feedback Formulation",
      "Trade-off Between Perfection and Delivery",
    ],
    interviewerQuestioningStrategy:
      "Give the candidate realistic code examples with intentional flaws. Ask them to identify the risks, prioritize critical issues over style nits, explain the business/technical impact, and propose clean refactorings.",
  },

  senior_engineering_judgment: {
    trackId: "senior_engineering_judgment",
    name: "Senior Engineering Judgment",
    tagline: "Engineering Trade-offs, Tech Debt, Migrations & Risk",
    primaryCompetency: "Engineering Trade-offs & Strategic Architectural Decisions",
    primaryFocusAreas: [
      "Complex engineering trade-offs (e.g. build vs buy, speed vs rigor)",
      "Technical debt prioritization and pragmatic remediation",
      "Zero-downtime data migrations and system deprecation",
      "Cost vs performance vs reliability optimization",
      "Incident response, post-mortems, and preventing recurrence",
      "Long-term system evolution and sustainable architecture",
    ],
    supportingConcepts: [
      "Cross-team alignment and technical decision communication",
      "Operational simplicity vs specialized high-performance tools",
      "Security, compliance, and regulatory engineering boundaries",
      "Mentorship and engineering excellence standards",
    ],
    interconnectedRelationships: [
      {
        concept: "Live Production Migrations",
        dimension: "Operational Reliability",
        transitionTrigger: "Candidate discusses replacing a core service",
        exampleScenario: "Ask for a dual-write, shadow-traffic, and cutover plan with zero data loss.",
      },
      {
        concept: "Engineering Cost Modeling",
        dimension: "Business Engineering",
        transitionTrigger: "Candidate proposes managed cloud services",
        exampleScenario: "Evaluate cost curves at scale and when to shift from serverless to provisioned compute.",
      },
    ],
    prerequisiteConcepts: ["Production Service Ownership", "Agile/DevOps Lifecycle", "Architecture Fundamentals"],
    advancedConcepts: ["Organizational Conway's Law", "Disaster Recovery Runbooks", "Vendor Lock-in Risk Mitigation"],
    evaluationDimensions: [
      "Holistic Trade-off Reasoning",
      "Pragmatism over Resume-Driven Engineering",
      "Risk Management & Failure Containment",
      "Production Migration Strategy",
      "Clarity of Architectural Defense",
    ],
    interviewerQuestioningStrategy:
      "Present thorny, open-ended engineering dilemmas where there is no perfect answer. Challenge candidates who pick extremes. Evaluate whether they consider operational burden, team familiarity, and business realities.",
  },

  behavioral_project_deep_dives: {
    trackId: "behavioral_project_deep_dives",
    name: "Behavioral & Project Deep Dives",
    tagline: "Ownership, Authentic Contributions, Challenges & STAR",
    primaryCompetency: "Individual Project Ownership, Collaboration & STAR Integrity",
    primaryFocusAreas: [
      "Verifying personal ownership vs team contributions on claimed projects",
      "Technical challenge navigation and problem-solving tenacity",
      "Handling engineering failures, production bugs, and outages",
      "Constructive conflict resolution and technical disagreements",
      "Accountability, trade-off decisions, and lessons learned",
      "Effective communication using the STAR framework (Situation, Task, Action, Result)",
    ],
    supportingConcepts: [
      "Technical architecture of the discussed project",
      "Individual coding, debugging, and testing contributions",
      "Cross-functional collaboration with product, design, and QA",
      "Post-launch metrics, adoption, and subsequent iterations",
    ],
    interconnectedRelationships: [
      {
        concept: "Technical Verification of Claims",
        dimension: "Architecture & Code",
        transitionTrigger: "Candidate claims high-scale impact on a project",
        exampleScenario: "Pivot into the specific database queries or concurrency mechanisms they implemented to verify authenticity.",
      },
      {
        concept: "Incident Reflection",
        dimension: "Engineering Maturity",
        transitionTrigger: "Candidate describes an unexpected production failure",
        exampleScenario: "Explore what blameless post-mortem actions they took to ensure the bug never happened again.",
      },
    ],
    prerequisiteConcepts: ["Basic Project Description", "Communication Basics"],
    advancedConcepts: ["Multi-Team Consensus", "Engineering Culture Leadership", "Executive Technical Storytelling"],
    evaluationDimensions: [
      "Authentic Personal Contribution Evidence",
      "STAR Structure & Concrete Details",
      "Handling Mistakes with Humility & Growth",
      "Technical Collaboration & Constructive Disagreement",
      "Accountability & Follow-Through",
    ],
    interviewerQuestioningStrategy:
      "Deeply investigate what the candidate personally wrote versus what pre-existed or teammates did. Ask: 'What part of the code did YOU touch?', 'Why that library over alternatives?', 'What broke and what was your exact fix?'",
  },
};

/**
 * Normalizes any input track string into one of the 8 canonical tracks
 */
export function normalizeTrackId(input?: string): PreparationTrackId {
  if (!input) return "traditional_coding_dsa";
  const clean = input.toLowerCase().replace(/[^a-z0-9_]/g, "_");

  if (clean.includes("comprehension") || clean.includes("reading")) return "code_comprehension";
  if (clean.includes("debug") || clean.includes("repair")) return "debugging_code_repair";
  if (clean.includes("ai_assist") || clean.includes("copilot") || clean.includes("llm")) return "ai_assisted_engineering";
  if (clean.includes("system_design") || clean.includes("scale") || clean.includes("architecture")) return "system_design_scale";
  if (clean.includes("review") || clean.includes("reliability")) return "code_review_reliability";
  if (clean.includes("judgment") || clean.includes("senior") || clean.includes("tradeoff")) return "senior_engineering_judgment";
  if (clean.includes("behavioral") || clean.includes("project") || clean.includes("hr")) return "behavioral_project_deep_dives";
  if (clean.includes("coding") || clean.includes("dsa") || clean.includes("algorithm")) return "traditional_coding_dsa";

  return "traditional_coding_dsa";
}

/**
 * Normalizes experience mode input into the 4 canonical levels
 */
export function normalizeExperienceLevel(input?: string): ExperienceLevel {
  if (!input) return "experienced";
  const clean = input.toLowerCase().trim();

  if (clean.includes("fresher") || clean.includes("student") || clean.includes("college") || clean.includes("intern")) {
    return "fresher";
  }
  if (clean.includes("1-3") || clean.includes("early") || clean.includes("junior") || clean.includes("associate")) {
    return "early_career";
  }
  if (clean.includes("switch") || clean.includes("transition") || clean.includes("career-switcher")) {
    return "career_switcher";
  }
  return "experienced";
}

