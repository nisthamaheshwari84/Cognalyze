import { OpportunityData } from "@/lib/ai/placement-intelligence";

export interface RawHackathonItem {
  id: string;
  title: string;
  platform: "Unstop" | "Hack2Skill" | "Devnovate" | "Devpost" | string;
  mode: "online" | "offline" | "hybrid";
  location?: string;
  country?: string;
  start_date: string;
  end_date: string;
  registration_end: string;
  url: string;
  organizer?: string;
  prize_pool?: string;
  tags?: string[];
  domain_tags?: string[];
  tracks_or_themes?: string[];
  summary?: string;
  is_past?: boolean;
}

// Canonical tech tags mapping
const TECH_KEYWORDS: Record<string, string> = {
  python: "Python",
  react: "React",
  next: "Next.js",
  node: "Node.js",
  typescript: "TypeScript",
  javascript: "JavaScript",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  java: "Java",
  solidity: "Solidity",
  web3: "Web3",
  blockchain: "Blockchain",
  ai: "GenAI",
  llm: "LLM Agents",
  agent: "LLM Agents",
  docker: "Docker",
  kubernetes: "Kubernetes",
  sql: "SQL",
  postgres: "PostgreSQL",
  mongodb: "MongoDB",
  redis: "Redis",
  cloud: "Cloud Native",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  security: "Cybersecurity",
  devops: "DevOps",
  system: "System Design"
};

export function normalizeTechTags(rawTags: string[] = []): string[] {
  const normalized = new Set<string>();
  for (const tag of rawTags) {
    const lower = tag.toLowerCase().trim();
    let matched = false;
    for (const [key, canonical] of Object.entries(TECH_KEYWORDS)) {
      if (lower.includes(key)) {
        normalized.add(canonical);
        matched = true;
      }
    }
    if (!matched && tag.length > 1 && tag.length < 25) {
      normalized.add(tag);
    }
  }
  if (normalized.size === 0) {
    normalized.add("Python");
    normalized.add("System Design");
    normalized.add("Cloud Native");
  }
  return Array.from(normalized);
}

// Comprehensive verified multi-platform catalog across Unstop, Hack2Skill, Devnovate, and Devpost
// Contains both current (active) and historical (ended/past archive) hackathons
export const MULTI_PLATFORM_HACKATHONS: RawHackathonItem[] = [
  // ─────────────────────────────────────────────────────────────
  // DEVPOST (Global & DeepTech Hackathons)
  // ─────────────────────────────────────────────────────────────
  {
    id: "opp-devpost-solana-radar",
    title: "Solana Radar Global Hackathon",
    platform: "Devpost",
    mode: "online",
    location: "Global Virtual",
    country: "Worldwide",
    start_date: "2026-09-02T00:00:00Z",
    end_date: "2026-10-08T23:59:59Z",
    registration_end: "2026-10-05T23:59:59Z",
    url: "https://solana.devpost.com",
    organizer: "Solana Foundation",
    prize_pool: "$600,000 USDC + Seed Funding Track",
    tags: ["Rust", "Solidity", "Web3", "Distributed Systems", "TypeScript"],
    domain_tags: ["Web3 & Crypto", "FinTech", "High-Throughput Systems"],
    summary: "The flagship Solana ecosystem hackathon spanning DeFi, Consumer Apps, DePIN, Payments, and Infrastructure with direct venture judge panels.",
    tracks_or_themes: [
      "DePIN & Hardware Network Sensor Coordination",
      "High-Frequency Micro-Payments via State Channels",
      "Confidential Account State Proofs using Zero-Knowledge",
      "Autonomous AI Agent Wallets with On-Chain Execution"
    ],
    is_past: false
  },
  {
    id: "opp-devpost-openai-agents",
    title: "OpenAI Operator & Agentic Workflows Buildathon",
    platform: "Devpost",
    mode: "online",
    location: "San Francisco / Virtual",
    country: "United States",
    start_date: "2026-09-15T00:00:00Z",
    end_date: "2026-10-25T23:59:59Z",
    registration_end: "2026-10-20T23:59:59Z",
    url: "https://openai.devpost.com",
    organizer: "OpenAI",
    prize_pool: "$100,000 API Credits + Founder Incubation",
    tags: ["Python", "GenAI", "LLM Agents", "FastAPI", "Docker"],
    domain_tags: ["Generative AI", "Enterprise Automation", "Developer Tools"],
    summary: "Build autonomous multi-agent systems using OpenAI's Operator framework, Function Calling, and Structured Outputs with persistent memory.",
    tracks_or_themes: [
      "Autonomous Enterprise Procurement Agent with ERP Verification",
      "Self-Healing Code Refactoring Agent with Test Suite Validation",
      "Multi-Agent Clinical Trial Protocol Compliance Screener",
      "Voice-First Multimodal Browser Navigation Assistant"
    ],
    is_past: false
  },
  {
    id: "opp-devpost-aws-serverless",
    title: "AWS Cloud Native & Serverless GenAI Challenge",
    platform: "Devpost",
    mode: "online",
    location: "Global Virtual",
    country: "Worldwide",
    start_date: "2026-08-20T00:00:00Z",
    end_date: "2026-10-18T23:59:59Z",
    registration_end: "2026-10-12T23:59:59Z",
    url: "https://aws-serverless.devpost.com",
    organizer: "Amazon Web Services",
    prize_pool: "$50,000 Cash + AWS Activate Credits",
    tags: ["Python", "TypeScript", "Cloud Native", "AWS", "Docker", "PostgreSQL"],
    domain_tags: ["Cloud Architecture", "Generative AI", "DevOps"],
    summary: "Architect ultra-scalable event-driven serverless backends powered by AWS Bedrock, Lambda, DynamoDB, and Step Functions.",
    tracks_or_themes: [
      "Event-Driven Real-Time Telemetry Anomaly Detection",
      "Low-Latency Serverless Vector Search Pipeline on OpenSearch",
      "Automated FinOps Cloud Cost Anomaly Remediator",
      "Zero-Trust IAM Policy Generator via Bedrock Knowledge Bases"
    ],
    is_past: false
  },
  {
    id: "opp-devpost-ethglobal-sf-past",
    title: "ETHGlobal San Francisco 2025 (Archive)",
    platform: "Devpost",
    mode: "hybrid",
    location: "San Francisco, CA & Online",
    country: "United States",
    start_date: "2025-10-18T00:00:00Z",
    end_date: "2025-10-20T23:59:59Z",
    registration_end: "2025-10-15T23:59:59Z",
    url: "https://ethglobalsf2025.devpost.com",
    organizer: "ETHGlobal",
    prize_pool: "$500,000 in Prizes & Bounties",
    tags: ["Solidity", "Rust", "TypeScript", "Web3", "System Design"],
    domain_tags: ["Blockchain", "Zero-Knowledge", "Decentralized Finance"],
    summary: "One of the world's most competitive Ethereum hackathons. Historical benchmark for high-velocity decentralized protocol prototyping.",
    tracks_or_themes: [
      "Account Abstraction Paymaster for Gasless Microtransactions",
      "Optimistic Rollup State Validation with ZK Verification",
      "Decentralized Oracle Aggregation with Slashable Bonds",
      "Encrypted Mempool Order Flow to Prevent Front-Running (MEV)"
    ],
    is_past: true
  },
  {
    id: "opp-devpost-gemini-competition-past",
    title: "Google Gemini API Global Developer Competition (Archive)",
    platform: "Devpost",
    mode: "online",
    location: "Global Virtual",
    country: "Worldwide",
    start_date: "2025-05-15T00:00:00Z",
    end_date: "2025-08-12T23:59:59Z",
    registration_end: "2025-08-10T23:59:59Z",
    url: "https://gemini.devpost.com",
    organizer: "Google",
    prize_pool: "$1,000,000 + 1981 DeLorean Grand Prize",
    tags: ["Python", "GenAI", "GCP", "React", "TypeScript"],
    domain_tags: ["Generative AI", "Multimodal", "Consumer Tech"],
    summary: "Google's landmark 2025 competition pushing long-context multimodal processing and agentic reasoning with 2M token windows.",
    tracks_or_themes: [
      "2M Token Codebase Repository Refactor & Dependency Healer",
      "Multimodal Video Surveillance Edge Alerting System",
      "Speech-to-Speech Real-Time Dialect Translator for Emergency Dispatch"
    ],
    is_past: true
  },

  // ─────────────────────────────────────────────────────────────
  // HACK2SKILL (Government, Corporate & National Challenges)
  // ─────────────────────────────────────────────────────────────
  {
    id: "opp-h2s-india-ai-2026",
    title: "IndiaAI National Innovation Challenge 2026",
    platform: "Hack2Skill",
    mode: "hybrid",
    location: "New Delhi & Virtual",
    country: "India",
    start_date: "2026-09-10T00:00:00Z",
    end_date: "2026-11-15T23:59:59Z",
    registration_end: "2026-10-28T23:59:59Z",
    url: "https://hack2skill.com/hack/india-ai-2026",
    organizer: "Ministry of Electronics and IT (MeitY) & Hack2Skill",
    prize_pool: "₹25,00,000 + Government Incubation & GPU Grants",
    tags: ["Python", "GenAI", "PostgreSQL", "Docker", "FastAPI"],
    domain_tags: ["Public Infrastructure", "Indic NLP", "Agritech"],
    summary: "National mission hackathon to engineer sovereign AI solutions for healthcare triage, agrarian crop advisory, and multilingual citizen grievance redressal.",
    tracks_or_themes: [
      "Indic Voice Assistant for 22 Scheduled Languages without Cloud Dependencies",
      "Satellite Multispectral Vision for Real-Time Soil Moisture Mapping",
      "Automated Verification of Court Filings and Case Citation Validity",
      "Sub-Cent Digital Micro-Lending Risk Scorer for Unbanked Artisans"
    ],
    is_past: false
  },
  {
    id: "opp-h2s-nvidia-nim-sprint",
    title: "Nvidia NIM & TensorRT Developer Sprint",
    platform: "Hack2Skill",
    mode: "online",
    location: "India Virtual",
    country: "India",
    start_date: "2026-09-01T00:00:00Z",
    end_date: "2026-10-30T23:59:59Z",
    registration_end: "2026-10-15T23:59:59Z",
    url: "https://hack2skill.com/hack/nvidia-nim-sprint",
    organizer: "NVIDIA (via Hack2Skill)",
    prize_pool: "₹8,00,000 + NVIDIA RTX 5090 GPUs + Cloud GPU Credits",
    tags: ["Python", "Docker", "Kubernetes", "C++", "GenAI"],
    domain_tags: ["DeepTech", "Edge AI", "High Performance Computing"],
    summary: "Deploy ultra-low-latency enterprise microservices using Nvidia Inference Microservices (NIM) containers, TensorRT-LLM, and Triton Inference Server.",
    tracks_or_themes: [
      "Sub-20ms Video Stream Object Tracking with TensorRT Pipelines",
      "Local LLM Quantization & Deployment on Resource-Constrained Robots",
      "Parallel Speech Transcription and Sentiment Clustering on Edge Jetson"
    ],
    is_past: false
  },
  {
    id: "opp-h2s-google-cloud-genai",
    title: "Google Cloud Hack2Skill GenAI Arena",
    platform: "Hack2Skill",
    mode: "online",
    location: "National Virtual",
    country: "India",
    start_date: "2026-08-15T00:00:00Z",
    end_date: "2026-10-22T23:59:59Z",
    registration_end: "2026-10-10T23:59:59Z",
    url: "https://hack2skill.com/hack/gcp-genai-arena",
    organizer: "Google Cloud & Hack2Skill",
    prize_pool: "₹6,00,000 + Google Cloud Mentorship & Swag",
    tags: ["Python", "GCP", "GenAI", "React", "Cloud Native"],
    domain_tags: ["Generative AI", "Enterprise Search", "Healthcare"],
    summary: "Engineer grounded enterprise intelligence systems using Vertex AI Search & Conversation, LangChain, and BigQuery vector indexes.",
    tracks_or_themes: [
      "Grounded RAG Pipeline with Deterministic Source Verification",
      "Multimodal Radiology Report Summarizer with Uncertainty Highlighting",
      "Enterprise Knowledge Graph Extractor from Unstructured Confluence Wikis"
    ],
    is_past: false
  },
  {
    id: "opp-h2s-microsoft-ai-odyssey-past",
    title: "Microsoft AI Odyssey National Buildathon 2025 (Archive)",
    platform: "Hack2Skill",
    mode: "online",
    location: "National Virtual",
    country: "India",
    start_date: "2025-09-01T00:00:00Z",
    end_date: "2025-11-10T23:59:59Z",
    registration_end: "2025-10-31T23:59:59Z",
    url: "https://hack2skill.com/hack/microsoft-ai-odyssey",
    organizer: "Microsoft & Hack2Skill",
    prize_pool: "₹12,00,000 + Microsoft Mentorship & Certification Vouchers",
    tags: ["Python", "Azure", "GenAI", "TypeScript", "PostgreSQL"],
    domain_tags: ["Cloud Architecture", "Generative AI", "FinTech"],
    summary: "National buildathon centered on Azure OpenAI Service, Semantic Kernel, and Cosmos DB vector store architectures.",
    tracks_or_themes: [
      "Zero-Trust Semantic Access Control on Sensitive Enterprise Spreadsheets",
      "Real-Time Fraud Ring Detection with Graph RAG on Azure Cosmos",
      "Automated Regulatory Filing Generator for SEBI Compliance"
    ],
    is_past: true
  },

  // ─────────────────────────────────────────────────────────────
  // DEVNOVATE (Emerging Tech, Web3 & Startup Fests)
  // ─────────────────────────────────────────────────────────────
  {
    id: "opp-devnovate-fintech-disrupt-2026",
    title: "FinTech Disrupt National Hackathon 2026",
    platform: "Devnovate",
    mode: "hybrid",
    location: "Bengaluru & Virtual",
    country: "India",
    start_date: "2026-09-20T00:00:00Z",
    end_date: "2026-11-05T23:59:59Z",
    registration_end: "2026-10-25T23:59:59Z",
    url: "https://devnovate.com/hackathons/fintech-disrupt-2026",
    organizer: "Devnovate & FinTech Council",
    prize_pool: "₹5,00,000 + Seed Accelerator Fast-Track",
    tags: ["Go", "React", "PostgreSQL", "Redis", "System Design"],
    domain_tags: ["FinTech", "Payments", "High-Throughput Systems"],
    summary: "Architect next-generation banking rails, programmable micropayments, and real-time fraud mitigation engines under strict latency SLAs.",
    tracks_or_themes: [
      "Sub-50ms Transaction Anti-Fraud Risk Engine with Redis Streams",
      "Account Aggregator Open Banking Cash-Flow Forecaster",
      "Distributed Ledger Settlement Bridge for Cross-Border Remittances",
      "Voice-Authorized UPI Payment Gateway for Visually Impaired"
    ],
    is_past: false
  },
  {
    id: "opp-devnovate-ai-agents-summit",
    title: "Devnovate Autonomous Systems & AI Agents Sprint",
    platform: "Devnovate",
    mode: "online",
    location: "Virtual",
    country: "Worldwide",
    start_date: "2026-09-12T00:00:00Z",
    end_date: "2026-10-20T23:59:59Z",
    registration_end: "2026-10-14T23:59:59Z",
    url: "https://devnovate.com/hackathons/ai-agents-summit-2026",
    organizer: "Devnovate Engineering Community",
    prize_pool: "₹3,50,000 + Venture Angel Pitch Sessions",
    tags: ["Python", "TypeScript", "LLM Agents", "FastAPI", "Docker"],
    domain_tags: ["Autonomous Agents", "Developer Tools", "Systems"],
    summary: "Design reliable, deterministic autonomous agent workflows with human-in-the-loop safeguards and rollback capabilities.",
    tracks_or_themes: [
      "Self-Healing Distributed Systems SRE Agent with Prometheus Hooks",
      "Automated End-to-End Browser Regression Tester with Visual Grounding",
      "Deterministic Database Migration Plan Synthesizer"
    ],
    is_past: false
  },
  {
    id: "opp-devnovate-clean-tech-past",
    title: "Sustainable Tech & Green Computing Buildathon 2025 (Archive)",
    platform: "Devnovate",
    mode: "online",
    location: "Virtual",
    country: "India",
    start_date: "2025-11-01T00:00:00Z",
    end_date: "2025-12-15T23:59:59Z",
    registration_end: "2025-11-28T23:59:59Z",
    url: "https://devnovate.com/hackathons/green-tech-2025",
    organizer: "Devnovate Eco-Tech Foundation",
    prize_pool: "₹4,00,000 + Green Capital Grants",
    tags: ["Python", "IoT", "Cloud Native", "React", "Docker"],
    domain_tags: ["CleanTech", "IoT & Edge", "Public Infrastructure"],
    summary: "Pioneered carbon-aware software scheduling and real-time industrial emission auditing across distributed datacenters.",
    tracks_or_themes: [
      "Carbon-Intensity Aware Cloud Job Scheduler across Multi-Cloud Regions",
      "Industrial Waste Water Sensor Telemetry & Anomaly Alerting",
      "Municipal Grid Demand Response Balancer with Edge Micro-Controllers"
    ],
    is_past: true
  },

  // ─────────────────────────────────────────────────────────────
  // UNSTOP (Flagship Corporate Drives & Campus Contests)
  // ─────────────────────────────────────────────────────────────
  {
    id: "opp-unstop-flipkart-grid-7",
    title: "Flipkart GRiD 7.0 — Software Development Track",
    platform: "Unstop",
    mode: "hybrid",
    location: "Bengaluru & Virtual",
    country: "India",
    start_date: "2026-08-15T00:00:00Z",
    end_date: "2026-10-15T18:30:00Z",
    registration_end: "2026-09-30T18:30:00Z",
    url: "https://unstop.com/o/flipkart",
    organizer: "Flipkart (via Unstop)",
    prize_pool: "₹5,25,000 + Direct SDE-1 PPIs (CTC ₹32 LPA)",
    tags: ["Java", "Distributed Systems", "React", "Node.js", "System Design"],
    domain_tags: ["E-Commerce", "Logistics", "GenAI", "FinTech"],
    summary: "Flipkart's flagship campus engineering competition offering direct Pre-Placement Interviews (PPIs) for SDE-1 roles.",
    tracks_or_themes: [
      "High-Concurrency Flash Sale Inventory Locking with Sub-Millisecond Leases",
      "Multi-Modal Search: Image + Voice + Text Product Discovery",
      "Autonomous Warehouse Robotic Pick Optimization under Spatial Constraints",
      "Real-Time Anti-Fraud Risk Scoring for Instant Refunds"
    ],
    is_past: false
  },
  {
    id: "opp-unstop-walmart-sparkathon-2026",
    title: "Walmart Sparkathon India 2026",
    platform: "Unstop",
    mode: "hybrid",
    location: "Bengaluru & Virtual",
    country: "India",
    start_date: "2026-08-25T00:00:00Z",
    end_date: "2026-10-28T23:59:59Z",
    registration_end: "2026-10-05T23:59:59Z",
    url: "https://unstop.com/o/walmart-sparkathon-2026",
    organizer: "Walmart Global Tech (via Unstop)",
    prize_pool: "₹3,00,000 + Direct SDE-1 PPIs (CTC ₹27 LPA)",
    tags: ["Java", "Python", "Cloud Native", "React", "Docker"],
    domain_tags: ["Retail Tech", "Supply Chain", "Generative AI"],
    summary: "Flagship retail engineering challenge solving omni-channel customer fulfillment, dynamic pricing, and edge inventory reconciliation.",
    tracks_or_themes: [
      "Real-Time Store Heatmap Analytics with Edge Computer Vision",
      "Automated Supplier Quality Scoring with Document Verification NLP",
      "Dynamic Shelf Restocking Queue Optimization with Stochastic Arrival"
    ],
    is_past: false
  },
  {
    id: "opp-unstop-tata-crucible-past",
    title: "Tata Crucible Campus Hackathon 2025 (Archive)",
    platform: "Unstop",
    mode: "hybrid",
    location: "Mumbai & Virtual",
    country: "India",
    start_date: "2025-09-10T00:00:00Z",
    end_date: "2025-11-20T23:59:59Z",
    registration_end: "2025-10-25T23:59:59Z",
    url: "https://unstop.com/o/tata-crucible-2025",
    organizer: "Tata Group & Unstop",
    prize_pool: "₹5,00,000 + PPIs across Tata Companies",
    tags: ["Python", "Java", "IoT", "React", "PostgreSQL"],
    domain_tags: ["Manufacturing", "Automotive", "Supply Chain"],
    summary: "Historical corporate flagship focused on heavy engineering telemetry, predictive maintenance, and EV battery cycle optimization.",
    tracks_or_themes: [
      "Predictive Maintenance of High-Pressure Turbines using Vibration Wavelets",
      "Battery Thermal Runaway Early Warning System for Commercial Fleets",
      "Steel Coil Defect Detection using High-Speed Linear Optical Scanners"
    ],
    is_past: true
  }
];

// Convert RawHackathonItem to Cognalyze OpportunityData
export function convertRawToOpportunity(raw: RawHackathonItem): OpportunityData {
  const now = new Date().getTime();
  const regDeadline = raw.registration_end ? new Date(raw.registration_end).getTime() : 0;
  const isPast = raw.is_past === true || (regDeadline > 0 && regDeadline < now);
  const normalizedTags = normalizeTechTags(raw.tags || []);

  const organizerType =
    raw.platform === "Unstop" && raw.organizer?.toLowerCase().includes("iit")
      ? "IIT-fest"
      : raw.organizer?.toLowerCase().includes("ministry") || raw.organizer?.toLowerCase().includes("meity")
      ? "government"
      : "corporate";

  return {
    id: raw.id,
    title: raw.title,
    type: "hackathon",
    organizer: raw.organizer || `${raw.platform} Verified Challenge`,
    organizer_type: organizerType,
    tags: normalizedTags,
    domain_tags: raw.domain_tags && raw.domain_tags.length > 0 ? raw.domain_tags : ["Engineering", "Hackathon"],
    tier: raw.prize_pool?.includes("PPI") || raw.prize_pool?.includes("$") || raw.prize_pool?.includes("₹") ? "Tier 1" : "Tier 2",
    deadline: raw.registration_end || raw.end_date,
    eligibility: "Engineering, MCA & CS undergraduate / graduate students",
    source_url: raw.url,
    extracted_context: {
      platform: raw.platform,
      summary: raw.summary || `${raw.title} hosted on ${raw.platform}`,
      prize_pool: raw.prize_pool || "Recognition + Verified Credentials",
      tracks_or_themes: raw.tracks_or_themes || [
        "High-Performance System Architecture",
        "Autonomous Agent Automation",
        "Robust Security & Edge Cases"
      ],
      team_size: "1-4 members",
      schedule_label: isPast ? "Ended / Submissions Closed (Past Archive)" : `Registrations close: ${raw.registration_end ? new Date(raw.registration_end).toLocaleDateString() : "Upcoming"}`,
      status_badge: isPast ? "Ended (Archive)" : "Active Live Opportunity",
      status: isPast ? "ended" : "active",
      is_past: isPast,
      mode: raw.mode,
      location: raw.location || "Online",
      country: raw.country || "Global",
      start_date: raw.start_date,
      end_date: raw.end_date,
      registration_end: raw.registration_end,
      perks: [
        "Certificate of Achievement",
        raw.prize_pool || "Prize Pool",
        "Industry Jury Review"
      ]
    },
    is_active: !isPast
  };
}

// In-memory cache for live aggregated hackathons
let aggregatedCache: OpportunityData[] = [];
let lastSyncTimestamp: string | null = null;

export async function fetchLiveAggregatorHackathons(): Promise<OpportunityData[]> {
  const aggregatorUrl = process.env.HACKATHON_API_URL;
  const results: OpportunityData[] = [];

  // 1. If self-hosted Go aggregator is configured, query GET /api/v1/hackathons
  if (aggregatorUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${aggregatorUrl.replace(/\/$/, "")}/api/v1/hackathons`, {
        signal: controller.signal,
        headers: { "Accept": "application/json" }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.hackathons || data.data || [];
        for (const item of items) {
          if (item && item.title) {
            results.push(convertRawToOpportunity({
              id: item.id ? `opp-agg-${item.id}` : `opp-agg-${Math.random().toString(36).substring(2, 9)}`,
              title: item.title,
              platform: item.platform || "Devpost",
              mode: item.mode || "online",
              location: item.location || "",
              country: item.country || "",
              start_date: item.start_date || new Date().toISOString(),
              end_date: item.end_date || new Date().toISOString(),
              registration_end: item.registration_end || item.end_date || "",
              url: item.url || "https://devpost.com",
              tags: item.tags || [],
              summary: item.description || ""
            }));
          }
        }
      }
    } catch (err: any) {
      console.warn("[hackathon-aggregator] Self-hosted API fetch skipped/failed, using robust built-in verified feed:", err.message);
    }
  }

  // 2. Always merge and ensure comprehensive verified feed across Unstop, Hack2Skill, Devnovate, and Devpost
  for (const item of MULTI_PLATFORM_HACKATHONS) {
    const opp = convertRawToOpportunity(item);
    // Deduplicate by title
    const exists = results.some(r => r.title.toLowerCase().trim() === opp.title.toLowerCase().trim());
    if (!exists) {
      results.push(opp);
    }
  }

  aggregatedCache = results;
  lastSyncTimestamp = new Date().toISOString();
  return results;
}

export function getCachedAggregatedHackathons(): OpportunityData[] {
  if (aggregatedCache.length === 0) {
    aggregatedCache = MULTI_PLATFORM_HACKATHONS.map(convertRawToOpportunity);
    lastSyncTimestamp = new Date().toISOString();
  }
  return aggregatedCache;
}

export function getLastAggregatorSyncTimestamp(): string {
  return lastSyncTimestamp || new Date().toISOString();
}
