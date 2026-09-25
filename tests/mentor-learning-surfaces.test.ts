import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { constructAdaptiveLearningSurface } from "../lib/mentor/surface-engine";
import { analyzeStudentIntent } from "../lib/mentor/intent-engine";
import { processMentorTurn } from "../lib/mentor/engine";
import { getOrCreateLearningTwin } from "../lib/mentor/store";

describe("Cognalyze Mentor — Adaptive Learning Surfaces", () => {
  it("CONSTRUCTS CONCEPT SURFACE: Visual call stack, analogy, and prediction checkpoint", () => {
    const input = "Explain recursion to me.";
    const intent = analyzeStudentIntent(input);
    const surface = constructAdaptiveLearningSurface({
      userText: input,
      intent,
      teachingAction: "EXPLAIN"
    });

    assert.strictEqual(surface.surfaceType, "concept");
    assert.ok(surface.conceptVisual !== undefined);
    assert.strictEqual(surface.conceptVisual?.diagramType, "call_stack");
    assert.ok(surface.conceptVisual?.nodes.some((n) => n.label.includes("factorial(4)")));
    assert.ok(surface.conceptVisual?.nodes.some((n) => n.label.includes("factorial(1)")));
    assert.ok(surface.conceptVisual?.analogySnippet?.includes("Russian nesting dolls"));

    // Check prediction checkpoint
    assert.ok(surface.quizCheckpoint !== undefined);
    assert.ok(surface.quizCheckpoint?.question.includes("factorial"));
    assert.strictEqual(surface.quizCheckpoint?.options.length, 4);
  });

  it("CONSTRUCTS LEETCODE SURFACE: Progressive disclosure from constraints to code", () => {
    // Step 1: Initial Problem Understanding
    const step1Input = "Help me solve LeetCode 59 spiral matrix.";
    const step1Intent = analyzeStudentIntent(step1Input);
    const surface1 = constructAdaptiveLearningSurface({
      userText: step1Input,
      intent: step1Intent,
      teachingAction: "PROBE"
    });

    assert.strictEqual(surface1.surfaceType, "problem_solving");
    assert.strictEqual(surface1.progressiveStep, "problem_understanding");
    assert.strictEqual(surface1.problemWorkspace?.difficulty, "Medium");
    assert.ok(surface1.problemWorkspace?.description.includes("spiral"));

    // Step 2: Student mentions approach -> advances to constraints & approach
    const step2Input = "I thought I could traverse row by row.";
    const step2Intent = analyzeStudentIntent(step2Input);
    const surface2 = constructAdaptiveLearningSurface({
      userText: step2Input,
      intent: step2Intent,
      teachingAction: "GUIDE",
      previousSurface: surface1
    });

    assert.strictEqual(surface2.surfaceType, "problem_solving");
    assert.ok(surface2.progressiveStep === "constraints" || surface2.progressiveStep === "approach");

    // Step 3: Student requests code -> code starter appears with syntax highlighting
    const step3Input = "Okay show me how to implement the boundary code.";
    const step3Intent = analyzeStudentIntent(step3Input);
    const surface3 = constructAdaptiveLearningSurface({
      userText: step3Input,
      intent: step3Intent,
      teachingAction: "APPLY",
      previousSurface: surface2
    });

    assert.strictEqual(surface3.progressiveStep, "code");
    assert.ok(surface3.problemWorkspace?.codeStarter !== undefined);
    assert.ok(surface3.problemWorkspace?.codeStarter?.includes("function generateMatrix"));
    assert.ok(surface3.problemWorkspace?.codeStarter?.includes("let top = 0, bottom = n - 1"));
  });

  it("CONSTRUCTS DEBUGGING SURFACE: Highlights suspect line, error logs, and variable state", () => {
    const input = "Why is my code failing with a 500 error?";
    const intent = analyzeStudentIntent(input);
    const surface = constructAdaptiveLearningSurface({
      userText: input,
      intent,
      teachingAction: "DEBUG"
    });

    assert.strictEqual(surface.surfaceType, "code_debugging");
    assert.ok(surface.debuggingWorkspace !== undefined);
    assert.strictEqual(surface.debuggingWorkspace?.suspectLine, 7);
    assert.ok(surface.debuggingWorkspace?.errorLog?.includes("TypeError"));
    assert.ok(surface.debuggingWorkspace?.actualOutput?.includes("500"));
    assert.ok(surface.debuggingWorkspace?.variableInspector?.some((v) => v.name.includes("cartItems.length")));
  });

  it("CONSTRUCTS SYSTEM DESIGN SURFACE: Component topology and dynamic 10x traffic simulation", () => {
    const input = "Teach me System Design. Let's scale from 10k to 1,000,000 requests per minute.";
    const intent = analyzeStudentIntent(input);
    const surface = constructAdaptiveLearningSurface({
      userText: input,
      intent,
      teachingAction: "CONNECT_TO_PRIOR_KNOWLEDGE"
    });

    assert.strictEqual(surface.surfaceType, "system_design");
    assert.ok(surface.systemDesignCanvas !== undefined);
    assert.strictEqual(surface.systemDesignCanvas?.scaleTier, "1M");
    assert.ok(surface.systemDesignCanvas?.activeComponents.some((c) => c.name.includes("Primary Database")));
    assert.ok(surface.systemDesignCanvas?.currentBottleneck?.includes("Database Write Throughput"));
  });

  it("CONSTRUCTS INTERVIEW SURFACE: Rubric categories, formal questions, and no dashboard clutter", () => {
    const input = "Take my ML interview on distributed systems.";
    const intent = analyzeStudentIntent(input);
    const surface = constructAdaptiveLearningSurface({
      userText: input,
      intent,
      teachingAction: "INTERVIEW"
    });

    assert.strictEqual(surface.surfaceType, "interview");
    assert.ok(surface.interviewWorkspace !== undefined);
    assert.strictEqual(surface.interviewWorkspace?.questionIndex, 1);
    assert.ok(surface.interviewWorkspace?.currentQuestion.includes("rate limiter"));
    assert.ok(surface.interviewWorkspace?.evaluationRubric.some((r) => r.category.includes("Technical Accuracy")));
  });

  it("CONTINUOUS MULTI-SURFACE TRANSITION IN ONE SESSION: Seamless progression without page reload", async () => {
    const twin = getOrCreateLearningTwin("multi-surface-student", { preferredLanguage: "hinglish" });
    const messages: any[] = [];
    let sessionLearningState: any = undefined;

    // 1. Student asks for concept
    const turn1 = await processMentorTurn(messages, twin, "Mujhe recursion samajhna hai.", undefined, sessionLearningState);
    assert.strictEqual(turn1.learningSurface?.surfaceType, "concept");
    sessionLearningState = turn1.sessionLearningState;
    messages.push({ role: "user", content: "Mujhe recursion samajhna hai." });
    messages.push({ role: "mentor", content: turn1.mentorResponse, metadata: { learningSurface: turn1.learningSurface } });

    // 2. Student asks for visualization
    const turn2 = await processMentorTurn(messages, twin, "Okay but mujhe visualize karke samjhao.", undefined, sessionLearningState);
    assert.ok(turn2.learningSurface?.conceptVisual !== undefined);
    assert.strictEqual(turn2.learningSurface?.conceptVisual?.diagramType, "call_stack");
    sessionLearningState = turn2.sessionLearningState;
    messages.push({ role: "user", content: "Okay but mujhe visualize karke samjhao." });
    messages.push({ role: "mentor", content: turn2.mentorResponse, metadata: { learningSurface: turn2.learningSurface } });

    // 3. Student asks for practice problem
    const turn3 = await processMentorTurn(messages, twin, "Ab ek question do.", undefined, sessionLearningState);
    assert.ok(turn3.learningSurface?.quizCheckpoint !== undefined);
    sessionLearningState = turn3.sessionLearningState;
    messages.push({ role: "user", content: "Ab ek question do." });
    messages.push({ role: "mentor", content: turn3.mentorResponse, metadata: { learningSurface: turn3.learningSurface } });

    // 4. Student asks for interview format
    const turn4 = await processMentorTurn(messages, twin, "Okay ab mujhe interview ki tarah poochho.", undefined, sessionLearningState);
    assert.strictEqual(turn4.learningSurface?.surfaceType, "interview");
    assert.ok(turn4.learningSurface?.interviewWorkspace !== undefined);

    // All 4 transitions completed within the same session history without a page reload or mode button!
    assert.strictEqual(messages.length, 6);
  });
});
