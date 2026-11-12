/**
 * app/api/recruitment/assessments/evaluate/route.ts
 * 
 * Modular Assessment Evaluation API.
 * POST: Runs candidate submissions through genuine sandboxed engines
 * (Python runner, SQLite engine, Aptitude evaluator, Work Simulation).
 */

import { NextRequest, NextResponse } from "next/server";
import { evaluateStageAssessment } from "@/lib/recruitment/assessment-runner";
import { getStageAssessmentBundle } from "@/lib/recruitment/assessment-problems";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stageId, submissionData } = body;

    if (!stageId) {
      return NextResponse.json({ error: "'stageId' is required." }, { status: 400 });
    }

    const evaluation = await evaluateStageAssessment(stageId, submissionData || {});
    return NextResponse.json({ success: true, evaluation });
  } catch (err: any) {
    console.error("[POST /api/recruitment/assessments/evaluate] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to evaluate assessment submission." },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stageId = searchParams.get("stageId");

    if (!stageId) {
      return NextResponse.json({ error: "'stageId' query parameter required." }, { status: 400 });
    }

    const bundle = getStageAssessmentBundle(stageId);
    if (!bundle) {
      return NextResponse.json({ error: `No assessment found for stage '${stageId}'.` }, { status: 404 });
    }

    // Mask hidden test cases and correct options for security
    const sanitized = {
      ...bundle,
      codingProblems: bundle.codingProblems?.map((p) => ({
        ...p,
        testCases: p.testCases.map((tc) =>
          tc.isHidden ? { id: tc.id, isHidden: true, description: "Hidden test case" } : tc
        ),
      })),
      sqlProblems: bundle.sqlProblems?.map((p) => ({
        ...p,
        referenceSql: undefined, // Do not expose reference SQL
      })),
      aptitudeQuestions: bundle.aptitudeQuestions?.map((q) => ({
        ...q,
        correctOptionIndex: undefined, // Do not expose correct answers
        explanation: undefined,
      })),
    };

    return NextResponse.json({ success: true, bundle: sanitized });
  } catch (err: any) {
    console.error("[GET /api/recruitment/assessments/evaluate] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve assessment bundle." },
      { status: 500 }
    );
  }
}

