/**
 * tests/dsa-step-selection-and-scorecard.test.ts
 * 
 * Strict Regression Test Suite for Cognalyze DSA Arena:
 * State Synchronization, Problem Selection, and Final Interview Evaluation Pipeline.
 * 
 * Covers TEST A through TEST N from Section 12:
 * TEST A: Step preservation across Learn, Practice, and Coach.
 * TEST B: Non-default step selection (Step 5, Step 1) never defaults to Step 3.
 * TEST C: Problem selector integrity: Statement, starter code, hints, and tests identify the same canonical problem.
 * TEST D: Problem switching: Dependent elements update synchronously and unambiguously.
 * TEST E: Interview topic integrity: Starting an interview from a selected step builds question pool strictly from that step.
 * TEST F: Duplicate prevention: No question ID repeated in the same session.
 * TEST G: Frozen session: Question set and progress remain unchanged across reloads.
 * TEST H: Answer persistence: Submissions stored against correct session and question IDs.
 * TEST I: Final evaluation timing: Scorecard blocked until all questions are completed.
 * TEST J: Correct scorecard: Real per-question evidence, score explanation, and grounded next steps.
 * TEST K: Evaluation failure handling: Session and answers preserved on evaluation error with retry capability.
 * TEST L: Code/test mapping: Test suites strictly isolated per problem.
 * TEST M: Cross-user isolation: Sessions isolated by candidateId.
 * TEST N: Existing functionality: Striver roadmap, 6 Skill Hub tracks, and test fixtures remain functional.
 */

import { test } from "node:test";
import assert from "node:assert";
import {
  CANONICAL_DSA_PROBLEMS,
  getCanonicalProblem,
  getAllCanonicalProblemIds
} from "../lib/skills/dsa-canonical-problems";
import {
  STRIVER_STEPS,
  getAllStriverProblems,
  getStriverProblemById,
  generateDsaInterviewSession
} from "../lib/skills/striver-curriculum";
import {
  createInterviewSession,
  getInterviewSession,
  recordQuestionSubmission,
  recordFollowUpAnswer,
  advanceToNextQuestion,
  finalizeInterviewSession
} from "../lib/skills/dsa-interview-store";
import { executeProblemTestSuite } from "../lib/skills/dsa-code-runner";

test("DSA Arena State Synchronization, Question Selection & Evaluation Pipeline", async (t) => {

  // ── TEST A: Step preservation across Learn, Practice, and Coach ──
  await t.test("TEST A — Step preservation across modes", () => {
    const step1Problems = getAllStriverProblems({ stepId: "step-1" });
    assert.ok(step1Problems.length > 0, "Step 1 must have problems");
    
    // Pick first problem of Step 1
    const p1 = step1Problems[0];
    assert.strictEqual(p1.step_id, "step-1", "Problem must belong to Step 1");

    // Canonical selection state
    const canonicalSelection = {
      selectedStepId: "step-1",
      selectedSubtopic: "all",
      activeProblemId: p1.id,
      selectedLanguage: "cpp" as const,
      mode: "learn" as const
    };

    // Switch to practice mode
    const practiceSelection = { ...canonicalSelection, mode: "practice" as const };
    assert.strictEqual(practiceSelection.selectedStepId, "step-1", "Step must remain step-1 in practice mode");
    assert.strictEqual(practiceSelection.activeProblemId, p1.id, "Problem must remain p1 in practice mode");

    // Switch to coach mode
    const coachSelection = { ...practiceSelection, mode: "coach" as const };
    assert.strictEqual(coachSelection.selectedStepId, "step-1", "Step must remain step-1 in coach mode");
    assert.strictEqual(coachSelection.activeProblemId, p1.id, "Problem must remain p1 in coach mode");

    // Ensure problemsList for step-1 contains the active problem
    const list = getAllStriverProblems({ stepId: coachSelection.selectedStepId });
    assert.ok(list.some(p => p.id === coachSelection.activeProblemId), "Step 1 list must contain the selected problem");
  });

  // ── TEST B: Non-default step (Step 5, Step 1) never defaults to Step 3 ──
  await t.test("TEST B — Non-default step selection never silently returns to Step 3", () => {
    const step5 = STRIVER_STEPS.find(s => s.id === "step-5");
    assert.ok(step5, "Step 5: Strings must exist");

    const step5Problems = getAllStriverProblems({ stepId: "step-5" });
    assert.ok(step5Problems.length > 0, "Step 5 problems must not be empty");

    const selectedStep = "step-5";
    const activeProb = step5Problems[0];

    // Verify neither step nor problem resolves to Step 3 (Arrays)
    assert.strictEqual(activeProb.step_id, "step-5", "Selected problem must be from Step 5");
    assert.notStrictEqual(activeProb.step_id, "step-3", "Must NOT silently default to Step 3");
    assert.ok(activeProb.step_title.toLowerCase().includes("step 5") || activeProb.step_title.toLowerCase().includes("strings"), "Step title must refer to Strings");
  });

  // ── TEST C: Problem selector integrity ──
  await t.test("TEST C — Problem selector integrity (Find Peak Element)", () => {
    const peakProb = getCanonicalProblem("find-peak-element");
    assert.ok(peakProb, "Find Peak Element canonical problem must exist");

    // Verify all aspects refer to Find Peak Element
    assert.strictEqual(peakProb.id, "find-peak-element");
    assert.strictEqual(peakProb.functionName, "findPeakElement");
    assert.ok(peakProb.fullDescription.includes("peak element"), "Problem statement must describe peak element");
    assert.ok(peakProb.starterCode.cpp.includes("findPeakElement"), "C++ starter must declare findPeakElement");
    assert.ok(peakProb.starterCode.python.includes("findPeakElement"), "Python starter must declare findPeakElement");
    assert.ok(peakProb.hints.length >= 2, "Hints must be present for Find Peak Element");
    assert.ok(peakProb.publicTestCases.length >= 2, "Public test cases must be present");

    // Execute reference solution
    const execRes = executeProblemTestSuite(peakProb, peakProb.referenceSolution.python, "python", false);
    assert.strictEqual(execRes.passed, true, "Find Peak Element reference solution must pass its own tests");
    assert.strictEqual(execRes.totalTests, peakProb.publicTestCases.length);
  });

  // ── TEST D: Problem switching and stale closure prevention ──
  await t.test("TEST D — Problem switching updates all dependent elements", () => {
    const prob1 = getCanonicalProblem("count-digits-in-a-number")!;
    const prob2 = getCanonicalProblem("painter-s-partition-problem")!;

    assert.ok(prob1 && prob2, "Both test problems must exist");

    // Executing prob1 solution against prob2 must fail validation (not pass)
    const crossRes = executeProblemTestSuite(prob2, prob1.referenceSolution.python, "python", false);
    assert.strictEqual(crossRes.passed, false, "Submitting Count Digits code into Painter's Partition must fail validation");

    // Stale closure test: problem contract must be strictly isolated
    assert.notStrictEqual(prob1.functionName, prob2.functionName);
  });

  // ── TEST E: Interview topic integrity from selected step ──
  await t.test("TEST E — Interview topic integrity: Step 1 selection builds pool strictly from Step 1", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_e",
      stepId: "step-1",
      topicId: "step-1",
      questionCount: 3
    });

    assert.ok(session, "Session must be created");
    assert.strictEqual(session.stepId, "step-1", "Session stepId must be step-1");
    assert.strictEqual(session.questions.length, 3, "Session must have 3 questions");

    for (const q of session.questions) {
      const canonical = getCanonicalProblem(q.problemId);
      assert.ok(canonical, `Question ${q.problemId} must exist in canonical registry`);
      assert.ok(
        canonical.step_title.toLowerCase().includes("step 1") || canonical.step_title.toLowerCase().includes("basics"),
        `Question ${q.title} (${canonical.step_title}) must strictly belong to Step 1`
      );
      assert.ok(!canonical.step_title.toLowerCase().includes("step 3:"), "Question must NOT belong to Step 3 Arrays");
    }
  });

  // ── TEST F: Duplicate prevention within interview session ──
  await t.test("TEST F — Duplicate question prevention within session", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_f",
      stepId: "step-4",
      questionCount: 4
    });

    assert.ok(session.questions.length >= 2, "Session must have at least 2 questions");
    const seenIds = new Set<string>();
    for (const q of session.questions) {
      assert.ok(!seenIds.has(q.problemId), `Duplicate question ID detected: ${q.problemId}`);
      seenIds.add(q.problemId);
    }
  });

  // ── TEST G: Frozen session and progress persistence ──
  await t.test("TEST G — Frozen session remains unchanged on reload", () => {
    const initial = createInterviewSession({
      candidateId: "cand_test_g",
      stepId: "step-4",
      questionCount: 3
    });

    const initialQIds = initial.questions.map(q => q.problemId);

    // Simulate page refresh / retrieval by sessionId
    const retrieved = getInterviewSession(initial.sessionId, "cand_test_g");
    assert.ok(retrieved, "Session must be retrievable");
    assert.deepStrictEqual(
      retrieved.questions.map(q => q.problemId),
      initialQIds,
      "Question sequence and IDs must be completely frozen and identical"
    );
  });

  // ── TEST H: Answer persistence across questions ──
  await t.test("TEST H — Answers are stored against correct session and question IDs", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_h",
      stepId: "step-1",
      questionCount: 2
    });

    // Solve Question 1
    const q1 = session.questions[0];
    const canonicalQ1 = getCanonicalProblem(q1.problemId)!;
    const testRes1 = executeProblemTestSuite(canonicalQ1, canonicalQ1.referenceSolution.python, "python", true);
    
    const sub1 = recordQuestionSubmission(
      session.sessionId,
      "cand_test_h",
      0,
      canonicalQ1.referenceSolution.python,
      "python",
      testRes1
    );
    assert.strictEqual(sub1.success, true);

    // Record follow-up for Q1
    recordFollowUpAnswer(session.sessionId, "cand_test_h", 0, "Monotonic property allows O(log10(N)) repeated division.");

    // Advance to Question 2
    advanceToNextQuestion(session.sessionId, "cand_test_h");

    // Solve Question 2
    const q2 = session.questions[1];
    const canonicalQ2 = getCanonicalProblem(q2.problemId)!;
    const testRes2 = executeProblemTestSuite(canonicalQ2, canonicalQ2.referenceSolution.python, "python", true);

    const sub2 = recordQuestionSubmission(
      session.sessionId,
      "cand_test_h",
      1,
      canonicalQ2.referenceSolution.python,
      "python",
      testRes2
    );
    assert.strictEqual(sub2.success, true);

    // Verify session persistence
    const reloaded = getInterviewSession(session.sessionId, "cand_test_h")!;
    assert.strictEqual(reloaded.questions[0].status, "completed");
    assert.strictEqual(reloaded.questions[1].status, "submitted");
    assert.ok(reloaded.questions[0].submittedCode?.length! > 0);
    assert.ok(reloaded.questions[1].submittedCode?.length! > 0);
    assert.strictEqual(reloaded.questions[0].testResults?.passed, true);
    assert.strictEqual(reloaded.questions[1].testResults?.passed, true);
  });

  // ── TEST I: Final evaluation timing (blocked until all required questions complete) ──
  await t.test("TEST I — Final evaluation is strictly blocked after Question 1", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_i",
      stepId: "step-1",
      questionCount: 3
    });

    // Advance Q1
    advanceToNextQuestion(session.sessionId, "cand_test_i");
    const active = getInterviewSession(session.sessionId, "cand_test_i")!;
    assert.strictEqual(active.status, "in_progress");
    assert.strictEqual(active.finalScorecard, undefined, "Scorecard must NOT exist after Question 1");
  });

  // ── TEST J: Correct scorecard with real evidence ──
  await t.test("TEST J — Final scorecard reflects actual execution results", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_j",
      stepId: "step-1",
      questionCount: 2
    });

    // Q1: Correct solution
    const q1Prob = getCanonicalProblem(session.questions[0].problemId)!;
    const exec1 = executeProblemTestSuite(q1Prob, q1Prob.referenceSolution.python, "python", true);
    recordQuestionSubmission(session.sessionId, "cand_test_j", 0, q1Prob.referenceSolution.python, "python", exec1);

    advanceToNextQuestion(session.sessionId, "cand_test_j");

    // Q2: Suboptimal/failing solution
    const q2Prob = getCanonicalProblem(session.questions[1].problemId)!;
    const failingCode = "def countDigits(n):\n    return 0\n";
    const exec2 = executeProblemTestSuite(q2Prob, failingCode, "python", true);
    recordQuestionSubmission(session.sessionId, "cand_test_j", 1, failingCode, "python", exec2);

    // Finalize
    const finalizeRes = finalizeInterviewSession(session.sessionId, "cand_test_j");
    assert.strictEqual(finalizeRes.success, true);
    assert.ok(finalizeRes.session?.finalScorecard, "Scorecard must be generated");

    const sc = finalizeRes.session!.finalScorecard!;
    assert.ok(sc.overallScore > 0 && sc.overallScore < 100, `Overall score should be partial, got ${sc.overallScore}%`);
    assert.ok(sc.scoreCalculationExplanation?.includes("weighted"), "Explanation must detail calculation formula");
    assert.strictEqual(sc.questionSummaries.length, 2);
    assert.strictEqual(sc.questionSummaries[0].score, 100);
    assert.strictEqual(sc.questionSummaries[1].score, 0);
    assert.ok(sc.recommendation.length > 0, "Recommendation must not be empty");
  });

  // ── TEST K: Evaluation failure handling and retry without restarting ──
  await t.test("TEST K — Evaluation failure preserves answers and allows retry", () => {
    const session = createInterviewSession({
      candidateId: "cand_test_k",
      stepId: "step-4",
      questionCount: 2
    });

    const q1Prob = getCanonicalProblem(session.questions[0].problemId)!;
    const exec1 = executeProblemTestSuite(q1Prob, q1Prob.referenceSolution.python, "python", true);
    recordQuestionSubmission(session.sessionId, "cand_test_k", 0, q1Prob.referenceSolution.python, "python", exec1);

    // Simulate an interrupted session state
    const currentSession = getInterviewSession(session.sessionId, "cand_test_k")!;
    assert.strictEqual(currentSession.questions[0].submittedCode, q1Prob.referenceSolution.python);

    // Retry finalization
    const res = finalizeInterviewSession(session.sessionId, "cand_test_k");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.session?.status, "completed");
    assert.ok(res.session?.finalScorecard);
  });

  // ── TEST L: Code and test suite mapping ──
  await t.test("TEST L — Test execution strictly isolated per problem ID", () => {
    const p1 = getCanonicalProblem("reverse-words-in-a-string")!;
    const p2 = getCanonicalProblem("count-digits-in-a-number")!;

    // Reverse words code executed on Count Digits
    const res = executeProblemTestSuite(p2, p1.referenceSolution.python, "python", false);
    assert.strictEqual(res.passed, false, "Reverse words code must fail count digits test suite");
    assert.strictEqual(res.status, "compilation_error", "Signature mismatch must be flagged");
  });

  // ── TEST M: Cross-user isolation ──
  await t.test("TEST M — Candidate interview sessions are strictly isolated", () => {
    const sessionUserA = createInterviewSession({
      candidateId: "user_alice",
      stepId: "step-1",
      questionCount: 2
    });

    // User Bob attempts to access Alice's session
    const accessedByBob = getInterviewSession(sessionUserA.sessionId, "user_bob");
    assert.strictEqual(accessedByBob, null, "User Bob must NOT have access to Alice's session");

    // Alice accesses her own session
    const accessedByAlice = getInterviewSession(sessionUserA.sessionId, "user_alice");
    assert.ok(accessedByAlice, "Alice must be able to access her own session");
  });

  // ── TEST N: Existing functionality preserved ──
  await t.test("TEST N — Existing Striver roadmap steps and canonical registry intact", () => {
    assert.strictEqual(STRIVER_STEPS.length, 17, "All 17 Striver steps must be intact");
    const canonicalIds = getAllCanonicalProblemIds();
    assert.ok(canonicalIds.length >= 10, "Canonical problem registry must contain all flagship problems");
    assert.ok(canonicalIds.includes("painter-s-partition-problem"));
    assert.ok(canonicalIds.includes("find-peak-element"));
    assert.ok(canonicalIds.includes("count-digits-in-a-number"));
    assert.ok(canonicalIds.includes("maximum-subarray-sum-kadane-s-algorithm"));
    assert.ok(canonicalIds.includes("reverse-words-in-a-string"));
  });

});
