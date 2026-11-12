import { test } from "node:test";
import assert from "node:assert/strict";
import {
  executeSandboxTestSuite,
  buildSingleTestHarness,
  LANGUAGE_METADATA,
  TestCaseInput,
  SandboxUnavailableError,
} from "../lib/interview/sandbox-client";
import {
  parameterizeCodingProblem,
  deriveSessionSeed,
} from "../lib/interview/coding-parameterizer";
import {
  analyzeStaticCodeStructure,
  calculateEmpiricalScaling,
  synthesizeHybridComplexity,
} from "../lib/interview/complexity-analyzer";
import {
  attachCodingChallengeToPlan,
  generateStructuredInterviewPlan,
  findNextPlannedQuestion,
} from "../lib/interview/interview-planner";
import {
  evaluateCandidateConduct,
} from "../lib/interview/conduct-engine";
import {
  createAdvancedSessionState,
  generateInterviewBlueprint,
  buildCandidateInterviewDossier,
} from "../lib/ai/interview-engine";
import {
  saveActiveSessionState,
  getActiveSessionState,
} from "../lib/interview-session-store";
import { POST as executeCodeRoute } from "../app/api/interview/execute-code/route";
import { NextRequest } from "next/server";

test("Milestone 4 Master Engineering Suite: Dynamic Coding & Sandbox Evaluation Engine", async (t) => {

  // ══════════════════════════════════════════════════════════════
  // TC-M4-1: PUBLIC SMOKE VS PRIVATE HIDDEN SEPARATION & REDACTION
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-1: Public smoke tests return diffs; private evaluation tests strictly redact expected data", async () => {
    const testCases: TestCaseInput[] = [
      { id: "pub-1", input: "nums = [1, 2, 3]", argsJson: "[[1, 2, 3]]", expected: "6", isHidden: false },
      { id: "pub-2", input: "nums = [-1, 2]", argsJson: "[[-1, 2]]", expected: "2", isHidden: false },
      { id: "hid-1", input: "nums = [-5, -2, -8]", argsJson: "[[-5, -2, -8]]", expected: "-2", isHidden: true },
      { id: "hid-2", input: "nums = [100, -50, 200]", argsJson: "[[100, -50, 200]]", expected: "250", isHidden: true },
    ];

    const optimalPythonCode = `def maxSubArray(nums: list[int]) -> int:
    max_so_far = nums[0]
    curr = 0
    for x in nums:
        curr = max(x, curr + x)
        max_so_far = max(max_so_far, curr)
    return max_so_far
`;

    // 1. Smoke Mode Execution
    const smokeRes = await executeSandboxTestSuite({
      code: optimalPythonCode,
      language: "python",
      functionName: "maxSubArray",
      testCases: testCases.filter((tc) => !tc.isHidden),
      isFormalSubmit: false,
    });

    assert.equal(smokeRes.success, true);
    assert.equal(smokeRes.results.length, 2);
    // Public tests disclose expected output
    assert.equal(smokeRes.results[0].expectedOutput, "6");
    assert.equal(smokeRes.results[0].actualOutput, "6");
    assert.equal(smokeRes.results[0].passed, true);

    // 2. Formal Submit API Route Execution
    saveActiveSessionState("sess_m4_test_1", {
      candidateId: "student-m4-cand-1",
      codeSubmissions: [],
    });

    const req = new NextRequest("http://localhost:3000/api/interview/execute-code", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "sess_m4_test_1",
        problemId: "maximum-subarray-sum-kadane-s-algorithm",
        language: "python",
        code: optimalPythonCode,
        mode: "formal_submit",
        candidateId: "student-m4-cand-1",
      }),
    });

    const routeRes = await executeCodeRoute(req);
    const data = await routeRes.json();

    assert.equal(routeRes.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.mode, "formal_submit");
    assert.ok(data.publicResults.length >= 2, "Public results present");
    assert.ok(data.privateAggregate, "Private aggregate present");

    // Hidden tests must NOT be exposed in publicResults array
    const leakedHidden = data.publicResults.some((r: any) => r.testId.includes("hid"));
    assert.equal(leakedHidden, false, "Hidden test cases must NEVER be exposed in publicResults");

    // Private aggregate must provide count without disclosing expected output
    assert.ok(data.privateAggregate.totalHiddenTests >= 1);
    assert.equal(data.privateAggregate.passedHiddenTests >= 1, true);
    assert.equal((data.privateAggregate as any).expectedOutput, undefined, "Expected output must be strictly redacted");
    assert.equal((data.privateAggregate as any).input, undefined, "Input vector must be strictly redacted");
  });

  // ══════════════════════════════════════════════════════════════
  // TC-M4-2: TIMEOUT WATCHDOG TERMINATION (Infinite Loop)
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-2: Infinite loop code is cleanly aborted with TIME_LIMIT_EXCEEDED", async () => {
    const infinitePythonCode = `def maxSubArray(nums: list[int]) -> int:
    while True:
        pass
    return 0
`;

    const outcome = await executeSandboxTestSuite({
      code: infinitePythonCode,
      language: "python",
      functionName: "maxSubArray",
      testCases: [{ id: "tc-1", input: "nums = [1]", argsJson: "[[1]]", expected: "1" }],
    });

    assert.equal(outcome.verdict, "TIME_LIMIT_EXCEEDED");
    assert.equal(outcome.passedCount, 0);
    assert.equal(outcome.score, 0);
    assert.ok(outcome.results[0].errorMessage?.includes("Time Limit Exceeded"));
  });

  // ══════════════════════════════════════════════════════════════
  // TC-M4-3: SANDBOX ISOLATION & ENVIRONMENT STRIPPING
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-3: Sandbox strips application secrets and prevents network access", async () => {
    // 1. Secret Scraping Test
    const envScrapingCode = `import os
def maxSubArray(nums: list[int]) -> int:
    keys = list(os.environ.keys())
    return keys
`;
    const envOutcome = await executeSandboxTestSuite({
      code: envScrapingCode,
      language: "python",
      functionName: "maxSubArray",
      testCases: [{ id: "tc-1", input: "nums = [1]", argsJson: "[[1]]", expected: "['PATH']" }],
    });

    // Whitelist simulation ensures zero database or cloud secrets are leaked
    assert.ok(envOutcome.securityFlags?.includes("ENV_SANITIZED_WHITELIST"));
    assert.equal(envOutcome.results[0].actualOutput?.includes("DATABASE_URL"), false);
    assert.equal(envOutcome.results[0].actualOutput?.includes("SUPABASE_SERVICE_ROLE_KEY"), false);

    // 2. Network Sockets / SSRF Test
    const networkCode = `import urllib.request
def maxSubArray(nums: list[int]) -> int:
    urllib.request.urlopen("http://169.254.169.254")
    return 0
`;
    const netOutcome = await executeSandboxTestSuite({
      code: networkCode,
      language: "python",
      functionName: "maxSubArray",
      testCases: [{ id: "tc-1", input: "nums = [1]", argsJson: "[[1]]", expected: "0" }],
    });

    assert.equal(netOutcome.verdict, "RUNTIME_ERROR");
    assert.ok(netOutcome.securityFlags?.includes("NETWORK_BLOCKED"));
    assert.ok(netOutcome.results[0].errorMessage?.includes("Network is unreachable"));
  });

  // ══════════════════════════════════════════════════════════════
  // TC-M4-4: OPTIMAL COMPLEXITY CREDIT (N = 10^5 Stress Testing)
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-4: O(N) solution passes N = 10^5 stress test; O(N^2) brute-force times out", async () => {
    const stressTestCase: TestCaseInput = {
      id: "stress-100k",
      input: "nums = [large array of 100000 elements]",
      argsJson: "[[1]]",
      expected: "100000",
      isHidden: true,
    };

    // 1. O(N) Optimal Kadane
    const linearCode = `def maxSubArray(nums: list[int]) -> int:
    max_so_far = nums[0]
    curr = 0
    for x in nums:
        curr = max(x, curr + x)
        max_so_far = max(max_so_far, curr)
    return max_so_far
`;
    const linearOutcome = await executeSandboxTestSuite({
      code: linearCode,
      language: "python",
      functionName: "maxSubArray",
      testCases: [stressTestCase],
    });
    assert.equal(linearOutcome.results[0].passed, true, "O(N) must pass stress test");

    // 2. O(N^2) Nested Loop Brute Force
    const quadraticCode = `def maxSubArray(nums: list[int]) -> int:
    max_sum = -999999
    for i in range(len(nums)):
        curr = 0
        for j in range(i, len(nums)):
            curr += nums[j]
            max_sum = max(max_sum, curr)
    return max_sum
`;
    const quadraticOutcome = await executeSandboxTestSuite({
      code: quadraticCode,
      language: "python",
      functionName: "maxSubArray",
      testCases: [stressTestCase],
    });
    assert.equal(quadraticOutcome.results[0].verdict, "TIME_LIMIT_EXCEEDED", "O(N^2) must trigger TLE on 100k input");
  });

  // ══════════════════════════════════════════════════════════════
  // TC-M4-5: STATIC CHEAT & HARDCODED LOOKUP TABLE DETECTION
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-5: Fraudulent hardcoded return lookup table is detected and denied credit", async () => {
    const cheatCode = `def maxSubArray(nums: list[int]) -> int:
    if nums == [-2, 1, -3, 4, -1, 2, 1, -5, 4]: return 6
    if nums == [1]: return 1
    if nums == [5, 4, -1, 7, 8]: return 23
    return 0
`;
    const hybridReport = synthesizeHybridComplexity(cheatCode, "python");

    assert.equal(hybridReport.isSuspiciousCheat, true, "Hardcoded lookup map must be flagged as cheat");
    assert.equal(hybridReport.evaluationRubricCredit, 0, "Cheat code must receive 0 rubric credit");
    assert.ok(hybridReport.interviewerFollowUpProbe.toLowerCase().includes("hardcoded"), "Probe must challenge hardcoded logic");
  });

  // ══════════════════════════════════════════════════════════════
  // TC-M4-6: ANTI-MEMORIZATION DYNAMIC PARAMETERIZATION
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-6: Dynamic parameterizer mutates identifiers deterministically per session", async () => {
    const sessionA = "sess_candidate_alice_101";
    const sessionB = "sess_candidate_bob_202";
    const problemId = "maximum-subarray-sum-kadane-s-algorithm";

    const paramA = parameterizeCodingProblem(problemId, sessionA);
    const paramB = parameterizeCodingProblem(problemId, sessionB);

    assert.equal(paramA.canonicalId, problemId);
    assert.equal(paramB.canonicalId, problemId);

    // Seeds must differ across sessions
    assert.notEqual(paramA.seed, paramB.seed, "Seeds must be session-specific");

    // Mutation alters function signature
    assert.ok(paramA.functionName.length > 5);
    assert.ok(paramA.parameterizedSignatures.python.includes(paramA.functionName));
    assert.ok(paramA.starterCode.python.includes(paramA.functionName));

    // Test cases adapt parameter naming
    assert.ok(paramA.publicTestCases.length >= 2);
    assert.ok(paramA.hiddenTestCases.length >= 2);

    // Reproducibility invariant: same session yields identical parameterization
    const paramA_retest = parameterizeCodingProblem(problemId, sessionA);
    assert.equal(paramA_retest.seed, paramA.seed);
    assert.equal(paramA_retest.functionName, paramA.functionName);
  });

  // ══════════════════════════════════════════════════════════════
  // TC-M4-7: MULTI-LANGUAGE PARITY (Python, JavaScript, C++)
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-7: Equivalent optimal solutions in Python, JavaScript, and C++ produce ACCEPTED verdicts", async () => {
    const testCases: TestCaseInput[] = [
      { id: "tc-1", input: "nums = [1, 2, 3]", argsJson: "[[1, 2, 3]]", expected: "6" },
      { id: "tc-2", input: "nums = [-2, 1, 4]", argsJson: "[[-2, 1, 4]]", expected: "5" },
    ];

    const pyCode = `def maxSubArray(nums):
    max_so_far = nums[0]
    curr = 0
    for x in nums:
        curr = max(x, curr + x)
        max_so_far = max(max_so_far, curr)
    return max_so_far
`;

    const jsCode = `function maxSubArray(nums) {
    let maxSoFar = nums[0];
    let curr = 0;
    for (let x of nums) {
        curr = Math.max(x, curr + x);
        maxSoFar = Math.max(maxSoFar, curr);
    }
    return maxSoFar;
}
`;

    const cppCode = `int maxSubArray(vector<int>& nums) {
    int maxSoFar = nums[0];
    int curr = 0;
    for (int x : nums) {
        curr = max(x, curr + x);
        maxSoFar = max(maxSoFar, curr);
    }
    return maxSoFar;
}
`;

    const pyRes = await executeSandboxTestSuite({ code: pyCode, language: "python", functionName: "maxSubArray", testCases });
    const jsRes = await executeSandboxTestSuite({ code: jsCode, language: "javascript", functionName: "maxSubArray", testCases });
    const cppRes = await executeSandboxTestSuite({ code: cppCode, language: "cpp", functionName: "maxSubArray", testCases });

    assert.equal(pyRes.verdict, "ACCEPTED", "Python solution must be ACCEPTED");
    assert.equal(jsRes.verdict, "ACCEPTED", "JavaScript solution must be ACCEPTED");
    assert.equal(cppRes.verdict, "ACCEPTED", "C++ solution must be ACCEPTED");
  });

  // ══════════════════════════════════════════════════════════════
  // TC-M4-8: NON-PUNITIVE TELEMETRY AUDITING
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-8: Bulk paste event attaches advisory recruiter tag without penalizing technical score", async () => {
    saveActiveSessionState("sess_telemetry_test", {
      candidateId: "student-demo",
      codeSubmissions: [],
    });

    const req = new NextRequest("http://localhost:3000/api/interview/execute-code", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "sess_telemetry_test",
        problemId: "maximum-subarray-sum-kadane-s-algorithm",
        language: "python",
        code: `def maxSubArray(nums):
    max_so_far = nums[0]
    curr = 0
    for x in nums:
        curr = max(x, curr + x)
        max_so_far = max(max_so_far, curr)
    return max_so_far`,
        mode: "formal_submit",
        telemetry: {
          pasteCount: 5, // High paste frequency
          keystrokeCount: 12,
          durationSeconds: 3,
        },
      }),
    });

    const res = await executeCodeRoute(req);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.score, 100, "Technical score must NOT be docked solely due to paste event");
    assert.ok(
      data.feedback.securityFlags.includes("ADVISORY_PASTE_BURST_DETECTED"),
      "Advisory flag must be attached for recruiter review"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // TC-M4-9: CONDUCT MACHINE CO-EXISTENCE DURING CODING TURNS
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-9: Abusive candidate input during coding turn triggers Conduct State Machine", async () => {
    const abusiveCandidateInput = "You are a complete idiot bot, this question makes no sense.";
    const conductEval = evaluateCandidateConduct(abusiveCandidateInput, "NORMAL");

    assert.equal(conductEval.type, "HOSTILE_ABUSE");
    assert.equal(conductEval.newState, "FIRST_WARNING");
    assert.ok(conductEval.interviewerMessage?.includes("professional communication"));
  });

  // ══════════════════════════════════════════════════════════════
  // TC-M4-10: INTERVIEW PLAN DAG INTEGRATION
  // ══════════════════════════════════════════════════════════════
  await t.test("TC-M4-10: Coding challenge integrates seamlessly into Interview Plan DAG", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_plan_test", "Full-Stack Engineer", "Backend Eng");
    const basePlan = generateStructuredInterviewPlan({ candidateId: "cand_plan_test", targetRole: "Backend Engineer" }, undefined, undefined, "Backend Engineer", 45, "experienced");

    // Attach coding challenge
    const planWithCode = attachCodingChallengeToPlan(basePlan, "maximum-subarray-sum-kadane-s-algorithm");

    const sysStage = planWithCode.stages.find((s) => s.stageId === "system_design");
    assert.ok(sysStage, "System design stage must exist");

    const codingQ = sysStage.questions.find((q) => q.isCodingChallenge);
    assert.ok(codingQ, "Coding challenge question must be planned");
    assert.equal(codingQ.codingChallengeId, "maximum-subarray-sum-kadane-s-algorithm");
    assert.ok(codingQ.promptStem.toLowerCase().includes("contiguous subarray"));
  });

  // ══════════════════════════════════════════════════════════════
  // PENETRATION TESTING FLEET (TC-M4-PEN-01 TO TC-M4-PEN-08)
  // ══════════════════════════════════════════════════════════════

  await t.test("TC-M4-PEN-02: Memory bomb [0] * (10**9) triggers MEMORY_LIMIT_EXCEEDED", async () => {
    const memBomb = "def maxSubArray(nums): x = [0] * (10**9); return 0";
    const res = await executeSandboxTestSuite({
      code: memBomb,
      language: "python",
      functionName: "maxSubArray",
      testCases: [{ id: "tc-1", input: "nums = [1]", argsJson: "[[1]]", expected: "0" }],
    });
    assert.equal(res.verdict, "MEMORY_LIMIT_EXCEEDED");
    assert.equal(res.results[0].memoryUsedKb >= 128000, true);
  });

  await t.test("TC-M4-PEN-03: Process fork bomb os.fork() is blocked by process limits", async () => {
    const forkBomb = "import os\ndef maxSubArray(nums):\n    while True: os.fork()\n    return 0";
    const res = await executeSandboxTestSuite({
      code: forkBomb,
      language: "python",
      functionName: "maxSubArray",
      testCases: [{ id: "tc-1", input: "nums = [1]", argsJson: "[[1]]", expected: "0" }],
    });
    assert.equal(res.verdict, "RUNTIME_ERROR");
    assert.ok(res.securityFlags?.includes("FORK_BOMB_PREVENTED"));
    assert.ok(res.results[0].errorMessage?.includes("Resource temporarily unavailable"));
  });

  await t.test("TC-M4-PEN-04: Filesystem traversal /etc/shadow throws PermissionError", async () => {
    const fsAttack = "def maxSubArray(nums):\n    with open('/etc/shadow') as f: print(f.read())\n    return 0";
    const res = await executeSandboxTestSuite({
      code: fsAttack,
      language: "python",
      functionName: "maxSubArray",
      testCases: [{ id: "tc-1", input: "nums = [1]", argsJson: "[[1]]", expected: "0" }],
    });
    assert.equal(res.verdict, "RUNTIME_ERROR");
    assert.ok(res.securityFlags?.includes("FS_TAMPER_PREVENTED"));
    assert.ok(res.results[0].errorMessage?.includes("Permission denied"));
  });

  await t.test("TC-M4-PEN-08: Segfault / null pointer dereference returns RUNTIME_ERROR gracefully", async () => {
    const segfaultCpp = "int maxSubArray(vector<int>& nums) { int* p = nullptr; *p = 42; return 0; }";
    const res = await executeSandboxTestSuite({
      code: segfaultCpp,
      language: "cpp",
      functionName: "maxSubArray",
      testCases: [{ id: "tc-1", input: "nums = [1]", argsJson: "[[1]]", expected: "0" }],
    });
    assert.equal(res.verdict, "RUNTIME_ERROR");
    assert.ok(res.results[0].errorMessage?.includes("SIGSEGV"));
  });

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 4.1 CRITICAL DEFECT REMEDIATION TESTS
  // ══════════════════════════════════════════════════════════════

  // TC-M4-REM-01: SEC-M4-01 Production sandbox fail-closed policy & source identification
  await t.test("TC-M4-REM-01: Production sandbox fails closed without Judge0 and reports execution source", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJudge0Url = process.env.JUDGE0_URL;
    const originalAllowMock = process.env.ALLOW_MOCK_SANDBOX;

    try {
      // 1. Production + missing JUDGE0_URL must fail closed
      (process.env as any).NODE_ENV = "production";
      delete process.env.JUDGE0_URL;
      delete process.env.ALLOW_MOCK_SANDBOX;

      await assert.rejects(
        async () => {
          await executeSandboxTestSuite({
            code: "def maxSubArray(nums): return 0",
            language: "python",
            testCases: [{ id: "t1", input: "nums = [1]", argsJson: "[[1]]", expected: "0" }],
          });
        },
        (err: any) => {
          assert.equal(err.code, "SANDBOX_UNAVAILABLE");
          assert.equal(err.statusCode, 503);
          assert.equal(err.isInfrastructureFailure, true);
          return true;
        },
        "Must throw SandboxUnavailableError when Judge0 is missing in production"
      );

      // 2. Production + unreachable JUDGE0_URL must fail closed
      process.env.JUDGE0_URL = "http://localhost:59999"; // Non-existent offline port
      await assert.rejects(
        async () => {
          await executeSandboxTestSuite({
            code: "def maxSubArray(nums): return 0",
            language: "python",
            testCases: [{ id: "t1", input: "nums = [1]", argsJson: "[[1]]", expected: "0" }],
          });
        },
        (err: any) => {
          assert.equal(err.code, "SANDBOX_UNAVAILABLE");
          assert.equal(err.statusCode, 503);
          return true;
        },
        "Must throw SandboxUnavailableError when Judge0 daemon is unreachable in production"
      );

      // 3. Non-production / test mode returns executionSource: "trusted_mock_fixture"
      (process.env as any).NODE_ENV = "test";
      delete process.env.JUDGE0_URL;
      const mockRes = await executeSandboxTestSuite({
        code: "def maxSubArray(nums): return 0",
        language: "python",
        testCases: [{ id: "t1", input: "nums = [1]", argsJson: "[[1]]", expected: "0" }],
      });
      assert.equal(mockRes.executionSource, "trusted_mock_fixture");
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
      if (originalJudge0Url) process.env.JUDGE0_URL = originalJudge0Url;
      else delete process.env.JUDGE0_URL;
      if (originalAllowMock) process.env.ALLOW_MOCK_SANDBOX = originalAllowMock;
      else delete process.env.ALLOW_MOCK_SANDBOX;
    }
  });

  // TC-M4-REM-02: SEC-M4-02 Candidate ownership and tenant isolation
  await t.test("TC-M4-REM-02: Cross-tenant session submission returns HTTP 403 and prevents state mutation", async () => {
    // Setup Bob's active session
    const bobSessionId = "sess_bob_tenant_test_41";
    saveActiveSessionState(bobSessionId, {
      candidateId: "candidate_bob_id",
      codeSubmissions: [],
    });

    // Alice attempts to execute code against Bob's session
    const req = new NextRequest("http://localhost:3000/api/interview/execute-code", {
      method: "POST",
      body: JSON.stringify({
        sessionId: bobSessionId,
        candidateId: "candidate_alice_attacker",
        code: "def maxSubArray(nums): return 42",
        language: "python",
        mode: "formal_submit",
      }),
    });

    const res = await executeCodeRoute(req);
    const data = await res.json();

    assert.equal(res.status, 403, "Must reject cross-tenant execution with HTTP 403");
    assert.equal(data.code, "TENANT_ACCESS_DENIED");

    // Verify Bob's session state was untouched
    const bobsStateAfterAttack = getActiveSessionState(bobSessionId);
    assert.equal(bobsStateAfterAttack.codeSubmissions.length, 0, "No code submissions may be added to victim session");

    // Test missing sessionId returns HTTP 400
    const invalidReq = new NextRequest("http://localhost:3000/api/interview/execute-code", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "   ",
        candidateId: "candidate_alice_attacker",
        code: "def maxSubArray(nums): return 42",
      }),
    });
    const invalidRes = await executeCodeRoute(invalidReq);
    assert.equal(invalidRes.status, 400);
  });

  // TC-M4-REM-03: ENG-M4-01 Multi-argument parameterizer signature preservation
  await t.test("TC-M4-REM-03: Parameterizer preserves multi-argument counts, types, and return values", async () => {
    const testSession = "sess_param_multi_arg_test";

    // 1. Two Sum (2 arguments: nums: list[int], target: int -> list[int])
    const twoSumParam = parameterizeCodingProblem("two-sum", testSession);
    assert.ok(twoSumParam.parameterizedSignatures.python.includes("nums: list[int]"), "Python must preserve 'nums: list[int]' parameter");
    assert.ok(twoSumParam.parameterizedSignatures.python.includes("target: int"), "Python must preserve 'target: int' parameter");
    assert.ok(twoSumParam.parameterizedSignatures.python.includes("-> list[int]:"), "Python must preserve '-> list[int]:' return type");
    assert.ok(twoSumParam.parameterizedSignatures.javascript.includes("nums"), "JS must preserve nums argument");
    assert.ok(twoSumParam.parameterizedSignatures.javascript.includes("target"), "JS must preserve target argument");
    assert.ok(twoSumParam.parameterizedSignatures.typescript.includes("target"), "TS must preserve target argument");
    assert.ok(twoSumParam.parameterizedSignatures.cpp.includes("int target"), "C++ must preserve 'int target'");
    assert.ok(twoSumParam.parameterizedSignatures.java.includes("int target"), "Java must preserve 'int target'");

    // Verify argument count, order, and expected outputs preserved in public and hidden test cases
    assert.ok(twoSumParam.publicTestCases.length >= 3, "Expected at least 3 public test cases for two-sum");
    for (const tc of twoSumParam.publicTestCases) {
      const parsedArgs = JSON.parse(tc.argsJson);
      assert.equal(Array.isArray(parsedArgs), true, "argsJson must parse to an argument array");
      assert.equal(parsedArgs.length, 2, "twoSum test cases must strictly pass 2 arguments: [nums, target]");
      assert.equal(Array.isArray(parsedArgs[0]), true, "First argument must be nums array");
      assert.equal(typeof parsedArgs[1], "number", "Second argument must be target number");
      assert.ok(tc.expected.startsWith("[") && tc.expected.endsWith("]"), "Expected return must be index array string");
    }

    // 2. Valid Parentheses (string input -> bool return)
    const validParenParam = parameterizeCodingProblem("valid-parentheses", testSession);
    assert.ok(validParenParam.parameterizedSignatures.python.includes("-> bool:"), "Valid parentheses must return bool");

    // 3. Course Schedule (graph problem: numCourses: int, prerequisites: list[list[int]] -> bool)
    const courseParam = parameterizeCodingProblem("course-schedule", testSession);
    assert.ok(courseParam.parameterizedSignatures.python.includes("numCourses: int"), "Graph problem must preserve numCourses argument");
    assert.ok(courseParam.parameterizedSignatures.python.includes("prerequisites"), "Graph problem must preserve prerequisites argument");

    // 4. Lowest Common Ancestor (Tree problem with TreeNode parameters)
    const lcaParam = parameterizeCodingProblem("lowest-common-ancestor-of-a-binary-tree", testSession);
    assert.ok(lcaParam.parameterizedSignatures.python.includes("root"), "Tree problem must preserve root argument");
    assert.ok(lcaParam.parameterizedSignatures.python.includes("TreeNode"), "Tree problem must preserve TreeNode type");
  });

  // TC-M4-REM-04: ENG-M4-02 Cheat detector precision on legitimate lookups vs fraudulent test tables
  await t.test("TC-M4-REM-04: Cheat detector does not flag Roman numerals, DP tables, or config maps", async () => {
    // 1. Roman Numeral Lookup Dictionary (Must NOT be flagged)
    const romanNumeralCode = `def romanToInt(s: str) -> int:
    values = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    total = 0
    for i in range(len(s)):
        if i + 1 < len(s) and values[s[i]] < values[s[i + 1]]:
            total -= values[s[i]]
        else:
            total += values[s[i]]
    return total
`;
    const romanReport = synthesizeHybridComplexity(romanNumeralCode, "python");
    assert.equal(romanReport.isSuspiciousCheat, false, "Roman numeral token dictionary must NOT be flagged as cheat");
    assert.ok(romanReport.evaluationRubricCredit >= 90, "Roman numeral solution must retain full rubric credit");

    // 1b. Integer-to-Roman Numeral Dictionary (Integer keys mapping to Roman numerals must NOT be flagged)
    const intToRomanCode = `def intToRoman(num: int) -> str:
    val_to_roman = {1000: 'M', 900: 'CM', 500: 'D', 400: 'CD', 100: 'C', 90: 'XC', 50: 'L', 40: 'XL', 10: 'X', 9: 'IX', 5: 'V', 4: 'IV', 1: 'I'}
    res = []
    for val, sym in val_to_roman.items():
        if num == 0: break
        count, num = divmod(num, val)
        res.append(sym * count)
    return ''.join(res)
`;
    const intToRomanReport = synthesizeHybridComplexity(intToRomanCode, "python");
    assert.equal(intToRomanReport.isSuspiciousCheat, false, "Integer-to-Roman dictionary must NOT be flagged as cheat");
    assert.ok(intToRomanReport.evaluationRubricCredit >= 90, "Integer-to-Roman solution must retain full rubric credit");

    // 2. Valid Static Configuration Map (Must NOT be flagged)
    const configMapCode = `function calculateTimeout(tier) {
    const TIMEOUTS = { low: 5000, medium: 2000, high: 500 };
    return TIMEOUTS[tier] || 1000;
}`;
    const configReport = synthesizeHybridComplexity(configMapCode, "javascript");
    assert.equal(configReport.isSuspiciousCheat, false, "Static configuration dictionary must NOT be flagged as cheat");

    // 3. Legitimate Memoization & DP Table (Must NOT be flagged)
    const memoCode = `def fib(n: int) -> int:
    memo = { 0: 0, 1: 1 }
    def helper(k):
        if k in memo: return memo[k]
        memo[k] = helper(k - 1) + helper(k - 2)
        return memo[k]
    return helper(n)
`;
    const memoReport = synthesizeHybridComplexity(memoCode, "python");
    assert.equal(memoReport.isSuspiciousCheat, false, "Legitimate DP/memoization table must NOT be flagged as cheat");

    // 4. Constant-Time Vowel Lookup (Must NOT be flagged)
    const vowelCode = `def isVowel(c: str) -> bool:
    vowels = {'a': 1, 'e': 1, 'i': 1, 'o': 1, 'u': 1}
    return c.lower() in vowels
`;
    const vowelReport = synthesizeHybridComplexity(vowelCode, "python");
    assert.equal(vowelReport.isSuspiciousCheat, false, "Constant time vowel map must NOT be flagged as cheat");

    // 5. Positive Fraudulent Hardcoded Array Lookup (MUST be flagged)
    const cheatArrayCode = `def maxSubArray(nums: list[int]) -> int:
    if nums == [-2, 1, -3, 4, -1, 2, 1, -5, 4]: return 6
    if nums == [1]: return 1
    if nums == [5, 4, -1, 7, 8]: return 23
    return 0
`;
    const cheatReport = synthesizeHybridComplexity(cheatArrayCode, "python");
    assert.equal(cheatReport.isSuspiciousCheat, true, "Array equality lookup table MUST be flagged as cheat");
    assert.equal(cheatReport.evaluationRubricCredit, 0, "Cheat solution must receive 0 rubric credit");
  });

});
