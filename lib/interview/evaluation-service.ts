/**
 * Live Interview Evaluation Service
 *
 * Implements per-turn 7-dimension scoring with Zod validation, running weighted aggregation,
 * retry-on-failure, and graceful fallback that NEVER destroys running session aggregates.
 */

import { z } from "zod";
import { groqFetch } from "@/lib/groq";
import {
  CompetencyDimensionId,
  CANONICAL_DIMENSIONS,
  TRACK_WEIGHT_MATRIX,
  InterviewTrackId,
} from "./final-report-generator";

// ══════════════════════════════════════════════════════════════
// 1. ZOD SCHEMAS FOR EVALUATION
// ══════════════════════════════════════════════════════════════

export const EvidenceMarkerSchema = z.object({
  id: z.string(),
  type: z.enum(["demonstrated", "partial", "gap", "repeated_gap"]),
  competency: z.string(),
  detail: z.string(),
  quote: z.string().optional(),
  occurrences: z.number().optional(),
});
export type EvidenceMarker = z.infer<typeof EvidenceMarkerSchema>;

export const SevenDimensionBreakdownSchema = z.object({
  DIM_1_TECH_FUNDAMENTALS: z.number().min(0).max(100),
  DIM_2_PROBLEM_SOLVING: z.number().min(0).max(100),
  DIM_3_PRACTICAL_IMPL: z.number().min(0).max(100),
  DIM_4_SYSTEM_DESIGN: z.number().min(0).max(100),
  DIM_5_PROJECT_EXPERIENCE: z.number().min(0).max(100),
  DIM_6_COMMUNICATION: z.number().min(0).max(100),
  DIM_7_ROLE_RELEVANCE: z.number().min(0).max(100),
});
export type SevenDimensionBreakdown = z.infer<typeof SevenDimensionBreakdownSchema>;

export const PerTurnEvaluationSchema = z.object({
  overall: z.number().min(0).max(100),
  breakdown: SevenDimensionBreakdownSchema,
  hiringSignal: z.enum(["STRONG", "MODERATE", "WEAK", "CRITICAL", "NEUTRAL"]),
  evidenceMarkers: z.array(EvidenceMarkerSchema),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  suggestedAnswer: z.string(),
  scoreReason: z.string(),
  verdict: z.string(),
  isProvisional: z.boolean().default(false),
  timestamp: z.number(),
});
export type PerTurnEvaluation = z.infer<typeof PerTurnEvaluationSchema>;

export interface EvaluationContext {
  messages: Array<{ role: string; content: string }>;
  jd: string;
  resume: string;
  track?: string;
  previousScores?: PerTurnEvaluation[];
  bodyLanguage?: any;
}

// ══════════════════════════════════════════════════════════════
// 2. RUNNING WEIGHTED AGGREGATION FORMULA
// ══════════════════════════════════════════════════════════════

export function computeWeightedOverallScore(
  breakdown: SevenDimensionBreakdown,
  track: string = "fullstack"
): number {
  const normTrack = (
    track in TRACK_WEIGHT_MATRIX ? track : "fullstack"
  ) as InterviewTrackId;
  const weights = TRACK_WEIGHT_MATRIX[normTrack];

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [dimKey, weight] of Object.entries(weights)) {
    const key = dimKey as CompetencyDimensionId;
    const scoreVal = breakdown[key] ?? 0;
    weightedSum += scoreVal * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

export function aggregateSessionEvaluations(
  evaluatedTurns: PerTurnEvaluation[],
  track: string = "fullstack"
): PerTurnEvaluation {
  if (evaluatedTurns.length === 0) {
    const emptyBreakdown: SevenDimensionBreakdown = {
      DIM_1_TECH_FUNDAMENTALS: 0,
      DIM_2_PROBLEM_SOLVING: 0,
      DIM_3_PRACTICAL_IMPL: 0,
      DIM_4_SYSTEM_DESIGN: 0,
      DIM_5_PROJECT_EXPERIENCE: 0,
      DIM_6_COMMUNICATION: 0,
      DIM_7_ROLE_RELEVANCE: 0,
    };
    return {
      overall: 0,
      breakdown: emptyBreakdown,
      hiringSignal: "NEUTRAL",
      evidenceMarkers: [],
      strengths: [],
      improvements: [],
      suggestedAnswer: "",
      scoreReason: "Awaiting first technical answer",
      verdict: "Ready for evaluation",
      isProvisional: true,
      timestamp: Date.now(),
    };
  }

  // Filter out non-technical/intro turns if any slipped in
  const technicalTurns = evaluatedTurns.filter((t) => !t.isProvisional || t.overall > 0);
  const activeTurns = technicalTurns.length > 0 ? technicalTurns : evaluatedTurns;

  const n = activeTurns.length;
  const avgBreakdown: SevenDimensionBreakdown = {
    DIM_1_TECH_FUNDAMENTALS: Math.round(
      activeTurns.reduce((acc, t) => acc + t.breakdown.DIM_1_TECH_FUNDAMENTALS, 0) / n
    ),
    DIM_2_PROBLEM_SOLVING: Math.round(
      activeTurns.reduce((acc, t) => acc + t.breakdown.DIM_2_PROBLEM_SOLVING, 0) / n
    ),
    DIM_3_PRACTICAL_IMPL: Math.round(
      activeTurns.reduce((acc, t) => acc + t.breakdown.DIM_3_PRACTICAL_IMPL, 0) / n
    ),
    DIM_4_SYSTEM_DESIGN: Math.round(
      activeTurns.reduce((acc, t) => acc + t.breakdown.DIM_4_SYSTEM_DESIGN, 0) / n
    ),
    DIM_5_PROJECT_EXPERIENCE: Math.round(
      activeTurns.reduce((acc, t) => acc + t.breakdown.DIM_5_PROJECT_EXPERIENCE, 0) / n
    ),
    DIM_6_COMMUNICATION: Math.round(
      activeTurns.reduce((acc, t) => acc + t.breakdown.DIM_6_COMMUNICATION, 0) / n
    ),
    DIM_7_ROLE_RELEVANCE: Math.round(
      activeTurns.reduce((acc, t) => acc + t.breakdown.DIM_7_ROLE_RELEVANCE, 0) / n
    ),
  };

  const overall = computeWeightedOverallScore(avgBreakdown, track);
  const latestTurn = activeTurns[activeTurns.length - 1];

  let hiringSignal: "STRONG" | "MODERATE" | "WEAK" | "CRITICAL" | "NEUTRAL" = "NEUTRAL";
  if (overall >= 78) hiringSignal = "STRONG";
  else if (overall >= 60) hiringSignal = "MODERATE";
  else if (overall >= 40) hiringSignal = "WEAK";
  else hiringSignal = "CRITICAL";

  // Aggregate markers (up to 10 most recent)
  const allMarkers = activeTurns.flatMap((t) => t.evidenceMarkers).slice(-10);
  const allStrengths = Array.from(new Set(activeTurns.flatMap((t) => t.strengths))).slice(-5);
  const allImprovements = Array.from(new Set(activeTurns.flatMap((t) => t.improvements))).slice(-4);

  return {
    overall,
    breakdown: avgBreakdown,
    hiringSignal,
    evidenceMarkers: allMarkers,
    strengths: allStrengths,
    improvements: allImprovements,
    suggestedAnswer: latestTurn.suggestedAnswer,
    scoreReason: latestTurn.scoreReason,
    verdict: `Live aggregate across ${n} evaluated technical turns. Current hiring signal: ${hiringSignal}.`,
    isProvisional: false,
    timestamp: Date.now(),
  };
}

// ══════════════════════════════════════════════════════════════
// 3. PER-TURN EVALUATION ENGINE WITH RETRY & GUARDS
// ══════════════════════════════════════════════════════════════

export async function evaluateTurn(ctx: EvaluationContext): Promise<PerTurnEvaluation> {
  const { messages, jd, resume, track = "fullstack" } = ctx;
  const userMsgs = messages.filter((m) => m.role === "user");
  const n = userMsgs.length;

  if (n === 0) {
    return aggregateSessionEvaluations([], track);
  }

  const lastQ =
    messages.filter((m) => m.role === "assistant").slice(-1)[0]?.content || "";
  const lastA = userMsgs[n - 1].content.trim();
  const wordCount = lastA.split(/\s+/).filter(Boolean).length;

  // Guard 1: Opening greeting / introduction turn
  const isIntro =
    /introduction|tell me about yourself|welcome to cognalyze/i.test(lastQ) ||
    /your ai interviewer today/i.test(lastQ) ||
    (n === 1 && wordCount < 60);

  if (isIntro && n === 1) {
    return {
      overall: 0,
      breakdown: {
        DIM_1_TECH_FUNDAMENTALS: 0,
        DIM_2_PROBLEM_SOLVING: 0,
        DIM_3_PRACTICAL_IMPL: 0,
        DIM_4_SYSTEM_DESIGN: 0,
        DIM_5_PROJECT_EXPERIENCE: 0,
        DIM_6_COMMUNICATION: 0,
        DIM_7_ROLE_RELEVANCE: 0,
      },
      hiringSignal: "NEUTRAL",
      evidenceMarkers: [],
      strengths: ["Candidate introduction received clearly."],
      improvements: [],
      suggestedAnswer: "",
      scoreReason: "Candidate introduction received. Technical scoring starts on Question 1.",
      verdict: "Introduction recorded. Commencing technical rounds.",
      isProvisional: true,
      timestamp: Date.now(),
    };
  }

  // Guard 2: Candidate deferral ("I don't know", "no idea", "pass")
  const isDecline =
    /^(i don'?t know|no idea|not sure|pass|skip|haven'?t used that|never worked with that)/i.test(
      lastA
    ) && wordCount < 20;

  if (isDecline) {
    const deferralBreakdown: SevenDimensionBreakdown = {
      DIM_1_TECH_FUNDAMENTALS: 40,
      DIM_2_PROBLEM_SOLVING: 30,
      DIM_3_PRACTICAL_IMPL: 30,
      DIM_4_SYSTEM_DESIGN: 30,
      DIM_5_PROJECT_EXPERIENCE: 40,
      DIM_6_COMMUNICATION: 80, // High communication score for honest candor
      DIM_7_ROLE_RELEVANCE: 40,
    };
    const turnScore = computeWeightedOverallScore(deferralBreakdown, track);

    const deferralTurn: PerTurnEvaluation = {
      overall: turnScore,
      breakdown: deferralBreakdown,
      hiringSignal: "NEUTRAL",
      evidenceMarkers: [
        {
          id: `ev_deferral_${Date.now()}`,
          type: "partial",
          competency: "Technical Candor & Communication",
          detail: "Candidate clearly acknowledged unfamiliarity with the topic. Handled with professional candor.",
          quote: lastA.slice(0, 100),
        },
      ],
      strengths: ["Upfront and honest communication regarding unfamiliar technical domain."],
      improvements: ["Explore foundational concepts in this area."],
      suggestedAnswer: "In production, if unfamiliar with a specific tool, explain the underlying architectural principle or protocol you would use.",
      scoreReason: "Candid acknowledgment of unfamiliarity. Graded with high communication marks without technical fabrication.",
      verdict: "Topic deferred candidly. Pivoting to alternative competency.",
      isProvisional: true,
      timestamp: Date.now(),
    };

    const prev = ctx.previousScores || [];
    return aggregateSessionEvaluations([...prev, deferralTurn], track);
  }

  // Prompt Construction for Groq LLM
  const prompt = `You are a Senior Principal Engineer evaluating a technical interview turn against 7 canonical dimensions.

CANDIDATE BACKGROUND:
${resume.slice(0, 400)}

JOB REQUIREMENTS:
${jd.slice(0, 300)}

QUESTION ASKED:
"${lastQ.slice(0, 350)}"

CANDIDATE ANSWER (${wordCount} words):
"${lastA}"

CANONICAL 7 DIMENSIONS (Score 0-100 each based strictly on candidate's answer):
1. DIM_1_TECH_FUNDAMENTALS (0-100): Core CS principles, protocols, memory, runtime mechanics.
2. DIM_2_PROBLEM_SOLVING (0-100): Algorithmic decomposition, edge-case analysis, optimization.
3. DIM_3_PRACTICAL_IMPL (0-100): Code quality, concrete syntax, error handling, defensive habits.
4. DIM_4_SYSTEM_DESIGN (0-100): Scalability, caching, persistence, state, trade-off reasoning.
5. DIM_5_PROJECT_EXPERIENCE (0-100): Authentic personal ownership, metrics, real architectural choices.
6. DIM_6_COMMUNICATION (0-100): Structured clarity, precision, conciseness, composure.
7. DIM_7_ROLE_RELEVANCE (0-100): Alignment with JD technologies and domain best practices.

CALIBRATION GUIDELINE:
- 1-5 words or incoherent = 10-25
- Vague buzzword answer without specifics = 30-50
- Solid competent answer with minor omissions = 65-80
- Exceptional staff-level answer with metrics and deep trade-offs = 85-98

RETURN STRICT RAW JSON ONLY (no markdown fences, no explanatory preambles):
{
  "breakdown": {
    "DIM_1_TECH_FUNDAMENTALS": 75,
    "DIM_2_PROBLEM_SOLVING": 70,
    "DIM_3_PRACTICAL_IMPL": 72,
    "DIM_4_SYSTEM_DESIGN": 65,
    "DIM_5_PROJECT_EXPERIENCE": 78,
    "DIM_6_COMMUNICATION": 82,
    "DIM_7_ROLE_RELEVANCE": 80
  },
  "overall": 74,
  "hiringSignal": "STRONG" | "MODERATE" | "WEAK" | "CRITICAL",
  "evidenceMarkers": [
    {
      "id": "ev_1",
      "type": "demonstrated" | "partial" | "gap",
      "competency": "string",
      "detail": "string",
      "quote": "verbatim snippet from answer"
    }
  ],
  "strengths": ["Evidence-backed strength 1", "Evidence-backed strength 2"],
  "improvements": ["Specific actionable improvement"],
  "suggestedAnswer": "Exemplar model answer explaining architectural trade-offs, metrics, and implementation.",
  "scoreReason": "Factual rationale for the scores awarded.",
  "verdict": "Executive summary of candidate demonstration."
}`;

  let parsedTurn: PerTurnEvaluation | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1100,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content?.trim() || "";
      const cleanJson = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const parsed = JSON.parse(cleanJson);
      const validated = PerTurnEvaluationSchema.parse({
        ...parsed,
        timestamp: Date.now(),
        isProvisional: false,
      });

      // Recalculate overall strictly using the track weight matrix
      validated.overall = computeWeightedOverallScore(validated.breakdown, track);
      parsedTurn = validated;
      break;
    } catch (err) {
      console.warn(`Evaluation attempt ${attempt + 1} failed:`, err);
    }
  }

  // If both LLM attempts fail, construct a robust fallback preserving past averages
  if (!parsedTurn) {
    const prevTurns = ctx.previousScores || [];
    if (prevTurns.length > 0) {
      return aggregateSessionEvaluations(prevTurns, track);
    }
    // Baseline safe fallback if first turn fails
    const fallbackBreakdown: SevenDimensionBreakdown = {
      DIM_1_TECH_FUNDAMENTALS: 60,
      DIM_2_PROBLEM_SOLVING: 60,
      DIM_3_PRACTICAL_IMPL: 60,
      DIM_4_SYSTEM_DESIGN: 60,
      DIM_5_PROJECT_EXPERIENCE: 60,
      DIM_6_COMMUNICATION: 65,
      DIM_7_ROLE_RELEVANCE: 60,
    };
    parsedTurn = {
      overall: computeWeightedOverallScore(fallbackBreakdown, track),
      breakdown: fallbackBreakdown,
      hiringSignal: "MODERATE",
      evidenceMarkers: [
        {
          id: `ev_fallback_${Date.now()}`,
          type: "demonstrated",
          competency: "Technical Discussion",
          detail: "Candidate engaged with the technical inquiry.",
          quote: lastA.slice(0, 100),
        },
      ],
      strengths: ["Clear candidate participation"],
      improvements: ["Provide more architectural depth and quantitative metrics."],
      suggestedAnswer: "Provide a structured response beginning with high-level system requirements, followed by data flow, indexing strategies, and failure edge cases.",
      scoreReason: "Provisional evaluation pending deep evidence aggregation.",
      verdict: "Candidate response recorded.",
      isProvisional: true,
      timestamp: Date.now(),
    };
  }

  const allPrevious = ctx.previousScores || [];
  return aggregateSessionEvaluations([...allPrevious, parsedTurn], track);
}

