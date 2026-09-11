import { NextRequest, NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import { skillHubStore, SEED_CS_INTERVIEW_QUESTIONS, CSInterviewQuestion } from "@/lib/skill-hub-store";

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
    const { questionId, candidateAnswer, candidateId = "student-demo" } = body;

    const q =
      SEED_CS_INTERVIEW_QUESTIONS.find(item => item.id === questionId) || SEED_CS_INTERVIEW_QUESTIONS[0];

    if (!candidateAnswer || candidateAnswer.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a complete answer or code snippet." },
        { status: 400 }
      );
    }

    const prompt = `You are a Senior Technical Interviewer for TCS Digital, Infosys, and Amazon campus drives.
Evaluate the candidate's answer to this technical interview question:
Question Domain: "${q.domain.toUpperCase()}"
Question: "${q.question}"
Expected Key Points: ${JSON.stringify(q.expected_points)}
Benchmark Ideal Answer: "${q.ideal_answer}"

Candidate's Answer:
"${candidateAnswer}"

Return STRICT JSON only:
{
  "score": number between 30 and 98,
  "verdict": "Strong Hire" | "Hire" | "Borderline" | "No Hire",
  "conceptualAccuracy": number between 0 and 100,
  "depthScore": number between 0 and 100,
  "feedback": "2-3 sentences of direct technical critique. If code or SQL query was provided, note syntax or edge cases.",
  "correctCodeOrSyntax": "Provide the exact, clean SQL query or code snippet if applicable",
  "missingKeyPoints": ["Point 1", "Point 2"],
  "interviewerFollowUp": "${q.follow_up}"
}`;

    let evalResult: any = null;

    try {
      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      const clean = stripThinkTags(raw);
      evalResult = extractJSON(clean);
    } catch (aiErr) {
      console.warn("Groq CS evaluation fallback triggered:", aiErr);
    }

    if (!evalResult || !evalResult.score) {
      const ansLower = candidateAnswer.toLowerCase();
      let score = 75;
      if (ansLower.includes("select") || ansLower.includes("abstract") || ansLower.includes("deadlock") || ansLower.includes("dns")) {
        score += 10;
      }
      evalResult = {
        score: Math.min(95, score),
        verdict: score >= 80 ? "Hire" : "Borderline",
        conceptualAccuracy: score,
        depthScore: 78,
        feedback: "Solid foundational grasp! Ensure you explicitly verbalize runtime complexity and edge cases like NULL handling or single-inheritance limits.",
        correctCodeOrSyntax: q.ideal_answer,
        missingKeyPoints: q.expected_points.slice(0, 2),
        interviewerFollowUp: q.follow_up
      };
    }

    return NextResponse.json({
      success: true,
      questionId: q.id,
      questionTitle: q.topic,
      evaluation: evalResult
    });
  } catch (err: any) {
    console.error("Error evaluating CS technical answer:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
