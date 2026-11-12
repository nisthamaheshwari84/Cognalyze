/**
 * lib/skills/ai-data/curriculum/sql-stats-curriculum.ts
 * 
 * Complete SQL, Analytical Statistics & Experimentation Curriculum.
 * Covers Window Functions, CTEs, Hypothesis Testing, A/B Testing, and Cohort Retention.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const SQL_STATS_MODULES: TaxonomyModule[] = [
  {
    id: "mod_sql_stats",
    trackId: "track_sql_stats",
    title: "SQL Mastery, Analytical Statistics & A/B Experimentation",
    description: "Window functions, Common Table Expressions, hypothesis testing, and business cohort analysis.",
    order: 1,
    topics: [
      {
        id: "sql-01-window-functions",
        trackId: "track_sql_stats",
        moduleId: "mod_sql_stats",
        title: "Advanced SQL: Window Functions (ROW_NUMBER, DENSE_RANK, LAG/LEAD)",
        order: 1,
        estimatedMinutes: 35,
        difficulty: "intermediate",
        prerequisites: [],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Essential for month-over-month growth, running totals, and top-N ranking." },
          data_scientist: { importance: "CRITICAL", why: "Feature engineering historical user behaviors directly in database warehouses." },
          data_engineer: { importance: "CRITICAL", why: "Deduplication and sessionization pipelines in Snowflake, BigQuery, and Databricks." },
          ml_engineer: { importance: "HIGH", why: "Creating lag features for time-series forecasting and regression models." },
          mlops_engineer: { importance: "SUPPORTING", why: "Querying metric historical percentiles and latency trends." },
          ai_engineer: { importance: "HIGH", why: "Evaluating candidate outputs against historical gold standard benchmarks." },
          genai_llm_engineer: { importance: "HIGH", why: "Ranking model prompt variations by score across multiple test runs." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Paginating and ranking database records efficiently with single-pass queries." },
        },
        learningObjectives: [
          "Understand how Window Functions compute values across sets of rows without collapsing rows like `GROUP BY`.",
          "Master the `OVER (PARTITION BY ... ORDER BY ...)` syntax.",
          "Calculate running totals, moving averages, and period-over-period differences using `LAG` and `LEAD`."
        ],
        conceptsCovered: ["OVER Clause", "PARTITION BY", "ROW_NUMBER vs RANK vs DENSE_RANK", "LAG & LEAD", "Running Aggregates"],
        practicalOutcome: "Write a high-performance single-pass SQL query calculating 7-day rolling revenue and customer ranking within country partitions.",
        contextAndIntuition: {
          english: "In basic SQL, `GROUP BY` collapses 10 rows into 1 summary row. What if you want to keep all 10 individual transaction rows, but also attach the customer's running total or compare each order against their previous order? Window functions look through an open 'window' of neighboring rows without destroying individual row identities.",
          hinglish: "Basic SQL mein `GROUP BY` rows ko collapse karke ek summary bana deta hai. Lekin agar aapko har order row ko preserve karte hue customer ka running total nikalna ho ya pichle order se compare karna ho, toh Window Functions ek khidki (window) ki tarah kaam karte hain bina rows ko collapse kiye.",
          whyExists: "Enables analytical calculations (moving averages, ranks, lag comparisons) in a single database pass without expensive self-joins.",
          whatWasUsedBefore: "Painfully slow self-joins (`JOIN table t2 ON t1.id = t2.id - 1`) that scaled as O(N^2)."
        },
        deepExplanation: {
          english: "The `OVER()` clause dictates how rows are partitioned and ordered for evaluation. `ROW_NUMBER()` assigns strictly unique integers (1, 2, 3), `RANK()` leaves gaps on ties (1, 2, 2, 4), while `DENSE_RANK()` advances without gaps (1, 2, 2, 3). `LAG(val, 1) OVER (PARTITION BY user_id ORDER BY created_at)` accesses the previous row's value directly in the memory buffer.",
          hinglish: "`ROW_NUMBER()` har row ko unique number deta hai. `RANK()` ties par number skip karta hai (1, 2, 2, 4), jabki `DENSE_RANK()` bina skip kiye chalta hai (1, 2, 2, 3). `LAG()` se aap directly pichli row ki value fetch kar sakte ho.",
          internalMechanics: "Single-pass streaming execution over pre-sorted partition blocks in the query engine.",
          realWorldUsage: "Fintech month-over-month revenue growth, churn identification, and e-commerce leaderboards.",
          commonMistakes: [
            "Attempting to put a Window Function in a `WHERE` clause (they are evaluated AFTER `WHERE` and `GROUP BY`; must use a CTE or subquery).",
            "Confusing `RANK()` and `DENSE_RANK()`, causing missing numbers in leaderboard pagination."
          ]
        },
        externalResources: [
          {
            id: "res-sql-wf-01",
            creatorOrOrg: "CampusX",
            title: "SQL Window Functions Complete Guide with Practical Examples",
            topicCovered: "OVER clause, PARTITION BY, ROW_NUMBER, RANK, DENSE_RANK, LAG and LEAD",
            url: "https://www.youtube.com/watch?v=Ww71knvhQ-s",
            timestamp: "00:12:00",
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Clear visual diagrams illustrating how the window slides over partitioned data rows.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `-- Given table 'orders' (id, user_id, amount, order_date)\n-- Write a query returning: id, user_id, amount, and the user's previous order amount as 'prev_amount'\nSELECT\n  id,\n  user_id,\n  amount\nFROM orders;`,
        solutionSnippet: `SELECT\n  id,\n  user_id,\n  amount,\n  LAG(amount, 1) OVER (PARTITION BY user_id ORDER BY order_date) AS prev_amount\nFROM orders;`
      },
      {
        id: "stats-02-ab-testing-hypothesis",
        trackId: "track_sql_stats",
        moduleId: "mod_sql_stats",
        title: "A/B Testing & Hypothesis Testing: P-Values, Significance & Power",
        order: 2,
        estimatedMinutes: 40,
        difficulty: "intermediate",
        prerequisites: ["sql-01-window-functions"],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Determining whether a product feature launch produced a statistically significant lift." },
          data_scientist: { importance: "CRITICAL", why: "Core foundation of experimental design, sample size calculation, and metric verification." },
          data_engineer: { importance: "HIGH", why: "Building telemetry pipelines that guarantee randomized split assignment consistency." },
          ml_engineer: { importance: "CRITICAL", why: "Running online canary evaluation comparing new model variants to existing baselines." },
          mlops_engineer: { importance: "CRITICAL", why: "Managing traffic splitting and statistical rollback thresholds in production." },
          ai_engineer: { importance: "CRITICAL", why: "Evaluating prompt variants and model temperatures on human rating experiments." },
          genai_llm_engineer: { importance: "CRITICAL", why: "Benchmarking LLM output quality improvements across control and treatment groups." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Validating user engagement impact after integrating AI features into applications." },
        },
        learningObjectives: [
          "State the Null Hypothesis (H0) and Alternative Hypothesis (H1) rigorously.",
          "Calculate Z-score, standard error of difference in proportions, and two-tailed p-values.",
          "Prevent statistical traps: Type I errors (false positives), Type II errors (false negatives), and Peeking / P-hacking."
        ],
        conceptsCovered: ["Null vs Alternative Hypothesis", "P-Value Definition", "Statistical Power (1 - Beta)", "Minimum Detectable Effect", "Peeking Problem"],
        practicalOutcome: "Construct a complete A/B experiment evaluation function in Python that takes control and treatment metrics, computes z-test statistics, and emits an unambiguous business launch verdict.",
        contextAndIntuition: {
          english: "If you flip a coin 10 times and get 6 heads, is the coin biased? Probably not; it's random noise. If a new checkout button increases conversion from 5.0% to 5.2% over 100 visitors, did it actually improve, or was it pure luck? Hypothesis testing tells you the exact mathematical probability that the observed difference occurred by pure chance alone.",
          hinglish: "Agar aap sikka 10 baar uchhalein aur 6 baar heads aaye, toh sikka kharab nahi hai; wo random chance hai. A/B testing ka purpose yeh pata lagana hota hai ki naye feature se jo conversion increase dikha, wo sach mein feature ka kamaal hai ya sirf random chance.",
          whyExists: "Protects businesses from wasting millions of dollars rolling out placebo features that don't actually work.",
          whatWasUsedBefore: "Gut feelings, hippo decisions (Highest Paid Person's Opinion), and uncalibrated percentage comparisons."
        },
        deepExplanation: {
          english: "The p-value is the probability of observing an effect at least as extreme as the current data, assuming the Null Hypothesis (no real difference) is true. If `p < 0.05` (alpha), we reject the null hypothesis. The 'Peeking Problem' occurs when teams check p-values daily and stop the test early as soon as `p < 0.05`, inflating the true false positive rate from 5% to over 30%.",
          hinglish: "P-value batata hai ki agar sach mein koi difference na hota, toh itna bada result random chance se aane ki kya probability hai. Agar `p < 0.05` hai, toh hum result ko statistically significant maante hain. Roz roz p-value check karke test beech mein rokna ('peeking') ek bohot badi galti hai jisse fake results aate hain.",
          internalMechanics: "Two-proportion z-test: `z = (p_treat - p_ctrl) / sqrt(p_pool * (1 - p_pool) * (1/n_ctrl + 1/n_treat))`.",
          realWorldUsage: "E-commerce checkout redesigns, Netflix recommendation algorithm trials, and pricing experiments.",
          commonMistakes: [
            "Stopping the test early as soon as p < 0.05 is reached (p-hacking / continuous monitoring inflation).",
            "Confusing statistical significance with practical / economic significance (a 0.001% lift can be significant with 10M rows but commercially worthless)."
          ]
        },
        externalResources: [
          {
            id: "res-stats-ab-01",
            creatorOrOrg: "CampusX",
            title: "A/B Testing Complete Course for Data Scientists: Hypothesis Testing & Math",
            topicCovered: "Null hypothesis, Z-test, p-values, sample size estimation, and common pitfalls",
            url: "https://www.youtube.com/watch?v=mcnjU5tGZls",
            timestamp: "00:25:00",
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Practical breakdown of real tech company A/B testing frameworks and pitfalls.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import math\nfrom scipy import stats\n\ndef evaluate_ab_test(control_conversions, control_visitors, test_conversions, test_visitors, alpha=0.05):\n    # Return dict with: p_value, is_significant (bool), and verdict ("LAUNCH" | "RETAIN_CONTROL")\n    pass`,
        solutionSnippet: `import math\nfrom scipy import stats\n\ndef evaluate_ab_test(control_conversions, control_visitors, test_conversions, test_visitors, alpha=0.05):\n    p1 = control_conversions / control_visitors\n    p2 = test_conversions / test_visitors\n    p_pool = (control_conversions + test_conversions) / (control_visitors + test_visitors)\n    se = math.sqrt(p_pool * (1 - p_pool) * (1/control_visitors + 1/test_visitors))\n    z = (p2 - p1) / se\n    p_value = 2 * (1 - stats.norm.cdf(abs(z)))\n    is_significant = bool(p_value < alpha and p2 > p1)\n    return {\n        "z_score": round(z, 3),\n        "p_value": round(p_value, 5),\n        "is_significant": is_significant,\n        "verdict": "LAUNCH" if is_significant else "RETAIN_CONTROL"\n    }`
      }
    ]
  }
];

