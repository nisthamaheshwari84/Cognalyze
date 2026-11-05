/**
 * tests/phase-7-market-intelligence-freshness.test.ts
 *
 * COGNALYZE PHASE 7 TEST MATRIX:
 * Market Signal Freshness TTL, Regional Archetypes, Role Versioning & Immutability Under Market Shifts
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import {
  evaluateSignalFreshness,
  classifyRegionalArchetype,
  createRoleVersionSnapshot,
  evaluateCandidateAgainstPinnedVersion,
  verifyAssessmentImmutabilityUnderMarketShift
} from "../lib/workforce/market-intelligence-freshness";
import { MarketSignal } from "../lib/workforce/types";
import { CanonicalCapabilityAssessment } from "../lib/evidence/canonical-types";
import { RoleSkillRequirement } from "../lib/evidence/calibrated-scoring-engine";

describe("PHASE 7: Market Intelligence & Freshness Layer", () => {

  test("1. Signal Freshness TTL & Expiration Enforcement", () => {
    const now = "2026-11-01T00:00:00.000Z";

    // A: Active Signal (15 days old)
    const activeSignal: MarketSignal = {
      id: "sig-active-01",
      companyName: "Google",
      industry: "Cloud & AI",
      country: "India",
      eventType: "hiring_surge",
      announcementDate: "2026-10-17T00:00:00.000Z",
      indiaImpactStatus: "confirmed_india_impact",
      indiaImpactDetails: "Expanding Cloud AI campus",
      affectedCapabilities: [],
      sourceUrls: ["https://example.com/active"],
      confidence: 0.95,
      verifiedByHuman: true
    };
    const activeEval = evaluateSignalFreshness(activeSignal, now);
    assert.strictEqual(activeEval.status, "ACTIVE");
    assert.strictEqual(activeEval.isApplicableToLiveRoles, true);
    assert.strictEqual(activeEval.effectiveWeight, 1.0);

    // B: Aging Signal (45 days old)
    const agingSignal: MarketSignal = {
      id: "sig-aging-01",
      companyName: "Amazon",
      industry: "E-Commerce & Cloud",
      country: "Global",
      eventType: "skill_shift",
      announcementDate: "2026-09-17T00:00:00.000Z",
      indiaImpactStatus: "reported_india_impact",
      indiaImpactDetails: "Transitioning to rust edge workers",
      affectedCapabilities: [],
      sourceUrls: ["https://example.com/aging"],
      confidence: 0.85,
      verifiedByHuman: true
    };
    const agingEval = evaluateSignalFreshness(agingSignal, now);
    assert.strictEqual(agingEval.status, "AGING");
    assert.strictEqual(agingEval.isApplicableToLiveRoles, true);
    assert.strictEqual(agingEval.effectiveWeight, 0.70);

    // C: Expired Signal (75 days old, exceeds 60-day TTL)
    const expiredSignal: MarketSignal = {
      id: "sig-expired-01",
      companyName: "Meta",
      industry: "Social Media",
      country: "US",
      eventType: "layoff",
      announcementDate: "2026-08-18T00:00:00.000Z",
      indiaImpactStatus: "no_established_india_impact",
      indiaImpactDetails: "US core ops reduction",
      affectedCapabilities: [],
      sourceUrls: ["https://example.com/expired"],
      confidence: 0.9,
      verifiedByHuman: true
    };
    const expiredEval = evaluateSignalFreshness(expiredSignal, now);
    assert.strictEqual(expiredEval.status, "EXPIRED");
    assert.strictEqual(expiredEval.isApplicableToLiveRoles, false, "Expired signals cannot distort live roles");
    assert.strictEqual(expiredEval.effectiveWeight, 0.0);
  });

  test("2. Regional Market Archetype Classification", () => {
    // A: India GCC (Microsoft in Bengaluru)
    const gccType = classifyRegionalArchetype({
      companyName: "Microsoft",
      location: "Bengaluru, Karnataka, India",
      industry: "Enterprise Software"
    });
    assert.strictEqual(gccType, "INDIA_GCC");

    // B: India Domestic Scale (UPI / FinTech)
    const domesticScale = classifyRegionalArchetype({
      companyName: "PhonePe",
      location: "Bengaluru, India",
      industry: "Fintech",
      tags: ["upi", "realtime-payments"]
    });
    assert.strictEqual(domesticScale, "DOMESTIC_INDIA_SCALE");

    // C: Global Tech Hub (San Francisco)
    const globalHub = classifyRegionalArchetype({
      companyName: "Anthropic",
      location: "San Francisco, CA, USA",
      industry: "AI Safety"
    });
    assert.strictEqual(globalHub, "GLOBAL_TECH_HUB");
  });

  test("3. Role Versioning & Candidate Evaluation Pinning", () => {
    // Initial v1.0.0 requirements
    const v1Requirements: RoleSkillRequirement[] = [
      { skillId: "python", skillName: "Python", requiredProficiency: 3, weight: 1.0 },
      { skillId: "sql", skillName: "SQL", requiredProficiency: 3, weight: 1.0 }
    ];

    const v1Snapshot = createRoleVersionSnapshot({
      roleId: "role-backend-001",
      roleTitle: "Backend Systems Engineer",
      organizationId: "org-acme",
      currentVersion: "1.0.0",
      requirements: v1Requirements,
      changeReason: "Initial approved role baseline",
      approvedBy: "recruiter-rec-01"
    });

    assert.strictEqual(v1Snapshot.version, "1.1.0");
    assert.strictEqual(v1Snapshot.requirements.length, 2);

    // Candidate assessments: Python Level 3, SQL Level 3
    const candidateAssessments: CanonicalCapabilityAssessment[] = [
      {
        skillId: "python",
        skillName: "Python",
        category: "Languages",
        demonstratedProficiency: 3,
        confidence: "HIGH",
        coveragePercent: 90,
        freshnessState: "CURRENT",
        supportingEvidenceIds: ["ev-py-1"],
        gapsIdentified: [],
        lastEvaluated: new Date().toISOString()
      },
      {
        skillId: "sql",
        skillName: "SQL",
        category: "Database",
        demonstratedProficiency: 3,
        confidence: "HIGH",
        coveragePercent: 85,
        freshnessState: "CURRENT",
        supportingEvidenceIds: ["ev-sql-1"],
        gapsIdentified: [],
        lastEvaluated: new Date().toISOString()
      }
    ];

    const evalV1 = evaluateCandidateAgainstPinnedVersion({
      candidateId: "student-aarav",
      assessments: candidateAssessments,
      roleVersion: v1Snapshot
    });

    assert.strictEqual(evalV1.overallReadiness, 100, "Must be 100% ready for v1.1.0 requirements");
    assert.strictEqual(evalV1.pinnedRoleVersion, "1.1.0");
    assert.strictEqual(evalV1.isProtectedFromRoleEvolution, true);

    // Later: Role evolves to v1.2.0 adding Kafka and Distributed Systems
    const v2Requirements: RoleSkillRequirement[] = [
      ...v1Requirements,
      { skillId: "kafka", skillName: "Apache Kafka", requiredProficiency: 4, weight: 2.0, isMustHave: true }
    ];

    const v2Snapshot = createRoleVersionSnapshot({
      roleId: "role-backend-001",
      roleTitle: "Backend Systems Engineer",
      organizationId: "org-acme",
      currentVersion: "1.1.0",
      requirements: v2Requirements,
      changeReason: "Added Kafka requirement due to GCC expansion signal",
      approvedBy: "recruiter-rec-01"
    });

    assert.strictEqual(v2Snapshot.version, "1.2.0");

    // Re-verify that candidate's pinned evaluation for v1.1.0 remains 100% and unaffected!
    assert.strictEqual(evalV1.overallReadiness, 100, "Candidate evaluation under v1.1.0 must remain immutable!");
  });

  test("4. Assessment Immutability Under Market Shift Invariant", () => {
    // Core Invariant: Market shifts NEVER alter historical student proficiency!
    const candidateAssessment: CanonicalCapabilityAssessment = {
      skillId: "java",
      skillName: "Java",
      category: "Backend",
      demonstratedProficiency: 4, // Demonstrated Level 4 (Advanced)
      confidence: "HIGH",
      coveragePercent: 95,
      freshnessState: "CURRENT",
      supportingEvidenceIds: ["ev-java-impl-01"],
      gapsIdentified: [],
      lastEvaluated: "2026-05-01T00:00:00.000Z"
    };

    const marketShiftSignal: MarketSignal = {
      id: "sig-shift-01",
      companyName: "Global Market",
      industry: "Software",
      country: "Global",
      eventType: "skill_shift",
      announcementDate: "2026-10-01T00:00:00.000Z",
      indiaImpactStatus: "confirmed_india_impact",
      indiaImpactDetails: "Java legacy backend modernization shift towards Go/Rust",
      affectedCapabilities: [
        {
          capabilityName: "Java",
          direction: "declining",
          rationale: "Legacy systems being phased out"
        }
      ],
      sourceUrls: ["https://example.com/shift"],
      confidence: 0.95,
      verifiedByHuman: true
    };

    const verification = verifyAssessmentImmutabilityUnderMarketShift({
      originalAssessment: candidateAssessment,
      surgingSignal: marketShiftSignal
    });

    assert.strictEqual(verification.isImmutable, true, "Demonstrated proficiency must remain immutable");
    assert.strictEqual(verification.preservedDemonstratedProficiency, 4, "Must maintain Level 4 regardless of market decline");
    assert.strictEqual(verification.signalDirection, "declining");
  });

});

