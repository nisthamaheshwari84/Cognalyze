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

    // Strong skills from demonstrated requirements
    const strong_skills = report.feedback.strongEvidence.map((m) => ({
      skill: m.requirementName,
      level: "Demonstrated",
      evidence: m.evidenceSourceQuotes[0] || m.reasoning,
    }));

    // Weak / Partial skills
    const weak_skills = report.feedback.partialEvidence.map((m) => ({
      skill: m.requirementName,
      level: "Partial Evidence",
      evidence: m.reasoning,
      how_to_fix: m.actionableRecommendation,
    }));

    // Missing skills
    const missing_skills = report.skillsGap
      .filter((sg) => sg.gapType === "EVIDENCE_GAP" || sg.gapType === "SKILL_GAP")
      .map((sg) => ({
        skill: sg.name,
        priority: sg.priority,
        learn_in: sg.priority === "HIGH" ? "2-4 weeks" : "1-2 months",
        resource: sg.recommendedAction,
        gap_type: sg.gapType,
        why_prioritized: sg.whyPrioritized,
      }));

    const roleAlignment = report.feedback.roleAlignmentSummary;

    return NextResponse.json({
      match_score: roleAlignment.alignmentPercentage, // Deterministically calculated formula score
      role_alignment: roleAlignment,
      strong_skills,
      weak_skills,
      missing_skills,
      honest_assessment: `Evidence-based role alignment: ${roleAlignment.criticalSupported.supported}/${roleAlignment.criticalSupported.total} critical requirements and ${roleAlignment.importantSupported.supported}/${roleAlignment.importantSupported.total} important requirements supported by concrete resume evidence. ${roleAlignment.verificationNeededCount} item(s) require technical verification.`,
      report, // Complete canonical report
    });
  } catch (error: any) {
    console.error("[API /api/skills-gap] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze skills gap." }, { status: 500 });
  }
}
