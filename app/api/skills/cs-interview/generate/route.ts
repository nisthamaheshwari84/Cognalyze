import { NextRequest, NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import { skillHubStore, CSInterviewQuestion } from "@/lib/skill-hub-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain = "dbms", companyTag = "TCS Digital", difficulty = "medium" } = body;

    const prompt = `You are a Senior Technical Hiring Bar-Raiser for TCS Digital, Infosys SP, and Amazon campus drives.
Generate 1 AUTHENTIC, RECENT technical interview question actually asked in 2025/2026 drives.
Domain: "${domain}" (dbms, oop, os, or networks)
Target Company: "${companyTag}"
Difficulty: "${difficulty}"

Return STRICT JSON only in this exact shape:
{
  "topic": "Short 3-5 word topic title",
  "question": "Clear, precise interview question asking for depth, edge cases, and runtime/memory implications",
  "expected_points": [
    "Key concept 1 expected in good answer",
    "Key concept 2 or edge case expected",
    "Key concept 3 or production consideration"
  ],
  "ideal_answer": "Complete, benchmark gold standard answer. Include code snippet or SQL query if relevant.",
  "follow_up": "A follow-up grilling question to test deeper expertise"
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
      console.warn("Groq generation fallback for CS question:", e);
    }

    if (!generatedQ || !generatedQ.question) {
      generatedQ = {
        topic: `${domain.toUpperCase()} Deep Dive Challenge`,
        question: `Explain how indexing and storage engines handle concurrent updates under high-load in ${domain.toUpperCase()}. What edge cases must an engineer guard against?`,
        expected_points: [
          "Concurrency control and locking mechanisms",
          "Cache invalidation and memory constraints",
          "Failure recovery and rollback strategies"
        ],
        ideal_answer: "In high-throughput systems, concurrency is managed using fine-grained locks or MVCC (Multi-Version Concurrency Control) to allow lock-free reads while isolating mutating writes. Writes are logged to a Write-Ahead Log (WAL) before updating in-memory pages.",
        follow_up: "How would you diagnose and recover from a cascading lock contention in production?"
      };
    }

    const newQuestion: CSInterviewQuestion = {
      id: `cs-dyn-${Date.now()}`,
      domain: (domain as any) || "dbms",
      topic: generatedQ.topic,
      company_tag: companyTag,
      difficulty: difficulty as any,
      question: generatedQ.question,
      expected_points: generatedQ.expected_points || [],
      ideal_answer: generatedQ.ideal_answer || "",
      follow_up: generatedQ.follow_up || ""
    };

    skillHubStore.addCSQuestion(newQuestion);

    return NextResponse.json({
      success: true,
      question: newQuestion
    });
  } catch (err: any) {
    console.error("Error generating dynamic CS question:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
