import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateSpokenTeachingPayload,
  selectMentorAction,
  analyzeStudentReasoningState
} from "../lib/mentor/interaction-engine";
import { analyzeStudentIntent } from "../lib/mentor/intent-engine";
import { getSilentStudentContext } from "../lib/mentor/context-retriever";
import { processMentorTurn } from "../lib/mentor/engine";
import { getOrCreateLearningTwin } from "../lib/mentor/store";
import { defaultLLMProvider } from "../lib/mentor/providers/llm-provider";

describe("Cognalyze Mentor — Voice-First Conversational Intelligence", () => {
  const TEST_STUDENT = "voice-test-student";

  it("INTERRUPTION AS FIRST-CLASS FEATURE: Halts audio and addresses confusion immediately", async () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT);
    const silentContext = getSilentStudentContext(TEST_STUDENT);

    // Turn with mid-speech interruption
    const input = "Wait, I don't understand.";
    const intent = analyzeStudentIntent(input);
    const reasoning = analyzeStudentReasoningState(input, []);
    const decision = selectMentorAction(input, intent, silentContext, twin, reasoning, []);

    const payload = generateSpokenTeachingPayload(
      input,
      decision,
      intent,
      "en",
      { wasInterrupted: true, studentInterruption: input }
    );

    assert.ok(payload.spokenResponse.length > 0);
    assert.strictEqual(payload.teachingAction, "LISTEN");
    assert.ok(payload.spokenResponse.includes("pause right there"));
    assert.ok(payload.decisionRationale.includes("interrupted"));
    // Ensures audio stops and does not continue previous speech
    assert.ok(!payload.spokenResponse.includes("Load balancing distributes"));
  });

  it("SEPARATION OF SPOKEN TURN VS VISUAL CANVAS: Spoken turn does not read code blocks or markdown walls", async () => {
    const twin = getOrCreateLearningTwin("student-demo", { domain: "System Design" });
    const silentContext = getSilentStudentContext("student-demo");

    const input = "Teach me System Design.";
    const intent = analyzeStudentIntent(input);
    const reasoning = analyzeStudentReasoningState(input, []);
    const decision = selectMentorAction(input, intent, silentContext, twin, reasoning, []);

    const payload = generateSpokenTeachingPayload(input, decision, intent, "en");

    // 1. Spoken response must be conversational and natural
    assert.ok(!payload.spokenResponse.includes("```"));
    assert.ok(!payload.spokenResponse.includes("# Core Insight"));
    assert.ok(!payload.spokenResponse.includes("|"));
    assert.ok(payload.spokenResponse.includes("10,000 to 1,000,000 requests per minute"));

    // 2. Visual canvas holds the architecture diagram
    assert.ok(payload.visualCanvas !== undefined);
    assert.strictEqual(payload.visualCanvas?.type, "architecture");
    assert.ok(payload.visualCanvas?.content.includes("Monolith Server"));
    assert.ok(payload.visualCanvas?.highlightSnippet?.includes("Primary Database"));
  });

  it("LEETCODE 59 VISUAL SUPPORT: Code and boundary schemas live in visual workspace, not spoken verbatim", () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT);
    const silentContext = getSilentStudentContext(TEST_STUDENT);

    // Direct solution request
    const input = "Just give me the solution and complete code.";
    const intent = analyzeStudentIntent(input);
    const reasoning = analyzeStudentReasoningState(input, []);
    const decision = selectMentorAction(input, intent, silentContext, twin, reasoning, []);

    const payload = generateSpokenTeachingPayload(input, decision, intent, "en");

    assert.strictEqual(payload.teachingAction, "DIRECT_ANSWER");
    // Voice points to visual workspace instead of reading raw code loops line-by-line
    assert.ok(payload.spokenResponse.includes("visual workspace"));
    assert.ok(!payload.spokenResponse.includes("while (top <= bottom"));

    // Code is rendered in visualCanvas
    assert.ok(payload.visualCanvas !== undefined);
    assert.strictEqual(payload.visualCanvas?.type, "code");
    assert.ok(payload.visualCanvas?.content.includes("let top = 0, bottom = n - 1"));
  });

  it("HANDS-FREE WAIT TIMEOUT: Posing questions gives the student thinking time", async () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT, { preferredLanguage: "en" });
    const result = await processMentorTurn([], twin, "Help me solve LeetCode 59.");

    assert.ok(result.waitTimeoutSeconds !== undefined);
    assert.ok(result.waitTimeoutSeconds >= 30);
    assert.ok(result.spokenResponse !== undefined);
    assert.ok(result.spokenResponse.includes("tried") || result.spokenResponse.includes("try"));
  });

  it("PROVIDER ABSTRACTION: Default LLM provider conforms to ILLMProvider contract", () => {
    assert.strictEqual(defaultLLMProvider.name, "groq-primary");
    assert.strictEqual(typeof defaultLLMProvider.generateTurn, "function");
  });
});
