/**
 * COGNALYZE RESULT ENGINE — DETERMINISTIC SCORING ENGINE
 * Computes evidence-weighted alignment score and generates personalized score explanations ("WHY?").
 */

import {
  CanonicalJDRequirement,
  ConfidenceTier,
  DeterministicScoreBreakdown,
  RequirementEvidenceMatch,
  ScoreCategoryStats,
  ScoringWeightConfig,
  TriPartiteScoreContract,
} from './types';

export const DEFAULT_SCORING_WEIGHT_CONFIG: ScoringWeightConfig = {
  priorityWeights: {
    CRITICAL: 6,
    IMPORTANT: 3,
    PREFERRED: 1,
    NICE_TO_HAVE: 1,
  },
  contributionLevels: {
    LEVEL_5_INDEPENDENTLY_VERIFIED: 1.00,
    LEVEL_4_ARTIFACT_BACKED: 0.85,
    LEVEL_3_IMPLEMENTATION: 0.65,
    LEVEL_2_CONTEXTUAL: 0.35,
    LEVEL_1_MENTIONED: 0.10,
    LEVEL_0_NO_EVIDENCE: 0.00,
  },
  version: '2.0.0-canonical',
};

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

  let catEarned = 0;
  let catPossible = 0;
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

    if (match) {
      catEarned += match.earned_points ?? 0;
      catPossible += match.possible_points ?? 0;
    } else {
      const priorityWeights: Record<string, number> = { CRITICAL: 6, IMPORTANT: 3, PREFERRED: 1, NICE_TO_HAVE: 1 };
      catPossible += priorityWeights[req.priority] ?? 3;
    }
  }

  stats.categoryScore = catPossible > 0 ? Math.round((catEarned / catPossible) * 100) : 100;
  return stats;
}

/**
 * Validates score integrity independently (Section 27 & 28).
 * Checks mathematical invariants:
 * - Total evaluated count == Total requirements
 * - SUM(earned_points) / SUM(possible_points) equals calculated score
 * - Zero points awarded for LEVEL_0_NO_EVIDENCE
 * - Earned points <= Possible points for each match
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

  // 3. Zero Points on Level 0 Evidence Invariant
  for (const m of matches) {
    if (m.evidenceStrengthLevel === 'LEVEL_0_NO_EVIDENCE' && (m.earned_points ?? 0) > 0) {
      return {
        valid: false,
        error: `SCORE_INTEGRITY_VIOLATION: Requirement ${m.requirementName} has LEVEL_0_NO_EVIDENCE but earned ${m.earned_points} points. Points must strictly be 0.`,
      };
    }
    if ((m.earned_points ?? 0) > (m.possible_points ?? 0)) {
      return {
        valid: false,
        error: `SCORE_INTEGRITY_VIOLATION: Requirement ${m.requirementName} earned ${m.earned_points} which exceeds maximum possible ${m.possible_points}.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Calculates decoupled Tri-Partite measurements per Section 10 of Master Directive:
 * - Role Alignment % (points-based)
 * - Evidence Confidence % (source quality & verification status)
 * - Requirement Coverage % (assessed requirements / total requirements)
 */
export function calculateTriPartiteMetrics(
  requirements: CanonicalJDRequirement[],
  matches: RequirementEvidenceMatch[],
  config: ScoringWeightConfig = DEFAULT_SCORING_WEIGHT_CONFIG
): TriPartiteScoreContract {
  const criticalReqs = requirements.filter((r) => r.priority === 'CRITICAL');
  const criticalMatches = matches.filter((m) => m.priority === 'CRITICAL');
  const criticalStats = computeCategoryStats(criticalReqs, matches);

  const totalEarnedPoints = matches.reduce((sum, m) => sum + (m.earned_points ?? 0), 0);
  const totalPossiblePoints = matches.reduce((sum, m) => sum + (m.possible_points ?? 0), 0);

  // 1. Role Alignment %: 100 * SUM(earned) / SUM(possible)
  const roleAlignmentPercentage =
    totalPossiblePoints > 0
      ? Math.round((totalEarnedPoints / totalPossiblePoints) * 10000) / 100
      : 0.0;

  // 2. Requirement Coverage %: Assessed (evidence >= Level 1) / Total
  const assessedReqs = matches.filter(
    (m) => m.evidenceStrengthLevel && m.evidenceStrengthLevel !== 'LEVEL_0_NO_EVIDENCE'
  );
  const requirementCoveragePercentage =
    requirements.length > 0
      ? Math.round((assessedReqs.length / requirements.length) * 10000) / 100
      : 0.0;

  // Critical Coverage %
  const criticalAssessed = criticalMatches.filter(
    (m) => m.evidenceStrengthLevel && m.evidenceStrengthLevel !== 'LEVEL_0_NO_EVIDENCE'
  );
  const criticalCoverage =
    criticalMatches.length > 0
      ? Math.round((criticalAssessed.length / criticalMatches.length) * 10000) / 100
      : 100.0;

  // 3. Evidence Confidence %: Priority-weighted evidence confidence
  const weightedConfidenceSum = matches.reduce((sum, m) => {
    const weight = m.requirement_weight ?? config.priorityWeights[m.priority] ?? 1;
    return sum + (m.confidence ?? 0) * weight;
  }, 0);
  const evidenceConfidencePercentage =
    totalPossiblePoints > 0
      ? Math.round((weightedConfidenceSum / totalPossiblePoints) * 10000) / 100
      : 0.0;

  // Confidence Tier
  let confidenceTier: ConfidenceTier = 'INSUFFICIENT';
  if (evidenceConfidencePercentage >= 70) confidenceTier = 'HIGH';
  else if (evidenceConfidencePercentage >= 40) confidenceTier = 'MEDIUM';
  else if (evidenceConfidencePercentage > 0) confidenceTier = 'LOW';

  // Scoring Defensibility
  let scoringDefensibility: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK';
  if (evidenceConfidencePercentage >= 70 && roleAlignmentPercentage >= 50 && criticalStats.categoryScore >= 60) {
    scoringDefensibility = 'STRONG';
  } else if (evidenceConfidencePercentage >= 40) {
    scoringDefensibility = 'MODERATE';
  }

  return {
    roleAlignmentPercentage,
    evidenceConfidencePercentage,
    requirementCoveragePercentage,
    breakdown: {
      totalRequirements: requirements.length,
      totalAssessedRequirements: assessedReqs.length,
      totalUnassessedRequirements: requirements.length - assessedReqs.length,
      totalEarnedPoints: Math.round(totalEarnedPoints * 100) / 100,
      totalPossiblePoints,
      criticalCoverage,
      scoringDefensibility,
      confidenceTier,
    },
  };
}

/**
 * Computes the canonical deterministic score and breakdown.
 */
export function calculateDeterministicScore(
  requirements: CanonicalJDRequirement[],
  matches: RequirementEvidenceMatch[],
  config: ScoringWeightConfig = DEFAULT_SCORING_WEIGHT_CONFIG
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

  // Tri-Partite Decoupled Metrics (Section 10)
  const triPartiteScore = calculateTriPartiteMetrics(requirements, matches, config);

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

  // 5-Level granular evidence counts
  const levelCounts = {
    level5Verified: matches.filter((m) => m.evidenceStrengthLevel === 'LEVEL_5_INDEPENDENTLY_VERIFIED').length,
    level4ArtifactBacked: matches.filter((m) => m.evidenceStrengthLevel === 'LEVEL_4_ARTIFACT_BACKED').length,
    level3Implementation: matches.filter((m) => m.evidenceStrengthLevel === 'LEVEL_3_IMPLEMENTATION').length,
    level2Contextual: matches.filter((m) => m.evidenceStrengthLevel === 'LEVEL_2_CONTEXTUAL').length,
    level1Mentioned: matches.filter((m) => m.evidenceStrengthLevel === 'LEVEL_1_MENTIONED').length,
    level0NoEvidence: matches.filter((m) => m.evidenceStrengthLevel === 'LEVEL_0_NO_EVIDENCE' || !m.evidenceStrengthLevel).length,
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
    roleAlignmentPercentage: triPartiteScore.roleAlignmentPercentage,
    evidenceConfidencePercentage: triPartiteScore.evidenceConfidencePercentage,
    requirementCoveragePercentage: triPartiteScore.requirementCoveragePercentage,
    triPartiteScore,
    scoringModelVersion: config.version,
    criticalScore: criticalStats.categoryScore,
    importantScore: importantStats.categoryScore,
    preferredScore: preferredStats.categoryScore,
    niceToHaveScore: niceToHaveStats.categoryScore,
    criticalStats,
    importantStats,
    preferredStats,
    niceToHaveStats,
    totalEarnedPoints: Math.round(totalEarnedPoints * 100) / 100,
    totalPossiblePoints,
    pointsAuditPassed: true,
    summaryCounts,
    levelCounts,
    scoreVerdictExplanation: explanation,
    formulaExplanation:
      'Deterministic evidence-weighted scoring: Critical requirements (weight 6), Important requirements (weight 3), Preferred qualifications (weight 1), Nice to have (weight 1). Evidence contribution: Level 5 Verified (100%), Level 4 Artifact-Backed (85%), Level 3 Implementation (65%), Level 2 Contextual (35%), Level 1 Mentioned Only (10%), Level 0 Evidence Gap (0%). Final score = total earned points / total possible points.',
    calculatedAt: new Date().toISOString(),
  };
}
