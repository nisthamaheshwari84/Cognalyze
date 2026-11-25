/**
 * COGNALYZE GD ARENA — SUPABASE POSTGRESQL CLOUD PERSISTENCE ADAPTER
 *
 * Bridges gd-session-store, friends-gd-service, disciplinary-system,
 * and evaluation records directly to Supabase PostgreSQL so multi-lambda
 * Vercel deployments share canonical authoritative state without /tmp split-brain.
 *
 * Respects isSupabaseAvailable() for offline / local unit test execution.
 */

import { isSupabaseAvailable, supabaseAdmin } from "@/lib/supabase";
import { GDSessionData, GDFriendsRoom, GDComprehensiveReport } from "./types";
import type { DisciplinaryRecord } from "./disciplinary-system";

function mapRowToGDSession(row: any): GDSessionData | null {
  if (!row) return null;
  return {
    sessionId: row.id,
    userId: row.user_id,
    topicId: row.topic_id,
    topicTitle: row.topic_title,
    format: row.format,
    difficulty: row.difficulty,
    targetRole: row.target_role || "Software Engineer",
    lifecycleState: row.lifecycle_state,
    currentStage: row.current_stage,
    stageTimeRemainingSeconds: row.total_duration_seconds ?? 900,
    totalDurationSeconds: row.total_duration_seconds ?? 900,
    isFriendsRoom: Boolean(row.is_friends_room),
    friendsRoomCode: row.friends_room_code || undefined,
    participants: Array.isArray(row.participants) ? row.participants : [],
    activeSpeakerId: null,
    transcripts: Array.isArray(row.transcripts) ? row.transcripts : [],
    moderationIncidents: Array.isArray(row.moderation_incidents) ? row.moderation_incidents : [],
    studentWarningCount: Number(row.student_warning_count || 0),
    evaluationReport: row.evaluation_report || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || undefined
  };
}

function mapRowToFriendsRoom(row: any): GDFriendsRoom | null {
  if (!row) return null;
  const participants = Array.isArray(row.participants) ? row.participants : [];
  const hostEntry = participants.find((p: any) => p.isHost) || participants[0];
  return {
    roomId: row.id,
    roomCode: row.room_code,
    hostUserId: row.host_user_id,
    hostName: hostEntry?.fullName || "Room Host",
    topicTitle: row.topic_title,
    format: row.format,
    difficulty: row.difficulty,
    durationMinutes: Number(row.duration_minutes || 15),
    status: row.status,
    maxParticipants: Number(row.max_participants || 6),
    participants,
    activeSessionId: row.active_session_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function upsertGDSessionCloud(session: GDSessionData): Promise<void> {
  try {
    if (!(await isSupabaseAvailable())) return;
    const { error } = await supabaseAdmin.from("gd_sessions").upsert(
      {
        id: session.sessionId,
        user_id: session.userId,
        topic_id: session.topicId,
        topic_title: session.topicTitle,
        format: session.format,
        difficulty: session.difficulty,
        lifecycle_state: session.lifecycleState,
        current_stage: session.currentStage,
        total_duration_seconds: session.totalDurationSeconds,
        is_friends_room: session.isFriendsRoom,
        friends_room_code: session.friendsRoomCode || null,
        participants: session.participants,
        transcripts: session.transcripts,
        moderation_incidents: session.moderationIncidents,
        student_warning_count: session.studentWarningCount,
        evaluation_report: session.evaluationReport || null,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        completed_at: session.completedAt || null
      },
      { onConflict: "id" }
    );
    if (error) {
      console.warn("[gd-cloud-db] upsertGDSessionCloud error:", error.message);
    }
  } catch (err: any) {
    console.warn("[gd-cloud-db] upsertGDSessionCloud exception:", err?.message || err);
  }
}

export async function fetchGDSessionCloud(sessionId: string): Promise<GDSessionData | null> {
  try {
    if (!(await isSupabaseAvailable())) return null;
    const { data, error } = await supabaseAdmin
      .from("gd_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (error || !data) return null;
    return mapRowToGDSession(data);
  } catch {
    return null;
  }
}

export async function fetchUserGDSessionsCloud(userId: string): Promise<GDSessionData[]> {
  try {
    if (!(await isSupabaseAvailable())) return [];
    const { data, error } = await supabaseAdmin
      .from("gd_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !Array.isArray(data)) return [];
    return data.map(mapRowToGDSession).filter((s): s is GDSessionData => Boolean(s));
  } catch {
    return [];
  }
}

export async function upsertGDFriendsRoomCloud(room: GDFriendsRoom): Promise<void> {
  try {
    if (!(await isSupabaseAvailable())) return;
    const { error } = await supabaseAdmin.from("gd_friends_rooms").upsert(
      {
        id: room.roomId,
        room_code: room.roomCode,
        host_user_id: room.hostUserId,
        topic_title: room.topicTitle,
        format: room.format,
        difficulty: room.difficulty,
        duration_minutes: room.durationMinutes,
        status: room.status,
        max_participants: room.maxParticipants,
        participants: room.participants,
        active_session_id: room.activeSessionId || null,
        created_at: room.createdAt,
        updated_at: room.updatedAt
      },
      { onConflict: "id" }
    );
    if (error) {
      console.warn("[gd-cloud-db] upsertGDFriendsRoomCloud error:", error.message);
    }
  } catch (err: any) {
    console.warn("[gd-cloud-db] upsertGDFriendsRoomCloud exception:", err?.message || err);
  }
}

export async function fetchFriendsRoomCloud(roomCodeOrId: string): Promise<GDFriendsRoom | null> {
  try {
    if (!(await isSupabaseAvailable())) return null;
    const trimmed = roomCodeOrId.trim();
    const { data: byId } = await supabaseAdmin
      .from("gd_friends_rooms")
      .select("*")
      .eq("id", trimmed)
      .maybeSingle();
    if (byId) return mapRowToFriendsRoom(byId);

    const { data: byCode } = await supabaseAdmin
      .from("gd_friends_rooms")
      .select("*")
      .eq("room_code", trimmed.toUpperCase())
      .maybeSingle();
    if (byCode) return mapRowToFriendsRoom(byCode);
    return null;
  } catch {
    return null;
  }
}

export async function insertDisciplinaryRecordCloud(record: DisciplinaryRecord): Promise<void> {
  try {
    if (!(await isSupabaseAvailable())) return;
    const { error } = await supabaseAdmin.from("gd_disciplinary_records").upsert(
      {
        id: record.id,
        user_id: record.userId,
        session_id: record.sessionId,
        is_friends_room: record.isFriendsRoom,
        room_code: record.roomCode || null,
        warning_number: record.warningNumber,
        severity: record.severity,
        violation_category: record.violationCategory,
        evidence_quote: record.evidenceExcerpt,
        context_summary: record.contextSummary,
        moderator_utterance: record.moderatorUtterance,
        suspension_duration_hours: record.suspensionDurationHours || null,
        suspension_started_at: record.suspensionStartedAt || null,
        suspension_expires_at: record.suspensionExpiresAt || null,
        appeal_token: record.appealToken,
        appeal_status: record.appealStatus,
        appeal_notes: record.appealNotes || null,
        created_at: record.createdAt
      },
      { onConflict: "id" }
    );
    if (error) {
      console.warn("[gd-cloud-db] insertDisciplinaryRecordCloud error:", error.message);
    }
  } catch (err: any) {
    console.warn("[gd-cloud-db] insertDisciplinaryRecordCloud exception:", err?.message || err);
  }
}

export async function fetchUserDisciplinaryRecordsCloud(userId: string): Promise<DisciplinaryRecord[]> {
  try {
    if (!(await isSupabaseAvailable())) return [];
    const { data, error } = await supabaseAdmin
      .from("gd_disciplinary_records")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !Array.isArray(data)) return [];
    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userEmail: "student@cognalyze.internal",
      userName: "Candidate",
      sessionId: r.session_id,
      isFriendsRoom: Boolean(r.is_friends_room),
      roomCode: r.room_code || undefined,
      warningNumber: r.warning_number,
      severity: r.severity,
      violationCategory: r.violation_category,
      evidenceExcerpt: r.evidence_quote,
      contextSummary: r.context_summary,
      timestamp: new Date(r.created_at).getTime(),
      moderatorUtterance: r.moderator_utterance,
      suspensionDurationHours: r.suspension_duration_hours || undefined,
      suspensionStartedAt: r.suspension_started_at || undefined,
      suspensionExpiresAt: r.suspension_expires_at || undefined,
      appealToken: r.appeal_token,
      appealStatus: r.appeal_status,
      appealNotes: r.appeal_notes || undefined,
      createdAt: r.created_at
    }));
  } catch {
    return [];
  }
}

export async function updateDisciplinaryAppealCloud(params: {
  appealToken: string;
  userId: string;
  explanation: string;
}): Promise<boolean> {
  try {
    if (!(await isSupabaseAvailable())) return false;
    const { data, error } = await supabaseAdmin
      .from("gd_disciplinary_records")
      .update({
        appeal_status: "PENDING_REVIEW",
        appeal_notes: params.explanation
      })
      .eq("appeal_token", params.appealToken)
      .eq("user_id", params.userId)
      .select("id");
    if (error) return false;
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export async function insertGDEvaluationCloud(params: {
  session: GDSessionData;
  userId: string;
  report: GDComprehensiveReport;
  dnaSynced?: boolean;
}): Promise<void> {
  try {
    if (!(await isSupabaseAvailable())) return;
    const evalId = `gdeval_${params.session.sessionId}_${params.userId}`;
    const { error } = await supabaseAdmin.from("gd_evaluations").upsert(
      {
        id: evalId,
        session_id: params.session.sessionId,
        user_id: params.userId,
        topic_title: params.report.topicTitle,
        format: params.report.format,
        difficulty: params.report.difficulty,
        overall_score: params.report.overallScore,
        hiring_verdict: params.report.hiringVerdict,
        speaking_turn_count: params.report.speakingTimeAnalysis.studentTurnCount,
        dimension_scores: params.report.dimensions,
        full_report: params.report,
        dna_synced: Boolean(params.dnaSynced),
        created_at: params.report.createdAt
      },
      { onConflict: "session_id,user_id" }
    );
    if (error) {
      console.warn("[gd-cloud-db] insertGDEvaluationCloud error:", error.message);
    }
  } catch (err: any) {
    console.warn("[gd-cloud-db] insertGDEvaluationCloud exception:", err?.message || err);
  }
}

export async function fetchUserGDEvaluationsCloud(userId: string): Promise<any[]> {
  try {
    if (!(await isSupabaseAvailable())) return [];
    const { data, error } = await supabaseAdmin
      .from("gd_evaluations")
      .select(
        "id, session_id, topic_title, format, difficulty, overall_score, hiring_verdict, speaking_turn_count, dimension_scores, full_report, dna_synced, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}
