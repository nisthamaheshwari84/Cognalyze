export interface GDTopicItem {
  id: string;
  title: string;
  category: "Current / Relevant" | "Technical" | "Business" | "Abstract" | "HR" | "AI & Technology";
  domain?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimitMinutes: number;
  freshness?: "Latest" | "Trending" | "Evergreen" | "Recently Generated";
  source_context?: string;
  isAiGenerated?: boolean;
  generatedAt?: string;
  preparationPoints: string[];
  recommendedRoles: string[];
  whyRecommended: string;
}

export const GD_CATEGORIES = [
  "All",
  "Current / Relevant",
  "Technical",
  "Business",
  "Abstract",
  "HR",
  "AI & Technology"
] as const;

export const GD_DOMAINS = [
  "AI & Machine Learning",
  "Software Engineering",
  "Technology",
  "Startups",
  "Business",
  "Finance",
  "Economics",
  "Education",
  "Cybersecurity",
  "Climate & Sustainability",
  "Workplace & Careers",
  "Society",
  "Ethics",
  "Future of Work",
  "Abstract",
  "Current Affairs"
] as const;

export const GD_FRESHNESS_OPTIONS = [
  "All",
  "Latest",
  "Recently Generated",
  "Trending",
  "Evergreen"
] as const;

export const GD_TOPICS: GDTopicItem[] = [
  // ─── 1. AI & TECHNOLOGY ─────────────────────────────────────────────
  {
    id: "gd-ai-001",
    title: "Autonomous AI Coding Agents vs Junior Software Engineers: Redefining Campus Hiring in 2026",
    category: "AI & Technology",
    difficulty: "Medium",
    timeLimitMinutes: 15,
    preparationPoints: [
      "AI models automate 75%+ of boilerplate CRUD and syntactic unit testing.",
      "Recruiter shift: Evaluating distributed system trade-offs, debugging, and prompt chaining over memorized LeetCode.",
      "The junior bottleneck: If junior developers write less initial code, how do organizations train future senior architects?",
      "Human-in-the-loop governance: Accountability for security vulnerabilities and legal data copyright in generated code."
    ],
    recommendedRoles: ["AI/ML Engineer", "Software Engineer", "Full Stack Developer"],
    whyRecommended: "Directly relates to the changing paradigm of technical interviews and day-1 engineering expectations for AI and software roles."
  },
  {
    id: "gd-ai-002",
    title: "Open-Source Weights vs Closed Proprietary AI: Enterprise Dominance and Data Sovereignty",
    category: "AI & Technology",
    difficulty: "Hard",
    timeLimitMinutes: 20,
    preparationPoints: [
      "Data sovereignty and compliance (GDPR, DPDP Act) favor on-premise fine-tuned open-weights.",
      "Cost economics: Capex of dedicated GPU clusters vs Opex of pay-per-token frontier APIs.",
      "Frontier reasoning gap: Proprietary models lead on deep multi-modal reasoning and tool-use benchmarks.",
      "Security: Vulnerability patching velocity and IP leak exposure in public API endpoints."
    ],
    recommendedRoles: ["AI/ML Engineer", "Cloud Architect", "Security Engineer"],
    whyRecommended: "Tests strategic technology evaluation and infrastructure economics essential for modern enterprise AI."
  },

  // ─── 2. TECHNICAL ───────────────────────────────────────────────────
  {
    id: "gd-tech-001",
    title: "Modular Monoliths vs Microservices for Early-Stage High-Growth Startups",
    category: "Technical",
    difficulty: "Medium",
    timeLimitMinutes: 15,
    preparationPoints: [
      "Shipping velocity: Monoliths eliminate distributed network latency, gRPC schemas, and multi-repo deployment overhead.",
      "Organizational scaling: Microservices decouple team release cadences once headcount exceeds 50 engineers.",
      "Operational complexity: Distributed tracing, eventual consistency, and network partitions in microservices vs single-process ACID transactions.",
      "The 'Distributed Monolith' anti-pattern: Microservices with tight coupling and synchronous HTTP chains."
    ],
    recommendedRoles: ["Backend Developer", "Software Engineer", "Systems Architect"],
    whyRecommended: "Standard technical interview debate evaluating pragmatic software engineering trade-offs over architecture hype."
  },
  {
    id: "gd-tech-002",
    title: "Zero-Trust Architecture: Non-Negotiable Security vs Engineering Shipping Friction",
    category: "Technical",
    difficulty: "Hard",
    timeLimitMinutes: 18,
    preparationPoints: [
      "Perimeter defense is dead: Phishing and credential theft require continuous identity verification at every RPC.",
      "Developer experience friction: Ephemeral tokens, mandatory 2FA on every git push, and restricted production access.",
      "Shadow IT risks: Excessive security friction causes developers to bypass official channels via unauthorized tools.",
      "Automated policy enforcement: GitOps-driven IAM and short-lived TLS certificates balancing security and speed."
    ],
    recommendedRoles: ["DevOps/SRE", "Security Engineer", "Backend Developer"],
    whyRecommended: "Highlights security posture awareness required for cloud, banking, and infrastructure placement rounds."
  },

  // ─── 3. CURRENT / RELEVANT ──────────────────────────────────────────
  {
    id: "gd-current-001",
    title: "Central Bank Digital Currencies (CBDC / e-Rupee) vs Unified Payments Interface (UPI)",
    category: "Current / Relevant",
    difficulty: "Medium",
    timeLimitMinutes: 15,
    preparationPoints: [
      "UPI is a private-bank payment rail; CBDC is sovereign legal tender that does not require commercial bank intermediation.",
      "Offline transactions: CBDC enables offline peer-to-peer payments in connectivity-dark rural regions.",
      "Privacy concerns: Programmable money allows state auditing of transactions, eliminating cash anonymity.",
      "Merchant adoption: UPI's zero-MDR infrastructure has massive existing merchant lock-in."
    ],
    recommendedRoles: ["FinTech Candidate", "Consultant", "Product Manager"],
    whyRecommended: "Frequent national campus hiring topic testing knowledge of monetary policy, digital public infrastructure, and fintech."
  },
  {
    id: "gd-current-002",
    title: "Deepfakes, Voice Cloning, and Biometric Identity: Threat to Digital KYC and Social Trust",
    category: "Current / Relevant",
    difficulty: "Medium",
    timeLimitMinutes: 12,
    preparationPoints: [
      "Generative voice and video models defeat traditional selfie-based video KYC verification within seconds.",
      "Financial fraud: Social engineering scams impersonating executives and family members.",
      "Cryptographic provenance: Watermarking, C2PA standards, and hardware secure enclaves as counter-measures.",
      "Regulatory mandates: Burden of proof and platform liability for synthetic content."
    ],
    recommendedRoles: ["Cybersecurity Specialist", "AI/ML Engineer", "Product Manager"],
    whyRecommended: "Connects real-world artificial intelligence impact with cyber forensics and regulatory compliance."
  },

  // ─── 4. BUSINESS & STARTUPS ─────────────────────────────────────────
  {
    id: "gd-biz-001",
    title: "Bootstrapping vs Venture Capital: Unit Economics vs Rapid Hyper-Scale Dominance",
    category: "Business",
    difficulty: "Medium",
    timeLimitMinutes: 15,
    preparationPoints: [
      "Bootstrapping enforces Day-1 profitability, customer-centric product market fit, and full founder equity retention.",
      "Venture Capital provides moat-building capital for winner-take-all network effect markets (e.g. ride-hailing, quick commerce).",
      "The 'Grow at all costs' trap: High burn rates leading to massive down-rounds and layoffs during capital winters.",
      "Hybrid models: Bootstrapping to initial PMF before taking strategic growth capital."
    ],
    recommendedRoles: ["Product Manager", "Business Analyst", "Strategy Consultant"],
    whyRecommended: "Core consulting and product placement topic evaluating financial acumen and market dynamics."
  },
  {
    id: "gd-biz-002",
    title: "Quick Commerce (10-minute delivery): Consumer Convenience vs Dark-Store Unit Economics & Worker Safety",
    category: "Business",
    difficulty: "Medium",
    timeLimitMinutes: 15,
    preparationPoints: [
      "High average order value (AOV) and ad revenue driving unexpected profitability in dense tier-1 pin codes.",
      "Negative externalities: Delivery partner road safety, gig worker labor protections, and neighborhood traffic congestion.",
      "Impact on traditional mom-and-pop (Kirana) retail stores and community commerce ecosystems.",
      "Inventory holding costs and perishable waste dynamics in urban micro-warehouses."
    ],
    recommendedRoles: ["Operations Analyst", "Product Manager", "Supply Chain Engineer"],
    whyRecommended: "High-frequency GD topic in consulting, FMCG, and e-commerce campus recruitment drives."
  },

  // ─── 5. ABSTRACT ────────────────────────────────────────────────────
  {
    id: "gd-abs-001",
    title: "Constraints Fuel Creativity: Is Unlimited Resource the Enemy of Innovation?",
    category: "Abstract",
    difficulty: "Hard",
    timeLimitMinutes: 15,
    preparationPoints: [
      "Apollo 13 and Indian Space Research (ISRO Mangalyaan): Sub-optimal budgets producing world-class lean engineering breakthroughs.",
      "Big Tech 'Innovator's Dilemma': Well-funded corporate labs suffering from inertia and risk aversion.",
      "Counter-perspective: Cutting-edge quantum computing, semiconductor fabs, and frontier LLMs require billions in initial capital.",
      "Synthesizing: Intellectual constraints sharpen problem framing; capital constraints filter vanity features."
    ],
    recommendedRoles: ["Management Trainee", "Software Engineer", "Consultant"],
    whyRecommended: "Classic abstract placement round topic used by top consulting firms (McKinsey, Bain) and service elite tracks."
  },
  {
    id: "gd-abs-002",
    title: "Speed vs Perfection: The Cost of Being First vs The Advantage of Second-Mover Adaptation",
    category: "Abstract",
    difficulty: "Medium",
    timeLimitMinutes: 12,
    preparationPoints: [
      "First-mover disadvantage: Bearing the immense R&D costs and regulatory friction of educating a nascent market.",
      "Second-mover advantage: Apple, Google, and Meta frequently let pioneers validate demand before executing polished scale.",
      "The risk of moving too fast: Accumulating catastrophic technical debt and customer dissatisfaction.",
      "The modern agility thesis: 'Ship, measure, learn' beats 2-year waterfall planning."
    ],
    recommendedRoles: ["Product Manager", "Strategy Consultant", "Full Stack Engineer"],
    whyRecommended: "Evaluates multi-dimensional reasoning, historical tech knowledge, and ability to structure abstract thoughts."
  },

  // ─── 6. HR & WORKPLACE ──────────────────────────────────────────────
  {
    id: "gd-hr-001",
    title: "Return-to-Office Mandates vs Permanent Remote Work: Career Growth and Mentorship Trade-offs",
    category: "HR",
    difficulty: "Easy",
    timeLimitMinutes: 15,
    preparationPoints: [
      "Junior mentorship deficit: Ambient learning, spontaneous hallway whiteboarding, and executive presence suffer in purely async setups.",
      "Productivity & mental health: Eliminating 2-hour daily commutes improves developer deep work and quality of life.",
      "Global talent access: Remote hiring democratizes high-paying opportunities beyond tier-1 metropolitan clusters.",
      "Hybrid compromise: Structured 2-3 anchor days for collaborative planning while reserving remote days for focused execution."
    ],
    recommendedRoles: ["Campus Placement Candidate", "HR Specialist", "Software Engineer"],
    whyRecommended: "Universal HR placement discussion topic focusing on workplace collaboration, empathy, and organizational culture."
  },
  {
    id: "gd-hr-002",
    title: "Moonlighting and Side Projects: Unethical Breach of Employment or Healthy Developer Upskilling?",
    category: "HR",
    difficulty: "Medium",
    timeLimitMinutes: 15,
    preparationPoints: [
      "Conflict of interest: Using employer IP, proprietary code, or work hours for secondary financial gains.",
      "Developer growth: Open-source contributions, technical writing, and passion projects accelerate skills that directly benefit primary employers.",
      "Cognitive fatigue: Burnout from dual employment degrading code quality and availability for primary team commitments.",
      "Clear transparent employment contracts: Distinguishing competitive moonlighting from non-conflicting creative endeavors."
    ],
    recommendedRoles: ["Campus Placement Candidate", "Software Engineer", "HR Specialist"],
    whyRecommended: "Frequently asked by Indian IT services companies (TCS, Infosys, Wipro) during campus interview panels."
  }
];
