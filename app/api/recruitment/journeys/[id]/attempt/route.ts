/**
 * app/api/recruitment/journeys/[id]/attempt/route.ts
 * 
 * Stage Attempt Submission API.
 * POST: Evaluates a candidate's stage execution, updates DAG progression, and recalculates scores.
 */

import { NextRequest, NextResponse } from "next/server";
import { getJourneyById, saveJourney, saveStageAttemptRecord } from "@/lib/recruitment/journey-store";
import { advanceJourneyWithAttempt } from "@/lib/recruitment/journey-engine";
import { StageAttemptSubmission } from "@/lib/recruitment/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const journey = await getJourneyById(id);
    if (!journey) {
      return NextResponse.json({ error: "Recruitment journey not found." }, { status: 404 });
    }

    const stageId = body.stageId;
    if (!stageId) {
      return NextResponse.json({ error: "'stageId' is required." }, { status: 400 });
    }

    const rawScore = Number(body.rawScore ?? 0);
    const maxScore = Number(body.maxScore ?? 100);
    const durationSeconds = Number(body.durationSeconds ?? 0);

    const submission: StageAttemptSubmission = {
      journeyId: id,
      stageId,
      rawScore,
      maxScore,
      durationSeconds,
      telemetry: body.telemetry || {},
      rubricEvaluations: body.rubricEvaluations || {},
      evaluatorFeedback: body.evaluatorFeedback,
      sessionReferenceId: body.sessionReferenceId,
    };

    const result = advanceJourneyWithAttempt(journey, submission);
    const savedJourney = await saveJourney(result.updatedJourney);

    const stageProgress = savedJourney.stageProgress[stageId];
    await saveStageAttemptRecord(submission, {
      stagePassed: result.stagePassed,
      percentageScore: stageProgress ? stageProgress.percentageScore : 0,
      stageType: stageProgress ? stageProgress.stageType : "unknown",
      studentId: savedJourney.studentId,
    });

    return NextResponse.json({
      success: true,
      updatedJourney: savedJourney,
      stagePassed: result.stagePassed,
      nextStageId: result.nextStageId,
      isCompleted: result.isCompleted,
    });
  } catch (err: any) {
    console.error("[POST /api/recruitment/journeys/[id]/attempt] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process stage attempt." },
      { status: 400 }
    );
  }
}

