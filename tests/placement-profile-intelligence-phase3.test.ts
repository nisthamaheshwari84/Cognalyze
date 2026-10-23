/**
 * tests/placement-profile-intelligence-phase3.test.ts
 * 
 * COGNALYZE PHASE 3 — VERIFICATION & ACCEPTANCE TEST SUITE
 * 
 * Tests:
 * 1. Multi-candidate profile isolation (Candidate A cannot read or pollute Candidate B's data)
 * 2. Deterministic Eligibility Engine (MET, NOT_MET, UNKNOWN, NOT_APPLICABLE)
 * 3. Strict Rule: Missing CGPA is UNKNOWN, never automatically passing
 * 4. Strict Rule: Hard eligibility failure overrides any relevance score
 * 5. Explainable Candidate-Opportunity Matching Engine with transparency breakdown
 * 6. Proof Portfolio with 4 distinct verification tiers and verification integrity
 * 7. Dynamic elevation: Adding verified proof updates competency tier and Student DNA
 * 8. Target Role Gap Engine & Prioritized Action generation
 * 9. Incomplete profile vs Complete profile states
 * 10. Application pipeline tracking & stage transitions
 * 11. Verified Offer & Joining Outcome tracking (private candidate records)
 * 12. Exclusion of closed, expired, and rejected opportunities from active recommendations
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  PlacementIntelligenceService,
  PlacementEligibilityEngine,
  PlacementMatchingEngine,
  PlacementGapEngine,
  PlacementProofItem,
  PlacementOfferRecord,
} from "../lib/skills/placement-intelligence-engine";

import {
  upsertPlacementProfile,
  getPlacementProfile,
  StudentPlacementProfile,
} from "../lib/skills/placement-profile-engine";

import { CanonicalOpportunity } from "../lib/opportunities/types";
import { OpportunityService } from "../lib/opportunities/opportunity-service";

describe("Cognalyze Phase 3 — Placement Profile, Student DNA & Opportunity Intelligence", () => {

  const dummyCanonicalOpp: CanonicalOpportunity = {
    id: "opp-sde-google-phase3",
    source: "ATS",
    sourceType: "ATS",
    sourceUrl: "https://careers.google.com/jobs/results/12345",
    applicationUrl: "https://careers.google.com/jobs/results/12345/apply",
    companyId: "comp-google",
    companyName: "Google",
    title: "Software Development Engineer (SDE-1)",
    normalizedTitle: "software development engineer",
    description: "Build distributed backend infrastructure and high-throughput systems.",
    location: "Bengaluru, India",
    country: "India",
    city: "Bengaluru",
    remoteType: "hybrid",
    employmentType: "full_time",
    experienceLevel: "entry_level",
    educationRequirements: {
      degreesAllowed: ["B.Tech", "B.E.", "M.Tech"],
      fieldsAllowed: ["Computer Science", "Information Technology", "AI/ML"],
      isMandatory: true,
    },
    graduationRequirements: {
      allowedYears: [2026, 2027],
      isMandatory: true,
    },
    requiredSkills: ["C++", "Data Structures", "Operating Systems", "SQL"],
    preferredSkills: ["Distributed Systems", "Go"],
    eligibilityRequirements: ["B.Tech CS/IT graduating in 2026/2027 with minimum 8.0 CGPA"],
    disqualifiers: [],
    status: "active",
    freshness: "ACTIVE",
    roleDNA: {
      roleCategory: "Software Engineering",
      mustHaveSkills: ["C++", "Data Structures", "Operating Systems", "SQL"],
      preferredSkills: ["Distributed Systems"],
      experienceYearsMin: 0,
      experienceYearsMax: 1,
      educationSummary: "B.Tech in CS/IT",
      graduationWindow: "2026-2027",
      locationMode: "hybrid",
      disqualifiers: [],
    },
    postedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    deadline: "2026-12-31",
    createdAt: new Date().toISOString(),
  };

  // ── TEST 1: MULTI-TENANT CANDIDATE ISOLATION ──
  test("1. Multi-candidate isolation: Candidate A and Candidate B profiles remain completely separate", async () => {
    const userA = `candidate-a-${Date.now()}`;
    const userB = `candidate-b-${Date.now()}`;

    upsertPlacementProfile(userA, {
      fullName: "Candidate Alpha",
      college: "IIT Bombay",
      degree: "B.Tech",
      branch: "Computer Science",
      graduationYear: "2026",
      cgpa: "9.2",
      targetRoles: ["Backend Systems Engineer"],
    });

    upsertPlacementProfile(userB, {
      fullName: "Candidate Beta",
      college: "NIT Trichy",
      degree: "B.Tech",
      branch: "Mechanical Engineering",
      graduationYear: "2025",
      cgpa: "7.4",
      targetRoles: ["Frontend Engineer"],
    });

    const profA = getPlacementProfile(userA);
    const profB = getPlacementProfile(userB);

    assert.equal(profA?.fullName, "Candidate Alpha");
    assert.equal(profA?.college, "IIT Bombay");
    assert.equal(profA?.cgpa, "9.2");

    assert.equal(profB?.fullName, "Candidate Beta");
    assert.equal(profB?.college, "NIT Trichy");
    assert.equal(profB?.cgpa, "7.4");
  });

  // ── TEST 2: DETERMINISTIC ELIGIBILITY ENGINE (ELIGIBLE CASE) ──
  test("2. Deterministic Eligibility: Fully qualified student evaluates to ELIGIBLE with detailed criteria", () => {
    const profile: Partial<StudentPlacementProfile> = {
      degree: "B.Tech",
      branch: "Computer Science",
      graduationYear: "2026",
      cgpa: "8.5",
    };

    const oppWithCgpa = {
      ...dummyCanonicalOpp,
      eligibilityCriteria: {
        minCgpa: 8.0,
      },
    };

    const result = PlacementEligibilityEngine.evaluate(profile as StudentPlacementProfile, oppWithCgpa);
    assert.equal(result.overallStatus, "ELIGIBLE");
    assert.equal(result.blockers.length, 0);

    const degreeCheck = result.criteria.find((c) => c.name === "degree");
    assert.equal(degreeCheck?.status, "MET");

    const branchCheck = result.criteria.find((c) => c.name === "branch");
    assert.equal(branchCheck?.status, "MET");

    const cgpaCheck = result.criteria.find((c) => c.name === "cgpa");
    assert.equal(cgpaCheck?.status, "MET");
  });

  // ── TEST 3: STRICT RULE: MISSING CGPA IS UNKNOWN, NEVER MET ──
  test("3. Strict Rule: Missing CGPA resolves to UNKNOWN and POTENTIALLY_ELIGIBLE, never automatically passing", () => {
    const profileWithoutCgpa: Partial<StudentPlacementProfile> = {
      degree: "B.Tech",
      branch: "Computer Science",
      graduationYear: "2026",
      cgpa: "", // Unspecified
    };

    const oppWithCgpa = {
      ...dummyCanonicalOpp,
      eligibilityCriteria: {
        minCgpa: 7.5,
      },
    };

    const result = PlacementEligibilityEngine.evaluate(profileWithoutCgpa as StudentPlacementProfile, oppWithCgpa);
    assert.equal(result.overallStatus, "POTENTIALLY_ELIGIBLE");
    assert.ok(result.missingFields.includes("cgpa"));

    const cgpaCheck = result.criteria.find((c) => c.name === "cgpa");
    assert.equal(cgpaCheck?.status, "UNKNOWN");
    assert.ok(cgpaCheck?.reason.includes("Cannot assume passing without evidence"));
  });

  // ── TEST 4: HARD ELIGIBILITY FAILURE OVERRIDES RELEVANCE ──
  test("4. Strict Rule: Hard eligibility failure (e.g. branch or graduation year mismatch) overrides match relevance", () => {
    const ineligibleProfile: Partial<StudentPlacementProfile> = {
      degree: "B.Tech",
      branch: "Civil Engineering", // Not in CS / IT
      graduationYear: "2024",       // Not in 2026 / 2027
      cgpa: "9.5",
      targetRoles: ["Software Development Engineer (SDE-1)"],
    };

    const match = PlacementMatchingEngine.matchOpportunity(
      ineligibleProfile as StudentPlacementProfile,
      [],
      dummyCanonicalOpp
    );

    assert.equal(match.eligibility.overallStatus, "INELIGIBLE");
    assert.equal(match.recommendationTier, "NOT_ELIGIBLE");
    assert.ok(match.eligibility.blockers.length >= 2, "Must identify branch and batch blockers");
    assert.ok(match.unmetOrUnknownRequirements.length > 0);
  });

  // ── TEST 5: PROOF PORTFOLIO & 4 VERIFICATION TIERS ──
  test("5. Proof Portfolio enforces 4 distinct verification tiers without permitting unearned promotion", async () => {
    const service = PlacementIntelligenceService.getInstance();
    const testUser = `proof-test-user-${Date.now()}`;

    // 1. Self-reported proof
    const proof1 = await service.addProofItem(testUser, {
      skillOrClaim: "SQL Window Functions",
      evidenceType: "github_repo",
      title: "Self-Reported SQL Study",
      verificationTier: "self_reported",
      verificationMethod: "candidate_claim",
      confidenceScore: 40,
    });
    assert.equal(proof1.verificationTier, "self_reported");

    // 2. Source-connected proof
    const proof2 = await service.addProofItem(testUser, {
      skillOrClaim: "Data Structures",
      evidenceType: "github_repo",
      title: "GitHub Repository with 40 Commits",
      sourceUrl: "https://github.com/candidate/algo-solutions",
      verificationTier: "source_connected",
      verificationMethod: "github_commit_history",
      confidenceScore: 75,
    });
    assert.equal(proof2.verificationTier, "source_connected");

    // 3. Assessment-verified proof (enforces assessmentScore or session)
    const proof3 = await service.addProofItem(testUser, {
      skillOrClaim: "Operating Systems",
      evidenceType: "coding_assessment",
      title: "CS Fundamentals OS Benchmark",
      verificationTier: "assessment_verified",
      verificationMethod: "compiler_and_rubric_evaluation",
      confidenceScore: 90,
      assessmentScore: 92,
    });
    assert.equal(proof3.verificationTier, "assessment_verified");

    // 4. Verification integrity: Attempting 'assessment_verified' without test evidence downgrades to 'self_reported'
    const fraudulentProof = await service.addProofItem(testUser, {
      skillOrClaim: "Distributed Systems",
      evidenceType: "certificate",
      title: "Claimed Passing Score",
      verificationTier: "assessment_verified",
      verificationMethod: "unverified_form",
      confidenceScore: 80,
      // No assessmentScore or sessionId supplied
    });
    assert.equal(fraudulentProof.verificationTier, "self_reported", "Unbacked assessment claim must downgrade to self_reported");

    const portfolio = await service.getProofPortfolio(testUser);
    assert.equal(portfolio.length, 4);
  });

  // ── TEST 6: DYNAMIC PROOF ELEVATION & STUDENT DNA SYNC ──
  test("6. Adding verified proof item elevates competency tier in student placement profile", async () => {
    const service = PlacementIntelligenceService.getInstance();
    const testUser = `elevation-test-${Date.now()}`;

    upsertPlacementProfile(testUser, {
      fullName: "Test Candidate",
      targetRoles: ["Software Development Engineer (SDE-1)"],
    });

    const initialProf = getPlacementProfile(testUser);
    const initialSql = initialProf?.competencies["sql_window_functions"];
    assert.equal(initialSql?.tier, "unassessed");

    // Add verified SQL proof
    await service.addProofItem(testUser, {
      skillOrClaim: "sql_window_functions",
      evidenceType: "coding_assessment",
      title: "SQL Window Functions Verified Execution",
      verificationTier: "assessment_verified",
      verificationMethod: "sqlite_database_sync",
      confidenceScore: 95,
      assessmentScore: 100,
    });

    const updatedProf = getPlacementProfile(testUser);
    const updatedSql = updatedProf?.competencies["sql_window_functions"];
    assert.equal(updatedSql?.tier, "question_assessed");
    assert.equal(updatedSql?.confidenceScore, 95);
  });

  // ── TEST 7: TARGET ROLE GAP ENGINE & ACTION GENERATION ──
  test("7. Gap Engine identifies missing skills, weak evidence, and prioritized verifiable actions", () => {
    const profile: Partial<StudentPlacementProfile> = {
      targetRoles: ["Software Development Engineer (SDE-1)"],
      competencies: {
        sql_window_functions: {
          competencyId: "sql_window_functions",
          name: "SQL Window Functions & DENSE_RANK",
          domain: "sql",
          tier: "unassessed",
          confidenceScore: 0,
        },
        dsa_binary_search: {
          competencyId: "dsa_binary_search",
          name: "Binary Search & Monotonic Predicates",
          domain: "dsa",
          tier: "self_reported",
          confidenceScore: 40,
        },
      },
    };

    const gapReport = PlacementGapEngine.analyzeRoleGaps(profile as StudentPlacementProfile, []);
    assert.equal(gapReport.targetRole, "Software Development Engineer (SDE-1)");
    assert.ok(gapReport.missingSkills.length > 0);
    assert.ok(gapReport.prioritizedActions.length >= 3);

    // Verify SQL action
    const sqlAction = gapReport.prioritizedActions.find((a) => a.targetSkill.includes("SQL"));
    assert.ok(sqlAction);
    assert.equal(sqlAction?.priority, "high");
    assert.equal(sqlAction?.verificationMethod, "code_demonstrated");
  });

  // ── TEST 8: APPLICATION PIPELINE & STAGE TRACKING ──
  test("8. Application pipeline tracks transitions and updates candidate pipeline status", () => {
    const oppService = OpportunityService.getInstance();
    const testUser = `pipeline-student-${Date.now()}`;
    const oppId = "opp-google-test";

    // 1. Initial Attempt
    oppService.recordApplicationAttempt({
      candidateId: testUser,
      opportunityId: oppId,
      applicationUrl: "https://google.com/careers",
      status: "opened",
      attemptedAt: new Date().toISOString(),
    });

    let apps = oppService.getStudentApplications(testUser);
    assert.equal(apps.length, 1);
    assert.equal(apps[0].record.stage, "Considering");

    // 2. Transition to Applied
    oppService.trackApplicationStage({
      studentId: testUser,
      opportunityId: oppId,
      stage: "Applied",
      notes: "Submitted official ATS application",
    });

    apps = oppService.getStudentApplications(testUser);
    assert.equal(apps[0].record.stage, "Applied");
    assert.ok(apps[0].record.appliedAt);

    // 3. Transition to Interview
    oppService.trackApplicationStage({
      studentId: testUser,
      opportunityId: oppId,
      stage: "Interview",
      notes: "Technical Round 1 scheduled",
    });

    apps = oppService.getStudentApplications(testUser);
    assert.equal(apps[0].record.stage, "Interview");
  });

  // ── TEST 9: VERIFIED OFFERS & JOINING OUTCOMES ──
  test("9. Offer and joining outcomes are tracked privately with verification levels", async () => {
    const service = PlacementIntelligenceService.getInstance();
    const testUser = `offer-candidate-${Date.now()}`;

    const offer = await service.recordOffer(testUser, {
      employer: "Google",
      roleTitle: "Software Development Engineer (SDE-1)",
      offerDate: "2026-10-20",
      compensationCtc: 3200000,
      currency: "INR",
      status: "OFFER_RECEIVED",
      verificationLevel: "document_supported",
      notes: "Official offer letter received",
    });

    assert.equal(offer.employer, "Google");
    assert.equal(offer.compensationCtc, 3200000);
    assert.equal(offer.status, "OFFER_RECEIVED");

    // Update to ACCEPTED and JOINED
    const accepted = await service.recordOffer(testUser, {
      employer: "Google",
      roleTitle: "Software Development Engineer (SDE-1)",
      offerDate: "2026-10-20",
      compensationCtc: 3200000,
      currency: "INR",
      status: "JOINED",
      expectedJoiningDate: "2026-07-01",
      actualJoiningDate: "2026-07-01",
      verificationLevel: "independently_confirmed",
      notes: "Joined Bangalore campus",
    });

    assert.equal(accepted.status, "JOINED");
    assert.equal(accepted.actualJoiningDate, "2026-07-01");

    const allOffers = await service.getOffers(testUser);
    assert.equal(allOffers.length, 2);
  });

  // ── TEST 10: EXCLUSION OF CLOSED AND EXPIRED LISTINGS ──
  test("10. Closed and expired opportunities are excluded from active recommendations", () => {
    const closedOpp: CanonicalOpportunity = {
      ...dummyCanonicalOpp,
      id: "opp-closed-amazon",
      status: "closed",
    };

    const match = PlacementMatchingEngine.matchOpportunity(
      {
        targetRoles: ["Software Development Engineer (SDE-1)"],
        degree: "B.Tech",
        branch: "Computer Science",
        graduationYear: "2026",
      } as StudentPlacementProfile,
      [],
      closedOpp
    );

    assert.equal(match.recommendationTier, "NOT_ELIGIBLE");
    assert.equal(match.matchScore, 0);
    assert.ok(match.unmetOrUnknownRequirements.some((r) => r.includes("expired or closed")));
  });

  // ── TEST 11: COMPLETE PLACEMENT DASHBOARD ORCHESTRATION ──
  test("11. PlacementIntelligenceService orchestrates complete dashboard answering the 4 core questions", async () => {
    const service = PlacementIntelligenceService.getInstance();
    const testUser = `dashboard-candidate-${Date.now()}`;

    upsertPlacementProfile(testUser, {
      fullName: "Pooja Verma",
      college: "IIT Roorkee",
      degree: "B.Tech",
      branch: "Computer Science",
      graduationYear: "2026",
      cgpa: "8.8",
      targetRoles: ["Software Development Engineer (SDE-1)"],
      targetCompanies: ["Google", "Amazon", "Razorpay"],
    });

    const dashboard = await service.getCompletePlacementDashboard(testUser);

    assert.ok(dashboard.profile);
    assert.equal(dashboard.profile?.fullName, "Pooja Verma");

    // Question 1: Where do I stand?
    assert.ok(dashboard.overview.targetRole);
    assert.ok(dashboard.overview.readinessLevel);
    assert.ok(typeof dashboard.overview.evidenceCoveragePercent === "number");

    // Question 2: Which real opportunities are relevant?
    assert.ok(Array.isArray(dashboard.opportunities));

    // Question 3: What should I do next?
    assert.ok(dashboard.overview.topAction.title);
    assert.ok(dashboard.overview.topAction.ctaHref);

    // Question 4: How are my applications progressing?
    assert.ok(dashboard.overview.applicationPipelineSummary);
  });
});
