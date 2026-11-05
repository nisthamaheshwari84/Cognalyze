/**
 * tests/visual-dry-run-studio-synchronization.test.ts
 * 
 * Verifies the Visual Dry-Run Studio simulation engine:
 * - Code line synchronization
 * - State variables with hasChanged flags
 * - Dual-language audio narration (English & Hinglish)
 * - Multi-structure support (Arrays, Linked Lists, Stacks, DP Tables)
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  generateDryRunSimulation,
  simulateBinarySearch,
  simulateKadane,
  simulateLinkedListReversal,
  simulateValidParentheses,
  simulateClimbingStairs
} from "../lib/skills/dsa-visualizer";

test("Visual Dry-Run: Binary Search simulation maintains code line and audio synchronization", () => {
  const sim = simulateBinarySearch([1, 3, 5, 7, 9, 11, 13, 15], 9);
  assert.equal(sim.algorithmType, "binary_search");
  assert.ok(sim.totalSteps >= 3, `Expected >= 3 steps, got ${sim.totalSteps}`);
  assert.ok(sim.codeSnippet.includes("def binary_search"));

  for (let i = 0; i < sim.frames.length; i++) {
    const frame = sim.frames[i];
    assert.equal(frame.stepIndex, i);
    assert.ok(frame.codeLineNumber > 0, `Frame ${i} has invalid codeLineNumber`);
    assert.ok(frame.spokenNarration && frame.spokenNarration.length > 10, `Frame ${i} missing spokenNarration`);
    assert.ok(frame.spokenNarrationHinglish && frame.spokenNarrationHinglish.length > 10, `Frame ${i} missing spokenNarrationHinglish`);
    assert.equal(frame.structureType, "array");
    assert.ok(frame.array && frame.array.length === 8);
    assert.ok(frame.stateVariables && Object.keys(frame.stateVariables).length > 0);
  }

  // Final frame must confirm found
  const last = sim.frames[sim.frames.length - 1];
  assert.equal(last.actionType, "found");
});

test("Visual Dry-Run: Kadane's algorithm tracks curr_sum and max_sum mutations", () => {
  const sim = simulateKadane([-2, 1, -3, 4, -1, 2, 1, -5, 4]);
  assert.equal(sim.algorithmType, "kadane");
  assert.equal(sim.totalSteps, 10);

  const initFrame = sim.frames[0];
  assert.equal(initFrame.actionType, "init");
  assert.equal(initFrame.stateVariables["curr_sum"], -2);
  assert.equal(initFrame.stateVariables["max_sum"], -2);

  const finalFrame = sim.frames[sim.frames.length - 1];
  assert.equal(finalFrame.stateVariables["maxSubarraySum"], 6);
});

test("Visual Dry-Run: Linked List Reversal correctly models node pointer redirects", () => {
  const sim = simulateLinkedListReversal();
  assert.equal(sim.algorithmType, "linked_list");
  assert.ok(sim.totalSteps >= 5);

  for (const frame of sim.frames) {
    assert.equal(frame.structureType, "linked_list");
    assert.ok(frame.linkedList && frame.linkedList.length > 0);
    assert.ok(frame.spokenNarration.length > 0);
  }
});

test("Visual Dry-Run: Valid Parentheses Stack demonstrates LIFO push/pop mechanics", () => {
  const sim = simulateValidParentheses("{[()]}");
  assert.equal(sim.algorithmType, "stack_queue");
  assert.ok(sim.totalSteps >= 7);

  const pushFrames = sim.frames.filter(f => f.actionType === "push");
  const popFrames = sim.frames.filter(f => f.actionType === "pop");
  assert.equal(pushFrames.length, 3, "Expected 3 push actions for '{[('");
  assert.equal(popFrames.length, 3, "Expected 3 pop actions for ')]}'");
});

test("Visual Dry-Run: Climbing Stairs generates 2D DP memoization grid with formula highlights", () => {
  const sim = simulateClimbingStairs(4);
  assert.equal(sim.algorithmType, "dynamic_programming");
  assert.ok(sim.totalSteps >= 3);

  const lastFrame = sim.frames[sim.frames.length - 1];
  assert.equal(lastFrame.structureType, "dp_table");
  assert.ok(lastFrame.dpTable);
  assert.equal(lastFrame.stateVariables["dp[4]"], 5);
});

test("Visual Dry-Run: Dispatcher routes problem IDs to corresponding simulation models", () => {
  const bSearch = generateDryRunSimulation("search-in-rotated-sorted-array");
  assert.equal(bSearch.algorithmType, "binary_search");

  const kadane = generateDryRunSimulation("maximum-subarray-sum-kadane-s-algorithm");
  assert.equal(kadane.algorithmType, "kadane");

  const list = generateDryRunSimulation("reverse-a-linked-list");
  assert.equal(list.algorithmType, "linked_list");

  const parens = generateDryRunSimulation("valid-parentheses");
  assert.equal(parens.algorithmType, "stack_queue");

  const dp = generateDryRunSimulation("climbing-stairs");
  assert.equal(dp.algorithmType, "dynamic_programming");
});
