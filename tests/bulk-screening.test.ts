import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { processCandidateBatch, computeDedupeKey, calculateScreeningEstimate } from "../lib/screening/bulk-engine";
import { computePipelineStages, CandidatePipelineRecord } from "../lib/screening/pipeline-rules";
import { JdRequirement } from "../lib/roles/types";

describe("Bulk Screening, Hidden Talent, & Pipeline Rules (Phase 4)", () => {
  const roleReqs: JdRequirement[] = [
    {
      id: "req-go",
      text: "Go backend systems engineering with high throughput",
      category: "core",
      origin: "deterministic",
      status: "active",
      version: 1,
    },
    {
      id: "req-postgres",
      text: "PostgreSQL distributed query optimization",
      category: "core",
      origin: "deterministic",
      status: "active",
      version: 1,
    },
  ];

  it("Acceptance Check: Pipeline stage counts strictly equal direct candidate record counts", () => {
    const candidates: CandidatePipelineRecord[] = [
      { id: "c-1", fullName: "Alice", stage: "applicants" },
      { id: "c-2", fullName: "Bob", stage: "screened", hasUnresolvedConflict: true },
      { id: "c-3", fullName: "Charlie", stage: "deep_review", hasUnplannedCoreUnknown: true },
      { id: "c-4", fullName: "Dave", stage: "interview", hasPendingValidationReview: true },
      { id: "c-5", fullName: "Eve", stage: "finalists", hasPendingDecision: true },
      { id: "c-6", fullName: "Frank", stage: "hired" },
      { id: "c-7", fullName: "Grace", stage: "hired" },
    ];

    const stages = computePipelineStages(candidates, 2);

    // Verify stage counts equal direct array counts
    assert.strictEqual(stages.find((s) => s.stage === "open_role")?.count, 2);
    assert.strictEqual(stages.find((s) => s.stage === "applicants")?.count, 1);
    assert.strictEqual(stages.find((s) => s.stage === "screened")?.count, 1);
    assert.strictEqual(stages.find((s) => s.stage === "deep_review")?.count, 1);
    assert.strictEqual(stages.find((s) => s.stage === "interview")?.count, 1);
    assert.strictEqual(stages.find((s) => s.stage === "finalists")?.count, 1);
    assert.strictEqual(stages.find((s) => s.stage === "hired")?.count, 2);

    // Verify attention alerts
    const screenedStage = stages.find((s) => s.stage === "screened");
    assert.ok(screenedStage?.attentionLine.includes("conflicting evidence"));

    const deepReviewStage = stages.find((s) => s.stage === "deep_review");
    assert.ok(deepReviewStage?.attentionLine.includes("core requirements UNKNOWN with no validation plan"));

    const interviewStage = stages.find((s) => s.stage === "interview");
    assert.ok(interviewStage?.attentionLine.includes("awaiting rubric review"));
  });

  it("deduplicates resumes by normalized email and phone", () => {
    const key1 = computeDedupeKey("John.Doe@Example.com ", "+1 (555) 234-5678");
    const key2 = computeDedupeKey("john.doe@example.com");
    assert.strictEqual(key1, key2);

    const phoneKey1 = computeDedupeKey(undefined, "555-123-4567");
    const phoneKey2 = computeDedupeKey(undefined, "+1 555 123 4567");
    assert.strictEqual(phoneKey1, phoneKey2);
  });

  it("identifies Hidden Talent ('Potentially Overlooked') with verified T2 evidence outside baseline", () => {
    const batch = [
      // Candidate 1: Keyword stuffer without artifact links (scores high on naive keyword count)
      {
        id: "cand-stuffer",
        text: `
Stuffer Sam
sam@stuffer.test
Skills: Go Go Go backend systems engineering high throughput PostgreSQL PostgreSQL query optimization.
Experience:
- Reviewed internal documentation for database and backend systems.
`,
      },
      // Candidate 2: Under-the-radar builder with concise text but verified GitHub artifact
      {
        id: "cand-builder",
        text: `
Quiet Builder
builder@github.test
Experience:
- Developed high throughput Go backend systems engineering: github.com/builder/ledger-node
`,
      },
    ];

    const result = processCandidateBatch({
      rawResumes: batch,
      roleRequirements: roleReqs,
      reviewCapacity: 1, // Only review top 1 by baseline
    });

    assert.strictEqual(result.totalProcessed, 2);
    // Builder should be flagged as Potentially Overlooked if outside baseline shortlist
    const builderRow = result.rows.find((r) => r.candidateId === "cand-builder");
    assert.ok(builderRow);
    assert.strictEqual(builderRow.verifiedT2Count, 1);
    assert.strictEqual(builderRow.qualifyingCoreCount, 1);
  });

  it("enforces capacity cut with visible reason and counts remaining candidates", () => {
    const resumes = Array.from({ length: 6 }, (_, i) => ({
      id: `cand-${i + 1}`,
      text: `
Candidate ${i + 1}
cand${i + 1}@example.com
Experience:
- Engineer working on high throughput systems in Go: github.com/cand${i + 1}/repo
`,
    }));

    const result = processCandidateBatch({
      rawResumes: resumes,
      roleRequirements: roleReqs,
      reviewCapacity: 3, // Cut at 3
    });

    assert.strictEqual(result.withinCapacityCount, 3);
    assert.strictEqual(result.beyondCapacityCount, 3);
    assert.strictEqual(result.rows[0].isBeyondCapacityCut, false);
    assert.strictEqual(result.rows[2].isBeyondCapacityCut, false);
    assert.strictEqual(result.rows[3].isBeyondCapacityCut, true);
    assert.strictEqual(result.rows[5].isBeyondCapacityCut, true);
  });

  it("pre-run screening estimate calculates time and token cost deterministically", () => {
    const est = calculateScreeningEstimate(30);
    assert.strictEqual(est.estimatedCandidateCount, 30);
    assert.ok(est.estimatedDurationSeconds > 0);
    assert.ok(est.estimatedCostUsd > 0);
    assert.ok(est.throughputPerMinute > 0);
  });
});
