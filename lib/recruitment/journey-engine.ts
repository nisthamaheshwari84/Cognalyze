/**
 * lib/recruitment/journey-engine.ts
 * 
 * Dynamic Recruitment Journey Engine for Cognalyze Recruitment Arena.
 * Manages DAG stage dependencies, stage advancement, candidate telemetry,
 * weighted scoring, and immutable blueprint execution.
 */

import {
  StudentRecruitmentJourney,
  StageAttemptSubmission,
  StageProgressItem,
  RoleFamily,
  HiringChannel,
  BlueprintStageDefinition,
  RecruitmentBlueprint,
} from "./types";
import { resolveRecruitmentBlueprint, getAnyBlueprintById } from "./dynamic-blueprint-engine";

export interface JourneyCreationParams {
  studentId: string;
  companyId: string;
  roleFamily: RoleFamily;
  hiringChannel?: HiringChannel;
  country?: string;
  blueprintVersion?: string;
}

/**
 * Initializes a new student recruitment journey against an immutable blueprint version.
 */
export function createJourney(params: JourneyCreationParams): StudentRecruitmentJourney {
  const { studentId, companyId, roleFamily, hiringChannel = "campus", country = "GLOBAL", blueprintVersion } = params;

  const blueprint = resolveRecruitmentBlueprint({
    companyId,
    roleFamily,
    hiringChannel,
    country,
    version: blueprintVersion,
  });
  if (!blueprint) {
    throw new Error(
      `No recruitment blueprint found for company '${companyId}', role '${roleFamily}', channel '${hiringChannel}'.`
    );
  }

  const sortedStages = [...blueprint.stages].sort((a, b) => a.order - b.order);
  const firstStage = sortedStages[0];

  const stageProgress: Record<string, StageProgressItem> = {};
  for (const stage of sortedStages) {
    stageProgress[stage.id] = {
      stageId: stage.id,
      stageType: stage.stageType,
      title: stage.title,
      order: stage.order,
      status: "NOT_STARTED",
      rawScore: 0,
      maxScore: 100,
      percentageScore: 0,
      attemptCount: 0,
    };
  }

  const now = new Date().toISOString();
  const journeyId = `jny_${companyId}_${roleFamily}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: journeyId,
    studentId,
    companyId: blueprint.companyId,
    blueprintId: blueprint.id,
    blueprintVersion: blueprint.version,
    roleFamily: blueprint.roleFamily,
    hiringChannel: blueprint.hiringChannel,
    currentStageId: firstStage ? firstStage.id : "",
    status: "IN_PROGRESS",
    overallScore: 0,
    stageProgress,
    competencyScores: {},
    startedAt: now,
    updatedAt: now,
  };
}

/**
 * Checks whether a student can attempt a specific stage based on DAG prerequisites.
 */
export function canAttemptStage(
  journey: StudentRecruitmentJourney,
  stageId: string
): { allowed: boolean; reason?: string } {
  if (journey.status !== "IN_PROGRESS") {
    return {
      allowed: false,
      reason: `Journey is currently ${journey.status}. No new attempts can be started.`,
    };
  }

  const blueprint = getAnyBlueprintById(journey.blueprintId);
  if (!blueprint) {
    return { allowed: false, reason: "Associated recruitment blueprint not found." };
  }

  const stageDef = blueprint.stages.find((s) => s.id === stageId);
  if (!stageDef) {
    return { allowed: false, reason: `Stage '${stageId}' does not exist in blueprint.` };
  }

  // Check all dependencies in dependsOn
  for (const depId of stageDef.dependsOn) {
    const depProgress = journey.stageProgress[depId];
    if (!depProgress || depProgress.status !== "PASSED") {
      const depStage = blueprint.stages.find((s) => s.id === depId);
      const depTitle = depStage ? depStage.title : depId;
      return {
        allowed: false,
        reason: `Prerequisite stage '${depTitle}' must be successfully passed first.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Returns list of blueprint stages that are currently unlocked and available to be attempted.
 */
export function getAvailableStages(journey: StudentRecruitmentJourney): BlueprintStageDefinition[] {
  const blueprint = getAnyBlueprintById(journey.blueprintId);
  if (!blueprint) return [];

  return blueprint.stages.filter((stage) => {
    const progress = journey.stageProgress[stage.id];
    // If already passed, not available for a new attempt
    if (progress && progress.status === "PASSED") return false;
    return canAttemptStage(journey, stage.id).allowed;
  });
}

/**
 * Submits an attempt for a stage, updates scores, computes competency coverage,
 * and advances the journey's current stage and overall status.
 */
export function advanceJourneyWithAttempt(
  journey: StudentRecruitmentJourney,
  submission: StageAttemptSubmission
): {
  updatedJourney: StudentRecruitmentJourney;
  stagePassed: boolean;
  nextStageId: string | null;
  isCompleted: boolean;
} {
  const { stageId, rawScore, maxScore, durationSeconds, telemetry = {}, rubricEvaluations = {}, evaluatorFeedback, sessionReferenceId } = submission;

  const blueprint = getAnyBlueprintById(journey.blueprintId);
  if (!blueprint) {
    throw new Error(`Blueprint ${journey.blueprintId} not found.`);
  }

  const stageDef = blueprint.stages.find((s) => s.id === stageId);
  if (!stageDef) {
    throw new Error(`Stage ${stageId} not found in blueprint ${journey.blueprintId}.`);
  }

  const attemptCheck = canAttemptStage(journey, stageId);
  if (!attemptCheck.allowed) {
    throw new Error(`Cannot attempt stage ${stageId}: ${attemptCheck.reason}`);
  }

  const percentageScore = maxScore > 0 ? Number(((rawScore / maxScore) * 100).toFixed(2)) : 0;
  const threshold = stageDef.passingThresholdScore ?? 70;
  const stagePassed = percentageScore >= threshold;

  const prevProgress = journey.stageProgress[stageId] || {
    stageId,
    stageType: stageDef.stageType,
    title: stageDef.title,
    order: stageDef.order,
    status: "NOT_STARTED",
    rawScore: 0,
    maxScore: 100,
    percentageScore: 0,
    attemptCount: 0,
  };

  const now = new Date().toISOString();

  const updatedProgress: StageProgressItem = {
    ...prevProgress,
    status: stagePassed ? "PASSED" : "FAILED",
    rawScore,
    maxScore,
    percentageScore,
    durationSeconds,
    telemetry,
    rubricEvaluations,
    evaluatorFeedback,
    sessionReferenceId,
    attemptCount: prevProgress.attemptCount + 1,
    completedAt: now,
  };

  const newStageProgress = {
    ...journey.stageProgress,
    [stageId]: updatedProgress,
  };

  // Recalculate competency scores
  const newCompetencyScores = { ...journey.competencyScores };
  for (const comp of stageDef.targetCompetencies) {
    if (newCompetencyScores[comp] !== undefined) {
      newCompetencyScores[comp] = Number(
        ((newCompetencyScores[comp] + percentageScore) / 2).toFixed(2)
      );
    } else {
      newCompetencyScores[comp] = percentageScore;
    }
  }

  // Recalculate overall score (average of completed stage percentages)
  const completedStages = Object.values(newStageProgress).filter(
    (p) => p.status === "PASSED" || p.status === "FAILED"
  );
  const totalScore = completedStages.reduce((sum, s) => sum + s.percentageScore, 0);
  const overallScore =
    completedStages.length > 0 ? Number((totalScore / completedStages.length).toFixed(2)) : 0;

  // Determine next stage and journey status
  let newStatus = journey.status;
  let nextStageId: string | null = null;
  let isCompleted = false;

  const allStages = [...blueprint.stages].sort((a, b) => a.order - b.order);

  if (!stagePassed && !stageDef.isOptional) {
    // Stage failed: if hard requirement, mark DID_NOT_PASS
    newStatus = "DID_NOT_PASS";
    isCompleted = true;
  } else {
    // Stage passed: look for next unpassed stage whose dependencies are satisfied
    const remainingStages = allStages.filter(
      (s) => newStageProgress[s.id]?.status !== "PASSED"
    );

    if (remainingStages.length === 0) {
      // All stages completed and passed!
      newStatus = "OFFER_EXTENDED";
      isCompleted = true;
    } else {
      // Find the next stage whose dependencies are met
      const nextCandidate = remainingStages.find((s) => {
        return s.dependsOn.every((depId) => newStageProgress[depId]?.status === "PASSED");
      });

      if (nextCandidate) {
        nextStageId = nextCandidate.id;
      } else {
        // No stages ready (could happen if dependencies are unmet or blocked)
        nextStageId = null;
      }
    }
  }

  const updatedJourney: StudentRecruitmentJourney = {
    ...journey,
    currentStageId: nextStageId || journey.currentStageId,
    status: newStatus,
    overallScore,
    stageProgress: newStageProgress,
    competencyScores: newCompetencyScores,
    completedAt: isCompleted ? now : undefined,
    updatedAt: now,
  };

  return {
    updatedJourney,
    stagePassed,
    nextStageId,
    isCompleted,
  };
}

