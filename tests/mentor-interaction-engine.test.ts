import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeStudentReasoningState,
  selectMentorAction,
  generateDeterministicTeachingTurn
} from "../lib/mentor/interaction-engine";
import { analyzeStudentIntent } from "../lib/mentor/intent-engine";
import { getSilentStudentContext } from "../lib/mentor/context-retriever";
import { processMentorTurn } from "../lib/mentor/engine";
import { getOrCreateLearningTwin, resetMentorSession } from "../lib/mentor/store";
import { ConversationalMessage, LearningTwinState } from "../lib/mentor/types";

describe("Cognalyze Mentor — Interaction Engine & Golden Tests", () => {
  const TEST_STUDENT_ID = "golden-test-learner-1";

  beforeEach(() => {
    resetMentorSession(TEST_STUDENT_ID);
  });

  it("GOLDEN LEETCODE 59 TEST (Part 74): Teaches multi-step boundary derivation without dumping code", async () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT_ID, { domain: "DSA & Problem Solving" });
    const silentContext = getSilentStudentContext(TEST_STUDENT_ID);

    // TURN 1: Initial Request
    const t1Input = "Help me solve LeetCode 59.";
    const t1Intent = analyzeStudentIntent(t1Input);
    assert.strictEqual(t1Intent.intent, "problem_solving");

    const t1Reasoning = analyzeStudentReasoningState(t1Input, []);
    const t1Decision = selectMentorAction(t1Input, t1Intent, silentContext, twin, t1Reasoning, []);

    // RULE: Must PROBE what they tried, MUST NOT dump code or solution
    assert.strictEqual(t1Decision.selectedAction, "PROBE");
    const t1Resp = generateDeterministicTeachingTurn(t1Input, t1Decision, t1Intent, "en");
    assert.ok(t1Resp.includes("what have you tried"));
    assert.ok(!t1Resp.includes("class Solution"));
    assert.ok(!t1Resp.includes("O(N*M)"));

    // TURN 2: Student shares partial idea (row by row)
    const messages: ConversationalMessage[] = [
      { id: "1", role: "user", content: t1Input, timestamp: "2026-09-22T00:00:00Z" },
      { id: "2", role: "mentor", content: t1Resp, timestamp: "2026-09-22T00:00:01Z" }
    ];
    const t2Input = "I thought I could just traverse row by row.";
    const t2Intent = analyzeStudentIntent(t2Input);
    const t2Reasoning = analyzeStudentReasoningState(t2Input, messages);
    const t2Decision = selectMentorAction(t2Input, t2Intent, silentContext, twin, t2Reasoning, messages);

    assert.strictEqual(t2Decision.selectedAction, "GUIDE");
    const t2Resp = generateDeterministicTeachingTurn(t2Input, t2Decision, t2Intent, "en");
    assert.ok(t2Resp.includes("right edge"));

    // TURN 3: Student responds "I go downward"
    messages.push(
      { id: "3", role: "user", content: t2Input, timestamp: "2026-09-22T00:00:02Z" },
      { id: "4", role: "mentor", content: t2Resp, timestamp: "2026-09-22T00:00:03Z" }
    );
    const t3Input = "I go downward.";
    const t3Intent = analyzeStudentIntent(t3Input);
    const t3Reasoning = analyzeStudentReasoningState(t3Input, messages);
    const t3Decision = selectMentorAction(t3Input, t3Intent, silentContext, twin, t3Reasoning, messages);

    assert.strictEqual(t3Decision.selectedAction, "GUIDE");
    const t3Resp = generateDeterministicTeachingTurn(t3Input, t3Decision, t3Intent, "en");
    assert.ok(t3Resp.includes("reach the bottom"));

    // TURN 4: Student responds "I go left"
    messages.push(
      { id: "5", role: "user", content: t3Input, timestamp: "2026-09-22T00:00:04Z" },
      { id: "6", role: "mentor", content: t3Resp, timestamp: "2026-09-22T00:00:05Z" }
    );
    const t4Input = "I go left.";
    const t4Intent = analyzeStudentIntent(t4Input);
    const t4Reasoning = analyzeStudentReasoningState(t4Input, messages);
    const t4Decision = selectMentorAction(t4Input, t4Intent, silentContext, twin, t4Reasoning, messages);

    assert.strictEqual(t4Decision.selectedAction, "REFRAME");
    const t4Resp = generateDeterministicTeachingTurn(t4Input, t4Decision, t4Intent, "en");
    assert.ok(t4Resp.includes("what are we really doing"));

    // TURN 5: Student concludes "Following the outer boundary"
    messages.push(
      { id: "7", role: "user", content: t4Input, timestamp: "2026-09-22T00:00:06Z" },
      { id: "8", role: "mentor", content: t4Resp, timestamp: "2026-09-22T00:00:07Z" }
    );
    const t5Input = "Following the outer boundary.";
    const t5Intent = analyzeStudentIntent(t5Input);
    const t5Reasoning = analyzeStudentReasoningState(t5Input, messages);
    const t5Decision = selectMentorAction(t5Input, t5Intent, silentContext, twin, t5Reasoning, messages);

    assert.strictEqual(t5Decision.selectedAction, "ASK_TO_EXPLAIN");
    const t5Resp = generateDeterministicTeachingTurn(t5Input, t5Decision, t5Intent, "en");
    assert.ok(t5Resp.includes("Which four boundaries do you need?"));
  });

  it("GOLDEN SYSTEM DESIGN TEST (Part 75): Skips demonstrated basics and poses 10k -> 1M scaling scenario", async () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT_ID, { domain: "System Design" });
    const silentContext = getSilentStudentContext("student-demo"); // verified student with API/SQL in DNA

    const input = "Teach me System Design.";
    const intent = analyzeStudentIntent(input);
    const reasoning = analyzeStudentReasoningState(input, []);
    const decision = selectMentorAction(input, intent, silentContext, twin, reasoning, []);

    // RULE: Must connect to verified prior knowledge and skip API basics
    assert.strictEqual(decision.selectedAction, "CONNECT_TO_PRIOR_KNOWLEDGE");
    const response = generateDeterministicTeachingTurn(input, decision, intent, "en");

    assert.ok(response.includes("already demonstrated API and database fundamentals"));
    assert.ok(response.includes("10,000 to 1,000,000"));
    assert.ok(response.includes("What worries you first?"));
  });

  it("GOLDEN DEBUGGING TEST (Part 76): Investigates server logs and recent changes before suggesting code", async () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT_ID);
    const silentContext = getSilentStudentContext(TEST_STUDENT_ID);

    const input = "My API is returning 500.";
    const intent = analyzeStudentIntent(input);
    assert.strictEqual(intent.intent, "debugging");

    const reasoning = analyzeStudentReasoningState(input, []);
    const decision = selectMentorAction(input, intent, silentContext, twin, reasoning, []);

    assert.strictEqual(decision.selectedAction, "DEBUG");
    const response = generateDeterministicTeachingTurn(input, decision, intent, "en");

    assert.ok(response.includes("server log show"));
    assert.ok(response.includes("changed immediately before"));
    // MUST NOT immediately output code
    assert.ok(!response.includes("try {"));
  });

  it("GOLDEN PROJECT TEST (Part 77): Clarifies decision boundaries and evidence before designing architecture", async () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT_ID);
    const silentContext = getSilentStudentContext(TEST_STUDENT_ID);

    const input = "I want to build an AI resume analyzer.";
    const intent = analyzeStudentIntent(input);
    assert.strictEqual(intent.intent, "project_guidance");

    const reasoning = analyzeStudentReasoningState(input, []);
    const decision = selectMentorAction(input, intent, silentContext, twin, reasoning, []);

    assert.strictEqual(decision.selectedAction, "CLARIFY");
    const response = generateDeterministicTeachingTurn(input, decision, intent, "en");

    assert.ok(response.includes("what do you want the system to actually decide"));
    assert.ok(response.includes("what evidence would the system need"));
  });

  it("MISCONCEPTION ISOLATION: Detects sharding vs replication confusion and halts progression", () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT_ID);
    const silentContext = getSilentStudentContext(TEST_STUDENT_ID);

    const input = "I think sharding means copying the database.";
    const intent = analyzeStudentIntent(input);
    const reasoning = analyzeStudentReasoningState(input, []);
    assert.strictEqual(reasoning.hasMisconception, true);

    const decision = selectMentorAction(input, intent, silentContext, twin, reasoning, []);
    assert.strictEqual(decision.selectedAction, "CORRECT_MISCONCEPTION");

    const response = generateDeterministicTeachingTurn(input, decision, intent, "en");
    assert.ok(response.includes("mixing two concepts"));
    assert.ok(response.includes("actual data in each case"));
  });

  it("DIRECT ANSWER WITHHOLDING & OVERRIDE: Withholds answer until explicitly demanded", async () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT_ID);
    const silentContext = getSilentStudentContext(TEST_STUDENT_ID);

    // Case 1: Student says "Don't give me the answer. Just guide me."
    const guideInput = "Help me with caching but don't give me the answer. Just guide me.";
    const guideIntent = analyzeStudentIntent(guideInput);
    assert.strictEqual(guideIntent.forbidDirectAnswer, true);
    assert.strictEqual(guideIntent.assistancePreference, "no_answers");

    const guideDecision = selectMentorAction(
      guideInput,
      guideIntent,
      silentContext,
      twin,
      analyzeStudentReasoningState(guideInput, []),
      []
    );
    assert.notStrictEqual(guideDecision.selectedAction, "DIRECT_ANSWER");

    // Case 2: Student explicitly says "Just give me the solution and complete code."
    const solInput = "Just give me the solution and complete code.";
    const solIntent = analyzeStudentIntent(solInput);
    assert.strictEqual(solIntent.assistancePreference, "solution_requested");

    const solDecision = selectMentorAction(
      solInput,
      solIntent,
      silentContext,
      twin,
      analyzeStudentReasoningState(solInput, []),
      []
    );
    assert.strictEqual(solDecision.selectedAction, "DIRECT_ANSWER");

    const solResp = generateDeterministicTeachingTurn(solInput, solDecision, solIntent, "en");
    assert.ok(solResp.includes("boundary pointers"));
    assert.ok(solResp.includes("top = 0"));
  });

  it("FULL TURN PIPELINE: processMentorTurn invokes Interaction Engine and returns teachingAction metadata", async () => {
    // 1. Candidate with verified DNA (student-demo) skips basics and connects to prior knowledge
    const verifiedTwin = getOrCreateLearningTwin("student-demo", { domain: "System Design" });
    const verifiedResult = await processMentorTurn([], verifiedTwin, "Teach me System Design.");

    assert.ok(verifiedResult.mentorResponse.length > 0);
    assert.ok(verifiedResult.teachingAction !== undefined);
    assert.ok(verifiedResult.decisionContext !== undefined);
    assert.strictEqual(verifiedResult.teachingAction, "CONNECT_TO_PRIOR_KNOWLEDGE");
    assert.ok(verifiedResult.mentorResponse.includes("10,000") && verifiedResult.mentorResponse.includes("1,000,000"));

    // 2. Candidate with no verified background is gently probed without making assumptions
    const newTwin = getOrCreateLearningTwin("unverified-student-1", { domain: "System Design" });
    const newResult = await processMentorTurn([], newTwin, "Teach me System Design.");
    assert.strictEqual(newResult.teachingAction, "PROBE");
  });
});

