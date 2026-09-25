import { NextResponse } from "next/server";
import { analyzeResumeIntelligence } from "@/lib/ai/resume-intelligence-engine";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { jd, resume } = await req.json();

    if (!resume || typeof resume !== "string" || !resume.trim()) {
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }

    // Run unified evidence-grounded intelligence audit on FULL resume and FULL JD
    const report = await analyzeResumeIntelligence(resume, jd || "");

    // Format legacy agents array for backward compatibility, but grounded in real evidence
    const strengthsBullets = report.feedback.strongEvidence.length > 0
      ? report.feedback.strongEvidence.map(
          (m) => `- ${m.requirementName}: ${m.evidenceSourceQuotes[0] || "Documented project experience"} → Directly fulfills ${m.importance.toLowerCase()} role requirement. ${m.reasoning}`
        ).join("\n")
      : "- Core Technical Experience: Documented in resume → Demonstrates hands-on capability for target technical workflows.";

    const gapsBullets = [
      ...report.feedback.missingEvidence.map(
        (m) => `- [${m.gapType === "EVIDENCE_GAP" ? "Evidence Gap" : "Skill Gap"} - ${m.requirementName}]: No direct supporting evidence found in resume → ${m.reasoning} → Recommended fix: ${m.actionableRecommendation}`
      ),
      ...report.feedback.partialEvidence.map(
        (m) => `- [Partial Evidence - ${m.requirementName}]: Claimed or partially supported without full production proof → ${m.reasoning} → Recommended fix: ${m.actionableRecommendation}`
      ),
    ].slice(0, 5).join("\n") || "- Scope Alignment: Review alignment with preferred cloud deployment tooling.";

    const exp = report.feedback.experienceQuality;
    const expBullets = [
      `- Professional Experience: Level [${exp.professionalExperience.level}] → ${exp.professionalExperience.detail}`,
      `- Project Evidence: [${exp.projectEvidence.count} projects identified, ${exp.projectEvidence.level} depth] → ${exp.projectEvidence.detail}`,
      `- Engineering Depth: Level [${exp.engineeringDepth.level}] → ${exp.engineeringDepth.detail}`,
      `- Impact & Observability: Level [${exp.impactEvidence.level}] → ${exp.impactEvidence.detail}`,
      `- Candidate Profile Context: ${exp.fresherFriendlyAssessment}`,
    ].join("\n");

    const market = report.feedback.marketPosition;
    const marketBullets = [
      `- Market Benchmark Status: [${market.benchmarkStatus === "BENCHMARK_UNAVAILABLE" ? "Benchmark Unavailable" : "Cohort Comparison"}] → ${market.explanation}`,
      `- Verified Evidence Profile: ${market.evidenceProfileSummary}`,
      `- Rigorous Comparison Standard: ${market.requiredCohortForPercentile}`,
    ].join("\n");

    const interviewBullets = report.interview.probeQuestions.slice(0, 4).map(
      (q) => `Q: "${q.question}" → Why asked: [${q.whyAsked}] → What strong evidence looks like: [${q.whatStrongProofLooksLike}]`
    ).join("\n");

    const agents = [
      {
        name: "Strengths Analysis",
        color: "#00ff88",
        response: strengthsBullets,
      },
      {
        name: "Gaps & Risks",
        color: "#ff4466",
        response: gapsBullets,
      },
      {
        name: "Experience Quality",
        color: "#a78bfa",
        response: expBullets,
      },
      {
        name: "Market Position",
        color: "#fbbf24",
        response: marketBullets,
      },
      {
        name: "Interview Focus",
        color: "#38bdf8",
        response: interviewBullets,
      },
    ];

    return NextResponse.json({
      agents,
      report, // Complete canonical evidence report
    });
  } catch (e: any) {
    console.error("[API /api/candidate] Error:", e);
    return NextResponse.json({ error: e.message || "Failed to analyze candidate resume." }, { status: 500 });
  }
}