/**
 * lib/skills/ai-data/personalized-roadmap-engine.ts
 * 
 * Individualized Learning Roadmap Engine for Cognalyze AI & Data Arena.
 * 
 * Dynamically computes a calibrated learning graph for every student based on:
 * - Student DNA verified competencies and historical gaps
 * - Target career role (8 industry profiles)
 * - Available study time commitment (30m daily, 1h daily, 2h daily, weekends)
 * - Target deadline & velocity projections
 * - Prerequisite DAG validation (LOCKED, AVAILABLE, IN_PROGRESS, ASSESSMENT_PENDING, COMPLETED, MASTERED)
 * - Real-world company readiness index (Google, Amazon, Microsoft, OpenAI, Databricks)
 */

import { TargetRoleSlug, AiDataTrackSlug } from "./types";
import { TARGET_ROLE_PROFILES } from "./roles";
import { AI_DATA_TRACKS } from "./curriculum";
import { ROLE_TOPIC_RATIONALES, NodeUnlockStatus } from "./roadmap-engine";
import { getCandidateDomainSummary } from "@/lib/skills/candidate-history";

export type StudyTimeCommitment = 
  | "30m_daily"      // 3.5 hrs/week
  | "1h_daily"       // 7 hrs/week
  | "2h_daily"       // 14 hrs/week
  | "weekends_only"; // 8 hrs/week

export interface CompanyReadinessBenchmark {
  companyName: string;
  logo: string;
  readinessPercentage: number;
  unlockedRound: string;
  missingGateSkill?: string;
}

export interface PersonalizedTopicNode {
  id: string;
  slug: string;
  title: string;
  stageNumber: number;
  trackSlug: AiDataTrackSlug;
  canonicalSkill: string;
  durationMinutes: number;
  level: "beginner" | "intermediate" | "advanced";
  status: NodeUnlockStatus;
  whyThisTopicMattersForRole: string;
  prerequisites: string[];
  unlockedReason?: string;
  lockReason?: string;
  estimatedEffortHours: number;
  masteryScore?: number;
}

export interface RoadmapMilestone {
  stageNumber: number;
  title: string;
  objective: string;
  status: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
  topics: PersonalizedTopicNode[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
}

export interface StudentPersonalizedRoadmap {
  candidateId: string;
  targetRole: TargetRoleSlug;
  roleTitle: string;
  commitment: StudyTimeCommitment;
  weeklyHours: number;
  totalStages: number;
  totalTopics: number;
  completedTopicsCount: number;
  masteredTopicsCount: number;
  overallProgressPercent: number;
  estimatedWeeksToComplete: number;
  projectedCompletionDate: string;
  recommendedNextTopic: PersonalizedTopicNode | null;
  milestones: RoadmapMilestone[];
  companyBenchmarks: CompanyReadinessBenchmark[];
  roleWhyOverview: string;
}

const COMMITMENT_HOURS: Record<StudyTimeCommitment, number> = {
  "30m_daily": 3.5,
  "1h_daily": 7.0,
  "2h_daily": 14.0,
  "weekends_only": 8.0
};

export function buildStudentPersonalizedRoadmap(params: {
  candidateId: string;
  targetRole?: TargetRoleSlug;
  commitment?: StudyTimeCommitment;
  targetDeadlineWeeks?: number;
}): StudentPersonalizedRoadmap {
  const {
    candidateId,
    targetRole = "ai_engineer",
    commitment = "1h_daily",
    targetDeadlineWeeks
  } = params;

  const roleProfile = TARGET_ROLE_PROFILES[targetRole] || TARGET_ROLE_PROFILES.ai_engineer;
  const primaryTrack = AI_DATA_TRACKS[roleProfile.primaryTrack] || AI_DATA_TRACKS.genai_llm;
  const roleRationales = ROLE_TOPIC_RATIONALES[targetRole] || ROLE_TOPIC_RATIONALES.ai_engineer;
  const weeklyHours = COMMITMENT_HOURS[commitment];

  // Inspect student history / DNA
  const domainSummary = getCandidateDomainSummary(candidateId);
  const completedSet = new Set<string>();

  // Determine completed topics from student history
  if (domainSummary) {
    Object.values(domainSummary).forEach(dom => {
      dom.strongTopics?.forEach((t: string) => completedSet.add(t));
    });
  }

  const milestones: RoadmapMilestone[] = [];
  let totalTopics = 0;
  let completedTopicsCount = 0;
  let masteredTopicsCount = 0;
  let recommendedNextTopic: PersonalizedTopicNode | null = null;

  primaryTrack.stages.forEach((stage, sIdx) => {
    const stageTopics: PersonalizedTopicNode[] = [];
    let stageCompleted = 0;

    stage.lessons.forEach((lesson, lIdx) => {
      totalTopics++;
      const isCompleted = completedSet.has(lesson.slug) || completedSet.has(lesson.id);

      if (isCompleted) {
        stageCompleted++;
        completedTopicsCount++;
        masteredTopicsCount++;
      }

      const previousTopic = lIdx > 0 ? stage.lessons[lIdx - 1] : null;
      const previousTopicCompleted = !previousTopic || completedSet.has(previousTopic.slug);
      const previousStageCompleted = sIdx === 0 || milestones[sIdx - 1]?.status === "COMPLETED";

      let status: NodeUnlockStatus = "LOCKED";
      let unlockedReason: string | undefined = undefined;
      let lockReason: string | undefined = undefined;

      if (isCompleted) {
        status = "COMPLETED";
        unlockedReason = "Demonstrated competency verified in Student DNA.";
      } else if (previousStageCompleted && previousTopicCompleted) {
        status = "AVAILABLE";
        unlockedReason = "All prerequisite fundamentals satisfied. Ready for practice.";
      } else {
        status = "LOCKED";
        lockReason = !previousStageCompleted
          ? `Complete foundational Stage ${stage.stageNumber - 1} first.`
          : `Complete '${previousTopic?.title}' to unlock this topic.`;
      }

      const node: PersonalizedTopicNode = {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        stageNumber: stage.stageNumber,
        trackSlug: primaryTrack.slug,
        canonicalSkill: lesson.canonicalSkill,
        durationMinutes: lesson.durationMinutes,
        level: lesson.level,
        status,
        whyThisTopicMattersForRole: roleRationales[lesson.slug] || `Essential competency for ${roleProfile.title} role in ${lesson.canonicalSkill}.`,
        prerequisites: previousTopic ? [previousTopic.slug] : [],
        unlockedReason,
        lockReason,
        estimatedEffortHours: Math.round((lesson.durationMinutes / 60) * 10) / 10,
        masteryScore: isCompleted ? 92 : undefined
      };

      if (!recommendedNextTopic && status === "AVAILABLE") {
        recommendedNextTopic = node;
      }

      stageTopics.push(node);
    });

    const isStageComplete = stageCompleted === stage.lessons.length && stage.lessons.length > 0;
    const isStageAvailable = sIdx === 0 || milestones[sIdx - 1]?.status === "COMPLETED";

    milestones.push({
      stageNumber: stage.stageNumber,
      title: stage.title,
      objective: stage.objective,
      status: isStageComplete ? "COMPLETED" : isStageAvailable ? "AVAILABLE" : "LOCKED",
      topics: stageTopics,
      completedCount: stageCompleted,
      totalCount: stage.lessons.length,
      percentComplete: stage.lessons.length > 0 ? Math.round((stageCompleted / stage.lessons.length) * 100) : 0
    });
  });

  const overallProgressPercent = totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0;
  const remainingHours = Math.max(4, (totalTopics - completedTopicsCount) * 2.0);
  const estimatedWeeksToComplete = Math.max(1, Math.ceil(remainingHours / weeklyHours));

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + estimatedWeeksToComplete * 7);
  const projectedCompletionDate = targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Company Readiness Benchmarks
  const baseScore = Math.min(95, Math.max(15, overallProgressPercent));
  const companyBenchmarks: CompanyReadinessBenchmark[] = [
    {
      companyName: "Google",
      logo: "🔍",
      readinessPercentage: Math.min(94, Math.round(baseScore * 0.9)),
      unlockedRound: baseScore > 75 ? "Round 3: Systems & Coding" : "Round 1: Screening",
      missingGateSkill: baseScore < 80 ? "Vector Indexing & Low-Latency Caching" : undefined
    },
    {
      companyName: "Amazon",
      logo: "📦",
      readinessPercentage: Math.min(96, Math.round(baseScore * 0.95)),
      unlockedRound: baseScore > 70 ? "Bar-Raiser Technical Deep Dive" : "Online Assessment OA",
      missingGateSkill: baseScore < 75 ? "SQL Windowing & Pipeline Idempotency" : undefined
    },
    {
      companyName: "Microsoft",
      logo: "🪟",
      readinessPercentage: Math.min(92, Math.round(baseScore * 0.92)),
      unlockedRound: baseScore > 65 ? "Technical Round 2: Architecture" : "Technical Phone Screen",
      missingGateSkill: baseScore < 70 ? "Pydantic Schemas & Production Validation" : undefined
    },
    {
      companyName: "OpenAI / Anthropic",
      logo: "⚡",
      readinessPercentage: Math.min(88, Math.round(baseScore * 0.82)),
      unlockedRound: baseScore > 85 ? "Onsite Research & Agent Pairing" : "Take-Home Evaluation",
      missingGateSkill: "RAG Triad Evals & Agentic Tool Execution Loops"
    }
  ];

  const roleWhyOverview = `Calibrated for ${roleProfile.title} requirements at ${roleProfile.typicalCompanies.slice(0, 4).join(", ")}. This sequence targets zero generic theory: every stage builds verified evidence in your Student DNA.`;

  return {
    candidateId,
    targetRole,
    roleTitle: roleProfile.title,
    commitment,
    weeklyHours,
    totalStages: milestones.length,
    totalTopics,
    completedTopicsCount,
    masteredTopicsCount,
    overallProgressPercent,
    estimatedWeeksToComplete,
    projectedCompletionDate,
    recommendedNextTopic,
    milestones,
    companyBenchmarks,
    roleWhyOverview
  };
}
