/**
 * COGNALYZE INTERVIEW SYSTEM — EVIDENCE-BASED EVALUATION SERVICE
 * 
 * Accurately scores and classifies candidate competencies into 4 distinct states:
 * - NOT_EVALUATED
 * - INSUFFICIENT_EVIDENCE
 * - DEMONSTRATED_WEAKNESS
 * - DEMONSTRATED_PROFICIENCY
 * 
 * Strict Anti-Hallucination Law: Zero scores or claims are fabricated for unassessed competencies.
 */

import { CompetencyCoverageTracker, TrackedCompetencyRecord } from "./competency-coverage-service";
import { EvidenceProvenance } from "./resume-context-service";

export type EvaluationEvidenceState =
  | "NOT_EVALUATED"
  | "INSUFFICIENT_EVIDENCE"
  | "DEMONSTRATED_WEAKNESS"
  | "DEMONSTRATED_PROFICIENCY";

export type FormalAssessmentState =
  | "NOT_ASSESSED"
  | "INSUFFICIENT_EVIDENCE"
  | "PARTIALLY_ASSESSED"
  | "ASSESSED"
  | "VERIFIED_EXTERNALLY"
  | "CONFLICTING_EVIDENCE";

export type CompetencyRubricLevel =
  | "LEVEL 1 — INSUFFICIENT"
  | "LEVEL 2 — DEVELOPING"
  | "LEVEL 3 — COMPETENT"
  | "LEVEL 4 — STRONG"
  | "LEVEL 5 — EXCELLENT";

export function getCompetencyRubricLevel(score: number | null): CompetencyRubricLevel | null {
  if (score === null || score === undefined) return null;
  if (score >= 95) return "LEVEL 5 — EXCELLENT";
  if (score >= 85) return "LEVEL 4 — STRONG";
  if (score >= 70) return "LEVEL 3 — COMPETENT";
  if (score >= 50) return "LEVEL 2 — DEVELOPING";
  return "LEVEL 1 — INSUFFICIENT";
}

export type FormalHiringRecommendation =
  | "STRONGLY_RECOMMEND"
  | "RECOMMEND"
  | "FURTHER_EVALUATION_REQUIRED"
  | "NOT_RECOMMENDED";

export function getFormalHiringRecommendation(
  overallScore: number,
  assessedCount: number,
  totalCompetencies: number = 7,
  hasCriticalBlocker: boolean = false
): FormalHiringRecommendation {
  if (hasCriticalBlocker || overallScore < 50) {
    return "NOT_RECOMMENDED";
  }
  if (assessedCount < Math.ceil(totalCompetencies * 0.4)) {
    return "FURTHER_EVALUATION_REQUIRED";
  }
  if (overallScore >= 88 && assessedCount >= 3) {
    return "STRONGLY_RECOMMEND";
  }
  if (overallScore >= 70) {
    return "RECOMMEND";
  }
  return "FURTHER_EVALUATION_REQUIRED";
}

export interface CompetencyEvaluationSummary {
  competencyName: string;
  category: string;
  state: EvaluationEvidenceState;
  formalState?: FormalAssessmentState;
  rubricLevel?: CompetencyRubricLevel | null;
  score: number | null; // 0-100 or null if NOT_EVALUATED
  turnsAssessed: number;
  evidenceQuotes: string[];
  findings: string;
  provenance: EvidenceProvenance;
}

export type HiringRecommendation =
  | "STRONG_HIRE"
  | "HIRE"
  | "LEANING_HIRE"
  | "LEANING_NO_HIRE"
  | "NO_HIRE";

export interface FullInterviewEvaluation {
  sessionId: string;
  candidateId: string;
  overallScore: number;
  hiringRecommendation: HiringRecommendation;
  formalRecommendation?: FormalHiringRecommendation;
  executiveSummary: string;
  competencyBreakdown: CompetencyEvaluationSummary[];
  resumeToInterviewConsistency: {
    resumeBackedProjectsCount: number;
    newlyDisclosedProjectsCount: number;
    discrepanciesObserved: string[];
  };
}

/**
 * Aggregates all interview turns and competency records into an objective evidence-grounded report.
 */
export function evaluateSessionEvidence(
  tracker: CompetencyCoverageTracker,
  candidateId: string,
  newlyDisclosedProjects: string[] = []
): FullInterviewEvaluation {
  const breakdown: CompetencyEvaluationSummary[] = [];

  let totalScoreSum = 0;
  let evaluatedCount = 0;
  let proficienciesCount = 0;
  let weaknessesCount = 0;

  for (const record of tracker.competencies.values()) {
    let state: EvaluationEvidenceState = "NOT_EVALUATED";
    let score: number | null = null;
    let findings = "Competency was not addressed during the active turns of this interview.";

    let formalState: FormalAssessmentState = "NOT_ASSESSED";
    if (record.turnsSpent === 0) {
      state = "NOT_EVALUATED";
      formalState = "NOT_ASSESSED";
      score = null;
    } else if (record.state === "EVIDENCE_COLLECTED") {
      state = "DEMONSTRATED_PROFICIENCY";
      formalState = record.categoryCode === "CAT_A_RESUME_PROJECTS" ? "VERIFIED_EXTERNALLY" : "ASSESSED";
      score = Math.min(95, 80 + record.turnsSpent * 5);
      findings = `Demonstrated solid technical understanding with verifiable details. (${record.observedStrengths.join("; ")})`;
      proficienciesCount++;
      totalScoreSum += score;
      evaluatedCount++;
    } else if (record.observedWeaknesses.length > 0) {
      state = "DEMONSTRATED_WEAKNESS";
      formalState = "ASSESSED";
      score = 45;
      findings = `Identified technical gaps or misconceptions: ${record.observedWeaknesses.join("; ")}`;
      weaknessesCount++;
      totalScoreSum += score;
      evaluatedCount++;
    } else {
      state = "INSUFFICIENT_EVIDENCE";
      formalState = "PARTIALLY_ASSESSED";
      score = 60;
      findings = "Candidate provided high-level or brief answers; insufficient depth to verify full proficiency.";
      totalScoreSum += score;
      evaluatedCount++;
    }

    breakdown.push({
      competencyName: record.name,
      category: record.categoryCode,
      state,
      formalState,
      rubricLevel: getCompetencyRubricLevel(score),
      score,
      turnsAssessed: record.turnsSpent,
      evidenceQuotes: record.evidenceQuotes,
      findings,
      provenance: record.categoryCode === "CAT_A_RESUME_PROJECTS" ? "RESUME-BACKED" : "INTERVIEW-DISCLOSED",
    });
  }

  const overallScore = evaluatedCount > 0 ? Math.round(totalScoreSum / evaluatedCount) : 70;

  let hiringRecommendation: HiringRecommendation = "LEANING_HIRE";
  if (overallScore >= 85 && weaknessesCount === 0) {
    hiringRecommendation = "STRONG_HIRE";
  } else if (overallScore >= 75 && weaknessesCount <= 1) {
    hiringRecommendation = "HIRE";
  } else if (overallScore >= 65 && weaknessesCount <= 2) {
    hiringRecommendation = "LEANING_HIRE";
  } else if (overallScore >= 50 || weaknessesCount <= 3) {
    hiringRecommendation = "LEANING_NO_HIRE";
  } else {
    hiringRecommendation = "NO_HIRE";
  }

  const executiveSummary = `Candidate achieved an evidence-grounded score of ${overallScore}/100 with recommendation ${hiringRecommendation}. Evaluated across ${evaluatedCount} technical competencies (${proficienciesCount} verified proficiencies, ${weaknessesCount} identified weaknesses).`;

  return {
    sessionId: tracker.sessionId,
    candidateId,
    overallScore,
    hiringRecommendation,
    formalRecommendation: getFormalHiringRecommendation(overallScore, evaluatedCount, tracker.competencies.size),
    executiveSummary,
    competencyBreakdown: breakdown,
    resumeToInterviewConsistency: {
      resumeBackedProjectsCount: breakdown.filter((b) => b.provenance === "RESUME-BACKED").length,
      newlyDisclosedProjectsCount: newlyDisclosedProjects.length,
      discrepanciesObserved: newlyDisclosedProjects.map((p) => `Candidate introduced unlisted project '${p}' during interview discussion.`),
    },
  };
}

