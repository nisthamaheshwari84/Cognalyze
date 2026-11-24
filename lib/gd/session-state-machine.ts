/**
 * COGNALYZE GROUP DISCUSSION — STRUCTURED SESSION STATE MACHINE
 * 
 * Formal state transitions, lifecycle management, and recovery:
 * - INITIALIZING -> DEVICE_CHECK -> BRIEFING -> OPENING -> ACTIVE_DISCUSSION
 * - MODERATION -> CHALLENGE -> SYNTHESIS -> CONCLUSION -> EVALUATION -> COMPLETED
 * - Safe handling of PAUSED, RECOVERING, and FAILED states.
 */

import { GDSessionLifecycleState, GDDiscussionStage, GDSessionData } from "./types";

export const VALID_LIFECYCLE_TRANSITIONS: Record<GDSessionLifecycleState, GDSessionLifecycleState[]> = {
  INITIALIZING: ["DEVICE_CHECK", "BRIEFING", "FAILED"],
  DEVICE_CHECK: ["BRIEFING", "FAILED"],
  BRIEFING: ["OPENING", "PAUSED", "FAILED"],
  OPENING: ["ACTIVE_DISCUSSION", "MODERATION", "PAUSED", "FAILED"],
  ACTIVE_DISCUSSION: ["MODERATION", "CHALLENGE", "SYNTHESIS", "PAUSED", "RECOVERING", "FAILED"],
  MODERATION: ["ACTIVE_DISCUSSION", "CHALLENGE", "SYNTHESIS", "CONCLUSION", "FAILED"],
  CHALLENGE: ["ACTIVE_DISCUSSION", "MODERATION", "SYNTHESIS", "PAUSED", "FAILED"],
  SYNTHESIS: ["CONCLUSION", "MODERATION", "PAUSED", "FAILED"],
  CONCLUSION: ["EVALUATION", "MODERATION", "FAILED"],
  EVALUATION: ["COMPLETED", "FAILED"],
  COMPLETED: [], // Terminal state: immutable
  PAUSED: ["ACTIVE_DISCUSSION", "CHALLENGE", "SYNTHESIS", "CONCLUSION", "FAILED"],
  RECOVERING: ["ACTIVE_DISCUSSION", "PAUSED", "FAILED"],
  FAILED: ["INITIALIZING", "RECOVERING"]
};

/**
 * Validate and transition session lifecycle state.
 */
export function transitionLifecycleState(
  session: GDSessionData,
  nextState: GDSessionLifecycleState,
  reason?: string
): GDSessionData {
  const currentState = session.lifecycleState;
  
  // Guard terminal state
  if (currentState === "COMPLETED") {
    throw new Error(`[gd-state-machine] Cannot transition from terminal state COMPLETED.`);
  }

  const allowedTransitions = VALID_LIFECYCLE_TRANSITIONS[currentState] || [];
  if (!allowedTransitions.includes(nextState)) {
    console.warn(
      `[gd-state-machine] Transition from ${currentState} to ${nextState} is not in standard graph. Allowing forced recovery.`
    );
  }

  // Map lifecycle state to discussion stage where appropriate
  let updatedStage: GDDiscussionStage = session.currentStage;
  if (nextState === "BRIEFING") updatedStage = "briefing";
  else if (nextState === "OPENING") updatedStage = "opening";
  else if (nextState === "ACTIVE_DISCUSSION") updatedStage = "active_discussion";
  else if (nextState === "CHALLENGE") updatedStage = "dynamic_challenge";
  else if (nextState === "SYNTHESIS") updatedStage = "synthesis";
  else if (nextState === "CONCLUSION") updatedStage = "conclusion";
  else if (nextState === "EVALUATION" || nextState === "COMPLETED") updatedStage = "evaluation";

  return {
    ...session,
    lifecycleState: nextState,
    currentStage: updatedStage,
    updatedAt: new Date().toISOString(),
    completedAt: nextState === "COMPLETED" ? new Date().toISOString() : session.completedAt
  };
}

/**
 * Check if the session is active and can receive speech or peer turns.
 */
export function isSessionTurnAcceptable(session: GDSessionData): boolean {
  const acceptableStates: GDSessionLifecycleState[] = [
    "OPENING",
    "ACTIVE_DISCUSSION",
    "MODERATION",
    "CHALLENGE",
    "SYNTHESIS",
    "CONCLUSION"
  ];
  return acceptableStates.includes(session.lifecycleState);
}
