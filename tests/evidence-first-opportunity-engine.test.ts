/**
 * COGNALYZE EVIDENCE-FIRST OPPORTUNITY ENGINE — ACCEPTANCE TEST SUITE
 * 
 * Verifies all 12 core non-negotiables:
 * 1. SSRF and URL safety prevention.
 * 2. Deterministic link verification (HTTP 200, 404, soft-404 inspection).
 * 3. Redirect tracking: distinguishes legitimate redirect vs generic platform drop-off.
 * 4. Expired and registration closed detection.
 * 5. Acceptance Test: The Razorpay Test (payment APIs, webhook HMAC, no blind Kafka/K8s).
 * 6. Differentiated Opportunity Types (HackerRank contest != Kaggle ML != GSoC Open Source != Hackathon).
 * 7. Multi-source deduplication with canonical provenance.
 * 8. Deadline-aware milestone scheduling.
 * 9. Student DNA Evidence Coverage calculation.
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { LinkVerificationEngine } from "../lib/opportunities/verification/link-verifier";
import { DynamicOpportunityPreparationEngine } from "../lib/opportunities/engines/dynamic-preparation-engine";
import { OpportunityDeduplicator } from "../lib/opportunities/pipeline/deduplicator";
import { CanonicalOpportunity } from "../lib/opportunities/types";
import { getSafeOpportunityUrl, isActionableOpportunityUrl } from "../lib/ai/placement-intelligence";

describe("Evidence-First Opportunity Engine Acceptance Tests", () => {
  const verifier = LinkVerificationEngine.getInstance();
  const prepEngine = DynamicOpportunityPreparationEngine.getInstance();

  beforeEach(() => {
    verifier.clearTestMocks();
  });

  afterEach(() => {
    verifier.clearTestMocks();
  });

  // 1. SSRF & Scheme Protection
  test("Test 1: Blocks SSRF attempts to private networks, loopback, and metadata endpoints", () => {
    assert.equal(verifier.isSafeUrl("http://localhost:3000/internal").safe, false);
    assert.equal(verifier.isSafeUrl("http://127.0.0.1:8080/admin").safe, false);
    assert.equal(verifier.isSafeUrl("http://169.254.169.254/latest/meta-data/").safe, false);
    assert.equal(verifier.isSafeUrl("http://192.168.1.1/router").safe, false);
    assert.equal(verifier.isSafeUrl("http://10.0.0.5/api").safe, false);
    assert.equal(verifier.isSafeUrl("ftp://files.example.com/hackathon").safe, false);
    assert.equal(verifier.isSafeUrl("file:///etc/passwd").safe, false);

    const valid = verifier.isSafeUrl("https://devpost.com/software/my-project");
    assert.equal(valid.safe, true);
  });

  // 2. Valid URL Verification
  test("Test 2: Valid external URL returns VERIFIED_ACTIVE and is actionable", async () => {
    const targetUrl = "https://unstop.com/competitions/flipkart-grid-70";
    verifier.registerTestMock(targetUrl, {
      status: 200,
      body: "<html><head><title>Flipkart GRiD 7.0 - Unstop</title></head><body><h1>Flipkart GRiD 7.0</h1><p>Register now for SDE PPIs</p></body></html>"
    });

    const res = await verifier.verifyUrl(targetUrl, {
      title: "Flipkart GRiD 7.0",
      organizer: "Flipkart"
    });

    assert.equal(res.isVerified, true);
    assert.equal(res.isActionable, true);
    assert.equal(res.status, "VERIFIED_ACTIVE");
    assert.equal(res.contentSignals.has404Text, false);
  });

  // 3. HTTP 404 URL Test
  test("Test 3: HTTP 404 URL returns NOT_FOUND and is NOT actionable", async () => {
    const brokenUrl = "https://devpost.com/hackathons/deleted-hackathon-2024";
    verifier.registerTestMock(brokenUrl, {
      status: 404,
      body: "<html><title>404 Not Found</title><body>The page you requested was not found</body></html>"
    });

    const res = await verifier.verifyUrl(brokenUrl);
    assert.equal(res.isVerified, false);
    assert.equal(res.isActionable, false);
    assert.equal(res.status, "NOT_FOUND");
  });

  // 4. Soft 404 Test (HTTP 200 but content says "Page not found")
  test("Test 4: HTTP 200 page containing 'page does not exist' is detected as NOT_FOUND (Rule 9)", async () => {
    const soft404Url = "https://hackerearth.com/challenges/hackathon/old-challenge";
    verifier.registerTestMock(soft404Url, {
      status: 200,
      body: "<html><head><title>HackerEarth</title></head><body><div class='error-msg'>This challenge is not found or has been deleted.</div></body></html>"
    });

    const res = await verifier.verifyUrl(soft404Url);
    assert.equal(res.isVerified, false);
    assert.equal(res.isActionable, false);
    assert.equal(res.status, "NOT_FOUND");
    assert.equal(res.contentSignals.has404Text, true);
  });

  // 5. 301 Redirect to Correct Opportunity
  test("Test 5: 301 redirect to valid new opportunity preserves verification and updates finalUrl", async () => {
    const oldUrl = "https://devpost.com/hackathons/ai-sprint-old";
    const newUrl = "https://devpost.com/hackathons/ai-sprint-2026";

    verifier.registerTestMock(oldUrl, {
      status: 200,
      finalUrl: newUrl,
      redirectChain: [oldUrl, newUrl],
      body: "<html><head><title>AI Sprint 2026 - Devpost</title></head><body><h1>AI Sprint 2026</h1></body></html>"
    });

    const res = await verifier.verifyUrl(oldUrl, { title: "AI Sprint 2026" });
    assert.equal(res.isVerified, true);
    assert.equal(res.isActionable, true);
    assert.equal(res.status, "REDIRECTED_VERIFIED");
    assert.equal(res.finalUrl, newUrl);
  });

  // 6. 301 Redirect to Generic Platform Homepage (Deleted Opportunity)
  test("Test 6: Redirect to generic platform homepage (e.g. devpost.com/) is detected as REMOVED", async () => {
    const oldOppUrl = "https://devpost.com/hackathons/canceled-hackathon";
    const genericHome = "https://devpost.com/hackathons";

    verifier.registerTestMock(oldOppUrl, {
      status: 200,
      finalUrl: genericHome,
      redirectChain: [oldOppUrl, genericHome],
      body: "<html><head><title>All Hackathons - Devpost</title></head><body><h1>Find your next hackathon</h1></body></html>"
    });

    const res = await verifier.verifyUrl(oldOppUrl);
    assert.equal(res.isVerified, false);
    assert.equal(res.isActionable, false);
    assert.equal(res.status, "REMOVED");
  });

  // 7. Expired Opportunity / Registration Closed
  test("Test 7: Opportunity page with 'registration closed' is marked REGISTRATION_CLOSED and NOT actionable", async () => {
    const closedUrl = "https://unstop.com/competitions/past-competition";
    verifier.registerTestMock(closedUrl, {
      status: 200,
      body: "<html><head><title>National Tech Challenge</title></head><body><h1>National Tech Challenge</h1><span class='badge'>Registration has ended</span></body></html>"
    });

    const res = await verifier.verifyUrl(closedUrl);
    assert.equal(res.isVerified, true);
    assert.equal(res.isActionable, false);
    assert.equal(res.status, "REGISTRATION_CLOSED");
  });

  // 8. No Generic URL Fabrication Rule (Rule 2 & Rule 7)
  test("Test 8: getSafeOpportunityUrl never fabricates generic company or search directories", () => {
    assert.equal(getSafeOpportunityUrl(""), "");
    assert.equal(getSafeOpportunityUrl(undefined, "Random Startup", "App Challenge"), "");
    
    // Legitimate direct URL is preserved
    const direct = "https://unstop.com/hackathons/walmart-codehers-2026-982143";
    assert.equal(getSafeOpportunityUrl(direct), direct);

    // Generic portal directories are not actionable
    assert.equal(isActionableOpportunityUrl("https://unstop.com/competitions"), false);
    assert.equal(isActionableOpportunityUrl("https://devpost.com/hackathons"), false);
    assert.equal(isActionableOpportunityUrl(direct), true);
  });

  // 9. ACCEPTANCE TEST: THE RAZORPAY TEST (Section 25 & Section 55)
  test("Test 9: The Razorpay Test — Generates Razorpay-specific payment architecture without blind Kafka/Kubernetes", () => {
    const razorpayOpp: CanonicalOpportunity = {
      id: "opp-razorpay-buildathon-2026",
      source: "Devpost",
      sourceType: "DEVPOST",
      sourceUrl: "https://devpost.com/hackathons/razorpay-ai-buildathon-2026",
      applicationUrl: "https://devpost.com/hackathons/razorpay-ai-buildathon-2026",
      companyId: "org-razorpay",
      companyName: "Razorpay",
      organizer: "Razorpay Technologies",
      title: "Razorpay AI Buildathon 2026 — Intelligent Fintech Workflows",
      normalizedTitle: "razorpay ai buildathon 2026",
      opportunityType: "HACKATHON",
      description: "Build autonomous AI agents integrated with Razorpay Payments API to streamline merchant order reconciliation and refund triage.",
      location: "Bengaluru / Virtual",
      country: "India",
      city: "Bengaluru",
      remoteType: "remote",
      employmentType: "internship",
      experienceLevel: "entry_level",
      educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: false },
      graduationRequirements: { isMandatory: false },
      requiredSkills: ["Python", "FastAPI", "REST APIs", "Fintech"],
      preferredSkills: ["AI Agents", "Webhooks"],
      technologies: ["Python", "FastAPI", "PostgreSQL"],
      eligibilityRequirements: ["Open to developers and students"],
      disqualifiers: ["Plagiarized code"],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: {
        roleCategory: "Fintech Engineering",
        mustHaveSkills: ["Python", "FastAPI"],
        preferredSkills: ["Webhooks"],
        experienceYearsMin: 0,
        experienceYearsMax: 2,
        educationSummary: "Engineering students",
        graduationWindow: "Open",
        locationMode: "Remote",
        disqualifiers: []
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    const classification = prepEngine.classifyOpportunity(razorpayOpp);
    assert.equal(classification, "API_BUILDATHON");

    const plan = prepEngine.generatePreparationPlan(razorpayOpp, null);

    // Verify official APIs integrated
    const apiNames = plan.apisAndSDKs.map(a => a.name.toLowerCase());
    assert.ok(apiNames.some(a => a.includes("razorpay")), "Must include Razorpay official API in integration layer");

    // Verify architecture does NOT contain unjustified Kafka or Kubernetes
    const techStackNames = plan.architecture.components.map(c => c.technology.toLowerCase()).join(" ");
    assert.equal(techStackNames.includes("kafka"), false, "Must NOT inject Kafka without real streaming cause");
    assert.equal(techStackNames.includes("kubernetes"), false, "Must NOT inject Kubernetes for a lightweight buildathon");

    // Verify Demo Moment is present and proves real payment verification
    assert.ok(plan.demoMoment.whatJudgeSees.length > 10);
    assert.ok(plan.demoMoment.whyItProvesSuccess.toLowerCase().includes("payment") || plan.demoMoment.whyItProvesSuccess.toLowerCase().includes("signature") || plan.demoMoment.whyItProvesSuccess.toLowerCase().includes("api"));

    // Verify Judge defense covers webhook signature security
    const defenseQuestions = plan.judgeQuestions.map(q => q.question.toLowerCase()).join(" ");
    assert.ok(defenseQuestions.includes("webhook") || defenseQuestions.includes("transaction") || defenseQuestions.includes("signature"));
  });

  // 10. DIFFERENTIATED OPPORTUNITY TYPES TEST (Section 26 & Section 54)
  test("Test 10: Differentiated preparation across HackerRank contest, Kaggle ML, and GSoC Open Source", () => {
    // A. HackerRank Coding Contest
    const contestOpp: CanonicalOpportunity = {
      id: "opp-hr-sprint",
      source: "HackerRank",
      sourceType: "HACKERRANK",
      sourceUrl: "https://hackerrank.com/contests/world-codesprint",
      applicationUrl: "https://hackerrank.com/contests/world-codesprint",
      companyId: "org-hackerrank",
      companyName: "HackerRank",
      title: "World CodeSprint 2026",
      normalizedTitle: "world codesprint 2026",
      description: "Algorithmic programming contest with 8 progressive problem sets.",
      location: "Virtual",
      country: "Global",
      city: "Online",
      remoteType: "remote",
      employmentType: "fellowship",
      experienceLevel: "entry_level",
      educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
      graduationRequirements: { isMandatory: false },
      requiredSkills: ["Data Structures", "Algorithms", "C++"],
      preferredSkills: ["Dynamic Programming"],
      eligibilityRequirements: ["Open globally"],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: { roleCategory: "Contest", mustHaveSkills: ["C++"], preferredSkills: [], experienceYearsMin: 0, experienceYearsMax: 1, educationSummary: "", graduationWindow: "", locationMode: "", disqualifiers: [] },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    const contestPlan = prepEngine.generatePreparationPlan(contestOpp, null);
    assert.equal(contestPlan.classification, "CODING_CONTEST");
    assert.ok(contestPlan.whatOpportunityAsks.toLowerCase().includes("time limit") || contestPlan.whatOpportunityAsks.toLowerCase().includes("algorithmic"));

    // B. Kaggle ML Competition
    const kaggleOpp: CanonicalOpportunity = {
      id: "opp-kaggle-sprint",
      source: "Kaggle",
      sourceType: "KAGGLE",
      sourceUrl: "https://kaggle.com/competitions/predictive-challenge",
      applicationUrl: "https://kaggle.com/competitions/predictive-challenge",
      companyId: "org-kaggle",
      companyName: "Kaggle",
      title: "Kaggle Tabular Predictive Challenge",
      normalizedTitle: "kaggle tabular predictive challenge",
      description: "Machine learning competition evaluated on ROC-AUC metric.",
      location: "Virtual",
      country: "Global",
      city: "Online",
      remoteType: "remote",
      employmentType: "fellowship",
      experienceLevel: "entry_level",
      educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
      graduationRequirements: { isMandatory: false },
      requiredSkills: ["Machine Learning", "Python", "Feature Engineering"],
      preferredSkills: ["LightGBM", "Ensembling"],
      eligibilityRequirements: ["Open globally"],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: { roleCategory: "ML", mustHaveSkills: ["Python"], preferredSkills: [], experienceYearsMin: 0, experienceYearsMax: 1, educationSummary: "", graduationWindow: "", locationMode: "", disqualifiers: [] },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    const kagglePlan = prepEngine.generatePreparationPlan(kaggleOpp, null);
    assert.equal(kagglePlan.classification, "ML_COMPETITION");
    assert.ok(kagglePlan.learningChecklist.some(l => l.topic.toLowerCase().includes("validation") || l.topic.toLowerCase().includes("feature")));

    // C. Open Source Program (GSoC)
    const gsocOpp: CanonicalOpportunity = {
      id: "opp-gsoc-2026",
      source: "Google Open Source",
      sourceType: "OPEN_SOURCE",
      sourceUrl: "https://summerofcode.withgoogle.com",
      applicationUrl: "https://summerofcode.withgoogle.com",
      companyId: "org-google",
      companyName: "Google Open Source",
      title: "Google Summer of Code (GSoC) 2026",
      normalizedTitle: "google summer of code gsoc 2026",
      description: "Contribute to open source projects under mentorship.",
      location: "Virtual",
      country: "Global",
      city: "Online",
      remoteType: "remote",
      employmentType: "fellowship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
      graduationRequirements: { isMandatory: false },
      requiredSkills: ["Git", "GitHub", "Open Source"],
      preferredSkills: ["Documentation", "PR Etiquette"],
      eligibilityRequirements: ["Open globally"],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: { roleCategory: "Open Source", mustHaveSkills: ["Git"], preferredSkills: [], experienceYearsMin: 0, experienceYearsMax: 1, educationSummary: "", graduationWindow: "", locationMode: "", disqualifiers: [] },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    const gsocPlan = prepEngine.generatePreparationPlan(gsocOpp, null);
    assert.equal(gsocPlan.classification, "OPEN_SOURCE_PROGRAM");
    assert.ok(gsocPlan.submissionChecklist.some(s => s.item.toLowerCase().includes("pull request") || s.item.toLowerCase().includes("proposal")));

    // Confirm all 3 generated distinct headlines and architectures
    assert.notEqual(contestPlan.headline, kagglePlan.headline);
    assert.notEqual(kagglePlan.headline, gsocPlan.headline);
  });

  // 11. Multi-source Deduplication
  test("Test 11: Merges same event from Unstop and Devpost into single canonical opportunity", () => {
    const opp1: CanonicalOpportunity = {
      id: "opp-unstop-sih-2026",
      source: "Unstop",
      sourceType: "UNSTOP",
      sourceUrl: "https://unstop.com/hackathons/smart-india-hackathon-2026",
      applicationUrl: "https://unstop.com/hackathons/smart-india-hackathon-2026",
      companyId: "org-gov",
      companyName: "Ministry of Education",
      organizer: "Government of India",
      title: "Smart India Hackathon 2026",
      normalizedTitle: "smart india hackathon 2026",
      description: "National hackathon solving government problems.",
      location: "India",
      country: "India",
      city: "New Delhi",
      remoteType: "hybrid",
      employmentType: "fellowship",
      experienceLevel: "entry_level",
      educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
      graduationRequirements: { isMandatory: false },
      requiredSkills: ["Software Engineering"],
      preferredSkills: [],
      eligibilityRequirements: ["Indian College Students"],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: "2026-11-15T00:00:00Z",
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: { roleCategory: "Hackathon", mustHaveSkills: ["Software Engineering"], preferredSkills: [], experienceYearsMin: 0, experienceYearsMax: 1, educationSummary: "", graduationWindow: "", locationMode: "", disqualifiers: [] },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    const opp2: CanonicalOpportunity = {
      ...opp1,
      id: "opp-devpost-sih-2026",
      source: "Devpost",
      sourceType: "DEVPOST",
      sourceUrl: "https://devpost.com/hackathons/smart-india-hackathon-2026",
      applicationUrl: "https://devpost.com/hackathons/smart-india-hackathon-2026"
    };

    const deduplicated = OpportunityDeduplicator.deduplicate([opp1, opp2]);
    assert.equal(deduplicated.uniqueOpportunities.length, 1, "Duplicate listings must merge into 1 canonical opportunity");
    assert.equal(deduplicated.duplicatesMergedCount, 1, "Must record 1 duplicate merged");
    assert.ok(deduplicated.uniqueOpportunities[0].sourceInstances && deduplicated.uniqueOpportunities[0].sourceInstances.length >= 2, "Must preserve both source instances");
  });

  // 12. Student DNA Requirement Evidence Coverage
  test("Test 12: Computes accurate Requirement Evidence Coverage against candidate profile", () => {
    const opp: CanonicalOpportunity = {
      id: "opp-fullstack-challenge",
      source: "Cognalyze Verified",
      sourceType: "UNSTOP",
      sourceUrl: "https://example.com/challenge",
      applicationUrl: "https://example.com/challenge",
      companyId: "org-test",
      companyName: "Acme Corp",
      title: "Fullstack Architecture Sprint",
      normalizedTitle: "fullstack architecture sprint",
      description: "Build resilient fullstack application",
      location: "Remote",
      country: "Global",
      city: "Online",
      remoteType: "remote",
      employmentType: "internship",
      experienceLevel: "entry_level",
      educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
      graduationRequirements: { isMandatory: false },
      requiredSkills: ["Python", "FastAPI", "Docker", "PostgreSQL"],
      preferredSkills: [],
      eligibilityRequirements: [],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
      status: "ACTIVE",
      freshness: "FRESH",
      roleDNA: { roleCategory: "Engineering", mustHaveSkills: ["Python"], preferredSkills: [], experienceYearsMin: 0, experienceYearsMax: 1, educationSummary: "", graduationWindow: "", locationMode: "", disqualifiers: [] },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    const mockProfile: any = {
      verifiedSkills: [
        { name: "Python", proficiency: 85, evidenceCount: 3 },
        { name: "FastAPI", proficiency: 80, evidenceCount: 2 }
      ],
      coreSkills: ["Python", "FastAPI"]
    };

    const plan = prepEngine.generatePreparationPlan(opp, mockProfile);
    assert.ok(plan.whatYouAlreadyHave.some(s => s.toLowerCase().includes("python")));
    assert.ok(plan.whatYouAreMissing.some(s => s.toLowerCase().includes("docker") || s.toLowerCase().includes("postgresql")));
    assert.ok(plan.requirementEvidenceCoverage.coveragePercentage > 0);
  });
});
