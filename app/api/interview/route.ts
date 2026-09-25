import { NextResponse } from "next/server";
import { analyzeResumeIntelligence } from "@/lib/ai/resume-intelligence-engine";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { jd, resume } = await req.json();

    if (!resume || typeof resume !== "string" || !resume.trim()) {
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }

    const report = await analyzeResumeIntelligence(resume, jd || "");
    const interview = report.interview;

    const questions = interview.probeQuestions.map((q) => ({
      question: q.question,
      why: q.whyAsked,
      lookFor: q.whatStrongProofLooksLike,
      difficulty: q.candidateDefensibility === "WEAK" ? "Hard" : q.candidateDefensibility === "MODERATE" ? "Medium" : "Easy",
      targetRequirement: q.targetRequirement,
      claimBeingProbed: q.claimBeingProbed,
      questionType: q.questionType,
      candidateDefensibility: q.candidateDefensibility,
    }));

    return NextResponse.json({
      focus_summary: interview.focusSummary,
      likely_areas_to_probe: interview.likelyAreasToProbe,
      defensibility_overview: interview.defensibilityOverview,
      questions,
      report, // Complete canonical report
    });
  } catch (e: any) {
    console.error("[API /api/interview] Error:", e);
    return NextResponse.json({ error: e.message || "Failed to generate interview probe intelligence." }, { status: 500 });
  }
}