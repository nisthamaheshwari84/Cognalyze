/**
 * lib/skills/ai-data/practical-lab-engine.ts
 *
 * Phase 5: Topic-Connected Practical Laboratory Engine.
 * Every topic links to a real, interactive, server-evaluated laboratory:
 * - Python & Data Structure / Iteration / Tensor-Logic Labs (executed in real Python 3 sandbox with assertion cases)
 * - Analytical SQL & Retention / Window / A-B Data Labs (executed in real node:sqlite against datasets.ts)
 * - ML Model Training & Error-Slice Investigation Labs (real gradient descent / metrics via ml-studio-engine.ts)
 */

import { getTopicLocation, TAXONOMY_SUBJECTS } from "./master-curriculum-taxonomy";
import { executePythonInSandbox } from "./python-lab-engine";
import { executeSqlInSandbox, areSqlOutputsEqual } from "./sql-lab-engine";
import { trainAndEvaluateModel } from "./ml-studio-engine";
import { getAnalyticsDataset } from "./datasets";

export type PracticalLabType = "python_lab" | "sql_lab" | "ml_experiment_lab";

export interface PracticalLabSpec {
  id: string;
  topicId: string;
  subjectId: string;
  title: string;
  labType: PracticalLabType;
  objective: string;
  requiredConcepts: string[];
  instructions: string[];
  datasetId?: string;
  datasetSummary?: string;
  starterCode: string;
  hints: string[];
  entryFunction?: string;
  testCases?: Array<{ id: string; description: string; args: unknown[]; expected: unknown }>;
  referenceSql?: string;
  mlTargetMetric?: { minAccuracy: number; algorithm: "logistic_regression" | "linear_regression" | "decision_tree" };
}

export interface PracticalLabEvaluation {
  passed: boolean;
  score: number;
  labId: string;
  stdout?: string;
  stderr?: string;
  columns?: string[];
  rows?: unknown[];
  mlMetrics?: unknown;
  testResults?: Array<{ id: string; description: string; passed: boolean; expected?: unknown; actual?: unknown; error?: string }>;
  feedback: string;
  improvementSuggestions: string[];
}

export function getPracticalLabForTopic(topicId: string): PracticalLabSpec | null {
  const loc = getTopicLocation(topicId);
  if (!loc) return null;
  const { topic, subject } = loc;
  const concepts = topic.conceptsCovered || [topic.title];

  // 1. SQL / Cohort / Analytics Practical Lab
  if (subject.id === "subj_sql" || topic.id.startsWith("sql-")) {
    const isCohortOrWindow = topic.id.includes("window") || topic.id.includes("cohort") || topic.id.includes("cte");
    const dataset = getAnalyticsDataset("ecommerce_analytics");
    return {
      id: `lab-${topic.id}`,
      topicId: topic.id,
      subjectId: subject.id,
      title: `SQL Lab: ${topic.title}`,
      labType: "sql_lab",
      objective: isCohortOrWindow
        ? "Compute completed customer lifetime revenue and order count ranked highest-to-lowest across `users` and `orders`."
        : "Query `orders` to compute total completed order count and spend in cents per `user_id`.",
      requiredConcepts: concepts,
      instructions: [
        "Inspect the `ecommerce_analytics` schema (`users`, `orders`). Note monetary values are stored in `amount_cents`.",
        "Exclude `cancelled` or non-completed orders (`WHERE o.status = 'completed'`).",
        "Group by `user_id` (and `full_name` if joined) and sort descending by total spend.",
      ],
      datasetId: dataset.id,
      datasetSummary: `${dataset.title}: users(user_id, full_name, signup_date, acquisition_channel, country), orders(order_id, user_id, order_date, amount_cents, status)`,
      starterCode: isCohortOrWindow
        ? `-- Practical SQL Lab: ${topic.title}\n-- Join users and completed orders to calculate customer spend\nSELECT\n  u.user_id,\n  u.full_name,\n  COUNT(o.order_id) AS completed_orders,\n  SUM(o.amount_cents) AS total_spend_cents\nFROM users u\nJOIN orders o ON u.user_id = o.user_id\nWHERE o.status = 'completed'\nGROUP BY u.user_id, u.full_name\nORDER BY total_spend_cents DESC;`
        : `-- Practical SQL Lab: ${topic.title}\nSELECT\n  user_id,\n  COUNT(*) AS completed_orders,\n  SUM(amount_cents) AS total_spend_cents\nFROM orders\nWHERE status = 'completed'\nGROUP BY user_id\nORDER BY total_spend_cents DESC;`,
      referenceSql: isCohortOrWindow
        ? `SELECT u.user_id, u.full_name, COUNT(o.order_id) AS completed_orders, SUM(o.amount_cents) AS total_spend_cents FROM users u JOIN orders o ON u.user_id = o.user_id WHERE o.status = 'completed' GROUP BY u.user_id, u.full_name ORDER BY total_spend_cents DESC;`
        : `SELECT user_id, COUNT(*) AS completed_orders, SUM(amount_cents) AS total_spend_cents FROM orders WHERE status = 'completed' GROUP BY user_id ORDER BY total_spend_cents DESC;`,
      hints: [
        "Make sure to filter `status = 'completed'` so cancelled orders are excluded.",
        "Include every non-aggregated SELECT column in `GROUP BY`.",
      ],
    };
  }

  // 2. ML Modeling & Evaluation Experiment Lab
  if (subject.id === "subj_ml" || subject.id === "subj_mlops") {
    return {
      id: `lab-${topic.id}`,
      topicId: topic.id,
      subjectId: subject.id,
      title: `ML Experiment Lab: ${topic.title}`,
      labType: "ml_experiment_lab",
      objective: "Train a calibrated churn classifier on the Telecom Customer Churn dataset without overfitting, inspect precision/recall errors, and achieve >= 80% accuracy.",
      requiredConcepts: concepts,
      instructions: [
        "Select predictive behavioral features (`tenure_months`, `monthly_charges`, `tech_support_calls`, `total_charges`).",
        "Configure algorithm, learning rate, and L2 regularization to generalize cleanly.",
        "Run training, inspect the real confusion matrix (TP/FP/TN/FN), and diagnose misclassified cases.",
      ],
      datasetId: "customer_churn",
      datasetSummary: "Telecom Customer Churn (12 real feature records: tenure_months, monthly_charges, total_charges, tech_support_calls, contract_type -> churned 0/1)",
      starterCode: JSON.stringify(
        {
          datasetId: "customer_churn",
          selectedFeatures: ["tenure_months", "monthly_charges", "tech_support_calls"],
          algorithm: "logistic_regression",
          learningRate: 0.15,
          epochs: 120,
          regularizationLambda: 0.01,
        },
        null,
        2
      ),
      mlTargetMetric: { minAccuracy: 0.8, algorithm: "logistic_regression" },
      hints: [
        "Including `tech_support_calls` and `tenure_months` captures strong churn signal.",
        "Keep learningRate around 0.1–0.2 with >= 100 epochs for convergence.",
      ],
    };
  }

  // 3. Python / Data / Vector / RAG Practical Lab (with genuine assertion test suite)
  const isDataProcessing =
    subject.id === "subj_pandas" ||
    subject.id === "subj_numpy" ||
    subject.id === "subj_stats_ab" ||
    subject.id === "subj_data_engineering";

  if (isDataProcessing) {
    return {
      id: `lab-${topic.id}`,
      topicId: topic.id,
      subjectId: subject.id,
      title: `Data Processing Lab: ${topic.title}`,
      labType: "python_lab",
      objective: `Clean messy transaction records, drop missing/negative amounts, and compute total revenue & average order per valid category.`,
      requiredConcepts: concepts,
      instructions: [
        "Implement `summarize_clean_transactions(rows: list[dict]) -> dict`.",
        "Ignore any record whose `'amount'` is `None` or `< 0`, or missing `'category'`.",
        "Return `{category: round(sum_amount, 2)}` sorted alphabetically by category key.",
      ],
      datasetSummary: "Sample streaming transaction records with missing (`None`) values and invalid refunds (`amount < 0`).",
      starterCode: `def summarize_clean_transactions(rows: list) -> dict:\n    # Filter invalid records (amount is None or amount < 0 or missing category)\n    totals = {}\n    for row in rows:\n        # TODO: implement clean aggregation\n        pass\n    return totals\n`,
      entryFunction: "summarize_clean_transactions",
      testCases: [
        {
          id: "lab-tc-1",
          description: "Filters None and negative amounts accurately",
          args: [[
            { category: "books", amount: 25.5 },
            { category: "books", amount: -10 },
            { category: "electronics", amount: 120.0 },
            { category: "electronics", amount: null },
          ]],
          expected: { books: 25.5, electronics: 120.0 },
        },
        {
          id: "lab-tc-2",
          description: "Handles empty input safely",
          args: [[]],
          expected: {},
        },
      ],
      hints: [
        "Check `amt = row.get('amount')` and `if amt is None or amt < 0: continue`.",
        "Round accumulated floats with `round(totals[cat], 2)`.",
      ],
    };
  }

  // Default Python Engineering / AI Logic Practical Lab
  return {
    id: `lab-${topic.id}`,
    topicId: topic.id,
    subjectId: subject.id,
    title: `Practical Lab: ${topic.title}`,
    labType: "python_lab",
    objective: `Implement a deterministic batch processor applying ${topic.title} (${concepts.slice(0, 2).join(", ")}), handling empty and malformed inputs cleanly.`,
    requiredConcepts: concepts,
    instructions: [
      "Implement `process_batch_records(records: list[dict]) -> dict`.",
      "Normalize string `'label'` values (`strip().lower()`), skip entries without positive numeric `'score'`, and count valid occurrences per label.",
      "Return `{ 'valid_count': int, 'label_counts': dict }`.",
    ],
    datasetSummary: "Telemetry batch stream with noisy labels, whitespace, and invalid negative scores.",
    starterCode: `def process_batch_records(records: list) -> dict:\n    valid_count = 0\n    label_counts = {}\n    # Clean whitespace, skip score is None or score <= 0\n    return {"valid_count": valid_count, "label_counts": label_counts}\n`,
    entryFunction: "process_batch_records",
    testCases: [
      {
        id: "lab-tc-1",
        description: "Normalizes labels and ignores invalid scores",
        args: [[
          { label: " AI ", score: 0.9 },
          { label: "ai", score: 0.7 },
          { label: "ML", score: -0.2 },
          { label: "data", score: null },
        ]],
        expected: { valid_count: 2, label_counts: { ai: 2 } },
      },
      {
        id: "lab-tc-2",
        description: "Empty batch boundary test",
        args: [[]],
        expected: { valid_count: 0, label_counts: {} },
      },
    ],
    hints: [
      "Use `label = str(r.get('label', '')).strip().lower()` and skip empty labels.",
      "Verify `isinstance(score, (int, float)) and score > 0` before counting.",
    ],
  };
}

export function getAllPracticalLabsOverview(): PracticalLabSpec[] {
  const labs: PracticalLabSpec[] = [];
  for (const subj of TAXONOMY_SUBJECTS) {
    const firstTopic = subj.modules?.[0]?.topics?.[0];
    if (!firstTopic) continue;
    const lab = getPracticalLabForTopic(firstTopic.id);
    if (lab) labs.push(lab);
  }
  return labs;
}

export async function evaluatePracticalLabSubmission(params: {
  topicId: string;
  submissionText: string;
}): Promise<PracticalLabEvaluation> {
  const lab = getPracticalLabForTopic(params.topicId);
  if (!lab) {
    return {
      passed: false,
      score: 0,
      labId: `lab-${params.topicId}`,
      feedback: "No practical lab found for this topic.",
      improvementSuggestions: ["Select a canonical curriculum topic."],
    };
  }

  // 1. SQL Lab automated check against referenceSql
  if (lab.labType === "sql_lab" && lab.referenceSql) {
    const [studentRes, refRes] = await Promise.all([
      executeSqlInSandbox(lab.datasetId || "ecommerce_analytics", params.submissionText),
      executeSqlInSandbox(lab.datasetId || "ecommerce_analytics", lab.referenceSql),
    ]);

    if (!studentRes.success) {
      return {
        passed: false,
        score: 0,
        labId: lab.id,
        stderr: studentRes.errorMessage,
        feedback: `SQL Execution failed: ${studentRes.errorMessage}`,
        improvementSuggestions: lab.hints,
      };
    }

    const matches = refRes.success && areSqlOutputsEqual(studentRes.rows, refRes.rows, true);
    const unorderedMatch = !matches && refRes.success && areSqlOutputsEqual(studentRes.rows, refRes.rows, false);
    const score = matches ? 100 : unorderedMatch ? 80 : 35;

    return {
      passed: matches,
      score,
      labId: lab.id,
      columns: studentRes.columns,
      rows: studentRes.rows,
      stdout: `Returned ${studentRes.rowCount} rows in ${studentRes.executionTimeMs}ms.`,
      feedback: matches
        ? "Practical SQL Lab passed! Your query matches expected columns, filtering, aggregation, and ordering."
        : unorderedMatch
        ? "Your rows match, but ordering differs. Ensure `ORDER BY total_spend_cents DESC` is included."
        : `Query executed (${studentRes.rowCount} rows) but result set differs from expected (${refRes.rowCount} rows). Check status filter and selected columns.`,
      improvementSuggestions: matches ? [] : lab.hints,
    };
  }

  // 2. ML Experiment Lab evaluation
  if (lab.labType === "ml_experiment_lab") {
    let cfg: {
      datasetId?: "customer_churn" | "house_prices" | "iris_classification";
      selectedFeatures?: string[];
      algorithm?: "logistic_regression" | "linear_regression" | "decision_tree";
      learningRate?: number;
      epochs?: number;
      regularizationLambda?: number;
    } = {};
    try {
      cfg = JSON.parse(params.submissionText || "{}");
    } catch {
      return {
        passed: false,
        score: 0,
        labId: lab.id,
        feedback: "Invalid JSON experiment configuration payload.",
        improvementSuggestions: ["Provide valid JSON with selectedFeatures, algorithm, learningRate, and epochs."],
      };
    }
    const features = Array.isArray(cfg.selectedFeatures) && cfg.selectedFeatures.length
      ? cfg.selectedFeatures
      : ["tenure_months", "monthly_charges"];
    const result = trainAndEvaluateModel(cfg.datasetId || "customer_churn", features, {
      algorithm: cfg.algorithm || "logistic_regression",
      learningRate: Number(cfg.learningRate || 0.15),
      epochs: Number(cfg.epochs || 100),
      regularizationLambda: Number(cfg.regularizationLambda || 0.01),
    });

    const acc = result.testMetrics.accuracy || 0;
    const f1 = result.testMetrics.f1 || 0;
    const minAcc = lab.mlTargetMetric?.minAccuracy || 0.75;
    const passed = acc >= minAcc;

    return {
      passed,
      score: Math.round(acc * 100),
      labId: lab.id,
      mlMetrics: result,
      stdout: `Model trained (${features.length} features): Accuracy ${(acc * 100).toFixed(1)}%, F1 ${(f1 * 100).toFixed(1)}%`,
      feedback: passed
        ? `Practical ML Lab passed! Real model reached ${(acc * 100).toFixed(1)}% accuracy on customer_churn.`
        : `Accuracy ${(acc * 100).toFixed(1)}% is below target ${(minAcc * 100).toFixed(0)}%. Add predictive features like tech_support_calls or tune epochs.`,
      improvementSuggestions: passed ? [] : [result.diagnostics?.summaryNotes || "Tune learning rate and feature selection.", ...lab.hints],
    };
  }

  // 3. Python Lab real assertion evaluation
  const fnName = lab.entryFunction || "process_batch_records";
  const cases = lab.testCases || [];
  const harness = `${params.submissionText}

import json
_cases = json.loads(${JSON.stringify(JSON.stringify(cases))})
_out = []
if ${JSON.stringify(fnName)} not in globals():
    print("__LAB_MISSING_FN__")
else:
    _fn = globals()[${JSON.stringify(fnName)}]
    for tc in _cases:
        try:
            actual = _fn(*tc["args"])
            _out.append({"id": tc["id"], "description": tc["description"], "passed": actual == tc["expected"], "expected": tc["expected"], "actual": actual})
        except Exception as exc:
            _out.append({"id": tc["id"], "description": tc["description"], "passed": False, "error": f"{type(exc).__name__}: {exc}"})
    print("__LAB_JSON__:" + json.dumps(_out))
`;
  const execRes = await executePythonInSandbox(harness);
  const stdout = execRes.stdout || "";

  if (!execRes.success || stdout.includes("__LAB_MISSING_FN__")) {
    return {
      passed: false,
      score: 0,
      labId: lab.id,
      stdout,
      stderr: execRes.stderr || (stdout.includes("__LAB_MISSING_FN__") ? `Function '${fnName}' not defined.` : execRes.errorMessage),
      feedback: stdout.includes("__LAB_MISSING_FN__")
        ? `Function \`${fnName}\` is missing. Keep the starter signature.`
        : `Python execution error: ${execRes.stderr || execRes.errorMessage}`,
      improvementSuggestions: lab.hints,
    };
  }

  const m = stdout.match(/__LAB_JSON__:(\[.*\])/);
  if (m) {
    const testResults = JSON.parse(m[1]) as Array<{ id: string; description: string; passed: boolean; expected?: unknown; actual?: unknown; error?: string }>;
    const passedCount = testResults.filter((t) => t.passed).length;
    const score = testResults.length > 0 ? Math.round((passedCount / testResults.length) * 100) : 0;
    const passed = testResults.length > 0 && passedCount === testResults.length;
    return {
      passed,
      score,
      labId: lab.id,
      stdout,
      testResults,
      feedback: passed
        ? `Practical Lab verified! ${passedCount}/${testResults.length} automated test cases passed.`
        : `${passedCount}/${testResults.length} test cases passed. Inspect the failing assertions and edge-case filters.`,
      improvementSuggestions: passed ? [] : lab.hints,
    };
  }

  return {
    passed: false,
    score: 0,
    labId: lab.id,
    stdout,
    stderr: execRes.stderr,
    feedback: "Lab did not produce valid structured test output.",
    improvementSuggestions: lab.hints,
  };
}
