import { StudentDNA } from "@/lib/ai/student-dna";
import { supabase } from "@/lib/supabase";

export interface ProblemStatement {
  id: string;
  opportunity_id: string;
  opportunity_title?: string;
  title: string;
  domain: string;
  sub_domain: string;
  required_skills: string[];
  fundamental_skills: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Hard";
  real_world_problem: string;
  suggested_tech_stack: string[];
  core_features: string[];
  future_scope: string[];
  embedding?: number[];
  global_views_count?: number;
}

export type PSInteractionType = "shown" | "viewed" | "saved" | "rejected" | "applied" | "selected";

export interface PSInteraction {
  id?: string;
  student_id: string;
  ps_id: string;
  interaction_type: PSInteractionType;
  created_at: string;
}

export interface PSRecommendationResult {
  ps: ProblemStatement;
  deterministic_score: number;
  retrieval_similarity: number;
  dimension_scores: {
    skill_fit: number;
    experience_fit: number;
    interest_alignment: number;
    career_goal_alignment: number;
    difficulty_fit: number;
  };
  penalty_applied: number;
  why_you: string;
}

// ── 1536-Dimensional Deterministic Semantic Vector Generator ──
/**
 * Generates a normalized 1536-dimensional semantic feature vector.
 * Maps n-grams, technical keywords, and domain concepts into fixed dimensional buckets.
 * Automatically normalized to unit length so dot product == cosine similarity.
 */
export function generateSemanticVector(text: string, dimensions: number = 1536): number[] {
  const vec = new Array(dimensions).fill(0);
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = clean.split(/\s+/).filter(t => t.length > 1);

  if (tokens.length === 0) return vec;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    // Simple hash function for token mapping
    let h = 2166136261;
    for (let c = 0; c < token.length; c++) {
      h ^= token.charCodeAt(c);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    const idx = Math.abs(h) % dimensions;
    vec[idx] += 1.0;

    // Bigrams for phrasing
    if (i < tokens.length - 1) {
      const bigram = `${token}_${tokens[i + 1]}`;
      let bh = 2166136261;
      for (let bc = 0; bc < bigram.length; bc++) {
        bh ^= bigram.charCodeAt(bc);
        bh += (bh << 1) + (bh << 4) + (bh << 7) + (bh << 8) + (bh << 24);
      }
      const bIdx = Math.abs(bh) % dimensions;
      vec[bIdx] += 1.5;
    }
  }

  // Normalize to unit vector
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dot));
}

// ── Initial Curated Problem Statements KB ──
export const INITIAL_PROBLEM_STATEMENTS: ProblemStatement[] = [
  {
    id: "ps-flipkart-concurrency-locking",
    opportunity_id: "opp-flipkart-grid",
    opportunity_title: "Flipkart GRiD 7.0 — Software Development Track",
    title: "High-Concurrency Flash Sale Inventory Locking & Settlement Engine",
    domain: "Distributed Systems & Cloud",
    sub_domain: "High-Throughput Transactions",
    required_skills: ["Java", "Distributed Systems", "Kafka", "PostgreSQL", "Redis"],
    fundamental_skills: ["Concurrency", "ACID", "Two-Phase Commit", "Data Structures"],
    difficulty: "Hard",
    real_world_problem: "During flash sales exceeding 50,000 orders/second, standard pessimistic database locks cause severe connection pooling timeouts and cascading latency spikes. The system must prevent inventory overselling while guaranteeing sub-50ms SLA without distributed deadlock.",
    suggested_tech_stack: ["Java", "Spring Boot", "Redis", "Kafka", "PostgreSQL"],
    core_features: ["Distributed Leases with Auto-Tombstones", "Two-Phase Idempotent Reservation", "Deadlock-Free Partitioned Queues"],
    future_scope: ["Cross-region geo-replicated consensus", "Zero-downtime ledger compaction"],
    global_views_count: 12
  },
  {
    id: "ps-sih-supply-chain-fraud",
    opportunity_id: "opp-sih-2026",
    opportunity_title: "Smart India Hackathon 2026 — Ministry of Electronics & IT",
    title: "Autonomous Counterfeit Drug Traceability via Cryptographic Provenance",
    domain: "Fintech & Web3",
    sub_domain: "Supply Chain & Cryptography",
    required_skills: ["Solidity", "TypeScript", "Node.js", "PostgreSQL", "Next.js"],
    fundamental_skills: ["Cryptography", "Merkle Trees", "REST APIs", "SQL"],
    difficulty: "Advanced",
    real_world_problem: "Over 20% of counterfeit pharmaceuticals enter rural distribution networks due to compromised paper invoices and unverified distributor handoffs. The system must enable tamper-proof barcode verification with offline zero-knowledge proofs for rural pharmacists.",
    suggested_tech_stack: ["Ethereum", "Solidity", "TypeScript", "Next.js", "PostgreSQL"],
    core_features: ["Batch Merkle Tree Proofs", "Offline QR Verification", "Regulatory Compliance Audit Trail"],
    future_scope: ["Sensor-driven temperature cold-chain alerts", "Decentralized identity for verified suppliers"],
    global_views_count: 8
  },
  {
    id: "ps-google-cloud-genai-observability",
    opportunity_id: "opp-google-cloud-hack",
    opportunity_title: "Google Cloud Community Day — GenAI Hackathon",
    title: "Real-Time Multi-Agent Telemetry & Drift Observability Pipeline",
    domain: "AI/ML",
    sub_domain: "LLMOps & Monitoring",
    required_skills: ["Python", "PyTorch", "FastAPI", "Docker", "Next.js"],
    fundamental_skills: ["Machine Learning", "Embeddings", "Vector Databases", "REST APIs"],
    difficulty: "Advanced",
    real_world_problem: "Multi-agent autonomous systems frequently enter hallucination loops or suffer from prompt injection and embedding distribution drift in production without triggering standard HTTP error codes.",
    suggested_tech_stack: ["Python", "FastAPI", "Qdrant", "Docker", "React"],
    core_features: ["Semantic Token Drift Detector", "Multi-Agent Message Graph Visualizer", "Automated Guardrail Circuit Breaker"],
    future_scope: ["On-device lightweight anomaly inference", "Automated synthetic regression dataset generation"],
    global_views_count: 14
  },
  {
    id: "ps-ethindia-micro-payments",
    opportunity_id: "opp-ethindia-2026",
    opportunity_title: "ETHIndia 2026 — Asia's Largest Ethereum Hackathon",
    title: "Zero-Gas Streaming Micro-Payments for Decentralized AI Inference API",
    domain: "Fintech & Web3",
    sub_domain: "State Channels & Payments",
    required_skills: ["Solidity", "TypeScript", "React", "Node.js", "Web3.js"],
    fundamental_skills: ["State Channels", "Elliptic Curve Math", "Frontend State"],
    difficulty: "Hard",
    real_world_problem: "Paying for individual LLM token calls on-chain is cost-prohibitive due to base layer transaction fees. The platform requires off-chain state channel payment vouchers signed per request with deterministic batch settlement.",
    suggested_tech_stack: ["Solidity", "Foundry", "TypeScript", "React", "Next.js"],
    core_features: ["EIP-712 Signed Vouchers", "Unilateral Dispute Settlement Contract", "Sub-10ms Inference Paywall Gateway"],
    future_scope: ["Multi-token collateral backing", "Cross-chain liquidity bridge"],
    global_views_count: 5
  },
  {
    id: "ps-flipkart-recommendation-graph",
    opportunity_id: "opp-flipkart-grid",
    opportunity_title: "Flipkart GRiD 7.0 — Software Development Track",
    title: "Real-Time User Session Graph Neural Network for Cold-Start Discovery",
    domain: "AI/ML",
    sub_domain: "Graph Neural Networks",
    required_skills: ["Python", "PyTorch", "Algorithms", "PostgreSQL", "FastAPI"],
    fundamental_skills: ["Linear Algebra", "Graph Theory", "Data Structures"],
    difficulty: "Hard",
    real_world_problem: "First-time visitors on e-commerce storefronts have no historical purchasing profile. Traditional collaborative filtering fails completely under cold-start conditions.",
    suggested_tech_stack: ["PyTorch Geometric", "Python", "FastAPI", "Redis", "Docker"],
    core_features: ["In-Session Click Sequence Graph Builder", "Sub-20ms Embedding Inference", "Cold-Start Feature Attribution"],
    future_scope: ["Dynamic edge-weighting with temporal decay", "Explainable recommendation cards"],
    global_views_count: 6
  },
  {
    id: "ps-aws-edge-iot-telemetry",
    opportunity_id: "opp-aws-serverless",
    opportunity_title: "AWS Global Serverless Hackathon 2026",
    title: "Sub-Second Industrial Vibration Telemetry & Predictive Failure Engine",
    domain: "Distributed Systems & Cloud",
    sub_domain: "IoT Edge & Time-Series",
    required_skills: ["Python", "Docker", "PostgreSQL", "Algorithms", "React"],
    fundamental_skills: ["Time-Series Math", "WebSockets", "Data Pipelines"],
    difficulty: "Intermediate",
    real_world_problem: "Factory equipment turbines produce 10,000 accelerometer ticks/second. Transmitting all raw data to cloud instances saturates industrial satellite bandwidth.",
    suggested_tech_stack: ["Python", "MQTT", "TimescaleDB", "FastAPI", "React"],
    core_features: ["Edge FFT Anomaly Thresholding", "Adaptive Bandwidth Throttling", "Real-Time 60fps Telemetry Dashboard"],
    future_scope: ["LoRaWAN fallback routing", "Fleet-wide predictive maintenance calendar"],
    global_views_count: 4
  }
];

// In-memory Problem Statements store (pre-embedded)
const inMemoryPSList: ProblemStatement[] = INITIAL_PROBLEM_STATEMENTS.map(ps => {
  const embeddingText = `${ps.title} ${ps.domain} ${ps.sub_domain} ${ps.required_skills.join(" ")} ${ps.fundamental_skills.join(" ")} ${ps.real_world_problem}`;
  return {
    ...ps,
    embedding: generateSemanticVector(embeddingText)
  };
});

// In-memory student interactions store
// Map: student_id -> Map: ps_id -> PSInteractionType[]
const inMemoryInteractions: Map<string, Map<string, PSInteractionType[]>> = new Map();

/**
 * Records an interaction for a student on a PS
 */
export function recordPSInteraction(
  studentId: string,
  psId: string,
  interactionType: PSInteractionType
): void {
  let studentMap = inMemoryInteractions.get(studentId);
  if (!studentMap) {
    studentMap = new Map();
    inMemoryInteractions.set(studentId, studentMap);
  }

  const list = studentMap.get(psId) || [];
  list.push(interactionType);
  studentMap.set(psId, list);

  // Increment global views if shown/viewed
  if (interactionType === "shown" || interactionType === "viewed") {
    const ps = inMemoryPSList.find(p => p.id === psId);
    if (ps) {
      ps.global_views_count = (ps.global_views_count || 0) + 1;
    }
  }
}

/**
 * Retrieves all interactions for a student
 */
export function getStudentInteractions(studentId: string): Map<string, PSInteractionType[]> {
  return inMemoryInteractions.get(studentId) || new Map();
}

/**
 * Retrieval + Ranking Pipeline (Hybrid Architecture)
 * 1. Vector similarity search narrows candidate set (cheap, fast)
 * 2. Deterministic scoring across dimensions
 * 3. Interaction penalties (applied/selected -> excluded; rejected -> -40; shown -> -10)
 * 4. Saturation penalty
 * 5. Grounded Why YOU explanation
 */
export function recommendProblemStatements(
  dna: StudentDNA,
  options: { topK?: number; retrievalShortlistSize?: number } = {}
): { recommendations: PSRecommendationResult[]; candidatePoolSize: number; shortlistedCount: number } {
  const topK = options.topK || 5;
  const shortlistSize = options.retrievalShortlistSize || 10;
  const candidatePoolSize = inMemoryPSList.length;

  // 1. Generate query embedding from Student DNA
  const studentSkillsText = dna.skills.map(s => `${s.name} (${s.level})`).join(" ");
  const studentProjectsText = dna.projects.map(p => `${p.title}: ${p.tech_stack.join(" ")} ${p.domain}`).join(" ");
  const studentRolesText = dna.target_roles.join(" ");
  const studentQuery = `${dna.profile_summary} Skills: ${studentSkillsText} Projects: ${studentProjectsText} Roles: ${studentRolesText}`;
  const queryEmbedding = generateSemanticVector(studentQuery);

  // 2. Vector Similarity Search (Retrieval Layer)
  const candidateShortlist = inMemoryPSList
    .map(ps => ({
      ps,
      similarity: cosineSimilarity(queryEmbedding, ps.embedding || generateSemanticVector(ps.title))
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, shortlistSize);

  const shortlistedCount = candidateShortlist.length;
  const studentInteractions = getStudentInteractions(dna.candidate_id);

  // 3. Deterministic Scoring Layer
  const scoredResults: PSRecommendationResult[] = [];

  for (const item of candidateShortlist) {
    const { ps, similarity } = item;
    const pastActions = studentInteractions.get(ps.id) || [];

    // Rule: applied/selected -> EXCLUDE ENTIRELY
    if (pastActions.includes("applied") || pastActions.includes("selected")) {
      continue;
    }

    // Dimension 1: Skill Fit (with proficiency weights)
    let achievedSkillWeight = 0;
    const matchedSkills: string[] = [];
    for (const req of ps.required_skills) {
      const lower = req.toLowerCase();
      const dnaSkill = dna.skills.find(s => s.name.toLowerCase() === lower || lower.includes(s.name.toLowerCase()));
      if (dnaSkill) {
        achievedSkillWeight += dnaSkill.proficiency_weight;
        matchedSkills.push(`${dnaSkill.name} (${dnaSkill.level}${dnaSkill.verified_on_github ? " + verified GitHub" : ""})`);
      }
    }
    const maxPossibleSkillWeight = Math.max(1, ps.required_skills.length) * 1.2;
    const skill_fit = Math.min(100, Math.round((achievedSkillWeight / maxPossibleSkillWeight) * 100));

    // Dimension 2: Experience Fit
    const domainProjects = dna.projects.filter(p => p.domain === ps.domain);
    const experience_fit = Math.min(95, Math.max(30, 30 + domainProjects.length * 25));

    // Dimension 3: Interest Alignment
    const hasDomainOverlap = dna.target_domains.includes(ps.domain);
    const interest_alignment = hasDomainOverlap ? 90 : 50;

    // Dimension 4: Career Goal Alignment
    const targetRolesLower = dna.target_roles.map(r => r.toLowerCase());
    const isRoleAligned = targetRolesLower.some(r => ps.domain.toLowerCase().includes(r) || r.includes(ps.domain.toLowerCase()) || r.includes("engineer") || r.includes("developer"));
    const career_goal_alignment = isRoleAligned ? 88 : 55;

    // Dimension 5: Difficulty Fit
    let difficulty_fit = 70;
    const expertCount = dna.skills.filter(s => s.level === "Advanced" || s.level === "Expert").length;
    if (ps.difficulty === "Hard") difficulty_fit = expertCount >= 3 ? 95 : 60;
    else if (ps.difficulty === "Advanced") difficulty_fit = expertCount >= 2 ? 90 : 70;
    else difficulty_fit = 85;

    // Raw composite deterministic score
    let baseScore = (
      skill_fit * 0.35 +
      experience_fit * 0.25 +
      interest_alignment * 0.20 +
      career_goal_alignment * 0.10 +
      difficulty_fit * 0.10
    );

    // 4. Penalties
    let penalty = 0;
    if (pastActions.includes("rejected")) {
      penalty += 40; // Strong penalty
    }
    if (pastActions.includes("shown") || pastActions.includes("viewed")) {
      penalty += 10; // Moderate penalty for repeated impression
    }

    // Global saturation penalty
    const views = ps.global_views_count || 0;
    if (views > 10) {
      const satPenalty = Math.min(10, Math.floor((views - 10) * 1.5));
      penalty += satPenalty;
    }

    const finalDeterministicScore = Math.max(10, Math.round(baseScore - penalty));

    // 5. Grounded "Why YOU" explanation
    const whyParts: string[] = [];
    if (matchedSkills.length > 0) {
      whyParts.push(`Key skill coverage: ${matchedSkills.slice(0, 2).join(", ")}`);
    }
    if (domainProjects.length > 0) {
      whyParts.push(`${domainProjects.length} proven project in ${ps.domain} (${domainProjects[0].title})`);
    }
    if (hasDomainOverlap) {
      whyParts.push(`Matches stated interest in ${ps.domain}`);
    }
    const why_you = whyParts.length > 0
      ? whyParts.join(" | ")
      : `Solid engineering foundation matching ${ps.title}.`;

    scoredResults.push({
      ps,
      deterministic_score: finalDeterministicScore,
      retrieval_similarity: Math.round(similarity * 100),
      dimension_scores: {
        skill_fit,
        experience_fit,
        interest_alignment,
        career_goal_alignment,
        difficulty_fit
      },
      penalty_applied: penalty,
      why_you
    });
  }

  // Sort by final deterministic score descending
  scoredResults.sort((a, b) => b.deterministic_score - a.deterministic_score);

  return {
    recommendations: scoredResults.slice(0, topK),
    candidatePoolSize,
    shortlistedCount
  };
}

/**
 * Lookup a specific Problem Statement by ID
 */
export function getProblemStatementById(id: string): ProblemStatement | undefined {
  return inMemoryPSList.find(p => p.id === id);
}

/**
 * Returns all problem statements
 */
export function getAllProblemStatements(): ProblemStatement[] {
  return [...inMemoryPSList];
}
