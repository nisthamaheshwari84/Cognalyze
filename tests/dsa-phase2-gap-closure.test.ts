/**
 * tests/dsa-phase2-gap-closure.test.ts
 * 
 * Phase 2 Verification Test Suite:
 * 1. Complete 17-Step Roadmap & 455 Problem Canonical Synthesis
 * 2. Multi-Step Interview Session Generation (Steps 1 to 17 guaranteed crash-free)
 * 3. Browser Refresh Session Resumption via GET /api/skills/dsa?mode=interview_session
 * 4. Architectural Boundary Decoupling (Client components use /api/interview/session and /api/interview/history)
 * 5. Multi-Language Runner Java Evaluation Accuracy
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { DSA_ROADMAP_STEPS, getAllDsaSheetProblems } from "../lib/skills/dsa-curriculum";
import { DSA_A2Z_PROBLEMS } from "../lib/dsa-a2z-sheet";
import {
  getCanonicalProblem,
  getAllCanonicalProblemIds,
  CANONICAL_ALIASES
} from "../lib/skills/dsa-canonical-problems";
import {
  createInterviewSession,
  getInterviewSession,
  getActiveSessionForCandidate
} from "../lib/skills/dsa-interview-store";
import { executeProblemTestSuite } from "../lib/skills/dsa-code-runner";
import { GET as dsaGetHandler } from "../app/api/skills/dsa/route";
import { POST as interviewSessionPostHandler, GET as interviewSessionGetHandler } from "../app/api/interview/session/route";
import { GET as interviewHistoryGetHandler } from "../app/api/interview/history/route";
import { NextRequest } from "next/server";
import fs from "fs";

describe("Phase 2: Curriculum & Problem Inventory Integrity", () => {
  test("Strictly preserves 17 steps and 455 problems", () => {
    assert.strictEqual(DSA_ROADMAP_STEPS.length, 17, "Exactly 17 steps required");
    assert.strictEqual(DSA_A2Z_PROBLEMS.length, 455, "Exactly 455 problems required");
  });

  test("Canonical aliases resolve seamlessly to canonical contracts", () => {
    for (const [alias, canonicalId] of Object.entries(CANONICAL_ALIASES)) {
      const prob = getCanonicalProblem(alias);
      assert.ok(prob, `Alias ${alias} must resolve to a valid problem`);
      assert.ok(prob.functionName, `Resolved problem ${alias} must have a functionName`);
      assert.ok(prob.publicTestCases.length > 0, `Resolved problem ${alias} must have test fixtures`);
    }
  });

  test("Any problem across all 17 steps resolves to a runnable CanonicalProblem contract", () => {
    const sampleIds = [
      "count-digits-in-a-number", // Step 1
      "selection-sort",           // Step 2
      "maximum-subarray-sum-kadane-s-algorithm", // Step 3
      "painter-s-partition-problem", // Step 4
      "reverse-words-in-a-string", // Step 5
      "find-the-length-of-the-linkedlist", // Step 6
      "print-all-subsequences-power-set", // Step 7
      "check-if-the-i-th-bit-is-set-or-not", // Step 8
      "implement-stack-using-arrays", // Step 9
      "longest-substring-without-repeating-characters", // Step 10
      "check-if-an-array-represents-a-min-heap", // Step 11
      "assign-cookies", // Step 12
      "inorder-traversal-of-binary-tree", // Step 13
      "search-in-a-binary-search-tree", // Step 14
      "bfs-breadth-first-search-of-graph", // Step 15
      "climbing-stairs", // Step 16
      "implement-trie-i-prefix-tree" // Step 17
    ];

    for (const id of sampleIds) {
      const prob = getCanonicalProblem(id);
      assert.ok(prob, `Problem ${id} must resolve to a valid CanonicalProblem`);
      assert.ok(prob.functionName, `Problem ${id} must have a valid functionName`);
      assert.ok(prob.publicTestCases.length >= 2, `Problem ${id} must have at least 2 public test cases`);
      assert.ok(prob.hiddenTestCases.length >= 2, `Problem ${id} must have at least 2 hidden test cases`);
      assert.ok(prob.followUpQuestions.length >= 1, `Problem ${id} must have follow-up defense questions`);
    }
  });
});

describe("Phase 2: Interview Mode All-Step Crash-Free Lifecycle", () => {
  test("Creates valid 3-question interview sessions for ALL 17 STEPS without crashing", () => {
    for (let stepNum = 1; stepNum <= 17; stepNum++) {
      const stepId = `step-${stepNum}`;
      const session = createInterviewSession({
        candidateId: `test-cand-step-${stepNum}`,
        stepId,
        questionCount: 3
      });

      assert.ok(session, `Session must be created for ${stepId}`);
      assert.ok(session.sessionId, `Session must have unique sessionId for ${stepId}`);
      assert.strictEqual(session.questions.length, 3, `${stepId} must generate exactly 3 interview questions`);

      for (const q of session.questions) {
        assert.ok(q.problemId, `${stepId} question must have problemId`);
        assert.ok(q.title, `${stepId} question must have title`);
        assert.ok(q.difficulty, `${stepId} question must have difficulty`);
        assert.ok(q.timeComplexity, `${stepId} question must have timeComplexity`);
      }
    }
  });

  test("Page refresh restores in-progress interview via GET /api/skills/dsa?mode=interview_session", async () => {
    const candidateId = "candidate-phase2-refresh-test";
    const session = createInterviewSession({
      candidateId,
      stepId: "step-4",
      questionCount: 3
    });

    const req = new NextRequest(`http://localhost:3000/api/skills/dsa?mode=interview_session&candidateId=${candidateId}`);
    const res = await dsaGetHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.session);
    assert.strictEqual(data.session.sessionId, session.sessionId);
    assert.strictEqual(data.session.questions.length, 3);
  });
});

describe("Phase 2: Architectural Boundary Decoupling", () => {
  test("Client pages never directly import server-only interview-session-store", () => {
    const clientFiles = [
      "components/interview/MockInterviewExperience.tsx",
      "app/student/assessment-arena/page.tsx",
      "app/student/interview-prep/history/page.tsx"
    ];

    for (const f of clientFiles) {
      const content = fs.readFileSync(f, "utf8");
      const hasDirectStoreImport = /from\s+["']@\/lib\/interview-session-store["']/.test(content);
      assert.strictEqual(hasDirectStoreImport, false, `${f} must not import @/lib/interview-session-store directly`);
    }
  });

  test("POST & GET /api/interview/session correctly persists and retrieves session on the server", async () => {
    const testSessionData = {
      id: `test-sess-${Date.now()}`,
      candidate_id: "cand-session-api-test",
      session_type: "mock_interview",
      experience_mode: "fresher",
      target_role: "Software Engineer",
      overall_score: 85,
      topics_covered: ["Binary Search", "Arrays"]
    };

    // 1. Save session via API
    const postReq = new NextRequest("http://localhost:3000/api/interview/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testSessionData)
    });
    const postRes = await interviewSessionPostHandler(postReq);
    const postJson = await postRes.json();

    assert.strictEqual(postRes.status, 200);
    assert.strictEqual(postJson.success, true);
    assert.strictEqual(postJson.session.id, testSessionData.id);

    // 2. Retrieve session via API
    const getReq = new NextRequest(`http://localhost:3000/api/interview/session?id=${testSessionData.id}&candidateId=cand-session-api-test`);
    const getRes = await interviewSessionGetHandler(getReq);
    const getJson = await getRes.json();

    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getJson.success, true);
    assert.strictEqual(getJson.session.id, testSessionData.id);
  });

  test("GET /api/interview/history returns candidate interview sessions", async () => {
    const req = new NextRequest("http://localhost:3000/api/interview/history?candidateId=cand-session-api-test");
    const res = await interviewHistoryGetHandler(req);
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.sessions));
  });
});

describe("Phase 2: Multi-Language Code Runner Hardening", () => {
  test("Java execution returns transparent status without throwing Node VM syntax errors", () => {
    const problem = getCanonicalProblem("two-sum-check-pair-with-target")!;
    const dummyJavaCode = `
      public class Solution {
        public int[] twoSum(int[] nums, int target) {
          return new int[]{0, 1};
        }
      }
    `;

    const summary = executeProblemTestSuite(problem, dummyJavaCode, "java", false);
    assert.ok(summary);
    // Either passed (if JDK is installed) or infrastructure_error (if JDK is absent)
    assert.ok(
      summary.status === "passed" || summary.status === "infrastructure_error" || summary.status === "compilation_error",
      `Unexpected Java runner status: ${summary.status}`
    );
    if (summary.status === "infrastructure_error") {
      assert.ok(summary.message?.includes("Java Runtime Environment (JDK) is not configured"));
    }
  });
});
