/**
 * app/api/skills/aptitude/route.ts
 * Real Aptitude & Quantitative Reasoning Assessment API.
 * 
 * Supports:
 * 1. GET:
 *    - mode="learn": 19 structured curriculum topics with concepts, worked examples & try-it questions.
 *    - mode="practice": Learning-oriented questions with option randomization & anti-repetition.
 *    - mode="assessment": Placement-oriented timed test question set with balanced blueprint.
 * 2. POST:
 *    - Strict evaluation: unanswered questions never receive points.
 *    - Topic-wise accuracy, time tracking, gate verdicts, and candidate-scoped persistence.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAdaptiveAptitudeQuestions,
  evaluateAptitudeSubmission,
  APTITUDE_CURRICULUM_TOPICS,
  RICH_APTITUDE_QUESTION_BANK
} from "@/lib/skills/aptitude-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get("mode") as any) || "practice";
    const company = searchParams.get("company") || "all";
    const category = searchParams.get("category") || "all";
    const topic = searchParams.get("topic") || "all";
    const difficulty = searchParams.get("difficulty") || "all";
    const count = searchParams.get("count") ? parseInt(searchParams.get("count")!, 10) : undefined;
    const candidateId = searchParams.get("candidateId") || "student-demo";

    // 1. Learn Mode: Curriculum Topics
    if (mode === "learn") {
      return NextResponse.json({
        success: true,
        mode: "learn",
        totalTopics: APTITUDE_CURRICULUM_TOPICS.length,
        topics: APTITUDE_CURRICULUM_TOPICS
      });
    }

    // 2. Practice or Assessment Mode: Fetch Randomized Questions
    const questions = getAdaptiveAptitudeQuestions({
      mode,
      companyTag: company,
      category,
      topic,
      difficulty,
      count,
      candidateId
    });

    return NextResponse.json({
      success: true,
      mode,
      company,
      category,
      topic,
      count: questions.length,
      questions
    });
  } catch (err: any) {
    console.error("Error fetching aptitude questions:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      candidateId = "student-demo",
      answers = {},
      companyTag = "Placement Screening",
      timeSpentSeconds = 0,
      questionIds = [],
      questionKey = {}
    } = body;

    const effectiveQuestionIds = questionIds.length > 0 ? questionIds : Object.keys(answers);

    if (effectiveQuestionIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No questions attempted to evaluate."
      }, { status: 400 });
    }

    const result = evaluateAptitudeSubmission({
      candidateId,
      companyTag,
      timeSpentSeconds,
      questionIds: effectiveQuestionIds,
      answers,
      questionKey
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (err: any) {
    console.error("Error evaluating aptitude answers:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
