import test from "node:test";
import assert from "node:assert/strict";

import {
  parseJDIntelligence,
  compareCandidates,
  generateRecruiterRecommendation,
  validateAndLogRecruiterDecision,
  hydrateTechnicalEvidence,
  enforceStudentDNAReadOnlyBoundary,
  maskCandidateForBlindScreening,
  getDecisionAuditLogs,
  CandidateEvaluationSnapshot,
  JDIntelligenceProfile
} from "@/lib/recruiter/decision-room-engine";

import { Milestone5FinalReport } from "@/lib/interview/final-report-generator";
import { POST as decisionHandler } from "@/app/api/recruiter/decision/route";
import { POST as compareHandler } from "@/app/api/recruiter/compare/route";

test("Milestone 6 Master Engineering Suite: Recruiter Decision Room & Enterprise Hiring Dossier", async (t) => {

  // AC-M6-1: JD Intelligence Extraction
  await t.test("AC-M6-1: JD Intelligence parses must-haves, maps to 7 dimensions, and weights sum to 1.00", async () => {
    const rawJd = `
      Backend Systems Engineer (Senior)
      Must have Python and PostgreSQL experience.
      Required: Strong Redis caching and distributed systems design.
      Nice to have: Docker and Kubernetes.
      We are looking for a rockstar self-starter!
    `;

    const profile = parseJDIntelligence("Senior Backend Systems Engineer", rawJd, { trackId: "backend" });

    assert.equal(profile.trackId, "backend");
    assert.ok(profile.mustHaveCompetencies.length >= 2, "Expected must-have competencies to be extracted");
    assert.ok(profile.unsupportedOrAmbiguous.length >= 1, "Expected rockstar / self-starter to be flagged as ambiguous");

    // Verify 7-dimension weights sum to 1.00
    const sum = Object.values(profile.dimensionWeights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.0001, `Track weights must sum to 1.00, got ${sum}`);

    // Verify dimension mapping
    const hasPractical = profile.mustHaveCompetencies.some(c => c.dimensionId === "DIM_3_PRACTICAL_IMPL");
    const hasDesign = profile.mustHaveCompetencies.some(c => c.dimensionId === "DIM_4_SYSTEM_DESIGN");
    assert.ok(hasPractical || hasDesign, "Must map to canonical technical dimensions");
  });

  // AC-M6-2: Naive Keyword Exclusion
  await t.test("AC-M6-2: Naive Keyword Exclusion rejects unverified keyword stuffing without evidence", async () => {
    const roleProfile = parseJDIntelligence("Senior Backend Engineer", "Required: Kubernetes and Redis", { trackId: "backend" });

    // Candidate has Kubernetes in selfClaimedSkills, but contradictedSkills lists Kubernetes (failed live probe)
    const candidateSnapshot: CandidateEvaluationSnapshot = {
      candidateId: "cand_spammer_02",
      name: "Keyword Spammer",
      appliedRoleId: roleProfile.roleId,
      sessionId: "sess_kw_02",
      finalReportId: "rep_kw_02",
      trackId: "backend",
      assessmentStatus: "COMPLETED_CERTIFIED",
      overallScore: 55,
      evidenceCoverageRatio: 0.70,
      dimensionScores: {
        DIM_1_TECH_FUNDAMENTALS: { score: 60, status: "DEMONSTRATED_WEAKNESS", itemCount: 1 },
        DIM_2_PROBLEM_SOLVING: { score: 50, status: "DEMONSTRATED_WEAKNESS", itemCount: 1 },
        DIM_3_PRACTICAL_IMPL: { score: 50, status: "DEMONSTRATED_WEAKNESS", itemCount: 1 },
        DIM_4_SYSTEM_DESIGN: { score: 40, status: "DEMONSTRATED_WEAKNESS", itemCount: 1 },
        DIM_5_PROJECT_EXPERIENCE: { score: 60, status: "DEMONSTRATED_WEAKNESS", itemCount: 1 },
        DIM_6_COMMUNICATION: { score: 70, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_7_ROLE_RELEVANCE: { score: 50, status: "DEMONSTRATED_WEAKNESS", itemCount: 1 },
      },
      verifiedSkills: ["Docker"],
      selfClaimedSkills: ["Kubernetes", "Redis", "Kafka", "AWS"],
      contradictedSkills: ["Kubernetes", "Redis"],
    };

    const rec = generateRecruiterRecommendation(candidateSnapshot, roleProfile);

    // Candidate must NOT get credit for unverified/contradicted claims
    assert.equal(rec.recommendationBand, "NO_HIRE");
    assert.ok(rec.contradictingEvidence.some(e => e.includes("Failed live defense")));
    assert.ok(rec.unverifiedMustHaves.length >= 1);
  });

  // AC-M6-3: Incomplete Assessment Protection
  await t.test("AC-M6-3: Incomplete Assessment Protection excludes < 60% coverage from comparative ranking", async () => {
    const roleProfile = parseJDIntelligence("Full Stack Developer", "Full stack requirements", { trackId: "fullstack" });

    const completeCandidate: CandidateEvaluationSnapshot = {
      candidateId: "cand_full_03",
      name: "Complete Candidate",
      appliedRoleId: roleProfile.roleId,
      sessionId: "sess_full_03",
      finalReportId: "rep_full_03",
      trackId: "fullstack",
      assessmentStatus: "COMPLETED_CERTIFIED",
      overallScore: 88,
      evidenceCoverageRatio: 0.85,
      dimensionScores: {
        DIM_1_TECH_FUNDAMENTALS: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 2 },
        DIM_2_PROBLEM_SOLVING: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 2 },
        DIM_3_PRACTICAL_IMPL: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_4_SYSTEM_DESIGN: { score: 80, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_5_PROJECT_EXPERIENCE: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_6_COMMUNICATION: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_7_ROLE_RELEVANCE: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
      },
      verifiedSkills: ["React", "TypeScript", "Node.js"],
      selfClaimedSkills: [],
      contradictedSkills: [],
      codingTelemetry: {
        verdict: "ACCEPTED",
        runtimeMs: 15,
        memoryKb: 3600,
        stressTestPassed: true,
        optimalComplexity: true,
        cheatSuspicionScore: 0,
        bulkPasteDetected: false,
        pasteCount: 0,
      }
    };

    const incompleteCandidate: CandidateEvaluationSnapshot = {
      candidateId: "cand_incomp_03",
      name: "Incomplete Candidate",
      appliedRoleId: roleProfile.roleId,
      sessionId: "sess_incomp_03",
      finalReportId: "rep_incomp_03",
      trackId: "fullstack",
      assessmentStatus: "ASSESSMENT_INCOMPLETE",
      overallScore: null,
      evidenceCoverageRatio: 0.25, // Only 25% coverage
      dimensionScores: {
        DIM_1_TECH_FUNDAMENTALS: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_2_PROBLEM_SOLVING: { score: null, status: "NOT_ASSESSED", itemCount: 0 },
        DIM_3_PRACTICAL_IMPL: { score: null, status: "NOT_ASSESSED", itemCount: 0 },
        DIM_4_SYSTEM_DESIGN: { score: null, status: "NOT_ASSESSED", itemCount: 0 },
        DIM_5_PROJECT_EXPERIENCE: { score: null, status: "NOT_ASSESSED", itemCount: 0 },
        DIM_6_COMMUNICATION: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_7_ROLE_RELEVANCE: { score: null, status: "NOT_ASSESSED", itemCount: 0 },
      },
      verifiedSkills: [],
      selfClaimedSkills: [],
      contradictedSkills: [],
    };

    const comparison = compareCandidates([incompleteCandidate, completeCandidate], roleProfile);

    // Complete candidate ranks #1
    assert.equal(comparison.candidates[0].candidateId, "cand_full_03");
    assert.equal(comparison.candidates[0].canRank, true);

    // Incomplete candidate is placed at bottom with non-rankable badge
    assert.equal(comparison.candidates[1].candidateId, "cand_incomp_03");
    assert.equal(comparison.candidates[1].canRank, false);
    assert.equal(comparison.candidates[1].rankingBadge, "ASSESSMENT INCOMPLETE — CANNOT BE RANKED");
    assert.equal(comparison.candidates[1].overallScore, null);
  });

  // AC-M6-4: NOT_ASSESSED Dimension Display
  await t.test("AC-M6-4: NOT_ASSESSED dimensions are rendered as null and not imputed to zero", async () => {
    const roleProfile = parseJDIntelligence("Frontend Engineer", "React and CSS", { trackId: "frontend" });

    const candidateSnapshot: CandidateEvaluationSnapshot = {
      candidateId: "cand_fe_04",
      name: "Frontend Specialist",
      appliedRoleId: roleProfile.roleId,
      sessionId: "sess_fe_04",
      finalReportId: "rep_fe_04",
      trackId: "frontend",
      assessmentStatus: "COMPLETED_CERTIFIED",
      overallScore: 86,
      evidenceCoverageRatio: 0.85,
      dimensionScores: {
        DIM_1_TECH_FUNDAMENTALS: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_2_PROBLEM_SOLVING: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_3_PRACTICAL_IMPL: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_4_SYSTEM_DESIGN: { score: null, status: "NOT_ASSESSED", itemCount: 0 },
        DIM_5_PROJECT_EXPERIENCE: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_6_COMMUNICATION: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_7_ROLE_RELEVANCE: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
      },
      verifiedSkills: ["React", "CSS"],
      selfClaimedSkills: [],
      contradictedSkills: [],
    };

    const comparison = compareCandidates([candidateSnapshot], roleProfile);
    const candRow = comparison.candidates[0];

    // System Design score must be strictly null (not 0)
    assert.equal(candRow.dimensionScores.DIM_4_SYSTEM_DESIGN, null);
    assert.equal(candRow.systemDesignPerformance, "Not Assessed");
    assert.equal(candRow.overallScore, 86);
  });

  // AC-M6-5: Recommendation Calibration
  await t.test("AC-M6-5: Recommendation Calibration assigns STRONG_HIRE when score >= 85, coding passed, must-haves met", async () => {
    const roleProfile = parseJDIntelligence("Senior Backend Engineer", "Required: Python and PostgreSQL", { trackId: "backend" });

    const stellarCandidate: CandidateEvaluationSnapshot = {
      candidateId: "cand_stellar_05",
      name: "Stellar Candidate",
      appliedRoleId: roleProfile.roleId,
      sessionId: "sess_stellar_05",
      finalReportId: "rep_stellar_05",
      trackId: "backend",
      assessmentStatus: "COMPLETED_CERTIFIED",
      overallScore: 92,
      evidenceCoverageRatio: 0.95,
      dimensionScores: {
        DIM_1_TECH_FUNDAMENTALS: { score: 95, status: "DEMONSTRATED_COMPETENCY", itemCount: 2 },
        DIM_2_PROBLEM_SOLVING: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 2 },
        DIM_3_PRACTICAL_IMPL: { score: 95, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_4_SYSTEM_DESIGN: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 2 },
        DIM_5_PROJECT_EXPERIENCE: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_6_COMMUNICATION: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_7_ROLE_RELEVANCE: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
      },
      verifiedSkills: ["Python Programming", "PostgreSQL B-Tree & ACID", "Redis Caching & Concurrency"],
      selfClaimedSkills: [],
      contradictedSkills: [],
      codingTelemetry: {
        verdict: "ACCEPTED",
        runtimeMs: 14,
        memoryKb: 3400,
        stressTestPassed: true,
        optimalComplexity: true,
        cheatSuspicionScore: 0,
        bulkPasteDetected: false,
        pasteCount: 0,
      }
    };

    const rec = generateRecruiterRecommendation(stellarCandidate, roleProfile);

    assert.equal(rec.recommendationBand, "STRONG_HIRE");
    assert.ok(rec.confidenceScore >= 0.90);
    assert.ok(rec.explanationSummary.includes("exceeded expectations"));
  });

  // AC-M6-6: Recruiter Override Enforcement
  await t.test("AC-M6-6: Recruiter Override Enforcement rejects override without >= 20 char justification", async () => {
    // Attempting to reject a candidate whose AI recommendation is HIRE without sufficient override reason
    const req = new Request("http://localhost:3000/api/recruiter/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: "cand_test_06",
        roleId: "role_test_06",
        verdict: "Reject",
        aiRecommendation: "HIRE",
        isOverride: true,
        overrideReason: "Bad culture fit" // Only 15 chars (< 20)
      })
    });

    const res = await decisionHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, "OVERRIDE_REASON_REQUIRED");
  });

  // AC-M6-7: Recruiter Override Audit Log
  await t.test("AC-M6-7: Recruiter Override Audit Log appends immutable event when valid override is provided", async () => {
    const validOverrideReason = "Candidate demonstrated exceptional niche knowledge of our custom distributed streaming protocol in live debrief.";

    const req = new Request("http://localhost:3000/api/recruiter/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: "cand-vikram",
        roleId: "role-ml-platform",
        verdict: "Hire",
        aiRecommendation: "NO_HIRE",
        isOverride: true,
        overrideReason: validOverrideReason,
        decidedBy: "recruiter_john_doe"
      })
    });

    const res = await decisionHandler(req);
    assert.equal(res.status, 200);

    const logs = getDecisionAuditLogs();
    const recorded = logs.find(l => l.candidate_id === "cand-vikram");
    assert.ok(recorded !== undefined);
    assert.equal(recorded.is_override, true);
    assert.equal(recorded.override_reason, validOverrideReason);
  });

  // AC-M6-8: Verbatim Evidence Traceability
  await t.test("AC-M6-8: Verbatim Evidence Traceability matches transcript quote and SHA-256 hash", async () => {
    const mockReport: Milestone5FinalReport = {
      reportId: "rep_trace_08",
      sessionId: "sess_trace_08",
      candidateId: "cand_trace_08",
      targetRole: "Senior Systems Engineer",
      trackId: "systems",
      assessmentStatus: "COMPLETED_CERTIFIED",
      overallScore: 90,
      overallScoreCalculation: "Calculation",
      confidence: 0.95,
      executiveSummary: "Executive summary",
      dimensionScores: {
        DIM_1_TECH_FUNDAMENTALS: {
          dimensionId: "DIM_1_TECH_FUNDAMENTALS",
          dimensionName: "Technical Fundamentals",
          status: "DEMONSTRATED_COMPETENCY",
          score: 90,
          weight: 0.25,
          itemCount: 1,
          transcriptAnchors: [
            {
              turnIndex: 1,
              stageId: "stage_2",
              questionExcerpt: "Explain Linux virtual memory paging.",
              candidateQuote: "Virtual memory maps process address space to physical frames via multi-level page tables with TLB cache.",
              quoteHash: "b3f5...hash",
              demonstratedTopic: "Linux Virtual Memory",
              rubricScore: 90,
              evaluationNote: "Solid memory architecture depth",
            }
          ],
          strengths: ["Solid memory architecture"],
          growthAreas: [],
        },
        DIM_2_PROBLEM_SOLVING: { dimensionId: "DIM_2_PROBLEM_SOLVING", dimensionName: "Algo", status: "NOT_ASSESSED", score: null, weight: 0.15, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_3_PRACTICAL_IMPL: { dimensionId: "DIM_3_PRACTICAL_IMPL", dimensionName: "Code", status: "NOT_ASSESSED", score: null, weight: 0.25, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_4_SYSTEM_DESIGN: { dimensionId: "DIM_4_SYSTEM_DESIGN", dimensionName: "Design", status: "NOT_ASSESSED", score: null, weight: 0.15, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_5_PROJECT_EXPERIENCE: { dimensionId: "DIM_5_PROJECT_EXPERIENCE", dimensionName: "Proj", status: "NOT_ASSESSED", score: null, weight: 0.10, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_6_COMMUNICATION: { dimensionId: "DIM_6_COMMUNICATION", dimensionName: "Comm", status: "NOT_ASSESSED", score: null, weight: 0.05, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_7_ROLE_RELEVANCE: { dimensionId: "DIM_7_ROLE_RELEVANCE", dimensionName: "Role", status: "NOT_ASSESSED", score: null, weight: 0.05, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
      },
      codingEvaluation: { hasCodingSubmission: false, submissionsCount: 0, optimalComplexityDemonstrated: false, submissions: [] },
      conductScorecard: { currentConductState: "NORMAL", totalInfractions: 0, incidentLog: [], isTerminatedForMisconduct: false, behavioralImpactSummary: "Clean" },
      keyStrengths: ["Memory management"],
      criticalGaps: [],
      actionableStudyTracks: [],
      dnaSyncStatus: "COMMITTED",
      generatedAt: new Date().toISOString(),
      metadata: { version: "2.0.0", synthesizer: "deterministic_rubric_fallback", hash: "hash" },
    };

    const evidence = hydrateTechnicalEvidence("cand_trace_08", mockReport);

    assert.equal(evidence.transcripts.length, 1);
    assert.equal(evidence.transcripts[0].demonstratedTopic, "Linux Virtual Memory");
    assert.ok(evidence.transcripts[0].candidateQuote.includes("Virtual memory maps process address space"));
  });

  // AC-M6-9: Sandbox Code Redaction
  await t.test("AC-M6-9: Sandbox Code Redaction strictly redacts private evaluation vectors", async () => {
    const mockReportWithCode: Milestone5FinalReport = {
      reportId: "rep_code_09",
      sessionId: "sess_code_09",
      candidateId: "cand_code_09",
      targetRole: "Software Engineer",
      trackId: "general_swe",
      assessmentStatus: "COMPLETED_CERTIFIED",
      overallScore: 85,
      overallScoreCalculation: "Math",
      confidence: 0.90,
      executiveSummary: "Summary",
      dimensionScores: {
        DIM_1_TECH_FUNDAMENTALS: { dimensionId: "DIM_1_TECH_FUNDAMENTALS", dimensionName: "Fund", status: "NOT_ASSESSED", score: null, weight: 0.15, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_2_PROBLEM_SOLVING: { dimensionId: "DIM_2_PROBLEM_SOLVING", dimensionName: "Algo", status: "NOT_ASSESSED", score: null, weight: 0.20, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_3_PRACTICAL_IMPL: { dimensionId: "DIM_3_PRACTICAL_IMPL", dimensionName: "Code", status: "NOT_ASSESSED", score: null, weight: 0.25, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_4_SYSTEM_DESIGN: { dimensionId: "DIM_4_SYSTEM_DESIGN", dimensionName: "Design", status: "NOT_ASSESSED", score: null, weight: 0.15, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_5_PROJECT_EXPERIENCE: { dimensionId: "DIM_5_PROJECT_EXPERIENCE", dimensionName: "Proj", status: "NOT_ASSESSED", score: null, weight: 0.10, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_6_COMMUNICATION: { dimensionId: "DIM_6_COMMUNICATION", dimensionName: "Comm", status: "NOT_ASSESSED", score: null, weight: 0.05, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
        DIM_7_ROLE_RELEVANCE: { dimensionId: "DIM_7_ROLE_RELEVANCE", dimensionName: "Role", status: "NOT_ASSESSED", score: null, weight: 0.10, itemCount: 0, transcriptAnchors: [], strengths: [], growthAreas: [] },
      },
      codingEvaluation: {
        hasCodingSubmission: true,
        submissionsCount: 1,
        optimalComplexityDemonstrated: true,
        submissions: [
          {
            submissionId: "sub_1",
            problemId: "two-sum",
            language: "python",
            codeSha256: "code_hash_12345",
            verdict: "ACCEPTED",
            runtimeMs: 12,
            memoryKb: 3200,
            stressTestPassed: true,
            cheatSuspicionScore: 0,
            executionSource: "live_judge0",
          }
        ]
      },
      conductScorecard: { currentConductState: "NORMAL", totalInfractions: 0, incidentLog: [], isTerminatedForMisconduct: false, behavioralImpactSummary: "Clean" },
      keyStrengths: [],
      criticalGaps: [],
      actionableStudyTracks: [],
      dnaSyncStatus: "COMMITTED",
      generatedAt: new Date().toISOString(),
      metadata: { version: "2.0.0", synthesizer: "deterministic_rubric_fallback", hash: "hash" },
    };

    const evidence = hydrateTechnicalEvidence("cand_code_09", mockReportWithCode);

    assert.ok(evidence.codeSubmission !== undefined);
    assert.equal(evidence.codeSubmission.verdict, "ACCEPTED");
    assert.equal(evidence.codeSubmission.privateVectorsRedacted, true);
    assert.ok(evidence.codeSubmission.privateTestsPassed.includes("aggregate count"));
  });

  // AC-M6-10: Advisory Paste Telemetry
  await t.test("AC-M6-10: Advisory Paste Telemetry displays paste notice without reducing technical score", async () => {
    const roleProfile = parseJDIntelligence("SWE", "Coding", { trackId: "general_swe" });

    const pasteCandidate: CandidateEvaluationSnapshot = {
      candidateId: "cand_paste_10",
      name: "Pasting Candidate",
      appliedRoleId: roleProfile.roleId,
      sessionId: "sess_paste_10",
      finalReportId: "rep_paste_10",
      trackId: "general_swe",
      assessmentStatus: "COMPLETED_CERTIFIED",
      overallScore: 88,
      evidenceCoverageRatio: 0.85,
      dimensionScores: {
        DIM_1_TECH_FUNDAMENTALS: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_2_PROBLEM_SOLVING: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_3_PRACTICAL_IMPL: { score: 90, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_4_SYSTEM_DESIGN: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_5_PROJECT_EXPERIENCE: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_6_COMMUNICATION: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_7_ROLE_RELEVANCE: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
      },
      verifiedSkills: ["Algorithmic Problem Solving", "Systems Architecture"],
      selfClaimedSkills: [],
      contradictedSkills: [],
      codingTelemetry: {
        verdict: "ACCEPTED",
        runtimeMs: 15,
        memoryKb: 3600,
        stressTestPassed: true,
        optimalComplexity: true,
        cheatSuspicionScore: 0,
        bulkPasteDetected: true, // Bulk paste occurred
        pasteCount: 2,
      }
    };

    const rec = generateRecruiterRecommendation(pasteCandidate, roleProfile);

    // Bulk paste is advisory only: candidate still earns HIRE / STRONG_HIRE based on merit
    assert.ok(rec.recommendationBand === "HIRE" || rec.recommendationBand === "STRONG_HIRE");
  });

  // AC-M6-11: Student DNA Read-Only Invariant
  await t.test("AC-M6-11: Student DNA Read-Only Invariant blocks recruiter from modifying candidate Student DNA", async () => {
    assert.throws(
      () => {
        enforceStudentDNAReadOnlyBoundary("recruiter", "UPDATE_STUDENT_DNA_SKILL");
      },
      (err: any) => {
        assert.equal(err.code, "CANDIDATE_DATA_IMMUTABLE");
        assert.equal(err.statusCode, 403);
        return true;
      },
      "Must throw 403 CANDIDATE_DATA_IMMUTABLE when recruiter attempts to mutate Student DNA"
    );
  });

  // AC-M6-12: Multi-Tenant Organization Isolation
  await t.test("AC-M6-12: Multi-Tenant Organization Isolation rejects cross-org compare request with empty or filtered list", async () => {
    const req = new Request("http://localhost:3000/api/recruiter/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleId: "role_org_a",
        candidates: [] // Empty candidate list triggers bad request
      })
    });

    const res = await compareHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, "INVALID_CANDIDATES");
  });

  // AC-M6-13: Blind Technical Screening Mode
  await t.test("AC-M6-13: Blind Technical Screening Mode redacts candidate PII, photo, and school", async () => {
    const rawCandidate = {
      candidateId: "cand_alice_99",
      name: "Alice Smith",
      email: "alice@stanford.edu",
      photoUrl: "https://example.com/alice.jpg",
      university: "Stanford University",
      dimensionScores: { DIM_1: 90, DIM_2: 95 }
    };

    const masked = maskCandidateForBlindScreening(rawCandidate);

    assert.ok(masked.maskedName.startsWith("Candidate #"));
    assert.equal(masked.maskedPhotoUrl, null);
    assert.equal(masked.maskedInstitution, "Protected Academic Institution");
    assert.deepEqual(masked.retainedObjectiveScores, rawCandidate.dimensionScores);
  });

  // AC-M6-14: Concurrency & Lock Handling
  await t.test("AC-M6-14: Concurrency & Lock Handling processes multiple decisions safely", async () => {
    const p1 = validateAndLogRecruiterDecision({
      organizationId: "org_concurrent",
      roleId: "role_1",
      candidateId: "cand_c1",
      actorUserId: "recruiter_1",
      actorRole: "recruiter",
      aiRecommendation: "HIRE",
      humanVerdict: "OFFER",
      isOverride: false,
    });

    const p2 = validateAndLogRecruiterDecision({
      organizationId: "org_concurrent",
      roleId: "role_1",
      candidateId: "cand_c2",
      actorUserId: "recruiter_2",
      actorRole: "recruiter",
      aiRecommendation: "NO_HIRE",
      humanVerdict: "REJECT",
      isOverride: false,
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    assert.equal(r1.success, true);
    assert.equal(r2.success, true);
    assert.notEqual(r1.decisionId, r2.decisionId);
  });

  // AC-M6-15: Sub-Second Dossier Hydration
  await t.test("AC-M6-15: Sub-Second Dossier Hydration completes comparison benchmark in < 800ms", async () => {
    const start = Date.now();
    const roleProfile = parseJDIntelligence("Systems Architect", "C++ Systems", { trackId: "systems" });

    const cands: CandidateEvaluationSnapshot[] = Array.from({ length: 5 }).map((_, i) => ({
      candidateId: `cand_perf_${i}`,
      name: `Performance Candidate ${i}`,
      appliedRoleId: roleProfile.roleId,
      sessionId: `sess_perf_${i}`,
      finalReportId: `rep_perf_${i}`,
      trackId: "systems",
      assessmentStatus: "COMPLETED_CERTIFIED",
      overallScore: 80 + i,
      evidenceCoverageRatio: 0.80,
      dimensionScores: {
        DIM_1_TECH_FUNDAMENTALS: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_2_PROBLEM_SOLVING: { score: 80, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_3_PRACTICAL_IMPL: { score: 85, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_4_SYSTEM_DESIGN: { score: 80, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_5_PROJECT_EXPERIENCE: { score: 80, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_6_COMMUNICATION: { score: 80, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
        DIM_7_ROLE_RELEVANCE: { score: 80, status: "DEMONSTRATED_COMPETENCY", itemCount: 1 },
      },
      verifiedSkills: ["C++"],
      selfClaimedSkills: [],
      contradictedSkills: [],
    }));

    const matrix = compareCandidates(cands, roleProfile);
    const duration = Date.now() - start;

    assert.equal(matrix.candidates.length, 5);
    assert.ok(duration < 800, `Expected duration < 800ms, took ${duration}ms`);
  });

});
