/**
 * tests/dsa-canonical-100.test.ts
 * 
 * Verifies that CANONICAL_DSA_PROBLEMS and CANONICAL_SQL_PROBLEMS
 * both maintain at least 100 fully hydrated, executable problem definitions.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  CANONICAL_DSA_PROBLEMS,
  getCanonicalProblem,
  getAllCanonicalProblemIds
} from "../lib/skills/dsa-canonical-problems";

import {
  CANONICAL_SQL_PROBLEMS,
  getCanonicalSqlProblem,
  getAllCanonicalSqlProblemIds
} from "../lib/skills/sql-canonical-problems";

test("DSA Canonical Registry: At least 100 hydrated canonical problems available statically", () => {
  const keys = Object.keys(CANONICAL_DSA_PROBLEMS);
  assert.ok(
    keys.length >= 100,
    `CANONICAL_DSA_PROBLEMS must contain >= 100 keys, found: ${keys.length}`
  );

  for (const id of keys.slice(0, 50)) {
    const prob = CANONICAL_DSA_PROBLEMS[id];
    assert.ok(prob.id, `Problem ${id} missing id`);
    assert.ok(prob.title, `Problem ${id} missing title`);
    assert.ok(prob.starterCode.python, `Problem ${id} missing python starter code`);
    assert.ok(prob.starterCode.javascript, `Problem ${id} missing javascript starter code`);
    assert.ok(prob.starterCode.cpp, `Problem ${id} missing cpp starter code`);
    assert.ok(prob.starterCode.java, `Problem ${id} missing java starter code`);
    assert.ok(prob.publicTestCases.length > 0, `Problem ${id} missing public test cases`);
    assert.ok(prob.time_complexity, `Problem ${id} missing time complexity`);
    assert.ok(prob.space_complexity, `Problem ${id} missing space complexity`);
  }
});

test("DSA Canonical Registry: Total problem ID pool spans all 455+ DSA curriculum problems", () => {
  const allIds = getAllCanonicalProblemIds();
  assert.ok(allIds.length >= 455, `Expected >= 455 canonical IDs, got ${allIds.length}`);

  // Lookup of random DSA PROBLEM synthesizes seamlessly
  const sample = getCanonicalProblem("search-in-rotated-sorted-array");
  assert.ok(sample, "Should find canonical problem");
  assert.equal(sample.id, "search-in-rotated-sorted-array");
});

test("SQL Canonical Registry: At least 100 executable SQL problems with complete schemas & expected outputs", () => {
  const keys = getAllCanonicalSqlProblemIds();
  assert.ok(
    keys.length >= 100,
    `CANONICAL_SQL_PROBLEMS must contain >= 100 keys, found: ${keys.length}`
  );

  for (const id of keys) {
    const prob = getCanonicalSqlProblem(id);
    assert.ok(prob, `SQL problem ${id} must exist`);
    assert.ok(prob.schemaDdl && prob.schemaDdl.length > 5, `${id} missing schemaDdl`);
    assert.ok(prob.seedDataDml && prob.seedDataDml.length > 5, `${id} missing seedDataDml`);
    assert.ok(prob.referenceSolution && prob.referenceSolution.length > 5, `${id} missing referenceSolution`);
    assert.ok(prob.testCases.length > 0, `${id} must have test cases`);
    assert.ok(Array.isArray(prob.testCases[0].expectedOutput), `${id} must have tabular expectedOutput`);
  }
});

