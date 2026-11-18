/**
 * COGNALYZE INTERVIEW SYSTEM — JOB DESCRIPTION INTELLIGENCE SERVICE
 * 
 * Extracts structured competency landscapes, role archetypes, seniority expectations,
 * mandatory vs preferred requirements, and performs authoritative resume-to-JD mapping.
 */

import { ResumeContextSnapshot } from "./resume-context-service";

export type RoleArchetype =
  | "BACKEND"
  | "FRONTEND"
  | "FULLSTACK"
  | "SYSTEMS"
  | "AI_ML"
  | "DEVOPS";

export type SeniorityLevel = "INTERN" | "JUNIOR" | "MID" | "SENIOR" | "STAFF";

export interface JDCompetency {
  id: string;
  name: string;
  category: "languages" | "core_cs" | "architecture" | "frameworks" | "databases" | "cloud_devops" | "testing" | "behavioral";
  importance: "MANDATORY" | "PREFERRED" | "NICE_TO_HAVE";
  targetDepth: "foundational" | "intermediate" | "advanced" | "expert";
  evaluationCriteria: string[];
}

export interface StructuredJDIntelligence {
  jobTitle: string;
  archetype: RoleArchetype;
  seniority: SeniorityLevel;
  mandatoryCompetencies: JDCompetency[];
  preferredCompetencies: JDCompetency[];
  domainContext: string;
  rawText: string;
  mappedResumeGaps: {
    coveredByResume: string[];
    gapCompetenciesToProbe: string[];
  };
}

/**
 * Standard known technical competencies taxonomy.
 */
const CANONICAL_COMPETENCIES: Array<{
  name: string;
  category: JDCompetency["category"];
  aliases: string[];
  archetypeWeight: Partial<Record<RoleArchetype, number>>;
}> = [
  { name: "Data Structures & Algorithms", category: "core_cs", aliases: ["dsa", "algorithms", "data structures", "time complexity", "big-o"], archetypeWeight: { BACKEND: 1, FULLSTACK: 1, SYSTEMS: 1, FRONTEND: 0.8, AI_ML: 0.8 } },
  { name: "System Design & Architecture", category: "architecture", aliases: ["system design", "distributed systems", "scalability", "microservices", "high availability"], archetypeWeight: { BACKEND: 1, FULLSTACK: 0.9, SYSTEMS: 1, DEVOPS: 0.9 } },
  { name: "Database Design & Query Optimization", category: "databases", aliases: ["sql", "postgresql", "mysql", "mongodb", "database indexing", "query optimization", "transactions"], archetypeWeight: { BACKEND: 1, FULLSTACK: 0.9 } },
  { name: "REST & Distributed API Design", category: "architecture", aliases: ["api design", "rest", "graphql", "grpc", "http", "endpoints"], archetypeWeight: { BACKEND: 1, FULLSTACK: 1 } },
  { name: "Concurrency & Multithreading", category: "core_cs", aliases: ["concurrency", "async", "event loop", "goroutines", "threads", "race conditions", "locks"], archetypeWeight: { SYSTEMS: 1, BACKEND: 0.9 } },
  { name: "React & Next.js Architecture", category: "frameworks", aliases: ["react", "next.js", "nextjs", "client components", "server components", "hooks", "ssr"], archetypeWeight: { FRONTEND: 1, FULLSTACK: 0.9 } },
  { name: "Frontend State Management & DOM Performance", category: "frameworks", aliases: ["state management", "redux", "zustand", "virtual dom", "bundle size", "core web vitals"], archetypeWeight: { FRONTEND: 1, FULLSTACK: 0.8 } },
  { name: "Containerization & Cloud Infrastructure", category: "cloud_devops", aliases: ["docker", "kubernetes", "k8s", "aws", "gcp", "ci/cd", "terraform"], archetypeWeight: { DEVOPS: 1, BACKEND: 0.8, FULLSTACK: 0.7 } },
  { name: "Deep Learning & Transformer Architecture", category: "frameworks", aliases: ["pytorch", "tensorflow", "transformers", "llm", "rag", "embeddings", "vector database"], archetypeWeight: { AI_ML: 1 } },
  { name: "Automated Testing & Edge Cases", category: "testing", aliases: ["unit testing", "integration testing", "jest", "pytest", "end to end", "tdd", "edge cases"], archetypeWeight: { BACKEND: 0.8, FRONTEND: 0.8, FULLSTACK: 0.8 } },
  { name: "Operating Systems & Networking", category: "core_cs", aliases: ["os", "linux", "memory management", "tcp/ip", "sockets", "dns", "http/2"], archetypeWeight: { SYSTEMS: 1, BACKEND: 0.8 } },
  { name: "Production Incident Debugging & Observability", category: "cloud_devops", aliases: ["debugging", "profiling", "logging", "monitoring", "tracing", "opentelemetry", "metrics"], archetypeWeight: { BACKEND: 0.9, DEVOPS: 1, FULLSTACK: 0.8 } },
];

/**
 * Determines role archetype from text cues.
 */
function determineArchetype(text: string): RoleArchetype {
  const firstLine = (text.split("\n")[0] || "").toLowerCase();
  if (/\b(backend|back-end)\b/.test(firstLine)) return "BACKEND";
  if (/\b(frontend|front-end)\b/.test(firstLine)) return "FRONTEND";
  if (/\b(full[- ]stack|fullstack)\b/.test(firstLine)) return "FULLSTACK";
  if (/\b(machine learning|ai|ml|data scientist)\b/.test(firstLine)) return "AI_ML";
  if (/\b(devops|sre)\b/.test(firstLine)) return "DEVOPS";
  if (/\b(systems engineer|kernel|embedded)\b/.test(firstLine)) return "SYSTEMS";

  const lower = text.toLowerCase();
  if (/\b(machine learning|ai|ml|data scientist|nlp|computer vision|llm)\b/.test(lower)) return "AI_ML";
  if (/\b(backend|back-end)\b/.test(lower)) return "BACKEND";
  if (/\b(devops|sre|platform engineer|cloud engineer)\b/.test(lower)) return "DEVOPS";
  if (/\b(systems engineer|kernel|embedded|firmware|low[- ]level)\b/.test(lower)) return "SYSTEMS";
  if (/\b(frontend|front-end|ui engineer|client|react developer)\b/.test(lower) && !/\bbackend\b/.test(lower)) return "FRONTEND";
  if (/\b(full[- ]stack|fullstack)\b/.test(lower)) return "FULLSTACK";
  return "BACKEND";
}

/**
 * Determines seniority level from text.
 */
function determineSeniority(text: string): SeniorityLevel {
  const lower = text.toLowerCase();
  if (/\b(intern|internship|campus|trainee|fresher)\b/.test(lower)) return "INTERN";
  if (/\b(junior|associate|entry[- ]level|grad)\b/.test(lower)) return "JUNIOR";
  if (/\b(senior|sr\.?|lead)\b/.test(lower)) return "SENIOR";
  if (/\b(staff|principal|architect|director)\b/.test(lower)) return "STAFF";
  return "MID";
}

/**
 * Analyzes and extracts structured intelligence from a raw Job Description text.
 */
export function analyzeJobDescription(
  rawJdText: string,
  resumeSnapshot?: ResumeContextSnapshot
): StructuredJDIntelligence {
  const text = (rawJdText || "").trim();
  const archetype = determineArchetype(text);
  const seniority = determineSeniority(text);

  // Extract Title (Line 1 or standard format)
  const firstLine = text.split("\n")[0] || "Software Engineer";
  const jobTitle = firstLine.replace(/^(job description|role|position):?\s*/i, "").slice(0, 70);

  const mandatory: JDCompetency[] = [];
  const preferred: JDCompetency[] = [];

  const mustSectionMatch = text.match(/(?:requirements|must have|qualifications|mandatory|what you will need|what you need)[:\n]([\s\S]*?)(?:nice to have|preferred|bonus|responsibilities|$)/i);
  const preferredSectionMatch = text.match(/(?:nice to have|preferred|bonus|good to have|desired)[:\n]([\s\S]*?)(?:responsibilities|requirements|$)/i);

  const mustText = mustSectionMatch ? mustSectionMatch[1] : text;
  const prefText = preferredSectionMatch ? preferredSectionMatch[1] : "";

  for (const comp of CANONICAL_COMPETENCIES) {
    const isMust = comp.aliases.some((alias) => new RegExp(`\\b${alias.replace(/[+]/g, "\\+")}\\b`, "i").test(mustText));
    const isPref = comp.aliases.some((alias) => new RegExp(`\\b${alias.replace(/[+]/g, "\\+")}\\b`, "i").test(prefText));
    const archetypeWeight = comp.archetypeWeight[archetype] || 0.5;

    if (isMust || (!isPref && archetypeWeight >= 0.8)) {
      mandatory.push({
        id: `comp_${comp.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: comp.name,
        category: comp.category,
        importance: "MANDATORY",
        targetDepth: seniority === "STAFF" || seniority === "SENIOR" ? "advanced" : "intermediate",
        evaluationCriteria: [
          `Candidate demonstrates deep mechanics of ${comp.name}`,
          `Candidate explains edge cases, performance trade-offs, and failure recovery`,
        ],
      });
    } else if (isPref || archetypeWeight >= 0.6) {
      preferred.push({
        id: `comp_${comp.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: comp.name,
        category: comp.category,
        importance: "PREFERRED",
        targetDepth: "intermediate",
        evaluationCriteria: [
          `Candidate exhibits practical understanding of ${comp.name}`,
        ],
      });
    }
  }

  // Fallback if none matched
  if (mandatory.length === 0) {
    mandatory.push({
      id: "comp_dsa",
      name: "Data Structures & Algorithms",
      category: "core_cs",
      importance: "MANDATORY",
      targetDepth: "intermediate",
      evaluationCriteria: ["Data structure selection, algorithmic complexity, optimization"],
    });
    mandatory.push({
      id: "comp_sys_design",
      name: "System Design & Architecture",
      category: "architecture",
      importance: "MANDATORY",
      targetDepth: "intermediate",
      evaluationCriteria: ["Scalability, API contracts, database trade-offs"],
    });
  }

  // Resume gap mapping
  const coveredByResume: string[] = [];
  const gapCompetenciesToProbe: string[] = [];

  const resumeText = resumeSnapshot?.rawText?.toLowerCase() || "";

  for (const comp of [...mandatory, ...preferred]) {
    const isFoundInResume = CANONICAL_COMPETENCIES
      .find((c) => c.name === comp.name)
      ?.aliases.some((al) => resumeText.includes(al.toLowerCase()));

    if (isFoundInResume) {
      coveredByResume.push(comp.name);
    } else {
      gapCompetenciesToProbe.push(comp.name);
    }
  }

  return {
    jobTitle,
    archetype,
    seniority,
    mandatoryCompetencies: mandatory,
    preferredCompetencies: preferred,
    domainContext: `${archetype} focus at ${seniority} seniority level`,
    rawText: text,
    mappedResumeGaps: {
      coveredByResume,
      gapCompetenciesToProbe,
    },
  };
}
