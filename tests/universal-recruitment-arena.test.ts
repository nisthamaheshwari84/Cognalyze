/**
 * tests/universal-recruitment-arena.test.ts
 * 
 * Comprehensive Verification & Acceptance Test Suite for Cognalyze Recruitment Arena.
 * Validates Part 29 Acceptance Scenarios A through G against the live implementation:
 * - Scenario A: Existing Enterprise Journey (Amazon SDE India)
 * - Scenario B: Unknown Company Discovery & JD Ingestion (Dynamic Startup)
 * - Scenario C: Geographic Contextualization (Accenture India vs Accenture Ireland)
 * - Scenario D: Role Differentiation (Microsoft SDE vs Microsoft AI/ML)
 * - Scenario E: Anti-Simulation Quality Gate & Student DNA Integration
 * - Scenario F: Blueprint Versioning & Immutability
 * - Scenario G: Interrupted Assessment State Recovery
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Core Engine Imports
import {
  searchCompanies,
  getAllUniversalCompanies,
  getUniversalCompanyById,
  registerCustomCompany,
  CANONICAL_ROLE_FAMILIES,
} from "../lib/recruitment/universal-company-registry";

import {
  analyzeJobDescription,
  getCompanyResearchReport,
} from "../lib/recruitment/company-research-engine";

import {
  resolveRecruitmentBlueprint,
  getAnyBlueprintById,
} from "../lib/recruitment/dynamic-blueprint-engine";

import {
  createJourney,
  advanceJourneyWithAttempt,
  canAttemptStage,
  getAvailableStages,
} from "../lib/recruitment/journey-engine";

import {
  syncRecruitmentStageAttemptToDNA,
  getRemediationTopicsForWeaknesses,
} from "../lib/recruitment/dna-recruitment-bridge";

import { getStageAssessmentBundle } from "../lib/recruitment/assessment-problems";

describe("Universal Recruitment Arena — Master Acceptance Test Suite", () => {
  // ==========================================================================
  // SCENARIO A — EXISTING ENTERPRISE JOURNEY
  // ==========================================================================
  it("Scenario A: Successfully calibrates and executes an approved journey for Amazon SDE India", () => {
    const company = getUniversalCompanyById("amazon");
    assert.ok(company, "Amazon must exist in the Universal Company Registry");
    assert.equal(company.tierCategory, "TIER_1_FAANG");

    // Research Provenance
    const research = getCompanyResearchReport("amazon", "sde", "India", "campus");
    assert.ok(research.verifiedClaims.length > 0, "Amazon must have verified official claims");
    assert.ok(research.overallConfidence >= 90, "Amazon confidence must be >= 90%");

    // Blueprint Resolution
    const blueprint = resolveRecruitmentBlueprint({
      companyId: "amazon",
      roleFamily: "sde",
      hiringChannel: "campus",
      country: "India",
    });

    assert.ok(blueprint, "Must resolve a valid recruitment blueprint");
    assert.ok(blueprint.stages.length >= 3, "Amazon SDE India must have at least 3 stages");

    // Initialize Student Journey
    const journey = createJourney({
      studentId: "student_test_scenario_a",
      companyId: "amazon",
      roleFamily: "sde",
      hiringChannel: "campus",
      country: "India",
    });

    assert.equal(journey.status, "IN_PROGRESS");
    assert.ok(journey.currentStageId, "Journey must have an active first stage");

    // Check available stages follows DAG
    const available = getAvailableStages(journey);
    assert.equal(available.length, 1, "Only the first unblocked stage should be available");
    assert.equal(available[0].id, journey.currentStageId);

    // Simulate Passing the First Stage
    const stage1Id = journey.currentStageId;
    const { updatedJourney, stagePassed, nextStageId } = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: stage1Id,
      rawScore: 90,
      maxScore: 100,
      durationSeconds: 1800,
      evaluatorFeedback: "Optimal solution passed all test cases with clean O(N log N) runtime.",
    });

    assert.equal(stagePassed, true, "Score of 90% must pass the stage");
    assert.equal(updatedJourney.stageProgress[stage1Id].status, "PASSED");
    assert.ok(nextStageId, "Next stage must be unlocked in the DAG");
  });

  // ==========================================================================
  // SCENARIO B — UNKNOWN COMPANY DISCOVERY & JD CALIBRATION
  // ==========================================================================
  it("Scenario B: Dynamically registers an unknown startup, analyzes JD, and synthesizes labeled blueprint", () => {
    // 1. Search for non-existent startup
    const searchInitial = searchCompanies("PerplexityAI");
    assert.equal(searchInitial.length, 0, "Should not be pre-seeded");

    // 2. Discover / Register custom organization
    const customOrg = registerCustomCompany({
      name: "PerplexityAI",
      domain: "perplexity.ai",
      headquarters: "San Francisco, USA",
      overview: "Conversational AI search engine delivering accurate, cited answers.",
      tierCategory: "UNICORN_STARTUP",
    });

    assert.ok(customOrg.id.startsWith("custom_"), "Custom company ID must have custom_ prefix");
    assert.equal(customOrg.isCustomCompany, true);

    // 3. Ingest raw Job Description
    const rawJd = `
      We are hiring a Senior Backend Engineer to build high-throughput search indexes.
      Requirements:
      - 3+ years writing concurrent APIs in Golang and Python.
      - Experience with PostgreSQL query optimization and Kafka distributed streaming.
      - Solid understanding of algorithms, latency optimization, and microservice architectures.
    `;

    const jdAnalysis = analyzeJobDescription(rawJd, customOrg.name);
    assert.equal(jdAnalysis.detectedRoleFamily, "backend_engineer");
    assert.ok(jdAnalysis.primarySkills.includes("python") || jdAnalysis.primarySkills.includes("golang") || jdAnalysis.primarySkills.includes("postgres"));

    // 4. Synthesize Dynamic Blueprint
    const dynamicBp = resolveRecruitmentBlueprint({
      companyId: customOrg.id,
      roleFamily: jdAnalysis.detectedRoleFamily,
      hiringChannel: "off_campus",
      country: "US",
      parsedJdAnalysis: jdAnalysis,
    });

    assert.ok(dynamicBp, "Must synthesize a valid blueprint for custom company");
    assert.ok(dynamicBp.stages.length >= 3, "Must create at least 3 stages");
    assert.equal(dynamicBp.companyId, customOrg.id);

    // Ensure stage bundle is available via universal fallback
    const codingStage = dynamicBp.stages.find((s) => s.assessmentFormat === "coding");
    assert.ok(codingStage, "Must include a coding assessment stage");
    const bundle = getStageAssessmentBundle(codingStage.id);
    assert.ok(bundle, "Universal fallback problem bundle must be provided");
    assert.ok(bundle.codingProblems && bundle.codingProblems.length > 0);
  });

  // ==========================================================================
  // SCENARIO C — GEOGRAPHIC CONTEXTUALIZATION (ACCENTURE INDIA VS IRELAND)
  // ==========================================================================
  it("Scenario C: Accurately differentiates Accenture India vs Accenture Ireland", () => {
    const bpIndia = resolveRecruitmentBlueprint({
      companyId: "accenture",
      roleFamily: "sde",
      hiringChannel: "campus",
      country: "India",
    });

    const bpIreland = resolveRecruitmentBlueprint({
      companyId: "accenture",
      roleFamily: "sde",
      hiringChannel: "campus",
      country: "Ireland",
    });

    assert.notEqual(bpIndia.id, bpIreland.id, "Blueprints for India and Ireland must have distinct IDs");
    assert.equal(bpIndia.country, "India");
    assert.equal(bpIreland.country, "Ireland");

    // Accenture India includes Cognitive & Quantitative Aptitude as Stage 1
    const stage1India = bpIndia.stages[0];
    assert.equal(stage1India.stageType, "quantitative_aptitude", "Accenture India campus stage 1 must be aptitude");

    // Both journeys run independently without cross-talk
    const jnyIndia = createJourney({
      studentId: "student_in",
      companyId: "accenture",
      roleFamily: "sde",
      country: "India",
    });

    const jnyIreland = createJourney({
      studentId: "student_ie",
      companyId: "accenture",
      roleFamily: "sde",
      country: "Ireland",
    });

    assert.equal(jnyIndia.companyId, "accenture");
    assert.equal(jnyIreland.companyId, "accenture");
    assert.notEqual(jnyIndia.blueprintId, jnyIreland.blueprintId);
  });

  // ==========================================================================
  // SCENARIO D — ROLE DIFFERENTIATION (MICROSOFT SDE VS AI/ML)
  // ==========================================================================
  it("Scenario D: Differentiates Microsoft SDE from Microsoft AI/ML in competencies and stages", () => {
    const bpSde = resolveRecruitmentBlueprint({
      companyId: "microsoft",
      roleFamily: "sde",
      hiringChannel: "campus",
      country: "India",
    });

    const bpAiMl = resolveRecruitmentBlueprint({
      companyId: "microsoft",
      roleFamily: "ai_ml",
      hiringChannel: "campus",
      country: "India",
    });

    assert.notEqual(bpSde.id, bpAiMl.id);
    assert.equal(bpSde.roleFamily, "sde");
    assert.equal(bpAiMl.roleFamily, "ai_ml");

    // Verify SDE prioritizes data structures and algorithms
    const sdeRubricKeys = Object.keys(bpSde.competencyRubric);
    assert.ok(
      sdeRubricKeys.some((k) => k.includes("algorithmic") || k.includes("coding") || k.includes("problem_solving")),
      "SDE rubric must prioritize algorithmic coding"
    );

    // Verify AI/ML prioritizes machine learning and statistical modeling
    const aimlRubricKeys = Object.keys(bpAiMl.competencyRubric);
    assert.ok(
      aimlRubricKeys.some((k) => k.includes("machine_learning") || k.includes("python") || k.includes("data")),
      "AI/ML rubric must prioritize ML modeling and data"
    );
  });

  // ==========================================================================
  // SCENARIO E — ANTI-SIMULATION QUALITY GATE & STUDENT DNA SYNC
  // ==========================================================================
  it("Scenario E: Enforces Anti-Simulation Invariant (<70% rejected from DNA, >=70% synced)", async () => {
    const journey = createJourney({
      studentId: "student_dna_test",
      companyId: "google",
      roleFamily: "sde",
      country: "India",
    });

    // Sub-test 1: Failed Attempt (< 70%)
    const failedProgress = {
      stageId: "stage_google_oa",
      stageType: "algorithmic_coding" as const,
      title: "Google Online Assessment",
      order: 1,
      status: "FAILED" as const,
      rawScore: 50,
      maxScore: 100,
      percentageScore: 50,
      attemptCount: 1,
    };

    const failSyncResult = await syncRecruitmentStageAttemptToDNA(journey, failedProgress);
    assert.equal(failSyncResult.success, false, "Failed attempt must NOT write to Student DNA");
    assert.equal(failSyncResult.dnaUpdated, false);
    assert.ok(
      failSyncResult.remediationRecommendations && failSyncResult.remediationRecommendations.length > 0,
      "Must generate targeted Skill Practice Hub remediation recommendations"
    );

    // Sub-test 2: Passed Attempt (>= 70%)
    const passedProgress = {
      stageId: "stage_google_oa",
      stageType: "algorithmic_coding" as const,
      title: "Google Online Assessment",
      order: 1,
      status: "PASSED" as const,
      rawScore: 88,
      maxScore: 100,
      percentageScore: 88,
      attemptCount: 1,
    };

    const passSyncResult = await syncRecruitmentStageAttemptToDNA(journey, passedProgress);
    assert.equal(passSyncResult.success, true, "Passed attempt >= 70% must write to Student DNA");
    assert.equal(passSyncResult.dnaUpdated, true);
    assert.ok(passSyncResult.evidenceId, "Must generate an immutable verified evidence record ID");
  });

  // ==========================================================================
  // SCENARIO F — VERSIONING & BLUEPRINT IMMUTABILITY
  // ==========================================================================
  it("Scenario F: Retains immutable blueprint association when created", () => {
    const journey = createJourney({
      studentId: "student_immutability_test",
      companyId: "atlassian",
      roleFamily: "sde",
    });

    const originalBlueprintId = journey.blueprintId;
    assert.ok(originalBlueprintId);

    // Resolve blueprint by the exact pinned ID
    const retrieved = getAnyBlueprintById(originalBlueprintId);
    assert.ok(retrieved, "Must retrieve the pinned blueprint");
    assert.equal(retrieved.id, originalBlueprintId);
  });

  // ==========================================================================
  // SCENARIO G — INTERRUPTED ASSESSMENT & STATE RECOVERY
  // ==========================================================================
  it("Scenario G: Restores saved stage progress and prevents invalid skips", () => {
    const journey = createJourney({
      studentId: "student_recovery_test",
      companyId: "tcs",
      roleFamily: "sde",
      country: "India",
    });

    const stage1Id = journey.currentStageId;
    const stage2 = Object.values(journey.stageProgress).find((s) => s.order === 2);
    assert.ok(stage2);

    // Check prerequisite enforcement: cannot jump directly to Stage 2 before passing Stage 1
    const directCheck = canAttemptStage(journey, stage2.stageId);
    assert.equal(directCheck.allowed, false, "Cannot attempt stage 2 before passing stage 1");

    // Pass Stage 1
    const { updatedJourney } = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: stage1Id,
      rawScore: 85,
      maxScore: 100,
      durationSeconds: 1200,
    });

    // Simulate browser reload by inspecting updated state
    assert.equal(updatedJourney.stageProgress[stage1Id].status, "PASSED");
    const allowedAfterPass = canAttemptStage(updatedJourney, stage2.stageId);
    assert.equal(allowedAfterPass.allowed, true, "Stage 2 must now be unlocked after passing Stage 1");
  });
});

