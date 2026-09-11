import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import {
  evaluateHolisticSimulation,
  SimulationSession,
} from "@/lib/simulation/simulation-engine";
import { stripThinkTags, extractJSON } from "@/lib/ai/placement-intelligence";

export async function POST(req: Request) {
  try {
    const session: SimulationSession = await req.json();

    if (!session || !session.round_results) {
      return NextResponse.json({ error: "Invalid simulation session payload" }, { status: 400 });
    }

    // Step 1: Base deterministic evaluation (guarantees hard elimination rules & zero hallucinations)
    const baseReport = evaluateHolisticSimulation(session);

    // Step 2: Try LLM refinement for rich, personalized synthesis
    try {
      const targetCompany = session.target_company || "Target Company";
      const companyTier = session.company_tier_type || session.target_company_tier;
      const driveType = session.drive_type || "Campus Placement";
      const roleLevel = session.role_level || "Fresher";

      const r = baseReport.round_results;

      const formatScore = (score: number | null | undefined) =>
        score !== null && score !== undefined ? `${score}/100` : "Not Attempted (No Score)";

      const prompt = `You are a Principal Talent Acquisition Director reviewing a candidate's complete end-to-end recruitment simulation.
Target Company: ${targetCompany}
Company Tier / Bar: ${companyTier}
Drive Type: ${driveType}
Role Level: ${roleLevel}
Target Role: ${session.target_role}

Round Results:
1. Resume Screening: Result=${r.resume_screening.result}, Score=${formatScore(r.resume_screening.score)}. Evidence: "${r.resume_screening.evidence}"
2. Online Assessment: Result=${r.online_assessment.result}, Aptitude=${formatScore(r.online_assessment.aptitude_score)}, Coding=${formatScore(r.online_assessment.coding_score)}, Solved=${r.online_assessment.coding_problems_solved}
3. Group Discussion: Result=${r.group_discussion.result}, Articulation=${formatScore(r.group_discussion.articulation_score)}. Feedback: "${r.group_discussion.specific_feedback}"
4. Technical Interview: Result=${r.technical_interview.result}, Score=${formatScore(r.technical_interview.score)}. Strong: ${r.technical_interview.strong_areas.join(", ") || "None"}, Weak: ${r.technical_interview.weak_areas.join(", ") || "None"}
5. HR / Behavioral: Result=${r.hr_interview.result}, Score=${formatScore(r.hr_interview.score)}. Feedback: "${r.hr_interview.specific_feedback}"

Base Analysis:
Would be selected: ${baseReport.realistic_outcome.would_be_selected}
Likely elimination round: ${baseReport.realistic_outcome.likely_elimination_round}
Base reasoning: "${baseReport.realistic_outcome.reasoning}"

CRITICAL INSTRUCTIONS:
- If ANY round was 'not_attempted', explicitly state that non-participation in that round resulted in immediate termination of candidacy.
- NEVER fabricate praise or assume skills for rounds that were 'not_attempted'.
- DO NOT soften bad results with false praise. If coding or resume was weak, say so plainly.
- If the candidate failed OA coding (e.g. 0/2 solved), affirm that communication/GD strength DOES NOT compensate for failed OA at ${session.target_company_tier}.
- Refine the 'reasoning', 'profile_summary', and 'recommended_focus' array (prioritized by highest impact first).
- Return JSON strictly matching this schema:
{
  "reasoning": "honest, specific explanation...",
  "profile_summary": "detailed genuine synthesis of strengths and gaps across all 5 dimensions...",
  "recommended_focus": ["priority 1 focus", "priority 2 focus", "priority 3 focus"]
}`;

      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 650,
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content;
        if (raw) {
          const parsed = extractJSON(stripThinkTags(raw));
          if (parsed.reasoning && parsed.profile_summary && Array.isArray(parsed.recommended_focus)) {
            baseReport.realistic_outcome.reasoning = parsed.reasoning;
            baseReport.profile_summary = parsed.profile_summary;
            baseReport.recommended_focus = parsed.recommended_focus.slice(0, 4);
          }
        }
      }
    } catch (llmErr) {
      console.warn("[simulation-report] LLM refinement skipped, using deterministic base report:", llmErr);
    }

    return NextResponse.json({
      success: true,
      report: baseReport,
    });
  } catch (error: any) {
    console.error("[simulation-report] Error generating report:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
