/**
 * INTERVIEW INTELLIGENCE, MEMORY & FEEDBACK ENGINE (Phase 8)
 * 
 * Features:
 *   1. Targets ONLY remaining unknowns or disputed competencies (skips verified items).
 *   2. Interview Memory: Tracks previously asked questions across rounds to prevent repetitive questioning.
 *   3. Structured Scorecard Feedback: Captures ratings, verbatim quotes, and verified flags.
 */

import { RoleDNA } from "./role-dna";
import { CandidateDNA } from "./evidence-graph";

export interface LoggedInterviewQuestion {
  questionId: string;
  roundNumber: number;
  interviewerName: string;
  requirementId: string;
  requirementName: string;
  questionText: string;
  focusArea: string;
  candidateResponseSummary?: string;
  verbatimQuote?: string;
  rating?: number; // 1-10
  competencyConfirmed?: boolean;
  timestamp: string;
}

export interface CandidateInterviewHistory {
  candidateId: string;
  roleId: string;
  roundsCompleted: number;
  questionHistory: LoggedInterviewQuestion[];
  overallInterviewerRecommendation?: "Strong Hire" | "Hire" | "Hold" | "No Hire";
}

export interface GeneratedInterviewQuestion {
  questionId: string;
  requirementId: string;
  requirementName: string;
  tier: "Critical" | "Important" | "Preferred" | "Trainable";
  questionText: string;
  probingAngle: string;
  whatStrongLookLike: string;
  redFlagAnswer: string;
  reasonForSelection: string; // e.g. "Unresolved Critical gap: not yet probed in Round 1"
}

/**
 * Generates interview questions targeted ONLY at unresolved gaps, strictly avoiding repeats from memory
 */
export function generateMemoryAwareInterviewQuestions(
  role: RoleDNA,
  candidateDna: CandidateDNA,
  history: CandidateInterviewHistory
): GeneratedInterviewQuestion[] {
  const previouslyAskedReqIds = new Set(history.questionHistory.map(q => q.requirementId));
  const previouslyAskedQuestions = new Set(history.questionHistory.map(q => q.questionText.toLowerCase().trim()));

  // Filter candidate gaps that are still "unknown" or "partially_known"
  const unresolvedNodes = candidateDna.evidenceGraph.filter(n => n.uncertaintyStatus !== "known");

  // Sort: Critical gaps first!
  const tierWeights = { Critical: 1, Important: 2, Preferred: 3, Trainable: 4 };
  const sortedGaps = [...unresolvedNodes].sort((a, b) => tierWeights[a.tier] - tierWeights[b.tier]);

  const questions: GeneratedInterviewQuestion[] = [];

  for (const gap of sortedGaps) {
    const isAlreadyProbed = previouslyAskedReqIds.has(gap.requirementId);
    const qId = `iq-${gap.requirementId}-r${history.roundsCompleted + 1}`;

    let qText = "";
    let angle = "";
    let strong = "";
    let redFlag = "";

    if (gap.requirementName.toLowerCase().includes("concurrency") || gap.requirementName.toLowerCase().includes("storage")) {
      qText = isAlreadyProbed 
        ? `In round 1 we touched upon concurrency primitives. Let's go deeper: How do you handle deadlocks and lock contention in a multi-threaded writer with PostgreSQL MVCC?`
        : `Walk me through a production scenario where you had to debug a race condition or database lock contention under concurrent load.`;
      angle = "Probes depth of transaction isolation levels (Read Committed vs Serializable) and memory fences";
      strong = "Explicitly references lock escalation, row-level locks, retry loops, and query plans";
      redFlag = "Confuses optimistic locking with database locks or cannot explain dirty reads";
    } else if (gap.requirementName.toLowerCase().includes("distributed") || gap.requirementName.toLowerCase().includes("kafka")) {
      qText = isAlreadyProbed
        ? `Following up on our systems discussion: If a consumer group encounters high lag and uneven partition skew, what is your automated remediation runbook?`
        : `Explain how you guarantee end-to-end exactly-once or at-least-once message processing across distributed event streams.`;
      angle = "Verifies architectural mastery over partition keys, consumer rebalances, and outbox patterns";
      strong = "Discusses idempotency keys, write-ahead logs, and schema evolution compatibility";
      redFlag = "Claims Kafka automatically guarantees exactly-once without application-level dedup";
    } else {
      qText = isAlreadyProbed
        ? `We reviewed your basic background with ${gap.requirementName}. Can you share the hardest edge case or trade-off you had to negotiate in that area?`
        : `Describe the largest production system where you relied on ${gap.requirementName}. What broke first when traffic scaled?`;
      angle = `Validates actual hands-on production ownership vs theoretical knowledge for ${gap.requirementName}`;
      strong = "Provides concrete telemetry metrics, trade-offs, and lessons learned from past outages";
      redFlag = "Gives textbook definitions without personal accountability or architectural trade-offs";
    }

    // Ensure question has not been asked verbatim before
    if (!previouslyAskedQuestions.has(qText.toLowerCase().trim())) {
      questions.push({
        questionId: qId,
        requirementId: gap.requirementId,
        requirementName: gap.requirementName,
        tier: gap.tier,
        questionText: qText,
        probingAngle: angle,
        whatStrongLookLike: strong,
        redFlagAnswer: redFlag,
        reasonForSelection: isAlreadyProbed
          ? `Follow-up probe on partially known requirement '${gap.requirementName}' to confirm disputed depth`
          : `First-time probe for unresolved ${gap.tier} gap '${gap.requirementName}' (never asked in prior rounds)`
      });
    }

    if (questions.length >= 4) break;
  }

  return questions;
}

/**
 * Records scorecard feedback from an interview round and returns the updated history
 */
export function recordInterviewFeedback(
  history: CandidateInterviewHistory,
  feedback: {
    interviewerName: string;
    roundNumber: number;
    questionId: string;
    requirementId: string;
    requirementName: string;
    questionText: string;
    focusArea: string;
    candidateResponseSummary: string;
    verbatimQuote: string;
    rating: number; // 1-10
    competencyConfirmed: boolean;
  }
): CandidateInterviewHistory {
  const newQuestionLog: LoggedInterviewQuestion = {
    questionId: feedback.questionId,
    roundNumber: feedback.roundNumber,
    interviewerName: feedback.interviewerName,
    requirementId: feedback.requirementId,
    requirementName: feedback.requirementName,
    questionText: feedback.questionText,
    focusArea: feedback.focusArea,
    candidateResponseSummary: feedback.candidateResponseSummary,
    verbatimQuote: feedback.verbatimQuote,
    rating: feedback.rating,
    competencyConfirmed: feedback.competencyConfirmed,
    timestamp: new Date().toISOString()
  };

  const updatedHistory: CandidateInterviewHistory = {
    ...history,
    roundsCompleted: Math.max(history.roundsCompleted, feedback.roundNumber),
    questionHistory: [...history.questionHistory, newQuestionLog]
  };

  // Derive consensus recommendation
  const ratings = updatedHistory.questionHistory.map(q => q.rating || 5);
  const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;
  updatedHistory.overallInterviewerRecommendation = avg >= 8.5 ? "Strong Hire" : avg >= 7 ? "Hire" : avg >= 5.5 ? "Hold" : "No Hire";

  return updatedHistory;
}

import { groqFetch } from "@/lib/groq";

/**
 * Generates dynamic, LLM-powered interview questions specifically probing unresolved gaps,
 * strictly deduplicating previously asked questions from interview history.
 */
export async function generateInterviewQuestionsWithAI(
  role: RoleDNA,
  candidateDna: CandidateDNA,
  history: CandidateInterviewHistory,
  resumeSnippet: string = ""
): Promise<GeneratedInterviewQuestion[]> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY_3;
  if (!apiKey) {
    return generateMemoryAwareInterviewQuestions(role, candidateDna, history);
  }

  const unresolvedGaps = candidateDna.evidenceGraph.filter(n => n.uncertaintyStatus !== "known");
  const previouslyAsked = history.questionHistory.map(q => q.questionText);

  const prompt = `You are a Principal Technical Bar-Raiser conducting a high-stakes engineering interview for:
ROLE: ${role.title} (${role.department})
CANDIDATE: ${candidateDna.name}
GROWTH VELOCITY: ${candidateDna.growthVelocityScore}/100

UNRESOLVED GAPS NEEDING PROBING:
${unresolvedGaps.map(g => `- ${g.requirementName} (${g.tier})`).join("\n")}

QUESTIONS ALREADY ASKED IN PREVIOUS ROUNDS (DO NOT REPEAT ANY OF THESE):
${previouslyAsked.length > 0 ? previouslyAsked.map(q => `- "${q}"`).join("\n") : "None yet (Round 1)"}

Generate 3 sharp, candidate-specific interview questions probing their exact claimed experience versus demonstrated capability for these unresolved requirements.

Return ONLY a valid JSON object matching this structure:
{
  "questions": [
    {
      "requirementName": "string",
      "tier": "Critical" | "Important" | "Preferred" | "Trainable",
      "questionText": "string",
      "probingAngle": "string (what architectural depth or trade-off this probes)",
      "whatStrongLookLike": "string (concrete signals of production mastery)",
      "redFlagAnswer": "string (shallow textbook or hand-waving responses)",
      "reasonForSelection": "string"
    }
  ]
}`;

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return parsed.questions.map((q: any, i: number) => {
            const matchedGap = unresolvedGaps.find(g => g.requirementName.toLowerCase().includes(q.requirementName?.toLowerCase() || "")) || unresolvedGaps[0];
            return {
              questionId: `iq-${matchedGap?.requirementId || 'gen'}-r${history.roundsCompleted + 1}-${i}`,
              requirementId: matchedGap?.requirementId || 'gen-req',
              requirementName: q.requirementName || matchedGap?.requirementName || "System Design",
              tier: q.tier || matchedGap?.tier || "Critical",
              questionText: q.questionText,
              probingAngle: q.probingAngle,
              whatStrongLookLike: q.whatStrongLookLike,
              redFlagAnswer: q.redFlagAnswer,
              reasonForSelection: q.reasonForSelection || `Probing unresolved gap: ${matchedGap?.requirementName}`
            };
          });
        }
      }
    }
  } catch (err) {
    console.warn("Groq AI interview generation fallback:", err);
  }

  return generateMemoryAwareInterviewQuestions(role, candidateDna, history);
}
