/**
 * Career Gap Representation Engine (Truth Contract T7, Phase 7)
 * 
 * Strict Principle:
 * Employment gaps (parental leave, caregiving, health, education, sabbatical, exploration)
 * are NEVER treated as red flags, character flaws, or penalized in scoring.
 * 
 * Capability is established strictly through demonstrable artifacts, work samples,
 * and technical depth.
 */

export interface CareerGapAnalysis {
  gapDetected: boolean;
  gapDurationMonths: number;
  startDate?: string;
  endDate?: string;
  factualSummary: string;
  recencyIndicator: "current" | "recent_activity_verified" | "historical";
  recommendedDemonstration: string;
}

export interface CareerRoleSpan {
  startDate: string; // YYYY-MM or YYYY-MM-DD
  endDate?: string | null; // null/empty means current
  title: string;
  company: string;
}

/**
 * Parses career history to factually document employment transitions
 * without bias or moralizing language.
 */
export function analyzeCareerGaps(roles: CareerRoleSpan[], recentEvidenceCount: number = 0): CareerGapAnalysis[] {
  if (roles.length <= 1) {
    return [];
  }

  // Sort chronological descending (most recent first)
  const sorted = [...roles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const gaps: CareerGapAnalysis[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const newer = sorted[i];
    const older = sorted[i + 1];

    if (!older.endDate) continue;

    const olderEnd = new Date(older.endDate).getTime();
    const newerStart = new Date(newer.startDate).getTime();

    const diffMonths = Math.round((newerStart - olderEnd) / (1000 * 60 * 60 * 24 * 30.4375));

    if (diffMonths >= 3) {
      const recency = recentEvidenceCount > 0 ? "recent_activity_verified" : "historical";
      const factualSummary = `Career transition of ${diffMonths} months between ${older.company} and ${newer.company}.`;
      
      let recommendedDemonstration = "Capability is evidenced through project artifacts and documented systems.";
      if (recentEvidenceCount > 0) {
        recommendedDemonstration = `${recentEvidenceCount} verified work sample(s) and project artifacts establish current capability.`;
      }

      gaps.push({
        gapDetected: true,
        gapDurationMonths: diffMonths,
        startDate: older.endDate,
        endDate: newer.startDate,
        factualSummary,
        recencyIndicator: recency,
        recommendedDemonstration,
      });
    }
  }

  return gaps;
}
