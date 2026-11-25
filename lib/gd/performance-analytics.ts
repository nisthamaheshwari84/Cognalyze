/**
 * COGNALYZE GD PERFORMANCE ANALYTICS ENGINE
 *
 * Computes verified, non-fabricated student performance metrics,
 * 8-dimension competency averages, practice streaks, milestones,
 * and weak-dimension -> Skills Lab recommendations from real
 * evaluated GD sessions and completed micro-drills.
 */

import type { GDComprehensiveReport, GDEvaluationDimension } from "./types";
import type { GDSkillProgressRecord } from "./skills-lab-service";

export interface GDPerformanceSessionRecord {
  sessionId: string;
  topicTitle: string;
  format: string;
  difficulty: string;
  overallScore: number;
  hiringVerdict?: string;
  speakingTurnCount?: number;
  dnaSynced?: boolean;
  createdAt: string;
  dimensions?: GDEvaluationDimension[];
  fullReport?: GDComprehensiveReport | null;
}

export interface GDDimensionMetadata {
  dimension: GDEvaluationDimension["dimension"];
  label: string;
  shortLabel: string;
  weight: number;
  dnaSkillLabel: string;
  recommendedSkillTrackId: string;
  recommendedSkillTitle: string;
}

export const EIGHT_GD_DIMENSIONS_META: GDDimensionMetadata[] = [
  {
    dimension: "communication_clarity",
    label: "Clarity & Articulation",
    shortLabel: "Clarity",
    weight: 0.15,
    dnaSkillLabel: "Communication",
    recommendedSkillTrackId: "skill-opening-frame",
    recommendedSkillTitle: "60-Second Crisp Opening Frame"
  },
  {
    dimension: "content_quality",
    label: "Content & Domain Relevance",
    shortLabel: "Content",
    weight: 0.2,
    dnaSkillLabel: "Domain Rigor",
    recommendedSkillTrackId: "skill-evidence-data",
    recommendedSkillTitle: "Evidence-Backed Trade-Off Reasoning"
  },
  {
    dimension: "logical_reasoning",
    label: "Logical Structuring",
    shortLabel: "Structure",
    weight: 0.15,
    dnaSkillLabel: "Structured Reasoning",
    recommendedSkillTrackId: "skill-structured-peel",
    recommendedSkillTitle: "Structured PEEL Argumentation"
  },
  {
    dimension: "active_listening",
    label: "Active Listening & Engagement",
    shortLabel: "Listening",
    weight: 0.15,
    dnaSkillLabel: "Active Listening",
    recommendedSkillTrackId: "skill-active-listening",
    recommendedSkillTitle: "Active Listening & Peer Bridging"
  },
  {
    dimension: "critical_thinking",
    label: "Critical Thinking",
    shortLabel: "Critical",
    weight: 0.1,
    dnaSkillLabel: "Critical Thinking",
    recommendedSkillTrackId: "skill-constructive-counter",
    recommendedSkillTitle: "Constructive Counter-Arguments"
  },
  {
    dimension: "collaboration",
    label: "Collaboration & Consensus",
    shortLabel: "Collaboration",
    weight: 0.1,
    dnaSkillLabel: "Collaboration",
    recommendedSkillTrackId: "skill-draw-quiet-peer",
    recommendedSkillTitle: "Drawing Quiet Participants In"
  },
  {
    dimension: "leadership",
    label: "Leadership & Floor Initiative",
    shortLabel: "Leadership",
    weight: 0.1,
    dnaSkillLabel: "Leadership & Ownership",
    recommendedSkillTrackId: "skill-mid-synthesis",
    recommendedSkillTitle: "Mid-Discussion Synthesis & Reset"
  },
  {
    dimension: "professional_conduct",
    label: "Professional Conduct",
    shortLabel: "Conduct",
    weight: 0.05,
    dnaSkillLabel: "Executive Composure",
    recommendedSkillTrackId: "skill-composure-pressure",
    recommendedSkillTitle: "Composure Under Hostile Cross-Examination"
  }
];

export interface GDScoreTrendPoint {
  sessionIndex: number;
  label: string;
  sessionId: string;
  topicTitle: string;
  format: string;
  date: string;
  overallScore: number;
}

export interface GDDimensionAverageItem extends GDDimensionMetadata {
  averageScore: number | null;
  latestScore: number | null;
  assessedCount: number;
}

export interface GDMilestoneItem {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progressLabel: string;
}

export interface GDPerformanceAnalytics {
  completedSessionsCount: number;
  compositeAverage: number | null;
  peakScore: number | null;
  latestScore: number | null;
  scoreDelta: number | null;
  scoreTrend: GDScoreTrendPoint[];
  dimensionAverages: GDDimensionAverageItem[];
  weakestDimensions: GDDimensionAverageItem[];
  practiceStreakDays: number;
  activeDaysTotal: number;
  skillsLabSummary: {
    totalTracks: number;
    attemptedTracks: number;
    masteredTracks: number;
    averageDrillScore: number | null;
  };
  milestones: GDMilestoneItem[];
}

function toUtcDateKey(isoOrDate: string | Date): string | null {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Calculates consecutive UTC calendar days of verified GD practice
 * (evaluated sessions + Skills Lab drills) ending today or yesterday.
 */
export function calculateGDPracticeStreak(
  activityDatesIso: Array<string | null | undefined>,
  now: Date = new Date()
): { practiceStreakDays: number; activeDaysTotal: number } {
  const dayKeys = new Set<string>();
  for (const raw of activityDatesIso) {
    if (!raw) continue;
    const key = toUtcDateKey(raw);
    if (key) dayKeys.add(key);
  }

  if (dayKeys.size === 0) {
    return { practiceStreakDays: 0, activeDaysTotal: 0 };
  }

  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayKey = toUtcDateKey(todayUtc)!;
  const yesterdayUtc = new Date(todayUtc.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = toUtcDateKey(yesterdayUtc)!;

  let cursor: Date | null = null;
  if (dayKeys.has(todayKey)) {
    cursor = todayUtc;
  } else if (dayKeys.has(yesterdayKey)) {
    cursor = yesterdayUtc;
  }

  let streak = 0;
  while (cursor) {
    const key = toUtcDateKey(cursor);
    if (!key || !dayKeys.has(key)) break;
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  return {
    practiceStreakDays: streak,
    activeDaysTotal: dayKeys.size
  };
}

export function computeGDPerformanceAnalytics(params: {
  sessions: GDPerformanceSessionRecord[];
  skillsProgress?: GDSkillProgressRecord[];
  totalSkillTracks?: number;
  warningHistoryCount?: number;
  suspended?: boolean;
  now?: Date;
}): GDPerformanceAnalytics {
  const {
    sessions,
    skillsProgress = [],
    totalSkillTracks = 12,
    warningHistoryCount = 0,
    suspended = false,
    now = new Date()
  } = params;

  const sortedChronological = [...sessions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const completedSessionsCount = sortedChronological.length;
  const compositeAverage =
    completedSessionsCount > 0
      ? Math.round(
          sortedChronological.reduce((acc, s) => acc + (Number(s.overallScore) || 0), 0) /
            completedSessionsCount
        )
      : null;

  const peakScore =
    completedSessionsCount > 0
      ? Math.max(...sortedChronological.map((s) => Number(s.overallScore) || 0))
      : null;

  const latestSession =
    completedSessionsCount > 0 ? sortedChronological[completedSessionsCount - 1] : null;
  const prevSession =
    completedSessionsCount > 1 ? sortedChronological[completedSessionsCount - 2] : null;

  const latestScore = latestSession ? Number(latestSession.overallScore) || 0 : null;
  const scoreDelta =
    latestSession && prevSession
      ? (Number(latestSession.overallScore) || 0) - (Number(prevSession.overallScore) || 0)
      : null;

  const scoreTrend: GDScoreTrendPoint[] = sortedChronological.map((s, idx) => ({
    sessionIndex: idx + 1,
    label: `Round ${idx + 1}`,
    sessionId: s.sessionId,
    topicTitle: s.topicTitle,
    format: s.format,
    date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overallScore: Number(s.overallScore) || 0
  }));

  // 8-dimension averages across evaluated sessions ONLY where verdict !== "insufficient_evidence"
  const dimensionAverages: GDDimensionAverageItem[] = EIGHT_GD_DIMENSIONS_META.map((meta) => {
    const scores: number[] = [];
    for (const session of sortedChronological) {
      const dims = session.dimensions || session.fullReport?.dimensions || [];
      const found = dims.find((d) => d.dimension === meta.dimension);
      if (found && found.verdict !== "insufficient_evidence" && typeof found.score === "number") {
        scores.push(found.score);
      }
    }
    const assessedCount = scores.length;
    const averageScore =
      assessedCount > 0
        ? Math.round(scores.reduce((sum, val) => sum + val, 0) / assessedCount)
        : null;
    const latestDimScore = assessedCount > 0 ? scores[assessedCount - 1] : null;

    return {
      ...meta,
      averageScore,
      latestScore: latestDimScore,
      assessedCount
    };
  });

  const weakestDimensions = dimensionAverages
    .filter((d) => d.averageScore !== null && d.averageScore < 78)
    .sort((a, b) => (a.averageScore ?? 100) - (b.averageScore ?? 100))
    .slice(0, 3);

  // Skills Lab summary
  const attempted = skillsProgress.filter((p) => p.attemptCount > 0);
  const mastered = skillsProgress.filter((p) => Boolean(p.completedAt) || (p.bestScore || 0) >= 75);
  const averageDrillScore =
    attempted.length > 0
      ? Math.round(attempted.reduce((acc, p) => acc + (p.bestScore || 0), 0) / attempted.length)
      : null;

  // Streak across real sessions + real drills
  const activityIsoDates: Array<string | null | undefined> = [
    ...sortedChronological.map((s) => s.createdAt),
    ...skillsProgress.map((p) => p.updatedAt)
  ];
  const { practiceStreakDays, activeDaysTotal } = calculateGDPracticeStreak(activityIsoDates, now);

  const milestones: GDMilestoneItem[] = [
    {
      id: "first-verified-round",
      title: "First Verified Simulation",
      description: "Complete and evaluate a live GD round with evidence-grounded scoring.",
      earned: completedSessionsCount >= 1,
      progressLabel: `${Math.min(completedSessionsCount, 1)}/1 round`
    },
    {
      id: "consistent-communicator",
      title: "Consistent Communicator",
      description: "Complete 3 full GD evaluations to unlock multi-session trend tracking.",
      earned: completedSessionsCount >= 3,
      progressLabel: `${Math.min(completedSessionsCount, 3)}/3 rounds`
    },
    {
      id: "peak-75",
      title: "Strong Hire Readiness",
      description: "Achieve 75/100 or higher composite score in a verified GD evaluation.",
      earned: peakScore !== null && peakScore >= 75,
      progressLabel: peakScore !== null ? `Peak ${peakScore}/75` : "0/75"
    },
    {
      id: "skills-practitioner",
      title: "Skills Lab Practitioner",
      description: "Master at least 3 targeted communication micro-drills in the Skills Lab.",
      earned: mastered.length >= 3,
      progressLabel: `${Math.min(mastered.length, 3)}/3 mastered`
    },
    {
      id: "clean-conduct",
      title: "Clean Conduct Standing",
      description: "Maintain zero moderation warnings across verified completed rounds.",
      earned: completedSessionsCount >= 1 && !suspended && warningHistoryCount === 0,
      progressLabel:
        completedSessionsCount === 0
          ? "Pending 1st round"
          : suspended || warningHistoryCount > 0
          ? `${warningHistoryCount} warning(s)`
          : "Exemplary"
    }
  ];

  return {
    completedSessionsCount,
    compositeAverage,
    peakScore,
    latestScore,
    scoreDelta,
    scoreTrend,
    dimensionAverages,
    weakestDimensions,
    practiceStreakDays,
    activeDaysTotal,
    skillsLabSummary: {
      totalTracks: totalSkillTracks,
      attemptedTracks: attempted.length,
      masteredTracks: mastered.length,
      averageDrillScore
    },
    milestones
  };
}
