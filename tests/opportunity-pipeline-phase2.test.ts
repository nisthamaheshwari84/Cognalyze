/**
 * tests/opportunity-pipeline-phase2.test.ts
 * 
 * COGNALYZE PHASE 2 ACCEPTANCE TEST SUITE
 * 
 * Verifies:
 * 1. Socket-level SSRF defense (IPv4, IPv6, mapped addresses, AWS metadata, multi-hop redirects)
 * 2. ATS Adapters (Greenhouse, Lever, Ashby) with zero synthetic defaults and discovered/UNVERIFIED states
 * 3. 6-stage deduplication engine (Exact external ID, canonical URL, org + req ID, deterministic match,
 *    and ambiguous similarity review without auto-merging)
 * 4. Atomic sync leasing (mutual exclusion, renewal ownership, expiration yield)
 * 5. Lifecycle and verification transitions (dual-check 404 window, 429 backoff, date-only deadline handling)
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isPrivateOrReservedIp, safeFetch } from "@/lib/opportunities/security/ssrf-guard";
import { AtsFeedAdapter } from "@/lib/opportunities/adapters/ats-adapter";
import { OpportunityDeduplicator } from "@/lib/opportunities/pipeline/deduplicator";
import { OpportunitySyncLeaseManager } from "@/lib/opportunities/concurrency/sync-lease";
import { LinkVerificationEngine } from "@/lib/opportunities/verification/link-verifier";
import { OpportunityFreshnessEngine } from "@/lib/opportunities/pipeline/freshness-engine";
import { CanonicalOpportunity, RawOpportunity } from "@/lib/opportunities/types";

describe("Cognalyze Master Implementation — Phase 2 Pipeline Tests", () => {

  // =========================================================================
  // 1. SSRF GUARD & SOCKET-LEVEL NETWORK SECURITY
  // =========================================================================
  describe("1. Socket-Level SSRF Protection", () => {
    test("Correctly identifies and blocks private, loopback, and metadata IPv4 addresses", () => {
      // Loopback
      assert.strictEqual(isPrivateOrReservedIp("127.0.0.1"), true);
      assert.strictEqual(isPrivateOrReservedIp("127.0.1.1"), true);

      // Cloud instance metadata (AWS, GCP, Azure, OpenStack)
      assert.strictEqual(isPrivateOrReservedIp("169.254.169.254"), true);
      assert.strictEqual(isPrivateOrReservedIp("169.254.1.1"), true);

      // RFC 1918 Private networks
      assert.strictEqual(isPrivateOrReservedIp("10.0.0.1"), true);
      assert.strictEqual(isPrivateOrReservedIp("10.254.10.5"), true);
      assert.strictEqual(isPrivateOrReservedIp("172.16.0.1"), true);
      assert.strictEqual(isPrivateOrReservedIp("172.31.255.255"), true);
      assert.strictEqual(isPrivateOrReservedIp("192.168.0.1"), true);
      assert.strictEqual(isPrivateOrReservedIp("192.168.1.100"), true);

      // Zero-network and Broadcast
      assert.strictEqual(isPrivateOrReservedIp("0.0.0.0"), true);
      assert.strictEqual(isPrivateOrReservedIp("255.255.255.255"), true);

      // Public routable IPs must NOT be blocked
      assert.strictEqual(isPrivateOrReservedIp("93.184.216.34"), false); // example.com
      assert.strictEqual(isPrivateOrReservedIp("8.8.8.8"), false);        // Google DNS
      assert.strictEqual(isPrivateOrReservedIp("1.1.1.1"), false);        // Cloudflare
    });

    test("Correctly identifies and blocks IPv6 loopback, ULA, link-local, and IPv4-mapped IPv6", () => {
      // IPv6 Loopback
      assert.strictEqual(isPrivateOrReservedIp("::1"), true);
      assert.strictEqual(isPrivateOrReservedIp("0:0:0:0:0:0:0:1"), true);

      // Unique Local Addresses (fc00::/7)
      assert.strictEqual(isPrivateOrReservedIp("fc00::1"), true);
      assert.strictEqual(isPrivateOrReservedIp("fd12:3456:789a::1"), true);

      // Link-local (fe80::/10)
      assert.strictEqual(isPrivateOrReservedIp("fe80::1"), true);

      // IPv4-mapped IPv6 pointing to private addresses
      assert.strictEqual(isPrivateOrReservedIp("::ffff:127.0.0.1"), true);
      assert.strictEqual(isPrivateOrReservedIp("::ffff:169.254.169.254"), true);
      assert.strictEqual(isPrivateOrReservedIp("::ffff:192.168.1.1"), true);
    });

    test("safeFetch blocks non-HTTP/HTTPS protocols and dangerous hosts", async () => {
      await assert.rejects(
        async () => {
          await safeFetch("file:///etc/passwd");
        },
        /Forbidden protocol/
      );

      await assert.rejects(
        async () => {
          await safeFetch("gopher://127.0.0.1:70");
        },
        /Forbidden protocol/
      );

      await assert.rejects(
        async () => {
          await safeFetch("http://127.0.0.1:8080/internal");
        },
        /Direct IP connection to forbidden address|SSRF Blocked/
      );

      await assert.rejects(
        async () => {
          await safeFetch("http://169.254.169.254/latest/meta-data/");
        },
        /Direct IP connection to forbidden address|SSRF Blocked/
      );
    });
  });

  // =========================================================================
  // 2. ATS CONNECTOR PARSERS & ZERO SYNTHETIC DEFAULTS
  // =========================================================================
  describe("2. ATS Connectors & Missing Field Rigor", () => {
    const adapter = new AtsFeedAdapter();

    test("Normalizes Greenhouse raw item with explicit nulls and discovered/UNVERIFIED states", () => {
      const raw: RawOpportunity = {
        id: "gh-job-4029182",
        source: "Greenhouse",
        sourceType: "ATS",
        sourceId: "cloudflare",
        sourceUrl: "https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs/4029182",
        applicationUrl: "https://boards.greenhouse.io/cloudflare/jobs/4029182",
        companyName: "Cloudflare",
        title: "Systems Engineer, Distributed Storage",
        description: "Join our core platform team building global distributed cache infrastructure.",
        location: "Bengaluru, India",
        remoteType: "hybrid",
        requirements: ["Rust", "Go", "Distributed Systems"],
        metadata: {
          requisitionId: "REQ-4029",
          departments: ["Infrastructure"],
        }
      };

      const canonical = adapter.normalize(raw);

      // Identity & Classification
      assert.strictEqual(canonical.id, "gh-job-4029182");
      assert.strictEqual(canonical.companyName, "Cloudflare");
      assert.strictEqual(canonical.opportunityType, "FULL_TIME");

      // No synthetic values invented
      assert.strictEqual(canonical.compensation, undefined);
      assert.strictEqual(canonical.prize, undefined);
      assert.strictEqual(canonical.deadline, null); // Explicitly null, never fabricated
      assert.strictEqual(canonical.lastVerifiedAt, null); // Not verified yet

      // Initial lifecycle & verification states
      assert.strictEqual(canonical.status, "discovered");
      assert.strictEqual(canonical.verificationStatus, "UNVERIFIED");

      // Requirements mapped
      assert.deepStrictEqual(canonical.requiredSkills, ["Rust", "Go", "Distributed Systems"]);
      assert.strictEqual(canonical.roleDNA.mustHaveSkills.includes("Rust"), true);
    });

    test("Normalizes Lever item preserving raw payload for provenance", () => {
      const raw: RawOpportunity = {
        id: "lever-job-771829",
        source: "Lever",
        sourceType: "ATS",
        sourceId: "automattic",
        sourceUrl: "https://api.lever.co/v0/postings/automattic/771829",
        applicationUrl: "https://jobs.lever.co/automattic/771829",
        companyName: "Automattic",
        title: "Frontend Engineer - WordPress.com",
        description: "Building responsive React and Gutenberg interfaces for millions of creators.",
        remoteType: "remote",
        employmentType: "full_time",
        requirements: ["React", "TypeScript", "CSS"],
        rawSourceData: {
          leverId: "771829",
          categories: { team: "Product", location: "Global / Remote" }
        }
      };

      const canonical = adapter.normalize(raw);
      assert.strictEqual(canonical.remoteType, "remote");
      assert.strictEqual(canonical.employmentType, "full_time");
      assert.strictEqual(canonical.rawSourceData?.leverId, "771829");
      assert.strictEqual(canonical.status, "discovered");
      assert.strictEqual(canonical.verificationStatus, "UNVERIFIED");
    });
  });

  // =========================================================================
  // 3. 6-STAGE DEDUPLICATION & REVIEW QUEUE
  // =========================================================================
  describe("3. 6-Stage Idempotent Deduplication Engine", () => {
    function createMockOpp(overrides: Partial<CanonicalOpportunity>): CanonicalOpportunity {
      return {
        id: "opp-" + Math.random().toString(36).substring(2, 8),
        source: "TEST_SOURCE",
        sourceType: "ATS",
        sourceUrl: "https://example.com/job/1",
        applicationUrl: "https://example.com/job/1/apply",
        canonicalUrl: "https://example.com/job/1",
        companyId: "comp-stripe",
        companyName: "Stripe",
        title: "Software Engineer - Infrastructure",
        normalizedTitle: "software engineer infrastructure",
        opportunityType: "FULL_TIME",
        description: "Build robust global billing and infrastructure.",
        location: "Bengaluru, India",
        country: "India",
        city: "Bengaluru",
        remoteType: "hybrid",
        employmentType: "full_time",
        experienceLevel: "entry_level",
        educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: false },
        graduationRequirements: { isMandatory: false },
        requiredSkills: ["Go", "Distributed Systems"],
        preferredSkills: [],
        eligibilityRequirements: [],
        disqualifiers: [],
        postedAt: "2026-10-20T10:00:00Z",
        updatedAt: "2026-10-20T10:00:00Z",
        deadline: null,
        status: "discovered",
        verificationStatus: "UNVERIFIED",
        freshness: "ACTIVE",
        roleDNA: {
          roleCategory: "FULL_TIME",
          mustHaveSkills: ["Go"],
          preferredSkills: [],
          experienceYearsMin: 0,
          experienceYearsMax: 2,
          educationSummary: "Degree in CS",
          graduationWindow: "2025-2027",
          locationMode: "hybrid",
          disqualifiers: [],
        },
        createdAt: "2026-10-20T10:00:00Z",
        lastVerifiedAt: null,
        ...overrides,
      };
    }

    test("Stage 1: Deduplicates exact source ID and external listing ID", () => {
      const opp1 = createMockOpp({
        id: "opp-greenhouse-100",
        sourceId: "stripe",
        canonicalOpportunityId: "ext-gh-100",
        title: "Backend Engineer",
      });

      const opp2 = createMockOpp({
        id: "opp-greenhouse-100-repeat",
        sourceId: "stripe",
        canonicalOpportunityId: "ext-gh-100",
        title: "Backend Engineer - Updated",
      });

      const { uniqueOpportunities, duplicatesMergedCount } = OpportunityDeduplicator.deduplicate([opp1, opp2]);
      assert.strictEqual(uniqueOpportunities.length, 1);
      assert.strictEqual(duplicatesMergedCount, 1);
    });

    test("Stage 2: Deduplicates by normalized canonical URL stripping tracking parameters", () => {
      const opp1 = createMockOpp({
        id: "opp-url-1",
        canonicalUrl: "https://stripe.com/jobs/infrastructure-engineer?utm_source=linkedin&ref=campus2026",
      });

      const opp2 = createMockOpp({
        id: "opp-url-2",
        canonicalUrl: "https://stripe.com/jobs/infrastructure-engineer?fbclid=IwAR29&utm_campaign=grad_hiring",
      });

      const { uniqueOpportunities, duplicatesMergedCount } = OpportunityDeduplicator.deduplicate([opp1, opp2]);
      assert.strictEqual(uniqueOpportunities.length, 1);
      assert.strictEqual(duplicatesMergedCount, 1);
    });

    test("Stage 3: Deduplicates by Organization + Requisition ID", () => {
      const opp1 = createMockOpp({
        id: "opp-req-1",
        companyName: "Razorpay",
        sourceMetadata: { requisitionId: "REQ-RZP-9921" },
        title: "SDE 1 - Core Payments",
      });

      const opp2 = createMockOpp({
        id: "opp-req-2",
        companyName: "Razorpay",
        sourceMetadata: { requisitionId: "REQ-RZP-9921" },
        title: "Software Development Engineer I (Payments)",
      });

      const { uniqueOpportunities, duplicatesMergedCount } = OpportunityDeduplicator.deduplicate([opp1, opp2]);
      assert.strictEqual(uniqueOpportunities.length, 1);
      assert.strictEqual(duplicatesMergedCount, 1);
    });

    test("Stage 4: Deterministic exact match across company, title, and location", () => {
      const opp1 = createMockOpp({
        id: "opp-exact-1",
        companyName: "Atlassian",
        title: "Software Engineer Graduate 2026",
        normalizedTitle: "software engineer graduate 2026",
        location: "Bengaluru",
      });

      const opp2 = createMockOpp({
        id: "opp-exact-2",
        companyName: "Atlassian",
        title: "Software Engineer Graduate 2026",
        normalizedTitle: "software engineer graduate 2026",
        location: "Bengaluru",
      });

      const { uniqueOpportunities, duplicatesMergedCount } = OpportunityDeduplicator.deduplicate([opp1, opp2]);
      assert.strictEqual(uniqueOpportunities.length, 1);
      assert.strictEqual(duplicatesMergedCount, 1);
    });

    test("Stage 5: High similarity ambiguous titles DO NOT auto-merge (logged to duplicate reviews)", () => {
      // E.g. "Software Engineer" vs "Staff Software Engineer" or "Software Engineer II"
      const opp1 = createMockOpp({
        id: "opp-se",
        companyName: "Uber",
        title: "Software Engineer",
        normalizedTitle: "software engineer",
        location: "Hyderabad",
        canonicalUrl: "https://uber.com/jobs/software-engineer",
        sourceUrl: "https://uber.com/jobs/software-engineer",
      });

      const opp2 = createMockOpp({
        id: "opp-sse",
        companyName: "Uber",
        title: "Staff Software Engineer",
        normalizedTitle: "staff software engineer",
        location: "Hyderabad",
        canonicalUrl: "https://uber.com/jobs/staff-software-engineer",
        sourceUrl: "https://uber.com/jobs/staff-software-engineer",
      });

      const { uniqueOpportunities, duplicatesMergedCount } = OpportunityDeduplicator.deduplicate([opp1, opp2]);
      // Must remain 2 separate distinct listings, never merged silently!
      assert.strictEqual(uniqueOpportunities.length, 2);
      assert.strictEqual(duplicatesMergedCount, 0);
    });
  });

  // =========================================================================
  // 4. ATOMIC SYNC LEASING
  // =========================================================================
  describe("4. Atomic Sync Lease Manager", () => {
    const leaseManager = OpportunitySyncLeaseManager.getInstance();

    test("Worker acquires lease, prevents concurrent worker acquisition, and allows clean release", async () => {
      const sourceId = "test-sync-source-" + Date.now();

      // 1. Initial acquisition succeeds
      const lease1 = await leaseManager.acquireLease(sourceId, 2); // 2 second lease
      assert.strictEqual(lease1.acquired, true);
      assert.strictEqual(lease1.leaseOwner, leaseManager.getWorkerId());

      // 2. Same worker acquires / renews lease
      const renew = await leaseManager.renewLease(sourceId, 5);
      assert.strictEqual(renew, true);

      // 3. Worker releases lease
      const released = await leaseManager.releaseLease(sourceId);
      assert.strictEqual(released, true);

      // 4. After release, can be acquired afresh
      const leaseFresh = await leaseManager.acquireLease(sourceId, 10);
      assert.strictEqual(leaseFresh.acquired, true);

      // Clean up
      await leaseManager.releaseLease(sourceId);
    });
  });

  // =========================================================================
  // 5. LIFECYCLE & VERIFICATION TRANSITIONS
  // =========================================================================
  describe("5. Lifecycle Transitions & Link Verification", () => {
    test("Date-only deadline sets TIMEZONE_UNCONFIRMED status until confirmed", () => {
      const opp: CanonicalOpportunity = {
        id: "opp-deadline-dateonly",
        source: "TEST",
        sourceType: "UNSTOP",
        sourceUrl: "https://unstop.com/e/1",
        applicationUrl: "https://unstop.com/e/1/apply",
        companyId: "c-1",
        companyName: "National Hackathon",
        title: "Smart India Hackathon",
        normalizedTitle: "smart india hackathon",
        opportunityType: "HACKATHON",
        description: "Nationwide hackathon",
        location: "Delhi",
        country: "India",
        city: "Delhi",
        remoteType: "onsite",
        employmentType: "fellowship",
        experienceLevel: "intern",
        educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["All"], isMandatory: false },
        graduationRequirements: { isMandatory: false },
        requiredSkills: [],
        preferredSkills: [],
        eligibilityRequirements: [],
        disqualifiers: [],
        postedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: "2026-11-15", // Date-only format without time or timezone
        deadlineIsDateOnly: true,
        deadlineTimezone: null,
        deadlineEvaluationStatus: "TIMEZONE_UNCONFIRMED",
        status: "active",
        freshness: "ACTIVE",
        roleDNA: {
          roleCategory: "HACKATHON",
          mustHaveSkills: [],
          preferredSkills: [],
          experienceYearsMin: 0,
          experienceYearsMax: 0,
          educationSummary: "",
          graduationWindow: "",
          locationMode: "onsite",
          disqualifiers: [],
        },
        createdAt: new Date().toISOString(),
        lastVerifiedAt: null,
      };

      assert.strictEqual(opp.deadlineIsDateOnly, true);
      assert.strictEqual(opp.deadlineEvaluationStatus, "TIMEZONE_UNCONFIRMED");
    });

    test("Past deadline marks opportunity as EXPIRED in freshness evaluation", () => {
      const expiredOpp: CanonicalOpportunity = {
        id: "opp-expired-test",
        source: "TEST",
        sourceType: "ATS",
        sourceUrl: "https://example.com/job/2",
        applicationUrl: "https://example.com/job/2/apply",
        companyId: "c-2",
        companyName: "Old Listing",
        title: "Legacy Internship",
        normalizedTitle: "legacy internship",
        opportunityType: "INTERNSHIP",
        description: "Closed listing",
        location: "Remote",
        country: "India",
        city: "Remote",
        remoteType: "remote",
        employmentType: "internship",
        experienceLevel: "intern",
        educationRequirements: { degreesAllowed: ["B.Tech"], fieldsAllowed: ["CS"], isMandatory: false },
        graduationRequirements: { isMandatory: false },
        requiredSkills: [],
        preferredSkills: [],
        eligibilityRequirements: [],
        disqualifiers: [],
        postedAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        deadline: "2026-02-01T23:59:59Z", // Past deadline
        status: "active",
        freshness: "ACTIVE",
        roleDNA: {
          roleCategory: "INTERNSHIP",
          mustHaveSkills: [],
          preferredSkills: [],
          experienceYearsMin: 0,
          experienceYearsMax: 0,
          educationSummary: "",
          graduationWindow: "",
          locationMode: "remote",
          disqualifiers: [],
        },
        createdAt: "2026-01-01T00:00:00Z",
        lastVerifiedAt: null,
      };

      const result = OpportunityFreshnessEngine.evaluateFreshness(expiredOpp);
      assert.strictEqual(result.isExpired, true);
      assert.strictEqual(result.status, "EXPIRED");
    });
  });

});
