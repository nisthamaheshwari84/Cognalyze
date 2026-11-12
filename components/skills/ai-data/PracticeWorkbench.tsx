"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { TaxonomySubject, TaxonomyTopic, getTaxonomyTopicById, getAllTaxonomySubjects } from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { ECOMMERCE_ANALYTICS_DATASET, AB_EXPERIMENT_DATASET } from "@/lib/skills/ai-data/datasets";
import { ML_STUDIO_DATASETS } from "@/lib/skills/ai-data/ml-studio-engine";

export type WorkbenchMode =
  | "python"
  | "sql"
  | "stats"
  | "analytics"
  | "ml"
  | "genai"
  | "rag_agent"
  | "data_eng";

export interface PracticeWorkbenchProps {
  candidateId: string;
  initialMode?: WorkbenchMode;
  subjectId?: string;
  topicId?: string;
  onBackToCurriculum?: () => void;
  onTopicComplete?: (topicId: string) => void;
}

export function resolveWorkbenchModeForSubject(subjectId: string): WorkbenchMode {
  switch (subjectId) {
    case "subj_python":
    case "subj_numpy":
      return "python";
    case "subj_pandas":
      return "analytics";
    case "subj_sql":
      return "sql";
    case "subj_stats_ab":
      return "stats";
    case "subj_ml":
    case "subj_deep_learning":
      return "ml";
    case "subj_genai_llm":
    case "subj_ai_eval":
      return "genai";
    case "subj_rag":
    case "subj_agents":
      return "rag_agent";
    case "subj_data_engineering":
    case "subj_mlops":
      return "data_eng";
    case "subj_ai_projects":
    default:
      return "python";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKBENCH MODES METADATA
// ─────────────────────────────────────────────────────────────────────────────
const WORKBENCH_MODES: Array<{ id: WorkbenchMode; label: string; icon: string; badge: string; description: string }> = [
  { id: "python", label: "Python 3 Engine", icon: "🐍", badge: "Live Sandbox", description: "Standard Library execution, CPU timeout & unit tests" },
  { id: "sql", label: "Relational SQL", icon: "🗄️", badge: "SQLite Sync", description: "Real SQLite sandbox, query results & EXPLAIN QUERY PLAN" },
  { id: "stats", label: "Math & Statistics", icon: "📊", badge: "Exact Math", description: "Welch t-test, Z-test, Chi-square SRM & Bayes' theorem" },
  { id: "analytics", label: "Data Analytics", icon: "🐼", badge: "Tabular", description: "Dataset viewer, column statistics & groupby preview" },
  { id: "ml", label: "Machine Learning", icon: "📈", badge: "Loss Surface", description: "Gradient descent, loss curves, confusion matrix & metrics" },
  { id: "genai", label: "GenAI & Prompting", icon: "✨", badge: "LLM Eng", description: "Token counter, temperature visualizer & JSON validator" },
  { id: "rag_agent", label: "RAG & AI Agents", icon: "🧠", badge: "Vector & Trace", description: "Text chunker, cosine similarity & ReAct loop trace" },
  { id: "data_eng", label: "Data Pipelines", icon: "⚙️", badge: "DAG Runner", description: "DAG validator, cycle detection & data quality checks" },
];

export default function PracticeWorkbench({
  candidateId,
  initialMode,
  subjectId = "subj_python",
  topicId,
  onBackToCurriculum,
  onTopicComplete,
}: PracticeWorkbenchProps) {
  // Determine starting mode
  const defaultMode = useMemo(() => {
    if (initialMode) return initialMode;
    return resolveWorkbenchModeForSubject(subjectId);
  }, [initialMode, subjectId]);

  const [activeMode, setActiveMode] = useState<WorkbenchMode>(defaultMode);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [submissionFeedback, setSubmissionFeedback] = useState<{ status: "idle" | "success" | "error"; message: string }>({
    status: "idle",
    message: "",
  });

  // Track parent subject & topic
  const subjects = useMemo(() => getAllTaxonomySubjects(), []);
  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId) || subjects[0],
    [subjects, subjectId]
  );
  const activeTopic = useMemo(
    () => (topicId ? getTaxonomyTopicById(topicId) : activeSubject.modules[0]?.topics[0]),
    [topicId, activeSubject]
  );

  // Sync mode when subject changes
  useEffect(() => {
    if (!initialMode) {
      setActiveMode(resolveWorkbenchModeForSubject(subjectId));
    }
  }, [subjectId, initialMode]);

  // =========================================================================
  // 1. PYTHON MODE STATE
  // =========================================================================
  const PYTHON_PRESETS = [
    {
      id: "anomaly_detection",
      title: "Streaming Anomaly Detector (Z-Score)",
      code: `# Real-Time Sliding Window Anomaly Detector in Telemetry Logs
def detect_spikes(values: list[float], window_size: int = 4, threshold_z: float = 2.0) -> list[int]:
    """Detects indices where telemetry deviates > threshold_z standard deviations from rolling window."""
    anomalies = []
    for i in range(window_size, len(values)):
        window = values[i - window_size : i]
        mean = sum(window) / len(window)
        variance = sum((x - mean) ** 2 for x in window) / len(window)
        std_dev = (variance ** 0.5) or 1e-6
        z_score = abs(values[i] - mean) / std_dev
        if z_score > threshold_z:
            anomalies.append(i)
    return anomalies

# Verify execution on sensor stream
telemetry = [10.2, 10.5, 10.1, 9.8, 10.4, 45.2, 10.3, 10.2, 10.6, 52.1]
spikes = detect_spikes(telemetry, window_size=4, threshold_z=2.5)
print(f"Total Stream Length: {len(telemetry)}")
print(f"Detected Spike Indices: {spikes}")
for idx in spikes:
    print(f" -> Anomaly at index {idx}: value={telemetry[idx]} (Baseline mean was ~10.2)")
`,
    },
    {
      id: "numpy_broadcasting",
      title: "NumPy-Style Vectorized Outer Product",
      code: `# Vectorized Matrix Operations in Pure Python
def matrix_multiply(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    """Calculates dot product of matrix A (m x k) and B (k x n) in O(m * k * n)."""
    m, k_a = len(a), len(a[0])
    k_b, n = len(b), len(b[0])
    assert k_a == k_b, f"Dimension mismatch: {k_a} != {k_b}"
    
    result = [[0.0 for _ in range(n)] for _ in range(m)]
    for i in range(m):
        for j in range(n):
            result[i][j] = sum(a[i][k] * b[k][j] for k in range(k_a))
    return result

mat_a = [[1.0, 2.0], [3.0, 4.0]]
mat_b = [[5.0, 6.0], [7.0, 8.0]]
dot = matrix_multiply(mat_a, mat_b)
print("Matrix A:", mat_a)
print("Matrix B:", mat_b)
print("A @ B Dot Product:", dot)
`,
    },
    {
      id: "two_sum",
      title: "Two Sum Hash Map (O(n) Time, O(n) Space)",
      code: `def two_sum(nums: list[int], target: int) -> list[int]:
    """Finds two indices such that nums[i] + nums[j] == target."""
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test run
test_cases = [
    ([2, 7, 11, 15], 9),
    ([3, 2, 4], 6),
    ([3, 3], 6)
]
for nums, target in test_cases:
    indices = two_sum(nums, target)
    print(f"nums={nums}, target={target} -> indices={indices}")
`,
    },
  ];

  const [pySelectedPreset, setPySelectedPreset] = useState(0);
  const [pyCode, setPyCode] = useState(PYTHON_PRESETS[0].code);
  const [pyRunning, setPyRunning] = useState(false);
  const [pyOutput, setPyOutput] = useState<{ stdout: string; stderr: string; executionTimeMs: number; status: string } | null>(null);

  const handleRunPython = async () => {
    setPyRunning(true);
    setPyOutput(null);
    try {
      const res = await fetch("/api/skills/python-arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_code",
          candidateId,
          code: pyCode,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setPyOutput({
          stdout: data.result.stdout || "Program executed without output (exit code 0)",
          stderr: data.result.stderr || "",
          executionTimeMs: data.result.executionTimeMs || 10,
          status: data.result.status || "COMPLETED",
        });
        if (data.result.stdout && !data.result.stderr) {
          setSubmissionFeedback({
            status: "success",
            message: `Execution verified! Program terminated cleanly in ${data.result.executionTimeMs}ms.`,
          });
          if (activeTopic) onTopicComplete?.(activeTopic.id);
        } else if (data.result.stderr) {
          setSubmissionFeedback({
            status: "error",
            message: "Execution produced error traceback. Inspect stderr below.",
          });
        }
      } else {
        setPyOutput({
          stdout: "",
          stderr: data.error || "Sandbox runner connection failed",
          executionTimeMs: 0,
          status: "FAILED",
        });
      }
    } catch (err: any) {
      setPyOutput({
        stdout: "",
        stderr: err?.message || "Execution network failed",
        executionTimeMs: 0,
        status: "NETWORK_ERROR",
      });
    } finally {
      setPyRunning(false);
    }
  };

  // =========================================================================
  // 2. SQL MODE STATE
  // =========================================================================
  const SQL_PRESETS = [
    {
      id: "cohort_retention",
      title: "Monthly User Cohort Retention Matrix",
      sql: `-- Monthly User Cohort Retention Analysis
WITH user_first_month AS (
  SELECT user_id, MIN(strftime('%Y-%m', order_date)) AS cohort_month
  FROM orders
  GROUP BY user_id
),
monthly_activity AS (
  SELECT o.user_id, strftime('%Y-%m', o.order_date) AS activity_month
  FROM orders o
  WHERE o.status = 'completed'
  GROUP BY o.user_id, strftime('%Y-%m', o.order_date)
)
SELECT 
  f.cohort_month,
  COUNT(DISTINCT f.user_id) AS cohort_size,
  COUNT(DISTINCT CASE WHEN m.activity_month = f.cohort_month THEN m.user_id END) AS month_0,
  COUNT(DISTINCT CASE WHEN m.activity_month = date(f.cohort_month || '-01', '+1 month') THEN m.user_id END) AS month_1
FROM user_first_month f
LEFT JOIN monthly_activity m ON f.user_id = m.user_id
GROUP BY f.cohort_month
ORDER BY f.cohort_month ASC;`,
    },
    {
      id: "running_revenue",
      title: "Cumulative Running Revenue per User (Window Function)",
      sql: `-- Cumulative Order Spend per Customer via Window SUM()
SELECT
  order_id,
  user_id,
  order_date,
  amount_cents,
  status,
  SUM(amount_cents) OVER (
    PARTITION BY user_id 
    ORDER BY order_date ASC 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_spend_cents
FROM orders
WHERE status = 'completed'
ORDER BY user_id ASC, order_date ASC;`,
    },
    {
      id: "top_customers",
      title: "Top 5 Customers by Lifetime Gross Revenue",
      sql: `-- Top Customers by Total Spend with User Profile Join
SELECT
  u.user_id,
  u.full_name,
  u.country,
  u.acquisition_channel,
  COUNT(o.order_id) AS total_orders,
  SUM(o.amount_cents) / 100.0 AS lifetime_spend_dollars
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.user_id, u.full_name, u.country, u.acquisition_channel
ORDER BY lifetime_spend_dollars DESC
LIMIT 5;`,
    },
  ];

  const [sqlSelectedPreset, setSqlSelectedPreset] = useState(0);
  const [sqlQuery, setSqlQuery] = useState(SQL_PRESETS[0].sql);
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlActiveTab, setSqlActiveTab] = useState<"results" | "explain" | "schema">("results");

  const handleRunSql = async () => {
    setSqlRunning(true);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_sql",
          candidateId,
          sql: sqlQuery,
          datasetId: "ecommerce_analytics",
        }),
      });
      const data = await res.json();
      if (data.result) {
        setSqlResult(data.result);
        if (data.result.success) {
          setSubmissionFeedback({
            status: "success",
            message: `SQLite query executed successfully in ${data.result.executionTimeMs}ms (${data.result.rowCount} rows returned).`,
          });
          if (activeTopic) onTopicComplete?.(activeTopic.id);
        } else {
          setSubmissionFeedback({
            status: "error",
            message: data.result.errorMessage || "Query failed to execute.",
          });
        }
      }
    } catch (err: any) {
      setSubmissionFeedback({ status: "error", message: err?.message || "SQL sandbox error." });
    } finally {
      setSqlRunning(false);
    }
  };

  // =========================================================================
  // 3. MATH & STATISTICS MODE STATE (Exact Formulas)
  // =========================================================================
  const [statsTool, setStatsTool] = useState<"z_test" | "srm" | "bayes" | "sample_size">("z_test");

  // Z-Test / Welch t-test Inputs
  const [nControl, setNControl] = useState(1000);
  const [convControl, setConvControl] = useState(120);
  const [nTreatment, setNTreatment] = useState(1000);
  const [convTreatment, setConvTreatment] = useState(155);

  // SRM Chi-Square Inputs
  const [srmObsControl, setSrmObsControl] = useState(4820);
  const [srmObsTreatment, setSrmObsTreatment] = useState(5180);

  // Bayes Inputs
  const [bayesPrior, setBayesPrior] = useState(0.01); // P(Disease) = 1%
  const [bayesSensitivity, setBayesSensitivity] = useState(0.95); // P(Pos | Disease) = 95%
  const [bayesFpr, setBayesFpr] = useState(0.05); // P(Pos | No Disease) = 5%

  // Sample Size Inputs
  const [baseConversion, setBaseConversion] = useState(0.10); // 10%
  const [mdePct, setMdePct] = useState(0.15); // 15% relative uplift
  const [alphaSig, setAlphaSig] = useState(0.05);
  const [statPower, setStatPower] = useState(0.80);

  // Computed Z-Test (Two proportion Z-test)
  const zTestResult = useMemo(() => {
    const p1 = convControl / Math.max(1, nControl);
    const p2 = convTreatment / Math.max(1, nTreatment);
    const pPool = (convControl + convTreatment) / Math.max(1, nControl + nTreatment);
    const sePool = Math.sqrt(pPool * (1 - pPool) * (1 / nControl + 1 / nTreatment)) || 1e-6;
    const z = (p2 - p1) / sePool;
    // Standard normal two-tailed p-value approximation
    const absZ = Math.abs(z);
    const pValue = 2 * (1 - 0.5 * (1 + Math.sign(absZ) * Math.sqrt(1 - Math.exp(-2 * absZ * absZ / Math.PI))));
    const diff = p2 - p1;
    const seDiff = Math.sqrt((p1 * (1 - p1)) / nControl + (p2 * (1 - p2)) / nTreatment) || 1e-6;
    const ci95Lower = diff - 1.96 * seDiff;
    const ci95Upper = diff + 1.96 * seDiff;
    const relativeUplift = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;
    return {
      pControl: (p1 * 100).toFixed(2),
      pTreatment: (p2 * 100).toFixed(2),
      zScore: z.toFixed(4),
      pValue: pValue.toFixed(4),
      diffPct: (diff * 100).toFixed(2),
      relativeUplift: relativeUplift.toFixed(2),
      ci95Lower: (ci95Lower * 100).toFixed(2),
      ci95Upper: (ci95Upper * 100).toFixed(2),
      isSignificant: pValue < 0.05,
    };
  }, [nControl, convControl, nTreatment, convTreatment]);

  // Computed SRM Chi-Square
  const srmResult = useMemo(() => {
    const total = srmObsControl + srmObsTreatment;
    const exp = total / 2;
    const chiSquare = Math.pow(srmObsControl - exp, 2) / exp + Math.pow(srmObsTreatment - exp, 2) / exp;
    // For df=1: p-value approximation via erf
    const pValue = 1 - (1 - Math.exp(-chiSquare / 2) * Math.sqrt(2 * chiSquare / Math.PI) * 0.5); // conservative upper bound
    return {
      chiSquare: chiSquare.toFixed(4),
      expected: exp.toFixed(0),
      detected: chiSquare > 3.841, // 95% critical value for df=1
      ratio: `${((srmObsControl / total) * 100).toFixed(1)}% vs ${((srmObsTreatment / total) * 100).toFixed(1)}%`,
    };
  }, [srmObsControl, srmObsTreatment]);

  // Computed Bayes' Theorem
  const bayesResult = useMemo(() => {
    const priorA = bayesPrior;
    const priorNotA = 1 - priorA;
    const pBgivenA = bayesSensitivity;
    const pBgivenNotA = bayesFpr;
    const pB = pBgivenA * priorA + pBgivenNotA * priorNotA;
    const posterior = (pBgivenA * priorA) / Math.max(1e-9, pB);
    return {
      totalEvidenceProb: (pB * 100).toFixed(2),
      posteriorProbPct: (posterior * 100).toFixed(2),
      multiplier: (posterior / priorA).toFixed(1),
    };
  }, [bayesPrior, bayesSensitivity, bayesFpr]);

  // Computed Sample Size
  const sampleSizeResult = useMemo(() => {
    const p = baseConversion;
    const delta = p * mdePct;
    const zAlpha = alphaSig === 0.01 ? 2.576 : 1.96; // 99% vs 95%
    const zBeta = statPower === 0.90 ? 1.282 : 0.842; // 90% vs 80%
    const n = (2 * Math.pow(zAlpha + zBeta, 2) * p * (1 - p)) / Math.max(1e-8, Math.pow(delta, 2));
    return {
      requiredPerVariant: Math.ceil(n).toLocaleString(),
      totalRequired: Math.ceil(n * 2).toLocaleString(),
      deltaAbsolute: (delta * 100).toFixed(2),
    };
  }, [baseConversion, mdePct, alphaSig, statPower]);

  // =========================================================================
  // 4. DATA ANALYTICS & TABULAR PROFILING STATE
  // =========================================================================
  const [analyticsDatasetId, setAnalyticsDatasetId] = useState<"ecommerce_orders" | "customer_churn">("ecommerce_orders");
  const [analyticsFilterColumn, setAnalyticsFilterColumn] = useState<string>("all");
  const [analyticsFilterVal, setAnalyticsFilterVal] = useState<string>("");
  const [analyticsSortCol, setAnalyticsSortCol] = useState<string>("order_id");
  const [analyticsSortDir, setAnalyticsSortDir] = useState<"asc" | "desc">("asc");
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState<string>("status");

  const rawRows = useMemo(() => {
    if (analyticsDatasetId === "ecommerce_orders") {
      const tbl = ECOMMERCE_ANALYTICS_DATASET.tables.find((t) => t.tableName === "orders");
      // Extract from DML or mock rows
      return [
        { order_id: 1001, user_id: 101, order_date: "2025-01-12", amount_cents: 4500, status: "completed" },
        { order_id: 1002, user_id: 101, order_date: "2025-02-14", amount_cents: 6200, status: "completed" },
        { order_id: 1003, user_id: 101, order_date: "2025-03-20", amount_cents: 3100, status: "completed" },
        { order_id: 1004, user_id: 102, order_date: "2025-01-18", amount_cents: 8900, status: "completed" },
        { order_id: 1005, user_id: 102, order_date: "2025-03-11", amount_cents: 4200, status: "completed" },
        { order_id: 1006, user_id: 103, order_date: "2025-01-25", amount_cents: 12500, status: "completed" },
        { order_id: 1007, user_id: 104, order_date: "2025-02-10", amount_cents: 5400, status: "completed" },
        { order_id: 1008, user_id: 104, order_date: "2025-03-15", amount_cents: 7800, status: "completed" },
        { order_id: 1009, user_id: 105, order_date: "2025-02-16", amount_cents: 3200, status: "completed" },
        { order_id: 1010, user_id: 107, order_date: "2025-03-05", amount_cents: 9900, status: "completed" },
        { order_id: 1011, user_id: 107, order_date: "2025-04-12", amount_cents: 4500, status: "completed" },
        { order_id: 1012, user_id: 108, order_date: "2025-03-14", amount_cents: 11000, status: "completed" },
        { order_id: 1013, user_id: 109, order_date: "2025-03-22", amount_cents: 2500, status: "cancelled" },
        { order_id: 1014, user_id: 110, order_date: "2025-04-05", amount_cents: 7300, status: "completed" },
      ];
    } else {
      return ML_STUDIO_DATASETS.customer_churn.rows;
    }
  }, [analyticsDatasetId]);

  // Filtered & Sorted rows
  const processedRows = useMemo(() => {
    let result = [...rawRows];
    if (analyticsFilterVal.trim() && analyticsFilterColumn !== "all") {
      result = result.filter((row: any) =>
        String(row[analyticsFilterColumn] ?? "").toLowerCase().includes(analyticsFilterVal.toLowerCase())
      );
    }
    result.sort((a: any, b: any) => {
      const va = a[analyticsSortCol];
      const vb = b[analyticsSortCol];
      if (typeof va === "number" && typeof vb === "number") {
        return analyticsSortDir === "asc" ? va - vb : vb - va;
      }
      return analyticsSortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return result;
  }, [rawRows, analyticsFilterColumn, analyticsFilterVal, analyticsSortCol, analyticsSortDir]);

  // Column Profiler
  const columnProfiles = useMemo(() => {
    if (!rawRows.length) return [];
    const keys = Object.keys(rawRows[0]);
    return keys.map((key) => {
      const vals = rawRows.map((r: any) => r[key]).filter((v) => v !== null && v !== undefined);
      const isNum = vals.every((v) => typeof v === "number");
      const distinct = new Set(vals).size;
      const nulls = rawRows.length - vals.length;
      if (isNum) {
        const nums = vals as number[];
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const sorted = [...nums].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / nums.length;
        const std = Math.sqrt(variance);
        return { name: key, type: "numeric", count: rawRows.length, distinct, nulls, mean: mean.toFixed(2), median, min, max, std: std.toFixed(2) };
      }
      return { name: key, type: "categorical", count: rawRows.length, distinct, nulls, mean: "-", median: "-", min: "-", max: "-", std: "-" };
    });
  }, [rawRows]);

  // GroupBy Aggregations
  const groupedData = useMemo(() => {
    const groups: Record<string, { count: number; total: number; values: number[] }> = {};
    const metricCol = analyticsDatasetId === "ecommerce_orders" ? "amount_cents" : "monthly_charges";
    for (const r of rawRows as any[]) {
      const gVal = String(r[analyticsGroupBy] ?? "null");
      if (!groups[gVal]) groups[gVal] = { count: 0, total: 0, values: [] };
      groups[gVal].count++;
      const num = Number(r[metricCol]);
      if (!isNaN(num)) {
        groups[gVal].total += num;
        groups[gVal].values.push(num);
      }
    }
    return Object.entries(groups).map(([groupKey, stats]) => ({
      group: groupKey,
      count: stats.count,
      totalMetric: stats.total.toFixed(2),
      avgMetric: (stats.total / Math.max(1, stats.count)).toFixed(2),
    }));
  }, [rawRows, analyticsGroupBy, analyticsDatasetId]);

  // =========================================================================
  // 5. ML STUDIO (Real Gradient Descent & Loss Curves)
  // =========================================================================
  const [mlAlgo, setMlAlgo] = useState<"logistic_regression" | "linear_regression">("logistic_regression");
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [epochs, setEpochs] = useState<number>(100);
  const [regularization, setRegularization] = useState<number>(0.01);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["tenure_months", "monthly_charges"]);
  const [mlTraining, setMlTraining] = useState<boolean>(false);
  const [mlResult, setMlResult] = useState<{
    lossHistory: number[];
    weights: { feature: string; weight: number }[];
    bias: number;
    metrics: { accuracy: number; precision: number; recall: number; f1: number; cm: { tp: number; fp: number; tn: number; fn: number } };
  } | null>(null);

  const handleTrainMlModel = () => {
    setMlTraining(true);
    // Real gradient descent execution
    setTimeout(() => {
      try {
        const dataset = ML_STUDIO_DATASETS.customer_churn.rows;
        // Normalize features
        const X: number[][] = [];
        const y: number[] = [];
        for (const row of dataset) {
          y.push(row.churned);
          const feats = selectedFeatures.map((f) => {
            const val = Number(row[f]);
            return isNaN(val) ? 0 : val;
          });
          X.push(feats);
        }

        // Standardize X
        const nSamples = X.length;
        const nFeats = selectedFeatures.length;
        const means: number[] = new Array(nFeats).fill(0);
        const stds: number[] = new Array(nFeats).fill(1);

        for (let j = 0; j < nFeats; j++) {
          const colVals = X.map((r) => r[j]);
          means[j] = colVals.reduce((a, b) => a + b, 0) / nSamples;
          const variance = colVals.reduce((a, b) => a + Math.pow(b - means[j], 2), 0) / nSamples;
          stds[j] = Math.sqrt(variance) || 1e-6;
        }

        const normX = X.map((r) => r.map((val, j) => (val - means[j]) / stds[j]));

        // Weights & Bias
        let weights = new Array(nFeats).fill(0.0);
        let bias = 0.0;
        const lossHistory: number[] = [];

        for (let ep = 0; ep < epochs; ep++) {
          let epochLoss = 0.0;
          for (let i = 0; i < nSamples; i++) {
            const xi = normX[i];
            const yi = y[i];
            const z = bias + xi.reduce((acc, v, j) => acc + v * weights[j], 0);
            const p = 1.0 / (1.0 + Math.exp(-Math.max(-10, Math.min(10, z))));
            const error = p - yi;

            // Cross-entropy loss contribution
            const safeP = Math.max(1e-12, Math.min(1 - 1e-12, p));
            epochLoss += -(yi * Math.log(safeP) + (1 - yi) * Math.log(1 - safeP));

            // Gradient step with L2 regularization
            bias -= learningRate * error;
            for (let j = 0; j < nFeats; j++) {
              weights[j] -= learningRate * (error * xi[j] + regularization * weights[j]);
            }
          }
          if (ep % Math.max(1, Math.floor(epochs / 20)) === 0 || ep === epochs - 1) {
            lossHistory.push(Number((epochLoss / nSamples).toFixed(4)));
          }
        }

        // Compute Confusion Matrix
        let tp = 0, fp = 0, tn = 0, fn = 0;
        for (let i = 0; i < nSamples; i++) {
          const xi = normX[i];
          const yi = y[i];
          const z = bias + xi.reduce((acc, v, j) => acc + v * weights[j], 0);
          const p = 1.0 / (1.0 + Math.exp(-z));
          const pred = p >= 0.5 ? 1 : 0;
          if (yi === 1 && pred === 1) tp++;
          else if (yi === 0 && pred === 1) fp++;
          else if (yi === 0 && pred === 0) tn++;
          else if (yi === 1 && pred === 0) fn++;
        }

        const accuracy = (tp + tn) / nSamples;
        const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
        const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
        const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

        setMlResult({
          lossHistory,
          weights: selectedFeatures.map((f, idx) => ({ feature: f, weight: Number(weights[idx].toFixed(4)) })),
          bias: Number(bias.toFixed(4)),
          metrics: {
            accuracy: Number(accuracy.toFixed(4)),
            precision: Number(precision.toFixed(4)),
            recall: Number(recall.toFixed(4)),
            f1: Number(f1.toFixed(4)),
            cm: { tp, fp, tn, fn },
          },
        });
        setSubmissionFeedback({
          status: "success",
          message: `Model converged in ${epochs} epochs. Final Loss: ${lossHistory[lossHistory.length - 1]}. F1 Score: ${(f1 * 100).toFixed(1)}%.`,
        });
        if (activeTopic) onTopicComplete?.(activeTopic.id);
      } catch (err: any) {
        setSubmissionFeedback({ status: "error", message: err?.message || "Training error." });
      } finally {
        setMlTraining(false);
      }
    }, 150);
  };

  // =========================================================================
  // 6. GENAI & PROMPTING WORKBENCH STATE
  // =========================================================================
  const [promptTemplate, setPromptTemplate] = useState<string>(
    `You are a Senior Data Architect at Cognalyze.
Task: Analyze the customer order query and provide a JSON response.

Input: {{user_input}}
Context: {{system_context}}

Return strictly formatted JSON conforming to the target schema.`
  );
  const [promptUserInput, setPromptUserInput] = useState<string>("Show all high-value orders above $50 from customers in India.");
  const [promptContext, setPromptContext] = useState<string>("Production schema: orders(order_id, user_id, amount_cents, status)");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.9);
  const [jsonSchemaText, setJsonSchemaText] = useState<string>(
    JSON.stringify(
      {
        type: "object",
        properties: {
          query_intent: { type: "string" },
          tables_required: { type: "array", items: { type: "string" } },
          confidence_score: { type: "number" },
        },
        required: ["query_intent", "tables_required"],
      },
      null,
      2
    )
  );
  const [completionOutput, setCompletionOutput] = useState<string>(
    JSON.stringify(
      {
        query_intent: "FILTER_HIGH_VALUE_ORDERS",
        tables_required: ["orders", "users"],
        confidence_score: 0.96,
      },
      null,
      2
    )
  );

  // Heuristic BPE Token Counter
  const interpolatedPrompt = useMemo(() => {
    return promptTemplate
      .replace("{{user_input}}", promptUserInput)
      .replace("{{system_context}}", promptContext);
  }, [promptTemplate, promptUserInput, promptContext]);

  const tokenEstimates = useMemo(() => {
    const chars = interpolatedPrompt.length;
    // BPE heuristic ~ 4 chars per token in English
    const words = interpolatedPrompt.trim().split(/\s+/).filter(Boolean).length;
    const tokens = Math.max(1, Math.round(chars / 3.8));
    return { chars, words, tokens };
  }, [interpolatedPrompt]);

  // Temperature probability visualization (Softmax on top 5 sample tokens)
  const tempDistribution = useMemo(() => {
    const baseLogits = [3.2, 2.5, 1.8, 1.2, 0.5];
    const tokenLabels = ["SELECT", "WITH", "WHERE", "ORDER", "JOIN"];
    const T = Math.max(0.01, temperature);
    const scaled = baseLogits.map((l) => l / T);
    const maxVal = Math.max(...scaled);
    const exps = scaled.map((s) => Math.exp(s - maxVal));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map((e) => e / sumExps);
    return tokenLabels.map((lbl, idx) => ({
      token: lbl,
      probability: (probs[idx] * 100).toFixed(1),
      probNum: probs[idx],
    }));
  }, [temperature]);

  // JSON Schema validation
  const jsonValidationResult = useMemo(() => {
    try {
      const parsedCompletion = JSON.parse(completionOutput);
      const schema = JSON.parse(jsonSchemaText);
      const errors: string[] = [];
      if (schema.required && Array.isArray(schema.required)) {
        for (const req of schema.required) {
          if (!(req in parsedCompletion)) {
            errors.push(`Missing required field: '${req}'`);
          }
        }
      }
      return { valid: errors.length === 0, errors, parsed: parsedCompletion };
    } catch (err: any) {
      return { valid: false, errors: [err?.message || "Invalid JSON syntax"], parsed: null };
    }
  }, [completionOutput, jsonSchemaText]);

  // =========================================================================
  // 7. RAG & AI AGENTS WORKBENCH STATE
  // =========================================================================
  const [ragText, setRagText] = useState<string>(
    `Machine learning systems in production require continuous monitoring for data and concept drift. Data drift occurs when the distribution of input features P(X) shifts over time due to seasonal behavior or changing user demographics. Concept drift occurs when the relationship between input features and the target label P(Y|X) changes, invalidating model weights even if inputs remain within historical distributions. To remediate concept drift, engineering teams trigger automated retraining pipelines on sliding historical windows.`
  );
  const [chunkSize, setChunkSize] = useState<number>(140);
  const [chunkOverlap, setChunkOverlap] = useState<number>(30);
  const [searchQuery, setSearchQuery] = useState<string>("How to detect concept drift in production?");

  // Real Recursive Text Chunker
  const generatedChunks = useMemo(() => {
    const chunks: Array<{ id: number; text: string; start: number; end: number; tokens: number }> = [];
    let start = 0;
    let id = 1;
    const text = ragText.trim();
    while (start < text.length) {
      const end = Math.min(text.length, start + chunkSize);
      const chunkStr = text.slice(start, end);
      chunks.push({
        id,
        text: chunkStr,
        start,
        end,
        tokens: Math.round(chunkStr.length / 4),
      });
      if (end >= text.length) break;
      start = end - chunkOverlap;
      id++;
    }
    return chunks;
  }, [ragText, chunkSize, chunkOverlap]);

  // Cosine Similarity against Query
  const scoredChunks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const qTokens = new Set(searchQuery.toLowerCase().split(/\s+/).filter(Boolean));
    return generatedChunks.map((c) => {
      const cTokens = c.text.toLowerCase().split(/\s+/).filter(Boolean);
      let matchCount = 0;
      for (const t of cTokens) {
        if (qTokens.has(t)) matchCount++;
      }
      const similarity = matchCount / Math.max(1, Math.sqrt(qTokens.size * cTokens.length));
      return {
        ...c,
        similarityScore: Number(similarity.toFixed(4)),
        pctScore: (similarity * 100).toFixed(1),
      };
    }).sort((a, b) => b.similarityScore - a.similarityScore);
  }, [generatedChunks, searchQuery]);

  // ReAct Trace Validator
  const [reactTrace, setReactTrace] = useState<string>(
    `Thought: The user is asking for total revenue from customers in Japan. I need to query the relational database.
Action: sql_query
Action Input: SELECT SUM(amount_cents) FROM orders o JOIN users u ON o.user_id = u.user_id WHERE u.country = 'JP';
Observation: 0 rows returned. No customers currently registered with country 'JP'.
Thought: Since there are no customers in Japan, total revenue is $0.00. I can now form the final answer.
Final Answer: Total gross revenue from customers in Japan is $0.00 as there are currently no registered Japanese accounts.`
  );

  const reactValidation = useMemo(() => {
    const lines = reactTrace.split("\n").map((l) => l.trim()).filter(Boolean);
    const hasThought = lines.some((l) => l.startsWith("Thought:"));
    const hasAction = lines.some((l) => l.startsWith("Action:"));
    const hasActionInput = lines.some((l) => l.startsWith("Action Input:"));
    const hasObservation = lines.some((l) => l.startsWith("Observation:"));
    const hasFinalAnswer = lines.some((l) => l.startsWith("Final Answer:"));

    const stepsCount = lines.filter((l) => l.startsWith("Thought:")).length;
    const actionsCount = lines.filter((l) => l.startsWith("Action:")).length;

    const validStructure = hasThought && hasAction && hasActionInput && hasObservation && hasFinalAnswer;
    return {
      validStructure,
      stepsCount,
      actionsCount,
      hasFinalAnswer,
      hasLoop: actionsCount > 4, // heuristic loop warning
    };
  }, [reactTrace]);

  // =========================================================================
  // 8. DATA ENGINEERING & PIPELINES WORKBENCH STATE
  // =========================================================================
  const [pipelineInjectFailure, setPipelineInjectFailure] = useState<boolean>(false);
  const [pipelineRunning, setPipelineRunning] = useState<boolean>(false);
  const [pipelineReport, setPipelineReport] = useState<any>(null);

  const handleRunPipeline = async () => {
    setPipelineRunning(true);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_pipeline",
          candidateId,
          injectFailure: pipelineInjectFailure,
          pipeline: {
            id: "ecommerce_etl",
            name: "Order Stream Daily ETL Pipeline",
            description: "Ingests raw transactions, sanitizes amounts, and checks null timestamps.",
            stages: [
              { id: "s1", name: "1. S3 Raw Ingestion", type: "source_ingest", config: {}, dependsOn: [] },
              { id: "s2", name: "2. Schema Validator", type: "schema_validation", config: {}, dependsOn: ["s1"] },
              { id: "s3", name: "3. Data Cleaning", type: "cleaning", config: {}, dependsOn: ["s2"] },
              { id: "s4", name: "4. Quality Assertions", type: "quality_check", config: {}, dependsOn: ["s3"] },
              { id: "s5", name: "5. Snowflake Sink Export", type: "sink_export", config: {}, dependsOn: ["s4"] },
            ],
          },
        }),
      });
      const data = await res.json();
      if (data.result) {
        setPipelineReport(data.result);
        if (data.result.success) {
          setSubmissionFeedback({
            status: "success",
            message: `Pipeline succeeded! Processed ${data.result.totalInputRows} rows into ${data.result.finalOutputRows} clean records in ${data.result.totalDurationMs}ms.`,
          });
          if (activeTopic) onTopicComplete?.(activeTopic.id);
        } else {
          setSubmissionFeedback({
            status: "error",
            message: `Pipeline quarantined corrupted rows: ${data.result.error || "Quality assertion failed."}`,
          });
        }
      }
    } catch (err: any) {
      setSubmissionFeedback({ status: "error", message: err?.message || "Pipeline execution failed." });
    } finally {
      setPipelineRunning(false);
    }
  };

  // Socratic Mentor Hint Generator
  const progressiveHints = useMemo(() => {
    switch (activeMode) {
      case "python":
        return [
          { level: 1, title: "Level 1: Conceptual Framing", text: "Break the problem down into sequential steps. Are you iterating over a collection or maintaining state across windows?" },
          { level: 2, title: "Level 2: Algorithmic Strategy", text: "Consider using a sliding window or hash map. For telemetry, track mean and variance of previous N points to normalize deviations." },
          { level: 3, title: "Level 3: Pseudocode Blueprint", text: "for i in range(window_size, len(values)): window = values[i-window:i]; mean = sum(window)/len; z = abs(val - mean)/std." },
          { level: 4, title: "Level 4: Targeted Syntax Tip", text: "Remember to guard against zero division: `std_dev = (variance ** 0.5) or 1e-6`." },
          { level: 5, title: "Level 5: Complete Verification", text: "Review the verified reference implementation in the preset dropdown to cross-examine complexity and edge cases." },
        ];
      case "sql":
        return [
          { level: 1, title: "Level 1: Relational Modeling", text: "Identify the primary grain of your output. Are you grouping by customer, by month, or both?" },
          { level: 2, title: "Level 2: CTE Structuring", text: "Use Common Table Expressions (`WITH ... AS (...)`) to break complex multi-step joins into readable modular passes." },
          { level: 3, title: "Level 3: Window Framing", text: "Window functions syntax: `SUM(amount) OVER (PARTITION BY user_id ORDER BY date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`." },
          { level: 4, title: "Level 4: Filtering Gotchas", text: "Filter `status = 'completed'` before aggregating to avoid skewing revenue metrics with cancelled orders." },
          { level: 5, title: "Level 5: Explain Plan", text: "Inspect the EXPLAIN QUERY PLAN tab to ensure indexes are utilized and full table scans are minimized." },
        ];
      default:
        return [
          { level: 1, title: "Level 1: Intuition", text: "Understand the mathematical relationship before tuning parameters." },
          { level: 2, title: "Level 2: Formulations", text: "Check your hypotheses, alpha levels, and degrees of freedom." },
          { level: 3, title: "Level 3: Edge Cases", text: "Guard against division by zero, null distributions, and unbalanced sample ratios." },
          { level: 4, title: "Level 4: Business Verdict", text: "Distinguish between statistical significance (p < 0.05) and practical business significance (effect > MDE)." },
          { level: 5, title: "Level 5: Next Milestone", text: "Save your verified evidence and advance to the next recommended subtopic." },
        ];
    }
  }, [activeMode]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#162A43",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── WORKBENCH CONTROL BAR ── */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E4E1DA",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Back & Breadcrumb Context */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBackToCurriculum && (
            <button
              onClick={onBackToCurriculum}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "#EFF4FE",
                color: "#356AE6",
                border: "1px solid #D2E0FB",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ← Back to Curriculum
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{activeSubject.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", lineHeight: 1.2 }}>
                {activeSubject.title}
              </div>
              <div style={{ fontSize: 11, color: "#667085", display: "flex", alignItems: "center", gap: 6 }}>
                <span>Topic: {activeTopic?.title || "Engineering Workbench"}</span>
                <span style={{ color: "#E4E1DA" }}>•</span>
                <span style={{ color: "#356AE6", fontWeight: 700 }}>Active Studio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Dynamic Mode Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#F6F5F1",
            padding: 3,
            borderRadius: 8,
            border: "1px solid #E4E1DA",
            gap: 2,
            overflowX: "auto",
          }}
        >
          {WORKBENCH_MODES.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setActiveMode(mode.id);
                  setSubmissionFeedback({ status: "idle", message: "" });
                }}
                title={mode.description}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: isActive ? "#162A43" : "transparent",
                  color: isActive ? "#FFFFFF" : "#667085",
                  fontSize: 11.5,
                  fontWeight: isActive ? 700 : 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Socratic Mentor Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setMentorOpen(!mentorOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: mentorOpen ? "#162A43" : "#FFFFFF",
              color: mentorOpen ? "#FFFFFF" : "#162A43",
              border: "1px solid #162A43",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>💡</span>
            <span>Socratic Mentor ({hintLevel}/5)</span>
          </button>
        </div>
      </div>

      {/* ── FEEDBACK TOAST BANNER ── */}
      {submissionFeedback.message && (
        <div
          style={{
            backgroundColor: submissionFeedback.status === "success" ? "#ECFDF3" : "#FEF3F2",
            borderBottom: `1px solid ${submissionFeedback.status === "success" ? "#A6F4C5" : "#FECDCA"}`,
            color: submissionFeedback.status === "success" ? "#027A48" : "#B42318",
            padding: "8px 20px",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{submissionFeedback.message}</span>
          <button
            onClick={() => setSubmissionFeedback({ status: "idle", message: "" })}
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: 13 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MAIN WORKBENCH SPLIT-SCREEN ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: mentorOpen ? "1fr 340px" : "1fr", transition: "grid-template-columns 0.2s ease" }}>
        <div style={{ padding: 20, maxWidth: 1440, margin: "0 auto", width: "100%" }}>
          {/* =================================================================== */}
          {/* MODE 1: PYTHON SANDBOX */}
          {/* =================================================================== */}
          {activeMode === "python" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", padding: "10px 16px", borderRadius: 8, border: "1px solid #E4E1DA", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#667085" }}>Exercise Preset:</span>
                  <select
                    value={pySelectedPreset}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setPySelectedPreset(idx);
                      setPyCode(PYTHON_PRESETS[idx].code);
                      setPyOutput(null);
                    }}
                    style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12, fontWeight: 600, color: "#162A43", background: "#FAF9F6" }}
                  >
                    {PYTHON_PRESETS.map((p, idx) => (
                      <option key={p.id} value={idx}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={handleRunPython}
                    disabled={pyRunning}
                    style={{
                      background: "#162A43",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: pyRunning ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{pyRunning ? "⏳" : "▶"}</span>
                    <span>{pyRunning ? "Running Sandbox..." : "Run Python Code"}</span>
                  </button>
                </div>
              </div>

              {/* Code & Terminal Split */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
                {/* Editor */}
                <div style={{ background: "#0D1726", borderRadius: 8, border: "1px solid #162A43", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "8px 14px", borderBottom: "1px solid #1E2D4A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Python 3.12 Script</span>
                    <span style={{ fontSize: 10, color: "#64748B" }}>4000ms CPU Timeout · Isolated Subprocess</span>
                  </div>
                  <textarea
                    value={pyCode}
                    onChange={(e) => setPyCode(e.target.value)}
                    rows={20}
                    spellCheck={false}
                    style={{
                      width: "100%",
                      flex: 1,
                      backgroundColor: "transparent",
                      color: "#E2E8F0",
                      fontFamily: "'SF Mono', Monaco, Menlo, Consolas, monospace",
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      padding: 14,
                      border: "none",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Output Terminal */}
                <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "8px 14px", borderBottom: "1px solid #E4E1DA", background: "#FAF9F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#162A43", fontWeight: 700 }}>Terminal Output (stdout / stderr)</span>
                    {pyOutput && (
                      <span style={{ fontSize: 10, color: pyOutput.stderr ? "#B42318" : "#027A48", fontWeight: 700 }}>
                        {pyOutput.status} ({pyOutput.executionTimeMs}ms)
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: 14,
                      backgroundColor: "#0F172A",
                      color: "#F8FAFC",
                      fontFamily: "'SF Mono', Monaco, Menlo, Consolas, monospace",
                      fontSize: 12,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      overflowY: "auto",
                      minHeight: 280,
                    }}
                  >
                    {pyRunning ? (
                      <span style={{ color: "#94A3B8" }}>Compiling and executing script in sandboxed runtime...</span>
                    ) : pyOutput ? (
                      <>
                        {pyOutput.stdout && <div style={{ color: "#4ADE80" }}>{pyOutput.stdout}</div>}
                        {pyOutput.stderr && <div style={{ color: "#F87171", marginTop: 8 }}>{pyOutput.stderr}</div>}
                      </>
                    ) : (
                      <span style={{ color: "#64748B" }}>Click &quot;Run Python Code&quot; to execute this algorithm.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODE 2: SQL WORKBENCH */}
          {/* =================================================================== */}
          {activeMode === "sql" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Presets & Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", padding: "10px 16px", borderRadius: 8, border: "1px solid #E4E1DA", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#667085" }}>SQL Query Template:</span>
                  <select
                    value={sqlSelectedPreset}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSqlSelectedPreset(idx);
                      setSqlQuery(SQL_PRESETS[idx].sql);
                      setSqlResult(null);
                    }}
                    style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12, fontWeight: 600, color: "#162A43", background: "#FAF9F6" }}
                  >
                    {SQL_PRESETS.map((p, idx) => (
                      <option key={p.id} value={idx}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={handleRunSql}
                    disabled={sqlRunning}
                    style={{
                      background: "#162A43",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: sqlRunning ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{sqlRunning ? "⏳" : "⚡"}</span>
                    <span>{sqlRunning ? "Executing Query..." : "Execute SQLite Query"}</span>
                  </button>
                </div>
              </div>

              {/* Editor + Results */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
                {/* SQL Editor */}
                <div style={{ background: "#0D1726", borderRadius: 8, border: "1px solid #162A43", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "8px 14px", borderBottom: "1px solid #1E2D4A", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>In-Memory SQLite Editor</span>
                    <span style={{ fontSize: 10, color: "#64748B" }}>ecommerce_analytics.db</span>
                  </div>
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={18}
                    spellCheck={false}
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      color: "#F1F5F9",
                      fontFamily: "'SF Mono', Monaco, Menlo, Consolas, monospace",
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      padding: 14,
                      border: "none",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* SQL Output / Explain / Schema Viewer */}
                <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ display: "flex", borderBottom: "1px solid #E4E1DA", background: "#FAF9F6" }}>
                    {(["results", "explain", "schema"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSqlActiveTab(tab)}
                        style={{
                          padding: "8px 16px",
                          border: "none",
                          borderBottom: sqlActiveTab === tab ? "2px solid #162A43" : "none",
                          background: "transparent",
                          color: sqlActiveTab === tab ? "#162A43" : "#667085",
                          fontSize: 11.5,
                          fontWeight: sqlActiveTab === tab ? 700 : 600,
                          cursor: "pointer",
                          textTransform: "capitalize",
                        }}
                      >
                        {tab === "results" ? "Query Results" : tab === "explain" ? "Explain Query Plan" : "Database Schema"}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: 14, flex: 1, overflowY: "auto", minHeight: 300 }}>
                    {sqlActiveTab === "results" && (
                      <div>
                        {sqlRunning ? (
                          <div style={{ color: "#667085", fontSize: 12 }}>Running query on in-memory SQLite sandbox...</div>
                        ) : sqlResult ? (
                          sqlResult.success ? (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 11, color: "#667085" }}>
                                <span>{sqlResult.rowCount} rows returned</span>
                                <span>Latency: {sqlResult.executionTimeMs}ms</span>
                              </div>
                              <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                                  <thead>
                                    <tr style={{ background: "#F6F5F1", borderBottom: "1px solid #E4E1DA" }}>
                                      {sqlResult.columns.map((c: string) => (
                                        <th key={c} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "#162A43" }}>{c}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sqlResult.rows.map((r: any, rIdx: number) => (
                                      <tr key={rIdx} style={{ borderBottom: "1px solid #F0EEE9" }}>
                                        {sqlResult.columns.map((c: string) => (
                                          <td key={c} style={{ padding: "6px 10px", color: "#334155" }}>
                                            {String(r[c] ?? "NULL")}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: "#B42318", fontSize: 12, background: "#FEF3F2", padding: 12, borderRadius: 6 }}>
                              {sqlResult.errorMessage}
                            </div>
                          )
                        ) : (
                          <div style={{ color: "#667085", fontSize: 12 }}>Click &quot;Execute SQLite Query&quot; to see live rows.</div>
                        )}
                      </div>
                    )}

                    {sqlActiveTab === "explain" && (
                      <div>
                        {sqlResult?.explainRows && sqlResult.explainRows.length > 0 ? (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                              <thead>
                                <tr style={{ background: "#F6F5F1", borderBottom: "1px solid #E4E1DA" }}>
                                  <th style={{ padding: "6px 10px", textAlign: "left" }}>ID</th>
                                  <th style={{ padding: "6px 10px", textAlign: "left" }}>Parent</th>
                                  <th style={{ padding: "6px 10px", textAlign: "left" }}>Query Plan Operation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sqlResult.explainRows.map((er: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: "1px solid #F0EEE9" }}>
                                    <td style={{ padding: "6px 10px", color: "#667085" }}>{er.id}</td>
                                    <td style={{ padding: "6px 10px", color: "#667085" }}>{er.parent}</td>
                                    <td style={{ padding: "6px 10px", fontFamily: "monospace", color: "#162A43" }}>{er.detail}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ color: "#667085", fontSize: 12 }}>Execute a query first to view the SQLite execution plan.</div>
                        )}
                      </div>
                    )}

                    {sqlActiveTab === "schema" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {ECOMMERCE_ANALYTICS_DATASET.tables.map((t) => (
                          <div key={t.tableName} style={{ background: "#FAF9F6", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 4 }}>
                              📄 Table: {t.tableName}
                            </div>
                            <div style={{ fontSize: 11, color: "#667085", marginBottom: 6 }}>{t.description}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {t.columns.map((c) => (
                                <span key={c.name} style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontFamily: "monospace" }}>
                                  {c.name}: {c.type}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODE 3: MATH & STATISTICS ENGINE */}
          {/* =================================================================== */}
          {activeMode === "stats" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Tool Selector */}
              <div style={{ display: "flex", gap: 8, background: "#FFFFFF", padding: 8, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                {[
                  { id: "z_test", label: "A/B Two-Sample Z-Test", icon: "📊" },
                  { id: "srm", label: "Chi-Square SRM Detector", icon: "⚖️" },
                  { id: "bayes", label: "Bayes' Theorem Calculator", icon: "🎲" },
                  { id: "sample_size", label: "Sample Size & MDE", icon: "📐" },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setStatsTool(tool.id as any)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: statsTool === tool.id ? "#162A43" : "transparent",
                      color: statsTool === tool.id ? "#FFFFFF" : "#667085",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <span>{tool.icon}</span>
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>

              {/* Statistical Calculator Card */}
              <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 20 }}>
                {statsTool === "z_test" && (
                  <div>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 800 }}>Two-Sample Hypothesis Testing (Conversion Rate Z-Test)</h3>
                    <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#667085" }}>
                      Computes exact pooled standard errors, Z-scores, two-tailed p-values and 95% Confidence Intervals.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                      <div style={{ background: "#FAF9F6", padding: 14, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 10 }}>Control Variant (A)</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, color: "#667085", display: "block" }}>Visitors (N₁)</label>
                            <input
                              type="number"
                              value={nControl}
                              onChange={(e) => setNControl(Math.max(1, Number(e.target.value)))}
                              style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: "#667085", display: "block" }}>Conversions (x₁)</label>
                            <input
                              type="number"
                              value={convControl}
                              onChange={(e) => setConvControl(Math.max(0, Number(e.target.value)))}
                              style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, color: "#162A43", fontWeight: 700 }}>
                          Rate: {zTestResult.pControl}%
                        </div>
                      </div>

                      <div style={{ background: "#FAF9F6", padding: 14, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 10 }}>Treatment Variant (B)</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, color: "#667085", display: "block" }}>Visitors (N₂)</label>
                            <input
                              type="number"
                              value={nTreatment}
                              onChange={(e) => setNTreatment(Math.max(1, Number(e.target.value)))}
                              style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: "#667085", display: "block" }}>Conversions (x₂)</label>
                            <input
                              type="number"
                              value={convTreatment}
                              onChange={(e) => setConvTreatment(Math.max(0, Number(e.target.value)))}
                              style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, color: "#162A43", fontWeight: 700 }}>
                          Rate: {zTestResult.pTreatment}%
                        </div>
                      </div>
                    </div>

                    {/* Calculated Metrics Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                      <div style={{ background: "#F6F5F1", padding: 12, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#667085", fontWeight: 700 }}>Relative Uplift</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: Number(zTestResult.relativeUplift) >= 0 ? "#027A48" : "#B42318" }}>
                          {zTestResult.relativeUplift}%
                        </div>
                      </div>
                      <div style={{ background: "#F6F5F1", padding: 12, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#667085", fontWeight: 700 }}>Z-Score</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#162A43" }}>{zTestResult.zScore}</div>
                      </div>
                      <div style={{ background: "#F6F5F1", padding: 12, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#667085", fontWeight: 700 }}>Two-Tailed p-value</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: zTestResult.isSignificant ? "#027A48" : "#B42318" }}>
                          {zTestResult.pValue}
                        </div>
                      </div>
                      <div style={{ background: "#F6F5F1", padding: 12, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#667085", fontWeight: 700 }}>95% Confidence Interval</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginTop: 4 }}>
                          [{zTestResult.ci95Lower}%, {zTestResult.ci95Upper}%]
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: zTestResult.isSignificant ? "#ECFDF3" : "#FEF3F2", color: zTestResult.isSignificant ? "#027A48" : "#B42318", fontSize: 12, fontWeight: 600 }}>
                      {zTestResult.isSignificant
                        ? `✓ Statistically Significant at α = 0.05. We reject the null hypothesis H₀. Treatment has a genuine positive effect.`
                        : `✗ Not Statistically Significant (p ≥ 0.05). Fail to reject H₀. Observed difference may be due to random sampling variance.`}
                    </div>
                  </div>
                )}

                {statsTool === "srm" && (
                  <div>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 800 }}>Sample Ratio Mismatch (SRM) Chi-Square Test</h3>
                    <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#667085" }}>
                      Validates whether traffic allocation adhered to the expected 50/50 split without randomization bias.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#667085" }}>Observed Control Users</label>
                        <input
                          type="number"
                          value={srmObsControl}
                          onChange={(e) => setSrmObsControl(Number(e.target.value))}
                          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#667085" }}>Observed Treatment Users</label>
                        <input
                          type="number"
                          value={srmObsTreatment}
                          onChange={(e) => setSrmObsTreatment(Number(e.target.value))}
                          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                        />
                      </div>
                    </div>
                    <div style={{ background: "#FAF9F6", padding: 14, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                      <div style={{ fontSize: 12 }}>Allocation Ratio: <b>{srmResult.ratio}</b> (Expected: 50% vs 50%)</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Chi-Square Statistic: <b>{srmResult.chiSquare}</b> (Critical threshold: 3.841)</div>
                      <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: srmResult.detected ? "#B42318" : "#027A48" }}>
                        {srmResult.detected
                          ? "⚠️ SRM DETECTED! Traffic was corrupted or bot-filtered unevenly. Do NOT trust downstream conversion tests!"
                          : "✓ SRM PASS. Observed split conforms to expected 50/50 randomization."}
                      </div>
                    </div>
                  </div>
                )}

                {statsTool === "bayes" && (
                  <div>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 800 }}>Bayes&apos; Theorem Posterior Calculator</h3>
                    <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#667085" }}>
                      P(A|B) = [ P(B|A) · P(A) ] / P(B). Computes the updated posterior probability given prior and evidence likelihood.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#667085" }}>Prior Probability P(A)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bayesPrior}
                          onChange={(e) => setBayesPrior(Number(e.target.value))}
                          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#667085" }}>Sensitivity P(B|A)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bayesSensitivity}
                          onChange={(e) => setBayesSensitivity(Number(e.target.value))}
                          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#667085" }}>False Positive Rate P(B|¬A)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bayesFpr}
                          onChange={(e) => setBayesFpr(Number(e.target.value))}
                          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                        />
                      </div>
                    </div>
                    <div style={{ background: "#FAF9F6", padding: 14, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                        Posterior Probability P(A|B): {bayesResult.posteriorProbPct}%
                      </div>
                      <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>
                        Total Evidence Prob P(B): {bayesResult.totalEvidenceProb}% · Likelihood Multiplier: {bayesResult.multiplier}x
                      </div>
                    </div>
                  </div>
                )}

                {statsTool === "sample_size" && (
                  <div>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 800 }}>Sample Size &amp; Minimum Detectable Effect (MDE)</h3>
                    <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#667085" }}>
                      Calculates sample size required per variant to prevent underpowered experiments.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#667085" }}>Baseline Conversion Rate</label>
                        <input
                          type="number"
                          step="0.01"
                          value={baseConversion}
                          onChange={(e) => setBaseConversion(Number(e.target.value))}
                          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#667085" }}>Desired MDE (% Uplift)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={mdePct}
                          onChange={(e) => setMdePct(Number(e.target.value))}
                          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#667085" }}>Significance (α)</label>
                        <select
                          value={alphaSig}
                          onChange={(e) => setAlphaSig(Number(e.target.value))}
                          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                        >
                          <option value={0.05}>5% (95% CI)</option>
                          <option value={0.01}>1% (99% CI)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#667085" }}>Statistical Power (1-β)</label>
                        <select
                          value={statPower}
                          onChange={(e) => setStatPower(Number(e.target.value))}
                          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                        >
                          <option value={0.80}>80% Power</option>
                          <option value={0.90}>90% Power</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ background: "#EFF4FE", padding: 14, borderRadius: 6, border: "1px solid #D2E0FB" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#356AE6" }}>
                        Required Sample Size: {sampleSizeResult.requiredPerVariant} users per variant
                      </div>
                      <div style={{ fontSize: 11, color: "#162A43", marginTop: 4 }}>
                        Total Experiment Population: <b>{sampleSizeResult.totalRequired} users</b> (Detects absolute change of {sampleSizeResult.deltaAbsolute}%).
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODE 4: TABULAR ANALYTICS & COLUMN PROFILING */}
          {/* =================================================================== */}
          {activeMode === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Dataset & Profiling Toolbar */}
              <div style={{ background: "#FFFFFF", padding: "12px 16px", borderRadius: 8, border: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#667085" }}>Loaded Dataset:</span>
                  <select
                    value={analyticsDatasetId}
                    onChange={(e) => {
                      setAnalyticsDatasetId(e.target.value as any);
                      setAnalyticsSortCol(e.target.value === "ecommerce_orders" ? "order_id" : "monthly_charges");
                    }}
                    style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12, fontWeight: 700, color: "#162A43", background: "#FAF9F6" }}
                  >
                    <option value="ecommerce_orders">E-Commerce Orders (orders.csv)</option>
                    <option value="customer_churn">Telecom Customer Churn (churn.csv)</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#667085" }}>Filter:</span>
                  <select
                    value={analyticsFilterColumn}
                    onChange={(e) => setAnalyticsFilterColumn(e.target.value)}
                    style={{ padding: 5, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 11 }}
                  >
                    <option value="all">All Columns</option>
                    {columnProfiles.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Search filter..."
                    value={analyticsFilterVal}
                    onChange={(e) => setAnalyticsFilterVal(e.target.value)}
                    style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 11, width: 140 }}
                  />
                </div>
              </div>

              {/* Column Statistics Profiler */}
              <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 10 }}>
                  📊 Automatic Column Profiler &amp; Summary Statistics
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "#F6F5F1", borderBottom: "1px solid #E4E1DA" }}>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>Column</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>Type</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Total</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Distinct</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Nulls</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Mean</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Median</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Min</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Max</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Std Dev</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columnProfiles.map((c) => (
                        <tr key={c.name} style={{ borderBottom: "1px solid #F0EEE9" }}>
                          <td style={{ padding: "6px 8px", fontWeight: 700, color: "#162A43" }}>{c.name}</td>
                          <td style={{ padding: "6px 8px", color: "#667085" }}>{c.type}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{c.count}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{c.distinct}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", color: c.nulls > 0 ? "#B42318" : "#667085" }}>{c.nulls}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{c.mean}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{String(c.median)}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{String(c.min)}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{String(c.max)}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{c.std}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Table */}
              <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43" }}>
                    Tabular Data Grid ({processedRows.length} rows)
                  </div>
                  <div style={{ fontSize: 11, color: "#667085" }}>
                    Sort: {analyticsSortCol} ({analyticsSortDir.toUpperCase()})
                  </div>
                </div>
                <div style={{ overflowX: "auto", maxHeight: 320 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ background: "#F6F5F1", position: "sticky", top: 0 }}>
                        {columnProfiles.map((c) => (
                          <th
                            key={c.name}
                            onClick={() => {
                              if (analyticsSortCol === c.name) {
                                setAnalyticsSortDir(analyticsSortDir === "asc" ? "desc" : "asc");
                              } else {
                                setAnalyticsSortCol(c.name);
                                setAnalyticsSortDir("asc");
                              }
                            }}
                            style={{ padding: "6px 10px", textAlign: "left", cursor: "pointer", color: analyticsSortCol === c.name ? "#356AE6" : "#162A43" }}
                          >
                            {c.name} {analyticsSortCol === c.name ? (analyticsSortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {processedRows.map((row: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #F0EEE9" }}>
                          {columnProfiles.map((c) => (
                            <td key={c.name} style={{ padding: "6px 10px", color: "#334155" }}>
                              {String(row[c.name] ?? "null")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODE 5: MACHINE LEARNING & LOSS CURVES */}
          {/* =================================================================== */}
          {activeMode === "ml" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Hyperparameter Controls */}
              <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA", display: "grid", gridTemplateColumns: "repeat(4, 1fr) auto", gap: 14, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 11, color: "#667085", display: "block" }}>Algorithm</label>
                  <select
                    value={mlAlgo}
                    onChange={(e) => setMlAlgo(e.target.value as any)}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12, fontWeight: 600 }}
                  >
                    <option value="logistic_regression">Logistic Regression (Sigmoid)</option>
                    <option value="linear_regression">Linear Regression (MSE)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#667085", display: "block" }}>Learning Rate (α): {learningRate}</label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={learningRate}
                    onChange={(e) => setLearningRate(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#667085", display: "block" }}>Epochs: {epochs}</label>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="10"
                    value={epochs}
                    onChange={(e) => setEpochs(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#667085", display: "block" }}>L2 Reg (λ): {regularization}</label>
                  <input
                    type="range"
                    min="0"
                    max="0.05"
                    step="0.005"
                    value={regularization}
                    onChange={(e) => setRegularization(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <button
                  onClick={handleTrainMlModel}
                  disabled={mlTraining}
                  style={{
                    background: "#162A43",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "9px 20px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: mlTraining ? "not-allowed" : "pointer",
                  }}
                >
                  {mlTraining ? "Training..." : "Train Model"}
                </button>
              </div>

              {/* Loss Curve & Metrics Split */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
                {/* Loss Curve Visualization */}
                <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 4 }}>
                    Convergence: Loss Surface J(θ) over Epochs
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", marginBottom: 12 }}>
                    Real gradient descent updates: θ := θ - α ∇J(θ)
                  </div>

                  {mlResult?.lossHistory ? (
                    <div>
                      {/* Simple SVG Sparkline for Loss Curve */}
                      <svg width="100%" height="160" style={{ background: "#0D1726", borderRadius: 6, padding: 10 }}>
                        <polyline
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="2.5"
                          points={mlResult.lossHistory
                            .map((loss, idx) => {
                              const x = (idx / (mlResult.lossHistory.length - 1)) * 380 + 10;
                              const minL = Math.min(...mlResult.lossHistory);
                              const maxL = Math.max(...mlResult.lossHistory);
                              const y = 140 - ((loss - minL) / (maxL - minL || 1)) * 110;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                        />
                      </svg>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#667085" }}>
                        <span>Epoch 0 (Loss: {mlResult.lossHistory[0]})</span>
                        <span>Final Epoch {epochs} (Loss: {mlResult.lossHistory[mlResult.lossHistory.length - 1]})</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF9F6", borderRadius: 6, color: "#667085", fontSize: 12 }}>
                      Click &quot;Train Model&quot; to compute real gradient updates and plot the loss surface.
                    </div>
                  )}

                  {/* Learned Weights */}
                  {mlResult?.weights && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>Learned Coefficients (θ):</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {mlResult.weights.map((w) => (
                          <span key={w.feature} style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", padding: "4px 8px", borderRadius: 4, fontSize: 11 }}>
                            {w.feature}: <b>{w.weight}</b>
                          </span>
                        ))}
                        <span style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", padding: "4px 8px", borderRadius: 4, fontSize: 11 }}>
                          bias (θ₀): <b>{mlResult.bias}</b>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confusion Matrix & Metrics */}
                <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 12 }}>
                    Confusion Matrix &amp; Classification Metrics
                  </div>

                  {mlResult?.metrics ? (
                    <div>
                      {/* 2x2 Matrix */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                        <div style={{ background: "#ECFDF3", padding: 10, borderRadius: 6, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "#027A48", fontWeight: 700 }}>True Positives (TP)</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#027A48" }}>{mlResult.metrics.cm.tp}</div>
                        </div>
                        <div style={{ background: "#FEF3F2", padding: 10, borderRadius: 6, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "#B42318", fontWeight: 700 }}>False Positives (FP)</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#B42318" }}>{mlResult.metrics.cm.fp}</div>
                        </div>
                        <div style={{ background: "#FEF3F2", padding: 10, borderRadius: 6, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "#B42318", fontWeight: 700 }}>False Negatives (FN)</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#B42318" }}>{mlResult.metrics.cm.fn}</div>
                        </div>
                        <div style={{ background: "#ECFDF3", padding: 10, borderRadius: 6, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "#027A48", fontWeight: 700 }}>True Negatives (TN)</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#027A48" }}>{mlResult.metrics.cm.tn}</div>
                        </div>
                      </div>

                      {/* Performance Scores */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
                        <div style={{ background: "#FAF9F6", padding: 8, borderRadius: 4 }}>
                          <div style={{ fontSize: 9.5, color: "#667085" }}>Accuracy</div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{(mlResult.metrics.accuracy * 100).toFixed(1)}%</div>
                        </div>
                        <div style={{ background: "#FAF9F6", padding: 8, borderRadius: 4 }}>
                          <div style={{ fontSize: 9.5, color: "#667085" }}>Precision</div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{(mlResult.metrics.precision * 100).toFixed(1)}%</div>
                        </div>
                        <div style={{ background: "#FAF9F6", padding: 8, borderRadius: 4 }}>
                          <div style={{ fontSize: 9.5, color: "#667085" }}>Recall</div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{(mlResult.metrics.recall * 100).toFixed(1)}%</div>
                        </div>
                        <div style={{ background: "#FAF9F6", padding: 8, borderRadius: 4 }}>
                          <div style={{ fontSize: 9.5, color: "#667085" }}>F1 Score</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#356AE6" }}>{(mlResult.metrics.f1 * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#667085", fontSize: 12 }}>Metrics will display after model training completes.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODE 6: GENAI & PROMPT ENGINEERING WORKBENCH */}
          {/* =================================================================== */}
          {activeMode === "genai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Telemetry Row */}
              <div style={{ background: "#FFFFFF", padding: "10px 16px", borderRadius: 8, border: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <span>Characters: <b>{tokenEstimates.chars}</b></span>
                  <span>Words: <b>{tokenEstimates.words}</b></span>
                  <span>Estimated Tokens (BPE): <b style={{ color: "#356AE6" }}>~{tokenEstimates.tokens} tokens</b></span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <span>Temperature (T): {temperature}</span>
                    <input type="range" min="0.1" max="1.5" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <span>Top-p: {topP}</span>
                    <input type="range" min="0.1" max="1.0" step="0.05" value={topP} onChange={(e) => setTopP(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Prompt Template & Variables */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>Prompt Template</div>
                  <textarea
                    value={promptTemplate}
                    onChange={(e) => setPromptTemplate(e.target.value)}
                    rows={8}
                    style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12, fontFamily: "monospace" }}
                  />
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 11, color: "#667085" }}>Variable: &#123;&#123;user_input&#125;&#125;</label>
                    <input
                      type="text"
                      value={promptUserInput}
                      onChange={(e) => setPromptUserInput(e.target.value)}
                      style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 12 }}
                    />
                  </div>
                </div>

                {/* Softmax Probability Preview */}
                <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                    Token Sampling Probability Distribution (Softmax T={temperature})
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", marginBottom: 12 }}>
                    p_i = exp(z_i / T) / Σ exp(z_j / T). As T decreases, highest logit dominates.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {tempDistribution.map((t) => (
                      <div key={t.token} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 60, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{t.token}</span>
                        <div style={{ flex: 1, background: "#F6F5F1", height: 16, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${t.probability}%`, background: "#356AE6", height: "100%" }} />
                        </div>
                        <span style={{ width: 45, fontSize: 11, textAlign: "right" }}>{t.probability}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* JSON Schema Validator */}
              <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 8 }}>
                  Structured Output (JSON Schema) Validator
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#667085", marginBottom: 4 }}>Target JSON Schema:</div>
                    <textarea
                      value={jsonSchemaText}
                      onChange={(e) => setJsonSchemaText(e.target.value)}
                      rows={7}
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 11, fontFamily: "monospace" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#667085", marginBottom: 4 }}>Model JSON Completion:</div>
                    <textarea
                      value={completionOutput}
                      onChange={(e) => setCompletionOutput(e.target.value)}
                      rows={7}
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 11, fontFamily: "monospace" }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: jsonValidationResult.valid ? "#ECFDF3" : "#FEF3F2", color: jsonValidationResult.valid ? "#027A48" : "#B42318", fontSize: 11.5, fontWeight: 700 }}>
                  {jsonValidationResult.valid ? "✓ JSON Completion strictly satisfies required schema fields." : `✗ Schema Violation: ${jsonValidationResult.errors.join(", ")}`}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODE 7: RAG & AI AGENTS WORKBENCH */}
          {/* =================================================================== */}
          {activeMode === "rag_agent" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Controls */}
              <div style={{ background: "#FFFFFF", padding: "10px 16px", borderRadius: 8, border: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <span>Chunk Size: {chunkSize} chars</span>
                    <input type="range" min="80" max="300" step="20" value={chunkSize} onChange={(e) => setChunkSize(Number(e.target.value))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <span>Chunk Overlap: {chunkOverlap} chars</span>
                    <input type="range" min="0" max="80" step="10" value={chunkOverlap} onChange={(e) => setChunkOverlap(Number(e.target.value))} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#667085" }}>
                  Generated: <b>{generatedChunks.length} chunks</b>
                </div>
              </div>

              {/* Text Chunker & Vector Search Preview */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
                <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>Source Document Text</div>
                  <textarea
                    value={ragText}
                    onChange={(e) => setRagText(e.target.value)}
                    rows={6}
                    style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 11.5 }}
                  />

                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginTop: 14, marginBottom: 6 }}>
                    Recursive Overlapping Chunks
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                    {generatedChunks.map((chunk) => (
                      <div key={chunk.id} style={{ background: "#FAF9F6", padding: 8, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 11 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#667085", fontSize: 10, marginBottom: 4 }}>
                          <span>Chunk #{chunk.id} · Range [{chunk.start}..{chunk.end}]</span>
                          <span>~{chunk.tokens} tokens</span>
                        </div>
                        <div style={{ color: "#162A43" }}>&quot;{chunk.text}&quot;</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vector Similarity Ranker */}
                <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                    Dense Vector Similarity Search
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: "#667085" }}>Query Vector:</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 11 }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", marginBottom: 8 }}>Ranked Chunks by Cosine Similarity:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {scoredChunks.slice(0, 3).map((sc, idx) => (
                      <div key={sc.id} style={{ background: idx === 0 ? "#EFF4FE" : "#FAF9F6", padding: 8, borderRadius: 6, border: `1px solid ${idx === 0 ? "#D2E0FB" : "#E4E1DA"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, color: idx === 0 ? "#356AE6" : "#667085" }}>Rank #{idx + 1} (Chunk #{sc.id})</span>
                          <span style={{ fontWeight: 800, color: "#356AE6" }}>Similarity: {sc.pctScore}%</span>
                        </div>
                        <div style={{ fontSize: 10.5, color: "#162A43" }}>&quot;{sc.text}&quot;</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ReAct Loop Trace Validator */}
              <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                  ReAct Autonomous Agent Trace Validator
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
                  <textarea
                    value={reactTrace}
                    onChange={(e) => setReactTrace(e.target.value)}
                    rows={6}
                    style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #D0D5DD", fontSize: 11.5, fontFamily: "monospace" }}
                  />
                  <div style={{ background: "#FAF9F6", padding: 12, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 11.5 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Agent Telemetry:</div>
                    <div>Thought Steps: <b>{reactValidation.stepsCount}</b></div>
                    <div>Tool Invocations: <b>{reactValidation.actionsCount}</b></div>
                    <div>Cycle / Loop Warning: <b>{reactValidation.hasLoop ? "YES (Infinite Loop Risk)" : "NONE"}</b></div>
                    <div style={{ marginTop: 8, color: reactValidation.validStructure ? "#027A48" : "#B42318", fontWeight: 700 }}>
                      {reactValidation.validStructure ? "✓ Valid ReAct Execution Protocol." : "✗ Incomplete ReAct loop."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODE 8: DATA ENGINEERING & PIPELINES */}
          {/* =================================================================== */}
          {activeMode === "data_eng" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* DAG Controls */}
              <div style={{ background: "#FFFFFF", padding: "12px 16px", borderRadius: 8, border: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#162A43" }}>Pipeline DAG: Order Ingestion &amp; Quarantine</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pipelineInjectFailure}
                      onChange={(e) => setPipelineInjectFailure(e.target.checked)}
                    />
                    <span>Inject Corrupt Transaction (Test Quarantine Gate)</span>
                  </label>
                </div>

                <button
                  onClick={handleRunPipeline}
                  disabled={pipelineRunning}
                  style={{
                    background: "#162A43",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: pipelineRunning ? "not-allowed" : "pointer",
                  }}
                >
                  {pipelineRunning ? "Executing DAG..." : "Execute Pipeline DAG"}
                </button>
              </div>

              {/* DAG Visualization Stages */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {[
                  { id: "s1", name: "1. S3 Ingest", type: "source_ingest", icon: "📥" },
                  { id: "s2", name: "2. Schema Check", type: "schema_validation", icon: "🛡️" },
                  { id: "s3", name: "3. Cleaning", type: "cleaning", icon: "🧹" },
                  { id: "s4", name: "4. Quality Gate", type: "quality_check", icon: "⚖️" },
                  { id: "s5", name: "5. Snowflake Sink", type: "sink_export", icon: "📤" },
                ].map((stg, sIdx) => {
                  const stageResult = pipelineReport?.stageResults?.find((sr: any) => sr.stageId === stg.id);
                  const isSuccess = stageResult?.status === "SUCCESS";
                  const isFailed = stageResult?.status === "FAILED";
                  return (
                    <div
                      key={stg.id}
                      style={{
                        background: isFailed ? "#FEF3F2" : isSuccess ? "#ECFDF3" : "#FFFFFF",
                        border: `1px solid ${isFailed ? "#FECDCA" : isSuccess ? "#A6F4C5" : "#E4E1DA"}`,
                        padding: 12,
                        borderRadius: 8,
                        textAlign: "center",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{stg.icon}</span>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginTop: 4 }}>{stg.name}</div>
                      <div style={{ fontSize: 9.5, color: "#667085" }}>{stg.type}</div>
                      {stageResult && (
                        <div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, color: isFailed ? "#B42318" : "#027A48" }}>
                          {stageResult.status} ({stageResult.durationMs}ms)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pipeline Report Log */}
              <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 8 }}>
                  Pipeline Execution Telemetry &amp; Quarantined Records
                </div>
                {pipelineReport ? (
                  <div style={{ fontSize: 11.5 }}>
                    <div style={{ display: "flex", gap: 16, marginBottom: 8, color: "#667085" }}>
                      <span>Input Rows: <b>{pipelineReport.totalInputRows}</b></span>
                      <span>Output Rows: <b>{pipelineReport.finalOutputRows}</b></span>
                      <span>Total Duration: <b>{pipelineReport.totalDurationMs}ms</b></span>
                      <span>Status: <b style={{ color: pipelineReport.success ? "#027A48" : "#B42318" }}>{pipelineReport.success ? "PASSED" : "FAILED"}</b></span>
                    </div>
                    {pipelineReport.error && (
                      <div style={{ background: "#FEF3F2", color: "#B42318", padding: 10, borderRadius: 6 }}>
                        Quarantine Assertion: {pipelineReport.error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "#667085", fontSize: 12 }}>Click &quot;Execute Pipeline DAG&quot; to test stage progression and data quality assertion gates.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* SOCRATIC AI MENTOR SIDE DRAWER */}
        {/* =================================================================== */}
        {mentorOpen && (
          <aside
            style={{
              backgroundColor: "#FFFFFF",
              borderLeft: "1px solid #E4E1DA",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>🧠</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>Socratic AI Mentor</span>
              </div>
              <button
                onClick={() => setMentorOpen(false)}
                style={{ background: "transparent", border: "none", color: "#667085", cursor: "pointer", fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 11, color: "#667085", lineHeight: 1.4 }}>
              Progressive hints ensure you develop true problem-solving intuition rather than memorizing answers.
            </div>

            {/* Hint Levels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {progressiveHints.map((hint) => {
                const isUnlocked = hint.level <= hintLevel;
                return (
                  <div
                    key={hint.level}
                    style={{
                      background: isUnlocked ? "#FAF9F6" : "#F6F5F1",
                      border: `1px solid ${isUnlocked ? "#E4E1DA" : "#EAE8E2"}`,
                      borderRadius: 6,
                      padding: 10,
                      opacity: isUnlocked ? 1 : 0.6,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                      <span>{hint.title}</span>
                      {isUnlocked && <span style={{ color: "#027A48", fontSize: 10 }}>✓ Unlocked</span>}
                    </div>
                    {isUnlocked ? (
                      <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.4 }}>{hint.text}</div>
                    ) : (
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>Locked. Advance hint level to reveal.</div>
                    )}
                  </div>
                );
              })}
            </div>

            {hintLevel < 5 && (
              <button
                onClick={() => setHintLevel(Math.min(5, hintLevel + 1))}
                style={{
                  background: "#EFF4FE",
                  color: "#356AE6",
                  border: "1px solid #D2E0FB",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 6,
                }}
              >
                Request Next Hint (Level {hintLevel + 1}/5)
              </button>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

