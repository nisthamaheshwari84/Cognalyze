/**
 * COGNALYZE — TECHNICAL INTERVIEW AGENT (MILESTONE 3)
 * Interview Planning Architecture & Adaptive Question Generation
 *
 * Implements a structured 5-stage Directed Acyclic Graph (DAG) plan:
 * Stage 1: Introduction & Background Orientation (3-5 mins)
 * Stage 2: Project Architecture Deep-Dive (12-15 mins) - Probing 12-point project profiles
 * Stage 3: JD Gap Verification (8-10 mins) - Probing unsupported requirements
 * Stage 4: Problem-Solving & System Design (12-15 mins) - Calibrated by experience mode
 * Stage 5: Closing & Candidate Q&A (3-5 mins)
 */

import {
  TwelvePointProjectProfile,
  JDCompetencyMatrix,
  CandidateIntelligenceProfile,
} from "./candidate-intelligence";

export type PlannedInterviewStageId =
  | "introduction"
  | "project_deep_dive"
  | "jd_gap_verification"
  | "system_design"
  | "closing";

export interface PlannedInterviewQuestion {
  id: string;
  stage: PlannedInterviewStageId;
  competencyTargeted: string;
  plannedDifficulty: "easy" | "medium" | "hard";
  promptStem: string;
  expectedConcepts: string[];
  counterFactualProbes: string[];
  evaluationRubric: {
    strongCriteria: string[];
    adequateCriteria: string[];
    shallowCriteria: string[];
  };
  provenanceSource: "resume_project" | "student_dna" | "unsupported_jd_gap" | "role_core";
  projectId?: string;
  projectTitle?: string;
  relevantTech?: string[];
  codingChallengeId?: string;
  isCodingChallenge?: boolean;
}

export interface InterviewStagePlan {
  stageId: PlannedInterviewStageId;
  targetDurationMinutes: number;
  competencies: string[];
  questions: PlannedInterviewQuestion[];
}

export interface InternalInterviewPlan {
  sessionId: string;
  targetRole: string;
  experienceMode: "fresher" | "early_career" | "experienced" | "career-switcher";
  totalPlannedTurns: number;
  stages: InterviewStagePlan[];
  generatedAt: string;
}

/**
 * Maps an InterviewSection (from engine blueprint) to a PlannedInterviewStageId.
 */
export function mapSectionToStageId(section: string): PlannedInterviewStageId {
  switch (section) {
    case "introduction":
      return "introduction";
    case "resume_projects":
      return "project_deep_dive";
    case "technical_fundamentals":
      return "jd_gap_verification";
    case "coding_system_design":
    case "behavioral":
      return "system_design";
    case "closing":
      return "closing";
    default:
      return "project_deep_dive";
  }
}

/**
 * Generates pointed technical questions for Stage 2 (Project Architecture Deep Dive)
 * based on candidate's TwelvePointProjectProfile.
 */
function generateProjectStageQuestions(
  projects: TwelvePointProjectProfile[],
  experienceMode: string
): PlannedInterviewQuestion[] {
  const questions: PlannedInterviewQuestion[] = [];

  const defaultProjects: TwelvePointProjectProfile[] = [
    {
      id: "proj_default_1",
      title: "Full-Stack Web Application",
      verificationStatus: "CANDIDATE_CLAIM",
      tech: ["Node.js", "React", "PostgreSQL", "REST APIs"],
      problemSolved: "End-to-end full stack web application",
      architecture: "Client-server architecture with RESTful API backend",
      techStackRationale: "Standard modern TypeScript web stack",
      personalContribution: "Full stack engineering and database design",
      technicalChallenges: ["Concurrency under simultaneous writes", "Latency optimization"],
      databaseDesign: "Relational schema with normalized tables",
      apiStructure: "RESTful JSON endpoints",
      securityMeasures: "JWT authentication and input validation",
      performanceOptimizations: "Query indexing and asset bundling",
      testingStrategy: "Unit tests with Jest",
      deploymentAndCI: "Automated CI/CD pipeline",
      retrospectiveImprovements: "Adding distributed caching and message queues",
      provenance: {
        architecture: "CANDIDATE_CLAIM",
        personalContribution: "CANDIDATE_CLAIM",
      },
    },
  ];

  const activeProjects = projects && projects.length > 0 ? projects : defaultProjects;

  activeProjects.forEach((project, pIdx) => {
    const techList = project.tech && project.tech.length > 0 ? project.tech : ["Full-Stack Stack"];
    const techSummary = techList.slice(0, 3).join(", ");
    const primaryTech = techList[0] || "primary stack";

    const customProbes = (project as any).counterFactualProbes;
    const defaultArchProbes = [
      "What happens if incoming request traffic spikes 10x in a 60-second window?",
      "How does your architecture handle network partitions between services?",
    ];

    // 1. Architecture & Request Lifecycle Probe
    questions.push({
      id: `plan-proj-${pIdx + 1}-arch`,
      stage: "project_deep_dive",
      competencyTargeted: `System Architecture: ${project.title}`,
      plannedDifficulty: experienceMode === "experienced" ? "hard" : experienceMode === "early_career" ? "medium" : "easy",
      promptStem: `In your ${project.title} project, you used ${techSummary}. Can you walk me through the exact end-to-end data flow of a critical request through your system architecture, from client ingress to database persistence?`,
      expectedConcepts: [
        "Request ingress & routing",
        "Business logic execution",
        "Database transaction boundaries & state management",
        "Caching, connection pooling, or asynchronous decoupling",
      ],
      counterFactualProbes: Array.isArray(customProbes) && customProbes.length > 0 ? customProbes : defaultArchProbes,
      evaluationRubric: {
        strongCriteria: [
          "Traces exact request lifecycles with protocol details (HTTP/gRPC/Kafka)",
          "Explains database transaction boundaries, locking, and caching layers",
          "Identifies potential bottlenecks and single points of failure",
        ],
        adequateCriteria: [
          "Describes high-level client-server flow",
          "Mentions database read/write without deep latency considerations",
        ],
        shallowCriteria: [
          "Only recites buzzwords without explaining actual data flow",
          "Unable to describe how data reaches storage or where validation occurs",
        ],
      },
      provenanceSource: "resume_project",
      projectId: project.id,
      projectTitle: project.title,
      relevantTech: project.tech,
    });

    // 2. Personal Contribution & Technical Trade-offs Probe
    const contributionDetail =
      project.personalContribution && !/unstated/i.test(project.personalContribution)
        ? `You noted: "${project.personalContribution}".`
        : "";

    questions.push({
      id: `plan-proj-${pIdx + 1}-tradeoff`,
      stage: "project_deep_dive",
      competencyTargeted: `Technical Ownership & Trade-offs: ${project.title}`,
      plannedDifficulty: experienceMode === "experienced" ? "hard" : "medium",
      promptStem: contributionDetail
        ? `Regarding ${project.title}, ${contributionDetail} What was your specific personal contribution to the code, and what was the most significant technical trade-off you evaluated when choosing ${primaryTech} over alternatives?`
        : `For your ${project.title} project, what specific components did you own and implement personally? What was the biggest technical trade-off you had to navigate during implementation?`,
      expectedConcepts: [
        "Individual code ownership vs libraries/templates",
        "Trade-off analysis (latency, consistency, complexity, developer velocity)",
        "Alternative technologies evaluated and why they were rejected",
      ],
      counterFactualProbes: [
        `If you rebuilt ${project.title} from scratch today, what architectural decision would you change?`,
        "Why didn't you choose a managed cloud service or simpler framework for this component?",
      ],
      evaluationRubric: {
        strongCriteria: [
          "Crisply distinguishes personal implementation from external frameworks and boilerplate",
          "Provides quantitative or architectural trade-off justification",
          "Acknowledges system limitations candidly and thoughtfully",
        ],
        adequateCriteria: [
          "Identifies features worked on personally",
          "Offers generic justification for technology choice (e.g., 'it was popular' or 'team familiarity')",
        ],
        shallowCriteria: [
          "Vague regarding individual code ownership vs boilerplate",
          "Cannot explain why alternative technologies were rejected",
        ],
      },
      provenanceSource: "resume_project",
      projectId: project.id,
      projectTitle: project.title,
      relevantTech: project.tech,
    });

    // 3. Concurrency, Database Design & Failure Modes Probe
    const challengeText =
      Array.isArray(project.technicalChallenges) && project.technicalChallenges.length > 0
        ? project.technicalChallenges.join("; ")
        : (project as any).failureModesHandled;

    const failureDetail =
      challengeText && !/unstated/i.test(challengeText)
        ? `You highlighted tackling: "${challengeText}".`
        : "";

    questions.push({
      id: `plan-proj-${pIdx + 1}-failure`,
      stage: "project_deep_dive",
      competencyTargeted: `Failure Modes & Concurrency: ${project.title}`,
      plannedDifficulty: experienceMode === "experienced" ? "hard" : "medium",
      promptStem: failureDetail
        ? `In ${project.title}, ${failureDetail} Walk me through a challenging production outage, concurrency race condition, or data inconsistency you encountered, and how did you diagnose and resolve it?`
        : `In your ${project.title} project, what was the most difficult technical bug, concurrency race condition, or database bottleneck you had to troubleshoot, and what root cause did you uncover?`,
      expectedConcepts: [
        "Systematic debugging and root-cause analysis",
        "Concurrency, locking, race conditions, or network retries",
        "Idempotency, schema constraints, or circuit-breaker remediation",
      ],
      counterFactualProbes: [
        "How do you prevent duplicate side-effects if a client retries this operation after an intermittent network timeout?",
        "What observability metrics or alerts would have warned you before users noticed?",
      ],
      evaluationRubric: {
        strongCriteria: [
          "Explains root-cause mechanism with concrete technical precision",
          "Describes preventative architecture (idempotency keys, optimistic locking, bounded retry loops)",
          "Details observability tooling and diagnostic workflows used",
        ],
        adequateCriteria: [
          "Describes a standard bug fix without deep systemic analysis",
          "Mentions basic logging or restarting the service",
        ],
        shallowCriteria: [
          "Claims no bugs or production issues ever occurred",
          "Unable to describe a technical debugging process",
        ],
      },
      provenanceSource: "resume_project",
      projectId: project.id,
      projectTitle: project.title,
      relevantTech: project.tech,
    });
  });

  return questions;
}

/**
 * Generates pointed diagnostic questions for Stage 3 (JD Gap Verification)
 * targeting unsupported requirements from the JD Competency Matrix.
 */
function generateJDGapStageQuestions(
  jdMatrix?: JDCompetencyMatrix,
  targetRole: string = "Software Engineer",
  experienceMode: string = "fresher"
): PlannedInterviewQuestion[] {
  const questions: PlannedInterviewQuestion[] = [];
  const unsupported = jdMatrix?.unsupportedJDRequirements || [];

  if (unsupported.length > 0) {
    unsupported.slice(0, 3).forEach((gap, idx) => {
      const gapLower = gap.toLowerCase();
      let promptStem = "";
      let expectedConcepts: string[] = [];
      let counterFactualProbes: string[] = [];

      if (gapLower.includes("kafka") || gapLower.includes("message") || gapLower.includes("event") || gapLower.includes("stream") || gapLower.includes("rabbitmq")) {
        promptStem = `The role emphasizes event-driven systems and message streaming. While your background doesn't explicitly highlight message brokers, how would you design a consumer group architecture that guarantees message processing order per customer while preventing head-of-line blocking and poison pill crashes?`;
        expectedConcepts = [
          "Partition key strategy",
          "Consumer offsets & commit semantics",
          "Dead-letter queues (DLQ) for poison pills",
          "Idempotent consumer processing",
        ];
        counterFactualProbes = [
          "What happens if consumer processing latency increases by 5x and triggers rebalancing?",
          "How do you guarantee exactly-once processing semantics at the database commit boundary?",
        ];
      } else if (gapLower.includes("kubernetes") || gapLower.includes("k8s") || gapLower.includes("docker") || gapLower.includes("container")) {
        promptStem = `The job description requires experience with Kubernetes and container orchestration. Even if you haven't managed clusters in production, how would you configure rolling zero-downtime updates, liveness/readiness probes, and resource limits for a stateless backend service?`;
        expectedConcepts = [
          "Readiness vs Liveness probes",
          "RollingUpdate strategy with maxSurge and maxUnavailable",
          "Resource limits (CPU/Memory) and OOMKilled recovery",
          "Graceful shutdown (SIGTERM handler & connection draining)",
        ];
        counterFactualProbes = [
          "What happens if your readiness probe checks the database directly and the database slows down?",
          "How do you handle zero-downtime database migrations when older and newer pod versions run simultaneously?",
        ];
      } else if (gapLower.includes("redis") || gapLower.includes("cache") || gapLower.includes("caching")) {
        promptStem = `The position specifies distributed caching architectures. Walk me through how you would architect a cache-aside layer with Redis to handle cache stampede (thundering herd), key eviction, and cache invalidation consistency when database writes occur.`;
        expectedConcepts = [
          "Cache-aside vs write-through patterns",
          "Thundering herd mitigation (mutex lock or probabilistic early expiration)",
          "TTL strategies and LRU/LFU eviction policies",
          "Transactional invalidation and cache consistency hazards",
        ];
        counterFactualProbes = [
          "If the database transaction commits but Redis cache eviction fails, how do you prevent stale data?",
          "What is your strategy for warm cache hydration after a cluster restart?",
        ];
      } else if (gapLower.includes("postgres") || gapLower.includes("sql") || gapLower.includes("database") || gapLower.includes("dbms")) {
        promptStem = `The role requires database query optimization and schema design in PostgreSQL. If a high-volume transactional query suddenly experiences severe latency degradation under production load, walk me through your diagnostic workflow using EXPLAIN ANALYZE and your indexing strategy.`;
        expectedConcepts = [
          "EXPLAIN ANALYZE interpretation (Seq Scan vs Index Scan)",
          "B-Tree index structure and composite index column ordering",
          "Connection pool exhaustion vs lock contention",
          "Vacuum and table bloat mitigation",
        ];
        counterFactualProbes = [
          "Why might PostgreSQL choose a Sequential Scan even when an index exists on the filter column?",
          "How does a multi-column composite index on (merchant_id, created_at) behave if the query filters only on created_at?",
        ];
      } else if (gapLower.includes("graphql")) {
        promptStem = `The position highlights GraphQL API design. How do you prevent nested N+1 database queries using DataLoader, and how do you implement query depth and complexity limiting to prevent denial-of-service queries?`;
        expectedConcepts = ["DataLoader batching and caching", "Query complexity analysis", "Schema stitching or federation", "Pagination with cursor connections"];
        counterFactualProbes = [
          "How do you handle authentication and field-level authorization in a deep GraphQL query tree?",
        ];
      } else if (gapLower.includes("security") || gapLower.includes("auth") || gapLower.includes("oauth") || gapLower.includes("jwt")) {
        promptStem = `The position emphasizes application security and authorization. How do you design a secure token management system using short-lived JWT access tokens and rotating refresh tokens, and how do you handle immediate token revocation?`;
        expectedConcepts = ["Short-lived access tokens", "Refresh token rotation and reuse detection", "Revocation blocklist / distributed redis check", "CSRF and XSS defense"];
        counterFactualProbes = [
          "If a user's refresh token is stolen, how does your system detect and invalidate the session?",
        ];
      } else {
        promptStem = `The role lists ${gap} as an important requirement. While your resume highlights other strong technical achievements, walk me through how you would approach using ${gap} in a production environment, and what architectural trade-offs you would anticipate.`;
        expectedConcepts = [
          `Core mechanics and use cases of ${gap}`,
          "Trade-off analysis and failure recovery",
          "Production observability and error handling",
        ];
        counterFactualProbes = [
          `What failure mode occurs if ${gap} becomes temporarily degraded or unavailable?`,
          "How would you measure and verify performance here in a production environment?",
        ];
      }

      questions.push({
        id: `plan-gap-${idx + 1}`,
        stage: "jd_gap_verification",
        competencyTargeted: `JD Gap Verification: ${gap}`,
        plannedDifficulty: experienceMode === "experienced" ? "hard" : "medium",
        promptStem,
        expectedConcepts,
        counterFactualProbes,
        evaluationRubric: {
          strongCriteria: [
            `Demonstrates working conceptual understanding of ${gap} from engineering first-principles`,
            "Analyzes failure recovery, concurrency, or scaling constraints",
            "Articulates concrete trade-offs despite lack of formal resume claim",
          ],
          adequateCriteria: [
            `Recalls basic definitions or high-level functionality for ${gap}`,
            "Understands its purpose in the overall software stack",
          ],
          shallowCriteria: [
            "Admits zero familiarity without attempting first-principles reasoning",
            `Confuses fundamental concepts of ${gap}`,
          ],
        },
        provenanceSource: "unsupported_jd_gap",
      });
    });
  } else {
    // If no unsupported requirements, verify must-have core competencies from JD matrix or role
    const mustHaves = jdMatrix?.mustHaveCompetencies || [];
    const topCompetency = mustHaves[0]?.name || "Distributed Systems & Concurrency";

    questions.push({
      id: "plan-core-1",
      stage: "jd_gap_verification",
      competencyTargeted: `Core Role Competency: ${topCompetency}`,
      plannedDifficulty: experienceMode === "experienced" ? "hard" : "medium",
      promptStem: `The role requires strong fundamentals in ${topCompetency}. Can you walk me through how you design for high concurrency and database transaction isolation (such as Read Committed vs Serializable) in production systems, and how you mitigate deadlocks?`,
      expectedConcepts: [
        "Transaction isolation levels (Dirty reads, Non-repeatable reads, Phantom reads)",
        "MVCC (Multi-Version Concurrency Control)",
        "Lock ordering and deadlock detection",
        "Optimistic concurrency control vs pessimistic locking",
      ],
      counterFactualProbes: [
        "How do you resolve a deadlock between two transactions updating the same rows in reverse order?",
        "When would you choose optimistic concurrency over pessimistic SELECT FOR UPDATE?",
      ],
      evaluationRubric: {
        strongCriteria: [
          "Accurately explains MVCC and transaction isolation anomalies",
          "Prescribes global lock ordering or retry backoff for deadlocks",
          "Discusses production performance implications of higher isolation levels",
        ],
        adequateCriteria: [
          "Defines deadlocks and basic locking",
          "Understands why isolation levels exist",
        ],
        shallowCriteria: [
          "Confuses ACID properties or claims transactions eliminate all bugs",
          "Unable to explain how deadlocks occur",
        ],
      },
      provenanceSource: "role_core",
    });
  }

  return questions;
}

/**
 * Generates practical problem-solving and system design questions for Stage 4
 * calibrated by candidate experience mode and role domain.
 */
function generateSystemDesignStageQuestions(
  targetRole: string = "Software Engineer",
  experienceMode: string = "fresher"
): PlannedInterviewQuestion[] {
  const roleLower = targetRole.toLowerCase();

  if (experienceMode === "fresher") {
    // Fresher: Practical problem-solving, data structures, and foundational system components
    return [
      {
        id: "plan-sys-fresher-1",
        stage: "system_design",
        competencyTargeted: "Practical Problem Solving & Data Structures",
        plannedDifficulty: "easy",
        promptStem: `Let's work through a practical systems problem: suppose we need to build an in-memory rate limiter that restricts each user to 100 API requests per minute. What data structure would you select, and how do you handle memory cleanup and high concurrency?`,
        expectedConcepts: [
          "Sliding window counter or token bucket algorithm",
          "Hash map with thread-safe / atomic access",
          "TTL or periodic background cleanup of expired buckets",
          "Time complexity O(1) per check",
        ],
        counterFactualProbes: [
          "Why choose a sliding window log over a fixed token bucket?",
          "What if multiple application servers handle requests for the same user concurrently?",
        ],
        evaluationRubric: {
          strongCriteria: [
            "Proposes token bucket or sliding window counter with accurate time/space bounds",
            "Identifies concurrency race conditions on counter increments",
            "Addresses memory leak mitigation for inactive users",
          ],
          adequateCriteria: [
            "Proposes fixed-window counter with basic hash map",
            "Recognizes that stale keys need expiration",
          ],
          shallowCriteria: [
            "Proposes unbounded array or linear scan",
            "Fails to consider memory growth or concurrent requests",
          ],
        },
        provenanceSource: "role_core",
      },
      {
        id: "plan-sys-fresher-2",
        stage: "system_design",
        competencyTargeted: "API Design & Data Validation",
        plannedDifficulty: "medium",
        promptStem: `Suppose you are designing a RESTful API for an order checkout system. What HTTP status codes, request idempotency headers, and error handling structures would you put in place to ensure that a client retry doesn't create duplicate orders?`,
        expectedConcepts: [
          "Idempotency-Key header standard",
          "Unique constraints in database schema",
          "HTTP status codes (201 Created, 200 OK, 409 Conflict, 422 Unprocessable)",
          "Atomic transaction spanning order creation and payment authorization",
        ],
        counterFactualProbes: [
          "What happens if two concurrent requests arrive with the exact same idempotency key at the exact same millisecond?",
          "How long should idempotency keys be retained in the storage layer?",
        ],
        evaluationRubric: {
          strongCriteria: [
            "Designs end-to-end idempotency mechanism using unique keys and atomic transactions",
            "Uses accurate HTTP status codes and structured RFC 7807 error responses",
            "Separates validation errors from infrastructure failures",
          ],
          adequateCriteria: [
            "Mentions checking if order exists before inserting",
            "Uses standard 200 and 400 status codes",
          ],
          shallowCriteria: [
            "Does not understand idempotency or suggests returning 200 for all responses",
            "Cannot explain how duplicate orders are prevented",
          ],
        },
        provenanceSource: "role_core",
      },
    ];
  } else if (experienceMode === "early_career") {
    // Early career (1-3 yr): Microservices, database partitioning, caching topology, and API reliability
    return [
      {
        id: "plan-sys-mid-1",
        stage: "system_design",
        competencyTargeted: "High-Throughput Service Architecture",
        plannedDifficulty: "medium",
        promptStem: `Let's design a high-volume URL shortening service (like Bitly) handling 5,000 writes per second and 50,000 reads per second. Walk me through your database schema, unique short-key generation strategy, and caching topology: how do you structure each tier?`,
        expectedConcepts: [
          "Base62 encoding with distributed sequence generator (Snowflake) or pre-generated keys",
          "Read-heavy caching with Redis / Memcached (LRU eviction)",
          "Database selection & partitioning (NoSQL Key-Value vs Relational with B-Tree)",
          "Availability and latency optimization (CDN / Anycast DNS)",
        ],
        counterFactualProbes: [
          "How do you guarantee unique short keys without incurring a database round-trip lock on every write?",
          "What is your cache eviction policy when the working set exceeds RAM?",
        ],
        evaluationRubric: {
          strongCriteria: [
            "Calculates scale numbers and estimates storage capacity accurately",
            "Proposes collision-free short key generation (Base62 + Snowflake or key generation service)",
            "Designs multi-tier caching with high cache-hit ratio",
          ],
          adequateCriteria: [
            "Proposes hashing (MD5/SHA) with collision resolution",
            "Identifies need for database and cache",
          ],
          shallowCriteria: [
            "Relies on auto-incrementing integer IDs without encoding or distributed coordination",
            "Omits caching despite 10:1 read-to-write ratio",
          ],
        },
        provenanceSource: "role_core",
      },
    ];
  } else {
    // Experienced (3+ yr): Distributed systems, partition tolerance, zero-downtime migrations, fault isolation
    return [
      {
        id: "plan-sys-exp-1",
        stage: "system_design",
        competencyTargeted: "Distributed Systems & Financial Auditability",
        plannedDifficulty: "hard",
        promptStem: `Let's design a globally distributed idempotent payment ledger. If an authorization request times out between the payment gateway and your service, how do you prevent double-charging and resolve network partitions while maintaining financial auditability?`,
        expectedConcepts: [
          "Idempotency keys with distributed locking (Redis Redlock or DB advisory lock)",
          "Two-phase commit vs Saga orchestrator / transactional outbox pattern",
          "Immutable append-only ledger schema (double-entry bookkeeping)",
          "Reconciliation batch workers and webhook signature verification",
        ],
        counterFactualProbes: [
          "How do you resolve two-phase commit latency over cross-region WAN links?",
          "How do you perform a zero-downtime schema migration on an active 100-million-row transaction table?",
        ],
        evaluationRubric: {
          strongCriteria: [
            "Designs immutable double-entry bookkeeping ledger",
            "Solves distributed state transitions using Saga or Transactional Outbox pattern",
            "Explicitly handles partial network failure, clock skew, and partition tolerance",
          ],
          adequateCriteria: [
            "Proposes relational transaction with status columns",
            "Identifies need for idempotency keys and retry handling",
          ],
          shallowCriteria: [
            "Suggests naive CRUD update on account balance table",
            "Ignores network timeouts and partition hazards",
          ],
        },
        provenanceSource: "role_core",
      },
    ];
  }
}

/**
 * MASTER INTERVIEW PLAN GENERATOR (Milestone 3)
 *
 * Constructs a comprehensive 5-stage Directed Acyclic Graph interview plan
 * grounded in candidate evidence, 12-point project profiles, and JD requirements.
 */
export function generateStructuredInterviewPlan(
  dossier: any,
  jdMatrix?: JDCompetencyMatrix,
  candidateIntelligence?: CandidateIntelligenceProfile,
  targetRole?: string,
  durationMinutes: number = 45,
  experienceMode?: string
): InternalInterviewPlan {
  const effectiveRole = targetRole || dossier?.targetRole || "Software Engineer";
  const rawExpMode = experienceMode || dossier?.experienceMode || "fresher";
  const normalizedExpMode: "fresher" | "early_career" | "experienced" | "career-switcher" =
    rawExpMode === "experienced" ? "experienced" :
    rawExpMode === "1-3yr" || rawExpMode === "early_career" ? "early_career" :
    rawExpMode === "career-switcher" ? "career-switcher" : "fresher";

  const sessionId = dossier?.sessionId || `plan_${Date.now()}`;
  const totalPlannedTurns = Math.max(6, Math.min(14, Math.round(durationMinutes / 4)));

  const intelligence = candidateIntelligence || dossier?.candidateIntelligence;
  const projects = intelligence?.projects || dossier?.projects || [];
  const matrix = jdMatrix || dossier?.jdCompetencyMatrix;

  // 1. Stage 1: Introduction & Orientation (3-5 mins)
  const stage1Questions: PlannedInterviewQuestion[] = [
    {
      id: "plan-intro-1",
      stage: "introduction",
      competencyTargeted: "Background & Career Orientation",
      plannedDifficulty: "easy",
      promptStem: `Welcome! To start off, could you give me a brief overview of your engineering background, your primary technical stack, and the kind of technical challenges you've been focused on recently?`,
      expectedConcepts: [
        "Engineering trajectory and education/experience",
        "Primary language and architectural focus",
        "Interest in technical challenges",
      ],
      counterFactualProbes: [
        "What motivated your focus on this specific technical stack?",
        "What type of engineering problems do you enjoy tackling most?",
      ],
      evaluationRubric: {
        strongCriteria: [
          "Articulates a crisp engineering trajectory and core strengths",
          "Mentions concrete technologies and systems built",
          "Communicates with structured clarity",
        ],
        adequateCriteria: [
          "Gives a general overview of background and past coursework/jobs",
          "Mentions basic programming skills",
        ],
        shallowCriteria: [
          "Extremely brief (under 10 words) or vague without mentioning any technical domain",
          "Evades question entirely",
        ],
      },
      provenanceSource: "role_core",
    },
  ];

  // 2. Stage 2: Project Architecture Deep-Dive (12-15 mins)
  const stage2Questions = generateProjectStageQuestions(projects, normalizedExpMode);

  // 3. Stage 3: JD Gap Verification (8-10 mins)
  const stage3Questions = generateJDGapStageQuestions(matrix, effectiveRole, normalizedExpMode);

  // 4. Stage 4: Problem-Solving & System Design (12-15 mins)
  const stage4Questions = generateSystemDesignStageQuestions(effectiveRole, normalizedExpMode);

  // 5. Stage 5: Closing & Candidate Q&A (3-5 mins)
  const stage5Questions: PlannedInterviewQuestion[] = [
    {
      id: "plan-closing-1",
      stage: "closing",
      competencyTargeted: "Engineering Collaboration & Candidate Inquiries",
      plannedDifficulty: "easy",
      promptStem: `We have covered great technical ground today across your projects, architecture, and systems engineering. To wrap up, what questions do you have for me about our engineering challenges, stack, or team culture?`,
      expectedConcepts: [
        "Curiosity about technical architecture and stack",
        "Questions regarding engineering practices, testing, and team growth",
        "Professional engineering engagement",
      ],
      counterFactualProbes: [
        "Is there any particular architectural area or project you'd like to highlight before we conclude?",
      ],
      evaluationRubric: {
        strongCriteria: [
          "Asks insightful questions about technical trade-offs, architecture, or roadmap",
          "Shows genuine passion for engineering craft and team collaboration",
        ],
        adequateCriteria: [
          "Asks standard questions about team size or daily routine",
        ],
        shallowCriteria: [
          "No questions or completely disengaged",
        ],
      },
      provenanceSource: "role_core",
    },
  ];

  const stages: InterviewStagePlan[] = [
    {
      stageId: "introduction",
      targetDurationMinutes: 4,
      competencies: ["Background & Career Orientation", "Communication & Articulation"],
      questions: stage1Questions,
    },
    {
      stageId: "project_deep_dive",
      targetDurationMinutes: 14,
      competencies: [
        "Project Architecture & Trade-offs",
        "Personal Technical Contribution",
        "Failure Modes & Concurrency",
      ],
      questions: stage2Questions,
    },
    {
      stageId: "jd_gap_verification",
      targetDurationMinutes: 10,
      competencies: stage3Questions.map((q) => q.competencyTargeted),
      questions: stage3Questions,
    },
    {
      stageId: "system_design",
      targetDurationMinutes: 14,
      competencies: stage4Questions.map((q) => q.competencyTargeted),
      questions: stage4Questions,
    },
    {
      stageId: "closing",
      targetDurationMinutes: 3,
      competencies: ["Engineering Collaboration & Candidate Inquiries"],
      questions: stage5Questions,
    },
  ];

  return {
    sessionId,
    targetRole: effectiveRole,
    experienceMode: normalizedExpMode,
    totalPlannedTurns,
    stages,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Finds the most relevant planned question for the current stage that has not
 * yet been asked.
 */
export function findNextPlannedQuestion(
  plan: InternalInterviewPlan | undefined,
  currentSection: string,
  questionsAsked: Array<{ question: string; targets?: string }>
): PlannedInterviewQuestion | null {
  if (!plan || !plan.stages || plan.stages.length === 0) return null;

  const targetStageId = mapSectionToStageId(currentSection);
  const stage = plan.stages.find((s) => s.stageId === targetStageId);
  if (!stage || !stage.questions || stage.questions.length === 0) return null;

  // Filter out questions whose stems or targets were already asked
  const askedQuestionsText = (questionsAsked || []).map((q) => (q.question || "").toLowerCase());
  const unasked = stage.questions.filter((pq) => {
    const stemLower = pq.promptStem.toLowerCase();
    return !askedQuestionsText.some((aq) => aq.includes(stemLower.slice(0, 30)) || stemLower.includes(aq.slice(0, 30)));
  });

  return unasked.length > 0 ? unasked[0] : stage.questions[0];
}

/**
 * Attaches a dynamic coding challenge question to Stage 3 or Stage 4 of the Interview Plan.
 */
export function attachCodingChallengeToPlan(
  plan: InternalInterviewPlan,
  problemId: string = "maximum-subarray-sum-kadane-s-algorithm"
): InternalInterviewPlan {
  const targetStage = plan.stages.find((s) => s.stageId === "system_design") || plan.stages[1];
  if (!targetStage) return plan;

  const challengeQ: PlannedInterviewQuestion = {
    id: `plan-code-${problemId}`,
    stage: targetStage.stageId,
    competencyTargeted: "Hands-on Algorithm Implementation & Optimization",
    plannedDifficulty: plan.experienceMode === "experienced" ? "hard" : "medium",
    promptStem: `Let's work through an implementation challenge directly in code: Given an array, find the contiguous subarray that has the largest sum. Can you write a solution that runs in optimal O(N) time and O(1) auxiliary space?`,
    expectedConcepts: [
      "Kadane's algorithm / single-pass prefix tracking",
      "Correct initialization of maxSoFar vs negative numbers",
      "Time complexity O(N)",
      "Space complexity O(1)",
    ],
    counterFactualProbes: [
      "What if all elements in the input array are negative?",
      "How would you return the starting and ending indices in addition to the maximum sum?",
    ],
    evaluationRubric: {
      strongCriteria: [
        "Passes all public and hidden stress tests at N = 10^5 in linear time",
        "Correctly handles all-negative arrays without returning 0",
        "Explains dynamic programming state transitions clearly",
      ],
      adequateCriteria: [
        "Implements working Kadane's algorithm but misses an edge case or struggles to explain complexity",
      ],
      shallowCriteria: [
        "Submits O(N^2) brute force that times out on large inputs",
        "Hardcodes return values for known test cases",
      ],
    },
    provenanceSource: "role_core",
    codingChallengeId: problemId,
    isCodingChallenge: true,
  };

  targetStage.questions.unshift(challengeQ);
  return plan;
}
