/**
 * COGNALYZE INTERVIEW SYSTEM — ADAPTIVE FOLLOW-UP ENGINE
 * 
 * Implements 8 discrete follow-up actions and dynamic difficulty progression
 * (foundational -> intermediate -> advanced -> expert).
 */

export type FollowUpAction =
  | "ASK_DEEPER"
  | "ASK_CLARIFICATION"
  | "CHALLENGE_ASSUMPTION"
  | "ASK_IMPLEMENTATION_DETAILS"
  | "PRESENT_REAL_WORLD_SCENARIO"
  | "ASK_FOR_TRADE_OFFS"
  | "TEST_FOUNDATIONAL_KNOWLEDGE"
  | "MOVE_TO_NEXT_COMPETENCY";

export type DifficultyLevel = "foundational" | "intermediate" | "advanced" | "expert";

export interface FollowUpDecision {
  action: FollowUpAction;
  targetDifficulty: DifficultyLevel;
  directivePrompt: string;
  rationale: string;
}

/**
 * Determines the optimal follow-up action based on candidate answer quality,
 * remaining question budget, and current difficulty.
 */
export function determineAdaptiveFollowUp(params: {
  answerQuality: "strong" | "adequate" | "shallow" | "does_not_know" | "contradictory" | "declined" | "off_topic";
  turnsSpentOnTopic: number;
  maxTurnBudget: number;
  currentDifficulty: DifficultyLevel;
  isProjectDeepDive: boolean;
  hasUnverifiedClaim: boolean;
}): FollowUpDecision {
  const {
    answerQuality,
    turnsSpentOnTopic,
    maxTurnBudget,
    currentDifficulty,
    isProjectDeepDive,
    hasUnverifiedClaim,
  } = params;

  // 1. Budget exhausted -> MUST move to next competency
  if (turnsSpentOnTopic >= maxTurnBudget) {
    return {
      action: "MOVE_TO_NEXT_COMPETENCY",
      targetDifficulty: currentDifficulty,
      directivePrompt: "Acknowledge the candidate's explanation and smoothly transition to the next competency area.",
      rationale: "Topic turn budget reached. Prevent tunnel vision.",
    };
  }

  // 2. Candidate said "does not know" or declined -> Move or scaffold
  if (answerQuality === "does_not_know" || answerQuality === "declined") {
    if (turnsSpentOnTopic === 1) {
      return {
        action: "TEST_FOUNDATIONAL_KNOWLEDGE",
        targetDifficulty: "foundational",
        directivePrompt: "Candidate indicated unfamiliarity with the advanced aspect. De-escalate to a simpler foundational concept.",
        rationale: "Graceful de-escalation to establish lower baseline.",
      };
    }
    return {
      action: "MOVE_TO_NEXT_COMPETENCY",
      targetDifficulty: "intermediate",
      directivePrompt: "Candidate passed on this topic. Acknowledge respectfully and transition to a fresh topic without penalty.",
      rationale: "Candidate declined twice or budget exhausted.",
    };
  }

  // 3. Contradictory -> Clarify ambiguity
  if (answerQuality === "contradictory") {
    return {
      action: "ASK_CLARIFICATION",
      targetDifficulty: currentDifficulty,
      directivePrompt: "Politely point out the apparent discrepancy between their previous statement and current answer, and ask them to clarify.",
      rationale: "Resolve contradictory technical claim.",
    };
  }

  // 4. Shallow answer -> Ask for concrete implementation details or foundational knowledge
  if (answerQuality === "shallow") {
    if (isProjectDeepDive) {
      return {
        action: "ASK_IMPLEMENTATION_DETAILS",
        targetDifficulty: currentDifficulty,
        directivePrompt: "Candidate's response was high-level. Probe for the exact functions, data structures, or code mechanics they personally wrote.",
        rationale: "Unpack handwavy project claims.",
      };
    }
    return {
      action: "ASK_DEEPER",
      targetDifficulty: currentDifficulty,
      directivePrompt: "Ask the candidate to explain what happens under the hood when this component runs.",
      rationale: "Test internal mechanisms after superficial answer.",
    };
  }

  // 5. Strong answer -> Escalate difficulty or test trade-offs/scenarios
  if (answerQuality === "strong") {
    if (currentDifficulty === "foundational") {
      return {
        action: "ASK_DEEPER",
        targetDifficulty: "intermediate",
        directivePrompt: "Candidate answered solidly. Deepen the technical inquiry to probe edge cases and internal mechanics.",
        rationale: "Escalate from foundational to intermediate.",
      };
    }

    if (currentDifficulty === "intermediate") {
      return {
        action: "PRESENT_REAL_WORLD_SCENARIO",
        targetDifficulty: "advanced",
        directivePrompt: "Present a realistic high-concurrency or failure scenario (e.g. network partition, cache invalidation race condition, memory leak).",
        rationale: "Escalate to advanced scenario testing.",
      };
    }

    if (currentDifficulty === "advanced") {
      return {
        action: "ASK_FOR_TRADE_OFFS",
        targetDifficulty: "expert",
        directivePrompt: "Ask about fundamental trade-offs between consistency, latency, and memory overhead in this design.",
        rationale: "Assess expert-level architectural discernment.",
      };
    }

    // Expert demonstrated -> move to next area
    return {
      action: "MOVE_TO_NEXT_COMPETENCY",
      targetDifficulty: "advanced",
      directivePrompt: "Candidate demonstrated expert proficiency in this area. Transition smoothly to the next core competency.",
      rationale: "Competency mastered. Transition to next domain.",
    };
  }

  // 6. Default Adequate answer
  if (hasUnverifiedClaim) {
    return {
      action: "CHALLENGE_ASSUMPTION",
      targetDifficulty: currentDifficulty,
      directivePrompt: "Challenge why they chose this specific approach over standard alternatives.",
      rationale: "Probe decision justification for unverified claim.",
    };
  }

  return {
    action: "ASK_FOR_TRADE_OFFS",
    targetDifficulty: currentDifficulty,
    directivePrompt: "Inquire about alternative designs and the trade-offs they considered.",
    rationale: "Standard technical progression.",
  };
}

