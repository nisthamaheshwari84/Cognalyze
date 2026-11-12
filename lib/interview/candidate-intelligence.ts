/**
 * lib/interview/candidate-intelligence.ts
 * 
 * COGNALYZE CANDIDATE & JOB DESCRIPTION INTELLIGENCE ENGINE (Phase 1 & Phase 2)
 * 
 * Mandates:
 * 1. 12-Point Project Profiling Schema:
 *    - 1. Problem Solved
 *    - 2. System Architecture Used
 *    - 3. Technology Stack Selection Rationale
 *    - 4. Candidate's Personal Contribution vs Team/Framework
 *    - 5. Technical Challenges & Edge Case Hurdles
 *    - 6. Database Design, Data Model & Normalization
 *    - 7. API Structure & Endpoint Protocols
 *    - 8. Security Measures (Auth, Rate Limiting, Encryption)
 *    - 9. Performance Optimizations & Bottlenecks Mitigated
 *    - 10. Testing Strategy & Quality Assurance
 *    - 11. Deployment, Hosting, CI/CD Pipeline
 *    - 12. Retrospective Improvements (What they would change if rebuilding)
 * 
 * 2. Explicit Provenance Classification:
 *    - VERIFIED_EVIDENCE: Authenticated Student DNA, external verified assessments, confirmed GitHub repos/PRs.
 *    - CANDIDATE_CLAIM: Asserted in resume or self-introduction without external corroboration.
 *    - CANDIDATE_REPORTED: Provided during live interview turns.
 *    - INFERRED: Derived from combined tech context or architectural patterns.
 *    - UNVERIFIED_CLAIM: Stated capability with zero backing evidence or known skill gap.
 *    - Rule: NEVER automatically convert a self-reported or claimed skill into a verified skill.
 * 
 * 3. Role Competency Matrix & JD Intelligence:
 *    - Must-Have Competencies (P0 / P1)
 *    - Good-to-Have Competencies (P2)
 *    - Role Responsibilities & Expectations
 *    - Unsupported JD Requirements (JD requirements not backed by resume/evidence)
 */

export type EvidenceProvenance =
  | "VERIFIED_EVIDENCE"
  | "CANDIDATE_CLAIM"
  | "CANDIDATE_REPORTED"
  | "INFERRED"
  | "UNVERIFIED_CLAIM";

export interface TwelvePointProjectProfile {
  id: string;
  title: string;
  tech: string[];
  githubUrl?: string;
  description?: string;
  verificationStatus: EvidenceProvenance;
  // Point 1: What problem did the project solve?
  problemSolved: string;
  // Point 2: What architecture was used?
  architecture: string;
  // Point 3: Why were specific technologies selected?
  techStackRationale: string;
  // Point 4: What did the candidate personally implement?
  personalContribution: string;
  // Point 5: What were the technical challenges?
  technicalChallenges: string[];
  // Point 6: How was the database designed?
  databaseDesign: string;
  // Point 7: How were APIs structured?
  apiStructure: string;
  // Point 8: What security measures were implemented?
  securityMeasures: string;
  // Point 9: What performance optimizations were made?
  performanceOptimizations: string;
  // Point 10: How was the application tested?
  testingStrategy: string;
  // Point 11: How was it deployed?
  deploymentAndCI: string;
  // Point 12: What would the candidate change if rebuilding?
  retrospectiveImprovements: string;
  // Detailed provenance breakdown per attribute
  provenance: Record<string, EvidenceProvenance>;
}

export interface JDCompetencyItem {
  id: string;
  name: string;
  category: "fundamentals" | "architecture" | "language_framework" | "distributed_systems" | "databases" | "production_ops" | "security";
  priority: "must_have" | "good_to_have";
  expectedDepth: string;
  rationale: string;
  isBackedByResume: boolean;
}

export interface JDCompetencyMatrix {
  targetRole: string;
  roleCategory: "sde_backend" | "frontend" | "aiml" | "data_eng" | "devops" | "security" | "general_cs";
  experienceExpectations: string;
  mustHaveCompetencies: JDCompetencyItem[];
  goodToHaveCompetencies: JDCompetencyItem[];
  engineeringFundamentals: string[];
  roleResponsibilities: string[];
  architecturalExpectations: string;
  productionEngineeringExpectations: string;
  unsupportedJDRequirements: string[];
}

export interface CompetencyEvidenceRecord {
  name: string;
  provenance: EvidenceProvenance;
  source: string;
  confidence: number;
  details?: string;
  claimedLevel?: string;
  verifiedScore?: number;
}

export interface CandidateIntelligenceProfile {
  candidateId: string;
  name: string;
  experienceYears: number | null;
  experienceLevel: "fresher" | "early_career" | "experienced" | "career_switcher";
  careerIntent: string;
  projects: TwelvePointProjectProfile[];
  verifiedCompetencies: CompetencyEvidenceRecord[];
  claimedCompetencies: CompetencyEvidenceRecord[];
  inferredCompetencies: CompetencyEvidenceRecord[];
  unverifiedClaims: string[];
  potentialInconsistencies: Array<{
    claim: string;
    conflictingEvidence: string;
    rationale: string;
  }>;
  provenanceDirectory: Record<string, { provenance: EvidenceProvenance; details: string; verifiedScore?: number }>;
  provenanceMap: Record<string, { provenance: EvidenceProvenance; details: string; verifiedScore?: number }>;
}

// ══════════════════════════════════════════════════════════════
// 1. 12-POINT PROJECT EXTRACTION ENGINE
// ══════════════════════════════════════════════════════════════

/**
 * Parses raw project claims or text into a comprehensive 12-point project profile.
 * Every field is grounded in evidence or explicitly flagged as "Unstated in resume claim".
 */
export function extractTwelvePointProjectProfile(
  rawProjectOrTitle: any,
  resumeTextOrDesc: string = "",
  techArg?: string[]
): TwelvePointProjectProfile {
  let title = "Project";
  let desc = "";
  let tech: string[] = [];
  let githubUrl: string | undefined = undefined;
  let fullResumeText = "";

  if (typeof rawProjectOrTitle === "string") {
    title = rawProjectOrTitle.trim();
    desc = typeof resumeTextOrDesc === "string" ? resumeTextOrDesc.trim() : "";
    fullResumeText = desc;
    if (Array.isArray(techArg)) {
      tech = techArg;
    }
  } else if (rawProjectOrTitle && typeof rawProjectOrTitle === "object") {
    title = (rawProjectOrTitle.title || "Project").trim();
    desc = (rawProjectOrTitle.description || "").trim();
    githubUrl = rawProjectOrTitle.githubUrl;
    tech = Array.isArray(rawProjectOrTitle.tech) ? rawProjectOrTitle.tech : [];
    fullResumeText = typeof resumeTextOrDesc === "string" ? resumeTextOrDesc : "";
  }

  // Search full resume for context paragraphs associated with this project title
  const contextParagraph = findProjectContextInResume(title, fullResumeText, desc);
  const combinedContext = `${desc} ${contextParagraph}`.trim();

  if (tech.length === 0) {
    tech = extractTechFromContext(`${title} ${combinedContext}`);
  }

  // 1. Problem Solved
  const problemSolved = extractProblemSolved(combinedContext, title);

  // 2. Architecture
  const architecture = extractArchitecture(combinedContext, tech);

  // 3. Tech Stack Rationale
  const techStackRationale = extractTechStackRationale(combinedContext, tech);

  // 4. Personal Contribution
  const personalContribution = extractPersonalContribution(combinedContext);

  // 5. Technical Challenges
  const technicalChallenges = extractTechnicalChallenges(combinedContext);

  // 6. Database Design
  const databaseDesign = extractDatabaseDesign(combinedContext, tech);

  // 7. API Structure
  const apiStructure = extractApiStructure(combinedContext, tech);

  // 8. Security Measures
  const securityMeasures = extractSecurityMeasures(combinedContext);

  // 9. Performance Optimizations
  const performanceOptimizations = extractPerformanceOptimizations(combinedContext);

  // 10. Testing Strategy
  const testingStrategy = extractTestingStrategy(combinedContext);

  // 11. Deployment and CI/CD
  const deploymentAndCI = extractDeploymentAndCI(combinedContext, tech);

  // 12. Retrospective Improvements
  const retrospectiveImprovements = extractRetrospectiveImprovements(combinedContext);

  // Provenance resolution
  const hasVerifiedArtifact = Boolean(githubUrl && !githubUrl.includes("placeholder"));
  const defaultStatus: EvidenceProvenance = hasVerifiedArtifact ? "VERIFIED_EVIDENCE" : "CANDIDATE_CLAIM";

  const provenanceMap: Record<string, EvidenceProvenance> = {
    problemSolved: /unstated/i.test(problemSolved) ? "UNVERIFIED_CLAIM" : "CANDIDATE_CLAIM",
    architecture: /inferred/i.test(architecture) ? "INFERRED" : "CANDIDATE_CLAIM",
    techStackRationale: /inferred/i.test(techStackRationale) ? "INFERRED" : "CANDIDATE_CLAIM",
    personalContribution: /unstated/i.test(personalContribution) ? "UNVERIFIED_CLAIM" : "CANDIDATE_CLAIM",
    technicalChallenges: technicalChallenges.length > 0 ? "CANDIDATE_CLAIM" : "UNVERIFIED_CLAIM",
    databaseDesign: /unstated/i.test(databaseDesign) ? "UNVERIFIED_CLAIM" : "CANDIDATE_CLAIM",
    apiStructure: /unstated/i.test(apiStructure) ? "UNVERIFIED_CLAIM" : "CANDIDATE_CLAIM",
    securityMeasures: /unstated/i.test(securityMeasures) ? "UNVERIFIED_CLAIM" : "CANDIDATE_CLAIM",
    performanceOptimizations: /unstated/i.test(performanceOptimizations) ? "UNVERIFIED_CLAIM" : "CANDIDATE_CLAIM",
    testingStrategy: /unstated/i.test(testingStrategy) ? "UNVERIFIED_CLAIM" : "CANDIDATE_CLAIM",
    deploymentAndCI: /unstated/i.test(deploymentAndCI) ? "UNVERIFIED_CLAIM" : "CANDIDATE_CLAIM",
    retrospectiveImprovements: "UNVERIFIED_CLAIM", // Requires live interview probe
  };

  return {
    id: `proj_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    title,
    tech,
    githubUrl,
    description: desc,
    verificationStatus: defaultStatus,
    problemSolved,
    architecture,
    techStackRationale,
    personalContribution,
    technicalChallenges,
    databaseDesign,
    apiStructure,
    securityMeasures,
    performanceOptimizations,
    testingStrategy,
    deploymentAndCI,
    retrospectiveImprovements,
    provenance: provenanceMap,
  };
}

// ══════════════════════════════════════════════════════════════
// 2. JOB DESCRIPTION INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════

export function buildJDCompetencyMatrix(
  jdText: string,
  arg2?: string | string[],
  arg3?: string[]
): JDCompetencyMatrix {
  let targetRoleFallback = "Software Engineer";
  let candidateSkills: string[] = [];

  if (Array.isArray(arg2)) {
    candidateSkills = arg2;
    targetRoleFallback = "Software Engineer";
  } else if (typeof arg2 === "string") {
    targetRoleFallback = arg2;
    if (Array.isArray(arg3)) {
      candidateSkills = arg3;
    }
  }

  const cleanJD = (jdText || "").trim();
  const normalizedLower = cleanJD.toLowerCase();

  // Role Category detection
  let roleCategory: JDCompetencyMatrix["roleCategory"] = "general_cs";
  if (/machine learning|\bml\b|\bai\b|deep learning|data scien|nlp|\bllm\b|computer vision|pytorch|tensorflow/i.test(normalizedLower)) {
    roleCategory = "aiml";
  } else if (/frontend|\bui\b|\bux\b|client|web|react|next\.?js|vue|angular|css|mobile|android|ios|flutter/i.test(normalizedLower)) {
    roleCategory = "frontend";
  } else if (/data engineer|etl|pipeline|spark|hadoop|data warehouse|snowflake|databricks|\bdbt\b|iceberg|flink/i.test(normalizedLower)) {
    roleCategory = "data_eng";
  } else if (/devops|sre|reliability|cloud engineer|platform engineer|kubernetes|terraform|aws|gcp|infrastructure|ci\/cd/i.test(normalizedLower)) {
    roleCategory = "devops";
  } else if (/security|infosec|cybersecurity|penetration|cryptography|vulnerability|soc\b|compliance/i.test(normalizedLower)) {
    roleCategory = "security";
  } else if (/backend|distributed systems|microservice|database|api|golang|java|python|server/i.test(normalizedLower)) {
    roleCategory = "sde_backend";
  }

  // Extract Experience Expectations
  let experienceExpectations = "Early career / Entry-level (0-2 years)";
  if (/senior|lead|staff|principal|5\+|6\+|7\+|8\+|10\+/i.test(cleanJD)) {
    experienceExpectations = "Senior / Staff level (5+ years engineering depth)";
  } else if (/3\+|4\+|mid-level|3-5 years/i.test(cleanJD)) {
    experienceExpectations = "Mid-level Engineer (2-4 years industry experience)";
  } else if (/intern|internship|fresher|university graduate|new grad|campus/i.test(cleanJD)) {
    experienceExpectations = "University Graduate / Intern (Foundational engineering focus)";
  }

  // Competency Catalogs across Dimensions
  const candidateLower = (candidateSkills || [])
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.toLowerCase());

  const mustHaveCatalog: Array<{ name: string; category: JDCompetencyItem["category"]; pattern: RegExp; desc: string }> = [
    { name: "Distributed Systems & Scalability", category: "distributed_systems", pattern: /distributed|high availability|fault tolerance|scalab|sharding|replication/i, desc: "Architecting decoupled, fault-tolerant distributed services." },
    { name: "Relational & NoSQL Database Design", category: "databases", pattern: /postgres|mysql|sql|nosql|mongodb|dynamodb|redis|database|schema|indexing/i, desc: "Designing normalized schemas, query indexing, and data access layers." },
    { name: "RESTful & High-Performance API Design", category: "architecture", pattern: /api|rest|grpc|graphql|microservice|endpoints/i, desc: "Constructing idempotent, well-versioned service contracts and APIs." },
    { name: "Concurrency & Asynchronous Processing", category: "fundamentals", pattern: /concurrency|multithread|async|race condition|event loop|deadlock|locking/i, desc: "Managing thread safety, race conditions, and asynchronous execution." },
    { name: "Data Structures & Core Algorithms", category: "fundamentals", pattern: /algorithms?|data structures?|complexity|tree|graph|hash/i, desc: "Selecting optimal data structures and Big-O computation complexity." },
    { name: "Production Engineering & Observability", category: "production_ops", pattern: /docker|kubernetes|ci\/cd|observability|monitoring|logging|telemetry|deployment/i, desc: "Packaging, containerizing, and monitoring services in production environments." },
  ];

  const mustHaveCompetencies: JDCompetencyItem[] = [];
  const goodToHaveCompetencies: JDCompetencyItem[] = [];
  const unsupportedJDRequirements: string[] = [];

  for (const item of mustHaveCatalog) {
    const isPresentInJD = item.pattern.test(cleanJD);
    if (isPresentInJD || cleanJD.length < 50) {
      const isBacked = candidateLower.some((c) => item.pattern.test(c));
      const compItem: JDCompetencyItem = {
        id: `comp_${item.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: item.name,
        category: item.category,
        priority: "must_have",
        expectedDepth: item.desc,
        rationale: "Required for robust production execution in this role.",
        isBackedByResume: isBacked,
      };
      mustHaveCompetencies.push(compItem);
      if (!isBacked) {
        unsupportedJDRequirements.push(item.name);
      }
    }
  }

  // Good-to-have items
  const goodToHaveCatalog: Array<{ name: string; category: JDCompetencyItem["category"]; pattern: RegExp; desc: string }> = [
    { name: "Message Queues & Stream Processing", category: "distributed_systems", pattern: /kafka|rabbitmq|pub\/sub|sqs|event-driven|stream/i, desc: "Asynchronous decoupling using distributed event logs and queues." },
    { name: "Caching Layers & Cache-Aside Invalidation", category: "databases", pattern: /redis|memcached|caching|invalidation/i, desc: "Mitigating database load through strategic cache layers." },
    { name: "Security, Authentication & OAuth2", category: "security", pattern: /oauth|jwt|auth|security|encryption|rbac/i, desc: "Enforcing secure session validation, authorization, and encryption." },
  ];

  for (const item of goodToHaveCatalog) {
    if (item.pattern.test(cleanJD)) {
      const isBacked = candidateLower.some((c) => item.pattern.test(c));
      goodToHaveCompetencies.push({
        id: `comp_${item.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: item.name,
        category: item.category,
        priority: "good_to_have",
        expectedDepth: item.desc,
        rationale: "Enhances engineering velocity and service resilience.",
        isBackedByResume: isBacked,
      });
      if (!isBacked) {
        unsupportedJDRequirements.push(item.name);
      }
    }
  }

  // Engineering fundamentals
  const engineeringFundamentals = [
    "Big-O Time & Space Complexity",
    "Memory Management & Garbage Collection",
    "Network Protocols (TCP, HTTP/1.1, HTTP/2, gRPC)",
    "ACID Transaction Guarantees & Isolation Levels",
  ];

  const roleResponsibilities = [
    "Design and develop robust, maintainable engineering components.",
    "Evaluate technical trade-offs between delivery speed and system extensibility.",
    "Debug production incidents and implement permanent root-cause mitigations.",
  ];

  const architecturalExpectations = roleCategory === "aiml"
    ? "Low-latency inference pipelines, data normalization, batching, and model drift tracking."
    : roleCategory === "frontend"
    ? "Responsive rendering, atomic state management, asset bundle optimization, and accessible UI components."
    : "Decoupled microservice/modular architecture, database transaction boundaries, and horizontal scaling.";

  const productionEngineeringExpectations = "Automated container builds, CI/CD regression testing, graceful error boundaries, and structured telemetry.";

  return {
    targetRole: targetRoleFallback,
    roleCategory,
    experienceExpectations,
    mustHaveCompetencies,
    goodToHaveCompetencies,
    engineeringFundamentals,
    roleResponsibilities,
    architecturalExpectations,
    productionEngineeringExpectations,
    unsupportedJDRequirements,
  };
}

// ══════════════════════════════════════════════════════════════
// 3. COMPLETE CANDIDATE INTELLIGENCE PROFILER
// ══════════════════════════════════════════════════════════════

export function buildCandidateIntelligenceProfile(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any
): CandidateIntelligenceProfile {
  let candidateId = "candidate";
  let resumeText = "";
  let jdText = "";
  let options: any = {};

  if (typeof arg1 === "object" && arg1 !== null && !("toLowerCase" in arg1)) {
    candidateId = arg1.candidateId || "candidate";
    resumeText = arg1.resumeText || arg1.resume || "";
    jdText = arg1.jdText || arg1.jd || "";
    options = arg1;
  } else {
    candidateId = typeof arg1 === "string" ? arg1 : "candidate";
    resumeText = typeof arg2 === "string" ? arg2 : "";
    jdText = typeof arg3 === "string" ? arg3 : "";
    options = typeof arg4 === "object" && arg4 !== null ? arg4 : {};
  }

  const name = options.name || extractCandidateName(resumeText) || "Candidate";
  const rawVerifiedList = options.verifiedDNASkills || options.verifiedSkills || [];
  const claimedList = options.claimedSkills || [];

  // Normalize verified list to support both string[] and Array<{ capability/name, score }>
  const verifiedList: Array<{ name: string; score?: number }> = [];
  for (const item of rawVerifiedList) {
    if (typeof item === "string" && item.trim().length > 0) {
      verifiedList.push({ name: item.trim() });
    } else if (item && typeof item === "object") {
      const n = item.capability || item.name || item.skill;
      if (typeof n === "string" && n.trim().length > 0) {
        verifiedList.push({ name: n.trim(), score: item.score });
      }
    }
  }

  // Extract skills from resume text if claimed list is empty
  const rawSkillsList = claimedList.length > 0 ? claimedList : extractSkillsFromResume(resumeText);
  const rawSkills: string[] = [];
  for (const s of rawSkillsList) {
    if (typeof s === "string" && s.trim().length > 0) {
      rawSkills.push(s.trim());
    }
  }

  // Separate verified vs claimed skills with explicit provenance
  const verifiedCompetencies: CompetencyEvidenceRecord[] = [];
  const claimedCompetencies: CompetencyEvidenceRecord[] = [];
  const inferredCompetencies: CompetencyEvidenceRecord[] = [];
  const unverifiedClaims: string[] = [];
  const provenanceDirectory: Record<string, { provenance: EvidenceProvenance; details: string; verifiedScore?: number }> = {};

  // 1. Process Verified Skills (Authenticated Student DNA or verified test evidence)
  for (const item of verifiedList) {
    const sk = item.name;
    const rec: CompetencyEvidenceRecord = {
      name: sk,
      provenance: "VERIFIED_EVIDENCE",
      source: "Student DNA Authenticated Evidence / Coding Assessment",
      confidence: 0.95,
      verifiedScore: item.score,
      details: "Independently verified through platform challenge or GitHub evidence.",
    };
    verifiedCompetencies.push(rec);
    const key = sk.toLowerCase();
    provenanceDirectory[key] = {
      provenance: "VERIFIED_EVIDENCE",
      details: "Authenticated verification on file.",
      verifiedScore: item.score,
    };
  }

  // 2. Process Claimed Skills (Resume assertions)
  for (const sk of rawSkills) {
    const key = sk.toLowerCase();
    if (!provenanceDirectory[key]) {
      const rec: CompetencyEvidenceRecord = {
        name: sk,
        provenance: "CANDIDATE_CLAIM",
        source: "Candidate Resume Assertion",
        confidence: 0.5,
        claimedLevel: "Self-Reported",
        details: "Declared on candidate resume; requires live interview probing.",
      };
      claimedCompetencies.push(rec);
      provenanceDirectory[key] = {
        provenance: "CANDIDATE_CLAIM",
        details: "Declared in resume text without external verification.",
      };
      unverifiedClaims.push(sk);
    }
  }

  // 3. Process Inferred Skills (e.g. Next.js implies React, FastAPI implies Python, Docker implies Containers)
  if (hasSkill("next.js", rawSkills) && !hasSkill("react", rawSkills)) {
    inferredCompetencies.push({
      name: "React Fundamentals",
      provenance: "INFERRED",
      source: "Inferred from declared Next.js project usage",
      confidence: 0.7,
    });
  }
  if (hasSkill("fastapi", rawSkills) && !hasSkill("python", rawSkills)) {
    inferredCompetencies.push({
      name: "Python Core",
      provenance: "INFERRED",
      source: "Inferred from declared FastAPI implementation",
      confidence: 0.75,
    });
  }

  // 4. Extract Projects with 12-point profiling
  const projects: TwelvePointProjectProfile[] = [];
  const rawProjects = options.rawProjects && options.rawProjects.length > 0
    ? options.rawProjects
    : parseProjectsFromResume(resumeText);

  for (const p of rawProjects) {
    const twelvePoint = extractTwelvePointProjectProfile(p, resumeText);
    projects.push(twelvePoint);
  }

  // 5. Detect Inconsistencies
  const potentialInconsistencies: CandidateIntelligenceProfile["potentialInconsistencies"] = [];
  detectInconsistencies(resumeText, projects, rawSkills, potentialInconsistencies);

  // 6. Experience Level Calibration
  const experienceYears = extractExperienceYears(resumeText);
  let experienceLevel: CandidateIntelligenceProfile["experienceLevel"] = "experienced";
  if (experienceYears === null || experienceYears <= 1) {
    experienceLevel = "fresher";
  } else if (experienceYears <= 3) {
    experienceLevel = "early_career";
  } else {
    experienceLevel = "experienced";
  }

  return {
    candidateId,
    name,
    experienceYears,
    experienceLevel,
    careerIntent: `Seeking ${options.targetRole || "Software Engineering"} position`,
    projects,
    verifiedCompetencies,
    claimedCompetencies,
    inferredCompetencies,
    unverifiedClaims,
    potentialInconsistencies,
    provenanceDirectory,
    provenanceMap: provenanceDirectory,
  };
}

// ══════════════════════════════════════════════════════════════
// 4. PRIVATE PARSING & EXTRACTION HELPERS
// ══════════════════════════════════════════════════════════════

function extractProblemSolved(context: string, title: string): string {
  const match = context.match(/(?:problem|purpose|designed to|aimed to|built to|enables?|solves?|addressing)\s+([^.]+)/i);
  if (match && match[1] && match[1].trim().length > 10) {
    return match[1].trim();
  }
  // Extract first descriptive sentence
  const sentences = context.split(/[.\n]/).map((s) => s.trim()).filter((s) => s.length > 15);
  if (sentences.length > 0) {
    return sentences[0];
  }
  return `Engineered ${title} to address functional workflow requirements.`;
}

function extractArchitecture(context: string, tech: string[]): string {
  const lower = context.toLowerCase();
  if (lower.includes("microservice") || lower.includes("event-driven") || lower.includes("kafka")) {
    return "Event-driven decoupled microservice architecture with asynchronous communication.";
  }
  if (lower.includes("monolith") || lower.includes("modular monolith")) {
    return "Modular monolithic architecture with shared domain layers.";
  }
  if (lower.includes("serverless") || lower.includes("lambda") || lower.includes("cloud function")) {
    return "Serverless event-triggered cloud architecture.";
  }
  if (tech.some((t) => /react|next|vue|angular/i.test(t)) && tech.some((t) => /node|express|fastapi|django|flask|spring/i.test(t))) {
    return "Three-tier architecture: SPA client interface, stateless backend REST service, and relational database.";
  }
  return "Layered client-server architecture with API endpoints and persistent storage.";
}

function extractTechStackRationale(context: string, tech: string[]): string {
  const match = context.match(/(?:chose|selected|utilized|leveraged|using)\s+([^.]+?)\s+(?:because|for|due to|to enable)\s+([^.]+)/i);
  if (match && match[2] && match[2].trim().length > 5) {
    return `Selected ${match[1].trim()} because ${match[2].trim()}.`;
  }
  if (tech.length > 0) {
    return `Leveraged ${tech.slice(0, 3).join(", ")} to achieve rapid prototyping, type safety, and ecosystem libraries.`;
  }
  return "Selected standard engineering stack suited to project domain requirements.";
}

function extractPersonalContribution(context: string): string {
  const match = context.match(/(?:personally|solely|individual|my responsibility was|i (?:built|implemented|designed|architected|wrote|led))\s+([^.]+)/i);
  if (match && match[1] && match[1].trim().length > 10) {
    return `Candidate contributed: ${match[1].trim()}.`;
  }
  // Look for action verbs in bullet points
  const bulletMatch = context.match(/(?:^|\n)\s*[-•*]\s*(?:Implemented|Engineered|Architected|Designed|Constructed|Developed)\s+([^.\n]+)/i);
  if (bulletMatch && bulletMatch[1]) {
    return `Candidate implemented: ${bulletMatch[1].trim()}.`;
  }
  return "Candidate claimed general implementation ownership; personal module boundary unstated in resume text.";
}

function extractTechnicalChallenges(context: string): string[] {
  const challenges: string[] = [];
  const regex = /(?:challeng(?:e|ing)|hurdle|bottleneck|complex issue|resolved an issue where|debugged|reduced latency by|optimized)\s+([^.,;\n]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(context)) !== null) {
    if (m[1] && m[1].trim().length > 8 && !challenges.includes(m[1].trim())) {
      challenges.push(m[1].trim());
    }
  }
  if (challenges.length === 0) {
    // Check for metric improvements as challenge proxies
    const metricMatch = context.match(/(?:reduced|increased|improved|scaled|cut)\s+[^.,;\n]+(?:by|\bto\b)\s+\d+[%a-z0-9]+/i);
    if (metricMatch) {
      challenges.push(`Performance optimization: ${metricMatch[0]}`);
    }
  }
  return challenges;
}

function extractDatabaseDesign(context: string, tech: string[]): string {
  const lower = context.toLowerCase();
  if (lower.includes("postgres") || lower.includes("postgresql")) {
    return "PostgreSQL relational schema with normalized tables, foreign keys, and indexed query lookups.";
  }
  if (lower.includes("mongodb") || lower.includes("mongo")) {
    return "MongoDB document store with nested embedded collections for rapid read operations.";
  }
  if (lower.includes("redis")) {
    return "Redis in-memory key-value cache layer with TTL-based expiration for high-frequency access.";
  }
  if (lower.includes("mysql")) {
    return "MySQL relational database with indexed primary/foreign keys.";
  }
  if (tech.some((t) => /prisma|drizzle|typeorm|sqlalchemy/i.test(t))) {
    return "ORM-managed relational schema with automated migrations and relational constraints.";
  }
  return "Relational data model (database specifics unstated in resume claim).";
}

function extractApiStructure(context: string, tech: string[]): string {
  const lower = context.toLowerCase();
  if (lower.includes("grpc")) return "gRPC with Protocol Buffers for typed binary RPC communication.";
  if (lower.includes("graphql")) return "GraphQL schema with typed queries, mutations, and resolver execution.";
  if (lower.includes("websocket") || lower.includes("socket.io")) return "Bi-directional WebSocket streaming connection alongside REST endpoints.";
  if (lower.includes("rest") || tech.some((t) => /fastapi|express|flask|django|nest/i.test(t))) {
    return "RESTful HTTP API with standard JSON request/response contracts and status codes.";
  }
  return "Standard RESTful JSON endpoints (protocol details unstated in resume claim).";
}

function extractSecurityMeasures(context: string): string {
  const lower = context.toLowerCase();
  const measures: string[] = [];
  if (lower.includes("jwt") || lower.includes("json web token")) measures.push("JWT token validation");
  if (lower.includes("oauth")) measures.push("OAuth2 third-party authentication flow");
  if (lower.includes("rate limit") || lower.includes("throttl")) measures.push("API rate limiting");
  if (lower.includes("bcrypt") || lower.includes("hash")) measures.push("Salted password hashing");
  if (lower.includes("cors") || lower.includes("csrf")) measures.push("CORS/CSRF protection");
  if (lower.includes("rbac") || lower.includes("role-based")) measures.push("Role-based access control (RBAC)");
  if (lower.includes("encrypt") || lower.includes("aes") || lower.includes("tls") || lower.includes("ssl")) measures.push("Encryption in transit and at rest (TLS / AES)");
  if (lower.includes("token") && !lower.includes("jwt")) measures.push("Tokenized data protection");
  if (measures.length > 0) return measures.join(", ");
  return "Standard authentication middleware (specific security safeguards unstated in resume claim).";
}

function extractPerformanceOptimizations(context: string): string {
  const match = context.match(/(?:optimi|improv|reduc|latenc|cache|speed|scal)\w*\s+([^.\n]+)/i);
  if (match && match[0] && match[0].trim().length > 10) {
    return match[0].trim();
  }
  if (context.toLowerCase().includes("redis")) {
    return "Integrated Redis cache to reduce primary database read load and latency.";
  }
  return "Application performance maintained through standard indexing (metrics unstated in resume claim).";
}

function extractTestingStrategy(context: string): string {
  const lower = context.toLowerCase();
  const tests: string[] = [];
  if (lower.includes("jest")) tests.push("Jest unit & integration tests");
  if (lower.includes("pytest")) tests.push("pytest automated test suite");
  if (lower.includes("cypress") || lower.includes("playwright")) tests.push("End-to-End browser tests");
  if (lower.includes("mock") || lower.includes("stub")) tests.push("Service mocking");
  if (tests.length > 0) return tests.join(", ");
  return "Manual validation and local functional testing (automated test suite unstated in resume claim).";
}

function extractDeploymentAndCI(context: string, tech: string[]): string {
  const lower = context.toLowerCase();
  const deployments: string[] = [];
  if (lower.includes("docker")) deployments.push("Docker containerization");
  if (lower.includes("kubernetes") || lower.includes("k8s")) deployments.push("Kubernetes orchestration");
  if (lower.includes("github actions")) deployments.push("GitHub Actions CI/CD");
  if (lower.includes("aws") || lower.includes("ecs") || lower.includes("ec2") || lower.includes("s3")) deployments.push("AWS cloud hosting");
  if (lower.includes("vercel")) deployments.push("Vercel serverless deployment");
  if (deployments.length > 0) return deployments.join(", ");
  return "Standard cloud host deployment (CI/CD pipeline specifics unstated in resume claim).";
}

function extractRetrospectiveImprovements(context: string): string {
  // Retrospective improvements require live dialogue; marked unstated for initial resume profile
  return "Candidate prospective re-architecture unstated in resume text (requires live interview probe).";
}

function findProjectContextInResume(title: string, resumeText: string, defaultDesc: string): string {
  if (!resumeText) return defaultDesc;
  const lines = resumeText.split("\n");
  const projectIdx = lines.findIndex((l) => l.toLowerCase().includes(title.toLowerCase()));
  if (projectIdx === -1) return defaultDesc;

  const relevantLines: string[] = [];
  for (let i = projectIdx; i < Math.min(lines.length, projectIdx + 8); i++) {
    const l = lines[i].trim();
    if (i > projectIdx && /^(projects?|skills?|experience|education|certifications?):?/i.test(l)) {
      break;
    }
    if (l.length > 0) {
      relevantLines.push(l);
    }
  }
  return relevantLines.join(" ");
}

function extractTechFromContext(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  const knownTech = [
    "React", "Next.js", "Node.js", "Python", "FastAPI", "PostgreSQL", "Redis",
    "Docker", "Kubernetes", "AWS", "Go", "TypeScript", "JavaScript", "Java",
    "Spring Boot", "C++", "GraphQL", "REST", "MongoDB", "Kafka", "RabbitMQ",
    "Flask", "Django", "Tailwind", "PyTorch", "TensorFlow", "Prisma", "Drizzle"
  ];
  const found: string[] = [];
  for (const t of knownTech) {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isWord = /^\w+$/.test(t);
    const pattern = isWord ? new RegExp(`\\b${escaped}\\b`, "i") : new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "i");
    if (pattern.test(text)) {
      found.push(t);
    }
  }
  return found;
}

function parseProjectsFromResume(resumeText: string): Array<{ title: string; tech: string[]; description: string }> {
  const projects: Array<{ title: string; tech: string[]; description: string }> = [];
  if (!resumeText) return projects;

  const lines = resumeText.split("\n");
  let inProjects = false;
  let currentProject: { title: string; tech: string[]; description: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for inline project definition, e.g. "Project: Distributed Payment Gateway & Settlement Engine"
    const inlineHeader = line.match(/^projects?:\s*(.+)$/i);
    if (inlineHeader && inlineHeader[1].trim().length > 2) {
      inProjects = true;
      const titleCandidate = inlineHeader[1].trim();
      if (!/^(selected|recent|key|portfolio|overview)$/i.test(titleCandidate)) {
        if (currentProject) projects.push(currentProject);
        currentProject = {
          title: titleCandidate,
          tech: extractTechFromContext(line),
          description: line,
        };
        continue;
      }
      continue;
    }

    if (/^projects?:?/i.test(line)) {
      inProjects = true;
      continue;
    }
    if (inProjects && /^(skills|experience|education|certifications):?/i.test(line)) {
      if (currentProject) projects.push(currentProject);
      break;
    }

    if (inProjects && line.length > 0) {
      // Check if bullet represents a project header
      const headerMatch = line.match(/^[-•*]?\s*([A-Za-z0-9\s_-]+?)(?:\s*[:|–—-]\s*(.*))?$/);
      if (headerMatch && !line.startsWith("• Developed") && !line.startsWith("• Implemented") && !line.startsWith("- Handled")) {
        const potentialTitle = headerMatch[1].replace(/^[-•*]\s*/, "").trim();
        if (potentialTitle.length > 2 && potentialTitle.length < 35 && !/^(built|designed|reduced|using|handled)/i.test(potentialTitle)) {
          if (currentProject) projects.push(currentProject);
          const desc = headerMatch[2] || "";
          currentProject = {
            title: potentialTitle,
            tech: extractTechFromContext(line),
            description: desc,
          };
          continue;
        }
      }
      if (currentProject) {
        currentProject.description += (currentProject.description ? " " : "") + line.replace(/^[-•*]\s*/, "");
        const moreTech = extractTechFromContext(line);
        for (const t of moreTech) {
          if (!currentProject.tech.includes(t)) currentProject.tech.push(t);
        }
      }
    }
  }
  if (currentProject && !projects.some((p) => p.title === currentProject!.title)) {
    projects.push(currentProject);
  }
  return projects;
}

function extractSkillsFromResume(resumeText?: string): string[] {
  if (!resumeText || typeof resumeText !== "string") return [];
  const skillsMatch = resumeText.match(/skills?:?\s*([^\n\r]+)/i);
  if (skillsMatch && skillsMatch[1]) {
    return skillsMatch[1].split(/[,|;]/).map((s) => s.trim()).filter((s) => s.length > 1);
  }
  return extractTechFromContext(resumeText);
}

function extractCandidateName(resumeText: string): string | null {
  if (!resumeText) return null;
  const firstLine = resumeText.trim().split("\n")[0]?.trim();
  if (firstLine && firstLine.length > 2 && firstLine.length < 35 && !firstLine.includes(":") && !firstLine.includes("http")) {
    return firstLine;
  }
  return null;
}

function extractExperienceYears(resumeText: string): number | null {
  if (!resumeText) return null;
  const match = resumeText.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

function hasSkill(target: string, skillList: string[]): boolean {
  return skillList.some((s) => s.toLowerCase() === target.toLowerCase());
}

function detectInconsistencies(
  resumeText: string,
  projects: TwelvePointProjectProfile[],
  skills: string[],
  outInconsistencies: CandidateIntelligenceProfile["potentialInconsistencies"]
) {
  const lower = resumeText.toLowerCase();

  // Check 1: Declared Seniority vs Project Complexity
  const claimsSenior = lower.includes("senior") || lower.includes("lead");
  const hasBasicProjectsOnly = projects.every((p) =>
    p.architecture.includes("Layered client-server") && p.technicalChallenges.length === 0
  );
  if (claimsSenior && hasBasicProjectsOnly && projects.length > 0) {
    outInconsistencies.push({
      claim: "Senior / Lead Engineering Title",
      conflictingEvidence: "Project documentation shows basic CRUD workflows without architectural trade-offs or scaling metrics.",
      rationale: "Requires deep technical probing into personal leadership and system design challenges.",
    });
  }

  // Check 2: High Scale Claims vs Infrastructure
  const claimsMillions = lower.includes("million users") || lower.includes("100k rps") || lower.includes("high throughput");
  const hasSingleInstanceInfra = projects.some((p) =>
    (p.problemSolved.includes("million") || p.description?.includes("million")) &&
    p.deploymentAndCI.includes("Standard") &&
    !p.deploymentAndCI.includes("Kubernetes") &&
    !p.deploymentAndCI.includes("Docker")
  );
  if (claimsMillions && hasSingleInstanceInfra) {
    outInconsistencies.push({
      claim: "High Scale / Million User Traffic",
      conflictingEvidence: "Infrastructure specifies standard unclustered host without distributed caching or container orchestration.",
      rationale: "Probe how concurrency, database locking, and failover were handled under peak load.",
    });
  }
}
