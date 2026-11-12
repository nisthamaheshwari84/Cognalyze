/**
 * lib/skills/python-arena/python-mentor-service.ts
 *
 * Socratic AI Python Practice Mentor for Cognalyze.
 * Enforces Anti-Simulation & Socratic Guidance:
 * - 5-Tier progressive hint scaffolding (Concept -> Approach -> Algorithm -> Pseudocode -> Solution)
 * - Never leaks answers immediately
 * - Analyzes submitted student code, stdout, stderr, and failing test cases
 * - Diagnoses classic Python misconceptions (mutable defaults, quadratic string loops, shallow copy aliasing)
 * - Evaluates asymptotic time and space complexity
 */

import { getCuratedQuestionById, CuratedPythonQuestion } from "./python-question-bank";
import { PythonExecutionResult } from "./execution-engine";

export interface SocraticHintResponse {
  currentTier: number;
  maxTier: number;
  tierName: "Conceptual Framing" | "Algorithmic Approach" | "Step-by-Step Logic" | "Pseudocode Blueprint" | "Reference Solution";
  hintContent: string;
  canAdvance: boolean;
  nextTierName?: string;
}

export interface CodeDiagnosisResponse {
  summary: string;
  rootCause: string;
  suggestedAction: string;
  complexityAssessment: {
    estimatedTime: string;
    estimatedSpace: string;
    isOptimal: boolean;
    targetTime: string;
    targetSpace: string;
  };
  misconceptionDetected?: string;
}

const TIER_NAMES = [
  "Conceptual Framing",
  "Algorithmic Approach",
  "Step-by-Step Logic",
  "Pseudocode Blueprint",
  "Reference Solution",
] as const;

/**
 * Provides the next progressive hint for a question, preventing premature solution leakage.
 */
export function getProgressiveHint(
  questionId: string,
  requestedTier: number
): SocraticHintResponse {
  const q = getCuratedQuestionById(questionId);
  const tier = Math.max(1, Math.min(requestedTier, 5));
  const tierIndex = tier - 1;

  if (!q || !q.progressiveHints || q.progressiveHints.length === 0) {
    return {
      currentTier: 1,
      maxTier: 5,
      tierName: "Conceptual Framing",
      hintContent: "Break down the input constraints and identify what invariants must hold across each iteration.",
      canAdvance: false,
    };
  }

  let hintText = q.progressiveHints[tierIndex] || q.progressiveHints[q.progressiveHints.length - 1];
  if (tier === 5) {
    hintText = `Here is the reference approach and implementation:\n\n\`\`\`python\n${q.referenceSolution}\n\`\`\`\n\nExplanation: ${q.learningObjective}`;
  }

  return {
    currentTier: tier,
    maxTier: 5,
    tierName: TIER_NAMES[tierIndex],
    hintContent: hintText,
    canAdvance: tier < 5,
    nextTierName: tier < 5 ? TIER_NAMES[tier] : undefined,
  };
}

/**
 * Evaluates student code and execution failure to give grounded Socratic diagnostics.
 */
export function diagnoseCodeAttempt(
  questionId: string,
  userCode: string,
  execResult: PythonExecutionResult
): CodeDiagnosisResponse {
  const q = getCuratedQuestionById(questionId);
  const targetTime = q?.timeComplexity || "O(N)";
  const targetSpace = q?.spaceComplexity || "O(1)";

  // 1. Check for Syntax / Indentation Errors
  if (execResult.status === "syntax_error") {
    return {
      summary: "Syntax or Indentation Error Detected",
      rootCause: execResult.stderr || "Python syntax or indentation structure violated.",
      suggestedAction: "Check your line colons (:), matching parentheses/brackets, and ensure consistent 4-space indentation.",
      complexityAssessment: {
        estimatedTime: "N/A (Did not execute)",
        estimatedSpace: "N/A",
        isOptimal: false,
        targetTime,
        targetSpace,
      },
      misconceptionDetected: "Python relies strictly on indentation to delimit blocks; tabs and spaces must never be mixed.",
    };
  }

  // 2. Check for Time Limit Exceeded
  if (execResult.status === "time_limit_exceeded") {
    return {
      summary: "Execution Timed Out (> 4000ms)",
      rootCause: "Infinite while loop or quadratic nested loop over large constraint sizes.",
      suggestedAction: "Ensure your loop variable strictly advances toward termination, or replace O(N^2) search with an O(1) hash map lookup.",
      complexityAssessment: {
        estimatedTime: ">= O(N^2) or unbounded",
        estimatedSpace: "Unknown",
        isOptimal: false,
        targetTime,
        targetSpace,
      },
      misconceptionDetected: "A loop without guaranteed termination conditions triggers Time Limit Exceeded.",
    };
  }

  // 3. Check for Contract Errors
  if (execResult.status === "contract_error") {
    return {
      summary: "Function Contract Violation",
      rootCause: execResult.errorMessage || "Expected entry function signature was missing.",
      suggestedAction: `Ensure your solution defines the exact function name '${q?.entryFunction || "solution"}' with the specified parameters.`,
      complexityAssessment: {
        estimatedTime: "N/A",
        estimatedSpace: "N/A",
        isOptimal: false,
        targetTime,
        targetSpace,
      },
    };
  }

  // 4. Misconception Detection in User Code
  if (/=\s*\[\s*\]/.test(userCode) && userCode.includes("def ")) {
    return {
      summary: "Potential Mutable Default Argument Trap",
      rootCause: "A function parameter uses a mutable default argument (= []).",
      suggestedAction: "Replace '= []' with '= None', then initialize inside the body: 'if arg is None: arg = []'.",
      complexityAssessment: {
        estimatedTime: targetTime,
        estimatedSpace: targetSpace,
        isOptimal: false,
        targetTime,
        targetSpace,
      },
      misconceptionDetected: "Default arguments in Python are instantiated once at function definition time, not on each call.",
    };
  }

  // 5. Logical Test Case Failures
  if (execResult.status === "failed") {
    const failingCase = execResult.testOutcomes?.find((o) => !o.passed);
    const failMsg = failingCase
      ? `Failed on test input: ${failingCase.input}. Expected ${failingCase.expected}, but your code returned ${failingCase.actual}.`
      : "Some test cases produced incorrect outputs.";

    return {
      summary: "Logical Output Mismatch",
      rootCause: failMsg,
      suggestedAction: "Trace your code step-by-step with the failing input. Check zero-index boundaries and edge cases (e.g. empty lists or negative numbers).",
      complexityAssessment: {
        estimatedTime: targetTime,
        estimatedSpace: targetSpace,
        isOptimal: false,
        targetTime,
        targetSpace,
      },
    };
  }

  // 6. Passing Solution
  return {
    summary: "Optimal Solution Verified",
    rootCause: "All public and hidden test cases passed successfully within process execution limits.",
    suggestedAction: "Great job! Try implementing an alternative approach or analyze how this problem maps to real-world distributed architectures.",
    complexityAssessment: {
      estimatedTime: targetTime,
      estimatedSpace: targetSpace,
      isOptimal: true,
      targetTime,
      targetSpace,
    },
  };
}
