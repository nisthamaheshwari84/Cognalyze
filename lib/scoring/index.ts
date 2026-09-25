export function calculateSemanticScore(jdEmbedding: number[], candidateEmbedding: number[]): number {
  if (jdEmbedding.length !== candidateEmbedding.length || jdEmbedding.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < jdEmbedding.length; i++) {
    dotProduct += jdEmbedding[i] * candidateEmbedding[i];
    normA += jdEmbedding[i] * jdEmbedding[i];
    normB += candidateEmbedding[i] * candidateEmbedding[i];
  }
  const cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(100, ((cosine + 1) / 2) * 100));
}

export function calculateExperienceScore(actualYoe: number, targetYoe: number): number {
  if (targetYoe === 0) {
    // If target is 0, any experience is basically fine, but flag 15 YOE applying for new grad.
    if (actualYoe > 3) return 50;
    return 100;
  }
  
  if (actualYoe === targetYoe) return 100;
  
  // Gaussian decay to penalize under-qualification and over-qualification
  let variance = Math.max(1.5, targetYoe * 0.3); // ~30% acceptable variance for under
  if (actualYoe > targetYoe) {
     // Be more forgiving of over-qualification (wider variance)
     variance = Math.max(3.0, targetYoe * 0.6);
  }
  
  const decay = Math.exp(-Math.pow(actualYoe - targetYoe, 2) / (2 * Math.pow(variance, 2)));
  return Math.max(0, Math.min(100, Math.round(decay * 100)));
}

export function calculateTrajectoryScore(avgTenureMonths: number, promotionsCount: number): number {
  // Objective career progression signal based on verified tenure and internal advancement
  const tenureSignal = Math.min(50, Math.round((avgTenureMonths / 24) * 50));
  const promoSignal = Math.min(50, promotionsCount * 25);
  return Math.min(100, tenureSignal + promoSignal);
}

export interface CareerTenureMetrics {
  averageTenureMonths: number;
  promotionsCount: number;
  totalRolesCount: number;
}

export function calculateTenureMetrics(
  roles: Array<{ durationMonths: number; isPromotion?: boolean }>
): CareerTenureMetrics {
  if (roles.length === 0) {
    return { averageTenureMonths: 0, promotionsCount: 0, totalRolesCount: 0 };
  }
  const totalMonths = roles.reduce((sum, r) => sum + (r.durationMonths || 0), 0);
  const promotionsCount = roles.filter(r => r.isPromotion).length;
  return {
    averageTenureMonths: Math.round(totalMonths / roles.length),
    promotionsCount,
    totalRolesCount: roles.length
  };
}

/**
 * @deprecated Truth Contract T7: Prestige tiers and institutional elitism are purged.
 * Evaluation is grounded strictly in demonstrable skill and verified artifacts, not employer brand.
 */
export function calculateCompanyQualityScore(_tier: 1 | 2 | 3 | 4): number {
  // Neutralized: no penalty based on employer prestige or company brand
  return 100;
}

/**
 * @deprecated Truth Contract T7: Degree discipline/prestige penalties are purged.
 * Capability is evaluated through verified work samples and technical assessments.
 */
export function calculateEducationQualityScore(_tier: 1 | 2 | 3 | 4, _isRelevantDegree: boolean): number {
  // Neutralized: no penalty based on university pedigree or degree title
  return 100;
}

// Objective Factual Integrity Observations (replaces arbitrary fraud scores)
export function calculateIntegrityPenalties(
  skillDensityPercent: number, 
  fakeSkillsCount: number, 
  unexplainedGapsMonths: number
): { totalPenalty: number; flags: string[] } {
  const flags: string[] = [];

  if (skillDensityPercent > 20) {
    flags.push(`High keyword density (${skillDensityPercent}%). Verification through source artifacts recommended.`);
  }

  if (fakeSkillsCount > 0) {
    flags.push(`${fakeSkillsCount} skills claimed without supporting context or artifacts in experience.`);
  }

  if (unexplainedGapsMonths > 12) {
    flags.push(`Career gap of ${unexplainedGapsMonths} months noted; assess capability via recent work samples.`);
  }

  // Factual count of flags rather than magic points
  const totalPenalty = Math.min(100, flags.length * 15);
  return { totalPenalty, flags };
}

