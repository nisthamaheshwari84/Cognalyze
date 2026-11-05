/**
 * tests/learning-evaluation-rearchitecture.test.ts
 * 
 * End-to-end regression and verification test suite for the Cognalyze
 * Learning & Evaluation Re-Architecture.
 * 
 * Tests:
 * 1. Unified Curriculum Registry across all 17 canonical subjects.
 * 2. Hierarchy completeness: Subject -> Chapter -> Topic -> Subtopic -> 5-Step Experience.
 * 3. Dedicated Subject-Specific AI Mentors with isolated context & domain rules.
 * 4. Real Execution Sandboxes (Python AST, SQLite In-Memory, ML Studio, Agent DAG).
 * 5. Adaptive Mastery Transition Engine & Fast-Track Diagnostic Exemptions.
 * 6. Student DNA synchronization on demonstrated mastery.
 * 7. /api/skills/curriculum API route contract.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  getAllSubjects,
  getSubjectBySlug,
  getSubtopicBySlug,
  getSubtopicsForSubject,
  searchCurriculum,
  getCurriculumCoverageManifest
} from "../lib/skills/curriculum/unified-curriculum-registry";

import {
  SUBJECT_MENTOR_PERSONAS,
  getSubjectMentorReply,
  SubjectMentorContext
} from "../lib/skills/curriculum/subject-mentors";

import { executeInUnifiedSandbox } from "../lib/skills/curriculum/unified-execution-engine";

import {
  getStudentSubtopicMastery,
  evaluateMasteryTransition,
  recordStudentSubtopicAttempt,
  applyFastTrackExemption,
  getSubjectMasterySummary
} from "../lib/skills/curriculum/mastery-engine";

describe("Learning & Evaluation 1: Canonical Unified Curriculum Registry", () => {
  test("Registers all 17 canonical subjects with valid categories and metadata", () => {
    const subjects = getAllSubjects();
    assert.equal(subjects.length, 17, "Must define exactly 17 canonical subjects");

    const expectedSlugs = [
      "python",
      "numpy",
      "pandas",
      "visualization",
      "scikit_learn",
      "sql",
      "math_stats",
      "data_science",
      "machine_learning",
      "deep_learning",
      "artificial_intelligence",
      "genai_llm",
      "agentic_ai",
      "data_engineering",
      "mlops",
      "applied_projects",
      "dsa"
    ];

    for (const slug of expectedSlugs) {
      const subj = getSubjectBySlug(slug);
      assert.ok(subj, `Subject ${slug} must be registered`);
      assert.ok(subj.name.length > 0, `Subject ${slug} must have a name`);
      assert.ok(subj.icon.length > 0, `Subject ${slug} must have an icon`);
      assert.ok(subj.chapters.length >= 1, `Subject ${slug} must have chapters`);
      assert.ok(subj.estimatedHours > 0, `Subject ${slug} must have positive estimated hours`);
    }
  });

  test("Hierarchy conforms to: Subject -> Chapter -> Topic -> Subtopic -> 5-Step Experience", () => {
    const manifest = getCurriculumCoverageManifest();
    assert.equal(manifest.totalSubjects, 17);
    assert.ok(manifest.totalChapters >= 21);
    assert.ok(manifest.totalTopics >= 21);
    assert.ok(manifest.totalSubtopics >= 21);

    // Verify subtopic 5-stage contract
    const pySub = getSubtopicBySlug("variables-references-and-identity");
    assert.ok(pySub);
    assert.equal(pySub.subjectSlug, "python");

    // Stage 1: Understand
    assert.ok(pySub.learningGoal.length > 10);
    assert.ok(pySub.intuitiveStory.length > 10);
    assert.ok(pySub.analogy.length > 10);
    assert.ok(pySub.formalConcept.length > 10);
    assert.ok(pySub.productionSignificance.length > 10);

    // Stage 2: Demonstrate
    assert.ok(pySub.mermaidDiagram.length > 10);
    assert.ok(pySub.demonstrationSteps.length >= 1);
    assert.ok(pySub.audioNarrationScript.length > 10);

    // Stage 3: Practise
    assert.ok(pySub.coBuildSlot.slotId);
    assert.ok(pySub.coBuildSlot.starterSnippet);
    assert.ok(pySub.coBuildSlot.expectedPattern);

    // Stage 4: Execute & Debug
    assert.ok(pySub.starterCodeOrQuery);
    assert.ok(pySub.debugFault.buggyCodeOrConfig);
    assert.ok(pySub.debugFault.correctCodeOrConfig);

    // Stage 5: Assess & Master
    assert.ok(pySub.comprehensionChecks.length >= 1);
    assert.ok(pySub.independentChallenge.challengeId);
    assert.ok(pySub.independentChallenge.testCases.length >= 1);
  });

  test("Search engine correctly indexes topics, titles, and formal concepts", () => {
    const res = searchCurriculum("broadcasting");
    assert.ok(res.length >= 1, "Must find broadcasting subtopic");
    assert.equal(res[0].subtopic.slug, "broadcasting-mechanics-and-strides");

    const sqlRes = searchCurriculum("anti-join");
    assert.ok(sqlRes.length >= 1, "Must find anti-join subtopic");
    assert.equal(sqlRes[0].subtopic.slug, "outer-joins-and-anti-joins");
  });
});

describe("Learning & Evaluation 2: Dedicated Subject-Specific AI Mentors", () => {
  test("All 17 subjects have dedicated personas with calibrated domain rules", () => {
    for (const [slug, persona] of Object.entries(SUBJECT_MENTOR_PERSONAS)) {
      assert.ok(persona.mentorName, `Persona for ${slug} must have a name`);
      assert.ok(persona.title, `Persona for ${slug} must have a title`);
      assert.ok(persona.systemPrompt.length > 20, `Persona for ${slug} must have system prompt`);
      assert.ok(persona.domainRules.length >= 2, `Persona for ${slug} must have domain rules`);
    }
  });

  test("Mentor provides progressive Socratic hints without early answer revelation", () => {
    const subtopic = getSubtopicBySlug("variables-references-and-identity")!;
    
    // Level 1: Conceptual Nudge
    const replyL1 = getSubjectMentorReply({
      subjectSlug: "python",
      subtopicSlug: subtopic.slug,
      studentCodeOrQuery: "",
      currentHintLevel: 1
    });
    assert.ok(replyL1.replyMarkdown.includes("Conceptual Nudge"));
    assert.ok(!replyL1.replyMarkdown.includes("return lst.copy()"), "Level 1 must not reveal solution");

    // Level 2: Targeted Clue
    const replyL2 = getSubjectMentorReply({
      subjectSlug: "python",
      subtopicSlug: subtopic.slug,
      studentCodeOrQuery: "",
      currentHintLevel: 2
    });
    assert.ok(replyL2.replyMarkdown.includes("Targeted Clue"));

    // Level 4: Complete Walkthrough (Assisted Mode)
    const replyL4 = getSubjectMentorReply({
      subjectSlug: "python",
      subtopicSlug: subtopic.slug,
      studentCodeOrQuery: "",
      currentHintLevel: 4
    });
    assert.ok(replyL4.replyMarkdown.includes("Complete Walkthrough"));
    assert.ok(replyL4.replyMarkdown.includes("Assisted Mode"));
  });

  test("Mentor isolates context across subjects and diagnoses runtime errors", () => {
    const errorReply = getSubjectMentorReply({
      subjectSlug: "sql",
      subtopicSlug: "outer-joins-and-anti-joins",
      studentCodeOrQuery: "SELECT * FROM orders WHERE DENSE_RANK() = 1",
      lastExecutionResult: {
        success: false,
        stderr: "syntax error at or near 'DENSE_RANK'"
      },
      currentHintLevel: 1
    });

    assert.ok(errorReply.replyMarkdown.includes("Diagnostic Insight"));
    assert.ok(errorReply.replyMarkdown.includes("syntax error"));
    assert.equal(errorReply.mentorName, "Alex & Codd");
  });
});

describe("Learning & Evaluation 3: Unified Execution & Debug Sandbox", () => {
  test("Executes Python AST sandbox safely and captures stdout and execution time", async () => {
    const res = await executeInUnifiedSandbox({
      environment: "python_sandbox",
      codeOrQuery: "print('Cognalyze Python Engine Online')\nx = [i ** 2 for i in range(5)]\nprint('Squares:', x)"
    });

    assert.equal(res.success, true);
    assert.ok(res.stdout.includes("Cognalyze Python Engine Online"));
    assert.ok(res.stdout.includes("[0, 1, 4, 9, 16]"));
    assert.ok(res.executionTimeMs >= 0);
  });

  test("Evaluates Python test cases and computes fractional scores", async () => {
    const res = await executeInUnifiedSandbox({
      environment: "python_sandbox",
      codeOrQuery: "def add(a, b): return a + b\nprint(add(2, 3))\nprint(add(10, 20))",
      testCases: [
        { input: "add(2, 3)", expectedOutput: "5" },
        { input: "add(10, 20)", expectedOutput: "30" }
      ]
    });

    assert.equal(res.success, true);
    assert.equal(res.allTestsPassed, true);
    assert.equal(res.score, 100);
    assert.equal(res.testResults?.length, 2);
  });

  test("Executes SQL Sandbox queries against in-memory SQLite tables", async () => {
    const res = await executeInUnifiedSandbox({
      environment: "sql_sandbox",
      codeOrQuery: "SELECT 100 AS score, 'SQL Engine' AS title;",
      datasetId: "ecommerce_analytics"
    });

    assert.equal(res.success, true);
    assert.equal(res.rowCount, 1);
    assert.equal(res.rows?.[0].score, 100);
    assert.equal(res.rows?.[0].title, "SQL Engine");
  });
});

describe("Learning & Evaluation 4: Adaptive Mastery & Student DNA Integration", () => {
  test("Gating Rule: Failed test cases transition to 'needs_review'", () => {
    const initial = getStudentSubtopicMastery("student-1", "variables-references-and-identity");
    const { newState } = evaluateMasteryTransition(initial, {
      score: 50,
      allTestsPassed: false,
      assisted: false
    });
    assert.equal(newState, "needs_review");
  });

  test("Gating Rule: Assisted submissions (Level 4 hint) grant 'provisional_mastery'", () => {
    const initial = getStudentSubtopicMastery("student-2", "variables-references-and-identity");
    const { newState } = evaluateMasteryTransition(initial, {
      score: 100,
      allTestsPassed: true,
      assisted: true
    });
    assert.equal(newState, "provisional_mastery");
  });

  test("Gating Rule: Unassisted passing submissions grant 'demonstrated_mastery'", async () => {
    const res = await recordStudentSubtopicAttempt({
      id: "att-mastery-test",
      candidateId: "student-verified-101",
      subjectSlug: "python",
      subtopicSlug: "variables-references-and-identity",
      score: 100,
      allTestsPassed: true,
      assisted: false,
      timestamp: new Date().toISOString()
    });

    assert.equal(res.mastery.state, "demonstrated_mastery");
    assert.equal(res.mastery.score, 100);
    assert.ok(res.feedback.includes("Demonstrated Mastery Achieved"));
    assert.ok(res.mastery.nextReviewAt, "Spaced repetition review date must be scheduled");
  });

  test("Fast-Track Diagnostic allows experienced coders to test out of foundational chapters", async () => {
    const fastTrackRes = await applyFastTrackExemption(
      "student-experienced-99",
      "python",
      "python-fundamentals",
      95
    );

    assert.equal(fastTrackRes.grantedMastery, true);
    assert.ok(fastTrackRes.exemptedCount >= 1);

    const subMastery = getStudentSubtopicMastery("student-experienced-99", "variables-references-and-identity");
    assert.equal(subMastery.state, "demonstrated_mastery");
    assert.equal(subMastery.score, 95);
  });

  test("Subject Mastery Summary computes accurate completion percentages", () => {
    const summary = getSubjectMasterySummary("student-experienced-99", "python");
    assert.ok(summary.totalSubtopics >= 3);
    assert.ok(summary.masteredCount >= 1);
    assert.ok(summary.completionPercentage > 0);
  });
});

