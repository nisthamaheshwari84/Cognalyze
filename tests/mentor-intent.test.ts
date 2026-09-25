import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeStudentIntent } from "../lib/mentor/intent-engine";
import { getSilentStudentContext, buildSilentBriefingDirective } from "../lib/mentor/context-retriever";
import { evaluateStudentAnswer } from "../lib/mentor/evaluator";

describe("Cognalyze Mentor — 15 Master Product Scenarios", () => {
  it("SCENARIO 1: 'Teach me System Design.' -> intent: learning, topic: System Design", () => {
    const res = analyzeStudentIntent("Teach me System Design.");
    assert.strictEqual(res.intent, "learning");
    assert.strictEqual(res.topic, "System Design");
    assert.strictEqual(res.isOffTopic, false);
  });

  it("SCENARIO 2: 'I already know the basics. Go deeper.' -> depth: deep_technical", () => {
    const res = analyzeStudentIntent("I already know the basics. Go deeper.");
    assert.strictEqual(res.depth, "deep_technical");
  });

  it("SCENARIO 3: 'Mujhe Hinglish mein samjhao.' -> language: hinglish", () => {
    const res = analyzeStudentIntent("Mujhe Hinglish mein samjhao.");
    assert.strictEqual(res.language, "hinglish");
  });

  it("SCENARIO 4: 'Help me solve this LeetCode problem but don't give me the answer.' -> no_answers constraint", () => {
    const res = analyzeStudentIntent("Help me solve this LeetCode problem but don't give me the answer.");
    assert.strictEqual(res.intent, "problem_solving");
    assert.strictEqual(res.forbidDirectAnswer, true);
    assert.strictEqual(res.assistancePreference, "no_answers");
  });

  it("SCENARIO 5: 'Actually, just give me a hint.' -> assistancePreference: hint_only", () => {
    const res = analyzeStudentIntent("Actually, just give me a hint.");
    assert.strictEqual(res.assistancePreference, "hint_only");
  });

  it("SCENARIO 6: 'Take my interview.' -> intent: interview", () => {
    const res = analyzeStudentIntent("Take my interview.");
    assert.strictEqual(res.intent, "interview");
  });

  it("SCENARIO 7: 'I don't understand.' -> strategyShiftTrigger: true", () => {
    const res = analyzeStudentIntent("I don't understand.");
    assert.strictEqual(res.strategyShiftTrigger, true);
  });

  it("SCENARIO 8: 'Explain this using a real-world example.' -> wantsRealWorldExample: true", () => {
    const res = analyzeStudentIntent("Explain this using a real-world example.");
    assert.strictEqual(res.wantsRealWorldExample, true);
  });

  it("SCENARIO 9: 'I want to build a RAG application.' -> intent: project_guidance, topic: RAG", () => {
    const res = analyzeStudentIntent("I want to build a RAG application.");
    assert.strictEqual(res.intent, "project_guidance");
    assert.ok(res.topic.toLowerCase().includes("rag"));
  });

  it("SCENARIO 10: 'Continue from yesterday.' -> intent: revision", () => {
    const res = analyzeStudentIntent("Continue from yesterday.");
    assert.strictEqual(res.intent, "revision");
  });

  it("SCENARIO 11: 'Tell me random celebrity gossip.' -> off-topic guardrail with polite redirect", () => {
    const res = analyzeStudentIntent("Tell me random celebrity gossip.");
    assert.strictEqual(res.isOffTopic, true);
    assert.strictEqual(res.intent, "off_topic");
    assert.ok(Boolean(res.redirectMessage));
  });

  it("SCENARIO 12: 'I have 20 minutes.' -> timeBudgetMinutes: 20", () => {
    const res = analyzeStudentIntent("I have 20 minutes.");
    assert.strictEqual(res.timeBudgetMinutes, 20);
    assert.strictEqual(res.intent, "time_budgeted");
  });

  it("SCENARIO 13: 'Switch to English.' -> language: en", () => {
    const res = analyzeStudentIntent("Switch to English.");
    assert.strictEqual(res.language, "en");
  });

  it("SCENARIO 14: 'Switch to Hindi.' -> language: hi", () => {
    const res = analyzeStudentIntent("Switch to Hindi.");
    assert.strictEqual(res.language, "hi");
  });

  it("SCENARIO 15: 'Stop explaining. Just challenge me.' -> intent: challenge", () => {
    const res = analyzeStudentIntent("Stop explaining. Just challenge me.");
    assert.strictEqual(res.intent, "challenge");
  });

  it("Silent Student DNA Briefing strictly enforces Anti-Overclaiming", () => {
    const ctx = getSilentStudentContext("student-demo");
    assert.ok(ctx.studentId === "student-demo");
    const briefing = buildSilentBriefingDirective(ctx);
    assert.ok(briefing.includes("ANTI-OVERCLAIMING RULE"));
    assert.ok(briefing.includes("Never flatter the student"));
  });

  it("Structured Evaluator decouples generation from assessment without fake scores", () => {
    const intent = analyzeStudentIntent("Let's discuss database caching");
    const answer = "I chose Cache-Aside with Redis because our read-to-write ratio is 95:5 and it prevents database latency spikes.";
    const result = evaluateStudentAnswer(answer, "Caching", 0, intent, "test-student-1");

    assert.ok(result.evaluation !== undefined);
    assert.strictEqual(result.evaluation?.demonstratedState, "demonstrated");
    assert.strictEqual(result.evaluation?.confidence, "HIGH");
    assert.strictEqual(result.evidence?.assistanceLevel, "Independent");
    assert.ok(result.evaluation?.whyExplanation.includes("trade-offs"));
  });
});
