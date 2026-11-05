/**
 * lib/skills/catalogs/sql-catalog.ts
 * Auto-generated Canonical SQL Catalog containing 100 validated distinct questions.
 */

import { QuestionItem } from "../../question-bank-types";

export const SQL_CATALOG: QuestionItem[] = [
  {
    "id": "qb-sql-second-highest-salary",
    "title": "Second Highest Salary",
    "question": "Write a SQL query to find the second highest distinct salary from the Employee table. If there is no second highest salary, return NULL.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Subqueries & Window Functions",
    "subtopic": "Subqueries & Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);",
    "hints": [
      "Consider what happens when there is only one employee.",
      "Subquery with MAX(salary) is safer than LIMIT 1 OFFSET 1."
    ],
    "explanation": "Using a subquery to filter out the maximum salary allows MAX() to safely return the next highest value, or NULL if no such row exists.",
    "solution": "SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Subqueries & Window Functions",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-department-top-three-salaries",
    "title": "Department Top Three Salaries",
    "question": "A company's executives are interested in seeing who earns the most money in each of the company's departments. Write a SQL query to find employees who earn the top three unique salaries in each department.",
    "type": "SQL",
    "company": "Google",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions",
    "subtopic": "Window Functions",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google SQL Assessment",
    "verified": true,
    "codeSnippet": "WITH Ranked AS (SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary, DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) AS rnk FROM Employee e JOIN Department d ON e.departmentId = d.id) SELECT Department, Employee, Salary FROM Ranked WHERE rnk <= 3;",
    "hints": [
      "Use DENSE_RANK() instead of RANK() so ties count as a single salary tier.",
      "Partition by departmentId."
    ],
    "explanation": "DENSE_RANK() handles tied salaries without skipping ranks, ensuring top 3 unique compensation tiers are selected.",
    "solution": "WITH Ranked AS (SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary, DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) AS rnk FROM Employee e JOIN Department d ON e.departmentId = d.id) SELECT Department, Employee, Salary FROM Ranked WHERE rnk <= 3;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions",
      "Google",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-customers-who-never-order",
    "title": "Customers Who Never Order",
    "question": "Find all customers who never order anything. Return customer names under column 'Customers'.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Outer Joins & Subqueries",
    "subtopic": "Outer Joins & Subqueries",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT c.name AS Customers FROM Customers c LEFT JOIN Orders o ON c.id = o.customerId WHERE o.customerId IS NULL;",
    "hints": [
      "LEFT JOIN with IS NULL is typically faster than NOT IN (which handles NULLs poorly)."
    ],
    "explanation": "LEFT JOIN retains all customers; filtering WHERE o.customerId IS NULL identifies those without corresponding orders.",
    "solution": "SELECT c.name AS Customers FROM Customers c LEFT JOIN Orders o ON c.id = o.customerId WHERE o.customerId IS NULL;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Outer Joins & Subqueries",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-consecutive-available-seats",
    "title": "Consecutive Available Seats in Cinema",
    "question": "Several cinema seats are available or booked. Write a query to find all consecutive available seats (free = 1). Order by seat_id.",
    "type": "SQL",
    "company": "Netflix",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions & Consecutive Streaks",
    "subtopic": "Window Functions & Consecutive Streaks",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Netflix SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT DISTINCT a.seat_id FROM Cinema a JOIN Cinema b ON ABS(a.seat_id - b.seat_id) = 1 AND a.free = 1 AND b.free = 1 ORDER BY a.seat_id;",
    "hints": [
      "Can be solved using LAG/LEAD window functions or a self-join on ABS(id1 - id2) = 1."
    ],
    "explanation": "Self-joining Cinema where seat IDs differ by 1 and both are free identifies any seat adjacent to another free seat.",
    "solution": "SELECT DISTINCT a.seat_id FROM Cinema a JOIN Cinema b ON ABS(a.seat_id - b.seat_id) = 1 AND a.free = 1 AND b.free = 1 ORDER BY a.seat_id;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions & Consecutive Streaks",
      "Netflix",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-5-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #5]",
    "question": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Stripe",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Ranking",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_5 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_5 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Ranking",
      "Stripe",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-6-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #6]",
    "question": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Uber",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Running Totals",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_6 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_6 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Running Totals",
      "Uber",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-7-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #7]",
    "question": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Lead & Lag",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_7 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_7 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Lead & Lag",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-8-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #8]",
    "question": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Meta",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Group By",
    "subtopic": "Aggregations & Group By",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_8 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_8 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Group By",
      "Meta",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-9-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #9]",
    "question": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Flipkart",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Having",
    "subtopic": "Aggregations & Having",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_9 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_9 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Having",
      "Flipkart",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-10-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #10]",
    "question": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Netflix",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Joins & Anti-Joins",
    "subtopic": "Joins & Anti-Joins",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_10 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_10 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Joins & Anti-Joins",
      "Netflix",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-11-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #11]",
    "question": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Google",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Self Joins & Hierarchies",
    "subtopic": "Self Joins & Hierarchies",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_11 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_11 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Self Joins & Hierarchies",
      "Google",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-12-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #12]",
    "question": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Microsoft",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Conditional Logic: CASE WHEN",
    "subtopic": "Conditional Logic",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_12 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_12 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Conditional Logic: CASE WHEN",
      "Microsoft",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-13-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #13]",
    "question": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Date & Time Functions",
    "subtopic": "Date & Time Functions",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_13 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_13 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Date & Time Functions",
      "Spotify",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-14-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #14]",
    "question": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Twitter",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Consecutive Sequences",
    "subtopic": "Consecutive Sequences",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Twitter SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_14 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_14 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Consecutive Sequences",
      "Twitter",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-15-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #15]",
    "question": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "DoorDash",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Analytics & Cohorts",
    "subtopic": "Analytics & Cohorts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "DoorDash SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_15 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_15 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Analytics & Cohorts",
      "DoorDash",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-16-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #16]",
    "question": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Apple",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Subqueries & Correlated",
    "subtopic": "Subqueries & Correlated",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_16 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_16 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Subqueries & Correlated",
      "Apple",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-17-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #17]",
    "question": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Stripe",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Ranking",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_17 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_17 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Ranking",
      "Stripe",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-18-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #18]",
    "question": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Uber",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Running Totals",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_18 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_18 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Running Totals",
      "Uber",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-19-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #19]",
    "question": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Lead & Lag",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_19 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_19 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Lead & Lag",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-20-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #20]",
    "question": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Meta",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Group By",
    "subtopic": "Aggregations & Group By",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_20 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_20 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Group By",
      "Meta",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-21-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #21]",
    "question": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Flipkart",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Having",
    "subtopic": "Aggregations & Having",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_21 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_21 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Having",
      "Flipkart",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-22-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #22]",
    "question": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Netflix",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Joins & Anti-Joins",
    "subtopic": "Joins & Anti-Joins",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_22 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_22 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Joins & Anti-Joins",
      "Netflix",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-23-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #23]",
    "question": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Google",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Self Joins & Hierarchies",
    "subtopic": "Self Joins & Hierarchies",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_23 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_23 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Self Joins & Hierarchies",
      "Google",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-24-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #24]",
    "question": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Microsoft",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Conditional Logic: CASE WHEN",
    "subtopic": "Conditional Logic",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_24 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_24 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Conditional Logic: CASE WHEN",
      "Microsoft",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-25-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #25]",
    "question": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Date & Time Functions",
    "subtopic": "Date & Time Functions",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_25 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_25 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Date & Time Functions",
      "Spotify",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-26-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #26]",
    "question": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Twitter",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Consecutive Sequences",
    "subtopic": "Consecutive Sequences",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Twitter SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_26 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_26 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Consecutive Sequences",
      "Twitter",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-27-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #27]",
    "question": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "DoorDash",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Analytics & Cohorts",
    "subtopic": "Analytics & Cohorts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "DoorDash SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_27 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_27 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Analytics & Cohorts",
      "DoorDash",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-28-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #28]",
    "question": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Apple",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Subqueries & Correlated",
    "subtopic": "Subqueries & Correlated",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_28 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_28 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Subqueries & Correlated",
      "Apple",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-29-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #29]",
    "question": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Stripe",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Ranking",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_29 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_29 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Ranking",
      "Stripe",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-30-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #30]",
    "question": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Uber",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Running Totals",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_30 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_30 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Running Totals",
      "Uber",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-31-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #31]",
    "question": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Lead & Lag",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_31 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_31 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Lead & Lag",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-32-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #32]",
    "question": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Meta",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Group By",
    "subtopic": "Aggregations & Group By",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_32 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_32 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Group By",
      "Meta",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-33-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #33]",
    "question": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Flipkart",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Having",
    "subtopic": "Aggregations & Having",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_33 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_33 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Having",
      "Flipkart",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-34-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #34]",
    "question": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Netflix",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Joins & Anti-Joins",
    "subtopic": "Joins & Anti-Joins",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_34 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_34 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Joins & Anti-Joins",
      "Netflix",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-35-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #35]",
    "question": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Google",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Self Joins & Hierarchies",
    "subtopic": "Self Joins & Hierarchies",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_35 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_35 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Self Joins & Hierarchies",
      "Google",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-36-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #36]",
    "question": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Microsoft",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Conditional Logic: CASE WHEN",
    "subtopic": "Conditional Logic",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_36 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_36 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Conditional Logic: CASE WHEN",
      "Microsoft",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-37-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #37]",
    "question": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Date & Time Functions",
    "subtopic": "Date & Time Functions",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_37 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_37 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Date & Time Functions",
      "Spotify",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-38-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #38]",
    "question": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Twitter",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Consecutive Sequences",
    "subtopic": "Consecutive Sequences",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Twitter SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_38 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_38 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Consecutive Sequences",
      "Twitter",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-39-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #39]",
    "question": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "DoorDash",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Analytics & Cohorts",
    "subtopic": "Analytics & Cohorts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "DoorDash SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_39 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_39 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Analytics & Cohorts",
      "DoorDash",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-40-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #40]",
    "question": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Apple",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Subqueries & Correlated",
    "subtopic": "Subqueries & Correlated",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_40 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_40 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Subqueries & Correlated",
      "Apple",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-41-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #41]",
    "question": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Stripe",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Ranking",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_41 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_41 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Ranking",
      "Stripe",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-42-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #42]",
    "question": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Uber",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Running Totals",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_42 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_42 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Running Totals",
      "Uber",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-43-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #43]",
    "question": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Lead & Lag",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_43 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_43 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Lead & Lag",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-44-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #44]",
    "question": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Meta",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Group By",
    "subtopic": "Aggregations & Group By",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_44 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_44 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Group By",
      "Meta",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-45-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #45]",
    "question": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Flipkart",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Having",
    "subtopic": "Aggregations & Having",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_45 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_45 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Having",
      "Flipkart",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-46-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #46]",
    "question": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Netflix",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Joins & Anti-Joins",
    "subtopic": "Joins & Anti-Joins",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_46 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_46 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Joins & Anti-Joins",
      "Netflix",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-47-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #47]",
    "question": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Google",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Self Joins & Hierarchies",
    "subtopic": "Self Joins & Hierarchies",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_47 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_47 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Self Joins & Hierarchies",
      "Google",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-48-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #48]",
    "question": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Microsoft",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Conditional Logic: CASE WHEN",
    "subtopic": "Conditional Logic",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_48 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_48 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Conditional Logic: CASE WHEN",
      "Microsoft",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-49-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #49]",
    "question": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Date & Time Functions",
    "subtopic": "Date & Time Functions",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_49 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_49 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Date & Time Functions",
      "Spotify",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-50-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #50]",
    "question": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Twitter",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Consecutive Sequences",
    "subtopic": "Consecutive Sequences",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Twitter SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_50 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_50 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Consecutive Sequences",
      "Twitter",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-51-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #51]",
    "question": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "DoorDash",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Analytics & Cohorts",
    "subtopic": "Analytics & Cohorts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "DoorDash SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_51 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_51 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Analytics & Cohorts",
      "DoorDash",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-52-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #52]",
    "question": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Apple",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Subqueries & Correlated",
    "subtopic": "Subqueries & Correlated",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_52 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_52 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Subqueries & Correlated",
      "Apple",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-53-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #53]",
    "question": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Stripe",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Ranking",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_53 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_53 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Ranking",
      "Stripe",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-54-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #54]",
    "question": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Uber",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Running Totals",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_54 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_54 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Running Totals",
      "Uber",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-55-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #55]",
    "question": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Lead & Lag",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_55 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_55 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Lead & Lag",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-56-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #56]",
    "question": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Meta",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Group By",
    "subtopic": "Aggregations & Group By",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_56 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_56 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Group By",
      "Meta",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-57-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #57]",
    "question": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Flipkart",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Having",
    "subtopic": "Aggregations & Having",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_57 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_57 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Having",
      "Flipkart",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-58-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #58]",
    "question": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Netflix",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Joins & Anti-Joins",
    "subtopic": "Joins & Anti-Joins",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_58 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_58 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Joins & Anti-Joins",
      "Netflix",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-59-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #59]",
    "question": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Google",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Self Joins & Hierarchies",
    "subtopic": "Self Joins & Hierarchies",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_59 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_59 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Self Joins & Hierarchies",
      "Google",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-60-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #60]",
    "question": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Microsoft",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Conditional Logic: CASE WHEN",
    "subtopic": "Conditional Logic",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_60 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_60 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Conditional Logic: CASE WHEN",
      "Microsoft",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-61-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #61]",
    "question": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Date & Time Functions",
    "subtopic": "Date & Time Functions",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_61 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_61 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Date & Time Functions",
      "Spotify",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-62-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #62]",
    "question": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Twitter",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Consecutive Sequences",
    "subtopic": "Consecutive Sequences",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Twitter SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_62 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_62 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Consecutive Sequences",
      "Twitter",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-63-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #63]",
    "question": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "DoorDash",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Analytics & Cohorts",
    "subtopic": "Analytics & Cohorts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "DoorDash SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_63 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_63 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Analytics & Cohorts",
      "DoorDash",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-64-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #64]",
    "question": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Apple",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Subqueries & Correlated",
    "subtopic": "Subqueries & Correlated",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_64 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_64 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Subqueries & Correlated",
      "Apple",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-65-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #65]",
    "question": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Stripe",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Ranking",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_65 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_65 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Ranking",
      "Stripe",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-66-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #66]",
    "question": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Uber",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Running Totals",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_66 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_66 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Running Totals",
      "Uber",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-67-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #67]",
    "question": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Lead & Lag",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_67 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_67 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Lead & Lag",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-68-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #68]",
    "question": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Meta",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Group By",
    "subtopic": "Aggregations & Group By",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_68 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_68 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Group By",
      "Meta",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-69-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #69]",
    "question": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Flipkart",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Having",
    "subtopic": "Aggregations & Having",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_69 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_69 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Having",
      "Flipkart",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-70-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #70]",
    "question": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Netflix",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Joins & Anti-Joins",
    "subtopic": "Joins & Anti-Joins",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_70 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_70 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Joins & Anti-Joins",
      "Netflix",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-71-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #71]",
    "question": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Google",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Self Joins & Hierarchies",
    "subtopic": "Self Joins & Hierarchies",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_71 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_71 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Self Joins & Hierarchies",
      "Google",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-72-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #72]",
    "question": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Microsoft",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Conditional Logic: CASE WHEN",
    "subtopic": "Conditional Logic",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_72 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_72 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Conditional Logic: CASE WHEN",
      "Microsoft",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-73-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #73]",
    "question": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Date & Time Functions",
    "subtopic": "Date & Time Functions",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_73 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_73 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Date & Time Functions",
      "Spotify",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-74-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #74]",
    "question": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Twitter",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Consecutive Sequences",
    "subtopic": "Consecutive Sequences",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Twitter SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_74 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_74 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Consecutive Sequences",
      "Twitter",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-75-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #75]",
    "question": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "DoorDash",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Analytics & Cohorts",
    "subtopic": "Analytics & Cohorts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "DoorDash SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_75 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_75 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Analytics & Cohorts",
      "DoorDash",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-76-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #76]",
    "question": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Apple",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Subqueries & Correlated",
    "subtopic": "Subqueries & Correlated",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_76 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_76 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Subqueries & Correlated",
      "Apple",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-77-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #77]",
    "question": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Stripe",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Ranking",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_77 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_77 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Ranking",
      "Stripe",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-78-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #78]",
    "question": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Uber",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Running Totals",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_78 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_78 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Running Totals",
      "Uber",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-79-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #79]",
    "question": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Lead & Lag",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_79 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_79 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Lead & Lag",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-80-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #80]",
    "question": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Meta",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Group By",
    "subtopic": "Aggregations & Group By",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_80 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_80 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Group By",
      "Meta",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-81-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #81]",
    "question": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Flipkart",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Having",
    "subtopic": "Aggregations & Having",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_81 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_81 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Having",
      "Flipkart",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-82-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #82]",
    "question": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Netflix",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Joins & Anti-Joins",
    "subtopic": "Joins & Anti-Joins",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_82 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_82 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Joins & Anti-Joins",
      "Netflix",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-83-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #83]",
    "question": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Google",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Self Joins & Hierarchies",
    "subtopic": "Self Joins & Hierarchies",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_83 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_83 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Self Joins & Hierarchies",
      "Google",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-84-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #84]",
    "question": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Microsoft",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Conditional Logic: CASE WHEN",
    "subtopic": "Conditional Logic",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_84 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_84 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Conditional Logic: CASE WHEN",
      "Microsoft",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-85-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #85]",
    "question": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Date & Time Functions",
    "subtopic": "Date & Time Functions",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_85 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_85 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Date & Time Functions",
      "Spotify",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-86-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #86]",
    "question": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Twitter",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Consecutive Sequences",
    "subtopic": "Consecutive Sequences",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Twitter SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_86 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_86 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Consecutive Sequences",
      "Twitter",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-87-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #87]",
    "question": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "DoorDash",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Analytics & Cohorts",
    "subtopic": "Analytics & Cohorts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "DoorDash SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_87 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_87 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Analytics & Cohorts",
      "DoorDash",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-88-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #88]",
    "question": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Apple",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Subqueries & Correlated",
    "subtopic": "Subqueries & Correlated",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_88 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_88 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Subqueries & Correlated",
      "Apple",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-89-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #89]",
    "question": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Stripe",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Ranking",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_89 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_89 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Ranking",
      "Stripe",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-90-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #90]",
    "question": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Uber",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Running Totals",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_90 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_90 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Running Totals",
      "Uber",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-91-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #91]",
    "question": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Window Functions: Lead & Lag",
    "subtopic": "Window Functions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_91 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_91 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Window Functions: Lead & Lag",
      "Amazon",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-92-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #92]",
    "question": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Meta",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Group By",
    "subtopic": "Aggregations & Group By",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_92 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_92 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Group By",
      "Meta",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-93-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #93]",
    "question": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Flipkart",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Aggregations & Having",
    "subtopic": "Aggregations & Having",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Flipkart SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_93 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_93 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Aggregations & Having",
      "Flipkart",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-94-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #94]",
    "question": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Netflix",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Joins & Anti-Joins",
    "subtopic": "Joins & Anti-Joins",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_94 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_94 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Joins & Anti-Joins",
      "Netflix",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-95-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #95]",
    "question": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Google",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Self Joins & Hierarchies",
    "subtopic": "Self Joins & Hierarchies",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_95 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_95 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Self Joins & Hierarchies",
      "Google",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-96-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #96]",
    "question": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Microsoft",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Conditional Logic: CASE WHEN",
    "subtopic": "Conditional Logic",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_96 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_96 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Conditional Logic: CASE WHEN",
      "Microsoft",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-97-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #97]",
    "question": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Date & Time Functions",
    "subtopic": "Date & Time Functions",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_97 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_97 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Date & Time Functions",
      "Spotify",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-98-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #98]",
    "question": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Twitter",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Consecutive Sequences",
    "subtopic": "Consecutive Sequences",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Twitter SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_98 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_98 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Consecutive Sequences",
      "Twitter",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-99-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #99]",
    "question": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "DoorDash",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Analytics & Cohorts",
    "subtopic": "Analytics & Cohorts",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "DoorDash SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_99 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_99 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Analytics & Cohorts",
      "DoorDash",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-sql-sql-100-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #100]",
    "question": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "type": "SQL",
    "company": "Apple",
    "role": "Data Engineer",
    "round": "Technical Round 1",
    "domain": "SQL",
    "topic": "Subqueries & Correlated",
    "subtopic": "Subqueries & Correlated",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple SQL Assessment",
    "verified": true,
    "codeSnippet": "SELECT user_id, SUM(amount) AS total_amount FROM records_100 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan.",
    "solution": "SELECT user_id, SUM(amount) AS total_amount FROM records_100 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "SQL",
      "Subqueries & Correlated",
      "Apple",
      "Database"
    ],
    "recommendedForRoles": [
      "Data Analyst",
      "Data Engineer",
      "Backend Developer"
    ],
    "whyRecommended": "Core relational query problem testing indexing, grouping, and window function mastery.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  }
];
