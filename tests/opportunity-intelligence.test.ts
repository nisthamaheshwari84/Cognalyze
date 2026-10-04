/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — TEST SUITE
 * 
 * Verifies:
 * 1. Multi-Source Adapter Ingestion (Company, ATS, Startup, University, Job API)
 * 2. Graceful Registry Resilience (Disabled/failing adapters isolated)
 * 3. Canonical Normalization & Aggressive Deduplication
 * 4. Freshness Lifecycle Tracking & Verification Labels
 * 5. Eligibility Priority: Hard constraints override skill matching
 * 6. Evidence-First Matching: PROVEN, SUPPORTED, CLAIMED, MISSING
 * 7. Recommendation Matrix: APPLY NOW, BUILD EVIDENCE FIRST, EXPLORE, NOT ELIGIBLE
 * 8. Transparent Provenance Explanations: Why this candidate, opportunity, now
 * 9. Dynamic Re-Matching: New evidence unlocks previously blocked opportunities
 * 10. Application Tracking & Career Memory Outcome Loop
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { OpportunitySourceRegistry } from "../lib/opportunities/adapters/registry";
import { CompanyCareerAdapter } from "../lib/opportunities/adapters/company-career-adapter";
import { AtsFeedAdapter } from "../lib/opportunities/adapters/ats-adapter";
import { StartupAdapter } from "../lib/opportunities/adapters/startup-adapter";
import { UniversityAdapter } from "../lib/opportunities/adapters/university-adapter";
import { JobApiAdapter } from "../lib/opportunities/adapters/job-api-adapter";
import { OpportunityDeduplicator } from "../lib/opportunities/pipeline/deduplicator";
import { OpportunityFreshnessEngine } from "../lib/opportunities/pipeline/freshness-engine";
import { OpportunityEligibilityEngine } from "../lib/opportunities/engines/eligibility-engine";
import { OpportunityPersonalizationEngine } from "../lib/opportunities/engines/personalization-engine";
import { OpportunityService } from "../lib/opportunities/opportunity-service";
import { CanonicalOpportunity } from "../lib/opportunities/types";
import {
  getStudentIntelligenceProfile,
  getCareerMemory,
  getStudentChangeLog,
} from "../lib/intelligence/student-intelligence";

describe("Cognalyze Opportunity Intelligence Engine", () => {
  // ─────────────────────────────────────────────────────────────
  // 1. Multi-Source Ingestion & Adapter Architecture
  // ─────────────────────────────────────────────────────────────
  test("1. Multi-Source Ingestion: Ingests and normalizes across 5 permitted sources", async () => {
    const registry = OpportunitySourceRegistry.getInstance();
    const adapters = registry.getAllAdapters();

    assert.ok(adapters.length >= 5, "At least 5 source adapters registered");
    const adapterTypes = adapters.map((a) => a.type);
    assert.ok(adapterTypes.includes("COMPANY_CAREER"), "Includes official company careers");
    assert.ok(adapterTypes.includes("ATS"), "Includes ATS feeds");
    assert.ok(adapterTypes.includes("STARTUP"), "Includes startup sources");
    assert.ok(adapterTypes.includes("UNIVERSITY"), "Includes campus / university sources");
    assert.ok(adapterTypes.includes("JOB_API"), "Includes authorized job APIs");

    const result = await registry.researchAllSources();
    assert.ok(result.rawOpportunities.length > 0, "Discovered raw opportunities");
    assert.ok(result.canonicalOpportunities.length > 0, "Normalized canonical opportunities");
    assert.equal(result.stats.failedSources, 0, "Zero failures under standard operation");
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Registry Resilience & Graceful Error Isolation
  // ─────────────────────────────────────────────────────────────
  test("2. Registry Resilience: Disabled or failing source never breaks ingestion", async () => {
    const registry = OpportunitySourceRegistry.getInstance();
    registry.setAdapterStatus("adapter-company-careers", false);

    const result = await registry.researchAllSources();
    assert.ok(result.canonicalOpportunities.length > 0, "Still produces opportunities from other sources");

    // Re-enable
    registry.setAdapterStatus("adapter-company-careers", true);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Deduplication Engine
  // ─────────────────────────────────────────────────────────────
  test("3. Deduplication: Merges identical opportunities into 1 canonical item, preserving source instances", () => {
    const baseOpp: CanonicalOpportunity = {
      id: "opp-1-careers",
      source: "Google Careers",
      sourceType: "COMPANY_CAREER",
      sourceUrl: "https://careers.google.com/jobs/1",
      applicationUrl: "https://careers.google.com/jobs/1/apply",
      companyId: "google",
      companyName: "Google",
      title: "Software Engineer Intern, 2027",
      normalizedTitle: "Software Engineer Intern",
      description: "Distributed systems and Python development",
      responsibilities: ["Develop scalable code"],
      location: "Bengaluru, India",
      country: "India",
      city: "Bengaluru",
      remoteType: "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: true },
      graduationRequirements: { allowedYears: [2027, 2028], isMandatory: true },
      requiredSkills: ["Python", "DSA"],
      preferredSkills: ["FastAPI"],
      eligibilityRequirements: ["Graduating 2027 or 2028"],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: null,
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: {
        roleCategory: "Software Engineering",
        mustHaveSkills: ["Python", "DSA"],
        preferredSkills: ["FastAPI"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "B.Tech CS",
        graduationWindow: "2027-2028",
        locationMode: "Hybrid Bengaluru",
        disqualifiers: [],
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };

    // Duplicate listing from third-party partner
    const duplicateOpp: CanonicalOpportunity = {
      ...baseOpp,
      id: "opp-1-aggregator",
      source: "Partner Job API",
      sourceType: "JOB_API",
      sourceUrl: "https://partner-api.com/jobs/google-1",
      applicationUrl: "https://partner-api.com/jobs/google-1/apply",
    };

    const { uniqueOpportunities, duplicatesMergedCount } = OpportunityDeduplicator.deduplicate([
      baseOpp,
      duplicateOpp,
    ]);

    assert.equal(uniqueOpportunities.length, 1, "Merged duplicate listings into 1 canonical opportunity");
    assert.equal(duplicatesMergedCount, 1, "Counted 1 merged duplicate");
    assert.equal(
      uniqueOpportunities[0].applicationUrl,
      "https://careers.google.com/jobs/1/apply",
      "Preferred official direct company application link"
    );
    assert.equal(
      uniqueOpportunities[0].sourceInstances?.length,
      2,
      "Preserved both source instances in provenance"
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Freshness Engine
  // ─────────────────────────────────────────────────────────────
  test("4. Freshness Engine: Correctly flags FRESH, ACTIVE, and EXPIRED opportunities", () => {
    const activeOpp: CanonicalOpportunity = {
      id: "opp-active",
      source: "Stripe Careers",
      sourceType: "COMPANY_CAREER",
      sourceUrl: "https://stripe.com",
      applicationUrl: "https://stripe.com/apply",
      companyId: "stripe",
      companyName: "Stripe",
      title: "Backend Intern",
      normalizedTitle: "Backend Engineer Intern",
      description: "Python APIs",
      responsibilities: [],
      location: "Bengaluru",
      country: "India",
      city: "Bengaluru",
      remoteType: "remote",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: true },
      graduationRequirements: { isMandatory: false },
      requiredSkills: ["Python"],
      preferredSkills: [],
      eligibilityRequirements: [],
      disqualifiers: [],
      postedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 864000000).toISOString(), // 10 days in future
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: {
        roleCategory: "Backend Engineering",
        mustHaveSkills: ["Python"],
        preferredSkills: [],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "B.Tech",
        graduationWindow: "2027",
        locationMode: "Remote",
        disqualifiers: [],
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };

    const freshResult = OpportunityFreshnessEngine.evaluateFreshness(activeOpp);
    assert.equal(freshResult.freshness, "FRESH");
    assert.ok(freshResult.verificationLabel.startsWith("Verified"), "Verification label starts with Verified");

    // Past deadline
    const expiredOpp: CanonicalOpportunity = {
      ...activeOpp,
      id: "opp-expired",
      deadline: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    };

    const expiredResult = OpportunityFreshnessEngine.evaluateFreshness(expiredOpp);
    assert.equal(expiredResult.isExpired, true);
    assert.equal(expiredResult.status, "EXPIRED");
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Eligibility Priority: Hard constraints override skills
  // ─────────────────────────────────────────────────────────────
  test("5. Eligibility Engine: Hard constraint failure makes candidate INELIGIBLE even with matching skills", () => {
    const oppWithHardConstraint: CanonicalOpportunity = {
      id: "opp-senior",
      source: "Scale AI",
      sourceType: "ATS",
      sourceUrl: "https://scale.com",
      applicationUrl: "https://scale.com/apply",
      companyId: "scale",
      companyName: "Scale AI",
      title: "Senior AI Engineer (5+ years required)",
      normalizedTitle: "Senior AI Engineer",
      description: "Requires 5+ years of production experience",
      responsibilities: [],
      location: "Remote",
      country: "US",
      city: "San Francisco",
      remoteType: "remote",
      employmentType: "full_time",
      experienceLevel: "senior",
      educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: true },
      graduationRequirements: { isMandatory: false },
      requiredSkills: ["Python", "Machine Learning"], // Candidate has these skills!
      preferredSkills: [],
      eligibilityRequirements: ["5+ years experience"],
      disqualifiers: ["Requires 5+ years professional experience"],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: null,
      status: "ACTIVE",
      freshness: "ACTIVE",
      roleDNA: {
        roleCategory: "AI/ML Engineering",
        mustHaveSkills: ["Python", "Machine Learning"],
        preferredSkills: [],
        experienceYearsMin: 5,
        experienceYearsMax: 10,
        educationSummary: "B.Tech",
        graduationWindow: "Any",
        locationMode: "Remote",
        disqualifiers: ["Requires 5+ years professional experience"],
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };

    const studentCandidate = {
      studentId: "student-demo",
      degree: "B.Tech CSE",
      graduationYear: 2027,
      yearsOfExperience: 0,
      workAuthorizationCountry: "India",
    };

    const eligibility = OpportunityEligibilityEngine.evaluate(oppWithHardConstraint, studentCandidate);
    assert.equal(eligibility.status, "INELIGIBLE", "Candidate must be marked INELIGIBLE due to experience disqualifier");
    assert.ok(eligibility.blockers.length > 0, "Identified clear blocker");

    // Match engine must classify as NOT_ELIGIBLE and not promote into APPLY_NOW
    const profile = getStudentIntelligenceProfile("student-demo");
    const match = OpportunityPersonalizationEngine.matchOpportunity(oppWithHardConstraint, profile);
    assert.equal(match.recommendation, "NOT_ELIGIBLE", "Recommendation tier must be NOT_ELIGIBLE");
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Evidence-First Matching: PROVEN, SUPPORTED, CLAIMED, MISSING
  // ─────────────────────────────────────────────────────────────
  test("6. Evidence-First Matching: Evaluates candidate project evidence against role requirements", () => {
    const opp: CanonicalOpportunity = {
      id: "opp-ml-intern",
      source: "Razorpay",
      sourceType: "COMPANY_CAREER",
      sourceUrl: "https://razorpay.com",
      applicationUrl: "https://razorpay.com/apply",
      companyId: "razorpay",
      companyName: "Razorpay",
      title: "Data Science & ML Intern",
      normalizedTitle: "AI/ML Engineer Intern",
      description: "Python, ML, Git, and Docker",
      responsibilities: [],
      location: "Bengaluru",
      country: "India",
      city: "Bengaluru",
      remoteType: "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: true },
      graduationRequirements: { allowedYears: [2026, 2027, 2028], isMandatory: true },
      requiredSkills: ["Python", "Machine Learning", "Git"],
      preferredSkills: ["Docker", "Kubernetes"],
      eligibilityRequirements: ["Graduating 2026-2028"],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: null,
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: {
        roleCategory: "AI/ML Engineering",
        mustHaveSkills: ["Python", "Machine Learning", "Git"],
        preferredSkills: ["Docker", "Kubernetes"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "B.Tech",
        graduationWindow: "2026-2028",
        locationMode: "Hybrid",
        disqualifiers: [],
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };

    const profile = getStudentIntelligenceProfile("student-demo");
    const match = OpportunityPersonalizationEngine.matchOpportunity(opp, profile);

    // Verify Python evidence mapping
    const pythonMapping = match.evidenceMapping.find((m) => m.requirement === "Python");
    assert.ok(pythonMapping, "Python requirement mapped");
    assert.ok(
      pythonMapping.status === "PROVEN" || pythonMapping.status === "SUPPORTED",
      "Python must be backed by evidence"
    );

    // Verify missing Docker gap
    const dockerMapping = match.evidenceMapping.find((m) => m.requirement === "Docker");
    assert.ok(dockerMapping, "Docker requirement mapped");
    assert.equal(dockerMapping.status, "MISSING", "Docker has no verified project evidence");
  });

  // ─────────────────────────────────────────────────────────────
  // 7. BUILD EVIDENCE FIRST Engine
  // ─────────────────────────────────────────────────────────────
  test("7. BUILD EVIDENCE FIRST Engine: Generates concrete project action plans for fixable gaps", () => {
    const oppNeedsDocker: CanonicalOpportunity = {
      id: "opp-bifrost",
      source: "Bifrost AI",
      sourceType: "STARTUP",
      sourceUrl: "https://bifrost.ai",
      applicationUrl: "https://bifrost.ai/apply",
      companyId: "bifrost",
      companyName: "Bifrost AI",
      title: "Founding ML & Computer Vision Intern",
      normalizedTitle: "AI/ML Engineer Intern",
      description: "Requires PyTorch, Docker, and OpenCV",
      responsibilities: [],
      location: "Bengaluru / Remote",
      country: "India",
      city: "Bengaluru",
      remoteType: "remote",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: true },
      graduationRequirements: { isMandatory: false },
      requiredSkills: ["PyTorch", "Docker"],
      preferredSkills: ["OpenCV"],
      eligibilityRequirements: [],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: null,
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: {
        roleCategory: "AI/ML Engineering",
        mustHaveSkills: ["PyTorch", "Docker"],
        preferredSkills: ["OpenCV"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "B.Tech",
        graduationWindow: "2027",
        locationMode: "Remote",
        disqualifiers: [],
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };

    const profile = getStudentIntelligenceProfile("student-demo");
    const match = OpportunityPersonalizationEngine.matchOpportunity(oppNeedsDocker, profile);

    assert.equal(
      match.recommendation,
      "BUILD_EVIDENCE",
      "Should recommend BUILD_EVIDENCE when candidate has high intent but specific fixable skill gaps"
    );
    assert.ok(match.actionPlan, "Generates concrete action plan");
    assert.ok(match.actionPlan.deliverable.length > 10, "Provides verifiable deliverable recommendation");
    assert.ok(match.actionPlan.targetSkills.includes("Docker") || match.actionPlan.targetSkills.includes("PyTorch"));
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Transparent Provenance Explanations
  // ─────────────────────────────────────────────────────────────
  test("8. Transparent Explanations: Explains Why This Candidate, Why This Opportunity, and Why Now", () => {
    const opp: CanonicalOpportunity = {
      id: "opp-google",
      source: "Google Careers",
      sourceType: "COMPANY_CAREER",
      sourceUrl: "https://careers.google.com",
      applicationUrl: "https://careers.google.com/apply",
      companyId: "google",
      companyName: "Google",
      title: "SWE Intern Summer 2027",
      normalizedTitle: "Software Engineer Intern",
      description: "Python and algorithms",
      responsibilities: [],
      location: "Bengaluru",
      country: "India",
      city: "Bengaluru",
      remoteType: "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: true },
      graduationRequirements: { allowedYears: [2027], isMandatory: true },
      requiredSkills: ["Python", "Git"],
      preferredSkills: ["DSA"],
      eligibilityRequirements: ["Graduating 2027"],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: null,
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: {
        roleCategory: "Software Engineering",
        mustHaveSkills: ["Python", "Git"],
        preferredSkills: ["DSA"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "B.Tech",
        graduationWindow: "2027",
        locationMode: "Hybrid",
        disqualifiers: [],
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };

    const profile = getStudentIntelligenceProfile("student-demo");
    const match = OpportunityPersonalizationEngine.matchOpportunity(opp, profile);

    assert.ok(match.why.whyThisCandidate.length > 15, "Generates verifiable candidate evidence reasoning");
    assert.ok(match.why.whyThisOpportunity.length > 15, "Generates role alignment reasoning");
    assert.ok(match.why.whyNow.length > 15, "Generates why now / timeliness reasoning");
    assert.ok(match.why.summary.length > 20, "Generates executive summary");
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Central Opportunity Service & End-to-End Pipeline
  // ─────────────────────────────────────────────────────────────
  test("9. Opportunity Service: End-to-end personalized feed returns structured tiers and real summary", async () => {
    const service = OpportunityService.getInstance();
    const feed = await service.getPersonalizedFeed("student-demo", { forceRefresh: true });

    assert.ok(feed.summary.totalResearched > 0, "Researched opportunities count > 0");
    assert.ok(feed.summary.sourcesActive >= 4, "Active sources count >= 4");
    assert.ok(feed.categorized.applyNow.length > 0, "Identified at least one APPLY_NOW opportunity");
    assert.ok(feed.studentContext.topDemonstratedSkills.length > 0, "Identified student demonstrated skills");
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Dynamic Re-Matching: Adding evidence updates opportunities
  // ─────────────────────────────────────────────────────────────
  test("10. Dynamic Re-Matching: Registering new evidence updates affected opportunities and logs DNA change", async () => {
    const service = OpportunityService.getInstance();
    const result = await service.recalculateAffectedOpportunities("student-demo", "Docker");

    assert.ok(result.affectedCount >= 1, "Detected affected opportunities requiring Docker");
    assert.ok(result.message.includes("Docker"), "Message references new evidence");

    // Verify DNA change event was logged in student change log
    const changeLog = getStudentChangeLog("student-demo");
    const dockerEvent = changeLog.find((e) => e.triggerEvent.includes("Docker"));
    assert.ok(dockerEvent, "DNA change event logged in Career Intelligence loop");
  });

  // ─────────────────────────────────────────────────────────────
  // 11. Application Tracking & Career Memory Loop
  // ─────────────────────────────────────────────────────────────
  test("11. Application Tracking: Updating application outcome records into Career Memory", async () => {
    const service = OpportunityService.getInstance();
    const testOppId = "corp-stripe-backend-intern";

    // Track applied
    const appliedRecord = service.trackApplicationStage({
      studentId: "student-demo",
      opportunityId: testOppId,
      stage: "Applied",
    });
    assert.equal(appliedRecord.stage, "Applied");

    // Track interview rejection outcome
    const outcomeRecord = service.trackApplicationStage({
      studentId: "student-demo",
      opportunityId: testOppId,
      stage: "Rejected",
      outcomeReason: "Technical interview rejected",
      feedbackNotes: "Candidate needs deeper distributed transactions knowledge",
    });
    assert.equal(outcomeRecord.stage, "Rejected");

    // Verify Career Memory recorded this outcome
    const careerMemory = getCareerMemory("student-demo");
    const stripeRecord = careerMemory.records.find((r) => r.companyName === "Stripe");
    assert.ok(stripeRecord, "Career Memory recorded application outcome for future learning");
    assert.equal(stripeRecord?.status, "Rejected");
  });
});
