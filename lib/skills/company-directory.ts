/**
 * lib/skills/company-directory.ts
 * 
 * Comprehensive Company Directory for Cognalyze.
 * 
 * Covers 65+ companies across 4 core market sectors:
 * 1. Global Technology & Product (Tier 1 & FAANG+)
 * 2. India-Based Technology & High-Growth Product
 * 3. Enterprise IT Services & Strategy Consulting
 * 4. Finance, FinTech & Quantitative Trading
 * 
 * Sourced Data Statuses:
 * - "questions_available": Verified sourced question bank available (>= 10 problems)
 * - "limited_sourced": Initial curated question subset available (3-9 problems)
 * - "awaiting_data": Company catalogued; historical interview data ingestion in progress
 * - "validation_pending": Community-contributed questions awaiting expert verification
 */

export type CompanySector = 
  | "global_tech" 
  | "india_product" 
  | "it_services" 
  | "finance_quant";

export type CompanyDataStatus = 
  | "questions_available" 
  | "limited_sourced" 
  | "awaiting_data" 
  | "validation_pending";

export interface CompanyDirectoryEntry {
  id: string;
  name: string;
  slug: string;
  sector: CompanySector;
  sectorLabel: string;
  status: CompanyDataStatus;
  statusLabel: string;
  badge: string;
  icon: string;
  accentColor: string;
  headquarters: string;
  primaryRoles: string[];
  assessmentFormat: {
    oaDurationMinutes: number;
    oaQuestionCount: number;
    interviewRounds: number;
    coreTopics: string[];
    description: string;
  };
  knownInterviewStages: string[];
  sourceAttribution?: string;
  verifiedQuestionCount?: number;
}

export const COMPANY_DIRECTORY: CompanyDirectoryEntry[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // 1. GLOBAL TECHNOLOGY & PRODUCT (TIER 1 & FAANG+)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "comp-google",
    name: "Google",
    slug: "google",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Algorithms, Invariants & Graph Traversals",
    icon: "🌐",
    accentColor: "#4285F4",
    headquarters: "Mountain View, CA",
    primaryRoles: ["Software Engineer (L3/L4)", "AI/ML Engineer", "Site Reliability Engineer", "SWE Intern"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Binary Search on Answers", "Graphs & Shortest Paths", "Dynamic Programming", "Sliding Window"],
      description: "Google technical interviews focus on rigorous algorithm optimality, mathematical bounds, and edge cases."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "technical_round_2", "hiring_manager"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-amazon",
    name: "Amazon",
    slug: "amazon",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Scale, Two Pointers & Arrays",
    icon: "📦",
    accentColor: "#FF9900",
    headquarters: "Seattle, WA",
    primaryRoles: ["SDE-1", "SDE-2", "Software Development Engineer Intern"],
    assessmentFormat: {
      oaDurationMinutes: 70,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Arrays & Hash Maps", "Two Pointers & Sliding Window", "Trees & Graphs", "Dynamic Programming"],
      description: "Amazon Online Assessments (OA) test data structure selection and 16 Leadership Principles."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "technical_round_2", "bar_raiser"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-microsoft",
    name: "Microsoft",
    slug: "microsoft",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Strings, Linked Lists & CS Fundamentals",
    icon: "🪟",
    accentColor: "#00A4EF",
    headquarters: "Redmond, WA",
    primaryRoles: ["Software Engineer", "Cloud Solutions Architect", "Support Engineer", "SWE Intern"],
    assessmentFormat: {
      oaDurationMinutes: 70,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["String Parsing", "Linked Lists & BSTs", "Operating Systems", "DBMS Indexing"],
      description: "Microsoft assesses algorithmic problem solving, clean code readability, and systems fundamentals."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "technical_round_2", "hiring_manager"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-meta",
    name: "Meta",
    slug: "meta",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Speed, Trees & Graph Frontiers",
    icon: "♾️",
    accentColor: "#0668E1",
    headquarters: "Menlo Park, CA",
    primaryRoles: ["Software Engineer (E4/E5)", "Data Scientist", "Production Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 45,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Tree Traversals", "Graph BFS/DFS", "Sliding Window", "Heap Priority Queues"],
      description: "Meta values rapid coding velocity (2 medium problems in 45 minutes) with bug-free code."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2", "system_design", "behavioral"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-apple",
    name: "Apple",
    slug: "apple",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Systems Programming & Memory Invariants",
    icon: "🍎",
    accentColor: "#A2AAAD",
    headquarters: "Cupertino, CA",
    primaryRoles: ["Software Engineer", "iOS Systems Engineer", "Embedded Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Pointers & Memory", "Trees & Recursion", "Bit Manipulation", "Concurrency"],
      description: "Apple interview loops emphasize hardware-software boundary understanding, memory efficiency, and clean code."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2", "system_design"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-netflix",
    name: "Netflix",
    slug: "netflix",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "High Throughput & Resilient Architecture",
    icon: "🍿",
    accentColor: "#E50914",
    headquarters: "Los Gatos, CA",
    primaryRoles: ["Senior Software Engineer", "ML Platform Engineer", "Data Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Distributed Systems", "Sliding Window & Heaps", "Dynamic Bandits", "Resilience Patterns"],
      description: "Netflix hires predominantly senior talent; coding rounds test clean design and operational failure recovery."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2", "system_architecture"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-adobe",
    name: "Adobe",
    slug: "adobe",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Graphics, Matrix Maths & String Algorithms",
    icon: "🅰️",
    accentColor: "#FF0000",
    headquarters: "San Jose, CA",
    primaryRoles: ["Member of Technical Staff", "Full Stack Engineer", "Computer Vision Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["2D Matrices & Geometry", "Dynamic Programming", "Tries & String Matching", "Tree Traversals"],
      description: "Adobe HackerRank tests cover advanced arrays, 2D grid dynamic programming, and string matching."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "technical_round_2"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-uber",
    name: "Uber",
    slug: "uber",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Geospatial Graphs & Dynamic Dispatch",
    icon: "🚗",
    accentColor: "#000000",
    headquarters: "San Francisco, CA",
    primaryRoles: ["Software Engineer 1", "Software Engineer 2", "Data Scientist"],
    assessmentFormat: {
      oaDurationMinutes: 70,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["Graphs & Shortest Paths", "Priority Queues / Heaps", "Interval Scheduling", "Dynamic Pricing"],
      description: "Uber coding tests heavily feature shortest-path algorithms, spatial hashing, and interval overlaps."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "technical_round_2", "system_design"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-airbnb",
    name: "Airbnb",
    slug: "airbnb",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Intervals, Pagination & Search Ranking",
    icon: "🏡",
    accentColor: "#FF5A5F",
    headquarters: "San Francisco, CA",
    primaryRoles: ["Software Engineer", "Backend Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Interval Overlaps", "Trie Autocomplete", "Search Ranking", "Two Pointers"],
      description: "Airbnb tests real-world business logic: calendar bookings, overlapping reservations, and CSV parsing."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2", "culture_interview"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-salesforce",
    name: "Salesforce",
    slug: "salesforce",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Multi-Tenant Queues & Tree Indexes",
    icon: "☁️",
    accentColor: "#00A1E0",
    headquarters: "San Francisco, CA",
    primaryRoles: ["MTS (Member of Technical Staff)", "Lead Software Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Multi-Tenant Data Structures", "Trees & Graphs", "LRU Cache", "Sorting"],
      description: "Salesforce OA on HackerRank evaluates queue processing, graph coloring, and tree recursion."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "technical_round_2"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-nvidia",
    name: "NVIDIA",
    slug: "nvidia",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Parallel Algorithms & Matrix Mathematics",
    icon: "🟢",
    accentColor: "#76B900",
    headquarters: "Santa Clara, CA",
    primaryRoles: ["System Software Engineer", "Deep Learning Software Engineer", "CUDA Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["Bit Manipulation", "Matrix Multiplication", "Memory Coalescing", "Parallel Reductions"],
      description: "NVIDIA tests algorithmic efficiency, low-level bit operations, and cache locality."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2", "architecture_round"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-bloomberg",
    name: "Bloomberg",
    slug: "bloomberg",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Low-Latency Queues & Financial Data Streams",
    icon: "📈",
    accentColor: "#2800D7",
    headquarters: "New York, NY",
    primaryRoles: ["Software Engineer", "Financial Software Developer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Heaps & Priority Queues", "LRU Cache", "String Parsing", "Two Pointers"],
      description: "Bloomberg frequently asks problems modeling financial tickers, moving averages, and order books."
    },
    knownInterviewStages: ["technical_phone_screen", "technical_round_1", "technical_round_2"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-oracle",
    name: "Oracle",
    slug: "oracle",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "B-Trees, Sorting & Database Internals",
    icon: "🔴",
    accentColor: "#F80000",
    headquarters: "Austin, TX",
    primaryRoles: ["Software Engineer", "Cloud Infrastructure Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 75,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["B-Tree & Binary Tree Traversals", "Sorting Algorithms", "SQL Optimization", "Hash Maps"],
      description: "Oracle evaluates data structure fundamentals, transactional consistency, and storage structures."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "technical_round_2"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-cisco",
    name: "Cisco",
    slug: "cisco",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Routing Trees, Graphs & Bit Masking",
    icon: "🌐",
    accentColor: "#1BA0D7",
    headquarters: "San Jose, CA",
    primaryRoles: ["Software Engineer", "Network Embedded Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Graph Routing / Dijkstra", "Bit Manipulation / IP Subnetting", "String Matching", "Queues"],
      description: "Cisco tests network graph models, bitwise operations, and memory bounds."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-intel",
    name: "Intel",
    slug: "intel",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Bitwise Operators & Hardware Buffers",
    icon: "💻",
    accentColor: "#0071C5",
    headquarters: "Santa Clara, CA",
    primaryRoles: ["Software Engineer", "Firmware Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Bit Manipulation", "Circular Buffers / Ring Buffers", "Cache Optimization", "Sorting"],
      description: "Intel evaluates memory alignment, low-level data structure design, and algorithmic complexity."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-qualcomm",
    name: "Qualcomm",
    slug: "qualcomm",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Bitwise Logic & Memory Allocation",
    icon: "📶",
    accentColor: "#3253DC",
    headquarters: "San Diego, CA",
    primaryRoles: ["Software Engineer", "Modem DSP Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Bitmask Manipulation", "Linked Lists", "Tree Traversals", "Dynamic Programming"],
      description: "Qualcomm evaluates embedded C/C++ memory management and algorithmic logic."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-atlassian",
    name: "Atlassian",
    slug: "atlassian",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Clean Architecture & Rate Limiting",
    icon: "🔷",
    accentColor: "#0052CC",
    headquarters: "Sydney, Australia",
    primaryRoles: ["Software Engineer", "Full Stack Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Hash Maps & Ledgers", "Rate Limiter / Sliding Window", "Trie Data Structures", "Design"],
      description: "Atlassian tests clean OOP design, rate limiting data structures, and edge-case handling."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "system_design"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-servicenow",
    name: "ServiceNow",
    slug: "servicenow",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Workflow DAGs & Tree Search",
    icon: "💼",
    accentColor: "#81B5A1",
    headquarters: "Santa Clara, CA",
    primaryRoles: ["Software Engineer", "Cloud Infrastructure Developer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Directed Acyclic Graphs (DAG)", "Topological Sort", "Hash Tables", "Trees"],
      description: "ServiceNow tests workflow orchestration data structures, cycle detection, and string parsing."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-paypal",
    name: "PayPal",
    slug: "paypal",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Transaction Idempotency & Two Pointers",
    icon: "💳",
    accentColor: "#003087",
    headquarters: "San Jose, CA",
    primaryRoles: ["Software Engineer", "Backend Developer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Hash Tables & Two Pointers", "Sliding Window", "Binary Search", "Dynamic Programming"],
      description: "PayPal focuses on payment stream reconciliation, array window calculations, and sorting."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-spotify",
    name: "Spotify",
    slug: "spotify",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Playback Queues & Recommendation Graphs",
    icon: "🎧",
    accentColor: "#1DB954",
    headquarters: "Stockholm, Sweden",
    primaryRoles: ["Software Engineer", "Backend Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Circular Queues", "Heaps / Priority Queues", "Graph Traversals", "Two Pointers"],
      description: "Spotify evaluates audio queue state machines, shuffle invariants, and distributed caching."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2", "system_design"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-bytedance",
    name: "ByteDance",
    slug: "bytedance",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "High Concurrency & Dynamic Programming",
    icon: "🎵",
    accentColor: "#325AB4",
    headquarters: "Singapore / Beijing",
    primaryRoles: ["Software Engineer", "Backend Engineer", "Algorithms Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["Dynamic Programming", "Segment Trees / Binary Index Trees", "Graph Traversals", "Sliding Window"],
      description: "ByteDance interviews have very high algorithmic difficulty, testing complex DP and graph structures."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "technical_round_2"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-snowflake",
    name: "Snowflake",
    slug: "snowflake",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Columnar Storage & Query Engines",
    icon: "❄️",
    accentColor: "#29B5E8",
    headquarters: "Bozeman, MT",
    primaryRoles: ["Software Engineer - Database Core", "Data Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["B+ Trees & Indexing", "External Merge Sort", "Hash Joins", "Memory Buffer Pools"],
      description: "Snowflake evaluates query engine primitives, external sorting, and distributed partition trees."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2", "system_architecture"],
    sourceAttribution: "verified historical archive"
  },
  {
    id: "comp-databricks",
    name: "Databricks",
    slug: "databricks",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Distributed Logs & Spark Internals",
    icon: "🧱",
    accentColor: "#FF3621",
    headquarters: "San Francisco, CA",
    primaryRoles: ["Software Engineer", "Distributed Systems Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["LSM Trees / Delta Logs", "Graph Topologies", "Concurrency Control (OCC)", "Sliding Window"],
      description: "Databricks tests transaction log replay, concurrency control, and distributed partition shuffling."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2", "system_architecture"],
    sourceAttribution: "verified historical archive"
  },
  {
    id: "comp-walmart",
    name: "Walmart Global Tech",
    slug: "walmart",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Inventory Search & Graph Supply Chains",
    icon: "🏬",
    accentColor: "#0071CE",
    headquarters: "Bentonville, AR / Bengaluru",
    primaryRoles: ["Software Engineer (SDE 2)", "Data Scientist"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Binary Search on Answers", "Breadth First Search (BFS)", "Sliding Window", "Dynamic Programming"],
      description: "Walmart tests warehouse inventory routing, bin packing approximations, and array window calculations."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-linkedin",
    name: "LinkedIn",
    slug: "linkedin",
    sector: "global_tech",
    sectorLabel: "Global Tech & Tier 1",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Social Graph Traversal & Distributed Feeds",
    icon: "💼",
    accentColor: "#0A66C2",
    headquarters: "Sunnyvale, CA",
    primaryRoles: ["Software Engineer", "Site Reliability Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Graph Traversal (Bidirectional BFS)", "Two Pointers", "Nested Lists / Iterators", "DP"],
      description: "LinkedIn evaluates graph relationship degrees of separation, custom iterators, and LRU caches."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2", "system_design"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. INDIA-BASED HIGH-GROWTH TECH & PRODUCT
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "comp-flipkart",
    name: "Flipkart",
    slug: "flipkart",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Low-Level Design & High-Load Arrays",
    icon: "🛍️",
    accentColor: "#2874F0",
    headquarters: "Bengaluru, India",
    primaryRoles: ["SDE-1", "SDE-2", "Software Engineer - Supply Chain"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["Arrays & Hash Maps", "Binary Search", "Trees & Graphs", "Machine Coding (LLD)"],
      description: "Flipkart interview loops feature rigorous DSA coding followed by a mandatory 90-minute live Machine Coding (LLD) round."
    },
    knownInterviewStages: ["online_assessment", "machine_coding_lld", "technical_round_ps_ds", "hiring_manager"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-swiggy",
    name: "Swiggy",
    slug: "swiggy",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Dynamic Routing & Spatial Geohashing",
    icon: "🛵",
    accentColor: "#FC8019",
    headquarters: "Bengaluru, India",
    primaryRoles: ["SDE-1", "SDE-2", "Data Scientist"],
    assessmentFormat: {
      oaDurationMinutes: 75,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Graphs & Shortest Paths", "Sliding Window", "Dynamic Programming", "LLD"],
      description: "Swiggy tests route optimization, delivery assignment models, and order state machines."
    },
    knownInterviewStages: ["online_assessment", "machine_coding", "problem_solving_ds"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-zomato",
    name: "Zomato",
    slug: "zomato",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Search Indexing & Caching Layers",
    icon: "🍽️",
    accentColor: "#E23744",
    headquarters: "Gurugram, India",
    primaryRoles: ["Software Development Engineer", "Product Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Two Pointers & Arrays", "Heaps / Top-K", "Trees & BFS", "Machine Coding"],
      description: "Zomato evaluates rapid problem-solving, real-time order tracking structures, and clean code."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-razorpay",
    name: "Razorpay",
    slug: "razorpay",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Idempotency Ledgers & State Machines",
    icon: "⚡",
    accentColor: "#0C2340",
    headquarters: "Bengaluru, India",
    primaryRoles: ["Software Engineer 1", "Software Engineer 2"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Hash Maps & Ledgers", "State Machine Validation", "Two Pointers", "Concurrency"],
      description: "Razorpay focuses heavily on transaction consistency, idempotency invariants, and error boundaries."
    },
    knownInterviewStages: ["online_assessment", "problem_solving", "low_level_design"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-phonepe",
    name: "PhonePe",
    slug: "phonepe",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Transactional Integrity & Rate Limiters",
    icon: "🟣",
    accentColor: "#5F259F",
    headquarters: "Bengaluru, India",
    primaryRoles: ["Software Engineer", "Backend Developer"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["Graph Traversals", "Dynamic Programming", "Sliding Window", "Distributed Locking"],
      description: "PhonePe evaluates high-volume payment processing algorithms and resilient state storage."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "machine_coding"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-meesho",
    name: "Meesho",
    slug: "meesho",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "E-Commerce Reseller Feed Optimization",
    icon: "📦",
    accentColor: "#9B2C2C",
    headquarters: "Bengaluru, India",
    primaryRoles: ["Software Engineer 1", "SDE 2"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Arrays & Two Pointers", "Hash Maps", "Trees"],
      description: "Meesho evaluation syllabus in curation; company catalogued for syllabus tracking."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"]
  },
  {
    id: "comp-zepto",
    name: "Zepto",
    slug: "zepto",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Dark Store Dispatch & Micro-Logistics",
    icon: "⚡",
    accentColor: "#E53E3E",
    headquarters: "Mumbai, India",
    primaryRoles: ["Software Engineer", "Backend SDE"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Heaps & Priority Queues", "Greedy Intervals", "Shortest Paths"],
      description: "Zepto 10-minute delivery routing syllabus under verification."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"]
  },
  {
    id: "comp-cred",
    name: "CRED",
    slug: "cred",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Reactive Architectures & Financial Invariants",
    icon: "💎",
    accentColor: "#1A202C",
    headquarters: "Bengaluru, India",
    primaryRoles: ["Software Engineer", "Backend Developer"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Graphs", "Dynamic Programming", "LLD", "High Concurrency"],
      description: "CRED assessments test elegant code structure, defensive programming, and zero-defect edge handling."
    },
    knownInterviewStages: ["online_assessment", "machine_coding", "system_design"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-groww",
    name: "Groww",
    slug: "groww",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Order Books & Real-Time Stock Tickers",
    icon: "🌱",
    accentColor: "#00D09C",
    headquarters: "Bengaluru, India",
    primaryRoles: ["Software Engineer", "Full Stack Developer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Sliding Window", "Binary Search", "Hash Maps"],
      description: "Groww investment platform interview mappings currently in curation."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"]
  },
  {
    id: "comp-paytm",
    name: "Paytm",
    slug: "paytm",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "High-Volume Payment Streams & Reversal Trees",
    icon: "📱",
    accentColor: "#002E6E",
    headquarters: "Noida, India",
    primaryRoles: ["Software Engineer", "Backend Developer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Arrays & Hashing", "Linked Lists", "Dynamic Programming", "Trees"],
      description: "Paytm tests financial transaction balance tracking, number reversals, and array window aggregations."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-zoho",
    name: "Zoho",
    slug: "zoho",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Low-Level Implementation Without Built-In Libraries",
    icon: "⚙️",
    accentColor: "#E42528",
    headquarters: "Chennai, India",
    primaryRoles: ["Software Developer", "Product Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 120,
      oaQuestionCount: 5,
      interviewRounds: 4,
      coreTopics: ["String Parsing Without Functions", "Matrix Pattern Printing", "Custom Data Structures", "Recursion"],
      description: "Zoho evaluates pure algorithmic problem-solving without standard library shortcuts (no split, no sort)."
    },
    knownInterviewStages: ["basic_programming_round", "advanced_programming_round", "technical_interview"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-postman",
    name: "Postman",
    slug: "postman",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "HTTP Parsers, Trees & Graph Dependencies",
    icon: "🚀",
    accentColor: "#FF6C37",
    headquarters: "Bengaluru / San Francisco",
    primaryRoles: ["Software Engineer", "Frontend Engineer", "Core Backend Developer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Tree & Graph Dependencies", "Trie URL Matching", "Event Loops", "Object Modeling"],
      description: "Postman tests API collection graph traversal, cycle resolution, and tree traversal algorithms."
    },
    knownInterviewStages: ["technical_round_1", "technical_round_2"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-browserstack",
    name: "BrowserStack",
    slug: "browserstack",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Virtual Device Allocation & Queue Scheduling",
    icon: "🧪",
    accentColor: "#0066FF",
    headquarters: "Mumbai / Dublin",
    primaryRoles: ["Software Engineer", "DevOps Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Queues & Schedulers", "Concurrency", "Interval Scheduling", "Trees"],
      description: "BrowserStack evaluates parallel device test scheduling, queue management, and systems thinking."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-makemytrip",
    name: "MakeMyTrip",
    slug: "makemytrip",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Flight Search Graphs & Calendar Overlaps",
    icon: "✈️",
    accentColor: "#E41B23",
    headquarters: "Gurugram, India",
    primaryRoles: ["Software Engineer", "Backend Developer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Graph Traversal (Flight Paths)", "Interval Scheduling", "Two Pointers", "Dynamic Programming"],
      description: "MakeMyTrip tests multi-city flight connection graphs, date window queries, and seat availability."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-ola",
    name: "Ola",
    slug: "ola",
    sector: "india_product",
    sectorLabel: "India Tech & Product",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Geospatial Drivers & Dynamic Pricing",
    icon: "🚖",
    accentColor: "#000000",
    headquarters: "Bengaluru, India",
    primaryRoles: ["Software Engineer", "Data Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Graphs & Shortest Paths", "Priority Queues", "Sliding Window", "Arrays"],
      description: "Ola tests nearest-cab dispatch matching, distance matrices, and surge price calculations."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "verified candidate reports"
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. ENTERPRISE IT SERVICES & STRATEGY CONSULTING
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "comp-tcs",
    name: "TCS (Ninja, Digital & Prime)",
    slug: "tcs",
    sector: "it_services",
    sectorLabel: "IT Services & Consulting",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Basic Maths, Strings & Modular Logic",
    icon: "🏢",
    accentColor: "#006699",
    headquarters: "Mumbai, India",
    primaryRoles: ["TCS Prime (9-11 LPA)", "TCS Digital (7-9 LPA)", "TCS Ninja (3.5-4.5 LPA)"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 2,
      coreTopics: ["Basic Maths", "Number Reversal & Palindromes", "Sorting Algorithms", "Array Rotations"],
      description: "TCS National Qualifier Test (NQT) and Digital Section evaluate number manipulation and sorting fundamentals."
    },
    knownInterviewStages: ["nqt_online_assessment", "technical_interview", "managerial_hr"],
    sourceAttribution: "verified candidate reports & official NQT syllabus"
  },
  {
    id: "comp-infosys",
    name: "Infosys (DSE & SP)",
    slug: "infosys",
    sector: "it_services",
    sectorLabel: "IT Services & Consulting",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Greedy, Dynamic Programming & Graphs",
    icon: "🟦",
    accentColor: "#007CC3",
    headquarters: "Bengaluru, India",
    primaryRoles: ["Specialist Programmer (9.5 LPA)", "Digital Specialist Engineer (6.5 LPA)", "System Engineer (3.6 LPA)"],
    assessmentFormat: {
      oaDurationMinutes: 180,
      oaQuestionCount: 3,
      interviewRounds: 2,
      coreTopics: ["Dynamic Programming", "Greedy Choice", "Trees & Graphs", "Number Theory"],
      description: "Infosys InfyTQ and HackWithInfy coding rounds test advanced competitive programming concepts."
    },
    knownInterviewStages: ["hackwithinfy_oa", "technical_round_1", "hr_round"],
    sourceAttribution: "verified candidate reports & InfyTQ archive"
  },
  {
    id: "comp-wipro",
    name: "Wipro (Turbo & Elite)",
    slug: "wipro",
    sector: "it_services",
    sectorLabel: "IT Services & Consulting",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Arrays, String Parsing & Sorting",
    icon: "🌈",
    accentColor: "#582C83",
    headquarters: "Bengaluru, India",
    primaryRoles: ["Wipro Turbo (6.5 LPA)", "Wipro Elite (3.5 LPA)"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 2,
      coreTopics: ["Array Manipulation", "String Parsing", "Pattern Matching", "Searching"],
      description: "Wipro NLTH coding assessments evaluate practical programming fundamentals and loop invariants."
    },
    knownInterviewStages: ["online_assessment", "technical_interview", "hr_interview"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-cognizant",
    name: "Cognizant (GenC Elevate & Next)",
    slug: "cognizant",
    sector: "it_services",
    sectorLabel: "IT Services & Consulting",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Linked Lists, Stacks & OOP Invariants",
    icon: "🔷",
    accentColor: "#0033A0",
    headquarters: "Teaneck, NJ / Chennai",
    primaryRoles: ["GenC Next (6.5-9 LPA)", "GenC Elevate (4-5 LPA)", "GenC (3.5 LPA)"],
    assessmentFormat: {
      oaDurationMinutes: 75,
      oaQuestionCount: 2,
      interviewRounds: 2,
      coreTopics: ["Linked Lists", "Stacks & Queues", "Binary Trees", "OOP Principles"],
      description: "Cognizant GenC Next assesses algorithmic complexity, data structures, and object design."
    },
    knownInterviewStages: ["online_assessment", "technical_interview"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-accenture",
    name: "Accenture",
    slug: "accenture",
    sector: "it_services",
    sectorLabel: "IT Services & Consulting",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Bitwise Operators & String Inversions",
    icon: "📐",
    accentColor: "#A100FF",
    headquarters: "Dublin, Ireland",
    primaryRoles: ["Advanced Associate Software Engineer (6.5 LPA)", "Associate Software Engineer (4.5 LPA)"],
    assessmentFormat: {
      oaDurationMinutes: 45,
      oaQuestionCount: 2,
      interviewRounds: 2,
      coreTopics: ["Bitwise Operations", "String Reversal & Anagrams", "Array Filtering", "Maths"],
      description: "Accenture coding test tests concise implementation speed and edge conditions."
    },
    knownInterviewStages: ["cognitive_technical_oa", "coding_assessment", "technical_interview"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-capgemini",
    name: "Capgemini",
    slug: "capgemini",
    sector: "it_services",
    sectorLabel: "IT Services & Consulting",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Array Counting & Subarray Scans",
    icon: "♠️",
    accentColor: "#0070AD",
    headquarters: "Paris, France",
    primaryRoles: ["Senior Analyst", "Analyst"],
    assessmentFormat: {
      oaDurationMinutes: 45,
      oaQuestionCount: 2,
      interviewRounds: 2,
      coreTopics: ["Array Sorting", "String Parsing", "Modular Arithmetic", "Searching"],
      description: "Capgemini Exceller test evaluates basic data structure manipulation and clean logic."
    },
    knownInterviewStages: ["online_assessment", "technical_interview"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-hcltech",
    name: "HCLTech",
    slug: "hcltech",
    sector: "it_services",
    sectorLabel: "IT Services & Consulting",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Matrices & Basic Data Structures",
    icon: "🏢",
    accentColor: "#005596",
    headquarters: "Noida, India",
    primaryRoles: ["Graduate Engineer Trainee", "Software Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 45,
      oaQuestionCount: 2,
      interviewRounds: 2,
      coreTopics: ["2D Arrays", "String Transformations", "Sorting", "Searching"],
      description: "HCLTech tests fundamental coding accuracy, time complexity bounds, and language syntax."
    },
    knownInterviewStages: ["online_assessment", "technical_round"],
    sourceAttribution: "verified candidate reports"
  },
  {
    id: "comp-deloitte",
    name: "Deloitte",
    slug: "deloitte",
    sector: "it_services",
    sectorLabel: "IT Services & Consulting",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "SQL, Relational Modeling & Array Lookups",
    icon: "🟢",
    accentColor: "#86BC25",
    headquarters: "New York, NY",
    primaryRoles: ["Analyst - Technology Consulting", "Software Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["SQL Window Queries", "Hash Maps & Array Counting", "OOP Principles", "Business Case Studies"],
      description: "Deloitte evaluations focus on relational databases, SQL aggregations, and business logic coding."
    },
    knownInterviewStages: ["online_assessment", "technical_interview", "case_study"],
    sourceAttribution: "verified candidate reports"
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. FINANCE, FINTECH & QUANTITATIVE TRADING
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "comp-goldman-sachs",
    name: "Goldman Sachs",
    slug: "goldman-sachs",
    sector: "finance_quant",
    sectorLabel: "Finance & Quantitative Tech",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Probability, Combinatorics & Concurrency",
    icon: "🏛️",
    accentColor: "#7399C6",
    headquarters: "New York, NY",
    primaryRoles: ["Software Engineer", "Quantitative Analyst", "Data Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 120,
      oaQuestionCount: 3,
      interviewRounds: 4,
      coreTopics: ["Probability & Maths", "Dynamic Programming", "Custom HashMaps", "Thread Concurrency"],
      description: "Goldman Sachs HackerRank tests combine advanced mathematical probability with algorithms and ACID transactions."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1", "technical_round_2"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-stripe",
    name: "Stripe",
    slug: "stripe",
    sector: "finance_quant",
    sectorLabel: "Finance & Quantitative Tech",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Idempotency Ledgers & Rate Limiting",
    icon: "💳",
    accentColor: "#635BFF",
    headquarters: "San Francisco, CA / Dublin",
    primaryRoles: ["Software Engineer", "Backend Developer", "Infrastructure Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 4,
      coreTopics: ["Hash Maps & Ledgers", "Interval Scheduling", "State Machines", "Idempotency"],
      description: "Stripe technical interviews test clean production abstractions, error handling, and test-driven development."
    },
    knownInterviewStages: ["technical_screen", "technical_round_1", "technical_round_2", "system_design"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems & verified candidate reports"
  },
  {
    id: "comp-jpmorgan",
    name: "JPMorganChase",
    slug: "jpmorgan",
    sector: "finance_quant",
    sectorLabel: "Finance & Quantitative Tech",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "ACID Transactions & High-Frequency Streaming",
    icon: "🏛️",
    accentColor: "#005587",
    headquarters: "New York, NY",
    primaryRoles: ["Software Engineer", "Quantitative Research Associate"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Hash Maps & Sliding Window", "Graph Shortest Path", "ACID Invariants", "Two Pointers"],
      description: "JPMorgan Code for Good and on-site loops test algorithmic efficiency, transactional isolation, and teamwork."
    },
    knownInterviewStages: ["hirevue_oa", "superday_technical_1", "superday_technical_2"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-morgan-stanley",
    name: "Morgan Stanley",
    slug: "morgan-stanley",
    sector: "finance_quant",
    sectorLabel: "Finance & Quantitative Tech",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Multi-Threading & Matrix Operations",
    icon: "🏦",
    accentColor: "#002B49",
    headquarters: "New York, NY",
    primaryRoles: ["Technology Analyst", "Software Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 90,
      oaQuestionCount: 3,
      interviewRounds: 3,
      coreTopics: ["Trees & BSTs", "Memory Allocators", "Multi-Threading in Java/C++", "Dynamic Programming"],
      description: "Morgan Stanley evaluates algorithmic complexity, memory footprints, and low-latency principles."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-visa",
    name: "Visa",
    slug: "visa",
    sector: "finance_quant",
    sectorLabel: "Finance & Quantitative Tech",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "High-Throughput Routing & Tokenization",
    icon: "💳",
    accentColor: "#1A1F71",
    headquarters: "San Francisco, CA",
    primaryRoles: ["Software Engineer", "Data Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Hash Maps", "Two Pointers", "Trees", "Dynamic Programming"],
      description: "Visa evaluates payment authorization pipeline data structures, hashing, and token lookup speeds."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-mastercard",
    name: "Mastercard",
    slug: "mastercard",
    sector: "finance_quant",
    sectorLabel: "Finance & Quantitative Tech",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Fraud Detection Graphs & Sliding Window",
    icon: "💳",
    accentColor: "#EB001B",
    headquarters: "Purchase, NY",
    primaryRoles: ["Software Engineer", "Cybersecurity Engineer"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Sliding Window", "Graph Bipartite Checks", "Arrays", "Hash Tables"],
      description: "Mastercard tests velocity check algorithms, fraud detection sliding windows, and hashing."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-amex",
    name: "American Express",
    slug: "amex",
    sector: "finance_quant",
    sectorLabel: "Finance & Quantitative Tech",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Credit Ledgers & Transaction Trees",
    icon: "💳",
    accentColor: "#006FCF",
    headquarters: "New York, NY",
    primaryRoles: ["Engineer 1", "Data Analyst"],
    assessmentFormat: {
      oaDurationMinutes: 60,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Arrays & Hash Maps", "SQL Window Functions", "Binary Search", "Trees"],
      description: "Amex evaluates customer transaction analysis, reward balance tracking, and array manipulation."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  },
  {
    id: "comp-blackrock",
    name: "BlackRock",
    slug: "blackrock",
    sector: "finance_quant",
    sectorLabel: "Finance & Quantitative Tech",
    status: "questions_available",
    statusLabel: "Questions Available",
    badge: "Aladdin Portfolio Optimization & Matrix Maths",
    icon: "📊",
    accentColor: "#000000",
    headquarters: "New York, NY",
    primaryRoles: ["Software Engineer", "Quantitative Developer"],
    assessmentFormat: {
      oaDurationMinutes: 75,
      oaQuestionCount: 2,
      interviewRounds: 3,
      coreTopics: ["Matrix Operations", "Time Series Rolling Stats", "Dynamic Programming", "Trees"],
      description: "BlackRock evaluates portfolio risk simulations, time series sliding windows, and matrix math."
    },
    knownInterviewStages: ["online_assessment", "technical_round_1"],
    sourceAttribution: "liquidslr/leetcode-company-wise-problems"
  }
];

export function getCompanyDirectory(): CompanyDirectoryEntry[] {
  return COMPANY_DIRECTORY;
}

export function getCompanyBySlug(slug: string): CompanyDirectoryEntry | undefined {
  return COMPANY_DIRECTORY.find((c) => c.slug.toLowerCase() === slug.toLowerCase().trim());
}

export function getCompaniesBySector(sector: CompanySector): CompanyDirectoryEntry[] {
  return COMPANY_DIRECTORY.filter((c) => c.sector === sector);
}

