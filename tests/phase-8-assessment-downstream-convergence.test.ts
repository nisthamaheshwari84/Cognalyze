/**
 * tests/phase-8-assessment-downstream-convergence.test.ts
 *
 * COGNALYZE PHASE 8 TEST MATRIX:
 * Assessment Convergence, Adaptive Interview Probes, Decision Room Dossier & Student DNA Snapshots
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import {
  generateAdaptiveInterviewProbes,
  synthesizeDecisionRoomDossier,
  generateStudentDNASnapshot
} from "../lib/evidence/assessment-convergence";
import {
  CalibratedCapabilityResult,
  RoleReadinessEvaluation,
  RoleSkillRequirement
} from "../lib/evidence/calibrated-scoring-engine";
import { CanonicalEvidenceItem } from "../lib/evidence/canonical-types";

describe("PHASE 8: Assessment & Downstream Convergence", () => {

  test("1. Adaptive Interview Probes Generation", () => {
    // 3 Candidate Capabilities:
    // A. Unproven: Docker (no evidence provided)
    const unprovenDocker: CalibratedCapabilityResult = {
      skillId: "docker",
      skillName: "Docker",
      category: "DevOps",
      status: "UNPROVEN",
      demonstratedProficiency: 1,
      confidence: "LOW",
      confidenceScore: 0.1,
      coveragePercent: 0,
      freshnessState: "CURRENT",
      freshnessFactor: 1.0,
      effectiveProficiencyScore: 1.0,
      discrepancyDetected: false,
      supportingEvidenceIds: [],
      contradictingEvidenceIds: [],
      corroborationStatus: "NONE",
      gapsIdentified: ["No code observed"],
      evaluatedAt: new Date().toISOString()
    };

    // B. Overclaim / Discrepancy: React (Claims Level 5, but evidence only Level 1)
    const overclaimReact: CalibratedCapabilityResult = {
      skillId: "react",
      skillName: "React",
      category: "Frontend",
      status: "CONFLICTING",
      demonstratedProficiency: 1,
      selfReportedProficiency: 5,
      confidence: "LOW",
      confidenceScore: 0.2,
      coveragePercent: 15,
      freshnessState: "CURRENT",
      freshnessFactor: 1.0,
      effectiveProficiencyScore: 1.0,
      discrepancyDetected: true,
      discrepancyDetails: "Overclaim detected: Self-reported level 5 exceeds demonstrated level 1 by 4 levels.",
      supportingEvidenceIds: ["ev-react-mention"],
      contradictingEvidenceIds: [],
      corroborationStatus: "SINGLE_SOURCE",
      gapsIdentified: ["Severe overclaim"],
      evaluatedAt: new Date().toISOString()
    };

    // C. Elevated Mastery: TypeScript (Proven Level 4, HIGH confidence, unit tests passed)
    const elevatedTS: CalibratedCapabilityResult = {
      skillId: "typescript",
      skillName: "TypeScript",
      category: "Languages",
      status: "VERIFIED",
      demonstratedProficiency: 4,
      confidence: "HIGH",
      confidenceScore: 0.95,
      coveragePercent: 90,
      freshnessState: "CURRENT",
      freshnessFactor: 1.0,
      effectiveProficiencyScore: 4.0,
      discrepancyDetected: false,
      supportingEvidenceIds: ["ev-ts-impl-1", "ev-ts-test-1"],
      contradictingEvidenceIds: [],
      corroborationStatus: "INDEPENDENT_CORROBORATION",
      gapsIdentified: [],
      evaluatedAt: new Date().toISOString()
    };

    const probes = generateAdaptiveInterviewProbes({
      candidateAssessments: [unprovenDocker, overclaimReact, elevatedTS],
      roleRequirements: [
        { skillId: "docker", skillName: "Docker", requiredProficiency: 3 },
        { skillId: "react", skillName: "React", requiredProficiency: 4 },
        { skillId: "typescript", skillName: "TypeScript", requiredProficiency: 4 }
      ]
    });

    assert.strictEqual(probes.length, 3);

    // Verify Docker probe is PROVE_UNPROVEN_SKILL
    const dockerProbe = probes.find(p => p.skillId === "docker");
    assert.ok(dockerProbe);
    assert.strictEqual(dockerProbe.probeType, "PROVE_UNPROVEN_SKILL");
    assert.ok(dockerProbe.question.includes("haven't yet observed inspectable repository code"));

    // Verify React probe is CHALLENGE_OVERCLAIM
    const reactProbe = probes.find(p => p.skillId === "react");
    assert.ok(reactProbe);
    assert.strictEqual(reactProbe.probeType, "CHALLENGE_OVERCLAIM");
    assert.ok(reactProbe.question.includes("profile indicates advanced proficiency in React, but our automated repository inspection observed limited direct implementations"));

    // Verify TypeScript probe is ELEVATED_ARCHITECTURAL_EXPLORATION
    const tsProbe = probes.find(p => p.skillId === "typescript");
    assert.ok(tsProbe);
    assert.strictEqual(tsProbe.probeType, "ELEVATED_ARCHITECTURAL_EXPLORATION");
    assert.ok(tsProbe.question.includes("20,000 requests/sec"));
  });

  test("2. Decision Room Dossier Synthesis & Tamper-Evident Hash", () => {
    const evidenceItem: CanonicalEvidenceItem = {
      id: "ev-pg-01",
      userId: "c-candidate-01",
      sourceId: "gh-hyperroute",
      sourceType: "github",
      artifactRef: "src/db/transaction-manager.ts",
      commitSha: "a1b2c3d4e5f67890123456789abcdef012345678",
      verbatimQuote: "await prisma.$transaction(async (tx) => { ... });",
      skillId: "postgresql",
      directness: "DIRECT_IMPLEMENTATION",
      evidenceType: "source_code",
      strength: 0.95,
      confidence: "HIGH",
      verificationStatus: "VERIFIED",
      verificationMethod: "ast_tree_inspector",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const evaluation: RoleReadinessEvaluation = {
      roleId: "role-staff-01",
      overallDemonstratedReadiness: 85,
      potentialReadiness: 100,
      overallConfidence: "HIGH",
      verifiedMatchPercentage: 85,
      mustHaveMet: true,
      unprovenSkillsCount: 0,
      conflictingSkillsCount: 0,
      totalRequirementsCount: 1,
      skillEvaluations: [
        {
          skillId: "postgresql",
          skillName: "PostgreSQL",
          category: "Database",
          status: "VERIFIED",
          demonstratedProficiency: 4,
          confidence: "HIGH",
          confidenceScore: 0.95,
          coveragePercent: 90,
          freshnessState: "CURRENT",
          freshnessFactor: 1.0,
          effectiveProficiencyScore: 4.0,
          discrepancyDetected: false,
          supportingEvidenceIds: ["ev-pg-01"],
          contradictingEvidenceIds: [],
          corroborationStatus: "INDEPENDENT_CORROBORATION",
          gapsIdentified: [],
          evaluatedAt: new Date().toISOString()
        }
      ],
      criticalGaps: [],
      actionableEvidenceRecommendations: [],
      evaluatedAt: new Date().toISOString()
    };

    const dossier = synthesizeDecisionRoomDossier({
      candidateId: "c-candidate-01",
      roleId: "role-staff-01",
      evaluation,
      evidenceItems: [evidenceItem]
    });

    assert.strictEqual(dossier.verifiedMatchScore, 85);
    assert.strictEqual(dossier.mustHavesMet, true);
    assert.strictEqual(dossier.competencyLedger.length, 1);

    const comp = dossier.competencyLedger[0];
    assert.strictEqual(comp.skillId, "postgresql");
    assert.strictEqual(comp.evidenceTrail.length, 1);
    assert.strictEqual(comp.evidenceTrail[0].directnessTier, "T0", "Direct commit with HIGH confidence maps to T0");
    assert.strictEqual(comp.evidenceTrail[0].commitSha, "a1b2c3d4e5f67890123456789abcdef012345678");

    // Verify deterministic SHA-256 audit signature is 64 hex characters
    assert.strictEqual(dossier.auditSignature.length, 64);
    assert.match(dossier.auditSignature, /^[a-f0-9]{64}$/);
  });

  test("3. Student DNA Snapshot Generation", () => {
    const assessments: CalibratedCapabilityResult[] = [
      {
        skillId: "go",
        skillName: "Go",
        category: "Languages",
        status: "VERIFIED",
        demonstratedProficiency: 3,
        confidence: "HIGH",
        confidenceScore: 0.85,
        coveragePercent: 80,
        freshnessState: "CURRENT",
        freshnessFactor: 1.0,
        effectiveProficiencyScore: 3.0,
        discrepancyDetected: false,
        supportingEvidenceIds: ["ev-go-01"],
        contradictingEvidenceIds: [],
        corroborationStatus: "SINGLE_SOURCE",
        gapsIdentified: [],
        evaluatedAt: new Date().toISOString()
      },
      {
        skillId: "rust",
        skillName: "Rust",
        category: "Languages",
        status: "UNPROVEN",
        demonstratedProficiency: 1,
        confidence: "LOW",
        confidenceScore: 0.1,
        coveragePercent: 0,
        freshnessState: "CURRENT",
        freshnessFactor: 1.0,
        effectiveProficiencyScore: 1.0,
        discrepancyDetected: false,
        supportingEvidenceIds: [],
        contradictingEvidenceIds: [],
        corroborationStatus: "NONE",
        gapsIdentified: ["Unproven"],
        evaluatedAt: new Date().toISOString()
      }
    ];

    const snapshot = generateStudentDNASnapshot({
      studentId: "student-dev-99",
      assessments,
      evidenceItems: []
    });

    assert.ok(snapshot.snapshotId.startsWith("dna_snap_"));
    assert.strictEqual(snapshot.studentId, "student-dev-99");
    assert.strictEqual(snapshot.verifiedCount, 1);
    assert.strictEqual(snapshot.unprovenCount, 1);
    assert.strictEqual(snapshot.conflictingCount, 0);
    assert.strictEqual(snapshot.snapshotHash.length, 64);
  });

});

