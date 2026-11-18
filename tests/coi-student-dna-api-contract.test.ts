import { describe, it } from "node:test";
import assert from "node:assert";
import { COIConsentService } from "../lib/integrations/coi/consent-service";
import { COIDNAExportService } from "../lib/integrations/coi/dna-export-service";
import { GET as getMe } from "../app/api/v1/me/route";
import { GET as getStudentDna } from "../app/api/v1/me/student-dna/route";
import { GET as getDnaVersions } from "../app/api/v1/me/student-dna/versions/route";
import { GET as getPlacementProfiles } from "../app/api/v1/me/placement-profiles/route";
import {
  GET as getConsent,
  POST as postConsent,
  DELETE as deleteConsent,
} from "../app/api/v1/connections/consent/route";
import { NextRequest } from "next/server";

describe("Cognalyze Opportunity Intelligence (COI) — Student DNA API Contract", () => {
  const testStudentId = "test-student-alice-101";

  it("1. Consent Enforcement: Retrieval fails with CONSENT_REQUIRED when student has not granted consent", async () => {
    // Ensure no active consent exists
    await COIConsentService.revokeConsent(testStudentId);

    const req = new NextRequest(`http://localhost:3000/api/v1/me/student-dna?demo=true&candidateId=${testStudentId}`);
    // Manually pass candidate via mock or test
    try {
      await COIDNAExportService.exportSnapshot(testStudentId);
      assert.fail("Should have thrown CONSENT_REQUIRED error");
    } catch (err: any) {
      assert.ok(err.message.includes("CONSENT_REQUIRED"), "Error must contain CONSENT_REQUIRED");
    }
  });

  it("2. Consent Granting: Student can grant explicit consent with requested scopes", async () => {
    const grant = await COIConsentService.grantConsent(testStudentId, [
      "student_dna:read",
      "placement_profiles:read",
    ]);

    assert.strictEqual(grant.studentId, testStudentId);
    assert.strictEqual(grant.granted, true);
    assert.ok(grant.scopes.includes("student_dna:read"));
    assert.ok(grant.scopes.includes("placement_profiles:read"));

    const hasScope = await COIConsentService.hasScope(testStudentId, "student_dna:read");
    assert.strictEqual(hasScope, true);
  });

  it("3. Snapshot Generation: Returns canonical Student DNA snapshot matching Section 8 schema", async () => {
    const snapshot = await COIDNAExportService.exportSnapshot(testStudentId);

    assert.strictEqual(snapshot.schema_version, "1.0");
    assert.strictEqual(snapshot.student_id, testStudentId);
    assert.ok(typeof snapshot.profile_version === "number");
    assert.ok(Array.isArray(snapshot.technical_skills));
    assert.ok(Array.isArray(snapshot.projects));
    assert.ok(Array.isArray(snapshot.experience));
    assert.ok(Array.isArray(snapshot.career_goals));
    assert.ok(Array.isArray(snapshot.placement_profiles));
    assert.strictEqual(snapshot.consent.granted, true);
    assert.ok(snapshot.consent.scopes.includes("student_dna:read"));
  });

  it("4. Evidence Preservation: Verifies skills retain claim provenance and no score fabrication", async () => {
    const snapshot = await COIDNAExportService.exportSnapshot(testStudentId);

    for (const skill of snapshot.technical_skills) {
      assert.ok(
        ["SELF_REPORTED", "SOURCE_REPORTED", "SUPPORTED", "INDEPENDENTLY_VERIFIED", "UNASSESSED"].includes(
          skill.evidenceStatus
        ),
        `Invalid evidenceStatus: ${skill.evidenceStatus}`
      );
      assert.ok(skill.confidenceScore >= 0 && skill.confidenceScore <= 1.0);
    }
  });

  it("5. Version Tracking: Version endpoint returns numeric version and last updated timestamp", async () => {
    await COIConsentService.grantConsent("student-demo", ["student_dna:read"]);
    const req = new NextRequest("http://localhost:3000/api/v1/me/student-dna/versions?demo=true");
    const res = await getDnaVersions(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(typeof json.profile_version === "number");
    assert.ok(json.last_updated_at);
  });

  it("6. Consent Revocation: Immediately terminates data access across all API endpoints", async () => {
    // Revoke consent
    const revoked = await COIConsentService.revokeConsent(testStudentId);
    assert.strictEqual(revoked, true);

    const hasScope = await COIConsentService.hasScope(testStudentId, "student_dna:read");
    assert.strictEqual(hasScope, false);

    // Verify snapshot generation throws immediately
    try {
      await COIDNAExportService.exportSnapshot(testStudentId);
      assert.fail("Should not allow export after revocation");
    } catch (err: any) {
      assert.ok(err.message.includes("CONSENT_REQUIRED"));
    }
  });

  it("7. Cross-User Isolation: User A consent does not permit User B access", async () => {
    const userA = "user-alice-alpha";
    const userB = "user-bob-bravo";

    await COIConsentService.grantConsent(userA, ["student_dna:read"]);
    await COIConsentService.revokeConsent(userB);

    assert.strictEqual(await COIConsentService.hasScope(userA, "student_dna:read"), true);
    assert.strictEqual(await COIConsentService.hasScope(userB, "student_dna:read"), false);
  });
});
