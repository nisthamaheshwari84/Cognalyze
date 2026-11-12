/**
 * lib/recruitment/assessment-problems.ts
 * 
 * Curated problem repository for company-calibrated Online Assessments.
 * Each problem includes executable test suites (public + hidden test cases)
 * runnable inside our real sandboxed Python and SQLite execution engines.
 */

import {
  CodingAssessmentProblem,
  SqlAssessmentProblem,
  AptitudeQuestion,
  WorkSimulationScenario,
  StageAssessmentBundle,
} from "./assessment-types";

// ============================================================================
// 1. CODING ASSESSMENT PROBLEMS
// ============================================================================

export const GOOGLE_OA_PROBLEMS: CodingAssessmentProblem[] = [
  {
    id: "goc_01_server_load",
    stageId: "stage_google_oa",
    title: "Server Load & Interval Task Balancing",
    difficulty: "HARD",
    category: "Greedy / Priority Queue",
    descriptionMarkdown: `You are given a list of scheduled computational tasks, where each task is represented as \`[start_time, end_time, priority]\`.
You have \`k\` available servers. Each server can execute at most one task at any given time.
If all servers are busy when a task arrives, the task with the lowest priority among currently running tasks is preempted only if the new task's priority is strictly higher. Otherwise, the new task is discarded.

Return the total number of successfully completed tasks.`,
    constraints: [
      "1 <= tasks.length <= 10^5",
      "0 <= start_time < end_time <= 10^9",
      "1 <= priority <= 10^6",
      "1 <= k <= 10^4",
    ],
    examples: [
      {
        input: "tasks = [[1, 5, 2], [2, 4, 5], [3, 8, 1]], k = 1",
        output: "1",
        explanation: "Task 2 preempts Task 1 at time 2 because priority 5 > 2. Task 2 completes at time 4.",
      },
    ],
    entryFunction: "count_completed_tasks",
    starterCode: {
      python: `def count_completed_tasks(tasks: list[list[int]], k: int) -> int:
    # Write your solution here
    return 0
`,
    },
    testCases: [
      {
        id: "tc_goc_1_pub",
        args: [[[1, 5, 2], [2, 4, 5], [3, 8, 1]], 1],
        expected: 1,
        isHidden: false,
      },
      {
        id: "tc_goc_2_pub",
        args: [[[1, 4, 3], [2, 6, 2], [5, 8, 4]], 2],
        expected: 2,
        isHidden: false,
      },
      {
        id: "tc_goc_3_hid",
        args: [[[1, 10, 1], [2, 5, 10], [3, 7, 20], [6, 9, 15]], 2],
        expected: 3,
        isHidden: true,
      },
      {
        id: "tc_goc_4_hid",
        args: [[], 3],
        expected: 0,
        isHidden: true,
      },
    ],
    timeLimitMs: 2000,
  },
  {
    id: "goc_02_dag_max_path",
    stageId: "stage_google_oa",
    title: "Maximum Cost Vertex Path in DAG",
    difficulty: "MEDIUM",
    category: "Dynamic Programming / Graphs",
    descriptionMarkdown: `Given a Directed Acyclic Graph (DAG) with \`n\` vertices numbered from \`0\` to \`n - 1\`, an array of vertex values \`values\`, and a list of directed edges \`edges\` where \`edges[i] = [u, v]\`.

Find the maximum sum of vertex values along any directed path that starts at vertex \`0\`. If no outgoing path exists, return \`values[0]\`.`,
    constraints: [
      "1 <= n <= 10^4",
      "0 <= edges.length <= 5 * 10^4",
      "-10^4 <= values[i] <= 10^4",
    ],
    examples: [
      {
        input: "n = 4, values = [10, 20, 30, -5], edges = [[0, 1], [0, 2], [1, 3], [2, 3]]",
        output: "40",
        explanation: "Path 0 -> 2 has sum 10 + 30 = 40. Path 0 -> 2 -> 3 has sum 10 + 30 + (-5) = 35.",
      },
    ],
    entryFunction: "max_dag_path",
    starterCode: {
      python: `def max_dag_path(n: int, values: list[int], edges: list[list[int]]) -> int:
    # Write your solution here
    return values[0] if values else 0
`,
    },
    testCases: [
      {
        id: "tc_goc_dag_1",
        args: [4, [10, 20, 30, -5], [[0, 1], [0, 2], [1, 3], [2, 3]]],
        expected: 40,
        isHidden: false,
      },
      {
        id: "tc_goc_dag_2",
        args: [3, [5, -2, 10], [[0, 1], [1, 2]]],
        expected: 13,
        isHidden: false,
      },
      {
        id: "tc_goc_dag_3_hid",
        args: [1, [42], []],
        expected: 42,
        isHidden: true,
      },
      {
        id: "tc_goc_dag_4_hid",
        args: [5, [1, 2, 3, 4, 5], [[0, 1], [1, 2], [2, 3], [3, 4]]],
        expected: 15,
        isHidden: true,
      },
    ],
    timeLimitMs: 1500,
  },
];

export const AMAZON_OA_PROBLEMS: CodingAssessmentProblem[] = [
  {
    id: "amzn_01_k_closest",
    stageId: "stage_amzn_oa1",
    title: "K Closest Fulfillment Hubs",
    difficulty: "MEDIUM",
    category: "Heap / Quickselect",
    descriptionMarkdown: `Given an array of points where \`points[i] = [x, y]\` represents the coordinate of a fulfillment hub on an integer grid, and an integer \`k\`, return the \`k\` closest fulfillment hubs to the customer location \`[0, 0]\`.

The distance between two points on the X-Y plane is the Euclidean distance: \`sqrt((x1 - x2)^2 + (y1 - y2)^2)\`.
Return points sorted in ascending order by distance. If two points have equal distance, sort by \`x\`, then by \`y\`.`,
    constraints: [
      "1 <= k <= points.length <= 10^4",
      "-10^4 <= points[i][0], points[i][1] <= 10^4",
    ],
    examples: [
      {
        input: "points = [[1, 3], [-2, 2]], k = 1",
        output: "[[-2, 2]]",
        explanation: "Distance of [1, 3] is sqrt(10), distance of [-2, 2] is sqrt(8).",
      },
    ],
    entryFunction: "k_closest_hubs",
    starterCode: {
      python: `def k_closest_hubs(points: list[list[int]], k: int) -> list[list[int]]:
    # Write your solution here
    return []
`,
    },
    testCases: [
      {
        id: "tc_amzn_1",
        args: [[[1, 3], [-2, 2]], 1],
        expected: [[-2, 2]],
        isHidden: false,
      },
      {
        id: "tc_amzn_2",
        args: [[[3, 3], [5, -1], [-2, 4]], 2],
        expected: [[3, 3], [-2, 4]],
        isHidden: false,
      },
      {
        id: "tc_amzn_3_hid",
        args: [[[0, 1], [1, 0]], 2],
        expected: [[0, 1], [1, 0]],
        isHidden: true,
      },
    ],
    timeLimitMs: 1500,
  },
  {
    id: "amzn_02_sliding_inventory",
    stageId: "stage_amzn_oa1",
    title: "Longest Stable Inventory Window",
    difficulty: "MEDIUM",
    category: "Sliding Window / HashMap",
    descriptionMarkdown: `You are analyzing hourly warehouse departures. You are given a string \`departures\` where each character represents a distinct item SKU category, and an integer \`k\`.

Find the length of the longest contiguous subsegment of departures that contains at most \`k\` distinct SKU categories.`,
    constraints: [
      "1 <= departures.length <= 10^5",
      "0 <= k <= 50",
    ],
    examples: [
      {
        input: "departures = 'eceba', k = 2",
        output: "3",
        explanation: "The substring 'ece' contains 2 distinct characters ('e' and 'c') and has length 3.",
      },
    ],
    entryFunction: "longest_stable_window",
    starterCode: {
      python: `def longest_stable_window(departures: str, k: int) -> int:
    # Write your solution here
    return 0
`,
    },
    testCases: [
      {
        id: "tc_amzn_win_1",
        args: ["eceba", 2],
        expected: 3,
        isHidden: false,
      },
      {
        id: "tc_amzn_win_2",
        args: ["aa", 1],
        expected: 2,
        isHidden: false,
      },
      {
        id: "tc_amzn_win_3_hid",
        args: ["a", 0],
        expected: 0,
        isHidden: true,
      },
      {
        id: "tc_amzn_win_4_hid",
        args: ["abaccc", 2],
        expected: 4,
        isHidden: true,
      },
    ],
    timeLimitMs: 1500,
  },
];

export const MICROSOFT_OA_PROBLEMS: CodingAssessmentProblem[] = [
  {
    id: "msft_01_min_deletions",
    stageId: "stage_msft_oa",
    title: "Minimum Character Deletions to Make Frequencies Unique",
    difficulty: "MEDIUM",
    category: "Greedy / Hashing",
    descriptionMarkdown: `A string \`s\` is called good if there are no two different characters in \`s\` that have the same frequency.
Given a string \`s\`, return the minimum number of characters you need to delete to make \`s\` good.

The frequency of a character in a string is the number of times it appears in the string.`,
    constraints: [
      "1 <= s.length <= 10^5",
      "s contains only lowercase English letters.",
    ],
    examples: [
      {
        input: "s = 'aab'",
        output: "0",
        explanation: "'a' has freq 2, 'b' has freq 1. Already good.",
      },
      {
        input: "s = 'aaabbbcc'",
        output: "2",
        explanation: "Delete one 'b' and one 'c' to get frequencies 3, 2, 1.",
      },
    ],
    entryFunction: "min_deletions_to_unique",
    starterCode: {
      python: `def min_deletions_to_unique(s: str) -> int:
    # Write your solution here
    return 0
`,
    },
    testCases: [
      {
        id: "tc_msft_1",
        args: ["aab"],
        expected: 0,
        isHidden: false,
      },
      {
        id: "tc_msft_2",
        args: ["aaabbbcc"],
        expected: 2,
        isHidden: false,
      },
      {
        id: "tc_msft_3_hid",
        args: ["ceabaacb"],
        expected: 2,
        isHidden: true,
      },
      {
        id: "tc_msft_4_hid",
        args: ["bbcebab"],
        expected: 2,
        isHidden: true,
      },
    ],
    timeLimitMs: 1500,
  },
];

export const ATLASSIAN_OA_PROBLEMS: CodingAssessmentProblem[] = [
  {
    id: "atlassian_01_token_bucket",
    stageId: "stage_atlassian_oa",
    title: "Token Bucket Rate Limiter Simulation",
    difficulty: "MEDIUM",
    category: "System Algorithm / Sliding Counter",
    descriptionMarkdown: `Implement an API rate limiter using the Token Bucket algorithm.
The bucket has a maximum capacity of \`capacity\` tokens. Tokens refill at a rate of \`refill_rate\` tokens per second.
Initially, at \`timestamp = 0\`, the bucket is completely full with \`capacity\` tokens.

You are given a list of request timestamps \`requests\` in non-decreasing order. Each request requires 1 token.
If at least 1 token is available, the request is accepted (return \`True\`) and 1 token is consumed. Otherwise, it is rejected (return \`False\`).

Return a list of boolean values indicating whether each request was accepted or rejected.`,
    constraints: [
      "1 <= capacity <= 1000",
      "1 <= refill_rate <= 100",
      "1 <= requests.length <= 10^4",
      "0 <= requests[i] <= 10^6",
    ],
    examples: [
      {
        input: "capacity = 3, refill_rate = 1, requests = [0, 0, 0, 0, 1]",
        output: "[True, True, True, False, True]",
        explanation: "At t=0, 3 tokens are available. The first 3 requests take 3 tokens. The 4th request at t=0 is rejected. At t=1, 1 token refills, so the 5th request is accepted.",
      },
    ],
    entryFunction: "simulate_rate_limiter",
    starterCode: {
      python: `def simulate_rate_limiter(capacity: int, refill_rate: int, requests: list[int]) -> list[bool]:
    # Write your solution here
    return []
`,
    },
    testCases: [
      {
        id: "tc_atl_1",
        args: [3, 1, [0, 0, 0, 0, 1]],
        expected: [true, true, true, false, true],
        isHidden: false,
      },
      {
        id: "tc_atl_2",
        args: [1, 2, [0, 1, 1, 2]],
        expected: [true, true, false, true],
        isHidden: false,
      },
      {
        id: "tc_atl_3_hid",
        args: [5, 1, [0, 10, 10, 10, 10, 10, 10]],
        expected: [true, true, true, true, true, true, false],
        isHidden: true,
      },
    ],
    timeLimitMs: 1500,
  },
];

export const JPMORGAN_OA_PROBLEMS: CodingAssessmentProblem[] = [
  {
    id: "jpmc_01_reconciliation",
    stageId: "stage_jpmc_oa",
    title: "Ledger Transaction Discrepancy Reconciliation",
    difficulty: "MEDIUM",
    category: "Two Pointers / Hash Map",
    descriptionMarkdown: `You are auditing two financial transaction ledgers: \`internal_ledger\` and \`clearing_house_ledger\`.
Each entry in both ledgers is a tuple \`[tx_id, amount]\`.
Every legitimate transaction should match in both ledgers with the identical \`tx_id\` and \`amount\`.

Identify:
1. \`missing_in_clearing\`: list of \`tx_id\` present in internal ledger but missing in clearing house.
2. \`missing_in_internal\`: list of \`tx_id\` present in clearing house but missing in internal ledger.
3. \`mismatched_amounts\`: list of \`tx_id\` present in both ledgers but with conflicting amounts.

Return the result as a list of 3 sorted lists: \`[missing_in_clearing, missing_in_internal, mismatched_amounts]\`.`,
    constraints: [
      "0 <= internal_ledger.length, clearing_house_ledger.length <= 10^5",
      "Amounts are floats with up to 2 decimal places.",
    ],
    examples: [
      {
        input: "internal = [['TX1', 100.0], ['TX2', 50.0]], clearing = [['TX1', 100.0], ['TX3', 25.0]]",
        output: "[['TX2'], ['TX3'], []]",
        explanation: "TX2 is only in internal, TX3 is only in clearing, no mismatched amounts.",
      },
    ],
    entryFunction: "reconcile_ledgers",
    starterCode: {
      python: `def reconcile_ledgers(internal_ledger: list[list], clearing_house_ledger: list[list]) -> list[list]:
    # Write your solution here
    return [[], [], []]
`,
    },
    testCases: [
      {
        id: "tc_jpmc_1",
        args: [
          [["TX1", 100.0], ["TX2", 50.0]],
          [["TX1", 100.0], ["TX3", 25.0]],
        ],
        expected: [["TX2"], ["TX3"], []],
        isHidden: false,
      },
      {
        id: "tc_jpmc_2",
        args: [
          [["TX1", 100.0], ["TX2", 200.0]],
          [["TX1", 105.0], ["TX2", 200.0]],
        ],
        expected: [[], [], ["TX1"]],
        isHidden: false,
      },
      {
        id: "tc_jpmc_3_hid",
        args: [[], []],
        expected: [[], [], []],
        isHidden: true,
      },
    ],
    timeLimitMs: 1500,
  },
];

// ============================================================================
// 2. SQL ASSESSMENT PROBLEMS (DELOITTE & AMAZON DA)
// ============================================================================

export const DELOITTE_SQL_PROBLEMS: SqlAssessmentProblem[] = [
  {
    id: "deloitte_sql_01_country_revenue",
    stageId: "stage_deloitte_sql",
    title: "Regional Order Volume & Spending Dense Rank",
    difficulty: "MEDIUM",
    datasetId: "ecommerce_analytics",
    descriptionMarkdown: `Write a SQL query against the e-commerce dataset to calculate:
1. Total completed orders (\`total_orders\`) per country.
2. Total spending in dollars (\`total_spent_dollars\`, computed as \`ROUND(SUM(amount_cents) / 100.0, 2)\`).
3. Dense rank (\`spending_rank\`) of each country ordered by total spending in descending order.

Only include orders where \`status = 'completed'\`. Order results by \`spending_rank\` ascending.`,
    schemaDocumentation: `Table: users (user_id INT, full_name TEXT, email TEXT, signup_date TEXT, acquisition_channel TEXT, country TEXT)
Table: orders (order_id INT, user_id INT, order_date TEXT, amount_cents INT, status TEXT)`,
    starterSql: `-- Write your SQL query here
SELECT
  u.country,
  COUNT(o.order_id) AS total_orders,
  ROUND(SUM(o.amount_cents) / 100.0, 2) AS total_spent_dollars
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.country;`,
    referenceSql: `SELECT
  u.country,
  COUNT(o.order_id) AS total_orders,
  ROUND(SUM(o.amount_cents) / 100.0, 2) AS total_spent_dollars,
  DENSE_RANK() OVER (ORDER BY SUM(o.amount_cents) DESC) AS spending_rank
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.country
ORDER BY spending_rank ASC;`,
    expectedColumns: ["country", "total_orders", "total_spent_dollars", "spending_rank"],
    strictOrdering: true,
    explanation:
      "Performs an INNER JOIN between users and orders, filters on completed orders, aggregates sums and counts grouped by country, and applies DENSE_RANK() window function.",
  },
];

// ============================================================================
// 3. COGNITIVE APTITUDE QUESTIONS (DELOITTE, TCS, ACCENTURE, INFOSYS)
// ============================================================================

export const DELOITTE_APTITUDE_QUESTIONS: AptitudeQuestion[] = [
  {
    id: "del_apt_01",
    stageId: "stage_deloitte_cog",
    section: "quantitative",
    questionText:
      "A digital marketing campaign yields a 4% conversion rate. If 2,500 users click the advertisement and the average revenue per conversion is $85, what is the total generated revenue?",
    options: ["$6,800", "$8,500", "$10,200", "$7,500"],
    correctOptionIndex: 1,
    explanation: "Conversions = 2,500 * 0.04 = 100 conversions. Total revenue = 100 * $85 = $8,500.",
    topicTag: "percentages_profit_loss",
  },
  {
    id: "del_apt_02",
    stageId: "stage_deloitte_cog",
    section: "logical",
    questionText:
      "In a data pipeline, Job A must finish before Job B. Job C can run concurrently with Job A. Job D requires both B and C to finish. Which job cannot be the first to start?",
    options: ["Job A", "Job B", "Job C", "Job A or C"],
    correctOptionIndex: 1,
    explanation: "Job B has Job A as an absolute prerequisite, so Job B cannot start first.",
    topicTag: "logical_sequencing",
  },
];

// ============================================================================
// 4. WORK SIMULATION SCENARIOS (AMAZON OA2)
// ============================================================================

export const AMAZON_WORK_SIMULATION_SCENARIOS: WorkSimulationScenario[] = [
  {
    id: "amzn_ws_01_priority_conflict",
    stageId: "stage_amzn_oa2",
    scenarioTitle: "Sprint Delivery vs Production Bug Fix",
    contextNarrative:
      "It is Friday morning, 2 days before a scheduled high-visibility retail feature release. A recurring Sev-2 error appears in the production log affecting 0.4% of checkout transactions with a 500 status.",
    emailsOrChats: [
      {
        sender: "Sarah Lin",
        role: "Product Manager",
        timestamp: "09:15 AM",
        content:
          "Hi team, our Prime seasonal launch is scheduled for Monday. The VP is reviewing the release status in our 2 PM sync. We cannot slip this date.",
      },
      {
        sender: "Devon Miller",
        role: "Senior Systems Engineer",
        timestamp: "09:22 AM",
        content:
          "Just saw the error telemetry. The 0.4% failure is caused by an intermittent race condition in our payment token refresh. Root causing and deploying a fix could take 1-2 days.",
      },
    ],
    decisionPrompt:
      "As the SDE owning the checkout token service, how do you handle this trade-off?",
    options: [
      {
        id: "opt_a",
        text: "Halt feature deployment work immediately, dive deep into the payment race condition logs, reproduce the issue in staging, and notify leadership with data on customer impact and estimated recovery time.",
        leadershipPrincipleScore: {
          customer_obsession: 1.0,
          ownership: 0.9,
          dive_deep: 0.95,
        },
        feedback:
          "Exemplary demonstration of Customer Obsession and Ownership. Flawless transactional integrity takes precedence over arbitrary launch deadlines.",
      },
      {
        id: "opt_b",
        text: "Proceed with the Monday feature launch since 99.6% of checkouts succeed, and file a low-priority backlog ticket to investigate the race condition next sprint.",
        leadershipPrincipleScore: {
          customer_obsession: 0.1,
          ownership: 0.2,
        },
        feedback:
          "Violates Customer Obsession. Allowing customers to experience checkout payment failures without immediate ownership undermines customer trust.",
      },
    ],
  },
];

// ============================================================================
// 5. STAGE BUNDLE RESOLVER
// ============================================================================

export function getStageAssessmentBundle(stageId: string): StageAssessmentBundle | null {
  // Google OA
  if (stageId === "stage_google_oa") {
    return {
      stageId,
      companyId: "google",
      format: "coding",
      durationMinutes: 90,
      codingProblems: GOOGLE_OA_PROBLEMS,
    };
  }

  // Amazon OA1
  if (stageId === "stage_amzn_oa1") {
    return {
      stageId,
      companyId: "amazon",
      format: "coding",
      durationMinutes: 70,
      codingProblems: AMAZON_OA_PROBLEMS,
    };
  }

  // Amazon OA2 Work Simulation
  if (stageId === "stage_amzn_oa2") {
    return {
      stageId,
      companyId: "amazon",
      format: "work_simulation",
      durationMinutes: 120,
      workSimulationScenarios: AMAZON_WORK_SIMULATION_SCENARIOS,
    };
  }

  // Microsoft Codility OA
  if (stageId === "stage_msft_oa") {
    return {
      stageId,
      companyId: "microsoft",
      format: "coding",
      durationMinutes: 90,
      codingProblems: MICROSOFT_OA_PROBLEMS,
    };
  }

  // Atlassian HackerRank OA
  if (stageId === "stage_atlassian_oa") {
    return {
      stageId,
      companyId: "atlassian",
      format: "coding",
      durationMinutes: 90,
      codingProblems: ATLASSIAN_OA_PROBLEMS,
    };
  }

  // JPMorgan HackerRank OA
  if (stageId === "stage_jpmc_oa") {
    return {
      stageId,
      companyId: "jpmorgan",
      format: "coding",
      durationMinutes: 60,
      codingProblems: JPMORGAN_OA_PROBLEMS,
    };
  }

  // Deloitte Cognitive
  if (stageId === "stage_deloitte_cog") {
    return {
      stageId,
      companyId: "deloitte",
      format: "aptitude",
      durationMinutes: 60,
      aptitudeQuestions: DELOITTE_APTITUDE_QUESTIONS,
    };
  }

  // Deloitte SQL
  if (stageId === "stage_deloitte_sql" || stageId === "stage_amzn_da_sql") {
    return {
      stageId,
      companyId: stageId === "stage_deloitte_sql" ? "deloitte" : "amazon",
      format: "sql",
      durationMinutes: 45,
      sqlProblems: DELOITTE_SQL_PROBLEMS,
    };
  }

  // Adobe OA
  if (stageId === "stage_adobe_oa") {
    return {
      stageId,
      companyId: "adobe",
      format: "coding",
      durationMinutes: 120,
      codingProblems: [
        {
          id: "adobe_01_lru_cache",
          stageId: "stage_adobe_oa",
          title: "Design Performance LRU Cache Subsystem",
          difficulty: "HARD",
          category: "Doubly Linked List / HashMap",
          descriptionMarkdown: `Implement an LRU (Least Recently Used) cache with O(1) time complexity for both \`get\` and \`put\` operations.
Given capacity \`capacity\` and a sequence of operations \`[("put", key, value), ("get", key)]\`, return the list of values returned by all \`get\` calls (-1 if key does not exist).`,
          constraints: ["1 <= capacity <= 3000", "0 <= key, value <= 10^4", "Up to 2 * 10^5 operations"],
          examples: [
            {
              input: "capacity = 2, ops = [('put', 1, 1), ('put', 2, 2), ('get', 1), ('put', 3, 3), ('get', 2)]",
              output: "[1, -1]",
              explanation: "Key 2 was evicted when key 3 was inserted.",
            },
          ],
          entryFunction: "simulate_lru_operations",
          starterCode: {
            python: `def simulate_lru_operations(capacity: int, ops: list[tuple]) -> list[int]:
    # Write your solution here
    return []
`,
          },
          testCases: [
            {
              id: "tc_adobe_1",
              args: [2, [["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2]]],
              expected: [1, -1],
              isHidden: false,
            },
          ],
          timeLimitMs: 2000,
        },
      ],
    };
  }

  // TCS NQT Cognitive
  if (stageId === "stage_tcs_cog") {
    return {
      stageId,
      companyId: "tcs",
      format: "aptitude",
      durationMinutes: 75,
      aptitudeQuestions: DELOITTE_APTITUDE_QUESTIONS,
    };
  }

  // TCS NQT Coding
  if (stageId === "stage_tcs_coding") {
    return {
      stageId,
      companyId: "tcs",
      format: "coding",
      durationMinutes: 90,
      codingProblems: [GOOGLE_OA_PROBLEMS[1]],
    };
  }

  // Infosys Aptitude
  if (stageId === "stage_infy_aptitude") {
    return {
      stageId,
      companyId: "infosys",
      format: "aptitude",
      durationMinutes: 100,
      aptitudeQuestions: DELOITTE_APTITUDE_QUESTIONS,
    };
  }

  // Infosys Coding
  if (stageId === "stage_infy_coding") {
    return {
      stageId,
      companyId: "infosys",
      format: "coding",
      durationMinutes: 180,
      codingProblems: [MICROSOFT_OA_PROBLEMS[0]],
    };
  }

  // Accenture Cognitive & Technical
  if (stageId === "stage_acc_cog_tech") {
    return {
      stageId,
      companyId: "accenture",
      format: "aptitude",
      durationMinutes: 90,
      aptitudeQuestions: DELOITTE_APTITUDE_QUESTIONS,
    };
  }

  // Accenture Coding
  if (stageId === "stage_acc_coding") {
    return {
      stageId,
      companyId: "accenture",
      format: "coding",
      durationMinutes: 45,
      codingProblems: [MICROSOFT_OA_PROBLEMS[0]],
    };
  }

  // Google AI/ML OA
  if (stageId === "stage_google_aiml_oa") {
    return {
      stageId,
      companyId: "google",
      format: "coding",
      durationMinutes: 90,
      codingProblems: [GOOGLE_OA_PROBLEMS[0]],
    };
  }

  // Universal Fallbacks for Dynamically Synthesized Stages
  if (stageId.includes("coding")) {
    return {
      stageId,
      companyId: "universal",
      format: "coding",
      durationMinutes: 75,
      codingProblems: [MICROSOFT_OA_PROBLEMS[0], GOOGLE_OA_PROBLEMS[0]],
    };
  }

  if (stageId.includes("sql")) {
    return {
      stageId,
      companyId: "universal",
      format: "sql",
      durationMinutes: 60,
      sqlProblems: DELOITTE_SQL_PROBLEMS,
    };
  }

  if (stageId.includes("aptitude")) {
    return {
      stageId,
      companyId: "universal",
      format: "aptitude",
      durationMinutes: 60,
      aptitudeQuestions: DELOITTE_APTITUDE_QUESTIONS,
    };
  }

  if (stageId.includes("work_sim")) {
    return {
      stageId,
      companyId: "universal",
      format: "work_simulation",
      durationMinutes: 90,
      workSimulationScenarios: AMAZON_WORK_SIMULATION_SCENARIOS,
    };
  }

  return null;
}
