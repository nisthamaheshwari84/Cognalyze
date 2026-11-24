/**
 * COGNALYZE DSA LEARN — AUTOMATED TEST SUITE: PHASE 7
 * Verifies Adaptive Misconception Detection & Prerequisite Remediation Graph
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  diagnosePrerequisiteBreakdown,
  getRemediationCardById,
  getAllRemediationCardsForMicroConcept,
  REMEDIATION_CARDS_REGISTRY
} from "../lib/skills/learn/remediation-graph";

test("Phase 7 — Adaptive Misconception Detection & Remediation Graph", async (t) => {

  await t.test("1. Maps all-negative misconception to signed integer root cause (mc-1-1-1-3)", () => {
    const diag = diagnosePrerequisiteBreakdown(
      "mc-3-2-1-1",
      [],
      ["det-all-negative-zero-bug"]
    );

    assert.equal(diag.hasBreakdown, true);
    assert.equal(diag.diagnosedRootCauses.length, 1);
    const root = diag.diagnosedRootCauses[0];
    assert.equal(root.category, "integer_arithmetic_overflow");
    assert.equal(root.rootCauseMicroConceptId, "mc-1-1-1-3");
    assert.equal(root.remediationCard.id, "rem-signed-integers");
    assert.ok(root.remediationCard.explanation.en.includes("additive identity"));
    assert.ok(root.remediationCard.visualAnalogy.hinglish.includes("Antarctica"));
  });

  await t.test("2. Maps loop accumulator confusion to loop execution model (mc-1-1-3-1)", () => {
    const diag = diagnosePrerequisiteBreakdown(
      "mc-3-2-1-1",
      [],
      ["det-reset-on-negative-element"]
    );

    assert.equal(diag.hasBreakdown, true);
    assert.equal(diag.diagnosedRootCauses.length, 1);
    const root = diag.diagnosedRootCauses[0];
    assert.equal(root.category, "loop_invariant_breakdown");
    assert.equal(root.rootCauseMicroConceptId, "mc-1-1-3-1");
    assert.equal(root.remediationCard.id, "rem-loop-invariants");
  });

  await t.test("3. Maps contiguous prefix confusion to contiguous memory layout (mc-1-1-3-2)", () => {
    const diag = diagnosePrerequisiteBreakdown(
      "mc-3-2-1-1",
      ["idea-negative-prefix-liability"]
    );

    assert.equal(diag.hasBreakdown, true);
    const root = diag.diagnosedRootCauses.find((d) => d.remediationCard.id === "rem-contiguous-memory");
    assert.ok(root, "Must diagnose contiguous memory breakdown");
    assert.equal(root?.rootCauseMicroConceptId, "mc-1-1-3-2");
  });

  await t.test("4. Returns clean status when no diagnostic failures or misconceptions exist", () => {
    const diag = diagnosePrerequisiteBreakdown("mc-3-2-1-1", [], []);
    assert.equal(diag.hasBreakdown, false);
    assert.equal(diag.diagnosedRootCauses.length, 0);
    assert.ok(diag.recommendedImmediateAction.en.includes("solid"));
  });

  await t.test("5. Every remediation card in registry has valid bilingual content and single correct option", () => {
    const cards = Object.values(REMEDIATION_CARDS_REGISTRY);
    assert.ok(cards.length >= 3);

    cards.forEach((c) => {
      assert.ok(c.title.en.length > 5);
      assert.ok(c.title.hinglish.length > 5);
      assert.ok(c.explanation.en.length > 20);
      assert.ok(c.explanation.hinglish.length > 20);
      assert.ok(c.visualAnalogy.en.length > 20);
      assert.ok(c.visualAnalogy.hinglish.length > 20);
      assert.ok(c.bridgeBackText.en.length > 20);
      assert.ok(c.bridgeBackText.hinglish.length > 20);

      const opts = c.quickCheckQuestion.options;
      assert.ok(opts.length >= 2, `Card ${c.id} options must be >= 2`);
      const correct = opts.filter((o) => o.isCorrect);
      assert.equal(correct.length, 1, `Card ${c.id} must have exactly 1 correct answer`);
    });
  });

  await t.test("6. getAllRemediationCardsForMicroConcept returns all 3 cards for Kadane", () => {
    const cards = getAllRemediationCardsForMicroConcept("mc-3-2-1-1");
    assert.equal(cards.length, 3);
  });

  await t.test("7. MicroRemediationModal UI component compiles cleanly", async () => {
    const modal = await import("../components/skills/learn/MicroRemediationModal");
    assert.ok(modal.default, "MicroRemediationModal must export default component");
  });
});
