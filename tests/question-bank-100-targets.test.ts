/**
 * tests/question-bank-100-targets.test.ts
 * 
 * Verifies that the Cognalyze Question Bank provides at least 100 validated, distinct questions
 * for every major standalone discipline:
 * 1. DSA (>= 100)
 * 2. Machine Learning (>= 100)
 * 3. Data Science & Analytics (>= 100)
 * 4. SQL (>= 100)
 * 5. Generative AI & LLMs (>= 100)
 * 6. Data Engineering (>= 100)
 * 7. MLOps (>= 100)
 * Total: >= 700 distinct questions.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  DSA_CATALOG,
  ML_CATALOG,
  DATA_SCIENCE_CATALOG,
  SQL_CATALOG,
  GENAI_CATALOG,
  DATA_ENG_CATALOG,
  MLOPS_CATALOG,
  ALL_SKILL_QUESTIONS,
  getCatalogStatistics,
  getQuestionById,
  getQuestionsByDomain,
  getQuestionsByCompany
} from "../lib/skills/catalogs/index";
import { EXPANDED_PLACEMENT_QUESTIONS } from "../lib/question-bank-catalog";
import { QuestionItem } from "../lib/question-bank-types";

function assertCatalogQuality(catalog: QuestionItem[], name: string, minCount: number) {
  assert.ok(
    catalog.length >= minCount,
    `${name} must contain at least ${minCount} questions, but found ${catalog.length}`
  );

  const seenIds = new Set<string>();
  for (const q of catalog) {
    assert.ok(q.id && q.id.trim().length > 0, `${name} question missing id: ${JSON.stringify(q)}`);
    assert.ok(!seenIds.has(q.id), `${name} has duplicate id: ${q.id}`);
    seenIds.add(q.id);

    assert.ok(q.title && q.title.trim().length > 3, `${q.id} has invalid title`);
    assert.ok(q.question && q.question.trim().length > 10, `${q.id} has invalid question`);
    assert.ok(q.domain && q.domain.trim().length > 0, `${q.id} missing domain`);
    assert.ok(q.topic && q.topic.trim().length > 0, `${q.id} missing topic`);
    assert.ok(["Easy", "Medium", "Hard"].includes(q.difficulty), `${q.id} has invalid difficulty: ${q.difficulty}`);
    assert.ok(q.explanation && q.explanation.trim().length > 10, `${q.id} missing explanation`);
    assert.ok(q.solution && q.solution.trim().length > 5, `${q.id} missing solution`);
    assert.ok(Array.isArray(q.tags) && q.tags.length > 0, `${q.id} must have tags`);
  }
}

test("Question Bank Targets: DSA Catalog has >= 100 validated distinct questions", () => {
  assertCatalogQuality(DSA_CATALOG, "DSA Catalog", 100);
});

test("Question Bank Targets: Machine Learning Catalog has >= 100 validated distinct questions", () => {
  assertCatalogQuality(ML_CATALOG, "ML Catalog", 100);
});

test("Question Bank Targets: Data Science & Analytics Catalog has >= 100 validated distinct questions", () => {
  assertCatalogQuality(DATA_SCIENCE_CATALOG, "Data Science Catalog", 100);
});

test("Question Bank Targets: SQL Catalog has >= 100 validated distinct questions", () => {
  assertCatalogQuality(SQL_CATALOG, "SQL Catalog", 100);
});

test("Question Bank Targets: Generative AI & LLMs Catalog has >= 100 validated distinct questions", () => {
  assertCatalogQuality(GENAI_CATALOG, "GenAI Catalog", 100);
});

test("Question Bank Targets: Data Engineering Catalog has >= 100 validated distinct questions", () => {
  assertCatalogQuality(DATA_ENG_CATALOG, "Data Engineering Catalog", 100);
});

test("Question Bank Targets: MLOps Catalog has >= 100 validated distinct questions", () => {
  assertCatalogQuality(MLOPS_CATALOG, "MLOps Catalog", 100);
});

test("Question Bank Targets: Aggregator statistics report >= 700 total distinct questions", () => {
  const stats = getCatalogStatistics();
  assert.ok(stats.total >= 700, `Expected total >= 700, got ${stats.total}`);
  assert.ok(stats.dsa >= 100);
  assert.ok(stats.machineLearning >= 100);
  assert.ok(stats.dataScience >= 100);
  assert.ok(stats.sql >= 100);
  assert.ok(stats.generativeAi >= 100);
  assert.ok(stats.dataEngineering >= 100);
  assert.ok(stats.mlops >= 100);
  assert.equal(ALL_SKILL_QUESTIONS.length, stats.total);
});

test("Question Bank Targets: Fast query utilities work by domain, company, and id", () => {
  const q = getQuestionById(DSA_CATALOG[0].id);
  assert.ok(q, "Should find question by ID");
  assert.equal(q.id, DSA_CATALOG[0].id);

  const sqlQuestions = getQuestionsByDomain("SQL");
  assert.ok(sqlQuestions.length >= 100, `Expected >= 100 SQL questions, got ${sqlQuestions.length}`);

  const amazonQuestions = getQuestionsByCompany("Amazon");
  assert.ok(amazonQuestions.length >= 20, `Expected >= 20 Amazon questions, got ${amazonQuestions.length}`);
});

test("Question Bank Targets: EXPANDED_PLACEMENT_QUESTIONS in Question Bank integrates catalogs without id collisions", () => {
  assert.ok(EXPANDED_PLACEMENT_QUESTIONS.length >= 700, `Expected >= 700 in pool, got ${EXPANDED_PLACEMENT_QUESTIONS.length}`);
  const uniqueIds = new Set(EXPANDED_PLACEMENT_QUESTIONS.map(q => q.id));
  assert.equal(uniqueIds.size, EXPANDED_PLACEMENT_QUESTIONS.length, "All question IDs in pool must be strictly unique");
});

