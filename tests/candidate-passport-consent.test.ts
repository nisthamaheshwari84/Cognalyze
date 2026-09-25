import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeCareerGaps, CareerRoleSpan } from "../lib/evidence/career-gap";
import {
  createConsentGrant,
  revokeConsentGrant,
  listActiveConsentGrants,
  generatePassportShareableLink
} from "../lib/privacy/consent";
import { executeDeletionCascade } from "../lib/privacy/deletion";

describe("Phase 7: Candidate Evidence Passport, Career Gaps, Consent & Deletion Cascade", () => {
  it("analyzes career transitions factually without penalty or moralizing bias (Truth Contract T7)", () => {
    const roles: CareerRoleSpan[] = [
      {
        startDate: "2024-04-01",
        endDate: null,
        title: "Staff Distributed Engineer",
        company: "Stripe",
      },
      {
        startDate: "2021-01-01",
        endDate: "2023-01-01", // 15 month transition interval between 2023-01 and 2024-04
        title: "Senior Backend Engineer",
        company: "Datadog",
      },
      {
        startDate: "2018-06-01",
        endDate: "2020-12-01",
        title: "Software Engineer",
        company: "Amazon AWS",
      },
    ];

    const gaps = analyzeCareerGaps(roles, 3);
    assert.equal(gaps.length, 1);
    const gap = gaps[0];

    assert.equal(gap.gapDetected, true);
    assert.ok(gap.gapDurationMonths >= 14);
    assert.equal(gap.recencyIndicator, "recent_activity_verified");
    // Verifies language contract: zero accusation of "job hopping" or "unexplained gap"
    assert.ok(gap.factualSummary.includes("Career transition of"));
    assert.ok(gap.recommendedDemonstration.includes("3 verified work sample(s)"));
    assert.ok(!gap.factualSummary.toLowerCase().includes("unexplained"));
    assert.ok(!gap.factualSummary.toLowerCase().includes("penalty"));
  });

  it("creates granular scoped consent grants and permits immediate revocation", async () => {
    const candidateId = `cand_consent_test_${Date.now()}`;
    const orgId = "org_linear_corp";

    // 1. Create scoped grant
    const grant = await createConsentGrant({
      personId: candidateId,
      granteeOrgId: orgId,
      granteeOrgName: "Linear Inc.",
      scopes: ["verified_claims", "work_samples", "github_code"],
      isAnonymous: true,
      durationDays: 14,
    });

    assert.ok(grant.id);
    assert.equal(grant.personId, candidateId);
    assert.equal(grant.granteeOrgId, orgId);
    assert.equal(grant.isAnonymous, true);
    assert.deepEqual(grant.scopes, ["verified_claims", "work_samples", "github_code"]);
    assert.ok(grant.expiresAt);

    // 2. Active grants query
    const activeGrants = await listActiveConsentGrants(candidateId);
    assert.ok(activeGrants.some((g) => g.id === grant.id));

    // 3. Generate shareable passport link
    const link = generatePassportShareableLink(candidateId, true);
    assert.ok(link.startsWith("/candidate/passport?token="));

    // 4. Immediate revocation
    const revoked = await revokeConsentGrant(grant.id, candidateId);
    assert.equal(revoked, true);

    const afterRevoke = await listActiveConsentGrants(candidateId);
    assert.ok(!afterRevoke.some((g) => g.id === grant.id));
  });

  it("executes complete GDPR/CCPA deletion cascade with confirmation receipt", async () => {
    const testCandidateId = `cand_gdpr_${Date.now()}`;

    // Seed a consent grant to be deleted in cascade
    await createConsentGrant({
      personId: testCandidateId,
      granteeOrgId: "org_target_test",
      granteeOrgName: "Target Org",
      scopes: ["full_dossier"],
    });

    const receipt = await executeDeletionCascade(testCandidateId, `candidate:${testCandidateId}`);

    assert.equal(receipt.success, true);
    assert.equal(receipt.personId, testCandidateId);
    assert.ok(receipt.confirmationToken.startsWith("DEL-"));
    assert.ok(receipt.timestamp);
    assert.ok(receipt.entitiesDeleted);

    // After cascade, no active consent grants must remain
    const remainingGrants = await listActiveConsentGrants(testCandidateId);
    assert.equal(remainingGrants.length, 0);
  });
});
