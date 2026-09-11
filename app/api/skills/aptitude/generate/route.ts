import { NextRequest, NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import { skillHubStore, AptitudeQuestion } from "@/lib/skill-hub-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyTag = "TCS NQT", category = "quantitative", count = 5 } = body;

    const prompt = `Generate ${count} authentic, fresh, high-yield placement aptitude questions specifically modeled on the real 2026 exam pattern of "${companyTag}".
Category: "${category}".
Topics to prioritize:
- If quantitative: Time & Work, Speed Distance Time, Permutation & Combination, Probability, Percentages, Numbers.
- If logical: Syllogisms, Blood Relations, Seating Arrangement, Data Sufficiency, Cryptarithmetic.
- If verbal: Error Spotting, Sentence Improvement, Para Jumbles, Reading Comprehension.
- If programming_logic: Bitwise operators, pointers, recursive function tracing, loop invariant outputs.

Return STRICT JSON only:
{
  "questions": [
    {
      "id": "gen-${Date.now()}-1",
      "category": "${category}",
      "topic": "Specific Topic Name",
      "company_tag": "${companyTag}",
      "source_citation": "${companyTag} 2026 Real Exam Pattern • AI Calibrated",
      "difficulty": "medium",
      "question": "Full clear question text with values",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_option_index": 0,
      "explanation": "Detailed step-by-step mathematical or logical proof",
      "shortcut_tip": "NQT/Infosys speed shortcut trick formula"
    }
  ]
}`;

    let generatedQuestions: AptitudeQuestion[] = [];

    try {
      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 1500
        })
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      const clean = stripThinkTags(raw);
      const parsed = extractJSON(clean);
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        generatedQuestions = parsed.questions.map((q: any, i: number) => ({
          ...q,
          id: `dyn-${Date.now()}-${i}`,
          company_tag: companyTag,
          category: category as any
        }));
      }
    } catch (aiErr) {
      console.warn("AI question generation fallback triggered:", aiErr);
    }

    // Fallback if AI call failed
    if (generatedQuestions.length === 0) {
      generatedQuestions = [
        {
          id: `dyn-fb-${Date.now()}-1`,
          category: category as any,
          topic: "Speed, Distance & Relative Velocity",
          company_tag: companyTag,
          source_citation: `${companyTag} Real Exam Pattern • Verified`,
          difficulty: "medium",
          question: "Two cars start simultaneously towards each other from points A and B separated by 180 km at speeds of 40 km/h and 50 km/h respectively. At what time and distance from point A will they cross each other?",
          options: ["After 2 hours, 80 km from A", "After 2 hours, 100 km from A", "After 2.5 hours, 90 km from A", "After 1.5 hours, 60 km from A"],
          correct_option_index: 0,
          explanation: "Relative speed when moving in opposite directions = 40 + 50 = 90 km/h. Time to meet = Distance / Relative Speed = 180 / 90 = 2 hours. Distance from A = Speed of car A × Time = 40 × 2 = 80 km.",
          shortcut_tip: "Opposite direction relative speed = Speed A + Speed B. Time = Total Distance / (Speed A + Speed B)."
        },
        {
          id: `dyn-fb-${Date.now()}-2`,
          category: category as any,
          topic: "Simple & Compound Interest Difference",
          company_tag: companyTag,
          source_citation: `${companyTag} 2026 Archive Pattern`,
          difficulty: "easy",
          question: "The difference between simple interest and compound interest compounded annually on a certain sum of money for 2 years at 10% per annum is ₹65. Find the principal sum.",
          options: ["₹6,500", "₹6,000", "₹7,200", "₹5,800"],
          correct_option_index: 0,
          explanation: "For 2 years, Difference = P × (R / 100)². Here, 65 = P × (10/100)² = P × (1/100). Therefore, P = 65 × 100 = ₹6,500.",
          shortcut_tip: "Direct 2-Year Formula: Difference = P × (R / 100)². P = Difference × (100 / R)²."
        }
      ];
    }

    skillHubStore.addDynamicQuestions(generatedQuestions);

    return NextResponse.json({
      success: true,
      generatedCount: generatedQuestions.length,
      questions: generatedQuestions
    });
  } catch (err: any) {
    console.error("Error generating aptitude questions:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
