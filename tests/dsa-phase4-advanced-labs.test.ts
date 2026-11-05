/**
 * tests/dsa-phase4-advanced-labs.test.ts
 * 
 * Verification Test Suite for Phase 4:
 * - Multi-tier Approach Comparison Engine (Brute vs Better vs Optimal)
 * - "Debug This" Lab Engine (Intentional Bug Diagnosis & Patching)
 * - Visual Dry-Run Simulation Studio (Step-by-step Pointer & Array Animation)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { getApproachComparison } from "../lib/skills/dsa-approach-comparator";
import { getDebugChallenge } from "../lib/skills/dsa-debug-lab";
import { generateDryRunSimulation } from "../lib/skills/dsa-visualizer";

describe("Phase 4: Approach Comparison Lab", () => {
  test("getApproachComparison returns all 3 tiers (Brute, Better, Optimal) for canonical problems", () => {
    const comparison = getApproachComparison("two-sum");
    assert.strictEqual(comparison.problemId, "two-sum");
    assert.strictEqual(comparison.approaches.length, 3);

    const tiers = comparison.approaches.map(a => a.tier);
    assert.deepStrictEqual(tiers, ["brute_force", "better", "optimal"]);

    const brute = comparison.approaches.find(a => a.tier === "brute_force")!;
    assert.strictEqual(brute.timeComplexity, "O(n²)");
    assert.ok(brute.tradeoffBottleneck);
    assert.ok(brute.codeSnippets.cpp);
    assert.ok(brute.codeSnippets.python);

    const optimal = comparison.approaches.find(a => a.tier === "optimal")!;
    assert.strictEqual(optimal.timeComplexity, "O(n)");
    assert.strictEqual(optimal.spaceComplexity, "O(n)");
    assert.ok(optimal.intuition);
  });

  test("getApproachComparison handles Kadane's algorithm progression", () => {
    const comparison = getApproachComparison("maximum-subarray-sum-kadane-s-algorithm");
    assert.strictEqual(comparison.approaches.length, 3);

    const brute = comparison.approaches.find(a => a.tier === "brute_force")!;
    const optimal = comparison.approaches.find(a => a.tier === "optimal")!;

    assert.strictEqual(brute.timeComplexity, "O(n³)");
    assert.strictEqual(optimal.timeComplexity, "O(n)");
    assert.strictEqual(optimal.spaceComplexity, "O(1)");
  });

  test("getApproachComparison falls back gracefully for unknown problem IDs", () => {
    const comparison = getApproachComparison("custom-graph-dijkstra-variant", "Dijkstra Variant");
    assert.strictEqual(comparison.problemId, "custom-graph-dijkstra-variant");
    assert.strictEqual(comparison.approaches.length, 3);
    assert.ok(comparison.approaches[0].name.length > 0);
  });
});

describe("Phase 4: 'Debug This' Lab", () => {
  test("getDebugChallenge provides intentional bug structure for Binary Search", () => {
    const challenge = getDebugChallenge("binary-search");
    assert.strictEqual(challenge.problemId, "binary-search");
    assert.strictEqual(challenge.bugType, "off_by_one");
    assert.strictEqual(challenge.language, "python");
    assert.ok(challenge.buggyCode.includes("high = len(nums)"));
    assert.ok(challenge.failingTestCase.input);
    assert.ok(challenge.failingTestCase.expected);
    assert.ok(challenge.failingTestCase.actualFaultyOutput);

    // 3 progressive hints
    assert.strictEqual(challenge.hints.length, 3);
    assert.ok(challenge.hints[0].length > 10);
    assert.ok(challenge.hints[1].length > 10);
    assert.ok(challenge.hints[2].length > 10);

    // Correct code and explanation
    assert.ok(challenge.correctCode.includes("high = len(nums) - 1"));
    assert.ok(challenge.explanation);
  });

  test("getDebugChallenge handles Two Sum element reuse bug", () => {
    const challenge = getDebugChallenge("two-sum");
    assert.strictEqual(challenge.bugType, "unhandled_edge_case");
    assert.ok(challenge.symptom.includes("identical indices"));
    assert.strictEqual(challenge.hints.length, 3);
  });

  test("getDebugChallenge synthesizes challenge for unlisted problems", () => {
    const challenge = getDebugChallenge("unique-problem-id", "Unique Problem");
    assert.ok(challenge.id);
    assert.ok(challenge.buggyCode);
    assert.ok(challenge.correctCode);
  });
});

describe("Phase 4: Visual Dry-Run Simulation Studio", () => {
  test("generateDryRunSimulation produces correct binary search halving frames", () => {
    const sim = generateDryRunSimulation("binary-search", {
      array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
      target: 23
    });

    assert.strictEqual(sim.algorithmType, "binary_search");
    assert.ok(sim.totalSteps >= 3);
    assert.strictEqual(sim.frames.length, sim.totalSteps);

    // Step 1: Init boundaries
    const firstFrame = sim.frames[0];
    assert.strictEqual(firstFrame.actionType, "init");
    assert.strictEqual(firstFrame.stateVariables.low, 0);
    assert.strictEqual(firstFrame.stateVariables.high, 9);
    assert.ok(firstFrame.hinglishDescription, "Frame must have Hinglish description");

    // Last frame: Found
    const lastFrame = sim.frames[sim.frames.length - 1];
    assert.strictEqual(lastFrame.actionType, "found");
    assert.strictEqual(lastFrame.stateVariables.resultIndex, 5);
  });

  test("generateDryRunSimulation produces Kadane execution frames", () => {
    const sim = generateDryRunSimulation("maximum-subarray-sum-kadane-s-algorithm", {
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4]
    });

    assert.strictEqual(sim.algorithmType, "kadane");
    assert.strictEqual(sim.totalSteps, 10); // 1 init + 9 elements

    const updateFrame = sim.frames[4]; // nums[3] = 4
    assert.strictEqual(updateFrame.actionType, "update_variable");
    assert.strictEqual(updateFrame.stateVariables["nums[i]"], 4);
    assert.strictEqual(updateFrame.stateVariables.maxSubarraySum, 4);
  });

  test("generateDryRunSimulation produces Two Pointers convergence frames", () => {
    const sim = generateDryRunSimulation("two-sum", {
      array: [2, 7, 11, 15],
      target: 9
    });

    assert.strictEqual(sim.algorithmType, "two_pointers");
    assert.ok(sim.totalSteps >= 2);

    const foundFrame = sim.frames.find(f => f.actionType === "found");
    assert.ok(foundFrame, "Simulation must locate matching pair");
    assert.strictEqual(foundFrame.stateVariables.matchIndices, "[0, 1]");
  });
});

