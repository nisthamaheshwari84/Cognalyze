import { NextRequest, NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import { skillHubStore, SEED_CS_INTERVIEW_QUESTIONS } from "@/lib/skill-hub-store";
import { evaluateAdaptiveTurn, getAdaptiveQuestion } from "@/lib/skills/adaptive-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain") || "all";

    const questions = skillHubStore.getCSQuestions(domain);
    return NextResponse.json({
      success: true,
      domain,
      count: questions.length,
      questions
    });
  } catch (err: any) {
    console.error("Error fetching CS interview questions:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionId,
      questionText,
      candidateAnswer,
      candidateId = "student-demo",
      trackSlug = "product_mid",
      turnIndex = 0
    } = body;

    if (!candidateAnswer || candidateAnswer.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Please provide a complete answer or code snippet." },
        { status: 400 }
      );
    }

    // Find reference question if seeded, or create dynamic question representation
    const seedQ = SEED_CS_INTERVIEW_QUESTIONS.find(item => item.id === questionId);
    const effectiveQuestion = {
      id: questionId || `q-${Date.now()}`,
      domain: seedQ?.domain || "dbms",
      topic: seedQ?.topic || "CS Fundamentals & Trade-offs",
      question: questionText || seedQ?.question || "Explain your technical approach.",
      internalIntent: "Evaluate technical precision, code correctness, and trade-off defense under interview conditions.",
      expectedSignals: seedQ?.expected_points || ["Syntactic correctness", "Handles edge cases", "Defends trade-offs"],
      failureSignals: ["Vague answers", "Missing edge-case guards", "Unverified claims"],
      suggestedFollowUps: [
        {
          type: "CHALLENGE" as const,
          text: seedQ?.follow_up || "How would you optimize this under strict memory constraints?"
        }
      ],
      depthLevel: "Apply" as const,
      isFreshUnseen: true
    };

    // Evaluate turn adaptively using deterministic reasoning engine first
    const deterministicEval = evaluateAdaptiveTurn(effectiveQuestion, candidateAnswer, trackSlug);

    // Attempt AI enhancement if LLM is active
    let evalResult = deterministicEval;

    try {
      const prompt = `You are a Senior Technical Interviewer for ${trackSlug.replace("_", " ").toUpperCase()} technical hiring rounds.
Evaluate candidate's response to this interview question:
Question: "${effectiveQuestion.question}"
Candidate Answer / Code:
"${candidateAnswer}"

Analyze:
1. Did the candidate make unverified claims (e.g. "MongoDB is faster", "used Redis", "never fails")?
2. Did they address edge cases (NULLs, duplicates, concurrency, deadlocks)?
3. What is the most incisive follow-up probe to test their depth?

Return STRICT JSON:
{
  "score": number between 35 and 96,
  "verdict": "Strong Hire" | "Hire" | "Borderline" | "Needs Diagnostic",
  "conceptualAccuracy": number between 30 and 100,
  "depthScore": number between 30 and 100,
  "feedback": "2-3 sentences of direct technical critique.",
  "detectedClaims": ["Claim 1", "Claim 2"],
  "observedStrengths": ["Strength 1"],
  "observedGaps": ["Gap 1"],
  "nextFollowUp": {
    "type": "CHALLENGE" | "TRADE_OFF" | "EDGE_CASE" | "APPLICATION" | "TRANSFER" | "DIAGNOSE",
    "question": "Realistic follow-up question directly probing candidate's answer",
    "reason": "Why this follow-up was chosen"
  }
}`;

      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 700
        })
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      const clean = stripThinkTags(raw);
      const parsed = extractJSON(clean);
      if (parsed && parsed.score && parsed.nextFollowUp) {
        evalResult = parsed;
      }
    } catch (aiErr) {
      console.warn("Groq adaptive evaluation fallback used:", aiErr);
    }

    return NextResponse.json({
      success: true,
      questionId: effectiveQuestion.id,
      evaluation: evalResult
    });
  } catch (err: any) {
    console.error("Error evaluating CS technical answer:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
