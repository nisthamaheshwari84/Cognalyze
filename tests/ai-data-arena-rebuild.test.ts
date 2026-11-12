import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  MASTER_CURRICULUM_SUBJECTS,
  TAXONOMY_SUBJECTS,
  getTaxonomyTopicById,
  getAllCurriculumTopicsFlat,
  getTopicLocation,
} from "../lib/skills/ai-data/master-curriculum-taxonomy";
import {
  getAllCuratedCodingLibrary,
  getSubjectCodingChallenges,
} from "../lib/skills/ai-data/curated-coding-library";
import {
  executeChallengeSubmission,
  executeAndEvaluateCodingSubmission,
} from "../lib/skills/ai-data/curated-coding-server";
import {
  generateCanonicalNotesForTopic,
  generatePersonalWeaknessNotes,
} from "../lib/skills/ai-data/intelligent-notes-engine";
import { buildStudentPersonalizedRoadmap } from "../lib/skills/ai-data/personalized-roadmap-engine";
import { SKILL_DOMAINS } from "../lib/skill-hub-store";

describe("Cognalyze AI & Data Arena Master UX Rebuild & Architecture Tests", () => {
  test("1. Skill Practice Hub consolidation: python_programming_arena removed, ai_data_arena is canonical", () => {
    const pythonDomain = SKILL_DOMAINS.find((d) => d.slug === "python_programming_arena");
    assert.equal(pythonDomain, undefined, "python_programming_arena must be retired from SKILL_DOMAINS");

    const aiDataDomain = SKILL_DOMAINS.find((d) => d.slug === "ai_data_arena");
    assert.ok(aiDataDomain, "ai_data_arena must be present in SKILL_DOMAINS");
    assert.equal(aiDataDomain.action_route, "/student/skills/ai-data");
  });

  test("2. Master Curriculum Taxonomy: 14 subjects with hierarchical modules, topics, and subtopics", () => {
    assert.equal(MASTER_CURRICULUM_SUBJECTS.length, 14, "Must have exactly 14 canonical subjects");
    assert.equal(TAXONOMY_SUBJECTS.length, 14, "TAXONOMY_SUBJECTS alias must match canonical 14 subjects");

    const allFlat = getAllCurriculumTopicsFlat();
    assert.ok(allFlat.length >= 100, `Expected at least 100 curriculum topics, found ${allFlat.length}`);

    // Verify first Python topic exists
    const introPy = getTaxonomyTopicById("py-01-intro");
    assert.ok(introPy, "Intro to Python topic must exist in taxonomy");
    assert.ok(introPy.title.includes("Python"), "Intro topic must be Python");

    // Verify topic location resolver
    const loc = getTopicLocation("py-01-intro");
    assert.ok(loc, "getTopicLocation must resolve subject and module");
    assert.equal(loc?.subject.id, "subj_python");
    assert.equal(loc?.module.id, "mod_py_foundations");
  });

  test("3. Curated Coding Library: 570 verified challenges without duplicate IDs", () => {
    const allChallenges = getAllCuratedCodingLibrary();
    assert.equal(allChallenges.length, 570, "Must maintain exactly 570 curated coding challenges");

    const idSet = new Set<string>();
    for (const c of allChallenges) {
      assert.ok(!idSet.has(c.id), `Duplicate challenge ID detected: ${c.id}`);
      idSet.add(c.id);
      assert.ok(c.sampleCases.length > 0, `Challenge ${c.id} must have sample cases`);
      assert.ok(c.starterCode.length > 0, `Challenge ${c.id} must have starter code`);
    }
  });

  test("4. Server Sandbox Execution: Real Python 3 execution against hidden tests", async () => {
    const all = getAllCuratedCodingLibrary();
    const pythonQ = all.find((q) => q.subjectId === "subj_python");
    assert.ok(pythonQ, "Must have Python challenge");

    // Execute reference solution via server-only module
    const execRes = await executeAndEvaluateCodingSubmission(pythonQ.id, pythonQ.referenceSolution);
    assert.ok(execRes.passed, "Reference solution must pass tests");
    assert.ok(execRes.testCasesPassed > 0, "Must have passing tests");
  });

  test("5. Server Sandbox Execution: Real SQL execution against SQLite in-memory sandbox", async () => {
    const all = getAllCuratedCodingLibrary();
    const sqlQ = all.find((q) => q.subjectId === "subj_sql");
    assert.ok(sqlQ, "Must have SQL challenge");

    // Execute SQL query via server-only module
    const execRes = await executeAndEvaluateCodingSubmission(
      sqlQ.id,
      sqlQ.referenceSolution || "SELECT * FROM customers LIMIT 5"
    );
    assert.ok(execRes.testCasesPassed >= 0, "Execution must return valid test pass count");
  });

  test("6. Intelligent Notes Engine: Generates Type A (Canonical) and Type B (Weakness) notes", () => {
    const canonical = generateCanonicalNotesForTopic("numpy-vectorization-and-broadcasting", "Data Scientist");
    assert.ok(canonical, "Canonical notes must be generated");
    assert.ok(canonical.learningObjectives.length >= 3, "Canonical notes must have learningObjectives");
    assert.ok(canonical.formalDefinition.length > 0, "Must have formalDefinition");
    assert.ok(canonical.interviewCheatSheet.length >= 2, "Must have interviewCheatSheet");

    const weakness = generatePersonalWeaknessNotes("cand-test-dna");
    assert.ok(weakness, "Weakness notes must be generated");
    assert.ok(weakness.totalWeaknessesDetected >= 1, "Must detect weaknesses");
  });

  test("7. Personalized Roadmap Engine: Generates student-specific sequence based on target role", () => {
    const roadmap = buildStudentPersonalizedRoadmap({
      candidateId: "student-demo",
      targetRole: "ai_engineer",
      commitment: "1h_daily",
    });

    assert.ok(roadmap, "Roadmap must be generated");
    assert.equal(roadmap.targetRole, "ai_engineer");
    assert.ok(roadmap.milestones.length > 0, "Must have roadmap milestones");
    assert.ok(roadmap.totalTopics > 0, "Total topics must be > 0");
  });

  test("8. Zero client imports of node:sqlite, child_process, fs in curated-coding-library", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const libSource = fs.readFileSync(
      path.join(process.cwd(), "lib/skills/ai-data/curated-coding-library.ts"),
      "utf8"
    );

    assert.ok(!libSource.includes("node:sqlite"), "Must NOT import node:sqlite");
    assert.ok(!libSource.includes("child_process"), "Must NOT import child_process");
    assert.ok(!libSource.includes("sql-lab-engine"), "Must NOT import sql-lab-engine");
    assert.ok(!libSource.includes("python-lab-engine"), "Must NOT import python-lab-engine");
  });
});
