/**
 * SEMANTIC JOB DESCRIPTION PARSER & ROLE DNA INTELLIGENCE LAYER
 * 
 * Truth Contracts:
 * 1. REQUIREMENT ≠ RESPONSIBILITY ≠ EVIDENCE ≠ CLAIM
 *    - Requirements: What the candidate must know or possess prior to hiring.
 *    - Responsibilities: What the candidate will do on the job. Never auto-converted to MUST_HAVE screening criteria.
 *    - Evidence Signals: Where downstream engines search for proof (GitHub, deployments, publications). Not candidate skills.
 *    - Claims vs Proof: Resume mentions are claims (Tier 3), verified code/projects are proof (Tier 1).
 * 2. Zero Hallucination: Never invent specific technologies (e.g. "cloud" never becomes "AWS").
 * 3. Canonical Normalization: Semantically equivalent expressions resolve to clean canonical skills.
 * 4. Ambiguity Transparency: Vague requirements are marked UNKNOWN / NEEDS_CONFIRMATION with concrete reasons.
 * 5. Deterministic Resiliency: Always has an intelligent rule-based semantic analyzer if the LLM is unreachable.
 */

import { groqFetch } from "@/lib/groq";
import { verifyQuoteInSource } from "@/lib/evidence/quote-verifier";
import {
  SemanticRequirementCategory,
  SemanticRequirementItem,
  RoleDNAStructure,
  AmbiguityStatus,
  RequirementType,
  ImportanceLevel,
  EvidenceExpectation
} from "./types";

// Standard Evidence Quality Hierarchy
export const EVIDENCE_HIERARCHY = {
  TIER_1: [
    "Verified work experience",
    "Meaningful GitHub implementation",
    "Deployed working project",
    "Open-source contribution",
    "Verified technical assessment",
    "Research implementation"
  ],
  TIER_2: [
    "Detailed project documentation",
    "Hackathon project",
    "Technical blog",
    "Public demo",
    "Significant coursework project"
  ],
  TIER_3: [
    "Resume keyword",
    "Generic project description",
    "Course completion certificate",
    "Self-claimed skill"
  ]
};

// Known Technology Canonical Normalization Table
const CANONICAL_SKILL_MAP: Record<string, string> = {
  // Programming Languages
  "python": "Python",
  "python programming": "Python",
  "python coding": "Python",
  "python development": "Python",
  "python3": "Python",
  "java": "Java",
  "javascript": "JavaScript",
  "typescript": "TypeScript",
  "c++": "C++",
  "c#": "C#",
  "golang": "Go",
  "go": "Go",
  "rust": "Rust",
  "r": "R",
  "scala": "Scala",
  "ruby": "Ruby",
  "swift": "Swift",
  "kotlin": "Kotlin",

  // ML / AI
  "machine learning": "Machine Learning",
  "machine learning fundamentals": "Machine Learning Fundamentals",
  "ml": "Machine Learning",
  "hands-on ml": "Machine Learning",
  "ml fundamentals": "Machine Learning Fundamentals",
  "supervised learning": "Supervised Learning",
  "unsupervised learning": "Unsupervised Learning",
  "deep learning": "Deep Learning",
  "natural language processing": "Natural Language Processing",
  "nlp": "Natural Language Processing",
  "computer vision": "Computer Vision",
  "recommendation systems": "Recommendation Systems",
  "recommendation system": "Recommendation Systems",
  "model evaluation": "Model Evaluation",
  "evaluation metrics": "Model Evaluation",
  "feature engineering": "Feature Engineering",
  "cross-validation": "Cross-Validation",
  "overfitting": "Model Evaluation",

  // GenAI / LLM
  "generative ai": "Generative AI",
  "generative artificial intelligence": "Generative AI",
  "genai": "Generative AI",
  "gen ai": "Generative AI",
  "llms": "LLMs",
  "llm": "LLMs",
  "large language models": "LLMs",
  "large language model": "LLMs",
  "rag": "RAG",
  "retrieval augmented generation": "RAG",
  "rag pipelines": "RAG",
  "rag architectures": "RAG",
  "embeddings": "Embeddings",
  "vector databases": "Vector Databases",
  "vector database": "Vector Databases",
  "vector db": "Vector Databases",
  "vector search": "Vector Databases",
  "ai agents": "AI Agents",
  "ai agent": "AI Agents",

  // LLM API Providers
  "openai": "OpenAI API",
  "openai api": "OpenAI API",
  "gemini": "Gemini API",
  "anthropic": "Anthropic API",
  "groq": "Groq API",
  "llm apis": "LLM APIs",
  "llm api": "LLM APIs",

  // ML Frameworks
  "numpy": "NumPy",
  "pandas": "Pandas",
  "scikit-learn": "scikit-learn",
  "sklearn": "scikit-learn",
  "pytorch": "PyTorch",
  "tensorflow": "TensorFlow",
  "pytorch / tensorflow": "PyTorch / TensorFlow",
  "pytorch or tensorflow": "PyTorch / TensorFlow",
  "keras": "Keras",
  "xgboost": "XGBoost",
  "matplotlib": "Matplotlib",
  "seaborn": "Seaborn",

  // Data Structures & Algorithms
  "data structures": "Data Structures & Algorithms",
  "data structures and algorithms": "Data Structures & Algorithms",
  "data structures & algorithms": "Data Structures & Algorithms",
  "dsa": "Data Structures & Algorithms",
  "algorithms": "Data Structures & Algorithms",

  // Backend Frameworks
  "fastapi": "FastAPI",
  "flask": "Flask",
  "django": "Django",
  "express": "Express.js",
  "spring boot": "Spring Boot",
  "node.js": "Node.js",
  "nodejs": "Node.js",

  // Frontend
  "react": "React",
  "reactjs": "React",
  "react.js": "React",
  "vue": "Vue.js",
  "vuejs": "Vue.js",
  "angular": "Angular",
  "next.js": "Next.js",
  "nextjs": "Next.js",

  // DevOps & Tools
  "docker": "Docker",
  "docker containerization": "Docker",
  "git": "Git",
  "github": "GitHub",
  "git/github": "Git/GitHub",
  "git & github": "Git/GitHub",
  "git and github": "Git/GitHub",
  "version control": "Git/GitHub",
  "ci/cd": "CI/CD",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  "linux": "Linux",
  "terraform": "Terraform",

  // Cloud
  "aws": "AWS",
  "amazon web services": "AWS",
  "gcp": "Google Cloud",
  "google cloud": "Google Cloud",
  "azure": "Azure",
  "microsoft azure": "Azure",
  "cloud deployment": "Cloud Deployment",
  "cloud platforms": "Cloud Deployment",
  "cloud technologies": "Cloud Deployment",
  "cloud infrastructure": "Cloud Infrastructure",
  "vercel": "Vercel",
  "render": "Render",
  "heroku": "Heroku",

  // Databases
  "sql": "SQL",
  "relational databases": "SQL",
  "postgresql": "PostgreSQL",
  "postgres": "PostgreSQL",
  "mongodb": "MongoDB",
  "mysql": "MySQL",
  "redis": "Redis",
  "elasticsearch": "Elasticsearch",
  "neo4j": "Neo4j",

  // APIs
  "rest apis": "REST APIs",
  "rest api": "REST APIs",
  "api design": "REST APIs",
  "graphql": "GraphQL",

  // Soft Skills & Activities
  "problem solving": "Problem Solving",
  "problem-solving": "Problem Solving",
  "analytical skills": "Analytical Skills",
  "analytical thinking": "Analytical Skills",
  "communication skills": "Communication Skills",
  "teamwork": "Teamwork",
  "leadership": "Leadership",

  // Activities
  "hackathons": "Hackathons",
  "hackathon": "Hackathons",
  "coding competitions": "Coding Competitions",
  "coding competition": "Coding Competitions",
  "open-source": "Open Source",
  "open source": "Open Source",
  "open source projects": "Open Source",
  "open-source projects": "Open Source",
  "internship": "Internship Experience",
  "internships": "Internship Experience",
  "previous internship": "Internship Experience",
  "prior internship": "Internship Experience",
  "software development experience": "Software Development Experience",
  "professional software development": "Software Development Experience",

  // System Design
  "system design": "System Design",
  "distributed systems": "Distributed Systems",
  "microservices": "Microservices",
};

// Requirement Type Classification Map
const REQUIREMENT_TYPE_MAP: Record<string, RequirementType> = {
  "Python": "programming_language",
  "Java": "programming_language",
  "JavaScript": "programming_language",
  "TypeScript": "programming_language",
  "C++": "programming_language",
  "C#": "programming_language",
  "Go": "programming_language",
  "Rust": "programming_language",
  "R": "programming_language",
  "SQL": "programming_language",
  "Ruby": "programming_language",
  "Swift": "programming_language",
  "Kotlin": "programming_language",
  "Scala": "programming_language",
  "scikit-learn": "framework",
  "PyTorch": "framework",
  "TensorFlow": "framework",
  "PyTorch / TensorFlow": "framework",
  "Keras": "framework",
  "XGBoost": "framework",
  "FastAPI": "framework",
  "Flask": "framework",
  "Django": "framework",
  "Express.js": "framework",
  "Spring Boot": "framework",
  "React": "framework",
  "Vue.js": "framework",
  "Angular": "framework",
  "Next.js": "framework",
  "Node.js": "framework",
  "NumPy": "tool",
  "Pandas": "tool",
  "Matplotlib": "tool",
  "Seaborn": "tool",
  "Docker": "tool",
  "Git": "tool",
  "GitHub": "tool",
  "Git/GitHub": "tool",
  "CI/CD": "tool",
  "Kubernetes": "tool",
  "Linux": "tool",
  "Terraform": "tool",
  "AWS": "cloud",
  "Google Cloud": "cloud",
  "Azure": "cloud",
  "Cloud Deployment": "cloud",
  "Cloud Infrastructure": "cloud",
  "Vercel": "deployment",
  "Render": "deployment",
  "Heroku": "deployment",
  "PostgreSQL": "database",
  "MongoDB": "database",
  "MySQL": "database",
  "Redis": "database",
  "Elasticsearch": "database",
  "Neo4j": "database",
  "Vector Databases": "database",
  "Machine Learning": "domain_knowledge",
  "Machine Learning Fundamentals": "domain_knowledge",
  "Deep Learning": "domain_knowledge",
  "Natural Language Processing": "domain_knowledge",
  "Computer Vision": "domain_knowledge",
  "Recommendation Systems": "domain_knowledge",
  "Supervised Learning": "domain_knowledge",
  "Unsupervised Learning": "domain_knowledge",
  "Model Evaluation": "domain_knowledge",
  "Feature Engineering": "domain_knowledge",
  "Cross-Validation": "domain_knowledge",
  "Data Structures & Algorithms": "domain_knowledge",
  "System Design": "domain_knowledge",
  "Distributed Systems": "domain_knowledge",
  "Microservices": "domain_knowledge",
  "Generative AI": "domain_knowledge",
  "LLMs": "domain_knowledge",
  "RAG": "domain_knowledge",
  "Embeddings": "domain_knowledge",
  "AI Agents": "domain_knowledge",
  "OpenAI API": "tool",
  "Gemini API": "tool",
  "Anthropic API": "tool",
  "Groq API": "tool",
  "LLM APIs": "tool",
  "REST APIs": "domain_knowledge",
  "GraphQL": "domain_knowledge",
  "Problem Solving": "behavioral",
  "Analytical Skills": "behavioral",
  "Communication Skills": "communication",
  "Teamwork": "behavioral",
  "Leadership": "behavioral",
  "Hackathons": "competition",
  "Coding Competitions": "competition",
  "Open Source": "open_source",
  "Internship Experience": "experience",
  "Software Development Experience": "experience",
};

/** Infer requirement type from canonical name */
export function inferRequirementType(canonicalName: string, subtype?: string): RequirementType {
  if (REQUIREMENT_TYPE_MAP[canonicalName]) {
    return REQUIREMENT_TYPE_MAP[canonicalName];
  }
  // Fallback heuristics
  const lower = canonicalName.toLowerCase();
  if (subtype === "education_degree") return "education";
  if (subtype === "experience_tenure") return "experience";
  if (subtype === "work_authorization") return "work_authorization";
  if (subtype === "operational_task") return "operational_task";
  if (subtype === "evidence_source") return "tool";
  if (lower.includes("degree") || lower.includes("bachelor") || lower.includes("master") || lower.includes("phd")) return "education";
  if (lower.includes("experience") || lower.includes("years")) return "experience";
  if (lower.includes("hackathon") || lower.includes("competition")) return "competition";
  if (lower.includes("open source") || lower.includes("open-source")) return "open_source";
  if (lower.includes("deploy") || lower.includes("hosting")) return "deployment";
  if (lower.includes("database") || lower.includes("db")) return "database";
  if (lower.includes("cloud") || lower.includes("aws") || lower.includes("gcp") || lower.includes("azure")) return "cloud";
  return "technical_skill";
}

/** Infer evidence expectation from type and category */
export function inferEvidenceExpectation(reqType: RequirementType, category: SemanticRequirementCategory): EvidenceExpectation {
  if (category === "ELIGIBILITY") return "certification";
  if (category === "RESPONSIBILITY") return "portfolio";
  if (reqType === "programming_language" || reqType === "framework" || reqType === "tool") return "implementation";
  if (reqType === "domain_knowledge") return "implementation";
  if (reqType === "education" || reqType === "certification") return "certification";
  if (reqType === "behavioral" || reqType === "communication") return "interview";
  if (reqType === "competition" || reqType === "open_source") return "portfolio";
  if (reqType === "experience" || reqType === "project_experience") return "portfolio";
  return "implementation";
}

// Known Ambiguous Phrases & Guidance
const AMBIGUOUS_TARGETS: { regex: RegExp; canonical: string; reason: string }[] = [
  {
    regex: /\b(cloud platforms?|cloud technologies|cloud experience|cloud environments?)\b/i,
    canonical: "Cloud Deployment",
    reason: "The JD mentions cloud experience but does not specify a particular cloud platform (e.g., AWS, Azure, GCP)."
  },
  {
    regex: /\b(modern frontend frameworks?|frontend libraries?)\b/i,
    canonical: "Frontend Framework",
    reason: "Specific framework (e.g., React, Vue, Angular) not identified in the JD."
  },
  {
    regex: /\b(relational or non-relational databases?|database knowledge|database experience)\b/i,
    canonical: "Databases",
    reason: "Database mentioned in generic terms; specific engine (e.g., PostgreSQL, MongoDB) not identified."
  },
  {
    regex: /\b(agile methodologies|fast-paced environment)\b/i,
    canonical: "Agile Delivery",
    reason: "Contextual work culture phrase; best verified through past sprint delivery history rather than flat keyword."
  }
];

// Evidence Signals Patterns
const EVIDENCE_SIGNAL_PATTERNS = [
  { regex: /\b(public (?:github|git|repositories|repos)|github(?:\.com)?\s+(?:profile|repos|repositories|link|url|account|portfolio)|(?:share|provide|submit)\s+(?:your\s+)?github)\b/i, name: "Public GitHub Repositories" },
  { regex: /\b(deployed (?:projects?|applications?|demos?)|live demos?|production deployments?)\b/i, name: "Deployed Projects" },
  { regex: /\b(open[- ]source contributions?|oss contributions?)\b/i, name: "Open-Source Contributions" },
  { regex: /\b(hackathons?|coding competitions?|kaggle)\b/i, name: "Hackathons & Competitions" },
  { regex: /\b(technical publications?|research papers?|whitepapers?)\b/i, name: "Technical Publications" },
  { regex: /\b(coding profiles?|leetcode|codeforces|codechef)\b/i, name: "Competitive Coding Profiles" },
  { regex: /\b(technical documentation|architecture specs?|design docs?)\b/i, name: "Technical Documentation" }
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SORTED_CANONICAL_ENTRIES = Object.entries(CANONICAL_SKILL_MAP).sort((a, b) => b[0].length - a[0].length);

export function findSkillsInText(text: string): string[] {
  const lower = text.toLowerCase();
  const matches: { canonical: string; index: number }[] = [];
  const seenCanonical = new Set<string>();

  for (const [key, canonical] of SORTED_CANONICAL_ENTRIES) {
    if (seenCanonical.has(canonical)) continue;

    const escaped = escapeRegex(key);
    const leftBoundary = /^\w/.test(key) ? "\\b" : "(?:^|\\s|[,;:(])";
    const rightBoundary = /\w$/.test(key) ? "\\b" : "(?:$|\\s|[,;:)])";
    const regex = new RegExp(`${leftBoundary}${escaped}${rightBoundary}`, "i");

    const match = regex.exec(lower);
    if (match) {
      matches.push({ canonical, index: match.index });
      seenCanonical.add(canonical);
    }
  }

  // Sort by index in text so skills appear in their natural reading order
  matches.sort((a, b) => a.index - b.index);
  return matches.map(m => m.canonical);
}

// Helper to normalize skill name
export function normalizeCanonicalName(raw: string): string {
  const clean = raw.trim().replace(/^[-*•●]\s*|\d+\.\s*/, "").replace(/[.,:;]+$/, "").trim();
  const lower = clean.toLowerCase();
  
  if (CANONICAL_SKILL_MAP[lower]) {
    return CANONICAL_SKILL_MAP[lower];
  }

  // Check prefix / suffix matches
  for (const [key, val] of Object.entries(CANONICAL_SKILL_MAP)) {
    if (lower === key || lower.startsWith(key + " ") || lower.endsWith(" " + key)) {
      return val;
    }
  }

  // Strip qualification boilerplate
  const stripped = clean
    .replace(/^(?:strong|solid|deep|proven|hands-on|good|excellent|basic|practical)?\s*(?:programming skills in|skills in|skills|experience (?:with|in)?|knowledge of|understanding of|familiarity with|exposure to|proficiency in|background in)\s*/i, "")
    .replace(/\s*(?:(?:is|are)?\s*(?:required|preferred|desirable|a plus|a bonus|mandatory)|programming skills?|skills?|programming|for version control)\.?$/i, "")
    .trim();

  const strippedLower = stripped.toLowerCase();
  if (CANONICAL_SKILL_MAP[strippedLower]) {
    return CANONICAL_SKILL_MAP[strippedLower];
  }

  // Match skill keywords in text
  const skillsFound = findSkillsInText(clean);
  if (skillsFound.length > 0) {
    return skillsFound[0];
  }

  if (stripped.length > 0) {
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }

  // Title case fallback
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// Helper to determine evidence expectations based on skill
export function getExpectedEvidenceSignals(canonicalName: string, category: SemanticRequirementCategory): string[] {
  if (category === "ELIGIBILITY") {
    return ["Academic Transcripts", "Degree Certificate", "Institutional Verification"];
  }
  if (category === "CONSTRAINT") {
    return ["Location Declaration", "Work Visa / Authorization Documentation"];
  }
  if (category === "EVIDENCE_SIGNAL") {
    return ["Public URL", "Verified Profile Audit"];
  }
  if (category === "RESPONSIBILITY") {
    return ["Relevant Projects", "Past Internship / Work Deliverables"];
  }

  const lower = canonicalName.toLowerCase();
  if (lower.includes("python") || lower.includes("dsa") || lower.includes("algorithm")) {
    return ["GitHub", "Projects", "Work Experience", "Technical Assessment"];
  }
  if (lower.includes("machine learning") || lower.includes("supervised") || lower.includes("unsupervised") || lower.includes("scikit") || lower.includes("pandas") || lower.includes("numpy") || lower.includes("model evaluation")) {
    return ["ML Projects", "GitHub Implementations", "Deployed Applications", "Technical Assessment"];
  }
  if (lower.includes("pytorch") || lower.includes("tensorflow") || lower.includes("deep learning")) {
    return ["Deep Learning Repositories", "Model Checkpoints / Demos", "Work Experience"];
  }
  if (lower.includes("rag") || lower.includes("llm") || lower.includes("embedding") || lower.includes("vector")) {
    return ["Working RAG Application", "GitHub Implementation", "Deployed Demo", "Architecture Documentation"];
  }
  if (lower.includes("docker") || lower.includes("fastapi") || lower.includes("cloud")) {
    return ["Containerized API Repositories", "Dockerfiles / CI Logs", "Live API Endpoints"];
  }
  if (lower.includes("git")) {
    return ["Commit History", "Pull Requests", "Code Review Activity"];
  }

  return ["GitHub Code", "Demonstrated Projects", "Technical Assessment"];
}

// Helper to determine verification strategy
export function getVerificationStrategy(canonicalName: string, category: SemanticRequirementCategory): string[] {
  if (category === "RESPONSIBILITY") {
    return [
      "On-the-job task: informs candidate alignment but is not an automatic elimination criterion",
      "Look for related capability implementations in candidate projects"
    ];
  }
  if (category === "ELIGIBILITY") {
    return [
      "Verify formal enrollment or degree completion",
      "Do not reject candidates based on institution ranking alone"
    ];
  }
  if (category === "EVIDENCE_SIGNAL") {
    return [
      "Inspect authentic commit history and incremental progression",
      "Detect and discount tutorial clones or single-commit code dumps"
    ];
  }

  return [
    `Look for meaningful ${canonicalName} implementation in candidate code`,
    "Do not treat keyword-only mentions or course certificates as proof",
    "Implementation > Claim (Tier 1 Direct Evidence prioritized over Tier 3 Claim)"
  ];
}

// Helper to extract acceptable options for OR relationships
export function extractAcceptableOptions(text: string, canonical: string): string[] | undefined {
  if (canonical.includes(" / ") || canonical.toLowerCase().includes(" or ")) {
    const parts = canonical.split(/\s*(?:\/|\bor\b)\s*/i).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }
  const orMatch = text.match(/\b([A-Za-z0-9+#.]+)\s+(?:or|\/)\s+([A-Za-z0-9+#.]+)\b/i);
  if (orMatch) {
    const opt1 = normalizeCanonicalName(orMatch[1]);
    const opt2 = normalizeCanonicalName(orMatch[2]);
    if (opt1 && opt2 && opt1.toLowerCase() !== opt2.toLowerCase()) {
      return [opt1, opt2];
    }
  }
  return undefined;
}

// Helper to extract minimum experience years from text
export function extractMinExperience(text: string): number | undefined {
  const match = text.match(/(\d+)\+?\s*years?/i);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Merges LLM semantic extraction with deterministic ground-truth extraction.
 * Guarantees zero missed requirements while retaining rich LLM rationales and verbatim citations.
 */
export function mergeRoleDnaResults(
  llmResult: RoleDNAStructure,
  deterministicResult: RoleDNAStructure,
  sourceJdText: string
): RoleDNAStructure {
  const mergedItems = new Map<string, SemanticRequirementItem>();

  const allLlmItems = [
    ...llmResult.mustHaves,
    ...llmResult.preferred,
    ...llmResult.eligibility,
    ...llmResult.responsibilities,
    ...llmResult.evidenceSignals,
    ...llmResult.constraints,
    ...llmResult.ambiguities,
  ];

  for (const item of allLlmItems) {
    const key = item.canonical_name.toLowerCase().trim();
    if (!key) continue;
    mergedItems.set(key, { ...item });
  }

  const allDetItems = [
    ...deterministicResult.mustHaves,
    ...deterministicResult.preferred,
    ...deterministicResult.eligibility,
    ...deterministicResult.responsibilities,
    ...deterministicResult.evidenceSignals,
    ...deterministicResult.constraints,
    ...deterministicResult.ambiguities,
  ];

  for (const detItem of allDetItems) {
    const key = detItem.canonical_name.toLowerCase().trim();
    if (!key) continue;

    const existing = mergedItems.get(key);
    if (!existing) {
      mergedItems.set(key, { ...detItem });
    } else {
      // Enrich existing item with deterministic evidence signals and verification strategy if missing
      const signals = Array.from(new Set([...(existing.evidence_signals || []), ...(detItem.evidence_signals || [])]));
      const verifications = Array.from(new Set([...(existing.verification_strategy || []), ...(detItem.verification_strategy || [])]));
      existing.evidence_signals = signals;
      existing.verification_strategy = verifications;
      if (!existing.source_text && detItem.source_text) {
        existing.source_text = detItem.source_text;
      }
      if (detItem.acceptable_options && (!existing.acceptable_options || existing.acceptable_options.length === 0)) {
        existing.acceptable_options = detItem.acceptable_options;
      }
      if (detItem.minimum_experience_years && !existing.minimum_experience_years) {
        existing.minimum_experience_years = detItem.minimum_experience_years;
      }
      if (!existing.requirement_type && detItem.requirement_type) {
        existing.requirement_type = detItem.requirement_type;
      }
      if (!existing.evidence_expectation && detItem.evidence_expectation) {
        existing.evidence_expectation = detItem.evidence_expectation;
      }
    }
  }

  const roleTitle = (llmResult.roleTitle && llmResult.roleTitle !== "Software Engineer")
    ? llmResult.roleTitle
    : deterministicResult.roleTitle;

  const department = (llmResult.department && llmResult.department !== "Engineering")
    ? llmResult.department
    : deterministicResult.department;

  const seniority = llmResult.seniority || deterministicResult.seniority || "Junior";
  const targetHires = llmResult.targetHires || deterministicResult.targetHires || 1;
  const workMode = llmResult.workMode || deterministicResult.workMode || "Remote";
  const location = llmResult.location || deterministicResult.location || "";
  const domainContext = Array.from(new Set([...(llmResult.domainContext || []), ...(deterministicResult.domainContext || [])]));

  return assembleRoleDnaStructure(
    roleTitle,
    department,
    seniority,
    targetHires,
    workMode,
    location,
    domainContext,
    Array.from(mergedItems.values())
  );
}

/**
 * Main Semantic JD Extraction Function
 */
export async function parseJobDescriptionSemantically(
  rawJd: string,
  fallbackTitle = "Software Engineer"
): Promise<RoleDNAStructure> {
  const text = (rawJd || "").trim();
  if (!text) {
    return buildEmptyRoleDna(fallbackTitle);
  }

  // Baseline deterministic extraction guarantees full completeness and reliability
  const deterministicResult = extractSemanticRoleDeterministically(text, fallbackTitle);

  // 1. Try LLM-Powered Semantic Analysis first
  try {
    const llmResult = await extractSemanticRoleWithLlm(text, fallbackTitle);
    if (llmResult) {
      // Merge LLM result with deterministic result to avoid any missing items
      const merged = mergeRoleDnaResults(llmResult, deterministicResult, text);
      return postValidateAndConsolidate(merged, text);
    }
  } catch (err) {
    console.warn("[SemanticJdParser] LLM parsing failed or timed out, executing deterministic semantic fallback:", err);
  }

  // 2. Deterministic Semantic Analyzer Fallback
  return postValidateAndConsolidate(deterministicResult, text);
}

/**
 * LLM-Powered Semantic Extraction via Groq Multi-Model Fallback Chain
 */
async function extractSemanticRoleWithLlm(text: string, fallbackTitle: string): Promise<RoleDNAStructure | null> {
  const prompt = `You are Cognalyze's Semantic Job-Description Analyst.
You are NOT a keyword extractor. Your job is to semantically understand what the employer explicitly requires, what the candidate will do, what is preferred, what establishes eligibility, what evidence is requested, and what is ambiguous.

CRITICAL INVARIANTS:
1. REQUIREMENT ≠ RESPONSIBILITY ≠ EVIDENCE ≠ CLAIM
   - What the candidate will DO in the job (e.g. "Build ML models", "Develop pipelines", "Collaborate with engineers") is a RESPONSIBILITY. Do NOT classify operational tasks as MUST_HAVE screening criteria!
   - What the candidate must already know before joining (e.g. "Strong Python skills", "2+ years experience") is a MUST_HAVE.
   - What would be desirable/plus (e.g. "PyTorch is a plus", "AWS preferred") is PREFERRED.
   - Who is eligible (e.g. "Pursuing Bachelor's degree", "Based in India") is ELIGIBILITY.
   - What proves capability (e.g. "Public GitHub repositories", "Deployed projects", "Open-source contributions") is EVIDENCE_SIGNAL.
   - Industry/domain context (e.g. "FinTech", "Generative AI") is DOMAIN_CONTEXT.
   - Work mode/location (e.g. "Remote", "Bengaluru") is CONSTRAINT.
2. ZERO HALLUCINATION / DO NOT OVER-INFER:
   - If the JD says "Experience with cloud platforms", do NOT invent AWS, Azure, or GCP. Classify as UNKNOWN with status "NEEDS_CONFIRMATION" and explain the platform is unspecified.
   - If the JD says "Experience with deep learning", do NOT infer PyTorch is required.
   - If the JD says "Experience with AI", do NOT infer LLMs/RAG.
3. CANONICAL NORMALIZATION:
   - Normalize equivalent concepts into single canonical names (e.g. "Strong programming skills in Python" -> "Python").
   - Deduplicate equivalent entries.
4. GROUNDING:
   - Every item MUST cite the exact verbatim sentence from the JD in "source_text".

JOB DESCRIPTION:
${text.slice(0, 7000)}

Return ONLY a valid JSON object matching this exact schema:
{
  "roleTitle": "${fallbackTitle}",
  "department": "Engineering",
  "seniority": "Junior" | "Mid-Level" | "Senior" | "Staff" | "Principal",
  "targetHires": 1,
  "workMode": "Remote" | "Hybrid" | "On-site",
  "location": "Location string or empty",
  "domainContext": ["Generative AI", "FinTech", etc],
  "items": [
    {
      "canonical_name": "Normalized canonical name (e.g. Python)",
      "category": "MUST_HAVE" | "PREFERRED" | "ELIGIBILITY" | "RESPONSIBILITY" | "EVIDENCE_SIGNAL" | "DOMAIN_CONTEXT" | "CONSTRAINT" | "UNKNOWN",
      "subtype": "technical_skill" | "soft_skill" | "domain_knowledge" | "experience_tenure" | "education_degree" | "work_authorization" | "evidence_source" | "operational_task" | "work_constraint",
      "mandatory": boolean,
      "confidence": number between 0.8 and 1.0,
      "source_text": "Exact verbatim sentence from JD",
      "source_section": "Section name (e.g. Must-Have Qualifications, Responsibilities, Preferred Qualifications)",
      "rationale": "Semantic explanation of why this was identified and classified this way",
      "evidence_signals": ["GitHub", "Projects", "Work Experience", etc],
      "verification_strategy": ["Verification rule 1", "Verification rule 2"],
      "ambiguity_status": "CLEAR" | "INFERRED" | "AMBIGUOUS",
      "ambiguity_reason": "Explanation if ambiguous",
      "related_capabilities": [
        { "name": "Machine Learning", "confidence": 0.85, "explanation": "Inferred from responsibility 'Build ML models'" }
      ]
    }
  ]
}`;

  const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (!res.ok) {
    throw new Error(`Groq API returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawJson = data.choices?.[0]?.message?.content || "{}";
  const cleaned = rawJson.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  const items: SemanticRequirementItem[] = Array.isArray(parsed.items) ? parsed.items : [];
  return assembleRoleDnaStructure(
    parsed.roleTitle || fallbackTitle,
    parsed.department || "Engineering",
    parsed.seniority || "Junior",
    parsed.targetHires || 1,
    parsed.workMode || "Remote",
    parsed.location || "",
    Array.isArray(parsed.domainContext) ? parsed.domainContext : [],
    items
  );
}

/**
 * Deterministic Semantic Analyzer Fallback
 * Implements section-aware and pattern-aware semantic classification
 */
export function extractSemanticRoleDeterministically(
  text: string,
  fallbackTitle = "Software Engineer"
): RoleDNAStructure {
  const lines = text.split(/\r?\n/);

  let roleTitle = fallbackTitle;
  let department = "Engineering";
  let seniority: RoleDNAStructure["seniority"] = "Junior";
  let targetHires = 1;
  let workMode: RoleDNAStructure["workMode"] = "Remote";
  let location = "";
  const domainContext: string[] = [];

  // Parse Header Metadata
  for (const rawLine of lines.slice(0, 25)) {
    const line = rawLine.trim();
    const lower = line.toLowerCase();

    if (/^(title|role|position|job title):/i.test(line)) {
      roleTitle = line.replace(/^(title|role|position|job title):/i, "").trim() || fallbackTitle;
    } else if (/^(department|team):/i.test(line)) {
      department = line.replace(/^(department|team):/i, "").trim() || department;
    } else if (/^(openings|hires|positions? count):/i.test(line)) {
      const num = parseInt(line.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > 0) targetHires = num;
    } else if (/^(location|office):/i.test(line)) {
      location = line.replace(/^(location|office):/i, "").trim();
    }

    if (lower.includes("remote") && !lower.includes("not remote")) workMode = "Remote";
    else if (lower.includes("hybrid")) workMode = "Hybrid";
    else if (lower.includes("on-site") || lower.includes("onsite") || lower.includes("in-office")) workMode = "On-site";

    if (lower.includes("junior") || lower.includes("fresher") || lower.includes("entry level") || lower.includes("intern")) {
      seniority = "Junior";
    } else if (lower.includes("mid-level") || lower.includes("sde 2") || lower.includes("experienced")) {
      seniority = "Mid-Level";
    } else if (lower.includes("staff") || lower.includes("lead")) {
      seniority = "Staff";
    } else if (lower.includes("principal")) {
      seniority = "Principal";
    } else if (lower.includes("senior")) {
      seniority = "Senior";
    }

    // Detect domain context
    if (lower.includes("generative ai") || lower.includes("gen ai")) domainContext.push("Generative AI");
    if (lower.includes("fintech") || lower.includes("financial")) domainContext.push("FinTech");
    if (lower.includes("healthcare") || lower.includes("medical")) domainContext.push("Healthcare");
    if (lower.includes("computer vision")) domainContext.push("Computer Vision");
  }

  const items: SemanticRequirementItem[] = [];
  let currentSection = "General";
  let sectionType: "RESPONSIBILITY" | "MUST_HAVE" | "PREFERRED" | "ELIGIBILITY" | "GENERAL" = "GENERAL";

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (!line) continue;
    const lower = line.toLowerCase();

    // Skip metadata lines that were already parsed in header
    if (/^(title|role|position|job title|department|team|openings|hires|location|office|work mode):/i.test(line)) {
      continue;
    }

    // Section Header Detection
    const isExplicitBullet = /^[-*•●]|\d+[\.)]\s/.test(line);
    const hasColonEnd = line.endsWith(":");
    const isKnownHeaderWord = /^(responsibilities|requirements|qualifications|eligibility|what you'?ll do|about the role|about us|preferred qualifications|must-have requirements|must-have qualifications|good-to-have requirements|good to have|nice to have|key responsibilities|core responsibilities|duties|who can apply|education|prerequisites|skills required|technical requirements|who you are|candidate profile|role overview):?$/i.test(line);
    const isHeader = !isExplicitBullet && (hasColonEnd || isKnownHeaderWord);

    if (isHeader) {
      currentSection = line.replace(/[:]+$/, "").trim();

      // Check PREFERRED before generic REQUIREMENTS because "Good-to-Have Requirements" contains "requirements"!
      if (
        lower.includes("preferred") ||
        lower.includes("nice to have") ||
        lower.includes("nice-to-have") ||
        lower.includes("good to have") ||
        lower.includes("good-to-have") ||
        lower.includes("bonus") ||
        lower.includes("plus") ||
        lower.includes("desired") ||
        lower.includes("desirable")
      ) {
        sectionType = "PREFERRED";
        continue;
      }
      if (
        lower.includes("eligibility") ||
        lower.includes("education") ||
        lower.includes("who can apply") ||
        lower.includes("prerequisites") ||
        lower.includes("academic")
      ) {
        sectionType = "ELIGIBILITY";
        continue;
      }
      if (
        lower.includes("responsibilit") ||
        lower.includes("what you will do") ||
        lower.includes("what you'll do") ||
        lower.includes("day to day") ||
        lower.includes("day-to-day") ||
        lower.includes("duties") ||
        lower.includes("tasks") ||
        lower.includes("what you'll work on") ||
        lower.includes("role overview")
      ) {
        sectionType = "RESPONSIBILITY";
        continue;
      }
      if (
        lower.includes("must-have") ||
        lower.includes("must have") ||
        lower.includes("required qualification") ||
        lower.includes("requirements") ||
        lower.includes("basic qualification") ||
        lower.includes("minimum qualification") ||
        lower.includes("what you bring") ||
        lower.includes("skills") ||
        lower.includes("qualifications") ||
        lower.includes("candidate profile")
      ) {
        sectionType = "MUST_HAVE";
        continue;
      }
      sectionType = "GENERAL";
      continue;
    }

    const cleanSnippet = line.replace(/^[-*•●]\s*|\d+[\.)]\s*/, "").trim();
    if (cleanSnippet.length < 3) continue;

    // In GENERAL section, skip conversational chatter unless it has a bullet or a recognized skill
    if (sectionType === "GENERAL" && !isExplicitBullet && findSkillsInText(cleanSnippet).length === 0) {
      continue;
    }

    // Verify quote in source
    const verification = verifyQuoteInSource(text, cleanSnippet);
    const verbatim = verification.verified ? verification.verbatimQuote : cleanSnippet;

    // Check Evidence Signals
    let isEvidenceSignal = false;
    for (const sig of EVIDENCE_SIGNAL_PATTERNS) {
      if (sig.regex.test(cleanSnippet)) {
        isEvidenceSignal = true;
        items.push({
          id: `item-${items.length + 1}`,
          canonical_name: sig.name,
          category: "EVIDENCE_SIGNAL",
          subtype: "evidence_source",
          mandatory: false,
          confidence: 0.95,
          source_text: verbatim,
          source_section: currentSection,
          rationale: `The JD specifies "${cleanSnippet}" as an evidence signal demonstrating candidate capability.`,
          evidence_signals: ["Public URL", "Repository Verification"],
          verification_strategy: [
            "Inspect authentic commit history and project implementation",
            "Do not treat empty or forked profiles as evidence"
          ],
          ambiguity_status: "CLEAR",
          requirement_type: "tool",
          importance: "preferred",
          evidence_expectation: "portfolio",
          needs_review: false
        });
        break;
      }
    }
    if (isEvidenceSignal) continue;

    // Check Ambiguity / Needs Confirmation
    let isAmbiguous = false;
    for (const amb of AMBIGUOUS_TARGETS) {
      if (amb.regex.test(cleanSnippet)) {
        isAmbiguous = true;
        const reqType = inferRequirementType(amb.canonical, "technical_skill");
        items.push({
          id: `item-${items.length + 1}`,
          canonical_name: amb.canonical,
          category: "UNKNOWN",
          subtype: "technical_skill",
          mandatory: false,
          confidence: 0.85,
          source_text: verbatim,
          source_section: currentSection,
          rationale: amb.reason,
          evidence_signals: ["Technical Project", "Code Deployment"],
          verification_strategy: [
            "Clarify specific technology engine or platform during hiring calibration",
            "Do not penalize candidates for using alternative standard platforms"
          ],
          ambiguity_status: "AMBIGUOUS",
          ambiguity_reason: amb.reason,
          requirement_type: reqType,
          importance: "conditional",
          evidence_expectation: "implementation",
          needs_review: true
        });
        break;
      }
    }
    if (isAmbiguous) continue;

    // Check Eligibility (Degree, graduation, work authorization)
    const isDegreeOrGrad = /\b(bachelor['’]?s?|master['’]?s?|phd|b\.?tech|b\.?e\.?|degree in|pursuing|graduating|authorized to work|internship)\b/i.test(cleanSnippet);
    if (isDegreeOrGrad || sectionType === "ELIGIBILITY") {
      let degreeName = "Relevant Degree";
      if (/bachelor/i.test(cleanSnippet)) degreeName = "Bachelor's Degree";
      else if (/master/i.test(cleanSnippet)) degreeName = "Master's Degree";
      else if (/work authoriz|visa/i.test(cleanSnippet)) degreeName = "Work Authorization";

      const subtype = /work authoriz|visa/i.test(cleanSnippet) ? "work_authorization" : "education_degree";
      const reqType = subtype === "work_authorization" ? "work_authorization" : "education";

      items.push({
        id: `item-${items.length + 1}`,
        canonical_name: degreeName,
        category: "ELIGIBILITY",
        subtype,
        mandatory: true,
        confidence: 0.96,
        source_text: verbatim,
        source_section: currentSection,
        rationale: `Eligibility constraint extracted from "${currentSection}": ${cleanSnippet}`,
        evidence_signals: ["Transcript", "Degree Certificate", "Enrollment Record"],
        verification_strategy: ["Verify educational status or work eligibility"],
        ambiguity_status: "CLEAR",
        requirement_type: reqType,
        importance: "conditional",
        evidence_expectation: "certification",
        needs_review: false
      });
      continue;
    }

    // Check Responsibilities
    if (sectionType === "RESPONSIBILITY" || /^(build|develop|create|design|architect|evaluate|debug|optimize|collaborate|write|maintain|implement)\b/i.test(cleanSnippet)) {
      // It is a responsibility!
      const relatedCaps: { name: string; confidence: number; explanation: string }[] = [];
      if (/machine learning|ml/i.test(cleanSnippet)) {
        relatedCaps.push({ name: "Machine Learning", confidence: 0.85, explanation: `Inferred from task: "${cleanSnippet}"` });
      }
      if (/python/i.test(cleanSnippet)) {
        relatedCaps.push({ name: "Python", confidence: 0.85, explanation: `Mentioned in responsibility context: "${cleanSnippet}"` });
      }

      // Simplify canonical name for task
      let taskName = cleanSnippet;
      if (taskName.length > 55) {
        taskName = taskName.slice(0, 52) + "…";
      }
      taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);

      items.push({
        id: `item-${items.length + 1}`,
        canonical_name: taskName,
        category: "RESPONSIBILITY",
        subtype: "operational_task",
        mandatory: false,
        confidence: 0.94,
        source_text: verbatim,
        source_section: currentSection,
        rationale: `This is an on-the-job responsibility ("${cleanSnippet}") and not an elimination qualification.`,
        evidence_signals: ["Projects", "Past Deliverables"],
        verification_strategy: [
          "On-the-job responsibility: informs role alignment but does NOT disqualify candidate",
          "Look for related project experience"
        ],
        ambiguity_status: "CLEAR",
        related_capabilities: relatedCaps,
        requirement_type: "operational_task",
        importance: "conditional",
        evidence_expectation: "portfolio",
        needs_review: false
      });
      continue;
    }

    // Check Must-Haves vs Preferred
    const isExplicitPreferred = sectionType === "PREFERRED" || /\b(preferred|plus|bonus|nice to have|good to have|desired)\b/i.test(cleanSnippet);
    const category: SemanticRequirementCategory = isExplicitPreferred ? "PREFERRED" : "MUST_HAVE";

    // Check if the snippet contains one or more canonical skills
    const detectedSkills = findSkillsInText(cleanSnippet);

    if (detectedSkills.length > 0) {
      for (const skill of detectedSkills) {
        // Prevent duplicate items within the same category
        if (items.some(i => i.canonical_name.toLowerCase() === skill.toLowerCase() && i.category === category)) {
          continue;
        }

        const acceptableOptions = extractAcceptableOptions(cleanSnippet, skill);
        const minExp = extractMinExperience(cleanSnippet);
        const reqType = inferRequirementType(skill, "technical_skill");
        const importance: ImportanceLevel = category === "MUST_HAVE" ? "mandatory" : "preferred";
        const evidenceExpectation = inferEvidenceExpectation(reqType, category);

        items.push({
          id: `item-${items.length + 1}`,
          canonical_name: skill,
          category,
          subtype: "technical_skill",
          mandatory: category === "MUST_HAVE",
          confidence: 0.95,
          source_text: verbatim,
          source_section: currentSection,
          rationale: `${skill} is ${category === "MUST_HAVE" ? "explicitly required" : "listed as preferred"} under ${currentSection}: "${cleanSnippet}"`,
          evidence_signals: getExpectedEvidenceSignals(skill, category),
          verification_strategy: getVerificationStrategy(skill, category),
          ambiguity_status: "CLEAR",
          requirement_type: reqType,
          importance,
          evidence_expectation: evidenceExpectation,
          acceptable_options: acceptableOptions,
          minimum_experience_years: minExp,
          needs_review: false
        });
      }
      continue;
    }

    const canonical = normalizeCanonicalName(cleanSnippet);
    const acceptableOptions = extractAcceptableOptions(cleanSnippet, canonical);
    const minExp = extractMinExperience(cleanSnippet);
    const reqType = inferRequirementType(canonical, "technical_skill");
    const importance: ImportanceLevel = category === "MUST_HAVE" ? "mandatory" : "preferred";
    const evidenceExpectation = inferEvidenceExpectation(reqType, category);

    items.push({
      id: `item-${items.length + 1}`,
      canonical_name: canonical,
      category,
      subtype: "technical_skill",
      mandatory: category === "MUST_HAVE",
      confidence: 0.92,
      source_text: verbatim,
      source_section: currentSection,
      rationale: `${canonical} is ${category === "MUST_HAVE" ? "explicitly required" : "listed as preferred"} under ${currentSection}: "${cleanSnippet}"`,
      evidence_signals: getExpectedEvidenceSignals(canonical, category),
      verification_strategy: getVerificationStrategy(canonical, category),
      ambiguity_status: "CLEAR",
      requirement_type: reqType,
      importance,
      evidence_expectation: evidenceExpectation,
      acceptable_options: acceptableOptions,
      minimum_experience_years: minExp,
      needs_review: false
    });
  }

  return assembleRoleDnaStructure(
    roleTitle,
    department,
    seniority,
    targetHires,
    workMode,
    location,
    Array.from(new Set(domainContext)),
    items
  );
}

/**
 * Post-LLM Anti-Hallucination & Validation Guard
 */
export function postValidateAndConsolidate(
  dna: RoleDNAStructure,
  sourceJdText: string
): RoleDNAStructure {
  const lowerJd = sourceJdText.toLowerCase();

  // Helper to test if text or term exists in JD
  const verifyGrounded = (term: string) => {
    return lowerJd.includes(term.toLowerCase().trim());
  };

  const processItems = (itemList: SemanticRequirementItem[]): SemanticRequirementItem[] => {
    const validated: SemanticRequirementItem[] = [];
    const seenCanonicals = new Map<string, SemanticRequirementItem>();

    for (const item of itemList) {
      let current = { ...item };

      // 1. Check Quote Authenticity with fuzzy substantive word verification
      if (current.source_text && !verifyQuoteInSource(sourceJdText, current.source_text).verified) {
        if (!verifyGrounded(current.canonical_name)) {
          const words = current.canonical_name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          const matchedWords = words.filter(w => lowerJd.includes(w));
          if (words.length > 0 && (matchedWords.length / words.length) < 0.5) {
            console.warn(`[SemanticGuard] Dropped fabricated ungrounded requirement: "${current.canonical_name}"`);
            continue;
          }
        }
      }

      // 2. Anti-Hallucination Guard: Generic Cloud / Database / AI
      const lowerSource = (current.source_text || "").toLowerCase();
      const lowerCanonical = current.canonical_name.toLowerCase();

      // Case: Model invented AWS/Azure/GCP when JD only said cloud
      if (
        (lowerCanonical.includes("aws") || lowerCanonical.includes("azure") || lowerCanonical.includes("gcp") || lowerCanonical.includes("google cloud")) &&
        !lowerSource.includes("aws") && !lowerSource.includes("amazon") && !lowerSource.includes("azure") && !lowerSource.includes("gcp") && !lowerSource.includes("google cloud")
      ) {
        console.warn(`[SemanticGuard] Corrected hallucinated cloud vendor '${current.canonical_name}' -> 'Cloud Deployment'`);
        current.canonical_name = "Cloud Deployment";
        current.category = "UNKNOWN";
        current.ambiguity_status = "AMBIGUOUS";
        current.ambiguity_reason = "The JD mentions cloud experience but does not specify a platform (e.g. AWS, Azure, GCP).";
        current.mandatory = false;
      }

      // Case: Model invented PyTorch/TensorFlow when JD only said deep learning
      if (
        (lowerCanonical.includes("pytorch") || lowerCanonical.includes("tensorflow")) &&
        !lowerSource.includes("pytorch") && !lowerSource.includes("tensorflow")
      ) {
        current.canonical_name = "Deep Learning";
      }

      // 3. Responsibility Misclassification Downgrade
      // If an item is classified as MUST_HAVE but its source text comes from a responsibilities section
      // or describes a daily action verb ("Build...", "Develop...", "Collaborate...") without qualification language:
      const sectionLower = (current.source_section || "").toLowerCase();
      const isTaskVerb = /^(build|develop|create|design|architect|evaluate|debug|optimize|collaborate|write|maintain|test)\b/i.test(current.source_text);
      const isRespSection = sectionLower.includes("responsibilit") || sectionLower.includes("what you will do");

      if (current.category === "MUST_HAVE" && (isRespSection || (isTaskVerb && !lowerSource.includes("must") && !lowerSource.includes("required")))) {
        console.info(`[SemanticGuard] Downgrading task '${current.canonical_name}' from MUST_HAVE to RESPONSIBILITY`);
        current.category = "RESPONSIBILITY";
        current.subtype = "operational_task";
        current.mandatory = false;
        current.verification_strategy = [
          "On-the-job task: informs candidate alignment but is NOT an automatic elimination criterion",
          "Look for related capability implementations in candidate projects"
        ];
      }

      // 4. Soft Skill Separation
      if (
        lowerCanonical.includes("communication") ||
        lowerCanonical.includes("team player") ||
        lowerCanonical.includes("hard worker") ||
        lowerCanonical.includes("fast-paced")
      ) {
        current.subtype = "soft_skill";
        current.mandatory = false;
        if (current.category === "MUST_HAVE") {
          current.category = "PREFERRED";
        }
      }

      // 5. Canonical Deduplication
      const existing = seenCanonicals.get(current.canonical_name.toLowerCase());
      if (existing) {
        // Merge into the highest priority category (MUST_HAVE > PREFERRED > RESPONSIBILITY)
        if (current.category === "MUST_HAVE" && existing.category !== "MUST_HAVE") {
          existing.category = "MUST_HAVE";
          existing.mandatory = true;
          existing.source_text = current.source_text;
          existing.rationale = current.rationale;
          existing.importance = "mandatory";
        }
        if (current.acceptable_options && (!existing.acceptable_options || existing.acceptable_options.length === 0)) {
          existing.acceptable_options = current.acceptable_options;
        }
        if (current.minimum_experience_years && !existing.minimum_experience_years) {
          existing.minimum_experience_years = current.minimum_experience_years;
        }
        continue;
      }

      seenCanonicals.set(current.canonical_name.toLowerCase(), current);
      validated.push(current);
    }

    return validated;
  };

  const allItems = processItems([
    ...dna.mustHaves,
    ...dna.preferred,
    ...dna.eligibility,
    ...dna.responsibilities,
    ...dna.evidenceSignals,
    ...dna.constraints,
    ...dna.ambiguities
  ]);

  return assembleRoleDnaStructure(
    dna.roleTitle,
    dna.department,
    dna.seniority,
    dna.targetHires,
    dna.workMode,
    dna.location,
    dna.domainContext,
    allItems
  );
}

/**
 * Groups raw items into the formal 8-category RoleDNAStructure
 */
export function assembleRoleDnaStructure(
  roleTitle: string,
  department: string,
  seniority: RoleDNAStructure["seniority"],
  targetHires: number,
  workMode: RoleDNAStructure["workMode"],
  location: string | undefined,
  domainContext: string[],
  items: SemanticRequirementItem[]
): RoleDNAStructure {
  const enrichedItems = items.map((item, idx) => {
    const reqType = item.requirement_type || inferRequirementType(item.canonical_name, item.subtype);
    const importance: ImportanceLevel = item.importance || (item.category === "MUST_HAVE" ? "mandatory" : item.category === "PREFERRED" ? "preferred" : "conditional");
    const evidenceExpectation = item.evidence_expectation || inferEvidenceExpectation(reqType, item.category);

    return {
      ...item,
      id: item.id || `item-${idx + 1}`,
      requirement_type: reqType,
      importance,
      evidence_expectation: evidenceExpectation,
      needs_review: item.needs_review !== undefined ? item.needs_review : (item.ambiguity_status === "AMBIGUOUS" || item.category === "UNKNOWN")
    };
  });

  const mustHaves = enrichedItems.filter(i => i.category === "MUST_HAVE");
  const preferred = enrichedItems.filter(i => i.category === "PREFERRED");
  const eligibility = enrichedItems.filter(i => i.category === "ELIGIBILITY");
  const responsibilities = enrichedItems.filter(i => i.category === "RESPONSIBILITY");
  const evidenceSignals = enrichedItems.filter(i => i.category === "EVIDENCE_SIGNAL");
  const constraints = enrichedItems.filter(i => i.category === "CONSTRAINT");
  const ambiguities = enrichedItems.filter(i => i.category === "UNKNOWN" || i.ambiguity_status === "AMBIGUOUS");

  return {
    roleTitle,
    department: department || "Engineering",
    seniority: seniority || "Junior",
    targetHires: targetHires || 1,
    workMode: workMode || "Remote",
    location: location || undefined,
    domainContext: domainContext || [],
    mustHaves,
    preferred,
    eligibility,
    responsibilities,
    evidenceSignals,
    constraints,
    ambiguities,
    summary: {
      mustHaveCount: mustHaves.length,
      preferredCount: preferred.length,
      eligibilityCount: eligibility.length,
      responsibilityCount: responsibilities.length,
      evidenceSignalCount: evidenceSignals.length,
      constraintCount: constraints.length,
      ambiguityCount: ambiguities.length
    }
  };
}

function buildEmptyRoleDna(fallbackTitle: string): RoleDNAStructure {
  return {
    roleTitle: fallbackTitle,
    department: "Engineering",
    seniority: "Junior",
    targetHires: 1,
    workMode: "Remote",
    domainContext: [],
    mustHaves: [],
    preferred: [],
    eligibility: [],
    responsibilities: [],
    evidenceSignals: [],
    constraints: [],
    ambiguities: [],
    summary: {
      mustHaveCount: 0,
      preferredCount: 0,
      eligibilityCount: 0,
      responsibilityCount: 0,
      evidenceSignalCount: 0,
      constraintCount: 0,
      ambiguityCount: 0
    }
  };
}
