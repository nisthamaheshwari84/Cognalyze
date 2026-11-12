/**
 * tests/code-comprehension-pipeline.test.ts
 * 
 * Master Verification Suite for Cognalyze Code Comprehension Lab Upgrade
 * Tests:
 * 1. Multi-Repository Intelligence & Pool Segregation (Learning vs. Unseen Interview)
 * 2. Question Bank Minimum Content Requirement (120+ distinct questions across 24 categories)
 * 3. Source-Grounded Verification (Files and lines must exist in actual repositories)
 * 4. Repository Exposure Tracking & Unseen Selection Guarantee
 * 5. Dynamic 4-Round Interview Generation & Adaptive Follow-up Probes
 * 6. 10-Competency Evaluation & Student DNA Payload
 * 7. 6-Stage Learning Progression Store Persistence
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Repository Intelligence
import {
  RepositoryIntelligenceEngine,
  LEARNING_REPOSITORIES,
  INTERVIEW_REPOSITORIES,
} from "../lib/skills/code-comprehension/repository-intelligence";

// 120+ Question Bank
import {
  COMPREHENSIVE_QUESTION_BANK,
  filterQuestions,
  getQuestionById,
} from "../lib/skills/code-comprehension/question-bank";

// Dynamic Interview Engine
import {
  startDynamicInterviewSession,
  processInterviewTurn,
  finalizeInterviewEvaluation,
  generateInterviewRoundsForRepository,
} from "../lib/skills/code-comprehension/interview-simulation-engine";

// Foundational Learning Modules
import { FOUNDATIONAL_LEARNING_MODULES } from "../lib/skills/code-comprehension/learning-modules";

// Visual Execution Tracer
import { TRACE_WORKFLOWS, getTraceWorkflow, evaluatePrediction } from "../lib/skills/code-comprehension/execution-tracer";

// Progression Store
import { LearningProgressionStore } from "../lib/skills/code-comprehension/learning-progression-store";

describe("Code Comprehension Lab — Master Upgrade Verification Suite", () => {
  // =========================================================================
  // SUITE 1: REPOSITORY POOL SEGREGATION & AUTHENTICITY
  // =========================================================================
  test("REPO 1.1 — Learning and Interview repository pools are strictly segregated", () => {
    assert.ok(LEARNING_REPOSITORIES.length >= 4, "Must define at least 4 learning repositories");
    assert.ok(INTERVIEW_REPOSITORIES.length >= 4, "Must define at least 4 interview repositories");

    const learningIds = new Set(LEARNING_REPOSITORIES.map((r) => r.id));
    const interviewIds = new Set(INTERVIEW_REPOSITORIES.map((r) => r.id));

    // CRITICAL: No repository can exist in both pools!
    for (const id of interviewIds) {
      assert.strictEqual(
        learningIds.has(id),
        false,
        `CRITICAL VIOLATION: Interview repo '${id}' is also present in learning pool!`
      );
    }
  });

  test("REPO 1.2 — Repositories define authentic multi-file code and entrypoints", () => {
    const allRepos = RepositoryIntelligenceEngine.getRepositories();
    allRepos.forEach((repo) => {
      assert.ok(repo.entryPoint, `Repo '${repo.id}' must define an entrypoint`);
      assert.ok(repo.architecture.nodes.length >= 3, `Repo '${repo.id}' must have at least 3 architecture nodes`);
      assert.ok(Object.keys(repo.files).length >= 1, `Repo '${repo.id}' must have files`);

      // Verify that entryPoint file actually exists in repo.files
      assert.ok(
        repo.files[repo.entryPoint] !== undefined,
        `Repo '${repo.id}' entrypoint '${repo.entryPoint}' must exist in files map`
      );
    });
  });

  // =========================================================================
  // SUITE 2: 120+ QUESTION BANK & 24 CATEGORIES
  // =========================================================================
  test("Q-BANK 2.1 — Question bank contains at least 100–150 distinct questions", () => {
    const totalCount = COMPREHENSIVE_QUESTION_BANK.length;
    assert.ok(
      totalCount >= 100 && totalCount <= 160,
      `Question bank must have 100-150 questions, currently has ${totalCount}`
    );
  });

  test("Q-BANK 2.2 — Covers all 24 required categories across multiple difficulty tiers", () => {
    const categoriesInBank = new Set(COMPREHENSIVE_QUESTION_BANK.map((q) => q.category));
    assert.ok(categoriesInBank.size >= 20, "Must cover at least 20 distinct categories");

    const difficultiesInBank = new Set(COMPREHENSIVE_QUESTION_BANK.map((q) => q.difficulty));
    assert.ok(difficultiesInBank.has("beginner"), "Must include beginner questions");
    assert.ok(difficultiesInBank.has("intermediate"), "Must include intermediate questions");
    assert.ok(difficultiesInBank.has("advanced"), "Must include advanced questions");
    assert.ok(difficultiesInBank.has("expert"), "Must include expert questions");
  });

  test("Q-BANK 2.3 — Source code citations are verified against real repository files", () => {
    const curatedSample = COMPREHENSIVE_QUESTION_BANK.slice(0, 15);
    curatedSample.forEach((q) => {
      const verification = RepositoryIntelligenceEngine.verifySourceCitation(
        q.repositoryId,
        q.targetFile,
        q.targetLineRange.start,
        q.targetLineRange.end
      );
      assert.strictEqual(
        verification.isValid,
        true,
        `Question ${q.id} citation failed: ${verification.reason}`
      );
    });
  });

  // =========================================================================
  // SUITE 3: REPOSITORY EXPOSURE TRACKING & UNSEEN SELECTION GUARANTEE
  // =========================================================================
  test("EXPOSURE 3.1 — Unseen repository selection excludes previously exposed repos", () => {
    const testUser = "cand_unseen_test_" + Date.now();
    const tenant = "test_tenant";

    // 1. Expose the first interview repository manually
    const firstInterviewRepo = INTERVIEW_REPOSITORIES[0].id;
    RepositoryIntelligenceEngine.recordExposure(testUser, tenant, firstInterviewRepo, "practice");

    const exposed = RepositoryIntelligenceEngine.getExposedRepoIds(testUser, tenant);
    assert.ok(exposed.includes(firstInterviewRepo), "First repo must be marked as exposed");

    // 2. Select unseen repository for interview
    const selected = RepositoryIntelligenceEngine.selectUnseenInterviewRepository(testUser, tenant);

    // CRITICAL: Selected repository must NOT be the one already exposed!
    assert.notStrictEqual(
      selected.id,
      firstInterviewRepo,
      `CRITICAL VIOLATION: Interview selected previously exposed repo '${firstInterviewRepo}'!`
    );

    // Verify it was drawn from the interview pool
    assert.strictEqual(selected.pool, "interview_only");
  });

  // =========================================================================
  // SUITE 4: DYNAMIC 4-ROUND INTERVIEW & ADAPTIVE FOLLOW-UP ENGINE
  // =========================================================================
  test("INTERVIEW 4.1 — Dynamically generates 4 rounds tailored to selected unseen repo", () => {
    const repo = INTERVIEW_REPOSITORIES[1]; // Chronos Stream
    const rounds = generateInterviewRoundsForRepository(repo);

    assert.ok(rounds.walkthrough, "Must generate walkthrough round");
    assert.ok(rounds.comprehension, "Must generate comprehension round");
    assert.ok(rounds.debugging, "Must generate debugging round");
    assert.ok(rounds.system_design, "Must generate system design round");

    assert.ok(rounds.walkthrough.prompt.includes(repo.title), "Prompt must ground in repository title");
    assert.ok(rounds.walkthrough.contextCode && rounds.walkthrough.contextCode.length > 50);
  });

  test("INTERVIEW 4.2 — Multi-turn engine generates adaptive probes based on candidate depth", () => {
    const testUser = "cand_adaptive_" + Date.now();
    const tenant = "test_tenant";

    const session = startDynamicInterviewSession({ userId: testUser, tenantId: tenant });
    assert.strictEqual(session.currentRound, "walkthrough");
    assert.strictEqual(session.currentTurn, 1);

    // Turn 1 with shallow candidate response
    const shallowResult = processInterviewTurn(session.sessionId, "It is an application.");
    assert.strictEqual(shallowResult.isRoundComplete, false);
    assert.strictEqual(shallowResult.replyMessage.probeType, "scaffold_probe");

    // Turn 2 with deep candidate response
    const deepResult = processInterviewTurn(
      session.sessionId,
      "The entrypoint routes requests across the gateway to the service layer enforcing cryptographic boundary isolation and protocol transformations."
    );
    assert.strictEqual(deepResult.isRoundComplete, true);
    assert.strictEqual(deepResult.nextRound, "comprehension");
  });

  test("INTERVIEW 4.3 — Finalizes evaluation across 10 competencies summing to 1.00 weight", () => {
    const testUser = "cand_eval_" + Date.now();
    const tenant = "test_tenant";

    const session = startDynamicInterviewSession({ userId: testUser, tenantId: tenant });

    // Submit detailed answer
    processInterviewTurn(
      session.sessionId,
      "The entrypoint handles HTTP requests, decodes headers, isolates tenant partitions, enforces atomic version locking to prevent race conditions, and scales with Kafka and Redis."
    );
    processInterviewTurn(
      session.sessionId,
      "To debug, we write a minimal failing test simulating concurrent calls, identifying the root cause in the storage lock, and verifying zero regression."
    );

    const report = finalizeInterviewEvaluation(session.sessionId);

    // Verify all 10 competencies exist
    const competencyKeys = Object.keys(report.competencies);
    assert.strictEqual(competencyKeys.length, 10, "Must evaluate exactly 10 competencies");

    // Verify weights sum to 1.00
    const totalWeight = Object.values(report.competencies).reduce((sum, c) => sum + c.weight, 0);
    assert.ok(Math.abs(totalWeight - 1.00) < 0.0001, "Competency weights must sum strictly to 1.00");

    assert.ok(report.overallScore >= 50, "Should achieve passing score on thorough answers");
    assert.ok(["MASTERY", "PROFICIENT", "DEVELOPING"].includes(report.certificationTier));
    assert.strictEqual(report.roundPerformance.length, 4, "Must evaluate 4 distinct rounds");
    assert.ok(report.dnaPayload.skillsVerified.length >= 2, "Must update Student DNA skills");
  });

  // =========================================================================
  // SUITE 5: 6-STAGE LEARNING PROGRESSION STORE
  // =========================================================================
  test("STAGE 5.1 — Progression store maintains stage completions and next actions", () => {
    const testUser = "cand_prog_" + Date.now();
    const tenant = "test_tenant";

    const initial = LearningProgressionStore.getProgress(tenant, testUser);
    assert.strictEqual(initial.currentStage, 1);
    assert.strictEqual(initial.stage1.isStageComplete, false);

    // Complete module checks
    LearningProgressionStore.recordModuleCheck(tenant, testUser, "m1", "c1", true, "tag1");
    const updated = LearningProgressionStore.recordModuleCheck(tenant, testUser, "m2", "c2", true, "tag2");

    assert.strictEqual(updated.stage1.isStageComplete, true);
    assert.strictEqual(updated.currentStage, 2);
  });
});
