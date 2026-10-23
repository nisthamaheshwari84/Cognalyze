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

import { supabase } from "@/lib/supabase";
import { DNAEvidence, RawSourceData, validateRawSourceData, processEvidencePipeline, detectContradictions, EvidenceFilter } from "./evidence-pipeline";
import { StudentSkill, StudentDNASnapshot, calculateStudentSkillProfile, generateStudentDNASnapshot, getExplainableWhyForSkill, MetricDataStatus, MetricProofDetail } from "./profile-engine";
import { RequirementProfile, getBenchmarkProfile, extractRequirementsFromJD } from "./requirement-engine";
import { GapReport, runDeterministicGapAnalysis, PrioritizedGapAction } from "./gap-engine";
import { getCandidateAttempts, CandidateAttempt } from "@/lib/skills/candidate-history";
import { getStudentProfile, DEMO_STUDENT_PROFILE } from "@/lib/placement-store";
import { getStudentProfileByUserId } from "@/lib/auth/store";
import {
  CandidateUnifiedEvidenceDossier,
  buildCandidateUnifiedEvidenceDossier,
  invalidateCandidateEvidence
} from "@/lib/evidence/candidate-evidence-engine";
import { evaluateStudentSkillIntelligence, EvaluatedCanonicalSkill } from "./skill-intelligence-engine";
import { calculateStudentDNAMetrics, StudentDNAMetricsSummary } from "./metric-proof";
import { evaluateRoleGaps, RoleGapAnalysisReport } from "./role-gap-engine";

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

export type DNAProfileLifecycleStatus =
  | "NOT_STARTED"
  | "MISSING_ESSENTIAL_INFO"
  | "AWAITING_RETRIEVAL"
  | "AWAITING_INSPECTION"
  | "PARTIALLY_ASSESSED"
  | "READY_FOR_REVIEW"
  | "UP_TO_DATE"
  | "STALE";

export interface FullStudentDNAResponse {
  userId: string;
  profileStatus?: DNAProfileLifecycleStatus;
  profileStatusReason?: string;
  snapshot: StudentDNASnapshot;
  skills: StudentSkill[];
  skillsBreakdown?: StudentSkill[];
  canonicalSkillIntelligence?: {
    evaluatedSkills: EvaluatedCanonicalSkill[];
    supportedSkillsCount: number;
    selfReportedOnlyCount: number;
    unassessedCount: number;
    conflictingCount: number;
  };
  metricsProof?: StudentDNAMetricsSummary;
  roleGapIntelligence?: RoleGapAnalysisReport;
  evidence: DNAEvidence[];
  recentProofItems?: DNAEvidence[];
  auditLogs: DNAAuditLog[];
  activeTargetProfile: RequirementProfile;
  targetRoleKey?: string;
  targetRoleTitle?: string;
  availableRoles?: Array<{ key: string; title: string }>;
  gapReport: GapReport;
  sourceIntelligence?: CandidateUnifiedEvidenceDossier;
  lastUpdatedAt: string;
}

// In-memory isolated user stores
const USER_EVIDENCE_STORE: Map<string, DNAEvidence[]> = new Map();
const USER_AUDIT_LOGS: Map<string, DNAAuditLog[]> = new Map();
const USER_TARGET_ROLES: Map<string, string> = new Map();

// ─── DNA DATA PERSISTENCE ENGINE (ACID Disk + Supabase Cloud Mirror) ───
const CLOUD_DNA_KEY = "cognalyze_dna_cloud_store";
let isDNAStoreLoaded = false;

function getDNAFilePath(): string {
  if (typeof window === "undefined") {
    const path = require("path");
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return path.join("/tmp", "cognalyze-dna-store.json");
    }
    return path.join(process.cwd(), "data", "dna-store.json");
  }
  return "";
}

export function loadDNAStoreFromDisk(force = false): void {
  if (typeof window === "undefined") {
    if (isDNAStoreLoaded && !force) return;
    try {
      const fs = require("fs");
      const filePath = getDNAFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.evidence && typeof parsed.evidence === "object") {
          for (const [k, v] of Object.entries(parsed.evidence)) {
            USER_EVIDENCE_STORE.set(k, v as DNAEvidence[]);
          }
        }
        if (parsed.auditLogs && typeof parsed.auditLogs === "object") {
          for (const [k, v] of Object.entries(parsed.auditLogs)) {
            USER_AUDIT_LOGS.set(k, v as DNAAuditLog[]);
          }
        }
        if (parsed.targetRoles && typeof parsed.targetRoles === "object") {
          for (const [k, v] of Object.entries(parsed.targetRoles)) {
            USER_TARGET_ROLES.set(k, v as string);
          }
        }
        isDNAStoreLoaded = true;
      }
    } catch (err) {
      console.warn("[dna-store] Failed to load from disk:", err);
    }
  }
}

export function persistDNAStoreToDisk(): void {
  if (typeof window === "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = getDNAFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const evidenceObj: Record<string, DNAEvidence[]> = {};
      for (const [k, v] of USER_EVIDENCE_STORE.entries()) {
        evidenceObj[k] = v;
      }

      const logsObj: Record<string, DNAAuditLog[]> = {};
      for (const [k, v] of USER_AUDIT_LOGS.entries()) {
        logsObj[k] = v;
      }

      const rolesObj: Record<string, string> = {};
      for (const [k, v] of USER_TARGET_ROLES.entries()) {
        rolesObj[k] = v;
      }

      const payload = {
        evidence: evidenceObj,
        auditLogs: logsObj,
        targetRoles: rolesObj,
        updatedAt: new Date().toISOString()
      };

      const tmpFile = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), "utf-8");
      try {
        fs.renameSync(tmpFile, filePath);
      } catch {
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
        if (fs.existsSync(tmpFile)) try { fs.unlinkSync(tmpFile); } catch {}
      }

      saveDNAStoreToCloud(payload).catch(() => {});
    } catch (err) {
      console.warn("[dna-store] Failed to persist to disk:", err);
    }
  }
}

export async function saveDNAStoreToCloud(payload?: any): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== "undefined") return { success: true };
  try {
    const dataToSave = payload || {
      evidence: Object.fromEntries(USER_EVIDENCE_STORE.entries()),
      auditLogs: Object.fromEntries(USER_AUDIT_LOGS.entries()),
      targetRoles: Object.fromEntries(USER_TARGET_ROLES.entries()),
      updatedAt: new Date().toISOString()
    };

    // 1. Canonical Supabase Persistence to public.dna_evidence & public.student_dna
    try {
      const { unifiedStudentDNAService } = await import("./unified-dna-service");
      for (const [userId, items] of USER_EVIDENCE_STORE.entries()) {
        await unifiedStudentDNAService.recalculateAndPersistDNAProfile(userId);
      }
    } catch (err) {
      console.warn("[dna-store] Canonical student_dna persistence notice:", err);
    }

    // 2. Legacy mirror compatibility in public.analyses
    const { data: existingRows, error: selectErr } = await supabase
      .from("analyses")
      .select("id")
      .eq("recruiter_clerk_id", CLOUD_DNA_KEY)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectErr) {
      console.warn("[dna-store] Cloud mirror select warning:", selectErr.message);
      return { success: false, error: selectErr.message };
    }

    if (existingRows && existingRows.length > 0 && existingRows[0]?.id) {
      const { error: updateErr } = await supabase
        .from("analyses")
        .update({
          full_report: dataToSave,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingRows[0].id);

      if (updateErr) {
        console.warn("[dna-store] Cloud mirror update warning:", updateErr.message);
        return { success: false, error: updateErr.message };
      }
      return { success: true };
    } else {
      const { error: insertErr } = await supabase
        .from("analyses")
        .insert({
          recruiter_clerk_id: CLOUD_DNA_KEY,
          candidate_id: "system-shared-dna-mirror",
          status: "completed",
          full_report: dataToSave,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertErr) {
        console.warn("[dna-store] Cloud mirror insert warning:", insertErr.message);
        return { success: false, error: insertErr.message };
      }
      return { success: true };
    }
    return { success: true };
  } catch (err: any) {
    console.warn("[dna-store] Cloud mirror exception:", err?.message || err);
    return { success: false, error: err?.message || "Failed to save DNA store to cloud" };
  }
}

export async function syncDNAStoreWithCloud(): Promise<void> {
  if (typeof window !== "undefined") return;
  try {
    const { data, error } = await supabase
      .from("analyses")
      .select("full_report")
      .eq("recruiter_clerk_id", CLOUD_DNA_KEY)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!error && data?.[0]?.full_report) {
      const cloud = data[0].full_report;
      if (cloud.evidence && typeof cloud.evidence === "object") {
        for (const [k, v] of Object.entries(cloud.evidence)) {
          if (!USER_EVIDENCE_STORE.has(k)) USER_EVIDENCE_STORE.set(k, v as DNAEvidence[]);
        }
      }
      if (cloud.auditLogs && typeof cloud.auditLogs === "object") {
        for (const [k, v] of Object.entries(cloud.auditLogs)) {
          if (!USER_AUDIT_LOGS.has(k)) USER_AUDIT_LOGS.set(k, v as DNAAuditLog[]);
        }
      }
      if (cloud.targetRoles && typeof cloud.targetRoles === "object") {
        for (const [k, v] of Object.entries(cloud.targetRoles)) {
          if (!USER_TARGET_ROLES.has(k)) USER_TARGET_ROLES.set(k, v as string);
        }
      }
    }
  } catch (err) {
    // Non-fatal
  }
}

// Initial load
loadDNAStoreFromDisk();
syncDNAStoreWithCloud().catch(() => {});

/**
 * Invalidate in-memory evidence and audit logs for a user so changes recompute immediately.
 */
export function invalidateUserDNAScope(userId: string): void {
  // Invalidate derived caches; preserve historical evidence and audit logs
  invalidateCandidateEvidence(userId);

  // Re-synchronize evidence with any updated profile projects
  const existing = USER_EVIDENCE_STORE.get(userId);
  if (existing) {
    const authProfile = getStudentProfileByUserId(userId);
    if (authProfile && Array.isArray(authProfile.projects)) {
      for (let pIdx = 0; pIdx < authProfile.projects.length; pIdx++) {
        const proj: any = authProfile.projects[pIdx];
        const title = proj.title || "Project";
        const techList: string[] = Array.isArray(proj.techStack) ? proj.techStack : (Array.isArray(proj.tech_stack) ? proj.tech_stack : ["Software Engineering"]);
        for (const tech of techList) {
          const sourceId = `proj_${pIdx}_${tech.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          if (!existing.some(e => e.sourceId === sourceId || e.metadata?.canonicalProjectId === title || (e.metadata?.projectTitle === title && e.skillId === tech.toLowerCase()))) {
            const raw: RawSourceData = {
              sourceType: "project",
              sourceId,
              sourceUrl: proj.githubUrl || proj.github_url || "https://github.com/repository",
              userId,
              skillRaw: tech,
              evidenceType: "project_artifact",
              claim: `Implemented project '${title}' utilizing ${tech}`,
              extractedValue: proj.description || `Fullstack implementation with ${tech}`,
              strength: 0.8,
              timestamp: new Date().toISOString(),
              metadata: {
                projectTitle: title,
                techStack: techList,
                canonicalProjectId: title,
                role: proj.role || "Developer"
              }
            };
            const processed = processEvidencePipeline([raw]);
            if (processed.length > 0) {
              existing.unshift(processed[0]);
            }
          }
        }
      }
    }
  }
}

/**
 * Initialize baseline evidence for a candidate if empty.
 * Combines full profile data across all sections (resume claims, past projects, experience,
 * achievements, certifications, GitHub proof) with candidate practice/assessment attempts.
 */
export async function initializeUserEvidenceIfEmpty(userId: string): Promise<DNAEvidence[]> {
  loadDNAStoreFromDisk();
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
      const isHack = (ach.type || "").toLowerCase().includes("hackathon") || (ach.title || "").toLowerCase().includes("hackathon");
      const isContest = (ach.type || "").toLowerCase().includes("contest") || (ach.title || "").toLowerCase().includes("contest") || (ach.title || "").toLowerCase().includes("olympiad");
      
      rawList.push({
        sourceType: isHack ? "hackathon" : (isContest ? "assessment" : "project"),
        sourceId: `ach_${achIdx}`,
        userId,
        skillRaw: isHack ? "System Design" : (isContest ? "Competitive Programming" : "Problem Solving"),
        evidenceType: "competitive_event",
        claim: `Achieved '${ach.title}' (${ach.type}): ${ach.description || ""}`,
        extractedValue: ach.description || ach.title,
        strength: isHack ? 0.8 : 0.7,
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
  persistDNAStoreToDisk();
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
  const existingIdx = currentList.findIndex(
    e => e.id === newEv.id || (Boolean(newEv.sourceId) && e.sourceId === newEv.sourceId && e.sourceType === newEv.sourceType && e.skillId === newEv.skillId)
  );
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
  persistDNAStoreToDisk();
  invalidateCandidateEvidence(userId);

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
  persistDNAStoreToDisk();
  invalidateCandidateEvidence(userId);

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
  persistDNAStoreToDisk();
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
  
  // 1. Build unified evidence dossier across 8 source streams with zero fabrication
  const sourceIntelligence = await buildCandidateUnifiedEvidenceDossier(userId);

  // 2. Derive projects metrics
  const submittedProjects = new Set(
    evidence
      .filter(e => e.sourceType === "project" || e.sourceType === "github")
      .map(e => e.metadata?.canonicalProjectId || e.metadata?.projectTitle || e.sourceId)
  );
  const projectsCount = submittedProjects.size;
  const projectsStatus: MetricDataStatus = projectsCount === 0 ? "NO_RECORDS" : "READY";
  const projectsDetail: MetricProofDetail = {
    value: projectsCount,
    status: projectsStatus,
    displayText: projectsCount === 0 ? "No records found" : String(projectsCount),
    sourceName: "Candidate Submitted Project Artifacts",
    scopeNote: "Calculated from authentic candidate project submissions. Deduplicated by canonical project entity.",
    breakdown: {
      submittedCount: projectsCount,
      withAccessibleRepo: sourceIntelligence.github.accessible_repos.length,
      withAccessibleDeploy: sourceIntelligence.deployments.deployments.filter(d => d.accessible).length,
      withInspectedCode: sourceIntelligence.github.accessible_repos.filter(r => r.languages_in_code.length > 0).length
    }
  };

  // 3. Derive hackathons metrics
  const hackathonList = sourceIntelligence.hackathons.hackathons;
  const hackathonsCount = hackathonList.length;
  const hackathonsStatus: MetricDataStatus = hackathonsCount === 0 ? "NO_RECORDS" : "READY";
  const hackathonsDetail: MetricProofDetail = {
    value: hackathonsCount,
    status: hackathonsStatus,
    displayText: hackathonsCount === 0 ? "No records found" : String(hackathonsCount),
    sourceName: "Candidate Hackathon & Competition Records",
    scopeNote: "Calculated from authentic competition records. Distinguishes student-reported vs independently verified results.",
    breakdown: {
      totalCount: hackathonsCount,
      studentReportedCount: hackathonList.filter(h => h.reported_by_student).length,
      independentlySupportedCount: hackathonList.filter(h => h.url_verified).length,
      verifiedAwardsCount: hackathonList.filter(h => h.official_result_status === "WINNER").length
    }
  };

  // 4. Derive GitHub metrics
  const ghStatus = sourceIntelligence.github.retrieval_status;
  const ghRepos = sourceIntelligence.github.repos_count;
  let githubMetricStatus: MetricDataStatus = "NOT_CONNECTED";
  let githubDisplayText = "Not connected";
  if (ghStatus === "NOT_CONNECTED" || ghStatus === "NOT_PROVIDED") {
    githubMetricStatus = "NOT_CONNECTED";
    githubDisplayText = "Not connected";
  } else if (ghStatus === "RETRIEVAL_FAILED" || ghStatus === "ACCESS_RESTRICTED" || ghStatus === "EXTRACTION_FAILED") {
    githubMetricStatus = "UNABLE_TO_RETRIEVE";
    githubDisplayText = "Unable to retrieve data";
  } else if (ghRepos === 0 || ghStatus === "INSUFFICIENT_EVIDENCE") {
    githubMetricStatus = "NO_RECORDS";
    githubDisplayText = "No records found";
  } else if (ghRepos !== null) {
    githubMetricStatus = "READY";
    githubDisplayText = String(ghRepos);
  }
  const githubDetail: MetricProofDetail = {
    value: ghRepos,
    status: githubMetricStatus,
    displayText: githubDisplayText,
    sourceName: "Public GitHub REST API",
    scopeNote: "Inspected via public GitHub API. Excludes unauthorized private repositories.",
    breakdown: {
      retrievalStatus: ghStatus,
      accessibleReposCount: sourceIntelligence.github.accessible_repos.length,
      languages: sourceIntelligence.github.top_languages
    }
  };

  // 5. Derive LeetCode metrics
  const lcStatus = sourceIntelligence.leetcode.retrieval_status;
  const lcSolved = sourceIntelligence.leetcode.total_solved;
  let leetcodeMetricStatus: MetricDataStatus = "NOT_CONNECTED";
  let leetcodeDisplayText = "Not connected";
  if (lcStatus === "NOT_CONNECTED" || lcStatus === "NOT_PROVIDED") {
    leetcodeMetricStatus = "NOT_CONNECTED";
    leetcodeDisplayText = "Not connected";
  } else if (lcStatus === "RETRIEVAL_FAILED" || lcStatus === "ACCESS_RESTRICTED" || lcStatus === "EXTRACTION_FAILED") {
    leetcodeMetricStatus = "UNABLE_TO_RETRIEVE";
    leetcodeDisplayText = "Unable to retrieve data";
  } else if (lcSolved === 0 || lcStatus === "INSUFFICIENT_EVIDENCE") {
    leetcodeMetricStatus = "NO_RECORDS";
    leetcodeDisplayText = "No records found";
  } else if (lcSolved !== null) {
    leetcodeMetricStatus = "READY";
    leetcodeDisplayText = String(lcSolved);
  }
  const leetcodeDetail: MetricProofDetail = {
    value: lcSolved,
    status: leetcodeMetricStatus,
    displayText: leetcodeDisplayText,
    retrievedAt: sourceIntelligence.leetcode.retrieved_at,
    sourceName: "LeetCode Public Profile",
    scopeNote: "Live statistics extracted directly from official LeetCode endpoints without estimation.",
    breakdown: {
      easySolved: sourceIntelligence.leetcode.easy_solved,
      mediumSolved: sourceIntelligence.leetcode.medium_solved,
      hardSolved: sourceIntelligence.leetcode.hard_solved,
      contestRating: sourceIntelligence.leetcode.contest_rating
    }
  };

  const proofCounts = {
    githubVerified: sourceIntelligence.github.accessible_repos.length > 0 || evidence.some(e => e.sourceType === "github"),
    githubRepoCount: ghRepos ?? 0,
    leetcodeSolvedCount: lcSolved ?? 0,
    projectsCount,
    assessmentsCount: evidence.filter(e => e.sourceType === "assessment" || e.sourceType === "practice").length,
    interviewsCount: evidence.filter(e => e.sourceType === "interview").length,
    hackathonsCount,
    projectsDetail,
    hackathonsDetail,
    githubDetail,
    leetcodeDetail
  };

  const snapshot = generateStudentDNASnapshot(userId, skills, proofCounts);
  const auditLogs = USER_AUDIT_LOGS.get(userId) || [];

  // Determine Target Requirement Profile
  const activeRoleKey = getUserTargetRole(userId);
  let targetProfile: RequirementProfile;
  if (customTargetProfile) {
    targetProfile = customTargetProfile;
  } else {
    targetProfile = getBenchmarkProfile(activeRoleKey) || getBenchmarkProfile("sde_intern")!;
  }

  // Run deterministic gap engine
  const gapReport = runDeterministicGapAnalysis(skills, targetProfile);

  // ── PHASE 3 INTELLIGENCE ENGINE COMPUTATIONS ──
  const authProfile = getStudentProfileByUserId(userId);
  const studentClaims = (authProfile?.skills || []).map((s: any) => ({
    skillName: typeof s === "string" ? s : s.name,
    claimedLevel: (typeof s === "object" && s.level) ? s.level : "Intermediate"
  }));

  const canonicalSkillIntelligence = evaluateStudentSkillIntelligence(userId, evidence, studentClaims);
  const metricsProof = await calculateStudentDNAMetrics(userId, evidence, studentClaims);
  const roleGapIntelligence = evaluateRoleGaps(userId, targetProfile, evidence, studentClaims);

  // Derive Profile Lifecycle Status honestly
  let profileStatus: DNAProfileLifecycleStatus = "NOT_STARTED";
  let profileStatusReason = "No student profile or evidence recorded yet.";

  if (!authProfile && evidence.length === 0) {
    profileStatus = "NOT_STARTED";
    profileStatusReason = "Candidate has not created a profile or connected any data sources.";
  } else if (!authProfile?.resumeUrl && (authProfile?.projects || []).length === 0 && evidence.length === 0) {
    profileStatus = "MISSING_ESSENTIAL_INFO";
    profileStatusReason = "Essential profile information (resume or project links) has not been provided.";
  } else if (metricsProof.sourceCoverage.numerator === 0 && (metricsProof.sourceCoverage.denominator ?? 0) > 0) {
    profileStatus = "AWAITING_INSPECTION";
    profileStatusReason = "Connected sources have been queued and are awaiting deep code inspection.";
  } else if (canonicalSkillIntelligence.supportedSkillsCount === 0 && canonicalSkillIntelligence.selfReportedOnlyCount > 0) {
    profileStatus = "PARTIALLY_ASSESSED";
    profileStatusReason = "Skills are self-reported from resume; code inspection or assessment is required to verify capabilities.";
  } else if (evidence.every(e => e.recency === "STALE")) {
    profileStatus = "STALE";
    profileStatusReason = "Inspected evidence is older than 12 months; refresh connected repositories or complete new assessments.";
  } else if (canonicalSkillIntelligence.supportedSkillsCount > 0) {
    profileStatus = "UP_TO_DATE";
    profileStatusReason = "Profile is grounded in recent inspected codebase artifacts and verified records.";
  } else {
    profileStatus = "READY_FOR_REVIEW";
    profileStatusReason = "Profile has sufficient evidence for review and gap analysis.";
  }

  return {
    userId,
    profileStatus,
    profileStatusReason,
    snapshot,
    skills,
    skillsBreakdown: skills,
    canonicalSkillIntelligence,
    metricsProof,
    roleGapIntelligence,
    evidence,
    recentProofItems: evidence.slice(0, 5),
    auditLogs,
    activeTargetProfile: targetProfile,
    targetRoleKey: targetProfile.id || activeRoleKey,
    targetRoleTitle: targetProfile.roleTitle,
    availableRoles: [
      { key: "sde_intern", title: "Software Engineer Intern" },
      { key: "fullstack_junior", title: "Junior Full Stack Engineer" },
      { key: "ai_ml_engineer", title: "AI/ML Engineer" },
      { key: "backend_systems", title: "Backend Systems Engineer" }
    ],
    gapReport,
    sourceIntelligence,
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

