/**
 * lib/skills/ai-data/sql-lab-engine.ts
 * 
 * Genuine, Sandboxed In-Memory SQL Execution & Assessment Engine for Track 2.
 * Powered by Node.js built-in DatabaseSync (node:sqlite).
 * Server-only module.
 */

// @ts-ignore
import { DatabaseSync } from "node:sqlite";
import { getAnalyticsDataset, AnalyticsDatasetManifest } from "./datasets";

export interface SqlLabChallenge {
  id: string;
  slug: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  canonicalSkill: string;
  datasetId: string;
  summary: string;
  instructionsMarkdown: string;
  hints: string[];
  starterSql: string;
  referenceSql: string;
  expectedColumns: string[];
  strictOrdering: boolean;
  explanation: string;
  commonMistakes: string[];
}

export interface SqlExecutionResult {
  success: boolean;
  status: "passed" | "failed" | "syntax_error" | "runtime_error" | "security_violation";
  errorMessage?: string;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  testPassed?: boolean;
  score?: number;
  feedback?: string;
  diagnostics?: string[];
}

// ── 1. SECURITY FILTER ───────────────────────────────────────────────────────
const BANNED_SQL_PATTERNS = [
  /\battach\b/i,
  /\bdetach\b/i,
  /\bpragma\s+writable_schema\b/i,
  /\bload_extension\b/i,
  /\bsystem\b/i,
  /\bexec\b/i
];

export function sanitizeSqlQuery(sql: string): { isSafe: boolean; violationReason?: string } {
  const trimmed = sql.trim();
  for (const pattern of BANNED_SQL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        violationReason: `Query contains restricted security keyword: ${pattern.source}`
      };
    }
  }
  return { isSafe: true };
}

// ── 2. ROW COMPARISON UTILITIES ──────────────────────────────────────────────
function normalizeRow(row: Record<string, any>): Record<string, any> {
  const norm: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.trim().toLowerCase();
    if (v === null || v === undefined) {
      norm[key] = null;
    } else if (typeof v === "number") {
      norm[key] = Number(v.toFixed(4));
    } else {
      norm[key] = String(v).trim();
    }
  }
  return norm;
}

export function areSqlOutputsEqual(
  actual: Record<string, any>[],
  expected: Record<string, any>[],
  strictOrder = false
): boolean {
  if (actual.length !== expected.length) return false;
  const normA = actual.map(normalizeRow);
  const normE = expected.map(normalizeRow);

  if (strictOrder) {
    for (let i = 0; i < normA.length; i++) {
      const a = normA[i];
      const e = normE[i];
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
  const matched = new Array(normE.length).fill(false);
  for (const aRow of normA) {
    let found = false;
    for (let j = 0; j < normE.length; j++) {
      if (matched[j]) continue;
      const eRow = normE[j];
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

// ── 3. CHALLENGE REPOSITORY ──────────────────────────────────────────────────
export const SQL_LAB_CHALLENGES: Record<string, SqlLabChallenge> = {
  "sql-cohort-monthly-retention": {
    id: "sql-cohort-monthly-retention",
    slug: "sql-cohort-monthly-retention",
    title: "Triangular Cohort Retention Analysis",
    difficulty: "advanced",
    canonicalSkill: "business_product_analytics",
    datasetId: "ecommerce_analytics",
    summary: "Calculate how many users acquired in January 2025 returned to place orders in subsequent months (Month 0, Month 1, Month 2).",
    instructionsMarkdown: `### Business Objective
Analyze user retention for the **2025-01** signup cohort.

### Requirements:
1. Identify users who signed up in January 2025 (\`strftime('%Y-%m', signup_date) = '2025-01'\`).
2. For each distinct order month (\`strftime('%Y-%m', order_date)\`) placed by these users:
   - Output \`cohort_month\` ('2025-01')
   - Output \`order_month\` (e.g. '2025-01', '2025-02', '2025-03')
   - Output \`retained_users\` (COUNT of DISTINCT active users who placed a completed order)
3. Order the results chronologically by \`order_month\` ASC.
`,
    hints: [
      "Filter users by `strftime('%Y-%m', signup_date) = '2025-01'`.",
      "Join with orders ON users.user_id = orders.user_id AND orders.status = 'completed'.",
      "Use `COUNT(DISTINCT users.user_id)` to count unique retained users per order_month."
    ],
    starterSql: `-- Write your cohort retention query below:
SELECT
  '2025-01' AS cohort_month,
  strftime('%Y-%m', o.order_date) AS order_month,
  COUNT(DISTINCT u.user_id) AS retained_users
FROM users u
JOIN orders o ON u.user_id = o.user_id AND o.status = 'completed'
WHERE strftime('%Y-%m', u.signup_date) = '2025-01'
GROUP BY order_month
ORDER BY order_month ASC;
`,
    referenceSql: `
SELECT
  '2025-01' AS cohort_month,
  strftime('%Y-%m', o.order_date) AS order_month,
  COUNT(DISTINCT u.user_id) AS retained_users
FROM users u
JOIN orders o ON u.user_id = o.user_id AND o.status = 'completed'
WHERE strftime('%Y-%m', u.signup_date) = '2025-01'
GROUP BY order_month
ORDER BY order_month ASC;
`,
    expectedColumns: ["cohort_month", "order_month", "retained_users"],
    strictOrdering: true,
    explanation: "Grouping by order_month on a pre-filtered cohort calculates the active user count across successive periods. Notice that User 101 made orders in Jan, Feb, and March, while User 102 ordered in Jan and March.",
    commonMistakes: [
      "Forgetting DISTINCT in COUNT(DISTINCT user_id), counting multiple orders by the same user multiple times.",
      "Failing to filter orders by `status = 'completed'`."
    ]
  },

  "sql-running-revenue-window": {
    id: "sql-running-revenue-window",
    slug: "sql-running-revenue-window",
    title: "Cumulative Running Revenue per User",
    difficulty: "intermediate",
    canonicalSkill: "advanced_sql_analytics",
    datasetId: "ecommerce_analytics",
    summary: "Compute the cumulative running total of completed order spend for each customer over time using SQL Window functions.",
    instructionsMarkdown: `### Business Objective
Compute a running cumulative total of order spend per customer.

### Requirements:
1. Select \`order_id\`, \`user_id\`, \`order_date\`, \`amount_cents\`.
2. Compute \`cumulative_spend_cents\` using \`SUM(amount_cents) OVER (PARTITION BY user_id ORDER BY order_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)\`.
3. Filter only orders where \`status = 'completed'\`.
4. Order the output by \`user_id\` ASC, \`order_date\` ASC.
`,
    hints: [
      "Use `SUM(amount_cents) OVER (PARTITION BY user_id ORDER BY order_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`.",
      "Filter orders WHERE status = 'completed'."
    ],
    starterSql: `-- Compute cumulative spend per customer:
SELECT
  order_id,
  user_id,
  order_date,
  amount_cents,
  SUM(amount_cents) OVER (
    PARTITION BY user_id 
    ORDER BY order_date ASC 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_spend_cents
FROM orders
WHERE status = 'completed'
ORDER BY user_id ASC, order_date ASC;
`,
    referenceSql: `
SELECT
  order_id,
  user_id,
  order_date,
  amount_cents,
  SUM(amount_cents) OVER (
    PARTITION BY user_id 
    ORDER BY order_date ASC 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_spend_cents
FROM orders
WHERE status = 'completed'
ORDER BY user_id ASC, order_date ASC;
`,
    expectedColumns: ["order_id", "user_id", "order_date", "amount_cents", "cumulative_spend_cents"],
    strictOrdering: true,
    explanation: "The window clause `PARTITION BY user_id ORDER BY order_date` resets the running total for each customer, computing their progressive lifetime value.",
    commonMistakes: [
      "Omitting the PARTITION BY clause, which causes cumulative sum to bleed across all users.",
      "Using ORDER BY without framing, causing peer rows with same date to be summed together."
    ]
  },

  "sql-ab-test-variant-conversion": {
    id: "sql-ab-test-variant-conversion",
    slug: "sql-ab-test-variant-conversion",
    title: "A/B Experiment Variant Conversion Rates",
    difficulty: "intermediate",
    canonicalSkill: "ab_testing_statistics",
    datasetId: "ab_experiment_stream",
    summary: "Join assignment variants with conversions to calculate user counts, converted users, and conversion rate percentage per variant.",
    instructionsMarkdown: `### Business Objective
Evaluate the checkout redesign experiment.

### Requirements:
1. For each \`variant_name\` in \`experiment_variants\`:
   - Output \`variant_name\` ('control', 'treatment')
   - Output \`total_assigned\` (COUNT of distinct users assigned)
   - Output \`total_converted\` (COUNT of distinct users with a conversion)
   - Output \`conversion_rate_pct\` = \`ROUND(100.0 * total_converted / total_assigned, 2)\`
2. Order by \`variant_name\` ASC.
`,
    hints: [
      "Use `LEFT JOIN experiment_conversions c ON v.user_id = c.user_id` so unconverted users are preserved.",
      "Use `COUNT(DISTINCT v.user_id)` for total_assigned and `COUNT(DISTINCT c.user_id)` for total_converted."
    ],
    starterSql: `-- Calculate conversion rate per variant:
SELECT
  v.variant_name,
  COUNT(DISTINCT v.user_id) AS total_assigned,
  COUNT(DISTINCT c.user_id) AS total_converted,
  ROUND(100.0 * COUNT(DISTINCT c.user_id) / COUNT(DISTINCT v.user_id), 2) AS conversion_rate_pct
FROM experiment_variants v
LEFT JOIN experiment_conversions c ON v.user_id = c.user_id
GROUP BY v.variant_name
ORDER BY v.variant_name ASC;
`,
    referenceSql: `
SELECT
  v.variant_name,
  COUNT(DISTINCT v.user_id) AS total_assigned,
  COUNT(DISTINCT c.user_id) AS total_converted,
  ROUND(100.0 * COUNT(DISTINCT c.user_id) / COUNT(DISTINCT v.user_id), 2) AS conversion_rate_pct
FROM experiment_variants v
LEFT JOIN experiment_conversions c ON v.user_id = c.user_id
GROUP BY v.variant_name
ORDER BY v.variant_name ASC;
`,
    expectedColumns: ["variant_name", "total_assigned", "total_converted", "conversion_rate_pct"],
    strictOrdering: true,
    explanation: "A LEFT JOIN preserves all allocated users in both arms. In our synthetic dataset, Treatment has 5 conversions out of 6 (83.33%) while Control has 1 out of 6 (16.67%).",
    commonMistakes: [
      "Using an INNER JOIN which eliminates unconverted users, making total_assigned equal to total_converted (100%).",
      "Integer division without 100.0 (resulting in 0% conversion rate)."
    ]
  }
};

export function getSqlChallengeBySlug(slug: string): SqlLabChallenge | undefined {
  return SQL_LAB_CHALLENGES[slug];
}

export function getAllSqlChallenges(): SqlLabChallenge[] {
  return Object.values(SQL_LAB_CHALLENGES);
}

// ── 4. EXECUTION HARNESS ──────────────────────────────────────────────────────
export async function executeSqlInSandbox(
  datasetId: string,
  userSql: string,
  challengeSlug?: string
): Promise<SqlExecutionResult> {
  const startTime = Date.now();
  const dataset = getAnalyticsDataset(datasetId);

  // 1. Security Check
  const security = sanitizeSqlQuery(userSql);
  if (!security.isSafe) {
    return {
      success: false,
      status: "security_violation",
      errorMessage: security.violationReason,
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 0
    };
  }

  let db: DatabaseSync | null = null;
  try {
    // 2. Initialize fresh isolated in-memory SQLite database
    db = new DatabaseSync(":memory:");

    // 3. Populate all tables and seed records for this dataset
    for (const table of dataset.tables) {
      db.exec(table.createDdl);
      db.exec(table.insertDml);
    }

    // 4. Prepare and execute user query
    const prepared = db.prepare(userSql);
    const rawRows = prepared.all() as Record<string, any>[];
    const executionTimeMs = Date.now() - startTime;
    const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

    // 5. If challenge specified, validate against reference solution
    let testPassed = true;
    let score = 100;
    let feedback = "Query executed successfully.";
    const diagnostics: string[] = [];

    if (challengeSlug && SQL_LAB_CHALLENGES[challengeSlug]) {
      const challenge = SQL_LAB_CHALLENGES[challengeSlug];
      const refPrepared = db.prepare(challenge.referenceSql);
      const expectedRows = refPrepared.all() as Record<string, any>[];

      const match = areSqlOutputsEqual(rawRows, expectedRows, challenge.strictOrdering);
      if (match) {
        testPassed = true;
        score = 100;
        feedback = `Accepted! Output matches verified reference data (${rawRows.length} rows returned).`;
      } else {
        testPassed = false;
        score = 30; // Syntax succeeded, but logical row output differed
        feedback = `Incorrect Output: Returned ${rawRows.length} rows, but expected ${expectedRows.length} rows matching the reference specifications.`;

        // Diagnostic heuristics
        if (rawRows.length === 0) {
          diagnostics.push("Your query produced 0 rows. Check your JOIN conditions and WHERE filters.");
        } else if (columns.length !== challenge.expectedColumns.length) {
          diagnostics.push(`Column count mismatch: Expected ${challenge.expectedColumns.join(", ")}, but received ${columns.join(", ")}.`);
        }
      }
    }

    return {
      success: true,
      status: testPassed ? "passed" : "failed",
      columns,
      rows: rawRows.slice(0, 100), // Cap to 100 rows for safe payload transit
      rowCount: rawRows.length,
      executionTimeMs,
      testPassed,
      score,
      feedback,
      diagnostics
    };
  } catch (err: any) {
    const executionTimeMs = Date.now() - startTime;
    const msg = err?.message || String(err);
    const isSyntax = msg.toLowerCase().includes("syntax") || msg.toLowerCase().includes("near");

    return {
      success: false,
      status: isSyntax ? "syntax_error" : "runtime_error",
      errorMessage: msg,
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs,
      testPassed: false,
      score: 0,
      feedback: `Execution Error: ${msg}`,
      diagnostics: [msg]
    };
  } finally {
    if (db) {
      try {
        db.close();
      } catch {}
    }
  }
}

