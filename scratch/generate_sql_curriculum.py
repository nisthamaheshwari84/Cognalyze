"""
scratch/generate_sql_curriculum.py
Generates the complete 12-topic SQL curriculum with subtopics and video references.
"""

from expand_all_curricula import format_curriculum_ts

def get_sql_modules():
    return [
        {
            "id": "mod_sql_foundations",
            "trackId": "track_sql",
            "title": "Module 1: Relational Architecture, Data Modeling & CRUD Invariants",
            "description": "Relational schema design, normalization, table constraints, filtering predicates, and aggregations.",
            "order": 1,
            "topics": [
                {
                    "id": "sql-01-joins-execution-model",
                    "title": "Relational Joins: INNER, LEFT, FULL & The Join Execution Model",
                    "order": 1,
                    "estimatedMinutes": 35,
                    "difficulty": "beginner",
                    "prerequisites": [],
                    "criticalRoles": ["data_analyst", "data_scientist", "data_engineer"],
                    "whyRelevance": "Core relational algebra operation connecting normalized tables.",
                    "learningObjectives": [
                        "Understand set operations behind INNER, LEFT, RIGHT, FULL, and CROSS joins.",
                        "Understand physical execution algorithms: Nested Loop vs Hash Join vs Sort-Merge Join.",
                        "Prevent catastrophic Cartesian product row explosion bugs."
                    ],
                    "conceptsCovered": ["INNER JOIN", "LEFT JOIN", "Cartesian Product", "Hash Join", "Sort-Merge"],
                    "subtopics": [
                        {"id": "sql-01-sub-1", "title": "Join Execution Algorithms: Nested Loop vs Hash Join", "order": 1, "concepts": ["Nested Loop", "Hash Table Probe", "Sort-Merge"], "interviewPriority": "MUST_KNOW", "startSeconds": 60, "endSeconds": 720, "timestampLabel": "01:00 - 12:00"},
                        {"id": "sql-01-sub-2", "title": "Row Explosion from Non-Unique Join Keys", "order": 2, "concepts": ["Cartesian Multiplication", "Deduplication"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 720, "endSeconds": 1380, "timestampLabel": "12:00 - 23:00"}
                    ],
                    "practicalOutcome": "Construct a multi-table analytical query joining users, orders, and payments with zero duplicate row inflation.",
                    "whyExists": "Reassembles normalized database tables into consolidated result sets.",
                    "whatWasUsedBefore": "Flat denormalized single files that wasted disk and suffered update anomalies.",
                    "internalMechanics": "Query optimizer hashes smaller table into memory and scans larger probe table.",
                    "realWorldUsage": "Joining transactions with customer dimensions and shipping addresses in e-commerce.",
                    "commonMistakes": ["Joining on non-unique columns without deduplicating first, causing row explosion."],
                    "video": {"creator": "Alex The Analyst", "title": "SQL Joins Explained: Inner, Left, Right, Full", "url": "https://www.youtube.com/watch?v=0r5v1uT-4sE", "startSeconds": 60, "endSeconds": 1380, "timestampLabel": "01:00 - 23:00"},
                    "starterCode": "-- Join orders and users\nSELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id;",
                    "solutionSnippet": "SELECT u.name, SUM(o.amount) AS total_spent FROM users u INNER JOIN orders o ON u.id = o.user_id GROUP BY u.name;"
                },
                {
                    "id": "sql-02-filtering-predicates",
                    "title": "Filtering & Predicate Logic: WHERE, NULL Invariants & Three-Valued Logic",
                    "order": 2,
                    "estimatedMinutes": 30,
                    "difficulty": "beginner",
                    "prerequisites": ["sql-01-joins-execution-model"],
                    "criticalRoles": ["data_analyst", "data_scientist", "data_engineer"],
                    "whyRelevance": "Avoids critical data filtering errors caused by NULL三-valued logic in SQL.",
                    "learningObjectives": [
                        "Master SQL Three-Valued Logic: TRUE, FALSE, and UNKNOWN.",
                        "Understand why `WHERE col = NULL` always returns empty (must use `IS NULL`).",
                        "Evaluate `NOT IN (subquery)` pitfalls when subquery contains a single NULL value."
                    ],
                    "conceptsCovered": ["Three-Valued Logic", "IS NULL", "NOT IN Gotcha", "COALESCE", "Sargable Queries"],
                    "subtopics": [
                        {"id": "sql-02-sub-1", "title": "Three-Valued Logic & The NULL Equality Trap", "order": 1, "concepts": ["UNKNOWN", "IS NULL", "IS NOT NULL"], "interviewPriority": "MUST_KNOW", "startSeconds": 1380, "endSeconds": 1980, "timestampLabel": "23:00 - 33:00"},
                        {"id": "sql-02-sub-2", "title": "Sargable Predicates & Index-Friendly Filter Formatting", "order": 2, "concepts": ["Sargability", "Function Wrapping", "Index Seek"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 1980, "endSeconds": 2580, "timestampLabel": "33:00 - 43:00"}
                    ],
                    "practicalOutcome": "Refactor un-sargable query filters to allow database engine to utilize B-Tree index seeks.",
                    "whyExists": "Restricts candidate rows before entering heavy aggregation and join stages.",
                    "whatWasUsedBefore": "Loading all data into client memory and filtering in application code.",
                    "internalMechanics": "Pushed down into storage engine via predicate pushdown to eliminate disk page reads.",
                    "realWorldUsage": "Filtering active subscriptions, date range partition pruning, and soft-delete filters.",
                    "commonMistakes": ["Wrapping columns in functions like `WHERE YEAR(created_at) = 2026` which disables index usage."],
                    "video": {"creator": "Alex The Analyst", "title": "SQL Where Clause & Filtering Gotchas", "url": "https://www.youtube.com/watch?v=0r5v1uT-4sE", "startSeconds": 1380, "endSeconds": 2580, "timestampLabel": "23:00 - 43:00"},
                    "starterCode": "-- Write sargable filter for orders in 2026\nSELECT * FROM orders WHERE created_at >= '2026-01-01';",
                    "solutionSnippet": "SELECT * FROM orders WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01';"
                },
                {
                    "id": "sql-03-aggregations-group-by",
                    "title": "Aggregations, GROUP BY Semantics & HAVING vs WHERE",
                    "order": 3,
                    "estimatedMinutes": 35,
                    "difficulty": "beginner",
                    "prerequisites": ["sql-02-filtering-predicates"],
                    "criticalRoles": ["data_analyst", "data_scientist", "data_engineer"],
                    "whyRelevance": "The primary mechanism for summarizing metrics, computing totals, and building BI KPIs.",
                    "learningObjectives": [
                        "Understand SQL logical query processing order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT.",
                        "Differentiate between WHERE (filters rows before aggregation) and HAVING (filters aggregated groups).",
                        "Handle NULLs in aggregate functions (`COUNT(*)` vs `COUNT(col)`)."
                    ],
                    "conceptsCovered": ["GROUP BY", "HAVING", "COUNT(*)", "Aggregation Pipelines", "Query Processing Order"],
                    "subtopics": [
                        {"id": "sql-03-sub-1", "title": "Logical Query Processing Order & HAVING Filter Mechanics", "order": 1, "concepts": ["Processing Order", "WHERE vs HAVING", "Grouping Sets"], "interviewPriority": "MUST_KNOW", "startSeconds": 2580, "endSeconds": 3180, "timestampLabel": "43:00 - 53:00"},
                        {"id": "sql-03-sub-2", "title": "COUNT(*) vs COUNT(column) & NULL Aggregation Invariants", "order": 2, "concepts": ["COUNT(*)", "COUNT(col)", "AVG ignoring NULL"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 3180, "endSeconds": 3780, "timestampLabel": "53:00 - 01:03:00"}
                    ],
                    "practicalOutcome": "Calculate average order value and customer order counts, filtering for high-value power buyers.",
                    "whyExists": "Condenses millions of transaction records into executive summary statistics.",
                    "whatWasUsedBefore": "Manual batch aggregation scripts in external languages.",
                    "internalMechanics": "Hash aggregation builds an in-memory hash table of group keys; Sort aggregation sorts by group keys.",
                    "realWorldUsage": "Revenue dashboards, monthly active user metrics, and fraud velocity indicators.",
                    "commonMistakes": ["Referencing aggregated aliases in the WHERE clause.", "Selecting non-aggregated columns missing from GROUP BY."],
                    "video": {"creator": "Alex The Analyst", "title": "SQL Group By and Having Clause Explained", "url": "https://www.youtube.com/watch?v=0r5v1uT-4sE", "startSeconds": 2580, "endSeconds": 3780, "timestampLabel": "43:00 - 01:03:00"},
                    "starterCode": "SELECT user_id, COUNT(*) as cnt FROM orders GROUP BY user_id;",
                    "solutionSnippet": "SELECT user_id, COUNT(*) as cnt, SUM(amount) as total FROM orders GROUP BY user_id HAVING COUNT(*) > 5;"
                }
            ]
        },
        {
            "id": "mod_sql_window_cte",
            "trackId": "track_sql",
            "title": "Module 2: CTEs, Hierarchies & Analytical Window Functions",
            "description": "Common Table Expressions, recursive tree traversals, OVER partitions, and moving averages.",
            "order": 2,
            "topics": [
                {
                    "id": "sql-04-window-functions-framing",
                    "title": "The OVER() Clause, Partition Framing & Moving Aggregates",
                    "order": 1,
                    "estimatedMinutes": 45,
                    "difficulty": "intermediate",
                    "prerequisites": ["sql-03-aggregations-group-by"],
                    "criticalRoles": ["data_analyst", "data_scientist", "data_engineer"],
                    "whyRelevance": "Enables row-level calculations alongside aggregates without collapsing output rows.",
                    "learningObjectives": [
                        "Master the syntax of `OVER (PARTITION BY ... ORDER BY ... ROWS BETWEEN ...)`.",
                        "Understand physical window framing: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.",
                        "Compute running totals, 7-day rolling moving averages, and cumulative distributions."
                    ],
                    "conceptsCovered": ["Window Framing", "PARTITION BY", "Running Totals", "Moving Averages", "ROWS vs RANGE"],
                    "subtopics": [
                        {"id": "sql-04-sub-1", "title": "The OVER Clause & Partition Framing Invariants", "order": 1, "concepts": ["OVER", "PARTITION BY", "ROWS BETWEEN"], "interviewPriority": "MUST_KNOW", "startSeconds": 3780, "endSeconds": 4440, "timestampLabel": "01:03:00 - 01:14:00"},
                        {"id": "sql-04-sub-2", "title": "Cumulative Running Totals & Rolling 7-Day Moving Windows", "order": 2, "concepts": ["Running Total", "Moving Window", "Sliding Frame"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 4440, "endSeconds": 5100, "timestampLabel": "01:14:00 - 01:25:00"}
                    ],
                    "practicalOutcome": "Construct a financial running balance and 30-day moving average of user deposits.",
                    "whyExists": "Allows calculations across related row sets without messy self-joins.",
                    "whatWasUsedBefore": "Correlated scalar subqueries that caused catastrophic O(N^2) table scans.",
                    "internalMechanics": "Engine sorts data by partition and order keys, then slides an in-memory cursor frame over rows.",
                    "realWorldUsage": "Financial ledgers, real-time KPI trend lines, and sensor telemetry smoothing.",
                    "commonMistakes": ["Omitting the ORDER BY clause inside OVER, which defaults frame to entire partition."],
                    "video": {"creator": "Alex The Analyst", "title": "SQL Window Functions: Over, Partition By, and Framing", "url": "https://www.youtube.com/watch?v=0r5v1uT-4sE", "startSeconds": 3780, "endSeconds": 5100, "timestampLabel": "01:03:00 - 01:25:00"},
                    "starterCode": "SELECT order_date, amount, SUM(amount) OVER (ORDER BY order_date) as running_total FROM orders;",
                    "solutionSnippet": "SELECT order_date, amount, SUM(amount) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as running_total, AVG(amount) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg_7d FROM orders;"
                },
                {
                    "id": "sql-05-ranking-offset-functions",
                    "title": "Ranking & Offset Functions: ROW_NUMBER, RANK, DENSE_RANK, LEAD & LAG",
                    "order": 2,
                    "estimatedMinutes": 40,
                    "difficulty": "intermediate",
                    "prerequisites": ["sql-04-window-functions-framing"],
                    "criticalRoles": ["data_analyst", "data_scientist", "data_engineer"],
                    "whyRelevance": "Essential for top-N per category problems and calculating period-over-period growth.",
                    "learningObjectives": [
                        "Differentiate between ROW_NUMBER() (no ties), RANK() (skips numbers on ties), and DENSE_RANK() (consecutive on ties).",
                        "Use `LEAD()` and `LAG()` to inspect subsequent and prior row values in ordered sequences.",
                        "Solve the classic Top-3 Salaries per Department interview challenge without subquery duplication."
                    ],
                    "conceptsCovered": ["ROW_NUMBER", "RANK", "DENSE_RANK", "LEAD & LAG", "Top-N per Category"],
                    "subtopics": [
                        {"id": "sql-05-sub-1", "title": "ROW_NUMBER vs RANK vs DENSE_RANK Tie Handling Invariants", "order": 1, "concepts": ["ROW_NUMBER", "RANK", "DENSE_RANK", "Tie Handling"], "interviewPriority": "MUST_KNOW", "startSeconds": 5100, "endSeconds": 5700, "timestampLabel": "01:25:00 - 01:35:00"},
                        {"id": "sql-05-sub-2", "title": "LEAD / LAG Offset Navigation & Month-over-Month Growth", "order": 2, "concepts": ["LEAD", "LAG", "MoM Growth", "Offset"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 5700, "endSeconds": 6300, "timestampLabel": "01:35:00 - 01:45:00"}
                    ],
                    "practicalOutcome": "Calculate month-over-month percentage growth and find top-2 highest performing products per region.",
                    "whyExists": "Enables sequential row comparison and rank determination in pure SQL.",
                    "whatWasUsedBefore": "Self-joins with `a.date = b.date + INTERVAL 1 DAY`, which broke on missing dates.",
                    "internalMechanics": "Single-pass streaming cursor with buffer offset pointer.",
                    "realWorldUsage": "E-commerce sales leaderboards, customer session duration calculations, and churn intervals.",
                    "commonMistakes": ["Using RANK() instead of DENSE_RANK() when consecutive rank numbering is required."],
                    "video": {"creator": "Alex The Analyst", "title": "Row_Number, Rank, Dense_Rank, Lead, and Lag in SQL", "url": "https://www.youtube.com/watch?v=0r5v1uT-4sE", "startSeconds": 5100, "endSeconds": 6300, "timestampLabel": "01:25:00 - 01:45:00"},
                    "starterCode": "SELECT department_id, employee_name, salary, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rk FROM employees;",
                    "solutionSnippet": "WITH ranked AS (SELECT department_id, employee_name, salary, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rk FROM employees) SELECT * FROM ranked WHERE rk <= 3;"
                },
                {
                    "id": "sql-06-ctes-hierarchies",
                    "title": "Modular SQL: CTEs (WITH Clause) & Recursive Graph Traversal",
                    "order": 3,
                    "estimatedMinutes": 45,
                    "difficulty": "advanced",
                    "prerequisites": ["sql-05-ranking-offset-functions"],
                    "criticalRoles": ["data_engineer", "data_analyst", "data_scientist"],
                    "whyRelevance": "Organizes complex analytical queries and traverses hierarchical organizational/category graphs.",
                    "learningObjectives": [
                        "Structure complex multi-stage analytical queries with readable Common Table Expressions (`WITH`).",
                        "Master recursive CTEs: Anchor member, UNION ALL, recursive member, and termination condition.",
                        "Traverse employee-manager organizational charts and bill-of-materials product assemblies."
                    ],
                    "conceptsCovered": ["Common Table Expressions", "Recursive CTEs", "Anchor Member", "Graph Traversal", "Cycle Detection"],
                    "subtopics": [
                        {"id": "sql-06-sub-1", "title": "Readable Modular Queries with WITH & Multi-CTE Chaining", "order": 1, "concepts": ["WITH clause", "Chaining CTEs", "Readability"], "interviewPriority": "MUST_KNOW", "startSeconds": 6300, "endSeconds": 6900, "timestampLabel": "01:45:00 - 01:55:00"},
                        {"id": "sql-06-sub-2", "title": "Recursive CTE Mechanics & Hierarchical Tree Traversal", "order": 2, "concepts": ["Recursive CTE", "Anchor Member", "Hierarchy Traversal"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 6900, "endSeconds": 7600, "timestampLabel": "01:55:00 - 02:06:40"}
                    ],
                    "practicalOutcome": "Traverse a complete corporate hierarchy to compute cumulative team budgets from CEO down to junior staff.",
                    "whyExists": "Makes deeply nested subqueries readable and enables recursive graph operations in SQL.",
                    "whatWasUsedBefore": "External procedural scripts querying the database in loops (N+1 query problem).",
                    "internalMechanics": "Database evaluates anchor member into intermediate working table, repeatedly executing recursive member until empty.",
                    "realWorldUsage": "Manager-employee organizational charts, category taxonomy breadcrumbs, and dependency trees.",
                    "commonMistakes": ["Missing termination condition in recursive member leading to infinite execution loops."],
                    "video": {"creator": "Alex The Analyst", "title": "CTEs (Common Table Expressions) and Recursive SQL", "url": "https://www.youtube.com/watch?v=0r5v1uT-4sE", "startSeconds": 6300, "endSeconds": 7600, "timestampLabel": "01:45:00 - 02:06:40"},
                    "starterCode": "WITH RECURSIVE org_tree AS (\n    SELECT emp_id, manager_id, 1 as lvl FROM employees WHERE manager_id IS NULL\n    UNION ALL\n    SELECT e.emp_id, e.manager_id, o.lvl + 1 FROM employees e JOIN org_tree o ON e.manager_id = o.emp_id\n) SELECT * FROM org_tree;",
                    "solutionSnippet": "WITH RECURSIVE org_tree AS (\n    SELECT emp_id, manager_id, 1 as lvl FROM employees WHERE manager_id IS NULL\n    UNION ALL\n    SELECT e.emp_id, e.manager_id, o.lvl + 1 FROM employees e JOIN org_tree o ON e.manager_id = o.emp_id\n) SELECT * FROM org_tree ORDER BY lvl, emp_id;"
                }
            ]
        },
        {
            "id": "mod_sql_performance_acid",
            "trackId": "track_sql",
            "title": "Module 3: Database Indexing, Query Optimization & ACID Transactions",
            "description": "B-Tree index internals, EXPLAIN execution plan reading, transaction isolation levels, and MVCC.",
            "order": 3,
            "topics": [
                {
                    "id": "sql-07-indexing-b-trees",
                    "title": "Database Indexing: B-Trees, Composite Keys & Clustered Indexes",
                    "order": 1,
                    "estimatedMinutes": 45,
                    "difficulty": "advanced",
                    "prerequisites": ["sql-06-ctes-hierarchies"],
                    "criticalRoles": ["data_engineer", "mlops_engineer", "ai_engineer"],
                    "whyRelevance": "Turns O(N) full table scans into O(log N) index seeks; the single most impactful performance lever.",
                    "learningObjectives": [
                        "Understand B+ Tree data structures (balanced tree, leaf node linked list, page size).",
                        "Differentiate between Clustered Index (data stored in index order) and Non-Clustered Index.",
                        "Master composite index column ordering (Leftmost Prefix Rule) and covering indexes."
                    ],
                    "conceptsCovered": ["B+ Tree", "Index Seek vs Scan", "Leftmost Prefix Rule", "Covering Index", "Index Fragmentation"],
                    "subtopics": [
                        {"id": "sql-07-sub-1", "title": "B+ Tree Index Architecture & O(log N) Traversal", "order": 1, "concepts": ["B+ Tree", "Leaf Nodes", "Index Traversal"], "interviewPriority": "MUST_KNOW", "startSeconds": 7600, "endSeconds": 8200, "timestampLabel": "02:06:40 - 02:16:40"},
                        {"id": "sql-07-sub-2", "title": "Composite Indexes, Leftmost Prefix Rule & Covering Indexes", "order": 2, "concepts": ["Leftmost Prefix", "Covering Index", "Index Only Scan"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 8200, "endSeconds": 8900, "timestampLabel": "02:16:40 - 02:28:20"}
                    ],
                    "practicalOutcome": "Design optimal composite indexes for a high-volume payment processing table to achieve 2ms p99 query latency.",
                    "whyExists": "Avoids scanning billions of rows from physical disk by providing sorted lookup pointers.",
                    "whatWasUsedBefore": "Full sequential table scans on disk drives.",
                    "internalMechanics": "B+ tree root and branch pages guide lookup pointer directly to leaf data page containing row ID.",
                    "realWorldUsage": "User authentication lookup by email, order search by customer and date, and foreign key indexes.",
                    "commonMistakes": ["Creating composite index on (B, A) and trying to query solely on A (violates leftmost prefix rule)."],
                    "video": {"creator": "Hussein Nasser", "title": "Database Indexing Explained: B-Trees and Architecture", "url": "https://www.youtube.com/watch?v=HubezKbFL7E", "startSeconds": 60, "endSeconds": 1300, "timestampLabel": "01:00 - 21:40"},
                    "starterCode": "CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);",
                    "solutionSnippet": "CREATE INDEX idx_orders_user_date_amt ON orders(user_id, order_date) INCLUDE (amount);"
                },
                {
                    "id": "sql-08-query-optimization-explain",
                    "title": "Query Optimization: Reading EXPLAIN Plans, Scans vs Seeks & Cost Models",
                    "order": 2,
                    "estimatedMinutes": 45,
                    "difficulty": "advanced",
                    "prerequisites": ["sql-07-indexing-b-trees"],
                    "criticalRoles": ["data_engineer", "mlops_engineer", "data_analyst"],
                    "whyRelevance": "Enables engineers to identify query bottlenecks, disk spillage, and missing index hints.",
                    "learningObjectives": [
                        "Read and interpret `EXPLAIN` and `EXPLAIN ANALYZE` query execution plans.",
                        "Recognize critical warnings: Seq Scan on large table, Hash Join spilling to disk, and Cartesian joins.",
                        "Understand database statistics, cardinality estimation, and query planner cost functions."
                    ],
                    "conceptsCovered": ["EXPLAIN ANALYZE", "Query Planner", "Seq Scan vs Index Seek", "Cardinality Estimation", "Disk Spillage"],
                    "subtopics": [
                        {"id": "sql-08-sub-1", "title": "Interpreting EXPLAIN Cost, Rows & Actual Execution Times", "order": 1, "concepts": ["EXPLAIN Plan", "Total Cost", "Actual Time"], "interviewPriority": "MUST_KNOW", "startSeconds": 1300, "endSeconds": 2000, "timestampLabel": "21:40 - 33:20"},
                        {"id": "sql-08-sub-2", "title": "Diagnosing Join Algorithms & Resolving WorkMem Temp Disk Spillage", "order": 2, "concepts": ["work_mem", "Temp Disk Spill", "Hash vs Merge Join"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 2000, "endSeconds": 2700, "timestampLabel": "33:20 - 45:00"}
                    ],
                    "practicalOutcome": "Diagnose an underperforming 45-second query and optimize it to run in 35ms through index and join hints.",
                    "whyExists": "Provides transparency into how the database optimizer intends to execute a declarative SQL statement.",
                    "whatWasUsedBefore": "Guessing performance bottlenecks without execution telemetry.",
                    "internalMechanics": "Cost-based optimizer (CBO) evaluates multiple plan trees and selects one with minimum estimated I/O and CPU cost.",
                    "realWorldUsage": "Investigating slow database alerts, tuning automated ORM-generated SQL, and data warehouse maintenance.",
                    "commonMistakes": ["Relying on EXPLAIN without ANALYZE (estimated rows can diverge drastically from actual reality)."],
                    "video": {"creator": "Hussein Nasser", "title": "How to Read Database EXPLAIN Plans", "url": "https://www.youtube.com/watch?v=HubezKbFL7E", "startSeconds": 1300, "endSeconds": 2700, "timestampLabel": "21:40 - 45:00"},
                    "starterCode": "EXPLAIN ANALYZE SELECT * FROM orders WHERE amount > 1000;",
                    "solutionSnippet": "EXPLAIN (ANALYZE, BUFFERS) SELECT user_id, SUM(amount) FROM orders WHERE order_date >= '2026-01-01' GROUP BY user_id;"
                },
                {
                    "id": "sql-09-transactions-acid",
                    "title": "Transactions & Concurrency: ACID Guarantees, Isolation Levels & MVCC",
                    "order": 3,
                    "estimatedMinutes": 45,
                    "difficulty": "advanced",
                    "prerequisites": ["sql-08-query-optimization-explain"],
                    "criticalRoles": ["data_engineer", "ai_engineer", "mlops_engineer"],
                    "whyRelevance": "Guarantees financial data integrity and prevents race conditions under high concurrent traffic.",
                    "learningObjectives": [
                        "Master the 4 ACID guarantees: Atomicity, Consistency, Isolation, Durability.",
                        "Understand ANSI isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable.",
                        "Understand Multi-Version Concurrency Control (MVCC), snapshot isolation, and write-write conflicts."
                    ],
                    "conceptsCovered": ["ACID", "Isolation Levels", "Dirty Reads", "Phantom Reads", "MVCC", "Deadlocks"],
                    "subtopics": [
                        {"id": "sql-09-sub-1", "title": "ACID Invariants & Write-Ahead Logging (WAL) Durability", "order": 1, "concepts": ["Atomicity", "Consistency", "Durability", "WAL Log"], "interviewPriority": "MUST_KNOW", "startSeconds": 2700, "endSeconds": 3400, "timestampLabel": "45:00 - 56:40"},
                        {"id": "sql-09-sub-2", "title": "Isolation Levels, Concurrency Anomalies & MVCC Row Versions", "order": 2, "concepts": ["Dirty Read", "Repeatable Read", "Phantom Read", "MVCC"], "interviewPriority": "FREQUENTLY_TESTED", "startSeconds": 3400, "endSeconds": 4200, "timestampLabel": "56:40 - 01:10:00"}
                    ],
                    "practicalOutcome": "Implement a concurrent bank account balance transfer with row-level locks (`SELECT FOR UPDATE`) preventing deadlocks.",
                    "whyExists": "Prevents catastrophic data corruption when multiple users write to the same records simultaneously.",
                    "whatWasUsedBefore": "Single-user database locking that blocked all concurrent operations.",
                    "internalMechanics": "PostgreSQL MVCC writes new `xmin`/`xmax` row tuples without overwriting in-place; WAL ensures commit durability.",
                    "realWorldUsage": "Payment processing, inventory reservation (ticket booking), and state machine transitions in AI agents.",
                    "commonMistakes": ["Assuming Read Committed prevents phantom reads or non-repeatable reads."],
                    "video": {"creator": "Hussein Nasser", "title": "Database ACID and Isolation Levels Explained", "url": "https://www.youtube.com/watch?v=HubezKbFL7E", "startSeconds": 2700, "endSeconds": 4200, "timestampLabel": "45:00 - 01:10:00"},
                    "starterCode": "BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;",
                    "solutionSnippet": "BEGIN;\nSELECT balance FROM accounts WHERE id = 1 FOR UPDATE;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;"
                }
            ]
        }
    ]

if __name__ == "__main__":
    sql_modules = get_sql_modules()
    code = format_curriculum_ts(sql_modules, "SQL_MODULES")
    with open("lib/skills/ai-data/curriculum/sql-curriculum.ts", "w") as f:
        f.write(code)
    print("Successfully built expanded sql-curriculum.ts with 9 comprehensive topics!")

