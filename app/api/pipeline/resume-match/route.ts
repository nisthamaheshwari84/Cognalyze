import { NextResponse } from "next/server";
import { runResumeJdMatch, runResumeJdMatchBatch, JDRequirement } from "@/lib/evidence/resume-matcher";
import { saveEvidenceBatch, saveCandidateDecision } from "@/lib/evidence/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requirements: JDRequirement[] = body.requirements || [];

    if (!Array.isArray(requirements) || requirements.length === 0) {
      return NextResponse.json(
        { success: false, error: "requirements array with at least one requirement is required" },
        { status: 400 }
      );
    }

    // Support both single candidate and batch
    if (body.candidateId && body.resumeText) {
      const { decision, evidence } = await runResumeJdMatch(
        body.candidateId,
        body.resumeText,
        requirements
      );

      await saveEvidenceBatch(body.candidateId, evidence);
      await saveCandidateDecision(decision);

      return NextResponse.json({
        success: true,
        decisions: [decision],
        evidence,
      });
    }

    if (Array.isArray(body.candidates) && body.candidates.length > 0) {
      const concurrency = Number(body.concurrency) || 3;
      const { decisions, evidence } = await runResumeJdMatchBatch(
        body.candidates,
        requirements,
        concurrency
      );

      for (const d of decisions) {
        await saveCandidateDecision(d);
        const candEvidence = evidence.filter((e) => e.id.includes(d.candidate_id));
        await saveEvidenceBatch(d.candidate_id, candEvidence);
      }

      return NextResponse.json({
        success: true,
        decisions,
        evidence,
      });
    }

    return NextResponse.json(
      { success: false, error: "Must provide either candidateId + resumeText OR candidates array" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[pipeline/resume-match] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
