/**
 * COGNALYZE INTERVIEW SYSTEM — COMPETENCY COVERAGE ENGINE
 * 
 * Tracks interview competency coverage across 6 formal lifecycle states:
 * - NOT_STARTED
 * - IN_PROGRESS
 * - EVIDENCE_COLLECTED
 * - NEEDS_DEEPER_EVALUATION
 * - COMPLETED
 * - NOT_APPLICABLE
 * 
 * Enforces question budgets to prevent tunnel vision on a single project or topic.
 */

import { StructuredInterviewBlueprint, BlueprintCategoryCode } from "./interview-blueprint-service";

export type CompetencyCoverageState =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "EVIDENCE_COLLECTED"
  | "NEEDS_DEEPER_EVALUATION"
  | "COMPLETED"
  | "NOT_APPLICABLE";

export interface TrackedCompetencyRecord {
  id: string;
  name: string;
  categoryCode: BlueprintCategoryCode;
  state: CompetencyCoverageState;
  turnsSpent: number;
  maxTurnBudget: number;
  evidenceQuotes: string[];
  observedStrengths: string[];
  observedWeaknesses: string[];
  lastTurnIndexEvaluated?: number;
}

export interface CompetencyCoverageTracker {
  sessionId: string;
  competencies: Map<string, TrackedCompetencyRecord>;
  entityTurnCounts: Map<string, number>; // Project/system name -> turns spent
  maxTurnsPerEntity: number; // Default 2
  maxTurnsPerCompetency: number; // Default 2
}

/**
 * Initializes the Competency Coverage Tracker from a structured blueprint.
 */
export function initCompetencyCoverageTracker(
  blueprint: StructuredInterviewBlueprint
): CompetencyCoverageTracker {
  const competencies = new Map<string, TrackedCompetencyRecord>();
  const entityTurnCounts = new Map<string, number>();

  for (const cat of blueprint.categories) {
    for (const compName of cat.targetCompetencies) {
      competencies.set(compName, {
        id: `comp_${compName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: compName,
        categoryCode: cat.code,
        state: "NOT_STARTED",
        turnsSpent: 0,
        maxTurnBudget: blueprint.maxTurnsPerCompetency || 2,
        evidenceQuotes: [],
        observedStrengths: [],
        observedWeaknesses: [],
      });
    }
  }

  return {
    sessionId: blueprint.sessionId,
    competencies,
    entityTurnCounts,
    maxTurnsPerEntity: blueprint.maxTurnsPerProject || 2,
    maxTurnsPerCompetency: blueprint.maxTurnsPerCompetency || 2,
  };
}

/**
 * Checks if a specific project/system can be probed further without violating anti-tunnel-vision budget.
 */
export function canProbeProjectEntity(
  tracker: CompetencyCoverageTracker,
  projectName: string
): boolean {
  const norm = (projectName || "").toLowerCase().trim();
  const currentTurns = tracker.entityTurnCounts.get(norm) || 0;
  return currentTurns < tracker.maxTurnsPerEntity;
}

/**
 * Records a turn spent on a specific project/system entity.
 */
export function recordProjectTurn(
  tracker: CompetencyCoverageTracker,
  projectName: string
): void {
  const norm = (projectName || "").toLowerCase().trim();
  const current = tracker.entityTurnCounts.get(norm) || 0;
  tracker.entityTurnCounts.set(norm, current + 1);
}

/**
 * Updates competency state following candidate's answer and evaluation.
 */
export function updateCompetencyEvaluation(
  tracker: CompetencyCoverageTracker,
  competencyName: string,
  answerQuality: "strong" | "adequate" | "shallow" | "does_not_know" | "contradictory" | "declined" | "off_topic",
  candidateQuote?: string,
  turnIndex?: number
): void {
  let record = tracker.competencies.get(competencyName);
  if (!record) {
    // Dynamically track new or sub-competencies
    record = {
      id: `comp_${competencyName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      name: competencyName,
      categoryCode: "CAT_A_RESUME_PROJECTS",
      state: "IN_PROGRESS",
      turnsSpent: 0,
      maxTurnBudget: tracker.maxTurnsPerCompetency,
      evidenceQuotes: [],
      observedStrengths: [],
      observedWeaknesses: [],
    };
    tracker.competencies.set(competencyName, record);
  }

  record.turnsSpent += 1;
  record.lastTurnIndexEvaluated = turnIndex;

  if (candidateQuote) {
    record.evidenceQuotes.push(candidateQuote.slice(0, 300));
  }

  if (answerQuality === "strong") {
    record.state = "EVIDENCE_COLLECTED";
    record.observedStrengths.push(`Demonstrated solid grasp with clear technical mechanics.`);
  } else if (answerQuality === "adequate") {
    record.state = "EVIDENCE_COLLECTED";
  } else if (answerQuality === "shallow") {
    // If budget reached, mark COMPLETED with weakness; else mark NEEDS_DEEPER_EVALUATION
    if (record.turnsSpent >= record.maxTurnBudget) {
      record.state = "COMPLETED";
      record.observedWeaknesses.push("Remained shallow despite targeted follow-up questions.");
    } else {
      record.state = "NEEDS_DEEPER_EVALUATION";
    }
  } else if (answerQuality === "does_not_know" || answerQuality === "contradictory") {
    record.state = "COMPLETED"; // Pivot immediately to save turn budget
    record.observedWeaknesses.push(
      answerQuality === "does_not_know"
        ? "Acknowledged unfamiliarity with this specific concept."
        : "Provided conflicting or contradictory technical explanations."
    );
  }

  // Budget gate
  if (record.turnsSpent >= record.maxTurnBudget && record.state !== "EVIDENCE_COLLECTED") {
    record.state = "COMPLETED";
  }
}

/**
 * Selects the next best competency to probe, ensuring coverage across untouched areas.
 */
export function getNextTargetCompetency(
  tracker: CompetencyCoverageTracker
): TrackedCompetencyRecord | null {
  // 1. Look for NOT_STARTED competencies
  for (const record of tracker.competencies.values()) {
    if (record.state === "NOT_STARTED") {
      return record;
    }
  }

  // 2. Look for NEEDS_DEEPER_EVALUATION that still have turn budget
  for (const record of tracker.competencies.values()) {
    if (record.state === "NEEDS_DEEPER_EVALUATION" && record.turnsSpent < record.maxTurnBudget) {
      return record;
    }
  }

  return null;
}

