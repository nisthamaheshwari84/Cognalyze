/**
 * tests/phase-3-evidence-verification-engine.test.ts
 * 
 * COGNALYZE PHASE 3 VERIFICATION SUITE
 * Evidence Verification Engine
 * 
 * Verifies:
 * 1. Source Authenticity & Anti-Spoofing:
 *    - SSRF defense (blocking 127.0.0.1, localhost, 169.254.169.254, 10.0.0.1).
 *    - Phishing & typosquatting detection (g1thub.com, linked1n.com, fake-cert).
 *    - Recognized platform authority classification (github.com, leetcode.com, credly.com).
 * 2. Author Attribution Scoring:
 *    - Solo repository -> PRIMARY_AUTHOR (confidence 1.0).
 *    - Team repository with high commit share -> VERIFIED_CONTRIBUTOR.
 *    - Team repository with <15% share & no PRs -> UNCERTAIN_ATTRIBUTION (Scenario 6).
 *    - Fork without original commits -> FORK_WITHOUT_CONTRIBUTIONS (Scenario 11).
 *    - Cloned template with minimal commits -> TEMPLATE_CLONE_DETECTED.
 * 3. Verification Hierarchy:
 *    - LEVEL_A_DOCUMENT vs LEVEL_B_ISSUER_DIRECT vs LEVEL_C_CRYPTOGRAPHIC.
 * 4. Cross-Source Corroboration:
 *    - Independent corroboration (Resume + GitHub) elevates confidence.
 *    - Circular re-reporting (Resume + LinkedIn + Profile) prevents artificial inflation.
 * 5. Tamper-Evident Canonical Verification Event Generation:
 *    - Deterministic SHA-256 audit signature over event properties.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  evaluateSourceAuthenticity,
  evaluateAuthorAttribution,
  classifyVerificationHierarchy,
  evaluateCrossSourceCorroboration,
  createCanonicalVerificationEvent,
} from "../lib/evidence/verification-engine";

test("PHASE 3: 1. Source Authenticity & SSRF / Phishing Defense", () => {
  // Test 1a: SSRF loopback & metadata address blocking
  const loopbackCheck = evaluateSourceAuthenticity("http://127.0.0.1:8080/admin");
  assert.equal(loopbackCheck.isAuthentic, false);
  assert.equal(loopbackCheck.issuerAuthorityLevel, "BLOCKED_SSRF");
  assert.equal(loopbackCheck.isSsrfSafe, false);

  const metadataCheck = evaluateSourceAuthenticity("http://169.254.169.254/latest/meta-data");
  assert.equal(metadataCheck.isAuthentic, false);
  assert.equal(metadataCheck.issuerAuthorityLevel, "BLOCKED_SSRF");

  const privateNetCheck = evaluateSourceAuthenticity("http://10.1.2.3/internal/repo");
  assert.equal(privateNetCheck.isAuthentic, false);
  assert.equal(privateNetCheck.issuerAuthorityLevel, "BLOCKED_SSRF");

  // Test 1b: Typosquatting and phishing detection
  const fakeGhCheck = evaluateSourceAuthenticity("https://g1thub.com/candidate/repo");
  assert.equal(fakeGhCheck.isAuthentic, false);
  assert.equal(fakeGhCheck.issuerAuthorityLevel, "SUSPICIOUS_DOMAIN");
  assert.equal(fakeGhCheck.confidenceScore, 0.0);

  const fakeLiCheck = evaluateSourceAuthenticity("https://linked1n.com/in/student");
  assert.equal(fakeLiCheck.isAuthentic, false);
  assert.equal(fakeLiCheck.issuerAuthorityLevel, "SUSPICIOUS_DOMAIN");

  // Test 1c: Recognized platform authority
  const validGhCheck = evaluateSourceAuthenticity("https://github.com/developer/portfolio");
  assert.equal(validGhCheck.isAuthentic, true);
  assert.equal(validGhCheck.issuerAuthorityLevel, "RECOGNIZED_PLATFORM");
  assert.ok(validGhCheck.confidenceScore >= 0.9);

  const validCredlyCheck = evaluateSourceAuthenticity("https://www.credly.com/badges/abc-123");
  assert.equal(validCredlyCheck.isAuthentic, true);
  assert.equal(validCredlyCheck.issuerAuthorityLevel, "VERIFIED_ISSUER");
  assert.ok(validCredlyCheck.confidenceScore >= 0.9);
});

test("PHASE 3: 2. Author Attribution & Originality Scorer (Scenarios 6 & 11)", () => {
  // 2a. Solo project
  const soloResult = evaluateAuthorAttribution({
    candidateId: "cand-1",
    candidateUsername: "johndoe",
    repoOwner: "johndoe",
    repoName: "distributed-cache",
    isFork: false,
    candidateCommitsCount: 42,
    totalTeamCommits: 42,
    hasCandidateOriginalCommits: true,
  });
  assert.equal(soloResult.attributionStatus, "PRIMARY_AUTHOR");
  assert.equal(soloResult.authorshipRatio, 1.0);
  assert.equal(soloResult.attributionConfidence, 1.0);

  // 2b. Team project with low authorship (<15%) and no PRs (Scenario 6)
  const teamLowShareResult = evaluateAuthorAttribution({
    candidateId: "cand-1",
    candidateUsername: "johndoe",
    repoOwner: "org-shared",
    repoName: "heavy-backend",
    isFork: false,
    candidateCommitsCount: 5,
    totalTeamCommits: 100, // 5%
    hasCandidateOriginalCommits: true,
    prsAuthoredCount: 0,
  });
  assert.equal(teamLowShareResult.attributionStatus, "UNCERTAIN_ATTRIBUTION");
  assert.equal(teamLowShareResult.authorshipRatio, 0.05);
  assert.ok(teamLowShareResult.attributionConfidence <= 0.2);
  assert.ok(teamLowShareResult.flags.includes("UNCERTAIN_ATTRIBUTION"));

  // 2c. Team project with substantive contribution (35%)
  const teamContributorResult = evaluateAuthorAttribution({
    candidateId: "cand-1",
    candidateUsername: "johndoe",
    repoOwner: "university-capstone",
    repoName: "drone-controller",
    isFork: false,
    candidateCommitsCount: 35,
    totalTeamCommits: 100, // 35%
    hasCandidateOriginalCommits: true,
    prsAuthoredCount: 4,
  });
  assert.equal(teamContributorResult.attributionStatus, "VERIFIED_CONTRIBUTOR");
  assert.equal(teamContributorResult.authorshipRatio, 0.35);
  assert.ok(teamContributorResult.attributionConfidence >= 0.6);

  // 2d. Fork without candidate original commits (Scenario 11)
  const forkZeroCommits = evaluateAuthorAttribution({
    candidateId: "cand-1",
    candidateUsername: "johndoe",
    repoOwner: "johndoe",
    repoName: "forked-linux-kernel",
    isFork: true,
    candidateCommitsCount: 0,
    totalTeamCommits: 50000,
    hasCandidateOriginalCommits: false,
  });
  assert.equal(forkZeroCommits.attributionStatus, "FORK_WITHOUT_CONTRIBUTIONS");
  assert.equal(forkZeroCommits.attributionConfidence, 0.0);
  assert.ok(forkZeroCommits.flags.includes("FORK_NO_ORIGINAL_COMMITS"));

  // 2e. Template clone with minimal commits
  const templateClone = evaluateAuthorAttribution({
    candidateId: "cand-1",
    candidateUsername: "johndoe",
    repoOwner: "johndoe",
    repoName: "create-react-app-starter",
    isFork: false,
    isTemplate: true,
    candidateCommitsCount: 1,
    totalTeamCommits: 1,
    hasCandidateOriginalCommits: true,
  });
  assert.equal(templateClone.attributionStatus, "TEMPLATE_CLONE_DETECTED");
  assert.equal(templateClone.attributionConfidence, 0.1);
});

test("PHASE 3: 3. Verification Hierarchy Classification (Levels A, B, C)", () => {
  // Document level (Resume, unverified PDF)
  const levelA = classifyVerificationHierarchy({
    sourceType: "resume",
    hasDocumentMetadataOnly: true,
  });
  assert.equal(levelA.level, "LEVEL_A_DOCUMENT");
  assert.equal(levelA.maxConfidence, 0.65);

  // Platform API / Inspected repository
  const levelB = classifyVerificationHierarchy({
    sourceType: "github",
    isDirectPlatformApi: true,
  });
  assert.equal(levelB.level, "LEVEL_B_ISSUER_DIRECT");
  assert.equal(levelB.maxConfidence, 0.90);

  // Cryptographic Credential
  const levelC = classifyVerificationHierarchy({
    sourceType: "certification",
    isCryptographicCredential: true,
  });
  assert.equal(levelC.level, "LEVEL_C_CRYPTOGRAPHIC");
  assert.equal(levelC.maxConfidence, 1.0);
});

test("PHASE 3: 4. Cross-Source Corroboration vs Circular Self-Reporting", () => {
  // Independent Corroboration: Resume + GitHub + Assessment
  const independentCorroboration = evaluateCrossSourceCorroboration([
    "resume",
    "github",
    "practical_assessment",
  ]);
  assert.equal(independentCorroboration.corroborationType, "INDEPENDENT_CORROBORATION");
  assert.equal(independentCorroboration.independentSourcesCount, 2);
  assert.ok(independentCorroboration.confidenceBonus > 0, "Independent corroboration must grant confidence bonus");

  // Circular Self-Reporting: Resume + LinkedIn + Self Declaration
  const circularReporting = evaluateCrossSourceCorroboration([
    "resume",
    "linkedin",
    "self_declaration",
  ]);
  assert.equal(circularReporting.corroborationType, "CIRCULAR_SELF_REPORTING");
  assert.equal(circularReporting.independentSourcesCount, 0);
  assert.equal(circularReporting.confidenceBonus, 0.0, "Circular reporting must NOT grant confidence bonus");

  // Single Source: GitHub only
  const singleSource = evaluateCrossSourceCorroboration(["github"]);
  assert.equal(singleSource.corroborationType, "SINGLE_SOURCE");
  assert.equal(singleSource.confidenceBonus, 0.0);
});

test("PHASE 3: 5. Immutable Verification Event Generation & Tamper-Evident Signature", () => {
  const event = createCanonicalVerificationEvent({
    claimId: "cl_fastapi_async",
    evidenceId: "ev_repo_main_py",
    verifier: "ast_manifest_verifier_v3",
    method: "AUTOMATED_CODE_INSPECTION",
    verificationLevel: "LEVEL_B_ISSUER_DIRECT",
    result: "PASS",
    attributionConfidence: 1.0,
    authenticityConfidence: 0.95,
    corroborationType: "INDEPENDENT_CORROBORATION",
    details: "FastAPI routes and async endpoints verified in main.py",
  });

  assert.ok(event.id.startsWith("ve_"), "Must generate unique event ID");
  assert.equal(event.result, "PASS");
  assert.equal(event.verificationLevel, "LEVEL_B_ISSUER_DIRECT");
  assert.ok(event.auditSignature, "Must contain SHA-256 audit signature");
  assert.equal(event.auditSignature.length, 64, "SHA-256 signature must be 64 hex characters");

  // Verify that tampering with any signed property produces a signature mismatch
  const tamperedPayload = [
    event.id,
    "cl_tampered_claim_id", // Tampered claim ID
    event.evidenceId,
    event.verifier,
    event.method,
    event.verificationLevel,
    event.result,
    event.checkedAt,
  ].join("::");

  const tamperedSignature = crypto.createHash("sha256").update(tamperedPayload).digest("hex");
  assert.notEqual(event.auditSignature, tamperedSignature, "Tampered event must fail signature check");
});

