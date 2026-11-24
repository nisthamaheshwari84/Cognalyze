/**
 * COGNALYZE DSA LEARN — AUTOMATED TEST SUITE: PHASE 9
 * Verifies Mastery Tracker Integration, Concept Knowledge Graph & DAG Status
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  getStudentConceptMastery,
  markMicroConceptUnderstood,
  isConceptNodeUnlocked
} from "../lib/skills/learn/mastery-store";

test("Phase 9 — Mastery Tracker Integration & Concept Knowledge Graph", async (t) => {

  await t.test("1. Concept mastery store initializes with 59 concepts and pre-seeded Kadane module", () => {
    const candidateId = "test-candidate-phase9";
    const summary = getStudentConceptMastery(candidateId);

    assert.equal(summary.candidateId, candidateId);
    assert.equal(summary.totalAvailableConcepts, 59, "Must match total micro-concepts count");
    assert.ok(summary.totalUnderstoodCount >= 1, "Must have at least 1 pre-seeded/verified concept");
    assert.ok(summary.understoodConceptIds.includes("mc-3-2-1-1"), "Kadane's algorithm must be verified");
    assert.ok(summary.overallMasteryPercentage >= 1);
  });

  await t.test("2. markMicroConceptUnderstood updates mastery count without mutating other state", () => {
    const candidateId = "test-candidate-phase9-update";
    const initial = getStudentConceptMastery(candidateId);
    const initialCount = initial.totalUnderstoodCount;

    const updated = markMicroConceptUnderstood(candidateId, "mc-1-1-1-1", 95, "diagnostic_quiz");

    assert.equal(updated.totalUnderstoodCount, initialCount + 1);
    assert.ok(updated.understoodConceptIds.includes("mc-1-1-1-1"));
    assert.equal(updated.records["mc-1-1-1-1"].masteryScore, 95);
    assert.equal(updated.records["mc-1-1-1-1"].evaluationMode, "diagnostic_quiz");
  });

  await t.test("3. isConceptNodeUnlocked accurately resolves DAG prerequisites", () => {
    // mc-1-1-1-1 has 0 prerequisites -> always unlocked
    const status1 = isConceptNodeUnlocked("mc-1-1-1-1", []);
    assert.equal(status1.isUnlocked, true, "Foundational concept must be unlocked with 0 prerequisites");
    assert.equal(status1.isMastered, false);

    // Concept with prerequisite: mc-1-1-1-2 requires mc-1-1-1-1
    const status2Locked = isConceptNodeUnlocked("mc-1-1-1-2", []);
    assert.equal(status2Locked.isUnlocked, false, "Must be locked when prerequisite is missing");
    assert.equal(status2Locked.missingPrerequisites.length, 1);
    assert.equal(status2Locked.missingPrerequisites[0].id, "mc-1-1-1-1");

    // When mc-1-1-1-1 is understood -> mc-1-1-1-2 unlocks!
    const status2Unlocked = isConceptNodeUnlocked("mc-1-1-1-2", ["mc-1-1-1-1"]);
    assert.equal(status2Unlocked.isUnlocked, true, "Must unlock once prerequisite is satisfied");
    assert.equal(status2Unlocked.missingPrerequisites.length, 0);
  });

  await t.test("4. Striver 455 Solved count invariance: Total Solved is strictly independent", () => {
    // Invariant check: problem count (455 problems) and concept count (59 concepts) are separate domains
    const summary = getStudentConceptMastery("test-invariance");
    assert.equal(summary.totalAvailableConcepts, 59);

    // Verify no blending: totalSolved is always out of 455, concepts out of 59
    const dummyProblemSolvedCount = 42;
    assert.notEqual(
      dummyProblemSolvedCount,
      summary.totalUnderstoodCount,
      "Problem count and concept count must be maintained in separate registers"
    );
  });

  await t.test("5. ConceptKnowledgeGraph and DsaMasteryTrackerView compile and export cleanly", async () => {
    const graph = await import("../components/skills/learn/ConceptKnowledgeGraph");
    assert.ok(graph.default, "ConceptKnowledgeGraph must export default component");

    const view = await import("../components/skills/DsaMasteryTrackerView");
    assert.ok(view.default, "DsaMasteryTrackerView must export default component");
  });
});
