import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";

export interface AgentCritique {
  agent_id: string;
  agent_name: string;
  agent_role: string;
  agent_avatar: string;
  score: number;
  verdict: string;
  critique: string;
  tactical_advice: string;
}

export interface CouncilEvaluation {
  overall_verdict: "🔥 100% WORTH IT (BUILD THIS IMMEDIATELY)" | "⚠️ WORTH IT WITH CRITICAL PIVOTS" | "❌ NOT WORTH IT (PIVOT TO ALTERNATIVE)";
  consensus_score: number;
  executive_summary: string;
  unfair_moat: string;
  fatal_pitfalls: string[];
  tactical_sprint_plan: Array<{ phase: string; hours: string; deliverable: string }>;
  agents: AgentCritique[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      problem_statement,
      project_title = "Untitled Real-World Solution",
      tech_stack = [],
      opportunity_title = "National Hackathon / Corporate Challenge",
      domain = "Engineering & Applied AI"
    } = body;

    if (!problem_statement || problem_statement.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a detailed problem statement (minimum 10 characters)." },
        { status: 400 }
      );
    }

    const prompt = `You are the Council of 6 Elite AI Reviewers assembled to evaluate a hackathon problem statement and project proposal.
The team wants to know: "IS THIS WORTH IT OR NOT?" ("worth it h ki nhh") to build in a high-stakes hackathon like SIH, ETHIndia, Flipkart GRiD, or Google/Meta buildathon.

PROPOSAL DETAILS:
- Target Opportunity: ${opportunity_title}
- Domain: ${domain}
- Project Title: ${project_title}
- Tech Stack: ${Array.isArray(tech_stack) ? tech_stack.join(", ") : tech_stack || "Full Stack + AI"}
- Problem Statement:
"${problem_statement}"

Run a rigorous, unfiltered, multi-perspective debate with exactly these 5 specialized agents + 1 Synthesis Director:

1. AGENT 1: FAANG Executive Bar Raiser (Recruiter Perspective)
   - agent_name: "Alex Vance (Staff Director, ex-Google/Meta)"
   - Focus: Does this solve an authentic L5 problem that will make FAANG recruiters interview the candidate on the spot, or is it a trivial wrapper/toy app?

2. AGENT 2: Hackathon Grand Jury Chief (Winning Pitch & Moat)
   - agent_name: "Elena Rostova (Lead Judge, ETHGlobal & National SIH)"
   - Focus: Will this win 1st place on Demo Day? Evaluates 3-minute pitch impact, live wow factor, and what prevents judges from dismissing it as unoriginal.

3. AGENT 3: Principal Systems Architect (Feasibility & Concurrency)
   - agent_name: "Marcus Chen (Distinguished Cloud Architect)"
   - Focus: 36-hour feasibility vs real-world scale. Can it survive concurrency spikes, API latency, cold starts, and data consistency?

4. AGENT 4: Venture Capitalist & Product Strategist (Market Pain & TAM)
   - agent_name: "Siddharth Mehta (Early-Stage DeepTech Partner)"
   - Focus: Real-world problem validity, actual user pain points, TAM, monetization, and why existing alternatives fail.

5. AGENT 5: Cybersecurity & Edge-Case Red Team Auditor
   - agent_name: "Dr. Sarah Jenkins (Lead Security & Threat Intelligence)"
   - Focus: Attack vectors, prompt injection, data privacy, offline failure modes, and adversarial vulnerabilities.

6. DIRECTOR: Council Synthesis Director (Final Verdict Engine)
   - Synthesizes all scores and arguments into the final verdict.

CRITICAL SCORING & CREDIBILITY RULES:
1. SCORE HONESTLY — If the problem is trivial (e.g., basic CRUD, thin wrapper, yet-another todo/chatbot), at least 3 agents MUST score BELOW 45 and the overall_verdict MUST be "❌ NOT WORTH IT (PIVOT TO ALTERNATIVE)".
2. SCORE VARIANCE IS MANDATORY — Agents MUST genuinely disagree when warranted. At least 2 of the 5 agents must have scores differing by 15+ points. Identical or near-identical scores (all within 5 points) are FORBIDDEN.
3. EVIDENCE GROUNDING — Each agent's critique MUST quote or reference at least one specific phrase, concept, or technical detail from the problem statement. No vague praise like "great idea" without citing what specifically is great.
4. DISSENT SYNTHESIS — The Synthesis Director MUST identify and address the strongest disagreement between agents in the executive_summary. If all agents agree, the Director must explicitly state why unanimous agreement is warranted for this specific problem.
5. CONSENSUS SCORE — Must be the genuine mathematical average of all 5 agent scores, not an inflated number. If scores are [35, 42, 78, 65, 50], consensus is 54, NOT 75.

Return strictly valid JSON in this exact structure (replace all placeholder values with REAL scores and analysis):
{
  "overall_verdict": "<one of: 🔥 100% WORTH IT (BUILD THIS IMMEDIATELY) | ⚠️ WORTH IT WITH CRITICAL PIVOTS | ❌ NOT WORTH IT (PIVOT TO ALTERNATIVE)>",
  "consensus_score": 0,
  "executive_summary": "2-3 sentences synthesizing the council debate, citing the strongest disagreement between agents",
  "unfair_moat": "The #1 feature that would make this unbeatable, or 'None — this needs a complete rethink' if the project is weak",
  "fatal_pitfalls": ["Pitfall 1 citing specific project detail", "Pitfall 2", "Pitfall 3"],
  "tactical_sprint_plan": [
    { "phase": "Phase name", "hours": "0-12h", "deliverable": "Concrete deliverable" },
    { "phase": "Phase name", "hours": "12-24h", "deliverable": "Concrete deliverable" },
    { "phase": "Phase name", "hours": "24-36h", "deliverable": "Concrete deliverable" }
  ],
  "agents": [
    {
      "agent_id": "recruiter",
      "agent_name": "Alex Vance (Staff Director, ex-Google/Meta)",
      "agent_role": "FAANG Bar Raiser & Talent Director",
      "agent_avatar": "👨‍💼",
      "score": 0,
      "verdict": "VERDICT TEXT",
      "critique": "Critique citing specific problem statement details",
      "tactical_advice": "Specific actionable advice"
    },
    {
      "agent_id": "jury",
      "agent_name": "Elena Rostova (Lead Judge, ETHGlobal & SIH)",
      "agent_role": "Hackathon Grand Jury Chief",
      "agent_avatar": "🏛️",
      "score": 0,
      "verdict": "VERDICT TEXT",
      "critique": "Critique citing specific problem statement details",
      "tactical_advice": "Specific actionable advice"
    },
    {
      "agent_id": "architect",
      "agent_name": "Marcus Chen (Distinguished Cloud Architect)",
      "agent_role": "Principal Systems Architect",
      "agent_avatar": "🛠️",
      "score": 0,
      "verdict": "VERDICT TEXT",
      "critique": "Critique citing specific problem statement details",
      "tactical_advice": "Specific actionable advice"
    },
    {
      "agent_id": "vc",
      "agent_name": "Siddharth Mehta (Early-Stage DeepTech Partner)",
      "agent_role": "Venture Capitalist & Product Strategist",
      "agent_avatar": "💡",
      "score": 0,
      "verdict": "VERDICT TEXT",
      "critique": "Critique citing specific problem statement details",
      "tactical_advice": "Specific actionable advice"
    },
    {
      "agent_id": "security",
      "agent_name": "Dr. Sarah Jenkins (Lead Security & Threat Intelligence)",
      "agent_role": "Cybersecurity & Edge-Case Red Team Auditor",
      "agent_avatar": "⚖️",
      "score": 0,
      "verdict": "VERDICT TEXT",
      "critique": "Critique citing specific problem statement details",
      "tactical_advice": "Specific actionable advice"
    }
  ]
}`;

    // Attempt 1
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.65,
            max_tokens: 3500
          })
        });

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "{}";
        const clean = stripThinkTags(raw);

        const parsed: CouncilEvaluation = extractJSON(clean);

        // Validate minimum structure
        if (!parsed.agents || !Array.isArray(parsed.agents) || parsed.agents.length < 3) {
          throw new Error("Invalid council response: missing agents array");
        }

        // Enforce consensus_score is genuine average if agents have scores
        const agentScores = parsed.agents
          .map(a => typeof a.score === "number" ? a.score : -1)
          .filter(s => s >= 0);
        if (agentScores.length >= 3) {
          const realAvg = Math.round(agentScores.reduce((a, b) => a + b, 0) / agentScores.length);
          // If the LLM inflated the consensus_score more than 10 points above the real average, correct it
          if (parsed.consensus_score > realAvg + 10) {
            parsed.consensus_score = realAvg;
          }
        }

        return NextResponse.json({
          success: true,
          evaluation: parsed
        });
      } catch (err: any) {
        lastErr = err;
        console.warn(`[council-evaluate] Attempt ${attempt + 1} failed:`, err.message);
        if (attempt === 0) {
          // Wait briefly before retry
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }

    // Both attempts failed — return explicit error, NO hardcoded fallback scores
    console.error("[council-evaluate] Both attempts failed:", lastErr?.message);
    return NextResponse.json(
      {
        success: false,
        error: "generation_failed",
        message: `Council evaluation failed after retry: ${lastErr?.message || "Service unavailable"}. Please try again.`,
        retryable: true
      },
      { status: 503 }
    );
  } catch (err: any) {
    console.error("Council evaluate error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
