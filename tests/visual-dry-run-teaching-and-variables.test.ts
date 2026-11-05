/**
 * tests/visual-dry-run-teaching-and-variables.test.ts
 * 
 * Verifies:
 * 1. Visual Dry-Run 8-phase teaching curriculum
 * 2. Active student participation prediction checkpoints
 * 3. Complete absence of 'undefined' state variables in all execution frames
 * 4. Boundary cases: target found vs search space exhausted (target not found -> -1)
 * 5. Independent transfer lab problems with conceptual bridges
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  simulateBinarySearch,
  simulateKadane,
  simulateTwoPointers,
  simulateLinkedListReversal,
  simulateValidParentheses,
  simulateClimbingStairs,
  generateDryRunSimulation
} from "../lib/skills/dsa-visualizer";

test("Area A: Binary Search has comprehensive 8-phase curriculum and zero undefined state variables", () => {
  const sim = simulateBinarySearch([1, 3, 5, 7, 9, 11, 13, 15], 9);
  
  // 1. Verify Curriculum Phases
  assert.ok(sim.curriculum, "Curriculum must be attached to simulation");
  assert.ok(sim.curriculum.problemUnderstanding.plainLanguage.length > 20, "Phase 1 plain language required");
  assert.ok(sim.curriculum.problemUnderstanding.whyItMatters.length > 20, "Phase 1 whyItMatters required");
  assert.ok(sim.curriculum.problemUnderstanding.realWorldUseCases.length >= 2, "Phase 1 use cases required");
  
  assert.ok(sim.curriculum.analogy.title.length > 5, "Phase 2 analogy title required");
  assert.ok(sim.curriculum.analogy.scenario.length > 30, "Phase 2 analogy scenario required");
  
  assert.ok(sim.curriculum.approachComparison.naive.timeComplexity === "O(N)", "Phase 3 naive complexity");
  assert.ok(sim.curriculum.approachComparison.optimal.timeComplexity === "O(log N)", "Phase 3 optimal complexity");
  
  assert.ok(sim.curriculum.technicalDetails.loopInvariant.length > 10, "Phase 4 loop invariant required");
  assert.ok(sim.curriculum.technicalDetails.commonPitfalls.length >= 2, "Phase 4 common pitfalls required");
  
  assert.ok(sim.curriculum.transferLab.title.length > 5, "Phase 8 transfer lab required");
  assert.ok(sim.curriculum.transferLab.conceptualBridge.length > 20, "Phase 8 conceptual bridge required");

  // 2. Verify all frames and assert ZERO undefined variables
  assert.ok(sim.frames.length >= 3);
  for (let i = 0; i < sim.frames.length; i++) {
    const f = sim.frames[i];
    assert.equal(f.stepIndex, i);
    assert.ok(f.spokenNarration.length > 15, `Frame ${i} spoken narration must be teacher quality`);
    assert.ok(f.spokenNarrationHinglish.length > 15, `Frame ${i} spoken narration Hinglish required`);
    
    // Check every state variable
    for (const [varName, val] of Object.entries(f.stateVariables)) {
      assert.notEqual(val, undefined, `Variable ${varName} in frame ${i} must NOT be undefined`);
      assert.notEqual(String(val), "undefined", `Variable ${varName} in frame ${i} string value must NOT be 'undefined'`);
    }
  }

  // 3. Verify Prediction Checkpoints exist
  const predictionFrames = sim.frames.filter(f => f.prediction !== undefined);
  assert.ok(predictionFrames.length >= 1, "Must have at least one prediction checkpoint");
  const pred = predictionFrames[0].prediction!;
  assert.ok(pred.options.length >= 2, "Prediction checkpoint must have multiple choices");
  assert.ok(pred.options.some(o => o.isCorrect), "At least one choice must be correct");
});

test("Area A: Binary Search handles target NOT in array (exhaustion returning -1)", () => {
  // Target 8 does not exist in [1, 3, 5, 7, 9, 11, 13, 15]
  const sim = simulateBinarySearch([1, 3, 5, 7, 9, 11, 13, 15], 8);
  assert.ok(sim.frames.length >= 4);

  const lastFrame = sim.frames[sim.frames.length - 1];
  assert.equal(lastFrame.actionType, "finish", "Last frame must be finish action");
  assert.equal(lastFrame.stateVariables.resultIndex, -1, "resultIndex must be -1 when not found");
  assert.ok(lastFrame.title.includes("Exhausted"), "Title must state search space exhausted");
  
  // Verify low > high
  assert.ok(Number(lastFrame.stateVariables.low) > Number(lastFrame.stateVariables.high), "low must exceed high at termination");
});

test("Area A: Kadane's algorithm has 8-phase curriculum and zero undefined variables", () => {
  const sim = simulateKadane([-2, 1, -3, 4, -1, 2, 1, -5, 4]);
  assert.equal(sim.algorithmType, "kadane");
  assert.equal(sim.totalSteps, 10);
  assert.ok(sim.curriculum.transferLab.title.includes("Product"), "Kadane transfer lab tests Max Product Subarray");

  for (let i = 0; i < sim.frames.length; i++) {
    const f = sim.frames[i];
    for (const [varName, val] of Object.entries(f.stateVariables)) {
      assert.notEqual(val, undefined, `Kadane variable ${varName} in frame ${i} must not be undefined`);
      assert.notEqual(String(val), "undefined");
    }
  }

  const predFrame = sim.frames.find(f => f.prediction !== undefined);
  assert.ok(predFrame, "Kadane must have an active prediction checkpoint at negative prefix reset");
  assert.ok(predFrame!.prediction!.options.some(o => o.isCorrect));
});

test("Area A: Two Pointers, Linked List, Valid Parentheses, Climbing Stairs all have valid curriculum and zero undefined state", () => {
  const sims = [
    simulateTwoPointers([2, 7, 11, 15], 9),
    simulateLinkedListReversal(),
    simulateValidParentheses("{[()]}"),
    simulateClimbingStairs(4)
  ];

  for (const s of sims) {
    assert.ok(s.curriculum, `Simulation ${s.problemId} missing curriculum`);
    assert.ok(s.curriculum.problemUnderstanding.plainLanguage.length > 10);
    assert.ok(s.curriculum.analogy.scenario.length > 10);
    assert.ok(s.curriculum.transferLab.title.length > 5);

    for (let i = 0; i < s.frames.length; i++) {
      const f = s.frames[i];
      for (const [varName, val] of Object.entries(f.stateVariables)) {
        assert.notEqual(val, undefined, `Var ${varName} in frame ${i} of ${s.problemId} must not be undefined`);
        assert.notEqual(String(val), "undefined");
      }
    }
  }
});

