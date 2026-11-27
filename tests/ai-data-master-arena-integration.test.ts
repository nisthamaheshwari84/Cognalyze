import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_MASTER_TRACKS,
  MASTER_CURRICULUM_SUBJECTS,
  getAllCurriculumTopicsFlat,
  getNextAndPreviousTopic,
  getTaxonomyTopicById,
} from "../lib/skills/ai-data/master-curriculum-taxonomy";
import { getAllTargetRoles, getTargetRoleBySlug } from "../lib/skills/ai-data/roles";
import { SKILL_DOMAINS } from "../lib/skill-hub-store";
import { executePythonInSandbox } from "../lib/skills/ai-data/python-lab-engine";
import { getAllSqlChallenges, executeSqlInSandbox } from "../lib/skills/ai-data/sql-lab-engine";
import { syncArenaAttemptToDNA } from "../lib/skills/ai-data/dna-adapter";

describe("AI & Data Arena — Master Architecture & Integration Suite", () => {
  it("verifies the 2 Canonical Master Tracks and 10+ core subjects", () => {
    assert.strictEqual(CANONICAL_MASTER_TRACKS.length, 2);
    assert.strictEqual(CANONICAL_MASTER_TRACKS[0].id, "track_a_foundations");
    assert.strictEqual(CANONICAL_MASTER_TRACKS[1].id, "track_b_specialized");

    // Track A includes Python, NumPy, Pandas, SQL, and Stats
    assert.ok(CANONICAL_MASTER_TRACKS[0].subjectIds.includes("subj_python"));
    assert.ok(CANONICAL_MASTER_TRACKS[0].subjectIds.includes("subj_numpy"));
    assert.ok(CANONICAL_MASTER_TRACKS[0].subjectIds.includes("subj_pandas"));
    assert.ok(CANONICAL_MASTER_TRACKS[0].subjectIds.includes("subj_sql"));
    assert.ok(CANONICAL_MASTER_TRACKS[0].subjectIds.includes("subj_stats_ab"));

    // Track B includes ML, DL, GenAI, RAG, Agents, DE, MLOps, Projects
    assert.ok(CANONICAL_MASTER_TRACKS[1].subjectIds.includes("subj_ml"));
    assert.ok(CANONICAL_MASTER_TRACKS[1].subjectIds.includes("subj_deep_learning"));
    assert.ok(CANONICAL_MASTER_TRACKS[1].subjectIds.includes("subj_genai_llm"));
    assert.ok(CANONICAL_MASTER_TRACKS[1].subjectIds.includes("subj_rag"));
    assert.ok(CANONICAL_MASTER_TRACKS[1].subjectIds.includes("subj_agents"));
    assert.ok(CANONICAL_MASTER_TRACKS[1].subjectIds.includes("subj_data_engineering"));
    assert.ok(CANONICAL_MASTER_TRACKS[1].subjectIds.includes("subj_mlops"));
    assert.ok(CANONICAL_MASTER_TRACKS[1].subjectIds.includes("subj_ai_projects"));
  });

  it("verifies complete flat curriculum with 150+ topics and continuous sequential navigation", () => {
    const flatTopics = getAllCurriculumTopicsFlat();
    assert.ok(flatTopics.length >= 150, `Expected >= 150 topics, found ${flatTopics.length}`);

    // Verify first topic is Python Introduction
    const first = flatTopics[0];
    assert.strictEqual(first.subject.id, "subj_python");
    assert.ok(first.topic.title.toLowerCase().includes("python"));

    // Verify sequential navigation from first to next
    const firstNav = getNextAndPreviousTopic(first.topic.id);
    assert.strictEqual(firstNav.previous, null);
    assert.notStrictEqual(firstNav.next, null);
    assert.strictEqual(firstNav.next!.globalIndex, 1);

    // Verify middle topic has both previous and next
    const midIndex = Math.floor(flatTopics.length / 2);
    const midTopic = flatTopics[midIndex];
    const midNav = getNextAndPreviousTopic(midTopic.topic.id);
    assert.notStrictEqual(midNav.previous, null);
    assert.notStrictEqual(midNav.next, null);
    assert.strictEqual(midNav.previous!.globalIndex, midIndex - 1);
    assert.strictEqual(midNav.next!.globalIndex, midIndex + 1);
  });

  it("strictly enforces DSA Exclusion: AI & Data Arena contains zero competitive programming / LeetCode DSA topics", () => {
    const flatTopics = getAllCurriculumTopicsFlat();
    const dsaKeywords = ["A2Z DSA 455", "binary search on answers", "two pointers vs dynamic programming", "k-sum leetcode", "topological sort dsa"];
    for (const item of flatTopics) {
      for (const kw of dsaKeywords) {
        assert.ok(!item.topic.title.toLowerCase().includes(kw), `Found forbidden DSA topic: ${item.topic.title}`);
      }
    }
  });

  it("verifies all 10 Target Career Roles are registered with verified provenance", () => {
    const roles = getAllTargetRoles();
    assert.strictEqual(roles.length, 10);

    const expectedSlugs = [
      "ai_engineer",
      "ml_engineer",
      "data_scientist",
      "data_analyst",
      "data_engineer",
      "genai_llm_engineer",
      "mlops_engineer",
      "applied_ai_engineer",
      "nlp_engineer",
      "cv_engineer",
    ];

    for (const slug of expectedSlugs) {
      const role = getTargetRoleBySlug(slug as any);
      assert.ok(role, `Role ${slug} must exist`);
      assert.ok(role.requiredSkills.length >= 3, `Role ${slug} must require >= 3 skills`);
      assert.ok(role.typicalCompanies.length >= 2, `Role ${slug} must list target companies`);
    }
  });

  it("verifies AI & Data Arena is officially registered in Skill Practice Hub domains", () => {
    const domain = SKILL_DOMAINS.find((d) => d.slug === "ai_data_arena");
    assert.ok(domain, "ai_data_arena must be registered in SKILL_DOMAINS");
    assert.strictEqual(domain.action_route, "/student/skills/ai-data");
    assert.strictEqual(domain.name, "AI & Data Arena");
    assert.strictEqual(domain.gating_priority, "core_interview");
  });

  it("executes authentic Python 3 code in sandbox without hardcoding", async () => {
    const result = await executePythonInSandbox(`
numbers = [1, 2, 3, 4, 5]
squared = [x**2 for x in numbers]
print(f"Squares: {squared}")
    `);
    assert.strictEqual(result.success, true);
    assert.ok(result.stdout.includes("Squares: [1, 4, 9, 16, 25]"));
  });

  it("executes authentic SQL query in SQLite sandbox against verified challenge", async () => {
    const challenges = getAllSqlChallenges();
    assert.ok(challenges.length >= 1, "Must contain seed SQL challenges");
    const chal = challenges[0];
    const result = await executeSqlInSandbox(chal.datasetId, chal.referenceSql, chal.slug);
    assert.strictEqual(result.success, true);
    assert.ok(result.rows.length > 0);
    assert.ok(result.columns.length > 0);
  });

  it("enforces Anti-Simulation: failing 0-score attempt is blocked from Student DNA", async () => {
    const syncOutcome = await syncArenaAttemptToDNA({
      id: "attempt-zero-1",
      candidateId: "test-cand-01",
      trackSlug: "genai_llm",
      lessonSlug: "structured-outputs-and-pydantic-validation",
      exerciseType: "code_lab",
      score: 0,
      passed: false,
      assisted: false,
      completedAt: new Date().toISOString(),
    });
    assert.strictEqual(syncOutcome.success, false);
    assert.strictEqual(syncOutcome.competenciesUpdated.length, 0);
  });

  it("synchronizes verified 100% mastery attempt into Student DNA", async () => {
    const syncOutcome = await syncArenaAttemptToDNA({
      id: "attempt-pass-1",
      candidateId: "test-cand-01",
      trackSlug: "genai_llm",
      lessonSlug: "structured-outputs-and-pydantic-validation",
      exerciseType: "code_lab",
      score: 95,
      passed: true,
      assisted: false,
      completedAt: new Date().toISOString(),
      dimensions: { practical_implementation: 95 },
    });
    assert.strictEqual(syncOutcome.success, true);
    assert.ok(syncOutcome.competenciesUpdated.includes("prompt_engineering_structured_outputs"));
  });
});
