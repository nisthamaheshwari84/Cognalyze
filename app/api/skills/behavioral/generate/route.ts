import { NextRequest, NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import { skillHubStore, BehavioralQuestion } from "@/lib/skill-hub-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trackType = "service_hr", companyTag = "TCS / Infosys" } = body;

    const prompt = `You are a Senior Bar-Raiser and Head of Campus Recruitment.
Generate 1 AUTHENTIC, probing behavioral / HR interview question actually asked in recent campus drives.
Track: "${trackType}" (service_hr = corporate stability, relocation, shifts, loyalty; faang_star = Amazon 16 LPs, extreme ownership, deep dive, disagree and commit)
Company: "${companyTag}"

Return STRICT JSON only:
{
  "title": "Short title describing the competency / scenario",
  "principle": "Target Leadership Principle or Corporate Filter",
  "question": "Realistic, direct question spoken by the interviewer",
  "context_tip": "Why the interviewer asks this and the common elimination trap",
  "star_rubric": {
    "situation": "What context the candidate should establish",
    "task": "The specific objective or challenge",
    "action": "The individual action steps (emphasizing 'I' over 'we')",
    "result": "The quantifiable business or technical outcome"
  },
  "ideal_response": "Benchmark gold-standard STAR response spoken with confidence and professional maturity"
}`;

    let generatedQ: any = null;

    try {
      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 800
        })
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      const clean = stripThinkTags(raw);
      generatedQ = extractJSON(clean);
    } catch (e) {
      console.warn("Groq fallback for behavioral question:", e);
    }

    if (!generatedQ || !generatedQ.question) {
      generatedQ = {
        title: "Cross-Functional Collaboration Under Shifting Requirements",
        principle: trackType === "service_hr" ? "Corporate Adaptability" : "Earn Trust & Deliver Results",
        question: "Tell me about a situation where a cross-functional dependency blocked your progress 48 hours before an important deliverable. How did you resolve the blocker?",
        context_tip: "Tests proactive communication without blame-shifting or waiting passively.",
        star_rubric: {
          situation: "External API or team delay risking committed timeline.",
          task: "Unblocking the deliverable while maintaining team morale.",
          action: "Created a mocked local service interface and scheduled an alignment sync.",
          result: "Shipped on schedule with zero customer disruption."
        },
        ideal_response: "When our dependency's API deployment was delayed, rather than halting development, I authored a mock service server matching their OpenAPI spec. This enabled our frontend team to continue testing end-to-end user flows uninterrupted. Once the live API was deployed, our contract tests verified compatibility in 15 minutes, allowing us to hit our release date on time."
      };
    }

    const newQuestion: BehavioralQuestion = {
      id: `beh-dyn-${Date.now()}`,
      track_type: (trackType as any) || "service_hr",
      title: generatedQ.title,
      principle: generatedQ.principle || "Professional Competence",
      company_tag: companyTag,
      question: generatedQ.question,
      context_tip: generatedQ.context_tip || "Evaluation criterion",
      star_rubric: generatedQ.star_rubric || {
        situation: "Context",
        task: "Objective",
        action: "Individual Action",
        result: "Impact"
      },
      ideal_response: generatedQ.ideal_response || ""
    };

    skillHubStore.addBehavioralQuestion(newQuestion);

    return NextResponse.json({
      success: true,
      question: newQuestion
    });
  } catch (err: any) {
    console.error("Error generating dynamic behavioral question:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
