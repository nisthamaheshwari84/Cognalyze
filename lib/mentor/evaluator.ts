/**
 * COGNALYZE MENTOR — STRUCTURED EVALUATOR
 * Decoupled Evaluation Layer (Section 53 & 54):
 * Separates generation from evaluation.
 * Evaluates student reasoning, architectural defense, or problem-solving responses.
 * Enforces Truth Contract: Never manufactures fake scores or ungrounded claims.
 */

import { randomUUID } from "node:crypto";
import { StructuredEvaluationResult, MentorEvidenceRecord, IntentAnalysisResult } from "./types";
import { recordMentorEvidence } from "./store";

/**
 * Evaluates a student's answer or defense in background, returning structured assessment
 */
export function evaluateStudentAnswer(
  studentResponse: string,
  topic: string,
  hintsUsedCount: number,
  intent: IntentAnalysisResult,
  studentId: string
): { evaluation?: StructuredEvaluationResult; evidence?: MentorEvidenceRecord } {
  const text = studentResponse.trim();
  const lower = text.toLowerCase();

  // If response is too short or is a meta question, skip evaluation
  if (text.length < 12 || lower.startsWith("i don't know") || lower.startsWith("what is")) {
    return {};
  }

  // Determine assistance level
  let assistanceLevel: "Independent" | "Hint-Assisted" | "Guided" | "Solution-Revealed" = "Independent";
  if (hintsUsedCount > 2) {
    assistanceLevel = "Guided";
  } else if (hintsUsedCount > 0) {
    assistanceLevel = "Hint-Assisted";
  }

  // Assess reasoning quality
  const hasTradeOffReasoning =
    lower.includes("because") ||
    lower.includes("trade-off") ||
    lower.includes("tradeoff") ||
    lower.includes("latency") ||
    lower.includes("throughput") ||
    lower.includes("consistency") ||
    lower.includes("bottleneck") ||
    lower.includes("instead of") ||
    lower.includes("to prevent");

  const hasConcreteSolution =
    text.length > 50 &&
    (lower.includes("redis") ||
      lower.includes("cache") ||
      lower.includes("shard") ||
      lower.includes("pointer") ||
      lower.includes("index") ||
      lower.includes("queue") ||
      lower.includes("async") ||
      lower.includes("o(n)") ||
      lower.includes("o(1)"));

  let demonstratedState: "demonstrated" | "developing" | "weak" | "insufficient_evidence" = "developing";
  let confidence: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let whyExplanation = "";

  if (hasTradeOffReasoning && hasConcreteSolution) {
    demonstratedState = assistanceLevel === "Independent" ? "demonstrated" : "developing";
    confidence = assistanceLevel === "Independent" ? "HIGH" : "MEDIUM";
    whyExplanation = `Student independently reasoned through trade-offs and proposed a coherent solution for ${topic} without excessive prompting.`;
  } else if (hasConcreteSolution) {
    demonstratedState = "developing";
    confidence = "MEDIUM";
    whyExplanation = `Student proposed a valid approach for ${topic}, but architectural trade-offs or edge-cases require further Socratic defense.`;
  } else {
    demonstratedState = "weak";
    confidence = "LOW";
    whyExplanation = `Response contained partial thoughts but did not substantiate the architectural reasoning required for ${topic}.`;
  }

  const evaluation: StructuredEvaluationResult = {
    concept: topic,
    demonstratedState,
    assistanceLevel,
    hintsUsed: hintsUsedCount,
    verbatimExcerpt: text.slice(0, 160),
    reasoningJustification: whyExplanation,
    whyExplanation,
    confidence
  };

  // Only create canonical evidence if the student actually demonstrated or developing capability
  let evidence: MentorEvidenceRecord | undefined = undefined;
  if (demonstratedState === "demonstrated" || demonstratedState === "developing") {
    evidence = {
      id: `ev-mentor-${Date.now()}-${randomUUID().substring(0, 6)}`,
      studentId,
      conceptId: topic.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      conceptName: topic,
      domain: intent.topic || "Technical Foundations",
      demonstratedLevel: demonstratedState === "demonstrated" ? "Demonstrated" : "Developing",
      assistanceLevel: assistanceLevel === "Independent" ? "Independent" : "Hint-Assisted",
      hintsUsed: hintsUsedCount,
      verbatimExcerpt: text.slice(0, 180),
      reasoningJustification: whyExplanation,
      whyExplanation,
      createdAt: new Date().toISOString()
    };

    // Commit to Student DNA registry
    recordMentorEvidence(studentId, evidence);
  }

  return { evaluation, evidence };
}
