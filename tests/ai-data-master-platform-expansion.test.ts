/**
 * tests/ai-data-master-platform-expansion.test.ts
 * 
 * Master Test Suite for Cognalyze AI & Data Arena Platform Expansion:
 * 1. Personalized Roadmap Engine (8 roles, 4 commitments, prerequisite DAG, company benchmarks)
 * 2. Interactive Visual Diagram Studio (CPython AST & Bytecode, Memory Pointers, NumPy Broadcasting, SQL Joins, Gradient Descent, RAG Flow)
 * 3. Conversational Socratic AI Teacher (analogy, diagnostic questioning, bilingual adaptation)
 * 4. Curated Coding Question Library (570 authentic questions across 14 subjects)
 * 5. Intelligent Notes & Personal Knowledge System (Type A Canonical Notes + Type B Personal Weakness Notes)
 * 6. Non-Negotiable Invariants: DSA Exclusion & Python Arena Consolidation
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStudentPersonalizedRoadmap,
  StudyTimeCommitment
} from "../lib/skills/ai-data/personalized-roadmap-engine";
import { inspectCpythonMechanics } from "../lib/skills/ai-data/cpython-inspector-server";
import {
  getMemoryAliasingScenario,
  evaluateNumpyBroadcasting,
  evaluateSqlJoinVisualizer,
  simulateGradientDescent,
  simulateRagPipelineFlow
} from "../lib/skills/ai-data/visual-diagram-engine";
import {
  generateCanonicalNotesForTopic,
  generatePersonalWeaknessNotes
} from "../lib/skills/ai-data/intelligent-notes-engine";
import {
  getAllCuratedCodingLibrary,
  getSubjectCodingChallenges
} from "../lib/skills/ai-data/curated-coding-library";
import { executeAndEvaluateCodingSubmission } from "../lib/skills/ai-data/curated-coding-server";
import { TARGET_ROLE_PROFILES } from "../lib/skills/ai-data/roles";
import { updateTopicMasteryRecord, getTopicMasteryMap } from "../lib/skills/ai-data/store";
import { SKILL_DOMAINS } from "../lib/skill-hub-store";

describe("Pillar 1: Personalized Roadmap Engine & Prerequisite DAG", () => {
  test("generates unique, role-calibrated roadmaps across all 10 target industry roles", () => {
    const roles = Object.keys(TARGET_ROLE_PROFILES) as any[];
    assert.equal(roles.length, 10, "Must support exactly 10 industry roles");

    for (const role of roles) {
      const roadmap = buildStudentPersonalizedRoadmap({
        candidateId: "cand-test-01",
        targetRole: role,
        commitment: "1h_daily"
      });

      assert.equal(roadmap.targetRole, role);
      assert.ok(roadmap.roleTitle.length > 0);
      assert.ok(roadmap.milestones.length > 0, `Role ${role} must have milestones`);
      assert.ok(roadmap.totalTopics > 0, `Role ${role} must have topics`);
      assert.ok(roadmap.companyBenchmarks.length >= 4, "Must benchmark against Tier-1 companies");
      assert.ok(roadmap.roleWhyOverview.includes(roadmap.roleTitle), "Must explain why for target role");
    }
  });

  test("accurately calculates velocity and timeline based on 4 study time commitments", () => {
    const commitments: StudyTimeCommitment[] = ["30m_daily", "1h_daily", "2h_daily", "weekends_only"];

    const r30m = buildStudentPersonalizedRoadmap({ candidateId: "c1", commitment: "30m_daily" });
    const r1h = buildStudentPersonalizedRoadmap({ candidateId: "c1", commitment: "1h_daily" });
    const r2h = buildStudentPersonalizedRoadmap({ candidateId: "c1", commitment: "2h_daily" });
    const rWk = buildStudentPersonalizedRoadmap({ candidateId: "c1", commitment: "weekends_only" });

    assert.equal(r30m.weeklyHours, 3.5);
    assert.equal(r1h.weeklyHours, 7.0);
    assert.equal(r2h.weeklyHours, 14.0);
    assert.equal(rWk.weeklyHours, 8.0);

    // Faster commitment must yield fewer or equal weeks to complete
    assert.ok(r2h.estimatedWeeksToComplete <= r1h.estimatedWeeksToComplete);
    assert.ok(r1h.estimatedWeeksToComplete <= r30m.estimatedWeeksToComplete);
  });

  test("enforces strict prerequisite lock gating: subsequent stages are locked until prerequisites are satisfied", () => {
    const roadmap = buildStudentPersonalizedRoadmap({
      candidateId: "fresh-student",
      targetRole: "ai_engineer",
      commitment: "1h_daily"
    });

    const firstStage = roadmap.milestones[0];
    assert.equal(firstStage.status, "AVAILABLE", "First milestone stage must be AVAILABLE");
    assert.ok(firstStage.topics.some(t => t.status === "AVAILABLE"));

    // If there are multiple stages, later stages must be LOCKED for fresh candidates
    if (roadmap.milestones.length > 1) {
      const laterStage = roadmap.milestones[roadmap.milestones.length - 1];
      assert.equal(laterStage.status, "LOCKED", "Later stages must be locked without prerequisites");
      assert.ok(laterStage.topics.every(t => t.status === "LOCKED"));
    }
  });
});

describe("Pillar 2: Interactive Visual Diagram Studio & Real Sandbox Reflection", () => {
  test("inspectCpythonMechanics returns authentic tokens, AST tree, and disassembled bytecode", async () => {
    const code = "a = [1, 2]\nb = a\nb.append(3)";
    const reflection = await inspectCpythonMechanics(code);

    assert.equal(reflection.success, true);
    assert.ok(reflection.tokens.length > 0, "Must return real token stream");
    assert.ok(reflection.ast !== null, "Must return real parsed AST");
    assert.equal(reflection.ast?.type, "Module");
    assert.ok(reflection.bytecode.length > 0, "Must return disassembled bytecode");
    assert.ok(reflection.bytecode.some(b => b.opname.includes("BUILD_LIST") || b.opname.includes("STORE_NAME")));
    assert.ok(reflection.stackTraceSteps.length > 0, "Must return synthesized stack stepper states");
  });

  test("getMemoryAliasingScenario demonstrates stack vs heap pointer aliasing", () => {
    const scenario = getMemoryAliasingScenario("list_aliasing");
    assert.equal(scenario.length, 4, "Must contain 4 distinct progression steps");

    // Step 2: Aliasing active (both variables point to same address)
    const step2 = scenario[1];
    assert.equal(step2.stackVariables.length, 2);
    assert.equal(step2.stackVariables[0].targetAddress, step2.stackVariables[1].targetAddress);
    assert.ok(step2.aliasingWarning?.includes("Aliasing active"));

    // Step 4: Reassignment creates a new heap object
    const step4 = scenario[3];
    assert.notEqual(step4.stackVariables[0].targetAddress, step4.stackVariables[1].targetAddress);
    assert.equal(step4.heapObjects.length, 2);
  });

  test("evaluateNumpyBroadcasting validates compatible shapes and produces accurate ValueError for conflicts", () => {
    // Compatible: (3, 1) and (1, 4) -> (3, 4)
    const valid = evaluateNumpyBroadcasting([3, 1], [1, 4]);
    assert.equal(valid.isBroadcastable, true);
    assert.deepEqual(valid.resultShape, [3, 4]);

    // Incompatible: (3, 2) and (3, 3) -> conflict on trailing axis
    const invalid = evaluateNumpyBroadcasting([3, 2], [3, 3]);
    assert.equal(invalid.isBroadcastable, false);
    assert.equal(invalid.resultShape, null);
    assert.ok(invalid.errorMessage?.includes("ValueError: operands could not be broadcast together"));
  });

  test("evaluateSqlJoinVisualizer computes authentic row matches and preserves NULLs", () => {
    const inner = evaluateSqlJoinVisualizer("INNER");
    assert.equal(inner.joinType, "INNER");
    assert.equal(inner.unmatchedLeftCount, 0);

    const left = evaluateSqlJoinVisualizer("LEFT");
    assert.equal(left.joinType, "LEFT");
    assert.ok(left.totalRows >= inner.totalRows);
    assert.ok(left.unmatchedLeftCount > 0, "LEFT join must preserve unmatched left rows with NULL");
  });

  test("simulateGradientDescent models optimal convergence and divergence overshoot", () => {
    // Optimal learning rate alpha = 0.15 converges to theta = 3.0
    const optimal = simulateGradientDescent(0.15, -4.0);
    assert.equal(optimal.status, "CONVERGED");
    assert.ok(Math.abs(optimal.finalLoss - 1.0) < 0.1);

    // Divergent learning rate alpha = 1.10 overshoots
    const divergent = simulateGradientDescent(1.10, -4.0);
    assert.ok(["DIVERGED", "OSCILLATING"].includes(divergent.status));
  });

  test("simulateRagPipelineFlow computes sliding window chunks and top-k cosine similarity", () => {
    const rag = simulateRagPipelineFlow({
      chunkSize: 100,
      chunkOverlap: 25,
      query: "How does Cognalyze verify competence?",
      topK: 2
    });

    assert.ok(rag.totalChunks >= 2);
    assert.equal(rag.topK, 2);
    const retrieved = rag.chunks.filter(c => c.isRetrieved);
    assert.equal(retrieved.length, 2);
    assert.ok(rag.synthesizedPrompt.includes("CONTEXT:"));
    assert.ok(rag.generatedAnswer.length > 0);
  });
});

describe("Pillar 4: Curated Coding Library (570 Authentic Questions)", () => {
  test("maintains 570 curated coding challenges across 14 subjects", () => {
    const all = getAllCuratedCodingLibrary();
    assert.equal(all.length, 570, "Must contain exactly 570 authentic questions");

    const pythonChallenges = getSubjectCodingChallenges("subj_python");
    assert.equal(pythonChallenges.length, 120, "Python must have 120 curated questions");

    const sqlChallenges = getSubjectCodingChallenges("subj_sql");
    assert.equal(sqlChallenges.length, 100, "SQL must have 100 curated questions");

    const mlChallenges = getSubjectCodingChallenges("subj_ml");
    assert.equal(mlChallenges.length, 65, "ML must have 65 curated questions");
  });

  test("executes authentic Python reference code against hidden test cases in sandbox", async () => {
    const all = getAllCuratedCodingLibrary();
    const pythonQ = all.find(q => q.subjectId === "subj_python");
    assert.ok(pythonQ, "Must have Python challenge");

    const result = await executeAndEvaluateCodingSubmission(pythonQ.id, pythonQ.referenceSolution);
    assert.equal(result.passed, true);
    assert.ok(result.testCasesPassed > 0, "Reference solution must pass test cases");
  });
});

describe("Pillar 5: Intelligent Notes & Knowledge System", () => {
  test("generates Type A Canonical Notes with complete structured pedagogical sections", () => {
    const notes = generateCanonicalNotesForTopic("numpy-vectorization-and-broadcasting", "Data Scientist");

    assert.ok(notes.learningObjectives.length >= 3);
    assert.ok(notes.formalDefinition.length > 0);
    assert.ok(notes.mentalModelAnalogy.length > 0);
    assert.ok(notes.mathematicalFormulas.length >= 1);
    assert.ok(notes.productionCodeExample.code.length > 0);
    assert.ok(notes.commonMistakesAndTraps.length >= 2);
    assert.ok(notes.interviewCheatSheet.length >= 2);
  });

  test("generates Type B Personal Weakness Notes with concrete observed evidence and remediation", () => {
    updateTopicMasteryRecord("cand-test-dna", "numpy-vectorization-and-broadcasting", () => ({
      status: "learning",
      remediationRequired: true,
      assessmentScore: 45,
      weakConcepts: ["Shape Broadcasting & Strides"],
    }));
    const weaknessNote = generatePersonalWeaknessNotes("cand-test-dna", getTopicMasteryMap("cand-test-dna"));

    assert.ok(weaknessNote.totalWeaknessesDetected >= 1);
    assert.ok(weaknessNote.weaknesses.every(w => 
      w.weakConcept &&
      w.observedEvidence &&
      w.whyItMatters &&
      w.whatWentWrong &&
      w.howToImprove &&
      w.recommendedPracticeDrill
    ));
    assert.ok(weaknessNote.readinessVerdict.length > 0);
  });
});

describe("Non-Negotiable Invariants: DSA Exclusion & Python Consolidation", () => {
  test("strictly enforces DSA Exclusion: AI & Data Arena curated coding challenges contain zero LeetCode/DSA problems", () => {
    const all = getAllCuratedCodingLibrary();
    const dsaKeywords = ["binary search tree", "linked list", "lru cache", "graph cycle", "trie", "dynamic programming knapsack"];
    for (const q of all) {
      for (const kw of dsaKeywords) {
        assert.ok(
          !q.title.toLowerCase().includes(kw),
          `AI & Data coding challenge '${q.title}' must NOT contain competitive programming DSA topic '${kw}'`
        );
      }
    }
  });

  test("verifies python_programming_arena has been retired/consolidated from SKILL_DOMAINS into ai_data_arena", () => {
    const aiData = SKILL_DOMAINS.find(d => d.slug === "ai_data_arena");
    assert.ok(aiData, "ai_data_arena must be officially registered");
    assert.equal(aiData.action_route, "/student/skills/ai-data");

    const pythonDomain = SKILL_DOMAINS.find(d => d.slug === "python_programming_arena");
    assert.equal(pythonDomain, undefined, "python_programming_arena must be completely absent from SKILL_DOMAINS");
  });
});
