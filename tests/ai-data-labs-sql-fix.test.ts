/**
 * tests/ai-data-labs-sql-fix.test.ts
 * 
 * Verifies Phase 2 Labs & API Payload Fixes:
 * 1. GET /api/skills/ai-data exposes `labs` object with sqlChallenges, pythonChallenges, datasets.
 * 2. SQL Challenges have real schemas, starter SQL, and target tables.
 * 3. Datasets contain tables and column types for in-memory SQLite schema explorer.
 * 4. POST /api/skills/ai-data execute_pipeline handles `injectFailure` end-to-end.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { GET, POST } from "../app/api/skills/ai-data/route";
import { getAllSqlChallenges, executeSqlInSandbox } from "../lib/skills/ai-data/sql-lab-engine";
import { getAllPythonChallenges, executePythonInSandbox } from "../lib/skills/ai-data/python-lab-engine";
import { getAllAnalyticsDatasets, getAnalyticsDataset } from "../lib/skills/ai-data/datasets";

describe("Phase 2: Labs API & Execution Sandbox Fixes", () => {
  test("GET /api/skills/ai-data returns `labs` containing SQL challenges, Python challenges, and datasets", async () => {
    const req = new Request("http://localhost:3000/api/skills/ai-data?candidateId=student-test-nav");
    const res = await GET(req as any);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.labs, "GET response must include `labs` property");
    assert.ok(Array.isArray(data.labs.sqlChallenges), "labs.sqlChallenges must be an array");
    assert.ok(data.labs.sqlChallenges.length >= 2, "Must contain at least 2 SQL challenges");
    assert.ok(Array.isArray(data.labs.pythonChallenges), "labs.pythonChallenges must be an array");
    assert.ok(data.labs.pythonChallenges.length >= 2, "Must contain at least 2 Python challenges");
    assert.ok(Array.isArray(data.labs.datasets), "labs.datasets must be an array");
    assert.ok(data.labs.datasets.length >= 1, "Must contain at least 1 analytics dataset");

    // Verify first SQL challenge properties
    const sql1 = data.labs.sqlChallenges[0];
    assert.ok(sql1.slug, "SQL challenge must have a slug");
    assert.ok(sql1.title, "SQL challenge must have a title");
    assert.ok(sql1.starterSql, "SQL challenge must have starter SQL");
    assert.ok(sql1.datasetId, "SQL challenge must specify datasetId");

    // Verify datasets schema explorer
    const ds1 = data.labs.datasets[0];
    assert.ok(ds1.tables.length > 0, "Dataset must declare tables");
    for (const table of ds1.tables) {
      assert.ok(table.tableName, "Table must have tableName");
      assert.ok(table.columns.length > 0, "Table must declare columns");
      for (const col of table.columns) {
        assert.ok(col.name, "Column must have a name");
        assert.ok(col.type, "Column must have a type");
      }
    }
  });

  test("In-memory SQLite executes SQL challenge starter queries without crashes", async () => {
    const challenges = getAllSqlChallenges();
    assert.ok(challenges.length >= 2);

    for (const chal of challenges) {
      const res = await executeSqlInSandbox(chal.datasetId, chal.referenceSql, chal.slug);
      assert.strictEqual(res.success, true, `Reference SQL for ${chal.slug} must succeed`);
      assert.strictEqual(res.status, "passed", `Reference SQL for ${chal.slug} must pass tests`);
      assert.ok(res.rows.length > 0, `Query for ${chal.slug} must return rows`);
      assert.ok(res.columns.length > 0, `Query for ${chal.slug} must return columns`);
    }
  });

  test("POST /api/skills/ai-data execute_pipeline respects injectFailure parameter", async () => {
    const samplePipeline = {
      id: "pipe-test-1",
      name: "Test Ingestion Pipeline",
      description: "Pipeline with quality check",
      stages: [
        {
          id: "stg-src",
          name: "Source",
          type: "source_ingest" as const,
          config: {},
          dependsOn: []
        },
        {
          id: "stg-filter",
          name: "Filter Valid Orders",
          type: "filtering" as const,
          config: { filter_column: "status", allowed_values: ["completed"] },
          dependsOn: ["stg-src"]
        },
        {
          id: "stg-quality",
          name: "Quality Gate",
          type: "quality_check" as const,
          config: { assert_positive_amount: true },
          dependsOn: ["stg-filter"]
        }
      ]
    };

    // 1. Clean run (injectFailure: false)
    const reqClean = new Request("http://localhost:3000/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "execute_pipeline",
        pipeline: samplePipeline,
        injectFailure: false
      })
    });
    const resClean = await POST(reqClean as any);
    const dataClean = await resClean.json();
    assert.strictEqual(dataClean.success, true);
    assert.strictEqual(dataClean.result.success, true, "Pipeline without injected fault must succeed");

    // 2. Injected failure run (injectFailure: true)
    const reqFault = new Request("http://localhost:3000/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "execute_pipeline",
        pipeline: samplePipeline,
        injectFailure: true
      })
    });
    const resFault = await POST(reqFault as any);
    const dataFault = await resFault.json();
    assert.strictEqual(dataFault.success, true);
    assert.strictEqual(dataFault.result.success, false, "Pipeline with injected fault must fail at quality gate");
    assert.match(dataFault.result.error, /Data Quality Breach/i, "Error message must report quality gate failure");
  });
});

