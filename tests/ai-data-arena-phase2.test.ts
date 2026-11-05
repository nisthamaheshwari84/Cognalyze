/**
 * tests/ai-data-arena-phase2.test.ts
 * 
 * End-to-end Verification Test Suite for Phase 2 of the AI, Data & Intelligence Arena.
 * Validates:
 * 1. Sandboxed In-Memory SQLite execution (node:sqlite)
 * 2. SQL security sanitizer (blocking ATTACH, DETACH, PRAGMA)
 * 3. Deterministic rowset comparison & challenge evaluation
 * 4. Cohort & Retention Analysis live matrix calculation
 * 5. A/B Testing Diagnostics (SRM Chi-Square, Two-Sample Z-Test, 95% CI)
 * 6. Python Practice sandbox with standard library & external import notice
 * 7. Socratic AI Mentor progressive scaffolding (Levels 1-4)
 * 8. Evidence-based Student DNA synchronization and multi-tenant persistence
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  executeSqlInSandbox,
  sanitizeSqlQuery,
  areSqlOutputsEqual,
  getSqlChallengeBySlug,
  getAllSqlChallenges
} from "../lib/skills/ai-data/sql-lab-engine";

import {
  computeLiveCohortRetentionMatrix,
  evaluateCohortAnalysisInterpretation
} from "../lib/skills/ai-data/cohort-retention-engine";

import {
  computeLiveAbExperimentDiagnostics,
  evaluateAbTestDecision
} from "../lib/skills/ai-data/ab-testing-engine";

import {
  executePythonInSandbox,
  getPythonChallengeBySlug,
  getAllPythonChallenges
} from "../lib/skills/ai-data/python-lab-engine";

import { getLabMentorGuidance } from "../lib/skills/ai-data/mentor-service";
import { recordStudentAttempt, getArenaSummary, getCandidateAttempts } from "../lib/skills/ai-data/store";
import { getStudentDNAFull } from "../lib/dna/store";

describe("Phase 2: Secure In-Memory SQL Execution Engine", () => {
  test("Executes valid SQL query and returns real rows, columns, and latency", async () => {
    const res = await executeSqlInSandbox(
      "ecommerce_analytics",
      "SELECT user_id, email, signup_date FROM users ORDER BY user_id ASC LIMIT 3;"
    );

    assert.equal(res.success, true);
    assert.equal(res.status, "passed");
    assert.equal(res.rowCount, 3);
    assert.deepEqual(res.columns, ["user_id", "email", "signup_date"]);
    assert.equal(res.rows[0].user_id, 101);
    assert.ok(res.executionTimeMs >= 0);
  });

  test("Security filter blocks malicious commands (ATTACH, PRAGMA, DETACH)", async () => {
    const maliciousQueries = [
      "ATTACH DATABASE '/tmp/pwn.db' AS pwn;",
      "PRAGMA writable_schema = 1;",
      "DETACH DATABASE pwn;",
      "SELECT load_extension('exploit.so');"
    ];

    for (const sql of maliciousQueries) {
      const check = sanitizeSqlQuery(sql);
      assert.equal(check.isSafe, false, `Failed to block malicious SQL: ${sql}`);

      const execRes = await executeSqlInSandbox("ecommerce_analytics", sql);
      assert.equal(execRes.success, false);
      assert.equal(execRes.status, "security_violation");
    }
  });

  test("Reports syntax errors gracefully without crashing process", async () => {
    const res = await executeSqlInSandbox(
      "ecommerce_analytics",
      "SELECT * FROM WHERE;"
    );

    assert.equal(res.success, false);
    assert.equal(res.status, "syntax_error");
    assert.ok(res.errorMessage?.toLowerCase().includes("syntax"));
    assert.equal(res.testPassed, false);
  });

  test("Evaluates SQL Challenge: Running Revenue Window Query", async () => {
    const challenge = getSqlChallengeBySlug("sql-running-revenue-window");
    assert.ok(challenge, "Challenge sql-running-revenue-window must exist");

    // Execute reference query
    const passRes = await executeSqlInSandbox(
      challenge.datasetId,
      challenge.referenceSql,
      challenge.slug
    );

    assert.equal(passRes.success, true);
    assert.equal(passRes.testPassed, true);
    assert.equal(passRes.score, 100);

    // Execute wrong query
    const failRes = await executeSqlInSandbox(
      challenge.datasetId,
      "SELECT order_id, order_date, amount FROM orders LIMIT 5;",
      challenge.slug
    );

    assert.equal(failRes.testPassed, false);
    assert.ok(failRes.diagnostics && failRes.diagnostics.length > 0);
  });

  test("Evaluates SQL Challenge: Monthly Cohort Retention", async () => {
    const challenge = getSqlChallengeBySlug("sql-cohort-monthly-retention");
    assert.ok(challenge, "Challenge sql-cohort-monthly-retention must exist");

    const passRes = await executeSqlInSandbox(
      challenge.datasetId,
      challenge.referenceSql,
      challenge.slug
    );

    assert.equal(passRes.success, true);
    assert.equal(passRes.testPassed, true);
    assert.equal(passRes.score, 100);
  });
});

describe("Phase 2: Live Cohort & Retention Analysis Engine", () => {
  test("Computes valid triangular retention matrix from order stream", () => {
    const report = computeLiveCohortRetentionMatrix();

    assert.ok(report.matrix.length >= 4, "Must compute at least 4 cohorts");
    
    // Invariant: Period 0 retention must be exactly 100% for every cohort
    for (const row of report.matrix) {
      const period0 = row.periods.find(p => p.periodMonth === 0);
      assert.ok(period0, `Cohort ${row.cohortMonth} must have period 0`);
      assert.equal(period0.retentionRate, 100, `Period 0 retention must be 100%`);
      assert.equal(period0.activeUsers, row.initialUsers);
    }

    // Invariant: Triangular geometry - older cohorts have more periods than newer cohorts
    const firstCohort = report.matrix[0];
    const lastCohort = report.matrix[report.matrix.length - 1];
    assert.ok(
      firstCohort.periods.length >= lastCohort.periods.length,
      "Earlier cohort should have greater or equal periods than latest cohort"
    );
  });

  test("Evaluates Cohort Interpretation Submission", () => {
    // High-quality analytical response
    const goodEval = evaluateCohortAnalysisInterpretation({
      selectedCohortMonth: "2026-01",
      predictedRetentionBehavior: "Retention stabilizes around month 2 and month 3, forming an asymptote parallel to the x-axis indicating core product-market fit.",
      identifiedDropoffReason: "The steep drop from month 0 to month 1 represents initial onboarding friction and lack of early activation loops.",
      recommendedIntervention: "Introduce day-3 behavioral onboarding email nudge and milestone checklists to lift initial activation."
    });

    assert.equal(goodEval.passed, true);
    assert.ok(goodEval.score >= 80);
    assert.ok(goodEval.keyInsights.length >= 2);

    // Superficial response
    const badEval = evaluateCohortAnalysisInterpretation({
      selectedCohortMonth: "2026-01",
      predictedRetentionBehavior: "Users went down.",
      identifiedDropoffReason: "People left.",
      recommendedIntervention: "Do marketing."
    });

    assert.equal(badEval.passed, false);
    assert.ok(badEval.score < 70);
  });
});

describe("Phase 2: A/B Testing Diagnostics Engine", () => {
  test("Computes Sample Ratio Mismatch (SRM) with Chi-Square and Two-Sample Z-Test", () => {
    const diagnostics = computeLiveAbExperimentDiagnostics(0.05);

    // Verify Control and Treatment metrics
    assert.ok(diagnostics.control!.visitors > 0);
    assert.ok(diagnostics.treatment!.visitors > 0);
    assert.ok(diagnostics.control!.conversions > 0);
    assert.ok(diagnostics.treatment!.conversions > 0);

    // Verify SRM test output
    assert.equal(typeof diagnostics.srm!.chiSquareStatistic, "number");
    assert.equal(typeof diagnostics.srm!.pValue, "number");
    assert.ok(diagnostics.srm!.pValue >= 0 && diagnostics.srm!.pValue <= 1);

    // Verify Two-sample Z-Test output
    assert.equal(typeof diagnostics.zTest!.zScore, "number");
    assert.equal(typeof diagnostics.zTest!.pValue, "number");
    assert.equal(typeof diagnostics.zTest!.isStatisticallySignificant, "boolean");

    // Verify 95% Confidence Interval
    assert.ok(diagnostics.confidenceInterval95.lowerPct! < diagnostics.confidenceInterval95.upperPct!);
  });

  test("Evaluates Executive Rollout Decision Rubric", () => {
    // Legitimate decision matching data
    const goodDecision = evaluateAbTestDecision({
      candidateId: "cand-test-ab",
      recommendedAction: "rollout",
      srmDetected: false,
      statisticalSignificanceVerdict: "statistically_significant",
      businessSignificanceVerdict: "exceeds_mde",
      justification: "Chi-square SRM is clean (p > 0.05). Two-sample Z-test confirms statistically significant uplift (+15.2%, p < 0.05), and 95% CI lower bound is above the 5% MDE threshold."
    });

    assert.equal(goodDecision.decisionVerdict, "correct");
    assert.ok(goodDecision.score >= 85);
    assert.ok(goodDecision.strengths.length >= 2);

    // Incorrect decision overlooking statistical significance
    const badDecision = evaluateAbTestDecision({
      candidateId: "cand-test-ab",
      recommendedAction: "reject",
      srmDetected: false,
      statisticalSignificanceVerdict: "not_significant",
      businessSignificanceVerdict: "below_mde",
      justification: "I do not think we should change the website."
    });

    assert.equal(badDecision.decisionVerdict, "incorrect");
    assert.ok(badDecision.score < 60);
    assert.ok(badDecision.missingConsiderations.length > 0);
  });
});

describe("Phase 2: Python Practice Sandbox & Import Filtering", () => {
  test("Executes pure Python standard library statistics algorithm", async () => {
    const challenge = getPythonChallengeBySlug("py-summary-statistics");
    assert.ok(challenge, "Challenge py-summary-statistics must exist");

    const execRes = await executePythonInSandbox(
      challenge.referenceSolution,
      challenge.slug
    );

    assert.equal(execRes.success, true);
    assert.equal(execRes.status, "passed");
    assert.equal(execRes.score, 100);
    assert.ok(execRes.testResults?.every((t: any) => t.passed));
  });

  test("Transparently reports notice on 3rd-party library imports without crashing", async () => {
    const codeWithPandas = `import pandas as pd\ndf = pd.DataFrame([1, 2, 3])\nprint(df)`;
    const res = await executePythonInSandbox(codeWithPandas);

    assert.equal(res.success, false);
    assert.equal(res.status, "environment_notice");
    assert.ok(res.stderr.includes("3rd-party modules"));
  });

  test("Executes rolling average algorithm with time boundary validation", async () => {
    const challenge = getPythonChallengeBySlug("py-moving-average");
    assert.ok(challenge, "Challenge py-moving-average must exist");

    const execRes = await executePythonInSandbox(
      challenge.referenceSolution,
      challenge.slug
    );

    assert.equal(execRes.success, true);
    assert.equal(execRes.status, "passed");
    assert.equal(execRes.score, 100);
  });
});

describe("Phase 2: Socratic AI Mentor Progressive Scaffolding", () => {
  test("Level 1 provides conceptual framing without giving away code", () => {
    const hint = getLabMentorGuidance({
      labType: "sql",
      challengeSlug: "sql-cohort-monthly-retention",
      hintLevel: 1
    });

    assert.equal(hint.hintLevel, 1);
    assert.equal(hint.isAssisted, false);
    assert.ok(!hint.guidanceText.includes("SELECT"));
    assert.ok(hint.socraticQuestions.length > 0);
  });

  test("Level 4 provides full solution and marks attempt as assisted", () => {
    const hint = getLabMentorGuidance({
      labType: "sql",
      challengeSlug: "sql-cohort-monthly-retention",
      hintLevel: 4
    });

    assert.equal(hint.hintLevel, 4);
    assert.equal(hint.isAssisted, true);
    assert.ok(hint.guidanceText.includes("SELECT"));
    assert.ok(hint.guidanceText.includes("assisted in your learning diagnostics"));
  });
});

describe("Phase 2: End-to-End Persistence & Student DNA Synchronization", () => {
  const candidateId = `cand-phase2-sync-${Date.now()}`;

  test("Passing lab attempt updates Student DNA with verified evidence", async () => {
    const res = await recordStudentAttempt({
      candidateId,
      trackSlug: "data_science_analytics",
      lessonSlug: "sql-for-analytics-aggregations-and-joins",
      exerciseType: "code_lab",
      score: 95,
      passed: true,
      assisted: false,
      dimensions: {
        sql_accuracy: 95,
        execution_efficiency: 90
      }
    });

    assert.equal(res.attempt.passed, true);
    assert.ok(res.dnaSync?.evidenceId, "Passing verified attempt must generate DNA evidence ID");

    // Verify DNA store reflects the recorded competency
    const dna = await getStudentDNAFull(candidateId);
    assert.ok(dna, "Candidate DNA must exist");
    
    // Check summary calculation
    const summary = await getArenaSummary(candidateId);
    assert.ok(summary.completedLessonsCount >= 1);
    assert.ok(summary.verifiedEvidenceCount >= 1);
    assert.ok(summary.overallScoreAverage >= 90);
  });

  test("Failed lab attempt is logged without granting false Student DNA mastery", async () => {
    const failedRes = await recordStudentAttempt({
      candidateId,
      trackSlug: "data_science_analytics",
      lessonSlug: "cohort-retention-analysis-and-churn",
      exerciseType: "code_lab",
      score: 25,
      passed: false,
      assisted: false
    });

    assert.equal(failedRes.attempt.passed, false);
    assert.equal(failedRes.dnaSync?.evidenceId, undefined, "Failed attempt must not create evidence ID");
    assert.equal(failedRes.dnaSync?.competenciesUpdated.length, 0);

    const attempts = getCandidateAttempts(candidateId);
    const found = attempts.find(a => a.id === failedRes.attempt.id);
    assert.ok(found, "Attempt must still be preserved in candidate diagnostic history");
  });
});
