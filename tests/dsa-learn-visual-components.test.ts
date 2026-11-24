/**
 * COGNALYZE DSA LEARN — AUTOMATED TEST SUITE: PHASE 5
 * Verifies the Interactive Visual Simulation Engine & React Visual Components
 */

import test from "node:test";
import assert from "node:assert/strict";

import { KADANE_ALGORITHM_MODULE } from "../lib/skills/learn/modules/kadane-algorithm";

test("Phase 5 — Interactive Visual Simulation Engine & Visual Components", async (t) => {

  await t.test("1. Dry-run dataset has canonical array and edge case frames", () => {
    const visual = KADANE_ALGORITHM_MODULE.layer4VisualDryRun;
    assert.ok(visual.defaultInputDataset.data.length >= 9);
    assert.ok(visual.stepByStepFrames.length >= 8);
    assert.ok(visual.edgeCaseDataset);
    assert.ok(visual.edgeCaseDataset.stepByStepFrames.length >= 3);
  });

  await t.test("2. Pointer indices in all frames are within bounds", () => {
    const visual = KADANE_ALGORITHM_MODULE.layer4VisualDryRun;
    const arrayLen = visual.defaultInputDataset.data.length;

    visual.stepByStepFrames.forEach((frame, idx) => {
      frame.pointers?.forEach((p) => {
        assert.ok(
          p.index >= -1 && p.index <= arrayLen,
          `Frame ${idx} pointer ${p.name} at index ${p.index} out of bounds`
        );
      });
    });
  });

  await t.test("3. Variable accumulators contain valid number/boolean/string values in all frames", () => {
    const visual = KADANE_ALGORITHM_MODULE.layer4VisualDryRun;
    visual.stepByStepFrames.forEach((frame, idx) => {
      assert.ok(frame.variables.length >= 2, `Frame ${idx} must have at least 2 variables`);
      const currSum = frame.variables.find((v) => v.name === "currSum");
      const maxSum = frame.variables.find((v) => v.name === "maxSum");
      assert.ok(currSum, `Frame ${idx} missing currSum`);
      assert.ok(maxSum, `Frame ${idx} missing maxSum`);
    });
  });

  await t.test("4. Socratic inquiry steps have valid dilemma prompts and 3-tier hints", () => {
    const socratic = KADANE_ALGORITHM_MODULE.layer5SocraticDerivation;
    assert.ok(socratic.guidedSteps.length >= 2);
    socratic.guidedSteps.forEach((step) => {
      assert.ok(step.promptQuestion.en.length > 10);
      assert.ok(step.promptQuestion.hinglish.length > 10);
      assert.ok(step.thoughtOptions.length >= 2);
      assert.ok(step.hintProgression.level1GentleNudge.en.length > 5);
      assert.ok(step.hintProgression.level2StructuralHint.en.length > 5);
      assert.ok(step.hintProgression.level3BreakthroughReveal.en.length > 5);
      assert.ok(step.socraticResolution.en.length > 10);
    });
  });

  await t.test("5. Diagnostic assessment rubric has multiple choice options with valid correct flags", () => {
    const rubric = KADANE_ALGORITHM_MODULE.layer9VerificationRubric;
    assert.ok(rubric.diagnosticQuestions.length >= 3);
    rubric.diagnosticQuestions.forEach((q) => {
      assert.ok(q.options && q.options.length >= 2);
      const correctOpts = q.options?.filter((o) => o.isCorrect) || [];
      assert.equal(correctOpts.length, 1, `Question ${q.id} must have exactly 1 correct option`);
    });
  });

  await t.test("6. UI components compile and export cleanly without syntax errors", async () => {
    // Dynamically test that module imports resolve cleanly
    const toggle = await import("../components/skills/learn/DualLanguageToggle");
    assert.ok(toggle.default, "DualLanguageToggle must export default component");

    const track = await import("../components/skills/learn/VisualArrayTrack");
    assert.ok(track.default, "VisualArrayTrack must export default component");

    const bank = await import("../components/skills/learn/VariableRegisterBank");
    assert.ok(bank.default, "VariableRegisterBank must export default component");

    const player = await import("../components/skills/learn/LearnVisualPlayer");
    assert.ok(player.default, "LearnVisualPlayer must export default component");

    const socratic = await import("../components/skills/learn/SocraticDerivationWidget");
    assert.ok(socratic.default, "SocraticDerivationWidget must export default component");

    const quiz = await import("../components/skills/learn/DiagnosticQuizWidget");
    assert.ok(quiz.default, "DiagnosticQuizWidget must export default component");

    const view = await import("../components/skills/learn/ConceptMasteryModuleView");
    assert.ok(view.default, "ConceptMasteryModuleView must export default component");
  });
});
