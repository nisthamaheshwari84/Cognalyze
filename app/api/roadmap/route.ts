import { NextResponse } from "next/server";
import { analyzeResumeIntelligence } from "@/lib/ai/resume-intelligence-engine";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { resume, jd } = await req.json();

    if (!resume || typeof resume !== "string" || !resume.trim()) {
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }

    const report = await analyzeResumeIntelligence(resume, jd || "");
    const roadmap = report.roadmap;

    const months = roadmap.milestones.map((m) => ({
      month: m.phase,
      focus: m.title,
      actions: [
        m.action,
        `Concrete Deliverable: ${m.concreteDeliverableArtifact}`,
        `Evidence Generated: ${m.evidenceGenerated}`,
      ],
      milestone: m.concreteDeliverableArtifact,
      target_requirement: m.targetGapRequirement,
      realistic_effort: m.realisticEffort,
    }));

    return NextResponse.json({
      ready_to_apply: roadmap.readyToApplyStatus === "READY_TO_APPLY" || roadmap.readyToApplyStatus === "APPLY_WITH_GAPS",
      ready_to_apply_status: roadmap.readyToApplyStatus,
      honest_take: roadmap.readyToApplyReason,
      months,
      report, // Complete canonical report
    });
  } catch (error: any) {
    console.error("[API /api/roadmap] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate roadmap." }, { status: 500 });
  }
}