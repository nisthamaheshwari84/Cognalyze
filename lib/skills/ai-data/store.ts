/**
 * lib/skills/ai-data/store.ts
 * 
 * Multi-tenant Persistence Store for the AI, Data & Intelligence Arena.
 * Server-only module managing candidate progress, attempts, role selections,
 * onboarding profiles, baseline assessments, personalized roadmaps,
 * and integration with Student DNA.
 */

import fs from "fs";
import path from "path";
import { generateSecureId } from "@/lib/crypto-utils";
import {
  AiDataTrackSlug,
  TargetRoleSlug,
  StudentArenaAttempt,
  AiDataArenaSummary,
  ExerciseType,
  TopicMasteryRecord,
  LearningPosition,
  CustomTargetRoleConfig,
} from "./types";
import { getAllLessons, getTrackBySlug } from "./curriculum";
import { getTargetRoleBySlug } from "./roles";
import { getStudentDNAFull } from "@/lib/dna/store";
import { syncArenaAttemptToDNA } from "./dna-adapter";
import { isSupabaseAvailable, getAdminClient } from "@/lib/supabase";
import { BaselineAssessmentResult } from "./baseline-assessment-engine";
import { generatePersonalizedRoadmap, PersonalizedRoadmap } from "./roadmap-engine";
import { TOPIC_ID_ALIASES, getTopicLocation } from "./master-curriculum-taxonomy";
import { buildCanonicalArenaRoadmap, CanonicalArenaRoadmap } from "./sequencing-engine";

export interface CandidateOnboardingProfile {
  candidateId: string;
  primaryRole: TargetRoleSlug;
  secondaryRoles: TargetRoleSlug[];
  startingLevel: "beginner" | "intermediate" | "advanced";
  weeklyHours: number;
  languagePreference: "english" | "hinglish";
  learningStyle: "hands_on" | "visual" | "systematic";
  onboardingCompleted: boolean;
  completedAt?: string;
}

interface StoreSchema {
  candidateRoles: Record<string, TargetRoleSlug>;
  candidateActiveTracks: Record<string, AiDataTrackSlug>;
  candidateOnboarding?: Record<string, CandidateOnboardingProfile>;
  candidateBaselines?: Record<string, BaselineAssessmentResult>;
  candidateLanguages?: Record<string, "english" | "hinglish">;
  candidateTopicStages?: Record<string, Record<string, number>>;
  candidateTopicMastery?: Record<string, Record<string, TopicMasteryRecord>>;
  candidateLearningPosition?: Record<string, LearningPosition>;
  customTargetRoles?: Record<string, CustomTargetRoleConfig>;
  attempts: StudentArenaAttempt[];
}

const STORAGE_PATH = path.join(process.cwd(), "data", "ai-data-store.json");
const CANDIDATE_ROLES = new Map<string, TargetRoleSlug>();
const CANDIDATE_TRACKS = new Map<string, AiDataTrackSlug>();
const CANDIDATE_ONBOARDING = new Map<string, CandidateOnboardingProfile>();
const CANDIDATE_BASELINES = new Map<string, BaselineAssessmentResult>();
const CANDIDATE_LANGUAGES = new Map<string, "english" | "hinglish">();
const CANDIDATE_TOPIC_STAGES = new Map<string, Map<string, number>>();
const CANDIDATE_TOPIC_MASTERY = new Map<string, Map<string, TopicMasteryRecord>>();
const CANDIDATE_LEARNING_POSITION = new Map<string, LearningPosition>();
const CUSTOM_TARGET_ROLES = new Map<string, CustomTargetRoleConfig>();
const ATTEMPTS_LIST: StudentArenaAttempt[] = [];
const HYDRATED_FROM_SUPABASE = new Set<string>();
let isLoaded = false;

function ensureDataDir(): void {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadStore(): void {
  if (isLoaded) return;
  try {
    ensureDataDir();
    if (fs.existsSync(STORAGE_PATH)) {
      const raw = fs.readFileSync(STORAGE_PATH, "utf-8");
      const data: StoreSchema = JSON.parse(raw);
      if (data.candidateRoles) {
        for (const [k, v] of Object.entries(data.candidateRoles)) {
          CANDIDATE_ROLES.set(k, v);
        }
      }
      if (data.candidateActiveTracks) {
        for (const [k, v] of Object.entries(data.candidateActiveTracks)) {
          CANDIDATE_TRACKS.set(k, v);
        }
      }
      if (data.candidateOnboarding) {
        for (const [k, v] of Object.entries(data.candidateOnboarding)) {
          CANDIDATE_ONBOARDING.set(k, v);
        }
      }
      if (data.candidateBaselines) {
        for (const [k, v] of Object.entries(data.candidateBaselines)) {
          CANDIDATE_BASELINES.set(k, v);
        }
      }
      if (data.candidateLanguages) {
        for (const [k, v] of Object.entries(data.candidateLanguages)) {
          CANDIDATE_LANGUAGES.set(k, v);
        }
      }
      if (data.candidateTopicStages) {
        for (const [cid, stagesObj] of Object.entries(data.candidateTopicStages)) {
          const m = new Map<string, number>();
          for (const [tid, st] of Object.entries(stagesObj || {})) {
            m.set(tid, Number(st) || 1);
          }
          CANDIDATE_TOPIC_STAGES.set(cid, m);
        }
      }
      if (data.candidateTopicMastery) {
        for (const [cid, mapObj] of Object.entries(data.candidateTopicMastery)) {
          const m = new Map<string, TopicMasteryRecord>();
          for (const [tid, rec] of Object.entries(mapObj || {})) {
            if (rec) m.set(tid, rec);
          }
          CANDIDATE_TOPIC_MASTERY.set(cid, m);
        }
      }
      if (data.candidateLearningPosition) {
        for (const [k, v] of Object.entries(data.candidateLearningPosition)) {
          CANDIDATE_LEARNING_POSITION.set(k, v);
        }
      }
      if (data.customTargetRoles) {
        for (const [k, v] of Object.entries(data.customTargetRoles)) {
          CUSTOM_TARGET_ROLES.set(k, v);
        }
      }
      if (Array.isArray(data.attempts)) {
        ATTEMPTS_LIST.length = 0;
        ATTEMPTS_LIST.push(...data.attempts);
      }
    }
  } catch (err: any) {
    console.warn("[ai-data-store] Notice reading store file:", err.message);
  } finally {
    isLoaded = true;
  }
}

function persistStore(): void {
  try {
    ensureDataDir();
    const candidateTopicStages: Record<string, Record<string, number>> = {};
    for (const [cid, m] of CANDIDATE_TOPIC_STAGES.entries()) {
      candidateTopicStages[cid] = Object.fromEntries(m.entries());
    }
    const candidateTopicMastery: Record<string, Record<string, TopicMasteryRecord>> = {};
    for (const [cid, m] of CANDIDATE_TOPIC_MASTERY.entries()) {
      candidateTopicMastery[cid] = Object.fromEntries(m.entries());
    }
    const data: StoreSchema = {
      candidateRoles: Object.fromEntries(CANDIDATE_ROLES.entries()),
      candidateActiveTracks: Object.fromEntries(CANDIDATE_TRACKS.entries()),
      candidateOnboarding: Object.fromEntries(CANDIDATE_ONBOARDING.entries()),
      candidateBaselines: Object.fromEntries(CANDIDATE_BASELINES.entries()),
      candidateLanguages: Object.fromEntries(CANDIDATE_LANGUAGES.entries()),
      candidateTopicStages,
      candidateTopicMastery,
      candidateLearningPosition: Object.fromEntries(CANDIDATE_LEARNING_POSITION.entries()),
      customTargetRoles: Object.fromEntries(CUSTOM_TARGET_ROLES.entries()),
      attempts: ATTEMPTS_LIST
    };
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err: any) {
    console.warn("[ai-data-store] Notice persisting store file:", err.message);
  }
}

export function getCandidateRole(candidateId: string): TargetRoleSlug {
  loadStore();
  return CANDIDATE_ROLES.get(candidateId) || "ai_engineer";
}

export function setCandidateRole(candidateId: string, role: TargetRoleSlug): void {
  loadStore();
  CANDIDATE_ROLES.set(candidateId, role);
  persistStore();
}

export function getCandidateActiveTrack(candidateId: string): AiDataTrackSlug {
  loadStore();
  const explicit = CANDIDATE_TRACKS.get(candidateId);
  if (explicit) return explicit;
  const role = getCandidateRole(candidateId);
  return getTargetRoleBySlug(role).primaryTrack;
}

export function setCandidateActiveTrack(candidateId: string, track: AiDataTrackSlug): void {
  loadStore();
  CANDIDATE_TRACKS.set(candidateId, track);
  persistStore();
}

export function getCandidateOnboarding(candidateId: string): CandidateOnboardingProfile | null {
  loadStore();
  return CANDIDATE_ONBOARDING.get(candidateId) || null;
}

export function saveCandidateOnboarding(
  candidateId: string,
  profile: Partial<CandidateOnboardingProfile>
): CandidateOnboardingProfile {
  loadStore();
  const existing = CANDIDATE_ONBOARDING.get(candidateId) || {
    candidateId,
    primaryRole: "ai_engineer",
    secondaryRoles: [],
    startingLevel: "beginner",
    weeklyHours: 10,
    languagePreference: "english",
    learningStyle: "hands_on",
    onboardingCompleted: false
  };

  const updated: CandidateOnboardingProfile = {
    ...existing,
    ...profile,
    candidateId,
    onboardingCompleted: true,
    completedAt: new Date().toISOString()
  };

  CANDIDATE_ONBOARDING.set(candidateId, updated);
  if (updated.primaryRole) {
    CANDIDATE_ROLES.set(candidateId, updated.primaryRole);
    const primaryTrack = getTargetRoleBySlug(updated.primaryRole).primaryTrack;
    CANDIDATE_TRACKS.set(candidateId, primaryTrack);
  }
  persistStore();
  return updated;
}

export function getCandidateBaseline(candidateId: string): BaselineAssessmentResult | null {
  loadStore();
  return CANDIDATE_BASELINES.get(candidateId) || null;
}

export function saveCandidateBaseline(
  candidateId: string,
  result: BaselineAssessmentResult
): void {
  loadStore();
  CANDIDATE_BASELINES.set(candidateId, result);
  persistStore();
}

export function getCandidateAttempts(candidateId: string): StudentArenaAttempt[] {
  loadStore();
  return ATTEMPTS_LIST.filter(a => a.candidateId === candidateId);
}

export function getCandidateRoadmap(candidateId: string): PersonalizedRoadmap {
  loadStore();
  const role = getCandidateRole(candidateId);
  const attempts = getCandidateAttempts(candidateId);
  const completedLessonSlugs = attempts.filter(a => a.passed).map(a => a.lessonSlug);
  const baseline = getCandidateBaseline(candidateId);
  const onboarding = getCandidateOnboarding(candidateId);

  return generatePersonalizedRoadmap({
    candidateId,
    targetRole: role,
    completedLessonSlugs,
    baselineAssessment: baseline,
    weeklyHoursCommitment: onboarding?.weeklyHours || 10
  });
}

export async function recordStudentAttempt(input: {
  candidateId: string;
  trackSlug: AiDataTrackSlug;
  lessonSlug: string;
  exerciseType: ExerciseType;
  score: number;
  passed: boolean;
  assisted: boolean;
  dimensions?: Record<string, number>;
  executionReport?: any;
}): Promise<{ attempt: StudentArenaAttempt; dnaSync: any }> {
  loadStore();

  const attempt: StudentArenaAttempt = {
    id: generateSecureId("att_aidata", 10),
    candidateId: input.candidateId,
    trackSlug: input.trackSlug,
    lessonSlug: input.lessonSlug,
    exerciseType: input.exerciseType,
    score: input.score,
    passed: input.passed,
    assisted: input.assisted,
    dimensions: input.dimensions,
    executionReport: input.executionReport,
    completedAt: new Date().toISOString()
  };

  ATTEMPTS_LIST.unshift(attempt);
  persistStore();

  // Multi-instance dual write to Supabase when available
  try {
    const supabaseReady = await isSupabaseAvailable();
    if (supabaseReady) {
      const adminClient = getAdminClient();
      await adminClient.from("student_skill_progress").insert({
        candidate_id: attempt.candidateId,
        domain_slug: "ai_data_intelligence",
        resource_id: attempt.lessonSlug,
        score: attempt.score,
        details: {
          attemptId: attempt.id,
          trackSlug: attempt.trackSlug,
          exerciseType: attempt.exerciseType,
          passed: attempt.passed,
          assisted: attempt.assisted,
          dimensions: attempt.dimensions,
          executionReport: attempt.executionReport,
        },
        completed_at: attempt.completedAt,
      });
    }
  } catch (err: any) {
    console.warn("[ai-data-store] Supabase dual-write skipped or notice:", err?.message || err);
  }

  // Sync to Student DNA asynchronously
  const dnaSync = await syncArenaAttemptToDNA(attempt);

  return { attempt, dnaSync };
}

export async function getArenaSummary(candidateId: string): Promise<AiDataArenaSummary & {
  onboarding: CandidateOnboardingProfile | null;
  baseline: BaselineAssessmentResult | null;
  roadmap: PersonalizedRoadmap;
}> {
  loadStore();
  const selectedRole = getCandidateRole(candidateId);
  const activeTrackSlug = getCandidateActiveTrack(candidateId);
  const attempts = getCandidateAttempts(candidateId);
  const onboarding = getCandidateOnboarding(candidateId);
  const baseline = getCandidateBaseline(candidateId);
  const roadmap = getCandidateRoadmap(candidateId);

  const completedSet = new Set<string>();
  let totalScoreSum = 0;
  let verifiedCount = 0;

  for (const a of attempts) {
    if (a.passed) {
      completedSet.add(a.lessonSlug);
      totalScoreSum += a.score;
      if (!a.assisted && a.score >= 70) {
        verifiedCount++;
      }
    }
  }

  const allLessons = getAllLessons();
  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = completedSet.size;
  const overallScoreAverage = completedLessonsCount > 0 ? Math.round(totalScoreSum / completedLessonsCount) : 0;

  // Retrieve actual Student DNA to compute transparent skill gaps
  let dnaSkillGaps: AiDataArenaSummary["dnaSkillGaps"] = [];
  try {
    const roleProfile = getTargetRoleBySlug(selectedRole);
    const requiredSkills = roleProfile.requiredSkills;
    const fullDNA = await getStudentDNAFull(candidateId);
    const existingSkillsMap = new Map<string, number>();

    if (fullDNA?.skills) {
      for (const s of fullDNA.skills) {
        existingSkillsMap.set(s.skillId, s.demonstratedLevel || s.estimatedLevel || 0);
      }
    }

    dnaSkillGaps = requiredSkills.map(skId => {
      const currentLevel = existingSkillsMap.get(skId) || 0;
      const targetLevel = 3; // Intermediate standard for hireable competence
      return {
        skillId: skId,
        skillName: skId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        currentLevel,
        targetLevel,
        gapStatus: currentLevel >= targetLevel ? "ALIGNED" : currentLevel === 0 ? "CRITICAL" : "MODERATE"
      };
    });
  } catch (err) {
    dnaSkillGaps = [
      { skillId: "prompt_engineering_structured_outputs", skillName: "Structured Outputs", currentLevel: 1, targetLevel: 3, gapStatus: "MODERATE" },
      { skillId: "rag_architecture_and_retrieval", skillName: "RAG Architecture", currentLevel: 0, targetLevel: 3, gapStatus: "CRITICAL" },
      { skillId: "ai_agents_and_tool_calling", skillName: "AI Agents & Tools", currentLevel: 0, targetLevel: 3, gapStatus: "CRITICAL" }
    ];
  }

  return {
    candidateId,
    selectedRole,
    completedLessonsCount,
    totalLessonsCount,
    overallScoreAverage,
    verifiedEvidenceCount: verifiedCount,
    activeTrackSlug,
    recentAttempts: attempts.slice(0, 5),
    dnaSkillGaps,
    onboarding,
    baseline,
    roadmap
  };
}

export function setCandidateLanguagePreference(candidateId: string, lang: "english" | "hinglish"): void {
  loadStore();
  CANDIDATE_LANGUAGES.set(candidateId, lang);
  persistStore();
}

export function getCandidateLanguagePreference(candidateId: string): "english" | "hinglish" {
  loadStore();
  const explicit = CANDIDATE_LANGUAGES.get(candidateId);
  if (explicit) return explicit;
  const onboarding = getCandidateOnboarding(candidateId);
  if (onboarding?.languagePreference) return onboarding.languagePreference;
  return "english";
}

export function saveTopicStageProgress(candidateId: string, topicId: string, stageNumber: number): number {
  loadStore();
  let candidateMap = CANDIDATE_TOPIC_STAGES.get(candidateId);
  if (!candidateMap) {
    candidateMap = new Map<string, number>();
    CANDIDATE_TOPIC_STAGES.set(candidateId, candidateMap);
  }
  const currentMax = candidateMap.get(topicId) || 1;
  const newMax = Math.max(currentMax, stageNumber);
  candidateMap.set(topicId, newMax);
  persistStore();
  return newMax;
}

export function getCandidateTopicProgress(candidateId: string, topicId: string): number {
  loadStore();
  const candidateMap = CANDIDATE_TOPIC_STAGES.get(candidateId);
  return candidateMap?.get(topicId) || 1;
}

// ── PHASE 2: GRANULAR MASTERY STATE, POSITION & SUPABASE HYDRATION ───────────

export function getTopicMasteryMap(candidateId: string): Record<string, TopicMasteryRecord> {
  loadStore();
  const map = CANDIDATE_TOPIC_MASTERY.get(candidateId);
  if (!map) return {};
  return Object.fromEntries(map.entries());
}

export function getTopicMasteryRecord(candidateId: string, topicId: string): TopicMasteryRecord {
  loadStore();
  const resolved = TOPIC_ID_ALIASES[topicId] || topicId;
  let map = CANDIDATE_TOPIC_MASTERY.get(candidateId);
  if (!map) {
    map = new Map<string, TopicMasteryRecord>();
    CANDIDATE_TOPIC_MASTERY.set(candidateId, map);
  }
  return (
    map.get(resolved) || {
      topicId: resolved,
      status: "not_started",
      conceptStepsCompleted: [],
      codingPassed: false,
      comprehensionPassed: false,
      labPassed: false,
      assessmentScore: null,
      assessmentPassed: false,
      explanationPassed: false,
      weakConcepts: [],
      remediationRequired: false,
      attemptsCount: 0,
      exemptedByEvidence: false,
      lastUpdatedAt: new Date().toISOString(),
    }
  );
}

export function updateTopicMasteryRecord(
  candidateId: string,
  topicId: string,
  updater: (prev: TopicMasteryRecord) => Partial<TopicMasteryRecord>
): TopicMasteryRecord {
  loadStore();
  const resolved = TOPIC_ID_ALIASES[topicId] || topicId;
  let map = CANDIDATE_TOPIC_MASTERY.get(candidateId);
  if (!map) {
    map = new Map<string, TopicMasteryRecord>();
    CANDIDATE_TOPIC_MASTERY.set(candidateId, map);
  }
  const current = getTopicMasteryRecord(candidateId, resolved);
  const patch = updater(current);
  const merged: TopicMasteryRecord = {
    ...current,
    ...patch,
    topicId: resolved,
    lastUpdatedAt: new Date().toISOString(),
  };

  // Compute rigorous evidence-based status progression (never from mere click!)
  const hasAllGates =
    merged.codingPassed &&
    merged.comprehensionPassed &&
    merged.labPassed &&
    merged.assessmentPassed;

  if (hasAllGates && merged.explanationPassed) {
    merged.status = "mastered_verified";
    merged.verifiedAt = merged.verifiedAt || new Date().toISOString();
    merged.remediationRequired = false;
  } else if (merged.codingPassed && merged.labPassed && merged.assessmentPassed) {
    merged.status = "demonstrated";
    merged.remediationRequired = false;
  } else if (merged.assessmentPassed) {
    merged.status = "assessment_passed";
    merged.remediationRequired = false;
  } else if (merged.codingPassed || merged.comprehensionPassed || merged.labPassed) {
    merged.status = "practiced";
  } else if (merged.conceptStepsCompleted.length > 0 || merged.status === "learning") {
    merged.status = "learning";
  }

  map.set(resolved, merged);
  persistStore();

  // Persist topic mastery snapshot non-blockingly to Supabase when available
  void (async () => {
    try {
      const available = await isSupabaseAvailable();
      if (!available) return;
      const adminClient = getAdminClient();
      await adminClient.from("student_skill_progress").insert({
        candidate_id: candidateId,
        domain_slug: "ai_data_topic_mastery",
        resource_id: resolved,
        score: merged.assessmentScore ?? (merged.status === "mastered_verified" ? 100 : 50),
        details: merged,
        completed_at: merged.lastUpdatedAt,
      });
    } catch {}
  })();

  return merged;
}

export function saveLearningPosition(candidateId: string, pos: Partial<LearningPosition>): LearningPosition {
  loadStore();
  const existing = CANDIDATE_LEARNING_POSITION.get(candidateId);
  const loc = pos.topicId ? getTopicLocation(pos.topicId) : null;
  const next: LearningPosition = {
    subjectId: pos.subjectId || loc?.subject.id || existing?.subjectId || "subj_python",
    moduleId: pos.moduleId || loc?.module.id || existing?.moduleId || "mod_py_foundations",
    topicId: loc?.topic.id || pos.topicId || existing?.topicId || "py-01-intro-interpreter",
    subtopicId: pos.subtopicId || existing?.subtopicId || "py-01-sub-1",
    phase: pos.phase || existing?.phase || "understand",
    updatedAt: new Date().toISOString(),
  };
  CANDIDATE_LEARNING_POSITION.set(candidateId, next);
  persistStore();
  return next;
}

export function getLearningPosition(candidateId: string): LearningPosition | null {
  loadStore();
  return CANDIDATE_LEARNING_POSITION.get(candidateId) || null;
}

export function setCustomTargetRole(candidateId: string, config: CustomTargetRoleConfig): void {
  loadStore();
  CUSTOM_TARGET_ROLES.set(candidateId, config);
  persistStore();
}

export function getCustomTargetRole(candidateId: string): CustomTargetRoleConfig | null {
  loadStore();
  return CUSTOM_TARGET_ROLES.get(candidateId) || null;
}

export async function hydrateCandidateFromSupabase(candidateId: string): Promise<void> {
  loadStore();
  if (HYDRATED_FROM_SUPABASE.has(candidateId)) return;
  try {
    const ready = await isSupabaseAvailable();
    if (!ready) return;
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("student_skill_progress")
      .select("domain_slug, resource_id, score, details, completed_at")
      .eq("candidate_id", candidateId)
      .in("domain_slug", ["ai_data_topic_mastery", "ai_data_intelligence"])
      .order("completed_at", { ascending: false })
      .limit(250);

    if (error || !Array.isArray(data)) return;
    HYDRATED_FROM_SUPABASE.add(candidateId);

    let map = CANDIDATE_TOPIC_MASTERY.get(candidateId);
    if (!map) {
      map = new Map<string, TopicMasteryRecord>();
      CANDIDATE_TOPIC_MASTERY.set(candidateId, map);
    }

    for (const row of data) {
      if (row.domain_slug === "ai_data_topic_mastery" && row.details?.topicId) {
        const tid = row.details.topicId;
        if (!map.has(tid)) {
          map.set(tid, row.details as TopicMasteryRecord);
        }
      }
    }
    persistStore();
  } catch {}
}

export async function getFullCanonicalArenaContext(candidateId: string): Promise<{
  summary: AiDataArenaSummary & {
    onboarding: CandidateOnboardingProfile | null;
    baseline: BaselineAssessmentResult | null;
    roadmap: PersonalizedRoadmap;
    completedLessons: string[];
    topicMasteryMap: Record<string, TopicMasteryRecord>;
    learningPosition: LearningPosition | null;
    canonicalRoadmap: CanonicalArenaRoadmap;
  };
}> {
  await hydrateCandidateFromSupabase(candidateId);
  const summary = await getArenaSummary(candidateId);
  const selectedRole = summary.selectedRole;
  const masteryMap = getTopicMasteryMap(candidateId);
  const learningPosition = getLearningPosition(candidateId);
  const customRole = getCustomTargetRole(candidateId);

  let dnaVerifiedSkills: Array<{ skillId: string; verificationState: string; level?: number }> = [];
  try {
    const fullDna = await getStudentDNAFull(candidateId);
    if (fullDna?.skills) {
      dnaVerifiedSkills = fullDna.skills.map((s) => ({
        skillId: s.skillId,
        verificationState: s.verificationState,
        level: s.demonstratedLevel || s.estimatedLevel || 0,
      }));
    }
  } catch {}

  const canonicalRoadmap = buildCanonicalArenaRoadmap({
    candidateId,
    targetRole: selectedRole,
    customRoleConfig: customRole,
    masteryMap,
    baselineAssessment: summary.baseline,
    dnaVerifiedSkills,
    learningPosition,
  });

  const completedLessons = Object.values(masteryMap)
    .filter(
      (r) =>
        r.status === "assessment_passed" ||
        r.status === "demonstrated" ||
        r.status === "mastered_verified"
    )
    .map((r) => r.topicId);

  return {
    summary: {
      ...summary,
      completedLessons,
      topicMasteryMap: masteryMap,
      learningPosition,
      canonicalRoadmap,
    },
  };
}
