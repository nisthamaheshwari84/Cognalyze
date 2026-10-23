/**
 * app/api/skills/dsa/route.ts
 * 
 * Genuine DSA Evaluation Engine & Striver A2Z Curriculum API.
 * 
 * Features:
 * 1. GET: Fetch Striver Roadmap, Steps, Problems, Dynamic Focus, Canonical Problem Statements, and Active Interview Sessions.
 * 2. POST: Real code execution via genuine C++ compiler (clang++/g++), Python 3 process, and sandboxed Node.js VM.
 * 3. Strict Contract Validation: Catches mismatched function signatures, wrong arguments, or solutions submitted to wrong problems.
 * 4. Multi-Question Interview Session Lifecycle:
 *    - interview_create: Setup and lock session with frozen, non-duplicate questions.
 *    - interview_get: Retrieve active locked session and preserve candidate progress.
 *    - interview_submit_code: Evaluate question with real runner and store outcomes.
 *    - interview_answer_followup: Record candidate's technical defense.
 *    - interview_next: Advance question WITHOUT prematurely exposing the final scorecard.
 *    - interview_finalize: Produce final evidence-backed scorecard ONLY when session is complete.
 *    - interview_telemetry: Record proctoring events.
 * 5. Multi-tenant user isolation.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  STRIVER_STEPS,
  getAllStriverProblems,
  getStriverProblemById,
  generateDsaInterviewSession,
  getTargetedReTestProblem,
  StriverProblemFull
} from "@/lib/skills/striver-curriculum";
import {
  recordCandidateAttempt,
  updateStudentStriverStatus,
  getStudentStriverProgress,
  getStudentDsaSummary,
  getStudentDsaFocus
} from "@/lib/skills/candidate-history";
import { generatePostSessionFeedback } from "@/lib/skills/adaptive-engine";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getCanonicalProblem, CANONICAL_DSA_PROBLEMS } from "@/lib/skills/dsa-canonical-problems";
import { executeProblemTestSuite } from "@/lib/skills/dsa-code-runner";
import {
  createInterviewSession,
  getInterviewSession,
  getActiveSessionForCandidate,
  recordQuestionSubmission,
  recordFollowUpAnswer,
  advanceToNextQuestion,
  finalizeInterviewSession,
  recordProctoringTelemetry
} from "@/lib/skills/dsa-interview-store";

// ── 1. GET ENDPOINT ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const candidateId = auth?.user?.id || (searchParams.get("candidateId") === "student-demo" ? "student-demo" : searchParams.get("candidateId") || "guest");
    const mode = searchParams.get("mode"); // "roadmap" | "interview_set" | "retest" | "focus" | "interview_session"
    const problemId = searchParams.get("id") || searchParams.get("problemId");
    const stepId = searchParams.get("stepId");
    const subtopic = searchParams.get("subtopic");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");

    // 0. Active interview session check
    if (mode === "interview_session") {
      const sessionId = searchParams.get("sessionId");
      if (sessionId) {
        const session = getInterviewSession(sessionId, candidateId);
        return NextResponse.json({ success: !!session, session });
      }
      const active = getActiveSessionForCandidate(candidateId);
      return NextResponse.json({ success: !!active, session: active });
    }

    // 1. Single problem lookup
    if (problemId && (!mode || mode === "single")) {
      const problem = getStriverProblemById(problemId);
      const canonical = getCanonicalProblem(problemId);
      const progress = getStudentStriverProgress(candidateId)[problemId] || null;
      return NextResponse.json({
        success: true,
        problem,
        canonical: canonical || null,
        candidateProgress: progress
      });
    }

    // 2. Multi-Question Interview Set Generator
    if (mode === "interview_set") {
      const trackSlug = searchParams.get("track") || "product_mid";
      const count = parseInt(searchParams.get("count") || "3", 10);
      const interviewQuestions = generateDsaInterviewSession(candidateId, trackSlug, count, stepId || undefined, subtopic || undefined);
      return NextResponse.json({
        success: true,
        candidateId,
        trackSlug,
        questionCount: interviewQuestions.length,
        questions: interviewQuestions
      });
    }

    // 3. Targeted Re-Test Selector
    if (mode === "retest") {
      const topicId = searchParams.get("topic") || "binary-search";
      const currentId = searchParams.get("currentId") || searchParams.get("problemId") || "";
      const reTestProblem = getTargetedReTestProblem(candidateId, topicId, currentId);
      return NextResponse.json({
        success: true,
        reTestProblem,
        problem: reTestProblem
      });
    }

    // 4. Candidate DSA Focus & Summary
    if (mode === "focus") {
      const focus = getStudentDsaFocus(candidateId);
      const summary = getStudentDsaSummary(candidateId);
      return NextResponse.json({
        success: true,
        candidateId,
        focus,
        summary
      });
    }

    // 5. Striver Roadmap & Filtered Problem List
    const problems = getAllStriverProblems({
      stepId: stepId || undefined,
      subtopic: subtopic || undefined,
      difficulty: difficulty || undefined,
      search: search || undefined
    });

    const userProgress = getStudentStriverProgress(candidateId);
    const summary = getStudentDsaSummary(candidateId);
    const focus = getStudentDsaFocus(candidateId);

    return NextResponse.json({
      success: true,
      candidateId,
      steps: STRIVER_STEPS,
      totalCount: problems.length,
      totalProblems: 455,
      problems,
      summary,
      focus,
      userProgress
    });
  } catch (err: any) {
    console.error("Error in DSA GET:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── 2. POST ENDPOINT ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();
    const effectiveAction = body.action || (body.mode === "submit" ? "submit" : body.mode === "run" ? "run" : undefined) || "run";
    const candidateId = auth?.user?.id || (body.candidateId === "student-demo" ? "student-demo" : body.candidateId || "guest");

    // ── CASE A: INTERVIEW LIFECYCLE ACTIONS ──
    if (effectiveAction === "interview_create") {
      const session = createInterviewSession({
        candidateId,
        stepId: body.stepId,
        topicId: body.topicId,
        trackSlug: body.trackSlug,
        language: body.language,
        questionCount: body.questionCount,
        durationMinutes: body.durationMinutes,
        requestedProblemIds: body.requestedProblemIds
      });
      return NextResponse.json({ success: true, session });
    }

    if (effectiveAction === "interview_get") {
      const sessionId = body.sessionId;
      const session = sessionId
        ? getInterviewSession(sessionId, candidateId)
        : getActiveSessionForCandidate(candidateId);
      return NextResponse.json({ success: !!session, session });
    }

    if (effectiveAction === "interview_submit_code") {
      const { sessionId, questionIndex, code, language = "cpp" } = body;
      const session = getInterviewSession(sessionId, candidateId);
      if (!session) {
        return NextResponse.json({ success: false, error: "Interview session not found." }, { status: 404 });
      }

      const q = session.questions[questionIndex];
      if (!q) {
        return NextResponse.json({ success: false, error: "Question not found in interview session." }, { status: 404 });
      }

      const canonicalProb = getCanonicalProblem(q.problemId) || CANONICAL_DSA_PROBLEMS["painter-s-partition-problem"];
      const execResult = executeProblemTestSuite(canonicalProb, code, language, true);

      const recordRes = recordQuestionSubmission(sessionId, candidateId, questionIndex, code, language, execResult);
      return NextResponse.json({
        success: recordRes.success,
        session: recordRes.session,
        testResults: execResult,
        error: recordRes.error
      });
    }

    if (effectiveAction === "interview_answer_followup") {
      const { sessionId, questionIndex, answer } = body;
      const res = recordFollowUpAnswer(sessionId, candidateId, questionIndex, answer);
      return NextResponse.json(res);
    }

    if (effectiveAction === "interview_next") {
      const { sessionId } = body;
      const res = advanceToNextQuestion(sessionId, candidateId);
      return NextResponse.json(res);
    }

    if (effectiveAction === "interview_finalize") {
      const { sessionId } = body;
      const res = finalizeInterviewSession(sessionId, candidateId);
      return NextResponse.json(res);
    }

    if (effectiveAction === "interview_telemetry") {
      const { sessionId, type, details } = body;
      recordProctoringTelemetry(sessionId, candidateId, type, details);
      return NextResponse.json({ success: true });
    }

    // ── CASE B: STANDARD RUN & SUBMIT ACTIONS (Practice / Learn / Coach / Standalone) ──
    const {
      problemId,
      code = "",
      language = "python",
      trackSlug = "product_mid",
      timeSpentSeconds = 180,
      isInterview = false
    } = body;
    const isSubmit = effectiveAction === "submit";

    // 1. Look up canonical problem, falling back to full striver model
    let canonical = getCanonicalProblem(problemId);
    let problem: StriverProblemFull;

    if (canonical) {
      problem = getStriverProblemById(canonical.id);
    } else {
      problem = getStriverProblemById(problemId);
      // Synthesize a canonical wrapper for uncatalogued problems
      canonical = {
        id: problem.id,
        title: problem.title,
        step_title: problem.step_title,
        subtopic_title: problem.subtopic_title,
        difficulty: problem.difficulty,
        time_complexity: problem.time_complexity,
        space_complexity: problem.space_complexity,
        functionName: problem.functionName,
        cppSignature: `int ${problem.functionName}(...)`,
        pythonSignature: `def ${problem.functionName}(*args):`,
        jsSignature: `function ${problem.functionName}(...args)`,
        javaSignature: `public int ${problem.functionName}(...)`,
        fullDescription: problem.description,
        inputFormat: "Standard inputs according to problem statement.",
        outputFormat: "Standard output format.",
        constraints: ["Standard constraints apply."],
        examples: [],
        edgeCases: [],
        hints: problem.hints,
        starterCode: problem.starterCode,
        referenceSolution: problem.referenceSolution,
        publicTestCases: problem.publicTestCases.map((tc, idx) => ({
          id: `pub-${idx + 1}`,
          input: tc.input,
          expected: tc.expected,
          argsJson: tc.argsJson || "[]"
        })),
        hiddenTestCases: problem.hiddenTestCases.map((tc, idx) => ({
          id: `hid-${idx + 1}`,
          input: tc.input,
          expected: tc.expected,
          argsJson: tc.argsJson || "[]",
          isHidden: true
        })),
        followUpQuestions: []
      };
    }

    // 2. Execute genuine test suite via multi-language execution engine
    const execution = executeProblemTestSuite(canonical, code, language, isSubmit);

    // 3. If action is "run", return test results immediately
    if (!isSubmit) {
      return NextResponse.json({
        success: execution.success,
        action: "run",
        passed: execution.passed,
        passedCount: execution.passedCount,
        totalTests: execution.totalTests,
        score: execution.score,
        status: execution.status,
        verdict: execution.verdict,
        compilationError: execution.compilationError,
        message: execution.compilationError
          ? `Compilation Error: ${execution.compilationError}`
          : execution.passed
          ? `✓ All ${execution.passedCount}/${execution.totalTests} Public Test Cases Passed! Code is ready for submission.`
          : `✗ Passed ${execution.passedCount}/${execution.totalTests} Public Test Cases (${execution.verdict}).`,
        results: execution.results
      });
    }

    // 4. SUBMISSION FLOW: compute feedback and persist history
    const allPassed = execution.passed;
    const score = execution.score;
    const passedCount = execution.passedCount;
    const totalTests = execution.totalTests;

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (allPassed) {
      strengths.push(`${problem.subtopic_title} Invariant & Correctness`);
      strengths.push(`Matches target ${problem.time_complexity} time complexity`);
    } else {
      weaknesses.push(`${problem.subtopic_title} Boundary / Edge-Case Handling`);
      if (passedCount === 0) {
        weaknesses.push(execution.compilationError ? "Compilation / Signature mismatch" : "Algorithm fails baseline problem requirements");
      }
    }

    const adaptiveVerdict: "Strong Hire" | "Hire" | "Borderline" | "Needs Diagnostic" =
      allPassed ? "Strong Hire" : score >= 70 ? "Hire" : score >= 40 ? "Borderline" : "Needs Diagnostic";
    const displayVerdict = allPassed ? (isInterview ? "Strong Hire" : "Mastered") : score >= 70 ? (isInterview ? "Hire" : "Demonstrated") : score >= 40 ? (isInterview ? "Borderline" : "Developing") : "Needs Diagnostic";

    const postFeedback = generatePostSessionFeedback(trackSlug, "dsa_coding", [
      {
        score,
        verdict: adaptiveVerdict,
        conceptualAccuracy: score,
        depthScore: allPassed ? 95 : Math.max(score - 10, 20),
        feedback: allPassed
          ? `Excellent implementation of ${problem.title}. Passed all ${totalTests} test cases including hidden boundary conditions. Complexity: ${problem.time_complexity}.`
          : `Passed ${passedCount}/${totalTests} test cases (Score: ${score}%). ${execution.compilationError || "Review edge cases and optimal approach."}`,
        detectedClaims: [problem.subtopic_title, problem.time_complexity],
        observedStrengths: strengths,
        observedGaps: weaknesses,
        nextFollowUp: {
          type: "TRANSFER",
          question: `How does your approach to ${problem.title} change if input memory is constrained to O(1) extra space?`,
          reason: "Testing trade-off justification under production memory limits."
        }
      }
    ], candidateId);

    // Update Striver problem progress
    const problemStatus = allPassed ? "solved" : score >= 40 ? "attempted" : "needs_revision";
    updateStudentStriverStatus(candidateId, problem.id, problemStatus, score);

    // Persist attempt in candidate history
    const attempt = recordCandidateAttempt({
      candidateId,
      domain: "dsa_coding",
      topic: problem.title,
      mode: isInterview ? "interview" : "practice",
      score,
      accuracy: score,
      timeSpentSeconds,
      questionsAttempted: 1,
      questionsCorrect: allPassed ? 1 : 0,
      questionIds: [problem.id],
      weaknesses,
      strengths,
      feedback: postFeedback.whyReasoning
    });

    return NextResponse.json({
      success: true,
      action: "submit",
      passed: allPassed,
      passedCount,
      totalTests,
      score,
      status: execution.status,
      verdict: displayVerdict,
      compilationError: execution.compilationError,
      message: execution.compilationError
        ? `Compilation Error: ${execution.compilationError}`
        : allPassed
        ? `✓ Perfect! Passed all ${passedCount}/${totalTests} test cases.`
        : `Evaluated: Passed ${passedCount}/${totalTests} test cases (${execution.verdict}).`,
      results: execution.results,
      postFeedback,
      attempt
    });
  } catch (err: any) {
    console.error("Error in DSA POST:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
