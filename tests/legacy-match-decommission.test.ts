import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { POST, GET } from "../app/api/match/evaluate/route";

function createMockRequest(url: string, options: { method?: string; body?: any } = {}): Request {
  const method = options.method || "POST";
  const body = options.body !== undefined
    ? typeof options.body === "string"
      ? options.body
      : JSON.stringify(options.body)
    : undefined;

  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json"
    },
    body: method !== "GET" && method !== "HEAD" ? body : undefined
  });
}

describe("Remediation 1: Legacy Match Evaluation Endpoint Decommissioning", () => {
  let originalFetch: typeof global.fetch;
  let fetchCallCount = 0;
  let fetchCalls: any[] = [];

  beforeEach(() => {
    fetchCallCount = 0;
    fetchCalls = [];
    originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      fetchCallCount++;
      fetchCalls.push({ input, init });
      throw new Error(`Unexpected network call intercepted during test: ${String(input)}`);
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("1. Endpoint returns HTTP 410 Gone with safe, explanatory payload for POST requests", async () => {
    const req = createMockRequest("http://localhost/api/match/evaluate", {
      method: "POST",
      body: {
        candidateId: "cand-test-123",
        jdText: "Senior Go Distributed Systems Engineer with Raft consensus experience",
        resumeText: "Experienced backend engineer building high-throughput consensus systems in Go",
        targetYoe: 7
      }
    });

    const res = await POST(req as any);
    assert.strictEqual(res.status, 410);

    const body = await res.json();
    assert.strictEqual(body.status, 410);
    assert.strictEqual(body.error, "Gone");
    assert.ok(body.message.includes("decommissioned per Truth Contract T7"));
    assert.ok(body.message.includes("Policy A"));
  });

  test("2. Endpoint returns HTTP 410 Gone for GET requests", async () => {
    const res = await GET(new Request("http://localhost/api/match/evaluate"));
    assert.strictEqual(res.status, 410);

    const body = await res.json();
    assert.strictEqual(body.status, 410);
    assert.strictEqual(body.error, "Gone");
  });

  test("3. Arbitrary, malformed, empty, or malicious bodies cannot trigger legacy scoring", async () => {
    const malformedBodies = [
      "",
      "{}",
      "null",
      "not-even-json",
      { injection: "'; DROP TABLE evaluations; --" },
      { jdText: null, resumeText: 12345 },
      { candidateId: 999999, __proto__: { admin: true } }
    ];

    for (const testBody of malformedBodies) {
      const req = createMockRequest("http://localhost/api/match/evaluate", {
        method: "POST",
        body: testBody
      });

      const res = await POST(req as any);
      assert.strictEqual(res.status, 410);

      const data = await res.json();
      assert.strictEqual(data.status, 410);
      assert.strictEqual(data.error, "Gone");
    }
  });

  test("4. Zero LLM, provider, or external network calls are made during requests", async () => {
    const legacyPayload = {
      candidateId: "cand-active-test",
      jdText: "Looking for Senior AI Engineer with vector search and embeddings experience",
      resumeText: "Built enterprise vector retrieval platform using Qdrant and transformer embeddings",
      targetYoe: 6
    };

    const req = createMockRequest("http://localhost/api/match/evaluate", {
      method: "POST",
      body: legacyPayload
    });

    const res = await POST(req as any);
    assert.strictEqual(res.status, 410);

    // Verify global fetch was never called
    assert.strictEqual(fetchCallCount, 0, "No external HTTP/LLM calls should be made");
    assert.strictEqual(fetchCalls.length, 0);
  });

  test("5. Static audit: Route file completely eliminates Groq, Supabase, and Honeypot dependencies", () => {
    const routeFilePath = path.join(process.cwd(), "app/api/match/evaluate/route.ts");
    const routeSource = fs.readFileSync(routeFilePath, "utf-8");

    // Assert absence of all external providers and database modules
    assert.ok(!routeSource.includes("groqFetch"), "Route must not import groqFetch");
    assert.ok(!routeSource.includes("supabase"), "Route must not import supabase");
    assert.ok(!routeSource.includes("runHoneypotScan"), "Route must not import runHoneypotScan");
    assert.ok(!routeSource.includes("parseResume"), "Route must not import parseResume");
    assert.ok(!routeSource.includes("calculateExperienceScore"), "Route must not import calculateExperienceScore");
    assert.ok(!routeSource.includes("calculateTrajectoryScore"), "Route must not import calculateTrajectoryScore");
    assert.ok(!routeSource.includes("llama-3.3"), "Route must not reference any LLM model");
    assert.ok(!routeSource.includes("evaluations"), "Route must not query or write to evaluations table");
    assert.ok(!routeSource.includes("honeypot_scans"), "Route must not query or write to honeypot_scans table");
  });

  test("6. Response contains NO fabricated match scores, risk tiers, or hiring verdicts", async () => {
    const req = createMockRequest("http://localhost/api/match/evaluate", {
      method: "POST",
      body: {
        candidateId: "cand-test",
        jdText: "Staff Engineer",
        resumeText: "10 years backend experience"
      }
    });

    const res = await POST(req as any);
    const body = await res.json();

    // Verify absence of fabricated or hallucinatory scores and verdicts
    assert.strictEqual(body.scores, undefined, "Must not return scores object");
    assert.strictEqual(body.final_score, undefined, "Must not return final_score");
    assert.strictEqual(body.confidence_score, undefined, "Must not return confidence_score");
    assert.strictEqual(body.risk_score, undefined, "Must not return risk_score");
    assert.strictEqual(body.hiring_recommendation, undefined, "Must not return hiring_recommendation");
    assert.strictEqual(body.recruiter_reasoning, undefined, "Must not return recruiter_reasoning");
    assert.strictEqual(body.fraud_flags, undefined, "Must not return fraud_flags");

    // Verify no internal stack traces, env variables, or sensitive details are exposed
    assert.strictEqual(body.stack, undefined);
    assert.strictEqual(body.env, undefined);
  });
});

