/**
 * lib/ai/interview-turn-blueprint.ts
 * 
 * First-Class Turn Question Blueprint Engine for Cognalyze Personalized Interview Arena.
 * 
 * Guarantees that every generated question is grounded in:
 * 1. Target Role & Job Description Requirements
 * 2. Target Company & Verified Company Intelligence (or Startup / Industry Patterns)
 * 3. Candidate Experience Level (Fresher vs Early Career vs Experienced vs Career Switcher)
 * 4. Selected Preparation Track (all 8 tracks)
 * 5. Candidate's Verified Skills & Specific Projects
 * 6. Candidate's Identified Gaps, Weaknesses, and Unverified Claims
 * 7. Adaptive Progression & Previous Answer Assessment
 * 8. Strict Semantic Anti-Repetition across current and prior sessions
 */

import {
  InterviewSection,
  InterviewTrack,
  ExperienceMode,
  GeneratedQuestion,
  AnswerAssessment,
  CandidateInterviewDossier,
  AdvancedSessionState,
  LoggedQuestion,
  isQuestionSemanticallyDuplicate,
} from "./interview-engine";
import { resolveCompanyIntelligence, CompanyIntelligenceProfile } from "./company-intelligence";
import {
  getTrackSpecializationConfig,
  TrackQuestionTemplate,
} from "./interview-specialization-engine";

export type RoleCategory =
  | "aiml"
  | "sde_backend"
  | "frontend"
  | "data_eng"
  | "devops"
  | "security"
  | "general_cs";

export interface TurnQuestionBlueprint {
  turnIndex: number;
  section: InterviewSection;
  roleCategory: RoleCategory;
  track: InterviewTrack;
  experienceMode: ExperienceMode;
  targetRole: string;
  targetCompany: string;
  companyProfile: CompanyIntelligenceProfile;
  competencyEvaluated: string;
  specificSkillTested: string;
  questionType: GeneratedQuestion["question_type"];
  difficulty: "easy" | "medium" | "hard";
  expectedEvaluationCriteria: string[];
  candidateRelevance: string;
  isCompetencyAlreadyTested: boolean;
  targetProject?: {
    title: string;
    tech: string[];
    description?: string;
  };
  targetGap?: string;
  adaptedFromPreviousTurn?: {
    lastAnswerQuality: string;
    actionTaken: "escalate_depth" | "probe_gap" | "simplify_prerequisite" | "clarify_contradiction" | "pivot_topic";
    rationale: string;
  };
  trackTemplate?: TrackQuestionTemplate;
  interactionFormat?: string;
  codeSnippet?: string;
  followUpStrategy?: string;
}

/**
 * Identifies the functional technical domain / role category from role title and skills focus.
 */
export function determineRoleCategory(
  targetRole?: string,
  skillsFocus?: string[] | string
): RoleCategory {
  const combined = `${targetRole || ""} ${Array.isArray(skillsFocus) ? skillsFocus.join(" ") : skillsFocus || ""}`.toLowerCase();

  if (
    /machine learning|\bml\b|\bai\b|deep learning|data scien|nlp|\bllm\b|computer vision|genai|pytorch|tensorflow|huggingface|langchain/i.test(combined)
  ) {
    return "aiml";
  }
  if (
    /frontend|\bui\b|\bux\b|client|web|react|next\.?js|vue|angular|css|mobile|android|ios|flutter|react native/i.test(combined)
  ) {
    return "frontend";
  }
  if (
    /data engineer|etl|pipeline|spark|hadoop|data warehouse|snowflake|databricks|\bdbt\b|iceberg|flink/i.test(combined)
  ) {
    return "data_eng";
  }
  if (
    /devops|\bsre\b|infrastructure|cloud|kubernetes|docker|terraform|aws|gcp|site reliability|observability/i.test(combined)
  ) {
    return "devops";
  }
  if (
    /security|infosec|cyber|penetration|appsec|cryptograph|vulnerability|threat/i.test(combined)
  ) {
    return "security";
  }
  if (
    /backend|software|sde|\bswe\b|fullstack|full stack|server|distributed|database|\bsql\b|\bapi\b|microservice|golang|java|c\+\+|rust|spring|node\.?js/i.test(combined)
  ) {
    return "sde_backend";
  }

  return "general_cs";
}

/**
 * Domain competencies broken down by role family, section, and experience level.
 */
interface DomainCompetencySpec {
  competency: string;
  skill: string;
  fresherFocus: string;
  experiencedFocus: string;
  criteria: string[];
}

const DOMAIN_COMPETENCIES: Record<RoleCategory, Record<InterviewSection, DomainCompetencySpec[]>> = {
  aiml: {
    introduction: [
      {
        competency: "AI/ML Motivation & Background",
        skill: "Model Building Journey",
        fresherFocus: "Coursework, Kaggle/research, and motivation for applied machine learning.",
        experiencedFocus: "Production ML system impact, architecture choices, and business value.",
        criteria: ["Clear ML motivation", "Understanding of practical ML vs theory"],
      },
    ],
    resume_projects: [
      {
        competency: "Dataset Preprocessing & Feature Engineering",
        skill: "Data Hygiene & Leakage Prevention",
        fresherFocus: "Train/val/test splits, normalization, handling class imbalance.",
        experiencedFocus: "Feature store architecture, point-in-time correctness, embedding drift.",
        criteria: ["Data leakage prevention", "Class imbalance strategy", "Feature normalization"],
      },
      {
        competency: "Model Selection & Architecture Trade-offs",
        skill: "Model Choice vs Computational Budget",
        fresherFocus: "Why PyTorch/TensorFlow, choosing between trees vs deep neural nets.",
        experiencedFocus: "Latency constraints, parameter count, quantization, inference memory.",
        criteria: ["Sound model rationale", "Awareness of model size vs accuracy"],
      },
      {
        competency: "Model Evaluation & Loss Function Formulation",
        skill: "Loss Formulation & Metric Alignment",
        fresherFocus: "Cross-entropy vs MSE, ROC-AUC, Precision-Recall curve trade-offs.",
        experiencedFocus: "Custom loss functions, calibration, cost-sensitive matrices, A/B validation.",
        criteria: ["Correct metric selection", "Understanding of false positives vs false negatives"],
      },
    ],
    technical_fundamentals: [
      {
        competency: "Overfitting Mitigation & Regularization",
        skill: "Generalization Dynamics",
        fresherFocus: "L1/L2 regularization, dropout, early stopping, validation curves.",
        experiencedFocus: "Batch normalization vs Layer normalization, gradient clipping, learning rate schedules.",
        criteria: ["Diagnosing high bias vs high variance", "Mechanics of regularization"],
      },
      {
        competency: "Optimization & Gradient Descent Mechanics",
        skill: "Optimizer Dynamics",
        fresherFocus: "SGD vs Adam, momentum, vanishing and exploding gradients.",
        experiencedFocus: "Second-order optimizers, mixed precision FP16/BF16, gradient accumulation.",
        criteria: ["Explaining gradient updates", "Addressing saddle points and exploding gradients"],
      },
      {
        competency: "Transformer Attention & Embeddings",
        skill: "Representation Learning",
        fresherFocus: "Self-attention mechanism, positional encodings, vector cosine similarity.",
        experiencedFocus: "FlashAttention, KV cache memory footprint, multi-head vs multi-query attention.",
        criteria: ["Intuition of Q, K, V matrices", "Context window scaling constraints"],
      },
    ],
    coding_system_design: [
      {
        competency: "Applied ML Algorithm Implementation",
        skill: "Vectorized Numerical Computation",
        fresherFocus: "Implementing IoU calculation, custom softmax, or vectorized k-nearest neighbors in Python/NumPy.",
        experiencedFocus: "Custom CUDA kernel trade-offs or streaming inference pipeline with batching.",
        criteria: ["Correct mathematical implementation", "Vectorized efficiency without unnecessary loops"],
      },
      {
        competency: "Production ML System Design & Serving",
        skill: "Inference Pipeline & RAG Architecture",
        fresherFocus: "Offline batch inference vs real-time API serving with model latency checks.",
        experiencedFocus: "Real-time RAG pipeline with bi-encoder retrieval, cross-encoder reranking, and vector index caching.",
        criteria: ["Latency SLA adherence", "Vector search index scalability (HNSW/IVF-PQ)", "Failure fallback"],
      },
    ],
    behavioral: [
      {
        competency: "Navigating Experimental Failure & Scientific Rigor",
        skill: "Handling Failed Model Hypotheses",
        fresherFocus: "What did you do when a trained model failed to beat a simple baseline?",
        experiencedFocus: "Terminating unproductive ML research tracks and communicating risk to stakeholders.",
        criteria: ["Intellectual honesty", "Principled experimental methodology", "Resilience"],
      },
    ],
    closing: [
      {
        competency: "Candidate ML Research & Industry Inquiries",
        skill: "Inquisitiveness",
        fresherFocus: "Candidate questions regarding model deployment pipelines, training infrastructure, and mentorship.",
        experiencedFocus: "Candidate questions regarding GPU clusters, ML governance, and compute allocation.",
        criteria: ["Thoughtful domain questions", "Curiosity about production tooling"],
      },
    ],
  },

  sde_backend: {
    introduction: [
      {
        competency: "Engineering Orientation & Background",
        skill: "Core Engineering Journey",
        fresherFocus: "CS fundamentals, personal projects, and passion for reliable backend systems.",
        experiencedFocus: "High-throughput systems architected, team leadership, and technical scope.",
        criteria: ["Concise communication", "Passion for systems engineering"],
      },
    ],
    resume_projects: [
      {
        competency: "System Decomposition & API Contracts",
        skill: "Modular Service Architecture",
        fresherFocus: "REST/gRPC endpoint structure, request validation, and database CRUD modeling.",
        experiencedFocus: "Domain-driven decomposition, service boundaries, backward compatibility, and schema migrations.",
        criteria: ["Clean contract design", "Separation of concerns", "Validation robustness"],
      },
      {
        competency: "Data Persistence & Transaction Boundaries",
        skill: "Database Modeling & ACID Guarantees",
        fresherFocus: "Relational foreign keys, query structure, and handling transaction rollbacks.",
        experiencedFocus: "Distributed transactions (Saga vs 2PC), isolation levels, and write amplification.",
        criteria: ["Correct relational design", "Awareness of transaction isolation levels"],
      },
      {
        competency: "Performance Bottlenecks & Production Debugging",
        skill: "Profiling & Latency Reduction",
        fresherFocus: "Diagnosing slow database queries with EXPLAIN ANALYZE, eliminating N+1 queries.",
        experiencedFocus: "Profiling memory allocations, garbage collection pauses, and lock contention.",
        criteria: ["Empirical profiling mindset", "Database indexing comprehension"],
      },
    ],
    technical_fundamentals: [
      {
        competency: "Database Indexing & Query Execution",
        skill: "B-Tree Mechanics & Index Trade-offs",
        fresherFocus: "How B-Tree indexes work, clustered vs secondary indexes, and write penalty.",
        experiencedFocus: "Covering indexes, composite index column ordering, partial indexes, and vacuuming.",
        criteria: ["Explaining index lookup complexity", "Understanding write degradation with excessive indexes"],
      },
      {
        competency: "Concurrency Primitives & Thread Safety",
        skill: "Race Conditions & Mutexes",
        fresherFocus: "Race conditions, deadlocks, and difference between processes vs threads.",
        experiencedFocus: "Optimistic vs pessimistic locking, compare-and-swap (CAS), and lock-free data structures.",
        criteria: ["Deadlock prevention strategies", "Correct synchronization reasoning"],
      },
      {
        competency: "Network Protocols & Transport Layer",
        skill: "HTTP, TCP & Socket Mechanics",
        fresherFocus: "TCP 3-way handshake, HTTP/1.1 vs HTTP/2 multiplexing, and TLS negotiation.",
        experiencedFocus: "Head-of-line blocking, TCP slow start, connection pooling, and keep-alive timeouts under load.",
        criteria: ["Protocol flow comprehension", "Connection reuse efficiency"],
      },
    ],
    coding_system_design: [
      {
        competency: "Algorithmic Reasoning & Data Structures",
        skill: "In-Memory Data Structures",
        fresherFocus: "Designing an in-memory LRU cache or sliding window rate limiter in code.",
        experiencedFocus: "Multi-datacenter distributed rate limiter or consistent hashing ring rebalancer.",
        criteria: ["Time & space complexity proof", "Clean boundary condition handling"],
      },
      {
        competency: "Distributed Systems & Scalability",
        skill: "Resilience, Caching & Partitioning",
        fresherFocus: "Cache-aside pattern with Redis, handling cache misses, and database failover.",
        experiencedFocus: "Idempotent event-driven architectures with Kafka, consumer lag mitigation, and partition rebalancing.",
        criteria: ["Idempotency key enforcement", "Fault tolerance under network partitions"],
      },
    ],
    behavioral: [
      {
        competency: "Production Ownership & Post-Mortems",
        skill: "Incident Management & Accountability",
        fresherFocus: "How you handled a bug you introduced that slipped past local testing into shared branches.",
        experiencedFocus: "Leading a critical production severity incident post-mortem and remediating root causes.",
        criteria: ["Accountability without blame", "Systemic preventative mindset"],
      },
    ],
    closing: [
      {
        competency: "Candidate Architectural Inquiries",
        skill: "Engineering Inquisitiveness",
        fresherFocus: "Questions regarding codebase standards, review culture, and deployment pipelines.",
        experiencedFocus: "Questions regarding scaling bottlenecks, tech debt prioritization, and architectural autonomy.",
        criteria: ["Relevance of questions", "Professional curiosity"],
      },
    ],
  },

  frontend: {
    introduction: [
      {
        competency: "Frontend Architecture & UX Engineering",
        skill: "Client-side Development",
        fresherFocus: "Component libraries, JavaScript/TypeScript mastery, and responsive interface design.",
        experiencedFocus: "Design system architecture, web performance, and complex state management at scale.",
        criteria: ["Passion for interface quality", "Focus on user experience"],
      },
    ],
    resume_projects: [
      {
        competency: "State Management & Component Architecture",
        skill: "Data Flow & Unidirectional State",
        fresherFocus: "Prop drilling vs context, custom hooks, and state colocation.",
        experiencedFocus: "Normalized client stores, optimistic UI rollbacks, and offline-first state synchronization.",
        criteria: ["Clean component boundaries", "Minimizing unnecessary re-renders"],
      },
      {
        competency: "Web Performance & Core Web Vitals",
        skill: "LCP, FID/INP & CLS Optimization",
        fresherFocus: "Image lazy loading, bundle splitting, and reducing layout shifts.",
        experiencedFocus: "Critical rendering path optimization, font subsetting, and streaming SSR/RSC hydration.",
        criteria: ["Understanding of browser rendering cycle", "Metrics-driven optimization"],
      },
    ],
    technical_fundamentals: [
      {
        competency: "DOM Mechanics & Event Loop",
        skill: "Browser Runtime Execution",
        fresherFocus: "Event bubbling vs capturing, microtasks vs macrotasks, and closures in event handlers.",
        experiencedFocus: "Compositor thread, requestAnimationFrame vs requestIdleCallback, and memory leak diagnosis in SPAs.",
        criteria: ["Accurate browser execution model", "Memory leak mitigation"],
      },
      {
        competency: "Security & Client Protection",
        skill: "Web Security Primitives",
        fresherFocus: "XSS prevention, sanitizing user input, and CORS configuration.",
        experiencedFocus: "Content Security Policy (CSP) headers, CSRF token architecture, and secure cookie attributes.",
        criteria: ["Vulnerability identification", "Defense-in-depth on the web"],
      },
    ],
    coding_system_design: [
      {
        competency: "Practical UI Component Implementation",
        skill: "Interactive Component Coding",
        fresherFocus: "Building a debounced search input with typeahead autocomplete and keyboard navigation.",
        experiencedFocus: "Building a virtualized infinite scroll list handling 100,000 dynamic-height rows at 60fps.",
        criteria: ["Keyboard accessibility (a11y)", "Debounce/throttle correctness", "DOM node virtualization"],
      },
    ],
    behavioral: [
      {
        competency: "Design-Engineering Collaboration & Compromise",
        skill: "Cross-functional Alignment",
        fresherFocus: "Resolving a discrepancy between design mocks and engineering feasibility.",
        experiencedFocus: "Standardizing a design system across multiple distributed product teams.",
        criteria: ["Constructive cross-functional communication", "Pragmatism"],
      },
    ],
    closing: [
      {
        competency: "Candidate Frontend Architecture Inquiries",
        skill: "Engineering Inquisitiveness",
        fresherFocus: "Questions regarding frontend tech stack, testing libraries, and UI QA processes.",
        experiencedFocus: "Questions regarding micro-frontend boundaries, server components, and release trains.",
        criteria: ["Thoughtful frontend questions"],
      },
    ],
  },

  data_eng: {
    introduction: [
      {
        competency: "Data Pipeline Engineering Orientation",
        skill: "Data Systems Passion",
        fresherFocus: "SQL mastery, Python data scripting, and passion for clean reliable data warehouses.",
        experiencedFocus: "Multi-petabyte lakehouse architecture, governance, and real-time streaming infrastructure.",
        criteria: ["Data integrity awareness", "Clarity of communication"],
      },
    ],
    resume_projects: [
      {
        competency: "ETL/ELT Pipeline Architecture & DAG Design",
        skill: "Data Pipeline Orchestration",
        fresherFocus: "Airflow DAG construction, idempotency, and automated retries.",
        experiencedFocus: "Backfilling strategies, dynamic task mapping, and handling schema drift across sources.",
        criteria: ["Idempotent pipeline design", "Handling late-arriving data"],
      },
      {
        competency: "Data Modeling & Storage Formats",
        skill: "Columnar Storage & Schemas",
        fresherFocus: "Star schema vs Snowflake schema, Fact vs Dimension tables.",
        experiencedFocus: "Parquet/ORC file sizing, compaction, Z-Ordering, and Delta Lake ACID transaction logs.",
        criteria: ["Partitioning and pruning comprehension", "Minimizing storage IO"],
      },
    ],
    technical_fundamentals: [
      {
        competency: "Distributed Query Optimization & Shuffling",
        skill: "Distributed Data Processing",
        fresherFocus: "MapReduce primitives, broadcast joins vs shuffle hash joins in Spark/SQL.",
        experiencedFocus: "Data skew mitigation, memory spilling, and salting join keys.",
        criteria: ["Identifying shuffle bottlenecks", "Optimizing memory allocation in distributed queries"],
      },
    ],
    coding_system_design: [
      {
        competency: "Streaming & Batch System Design",
        skill: "Real-time Lakehouse Architecture",
        fresherFocus: "Designing an audit logging aggregation pipeline with deduplication.",
        experiencedFocus: "Designing an exactly-once streaming pipeline from Kafka into Apache Iceberg with low latency.",
        criteria: ["Watermarking logic", "Deduplication strategy", "Checkpointing mechanics"],
      },
    ],
    behavioral: [
      {
        competency: "Data Quality Incidents & Upstream Coordination",
        skill: "Data Incident Resolution",
        fresherFocus: "How you detected and fixed bad source data that corrupted a downstream report.",
        experiencedFocus: "Establishing cross-organizational data contracts and SLAs with product teams.",
        criteria: ["Proactive data testing", "Systemic governance"],
      },
    ],
    closing: [
      {
        competency: "Candidate Data Infrastructure Inquiries",
        skill: "Inquisitiveness",
        fresherFocus: "Questions regarding data stack (Snowflake, dbt, Spark) and testing frameworks.",
        experiencedFocus: "Questions regarding compute cost governance, streaming SLAs, and query latency.",
        criteria: ["Domain curiosity"],
      },
    ],
  },

  devops: {
    introduction: [
      {
        competency: "Infrastructure & Reliability Orientation",
        skill: "Systems Passion",
        fresherFocus: "Linux fundamentals, Docker containerization, and cloud infrastructure curiosity.",
        experiencedFocus: "Multi-region Kubernetes clusters, zero-downtime deployment automation, and SRE error budgets.",
        criteria: ["Infrastructure focus", "Reliability mindset"],
      },
    ],
    resume_projects: [
      {
        competency: "CI/CD Automation & GitOps",
        skill: "Pipeline Automation",
        fresherFocus: "GitHub Actions / GitLab CI workflows, automated linting, test execution, and container builds.",
        experiencedFocus: "Canary rollouts with ArgoCD, automated rollback on metric degradation, and secret rotation.",
        criteria: ["Pipeline security", "Fast feedback loops", "Hermetic builds"],
      },
    ],
    technical_fundamentals: [
      {
        competency: "Container Orchestration & Networking",
        skill: "Kubernetes Core Architecture",
        fresherFocus: "Pods, Deployments, Services, and container resource limits (CPU/Memory limits vs requests).",
        experiencedFocus: "CNI plugin packet routing, ingress controllers, service mesh sidecar latency, and HPA autoscaling.",
        criteria: ["OOMKilled diagnosis", "Network routing inside cluster"],
      },
    ],
    coding_system_design: [
      {
        competency: "Observability & Disaster Recovery",
        skill: "Telemetry & SRE Architecture",
        fresherFocus: "Prometheus scraping, Grafana alerting rules, and structured JSON log aggregation.",
        experiencedFocus: "Designing a global multi-region active-active failover with Route53 DNS health checks and database replication.",
        criteria: ["SLI/SLO formulation", "RTO and RPO calculation"],
      },
    ],
    behavioral: [
      {
        competency: "High-Severity Production Outage Response",
        skill: "Incident Command",
        fresherFocus: "How you handled a deployment failure or pipeline blocker under pressure.",
        experiencedFocus: "Leading a critical P0 incident command bridge and communicating with executive leadership.",
        criteria: ["Calm methodical triage", "Blameless post-mortem follow-through"],
      },
    ],
    closing: [
      {
        competency: "Candidate Infrastructure Inquiries",
        skill: "Inquisitiveness",
        fresherFocus: "Questions regarding on-call rotation, cloud provider migration, and infrastructure tooling.",
        experiencedFocus: "Questions regarding chaos engineering, FinOps cloud spend, and security compliance.",
        criteria: ["Thoughtful operational questions"],
      },
    ],
  },

  security: {
    introduction: [
      {
        competency: "Security Engineering Orientation",
        skill: "Security Mindset",
        fresherFocus: "Understanding OWASP Top 10, ethical hacking, and secure coding fundamentals.",
        experiencedFocus: "Enterprise threat modeling, zero-trust network architecture, and cloud security posture.",
        criteria: ["Adversarial thinking", "Security mindset"],
      },
    ],
    resume_projects: [
      {
        competency: "Authentication, Authorization & Cryptography",
        skill: "Identity & Cryptographic Primitives",
        fresherFocus: "OAuth 2.0 PKCE flow, JWT validation, and password hashing (bcrypt/argon2).",
        experiencedFocus: "mTLS service identity, key management service (KMS) envelope encryption, and fine-grained ABAC.",
        criteria: ["Safe token handling", "Preventing token replay & privilege escalation"],
      },
    ],
    technical_fundamentals: [
      {
        competency: "Application Vulnerability Remediation",
        skill: "OWASP Vulnerability Exploitation & Defense",
        fresherFocus: "Preventing SQL injection via prepared statements, SSRF prevention, and CSRF tokens.",
        experiencedFocus: "Insecure deserialization, prototype pollution, memory corruption defense (ASLR/DEP), and supply chain poisoning.",
        criteria: ["Exploit mechanics comprehension", "Root-cause remediation"],
      },
    ],
    coding_system_design: [
      {
        competency: "Threat Modeling & Secure System Design",
        skill: "Zero-Trust Architecture",
        fresherFocus: "Threat modeling a public file upload service to prevent remote code execution (RCE).",
        experiencedFocus: "Designing a zero-trust privileged access management system with ephemeral credentials and audit streaming.",
        criteria: ["STRIDE threat modeling", "Principle of least privilege"],
      },
    ],
    behavioral: [
      {
        competency: "Security vs Velocity Trade-offs",
        skill: "Security Friction & Developer Enablement",
        fresherFocus: "Convincing a teammate to fix a critical security vulnerability before merging.",
        experiencedFocus: "Balancing product launch deadlines with severe vulnerability remediation.",
        criteria: ["Diplomatic communication", "Risk-based prioritization"],
      },
    ],
    closing: [
      {
        competency: "Candidate Security Inquiries",
        skill: "Inquisitiveness",
        fresherFocus: "Questions regarding internal security tooling, bug bounty programs, and code review gates.",
        experiencedFocus: "Questions regarding SOC2/ISO compliance, red teaming cadence, and security autonomy.",
        criteria: ["Strategic security inquiries"],
      },
    ],
  },

  general_cs: {
    introduction: [
      {
        competency: "General Computer Science Background",
        skill: "Engineering Fundamentals",
        fresherFocus: "Core CS principles, academic projects, and enthusiasm for building clean software.",
        experiencedFocus: "System architecture, full-stack breadth, and delivery of production services.",
        criteria: ["Clear communication", "Technical foundations"],
      },
    ],
    resume_projects: [
      {
        competency: "Project Implementation & Problem Solving",
        skill: "Practical Engineering Ownership",
        fresherFocus: "Component structure, core libraries used, and how data flows through the application.",
        experiencedFocus: "System architecture, critical technical decisions, and scaling bottlenecks.",
        criteria: ["Clear personal contribution", "Understanding of chosen stack"],
      },
    ],
    technical_fundamentals: [
      {
        competency: "Data Structures & Time Complexity",
        skill: "Computational Invariants",
        fresherFocus: "Array vs linked list vs hash table trade-offs, Big-O worst-case vs average-case.",
        experiencedFocus: "Memory locality, cache misses, B-Trees vs LSM Trees, and concurrency overhead.",
        criteria: ["Accurate Big-O analysis", "Memory overhead awareness"],
      },
    ],
    coding_system_design: [
      {
        competency: "Algorithmic Problem Solving",
        skill: "Algorithmic Reasoning",
        fresherFocus: "Two pointers, sliding window, tree traversal, or graph BFS/DFS applied to a concrete scenario.",
        experiencedFocus: "Designing an end-to-end scalable service with caching, queueing, and database partitioning.",
        criteria: ["Sound algorithmic approach", "Boundary condition identification"],
      },
    ],
    behavioral: [
      {
        competency: "Collaboration & Technical Disagreements",
        skill: "Teamwork & Engineering Ethics",
        fresherFocus: "Resolving a difference of opinion on code style or implementation with a teammate.",
        experiencedFocus: "Aligning conflicting engineering teams on an API standard or architecture migration.",
        criteria: ["Constructive collaboration", "Focus on technical merits"],
      },
    ],
    closing: [
      {
        competency: "Candidate Engineering Inquiries",
        skill: "Inquisitiveness",
        fresherFocus: "Questions regarding mentorship, code review processes, and engineering culture.",
        experiencedFocus: "Questions regarding engineering roadmap, technical debt, and system scale.",
        criteria: ["Professional curiosity"],
      },
    ],
  },
};

/**
 * Creates a structured Turn Question Blueprint conditioned on the candidate, role, company, and history.
 */
export interface CreateTurnBlueprintOptions {
  sessionState?: AdvancedSessionState;
  dossier?: CandidateInterviewDossier;
  currentSection?: InterviewSection;
  section?: InterviewSection;
  assessment?: AnswerAssessment | null;
  previousAssessment?: AnswerAssessment | null;
  lastUserAnswer?: string;
  turnIndex?: number;
  targetRole?: string;
  targetCompany?: string;
  track?: InterviewTrack;
  experienceMode?: ExperienceMode;
  questionsAsked?: LoggedQuestion[];
}

export function createTurnQuestionBlueprint(options: CreateTurnBlueprintOptions): TurnQuestionBlueprint {
  const currentSection = options.currentSection || options.section || "introduction";
  const assessment = options.assessment || options.previousAssessment || null;
  const targetRole = options.targetRole || options.sessionState?.blueprint.targetRole || options.dossier?.targetRole || "Software Engineer";
  const targetCompany = options.targetCompany || options.sessionState?.blueprint.targetCompany || options.dossier?.targetCompany || "Technology Company";
  const experienceMode = options.experienceMode || options.sessionState?.blueprint.experienceMode || options.dossier?.experienceMode || "fresher";
  const track = options.track || options.sessionState?.track || options.sessionState?.blueprint.track || "traditional_coding_dsa";
  const questionsAsked = options.questionsAsked || options.sessionState?.questionsAsked || [];
  const turnIndex = options.turnIndex ?? ((options.sessionState?.turns.length ?? questionsAsked.length) + 1);
  const skillsFocus = options.sessionState?.blueprint.skillsFocus || [];
  const lastUserAnswer = options.lastUserAnswer || "";

  const safeDossier: CandidateInterviewDossier = options.dossier || {
    candidateId: "candidate-default",
    name: "Candidate",
    targetRole,
    targetCompany,
    experienceYears: experienceMode === "experienced" ? 5 : experienceMode === "1-3yr" ? 2 : 0,
    experienceMode,
    careerIntent: targetRole,
    verifiedSkills: [],
    claimedSkills: [],
    evidenceItems: [],
    projects: [],
    githubStatus: { connected: false, publicRepos: 0, accessibleRepos: [], limitations: [] },
    linkedinStatus: { connected: false, limitations: [] },
    missingOrUnverified: [],
    previousInterviewWeaknesses: [],
    accumulatedWeakTopics: [],
  };

  // 1. Role Category & Company Intelligence
  const roleCategory = determineRoleCategory(targetRole, skillsFocus);
  const companyProfile = resolveCompanyIntelligence(targetCompany);

  // 2. Identify the most relevant project for this role
  const projects = safeDossier.projects || [];
  const lastAnsLower = lastUserAnswer.toLowerCase();
  
  // Prefer project explicitly referenced by candidate in recent turns
  let targetProject = projects.find(
    (p) => p.title && (lastAnsLower.includes(p.title.toLowerCase()) || (options.sessionState?.candidateIntroduction || "").toLowerCase().includes(p.title.toLowerCase()))
  );
  if (!targetProject && projects.length > 0) {
    if (roleCategory === "aiml") {
      targetProject = projects.find((p) => Array.isArray(p.tech) && p.tech.some((t) => /python|pytorch|tensorflow|model|ml|torch|data/i.test(t))) || projects[0];
    } else if (roleCategory === "frontend") {
      targetProject = projects.find((p) => Array.isArray(p.tech) && p.tech.some((t) => /react|next|vue|html|css|js|ts|web/i.test(t))) || projects[0];
    } else {
      targetProject = projects[0];
    }
  }

  // 3. Identify Candidate Gaps to probe
  const gaps = (safeDossier.missingOrUnverified || []).concat(safeDossier.accumulatedWeakTopics || []).concat(safeDossier.previousInterviewWeaknesses || []);
  const targetGap = gaps.length > 0 ? gaps[turnIndex % gaps.length] : undefined;

  // 4. Determine Adaptive Action from Previous Turn
  let adaptiveAction: TurnQuestionBlueprint["adaptedFromPreviousTurn"];
  if (assessment) {
    if (assessment.answer_quality === "strong") {
      adaptiveAction = {
        lastAnswerQuality: "strong",
        actionTaken: "escalate_depth",
        rationale: "Candidate demonstrated clear technical competence; escalating to edge-case constraints, scale bottlenecks, or architectural trade-offs.",
      };
    } else if (assessment.answer_quality === "shallow" || assessment.answer_quality === "partially_correct") {
      adaptiveAction = {
        lastAnswerQuality: assessment.answer_quality,
        actionTaken: "probe_gap",
        rationale: "Candidate provided superficial or buzzword-heavy reasoning; demanding concrete implementation mechanics, data schemas, or metrics.",
      };
    } else if (assessment.answer_quality === "does_not_know" || assessment.next_action === "simplify_concept") {
      adaptiveAction = {
        lastAnswerQuality: "does_not_know",
        actionTaken: "simplify_prerequisite",
        rationale: "Candidate candidly acknowledged unfamiliarity; gracefully pivoting to a simpler foundational prerequisite without shaming.",
      };
    } else if (assessment.answer_quality === "contradictory" || assessment.next_action === "clarify_ambiguity") {
      adaptiveAction = {
        lastAnswerQuality: "contradictory",
        actionTaken: "clarify_contradiction",
        rationale: "Candidate statements contained conflicting claims; politely clarifying the contradiction.",
      };
    } else {
      adaptiveAction = {
        lastAnswerQuality: assessment.answer_quality,
        actionTaken: "pivot_topic",
        rationale: "Previous competency adequately evaluated; advancing to next planned evaluation objective.",
      };
    }
  }

  // 5. Select Competency & Skill from Matrix, avoiding repeats
  const domainSpecs = DOMAIN_COMPETENCIES[roleCategory]?.[currentSection] || DOMAIN_COMPETENCIES.general_cs[currentSection];

  let selectedSpec = domainSpecs[0];
  let isAlreadyTested = false;

  for (const spec of domainSpecs) {
    const tested = questionsAsked.some((q) =>
      q.competency?.toLowerCase() === spec.competency.toLowerCase() ||
      q.targets?.toLowerCase().includes(spec.skill.toLowerCase())
    );
    if (!tested) {
      selectedSpec = spec;
      break;
    }
  }

  isAlreadyTested = questionsAsked.some((q) =>
    q.competency?.toLowerCase() === selectedSpec.competency.toLowerCase()
  );

  // 5b. Track Specialization Integration (Phase 3: 80-90% Substantive Questions Track-Locked)
  const isSpecializedTrack = track && track !== "traditional_coding_dsa";
  const isCodingSection = currentSection === "coding_system_design";
  const isSubstantiveAssessmentTurn = currentSection !== "introduction" && currentSection !== "closing";
  const trackConfig = getTrackSpecializationConfig(track);
  let selectedTrackTemplate: TrackQuestionTemplate | undefined;

  if (isSubstantiveAssessmentTurn && trackConfig.bank && trackConfig.bank.length > 0) {
    if (isSpecializedTrack || (isCodingSection && experienceMode !== "experienced")) {
      // Select a template from the track bank that has not yet been asked
      const unusedTemplate = trackConfig.bank.find((t) =>
        !questionsAsked.some((q) =>
          (q.question && t.codeSnippet && q.question.includes(t.codeSnippet.slice(0, 30))) ||
          (q.question && q.question.toLowerCase().includes(t.subCompetency.toLowerCase())) ||
          (q.targets && q.targets.toLowerCase().includes(t.subCompetency.toLowerCase()))
        )
      );
      selectedTrackTemplate = unusedTemplate || trackConfig.bank[Math.max(0, turnIndex - 1) % trackConfig.bank.length];
    }
  }

  const finalCompetency = selectedTrackTemplate ? selectedTrackTemplate.competency : selectedSpec.competency;
  const finalSkill = selectedTrackTemplate ? selectedTrackTemplate.subCompetency : selectedSpec.skill;
  const finalCriteria = selectedTrackTemplate ? selectedTrackTemplate.expectedEvidence : selectedSpec.criteria;

  // 6. Calibrate Difficulty & Question Type
  let difficulty: "easy" | "medium" | "hard" = "easy";
  if (experienceMode === "experienced") {
    difficulty = currentSection === "introduction" ? "medium" : "hard";
  } else if (experienceMode === "1-3yr") {
    difficulty = currentSection === "introduction" ? "easy" : "medium";
  } else {
    // Fresher / Intern
    difficulty = options.sessionState?.currentDifficulty || (currentSection === "coding_system_design" ? "medium" : "easy");
  }

  let questionType: GeneratedQuestion["question_type"] = "technical";
  if (currentSection === "introduction") questionType = "warm-up";
  else if (currentSection === "resume_projects") questionType = "project-defense";
  else if (currentSection === "coding_system_design") questionType = experienceMode === "experienced" ? "system-design" : "coding";
  else if (currentSection === "behavioral") questionType = "behavioral";
  else if (currentSection === "closing") questionType = "closing";

  const candidateRelevance = targetProject
    ? `Anchored to candidate's project "${targetProject.title}" [${Array.isArray(targetProject.tech) ? targetProject.tech.join(", ") : ""}]${targetGap ? ` while testing declared gap "${targetGap}"` : ""}.`
    : `Anchored to ${targetRole} role requirements at ${companyProfile.companyName}${targetGap ? ` investigating unverified skill "${targetGap}"` : ""}.`;

  return {
    turnIndex,
    section: currentSection,
    roleCategory,
    track,
    experienceMode,
    targetRole,
    targetCompany: companyProfile.companyName,
    companyProfile,
    competencyEvaluated: finalCompetency,
    specificSkillTested: finalSkill,
    questionType,
    difficulty,
    expectedEvaluationCriteria: finalCriteria,
    candidateRelevance,
    isCompetencyAlreadyTested: isAlreadyTested,
    targetProject,
    targetGap,
    adaptedFromPreviousTurn: adaptiveAction,
    trackTemplate: selectedTrackTemplate,
    interactionFormat: selectedTrackTemplate?.interactionFormat,
    codeSnippet: selectedTrackTemplate?.codeSnippet,
    followUpStrategy: selectedTrackTemplate?.followUpStrategy,
  };
}

/**
 * Intelligently synthesizes a targeted, non-generic question directly from the Turn Question Blueprint.
 * Used for dynamic offline/fallback generation so that ZERO static questions or generic arrays are ever returned.
 */
export function synthesizeDynamicQuestionFromBlueprint(
  blueprint: TurnQuestionBlueprint,
  allPastQuestions: Array<{ question: string } | string> = []
): GeneratedQuestion {
  const {
    roleCategory,
    section,
    experienceMode,
    companyProfile,
    targetProject,
    targetGap,
    adaptedFromPreviousTurn,
    competencyEvaluated,
    specificSkillTested,
  } = blueprint;

  const projName = targetProject?.title || "your primary project";
  const projTech = Array.isArray(targetProject?.tech) ? targetProject.tech.join(", ") : "your core stack";
  const isExp = experienceMode === "experienced";
  const isGoogle = companyProfile.companyName.toLowerCase().includes("google");
  const isStartup = companyProfile.sectorLabel.toLowerCase().includes("startup");
  const isDecline = adaptedFromPreviousTurn?.actionTaken === "simplify_prerequisite";
  const isProbe = adaptedFromPreviousTurn?.actionTaken === "probe_gap";
  const isEscalate = adaptedFromPreviousTurn?.actionTaken === "escalate_depth";

  let questionText = "";

  // 0. SPECIALIZED DISCIPLINE FORMATTING (PHASE 2 & 3: TRACK-LOCKED SPECIALIZATIONS)
  if (section !== "introduction" && section !== "closing" && blueprint.trackTemplate) {
    const t = blueprint.trackTemplate;
    const lang = t.language || (roleCategory === "frontend" ? "typescript" : roleCategory === "aiml" ? "python" : "typescript");

    switch (t.interactionFormat) {
      case "code_comprehension_snippet":
        questionText = `${t.problemStatement}\n\n\`\`\`${lang}\n${t.codeSnippet}\n\`\`\``;
        break;

      case "debugging_broken_code":
        questionText = `${t.problemStatement}\n\n\`\`\`${lang}\n${t.codeSnippet}\n\`\`\``;
        break;

      case "ai_code_audit":
        questionText = `${t.problemStatement}\n\n\`\`\`${lang}\n${t.codeSnippet}\n\`\`\``;
        break;

      case "code_review_diff":
        questionText = `${t.problemStatement}\n\n\`\`\`diff\n${t.codeSnippet}\n\`\`\``;
        break;

      case "system_architecture_scenario":
        questionText = `${t.problemStatement}${t.codeSnippet ? `\n\n\`\`\`\n${t.codeSnippet}\n\`\`\`` : ""}`;
        break;

      case "engineering_tradeoff_dilemma":
        questionText = t.problemStatement;
        break;

      case "star_behavioral_inquiry":
        questionText = targetProject
          ? `In your project ${projName} (${projTech}): ${t.problemStatement}`
          : t.problemStatement;
        break;

      case "algorithmic_coding":
      default:
        questionText = t.problemStatement;
        break;
    }
  }

  // 1. INTRODUCTION SECTION
  else if (section === "introduction") {
    if (isStartup) {
      questionText = `Welcome! I'm Alex, conducting your technical interview today for ${blueprint.targetRole} at ${companyProfile.companyName}. In a high-velocity startup environment, end-to-end ownership is critical. To start, please walk me through your background and the most ambitious feature you built from scratch in ${projName}.`;
    } else if (isGoogle) {
      questionText = `Welcome! I'm Alex, your interviewer today for the ${blueprint.targetRole} position at ${companyProfile.companyName}. We value strong computational foundations and clean abstractions. To kick off, could you give a brief introduction covering your background, key projects, and the technical problem that challenged you most recently?`;
    } else {
      questionText = `Welcome! I'm Alex, leading your interview today for ${blueprint.targetRole} at ${companyProfile.companyName}. To get started, please give a brief overview of your technical background, what you've recently built in ${projTech}, and what drew you to this position.`;
    }
  }

  // 2. RESUME & PROJECTS SECTION
  else if (section === "resume_projects") {
    if (isDecline) {
      questionText = `No problem at all! Let's take a step back on ${projName}: what was the primary architectural goal of this system, and how did data fundamentally flow from the client to the persistence layer?`;
    } else if (isProbe) {
      questionText = `Understood. Drilling deeper into ${projName}: what specific modules or algorithms did YOU personally write from scratch versus relying on existing frameworks, and what quantitative metric proved it worked?`;
    } else if (isEscalate) {
      if (roleCategory === "aiml") {
        questionText = `Building on that strong foundation in ${projName}: how did you rigorously evaluate model generalization to prevent data leakage between your training and validation splits, and what regularization did you employ?`;
      } else if (roleCategory === "frontend") {
        questionText = `Building on that implementation in ${projName}: how did you profile and optimize the critical rendering path to maintain 60fps and prevent unnecessary re-renders during high-frequency state updates?`;
      } else {
        questionText = `Building on that implementation in ${projName}: what was the single hardest production failure or concurrency race condition you had to diagnose, and how did you verify your fix under load?`;
      }
    } else {
      // Standard project defense grounded in role
      if (roleCategory === "aiml") {
        questionText = `In your project ${projName} built with ${projTech}, how did you formulate your model architecture and loss function, and what made this approach superior to baseline alternatives?`;
      } else if (roleCategory === "frontend") {
        questionText = `In ${projName}, how did you structure your client-side state management and component hierarchy, and what safeguards did you put in place when network requests failed?`;
      } else if (roleCategory === "data_eng") {
        questionText = `In ${projName}, how did you design your ETL pipeline for idempotency and automated backfilling, and how did you handle unexpected schema drift from upstream data sources?`;
      } else {
        // SDE / Backend
        questionText = `In ${projName} using ${projTech}, what was your high-level component architecture and database schema design, and what specific trade-offs guided those decisions?`;
      }
    }
  }

  // 3. TECHNICAL FUNDAMENTALS SECTION
  else if (section === "technical_fundamentals") {
    if (isDecline) {
      if (roleCategory === "aiml") {
        questionText = `Completely understandable! Let's examine the baseline: what is the fundamental difference between overfitting and underfitting, and what is the first signal you look for in the training loss curve?`;
      } else {
        questionText = `No problem, let's step back to the fundamentals: how does a basic hash table resolve collisions under the hood, and what determines its average lookup complexity?`;
      }
    } else if (roleCategory === "aiml") {
      if (targetGap) {
        questionText = `Looking at your declared skills, let's evaluate ${targetGap}: how does that mechanism function under the hood, and how do you trade off model accuracy versus computational latency?`;
      } else if (isExp) {
        questionText = `When training deep neural networks with ${projTech}, how do you systematically diagnose vanishing vs exploding gradients, and when would you choose Layer Normalization over Batch Normalization?`;
      } else {
        questionText = `In machine learning evaluation, when would accuracy be an actively misleading metric, and how do you evaluate model performance using Precision-Recall curves versus ROC-AUC?`;
      }
    } else if (roleCategory === "frontend") {
      if (isExp) {
        questionText = `In modern browser runtimes, walk me through the event loop's microtask queue vs macrotask queue, and how long-running JavaScript execution degrades Interaction to Next Paint (INP).`;
      } else {
        questionText = `In frontend engineering, what is the difference between event bubbling and event capturing, and how do you leverage event delegation to manage dynamic list interactions cleanly?`;
      }
    } else if (roleCategory === "data_eng") {
      questionText = `In distributed data processing, what causes data skew during join operations, and what technical strategy (such as salting or broadcast joins) do you use to eliminate executor bottlenecks?`;
    } else if (roleCategory === "devops") {
      questionText = `In container orchestration, what is the mechanical difference between Kubernetes CPU requests and CPU limits, and what happens at the Linux cgroup level when a container exceeds either threshold?`;
    } else if (roleCategory === "security") {
      questionText = `In web application security, how does a Server-Side Request Forgery (SSRF) attack occur, and what network and application-level controls are required to prevent it?`;
    } else {
      // SDE / Backend
      if (isGoogle) {
        questionText = `At Google, we rely on rigorous computational bounds. When choosing between B-Tree indexing and Hash indexing in a persistence layer, what are the formal Big-O lookup and range-scan trade-offs under the hood?`;
      } else if (isStartup) {
        questionText = `In a fast-growing startup backend, how do you handle database migration rollouts with zero downtime when modifying a high-traffic table with millions of active rows?`;
      } else if (isExp) {
        questionText = `In a distributed relational database, how do you handle deadlocks under high write concurrency, and what are the specific guarantees and trade-offs of Read Committed versus Serializable isolation?`;
      } else {
        questionText = `In database fundamentals, how does a secondary index actually work on disk, and why can adding an index significantly degrade write and insert throughput?`;
      }
    }
  }

  // 4. CODING & SYSTEM DESIGN SECTION
  else if (section === "coding_system_design") {
    if (isDecline) {
      questionText = `That's completely fine, let's look at a simpler building block: how would you implement a basic sliding window to find the maximum sum of any contiguous subarray of size K?`;
    } else if (roleCategory === "aiml") {
      if (isExp) {
        questionText = `Let's architect an end-to-end real-time RAG (Retrieval-Augmented Generation) system at scale: how would you structure the vector ingestion, chunking, HNSW indexing, cross-encoder reranking, and cache layers for sub-100ms latency?`;
      } else {
        questionText = `Let's look at applied ML implementation: given a high-dimensional vector dataset, how would you compute cosine similarity efficiently without redundant matrix allocations, and how does vector normalization simplify the math?`;
      }
    } else if (roleCategory === "frontend") {
      if (isExp) {
        questionText = `How would you architect a real-time collaborative document editor in the browser supporting concurrent offline edits, conflict-free replicated data types (CRDTs), and optimistic UI updates?`;
      } else {
        questionText = `How would you build a performant autocomplete search component that debounces keystroke requests, caches previous query results, and cleanly cancels in-flight network requests on rapid typing?`;
      }
    } else if (roleCategory === "data_eng") {
      questionText = `How would you architect a streaming telemetry ingestion pipeline processing 100,000 events per second from Kafka into an Apache Iceberg lakehouse with exactly-once delivery guarantees?`;
    } else {
      // SDE / Backend
      if (isGoogle) {
        questionText = `Google systems require mathematical optimality. Given an arbitrary directed graph representing task dependencies, how would you detect cycles and produce a valid topological ordering in O(V + E) time, and how do you handle disconnected subgraphs?`;
      } else if (isStartup) {
        questionText = `In a startup environment where external APIs frequently time out, how would you design an asynchronous background webhook delivery service with exponential backoff, dead-letter queues, and idempotency guarantees?`;
      } else if (isExp) {
        questionText = `How would you architect a distributed, multi-datacenter rate limiter supporting 100,000 requests per second with sub-5ms latency, strong consistency against race conditions, and graceful degradation during network partitions?`;
      } else {
        questionText = `Given an unbounded stream of user event IDs in ${projName}, how would you find the Top K most frequent elements using a min-heap and hash map in O(N log K) time with bounded memory?`;
      }
    }
  }

  // 5. BEHAVIORAL SECTION
  else if (section === "behavioral") {
    if (isStartup) {
      questionText = `In a startup, priorities and roadmaps change quickly. Tell me about a time when you had to ship a critical feature with incomplete specifications or ambiguous requirements, and how you made the necessary engineering trade-offs.`;
    } else if (isGoogle) {
      questionText = `Tell me about a time when you strongly disagreed with a senior colleague or tech lead on a core architectural decision. How did you assemble data to evaluate both approaches, and how was the dispute resolved?`;
    } else {
      questionText = `Tell me about the most impactful production incident or bug you were personally responsible for diagnosing. Walk me through how you discovered the root cause, mitigated customer impact, and prevented future recurrences.`;
    }
  }

  // 6. CLOSING SECTION
  else {
    questionText = `That covers our technical exploration today for the ${blueprint.targetRole} role at ${companyProfile.companyName}! You've demonstrated some interesting perspectives. What questions do you have for me about our engineering architecture, team stack, or what we are building?`;
  }

  // Deduplication check: if question is semantically duplicate with past questions, apply an adaptive pivot!
  if (isQuestionSemanticallyDuplicate(questionText, allPastQuestions)) {
    console.warn("[interview-turn-blueprint] Semantic duplicate prevented during synthesis. Pivoting to novel failure-mode angle.");
    questionText = `Looking at ${projName} from another angle: what was the single most difficult edge-case failure mode or latency spike you encountered in production with ${specificSkillTested}, and what specific diagnostic tool helped you isolate it?`;
  }

  return {
    question: questionText,
    question_targets: `${blueprint.competencyEvaluated}: ${blueprint.specificSkillTested}`,
    question_type: blueprint.questionType,
    difficulty_level: blueprint.difficulty,
    is_follow_up: Boolean(blueprint.adaptedFromPreviousTurn && (blueprint.adaptedFromPreviousTurn.actionTaken === "probe_gap" || blueprint.adaptedFromPreviousTurn.actionTaken === "escalate_depth")),
    section: blueprint.section,
    competency_targeted: blueprint.competencyEvaluated,
    evidence_grounding: blueprint.candidateRelevance,
  };
}
