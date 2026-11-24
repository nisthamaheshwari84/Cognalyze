import { NextRequest, NextResponse } from "next/server";
import {
  evaluateFreeTextExplanation,
  FreeTextEvaluationRequest
} from "@/lib/skills/learn/socratic-evaluator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { microConceptId, userExplanation, language = "en" } = body;

    if (!microConceptId) {
      return NextResponse.json(
        { error: "Missing required parameter: microConceptId" },
        { status: 400 }
      );
    }

    if (!userExplanation || typeof userExplanation !== "string" || userExplanation.trim().length === 0) {
      return NextResponse.json(
        { error: "userExplanation must be a non-empty string" },
        { status: 400 }
      );
    }

    const payload: FreeTextEvaluationRequest = {
      microConceptId,
      userExplanation: userExplanation.trim(),
      language: language === "hinglish" ? "hinglish" : "en"
    };

    const evaluation = await evaluateFreeTextExplanation(payload);
    return NextResponse.json(evaluation);
  } catch (err: any) {
    console.error("[POST /api/learn/evaluate-answer] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to evaluate concept explanation" },
      { status: 500 }
    );
  }
}
