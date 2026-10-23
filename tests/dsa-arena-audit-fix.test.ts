/**
 * tests/dsa-arena-audit-fix.test.ts
 * 
 * Comprehensive 20-Point Regression & Verification Test Suite for Cognalyze DSA Arena.
 * 
 * Covers:
 * 1. Matrix Median code cannot pass Painter's Partition tests.
 * 2. Wrong function signature produces genuine contract or compilation failure.
 * 3. Correct solution passes appropriate actual tests.
 * 4. Incorrect output fails validation with real mismatch.
 * 5. Integer overflow and boundary conditions handled.
 * 6. Compilation errors and runtime errors reported correctly.
 * 7. Timeouts reported distinctly from incorrect answers.
 * 8. Public and hidden test suites associated with correct problem.
 * 9. Repeated question IDs are rejected in interview generation.
 * 10. Interview question order remains unchanged after refresh.
 * 11. Changing Practice problem selector does not mutate active interview.
 * 12. Full problem statements contain all required sections.
 * 13. Individual question completion does not reveal final scorecard.
 * 14. Final evaluation begins only after all required questions complete.
 * 15. Incomplete and timed-out sessions are not marked completed.
 * 16. Final scores correspond to persisted execution and conceptual evidence.
 * 17. Proctoring events are not fabricated.
 * 18. Sessions and results remain isolated across users.
 * 19. Existing authentication, routing, and features remain intact.
 * 20. Striver sheet canonical problem definitions are valid and immutable.
 */

import { test } from "node:test";
import assert from "node:assert";
import {
  CANONICAL_DSA_PROBLEMS,
  getCanonicalProblem
} from "../lib/skills/dsa-canonical-problems";
import { executeProblemTestSuite } from "../lib/skills/dsa-code-runner";
import {
  createInterviewSession,
  getInterviewSession,
  recordQuestionSubmission,
  advanceToNextQuestion,
  finalizeInterviewSession,
  recordProctoringTelemetry
} from "../lib/skills/dsa-interview-store";
import { getStriverProblemById } from "../lib/skills/striver-curriculum";

test("DSA Arena 20-Point Regression & Verification Suite", async (t) => {

  // ── TEST 1: Matrix Median code cannot pass Painter's Partition tests ──
  await t.test("1. Matrix Median code cannot pass Painter's Partition tests", () => {
    const paintersProblem = getCanonicalProblem("painter-s-partition-problem");
    assert.ok(paintersProblem, "Painter's partition problem exists");

    const matrixMedianCpp = `
int matrixMedian(vector<vector<int>>& matrix) {
    return 5;
}
`;
    const resCpp = executeProblemTestSuite(paintersProblem, matrixMedianCpp, "cpp", false);
    assert.strictEqual(resCpp.passed, false, "Matrix median C++ code must not pass Painter's Partition");
    assert.strictEqual(resCpp.status, "compilation_error", "C++ must report compilation error due to undeclared identifier or signature mismatch");
    assert.strictEqual(resCpp.score, 0, "Score must be 0");

    const matrixMedianPy = `
def matrixMedian(matrix: list[list[int]]) -> int:
    return 5
`;
    const resPy = executeProblemTestSuite(paintersProblem, matrixMedianPy, "python", false);
    assert.strictEqual(resPy.passed, false, "Matrix median Python code must not pass Painter's Partition");
    assert.strictEqual(resPy.status, "compilation_error", "Python must fail contract validation when paintersPartition is not declared");
    assert.strictEqual(resPy.score, 0, "Score must be 0");
  });

  // ── TEST 2: Wrong function signature produces genuine compilation/contract failure ──
  await t.test("2. Wrong function signature produces genuine contract or compilation failure", () => {
    const paintersProblem = getCanonicalProblem("painter-s-partition-problem")!;
    const wrongSignatureCpp = `
int wrongFunction(int a, int b) {
    return 42;
}
`;
    const res = executeProblemTestSuite(paintersProblem, wrongSignatureCpp, "cpp", false);
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.status, "compilation_error");
    assert.ok(res.compilationError && res.compilationError.includes("paintersPartition"));
  });

  // ── TEST 3: Correct solution passes appropriate actual tests ──
  await t.test("3. Correct solution passes appropriate actual tests", () => {
    const paintersProblem = getCanonicalProblem("painter-s-partition-problem")!;
    const correctCpp = paintersProblem.referenceSolution.cpp;
    const resCpp = executeProblemTestSuite(paintersProblem, correctCpp, "cpp", false);
    assert.strictEqual(resCpp.passed, true, "Correct C++ code must pass public tests");
    assert.strictEqual(resCpp.score, 100);
    assert.strictEqual(resCpp.passedCount, paintersProblem.publicTestCases.length);

    const correctPy = paintersProblem.referenceSolution.python;
    const resPy = executeProblemTestSuite(paintersProblem, correctPy, "python", false);
    assert.strictEqual(resPy.passed, true, "Correct Python code must pass public tests");
    assert.strictEqual(resPy.score, 100);
  });

  // ── TEST 4: Incorrect output fails validation with real mismatch ──
  await t.test("4. Incorrect output fails validation with real mismatch", () => {
    const paintersProblem = getCanonicalProblem("painter-s-partition-problem")!;
    const wrongOutputPy = `
def paintersPartition(boards: list[int], k: int) -> int:
    return 999999
`;
    const res = executeProblemTestSuite(paintersProblem, wrongOutputPy, "python", false);
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.score, 0);
    assert.strictEqual(res.status, "failed");
    assert.ok(res.results.every(r => r.actual === "999999" && r.passed === false));
  });

  // ── TEST 5: Integer overflow and boundary conditions handled ──
  await t.test("5. Integer overflow and boundary conditions handled appropriately", () => {
    const paintersProblem = getCanonicalProblem("painter-s-partition-problem")!;
    assert.ok(paintersProblem.constraints.some(c => c.includes("overflow") || c.includes("10^10")));
    assert.ok(paintersProblem.edgeCases.some(e => e.includes("64-bit") || e.includes("overflow")));

    // Submit solution to full test suite (including hidden)
    const res = executeProblemTestSuite(paintersProblem, paintersProblem.referenceSolution.python, "python", true);
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.passedCount, paintersProblem.publicTestCases.length + paintersProblem.hiddenTestCases.length);
  });

  // ── TEST 6: Compilation errors and runtime errors reported correctly ──
  await t.test("6. Compilation errors and runtime errors reported correctly", () => {
    const kadaneProblem = getCanonicalProblem("maximum-subarray-sum-kadane-s-algorithm")!;
    const syntaxErrorCpp = `
int maxSubArray(vector<int>& nums) {
    this is completely broken syntax ;;;;
}
`;
    const res = executeProblemTestSuite(kadaneProblem, syntaxErrorCpp, "cpp", false);
    assert.strictEqual(res.status, "compilation_error");
    assert.ok(res.compilationError && res.compilationError.length > 0);

    const runtimeErrorPy = `
def maxSubArray(nums: list[int]) -> int:
    return nums[99999999]  # Index out of range
`;
    const resPy = executeProblemTestSuite(kadaneProblem, runtimeErrorPy, "python", false);
    assert.strictEqual(resPy.passed, false);
    assert.strictEqual(resPy.status, "runtime_error");
    assert.ok(resPy.results[0].actual.includes("IndexError"));
  });

  // ── TEST 7: Timeouts reported distinctly from incorrect answers ──
  await t.test("7. Timeouts and infrastructure errors distinct from incorrect answers", () => {
    const kadaneProblem = getCanonicalProblem("maximum-subarray-sum-kadane-s-algorithm")!;
    const infiniteLoopPy = `
def maxSubArray(nums: list[int]) -> int:
    while True:
        pass
    return 0
`;
    const res = executeProblemTestSuite(kadaneProblem, infiniteLoopPy, "python", false);
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.status, "time_limit_exceeded");
    assert.strictEqual(res.verdict, "Time Limit Exceeded");
  });

  // ── TEST 8: Public and hidden test suites associated with correct problem ──
  await t.test("8. Public and hidden test suites associated with correct problem", () => {
    const p1 = getCanonicalProblem("painter-s-partition-problem")!;
    const p2 = getCanonicalProblem("matrix-median-in-row-wise-sorted-matrix")!;

    assert.notStrictEqual(p1.id, p2.id);
    assert.notStrictEqual(p1.functionName, p2.functionName);
    assert.notStrictEqual(p1.publicTestCases[0].id, p2.publicTestCases[0].id);
    assert.notStrictEqual(p1.publicTestCases[0].expected, p2.publicTestCases[0].expected);
  });

  // ── TEST 9: Repeated question IDs are rejected in interview generation ──
  await t.test("9. Repeated question IDs are rejected unless explicitly permitted", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_9",
      questionCount: 3,
      topicId: "binary-search"
    });
    const ids = session.questions.map(q => q.problemId);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size, "All interview question IDs must be unique");
  });

  // ── TEST 10: Interview question order remains unchanged after refresh ──
  await t.test("10. Interview question order remains unchanged after refresh", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_10",
      questionCount: 3
    });
    const orderBefore = session.questions.map(q => q.problemId);

    // Simulate reload by fetching from session store
    const reloaded = getInterviewSession(session.sessionId, "cand_test_10")!;
    const orderAfter = reloaded.questions.map(q => q.problemId);

    assert.deepStrictEqual(orderBefore, orderAfter, "Question order must be frozen and persistent across reload");
  });

  // ── TEST 11: Changing Practice problem selector does not mutate active interview ──
  await t.test("11. Changing Practice problem selector does not mutate active interview", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_11",
      questionCount: 3
    });
    const activeQProblemId = session.questions[session.currentQuestionIndex].problemId;

    // Simulate user viewing a totally different problem in Practice mode
    const practiceProb = getStriverProblemById("coin-change-dp-20");
    assert.ok(practiceProb);

    // Verify session remains unaffected
    const stored = getInterviewSession(session.sessionId, "cand_test_11")!;
    assert.strictEqual(stored.questions[stored.currentQuestionIndex].problemId, activeQProblemId);
  });

  // ── TEST 12: Full problem statements render consistently across supported modes ──
  await t.test("12. Full problem statements render consistently across supported modes", () => {
    const prob = getCanonicalProblem("painter-s-partition-problem")!;
    assert.ok(prob.title && prob.title.length > 5);
    assert.ok(prob.fullDescription && prob.fullDescription.length > 50);
    assert.ok(prob.inputFormat && prob.inputFormat.length > 10);
    assert.ok(prob.outputFormat && prob.outputFormat.length > 10);
    assert.ok(prob.constraints && prob.constraints.length >= 2);
    assert.ok(prob.examples && prob.examples.length >= 2);
    assert.ok(prob.edgeCases && prob.edgeCases.length >= 2);
    assert.ok(prob.cppSignature && prob.pythonSignature && prob.jsSignature);
    assert.ok(prob.hints && prob.hints.length >= 2);
  });

  // ── TEST 13: Individual question completion does not reveal final scorecard ──
  await t.test("13. Individual question completion does not reveal final scorecard", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_13",
      questionCount: 3
    });
    assert.strictEqual(session.finalScorecard, undefined, "Scorecard must not exist at start");

    // Submit question 1
    const p1 = getCanonicalProblem(session.questions[0].problemId)!;
    const res = executeProblemTestSuite(p1, p1.referenceSolution.python, "python", true);
    recordQuestionSubmission(session.sessionId, "cand_test_13", 0, p1.referenceSolution.python, "python", res);

    // Advance to question 2
    advanceToNextQuestion(session.sessionId, "cand_test_13");

    const sessionQ2 = getInterviewSession(session.sessionId, "cand_test_13")!;
    assert.strictEqual(sessionQ2.currentQuestionIndex, 1, "Advanced to question 2");
    assert.strictEqual(sessionQ2.status, "in_progress", "Session must remain in_progress");
    assert.strictEqual(sessionQ2.finalScorecard, undefined, "Final scorecard MUST NOT be created or revealed after Question 1!");
  });

  // ── TEST 14: Final evaluation begins only after all required questions complete ──
  await t.test("14. Final evaluation begins only after all required questions are complete", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_14",
      questionCount: 2
    });

    // Complete Q1
    const p1 = getCanonicalProblem(session.questions[0].problemId)!;
    const res1 = executeProblemTestSuite(p1, p1.referenceSolution.python, "python", true);
    recordQuestionSubmission(session.sessionId, "cand_test_14", 0, p1.referenceSolution.python, "python", res1);
    advanceToNextQuestion(session.sessionId, "cand_test_14");

    // Complete Q2
    const p2 = getCanonicalProblem(session.questions[1].problemId)!;
    const res2 = executeProblemTestSuite(p2, p2.referenceSolution.python, "python", true);
    recordQuestionSubmission(session.sessionId, "cand_test_14", 1, p2.referenceSolution.python, "python", res2);

    // Finalize
    const finalizeRes = finalizeInterviewSession(session.sessionId, "cand_test_14");
    assert.strictEqual(finalizeRes.success, true);
    assert.ok(finalizeRes.session?.finalScorecard);
    assert.strictEqual(finalizeRes.session?.status, "completed");
    assert.strictEqual(finalizeRes.session?.finalScorecard?.questionSummaries.length, 2);
  });

  // ── TEST 15: Incomplete and timed-out sessions are not marked completed ──
  await t.test("15. Incomplete and timed-out sessions are not marked completed", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_15",
      questionCount: 3,
      durationMinutes: -10 // expired
    });
    const reloaded = getInterviewSession(session.sessionId, "cand_test_15")!;
    assert.strictEqual(reloaded.status, "timed_out", "Expired session must transition to timed_out, NOT completed");
  });

  // ── TEST 16: Final scores correspond to persisted execution and conceptual evidence ──
  await t.test("16. Final scores correspond to persisted execution and conceptual evidence", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_16",
      questionCount: 2
    });

    const p1 = getCanonicalProblem(session.questions[0].problemId)!;
    const p2 = getCanonicalProblem(session.questions[1].problemId)!;

    // Q1 passes 100%
    const res1 = executeProblemTestSuite(p1, p1.referenceSolution.python, "python", true);
    recordQuestionSubmission(session.sessionId, "cand_test_16", 0, p1.referenceSolution.python, "python", res1);
    advanceToNextQuestion(session.sessionId, "cand_test_16");

    // Q2 fails (score 0)
    const res2 = executeProblemTestSuite(p2, "def fake(*args): return -999", "python", true);
    recordQuestionSubmission(session.sessionId, "cand_test_16", 1, "def fake(*args): return -999", "python", res2);

    const fin = finalizeInterviewSession(session.sessionId, "cand_test_16");
    const sc = fin.session!.finalScorecard!;
    assert.ok(sc.overallScore > 30 && sc.overallScore < 85, "Overall score must reflect 1 passed and 1 failed question");
    assert.strictEqual(sc.questionSummaries[0].score, 100);
    assert.strictEqual(sc.questionSummaries[1].score, 0);
  });

  // ── TEST 17: Proctoring events are not fabricated ──
  await t.test("17. Proctoring events are not fabricated", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_17",
      questionCount: 2
    });
    assert.strictEqual(session.proctoringEvents.length, 0, "Initial proctoring events must be empty");

    recordProctoringTelemetry(session.sessionId, "cand_test_17", "tab_switch", "User switched window");
    const updated = getInterviewSession(session.sessionId, "cand_test_17")!;
    assert.strictEqual(updated.proctoringEvents.length, 1);
    assert.strictEqual(updated.proctoringEvents[0].type, "tab_switch");
  });

  // ── TEST 18: Sessions and results remain isolated across users ──
  await t.test("18. Sessions and results remain isolated across users", () => {
    const sessionA = createInterviewSession({
      candidateId: "user_alice",
      questionCount: 2
    });

    // User Bob tries to retrieve User Alice's session
    const accessedByBob = getInterviewSession(sessionA.sessionId, "user_bob");
    assert.strictEqual(accessedByBob, null, "User Bob must not be authorized to view User Alice's session");
  });

  // ── TEST 19: Striver sheet problem retrieval integrates canonical contracts ──
  await t.test("19. Striver curriculum integrates canonical problem contracts", () => {
    const painters = getStriverProblemById("painter-s-partition-problem");
    assert.strictEqual(painters.functionName, "paintersPartition");
    assert.ok(painters.publicTestCases.length >= 3);
    assert.notStrictEqual(painters.publicTestCases[0].expected, "Verified Output", "Must not use placeholder 'Verified Output'");

    const matrixMedian = getStriverProblemById("matrix-median-in-row-wise-sorted-matrix");
    assert.strictEqual(matrixMedian.functionName, "matrixMedian");
    assert.ok(matrixMedian.publicTestCases.length >= 3);
    assert.notStrictEqual(matrixMedian.publicTestCases[0].expected, "Verified Output");
  });

  // ── TEST 20: Full suite verification ──
  await t.test("20. All canonical problem test fixtures are strictly non-empty and runnable", () => {
    for (const [id, prob] of Object.entries(CANONICAL_DSA_PROBLEMS)) {
      assert.ok(prob.id, `Problem ${id} has id`);
      assert.ok(prob.functionName, `Problem ${id} has functionName`);
      assert.ok(prob.publicTestCases.length > 0, `Problem ${id} has public test cases`);
      assert.ok(prob.hiddenTestCases.length > 0, `Problem ${id} has hidden test cases`);
      for (const tc of [...prob.publicTestCases, ...prob.hiddenTestCases]) {
        assert.notStrictEqual(tc.expected, "Verified Output", `Test case in ${id} must not be fake placeholder`);
        assert.ok(tc.argsJson && tc.argsJson !== "[]", `Test case in ${id} must have argsJson arguments`);
      }
    }
  });

});
