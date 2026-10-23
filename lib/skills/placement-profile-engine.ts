/**
 * lib/skills/placement-profile-engine.ts
 * Central Placement Profile & Intelligence Engine for Cognalyze.
 * 
 * Manages:
 * 1. Comprehensive Student Placement Profile data structure.
 * 2. Multi-tier competency taxonomy:
 *    - Self-reported
 *    - Question-assessed
 *    - Code-demonstrated (genuine execution)
 *    - Verified external (GitHub, resume, etc.)
 *    - Unverified
 *    - Unassessed
 * 3. Strict User Isolation and Genuine Empty States.
 * 4. Placement Roadmap and Recommendation Engine.
 */

import fs from "fs";
import path from "path";

export type KnowledgeTier = 
  | "self_reported"
  | "question_assessed"
  | "code_demonstrated"
  | "verified_external"
  | "unverified"
  | "unassessed";

export interface CompetencyStatus {
  competencyId: string;
  name: string;
  domain: "dsa" | "os" | "dbms" | "sql" | "cn" | "oop" | "system_design" | "concurrency" | "aptitude" | "behavioral";
  tier: KnowledgeTier;
  confidenceScore: number; // 0 - 100
  lastAssessedAt?: string;
  evidenceSource?: string;
  demonstratedProof?: string;
}

export interface StudentPlacementProfile {
  userId: string;
  fullName: string;
  email: string;
  college: string;
  degree: string;
  branch: string;
  graduationYear: string;
  academicYear?: string;
  cgpa?: string;
  
  // Placement Goals
  targetRoles: string[];
  targetCompanies: string[];
  opportunityType: "internship" | "full_time" | "both";
  placementType: "on_campus" | "off_campus" | "both";
  targetDeadline?: string;
  dailyPrepMinutes: number;
  preferredLanguage: string;
  preferredInterviewFormat: "coding" | "spoken" | "mixed";
  
  // Background & Self-Reported Skills
  programmingLanguages: string[];
  dsaProficiencyLevel: "Beginner" | "Intermediate" | "Advanced";
  projects: Array<{
    title: string;
    description: string;
    techStack: string[];
    githubUrl?: string;
    liveUrl?: string;
    personalContribution?: string;
  }>;
  resumeFileName?: string;
  resumeParsedSummary?: string;
  
  // Competencies Grid (Evidence-Grounded)
  competencies: Record<string, CompetencyStatus>;
  
  // Topics student explicitly wants to improve
  focusImprovementAreas: string[];
  
  createdAt: string;
  updatedAt: string;
  profileCompleted: boolean;
}

export interface RoadmapRecommendation {
  id: string;
  title: string;
  actionType: "learn_lesson" | "practice_coding" | "execute_sql" | "mock_interview" | "revise_topic";
  subjectId: string;
  targetHref: string;
  estimatedMinutes: number;
  priority: "high" | "medium" | "low";
  reasoning: string;
}

// ══════════════════════════════════════════════════════════════════════
// PERSISTENT FILE STORE (MULTI-TENANT USER ISOLATION)
// ══════════════════════════════════════════════════════════════════════

const SESSIONS_DIR = path.join(process.cwd(), "data");
const PROFILES_FILE = path.join(SESSIONS_DIR, "placement-profiles.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    try {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    } catch {}
  }
}

function loadAllProfiles(): Record<string, StudentPlacementProfile> {
  ensureDirectoryExists();
  if (!fs.existsSync(PROFILES_FILE)) return {};
  try {
    const raw = fs.readFileSync(PROFILES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAllProfiles(profiles: Record<string, StudentPlacementProfile>) {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist placement profiles to disk:", err);
  }
}

// ══════════════════════════════════════════════════════════════════════
// DEFAULT CANONICAL COMPETENCIES MATRIX
// ══════════════════════════════════════════════════════════════════════

export const CANONICAL_COMPETENCY_DEFINITIONS: Array<{ id: string; name: string; domain: CompetencyStatus["domain"] }> = [
  { id: "dsa_binary_search", name: "Binary Search & Monotonic Predicates", domain: "dsa" },
  { id: "dsa_arrays_strings", name: "Arrays, Strings & Two Pointers", domain: "dsa" },
  { id: "dsa_sliding_window", name: "Sliding Window & Subarrays", domain: "dsa" },
  { id: "dsa_trees_graphs", name: "Trees, Graphs & Traversals", domain: "dsa" },
  { id: "dsa_dp", name: "Dynamic Programming & Subproblems", domain: "dsa" },
  
  { id: "os_proc_threads", name: "Processes, Threads & Context Switching", domain: "os" },
  { id: "os_deadlocks", name: "Deadlocks & Banker's Algorithm", domain: "os" },
  { id: "os_virtual_mem", name: "Virtual Memory, Paging & TLB", domain: "os" },
  
  { id: "dbms_normalization", name: "Normalization 1NF-BCNF & Anomalies", domain: "dbms" },
  { id: "dbms_acid", name: "ACID Guarantees & Isolation Levels", domain: "dbms" },
  { id: "dbms_indexing", name: "B+ Tree Indexing & Query Plans", domain: "dbms" },
  
  { id: "sql_joins_subqueries", name: "Complex Joins, Subqueries & Aggregations", domain: "sql" },
  { id: "sql_window_functions", name: "Window Functions & DENSE_RANK", domain: "sql" },
  
  { id: "cn_tcp_handshake", name: "TCP 3-Way Handshake & Reliability", domain: "cn" },
  { id: "cn_dns_http", name: "DNS Resolution, HTTP/2 & HTTPS TLS", domain: "cn" },
  
  { id: "oop_solid", name: "SOLID Principles & Clean Architecture", domain: "oop" },
  { id: "oop_polymorphism", name: "Dynamic Dispatch & VTable Internals", domain: "oop" },
  
  { id: "concurrency_locks", name: "Mutexes, Condition Variables & Thread Safety", domain: "concurrency" },
  { id: "sys_design_scaling", name: "High-Level Distributed Systems & Caching", domain: "system_design" },
  { id: "aptitude_quant", name: "Quantitative Aptitude & Placement Logic", domain: "aptitude" },
  { id: "behavioral_star", name: "Behavioral Leadership & STAR Technique", domain: "behavioral" }
];

// ══════════════════════════════════════════════════════════════════════
// PROFILE API METHODS
// ══════════════════════════════════════════════════════════════════════

/**
 * Gets student placement profile by authenticated user ID.
 * Returns null if no profile exists for this user (never returns another user's profile).
 */
export function getPlacementProfile(userId: string): StudentPlacementProfile | null {
  if (!userId || typeof userId !== "string") return null;
  const all = loadAllProfiles();
  return all[userId] || null;
}

/**
 * Upserts placement profile for the authenticated user.
 */
export function upsertPlacementProfile(userId: string, data: Partial<StudentPlacementProfile>): StudentPlacementProfile {
  if (!userId) throw new Error("Authenticated user ID required.");
  const all = loadAllProfiles();
  const existing = all[userId];

  // Initialize initial default competencies if starting fresh
  const initialCompetencies: Record<string, CompetencyStatus> = {};
  for (const def of CANONICAL_COMPETENCY_DEFINITIONS) {
    initialCompetencies[def.id] = {
      competencyId: def.id,
      name: def.name,
      domain: def.domain,
      tier: "unassessed",
      confidenceScore: 0,
    };
  }

  const updated: StudentPlacementProfile = {
    userId,
    fullName: data.fullName ?? existing?.fullName ?? "",
    email: data.email ?? existing?.email ?? "",
    college: data.college ?? existing?.college ?? "",
    degree: data.degree ?? existing?.degree ?? "B.Tech",
    branch: data.branch ?? existing?.branch ?? "Computer Science",
    graduationYear: data.graduationYear ?? existing?.graduationYear ?? "2026",
    academicYear: data.academicYear ?? existing?.academicYear ?? "Final Year",
    cgpa: data.cgpa ?? existing?.cgpa ?? "",
    
    targetRoles: data.targetRoles ?? existing?.targetRoles ?? ["Software Development Engineer (SDE-1)"],
    targetCompanies: data.targetCompanies ?? existing?.targetCompanies ?? ["Google", "Amazon", "Razorpay"],
    opportunityType: data.opportunityType ?? existing?.opportunityType ?? "both",
    placementType: data.placementType ?? existing?.placementType ?? "both",
    targetDeadline: data.targetDeadline ?? existing?.targetDeadline ?? "2026-12-31",
    dailyPrepMinutes: data.dailyPrepMinutes ?? existing?.dailyPrepMinutes ?? 90,
    preferredLanguage: data.preferredLanguage ?? existing?.preferredLanguage ?? "cpp",
    preferredInterviewFormat: data.preferredInterviewFormat ?? existing?.preferredInterviewFormat ?? "mixed",
    
    programmingLanguages: data.programmingLanguages ?? existing?.programmingLanguages ?? ["C++", "Python", "SQL"],
    dsaProficiencyLevel: data.dsaProficiencyLevel ?? existing?.dsaProficiencyLevel ?? "Intermediate",
    projects: data.projects ?? existing?.projects ?? [],
    resumeFileName: data.resumeFileName ?? existing?.resumeFileName,
    resumeParsedSummary: data.resumeParsedSummary ?? existing?.resumeParsedSummary,
    
    competencies: {
      ...initialCompetencies,
      ...(existing?.competencies || {}),
      ...(data.competencies || {})
    },
    
    focusImprovementAreas: data.focusImprovementAreas ?? existing?.focusImprovementAreas ?? ["SQL Window Functions", "Operating Systems Paging"],
    
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profileCompleted: true
  };

  all[userId] = updated;
  saveAllProfiles(all);
  return updated;
}

/**
 * Records an authentic execution proof or assessment outcome, elevating a competency tier.
 */
export function recordCompetencyEvidence(
  userId: string,
  competencyId: string,
  tier: KnowledgeTier,
  confidenceScore: number,
  proofNote: string
): void {
  const profile = getPlacementProfile(userId);
  if (!profile) return;

  const current = profile.competencies[competencyId] || {
    competencyId,
    name: competencyId,
    domain: "dsa",
    tier: "unassessed",
    confidenceScore: 0
  };

  // Higher tiers strictly take precedence:
  // verified_external > code_demonstrated > question_assessed > self_reported > unassessed
  const tierRank: Record<KnowledgeTier, number> = {
    unassessed: 0,
    unverified: 1,
    self_reported: 2,
    question_assessed: 3,
    code_demonstrated: 4,
    verified_external: 5
  };

  const newTier = (tierRank[tier] >= tierRank[current.tier]) ? tier : current.tier;
  const newConfidence = Math.max(current.confidenceScore, confidenceScore);

  profile.competencies[competencyId] = {
    ...current,
    tier: newTier,
    confidenceScore: newConfidence,
    lastAssessedAt: new Date().toISOString(),
    demonstratedProof: proofNote
  };

  upsertPlacementProfile(userId, profile);
}

/**
 * Generates an adaptive, prioritized Placement Roadmap tailored to the student's profile and evidence gaps.
 */
export function generateAdaptiveRoadmap(profile: StudentPlacementProfile | null): RoadmapRecommendation[] {
  if (!profile) {
    return [
      {
        id: "setup-profile-first",
        title: "Complete Your Placement Profile",
        actionType: "learn_lesson",
        subjectId: "profile",
        targetHref: "/student/placement-profile",
        estimatedMinutes: 5,
        priority: "high",
        reasoning: "Configure target companies, roles, and current background to unlock personalized interview and practice roadmaps."
      }
    ];
  }

  const recs: RoadmapRecommendation[] = [];

  // Check SQL Competency
  const sqlComp = profile.competencies["sql_window_functions"];
  if (!sqlComp || sqlComp.tier === "unassessed" || sqlComp.confidenceScore < 70) {
    recs.push({
      id: "rec-sql-runner",
      title: "Master SQL Window Functions & DENSE_RANK",
      actionType: "execute_sql",
      subjectId: "sql",
      targetHref: "/student/skills/cs-interview?domain=sql",
      estimatedMinutes: 20,
      priority: "high",
      reasoning: `Target roles (${profile.targetRoles.join(", ")}) frequently test analytical SQL. Current tier is ${sqlComp?.tier || "unassessed"}.`
    });
  }

  // Check DSA Binary Search & Painter's Partition
  const dsaComp = profile.competencies["dsa_binary_search"];
  if (!dsaComp || dsaComp.tier !== "code_demonstrated") {
    recs.push({
      id: "rec-dsa-binary-search",
      title: "Solve Painter's Partition in DSA Arena",
      actionType: "practice_coding",
      subjectId: "dsa",
      targetHref: "/student/skills/dsa?problemId=painter-s-partition-problem",
      estimatedMinutes: 30,
      priority: "high",
      reasoning: "Demonstrate binary search on answer space using verified compiler execution."
    });
  }

  // Check OS Virtual Memory
  const osComp = profile.competencies["os_virtual_mem"];
  if (!osComp || osComp.confidenceScore < 60) {
    recs.push({
      id: "rec-os-virtual-memory",
      title: "Learn Virtual Memory, Paging & TLB Hit Mechanics",
      actionType: "learn_lesson",
      subjectId: "os",
      targetHref: "/student/skills/cs-interview?domain=os",
      estimatedMinutes: 25,
      priority: "medium",
      reasoning: "Crucial technical interview screening topic for Tier-1 corporate and product rounds."
    });
  }

  // Multi-Subject Mock Interview
  recs.push({
    id: "rec-custom-interview",
    title: "Take a Custom Multi-Subject Mock Interview",
    actionType: "mock_interview",
    subjectId: "custom",
    targetHref: "/student/skills?openInterview=custom",
    estimatedMinutes: 45,
    priority: "high",
    reasoning: `Simulate high-pressure multi-round interview covering ${profile.focusImprovementAreas.slice(0, 2).join(" & ")}.`
  });

  return recs;
}
