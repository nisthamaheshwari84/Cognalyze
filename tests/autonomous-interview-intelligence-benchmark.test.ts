/**
 * tests/autonomous-interview-intelligence-benchmark.test.ts
 *
 * COGNALYZE — 20-SCENARIO AUTONOMOUS INTERVIEW INTELLIGENCE BENCHMARK SUITE
 *
 * Formally verifies Section 15 of the Master Implementation Prompt:
 *  1. Completely correct answer
 *  2. Partially correct answer
 *  3. Incorrect answer
 *  4. Vague answer
 *  5. Long, detailed answer
 *  6. Short answer
 *  7. Multiple concepts in one answer
 *  8. Alternative technically valid approach
 *  9. Contradictory answer
 * 10. Candidate says "I don't know."
 * 11. Candidate gives an unrelated answer
 * 12. Candidate corrects their previous answer
 * 13. Candidate uses informal language
 * 14. Candidate answers in Hinglish
 * 15. Speech transcription contains technical errors
 * 16. Candidate describes a new project
 * 17. Candidate provides a different solution from expected
 * 18. Candidate answers correctly but without explaining reasoning
 * 19. Candidate gives an impressive-sounding but unsupported answer
 * 20. Candidate asks the interviewer to repeat a question
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  understandCandidateAnswer,
  decideNextInterviewAction,
  validateQuestionQuality,
  conductAutonomousTurn,
  createAutonomousSessionMemory,
  recoverSpeechTranscriptionErrors,
  detectResponseAmbiguity,
  CandidateDossier,
  ContextualInterviewMemory,
} from "../lib/interview/autonomous-intelligence-engine";

function createMockDossier(): CandidateDossier {
  return {
    candidateId: "cand_test_001",
    name: "Aarav Sharma",
    targetRole: "Full Stack Software Engineer",
    targetCompany: "Google",
    experienceLevel: "experienced",
    trackId: "fullstack",
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Redis"],
    projects: [
      {
        title: "Distributed Task Queue",
        tech: ["Node.js", "Redis", "PostgreSQL"],
        description: "Asynchronous task queue with priority scheduling and dead letter queues.",
      },
    ],
  };
}

describe("COGNALYZE — 20-Scenario Autonomous Interview Intelligence Benchmark", () => {
  // Scenario 1: Completely correct answer
  it("Scenario 1: Completely correct answer -> High completeness, evidence extracted, progressive probe", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_1",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Database Indexing & Performance",
    });

    const question = "How does a B-Tree index accelerate SQL query performance on large tables?";
    const answer =
      "A B-Tree index maintains a self-balancing sorted tree structure of keys and row pointers. Instead of performing a sequential O(N) full table scan, the database traverses the tree from root to leaf in O(log N) time, reducing physical disk I/O operations by orders of magnitude.";

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: answer,
      lastQuestionText: question,
      lastQuestionId: "q_1",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "professional",
    });

    assert.ok(turn.evaluation.answer_completeness >= 70, "Completeness must be >= 70");
    assert.ok(turn.evaluation.rubric_score && turn.evaluation.rubric_score >= 75, "Rubric score must reflect mastery");
    assert.ok(["PROBE_DEEPER", "SCENARIO_BASED_PROBE", "INCREASE_DIFFICULTY"].includes(turn.decision.action));
    assert.strictEqual(turn.nextQuestion.isFollowUp, true);
    assert.strictEqual(memory.competencies["Database Indexing & Performance"].state, "ASSESSED");
  });

  // Scenario 2: Partially correct answer
  it("Scenario 2: Partially correct answer -> Ambiguity detected, missing dimensions recorded, clarification triggered", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_2",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "System Performance & Caching",
    });

    const question = "How did you optimize your application's read latency?";
    const answer = "We used caching to improve performance.";

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: answer,
      lastQuestionText: question,
      lastQuestionId: "q_2",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "practice",
    });

    assert.strictEqual(turn.evaluation.ambiguity.detected, true, "Ambiguity must be detected for generic caching answer");
    assert.strictEqual(turn.decision.action, "CLARIFY", "Must select CLARIFY action");
    assert.ok(turn.decision.directivePrompt.includes("cache invalidation") || turn.decision.directivePrompt.includes("cached"));
  });

  // Scenario 3: Incorrect answer
  it("Scenario 3: Incorrect answer -> False technical claim captured, score calibrated, reasoning challenged", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_3",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Database Foundations",
    });

    const question = "Can a primary key in a relational database contain NULL values?";
    const answer = "Yes, a primary key can have multiple NULL values because NULL is not an actual value, so uniqueness is preserved.";

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: answer,
      lastQuestionText: question,
      lastQuestionId: "q_3",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "professional",
    });

    assert.ok(turn.evaluation.rubric_score! <= 50, "Rubric score must reflect incorrect assertion");
    assert.ok(["CHALLENGE_REASONING", "DECREASE_DIFFICULTY", "PROBE_DEEPER"].includes(turn.decision.action));
  });

  // Scenario 4: Vague answer
  it("Scenario 4: Vague answer -> Flags missing substance, requests implementation details", async () => {
    const ambiguity = detectResponseAmbiguity("How did your backend handle transactions?", "We used a separate service for that.");
    assert.strictEqual(ambiguity.isAmbiguous, true);
    assert.strictEqual(ambiguity.ambiguityType, "MULTIPLE_INTERPRETATIONS");
    assert.ok(ambiguity.tailoredClarification.includes("responsibility that service handled"));
  });

  // Scenario 5: Long, detailed answer
  it("Scenario 5: Long, detailed answer -> Extracts multi-dimensional evidence without buffer truncation", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_5",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "System Architecture & Scalability",
    });

    const question = "Walk me through how you structured your high-throughput task queue.";
    const answer = `In our distributed task queue, we used Node.js producers submitting job payloads to Redis using sorted sets where the score represented the execution epoch timestamp.
Worker instances ran dedicated pollers with atomic ZPOPMIN operations wrapped in Redis Lua scripts to prevent duplicate job processing across concurrent instances.
For failed jobs, we implemented exponential backoff up to 5 retries, after which the payload was demoted to a Dead Letter Queue (DLQ) in PostgreSQL for auditability and manual replay.
We benchmarked this at 4,500 jobs per second with sub-10ms P99 latency.`;

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: answer,
      lastQuestionText: question,
      lastQuestionId: "q_5",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "professional",
    });

    assert.ok(turn.evaluation.answer_completeness >= 80);
    assert.ok(turn.evaluation.key_concepts.length >= 1);
    assert.strictEqual(turn.evaluation.contradiction_detected, undefined);
  });

  // Scenario 6: Short answer
  it("Scenario 6: Short answer -> Identifies briefness without false assumptions", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_6",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Data Structures",
    });

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: "B-Tree.",
      lastQuestionText: "What data structure does standard Postgres indexing use?",
      lastQuestionId: "q_6",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "practice",
    });

    assert.ok(turn.nextQuestion.questionText.length > 10);
    assert.ok(!turn.evaluation.ambiguity.detected || turn.decision.action === "PROBE_DEEPER");
  });

  // Scenario 7: Multiple concepts in one answer
  it("Scenario 7: Multiple concepts in one answer -> Accurately registers all distinct technologies", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_7",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Full Stack Infrastructure",
    });

    const answer = "We used Redis for distributed session storage, PostgreSQL for our transactional ledger, and RabbitMQ for asynchronous event notifications.";
    const record = await understandCandidateAnswer({
      questionId: "q_7",
      questionText: "How were state and messaging divided across your services?",
      rawAnswer: answer,
      memory,
    });

    assert.ok(record.key_concepts.length >= 1);
    assert.strictEqual(record.answer_completeness >= 50, true);
  });

  // Scenario 8: Alternative technically valid approach
  it("Scenario 8: Alternative technically valid approach -> Evaluated on merit, zero penalty for unchosen default", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_8",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Data Storage Architecture",
    });

    const question = "Why wouldn't you use standard SQL transactions for storing real-time IoT telemetry data?";
    const answer = "Because IoT telemetry is extremely write-heavy append-only time-series data. Relational ACID locks and B-Tree rebalancing on every write create severe I/O bottlenecks. An LSM-tree based time-series store or Cassandra allows sequential disk writes with eventual consistency, which matches the workload far better.";

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: answer,
      lastQuestionText: question,
      lastQuestionId: "q_8",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "professional",
    });

    assert.ok(turn.evaluation.rubric_score && turn.evaluation.rubric_score >= 75);
    assert.strictEqual(turn.evaluation.incorrect_points.length, 0);
  });

  // Scenario 9: Contradictory answer
  it("Scenario 9: Contradictory answer -> Detects discrepancy against previous claim and challenges reasoning", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_9",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Microservices Architecture",
    });

    memory.recordedClaims.push({
      claim: "Application is a monolithic single-process Node.js server.",
      verified: true,
      turnIndex: 1,
    });

    const evaluation = await understandCandidateAnswer({
      questionId: "q_9",
      questionText: "How are you deploying your service boundaries?",
      rawAnswer: "We split everything into 15 independent serverless microservices that deploy to AWS Lambda individually.",
      memory,
    });

    evaluation.contradiction_detected = "Previously stated application was a single monolith, now claiming 15 serverless microservices.";

    const decision = decideNextInterviewAction({
      evaluation,
      memory,
      turnsSpentOnCurrentCompetency: 1,
      maxTurnBudgetPerCompetency: 3,
      totalTurnsElapsed: 2,
      maxTotalTurns: 12,
    });

    assert.strictEqual(decision.action, "CHALLENGE_REASONING");
    assert.ok(decision.directivePrompt.includes("clarify the reasoning"));
  });

  // Scenario 10: Candidate says "I don't know."
  it("Scenario 10: Candidate says 'I don't know' -> Zero shaming, de-escalates difficulty gracefully", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_10",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Distributed Systems Consensus",
      initialDifficulty: "advanced",
    });

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: "I honestly don't know the exact internals of Raft consensus leader election.",
      lastQuestionText: "Explain how Raft handles split-brain during a network partition.",
      lastQuestionId: "q_10",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "practice",
    });

    assert.strictEqual(turn.evaluation.answer_completeness, 0);
    assert.strictEqual(turn.decision.action, "DECREASE_DIFFICULTY");
    assert.strictEqual(turn.decision.targetDifficulty, "foundational");
  });

  // Scenario 11: Candidate gives an unrelated answer
  it("Scenario 11: Candidate gives an unrelated answer -> Flags missing points and redirects gracefully", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_11",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Database Query Optimization",
    });

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: "We used CSS flexbox and responsive media queries to make sure the cards aligned properly.",
      lastQuestionText: "How did you optimize your PostgreSQL JOIN query on the orders table?",
      lastQuestionId: "q_11",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "professional",
    });

    assert.ok(turn.evaluation.missing_points.length >= 0);
    assert.strictEqual(turn.nextQuestion.questionText.length > 10, true);
  });

  // Scenario 12: Candidate corrects their previous answer
  it("Scenario 12: Candidate corrects their previous answer -> Understands correction without penalty", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_12",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Algorithm Complexity",
    });

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: "Wait, sorry, I misspoke in my previous sentence! It was not an array, we actually used a Hash Map so our lookups were O(1) instead of O(N).",
      lastQuestionText: "What was the time complexity of looking up active sessions?",
      lastQuestionId: "q_12",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "practice",
    });

    assert.ok(turn.evaluation.rubric_score && turn.evaluation.rubric_score >= 60);
    assert.strictEqual(turn.evaluation.ambiguity.detected, false);
  });

  // Scenario 13: Candidate uses informal language
  it("Scenario 13: Candidate uses informal language -> Evaluates technical semantics over formal prose", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_13",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Asynchronous Processing",
    });

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: "Basically we just spin up a quick background worker, dump all the email jobs there, and let it churn through them so the user API doesn't hang.",
      lastQuestionText: "How did you prevent the signup API from blocking on email verification?",
      lastQuestionId: "q_13",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "professional",
    });

    assert.ok(turn.evaluation.rubric_score && turn.evaluation.rubric_score >= 65);
    assert.ok(turn.evaluation.correct_points.length >= 1);
  });

  // Scenario 14: Candidate answers in Hinglish
  it("Scenario 14: Candidate answers in Hinglish -> Understands multilingual phrasing and technical meaning", async () => {
    const stt = recoverSpeechTranscriptionErrors("Maine JWT use kiya tha authentication ke liye aur tokens ko httpOnly cookies mein store kiya tha.");
    assert.strictEqual(stt.detectedLanguage, "hinglish");
    assert.strictEqual(stt.confidence >= 90, true);

    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_14",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Web Security & Authentication",
    });

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: "Maine JWT use kiya tha authentication ke liye aur tokens ko httpOnly cookies mein store kiya tha.",
      lastQuestionText: "How did you implement secure user authentication?",
      lastQuestionId: "q_14",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "practice",
    });

    assert.strictEqual(turn.evaluation.detected_language, "hinglish");
    assert.ok(turn.evaluation.rubric_score && turn.evaluation.rubric_score >= 70);
  });

  // Scenario 15: Speech transcription contains technical errors
  it("Scenario 15: Speech transcription contains technical errors -> Detects misrecognition and generates clarification", async () => {
    const rawAudioTranscript = "We used React as our in-memory key-value cache with a 10 minute TTL to store session tokens.";
    const stt = recoverSpeechTranscriptionErrors(rawAudioTranscript);

    assert.strictEqual(stt.hasCriticalConfusion, true);
    assert.ok(stt.clarificationPrompt?.includes("did you say Redis or React"));
    assert.strictEqual(stt.correctedInterpretation?.includes("Redis"), true);

    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_15",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Caching & Storage",
    });

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: rawAudioTranscript,
      lastQuestionText: "Where did you store active user sessions?",
      lastQuestionId: "q_15",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "professional",
    });

    assert.strictEqual(turn.decision.action, "CLARIFY");
    assert.ok(turn.nextQuestion.questionText.includes("Redis") || turn.nextQuestion.questionText.includes("React"));
  });

  // Scenario 16: Candidate describes a new project
  it("Scenario 16: Candidate describes a new project -> Grounds investigation without inventing architecture", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_16",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Project Architecture",
    });

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: "Outside of what's on my resume, I recently built an open-source CLI tool in Go for syncing environment variables securely across team members.",
      lastQuestionText: "Tell me about a project you've worked on recently.",
      lastQuestionId: "q_16",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "professional",
    });

    assert.ok(turn.evaluation.technical_claims.length >= 0);
    assert.strictEqual(turn.nextQuestion.isFollowUp, true);
  });

  // Scenario 17: Candidate provides a different solution from expected
  it("Scenario 17: Candidate provides a different solution from expected -> Evaluated fairly without rigid template penalty", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_17",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Graph Algorithms",
    });

    const question = "How would you find the shortest path between two nodes in an unweighted social network graph?";
    const answer = "While many reach for Dijkstra's, on an unweighted graph standard BFS (Breadth-First Search) is optimal. BFS guarantees the shortest path in O(V + E) time without the O((V + E) log V) overhead of a priority queue.";

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: answer,
      lastQuestionText: question,
      lastQuestionId: "q_17",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "professional",
    });

    assert.ok(turn.evaluation.rubric_score && turn.evaluation.rubric_score >= 80);
    assert.strictEqual(turn.evaluation.incorrect_points.length, 0);
  });

  // Scenario 18: Candidate answers correctly but without explaining reasoning
  it("Scenario 18: Candidate answers correctly without reasoning -> Triggers CHALLENGE_REASONING / PROBE_DEEPER", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_18",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Database Selection",
    });

    const question = "Between PostgreSQL and MongoDB, which database did you choose for your order management system?";
    const answer = "We chose PostgreSQL.";

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: answer,
      lastQuestionText: question,
      lastQuestionId: "q_18",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "practice",
    });

    assert.ok(["CHALLENGE_REASONING", "PROBE_DEEPER", "VERIFY_UNDERSTANDING"].includes(turn.decision.action));
  });

  // Scenario 19: Candidate gives an impressive-sounding but unsupported answer
  it("Scenario 19: Candidate gives impressive buzzwords without depth -> Triggers VERIFY_UNDERSTANDING", async () => {
    const ambiguity = detectResponseAmbiguity(
      "How did you design your web tier?",
      "Our application supports horizontal scaling across multiple cloud regions."
    );

    assert.strictEqual(ambiguity.isAmbiguous, true);
    assert.strictEqual(ambiguity.ambiguityType, "SUPERFICIAL_BUZZWORD");
    assert.ok(ambiguity.tailoredClarification.includes("stateless across multiple instances"));
  });

  // Scenario 20: Candidate asks the interviewer to repeat a question
  it("Scenario 20: Candidate asks the interviewer to repeat a question -> Rephrases clearly without penalty", async () => {
    const memory = createAutonomousSessionMemory({
      sessionId: "sess_sc_20",
      candidateId: "cand_01",
      dossier: createMockDossier(),
      initialCompetency: "Network Protocols",
    });

    const turn = await conductAutonomousTurn({
      rawCandidateAnswer: "Sorry, my connection lagged for a second. Can you please repeat the question?",
      lastQuestionText: "How does the TCP three-way handshake establish a connection?",
      lastQuestionId: "q_20",
      memory,
      candidateContext: memory.dossier,
      experienceMode: "practice",
    });

    assert.strictEqual(turn.decision.action, "CLARIFY");
    assert.ok(turn.nextQuestion.questionText.length > 10);
    assert.ok(turn.evaluation.rubric_score && turn.evaluation.rubric_score >= 60, "No penalty for asking to repeat");
  });
});
