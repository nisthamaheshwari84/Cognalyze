import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";

export interface AgentCritique {
  agent_id: string;
  agent_name: string;
  agent_role: string;
  agent_avatar: string;
  verdict: string;
  fact: string;
  inference: string;
  concern: string;
  recommendation: string;
  critique?: string; // backward compat
  tactical_advice?: string; // backward compat
  score?: number; // internal reference
}

export interface CouncilConsensus {
  strongest_evidence: string;
  major_concern: string;
  technical_risk: string;
  research_gap: string;
  differentiation_concern: string;
  recommended_change: string;
}

export interface CouncilEvaluation {
  overall_verdict: "🔥 HIGH CONVICTION (BUILD IMMEDIATELY)" | "⚠️ VIABLE WITH CRITICAL PIVOTS" | "❌ UNVIABLE (PIVOT TO ALTERNATIVE)";
  consensus_score?: number;
  executive_summary: string;
  consensus: CouncilConsensus;
  validated_problem: string;
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
      project_title = "Untitled Solution",
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

    const prompt = `You are an Evidence-Based Council of 6 AI Analytical Review Agents evaluating a technical problem statement and project proposal.
The team needs an honest, evidence-first evaluation: "IS THIS WORTH BUILDING OR NOT?" for ${opportunity_title}.

STRICT PRINCIPLES:
1. ZERO FABRICATED FACTS OR FAKE PERSONAS. These are transparent AI analytical roles, not simulated people.
2. DISTINGUISH FACT, INFERENCE, CONCERN, AND RECOMMENDATION explicitly for every agent.
   - FACT: What is directly stated in official requirements or observed real-world technical realities.
   - INFERENCE: System deduction based on known architecture patterns. Never disguise inference as fact.
   - CONCERN: Genuine risks, unsupported assumptions, missing evidence, or latency/data traps.
   - RECOMMENDATION: Specific action to fix or de-risk the proposal.
3. AVOID ARBITRARY SCORES. Focus on qualitative consensus, evidence strength, and structural viability.
4. UNKNOWN = UNKNOWN. If quantitative market data or user statistics are unavailable, state: "Insufficient empirical evidence" instead of inventing numbers.

PROPOSAL UNDER EVALUATION:
- Target Opportunity: ${opportunity_title}
- Domain: ${domain}
- Project Title: ${project_title}
- Proposed Stack: ${Array.isArray(tech_stack) ? tech_stack.join(", ") : tech_stack || "Full Stack"}
- Problem Statement:
"${problem_statement}"

EVALUATE USING THE 6 SPECIALIZED ROLES:
1. Problem Researcher: Examines problem authenticity, observed user pain points, and empirical depth vs toy wrapper ideas.
2. User Advocate: Examines target user impact, realistic workflow adoption, and live presentation clarity.
3. Technical Architect: Evaluates systems feasibility, 36h sprint scope, latency, API dependencies, state management, and failure modes.
4. Innovation Analyst: Identifies existing alternatives (open source tools, commercial apps) and pinpointing what actual gap remains unsolved.
5. Impact & Viability Analyst: Analyzes measurable utility, operational viability, and whether the solution creates real value.
6. Hackathon Judge: Evaluates official challenge rubric alignment, technical rigor, and defensibility during live evaluation.

Return strictly valid JSON in this exact structure:
{
  "overall_verdict": "<one of: 🔥 HIGH CONVICTION (BUILD IMMEDIATELY) | ⚠️ VIABLE WITH CRITICAL PIVOTS | ❌ UNVIABLE (PIVOT TO ALTERNATIVE)>",
  "consensus_score": 85,
  "executive_summary": "Synthesized executive evaluation citing the key trade-offs discovered across the council.",
  "consensus": {
    "strongest_evidence": "The strongest factual basis supporting this problem direction.",
    "major_concern": "The single most significant vulnerability or blocker identified.",
    "technical_risk": "Specific architecture, API, or data risk.",
    "research_gap": "What empirical data or user validation is currently missing.",
    "differentiation_concern": "How existing solutions already solve part of this problem.",
    "recommended_change": "Direct strategic or architectural pivot required before building."
  },
  "validated_problem": "A refined, tightened, defensible statement of the authentic problem to solve.",
  "unfair_moat": "Defensible architectural or workflow moat.",
  "fatal_pitfalls": ["Pitfall 1 referencing specific technical aspect", "Pitfall 2", "Pitfall 3"],
  "tactical_sprint_plan": [
    { "phase": "Core Architecture & Data Ingestion", "hours": "0-12h", "deliverable": "Working ingestion pipeline & verified contracts" },
    { "phase": "Algorithm / Agent Processing", "hours": "12-24h", "deliverable": "Working logic with real mock inputs & error boundaries" },
    { "phase": "Demo Polish & Proof of Concept", "hours": "24-36h", "deliverable": "Interactive scenario showing before/after value" }
  ],
  "agents": [
    {
      "agent_id": "problem_researcher",
      "agent_name": "Problem Researcher",
      "agent_role": "Problem Authenticity & Depth Analyst",
      "agent_avatar": "🔬",
      "verdict": "Validated Pain Point",
      "fact": "Factual statement grounded in the proposal or opportunity",
      "inference": "Logical inference deduced from domain constraints",
      "concern": "Key concern regarding depth or assumptions",
      "recommendation": "Concrete tactical advice",
      "critique": "Synthesized summary critique",
      "tactical_advice": "Immediate next step",
      "score": 80
    },
    {
      "agent_id": "user_advocate",
      "agent_name": "User Advocate",
      "agent_role": "User Experience & Workflow Adoption Specialist",
      "agent_avatar": "👤",
      "verdict": "High User Utility",
      "fact": "Factual target user workflow observation",
      "inference": "Likely user reaction during demonstration",
      "concern": "Workflow friction or cognitive load risk",
      "recommendation": "Simplified demo interaction pattern",
      "critique": "Synthesized summary critique",
      "tactical_advice": "Immediate next step",
      "score": 75
    },
    {
      "agent_id": "technical_architect",
      "agent_name": "Technical Architect",
      "agent_role": "Systems Design & Feasibility Analyst",
      "agent_avatar": "🏗",
      "verdict": "Feasible with Strict Scope",
      "fact": "Technical requirements of the proposed stack",
      "inference": "Expected bottlenecks or async latency issues",
      "concern": "Scope explosion within a 36-hour hackathon",
      "recommendation": "MVP boundaries and recommended database/service pattern",
      "critique": "Synthesized summary critique",
      "tactical_advice": "Immediate next step",
      "score": 78
    },
    {
      "agent_id": "innovation_analyst",
      "agent_name": "Innovation Analyst",
      "agent_role": "Market Gap & Differentiation Strategist",
      "agent_avatar": "📊",
      "verdict": "Clear Differentiation",
      "fact": "Existing public products or libraries solving related issues",
      "inference": "Why existing tools leave this specific gap open",
      "concern": "Risk of looking like a generic clone without distinct positioning",
      "recommendation": "Specific moat to emphasize to judges",
      "critique": "Synthesized summary critique",
      "tactical_advice": "Immediate next step",
      "score": 82
    },
    {
      "agent_id": "viability_analyst",
      "agent_name": "Impact & Viability Analyst",
      "agent_role": "Operational Viability & Real-World Outcome Evaluator",
      "agent_avatar": "⚡",
      "verdict": "Viable Proof of Value",
      "fact": "Operational requirements for real-world deployment",
      "inference": "Real-world scalability beyond hackathon stage",
      "concern": "Missing domain constraints or compliance hurdles",
      "recommendation": "Measurable benchmark metric to prove in demo",
      "critique": "Synthesized summary critique",
      "tactical_advice": "Immediate next step",
      "score": 80
    },
    {
      "agent_id": "hackathon_judge",
      "agent_name": "Hackathon Judge",
      "agent_role": "Rubric Alignment & Podium Evaluator",
      "agent_avatar": "⚖️",
      "verdict": "Podium Contender",
      "fact": "Official judging rubric and track priorities",
      "inference": "How judges will evaluate the live demo in first 2 minutes",
      "concern": "Abstract concept risk without tangible proof-of-work",
      "recommendation": "Script the demo around one concrete before/after transformation",
      "critique": "Synthesized summary critique",
      "tactical_advice": "Immediate next step",
      "score": 84
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
          if (typeof parsed.consensus_score === "number" && parsed.consensus_score > realAvg + 10) {
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
