import { NextResponse } from "next/server";
import { ingestCandidateResume } from "@/lib/ingestion/single-candidate";
import { processJdIntake } from "@/lib/roles/jd-intake";
import { generateCritiqueLenses } from "@/lib/ai/debate-lenses";

export async function POST(req: Request) {
  try {
    const { jd, resume } = await req.json();
    const jdClean = (jd || "").trim();
    const resumeClean = (resume || "").trim();

    if (resumeClean.length < 50) {
      return NextResponse.json({
        error: "insufficient_data",
        message: "Resume text must contain at least 50 characters to evaluate evidence.",
      }, { status: 400 });
    }

    // 1. Process JD Requirements
    const jdIntake = processJdIntake(jdClean);

    // 2. Ingest Candidate & Verify Verbatim Quotes
    const candidate = ingestCandidateResume(resumeClean, {
      roleRequirements: jdIntake.requirements,
    });

    // 3. Run Debate Committee Critique Lenses (PART 7)
    const report = generateCritiqueLenses({
      candidateId: candidate.candidateId,
      evidenceItems: candidate.evidenceItems,
      claims: candidate.claims,
      assessments: candidate.assessments || {},
    });

    // Map into lenses for frontend rendering (retaining backward compatible shape with zero scores)
    const formattedAgents = [
      {
        name: "Strongest Evidence Lens",
        color: "#00ff88",
        response: report.observations
          .filter((o) => o.lens === "strongest_evidence")
          .map((o) => `• [${o.title}]: "${o.verbatimQuoteSnippet}" → ${o.consideration} (${o.actionRecommendation})`)
          .join("\n") || "• No qualifying T2+ code artifacts verified in available document.",
      },
      {
        name: "Unsupported Claims Lens",
        color: "#ffaa00",
        response: report.observations
          .filter((o) => o.lens === "unsupported_claims")
          .map((o) => `• [${o.title}]: "${o.verbatimQuoteSnippet}" → ${o.consideration} (${o.actionRecommendation})`)
          .join("\n") || "• No ungrounded self-reported claims identified.",
      },
      {
        name: "Unresolved Risks Lens",
        color: "#a78bfa",
        response: report.observations
          .filter((o) => o.lens === "unresolved_risks")
          .map((o) => `• [${o.title}] → ${o.consideration} (${o.actionRecommendation})`)
          .join("\n") || "• All core role requirements have established evidence.",
      },
    ];

    return NextResponse.json({
      success: true,
      agents: formattedAgents,
      critiqueReport: report,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}