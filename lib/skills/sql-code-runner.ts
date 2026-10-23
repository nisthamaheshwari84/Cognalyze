/**
 * lib/skills/sql-code-runner.ts
 * Real, genuine in-memory SQL execution engine using Node.js built-in DatabaseSync (node:sqlite).
 * Server-only module.
 */

// @ts-ignore
import { DatabaseSync } from "node:sqlite";
import {
  SqlColumn,
  SqlTableSchema,
  SqlTestCase,
  SqlProblemDefinition,
  SqlExecutionOutcome,
  SqlRunResult,
  CANONICAL_SQL_PROBLEMS,
} from "./sql-canonical-problems";

export type {
  SqlColumn,
  SqlTableSchema,
  SqlTestCase,
  SqlProblemDefinition,
  SqlExecutionOutcome,
  SqlRunResult,
};

export { CANONICAL_SQL_PROBLEMS };

/**
 * Normalizes values for deterministic comparison between actual and expected rows.
 */
function normalizeSqlRow(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    const cleanKey = key.trim();
    if (val === null || val === undefined) {
      normalized[cleanKey.toLowerCase()] = null;
    } else if (typeof val === "number") {
      normalized[cleanKey.toLowerCase()] = Number(val);
    } else {
      normalized[cleanKey.toLowerCase()] = String(val).trim();
    }
  }
  return normalized;
}

function areRowSetsEqual(
  actual: Record<string, any>[],
  expected: Record<string, any>[],
  strictOrder = false
): boolean {
  if (actual.length !== expected.length) return false;

  const normActual = actual.map(normalizeSqlRow);
  const normExpected = expected.map(normalizeSqlRow);

  if (strictOrder) {
    for (let i = 0; i < normActual.length; i++) {
      const a = normActual[i];
      const e = normExpected[i];
      const aKeys = Object.keys(a).sort();
      const eKeys = Object.keys(e).sort();
      if (aKeys.length !== eKeys.length) return false;
      for (const k of eKeys) {
        if (a[k] !== e[k]) return false;
      }
    }
    return true;
  }

  // Multiset comparison
  const matched = new Array(normExpected.length).fill(false);
  for (const aRow of normActual) {
    let found = false;
    for (let j = 0; j < normExpected.length; j++) {
      if (matched[j]) continue;
      const eRow = normExpected[j];
      const eKeys = Object.keys(eRow);
      const aKeys = Object.keys(aRow);
      if (eKeys.length !== aKeys.length) continue;
      const allMatch = eKeys.every(k => aRow[k] === eRow[k]);
      if (allMatch) {
        matched[j] = true;
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return matched.every(Boolean);
}

/**
 * Executes user SQL query against canonical problem test cases.
 */
export async function executeSqlQuery(
  problemId: string,
  userSql: string,
  options: { runHiddenTests?: boolean; timeoutMs?: number } = {}
): Promise<SqlRunResult> {
  const startTime = Date.now();
  const problem = CANONICAL_SQL_PROBLEMS[problemId];

  if (!problem) {
    return {
      problemId,
      passedCount: 0,
      totalCount: 0,
      allPassed: false,
      status: "syntax_error",
      outcomes: [],
      overallTimeMs: 0,
      error: `SQL problem not found in canonical registry: ${problemId}`,
    };
  }

  const cleanSql = (userSql || "").trim();
  if (!cleanSql) {
    return {
      problemId,
      passedCount: 0,
      totalCount: problem.testCases.length,
      allPassed: false,
      status: "syntax_error",
      outcomes: [],
      overallTimeMs: 0,
      error: "Query source cannot be empty.",
    };
  }

  const testCases = problem.testCases.filter(tc => options.runHiddenTests || !tc.isHidden);
  const outcomes: SqlExecutionOutcome[] = [];
  let passedCount = 0;

  for (const tc of testCases) {
    const tcStart = Date.now();
    let db: DatabaseSync | null = null;
    try {
      db = new DatabaseSync(":memory:");

      for (const stmt of tc.setupDdl) {
        db.exec(stmt);
      }

      const prepared = db.prepare(cleanSql);
      const rawRows = prepared.all() as Record<string, any>[];
      const executionTimeMs = Date.now() - tcStart;

      const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
      const passed = areRowSetsEqual(rawRows, tc.expectedOutput, false);

      if (passed) passedCount++;

      outcomes.push({
        testCaseId: tc.id,
        status: passed ? "passed" : "failed",
        passed,
        actualRows: rawRows,
        expectedRows: tc.expectedOutput,
        columns,
        executionTimeMs,
      });
    } catch (err: any) {
      const executionTimeMs = Date.now() - tcStart;
      const msg = err?.message || String(err);
      const isSyntax = msg.toLowerCase().includes("syntax") || msg.toLowerCase().includes("near");

      outcomes.push({
        testCaseId: tc.id,
        status: isSyntax ? "syntax_error" : "runtime_error",
        passed: false,
        expectedRows: tc.expectedOutput,
        errorMessage: msg,
        executionTimeMs,
      });
    } finally {
      if (db) {
        try {
          db.close();
        } catch {}
      }
    }
  }

  const overallTimeMs = Date.now() - startTime;
  const allPassed = passedCount === testCases.length && testCases.length > 0;

  let overallStatus: SqlRunResult["status"] = "passed";
  if (!allPassed) {
    const hasSyntax = outcomes.some(o => o.status === "syntax_error");
    const hasRuntime = outcomes.some(o => o.status === "runtime_error");
    overallStatus = hasSyntax ? "syntax_error" : hasRuntime ? "runtime_error" : "failed";
  }

  return {
    problemId,
    passedCount,
    totalCount: testCases.length,
    allPassed,
    status: overallStatus,
    outcomes,
    overallTimeMs,
  };
}
