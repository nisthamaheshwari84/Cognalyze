/**
 * COGNALYZE DSA LEARN — AUTOMATED TEST SUITE: PHASE 4
 * Comprehensive verification of the Pilot Teaching Module: Kadane's Algorithm
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  KADANE_ALGORITHM_MODULE
} from "../lib/skills/learn/modules/kadane-algorithm";
import {
  getLearningModuleById,
  getLearningModuleByMicroConceptId,
  validateAllRegisteredModules
} from "../lib/skills/learn/module-registry";
import { validateLearningModule } from "../lib/skills/learn/content-validator";

test("Phase 4 — Pilot Teaching Module (Kadane's Algorithm)", async (t) => {

  await t.test("1. Registry accessors retrieve module by moduleId and microConceptId", () => {
    const byId = getLearningModuleById("mod-kadane-algorithm");
    assert.ok(byId, "Module must be retrievable by ID");
    assert.equal(byId?.moduleId, "mod-kadane-algorithm");

    const byMc = getLearningModuleByMicroConceptId("mc-3-2-1-1");
    assert.ok(byMc, "Module must be retrievable by microConceptId");
    assert.equal(byMc?.moduleId, "mod-kadane-algorithm");
    assert.equal(byMc?.stepId, "step-3");
    assert.equal(byMc?.subtopicId, "sub-3-2-1");
  });

  await t.test("2. Passes all 9 validation passes of Content Validator with 0 errors", () => {
    const report = validateLearningModule(KADANE_ALGORITHM_MODULE);

    assert.equal(report.overallPassed, true, "Master validator must report overallPassed: true");
    assert.equal(report.passedCount, 9, "All 9 passes must pass");
    assert.equal(report.canPublish, true, "canPublish must be true");

    report.passResults.forEach(p => {
      assert.equal(
        p.passed,
        true,
        `Pass ${p.passNumber}: ${p.passName} failed with errors: ${p.errors.join("; ")}`
      );
      assert.equal(p.errors.length, 0, `Pass ${p.passNumber} must have 0 errors`);
    });
  });

  await t.test("3. validateAllRegisteredModules validates all registered modules", () => {
    const allReports = validateAllRegisteredModules();
    assert.ok(allReports["mod-kadane-algorithm"]);
    assert.equal(allReports["mod-kadane-algorithm"].overallPassed, true);
    assert.equal(allReports["mod-kadane-algorithm"].canPublish, true);
  });

  await t.test("4. Layer 1 (Why It Exists): Details historical genesis, cubic and quadratic failures", () => {
    const l1 = KADANE_ALGORITHM_MODULE.layer1WhyExists;
    assert.ok(l1.historicalGenesis.en.includes("Ulf Grenander"));
    assert.ok(l1.historicalGenesis.hinglish.includes("Ulf Grenander"));
    assert.equal(l1.naiveApproaches.length, 2);
    assert.equal(l1.naiveApproaches[0].timeComplexity, "O(N^3)");
    assert.equal(l1.naiveApproaches[1].timeComplexity, "O(N^2)");
    assert.ok(l1.breakthroughInsight.en.includes("A negative running sum is an absolute liability"));
    assert.ok(l1.complexityComparisonTable.length >= 3);
  });

  await t.test("5. Layer 2 (Intuition & Metaphor): Contains debt franchise analogy and bilingual prose", () => {
    const l2 = KADANE_ALGORITHM_MODULE.layer2Intuition;
    assert.ok(l2.primaryAnalogy.metaphorTitle.en.includes("Carrying Debt vs Bankruptcy Reset"));
    assert.ok(l2.primaryAnalogy.mappingToAlgorithmicElements.length >= 3);
    assert.ok(l2.mentalVisualPrompt.hinglish.includes("balloon"));
  });

  await t.test("6. Layer 3 (Invariants & Induction): Contains LaTeX formulas and formal induction basis", () => {
    const l3 = KADANE_ALGORITHM_MODULE.layer3Invariants;
    assert.equal(l3.loopInvariants.length, 2);
    assert.ok(l3.loopInvariants[0].formalStatement.includes("\\text{currSum}"));
    assert.ok(l3.loopInvariants[1].formalStatement.includes("\\text{maxSum}"));
    assert.ok(l3.inductiveProofBasis.en.includes("Base Case (i = 0)"));
  });

  await t.test("7. Layer 4 (Visual Dry-Run): Contains canonical 8-frame simulation and all-negative edge case", () => {
    const l4 = KADANE_ALGORITHM_MODULE.layer4VisualDryRun;
    assert.equal(l4.stepByStepFrames.length, 8, "Must contain exactly 8 canonical frames covering the 9-element array");
    
    // Check peak frame
    const peakFrame = l4.stepByStepFrames[6];
    assert.equal(peakFrame.variables.find(v => v.name === "maxSum")?.value, 6, "Peak maxSum must be 6");
    assert.ok(peakFrame.calloutAlert?.message.en.includes("Global maximum 6 reached"));

    // Check edge case dataset
    assert.ok(l4.edgeCaseDataset, "Must provide all-negative edge case dataset");
    assert.equal(l4.edgeCaseDataset?.stepByStepFrames.length, 3);
    const lastEdgeFrame = l4.edgeCaseDataset?.stepByStepFrames[2];
    assert.equal(lastEdgeFrame?.variables.find(v => v.name === "maxSum")?.value, -1);
  });

  await t.test("8. Layer 5 (Socratic Derivation): Contains 2 guided steps with 3-tier hints", () => {
    const l5 = KADANE_ALGORITHM_MODULE.layer5SocraticDerivation;
    assert.equal(l5.guidedSteps.length, 2);
    l5.guidedSteps.forEach(step => {
      assert.ok(step.hintProgression.level1GentleNudge.en.length > 5);
      assert.ok(step.hintProgression.level2StructuralHint.en.length > 5);
      assert.ok(step.hintProgression.level3BreakthroughReveal.en.length > 5);
      assert.equal(step.thoughtOptions.filter(o => o.isOptimalThought).length, 1);
    });
  });

  await t.test("9. Layer 6 (Complexity Derivation): Proves O(N) and O(1) space lower bound", () => {
    const l6 = KADANE_ALGORITHM_MODULE.layer6Complexity;
    assert.equal(l6.timeComplexity.worstCase.notation, "O(N)");
    assert.equal(l6.spaceComplexity.auxiliarySpace.notation, "O(1)");
    assert.ok(l6.spaceComplexity.whyLessSpaceIsImpossible.en.includes("information-theoretic lower bound"));
    assert.ok(l6.scalingBehaviorGraphSummary.length >= 3);
  });

  await t.test("10. Layer 7 (Pitfalls & Traps): Direct linkage to fear point fp-3-2-1-2", () => {
    const l7 = KADANE_ALGORITHM_MODULE.layer7CommonPitfalls;
    assert.equal(l7.mistakeTraps.length, 2);
    const fpTrap = l7.mistakeTraps.find(t => t.fearPointRefId === "fp-3-2-1-2");
    assert.ok(fpTrap, "Must link to fp-3-2-1-2");
    assert.ok(fpTrap?.buggyCodeSnippet.includes("int maxSum = 0;"));
    assert.ok(fpTrap?.correctCodeSnippet.includes("long long maxSum = nums[0];"));
  });

  await t.test("11. Layer 8 (Pattern Recognition): Distinguishes subarray from subsequence and product", () => {
    const l8 = KADANE_ALGORITHM_MODULE.layer8PatternTriggers;
    assert.ok(l8.primaryTriggers.length >= 2);
    assert.equal(l8.counterSignals.length, 2);
    assert.ok(l8.counterSignals.some(c => c.misleadingClue.en.includes("subsequence")));
    assert.ok(l8.counterSignals.some(c => c.misleadingClue.en.includes("product")));
  });

  await t.test("12. Layer 9 (Rubric): 4 essential ideas summing to 100%, 3 diagnostic questions", () => {
    const l9 = KADANE_ALGORITHM_MODULE.layer9VerificationRubric;
    assert.equal(l9.essentialCoreIdeas.length, 4);
    const totalWeight = l9.essentialCoreIdeas.reduce((sum, idea) => sum + idea.weightPercentage, 0);
    assert.equal(totalWeight, 100, "Weights must sum to 100%");
    assert.equal(l9.diagnosticQuestions.length, 3);
    assert.ok(l9.misconceptionDetectors.length >= 2);
  });

  await t.test("13. Layer 10 (Bridge to Practice): Links to LeetCode 53, 918, and DSA 455", () => {
    const l10 = KADANE_ALGORITHM_MODULE.layer10BridgeToPractice;
    assert.equal(l10.canonicalPracticeProblems.length, 3);
    assert.ok(l10.canonicalPracticeProblems.some(p => p.problemId === "dsa-step3-max-subarray"));
    assert.ok(l10.canonicalPracticeProblems.some(p => p.problemId === "dsa-step3-max-circular-subarray"));
  });

  await t.test("14. C++20 Annotated Code Snippet: Validated with 4 line annotations", () => {
    const snippets = KADANE_ALGORITHM_MODULE.annotatedCodeSnippets;
    assert.equal(snippets.length, 1);
    const cpp = snippets[0];
    assert.equal(cpp.language, "cpp");
    assert.equal(cpp.compilationMetadata.isVerifiedCompilable, true);
    assert.equal(cpp.lineAnnotations.length, 4);
    assert.ok(cpp.fullSourceCode.includes("maxSubarraySum"));
  });
});
