/**
 * COGNALYZE — DYNAMIC CRITERIA-DRIVEN HIRING FUNNEL ENGINE (Section 14, 15, 18, 52, 53)
 * 
 * Rules:
 * 1. Zero hardcoded stage counts (no "Top 300", "Top 100", "first 10%").
 * 2. Progression is criteria-based: candidate progresses IF AND ONLY IF they meet role criteria.
 * 3. Explainable transitions stored with reason_code, reason_text, and evidence_ids.
 * 4. Recruiter overrides are first-class: recruiter actions never overwrite system assessments.
 * 5. Shares state with Decision Room.
 */

import {
  FunnelStageId,
  StageTransitionRecord,
  ProgressionDecisionSource
} from "../evidence/types";
import { OrchestratedDossier } from "../evidence/orchestrator";

export interface ProgressionCriteria {
  roleId: string;
  roleVersion: number;
  initialReviewMinRequiredSupportedRatio: number; // e.g. 0.5 (at least 50% of required skills supported or reported)
  deepReviewMinImplementationCount: number; // e.g. at least 1 verified project
  decisionRoomMaxBlockingGaps: number; // e.g. 0 unresolved blocking requirements
}

export interface CandidateFunnelState {
  candidateId: string;
  candidateName: string;
  roleId: string;
  roleVersion: number;
  currentStage: FunnelStageId;
  eligibleForNextStage: boolean;
  nextStageReason: string;
  transitionHistory: StageTransitionRecord[];
  recruiterOverrideActive: boolean;
  recruiterOverrideNote?: string;
  dossierSummary: {
    totalRequirements: number;
    supportedCount: number;
    needsVerificationCount: number;
    documentedExperienceMonths: number;
  };
}

export class DynamicFunnelEngine {
  /**
   * Evaluates candidate progression against deterministic role criteria.
   */
  public evaluateProgression(
    candidateState: CandidateFunnelState,
    dossier: OrchestratedDossier,
    criteria: ProgressionCriteria
  ): { eligible: boolean; nextStage: FunnelStageId; reasonCode: string; reasonText: string; evidenceIds: string[] } {
    const current = candidateState.currentStage;
    const evaluatedRequirements = dossier.requirementMappings.map(r => r.requirementId);
    const supportingEvidenceIds = dossier.evidenceItems.map(e => e.evidenceId);

    // 1. Stage: APPLICATION -> INITIAL_EVIDENCE_REVIEW
    if (current === "APPLICATION") {
      const hasResume = dossier.sources.some(s => s.category === "PRIMARY_RESUME" && s.retrievalStatus === "SUCCESS");
      if (hasResume) {
        return {
          eligible: true,
          nextStage: "INITIAL_EVIDENCE_REVIEW",
          reasonCode: "APPLICATION_COMPLETE",
          reasonText: `Candidate submitted valid application and documented experience (${Math.floor(dossier.documentedExperienceMonths / 12)} yrs).`,
          evidenceIds: supportingEvidenceIds.slice(0, 3)
        };
      }
      return {
        eligible: false,
        nextStage: "APPLICATION",
        reasonCode: "INCOMPLETE_SUBMISSION",
        reasonText: "Resume text could not be parsed into verified employment or skills.",
        evidenceIds: []
      };
    }

    // 2. Stage: INITIAL_EVIDENCE_REVIEW -> DEEP_EVIDENCE_REVIEW
    if (current === "INITIAL_EVIDENCE_REVIEW") {
      const requiredReqs = dossier.requirementMappings.filter(r => r.isBlocking);
      const supportedRequired = requiredReqs.filter(r => r.status === "SUPPORTED" || r.status === "PARTIALLY_SUPPORTED" || r.status === "CANDIDATE_REPORTED");
      const ratio = requiredReqs.length > 0 ? supportedRequired.length / requiredReqs.length : 1;

      if (ratio >= criteria.initialReviewMinRequiredSupportedRatio) {
        return {
          eligible: true,
          nextStage: "DEEP_EVIDENCE_REVIEW",
          reasonCode: "REQUIRED_REQUIREMENTS_SUBSTANTIATED",
          reasonText: `Candidate satisfies ${supportedRequired.length} of ${requiredReqs.length} core role criteria in submitted materials.`,
          evidenceIds: dossier.requirementMappings.flatMap(r => r.candidateEvidenceIds).slice(0, 5)
        };
      }
      return {
        eligible: false,
        nextStage: "INITIAL_EVIDENCE_REVIEW",
        reasonCode: "INSUFFICIENT_REQUIREMENT_COVERAGE",
        reasonText: `Candidate only satisfies ${supportedRequired.length} of ${requiredReqs.length} required role criteria.`,
        evidenceIds: []
      };
    }

    // 3. Stage: DEEP_EVIDENCE_REVIEW -> DECISION_ROOM
    if (current === "DEEP_EVIDENCE_REVIEW") {
      const hasImplementation = dossier.projects.length >= criteria.deepReviewMinImplementationCount;
      const blockingGaps = dossier.requirementMappings.filter(r => r.isBlocking && r.status === "EVIDENCE_NOT_FOUND");

      if (hasImplementation && blockingGaps.length <= criteria.decisionRoomMaxBlockingGaps) {
        return {
          eligible: true,
          nextStage: "DECISION_ROOM",
          reasonCode: "INSPECTION_CONFIRMED",
          reasonText: `Verified code implementation artifacts found across ${dossier.projects.length} repository projects with zero blocking eligibility gaps.`,
          evidenceIds: dossier.projects.map(p => `proj-${p.projectId}`)
        };
      }
      return {
        eligible: false,
        nextStage: "DEEP_EVIDENCE_REVIEW",
        reasonCode: "VERIFICATION_PREREQUISITE_PENDING",
        reasonText: `Candidate has ${blockingGaps.length} blocking requirement gaps or lacks independent code implementation evidence.`,
        evidenceIds: []
      };
    }

    // 4. Stage: DECISION_ROOM -> RECRUITER_REVIEW
    if (current === "DECISION_ROOM") {
      return {
        eligible: true,
        nextStage: "RECRUITER_REVIEW",
        reasonCode: "DECISION_READY",
        reasonText: "Dossier contains verified claims, project forensics, and targeted verification questions ready for recruiter evaluation.",
        evidenceIds: supportingEvidenceIds.slice(0, 5)
      };
    }

    // 5. Default: Remains in stage awaiting human recruiter action
    return {
      eligible: false,
      nextStage: current,
      reasonCode: "AWAITING_HUMAN_DECISION",
      reasonText: "Current stage requires human recruiter review or interview completion.",
      evidenceIds: []
    };
  }

  /**
   * Executes progression transition, recording full explainable metadata.
   */
  public progressCandidate(
    candidateState: CandidateFunnelState,
    dossier: OrchestratedDossier,
    targetStage: FunnelStageId,
    decisionSource: ProgressionDecisionSource,
    actorId: string,
    reasonOverride?: string
  ): CandidateFunnelState {
    const fromStage = candidateState.currentStage;
    const isOverride = decisionSource === "RECRUITER_DECISION" && reasonOverride !== undefined;

    const transitionRecord: StageTransitionRecord = {
      transitionId: `trans-${candidateState.candidateId}-${candidateState.transitionHistory.length + 1}-${Date.now()}`,
      candidateId: candidateState.candidateId,
      roleId: candidateState.roleId,
      roleVersion: candidateState.roleVersion,
      fromStage,
      toStage: targetStage,
      requirementsEvaluated: dossier.requirementMappings.map(r => r.requirementId),
      evidenceIds: dossier.evidenceItems.map(e => e.evidenceId).slice(0, 5),
      reasonCode: isOverride ? "RECRUITER_OVERRIDE" : "CRITERIA_SATISFIED",
      reasonText: reasonOverride || `Advanced from ${fromStage} to ${targetStage} based on confirmed evidence criteria.`,
      decisionSource,
      actorType: decisionSource === "RECRUITER_DECISION" ? "RECRUITER" : "SYSTEM",
      actorId,
      timestamp: new Date().toISOString(),
      evidenceVersion: dossier.evidenceVersion
    };

    return {
      ...candidateState,
      currentStage: targetStage,
      eligibleForNextStage: false,
      nextStageReason: `Current stage: ${targetStage}.`,
      transitionHistory: [...candidateState.transitionHistory, transitionRecord],
      recruiterOverrideActive: isOverride,
      recruiterOverrideNote: reasonOverride || candidateState.recruiterOverrideNote
    };
  }
}
