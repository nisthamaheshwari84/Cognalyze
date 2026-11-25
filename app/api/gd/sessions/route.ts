/**
 * COGNALYZE API ROUTE — STUDENT GD PERFORMANCE & HISTORY CONTROLLER
 *
 * GET /api/gd/sessions
 * Returns ONLY the authenticated student's verified GD sessions,
 * evaluated reports, 8-dimension analytics, Skills Lab summary,
 * conduct standing, and disciplinary history.
 */

import { NextResponse } from "next/server";
import {
  requireAuthenticatedGDStudent,
  GD_NO_STORE_HEADERS
} from "@/lib/gd/api-security";
import { listGDSessionsForUserAsync } from "@/lib/gd/gd-session-store";
import { fetchUserGDEvaluationsCloud } from "@/lib/gd/gd-cloud-db";
import {
  getUserDisciplinaryHistoryAsync,
  isUserSuspendedAsync
} from "@/lib/gd/disciplinary-system";
import { getUserSkillsProgressAsync } from "@/lib/gd/skills-lab-service";
import {
  computeGDPerformanceAnalytics,
  type GDPerformanceSessionRecord
} from "@/lib/gd/performance-analytics";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const guard = await requireAuthenticatedGDStudent(req, { allowWhenSuspended: true });
    if (!guard.ok) return guard.response;
    const { userId } = guard.student;

    const [sessions, cloudEvals, disciplinaryHistory, suspension, skillsProgress] = await Promise.all([
      listGDSessionsForUserAsync(userId),
      fetchUserGDEvaluationsCloud(userId),
      getUserDisciplinaryHistoryAsync(userId),
      isUserSuspendedAsync(userId),
      getUserSkillsProgressAsync(userId)
    ]);

    // Merge completed evaluated sessions with cloud evaluation rows (deduped by sessionId)
    const bySessionId = new Map<string, GDPerformanceSessionRecord>();

    for (const ev of cloudEvals) {
      bySessionId.set(ev.session_id, {
        sessionId: ev.session_id,
        topicTitle: ev.topic_title,
        format: ev.format,
        difficulty: ev.difficulty,
        overallScore: ev.overall_score,
        hiringVerdict: ev.hiring_verdict,
        speakingTurnCount: ev.speaking_turn_count,
        dnaSynced: Boolean(ev.dna_synced),
        createdAt: ev.created_at,
        dimensions: Array.isArray(ev.dimension_scores)
          ? ev.dimension_scores
          : ev.full_report?.dimensions || undefined,
        fullReport: ev.full_report || null
      });
    }

    for (const s of sessions) {
      if (s.lifecycleState === "COMPLETED" && s.evaluationReport && !bySessionId.has(s.sessionId)) {
        bySessionId.set(s.sessionId, {
          sessionId: s.sessionId,
          topicTitle: s.topicTitle,
          format: s.format,
          difficulty: s.difficulty,
          overallScore: s.evaluationReport.overallScore,
          hiringVerdict: s.evaluationReport.hiringVerdict,
          speakingTurnCount: s.evaluationReport.speakingTimeAnalysis?.studentTurnCount || 0,
          dnaSynced: false,
          createdAt: s.completedAt || s.updatedAt || s.createdAt,
          dimensions: s.evaluationReport.dimensions,
          fullReport: s.evaluationReport
        });
      }
    }

    const evaluatedSessions = Array.from(bySessionId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const analytics = computeGDPerformanceAnalytics({
      sessions: evaluatedSessions,
      skillsProgress,
      warningHistoryCount: disciplinaryHistory.length,
      suspended: suspension.suspended
    });

    return NextResponse.json(
      {
        success: true,
        sessions: evaluatedSessions,
        activeOrIncompleteCount: sessions.filter((s) => s.lifecycleState !== "COMPLETED").length,
        analytics,
        skillsLabSummary: analytics.skillsLabSummary,
        conductStanding: {
          suspended: suspension.suspended,
          expiresAt: suspension.expiresAt || null,
          reason: suspension.reason || null,
          appealToken: suspension.appealToken || null,
          warningHistoryCount: disciplinaryHistory.length
        },
        disciplinaryRecords: disciplinaryHistory.map((d) => ({
          id: d.id,
          sessionId: d.sessionId,
          warningNumber: d.warningNumber,
          severity: d.severity,
          violationCategory: d.violationCategory,
          appealStatus: d.appealStatus,
          createdAt: d.createdAt
        }))
      },
      { status: 200, headers: GD_NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error("[api/gd/sessions] GET error:", err);
    return NextResponse.json(
      { success: false, error: "fetch_failed", message: err?.message || "Failed to load GD sessions" },
      { status: 500, headers: GD_NO_STORE_HEADERS }
    );
  }
}
