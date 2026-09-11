import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      action = "generate_questions",
      target_company = "Target Company",
      company_tier = "FAANG/Product (Tier-1 hiring bar)",
      drive_type = "On-campus placement",
      role_level = "Fresher/Entry-level",
      resume_text = "",
      questions = [],
      answers = [],
    } = body;

    // ── ACTION 1: Generate Context-Conditioned HR Questions ──
    if (action === "generate_questions") {
      const prompt = `You are a Senior Bar-Raiser and HR Director with decades of campus and lateral hiring experience in India across FAANG, top product startups, and global IT services companies.

CALIBRATION RULES FOR CONTEXT:
- DRIVE TYPE: "${drive_type}"
  * On-campus placement: Ask about transition from academics to production delivery, collaboration on capstone/hackathons, handling disagreements among student peers, and receiving feedback from professors/leads. Do NOT ask "why this company" as if they applied off-market.
  * Off-campus/direct application: Probe self-directed learning, motivation for this specific company among thousands, overcoming lack of institutional campus placement support, handling ambiguity.
  * Referral: Probe alignment with the high bar set by the referrer, technical accountability, cross-functional collaboration.
  * Experienced hire/lateral: Probe managing stakeholder conflicts, navigating production outages or post-mortems, mentoring junior engineers, and driving cross-team alignment.

- COMPANY TIER: "${company_tier}"
  * FAANG/Product: Deep dive into extreme ownership, disagree-and-commit, bias for action, and quantifiable business/user impact using strict STAR structure.
  * Service-based/IT Services: Adaptability to new tech stacks/clients, client communication, handling shifting project requirements, team harmony, and reliability.
  * Startup: High velocity under tight resource constraints, wearing multiple hats, and pragmatism.

- ROLE LEVEL: "${role_level}"
- TARGET COMPANY: "${target_company}"
- CANDIDATE RESUME SUMMARY: "${resume_text.slice(0, 1000)}"

CRITICAL CONSTRAINTS:
- Generate exactly 2 distinct, highly realistic behavioral questions tailored to this exact session.
- Never cite invented statistics or survey numbers (e.g. do not say "70% of companies...").
- Reference specific elements from the candidate's background or drive context where appropriate.

Return STRICT JSON ONLY:
{
  "questions": [
    {
      "id": "hr_q1",
      "competency": "Specific competency tested (e.g. Conflict Resolution Under Shifting Specs)",
      "question": "The spoken interview question",
      "why_asked": "Brief rationale on how this tests the candidate in this drive context",
      "guidance_placeholder": "Hint on what specific STAR evidence the interviewer expects"
    },
    {
      "id": "hr_q2",
      "competency": "Specific competency tested (e.g. Ownership & Production Post-Mortem)",
      "question": "The spoken interview question",
      "why_asked": "Brief rationale on how this tests the candidate in this drive context",
      "guidance_placeholder": "Hint on what specific STAR evidence the interviewer expects"
    }
  ]
}`;

      let lastErr: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: 900,
            }),
          });

          if (!res.ok) throw new Error(`Groq API ${res.status}`);
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content || "{}";
          const clean = stripThinkTags(raw);
          const parsed = extractJSON(clean);

          if (Array.isArray(parsed.questions) && parsed.questions.length >= 2) {
            return NextResponse.json({
              success: true,
              questions: parsed.questions.slice(0, 2),
            });
          }
          throw new Error("Invalid questions array in LLM response");
        } catch (err: any) {
          lastErr = err;
          console.warn(`[hr-chat] Question generation attempt ${attempt} failed:`, err.message);
          if (attempt === 1) await new Promise((r) => setTimeout(r, 400));
        }
      }

      // ZERO static fallback question allowed: return explicit error state for UI retry
      return NextResponse.json(
        {
          success: false,
          error: "generation_failed",
          message: `HR question generation failed after retry: ${lastErr?.message || "Service unavailable"}`,
          retryable: true,
        },
        { status: 503 }
      );
    }

    // ── ACTION 2: Evaluate Answers ──
    if (action === "evaluate_answers") {
      const prompt = `You are a Senior Bar-Raiser evaluating a candidate's HR / Behavioral answers.
Target: ${target_company} (${company_tier}) | Drive: ${drive_type} | Level: ${role_level}

QUESTIONS & CANDIDATE ANSWERS:
${questions.map((q: any, i: number) => `Q${i + 1} (${q.competency}): "${q.question}"\nCandidate Answer: "${answers[i] || "No answer provided"}"`).join("\n\n")}

Evaluate honestly:
- Did the candidate use the STAR framework (Situation, Task, Action, Result)?
- Did they take personal ownership ("I decided...", "My analysis...") vs vague group credit ("we did...")?
- Is there quantifiable outcome or clear learning?

Return STRICT JSON ONLY:
{
  "score": 0 to 100,
  "result": "pass" | "borderline" | "fail",
  "feedback": "2-3 sentences of direct, actionable feedback citing specific things they said",
  "star_strengths": ["list of demonstrated STAR components"],
  "star_gaps": ["list of missing details or vagueness"]
}`;

      let lastErr: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.2,
              max_tokens: 600,
            }),
          });

          if (!res.ok) throw new Error(`Groq API ${res.status}`);
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content || "{}";
          const clean = stripThinkTags(raw);
          const parsed = extractJSON(clean);

          return NextResponse.json({
            success: true,
            score: typeof parsed.score === "number" ? parsed.score : 70,
            result: parsed.result || (parsed.score >= 65 ? "pass" : "fail"),
            feedback: parsed.feedback || "Candidate provided structured behavioral responses.",
            star_strengths: parsed.star_strengths || [],
            star_gaps: parsed.star_gaps || [],
          });
        } catch (err: any) {
          lastErr = err;
          if (attempt === 1) await new Promise((r) => setTimeout(r, 400));
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "evaluation_failed",
          message: `HR evaluation failed after retry: ${lastErr?.message || "Service unavailable"}`,
          retryable: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[hr-chat] Route error:", err);
    return NextResponse.json(
      { success: false, error: "internal_error", message: err.message, retryable: true },
      { status: 500 }
    );
  }
}
