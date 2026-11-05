import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { POST as analyzeJdRoute } from "@/app/api/recruiter/analyze-jd/route";
import { GET as getWorkforceSignalsRoute, POST as postWorkforceSignalsRoute } from "@/app/api/workforce/signals/route";
import { GET as getRolesRoute, POST as postRolesRoute } from "@/app/api/recruiter/roles/route";
import { extractSemanticRoleFromJd } from "@/lib/roles/role-extractor";
import {
  saveRole,
  getRoleById,
  approveRole,
  getRoleVersions,
  createRoleVersionSnapshot,
} from "@/lib/recruiter-store";
import {
  classifyIndiaImpact,
  getAllMarketSignals,
  getMarketSignalsForRole,
  getWorkforceSummary,
  generateRoleEvolutionProposals,
  reviewEvolutionProposal,
} from "@/lib/workforce/workforce-intelligence-engine";
import { RoleDNA } from "@/lib/ai/role-dna";
import { NextRequest } from "next/server";

describe("ROLE DNA INTELLIGENCE & WORKFORCE ENGINE MASTER TEST SUITE", () => {
  // ─────────────────────────────────────────────────────────────
  // 1. SECURITY & ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────
  test("1. Security: Unauthenticated JD analysis request is strictly rejected with 401", async () => {
    const unauthenticatedReq = new NextRequest("http://localhost:3000/api/recruiter/analyze-jd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jdText: "Senior Backend Engineer with Go and Distributed Systems experience.",
      }),
    });

    const res = await analyzeJdRoute(unauthenticatedReq);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Unauthorized|Recruiter session required/i);
  });

  test("2. Security: Unauthenticated workforce signals request is rejected with 401", async () => {
    const unauthenticatedReq = new NextRequest("http://localhost:3000/api/workforce/signals", {
      method: "GET",
    });

    const res = await getWorkforceSignalsRoute(unauthenticatedReq);
    assert.equal(res.status, 401);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. SEMANTIC ROLE DNA & RESPONSIBILITY-TO-CAPABILITY GRAPH
  // ─────────────────────────────────────────────────────────────
  test("3. Semantic JD Parser: Builds Responsibility Graph with ownership, complexity, and connected capabilities", async () => {
    const sampleJd = `
    Role: Principal Distributed Systems Engineer
    Department: Core Infrastructure
    About the Role:
    We are looking for a Principal Engineer to architect and scale our real-time transaction clearing pipeline.
    
    Responsibilities:
    - Architect a high-throughput event streaming engine handling 15,000 TPS with zero transaction loss.
    - Own the disaster recovery, active-active multi-region database failover, and PostgreSQL MVCC tuning.
    - Lead cross-functional incident post-mortems and enforce circuit breakers and distributed tracing.
    
    Requirements:
    - 6+ years of production experience in Go, C++, or Rust building distributed services.
    - Deep expertise in Apache Kafka partition strategies, consumer lag monitoring, and idempotent producers.
    - Mastery of PostgreSQL concurrency primitives, row-level locking, and distributed deadlocks.
    - Strong understanding of Docker, Kubernetes, and Linux network namespaces.
    
    Nice to Have:
    - Experience with Raft consensus algorithms and distributed state machines.
    - Contributions to high-concurrency open-source projects.
    
    Education:
    - Bachelor's or Master's in Computer Science or equivalent engineering experience.
    `;

    const extracted = await extractSemanticRoleFromJd(sampleJd, "Principal Distributed Systems Engineer");

    assert.ok(extracted.roleDna);
    const roleDna = extracted.roleDna!;

    // Verify Must Haves & Preferred
    assert.ok(roleDna.mustHaves.length > 0);
    assert.ok(roleDna.mustHaves.some((m) => /go|kafka|postgres|concurrency/i.test(m.canonical_name)));

    // Verify Responsibility-to-Capability Graph
    assert.ok(roleDna.responsibilityGraph);
    assert.ok(roleDna.responsibilityGraph!.length > 0);

    const firstNode = roleDna.responsibilityGraph![0];
    assert.ok(["architect", "lead", "own", "assist"].includes(firstNode.ownershipLevel));
    assert.ok(["mission_critical", "advanced", "intermediate", "foundational"].includes(firstNode.complexity));
    assert.ok(firstNode.requiredCapabilities.length > 0);

    const cap = firstNode.requiredCapabilities[0];
    assert.ok(cap.canonicalName);
    assert.ok(["independent_architecture", "expert_optimization", "practical_implementation", "awareness"].includes(cap.requiredDepth));
    assert.ok(["work_sample", "system_design", "debugging", "code_execution", "targeted_interview"].includes(cap.assessmentMethod));
    assert.ok(firstNode.expectedOutcomes.length > 0);
  });

  test("4. Adaptive Recruiter Questions: Generates calibrated context questions", async () => {
    const sampleJd = `
    Role: Fullstack Engineer
    Requirements:
    - Modern web frameworks, databases, and APIs.
    - 3+ years experience.
    `;

    const extracted = await extractSemanticRoleFromJd(sampleJd, "Fullstack Engineer");
    assert.ok(extracted.roleDna?.adaptiveQuestions);
    const questions = extracted.roleDna!.adaptiveQuestions!;

    assert.ok(questions.length > 0);
    assert.ok(questions.some((q) => q.category === "business_problem"));
    assert.ok(questions.every((q) => q.contextWhy && q.contextWhy.length > 5));
    assert.ok(questions.every((q) => q.suggestedAnswers && q.suggestedAnswers.length > 0));
  });

  // ─────────────────────────────────────────────────────────────
  // 3. ROLE VERSIONING VAULT & HUMAN APPROVAL
  // ─────────────────────────────────────────────────────────────
  test("5. Role Versioning Vault: Records immutable point-in-time snapshots upon creation and approval", async () => {
    const testRoleId = `role-test-version-${Date.now()}`;
    const testRole: RoleDNA = {
      id: testRoleId,
      title: "Senior Cloud Architect",
      department: "Cloud Engineering",
      seniority: "Senior",
      targetHires: 2,
      businessOutcomes: [],
      tieredRequirements: [],
      structuredRequirements: [
        {
          id: "req-1",
          name: "Terraform Infrastructure as Code",
          category: "required",
          evidenceQuote: "Production Terraform modules",
          source: "job_description",
          semanticCategory: "MUST_HAVE",
        },
      ],
      responsibilityGraph: [
        {
          id: "resp-1",
          description: "Architect multi-cloud landing zones",
          ownershipLevel: "architect",
          complexity: "advanced",
          requiredCapabilities: [
            {
              capabilityId: "cap-tf",
              canonicalName: "Terraform",
              requiredDepth: "independent_architecture",
              assessmentMethod: "system_design",
              importance: "mandatory",
              evidenceSignals: ["GitHub modules"],
            },
          ],
          expectedOutcomes: ["Automated cloud provisioning"],
          sourceText: "Architect multi-cloud landing zones",
        },
      ],
      uncertaintyThreshold: 0.2,
      status: "draft",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save initial draft
    const saved = await saveRole(testRole, "Initial role draft creation");
    assert.equal(saved.id, testRoleId);
    assert.equal(saved.version, 1);

    // Verify initial version snapshot in vault
    const initialVersions = await getRoleVersions(testRoleId);
    assert.ok(initialVersions.length >= 1);
    assert.equal(initialVersions[0].version, 1);
    assert.equal(initialVersions[0].title, "Senior Cloud Architect");

    // Recruiter Human Approval & Version Bump
    const approvedResult = await approveRole(
      testRoleId,
      {
        approvedBy: "recruiter-lead-123",
        approverRole: "Principal Technical Recruiter",
        approvalStatus: "approved",
        approvalNotes: "Verified with Cloud Infrastructure Director.",
      },
      "Official recruiter sign-off on cloud competencies"
    );

    assert.ok(approvedResult !== null);
    assert.equal(approvedResult!.role.version, 2);
    assert.equal(approvedResult!.role.status, "active");
    assert.equal(approvedResult!.role.approvalRecord?.approvedBy, "recruiter-lead-123");
    assert.equal(approvedResult!.version.version, 2);

    // Verify version history retrieval
    const updatedVersions = await getRoleVersions(testRoleId);
    assert.ok(updatedVersions.length >= 2);
    assert.equal(updatedVersions[0].version, 2);
    assert.equal(updatedVersions[0].approvalRecord?.approvalStatus, "approved");
  });

  // ─────────────────────────────────────────────────────────────
  // 4. GLOBAL WORKFORCE INTELLIGENCE & INDIA-FIRST IMPACT
  // ─────────────────────────────────────────────────────────────
  test("6. Workforce Intelligence: Classifies India impact according to strict evidence hierarchy", () => {
    // 1. Confirmed India GCC impact
    const confirmedSignal = classifyIndiaImpact({
      companyName: "Microsoft",
      country: "Global / India",
      indiaImpactStatus: "confirmed_india_impact",
      indiaImpactDetails: "Confirmed expansion of Bengaluru and Hyderabad IDC centers for Azure AI infrastructure.",
      sourceUrls: ["https://example.com/msft-surge"],
      headcountAffected: 2500,
    });
    assert.equal(confirmedSignal.status, "confirmed_india_impact");

    // 2. Reported local impact with media sources
    const reportedSignal = classifyIndiaImpact({
      companyName: "Cisco Systems",
      country: "Global",
      indiaImpactDetails: "Trade press reports Bengaluru engineering centers re-skilling into SASE cybersecurity.",
      sourceUrls: ["https://example.com/cisco-report"],
      headcountAffected: 500,
    });
    assert.equal(reportedSignal.status, "reported_india_impact");

    // 3. Potential indirect impact (major GCC operating firm with global restructuring)
    const potentialSignal = classifyIndiaImpact({
      companyName: "Google",
      country: "Global",
      indiaImpactDetails: "Global core team reorganization in Mountain View.",
      sourceUrls: ["https://example.com/google-reorg"],
    });
    assert.equal(potentialSignal.status, "potential_india_impact");

    // 4. No established impact (purely localized overseas event)
    const noImpactSignal = classifyIndiaImpact({
      companyName: "UK Local Retail Ltd",
      country: "United Kingdom",
      indiaImpactDetails: "Store staff restructuring across London branches.",
      sourceUrls: ["https://example.com/uk-retail"],
    });
    assert.equal(noImpactSignal.status, "no_established_india_impact");
  });

  test("7. Workforce Intelligence: Retrieves verified signals and workforce summary", async () => {
    const allSignals = await getAllMarketSignals();
    assert.ok(allSignals.length > 0);
    assert.ok(allSignals.some((s) => s.companyName === "Microsoft"));
    assert.ok(allSignals.some((s) => s.companyName === "JPMorgan Chase"));

    const summary = await getWorkforceSummary();
    assert.ok(summary.totalSignals > 0);
    assert.ok(summary.indiaImpactBreakdown.confirmed > 0);
    assert.ok(summary.surgingSkills.length > 0);
    assert.ok(summary.gccExpansionHighlights.length > 0);
  });

  test("8. Role Evolution Proposals: Generates capability suggestions and enforces human approval gate", async () => {
    const testRoleId = `role-backend-test-eval-${Date.now()}`;
    const sampleBackendRole: RoleDNA = {
      id: testRoleId,
      title: "Backend Concurrency Engineer",
      department: "Platform",
      seniority: "Senior",
      targetHires: 1,
      businessOutcomes: [],
      tieredRequirements: [
        {
          id: "req-b-1",
          name: "REST APIs with Python",
          tier: "Critical",
          category: "Technical",
          description: "Building basic APIs",
          weightPct: 100,
          verificationMethod: "work_sample",
          dealBreakerIfMissing: true,
          acceptableProofTypes: ["production_code"],
        },
      ],
      structuredRequirements: [
        {
          id: "req-s-1",
          name: "REST APIs with Python",
          category: "required",
          evidenceQuote: "Python REST APIs",
          source: "job_description",
          semanticCategory: "MUST_HAVE",
        },
      ],
      uncertaintyThreshold: 0.2,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Generate proposals
    const proposals = await generateRoleEvolutionProposals(sampleBackendRole);
    assert.ok(proposals.length > 0);

    const firstProp = proposals[0];
    assert.equal(firstProp.status, "pending_approval");
    assert.ok(firstProp.marketRationale);
    assert.ok(firstProp.proposedChange);

    // Human Gate: Recruiter reviews and approves proposal
    const reviewed = await reviewEvolutionProposal(firstProp.id, "approved", "recruiter-human-approver");
    assert.ok(reviewed !== null);
    assert.equal(reviewed!.status, "approved");
    assert.equal(reviewed!.reviewedBy, "recruiter-human-approver");
    assert.ok(reviewed!.reviewedAt);
  });
});


