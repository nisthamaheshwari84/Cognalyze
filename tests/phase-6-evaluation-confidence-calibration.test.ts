/**
 * tests/phase-6-evaluation-confidence-calibration.test.ts
 *
 * COGNALYZE PHASE 6 TEST MATRIX:
 * Evaluation, Confidence Calibration, Aging Decay, Contradiction Dampening & Role Readiness
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import {
  calibrateCapabilityScore,
  evaluateCandidateRoleReadiness,
  computeFreshness,
  evaluateDemonstratedProficiency,
  evaluateConfidenceTier,
  detectDiscrepancy,
  RoleSkillRequirement
} from "../lib/evidence/calibrated-scoring-engine";
import {
  CanonicalEvidenceItem,
  CanonicalVerificationEvent,
  CanonicalClaimRecord
} from "../lib/evidence/canonical-types";

describe("PHASE 6: Calibrated Scoring, Confidence & Evaluation Engine", () => {

  test("1. Proficiency vs. Confidence Decoupling", () => {
    // A: High Confidence, Low Proficiency (Level 2 Beginner, but cryptographically verified via direct commit)
    const beginnerVerifiedItem: CanonicalEvidenceItem = {
      id: "ev-beg-01",
      userId: "cand-123",
      sourceId: "gh-repo-1",
      sourceType: "github",
      skillId: "html",
      directness: "CONFIGURED_DEPENDENCY",
      evidenceType: "manifest",
      strength: 0.9,
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "github_tree_inspector",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString(),
      occurredAt: new Date().toISOString()
    };

    const cryptoVerificationEvent: CanonicalVerificationEvent = {
      id: "ver-crypto-01",
      evidenceId: "ev-beg-01",
      verifier: "git_gpg_verifier",
      method: "AUTOMATED_CODE_INSPECTION",
      verificationLevel: "LEVEL_C_CRYPTOGRAPHIC",
      result: "PASS",
      checkedAt: new Date().toISOString()
    };

    const resultA = calibrateCapabilityScore({
      skillId: "html",
      skillName: "HTML5",
      evidenceItems: [beginnerVerifiedItem],
      verificationEvents: [cryptoVerificationEvent],
      selfReportedLevel: 2
    });

    assert.strictEqual(resultA.demonstratedProficiency, 2, "Must demonstrate Level 2 (Beginner)");
    assert.strictEqual(resultA.confidence, "HIGH", "Must have HIGH confidence due to cryptographic verification");

    // B: Low Confidence, Advanced Claim (Self-reported Level 4, but only a resume text mention)
    const mentionItem: CanonicalEvidenceItem = {
      id: "ev-men-01",
      userId: "cand-123",
      sourceId: "resume-01",
      sourceType: "resume",
      skillId: "distributed_systems",
      directness: "DOCUMENTED_MENTION",
      evidenceType: "resume_bullet",
      strength: 0.3,
      confidence: "LOW",
      verificationStatus: "STUDENT_REPORTED",
      verificationMethod: "resume_parser",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const resultB = calibrateCapabilityScore({
      skillId: "distributed_systems",
      skillName: "Distributed Systems",
      evidenceItems: [mentionItem],
      selfReportedLevel: 4
    });

    assert.strictEqual(resultB.demonstratedProficiency, 1, "Must demonstrate Level 1 (Familiar/Mention only)");
    assert.strictEqual(resultB.confidence, "LOW", "Must have LOW confidence due to lack of code artifacts");
  });

  test("2. Unproven != Zero Invariant (Honest Incomplete State)", () => {
    // When a student has provided NO evidence for Docker
    const result = calibrateCapabilityScore({
      skillId: "docker",
      skillName: "Docker",
      evidenceItems: [],
      selfReportedLevel: 3
    });

    assert.strictEqual(result.status, "UNPROVEN", "Status must be UNPROVEN, not FAILED");
    assert.strictEqual(result.coveragePercent, 0, "Coverage must be 0%");
    assert.strictEqual(result.confidence, "LOW", "Confidence must be LOW");
    assert.strictEqual(result.supportingEvidenceIds.length, 0);
    assert.ok(result.gapsIdentified[0].includes("unproven, not disproven"), "Explanation must state capability is unproven, not disproven");
  });

  test("3. Contradiction Dampening & Discrepancy Penalties", () => {
    // Scenario 1: Severe Overclaim (Claims Level 5, but evidence only shows Level 1)
    const mentionOnly: CanonicalEvidenceItem = {
      id: "ev-mention-nextjs",
      userId: "cand-overclaim",
      sourceId: "resume-doc",
      sourceType: "resume",
      skillId: "nextjs",
      directness: "DOCUMENTED_MENTION",
      evidenceType: "resume_claim",
      strength: 0.2,
      confidence: "LOW",
      verificationStatus: "STUDENT_REPORTED",
      verificationMethod: "regex_scan",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const overclaimResult = calibrateCapabilityScore({
      skillId: "nextjs",
      skillName: "Next.js",
      evidenceItems: [mentionOnly],
      selfReportedLevel: 5 // Claims Level 5 (Expert)
    });

    assert.strictEqual(overclaimResult.discrepancyDetected, true, "Must detect discrepancy on overclaim");
    assert.strictEqual(overclaimResult.status, "CONFLICTING", "Status must become CONFLICTING");
    assert.strictEqual(overclaimResult.confidence, "LOW", "Confidence must be dampened to LOW");
    assert.ok(overclaimResult.discrepancyDetails?.includes("Overclaim detected"), "Must report overclaim details");

    // Scenario 2: Attribution Failure (Fork without contributions - Scenario 11)
    const forkEvidenceItem: CanonicalEvidenceItem = {
      id: "ev-fork-repo",
      userId: "cand-fork",
      sourceId: "gh-forked-repo",
      sourceType: "github",
      skillId: "rust",
      directness: "DIRECT_IMPLEMENTATION",
      evidenceType: "source_file",
      strength: 0.8,
      confidence: "HIGH",
      verificationStatus: "UNVERIFIED",
      verificationMethod: "ast_parser",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const forkFailureEvent: CanonicalVerificationEvent = {
      id: "ver-fork-fail",
      evidenceId: "ev-fork-repo",
      verifier: "author_attribution_engine",
      method: "AUTOMATED_CODE_INSPECTION",
      result: "FAIL",
      limitations: ["FORK_WITHOUT_CONTRIBUTIONS"],
      details: "Fork repository contains 0 commits authored by candidate",
      checkedAt: new Date().toISOString()
    };

    const forkResult = calibrateCapabilityScore({
      skillId: "rust",
      skillName: "Rust",
      evidenceItems: [forkEvidenceItem],
      verificationEvents: [forkFailureEvent],
      selfReportedLevel: 4
    });

    assert.strictEqual(forkResult.discrepancyDetected, true, "Must flag discrepancy on fork without contributions");
    assert.strictEqual(forkResult.status, "CONFLICTING", "Status must be CONFLICTING");
    assert.strictEqual(forkResult.confidence, "LOW", "Confidence must be dampened to LOW");
    assert.strictEqual(forkResult.contradictingEvidenceIds.includes("ver-fork-fail"), true);
  });

  test("4. Aging & Half-Life Freshness Penalty", () => {
    const now = "2026-11-01T00:00:00.000Z";

    // CURRENT: 30 days ago
    const currentFreshness = computeFreshness("2026-10-01T00:00:00.000Z", now);
    assert.strictEqual(currentFreshness.state, "CURRENT");
    assert.strictEqual(currentFreshness.factor, 1.0);

    // RECENT: 250 days ago
    const recentFreshness = computeFreshness("2026-02-24T00:00:00.000Z", now);
    assert.strictEqual(recentFreshness.state, "RECENT");
    assert.strictEqual(recentFreshness.factor, 0.90);

    // AGING: 500 days ago
    const agingFreshness = computeFreshness("2025-06-19T00:00:00.000Z", now);
    assert.strictEqual(agingFreshness.state, "AGING");
    assert.strictEqual(agingFreshness.factor, 0.75);

    // STALE: 800 days ago
    const staleFreshness = computeFreshness("2024-08-23T00:00:00.000Z", now);
    assert.strictEqual(staleFreshness.state, "STALE");
    assert.strictEqual(staleFreshness.factor, 0.55);

    // Test calibrateCapabilityScore with stale evidence
    const staleItem: CanonicalEvidenceItem = {
      id: "ev-stale-01",
      userId: "cand-stale",
      sourceId: "gh-old-project",
      sourceType: "github",
      skillId: "python",
      directness: "DIRECT_IMPLEMENTATION",
      evidenceType: "source_file",
      strength: 0.85,
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "git_inspector",
      verificationTimestamp: "2024-08-23T00:00:00.000Z",
      observedAt: "2024-08-23T00:00:00.000Z",
      occurredAt: "2024-08-23T00:00:00.000Z"
    };

    const staleResult = calibrateCapabilityScore({
      skillId: "python",
      skillName: "Python",
      evidenceItems: [staleItem],
      evaluationTimestamp: now
    });

    assert.strictEqual(staleResult.freshnessState, "STALE", "Must be marked STALE");
    assert.strictEqual(staleResult.demonstratedProficiency, 3, "Historical demonstrated level preserved as 3");
    assert.strictEqual(staleResult.effectiveProficiencyScore, 1.65, "Effective score must be 3 * 0.55 = 1.65");
  });

  test("5. Multi-Source Corroboration Boost vs. Circular Reporting", () => {
    // A: Circular Self-Reporting (Resume + LinkedIn alone without technical verification)
    const resumeItem: CanonicalEvidenceItem = {
      id: "ev-res-01",
      userId: "cand-circ",
      sourceId: "res-01",
      sourceType: "resume",
      skillId: "kubernetes",
      directness: "DOCUMENTED_MENTION",
      evidenceType: "resume_text",
      strength: 0.4,
      confidence: "LOW",
      verificationStatus: "STUDENT_REPORTED",
      verificationMethod: "nlp_extract",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };
    const linkedinItem: CanonicalEvidenceItem = {
      id: "ev-li-01",
      userId: "cand-circ",
      sourceId: "li-01",
      sourceType: "linkedin",
      skillId: "kubernetes",
      directness: "DOCUMENTED_MENTION",
      evidenceType: "profile_skill",
      strength: 0.4,
      confidence: "LOW",
      verificationStatus: "STUDENT_REPORTED",
      verificationMethod: "oauth_sync",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const circularResult = calibrateCapabilityScore({
      skillId: "kubernetes",
      skillName: "Kubernetes",
      evidenceItems: [resumeItem, linkedinItem]
    });

    assert.strictEqual(circularResult.corroborationStatus, "CIRCULAR_SELF_REPORTING", "Must identify circular self-reporting");
    assert.strictEqual(circularResult.confidence, "LOW", "Circular reporting must NOT boost confidence");

    // B: Independent Corroboration (GitHub code + Live Deployment + Verified Assessment)
    const githubItem: CanonicalEvidenceItem = {
      id: "ev-gh-01",
      userId: "cand-indep",
      sourceId: "gh-01",
      sourceType: "github",
      skillId: "react",
      directness: "DIRECT_IMPLEMENTATION",
      evidenceType: "source_file",
      strength: 0.9,
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "ast_tree",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString(),
      occurredAt: new Date().toISOString()
    };
    const deployItem: CanonicalEvidenceItem = {
      id: "ev-dep-01",
      userId: "cand-indep",
      sourceId: "vercel-01",
      sourceType: "deployment",
      skillId: "react",
      directness: "DIRECT_IMPLEMENTATION",
      evidenceType: "production_url",
      strength: 0.9,
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "http_crawler",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const indepResult = calibrateCapabilityScore({
      skillId: "react",
      skillName: "React",
      evidenceItems: [githubItem, deployItem]
    });

    assert.strictEqual(indepResult.corroborationStatus, "INDEPENDENT_CORROBORATION", "Must identify independent corroboration");
    assert.strictEqual(indepResult.confidence, "HIGH", "Must achieve HIGH confidence");
  });

  test("6. Role Readiness Evaluation & Honest Gaps Identification", () => {
    const requirements: RoleSkillRequirement[] = [
      { skillId: "typescript", skillName: "TypeScript", requiredProficiency: 4, weight: 2.0, isMustHave: true },
      { skillId: "postgres", skillName: "PostgreSQL", requiredProficiency: 3, weight: 1.5, isMustHave: true },
      { skillId: "redis", skillName: "Redis", requiredProficiency: 3, weight: 1.0, isMustHave: false },
      { skillId: "kubernetes", skillName: "Kubernetes", requiredProficiency: 2, weight: 1.0, isMustHave: false }
    ];

    // Candidate has:
    // TypeScript: Level 4 (2 direct impls + tests + patterns) -> 100% fulfill
    // PostgreSQL: Level 3 (direct impl) -> 100% fulfill
    // Redis: UNPROVEN (no evidence)
    // Kubernetes: UNPROVEN (no evidence)

    const tsDirect1: CanonicalEvidenceItem = {
      id: "ev-ts-1",
      userId: "c-role",
      sourceId: "gh-app",
      sourceType: "github",
      skillId: "typescript",
      directness: "DIRECT_IMPLEMENTATION",
      evidenceType: "source",
      strength: 0.9,
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "ast",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };
    const tsDirect2: CanonicalEvidenceItem = {
      id: "ev-ts-2",
      userId: "c-role",
      sourceId: "gh-app",
      sourceType: "github",
      skillId: "typescript",
      directness: "DIRECT_IMPLEMENTATION",
      evidenceType: "source",
      strength: 0.9,
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "ast",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };
    const tsTests: CanonicalEvidenceItem = {
      id: "ev-ts-3",
      userId: "c-role",
      sourceId: "gh-app",
      sourceType: "github",
      skillId: "typescript",
      directness: "TEST_ASSERTION",
      evidenceType: "test_suite",
      strength: 0.95,
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "vitest_inspect",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const pgItem: CanonicalEvidenceItem = {
      id: "ev-pg-1",
      userId: "c-role",
      sourceId: "gh-app",
      sourceType: "github",
      skillId: "postgres",
      directness: "DIRECT_IMPLEMENTATION",
      evidenceType: "source",
      strength: 0.85,
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "ast",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const evidenceBySkill = {
      typescript: [tsDirect1, tsDirect2, tsTests],
      postgres: [pgItem]
    };

    const roleEval = evaluateCandidateRoleReadiness({
      requirements,
      evidenceBySkill,
      evaluationTimestamp: new Date().toISOString()
    });

    assert.strictEqual(roleEval.totalRequirementsCount, 4);
    assert.strictEqual(roleEval.unprovenSkillsCount, 2, "Must identify exactly 2 unproven skills (Redis, Kubernetes)");
    assert.strictEqual(roleEval.mustHaveMet, true, "Both must-have skills (TS, Postgres) are verified");

    // TS weight = 2.0 (1.0 fulfillment), PG weight = 1.5 (1.0 fulfillment), total weight = 5.5
    // Evidenced fulfillment = (2.0 + 1.5) / 5.5 = 3.5 / 5.5 = ~64%
    assert.ok(roleEval.overallDemonstratedReadiness >= 60 && roleEval.overallDemonstratedReadiness <= 70);
    // Potential readiness assumes Redis & Kubernetes unproven can be verified -> 100%
    assert.strictEqual(roleEval.potentialReadiness, 100);

    assert.strictEqual(roleEval.actionableEvidenceRecommendations.length, 2, "Must give actionable recommendations for both unproven skills");
  });

});

