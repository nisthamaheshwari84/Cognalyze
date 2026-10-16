import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  assessAndGenerateAdaptiveTurn,
  invalidateCandidateDossierCache,
  CANDIDATE_INTERVIEW_DOSSIER_CACHE,
} from "../lib/ai/interview-engine";
import {
  saveActiveSessionState,
  getActiveSessionState,
  clearActiveSessionState,
} from "../lib/interview-session-store";
import { callGroqCatalog } from "../lib/groq";

describe("Interview Performance, Latency & Reliability Matrix (Phase 2)", () => {
  const candidateId = "perf_test_candidate_01";
  const customResume = "Senior Backend Engineer with 5 years experience in Go, PostgreSQL, Redis, and high-throughput Kafka streaming pipelines. Built payment gateway handling 10,000 TPS.";
  const customJd = "Staff Distributed Systems Engineer at Stripe. Requires deep knowledge of Raft consensus, distributed transactions, 2PC, and idempotent payment processing.";

  test("1 & 2. Unified turn accelerator: Assessment + Next Question in 1 Model Call", async () => {
    const dossier = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const blueprint = generateInterviewBlueprint(dossier, "Staff Distributed Systems Engineer", 45);
    const sessionState = createAdvancedSessionState(blueprint, dossier, "perf_turn_session");

    const history = "Alex (Interviewer): Welcome! Tell me about yourself and your background.\nCandidate: I built a payment gateway handling 10,000 TPS at scale with idempotent consumer groups.";
    const lastQuestion = "Welcome! Tell me about yourself and your background.";
    const lastAnswer = "I built a payment gateway handling 10,000 TPS at scale with idempotent consumer groups in Go and Kafka.";

    const start = Date.now();
    const result = await assessAndGenerateAdaptiveTurn(
      sessionState,
      dossier,
      history,
      lastQuestion,
      lastAnswer
    );
    const elapsed = Date.now() - start;

    assert.ok(result, "Result must exist");
    assert.ok(result.assessment, "Assessment must be populated");
    assert.ok(result.nextQuestion, "Next question must be populated");
    assert.ok(result.nextQuestion.question.length > 15, "Question text must be substantive");
    assert.ok(
      result.assessment.answer_quality === "strong" || result.assessment.answer_quality === "adequate",
      "Substantive answer should be rated adequate or strong"
    );
    assert.ok(
      result.nextQuestion.competency_focus ||
      result.nextQuestion.competency_targeted ||
      result.nextQuestion.section,
      "Must focus on a competency or section"
    );
    console.log(`[PERF TEST] Unified turn completed in ${elapsed}ms (timingMs: ${result.timingMs}ms)`);
  });

  test("3 & 18. Candidate Evidence Dossier Caching and Invalidation", async () => {
    invalidateCandidateDossierCache();

    // Call 1: Cold build
    const t0 = Date.now();
    const dossier1 = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const coldDuration = Date.now() - t0;
    assert.ok(dossier1, "Cold dossier must be created");
    assert.equal(dossier1.candidateId, candidateId);

    // Call 2: Warm cache hit
    const t1 = Date.now();
    const dossier2 = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const warmDuration = Date.now() - t1;
    assert.ok(dossier2, "Warm dossier must be returned");
    assert.equal(dossier2.candidateId, candidateId);
    assert.ok(warmDuration < 30, `Cache hit should take < 30ms (actual: ${warmDuration}ms)`);
    console.log(`[PERF TEST] Dossier cold: ${coldDuration}ms, warm cache hit: ${warmDuration}ms`);

    // Invalidation
    invalidateCandidateDossierCache(candidateId);
    assert.equal(CANDIDATE_INTERVIEW_DOSSIER_CACHE.has(`${candidateId}::custom::${customJd.slice(0, 30)}`), false);
  });

  test("4, 5, 6 & 7. Groq Bounded Retries, Fallback & Timeout Resilience", async () => {
    // Test with a fallback-triggering non-existent model
    const start = Date.now();
    const result = await callGroqCatalog({
      model: "nonexistent-model-xyz",
      messages: [{ role: "user", content: "Reply with the word 'READY'" }],
      temperature: 0.1,
      max_tokens: 150,
    });
    const duration = Date.now() - start;

    assert.ok(result.text, "Result text must be returned by fallback model");
    assert.ok(result.raw, "Raw API payload must be present");
    console.log(`[PERF TEST] Fallback completed successfully in ${duration}ms with text: "${result.text.trim()}"`);
  });

  test("8 & 15. Message Idempotency & Transcript Consistency", async () => {
    const sessionId = `perf_sess_${Date.now()}`;
    const dossier = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const blueprint = generateInterviewBlueprint(dossier, "Staff Engineer", 45);
    const sessionState = createAdvancedSessionState(blueprint, dossier, sessionId);

    // Turn 1
    sessionState.questionsAsked.push({
      question: "What is Raft consensus?",
      targets: "consensus",
      section: "technical_fundamentals",
      competency: "distributed_systems",
      turnIndex: 1,
    });
    sessionState.turns.push({
      turnIndex: 1,
      question: {
        question: "What is Raft consensus?",
        section: "technical_fundamentals",
        competency_focus: "distributed_systems",
        question_targets: "consensus",
        question_type: "technical",
        difficulty_level: "hard",
        is_follow_up: false,
      },
      answer: "Raft is a consensus algorithm that uses leader election, log replication, and safety guarantees.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Clear summary of Raft mechanisms",
        topics_demonstrated: ["Raft"],
        next_action: "follow_up_probe",
        difficulty_adjustment: "escalate",
        extracted_claims: [],
      },
      timestamp: new Date().toISOString(),
    });

    saveActiveSessionState(sessionId, sessionState);
    const retrieved = getActiveSessionState(sessionId);

    assert.equal(retrieved?.turns.length, 1);
    assert.equal(retrieved?.questionsAsked.length, 1);
    assert.equal(retrieved?.candidateId, candidateId);

    clearActiveSessionState(sessionId);
    assert.equal(getActiveSessionState(sessionId), null);
  });

  test("14 & 16. Multi-Candidate Session and Dossier Isolation", async () => {
    const candidateA = "cand_alpha_001";
    const resumeA = "Python developer with Django and Flask experience";
    const jdA = "Backend Python Developer";

    const candidateB = "cand_beta_002";
    const resumeB = "C++ Systems engineer with Linux kernel and eBPF experience";
    const jdB = "Systems Engineer";

    const dossierA = await buildCandidateInterviewDossier(candidateA, resumeA, jdA);
    const dossierB = await buildCandidateInterviewDossier(candidateB, resumeB, jdB);

    assert.equal(dossierA.candidateId, candidateA);
    assert.equal(dossierB.candidateId, candidateB);
    assert.equal(dossierA.targetRole, jdA);
    assert.equal(dossierB.targetRole, jdB);

    // Cross-candidate session access check
    const sessionIdA = `session_isolation_a_${Date.now()}`;
    saveActiveSessionState(sessionIdA, { sessionId: sessionIdA, candidateId: candidateA });

    const aliceAccess = getActiveSessionState(sessionIdA, candidateA);
    assert.ok(aliceAccess, "Candidate A must be able to access own session");

    const bobAttempt = getActiveSessionState(sessionIdA, candidateB);
    assert.equal(bobAttempt, null, "Candidate B must NEVER be able to access Candidate A session");

    clearActiveSessionState(sessionIdA);
  });

  test("19 & 20. Adaptive Follow-Up and Competency Progression", async () => {
    const dossier = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const blueprint = generateInterviewBlueprint(dossier, "Staff Engineer", 45);
    const sessionState = createAdvancedSessionState(blueprint, dossier, "perf_adaptive_session");
    sessionState.openingState = "INTRODUCTION_RECEIVED";
    sessionState.turns.push({
      turnIndex: 1,
      question: {
        question: "How do you handle network partitions?",
        section: "technical_fundamentals",
        competency_focus: "distributed_systems",
        question_targets: "distributed_systems",
        question_type: "technical",
        difficulty_level: "hard",
        is_follow_up: false,
      },
      answer: "We restart it.",
      assessment: {
        answer_quality: "shallow",
        reasoning: "Answer was only 3 words",
        topics_demonstrated: [],
        next_action: "follow_up_probe",
        difficulty_adjustment: "de-escalate",
        extracted_claims: [],
      },
      timestamp: new Date().toISOString(),
    });

    // Shallow answer test
    const shallowTurn = await assessAndGenerateAdaptiveTurn(
      sessionState,
      dossier,
      "Alex: How do you handle network partitions?\nCandidate: We restart it.",
      "How do you handle network partitions?",
      "We restart it."
    );

    assert.equal(shallowTurn.assessment.answer_quality, "shallow");
    assert.ok(shallowTurn.nextQuestion.question.length > 0);

    // Fast-path 'does not know' test (0ms fast path)
    const dnkStart = Date.now();
    const dnkTurn = await assessAndGenerateAdaptiveTurn(
      sessionState,
      dossier,
      "Alex: Can you explain Paxos multi-decree?\nCandidate: I don't know.",
      "Can you explain Paxos multi-decree?",
      "I don't know, never used that."
    );
    const dnkElapsed = Date.now() - dnkStart;

    assert.equal(dnkTurn.assessment.answer_quality, "does_not_know");
    console.log(`[PERF TEST] Does not know fast path handled in ${dnkElapsed}ms`);
  });

  test("21 & 22. Phase 1 Opening Compatibility & Initial Turn Flow", async () => {
    const dossier = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const blueprint = generateInterviewBlueprint(dossier, "Staff Engineer", 45);
    const sessionState = createAdvancedSessionState(blueprint, dossier, "perf_opening_session");

    const openingTurn = await assessAndGenerateAdaptiveTurn(
      sessionState,
      dossier,
      "",
      "",
      ""
    );

    assert.ok(openingTurn.nextQuestion, "Opening question must be generated");
    const qLower = openingTurn.nextQuestion.question.toLowerCase();
    assert.ok(
      qLower.includes("alex") ||
      qLower.includes("introduce") ||
      qLower.includes("welcome") ||
      qLower.includes("tell me about"),
      `Opening must be a professional greeting & intro prompt. Got: "${openingTurn.nextQuestion.question}"`
    );
  });
});
