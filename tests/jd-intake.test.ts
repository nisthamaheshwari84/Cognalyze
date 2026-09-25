import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { processJdIntake, analyzeOverRestrictiveness } from "../lib/roles/jd-intake";

describe("JD Intake & Requirement Extraction Engine (Phase 2)", () => {
  const sampleJd = `
Role: Senior Backend Infrastructure Engineer
Hires: 2

About the role:
We are building a planet-scale transactional ledger.

Minimum Qualifications:
- 5+ years of experience with Go or Rust in high-concurrency environments.
- Deep expertise in PostgreSQL schema design, indexing, and query tuning.
- Hands-on experience with Kubernetes microservice deployment and Helm charts.
- Demonstrated system design capability for distributed event-driven systems.

Preferred Qualifications:
- Experience with Redis caching architectures.
- Experience with Tailwind CSS or frontend dashboards.
- Prior experience with AWS S3 and DynamoDB.
`;

  it("extracts role title, target hires, and discrete requirements with exact verified spans", () => {
    const result = processJdIntake(sampleJd);

    assert.strictEqual(result.roleTitle, "Senior Backend Infrastructure Engineer");
    assert.strictEqual(result.hiresTarget, 2);
    assert.ok(result.requirements.length >= 4);

    // Verify every single requirement's span exists verbatim in the source JD
    for (const req of result.requirements) {
      assert.ok(req.jdSpan, `Requirement ${req.id} must have a jdSpan`);
      const snippetInSource = sampleJd.slice(req.jdSpan.startChar, req.jdSpan.endChar);
      assert.strictEqual(snippetInSource, req.jdSpan.rawSnippet);
      assert.ok(req.version === 1);
      assert.ok(req.status === "active");
    }
  });

  it("appropriately categorizes requirements into core, trainable, evaluated, and context", () => {
    const result = processJdIntake(sampleJd);

    const coreReqs = result.requirements.filter((r) => r.category === "core");
    const evaluatedReqs = result.requirements.filter((r) => r.category === "evaluated");
    const contextReqs = result.requirements.filter((r) => r.category === "context");

    // Core should include Go/Rust or Postgres
    assert.ok(coreReqs.some((r) => r.text.includes("Go") || r.text.includes("PostgreSQL")));

    // Evaluated should identify system design capability
    assert.ok(evaluatedReqs.some((r) => r.text.includes("system design")));

    // Context should identify Preferred items
    assert.ok(contextReqs.some((r) => r.text.includes("Redis") || r.text.includes("Tailwind") || r.text.includes("DynamoDB")));
  });

  it("JD Review Lens flags over-restrictive items and provides actionable suggestions", () => {
    const result = processJdIntake(sampleJd);
    const { reviewLens } = result;

    assert.ok(reviewLens.findings.length > 0);
    assert.ok(reviewLens.summary.includes("suitable for validation rather than automatic elimination"));

    // Find the system design finding
    const sysDesignFinding = reviewLens.findings.find((f) => f.requirementText.includes("Kubernetes") || f.requirementText.includes("system design"));
    assert.ok(sysDesignFinding, "Should flag tooling or system design requirement");
    assert.ok(sysDesignFinding.rationale.length > 20);
  });
});
