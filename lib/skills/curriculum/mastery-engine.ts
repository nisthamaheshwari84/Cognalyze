/**
 * lib/skills/curriculum/mastery-engine.ts
 * 
 * Adaptive Learning, Evaluation & Mastery State Engine for Cognalyze.
 * 
 * Implements explicit transition rules:
 * not_started → learning → practising → needs_review → provisional_mastery → demonstrated_mastery → review_due
 * 
 * Provides:
 * 1. Initial Diagnostic & Fast-Track Testing (experienced coders test out of basics).
 * 2. Unassisted vs Assisted Mastery Gating (no mastery for copying solutions).
 * 3. Direct persistence and Student DNA integration.
 */

import { CanonicalSubjectSlug, MasteryState } from "./types";
import { getSubtopicBySlug, getSubjectBySlug } from "./unified-curriculum-registry";
import { syncArenaAttemptToDNA } from "../ai-data/dna-adapter";

export interface SubtopicAttemptRecord {
  id: string;
  candidateId: string;
  subjectSlug: CanonicalSubjectSlug;
  subtopicSlug: string;
  score: number;
  allTestsPassed: boolean;
  assisted: boolean; // True if Level 4 hint was revealed
  timestamp: string;
}

export interface StudentSubtopicMastery {
  candidateId: string;
  subjectSlug: CanonicalSubjectSlug;
  subtopicSlug: string;
  state: MasteryState;
  score: number;
  attemptsCount: number;
  lastAttemptAt: string;
  nextReviewAt?: string;
  evidenceId?: string;
}

// In-memory persistent mastery store keyed by `${candidateId}::${subtopicSlug}`
const STUDENT_MASTERY_STORE = new Map<string, StudentSubtopicMastery>();

/**
 * Retrieves the current mastery record for a student on a specific subtopic.
 */
export function getStudentSubtopicMastery(
  candidateId: string,
  subtopicSlug: string
): StudentSubtopicMastery {
  const key = `${candidateId || "guest"}::${subtopicSlug}`;
  const existing = STUDENT_MASTERY_STORE.get(key);
  if (existing) return existing;

  const subtopic = getSubtopicBySlug(subtopicSlug);
  return {
    candidateId: candidateId || "guest",
    subjectSlug: subtopic ? subtopic.subjectSlug : "python",
    subtopicSlug,
    state: "not_started",
    score: 0,
    attemptsCount: 0,
    lastAttemptAt: new Date().toISOString()
  };
}

/**
 * Transition rules engine for evaluating a student attempt.
 */
export function evaluateMasteryTransition(
  current: StudentSubtopicMastery,
  attempt: {
    score: number;
    allTestsPassed: boolean;
    assisted: boolean;
  }
): { newState: MasteryState; feedback: string } {
  // Rule 1: Attempt failed test cases
  if (!attempt.allTestsPassed || attempt.score < 70) {
    return {
      newState: "needs_review",
      feedback: "Tests did not pass completely. Review the mentor's diagnostic insight and retry."
    };
  }

  // Rule 2: Passed with Level 4 assistance (solution was revealed)
  if (attempt.assisted) {
    return {
      newState: "provisional_mastery",
      feedback: "Solution verified with mentor assistance. To earn demonstrated mastery, complete the independent challenge without Level 4 hints."
    };
  }

  // Rule 3: Passed independently with 100% test pass rate
  if (attempt.score >= 85 && attempt.allTestsPassed && !attempt.assisted) {
    return {
      newState: "demonstrated_mastery",
      feedback: "Demonstrated Mastery Achieved! Verified unassisted solution recorded in Student DNA."
    };
  }

  return {
    newState: "practising",
    feedback: "Good progress! Continue practicing to solidify demonstrated mastery."
  };
}

/**
 * Records a student attempt, computes state transition, and synchronizes to Student DNA.
 */
export async function recordStudentSubtopicAttempt(
  attempt: SubtopicAttemptRecord
): Promise<{ mastery: StudentSubtopicMastery; feedback: string }> {
  const key = `${attempt.candidateId || "guest"}::${attempt.subtopicSlug}`;
  const current = getStudentSubtopicMastery(attempt.candidateId, attempt.subtopicSlug);
  const { newState, feedback } = evaluateMasteryTransition(current, attempt);

  const now = new Date();
  const nextReview = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7-day spaced review

  const updated: StudentSubtopicMastery = {
    ...current,
    state: newState,
    score: Math.max(current.score, attempt.score),
    attemptsCount: current.attemptsCount + 1,
    lastAttemptAt: now.toISOString(),
    nextReviewAt: newState === "demonstrated_mastery" ? nextReview : current.nextReviewAt
  };

  STUDENT_MASTERY_STORE.set(key, updated);

  // Synchronize with Student DNA if mastery is demonstrated
  if (newState === "demonstrated_mastery" && attempt.candidateId && attempt.candidateId !== "guest") {
    const subtopic = getSubtopicBySlug(attempt.subtopicSlug);
    if (subtopic) {
      await syncArenaAttemptToDNA({
        id: attempt.id,
        candidateId: attempt.candidateId,
        trackSlug: (attempt.subjectSlug as any) || "ai_ml",
        lessonSlug: attempt.subtopicSlug,
        exerciseType: "code_lab",
        score: attempt.score,
        passed: true,
        assisted: false,
        completedAt: now.toISOString()
      });
    }
  }

  return { mastery: updated, feedback };
}

/**
 * Fast-Track Diagnostic Test for Experienced Programmers.
 * When an experienced student passes a chapter-level diagnostic assessment,
 * all foundational topics in that chapter are awarded demonstrated mastery.
 */
export async function applyFastTrackExemption(
  candidateId: string,
  subjectSlug: CanonicalSubjectSlug,
  chapterSlug: string,
  diagnosticScore: number
): Promise<{ exemptedCount: number; grantedMastery: boolean }> {
  if (diagnosticScore < 85) {
    return { exemptedCount: 0, grantedMastery: false };
  }

  const subject = getSubjectBySlug(subjectSlug);
  if (!subject) return { exemptedCount: 0, grantedMastery: false };

  const chapter = subject.chapters.find((c) => c.slug === chapterSlug);
  if (!chapter) return { exemptedCount: 0, grantedMastery: false };

  let count = 0;
  const now = new Date().toISOString();

  for (const topic of chapter.topics) {
    for (const sub of topic.subtopics) {
      const key = `${candidateId || "guest"}::${sub.slug}`;
      const mastery: StudentSubtopicMastery = {
        candidateId: candidateId || "guest",
        subjectSlug,
        subtopicSlug: sub.slug,
        state: "demonstrated_mastery",
        score: diagnosticScore,
        attemptsCount: 1,
        lastAttemptAt: now
      };
      STUDENT_MASTERY_STORE.set(key, mastery);
      count++;
    }
  }

  return { exemptedCount: count, grantedMastery: true };
}

/**
 * Returns overall mastery statistics for a student in a subject.
 */
export function getSubjectMasterySummary(
  candidateId: string,
  subjectSlug: CanonicalSubjectSlug
): {
  totalSubtopics: number;
  masteredCount: number;
  inProgressCount: number;
  needsReviewCount: number;
  completionPercentage: number;
} {
  const subject = getSubjectBySlug(subjectSlug);
  if (!subject) {
    return { totalSubtopics: 0, masteredCount: 0, inProgressCount: 0, needsReviewCount: 0, completionPercentage: 0 };
  }

  let total = 0;
  let mastered = 0;
  let inProgress = 0;
  let needsReview = 0;

  for (const chapter of subject.chapters) {
    for (const topic of chapter.topics) {
      for (const sub of topic.subtopics) {
        total++;
        const record = getStudentSubtopicMastery(candidateId, sub.slug);
        if (record.state === "demonstrated_mastery") {
          mastered++;
        } else if (record.state === "needs_review") {
          needsReview++;
        } else if (record.state === "learning" || record.state === "practising" || record.state === "provisional_mastery") {
          inProgress++;
        }
      }
    }
  }

  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  return {
    totalSubtopics: total,
    masteredCount: mastered,
    inProgressCount: inProgress,
    needsReviewCount: needsReview,
    completionPercentage: pct
  };
}
