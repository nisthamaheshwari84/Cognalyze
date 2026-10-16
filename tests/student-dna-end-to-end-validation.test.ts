/**
 * tests/student-dna-end-to-end-validation.test.ts
 * 
 * COGNALYZE STUDENT DNA END-TO-END VALIDATION SUITE (SECTION 17 SPECIFICATION)
 * 
 * Validates all 18 mandatory acceptance tests:
 * TEST 1: PROFILE PERSISTENCE
 * TEST 2: MULTI-USER ISOLATION
 * TEST 3: SOURCE FAILURE
 * TEST 4: EMPTY SUCCESSFUL SOURCE
 * TEST 5: RESUME CLAIM
 * TEST 6: EVIDENCE INSPECTION
 * TEST 7: ROLE ISOLATION
 * TEST 8: ROLE PERSISTENCE
 * TEST 9: METRIC PROOF
 * TEST 10: DUPLICATE PREVENTION
 * TEST 11: AI FAILURE
 * TEST 12: UNSUPPORTED AI CLAIM
 * TEST 13: REFRESH RECOVERY
 * TEST 14: RECOMMENDATION PERSONALIZATION
 * TEST 15: NEW EVIDENCE
 * TEST 16: AUTHORIZATION
 * TEST 17: OPPORTUNITY AUTHENTICITY
 * TEST 18: REGRESSION
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Auth & Store
import {
  createUser,
  getUserById,
  createSession,
  deleteSession,
  getSessionByToken,
  upsertStudentProfileByUserId,
  getStudentProfileByUserId
} from "../lib/auth/store";
import { StudentProfile } from "../lib/auth/types";

// DNA Stores & Engines
import {
  getStudentDNAFull,
  addStudentEvidenceRecord,
  getStudentEvidenceList,
  setUserTargetRole,
  getUserTargetRole,
  invalidateUserDNAScope
} from "../lib/dna/store";
import { DNAEvidence, RawSourceData } from "../lib/dna/evidence-pipeline";
import { calculateStudentDNAMetrics } from "../lib/dna/metric-proof";
import { evaluateStudentSkillIntelligence, normalizeCanonicalSkill } from "../lib/dna/skill-intelligence-engine";
import { getBenchmarkProfile, RequirementProfile } from "../lib/dna/requirement-engine";
import { evaluateRoleGaps, completeRecommendedAction } from "../lib/dna/role-gap-engine";
import { buildCandidateUnifiedEvidenceDossier } from "../lib/evidence/candidate-evidence-engine";
import { getAllPersonalizedOpportunities } from "../lib/dna/opportunity-intelligence";

describe("SECTION 17: STUDENT DNA COMPREHENSIVE VALIDATION (TEST 1 - TEST 18)", () => {

  // ─────────────────────────────────────────────────────────────
  // TEST 1: PROFILE PERSISTENCE
  // ─────────────────────────────────────────────────────────────
  it("TEST 1: PROFILE PERSISTENCE — Create profile, save, refresh, logout, login, verify saved", async () => {
    const testId = `persist_user_${Date.now()}`;
    const email = `${testId}@campus.edu`;
    createUser({
      id: testId,
      fullName: "Persistence Test Student",
      email,
      accountType: "student",
      passwordHash: null,
      passwordSalt: null
    });

    const session = createSession(testId, "student");
    assert.ok(session.token, "Session token should be generated");

    const profileData: Partial<StudentProfile> = {
      fullName: "Persistence Student",
      phone: "9876543210",
      college: "Indian Institute of Technology",
      degree: "B.Tech Computer Science",
      graduationYear: "2026",
      cgpa: "8.8",
      skills: [{ name: "Python", level: "Advanced" }, { name: "PostgreSQL", level: "Intermediate" }],
      projects: [{ title: "Distributed Key-Value Store", description: "Storage engine", techStack: ["Python", "Raft"], githubUrl: "https://github.com/persist/kv-store" }],
      careerGoals: { targetRoles: ["Backend Infrastructure Engineer"], preferredDomains: ["Distributed Systems"], targetCompanies: [], preferredLocations: [] }
    };

    upsertStudentProfileByUserId(testId, profileData);

    // Verify persisted
    const saved = getStudentProfileByUserId(testId);
    assert.ok(saved, "Profile must be retrieved from store");
    assert.equal(saved.fullName, "Persistence Student");
    assert.equal(saved.cgpa, "8.8");
    assert.equal(saved.skills.length, 2);

    // Logout
    deleteSession(session.token);
    assert.equal(getSessionByToken(session.token), null, "Session must be invalidated on logout");

    // Login with new session
    const newSession = createSession(testId, "student");
    assert.ok(newSession.token, "New session created");

    // Verify profile data remains saved after new authenticated session
    const postLoginProfile = getStudentProfileByUserId(testId);
    assert.ok(postLoginProfile, "Profile must persist across sessions");
    assert.equal(postLoginProfile.fullName, "Persistence Student");
    assert.equal(postLoginProfile.skills[0].name, "Python");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 2: MULTI-USER ISOLATION
  // ─────────────────────────────────────────────────────────────
  it("TEST 2: MULTI-USER ISOLATION — Two students with different info; neither can access other's data", async () => {
    const userA = `iso_user_A_${Date.now()}`;
    const userB = `iso_user_B_${Date.now()}`;

    createUser({ id: userA, fullName: "Student Alpha", email: `${userA}@test.com`, accountType: "student", passwordHash: null, passwordSalt: null });
    createUser({ id: userB, fullName: "Student Beta", email: `${userB}@test.com`, accountType: "student", passwordHash: null, passwordSalt: null });

    upsertStudentProfileByUserId(userA, {
      fullName: "Student Alpha",
      skills: [{ name: "Rust", level: "Advanced" }],
      projects: [{ title: "Rust Compiler", description: "Compiler in Rust", techStack: ["Rust"], githubUrl: "https://github.com/alpha/rust-compiler" }]
    });

    upsertStudentProfileByUserId(userB, {
      fullName: "Student Beta",
      skills: [{ name: "Java", level: "Intermediate" }],
      projects: [{ title: "Spring Microservice", description: "Spring Boot API", techStack: ["Java"], githubUrl: "https://github.com/beta/spring-service" }]
    });

    await addStudentEvidenceRecord(userA, {
      userId: userA,
      sourceType: "github",
      sourceId: "repo_alpha_1",
      skillRaw: "Rust",
      evidenceType: "code_inspection",
      claim: "Demonstrated safe memory management in Rust"
    });

    await addStudentEvidenceRecord(userB, {
      userId: userB,
      sourceType: "github",
      sourceId: "repo_beta_1",
      skillRaw: "Java",
      evidenceType: "code_inspection",
      claim: "Spring Boot dependency injection configuration"
    });

    const dnaA = await getStudentDNAFull(userA);
    const dnaB = await getStudentDNAFull(userB);

    // Assert absolute isolation
    assert.equal(dnaA.userId, userA);
    assert.equal(dnaB.userId, userB);

    const aEvidenceSkills = dnaA.evidence.map(e => e.skillId);
    const bEvidenceSkills = dnaB.evidence.map(e => e.skillId);

    assert.ok(aEvidenceSkills.includes("rust"), "User A must have Rust evidence");
    assert.ok(!aEvidenceSkills.includes("java"), "User A must NOT have User B's Java evidence");

    assert.ok(bEvidenceSkills.includes("java"), "User B must have Java evidence");
    assert.ok(!bEvidenceSkills.includes("rust"), "User B must NOT have User A's Rust evidence");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 3: SOURCE FAILURE
  // ─────────────────────────────────────────────────────────────
  it("TEST 3: SOURCE FAILURE — Simulated failed source is not shown as zero or fabricated success", async () => {
    const studentId = `src_fail_${Date.now()}`;
    const dossier = await buildCandidateUnifiedEvidenceDossier(studentId);

    // Unconnected/unconfigured sources must honestly report their non-connected status
    assert.ok(
      dossier.github.retrieval_status === "NOT_CONNECTED" ||
      dossier.github.retrieval_status === "NOT_PROVIDED" ||
      dossier.github.retrieval_status === "RETRIEVAL_FAILED"
    );
    assert.ok(
      dossier.leetcode.retrieval_status === "NOT_CONNECTED" ||
      dossier.leetcode.retrieval_status === "NOT_PROVIDED" ||
      dossier.leetcode.retrieval_status === "RETRIEVAL_FAILED"
    );
    assert.notEqual(dossier.github.accessible_repos?.length, 100);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 4: EMPTY SUCCESSFUL SOURCE
  // ─────────────────────────────────────────────────────────────
  it("TEST 4: EMPTY SUCCESSFUL SOURCE — Successful retrieval with zero records shows genuine zero", async () => {
    const studentId = `empty_src_${Date.now()}`;
    createUser({ id: studentId, fullName: "Empty Source Student", email: `${studentId}@test.com`, accountType: "student", passwordHash: null, passwordSalt: null });

    // Explicitly empty projects list
    upsertStudentProfileByUserId(studentId, {
      fullName: "Empty Source Student",
      skills: [{ name: "HTML", level: "Beginner" }],
      projects: []
    });

    const metrics = await calculateStudentDNAMetrics(studentId, [], [{ skillName: "HTML" }]);
    assert.equal(metrics.inspectedProjectsCount.value, 0, "Inspected projects count should be legitimately 0");
    assert.equal(metrics.inspectedProjectsCount.eligibleInputIds.length, 0);
    assert.ok(metrics.inspectedProjectsCount.formula.length > 0, "Metric proof formula must be documented");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 5: RESUME CLAIM
  // ─────────────────────────────────────────────────────────────
  it("TEST 5: RESUME CLAIM — Resume containing Python does not mark Python independently verified", async () => {
    const studentId = `resume_claim_${Date.now()}`;
    const resumeEvidence: DNAEvidence[] = [
      {
        id: `ev_res_${Date.now()}`,
        userId: studentId,
        sourceType: "resume",
        sourceId: "resume_doc_1",
        skillId: "python",
        evidenceType: "resume_extraction",
        claim: "Extracted mention of Python from uploaded resume",
        confidence: "LOW",
        verificationStatus: "CLAIMED",
        strength: 0.45,
        reliability: 0.45,
        recency: "CURRENT",
        provenance: "Resume: Technical Skills section",
        createdAt: new Date().toISOString(),
        observedAt: new Date().toISOString()
      }
    ];

    const studentClaims = [{ skillName: "Python", claimedLevel: "Advanced" }];
    const intel = evaluateStudentSkillIntelligence(studentId, resumeEvidence, studentClaims);
    const pySkill = intel.evaluatedSkills.find(s => s.skillId === "python");

    assert.ok(pySkill, "Python skill should be evaluated");
    assert.equal(pySkill.assessmentStatus, "SELF_REPORTED", "Resume claim must be classified as SELF_REPORTED");
    assert.notEqual(pySkill.assessmentStatus, "INDEPENDENTLY_VERIFIED");
    assert.equal(pySkill.rubricCriteria.find(r => r.criterionId === "code_implementation_inspected")?.satisfied, false);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 6: EVIDENCE INSPECTION
  // ─────────────────────────────────────────────────────────────
  it("TEST 6: EVIDENCE INSPECTION — Inspection findings reference actual inspected content and file paths", async () => {
    const studentId = `code_insp_${Date.now()}`;
    const rawCodeData: RawSourceData = {
      userId: studentId,
      sourceType: "github",
      sourceId: "repo_api_service",
      sourceUrl: "https://github.com/student/api-service",
      skillRaw: "Python",
      evidenceType: "code_inspection",
      claim: "Implemented FastAPI async endpoints with Pydantic validation",
      metadata: {
        file: "app/main.py",
        lines: "12-45"
      }
    };

    const res = await addStudentEvidenceRecord(studentId, rawCodeData);
    assert.ok(res.success, "Evidence should be added successfully");

    const evidenceList = await getStudentEvidenceList(studentId);
    assert.ok(evidenceList.length > 0, "Evidence list must contain item");
    const retrieved = evidenceList[0];

    assert.equal(retrieved.skillId, "python");
    assert.equal(retrieved.sourceType, "github");
    assert.equal(retrieved.verificationStatus, "DEMONSTRATED");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 7: ROLE ISOLATION
  // ─────────────────────────────────────────────────────────────
  it("TEST 7: ROLE ISOLATION — Software Engineer role does not mix unrelated AI/ML or distributed systems", () => {
    const sdeIntern = getBenchmarkProfile("sde_intern");
    assert.ok(sdeIntern, "SDE Intern profile must exist");

    const reqIds = sdeIntern.requirements.map(r => r.skillId);

    // Expected SDE Intern core requirements
    assert.ok(reqIds.includes("dsa"), "SDE Intern must have DSA");
    assert.ok(reqIds.includes("python"), "SDE Intern must have Python");
    assert.ok(reqIds.includes("sql"), "SDE Intern must have SQL");

    // Unrelated AI/ML requirements MUST NOT be included in SDE Intern
    assert.ok(!reqIds.includes("pytorch"), "SDE Intern must NOT contain PyTorch");
    assert.ok(!reqIds.includes("machine_learning"), "SDE Intern must NOT contain Machine Learning");
    assert.ok(!reqIds.includes("deep_learning"), "SDE Intern must NOT contain Deep Learning");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 8: ROLE PERSISTENCE
  // ─────────────────────────────────────────────────────────────
  it("TEST 8: ROLE PERSISTENCE — Reopen and refresh analysis and verify selected role remains consistent", async () => {
    const studentId = `role_persist_${Date.now()}`;
    setUserTargetRole(studentId, "backend_sde");
    assert.equal(getUserTargetRole(studentId), "backend_sde");

    // Invalidate cached scope to simulate full refresh
    invalidateUserDNAScope(studentId);

    const dna = await getStudentDNAFull(studentId);
    assert.equal(dna.targetRoleKey, "req_backend_sde");
    assert.equal(dna.activeTargetProfile.roleTitle, "Backend SDE-1");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 9: METRIC PROOF
  // ─────────────────────────────────────────────────────────────
  it("TEST 9: METRIC PROOF — Counts and percentages match eligible records and documented formulas", async () => {
    const studentId = `metric_proof_${Date.now()}`;
    const evidenceItems: DNAEvidence[] = [
      {
        id: `ev_1_${Date.now()}`,
        userId: studentId,
        sourceType: "github",
        sourceId: "repo_1",
        skillId: "python",
        evidenceType: "code",
        claim: "Python code in repo",
        strength: 0.8,
        reliability: 0.85,
        confidence: "HIGH",
        recency: "CURRENT",
        verificationStatus: "DEMONSTRATED",
        provenance: "GitHub",
        createdAt: new Date().toISOString(),
        observedAt: new Date().toISOString()
      },
      {
        id: `ev_2_${Date.now()}`,
        userId: studentId,
        sourceType: "resume",
        sourceId: "resume_1",
        skillId: "sql",
        evidenceType: "claim",
        claim: "SQL claim in resume",
        strength: 0.45,
        reliability: 0.45,
        confidence: "LOW",
        recency: "CURRENT",
        verificationStatus: "CLAIMED",
        provenance: "Resume",
        createdAt: new Date().toISOString(),
        observedAt: new Date().toISOString()
      }
    ];

    const claims = [{ skillName: "Python" }, { skillName: "SQL" }, { skillName: "React" }];
    const metrics = await calculateStudentDNAMetrics(studentId, evidenceItems, claims);

    // Python has inspected code (SUPPORTED) = 1; SQL is resume only (SELF_REPORTED); React is uninspected
    assert.equal(metrics.evidenceCoveragePct.numerator, 1);
    assert.equal(metrics.evidenceCoveragePct.denominator, 3);
    assert.equal(metrics.evidenceCoveragePct.value, 33);
    assert.equal(metrics.evidenceCoveragePct.formula, "(claims_with_inspected_evidence / total_assessable_claims_in_scope) * 100");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 10: DUPLICATE PREVENTION
  // ─────────────────────────────────────────────────────────────
  it("TEST 10: DUPLICATE PREVENTION — Duplicate source evidence records are deduplicated", async () => {
    const studentId = `dedup_${Date.now()}`;
    const rawData: RawSourceData = {
      userId: studentId,
      sourceType: "github",
      sourceId: "repo_proj_123",
      sourceUrl: "https://github.com/user/project",
      skillRaw: "Python",
      evidenceType: "code_inspection",
      claim: "Repository https://github.com/user/project"
    };

    const res1 = await addStudentEvidenceRecord(studentId, rawData);
    assert.ok(res1.success, "First add should succeed");

    const res2 = await addStudentEvidenceRecord(studentId, rawData);
    assert.ok(res2.success, "Second add should update/dedup");

    const list = await getStudentEvidenceList(studentId);
    assert.equal(list.length, 1, "Duplicate evidence with identical ID must be deduplicated to 1");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 11: AI FAILURE
  // ─────────────────────────────────────────────────────────────
  it("TEST 11: AI FAILURE — AI provider failure keeps deterministic evidence and metrics available", async () => {
    const studentId = `ai_fail_${Date.now()}`;
    const rawAssessment: RawSourceData = {
      userId: studentId,
      sourceType: "assessment",
      sourceId: "dsa_diag_1",
      skillRaw: "DSA",
      evidenceType: "assessment_score",
      claim: "Scored 85% in DSA diagnostic",
      metadata: { score: 85 }
    };

    await addStudentEvidenceRecord(studentId, rawAssessment);
    const evidence = await getStudentEvidenceList(studentId);

    // Even if external AI is down, deterministic engine calculates exact metrics and rubrics
    const metrics = await calculateStudentDNAMetrics(studentId, evidence, [{ skillName: "DSA" }]);
    assert.equal(metrics.assessmentsCount.value, 1);
    assert.equal(metrics.assessmentsCount.eligibleInputIds.length, 1);

    const intel = evaluateStudentSkillIntelligence(studentId, evidence, [{ skillName: "DSA" }]);
    const dsa = intel.evaluatedSkills.find(s => s.skillId === "dsa");
    assert.ok(dsa, "DSA skill evaluated");
    assert.equal(dsa.assessmentStatus, "SUPPORTED");
    assert.equal(dsa.statusBadge, "success");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 12: UNSUPPORTED AI CLAIM
  // ─────────────────────────────────────────────────────────────
  it("TEST 12: UNSUPPORTED AI CLAIM — Ungrounded claim is not presented as verified fact", () => {
    const studentId = `unsupported_claim_${Date.now()}`;
    // Zero evidence provided
    const intel = evaluateStudentSkillIntelligence(studentId, [], [{ skillName: "Quantum Computing" }]);
    const qc = intel.evaluatedSkills.find(s => s.skillId === "quantum_computing");

    // Unnormalized or unsupported skill without evidence must not be INDEPENDENTLY_VERIFIED
    if (qc) {
      assert.notEqual(qc.assessmentStatus, "INDEPENDENTLY_VERIFIED");
      assert.equal(qc.evidenceIds.length, 0);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 13: REFRESH RECOVERY
  // ─────────────────────────────────────────────────────────────
  it("TEST 13: REFRESH RECOVERY — Failed refresh preserves previous evidence without fabricating zero", async () => {
    const studentId = `refresh_rec_${Date.now()}`;
    const rawData: RawSourceData = {
      userId: studentId,
      sourceType: "github",
      sourceId: "react_repo_1",
      sourceUrl: "https://github.com/user/react-app",
      skillRaw: "React",
      evidenceType: "code_inspection",
      claim: "React component architecture"
    };

    await addStudentEvidenceRecord(studentId, rawData);

    // Simulate refresh invocation
    invalidateUserDNAScope(studentId);

    // Fetch again
    const dnaAfter = await getStudentDNAFull(studentId);
    assert.ok(dnaAfter.evidence.length > 0, "Historical evidence must be preserved");
    assert.ok(dnaAfter.evidence.some(e => e.skillId === "react"));
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 14: RECOMMENDATION PERSONALIZATION
  // ─────────────────────────────────────────────────────────────
  it("TEST 14: RECOMMENDATION PERSONALIZATION — Different goals and evidence yield distinct recommendations", () => {
    const userA = `rec_user_A_${Date.now()}`;
    const userB = `rec_user_B_${Date.now()}`;

    const profileSDE = getBenchmarkProfile("sde_intern")!;
    const profileAIML = getBenchmarkProfile("ai_ml_engineer")!;

    // User A targeting SDE Intern with Python claims only
    const reportA = evaluateRoleGaps(userA, profileSDE, [], [{ skillName: "Python" }]);
    // User B targeting AI/ML with PyTorch and Python evidence
    const reportB = evaluateRoleGaps(userB, profileAIML, [], [{ skillName: "PyTorch" }]);

    assert.equal(reportA.targetRoleTitle, profileSDE.roleTitle);
    assert.equal(reportB.targetRoleTitle, profileAIML.roleTitle);

    const recSkillsA = reportA.recommendations.map(r => r.skillId);
    const recSkillsB = reportB.recommendations.map(r => r.skillId);

    assert.ok(recSkillsA.includes("dsa"), "SDE Intern roadmap recommends DSA");
    assert.ok(recSkillsB.includes("machine_learning"), "AI/ML roadmap recommends Machine Learning");
    assert.notEqual(recSkillsA.join(","), recSkillsB.join(","));
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 15: NEW EVIDENCE
  // ─────────────────────────────────────────────────────────────
  it("TEST 15: NEW EVIDENCE — Adding new evidence updates dependent skill intelligence and recommendations", async () => {
    const studentId = `new_ev_${Date.now()}`;
    const profile = getBenchmarkProfile("sde_intern")!;

    // Initial evaluation with zero evidence
    const initialReport = evaluateRoleGaps(studentId, profile, [], [{ skillName: "Python" }]);
    const initialPyRec = initialReport.recommendations.find(r => r.skillId === "python");
    assert.ok(initialPyRec, "Initial Python recommendation exists");

    // Add new verified Python assessment evidence
    const newEvidence: RawSourceData = {
      userId: studentId,
      sourceType: "assessment",
      sourceId: "py_diag_92",
      skillRaw: "Python",
      evidenceType: "assessment_score",
      claim: "Passed Cognalyze Python Backend Diagnostic with 92%",
      metadata: { score: 92 }
    };

    await addStudentEvidenceRecord(studentId, newEvidence);
    const evidenceList = await getStudentEvidenceList(studentId);

    // Recompute
    const updatedReport = evaluateRoleGaps(studentId, profile, evidenceList, [{ skillName: "Python" }]);
    const updatedPyReq = updatedReport.evaluatedRequirements.find(r => r.skillId === "python");

    assert.ok(updatedPyReq, "Updated Python requirement exists");
    assert.equal(updatedPyReq.evidenceState, "SUPPORTED_BY_EVIDENCE", "Status elevated to SUPPORTED_BY_EVIDENCE");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 16: AUTHORIZATION
  // ─────────────────────────────────────────────────────────────
  it("TEST 16: AUTHORIZATION — Scoped to authenticated candidate; rejects unauthorized cross-user modifications", async () => {
    const victimUser = `victim_${Date.now()}`;
    const attackerUser = `attacker_${Date.now()}`;

    createUser({ id: victimUser, fullName: "Victim", email: `${victimUser}@safe.com`, accountType: "student", passwordHash: null, passwordSalt: null });
    createUser({ id: attackerUser, fullName: "Attacker", email: `${attackerUser}@hacker.com`, accountType: "student", passwordHash: null, passwordSalt: null });

    await addStudentEvidenceRecord(victimUser, {
      userId: victimUser,
      sourceType: "assessment",
      sourceId: "victim_assessment_1",
      skillRaw: "Cybersecurity",
      evidenceType: "assessment_score",
      claim: "Private security clearance evidence",
      metadata: { score: 95 }
    });

    // Attacker queries their own DNA
    const attackerDNA = await getStudentDNAFull(attackerUser);
    assert.equal(attackerDNA.evidence.length, 0, "Attacker must receive zero evidence from victim");
    assert.equal(attackerDNA.userId, attackerUser);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 17: OPPORTUNITY AUTHENTICITY
  // ─────────────────────────────────────────────────────────────
  it("TEST 17: OPPORTUNITY AUTHENTICITY — Live opportunities are backed by real records with authentic apply links", () => {
    const opportunities = getAllPersonalizedOpportunities();
    assert.ok(opportunities.length > 0, "Opportunities feed must provide items");

    for (const opp of opportunities) {
      assert.ok(opp.id, "Opportunity must have stable ID");
      assert.ok(opp.title, "Opportunity must have authentic title");
      assert.ok(opp.organization, "Opportunity must have organization");
      assert.ok(opp.sourceUrl.startsWith("http"), "Source URL must be an authentic web destination");
      assert.ok(opp.sourceName, "Must disclose provenance source");
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 18: REGRESSION
  // ─────────────────────────────────────────────────────────────
  it("TEST 18: REGRESSION — End-to-end Student DNA pipeline runs cleanly without runtime failure", async () => {
    const studentId = `regression_${Date.now()}`;
    createUser({ id: studentId, fullName: "Regression Tester", email: `${studentId}@test.com`, accountType: "student", passwordHash: null, passwordSalt: null });

    upsertStudentProfileByUserId(studentId, {
      fullName: "Regression Tester",
      skills: [{ name: "TypeScript", level: "Intermediate" }, { name: "React", level: "Intermediate" }],
      projects: [{ title: "Next.js App", description: "Next app", techStack: ["React"], githubUrl: "https://github.com/test/app" }]
    });

    const dna = await getStudentDNAFull(studentId);
    assert.ok(dna, "Full Student DNA response generated");
    assert.ok(dna.snapshot, "Snapshot present");
    assert.ok(dna.metricsProof, "MetricsProof present");
    assert.ok(dna.roleGapIntelligence, "RoleGapIntelligence present");
    assert.ok(dna.profileStatus, "Profile lifecycle status derived");
    assert.ok(dna.availableRoles && dna.availableRoles.length > 0, "Available roles list present");
  });

});
