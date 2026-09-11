import { NextRequest, NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import { skillHubStore, SEED_COMMUNICATION_PROMPTS } from "@/lib/skill-hub-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId = "student-demo", promptId, spokenText, durationSeconds = 60 } = body;

    if (!spokenText || spokenText.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a meaningful speech or text response (minimum 10 characters)." },
        { status: 400 }
      );
    }

    const promptObj =
      SEED_COMMUNICATION_PROMPTS.find(p => p.id === promptId) || SEED_COMMUNICATION_PROMPTS[0];

    // 1. Heuristic Pre-Analysis: Filler words & common jargon scan
    const textLower = spokenText.toLowerCase();
    const fillerPatterns = ["um", "uh", "like", "you know", "actually", "basically", "sort of", "kind of"];
    const foundFillers: string[] = [];
    let fillerCount = 0;

    fillerPatterns.forEach(f => {
      const regex = new RegExp(`\\b${f}\\b`, "gi");
      const matches = spokenText.match(regex);
      if (matches && matches.length > 0) {
        fillerCount += matches.length;
        foundFillers.push(`${f} (${matches.length}x)`);
      }
    });

    const technicalJargonKeywords = [
      "endpoint",
      "endpoints",
      "json",
      "http",
      "https",
      "tcp",
      "backend",
      "frontend",
      "b-tree",
      "btree",
      "binary tree",
      "database",
      "server",
      "servers",
      "api",
      "apis",
      "sql",
      "query",
      "queries",
      "asynchronous",
      "microservice",
      "microservices",
      "thread",
      "threads",
      "memory address",
      "pointer",
      "pointers"
    ];

    const detectedJargon: string[] = [];
    if (promptObj.type === "plain_english_concept") {
      technicalJargonKeywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, "i");
        if (regex.test(textLower)) {
          detectedJargon.push(kw);
        }
      });
    }

    // 2. AI Evaluation Prompt
    let evaluationResult: any = null;

    try {
      const systemInstruction = `You are a Senior Corporate Communication Assessor & HR Bar-Raiser for Tier-1 Indian IT Services and Product Firms (TCS, Infosys, Wipro, Accenture, Amazon).
Evaluate a candidate's spoken/typed response to this communication test prompt:
Title: "${promptObj.title}"
Prompt Requirement: "${promptObj.prompt_text}"
Candidate Response: "${spokenText}"
Context: "${promptObj.context_note}"

Return STRICT JSON only:
{
  "overallScore": number between 40 and 98,
  "verdict": "Pass — Client & HR Ready" | "Borderline — Refine Analogy & Flow" | "Eliminated — Jargon Heavy / Lacks Structure",
  "clarityScore": number (0-100),
  "simplicityScore": number (0-100),
  "structuralScore": number (0-100),
  "feedbackTip": "1-2 sharp sentences on what worked and the exact fix",
  "strengths": ["string", "string"],
  "areasForImprovement": ["string", "string"],
  "modelPhrasingRecommendation": "1-2 sentences showing how a top candidate would phrase this smoothly"
}`;

      const aiRes = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: systemInstruction }],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      const data = await aiRes.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      const clean = stripThinkTags(raw);
      evaluationResult = extractJSON(clean);
    } catch (aiErr) {
      console.warn("Groq AI evaluation fallback triggered:", aiErr);
    }

    // Fallback if LLM unavailable
    if (!evaluationResult || !evaluationResult.overallScore) {
      const words = spokenText.trim().split(/\s+/).length;
      let baseScore = 78;
      if (detectedJargon.length > 2) baseScore -= detectedJargon.length * 6;
      if (fillerCount > 3) baseScore -= Math.min(15, fillerCount * 2);
      if (words < 25) baseScore -= 15;
      baseScore = Math.max(45, Math.min(94, baseScore));

      evaluationResult = {
        overallScore: baseScore,
        verdict:
          baseScore >= 75
            ? "Pass — Client & HR Ready"
            : baseScore >= 60
            ? "Borderline — Refine Analogy & Flow"
            : "Eliminated — Jargon Heavy / Lacks Structure",
        clarityScore: Math.max(50, baseScore + 2),
        simplicityScore: detectedJargon.length === 0 ? 88 : Math.max(40, 80 - detectedJargon.length * 10),
        structuralScore: words >= 35 ? 85 : 65,
        feedbackTip:
          detectedJargon.length > 0
            ? `Avoid terms like ${detectedJargon.slice(0, 3).join(", ")}. Anchor your explanation with everyday tangible examples like restaurants or libraries.`
            : "Good conversational delivery! Keep your speech structured and eliminate filler hesitations.",
        strengths: [
          words >= 30 ? "Good narrative length and elaboration" : "Direct response to prompt",
          detectedJargon.length === 0 ? "Strong avoidance of opaque technical jargon" : "Good conceptual grasp"
        ],
        areasForImprovement: [
          detectedJargon.length > 0
            ? `Replace technical terms (${detectedJargon.join(", ")}) with intuitive analogies.`
            : "Practice smooth transitions between concepts without pauses.",
          fillerCount > 0 ? `Reduce conversational fillers (${foundFillers.join(", ")}).` : "Add a clear closing punchline."
        ],
        modelPhrasingRecommendation: promptObj.sample_winning_response.slice(0, 180) + "..."
      };
    }

    const finalReport = {
      promptId: promptObj.id,
      promptTitle: promptObj.title,
      spokenText,
      durationSeconds,
      ...evaluationResult,
      fillerCount,
      foundFillers,
      detectedJargon,
      sampleWinningResponse: promptObj.sample_winning_response
    };

    skillHubStore.recordCommunicationSubmission(candidateId, finalReport);

    return NextResponse.json({
      success: true,
      report: finalReport
    });
  } catch (err: any) {
    console.error("Error evaluating communication response:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
