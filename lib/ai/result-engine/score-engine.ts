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

const STATUS_VALUES: Record<string, number> = {
  SUPPORTED: 1.0,
  PARTIAL: 0.5,
  CLAIM_ONLY: 0.25,
  EVIDENCE_GAP: 0.0,
  SKILL_GAP: 0.0,
  MISSING: 0.0,
  CONTRADICTED: 0.0,
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

    const val = STATUS_VALUES[status] ?? 0;
    totalValue += val;
  }

  stats.categoryScore = Math.round((totalValue / reqs.length) * 100);
  return stats;
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

  const criticalStats = computeCategoryStats(criticalReqs, matches);
  const importantStats = computeCategoryStats(importantReqs, matches);
  const preferredStats = computeCategoryStats(preferredReqs, matches);

  // Weighted overall calculation: Critical 60%, Important 30%, Preferred 10%
  let weightedScoreSum = 0;
  let weightsSum = 0;

  if (criticalReqs.length > 0) {
    weightedScoreSum += criticalStats.categoryScore * 0.60;
    weightsSum += 0.60;
  }
  if (importantReqs.length > 0) {
    weightedScoreSum += importantStats.categoryScore * 0.30;
    weightsSum += 0.30;
  }
  if (preferredReqs.length > 0) {
    weightedScoreSum += preferredStats.categoryScore * 0.10;
    weightsSum += 0.10;
  }

  const overallEvidenceMatch = weightsSum > 0 ? Math.round(weightedScoreSum / weightsSum) : 50;

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
    criticalStats,
    importantStats,
    preferredStats,
    summaryCounts,
    scoreVerdictExplanation: explanation,
    formulaExplanation:
      'Deterministic requirement weighting: Critical requirements (60%), Important requirements (30%), Preferred qualifications (10%). Supported evidence confers 100% points, Partial 50%, Claimed-only 25%, and Evidence Gaps 0%.',
    calculatedAt: new Date().toISOString(),
  };
}
