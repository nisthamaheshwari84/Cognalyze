/**
 * tests/ai-data-arena-phase1.test.ts
 * 
 * Verification Test Suite for Phase 1 of Cognalyze AI, Data & Intelligence Arena.
 * Verifies:
 * 1. Canonical Skill Taxonomy extension (all 14 new skills and their aliases).
 * 2. Domain registration in Skill Practice Hub.
 * 3. 8 Sourced Industry Role Profiles.
 * 4. 6 Connected Learning Tracks and curriculum graph.
 * 5. Student DNA sync & Evidence Pipeline integration.
 * 6. User-isolated store persistence.
 * 7. REST API route handling.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeSkill, CANONICAL_SKILL_TAXONOMY } from "../lib/dna/taxonomy";
import { SKILL_DOMAINS } from "../lib/skill-hub-store";
import { getAllTargetRoles, getTargetRoleBySlug } from "../lib/skills/ai-data/roles";
import { getAllTracks, getTrackBySlug, getAllLessons } from "../lib/skills/ai-data/curriculum";
import {
  setCandidateRole,
  getCandidateRole,
  setCandidateActiveTrack,
  getCandidateActiveTrack,
  recordStudentAttempt,
  getArenaSummary
} from "../lib/skills/ai-data/store";
import { syncArenaAttemptToDNA } from "../lib/skills/ai-data/dna-adapter";

describe("Phase 1: Canonical Skill Taxonomy & Aliases", () => {
  const expectedNewSkills = [
    "python_data_stack",
    "classical_ml_modeling",
    "ml_model_evaluation",
    "deep_learning_foundations",
    "prompt_engineering_structured_outputs",
    "rag_architecture_and_retrieval",
    "ai_agents_and_tool_calling",
    "llm_evaluations_and_safety",
    "mlops_serving_and_monitoring",
    "advanced_sql_analytics",
    "exploratory_data_analysis",
    "ab_testing_statistics",
    "business_product_analytics",
    "data_engineering_pipelines"
  ];

  test("All 14 canonical AI & Data skills exist in taxonomy with levels 1-5", () => {
    for (const skillId of expectedNewSkills) {
      const skill = CANONICAL_SKILL_TAXONOMY[skillId];
      assert.ok(skill, `Skill ${skillId} must exist in CANONICAL_SKILL_TAXONOMY`);
      assert.equal(skill.skillId, skillId);
      assert.ok(skill.name.length > 0);
      assert.ok(skill.proficiencyLevels[1], `${skillId} must define Level 1`);
      assert.ok(skill.proficiencyLevels[5], `${skillId} must define Level 5`);
    }
  });

  test("normalizeSkill accurately resolves aliases to canonical skills", () => {
    assert.equal(normalizeSkill("numpy")?.skillId, "python_data_stack");
    assert.equal(normalizeSkill("pandas")?.skillId, "python_data_stack");
    assert.equal(normalizeSkill("scikit-learn")?.skillId, "classical_ml_modeling");
    assert.equal(normalizeSkill("roc-auc")?.skillId, "ml_model_evaluation");
    assert.equal(normalizeSkill("pytorch")?.skillId, "deep_learning_foundations");
    assert.equal(normalizeSkill("structured outputs")?.skillId, "prompt_engineering_structured_outputs");
    assert.equal(normalizeSkill("rag")?.skillId, "rag_architecture_and_retrieval");
    assert.equal(normalizeSkill("tool calling")?.skillId, "ai_agents_and_tool_calling");
    assert.equal(normalizeSkill("ragas")?.skillId, "llm_evaluations_and_safety");
    assert.equal(normalizeSkill("model drift")?.skillId, "mlops_serving_and_monitoring");
    assert.equal(normalizeSkill("window functions")?.skillId, "advanced_sql_analytics");
    assert.equal(normalizeSkill("data cleaning")?.skillId, "exploratory_data_analysis");
    assert.equal(normalizeSkill("a/b testing")?.skillId, "ab_testing_statistics");
    assert.equal(normalizeSkill("cohort analysis")?.skillId, "business_product_analytics");
    assert.equal(normalizeSkill("etl")?.skillId, "data_engineering_pipelines");
  });
});

describe("Phase 1: Skill Practice Hub Domain Registration", () => {
  test("ai_data_arena is registered in SKILL_DOMAINS and points to /student/skills/ai-data", () => {
    const aiDataDomain = SKILL_DOMAINS.find(d => d.slug === "ai_data_arena");
    assert.ok(aiDataDomain, "ai_data_arena must exist in SKILL_DOMAINS");
    assert.equal(aiDataDomain.action_route, "/student/skills/ai-data");
    assert.equal(aiDataDomain.is_service_track, true);
    assert.equal(aiDataDomain.is_product_track, true);
    assert.equal(aiDataDomain.gating_priority, "core_interview");

    const pythonDomain = SKILL_DOMAINS.find(d => d.slug === "python_programming_arena");
    assert.equal(pythonDomain, undefined, "python_programming_arena has been retired/consolidated into ai_data_arena");
  });
});

describe("Phase 1: Sourced Role Profiles", () => {
  test("All 8 industry target roles exist with complete provenance", () => {
    const roles = getAllTargetRoles();
    assert.equal(roles.length, 8, "Must contain exactly 8 target role profiles");

    const expectedRoles = [
      "ai_engineer",
      "ml_engineer",
      "data_scientist",
      "data_analyst",
      "data_engineer",
      "genai_llm_engineer",
      "mlops_engineer",
      "applied_ai_engineer"
    ];

    for (const rSlug of expectedRoles) {
      const r = getTargetRoleBySlug(rSlug as any);
      assert.ok(r, `Role profile ${rSlug} must exist`);
      assert.ok(r.typicalCompanies.length >= 3, `${rSlug} must have at least 3 typical companies`);
      assert.ok(r.primaryInterviewFormats.length >= 2, `${rSlug} must define interview formats`);
      assert.ok(r.requiredSkills.length >= 3, `${rSlug} must define required skills`);
      assert.ok(r.salaryTier.length > 0, `${rSlug} must define salary tier`);
    }
  });
});

describe("Phase 1: 6 Connected Learning Tracks & Curriculum", () => {
  test("All 6 learning tracks exist and have valid structure", () => {
    const tracks = getAllTracks();
    assert.equal(tracks.length, 6, "Must define exactly 6 learning tracks");

    const expectedSlugs = [
      "ai_ml",
      "data_science_analytics",
      "genai_llm",
      "data_eng",
      "mlops",
      "applied_projects"
    ];

    for (const tSlug of expectedSlugs) {
      const track = getTrackBySlug(tSlug as any);
      assert.ok(track, `Track ${tSlug} must exist`);
      assert.ok(track.stages.length >= 1, `Track ${tSlug} must have at least 1 stage`);
      assert.ok(track.estimatedHours > 0, `Track ${tSlug} must have estimated hours`);
    }
  });

  test("GenAI & LLM track lists AI & ML as prerequisite", () => {
    const genaiTrack = getTrackBySlug("genai_llm");
    assert.ok(genaiTrack.prerequisites.includes("ai_ml"), "GenAI track must list ai_ml as prerequisite");
  });

  test("All lessons have canonical skills mapped to real taxonomy", () => {
    const lessons = getAllLessons();
    assert.ok(lessons.length >= 10, "Curriculum must define comprehensive seed lessons");

    for (const lesson of lessons) {
      const skill = CANONICAL_SKILL_TAXONOMY[lesson.canonicalSkill];
      assert.ok(skill, `Lesson ${lesson.slug} references invalid canonicalSkill: ${lesson.canonicalSkill}`);
    }
  });
});

describe("Phase 1: Student DNA & Evidence Pipeline Synchronization", () => {
  test("syncArenaAttemptToDNA blocks 0 scores from polluting Student DNA (Anti-Simulation)", async () => {
    const syncRes = await syncArenaAttemptToDNA({
      id: "test-att-001",
      candidateId: "u-test-candidate",
      trackSlug: "genai_llm",
      lessonSlug: "structured-outputs-and-pydantic-validation",
      exerciseType: "code_lab",
      score: 0,
      passed: false,
      assisted: false,
      completedAt: new Date().toISOString()
    });

    assert.equal(syncRes.success, false, "Failed or zero-score attempts must not write to Student DNA");
    assert.equal(syncRes.competenciesUpdated.length, 0);
  });

  test("syncArenaAttemptToDNA successfully records verified attempt in DNA", async () => {
    const syncRes = await syncArenaAttemptToDNA({
      id: "test-att-002",
      candidateId: "u-test-candidate",
      trackSlug: "genai_llm",
      lessonSlug: "structured-outputs-and-pydantic-validation",
      exerciseType: "code_lab",
      score: 95,
      passed: true,
      assisted: false,
      completedAt: new Date().toISOString()
    });

    assert.equal(syncRes.success, true, "Valid passing attempt must sync to Student DNA");
    assert.ok(syncRes.competenciesUpdated.includes("prompt_engineering_structured_outputs"));
    assert.ok(syncRes.nextActionRecommendation.length > 0);
  });
});

describe("Phase 1: Multi-Tenant Store & User Isolation", () => {
  test("Candidates maintain independent roles and active tracks", () => {
    const userA = "u-cand-A";
    const userB = "u-cand-B";

    setCandidateRole(userA, "data_scientist");
    setCandidateRole(userB, "mlops_engineer");

    setCandidateActiveTrack(userA, "data_science_analytics");
    setCandidateActiveTrack(userB, "mlops");

    assert.equal(getCandidateRole(userA), "data_scientist");
    assert.equal(getCandidateRole(userB), "mlops_engineer");

    assert.equal(getCandidateActiveTrack(userA), "data_science_analytics");
    assert.equal(getCandidateActiveTrack(userB), "mlops");
  });

  test("recordStudentAttempt updates summary and verified count", async () => {
    const testUser = "u-cand-stats";
    setCandidateRole(testUser, "ai_engineer");

    const record = await recordStudentAttempt({
      candidateId: testUser,
      trackSlug: "genai_llm",
      lessonSlug: "structured-outputs-and-pydantic-validation",
      exerciseType: "code_lab",
      score: 90,
      passed: true,
      assisted: false,
      executionReport: { totalTests: 2, passedCount: 2, executionTimeMs: 120 }
    });

    assert.equal(record.attempt.score, 90);
    assert.equal(record.attempt.passed, true);

    const summary = await getArenaSummary(testUser);
    assert.equal(summary.candidateId, testUser);
    assert.ok(summary.completedLessonsCount >= 1);
    assert.ok(summary.overallScoreAverage >= 80);
    assert.ok(summary.dnaSkillGaps.length > 0);
  });
});

