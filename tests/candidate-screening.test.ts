import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  screenCandidateAgainstRole,
  CandidateScreeningDossier
} from "../lib/screening/candidate-screening-engine";
import { processBatchCandidates } from "../lib/screening/batch-screener";
import { RoleDNA, createDefaultRoleDNA } from "../lib/ai/role-dna";

describe("Candidate Screening Engine (Feature 2)", () => {
  const baseRole = createDefaultRoleDNA("Senior Distributed Backend Engineer", "Core Infrastructure");
  const sampleRole: RoleDNA = {
    ...baseRole,
    id: "role-test-backend",
    version: 1,
    tieredRequirements: [
      {
        id: "req-go",
        name: "Go (Golang)",
        tier: "Critical",
        category: "Technical",
        description: "Production experience building concurrent microservices in Go (Golang).",
        weightPct: 40,
        verificationMethod: "code_execution",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code", "github_commit"]
      },
      {
        id: "req-postgres",
        name: "PostgreSQL",
        tier: "Critical",
        category: "Technical",
        description: "High-scale database tuning, connection pooling, and schema design in PostgreSQL.",
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
        description: "Experience deploying and configuring Kubernetes clusters with Helm.",
        weightPct: 25,
        verificationMethod: "portfolio_audit",
        dealBreakerIfMissing: false,
        acceptableProofTypes: ["architecture_spec"]
      }
    ]
  };

  it("evaluates direct evidence as SUPPORTED with verbatim quote provenance", () => {
    const candidateResume = `
Devon Chen
Email: devon@example.com
Experience:
- Senior Backend Engineer at CloudScale (2022 - 2026)
  Engineered high-throughput microservices in Go (Golang) handling 50k QPS.
  Tuned PostgreSQL database connection pools and created partitioning indexes.
  Managed Kubernetes deployments across multi-region clusters with Helm.
`;

    const dossier = screenCandidateAgainstRole(
      { id: "cand-devon", name: "Devon Chen", resumeText: candidateResume },
      sampleRole
    );

    assert.equal(dossier.candidateName, "Devon Chen");
    assert.equal(dossier.coverageCounts.totalAssessed, 3);

    const goAssessment = dossier.assessments.find(a => a.requirementId === "req-go");
    assert.ok(goAssessment);
    assert.equal(goAssessment?.evidenceState, "SUPPORTED");
    assert.ok(goAssessment?.candidateEvidence.includes("Go"));
    assert.ok(goAssessment?.whyChain.sourceSection.includes("Experience"));

    const pgAssessment = dossier.assessments.find(a => a.requirementId === "req-postgres");
    assert.equal(pgAssessment?.evidenceState, "SUPPORTED");

    assert.equal(dossier.overallCoverage, "STRONG EVIDENCE COVERAGE");
  });

  it("missing evidence is NEVER treated as proof of absence (no 'Candidate lacks X' or 'unqualified')", () => {
    const candidateResume = `
Alex Rivera
Frontend Engineer
Experience:
- React Developer at WebApp Inc (2023 - 2026)
  Developed user interfaces with React, Next.js, and Tailwind CSS.
`;

    const dossier = screenCandidateAgainstRole(
      { id: "cand-alex", name: "Alex Rivera", resumeText: candidateResume },
      sampleRole
    );

    const goAssessment = dossier.assessments.find(a => a.requirementId === "req-go");
    assert.equal(goAssessment?.evidenceState, "EVIDENCE_NOT_FOUND");
    
    // Non-negotiable rule: Must never say "Candidate lacks Go" or "Alex does not know Go"
    assert.ok(!/lacks/i.test(goAssessment?.candidateEvidence || ""));
    assert.ok(!/does not know/i.test(goAssessment?.candidateEvidence || ""));
    assert.ok(!/unqualified/i.test(goAssessment?.candidateEvidence || ""));
    assert.ok(goAssessment?.assessmentExplanation.includes("No Go (Golang) evidence was identified"));
  });

  it("technology Equivalence: MySQL does not satisfy PostgreSQL requirement", () => {
    const candidateResume = `
Samira Khan
Backend Developer
Experience:
- Backend Engineer at DataLink (2022 - 2026)
  Built services in Go.
  Managed database schemas and queries using MySQL 8.0 exclusively.
`;

    const dossier = screenCandidateAgainstRole(
      { id: "cand-samira", name: "Samira Khan", resumeText: candidateResume },
      sampleRole
    );

    const pgAssessment = dossier.assessments.find(a => a.requirementId === "req-postgres");
    // Since JD explicitly required PostgreSQL and candidate only lists MySQL
    assert.equal(pgAssessment?.evidenceState, "EVIDENCE_NOT_FOUND");
    assert.ok(pgAssessment?.assessmentExplanation.includes("does not establish PostgreSQL experience"));
  });

  it("detects contradictions in candidate resume dates", () => {
    const candidateResume = `
Jordan Lee
Senior Architect
Summary:
Over 10 years of professional distributed systems experience.
Experience:
- Junior Engineer at Starter Corp (2023 - 2025)
  Wrote basic Go utilities.
Education:
- B.S. in Computer Science (Graduated 2023)
`;

    const dossier = screenCandidateAgainstRole(
      { id: "cand-jordan", name: "Jordan Lee", resumeText: candidateResume },
      sampleRole
    );

    assert.ok(dossier.detectedContradictions.length > 0);
    assert.equal(dossier.detectedContradictions[0].topic, "Experience Duration Discrepancy");
  });

  it("batch Screener isolates unreadable files and detects duplicates", async () => {
    const batchInput = [
      {
        id: "b-1",
        name: "Devon Chen",
        email: "devon@example.com",
        rawText: "Senior Go engineer with PostgreSQL experience at CloudScale (2022-2026)."
      },
      {
        id: "b-2",
        name: "Devon Chen Duplicate",
        email: "devon@example.com", // duplicate email
        rawText: "Duplicate copy of Devon's resume."
      },
      {
        id: "b-3",
        name: "Corrupted Record",
        email: "corrupt@example.com",
        rawText: "" // empty text should be safely isolated
      }
    ];

    const result = await processBatchCandidates(batchInput, sampleRole);

    assert.equal(result.totalSubmitted, 3);
    assert.equal(result.successfullyAnalyzed, 1);
    assert.equal(result.duplicatesCount, 1);
    assert.equal(result.failedCount, 2);
    assert.ok(result.failedItems.some(f => f.reason === "empty_text"));
    assert.ok(result.failedItems.some(f => f.reason === "duplicate_detected"));
  });
});
