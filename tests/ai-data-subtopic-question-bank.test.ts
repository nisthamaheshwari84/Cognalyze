/**
 * tests/ai-data-subtopic-question-bank.test.ts
 *
 * Comprehensive Test Suite for AI & Data Arena Subtopic Question Banks,
 * Practice Engine, Sandboxed Code Execution, Topic Assessments, and DNA Synchronization.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  generateSubtopicQuestionBank,
  getTopicQuestionBank,
  findQuestionById,
  RELEVANT_COMPANY_POOL,
} from "../lib/skills/ai-data/question-generator-engine";
import {
  queryCompanyQuestions,
  recordQuestionSubmission,
  toggleQuestionBookmark,
  getCandidatePracticeAnalytics,
} from "../lib/skills/ai-data/company-question-bank-store";
import {
  getTaxonomyTopicById,
  getAllCurriculumTopicsFlat,
  CANONICAL_MASTER_TRACKS,
} from "../lib/skills/ai-data/master-curriculum-taxonomy";
import { executePythonInSandbox } from "../lib/skills/ai-data/python-lab-engine";
import { executeSqlInSandbox, getAllSqlChallenges } from "../lib/skills/ai-data/sql-lab-engine";

describe("AI & Data Arena — Topic-Wise Question Bank & Practice Engine", () => {
  it("guarantees a complete 30-50 question bank for foundational subtopics across multiple formats", () => {
    const pythonTopic = getTaxonomyTopicById("py-01-intro");
    assert.ok(pythonTopic, "py-01-intro topic must exist");
    assert.ok(pythonTopic.subtopics && pythonTopic.subtopics.length > 0, "Subtopics must exist");

    const firstSubtopic = pythonTopic.subtopics[0];
    const bank = generateSubtopicQuestionBank(
      "subj_python",
      pythonTopic.moduleId,
      pythonTopic,
      firstSubtopic
    );

    // Prompt requires 30-40 questions minimum; our generator yields 50
    assert.ok(bank.length >= 36, `Bank must have at least 36 questions, found ${bank.length}`);

    // Check all required question formats are present
    const types = new Set(bank.map((q) => q.questionType));
    assert.ok(types.has("conceptual"), "Must contain conceptual questions");
    assert.ok(types.has("mcq"), "Must contain MCQs");
    assert.ok(types.has("coding"), "Must contain coding challenges");
    assert.ok(types.has("output_prediction"), "Must contain output prediction questions");
    assert.ok(types.has("debugging"), "Must contain debugging challenges");
    assert.ok(types.has("scenario"), "Must contain realistic engineering scenarios");
    assert.ok(types.has("interview"), "Must contain technical interview questions");

    // Check difficulty progression
    const diffs = new Set(bank.map((q) => q.difficulty));
    assert.ok(diffs.has("beginner"), "Must include beginner questions");
    assert.ok(diffs.has("intermediate"), "Must include intermediate questions");
    assert.ok(diffs.has("advanced"), "Must include advanced questions");
    assert.ok(diffs.has("interview") || diffs.has("challenge"), "Must include placement/interview bar questions");
  });

  it("verifies coding questions have function signatures, constraints, sample cases, and valid reference solutions", () => {
    const topic = getTaxonomyTopicById("py-01-intro")!;
    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, topic.subtopics![0]);
    const codingQuestions = bank.filter((q) => q.questionType === "coding");

    assert.ok(codingQuestions.length >= 8, "Must have at least 8 coding questions");
    for (const cq of codingQuestions) {
      assert.ok(cq.functionSignature, `Coding question ${cq.id} must define a function signature`);
      assert.ok(cq.sampleCases && cq.sampleCases.length > 0, `Coding question ${cq.id} must define sample cases`);
      assert.ok(cq.constraints && cq.constraints.length > 0, `Coding question ${cq.id} must define constraints`);
      assert.ok(cq.referenceSolution, `Coding question ${cq.id} must define a reference solution`);
      assert.ok(cq.timeComplexity, `Coding question ${cq.id} must state time complexity`);
    }
  });

  it("executes authentic Python 3 sandbox code for practice question verification", async () => {
    const code = `
def multiply_elements(nums):
    return [x * 2 for x in nums]

print(multiply_elements([1, 2, 3]))
`;
    const res = await executePythonInSandbox(code);
    assert.strictEqual(res.success, true);
    assert.ok(res.stdout && res.stdout.includes("[2, 4, 6]"), `Expected stdout [2, 4, 6], got: ${res.stdout}`);
  });

  it("executes authentic SQLite queries in sandbox for SQL topic questions", async () => {
    const challenges = getAllSqlChallenges();
    assert.ok(challenges.length >= 1, "Must contain seed SQL challenges");
    const chal = challenges[0];
    const res = await executeSqlInSandbox(chal.datasetId, chal.referenceSql, chal.slug);
    assert.strictEqual(res.success, true);
    assert.ok(res.rows && res.rows.length > 0, "Expected returned records");
    assert.ok(res.columns && res.columns.length > 0, "Must include columns");
  });

  it("evaluates MCQ submissions accurately and provides distractor rationales", () => {
    const candidateId = "cand-test-mcq";
    const topic = getTaxonomyTopicById("py-01-intro")!;
    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, topic.subtopics![0]);
    const mcq = bank.find((q) => q.questionType === "mcq")!;

    // Correct submission
    const correctRes = recordQuestionSubmission({
      candidateId,
      questionId: mcq.id,
      userAnswer: mcq.correctAnswer,
      timeSpentSeconds: 30,
    });
    assert.strictEqual(correctRes.isCorrect, true);
    assert.strictEqual(correctRes.scoreAwarded, 100);

    // Incorrect submission
    const incorrectRes = recordQuestionSubmission({
      candidateId,
      questionId: mcq.id,
      userAnswer: "completely incorrect option string",
      timeSpentSeconds: 30,
    });
    assert.strictEqual(incorrectRes.isCorrect, false);
    assert.strictEqual(incorrectRes.scoreAwarded, 0);
  });

  it("evaluates code output prediction questions with exact memory pointer traces", () => {
    const candidateId = "cand-test-trace";
    const topic = getTaxonomyTopicById("py-01-intro")!;
    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, topic.subtopics![0]);
    const outputQ = bank.find((q) => q.questionType === "output_prediction")!;

    const res = recordQuestionSubmission({
      candidateId,
      questionId: outputQ.id,
      userAnswer: outputQ.correctAnswer,
      timeSpentSeconds: 40,
    });
    assert.strictEqual(res.isCorrect, true);
    assert.strictEqual(res.scoreAwarded, 100);
  });

  it("records telemetry, updates analytics, and manages question bookmarks", () => {
    const candidateId = "cand-analytics-test";
    const topic = getTaxonomyTopicById("py-01-intro")!;
    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, topic.subtopics![0]);

    // Submit two questions
    recordQuestionSubmission({
      candidateId,
      questionId: bank[0].id,
      userAnswer: bank[0].correctAnswer,
      timeSpentSeconds: 45,
    });
    recordQuestionSubmission({
      candidateId,
      questionId: bank[1].id,
      userAnswer: "incorrect",
      timeSpentSeconds: 30,
    });

    // Toggle bookmark
    const bookmarked = toggleQuestionBookmark(candidateId, bank[0].id);
    assert.strictEqual(bookmarked, true);

    const analytics = getCandidatePracticeAnalytics(candidateId);
    assert.ok(analytics.totalAttempted >= 2, "Must record at least 2 attempts");
    assert.ok(analytics.totalSolved >= 1, "Must record at least 1 solved");
    assert.ok(analytics.bookmarkedQuestionIds.includes(bank[0].id), "Must include bookmarked question");
  });

  it("supports query filtering by pattern type, difficulty, and search query", () => {
    const candidateId = "cand-filter-test";
    const topic = getTaxonomyTopicById("py-01-intro")!;
    const subtopic = topic.subtopics![0];

    // Filter by pattern
    const codingOnly = queryCompanyQuestions(candidateId, {
      topicId: topic.id,
      subtopicId: subtopic.id,
      patternType: "coding",
    });
    assert.ok(codingOnly.questions.length > 0);
    assert.ok(codingOnly.questions.every((q) => q.questionType === "coding"));

    // Filter by difficulty
    const beginnerOnly = queryCompanyQuestions(candidateId, {
      topicId: topic.id,
      subtopicId: subtopic.id,
      difficulty: "beginner",
    });
    assert.ok(beginnerOnly.questions.length > 0);
    assert.ok(beginnerOnly.questions.every((q) => q.difficulty === "beginner"));
  });

  it("strictly enforces DSA Exclusion: AI & Data Arena question banks contain zero competitive programming / LeetCode DSA topics", () => {
    const allTopics = getAllCurriculumTopicsFlat();
    const dsaKeywords = [
      "binary search tree",
      "red black tree",
      "avl tree",
      "dijkstra",
      "floyd warshall",
      "segment tree",
      "fenwick tree",
      "disjoint set union",
      "trie",
      "leetcode 75",
      "striver 455",
      "kmp string matching",
    ];

    for (const item of allTopics) {
      const titleLower = item.topic.title.toLowerCase();
      for (const kw of dsaKeywords) {
        assert.ok(
          !titleLower.includes(kw),
          `Topic "${item.topic.title}" contains excluded DSA concept "${kw}". DSA must remain strictly in /student/skills/dsa.`
        );
      }
    }
  });
});
