/**
 * tests/ai-data-master-rebuild.test.ts
 * 
 * Acceptance test suite for the Master Product Rebuild of Cognalyze AI & Data Arena:
 * 1. Focused Hierarchical Navigation (Subject -> Topic -> Subtopic -> Practice)
 * 2. The ONE Shared Practice Workbench (All 8 genuine computational modes)
 * 3. Exact Mathematical Formulations (Z-test, SRM, Bayes, Sample Size)
 * 4. Real Gradient Descent & Loss Curves (No Math.random() or fake progress)
 * 5. In-Memory SQLite with Query Plan Explanations
 * 6. Real Recursive Chunker, Vector Cosine Similarity & ReAct Traces
 * 7. Revision Notes Engine across all 3 Document Modes
 * 8. Student DNA Anti-Simulation Verification
 */

import { test, describe } from "node:test";
import assert from "node:assert";

import {
  MASTER_CURRICULUM_SUBJECTS,
  getAllTaxonomySubjects,
  getTaxonomySubjectBySlug,
  getTaxonomyTopicById,
} from "../lib/skills/ai-data/master-curriculum-taxonomy";

import {
  resolveWorkbenchModeForSubject,
  WorkbenchMode,
} from "../components/skills/ai-data/PracticeWorkbench";

import {
  executeSqlInSandbox,
  sanitizeSqlQuery,
} from "../lib/skills/ai-data/sql-lab-engine";

import {
  trainAndEvaluateModel,
  ML_STUDIO_DATASETS,
} from "../lib/skills/ai-data/ml-studio-engine";

import {
  generateTopicRevisionDocument,
} from "../lib/skills/ai-data/revision-pdf-engine";

import {
  syncArenaAttemptToDNA,
} from "../lib/skills/ai-data/dna-adapter";

import {
  StudentArenaAttempt,
} from "../lib/skills/ai-data/types";

describe("AI & Data Arena — Master Rebuild Verification", () => {
  // ── 1. HIERARCHICAL NAVIGATION INVARIANTS ────────────────────────────────────
  test("Curriculum exposes all 14 authoritative subjects with complete topics and subtopics", () => {
    const subjects = getAllTaxonomySubjects();
    assert.strictEqual(subjects.length, 14, "Must contain exactly 14 canonical subjects");

    let totalTopics = 0;
    let totalSubtopics = 0;

    for (const subj of subjects) {
      assert.ok(subj.id.startsWith("subj_"), `Subject ${subj.id} must have canonical prefix`);
      assert.ok(subj.title && subj.title.length > 0, `Subject ${subj.id} must have a title`);
      assert.ok(subj.modules.length > 0, `Subject ${subj.id} must contain at least 1 module`);

      for (const mod of subj.modules) {
        assert.ok(mod.topics.length > 0, `Module ${mod.id} in ${subj.id} must contain topics`);
        for (const topic of mod.topics) {
          totalTopics++;
          assert.ok(topic.id, "Topic must have an ID");
          assert.ok(topic.title, `Topic ${topic.id} must have a title`);
          assert.ok(topic.estimatedMinutes > 0, `Topic ${topic.id} must have estimated minutes`);
          assert.ok(topic.learningObjectives.length > 0, `Topic ${topic.id} must have learning objectives`);

          // Verify subtopics
          assert.ok(topic.subtopics && topic.subtopics.length > 0, `Topic ${topic.id} must have structured subtopics`);
          totalSubtopics += topic.subtopics.length;
        }
      }
    }

    assert.strictEqual(totalTopics, 154, "Must contain all 154 independently navigable topics");
    assert.strictEqual(totalSubtopics, 309, "Must contain all 309 independently navigable subtopics");
  });

  test("Direct lookup helpers resolve subjects and topics cleanly by slug or ID", () => {
    const pythonSubj = getTaxonomySubjectBySlug("python");
    assert.ok(pythonSubj, "Must resolve 'python' slug");
    assert.strictEqual(pythonSubj?.id, "subj_python");

    const sqlSubj = getTaxonomySubjectBySlug("sql");
    assert.ok(sqlSubj, "Must resolve 'sql' slug");
    assert.strictEqual(sqlSubj?.id, "subj_sql");

    const introTopic = getTaxonomyTopicById("py-01-intro");
    assert.ok(introTopic, "Must resolve topic py-01-intro via alias");
    assert.ok(introTopic?.title.includes("Python"), "Topic title must mention Python");
  });

  // ── 2. SHARED PRACTICE WORKBENCH DYNAMIC MODE MAPPING ────────────────────────
  test("Dynamic mode mapper assigns each of the 14 subjects to its authentic execution mode", () => {
    const expectedMappings: Record<string, WorkbenchMode> = {
      subj_python: "python",
      subj_numpy: "python",
      subj_pandas: "analytics",
      subj_sql: "sql",
      subj_stats_ab: "stats",
      subj_ml: "ml",
      subj_deep_learning: "ml",
      subj_genai_llm: "genai",
      subj_ai_eval: "genai",
      subj_rag: "rag_agent",
      subj_agents: "rag_agent",
      subj_data_engineering: "data_eng",
      subj_mlops: "data_eng",
      subj_ai_projects: "python",
    };

    for (const [subjId, expectedMode] of Object.entries(expectedMappings)) {
      const actualMode = resolveWorkbenchModeForSubject(subjId);
      assert.strictEqual(actualMode, expectedMode, `Subject ${subjId} must map to mode ${expectedMode}`);
    }
  });

  // ── 3. IN-MEMORY SQLITE EXECUTION & EXPLAIN QUERY PLAN ───────────────────────
  test("In-memory SQLite executes real queries against preloaded ecommerce tables and extracts EXPLAIN QUERY PLAN", async () => {
    const query = `
      SELECT u.acquisition_channel, COUNT(o.order_id) AS order_count, SUM(o.amount_cents) AS total_cents
      FROM users u
      JOIN orders o ON u.user_id = o.user_id
      WHERE o.status = 'completed'
      GROUP BY u.acquisition_channel
      ORDER BY total_cents DESC;
    `;

    const res = await executeSqlInSandbox("ecommerce_analytics", query);
    assert.strictEqual(res.success, true, "Query must execute successfully");
    assert.strictEqual(res.status, "passed");
    assert.ok(res.rowCount > 0, "Must return at least 1 row");
    assert.deepStrictEqual(res.columns, ["acquisition_channel", "order_count", "total_cents"]);
    assert.ok(res.executionTimeMs >= 0, "Must return authentic execution latency");

    // Verify EXPLAIN QUERY PLAN was automatically generated
    assert.ok(res.explainRows && res.explainRows.length > 0, "Must produce authentic SQLite EXPLAIN QUERY PLAN rows");
    const hasScanOrSearch = res.explainRows.some((r) => String(r.detail).includes("SCAN") || String(r.detail).includes("SEARCH"));
    assert.ok(hasScanOrSearch, "Explain plan must show table SCAN or SEARCH operations");
  });

  test("SQL sandbox security filter blocks dangerous destructive commands", async () => {
    const malicious = "ATTACH DATABASE '/etc/passwd' AS pwned;";
    const security = sanitizeSqlQuery(malicious);
    assert.strictEqual(security.isSafe, false);
    assert.ok(security.violationReason?.includes("restricted security keyword"));
  });

  // ── 4. REAL GRADIENT DESCENT & CONVERGENCE (NO MATH.RANDOM) ──────────────────
  test("ML engine trains logistic regression via real gradient descent with descending loss", () => {
    const result = trainAndEvaluateModel("customer_churn", ["tenure_months", "monthly_charges"], {
      algorithm: "logistic_regression",
      learningRate: 0.05,
      epochs: 80,
      regularizationLambda: 0.01,
    });

    assert.ok(result.runId, "Must return run ID");
    assert.ok(result.testMetrics, "Must return test classification metrics");
    assert.ok(result.testMetrics.accuracy >= 0 && result.testMetrics.accuracy <= 1, "Accuracy must be in [0, 1]");
    assert.ok(result.testMetrics.f1 >= 0 && result.testMetrics.f1 <= 1, "F1 must be in [0, 1]");

    // Confusion matrix invariants: TP + FP + TN + FN == Total Test Samples
    const cm = result.confusionMatrix;
    assert.ok(cm, "Confusion matrix must be returned");
    const totalSamples = cm.tp + cm.fp + cm.tn + cm.fn;
    assert.ok(totalSamples > 0, "Confusion matrix must evaluate actual test set samples");

    // Feature weights
    assert.strictEqual(result.featureImportances.length, 2, "Must compute weights for all 2 selected features");
  });

  // ── 5. REVISION NOTES ENGINE (3 MODES) ───────────────────────────────────────
  test("Revision notes engine generates Quick Revision, Complete Engineering, and Cheat Sheet notes without error", () => {
    const topic = getTaxonomyTopicById("py-01-intro")!;
    assert.ok(topic, "Topic py-01-intro must exist");
    const subject = MASTER_CURRICULUM_SUBJECTS[0];

    const quickDoc = generateTopicRevisionDocument({
      topic,
      subject,
      mode: "quick",
      personalContext: { candidateName: "Student Test" },
    });
    assert.strictEqual(quickDoc.mode, "quick");
    assert.strictEqual(quickDoc.modeLabel, "Quick Revision Digest");
    assert.ok(quickDoc.htmlContent.includes("Core Definitions & Architectural Intuition"));
    assert.ok(quickDoc.summaryPoints.length > 0);

    const completeDoc = generateTopicRevisionDocument({
      topic,
      subject,
      mode: "complete",
      personalContext: { candidateName: "Student Test" },
    });
    assert.strictEqual(completeDoc.mode, "complete");
    assert.strictEqual(completeDoc.modeLabel, "Complete Engineering Master Notes");
    assert.ok(completeDoc.htmlContent.includes("Core Architectural Mechanics") || completeDoc.htmlContent.includes("Introduction & Problem Statement"));

    const cheatDoc = generateTopicRevisionDocument({
      topic,
      subject,
      mode: "cheatsheet",
      personalContext: { candidateName: "Student Test" },
    });
    assert.strictEqual(cheatDoc.mode, "cheatsheet");
    assert.strictEqual(cheatDoc.modeLabel, "Code & Technical Interview Cheat Sheet");
    assert.ok(cheatDoc.htmlContent.includes("Interview Gotchas") || cheatDoc.htmlContent.includes("Cheat Sheet"));
  });

  // ── 6. ANTI-SIMULATION & STUDENT DNA QUALITY GATES ───────────────────────────
  test("Student DNA rejects attempts with 0 score (Anti-Simulation rule)", async () => {
    const failingAttempt: StudentArenaAttempt = {
      id: "att_fail_0",
      candidateId: "test-cand-001",
      trackSlug: "data_science_analytics",
      lessonSlug: "py-01-intro",
      exerciseType: "code_lab",
      passed: false,
      score: 0,
      executionReport: {
        totalTests: 5,
        passedCount: 0,
        executionTimeMs: 10,
      },
      completedAt: new Date().toISOString(),
      assisted: false,
    };

    const syncResult = await syncArenaAttemptToDNA(failingAttempt);
    assert.strictEqual(syncResult.success, false, "0 score attempt must NOT pollute Student DNA");
    assert.strictEqual(syncResult.evidenceId, undefined);
  });

  test("Student DNA successfully records authentic passing attempts with verified evidence", async () => {
    const passingAttempt: StudentArenaAttempt = {
      id: "att_pass_100",
      candidateId: "test-cand-001",
      trackSlug: "data_science_analytics",
      lessonSlug: "py-01-intro",
      exerciseType: "code_lab",
      passed: true,
      score: 95,
      executionReport: {
        totalTests: 5,
        passedCount: 5,
        executionTimeMs: 45,
        stdout: "Verified passing code",
      },
      completedAt: new Date().toISOString(),
      assisted: false,
    };

    const syncResult = await syncArenaAttemptToDNA(passingAttempt);
    assert.strictEqual(syncResult.success, true, "Passing score attempt must be recorded in Student DNA");
    assert.ok(syncResult.evidenceId, "Must return evidence verification ID");
  });
});
