import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getOrganizationCapabilityMap,
  analyzeTeamCompositionDelta,
} from "../lib/organization/capability-map";
import {
  evaluateInternalMobility,
  InternalRoleListing,
} from "../lib/mobility/internal-mobility";
import {
  attachPostAsEvidenceSource,
  inspectAndVerifyNetworkSource,
  verifyEngagementIndependence,
} from "../lib/network/network-source";
import { generateRoleDraftFromProblem } from "../lib/roles/future-role-builder";
import { createConsentGrant } from "../lib/privacy/consent";

describe("Phase 8: Org Layer, Network-as-Evidence-Source, Collaboration, & Internal Mobility", () => {
  it("computes organization capability map strictly from consented evidence and displays exact counts, no magic scores", async () => {
    // 1. Seed consent for test employee
    const employeeId = `emp_org_test_${Date.now()}`;
    const orgId = "org_acme_corp";

    await createConsentGrant({
      personId: employeeId,
      granteeOrgId: orgId,
      granteeOrgName: "Acme Corp",
      scopes: ["full_dossier", "verified_claims"],
    });

    const report = await getOrganizationCapabilityMap(orgId, "Acme Corp");

    assert.equal(report.orgId, orgId);
    assert.ok(typeof report.consentedEmployeeCount === "number");
    assert.ok(typeof report.totalVerifiedEvidenceItems === "number");
    assert.ok(Array.isArray(report.capabilities));

    // Verify each capability contains factual evidence counts and distinct staff counts
    for (const cap of report.capabilities) {
      assert.ok(typeof cap.verifiedEvidenceCount === "number");
      assert.ok(typeof cap.distinctEmployeeCount === "number");
      assert.ok(typeof cap.tierCounts.t1_self_asserted === "number");
      assert.ok(typeof cap.tierCounts.t2_third_party === "number");
      assert.ok(!("score" in cap), "Capability map must not output arbitrary score fields");
      assert.ok(!("percentageFit" in cap), "Capability map must not output arbitrary percentageFit fields");
    }
  });

  it("analyzes team composition and flags 'Adds capabilities less represented in this team' strictly via capability coverage", () => {
    const teamExistingCapabilities = {
      "Distributed Systems": 4,
      PostgreSQL: 3,
      Kafka: 2,
      Rust: 0, // Unrepresented in current team
      Solidity: 1, // Less represented
    };

    const analysis = analyzeTeamCompositionDelta({
      teamId: "team_infra",
      teamName: "Infrastructure Core",
      teamExistingCapabilities,
      candidatePersonId: "cand_transfer_1",
      candidatePersonName: "Candidate Rustacean",
      candidateCapabilities: [
        { capability: "Rust", verifiedCount: 2, tier: "T2" },
        { capability: "Distributed Systems", verifiedCount: 3, tier: "T2" },
      ],
    });

    assert.equal(analysis.teamId, "team_infra");
    assert.ok(analysis.candidateComplementarity.addsCapabilitiesLessRepresented.includes("Rust"));
    assert.ok(!analysis.candidateComplementarity.addsCapabilitiesLessRepresented.includes("Distributed Systems"));
    assert.ok(analysis.candidateComplementarity.factualObservation.includes("Adds capabilities less represented in this team: Rust"));
    // Verifies language contract: zero interpersonal-compatibility claims
    assert.ok(!analysis.candidateComplementarity.factualObservation.toLowerCase().includes("personality"));
    assert.ok(!analysis.candidateComplementarity.factualObservation.toLowerCase().includes("culture fit"));
  });

  it("evaluates internal mobility using pure derive() with cited evidence IDs and zero person-score fields", async () => {
    const testEmployeeId = `emp_mobility_${Date.now()}`;
    const testOrgId = "org_mobility_inc";

    // Grant internal mobility consent
    await createConsentGrant({
      personId: testEmployeeId,
      granteeOrgId: testOrgId,
      granteeOrgName: "Mobility Inc",
      scopes: ["full_dossier"],
    });

    const targetRole: InternalRoleListing = {
      id: "role_staff_arch",
      orgId: testOrgId,
      title: "Staff Architecture Lead",
      department: "Platform Engineering",
      requirements: [
        {
          id: "req_consensus",
          roleId: "role_staff_arch",
          text: "Implementation of distributed consensus protocols in production",
          category: "core",
        },
        {
          id: "req_observability",
          roleId: "role_staff_arch",
          text: "OpenTelemetry tracing across multi-tenant microservices",
          category: "evaluated",
        },
        {
          id: "req_unknown_skill",
          roleId: "role_staff_arch",
          text: "Quantum encryption key distribution algorithms",
          category: "core",
        },
      ],
    };

    // Evaluate with deterministic mock evidence
    const report = await evaluateInternalMobility({
      employeePersonId: testEmployeeId,
      role: targetRole,
      mockEvidenceForTest: {
        req_consensus: [
          {
            id: "evi_raft_demo",
            sourceId: "github_connector",
            tier: "T2",
            coverage: "direct",
            relation: "supports",
            observedAt: new Date().toISOString(),
          },
        ],
        req_observability: [
          {
            id: "evi_otel_notes",
            sourceId: "resume_span",
            tier: "T1",
            coverage: "direct",
            relation: "supports",
            observedAt: new Date().toISOString(),
          },
        ],
        req_unknown_skill: [], // Zero evidence
      },
    });

    assert.equal(report.employeePersonId, testEmployeeId);
    assert.equal(report.targetRoleId, targetRole.id);
    assert.equal(report.consentVerified, true);
    assert.equal(report.summary.totalRequirements, 3);
    assert.equal(report.summary.establishedCount, 1); // req_consensus established by T2 evidence
    assert.equal(report.summary.partialCount, 1); // req_observability partial from single T1
    assert.equal(report.summary.unknownCount, 1); // req_unknown_skill unknown (T5)

    // Verification of Truth Contract T5 & T6: cited evidence IDs, no arbitrary score
    const consensusAssessment = report.assessments.find((a) => a.requirementId === "req_consensus");
    assert.ok(consensusAssessment);
    assert.equal(consensusAssessment.state, "ESTABLISHED");
    assert.ok(consensusAssessment.citedEvidenceIds.includes("evi_raft_demo"));

    const unknownAssessment = report.assessments.find((a) => a.requirementId === "req_unknown_skill");
    assert.ok(unknownAssessment);
    assert.equal(unknownAssessment.state, "UNKNOWN");
    assert.ok(unknownAssessment.growthRecommendation?.includes("No verified evidence"));

    // Validation planner should be generated for the unresolved core requirement
    assert.ok(report.recommendedValidationPlan);
    assert.equal(report.recommendedValidationPlan.candidateId, testEmployeeId);
    assert.ok(!("score" in report), "Internal mobility report must not contain person-level scores");
  });

  it("attaches network project as evidence source at T1, elevates to T2 on code inspection, and guarantees 0 engagement weight", async () => {
    const personId = `student_net_${Date.now()}`;
    const postId = `post_collab_${Date.now()}`;

    // 1. Initial Attachment: strictly starts at T1
    const initialSource = await attachPostAsEvidenceSource({
      personId,
      postId,
      postTitle: "Two-Phase Commit Transaction Coordinator in Go",
      postContent: "Built a distributed 2PC coordinator with Raft election and gRPC transport.",
      projectUrl: "https://github.com/scholar/2pc-coordinator",
      tags: ["Go", "Distributed Systems", "Raft"],
      upvotes: 4820, // 4,820 likes/upvotes
      views: 19500,
    });

    assert.equal(initialSource.tier, "T1");
    assert.equal(initialSource.isInspected, false);

    // 2. Engagement Independence Verification: Upvotes have ZERO impact on tier
    const independence = verifyEngagementIndependence(initialSource);
    assert.equal(independence.engagementZeroImpactVerified, true);
    assert.equal(independence.tier, "T1");
    assert.equal(independence.upvotesCount, 4820);

    // 3. Inspection & Verification Upgrade: elevates to T2 only upon verifiable code inspection
    const verifiedSource = await inspectAndVerifyNetworkSource({
      sourceId: initialSource.id,
      inspectorId: "tech_evaluator_dr_brown",
      verifiedRepository: "https://github.com/scholar/2pc-coordinator",
      hasCommitsVerified: true,
      verificationNotes: "Inspected Go codebase, passing unit tests, and Raft consensus logs.",
    });

    assert.equal(verifiedSource.tier, "T2");
    assert.equal(verifiedSource.isInspected, true);
    assert.ok(verifiedSource.inspectionDetails);
    assert.equal(verifiedSource.inspectionDetails.hasCommitsVerified, true);
  });

  it("generates structured future role draft from business problem with core, trainable, evaluated requirements", () => {
    const draft = generateRoleDraftFromProblem({
      businessProblem: "Our event streaming pipeline experiences high latency under peak Kafka partition load.",
      targetHires: 2,
      department: "Data Platform",
    });

    assert.ok(draft.draftId);
    assert.ok(draft.proposedTitle.includes("Distributed Systems") || draft.proposedTitle.includes("Engineer"));
    assert.equal(draft.targetHires, 2);
    assert.equal(draft.department, "Data Platform");
    assert.ok(draft.requirements.length >= 4);

    const categories = draft.requirements.map((r) => r.category);
    assert.ok(categories.includes("core"));
    assert.ok(categories.includes("trainable"));
    assert.ok(categories.includes("evaluated"));
    assert.ok(categories.includes("context"));

    for (const req of draft.requirements) {
      assert.ok(req.text.length > 20);
      assert.ok(req.rationale.length > 10);
      assert.ok(req.suggestedValidationMethod);
    }
  });
});
