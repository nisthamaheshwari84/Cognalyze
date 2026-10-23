/**
 * lib/skills/sql-canonical-problems.ts
 * Canonical SQL Problems & Relational Schema Definitions for Cognalyze.
 * Safe for import in both Client and Server components (zero Node.js binary imports).
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
    id: "second-highest-salary",
    title: "Second Highest Salary",
    difficulty: "Medium",
    topic: "Subqueries & Window Functions",
    domain: "sql",
    description: `Write a SQL query to find the second highest distinct salary from the **Employee** table.
If there is no second highest salary, the query should report \`null\` as \`SecondHighestSalary\`.

**Table Schema:**
\`\`\`sql
CREATE TABLE Employee (
  id INT PRIMARY KEY,
  salary INT
);
\`\`\`

**Example 1:**
- Input: Employee with salaries [100, 200, 300]
- Output: \`SecondHighestSalary: 200\`

**Example 2:**
- Input: Employee with salary [100]
- Output: \`SecondHighestSalary: null\``,
    schemaDdl: "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
    seedDataDml: "INSERT INTO Employee VALUES (1, 100), (2, 200), (3, 300);",
    tables: [
      {
        tableName: "Employee",
        createDdl: "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
        insertDml: "INSERT INTO Employee VALUES (1, 100), (2, 200), (3, 300);",
        sampleRows: [
          { id: 1, salary: 100 },
          { id: 2, salary: 200 },
          { id: 3, salary: 300 },
        ],
      },
    ],
    hints: [
      "Consider using DISTINCT to ensure duplicates don't take both 1st and 2nd positions.",
      "A subquery with MAX(salary) or DENSE_RANK() OVER (ORDER BY salary DESC) can help.",
      "To ensure NULL is returned if fewer than 2 distinct salaries exist, wrap in a scalar subquery (SELECT (...) AS SecondHighestSalary)."
    ],
    referenceSolution: `SELECT (
  SELECT DISTINCT salary 
  FROM Employee 
  ORDER BY salary DESC 
  LIMIT 1 OFFSET 1
) AS SecondHighestSalary;`,
    explanation: `Using a scalar subquery \`SELECT (SELECT ...) AS SecondHighestSalary\` guarantees that if the inner query produces 0 rows (e.g. only 1 distinct salary), SQL evaluates the scalar expression as \`NULL\`. Ordering distinct salaries descending with \`LIMIT 1 OFFSET 1\` directly accesses the 2nd distinct salary in O(N log N) time without vendor-specific dialect locks.`,
    testCases: [
      {
        id: "public-tc-1",
        title: "Standard 3 Employees with Distinct Salaries",
        description: "Salaries 100, 200, 300 -> 2nd highest is 200",
        setupDdl: [
          "DROP TABLE IF EXISTS Employee;",
          "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
          "INSERT INTO Employee VALUES (1, 100), (2, 200), (3, 300);",
        ],
        expectedOutput: [{ SecondHighestSalary: 200 }],
        isHidden: false,
      },
      {
        id: "public-tc-2",
        title: "Single Employee (Must return NULL)",
        description: "Salaries [100] -> 2nd highest is NULL",
        setupDdl: [
          "DROP TABLE IF EXISTS Employee;",
          "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
          "INSERT INTO Employee VALUES (1, 100);",
        ],
        expectedOutput: [{ SecondHighestSalary: null }],
        isHidden: false,
      },
      {
        id: "hidden-tc-3",
        title: "Duplicate Highest Salaries",
        description: "Salaries [100, 200, 300, 300] -> distinct 2nd highest is 200",
        setupDdl: [
          "DROP TABLE IF EXISTS Employee;",
          "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
          "INSERT INTO Employee VALUES (1, 100), (2, 200), (3, 300), (4, 300);",
        ],
        expectedOutput: [{ SecondHighestSalary: 200 }],
        isHidden: true,
      },
      {
        id: "hidden-tc-4",
        title: "All Identical Salaries (Must return NULL)",
        description: "Salaries [500, 500, 500] -> only 1 distinct salary, so return NULL",
        setupDdl: [
          "DROP TABLE IF EXISTS Employee;",
          "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
          "INSERT INTO Employee VALUES (1, 500), (2, 500), (3, 500);",
        ],
        expectedOutput: [{ SecondHighestSalary: null }],
        isHidden: true,
      },
    ],
  },

  "department-top-three-salaries": {
    id: "department-top-three-salaries",
    title: "Department Top Three Salaries",
    difficulty: "Hard",
    topic: "Window Functions & DENSE_RANK",
    domain: "sql",
    description: `A company's executives are interested in seeing who earns the most money in each of the company's departments.
A **high earner** in a department is an employee who has a salary in the **top three unique salaries** for that department.

Write a SQL query to find the employees who are high earners in each of the departments.
Return the result table in any order with columns: \`Department\`, \`Employee\`, \`Salary\`.`,
    schemaDdl: `CREATE TABLE Department (id INT PRIMARY KEY, name TEXT);
CREATE TABLE Employee (id INT PRIMARY KEY, name TEXT, salary INT, departmentId INT);`,
    seedDataDml: `INSERT INTO Department VALUES (1, 'IT'), (2, 'Sales');
INSERT INTO Employee VALUES 
  (1, 'Joe', 85000, 1),
  (2, 'Henry', 80000, 2),
  (3, 'Sam', 60000, 2),
  (4, 'Max', 90000, 1),
  (5, 'Janet', 69000, 1),
  (6, 'Randy', 85000, 1),
  (7, 'Will', 70000, 1);`,
    tables: [
      {
        tableName: "Department",
        createDdl: "CREATE TABLE Department (id INT PRIMARY KEY, name TEXT);",
        insertDml: "INSERT INTO Department VALUES (1, 'IT'), (2, 'Sales');",
      },
      {
        tableName: "Employee",
        createDdl: "CREATE TABLE Employee (id INT PRIMARY KEY, name TEXT, salary INT, departmentId INT);",
        insertDml: "INSERT INTO Employee VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);",
      },
    ],
    hints: [
      "Use DENSE_RANK() rather than ROW_NUMBER() or RANK() because ties in salary must share the same rank.",
      "Partition by departmentId and order by salary DESC.",
      "Filter the CTE or subquery where the dense rank <= 3, and join with Department on id = departmentId."
    ],
    referenceSolution: `WITH RankedSalaries AS (
  SELECT 
    d.name AS Department,
    e.name AS Employee,
    e.salary AS Salary,
    DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) AS rnk
  FROM Employee e
  JOIN Department d ON e.departmentId = d.id
)
SELECT Department, Employee, Salary
FROM RankedSalaries
WHERE rnk <= 3;`,
    explanation: `DENSE_RANK() assigns consecutive integer rankings without gaps for duplicate values. Partitioning by \`e.departmentId\` computes per-department ranking independently. Filtering \`rnk <= 3\` retains all employees whose salary falls within the top 3 distinct salary tiers of their department.`,
    testCases: [
      {
        id: "public-tc-1",
        title: "Standard Multi-Department with Salary Ties",
        description: "IT department has Max (90k, rank 1), Joe & Randy (85k, tied rank 2), Will (70k, rank 3). Janet (69k, rank 4) is excluded.",
        setupDdl: [
          "DROP TABLE IF EXISTS Employee;",
          "DROP TABLE IF EXISTS Department;",
          "CREATE TABLE Department (id INT PRIMARY KEY, name TEXT);",
          "CREATE TABLE Employee (id INT PRIMARY KEY, name TEXT, salary INT, departmentId INT);",
          "INSERT INTO Department VALUES (1, 'IT'), (2, 'Sales');",
          "INSERT INTO Employee VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);",
        ],
        expectedOutput: [
          { Department: "IT", Employee: "Max", Salary: 90000 },
          { Department: "IT", Employee: "Joe", Salary: 85000 },
          { Department: "IT", Employee: "Randy", Salary: 85000 },
          { Department: "IT", Employee: "Will", Salary: 70000 },
          { Department: "Sales", Employee: "Henry", Salary: 80000 },
          { Department: "Sales", Employee: "Sam", Salary: 60000 },
        ],
        isHidden: false,
      },
    ],
  },

  "customers-who-never-order": {
    id: "customers-who-never-order",
    title: "Customers Who Never Order",
    difficulty: "Easy",
    topic: "Joins & Anti-Patterns",
    domain: "sql",
    description: `Write a SQL query to report all customers who never order anything.
Return the result table with single column \`Customers\`.

**Table Schema:**
\`\`\`sql
CREATE TABLE Customers (id INT PRIMARY KEY, name TEXT);
CREATE TABLE Orders (id INT PRIMARY KEY, customerId INT);
\`\`\``,
    schemaDdl: `CREATE TABLE Customers (id INT PRIMARY KEY, name TEXT);
CREATE TABLE Orders (id INT PRIMARY KEY, customerId INT);`,
    seedDataDml: `INSERT INTO Customers VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max');
INSERT INTO Orders VALUES (1, 3), (2, 1);`,
    tables: [
      {
        tableName: "Customers",
        createDdl: "CREATE TABLE Customers (id INT PRIMARY KEY, name TEXT);",
        insertDml: "INSERT INTO Customers VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max');",
      },
      {
        tableName: "Orders",
        createDdl: "CREATE TABLE Orders (id INT PRIMARY KEY, customerId INT);",
        insertDml: "INSERT INTO Orders VALUES (1, 3), (2, 1);",
      },
    ],
    hints: [
      "A LEFT JOIN from Customers to Orders where Orders.id IS NULL directly identifies non-ordering customers.",
      "Alternatively, WHERE id NOT IN (SELECT customerId FROM Orders WHERE customerId IS NOT NULL) is also valid."
    ],
    referenceSolution: `SELECT c.name AS Customers
FROM Customers c
LEFT JOIN Orders o ON c.id = o.customerId
WHERE o.id IS NULL;`,
    explanation: `LEFT JOIN preserves every row from Customers. For customers who placed orders, Orders columns contain values; for customers who placed zero orders, Orders columns resolve to NULL. Filtering \`WHERE o.id IS NULL\` precisely retrieves customers with zero order history.`,
    testCases: [
      {
        id: "public-tc-1",
        title: "Standard Customers & Orders",
        description: "Customers Henry (id 2) and Max (id 4) have no orders",
        setupDdl: [
          "DROP TABLE IF EXISTS Customers;",
          "DROP TABLE IF EXISTS Orders;",
          "CREATE TABLE Customers (id INT PRIMARY KEY, name TEXT);",
          "CREATE TABLE Orders (id INT PRIMARY KEY, customerId INT);",
          "INSERT INTO Customers VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max');",
          "INSERT INTO Orders VALUES (1, 3), (2, 1);",
        ],
        expectedOutput: [
          { Customers: "Henry" },
          { Customers: "Max" },
        ],
        isHidden: false,
      },
    ],
  },

  "consecutive-available-seats": {
    id: "consecutive-available-seats",
    title: "Consecutive Active Days",
    difficulty: "Medium",
    topic: "Window Functions & Gaps/Islands",
    domain: "sql",
    description: `Find all logs where user activity was recorded for 3 or more consecutive IDs.
Return column \`id\` ordered by \`id\` ascending.

**Table Schema:**
\`\`\`sql
CREATE TABLE Activity (
  id INT PRIMARY KEY,
  isActive INT
);
\`\`\``,
    schemaDdl: "CREATE TABLE Activity (id INT PRIMARY KEY, isActive INT);",
    seedDataDml: "INSERT INTO Activity VALUES (1, 1), (2, 0), (3, 1), (4, 1), (5, 1);",
    tables: [
      {
        tableName: "Activity",
        createDdl: "CREATE TABLE Activity (id INT PRIMARY KEY, isActive INT);",
        insertDml: "INSERT INTO Activity VALUES (1, 1), (2, 0), (3, 1), (4, 1), (5, 1);",
      },
    ],
    hints: [
      "Use LEAD() and LAG() window functions to inspect preceding and succeeding rows.",
      "A row is part of a consecutive streak of 3 active days if: (prev and next active), or (next and next-next active), or (prev and prev-prev active)."
    ],
    referenceSolution: `WITH Checked AS (
  SELECT 
    id,
    isActive,
    LAG(isActive, 1) OVER (ORDER BY id) AS prev1,
    LAG(isActive, 2) OVER (ORDER BY id) AS prev2,
    LEAD(isActive, 1) OVER (ORDER BY id) AS next1,
    LEAD(isActive, 2) OVER (ORDER BY id) AS next2
  FROM Activity
)
SELECT id
FROM Checked
WHERE isActive = 1
  AND (
    (prev1 = 1 AND prev2 = 1) OR
    (next1 = 1 AND next2 = 1) OR
    (prev1 = 1 AND next1 = 1)
  )
ORDER BY id;`,
    explanation: `Window functions \`LAG\` and \`LEAD\` allow checking adjacent records without self-joins. An active day belongs to an active cluster of size >= 3 if it is preceded by two active days, succeeded by two active days, or flanked on both sides by active days.`,
    testCases: [
      {
        id: "public-tc-1",
        title: "Standard Consecutive Sequence",
        description: "IDs 3, 4, 5 are all active (isActive = 1) -> all 3 belong to cluster >= 3",
        setupDdl: [
          "DROP TABLE IF EXISTS Activity;",
          "CREATE TABLE Activity (id INT PRIMARY KEY, isActive INT);",
          "INSERT INTO Activity VALUES (1, 1), (2, 0), (3, 1), (4, 1), (5, 1);",
        ],
        expectedOutput: [
          { id: 3 },
          { id: 4 },
          { id: 5 },
        ],
        isHidden: false,
      },
    ],
  },
};
