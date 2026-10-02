/**
 * COGNALYZE RESULT ENGINE — DETERMINISTIC SCORING ENGINE
 * Computes evidence-weighted alignment score and generates personalized score explanations ("WHY?").
 */

import {
  CanonicalJDRequirement,
  DeterministicScoreBreakdown,
  RequirementEvidenceMatch,
  ScoreCategoryStats,
} from './types';

export const CANONICAL_STATUS_WEIGHTS: Record<string, number> = {
  VERIFIED: 1.0,
  SUPPORTED: 1.0,
  PARTIAL: 0.5,
  CLAIM_ONLY: 0.25,
  CLAIMED: 0.25,
  EVIDENCE_GAP: 0.0,
  SKILL_GAP: 0.0,
  NOT_EVIDENCED: 0.0,
  MISSING: 0.0,
  CONTRADICTED: 0.0,
};

export const CANONICAL_PRIORITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 6,
  IMPORTANT: 3,
  PREFERRED: 1,
  NICE_TO_HAVE: 1,
};

function computeCategoryStats(
  reqs: CanonicalJDRequirement[],
  matches: RequirementEvidenceMatch[]
): ScoreCategoryStats {
  const stats: ScoreCategoryStats = {
    supported: 0,
    partial: 0,
    claimOnly: 0,
    evidenceGap: 0,
    skillGap: 0,
    missing: 0,
    contradicted: 0,
    total: reqs.length,
    categoryScore: 0,
  };

  if (reqs.length === 0) {
    stats.categoryScore = 100;
    return stats;
  }

  let totalValue = 0;
  for (const req of reqs) {
    const match = matches.find((m) => m.requirementId === req.id);
    const status = match ? match.status : 'MISSING';

    switch (status) {
      case 'SUPPORTED':
        stats.supported++;
        break;
      case 'PARTIAL':
        stats.partial++;
        break;
      case 'CLAIM_ONLY':
        stats.claimOnly++;
        break;
      case 'EVIDENCE_GAP':
        stats.evidenceGap++;
        break;
      case 'SKILL_GAP':
        stats.skillGap++;
        break;
      case 'CONTRADICTED':
        stats.contradicted++;
        break;
      default:
        stats.missing++;
        break;
    }

    const val = CANONICAL_STATUS_WEIGHTS[status] ?? 0;
    totalValue += val;
  }

  stats.categoryScore = Math.round((totalValue / reqs.length) * 100);
  return stats;
}

/**
 * Validates score integrity independently (Section 27 & 28).
 * Checks mathematical invariant: supported + partial + claimed + not_evidenced + contradicted = total requirements
 * and asserts that SUM(earned_points) / SUM(possible_points) equals calculated score.
 */
export function validateScoreIntegrity(
  requirements: CanonicalJDRequirement[],
  matches: RequirementEvidenceMatch[],
  calculatedScore: number
): { valid: boolean; error?: string } {
  // 1. Total Ingested Invariant
  const supported = matches.filter((m) => m.status === 'SUPPORTED').length;
  const partial = matches.filter((m) => m.status === 'PARTIAL').length;
  const claimOnly = matches.filter((m) => m.status === 'CLAIM_ONLY').length;
  const evidenceGaps = matches.filter((m) => m.status === 'EVIDENCE_GAP' || m.status === 'MISSING').length;
  const skillGaps = matches.filter((m) => m.status === 'SKILL_GAP').length;
  const contradicted = matches.filter((m) => m.status === 'CONTRADICTED').length;

  const totalEvaluated = supported + partial + claimOnly + evidenceGaps + skillGaps + contradicted;
  if (totalEvaluated !== requirements.length) {
    return {
      valid: false,
      error: `SCORE_VALIDATION_ERROR: Evaluated matches count (${totalEvaluated}) != Total JD requirements (${requirements.length}).`,
    };
  }

  // 2. Exact Points Audit (Section 27 & 28)
  const sumEarned = matches.reduce((sum, m) => sum + (m.earned_points ?? 0), 0);
  const sumPossible = matches.reduce((sum, m) => sum + (m.possible_points ?? 0), 0);
  const expectedPointsScore = sumPossible > 0 ? Math.round((sumEarned / sumPossible) * 100) : 0;

  if (calculatedScore !== expectedPointsScore) {
    return {
      valid: false,
      error: `SCORE_AUDIT_MISMATCH: Calculated score (${calculatedScore}) does not match exact points ratio SUM(earned)/SUM(possible) (${expectedPointsScore}). Earned: ${sumEarned}, Possible: ${sumPossible}.`,
    };
  }

  return { valid: true };
}

/**
 * Computes the canonical deterministic score and breakdown.
 */
export function calculateDeterministicScore(
  requirements: CanonicalJDRequirement[],
  matches: RequirementEvidenceMatch[]
): DeterministicScoreBreakdown {
  const criticalReqs = requirements.filter((r) => r.priority === 'CRITICAL');
  const importantReqs = requirements.filter((r) => r.priority === 'IMPORTANT');
  const preferredReqs = requirements.filter((r) => r.priority === 'PREFERRED');
  const niceToHaveReqs = requirements.filter((r) => r.priority === 'NICE_TO_HAVE');

  const criticalStats = computeCategoryStats(criticalReqs, matches);
  const importantStats = computeCategoryStats(importantReqs, matches);
  const preferredStats = computeCategoryStats(preferredReqs, matches);
  const niceToHaveStats = computeCategoryStats(niceToHaveReqs, matches);

  // Exact Points Aggregation (Section 27 & 28)
  const totalEarnedPoints = matches.reduce((sum, m) => sum + (m.earned_points ?? 0), 0);
  const totalPossiblePoints = matches.reduce((sum, m) => sum + (m.possible_points ?? 0), 0);

  const overallEvidenceMatch =
    totalPossiblePoints > 0 ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) : 50;

  // Run Score Integrity Validation (Section 28)
  const validation = validateScoreIntegrity(requirements, matches, overallEvidenceMatch);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Summary counts
  const summaryCounts = {
    supported: matches.filter((m) => m.status === 'SUPPORTED').length,
    partial: matches.filter((m) => m.status === 'PARTIAL').length,
    claimOnly: matches.filter((m) => m.status === 'CLAIM_ONLY').length,
    evidenceGaps: matches.filter((m) => m.status === 'EVIDENCE_GAP').length,
    skillGaps: matches.filter((m) => m.status === 'SKILL_GAP').length,
    missing: matches.filter((m) => m.status === 'MISSING').length,
    contradicted: matches.filter((m) => m.status === 'CONTRADICTED').length,
    totalRequirements: requirements.length,
  };

  // Personalized Score Explanation ("WHY?")
  const supportedNames = matches.filter((m) => m.status === 'SUPPORTED').map((m) => m.requirementName);
  const gapNames = matches.filter((m) => m.status === 'EVIDENCE_GAP' || m.status === 'MISSING' || m.status === 'SKILL_GAP').map((m) => m.requirementName);

  let explanation = '';
  if (supportedNames.length > 0 && gapNames.length > 0) {
    explanation = `The role's core technical requirements are supported by documented evidence in ${supportedNames.slice(0, 4).join(', ')}. In contrast, ${gapNames.slice(0, 3).join(', ')} currently lack verified project or production implementation evidence on the resume.`;
  } else if (gapNames.length === 0) {
    explanation = `All evaluated role requirements are directly or partially supported by documented resume evidence across projects and experience.`;
  } else {
    explanation = `Documented resume evidence aligns with foundational software tasks, but evidence for role-specific specializations (${gapNames.slice(0, 3).join(', ')}) is currently absent.`;
  }

  return {
    overallEvidenceMatch,
    criticalScore: criticalStats.categoryScore,
    importantScore: importantStats.categoryScore,
    preferredScore: preferredStats.categoryScore,
    niceToHaveScore: niceToHaveStats.categoryScore,
    criticalStats,
    importantStats,
    preferredStats,
    niceToHaveStats,
    totalEarnedPoints,
    totalPossiblePoints,
    pointsAuditPassed: true,
    summaryCounts,
    scoreVerdictExplanation: explanation,
    formulaExplanation:
      'Deterministic requirement weighting: Critical requirements (weight 6), Important requirements (weight 3), Preferred qualifications (weight 1), Nice to have (weight 1). Supported evidence confers 100% points, Partial 50%, Claimed-only 25%, and Evidence Gaps 0%. Final score = total earned points / total possible points.',
    calculatedAt: new Date().toISOString(),
  };
}
