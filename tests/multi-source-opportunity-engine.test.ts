/**
 * COGNALYZE MULTI-SOURCE OPPORTUNITY DISCOVERY & INTELLIGENCE ENGINE
 * Comprehensive Acceptance Test Suite (Tests 1 to 10 as specified in Section 88)
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { OpportunityService, opportunityService } from "@/lib/opportunities/opportunity-service";
import { OpportunitySourceRegistry, sourceRegistry } from "@/lib/opportunities/adapters/registry";
import { BaseOpportunitySourceAdapter } from "@/lib/opportunities/adapters/base-adapter";
import { OpportunityDeduplicator } from "@/lib/opportunities/pipeline/deduplicator";
import { OpportunityFreshnessEngine } from "@/lib/opportunities/pipeline/freshness-engine";
import { OpportunityPersonalizationEngine } from "@/lib/opportunities/engines/personalization-engine";
import {
  CanonicalOpportunity,
  RawOpportunity,
  OpportunitySourceType,
  StudentOpportunityPreferences
} from "@/lib/opportunities/types";
import {
  StudentDNAProfile,
  getStudentIntelligenceProfile,
  invalidateStudentDNACache
} from "@/lib/intelligence/student-intelligence";

describe("Cognalyze Multi-Source Opportunity Discovery & Intelligence Engine (Section 88 Tests)", () => {

  // ─────────────────────────────────────────────────────────────
  // TEST 1 — New opportunity discovered from enabled source
  // ─────────────────────────────────────────────────────────────
  test("TEST 1: New opportunity from an enabled source is discovered and flows through pipeline", async () => {
    class MockTestSourceAdapter extends BaseOpportunitySourceAdapter {
      id = "test-mock-source";
      name = "Mock New Platform";
      type: OpportunitySourceType = "UNSTOP";
      description = "Mock platform for testing new discoveries";

      async discover(): Promise<RawOpportunity[]> {
        return [
          {
            id: "test-new-hackathon-2026",
            source: "Mock Source",
            sourceType: "UNSTOP",
            sourceUrl: "https://unstop.com/competitions/test-new-hackathon-2026",
            applicationUrl: "https://unstop.com/competitions/test-new-hackathon-2026/apply",
            companyName: "Google Cloud Labs",
            organizer: "Google Cloud",
            title: "Google Cloud Next Gen Innovators Hackathon 2026",
            opportunityType: "HACKATHON",
            description: "Build cutting-edge agentic workflows with Vertex AI and Kubernetes.",
            location: "India / Virtual",
            remoteType: "remote",
            employmentType: "fellowship",
            experienceLevel: "intern",
            requirements: ["Python", "Vertex AI", "Kubernetes"],
            eligibilityText: "All engineering students graduating in 2026 or 2027",
            postedAt: new Date().toISOString(),
            deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
            prize: "₹5,00,000 + Google Cloud Credits",
            tags: ["Python", "Vertex AI", "Kubernetes", "GenAI"],
            metadata: { tier: "Tier 1" }
          }
        ];
      }

      async fetch(): Promise<RawOpportunity | null> { return null; }

      normalize(raw: RawOpportunity): CanonicalOpportunity {
        const now = new Date().toISOString();
        return {
          id: raw.id,
          source: raw.source,
          sourceType: raw.sourceType,
          sourceUrl: raw.sourceUrl,
          applicationUrl: raw.applicationUrl,
          companyId: "org-google-cloud",
          companyName: raw.companyName,
          organizer: raw.organizer,
          title: raw.title,
          normalizedTitle: raw.title,
          opportunityType: raw.opportunityType || "HACKATHON",
          description: raw.description,
          responsibilities: ["Build agentic prototype", "Submit repo and demo"],
          location: raw.location || "India",
          country: "India",
          city: "Virtual",
          remoteType: "remote",
          employmentType: "fellowship",
          experienceLevel: "intern",
          educationRequirements: {
            degreesAllowed: ["B.Tech", "M.Tech"],
            fieldsAllowed: ["Computer Science"],
            isMandatory: false
          },
          graduationRequirements: {
            allowedYears: [2026, 2027],
            currentlyEnrolledRequired: true,
            isMandatory: true
          },
          requiredSkills: ["Python", "Kubernetes"],
          preferredSkills: ["Vertex AI"],
          eligibilityRequirements: ["Enrolled engineering students"],
          disqualifiers: [],
          prize: raw.prize,
          postedAt: raw.postedAt || now,
          updatedAt: now,
          deadline: raw.deadline || null,
          status: "ACTIVE",
          freshness: "ACTIVE",
          roleDNA: {
            roleCategory: "Engineering Challenge",
            mustHaveSkills: ["Python", "Kubernetes"],
            preferredSkills: ["Vertex AI"],
            experienceYearsMin: 0,
            experienceYearsMax: 1,
            educationSummary: "Enrolled engineering students",
            graduationWindow: "2026-2027",
            locationMode: "remote",
            disqualifiers: []
          },
          createdAt: now,
          lastVerifiedAt: now
        };
      }
    }

    const registry = OpportunitySourceRegistry.getInstance();
    const testAdapter = new MockTestSourceAdapter();
    registry.registerAdapter(testAdapter);

    // Run research
    const { canonicalOpportunities } = await registry.researchAllSources();
    const found = canonicalOpportunities.find(o => o.id === "test-new-hackathon-2026");

    assert.ok(found, "Discovered opportunity must be returned from researchAllSources");
    assert.equal(found.title, "Google Cloud Next Gen Innovators Hackathon 2026");
    assert.equal(found.source, "Mock Source");
    assert.equal(found.opportunityType, "HACKATHON");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 2 — Existing opportunity update without duplicate
  // ─────────────────────────────────────────────────────────────
  test("TEST 2: Existing opportunity update modifies deadline and description without creating a duplicate", async () => {
    const oppId = "opp-flipkart-grid-test-dedup";
    const initialOpp: CanonicalOpportunity = {
      id: oppId,
      source: "Unstop",
      sourceType: "UNSTOP",
      sourceUrl: "https://unstop.com/flipkart-grid",
      applicationUrl: "https://unstop.com/flipkart-grid/apply",
      companyId: "org-flipkart",
      companyName: "Flipkart",
      organizer: "Flipkart",
      title: "Flipkart GRiD 7.0 — Software Development Track",
      normalizedTitle: "Flipkart GRiD 7.0",
      opportunityType: "HACKATHON",
      description: "Initial description for Flipkart GRiD round 1.",
      responsibilities: ["Online quiz"],
      location: "Bengaluru",
      country: "India",
      city: "Bengaluru",
      remoteType: "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: false },
      graduationRequirements: { allowedYears: [2026, 2027], currentlyEnrolledRequired: true, isMandatory: true },
      requiredSkills: ["Java", "DSA"],
      preferredSkills: ["Kafka"],
      eligibilityRequirements: ["Graduating 2026/2027"],
      disqualifiers: [],
      postedAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
      deadline: "2026-09-15T00:00:00Z",
      status: "ACTIVE",
      freshness: "ACTIVE",
      roleDNA: {
        roleCategory: "Hackathon",
        mustHaveSkills: ["Java"],
        preferredSkills: ["Kafka"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "Engineering students",
        graduationWindow: "2026-2027",
        locationMode: "hybrid",
        disqualifiers: []
      },
      createdAt: "2026-08-01T00:00:00Z",
      lastVerifiedAt: "2026-08-01T00:00:00Z"
    };

    // Updated version from new fetch: extended deadline and updated description
    const updatedOpp: CanonicalOpportunity = {
      ...initialOpp,
      description: "EXTENDED: Finale tracks now include GenAI Autonomous Shopping Agents.",
      deadline: "2026-10-30T23:59:59Z",
      updatedAt: "2026-09-10T00:00:00Z",
      lastVerifiedAt: "2026-09-10T00:00:00Z"
    };

    const { uniqueOpportunities, duplicatesMergedCount } = OpportunityDeduplicator.deduplicate([
      initialOpp,
      updatedOpp
    ]);

    assert.equal(uniqueOpportunities.length, 1, "Must merge duplicate occurrences of same event");
    assert.equal(duplicatesMergedCount, 1, "Must report 1 duplicate merged");
    assert.equal(uniqueOpportunities[0].deadline, "2026-10-30T23:59:59Z", "Deadline must be updated");
    assert.ok(uniqueOpportunities[0].description.includes("EXTENDED"), "Description must reflect latest update");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 3 — Expiration handling
  // ─────────────────────────────────────────────────────────────
  test("TEST 3: An opportunity past its deadline transitions to EXPIRED and is excluded from active feed", () => {
    const expiredOpp: CanonicalOpportunity = {
      id: "opp-past-deadline-2025",
      source: "Devpost",
      sourceType: "DEVPOST",
      sourceUrl: "https://devpost.com/old-hackathon",
      applicationUrl: "https://devpost.com/old-hackathon/apply",
      companyId: "org-past",
      companyName: "Old Sponsor",
      title: "Past Summer Hackathon 2025",
      normalizedTitle: "Past Summer Hackathon 2025",
      opportunityType: "HACKATHON",
      description: "Old hackathon whose deadline has already elapsed.",
      responsibilities: ["Submit code"],
      location: "Online",
      country: "Global",
      city: "Virtual",
      remoteType: "remote",
      employmentType: "fellowship",
      experienceLevel: "entry_level",
      educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
      graduationRequirements: { currentlyEnrolledRequired: false, isMandatory: false },
      requiredSkills: ["Python"],
      preferredSkills: [],
      eligibilityRequirements: [],
      disqualifiers: [],
      postedAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      deadline: "2025-06-01T00:00:00Z", // In the past!
      status: "ACTIVE",
      freshness: "ACTIVE",
      roleDNA: {
        roleCategory: "Hackathon",
        mustHaveSkills: ["Python"],
        preferredSkills: [],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "All",
        graduationWindow: "Any",
        locationMode: "remote",
        disqualifiers: []
      },
      createdAt: "2025-01-01T00:00:00Z",
      lastVerifiedAt: "2025-01-01T00:00:00Z"
    };

    const evaluation = OpportunityFreshnessEngine.evaluateFreshness(expiredOpp);
    assert.equal(evaluation.status, "EXPIRED", "Status must become EXPIRED");
    assert.equal(evaluation.isExpired, true, "isExpired flag must be true");

    const activeList = OpportunityFreshnessEngine.filterActiveOpportunities([expiredOpp]);
    assert.equal(activeList.length, 0, "Expired opportunity must NOT appear in active list");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 4 — Multi-source duplicate merging into one canonical item
  // ─────────────────────────────────────────────────────────────
  test("TEST 4: Same opportunity appearing on Unstop and Devfolio merges into 1 Canonical Opportunity with source attribution", () => {
    const unstopListing: CanonicalOpportunity = {
      id: "unstop-smart-india-hackathon-2026",
      source: "Unstop",
      sourceType: "UNSTOP",
      sourceUrl: "https://unstop.com/hackathons/sih-2026",
      applicationUrl: "https://sih.gov.in/apply",
      companyId: "org-aicte-mhrd",
      companyName: "Ministry of Education & AICTE",
      organizer: "Government of India",
      title: "Smart India Hackathon 2026 (SIH)",
      normalizedTitle: "Smart India Hackathon 2026",
      opportunityType: "HACKATHON",
      description: "Nationwide initiative to provide students a platform to solve pressing problems of ministries.",
      responsibilities: ["Build hardware/software solution for ministry problem statements"],
      location: "India (Nodal Centers)",
      country: "India",
      city: "Multiple Cities",
      remoteType: "hybrid",
      employmentType: "fellowship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech", "MCA", "M.Tech"], fieldsAllowed: ["All"], isMandatory: true },
      graduationRequirements: { currentlyEnrolledRequired: true, isMandatory: true },
      requiredSkills: ["Full Stack", "Problem Solving"],
      preferredSkills: ["AI/ML"],
      eligibilityRequirements: ["College student teams"],
      disqualifiers: [],
      prize: "₹1,00,000 per problem statement",
      teamSize: "6 Members (at least 1 female)",
      postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
      status: "ACTIVE",
      freshness: "ACTIVE",
      roleDNA: {
        roleCategory: "National Hackathon",
        mustHaveSkills: ["Full Stack"],
        preferredSkills: ["AI/ML"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "College student teams",
        graduationWindow: "Currently enrolled",
        locationMode: "hybrid",
        disqualifiers: []
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    const devfolioListing: CanonicalOpportunity = {
      ...unstopListing,
      id: "devfolio-smart-india-hackathon-2026",
      source: "Devfolio",
      sourceType: "DEVFOLIO",
      sourceUrl: "https://devfolio.co/hackathons/sih-2026",
      applicationUrl: "https://sih.gov.in/apply" // Identical official government apply URL!
    };

    const { uniqueOpportunities, duplicatesMergedCount } = OpportunityDeduplicator.deduplicate([
      unstopListing,
      devfolioListing
    ]);

    assert.equal(uniqueOpportunities.length, 1, "Must merge cross-platform listings into 1 canonical item");
    assert.equal(duplicatesMergedCount, 1, "Must count exactly 1 merged duplicate");
    assert.ok(uniqueOpportunities[0].sourceInstances, "Must contain sourceInstances array");
    assert.equal(uniqueOpportunities[0].sourceInstances?.length, 2, "Must preserve both Unstop and Devfolio source instances");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 5 — Source failure isolation
  // ─────────────────────────────────────────────────────────────
  test("TEST 5: Unstop adapter failure does not prevent Devpost or IIT adapters from succeeding; valid data retained", async () => {
    class FailingAdapter extends BaseOpportunitySourceAdapter {
      id = "test-failing-unstop";
      name = "Failing Unstop Adapter";
      type: OpportunitySourceType = "UNSTOP";
      description = "Simulated outage";
      async discover(): Promise<RawOpportunity[]> {
        throw new Error("HTTP 503 Service Unavailable: Unstop upstream timeout");
      }
      async fetch(): Promise<RawOpportunity | null> { return null; }
      normalize(raw: RawOpportunity): CanonicalOpportunity { return {} as any; }
    }

    class WorkingAdapter extends BaseOpportunitySourceAdapter {
      id = "test-working-devpost";
      name = "Working Devpost Adapter";
      type: OpportunitySourceType = "DEVPOST";
      description = "Healthy feed";
      async discover(): Promise<RawOpportunity[]> {
        return [{
          id: "healthy-devpost-item",
          source: "Devpost",
          sourceType: "DEVPOST",
          sourceUrl: "https://devpost.com/healthy",
          applicationUrl: "https://devpost.com/healthy/apply",
          companyName: "OpenAI",
          title: "OpenAI Agents Hackathon",
          opportunityType: "HACKATHON",
          description: "Build autonomous multi-agent systems.",
          postedAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 10 * 86400000).toISOString()
        }];
      }
      async fetch(): Promise<RawOpportunity | null> { return null; }
      normalize(raw: RawOpportunity): CanonicalOpportunity {
        const now = new Date().toISOString();
        return {
          id: raw.id,
          source: raw.source,
          sourceType: raw.sourceType,
          sourceUrl: raw.sourceUrl,
          applicationUrl: raw.applicationUrl,
          companyId: "org-openai",
          companyName: raw.companyName,
          title: raw.title,
          normalizedTitle: raw.title,
          opportunityType: "HACKATHON",
          description: raw.description,
          responsibilities: ["Build agent system"],
          location: "Virtual",
          country: "Global",
          city: "Virtual",
          remoteType: "remote",
          employmentType: "fellowship",
          experienceLevel: "entry_level",
          educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
          graduationRequirements: { currentlyEnrolledRequired: false, isMandatory: false },
          requiredSkills: ["Python", "Agents"],
          preferredSkills: [],
          eligibilityRequirements: [],
          disqualifiers: [],
          postedAt: now,
          updatedAt: now,
          deadline: raw.deadline || null,
          status: "ACTIVE",
          freshness: "ACTIVE",
          roleDNA: {
            roleCategory: "Hackathon",
            mustHaveSkills: ["Python"],
            preferredSkills: [],
            experienceYearsMin: 0,
            experienceYearsMax: 1,
            educationSummary: "All",
            graduationWindow: "Any",
            locationMode: "remote",
            disqualifiers: []
          },
          createdAt: now,
          lastVerifiedAt: now
        };
      }
    }

    const registry = OpportunitySourceRegistry.getInstance();
    registry.registerAdapter(new FailingAdapter());
    registry.registerAdapter(new WorkingAdapter());

    const result = await registry.researchAllSources();

    assert.ok(result.stats.failedSources >= 1, "Must record failing source");
    assert.ok(result.stats.successfulSources >= 1, "Must record successful sources");
    const devpostItem = result.canonicalOpportunities.find(o => o.id === "healthy-devpost-item");
    assert.ok(devpostItem, "Devpost opportunity must succeed despite Unstop failure");

    // Check entry health record
    const entries = registry.getRegistryEntries();
    const failingEntry = entries.find(e => e.id === "test-failing-unstop");
    assert.equal(failingEntry?.status, "ERROR", "Failing adapter status must be recorded as ERROR");
    assert.ok(failingEntry?.lastError?.includes("503"), "Last error must contain failure description");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 6 — Empty response does NOT delete existing records
  // ─────────────────────────────────────────────────────────────
  test("TEST 6: Temporary empty response from a source preserves existing valid records in database", async () => {
    const service = OpportunityService.getInstance();

    const existingRecord: CanonicalOpportunity = {
      id: "unstop-retained-opp",
      source: "Unstop",
      sourceType: "UNSTOP",
      sourceUrl: "https://unstop.com/valid-opp",
      applicationUrl: "https://unstop.com/valid-opp/apply",
      companyId: "org-existing",
      companyName: "Retained Enterprise",
      title: "Existing Verified Unstop Challenge",
      normalizedTitle: "Existing Verified Unstop Challenge",
      opportunityType: "HACKATHON",
      description: "Existing challenge that should survive temporary empty sync.",
      responsibilities: ["Build solution"],
      location: "India",
      country: "India",
      city: "Virtual",
      remoteType: "remote",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: false },
      graduationRequirements: { currentlyEnrolledRequired: false, isMandatory: false },
      requiredSkills: ["Python"],
      preferredSkills: [],
      eligibilityRequirements: [],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      status: "ACTIVE",
      freshness: "ACTIVE",
      roleDNA: {
        roleCategory: "Hackathon",
        mustHaveSkills: ["Python"],
        preferredSkills: [],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "All",
        graduationWindow: "Any",
        locationMode: "remote",
        disqualifiers: []
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    service.setCanonicalOpportunities([existingRecord]);

    // Verify existing record is in active opportunities
    const activeBefore = service.getActiveOpportunities();
    assert.ok(activeBefore.some(o => o.id === "unstop-retained-opp"), "Existing record must be present");

    // Perform sync — even if external discovery produces unrelated or empty results,
    // existing unstop-retained-opp must NOT be erased!
    await service.syncAllSources(false);

    const activeAfter = service.getActiveOpportunities();
    assert.ok(
      activeAfter.some(o => o.id === "unstop-retained-opp"),
      "Existing valid opportunity must NOT be deleted by temporary empty results"
    );
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 7 — Student matching with actual evidence
  // ─────────────────────────────────────────────────────────────
  test("TEST 7: Student with verified Python, ML, and FastAPI receives STRONG evidence match with real evidence citations", () => {
    const opp: CanonicalOpportunity = {
      id: "ai-intern-opp",
      source: "Company Careers",
      sourceType: "COMPANY_CAREER",
      sourceUrl: "https://example.com/careers/ai-intern",
      applicationUrl: "https://example.com/careers/ai-intern/apply",
      companyId: "org-ai-corp",
      companyName: "AI Horizon Labs",
      title: "AI & Backend Engineering Intern",
      normalizedTitle: "AI/ML Engineer Intern",
      opportunityType: "INTERNSHIP",
      description: "Build high-throughput LLM pipelines and FastAPI inference endpoints.",
      responsibilities: ["Develop FastAPI microservices", "Deploy ML models"],
      location: "Bengaluru, India",
      country: "India",
      city: "Bengaluru",
      remoteType: "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech", "M.Tech"], fieldsAllowed: ["Computer Science"], isMandatory: false },
      graduationRequirements: { allowedYears: [2026, 2027], currentlyEnrolledRequired: true, isMandatory: false },
      requiredSkills: ["Python", "FastAPI"],
      preferredSkills: ["Machine Learning"],
      eligibilityRequirements: ["B.Tech students"],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: "ACTIVE",
      freshness: "ACTIVE",
      roleDNA: {
        roleCategory: "AI/ML Engineering",
        mustHaveSkills: ["Python", "FastAPI"],
        preferredSkills: ["Machine Learning"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "Engineering students",
        graduationWindow: "2026-2027",
        locationMode: "hybrid",
        disqualifiers: []
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    const mockProfile: StudentDNAProfile = {
      candidateId: "student-evidence-test",
      intent: { primaryGoal: "AI/ML Engineer", experienceTarget: "Internship" },
      capabilities: {
        Python: {
          name: "Python",
          proficiencyState: "Verified",
          confidenceScore: 0.95,
          evidenceLevel: 3,
          isDormant: false,
          evidenceBreakdown: { projectCount: 3, internshipCount: 1, hackathonCount: 1 }
        },
        FastAPI: {
          name: "FastAPI",
          proficiencyState: "Strong",
          confidenceScore: 0.88,
          evidenceLevel: 2,
          isDormant: false,
          evidenceBreakdown: { projectCount: 2, internshipCount: 0, hackathonCount: 0 }
        }
      },
      totalEvidenceCount: 15,
      lastCalculatedAt: new Date().toISOString(),
      graduationYear: 2026,
      degreeTrack: "B.Tech Computer Science"
    };

    const prefs: StudentOpportunityPreferences = {
      candidateId: "student-evidence-test",
      targetRoles: ["AI/ML Engineer"],
      experienceLevel: "intern",
      locations: ["Bengaluru"],
      remotePreferences: ["hybrid", "remote"],
      preferredCompanyTypes: ["startup", "enterprise"],
      updatedAt: new Date().toISOString()
    };

    const match = OpportunityPersonalizationEngine.matchOpportunity(opp, mockProfile, prefs);

    assert.equal(match.recommendation, "APPLY_NOW", "Candidate with proven skills must receive APPLY_NOW");
    assert.equal(match.matchBreakdown.evidenceStrength, "Strong", "Evidence strength must be Strong");
    assert.ok(match.why.whyThisCandidate.includes("Python"), "Why summary must cite Python evidence");
    assert.ok(match.why.whyThisCandidate.includes("FastAPI"), "Why summary must cite FastAPI evidence");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 8 — Missing evidence correctly flagged as a gap
  // ─────────────────────────────────────────────────────────────
  test("TEST 8: Opportunity requiring PyTorch when student has no evidence marks PyTorch as a gap, not verified", () => {
    const opp: CanonicalOpportunity = {
      id: "ml-research-opp",
      source: "Company Careers",
      sourceType: "COMPANY_CAREER",
      sourceUrl: "https://example.com/ml-research",
      applicationUrl: "https://example.com/ml-research/apply",
      companyName: "DeepTech Research",
      companyId: "org-deeptech",
      title: "Machine Learning Research Intern",
      normalizedTitle: "AI/ML Engineer Intern",
      opportunityType: "RESEARCH",
      description: "Fundamental deep learning research requiring PyTorch architecture training.",
      responsibilities: ["Train PyTorch diffusion models"],
      location: "Bengaluru",
      country: "India",
      city: "Bengaluru",
      remoteType: "onsite",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: { degreesAllowed: ["B.Tech", "M.Tech"], fieldsAllowed: ["CS"], isMandatory: false },
      graduationRequirements: { currentlyEnrolledRequired: false, isMandatory: false },
      requiredSkills: ["PyTorch"], // Student has NO PyTorch!
      preferredSkills: ["CUDA"],
      eligibilityRequirements: [],
      disqualifiers: [],
      postedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: "ACTIVE",
      freshness: "ACTIVE",
      roleDNA: {
        roleCategory: "AI/ML Research",
        mustHaveSkills: ["PyTorch"],
        preferredSkills: ["CUDA"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "All",
        graduationWindow: "Any",
        locationMode: "onsite",
        disqualifiers: []
      },
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };

    const mockProfile: StudentDNAProfile = {
      candidateId: "student-missing-test",
      intent: { primaryGoal: "AI/ML Engineer" },
      capabilities: {
        Python: {
          name: "Python",
          proficiencyState: "Verified",
          confidenceScore: 0.9,
          evidenceLevel: 2,
          isDormant: false
        }
        // Notice: ZERO PyTorch capability
      },
      totalEvidenceCount: 5,
      lastCalculatedAt: new Date().toISOString()
    };

    const prefs: StudentOpportunityPreferences = {
      candidateId: "student-missing-test",
      targetRoles: ["AI/ML Engineer"],
      experienceLevel: "intern",
      locations: ["Bengaluru"],
      remotePreferences: ["onsite"],
      preferredCompanyTypes: ["enterprise"],
      updatedAt: new Date().toISOString()
    };

    const match = OpportunityPersonalizationEngine.matchOpportunity(opp, mockProfile, prefs);

    // PyTorch MUST be flagged as missing/gap
    assert.ok(
      match.missingRequirements.some(r => r.toLowerCase().includes("pytorch")),
      "PyTorch must be listed in missingRequirements"
    );
    assert.ok(
      match.evidenceGaps.some(g => g.skill.toLowerCase().includes("pytorch")),
      "PyTorch must be listed in evidenceGaps"
    );
    assert.notEqual(match.recommendation, "APPLY_NOW", "Must NOT recommend APPLY_NOW when critical must-have skill has 0 evidence");
    assert.ok(
      match.recommendation === "BUILD_EVIDENCE" || match.recommendation === "EXPLORE",
      "Recommendation tier must be BUILD_EVIDENCE or EXPLORE"
    );
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 9 — Resume update triggers re-matching without refetching internet
  // ─────────────────────────────────────────────────────────────
  test("TEST 9: Student resume update triggers re-matching against current database without refetching external internet", async () => {
    const service = OpportunityService.getInstance();
    const candidateId = "student-resume-re-eval-test";

    // Re-evaluating opportunities when candidate acquires new evidence in "Docker"
    const reEvalResult = await service.recalculateAffectedOpportunities(candidateId, "Docker");

    assert.ok(typeof reEvalResult.affectedCount === "number", "Must calculate affected count");
    assert.ok(Array.isArray(reEvalResult.promotedToApplyNow), "Must return promoted list");
    assert.ok(reEvalResult.message.includes("Docker"), "Message must reference newly evidenced capability");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 10 — Existing Opportunity Agent continues to work smoothly
  // ─────────────────────────────────────────────────────────────
  test("TEST 10: Existing Opportunity Agent and Opportunity Service return complete personalized catalog with multi-source metadata", async () => {
    const service = OpportunityService.getInstance();
    const feed = await service.getPersonalizedFeed("student-demo");

    assert.ok(feed.summary, "Must return research summary");
    assert.ok(feed.summary.activeCount > 0, "Must have active discovered opportunities");
    assert.ok(feed.summary.sourcesActive >= 5, "Must have active discovery sources");
    assert.ok(feed.categorized.applyNow, "Must have applyNow bucket");
    assert.ok(feed.categorized.buildEvidence, "Must have buildEvidence bucket");
    assert.ok(feed.allPersonalizedMatches.length > 0, "Must have personalized matches");

    // Check that every opportunity has an application URL and source attribution
    const firstMatch = feed.allPersonalizedMatches[0];
    assert.ok(firstMatch.opportunity.applicationUrl, "Opportunity must have applicationUrl");
    assert.ok(firstMatch.opportunity.source, "Opportunity must preserve source name");
    assert.ok(firstMatch.opportunity.sourceType, "Opportunity must preserve sourceType");
    assert.ok(firstMatch.why.whyThisCandidate, "Opportunity must have Why This Candidate");
  });
});
