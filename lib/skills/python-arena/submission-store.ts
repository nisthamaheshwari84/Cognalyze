/**
 * lib/skills/python-arena/submission-store.ts
 *
 * Submission Persistence, Progress Analytics & Student DNA Bridge for Python Arena.
 * Tracks:
 * - Real code submissions with timestamps, execution metrics, and test case outcomes
 * - Reattempt history allowing students to reopen, compare, and debug past versions
 * - Multi-stage progression: Studied -> Practised -> Assessed -> Independently Demonstrated
 * - Weak concepts and recurring error identification
 * - Seamless synchronization with Cognalyze Student DNA evidence pipeline
 */

import { PythonExecutionResult } from "./execution-engine";
import { getCuratedQuestionById } from "./python-question-bank";
import { syncArenaAttemptToDNA } from "../ai-data/dna-adapter";
import { recordStudentAttempt } from "../ai-data/store";
import { StudentArenaAttempt } from "../ai-data/types";

export interface PythonSubmissionRecord {
  id: string;
  candidateId: string;
  questionId: string;
  questionTitle: string;
  topicId: string;
  subtopicId: string;
  partId: string;
  code: string;
  status: "passed" | "failed" | "syntax_error" | "runtime_error" | "time_limit_exceeded";
  score: number;
  passedCount: number;
  totalCount: number;
  executionTimeMs: number;
  errorMessage?: string;
  isAssisted: boolean;
  hintsUsedCount: number;
  submittedAt: string;
}

export interface PythonCandidateProgress {
  candidateId: string;
  totalQuestionsAttempted: number;
  totalQuestionsSolved: number;
  totalSubmissions: number;
  solveRatePercent: number;
  studiedSubtopicIds: string[];
  practisedQuestionIds: string[];
  assessedQuestionIds: string[];
  demonstratedQuestionIds: string[];
  weakConcepts: Array<{ concept: string; errorCount: number; lastError: string }>;
  recentSubmissions: PythonSubmissionRecord[];
  dnaEvidenceCount: number;
}

// In-memory store with session persistence fallback
const SUBMISSIONS_DB: Map<string, PythonSubmissionRecord[]> = new Map();
const STUDIED_SUBTOPICS: Map<string, Set<string>> = new Map();

/**
 * Persists a new Python code submission and updates Student DNA.
 */
export async function recordPythonSubmission(params: {
  candidateId: string;
  questionId: string;
  code: string;
  execResult: PythonExecutionResult;
  isAssisted?: boolean;
  hintsUsedCount?: number;
}): Promise<{
  submission: PythonSubmissionRecord;
  dnaSyncSuccess: boolean;
  dnaRecommendation: string;
}> {
  const { candidateId, questionId, code, execResult, isAssisted = false, hintsUsedCount = 0 } = params;
  const question = getCuratedQuestionById(questionId);

  const submission: PythonSubmissionRecord = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    candidateId,
    questionId,
    questionTitle: question?.title || "Python Coding Exercise",
    topicId: question?.topicId || "top_python_core",
    subtopicId: question?.subtopicId || "sub_python_practice",
    partId: question?.partId || "part_a",
    code,
    status: execResult.status as any,
    score: execResult.score || 0,
    passedCount: execResult.passedCount || 0,
    totalCount: execResult.totalCount || 0,
    executionTimeMs: execResult.executionTimeMs || 0,
    errorMessage: execResult.errorMessage,
    isAssisted,
    hintsUsedCount,
    submittedAt: new Date().toISOString(),
  };

  const list = SUBMISSIONS_DB.get(candidateId) || [];
  list.unshift(submission);
  SUBMISSIONS_DB.set(candidateId, list);

  // Sync to Student DNA if score > 0
  let dnaSyncSuccess = false;
  let dnaRecommendation = "Keep practising to reach verified solution.";

  if (submission.score > 0 && submission.status === "passed") {
    const arenaAttempt: StudentArenaAttempt = {
      id: submission.id,
      candidateId,
      trackSlug: "data_science_analytics",
      lessonSlug: question?.subtopicId || "python-challenge",
      exerciseType: "code_lab",
      score: submission.score,
      passed: true,
      assisted: isAssisted || hintsUsedCount > 1,
      executionReport: {
        totalTests: submission.totalCount,
        passedCount: submission.passedCount,
        executionTimeMs: submission.executionTimeMs,
        stdout: execResult.stdout,
      },
      completedAt: submission.submittedAt,
    };

    recordStudentAttempt(arenaAttempt);
    const dnaRes = await syncArenaAttemptToDNA(arenaAttempt);
    dnaSyncSuccess = dnaRes.success;
    dnaRecommendation = dnaRes.nextActionRecommendation;
  }

  return {
    submission,
    dnaSyncSuccess,
    dnaRecommendation,
  };
}

/**
 * Records that a candidate has studied a specific subtopic.
 */
export function recordSubtopicStudied(candidateId: string, subtopicId: string): void {
  const current = STUDIED_SUBTOPICS.get(candidateId) || new Set();
  current.add(subtopicId);
  STUDIED_SUBTOPICS.set(candidateId, current);
}

/**
 * Retrieves all submissions for a candidate, optionally filtered by question.
 */
export function getCandidateSubmissions(
  candidateId: string,
  questionId?: string
): PythonSubmissionRecord[] {
  const list = SUBMISSIONS_DB.get(candidateId) || [];
  if (questionId) {
    return list.filter((s) => s.questionId === questionId);
  }
  return list;
}

/**
 * Calculates a candidate's complete Python practice analytics.
 */
export function getCandidatePythonProgress(candidateId: string): PythonCandidateProgress {
  const submissions = SUBMISSIONS_DB.get(candidateId) || [];
  const studied = Array.from(STUDIED_SUBTOPICS.get(candidateId) || []);

  const attemptedQuestionMap = new Map<string, PythonSubmissionRecord[]>();
  for (const sub of submissions) {
    const existing = attemptedQuestionMap.get(sub.questionId) || [];
    existing.push(sub);
    attemptedQuestionMap.set(sub.questionId, existing);
  }

  const attemptedIds = Array.from(attemptedQuestionMap.keys());
  const solvedIds: string[] = [];
  const demonstratedIds: string[] = [];

  const errorCounter = new Map<string, { count: number; lastError: string }>();

  for (const [qId, qSubs] of attemptedQuestionMap.entries()) {
    const hasPassed = qSubs.some((s) => s.status === "passed");
    if (hasPassed) {
      solvedIds.push(qId);
      // Check if independently demonstrated (no hints, first or second attempt)
      const independentPass = qSubs.some((s) => s.status === "passed" && !s.isAssisted && s.hintsUsedCount <= 1);
      if (independentPass) {
        demonstratedIds.push(qId);
      }
    }

    for (const s of qSubs) {
      if (s.status !== "passed" && s.errorMessage) {
        const errorKey = s.status === "syntax_error" ? "Syntax & Formatting" : s.status === "time_limit_exceeded" ? "Time Complexity / Infinite Loops" : "Logical Output Mismatch";
        const cur = errorCounter.get(errorKey) || { count: 0, lastError: s.errorMessage };
        cur.count++;
        cur.lastError = s.errorMessage;
        errorCounter.set(errorKey, cur);
      }
    }
  }

  const weakConcepts = Array.from(errorCounter.entries()).map(([concept, data]) => ({
    concept,
    errorCount: data.count,
    lastError: data.lastError,
  }));

  const totalAttempted = attemptedIds.length;
  const totalSolved = solvedIds.length;
  const solveRate = totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0;

  return {
    candidateId,
    totalQuestionsAttempted: totalAttempted,
    totalQuestionsSolved: totalSolved,
    totalSubmissions: submissions.length,
    solveRatePercent: solveRate,
    studiedSubtopicIds: studied,
    practisedQuestionIds: attemptedIds,
    assessedQuestionIds: solvedIds,
    demonstratedQuestionIds: demonstratedIds,
    weakConcepts,
    recentSubmissions: submissions.slice(0, 15),
    dnaEvidenceCount: demonstratedIds.length,
  };
}
