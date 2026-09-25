import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deriveRequirementState,
  EvidenceItemInput,
  ValidationResultInput,
} from "../lib/evidence/derive";

describe("Pure Requirement State Derivation (lib/evidence/derive.ts)", () => {
  const fixedNow = new Date("2026-09-20T00:00:00Z");

  it("Truth Contract T5: Zero evidence yields UNKNOWN, never negative", () => {
    const result = deriveRequirementState("req-k8s", [], [], { now: fixedNow });
    assert.strictEqual(result.state, "UNKNOWN");
    assert.strictEqual(result.qualifyingEvidenceCount, 0);
    assert.ok(result.explanation.includes("No qualifying evidence"));
  });

  it("Direct T2+ evidence establishes requirement", () => {
    const evidence: EvidenceItemInput[] = [
      {
        id: "ev-github-1",
        sourceId: "src-gh-repo",
        tier: "T2",
        coverage: "direct",
        relation: "supports",
        occurredAt: "2026-01-15T00:00:00Z", // 8 months ago
      },
    ];

    const result = deriveRequirementState("req-k8s", evidence, [], { now: fixedNow });
    assert.strictEqual(result.state, "ESTABLISHED");
    assert.strictEqual(result.qualifyingEvidenceCount, 1);
    assert.strictEqual(result.independentSourcesCount, 1);
  });

  it("Direct T1+ evidence from >= 2 independent sources establishes requirement", () => {
    const evidence: EvidenceItemInput[] = [
      {
        id: "ev-resume-1",
        sourceId: "src-resume-pdf",
        tier: "T1",
        coverage: "direct",
        relation: "supports",
      },
      {
        id: "ev-post-1",
        sourceId: "src-post-project",
        tier: "T1",
        coverage: "direct",
        relation: "supports",
      },
    ];

    const result = deriveRequirementState("req-postgres", evidence, [], { now: fixedNow });
    assert.strictEqual(result.state, "ESTABLISHED");
    assert.strictEqual(result.independentSourcesCount, 2);
  });

  it("Direct T1 from single source yields PARTIAL", () => {
    const evidence: EvidenceItemInput[] = [
      {
        id: "ev-resume-1",
        sourceId: "src-resume-pdf",
        tier: "T1",
        coverage: "direct",
        relation: "supports",
      },
    ];

    const result = deriveRequirementState("req-redis", evidence, [], { now: fixedNow });
    assert.strictEqual(result.state, "PARTIAL");
    assert.strictEqual(result.independentSourcesCount, 1);
  });

  it("Adjacent coverage yields PARTIAL with actionable explanation", () => {
    const evidence: EvidenceItemInput[] = [
      {
        id: "ev-adjacent-1",
        sourceId: "src-gh-repo",
        tier: "T2",
        coverage: "adjacent",
        relation: "adjacent_to",
      },
    ];

    const result = deriveRequirementState("req-kafka", evidence, [], { now: fixedNow });
    assert.strictEqual(result.state, "PARTIAL");
    assert.ok(result.explanation.includes("adjacent"));
  });

  it("T2+ evidence outside recency window (> 24 months) yields PARTIAL", () => {
    const evidence: EvidenceItemInput[] = [
      {
        id: "ev-old-gh",
        sourceId: "src-gh-repo",
        tier: "T2",
        coverage: "direct",
        relation: "supports",
        occurredAt: "2023-01-01T00:00:00Z", // ~44 months ago
      },
    ];

    const result = deriveRequirementState("req-docker", evidence, [], {
      now: fixedNow,
      recencyWindowMonths: 24,
    });
    assert.strictEqual(result.state, "PARTIAL");
    assert.ok(result.explanation.includes("recency window"));
  });

  it("Unresolved contradiction yields CONFLICTING", () => {
    const evidence: EvidenceItemInput[] = [
      {
        id: "ev-sup-1",
        sourceId: "src-resume",
        tier: "T1",
        coverage: "direct",
        relation: "supports",
      },
      {
        id: "ev-contra-1",
        sourceId: "src-interview",
        tier: "T4",
        coverage: "direct",
        relation: "contradicts",
        isConflictResolved: false,
      },
    ];

    const result = deriveRequirementState("req-distributed-systems", evidence, [], { now: fixedNow });
    assert.strictEqual(result.state, "CONFLICTING");
    assert.strictEqual(result.conflictingEvidenceIds.length, 1);
  });

  it("Failed structured validation yields NOT_ESTABLISHED_AFTER_VALIDATION", () => {
    const validation: ValidationResultInput[] = [
      {
        taskId: "task-oa-1",
        requirementId: "req-concurrency",
        tier: "T3",
        established: false,
        evaluatedAt: "2026-09-18T10:00:00Z",
        evaluatorNotes: "Race condition test cases failed.",
      },
    ];

    const result = deriveRequirementState("req-concurrency", [], validation, { now: fixedNow });
    assert.strictEqual(result.state, "NOT_ESTABLISHED_AFTER_VALIDATION");
    assert.strictEqual(result.hasValidationAttempt, true);
    assert.ok(result.explanation.includes("validation"));
  });

  it("Successful structured validation yields ESTABLISHED", () => {
    const validation: ValidationResultInput[] = [
      {
        taskId: "task-interview-1",
        requirementId: "req-system-design",
        tier: "T4",
        established: true,
        evaluatedAt: "2026-09-19T15:00:00Z",
      },
    ];

    const result = deriveRequirementState("req-system-design", [], validation, { now: fixedNow });
    assert.strictEqual(result.state, "ESTABLISHED");
    assert.strictEqual(result.hasValidationAttempt, true);
  });

  it("Recruiter waiver yields NOT_APPLICABLE", () => {
    const evidence: EvidenceItemInput[] = [
      {
        id: "ev-1",
        sourceId: "src-1",
        tier: "T2",
        coverage: "direct",
        relation: "supports",
      },
    ];

    const result = deriveRequirementState("req-legacy", evidence, [], {
      isDismissedByRecruiter: true,
      now: fixedNow,
    });
    assert.strictEqual(result.state, "NOT_APPLICABLE");
  });
});
