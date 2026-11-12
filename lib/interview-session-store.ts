import { supabase, supabaseAdmin } from "./supabase";
import { InterviewSession, SaveSessionInput } from "./interview-session-types";

export type { InterviewSession, SaveSessionInput };

const STORAGE_KEY = "cognalyze_interview_sessions";

function isServerlessEnvironment(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NEXT_RUNTIME === "edge");
}

function getDataFilePath(): string {
  if (typeof window === "undefined") {
    const path = require("path");
    if (isServerlessEnvironment()) {
      return path.join("/tmp", "cognalyze-interview-sessions.json");
    }
    return path.join(process.cwd(), "data", "interview-sessions.json");
  }
  return "";
}

function getActiveStateDirPath(): string {
  const path = require("path");
  if (isServerlessEnvironment()) {
    return path.join("/tmp", "cognalyze-active-sessions");
  }
  return path.join(process.cwd(), "data", "active-sessions");
}

function getActiveStateFilePath(sessionId: string): string {
  const path = require("path");
  const cleanId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(getActiveStateDirPath(), `${cleanId}.json`);
}

let inMemorySessions: InterviewSession[] = [];
let isLoaded = false;
const activeLiveSessions: Map<string, any> = new Map();
const completedSessionIds = new Set<string>();
const activeTurnLocks = new Set<string>();

/**
 * Concurrency guard: acquire lock for in-flight turn submission
 */
export function acquireTurnLock(sessionId: string): boolean {
  if (activeTurnLocks.has(sessionId)) return false;
  activeTurnLocks.add(sessionId);
  return true;
}

export function releaseTurnLock(sessionId: string): void {
  activeTurnLocks.delete(sessionId);
}

export function saveActiveSessionState(sessionId: string, state: any): void {
  if (!sessionId) return;

  // Immutability Check (P1 Fix REL-SESS-01):
  // Ensure a completed session cannot be mutated after its final report is authoritative.
  if (isSessionCompleted(sessionId) && state?.lifecycleState && state.lifecycleState !== "COMPLETED") {
    throw new Error(`[interview-session-store] Immutability violation: completed session ${sessionId} cannot be mutated.`);
  }

  const existing = activeLiveSessions.get(sessionId);
  if (existing?.candidateId && state?.candidateId && existing.candidateId !== state.candidateId) {
    throw new Error(`[interview-session-store] Candidate isolation violation: session ${sessionId} belongs to candidate ${existing.candidateId}`);
  }

  // Monotonic Conduct State Protection:
  // Escalated conduct states (FIRST_WARNING, FINAL_WARNING, TERMINATED) cannot be downgraded by a stale snapshot
  const CONDUCT_ORDER: Record<string, number> = {
    NORMAL: 0,
    FIRST_WARNING: 1,
    FINAL_WARNING: 2,
    TERMINATED: 3,
  };
  const existingConductLevel = CONDUCT_ORDER[existing?.conductState || "NORMAL"] || 0;
  const incomingConductLevel = CONDUCT_ORDER[state?.conductState || "NORMAL"] || 0;
  if (existingConductLevel > incomingConductLevel) {
    state.conductState = existing.conductState;
    if (existing.conductIncidents?.length && (!state.conductIncidents || state.conductIncidents.length < existing.conductIncidents.length)) {
      state.conductIncidents = existing.conductIncidents;
    }
  }

  // Monotonic State Versioning (Guard against LWW stale snapshot overwrites):
  const existingVersion = Number(existing?.version || existing?.turns?.length || 0);
  const incomingVersion = Number(state?.version || state?.turns?.length || 0);
  if (existing && existingVersion > incomingVersion && !state?._forceSnapshot) {
    // Stale snapshot rejected: do not overwrite newer turn state with older snapshot
    return;
  }
  state.version = Math.max(existingVersion + 1, incomingVersion + 1, (state.turns?.length || 0) + 1);

  // 1. Update In-Memory Map
  activeLiveSessions.set(sessionId, state);

  // 2. Persist to shared durable storage for serverless continuity
  if (typeof window === "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = getActiveStateFilePath(sessionId);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(state), "utf-8");
    } catch (err) {
      // Non-fatal disk write notice
    }

    // 3. Sync to Supabase asynchronously if candidateId is present
    if (state?.candidateId) {
      syncActiveSessionToSupabase(sessionId, state).catch(() => {});
    }
  }
}

export async function saveActiveSessionStateAsync(
  sessionId: string,
  state: any
): Promise<{ localSuccess: boolean; cloudPersisted: boolean }> {
  // Synchronous checks & local write
  saveActiveSessionState(sessionId, state);

  let cloudPersisted = false;
  if (typeof window === "undefined" && state?.candidateId) {
    cloudPersisted = await syncActiveSessionToSupabase(sessionId, state);
  }

  return { localSuccess: true, cloudPersisted };
}

async function syncActiveSessionToSupabase(sessionId: string, state: any): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("interview_sessions").upsert({
      id: sessionId,
      candidate_id: state.candidateId,
      session_type: state.sessionType || "mock_interview",
      target_role: state.targetRole || "Software Engineer",
      status: state.lifecycleState || (state.isCompleted ? "COMPLETED" : "active"),
      topics_covered: state.topicsCovered || [],
      answer_distribution: state.scores || { strong: 0, adequate: 0, shallow: 0, off_topic: 0 },
      overall_score: state.overallScore || 0,
      weak_topics_identified: state.weakTopics || [],
      transcript: state.turns || [],
      report: state.report || null,
      state: state,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });

    if (error) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getActiveSessionState(sessionId: string, candidateId?: string): any | null {
  if (!sessionId) return null;

  // 1. Check in-memory Map
  let state = activeLiveSessions.get(sessionId);

  // 2. Hydrate from shared durable storage if missing from instance memory
  if (!state && typeof window === "undefined") {
    try {
      const fs = require("fs");
      const filePath = getActiveStateFilePath(sessionId);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        state = JSON.parse(raw);
        if (state) {
          activeLiveSessions.set(sessionId, state);
        }
      }
    } catch {}
  }

  if (!state) return null;

  // Multi-tenant isolation: verify candidate ownership
  if (candidateId && state.candidateId && state.candidateId !== candidateId) {
    return null;
  }
  return state;
}

export async function getActiveSessionStateAsync(sessionId: string, candidateId?: string): Promise<any | null> {
  if (!sessionId) return null;

  // 1. Check memory and local disk cache first
  let state = getActiveSessionState(sessionId, candidateId);
  if (state) return state;

  // 2. Query Supabase table interview_sessions for cross-container serverless recovery
  if (typeof window === "undefined") {
    try {
      const { data, error } = await supabaseAdmin
        .from("interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!error && data && data.state) {
        if (candidateId && data.candidate_id && data.candidate_id !== candidateId) {
          return null;
        }
        state = data.state;
        if (state) {
          activeLiveSessions.set(sessionId, state);
          try {
            const fs = require("fs");
            const path = require("path");
            const filePath = getActiveStateFilePath(sessionId);
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(state), "utf-8");
          } catch {}
          return state;
        }
      }
    } catch {}
  }

  return null;
}

export function getActiveSessionForCandidate(candidateId: string): any | null {
  if (!candidateId) return null;
  for (const [sessId, state] of activeLiveSessions.entries()) {
    if (state?.candidateId === candidateId) {
      if (!isSessionCompleted(sessId) && !state.isCompleted && state.lifecycleState !== "COMPLETED") {
        return state;
      }
    }
  }
  return null;
}

export function clearActiveSessionState(sessionId: string): void {
  activeLiveSessions.delete(sessionId);
  activeTurnLocks.delete(sessionId);
  if (typeof window === "undefined") {
    try {
      const fs = require("fs");
      const filePath = getActiveStateFilePath(sessionId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }
}

export function isSessionCompleted(sessionId: string): boolean {
  if (completedSessionIds.has(sessionId)) return true;
  const state = activeLiveSessions.get(sessionId);
  if (state?.isCompleted || state?.lifecycleState === "COMPLETED") return true;
  loadSessionsFromDisk();
  return inMemorySessions.some((s) => s.id === sessionId);
}

export function markSessionCompleted(sessionId: string, report?: any): void {
  completedSessionIds.add(sessionId);
  const state = activeLiveSessions.get(sessionId) || (typeof window === "undefined" ? getActiveSessionState(sessionId) : null);
  if (state) {
    state.isCompleted = true;
    state.lifecycleState = "COMPLETED";
    if (report) {
      state.report = report;
    }
    activeLiveSessions.set(sessionId, state);
    if (typeof window === "undefined") {
      try {
        const fs = require("fs");
        const filePath = getActiveStateFilePath(sessionId);
        fs.writeFileSync(filePath, JSON.stringify(state), "utf-8");
      } catch {}
    }
  }
}

export async function getSessionById(sessionId: string, candidateId?: string): Promise<InterviewSession | null> {
  loadSessionsFromDisk();
  const localList = typeof window !== "undefined" ? getLocalSessions() : inMemorySessions;
  const match = localList.find((s) => s.id === sessionId);
  if (match) {
    if (candidateId && match.candidate_id && match.candidate_id !== candidateId) {
      return null;
    }
    return match;
  }

  try {
    const { data, error } = await supabase.from("interview_sessions").select("*").eq("id", sessionId).single();
    if (!error && data) {
      if (candidateId && data.candidate_id && data.candidate_id !== candidateId) {
        return null;
      }
      return data as InterviewSession;
    }
  } catch {
    // Non-fatal
  }
  return null;
}

function loadSessionsFromDisk(): void {
  if (typeof window === "undefined" && !isLoaded) {
    try {
      const fs = require("fs");
      const filePath = getDataFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        inMemorySessions = JSON.parse(raw);
      }
    } catch {
      inMemorySessions = [];
    }
    isLoaded = true;
  }
}

function persistSessionsToDisk(): void {
  if (typeof window === "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = getDataFilePath();
      if (!filePath) return;
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(inMemorySessions, null, 2), "utf-8");
    } catch (err) {
      console.warn("[interview-session-store] Failed to persist to disk:", err);
    }
  }
}

export async function saveSession(
  sessionData: SaveSessionInput
): Promise<InterviewSession> {
  const session: InterviewSession = {
    id: sessionData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: sessionData.created_at || new Date().toISOString(),
    session_type: sessionData.session_type || "mock_interview",
    experience_mode: sessionData.experience_mode || "fresher",
    topics_covered: sessionData.topics_covered || [],
    answer_distribution: sessionData.answer_distribution || { strong: 0, adequate: 0, shallow: 0, off_topic: 0 },
    security_flags: sessionData.security_flags || { tab_switches: 0, face_violations: 0 },
    weak_topics_identified: sessionData.weak_topics_identified || [],
    ...sessionData,
  };

  // 1. Save to in-memory & disk store
  loadSessionsFromDisk();
  const existingIdx = inMemorySessions.findIndex((s) => s.id === session.id);
  if (existingIdx >= 0) {
    inMemorySessions[existingIdx] = session;
  } else {
    inMemorySessions.unshift(session);
  }
  persistSessionsToDisk();

  // 2. Client-side LocalStorage cache
  if (typeof window !== "undefined") {
    try {
      const existing = getLocalSessions();
      const updated = [session, ...existing.filter((s) => s.id !== session.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn("[interview-session-store] Failed to save to localStorage:", e);
    }
  }

  // 3. Persist directly to Supabase
  try {
    // If candidate_id is a UUID, ensure candidate exists in candidates table
    if (session.candidate_id && session.candidate_id.match(/^[0-9a-fA-F-]{36}$/)) {
      await supabase.from("candidates").upsert({
        id: session.candidate_id,
        clerk_user_id: session.candidate_id,
        name: session.candidate_id
      }, { onConflict: "id" });

      // Save to real Supabase interviews table
      const sessionUuid = session.id.match(/^[0-9a-fA-F-]{36}$/)
        ? session.id
        : undefined;

      await supabase.from("interviews").insert({
        ...(sessionUuid ? { id: sessionUuid } : {}),
        candidate_id: session.candidate_id,
        type: session.session_type,
        scores: session.answer_distribution,
        trust_score: Math.round(session.overall_score),
        verdict: session.overall_score >= 70 ? "STRONG_PASS" : "NEEDS_PRACTICE",
        created_at: session.created_at
      });
    }

    // Also attempt interview_sessions table if migrated
    await supabaseAdmin.from("interview_sessions").upsert([
      {
        id: session.id,
        candidate_id: session.candidate_id,
        session_type: session.session_type,
        experience_mode: session.experience_mode,
        target_role: session.target_role,
        target_company: session.target_company || null,
        opportunity_id: session.opportunity_id || null,
        topics_covered: session.topics_covered,
        answer_distribution: session.answer_distribution,
        security_flags: session.security_flags,
        overall_score: session.overall_score,
        weak_topics_identified: session.weak_topics_identified,
        created_at: session.created_at,
        status: "COMPLETED",
        transcript: session.transcript || [],
        report: session.report || null,
        updated_at: new Date().toISOString()
      },
    ]);
  } catch (e: any) {
    console.warn("[interview-session-store] Supabase persist non-fatal notice:", e.message);
  }

  return session;
}

export function getLocalSessions(): InterviewSession[] {
  if (typeof window === "undefined") {
    loadSessionsFromDisk();
    return inMemorySessions;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getSessionHistory(candidateId?: string): Promise<InterviewSession[]> {
  loadSessionsFromDisk();
  const localList = typeof window !== "undefined" ? getLocalSessions() : inMemorySessions;
  const filteredLocal = candidateId
    ? localList.filter((s) => s.candidate_id === candidateId)
    : localList;

  try {
    let query = supabase
      .from("interview_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (candidateId) {
      query = query.eq("candidate_id", candidateId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const seen = new Set<string>();
      const combined: InterviewSession[] = [];
      for (const item of [...data, ...filteredLocal]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          combined.push(item);
        }
      }
      return combined.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  } catch (e: any) {
    // Handled
  }

  return filteredLocal;
}

export async function getAccumulatedWeakTopics(candidateId?: string): Promise<string[]> {
  if (!candidateId || !candidateId.trim()) return [];
  const sessions = await getSessionHistory(candidateId);
  const topicCounts: Record<string, number> = {};

  for (const s of sessions) {
    for (const t of s.weak_topics_identified || []) {
      const clean = t.trim();
      if (clean) topicCounts[clean] = (topicCounts[clean] || 0) + 1;
    }
  }

  return Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
}

export async function getHistoricalQuestionsForCandidate(candidateId?: string): Promise<string[]> {
  if (!candidateId || !candidateId.trim()) return [];
  const sessions = await getSessionHistory(candidateId);
  const questions: string[] = [];
  const seen = new Set<string>();

  for (const s of sessions) {
    if (Array.isArray(s.transcript)) {
      for (const m of s.transcript) {
        if (m.role === "assistant" && m.content && !m.content.toLowerCase().includes("welcome") && m.content.length > 20) {
          const clean = m.content.trim();
          if (!seen.has(clean)) {
            seen.add(clean);
            questions.push(clean);
          }
        }
      }
    }
    if (s.report?.questionByQuestionAnalysis) {
      for (const q of s.report.questionByQuestionAnalysis) {
        if (q.questionText && q.questionText.length > 20) {
          const clean = q.questionText.trim();
          if (!seen.has(clean)) {
            seen.add(clean);
            questions.push(clean);
          }
        }
      }
    }
  }

  // Also include questions from currently active sessions in memory strictly for this candidate
  for (const [, state] of activeLiveSessions.entries()) {
    if (state?.candidateId === candidateId && Array.isArray(state.questionsAsked)) {
      for (const q of state.questionsAsked) {
        if (q.question && q.question.length > 20 && !seen.has(q.question.trim())) {
          seen.add(q.question.trim());
          questions.push(q.question.trim());
        }
      }
    }
  }

  return questions;
}

export async function getHistoricalAssessedCompetencies(
  candidateId?: string
): Promise<Record<string, { score: number; status: string; turnsCount: number }>> {
  if (!candidateId || !candidateId.trim()) return {};
  const sessions = await getSessionHistory(candidateId);
  const competencies: Record<string, { score: number; status: string; turnsCount: number }> = {};

  for (const s of sessions) {
    if (s.report?.competenciesAssessed && Array.isArray(s.report.competenciesAssessed)) {
      for (const comp of s.report.competenciesAssessed) {
        if (!comp.competency) continue;

        // Criterion 3: Only valid, completed assessments contribute to historical competency conclusions.
        // Pending, failed, skipped, and insufficient-evidence assessments must remain distinguishable.
        const rawStatus = (comp.status || "").toLowerCase().trim();
        if (
          rawStatus === "pending" ||
          rawStatus === "skipped" ||
          rawStatus === "failed" ||
          rawStatus === "insufficient_evidence" ||
          rawStatus === "unassessed"
        ) {
          continue;
        }

        const score = typeof comp.score === "number" && !isNaN(comp.score) ? comp.score : null;
        if (score === null || score < 0) continue;

        const existing = competencies[comp.competency];
        if (!existing || score > existing.score) {
          competencies[comp.competency] = {
            score,
            status:
              rawStatus === "demonstrated" || rawStatus === "partial" || rawStatus === "gap"
                ? rawStatus
                : score >= 70
                ? "demonstrated"
                : score >= 50
                ? "partial"
                : "gap",
            turnsCount: (existing?.turnsCount || 0) + 1,
          };
        }
      }
    }
  }

  return competencies;
}


