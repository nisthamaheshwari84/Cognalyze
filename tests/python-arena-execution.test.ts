import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  executeRawPythonScript,
  executePythonChallenge,
  PythonTestCase,
} from "../lib/skills/python-arena/execution-engine";

describe("Python Arena: Real Execution Engine", () => {
  it("executes raw Python script and captures standard output", async () => {
    const code = `
x = [1, 2, 3, 4]
squared = [i ** 2 for i in x]
print("SUM:", sum(squared))
`;
    const res = await executeRawPythonScript(code);
    assert.equal(res.success, true);
    assert.equal(res.status, "passed");
    assert.equal(res.stdout, "SUM: 30");
    assert.ok(res.executionTimeMs >= 0);
  });

  it("handles standard input piping in raw script", async () => {
    const code = `
import sys
line = sys.stdin.read().strip()
print(f"ECHO: {line.upper()}")
`;
    const res = await executeRawPythonScript(code, "hello cognalyze");
    assert.equal(res.success, true);
    assert.equal(res.stdout, "ECHO: HELLO COGNALYZE");
  });

  it("evaluates challenge function against public and hidden test cases", async () => {
    const code = `
def reverse_words(s: str) -> str:
    return " ".join(s.strip().split()[::-1])
`;
    const testCases: PythonTestCase[] = [
      { id: "tc-1", args: ["the sky is blue"], expected: "blue is sky the" },
      { id: "tc-2", args: ["  hello world  "], expected: "world hello" },
      { id: "tc-3", args: ["a good   example"], expected: "example good a", isHidden: true },
    ];

    const res = await executePythonChallenge(code, "reverse_words", testCases);
    assert.equal(res.success, true);
    assert.equal(res.status, "passed");
    assert.equal(res.passedCount, 3);
    assert.equal(res.totalCount, 3);
    assert.equal(res.score, 100);

    const hiddenOutcome = res.testOutcomes?.find((o) => o.testId === "tc-3");
    assert.ok(hiddenOutcome?.isHidden);
    assert.equal(hiddenOutcome?.passed, true);
    assert.equal(hiddenOutcome?.actual, "[Output Hidden - Verified Match]");
  });

  it("catches contract errors when entry function is omitted", async () => {
    const code = `
def wrong_function(x):
    return x * 2
`;
    const testCases: PythonTestCase[] = [{ id: "tc-1", args: [5], expected: 10 }];
    const res = await executePythonChallenge(code, "multiply_by_two", testCases);
    assert.equal(res.success, false);
    assert.equal(res.status, "contract_error");
    assert.ok(res.stderr.includes("multiply_by_two"));
  });

  it("identifies failing test cases with genuine outputs", async () => {
    const buggyCode = `
def add(a, b):
    return a - b  # Buggy subtraction
`;
    const testCases: PythonTestCase[] = [
      { id: "tc-1", args: [2, 3], expected: 5 },
      { id: "tc-2", args: [10, 0], expected: 10 },
    ];
    const res = await executePythonChallenge(buggyCode, "add", testCases);
    assert.equal(res.success, true);
    assert.equal(res.status, "failed");
    assert.equal(res.passedCount, 1);
    assert.equal(res.totalCount, 2);
    assert.equal(res.score, 50);

    const tc1 = res.testOutcomes?.find((o) => o.testId === "tc-1");
    assert.equal(tc1?.passed, false);
    assert.equal(tc1?.actual, "-1");
  });

  it("catches syntax errors with helpful stderr", async () => {
    const invalidSyntax = `
def broken(x)
    return x + 1
`;
    const res = await executePythonChallenge(invalidSyntax, "broken", [{ id: "tc-1", args: [1], expected: 2 }]);
    assert.equal(res.success, false);
    assert.equal(res.status, "syntax_error");
    assert.ok(res.stderr.includes("SyntaxError"));
  });

  it("terminates infinite loops with time_limit_exceeded", async () => {
    const infiniteLoop = `
def loop_forever():
    while True:
        pass
`;
    const res = await executePythonChallenge(infiniteLoop, "loop_forever", [{ id: "tc-1", args: [], expected: 0 }], 1000);
    assert.equal(res.success, false);
    assert.equal(res.status, "time_limit_exceeded");
  });

  it("rejects malicious shell execution attempts", async () => {
    const malicious = `
import os
os.system("rm -rf /tmp/fake")
`;
    const res = await executeRawPythonScript(malicious);
    assert.equal(res.success, false);
    assert.equal(res.status, "security_violation");
  });
});

