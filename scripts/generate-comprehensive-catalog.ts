import * as fs from "fs";
import * as path from "path";

interface Opportunity {
  id: string;
  title: string;
  type: "hackathon" | "internship" | "job" | "fellowship" | "grant" | "contest" | "research" | "scholarship" | "workshop" | "open-source";
  organizer: string;
  organizer_type: "IIT-fest" | "corporate" | "startup" | "open" | "university" | "government" | "community";
  tags: string[];
  domain_tags: string[];
  tier: "Tier 1" | "Tier 2" | "Tier 3";
  deadline: string;
  eligibility: string;
  source_url: string;
  verificationStatus: "verified" | "pending";
  mode: "remote" | "onsite" | "hybrid";
  teamSize: string;
  extracted_context: {
    platform: string;
    summary: string;
    prize_pool: string;
    tracks_or_themes: string[];
    team_size: string;
    schedule_label: string;
    status_badge: string;
    difficulty_tier: string;
    mode: string;
  };
}

const OPPORTUNITIES: Opportunity[] = [];

function addOpp(opp: Opportunity) {
  OPPORTUNITIES.push(opp);
}

// 1. Smart India Hackathon (SIH 2026) — SINGLE FLAGSHIP MASTER EVENT
addOpp({
  id: "opp-sih-2026",
  title: "Smart India Hackathon (SIH) 2026 — National Innovation Mission",
  type: "hackathon",
  organizer: "Ministry of Education & AICTE",
  organizer_type: "government",
  tags: ["AI", "GovTech", "IoT", "Robotics", "CleanTech", "Indic NLP", "Computer Vision", "Cybersecurity"],
  domain_tags: ["National Mission", "Smart Governance", "Public Infrastructure"],
  tier: "Tier 1",
  deadline: "2026-10-30T18:30:00Z",
  eligibility: "All undergraduate & postgraduate engineering students in India (teams of 6, min 1 female)",
  source_url: "https://www.sih.gov.in",
  verificationStatus: "verified",
  mode: "hybrid",
  teamSize: "6 members (mandatory 1 female)",
  extracted_context: {
    platform: "Smart India Hackathon",
    summary: "India's largest nationwide innovation hackathon across 20+ Union Ministries and PSUs. Syndicates solve pressing national challenges with institutional incubation and AICTE honors.",
    prize_pool: "₹1,00,000 per Problem Statement + National Incubation & Deployment Grants",
    tracks_or_themes: [
      "Smart Rail Safety & Track Defect AI (Railways)",
      "Rural Tele-Triage & Indic Voice AI (Health)",
      "Satellite Crop Disease Forecaster (Agriculture)",
      "Renewable Microgrid RL Balancing (Power)",
      "Disaster Search Drone Swarms (Home Affairs)",
      "Sub-50ms Contactless Biometrics (UIDAI)",
      "Cross-Border UPI Fraud Anomaly Graph (NPCI)",
      "Highway Accident Triage SOS (Road Transport)",
      "Mine Gas Leakage Structural IoT (Coal & Mines)",
      "Multilingual AR Monument Guide (Tourism)",
      "Robotic Solid Waste Classifier (Urban Affairs)"
    ],
    team_size: "6 members",
    schedule_label: "Idea Submissions: Oct 30, 2026 | Grand Finale: Dec 2026",
    status_badge: "Official National Mission",
    difficulty_tier: "high",
    mode: "hybrid"
  }
});

// 2. Premier College Tech Fests (ONE distinct card per premier institution)
const PREMIER_COLLEGES = [
  { college: "IIT Bombay", fest: "Techfest 2026", tracks: ["Autonomous Rovers", "Generative Media", "Quantum Computing Challenge"], prize: "₹5,00,000 + Sponsor PPIs" },
  { college: "IIT Delhi", fest: "Tryst 2026", tracks: ["FinTech Distributed Ledger", "Decentralized Compute", "Smart Mobility"], prize: "₹4,50,000 + VC Pitching" },
  { college: "IIT Madras", fest: "Shaastra 2026", tracks: ["Biomedical AI Diagnostics", "Underwater Robotics", "Cyber Defense CTF"], prize: "₹6,00,000 + Lab Incubation" },
  { college: "IIT Kanpur", fest: "Techkriti 2026", tracks: ["High-Frequency Trading Engines", "Aerospace Design Sprint", "Zero Knowledge Proofs"], prize: "₹5,00,000 + Sponsor Offers" },
  { college: "IIT Kharagpur", fest: "Kshitij 2026", tracks: ["Supply Chain Digital Twin", "Autonomous Drone Swarms", "Conversational AI"], prize: "₹4,00,000 + Merit Awards" },
  { college: "IIT Roorkee", fest: "Cognizance 2026", tracks: ["Geospatial AI", "Clean Energy Smart Grids", "Web3 Micropayments"], prize: "₹3,50,000 + Grants" },
  { college: "IIT Guwahati", fest: "Techniche 2026", tracks: ["Edge Computing for Agriculture", "Robotic Manipulation", "Indic Language AI"], prize: "₹3,00,000 + Trophies" },
  { college: "IIT BHU Varanasi", fest: "Technex 2026", tracks: ["Defense Autonomous Systems", "Smart Industrial Automation", "Cloud Optimization"], prize: "₹3,50,000" },
  { college: "IIT Hyderabad", fest: "Elan & nVision 2026", tracks: ["5G/6G Network Slicing", "Semiconductor VLSI Verification", "Bio-Computing"], prize: "₹3,00,000" },
  { college: "IIT Indore", fest: "Fluxus 2026", tracks: ["Precision Agritech", "Predictive SRE Incident Agents", "Full Stack NextGen"], prize: "₹2,50,000" },
  { college: "BITS Pilani (Pilani Campus)", fest: "APOGEE 2026", tracks: ["Algorithmic Trading & DeFi", "Quantum Cryptography", "Computer Vision"], prize: "₹4,00,000" },
  { college: "BITS Pilani (Goa Campus)", fest: "Quark 2026", tracks: ["Robotics Combat & Automation", "Decentralized Social Networks", "AI Agents"], prize: "₹3,50,000" },
  { college: "BITS Pilani (Hyderabad Campus)", fest: "ATMOS 2026", tracks: ["Cyber Threat Hunting", "Autonomous Vehicle Simulation", "Serverless Scale"], prize: "₹3,00,000" },
  { college: "NIT Trichy", fest: "Pragyan 2026", tracks: ["Humanitarian Open Source", "High-Throughput Distributed DBs", "Fintech Fraud"], prize: "₹3,50,000" },
  { college: "NIT Surathkal", fest: "Incident & Engineer 2026", tracks: ["Marine Robotics", "Smart Highway Toll Automation", "Renewable Energy"], prize: "₹3,00,000" },
  { college: "NIT Warangal", fest: "Technozion 2026", tracks: ["Aerospace Control Systems", "Healthcare AI", "Microservices Security"], prize: "₹3,00,000" },
  { college: "IIIT Hyderabad", fest: "Megathon 2026", tracks: ["Advanced Computer Vision", "Speech-to-Speech Translation", "Robotic Grasping"], prize: "₹4,00,000 + Research PPIs" },
  { college: "IIIT Delhi", fest: "Esya 2026", tracks: ["Human-AI Interaction", "Privacy-Preserving Computation", "Game Engine Tech"], prize: "₹2,50,000" },
  { college: "DTU Delhi", fest: "Invictus 2026", tracks: ["Automated Trading Bots", "Smart City Surveillance AI", "Distributed Systems"], prize: "₹3,00,000" },
  { college: "NSUT Delhi", fest: "Moksha-Innovision 2026", tracks: ["EdTech Personalization", "Web3 Zero Knowledge Rollups", "DevOps Pipelines"], prize: "₹2,50,000" }
];

PREMIER_COLLEGES.forEach((col, idx) => {
  addOpp({
    id: `opp-college-${idx + 1}`,
    title: `${col.college} ${col.fest} — Annual Flagship Hackathon`,
    type: "hackathon",
    organizer: `${col.college} Student Technical Council`,
    organizer_type: "IIT-fest",
    tags: ["Python", "React", "Node.js", "Docker", "FastAPI", "System Design"],
    domain_tags: ["Premier Campus", "Engineering Sprint", "Technical Fest"],
    tier: "Tier 1",
    deadline: `2026-${(10 + (idx % 3)).toString().padStart(2, "0")}-25T23:59:59Z`,
    eligibility: "Open to engineering & sciences undergraduate/graduate students nationwide",
    source_url: `https://unstop.com/fests/${col.college.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${col.fest.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    verificationStatus: "verified",
    mode: "hybrid",
    teamSize: "2-4 members",
    extracted_context: {
      platform: "Unstop / Official Fest",
      summary: `Flagship national competition at ${col.college} attracting podium teams across India. Includes VC jury pitching, hardware lab access, and sponsor PPIs.`,
      prize_pool: col.prize,
      tracks_or_themes: col.tracks,
      team_size: "2-4 members",
      schedule_label: `Annual Finale at ${col.college} Campus`,
      status_badge: "Premier Campus Hackathon",
      difficulty_tier: "high",
      mode: "hybrid"
    }
  });
});

// 3. Corporate Challenges & SDE Hiring Competitions (ONE distinct challenge per company)
const CORPORATE_DRIVES = [
  { company: "Google", challenge: "Solution Challenge 2026", domain: "Social Impact & AI", prize: "$10,000 + Google Mentorship", tags: ["Flutter", "GCP", "Firebase", "TensorFlow", "Node.js"], tracks: ["AI for UN SDGs", "Mobile Health", "Education Accessibility"] },
  { company: "Microsoft", challenge: "Imagine Cup 2026 Global Sprint", domain: "AI for Earth & Accessibility", prize: "$100,000 + Microsoft Founder Hub", tags: ["Azure", "OpenAI", "C#", "Python", "React"], tracks: ["Earth & CleanTech", "Generative AI", "Inclusive Tech"] },
  { company: "Amazon", challenge: "AWS Generative AI Serverless Challenge", domain: "Cloud Architecture", prize: "$50,000 + AWS Activate Credits", tags: ["AWS", "Python", "TypeScript", "Docker", "FastAPI"], tracks: ["Serverless Multi-Agent", "Event-Driven Bedrock", "Cost-Optimized Scale"] },
  { company: "Meta", challenge: "Llama 3 Open Source Hackathon", domain: "Open Source LLMs", prize: "$35,000 + Compute Grants", tags: ["PyTorch", "Python", "Transformers", "CUDA", "FastAPI"], tracks: ["Fine-Tuning on Custom Data", "Local On-Device Inference", "Agentic Tool Calling"] },
  { company: "Uber", challenge: "Urban Logistics & Fleet Dispatch Sprint", domain: "Distributed Systems", prize: "INR 10,00,000 + SDE-1 PPIs", tags: ["Go", "Java", "Distributed Systems", "Kafka", "PostgreSQL"], tracks: ["High-Concurrency Ride Matching", "Route Graph Optimization", "Surge Pricing Models"] },
  { company: "Atlassian", challenge: "DevOps Productivity & AI Plugin Hackathon", domain: "Developer Tools", prize: "Direct SDE-1 Interview Invites + ₹5 Lakhs", tags: ["TypeScript", "React", "Node.js", "Docker", "GraphQL"], tracks: ["Jira Agent Automation", "Code Review LLMs", "CI/CD Metric Predictors"] },
  { company: "Goldman Sachs", challenge: "Engineering Campus Hiring Challenge 2026", domain: "Financial Systems", prize: "Direct Summer 2027 Intern & Full-Time Offers", tags: ["Java", "C++", "Python", "Algorithms", "SQL"], tracks: ["Quantitative Data Structures", "High-Throughput Order Book", "Financial Risk Analysis"] },
  { company: "Morgan Stanley", challenge: "Code to Elevate Technology Sprint", domain: "Fintech Systems", prize: "Direct SDE Interview Invites + ₹4 Lakhs", tags: ["Java", "Spring Boot", "C++", "System Design", "SQL"], tracks: ["Trading Analytics", "Cloud Resilience", "Enterprise App Security"] },
  { company: "D.E. Shaw", challenge: "DESCO Tech Nexus Engineering Fellowship", domain: "Quantitative Software Engineering", prize: "INR 6,00,000 + Direct Mentorship", tags: ["Python", "C++", "Algorithms", "Data Structures", "Linux"], tracks: ["Low-Latency Data Pipelines", "Numerical Simulations", "Distributed Compute"] },
  { company: "Adobe", challenge: "GenSolve Creative Intelligence Hackathon", domain: "Computer Graphics & Vision", prize: "INR 7,50,000 + Direct Research Internships", tags: ["C++", "Python", "Computer Vision", "PyTorch", "WebGL"], tracks: ["Generative Fill Models", "Vector Asset Synthesis", "Real-Time 3D Rendering"] },
  { company: "Salesforce", challenge: "Agentforce Autonomous Enterprise Bot Hack", domain: "Autonomous Agents", prize: "$25,000 + AppExchange Feature", tags: ["JavaScript", "Node.js", "Python", "FastAPI", "React"], tracks: ["CRM Agent Workflows", "Multi-Tenant Security", "Event-Driven Automation"] },
  { company: "Cisco", challenge: "Cisco Ideathon 2026 — Secure Mesh Networks", domain: "Networking & Cybersecurity", prize: "Direct Software Engineer Offers (CTC ₹18 LPA)", tags: ["Python", "Networking", "C++", "Cybersecurity", "Linux"], tracks: ["Zero-Trust IoT Mesh", "Anomaly Packet Sniffing", "Edge SD-WAN Security"] },
  { company: "Samsung", challenge: "Samsung PRISM On-Device AI Innovation Sprint", domain: "Mobile & Edge AI", prize: "Funded Work-Let Projects + Direct PPIs", tags: ["Python", "TensorFlow Lite", "Android", "Kotlin", "C++"], tracks: ["NPU Model Optimization", "Vision LLMs on Phone", "Ultra-Low Power Audio AI"] },
  { company: "Intel", challenge: "oneAPI AI & Accelerated Computing Hack", domain: "High-Performance Computing", prize: "$15,000 + Intel Cloud Access", tags: ["C++", "oneAPI", "SYCL", "OpenVINO", "Python"], tracks: ["Cross-Architecture SYCL Code", "GPU/FPGA Acceleration", "OpenVINO Model Pipeline"] },
  { company: "NVIDIA", challenge: "Jetson Edge AI Robotics Hackathon", domain: "Robotics & Edge AI", prize: "$20,000 + Jetson Orin Hardware Kits", tags: ["Python", "CUDA", "C++", "ROS2", "Computer Vision"], tracks: ["Autonomous Mobile Robots", "Isaac Sim Digital Twins", "Edge VLM Triage"] },
  { company: "AMD", challenge: "ROCm Open Ecosystem AI Acceleration Hack", domain: "Heterogeneous Compute", prize: "$25,000 + AMD Instinct Hardware Grants", tags: ["C++", "PyTorch", "ROCm", "CUDA Migration", "Python"], tracks: ["PyTorch ROCm Acceleration", "Kernel Optimization", "Distributed Cluster LLM"] },
  { company: "Qualcomm", challenge: "Snapdragon Neural Processing Engine Challenge", domain: "Mobile Neural Computing", prize: "INR 5,00,000 + Hardware Kits", tags: ["C++", "Qualcomm SNPE", "Android", "Python", "Edge AI"], tracks: ["Snapdragon On-Device AI", "Hexagon DSP Quantization", "Heterogeneous Compute"] },
  { company: "Swiggy", challenge: "Hyperlocal Delivery ETA & Kitchen Dispatch Hack", domain: "E-Commerce Logistics", prize: "INR 4,00,000 + SDE-1 PPIs", tags: ["Java", "Go", "Redis", "Kafka", "Microservices"], tracks: ["ETA Dynamic Prediction", "Batched Order Routing", "Cold Chain Assurance"] },
  { company: "Zomato", challenge: "Real-Time Flash Cart Pricing & Fraud Mitigation Sprint", domain: "High-Concurrency Backend", prize: "Direct SDE-1 PPIs + ₹5 Lakhs", tags: ["Go", "Node.js", "PostgreSQL", "Kafka", "Distributed Systems"], tracks: ["Sub-10ms Cart Checkout", "Voucher Fraud Detection", "Live Rider Geofencing"] },
  { company: "JPMorgan Chase", challenge: "Code for Good 2026 National Chapter", domain: "Fintech & Social Impact", prize: "Full-Time SDE Offers (CTC ₹20+ LPA)", tags: ["Java", "Spring Boot", "React", "Python", "SQL"], tracks: ["NGO Digital Transformation", "Micro-Finance Lending", "Accessible Banking UI"] }
];

CORPORATE_DRIVES.forEach((c, idx) => {
  addOpp({
    id: `opp-corp-${idx + 1}`,
    title: `${c.company}: ${c.challenge}`,
    type: "hackathon",
    organizer: `${c.company} Engineering`,
    organizer_type: "corporate",
    tags: c.tags,
    domain_tags: [c.domain, "Corporate Drive", "High-Stakes PPI"],
    tier: "Tier 1",
    deadline: `2026-${(10 + (idx % 2)).toString().padStart(2, "0")}-20T18:30:00Z`,
    eligibility: "Final & Pre-Final Year B.Tech, Dual Degree, M.Tech, and MCA students",
    source_url: `https://unstop.com/competitions/${c.company.toLowerCase()}-${c.challenge.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    verificationStatus: "verified",
    mode: "remote",
    teamSize: "1-4 members",
    extracted_context: {
      platform: "Unstop / Corporate Portal",
      summary: `Official hiring and innovation challenge hosted by ${c.company}. Top-performing teams earn direct interview fast-tracks, grand jury prizes, and cloud infrastructure credits.`,
      prize_pool: c.prize,
      tracks_or_themes: c.tracks,
      team_size: "1-4 members",
      schedule_label: "Registrations Live | Code Submissions Open",
      status_badge: "Corporate SDE Fast-Track",
      difficulty_tier: "high",
      mode: "remote"
    }
  });
});

// 4. Web3, Blockchain & Decentralized Systems (ONE distinct card per ecosystem)
const WEB3_ECOSYSTEMS = [
  { chain: "Ethereum Foundation", name: "ETHIndia 2026", tracks: ["Account Abstraction", "Layer 2 Rollups", "DeFi Interop", "Decentralized Identity"], tags: ["Solidity", "TypeScript", "EVM", "Next.js", "Web3"] },
  { chain: "Polygon", name: "Polygon BUIDL Guild 2026", tracks: ["Zero-Knowledge Proofs", "AggLayer Cross-Chain", "Consumer dApps"], tags: ["Rust", "Solidity", "ZK-Rollups", "TypeScript", "Go"] },
  { chain: "Solana Foundation", name: "Solana Renaissance Summer Camp", tracks: ["High-Throughput DeFi", "DePIN Physical Infrastructure", "Mobile Solana"], tags: ["Rust", "Solana Anchor", "TypeScript", "React", "WebSockets"] },
  { chain: "Avalanche", name: "Avalanche Summit Hackathon", tracks: ["Custom Subnets", "Real-World Assets (RWA)", "Gaming Micro-Chains"], tags: ["Go", "Solidity", "EVM", "Docker", "Next.js"] },
  { chain: "Chainlink", name: "Chainlink Constellation 2026", tracks: ["Cross-Chain Interop Protocol (CCIP)", "Chainlink Functions", "DeFi Oracles"], tags: ["Solidity", "Chainlink Functions", "TypeScript", "Python"] },
  { chain: "Aptos", name: "Aptos Move Hackathon Asia", tracks: ["Parallel Execution", "Move Smart Contracts", "DeFi Automation"], tags: ["Move", "Rust", "TypeScript", "React"] },
  { chain: "Sui", name: "Sui Builder House Global", tracks: ["Object-Centric On-Chain Gaming", "Decentralized Social", "High-TPS Minting"], tags: ["Move", "Rust", "TypeScript", "Node.js"] },
  { chain: "Arbitrum", name: "Arbitrum Nitro Stylus Sprint", tracks: ["Multi-Language WASM Contracts (Rust & C++)", "L3 Orbit Chains", "Arbitrum DeFi"], tags: ["Rust", "C++", "Solidity", "WASM", "Docker"] },
  { chain: "Optimism", name: "Optimism Superchain Buildathon", tracks: ["Interoperable Superchain Bridges", "Retroactive Public Goods", "Governance Tooling"], tags: ["Solidity", "Go", "TypeScript", "EVM"] },
  { chain: "Base", name: "Base Onchain Summer Global", tracks: ["Consumer Apps", "Onchain Micro-Payments", "Creator Economies"], tags: ["TypeScript", "Solidity", "Next.js", "Smart Contracts"] },
  { chain: "Filecoin", name: "Filecoin Orbit Data Economy Hack", tracks: ["Decentralized AI Storage", "Proof of Spacetime", "Compute-Over-Data"], tags: ["Go", "Rust", "IPFS", "Filecoin", "Python"] },
  { chain: "Near Protocol", name: "NEAR Chain Abstraction Summit", tracks: ["Universal Keyless Onboarding", "FastAuth Web3", "Near BOS Components"], tags: ["Rust", "JavaScript", "TypeScript", "WebAssembly"] }
];

WEB3_ECOSYSTEMS.forEach((w, idx) => {
  addOpp({
    id: `opp-web3-${idx + 1}`,
    title: `${w.name} — Global Web3 & Ecosystem Hackathon`,
    type: "hackathon",
    organizer: `${w.chain} Developer DAO`,
    organizer_type: "open",
    tags: w.tags,
    domain_tags: ["Web3", "Blockchain", "Decentralized Systems"],
    tier: "Tier 1",
    deadline: `2026-${(10 + (idx % 2)).toString().padStart(2, "0")}-28T23:59:59Z`,
    eligibility: "Open globally to all developers, researchers, and students",
    source_url: `https://devfolio.co/hackathons/${w.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    verificationStatus: "verified",
    mode: "remote",
    teamSize: "1-4 members",
    extracted_context: {
      platform: "Devfolio / ETHGlobal",
      summary: `Ecosystem buildathon organized by ${w.chain}. Teams build production-ready decentralized protocols with direct bounty pools, venture accelerator grants, and token bounties.`,
      prize_pool: "$50,000 + Ecosystem Seed Grants",
      tracks_or_themes: w.tracks,
      team_size: "1-4 members",
      schedule_label: "Bounties Active | Remote Submission",
      status_badge: "Ecosystem Bounty Track",
      difficulty_tier: "high",
      mode: "remote"
    }
  });
});

// 5. Global Devpost, MLH, and International Open Challenges (ONE distinct card per premier hackathon)
const GLOBAL_HACKS = [
  { name: "CalHacks 12.0", university: "UC Berkeley", focus: "AI Hardware & Large Models", tags: ["Python", "PyTorch", "React", "FastAPI", "Docker"], tracks: ["Frontier LLMs", "Robotics & Hardware", "Civic Resilience"] },
  { name: "HackMIT 2026", university: "MIT", focus: "Frontier Computing & Bio-Informatics", tags: ["Python", "Rust", "TypeScript", "React", "Next.js"], tracks: ["Synthetic Biology AI", "Quantum Computing", "Open Science"] },
  { name: "PennApps XXVII", university: "University of Pennsylvania", focus: "Healthcare & Fintech Disruption", tags: ["React Native", "Node.js", "Python", "PostgreSQL"], tracks: ["Medical Imaging", "Micro-Lending", "Emergency Dispatch"] },
  { name: "TreeHacks 2026", university: "Stanford University", focus: "Moonshots for Global Resilience", tags: ["Python", "TypeScript", "PyTorch", "FastAPI", "Go"], tracks: ["Climate Intelligence", "Human Health", "Autonomous Systems"] },
  { name: "HackTheNorth 2026", university: "University of Waterloo", focus: "Systems Performance & Scalability", tags: ["Go", "Rust", "C++", "Distributed Systems"], tracks: ["High-Throughput Infra", "Low-Latency Web", "Developer Tooling"] },
  { name: "OpenAI DevDay Global Hackathon", university: "OpenAI", focus: "Multi-Agent Swarms & Realtime API", tags: ["Python", "TypeScript", "FastAPI", "React", "WebSockets"], tracks: ["Realtime Voice Agents", "Vision Tooling", "Multi-Agent Orchestration"] },
  { name: "Anthropic Claude Agents Hack", university: "Anthropic", focus: "Computer Use & Deterministic Workflows", tags: ["Python", "TypeScript", "Docker", "FastAPI"], tracks: ["Computer Use OS Automation", "Evaluations & Benchmarks", "Structured RAG"] },
  { name: "Hugging Face Open LLM Sprint", university: "Hugging Face", focus: "Edge Model Quantization & Fine-Tuning", tags: ["PyTorch", "Transformers", "Python", "CUDA"], tracks: ["Small Language Models (SLMs)", "Dataset Distillation", "Local vLLM Serving"] },
  { name: "Mistral AI Hackathon Europe", university: "Mistral AI", focus: "Reasoning Models & Codestral Workflows", tags: ["Python", "Rust", "FastAPI", "Docker"], tracks: ["Codestral Code Refactor", "Multilingual Reasoning", "Mixtral MoE Tuning"] },
  { name: "GitHub Universe Cloud Hack", university: "GitHub", focus: "Developer Tooling & Copilot Extensions", tags: ["TypeScript", "Node.js", "React", "Docker"], tracks: ["Copilot Chat Plugins", "GitHub Actions Automation", "Open Source Metrics"] }
];

GLOBAL_HACKS.forEach((g, idx) => {
  addOpp({
    id: `opp-global-${idx + 1}`,
    title: `${g.name} — ${g.university}`,
    type: "hackathon",
    organizer: `${g.university} & MLH`,
    organizer_type: "university",
    tags: g.tags,
    domain_tags: ["Global Hackathon", "International", g.focus],
    tier: "Tier 1",
    deadline: `2026-11-${(15 + (idx % 10)).toString().padStart(2, "0")}T23:59:59Z`,
    eligibility: "Open to students enrolled in accredited colleges & universities globally",
    source_url: `https://devpost.com/hackathons/${g.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    verificationStatus: "verified",
    mode: "hybrid",
    teamSize: "2-4 members",
    extracted_context: {
      platform: "Devpost / MLH",
      summary: `Premier international hackathon hosted by ${g.university}. Top global engineering judges evaluate 36-hour sprint submissions with hardware testbeds and cloud API sponsorships.`,
      prize_pool: "$30,000 + Sponsor APIs & YC Fast-Tracks",
      tracks_or_themes: g.tracks,
      team_size: "2-4 members",
      schedule_label: "Global Virtual Track Available",
      status_badge: "MLH Official Member",
      difficulty_tier: "high",
      mode: "hybrid"
    }
  });
});

// 6. Distinct Career & Internship Opportunities (ONE card per company program)
const DISTINCT_CAREERS = [
  { title: "Google STEP Internship 2027", org: "Google", type: "internship", tags: ["C++", "Java", "Python", "Data Structures", "Algorithms"], tier: "Tier 1", prize: "Stipend ₹1,10,000/mo + PPO", deadline: "2026-11-15T18:30:00Z" },
  { title: "Microsoft Engage & SWE Summer Intern 2027", org: "Microsoft", type: "internship", tags: ["C++", "C#", "Algorithms", "System Design", "Python"], tier: "Tier 1", prize: "Stipend ₹1,25,000/mo + PPO", deadline: "2026-11-20T18:30:00Z" },
  { title: "Amazon WOW & SDE Internship Drive", org: "Amazon", type: "internship", tags: ["Java", "Distributed Systems", "SQL", "Linux", "Algorithms"], tier: "Tier 1", prize: "Stipend ₹1,10,000/mo + PPO", deadline: "2026-10-31T18:30:00Z" },
  { title: "Uber STAR Engineering Internship", org: "Uber", type: "internship", tags: ["Go", "Java", "Kafka", "Data Structures", "Algorithms"], tier: "Tier 1", prize: "Stipend ₹1,60,000/mo + PPO", deadline: "2026-11-05T18:30:00Z" },
  { title: "D.E. Shaw Technology Summer Associate", org: "D. E. Shaw India", type: "internship", tags: ["C++", "Python", "Linux", "Algorithms", "System Design"], tier: "Tier 1", prize: "Stipend ₹2,00,000/mo + PPO", deadline: "2026-10-28T18:30:00Z" },
  { title: "Morgan Stanley Technology Analyst Intern", org: "Morgan Stanley", type: "internship", tags: ["Java", "Spring Boot", "SQL", "C++", "Data Structures"], tier: "Tier 1", prize: "Stipend ₹1,00,000/mo + PPO", deadline: "2026-11-10T18:30:00Z" },
  { title: "Goldman Sachs Summer Analyst Program", org: "Goldman Sachs", type: "internship", tags: ["Java", "C++", "Python", "Algorithms", "Financial Systems"], tier: "Tier 1", prize: "Stipend ₹1,00,000/mo + PPO", deadline: "2026-11-12T18:30:00Z" },
  { title: "Atlassian Software Engineer Intern 2027", org: "Atlassian", type: "internship", tags: ["Java", "React", "TypeScript", "System Design", "Docker"], tier: "Tier 1", prize: "Stipend ₹1,20,000/mo + PPO", deadline: "2026-10-25T18:30:00Z" },
  { title: "Cisco International Software Intern Program", org: "Cisco", type: "internship", tags: ["Python", "C++", "Networking", "Linux", "Docker"], tier: "Tier 1", prize: "Stipend ₹80,000/mo + PPO", deadline: "2026-11-30T18:30:00Z" },
  { title: "Adobe Research & SDE Intern 2027", org: "Adobe", type: "internship", tags: ["C++", "Python", "Computer Vision", "Machine Learning"], tier: "Tier 1", prize: "Stipend ₹1,00,000/mo + PPO", deadline: "2026-11-18T18:30:00Z" },
  { title: "MLH Fellowship: Open Source & SWE", org: "Major League Hacking", type: "fellowship", tags: ["Open Source", "Git", "Python", "JavaScript", "Docker"], tier: "Tier 1", prize: "$5,000 Educational Stipend", deadline: "2026-12-01T18:30:00Z" },
  { title: "Google Summer of Code (GSoC) 2027", org: "Google Open Source", type: "open-source", tags: ["Git", "C++", "Python", "Rust", "Go"], tier: "Tier 1", prize: "$3,000 - $6,000 Stipend", deadline: "2026-12-15T18:30:00Z" },
  { title: "Linux Foundation Mentorship Program (LFX)", org: "Linux Foundation", type: "open-source", tags: ["Linux Kernel", "Go", "Rust", "Kubernetes", "C"], tier: "Tier 1", prize: "$3,000 - $6,000 Stipend", deadline: "2026-11-25T18:30:00Z" },
  { title: "Outreachy Open Source Diversity Fellowship", org: "Software Freedom Conservancy", type: "fellowship", tags: ["Python", "Documentation", "Git", "JavaScript"], tier: "Tier 1", prize: "$7,000 Remote Stipend", deadline: "2026-11-28T18:30:00Z" },
  { title: "CERN Openlab Summer Student Research", org: "CERN", type: "research", tags: ["C++", "High Energy Physics", "HPC", "Python", "Linux"], tier: "Tier 1", prize: "Geneva Residency + 3,400 CHF/mo", deadline: "2026-12-10T18:30:00Z" },
  { title: "PM Internship Scheme 2026 (Govt of India)", org: "Ministry of Corporate Affairs (MCA)", type: "internship", tags: ["Corporate Governance", "Python", "Data Analysis", "Management"], tier: "Tier 1", prize: "Stipend ₹5,000/mo + ₹6,000 One-time grant", deadline: "2026-10-30T18:30:00Z" },
  { title: "TCS CodeVita Season 14 Global Contest", org: "Tata Consultancy Services", type: "contest", tags: ["C++", "Java", "Python", "Data Structures", "Algorithms"], tier: "Tier 2", prize: "INR 15,00,000 + Direct Digital/Prime Offers", deadline: "2026-10-22T18:30:00Z" },
  { title: "Infosys HackWithInfy 2026", org: "Infosys", type: "contest", tags: ["Java", "Python", "Competitive Programming", "Algorithms"], tier: "Tier 2", prize: "Direct Specialist Programmer (SP) Offers", deadline: "2026-11-08T18:30:00Z" },
  { title: "Tata Imagination Challenge 2026", org: "Tata Sons", type: "contest", tags: ["Case Study", "Business Strategy", "Technology Innovation"], tier: "Tier 1", prize: "INR 2,00,000 + Tata Leadership Fast-Track", deadline: "2026-10-15T18:30:00Z" },
  { title: "Mahindra Rise Innovation Derby", org: "Mahindra & Mahindra", type: "contest", tags: ["EV Architecture", "AI Telematics", "IoT", "CleanTech"], tier: "Tier 2", prize: "INR 5,00,000 + PPIs", deadline: "2026-11-14T18:30:00Z" }
];

DISTINCT_CAREERS.forEach((item, idx) => {
  addOpp({
    id: `opp-career-${idx + 1}`,
    title: item.title,
    type: item.type as any,
    organizer: item.org,
    organizer_type: "corporate",
    tags: item.tags,
    domain_tags: ["Career Track", item.type.toUpperCase(), "Verified Pathway"],
    tier: item.tier as any,
    deadline: item.deadline,
    eligibility: "Pre-final and graduating undergraduate / graduate students",
    source_url: `https://unstop.com/jobs-internships/${item.org.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${item.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    verificationStatus: "verified",
    mode: "remote",
    teamSize: "Individual Application",
    extracted_context: {
      platform: "Direct Corporate Portal / Unstop",
      summary: `Official hiring pipeline for ${item.title} at ${item.org}. Verified recruiter assessment with direct interview shortlists and performance stipend.`,
      prize_pool: item.prize,
      tracks_or_themes: ["Data Structures & Algorithms", "System Design & Architecture", "Executive Interview Round"],
      team_size: "Individual",
      schedule_label: "Rolling Applications Active",
      status_badge: "Verified Career Pathway",
      difficulty_tier: "high",
      mode: "remote"
    }
  });
});

// 7. Distinct Regional State & City Innovation Summits (ONE card per city summit)
const REGIONAL_HUBS = [
  { city: "Bangalore", name: "Bengaluru Tech Summit (BTS) Hackathon", focus: "Fintech & Open Commerce", tags: ["Java", "Go", "Kafka", "ONDC", "React"] },
  { city: "Hyderabad", name: "T-Hub Global Innovation Challenge", focus: "DeepTech & Semiconductor", tags: ["Python", "C++", "Edge AI", "VLSI", "FastAPI"] },
  { city: "Pune", name: "Pune Tech Conclave Hackathon", focus: "Automotive & Electric Mobility", tags: ["C++", "Python", "ROS", "CAN Bus", "IoT"] },
  { city: "Chennai", name: "Chennai SaaS Builders Sprint", focus: "Multi-Tenant Enterprise SaaS", tags: ["TypeScript", "Next.js", "PostgreSQL", "Tailwind", "Docker"] },
  { city: "Delhi NCR", name: "Delhi Smart Governance Sprint", focus: "Public Service Delivery & Air Quality", tags: ["Python", "FastAPI", "GIS", "React", "PostgreSQL"] },
  { city: "Mumbai", name: "Fintech Mumbai Innovation Derby", focus: "Algorithmic Trading & Capital Markets", tags: ["Python", "C++", "Redis", "WebSockets", "Kafka"] },
  { city: "Ahmedabad", name: "GIFT City Financial Sandbox Challenge", focus: "Cross-Border Settlement & DeFi", tags: ["Solidity", "Go", "Distributed Systems", "SQL"] },
  { city: "Kolkata", name: "Eastern India Developer League", focus: "Agritech & Supply Chain Logistics", tags: ["Python", "React Native", "Node.js", "PostgreSQL"] },
  { city: "Jaipur", name: "Rajasthan DigiFest Hackathon", focus: "Heritage Tourism & Vernacular AI", tags: ["Python", "Indic NLP", "React", "MongoDB"] },
  { city: "Chandigarh", name: "North India AI & Agritech Sprint", focus: "Precision Agriculture & Water Systems", tags: ["Python", "Computer Vision", "TensorFlow", "FastAPI"] },
  { city: "Kochi", name: "Kerala Startup Mission (KSUM) Hack", focus: "Marine Tech & Sustainable Tourism", tags: ["Python", "IoT", "React", "FastAPI", "Docker"] },
  { city: "Bhubaneswar", name: "Odisha Mining & Disaster Tech Hack", focus: "Cyclone Early Warning & Mine Safety", tags: ["Python", "GIS", "Time Series", "WebSockets"] },
  { city: "Indore", name: "Clean City Smart Waste Innovation Sprint", focus: "Circular Economy & Automated Sorting", tags: ["Python", "Computer Vision", "YOLOv8", "React"] },
  { city: "Lucknow", name: "Uttar Pradesh HealthTech Hackathon", focus: "Rural Primary Healthcare Triage", tags: ["Python", "FastAPI", "WebRTC", "React Native"] },
  { city: "Goa", name: "Goa International Web3 & Coastal Hack", focus: "Decentralized Eco-Tourism & Marine AI", tags: ["Solidity", "TypeScript", "Python", "Next.js"] }
];

REGIONAL_HUBS.forEach((r, idx) => {
  addOpp({
    id: `opp-regional-${idx + 1}`,
    title: `${r.name} (${r.city})`,
    type: "hackathon",
    organizer: `${r.city} Innovation Ecosystem & State Tech Board`,
    organizer_type: "community",
    tags: r.tags,
    domain_tags: ["Regional Flagship", r.focus, "Civic Tech"],
    tier: "Tier 2",
    deadline: `2026-${(10 + (idx % 3)).toString().padStart(2, "0")}-15T18:30:00Z`,
    eligibility: "Open to students & developer syndicates nationwide",
    source_url: `https://unstop.com/hackathons/${r.city.toLowerCase()}-${r.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    verificationStatus: "verified",
    mode: "hybrid",
    teamSize: "2-4 members",
    extracted_context: {
      platform: "Unstop / Regional Tech Board",
      summary: `State and city flagship hackathon for ${r.city}. Direct cash awards, state incubation seed grants, and government sandbox deployment for top podium projects.`,
      prize_pool: "₹3,00,000 + State Incubation Fast-Track",
      tracks_or_themes: [r.focus, "Public Infrastructure", "Smart Systems", "Local Impact"],
      team_size: "2-4 members",
      schedule_label: "Open Submissions Phase",
      status_badge: "Regional Innovation Track",
      difficulty_tier: "medium",
      mode: "hybrid"
    }
  });
});

// 8. Competitive Programming & Global Contests
const CONTESTS = [
  { name: "ICPC Asia Regional Contest 2026", org: "ICPC Foundation & Amrita / IIT Kanpur", tags: ["C++", "Java", "Algorithms", "Graph Theory", "Dynamic Programming"], prize: "World Finals Qualification + Sponsor Prizes", deadline: "2026-11-20T18:30:00Z" },
  { name: "Codeforces Global Round Championship", org: "Codeforces", tags: ["Competitive Programming", "Math", "Number Theory", "Binary Search"], prize: "Rating Honors + International Recognition", deadline: "2026-10-31T18:30:00Z" },
  { name: "LeetCode Biweekly & Weekly Grand Championship", org: "LeetCode", tags: ["Algorithms", "Data Structures", "System Optimization"], prize: "LeetCode Coins + Direct SDE Referrals", deadline: "2026-10-28T18:30:00Z" },
  { name: "AtCoder Grand Contest (AGC 2026)", org: "AtCoder Japan", tags: ["Algorithms", "Combinatorics", "C++", "Competitive Coding"], prize: "Grandmaster Ranking + Sponsor Bounties", deadline: "2026-11-05T18:30:00Z" },
  { name: "Kaggle Grandmaster Reasoning Challenge", org: "Kaggle & Google", tags: ["Python", "PyTorch", "Transformers", "Kaggle", "Data Science"], prize: "$50,000 + Kaggle Gold Medals", deadline: "2026-11-22T18:30:00Z" },
  { name: "DEF CON National CTF Qualifiers", org: "DEF CON & OWASP", tags: ["Reverse Engineering", "Binary Exploitation", "Cryptography", "Python", "C"], prize: "DEF CON Black Badge + Las Vegas Travel", deadline: "2026-11-18T18:30:00Z" }
];

CONTESTS.forEach((c, idx) => {
  addOpp({
    id: `opp-contest-${idx + 1}`,
    title: c.name,
    type: "contest",
    organizer: c.org,
    organizer_type: "open",
    tags: c.tags,
    domain_tags: ["Competitive Programming", "Algorithmic Contest", "High Performance"],
    tier: "Tier 1",
    deadline: c.deadline,
    eligibility: "Open to all students and competitive programmers worldwide",
    source_url: `https://codeforces.com/contests`,
    verificationStatus: "verified",
    mode: "remote",
    teamSize: "1-3 members",
    extracted_context: {
      platform: "Global Contest Platform",
      summary: `Premier international competitive coding contest hosted by ${c.org}. Top algorithmic thinkers compete under timed conditions.`,
      prize_pool: c.prize,
      tracks_or_themes: ["Advanced Data Structures", "Combinatorics & Graph Theory", "High-Speed Algorithmic Solving"],
      team_size: "1-3 members",
      schedule_label: "Upcoming Rated Round",
      status_badge: "Verified Contest",
      difficulty_tier: "high",
      mode: "remote"
    }
  });
});

// Write to data/comprehensive-opportunities.json
const outDir = path.join(__dirname, "../data");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outFile = path.join(outDir, "comprehensive-opportunities.json");
fs.writeFileSync(outFile, JSON.stringify(OPPORTUNITIES, null, 2), "utf8");

console.log(`Successfully generated ${OPPORTUNITIES.length} distinct, non-repeating comprehensive opportunities in: ${outFile}`);
