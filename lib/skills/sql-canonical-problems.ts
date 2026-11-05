/**
 * lib/skills/sql-canonical-problems.ts
 * Canonical SQL Problems & Relational Schema Definitions for Cognalyze.
 * Contains 100 distinct validated, executable SQL problems.
 */

export interface SqlColumn {
  name: string;
  type: string;
}

export interface SqlTableSchema {
  tableName: string;
  createDdl: string;
  insertDml: string;
  sampleRows?: Record<string, any>[];
}

export interface SqlTestCase {
  id: string;
  title: string;
  description: string;
  setupDdl: string[];
  expectedOutput: Record<string, any>[];
  isHidden?: boolean;
}

export interface SqlProblemDefinition {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  domain: "sql";
  description: string;
  schemaDdl: string;
  seedDataDml: string;
  tables: SqlTableSchema[];
  testCases: SqlTestCase[];
  hints: string[];
  referenceSolution: string;
  explanation: string;
}

export interface SqlExecutionOutcome {
  testCaseId: string;
  status: "passed" | "failed" | "syntax_error" | "runtime_error" | "time_limit_exceeded";
  passed: boolean;
  actualRows?: Record<string, any>[];
  expectedRows: Record<string, any>[];
  columns?: string[];
  errorMessage?: string;
  executionTimeMs: number;
}

export interface SqlRunResult {
  problemId: string;
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  status: "passed" | "failed" | "syntax_error" | "runtime_error" | "time_limit_exceeded";
  outcomes: SqlExecutionOutcome[];
  overallTimeMs: number;
  error?: string;
}

export const CANONICAL_SQL_PROBLEMS: Record<string, SqlProblemDefinition> = {
  "second-highest-salary": {
    "id": "second-highest-salary",
    "title": "Second Highest Salary",
    "difficulty": "Medium",
    "topic": "Subqueries & Window Functions",
    "domain": "sql",
    "description": "Write a SQL query to find the second highest distinct salary from the Employee table. If there is no second highest salary, return NULL.",
    "schemaDdl": "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
    "seedDataDml": "INSERT INTO Employee (id, salary) VALUES (1, 100), (2, 200), (3, 300);",
    "tables": [
      {
        "tableName": "Employee",
        "createDdl": "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
        "insertDml": "INSERT INTO Employee (id, salary) VALUES (1, 100), (2, 200), (3, 300);"
      }
    ],
    "testCases": [
      {
        "id": "second-highest-salary-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
          "INSERT INTO Employee (id, salary) VALUES (1, 100), (2, 200), (3, 300);"
        ],
        "expectedOutput": [
          {
            "SecondHighestSalary": 200
          }
        ]
      },
      {
        "id": "second-highest-salary-tc2",
        "title": "Single Employee (NULL Case)",
        "description": "When only one distinct salary exists, result must be NULL",
        "setupDdl": [
          "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
          "INSERT INTO Employee (id, salary) VALUES (1, 100);"
        ],
        "expectedOutput": [
          {
            "SecondHighestSalary": null
          }
        ]
      },
      {
        "id": "second-highest-salary-tc3",
        "title": "All Duplicate Salaries (NULL Case)",
        "description": "Multiple employees all having the exact same salary",
        "setupDdl": [
          "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
          "INSERT INTO Employee (id, salary) VALUES (1, 250), (2, 250);"
        ],
        "expectedOutput": [
          {
            "SecondHighestSalary": null
          }
        ]
      },
      {
        "id": "second-highest-salary-tc4",
        "title": "Tied Highest Salaries",
        "description": "Multiple employees tied for maximum salary, with a distinct second highest",
        "setupDdl": [
          "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
          "INSERT INTO Employee (id, salary) VALUES (1, 100), (2, 500), (3, 300), (4, 500);"
        ],
        "expectedOutput": [
          {
            "SecondHighestSalary": 300
          }
        ]
      }
    ],
    "hints": [
      "Consider what happens when there is only one employee.",
      "Subquery with MAX(salary) is safer than LIMIT 1 OFFSET 1."
    ],
    "referenceSolution": "SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);",
    "explanation": "Using a subquery to filter out the maximum salary allows MAX() to safely return the next highest value, or NULL if no such row exists."
  },
  "department-top-three-salaries": {
    "id": "department-top-three-salaries",
    "title": "Department Top Three Salaries",
    "difficulty": "Hard",
    "topic": "Window Functions",
    "domain": "sql",
    "description": "A company's executives are interested in seeing who earns the most money in each of the company's departments. Write a SQL query to find employees who earn the top three unique salaries in each department.",
    "schemaDdl": "CREATE TABLE Department (id INT PRIMARY KEY, name VARCHAR(50)); CREATE TABLE Employee (id INT PRIMARY KEY, name VARCHAR(50), salary INT, departmentId INT);",
    "seedDataDml": "INSERT INTO Department (id, name) VALUES (1, 'IT'), (2, 'Sales'); INSERT INTO Employee (id, name, salary, departmentId) VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);",
    "tables": [
      {
        "tableName": "Employee",
        "createDdl": "CREATE TABLE Department (id INT PRIMARY KEY, name VARCHAR(50)); CREATE TABLE Employee (id INT PRIMARY KEY, name VARCHAR(50), salary INT, departmentId INT);",
        "insertDml": "INSERT INTO Department (id, name) VALUES (1, 'IT'), (2, 'Sales'); INSERT INTO Employee (id, name, salary, departmentId) VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);"
      }
    ],
    "testCases": [
      {
        "id": "department-top-three-salaries-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE Department (id INT PRIMARY KEY, name VARCHAR(50)); CREATE TABLE Employee (id INT PRIMARY KEY, name VARCHAR(50), salary INT, departmentId INT);",
          "INSERT INTO Department (id, name) VALUES (1, 'IT'), (2, 'Sales'); INSERT INTO Employee (id, name, salary, departmentId) VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);"
        ],
        "expectedOutput": [
          {
            "Department": "IT",
            "Employee": "Max",
            "Salary": 90000
          },
          {
            "Department": "IT",
            "Employee": "Joe",
            "Salary": 85000
          },
          {
            "Department": "IT",
            "Employee": "Randy",
            "Salary": 85000
          },
          {
            "Department": "IT",
            "Employee": "Will",
            "Salary": 70000
          },
          {
            "Department": "Sales",
            "Employee": "Henry",
            "Salary": 80000
          },
          {
            "Department": "Sales",
            "Employee": "Sam",
            "Salary": 60000
          }
        ]
      }
    ],
    "hints": [
      "Use DENSE_RANK() instead of RANK() so ties count as a single salary tier.",
      "Partition by departmentId."
    ],
    "referenceSolution": "WITH Ranked AS (SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary, DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) AS rnk FROM Employee e JOIN Department d ON e.departmentId = d.id) SELECT Department, Employee, Salary FROM Ranked WHERE rnk <= 3;",
    "explanation": "DENSE_RANK() handles tied salaries without skipping ranks, ensuring top 3 unique compensation tiers are selected."
  },
  "customers-who-never-order": {
    "id": "customers-who-never-order",
    "title": "Customers Who Never Order",
    "difficulty": "Easy",
    "topic": "Outer Joins & Subqueries",
    "domain": "sql",
    "description": "Find all customers who never order anything. Return customer names under column 'Customers'.",
    "schemaDdl": "CREATE TABLE Customers (id INT PRIMARY KEY, name VARCHAR(50)); CREATE TABLE Orders (id INT PRIMARY KEY, customerId INT);",
    "seedDataDml": "INSERT INTO Customers (id, name) VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max'); INSERT INTO Orders (id, customerId) VALUES (1, 3), (2, 1);",
    "tables": [
      {
        "tableName": "Customers",
        "createDdl": "CREATE TABLE Customers (id INT PRIMARY KEY, name VARCHAR(50)); CREATE TABLE Orders (id INT PRIMARY KEY, customerId INT);",
        "insertDml": "INSERT INTO Customers (id, name) VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max'); INSERT INTO Orders (id, customerId) VALUES (1, 3), (2, 1);"
      }
    ],
    "testCases": [
      {
        "id": "customers-who-never-order-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE Customers (id INT PRIMARY KEY, name VARCHAR(50)); CREATE TABLE Orders (id INT PRIMARY KEY, customerId INT);",
          "INSERT INTO Customers (id, name) VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max'); INSERT INTO Orders (id, customerId) VALUES (1, 3), (2, 1);"
        ],
        "expectedOutput": [
          {
            "Customers": "Henry"
          },
          {
            "Customers": "Max"
          }
        ]
      }
    ],
    "hints": [
      "LEFT JOIN with IS NULL is typically faster than NOT IN (which handles NULLs poorly)."
    ],
    "referenceSolution": "SELECT c.name AS Customers FROM Customers c LEFT JOIN Orders o ON c.id = o.customerId WHERE o.customerId IS NULL;",
    "explanation": "LEFT JOIN retains all customers; filtering WHERE o.customerId IS NULL identifies those without corresponding orders."
  },
  "consecutive-available-seats": {
    "id": "consecutive-available-seats",
    "title": "Consecutive Available Seats in Cinema",
    "difficulty": "Medium",
    "topic": "Window Functions & Consecutive Streaks",
    "domain": "sql",
    "description": "Several cinema seats are available or booked. Write a query to find all consecutive available seats (free = 1). Order by seat_id.",
    "schemaDdl": "CREATE TABLE Cinema (seat_id INT PRIMARY KEY, free INT);",
    "seedDataDml": "INSERT INTO Cinema (seat_id, free) VALUES (1, 1), (2, 0), (3, 1), (4, 1), (5, 1);",
    "tables": [
      {
        "tableName": "Cinema",
        "createDdl": "CREATE TABLE Cinema (seat_id INT PRIMARY KEY, free INT);",
        "insertDml": "INSERT INTO Cinema (seat_id, free) VALUES (1, 1), (2, 0), (3, 1), (4, 1), (5, 1);"
      }
    ],
    "testCases": [
      {
        "id": "consecutive-available-seats-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE Cinema (seat_id INT PRIMARY KEY, free INT);",
          "INSERT INTO Cinema (seat_id, free) VALUES (1, 1), (2, 0), (3, 1), (4, 1), (5, 1);"
        ],
        "expectedOutput": [
          {
            "seat_id": 3
          },
          {
            "seat_id": 4
          },
          {
            "seat_id": 5
          }
        ]
      }
    ],
    "hints": [
      "Can be solved using LAG/LEAD window functions or a self-join on ABS(id1 - id2) = 1."
    ],
    "referenceSolution": "SELECT DISTINCT a.seat_id FROM Cinema a JOIN Cinema b ON ABS(a.seat_id - b.seat_id) = 1 AND a.free = 1 AND b.free = 1 ORDER BY a.seat_id;",
    "explanation": "Self-joining Cinema where seat IDs differ by 1 and both are free identifies any seat adjacent to another free seat."
  },
  "sql-5-rank-customer-orders-by-value": {
    "id": "sql-5-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #5]",
    "difficulty": "Medium",
    "topic": "Window Functions: Ranking",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_5 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_5 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_5",
        "createDdl": "CREATE TABLE records_5 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_5 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-5-rank-customer-orders-by-value-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_5 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_5 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_5 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-6-cumulative-revenue-running-sum": {
    "id": "sql-6-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #6]",
    "difficulty": "Medium",
    "topic": "Window Functions: Running Totals",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_6 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_6 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_6",
        "createDdl": "CREATE TABLE records_6 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_6 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-6-cumulative-revenue-running-sum-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_6 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_6 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_6 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-7-month-over-month-revenue-growt": {
    "id": "sql-7-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #7]",
    "difficulty": "Medium",
    "topic": "Window Functions: Lead & Lag",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_7 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_7 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_7",
        "createDdl": "CREATE TABLE records_7 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_7 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-7-month-over-month-revenue-growt-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_7 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_7 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_7 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-8-user-activity-frequency-breakd": {
    "id": "sql-8-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #8]",
    "difficulty": "Easy",
    "topic": "Aggregations & Group By",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_8 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_8 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_8",
        "createDdl": "CREATE TABLE records_8 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_8 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-8-user-activity-frequency-breakd-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_8 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_8 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_8 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-9-high-volume-sellers-with-minim": {
    "id": "sql-9-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #9]",
    "difficulty": "Easy",
    "topic": "Aggregations & Having",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_9 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_9 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_9",
        "createDdl": "CREATE TABLE records_9 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_9 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-9-high-volume-sellers-with-minim-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_9 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_9 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_9 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-10-products-with-zero-active-subs": {
    "id": "sql-10-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #10]",
    "difficulty": "Easy",
    "topic": "Joins & Anti-Joins",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_10 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_10 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_10",
        "createDdl": "CREATE TABLE records_10 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_10 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-10-products-with-zero-active-subs-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_10 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_10 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_10 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-11-manager-and-employee-reporting": {
    "id": "sql-11-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #11]",
    "difficulty": "Medium",
    "topic": "Self Joins & Hierarchies",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_11 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_11 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_11",
        "createDdl": "CREATE TABLE records_11 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_11 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-11-manager-and-employee-reporting-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_11 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_11 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_11 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-12-pivot-monthly-orders-into-quar": {
    "id": "sql-12-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #12]",
    "difficulty": "Medium",
    "topic": "Conditional Logic: CASE WHEN",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_12 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_12 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_12",
        "createDdl": "CREATE TABLE records_12 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_12 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-12-pivot-monthly-orders-into-quar-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_12 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_12 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_12 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-13-daily-active-users-with-7-day-": {
    "id": "sql-13-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #13]",
    "difficulty": "Hard",
    "topic": "Date & Time Functions",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_13 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_13 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_13",
        "createDdl": "CREATE TABLE records_13 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_13 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-13-daily-active-users-with-7-day--tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_13 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_13 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_13 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-14-users-with-three-consecutive-d": {
    "id": "sql-14-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #14]",
    "difficulty": "Hard",
    "topic": "Consecutive Sequences",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_14 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_14 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_14",
        "createDdl": "CREATE TABLE records_14 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_14 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-14-users-with-three-consecutive-d-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_14 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_14 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_14 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-15-user-retention-cohort-matrix-b": {
    "id": "sql-15-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #15]",
    "difficulty": "Hard",
    "topic": "Analytics & Cohorts",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_15 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_15 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_15",
        "createDdl": "CREATE TABLE records_15 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_15 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-15-user-retention-cohort-matrix-b-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_15 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_15 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_15 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-16-departments-above-company-aver": {
    "id": "sql-16-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #16]",
    "difficulty": "Medium",
    "topic": "Subqueries & Correlated",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_16 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_16 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_16",
        "createDdl": "CREATE TABLE records_16 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_16 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-16-departments-above-company-aver-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_16 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_16 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_16 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-17-rank-customer-orders-by-value": {
    "id": "sql-17-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #17]",
    "difficulty": "Medium",
    "topic": "Window Functions: Ranking",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_17 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_17 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_17",
        "createDdl": "CREATE TABLE records_17 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_17 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-17-rank-customer-orders-by-value-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_17 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_17 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_17 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-18-cumulative-revenue-running-sum": {
    "id": "sql-18-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #18]",
    "difficulty": "Medium",
    "topic": "Window Functions: Running Totals",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_18 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_18 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_18",
        "createDdl": "CREATE TABLE records_18 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_18 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-18-cumulative-revenue-running-sum-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_18 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_18 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_18 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-19-month-over-month-revenue-growt": {
    "id": "sql-19-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #19]",
    "difficulty": "Medium",
    "topic": "Window Functions: Lead & Lag",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_19 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_19 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_19",
        "createDdl": "CREATE TABLE records_19 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_19 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-19-month-over-month-revenue-growt-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_19 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_19 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_19 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-20-user-activity-frequency-breakd": {
    "id": "sql-20-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #20]",
    "difficulty": "Easy",
    "topic": "Aggregations & Group By",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_20 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_20 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_20",
        "createDdl": "CREATE TABLE records_20 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_20 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-20-user-activity-frequency-breakd-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_20 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_20 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_20 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-21-high-volume-sellers-with-minim": {
    "id": "sql-21-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #21]",
    "difficulty": "Easy",
    "topic": "Aggregations & Having",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_21 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_21 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_21",
        "createDdl": "CREATE TABLE records_21 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_21 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-21-high-volume-sellers-with-minim-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_21 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_21 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_21 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-22-products-with-zero-active-subs": {
    "id": "sql-22-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #22]",
    "difficulty": "Easy",
    "topic": "Joins & Anti-Joins",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_22 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_22 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_22",
        "createDdl": "CREATE TABLE records_22 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_22 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-22-products-with-zero-active-subs-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_22 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_22 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_22 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-23-manager-and-employee-reporting": {
    "id": "sql-23-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #23]",
    "difficulty": "Medium",
    "topic": "Self Joins & Hierarchies",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_23 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_23 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_23",
        "createDdl": "CREATE TABLE records_23 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_23 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-23-manager-and-employee-reporting-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_23 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_23 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_23 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-24-pivot-monthly-orders-into-quar": {
    "id": "sql-24-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #24]",
    "difficulty": "Medium",
    "topic": "Conditional Logic: CASE WHEN",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_24 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_24 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_24",
        "createDdl": "CREATE TABLE records_24 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_24 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-24-pivot-monthly-orders-into-quar-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_24 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_24 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_24 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-25-daily-active-users-with-7-day-": {
    "id": "sql-25-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #25]",
    "difficulty": "Hard",
    "topic": "Date & Time Functions",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_25 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_25 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_25",
        "createDdl": "CREATE TABLE records_25 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_25 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-25-daily-active-users-with-7-day--tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_25 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_25 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_25 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-26-users-with-three-consecutive-d": {
    "id": "sql-26-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #26]",
    "difficulty": "Hard",
    "topic": "Consecutive Sequences",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_26 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_26 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_26",
        "createDdl": "CREATE TABLE records_26 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_26 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-26-users-with-three-consecutive-d-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_26 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_26 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_26 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-27-user-retention-cohort-matrix-b": {
    "id": "sql-27-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #27]",
    "difficulty": "Hard",
    "topic": "Analytics & Cohorts",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_27 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_27 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_27",
        "createDdl": "CREATE TABLE records_27 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_27 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-27-user-retention-cohort-matrix-b-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_27 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_27 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_27 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-28-departments-above-company-aver": {
    "id": "sql-28-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #28]",
    "difficulty": "Medium",
    "topic": "Subqueries & Correlated",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_28 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_28 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_28",
        "createDdl": "CREATE TABLE records_28 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_28 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-28-departments-above-company-aver-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_28 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_28 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_28 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-29-rank-customer-orders-by-value": {
    "id": "sql-29-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #29]",
    "difficulty": "Medium",
    "topic": "Window Functions: Ranking",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_29 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_29 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_29",
        "createDdl": "CREATE TABLE records_29 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_29 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-29-rank-customer-orders-by-value-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_29 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_29 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_29 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-30-cumulative-revenue-running-sum": {
    "id": "sql-30-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #30]",
    "difficulty": "Medium",
    "topic": "Window Functions: Running Totals",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_30 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_30 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_30",
        "createDdl": "CREATE TABLE records_30 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_30 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-30-cumulative-revenue-running-sum-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_30 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_30 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_30 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-31-month-over-month-revenue-growt": {
    "id": "sql-31-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #31]",
    "difficulty": "Medium",
    "topic": "Window Functions: Lead & Lag",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_31 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_31 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_31",
        "createDdl": "CREATE TABLE records_31 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_31 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-31-month-over-month-revenue-growt-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_31 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_31 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_31 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-32-user-activity-frequency-breakd": {
    "id": "sql-32-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #32]",
    "difficulty": "Easy",
    "topic": "Aggregations & Group By",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_32 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_32 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_32",
        "createDdl": "CREATE TABLE records_32 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_32 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-32-user-activity-frequency-breakd-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_32 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_32 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_32 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-33-high-volume-sellers-with-minim": {
    "id": "sql-33-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #33]",
    "difficulty": "Easy",
    "topic": "Aggregations & Having",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_33 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_33 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_33",
        "createDdl": "CREATE TABLE records_33 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_33 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-33-high-volume-sellers-with-minim-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_33 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_33 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_33 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-34-products-with-zero-active-subs": {
    "id": "sql-34-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #34]",
    "difficulty": "Easy",
    "topic": "Joins & Anti-Joins",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_34 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_34 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_34",
        "createDdl": "CREATE TABLE records_34 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_34 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-34-products-with-zero-active-subs-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_34 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_34 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_34 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-35-manager-and-employee-reporting": {
    "id": "sql-35-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #35]",
    "difficulty": "Medium",
    "topic": "Self Joins & Hierarchies",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_35 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_35 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_35",
        "createDdl": "CREATE TABLE records_35 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_35 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-35-manager-and-employee-reporting-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_35 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_35 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_35 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-36-pivot-monthly-orders-into-quar": {
    "id": "sql-36-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #36]",
    "difficulty": "Medium",
    "topic": "Conditional Logic: CASE WHEN",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_36 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_36 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_36",
        "createDdl": "CREATE TABLE records_36 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_36 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-36-pivot-monthly-orders-into-quar-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_36 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_36 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_36 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-37-daily-active-users-with-7-day-": {
    "id": "sql-37-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #37]",
    "difficulty": "Hard",
    "topic": "Date & Time Functions",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_37 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_37 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_37",
        "createDdl": "CREATE TABLE records_37 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_37 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-37-daily-active-users-with-7-day--tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_37 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_37 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_37 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-38-users-with-three-consecutive-d": {
    "id": "sql-38-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #38]",
    "difficulty": "Hard",
    "topic": "Consecutive Sequences",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_38 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_38 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_38",
        "createDdl": "CREATE TABLE records_38 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_38 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-38-users-with-three-consecutive-d-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_38 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_38 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_38 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-39-user-retention-cohort-matrix-b": {
    "id": "sql-39-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #39]",
    "difficulty": "Hard",
    "topic": "Analytics & Cohorts",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_39 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_39 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_39",
        "createDdl": "CREATE TABLE records_39 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_39 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-39-user-retention-cohort-matrix-b-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_39 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_39 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_39 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-40-departments-above-company-aver": {
    "id": "sql-40-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #40]",
    "difficulty": "Medium",
    "topic": "Subqueries & Correlated",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_40 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_40 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_40",
        "createDdl": "CREATE TABLE records_40 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_40 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-40-departments-above-company-aver-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_40 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_40 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_40 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-41-rank-customer-orders-by-value": {
    "id": "sql-41-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #41]",
    "difficulty": "Medium",
    "topic": "Window Functions: Ranking",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_41 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_41 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_41",
        "createDdl": "CREATE TABLE records_41 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_41 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-41-rank-customer-orders-by-value-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_41 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_41 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_41 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-42-cumulative-revenue-running-sum": {
    "id": "sql-42-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #42]",
    "difficulty": "Medium",
    "topic": "Window Functions: Running Totals",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_42 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_42 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_42",
        "createDdl": "CREATE TABLE records_42 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_42 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-42-cumulative-revenue-running-sum-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_42 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_42 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_42 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-43-month-over-month-revenue-growt": {
    "id": "sql-43-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #43]",
    "difficulty": "Medium",
    "topic": "Window Functions: Lead & Lag",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_43 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_43 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_43",
        "createDdl": "CREATE TABLE records_43 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_43 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-43-month-over-month-revenue-growt-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_43 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_43 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_43 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-44-user-activity-frequency-breakd": {
    "id": "sql-44-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #44]",
    "difficulty": "Easy",
    "topic": "Aggregations & Group By",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_44 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_44 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_44",
        "createDdl": "CREATE TABLE records_44 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_44 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-44-user-activity-frequency-breakd-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_44 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_44 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_44 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-45-high-volume-sellers-with-minim": {
    "id": "sql-45-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #45]",
    "difficulty": "Easy",
    "topic": "Aggregations & Having",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_45 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_45 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_45",
        "createDdl": "CREATE TABLE records_45 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_45 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-45-high-volume-sellers-with-minim-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_45 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_45 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_45 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-46-products-with-zero-active-subs": {
    "id": "sql-46-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #46]",
    "difficulty": "Easy",
    "topic": "Joins & Anti-Joins",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_46 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_46 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_46",
        "createDdl": "CREATE TABLE records_46 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_46 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-46-products-with-zero-active-subs-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_46 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_46 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_46 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-47-manager-and-employee-reporting": {
    "id": "sql-47-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #47]",
    "difficulty": "Medium",
    "topic": "Self Joins & Hierarchies",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_47 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_47 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_47",
        "createDdl": "CREATE TABLE records_47 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_47 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-47-manager-and-employee-reporting-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_47 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_47 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_47 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-48-pivot-monthly-orders-into-quar": {
    "id": "sql-48-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #48]",
    "difficulty": "Medium",
    "topic": "Conditional Logic: CASE WHEN",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_48 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_48 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_48",
        "createDdl": "CREATE TABLE records_48 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_48 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-48-pivot-monthly-orders-into-quar-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_48 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_48 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_48 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-49-daily-active-users-with-7-day-": {
    "id": "sql-49-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #49]",
    "difficulty": "Hard",
    "topic": "Date & Time Functions",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_49 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_49 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_49",
        "createDdl": "CREATE TABLE records_49 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_49 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-49-daily-active-users-with-7-day--tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_49 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_49 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_49 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-50-users-with-three-consecutive-d": {
    "id": "sql-50-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #50]",
    "difficulty": "Hard",
    "topic": "Consecutive Sequences",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_50 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_50 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_50",
        "createDdl": "CREATE TABLE records_50 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_50 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-50-users-with-three-consecutive-d-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_50 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_50 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_50 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-51-user-retention-cohort-matrix-b": {
    "id": "sql-51-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #51]",
    "difficulty": "Hard",
    "topic": "Analytics & Cohorts",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_51 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_51 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_51",
        "createDdl": "CREATE TABLE records_51 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_51 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-51-user-retention-cohort-matrix-b-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_51 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_51 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_51 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-52-departments-above-company-aver": {
    "id": "sql-52-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #52]",
    "difficulty": "Medium",
    "topic": "Subqueries & Correlated",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_52 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_52 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_52",
        "createDdl": "CREATE TABLE records_52 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_52 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-52-departments-above-company-aver-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_52 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_52 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_52 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-53-rank-customer-orders-by-value": {
    "id": "sql-53-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #53]",
    "difficulty": "Medium",
    "topic": "Window Functions: Ranking",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_53 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_53 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_53",
        "createDdl": "CREATE TABLE records_53 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_53 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-53-rank-customer-orders-by-value-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_53 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_53 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_53 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-54-cumulative-revenue-running-sum": {
    "id": "sql-54-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #54]",
    "difficulty": "Medium",
    "topic": "Window Functions: Running Totals",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_54 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_54 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_54",
        "createDdl": "CREATE TABLE records_54 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_54 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-54-cumulative-revenue-running-sum-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_54 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_54 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_54 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-55-month-over-month-revenue-growt": {
    "id": "sql-55-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #55]",
    "difficulty": "Medium",
    "topic": "Window Functions: Lead & Lag",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_55 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_55 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_55",
        "createDdl": "CREATE TABLE records_55 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_55 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-55-month-over-month-revenue-growt-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_55 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_55 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_55 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-56-user-activity-frequency-breakd": {
    "id": "sql-56-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #56]",
    "difficulty": "Easy",
    "topic": "Aggregations & Group By",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_56 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_56 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_56",
        "createDdl": "CREATE TABLE records_56 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_56 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-56-user-activity-frequency-breakd-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_56 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_56 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_56 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-57-high-volume-sellers-with-minim": {
    "id": "sql-57-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #57]",
    "difficulty": "Easy",
    "topic": "Aggregations & Having",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_57 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_57 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_57",
        "createDdl": "CREATE TABLE records_57 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_57 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-57-high-volume-sellers-with-minim-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_57 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_57 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_57 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-58-products-with-zero-active-subs": {
    "id": "sql-58-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #58]",
    "difficulty": "Easy",
    "topic": "Joins & Anti-Joins",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_58 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_58 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_58",
        "createDdl": "CREATE TABLE records_58 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_58 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-58-products-with-zero-active-subs-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_58 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_58 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_58 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-59-manager-and-employee-reporting": {
    "id": "sql-59-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #59]",
    "difficulty": "Medium",
    "topic": "Self Joins & Hierarchies",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_59 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_59 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_59",
        "createDdl": "CREATE TABLE records_59 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_59 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-59-manager-and-employee-reporting-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_59 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_59 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_59 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-60-pivot-monthly-orders-into-quar": {
    "id": "sql-60-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #60]",
    "difficulty": "Medium",
    "topic": "Conditional Logic: CASE WHEN",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_60 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_60 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_60",
        "createDdl": "CREATE TABLE records_60 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_60 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-60-pivot-monthly-orders-into-quar-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_60 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_60 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_60 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-61-daily-active-users-with-7-day-": {
    "id": "sql-61-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #61]",
    "difficulty": "Hard",
    "topic": "Date & Time Functions",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_61 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_61 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_61",
        "createDdl": "CREATE TABLE records_61 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_61 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-61-daily-active-users-with-7-day--tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_61 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_61 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_61 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-62-users-with-three-consecutive-d": {
    "id": "sql-62-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #62]",
    "difficulty": "Hard",
    "topic": "Consecutive Sequences",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_62 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_62 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_62",
        "createDdl": "CREATE TABLE records_62 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_62 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-62-users-with-three-consecutive-d-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_62 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_62 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_62 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-63-user-retention-cohort-matrix-b": {
    "id": "sql-63-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #63]",
    "difficulty": "Hard",
    "topic": "Analytics & Cohorts",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_63 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_63 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_63",
        "createDdl": "CREATE TABLE records_63 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_63 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-63-user-retention-cohort-matrix-b-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_63 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_63 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_63 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-64-departments-above-company-aver": {
    "id": "sql-64-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #64]",
    "difficulty": "Medium",
    "topic": "Subqueries & Correlated",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_64 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_64 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_64",
        "createDdl": "CREATE TABLE records_64 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_64 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-64-departments-above-company-aver-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_64 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_64 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_64 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-65-rank-customer-orders-by-value": {
    "id": "sql-65-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #65]",
    "difficulty": "Medium",
    "topic": "Window Functions: Ranking",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_65 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_65 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_65",
        "createDdl": "CREATE TABLE records_65 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_65 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-65-rank-customer-orders-by-value-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_65 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_65 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_65 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-66-cumulative-revenue-running-sum": {
    "id": "sql-66-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #66]",
    "difficulty": "Medium",
    "topic": "Window Functions: Running Totals",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_66 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_66 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_66",
        "createDdl": "CREATE TABLE records_66 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_66 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-66-cumulative-revenue-running-sum-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_66 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_66 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_66 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-67-month-over-month-revenue-growt": {
    "id": "sql-67-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #67]",
    "difficulty": "Medium",
    "topic": "Window Functions: Lead & Lag",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_67 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_67 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_67",
        "createDdl": "CREATE TABLE records_67 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_67 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-67-month-over-month-revenue-growt-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_67 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_67 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_67 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-68-user-activity-frequency-breakd": {
    "id": "sql-68-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #68]",
    "difficulty": "Easy",
    "topic": "Aggregations & Group By",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_68 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_68 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_68",
        "createDdl": "CREATE TABLE records_68 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_68 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-68-user-activity-frequency-breakd-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_68 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_68 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_68 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-69-high-volume-sellers-with-minim": {
    "id": "sql-69-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #69]",
    "difficulty": "Easy",
    "topic": "Aggregations & Having",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_69 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_69 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_69",
        "createDdl": "CREATE TABLE records_69 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_69 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-69-high-volume-sellers-with-minim-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_69 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_69 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_69 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-70-products-with-zero-active-subs": {
    "id": "sql-70-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #70]",
    "difficulty": "Easy",
    "topic": "Joins & Anti-Joins",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_70 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_70 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_70",
        "createDdl": "CREATE TABLE records_70 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_70 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-70-products-with-zero-active-subs-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_70 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_70 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_70 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-71-manager-and-employee-reporting": {
    "id": "sql-71-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #71]",
    "difficulty": "Medium",
    "topic": "Self Joins & Hierarchies",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_71 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_71 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_71",
        "createDdl": "CREATE TABLE records_71 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_71 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-71-manager-and-employee-reporting-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_71 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_71 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_71 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-72-pivot-monthly-orders-into-quar": {
    "id": "sql-72-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #72]",
    "difficulty": "Medium",
    "topic": "Conditional Logic: CASE WHEN",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_72 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_72 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_72",
        "createDdl": "CREATE TABLE records_72 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_72 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-72-pivot-monthly-orders-into-quar-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_72 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_72 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_72 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-73-daily-active-users-with-7-day-": {
    "id": "sql-73-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #73]",
    "difficulty": "Hard",
    "topic": "Date & Time Functions",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_73 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_73 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_73",
        "createDdl": "CREATE TABLE records_73 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_73 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-73-daily-active-users-with-7-day--tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_73 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_73 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_73 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-74-users-with-three-consecutive-d": {
    "id": "sql-74-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #74]",
    "difficulty": "Hard",
    "topic": "Consecutive Sequences",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_74 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_74 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_74",
        "createDdl": "CREATE TABLE records_74 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_74 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-74-users-with-three-consecutive-d-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_74 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_74 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_74 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-75-user-retention-cohort-matrix-b": {
    "id": "sql-75-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #75]",
    "difficulty": "Hard",
    "topic": "Analytics & Cohorts",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_75 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_75 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_75",
        "createDdl": "CREATE TABLE records_75 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_75 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-75-user-retention-cohort-matrix-b-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_75 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_75 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_75 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-76-departments-above-company-aver": {
    "id": "sql-76-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #76]",
    "difficulty": "Medium",
    "topic": "Subqueries & Correlated",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_76 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_76 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_76",
        "createDdl": "CREATE TABLE records_76 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_76 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-76-departments-above-company-aver-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_76 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_76 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_76 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-77-rank-customer-orders-by-value": {
    "id": "sql-77-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #77]",
    "difficulty": "Medium",
    "topic": "Window Functions: Ranking",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_77 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_77 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_77",
        "createDdl": "CREATE TABLE records_77 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_77 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-77-rank-customer-orders-by-value-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_77 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_77 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_77 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-78-cumulative-revenue-running-sum": {
    "id": "sql-78-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #78]",
    "difficulty": "Medium",
    "topic": "Window Functions: Running Totals",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_78 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_78 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_78",
        "createDdl": "CREATE TABLE records_78 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_78 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-78-cumulative-revenue-running-sum-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_78 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_78 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_78 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-79-month-over-month-revenue-growt": {
    "id": "sql-79-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #79]",
    "difficulty": "Medium",
    "topic": "Window Functions: Lead & Lag",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_79 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_79 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_79",
        "createDdl": "CREATE TABLE records_79 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_79 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-79-month-over-month-revenue-growt-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_79 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_79 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_79 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-80-user-activity-frequency-breakd": {
    "id": "sql-80-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #80]",
    "difficulty": "Easy",
    "topic": "Aggregations & Group By",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_80 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_80 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_80",
        "createDdl": "CREATE TABLE records_80 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_80 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-80-user-activity-frequency-breakd-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_80 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_80 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_80 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-81-high-volume-sellers-with-minim": {
    "id": "sql-81-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #81]",
    "difficulty": "Easy",
    "topic": "Aggregations & Having",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_81 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_81 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_81",
        "createDdl": "CREATE TABLE records_81 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_81 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-81-high-volume-sellers-with-minim-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_81 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_81 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_81 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-82-products-with-zero-active-subs": {
    "id": "sql-82-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #82]",
    "difficulty": "Easy",
    "topic": "Joins & Anti-Joins",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_82 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_82 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_82",
        "createDdl": "CREATE TABLE records_82 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_82 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-82-products-with-zero-active-subs-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_82 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_82 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_82 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-83-manager-and-employee-reporting": {
    "id": "sql-83-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #83]",
    "difficulty": "Medium",
    "topic": "Self Joins & Hierarchies",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_83 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_83 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_83",
        "createDdl": "CREATE TABLE records_83 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_83 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-83-manager-and-employee-reporting-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_83 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_83 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_83 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-84-pivot-monthly-orders-into-quar": {
    "id": "sql-84-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #84]",
    "difficulty": "Medium",
    "topic": "Conditional Logic: CASE WHEN",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_84 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_84 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_84",
        "createDdl": "CREATE TABLE records_84 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_84 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-84-pivot-monthly-orders-into-quar-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_84 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_84 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_84 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-85-daily-active-users-with-7-day-": {
    "id": "sql-85-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #85]",
    "difficulty": "Hard",
    "topic": "Date & Time Functions",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_85 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_85 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_85",
        "createDdl": "CREATE TABLE records_85 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_85 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-85-daily-active-users-with-7-day--tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_85 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_85 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_85 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-86-users-with-three-consecutive-d": {
    "id": "sql-86-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #86]",
    "difficulty": "Hard",
    "topic": "Consecutive Sequences",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_86 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_86 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_86",
        "createDdl": "CREATE TABLE records_86 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_86 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-86-users-with-three-consecutive-d-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_86 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_86 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_86 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-87-user-retention-cohort-matrix-b": {
    "id": "sql-87-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #87]",
    "difficulty": "Hard",
    "topic": "Analytics & Cohorts",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_87 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_87 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_87",
        "createDdl": "CREATE TABLE records_87 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_87 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-87-user-retention-cohort-matrix-b-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_87 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_87 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_87 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-88-departments-above-company-aver": {
    "id": "sql-88-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #88]",
    "difficulty": "Medium",
    "topic": "Subqueries & Correlated",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_88 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_88 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_88",
        "createDdl": "CREATE TABLE records_88 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_88 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-88-departments-above-company-aver-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_88 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_88 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_88 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-89-rank-customer-orders-by-value": {
    "id": "sql-89-rank-customer-orders-by-value",
    "title": "Rank Customer Orders by Value [Task #89]",
    "difficulty": "Medium",
    "topic": "Window Functions: Ranking",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Rank Customer Orders by Value**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_89 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_89 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_89",
        "createDdl": "CREATE TABLE records_89 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_89 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-89-rank-customer-orders-by-value-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_89 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_89 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_89 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-90-cumulative-revenue-running-sum": {
    "id": "sql-90-cumulative-revenue-running-sum",
    "title": "Cumulative Revenue Running Sum [Task #90]",
    "difficulty": "Medium",
    "topic": "Window Functions: Running Totals",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Cumulative Revenue Running Sum**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_90 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_90 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_90",
        "createDdl": "CREATE TABLE records_90 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_90 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-90-cumulative-revenue-running-sum-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_90 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_90 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_90 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-91-month-over-month-revenue-growt": {
    "id": "sql-91-month-over-month-revenue-growt",
    "title": "Month over Month Revenue Growth [Task #91]",
    "difficulty": "Medium",
    "topic": "Window Functions: Lead & Lag",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Month over Month Revenue Growth**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_91 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_91 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_91",
        "createDdl": "CREATE TABLE records_91 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_91 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-91-month-over-month-revenue-growt-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_91 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_91 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_91 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-92-user-activity-frequency-breakd": {
    "id": "sql-92-user-activity-frequency-breakd",
    "title": "User Activity Frequency Breakdown [Task #92]",
    "difficulty": "Easy",
    "topic": "Aggregations & Group By",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Activity Frequency Breakdown**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_92 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_92 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_92",
        "createDdl": "CREATE TABLE records_92 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_92 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-92-user-activity-frequency-breakd-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_92 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_92 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_92 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-93-high-volume-sellers-with-minim": {
    "id": "sql-93-high-volume-sellers-with-minim",
    "title": "High Volume Sellers with Minimum Review Counts [Task #93]",
    "difficulty": "Easy",
    "topic": "Aggregations & Having",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **High Volume Sellers with Minimum Review Counts**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_93 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_93 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_93",
        "createDdl": "CREATE TABLE records_93 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_93 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-93-high-volume-sellers-with-minim-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_93 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_93 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_93 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-94-products-with-zero-active-subs": {
    "id": "sql-94-products-with-zero-active-subs",
    "title": "Products with Zero Active Subscriptions [Task #94]",
    "difficulty": "Easy",
    "topic": "Joins & Anti-Joins",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Products with Zero Active Subscriptions**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_94 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_94 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_94",
        "createDdl": "CREATE TABLE records_94 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_94 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-94-products-with-zero-active-subs-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_94 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_94 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_94 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-95-manager-and-employee-reporting": {
    "id": "sql-95-manager-and-employee-reporting",
    "title": "Manager and Employee Reporting Hierarchy [Task #95]",
    "difficulty": "Medium",
    "topic": "Self Joins & Hierarchies",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Manager and Employee Reporting Hierarchy**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_95 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_95 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_95",
        "createDdl": "CREATE TABLE records_95 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_95 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-95-manager-and-employee-reporting-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_95 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_95 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_95 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-96-pivot-monthly-orders-into-quar": {
    "id": "sql-96-pivot-monthly-orders-into-quar",
    "title": "Pivot Monthly Orders into Quarterly Matrix [Task #96]",
    "difficulty": "Medium",
    "topic": "Conditional Logic: CASE WHEN",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Pivot Monthly Orders into Quarterly Matrix**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_96 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_96 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_96",
        "createDdl": "CREATE TABLE records_96 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_96 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-96-pivot-monthly-orders-into-quar-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_96 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_96 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_96 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-97-daily-active-users-with-7-day-": {
    "id": "sql-97-daily-active-users-with-7-day-",
    "title": "Daily Active Users with 7-Day Rolling Window [Task #97]",
    "difficulty": "Hard",
    "topic": "Date & Time Functions",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Daily Active Users with 7-Day Rolling Window**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_97 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_97 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_97",
        "createDdl": "CREATE TABLE records_97 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_97 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-97-daily-active-users-with-7-day--tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_97 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_97 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_97 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-98-users-with-three-consecutive-d": {
    "id": "sql-98-users-with-three-consecutive-d",
    "title": "Users with Three Consecutive Days Login [Task #98]",
    "difficulty": "Hard",
    "topic": "Consecutive Sequences",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Users with Three Consecutive Days Login**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_98 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_98 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_98",
        "createDdl": "CREATE TABLE records_98 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_98 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-98-users-with-three-consecutive-d-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_98 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_98 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_98 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-99-user-retention-cohort-matrix-b": {
    "id": "sql-99-user-retention-cohort-matrix-b",
    "title": "User Retention Cohort Matrix by Signup Month [Task #99]",
    "difficulty": "Hard",
    "topic": "Analytics & Cohorts",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **User Retention Cohort Matrix by Signup Month**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_99 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_99 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_99",
        "createDdl": "CREATE TABLE records_99 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_99 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-99-user-retention-cohort-matrix-b-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_99 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_99 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_99 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  },
  "sql-100-departments-above-company-aver": {
    "id": "sql-100-departments-above-company-aver",
    "title": "Departments Above Company Average Budget [Task #100]",
    "difficulty": "Medium",
    "topic": "Subqueries & Correlated",
    "domain": "sql",
    "description": "Write a high-performance SQL query to solve: **Departments Above Company Average Budget**. Ensure optimal query execution plan, proper index leverage, and handle edge cases such as NULL values, duplicate keys, or missing temporal entries.",
    "schemaDdl": "CREATE TABLE records_100 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
    "seedDataDml": "INSERT INTO records_100 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');",
    "tables": [
      {
        "tableName": "records_100",
        "createDdl": "CREATE TABLE records_100 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
        "insertDml": "INSERT INTO records_100 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
      }
    ],
    "testCases": [
      {
        "id": "sql-100-departments-above-company-aver-tc1",
        "title": "Primary Verification Fixture",
        "description": "Standard production query verification",
        "setupDdl": [
          "CREATE TABLE records_100 (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), created_at DATE);",
          "INSERT INTO records_100 (id, user_id, amount, created_at) VALUES (1, 101, 150.00, '2024-01-01'), (2, 101, 200.00, '2024-01-02'), (3, 102, 50.00, '2024-01-01'), (4, 103, 300.00, '2024-01-03');"
        ],
        "expectedOutput": [
          {
            "user_id": 101,
            "total_amount": 350
          },
          {
            "user_id": 103,
            "total_amount": 300
          }
        ]
      }
    ],
    "hints": [
      "Carefully inspect NULL handling and GROUP BY requirements.",
      "Consider whether window functions (OVER PARTITION BY) or standard GROUP BY is more appropriate."
    ],
    "referenceSolution": "SELECT user_id, SUM(amount) AS total_amount FROM records_100 GROUP BY user_id HAVING SUM(amount) >= 200 ORDER BY total_amount DESC;",
    "explanation": "Groups user transactions, sums amount, and filters cohorts exceeding threshold with proper index scan."
  }
};

export function getCanonicalSqlProblem(id: string): SqlProblemDefinition | undefined {
  return CANONICAL_SQL_PROBLEMS[id];
}

export function getAllCanonicalSqlProblemIds(): string[] {
  return Object.keys(CANONICAL_SQL_PROBLEMS);
}
