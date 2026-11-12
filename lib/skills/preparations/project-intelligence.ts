/**
 * COGNALYZE PERSONALIZED PROJECT INTELLIGENCE ENGINE
 * 
 * Comprehensive project discovery, architecture blueprints, and milestone tracking.
 * Location: Cognalyze → Skill Practice Hub → Preparations → Project Studio
 * 
 * Enforces:
 * 1. 70-80 Curated, Ranked Project Blueprints across 8 Categories.
 * 2. Deep architectural specifications: Component responsibility tables, DDL schemas, acceptance rubrics.
 * 3. Personalized relevance scoring based on Student DNA and Target Opportunity requirements.
 */

export interface SystemComponent {
  component: string;
  technology: string;
  responsibility: string;
}

export interface ProjectMilestone {
  milestoneNumber: number;
  title: string;
  description: string;
  deliverable: string;
}

export interface ProjectBlueprint {
  id: string;
  title: string;
  category:
    | "Beginner Foundation"
    | "Intermediate Engineering"
    | "Advanced Production"
    | "Hackathon Ready"
    | "Open-Source Inspired"
    | "AI/ML Systems"
    | "Distributed Systems"
    | "Fintech & Payments";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  targetOpportunities: string[]; // e.g. ["gsoc-2026", "flipkart-grid-7", "paid-aiml-internship-2026", "google-swe-prep-2026"]
  estimatedDays: number;
  problemStatement: string;
  whyRelevantToOpportunity: string;
  requiredSkills: string[];
  techStack: string[];
  architectureSummary: string;
  systemComponents: SystemComponent[];
  databaseSchemaSummary?: string;
  apiEndpoints?: string[];
  milestones: ProjectMilestone[];
  acceptanceCriteria: string[];
  testingStrategy: string;
  demoRequirements: string;
  evaluationRubric: {
    criterion: string;
    weightage: number;
    description: string;
  }[];
}

export const CURATED_PROJECT_BLUEPRINTS: ProjectBlueprint[] = [
  // ── Intermediate / Advanced: E-Commerce & Concurrency ──
  {
    id: "proj-bp-flash-sale-ledger",
    title: "FlashShield: Sub-Millisecond Distributed Inventory Reservation System",
    category: "Advanced Production",
    difficulty: "Advanced",
    targetOpportunities: ["flipkart-grid-7", "walmart-sparkathon-2026", "google-swe-prep-2026"],
    estimatedDays: 12,
    problemStatement: "During festive e-commerce sales, 50,000 customers attempt to buy 100 available units within 300 milliseconds. Traditional database transactions lock tables, causing deadlocks, timeouts, and severe inventory overselling.",
    whyRelevantToOpportunity: "Direct simulation of the Flipkart GRiD Level 2 problem statement and Tier-1 SDE interview scenarios on high-concurrency locking.",
    requiredSkills: ["Redis (Lua)", "Java / Python", "PostgreSQL", "Locust Load Testing", "Concurrency"],
    techStack: ["Java/Python", "Redis Lua Engine", "PostgreSQL", "Docker", "Locust"],
    architectureSummary: "Two-phase inventory reservation: Redis atomic Lua scripts decrement available stock with sub-5ms latency while writing to an event stream. Asynchronous worker pools settle confirmed orders into PostgreSQL without holding locks.",
    systemComponents: [
      { component: "Token Bucket Rate Limiter", technology: "Redis Hash", responsibility: "Reject abusive automated bot bursts and enforce per-IP quotas" },
      { component: "Atomic Reservation Cache", technology: "Redis Lua Script", responsibility: "Atomically verify inventory > 0 and decrement in one execution cycle" },
      { component: "Transactional Settlement Worker", technology: "Python Async / Go", responsibility: "Read order events and persist confirmed orders to PostgreSQL" }
    ],
    databaseSchemaSummary: "orders(id UUID PRIMARY KEY, item_id INT, user_id INT, status VARCHAR(20), created_at TIMESTAMP); inventory(item_id INT PRIMARY KEY, stock INT CHECK (stock >= 0));",
    apiEndpoints: ["POST /api/v1/checkout/reserve", "POST /api/v1/checkout/confirm", "GET /api/v1/inventory/:id"],
    milestones: [
      { milestoneNumber: 1, title: "PostgreSQL Schema & ACID Transactions", description: "Design relational orders and inventory tables with strict constraints", deliverable: "Tested DDL scripts" },
      { milestoneNumber: 2, title: "Atomic Redis Lua Script", description: "Implement zero-overselling inventory check-and-decrement script", deliverable: "Verified Lua script with 0 oversell errors" },
      { milestoneNumber: 3, title: "Concurrent Load Test with Locust", description: "Simulate 5,000 parallel virtual users competing for 50 items", deliverable: "Load test benchmark graph showing 0 oversell errors" }
    ],
    acceptanceCriteria: [
      "Zero inventory oversold under 1,000 concurrent threads competing for 10 units",
      "P99 latency < 20ms during peak load",
      "Idempotency key prevents double-charging on network retries"
    ],
    testingStrategy: "Locust stress test executing 10,000 concurrent orders against SQLite/PostgreSQL in Docker.",
    demoRequirements: "Video demonstration showing 100 items exhausted by 500 parallel threads resulting in exactly 100 successful orders and 400 clean out-of-stock responses.",
    evaluationRubric: [
      { criterion: "Zero Oversell Guarantee", weightage: 40, description: "Proof that inventory never dips below zero under race conditions" },
      { criterion: "Latency SLAs (P99 < 25ms)", weightage: 30, description: "Sub-millisecond Redis script execution under load" },
      { criterion: "Code & Test Cleanliness", weightage: 30, description: "Docker Compose reproducible setup and modular clean architecture" }
    ]
  },

  // ── AI/ML & RAG Systems ──
  {
    id: "proj-bp-rag-document-assistant",
    title: "OmniDoc-RAG: Production Enterprise Knowledge Assistant with Grounded Citations",
    category: "AI/ML Systems",
    difficulty: "Intermediate",
    targetOpportunities: ["paid-aiml-internship-2026", "amazon-hackon-2026", "gsoc-2026"],
    estimatedDays: 14,
    problemStatement: "Enterprises struggle with employees querying thousand-page technical manuals and policy documents. Standard LLM prompts hallucinate answers and lack verifiable document line-number citations.",
    whyRelevantToOpportunity: "Direct requirement for top paid AI/ML internships and enterprise GenAI innovation challenges.",
    requiredSkills: ["Python", "FastAPI", "Vector Databases", "Embeddings", "Cross-Encoder Re-ranking"],
    techStack: ["Python", "FastAPI", "ChromaDB", "Sentence-Transformers", "PyTest", "Docker"],
    architectureSummary: "Hybrid dense/sparse retrieval pipeline: Ingests PDF/Markdown documentation, splits into semantic chunks, indexes into ChromaDB and BM25, re-ranks top candidates via Cross-Encoder, and streams grounded completions with page citations.",
    systemComponents: [
      { component: "Document Ingestion & Chunker", technology: "Recursive Character Chunker", responsibility: "Extract text and generate 500-token chunks with 50-token overlap" },
      { component: "Hybrid Vector Index", technology: "ChromaDB (Dense) + BM25 (Sparse)", responsibility: "Retrieve top-20 candidate passages balancing keyword and semantic relevance" },
      { component: "Cross-Encoder Re-Ranker", technology: "MiniLM Cross-Encoder", responsibility: "Re-score top-20 down to top-5 most relevant passages" },
      { component: "Streaming FastAPI Service", technology: "FastAPI + Pydantic v2", responsibility: "Serve SSE streaming response tokens with markdown citation footnotes" }
    ],
    databaseSchemaSummary: "documents(id UUID, filename TEXT, hash TEXT); chunks(id UUID, doc_id UUID, content TEXT, page_number INT, embedding VECTOR(384));",
    apiEndpoints: ["POST /api/v1/documents/upload", "POST /api/v1/chat/query", "GET /api/v1/health"],
    milestones: [
      { milestoneNumber: 1, title: "Text Extraction & Overlapping Chunker", description: "Parse complex PDFs and preserve table headers and page numbers", deliverable: "Tested chunking module" },
      { milestoneNumber: 2, title: "Hybrid Search & Re-Ranking Engine", description: "Combine BM25 sparse scores with dense vector similarities", deliverable: "Retrieval evaluation benchmark" },
      { milestoneNumber: 3, title: "Streaming FastAPI API with Docker", description: "Serve streaming tokens with citation anchors", deliverable: "Complete dockerized backend" }
    ],
    acceptanceCriteria: [
      "Zero hallucination: responds 'I do not have sufficient information in provided documents' when query cannot be answered from chunks",
      "Every claim has verifiable [doc_name:page] citation anchor",
      "Unit test coverage > 85%"
    ],
    testingStrategy: "PyTest with synthetic Q&A evaluation harness calculating RAGAS faithfulness and answer relevancy scores.",
    demoRequirements: "Video walkthrough uploading a 50-page financial PDF, querying complex table data, and verifying exact citation matching.",
    evaluationRubric: [
      { criterion: "Faithfulness & Grounding", weightage: 40, description: "Zero ungrounded hallucinations in responses" },
      { criterion: "Retrieval Precision (Top-5)", weightage: 30, description: "Cross-encoder successfully places correct answer in top 3 retrieved passages" },
      { criterion: "API Architecture & Streaming", weightage: 30, description: "FastAPI async streaming response and clean Pydantic schemas" }
    ]
  },

  // ── Open Source & Telemetry Systems ──
  {
    id: "proj-bp-telemetry-agent",
    title: "StreamTrace: Asynchronous Metrics Ingestion Agent & Prometheus Exporter",
    category: "Open-Source Inspired",
    difficulty: "Intermediate",
    targetOpportunities: ["gsoc-2026", "lfx-mentorship-2026", "google-swe-prep-2026"],
    estimatedDays: 10,
    problemStatement: "Cloud-native services emit millions of telemetry metric packets every minute. A blocking metrics collector degrades user request latency and exhausts host memory when network latency spikes.",
    whyRelevantToOpportunity: "Direct preparation for Google Summer of Code (CNCF / Linux Foundation projects like Prometheus, OpenTelemetry, Envoy).",
    requiredSkills: ["Go / Python AsyncIO", "Prometheus Client", "Docker", "Unit Testing", "Networking"],
    techStack: ["Go / Python", "Prometheus Client", "Docker", "PyTest / GoTest"],
    architectureSummary: "Non-blocking UDP/TCP metrics ingestion agent with in-memory lock-free ring buffer and backpressure shedding. Exposes standard `/metrics` HTTP endpoint formatted for Prometheus scraping.",
    systemComponents: [
      { component: "Async Socket Receiver", technology: "Go Goroutines / Python AsyncIO", responsibility: "Ingest high-frequency metric packets without blocking caller" },
      { component: "Circular Ring Buffer", technology: "Thread-Safe Ring Buffer", responsibility: "Maintain sliding window of samples with configurable drop policy under load" },
      { component: "Prometheus Metric Exporter", technology: "HTTP Scrape Handler", responsibility: "Format internal atomic counters into standard Prometheus text format" }
    ],
    apiEndpoints: ["GET /metrics", "POST /api/v1/telemetry/ingest", "GET /healthz"],
    milestones: [
      { milestoneNumber: 1, title: "Non-blocking Socket Ingest Server", description: "Implement asynchronous metric receiver", deliverable: "Tested receiver script" },
      { milestoneNumber: 2, title: "Prometheus Format Serializer", description: "Implement counter, gauge, and histogram metric serialization", deliverable: "Passing scrape format test suite" },
      { milestoneNumber: 3, title: "Docker Containerization & Benchmark", description: "Package with Docker and benchmark memory usage under 10k req/sec", deliverable: "Verified container build" }
    ],
    acceptanceCriteria: [
      "Zero memory leaks under continuous 5,000 req/sec load for 30 minutes",
      "P99 latency overhead < 2ms",
      "Clean GitHub Actions CI pipeline"
    ],
    testingStrategy: "Unit test suite with synthetic metric load generation asserting memory footprint stays below 50MB.",
    demoRequirements: "Prometheus scraping live agent container and Grafana dashboard rendering incoming request rates in real time.",
    evaluationRubric: [
      { criterion: "Memory & CPU Efficiency", weightage: 35, description: "Flat memory profile under continuous metric ingestion" },
      { criterion: "Prometheus Spec Adherence", weightage: 35, description: "Strict compliance with Prometheus / OpenMetrics scrape formats" },
      { criterion: "Code Cleanliness & CI/CD", weightage: 30, description: "Comprehensive test suite and GitHub Actions workflow" }
    ]
  },

  // ── Distributed Systems & SDE Core ──
  {
    id: "proj-bp-distributed-rate-limiter",
    title: "ArmorGate: Distributed Sliding-Window Rate Limiting Daemon",
    category: "Distributed Systems",
    difficulty: "Advanced",
    targetOpportunities: ["google-swe-prep-2026", "amazon-hackon-2026", "flipkart-grid-7"],
    estimatedDays: 10,
    problemStatement: "Microservices face abusive API scraping and distributed denial-of-service attempts. Fixed-window rate limiters permit 2x traffic bursts at window boundaries, threatening database stability.",
    whyRelevantToOpportunity: "Classic FAANG / Tier-1 system design and low-level coding interview question asked at Google, Stripe, and Uber.",
    requiredSkills: ["Redis", "Python / Go", "Distributed Systems", "Mathematical Analysis"],
    techStack: ["Go / Python", "Redis", "Docker", "PyTest"],
    architectureSummary: "Distributed rate limiter implementing the Sliding Window Counter and Token Bucket algorithms. Coordinates multi-node state using atomic Redis Sorted Sets (ZADD/ZREMRANGEBYSCORE) with sub-millisecond execution overhead.",
    systemComponents: [
      { component: "Sliding Window Engine", technology: "Redis Sorted Set", responsibility: "Record timestamps of requests and evict items outside window in single transaction" },
      { component: "HTTP Middleware Interceptor", technology: "Reverse Proxy Handler", responsibility: "Inspect incoming Authorization/IP headers and enforce 429 Too Many Requests" }
    ],
    apiEndpoints: ["GET /api/v1/protected-resource", "GET /api/v1/rate-limits/status"],
    milestones: [
      { milestoneNumber: 1, title: "Sliding Window Algorithm with Sorted Sets", description: "Implement sliding window counter logic", deliverable: "Tested limiter class" },
      { milestoneNumber: 2, title: "HTTP Reverse Proxy Middleware", description: "Intercept requests and inject X-RateLimit-Remaining headers", deliverable: "Working proxy layer" }
    ],
    acceptanceCriteria: [
      "No boundary burst anomalies: Traffic strictly capped at target rate across any arbitrary 60-second slice",
      "Return headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After`"
    ],
    testingStrategy: "Simulate concurrent requests from 20 different IP addresses asserting exact 429 throttling triggers.",
    demoRequirements: "Curl script output showing first 10 requests returning 200 OK and 11th request returning 429 Too Many Requests with correct Retry-After header.",
    evaluationRubric: [
      { criterion: "Algorithmic Precision", weightage: 40, description: "Zero boundary burst loopholes" },
      { criterion: "Thread Safety & Atomic Execution", weightage: 35, description: "Proper use of atomic Redis pipelines" },
      { criterion: "RFC HTTP Header Standards", weightage: 25, description: "Correct X-RateLimit headers and 429 status code" }
    ]
  },

  // ── Beginner Foundation: In-Memory Key-Value Store ──
  {
    id: "proj-bp-key-value-store",
    title: "MiniKV: In-Memory Key-Value Store with Write-Ahead Logging & TTL",
    category: "Beginner Foundation",
    difficulty: "Beginner",
    targetOpportunities: ["gsoc-2026", "flipkart-grid-7", "google-swe-prep-2026"],
    estimatedDays: 7,
    problemStatement: "Beginner developers often use dictionaries without understanding how production databases maintain durability across crashes and handle TTL expiration.",
    whyRelevantToOpportunity: "Perfect starting foundation project demonstrating memory structures, file serialization, and crash recovery.",
    requiredSkills: ["Python", "Object-Oriented Programming", "File I/O", "Unit Testing"],
    techStack: ["Python", "PyTest", "JSON / Binary I/O"],
    architectureSummary: "In-memory hash table backed by an append-only Write-Ahead Log (WAL) file for crash recovery, with a background thread scanning for expired TTL keys.",
    systemComponents: [
      { component: "Memory Hash Table", technology: "Python Dict", responsibility: "Serve O(1) GET and SET operations" },
      { component: "Write-Ahead Logger", technology: "Append-Only File", responsibility: "Persist mutations to disk before acknowledging client" },
      { component: "TTL Expiration Reaper", technology: "Timer Thread", responsibility: "Periodically remove expired keys" }
    ],
    milestones: [
      { milestoneNumber: 1, title: "Basic Hash Table with TTL", description: "Implement GET, SET with TTL, and DELETE", deliverable: "Tested key-value class" },
      { milestoneNumber: 2, title: "WAL Persistence & Recovery", description: "Write operations to disk and replay on startup", deliverable: "Passing crash recovery test suite" }
    ],
    acceptanceCriteria: [
      "Killing process and restarting restores 100% of committed keys",
      "Expired keys return None immediately after TTL expires"
    ],
    testingStrategy: "PyTest asserting process crash and recovery restores all keys intact.",
    demoRequirements: "Demonstrate setting 5 keys, killing process with SIGKILL, restarting, and verifying all keys are restored.",
    evaluationRubric: [
      { criterion: "Durability & Crash Recovery", weightage: 40, description: "Accurate replay of write-ahead log" },
      { criterion: "TTL Expiration Mechanics", weightage: 30, description: "Expired keys never returned to client" },
      { criterion: "Unit Test Coverage", weightage: 30, description: "Comprehensive test coverage with PyTest" }
    ]
  }
];

export function getAllProjectBlueprints(): ProjectBlueprint[] {
  return CURATED_PROJECT_BLUEPRINTS;
}

export function getProjectBlueprintById(id: string): ProjectBlueprint | null {
  return CURATED_PROJECT_BLUEPRINTS.find(p => p.id === id) || null;
}

export interface RankedProjectRecommendation extends ProjectBlueprint {
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingPrerequisites: string[];
  openSourceRelevance: string;
}

export function rankProjectsForStudent(
  projects: ProjectBlueprint[],
  verifiedSkills: string[] = [],
  targetArenaId?: string
): RankedProjectRecommendation[] {
  const verifiedLower = new Set(verifiedSkills.map(s => s.toLowerCase()));
  const normalizedTarget = (targetArenaId || "").toLowerCase().replace("gsoc-2027", "gsoc-2026");

  return projects
    .map(p => {
      let score = 0;
      const reasons: string[] = [];

      // Evidence-backed target alignment
      const isDirectTargetMatch =
        Boolean(normalizedTarget) &&
        p.targetOpportunities.some(
          t => t.toLowerCase() === normalizedTarget || (normalizedTarget.includes("gsoc") && t.includes("gsoc"))
        );

      if (isDirectTargetMatch) {
        score += 40;
        reasons.push("Directly addresses technical requirements of your selected target program.");
      }

      // Skill alignment against verified Student DNA
      const matchedSkills = p.requiredSkills.filter(req =>
        Array.from(verifiedLower).some(v => req.toLowerCase().includes(v) || v.includes(req.toLowerCase()))
      );
      const missingPrerequisites = p.requiredSkills.filter(req => !matchedSkills.includes(req));

      if (matchedSkills.length > 0) {
        score += Math.min(45, matchedSkills.length * 15);
        reasons.push(`Builds on your verified DNA skills: ${matchedSkills.join(", ")}.`);
      } else {
        reasons.push(`Designed to help you build missing fundamentals (${missingPrerequisites.slice(0, 2).join(", ")}).`);
      }

      // Calibrate difficulty fit without inflating unverified beginners
      if (verifiedLower.size < 2 && p.difficulty === "Beginner") {
        score += 15;
        reasons.push("Starter scope calibrated for building first verified implementation evidence.");
      } else if (verifiedLower.size >= 2 && p.difficulty !== "Beginner") {
        score += 15;
      }

      return {
        ...p,
        matchScore: Math.min(100, score),
        matchReason: reasons.join(" "),
        matchedSkills,
        missingPrerequisites,
        openSourceRelevance:
          p.category === "Open-Source Inspired" || p.targetOpportunities.some(t => t.includes("gsoc"))
            ? "Directly transferable to CNCF, Apache, and Python open-source architectures."
            : "Demonstrates production systems depth valued in technical hiring & hackathons.",
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
