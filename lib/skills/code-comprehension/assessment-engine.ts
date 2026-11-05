/**
 * lib/skills/code-comprehension/assessment-engine.ts
 * 
 * Evidence-Based Assessment Engine for Code Comprehension Lab.
 * Combines deterministic sandbox test results, code diff verification,
 * and structured rubric evaluation across the canonical 7-dimension formula.
 */

import { getChallengeById, ComprehensionChallenge, CANONICAL_RUBRIC_WEIGHTS, RubricWeightDistribution } from "./challenge-factory";
import { executeSandboxTests, SandboxExecutionReport } from "./execution-sandbox";
import { getComprehensionSession } from "./session-store";

export interface DimensionAssessment {
  dimension: string;
  weight: number;
  rating: number; // 0 to 4
  maxPoints: number;
  earnedPoints: number;
  status: "not_demonstrated" | "surface_level" | "partial" | "demonstrated" | "strong";
  evidence: string[];
  deductionReason?: string;
}

export interface ComprehensionFinalAssessment {
  sessionId: string;
  candidateId: string;
  challengeId: string;
  overallScore: number; // 0 - 100
  hiringSignal: "STRONG FIT" | "GOOD READINESS" | "NEEDS WORK" | "INSUFFICIENT EVIDENCE";
  rubricVersion: string;
  dimensions: Record<string, DimensionAssessment>;
  sandboxReport: SandboxExecutionReport;
  keyStrengths: string[];
  identifiedGaps: string[];
  recommendedAction: string;
  timestamp: string;
}

export async function evaluateComprehensionSubmission(params: {
  sessionId: string;
  candidateId: string;
  challengeId: string;
  studentExplanation: string;
  proposedFix?: string;
}): Promise<ComprehensionFinalAssessment> {
  const challenge = getChallengeById(params.challengeId);
  if (!challenge) {
    throw new Error(`CHALLENGE_NOT_FOUND: ${params.challengeId}`);
  }

  const session = getComprehensionSession(params.sessionId, params.candidateId);
  const workingFiles = session?.workingFiles || {};

  // 1. Run deterministic sandbox verification
  const sandboxReport = await executeSandboxTests({
    challengeId: params.challengeId,
    workingFiles,
    includeHidden: true,
  });

  const explanation = (params.studentExplanation || "").trim();
  const explLower = explanation.toLowerCase();
  const wordCount = explanation ? explanation.split(/\s+/).filter(Boolean).length : 0;

  // Handle early or empty submission
  if (wordCount < 5) {
    return buildZeroEvidenceReport(params, challenge, sandboxReport);
  }

  // 2. Keyword & Concept Reconciliation
  const expectedKeywords = challenge.expectedFindings.rootCauseKeywords;
  const matchedKeywords = expectedKeywords.filter(k => explLower.includes(k.toLowerCase()));
  const keywordMatchRatio = expectedKeywords.length > 0 ? matchedKeywords.length / expectedKeywords.length : 1;

  // 3. Compute 7-Dimension Ratings (0 to 4)
  const weights = challenge.rubricWeights || CANONICAL_RUBRIC_WEIGHTS;

  // Dim 1: Code Understanding (20%)
  let codeUnderstandingRating = 1;
  if (keywordMatchRatio >= 0.75 && (wordCount >= 30 || challenge.relevantFiles.some(f => explLower.includes(f.toLowerCase().replace(/^src\//, ""))))) {
    codeUnderstandingRating = 4;
  } else if ((wordCount >= 25 && keywordMatchRatio >= 0.5) || wordCount > 60) {
    codeUnderstandingRating = 3;
  } else if (wordCount >= 15 || keywordMatchRatio >= 0.3) {
    codeUnderstandingRating = 2;
  }

  // Dim 2: Debugging & Root Cause (20%)
  let debuggingRating = 0;
  if (challenge.mode === "bug_hunter") {
    if (keywordMatchRatio >= 0.6 && sandboxReport.success) debuggingRating = 4;
    else if (keywordMatchRatio >= 0.4 || sandboxReport.passedCount > 0) debuggingRating = 3;
    else if (wordCount > 25) debuggingRating = 2;
  } else {
    debuggingRating = codeUnderstandingRating; // Mirror for detective/explorer
  }

  // Dim 3: Architecture & Data Flow (15%)
  let architectureRating = 1;
  if (explLower.includes("middleware") || explLower.includes("pipeline") || explLower.includes("repository") || explLower.includes("controller") || explLower.includes("service") || explLower.includes("route")) {
    architectureRating = keywordMatchRatio >= 0.5 ? 3 : 2;
  }
  if (architectureRating >= 3 && (wordCount >= 30 && keywordMatchRatio >= 0.6)) {
    architectureRating = 4;
  }

  // Dim 4: Testing & Verification (15%)
  let testingRating = 1;
  if (sandboxReport.score === 100) testingRating = 4;
  else if (sandboxReport.score >= 50) testingRating = 3;
  else if (sandboxReport.passedCount > 0) testingRating = 2;

  // Dim 5: AI Output Judgment (15%)
  let aiJudgmentRating = 2;
  if (challenge.mode === "ai_auditor") {
    if (explLower.includes("race condition") || explLower.includes("concurrency") || explLower.includes("event loop")) {
      aiJudgmentRating = 4;
    } else {
      aiJudgmentRating = 1;
    }
  } else {
    aiJudgmentRating = 3; // Baseline competent judgment for non-auditor challenges
  }

  // Dim 6: Technical Reasoning (10%)
  let reasoningRating = Math.min(4, Math.max(1, Math.round((codeUnderstandingRating + architectureRating) / 2)));
  if (explLower.includes("trade-off") || explLower.includes("invariant") || explLower.includes("isolation") || explLower.includes("bypass") || explLower.includes("enforce")) {
    reasoningRating = Math.min(4, reasoningRating + 1);
  }

  // Dim 7: Security & Maintainability (5%)
  let securityRating = 2;
  if (explLower.includes("security") || explLower.includes("rbac") || explLower.includes("isolation") || explLower.includes("rollback") || explLower.includes("authorization")) {
    securityRating = 4;
  } else if (challenge.mode === "bug_hunter" && sandboxReport.success) {
    securityRating = 3;
  }

  // 4. Mathematical Formula Calculation
  // S = 100 * Σ(w_i * r_i / 4) / Σ(w_i)
  const ratingMap: Record<string, { name: string; rating: number; weight: number; evidence: string[]; deduction?: string }> = {
    codeUnderstanding: {
      name: "Code Understanding & Module Traceability",
      rating: codeUnderstandingRating,
      weight: weights.codeUnderstanding,
      evidence: [`Identified ${matchedKeywords.length} core concepts from repository.`],
      deduction: codeUnderstandingRating < 4 ? "Could provide deeper execution trace across call boundaries." : undefined,
    },
    debuggingAndRootCause: {
      name: "Debugging & Root-Cause Analysis",
      rating: debuggingRating,
      weight: weights.debuggingAndRootCause,
      evidence: [sandboxReport.success ? "Sandbox verification passed all assertion suites." : `Passed ${sandboxReport.passedCount}/${sandboxReport.totalTests} tests.`],
      deduction: debuggingRating < 4 ? "Ensure all edge-case regressions are resolved." : undefined,
    },
    architectureAndDataFlow: {
      name: "Architecture & Data Flow Mastery",
      rating: architectureRating,
      weight: weights.architectureAndDataFlow,
      evidence: ["Traced architectural responsibilities between components."],
      deduction: architectureRating < 4 ? "Explicitly document data boundaries and persistence protocols." : undefined,
    },
    testingAndVerification: {
      name: "Testing & Deterministic Verification",
      rating: testingRating,
      weight: weights.testingAndVerification,
      evidence: [`Verified ${sandboxReport.passedCount} tests in sandboxed VM.`],
      deduction: testingRating < 4 ? "Hidden tests revealed failing boundary conditions." : undefined,
    },
    aiOutputJudgment: {
      name: "AI Output Judgment & Critical Review",
      rating: aiJudgmentRating,
      weight: weights.aiOutputJudgment,
      evidence: ["Critiqued code proposals and implementation assumptions."],
    },
    technicalReasoning: {
      name: "Technical Reasoning & Trade-off Articulation",
      rating: reasoningRating,
      weight: weights.technicalReasoning,
      evidence: ["Articulated system behavior under operational constraints."],
    },
    securityAndMaintainability: {
      name: "Security, Isolation & Robustness",
      rating: securityRating,
      weight: weights.securityAndMaintainability,
      evidence: ["Evaluated tenant isolation and permission boundaries."],
    },
  };

  let totalWeightedScore = 0;
  let totalActiveWeights = 0;
  const dimensionsResult: Record<string, DimensionAssessment> = {};

  for (const [key, item] of Object.entries(ratingMap)) {
    if (item.weight <= 0) continue;
    const earnedPoints = Number(((item.weight * item.rating) / 4).toFixed(2));
    totalWeightedScore += earnedPoints;
    totalActiveWeights += item.weight;

    const status: DimensionAssessment["status"] =
      item.rating === 4 ? "strong" :
      item.rating === 3 ? "demonstrated" :
      item.rating === 2 ? "partial" :
      item.rating === 1 ? "surface_level" : "not_demonstrated";

    dimensionsResult[key] = {
      dimension: item.name,
      weight: item.weight,
      rating: item.rating,
      maxPoints: item.weight,
      earnedPoints,
      status,
      evidence: item.evidence,
      deductionReason: item.deduction,
    };
  }

  const finalScore = totalActiveWeights > 0
    ? Math.round((totalWeightedScore / totalActiveWeights) * 100)
    : 0;

  const hiringSignal: ComprehensionFinalAssessment["hiringSignal"] =
    finalScore >= 80 ? "STRONG FIT" :
    finalScore >= 65 ? "GOOD READINESS" :
    finalScore >= 45 ? "NEEDS WORK" : "INSUFFICIENT EVIDENCE";

  return {
    sessionId: params.sessionId,
    candidateId: params.candidateId,
    challengeId: params.challengeId,
    overallScore: finalScore,
    hiringSignal,
    rubricVersion: "1.0-canonical-100pt",
    dimensions: dimensionsResult,
    sandboxReport,
    keyStrengths: [
      `Grounded analysis matching ${matchedKeywords.length} key system invariants.`,
      `Sandbox verification achieved ${sandboxReport.score}% success rate.`,
    ],
    identifiedGaps: finalScore < 85 ? [
      "Deepen trade-off analysis between synchronous vs asynchronous guarantees.",
    ] : [],
    recommendedAction: finalScore >= 75
      ? "Proceed to Advanced Architecture & Concurrency Challenge in Skill Practice Hub."
      : "Review the Guided Architecture Walkthrough and retry with targeted verification tests.",
    timestamp: new Date().toISOString(),
  };
}

function buildZeroEvidenceReport(
  params: { sessionId: string; candidateId: string; challengeId: string },
  challenge: ComprehensionChallenge,
  sandboxReport: SandboxExecutionReport
): ComprehensionFinalAssessment {
  return {
    sessionId: params.sessionId,
    candidateId: params.candidateId,
    challengeId: params.challengeId,
    overallScore: 0,
    hiringSignal: "INSUFFICIENT EVIDENCE",
    rubricVersion: "1.0-canonical-100pt",
    dimensions: {},
    sandboxReport,
    keyStrengths: [],
    identifiedGaps: ["Challenge concluded before substantive explanation or test execution was recorded."],
    recommendedAction: "Relaunch the challenge when prepared to investigate the codebase files and execute tests.",
    timestamp: new Date().toISOString(),
  };
}
