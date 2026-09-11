import { supabase } from "./supabase";

export interface InterviewSession {
  id: string;
  candidate_id: string;
  session_type: "mock_interview" | "assessment_arena";
  experience_mode: string;
  target_role: string;
  target_company?: string;
  opportunity_id?: string;
  topics_covered: string[];
  answer_distribution: {
    strong: number;
    adequate: number;
    shallow: number;
    off_topic: number;
  };
  security_flags: {
    tab_switches: number;
    face_violations: number;
  };
  overall_score: number;
  weak_topics_identified: string[];
  created_at: string;
}

const STORAGE_KEY = "cognalyze_interview_sessions";

export async function saveSession(
  sessionData: Omit<InterviewSession, "id" | "created_at"> & { id?: string; created_at?: string }
): Promise<InterviewSession> {
  const session: InterviewSession = {
    id: sessionData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: sessionData.created_at || new Date().toISOString(),
    ...sessionData,
  };

  // 1. Save to LocalStorage (client side fallback/cache)
  if (typeof window !== "undefined") {
    try {
      const existing = getLocalSessions();
      const updated = [session, ...existing.filter((s) => s.id !== session.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn("[interview-session-store] Failed to save to localStorage:", e);
    }
  }

  // 2. Try saving to Supabase
  try {
    const { error } = await supabase.from("interview_sessions").upsert([
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
      },
    ]);
    if (error) {
      console.warn("[interview-session-store] Supabase upsert notice:", error.message);
    }
  } catch (e: any) {
    console.warn("[interview-session-store] Supabase request error:", e.message);
  }

  return session;
}

export function getLocalSessions(): InterviewSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getSessionHistory(candidateId?: string): Promise<InterviewSession[]> {
  const localList = getLocalSessions();

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
      // Merge with local sessions, removing duplicates
      const seen = new Set<string>();
      const combined: InterviewSession[] = [];
      for (const item of [...data, ...localList]) {
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
    console.warn("[interview-session-store] Could not load from Supabase, using local fallback:", e.message);
  }

  if (candidateId) {
    return localList.filter((s) => !s.candidate_id || s.candidate_id === candidateId);
  }
  return localList;
}

export async function getAccumulatedWeakTopics(candidateId?: string): Promise<string[]> {
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
