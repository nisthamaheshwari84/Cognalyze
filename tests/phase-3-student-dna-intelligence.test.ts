/**
 * tests/phase-3-student-dna-intelligence.test.ts
 * 
 * COGNALYZE PHASE 3: EVIDENCE-BASED STUDENT DNA INTELLIGENCE ENGINE TEST SUITE
 * 
 * Verifies compliance with all Phase 3 requirements:
 * 1. Canonical Skill Intelligence & Normalization
 * 2. Claim-Level Evidence Reasoning & Provenance
 * 3. Reproducible Metrics & Auditable Metric Proofs
 * 4. Transparent Proficiency Assessment & Observable Rubrics
 * 5. Role-Specific Skill Gap Analysis & JD Provenance
 * 6. Personalized Recommendations & Closed-Loop Action Execution
 * 7. Multi-Tenant Isolation & Ownership Boundaries
 * 8. Honest Handling of Stale, Failed, and Unassessed Data
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Skill Intelligence & Taxonomy
import {
  normalizeCanonicalSkill,
  evaluateSkillEvidence,
  evaluateStudentSkillIntelligence,
  CANONICAL_EVALUATION_VERSION
} from "../lib/dna/skill-intelligence-engine";
import { CANONICAL_SKILL_TAXONOMY, getCanonicalSkill } from "../lib/dna/taxonomy";

// Metric Proof Engine
import {
  calculateStudentDNAMetrics,
  getMetricProof,
  METRIC_CALCULATION_VERSION
} from "../lib/dna/metric-proof";

// Role Gap Engine
import {
  evaluateRoleGaps,
  completeRecommendedAction,
  ROLE_GAP_ENGINE_VERSION
} from "../lib/dna/role-gap-engine";
import { PRESET_REQUIREMENT_PROFILES, RequirementProfile } from "../lib/dna/requirement-engine";

// Evidence contracts & stores
import { DNAEvidence } from "../lib/dna/evidence-pipeline";
import { getStudentDNAFull, addStudentEvidenceRecord, invalidateUserDNAScope } from "../lib/dna/store";

function buildMockEvidence(items: any[]): DNAEvidence[] {
  return items.map(item => ({
    confidence: "MEDIUM" as const,
    verificationStatus: "CLAIM_ONLY" as const,
    provenance: "Test Provenance",
    createdAt: item.timestamp || new Date().toISOString(),
    observedAt: item.timestamp || new Date().toISOString(),
    ...item
  })) as DNAEvidence[];
}

describe("PHASE 3: EVIDENCE-BASED STUDENT DNA INTELLIGENCE ENGINE", () => {

  // ─────────────────────────────────────────────────────────────
  // 1. CANONICAL SKILL NORMALIZATION & TAXONOMY TESTS
  // ─────────────────────────────────────────────────────────────
  describe("1. Canonical Skill Normalization & Taxonomy Boundaries", () => {
    it("normalizes case and harmless formatting to canonical skills", () => {
      const testCases = [
        { raw: "Python", expectedId: "python" },
        { raw: "python3", expectedId: "python" },
        { raw: "  React.js  ", expectedId: "react" },
        { raw: "TypeScript", expectedId: "typescript" },
        { raw: "node-js", expectedId: "node" }
      ];

      for (const tc of testCases) {
        const result = normalizeCanonicalSkill(tc.raw);
        assert.ok(result.canonicalSkill, `Should resolve '${tc.raw}'`);
        assert.equal(result.canonicalSkill?.skillId, tc.expectedId);
      }
    });

    it("preserves strict distinction between related but different skills", () => {
      // C vs C++ vs C#
      const cppNorm = normalizeCanonicalSkill("C++");
      const csharpNorm = normalizeCanonicalSkill("C#");
      assert.equal(cppNorm.canonicalSkill?.skillId, "cpp");
      assert.notEqual(csharpNorm.canonicalSkill?.skillId, "cpp");

      // Python vs FastAPI
      const pyNorm = normalizeCanonicalSkill("Python");
      const fastApiNorm = normalizeCanonicalSkill("FastAPI");
      assert.equal(pyNorm.canonicalSkill?.skillId, "python");
      assert.equal(fastApiNorm.canonicalSkill?.skillId, "fastapi");
      assert.notEqual(pyNorm.canonicalSkill?.skillId, fastApiNorm.canonicalSkill?.skillId);

      // SQL vs PostgreSQL
      const sqlNorm = normalizeCanonicalSkill("SQL");
      const pgNorm = normalizeCanonicalSkill("PostgreSQL");
      assert.equal(sqlNorm.canonicalSkill?.skillId, "sql");
      assert.equal(pgNorm.canonicalSkill?.skillId, "postgresql");
      assert.notEqual(sqlNorm.canonicalSkill?.skillId, pgNorm.canonicalSkill?.skillId);

      // Docker vs AWS
      const dockerNorm = normalizeCanonicalSkill("Docker");
      const awsNorm = normalizeCanonicalSkill("AWS");
      assert.equal(dockerNorm.canonicalSkill?.skillId, "docker");
      assert.equal(awsNorm.canonicalSkill?.skillId, "aws");
    });

    it("records mapping reason and normalized text without destructive merging", () => {
      const res = normalizeCanonicalSkill("ReactJS");
      assert.ok(res.canonicalSkill);
      assert.equal(res.canonicalSkill.name, "React");
      assert.ok(res.mappingReason.includes("React"));
    });

    it("returns null for unknown technologies without inventing taxonomy items", () => {
      const res = normalizeCanonicalSkill("CompletelyFictionalTechnologyX999");
      assert.equal(res.canonicalSkill, null);
      assert.ok(res.mappingReason.includes("No canonical taxonomy entry matches"));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. TRANSPARENT PROFICIENCY ASSESSMENT & RUBRIC TESTS
  // ─────────────────────────────────────────────────────────────
  describe("2. Transparent Proficiency Assessment & Observable Rubrics", () => {
    const pythonSkill = getCanonicalSkill("python")!;

    it("classifies resume mention without inspected code as SELF_REPORTED, never VERIFIED", () => {
      const resumeOnlyEvidence: DNAEvidence[] = buildMockEvidence([
        {
          id: "ev_res_py_1",
          sourceType: "resume",
          sourceId: "resume_doc_1",
          userId: "student-test-1",
          skillId: "python",
          skillName: "Python",
          category: "Languages",
          evidenceType: "claim",
          claim: "Student listed Python under skills section",
          extractedValue: "Python",
          strength: 0.5,
          reliability: 0.5,
          recency: "CURRENT",
          timestamp: new Date().toISOString()
        }
      ]);

      const evaluated = evaluateSkillEvidence(pythonSkill, resumeOnlyEvidence, "Intermediate");
      assert.equal(evaluated.assessmentStatus, "SELF_REPORTED");
      assert.equal(evaluated.statusBadge, "neutral");
      assert.ok(evaluated.limitations.some(l => l.includes("resume text") || l.includes("no relevant code")));
      // Rubric check: Code implementation criterion is NOT satisfied
      const codeRubric = evaluated.rubricCriteria.find(r => r.criterionId === "code_implementation_inspected");
      assert.equal(codeRubric?.satisfied, false);
    });

    it("supports capability with bounded finding when actual repository code is inspected", () => {
      const codeEvidence: DNAEvidence[] = buildMockEvidence([
        {
          id: "ev_gh_py_1",
          sourceType: "github",
          sourceId: "https://github.com/student/task-queue",
          userId: "student-test-1",
          skillId: "python",
          skillName: "Python",
          category: "Languages",
          evidenceType: "project_artifact",
          claim: "Implemented asynchronous worker in worker.py",
          extractedValue: "worker.py containing Celery task processor",
          strength: 0.85,
          reliability: 0.9,
          recency: "CURRENT",
          timestamp: new Date().toISOString(),
          metadata: { filePath: "src/worker.py", projectTitle: "Task Queue" }
        }
      ]);

      const evaluated = evaluateSkillEvidence(pythonSkill, codeEvidence);
      assert.equal(evaluated.assessmentStatus, "SUPPORTED");
      assert.equal(evaluated.statusBadge, "success");
      assert.ok(evaluated.limitations.some(l => l.includes("authorship") || l.includes("Static inspection")));
      // Rubric check: Code implementation criterion IS satisfied
      const codeRubric = evaluated.rubricCriteria.find(r => r.criterionId === "code_implementation_inspected");
      assert.equal(codeRubric?.satisfied, true);
      assert.equal(codeRubric?.satisfyingEvidenceIds[0], "ev_gh_py_1");
    });

    it("marks skill INDEPENDENTLY_VERIFIED only when official issuer verification is present", () => {
      const certEvidence: DNAEvidence[] = buildMockEvidence([
        {
          id: "ev_cert_py_1",
          sourceType: "certification",
          sourceId: "cert_python_institute",
          userId: "student-test-1",
          skillId: "python",
          skillName: "Python",
          category: "Languages",
          evidenceType: "credential",
          claim: "Certified Associate in Python Programming",
          extractedValue: "Credential ID: PCAP-31-03",
          strength: 0.95,
          reliability: 0.95,
          recency: "CURRENT",
          timestamp: new Date().toISOString(),
          metadata: { issuer: "Python Institute", issuerVerified: true }
        }
      ]);

      const evaluated = evaluateSkillEvidence(pythonSkill, certEvidence);
      assert.equal(evaluated.assessmentStatus, "INDEPENDENTLY_VERIFIED");
      assert.equal(evaluated.statusBadge, "success");
      const indepRubric = evaluated.rubricCriteria.find(r => r.criterionId === "independent_verification");
      assert.equal(indepRubric?.satisfied, true);
    });

    it("detects CONFLICTING_EVIDENCE when candidate claims Advanced but fails basic assessment", () => {
      const mixedEvidence: DNAEvidence[] = buildMockEvidence([
        {
          id: "ev_claim_1",
          sourceType: "resume",
          sourceId: "resume_1",
          userId: "student-test-1",
          skillId: "python",
          skillName: "Python",
          category: "Languages",
          evidenceType: "claim",
          claim: "Senior Python developer",
          extractedValue: "Advanced",
          strength: 0.8,
          reliability: 0.5,
          recency: "CURRENT",
          timestamp: new Date().toISOString(),
          metadata: { declaredLevel: "Advanced" }
        },
        {
          id: "ev_assessment_fail_1",
          sourceType: "assessment",
          sourceId: "att_python_diagnostic",
          userId: "student-test-1",
          skillId: "python",
          skillName: "Python",
          category: "Languages",
          evidenceType: "practical_task",
          claim: "Scored 35% on Python Diagnostic Assessment",
          extractedValue: "Score: 35%",
          strength: 0.35,
          reliability: 0.95,
          recency: "CURRENT",
          timestamp: new Date().toISOString(),
          metadata: { score: 35 }
        }
      ]);

      const evaluated = evaluateSkillEvidence(pythonSkill, mixedEvidence, "Advanced");
      assert.equal(evaluated.assessmentStatus, "CONFLICTING_EVIDENCE");
      assert.equal(evaluated.statusBadge, "danger");
      assert.ok(evaluated.statusExplanation.includes("conflicts with assessment result"));
    });

    it("identifies STALE recency state when evidence is older than 365 days", () => {
      const oldEvidence: DNAEvidence[] = buildMockEvidence([
        {
          id: "ev_old_py_1",
          sourceType: "project",
          sourceId: "old_proj",
          userId: "student-test-1",
          skillId: "python",
          skillName: "Python",
          category: "Languages",
          evidenceType: "project_artifact",
          claim: "Built Python script 2 years ago",
          extractedValue: "script.py",
          strength: 0.7,
          reliability: 0.8,
          recency: "STALE",
          timestamp: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

      const evaluated = evaluateSkillEvidence(pythonSkill, oldEvidence);
      assert.equal(evaluated.recencyState, "STALE");
      assert.ok(evaluated.limitations.some(l => l.includes("12 months")));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. REPRODUCIBLE METRICS & AUDIT PROOF TESTS
  // ─────────────────────────────────────────────────────────────
  describe("3. Reproducible Metrics & Auditable Metric Proofs", () => {
    it("produces exact formulas, numerators, denominators, and eligible input IDs", async () => {
      const mockEvidence: DNAEvidence[] = buildMockEvidence([
        {
          id: "ev_m1",
          sourceType: "github",
          sourceId: "repo_chat",
          userId: "student-metric-1",
          skillId: "python",
          skillName: "Python",
          category: "Languages",
          evidenceType: "project_artifact",
          claim: "Built chat backend",
          extractedValue: "chat.py",
          strength: 0.8,
          reliability: 0.9,
          recency: "CURRENT",
          timestamp: new Date().toISOString(),
          metadata: { projectTitle: "Chat App", canonicalProjectId: "Chat App" }
        },
        {
          id: "ev_m2",
          sourceType: "project",
          sourceId: "repo_chat_frontend",
          userId: "student-metric-1",
          skillId: "react",
          skillName: "React",
          category: "Frontend",
          evidenceType: "project_artifact",
          claim: "Built chat UI",
          extractedValue: "App.tsx",
          strength: 0.8,
          reliability: 0.9,
          recency: "CURRENT",
          timestamp: new Date().toISOString(),
          metadata: { projectTitle: "Chat App", canonicalProjectId: "Chat App" }
        }
      ]);

      const claims = [
        { skillName: "Python", claimedLevel: "Intermediate" },
        { skillName: "React", claimedLevel: "Intermediate" },
        { skillName: "Docker", claimedLevel: "Beginner" }
      ];

      const summary = await calculateStudentDNAMetrics("student-metric-1", mockEvidence, claims);

      // 1. Evidence Records Count
      assert.equal(summary.evidenceRecordsCount.metricKey, "evidence_records_count");
      assert.equal(summary.evidenceRecordsCount.value, 2);
      assert.equal(summary.evidenceRecordsCount.eligibleInputIds.length, 2);
      assert.ok(summary.evidenceRecordsCount.formula.includes("COUNT(DISTINCT evidence_id"));

      // 2. Inspected Projects Count: Multiple skills in the same project canonicalize to 1 project!
      assert.equal(summary.inspectedProjectsCount.value, 1);
      assert.equal(summary.inspectedProjectsCount.deduplicationRule.includes("canonical project entity name"), true);

      // 3. Evidence Coverage %
      // 3 claims (Python, React, Docker). Python and React have inspected evidence, Docker does not.
      // Expected Coverage: (2 / 3) * 100 = 67%
      assert.equal(summary.evidenceCoveragePct.numerator, 2);
      assert.equal(summary.evidenceCoveragePct.denominator, 3);
      assert.equal(summary.evidenceCoveragePct.value, 67);
      assert.equal(summary.evidenceCoveragePct.status, "READY");
    });

    it("returns NOT_ENOUGH_DATA and never 0% when no assessable claims exist", async () => {
      const emptyEvidence: DNAEvidence[] = [];
      const emptyClaims: any[] = [];

      const summary = await calculateStudentDNAMetrics("student-empty", emptyEvidence, emptyClaims);

      assert.equal(summary.evidenceCoveragePct.status, "NOT_ENOUGH_DATA");
      assert.equal(summary.evidenceCoveragePct.displayText, "Not enough data");
      assert.equal(summary.evidenceCoveragePct.value, null);
    });

    it("retrieves individual metric proof via getMetricProof", async () => {
      const mockEvidence: DNAEvidence[] = buildMockEvidence([
        {
          id: "ev_indiv_1",
          sourceType: "practice",
          sourceId: "att_1",
          userId: "student-metric-2",
          skillId: "dsa",
          skillName: "Data Structures & Algorithms",
          category: "Core CS & DSA",
          evidenceType: "practical_task",
          claim: "Solved Tree problems",
          extractedValue: "Score: 80%",
          strength: 0.8,
          reliability: 0.9,
          recency: "CURRENT",
          timestamp: new Date().toISOString(),
          metadata: { score: 80 }
        }
      ]);

      const proof = await getMetricProof("student-metric-2", "assessments_count", mockEvidence);
      assert.ok(proof);
      assert.equal(proof.metricKey, "assessments_count");
      assert.equal(proof.value, 1);
      assert.equal(proof.eligibleInputIds.length, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. ROLE-SPECIFIC SKILL GAP ANALYSIS TESTS
  // ─────────────────────────────────────────────────────────────
  describe("4. Role-Specific Skill Gap Analysis & Job Description Provenance", () => {
    const sdeInternProfile = PRESET_REQUIREMENT_PROFILES["sde_intern"];

    it("preserves Must-Have vs Preferred requirements distinctly", () => {
      const studentEvidence: DNAEvidence[] = [];
      const report = evaluateRoleGaps("student-gap-1", sdeInternProfile, studentEvidence);

      assert.equal(report.targetRoleTitle, "Software Development Engineer Intern");
      assert.ok(report.mustHaveRequirementsCount > 0);
      assert.ok(report.preferredRequirementsCount >= 0);

      const dsaReq = report.evaluatedRequirements.find(r => r.skillId === "dsa");
      assert.ok(dsaReq);
      assert.equal(dsaReq.importance, "MUST_HAVE");

      const restReq = report.evaluatedRequirements.find(r => r.skillId === "rest_api");
      assert.ok(restReq);
      assert.equal(restReq.importance, "NICE_TO_HAVE");
    });

    it("labels unevidenced skills as NOT_ASSESSED, never as confirmed skill deficits", () => {
      const studentEvidence: DNAEvidence[] = [];
      const report = evaluateRoleGaps("student-gap-2", sdeInternProfile, studentEvidence);

      const dsaReq = report.evaluatedRequirements.find(r => r.skillId === "dsa")!;
      assert.equal(dsaReq.evidenceState, "NOT_ASSESSED");
      assert.equal(dsaReq.stateBadge, "neutral");
      assert.ok(dsaReq.missingInformation.includes("missing information rather than a confirmed skill deficit"));
    });

    it("distinguishes SELF_REPORTED_ONLY from SUPPORTED_BY_EVIDENCE", () => {
      const studentEvidence: DNAEvidence[] = buildMockEvidence([
        {
          id: "ev_res_dsa",
          sourceType: "resume",
          sourceId: "resume_1",
          userId: "student-gap-3",
          skillId: "dsa",
          skillName: "Data Structures & Algorithms",
          category: "Core CS & DSA",
          evidenceType: "claim",
          claim: "Proficient in DSA",
          extractedValue: "DSA",
          strength: 0.5,
          reliability: 0.5,
          recency: "CURRENT",
          timestamp: new Date().toISOString()
        },
        {
          id: "ev_code_py",
          sourceType: "github",
          sourceId: "repo_py",
          userId: "student-gap-3",
          skillId: "python",
          skillName: "Python",
          category: "Languages",
          evidenceType: "project_artifact",
          claim: "Built Python server",
          extractedValue: "server.py",
          strength: 0.85,
          reliability: 0.9,
          recency: "CURRENT",
          timestamp: new Date().toISOString()
        }
      ]);

      const report = evaluateRoleGaps("student-gap-3", sdeInternProfile, studentEvidence);

      // DSA is in resume only -> SELF_REPORTED_ONLY
      const dsaReq = report.evaluatedRequirements.find(r => r.skillId === "dsa")!;
      assert.equal(dsaReq.evidenceState, "SELF_REPORTED_ONLY");
      assert.equal(dsaReq.stateBadge, "warning");

      // Python has inspected code -> SUPPORTED_BY_EVIDENCE
      const pyReq = report.evaluatedRequirements.find(r => r.skillId === "python")!;
      assert.equal(pyReq.evidenceState, "SUPPORTED_BY_EVIDENCE");
      assert.equal(pyReq.stateBadge, "success");
    });

    it("identifies ASSESSED_GAP only when structured assessment fails passing criteria", () => {
      const failedDsaEvidence: DNAEvidence[] = buildMockEvidence([
        {
          id: "ev_att_fail_dsa",
          sourceType: "assessment",
          sourceId: "att_dsa_1",
          userId: "student-gap-4",
          skillId: "dsa",
          skillName: "Data Structures & Algorithms",
          category: "Core CS & DSA",
          evidenceType: "practical_task",
          claim: "Completed DSA challenge with 30% score",
          extractedValue: "Score: 30%",
          strength: 0.3,
          reliability: 0.95,
          recency: "CURRENT",
          timestamp: new Date().toISOString(),
          metadata: { score: 30 }
        }
      ]);

      const report = evaluateRoleGaps("student-gap-4", sdeInternProfile, failedDsaEvidence);
      const dsaReq = report.evaluatedRequirements.find(r => r.skillId === "dsa")!;
      assert.equal(dsaReq.evidenceState, "ASSESSED_GAP");
      assert.equal(dsaReq.stateBadge, "danger");
      assert.ok(dsaReq.stateExplanation.includes("Assessed gap"));
    });

    it("preserves provenance when evaluating custom Job Description requirements", () => {
      const customJD: RequirementProfile = {
        id: "req_custom_jd_1",
        roleTitle: "Backend Systems Engineer (Stripe)",
        companyOrContext: "Stripe",
        rawText: "Must have deep experience with Golang and distributed systems. Preferred Redis experience.",
        extractedAt: new Date().toISOString(),
        requirements: [
          {
            skillId: "golang",
            skillName: "Go",
            category: "Languages",
            targetLevel: 3,
            targetLevelLabel: "Intermediate",
            importance: "MUST_HAVE",
            sourceText: "Must have deep experience with Golang",
            confidence: "HIGH"
          }
        ]
      };

      const report = evaluateRoleGaps("student-gap-5", customJD, []);
      assert.equal(report.roleSourceType, "JOB_DESCRIPTION");
      assert.equal(report.evaluatedRequirements[0].requirementSource, "Explicit in Job Description");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. PERSONALIZED RECOMMENDATIONS & ACTION LOOP TESTS
  // ─────────────────────────────────────────────────────────────
  describe("5. Personalized Action Recommendations & Closed-Loop Execution", () => {
    it("generates actionable recommendations specifying expected deliverables and priority rank", () => {
      const sdeInternProfile = PRESET_REQUIREMENT_PROFILES["sde_intern"];
      const report = evaluateRoleGaps("student-rec-1", sdeInternProfile, []);

      assert.ok(report.recommendations.length > 0);
      const firstRec = report.recommendations[0];
      assert.ok(firstRec.recommendationId);
      assert.ok(firstRec.requiredAction);
      assert.ok(firstRec.expectedEvidenceArtifact);
      assert.ok(firstRec.completionCriteria);
      assert.ok(firstRec.priorityRank <= 4);
    });

    it("completes recommended action by attaching verified evidence and updating state", async () => {
      const evidencePool: DNAEvidence[] = [];
      const actionResult = await completeRecommendedAction(
        "student-rec-2",
        "rec_student_python_1",
        {
          artifactType: "github_repo",
          artifactUrl: "https://github.com/student/python-fastapi-backend",
          skillId: "python",
          details: { commitHash: "abc1234" }
        },
        evidencePool
      );

      assert.equal(actionResult.success, true);
      assert.equal(actionResult.updatedRecommendationStatus, "COMPLETED");
      assert.ok(actionResult.newEvidence);
      assert.equal(actionResult.newEvidence.skillId, "python");
      assert.equal(actionResult.newEvidence.userId, "student-rec-2");
      // Evidence is added to candidate's pool
      assert.equal(evidencePool.length, 1);
      assert.equal(evidencePool[0].id, actionResult.newEvidence.id);
    });

    it("rejects action completion with invalid or empty skill without mutating evidence pool", async () => {
      const evidencePool: DNAEvidence[] = [];
      const actionResult = await completeRecommendedAction(
        "student-rec-3",
        "rec_invalid_1",
        {
          artifactType: "github_repo",
          skillId: ""
        },
        evidencePool
      );

      assert.equal(actionResult.success, false);
      assert.equal(evidencePool.length, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. MULTI-TENANT ISOLATION & SERVER SECURITY TESTS
  // ─────────────────────────────────────────────────────────────
  describe("6. Multi-Tenant Data Isolation & Security Scoping", () => {
    it("ensures Candidate A and Candidate B evidence pools remain strictly isolated", async () => {
      const candidateA = "cand_alpha_test_1";
      const candidateB = "cand_beta_test_2";

      // Clear any prior state
      invalidateUserDNAScope(candidateA);
      invalidateUserDNAScope(candidateB);

      // Add evidence for Candidate A
      await addStudentEvidenceRecord(candidateA, {
        sourceType: "github",
        sourceId: "repo_alpha_private",
        userId: candidateA,
        skillRaw: "Python",
        evidenceType: "project_artifact",
        claim: "Alpha private Python implementation",
        extractedValue: "alpha.py",
        strength: 0.9,
        timestamp: new Date().toISOString()
      });

      // Add evidence for Candidate B
      await addStudentEvidenceRecord(candidateB, {
        sourceType: "github",
        sourceId: "repo_beta_private",
        userId: candidateB,
        skillRaw: "React",
        evidenceType: "project_artifact",
        claim: "Beta private React implementation",
        extractedValue: "Beta.tsx",
        strength: 0.9,
        timestamp: new Date().toISOString()
      });

      const dnaA = await getStudentDNAFull(candidateA);
      const dnaB = await getStudentDNAFull(candidateB);

      // Candidate A contains only Candidate A records
      assert.equal(dnaA.userId, candidateA);
      for (const ev of dnaA.evidence) {
        assert.equal(ev.userId, candidateA);
        assert.notEqual(ev.userId, candidateB);
      }

      // Candidate B contains only Candidate B records
      assert.equal(dnaB.userId, candidateB);
      for (const ev of dnaB.evidence) {
        assert.equal(ev.userId, candidateB);
        assert.notEqual(ev.userId, candidateA);
      }

      // Metric Proofs are strictly candidate-isolated
      assert.ok(dnaA.metricsProof);
      assert.ok(dnaB.metricsProof);
      assert.notEqual(dnaA.metricsProof?.skillsCount.calculationTimestamp, undefined);
    });
  });

});
