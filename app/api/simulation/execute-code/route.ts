import { NextResponse } from "next/server";
import { executeJavascriptCode, TestCase } from "@/lib/simulation/oa-generator";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      language = "javascript",
      code = "",
      testCases = [],
      functionName = "solve",
    } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({
        passed: 0,
        total: testCases.length,
        logs: ["Error: No code submitted."],
        results: [],
      });
    }

    // 1. JavaScript execution
    if (language === "javascript" || language === "js") {
      const outcome = executeJavascriptCode(code, functionName, testCases);
      return NextResponse.json(outcome);
    }

    // 2. Python execution
    if (language === "python" || language === "py") {
      const outcome = await executePythonCode(code, functionName, testCases);
      return NextResponse.json(outcome);
    }

    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  } catch (err: any) {
    console.error("[execute-code] Error:", err);
    return NextResponse.json(
      {
        passed: 0,
        total: 0,
        logs: [`Execution system error: ${err.message}`],
        results: [],
      },
      { status: 500 }
    );
  }
}

async function executePythonCode(
  code: string,
  functionName: string,
  testCases: TestCase[]
): Promise<{
  passed: number;
  total: number;
  results: any[];
  logs: string[];
}> {
  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, `oa_${Date.now()}_${Math.random().toString(36).slice(2)}.py`);

  const harness = `
import json
import sys

${code}

test_cases = ${JSON.stringify(testCases)}
fn = None
for candidate_name in ['${functionName}', 'subarray_sum', 'length_of_longest_substring', 'solve']:
    if candidate_name in globals() and callable(globals()[candidate_name]):
        fn = globals()[candidate_name]
        break

if fn is None:
    print(json.dumps({"error": "Function ${functionName} not defined."}))
    sys.exit(0)

results = []
passed_count = 0
logs = []

for tc in test_cases:
    tc_id = tc["id"]
    args = tc["input"]
    expected = tc["expected"]
    desc = tc.get("description", "")
    try:
        actual = fn(*args)
        is_match = (actual == expected)
        if is_match:
            passed_count += 1
            logs.append(f"✓ Test [{tc_id}] Passed ({desc}): Input {args} -> {actual}")
        else:
            logs.append(f"✗ Test [{tc_id}] Failed ({desc}): Expected {expected}, got {actual}")
        results.append({
            "id": tc_id,
            "passed": is_match,
            "input": args,
            "expected": expected,
            "actual": actual
        })
    except Exception as e:
        logs.append(f"✗ Test [{tc_id}] Runtime Error: {str(e)}")
        results.append({
            "id": tc_id,
            "passed": False,
            "input": args,
            "expected": expected,
            "actual": None,
            "error": str(e)
        })

print(json.dumps({
    "passed": passed_count,
    "total": len(test_cases),
    "results": results,
    "logs": logs
}))
`;

  try {
    fs.writeFileSync(scriptPath, harness, "utf8");

    return await new Promise((resolve) => {
      exec(`python3 "${scriptPath}"`, { timeout: 3500 }, (error, stdout, stderr) => {
        try {
          fs.unlinkSync(scriptPath);
        } catch {}

        if (error) {
          resolve({
            passed: 0,
            total: testCases.length,
            logs: [`Python Execution Error (Timeout or Exception): ${stderr || error.message}`],
            results: testCases.map((tc) => ({
              id: tc.id,
              passed: false,
              input: tc.input,
              expected: tc.expected,
              actual: null,
              error: stderr || error.message,
            })),
          });
          return;
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.error) {
            resolve({
              passed: 0,
              total: testCases.length,
              logs: [`Error: ${parsed.error}`],
              results: [],
            });
            return;
          }
          resolve(parsed);
        } catch (parseErr) {
          resolve({
            passed: 0,
            total: testCases.length,
            logs: [`Error parsing Python output: ${stdout || stderr}`],
            results: [],
          });
        }
      });
    });
  } catch (err: any) {
    return {
      passed: 0,
      total: testCases.length,
      logs: [`Execution setup failed: ${err.message}`],
      results: [],
    };
  }
}
