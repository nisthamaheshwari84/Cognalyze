/**
 * Code Comprehension Lab — Stage 6: Learning Progression Store
 * 
 * Provides unified, multi-tenant persistence for the 5-stage learning pipeline:
 * LEARN -> WORKED EXAMPLES / VISUAL DRY RUN -> GUIDED PRACTICE -> REPO EXPLORATION -> INTERVIEW SIMULATION -> STUDENT DNA
 */

export interface Stage1Progress {
  completedModules: string[];
  checkScores: Record<string, number>; // checkId -> score (0 or 100)
  conceptMastery: Record<string, boolean>;
  isStageComplete: boolean;
}

export interface Stage2Progress {
  completedWorkflows: string[];
  modeCompletions: Record<string, ("I_DO" | "WE_DO" | "YOU_DO")[]>;
  predictionAccuracy: number; // 0 - 100
  isStageComplete: boolean;
}

export interface Stage3Progress {
  solvedScenarios: string[];
  hintsUsedCount: number;
  totalPenaltyAccrued: number;
  averageScore: number;
  isStageComplete: boolean;
}

export interface Stage4Progress {
  exploredCodebases: string[];
  solvedBugIds: string[];
  sandboxPassCount: number;
  isStageComplete: boolean;
}

export interface Stage5Progress {
  completedRounds: string[];
  overallInterviewScore: number | null;
  certificationTier: string | null;
  dnaSynced: boolean;
  isStageComplete: boolean;
}

export interface LearningJourneyState {
  candidateId: string;
  tenantId: string;
  currentStage: 1 | 2 | 3 | 4 | 5;
  stage1: Stage1Progress;
  stage2: Stage2Progress;
  stage3: Stage3Progress;
  stage4: Stage4Progress;
  stage5: Stage5Progress;
  lastActiveTimestamp: string;
  nextRecommendedAction: {
    stage: 1 | 2 | 3 | 4 | 5;
    actionTitle: string;
    description: string;
    targetId?: string;
  };
}

export class LearningProgressionStore {
  private static store: Map<string, LearningJourneyState> = new Map();

  private static getKey(tenantId: string, candidateId: string): string {
    return `${tenantId}::${candidateId}`;
  }

  /**
   * Initializes or fetches student learning progression
   */
  static getProgress(tenantId: string, candidateId: string): LearningJourneyState {
    const key = this.getKey(tenantId, candidateId);
    let state = this.store.get(key);

    if (!state) {
      state = {
        candidateId,
        tenantId,
        currentStage: 1,
        stage1: {
          completedModules: [],
          checkScores: {},
          conceptMastery: {},
          isStageComplete: false,
        },
        stage2: {
          completedWorkflows: [],
          modeCompletions: {},
          predictionAccuracy: 100,
          isStageComplete: false,
        },
        stage3: {
          solvedScenarios: [],
          hintsUsedCount: 0,
          totalPenaltyAccrued: 0,
          averageScore: 100,
        isStageComplete: false,
        },
        stage4: {
          exploredCodebases: ["taskflow-api-v1"],
          solvedBugIds: [],
          sandboxPassCount: 0,
          isStageComplete: false,
        },
        stage5: {
          completedRounds: [],
          overallInterviewScore: null,
          certificationTier: null,
          dnaSynced: false,
          isStageComplete: false,
        },
        lastActiveTimestamp: new Date().toISOString(),
        nextRecommendedAction: {
          stage: 1,
          actionTitle: "Start Module 1: How to Read Code",
          description: "Learn how senior engineers navigate unfamiliar codebases and locate entry points.",
          targetId: "module-1-how-to-read-code",
        },
      };
      this.store.set(key, state);
    }

    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Updates Stage 1 (Foundations) Progress
   */
  static recordModuleCheck(
    tenantId: string,
    candidateId: string,
    moduleId: string,
    checkId: string,
    isCorrect: boolean,
    conceptTag: string
  ): LearningJourneyState {
    const key = this.getKey(tenantId, candidateId);
    const state = this.getProgress(tenantId, candidateId);

    state.stage1.checkScores[checkId] = isCorrect ? 100 : 0;
    if (isCorrect) {
      state.stage1.conceptMastery[conceptTag] = true;
      if (!state.stage1.completedModules.includes(moduleId)) {
        state.stage1.completedModules.push(moduleId);
      }
    }

    // Stage 1 considered complete if at least 2 modules completed
    if (state.stage1.completedModules.length >= 2) {
      state.stage1.isStageComplete = true;
      if (state.currentStage === 1) state.currentStage = 2;
    }

    this.recomputeNextAction(state);
    state.lastActiveTimestamp = new Date().toISOString();
    this.store.set(key, state);

    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Updates Stage 2 (Visual Dry Run) Progress
   */
  static recordWorkflowTrace(
    tenantId: string,
    candidateId: string,
    workflowId: string,
    mode: "I_DO" | "WE_DO" | "YOU_DO",
    predictionSuccess?: boolean
  ): LearningJourneyState {
    const key = this.getKey(tenantId, candidateId);
    const state = this.getProgress(tenantId, candidateId);

    if (!state.stage2.completedWorkflows.includes(workflowId)) {
      state.stage2.completedWorkflows.push(workflowId);
    }

    if (!state.stage2.modeCompletions[workflowId]) {
      state.stage2.modeCompletions[workflowId] = [];
    }
    if (!state.stage2.modeCompletions[workflowId].includes(mode)) {
      state.stage2.modeCompletions[workflowId].push(mode);
    }

    if (predictionSuccess !== undefined) {
      state.stage2.predictionAccuracy = predictionSuccess ? 100 : 50;
    }

    if (state.stage2.completedWorkflows.length >= 1) {
      state.stage2.isStageComplete = true;
      if (state.currentStage === 2) state.currentStage = 3;
    }

    this.recomputeNextAction(state);
    state.lastActiveTimestamp = new Date().toISOString();
    this.store.set(key, state);

    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Updates Stage 3 (Guided Practice) Progress
   */
  static recordPracticeAttempt(
    tenantId: string,
    candidateId: string,
    scenarioId: string,
    isCorrect: boolean,
    hintsUsed: number,
    finalScore: number
  ): LearningJourneyState {
    const key = this.getKey(tenantId, candidateId);
    const state = this.getProgress(tenantId, candidateId);

    if (isCorrect && !state.stage3.solvedScenarios.includes(scenarioId)) {
      state.stage3.solvedScenarios.push(scenarioId);
    }
    state.stage3.hintsUsedCount += hintsUsed;
    state.stage3.totalPenaltyAccrued += (100 - finalScore);

    if (state.stage3.solvedScenarios.length >= 2) {
      state.stage3.isStageComplete = true;
      if (state.currentStage === 3) state.currentStage = 4;
    }

    this.recomputeNextAction(state);
    state.lastActiveTimestamp = new Date().toISOString();
    this.store.set(key, state);

    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Updates Stage 4 (Repository Explorer) Progress
   */
  static recordRepoFix(
    tenantId: string,
    candidateId: string,
    codebaseId: string,
    bugId: string,
    testsPassed: boolean
  ): LearningJourneyState {
    const key = this.getKey(tenantId, candidateId);
    const state = this.getProgress(tenantId, candidateId);

    if (testsPassed) {
      if (!state.stage4.solvedBugIds.includes(bugId)) {
        state.stage4.solvedBugIds.push(bugId);
      }
      state.stage4.sandboxPassCount += 1;
    }

    if (state.stage4.solvedBugIds.length >= 1) {
      state.stage4.isStageComplete = true;
      if (state.currentStage === 4) state.currentStage = 5;
    }

    this.recomputeNextAction(state);
    state.lastActiveTimestamp = new Date().toISOString();
    this.store.set(key, state);

    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Updates Stage 5 (Interview Simulation) Progress
   */
  static recordInterviewCompletion(
    tenantId: string,
    candidateId: string,
    overallScore: number,
    tier: string,
    dnaSynced: boolean
  ): LearningJourneyState {
    const key = this.getKey(tenantId, candidateId);
    const state = this.getProgress(tenantId, candidateId);

    state.stage5.overallInterviewScore = overallScore;
    state.stage5.certificationTier = tier;
    state.stage5.dnaSynced = dnaSynced;
    state.stage5.isStageComplete = true;

    this.recomputeNextAction(state);
    state.lastActiveTimestamp = new Date().toISOString();
    this.store.set(key, state);

    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Dynamically calculates next best learning action based on progress
   */
  private static recomputeNextAction(state: LearningJourneyState): void {
    if (!state.stage1.isStageComplete) {
      state.nextRecommendedAction = {
        stage: 1,
        actionTitle: "Complete Engineering Foundations",
        description: "Study Module 2: Debugging Methodology and solve checkpoint tests.",
        targetId: "module-2-debugging-methodology",
      };
      return;
    }

    if (!state.stage2.isStageComplete) {
      state.nextRecommendedAction = {
        stage: 2,
        actionTitle: "Run Visual Dry Run Studio",
        description: "Trace 'taskflow_create_task' in 'WE DO' mode to predict stack mutations.",
        targetId: "taskflow_create_task",
      };
      return;
    }

    if (!state.stage3.isStageComplete) {
      state.nextRecommendedAction = {
        stage: 3,
        actionTitle: "Solve Guided Practice Scenarios",
        description: "Investigate what happens when optimistic concurrency checks are omitted.",
        targetId: "whatif-concurrency-version-check-deleted",
      };
      return;
    }

    if (!state.stage4.isStageComplete) {
      state.nextRecommendedAction = {
        stage: 4,
        actionTitle: "Fix Repository Bugs in Sandbox",
        description: "Investigate and patch the RBAC status bypass bug in TaskFlow.",
        targetId: "bug-detective-rbac",
      };
      return;
    }

    if (!state.stage5.isStageComplete) {
      state.nextRecommendedAction = {
        stage: 5,
        actionTitle: "Simulate Senior Engineer Interview",
        description: "Complete all 4 interview rounds and synchronize your certified score with Student DNA.",
      };
      return;
    }

    state.nextRecommendedAction = {
      stage: 5,
      actionTitle: "Learning Journey Mastered!",
      description: "You have verified mastery across all 5 stages of the Code Comprehension Lab.",
    };
  }

  /**
   * Resets progress (for testing or re-certification)
   */
  static clear(tenantId?: string, candidateId?: string): void {
    if (tenantId && candidateId) {
      this.store.delete(this.getKey(tenantId, candidateId));
    } else {
      this.store.clear();
    }
  }
}

