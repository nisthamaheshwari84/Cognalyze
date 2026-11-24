/**
 * COGNALYZE DSA LEARN — SOCRATIC EVALUATION & AI TUTORING ENGINE (PHASE 6)
 * Integrates with Groq (llama-3.3-70b-versatile via groqFetch / callGroqCatalog)
 * with semantic grading against Essential Ideas and robust heuristic fallback.
 */

import { callGroqCatalog } from "@/lib/groq";
import { getLearningModuleByMicroConceptId } from "./module-registry";
import {
  EssentialIdeaCriterion,
  LearningModule,
  MisconceptionDetector
} from "./content-schemas";

export interface FreeTextEvaluationRequest {
  microConceptId: string;
  userExplanation: string;
  language: "en" | "hinglish";
}

export interface CriterionEvaluationResult {
  criterionId: string;
  conceptLabel: string;
  weightPercentage: number;
  isUnderstood: boolean;
  scoreFraction: number; // 0.0 to 1.0
  matchedEvidence: string;
  missingNuance: string;
}

export interface DetectedMisconceptionResult {
  misconceptionId: string;
  label: string;
  isDetected: boolean;
  evidenceExcerpt?: string;
  remedialAdvice: string;
}

export interface FreeTextEvaluationResponse {
  overallMasteryScore: number; // 0 to 100
  isPassing: boolean;
  criteriaResults: CriterionEvaluationResult[];
  misconceptions: DetectedMisconceptionResult[];
  socraticFeedback: string;
  followUpThoughtChallenge: string;
  evaluationMode: "llm" | "heuristic_fallback";
}

export interface SocraticTutorRequest {
  microConceptId: string;
  userMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  language: "en" | "hinglish";
}

export interface SocraticTutorResponse {
  reply: string;
  mode: "llm" | "fallback";
}

/**
 * Robust heuristic evaluation fallback when network / LLM API is unavailable.
 * Grades semantic presence of key conceptual pillars and detects known misconceptions.
 */
export function evaluateHeuristicFallback(
  req: FreeTextEvaluationRequest,
  module: LearningModule
): FreeTextEvaluationResponse {
  const text = (req.userExplanation || "").toLowerCase();
  const rubric = module.layer9VerificationRubric;

  const criteriaResults: CriterionEvaluationResult[] = [];
  let totalWeightedScore = 0;

  for (const idea of rubric.essentialCoreIdeas) {
    let matchesCount = 0;
    const matchedTokens: string[] = [];

    for (const kw of idea.requiredKeywords) {
      const kwLower = kw.toLowerCase();
      if (text.includes(kwLower)) {
        matchesCount++;
        matchedTokens.push(kw);
      }
    }

    // Fraction is based on semantic match count
    const fraction = idea.requiredKeywords.length > 0
      ? Math.min(1.0, (matchesCount / Math.max(2, idea.requiredKeywords.length * 0.6)))
      : 0.5;

    const isUnderstood = fraction >= 0.6;
    const earnedPoints = fraction * idea.weightPercentage;
    totalWeightedScore += earnedPoints;

    criteriaResults.push({
      criterionId: idea.id,
      conceptLabel: idea.conceptLabel,
      weightPercentage: idea.weightPercentage,
      isUnderstood,
      scoreFraction: Number(fraction.toFixed(2)),
      matchedEvidence: matchesCount > 0
        ? `Identified conceptual references: [${matchedTokens.join(", ")}]`
        : "No direct conceptual evidence detected.",
      missingNuance: isUnderstood
        ? "Concept articulated satisfactorily."
        : `Could be strengthened by explaining: ${idea.semanticExpectation[req.language] || idea.semanticExpectation.en}`
    });
  }

  // Misconception detection
  const misconceptions: DetectedMisconceptionResult[] = [];
  for (const det of rubric.misconceptionDetectors) {
    let triggered = false;
    let triggerMatch = "";

    for (const trig of det.detectionTriggers) {
      if (text.includes(trig.toLowerCase())) {
        triggered = true;
        triggerMatch = trig;
        break;
      }
    }

    // Special case heuristic checks for Kadane
    if (
      det.id.includes("all-negative") &&
      (text.includes("return 0") || text.includes("maxsum = 0") || text.includes("initial 0"))
    ) {
      triggered = true;
      triggerMatch = "assuming maximum sum cannot be negative or returns 0";
    }

    if (triggered) {
      // Penalty for active misconception
      totalWeightedScore = Math.max(0, totalWeightedScore - 15);
    }

    misconceptions.push({
      misconceptionId: det.id,
      label: det.misconceptionLabel,
      isDetected: triggered,
      evidenceExcerpt: triggered ? `Triggered by phrase: "${triggerMatch}"` : undefined,
      remedialAdvice: det.remediationAdvice[req.language] || det.remediationAdvice.en
    });
  }

  const finalScore = Math.round(Math.min(100, Math.max(0, totalWeightedScore)));
  const isPassing = finalScore >= rubric.minimumPassingMasteryScore;

  const socraticFeedback = req.language === "hinglish"
    ? isPassing
      ? `Bahut badiya! Aapne ${finalScore}% score kiya. Kadane's algorithm ke core concepts (negative sum discard aur local vs global peak) aapko bilkul clear hain.`
      : `Aapka score ${finalScore}% raha (Passing: ${rubric.minimumPassingMasteryScore}%). Aapne achha try kiya, par kuch zaroori nuances (jaise all-negative arrays aur 0 par reset ka exact reason) aur clear karne ki zaroorat hai.`
    : isPassing
      ? `Excellent demonstration of understanding! You scored ${finalScore}%. You clearly comprehend the parasitic nature of negative prefixes and the distinction between currSum and maxSum.`
      : `Your mastery score is ${finalScore}% (passing threshold is ${rubric.minimumPassingMasteryScore}%). Consider revising how Kadane handles all-negative inputs and why carrying debt hurts future subarrays.`;

  const followUpThoughtChallenge = req.language === "hinglish"
    ? "Thought Challenge: Agar interview me aapse pucha jaye ki maximum sum subarray ke starting aur ending indices [L, R] bhi print karo, toh aap loop me do pointers kaise track karoge?"
    : "Socratic Thought Challenge: If an interviewer asks you to return the actual starting index L and ending index R of the maximum subarray, where in the loop would you update them?";

  return {
    overallMasteryScore: finalScore,
    isPassing,
    criteriaResults,
    misconceptions,
    socraticFeedback,
    followUpThoughtChallenge,
    evaluationMode: "heuristic_fallback"
  };
}

/**
 * Evaluates a student's free-text explanation using Groq LLaMA-3.3-70B.
 * Seamlessly falls back to heuristic evaluation if offline or rate-limited.
 */
export async function evaluateFreeTextExplanation(
  req: FreeTextEvaluationRequest
): Promise<FreeTextEvaluationResponse> {
  const module = getLearningModuleByMicroConceptId(req.microConceptId);
  if (!module) {
    throw new Error(`Learning module not found for microConceptId "${req.microConceptId}"`);
  }

  const rubric = module.layer9VerificationRubric;

  // Build the LLM Prompt
  const prompt = `You are the Cognalyze DSA Concept Mastery Evaluator.
Your role is to assess a student's free-text explanation of "${module.title.en}".

CRITICAL INSTRUCTION:
Do NOT simply look for exact words. Evaluate genuine technical UNDERSTANDING and conceptual reasoning.
A student may use informal language, analogies, or Hinglish. If their logic is sound, give them full credit.
If they exhibit a misconception or omit a critical invariant, identify it clearly.

TARGET CONCEPT:
${module.title.en} (Micro-concept: ${module.microConceptId})

ESSENTIAL CRITERIA TO GRADE (Weights sum to 100%):
${rubric.essentialCoreIdeas
  .map(
    (c) => `- [${c.id}] "${c.conceptLabel}" (${c.weightPercentage}% weight):
    Expectation: ${c.semanticExpectation.en}
    Keywords/Concepts expected: ${c.requiredKeywords.join(", ")}`
  )
  .join("\n")}

KNOWN MISCONCEPTIONS TO DETECT:
${rubric.misconceptionDetectors
  .map(
    (m) => `- [${m.id}] "${m.misconceptionLabel}":
    Triggers: ${m.detectionTriggers.join(", ")}
    Remedy: ${m.remediationAdvice.en}`
  )
  .join("\n")}

STUDENT'S EXPLANATION (Language: ${req.language}):
"""
${req.userExplanation}
"""

OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure:
{
  "overallMasteryScore": <number 0-100>,
  "isPassing": <boolean, true if overallMasteryScore >= ${rubric.minimumPassingMasteryScore}>,
  "criteriaResults": [
    {
      "criterionId": "<id>",
      "conceptLabel": "<label>",
      "weightPercentage": <number>,
      "isUnderstood": <boolean>,
      "scoreFraction": <number 0.0 to 1.0>,
      "matchedEvidence": "<brief quote or reasoning from student's text>",
      "missingNuance": "<what was missing or good>"
    }
  ],
  "misconceptions": [
    {
      "misconceptionId": "<id>",
      "label": "<label>",
      "isDetected": <boolean>,
      "evidenceExcerpt": "<quote or null>",
      "remedialAdvice": "<advice in student's language (${req.language})>"
    }
  ],
  "socraticFeedback": "<encouraging, constructive review in ${req.language}>",
  "followUpThoughtChallenge": "<a challenging conceptual question in ${req.language}>"
}`;

  try {
    const { text } = await callGroqCatalog({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a strict yet encouraging senior computer science professor and DSA evaluator. Always output pure valid JSON without markdown fences."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500
    });

    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed: FreeTextEvaluationResponse = JSON.parse(cleaned);
    parsed.evaluationMode = "llm";
    return parsed;
  } catch (err: any) {
    console.warn("[evaluateFreeTextExplanation] Falling back to heuristic engine due to:", err.message);
    return evaluateHeuristicFallback(req, module);
  }
}

/**
 * Socratic AI Concept Mentor Chatbot.
 * Answers student questions by asking guiding questions, offering analogies,
 * and maintaining bilingual voice.
 */
export async function generateSocraticTutorReply(
  req: SocraticTutorRequest
): Promise<SocraticTutorResponse> {
  const module = getLearningModuleByMicroConceptId(req.microConceptId);
  const conceptTitle = module ? module.title.en : "DSA Algorithmic Problem Solving";

  const systemPrompt = `You are Cognalyze's Socratic DSA Mentor specializing in "${conceptTitle}".
Your mission is to guide students to genuine conceptual understanding rather than spoon-feeding answers.

GUIDING PRINCIPLES:
1. Socratic Method: When a student asks a question, answer with intuition and an insightful question that nudges them to deduce the next step.
2. Accuracy & Invariants: Never state mathematically incorrect statements. Kadane's algorithm requires O(N) time and O(1) space. It resets when currSum < 0, NOT when an individual number is negative.
3. Language Mode: Converse in ${req.language === "hinglish" ? "natural, conversational Indian English-Hindi (Hinglish in Roman script, e.g. 'Agar sum negative ho gaya toh aage carry karne se nuksan hoga...')" : "clear, encouraging technical English"}.
4. Brevity: Keep responses under 4 paragraphs. Be direct, punchy, and pedagogical.`;

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt }
  ];

  if (req.conversationHistory && req.conversationHistory.length > 0) {
    req.conversationHistory.forEach((msg) => {
      messages.push({ role: msg.role, content: msg.content });
    });
  }

  messages.push({ role: "user", content: req.userMessage });

  try {
    const { text } = await callGroqCatalog({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.3,
      max_tokens: 600
    });

    return {
      reply: text,
      mode: "llm"
    };
  } catch (err: any) {
    console.warn("[generateSocraticTutorReply] LLM failed, using fallback tutor:", err.message);

    // Contextual fallback response
    const fallbackReply = req.language === "hinglish"
      ? `Achha sawaal hai! Yaad rakho ki Kadane's algorithm ka golden rule hai: "Negative running sum hamesha nuksan karwata hai". Agar currSum < 0 ho jaye, toh aage kisi bhi number me usko add karne par total kam hi hoga. Isliye usko 0 par reset kar dete hain. Kya aapko lagta hai ki all-negative array me bhi ye rule kaam karega?`
      : `That's an insightful question! Remember the foundational invariant of Kadane's algorithm: a negative running sum (currSum < 0) is an absolute liability. Adding a negative number S to any future value X always produces S + X < X. Hence, resetting currSum to 0 greedily cuts off the debt. How do you think this invariant holds if every single number in the array is negative?`;

    return {
      reply: fallbackReply,
      mode: "fallback"
    };
  }
}
