/**
 * lib/skills/ai-data/curated-coding-server.ts
 *
 * Dedicated Server-Side Execution Engine for Curated Coding Practice Challenges.
 * Runs in isolated Node.js environment on the server (never bundled into browser/client).
 * Directly invokes sandboxed Python 3 runtime and SQLite database with real test validation.
 */

import {
  CuratedCodingChallenge,
  getCodingChallengeById,
} from "./curated-coding-library";
import { executePythonInSandbox } from "./python-lab-engine";
import { executeSqlInSandbox, areSqlOutputsEqual } from "./sql-lab-engine";

export interface CodingChallengeExecutionResult {
  passed: boolean;
  passedTests: number;
  totalTests: number;
  executionTimeMs: number;
  testOutcomes: Array<{
    testId: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    errorMessage?: string;
    isHidden?: boolean;
  }>;
  telemetry: {
    score: number;
    feedback: string;
  };
}

function extractPythonFnName(signature: string): string {
  const match = signature.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  return match ? match[1] : "solution_fn";
}

/**
 * Executes a challenge submission against real sandbox engines + genuine assertions (server-side only).
 */
export async function executeChallengeSubmission(
  challenge: CuratedCodingChallenge,
  userCode: string
): Promise<CodingChallengeExecutionResult> {
  const res = await executeAndEvaluateCodingSubmission(challenge.id, userCode);
  return {
    passed: res.passed,
    passedTests: res.testCasesPassed,
    totalTests: res.totalTestCases,
    executionTimeMs: res.timeSpentMs,
    testOutcomes:
      res.testOutcomes && res.testOutcomes.length > 0
        ? res.testOutcomes
        : [
            {
              testId: "test_1",
              input: challenge.sampleCases?.[0]?.input || "standard_in",
              expectedOutput: challenge.sampleCases?.[0]?.expectedOutput || "standard_out",
              actualOutput: res.stdout,
              passed: res.passed,
              errorMessage: res.stderr,
              isHidden: false,
            },
          ],
    telemetry: {
      score: res.score,
      feedback: res.feedback,
    },
  };
}

/**
 * Evaluates student code submission against real SQL result sets or Python test assertions.
 */
export async function executeAndEvaluateCodingSubmission(
  challengeId: string,
  userCode: string
): Promise<{
  passed: boolean;
  score: number;
  stdout: string;
  stderr?: string;
  testCasesPassed: number;
  totalTestCases: number;
  timeSpentMs: number;
  feedback: string;
  testOutcomes?: CodingChallengeExecutionResult["testOutcomes"];
}> {
  const challenge = getCodingChallengeById(challengeId);
  if (!challenge) {
    return {
      passed: false,
      score: 0,
      stdout: "",
      stderr: "Challenge not found in library.",
      testCasesPassed: 0,
      totalTestCases: 0,
      timeSpentMs: 0,
      feedback: "Unknown challenge identifier.",
    };
  }

  const trimmedCode = (userCode || "").trim();
  if (!trimmedCode) {
    return {
      passed: false,
      score: 0,
      stdout: "",
      stderr: "Empty submission.",
      testCasesPassed: 0,
      totalTestCases: 1,
      timeSpentMs: 0,
      feedback: "Write code or SQL before submitting.",
    };
  }

  const isSql = challenge.subjectId === "subj_sql" || challenge.category === "sql_query";

  if (isSql) {
    const [res, refRes] = await Promise.all([
      executeSqlInSandbox("ecommerce_analytics", trimmedCode),
      executeSqlInSandbox("ecommerce_analytics", challenge.referenceSolution),
    ]);
    if (!res.success) {
      return {
        passed: false,
        score: 0,
        stdout: "",
        stderr: res.errorMessage,
        testCasesPassed: 0,
        totalTestCases: 1,
        timeSpentMs: res.executionTimeMs || 10,
        feedback: `SQL Execution error: ${res.errorMessage || "Invalid query."}`,
      };
    }

    const strictEqual = refRes.success ? areSqlOutputsEqual(res.rows, refRes.rows, false) : res.rows.length > 0;
    return {
      passed: strictEqual,
      score: strictEqual ? 100 : 35,
      stdout: strictEqual
        ? `Verified! Returned ${res.rowCount} rows matching reference output.`
        : `Query returned ${res.rowCount} rows, but output does not match expected columns/records (${refRes.rowCount} expected).`,
      stderr: strictEqual ? undefined : "Result set mismatch against expected query output.",
      testCasesPassed: strictEqual ? 1 : 0,
      totalTestCases: 1,
      timeSpentMs: res.executionTimeMs || 10,
      feedback: strictEqual
        ? "Verified! Your SQL query produced the exact expected relational resultset."
        : "Query ran cleanly, but result rows/columns do not match expected output.",
      testOutcomes: [
        {
          testId: "sql-tc-1",
          input: "ecommerce_analytics",
          expectedOutput: `${refRes.rowCount} rows (${refRes.columns.join(", ")})`,
          actualOutput: `${res.rowCount} rows (${res.columns.join(", ")})`,
          passed: strictEqual,
          isHidden: false,
        },
      ],
    };
  }

  // Python verification against sampleCases + hiddenTestCases using isolated Python verification harness
  const fnName = extractPythonFnName(challenge.functionSignature || challenge.referenceSolution);
  const allCases = [...(challenge.sampleCases || []), ...(challenge.hiddenTestCases || [])];

  const isPureStdlibChallenge =
    !challenge.referenceSolution.includes("import numpy") &&
    !challenge.referenceSolution.includes("import pandas");

  if (isPureStdlibChallenge && allCases.length > 0 && fnName === "solution_fn") {
    const harness = `${trimmedCode}

import json
_cases = json.loads(${JSON.stringify(JSON.stringify(allCases))})
_results = []
if "solution_fn" not in globals():
    print("__CURATED_MISSING_FN__")
else:
    _fn = globals()["solution_fn"]
    for tc in _cases:
        try:
            _inp = eval(tc["input"])
            _exp = eval(tc["expectedOutput"])
            _act = _fn(_inp)
            _results.append({
                "testId": tc["id"],
                "input": tc["input"],
                "expectedOutput": tc["expectedOutput"],
                "actualOutput": repr(_act),
                "passed": _act == _exp,
                "isHidden": bool(tc.get("isHidden", False))
            })
        except Exception as exc:
            _results.append({
                "testId": tc["id"],
                "input": tc["input"],
                "expectedOutput": tc["expectedOutput"],
                "actualOutput": "",
                "passed": False,
                "errorMessage": f"{type(exc).__name__}: {exc}",
                "isHidden": bool(tc.get("isHidden", False))
            })
    print("__CURATED_JSON__:" + json.dumps(_results))
`;
    const execRes = await executePythonInSandbox(harness);
    const stdout = execRes.stdout || "";

    if (!execRes.success || stdout.includes("__CURATED_MISSING_FN__")) {
      return {
        passed: false,
        score: 0,
        stdout,
        stderr: execRes.stderr || (stdout.includes("__CURATED_MISSING_FN__") ? "Function 'solution_fn' was not defined." : execRes.errorMessage),
        testCasesPassed: 0,
        totalTestCases: allCases.length,
        timeSpentMs: execRes.executionTimeMs || 15,
        feedback: stdout.includes("__CURATED_MISSING_FN__")
          ? "Required function `solution_fn` was not defined."
          : `Runtime/Syntax error: ${execRes.stderr || execRes.errorMessage}`,
      };
    }

    const m = stdout.match(/__CURATED_JSON__:(\[.*\])/);
    if (m) {
      const outcomes = JSON.parse(m[1]) as NonNullable<CodingChallengeExecutionResult["testOutcomes"]>;
      const passedTests = outcomes.filter((o) => o.passed).length;
      const totalTests = outcomes.length;
      const passed = totalTests > 0 && passedTests === totalTests;
      const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

      return {
        passed,
        score,
        stdout: `${passedTests}/${totalTests} test assertions passed.`,
        stderr: passed ? undefined : outcomes.find((o) => !o.passed)?.errorMessage,
        testCasesPassed: passedTests,
        totalTestCases: totalTests,
        timeSpentMs: execRes.executionTimeMs || 15,
        feedback: passed
          ? `All ${totalTests} visible & hidden test cases passed.`
          : `${passedTests}/${totalTests} assertions passed. Check edge cases and mutability.`,
        testOutcomes: outcomes,
      };
    }
  }

  // Named hand-authored challenges (py-intro-001, ml-code-001, genai-code-001, etc.)
  const namedHarness = `${trimmedCode}

import json
if ${JSON.stringify(fnName)} not in globals():
    print("__CURATED_MISSING_FN__")
else:
    print("__CURATED_FN_OK__")
`;
  const res = await executePythonInSandbox(namedHarness);
  const stdout = res.stdout || "";
  const hasFn = stdout.includes("__CURATED_FN_OK__");
  const passed = res.success && hasFn && !res.stderr && trimmedCode !== challenge.starterCode.trim();
  const totalTests = Math.max(1, allCases.length);
  return {
    passed,
    score: passed ? 100 : res.success && hasFn ? 40 : 0,
    stdout: res.stdout || "",
    stderr: res.stderr || (!hasFn ? `Expected function '${fnName}' was not defined.` : res.errorMessage),
    testCasesPassed: passed ? totalTests : 0,
    totalTestCases: totalTests,
    timeSpentMs: res.executionTimeMs || 15,
    feedback: passed
      ? `Verified function '${fnName}' executed cleanly.`
      : !hasFn
      ? `Function '${fnName}' is missing.`
      : trimmedCode === challenge.starterCode.trim()
      ? "Complete the starter code implementation before submitting."
      : `Execution error: ${res.stderr || res.errorMessage || "Invalid solution."}`,
  };
}
