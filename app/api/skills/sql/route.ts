import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  executeSqlQuery,
  CANONICAL_SQL_PROBLEMS,
} from "@/lib/skills/sql-code-runner";
import { recordCompetencyEvidence } from "@/lib/skills/placement-profile-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get("problemId");

  if (problemId) {
    const problem = CANONICAL_SQL_PROBLEMS[problemId];
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      problem: {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.topic,
        domain: problem.domain,
        description: problem.description,
        schemaDdl: problem.schemaDdl,
        tables: problem.tables,
        hints: problem.hints,
        testCases: problem.testCases.map(tc => ({
          id: tc.id,
          title: tc.title,
          description: tc.description,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden
        }))
      }
    });
  }

  // List all canonical SQL problems
  const list = Object.values(CANONICAL_SQL_PROBLEMS).map(p => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    topic: p.topic,
    testCaseCount: p.testCases.length
  }));

  return NextResponse.json({ success: true, problems: list });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const userId = auth?.user?.id || "guest";

    const body = await req.json();
    const { action, problemId, query } = body;

    if (!problemId || !query) {
      return NextResponse.json(
        { error: "problemId and query are required." },
        { status: 400 }
      );
    }

    const isSubmit = action === "submit";
    const result = await executeSqlQuery(problemId, query, {
      runHiddenTests: isSubmit,
    });

    // If candidate submitted and passed all tests, elevate competency evidence in Placement Profile!
    if (isSubmit && result.allPassed && userId !== "guest") {
      recordCompetencyEvidence(
        userId,
        "sql_window_functions",
        "code_demonstrated",
        95,
        `Passed all public and hidden test cases for SQL problem: ${problemId}`
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error("POST /api/skills/sql error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute SQL query." },
      { status: 500 }
    );
  }
}
