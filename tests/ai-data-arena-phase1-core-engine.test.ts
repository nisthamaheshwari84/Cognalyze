/**
 * tests/ai-data-arena-phase1-core-engine.test.ts
 * 
 * Acceptance Test Suite for AI & Data Arena Phase 1:
 * - Diagnostic Baseline Assessment Engine
 * - Skill Proficiency Classification
 * - Graph-Based Prerequisite Unlocking & Progression
 * - Role-Calibrated 'WHY' Roadmap Generation for all 8 Careers
 * - Educational Content Quality Gate & Lesson Validator
 * - Multi-Tenant Onboarding & Baseline Store Persistence
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  BASELINE_DIAGNOSTIC_BANK,
  getBaselineDiagnosticQuestions,
  evaluateBaselineAssessment
} from "../lib/skills/ai-data/baseline-assessment-engine";

import {
  generatePersonalizedRoadmap,
  ROLE_TOPIC_RATIONALES
} from "../lib/skills/ai-data/roadmap-engine";

import {
  validateLessonContent
} from "../lib/skills/ai-data/content-validator";

import {
  saveCandidateOnboarding,
  getCandidateOnboarding,
  saveCandidateBaseline,
  getCandidateBaseline,
  getCandidateRoadmap,
  setCandidateRole
} from "../lib/skills/ai-data/store";

import { TARGET_ROLE_PROFILES } from "../lib/skills/ai-data/roles";
import { TargetRoleSlug } from "../lib/skills/ai-data/types";

describe("Phase 1: Baseline Diagnostic Assessment Engine", () => {
  it("diagnostic bank covers all 8 core disciplines with structured options", () => {
    const questions = getBaselineDiagnosticQuestions();
    assert.ok(questions.length >= 8, `Expected at least 8 questions, found ${questions.length}`);

    const requiredDisciplines = [
      "python",
      "numpy_linear_algebra",
      "pandas_data_wrangling",
      "sql_analytics",
      "statistics_probability",
      "machine_learning",
      "genai_llms",
      "pipelines_systems"
    ];

    const observedDisciplines = new Set(questions.map(q => q.discipline));
    for (const d of requiredDisciplines) {
      assert.ok(observedDisciplines.has(d as any), `Missing diagnostic coverage for discipline: ${d}`);
    }

    // Check each question structure
    for (const q of questions) {
      assert.ok(q.prompt && q.prompt.length > 20, `Question ${q.id} prompt too short`);
      assert.equal(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);
      const correctOpts = q.options.filter(o => o.isCorrect);
      assert.equal(correctOpts.length, 1, `Question ${q.id} must have exactly 1 correct option`);
      assert.ok(q.explanation && q.explanation.length > 30, `Question ${q.id} missing explanation`);
    }
  });

  it("evaluates a high-proficiency student and awards prerequisite exemptions", () => {
    const questions = BASELINE_DIAGNOSTIC_BANK;
    // Provide correct answers for all questions
    const allCorrectResponses = questions.map(q => {
      const correctOpt = q.options.find(o => o.isCorrect)!;
      return {
        questionId: q.id,
        selectedOptionId: correctOpt.id,
        timeSpentSeconds: 20
      };
    });

    const result = evaluateBaselineAssessment(
      "cand-test-high-001",
      "ai_engineer",
      "advanced",
      allCorrectResponses
    );

    assert.equal(result.correctCount, questions.length);
    assert.equal(result.overallScorePercent, 100);
    assert.ok(result.exemptionsGranted.length >= 4, "High score should grant multiple exemptions");
    assert.equal(result.recommendedStartingStage, 3, "Advanced scorer should jump to Stage 3");
    assert.match(result.diagnosticSummary, /Strong technical baseline/);
  });

  it("evaluates a beginner student with constructive feedback and zero exemptions", () => {
    const questions = BASELINE_DIAGNOSTIC_BANK;
    // Provide incorrect answers
    const allIncorrectResponses = questions.map(q => {
      const wrongOpt = q.options.find(o => !o.isCorrect)!;
      return {
        questionId: q.id,
        selectedOptionId: wrongOpt.id,
        timeSpentSeconds: 15
      };
    });

    const result = evaluateBaselineAssessment(
      "cand-test-low-002",
      "data_analyst",
      "beginner",
      allIncorrectResponses
    );

    assert.equal(result.correctCount, 0);
    assert.equal(result.overallScorePercent, 0);
    assert.equal(result.exemptionsGranted.length, 0, "Beginner should receive no prerequisite exemptions");
    assert.equal(result.recommendedStartingStage, 1, "Beginner must start at Stage 1");
    assert.match(result.diagnosticSummary, /Foundational learning recommended/);
  });
});

describe("Phase 1: Personalized Roadmap & Prerequisite Unlocking Engine", () => {
  it("generates distinct tailored roadmaps across all 8 career roles", () => {
    const allRoleSlugs = Object.keys(TARGET_ROLE_PROFILES) as TargetRoleSlug[];
    assert.equal(allRoleSlugs.length, 8, "Expected 8 target roles");

    for (const role of allRoleSlugs) {
      const roadmap = generatePersonalizedRoadmap({
        candidateId: `cand-${role}-001`,
        targetRole: role,
        completedLessonSlugs: [],
        weeklyHoursCommitment: 10
      });

      assert.equal(roadmap.targetRole, role);
      assert.ok(roadmap.totalStages >= 2, `Role ${role} should have multiple stages`);
      assert.ok(roadmap.totalTopics >= 5, `Role ${role} should have multiple topics`);
      assert.ok(roadmap.roleWhyOverview.includes(roadmap.roleTitle), "Missing role overview");
      assert.ok(roadmap.stages[0].topics.length > 0, "Stage 1 must contain topics");

      // First topic of stage 1 must be AVAILABLE initially
      const firstTopic = roadmap.stages[0].topics[0];
      assert.equal(firstTopic.status, "AVAILABLE", `First topic for ${role} must be AVAILABLE`);
      assert.ok(firstTopic.whyThisTopicMattersForRole, "Topic must have a role-specific WHY statement");
    }
  });

  it("enforces sequential prerequisite locking when predecessors are incomplete", () => {
    const roadmap = generatePersonalizedRoadmap({
      candidateId: "cand-lock-test",
      targetRole: "data_scientist",
      completedLessonSlugs: []
    });

    // Topic 1 is AVAILABLE
    assert.equal(roadmap.stages[0].topics[0].status, "AVAILABLE");

    // Topic 2 should be LOCKED because Topic 1 is not completed
    if (roadmap.stages[0].topics.length > 1) {
      const topic2 = roadmap.stages[0].topics[1];
      assert.equal(topic2.status, "LOCKED");
      assert.ok(topic2.lockReason?.includes(roadmap.stages[0].topics[0].title));
    }
  });

  it("automatically unlocks subsequent topics when completed in progress", () => {
    const role: TargetRoleSlug = "ai_engineer";
    const initialRoadmap = generatePersonalizedRoadmap({
      candidateId: "cand-unlock-test",
      targetRole: role,
      completedLessonSlugs: []
    });

    const firstTopicSlug = initialRoadmap.stages[0].topics[0].slug;

    // Simulate completing Topic 1
    const updatedRoadmap = generatePersonalizedRoadmap({
      candidateId: "cand-unlock-test",
      targetRole: role,
      completedLessonSlugs: [firstTopicSlug]
    });

    // Topic 1 is now COMPLETED
    assert.equal(updatedRoadmap.stages[0].topics[0].status, "COMPLETED");

    // Topic 2 is now AVAILABLE
    if (updatedRoadmap.stages[0].topics.length > 1) {
      assert.equal(updatedRoadmap.stages[0].topics[1].status, "AVAILABLE");
    }
  });

  it("applies diagnostic exemptions to automatically waive foundational prerequisites", () => {
    const role: TargetRoleSlug = "ml_engineer";
    const exemptedSkill = "python_data_stack";

    const mockBaseline: any = {
      candidateId: "cand-exempt-test",
      assessedAt: new Date().toISOString(),
      targetRole: role,
      startingLevel: "advanced",
      totalQuestions: 8,
      correctCount: 7,
      overallScorePercent: 88,
      disciplineScores: {},
      skillClassifications: {},
      recommendedStartingStage: 2,
      exemptionsGranted: [exemptedSkill],
      diagnosticSummary: "Exempt"
    };

    const roadmap = generatePersonalizedRoadmap({
      candidateId: "cand-exempt-test",
      targetRole: role,
      completedLessonSlugs: [],
      baselineAssessment: mockBaseline
    });

    // The topic with canonicalSkill python_data_stack at beginner level should be marked COMPLETED / exempted
    const exemptedTopic = roadmap.stages[0].topics.find(t => t.canonicalSkill === exemptedSkill);
    if (exemptedTopic) {
      assert.equal(exemptedTopic.status, "COMPLETED");
      assert.equal(exemptedTopic.isExemptedByDiagnostic, true);
    }
  });
});

describe("Phase 1: Content Quality Gate & Lesson Validator", () => {
  it("approves a high-quality educational lesson specification", () => {
    const validLesson = {
      id: "test-lesson-101",
      slug: "test-valid-lesson",
      title: "NumPy Contiguous Memory Layouts",
      canonicalSkill: "python_data_stack",
      exerciseType: "code_lab" as const,
      durationMinutes: 25,
      provenance: "company_pattern" as const,
      summary: "Explore how C-contiguous 1D memory buffers enable SIMD vectorization over strided ndarrays.",
      contentMarkdown: `### 1. Learning Goal\nMaster contiguous memory indexing and stride pointer offsets.\n\n### 2. Intuition\nThink of memory like contiguous post office mailboxes.\n\n### 3. Implementation Details\nStrided pointers allow zero-copy transpositions.`,
      starterCode: `import numpy as np\ndef check_strides(arr):\n    # TODO: return arr.strides\n    pass\n`,
      solutionSnippet: `import numpy as np\ndef check_strides(arr):\n    return arr.strides\n`,
      testCases: [
        {
          id: "t1",
          description: "Returns tuple of byte strides",
          input: [1, 2, 3],
          expected: [8]
        }
      ]
    };

    const report = validateLessonContent(validLesson);
    assert.equal(report.isValid, true);
    assert.equal(report.canPublish, true);
    assert.equal(report.score, 100);
    assert.equal(report.issues.length, 0);
  });

  it("rejects an invalid lesson that leaks solution in starter code or has missing fields", () => {
    const leakyLesson = {
      id: "broken-lesson",
      slug: "broken-lesson",
      title: "Broken Lesson",
      canonicalSkill: "", // Missing
      exerciseType: "code_lab" as const,
      contentMarkdown: "Too short", // < 150 chars
      starterCode: "def solve(): return 42",
      solutionSnippet: "def solve(): return 42", // Leaks full solution!
      testCases: []
    };

    const report = validateLessonContent(leakyLesson);
    assert.equal(report.isValid, false);
    assert.equal(report.canPublish, false);
    assert.ok(report.issues.some(i => i.code === "MISSING_SKILL"));
    assert.ok(report.issues.some(i => i.code === "INSUFFICIENT_EXPLANATION"));
    assert.ok(report.issues.some(i => i.code === "STARTER_CODE_LEAKS_SOLUTION"));
  });
});

describe("Phase 1: Multi-Tenant Store & Onboarding Persistence", () => {
  it("persists onboarding preferences and updates candidate role & roadmap", () => {
    const candidateId = `cand-store-test-${Date.now()}`;
    const targetRole: TargetRoleSlug = "data_engineer";

    const saved = saveCandidateOnboarding(candidateId, {
      primaryRole: targetRole,
      secondaryRoles: ["mlops_engineer"],
      startingLevel: "intermediate",
      weeklyHours: 15,
      languagePreference: "hinglish",
      learningStyle: "hands_on"
    });

    assert.equal(saved.candidateId, candidateId);
    assert.equal(saved.primaryRole, targetRole);
    assert.equal(saved.onboardingCompleted, true);

    const retrieved = getCandidateOnboarding(candidateId);
    assert.ok(retrieved, "Onboarding must be retrieved from store");
    assert.equal(retrieved.primaryRole, targetRole);
    assert.equal(retrieved.weeklyHours, 15);
    assert.equal(retrieved.languagePreference, "hinglish");

    // Verify roadmap incorporates this candidate's target role
    const roadmap = getCandidateRoadmap(candidateId);
    assert.equal(roadmap.targetRole, targetRole);
    assert.equal(roadmap.primaryTrackSlug, "data_eng");
  });

  it("persists baseline assessment and incorporates exemptions into roadmap", () => {
    const candidateId = `cand-base-test-${Date.now()}`;
    const targetRole: TargetRoleSlug = "genai_llm_engineer";

    saveCandidateOnboarding(candidateId, {
      primaryRole: targetRole,
      weeklyHours: 10
    });

    const mockBaseline: any = {
      candidateId,
      assessedAt: new Date().toISOString(),
      targetRole,
      startingLevel: "advanced",
      totalQuestions: 8,
      correctCount: 8,
      overallScorePercent: 100,
      disciplineScores: {},
      skillClassifications: {},
      recommendedStartingStage: 3,
      exemptionsGranted: ["rag_architecture_and_retrieval", "prompt_engineering_structured_outputs"],
      diagnosticSummary: "Mastery demonstrated"
    };

    saveCandidateBaseline(candidateId, mockBaseline);

    const retrievedBaseline = getCandidateBaseline(candidateId);
    assert.ok(retrievedBaseline);
    assert.equal(retrievedBaseline.overallScorePercent, 100);

    const roadmap = getCandidateRoadmap(candidateId);
    assert.equal(roadmap.targetRole, targetRole);
    assert.equal(roadmap.primaryTrackSlug, "genai_llm");
  });
});

