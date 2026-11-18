import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import {
  generateRoleDNASnapshot,
  getRoleDNASnapshot,
  refreshRoleDNASnapshotWithAudit,
  RoleDNASnapshot
} from "../lib/dna/recruiter-snapshot";
import {
  getAllCandidates,
  getCandidateById,
  addCandidate,
  MultiSourceCandidateProfile
} from "../lib/recruiter-store";
import { RoleDNA } from "../lib/ai/role-dna";

test("GATE 8: 1. Student DNA Leakage Verification - Recruiter Snapshot Route Purge", () => {
  const routePath = path.join(process.cwd(), "app/api/recruiter/candidates/[id]/dna-snapshot/route.ts");
  const routeContent = fs.readFileSync(routePath, "utf-8");

  // Verify zero import of getStudentDNAFull
  assert.equal(
    routeContent.includes("getStudentDNAFull"),
    false,
    "Recruiter snapshot route MUST NOT import or invoke getStudentDNAFull"
  );

  // Verify zero import of getStudentProfileByUserId
  assert.equal(
    routeContent.includes("getStudentProfileByUserId"),
    false,
    "Recruiter snapshot route MUST NOT import getStudentProfileByUserId"
  );

  // Verify candidate evaluation relies on candidate-submitted materials
  assert.ok(
    routeContent.includes("candidate.resumeText"),
    "Evaluation must pass candidate-submitted resume text"
  );
});

test("GATE 8: 2. Point-of-Application Snapshot Generation Without Student DNA", () => {
  const testCandidateId = `cand_portal_test_${Date.now()}`;
  const testRoleId = "role-sde-platform-test";

  const mockRole: RoleDNA = {
    id: testRoleId,
    title: "Senior Platform Engineer",
    department: "Cloud Infrastructure",
    seniority: "Senior",
    summary: "Architect and maintain high-throughput Kubernetes and PostgreSQL services.",
    tieredRequirements: [
      { id: "req-1", name: "Kubernetes cluster administration", tier: "Critical", description: "Must manage production clusters" },
      { id: "req-2", name: "PostgreSQL query optimization", tier: "Important", description: "Database performance indexing" },
      { id: "req-3", name: "Prometheus & Grafana observability", tier: "Preferred", description: "Metrics collection and dashboards" }
    ],
    structuredRequirements: [],
    weights: { technical: 0.7, experience: 0.2, behavioral: 0.1 },
    isComplete: true
  } as any;

  const mockCandidate = {
    id: testCandidateId,
    name: "Devon Vance",
    email: "devon@example.com",
    resumeText: `Devon Vance - Senior DevOps & Platform Engineer
Summary: 5 years experience scaling cloud services.
Projects:
- Core K8s Ingestion: Deployed Kubernetes clusters on AWS EKS with Terraform.
- Database Scale: Optimized PostgreSQL relational database indexes reducing latency by 45%.
Skills: Kubernetes, PostgreSQL, Prometheus, Docker, Linux.`,
    studentProjects: [
      {
        title: "Core K8s Ingestion",
        tech: ["Kubernetes", "Docker", "Go"],
        description: "Automated container orchestration and deployment"
      }
    ],
    githubData: {
      handle: "devon-vance",
      profileUrl: "https://github.com/devon-vance",
      verifiedReposCount: 14,
      repos: [
        {
          name: "k8s-operator",
          description: "Custom controller for Kubernetes deployment",
          languages: ["Go", "Kubernetes"],
          url: "https://github.com/devon-vance/k8s-operator"
        }
      ]
    }
  };

  // Generate snapshot strictly from candidate and role (dnaFull is undefined!)
  const snapshot = generateRoleDNASnapshot({
    studentId: testCandidateId,
    candidateName: mockCandidate.name,
    candidateEmail: mockCandidate.email,
    role: mockRole,
    resumeText: mockCandidate.resumeText,
    candidate: mockCandidate
  });

  assert.ok(snapshot, "Snapshot must be generated successfully without Student DNA");
  assert.equal(snapshot.studentId, testCandidateId);
  assert.equal(snapshot.roleId, testRoleId);
  assert.equal(snapshot.snapshotVersion, 1);
  assert.ok(snapshot.roleAlignmentScore !== undefined, "roleAlignmentScore must be populated");
  assert.ok(snapshot.roleAlignmentScore > 0, "roleAlignmentScore must reflect positive evidence");
});

test("GATE 8: 3. Recruiter UI Contract Conformance with CandidateEvidencePassportPage", () => {
  const testCandidateId = `cand_ui_test_${Date.now()}`;
  const testRoleId = "role-backend-ui-test";

  const mockRole: RoleDNA = {
    id: testRoleId,
    title: "Backend Engineer",
    department: "Backend",
    seniority: "Mid",
    summary: "Build RESTful microservices in Go and Redis.",
    tieredRequirements: [
      { id: "r1", name: "Go", tier: "Critical", description: "Golang microservices" },
      { id: "r2", name: "Redis", tier: "Important", description: "Distributed caching" }
    ],
    isComplete: true
  } as any;

  const mockCandidate = {
    id: testCandidateId,
    name: "Jordan Lee",
    email: "jordan@example.com",
    resumeText: "Experienced in Go microservices and Redis caching.",
    githubData: {
      handle: "jordan-lee",
      profileUrl: "https://github.com/jordan-lee",
      verifiedReposCount: 5,
      repos: [{ name: "go-cache-service", description: "Redis backed caching service", languages: ["Go"], url: "https://github.com/jordan/go-cache" }]
    }
  };

  const snapshot = generateRoleDNASnapshot({
    studentId: testCandidateId,
    candidateName: mockCandidate.name,
    candidateEmail: mockCandidate.email,
    role: mockRole,
    resumeText: mockCandidate.resumeText,
    candidate: mockCandidate
  });

  // Verify all fields accessed by app/recruiter/candidates/[id]/page.tsx
  assert.ok(typeof snapshot.id === "string", "id must be string");
  assert.ok(typeof snapshot.snapshotVersion === "number", "snapshotVersion must be number");
  assert.ok(typeof snapshot.createdAt === "string", "createdAt must be ISO string");
  assert.ok(typeof snapshot.studentDNAVersion === "string", "studentDNAVersion must be string");
  assert.ok(typeof snapshot.resumeRef === "string", "resumeRef must be string");
  assert.ok(typeof snapshot.roleAlignmentScore === "number", "roleAlignmentScore must be number");
  assert.ok(snapshot.assessmentConfidence !== undefined, "assessmentConfidence must be defined");
  assert.ok(typeof snapshot.evidenceCoverage === "number", "evidenceCoverage must be number");
  assert.ok(typeof snapshot.candidateSummary === "string", "candidateSummary must be string");

  // Verify requirementAssessments array and shape
  assert.ok(Array.isArray(snapshot.requirementAssessments), "requirementAssessments must be an array");
  assert.equal(snapshot.requirementAssessments.length, 2);
  const firstReq = snapshot.requirementAssessments[0];
  assert.ok(firstReq.requirementName, "requirementName must exist");
  assert.ok(firstReq.requirementType === "MUST_HAVE" || firstReq.requirementType === "PREFERRED", "requirementType must be MUST_HAVE or PREFERRED");
  assert.ok(firstReq.alignmentStatus, "alignmentStatus must exist");
  assert.ok(typeof firstReq.supportingEvidence === "string", "supportingEvidence must be string");
  assert.ok(firstReq.confidence, "confidence must exist");

  // Verify relevantDemonstratedSkills array and shape
  assert.ok(Array.isArray(snapshot.relevantDemonstratedSkills), "relevantDemonstratedSkills must be an array");
  assert.ok(snapshot.relevantDemonstratedSkills.length >= 1);
  const firstSkill = snapshot.relevantDemonstratedSkills[0];
  assert.ok(firstSkill.skillName, "skillName must exist");
  assert.ok(typeof firstSkill.demonstratedLevel === "number", "demonstratedLevel must be number");
  assert.ok(typeof firstSkill.evidenceCount === "number", "evidenceCount must be number");
  assert.ok(typeof firstSkill.verificationState === "string", "verificationState must be string");

  // Verify unverifiedClaims array and shape
  assert.ok(Array.isArray(snapshot.unverifiedClaims), "unverifiedClaims must be an array");
  for (const c of snapshot.unverifiedClaims) {
    if (typeof c === "object" && c !== null) {
      assert.ok("claim" in c && "source" in c && "status" in c, "unverified claims must have claim, source, status");
    }
  }

  // Verify missingOrUncertainRequirements array
  assert.ok(Array.isArray(snapshot.missingOrUncertainRequirements), "missingOrUncertainRequirements must be an array");

  // Verify refreshAuditHistory array
  assert.ok(Array.isArray(snapshot.refreshAuditHistory), "refreshAuditHistory must be an array");
  assert.equal(snapshot.refreshAuditHistory.length, 1);
  assert.equal(snapshot.refreshAuditHistory[0].version, 1);
  assert.ok(snapshot.refreshAuditHistory[0].reason, "reason must exist");
  assert.ok(snapshot.refreshAuditHistory[0].timestamp, "timestamp must exist");
});

test("GATE 8: 4. Point-in-Time Snapshot Immutability", () => {
  const testCandidateId = `cand_freeze_test_${Date.now()}`;
  const testRoleId = "role-security-eng";

  const mockRole: RoleDNA = {
    id: testRoleId,
    title: "Security Engineer",
    department: "Security",
    seniority: "Mid",
    summary: "AppSec and vulnerability scanning.",
    tieredRequirements: [
      { id: "r1", name: "OWASP Top 10", tier: "Critical", description: "Web security" }
    ],
    isComplete: true
  } as any;

  const mockCandidate = {
    id: testCandidateId,
    name: "Casey Stone",
    email: "casey@example.com",
    resumeText: "Basic knowledge of OWASP Top 10.",
    studentProjects: []
  };

  const initialSnapshot = generateRoleDNASnapshot({
    studentId: testCandidateId,
    candidateName: mockCandidate.name,
    candidateEmail: mockCandidate.email,
    role: mockRole,
    resumeText: mockCandidate.resumeText,
    candidate: mockCandidate
  });

  const storedSnapshot = getRoleDNASnapshot(testCandidateId, testRoleId);
  assert.ok(storedSnapshot, "Snapshot must be stored");
  assert.equal(storedSnapshot.snapshotVersion, 1);

  // Alter external candidate data
  mockCandidate.resumeText = "Senior AppSec engineer with 10 CVEs and expert OWASP mastery.";

  // Retrieve stored snapshot again: it must remain FROZEN
  const reloadedSnapshot = getRoleDNASnapshot(testCandidateId, testRoleId);
  assert.equal(reloadedSnapshot?.snapshotVersion, 1);
  assert.equal(reloadedSnapshot?.id, initialSnapshot.id);
  assert.equal(
    reloadedSnapshot?.roleAlignmentScore,
    initialSnapshot.roleAlignmentScore,
    "Frozen snapshot must NOT silently update on external data changes"
  );
});

test("GATE 8: 5. Controlled Recruiter Refresh Audit Trail Mechanism", () => {
  const testCandidateId = `cand_audit_test_${Date.now()}`;
  const testRoleId = "role-data-eng";

  const mockRole: RoleDNA = {
    id: testRoleId,
    title: "Data Engineer",
    department: "Data Platform",
    seniority: "Mid",
    summary: "Spark and Snowflake pipelines.",
    tieredRequirements: [
      { id: "r1", name: "Apache Spark", tier: "Critical", description: "Big data processing" }
    ],
    isComplete: true
  } as any;

  const mockCandidate = {
    id: testCandidateId,
    name: "Robin Banks",
    email: "robin@example.com",
    resumeText: "Spark ETL pipeline developer.",
    studentProjects: [{ title: "Spark Pipeline", tech: ["Spark", "Python"], description: "ETL" }]
  };

  const v1 = generateRoleDNASnapshot({
    studentId: testCandidateId,
    candidateName: mockCandidate.name,
    candidateEmail: mockCandidate.email,
    role: mockRole,
    resumeText: mockCandidate.resumeText,
    candidate: mockCandidate
  });

  assert.equal(v1.snapshotVersion, 1);
  assert.equal(v1.refreshAuditHistory?.length, 1);

  // Trigger controlled refresh
  const v2 = refreshRoleDNASnapshotWithAudit(
    v1,
    mockCandidate,
    "Candidate uploaded verified GitHub portfolio",
    "recruiter@acme.corp"
  );

  assert.equal(v2.snapshotVersion, 2, "Snapshot version must increment to 2");
  assert.equal(v2.refreshAuditHistory?.length, 2, "refreshAuditHistory must append new entry");
  assert.equal(v2.refreshAuditHistory?.[1].version, 2);
  assert.equal(v2.refreshAuditHistory?.[1].reason, "Candidate uploaded verified GitHub portfolio");
  assert.equal(v2.refreshAuditHistory?.[1].triggeredBy, "recruiter@acme.corp");

  // Verify legacy revisionHistory is also maintained
  assert.equal(v2.revisionHistory.length, 1);
  assert.equal(v2.revisionHistory[0].version, 1);
  assert.ok(v2.revisionHistory[0].reason.includes("Candidate uploaded verified GitHub portfolio"));
});

test("GATE 8: 6. Multi-Tenant Scoping and Candidate Pool Isolation", async () => {
  const orgA = "org-stripe-tech";
  const orgB = "org-databricks-inc";

  const candidateA: MultiSourceCandidateProfile = {
    id: `cand_tenant_a_${Date.now()}`,
    name: "Alice Stripe",
    email: "alice@example.com",
    appliedRoleId: "role-sde",
    appliedRoleTitle: "Software Engineer",
    sourceType: "bulk_upload",
    appliedAt: new Date().toISOString(),
    organizationId: orgA,
    resumeText: "Full stack engineer at Stripe",
    currentStage: "Applied"
  };

  const candidateB: MultiSourceCandidateProfile = {
    id: `cand_tenant_b_${Date.now()}`,
    name: "Bob Databricks",
    email: "bob@example.com",
    appliedRoleId: "role-sde",
    appliedRoleTitle: "Software Engineer",
    sourceType: "bulk_upload",
    appliedAt: new Date().toISOString(),
    organizationId: orgB,
    resumeText: "Spark and Delta Lake engineer at Databricks",
    currentStage: "Applied"
  };

  await addCandidate(candidateA);
  await addCandidate(candidateB);

  // Recruiter from orgA queries candidate pool
  const orgAPool = await getAllCandidates(orgA);
  assert.ok(orgAPool.some(c => c.id === candidateA.id), "Org A pool must contain Candidate A");
  assert.ok(!orgAPool.some(c => c.id === candidateB.id), "Org A pool must NOT contain Candidate B from Org B");

  // Recruiter from orgB queries candidate pool
  const orgBPool = await getAllCandidates(orgB);
  assert.ok(orgBPool.some(c => c.id === candidateB.id), "Org B pool must contain Candidate B");
  assert.ok(!orgBPool.some(c => c.id === candidateA.id), "Org B pool must NOT contain Candidate A from Org A");

  // Direct candidate query with tenant scoping
  const foundAInOrgA = await getCandidateById(candidateA.id, orgA);
  assert.ok(foundAInOrgA, "Candidate A must be accessible within Org A");

  const crossTenantQuery = await getCandidateById(candidateA.id, orgB);
  assert.equal(crossTenantQuery, null, "Cross-tenant query must return null preventing candidate leakage");
});
