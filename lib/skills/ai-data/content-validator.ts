/**
 * lib/skills/ai-data/content-validator.ts
 * 
 * Content Quality Gate & Lesson Specification Validator for AI & Data Arena.
 * Conforms to Part 8: rejects malformed, generic, or broken educational content before publication.
 */

import { AiDataLesson } from "./types";

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  field?: string;
}

export interface LessonValidationReport {
  lessonId: string;
  lessonSlug: string;
  isValid: boolean;
  canPublish: boolean;
  score: number; // 0 - 100
  issues: ValidationIssue[];
  passedChecksCount: number;
  totalChecksCount: number;
}

export function validateLessonContent(lesson: Partial<AiDataLesson>): LessonValidationReport {
  const issues: ValidationIssue[] = [];
  let passedChecks = 0;
  const totalChecks = 9;

  // 1. Mandatory Identity & Metadata
  if (!lesson.id || !lesson.slug || !lesson.title) {
    issues.push({
      severity: "error",
      code: "MISSING_IDENTITY",
      message: "Lesson must define a permanent id, slug, and title."
    });
  } else {
    passedChecks++;
  }

  // 2. Canonical Skill Mapping
  if (!lesson.canonicalSkill || lesson.canonicalSkill.trim().length === 0) {
    issues.push({
      severity: "error",
      code: "MISSING_SKILL",
      message: "Lesson must map to a verified canonical skill in the taxonomy."
    });
  } else {
    passedChecks++;
  }

  // 3. Substantial Explanation
  if (!lesson.contentMarkdown || lesson.contentMarkdown.trim().length < 150) {
    issues.push({
      severity: "error",
      code: "INSUFFICIENT_EXPLANATION",
      message: "Content markdown must provide at least 150 characters of structured explanation including learning goals and technical intuition."
    });
  } else {
    passedChecks++;
  }

  // 4. Exercise Type & Configuration Consistency
  if (!lesson.exerciseType) {
    issues.push({
      severity: "error",
      code: "MISSING_EXERCISE_TYPE",
      message: "Lesson must specify an exerciseType (code_lab, sql_lab, agent_builder, etc.)."
    });
  } else {
    passedChecks++;
  }

  // 5. Code Lab Checks: Starter Code vs Solution Leakage
  if (lesson.exerciseType === "code_lab") {
    if (!lesson.starterCode || lesson.starterCode.trim().length === 0) {
      issues.push({
        severity: "error",
        code: "MISSING_STARTER_CODE",
        message: "code_lab lessons must provide non-empty starterCode."
      });
    } else {
      // Anti-Simulation Rule: starter code must NOT already contain the entire completed solution
      if (lesson.solutionSnippet && lesson.starterCode.trim() === lesson.solutionSnippet.trim()) {
        issues.push({
          severity: "error",
          code: "STARTER_CODE_LEAKS_SOLUTION",
          message: "Starter code cannot be identical to the solution snippet."
        });
      } else {
        passedChecks++;
      }
    }
  } else {
    passedChecks++;
  }

  // 6. Test Cases Validation
  if (lesson.exerciseType === "code_lab" || lesson.exerciseType === "sql_lab") {
    if (!lesson.testCases || lesson.testCases.length === 0) {
      issues.push({
        severity: "warning",
        code: "NO_AUTOMATED_TESTS",
        message: "Code and SQL labs should define automated test cases for real evaluation."
      });
    } else {
      const malformed = lesson.testCases.some(t => !t.description || t.expected === undefined);
      if (malformed) {
        issues.push({
          severity: "error",
          code: "MALFORMED_TEST_CASES",
          message: "All test cases must include a description and an expected outcome."
        });
      } else {
        passedChecks++;
      }
    }
  } else {
    passedChecks++;
  }

  // 7. Provenance Verification
  if (!lesson.provenance) {
    issues.push({
      severity: "warning",
      code: "MISSING_PROVENANCE",
      message: "Lesson should declare question provenance (e.g. company_pattern, verified_historical)."
    });
  } else {
    passedChecks++;
  }

  // 8. Duration Calibration
  if (!lesson.durationMinutes || lesson.durationMinutes < 5 || lesson.durationMinutes > 90) {
    issues.push({
      severity: "warning",
      code: "UNREALISTIC_DURATION",
      message: "Lesson duration should be calibrated between 5 and 90 minutes."
    });
  } else {
    passedChecks++;
  }

  // 9. Summary & Description Quality
  if (!lesson.summary || lesson.summary.length < 20) {
    issues.push({
      severity: "error",
      code: "INSUFFICIENT_SUMMARY",
      message: "Summary must be at least 20 characters explaining the real-world utility."
    });
  } else {
    passedChecks++;
  }

  const errorCount = issues.filter(i => i.severity === "error").length;
  const canPublish = errorCount === 0;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    lessonId: lesson.id || "unknown",
    lessonSlug: lesson.slug || "unknown",
    isValid: errorCount === 0,
    canPublish,
    score,
    issues,
    passedChecksCount: passedChecks,
    totalChecksCount: totalChecks
  };
}

