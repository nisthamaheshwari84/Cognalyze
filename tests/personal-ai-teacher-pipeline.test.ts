import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyVoiceCommand,
  buildAdaptiveLessonNarration,
  evaluateStudentTeachingResponse,
  provideInterruptExplanation,
} from "../lib/skills/code-comprehension/personal-teacher-engine";
import {
  TRACE_WORKFLOWS,
  getTraceWorkflow,
  evaluatePrediction,
} from "../lib/skills/code-comprehension/execution-tracer";
import {
  FOUNDATIONAL_LEARNING_MODULES,
  getLessonNarration,
} from "../lib/skills/code-comprehension/learning-modules";

describe("Cognalyze Personal AI Engineering Mentor — Acceptance Test Suite", () => {
  // ---------------------------------------------------------------------------
  // TEST 1: Complete Lesson Narration
  // ---------------------------------------------------------------------------
  it("Test 1: Complete Lesson Narration generates structured multi-segment spoken script", () => {
    const lesson = FOUNDATIONAL_LEARNING_MODULES[0].microLessons[0];
    const narration = getLessonNarration(lesson);

    assert.ok(narration.intro.length > 20, "Intro must be a complete thought");
    assert.ok(narration.whyItMatters.length > 20, "Why it matters must be articulated");
    assert.ok(narration.analogy.length > 20, "Everyday analogy must be present");
    assert.ok(narration.codeWalkthrough.length > 20, "Code walkthrough must be present");
    assert.ok(narration.internals.length > 20, "Internals must be present");
    assert.ok(narration.checkpointPrompt.length > 10, "Checkpoint prompt must be present");

    // Must not be a 1-sentence robot summary
    assert.ok(
      narration.fullSpokenScript.length >= 150,
      `Narration must be a complete spoken walkthrough, got ${narration.fullSpokenScript.length} chars`
    );
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Student Asks a Question / Voice Interrupt
  // ---------------------------------------------------------------------------
  it("Test 2: Student Voice Interrupt classifies intents accurately", () => {
    const q1 = classifyVoiceCommand("Why are we doing this check?");
    assert.equal(q1.intent, "why_this_matters");

    const q2 = classifyVoiceCommand("Can you explain this more simply?");
    assert.equal(q2.intent, "simpler_explanation");

    const q3 = classifyVoiceCommand("Give me a real world example");
    assert.equal(q3.intent, "give_example");

    const q4 = classifyVoiceCommand("What happens internally under the hood?");
    assert.equal(q4.intent, "internal_deep_dive");

    const q5 = classifyVoiceCommand("Explain this again please");
    assert.equal(q5.intent, "explain_again");

    const q6 = classifyVoiceCommand("Move to the next step");
    assert.equal(q6.intent, "next_step");
  });

  it("Test 2b: On-demand interrupt explanation provides grounded architectural guidance", () => {
    const explanation = provideInterruptExplanation({
      intent: "simpler_explanation",
      topicTitle: "Authentication Middleware",
      filePath: "src/middleware/auth.ts",
      functionName: "authenticateToken",
      codeSnippet: "const token = authHeader.split(' ')[1];",
      architectureStage: "middleware",
      currentDifficultyLevel: 2,
    });

    assert.match(explanation.spokenExplanation, /badge/i, "Beginner explanation must use intuitive analogy");
    assert.ok(explanation.nextSuggestedAction.length > 10);
  });

  // ---------------------------------------------------------------------------
  // TEST 3: Visual Dry Run — Zero Empty/Informational Frames
  // ---------------------------------------------------------------------------
  it("Test 3: Visual Dry Run guarantees every single frame has active teaching checkpoints", () => {
    const workflows = Object.values(TRACE_WORKFLOWS);
    assert.ok(workflows.length >= 3, "Must have at least 3 active trace workflows");

    let totalFrames = 0;
    for (const wf of workflows) {
      assert.ok(wf.frames.length >= 5, `Workflow ${wf.id} must have at least 5 execution frames`);

      for (const frame of wf.frames) {
        totalFrames++;
        assert.ok(frame.tellExplanation.length > 20, `Frame ${wf.id} #${frame.stepIndex} must have tellExplanation`);
        assert.ok(frame.askQuestion.length > 15, `Frame ${wf.id} #${frame.stepIndex} must have askQuestion`);
        assert.ok(frame.whyThisQuestionMatters.length > 15, `Frame ${wf.id} #${frame.stepIndex} must have whyThisQuestionMatters`);
        assert.ok(frame.beginnerAnalogy.length > 15, `Frame ${wf.id} #${frame.stepIndex} must have beginnerAnalogy`);
        assert.ok(frame.internalDeepDive.length > 15, `Frame ${wf.id} #${frame.stepIndex} must have internalDeepDive`);
        assert.ok(frame.prediction, `Frame ${wf.id} #${frame.stepIndex} MUST NOT BE INFORMATIONAL; must have prediction`);
        assert.ok(frame.prediction.options.length >= 2, `Frame ${wf.id} #${frame.stepIndex} must have at least 2 prediction options`);
        assert.ok(frame.prediction.options.some((o) => o.isCorrect), `Frame ${wf.id} #${frame.stepIndex} must have a correct option`);
      }
    }

    assert.ok(totalFrames >= 18, `Expected at least 18 total execution frames across workflows, got ${totalFrames}`);
  });

  // ---------------------------------------------------------------------------
  // TEST 4: We Do Collaborative Execution
  // ---------------------------------------------------------------------------
  it("Test 4: We Do mode evaluates student predictions with diagnostic feedback", () => {
    // Correct prediction
    const correctRes = evaluatePrediction("taskflow_create_task", 2, "opt-1");
    assert.equal(correctRes.isCorrect, true);
    assert.match(correctRes.explanation, /tamper|tamper-proof|JWT/i);

    // Incorrect prediction with diagnostic guidance
    const incorrectRes = evaluatePrediction("taskflow_create_task", 2, "opt-2");
    assert.equal(correctRes.isCorrect, true);
    assert.equal(incorrectRes.isCorrect, false);
    assert.match(incorrectRes.explanation, /tenant isolation|security/i);
  });

  it("Test 4b: We Do mode evaluates free-form student responses with misconception detection", async () => {
    // Accurate student response
    const validAnswer = "The organizationId is cryptographically bound inside the signed JWT token, so a client cannot tamper with it or access other tenants.";
    const evalResult = await evaluateStudentTeachingResponse({
      topicTitle: "Authentication Middleware",
      filePath: "src/middleware/auth.ts",
      codeSnippet: "req.user = decoded;",
      checkpointQuestion: "Why extract orgId from JWT?",
      studentAnswer: validAnswer,
      expectedInvariants: ["organizationId is cryptographically bound", "protects against IDOR"],
      currentDifficultyLevel: 3,
    });

    assert.equal(evalResult.isCorrect, true);
    assert.ok(evalResult.score >= 70);
    assert.equal(evalResult.readyToAdvance, true);

    // Student response with dangerous misconception (reading orgId from body)
    const misconceptionAnswer = "The client decides the tenant from request body req.body.orgId.";
    const badResult = await evaluateStudentTeachingResponse({
      topicTitle: "Authentication Middleware",
      filePath: "src/middleware/auth.ts",
      codeSnippet: "req.user = decoded;",
      checkpointQuestion: "Why extract orgId from JWT?",
      studentAnswer: misconceptionAnswer,
      expectedInvariants: ["organizationId is cryptographically bound"],
      currentDifficultyLevel: 3,
    });

    assert.equal(badResult.isCorrect, false);
    assert.ok(badResult.misconceptionsDetected.length > 0, "Must detect untrusted body reliance misconception");
  });

  // ---------------------------------------------------------------------------
  // TEST 5: You Do Independent Execution
  // ---------------------------------------------------------------------------
  it("Test 5: You Do mode enforces concurrency and multi-tenant security verification", () => {
    // Concurrency conflict detection in Workflow 2
    const concurrencyRes = evaluatePrediction("taskflow_concurrency_conflict", 4, "opt-1");
    assert.equal(concurrencyRes.isCorrect, true);
    assert.match(concurrencyRes.explanation, /collision|optimistic/i);

    // Tenant isolation verification in Workflow 3
    const tenantRes = evaluatePrediction("taskflow_cross_tenant_rejection", 4, "opt-1");
    assert.equal(tenantRes.isCorrect, true);
    assert.match(tenantRes.explanation, /enumeration|probing|404/i);
  });

  // ---------------------------------------------------------------------------
  // TEST 6: Foundations Interaction
  // ---------------------------------------------------------------------------
  it("Test 6: Foundations micro-lesson exercises evaluate correct and misconception choices", () => {
    const module1 = FOUNDATIONAL_LEARNING_MODULES[0];
    assert.equal(module1.microLessons.length, 4, "Module 1 must have 4 micro-lessons");

    for (const lesson of module1.microLessons) {
      assert.ok(lesson.exercise.options.length >= 2, `Lesson ${lesson.id} must have >= 2 options`);
      const correctOpt = lesson.exercise.options.find((o) => o.isCorrect);
      assert.ok(correctOpt, `Lesson ${lesson.id} must have a correct option`);
      assert.ok(correctOpt.successExplanation, `Lesson ${lesson.id} must have successExplanation`);

      const incorrectOpt = lesson.exercise.options.find((o) => !o.isCorrect);
      assert.ok(incorrectOpt, `Lesson ${lesson.id} must have an incorrect option`);
      assert.ok(incorrectOpt.misconceptionExplanation, `Lesson ${lesson.id} must address misconceptions`);
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 7: Beginner-to-Advanced Progression (Levels 1 to 6)
  // ---------------------------------------------------------------------------
  it("Test 7: Adaptive narration builder adapts tone and depth to student level", () => {
    const level1Narration = buildAdaptiveLessonNarration({
      topicTitle: "Token Authentication",
      filePath: "src/middleware/auth.ts",
      functionName: "authenticateToken",
      codeSnippet: "const token = authHeader.split(' ')[1];",
      architectureStage: "middleware",
      level: 1,
    });

    assert.match(level1Narration.conceptIntro, /restaurant|busy/i, "Level 1 must use accessible analogy");

    const level3Narration = buildAdaptiveLessonNarration({
      topicTitle: "Token Authentication",
      filePath: "src/middleware/auth.ts",
      functionName: "authenticateToken",
      codeSnippet: "const token = authHeader.split(' ')[1];",
      architectureStage: "middleware",
      level: 3,
    });

    assert.match(level3Narration.conceptIntro, /layer|executing/i, "Level 3 must use technical engineering terminology");
  });

  // ---------------------------------------------------------------------------
  // TEST 8: Voice Fallback and Classification Robustness
  // ---------------------------------------------------------------------------
  it("Test 8: Voice command classification gracefully falls back to answer submission on non-command inputs", () => {
    const generalAnswer = "The service creates an entity with version 1 and status TODO.";
    const intentResult = classifyVoiceCommand(generalAnswer);
    assert.equal(intentResult.intent, "answer_submission");
    assert.equal(intentResult.cleanText, generalAnswer);
  });
});

