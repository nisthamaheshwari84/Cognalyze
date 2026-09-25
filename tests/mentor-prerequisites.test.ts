import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkPrerequisites,
  formatPrerequisiteSteppingMessage,
  PREREQUISITE_REGISTRY
} from "../lib/mentor/prerequisite-graph";
import { processMentorTurn } from "../lib/mentor/engine";
import { getOrCreateLearningTwin } from "../lib/mentor/store";

describe("Cognalyze Mentor — Prerequisite Knowledge Graph & Graceful Stepping", () => {
  it("REGISTRY ENFORCES CONCEPT DEPENDENCY HIERARCHY", () => {
    // Recursion hierarchy
    assert.deepStrictEqual(PREREQUISITE_REGISTRY["recursion"].prerequisites, ["call_stack"]);
    assert.ok(PREREQUISITE_REGISTRY["backtracking"].prerequisites.includes("recursion"));
    assert.ok(PREREQUISITE_REGISTRY["dfs"].prerequisites.includes("backtracking"));

    // Binary search hierarchy
    assert.deepStrictEqual(PREREQUISITE_REGISTRY["binary_search"].prerequisites, ["sorted_arrays"]);
    assert.ok(PREREQUISITE_REGISTRY["rotated_sorted_array"].prerequisites.includes("binary_search"));

    // Distributed systems hierarchy
    assert.deepStrictEqual(PREREQUISITE_REGISTRY["load_balancing"].prerequisites, ["stateless_api"]);
    assert.deepStrictEqual(PREREQUISITE_REGISTRY["sharding"].prerequisites, ["read_replicas"]);
  });

  it("DETECTS MISSING PREREQUISITES: Backtracking missing call stack fundamentals", () => {
    const check = checkPrerequisites(
      "backtracking",
      ["loops", "functions"], // has NOT demonstrated recursion or call_stack
      ["stuck on return value"]
    );

    assert.strictEqual(check.hasMissingPrerequisite, true);
    assert.strictEqual(check.suggestedAction, "REVISIT_PREREQUISITE");
    assert.ok(check.missingPrerequisiteId === "recursion" || check.missingPrerequisiteId === "call_stack");
  });

  it("FORMATS NATURAL PREREQUISITE STEPPING: Informs student without restarting curriculum", () => {
    const hinglishMsg = formatPrerequisiteSteppingMessage("Call Stack", "Backtracking", "hinglish");
    assert.ok(hinglishMsg.includes("Ek second rukte hain"));
    assert.ok(hinglishMsg.includes("Call Stack"));
    assert.ok(hinglishMsg.includes("Backtracking"));

    const englishMsg = formatPrerequisiteSteppingMessage("Call Stack", "Backtracking", "en");
    assert.ok(englishMsg.includes("Before we continue"));
    assert.ok(englishMsg.includes("one level below this"));
  });

  it("INTEGRATED ENGINE TURN: Missing prerequisite triggers graceful repair turn", async () => {
    const twin = getOrCreateLearningTwin("prereq-student", { preferredLanguage: "en" });
    const result = await processMentorTurn(
      [],
      twin,
      "I'm totally lost with backtracking. The return value makes no sense."
    );

    assert.ok(result.spokenResponse !== undefined);
    assert.ok(result.teachingAction !== undefined);
    assert.ok(result.sessionLearningState !== undefined);
  });
});
