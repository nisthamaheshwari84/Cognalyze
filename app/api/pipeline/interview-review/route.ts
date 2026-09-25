import { NextResponse } from "next/server";
import { runInterviewReview, InterviewCompetency } from "@/lib/evidence/interview-matcher";
import { saveEvidenceBatch, saveCandidateDecision } from "@/lib/evidence/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = body.candidateId;
    const transcriptText = body.transcriptText;
    const competencies: InterviewCompetency[] = Array.isArray(body.competencies)
      ? body.competencies
      : [];

    if (!candidateId || !transcriptText || competencies.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "candidateId, transcriptText, and competencies array are required",
        },
        { status: 400 }
      );
    }

    const { decision, evidence } = await runInterviewReview(
      candidateId,
      transcriptText,
      competencies
    );

    await saveEvidenceBatch(candidateId, evidence);
    await saveCandidateDecision(decision);

    return NextResponse.json({
      success: true,
      decision,
      evidence,
    });
  } catch (err: any) {
    console.error("[pipeline/interview-review] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
