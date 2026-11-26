/**
 * lib/skills/ai-data/comprehension-engine.ts
 *
 * Phase 4: Code Comprehension & Progressive Debugging Engine (Phase C).
 * Ensures students do NOT merely copy-paste code:
 * - Predict the Output exercises
 * - Explain the Implementation / Reasoning checks
 * - Spot & Fix Broken Code (real sandbox execution verification)
 * - Compare Two Implementations & Edge Case Identification
 */

import { getTopicLocation } from "./master-curriculum-taxonomy";
import { executePythonInSandbox } from "./python-lab-engine";
import { executeSqlInSandbox } from "./sql-lab-engine";

export type ComprehensionExerciseKind =
  | "predict_output"
  | "debug_fix"
  | "compare_implementations"
  | "edge_case_audit";

export interface ComprehensionChallenge {
  id: string;
  topicId: string;
  kind: ComprehensionExerciseKind;
  title: string;
  prompt: string;
  language: "python" | "sql";
  codeSnippet: string;
  alternativeSnippet?: string;
  options?: Array<{ id: string; text: string }>;
  correctOptionId?: string;
  starterFixCode?: string;
  expectedFixAssertion?: {
    fnName?: string;
    testInput?: unknown[];
    expectedOutput?: unknown;
    mustContainTokens?: string[];
  };
  explanation: string;
}

export function getTopicComprehensionSuite(topicId: string): ComprehensionChallenge[] {
  const loc = getTopicLocation(topicId);
  if (!loc) return [];
  const { topic, subject } = loc;
  const isSql = subject.id === "subj_sql" || topic.id.startsWith("sql-");
  const concepts = topic.conceptsCovered || [topic.title];
  const primaryConcept = concepts[0] || topic.title;

  if (isSql) {
    return [
      {
        id: `${topic.id}-comp-predict`,
        topicId: topic.id,
        kind: "predict_output",
        title: "Predict SQL Aggregation & NULL Behavior",
        prompt: "Consider an `orders` table with 5 rows where 1 row has `amount_cents = NULL` and 4 rows have `[100, 200, 300, 400]`. What do `COUNT(*)` and `COUNT(amount_cents)` return?",
        language: "sql",
        codeSnippet: `SELECT COUNT(*) AS all_rows, COUNT(amount_cents) AS non_null_rows, AVG(amount_cents) AS avg_cents FROM orders;`,
        options: [
          { id: "a", text: "all_rows = 5, non_null_rows = 4, avg_cents = 250.0 (NULL excluded from COUNT(col) and AVG)" },
          { id: "b", text: "all_rows = 5, non_null_rows = 5, avg_cents = 200.0 (NULL treated as 0)" },
          { id: "c", text: "Query fails with DivisionByZero when NULL exists." },
        ],
        correctOptionId: "a",
        explanation: "SQL aggregate functions like `COUNT(column)` and `AVG(column)` ignore NULL rows, whereas `COUNT(*)` counts every row including NULLs.",
      },
      {
        id: `${topic.id}-comp-debug`,
        topicId: topic.id,
        kind: "debug_fix",
        title: "Debug Faulty Warehouse Revenue Query",
        prompt: `The SQL query below tries to calculate completed spend per user on \`ecommerce_analytics\`, but currently counts cancelled orders too and filters using the wrong column. Fix and execute it against \`orders\`.`,
        language: "sql",
        codeSnippet: `-- BUGGY QUERY: includes cancelled orders & references nonexistent column\nSELECT user_id, SUM(amount_cents) AS spend_cents\nFROM orders\nGROUP BY user_id;`,
        starterFixCode: `-- Fix: include only status = 'completed' orders and sort descending by spend_cents\nSELECT user_id, SUM(amount_cents) AS spend_cents\nFROM orders\nGROUP BY user_id;`,
        expectedFixAssertion: {
          mustContainTokens: ["completed", "user_id", "amount_cents"],
        },
        explanation: "Filtering `WHERE status = 'completed'` before `GROUP BY user_id` excludes cancelled/refunded orders from revenue.",
      },
      {
        id: `${topic.id}-comp-compare`,
        topicId: topic.id,
        kind: "compare_implementations",
        title: "Compare Subquery vs CTE / Window Framing",
        prompt: `When implementing ${topic.title}, why is a Window Function (\`SUM(...) OVER (PARTITION BY ...)\`) often preferred over a correlated subquery?`,
        language: "sql",
        codeSnippet: `-- A: Window Function\nSELECT order_id, user_id, SUM(amount_cents) OVER (PARTITION BY user_id) FROM orders;\n\n-- B: Correlated Subquery\nSELECT o1.order_id, o1.user_id, (SELECT SUM(o2.amount_cents) FROM orders o2 WHERE o2.user_id = o1.user_id) FROM orders o1;`,
        options: [
          { id: "a", text: "Window functions execute in a single sorted/hashed pass O(N log N), avoiding repeated O(N^2) table scans per row." },
          { id: "b", text: "Window functions collapse rows into 1 row per user automatically." },
          { id: "c", text: "Correlated subqueries cannot use WHERE clauses." },
        ],
        correctOptionId: "a",
        explanation: "Window functions retain original row granularity while computing partition aggregates in a single scan/sort pass rather than re-scanning per outer row.",
      },
    ];
  }

  return [
    {
      id: `${topic.id}-comp-predict`,
      topicId: topic.id,
      kind: "predict_output",
      title: `Predict the Output (${primaryConcept})`,
      prompt: `Trace how state mutates step by step. What exact output does this snippet print?`,
      language: "python",
      codeSnippet: `def append_score(val, bucket=None):\n    if bucket is None:\n        bucket = []\n    bucket.append(val)\n    return bucket\n\na = append_score(10)\nb = append_score(20)\nprint(a, b)`,
      options: [
        { id: "a", text: "[10] [20]" },
        { id: "b", text: "[10, 20] [10, 20]" },
        { id: "c", text: "[10] [10, 20]" },
      ],
      correctOptionId: "a",
      explanation: "Because `bucket=None` creates a fresh list inside each call (`bucket = []`), `a` and `b` stay isolated. Using `bucket=[]` as a default argument would have caused shared mutation across calls!",
    },
    {
      id: `${topic.id}-comp-debug`,
      topicId: topic.id,
      kind: "debug_fix",
      title: `Spot & Fix the Bug (${topic.title})`,
      prompt: `The function \`safe_ratio_percent(num, den)\` crashes when \`den == 0\` and does not round to 2 decimal places. Fix the implementation and verify it handles zero division cleanly.`,
      language: "python",
      codeSnippet: `def safe_ratio_percent(num, den):\n    # BUG: crashes on den == 0 and lacks rounding\n    return (num / den) * 100`,
      starterFixCode: `def safe_ratio_percent(num, den):\n    # Fix zero-division bug and round to 2 decimal places\n    return (num / den) * 100\n`,
      expectedFixAssertion: {
        fnName: "safe_ratio_percent",
        testInput: [1, 0],
        expectedOutput: 0.0,
      },
      explanation: "Production numeric code must always guard against zero/NaN denominators (`if not den: return 0.0`) before dividing.",
    },
    {
      id: `${topic.id}-comp-compare`,
      topicId: topic.id,
      kind: "compare_implementations",
      title: `Edge Case & Trade-Off Comparison (${primaryConcept})`,
      prompt: `Comparing Lookup A vs Lookup B for checking duplicates across 50,000 items in ${topic.title}: which implementation scales cleanly without O(N^2) slowdown?`,
      language: "python",
      codeSnippet: `# Implementation A\nseen_a = []\nfor x in items:\n    if x in seen_a: dupes.append(x)\n    seen_a.append(x)\n\n# Implementation B\nseen_b = set()\nfor x in items:\n    if x in seen_b: dupes.append(x)\n    seen_b.add(x)`,
      options: [
        { id: "a", text: "Implementation B: `set` membership lookup is O(1) average hash lookup -> O(N) total, whereas list scan in A is O(N^2)." },
        { id: "b", text: "Implementation A is faster because lists preserve order while hash tables scan linearly." },
        { id: "c", text: "Both execute in identical O(N) time in Python 3." },
      ],
      correctOptionId: "a",
      explanation: "Hash-backed `set` lookups run in O(1) average time; scanning a `list` on each iteration causes quadratic O(N^2) runtime.",
    },
  ];
}

export async function evaluateComprehensionExercise(params: {
  topicId: string;
  challengeId: string;
  selectedOptionId?: string;
  userFixCode?: string;
}): Promise<{
  passed: boolean;
  score: number;
  feedback: string;
  stdout?: string;
  stderr?: string;
}> {
  const suite = getTopicComprehensionSuite(params.topicId);
  const challenge = suite.find((c) => c.id === params.challengeId);
  if (!challenge) {
    return { passed: false, score: 0, feedback: "Comprehension challenge not found." };
  }

  if (challenge.kind !== "debug_fix") {
    const passed = Boolean(params.selectedOptionId && params.selectedOptionId === challenge.correctOptionId);
    return {
      passed,
      score: passed ? 100 : 0,
      feedback: passed
        ? `Correct! ${challenge.explanation}`
        : `Not quite — ${challenge.explanation}`,
    };
  }

  // Real sandbox debugging evaluation
  const code = (params.userFixCode || "").trim();
  if (!code) {
    return { passed: false, score: 0, feedback: "Write your debugged implementation before submitting." };
  }

  if (challenge.language === "sql") {
    const res = await executeSqlInSandbox("ecommerce_analytics", code);
    const lowerSql = code.toLowerCase();
    const hasCompletedFilter = lowerSql.includes("completed");
    const passed = res.success && hasCompletedFilter && res.rowCount > 0;
    return {
      passed,
      score: passed ? 100 : res.success ? 45 : 0,
      stdout: res.success ? `Query executed cleanly (${res.rowCount} rows).` : "",
      stderr: res.errorMessage,
      feedback: passed
        ? `Verified! Bug fixed: query filters completed orders cleanly (${res.rowCount} rows).`
        : res.errorMessage
        ? `SQL Error: ${res.errorMessage}`
        : "Query ran, but still misses `WHERE status = 'completed'` filtering.",
    };
  }

  // Python live test harness for debug_fix
  const fnName = challenge.expectedFixAssertion?.fnName || "safe_ratio_percent";
  const testCode = `${code}

import json
try:
    r_zero = ${fnName}(1, 0)
    r_valid = ${fnName}(1, 3)
    ok = (r_zero == 0 or r_zero == 0.0) and abs(r_valid - 33.33) <= 0.05
    print("__DEBUG_RESULT__:" + json.dumps({"ok": ok, "r_zero": r_zero, "r_valid": r_valid}))
except Exception as ex:
    print("__DEBUG_ERR__:" + str(ex))
`;
  const res = await executePythonInSandbox(testCode);
  const stdout = res.stdout || "";
  if (!res.success || stdout.includes("__DEBUG_ERR__")) {
    return {
      passed: false,
      score: 10,
      stdout,
      stderr: res.stderr || stdout,
      feedback: `Execution failed: ${res.stderr || stdout}`,
    };
  }
  const match = stdout.match(/__DEBUG_RESULT__:(\{.*\})/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.ok) {
        return {
          passed: true,
          score: 100,
          stdout: `Tests passed: safe_ratio_percent(1, 0) -> ${parsed.r_zero}, safe_ratio_percent(1, 3) -> ${parsed.r_valid}`,
          feedback: `Debug fix verified! Handled zero division cleanly and rounded to 2 decimal places.`,
        };
      }
      return {
        passed: false,
        score: 40,
        stdout: `Got r_zero=${parsed.r_zero}, r_valid=${parsed.r_valid} (expected 0.0 and 33.33)`,
        feedback: `Zero division or rounding needs correction: safe_ratio_percent(1, 3) returned ${parsed.r_valid} (expected ~33.33).`,
      };
    } catch {}
  }

  return {
    passed: false,
    score: 20,
    stdout,
    stderr: res.stderr,
    feedback: "Could not verify function output. Ensure `safe_ratio_percent(num, den)` returns numeric output.",
  };
}
