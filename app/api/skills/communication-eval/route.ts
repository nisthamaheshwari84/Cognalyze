import { NextRequest, NextResponse } from "next/server";
import {
  COMMUNICATION_LESSONS,
  COMMUNICATION_QUESTION_BANK,
  getAdaptiveCommunicationQuestion,
  evaluateCommunicationResponse,
  generateInterviewFollowup,
  generateFullInterviewReport,
  CommunicationCategory
} from "@/lib/skills/communication-engine";
import { getCandidateAttempts } from "@/lib/skills/candidate-history";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "questions";
    const category = (searchParams.get("category") as CommunicationCategory | "all") || "all";
    const candidateId = searchParams.get("candidateId") || "student-demo";

    // 1. Learn Mode: Return 10 Structured Placement Lessons
    if (mode === "learn") {
      return NextResponse.json({
        success: true,
        mode: "learn",
        lessons: COMMUNICATION_LESSONS
      });
    }

    // 2. Candidate History & Skill Progress
    if (mode === "history") {
      const attempts = getCandidateAttempts(candidateId, "communication_english");
      const categoryScores: Record<string, { total: number; sum: number }> = {};

      attempts.forEach(a => {
        const cat = a.topic || "General";
        if (!categoryScores[cat]) categoryScores[cat] = { total: 0, sum: 0 };
        categoryScores[cat].total += 1;
        categoryScores[cat].sum += a.score;
      });

      const progress = Object.entries(categoryScores).map(([topic, data]) => ({
        topic,
        attempts: data.total,
        avgScore: Math.round(data.sum / data.total)
      }));

      return NextResponse.json({
        success: true,
        mode: "history",
        totalAttempts: attempts.length,
        attempts: attempts.slice(0, 20),
        progress
      });
    }

    // 3. Question Bank Mode: Return Adaptive Questions
    if (mode === "single") {
      const q = getAdaptiveCommunicationQuestion({
        category,
        candidateId
      });
      return NextResponse.json({
        success: true,
        question: q
      });
    }

    // Return full question bank filtered by category
    let pool = [...COMMUNICATION_QUESTION_BANK];
    if (category && category !== "all") {
      pool = pool.filter(q => q.category === category);
    }

    return NextResponse.json({
      success: true,
      mode: "questions",
      category,
      count: pool.length,
      questions: pool
    });
  } catch (err: any) {
    console.error("Error in communication GET:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "evaluate",
      candidateId = "student-demo",
      questionId,
      promptId, // for backwards compatibility
      spokenText,
      durationSeconds = 60,
      interviewHistory = [],
      turnNumber = 0
    } = body;

    const effectiveQId = questionId || promptId || "comm-intro-1";

    // Action 1: Dynamic Next Turn in Interview
    if (action === "interview_next") {
      if (!spokenText || spokenText.trim().length < 5) {
        return NextResponse.json(
          { success: false, error: "Please provide a valid verbal or typed response." },
          { status: 400 }
        );
      }

      const followup = await generateInterviewFollowup({
        interviewHistory,
        currentResponse: spokenText,
        turnNumber
      });

      return NextResponse.json({
        success: true,
        ...followup
      });
    }

    // Action 2: End-of-Interview Diagnostic Report
    if (action === "interview_finish") {
      const report = await generateFullInterviewReport({
        candidateId,
        interviewHistory
      });

      return NextResponse.json({
        success: true,
        report
      });
    }

    // Action 3: Practice & Coach Evidence-First Evaluation
    if (!spokenText || spokenText.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a meaningful response (at least 10 characters)." },
        { status: 400 }
      );
    }

    const report = await evaluateCommunicationResponse({
      candidateId,
      questionId: effectiveQId,
      spokenText,
      durationSeconds
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (err: any) {
    console.error("Error in communication POST evaluation:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
