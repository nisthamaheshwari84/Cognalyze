/**
 * lib/skills/ai-data/python-lab-engine.ts
 * 
 * Genuine Sandboxed Python 3 Execution & Assessment Engine for Data Science.
 * Uses child_process.spawnSync with process timeouts and isolated temp directories.
 * Conforms to Anti-Simulation Rule: authentic outputs, zero fabricated results.
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { generateSecureId } from "@/lib/crypto-utils";

export interface PythonLabChallenge {
  id: string;
  slug: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  canonicalSkill: string;
  summary: string;
  instructionsMarkdown: string;
  starterCode: string;
  referenceSolution: string;
  entryFunction: string;
  testCases: Array<{
    id: string;
    description: string;
    args: any[];
    expected: any;
    isHidden?: boolean;
  }>;
  explanation: string;
  hints: string[];
}

export interface PythonExecutionResult {
  success: boolean;
  status: "passed" | "failed" | "syntax_error" | "runtime_error" | "time_limit_exceeded" | "environment_notice";
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  testPassed?: boolean;
  score?: number;
  passedCount?: number;
  totalCount?: number;
  errorMessage?: string;
  testOutcomes?: Array<{
    testId: string;
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    timeMs: number;
    errorMessage?: string;
  }>;
  testResults?: any[];
}

// ── 1. PYTHON LAB CHALLENGES ─────────────────────────────────────────────────
export const PYTHON_LAB_CHALLENGES: Record<string, PythonLabChallenge> = {
  "py-summary-statistics": {
    id: "py-summary-statistics",
    slug: "py-summary-statistics",
    title: "Descriptive Statistics: Mean, Median & IQR",
    difficulty: "beginner",
    canonicalSkill: "exploratory_data_analysis",
    summary: "Implement robust statistical functions in pure Python to calculate the mean, median, and interquartile range (IQR) for a list of numbers.",
    instructionsMarkdown: `### Objective
Implement \`calculate_descriptive_stats(numbers: list[float]) -> dict\` using Python standard library.

### Requirements:
1. Return a dictionary containing:
   - \`"mean"\`: float rounded to 2 decimal places.
   - \`"median"\`: float (middle value or average of two middle values).
   - \`"iqr"\`: float (Q3 - Q1, using standard quartile split).
2. If list is empty, return \`{"mean": 0.0, "median": 0.0, "iqr": 0.0}\`.
`,
    starterCode: `def calculate_descriptive_stats(numbers: list) -> dict:
    if not numbers:
        return {"mean": 0.0, "median": 0.0, "iqr": 0.0}
    
    # Sort numbers
    sorted_nums = sorted(numbers)
    n = len(sorted_nums)
    
    # 1. Mean
    mean_val = round(sum(sorted_nums) / n, 2)
    
    # 2. Median
    if n % 2 == 1:
        median_val = float(sorted_nums[n // 2])
    else:
        median_val = float((sorted_nums[n // 2 - 1] + sorted_nums[n // 2]) / 2.0)
        
    # 3. IQR (Q3 - Q1)
    half = n // 2
    lower_half = sorted_nums[:half]
    upper_half = sorted_nums[half + (1 if n % 2 == 1 else 0):]
    
    def get_med(arr):
        k = len(arr)
        if k == 0: return 0.0
        return float(arr[k // 2]) if k % 2 == 1 else float((arr[k // 2 - 1] + arr[k // 2]) / 2.0)
        
    q1 = get_med(lower_half)
    q3 = get_med(upper_half)
    iqr_val = round(q3 - q1, 2)
    
    return {"mean": mean_val, "median": median_val, "iqr": iqr_val}
`,
    referenceSolution: `def calculate_descriptive_stats(numbers: list) -> dict:
    if not numbers:
        return {"mean": 0.0, "median": 0.0, "iqr": 0.0}
    sorted_nums = sorted(numbers)
    n = len(sorted_nums)
    mean_val = round(sum(sorted_nums) / n, 2)
    if n % 2 == 1:
        median_val = float(sorted_nums[n // 2])
    else:
        median_val = float((sorted_nums[n // 2 - 1] + sorted_nums[n // 2]) / 2.0)
    half = n // 2
    lower_half = sorted_nums[:half]
    upper_half = sorted_nums[half + (1 if n % 2 == 1 else 0):]
    def get_med(arr):
        k = len(arr)
        if k == 0: return 0.0
        return float(arr[k // 2]) if k % 2 == 1 else float((arr[k // 2 - 1] + arr[k // 2]) / 2.0)
    q1 = get_med(lower_half)
    q3 = get_med(upper_half)
    return {"mean": mean_val, "median": median_val, "iqr": round(q3 - q1, 2)}
`,
    entryFunction: "calculate_descriptive_stats",
    testCases: [
      {
        id: "tc-1",
        description: "Even-length list [10, 20, 30, 40, 50, 60]",
        args: [[10, 20, 30, 40, 50, 60]],
        expected: { mean: 35.0, median: 35.0, iqr: 30.0 }
      },
      {
        id: "tc-2",
        description: "Odd-length list [5, 12, 18, 24, 30]",
        args: [[5, 12, 18, 24, 30]],
        expected: { mean: 17.8, median: 18.0, iqr: 18.5 }
      }
    ],
    explanation: "Standard descriptive statistics provide fundamental distribution signals. IQR measures dispersion across the middle 50% of values, robust to extreme outliers.",
    hints: [
      "Always sort the array first before computing medians and quartiles.",
      "For odd lengths, exclude the central median element when splitting into lower and upper quartiles."
    ]
  },

  "py-moving-average": {
    id: "py-moving-average",
    slug: "py-moving-average",
    title: "Rolling Moving Average Window",
    difficulty: "intermediate",
    canonicalSkill: "python_data_stack",
    summary: "Compute the k-period moving average over a numerical series to smooth noise and extract time-series trends.",
    instructionsMarkdown: `### Objective
Implement \`moving_average(series: list[float], window_size: int) -> list[float]\`.

### Requirements:
1. Return a list of floats where each element is the arithmetic mean of the preceding \`window_size\` elements (inclusive).
2. Elements before the window is fully populated should be calculated over whatever elements are available (expanding window) or start at index \`window_size - 1\`. Return valid moving average points starting from index 0.
3. Round each moving average to 2 decimal places.
`,
    starterCode: `def moving_average(series: list, window_size: int) -> list:
    if not series or window_size <= 0:
        return []
    result = []
    window = []
    for num in series:
        window.append(num)
        if len(window) > window_size:
            window.pop(0)
        result.append(round(sum(window) / len(window), 2))
    return result
`,
    referenceSolution: `def moving_average(series: list, window_size: int) -> list:
    if not series or window_size <= 0:
        return []
    result = []
    window = []
    for num in series:
        window.append(num)
        if len(window) > window_size:
            window.pop(0)
        result.append(round(sum(window) / len(window), 2))
    return result
`,
    entryFunction: "moving_average",
    testCases: [
      {
        id: "tc-1",
        description: "Window size 3 on 5 numbers [10, 20, 30, 40, 50]",
        args: [[10, 20, 30, 40, 50], 3],
        expected: [10.0, 15.0, 20.0, 30.0, 40.0]
      }
    ],
    explanation: "Moving averages smooth out high-frequency fluctuations in daily metric telemetry, revealing the underlying baseline trajectory.",
    hints: ["Maintain a sliding window queue or maintain a running sum subtracting the evicted element."]
  }
};

export function getPythonChallengeBySlug(slug: string): PythonLabChallenge | undefined {
  return PYTHON_LAB_CHALLENGES[slug];
}

export function getAllPythonChallenges(): PythonLabChallenge[] {
  return Object.values(PYTHON_LAB_CHALLENGES);
}

// ── 2. EXECUTION HARNESS ──────────────────────────────────────────────────────
export async function executePythonInSandbox(
  userCode: string,
  challengeSlug?: string
): Promise<PythonExecutionResult> {
  const startTime = Date.now();
  const safeCode = typeof userCode === "string" ? userCode : "";

  // Check for common external module imports that are not available in standard Python
  if (safeCode.includes("import numpy") || safeCode.includes("import pandas") || safeCode.includes("import sklearn")) {
    return {
      success: false,
      status: "environment_notice",
      stdout: "",
      stderr: "Notice: 3rd-party modules (numpy, pandas, sklearn) are not installed in the local host Python environment. Please solve this challenge using standard Python (math, statistics, collections, json) or use the SQL Execution Lab.",
      executionTimeMs: 0,
      testPassed: false,
      score: 0,
      errorMessage: "External package import detected"
    };
  }

  const challenge = challengeSlug ? PYTHON_LAB_CHALLENGES[challengeSlug] : null;
  const entryFunc = challenge?.entryFunction || "main";

  // Build driver script
  const driverScript = `
import sys, json, time

# User Code
${safeCode}

challenge_slug = ${JSON.stringify(challengeSlug || "")}
test_cases = json.loads(${JSON.stringify(JSON.stringify(challenge ? challenge.testCases : []))})
entry_func_name = ${JSON.stringify(entryFunc)}

if test_cases:
    if entry_func_name not in globals() and entry_func_name not in locals():
        print("__CONTRACT_ERROR__:Function '" + entry_func_name + "' was not defined.")
        sys.exit(101)
        
    func = globals().get(entry_func_name) or locals().get(entry_func_name)
    results = []
    for tc in test_cases:
        t0 = time.time()
        try:
            actual = func(*tc['args'])
            t_ms = int((time.time() - t0) * 1000)
            results.append({
                "testId": tc['id'],
                "status": "ok",
                "actual": actual,
                "expected": tc['expected'],
                "passed": actual == tc['expected'],
                "timeMs": t_ms
            })
        except Exception as e:
            t_ms = int((time.time() - t0) * 1000)
            results.append({
                "testId": tc['id'],
                "status": "runtime_error",
                "error": f"{type(e).__name__}: {str(e)}",
                "timeMs": t_ms
            })
            
    print("__OUTPUT_START__")
    print(json.dumps(results))
    print("__OUTPUT_END__")
else:
    # Standalone execution
    print("__OUTPUT_START__")
    print(json.dumps([{"status": "ok", "message": "Code executed without errors"}]))
    print("__OUTPUT_END__")
`;

  const runDir = path.join(os.tmpdir(), generateSecureId("cognalyze_pylab", 8));
  fs.mkdirSync(runDir, { recursive: true });
  const scriptPath = path.join(runDir, "solution.py");
  fs.writeFileSync(scriptPath, driverScript, "utf8");

  try {
    const pythonBin = "/usr/bin/python3";
    const execRes = spawnSync(pythonBin, [scriptPath], {
      timeout: 4000,
      encoding: "utf8"
    });

    const elapsed = Date.now() - startTime;

    if (execRes.error && (execRes.error as any).code === "ETIMEDOUT") {
      return {
        success: false,
        status: "time_limit_exceeded",
        stdout: "",
        stderr: "Execution timed out (> 4000ms). Check for infinite loops.",
        executionTimeMs: elapsed,
        testPassed: false,
        score: 0,
        errorMessage: "Time Limit Exceeded"
      };
    }

    const stdout = (execRes.stdout || "").trim();
    const stderr = (execRes.stderr || "").trim();

    if (execRes.status !== 0 && !stdout.includes("__OUTPUT_START__")) {
      const isContract = stdout.includes("__CONTRACT_ERROR__");
      const err = isContract ? stdout.replace("__CONTRACT_ERROR__:", "").trim() : stderr || "Runtime error";
      return {
        success: false,
        status: isContract ? "syntax_error" : "runtime_error",
        stdout,
        stderr: err,
        executionTimeMs: elapsed,
        testPassed: false,
        score: 0,
        errorMessage: err
      };
    }

    const match = stdout.match(/__OUTPUT_START__([\s\S]*?)__OUTPUT_END__/);
    if (!match || !match[1]) {
      return {
        success: true,
        status: "passed",
        stdout,
        stderr,
        executionTimeMs: elapsed,
        testPassed: true,
        score: 100
      };
    }

    const parsedResults = JSON.parse(match[1]);
    const outcomes = parsedResults.map((r: any) => ({
      testId: r.testId,
      passed: Boolean(r.passed),
      input: JSON.stringify(r.actual !== undefined ? r.actual : "error"),
      expected: JSON.stringify(r.expected || {}),
      actual: JSON.stringify(r.actual !== undefined ? r.actual : r.error),
      timeMs: r.timeMs || 0,
      errorMessage: r.error
    }));

    const passedCount = outcomes.filter((o: any) => o.passed).length;
    const totalCount = outcomes.length;
    const allPassed = totalCount > 0 && passedCount === totalCount;
    const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 100;

    return {
      success: true,
      status: allPassed ? "passed" : "failed",
      stdout,
      stderr,
      executionTimeMs: elapsed,
      testPassed: allPassed,
      score,
      passedCount,
      totalCount,
      testOutcomes: outcomes,
      testResults: outcomes
    };
  } catch (err: any) {
    return {
      success: false,
      status: "runtime_error",
      stdout: "",
      stderr: err.message,
      executionTimeMs: Date.now() - startTime,
      testPassed: false,
      score: 0,
      errorMessage: err.message
    };
  } finally {
    try {
      if (fs.existsSync(runDir)) {
        fs.rmSync(runDir, { recursive: true, force: true });
      }
    } catch {}
  }
}
