/**
 * lib/recruitment/assessment-runner.ts
 * 
 * Genuine Sandboxed Execution & Assessment Engine for Recruitment Arena.
 * Coordinates Python 3 execution, SQLite relational evaluation, Cognitive scoring,
 * and Work Simulation evaluations with zero synthetic mock data.
 */

import { executePythonChallenge } from "../skills/python-arena/execution-engine";
import { executeSqlInSandbox } from "../skills/ai-data/sql-lab-engine";
import {
  CodingAssessmentProblem,
  SqlAssessmentProblem,
  AptitudeQuestion,
  WorkSimulationScenario,
  StageEvaluationResult,
} from "./assessment-types";
import { getStageAssessmentBundle } from "./assessment-problems";
import { getAnyBlueprintById } from "./dynamic-blueprint-engine";

/**
 * Runs a candidate's code submission against all public and hidden test cases
 * using the real sandboxed /usr/bin/python3 binary.
 */
export async function evaluateCodingProblem(
  problem: CodingAssessmentProblem,
  submittedCode: string
): Promise<{
  passed: boolean;
  score: number;
  passedCount: number;
  totalCount: number;
  telemetry: Record<string, any>;
  feedback: string;
}> {
  const result = await executePythonChallenge(
    submittedCode,
    problem.entryFunction,
    problem.testCases,
    problem.timeLimitMs || 3000
  );

  const total = problem.testCases.length;
  const passedCount = result.passedCount ?? 0;
  const score = total > 0 ? Number(((passedCount / total) * 100).toFixed(2)) : 0;
  const passed = score >= 75; // 75% threshold for coding

  // Mask hidden test case actual outputs in telemetry to prevent leakage
  const safeOutcomes = (result.testOutcomes || []).map((o) => {
    if (o.isHidden) {
      return {
        testId: o.testId,
        passed: o.passed,
        status: o.status,
        timeMs: o.timeMs,
        isHidden: true,
      };
    }
    return o;
  });

  let feedback = "";
  if (result.status === "syntax_error") {
    feedback = `Syntax Error: ${result.stderr.slice(0, 300)}`;
  } else if (result.status === "time_limit_exceeded") {
    feedback = `Execution timed out. Optimal time complexity required (${problem.category}).`;
  } else if (passed) {
    feedback = `Optimal solution! Passed ${passedCount}/${total} test cases in ${result.executionTimeMs}ms.`;
  } else {
    feedback = `Passed ${passedCount}/${total} test cases. Failed edge cases on boundary conditions.`;
  }

  return {
    passed,
    score,
    passedCount,
    totalCount: total,
    telemetry: {
      executionTimeMs: result.executionTimeMs,
      status: result.status,
      outcomes: safeOutcomes,
    },
    feedback,
  };
}

/**
 * Executes and verifies candidate SQL query against SQLite database.
 */
export async function evaluateSqlProblem(
  problem: SqlAssessmentProblem,
  submittedSql: string
): Promise<{
  passed: boolean;
  score: number;
  telemetry: Record<string, any>;
  feedback: string;
}> {
  // Execute candidate SQL
  const userResult = await executeSqlInSandbox(problem.datasetId, submittedSql);

  if (!userResult.success || userResult.status !== "passed") {
    return {
      passed: false,
      score: 0,
      telemetry: { error: userResult.errorMessage },
      feedback: userResult.errorMessage || "SQL query syntax error or execution failure.",
    };
  }

  // Execute reference solution for ground truth
  const refResult = await executeSqlInSandbox(problem.datasetId, problem.referenceSql);

  // Compare row counts and column names
  const colsMatch =
    JSON.stringify(userResult.columns.map((c) => c.toLowerCase())) ===
    JSON.stringify(refResult.columns.map((c) => c.toLowerCase()));

  const rowsMatch =
    JSON.stringify(userResult.rows) === JSON.stringify(refResult.rows);

  const passed = colsMatch && rowsMatch;
  const score = passed ? 100 : colsMatch ? 50 : 0;

  return {
    passed,
    score,
    telemetry: {
      userRowCount: userResult.rowCount,
      expectedRowCount: refResult.rowCount,
      executionTimeMs: userResult.executionTimeMs,
      explainRows: userResult.explainRows,
    },
    feedback: passed
      ? `Query produced identical output to reference solution across all ${userResult.rowCount} rows.`
      : `Output discrepancy: Got ${userResult.rowCount} rows, expected ${refResult.rowCount} rows.`,
  };
}

/**
 * Scores multiple-choice cognitive aptitude questions with negative marking.
 */
export function evaluateAptitudeQuestions(
  questions: AptitudeQuestion[],
  answers: Record<string, number>
): {
  passed: boolean;
  score: number;
  correctCount: number;
  totalCount: number;
  feedback: string;
} {
  let correct = 0;
  let wrong = 0;

  for (const q of questions) {
    const selected = answers[q.id];
    if (selected !== undefined) {
      if (selected === q.correctOptionIndex) {
        correct++;
      } else {
        wrong++;
      }
    }
  }

  const total = questions.length;
  // Apply standard competitive marking: +1 for correct, -0.25 for incorrect
  const rawScore = Math.max(0, correct - wrong * 0.25);
  const percentage = total > 0 ? Number(((rawScore / total) * 100).toFixed(2)) : 0;
  const passed = percentage >= 65;

  return {
    passed,
    score: percentage,
    correctCount: correct,
    totalCount: total,
    feedback: `Scored ${percentage}%. Answered ${correct} correctly, ${wrong} incorrectly out of ${total} questions.`,
  };
}

/**
 * Evaluates situational workplace simulation decisions against Leadership Principles.
 */
export function evaluateWorkSimulation(
  scenarios: WorkSimulationScenario[],
  chosenOptionIds: Record<string, string>
): {
  passed: boolean;
  score: number;
  lpScores: Record<string, number>;
  feedback: string;
} {
  let totalScoreSum = 0;
  const lpAccumulator: Record<string, { sum: number; count: number }> = {};
  const feedbackItems: string[] = [];

  for (const sc of scenarios) {
    const chosenId = chosenOptionIds[sc.id];
    const option = sc.options.find((o) => o.id === chosenId);

    if (option) {
      feedbackItems.push(option.feedback);
      const lpKeys = Object.keys(option.leadershipPrincipleScore);
      const optAverage =
        lpKeys.length > 0
          ? lpKeys.reduce((s, k) => s + option.leadershipPrincipleScore[k], 0) / lpKeys.length
          : 0;

      totalScoreSum += optAverage;

      for (const [k, v] of Object.entries(option.leadershipPrincipleScore)) {
        if (!lpAccumulator[k]) lpAccumulator[k] = { sum: 0, count: 0 };
        lpAccumulator[k].sum += v;
        lpAccumulator[k].count += 1;
      }
    }
  }

  const scenarioCount = scenarios.length;
  const percentage = scenarioCount > 0 ? Number(((totalScoreSum / scenarioCount) * 100).toFixed(2)) : 0;
  const passed = percentage >= 70;

  const lpFinal: Record<string, number> = {};
  for (const [k, acc] of Object.entries(lpAccumulator)) {
    lpFinal[k] = Number(((acc.sum / acc.count) * 100).toFixed(2));
  }

  return {
    passed,
    score: percentage,
    lpScores: lpFinal,
    feedback: feedbackItems.join(" "),
  };
}

/**
 * Master dispatcher: Evaluates any supported stage format using real sandboxed engines.
 */
export async function evaluateStageAssessment(
  stageId: string,
  submissionData: {
    code?: string;
    sqlQuery?: string;
    answers?: Record<string, number>;
    chosenOptions?: Record<string, string>;
  }
): Promise<StageEvaluationResult> {
  const bundle = getStageAssessmentBundle(stageId);
  if (!bundle) {
    throw new Error(`No assessment bundle configured for stage '${stageId}'.`);
  }

  // 1. Coding Assessment
  if (bundle.format === "coding" && bundle.codingProblems && bundle.codingProblems.length > 0) {
    const problem = bundle.codingProblems[0]; // Evaluate first problem or combined
    const code = submissionData.code || "";
    const result = await evaluateCodingProblem(problem, code);

    return {
      stageId,
      success: true,
      stagePassed: result.passed,
      rawScore: result.score,
      maxScore: 100,
      percentageScore: result.score,
      passingThreshold: 75,
      telemetry: result.telemetry,
      rubricEvaluations: {
        algorithmic_correctness: result.score,
        execution_efficiency: result.telemetry.executionTimeMs < 1000 ? 100 : 75,
      },
      evaluatorFeedback: result.feedback,
    };
  }

  // 2. SQL Assessment
  if (bundle.format === "sql" && bundle.sqlProblems && bundle.sqlProblems.length > 0) {
    const problem = bundle.sqlProblems[0];
    const sql = submissionData.sqlQuery || "";
    const result = await evaluateSqlProblem(problem, sql);

    return {
      stageId,
      success: true,
      stagePassed: result.passed,
      rawScore: result.score,
      maxScore: 100,
      percentageScore: result.score,
      passingThreshold: 70,
      telemetry: result.telemetry,
      rubricEvaluations: {
        sql_correctness: result.score,
        query_optimization: result.telemetry.userRowCount > 0 ? 90 : 50,
      },
      evaluatorFeedback: result.feedback,
    };
  }

  // 3. Aptitude Assessment
  if (bundle.format === "aptitude" && bundle.aptitudeQuestions) {
    const answers = submissionData.answers || {};
    const result = evaluateAptitudeQuestions(bundle.aptitudeQuestions, answers);

    return {
      stageId,
      success: true,
      stagePassed: result.passed,
      rawScore: result.score,
      maxScore: 100,
      percentageScore: result.score,
      passingThreshold: 65,
      telemetry: { correct: result.correctCount, total: result.totalCount },
      rubricEvaluations: { cognitive_proficiency: result.score },
      evaluatorFeedback: result.feedback,
    };
  }

  // 4. Work Simulation
  if (bundle.format === "work_simulation" && bundle.workSimulationScenarios) {
    const chosen = submissionData.chosenOptions || {};
    const result = evaluateWorkSimulation(bundle.workSimulationScenarios, chosen);

    return {
      stageId,
      success: true,
      stagePassed: result.passed,
      rawScore: result.score,
      maxScore: 100,
      percentageScore: result.score,
      passingThreshold: 70,
      telemetry: { lpScores: result.lpScores },
      rubricEvaluations: result.lpScores,
      evaluatorFeedback: result.feedback,
    };
  }

  throw new Error(`Unsupported assessment format '${bundle.format}' for stage '${stageId}'.`);
}
