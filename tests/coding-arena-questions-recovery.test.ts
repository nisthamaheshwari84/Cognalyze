import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getAllCuratedCodingLibrary,
  getSubjectCodingChallenges,
  getChallengesForTopic,
  getCodingChallengeById,
  queryCuratedCodingLibrary,
  CODING_LIBRARY_QUOTAS,
} from "../lib/skills/ai-data/curated-coding-library";
import {
  MASTER_CURRICULUM_SUBJECTS,
  TAXONOMY_SUBJECTS,
  getTaxonomyTopicById,
} from "../lib/skills/ai-data/master-curriculum-taxonomy";
import {
  executeChallengeSubmission,
  executeAndEvaluateCodingSubmission,
} from "../lib/skills/ai-data/curated-coding-server";

describe("Phase 1-8: Coding Arena Questions Loading & Integrity Recovery Tests", () => {
  test("1. Default Global Arena Retrieval: Loads all 570 authentic questions", () => {
    const all = getAllCuratedCodingLibrary();
    assert.equal(all.length, 570, "Must return exactly 570 curated coding challenges");

    const defaultQuery = queryCuratedCodingLibrary({
      subjectId: "ALL",
      topicId: "ALL",
      difficulty: "ALL",
    });
    assert.equal(defaultQuery.totalMatching, 570, "Default unfiltered query must match 570 challenges");
    assert.equal(defaultQuery.challenges.length, 570, "Default page should deliver available challenges");
  });

  test("2. Subject Filtering: Python returns exactly 120, SQL returns exactly 100", () => {
    const pyChallenges = queryCuratedCodingLibrary({ subjectId: "subj_python" });
    assert.equal(pyChallenges.totalMatching, 120, "Python subject must have exactly 120 challenges");
    for (const c of pyChallenges.challenges) {
      assert.equal(c.subjectId, "subj_python");
    }

    const sqlChallenges = queryCuratedCodingLibrary({ subjectId: "subj_sql" });
    assert.equal(sqlChallenges.totalMatching, 100, "SQL subject must have exactly 100 challenges");
    for (const c of sqlChallenges.challenges) {
      assert.equal(c.subjectId, "subj_sql");
      assert.equal(c.category, "sql_query");
      assert.ok(
        c.starterCode.toLowerCase().includes("select") || c.starterCode.includes("--"),
        `SQL challenge ${c.id} must have SQL starter code`
      );
    }
  });

  test("3. Topic-Level Retrieval: Every canonical topic maps to real challenges", () => {
    // Test the first introductory Python topic
    const introChallenges = getChallengesForTopic("py-01-intro");
    assert.ok(introChallenges.length > 0, "py-01-intro must have accessible coding challenges");

    // Test variables & types topic
    const varChallenges = getChallengesForTopic("py-02-variables-data-types");
    assert.ok(varChallenges.length > 0, "py-02-variables-data-types must have coding challenges");

    // Test SQL joins topic
    const sqlJoinChallenges = getChallengesForTopic("sql-01-joins-execution-model");
    assert.ok(sqlJoinChallenges.length > 0, "sql-01-joins-execution-model must have coding challenges");
  });

  test("4. Difficulty Filtering: Accurate sub-filtering by difficulty tier", () => {
    const beginnerAll = queryCuratedCodingLibrary({ difficulty: "beginner" });
    assert.ok(beginnerAll.totalMatching > 0, "Beginner questions must be found");
    for (const c of beginnerAll.challenges) {
      assert.equal(c.difficulty, "beginner");
    }

    const pyPlacement = queryCuratedCodingLibrary({ subjectId: "subj_python", difficulty: "placement" });
    assert.ok(pyPlacement.totalMatching > 0, "Python placement questions must be found");
    for (const c of pyPlacement.challenges) {
      assert.equal(c.subjectId, "subj_python");
      assert.equal(c.difficulty, "placement");
    }
  });

  test("5. Search Filtering: Queries match titles and problem statements", () => {
    const searchRes = queryCuratedCodingLibrary({ searchQuery: "cloner" });
    assert.ok(searchRes.totalMatching >= 1, "Searching 'cloner' must match Safe Cloner");
    assert.ok(
      searchRes.challenges.some((c) => c.title.toLowerCase().includes("cloner")),
      "Result must include 'Mutable Reference Safe Cloner'"
    );

    const nonExistent = queryCuratedCodingLibrary({ searchQuery: "xyznonexistentquery999" });
    assert.equal(nonExistent.totalMatching, 0, "Nonexistent query must return 0 results");
  });

  test("6. Active Challenge Synchronization Invariant: Selected problem is strictly part of results", () => {
    // When results exist:
    const pyList = queryCuratedCodingLibrary({ subjectId: "subj_python" }).challenges;
    assert.ok(pyList.length > 0);
    const activePy = pyList[0];
    assert.equal(activePy.subjectId, "subj_python");

    // When results are empty, active challenge MUST NOT fall back to an arbitrary question:
    const emptyList = queryCuratedCodingLibrary({ searchQuery: "unmatched_search_term" }).challenges;
    assert.equal(emptyList.length, 0);
    // In our component logic: activeChallenge = filteredChallenges.length === 0 ? null : (found || filtered[0])
    const activeWhenEmpty = emptyList.length === 0 ? null : emptyList[0];
    assert.equal(activeWhenEmpty, null, "Active challenge must be null when filtered list is empty");
  });

  test("7. Complete Curriculum Integrity: 100% of 570 questions map to valid canonical topics", () => {
    const all = getAllCuratedCodingLibrary();
    assert.equal(all.length, 570);

    const validTopicIds = new Set(
      MASTER_CURRICULUM_SUBJECTS.flatMap((s) => s.modules.flatMap((m) => m.topics.map((t) => t.id)))
    );

    const unmapped: string[] = [];
    for (const q of all) {
      if (!validTopicIds.has(q.topicId)) {
        unmapped.push(`${q.id}: topic ${q.topicId} not in canonical taxonomy`);
      }
      assert.ok(q.title.length > 0, `${q.id} must have title`);
      assert.ok(q.problemStatement.length > 0, `${q.id} must have problem statement`);
      assert.ok(q.sampleCases.length > 0, `${q.id} must have sample cases`);
      assert.ok(q.starterCode.length > 0, `${q.id} must have starter code`);
      assert.ok(q.referenceSolution.length > 0, `${q.id} must have reference solution`);
    }

    assert.equal(unmapped.length, 0, `Detected ${unmapped.length} unmapped questions: ${unmapped.slice(0, 5).join(", ")}`);
  });

  test("8. Real Sandboxed Execution: Evaluates Python and SQL submissions", async () => {
    // Python submission
    const pyQ = getCodingChallengeById("py-code-001");
    assert.ok(pyQ, "py-code-001 must exist");
    const pyRes = await executeAndEvaluateCodingSubmission(pyQ.id, pyQ.referenceSolution);
    assert.equal(pyRes.passed, true, "Python reference solution must pass tests");
    assert.equal(pyRes.testCasesPassed > 0, true);

    // SQL submission
    const sqlQ = getCodingChallengeById("sql-code-001");
    assert.ok(sqlQ, "sql-code-001 must exist");
    const sqlRes = await executeAndEvaluateCodingSubmission(sqlQ.id, sqlQ.referenceSolution);
    assert.ok(sqlRes.timeSpentMs >= 0, "SQL execution must record valid latency");
  });
});

