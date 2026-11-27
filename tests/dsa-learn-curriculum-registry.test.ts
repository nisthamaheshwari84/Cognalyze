import { describe, it } from "node:test";
import assert from "node:assert";
import {
  FULL_CURRICULUM_STEPS,
  getAllCurriculumSteps,
  getCurriculumStepById,
  getCurriculumSubtopicById,
  getCurriculumCoverageStats
} from "../lib/skills/learn/curriculum-registry";
import {
  getAllFearPoints,
  getFearPointById,
  getFearPointsBySubtopic
} from "../lib/skills/learn/fear-points-registry";
import {
  buildPrerequisiteGraph,
  validateDAG,
  isPrerequisiteSatisfied,
  getMissingPrerequisites
} from "../lib/skills/learn/prerequisite-graph";

describe("Phase 2 — DSA Learn Master Curriculum & Micro-Concept Registry", () => {
  it("1. Preserves all 17 canonical curriculum steps with correct ordering and metadata", () => {
    const steps = getAllCurriculumSteps();
    assert.strictEqual(steps.length, 17, "Must contain exactly 17 canonical steps");

    const expectedTitles = [
      "Step 1: Learn the basics",
      "Step 2: Learn Important Sorting Techniques",
      "Step 3: Solve Problems on Arrays",
      "Step 4: Binary Search",
      "Step 5: Strings (Basic and Medium)",
      "Step 6: Learn LinkedList",
      "Step 7: Recursion & Backtracking",
      "Step 8: Bit Manipulation",
      "Step 9: Stack and Queues",
      "Step 10: Sliding Window & Two Pointer",
      "Step 11: Heaps",
      "Step 12: Greedy Algorithms",
      "Step 13: Binary Trees",
      "Step 14: Binary Search Trees",
      "Step 15: Graphs",
      "Step 16: Dynamic Programming",
      "Step 17: Tries"
    ];

    steps.forEach((step, index) => {
      assert.strictEqual(step.stepNumber, index + 1);
      assert.strictEqual(step.id, `step-${index + 1}`);
      assert.strictEqual(step.title, expectedTitles[index]);
      assert.ok(step.description && step.description.length > 10);
      assert.ok(step.topics.length > 0, `Step ${step.stepNumber} must have topics`);
    });
  });

  it("2. Verifies complete multi-level hierarchy: Step -> Topic -> Subtopic -> Micro-concept", () => {
    let totalSubtopics = 0;
    let totalMicroConcepts = 0;

    for (const step of FULL_CURRICULUM_STEPS) {
      for (const topic of step.topics) {
        assert.ok(topic.id.startsWith("topic-"), `Invalid topic ID: ${topic.id}`);
        assert.strictEqual(topic.stepId, step.id);
        assert.ok(topic.subtopics.length > 0, `Topic ${topic.id} must have subtopics`);

        for (const sub of topic.subtopics) {
          totalSubtopics++;
          assert.ok(sub.id.startsWith("sub-"), `Invalid subtopic ID: ${sub.id}`);
          assert.strictEqual(sub.topicId, topic.id);
          assert.strictEqual(sub.stepId, step.id);
          assert.ok(sub.microConcepts.length > 0, `Subtopic ${sub.id} must contain micro-concepts`);

          for (const mc of sub.microConcepts) {
            totalMicroConcepts++;
            assert.ok(mc.id.startsWith("mc-"), `Invalid micro-concept ID: ${mc.id}`);
            assert.strictEqual(mc.subtopicId, sub.id);
            assert.ok(mc.learningObjectives.length > 0, `Micro-concept ${mc.id} must have learning objectives`);
          }
        }
      }
    }

    assert.ok(totalSubtopics >= 17, "Must contain at least 17 subtopics across 17 steps");
    assert.ok(totalMicroConcepts >= 30, "Must contain at least 30 granular micro-concepts");
  });

  it("3. Verifies syllabus union mappings (A2Z Syllabus + Love Babbar)", () => {
    const sub1 = getCurriculumSubtopicById("sub-1-1-1");
    assert.ok(sub1);
    assert.ok(sub1.a2zSheetMapping, "Must map to A2Z DSA sheet");
    assert.ok(sub1.loveBabbarSheetMapping, "Must map to Love Babbar sheet");

    const subKadane = getCurriculumSubtopicById("sub-3-2-1");
    assert.ok(subKadane);
    assert.strictEqual(subKadane.title, "Kadane's Algorithm for Maximum Subarray Sum");
    assert.ok(subKadane.a2zSheetMapping?.includes("Kadane"));
    assert.ok(subKadane.loveBabbarSheetMapping?.includes("Kadane"));
  });

  it("4. Validates Fear-Points & Misconception Registry integrity", () => {
    const fearPoints = getAllFearPoints();
    assert.ok(fearPoints.length >= 20, "Must contain at least 20 detailed fear points");

    for (const fp of fearPoints) {
      assert.ok(fp.fearPointId.startsWith("fp-"));
      assert.ok(fp.subtopicId.startsWith("sub-"));
      assert.ok(fp.microConceptId.startsWith("mc-"));
      assert.ok(fp.difficultyReason.length > 15);
      assert.ok(fp.commonWrongAssumption.length > 15);
      assert.ok(fp.correctExplanation.length > 20);
      assert.ok(fp.recommendedVisual.length > 5);
      assert.ok(fp.verificationQuestionIds.length > 0);

      // Verify that referenced subtopic exists in curriculum
      const sub = getCurriculumSubtopicById(fp.subtopicId);
      assert.ok(sub, `Fear point ${fp.fearPointId} references non-existent subtopic ${fp.subtopicId}`);
    }
  });

  it("5. Mathematical validation of Prerequisite Dependency Graph (Strict DAG, Zero Cycles)", () => {
    const graph = buildPrerequisiteGraph();
    assert.ok(graph.nodes.size > 0);

    const { isValidDAG, cycleNodeIds } = validateDAG(graph);
    assert.strictEqual(isValidDAG, true, `Prerequisite graph must be a strict DAG with 0 cycles. Cycling nodes: ${cycleNodeIds.join(", ")}`);
    assert.strictEqual(cycleNodeIds.length, 0);
  });

  it("6. Gating & Prerequisite Enforcement Logic", () => {
    const completedSet = new Set<string>();

    // Step 1 has no prerequisite steps -> should be satisfied
    const step1Satisfied = isPrerequisiteSatisfied("step-1", completedSet);
    assert.strictEqual(step1Satisfied, true, "Step 1 has no prerequisites and should be unlocked");

    // Step 2 requires Step 1 -> should NOT be satisfied when completedSet is empty
    const step2Satisfied = isPrerequisiteSatisfied("step-2", completedSet);
    assert.strictEqual(step2Satisfied, false, "Step 2 requires Step 1 and must be locked initially");

    const missingForStep2 = getMissingPrerequisites("step-2", completedSet);
    assert.strictEqual(missingForStep2.length, 1);
    assert.strictEqual(missingForStep2[0].id, "step-1");

    // When Step 1 is completed -> Step 2 should unlock
    completedSet.add("step-1");
    const step2Unlocked = isPrerequisiteSatisfied("step-2", completedSet);
    assert.strictEqual(step2Unlocked, true, "Step 2 should unlock once Step 1 is completed");
  });

  it("7. Coverage statistics generation", () => {
    const stats = getCurriculumCoverageStats();
    assert.strictEqual(stats.totalSteps, 17);
    assert.ok(stats.totalTopics >= 17);
    assert.ok(stats.totalSubtopics >= 17);
    assert.ok(stats.totalMicroConcepts >= 30);
    assert.strictEqual(stats.stepBreakdown.length, 17);
  });
});
