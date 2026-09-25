import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractStructuredRoleFromJd } from "../lib/roles/role-extractor";
import { compileTieredRequirementsFromStructured, StructuredRoleRequirement } from "../lib/ai/role-dna";

describe("Simple, Evidence-Grounded Role Creation (Feature 1)", () => {
  const sampleJd = `
Title: Senior Backend Engineer
Department: Platform Engineering
Openings: 2
Location: Bengaluru
Work Mode: Hybrid

About the Role:
We are seeking an engineer to architect high-scale microservices.

Requirements:
- 5+ years of hands-on backend development experience
- Designing and operating Kafka-based distributed systems
- Deep knowledge of backend concurrency and thread pools
- Bachelor's degree in Computer Science or equivalent practical experience

Preferred Qualifications:
- Experience with Kubernetes operator development and Helm automation
- Cloud technologies experience preferred
- Experience with modern frontend frameworks
`;

  it("extracts required, preferred, experience, and education with verbatim quote evidence", () => {
    const result = extractStructuredRoleFromJd(sampleJd);

    assert.equal(result.roleTitle, "Senior Backend Engineer");
    assert.equal(result.targetHires, 2);
    assert.equal(result.workMode, "Hybrid");

    // Check categories
    const reqs = result.requirements;
    const required = reqs.filter(r => r.category === "required");
    const preferred = reqs.filter(r => r.category === "preferred");
    const experience = reqs.filter(r => r.category === "experience");
    const education = reqs.filter(r => r.category === "education");

    assert.ok(required.length >= 2, "Should extract required items");
    assert.ok(preferred.length >= 2, "Should extract preferred items");
    assert.ok(experience.length >= 1, "Should extract experience items");
    assert.ok(education.length >= 1, "Should extract education items");

    // Verify all have verbatim quote evidence
    for (const r of reqs) {
      assert.ok(r.evidenceQuote.length > 5, "Every requirement must cite verbatim quote");
      assert.ok(sampleJd.includes(r.evidenceQuote), "Quote must exist in source text");
      assert.equal(r.source, "job_description");
    }
  });

  it("enforces non-assumption rule: does not convert generic cloud to AWS or frameworks to React", () => {
    const result = extractStructuredRoleFromJd(sampleJd);
    const names = result.requirements.map(r => r.name.toLowerCase());

    // Never hallucinate AWS, GCP, React
    assert.ok(!names.includes("aws"), "Must not invent AWS when not in JD");
    assert.ok(!names.includes("react"), "Must not invent React when not in JD");
    assert.ok(!names.includes("postgresql"), "Must not invent PostgreSQL when not in JD");
  });

  it("flags ambiguous terms with needsConfirmation: true and an actionable reason", () => {
    const result = extractStructuredRoleFromJd(sampleJd);
    const cloudReq = result.requirements.find(r => r.evidenceQuote.toLowerCase().includes("cloud technologies"));

    assert.ok(cloudReq, "Should find cloud technologies requirement");
    assert.equal(cloudReq?.needsConfirmation, true);
    assert.ok(cloudReq?.ambiguityReason?.includes("cloud platform"));
  });

  it("detects conflicting experience requirements across different sections", () => {
    const conflictingJd = `
Title: Backend Developer
Requirements:
- 2+ years of software development experience in Python

Qualifications:
- Minimum 5+ years of backend development experience
`;
    const result = extractStructuredRoleFromJd(conflictingJd);
    assert.ok(result.conflicts.length > 0, "Should detect conflict between 2+ years and 5+ years");
    assert.ok(result.conflicts[0].reason.includes("Conflicting experience"));
  });

  it("compiles tiered requirements in the background with normalized 100% weights for candidate screening", () => {
    const mockStructured: StructuredRoleRequirement[] = [
      {
        id: "req-1",
        name: "Kafka Distributed Systems",
        category: "required",
        evidenceQuote: "Designing and operating Kafka-based distributed systems",
        source: "job_description"
      },
      {
        id: "req-2",
        name: "5+ years backend development",
        category: "experience",
        evidenceQuote: "5+ years of backend development",
        source: "job_description"
      },
      {
        id: "req-3",
        name: "Kubernetes Operator",
        category: "preferred",
        evidenceQuote: "Experience with Kubernetes operator development",
        source: "job_description"
      },
      {
        id: "req-4",
        name: "OpenTelemetry Tracing",
        category: "preferred",
        evidenceQuote: "Manually added by recruiter",
        source: "recruiter_added"
      }
    ];

    const tiered = compileTieredRequirementsFromStructured(mockStructured);

    // Verify weights sum to 100%
    const totalWeight = tiered.reduce((sum, r) => sum + r.weightPct, 0);
    assert.equal(totalWeight, 100);

    // Verify critical dealbreaker allocation for required items
    const kafkaReq = tiered.find(r => r.name.includes("Kafka"));
    assert.equal(kafkaReq?.tier, "Critical");
    assert.equal(kafkaReq?.dealBreakerIfMissing, true);

    // Verify non-dealbreaker for preferred items
    const k8sReq = tiered.find(r => r.name.includes("Kubernetes"));
    assert.equal(k8sReq?.dealBreakerIfMissing, false);
  });
});
