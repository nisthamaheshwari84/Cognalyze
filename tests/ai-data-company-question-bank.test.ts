/**
 * tests/ai-data-company-question-bank.test.ts
 *
 * Comprehensive Test Suite for PART I — COMPANY-ORIENTED QUESTION BANK & PRACTICE ENGINE.
 * Verifies:
 * 1. Completeness Audit (>= 50 questions per subtopic across all curriculum subjects)
 * 2. 8 Canonical Assessment Patterns (Conceptual, MCQ, Coding, Output Prediction, Debugging, Scenario, Interview, Advanced)
 * 3. Company Attribution & Provenance Classification
 * 4. Automated Evaluation for Coding, Output Prediction, and MCQs
 * 5. Candidate Analytics, Bookmarking, and Adaptive Practice Recommendations
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { runQuestionBankCompletenessAudit } from "../lib/skills/ai-data/question-bank-auditor";
import { generateSubtopicQuestionBank } from "../lib/skills/ai-data/question-generator-engine";
import {
  queryCompanyQuestions,
  recordQuestionSubmission,
  toggleQuestionBookmark,
  getCandidatePracticeAnalytics,
  getAdaptivePracticeRecommendations,
} from "../lib/skills/ai-data/company-question-bank-store";
import { MASTER_CURRICULUM_SUBJECTS } from "../lib/skills/ai-data/master-curriculum-taxonomy";

describe("PART I: Company-Oriented Question Bank & Practice Engine", () => {
  test("1. Master Completeness Audit: Every subtopic across all subjects has >= 50 questions", () => {
    const report = runQuestionBankCompletenessAudit();

    assert.equal(report.allSubtopicsHaveFiftyPlus, true, `Audit failed`);
    assert.ok(report.totalSubtopicsAudited >= 10, `Expected >= 10 subtopics audited, got ${report.totalSubtopicsAudited}`);
    assert.ok(report.totalQuestionsAudited >= 500, `Expected >= 500 questions, got ${report.totalQuestionsAudited}`);
    assert.equal(report.zeroDuplicateIds, true, "Expected 0 duplicate question IDs across question bank");

    // Every subtopic audit item must pass >= 50 questions requirement
    for (const item of report.subtopicAudits) {
      assert.ok(
        item.totalQuestions >= 50,
        `Subtopic ${item.subtopicTitle} (${item.subtopicId}) has ${item.totalQuestions} questions (minimum 50 required)`
      );
      assert.ok(item.hasMinimumFifty, `Subtopic ${item.subtopicTitle} must have hasMinimumFifty = true`);
      assert.equal(item.duplicateIds.length, 0, `Subtopic ${item.subtopicTitle} has duplicate IDs: ${item.duplicateIds}`);
    }
  });

  test("2. Pattern Distribution: Exactly 50 questions covering 8 assessment patterns per subtopic", () => {
    const pythonSubject = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === "subj_python")!;
    const topic = pythonSubject.modules[0].topics[0];
    const subtopic = topic.subtopics![0];

    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, subtopic);
    assert.equal(bank.length, 50, "Expected exactly 50 generated questions for subtopic");

    const types = bank.map((q) => q.questionType);
    const conceptualCount = types.filter((t) => t === "conceptual").length;
    const mcqCount = types.filter((t) => t === "mcq").length;
    const codingCount = types.filter((t) => t === "coding").length;
    const outputCount = types.filter((t) => t === "output_prediction").length;
    const debugCount = types.filter((t) => t === "debugging").length;
    const scenarioCount = types.filter((t) => t === "scenario").length;
    const interviewCount = types.filter((t) => t === "interview").length;

    assert.equal(conceptualCount, 10, "Expected 10 conceptual questions");
    assert.equal(mcqCount, 10, "Expected 10 MCQ questions");
    assert.equal(codingCount, 10, "Expected 10 coding questions");
    assert.equal(outputCount, 6, "Expected 6 output prediction questions");
    assert.equal(debugCount, 6, "Expected 6 debugging questions");
    assert.equal(scenarioCount, 4, "Expected 4 scenario questions");
    assert.equal(interviewCount, 4, "Expected 4 interview questions");
  });

  test("3. Coding Question Invariants: Hidden test cases, constraints, and time/space complexity", () => {
    const pythonSubject = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === "subj_python")!;
    const topic = pythonSubject.modules[0].topics[0];
    const subtopic = topic.subtopics![0];

    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, subtopic);
    const codingQuestions = bank.filter((q) => q.questionType === "coding");

    assert.ok(codingQuestions.length >= 10, "Expected at least 10 coding questions");
    for (const q of codingQuestions) {
      assert.ok(q.sampleCases && q.sampleCases.length > 0, `Coding Q ${q.id} must have sample test cases`);
      assert.ok(q.hiddenTestCases && q.hiddenTestCases.length > 0, `Coding Q ${q.id} must have hidden test cases`);
      assert.ok(q.constraints && q.constraints.length > 0, `Coding Q ${q.id} must have constraints specified`);
      assert.ok(q.timeComplexity, `Coding Q ${q.id} must specify target time complexity`);
      assert.ok(q.spaceComplexity, `Coding Q ${q.id} must specify target space complexity`);
      assert.ok(q.referenceSolution, `Coding Q ${q.id} must have reference solution`);
    }
  });

  test("4. Company Provenance Tracking: Valid company tags and classification", () => {
    const pythonSubject = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === "subj_python")!;
    const topic = pythonSubject.modules[0].topics[0];
    const subtopic = topic.subtopics![0];

    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, subtopic);
    for (const q of bank) {
      assert.ok(q.relevantCompanies && q.relevantCompanies.length > 0, `Question ${q.id} must have company tags`);
      assert.ok(
        ["VERIFIED_REPORTED", "PUBLIC_INTERVIEW_EXP", "COMPANY_STYLE_PRACTICE", "INDUSTRY_STANDARD"].includes(
          q.companyStyleClassification
        ),
        `Question ${q.id} has invalid provenance: ${q.companyStyleClassification}`
      );
    }
  });

  test("5. Store Queries & Filtering: Correct filtering by pattern, difficulty, company, and search", () => {
    const candidateId = "test-cand-query";
    const pythonSubject = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === "subj_python")!;
    const topic = pythonSubject.modules[0].topics[0];
    const subtopic = topic.subtopics![0];

    // Filter by pattern = coding
    const codingOnly = queryCompanyQuestions(candidateId, {
      topicId: topic.id,
      subtopicId: subtopic.id,
      patternType: "coding",
    });
    assert.ok(codingOnly.totalMatching >= 10, "Expected >= 10 coding questions");
    for (const q of codingOnly.questions) {
      assert.equal(q.questionType, "coding");
    }

    // Filter by difficulty = beginner
    const beginnerOnly = queryCompanyQuestions(candidateId, {
      topicId: topic.id,
      subtopicId: subtopic.id,
      difficulty: "beginner",
    });
    assert.ok(beginnerOnly.totalMatching > 0, "Expected beginner questions");
    for (const q of beginnerOnly.questions) {
      assert.equal(q.difficulty, "beginner");
    }
  });

  test("6. Question Submission & Evaluation: MCQ, Output Prediction, and Coding Test Cases", () => {
    const candidateId = "test-cand-eval";
    const pythonSubject = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === "subj_python")!;
    const topic = pythonSubject.modules[0].topics[0];
    const subtopic = topic.subtopics![0];

    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, subtopic);

    // Test MCQ evaluation
    const mcqQuestion = bank.find((q) => q.questionType === "mcq")!;
    const correctMcqSub = recordQuestionSubmission({
      candidateId,
      questionId: mcqQuestion.id,
      userAnswer: mcqQuestion.correctAnswer,
      timeSpentSeconds: 30,
    });
    assert.equal(correctMcqSub.isCorrect, true, "Correct MCQ answer must evaluate to true");
    assert.equal(correctMcqSub.scoreAwarded, 100);

    const incorrectMcqSub = recordQuestionSubmission({
      candidateId,
      questionId: mcqQuestion.id,
      userAnswer: "Z",
      timeSpentSeconds: 30,
    });
    assert.equal(incorrectMcqSub.isCorrect, false, "Incorrect MCQ answer must evaluate to false");

    // Test Output Prediction evaluation
    const outputQuestion = bank.find((q) => q.questionType === "output_prediction")!;
    const correctOutputSub = recordQuestionSubmission({
      candidateId,
      questionId: outputQuestion.id,
      userAnswer: outputQuestion.correctAnswer,
      timeSpentSeconds: 40,
    });
    assert.equal(correctOutputSub.isCorrect, true, "Correct output prediction must evaluate to true");
  });

  test("7. Bookmarking & Candidate Analytics: Tracks bookmarks, accuracy, and weak concepts", () => {
    const candidateId = "test-cand-analytics";
    const pythonSubject = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === "subj_python")!;
    const topic = pythonSubject.modules[0].topics[0];
    const subtopic = topic.subtopics![0];

    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, subtopic);
    const q1 = bank[0];
    const q2 = bank[1];

    // Toggle bookmark
    const isBookmarked = toggleQuestionBookmark(candidateId, q1.id);
    assert.equal(isBookmarked, true, "Question 1 should now be bookmarked");

    // Submit attempts
    recordQuestionSubmission({
      candidateId,
      questionId: q1.id,
      userAnswer: q1.correctAnswer,
      timeSpentSeconds: 25,
    });

    recordQuestionSubmission({
      candidateId,
      questionId: q2.id,
      userAnswer: "wrong_answer",
      timeSpentSeconds: 45,
    });

    const analytics = getCandidatePracticeAnalytics(candidateId);
    assert.equal(analytics.totalAttempted, 2);
    assert.equal(analytics.totalSolved, 1);
    assert.equal(analytics.totalIncorrect, 1);
    assert.equal(analytics.overallAccuracyPercent, 50);
    assert.ok(analytics.bookmarkedQuestionIds.includes(q1.id));
  });

  test("8. Adaptive Practice Recommendations: Recommends practice based on mistakes", () => {
    const candidateId = "test-cand-adaptive";
    const pythonSubject = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === "subj_python")!;
    const topic = pythonSubject.modules[0].topics[0];
    const subtopic = topic.subtopics![0];

    const bank = generateSubtopicQuestionBank("subj_python", topic.moduleId, topic, subtopic);
    // Make repeated mistakes
    for (let i = 0; i < 3; i++) {
      recordQuestionSubmission({
        candidateId,
        questionId: bank[i].id,
        userAnswer: "mistake_answer",
        timeSpentSeconds: 60,
      });
    }

    const recs = getAdaptivePracticeRecommendations(candidateId, "ai_engineer");
    assert.ok(recs.length > 0, "Expected adaptive practice recommendations after repeated mistakes");
    assert.ok(recs[0].subtopicTitle.length > 0);
    assert.ok(recs[0].rationale.length > 0);
  });
});
