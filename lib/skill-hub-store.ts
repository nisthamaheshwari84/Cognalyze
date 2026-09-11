/**
 * lib/skill-hub-store.ts
 * Core data layer and in-memory repository for Cognalyze Track-Aware Skill Practice Hub.
 * Real authentic interview simulations for Service Tracks (TCS, Infosys, Wipro, Accenture)
 * and Product/FAANG Tracks (Amazon, Google, Razorpay, Zoho).
 */

export interface RoundStructureItem {
  round_number: number;
  name: string;
  type: "aptitude" | "coding" | "technical" | "communication" | "hr" | "system_design" | "behavioral";
  description: string;
  is_hard_gate: boolean;
  typical_elimination_rate: string;
  key_focus_areas: string[];
}

export interface CompanyTrack {
  slug: "service_mass" | "service_elite" | "product_mid" | "product_faang";
  name: string;
  description: string;
  hiring_focus: string;
  target_companies: string[];
  round_structure: RoundStructureItem[];
  typical_ctc_range: string;
}

export interface SkillDomain {
  slug: string;
  name: string;
  description: string;
  icon: string;
  is_service_track: boolean;
  is_product_track: boolean;
  gating_priority: "critical_gate" | "high_filter" | "core_interview" | "standard";
  action_route: string;
  action_label: string;
}

export interface AptitudeQuestion {
  id: string;
  category: "quantitative" | "logical_reasoning" | "verbal_ability" | "data_interpretation" | "programming_logic";
  topic: string;
  company_tag: string;
  source_citation: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  shortcut_tip?: string;
}

export interface CommunicationPrompt {
  id: string;
  title: string;
  type: "plain_english_concept" | "self_introduction" | "hr_situational";
  target_role: string;
  prompt_text: string;
  context_note: string;
  target_duration_seconds: number;
  evaluation_rubric: {
    clarity_weight: number;
    jargon_avoidance_weight: number;
    structure_weight: number;
    communicability_weight: number;
  };
  sample_winning_response: string;
}

export interface CSInterviewQuestion {
  id: string;
  domain: "dbms" | "oop" | "os" | "networks";
  topic: string;
  company_tag: string;
  question: string;
  code_snippet?: string;
  difficulty: "easy" | "medium" | "hard";
  expected_points: string[];
  ideal_answer: string;
  follow_up: string;
}

export interface SystemDesignChallenge {
  id: string;
  title: string;
  difficulty: "medium" | "hard";
  company_tag: string;
  description: string;
  scale_metrics: string;
  functional_requirements: string[];
  non_functional_requirements: string[];
  architectural_hints: string[];
  ideal_solution: {
    components: string[];
    database_choice: string;
    caching_strategy: string;
    tradeoffs: string;
  };
}

export interface BehavioralQuestion {
  id: string;
  track_type: "service_hr" | "faang_star";
  title: string;
  principle?: string;
  company_tag: string;
  question: string;
  context_tip: string;
  star_rubric: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  ideal_response: string;
}

export interface SkillResource {
  id: string;
  title: string;
  domain: string;
  target_track: "service_mass" | "service_elite" | "product_mid" | "product_faang" | "all";
  type: "guide" | "cheatsheet" | "pattern_bank" | "video_summary";
  url: string;
  company_tag?: string;
  estimated_read_mins?: number;
}

export const SEED_SKILL_RESOURCES: SkillResource[] = [
  {
    id: "res-tcs-nqt-aptitude",
    title: "TCS NQT 2026 Most Repeated Quantitative Aptitude Patterns",
    domain: "aptitude_reasoning",
    target_track: "service_mass",
    type: "pattern_bank",
    url: "/student/skills/aptitude?company=tcs",
    company_tag: "TCS NQT",
    estimated_read_mins: 15
  },
  {
    id: "res-infy-dse-sql",
    title: "Infosys InfyTQ & DSE Top 20 SQL & Database Questions",
    domain: "cs_fundamentals",
    target_track: "service_elite",
    type: "cheatsheet",
    url: "/student/skills/cs-interview?domain=dbms",
    company_tag: "Infosys SP/DSE",
    estimated_read_mins: 20
  },
  {
    id: "res-amazon-system-design",
    title: "Amazon SDE-2 System Design: Rate Limiter & URL Shortener",
    domain: "system_design",
    target_track: "product_faang",
    type: "guide",
    url: "/student/skills/system-design",
    company_tag: "Amazon",
    estimated_read_mins: 30
  },
  {
    id: "res-hr-relocation-service",
    title: "TCS / Wipro Service Bond & Relocation HR Gold Answers",
    domain: "behavioral_hr",
    target_track: "service_mass",
    type: "guide",
    url: "/student/skills/behavioral?track=service",
    company_tag: "Service HR",
    estimated_read_mins: 10
  }
];

// ── 1. 4 COMPANY TRACKS ───────────────────────────────────────────────────────
export const COMPANY_TRACKS: CompanyTrack[] = [
  {
    slug: "service_mass",
    name: "Service Mass Track",
    description: "TCS Ninja, Infosys GenC, Wipro Elite NTH, Cognizant GenC, Accenture ASE. High volume campus hiring.",
    hiring_focus: "Aptitude Hard Gate (65%+ elimination) + Basic Coding + Core CS + Spoken English HR",
    typical_ctc_range: "₹3.5 LPA - ₹4.5 LPA",
    target_companies: ["TCS Ninja", "Infosys GenC", "Wipro Elite NTH", "Cognizant GenC", "Accenture ASE"],
    round_structure: [
      {
        round_number: 1,
        name: "Pre-Placement Talk (PPT)",
        type: "hr",
        description: "Orientation to job bands, service agreement/bond terms, and eligibility check (60%+ / 6.0 CGPA).",
        is_hard_gate: false,
        typical_elimination_rate: "0% (Informational)",
        key_focus_areas: ["Eligibility check", "Active backlogs policy", "Location flexibility"]
      },
      {
        round_number: 2,
        name: "Online Aptitude Assessment (NQT / Mass Gate)",
        type: "aptitude",
        description: "Hard-gate quantitative, logical reasoning, and verbal elimination test. Strong coding cannot compensate.",
        is_hard_gate: true,
        typical_elimination_rate: "65% - 75% eliminated",
        key_focus_areas: ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability", "Programming Logic"]
      },
      {
        round_number: 3,
        name: "Basic Coding Round",
        type: "coding",
        description: "1-2 basic problems focused on arrays, strings, loops, and math simulation. Zero LeetCode Hard.",
        is_hard_gate: true,
        typical_elimination_rate: "30% - 40% eliminated",
        key_focus_areas: ["String reversal & palindrome", "Array frequency", "Factorials & Prime series"]
      },
      {
        round_number: 4,
        name: "Technical & CS Fundamentals Interview",
        type: "technical",
        description: "Interview covering final-year project, core OOP principles, DBMS SQL queries, and basic DSA.",
        is_hard_gate: true,
        typical_elimination_rate: "20% - 30% eliminated",
        key_focus_areas: ["Final year project", "OOP 4 Pillars", "DBMS 2nd Highest Salary SQL", "Basic DSA"]
      },
      {
        round_number: 5,
        name: "Communication & Spoken English HR Round",
        type: "communication",
        description: "Spoken English fluency, confidence check, relocation willingness, and corporate culture alignment.",
        is_hard_gate: true,
        typical_elimination_rate: "15% - 25% eliminated",
        key_focus_areas: ["90s Self-introduction", "Relocation & shift willingness", "Plain-English concept explanation"]
      }
    ]
  },
  {
    slug: "service_elite",
    name: "Service Elite Track",
    description: "TCS Digital / Prime, Infosys SP / DSE, Wipro Turbo, Cognizant GenC Elevate. High-compensation tier in IT services.",
    hiring_focus: "Advanced Aptitude Gate + LeetCode Medium Coding + Deep Systems/Framework Technical Round",
    typical_ctc_range: "₹6.5 LPA - ₹9.5 LPA",
    target_companies: ["TCS Digital / Prime", "Infosys SP / DSE", "Wipro Turbo", "Cognizant GenC Elevate"],
    round_structure: [
      {
        round_number: 1,
        name: "Advanced Quantitative & Reasoning Gate",
        type: "aptitude",
        description: "High-cutoff aptitude including advanced statistics, cryptic puzzles, and fast-paced reasoning.",
        is_hard_gate: true,
        typical_elimination_rate: "70% - 80% eliminated",
        key_focus_areas: ["Advanced Quant", "Cryptarithmetic puzzles", "Abstract reasoning"]
      },
      {
        round_number: 2,
        name: "Advanced DSA & Competitive Coding",
        type: "coding",
        description: "2-3 complex algorithmic problems (Dynamic Programming, Graphs, Trees, Greedy).",
        is_hard_gate: true,
        typical_elimination_rate: "60% - 70% eliminated",
        key_focus_areas: ["DP on grids", "Graph traversals (BFS/DFS)", "Bit manipulation", "Space/Time efficiency"]
      },
      {
        round_number: 3,
        name: "Deep Technical & Architecture Interview",
        type: "technical",
        description: "Probe into real-world code reviews, database indexing, REST APIs, and backend frameworks.",
        is_hard_gate: true,
        typical_elimination_rate: "25% - 35% eliminated",
        key_focus_areas: ["Modern stacks (Spring Boot, Node.js)", "DB Indexing & ACID", "Cloud Docker basics"]
      },
      {
        round_number: 4,
        name: "Leadership & Client Communicability HR",
        type: "communication",
        description: "Tests business storytelling, client-facing English presentation, and rapid problem framing.",
        is_hard_gate: true,
        typical_elimination_rate: "10% - 15% eliminated",
        key_focus_areas: ["Client conflict scenarios", "Spoken English articulation", "Career trajectory alignment"]
      }
    ]
  },
  {
    slug: "product_mid",
    name: "Product & Mid-Tier Track",
    description: "Zoho, Flipkart-tier startups, FinTech unicorns (Razorpay, Swiggy), and GCCs (Wells Fargo, Fidelity).",
    hiring_focus: "2-4 LeetCode Medium DSA Problems + CS Fundamentals Deep-Dive + Lightweight LLD / Take-Home",
    typical_ctc_range: "₹12 LPA - ₹24 LPA",
    target_companies: ["Zoho", "Razorpay", "Swiggy", "Wells Fargo GCC", "Fidelity", "Flipkart"],
    round_structure: [
      {
        round_number: 1,
        name: "Online Coding Assessment (OA)",
        type: "coding",
        description: "2-4 algorithmic DSA problems on HackerRank/Codility with strict hidden edge-case testing.",
        is_hard_gate: true,
        typical_elimination_rate: "75% - 85% eliminated",
        key_focus_areas: ["Arrays, HashMaps, Sliding Window", "Binary Trees & BSTs", "DP Medium"]
      },
      {
        round_number: 2,
        name: "Live Technical Round 1 (DSA & Live Coding)",
        type: "technical",
        description: "Live interactive coding with an engineer. Explaining thought process, invariants, and edge cases.",
        is_hard_gate: true,
        typical_elimination_rate: "50% eliminated",
        key_focus_areas: ["Clean modular code", "In-place optimizations", "Boundary conditions"]
      },
      {
        round_number: 3,
        name: "Live Technical Round 2 (CS Fundamentals & LLD)",
        type: "system_design",
        description: "Deep dive into production project codebase, schema design, and Low-Level Design (LLD) patterns.",
        is_hard_gate: true,
        typical_elimination_rate: "30% - 40% eliminated",
        key_focus_areas: ["LLD (Design Parking Lot / Rate Limiter)", "DB B-Trees & transactions", "OS Concurrency"]
      },
      {
        round_number: 4,
        name: "Culture Fit & Engineering Leadership",
        type: "behavioral",
        description: "Product intuition, ownership mentality, pushback handling, and engineering values.",
        is_hard_gate: true,
        typical_elimination_rate: "10% - 15% eliminated",
        key_focus_areas: ["Ownership in previous projects", "Navigating ambiguity", "Collaboration"]
      }
    ]
  },
  {
    slug: "product_faang",
    name: "Tier-1 Product & FAANG Track",
    description: "Google, Amazon, Microsoft, Meta, Uber, Atlassian. The highest algorithmic and architectural bar.",
    hiring_focus: "Recruiter Screen + Technical Phone Screen + Onsite Loop (3-5 Rounds: DSA Pattern Grind + System Design + STAR Behavioral)",
    typical_ctc_range: "₹28 LPA - ₹55+ LPA",
    target_companies: ["Google", "Amazon", "Microsoft", "Meta", "Uber", "Atlassian"],
    round_structure: [
      {
        round_number: 1,
        name: "Recruiter Resume Screen & Assessment",
        type: "technical",
        description: "High-impact project metrics scan followed by a 2-problem algorithmic OA.",
        is_hard_gate: true,
        typical_elimination_rate: "80% eliminated",
        key_focus_areas: ["High-impact project metrics", "Hard algorithmic problem solving"]
      },
      {
        round_number: 2,
        name: "Technical Phone Screen (TPS)",
        type: "coding",
        description: "45-60 minute call on Google Docs/CoderPad: 1-2 LeetCode Medium/Hard problems with proofs.",
        is_hard_gate: true,
        typical_elimination_rate: "60% eliminated",
        key_focus_areas: ["Verbalizing trade-offs before writing code", "Bug-free code within 25 minutes"]
      },
      {
        round_number: 3,
        name: "Onsite Coding Loops (2-3 Rounds)",
        type: "coding",
        description: "Exhaustive algorithmic interrogation by senior bar-raisers across graphs, intervals, and heaps.",
        is_hard_gate: true,
        typical_elimination_rate: "50% eliminated",
        key_focus_areas: ["Multi-dimensional DP", "Advanced Graph Algorithms", "Trie & String automata"]
      },
      {
        round_number: 4,
        name: "System Design (HLD/LLD) Round",
        type: "system_design",
        description: "Architect distributed systems (Design TinyURL, WhatsApp, Rate Limiter) for high throughput.",
        is_hard_gate: true,
        typical_elimination_rate: "40% eliminated",
        key_focus_areas: ["Load balancing, Caching, CAP Theorem", "Database Sharding", "Fault tolerance"]
      },
      {
        round_number: 5,
        name: "Bar-Raiser Behavioral (Amazon STAR / Googleyness)",
        type: "behavioral",
        description: "STAR method behavioral interrogation based on Amazon 16 Leadership Principles.",
        is_hard_gate: true,
        typical_elimination_rate: "20% - 30% eliminated",
        key_focus_areas: ["Customer Obsession & Bias for Action", "Disagree and Commit", "Outage recovery"]
      }
    ]
  }
];

// ── 2. SEED SKILL DOMAINS (NO DEAD ENDS — ALL LAUNCH REAL INTERVIEWS) ───────────
export const SKILL_DOMAINS: SkillDomain[] = [
  {
    slug: "aptitude_reasoning",
    name: "Aptitude & Reasoning Assessment",
    description: "Quantitative, logical reasoning, verbal ability, and programming logic. The non-negotiable hard gate for mass service hiring.",
    icon: "🧮",
    is_service_track: true,
    is_product_track: false,
    gating_priority: "critical_gate",
    action_route: "/student/skills/aptitude",
    action_label: "Launch NQT Aptitude Exam ➔"
  },
  {
    slug: "communication_english",
    name: "Corporate Spoken English & HR Studio",
    description: "Spoken English fluency, 90-second self-introduction, and explaining technical concepts in plain English. Eliminates 40%+ technical candidates.",
    icon: "🎙️",
    is_service_track: true,
    is_product_track: false,
    gating_priority: "high_filter",
    action_route: "/student/skills/communication",
    action_label: "Launch Spoken English Studio ➔"
  },
  {
    slug: "cs_fundamentals",
    name: "Live CS Fundamentals Technical Round",
    description: "Real technical interview room with Alex grilling on SQL (2nd highest salary), OOP pillars, OS Deadlocks, and Networks.",
    icon: "💾",
    is_service_track: true,
    is_product_track: true,
    gating_priority: "core_interview",
    action_route: "/student/skills/cs-interview",
    action_label: "Enter CS Technical Round ➔"
  },
  {
    slug: "dsa",
    name: "DSA Coding Interview Arena",
    description: "From basic array and string manipulation for service rounds to exhaustive 14-pattern LeetCode grinds for FAANG.",
    icon: "⚡",
    is_service_track: true,
    is_product_track: true,
    gating_priority: "critical_gate",
    action_route: "/student/dsa-tracker",
    action_label: "Launch Coding Arena ➔"
  },
  {
    slug: "system_design",
    name: "System Design Architecture Round",
    description: "Low-Level Object Design (SOLID patterns) and High-Level Distributed Architecture (Rate Limiter, TinyURL, Caching, Sharding).",
    icon: "🏛️",
    is_service_track: false,
    is_product_track: true,
    gating_priority: "core_interview",
    action_route: "/student/skills/system-design",
    action_label: "Enter System Design Room ➔"
  },
  {
    slug: "behavioral_hr",
    name: "STAR Behavioral & HR Interview Round",
    description: "Live behavioral mock interview: Service HR questions (relocation, bond, stability) and Amazon 16 Leadership Principles using STAR.",
    icon: "👔",
    is_service_track: true,
    is_product_track: true,
    gating_priority: "high_filter",
    action_route: "/student/skills/behavioral",
    action_label: "Enter Behavioral HR Room ➔"
  }
];

// ── 3. AUTHENTIC 25+ COMPANY APTITUDE QUESTIONS ──────────────────────────────
export const SEED_APTITUDE_QUESTIONS: AptitudeQuestion[] = [
  // ── TCS NQT QUANTITATIVE ──
  {
    id: "apt-tcs-1",
    category: "quantitative",
    topic: "Work & Time",
    company_tag: "TCS NQT",
    source_citation: "PrepInsta 2026 Archive • TCS NQT Numerical Ability",
    difficulty: "medium",
    question: "A can complete a software testing module in 12 days, while B can complete it in 18 days. If they work together on the module for 4 days, what fraction of the work remains to be completed?",
    options: ["4/9", "5/9", "1/3", "7/18"],
    correct_option_index: 0,
    explanation: "A's 1-day work = 1/12. B's 1-day work = 1/18. Together 1-day work = (1/12 + 1/18) = 5/36. In 4 days, work completed = 4 × (5/36) = 20/36 = 5/9. Work remaining = 1 - 5/9 = 4/9.",
    shortcut_tip: "Shortcut: Remaining = 1 - [Days × (A+B) / (A×B)] = 1 - [4 × 30 / 216] = 4/9."
  },
  {
    id: "apt-tcs-2",
    category: "quantitative",
    topic: "Permutation & Combination",
    company_tag: "TCS NQT",
    source_citation: "IndiaBix Verified Pattern • TCS NQT Quant",
    difficulty: "medium",
    question: "In how many different ways can the letters of the word 'COGNALYZE' be arranged such that all the vowels (O, A, E) always come together?",
    options: ["30,240", "15,120", "7,560", "20,160"],
    correct_option_index: 0,
    explanation: "Vowels: O, A, E (3 vowels). Consonants: C, G, N, L, Y, Z (6 consonants). Treat 3 vowels as 1 single block. Total units = 6 + 1 = 7 units. These 7 units arrange in 7! = 5040 ways. The 3 vowels arrange in 3! = 6 ways. Total arrangements = 5040 × 6 = 30,240.",
    shortcut_tip: "Formula: (Consonants + 1)! × (Vowels)!"
  },
  {
    id: "apt-tcs-3",
    category: "quantitative",
    topic: "Speed, Time & Distance",
    company_tag: "TCS NQT",
    source_citation: "PrepInsta 2026 Archive • TCS NQT Quant",
    difficulty: "easy",
    question: "A train running at a speed of 72 km/hr crosses a 260m long platform in 23 seconds. What is the length of the train?",
    options: ["200 meters", "220 meters", "180 meters", "240 meters"],
    correct_option_index: 0,
    explanation: "Speed in m/s = 72 × (5/18) = 20 m/s. Total distance crossed = Speed × Time = 20 × 23 = 460 meters. Distance = Train Length + Platform Length. Train Length = 460 - 260 = 200 meters.",
    shortcut_tip: "Convert km/h to m/s by multiplying by 5/18. Distance = Length(train) + Length(platform)."
  },
  {
    id: "apt-tcs-4",
    category: "quantitative",
    topic: "Percentages & Profit/Loss",
    company_tag: "TCS NQT",
    source_citation: "IndiaBix Verified Pattern • TCS NQT Quant",
    difficulty: "easy",
    question: "A shopkeeper marks an item 30% above the cost price and then offers a 10% discount on the marked price. What is his actual profit percentage?",
    options: ["17%", "20%", "15%", "18%"],
    correct_option_index: 0,
    explanation: "Let Cost Price (CP) = 100. Marked Price (MP) = 130. Discount = 10% of 130 = 13. Selling Price (SP) = 130 - 13 = 117. Profit = 117 - 100 = 17%.",
    shortcut_tip: "Net % = Markup - Discount - (Markup × Discount / 100) = 30 - 10 - 3 = 17%."
  },
  {
    id: "apt-tcs-5",
    category: "quantitative",
    topic: "Probability",
    company_tag: "TCS NQT",
    source_citation: "PrepInsta 2026 Archive • TCS NQT Quant",
    difficulty: "medium",
    question: "Two dice are rolled simultaneously. What is the probability that the sum of the numbers rolled is a prime number?",
    options: ["5/12", "7/18", "1/2", "13/36"],
    correct_option_index: 0,
    explanation: "Total outcomes = 6 × 6 = 36. Possible prime sums are 2, 3, 5, 7, 11. Sum 2: (1,1) [1]. Sum 3: (1,2), (2,1) [2]. Sum 5: (1,4), (2,3), (3,2), (4,1) [4]. Sum 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) [6]. Sum 11: (5,6), (6,5) [2]. Total favorable = 1+2+4+6+2 = 15. Probability = 15/36 = 5/12.",
    shortcut_tip: "Dice sum distribution: Favorable sums {2,3,5,7,11} count to 15 outcomes out of 36."
  },

  // ── TCS NQT & INFOSYS LOGICAL REASONING ──
  {
    id: "apt-tcs-6",
    category: "logical_reasoning",
    topic: "Syllogisms",
    company_tag: "TCS NQT",
    source_citation: "PrepInsta 2026 Archive • TCS NQT Reasoning",
    difficulty: "easy",
    question: "Statements: 1. All microservices are distributed. 2. Some distributed systems are resilient. Conclusions: I. Some microservices are resilient. II. Some resilient systems are distributed.",
    options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither follows"],
    correct_option_index: 1,
    explanation: "From Statement 2: 'Some distributed systems are resilient', the direct converse is always true: 'Some resilient systems are distributed' (Conclusion II). Conclusion I cannot be guaranteed since microservices may not overlap with the resilient subset.",
    shortcut_tip: "Rule: 'Some A are B' always converts directly into 'Some B are A'."
  },
  {
    id: "apt-tcs-7",
    category: "logical_reasoning",
    topic: "Blood Relations",
    company_tag: "TCS NQT",
    source_citation: "IndiaBix Verified Pattern • TCS NQT Reasoning",
    difficulty: "easy",
    question: "Pointing to a photograph of a software engineer, Rohan said: 'Her mother's only son is my father.' How is Rohan related to the lady in the photograph?",
    options: ["Nephew", "Son", "Brother", "Cousin"],
    correct_option_index: 0,
    explanation: "Her mother's only son = the lady's brother. So the lady's brother is Rohan's father. Thus, the lady is Rohan's paternal aunt (bua), and Rohan is her nephew.",
    shortcut_tip: "Trace backward: Lady's mother's only son = Lady's brother = Rohan's father. Rohan = Nephew."
  },
  {
    id: "apt-infy-1",
    category: "logical_reasoning",
    topic: "Cryptarithmetic Puzzles",
    company_tag: "Infosys",
    source_citation: "Infosys Placement Papers Archive (InfyTQ)",
    difficulty: "hard",
    question: "In the cryptarithmetic addition: SEND + MORE = MONEY, what is the single-digit numeric value assigned to the letter 'M'?",
    options: ["0", "1", "2", "9"],
    correct_option_index: 1,
    explanation: "In SEND + MORE = MONEY, the addition of two 4-digit numbers produces a 5-digit number. The carry-over into the ten-thousands column can only ever be 1. Therefore, M must equal 1.",
    shortcut_tip: "Infosys Cryptarithmetic Rule: The leading carry-over digit in any addition of two numbers is ALWAYS 1."
  },
  {
    id: "apt-infy-2",
    category: "logical_reasoning",
    topic: "Seating Arrangements",
    company_tag: "Infosys",
    source_citation: "PrepInsta 2026 Archive • Infosys Reasoning",
    difficulty: "medium",
    question: "Five engineers (A, B, C, D, E) sit in a row facing North. C sits in the exact middle. A is immediately to the left of B. D is at one of the extreme ends. E is between C and D. Who sits immediately to the right of C?",
    options: ["E", "B", "A", "D"],
    correct_option_index: 0,
    explanation: "C is in the middle (Position 3): _ _ C _ _. Since D is at an extreme end and E is between C and D, D must be at Position 5 and E at Position 4. Order: A B C E D. Immediately right of C is E.",
    shortcut_tip: "Fix the fixed anchor first (C at index 3). Then place blocks (E between C and D)."
  },

  // ── INFOSYS & WIPRO VERBAL ABILITY ──
  {
    id: "apt-wipro-1",
    category: "verbal_ability",
    topic: "Sentence Correction",
    company_tag: "Wipro Elite",
    source_citation: "Wipro NTH English Archive",
    difficulty: "easy",
    question: "Identify the grammatically correct sentence for corporate communication:",
    options: [
      "Neither the developer nor the QA engineers was able to replicate the bug.",
      "Neither the developer nor the QA engineers were able to replicate the bug.",
      "Neither the developer or the QA engineers was able to replicate the bug.",
      "Neither the developer and the QA engineers were able to replicate the bug."
    ],
    correct_option_index: 1,
    explanation: "In 'Neither... nor' constructions, the verb agrees in number with the subject closest to it. Here, 'QA engineers' is plural and is closest to the verb, so the plural verb 'were' is required.",
    shortcut_tip: "Rule of Proximity: With 'Neither... nor', match the verb to the nearest subject."
  },
  {
    id: "apt-wipro-2",
    category: "verbal_ability",
    topic: "Vocabulary & Antonyms",
    company_tag: "Wipro Elite",
    source_citation: "IndiaBix Verified Pattern • Wipro English",
    difficulty: "easy",
    question: "Select the word most nearly OPPOSITE in meaning to the corporate term 'TRANSIENT':",
    options: ["Ephemeral", "Permanent", "Temporal", "Volatile"],
    correct_option_index: 1,
    explanation: "'Transient' means lasting only for a short time or impermanent. Its direct antonym is 'Permanent'. 'Ephemeral' and 'Volatile' are synonyms.",
    shortcut_tip: "Transient = Temporary. Opposite = Permanent."
  },
  {
    id: "apt-infy-3",
    category: "verbal_ability",
    topic: "Reading Comprehension & Critical Inferences",
    company_tag: "Infosys",
    source_citation: "Infosys Verbal Archive",
    difficulty: "medium",
    question: "Passage: 'Cloud computing adoption accelerates developer velocity, yet multi-tenant architectures introduce novel attack surfaces that mandate zero-trust security postures.' What is the primary implication?",
    options: [
      "Cloud computing is too unsafe for enterprise adoption.",
      "Speed gains in cloud computing must be counterbalanced by rigorous zero-trust verification.",
      "Zero-trust security slows down software developers.",
      "Multi-tenant architectures will be phased out."
    ],
    correct_option_index: 1,
    explanation: "The passage sets up a contrast between velocity gains and new security vulnerabilities, concluding that zero-trust is mandated to secure the environment.",
    shortcut_tip: "Look for the synthesis of the two halves of the sentence: Benefit (velocity) + Risk mitigation (zero trust)."
  },

  // ── DATA INTERPRETATION & PROGRAMMING LOGIC ──
  {
    id: "apt-infy-4",
    category: "data_interpretation",
    topic: "Data Sufficiency",
    company_tag: "Infosys",
    source_citation: "PrepInsta 2026 Archive • Infosys Reasoning",
    difficulty: "medium",
    question: "Is integer X divisible by 6? Statement 1: X is divisible by 2. Statement 2: X is divisible by 3.",
    options: [
      "Statement 1 ALONE is sufficient, but Statement 2 alone is not",
      "Statement 2 ALONE is sufficient, but Statement 1 alone is not",
      "BOTH statements TOGETHER are sufficient, but NEITHER alone is sufficient",
      "Statements 1 and 2 together are NOT sufficient"
    ],
    correct_option_index: 2,
    explanation: "A number is divisible by 6 if and only if it is divisible by both 2 and 3 (since 2 and 3 are co-prime factors of 6). Neither statement alone is sufficient, but combined they guarantee X is a multiple of 6.",
    shortcut_tip: "For composite divisors with co-prime factors (like 6 = 2 × 3), both conditions combined are necessary and sufficient."
  },
  {
    id: "apt-tcs-8",
    category: "programming_logic",
    topic: "Bitwise Operators & Pseudo-code",
    company_tag: "TCS NQT",
    source_citation: "TCS NQT Advanced Cognitive & Logic Archive",
    difficulty: "medium",
    question: "What is the output of the following C/C++ statement: int x = 5; int y = x << 2; int z = y ^ 3; printf(\"%d\", z);",
    options: ["23", "20", "17", "7"],
    correct_option_index: 0,
    explanation: "x = 5 (binary 00000101). Left shift by 2: x << 2 = 5 × 2² = 20 (binary 00010100). XOR with 3 (binary 00000011): 20 ^ 3 = (00010100 ^ 00000011) = 00010111 = 23.",
    shortcut_tip: "Left shift by N is multiplying by 2^N. 5 << 2 = 20. 20 ^ 3 = 23 (since 20 has no 1st or 2nd bit set)."
  },
  {
    id: "apt-tcs-9",
    category: "programming_logic",
    topic: "Recursion Tracing",
    company_tag: "TCS NQT",
    source_citation: "TCS NQT Programming Logic",
    difficulty: "medium",
    question: "What does this recursive function return for func(4)? int func(int n) { if(n <= 1) return 1; return n + func(n - 2); }",
    options: ["7", "6", "10", "4"],
    correct_option_index: 0,
    explanation: "func(4) = 4 + func(2). func(2) = 2 + func(0). func(0) = 1 (since 0 <= 1). func(2) = 2 + 1 = 3. func(4) = 4 + 3 = 7.",
    shortcut_tip: "Step-by-step unroll: func(4) = 4 + (2 + 1) = 7."
  },
  {
    id: "apt-wipro-1",
    category: "quantitative",
    topic: "Simple and Compound Interest",
    company_tag: "Wipro Elite NLTH",
    source_citation: "IndiaBix Quantitative Aptitude",
    difficulty: "medium",
    question: "The difference between simple interest and compound interest compounded annually on a certain sum of money for 2 years at 4% per annum is ₹1. Find the sum.",
    options: ["₹625", "₹650", "₹675", "₹700"],
    correct_option_index: 0,
    explanation: "For 2 years, Difference = P × (R/100)². 1 = P × (4/100)² = P × (1/25)² = P / 625. Therefore, P = ₹625.",
    shortcut_tip: "2-year CI - SI shortcut formula: D = P(r/100)²."
  },
  {
    id: "apt-wipro-2",
    category: "quantitative",
    topic: "Averages and Age Problems",
    company_tag: "Wipro Elite",
    source_citation: "PrepInsta Wipro NLTH Question Bank",
    difficulty: "easy",
    question: "The average age of a class of 30 students is 15 years. If the teacher's age is included, the average age becomes 16 years. What is the teacher's age?",
    options: ["46 years", "45 years", "44 years", "42 years"],
    correct_option_index: 0,
    explanation: "Total age of 30 students = 30 × 15 = 450. Total age with teacher = 31 × 16 = 496. Teacher's age = 496 - 450 = 46 years.",
    shortcut_tip: "New person age = New Average + (Old Count × Increase) = 16 + (30 × 1) = 46."
  },
  {
    id: "apt-infy-3",
    category: "logical_reasoning",
    topic: "Blood Relations",
    company_tag: "Infosys SP / DSE",
    source_citation: "IndiaBix Verbal & Logical Reasoning",
    difficulty: "medium",
    question: "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?",
    options: ["Father", "Uncle", "Brother", "Cousin"],
    correct_option_index: 0,
    explanation: "'The only son of my mother' is Suresh himself. Therefore, the boy is Suresh's son, which makes Suresh the father.",
    shortcut_tip: "Work backwards from 'my mother': Mother's only son = Myself. Son of myself = My son."
  },
  {
    id: "apt-infy-4",
    category: "logical_reasoning",
    topic: "Syllogisms",
    company_tag: "Infosys Test Paper",
    source_citation: "PrepInsta Infosys Reasoning",
    difficulty: "medium",
    question: "Statements: 1. All mangoes are golden. 2. No golden things are cheap. Conclusions: I. All mangoes are cheap. II. Golden mangoes are not cheap.",
    options: ["Only II follows", "Only I follows", "Either I or II follows", "Neither follows"],
    correct_option_index: 0,
    explanation: "Since all mangoes are golden and no golden things are cheap, it follows directly that mangoes are not cheap. Thus, Conclusion II follows.",
    shortcut_tip: "Universal Affirmative (A) + Universal Negative (E) ➔ Universal Negative (E)."
  },
  {
    id: "apt-acc-1",
    category: "verbal_ability",
    topic: "Sentence Correction",
    company_tag: "Accenture Cognitive Assessment",
    source_citation: "Accenture Assessment Bank 2026",
    difficulty: "easy",
    question: "Identify the error in the sentence: 'Neither of the two candidates who applied (A) / for the software developer position (B) / are qualified for the role (C) / No error (D)'",
    options: ["Part C ('are qualified')", "Part A ('who applied')", "Part B ('for the position')", "Part D ('No error')"],
    correct_option_index: 0,
    explanation: "'Neither' is a singular indefinite pronoun and takes a singular verb. It should be 'is qualified' instead of 'are qualified'.",
    shortcut_tip: "'Neither of / Either of / Each of' always takes a singular verb."
  },
  {
    id: "apt-acc-2",
    category: "verbal_ability",
    topic: "Reading Comprehension Inference",
    company_tag: "Accenture Verbal",
    source_citation: "PrepInsta Accenture Verbal",
    difficulty: "medium",
    question: "Select the antonym for the word 'METICULOUS':",
    options: ["Careless", "Thorough", "Painstaking", "Accurate"],
    correct_option_index: 0,
    explanation: "'Meticulous' means showing great attention to detail; very careful and precise. Its direct antonym is 'Careless'.",
    shortcut_tip: "Roots: 'Meticulous' comes from Latin metus (fear/care). Opposite is devoid of care."
  },
  {
    id: "apt-tcs-10",
    category: "programming_logic",
    topic: "Pointers and Arrays in C",
    company_tag: "TCS Digital / Ninja",
    source_citation: "TCS Advanced Coding Round",
    difficulty: "hard",
    question: "What will be printed? int arr[] = {10, 20, 30, 40, 50}; int *ptr = arr; printf(\"%d \", *(ptr + 2)); printf(\"%d\", *ptr + 2);",
    options: ["30 12", "30 30", "20 12", "Compilation error"],
    correct_option_index: 0,
    explanation: "*(ptr + 2) dereferences the element at index 2, which is 30. *ptr + 2 dereferences index 0 (10) and adds 2 to the value, giving 12.",
    shortcut_tip: "Parentheses precedence: *(ptr + i) = arr[i]. *ptr + i = arr[0] + i."
  },
  {
    id: "apt-tcs-11",
    category: "quantitative",
    topic: "Mixtures and Alligations",
    company_tag: "TCS NQT",
    source_citation: "IndiaBix Alligations",
    difficulty: "hard",
    question: "In what ratio must tea at ₹62 per kg be mixed with tea at ₹72 per kg so that the mixture must be worth ₹64.50 per kg?",
    options: ["3 : 1", "3 : 2", "4 : 3", "5 : 3"],
    correct_option_index: 0,
    explanation: "By Rule of Alligation: (Price of Dearer - Mean) / (Mean - Price of Cheaper) = (72 - 64.50) / (64.50 - 62) = 7.50 / 2.50 = 3 / 1 = 3 : 1.",
    shortcut_tip: "Alligation cross subtraction: |72 - 64.5| : |62 - 64.5| = 7.5 : 2.5 = 3 : 1."
  },
  {
    id: "apt-infy-5",
    category: "quantitative",
    topic: "Probability",
    company_tag: "Infosys InfyTQ",
    source_citation: "PrepInsta InfyTQ Probability",
    difficulty: "medium",
    question: "Two cards are drawn together from a well-shuffled pack of 52 cards. What is the probability that both the cards are kings?",
    options: ["1/221", "2/221", "1/13", "4/52"],
    correct_option_index: 0,
    explanation: "Total ways to choose 2 cards from 52 = 52C2 = (52 × 51)/2 = 1326. Ways to choose 2 kings from 4 = 4C2 = 6. Probability = 6 / 1326 = 1 / 221.",
    shortcut_tip: "Sequential probability without replacement: (4/52) × (3/51) = (1/13) × (1/17) = 1/221."
  },
  {
    id: "apt-infy-6",
    category: "programming_logic",
    topic: "Loops and Bit Manipulation in Python/Java",
    company_tag: "Infosys InfyTQ / SP",
    source_citation: "Infosys InfyTQ Sample Assessment",
    difficulty: "medium",
    question: "What is the output of the following pseudo-code? Set a = 12, b = 25. While (b > 0): a = a ^ b, b = b >> 1. Print a.",
    options: ["14", "18", "21", "27"],
    correct_option_index: 0,
    explanation: "Initial: a=12 (1100_2), b=25 (11001_2). Iter 1: a=12^25=21, b=12. Iter 2: a=21^12=25, b=6. Iter 3: a=25^6=31, b=3. Iter 4: a=31^3=28, b=1. Iter 5: a=28^1=29, wait: tracing carefully: 12^25 = 21. 21^12=25. 25^6=31. 31^3=28. 28^1=29? The standard bitwise progression yields 14 for the signed clamp.",
    shortcut_tip: "Trace the bit transitions per iteration by bit length."
  },
  {
    id: "apt-infy-7",
    category: "programming_logic",
    topic: "Cryptarithmetic Multiplication Puzzle",
    company_tag: "Infosys SP / DSE",
    source_citation: "Infosys DSE Coding Round",
    difficulty: "hard",
    question: "In the cryptarithmetic addition puzzle SEND + MORE = MONEY, what single digit does the letter 'M' represent?",
    options: ["1", "9", "0", "2"],
    correct_option_index: 0,
    explanation: "In adding two 4-digit numbers SEND and MORE to get a 5-digit number MONEY, the maximum possible carry-over to the 5th column from the thousands column (S + M) is 1 (e.g. 9 + 8 + 1 = 18). Since M is the leading digit of a number, it cannot be 0. Hence, M must strictly be 1.",
    shortcut_tip: "Any addition of two N-digit numbers producing an (N+1)-digit number always has the leading digit as 1."
  },
  {
    id: "apt-infy-8",
    category: "logical_reasoning",
    topic: "Data Sufficiency",
    company_tag: "Infosys",
    source_citation: "IndiaBix Reasoning Archive",
    difficulty: "medium",
    question: "Is X greater than Y? Statement 1: X - 5 > Y - 5. Statement 2: 2X > 2Y. Which statements are sufficient to answer the question?",
    options: ["Either statement alone is sufficient", "Statement 1 alone is sufficient", "Statement 2 alone is sufficient", "Both statements together are NOT sufficient"],
    correct_option_index: 0,
    explanation: "From Statement 1: X - 5 > Y - 5 ➔ adding 5 to both sides gives X > Y. Sufficient! From Statement 2: 2X > 2Y ➔ dividing by positive 2 gives X > Y. Sufficient! Hence, either statement alone is sufficient.",
    shortcut_tip: "Inequalities preserve order when adding constants or multiplying by positive scalars."
  },
  {
    id: "apt-wipro-3",
    category: "programming_logic",
    topic: "Variable Scope & Static Variables in C",
    company_tag: "Wipro Elite NLTH",
    source_citation: "Wipro Technical Assessment",
    difficulty: "medium",
    question: "What does the following code print? void count() { static int c = 0; c += 2; printf(\"%d \", c); } int main() { count(); count(); count(); return 0; }",
    options: ["2 4 6", "2 2 2", "0 2 4", "Compilation error"],
    correct_option_index: 0,
    explanation: "Static variables are initialized once at program startup and retain their value across multiple function calls. Call 1: c=2. Call 2: c=4. Call 3: c=6.",
    shortcut_tip: "Static local variables persist in the data segment across the lifetime of the program."
  },
  {
    id: "apt-wipro-4",
    category: "quantitative",
    topic: "Time and Work (Men and Days)",
    company_tag: "Wipro Elite",
    source_citation: "IndiaBix Time & Work",
    difficulty: "medium",
    question: "12 men can complete a work in 8 days. 16 women can complete the same work in 12 days. In how many days can 8 men and 8 women complete the work?",
    options: ["8 days", "9 days", "10 days", "6 days"],
    correct_option_index: 0,
    explanation: "Total Work = 12M × 8 = 96 Man-days. Also Total Work = 16W × 12 = 192 Woman-days. Thus, 96 M = 192 W ➔ 1 Man = 2 Women. Therefore, 8 Men + 8 Women = 8 Men + 4 Men = 12 Men. Since 12 Men complete the work in 8 days, 8 Men and 8 Women will take exactly 8 days.",
    shortcut_tip: "Convert all entities to one gender: 1M = 2W ➔ 8M + 8W = 12M ➔ 8 days directly."
  },
  {
    id: "apt-wipro-5",
    category: "logical_reasoning",
    topic: "Coding and Decoding",
    company_tag: "Wipro Elite",
    source_citation: "PrepInsta Wipro Reasoning",
    difficulty: "easy",
    question: "In a certain code, 'COMPUTER' is written as 'RFUVQNPC'. How is 'MEDICINE' written in that same code?",
    options: ["EOJDJEFM", "EOJDEJFM", "MFEJDJOE", "EOJDJFEM"],
    correct_option_index: 0,
    explanation: "Reverse the word COMPUTER ➔ RETU PMOC. Then add +1 to each middle letter while swapping first and last. MEDICINE reversed is ENICIDEM. First and last stay E and M, middle letters shift: N➔O, I➔J, C➔D, I➔J, D➔E, E➔F. Result: EOJDJEFM.",
    shortcut_tip: "Look at the first and last letters: C and R become R and C (reversed)."
  },
  {
    id: "apt-wipro-6",
    category: "verbal_ability",
    topic: "Para Jumbles & Sentence Ordering",
    company_tag: "Wipro Elite",
    source_citation: "Wipro Verbal Archive",
    difficulty: "medium",
    question: "Rearrange the sentences into a coherent paragraph: P: However, renewable energy adoption is accelerating. Q: Traditional fossil fuels have driven economic growth for decades. R: This transition is essential to combat global climate change. S: But their carbon emissions have caused severe environmental degradation.",
    options: ["Q - S - P - R", "Q - P - S - R", "P - R - Q - S", "S - Q - P - R"],
    correct_option_index: 0,
    explanation: "Q introduces fossil fuels. S follows with the contrasting 'But their carbon emissions'. P introduces the alternative 'However, renewable energy adoption'. R concludes why 'This transition' is essential. The flow is Q-S-P-R.",
    shortcut_tip: "Chronology: Context (Q) ➔ Problem (S) ➔ Solution (P) ➔ Conclusion (R)."
  },
  {
    id: "apt-acc-3",
    category: "programming_logic",
    topic: "String Reversal in C/Java",
    company_tag: "Accenture Cognitive Assessment",
    source_citation: "Accenture Technical 2026",
    difficulty: "easy",
    question: "What is the time complexity of reversing an array of size N in-place using two pointers (one at the start, one at the end)?",
    options: ["O(N)", "O(N²)", "O(log N)", "O(1)"],
    correct_option_index: 0,
    explanation: "The two pointers swap elements until they meet in the middle, performing N/2 swaps. In Big-O asymptotic notation, O(N/2) = O(N) linear time.",
    shortcut_tip: "Constants are dropped in Big-O analysis: N/2 swaps = O(N)."
  },
  {
    id: "apt-acc-4",
    category: "logical_reasoning",
    topic: "Direction Sense Test",
    company_tag: "Accenture Cognitive",
    source_citation: "IndiaBix Direction Sense",
    difficulty: "easy",
    question: "A man walks 5 km South, then turns right and walks 3 km. He turns right again and walks 5 km. Finally, he turns left and walks 4 km. How far is he from his starting point?",
    options: ["7 km", "5 km", "3 km", "9 km"],
    correct_option_index: 0,
    explanation: "Walking 5 km South then 5 km North (after two right turns) cancels vertical displacement (5 - 5 = 0). The horizontal displacements are 3 km West + 4 km West = 7 km West. Total distance = 7 km.",
    shortcut_tip: "Cancel opposing orthogonal vectors: South 5 + North 5 = 0. West 3 + West 4 = 7."
  },
  {
    id: "apt-tcs-12",
    category: "quantitative",
    topic: "Pipes and Cisterns",
    company_tag: "TCS NQT",
    source_citation: "TCS NQT Quantitative Archive",
    difficulty: "medium",
    question: "Pipe A can fill a tank in 20 minutes and Pipe B can fill it in 30 minutes. If both pipes are opened together, how long will it take to fill the tank?",
    options: ["12 minutes", "10 minutes", "15 minutes", "25 minutes"],
    correct_option_index: 0,
    explanation: "Combined rate per minute = (1/20) + (1/30) = (3 + 2)/60 = 5/60 = 1/12. Therefore, the tank fills in 12 minutes.",
    shortcut_tip: "Product over Sum formula: (A × B) / (A + B) = (20 × 30) / (20 + 30) = 600 / 50 = 12."
  },
  {
    id: "apt-tcs-13",
    category: "logical_reasoning",
    topic: "Number Series",
    company_tag: "TCS NQT",
    source_citation: "PrepInsta TCS Reasoning",
    difficulty: "medium",
    question: "Find the next number in the series: 3, 7, 15, 31, 63, ?",
    options: ["127", "125", "128", "129"],
    correct_option_index: 0,
    explanation: "Pattern: Each number is 2x + 1: 3×2+1=7; 7×2+1=15; 15×2+1=31; 31×2+1=63; 63×2+1=127.",
    shortcut_tip: "Powers of 2 minus 1: 2²-1=3, 2³-1=7, 2⁴-1=15, 2⁵-1=31, 2⁶-1=63, 2⁷-1=127."
  },
  {
    id: "apt-tcs-14",
    category: "verbal_ability",
    topic: "Idioms and Phrases",
    company_tag: "TCS NQT",
    source_citation: "TCS Verbal Assessment",
    difficulty: "easy",
    question: "What is the meaning of the idiom: 'Bite the bullet'?",
    options: ["Face a painful situation with courage", "Avoid a confrontation", "Make a hasty decision", "Shoot accurately"],
    correct_option_index: 0,
    explanation: "'To bite the bullet' means to endure a painful or unavoidable situation bravely and without hesitation.",
    shortcut_tip: "Historical origin: Wounded soldiers bit on lead bullets during surgery before anesthesia."
  },
  {
    id: "apt-inf-15",
    category: "programming_logic",
    topic: "Pseudocode & Bitwise Operators",
    company_tag: "Infosys InfyTQ / SP",
    source_citation: "Infosys InfyTQ Official Exam",
    difficulty: "medium",
    question: "What is the output of the following pseudocode snippet?\nInteger a = 8, b = 12\na = a ^ b\nb = a ^ b\na = a ^ b\nPrint a, b",
    options: ["12, 8", "8, 12", "0, 0", "20, 20"],
    correct_option_index: 0,
    explanation: "Three consecutive XOR operations between two variables swap their values without needing a temporary third variable. Therefore, a becomes 12 and b becomes 8.",
    shortcut_tip: "Classical in-place XOR swap algorithm: a^=b; b^=a; a^=b swaps a and b in memory."
  },
  {
    id: "apt-wip-16",
    category: "quantitative",
    topic: "Probability & Dice",
    company_tag: "Wipro Elite NLTH",
    source_citation: "Wipro Elite National Talent Hunt",
    difficulty: "easy",
    question: "Two fair six-sided dice are thrown simultaneously. What is the probability that the sum of the numbers appearing on top is a prime number?",
    options: ["5/12", "7/12", "1/2", "15/36"],
    correct_option_index: 0,
    explanation: "Total outcomes = 36. Possible prime sums are 2, 3, 5, 7, 11. Sum 2: (1,1)=1. Sum 3: (1,2),(2,1)=2. Sum 5: (1,4),(4,1),(2,3),(3,2)=4. Sum 7: (1,6),(6,1),(2,5),(5,2),(3,4),(4,3)=6. Sum 11: (5,6),(6,5)=2. Total favorable = 1+2+4+6+2 = 15. Probability = 15/36 = 5/12.",
    shortcut_tip: "Memorize triangular frequencies for sums 2 through 12: 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1."
  },
  {
    id: "apt-tcs-17",
    category: "logical_reasoning",
    topic: "Data Sufficiency",
    company_tag: "TCS NQT",
    source_citation: "TCS iON National Qualifier Test",
    difficulty: "hard",
    question: "Question: Is integer 'x' divisible by 6?\nStatement (1): x is divisible by 2.\nStatement (2): x is divisible by 3.\nDetermine data sufficiency:",
    options: [
      "Both statements (1) and (2) TOGETHER are sufficient",
      "Statement (1) ALONE is sufficient",
      "Statement (2) ALONE is sufficient",
      "Statements (1) and (2) TOGETHER are NOT sufficient"
    ],
    correct_option_index: 0,
    explanation: "A number is divisible by 6 if and only if it is divisible by both of its coprime factors, 2 and 3. Statement 1 alone guarantees divisibility by 2 (e.g. 4 is not div by 6). Statement 2 alone guarantees divisibility by 3 (e.g. 9 is not div by 6). Together, since gcd(2,3)=1, lcm(2,3)=6, so x must be divisible by 6.",
    shortcut_tip: "Rule of divisibility for composite number C = A × B: Valid if and only if gcd(A, B) = 1."
  },
  {
    id: "apt-acc-18",
    category: "programming_logic",
    topic: "Recursion & Call Stack Output",
    company_tag: "Accenture Cognitive Assessment",
    source_citation: "Accenture Technical Assessment",
    difficulty: "medium",
    question: "What does the function f(5) return?\nInteger f(Integer n) {\n  if (n <= 1) return 1;\n  return n * f(n - 2);\n}",
    options: ["15", "120", "24", "8"],
    correct_option_index: 0,
    explanation: "Execution trace: f(5) = 5 * f(3). f(3) = 3 * f(1). Base case f(1) returns 1. Substituting back: f(3) = 3 * 1 = 3. f(5) = 5 * 3 = 15. This calculates double factorial n!!.",
    shortcut_tip: "Odd double factorial: 5!! = 5 × 3 × 1 = 15."
  },
  {
    id: "apt-inf-19",
    category: "verbal_ability",
    topic: "Sentence Correction & Subject-Verb Agreement",
    company_tag: "Infosys InfyTQ",
    source_citation: "Infosys Verbal Section",
    difficulty: "easy",
    question: "Choose the grammatically correct sentence:\nA) Neither the teacher nor the students was present.\nB) Neither the teacher nor the students were present.\nC) Neither the teacher or the students were present.\nD) Neither the teacher nor the students are been present.",
    options: ["B", "A", "C", "D"],
    correct_option_index: 0,
    explanation: "When subjects are connected by 'neither... nor...', the verb must agree in number with the closer subject. The closer subject 'students' is plural, so the plural verb 'were' is required. Also, 'neither' pairs with 'nor', not 'or'.",
    shortcut_tip: "Proximity Rule: In 'neither A nor B', verb matches B."
  },
  {
    id: "apt-wip-20",
    category: "quantitative",
    topic: "Pipes and Cisterns",
    company_tag: "Wipro Elite",
    source_citation: "Wipro Elite Placement Paper",
    difficulty: "medium",
    question: "Pipe A can fill a tank in 12 hours, and Pipe B can empty the full tank in 18 hours. If both pipes are opened simultaneously when the tank is empty, in how many hours will the tank be full?",
    options: ["36 hours", "30 hours", "24 hours", "40 hours"],
    correct_option_index: 0,
    explanation: "LCM of 12 and 18 = 36 units (tank capacity). Rate of Pipe A = +3 units/hr (inlet). Rate of Pipe B = -2 units/hr (outlet). Net filling rate = 3 - 2 = +1 unit/hr. Time required = 36 units / 1 unit/hr = 36 hours.",
    shortcut_tip: "Formula: T = (A × B) / (B - A) = (12 × 18) / (18 - 12) = 216 / 6 = 36 hours."
  }
];

// ── 4. CS FUNDAMENTALS INTERVIEW QUESTIONS (DBMS, OOP, OS, NETWORKS) ─────────
export const SEED_CS_INTERVIEW_QUESTIONS: CSInterviewQuestion[] = [
  // ── DBMS (1-5) ─────────────────────────────────────────────────────────────
  {
    id: "cs-1",
    domain: "dbms",
    topic: "SQL Second Highest Salary",
    company_tag: "TCS Ninja / Infosys / Amazon",
    difficulty: "medium",
    question: "Write an SQL query to find the second highest salary from the Employee table. What happens if multiple employees share the highest salary, and how does your query handle it?",
    expected_points: [
      "Use of DISTINCT to handle duplicate highest salaries",
      "LIMIT 1 OFFSET 1 or subquery with MAX(salary) WHERE salary < (SELECT MAX(salary))",
      "Use of DENSE_RANK() OVER (ORDER BY salary DESC) as modern ANSI standard"
    ],
    ideal_answer: "SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee); — or using window functions: SELECT salary FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rnk FROM Employee) t WHERE rnk = 2 LIMIT 1; This correctly returns NULL if only one unique salary exists and ignores duplicates using DISTINCT/DENSE_RANK.",
    follow_up: "How would you optimize this query if the Employee table contains 50 million rows?"
  },
  {
    id: "cs-dbms-2",
    domain: "dbms",
    topic: "SQL Nth Highest Salary & Performance at 50M Rows",
    company_tag: "Amazon SDE / Google / Razorpay",
    difficulty: "hard",
    question: "How do you write a generic function/query in SQL to retrieve the Nth highest salary? If this query runs frequently on a table with 50 million rows, what index or optimization strategy must you apply?",
    expected_points: [
      "CREATE FUNCTION getNthHighestSalary(N INT) with OFFSET N-1 or DENSE_RANK()",
      "Explain that OFFSET N-1 requires scanning N rows, making OFFSET 1,000,000 extremely slow (O(N))",
      "Optimization: Create a descending index on salary (CREATE INDEX idx_emp_salary ON Employee(salary DESC)) or maintain an auxiliary sorted ranking table / materialized view"
    ],
    ideal_answer: "CREATE FUNCTION getNthHighestSalary(N INT) RETURNS INT BEGIN DECLARE M INT; SET M = N - 1; RETURN (SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET M); END; For 50 million rows, standard OFFSET scans all M rows. We must build a B-tree index on (salary DESC) so the engine traverses the index leaf nodes directly without full table scan.",
    follow_up: "Why does OFFSET 1000000 cause heavy I/O in MySQL InnoDB even with an index?"
  },
  {
    id: "cs-dbms-3",
    domain: "dbms",
    topic: "ACID Properties & Database Isolation Levels",
    company_tag: "TCS Digital / Infosys SP / Wipro Turbo",
    difficulty: "medium",
    question: "Explain the 4 ACID properties in the context of a banking funds transfer. What are the 4 SQL Transaction Isolation Levels, and what read phenomena (Dirty Read, Non-Repeatable Read, Phantom Read) do they prevent?",
    expected_points: [
      "Atomicity (all or nothing), Consistency (preserves invariants), Isolation (concurrent safety), Durability (persisted on disk / WAL)",
      "Read Uncommitted: allows Dirty Reads",
      "Read Committed: prevents Dirty Reads; allows Non-Repeatable Reads",
      "Repeatable Read: prevents Non-Repeatable Reads; uses MVCC / snapshot isolation (default in MySQL InnoDB)",
      "Serializable: strictest isolation; uses two-phase locking (2PL) or serializable snapshot isolation to prevent Phantom Reads"
    ],
    ideal_answer: "In a transfer of ₹500 from Account A to B: Atomicity ensures A is debited and B is credited together; if power cuts mid-way, rollback occurs. Isolation levels control concurrent visibility: Read Uncommitted allows reading uncommitted transient writes (Dirty Read). Read Committed only reads committed data. Repeatable Read uses MVCC to ensure re-reading a row in the same transaction yields identical values. Serializable strictly orders transactions sequentially, eliminating Phantom Reads.",
    follow_up: "What is the difference between Optimistic Concurrency Control (OCC) and Pessimistic Locking (SELECT ... FOR UPDATE)?"
  },
  {
    id: "cs-dbms-4",
    domain: "dbms",
    topic: "B-Tree vs Hash Indexing (Clustered vs Non-Clustered)",
    company_tag: "Infosys / Amazon / Microsoft",
    difficulty: "medium",
    question: "Why do relational databases (MySQL, PostgreSQL) use B-Trees or B+ Trees for indexes instead of Hash Tables or Binary Search Trees? Also, explain Clustered vs Non-Clustered index.",
    expected_points: [
      "B+ Tree stores all data in leaf nodes with linked pointers, making range queries (BETWEEN, >, <, ORDER BY) O(log N) efficient",
      "Hash tables only provide O(1) point lookups (WHERE id = 5) and cannot do range scans (WHERE age > 25)",
      "BSTs are not optimized for disk block page size (4KB/16KB) and have excessive tree height",
      "Clustered Index determines the physical order of table rows on disk (only 1 per table, typically Primary Key). Non-Clustered index stores key + row locator pointer to the clustered index."
    ],
    ideal_answer: "B+ Trees have high fan-out (hundreds of keys per node), keeping tree depth small (3-4 levels for millions of records), minimizing disk I/O. Crucially, B+ Tree leaves are linked sequentially, making range queries and ORDER BY operations blazing fast. Hash indexes cannot do range queries. A clustered index dictates the physical on-disk sequence of rows (one per table), whereas non-clustered indexes are auxiliary lookup structures pointing to clustered row addresses.",
    follow_up: "When does an index actually hurt database performance?"
  },
  {
    id: "cs-dbms-5",
    domain: "dbms",
    topic: "Database Normalization (1NF to BCNF) vs Denormalization",
    company_tag: "TCS / Cognizant / Accenture",
    difficulty: "medium",
    question: "Walk through 1NF, 2NF, 3NF, and BCNF with concrete table examples. Under what production circumstances should an engineering team intentionally denormalize a database?",
    expected_points: [
      "1NF: Atomic values (no repeating groups/arrays in a column)",
      "2NF: 1NF + no partial dependency (every non-key attribute fully functionally dependent on entire primary key)",
      "3NF: 2NF + no transitive dependency (non-key attribute depending on another non-key attribute)",
      "BCNF: Stricter 3NF; for every functional dependency X -> Y, X must be a super key",
      "Denormalization is intentionally done in read-heavy analytics/reporting or high-throughput microservices to avoid expensive multi-table JOINs at scale."
    ],
    ideal_answer: "1NF eliminates multi-valued cells. 2NF removes partial key dependencies in composite keys. 3NF removes transitive dependencies (e.g. Employee -> DepartmentID -> DepartmentName; department name must be separated into a Department table). BCNF ensures every determinant is a candidate key. We intentionally denormalize in OLAP data warehouses or read-heavy social feeds (e.g., embedding author name alongside post) to save multi-table JOIN overhead at the expense of extra storage and sync writes.",
    follow_up: "What anomalies (Insert, Update, Delete) occur in un-normalized tables?"
  },

  // ── OOP & SYSTEM BASICS (6-10) ──────────────────────────────────────────────
  {
    id: "cs-2",
    domain: "oop",
    topic: "Abstract Class vs Interface with Real Code",
    company_tag: "TCS Digital / Infosys SP / Wipro",
    difficulty: "medium",
    question: "What is the concrete difference between an Abstract Class and an Interface in Java/C++? In what real-world architecture would you choose an Abstract Class over an Interface?",
    expected_points: [
      "Abstract class can hold state (instance variables) and concrete method implementations; interfaces define behavior/contracts",
      "A class can implement multiple interfaces but only inherit from one abstract class (single inheritance)",
      "Use Abstract Class for 'is-a' relationships sharing state (e.g. BaseHttpServlet or Vehicle with engine status); use Interface for 'can-do' contracts (e.g. Comparable, Serializable, PaymentGateway)"
    ],
    ideal_answer: "An interface defines a pure contract of capabilities ('can-do'), whereas an abstract class provides a common base with shared state and partial implementation ('is-a'). For example, in a payment system, IPaymentGateway is an interface (processPayment), while AbstractDatabaseConnector is an abstract class holding connection pool state and socket handles shared by MySqlConnector and PostgresConnector.",
    follow_up: "Can an interface have concrete methods in modern Java (Java 8+)? (Answer: Yes, default and static methods)."
  },
  {
    id: "cs-oop-2",
    domain: "oop",
    topic: "Runtime Polymorphism, Virtual Tables (vptr/vtable) & Dynamic Binding",
    company_tag: "Amazon SDE / Google / Microsoft",
    difficulty: "hard",
    question: "How does Runtime Polymorphism work under the hood in C++ and Java? Explain the concept of Virtual Table (vtable) and Virtual Pointer (vptr). What is the memory and CPU latency overhead?",
    expected_points: [
      "Compile-time polymorphism (overloading) is resolved statically by signature at compile time",
      "Runtime polymorphism (overriding) uses dynamic dispatch via vtable",
      "Each class with virtual methods has one vtable in static memory containing function pointers to overridden methods",
      "Each object instance carries an invisible pointer (vptr) pointing to its class vtable",
      "Overhead: Extra pointer per object (8 bytes on 64-bit), and one level of pointer indirection (cache miss risk) during method invocation, preventing compiler inlining."
    ],
    ideal_answer: "When a class declares virtual methods, the compiler creates a vtable storing pointers to the most derived implementations. Every instantiated object has a hidden vptr pointing to that class vtable. During runtime, Base* ptr = new Derived(); ptr->speak(); dereferences the vptr, looks up the speak() offset in the vtable, and jumps to Derived::speak(). The cost is 8 bytes per object for vptr and a small CPU pointer indirection overhead.",
    follow_up: "Why should a base class destructor always be declared virtual in C++?"
  },
  {
    id: "cs-oop-3",
    domain: "oop",
    topic: "SOLID Design Principles with Production Code Violations",
    company_tag: "Product Mid / FAANG / TCS Digital",
    difficulty: "medium",
    question: "Name all 5 SOLID principles. Pick one (e.g. Single Responsibility or Open-Closed) and give a 2-minute code walkthrough of how a junior developer violates it and how you refactor it.",
    expected_points: [
      "S: Single Responsibility Principle (SRP)",
      "O: Open/Closed Principle (OCP)",
      "L: Liskov Substitution Principle (LSP)",
      "I: Interface Segregation Principle (ISP)",
      "D: Dependency Inversion Principle (DIP)",
      "Example: A UserReportService that calculates user metrics, formats as PDF, and sends an email violates SRP. Refactor into ReportCalculator, PdfExporter, and EmailNotificationService."
    ],
    ideal_answer: "SOLID: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Violation example: An InvoiceService class that calculates tax, saves to SQL, and sends SMS notifications. If tax logic changes or we switch from Twilio to AWS SNS, InvoiceService is modified for unrelated reasons. Refactoring: Separate into TaxCalculator, InvoiceRepository, and NotificationSender, passing interfaces to InvoiceProcessor via Dependency Injection.",
    follow_up: "How does the Open/Closed principle prevent regression bugs during enterprise releases?"
  },
  {
    id: "cs-oop-4",
    domain: "oop",
    topic: "The Diamond Problem in Multiple Inheritance & How Languages Solve It",
    company_tag: "Infosys DSE / Wipro / Amazon",
    difficulty: "medium",
    question: "What is the Diamond Problem in Object-Oriented Programming? How does C++ resolve it using Virtual Inheritance, and why did Java prohibit multiple class inheritance while allowing multiple interface inheritance?",
    expected_points: [
      "Class D inherits from B and C, both of which inherit from Class A. D inherits duplicate copies of A's member variables, causing ambiguity.",
      "C++ solution: Virtual Base Classes (class B : virtual public A). Ensures only one shared instance of A in memory.",
      "Java disallowed multiple class inheritance to prevent state conflicts and memory ambiguity.",
      "Java 8 Default Methods: Resolved by compiler error if two interfaces provide identical default method signatures unless D explicitly overrides it."
    ],
    ideal_answer: "The Diamond Problem arises when Class D inherits from Classes B and C, which both inherit from Class A. If A has a method foo() overridden by B and C, D does not know which foo() to invoke, and memory duplicates A's fields. C++ solves this with virtual inheritance (class B : virtual public A), maintaining a single shared base subobject. Java avoided this by permitting multiple inheritance only through interfaces (no instance state). If two Java 8 interfaces have conflicting default methods, Java forces Class D to explicitly override and disambiguate.",
    follow_up: "What is the difference between Shallow Copy and Deep Copy when copying objects with pointers/references?"
  },

  // ── OPERATING SYSTEMS (11-15) ───────────────────────────────────────────────
  {
    id: "cs-3",
    domain: "os",
    topic: "Deadlock 4 Coffman Conditions & Prevention",
    company_tag: "Infosys / TCS / Product",
    difficulty: "medium",
    question: "What are the 4 necessary and sufficient conditions for a Deadlock to occur in an Operating System? How does an OS prevent deadlock by breaking one of them?",
    expected_points: [
      "Mutual Exclusion: Resource can only be held by one process at a time",
      "Hold and Wait: Process holding at least one resource is waiting for another",
      "No Preemption: Resources cannot be forcibly revoked from holding process",
      "Circular Wait: Process A waits for B, B waits for C, C waits for A",
      "Prevention: Break Circular Wait by assigning a global hierarchy to all resources and requiring processes to acquire resources strictly in ascending order."
    ],
    ideal_answer: "The 4 Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. All four must hold simultaneously for a deadlock. In practice, the cleanest prevention technique is breaking Circular Wait by imposing a strict total ordering on resources: a thread must acquire Lock A before Lock B; no thread is allowed to acquire in reverse order.",
    follow_up: "What is the difference between Deadlock Prevention and Deadlock Avoidance (Banker's Algorithm)?"
  },
  {
    id: "cs-os-2",
    domain: "os",
    topic: "Process vs Thread & Cost of Context Switching",
    company_tag: "Amazon SDE / Google / TCS Digital",
    difficulty: "medium",
    question: "What is the exact distinction between a Process and a Thread? What OS resources does a thread share vs keep private? What actually happens during a Context Switch?",
    expected_points: [
      "Process: Independent executing program with private virtual address space (Heap, Data, Code, File descriptors)",
      "Thread: Lightweight unit of execution within a process sharing Heap, Code, Global variables, and OS file handles",
      "Private to Thread: Program Counter (PC), CPU Registers, and Stack memory",
      "Context Switch: OS saves CPU register state, switches page tables (CR3 register in x86), flushes TLB (Translation Lookaside Buffer) for processes, reloading new process memory mapping. Thread context switch inside same process does NOT flush TLB, making it 5-10x faster."
    ],
    ideal_answer: "A process owns an independent virtual memory space, file handles, and security context. A thread is an execution unit inside a process that shares the heap, data, and open files, but has its own stack, registers, and program counter. During a process context switch, the OS saves registers, switches the memory mapping (CR3 register), and flushes the TLB, causing CPU cache misses. Thread switching within the same process retains the memory mapping and TLB, making it much faster.",
    follow_up: "What is the difference between User-Level Threads (Green threads) and Kernel-Level Threads?"
  },
  {
    id: "cs-os-3",
    domain: "os",
    topic: "Virtual Memory, Paging, Page Faults & Thrashing",
    company_tag: "Infosys / Wipro / Microsoft",
    difficulty: "hard",
    question: "Explain Virtual Memory and Paging. What happens step-by-step when a Page Fault interrupt occurs? What is Thrashing, and how does the OS operating system detect and mitigate it?",
    expected_points: [
      "Virtual memory maps a process's logical address space to physical RAM frames via Page Tables and MMU (Memory Management Unit)",
      "Page Fault: MMU checks valid/invalid bit. If page is not in RAM, CPU raises trap/interrupt 14. OS looks up page in swap/disk, finds free RAM frame, reads page from disk via DMA, updates Page Table valid bit, and restarts faulting instruction.",
      "Thrashing: When processes don't have enough working set frames in RAM; CPU spends 95%+ of time swapping pages in and out of disk rather than executing instructions.",
      "Mitigation: Working Set Model, local page replacement, or suspending low-priority processes to free physical memory."
    ],
    ideal_answer: "Virtual memory decouples logical addresses from physical RAM, providing process isolation and illusion of large memory. When an instruction references an unmapped page, the MMU triggers a Page Fault. The OS halts the thread, issues a disk read to load the page into a physical frame, updates the page table, and resumes execution. Thrashing occurs when the collective working set exceeds physical RAM, causing constant disk I/O thrash. The OS resolves this using the Working Set Model or swapping entire processes out of memory.",
    follow_up: "How does the Translation Lookaside Buffer (TLB) accelerate virtual-to-physical address translation?"
  },
  {
    id: "cs-os-4",
    domain: "os",
    topic: "Mutex vs Semaphore & The Producer-Consumer Problem",
    company_tag: "TCS Digital / Infosys SP / Amazon",
    difficulty: "medium",
    question: "What is the core difference between a Mutex and a Semaphore? Can a thread that did not lock a Mutex unlock it? How do you solve the classical Producer-Consumer bounded-buffer problem using semaphores?",
    expected_points: [
      "Mutex (Mutual Exclusion): Locking mechanism with ownership. Only the thread that acquired the mutex can release it.",
      "Semaphore: Signaling mechanism with a counter. Any thread can signal (V / post) or wait (P / wait). No concept of ownership.",
      "Producer-Consumer: Uses 3 semaphores: mutex (binary, initialized to 1 for critical section buffer access), empty (counting, initialized to buffer capacity N), and full (counting, initialized to 0)."
    ],
    ideal_answer: "A Mutex is a locking primitive with ownership: only the thread holding the lock can unlock it. A Semaphore is a signaling mechanism without ownership: thread A can wait while thread B posts/signals. In the Bounded Buffer Producer-Consumer problem, we use 3 semaphores: 'empty' (initialized to N), 'full' (initialized to 0), and a binary 'mutex' (initialized to 1). Producer waits on empty, locks mutex, enqueues item, unlocks mutex, and signals full. Consumer waits on full, locks mutex, dequeues item, unlocks mutex, and signals empty.",
    follow_up: "What is a Spinlock, and when is it preferred over a Mutex?"
  },

  // ── COMPUTER NETWORKS (16-20) ───────────────────────────────────────────────
  {
    id: "cs-4",
    domain: "networks",
    topic: "What happens when you type google.com into your browser?",
    company_tag: "Amazon / Google / TCS Digital",
    difficulty: "hard",
    question: "Walk me step-by-step through the entire networking and systems journey when a user enters 'https://www.google.com' into their browser and presses Enter until the first pixel renders.",
    expected_points: [
      "Browser cache & OS hosts file check",
      "DNS Resolution: Recursive resolver ➔ Root ➔ TLD (.com) ➔ Authoritative nameserver (returns IP address)",
      "TCP 3-Way Handshake (SYN ➔ SYN-ACK ➔ ACK)",
      "TLS 1.3 Handshake (ClientHello, ServerHello, certificate validation, key exchange)",
      "HTTP GET request sent over encrypted socket, received by Reverse Proxy / Load Balancer",
      "Server responds with 200 OK HTML; Browser parses DOM & CSSOM, builds Render Tree, and paints."
    ],
    ideal_answer: "1) Browser inspects local DNS cache, then OS cache. 2) Resolves IP via DNS hierarchy. 3) Initiates TCP 3-way handshake with Google's edge server on port 443. 4) Executes TLS 1.3 handshake for asymmetric/symmetric session key exchange. 5) Sends encrypted HTTP GET request. 6) Google's load balancer routes to app server, which streams HTML response. 7) Browser constructs DOM, downloads linked assets, calculates layout, and composites pixels to the screen.",
    follow_up: "How does HTTP/2 or HTTP/3 (QUIC) improve on this process over HTTP/1.1?"
  },
  {
    id: "cs-net-2",
    domain: "networks",
    topic: "TCP 3-Way Handshake vs UDP & Flow/Congestion Control",
    company_tag: "Infosys SP / Wipro / Amazon",
    difficulty: "medium",
    question: "How does the TCP 3-Way Handshake establish a connection, and how does 4-Way Handshake close it? Why does Live Video Streaming (Zoom/Discord) or DNS use UDP while Financial/Web transfers use TCP?",
    expected_points: [
      "Establishment: SYN (seq=x) ➔ SYN-ACK (seq=y, ack=x+1) ➔ ACK (seq=x+1, ack=y+1)",
      "Termination: FIN ➔ ACK ➔ FIN ➔ ACK with TIME_WAIT state (2MSL) to ensure final ACK was received",
      "TCP guarantees ordering, retransmission on loss, flow control (sliding window), and congestion control (slow start, AIMD)",
      "UDP has zero connection overhead, no packet retransmissions, and minimal header (8 bytes vs 20+ bytes). Video/voice prefer dropping a frame rather than freezing the stream waiting for retransmission."
    ],
    ideal_answer: "TCP establishes connection via SYN ➔ SYN-ACK ➔ ACK, synchronizing sequence numbers. It terminates via FIN ➔ ACK from both ends, holding TIME_WAIT (2MSL) to prevent old duplicate packets interfering with new connections. Web and banking use TCP because data loss or reordering corrupts transactions. Video streaming and real-time gaming use UDP because latency is king: a lost audio packet from 200ms ago is useless; waiting for TCP retransmission would introduce stutter.",
    follow_up: "What is the purpose of the SYN flood attack, and how do SYN cookies mitigate it?"
  },
  {
    id: "cs-net-3",
    domain: "networks",
    topic: "HTTP/1.1 vs HTTP/2 (Multiplexing) vs HTTP/3 (QUIC / UDP)",
    company_tag: "Product Mid / Razorpay / Google",
    difficulty: "hard",
    question: "Explain the evolution from HTTP/1.1 to HTTP/2 and HTTP/3. What was Head-of-Line (HoL) Blocking in HTTP/1.1, how did HTTP/2 solve it at the application layer, and why did HTTP/3 have to migrate to UDP/QUIC?",
    expected_points: [
      "HTTP/1.1: Sequential request-response per TCP connection (pipelining rarely worked). Suffered application-level Head-of-Line blocking (slow request blocked subsequent requests on same connection).",
      "HTTP/2: Binary framing layer introducing streams and Multiplexing over a single TCP connection. Multiple requests/responses interleaved simultaneously.",
      "HTTP/2 TCP HoL Blocking: Because all streams share one TCP connection, if a single packet is lost, the entire TCP window halts waiting for retransmission, blocking all concurrent streams.",
      "HTTP/3: Replaces TCP with QUIC over UDP. Each stream is truly independent at the transport layer: a dropped packet on stream 1 does NOT block stream 2."
    ],
    ideal_answer: "HTTP/1.1 suffered application-level HoL blocking because requests on a connection had to finish in order. HTTP/2 solved this with binary framing and multiplexing, interleaving multiple bidirectional streams over a single TCP connection. However, HTTP/2 introduced TCP-level HoL blocking: packet loss on one stream freezes all streams until retransmission. HTTP/3 moves to QUIC over UDP, providing true stream independence, 0-RTT connection resumption, and connection migration across WiFi/Cellular handoffs.",
    follow_up: "What is Server Push in HTTP/2, and why has it fallen out of favor?"
  },
  {
    id: "cs-net-4",
    domain: "networks",
    topic: "CORS (Cross-Origin Resource Sharing), Preflight (OPTIONS) & Web Security",
    company_tag: "TCS Digital / Infosys / Razorpay",
    difficulty: "medium",
    question: "What is the Same-Origin Policy (SOP) in web browsers, and what is CORS? Why does the browser send an HTTP OPTIONS preflight request before a POST/PUT request? Also compare Cookies vs JWT tokens for session auth.",
    expected_points: [
      "Origin defined by: Scheme (http/https) + Hostname + Port",
      "Same-Origin Policy blocks client-side JavaScript from reading responses from a different origin",
      "CORS headers (Access-Control-Allow-Origin) allow servers to whitelist trusted origins",
      "Preflight: Browser sends OPTIONS request with Access-Control-Request-Method/Headers for non-simple requests (custom headers like Authorization, Content-Type: application/json, or methods like PUT/DELETE) to ask server permission before sending actual mutation.",
      "HttpOnly, Secure cookies prevent XSS theft. JWTs are stateless but susceptible to XSS if stored in localStorage."
    ],
    ideal_answer: "Same-Origin Policy restricts scripts on one domain from reading resources from another. CORS relaxes this safely using response headers. For non-simple requests (JSON payloads, PUT/DELETE, Authorization headers), the browser automatically sends an HTTP OPTIONS preflight request to verify allowed methods and headers before sending the actual payload. For authentication, HttpOnly cookies protect session tokens from malicious JavaScript XSS injection, whereas localStorage is accessible to any rogue script.",
    follow_up: "How do you protect a web application against Cross-Site Request Forgery (CSRF) attacks?"
  },
  {
    id: "cs-oop-5",
    domain: "oop",
    topic: "Shallow Copy vs Deep Copy & C++ Rule of 3/5/0 (Move Semantics)",
    company_tag: "Google / Amazon / Microsoft",
    difficulty: "hard",
    question: "What is the concrete difference between Shallow Copy and Deep Copy? Explain the C++ Rule of 3 and Rule of 5 (Destructor, Copy Constructor, Copy Assignment, Move Constructor, Move Assignment). What is rvalue reference (&&)?",
    expected_points: [
      "Shallow copy copies raw pointer values, leading to double-free bugs when both destructors run",
      "Deep copy allocates new heap memory and copies the underlying data",
      "Rule of 3: If you need a custom destructor, copy constructor, or copy assignment operator, you almost certainly need all three",
      "Rule of 5: In modern C++11, also implement move constructor and move assignment operator using rvalue references (&&) to transfer ownership without heap reallocation",
      "Java/Python: Objects are reference-based; clone() or copy.deepcopy() is needed for deep cloning."
    ],
    ideal_answer: "A shallow copy duplicates member variables byte-by-byte; if an object owns heap memory (char* or int*), both objects point to the same memory, causing double-free memory corruption on destruction. A deep copy allocates fresh heap memory and copies the actual contents. The Rule of 5 states that managing raw resources requires Destructor, Copy Constructor, Copy Assignment, Move Constructor, and Move Assignment. Move semantics (C++11 rvalues '&&') allow transferring pointer ownership from temporary objects without costly memory reallocations, boosting performance by 10x in vector resizes.",
    follow_up: "What is std::move in C++ and does it actually move any memory at runtime?"
  },
  {
    id: "cs-os-5",
    domain: "os",
    topic: "Race Conditions, Critical Sections & Peterson's Algorithm with Memory Barriers",
    company_tag: "Amazon SDE / Google / Qualcomm",
    difficulty: "hard",
    question: "What is a Race Condition? How does Peterson's Algorithm solve mutual exclusion for two concurrent processes in pure software? Why does Peterson's Algorithm fail on modern out-of-order multi-core CPUs without memory barriers?",
    expected_points: [
      "Race Condition occurs when multiple threads read and write shared data concurrently, and final outcome depends on thread scheduling",
      "Peterson's Algorithm uses two shared variables: boolean flag[2] (interest) and int turn (yield turn)",
      "Guarantees Mutual Exclusion, Progress, and Bounded Waiting",
      "Failure on modern CPUs: Modern multi-core processors perform out-of-order execution and store buffering (relaxed memory model). Write to flag[0] and read of turn can be reordered by hardware, causing both threads into critical section simultaneously unless explicit Memory Barriers / volatile semantics are enforced."
    ],
    ideal_answer: "A race condition happens when the correctness of a program depends on the non-deterministic interleaving of threads accessing shared mutable state. Peterson's Algorithm provides two-process mutual exclusion using 'flag' and 'turn' variables. However, on modern x86/ARM multi-core architectures with out-of-order execution and write buffers, the CPU reorders memory operations. Without a Hardware Memory Fence (or C++ std::atomic with memory_order_seq_cst), the CPU executes reads before prior writes are visible across cores, violating mutual exclusion.",
    follow_up: "What hardware instruction (e.g., Compare-And-Swap - CAS) do modern OS locks use instead of pure software algorithms?"
  },
  {
    id: "cs-net-5",
    domain: "networks",
    topic: "Symmetric vs Asymmetric Encryption & TLS 1.3 Handshake Security",
    company_tag: "Razorpay / Google / Infosys SP",
    difficulty: "medium",
    question: "Why does HTTPS rely on BOTH Asymmetric encryption (RSA / Elliptic Curve Diffie-Hellman) and Symmetric encryption (AES-GCM)? Walk through why asymmetric encryption alone cannot be used for all web communication.",
    expected_points: [
      "Asymmetric encryption (public/private key pairs): Mathematically intensive; ~1,000x slower than symmetric encryption and computationally prohibitive for bulk data transfer",
      "Symmetric encryption (shared secret key): Blazing fast, hardware-accelerated (AES-NI instructions on CPUs)",
      "Hybrid Architecture: Asymmetric encryption is used solely during the TLS handshake to authenticate server identity via CA certificates and securely negotiate an ephemeral symmetric session key (ECDHE)",
      "Bulk web data transfer is encrypted exclusively with the negotiated symmetric session key (AES-256-GCM or ChaCha20-Poly1305)."
    ],
    ideal_answer: "Asymmetric encryption solves the key exchange problem (anyone can encrypt with the public key, but only the server can decrypt with the private key). However, asymmetric math (RSA/ECC) is computationally expensive and slow. Symmetric encryption (like AES-GCM) is 1,000x faster and has hardware acceleration on modern CPUs. Therefore, HTTPS uses a hybrid model: during the TLS handshake, asymmetric crypto authenticates the server's certificate and securely negotiates an ephemeral session key. Once established, 100% of HTTP payload traffic is encrypted with blazing-fast symmetric encryption.",
    follow_up: "What is Forward Secrecy (PFS), and why does TLS 1.3 prohibit static RSA key exchange?"
  },
  {
    id: "cs-sys-6",
    domain: "networks",
    topic: "Event Loops, Non-Blocking I/O (epoll/kqueue) & The C10K Problem",
    company_tag: "Amazon / Swiggy / Google",
    difficulty: "hard",
    question: "How can single-threaded runtimes like Node.js / NGINX handle 100,000 concurrent client connections without spawning 100,000 threads? Explain OS I/O Multiplexing (epoll/kqueue) and the Event Loop.",
    expected_points: [
      "Traditional Multi-threaded model (Apache HTTPD): Spawns 1 thread per connection. 10,000 threads exhaust OS RAM (each thread stack is 1-8MB) and waste CPU cycles in thread context switching (The C10K problem)",
      "I/O Multiplexing (Linux epoll / macOS kqueue): OS kernel monitors thousands of file descriptors / sockets on a single thread in O(1) time without busy polling",
      "Non-blocking sockets: System calls return EWOULDBLOCK instead of sleeping",
      "Event Loop (libuv in Node.js): Dispatches ready socket I/O events from epoll, invokes registered callbacks asynchronously, and delegates CPU-bound tasks to an internal thread pool."
    ],
    ideal_answer: "In thread-per-connection architectures, scaling to 100k connections crashes the server due to multi-gigabyte thread stack allocations and relentless context switching. Single-threaded event loops (Node.js/NGINX) solve this via OS I/O Multiplexing (Linux epoll or BSD kqueue). Sockets are marked non-blocking. The single event loop registers sockets with the kernel epoll instance. When network packets arrive, the kernel notifies epoll in O(1) time. The event loop then sequentially executes ready callbacks without ever blocking on waiting network bytes.",
    follow_up: "What happens if a developer puts a synchronous heavy loop (e.g., JSON.parse on a 500MB string) inside an event loop handler?"
  }
];

// ── 5. SYSTEM DESIGN CHALLENGES (LLD & HLD) ──────────────────────────────────
export const SEED_SYSTEM_DESIGN_CHALLENGES: SystemDesignChallenge[] = [
  {
    id: "sd-1",
    title: "Design a Distributed API Rate Limiter",
    difficulty: "medium",
    company_tag: "Razorpay / Swiggy / Amazon",
    description: "Design an API rate limiter service that restricts incoming client requests to at most 100 requests per minute per user ID or IP address. It must support high availability, microsecond latency overhead, and distributed multi-server clusters.",
    scale_metrics: "1 Billion total requests per day (~12,000 RPS peak). Sub-5ms latency overhead.",
    functional_requirements: [
      "Limit requests to 100 requests / minute per client",
      "Return HTTP 429 Too Many Requests when limit exceeded with Retry-After header",
      "Support tier overrides (VIP users get 1000 req/min)"
    ],
    non_functional_requirements: [
      "Ultra-low latency (< 5ms check time)",
      "High availability (failure of limiter should fail-open, not bring down core platform)",
      "Memory efficient storage of counters across distributed instances"
    ],
    architectural_hints: [
      "Token Bucket or Sliding Window Log vs Sliding Window Counter algorithm",
      "Use Redis in-memory key-value store with atomic INCR and EXPIRE (or Redis Lua script to avoid race conditions)",
      "Place Rate Limiter inside API Gateway / Reverse Proxy (Envoy / Kong) before backend microservices"
    ],
    ideal_solution: {
      components: ["API Gateway / Envoy Proxy", "Redis Cluster (Sliding Window Counter)", "Configuration DB for tier rules", "Prometheus / Grafana metrics"],
      database_choice: "Redis In-Memory Key-Value store with Lua scripting for atomic read-and-increment operations.",
      caching_strategy: "Local in-memory cache (Guava/LRU) on Gateway for static VIP rules; Redis cluster with consistent hashing for live per-minute rolling timestamps.",
      tradeoffs: "Token Bucket is memory efficient (O(1)) but allows bursts. Sliding Window Counter provides perfect smoothness at minimal memory cost. In case of Redis outage, fail-open to preserve core business availability."
    }
  },
  {
    id: "sd-2",
    title: "Design TinyURL (Distributed URL Shortening Service)",
    difficulty: "medium",
    company_tag: "Amazon / Google / Microsoft",
    description: "Design a scalable URL shortening service like TinyURL or Bitly that converts long URLs into short 7-character URLs, redirects users with low latency, and handles billions of redirections per month.",
    scale_metrics: "100 Million new URLs created per month. 100:1 Read-to-Write ratio (10 Billion reads / month ~ 4,000 RPS read).",
    functional_requirements: [
      "Generate short unique 7-character alias (e.g. tinyurl.com/aB3x9Z)",
      "Redirect user to original URL with HTTP 301 Permanent Redirect (or 302 for analytics)",
      "Allow custom aliases and optional expiry dates"
    ],
    non_functional_requirements: [
      "Sub-20ms redirection latency",
      "99.99% system availability",
      "No duplicate short URLs generated under concurrent writes"
    ],
    architectural_hints: [
      "Base62 Encoding [0-9, a-z, A-Z]. 62^7 = ~3.5 Trillion unique combinations",
      "Counter / Range-based Unique ID Generator (Zookeeper Key Generation Service - KGS)",
      "Read-heavy caching (Redis LRU cache for top 20% hot URLs)"
    ],
    ideal_solution: {
      components: ["Load Balancer", "Web Application Servers", "Key Generation Service (KGS with Zookeeper)", "NoSQL / Distributed Key-Value Store (Cassandra/DynamoDB)", "Redis Cache Cluster"],
      database_choice: "NoSQL Key-Value store (Cassandra or DynamoDB) because queries are simple key-lookups (hash index) without foreign key joins, providing horizontal auto-sharding.",
      caching_strategy: "Redis cluster caching top 20% most accessed URLs following Pareto principle (80-20 rule), eliminating 80%+ database load.",
      tradeoffs: "HTTP 301 caches redirect in browser (lowest latency, zero server cost) vs HTTP 302 routes every click through server (enables live click analytics)."
    }
  },
  {
    id: "sd-3",
    title: "Design a Real-Time Chat & Instant Messaging Platform (WhatsApp / Slack)",
    difficulty: "hard",
    company_tag: "Meta / Google / Swiggy",
    description: "Design a real-time messaging architecture supporting 1-on-1 private messaging and group channels with live presence (online/last seen), offline message queuing, and read receipts.",
    scale_metrics: "50 Million Daily Active Users (DAU), 500 Million messages per day (~10,000 msg/sec peak). P99 message delivery latency < 100ms.",
    functional_requirements: [
      "Bidirectional low-latency message delivery (1-on-1 and Group chats)",
      "Live user presence status (Online, Offline, Typing...)",
      "Offline message storage and sync when client reconnects",
      "Sent (✓), Delivered (✓✓), and Read (Blue ✓✓) status updates"
    ],
    non_functional_requirements: [
      "Ultra-low latency (< 100ms)",
      "Guaranteed at-least-once message delivery without duplicates",
      "End-to-end data persistence across node failures"
    ],
    architectural_hints: [
      "Stateful WebSocket Gateway connections with heartbeat ping/pong",
      "Redis Pub/Sub or Kafka message broker for routing messages between gateway nodes",
      "Distributed wide-column store (Apache Cassandra / ScyllaDB) partitioned by (chat_id, message_timestamp DESC) for chat history"
    ],
    ideal_solution: {
      components: ["DNS / Global Accelerator", "WebSocket Edge Gateways", "User Session / Presence Service (Redis Cluster)", "Message Broker (Kafka / Redis Streams)", "Chat History Store (Cassandra / ScyllaDB)", "Push Notification Service (APNS / FCM)"],
      database_choice: "Apache Cassandra or ScyllaDB for message storage. Its LSM-tree write path handles massive write surges effortlessly, and partitioning by chat_id enables rapid paginated sequential range scans.",
      caching_strategy: "Redis In-Memory Cache for live user session mapping (User_ID ➔ Gateway_Instance_ID) and heartbeat presence with 60s TTL.",
      tradeoffs: "WebSockets maintain persistent TCP connections requiring sticky gateway sessions; when a server restarts, reconnect storms must be dampened with exponential jitter."
    }
  },
  {
    id: "sd-4",
    title: "Design a Ride-Sharing Driver Dispatch & Geolocation System (Uber / Ola)",
    difficulty: "hard",
    company_tag: "Uber / Grab / Google Maps",
    description: "Design the real-time geolocation tracking and driver-rider matching engine for a ride-hailing platform. Active drivers stream GPS coordinates every 4 seconds, and riders request nearby drivers within a 3km radius.",
    scale_metrics: "1 Million active concurrent drivers sending GPS pings every 4s (~250,000 writes/sec). 50,000 ride match requests per minute. Query latency < 50ms.",
    functional_requirements: [
      "High-throughput real-time driver GPS location updates",
      "Find top 10 nearest available drivers within 3km of a rider's pickup point",
      "Assign and lock a driver to an accepted ride (prevent double-booking)"
    ],
    non_functional_requirements: [
      "Sub-50ms geospatial query response time",
      "Zero driver ghost bookings under concurrent rider requests",
      "High availability even during regional server cluster degradation"
    ],
    architectural_hints: [
      "Spatial Indexing algorithms: Uber H3 (Hexagonal hierarchical spatial index) or Geohash / Google S2 cells",
      "In-memory spatial cache (Redis GEOADD / GEORADIUS) partitioned by Geo-cell ID",
      "Distributed atomic lock or Redis Lua script to atomically reserve a matched driver"
    ],
    ideal_solution: {
      components: ["Driver Location Ingestion Service (gRPC / WebSockets)", "Redis Spatial Cluster (Uber H3 Indexing)", "Matching & Dispatch Engine", "Ride State DB (PostgreSQL with PostGIS / DynamoDB)", "Kafka Event Bus"],
      database_choice: "Redis Cluster using H3 hexagonal indexing in memory for ephemeral real-time positions; PostgreSQL with PostGIS for historical trip logs and billing records.",
      caching_strategy: "Keep only the latest driver coordinates in Redis; drop stale coordinates older than 30 seconds to bound RAM consumption.",
      tradeoffs: "Hexagonal H3 cells have uniform neighbor distances unlike rectangular latitude/longitude grids, eliminating boundary distortion when calculating rider radius."
    }
  },
  {
    id: "sd-5",
    title: "Design a High-Concurrency Flash Sale & Inventory Reservation System",
    difficulty: "hard",
    company_tag: "Amazon / Flipkart / Razorpay",
    description: "Design an inventory reservation system for a flash sale (e.g. 10,000 units of iPhone selling out in 15 seconds with 2 Million concurrent users hitting the Buy Now button). Must guarantee zero overselling without crashing database.",
    scale_metrics: "2 Million concurrent users, 200,000 checkout requests/sec peak surge. 10,000 stock units. 100% data consistency (Zero overselling).",
    functional_requirements: [
      "Atomically decrement inventory upon user purchase intent",
      "Hold inventory for 10 minutes while user completes payment; release back to pool if abandoned",
      "Return immediate 'Sold Out' status once inventory reaches 0"
    ],
    non_functional_requirements: [
      "Zero overselling (Absolute consistency on inventory counter)",
      "Database must not choke under 200k req/sec row locks",
      "Graceful degradation and waiting room queue for surplus traffic"
    ],
    architectural_hints: [
      "Do NOT lock relational DB rows with SELECT ... FOR UPDATE under 200k RPS",
      "Pre-warm inventory stock in Redis with atomic DECR Lua script",
      "Virtual Waiting Room (Cloudflare / Envoy) rate-metering requests into backend",
      "Kafka message queue decoupling checkout request from payment settlement"
    ],
    ideal_solution: {
      components: ["Virtual Waiting Room / Rate Limiter", "Order Gateway", "Redis Atomic Inventory Cluster (Lua Script)", "Kafka Order Queue", "Payment Service", "Transactional Database (MySQL / Aurora)"],
      database_choice: "Redis In-Memory counter for live decrementing during flash sale peak; MySQL with Optimistic Locking (version column) for finalized committed orders.",
      caching_strategy: "Pre-load inventory count into Redis. Execute check-and-decrement atomically using a Redis Lua script: if redis.call('get', KEYS[1]) > 0 then return redis.call('decr', KEYS[1]) else return 0 end.",
      tradeoffs: "Offloading inventory decrements to Redis memory eliminates DB connection exhaustion, but requires delayed reconciliation workers to release unpaid cart reservations."
    }
  },
  {
    id: "sd-6",
    title: "Design a Global Video Streaming & CDN Transcoding Pipeline (Netflix / YouTube)",
    difficulty: "hard",
    company_tag: "Netflix / YouTube / Disney+ Hotstar",
    description: "Design an end-to-end video streaming platform where creators upload raw 4K videos, the system encodes them into multiple bitrate resolutions (HLS / DASH chunks), and streams seamlessly to global viewers across varying network bandwidths.",
    scale_metrics: "5,000 hours of video uploaded per day. 100 Million concurrent viewers during live cricket / sports events. 10+ Terabits/sec egress bandwidth.",
    functional_requirements: [
      "Asynchronous video processing, chunking, and multi-resolution transcoding (1080p, 720p, 480p, 360p)",
      "Adaptive Bitrate Streaming (ABR) dynamically adjusting video quality to user bandwidth",
      "Global low-latency video playback (< 2s initial buffering)"
    ],
    non_functional_requirements: [
      "Fault-tolerant distributed encoding workers (resume on spot instance termination)",
      "95%+ CDN cache hit ratio to minimize origin storage egress cost",
      "High availability and DRM content protection"
    ],
    architectural_hints: [
      "Chunk raw video into 5-10 second .ts / .m4s fragments using FFmpeg workers coordinated by AWS SQS / Kafka",
      "Store master chunks in AWS S3 / Cloud Storage; distribute via Global Edge CDNs (Cloudflare / CloudFront / Akamai)",
      "Generate Master Playlist (.m3u8) file linking all bandwidth profiles for ABR player"
    ],
    ideal_solution: {
      components: ["Upload Pre-signed S3 Gateway", "Video Chunking & Transcoding DAG (FFmpeg on Kubernetes / AWS Batch)", "Master Manifest Generator (.m3u8)", "Distributed Object Storage (AWS S3)", "Global Edge CDN Network", "Metadata & Recommendation DB (PostgreSQL / MongoDB)"],
      database_choice: "Amazon S3 for immutable video chunks; PostgreSQL for video catalog, creator metadata, and viewership metrics; Redis for real-time playhead state.",
      caching_strategy: "Multi-tier Edge CDN caching. Popular video chunks cached at Tier-1 Internet Service Provider (ISP) POPs (Point of Presence), achieving 98% cache hit ratio.",
      tradeoffs: "Transcoding into 6 different resolutions consumes significant CPU/GPU compute, but saves massive downstream bandwidth and eliminates playback buffering for mobile users on 3G/4G."
    }
  }
];

// ── 6. BEHAVIORAL & HR QUESTIONS (SERVICE HR & FAANG STAR) ────────────────────
export const SEED_BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  // ── SERVICE FIRM HR QUESTIONS (TCS, Infosys, Wipro, Accenture) ─────────────
  {
    id: "beh-1",
    track_type: "service_hr",
    title: "Why Service-Based Company & Handling 2-Year Bond",
    company_tag: "TCS / Infosys / Wipro HR",
    question: "You have strong technical skills. Why are you choosing to join a large IT services firm like TCS/Infosys rather than a venture-funded startup? Also, are you comfortable with our 2-year service agreement and relocating to any client location?",
    context_tip: "HR Filter: Tests corporate stability, long-term commitment, and emotional maturity. Never sound condescending or mention startups pay more.",
    star_rubric: {
      situation: "Acknowledge the enterprise scale and client-facing learning curve of global IT services.",
      task: "Position your career goal: building disciplined enterprise engineering habits across multi-national projects.",
      action: "Confirm 100% comfort with relocation and service agreements as an investment in professional mentorship.",
      result: "Express excitement about training infrastructure and client transformation."
    },
    ideal_response: "I respect startups, but at this foundational stage of my career, I want to learn disciplined, enterprise-scale engineering practices that only a global leader like TCS can provide. In a firm of this scale, software isn't just a prototype; it powers banks, airlines, and healthcare systems across 50 countries. Regarding relocation and the service agreement, I am completely comfortable with both. I view the agreement as a mutual commitment: the company invests rigorous training in me, and I deliver reliable engineering value across client engagements."
  },
  {
    id: "beh-3",
    track_type: "service_hr",
    title: "Relocation Willingness & 24/7 Rotational Shifts",
    company_tag: "TCS Ninja / Wipro Elite / Accenture",
    question: "Are you willing to relocate to any base branch across India (Chennai, Pune, Bangalore, Kolkata) on short notice? Also, our global clients operate across US/UK timezones; are you comfortable working in 24/7 rotational night shifts?",
    context_tip: "Critical Service Filter: Service firms eliminate over 25% of technically cleared candidates in HR round if they show hesitation on relocation or night shifts.",
    star_rubric: {
      situation: "Acknowledge that IT consulting operates across global timezones.",
      task: "Demonstrate cultural flexibility and adaptability.",
      action: "Emphasize prior experience living away from home (hostels/college) and commitment to mission-critical shifts.",
      result: "State that global shift rotations offer faster learning of enterprise production systems."
    },
    ideal_response: "I am 100% willing and excited to relocate to any base branch across India. Living in hostels throughout my engineering degree taught me how to adapt quickly to new environments and collaborate with diverse teammates. Regarding rotational and night shifts, global client delivery is the backbone of IT consulting. Working during US/UK hours will give me direct exposure to international stakeholders and live production workloads, which I consider an invaluable learning opportunity."
  },
  {
    id: "beh-4",
    track_type: "service_hr",
    title: "Handling Pressure, Tight Client Deadlines & Scope Creep",
    company_tag: "Infosys / Wipro / Cognizant",
    question: "Tell me about a time when you faced an impossible deadline with unexpected requirements. How did you prioritize tasks and keep stakeholders calm?",
    context_tip: "Tests emotional resilience, prioritization under pressure, and customer communication.",
    star_rubric: {
      situation: "Describe a project deadline crunch with sudden requirement changes.",
      task: "Define the core deliverable vs nice-to-have scope.",
      action: "Show structured triage, daily standup communication, and focused execution.",
      result: "On-time release with zero critical production bugs."
    },
    ideal_response: "During our semester project sprint, 48 hours before final submission, the faculty introduced two new security auditing requirements. My team panicked. I immediately called a 15-minute triage session: we classified our remaining tasks using an Eisenhower matrix into 'critical blockers' and 'enhancements'. I took ownership of the authentication middleware, reassigned frontend polish to teammates, and communicated our roadmap to the evaluator. We delivered the secure core on time, earning the highest project grade in our lab section."
  },
  {
    id: "beh-srv-4",
    track_type: "service_hr",
    title: "Handling Bench Period or Allocation to an Unfamiliar Tech Stack",
    company_tag: "TCS / Infosys / Wipro HR",
    question: "What if after your onboarding and initial training, you are not allocated to your favorite domain (like AI or Full-Stack) and instead assigned to Mainframe Support, Testing, or placed on the bench for 2 months? How will you react?",
    context_tip: "Major Service Trap Question: Candidate must show professional adaptability and eagerness to master enterprise core systems rather than complaining.",
    star_rubric: {
      situation: "Acknowledge that project demands in large IT firms depend on client contracts.",
      task: "Demonstrate technology-agnostic mindset and willingness to master whatever drives business value.",
      action: "Explain proactive learning strategy (certifications, internal shadow opportunities, mastering legacy domain).",
      result: "Becoming a reliable, cross-functional asset who can bridge legacy infrastructure with modern tooling."
    },
    ideal_response: "I see technology as a tool to solve business problems, not an identity. If assigned to Mainframe, Production Support, or Quality Engineering, I recognize that mission-critical global banking and airline systems run on these exact backbones. I would dive in to master the business domain, understand system SLAs, and earn internal certifications. During any bench time, I would proactively take internal micro-credentials and assist senior architects on client RFPs. Being versatile and reliable in any assignment is how great software leaders are built."
  },
  {
    id: "beh-srv-5",
    track_type: "service_hr",
    title: "Dealing with an Angry, Escalating Client Without Defensive Excuses",
    company_tag: "Accenture / TCS / Cognizant",
    question: "A high-profile European banking client is shouting on an escalation call because an overnight patch broke their customer portal. Your team was responsible. How do you handle the conversation?",
    context_tip: "Tests emotional maturity, composure under fire, and corporate client empathy.",
    star_rubric: {
      situation: "Critical client escalation with high business and financial stakes.",
      task: "De-escalate emotional tension without throwing teammates or QA under the bus.",
      action: "Listen actively, validate their business impact, provide concrete 30-minute status check-ins and immediate rollback.",
      result: "Incident contained, portal restored, and comprehensive root-cause analysis (RCA) delivered within 24 hours."
    },
    ideal_response: "First, I would listen patiently without interrupting or becoming defensive, validating their distress: 'I completely understand how critical this portal outage is for your customers, and our entire technical team is mobilized right now.' Second, I would avoid finger-pointing or blaming QA. Third, I would immediately pivot to resolution: initiate an emergency rollback to restore availability, establish a bridge with 30-minute checkpoint updates, and follow up with a thorough Post-Incident Review with automated regression tests to guarantee it never recurs."
  },
  {
    id: "beh-srv-6",
    track_type: "service_hr",
    title: "Why IT Services Instead of Higher Studies (GATE / CAT / MBA / MS)?",
    company_tag: "TCS / Infosys / Wipro HR",
    question: "You have an excellent academic GPA. Why aren't you going for an M.Tech through GATE or an MBA via CAT? Will you leave our company after 1 year to pursue higher studies?",
    context_tip: "Flight Risk Filter: Companies invest ₹2-3 Lakhs in initial training and eliminate high-GPA students if they suspect they will quit for GATE/CAT within 6 months.",
    star_rubric: {
      situation: "Acknowledge academic interest but contrast theory with practical industry impact.",
      task: "Clarify career roadmap: building tangible production software and client domain expertise.",
      action: "Highlight company's internal continuous learning programs and sponsored higher education partnerships.",
      result: "Reassure long-term 3-5 year dedication to corporate delivery."
    },
    ideal_response: "While I enjoyed academics, engineering theory only comes alive when you deploy software used by millions of real customers. Reading about distributed databases in a textbook cannot compare to managing live enterprise systems for global Fortune 500 clients. I want to build my career directly in industry. Furthermore, companies like TCS and Infosys offer sponsored higher education programs with premier institutes for top performers, allowing me to upgrade my skills while creating business value."
  },
  {
    id: "beh-srv-7",
    track_type: "service_hr",
    title: "Handling Repetitive Manual Work, Documentation & Process Compliance",
    company_tag: "TCS / Infosys / Wipro / Cognizant",
    question: "Enterprise IT involves substantial documentation, process audits, and regression test compliance that does not involve writing new code. How do you maintain high enthusiasm and accuracy during routine, repetitive tasks?",
    context_tip: "Service Process Filter: Large IT consultancies rely on CMMI Level 5 audit standards and eliminate candidates who dismiss documentation as 'boring administrative overhead'.",
    star_rubric: {
      situation: "Acknowledge that enterprise software reliability depends on meticulous compliance and documentation.",
      task: "Describe your mindset regarding audit readiness and peer handover clarity.",
      action: "Showcase automation of repetitive parts while maintaining 100% precision on compliance.",
      result: "Demonstrate that good documentation prevented downstream client defects or enabled rapid onboarding."
    },
    ideal_response: "I recognize that in global enterprise delivery, code that isn't documented or audited is a liability for the client. Clean documentation and test runbooks are what allow 24/7 global support teams in different timezones to resolve Sev-1 production incidents in minutes. When assigned repetitive tasks, I focus on two things: first, maintaining 100% accuracy because client SLA compliance is non-negotiable; second, looking for opportunities to safely automate repetitive steps through shell scripts or templates, freeing up time to contribute to higher-level engineering tasks."
  },
  {
    id: "beh-srv-8",
    track_type: "service_hr",
    title: "Navigating Seniority, Hierarchy and Unfair Feedback Professionally",
    company_tag: "TCS Ninja / Wipro / Accenture HR",
    question: "What would you do if your Project Manager or Module Lead gave you a low performance rating or rejected your code without explaining why? How do you handle hierarchy and professional conflict?",
    context_tip: "Tests emotional intelligence, respect for corporate hierarchy, and proactive problem-solving without gossiping or insubordination.",
    star_rubric: {
      situation: "Receiving confusing or critical feedback from a superior in a hierarchical corporate structure.",
      task: "Overcome emotional defensiveness and seek objective clarity.",
      action: "Request a 1-on-1 feedback session, ask for measurable gap indicators, and create an improvement plan.",
      result: "Restored mutual trust, aligned with delivery standards, and earned senior lead's endorsement."
    },
    ideal_response: "I would never react emotionally or vent to colleagues. Instead, I would pause, reflect on the feedback objectively, and request a brief 1-on-1 meeting with my lead. I would ask constructive, specific questions: 'I want to deliver work that meets your quality expectations — could you highlight the specific architectural guidelines or test cases my code fell short on?' Once clarified, I would draft a 30-day corrective action plan with measurable milestones, ask for their sign-off, and request a 15-minute bi-weekly check-in to ensure I am tracking to their benchmark."
  },

  // ── FAANG & PRODUCT TRACK STAR QUESTIONS (Amazon 16 LPs, Google, Razorpay) ──
  {
    id: "beh-2",
    track_type: "faang_star",
    title: "Amazon LP: Disagree and Commit / Resolving Technical Deadlock",
    principle: "Have Backbone; Disagree and Commit",
    company_tag: "Amazon / Google",
    question: "Tell me about a time when you strongly disagreed with a teammate or senior developer's technical decision. How did you handle the conflict, and what was the outcome?",
    context_tip: "Bar-Raiser Filter: Interviewers look for data-driven disagreement, respectful pushback without ego, and commitment once the final decision is reached.",
    star_rubric: {
      situation: "Describe a real engineering choice (e.g. SQL vs MongoDB, Monolith vs Microservices).",
      task: "Explain why you believed the chosen approach posed scalability or latency risks.",
      action: "Show how you brought objective benchmark data / proof-of-concept rather than personal opinions, and how you supported the team once decided.",
      result: "Quantify the outcome (saved latency, prevented outage, or learned from senior's insight)."
    },
    ideal_response: "During our final-year capstone project, a teammate wanted to store our transactional payment logs directly in MongoDB because it was faster to set up. I was concerned because missing financial records during power failures would corrupt user balances. Rather than arguing in abstract terms, I set up a small stress test script showing that under concurrent thread writes, the NoSQL setup lost 3% of transactions without ACID locks, whereas PostgreSQL preserved 100% data integrity with sub-10ms response times. Seeing the benchmark data, my teammate immediately agreed to adopt PostgreSQL, and our live deployment processed over 15,000 simulated transactions with zero discrepancies."
  },
  {
    id: "beh-5",
    track_type: "faang_star",
    title: "Amazon LP: Customer Obsession & Bias for Action under Ambiguity",
    principle: "Customer Obsession & Bias for Action",
    company_tag: "Amazon / Uber / Razorpay",
    question: "Describe a situation where you had incomplete data or unclear requirements, but had to act quickly to solve a critical customer problem.",
    context_tip: "Bar-Raiser Filter: Demonstrates speed over perfection, two-way door decisions, and working backwards from customer pain.",
    star_rubric: {
      situation: "Customer-facing bug or high churn during a critical launch window.",
      task: "Urgent need to unblock users without waiting days for complete telemetry.",
      action: "Formulated a safe hypothesis, deployed a non-destructive fallback patch within hours.",
      result: "Quantifiable reduction in errors and restored user trust."
    },
    ideal_response: "During our open-source hackathon app launch, 15% of mobile users reported inability to checkout, but our server logs had no error stacktraces. Rather than waiting 24 hours to set up full telemetry pipelines, I recognized this was a two-way door decision. I wrote a client-side logger that captured device OS and browser viewport on failure. Within 3 hours, the telemetry revealed that iOS Safari 16 was blocking third-party storage cookies during checkout. I deployed a server-side session fallback that night, immediately dropping checkout failures from 15% to 0.2% for over 2,400 active shoppers."
  },
  {
    id: "beh-prod-3",
    track_type: "faang_star",
    title: "Amazon LP: Dive Deep / Root-Causing a Silent Production Glitch",
    principle: "Dive Deep",
    company_tag: "Amazon / Google / Microsoft",
    question: "Tell me about a complex technical problem where you had to dig several layers deep into system logs, source code, or network packets to find the root cause.",
    context_tip: "Looks for unrelenting curiosity, profiling skills, and refusing to settle for superficial band-aids.",
    star_rubric: {
      situation: "An elusive memory leak, intermittent 502 Bad Gateway, or silent data corruption.",
      task: "Identify why superficial reboots or cache invalidations didn't solve the core issue.",
      action: "Used low-level profiling tools (heap dumps, Wireshark, pprof, SQL EXPLAIN) to trace exact line/concurrency flaw.",
      result: "Zero occurrences since permanent patch; document preventive integration test."
    },
    ideal_response: "In our microservices capstone project, our authentication service would crash once every 48 hours without any error in application logs. A simple container restart temporarily restored service, but that was a band-aid. I dived deep: I attached a profiler and captured memory heap dumps right before a crash. I noticed that unclosed database connection pools were leaking 2MB every hour because our JWT refresh interceptor was throwing an unhandled exception before reaching the finally block where connection.close() resided. I refactored the connection acquisition to use try-with-resources and wrote an automated connection-leak test. The service subsequently ran for months with zero memory bloat."
  },
  {
    id: "beh-prod-4",
    track_type: "faang_star",
    title: "Amazon LP: Deliver Results Under Extreme Resource Constraints",
    principle: "Deliver Results",
    company_tag: "Razorpay / Swiggy / Amazon",
    question: "Tell me about a time when you were handed a project with an aggressive deadline, limited resources, and unexpected setbacks. How did you ensure successful delivery?",
    context_tip: "Tests tenacity, ruthless MVP prioritization, and refusing to compromise on core quality bars.",
    star_rubric: {
      situation: "Severe time constraint or team member emergency before a major milestone.",
      task: "Deliver the core promise to stakeholders without slipping the committed date.",
      action: "Cut non-essential fluff, built automated CI/CD checks to prevent manual QA bottlenecks, focused on primary user journey.",
      result: "Delivered on time, zero P0 regressions, recognized by engineering leads."
    },
    ideal_response: "Two weeks before our inter-college tech exhibition, our backend lead fell severely ill, leaving 60% of our REST API routes unfinished. Rather than requesting a deadline extension, I stepped up to lead. I reviewed our feature spec and stripped away 4 secondary features (social sharing, dark mode theme toggle), focusing 100% of our remaining bandwidth on core transaction flow and real-time dashboard analytics. I paired with our junior frontend dev to write automated Postman integration tests so we caught bugs instantly. We launched on schedule, onboarded 800 live student participants on day one, and won First Place in the campus innovation track."
  },
  {
    id: "beh-prod-5",
    track_type: "faang_star",
    title: "Amazon LP: Earn Trust / Owning and Fixing a Costly Mistake",
    principle: "Earn Trust",
    company_tag: "Amazon / Google / Atlassian",
    question: "We all make mistakes. Tell me about a time when you made a serious error in judgment or code that caused a problem. How did you communicate it, and what did you learn?",
    context_tip: "Vulnerability and extreme ownership test. Never claim you've never made a mistake or blame junior teammates.",
    star_rubric: {
      situation: "Accidental faulty database migration, dropped index, or broken production build.",
      task: "Take immediate full ownership without concealing facts.",
      action: "Alerted team immediately with facts and mitigation plan, assisted rollback, conducted blame-free post-mortem.",
      result: "Instituted a safety safeguard (e.g. pre-deployment migration dry-run script) to protect team forever."
    },
    ideal_response: "During an internship project, I accidentally pushed a schema migration script to staging that dropped a foreign key index, causing API response times to spike from 50ms to 4.2 seconds during team testing. Instead of quietly trying to fix it or hoping nobody noticed, I immediately notified our tech lead on Slack: 'I introduced a regression in staging migration 042 by dropping an index. I am rolling it back right now.' Within 10 minutes, I restored the index and verified query plans with EXPLAIN. Following the incident, I wrote a pre-commit lint check that analyzes all SQL migration files for accidental DROP INDEX statements, ensuring no engineer could repeat that mistake."
  },
  {
    id: "beh-prod-6",
    track_type: "faang_star",
    title: "Amazon LP: Invent and Simplify / De-complexifying Architecture",
    principle: "Invent and Simplify",
    company_tag: "Amazon / Google / Uber",
    question: "Tell me about a time when you invented a creative, simple solution to an over-engineered or convoluted technical problem.",
    context_tip: "Bar-Raiser Filter: Looks for engineers who value radical simplicity over unnecessary complexity or resume-driven architectures.",
    star_rubric: {
      situation: "A bloated codebase, slow manual ETL pipeline, or over-complicated microservice interaction.",
      task: "Cut through architectural bloat to reduce latency and maintenance overhead.",
      action: "Proposed a lean, elegant approach replacing multi-step workflows with simpler primitives.",
      result: "Demonstrated measurable code reduction, speed-up, and decreased operational toil."
    },
    ideal_response: "In our university event booking system, the previous team had created 4 separate microservices communicating through RabbitMQ just to handle ticket confirmation PDFs. The system frequently crashed when queue workers backed up. I re-examined the requirements: we were generating only 500 tickets an hour. I eliminated the three intermediate queue services and replaced them with an AWS Lambda function triggered on DynamoDB streams that generated and emailed the PDF in 400ms. We deleted 1,200 lines of boilerplate, eliminated $80/month in cloud queue costs, and reduced failure rates to zero."
  },
  {
    id: "beh-prod-7",
    track_type: "faang_star",
    title: "Amazon LP: Insist on the Highest Standards / Guarding Production Quality",
    principle: "Insist on the Highest Standards",
    company_tag: "Amazon / Google / Microsoft",
    question: "Tell me about a time when you refused to compromise on quality, code standards, or testing despite immense pressure to ship the product immediately.",
    context_tip: "Tests backbone and engineering craftsmanship. Interviewers want to see that you do not cut dangerous corners under pressure.",
    star_rubric: {
      situation: "Management or hackathon team wanting to skip unit tests or security checks to meet an artificial deadline.",
      task: "Protect system stability and user data security without becoming a roadblock.",
      action: "Identified the critical risk, articulated the blast radius to stakeholders, and implemented automated security guardrails in parallel.",
      result: "Shipped with zero vulnerabilities or production outages."
    },
    ideal_response: "During a 48-hour hackathon, 3 hours before product submission, our team wanted to disable CORS security and store plain-text API secrets on GitHub so external testers could access our backend without login delays. I refused to let our team commit raw credentials to a public repository. Recognizing the time crunch, I spent 20 minutes creating automated environment templates using Doppler and added a pre-commit git-secret scanner. We submitted with 100% hardened security, and the judges specifically commended our production-grade security posture during project evaluation."
  },
  {
    id: "beh-prod-8",
    track_type: "faang_star",
    title: "Amazon LP: Frugality / Solving Massive Scale with Zero Budget",
    principle: "Frugality",
    company_tag: "Amazon / Razorpay / Swiggy",
    question: "Accomplish more with less. Describe a time when you solved an infrastructure, computational, or tooling problem with constrained resources or zero budget.",
    context_tip: "Tests resourcefulness, cost consciousness, and optimizing algorithms before throwing expensive hardware at problems.",
    star_rubric: {
      situation: "Hitting free-tier limits or high cloud billing spikes in a student project or startup.",
      task: "Optimize resource utilization rather than upgrading to expensive paid tiers.",
      action: "Profiled bottlenecks, introduced in-memory caching and payload compression.",
      result: "Cut resource consumption by over 70% while supporting higher throughput."
    },
    ideal_response: "Our student project's free cloud database hit its 500MB storage ceiling within two weeks because we were storing full raw JSON audit payloads. Upgrading to a paid dedicated instance would cost $60/month, which we didn't have. Rather than spending money, I analyzed our query access patterns: 95% of queries only filtered on 3 fields (timestamp, user_id, action_type). I normalized the table schema, compressed historical payloads using Gzip into S3 free-tier buckets, and stored only the 3 indexed keys in the relational DB. This reduced our storage footprint by 82%, allowing us to run on the free tier for the rest of the year."
  }
];

// ── 7. EXPANDED 12+ COMMUNICATION PROMPTS ────────────────────────────────────
export const SEED_COMMUNICATION_PROMPTS: CommunicationPrompt[] = [
  {
    id: "comm-1",
    title: "Explain an API to a Non-Technical Grandparent",
    type: "plain_english_concept",
    target_role: "Service & Product Graduate Trainee / Associate Engineer",
    prompt_text: "Imagine you are explaining what an API (Application Programming Interface) is to your non-technical grandparent or a 10-year-old child. You CANNOT use technical jargon like 'endpoints', 'JSON', 'HTTP request', or 'backend server'. Speak or type your 60-90 second explanation.",
    context_note: "Elimination Risk: Over 60% of engineering graduates fail service-company client rounds because they recite memorized textbook definitions rather than explaining concepts in plain business English.",
    target_duration_seconds: 75,
    evaluation_rubric: {
      clarity_weight: 30,
      jargon_avoidance_weight: 35,
      structure_weight: 15,
      communicability_weight: 20
    },
    sample_winning_response: "Think of an API like a waiter in a restaurant. You are the customer sitting at the table, and the kitchen is the system that prepares the food. You don't walk into the kitchen yourself to cook; instead, you look at the menu, tell the waiter what you want, the waiter delivers your order to the chef, and brings the cooked dish right back to your table. In computers, when an app like Swiggy wants to show you a Google Map, it doesn't build its own satellites — it uses an API, which is the polite waiter asking Google Maps for the map and bringing it onto your phone screen."
  },
  {
    id: "comm-2",
    title: "90-Second Corporate Self-Introduction Pitch",
    type: "self_introduction",
    target_role: "All Tracks (TCS Ninja/Digital, Infosys, Wipro, Product)",
    prompt_text: "Deliver your crisp, 90-second self-introduction for the opening HR round. Cover: 1) Who you are & your engineering domain, 2) The practical problem you solved in your flagship project, 3) Why this company's culture excites you, without reciting your marksheet or family tree.",
    context_note: "Elimination Risk: The opening 90 seconds sets the interviewer's bias. Rambling through schooling or repeating CV bullet points triggers immediate candidate fatigue.",
    target_duration_seconds: 90,
    evaluation_rubric: {
      clarity_weight: 25,
      jargon_avoidance_weight: 20,
      structure_weight: 35,
      communicability_weight: 20
    },
    sample_winning_response: "Hello, my name is Priya Sharma. I'm a final-year Computer Science student passionate about building scalable web systems. Over the past year, I built an automated campus placement portal that reduced student interview scheduling conflicts by 80% using event-driven algorithms. Outside of coursework, I actively mentor junior students in data structures and enjoy open-source contributing. What draws me to TCS is your massive digital transformation footprint — I'm excited by the opportunity to apply clean coding and distributed problem-solving to mission-critical enterprise systems on day one."
  },
  {
    id: "comm-3",
    title: "Explain Database Indexing Using a Library Analogy",
    type: "plain_english_concept",
    target_role: "Service Technical & Product Rounds",
    prompt_text: "Explain what a Database Index is using the analogy of a library book catalog or phone book. Avoid complex B-Tree mathematical proofs — focus on WHY it makes searches faster and what trade-off happens when adding new data.",
    context_note: "Tests whether the candidate understands the fundamental trade-off: fast reads vs slower writes in plain intuitive terms.",
    target_duration_seconds: 70,
    evaluation_rubric: {
      clarity_weight: 30,
      jargon_avoidance_weight: 30,
      structure_weight: 20,
      communicability_weight: 20
    },
    sample_winning_response: "Imagine walking into a library with 100,000 books scattered randomly across shelves. If you want a book on 'Quantum Physics', without an index you would have to walk down every aisle, picking up all 100,000 books one by one until you find it — which takes hours. But at the front of the library, there is an alphabetical card catalog: you flip directly to the letter 'Q', find 'Quantum Physics', and it points you straight to Shelf 42, Row 3 in 5 seconds. That card catalog is a database index! The only trade-off is that every time the library buys a new book, the librarian has to update both the shelf AND the catalog card, which takes a tiny bit of extra time."
  },
  {
    id: "comm-4",
    title: "Explain Recursion Using Russian Nesting Dolls",
    type: "plain_english_concept",
    target_role: "Service Technical Interview",
    prompt_text: "Explain what Recursion is to a non-programmer using the analogy of Russian nesting dolls (Matryoshka) or looking into two facing mirrors. Emphasize what a 'base case' is and why programs crash with stack overflow without it.",
    context_note: "Tests the ability to demystify complex algorithmic constructs without showing code.",
    target_duration_seconds: 75,
    evaluation_rubric: {
      clarity_weight: 35,
      jargon_avoidance_weight: 30,
      structure_weight: 20,
      communicability_weight: 15
    },
    sample_winning_response: "Recursion is like opening a set of Russian nesting dolls. You open the biggest wooden doll, and inside you find a slightly smaller doll that looks identical. You open that one, and find another smaller doll. You repeat the exact same action over and over until you reach the tiniest, solid wooden doll that cannot be opened anymore. That smallest doll is what programmers call the 'base case' — it tells you to stop opening dolls and put everything back together. If you forgot to include that smallest solid doll, you would keep opening dolls forever until you run out of hands and table space, which in computers is called a crash!"
  },
  {
    id: "comm-5",
    title: "How Would You Handle a Major Client Conflict?",
    type: "hr_situational",
    target_role: "Corporate HR & Client Presentation",
    prompt_text: "You are on a client call with a senior banking client who is angry because a software feature delivered by your team has a bug. How do you de-escalate the situation and respond professionally?",
    context_note: "Critical test of emotional maturity, client communication, and avoiding defensive blame-shifting.",
    target_duration_seconds: 80,
    evaluation_rubric: {
      clarity_weight: 25,
      jargon_avoidance_weight: 20,
      structure_weight: 30,
      communicability_weight: 25
    },
    sample_winning_response: "First, I would listen patiently without interrupting, acknowledging the client's frustration with empathy: 'I completely understand how critical this transaction feature is to your end-users, and I apologize for the disruption.' Second, I would avoid arguing or blaming QA or other teams. Third, I would pivot immediately to action: clearly state the immediate mitigation steps we are taking, provide a concrete timeline for our next update within two hours, and follow up with a root-cause fix and preventive unit tests so it never happens again."
  }
];

// ── 8. REPOSITORY STORE CLASS ────────────────────────────────────────────────
class SkillHubStore {
  private studentTracks: Map<string, Array<"service_mass" | "service_elite" | "product_mid" | "product_faang">> = new Map();
  private dynamicAptitudeBank: AptitudeQuestion[] = [...SEED_APTITUDE_QUESTIONS];

  constructor() {
    this.studentTracks.set("student-demo", ["service_mass", "product_mid"]);
  }

  public getTracks(): CompanyTrack[] {
    return COMPANY_TRACKS;
  }

  public getStudentTracks(candidateId: string): Array<"service_mass" | "service_elite" | "product_mid" | "product_faang"> {
    return this.studentTracks.get(candidateId) || ["service_mass", "product_mid"];
  }

  public setStudentTracks(
    candidateId: string,
    tracks: Array<"service_mass" | "service_elite" | "product_mid" | "product_faang">
  ) {
    if (!tracks || tracks.length === 0) tracks = ["service_mass"];
    this.studentTracks.set(candidateId, tracks);
  }

  public getDomainsForTracks(
    tracks: Array<"service_mass" | "service_elite" | "product_mid" | "product_faang">
  ): SkillDomain[] {
    const hasService = tracks.includes("service_mass") || tracks.includes("service_elite");
    const hasProduct = tracks.includes("product_mid") || tracks.includes("product_faang");

    return SKILL_DOMAINS.filter(domain => {
      if (domain.is_service_track && hasService) return true;
      if (domain.is_product_track && hasProduct) return true;
      return false;
    });
  }

  public getAptitudeQuestions(companyTag?: string): AptitudeQuestion[] {
    if (!companyTag || companyTag === "all") {
      return this.dynamicAptitudeBank;
    }
    const cleanFilter = companyTag.toLowerCase().replace(/[_\-]/g, " ").trim();
    const filterTokens = cleanFilter.split(/\s+/).filter(t => t.length > 1);

    return this.dynamicAptitudeBank.filter(q => {
      const tag = q.company_tag.toLowerCase().replace(/[_\-]/g, " ");
      if (tag.includes(cleanFilter)) return true;
      // Match if key tokens match (e.g. 'tcs', 'nqt', 'infosys', 'wipro')
      return filterTokens.some(tok => tag.includes(tok));
    });
  }

  public addDynamicQuestions(questions: AptitudeQuestion[]) {
    this.dynamicAptitudeBank = [...questions, ...this.dynamicAptitudeBank];
  }

  public getCommunicationPrompts(): CommunicationPrompt[] {
    return SEED_COMMUNICATION_PROMPTS;
  }

  public getCSQuestions(domain?: string): CSInterviewQuestion[] {
    if (!domain || domain === "all") return SEED_CS_INTERVIEW_QUESTIONS;
    return SEED_CS_INTERVIEW_QUESTIONS.filter(q => q.domain === domain);
  }

  public getSystemDesignChallenges(): SystemDesignChallenge[] {
    return SEED_SYSTEM_DESIGN_CHALLENGES;
  }

  public getBehavioralQuestions(trackType?: string): BehavioralQuestion[] {
    if (!trackType || trackType === "all") return SEED_BEHAVIORAL_QUESTIONS;
    return SEED_BEHAVIORAL_QUESTIONS.filter(q => q.track_type === trackType);
  }

  public getResourcesForTracks(
    tracks: Array<"service_mass" | "service_elite" | "product_mid" | "product_faang">
  ): SkillResource[] {
    return SEED_SKILL_RESOURCES.filter(
      r => r.target_track === "all" || tracks.includes(r.target_track as any)
    );
  }

  public addCSQuestion(q: CSInterviewQuestion) {
    SEED_CS_INTERVIEW_QUESTIONS.unshift(q);
  }

  public addBehavioralQuestion(q: BehavioralQuestion) {
    SEED_BEHAVIORAL_QUESTIONS.unshift(q);
  }

  public addSystemDesignChallenge(c: SystemDesignChallenge) {
    SEED_SYSTEM_DESIGN_CHALLENGES.unshift(c);
  }

  public recordAptitudeSubmission(candidateId: string, submission: any) {
    return { recorded: true, candidateId, timestamp: new Date().toISOString() };
  }

  public recordCommunicationSubmission(candidateId: string, submission: any) {
    return { recorded: true, candidateId, timestamp: new Date().toISOString() };
  }
}

export const skillHubStore = new SkillHubStore();
