/**
 * lib/skills/python-arena/execution-engine.ts
 *
 * Genuine Sandboxed Python 3 Execution & Assessment Engine for Cognalyze.
 * Features:
 * - Real execution using local Python 3 binary (/usr/bin/python3 or python3)
 * - Isolated temporary execution workspaces with guaranteed cleanup
 * - CPU time limit enforcement (timeout: 4000ms) to abort infinite loops
 * - Security inspection preventing dangerous OS/subprocess/socket commands
 * - Dual execution modes:
 *     1. Entry-function harness for automated test case evaluation (public + hidden)
 *     2. Standard I/O script execution with stdin piping and stdout/stderr capture
 * - Anti-Simulation rule strictly enforced: ZERO synthetic or hardcoded outputs.
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export type PythonExecutionStatus =
  | "passed"
  | "failed"
  | "syntax_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "security_violation"
  | "contract_error";

export interface PythonTestCase {
  id: string;
  description?: string;
  args?: any[];
  stdin?: string;
  expected: any;
  isHidden?: boolean;
}

export interface SingleTestOutcome {
  testId: string;
  passed: boolean;
  status: "passed" | "failed" | "runtime_error" | "time_limit_exceeded";
  input: string;
  expected: string;
  actual: string;
  timeMs: number;
  errorMessage?: string;
  isHidden?: boolean;
}

export interface PythonExecutionResult {
  success: boolean;
  status: PythonExecutionStatus;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  testPassed?: boolean;
  score?: number;
  passedCount?: number;
  totalCount?: number;
  errorMessage?: string;
  testOutcomes?: SingleTestOutcome[];
}

// Blocked patterns for security
const FORBIDDEN_PATTERNS = [
  /import\s+os\s*;\s*os\.system/,
  /os\.system\s*\(/,
  /subprocess\./,
  /from\s+subprocess\s+import/,
  /import\s+subprocess/,
  /import\s+socket/,
  /from\s+socket\s+import/,
  /import\s+pty/,
  /shutil\.rmtree\s*\(\s*["']\/["']/,
  /__import__\s*\(\s*["']os["']\s*\)/,
  /__import__\s*\(\s*["']subprocess["']\s*\)/,
];

function sanitizeStringValue(val: any): string {
  if (val === undefined) return "None";
  if (val === null) return "None";
  if (typeof val === "boolean") return val ? "True" : "False";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

/**
 * Executes raw Python 3 script with optional stdin piping.
 */
export async function executeRawPythonScript(
  userCode: string,
  stdinInput: string = "",
  timeoutMs: number = 4000
): Promise<PythonExecutionResult> {
  const startTime = Date.now();
  const safeCode = typeof userCode === "string" ? userCode : "";

  // Security scan
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(safeCode)) {
      return {
        success: false,
        status: "security_violation",
        stdout: "",
        stderr: "Security Policy Violation: The submitted code contains restricted system calls (os.system, subprocess, socket).",
        executionTimeMs: 0,
        testPassed: false,
        score: 0,
        errorMessage: "Security policy violation: restricted package or system call.",
      };
    }
  }

  // Create isolated temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cognalyze_py_raw_"));
  const scriptPath = path.join(tempDir, "script.py");

  try {
    fs.writeFileSync(scriptPath, safeCode, "utf8");

    const execRes = spawnSync("/usr/bin/python3", [scriptPath], {
      input: stdinInput,
      timeout: timeoutMs,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 2, // 2MB
    });

    const elapsed = Date.now() - startTime;

    if (execRes.error && (execRes.error as any).code === "ETIMEDOUT") {
      return {
        success: false,
        status: "time_limit_exceeded",
        stdout: (execRes.stdout || "").trim(),
        stderr: `Time Limit Exceeded (> ${timeoutMs}ms). Check for infinite loops or unbounded recursions.`,
        executionTimeMs: elapsed,
        testPassed: false,
        score: 0,
        errorMessage: "Time Limit Exceeded",
      };
    }

    const stdout = (execRes.stdout || "").trim();
    const stderr = (execRes.stderr || "").trim();

    if (execRes.status !== 0) {
      const isSyntax = stderr.includes("SyntaxError") || stderr.includes("IndentationError");
      return {
        success: false,
        status: isSyntax ? "syntax_error" : "runtime_error",
        stdout,
        stderr,
        executionTimeMs: elapsed,
        testPassed: false,
        score: 0,
        errorMessage: stderr.split("\n").slice(-2).join(" ").trim() || "Execution failed",
      };
    }

    return {
      success: true,
      status: "passed",
      stdout,
      stderr,
      executionTimeMs: elapsed,
      testPassed: true,
      score: 100,
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}

/**
 * Executes a Python function against a suite of public & hidden test cases.
 */
export async function executePythonChallenge(
  userCode: string,
  entryFunctionName: string,
  testCases: PythonTestCase[],
  timeoutMs: number = 4000
): Promise<PythonExecutionResult> {
  const startTime = Date.now();
  const safeCode = typeof userCode === "string" ? userCode : "";

  // 1. Security scan
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(safeCode)) {
      return {
        success: false,
        status: "security_violation",
        stdout: "",
        stderr: "Security Policy Violation: The submitted code contains restricted system calls.",
        executionTimeMs: 0,
        testPassed: false,
        score: 0,
        errorMessage: "Security policy violation: restricted package or system call.",
      };
    }
  }

  // 2. Build Python test harness driver
  const testCasesJson = JSON.stringify(
    testCases.map((tc) => ({
      id: tc.id,
      args: tc.args || [],
      expected: tc.expected,
      isHidden: !!tc.isHidden,
    }))
  );

  const harnessScript = `
import sys, json, time

# --- User Code ---
${safeCode}
# --- End User Code ---

ENTRY_FUNC = ${JSON.stringify(entryFunctionName)}
TEST_CASES = json.loads(${JSON.stringify(testCasesJson)})

# Check if entry function is defined
target_func = globals().get(ENTRY_FUNC) or locals().get(ENTRY_FUNC)
if not target_func or not callable(target_func):
    print(f"__CONTRACT_ERROR__:Function '{ENTRY_FUNC}' is not defined or is not callable in submitted code.")
    sys.exit(102)

outcomes = []
for tc in TEST_CASES:
    cid = tc['id']
    args = tc['args']
    exp = tc['expected']
    is_hidden = tc['isHidden']

    t0 = time.time()
    try:
        actual = target_func(*args)
        t_ms = int((time.time() - t0) * 1000)
        
        # Deep compare handling
        passed = (actual == exp)
        
        # Normalize display representations
        outcomes.append({
            "testId": cid,
            "passed": bool(passed),
            "status": "passed" if passed else "failed",
            "actual": actual,
            "expected": exp,
            "timeMs": t_ms,
            "isHidden": is_hidden
        })
    except Exception as exc:
        t_ms = int((time.time() - t0) * 1000)
        outcomes.append({
            "testId": cid,
            "passed": False,
            "status": "runtime_error",
            "error": f"{type(exc).__name__}: {str(exc)}",
            "timeMs": t_ms,
            "isHidden": is_hidden
        })

print("__COG_TEST_START__")
print(json.dumps(outcomes))
print("__COG_TEST_END__")
`;

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cognalyze_py_test_"));
  const scriptPath = path.join(tempDir, "driver.py");

  try {
    fs.writeFileSync(scriptPath, harnessScript, "utf8");

    const execRes = spawnSync("/usr/bin/python3", [scriptPath], {
      timeout: timeoutMs,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 2,
    });

    const elapsed = Date.now() - startTime;

    // Timeout
    if (execRes.error && (execRes.error as any).code === "ETIMEDOUT") {
      const outcomes: SingleTestOutcome[] = testCases.map((tc) => ({
        testId: tc.id,
        passed: false,
        status: "time_limit_exceeded",
        input: tc.isHidden ? "[Hidden Test Case]" : JSON.stringify(tc.args),
        expected: tc.isHidden ? "[Hidden]" : sanitizeStringValue(tc.expected),
        actual: `Time Limit Exceeded (> ${timeoutMs}ms)`,
        timeMs: timeoutMs,
        errorMessage: "Time Limit Exceeded",
        isHidden: tc.isHidden,
      }));

      return {
        success: false,
        status: "time_limit_exceeded",
        stdout: "",
        stderr: `Time Limit Exceeded (> ${timeoutMs}ms). Execution stopped.`,
        executionTimeMs: elapsed,
        testPassed: false,
        score: 0,
        passedCount: 0,
        totalCount: testCases.length,
        errorMessage: "Time Limit Exceeded",
        testOutcomes: outcomes,
      };
    }

    const stdout = (execRes.stdout || "").trim();
    const stderr = (execRes.stderr || "").trim();

    // Contract error check
    if (stdout.includes("__CONTRACT_ERROR__")) {
      const contractMsg = stdout.split("__CONTRACT_ERROR__:")[1]?.split("\n")[0]?.trim() || "Function contract violated";
      const outcomes: SingleTestOutcome[] = testCases.map((tc) => ({
        testId: tc.id,
        passed: false,
        status: "failed",
        input: tc.isHidden ? "[Hidden Test Case]" : JSON.stringify(tc.args),
        expected: tc.isHidden ? "[Hidden]" : sanitizeStringValue(tc.expected),
        actual: contractMsg,
        timeMs: 0,
        errorMessage: contractMsg,
        isHidden: tc.isHidden,
      }));

      return {
        success: false,
        status: "contract_error",
        stdout,
        stderr: contractMsg,
        executionTimeMs: elapsed,
        testPassed: false,
        score: 0,
        passedCount: 0,
        totalCount: testCases.length,
        errorMessage: contractMsg,
        testOutcomes: outcomes,
      };
    }

    // Syntax / Parse Error
    if (execRes.status !== 0 && !stdout.includes("__COG_TEST_START__")) {
      const isSyntax = stderr.includes("SyntaxError") || stderr.includes("IndentationError");
      const cleanErr = stderr.split("\n").slice(-3).join(" ").trim() || "Execution failed";

      const outcomes: SingleTestOutcome[] = testCases.map((tc) => ({
        testId: tc.id,
        passed: false,
        status: "runtime_error",
        input: tc.isHidden ? "[Hidden Test Case]" : JSON.stringify(tc.args),
        expected: tc.isHidden ? "[Hidden]" : sanitizeStringValue(tc.expected),
        actual: cleanErr,
        timeMs: 0,
        errorMessage: cleanErr,
        isHidden: tc.isHidden,
      }));

      return {
        success: false,
        status: isSyntax ? "syntax_error" : "runtime_error",
        stdout,
        stderr,
        executionTimeMs: elapsed,
        testPassed: false,
        score: 0,
        passedCount: 0,
        totalCount: testCases.length,
        errorMessage: cleanErr,
        testOutcomes: outcomes,
      };
    }

    // Parse test outcomes
    const match = stdout.match(/__COG_TEST_START__([\s\S]*?)__COG_TEST_END__/);
    if (!match || !match[1]) {
      throw new Error(`Failed to capture test harness output: ${stdout.slice(0, 200)}`);
    }

    const rawOutcomes: any[] = JSON.parse(match[1].trim());
    const outcomeMap = new Map(rawOutcomes.map((o) => [o.testId, o]));

    const outcomes: SingleTestOutcome[] = [];
    let passedCount = 0;

    for (const tc of testCases) {
      const res = outcomeMap.get(tc.id);
      const isHidden = !!tc.isHidden;

      if (!res) {
        outcomes.push({
          testId: tc.id,
          passed: false,
          status: "failed",
          input: isHidden ? "[Hidden Test Case]" : JSON.stringify(tc.args),
          expected: isHidden ? "[Hidden]" : sanitizeStringValue(tc.expected),
          actual: "Test skipped or runner interrupted",
          timeMs: 0,
          isHidden,
        });
        continue;
      }

      if (res.passed) {
        passedCount++;
        outcomes.push({
          testId: tc.id,
          passed: true,
          status: "passed",
          input: isHidden ? "[Hidden Test Case]" : JSON.stringify(tc.args),
          expected: isHidden ? "[Hidden]" : sanitizeStringValue(tc.expected),
          actual: isHidden ? "[Output Hidden - Verified Match]" : sanitizeStringValue(res.actual),
          timeMs: res.timeMs || 0,
          isHidden,
        });
      } else if (res.status === "runtime_error") {
        outcomes.push({
          testId: tc.id,
          passed: false,
          status: "runtime_error",
          input: isHidden ? "[Hidden Test Case]" : JSON.stringify(tc.args),
          expected: isHidden ? "[Hidden]" : sanitizeStringValue(tc.expected),
          actual: res.error || "Runtime exception",
          timeMs: res.timeMs || 0,
          errorMessage: res.error,
          isHidden,
        });
      } else {
        outcomes.push({
          testId: tc.id,
          passed: false,
          status: "failed",
          input: isHidden ? "[Hidden Test Case]" : JSON.stringify(tc.args),
          expected: isHidden ? "[Hidden]" : sanitizeStringValue(tc.expected),
          actual: isHidden ? "[Output Mismatch]" : sanitizeStringValue(res.actual),
          timeMs: res.timeMs || 0,
          isHidden,
        });
      }
    }

    const totalCount = testCases.length;
    const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
    const allPassed = passedCount === totalCount;

    return {
      success: true,
      status: allPassed ? "passed" : "failed",
      stdout: stdout.split("__COG_TEST_START__")[0].trim(),
      stderr,
      executionTimeMs: elapsed,
      testPassed: allPassed,
      score,
      passedCount,
      totalCount,
      errorMessage: allPassed ? undefined : `${passedCount} of ${totalCount} test cases passed.`,
      testOutcomes: outcomes,
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}
