/**
 * lib/skills/curriculum/subjects/sql.ts
 * 
 * Comprehensive SQL, Relational Databases & Analytics Curriculum:
 * Relational Algebra, Multi-Table Joins, Aggregate Functions, CTEs,
 * Analytical Window Functions, Schema Design, and Index Performance.
 */

import { CanonicalSubject } from "../types";

export const SQL_SUBJECT: CanonicalSubject = {
  slug: "sql",
  name: "SQL, Relational Databases & Analytics",
  icon: "💾",
  category: "Data & Databases",
  tagline: "Declarative Queries, Window Functions & High-Performance Data Warehousing",
  description: "Master relational algebra, complex joins, Common Table Expressions (CTEs), analytical window partitioning, ACID transactions, and query plan optimization.",
  estimatedHours: 35,
  prerequisites: [],
  chapters: [
    {
      slug: "sql-joins-and-relations",
      chapterNumber: 1,
      title: "Chapter 1: Relational Foundations & Multi-Table Joins",
      description: "Master INNER, LEFT, RIGHT, FULL OUTER, and CROSS joins, predicate pushdown, and handling NULLs safely in join conditions.",
      topics: [
        {
          slug: "outer-joins-and-null-handling",
          title: "Left vs Full Outer Joins & Anti-Join Mechanics",
          summary: "Identify missing and orphaned records using declarative SQL joins without unintentional cross-product row explosions.",
          subtopics: [
            {
              id: "sql-101",
              slug: "outer-joins-and-anti-joins",
              title: "Relational Set Operations: Left Joins, Anti-Joins & NULL Traps",
              subjectSlug: "sql",
              chapterSlug: "sql-joins-and-relations",
              topicSlug: "outer-joins-and-null-handling",
              estimatedMinutes: 25,
              difficulty: "beginner",
              canonicalSkill: "advanced_sql_analytics",
              prerequisites: [],
              learningGoal: "Construct LEFT JOIN anti-join queries (WHERE right.id IS NULL) to isolate churned or unpurchased entities, avoiding NOT IN (NULL) pitfalls.",
              intuitiveStory: "Imagine comparing a school attendance roster against the list of students who submitted homework. An anti-join leaves you with the exact list of students who came to class but never turned in their assignment.",
              analogy: "An anti-join is a security gate filter: keep everyone who does NOT show up in the visitor registry.",
              formalConcept: "In three-valued SQL logic (TRUE, FALSE, UNKNOWN), comparing any value with NULL yields UNKNOWN. An anti-join implemented via LEFT JOIN ... WHERE right.key IS NULL safely excludes matches, whereas WHERE id NOT IN (SELECT id FROM t) evaluates to UNKNOWN if any row contains a NULL, returning zero results.",
              productionSignificance: "Accidentally using NOT IN with nullable subqueries causes data pipelines to silently return 0 rows in marketing outreach campaigns.",
              visualType: "sql_table",
              mermaidDiagram: `graph LR
    Left["Users Table<br/>id: 1, 2, 3"] --> Join{"LEFT JOIN Orders<br/>ON users.id = orders.user_id"}
    Right["Orders Table<br/>user_id: 1, 2"] --> Join
    Join --> Filter["WHERE orders.order_id IS NULL"]
    Filter --> Out["Result: User 3 (Never Ordered)"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Executing Safe Anti-Join via IS NULL",
                  explanation: "Left join keeps all users; filtering on right.key IS NULL discards all customers who ever placed an order.",
                  codeOrQuery: `SELECT u.user_id, u.name, u.email
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE o.order_id IS NULL;`,
                  outputSummary: "Returns customers with zero transaction history."
                }
              ],
              audioNarrationScript: "To find records in table A that do not exist in table B, perform a LEFT JOIN from A to B and filter WHERE B's primary key IS NULL. Avoid using NOT IN with subqueries, because if the subquery returns even a single NULL value, the entire NOT IN expression evaluates to unknown, returning zero rows.",
              coBuildSlot: {
                slotId: "sql-slot-101",
                instruction: "Complete the query to return customers who have signed up but made zero purchases.",
                starterSnippet: `SELECT c.customer_id, c.signup_date\nFROM customers c\nLEFT JOIN purchases p ON c.customer_id = p.customer_id\nWHERE p.purchase_id IS NULL;`,
                expectedPattern: "WHERE\\s+p\\.purchase_id\\s+IS\\s+NULL",
                hint1: "Filter where the right table's primary key IS NULL.",
                hint2: "Write: WHERE p.purchase_id IS NULL;",
                validationExplanation: "Correctly constructs standard SQL anti-join filter."
              },
              executionEnvironment: "sql_sandbox",
              starterCodeOrQuery: `SELECT c.customer_id, c.signup_date
FROM customers c
LEFT JOIN purchases p ON c.customer_id = p.customer_id
WHERE p.purchase_id IS NULL;
`,
              debugFault: {
                faultId: "sql-fault-101",
                title: "NULL in NOT IN Subquery Causing Empty Results",
                buggyCodeOrConfig: `SELECT user_id, email
FROM users
WHERE user_id NOT IN (SELECT user_id FROM orders); -- Bug: if orders.user_id has NULL, returns empty set!`,
                correctCodeOrConfig: `SELECT user_id, email
FROM users
WHERE user_id NOT IN (SELECT user_id FROM orders WHERE user_id IS NOT NULL);`,
                diagnosticHint: "SQL three-valued logic treats x NOT IN (1, NULL) as UNKNOWN, causing the WHERE clause to fail on every row.",
                explanation: "Filtering out NULLs in the subquery or using NOT EXISTS / LEFT JOIN IS NULL prevents three-valued logic collapse."
              },
              comprehensionChecks: [
                {
                  id: "sql-cc-101a",
                  question: "Why does `WHERE id NOT IN (SELECT user_id FROM t)` return 0 rows if table `t` contains a NULL user_id?",
                  options: [
                    "Because SQL aborts with a syntax error.",
                    "Because `x != NULL` evaluates to UNKNOWN, making the conjunction `x != 1 AND x != NULL` evaluate to UNKNOWN/FALSE for every row.",
                    "Because NULL values are converted to 0 in SQL.",
                    "Because NOT IN can only be used on string columns."
                  ],
                  correctIndex: 1,
                  explanation: "Under SQL three-valued logic, `a NOT IN (b, c)` is expanded as `a != b AND a != c`. If any comparison is with NULL, the AND chain evaluates to UNKNOWN, failing the WHERE condition."
                }
              ],
              independentChallenge: {
                challengeId: "sql-chal-101",
                title: "Identify Dormant Subscribers via Anti-Join",
                description: "Write an optimized SQL query to select all active subscriber emails who have had 0 logins in the past 90 days.",
                starterCode: `SELECT s.email, s.plan_tier
FROM subscribers s
LEFT JOIN logins l ON s.user_id = l.user_id
WHERE s.status = 'ACTIVE' AND l.login_id IS NULL;
`,
                solutionCode: `SELECT s.email, s.plan_tier
FROM subscribers s
LEFT JOIN logins l ON s.user_id = l.user_id
WHERE s.status = 'ACTIVE' AND l.login_id IS NULL;
`,
                testCases: [
                  {
                    input: "Subscribers table + Logins table",
                    expectedOutput: "List of dormant subscriber emails",
                    description: "Selects active accounts with no matching login activity."
                  }
                ],
                rubric: {
                  correctness: 40,
                  codeQuality: 30,
                  efficiency: 30
                }
              }
            }
          ]
        }
      ]
    },
    {
      slug: "sql-window-functions",
      chapterNumber: 2,
      title: "Chapter 2: Analytical Window Functions & Partitions",
      description: "Master ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, and rolling frame specifications (ROWS BETWEEN).",
      topics: [
        {
          slug: "ranking-and-partitions",
          title: "Gapless Ranking & Partitioned Window Frames",
          summary: "Compute running totals and rankings within subsets of data without collapsing rows with GROUP BY.",
          subtopics: [
            {
              id: "sql-201",
              slug: "dense-rank-and-partition-by",
              title: "Partitioned Ranking: ROW_NUMBER vs RANK vs DENSE_RANK",
              subjectSlug: "sql",
              chapterSlug: "sql-window-functions",
              topicSlug: "ranking-and-partitions",
              estimatedMinutes: 30,
              difficulty: "intermediate",
              canonicalSkill: "advanced_sql_analytics",
              prerequisites: ["outer-joins-and-anti-joins"],
              learningGoal: "Implement DENSE_RANK() OVER (PARTITION BY ... ORDER BY ...) to calculate top-N queries without skipping rank values on tied scores.",
              intuitiveStory: "In a race, if two runners tie for 1st place: RANK gives the next runner 3rd place (skipping 2nd). DENSE_RANK gives the next runner 2nd place (no gaps). ROW_NUMBER breaks ties arbitrarily and gives them 1 and 2.",
              analogy: "DENSE_RANK is Olympic medals where shared gold still allows someone to win silver.",
              formalConcept: "Window functions calculate across a partition of rows related to the current row without grouping into a single summary output row. DENSE_RANK() increments by 1 for each distinct ordering value, creating a contiguous sequence 1, 2, 3...",
              mathFormula: "\\text{rank}(r) = 1 + |\\{s \\in P : v(s) > v(r)\\}|",
              productionSignificance: "Finding the 'Top 3 highest paid employees in every department' requires DENSE_RANK to handle salary ties fairly.",
              visualType: "sql_table",
              mermaidDiagram: `graph TD
    Table["Employee Table<br/>Dept, Salary"] --> Partition["PARTITION BY Dept"]
    Partition --> Order["ORDER BY Salary DESC"]
    Order --> Window["DENSE_RANK() OVER (...)"]
    Window --> Res["Dept 10: Rank 1 ($150k), Rank 2 ($120k, $120k), Rank 3 ($110k)<br/>No rank gaps!"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "DENSE_RANK across Department Partitions",
                  explanation: "Computes rank within each department partition; wrapping in a CTE filters for top-N.",
                  codeOrQuery: `WITH RankedSalaries AS (
    SELECT 
        dept_name,
        employee_name,
        salary,
        DENSE_RANK() OVER (PARTITION BY dept_name ORDER BY salary DESC) as salary_rank
    FROM employees
)
SELECT dept_name, employee_name, salary, salary_rank
FROM RankedSalaries
WHERE salary_rank <= 3;`,
                  outputSummary: "Returns the top 3 distinct salary earners per department."
                }
              ],
              audioNarrationScript: "Unlike GROUP BY which collapses rows, window functions preserve the original row identity while performing calculations over a designated window. Use DENSE_RANK when you want contiguous rankings for ties, such as the top three salary tiers in every team.",
              coBuildSlot: {
                slotId: "sql-slot-201",
                instruction: "Complete the OVER clause to rank products by price descending within each category using DENSE_RANK.",
                starterSnippet: `SELECT \n    product_id, \n    category_id, \n    price,\n    DENSE_RANK() OVER (PARTITION BY category_id ORDER BY price DESC) as price_rank\nFROM products;`,
                expectedPattern: "DENSE_RANK\\(\\)\\s+OVER\\s*\\(\\s*PARTITION\\s+BY\\s+category_id\\s+ORDER\\s+BY\\s+price\\s+DESC\\s*\\)",
                hint1: "Use: DENSE_RANK() OVER (PARTITION BY category_id ORDER BY price DESC)",
                hint2: "Partition by category_id and order by price DESC.",
                validationExplanation: "Correctly constructs partitioned DENSE_RANK window specification."
              },
              executionEnvironment: "sql_sandbox",
              starterCodeOrQuery: `SELECT 
    product_id, 
    category_id, 
    price,
    DENSE_RANK() OVER (PARTITION BY category_id ORDER BY price DESC) as price_rank
FROM products;
`,
              debugFault: {
                faultId: "sql-fault-201",
                title: "Filtering window function in WHERE clause directly",
                buggyCodeOrConfig: `SELECT dept_id, name, salary
FROM employees
WHERE DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) <= 3; -- Bug: Window functions forbidden in WHERE`,
                correctCodeOrConfig: `WITH Ranked AS (
    SELECT dept_id, name, salary,
           DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) as rnk
    FROM employees
)
SELECT dept_id, name, salary
FROM Ranked
WHERE rnk <= 3;`,
                diagnosticHint: "SQL executes WHERE clauses before window functions. Wrap the query in a CTE or subquery first.",
                explanation: "The SQL execution order is FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> WINDOW -> ORDER BY. Window functions must be computed before filtering can occur."
              },
              comprehensionChecks: [
                {
                  id: "sql-cc-201a",
                  question: "Why cannot a window function like `ROW_NUMBER()` be used directly in a `WHERE` clause?",
                  options: [
                    "Because window functions are only allowed in MySQL, not PostgreSQL.",
                    "Because the logical query processing order executes `WHERE` before window functions are calculated.",
                    "Because `WHERE` only accepts boolean comparisons on integers.",
                    "Because window functions require indexes to be evaluated."
                  ],
                  correctIndex: 1,
                  explanation: "The SQL query execution pipeline filters rows via WHERE before window functions are evaluated in the SELECT projection stage."
                }
              ],
              independentChallenge: {
                challengeId: "sql-chal-201",
                title: "Month-over-Month Revenue Growth with LAG()",
                description: "Write a SQL query using the LAG() window function to calculate month-over-month revenue percentage growth.",
                starterCode: `WITH MonthlyRev AS (
    SELECT 
        strftime('%Y-%m', order_date) as month,
        SUM(amount) as revenue
    FROM orders
    GROUP BY 1
)
SELECT 
    month,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY month) as prev_month_rev,
    ROUND(((revenue - LAG(revenue, 1) OVER (ORDER BY month)) / LAG(revenue, 1) OVER (ORDER BY month)) * 100.0, 2) as mom_growth_pct
FROM MonthlyRev;
`,
                solutionCode: `WITH MonthlyRev AS (
    SELECT 
        strftime('%Y-%m', order_date) as month,
        SUM(amount) as revenue
    FROM orders
    GROUP BY 1
)
SELECT 
    month,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY month) as prev_month_rev,
    ROUND(((revenue - LAG(revenue, 1) OVER (ORDER BY month)) / LAG(revenue, 1) OVER (ORDER BY month)) * 100.0, 2) as mom_growth_pct
FROM MonthlyRev;
`,
                testCases: [
                  {
                    input: "Order stream spanning multiple consecutive months",
                    expectedOutput: "Month-over-month revenue percentage delta table",
                    description: "Accurately computes relative revenue changes across time boundary."
                  }
                ],
                rubric: {
                  correctness: 40,
                  codeQuality: 30,
                  efficiency: 30
                }
              }
            }
          ]
        }
      ]
    }
  ]
};

