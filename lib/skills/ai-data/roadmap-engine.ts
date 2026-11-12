/**
 * lib/skills/ai-data/roadmap-engine.ts
 * 
 * Personalized Learning Roadmap & Prerequisite Progression Engine for AI & Data Arena.
 * 
 * Builds dynamic, role-calibrated curricula graphs with:
 * - Graph dependency evaluation
 * - Node unlocking states: LOCKED, AVAILABLE, IN_PROGRESS, ASSESSMENT_PENDING, COMPLETED, MASTERED
 * - Diagnostic-based prerequisite exemptions from Baseline Assessment
 * - Contextual 'WHY' rationale statements mapping every topic to target career requirements
 */

import { TargetRoleSlug, AiDataTrackSlug, AiDataLesson } from "./types";
import { TARGET_ROLE_PROFILES } from "./roles";
import { AI_DATA_TRACKS } from "./curriculum";
import { BaselineAssessmentResult } from "./baseline-assessment-engine";

export type NodeUnlockStatus = 
  | "LOCKED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "ASSESSMENT_PENDING"
  | "COMPLETED"
  | "MASTERED";

export interface RoadmapTopicNode {
  id: string;
  slug: string;
  title: string;
  stageNumber: number;
  trackSlug: AiDataTrackSlug;
  canonicalSkill: string;
  durationMinutes: number;
  level: "beginner" | "intermediate" | "advanced";
  status: NodeUnlockStatus;
  isExemptedByDiagnostic: boolean;
  whyThisTopicMattersForRole: string;
  prerequisites: string[]; // Slugs of required predecessor topics
  unlockedReason?: string;
  lockReason?: string;
  estimatedEffortHours: number;
}

export interface RoadmapStageGroup {
  stageNumber: number;
  title: string;
  objective: string;
  status: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
  topics: RoadmapTopicNode[];
  completedCount: number;
  totalCount: number;
}

export interface PersonalizedRoadmap {
  candidateId: string;
  targetRole: TargetRoleSlug;
  roleTitle: string;
  primaryTrackSlug: AiDataTrackSlug;
  secondaryTrackSlugs: AiDataTrackSlug[];
  totalStages: number;
  totalTopics: number;
  completedTopicsCount: number;
  masteredTopicsCount: number;
  overallProgressPercent: number;
  estimatedWeeksToComplete: number;
  recommendedNextTopic: RoadmapTopicNode | null;
  stages: RoadmapStageGroup[];
  roleWhyOverview: string;
}

// ── ROLE CONTEXTUAL 'WHY' JUSTIFICATION TEMPLATES ──────────────────────────────
export const ROLE_TOPIC_RATIONALES: Record<string, Record<string, string>> = {
  data_analyst: {
    "numpy-vectorization-and-broadcasting": "Mastering vectorized operations allows you to process millions of transactions without memory bottlenecks before loading into business models.",
    "pandas-groupby-and-aggregations": "You need grouped aggregations to compute KPI trees (ARPU, LTV, conversion by channel) across messy e-commerce datasets.",
    "window-functions-dense-rank-and-lead-lag": "Your primary interview screener tests running balances, retention cohort intervals, and rank filtering with LAG and LEAD.",
    "cohort-retention-and-triangular-grids": "Product leaders rely on Data Analysts to visualize triangular cohort retention and isolate which feature release improved 30-day retention.",
    "hypothesis-testing-and-sample-size": "Before declaring an A/B test winner, you must compute p-values and standard errors to prevent multimillion-dollar false positives.",
    "sample-ratio-mismatch-and-network-effects": "An analyst who cannot detect Sample Ratio Mismatch (SRM) risks recommending rollouts based on broken tracking instrumentations.",
    "metric-trees-and-funnel-conversion": "Translates ambiguous executive goals into measurable parent/child metric trees with sensitivity drivers."
  },
  data_scientist: {
    "numpy-vectorization-and-broadcasting": "Vector calculus and matrix projections form the mathematical bedrock of all gradient descent algorithms and neural forward passes.",
    "pandas-groupby-and-aggregations": "Feature engineering starts with windowed feature aggregates and time-lagged customer purchase frequencies.",
    "linear-and-logistic-regression": "Provides transparent baseline modeling and interpretable odds ratios before deploying complex ensembles.",
    "roc-auc-vs-precision-recall-curves": "In imbalanced fraud and churn datasets, accuracy is deceptive; you must calibrate threshold trade-offs on PR-AUC.",
    "data-leakage-detection-and-prevention": "A Data Scientist must guarantee strict temporal splits so future information never contaminates model validation.",
    "probability-calibration-platt-scaling": "Financial and medical ML models must output well-calibrated probabilities rather than raw uncalibrated margin scores."
  },
  ai_engineer: {
    "structured-outputs-and-pydantic-validation": "AI Engineers cannot pipe unstructured LLM markdown strings into downstream APIs; strict Pydantic JSON schemas are non-negotiable.",
    "embeddings-vector-indexes-and-ann": "Vector embeddings bridge unstructured knowledge text to fast sub-10ms nearest-neighbor semantic search in vector DBs.",
    "chunking-strategies-and-hybrid-search": "Naive fixed-size chunking destroys context; recursive semantic chunking preserves relational integrity.",
    "the-rag-triad-evaluations": "To eliminate hallucinations, you must benchmark Context Relevance, Groundedness, and Answer Relevance using Ragas CI/CD evals.",
    "tool-calling-schemas-and-execution-loops": "Production agents require deterministic execution loops that parse tool arguments, invoke APIs safely, and handle error retries.",
    "prompt-injection-defense-and-guardrails": "Defends enterprise systems against adversarial jailbreaks, system-prompt extraction, and unauthorized tool execution."
  },
  ml_engineer: {
    "numpy-vectorization-and-broadcasting": "High-throughput inference requires vectorized tensor manipulation with zero Python interpreter overhead.",
    "feature-engineering-and-encoding": "Transforms categorical cardinalities and continuous distributions into optimal input tensors without memory blowup.",
    "gradient-boosting-vs-random-forests": "Tabular ranking and pricing systems at Uber/Amazon rely on tuned XGBoost/LightGBM ensembles.",
    "serving-models-with-fastapi": "Packaging trained models behind asynchronous FastAPI endpoints with p99 latency SLAs is a core MLE deliverable.",
    "model-quantization-and-onnx-runtime": "Reduces inference compute costs by 4x and latency by 60% through INT8/FP16 quantization and ONNX graph optimization."
  },
  data_engineer: {
    "advanced_sql_analytics": "The core of modern warehousing: writing high-performance windowed CTEs that scale across billions of rows.",
    "star-schema-and-slowly-changing-dimensions": "Designing Kimball dimensional models with SCD Type 2 preserves historical point-in-time truth.",
    "idempotency-and-watermarking": "Ensures that re-running backfills or handling out-of-order Kafka streams never creates duplicate analytical records.",
    "write-audit-publish-pattern": "Prevents corrupt data batches from polluting public warehouse tables by enforcing quality gates before publication."
  },
  mlops_engineer: {
    "mlflow-tracking-and-model-versioning": "Guarantees full lineage between code commits, training hyperparameters, artifact weights, and production metrics.",
    "data-drift-and-population-stability-index": "Alerts the engineering team when production feature distributions drift away from the training baseline (PSI > 0.2).",
    "canary-deployments-and-automated-rollbacks": "Safely tests candidate model versions against 5% of live traffic with automated rollback upon error-rate spikes."
  },
  genai_llm_engineer: {
    "reranking-with-cross-encoders": "Drastically boosts RAG precision by scoring top-k vector candidates with deep bidirectional transformer attention.",
    "the-rag-triad-evaluations": "Quantifies hallucination rates and citation accuracy across thousands of test evaluation sets.",
    "prompt-injection-defense-and-guardrails": "Enforces boundary checks, LLM-as-a-judge sanitizers, and token limits to secure generative endpoints."
  },
  applied_ai_engineer: {
    "structured-outputs-and-pydantic-validation": "Enables reliable full-stack integration between Next.js React user interfaces and asynchronous LLM backends.",
    "tool-calling-schemas-and-execution-loops": "Powers autonomous user actions like calendar booking, database updates, and live data lookup.",
    "autonomous-customer-support-agent": "Complete production capstone tying together intent classification, knowledge retrieval, and tool execution."
  }
};

export function generatePersonalizedRoadmap(params: {
  candidateId: string;
  targetRole: TargetRoleSlug;
  completedLessonSlugs: string[];
  baselineAssessment?: BaselineAssessmentResult | null;
  weeklyHoursCommitment?: number;
}): PersonalizedRoadmap {
  const {
    candidateId,
    targetRole,
    completedLessonSlugs = [],
    baselineAssessment = null,
    weeklyHoursCommitment = 10
  } = params;

  const roleProfile = TARGET_ROLE_PROFILES[targetRole] || TARGET_ROLE_PROFILES.ai_engineer;
  const primaryTrack = AI_DATA_TRACKS[roleProfile.primaryTrack] || AI_DATA_TRACKS.genai_llm;
  const completedSet = new Set(completedLessonSlugs);

  const exemptedSkills = new Set(baselineAssessment?.exemptionsGranted || []);
  const roleRationales = ROLE_TOPIC_RATIONALES[targetRole] || ROLE_TOPIC_RATIONALES.ai_engineer;

  const stageGroups: RoadmapStageGroup[] = [];
  let totalTopics = 0;
  let completedTopicsCount = 0;
  let masteredTopicsCount = 0;
  let recommendedNextTopic: RoadmapTopicNode | null = null;

  // Process Primary Track Stages
  primaryTrack.stages.forEach((stage, sIdx) => {
    const stageTopics: RoadmapTopicNode[] = [];
    let stageCompletedCount = 0;

    stage.lessons.forEach((lesson, lIdx) => {
      totalTopics++;
      const isCompleted = completedSet.has(lesson.slug);
      const isExempt = exemptedSkills.has(lesson.canonicalSkill) && lesson.level === "beginner";

      if (isCompleted || isExempt) {
        stageCompletedCount++;
        completedTopicsCount++;
        if (isCompleted) masteredTopicsCount++;
      }

      // Prerequisite Evaluation
      let status: NodeUnlockStatus = "LOCKED";
      let unlockedReason: string | undefined = undefined;
      let lockReason: string | undefined = undefined;

      const previousTopic = lIdx > 0 ? stage.lessons[lIdx - 1] : null;
      const previousTopicCompleted = !previousTopic || completedSet.has(previousTopic.slug) || (exemptedSkills.has(previousTopic.canonicalSkill) && previousTopic.level === "beginner");

      const previousStageCompleted = sIdx === 0 || stageGroups[sIdx - 1]?.completedCount >= Math.max(1, stageGroups[sIdx - 1]?.totalCount * 0.7);

      if (isCompleted) {
        status = "COMPLETED";
        unlockedReason = "Demonstrated competency verified through assessment.";
      } else if (isExempt) {
        status = "COMPLETED";
        unlockedReason = "Diagnostic baseline assessment confirmed prerequisite proficiency.";
      } else if (previousStageCompleted && previousTopicCompleted) {
        status = "AVAILABLE";
        unlockedReason = "Prerequisites satisfied. Ready to start.";
      } else {
        status = "LOCKED";
        lockReason = !previousStageCompleted 
          ? `Complete Stage ${stage.stageNumber - 1} foundational competencies first.`
          : `Complete '${previousTopic?.title}' to unlock this topic.`;
      }

      // Default the first available topic as the recommended next
      if (!recommendedNextTopic && status === "AVAILABLE") {
        recommendedNextTopic = {
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          stageNumber: stage.stageNumber,
          trackSlug: primaryTrack.slug,
          canonicalSkill: lesson.canonicalSkill,
          durationMinutes: lesson.durationMinutes,
          level: lesson.level,
          status,
          isExemptedByDiagnostic: isExempt,
          whyThisTopicMattersForRole: roleRationales[lesson.slug] || `Essential requirement for ${roleProfile.title} competencies in ${lesson.canonicalSkill}.`,
          prerequisites: previousTopic ? [previousTopic.slug] : [],
          unlockedReason,
          lockReason,
          estimatedEffortHours: Math.round((lesson.durationMinutes / 60) * 10) / 10
        };
      }

      stageTopics.push({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        stageNumber: stage.stageNumber,
        trackSlug: primaryTrack.slug,
        canonicalSkill: lesson.canonicalSkill,
        durationMinutes: lesson.durationMinutes,
        level: lesson.level,
        status,
        isExemptedByDiagnostic: isExempt,
        whyThisTopicMattersForRole: roleRationales[lesson.slug] || `Directly applies to real-world ${roleProfile.title} workflows and interview evaluations.`,
        prerequisites: previousTopic ? [previousTopic.slug] : [],
        unlockedReason,
        lockReason,
        estimatedEffortHours: Math.round((lesson.durationMinutes / 60) * 10) / 10
      });
    });

    const isStageComplete = stageCompletedCount === stage.lessons.length && stage.lessons.length > 0;
    const isStageAvailable = sIdx === 0 || stageGroups[sIdx - 1]?.status === "COMPLETED";

    stageGroups.push({
      stageNumber: stage.stageNumber,
      title: stage.title,
      objective: stage.objective,
      status: isStageComplete ? "COMPLETED" : isStageAvailable ? "AVAILABLE" : "LOCKED",
      topics: stageTopics,
      completedCount: stageCompletedCount,
      totalCount: stage.lessons.length
    });
  });

  const overallProgressPercent = totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0;
  const remainingHours = Math.max(5, (totalTopics - completedTopicsCount) * 1.5);
  const estimatedWeeksToComplete = Math.max(1, Math.ceil(remainingHours / Math.max(5, weeklyHoursCommitment)));

  const roleWhyOverview = `This curriculum is calibrated strictly for the ${roleProfile.title} role at companies like ${roleProfile.typicalCompanies.slice(0, 3).join(", ")}. It targets verified readiness across your required skills: ${roleProfile.requiredSkills.map(s => s.replace(/_/g, " ")).join(", ")}.`;

  return {
    candidateId,
    targetRole,
    roleTitle: roleProfile.title,
    primaryTrackSlug: primaryTrack.slug,
    secondaryTrackSlugs: roleProfile.secondaryTracks,
    totalStages: stageGroups.length,
    totalTopics,
    completedTopicsCount,
    masteredTopicsCount,
    overallProgressPercent,
    estimatedWeeksToComplete,
    recommendedNextTopic,
    stages: stageGroups,
    roleWhyOverview
  };
}

