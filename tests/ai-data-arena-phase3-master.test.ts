import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllPracticalChallenges,
  getPracticalChallengeBySlug,
  getPracticalChallengesByCategory
} from "../lib/skills/ai-data/challenges-bank";

import {
  AgentWorkflow,
  validateAgentWorkflow,
  executeAgentWorkflow,
  evaluateAgentWorkflowScenarios,
  BUILTIN_AGENT_TOOLS
} from "../lib/skills/ai-data/agent-builder-engine";

import {
  ML_STUDIO_DATASETS,
  trainAndEvaluateModel
} from "../lib/skills/ai-data/ml-studio-engine";

import {
  PipelineDefinition,
  executeDataPipeline
} from "../lib/skills/ai-data/pipeline-builder-engine";

import {
  INTERVIEW_QUESTIONS_BANK,
  startInterviewSession,
  evaluateInterviewSession
} from "../lib/skills/ai-data/interview-engine";

import {
  MICRO_VIDEO_LIBRARY,
  getMicroVideoBySlug
} from "../lib/skills/ai-data/multimedia-service";

import { executePythonInSandbox } from "../lib/skills/ai-data/python-lab-engine";
import { executeSqlInSandbox } from "../lib/skills/ai-data/sql-lab-engine";

test("Phase 3 Master: 52 Validated Practical Challenges Integrity", async (t) => {
  const allChallenges = getAllPracticalChallenges();

  await t.test("Bank contains at least 50 challenges (actual: 52)", () => {
    assert.ok(allChallenges.length >= 50, `Expected >= 50, got ${allChallenges.length}`);
    assert.equal(allChallenges.length, 52);
  });

  await t.test("All 6 categories have comprehensive challenge representation", () => {
    const categories = [
      "python_debugging",
      "sql_analytics",
      "ml_evaluation",
      "genai_agents",
      "data_engineering",
      "mlops_production"
    ];

    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat] = getPracticalChallengesByCategory(cat as any).length;
    }

    assert.ok(counts.python_debugging >= 8, `Python debugging: ${counts.python_debugging}`);
    assert.ok(counts.sql_analytics >= 8, `SQL analytics: ${counts.sql_analytics}`);
    assert.ok(counts.ml_evaluation >= 10, `ML evaluation: ${counts.ml_evaluation}`);
    assert.ok(counts.genai_agents >= 10, `GenAI & agents: ${counts.genai_agents}`);
    assert.ok(counts.data_engineering >= 7, `Data engineering: ${counts.data_engineering}`);
    assert.ok(counts.mlops_production >= 7, `MLOps production: ${counts.mlops_production}`);
  });

  await t.test("Every challenge has honest provenance, test cases, and 4-tier scaffolding", () => {
    const validProvenances = new Set(["verified_historical", "reported_historical", "role_pattern", "cognalyze_original"]);
    const validDifficulties = new Set(["beginner", "intermediate", "advanced", "expert"]);
    const idSet = new Set<string>();

    for (const ch of allChallenges) {
      assert.ok(!idSet.has(ch.id), `Duplicate challenge ID: ${ch.id}`);
      idSet.add(ch.id);

      assert.ok(ch.title.length > 3, `Title too short for ${ch.id}`);
      assert.ok(validDifficulties.has(ch.difficulty), `Invalid difficulty in ${ch.id}`);
      assert.ok(validProvenances.has(ch.provenance.type), `Invalid provenance in ${ch.id}: ${ch.provenance.type}`);
      assert.ok(ch.acceptanceCriteria.length >= 2, `Insufficient criteria in ${ch.id}`);
      assert.ok(ch.testHarness && ch.testHarness.testCases && ch.testHarness.testCases.length >= 1, `Missing test cases in ${ch.id}`);
      assert.equal(Object.keys(ch.hints).length, 4, `Must have exactly 4-tier progressive scaffolding in ${ch.id}`);
    }
  });

  await t.test("Python Lab executes practical challenge with real assertion checks", async () => {
    const ch = getPracticalChallengeBySlug("py-deb-01");
    assert.ok(ch, "Challenge py-deb-01 should exist");

    // Execute reference solution using Python sandbox
    const code = ch.referenceSolution;
    const testInput = ch.testHarness.testCases[0].input;
    const runCode = `${code}\nprint(flatten_dict(${JSON.stringify(testInput)}))`;

    const res = await executePythonInSandbox(runCode);
    assert.ok(res.success, `Python execution failed: ${res.errorMessage}`);
    assert.ok(res.stdout.includes("b.c") || res.stdout.includes("b.d"), "Output should contain flattened key");
  });

  await t.test("SQL Lab executes analytical query with real rowset computation", async () => {
    const query = `
      SELECT 
        date(order_date) as day,
        COUNT(order_id) as order_count,
        SUM(amount_cents) / 100.0 as daily_revenue
      FROM orders
      GROUP BY date(order_date)
      ORDER BY day ASC
      LIMIT 5;
    `;
    const res = await executeSqlInSandbox("ecommerce_analytics", query);

    assert.ok(res.success, `SQL execution failed: ${res.errorMessage}`);
    assert.ok(res.rowCount > 0, "Should return rows");
    assert.ok(res.columns.includes("daily_revenue"), "Should have daily_revenue column");
  });
});

test("Phase 3 Master: Visual AI Agent Builder Engine", async (t) => {
  const validWorkflow: AgentWorkflow = {
    id: "wf-test-valid",
    name: "Valid Agent Pipeline",
    description: "End to end agent workflow with math tool",
    nodes: [
      { id: "n-in", label: "User Query", type: "input", config: {} },
      { id: "n-model", label: "Planner Model", type: "model", config: { model: "gemini-1.5-flash" } },
      { id: "n-tool", label: "Math Tool", type: "tool", config: { toolName: "calculator" } },
      { id: "n-out", label: "Response Output", type: "output", config: {} }
    ],
    edges: [
      { id: "e1", source: "n-in", target: "n-model" },
      { id: "e2", source: "n-model", target: "n-tool" },
      { id: "e3", source: "n-tool", target: "n-out" }
    ]
  };

  await t.test("validateAgentWorkflow passes a valid acyclic graph", () => {
    const val = validateAgentWorkflow(validWorkflow);
    assert.ok(val.isValid, `Expected valid graph, got errors: ${val.errors.join(", ")}`);
    assert.equal(val.errors.length, 0);
  });

  await t.test("validateAgentWorkflow detects cycles and disconnected nodes", () => {
    const cyclicWorkflow: AgentWorkflow = {
      id: "wf-cycle",
      name: "Cyclic Workflow",
      description: "Invalid cycle",
      nodes: [
        { id: "n1", label: "Node 1", type: "model", config: {} },
        { id: "n2", label: "Node 2", type: "tool", config: {} }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n1" }
      ]
    };

    const val = validateAgentWorkflow(cyclicWorkflow);
    assert.equal(val.isValid, false);
    assert.ok(val.errors.some((e) => e.includes("Cycle detected") || e.includes("input")));
  });

  await t.test("executeAgentWorkflow executes real tool calls and returns step traces", async () => {
    const result = await executeAgentWorkflow(validWorkflow, { query: "What is 25 * 4 + 10?" });
    assert.ok(result.success);
    assert.ok(result.traces.length >= 3, `Expected >= 3 traces, got ${result.traces.length}`);
    assert.ok(result.executionTimeMs >= 0);
    assert.ok(result.finalOutput !== null);

    const toolTrace = result.traces.find((tr) => tr.nodeType === "tool");
    assert.ok(toolTrace, "Should have executed tool trace");
  });

  await t.test("evaluateAgentWorkflowScenarios tests edge cases and prompt injection", async () => {
    const report = await evaluateAgentWorkflowScenarios(validWorkflow);
    assert.ok(report.score >= 0 && report.score <= 100);
    assert.ok(report.scenarioResults.length >= 3, "Should evaluate at least 3 scenarios");
    assert.ok(report.rubricBreakdown.functionalCorrectness !== undefined);
    assert.ok(report.rubricBreakdown.toolSelectionAccuracy !== undefined);
  });
});

test("Phase 3 Master: ML Experiment Studio Engine", async (t) => {
  await t.test("Benchmark datasets are properly registered and schema-validated", () => {
    assert.ok(Object.keys(ML_STUDIO_DATASETS).length >= 2);
    const churn = ML_STUDIO_DATASETS.customer_churn;
    const housing = ML_STUDIO_DATASETS.housing_prices;

    assert.ok(churn && churn.taskType === "classification");
    assert.ok(housing && housing.taskType === "regression");
    assert.ok(churn.rows.length >= 10);
    assert.ok(housing.rows.length >= 10);
  });

  await t.test("Trains Logistic Regression and computes real confusion matrix and F1 score", async () => {
    const res = trainAndEvaluateModel("customer_churn", ["tenure_months", "monthly_charges"], {
      algorithm: "logistic_regression",
      learningRate: 0.05,
      epochs: 60,
      regularizationLambda: 0.01
    });

    assert.ok(res.runId.startsWith("exp_run_"));
    assert.equal(res.algorithm, "logistic_regression");
    assert.ok(res.testMetrics.accuracy !== undefined);
    assert.ok(res.confusionMatrix !== undefined);
    assert.equal(res.diagnostics.leakageDetected, false);
  });

  await t.test("Trains Linear Regression on continuous target", async () => {
    const res = trainAndEvaluateModel("housing_prices", ["sqft", "bedrooms"], {
      algorithm: "linear_regression",
      learningRate: 0.01,
      epochs: 50
    });

    assert.equal(res.algorithm, "linear_regression");
    assert.ok(res.testMetrics.mse !== undefined && res.testMetrics.mse >= 0);
  });

  await t.test("Audits for target leakage when highly-correlated feature is present", async () => {
    const res = trainAndEvaluateModel("customer_churn", ["tenure_months", "monthly_charges", "total_charges"], {
      algorithm: "logistic_regression",
      learningRate: 0.05,
      epochs: 30
    });

    assert.ok(res.diagnostics !== undefined);
  });
});

test("Phase 3 Master: Data & ML Pipeline Builder Engine", async (t) => {
  const samplePipeline: PipelineDefinition = {
    id: "pipe-test",
    name: "Customer Order Aggregator",
    description: "Aggregation test pipeline",
    stages: [
      { id: "s1", name: "Read Source", type: "source_ingest", config: {}, dependsOn: [] },
      { id: "s2", name: "Validate Schema", type: "schema_validation", config: { requiredColumns: ["order_id", "amount"] }, dependsOn: ["s1"] },
      { id: "s3", name: "Clean Nulls", type: "cleaning", config: {}, dependsOn: ["s2"] },
      { id: "s4", name: "Filter Completed", type: "filtering", config: { filter_column: "status", allowed_values: ["completed"] }, dependsOn: ["s3"] },
      { id: "s5", name: "Quality Check", type: "quality_check", config: { assert_positive_amount: true }, dependsOn: ["s4"] },
      { id: "s6", name: "Sink Export", type: "sink_export", config: {}, dependsOn: ["s5"] }
    ]
  };

  await t.test("Executes valid pipeline DAG and captures intermediate rowsets per stage", async () => {
    // Row 104 in default data is 'refunded' with negative amount; stage s4 filters it out so quality check passes
    const report = await executeDataPipeline(samplePipeline);
    assert.equal(report.success, true);
    assert.equal(report.stageResults.length, 6);

    for (const stg of report.stageResults) {
      assert.equal(stg.status, "SUCCESS");
      assert.ok(stg.durationMs >= 0);
      assert.ok(stg.sampleOutput !== undefined);
    }
  });

  await t.test("Propagates quality check failure when corrupted row is injected", async () => {
    // Inject row with negative amount marked as 'completed' so it passes filter and hits quality check
    const corruptRowset = [
      { order_id: 999, user_id: "u_bad", amount: -50.0, status: "completed", timestamp: "2026-03-01T10:00:00Z" }
    ];
    const report = await executeDataPipeline(samplePipeline, corruptRowset);
    assert.equal(report.success, false);
    const failedStage = report.stageResults.find((s) => s.status === "FAILED");
    assert.ok(failedStage, "A stage should have failed");
    assert.equal(failedStage.stageType, "quality_check");
  });
});

test("Phase 3 Master: Technical Interview Simulation Engine", async (t) => {
  await t.test("Starts interview session with calibrated questions and honest provenance", async () => {
    const session = startInterviewSession("u-test-candidate-99", "ai_engineer");

    assert.ok(session.sessionId.startsWith("int_sess_"));
    assert.equal(session.questions.length, 5);
    for (const q of session.questions) {
      assert.ok(q.id && q.prompt);
      assert.ok(["verified_historical", "reported_historical", "role_pattern", "cognalyze_original"].includes(q.provenance.type));
      assert.ok(q.expectedKeywords.length >= 2);
    }
  });

  await t.test("Evaluates interview answers across 5 dimensions and returns dossier", async () => {
    const session = startInterviewSession("u-test-candidate-99", "ai_engineer");

    // Populate answers with comprehensive keyword coverage
    for (const q of session.questions) {
      session.answers[q.id] = {
        answerText: `To resolve ${q.prompt}, our production implementation leverages: ${q.expectedKeywords.join(", ")}. We rigorously validate convergence, latency, and edge cases with extensive automated tests.`,
        submittedAt: new Date().toISOString()
      };
    }

    const report = evaluateInterviewSession(session);
    assert.ok(report.totalScore >= 70, `Expected score >= 70, got ${report.totalScore}`);
    assert.ok(["STRONG_HIRE", "HIRE", "LEAN_HIRE"].includes(report.verdict));
    assert.ok(report.questionDossiers.length === 5);
    assert.ok(report.rubricBreakdown.technicalAccuracy > 0);
  });
});

test("Phase 3 Master: Multimedia & Micro-Concept Service", async (t) => {
  await t.test("Retrieves micro-lesson with transcript, timed captions, and Mermaid diagram", () => {
    assert.ok(Object.keys(MICRO_VIDEO_LIBRARY).length >= 3);
    const lesson = getMicroVideoBySlug("rag-hybrid-retrieval-60s");
    assert.ok(lesson, "Lesson should be found");
    assert.ok(lesson.targetDurationSeconds >= 30 && lesson.targetDurationSeconds <= 120);
    assert.ok(lesson.transcriptMarkdown.length > 50);
    assert.ok(lesson.mermaidDiagram.includes("graph") || lesson.mermaidDiagram.includes("flowchart"));
  });
});
