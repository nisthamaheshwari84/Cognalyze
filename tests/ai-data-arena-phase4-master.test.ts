/**
 * tests/ai-data-arena-phase4-master.test.ts
 * 
 * Master Test Suite for AI Teacher Co-Construction, Fresh Problem Engine,
 * Historical Company Interview Intelligence, and Visual Dry-Run Tracer.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getTopicTeacherPackage,
  validateCoBuildSlotInput,
  validateDebugFix,
  TEACHER_PACKAGES_REGISTRY
} from "../lib/skills/ai-data/ai-teacher-engine";

import {
  generateFreshProblem,
  getAllProblemFamilies,
  getAllIndustryDomains,
  ProblemFamily
} from "../lib/skills/ai-data/fresh-problem-engine";

import {
  getHistoricalCompanyQuestions,
  getHistoricalCompanyQuestionById,
  HISTORICAL_COMPANY_QUESTIONS_BANK
} from "../lib/skills/ai-data/historical-company-bank";

import {
  getDryRunTrace,
  listAvailableDryRunTraces
} from "../lib/skills/ai-data/dry-run-visualizer";

describe("Phase 4 Master: AI Teacher Co-Construction Engine (Modes A-F)", () => {
  it("provides comprehensive 6-mode packages for all registered topics", () => {
    const topicKeys = Object.keys(TEACHER_PACKAGES_REGISTRY);
    assert.ok(topicKeys.length >= 3, "Expected at least 3 distinct topic packages");

    for (const key of topicKeys) {
      const pkg = getTopicTeacherPackage(key);
      assert.ok(pkg.topicSlug, "Topic slug must exist");
      assert.ok(pkg.title, "Title must exist");
      assert.ok(pkg.modeA.spokenTranscript.length > 20, "Spoken transcript must exist");
      assert.ok(pkg.modeA.intuitiveAnalogy.length > 10, "Analogy must exist");
      assert.ok(pkg.modeA.formalDefinition.length > 10, "Formal definition must exist");
      assert.ok(pkg.modeB.blocks.length >= 2, "Mode B must contain at least 2 construction blocks");
      assert.ok(pkg.modeC.slots.length >= 1, "Mode C must contain co-build slots");
      assert.ok(pkg.modeD.fault.buggyCodeOrConfig, "Mode D must contain injected fault");
      assert.ok(pkg.modeE.challengeSlug, "Mode E must reference transfer challenge");
    }
  });

  it("Mode C: validateCoBuildSlotInput validates correct student code pattern", () => {
    const pkg = getTopicTeacherPackage("python-rolling-stats");
    const slot = pkg.modeC.slots[0];
    
    // Correct input
    const validCode = "next_point = round(alpha * val + (1.0 - alpha) * ema[-1], 2)\nema.append(next_point)";
    const resValid = validateCoBuildSlotInput(slot, validCode);
    assert.equal(resValid.isValid, true);
    assert.match(resValid.feedback, /satisfies the architectural requirement/);

    // Incorrect input
    const invalidCode = "ema.append(val)";
    const resInvalid = validateCoBuildSlotInput(slot, invalidCode);
    assert.equal(resInvalid.isValid, false);
    assert.match(resInvalid.feedback, /Hint:/);
  });

  it("Mode D: validateDebugFix verifies elimination of injected fault", () => {
    const pkg = getTopicTeacherPackage("python-rolling-stats");
    const fault = pkg.modeD.fault;

    // Passing fix
    const resFixed = validateDebugFix(fault, fault.correctCodeOrConfig);
    assert.equal(resFixed.isFixed, true);
    assert.match(resFixed.feedback, /Fix verified/);

    // Failing fix (retaining buggy line)
    const resBuggy = validateDebugFix(fault, fault.buggyCodeOrConfig);
    assert.equal(resBuggy.isFixed, false);
    assert.match(resBuggy.feedback, /still present/);
  });
});

describe("Phase 4 Master: Dynamic Fresh Problem Engine (15 Families)", () => {
  it("registers all 15 canonical problem families and 8 industry domains", () => {
    const families = getAllProblemFamilies();
    const domains = getAllIndustryDomains();
    assert.equal(families.length, 15, "Expected exactly 15 canonical problem families");
    assert.equal(domains.length, 8, "Expected 8 industry domains");
    assert.ok(families.includes("data_pipeline_schema_drift"));
    assert.ok(families.includes("token_bucket_rate_limiter"));
    assert.ok(families.includes("rag_retrieval_reciprocal_rank"));
    assert.ok(families.includes("feature_target_leakage"));
    assert.ok(families.includes("sql_cohort_churn_retention"));
  });

  it("generates a fresh, quality-verified challenge with complete metadata", async () => {
    const challenge = await generateFreshProblem({
      problemFamily: "token_bucket_rate_limiter",
      industryDomain: "fintech",
      difficulty: "intermediate",
      seed: 42109
    });

    assert.ok(challenge.id.startsWith("fresh-token_bucket_rate_limiter-fintech"));
    assert.equal(challenge.provenance.type, "fresh_generated");
    assert.equal(challenge.provenance.auditStatus, "QUALITY_VERIFIED");
    assert.equal(challenge.qualityGatePassed, true);
    assert.ok(challenge.scenario.includes("fintech"));
    assert.ok(challenge.starterCodeOrQuery.includes("class TokenBucketRateLimiter"));
    assert.ok(challenge.referenceSolution.includes("self.tokens"));
    assert.ok(challenge.visibleTestCases.length >= 1);
    assert.ok(challenge.hiddenTestCases.length >= 1);
    assert.ok(challenge.scaffoldingHints.level1Conceptual);
  });

  it("generates distinct challenges across multiple families without crashes", async () => {
    const testFamilies: ProblemFamily[] = [
      "data_pipeline_schema_drift",
      "rag_retrieval_reciprocal_rank",
      "feature_target_leakage",
      "sql_cohort_churn_retention",
      "psi_population_stability_index",
      "prompt_injection_guardrail"
    ];

    for (const fam of testFamilies) {
      const chal = await generateFreshProblem({
        problemFamily: fam,
        industryDomain: "healthtech",
        seed: 1000 + fam.length
      });
      assert.equal(chal.problemFamily, fam);
      assert.equal(chal.qualityGatePassed, true);
      assert.ok(chal.title.includes("HEALTHTECH"));
    }
  });

  it("detects semantic duplicates and shifts variant number", async () => {
    const c1 = await generateFreshProblem({
      problemFamily: "vector_cosine_distance_search",
      industryDomain: "ecommerce",
      seed: 9999
    });

    const c2 = await generateFreshProblem({
      problemFamily: "vector_cosine_distance_search",
      industryDomain: "ecommerce",
      seed: 9999
    });

    assert.notEqual(c1.id, c2.id, "Duplicate seed should trigger variant mutation for novelty");
  });
});

describe("Phase 4 Master: Historical Company Technical Question Bank", () => {
  it("resolves the 'limited to 2 questions' bug with comprehensive bank", () => {
    assert.ok(
      HISTORICAL_COMPANY_QUESTIONS_BANK.length >= 10,
      `Expected at least 10 verified historical company questions, got ${HISTORICAL_COMPANY_QUESTIONS_BANK.length}`
    );
  });

  it("supports company-specific filtering with full metadata and solution blueprint", () => {
    const stripeQuestions = getHistoricalCompanyQuestions({ companySlug: "stripe" });
    assert.ok(stripeQuestions.questions.length >= 1);
    const q = stripeQuestions.questions[0];
    assert.equal(q.companyName, "Stripe");
    assert.equal(q.provenance.type, "verified_historical");
    assert.ok(q.solutionBlueprint.timeComplexity);
    assert.ok(q.solutionBlueprint.spaceComplexity);
    assert.ok(q.commonPitfalls.length >= 2);
    assert.ok(q.followUpQuestions.length >= 2);
  });

  it("supports role and keyword search filtering", () => {
    const googleRes = getHistoricalCompanyQuestions({ searchQuery: "Attention" });
    assert.ok(googleRes.questions.length >= 1);
    assert.equal(googleRes.questions[0].companyName, "Google");

    const singleQ = getHistoricalCompanyQuestionById("google-ai-01");
    assert.ok(singleQ);
    assert.equal(singleQ?.id, "google-ai-01");
  });

  it("verifies multi-company representation across Tier-1 tech", () => {
    const companies = new Set(HISTORICAL_COMPANY_QUESTIONS_BANK.map((q) => q.companyName));
    assert.ok(companies.has("Google"));
    assert.ok(companies.has("Stripe"));
    assert.ok(companies.has("Meta"));
    assert.ok(companies.has("OpenAI"));
    assert.ok(companies.has("Netflix"));
    assert.ok(companies.has("Snowflake"));
    assert.ok(companies.has("Amazon"));
    assert.ok(companies.has("Databricks"));
  });
});

describe("Phase 4 Master: Visual Dry-Run Studio & Step-by-Step Tracer", () => {
  it("returns step-by-step trace with line pointers and variable states", () => {
    const trace = getDryRunTrace("rolling-average-trace");
    assert.equal(trace.id, "rolling-average-trace");
    assert.ok(trace.steps.length >= 4);

    const step1 = trace.steps[0];
    assert.equal(step1.stepIndex, 1);
    assert.ok(step1.variables.length >= 2);
    assert.ok(step1.spokenNarration.length > 10);
    assert.ok(step1.audioDurationSeconds > 0);

    const available = listAvailableDryRunTraces();
    assert.ok(available.length >= 2);
  });
});

