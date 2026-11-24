/**
 * COGNALYZE DSA LEARN — AUTOMATED TEST SUITE: PHASE 8
 * Verifies UI/UX Workspace Integration & Navigation Hub
 */

import test from "node:test";
import assert from "node:assert/strict";

test("Phase 8 — UI/UX Workspace Integration & Navigation Hub", async (t) => {

  await t.test("1. ConceptMasteryHub component imports and exports cleanly", async () => {
    const hub = await import("../components/skills/learn/ConceptMasteryHub");
    assert.ok(hub.default, "ConceptMasteryHub must export default component");
  });

  await t.test("2. Verifies 17-step curriculum steps and coverage stats are available for navigation", async () => {
    const { getAllCurriculumSteps, getCurriculumCoverageStats } = await import(
      "../lib/skills/learn/curriculum-registry"
    );
    const steps = getAllCurriculumSteps();
    assert.equal(steps.length, 17, "Must contain all 17 canonical steps");
    
    const stats = getCurriculumCoverageStats();
    assert.equal(stats.totalSteps, 17);
    assert.equal(stats.totalSubtopics, 39);
    assert.equal(stats.totalMicroConcepts, 59);
  });

  await t.test("3. Kadane's algorithm module is bound to step-3 and mc-3-2-1-1", async () => {
    const { getLearningModuleByMicroConceptId } = await import(
      "../lib/skills/learn/module-registry"
    );
    const mod = getLearningModuleByMicroConceptId("mc-3-2-1-1");
    assert.ok(mod, "Kadane module must be registered for mc-3-2-1-1");
    assert.equal(mod?.stepId, "step-3");
    assert.equal(mod?.subtopicId, "sub-3-2-1");
  });

  await t.test("4. DSA Arena page component imports and compiles cleanly", async () => {
    const page = await import("../app/student/skills/dsa/page");
    assert.ok(page.default, "DSA Arena page must export default component");
  });
});
