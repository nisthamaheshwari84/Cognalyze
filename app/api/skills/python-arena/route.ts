/**
 * app/api/skills/python-arena/route.ts
 *
 * Dedicated REST API for Cognalyze Python Practice & Placement Arena.
 * Endpoints for:
 * - Curriculum browsing (7 Parts, topics, subtopics)
 * - Curated question bank queries & filtering
 * - Sandboxed Python 3 execution & automated test validation
 * - Submission tracking and Student DNA synchronization
 * - Socratic AI hints and execution diagnosis
 * - "Create My Question" and AI natural-language question generation
 * - Topic revision notes and printable PDF generation
 */

import { NextRequest, NextResponse } from "next/server";
import {
  MASTER_PYTHON_CURRICULUM_PARTS,
  getAllPythonSubtopics,
  getPythonSubtopicById,
} from "@/lib/skills/python-arena/python-curriculum-registry";
import {
  queryCuratedQuestions,
  getCuratedQuestionById,
  CURATED_PYTHON_QUESTIONS,
} from "@/lib/skills/python-arena/python-question-bank";
import {
  executePythonChallenge,
  executeRawPythonScript,
} from "@/lib/skills/python-arena/execution-engine";
import {
  recordPythonSubmission,
  recordSubtopicStudied,
  getCandidateSubmissions,
  getCandidatePythonProgress,
} from "@/lib/skills/python-arena/submission-store";
import {
  getProgressiveHint,
  diagnoseCodeAttempt,
} from "@/lib/skills/python-arena/python-mentor-service";
import {
  saveCustomQuestion,
  getCandidatePrivateQuestions,
  generateQuestionsFromPrompt,
} from "@/lib/skills/python-arena/custom-question-service";
import {
  generatePythonRevisionNotes,
  getStudentRevisionNotes,
} from "@/lib/skills/python-arena/notes-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "get_curriculum";
  const candidateId = searchParams.get("candidateId") || "student-demo";

  try {
    if (action === "get_curriculum") {
      return NextResponse.json({
        success: true,
        parts: MASTER_PYTHON_CURRICULUM_PARTS,
        totalSubtopics: getAllPythonSubtopics().length,
      });
    }

    if (action === "get_subtopic") {
      const subtopicId = searchParams.get("subtopicId") || "";
      const subtopic = getPythonSubtopicById(subtopicId);
      return NextResponse.json({
        success: !!subtopic,
        subtopic,
      });
    }

    if (action === "get_questions") {
      const topicId = searchParams.get("topicId") || undefined;
      const subtopicId = searchParams.get("subtopicId") || undefined;
      const partId = searchParams.get("partId") || undefined;
      const difficulty = searchParams.get("difficulty") || undefined;
      const questionType = searchParams.get("questionType") || undefined;
      const company = searchParams.get("company") || undefined;

      const questions = queryCuratedQuestions({
        topicId,
        subtopicId,
        partId,
        difficulty,
        questionType,
        company,
      });

      return NextResponse.json({
        success: true,
        questions,
        total: questions.length,
      });
    }

    if (action === "get_question_by_id") {
      const questionId = searchParams.get("questionId") || "";
      let question = getCuratedQuestionById(questionId);

      // Check private questions if not in public bank
      if (!question) {
        const privates = getCandidatePrivateQuestions(candidateId);
        question = privates.find((q) => q.id === questionId);
      }

      if (!question) {
        return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        question,
      });
    }

    if (action === "get_progress") {
      const progress = getCandidatePythonProgress(candidateId);
      return NextResponse.json({
        success: true,
        progress,
      });
    }

    if (action === "get_submissions") {
      const questionId = searchParams.get("questionId") || undefined;
      const submissions = getCandidateSubmissions(candidateId, questionId);
      return NextResponse.json({
        success: true,
        submissions,
      });
    }

    if (action === "get_custom_questions") {
      const customQuestions = getCandidatePrivateQuestions(candidateId);
      return NextResponse.json({
        success: true,
        customQuestions,
      });
    }

    if (action === "get_revision_notes") {
      const notes = getStudentRevisionNotes(candidateId);
      return NextResponse.json({
        success: true,
        notes,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || "execute_code";
    const candidateId = body.candidateId || "student-demo";

    // 1. EXECUTE CODE (RUN SAMPLE TESTS OR FULL SUBMISSION)
    if (action === "execute_code") {
      const { code, questionId, mode = "submit", isAssisted = false, hintsUsedCount = 0 } = body;

      let question = getCuratedQuestionById(questionId);
      if (!question) {
        const privates = getCandidatePrivateQuestions(candidateId);
        question = privates.find((q) => q.id === questionId);
      }

      // If standalone raw script execution
      if (!question || !question.entryFunction) {
        const rawRes = await executeRawPythonScript(code, body.stdinInput || "");
        return NextResponse.json({
          success: rawRes.success,
          result: rawRes,
        });
      }

      // If sample run: run only public test cases
      // If submit: run public + hidden test cases
      const testCasesToRun =
        mode === "run_samples"
          ? question.publicTestCases
          : [...question.publicTestCases, ...question.hiddenTestCases];

      const execResult = await executePythonChallenge(
        code,
        question.entryFunction,
        testCasesToRun
      );

      // Persist submission and sync to Student DNA if in submit mode
      let syncData: any = null;
      if (mode === "submit") {
        syncData = await recordPythonSubmission({
          candidateId,
          questionId,
          code,
          execResult,
          isAssisted,
          hintsUsedCount,
        });
      }

      return NextResponse.json({
        success: execResult.success,
        result: execResult,
        submission: syncData?.submission,
        dnaSyncSuccess: syncData?.dnaSyncSuccess,
        dnaRecommendation: syncData?.dnaRecommendation,
      });
    }

    // 2. SOCRATIC PROGRESSIVE HINT
    if (action === "get_hint") {
      const { questionId, requestedTier } = body;
      const hint = getProgressiveHint(questionId, requestedTier || 1);
      return NextResponse.json({
        success: true,
        hint,
      });
    }

    // 3. CODE DIAGNOSIS (ROOT CAUSE & COMPLEXITY)
    if (action === "diagnose_code") {
      const { questionId, code, execResult } = body;
      const diagnosis = diagnoseCodeAttempt(questionId, code, execResult);
      return NextResponse.json({
        success: true,
        diagnosis,
      });
    }

    // 4. CREATE CUSTOM QUESTION
    if (action === "create_custom_question") {
      const saved = saveCustomQuestion(candidateId, body.payload);
      return NextResponse.json({
        success: true,
        question: saved,
      });
    }

    // 5. NATURAL LANGUAGE AI GENERATE QUESTIONS
    if (action === "generate_ai_questions") {
      const { prompt } = body;
      const genResult = generateQuestionsFromPrompt(candidateId, prompt || "Create 3 intermediate Python questions");
      return NextResponse.json({
        success: true,
        ...genResult,
      });
    }

    // 6. GENERATE REVISION NOTES
    if (action === "generate_notes") {
      const { subtopicId, mode } = body;
      const doc = generatePythonRevisionNotes(candidateId, subtopicId, mode || "quick_revision");
      return NextResponse.json({
        success: true,
        document: doc,
      });
    }

    // 7. MARK SUBTOPIC STUDIED
    if (action === "mark_subtopic_studied") {
      const { subtopicId } = body;
      recordSubtopicStudied(candidateId, subtopicId);
      return NextResponse.json({
        success: true,
        studied: true,
      });
    }

    return NextResponse.json({ success: false, error: `Invalid POST action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Internal error" }, { status: 500 });
  }
}
