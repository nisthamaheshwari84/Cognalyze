import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";

const SYSTEM_PROMPT = `You are the AI Orchestrator for an ultra-realistic, high-intensity Campus Placement Group Discussion (GD) for engineering candidates at a Tier-1 college recruitment drive (e.g. Google, Microsoft, Razorpay, or Flipkart campus selection).

CRITICAL RULE — THIS IS A MULTI-PARTY GROUP DISCUSSION, NOT AN INTERVIEW:
- 4 candidate peers ("Rohan", "Priya", "Karan", and "You" / Student) are competing AGAINST EACH OTHER for shortlist spots, guided by 1 Panel Director ("Alex").
- Candidates must debate, challenge, counter, or build on EACH OTHER. They do NOT act like examiners or interviewers evaluating the student.
- In spoken text, peers should naturally refer to each other: e.g. "Rohan, your p99 latency argument ignores business reality...", "Priya, shipping fast with technical debt will collapse during Diwali traffic!", "I agree with Karan on the attack surface, but...".
- If the student ("You") spoke, the responding peer should acknowledge or challenge the student's argument, BUT MUST immediately pivot and challenge another peer (e.g., "The candidate makes a valid point about distributed caches, but Rohan, how do you prevent cache stampedes without introducing lock contention?").
- Spoken text MUST be 2 to 3 punchy, conversational sentences (natural cadence, ready for speech synthesis). No bullet points, no markdown, no quotes inside text.
- Personas:
  * "Rohan" (Tech Purist): Obsessed with p99 latency, DB throughput, CAP theorem, distributed failure modes, and hardware limits.
  * "Priya" (Product & Velocity Lead): Focuses on shipping velocity, TAM, customer pain points, ROI, and not over-engineering before product-market fit.
  * "Karan" (Contrarian Risk Analyst): Exposes security vulnerabilities, zero-day exploits, compliance risks, edge cases, and systemic blind spots.
  * "Alex" (Discussion Director): Steps in occasionally to synthesize divergent views, challenge group stagnation, or maintain debate structure.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      action,
      topic,
      category,
      messages = [],
      studentIntervention = "",
      company_tier = "FAANG/Product (Tier-1 hiring bar)",
      drive_type = "On-campus placement",
      role_level = "Fresher/Entry-level",
      target_company = "Target Company",
    } = body;

    // ACTION 1: Dynamic Context-Aware Topic Generation
    if (action === "generate_topics") {
      const cat = category || "AI & Tech Engineering";
      const prompt = `Generate 4 fresh, controversial, and engaging Group Discussion (GD) topics for an engineering hiring drive.
CONTEXT:
- Target Company: ${target_company}
- Company Tier/Bar: ${company_tier}
- Drive Type: ${drive_type}
- Role Level: ${role_level}
- Category: "${cat}"

CALIBRATION RULES:
- Tier-1 / FAANG Product: Focus on distributed scalability, engineering velocity vs tech debt, algorithmic bias, autonomous AI agents vs junior engineering intuition.
- Service-Based / Enterprise IT: Focus on enterprise cloud migration vs legacy system SLAs, client cost pressures vs engineering perfection, client confidentiality in generative AI deployments.
- No fabricated statistics (never cite fake percentages). Topics must balance technical feasibility with real business impact.

Return JSON in this format ONLY:
{
  "topics": [
    {
      "title": "Topic title",
      "context": "1-sentence background on why this is debated",
      "key_perspectives": ["Perspective A", "Perspective B"]
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
              temperature: 0.85,
              max_tokens: 1000,
            }),
          });

          if (!res.ok) throw new Error(`Groq API ${res.status}`);
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content || "{}";
          const clean = stripThinkTags(raw);
          const parsed = extractJSON(clean);

          if (Array.isArray(parsed.topics) && parsed.topics.length >= 2) {
            return NextResponse.json({
              success: true,
              topics: parsed.topics,
            });
          }
          throw new Error("No topics parsed from response");
        } catch (e: any) {
          lastErr = e;
          console.warn(`[gd-turn] Topic generation attempt ${attempt} failed:`, e.message);
          if (attempt === 1) await new Promise((r) => setTimeout(r, 400));
        }
      }

      // ZERO static fallback: return explicit error state for UI retry
      return NextResponse.json(
        {
          success: false,
          error: "generation_failed",
          message: `GD topic generation failed after retry: ${lastErr?.message || "Service unavailable"}`,
          retryable: true,
        },
        { status: 503 }
      );
    }

    // ACTION 1.5: Dynamic Start of Discussion (Authentic Round-table Opening)
    if (action === "start_discussion") {
      const prompt = `You are orchestrating the opening of a high-stakes Group Discussion (GD).
Topic: "${topic}"
Context: ${company_tier} | Drive: ${drive_type} | Level: ${role_level}

Generate the opening sequence:
1. Alex (Moderator): Sharp 2-sentence opening framing the core dilemma and stating that candidates must demonstrate structured technical trade-offs.
2. Opening Peer (Pick either "Rohan" [Tech Purist] or "Priya" [Product Strategist]): Make a bold, assertive 2-sentence opening argument on "${topic}". Address the group directly and throw down an immediate technical challenge.

Return JSON ONLY:
{
  "moderator_intro": {
    "speaker": "Moderator Alex",
    "avatar": "🎙️",
    "role": "Discussion Director",
    "content": "..."
  },
  "opening_speaker": {
    "speaker": "Rohan",
    "avatar": "⚡",
    "role": "The Tech Purist",
    "content": "..."
  }
}`;

      let lastErr: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt },
              ],
              temperature: 0.7,
              max_tokens: 600,
            }),
          });

          if (!res.ok) throw new Error(`Groq API ${res.status}`);
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content || "{}";
          const clean = stripThinkTags(raw);
          const parsed = extractJSON(clean);

          if (parsed.moderator_intro?.content && parsed.opening_speaker?.content) {
            return NextResponse.json({
              success: true,
              moderator_intro: parsed.moderator_intro,
              opening_speaker: parsed.opening_speaker,
            });
          }
          throw new Error("Missing opening sequence components");
        } catch (e: any) {
          lastErr = e;
          if (attempt === 1) await new Promise((r) => setTimeout(r, 400));
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "generation_failed",
          message: `GD opening failed after retry: ${lastErr?.message || "Service unavailable"}`,
          retryable: true,
        },
        { status: 503 }
      );
    }

    // ACTION 2: Autonomous Next GD Peer Turn (Active Cross-Fire Debate)
    const transcriptHistory = messages
      .map((m: any) => `${m.speaker}: ${m.content}`)
      .slice(-6)
      .join("\n");

    const lastSpeaker = messages[messages.length - 1]?.speaker || "";

    const prompt = `GD Topic: "${topic}"
Context: ${company_tier} | Drive: ${drive_type} | Level: ${role_level}

Recent Discussion Flow:
${transcriptHistory}

Latest Event:
${studentIntervention ? `Candidate ('You') just spoke: "${studentIntervention}"` : `Previous Speaker was ${lastSpeaker}. The debate is in active flow between candidate peers.`}

Instructions for Next Speaker:
1. Choose the next speaker from ["Rohan", "Priya", "Karan", "Alex"]. DO NOT choose ${lastSpeaker} (must be a different peer).
2. The speaker MUST push the Group Discussion forward with high conversational energy (2-3 sentences max):
   - If the student spoke, react briefly, then immediately cross-examine or challenge another peer (e.g. Rohan, Priya, or Karan).
   - If peers are debating, clash directly with what the last speaker claimed, citing real-world engineering or product metrics.
3. If the student spoke, generate recruiter GD signals for their dashboard:
   - articulationScore (0 to 100)
   - valueAdded ("High" | "Medium" | "Low")
   - feedbackTip (1 concise coaching tip on GD entry timing, structure, or impact)
   - winningCounterPhrase (a punchy opening line they can use right now to re-enter the debate and seize leadership)

Return JSON format ONLY:
{
  "next_speaker": {
    "name": "Priya",
    "role": "Product & Velocity Lead",
    "avatar": "🎯",
    "spoken_text": "..."
  },
  "student_coaching": {
    "articulationScore": 84,
    "valueAdded": "High",
    "feedbackTip": "...",
    "winningCounterPhrase": "..."
  }
}`;

    let lastErr: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt },
            ],
            temperature: 0.75,
            max_tokens: 800,
          }),
        });

        if (!res.ok) throw new Error(`Groq API ${res.status}`);
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "{}";
        const clean = stripThinkTags(raw);
        const parsed = extractJSON(clean);

        if (parsed.next_speaker?.spoken_text) {
          return NextResponse.json({
            success: true,
            next_speaker: parsed.next_speaker,
            student_coaching: parsed.student_coaching || {
              articulationScore: 78,
              valueAdded: "Medium",
              feedbackTip: "Assert concrete technical trade-offs to anchor your perspective.",
              winningCounterPhrase: "Let us examine the operational failure modes before deciding.",
            },
          });
        }
        throw new Error("Missing next_speaker in parsed response");
      } catch (e: any) {
        lastErr = e;
        console.warn(`[gd-turn] Next speaker attempt ${attempt} failed:`, e.message);
        if (attempt === 1) await new Promise((r) => setTimeout(r, 400));
      }
    }

    // ZERO static fallback quotes: return clean error state
    return NextResponse.json(
      {
        success: false,
        error: "generation_failed",
        message: `GD debate turn generation failed after retry: ${lastErr?.message || "Service unavailable"}`,
        retryable: true,
      },
      { status: 503 }
    );
  } catch (err: any) {
    console.error("GD Turn error:", err);
    return NextResponse.json(
      { success: false, error: "internal_error", message: err.message, retryable: true },
      { status: 500 }
    );
  }
}
