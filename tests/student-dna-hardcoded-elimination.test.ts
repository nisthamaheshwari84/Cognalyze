/**
 * tests/student-dna-hardcoded-elimination.test.ts
 *
 * RIGOROUS AUTOMATED VERIFICATION:
 * Proves the elimination of hardcoded fallbacks and verifies data-driven calculation
 * across all 12 mandated test conditions (Test A through Test L from Section 10).
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  getStudentDNAFull,
  invalidateUserDNAScope,
  retractEvidenceBySource,
  FullStudentDNAResponse
} from "../lib/dna/store";
import {
  calculateStudentSkillProfile,
  generateStudentDNASnapshot
} from "../lib/dna/profile-engine";
import {
  processEvidencePipeline,
  RawSourceData
} from "../lib/dna/evidence-pipeline";
import {
  buildCandidateUnifiedEvidenceDossier,
  invalidateCandidateEvidence
} from "../lib/evidence/candidate-evidence-engine";

describe("COGNALYZE STUDENT DNA — ELIMINATION OF HARDCODED METRICS (TEST A - TEST L)", () => {

  test("TEST A: Student with zero projects does not receive a fabricated project count", async () => {
    const studentId = `test_student_zero_proj_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    const dna: FullStudentDNAResponse = await getStudentDNAFull(studentId);

    // Must be strictly 0, not 1 or 8
    assert.equal(dna.snapshot.proofSummary.projectsCount, 0, "Numeric count must be 0");
    assert.equal(dna.snapshot.proofSummary.projectsDetail?.status, "NO_RECORDS", "Status must be NO_RECORDS");
    assert.equal(dna.snapshot.proofSummary.projectsDetail?.displayText, "No records found", "Display must be 'No records found'");
    assert.notEqual(dna.snapshot.proofSummary.projectsDetail?.displayText, "1", "Must not be hardcoded 1");
    assert.notEqual(dna.snapshot.proofSummary.projectsDetail?.displayText, "8", "Must not be hardcoded 8");
  });

  test("TEST B: Student with no hackathon records does not receive a fabricated hackathon count", async () => {
    const studentId = `test_student_zero_hack_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    const dna = await getStudentDNAFull(studentId);

    // Must be strictly 0, not 3
    assert.equal(dna.snapshot.proofSummary.hackathonsCount, 0, "Numeric count must be 0");
    assert.equal(dna.snapshot.proofSummary.hackathonsDetail?.status, "NO_RECORDS", "Status must be NO_RECORDS");
    assert.equal(dna.snapshot.proofSummary.hackathonsDetail?.displayText, "No records found", "Display must be 'No records found'");
    assert.notEqual(dna.snapshot.proofSummary.hackathonsDetail?.displayText, "3", "Must not be hardcoded 3");
  });

  test("TEST C: Unconnected GitHub account does not receive a fabricated repository count", async () => {
    const studentId = `test_student_no_gh_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    const dna = await getStudentDNAFull(studentId);

    assert.equal(dna.snapshot.proofSummary.githubDetail?.status, "NOT_CONNECTED", "Status must be NOT_CONNECTED");
    assert.equal(dna.snapshot.proofSummary.githubDetail?.displayText, "Not connected", "Display must be 'Not connected'");
    assert.notEqual(dna.snapshot.proofSummary.githubDetail?.displayText, "1", "Must not be hardcoded 1");
    assert.notEqual(dna.snapshot.proofSummary.githubDetail?.displayText, "14", "Must not be hardcoded 14");
  });

  test("TEST D: Unavailable LeetCode source does not produce a hardcoded solved count", async () => {
    const studentId = `test_student_no_lc_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    const dna = await getStudentDNAFull(studentId);

    assert.equal(dna.snapshot.proofSummary.leetcodeDetail?.status, "NOT_CONNECTED", "Status must be NOT_CONNECTED");
    assert.equal(dna.snapshot.proofSummary.leetcodeDetail?.displayText, "Not connected", "Display must be 'Not connected'");
    assert.notEqual(dna.snapshot.proofSummary.leetcodeDetail?.displayText, "186", "Must not be hardcoded 186");
    assert.notEqual(dna.snapshot.proofSummary.leetcodeSolvedCount, 186, "Proof summary must never default to 186");
  });

  test("TEST E: Skill signal counts match the actual evidence records", async () => {
    const studentId = `test_student_signals_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    const raw: RawSourceData[] = [
      {
        sourceType: "github",
        sourceId: "gh_repo_1",
        userId: studentId,
        skillRaw: "Python",
        evidenceType: "public_repo",
        claim: "Backend API developed with Python FastAPI",
        extractedValue: "FastAPI REST endpoints and SQLAlchemy models",
        strength: 0.9,
        timestamp: new Date().toISOString()
      },
      {
        sourceType: "assessment",
        sourceId: "dsa_exam_1",
        userId: studentId,
        skillRaw: "Python",
        evidenceType: "practical_task",
        claim: "Demonstrated Python list comprehension and generator routines",
        extractedValue: "95% score on Python runtime concepts",
        strength: 0.85,
        timestamp: new Date().toISOString(),
        metadata: { score: 95 }
      }
    ];

    const processed = processEvidencePipeline(raw);
    const profile = calculateStudentSkillProfile(studentId, processed);
    const pythonSkill = profile.find(s => s.skillId === "python");

    assert.ok(pythonSkill, "Python skill must be found in taxonomy profile");
    // Candidate has exactly 2 signals, not 6
    assert.equal(pythonSkill.evidenceCount, 2, "Evidence count must strictly match 2 distinct records");
    assert.notEqual(pythonSkill.evidenceCount, 6, "Must not be hardcoded 6 signals");
  });

  test("TEST F: Duplicate records are handled according to documented counting rules", async () => {
    const studentId = `test_student_dedup_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    // Two evidence records referencing the same repository entity
    const raw: RawSourceData[] = [
      {
        sourceType: "github",
        sourceId: "gh_repo_proj_alpha",
        userId: studentId,
        skillRaw: "TypeScript",
        evidenceType: "public_repo",
        claim: "Built Next.js web application",
        extractedValue: "TypeScript 5.3 components",
        strength: 0.8,
        timestamp: new Date().toISOString(),
        metadata: { canonicalProjectId: "Project Alpha" }
      },
      {
        sourceType: "resume",
        sourceId: "resume_proj_alpha",
        userId: studentId,
        skillRaw: "TypeScript",
        evidenceType: "project_artifact",
        claim: "Architected Project Alpha frontend",
        extractedValue: "Next.js and TypeScript",
        strength: 0.7,
        timestamp: new Date().toISOString(),
        metadata: { canonicalProjectId: "Project Alpha" }
      }
    ];

    const processed = processEvidencePipeline(raw);
    assert.equal(processed.length, 1, "Evidence pipeline must deduplicate items referencing identical canonical entity");
    assert.equal(processed[0].verificationStatus, "REPEATED", "Status elevated to REPEATED due to multi-source cross-corroboration");
  });

  test("TEST G: Different students receive different candidate-specific results", async () => {
    const studentA = `test_student_a_${Date.now()}`;
    const studentB = `test_student_b_${Date.now()}`;
    invalidateUserDNAScope(studentA);
    invalidateUserDNAScope(studentB);

    const dossierA = await buildCandidateUnifiedEvidenceDossier(studentA, {
      mockSources: {
        leetcodePayload: { accessible: true, totalSolved: 240, easySolved: 100, mediumSolved: 120, hardSolved: 20 }
      }
    });

    const dossierB = await buildCandidateUnifiedEvidenceDossier(studentB, {
      mockSources: {
        leetcodePayload: { accessible: true, totalSolved: 35, easySolved: 30, mediumSolved: 5, hardSolved: 0 }
      }
    });

    assert.equal(dossierA.leetcode.total_solved, 240, "Student A must have 240 solved");
    assert.equal(dossierB.leetcode.total_solved, 35, "Student B must have 35 solved");
    assert.notEqual(dossierA.leetcode.total_solved, dossierB.leetcode.total_solved, "Student metrics must be isolated and distinct");
  });

  test("TEST H: Switching accounts cannot retain another student's metrics", async () => {
    const studentUser = `test_student_user_${Date.now()}`;
    const studentOther = `test_student_other_${Date.now()}`;
    invalidateUserDNAScope(studentUser);
    invalidateUserDNAScope(studentOther);

    // Student User connects 2 accessible projects
    const dossier1 = await buildCandidateUnifiedEvidenceDossier(studentUser, {
      mockSources: {
        githubPayload: {
          accessible: true,
          repos: [
            { name: "repo-1", url: "https://github.com/u/repo-1", files: { "main.go": "package main" }, commits: 40 },
            { name: "repo-2", url: "https://github.com/u/repo-2", files: { "app.py": "print('hello')" }, commits: 15 }
          ]
        }
      }
    });
    assert.equal(dossier1.github.repos_count, 2);

    // Switch account to studentOther without repos
    const dossier2 = await buildCandidateUnifiedEvidenceDossier(studentOther);
    assert.equal(dossier2.github.repos_count, null, "Switched user must not retain studentUser's repos");
    assert.equal(dossier2.github.retrieval_status, "NOT_CONNECTED", "Switched user must reflect NOT_CONNECTED status");
  });

  test("TEST I: Deleting a record updates the appropriate metrics", async () => {
    const studentId = `test_student_retract_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    const raw: RawSourceData[] = [
      {
        sourceType: "github",
        sourceId: "gh_repo_todel",
        userId: studentId,
        skillRaw: "Rust",
        evidenceType: "public_repo",
        claim: "High-performance Rust parser",
        extractedValue: "Rust async parser",
        strength: 0.9,
        timestamp: new Date().toISOString()
      }
    ];

    processEvidencePipeline(raw);
    const retraction = await retractEvidenceBySource(studentId, "github");
    assert.ok(retraction.success, "Retraction should succeed");

    // Invalidation must clear cache
    const dnaAfter = await getStudentDNAFull(studentId);
    const rustSkill = dnaAfter.skills.find(s => s.skillId === "rust");
    assert.equal(rustSkill?.evidenceCount || 0, 0, "Rust skill evidence must drop to 0 after retraction");
  });

  test("TEST J: An API failure does not trigger a fake successful result", async () => {
    const studentId = `test_student_fail_api_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    const dossier = await buildCandidateUnifiedEvidenceDossier(studentId, {
      mockSources: {
        leetcodePayload: { accessible: false }
      }
    });

    assert.equal(dossier.leetcode.retrieval_status, "RETRIEVAL_FAILED", "Must be RETRIEVAL_FAILED");
    assert.equal(dossier.leetcode.total_solved, null, "Total solved must be null on failure");
    assert.ok(dossier.leetcode.error?.includes("Unable to retrieve"), "Error message must be present");
  });

  test("TEST K: Missing evidence cannot produce a verified skill", async () => {
    const studentId = `test_student_unproven_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    // Student provides empty evidence
    const skills = calculateStudentSkillProfile(studentId, []);
    const cplusplus = skills.find(s => s.skillId === "cpp");

    assert.ok(cplusplus, "C++ skill must exist in canonical taxonomy");
    assert.equal(cplusplus.evidenceCount, 0, "Signals count must be strictly 0");
    assert.equal(cplusplus.estimatedLevel, 0, "Estimated level must be 0 (Unknown)");
    assert.equal(cplusplus.verificationState, "UNKNOWN", "Verification state must be UNKNOWN, not VERIFIED");
    assert.notEqual(cplusplus.verificationState, "VERIFIED", "Unproven skill must never receive VERIFIED badge");
  });

  test("TEST L: Refresh does not claim success when relevant source retrieval fails", async () => {
    const studentId = `test_student_refresh_fail_${Date.now()}`;
    invalidateUserDNAScope(studentId);

    const dossier = await buildCandidateUnifiedEvidenceDossier(studentId, {
      mockSources: {
        deploymentPayload: { url: "https://dead-app-production.com", accessible: false }
      }
    });

    const failedDeploy = dossier.deployments.deployments.find(d => d.url === "https://dead-app-production.com");
    assert.ok(failedDeploy, "Deployment item must be recorded in dossier");
    assert.equal(failedDeploy.accessible, false, "Accessible flag must be false");
    assert.equal(failedDeploy.verification_status, "RETRIEVAL_FAILED", "Status must be marked RETRIEVAL_FAILED");
    assert.notEqual(failedDeploy.verification_status, "INDEPENDENTLY_VERIFIED", "Failed endpoint must never be marked verified");
  });

});
