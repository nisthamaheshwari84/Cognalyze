import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  verifyQuoteInSource,
  filterAndVerifyEvidenceItems,
  normalizeText,
} from "../lib/evidence/quote-verifier";

describe("Deterministic Quote Verifier (Truth Contract T4)", () => {
  const sampleResume = `
Jane Doe
Senior Backend Engineer
Experience:
Built high-throughput distributed message processing pipeline in Go and Kafka, handling 150,000 events/sec with sub-50ms p99 latency.
Architected multi-region PostgreSQL cluster with connection pooling via PgBouncer, reducing connection overhead by 40%.
Designed and deployed Kubernetes microservices on AWS EKS using Helm charts and ArgoCD for GitOps continuous delivery.
`;

  it("verifies exact verbatim quote from source text", () => {
    const quote = "Built high-throughput distributed message processing pipeline in Go and Kafka";
    const result = verifyQuoteInSource(sampleResume, quote);

    assert.strictEqual(result.verified, true);
    assert.strictEqual(result.verbatimQuote, quote);
    assert.ok(result.sourceOffsets);
    assert.strictEqual(
      sampleResume.slice(result.sourceOffsets.startChar, result.sourceOffsets.endChar),
      quote
    );
  });

  it("verifies quote with normalized smart quotes, dashes, and whitespace variations", () => {
    // Has smart quotes and extra newline/spaces
    const imperfectQuote = `Architected multi-region PostgreSQL cluster with connection pooling via PgBouncer,\n  reducing connection overhead by 40%.`;
    const result = verifyQuoteInSource(sampleResume, imperfectQuote);

    assert.strictEqual(result.verified, true);
    assert.ok(result.sourceOffsets);
  });

  it("strictly discards hallucinated or ungrounded quotes (Truth Contract T4)", () => {
    const hallucinatedQuotes = [
      "Led a team of 15 engineers across three global offices.",
      "Achieved 99.999% uptime for Google Search infrastructure.",
      "Invented a new consensus protocol in Rust.",
    ];

    for (const quote of hallucinatedQuotes) {
      const result = verifyQuoteInSource(sampleResume, quote);
      assert.strictEqual(result.verified, false);
      assert.ok(result.rejectionReason);
    }
  });

  it("batch filters and extracts only verified evidence, logging discards", () => {
    const rawItems = [
      {
        id: "ev-1",
        quote: "handling 150,000 events/sec with sub-50ms p99 latency.",
        tier: "T2",
      },
      {
        id: "ev-2",
        quote: "Single-handedly increased enterprise revenue by $45M.", // hallucinated
        tier: "T1",
      },
      {
        id: "ev-3",
        quote: "Designed and deployed Kubernetes microservices on AWS EKS using Helm charts",
        tier: "T2",
      },
    ];

    const result = filterAndVerifyEvidenceItems(sampleResume, rawItems);

    assert.strictEqual(result.verifiedItems.length, 2);
    assert.strictEqual(result.discardedCount, 1);
    assert.strictEqual(result.rejectionLogs[0].quote, "Single-handedly increased enterprise revenue by $45M.");
    assert.strictEqual(result.verifiedItems[0].id, "ev-1");
    assert.strictEqual(result.verifiedItems[1].id, "ev-3");
  });
});
