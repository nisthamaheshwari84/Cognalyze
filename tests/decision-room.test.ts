import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDecisionRoomDossier,
  resolveSourceIdentity,
  inspectCandidateProjects
} from "../lib/decision-room/decision-engine";
import { RoleDNA, createDefaultRoleDNA } from "../lib/ai/role-dna";
import { MultiSourceCandidateProfile } from "../lib/recruiter-store";

describe("Decision Room Core Engine & Investigation Workspace", () => {
  const sampleRole: RoleDNA = {
    ...createDefaultRoleDNA("Senior Distributed Backend Engineer", "Core Infrastructure"),
    id: "role-test-backend",
    version: 1,
    tieredRequirements: [
      {
        id: "req-go",
        name: "Go (Golang)",
        tier: "Critical",
        category: "Technical",
        description: "Production experience building concurrent microservices in Go.",
        weightPct: 40,
        verificationMethod: "code_execution",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "github_commit"]
      },
      {
        id: "req-kafka",
        name: "Apache Kafka",
        tier: "Critical",
        category: "System Design",
        description: "Transactional outbox pattern and event streaming in Kafka.",
        weightPct: 35,
        verificationMethod: "work_sample",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "architecture_spec"]
      },
      {
        id: "req-k8s",
        name: "Kubernetes",
        tier: "Important",
        category: "System Design",
        description: "Production cluster management and deployment automation.",
        weightPct: 25,
        verificationMethod: "portfolio_audit",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["architecture_spec"]
      }
    ]
  };

  const sampleCandidate: MultiSourceCandidateProfile = {
    id: "cand-test-vikram",
    name: "Vikram Malhotra",
    email: "vikram.m@example.com",
    appliedRoleId: "role-test-backend",
    appliedRoleTitle: "Senior Distributed Backend Engineer",
    sourceType: "bulk_upload",
    appliedAt: "2026-09-12T08:30:00Z",
    currentStage: "In Decision Room",
    resumeText: `Vikram Malhotra
Senior Backend Engineer • 5 years experience
Experience:
- Staff Systems Engineer at CloudCore (2021 - 2026)
  Architected event streaming pipeline using Apache Kafka and transactional outbox.
  Built concurrent microservices in Go.
`,
    githubData: {
      handle: "vikramm-dev",
      profileUrl: "https://github.com/vikramm-dev",
      verifiedReposCount: 2,
      repos: [
        {
          name: "kafka-idempotent-outbox",
          description: "Production-ready transactional outbox pattern using PostgreSQL and Kafka in Go",
          languages: ["Go", "SQL"],
          url: "https://github.com/vikramm-dev/kafka-idempotent-outbox"
        }
      ]
    }
  };

  it("resolves direct candidate-provided handles to VERIFIED", () => {
    const res = resolveSourceIdentity(
      sampleCandidate,
      "PUBLIC_TECHNICAL_SOURCE",
      "vikramm-dev"
    );
    assert.equal(res.status, "VERIFIED");
    assert.ok(res.reason.includes("Directly linked by candidate"));
  });

  it("prevents automatic attachment of common names without matching signals (AMBIGUOUS)", () => {
    const commonCandidate: MultiSourceCandidateProfile = {
      ...sampleCandidate,
      name: "Rahul Sharma",
      email: "rahul.sharma@genericmail.com",
      githubData: undefined
    };

    const res = resolveSourceIdentity(
      commonCandidate,
      "PUBLIC_TECHNICAL_SOURCE",
      "rahul-coder"
    );

    // Rule 7: Never automatically attach ambiguous profiles by name alone
    assert.equal(res.status, "AMBIGUOUS");
    assert.ok(res.reason.includes("Multiple public profiles exist"));
  });

  it("inspects repositories for technical depth, tests, and AI-assistance counter-signals", () => {
    const projects = inspectCandidateProjects(sampleCandidate);
    assert.ok(projects.length > 0);

    const outboxProj = projects[0];
    assert.equal(outboxProj.name, "kafka-idempotent-outbox");
    
    // Check technology depth
    const kafkaTech = outboxProj.technologies.find(t => t.name === "Apache Kafka");
    assert.ok(kafkaTech);
    assert.equal(kafkaTech?.depth, "IMPLEMENTED");

    // Check tests & deployment evidence
    assert.ok(outboxProj.testSuiteEvidence?.hasTests);
    assert.ok(outboxProj.deploymentEvidence?.hasDocker);

    // Check balanced AI analysis
    assert.ok(outboxProj.aiAssistanceAnalysis.counterSignals.length > 0);
    assert.ok(!outboxProj.aiAssistanceAnalysis.summary.includes("100% AI"));
  });

  it("builds complete Decision Room dossier with What Cognalyze Knows ledger and verification tasks", () => {
    const dossier = buildDecisionRoomDossier(sampleCandidate, sampleRole);

    assert.equal(dossier.candidateName, "Vikram Malhotra");
    assert.equal(dossier.roleVersion, 1);

    // Check What Cognalyze Knows
    assert.ok(dossier.whatCognalyzeKnows.verified.length > 0);
    assert.ok(dossier.whatCognalyzeKnows.verified.some(v => v.includes("Go") || v.includes("Kafka")));

    // Absence of evidence is not proof of absence: Kubernetes is not found in repos
    const k8sMatch = dossier.requirementsMatch.find(m => m.requirementId === "req-k8s");
    assert.equal(k8sMatch?.evidenceState, "EVIDENCE_NOT_FOUND");
    assert.ok(!/unqualified/i.test(k8sMatch?.candidateEvidence || ""));

    // Verification task derived strictly from Kubernetes gap
    const k8sTask = dossier.verificationTasks.find(t => t.requirementId === "req-k8s");
    assert.ok(k8sTask);
    assert.ok(k8sTask?.whyNeeded.includes("Kubernetes"));
    assert.ok(k8sTask?.suggestedProbeQuestion.includes("Kubernetes"));
  });

  it("detects cross-source date discrepancies between claimed tenure and employment spans", () => {
    const candidateWithConflict: MultiSourceCandidateProfile = {
      ...sampleCandidate,
      resumeText: `
Alex Morgan
Summary: Over 12 years of professional backend engineering experience.
Experience:
- Software Engineer at StartCo (2023 - 2025)
  Wrote services in Go.
`
    };

    const dossier = buildDecisionRoomDossier(candidateWithConflict, sampleRole);
    assert.ok(dossier.whatCognalyzeKnows.conflicting.length > 0);
    assert.ok(dossier.whatCognalyzeKnows.conflicting[0].includes("Experience Duration"));
  });
});
