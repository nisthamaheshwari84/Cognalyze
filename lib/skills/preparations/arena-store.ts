/**
 * COGNALYZE PREPARATIONS ARENA STORE
 * 
 * Manages persistent state for candidate arena enrollments,
 * task completions, starting levels, project submissions, and Student DNA synchronization.
 */

import fs from "fs";
import path from "path";
import {
  StudentArenaState,
  StartingLevel,
  RoadmapNodeMasteryState,
  ContributionWorkspaceState,
  PersistedAssessmentAttempt,
  PersistedInterviewSession,
  AgentTraceEntry,
} from "./types";
import { CANONICAL_PREPARATION_ARENAS, getPreparationArenaBySlug } from "./canonical-arenas-registry";
import { logDNAChange, recordCareerMemoryItem } from "@/lib/intelligence/student-intelligence";

const STORE_PATH = path.join(process.cwd(), "data", "student-preparations-store.json");
const INTEL_STORE_PATH = path.join(process.cwd(), "data", "student-preparations-intelligence-store.json");

export interface ExtendedPreparationData {
  candidateId: string;
  arenaId: string;
  roadmapNodeStates: Record<string, RoadmapNodeMasteryState>;
  contributionWorkspaces: Record<string, ContributionWorkspaceState>;
  inspectedRepoNames: string[];
  activeProjectIds: string[];
  assessmentHistory: PersistedAssessmentAttempt[];
  interviewHistory: PersistedInterviewSession[];
  agentTraceLedger: AgentTraceEntry[];
  updatedAt: string;
}

export class PreparationsArenaStore {
  private static instance: PreparationsArenaStore;
  private stateMap: Map<string, StudentArenaState> = new Map();
  private extendedMap: Map<string, ExtendedPreparationData> = new Map();

  private constructor() {
    this.loadFromDisk();
  }

  public static getInstance(): PreparationsArenaStore {
    if (!PreparationsArenaStore.instance) {
      PreparationsArenaStore.instance = new PreparationsArenaStore();
    }
    return PreparationsArenaStore.instance;
  }

  private getKey(candidateId: string, arenaId: string): string {
    return `${candidateId}::${arenaId}`;
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        const list: StudentArenaState[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            this.stateMap.set(this.getKey(item.candidateId, item.arenaId), item);
          }
        }
      }
      if (fs.existsSync(INTEL_STORE_PATH)) {
        const rawExt = fs.readFileSync(INTEL_STORE_PATH, "utf-8");
        const extList: ExtendedPreparationData[] = JSON.parse(rawExt);
        if (Array.isArray(extList)) {
          for (const item of extList) {
            this.extendedMap.set(this.getKey(item.candidateId, item.arenaId), item);
          }
        }
      }
    } catch {
      // Non-fatal fallback
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.stateMap.values());
      fs.writeFileSync(STORE_PATH, JSON.stringify(list, null, 2), "utf-8");

      const extList = Array.from(this.extendedMap.values());
      fs.writeFileSync(INTEL_STORE_PATH, JSON.stringify(extList, null, 2), "utf-8");
    } catch {
      // Non-fatal fallback
    }
  }

  /**
   * Retrieves or initializes student state for an arena
   */
  public getOrCreateState(candidateId: string, arenaId: string): StudentArenaState {
    const key = this.getKey(candidateId, arenaId);
    let state = this.stateMap.get(key);

    if (!state) {
      state = {
        candidateId,
        arenaId,
        selectedLevel: "beginner",
        completedTaskIds: [],
        activeTaskIndex: 0,
        submittedProjectIds: [],
        mockAssessmentScores: {},
        readinessScore: 0,
        evidenceCount: 0,
        lastActiveAt: new Date().toISOString(),
      };
      this.stateMap.set(key, state);
      this.saveToDisk();
    }

    return state;
  }

  /**
   * Sets or updates student's starting level for an arena
   */
  public setStartingLevel(candidateId: string, arenaId: string, level: StartingLevel): StudentArenaState {
    const state = this.getOrCreateState(candidateId, arenaId);
    state.selectedLevel = level;
    state.lastActiveAt = new Date().toISOString();
    this.saveToDisk();
    return state;
  }

  /**
   * Completes a task, recalculates readiness, and logs evidence to Student DNA
   */
  public completeTask(
    candidateId: string,
    arenaId: string,
    taskId: string,
    evidenceLabel?: string
  ): StudentArenaState {
    const state = this.getOrCreateState(candidateId, arenaId);
    if (!state.completedTaskIds.includes(taskId)) {
      state.completedTaskIds.push(taskId);
      state.evidenceCount += 1;

      const arena = getPreparationArenaBySlug(arenaId);
      const totalTasks = (arena?.phases[state.selectedLevel] || []).flatMap(p => p.tasks).length || 5;
      state.readinessScore = Math.min(100, Math.round((state.completedTaskIds.length / totalTasks) * 100));
      state.lastActiveAt = new Date().toISOString();

      this.saveToDisk();

      // Synchronize with Student DNA
      try {
        logDNAChange(candidateId, {
          id: `dna-change-${Date.now()}`,
          timestamp: new Date().toISOString(),
          triggerEvent: `Completed task '${taskId}' in ${arena?.shortName || arenaId} Preparation Arena`,
          beforeSummary: "Preparing target opportunity milestone",
          newEvidence: evidenceLabel || `Demonstrated milestone in ${arena?.shortName || arenaId}`,
          afterSummary: `Readiness elevated to ${state.readinessScore}% for ${arena?.shortName || arenaId}`,
          affectedCapabilities: (arena?.primaryDomains || []) as string[],
          affectedOpportunitiesDelta: 1,
        });

        recordCareerMemoryItem(candidateId, {
          id: `prep-milestone-${Date.now()}`,
          type: "assessment_result",
          companyName: arena?.companyOrOrg || "Opportunity",
          roleTitle: arena?.shortName || "Preparation Track",
          date: new Date().toISOString().split("T")[0],
          status: "Completed",
          feedbackNotes: evidenceLabel || `Completed task ${taskId}`,
          strengthsObserved: (arena?.requiredSkills.map(s => s.skill) || []) as string[],
          weaknessesObserved: [],
          hasCorroboratedPattern: false,
        });
      } catch {
        // Safe fallback in test runtimes
      }
    }

    return state;
  }

  /**
   * Records a mock assessment score
   */
  public recordAssessmentScore(
    candidateId: string,
    arenaId: string,
    assessmentId: string,
    score: number,
    percentage: number,
    passed: boolean
  ): StudentArenaState {
    const state = this.getOrCreateState(candidateId, arenaId);
    state.mockAssessmentScores[assessmentId] = {
      score,
      percentage,
      passed,
      completedAt: new Date().toISOString(),
    };
    state.lastActiveAt = new Date().toISOString();
    this.saveToDisk();
    return state;
  }

  /**
   * Saves and evaluates a proposal draft
   */
  public saveProposalDraft(
    candidateId: string,
    arenaId: string,
    proposalText: string,
    evaluation?: StudentArenaState["proposalEvaluation"]
  ): StudentArenaState {
    const state = this.getOrCreateState(candidateId, arenaId);
    state.proposalDraft = proposalText;
    if (evaluation) {
      state.proposalEvaluation = evaluation;
    }
    state.lastActiveAt = new Date().toISOString();
    this.saveToDisk();
    return state;
  }

  /**
   * Gets all enrolled arenas for a candidate
   */
  public getCandidateEnrolledArenas(candidateId: string): StudentArenaState[] {
    const results: StudentArenaState[] = [];
    for (const [key, state] of this.stateMap.entries()) {
      if (key.startsWith(`${candidateId}::`)) {
        results.push(state);
      }
    }
    return results;
  }

  public getOrCreateExtendedData(candidateId: string, arenaId: string): ExtendedPreparationData {
    if (!candidateId) throw new Error("Strict user isolation violation: candidateId required.");
    const key = this.getKey(candidateId, arenaId);
    let data = this.extendedMap.get(key);
    if (!data) {
      data = {
        candidateId,
        arenaId,
        roadmapNodeStates: {},
        contributionWorkspaces: {},
        inspectedRepoNames: [],
        activeProjectIds: [],
        assessmentHistory: [],
        interviewHistory: [],
        agentTraceLedger: [],
        updatedAt: new Date().toISOString(),
      };
      this.extendedMap.set(key, data);
      this.saveToDisk();
    }
    return data;
  }

  public updateRoadmapNodeState(
    candidateId: string,
    arenaId: string,
    nodeId: string,
    masteryState: RoadmapNodeMasteryState
  ): ExtendedPreparationData {
    const ext = this.getOrCreateExtendedData(candidateId, arenaId);
    ext.roadmapNodeStates[nodeId] = masteryState;
    ext.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return ext;
  }

  public upsertContributionWorkspace(
    candidateId: string,
    arenaId: string,
    workspace: ContributionWorkspaceState
  ): ExtendedPreparationData {
    const ext = this.getOrCreateExtendedData(candidateId, arenaId);
    ext.contributionWorkspaces[workspace.issueId] = workspace;
    if (!ext.inspectedRepoNames.includes(workspace.repoFullName)) {
      ext.inspectedRepoNames.push(workspace.repoFullName);
    }
    ext.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return ext;
  }

  public markProjectActive(candidateId: string, arenaId: string, projectId: string): ExtendedPreparationData {
    const ext = this.getOrCreateExtendedData(candidateId, arenaId);
    if (!ext.activeProjectIds.includes(projectId)) {
      ext.activeProjectIds.push(projectId);
    }
    ext.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return ext;
  }

  public saveAssessmentAttempt(
    candidateId: string,
    arenaId: string,
    attempt: PersistedAssessmentAttempt
  ): ExtendedPreparationData {
    const ext = this.getOrCreateExtendedData(candidateId, arenaId);
    const idx = ext.assessmentHistory.findIndex(a => a.sessionId === attempt.sessionId);
    if (idx >= 0) {
      ext.assessmentHistory[idx] = attempt;
    } else {
      ext.assessmentHistory.unshift(attempt);
    }
    ext.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return ext;
  }

  public getAssessmentAttempt(
    candidateId: string,
    arenaId: string,
    sessionId: string
  ): PersistedAssessmentAttempt | null {
    const ext = this.getOrCreateExtendedData(candidateId, arenaId);
    return ext.assessmentHistory.find(a => a.sessionId === sessionId) || null;
  }

  public saveInterviewSession(
    candidateId: string,
    arenaId: string,
    session: PersistedInterviewSession
  ): ExtendedPreparationData {
    const ext = this.getOrCreateExtendedData(candidateId, arenaId);
    const idx = ext.interviewHistory.findIndex(s => s.sessionId === session.sessionId);
    if (idx >= 0) {
      ext.interviewHistory[idx] = session;
    } else {
      ext.interviewHistory.unshift(session);
    }
    ext.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return ext;
  }

  public getInterviewSession(
    candidateId: string,
    arenaId: string,
    sessionId: string
  ): PersistedInterviewSession | null {
    const ext = this.getOrCreateExtendedData(candidateId, arenaId);
    return ext.interviewHistory.find(s => s.sessionId === sessionId) || null;
  }

  public appendAgentTraces(
    candidateId: string,
    arenaId: string,
    entries: AgentTraceEntry[]
  ): ExtendedPreparationData {
    const ext = this.getOrCreateExtendedData(candidateId, arenaId);
    // Keep most recent 40 traceable agent decisions
    ext.agentTraceLedger = [...entries, ...ext.agentTraceLedger].slice(0, 40);
    ext.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return ext;
  }
}

export const preparationsStore = PreparationsArenaStore.getInstance();
