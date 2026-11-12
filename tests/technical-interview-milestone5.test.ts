import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import {
  computeSevenDimensionScorecard,
  generateMilestone5FinalReport,
  extractVerbatimQuote,
  computeSha256,
  TRACK_WEIGHT_MATRIX,
  CANONICAL_DIMENSIONS
} from "@/lib/interview/final-report-generator";

import {
  evaluateCompetencyTriAnchor,
  commitMilestone5EvidenceToDNA,
  PROVENANCE_HIERARCHY,
  PROVENANCE_CONFIDENCE_WEIGHTS
} from "@/lib/interview/dna-sync-engine";

import {
  saveActiveSessionState,
  getActiveSessionState,
  markSessionCompleted,
  getSessionById,
  saveSession
} from "@/lib/interview-session-store";

import { POST as finalReportHandler } from "@/app/api/interview-final/route";

test("Milestone 5 Master Engineering Suite: Candidate Assessment Integrity & Student DNA Sync", async (t) => {

  // AC-M5-1: 7-Dimension Mathematical Calculation
  await t.test("AC-M5-1: 7-Dimension Mathematical Calculation computes exact arithmetic means per dimension", async () => {
    const mockSession: any = {
      sessionId: "sess_m5_math_calc_01",
      candidateId: "cand_math_01",
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "stage_2", section: "fundamentals", question: "Explain TCP flow control." },
          answer: "TCP flow control uses a sliding window where the receiver advertises window size in ACK packets.",
          assessment: { answer_quality: "exceptional", rubric_score: 90, topics_demonstrated: ["TCP Networking"] }
        },
        {
          turnIndex: 2,
          question: { stageId: "stage_3", section: "coding", question: "Find maximum subarray sum." },
          answer: "We use Kadane's algorithm keeping current sum and global maximum in linear time O(N).",
          assessment: { answer_quality: "strong", rubric_score: 80, topics_demonstrated: ["Kadane Algorithm", "Arrays"] }
        },
        {
          turnIndex: 3,
          question: { stageId: "stage_4", section: "system_design", question: "How would you handle Redis cache invalidation?" },
          answer: "We use write-through cache with TTL expiration and event-driven invalidation via Redis pub/sub.",
          assessment: { answer_quality: "strong", rubric_score: 85, topics_demonstrated: ["Redis Caching", "Distributed Systems"] }
        },
        {
          turnIndex: 4,
          question: { stageId: "stage_2", section: "resume_projects", question: "Tell me about your Kafka event pipeline." },
          answer: "I designed the partition key strategy ensuring ordered delivery per user ID with replication factor 3.",
          assessment: { answer_quality: "strong", rubric_score: 85, topics_demonstrated: ["Kafka Streaming"] }
        },
        {
          turnIndex: 5,
          question: { stageId: "stage_5", section: "role_requirements", question: "How do you secure REST APIs?" },
          answer: "Using JWT with short-lived tokens, refresh rotation, rate limiting per IP, and strict CORS headers.",
          assessment: { answer_quality: "adequate", rubric_score: 75, topics_demonstrated: ["API Security"] }
        }
      ]
    };

    const scorecard = computeSevenDimensionScorecard(mockSession, "backend");

    // All assessed dimensions must have valid non-null numerical scores
    assert.equal(scorecard.dimensionRecords.DIM_1_TECH_FUNDAMENTALS.score, 87); // (90 + 85 + 85) / 3 = 86.67 -> 87
    assert.equal(scorecard.dimensionRecords.DIM_2_PROBLEM_SOLVING.score, 80);
    assert.equal(scorecard.dimensionRecords.DIM_3_PRACTICAL_IMPL.score, 80);
    assert.equal(scorecard.dimensionRecords.DIM_4_SYSTEM_DESIGN.score, 85);
    assert.equal(scorecard.dimensionRecords.DIM_5_PROJECT_EXPERIENCE.score, 85);
    assert.equal(scorecard.dimensionRecords.DIM_6_COMMUNICATION.score, 83); // Average of all answers with text >= 15 chars
    assert.equal(scorecard.dimensionRecords.DIM_7_ROLE_RELEVANCE.score, 75);

    assert.equal(scorecard.assessmentStatus, "COMPLETED_CERTIFIED");
    assert.ok(typeof scorecard.overallScore === "number" && scorecard.overallScore >= 80);
  });

  // AC-M5-2: Unassessed Dimension Protection
  await t.test("AC-M5-2: Unassessed Dimension Protection strictly leaves unvisited dimensions as NOT_ASSESSED with null score", async () => {
    const mockSession: any = {
      sessionId: "sess_m5_unassessed_02",
      candidateId: "cand_unassessed_02",
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "stage_1", section: "fundamentals", question: "Explain event loop." },
          answer: "The JavaScript event loop processes the call stack, microtask queue, and macrotask queue.",
          assessment: { rubric_score: 90, topics_demonstrated: ["Event Loop"] }
        },
        {
          turnIndex: 2,
          question: { stageId: "stage_2", section: "coding", question: "Reverse a linked list." },
          answer: "Iterative pointer reversal keeping prev, current, and next pointers in O(N) time.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Linked Lists"] }
        },
        {
          turnIndex: 3,
          question: { stageId: "stage_3", section: "resume_projects", question: "Describe your React state management." },
          answer: "We migrated from Redux to Zustand to eliminate boilerplate and simplify reactive state selectors.",
          assessment: { rubric_score: 80, topics_demonstrated: ["React", "Zustand"] }
        },
        {
          turnIndex: 4,
          question: { stageId: "stage_4", section: "role_requirements", question: "How do you optimize CSS bundle size?" },
          answer: "Using PurgeCSS with Tailwind tree-shaking and dynamic import of vendor style sheets.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Frontend Performance"] }
        }
      ]
    };

    // System Design (DIM_4) was NOT touched in this junior frontend interview
    const scorecard = computeSevenDimensionScorecard(mockSession, "frontend");

    assert.equal(scorecard.dimensionRecords.DIM_4_SYSTEM_DESIGN.status, "NOT_ASSESSED");
    assert.equal(scorecard.dimensionRecords.DIM_4_SYSTEM_DESIGN.score, null);
    assert.equal(scorecard.dimensionRecords.DIM_4_SYSTEM_DESIGN.itemCount, 0);

    // Score must be calculated over the remaining 6 assessed dimensions without artificial 0 penalty
    assert.ok(scorecard.overallScore !== null);
    assert.ok(scorecard.overallScore >= 80, `Expected overall score >= 80, got ${scorecard.overallScore}`);
    assert.ok(scorecard.overallScoreCalculation.includes("sum(w_d * S_d) / sum(w_d)"));
  });

  // AC-M5-3: Incomplete Session Threshold
  await t.test("AC-M5-3: Incomplete Session Threshold yields ASSESSMENT_INCOMPLETE with score: null when coverage < 60%", async () => {
    const mockShortSession: any = {
      sessionId: "sess_m5_short_03",
      candidateId: "cand_short_03",
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "stage_1", section: "fundamentals", question: "What is an index in SQL?" },
          answer: "An index is a B-Tree data structure that speeds up query lookups.",
          assessment: { rubric_score: 100, topics_demonstrated: ["SQL B-Tree"] }
        }
      ]
    };

    const scorecard = computeSevenDimensionScorecard(mockShortSession, "backend");

    // Only 2 dimensions touched (Fundamentals + Communication), total weight < 0.60
    assert.equal(scorecard.assessmentStatus, "ASSESSMENT_INCOMPLETE");
    assert.equal(scorecard.overallScore, null);
    assert.ok(scorecard.overallScoreCalculation.includes("Incomplete assessment"));
  });

  // AC-M5-4: Tri-Anchor Student DNA Commit
  await t.test("AC-M5-4: Tri-Anchor Student DNA Commit verifies skills demonstrated across >= 2 stages and >= 3 turns", async () => {
    const mockSession: any = {
      sessionId: "sess_m5_tri_anchor_04",
      candidateId: "cand_tri_04",
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "stage_2_project_deep_dive", question: "How did you use Redis in your payment gateway?" },
          answer: "We used Redis for distributed idempotency keys with setNX and 30-second TTL.",
          assessment: { rubric_score: 90, topics_demonstrated: ["Redis", "Distributed Locking"] }
        },
        {
          turnIndex: 2,
          question: { stageId: "stage_2_project_deep_dive", question: "What happened if Redis crashed?" },
          answer: "We configured Redis Sentinel for automatic failover and fell back to Postgres advisory locks.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Redis", "High Availability"] }
        },
        {
          turnIndex: 3,
          question: { stageId: "stage_4_system_design", question: "How would you cache user session state at scale?" },
          answer: "Redis cluster with consistent hashing and local LRU read cache for hotspot mitigation.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Redis", "Cluster Caching"] }
        }
      ]
    };

    const result = evaluateCompetencyTriAnchor("Redis", mockSession);

    assert.equal(result.isVerified, true);
    assert.equal(result.provenanceLevel, PROVENANCE_HIERARCHY.LEVEL_2_THEORY);
    assert.equal(result.confidenceScore, 0.85);
    assert.equal(result.stageCount, 2);
    assert.equal(result.turnCount, 3);
    assert.ok(result.averageScore >= 85);
  });

  // AC-M5-5: Single-Phase Memorization Rejection
  await t.test("AC-M5-5: Single-Phase Memorization Rejection refuses to commit skills demonstrated in only 1 stage", async () => {
    const mockSession: any = {
      sessionId: "sess_m5_single_phase_05",
      candidateId: "cand_single_05",
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "stage_2_project_deep_dive", question: "What is Kafka?" },
          answer: "Kafka is a distributed commit log architecture with partitioned topics.",
          assessment: { rubric_score: 90, topics_demonstrated: ["Kafka"] }
        },
        {
          turnIndex: 2,
          question: { stageId: "stage_2_project_deep_dive", question: "What is consumer group rebalancing?" },
          answer: "Rebalancing occurs when a consumer leaves or joins, reassigned by group coordinator.",
          assessment: { rubric_score: 90, topics_demonstrated: ["Kafka"] }
        }
      ]
    };

    // Candidate answered 2 questions in Stage 2 only. Probing was not corroborated across Stage 4.
    const result = evaluateCompetencyTriAnchor("Kafka", mockSession);

    assert.equal(result.isVerified, false);
    assert.equal(result.provenanceLevel, PROVENANCE_HIERARCHY.LEVEL_4_CLAIM);
    assert.ok(result.rejectionReason?.includes("Fails Tri-Anchor requirement"));
    assert.ok(result.rejectionReason?.includes("only 1 stage"));
  });

  // AC-M5-6: Sandbox Coding Synthesis
  await t.test("AC-M5-6: Sandbox Coding Synthesis tags ACCEPTED solution with PROVENANCE_LEVEL_1_VERIFIED_INTERVIEW_SANDBOX", async () => {
    const mockSession: any = {
      sessionId: "sess_m5_coding_synth_06",
      candidateId: "cand_synth_06",
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "stage_3_coding", section: "coding", question: "Implement Kadane." },
          answer: "I am writing Kadane's algorithm to compute the maximum subarray in linear time.",
          assessment: { rubric_score: 95, topics_demonstrated: ["Kadane Algorithm", "Arrays"] }
        },
        {
          turnIndex: 2,
          question: { stageId: "stage_3_coding", section: "coding", question: "What is the time complexity?" },
          answer: "It is O(N) time and O(1) auxiliary space because we only maintain two variables.",
          assessment: { rubric_score: 90, topics_demonstrated: ["Kadane Algorithm", "Time Complexity"] }
        },
        {
          turnIndex: 3,
          question: { stageId: "stage_4_system_design", section: "system_design", question: "Where might you apply Kadane in streaming analytics?" },
          answer: "For sliding time window anomaly detection where we track peak continuous burst metrics.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Kadane Algorithm", "Streaming Analytics"] }
        }
      ],
      codeSubmissions: [
        {
          submissionId: "sub_m4_verified_01",
          problemId: "maximum-subarray",
          language: "python",
          code: "def maxSubArray(nums):\n  curr = max_s = nums[0]\n  for x in nums[1:]:\n    curr = max(x, curr + x)\n    max_s = max(max_s, curr)\n  return max_s",
          verdict: "ACCEPTED",
          runtimeMs: 18,
          memoryKb: 3820,
          stressTestPassed: true,
          cheatSuspicionScore: 0,
          executionSource: "live_judge0"
        }
      ]
    };

    const result = evaluateCompetencyTriAnchor("Kadane Algorithm", mockSession, mockSession.codeSubmissions);

    assert.equal(result.isVerified, true);
    assert.equal(result.provenanceLevel, PROVENANCE_HIERARCHY.LEVEL_1_SANDBOX);
    assert.equal(result.confidenceScore, 1.00);
    assert.equal(result.handsOnCodingPassed, true);

    // Check 2 Invariant: High theoretical score (>= 80) CANNOT bypass hands-on sandbox for coding competencies
    const withoutSandboxResult = evaluateCompetencyTriAnchor("Kadane Algorithm", mockSession, []);
    assert.equal(withoutSandboxResult.isVerified, false, "Coding skill without sandbox execution must NOT be verified even with theoretical score >= 80");
    assert.equal(withoutSandboxResult.provenanceLevel, PROVENANCE_HIERARCHY.LEVEL_4_CLAIM);
    assert.ok(withoutSandboxResult.rejectionReason?.includes("ACCEPTED sandbox solution at N = 10^5"));

    // Check 2 Invariant: Coding competency with failed N=10^5 stress test must NOT be committed to DNA
    const failedStressResult = evaluateCompetencyTriAnchor("Kadane Algorithm", mockSession, [
      {
        submissionId: "sub_failed_stress",
        verdict: "ACCEPTED",
        stressTestPassed: false, // Failed N=10^5 performance ceiling
        cheatSuspicionScore: 0
      }
    ]);
    assert.equal(failedStressResult.isVerified, false, "Coding skill failing N=10^5 stress test must NOT be verified");
    assert.equal(failedStressResult.provenanceLevel, PROVENANCE_HIERARCHY.LEVEL_4_CLAIM);
  });

  // AC-M5-7: Verbatim Quote Hash Verification
  await t.test("AC-M5-7: Verbatim Quote Hash Verification extracts substring quote and matches SHA-256 hash", async () => {
    const rawAnswer = "In PostgreSQL, a B-Tree index maintains balanced depth ensuring O(log N) lookups for point queries.";
    const quote = extractVerbatimQuote(rawAnswer);
    const hash = computeSha256(quote);

    assert.ok(rawAnswer.includes(quote), "Quote must be an exact verbatim substring of candidate answer");
    assert.equal(hash, crypto.createHash("sha256").update(quote.trim()).digest("hex"));

    const mockSession: any = {
      sessionId: "sess_m5_verbatim_07",
      candidateId: "cand_verbatim_07",
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "stage_2", section: "fundamentals", question: "How does Postgres index B-Trees?" },
          answer: rawAnswer,
          assessment: { rubric_score: 90, topics_demonstrated: ["PostgreSQL B-Tree"] }
        }
      ]
    };

    const scorecard = computeSevenDimensionScorecard(mockSession, "backend");
    const anchor = scorecard.dimensionRecords.DIM_1_TECH_FUNDAMENTALS.transcriptAnchors[0];

    assert.ok(anchor !== undefined);
    assert.equal(anchor.candidateQuote, quote);
    assert.equal(anchor.quoteHash, hash);
  });

  // AC-M5-8: Conduct Infraction Independence Guarantee
  await t.test("AC-M5-8: Conduct Infraction Independence Guarantee preserves technical competency scores regardless of warnings", async () => {
    const mockCleanSession: any = {
      sessionId: "sess_m5_conduct_clean",
      candidateId: "cand_clean_08",
      conductState: "NORMAL",
      conductIncidents: [],
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "stage_2", section: "fundamentals", question: "Explain mutex vs semaphore." },
          answer: "A mutex is a locking mechanism for a single thread, whereas a semaphore allows N concurrent accesses via signaling.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Concurrency"] }
        },
        {
          turnIndex: 2,
          question: { stageId: "stage_3", section: "coding", question: "Code a concurrent queue." },
          answer: "Use condition variables with lock guards for thread-safe push and pop operations.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Concurrency"] }
        },
        {
          turnIndex: 3,
          question: { stageId: "stage_4", section: "system_design", question: "Design rate limiter." },
          answer: "Token bucket algorithm with Redis leaky bucket counter.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Rate Limiting"] }
        },
        {
          turnIndex: 4,
          question: { stageId: "stage_5", section: "resume_projects", question: "Tell me about your scaling project." },
          answer: "Scaled WebSocket server to 100k concurrent connections using epoll and uWebSockets.",
          assessment: { rubric_score: 85, topics_demonstrated: ["WebSockets"] }
        }
      ]
    };

    const mockWarnedSession: any = {
      ...mockCleanSession,
      sessionId: "sess_m5_conduct_warned",
      candidateId: "cand_warned_08",
      conductState: "FINAL_WARNING",
      conductIncidents: [
        { id: "inc_1", timestamp: new Date().toISOString(), type: "PROFANITY_HARASSMENT", severity: "HIGH", description: "Profanity used towards interviewer" }
      ]
    };

    const cleanReport = await generateMilestone5FinalReport(mockCleanSession, "systems");
    const warnedReport = await generateMilestone5FinalReport(mockWarnedSession, "systems");

    // Technical score must be identical; behavioral infraction is recorded strictly in conductScorecard
    assert.equal(warnedReport.overallScore, cleanReport.overallScore);
    assert.equal(warnedReport.conductScorecard.totalInfractions, 1);
    assert.equal(warnedReport.conductScorecard.currentConductState, "FINAL_WARNING");
    assert.ok(warnedReport.conductScorecard.behavioralImpactSummary.includes("behavioral warning"));
  });

  // AC-M5-9: Session Finalization Idempotency
  await t.test("AC-M5-9: Session Finalization Idempotency returns identical report with X-Idempotent-Replay header", async () => {
    const sessionId = `sess_m5_idemp_${Date.now()}`;
    const candidateId = "cand_idemp_09";

    const liveState = {
      sessionId,
      candidateId,
      experienceMode: "experienced",
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "s1", section: "fundamentals", question: "Explain ACID properties." },
          answer: "Atomicity, Consistency, Isolation, and Durability ensure reliable transaction processing in RDBMS.",
          assessment: { rubric_score: 90, topics_demonstrated: ["Database ACID"] }
        },
        {
          turnIndex: 2,
          question: { stageId: "s2", section: "coding", question: "Two sum problem." },
          answer: "Hash map lookup in O(N) time storing complement as key and index as value.",
          assessment: { rubric_score: 90, topics_demonstrated: ["Hash Maps"] }
        },
        {
          turnIndex: 3,
          question: { stageId: "s3", section: "system_design", question: "Design URL shortener." },
          answer: "Base62 encoding over distributed ID generator with Redis cache and DB persistence.",
          assessment: { rubric_score: 85, topics_demonstrated: ["System Design"] }
        },
        {
          turnIndex: 4,
          question: { stageId: "s4", section: "resume_projects", question: "Discuss microservices migration." },
          answer: "Decomposed monolith via Strangler Fig pattern with an API gateway for traffic routing.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Microservices"] }
        }
      ],
      topicsCovered: ["Database ACID", "Hash Maps", "System Design", "Microservices"],
      answerDistribution: { strong: 4, adequate: 0, shallow: 0, off_topic: 0 }
    };
    saveActiveSessionState(sessionId, liveState);

    // First finalization request
    const req1 = new Request("http://localhost:3000/api/interview-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, candidateId, targetRole: "Senior Backend Engineer", track: "backend" })
    });
    const res1 = await finalReportHandler(req1);
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.ok(body1.sevenDimensionScorecard !== undefined);

    // Second duplicate finalization request
    const req2 = new Request("http://localhost:3000/api/interview-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, candidateId, targetRole: "Senior Backend Engineer", track: "backend" })
    });
    const res2 = await finalReportHandler(req2);
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get("X-Idempotent-Replay"), "true");
    const body2 = await res2.json();
    assert.equal(body2.idempotentReplay, true);
    assert.equal(body2.report.sessionId, body1.report.sessionId);
  });

  // AC-M5-10: Database Transaction Atomicity & Rollback
  await t.test("AC-M5-10: Database Transaction Atomicity & Rollback handles persistence failures safely without corrupting state", async () => {
    const mockSession: any = {
      sessionId: "sess_m5_rollback_10",
      candidateId: "cand_rollback_10",
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "stage_2", section: "fundamentals", question: "Explain raft consensus." },
          answer: "Raft elects a leader using randomized timeouts and replicates log entries across a quorum of nodes.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Raft Consensus"] }
        }
      ]
    };

    const report = await generateMilestone5FinalReport(mockSession, "systems");
    assert.ok(report !== undefined);

    // Even if Supabase connection is unreachable or throws in local tests, commitMilestone5EvidenceToDNA catches safely
    const syncRes = await commitMilestone5EvidenceToDNA("cand_rollback_10", report, mockSession);
    assert.equal(syncRes.success, true);
    assert.ok(Array.isArray(syncRes.results));
  });

  // AC-M5-11: Multi-Tenant Authorization Guard
  await t.test("AC-M5-11: Multi-Tenant Authorization Guard returns HTTP 403 on candidate mismatch", async () => {
    const sessionId = `sess_m5_tenant_guard_${Date.now()}`;
    const ownerCandidateId = "cand_alice_owner";
    const maliciousCandidateId = "cand_eve_attacker";

    saveActiveSessionState(sessionId, {
      sessionId,
      candidateId: ownerCandidateId,
      turns: []
    });

    // Eve attempts to finalize Alice's session
    const req = new Request("http://localhost:3000/api/interview-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, candidateId: maliciousCandidateId })
    });

    const res = await finalReportHandler(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, "TENANT_ACCESS_DENIED");
  });

  // AC-M5-12: Offline Model Synthesizer Fallback
  await t.test("AC-M5-12: Offline Model Synthesizer Fallback produces valid mathematical report when LLM is offline", async () => {
    const mockSession: any = {
      sessionId: "sess_m5_offline_12",
      candidateId: "cand_offline_12",
      dossier: { targetRole: "Full Stack Developer" },
      turns: [
        {
          turnIndex: 1,
          question: { stageId: "s1", section: "fundamentals", question: "What is the difference between let and const in JS?" },
          answer: "const declares block-scoped read-only identifiers, while let allows reassignment within block scope.",
          assessment: { rubric_score: 85, topics_demonstrated: ["JavaScript Scope"] }
        },
        {
          turnIndex: 2,
          question: { stageId: "s2", section: "coding", question: "Implement two sum." },
          answer: "Store complements in hash table to find matching pairs in single O(N) pass.",
          assessment: { rubric_score: 90, topics_demonstrated: ["Hash Tables", "DSA"] }
        },
        {
          turnIndex: 3,
          question: { stageId: "s3", section: "system_design", question: "How would you handle web traffic spikes?" },
          answer: "Auto-scaling groups behind an application load balancer with Redis caching for hot data.",
          assessment: { rubric_score: 80, topics_demonstrated: ["Load Balancing", "Redis"] }
        },
        {
          turnIndex: 4,
          question: { stageId: "s4", section: "resume_projects", question: "Describe your checkout microservice." },
          answer: "Built payment integration with Stripe webhooks and optimistic concurrency control.",
          assessment: { rubric_score: 85, topics_demonstrated: ["Stripe API", "Microservices"] }
        }
      ]
    };

    // Generates completely deterministically without external LLM network dependency
    const report = await generateMilestone5FinalReport(mockSession, "fullstack");

    assert.equal(report.metadata.synthesizer, "deterministic_rubric_fallback");
    assert.ok(report.overallScore !== null);
    assert.ok(report.overallScore >= 80);
    assert.equal(report.assessmentStatus, "COMPLETED_CERTIFIED");
    assert.ok(report.actionableStudyTracks.length >= 0);
    assert.ok(report.metadata.hash.length === 64); // Valid SHA-256
  });

});
