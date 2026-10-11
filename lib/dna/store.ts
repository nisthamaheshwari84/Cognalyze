/**
 * lib/dna/store.ts
 * Unified, user-isolated persistence and aggregation store for Student DNA & Skill Gaps.
 * 
 * CORE RULES:
 * 1. STRICT USER ISOLATION: Every evidence item and profile query is keyed by userId.
 * 2. NO ARBITRARY SCORE: LLMs never assign final proficiency.
 * 3. EXPLAINABLE: Every skill and gap has an auditable provenance trail.
 * 4. CONTINUOUS FEEDBACK: Real-time update when assessment or practice is completed.
 * 5. AUDIT TRAIL: History of DNA state changes.
 */

import { DNAEvidence, RawSourceData, validateRawSourceData, processEvidencePipeline, detectContradictions, EvidenceFilter } from "./evidence-pipeline";
import { StudentSkill, StudentDNASnapshot, calculateStudentSkillProfile, generateStudentDNASnapshot, getExplainableWhyForSkill } from "./profile-engine";
import { RequirementProfile, getBenchmarkProfile, extractRequirementsFromJD } from "./requirement-engine";
import { GapReport, runDeterministicGapAnalysis, PrioritizedGapAction } from "./gap-engine";
import { getCandidateAttempts, CandidateAttempt } from "@/lib/skills/candidate-history";
import { getStudentProfile, DEMO_STUDENT_PROFILE } from "@/lib/placement-store";
import { getStudentProfileByUserId } from "@/lib/auth/store";

export interface DNAAuditLog {
  id: string;
  userId: string;
  timestamp: string;
  changeType: "EVIDENCE_ADDED" | "EVIDENCE_RETRACTED" | "SOURCE_SYNCED" | "GAP_RECALCULATED";
  skillId?: string;
  oldLevel?: number;
  newLevel?: number;
  reason: string;
  evidenceId?: string;
}

export interface FullStudentDNAResponse {
  userId: string;
  snapshot: StudentDNASnapshot;
  skills: StudentSkill[];
  evidence: DNAEvidence[];
  auditLogs: DNAAuditLog[];
  activeTargetProfile: RequirementProfile;
  gapReport: GapReport;
  lastUpdatedAt: string;
}

// In-memory isolated user stores
const USER_EVIDENCE_STORE: Map<string, DNAEvidence[]> = new Map();
const USER_AUDIT_LOGS: Map<string, DNAAuditLog[]> = new Map();
const USER_TARGET_ROLES: Map<string, string> = new Map();

/**
 * Invalidate in-memory evidence and audit logs for a user so changes recompute immediately.
 */
export function invalidateUserDNAScope(userId: string): void {
  USER_EVIDENCE_STORE.delete(userId);
  USER_AUDIT_LOGS.delete(userId);
}

/**
 * Initialize baseline evidence for a candidate if empty.
 * Combines full profile data across all sections (resume claims, past projects, experience,
 * achievements, certifications, GitHub proof) with candidate practice/assessment attempts.
 */
export async function initializeUserEvidenceIfEmpty(userId: string): Promise<DNAEvidence[]> {
  let existing = USER_EVIDENCE_STORE.get(userId);
  if (existing && existing.length > 0) {
    return existing;
  }

  const rawList: RawSourceData[] = [];
  const authProfile = getStudentProfileByUserId(userId);
  const profile = (userId === "student-demo")
    ? (await getStudentProfile(userId) || DEMO_STUDENT_PROFILE)
    : await getStudentProfile(userId);

  // 1. Technical Skills from Auth Profile / Placement Profile
  const skillsList = authProfile?.skills?.length ? authProfile.skills : (profile?.skills || []);
  if (skillsList.length > 0) {
    skillsList.forEach((s: any, idx: number) => {
      const skillName = typeof s === "string" ? s : s.name;
      const rawLevel = (typeof s === "object" && s.level) ? s.level : "Intermediate";
      let strength = 0.5;
      if (rawLevel.toLowerCase() === "expert") strength = 0.95;
      else if (rawLevel.toLowerCase() === "advanced") strength = 0.8;
      else if (rawLevel.toLowerCase() === "intermediate") strength = 0.6;
      else strength = 0.4;

      const evidenceSource = (typeof s === "object" && s.evidenceSource) ? s.evidenceSource : "Self-Declared Skill Claim";

      rawList.push({
        sourceType: "resume",
        sourceId: `profile_skill_${idx}_${skillName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        userId,
        skillRaw: skillName,
        evidenceType: "claim",
        claim: `Student declared proficiency as ${rawLevel} in ${skillName} (${evidenceSource})`,
        extractedValue: rawLevel,
        strength,
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { declaredLevel: rawLevel, source: evidenceSource }
      });
    });
  }

  // 2. Projects & Codebase Artifacts
  const projectList = authProfile?.projects?.length ? authProfile.projects : (profile?.past_projects || []);
  if (projectList.length > 0) {
    projectList.forEach((proj: any, pIdx: number) => {
      const techList: string[] = Array.isArray(proj.techStack) ? proj.techStack : (Array.isArray(proj.tech_stack) ? proj.tech_stack : []);
      const title = proj.title || "Project";
      const desc = proj.description || "";
      const projUrl = proj.githubUrl || proj.github_url || "https://github.com/repository";

      techList.forEach(tech => {
        rawList.push({
          sourceType: "project",
          sourceId: `proj_${pIdx}_${tech.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          sourceUrl: projUrl,
          userId,
          skillRaw: tech,
          evidenceType: "project_artifact",
          claim: `Implemented project '${title}' utilizing ${tech}`,
          extractedValue: desc || `Fullstack implementation with ${tech}`,
          strength: 0.8,
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            projectTitle: title,
            techStack: techList,
            canonicalProjectId: title,
            role: proj.role || "Developer"
          }
        });
      });
    });
  }

  // 3. Work Experience & Internships
  if (authProfile?.experience?.length) {
    authProfile.experience.forEach((exp: any, expIdx: number) => {
      const techList: string[] = Array.isArray(exp.technologies) ? exp.technologies : [];
      const org = exp.organization || "Company";
      const role = exp.role || "Intern";
      techList.forEach(tech => {
        rawList.push({
          sourceType: "project",
          sourceId: `exp_${expIdx}_${tech.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          userId,
          skillRaw: tech,
          evidenceType: "project_artifact",
          claim: `Professional exposure as ${role} at ${org} with ${tech}`,
          extractedValue: exp.responsibilities || `Worked as ${role} utilizing ${tech}`,
          strength: 0.85,
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            organization: org,
            role,
            technologies: techList
          }
        });
      });
    });
  }

  // 4. Certifications
  if (authProfile?.certifications?.length) {
    authProfile.certifications.forEach((cert: any, certIdx: number) => {
      const certTitle = cert.title || "Certification";
      rawList.push({
        sourceType: "certification",
        sourceId: `cert_${certIdx}`,
        sourceUrl: cert.credentialUrl || undefined,
        userId,
        skillRaw: certTitle,
        evidenceType: "credential",
        claim: `Certified in ${certTitle} by ${cert.issuer || "Accredited Body"}`,
        extractedValue: cert.date || "Completed",
        strength: 0.75,
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { issuer: cert.issuer, credentialUrl: cert.credentialUrl }
      });
    });
  }

  // 5. Achievements & Hackathons
  if (authProfile?.achievements?.length) {
    authProfile.achievements.forEach((ach: any, achIdx: number) => {
      rawList.push({
        sourceType: "hackathon",
        sourceId: `ach_${achIdx}`,
        userId,
        skillRaw: ach.type === "Hackathon" ? "System Design" : "Problem Solving",
        evidenceType: "competitive_event",
        claim: `Achieved '${ach.title}' (${ach.type}): ${ach.description || ""}`,
        extractedValue: ach.description || ach.title,
        strength: 0.8,
        timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { achievementTitle: ach.title, type: ach.type, date: ach.date }
      });
    });
  }

  // 6. Connected GitHub Profile
  if (authProfile?.githubUrl) {
    rawList.push({
      sourceType: "github",
      sourceId: `gh_profile_${userId}`,
      sourceUrl: authProfile.githubUrl,
      userId,
      skillRaw: "Git",
      evidenceType: "public_repo",
      claim: `Verified GitHub profile connected: ${authProfile.githubUrl}`,
      extractedValue: "Public repositories and contribution history",
      strength: 0.8,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { githubUrl: authProfile.githubUrl }
    });
  }

  // 3. GitHub repository seed for demo/active student
  if (userId === "student-demo") {
    rawList.push({
      sourceType: "github",
      sourceId: "gh_repo_fastapi_agent",
      sourceUrl: "https://github.com/student-demo/autonomous-payment-agent",
      userId,
      skillRaw: "Python",
      evidenceType: "public_repo",
      claim: "Production repository: 84 commits, modular service architecture, unit tests",
      extractedValue: "84 commits, 92% test coverage, FastAPI & LangChain pipeline",
      strength: 0.85,
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { commits: 84, language: "Python", stars: 12, canonicalProjectId: "Autonomous Payment Recovery Agent" }
    });

    rawList.push({
      sourceType: "github",
      sourceId: "gh_repo_react_next",
      sourceUrl: "https://github.com/student-demo/cognalyze-web",
      userId,
      skillRaw: "React",
      evidenceType: "public_repo",
      claim: "Fullstack Next.js 15 application with React 19 Server Components",
      extractedValue: "Interactive client dashboards, state management, Tailwind & CSS modules",
      strength: 0.85,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { commits: 42, language: "TypeScript", stars: 5 }
    });

    // 4. LeetCode / Coding Practice seed
    rawList.push({
      sourceType: "leetcode",
      sourceId: "lc_profile_summary",
      sourceUrl: "https://leetcode.com/u/student-demo",
      userId,
      skillRaw: "Data Structures & Algorithms",
      evidenceType: "verified_assessment",
      claim: "Solved 142 LeetCode problems (68 Medium, 14 Hard) in Trees, Graphs, and DP",
      extractedValue: "142 problems solved, 1680 contest rating, 74% medium solve rate",
      strength: 0.8,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { totalSolved: 142, mediumSolved: 68, hardSolved: 14, contestRating: 1680 }
    });

    // 5. Practical Assessment seed
    rawList.push({
      sourceType: "assessment",
      sourceId: "cognalyze_dsa_exam_01",
      userId,
      skillRaw: "Data Structures & Algorithms",
      evidenceType: "practical_task",
      claim: "Scored 84% on Algorithmic Coding Challenge (Graph Traversal & Two-Pointer)",
      extractedValue: "84% correctness, optimal time complexity O(V+E)",
      strength: 0.9,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { score: 84, maxScore: 100, passed: true }
    });

    rawList.push({
      sourceType: "interview",
      sourceId: "mock_tech_interview_01",
      userId,
      skillRaw: "Python",
      evidenceType: "interview_signal",
      claim: "Technical Interviewer verified Python concurrency & generator mechanics",
      extractedValue: "Demonstrated clear understanding of asyncio event loops and GIL behavior",
      strength: 0.95,
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { interviewerRole: "Senior Engineer", outcome: "Passed" }
    });
  }

  // 4. Include any real Candidate Attempts logged in candidate-history.ts
  const candidateAttempts: CandidateAttempt[] = getCandidateAttempts(userId);
  for (const att of candidateAttempts) {
    let skillRaw = att.topic || "Problem Solving";
    if (att.domain === "dsa_coding") skillRaw = "Data Structures & Algorithms";
    if (att.domain === "system_design") skillRaw = "System Design";
    if (att.domain === "behavioral_hr") skillRaw = "Behavioral & HR Interview";
    if (att.domain === "communication_english") skillRaw = "Communication";
    if (att.domain === "aptitude_reasoning") skillRaw = "Quantitative Aptitude";

    rawList.push({
      sourceType: "practice",
      sourceId: att.id,
      userId,
      skillRaw,
      evidenceType: att.mode === "interview" ? "interview_signal" : "practical_task",
      claim: `Completed ${att.mode} session on ${att.topic} with ${att.score}% score`,
      extractedValue: `Score: ${att.score}%, Questions: ${att.questionsCorrect}/${att.questionsAttempted}. Feedback: ${att.feedback || "Standard practice completed."}`,
      strength: Math.min(1.0, Math.max(0.4, att.score / 100)),
      timestamp: att.timestamp,
      metadata: {
        domain: att.domain,
        score: att.score,
        accuracy: att.accuracy,
        timeSpent: att.timeSpentSeconds
      }
    });
  }

  const processed = processEvidencePipeline(rawList);
  USER_EVIDENCE_STORE.set(userId, processed);
  return processed;
}

/**
 * Retrieve all normalized evidence items for a candidate (strictly user-isolated).
 */
export async function getStudentEvidenceList(userId: string, filter?: EvidenceFilter): Promise<DNAEvidence[]> {
  const all = await initializeUserEvidenceIfEmpty(userId);
  if (!filter) return all;

  return all.filter(ev => {
    if (filter.skillId && ev.skillId !== filter.skillId) return false;
    if (filter.sourceType && ev.sourceType !== filter.sourceType) return false;
    if (filter.minReliability && ev.reliability < filter.minReliability) return false;
    if (filter.recency && ev.recency !== filter.recency) return false;
    return true;
  });
}

/**
 * Add a new verified evidence item into a student's DNA (e.g. from an assessment, practice session, or integration sync).
 * Automatically updates Student DNA, recomputes skills, and records an audit log.
 */
export async function addStudentEvidenceRecord(
  userId: string,
  raw: RawSourceData
): Promise<{ success: boolean; evidence?: DNAEvidence; error?: string; auditLog?: DNAAuditLog }> {
  // 1. Validation
  const validation = validateRawSourceData(raw.sourceType, userId, raw.metadata || raw);
  if (!validation.valid) {
    return { success: false, error: validation.rejectionReason || "Invalid evidence payload." };
  }

  // 2. Fetch current list
  const currentList = await initializeUserEvidenceIfEmpty(userId);

  // 3. Process new item through the evidence pipeline
  const processedBatch = processEvidencePipeline([raw]);
  if (processedBatch.length === 0) {
    return { success: false, error: "Evidence pipeline rejected item during canonical normalization." };
  }

  const newEv = processedBatch[0];

  // 4. Check for duplicate exact item
  const existingIdx = currentList.findIndex(e => e.id === newEv.id);
  if (existingIdx >= 0) {
    currentList[existingIdx] = newEv;
  } else {
    currentList.unshift(newEv);
  }
  USER_EVIDENCE_STORE.set(userId, currentList);

  // 5. Create audit log
  const auditLog: DNAAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    timestamp: new Date().toISOString(),
    changeType: "EVIDENCE_ADDED",
    skillId: newEv.skillId,
    newLevel: Math.round(newEv.strength * 5),
    reason: `Added new ${newEv.sourceType} evidence: "${newEv.claim}"`,
    evidenceId: newEv.id
  };

  const currentLogs = USER_AUDIT_LOGS.get(userId) || [];
  currentLogs.unshift(auditLog);
  USER_AUDIT_LOGS.set(userId, currentLogs);

  return { success: true, evidence: newEv, auditLog };
}

/**
 * Retract an integration or remove evidence items originating from a specified sourceType.
 * Satisfies Test 10: Retracting an integration cleans up downstream calculations deterministically.
 */
export async function retractEvidenceBySource(
  userId: string,
  sourceType: DNAEvidence["sourceType"]
): Promise<{ success: boolean; removedCount: number }> {
  const currentList = await initializeUserEvidenceIfEmpty(userId);
  const remaining = currentList.filter(e => e.sourceType !== sourceType);
  const removedCount = currentList.length - remaining.length;

  USER_EVIDENCE_STORE.set(userId, remaining);

  const auditLog: DNAAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    timestamp: new Date().toISOString(),
    changeType: "EVIDENCE_RETRACTED",
    reason: `Disconnected integration/source '${sourceType}', retracted ${removedCount} evidence items.`
  };
  const currentLogs = USER_AUDIT_LOGS.get(userId) || [];
  currentLogs.unshift(auditLog);
  USER_AUDIT_LOGS.set(userId, currentLogs);

  return { success: true, removedCount };
}

/**
 * Get active target role for student (defaults to SDE Intern).
 */
export function getUserTargetRole(userId: string): string {
  return USER_TARGET_ROLES.get(userId) || "sde_intern";
}

/**
 * Set active target role for student.
 */
export function setUserTargetRole(userId: string, roleKey: string): void {
  USER_TARGET_ROLES.set(userId, roleKey);
}

/**
 * Get the full Student DNA profile, snapshot, skills breakdown, proof items, and gap analysis.
 */
export async function getStudentDNAFull(
  userId: string,
  customTargetProfile?: RequirementProfile
): Promise<FullStudentDNAResponse> {
  const evidence = await initializeUserEvidenceIfEmpty(userId);
  const skills = calculateStudentSkillProfile(userId, evidence);
  
  const leetcodeEv = evidence.find(e => e.sourceType === "leetcode");
  const leetcodeSolvedCount = typeof leetcodeEv?.metadata?.totalSolved === "number"
    ? leetcodeEv.metadata.totalSolved
    : (leetcodeEv ? 1 : 0);

  const proofCounts = {
    githubVerified: evidence.some(e => e.sourceType === "github"),
    githubRepoCount: evidence.filter(e => e.sourceType === "github").length,
    leetcodeSolvedCount,
    projectsCount: new Set(evidence.filter(e => e.sourceType === "project" || e.sourceType === "github").map(e => e.metadata?.canonicalProjectId || e.sourceId)).size,
    assessmentsCount: evidence.filter(e => e.sourceType === "assessment" || e.sourceType === "practice").length,
    interviewsCount: evidence.filter(e => e.sourceType === "interview").length,
    hackathonsCount: evidence.filter(e => e.sourceType === "hackathon").length
  };
  const snapshot = generateStudentDNASnapshot(userId, skills, proofCounts);
  const auditLogs = USER_AUDIT_LOGS.get(userId) || [];

  // Determine Target Requirement Profile
  let targetProfile: RequirementProfile;
  if (customTargetProfile) {
    targetProfile = customTargetProfile;
  } else {
    const roleKey = getUserTargetRole(userId);
    targetProfile = getBenchmarkProfile(roleKey) || getBenchmarkProfile("sde_intern")!;
  }

  // Run deterministic gap engine
  const gapReport = runDeterministicGapAnalysis(skills, targetProfile);

  return {
    userId,
    snapshot,
    skills,
    evidence,
    auditLogs,
    activeTargetProfile: targetProfile,
    gapReport,
    lastUpdatedAt: new Date().toISOString()
  };
}

/**
 * Direct helper for "Why?" explainability on a specific skill.
 */
export async function getWhyForSkill(userId: string, skillId: string) {
  const evidence = await initializeUserEvidenceIfEmpty(userId);
  const skills = calculateStudentSkillProfile(userId, evidence);
  const skill = skills.find((s: StudentSkill) => s.skillId === skillId);
  return getExplainableWhyForSkill(skill, evidence);
}

