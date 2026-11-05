/**
 * tests/dsa-interview-complete-upgrade.test.ts
 * 
 * Comprehensive Test Suite for the Upgraded Cognalyze DSA Arena Interview Mode.
 * 
 * Verifies:
 * 1. 5, 6, and 7 question configurations.
 * 2. Mandatory six-area coverage in every interview format:
 *    - technical_reasoning
 *    - live_coding
 *    - debugging
 *    - code_comprehension
 *    - complexity_optimization
 *    - adaptive_followup
 * 3. Question diversity & repeat prevention across consecutive interviews for the same user.
 * 4. Heterogeneous answer submission (coding, debugging, comprehension trace, Big-O proof, adaptive defense).
 * 5. Evidence-backed 100-point normalized scoring dossier with all 6 competency breakdowns.
 * 6. Session locking, refresh restoration, and multi-user candidate isolation.
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import {
  createInterviewSession,
  getInterviewSession,
  getActiveSessionForCandidate,
  recordQuestionSubmission,
  recordHeterogeneousAnswer,
  recordFollowUpAnswer,
  advanceToNextQuestion,
  finalizeInterviewSession
} from "../lib/skills/dsa-interview-store";
import {
  generateInterviewBlueprint
} from "../lib/skills/dsa-interview-question-bank";
import {
  getSeenQuestionIds,
  clearCandidateQuestionHistory
} from "../lib/skills/dsa-interview-history-store";
import { executeProblemTestSuite } from "../lib/skills/dsa-code-runner";
import { getCanonicalProblem } from "../lib/skills/dsa-canonical-problems";

const TEST_CANDIDATE = "test-upgraded-candidate-001";
const TEST_CANDIDATE_2 = "test-upgraded-candidate-002";

describe("DSA Arena Upgraded Interview Mode — Configuration & Six-Area Blueprint", () => {
  beforeEach(() => {
    clearCandidateQuestionHistory(TEST_CANDIDATE);
    clearCandidateQuestionHistory(TEST_CANDIDATE_2);
  });

  test("5-Question format strictly covers all six mandatory assessment areas", () => {
    const blueprint = generateInterviewBlueprint({
      candidateId: TEST_CANDIDATE,
      questionCount: 5,
      language: "python"
    });

    assert.strictEqual(blueprint.length, 5, "Must produce exactly 5 questions");
    
    // Check areas covered
    const areas = blueprint.map(q => q.area);
    assert.ok(areas.includes("technical_reasoning"), "Must include technical_reasoning");
    assert.ok(areas.includes("live_coding"), "Must include live_coding");
    assert.ok(areas.includes("debugging"), "Must include debugging");
    assert.ok(areas.includes("code_comprehension"), "Must include code_comprehension");
    assert.ok(areas.includes("adaptive_followup"), "Must include adaptive_followup");

    // Live coding prompt in 5-Q format must explicitly mandate complexity proof
    const codingQ = blueprint.find(q => q.area === "live_coding");
    assert.ok(codingQ?.prompt.includes("MANDATORY EVALUATION"), "5-Q live coding question must assess complexity proof");
  });

  test("6-Question standard format contains distinct question for each of the 6 areas", () => {
    const session = createInterviewSession({
      candidateId: TEST_CANDIDATE,
      questionCount: 6,
      targetCompany: "Google",
      targetRole: "fresher",
      language: "cpp"
    });

    assert.strictEqual(session.questions.length, 6, "Must produce exactly 6 questions");
    assert.strictEqual(session.durationMinutes, 60, "Default 6-Q duration must be 60 minutes");

    const areas = session.questions.map(q => q.area);
    const expectedAreas = [
      "technical_reasoning",
      "live_coding",
      "debugging",
      "code_comprehension",
      "complexity_optimization",
      "adaptive_followup"
    ];

    for (const ea of expectedAreas) {
      assert.ok(areas.includes(ea as any), `6-Question round must contain ${ea}`);
    }
  });

  test("7-Question format covers all 6 areas plus second coding problem", () => {
    const session = createInterviewSession({
      candidateId: TEST_CANDIDATE,
      questionCount: 7,
      targetCompany: "Meta",
      targetRole: "experienced",
      language: "python"
    });

    assert.strictEqual(session.questions.length, 7, "Must produce exactly 7 questions");
    assert.strictEqual(session.durationMinutes, 75, "7-Q duration must be 75 minutes");

    const codingQuestions = session.questions.filter(q => q.area === "live_coding");
    assert.strictEqual(codingQuestions.length, 2, "7-Question round must contain 2 distinct live coding questions");
  });
});

describe("DSA Arena Upgraded Interview Mode — Repeat Prevention & Diversity Ledger", () => {
  beforeEach(() => {
    clearCandidateQuestionHistory(TEST_CANDIDATE);
  });

  test("Consecutive interviews for same candidate present distinct questions", () => {
    // Session 1
    const session1 = createInterviewSession({
      candidateId: TEST_CANDIDATE,
      questionCount: 6,
      targetCompany: "Amazon"
    });

    const s1QuestionIds = session1.questions.map(q => q.problemId);
    const seenSet = getSeenQuestionIds(TEST_CANDIDATE);

    for (const qid of s1QuestionIds) {
      assert.ok(seenSet.has(qid), `Candidate history ledger must track question ${qid}`);
    }

    // Session 2 for same candidate
    const session2 = createInterviewSession({
      candidateId: TEST_CANDIDATE,
      questionCount: 6,
      targetCompany: "Amazon"
    });

    const s2QuestionIds = session2.questions.map(q => q.problemId);

    // Verify live coding question in session 2 is different from session 1
    const s1CodingId = session1.questions.find(q => q.area === "live_coding")?.problemId;
    const s2CodingId = session2.questions.find(q => q.area === "live_coding")?.problemId;
    assert.notStrictEqual(s1CodingId, s2CodingId, "Consecutive interviews must not repeat the same live coding problem");
  });

  test("Isolated candidate history: Candidate B does not inherit Candidate A's seen set", () => {
    createInterviewSession({
      candidateId: TEST_CANDIDATE,
      questionCount: 6
    });

    const seenA = getSeenQuestionIds(TEST_CANDIDATE);
    const seenB = getSeenQuestionIds(TEST_CANDIDATE_2);

    assert.ok(seenA.size > 0, "Candidate A must have recorded question history");
    assert.strictEqual(seenB.size, 0, "Candidate B history must be empty and isolated");
  });
});

describe("DSA Arena Upgraded Interview Mode — Heterogeneous Evaluation & 100-Point Dossier", () => {
  beforeEach(() => {
    clearCandidateQuestionHistory(TEST_CANDIDATE);
  });

  test("Complete 6-Question interview workflow produces evidence-backed 100-pt dossier", () => {
    const session = createInterviewSession({
      candidateId: TEST_CANDIDATE,
      questionCount: 6,
      targetCompany: "Google",
      language: "python"
    });

    assert.strictEqual(session.status, "in_progress");

    // 1. Submit Technical Reasoning (Q0)
    const resQ0 = recordHeterogeneousAnswer(session.sessionId, TEST_CANDIDATE, 0, {
      invariantDefense: "The feasibility predicate is monotonic because if mid workers can paint in time T, then T+1 time is also feasible. Binary search on answer space contracts high to mid-1.",
      explanation: "Monotonicity guarantees no false negatives in the rejected space."
    });
    assert.ok(resQ0.success);

    // Advance to Q1
    advanceToNextQuestion(session.sessionId, TEST_CANDIDATE);

    // 2. Submit Live Coding (Q1)
    const prob = getCanonicalProblem("maximum-subarray-sum-kadane-s-algorithm") || getCanonicalProblem("painter-s-partition-problem")!;
    const pyCode = prob.referenceSolution.python;
    const execResult = executeProblemTestSuite(prob, pyCode, "python", true);
    assert.ok(execResult.passed, "Reference solution must pass executable test suite");

    const resQ1 = recordQuestionSubmission(session.sessionId, TEST_CANDIDATE, 1, pyCode, "python", execResult);
    assert.ok(resQ1.success);

    // Advance to Q2
    advanceToNextQuestion(session.sessionId, TEST_CANDIDATE);

    // 3. Submit Debugging (Q2)
    const resQ2 = recordHeterogeneousAnswer(session.sessionId, TEST_CANDIDATE, 2, {
      identifiedBugLine: 14,
      identifiedRootCause: "When nums[mid] > target, high was set to mid instead of mid-1, preventing search interval from shrinking when low == high.",
      code: "def search(nums, target):\n    low, high = 0, len(nums) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1"
    });
    assert.ok(resQ2.success);

    // Advance to Q3
    advanceToNextQuestion(session.sessionId, TEST_CANDIDATE);

    // 4. Submit Code Comprehension (Q3)
    const resQ3 = recordHeterogeneousAnswer(session.sessionId, TEST_CANDIDATE, 3, {
      predictedOutput: "Collision at step 4 on node with value 5",
      variableTrace: "Step 0: slow=1, fast=1. Step 1: slow=2, fast=3. Step 2: slow=3, fast=5. Step 3: slow=4, fast=3 (cycled). Step 4: slow=5, fast=5 (collision)."
    });
    assert.ok(resQ3.success);

    // Advance to Q4
    advanceToNextQuestion(session.sessionId, TEST_CANDIDATE);

    // 5. Submit Complexity & Optimization (Q4)
    const resQ4 = recordHeterogeneousAnswer(session.sessionId, TEST_CANDIDATE, 4, {
      submittedTimeComplexity: "O(N)",
      submittedSpaceComplexity: "O(1)",
      optimizationDefense: "Sorting requires O(N log N) time. The single-pass hash map achieves O(N) time at the expense of O(N) space. In memory-constrained systems, Two-Pointers is preferred."
    });
    assert.ok(resQ4.success);

    // Advance to Q5
    advanceToNextQuestion(session.sessionId, TEST_CANDIDATE);

    // 6. Submit Adaptive Follow-Up (Q5)
    const resQ5 = recordFollowUpAnswer(
      session.sessionId,
      TEST_CANDIDATE,
      5,
      "When duplicate elements occur such that nums[low] == nums[mid] == nums[high], we cannot determine the sorted half. We must shrink boundaries linearly with low++ and high--, degrading worst-case time to O(N)."
    );
    assert.ok(resQ5.success);

    // Finalize Interview
    const finalRes = finalizeInterviewSession(session.sessionId, TEST_CANDIDATE);
    assert.ok(finalRes.success);
    assert.ok(finalRes.session?.finalScorecard, "Must produce a comprehensive FinalScorecard");

    const sc = finalRes.session.finalScorecard;
    assert.strictEqual(finalRes.session.status, "completed");
    assert.ok(sc.overallScore >= 70, `Overall score must be >= 70, got ${sc.overallScore}`);
    assert.ok(sc.verdict === "Strong Hire" || sc.verdict === "Hire", `Verdict must be Hire or Strong Hire, got ${sc.verdict}`);

    // Verify all 6 Area Competencies are populated with scores, maxPoints, and evidence
    assert.ok(sc.areaCompetencies, "Scorecard must include areaCompetencies breakdown");
    assert.ok(sc.areaCompetencies.technicalReasoning.score > 0, "Technical reasoning score must be > 0");
    assert.ok(sc.areaCompetencies.liveCoding.score > 0, "Live coding score must be > 0");
    assert.ok(sc.areaCompetencies.debugging.score > 0, "Debugging score must be > 0");
    assert.ok(sc.areaCompetencies.codeComprehension.score > 0, "Code comprehension score must be > 0");
    assert.ok(sc.areaCompetencies.complexityOptimization.score > 0, "Complexity optimization score must be > 0");
    assert.ok(sc.areaCompetencies.adaptiveFollowUp.score > 0, "Adaptive follow-up score must be > 0");

    assert.ok(sc.strengths.length > 0, "Must identify candidate strengths");
    assert.ok(sc.recommendation.length > 10, "Must provide actionable recommendation");
  });

  test("Session persistence & refresh restoration preserves active interview", () => {
    const session = createInterviewSession({
      candidateId: TEST_CANDIDATE,
      questionCount: 6,
      targetCompany: "Microsoft"
    });

    const active = getActiveSessionForCandidate(TEST_CANDIDATE);
    assert.ok(active, "Active session must be retrieved by candidateId");
    assert.strictEqual(active.sessionId, session.sessionId);
    assert.strictEqual(active.questions.length, 6);
  });

  test("Cross-user authorization: Candidate B cannot fetch or mutate Candidate A's session", () => {
    const sessionA = createInterviewSession({
      candidateId: TEST_CANDIDATE,
      questionCount: 6
    });

    const fetchedByB = getInterviewSession(sessionA.sessionId, TEST_CANDIDATE_2);
    assert.strictEqual(fetchedByB, null, "Candidate B must not be permitted to read Candidate A's session");

    const mutationRes = recordFollowUpAnswer(sessionA.sessionId, TEST_CANDIDATE_2, 0, "Malicious attempt");
    assert.strictEqual(mutationRes.success, false, "Candidate B cannot mutate Candidate A's session");
  });
});

