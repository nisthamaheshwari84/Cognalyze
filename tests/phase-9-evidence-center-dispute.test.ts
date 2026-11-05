/**
 * tests/phase-9-evidence-center-dispute.test.ts
 *
 * COGNALYZE PHASE 9 TEST MATRIX:
 * Evidence Center, Dispute Submission, Automated Re-Evaluation Pipeline & Transparent UI States
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import {
  submitEvidenceDispute,
  reEvaluateDispute,
  synthesizeEvidenceCenterViewModel,
  EvidenceDisputeRecord
} from "../lib/evidence/dispute-and-evidence-center";
import { CanonicalEvidenceItem } from "../lib/evidence/canonical-types";
import { CalibratedCapabilityResult } from "../lib/evidence/calibrated-scoring-engine";

describe("PHASE 9: Evidence Center & Dispute Resolution Engine", () => {

  test("1. Dispute Submission & Validation", () => {
    // Valid dispute submission
    const dispute = submitEvidenceDispute({
      studentId: "student-101",
      evidenceItemId: "ev-item-golang",
      skillId: "go",
      disputeReason: "ALIAS_MISMATCH",
      claimantExplanation: "I committed to the microservices repository using my university email address rather than my personal email.",
      supplementalArtifacts: [
        { type: "secondary_email", value: "student@university.edu" }
      ]
    });

    assert.ok(dispute.id.startsWith("disp_"));
    assert.strictEqual(dispute.status, "DISPUTE_SUBMITTED");
    assert.strictEqual(dispute.auditLog.length, 1);
    assert.strictEqual(dispute.auditLog[0].action, "DISPUTE_SUBMITTED");

    // Invalid submission: explanation too short
    assert.throws(() => {
      submitEvidenceDispute({
        studentId: "student-101",
        evidenceItemId: "ev-item-golang",
        skillId: "go",
        disputeReason: "ALIAS_MISMATCH",
        claimantExplanation: "Fix it",
        supplementalArtifacts: [{ type: "secondary_email", value: "test@test.com" }]
      });
    }, /A specific explanation/);

    // Invalid submission: no supplemental artifacts
    assert.throws(() => {
      submitEvidenceDispute({
        studentId: "student-101",
        evidenceItemId: "ev-item-golang",
        skillId: "go",
        disputeReason: "ALIAS_MISMATCH",
        claimantExplanation: "I committed with my second email account.",
        supplementalArtifacts: []
      });
    }, /At least one supplemental artifact/);
  });

  test("2. Automated Re-Evaluation: Alias Mismatch Resolution", () => {
    const originalItem: CanonicalEvidenceItem = {
      id: "ev-item-golang",
      userId: "student-101",
      sourceId: "gh-microservices",
      sourceType: "github",
      skillId: "go",
      directness: "DOCUMENTED_MENTION",
      evidenceType: "source_code",
      strength: 0.3,
      confidence: "LOW",
      verificationStatus: "UNVERIFIED",
      verificationMethod: "github_tree_inspector",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const dispute = submitEvidenceDispute({
      studentId: "student-101",
      evidenceItemId: "ev-item-golang",
      skillId: "go",
      disputeReason: "ALIAS_MISMATCH",
      claimantExplanation: "I committed with my university email address student@alumni.edu",
      supplementalArtifacts: [
        { type: "secondary_email", value: "student@alumni.edu" }
      ]
    });

    // A: Successful matching: Commit logs contain student@alumni.edu
    const repoAuthors = ["john.doe@corp.com", "student@alumni.edu", "lead@corp.com"];
    const outcomeSuccess = reEvaluateDispute({
      dispute,
      originalItem,
      repositoryCommitAuthors: repoAuthors
    });

    assert.strictEqual(outcomeSuccess.isResolved, true);
    assert.strictEqual(outcomeSuccess.updatedDispute.status, "RESOLVED_UPGRADED");
    assert.strictEqual(outcomeSuccess.updatedEvidenceItem.verificationStatus, "VERIFIED");
    assert.strictEqual(outcomeSuccess.updatedEvidenceItem.directness, "DIRECT_IMPLEMENTATION");
    assert.strictEqual(outcomeSuccess.updatedEvidenceItem.confidence, "HIGH");

    // B: Failed matching: Secondary email is NOT in commit logs
    const bogusDispute = submitEvidenceDispute({
      studentId: "student-101",
      evidenceItemId: "ev-item-golang",
      skillId: "go",
      disputeReason: "ALIAS_MISMATCH",
      claimantExplanation: "I committed with my bogus email not-in-git@fake.com",
      supplementalArtifacts: [
        { type: "secondary_email", value: "not-in-git@fake.com" }
      ]
    });

    const outcomeFailure = reEvaluateDispute({
      dispute: bogusDispute,
      originalItem,
      repositoryCommitAuthors: repoAuthors
    });

    assert.strictEqual(outcomeFailure.isResolved, false);
    assert.strictEqual(outcomeFailure.updatedDispute.status, "DISPUTE_REJECTED");
    assert.strictEqual(outcomeFailure.updatedEvidenceItem.verificationStatus, "UNVERIFIED");
  });

  test("3. Automated Re-Evaluation: Monorepo Subfolder Contribution", () => {
    const originalItem: CanonicalEvidenceItem = {
      id: "ev-item-rust",
      userId: "student-101",
      sourceId: "gh-enterprise-monorepo",
      sourceType: "github",
      skillId: "rust",
      directness: "DOCUMENTED_MENTION",
      evidenceType: "source_code",
      strength: 0.3,
      confidence: "LOW",
      verificationStatus: "UNVERIFIED",
      verificationMethod: "root_tree_scan",
      verificationTimestamp: new Date().toISOString(),
      observedAt: new Date().toISOString()
    };

    const dispute = submitEvidenceDispute({
      studentId: "student-101",
      evidenceItemId: "ev-item-rust",
      skillId: "rust",
      disputeReason: "MONOREPO_SUBFOLDER_CONTRIBUTION",
      claimantExplanation: "All my Rust work is situated in apps/settlement-engine/src/",
      supplementalArtifacts: [
        { type: "subfolder_path", value: "apps/settlement-engine/src" }
      ]
    });

    const inspectedFiles = [
      "package.json",
      "README.md",
      "apps/settlement-engine/src/lib.rs",
      "apps/settlement-engine/src/engine.rs"
    ];

    const outcome = reEvaluateDispute({
      dispute,
      originalItem,
      inspectedFilePaths: inspectedFiles
    });

    assert.strictEqual(outcome.isResolved, true);
    assert.strictEqual(outcome.updatedDispute.status, "RESOLVED_UPGRADED");
    assert.strictEqual(outcome.updatedEvidenceItem.verificationStatus, "VERIFIED");
    assert.strictEqual(outcome.updatedEvidenceItem.artifactRef, "apps/settlement-engine/src");
  });

  test("4. Evidence Center View Model Synthesis", () => {
    const assessments: CalibratedCapabilityResult[] = [
      {
        skillId: "ts",
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
        supportingEvidenceIds: ["ev-ts-1"],
        contradictingEvidenceIds: [],
        corroborationStatus: "INDEPENDENT_CORROBORATION",
        gapsIdentified: [],
        evaluatedAt: new Date().toISOString()
      },
      {
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
        gapsIdentified: ["No evidence"],
        evaluatedAt: new Date().toISOString()
      },
      {
        skillId: "go",
        skillName: "Go",
        category: "Languages",
        status: "PARTIALLY_VERIFIED",
        demonstratedProficiency: 2,
        confidence: "LOW",
        confidenceScore: 0.3,
        coveragePercent: 20,
        freshnessState: "CURRENT",
        freshnessFactor: 1.0,
        effectiveProficiencyScore: 2.0,
        discrepancyDetected: false,
        supportingEvidenceIds: ["ev-go-disp"],
        contradictingEvidenceIds: [],
        corroborationStatus: "SINGLE_SOURCE",
        gapsIdentified: [],
        evaluatedAt: new Date().toISOString()
      }
    ];

    const evidenceItems: CanonicalEvidenceItem[] = [
      {
        id: "ev-ts-1",
        userId: "student-101",
        sourceId: "gh-app",
        sourceType: "github",
        artifactRef: "src/index.ts",
        commitSha: "c111111111111111111111111111111111111111",
        verbatimQuote: "export interface Config { ... }",
        skillId: "ts",
        directness: "DIRECT_IMPLEMENTATION",
        evidenceType: "source",
        strength: 0.95,
        confidence: "HIGH",
        verificationStatus: "VERIFIED",
        verificationMethod: "ast",
        verificationTimestamp: new Date().toISOString(),
        observedAt: new Date().toISOString()
      },
      {
        id: "ev-go-disp",
        userId: "student-101",
        sourceId: "gh-app",
        sourceType: "github",
        skillId: "go",
        directness: "DOCUMENTED_MENTION",
        evidenceType: "source",
        strength: 0.3,
        confidence: "LOW",
        verificationStatus: "UNVERIFIED",
        verificationMethod: "nlp",
        verificationTimestamp: new Date().toISOString(),
        observedAt: new Date().toISOString()
      }
    ];

    const activeDispute: EvidenceDisputeRecord = {
      id: "disp-12345",
      studentId: "student-101",
      evidenceItemId: "ev-go-disp",
      skillId: "go",
      disputeReason: "ALIAS_MISMATCH",
      claimantExplanation: "Alias review pending",
      supplementalArtifacts: [{ type: "secondary_email", value: "sec@univ.edu" }],
      status: "DISPUTE_SUBMITTED",
      auditLog: [],
      submittedAt: new Date().toISOString()
    };

    const vm = synthesizeEvidenceCenterViewModel({
      studentId: "student-101",
      assessments,
      evidenceItems,
      disputes: [activeDispute]
    });

    assert.strictEqual(vm.totalCapabilities, 3);
    assert.strictEqual(vm.verifiedCount, 1);
    assert.strictEqual(vm.unprovenCount, 1);
    assert.strictEqual(vm.disputedCount, 1, "Must tally the active dispute");

    const goCard = vm.cards.find(c => c.skillId === "go");
    assert.ok(goCard);
    assert.strictEqual(goCard.displayStatus, "DISPUTED");
    assert.strictEqual(goCard.hasActiveDispute, true);
    assert.strictEqual(goCard.activeDisputeId, "disp-12345");

    const dockerCard = vm.cards.find(c => c.skillId === "docker");
    assert.ok(dockerCard);
    assert.strictEqual(dockerCard.displayStatus, "UNPROVEN");
    assert.ok(dockerCard.actionPrompt?.includes("Connect a GitHub repository"));
  });

});

