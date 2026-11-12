/**
 * tests/recruitment-assessment-intelligence.test.ts
 * 
 * Verifies Phase 3: Assessment Intelligence & Real Sandboxed Execution.
 * Tests Python runner, SQLite execution, Aptitude scoring, and Work Simulation.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateCodingProblem,
  evaluateSqlProblem,
  evaluateAptitudeQuestions,
  evaluateWorkSimulation,
  evaluateStageAssessment,
} from "../lib/recruitment/assessment-runner";

import {
  GOOGLE_OA_PROBLEMS,
  DELOITTE_SQL_PROBLEMS,
  DELOITTE_APTITUDE_QUESTIONS,
  AMAZON_WORK_SIMULATION_SCENARIOS,
  getStageAssessmentBundle,
} from "../lib/recruitment/assessment-problems";

describe("Recruitment Arena Phase 3 — Assessment Intelligence & Sandboxed Execution", () => {
  // ── 1. PYTHON SANDBOXED EXECUTION ─────────────────────────────────────────
  it("executes authentic Python 3 code against Google OA DAG problem with full test suite passing", async () => {
    const problem = GOOGLE_OA_PROBLEMS.find((p) => p.id === "goc_02_dag_max_path")!;
    assert.ok(problem, "Google DAG problem must exist");

    // Correct Python dynamic programming solution
    const workingCode = `
from collections import defaultdict, deque

def max_dag_path(n: int, values: list[int], edges: list[list[int]]) -> int:
    if not values:
        return 0
    adj = defaultdict(list)
    in_degree = [0] * n
    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1
        
    dp = [-float('inf')] * n
    dp[0] = values[0]
    
    # Topological sort (Kahn's algorithm)
    q = deque([i for i in range(n) if in_degree[i] == 0])
    topo = []
    while q:
        u = q.popleft()
        topo.append(u)
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                q.append(v)
                
    for u in topo:
        if dp[u] != -float('inf'):
            for v in adj[u]:
                dp[v] = max(dp[v], dp[u] + values[v])
                
    ans = max([x for x in dp if x != -float('inf')], default=values[0])
    return ans
`;

    const result = await evaluateCodingProblem(problem, workingCode);
    assert.strictEqual(result.passed, true, "Valid solution must pass");
    assert.strictEqual(result.score, 100, "Must achieve 100% score on all test cases");
    assert.strictEqual(result.passedCount, problem.testCases.length);
    assert.ok(result.telemetry.executionTimeMs > 0, "Telemetry must record actual execution time");
  });

  it("detects incorrect algorithmic code and rejects with granular test failure signals", async () => {
    const problem = GOOGLE_OA_PROBLEMS.find((p) => p.id === "goc_02_dag_max_path")!;
    assert.ok(problem);

    // Incorrect implementation returning a wrong constant
    const failingCode = `
def max_dag_path(n: int, values: list[int], edges: list[list[int]]) -> int:
    return -999999
`;

    const result = await evaluateCodingProblem(problem, failingCode);
    assert.strictEqual(result.passed, false, "Buggy code must not pass");
    assert.ok(result.score < 75, "Score must be below passing threshold");
  });

  // ── 2. SQL RELATIONAL SANDBOX EXECUTION ─────────────────────────────────────
  it("executes authentic SQL query against in-memory SQLite and validates against reference solution", async () => {
    const problem = DELOITTE_SQL_PROBLEMS[0];
    assert.ok(problem, "Deloitte SQL problem must exist");

    const validQuery = problem.referenceSql;
    const result = await evaluateSqlProblem(problem, validQuery);

    assert.strictEqual(result.passed, true, "Reference SQL query must pass");
    assert.strictEqual(result.score, 100);
    assert.ok(result.telemetry.userRowCount > 0, "Query must return rows");
  });

  // ── 3. COGNITIVE APTITUDE SCORING ──────────────────────────────────────────
  it("evaluates aptitude questions with negative marking accuracy", () => {
    const questions = DELOITTE_APTITUDE_QUESTIONS;
    assert.strictEqual(questions.length, 2);

    // 1 correct, 1 wrong
    const answers = {
      [questions[0].id]: questions[0].correctOptionIndex,
      [questions[1].id]: 999, // wrong
    };

    const result = evaluateAptitudeQuestions(questions, answers);
    // Raw: 1 - 0.25 = 0.75 out of 2 = 37.5%
    assert.strictEqual(result.correctCount, 1);
    assert.strictEqual(result.score, 37.5);
    assert.strictEqual(result.passed, false);
  });

  // ── 4. WORK SIMULATION SCORING ─────────────────────────────────────────────
  it("evaluates Amazon OA2 work simulation and measures Leadership Principle alignment", () => {
    const scenarios = AMAZON_WORK_SIMULATION_SCENARIOS;
    assert.ok(scenarios.length >= 1);

    const chosen = {
      [scenarios[0].id]: "opt_a", // Customer Obsessed choice
    };

    const result = evaluateWorkSimulation(scenarios, chosen);
    assert.strictEqual(result.passed, true, "Customer Obsessed choice must pass");
    assert.ok(result.lpScores["customer_obsession"] >= 90);
    assert.ok(result.feedback.includes("Customer Obsession"));
  });

  // ── 5. MASTER DISPATCHER ───────────────────────────────────────────────────
  it("dispatches stage assessments seamlessly via master dispatcher", async () => {
    const codingBundle = getStageAssessmentBundle("stage_google_oa");
    assert.ok(codingBundle);

    const dispatchResult = await evaluateStageAssessment("stage_google_oa", {
      code: `
def max_dag_path(n: int, values: list[int], edges: list[list[int]]) -> int:
    return values[0] if values else 0
`,
    });

    assert.ok(dispatchResult.stageId === "stage_google_oa");
    assert.ok(typeof dispatchResult.percentageScore === "number");
    assert.ok(dispatchResult.evaluatorFeedback.length > 0);
  });
});
