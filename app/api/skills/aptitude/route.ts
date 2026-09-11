import { NextRequest, NextResponse } from "next/server";
import { skillHubStore, AptitudeQuestion } from "@/lib/skill-hub-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company") || "all";
    const category = searchParams.get("category");

    let questions = skillHubStore.getAptitudeQuestions(company);

    if (category && category !== "all") {
      questions = questions.filter(q => q.category === category);
    }

    return NextResponse.json({
      success: true,
      company,
      category: category || "all",
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
    const { candidateId = "student-demo", answers = {}, companyTag = "TCS NQT", timeSpentSeconds = 0 } = body;

    const allQuestions = skillHubStore.getAptitudeQuestions(companyTag === "all" ? undefined : companyTag);

    let correctCount = 0;
    const itemAnalysis: Array<{
      questionId: string;
      category: string;
      topic: string;
      userAnswerIndex: number | null;
      correctAnswerIndex: number;
      isCorrect: boolean;
      explanation: string;
      shortcutTip?: string;
    }> = [];

    const categoryScores: Record<string, { total: number; correct: number }> = {};

    allQuestions.forEach(q => {
      const userAns = answers[q.id] !== undefined ? Number(answers[q.id]) : null;
      const isCorrect = userAns === q.correct_option_index;

      if (isCorrect) correctCount++;

      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, correct: 0 };
      }
      categoryScores[q.category].total++;
      if (isCorrect) {
        categoryScores[q.category].correct++;
      }

      itemAnalysis.push({
        questionId: q.id,
        category: q.category,
        topic: q.topic,
        userAnswerIndex: userAns,
        correctAnswerIndex: q.correct_option_index,
        isCorrect,
        explanation: q.explanation,
        shortcutTip: q.shortcut_tip
      });
    });

    const totalQuestions = allQuestions.length || 1;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Gate qualification calculation based on company target
    let gateStatus: "passed" | "borderline" | "eliminated" = "eliminated";
    let cutoffThreshold = 65; // standard mass threshold

    if (companyTag.includes("Digital") || companyTag.includes("Elite")) {
      cutoffThreshold = 75;
    }

    if (percentage >= cutoffThreshold) {
      gateStatus = "passed";
    } else if (percentage >= cutoffThreshold - 15) {
      gateStatus = "borderline";
    } else {
      gateStatus = "eliminated";
    }

    const resultPayload = {
      candidateId,
      companyTag,
      totalQuestions,
      correctCount,
      percentage,
      cutoffThreshold,
      gateStatus,
      gateVerdict:
        gateStatus === "passed"
          ? "🎉 Aptitude Gate Cleared! Cleared for Basic Coding Round."
          : gateStatus === "borderline"
          ? "⚠️ Borderline Score. High risk of elimination in mass screening."
          : "❌ Mass Elimination: Missed Cutoff. Coding round is locked.",
      categoryScores,
      timeSpentSeconds,
      itemAnalysis
    };

    skillHubStore.recordAptitudeSubmission(candidateId, resultPayload);

    return NextResponse.json({
      success: true,
      result: resultPayload
    });
  } catch (err: any) {
    console.error("Error evaluating aptitude answers:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
