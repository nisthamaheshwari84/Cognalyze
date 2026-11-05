import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  EIGHT_TRACK_CURRICULA,
  synchronizeCandidateTrackCurriculum,
  recordTrackPracticeCompletion,
} from "@/lib/skills/track-curriculum-synchronizer";
import { InterviewTrack } from "@/lib/ai/interview-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const trackParam = (searchParams.get("track") || "traditional_coding_dsa") as InterviewTrack;
    const requestedCandidateId = searchParams.get("candidateId");
    const targetRole = searchParams.get("targetRole") || undefined;

    // Tenant isolation & authorization guard
    if (auth?.user?.id && requestedCandidateId && requestedCandidateId !== auth.user.id && auth.user.accountType !== "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot access another candidate's preparation curriculum." },
        { status: 403 }
      );
    }

    const candidateId = auth?.user?.id || requestedCandidateId || "cand_demo_student";

    if (!EIGHT_TRACK_CURRICULA[trackParam]) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid track '${trackParam}'. Valid tracks: ${Object.keys(EIGHT_TRACK_CURRICULA).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const synchronized = await synchronizeCandidateTrackCurriculum(candidateId, trackParam, targetRole);
    const curriculum = EIGHT_TRACK_CURRICULA[trackParam];

    return NextResponse.json({
      success: true,
      track: trackParam,
      curriculum: {
        id: curriculum.id,
        name: curriculum.name,
        shortTitle: curriculum.shortTitle,
        philosophy: curriculum.philosophy,
        primaryCompetencyKeys: curriculum.primaryCompetencyKeys,
        coreCompetencies: curriculum.coreCompetencies,
        learningObjectives: curriculum.learningObjectives,
        practiceActivities: curriculum.practiceActivities,
        evalCriteria: curriculum.evalCriteria,
        feedbackApproach: curriculum.feedbackApproach,
        sampleTasks: curriculum.sampleTasks,
      },
      synchronized,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[api/skills/preparation/sync] GET Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();

    // Guard: candidateId ownership & authentication
    let candidateId = auth?.user?.id;
    if (auth?.user?.id && body.candidateId && body.candidateId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot submit practice completions on behalf of another candidate." },
        { status: 403 }
      );
    }
    if (!candidateId) {
      candidateId = body.candidateId;
    }
    if (!candidateId || typeof candidateId !== "string" || !candidateId.trim()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authenticated candidate ID required." },
        { status: 401 }
      );
    }

    const { track, activityId, score, notes, evaluatorVerdict } = body;
    if (!track || !EIGHT_TRACK_CURRICULA[track as InterviewTrack]) {
      return NextResponse.json(
        { success: false, error: `Invalid track '${track}'. Valid tracks: ${Object.keys(EIGHT_TRACK_CURRICULA).join(", ")}` },
        { status: 400 }
      );
    }

    if (!activityId || typeof activityId !== "string" || !activityId.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'activityId' parameter." },
        { status: 400 }
      );
    }

    if (typeof score !== "number" || isNaN(score) || score < 0 || score > 100) {
      return NextResponse.json(
        { success: false, error: `Invalid score: ${score}. Score must be a number between 0 and 100.` },
        { status: 400 }
      );
    }

    if (evaluatorVerdict && !["mastered", "needs_work", "completed"].includes(evaluatorVerdict)) {
      return NextResponse.json(
        { success: false, error: `Invalid evaluatorVerdict '${evaluatorVerdict}'. Must be one of: mastered, needs_work, completed.` },
        { status: 400 }
      );
    }

    const idempotencyKey = req.headers.get("idempotency-key") || body.idempotencyKey || undefined;
    const assessmentSessionId = body.assessmentSessionId || undefined;

    const result = await recordTrackPracticeCompletion(
      candidateId,
      track as InterviewTrack,
      activityId,
      score,
      notes || "",
      evaluatorVerdict || (score >= 70 ? "mastered" : "completed"),
      {
        idempotencyKey,
        assessmentSessionId,
      }
    );

    return NextResponse.json({
      ...result,
    });
  } catch (err: any) {
    console.error("[api/skills/preparation/sync] POST Error:", err);
    const msg: string = err.message || "";
    if (msg.includes("Unauthorized") || msg.includes("Forbidden")) {
      return NextResponse.json({ success: false, error: msg }, { status: 403 });
    }
    if (
      msg.includes("Invalid") ||
      msg.includes("Forged mastery claim") ||
      msg.includes("Duplicate submission")
    ) {
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
