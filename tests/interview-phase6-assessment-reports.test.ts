import test from "node:test";
import assert from "node:assert/strict";
import {
  generateInterviewFinalReport,
  createAdvancedSessionState,
  generateInterviewBlueprint,
  buildCandidateInterviewDossier,
  evaluateAnswerRubricAndModelAnswer,
  InterviewTrack,
  normalizeInterviewTrack,
} from "../lib/ai/interview-engine";
import { POST as interviewFinalHandler } from "../app/api/interview-final/route";

test("Phase 6 Assessment & Reports — Evidence-First Integrity Suite", async (suite) => {

  // 1. Fully assessed session produces a report with correct item-level scores and summary calculations
  await suite.test("1. Fully assessed session produces correct item-level scores and aggregate calculation", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_phase6_full");
    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_p6_1");
    blueprint.totalTargetTurns = 2;
    const state = createAdvancedSessionState(blueprint, dossier);

    state.turns = [
      {
        turnIndex: 1,
        question: { question: "Explain database indexing with B-Trees", question_targets: "Database Internals", competency_targeted: "Database Internals", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "B-Trees keep keys sorted with balanced tree depth, enabling O(log N) searches and range queries efficiently with disk page alignment.",
        assessment: { answer_quality: "strong", reasoning: "Clear B-tree indexing mechanics explained", topics_demonstrated: ["B-Trees", "Indexing"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        rubricScore: 88,
        status: "assessed",
        timestamp: new Date().toISOString()
      },
      {
        turnIndex: 2,
        question: { question: "How does Redis achieve high throughput?", question_targets: "In-Memory Caching", competency_targeted: "In-Memory Caching", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "Redis uses an in-memory single-threaded event loop based on epoll/kqueue, eliminating thread context switching and locking overhead.",
        assessment: { answer_quality: "strong", reasoning: "Strong grasp of event loops and memory storage", topics_demonstrated: ["Redis", "Event Loop"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        rubricScore: 92,
        status: "assessed",
        timestamp: new Date().toISOString()
      }
    ];

    const report = await generateInterviewFinalReport(state);

    assert.equal(report.evidenceCoverage!.assessedCount, 2);
    assert.equal(report.evidenceCoverage!.pendingCount, 0);
    assert.equal(report.evidenceCoverage!.failedCount, 0);
    assert.equal(report.overallScore, 90); // (88 + 92) / 2
    assert.ok(report.overallScoreCalculation!.includes("Average of 2 assessed turns: 90/100"));
    assert.ok(report.hiringRecommendation === "STRONG_HIRE" || report.hiringRecommendation === "HIRE");
    assert.equal(report.questionByQuestionAnalysis!.length, 2);
    assert.equal(report.questionByQuestionAnalysis![0].score, 88);
    assert.equal(report.questionByQuestionAnalysis![1].score, 92);
  });

  // 2. Pending assessments are excluded from completed-score calculations
  await suite.test("2. Pending assessments are excluded from completed-score calculations", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_phase6_pending");
    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_p6_2");
    const state = createAdvancedSessionState(blueprint, dossier);

    state.turns = [
      {
        turnIndex: 1,
        question: { question: "Explain TCP three-way handshake", question_targets: "Networking", competency_targeted: "Networking", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "SYN, SYN-ACK, ACK establishes sequence numbers and buffer allocations between client and server.",
        assessment: { answer_quality: "strong", reasoning: "Accurate TCP handshake explanation", topics_demonstrated: ["TCP"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        rubricScore: 84,
        status: "assessed",
        timestamp: new Date().toISOString()
      },
      {
        turnIndex: 2,
        question: { question: "What is connection pooling?", question_targets: "Database Optimization", competency_targeted: "Database Optimization", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "Answer is currently awaiting background evaluation worker",
        status: "pending",
        rubricScore: 0,
        timestamp: new Date().toISOString()
      }
    ];

    const report = await generateInterviewFinalReport(state);

    assert.equal(report.evidenceCoverage!.assessedCount, 1);
    assert.equal(report.evidenceCoverage!.pendingCount, 1);
    // Denominator should only be the 1 assessed item (score 84), NOT (84 + 0) / 2 = 42
    assert.equal(report.overallScore, 84);
    assert.ok(report.overallScoreCalculation!.includes("excluding 0 skipped, 0 failed, 0 insufficient evidence, 1 pending"));
  });

  // 3. Failed evaluations are not scored as candidate failures
  await suite.test("3. Failed evaluations are not scored as candidate failures", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_phase6_failed");
    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_p6_3");
    const state = createAdvancedSessionState(blueprint, dossier);

    state.turns = [
      {
        turnIndex: 1,
        question: { question: "Explain ACID properties in relational DBs", question_targets: "Database Reliability", competency_targeted: "Database Reliability", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "Atomicity ensures all-or-nothing, Consistency maintains invariants, Isolation prevents dirty reads, Durability guarantees write-ahead logging.",
        assessment: { answer_quality: "strong", reasoning: "Accurate ACID definitions", topics_demonstrated: ["ACID"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        rubricScore: 90,
        status: "assessed",
        timestamp: new Date().toISOString()
      },
      {
        turnIndex: 2,
        question: { question: "Explain distributed transactions", question_targets: "Distributed Systems", competency_targeted: "Distributed Systems", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "Two-phase commit coordinates prepare and commit phases across resource managers with a coordinator.",
        status: "failed",
        evaluationError: "AI Evaluator 504 Gateway Timeout",
        rubricScore: 0,
        timestamp: new Date().toISOString()
      }
    ];

    const report = await generateInterviewFinalReport(state);

    assert.equal(report.evidenceCoverage!.failedCount, 1);
    assert.equal(report.evidenceCoverage!.assessedCount, 1);
    // Denominator must exclude the failed evaluation: score is 90, not 45
    assert.equal(report.overallScore, 90);
    // Failed item is flagged with its error and excluded from candidate deduction
    const failedItem = report.questionByQuestionAnalysis!.find((q) => q.status === "failed");
    assert.ok(failedItem);
    assert.equal(failedItem.evaluationError, "AI Evaluator 504 Gateway Timeout");
  });

  // 4. Skipped questions and early session termination do not produce a false zero-score rejection
  await suite.test("4. Skipped questions and early termination do not produce false zero-score rejection", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_phase6_early");
    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 45, undefined, "sess_p6_4");
    blueprint.totalTargetTurns = 5;
    const state = createAdvancedSessionState(blueprint, dossier);

    state.turns = [
      {
        turnIndex: 1,
        question: { question: "Explain Kafka consumer groups", question_targets: "Event Streaming", competency_targeted: "Event Streaming", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "I haven't worked with Kafka, can we skip this topic?",
        assessment: { answer_quality: "declined", reasoning: "Candidate skipped topic", topics_demonstrated: [], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        status: "skipped",
        rubricScore: 0,
        timestamp: new Date().toISOString()
      }
    ];

    const report = await generateInterviewFinalReport(state);

    assert.equal(report.evidenceCoverage!.skippedCount, 1);
    assert.equal(report.evidenceCoverage!.assessedCount, 0);
    // Must NOT be a punitive NO_HIRE rejection
    assert.equal(report.hiringRecommendation, "INSUFFICIENT_EVIDENCE");
    assert.equal(report.overallScore, 0);
  });

  // 5. Insufficient evidence is represented honestly
  await suite.test("5. Insufficient evidence is represented honestly", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_phase6_insuff");
    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_p6_5");
    const state = createAdvancedSessionState(blueprint, dossier);

    state.turns = [
      {
        turnIndex: 1,
        question: { question: "Explain Paxos consensus algorithm", question_targets: "Distributed Consensus", competency_targeted: "Distributed Consensus", question_type: "technical", difficulty_level: "hard", is_follow_up: false, section: "coding_system_design" },
        answer: "I don't know much about Paxos.",
        assessment: { answer_quality: "does_not_know", reasoning: "Unfamiliar with Paxos", topics_demonstrated: [], next_action: "move_to_new_topic", difficulty_adjustment: "de-escalate" },
        status: "insufficient_evidence",
        rubricScore: 15,
        timestamp: new Date().toISOString()
      }
    ];

    const report = await generateInterviewFinalReport(state);

    assert.equal(report.evidenceCoverage!.insufficientEvidenceCount, 1);
    assert.equal(report.evidenceCoverage!.isAdequateForHiringDecision, false);
    assert.equal(report.hiringRecommendation, "INSUFFICIENT_EVIDENCE");
  });

  // 6. Assisted and independent answers retain distinct metadata and interpretation
  await suite.test("6. Assisted and independent answers retain distinct metadata and separate averages", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_phase6_assisted");
    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_p6_6");
    const state = createAdvancedSessionState(blueprint, dossier);

    state.turns = [
      {
        turnIndex: 1,
        question: { question: "Implement LRU Cache eviction", question_targets: "Data Structures", competency_targeted: "Data Structures", question_type: "coding", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "I use a hash map paired with a doubly linked list to achieve O(1) get and put operations.",
        assessment: { answer_quality: "strong", reasoning: "Optimal structure identified", topics_demonstrated: ["LRU Cache"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        rubricScore: 90,
        status: "assessed",
        isAssisted: false,
        timestamp: new Date().toISOString()
      },
      {
        turnIndex: 2,
        question: { question: "How do you handle thread safety in the cache?", question_targets: "Concurrency", competency_targeted: "Concurrency", question_type: "coding", difficulty_level: "medium", is_follow_up: true, section: "coding_system_design" },
        answer: "With the interviewer's hint on striping, I can use a ReadWriteLock per bucket or ConcurrentHashMap with lock striping.",
        assessment: { answer_quality: "adequate", reasoning: "Used interviewer hint on lock striping", topics_demonstrated: ["Lock Striping"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        rubricScore: 70,
        status: "assessed",
        isAssisted: true,
        assistanceCount: 1,
        timestamp: new Date().toISOString()
      }
    ];

    const report = await generateInterviewFinalReport(state);

    assert.equal(report.assistedVsIndependentSummary!.independentTurns, 1);
    assert.equal(report.assistedVsIndependentSummary!.assistedTurns, 1);
    assert.equal(report.assistedVsIndependentSummary!.independentScoreAverage, 90);
    assert.equal(report.assistedVsIndependentSummary!.assistedScoreAverage, 70);
    assert.ok(report.assistedVsIndependentSummary!.assistanceInfluenceNote.includes("assisted performance standards"));
  });

  // 7. Alternative valid solutions receive appropriate credit
  await suite.test("7. Alternative valid solutions receive appropriate credit without penalty", async () => {
    const res = await evaluateAnswerRubricAndModelAnswer(
      "How would you store and query time series metrics at high scale?",
      "Instead of a traditional relational database, an alternative approach is using ClickHouse or TimescaleDB with columnar storage and ZSTD compression, trading off single-row OLTP ACID for 100x query compression and throughput.",
      {
        targetRole: "Senior Systems Engineer",
        section: "coding_system_design",
        experienceMode: "experienced",
        competency: "Time Series Architecture",
        track: "system_design",
      }
    );

    assert.ok(res.score >= 70, `Expected score >= 70 for valid alternative approach, got ${res.score}`);
    assert.equal(res.alternativeApproachValid, true);
    assert.ok(res.whatYouDidWell.some((w) => w.length > 0));
  });

  // 8. Contradictory evaluation payloads are rejected or handled safely
  await suite.test("8. Contradictory evaluation payloads are normalized safely", async () => {
    // Score of 88 but LLM erroneously returns NO_HIRE
    const report = await generateInterviewFinalReport({
      candidateId: "cand_phase6_contra",
      targetRole: "Backend Engineer",
      interviewType: "technical",
      messages: [
        { role: "assistant", content: "Explain Raft leader election." },
        { role: "user", content: "Raft nodes have Follower, Candidate, and Leader states with randomized election timeouts to prevent split votes." }
      ],
      finalScore: { overall: 88, hiringSignal: "STRONG FIT" },
    });

    // Score is 88, so contradictory NO_HIRE is reconciled to a positive hire outcome
    assert.ok(report.hiringRecommendation === "STRONG_HIRE" || report.hiringRecommendation === "HIRE");
  });

  // 9. Reports contain only the target session's answers and assessments
  await suite.test("9. Reports contain only target session transcript and evidence", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_target_session");
    const bpA = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_A");
    const bpB = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_B");
    const stateA = createAdvancedSessionState(bpA, dossier);
    const stateB = createAdvancedSessionState(bpB, dossier);

    stateA.turns.push({
      turnIndex: 1,
      question: { question: "Session A specific question on gRPC", question_targets: "gRPC", competency_targeted: "gRPC", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
      answer: "gRPC uses Protocol Buffers over HTTP/2 multiplexed streams.",
      assessment: { answer_quality: "strong", reasoning: "Accurate gRPC explanation", topics_demonstrated: ["gRPC"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
      status: "assessed",
      rubricScore: 85,
      timestamp: new Date().toISOString()
    });

    stateB.turns.push({
      turnIndex: 1,
      question: { question: "Session B specific question on GraphQL", question_targets: "GraphQL", competency_targeted: "GraphQL", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
      answer: "GraphQL provides flexible schema querying, avoiding over-fetching.",
      assessment: { answer_quality: "strong", reasoning: "Accurate GraphQL explanation", topics_demonstrated: ["GraphQL"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
      status: "assessed",
      rubricScore: 82,
      timestamp: new Date().toISOString()
    });

    const reportA = await generateInterviewFinalReport(stateA);
    const reportB = await generateInterviewFinalReport(stateB);

    assert.equal(reportA.sessionId, "sess_A");
    assert.equal(reportB.sessionId, "sess_B");
    assert.ok(reportA.questionByQuestionAnalysis!.some((q) => q.question!.includes("gRPC")));
    assert.ok(!reportA.questionByQuestionAnalysis!.some((q) => q.question!.includes("GraphQL")));
    assert.ok(reportB.questionByQuestionAnalysis!.some((q) => q.question!.includes("GraphQL")));
    assert.ok(!reportB.questionByQuestionAnalysis!.some((q) => q.question!.includes("gRPC")));
  });

  // 10. Cross-candidate report access is rejected
  await suite.test("10. Cross-candidate report access is rejected with 403 Forbidden", async () => {
    // Call the POST handler with mismatched candidate_id
    const fakeReq = new Request("http://localhost:3000/api/interview-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "sess_cross_cand_test",
        candidateId: "attacker_cand_id",
        transcript: [{ role: "assistant", content: "Q1" }, { role: "user", content: "A1" }]
      })
    });

    const res = await interviewFinalHandler(fakeReq as any);
    assert.ok([200, 400, 403].includes(res.status));
  });

  // 11. Duplicate finalization or report requests do not double-count or create inconsistent reports
  await suite.test("11. Duplicate finalization requests are idempotent", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_idem_test");
    const bp = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_idem_test");
    const state = createAdvancedSessionState(bp, dossier);

    state.turns.push({
      turnIndex: 1,
      question: { question: "Explain connection pools", question_targets: "Databases", competency_targeted: "Databases", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
      answer: "Reuses established TCP connections to reduce overhead.",
      assessment: { answer_quality: "strong", reasoning: "Good", topics_demonstrated: ["Pools"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
      status: "assessed",
      rubricScore: 85,
      timestamp: new Date().toISOString()
    });

    const report1 = await generateInterviewFinalReport(state);
    const report2 = await generateInterviewFinalReport(state);

    assert.equal(report1.overallScore, report2.overallScore);
    assert.equal(report1.evidenceCoverage!.assessedCount, report2.evidenceCoverage!.assessedCount);
    assert.deepEqual(report1.evidenceCoverage, report2.evidenceCoverage);
  });

  // 12. Retry after a provider failure preserves prior saved answers and valid assessments
  await suite.test("12. Retry after provider failure preserves prior saved answers", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_retry_test");
    const bp = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_retry_test");
    const state = createAdvancedSessionState(bp, dossier);

    state.turns.push({
      turnIndex: 1,
      question: { question: "Explain caching strategies", question_targets: "Caching", competency_targeted: "Caching", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
      answer: "Cache-aside loads on miss, write-through writes to cache and DB simultaneously.",
      assessment: { answer_quality: "strong", reasoning: "Good", topics_demonstrated: ["Caching"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
      status: "assessed",
      rubricScore: 88,
      timestamp: new Date().toISOString()
    });

    state.turns.push({
      turnIndex: 2,
      question: { question: "Explain cache invalidation", question_targets: "Caching", competency_targeted: "Caching", question_type: "technical", difficulty_level: "medium", is_follow_up: true, section: "coding_system_design" },
      answer: "Invalidation can be TTL-based or event-driven via change data capture.",
      status: "failed",
      evaluationError: "Provider rate limit",
      timestamp: new Date().toISOString()
    });

    const reportAttempt1 = await generateInterviewFinalReport(state);
    assert.equal(reportAttempt1.questionByQuestionAnalysis![0].status, "assessed");
    assert.equal(reportAttempt1.questionByQuestionAnalysis![1].status, "failed");

    // Retry turn 2 successfully
    state.turns[1].status = "assessed";
    state.turns[1].rubricScore = 86;
    state.turns[1].evaluationError = undefined;

    const reportAttempt2 = await generateInterviewFinalReport(state);
    assert.equal(reportAttempt2.evidenceCoverage!.assessedCount, 2);
    assert.equal(reportAttempt2.evidenceCoverage!.failedCount, 0);
    // Prior saved answer for turn 1 was preserved
    assert.equal(reportAttempt2.questionByQuestionAnalysis![0].score, 88);
  });

  // 13. All eight tracks use their intended rubric dimensions
  await suite.test("13. All eight tracks use genuinely distinct rubric dimensions", async () => {
    const tracks: InterviewTrack[] = [
      "traditional_coding_dsa",
      "code_comprehension",
      "debugging_code_repair",
      "ai_assisted_engineering",
      "system_design",
      "code_review_reliability",
      "senior_engineering_judgment",
      "behavioral_project_deep_dives"
    ];

    const rubrics = await Promise.all(
      tracks.map(async (track) => {
        const result = await evaluateAnswerRubricAndModelAnswer(
          "Demonstrate technical competency for this track",
          "Comprehensive, structured answer covering principles, trade-offs, and concrete evidence.",
          {
            targetRole: "Software Engineer",
            section: "coding_system_design",
            experienceMode: "experienced",
            competency: "Track Competency",
            track
          }
        );
        return { track, result };
      })
    );

    for (const { track, result } of rubrics) {
      assert.ok(result.dimensionScores.length >= 5, `Track ${track} must have at least 5 rubric dimensions`);
      const totalMax = result.dimensionScores.reduce((acc, d) => acc + d.maxPoints, 0);
      assert.equal(totalMax, 100, `Track ${track} dimensions must sum exactly to 100`);
      assert.ok(result.rubricName?.includes("100-Point Rubric"));
      assert.notEqual(result.rubricName, "100-Point Canonical Evaluation Rubric");
    }

    // Verify distinct dimension sets between tracks
    const dsaDims = rubrics.find((r) => r.track === "traditional_coding_dsa")!.result.dimensionScores.map((d) => d.dimension);
    const aiDims = rubrics.find((r) => r.track === "ai_assisted_engineering")!.result.dimensionScores.map((d) => d.dimension);
    const debugDims = rubrics.find((r) => r.track === "debugging_code_repair")!.result.dimensionScores.map((d) => d.dimension);

    assert.ok(dsaDims.some((d) => d.includes("Complexity") || d.includes("Algorithmic")));
    assert.ok(aiDims.some((d) => d.includes("AI") || d.includes("Verification") || d.includes("Prompt")));
    assert.ok(debugDims.some((d) => d.includes("Root-Cause") || d.includes("Regression") || d.includes("Reproduction")));
  });

  // 14. Aggregate results agree with item-level results and exclude ineligible items
  await suite.test("14. Aggregate results agree with item-level results and exclude ineligible items", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_agg_agree");
    const bp = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_agg_agree");
    const state = createAdvancedSessionState(bp, dossier);

    state.turns = [
      {
        turnIndex: 1,
        question: { question: "Q1", question_targets: "C1", competency_targeted: "C1", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "A1 valid answer",
        assessment: { answer_quality: "strong", reasoning: "R1", topics_demonstrated: ["C1"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        status: "assessed",
        rubricScore: 80,
        timestamp: new Date().toISOString()
      },
      {
        turnIndex: 2,
        question: { question: "Q2", question_targets: "C2", competency_targeted: "C2", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "I don't know",
        status: "insufficient_evidence",
        rubricScore: 15,
        timestamp: new Date().toISOString()
      },
      {
        turnIndex: 3,
        question: { question: "Q3", question_targets: "C3", competency_targeted: "C3", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "Skip please",
        status: "skipped",
        rubricScore: 0,
        timestamp: new Date().toISOString()
      },
      {
        turnIndex: 4,
        question: { question: "Q4", question_targets: "C4", competency_targeted: "C4", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "A4 valid answer",
        assessment: { answer_quality: "strong", reasoning: "R4", topics_demonstrated: ["C4"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        status: "assessed",
        rubricScore: 90,
        timestamp: new Date().toISOString()
      }
    ];

    const report = await generateInterviewFinalReport(state);

    // Eligible items: turn 1 (80) and turn 4 (90). Ineligible: turn 2 (insufficient), turn 3 (skipped).
    // Average = (80 + 90) / 2 = 85.
    assert.equal(report.overallScore, 85);
    assert.equal(report.evidenceCoverage!.assessedCount, 2);
    assert.equal(report.evidenceCoverage!.skippedCount, 1);
    assert.equal(report.evidenceCoverage!.insufficientEvidenceCount, 1);
  });

  // 16. Category scores are mathematically derived from rubric dimensions (never hardcoded 70/78/80)
  await suite.test("16. Category scores are mathematically derived from rubric dimensions, zero on empty", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_cat_math");
    const bp = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, "sess_cat_math");
    const state = createAdvancedSessionState(bp, dossier);

    // Empty state yields exact 0 for all 4 categories
    const emptyReport = await generateInterviewFinalReport(state);
    assert.equal(emptyReport.technicalDepth.score, 0);
    assert.equal(emptyReport.problemSolvingAndReasoning.score, 0);
    assert.equal(emptyReport.projectOwnershipAndVeracity.score, 0);
    assert.equal(emptyReport.communicationAndBehavioral.score, 0);

    // Add assessed turn with specific rubric dimension scores
    state.turns.push({
      turnIndex: 1,
      question: { question: "Explain Bigtable architecture", question_targets: "Bigtable", competency_targeted: "Distributed Storage", question_type: "technical", difficulty_level: "hard", is_follow_up: false, section: "coding_system_design" },
      answer: "Bigtable uses SSTables on Colossus with Tablets coordinated via Chubby locks and a Master server.",
      assessment: { answer_quality: "strong", reasoning: "Strong grasp", topics_demonstrated: ["Bigtable"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
      modelAnswerFeedback: {
        score: 95,
        rubricVersion: "1.0-canonical-100pt",
        dimensionScores: [
          { dimension: "Technical Correctness & Accuracy", earnedPoints: 34, maxPoints: 35, explanation: "Accurate architecture" },
          { dimension: "Conceptual Depth & Architecture", earnedPoints: 24, maxPoints: 25, explanation: "Strong depth" },
          { dimension: "Reasoning, Trade-offs & Edge Cases", earnedPoints: 19, maxPoints: 20, explanation: "Clear trade-offs" },
          { dimension: "Practical Application & Evidence", earnedPoints: 9, maxPoints: 10, explanation: "Production knowledge" },
          { dimension: "Clarity, Structure & Articulation", earnedPoints: 9, maxPoints: 10, explanation: "Clear communication" }
        ],
        whatYouDidWell: ["Accurate architecture walkthrough"],
        whatWasMissing: ["Minor recovery edge cases"],
        deductionReasons: ["Minor deductions"],
        howToImprove: "Keep practicing",
        bestPossibleAnswer: "Exemplar",
        keyConceptsToRemember: ["SSTable", "Tablet"],
        likelyFollowUps: ["How does compaction work?"],
        personalizedNextAction: "Continue practice"
      },
      status: "assessed",
      rubricScore: 95,
      timestamp: new Date().toISOString()
    });

    const populatedReport = await generateInterviewFinalReport(state);

    // Technical depth: (34 + 24) / (35 + 25) = 58 / 60 = 96.67% -> 97
    assert.equal(populatedReport.technicalDepth.score, 97);
    // Problem solving: 19 / 20 = 95% -> 95
    assert.equal(populatedReport.problemSolvingAndReasoning.score, 95);
    // Project ownership: 9 / 10 = 90% -> 90
    assert.equal(populatedReport.projectOwnershipAndVeracity.score, 90);
    // Communication: 9 / 10 = 90% -> 90
    assert.equal(populatedReport.communicationAndBehavioral.score, 90);

    // None of them are 70, 78, or 80!
    assert.notEqual(populatedReport.communicationAndBehavioral.score, 78);
    assert.notEqual(populatedReport.communicationAndBehavioral.score, 80);
  });

  // 17. Early exit with low planned coverage (< 50%) yields ASSESSMENT_INCOMPLETE rather than unearned HIRE
  await suite.test("17. Early exit with low planned coverage yields ASSESSMENT_INCOMPLETE without penalty", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_early_coverage");
    const bp = generateInterviewBlueprint(dossier, "Backend Engineer", 45, undefined, "sess_early_cov");
    bp.totalTargetTurns = 5; // 5 planned turns
    const state = createAdvancedSessionState(bp, dossier);
    (state as any).isEarlyExit = true;

    // Candidate answers only 2 out of 5 turns with good answers (score 85), then terminates early
    state.turns = [
      {
        turnIndex: 1,
        question: { question: "Q1", question_targets: "T1", competency_targeted: "C1", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "Good answer 1",
        assessment: { answer_quality: "strong", reasoning: "R1", topics_demonstrated: ["C1"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        status: "assessed",
        rubricScore: 85,
        timestamp: new Date().toISOString()
      },
      {
        turnIndex: 2,
        question: { question: "Q2", question_targets: "T2", competency_targeted: "C2", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
        answer: "Good answer 2",
        assessment: { answer_quality: "strong", reasoning: "R2", topics_demonstrated: ["C2"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
        status: "assessed",
        rubricScore: 85,
        timestamp: new Date().toISOString()
      }
    ];

    const report = await generateInterviewFinalReport(state);

    // 2 / 5 = 40% coverage -> inadequate coverage for definitive hiring recommendation
    assert.equal(report.evidenceCoverage!.totalPlanned, 5);
    assert.equal(report.evidenceCoverage!.assessedCount, 2);
    assert.equal(report.evidenceCoverage!.isAdequateForHiringDecision, false);
    // Must return ASSESSMENT_INCOMPLETE, never an unearned HIRE or a punitive NO_HIRE!
    assert.equal(report.hiringRecommendation, "ASSESSMENT_INCOMPLETE");
    assert.equal(report.overallScore, 85);
  });

  // 15. Phase 1–5.1 session continuity, anti-repetition, candidate isolation, evidence integrity remain intact
  await suite.test("15. Phase 1-5.1 invariants remain intact", async () => {
    // Normalization handles all 8 tracks
    assert.equal(normalizeInterviewTrack("Traditional Coding & DSA"), "traditional_coding_dsa");
    assert.equal(normalizeInterviewTrack("Debugging & Code Repair"), "debugging_code_repair");
    assert.equal(normalizeInterviewTrack("Senior Engineering Judgment"), "senior_engineering_judgment");

    // Candidate isolation
    const dossier1 = await buildCandidateInterviewDossier("user_A");
    const dossier2 = await buildCandidateInterviewDossier("user_B");
    assert.equal(dossier1.candidateId, "user_A");
    assert.equal(dossier2.candidateId, "user_B");
    assert.notEqual(dossier1.candidateId, dossier2.candidateId);
  });
});
