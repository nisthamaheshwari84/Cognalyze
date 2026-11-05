/**
 * lib/skills/code-comprehension/dna-adapter.ts
 * 
 * Student DNA & Evidence Pipeline Adapter for Code Comprehension Lab.
 * Transforms finalized assessments into verified Student DNA evidence records,
 * updates competency proficiencies, and triggers Gap Engine actions.
 */

import { addStudentEvidenceRecord, getStudentDNAFull } from "@/lib/dna/store";
import { RawSourceData } from "@/lib/dna/evidence-pipeline";
import { ComprehensionFinalAssessment } from "./assessment-engine";
import { getChallengeById } from "./challenge-factory";

export interface DNASyncResult {
  success: boolean;
  evidenceId?: string;
  competenciesUpdated: string[];
  nextActionRecommendation: string;
}

export async function syncComprehensionAssessmentToDNA(
  assessment: ComprehensionFinalAssessment
): Promise<DNASyncResult> {
  const challenge = getChallengeById(assessment.challengeId);
  const challengeTitle = challenge?.title || "Code Comprehension Assessment";

  // If score is 0 or insufficient evidence, do NOT fabricate proficiency in Student DNA
  if (assessment.overallScore === 0 || assessment.hiringSignal === "INSUFFICIENT EVIDENCE") {
    return {
      success: false,
      competenciesUpdated: [],
      nextActionRecommendation: "Retake the assessment with verified evidence before Student DNA can be certified.",
    };
  }

  // Map 7-dimension evaluation into concrete Student DNA Evidence
  const rawEvidencePayload: RawSourceData = {
    sourceType: "assessment",
    sourceId: assessment.sessionId,
    userId: assessment.candidateId,
    skillRaw: challenge?.codebaseId.includes("nexus") ? "system_design" : "typescript",
    evidenceType: "code_comprehension_lab",
    claim: `Demonstrated ${assessment.overallScore}% proficiency on ${challengeTitle} (${assessment.hiringSignal}).`,
    strength: assessment.overallScore / 100,
    timestamp: assessment.timestamp,
    metadata: {
      score: assessment.overallScore,
      type: "code_comprehension_lab",
      challengeId: assessment.challengeId,
      challengeTitle,
      hiringSignal: assessment.hiringSignal,
      dimensions: assessment.dimensions,
      sandboxScore: assessment.sandboxReport?.score || 0,
      evidenceSnippet: `Verified investigation on ${challengeTitle}. Scored ${assessment.overallScore}/100 across 7 canonical dimensions.`,
    },
  };

  const syncResult = await addStudentEvidenceRecord(assessment.candidateId, rawEvidencePayload);

  const competenciesUpdated: string[] = [
    "Code Comprehension & Execution Tracing",
    "Debugging & Root-Cause Diagnosis",
    "System Architecture & Data Flow",
    "Testing & Automated Verification",
  ];

  if (challenge?.mode === "ai_auditor") {
    competenciesUpdated.push("AI Output Judgment & Code Review");
  }

  return {
    success: syncResult.success,
    evidenceId: syncResult.evidence?.id,
    competenciesUpdated,
    nextActionRecommendation: assessment.recommendedAction,
  };
}
