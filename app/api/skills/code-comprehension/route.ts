/**
 * app/api/skills/code-comprehension/route.ts
 * 
 * Unified API Route for Cognalyze Code Comprehension Lab.
 * Supports challenge discovery, codebase library exploration, workspace session management,
 * file retrieval, sandboxed test execution, AI engineering tutor, interactive checkpoints,
 * senior engineer interview simulation, and 100-point rubric assessment.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  getAllChallenges,
  getChallengeById,
  getChallengesByMode,
  getCheckpointsByChallengeId,
  getInterviewStagesByChallengeId,
  ComprehensionMode,
} from "@/lib/skills/code-comprehension/challenge-factory";
import {
  getAllCodebases,
  getCodebaseById,
  getCodebaseFileTree,
  getCodebaseFileContent,
  searchCodebaseContent,
  filterCodebases,
} from "@/lib/skills/code-comprehension/codebase-library";
import {
  createComprehensionSession,
  getComprehensionSession,
  getActiveSessionForCandidate,
  updateSessionFile,
  recordSessionEvent,
  appendTutorMessage,
  completeComprehensionSession,
} from "@/lib/skills/code-comprehension/session-store";
import { executeSandboxTests } from "@/lib/skills/code-comprehension/execution-sandbox";
import { askEngineeringTutor } from "@/lib/skills/code-comprehension/tutor-engine";
import { evaluateComprehensionSubmission } from "@/lib/skills/code-comprehension/assessment-engine";
import { syncComprehensionAssessmentToDNA } from "@/lib/skills/code-comprehension/dna-adapter";

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET HANDLER: Challenges, Codebases & Session Lookups
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const candidateId = auth?.user?.id || searchParams.get("candidateId") || "student-demo";
    const mode = searchParams.get("mode") as ComprehensionMode | null;
    const challengeId = searchParams.get("challengeId");
    const sessionId = searchParams.get("sessionId");
    const view = searchParams.get("view"); // "codebases" | "challenges"

    // A. Codebase Library Catalog
    if (view === "codebases") {
      const category = searchParams.get("category") || undefined;
      const difficulty = searchParams.get("difficulty") || undefined;
      const language = searchParams.get("language") || undefined;

      const codebases = filterCodebases({
        category: category as any,
        difficulty: difficulty as any,
        language,
      });

      return NextResponse.json({
        success: true,
        count: codebases.length,
        codebases,
      });
    }

    // B. Active session lookup
    if (sessionId) {
      const session = getComprehensionSession(sessionId, candidateId);
      if (!session) {
        return NextResponse.json({ success: false, error: "Session not found or access denied." }, { status: 404 });
      }
      const challenge = getChallengeById(session.challengeId);
      const codebase = challenge ? getCodebaseById(challenge.codebaseId) : null;
      const checkpoints = challenge ? getCheckpointsByChallengeId(challenge.id) : [];
      const interviewStages = challenge ? getInterviewStagesByChallengeId(challenge.id) : [];

      return NextResponse.json({
        success: true,
        session,
        challenge,
        codebase,
        checkpoints,
        interviewStages,
      });
    }

    // C. Single challenge metadata + file tree
    if (challengeId) {
      const challenge = getChallengeById(challengeId);
      if (!challenge) {
        return NextResponse.json({ success: false, error: "Challenge not found." }, { status: 404 });
      }
      const codebase = getCodebaseById(challenge.codebaseId);
      const fileTree = getCodebaseFileTree(challenge.codebaseId);
      const activeSession = getActiveSessionForCandidate(candidateId, challengeId);
      const checkpoints = getCheckpointsByChallengeId(challengeId);
      const interviewStages = getInterviewStagesByChallengeId(challengeId);

      return NextResponse.json({
        success: true,
        challenge,
        codebase,
        fileTree,
        activeSession,
        checkpoints,
        interviewStages,
      });
    }

    // D. List eligible challenges + all available codebases
    const challenges = mode ? getChallengesByMode(mode) : getAllChallenges();
    const codebases = getAllCodebases();

    return NextResponse.json({
      success: true,
      count: challenges.length,
      challenges,
      codebases,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST HANDLER: Sessions, Files, Checkpoints, Interview & Assessments
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();
    const candidateId = auth?.user?.id || body.candidateId || "student-demo";
    const action = body.action as string;

    // Action A: Start new practice session
    if (action === "start_session") {
      const { challengeId, practiceMode } = body;
      const session = createComprehensionSession({
        candidateId,
        challengeId,
        practiceMode: practiceMode || "practice",
      });
      return NextResponse.json({ success: true, session });
    }

    // Action B: Read file content (overlaying session workingFiles if edited)
    if (action === "get_file") {
      const { sessionId, filePath } = body;
      const session = getComprehensionSession(sessionId, candidateId);
      if (!session) {
        return NextResponse.json({ success: false, error: "Session not found." }, { status: 404 });
      }

      const workingContent = session.workingFiles[filePath];
      const content = workingContent !== undefined
        ? workingContent
        : getCodebaseFileContent(session.codebaseId, filePath);

      recordSessionEvent({
        sessionId,
        candidateId,
        eventType: "file_open",
        payload: { filePath },
      });

      return NextResponse.json({ success: true, filePath, content });
    }

    // Action C: Save file edits (overlay in working files)
    if (action === "save_file") {
      const { sessionId, filePath, content } = body;
      const updated = updateSessionFile({
        sessionId,
        candidateId,
        filePath,
        content,
      });
      return NextResponse.json({ success: updated });
    }

    // Action D: Search codebase
    if (action === "search") {
      const { codebaseId, query } = body;
      const results = searchCodebaseContent(codebaseId, query || "");
      return NextResponse.json({ success: true, results });
    }

    // Action E: Filter Codebases
    if (action === "filter_codebases") {
      const { category, difficulty, language } = body;
      const codebases = filterCodebases({ category, difficulty, language });
      return NextResponse.json({ success: true, codebases });
    }

    // Action F: Run sandboxed tests
    if (action === "run_tests") {
      const { sessionId, challengeId } = body;
      const session = getComprehensionSession(sessionId, candidateId);
      const workingFiles = session?.workingFiles || {};

      const report = await executeSandboxTests({
        challengeId,
        workingFiles,
        includeHidden: false, // Visible tests for student feedback
      });

      if (session) {
        recordSessionEvent({
          sessionId,
          candidateId,
          eventType: "test_run",
          payload: { score: report.score, passed: report.passedCount, total: report.totalTests },
        });
      }

      return NextResponse.json({ success: true, report });
    }

    // Action G: Verify Guided Learning Checkpoint
    if (action === "verify_checkpoint") {
      const { challengeId, checkpointId, selectedOptionIndex } = body;
      const checkpoints = getCheckpointsByChallengeId(challengeId);
      const checkpoint = checkpoints.find(c => c.id === checkpointId);

      if (!checkpoint) {
        return NextResponse.json({ success: false, error: "Checkpoint not found." }, { status: 404 });
      }

      const isCorrect = selectedOptionIndex === checkpoint.correctOptionIndex;
      return NextResponse.json({
        success: true,
        checkpointId,
        isCorrect,
        correctOptionIndex: checkpoint.correctOptionIndex,
        explanation: checkpoint.explanation,
        hint: checkpoint.hint,
        fileCitation: checkpoint.fileCitation,
      });
    }

    // Action H: Senior Engineer Interview Defense Evaluation
    if (action === "interview_defense") {
      const { challengeId, stageNumber, candidateDefense } = body;
      const stages = getInterviewStagesByChallengeId(challengeId);
      const currentStage = stages.find(s => s.stageNumber === stageNumber);

      if (!currentStage) {
        return NextResponse.json({ success: false, error: "Interview stage not found." }, { status: 404 });
      }

      const defenseText = (candidateDefense || "").toLowerCase();
      const matchedKeywords = currentStage.expectedKeywords.filter(kw =>
        defenseText.includes(kw.toLowerCase())
      );
      const coverageRatio = currentStage.expectedKeywords.length > 0
        ? matchedKeywords.length / currentStage.expectedKeywords.length
        : 1;

      const score = Math.round(coverageRatio * 100);
      const passed = coverageRatio >= 0.4;

      let feedback = "";
      if (coverageRatio >= 0.7) {
        feedback = "Exceptional defense. You demonstrated senior architectural rigor, identifying core system boundaries and trade-offs.";
      } else if (coverageRatio >= 0.4) {
        feedback = "Solid reasoning. You captured the primary failure mode, but could deepen your analysis of edge cases and scale invariants.";
      } else {
        feedback = "Defense lacks technical depth. A senior interviewer expects concrete citations of data flow, race condition windows, and mitigation patterns.";
      }

      return NextResponse.json({
        success: true,
        stageNumber,
        score,
        passed,
        matchedKeywords,
        missingKeywords: currentStage.expectedKeywords.filter(kw => !defenseText.includes(kw.toLowerCase())),
        feedback,
        followUpProbe: currentStage.sampleFollowUpProbe,
      });
    }

    // Action I: Ask AI Engineering Tutor
    if (action === "ask_tutor") {
      const { sessionId, challengeId, question, assistanceLevel, activeFile } = body;
      
      appendTutorMessage(sessionId, candidateId, "candidate", question);

      const tutorResponse = await askEngineeringTutor({
        challengeId,
        userQuestion: question,
        assistanceLevel,
        activeFile,
      });

      appendTutorMessage(sessionId, candidateId, "tutor", tutorResponse.reply);

      return NextResponse.json({ success: true, tutorResponse });
    }

    // Action J: Submit Final Assessment
    if (action === "submit_assessment") {
      const { sessionId, challengeId, studentExplanation, proposedFix } = body;

      const assessment = await evaluateComprehensionSubmission({
        sessionId,
        candidateId,
        challengeId,
        studentExplanation,
        proposedFix,
      });

      // Complete session and persist immutable report
      completeComprehensionSession(sessionId, candidateId, assessment);

      // Sync verified assessment evidence into Student DNA
      const dnaSync = await syncComprehensionAssessmentToDNA(assessment);

      return NextResponse.json({
        success: true,
        assessment,
        dnaSync,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
