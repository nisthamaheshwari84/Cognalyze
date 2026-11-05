import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  generateOpeningGreeting,
  generateIntroductionTransition,
  generateNextAdaptiveQuestion,
  assessAndGenerateAdaptiveTurn,
  determineFollowUpReason,
  generateSectionTransition,
  isCandidateEarlyFinishRequest,
  generateInterviewFinalReport,
  commitInterviewEvidenceToDNA,
  invalidateCandidateDossierCache,
} from "../lib/ai/interview-engine";
import {
  saveActiveSessionState,
  getActiveSessionState,
  clearActiveSessionState,
  markSessionCompleted,
  isSessionCompleted,
} from "../lib/interview-session-store";
import { getStudentDNAFull } from "../lib/dna/store";

describe("Phase 3: Coherent Interview Lifecycle Suite (8 Stages)", () => {
  const candidateId = "cand_p3_lifecycle_01";
  const customResume = `
Alex Rivera - Senior Backend Engineer
Experience: 4 years
Skills: TypeScript, Node.js, Go, PostgreSQL, Redis, Apache Kafka, Distributed Systems, Docker, Kubernetes.
Projects:
1. EventMesh: Distributed event routing platform handling 25,000 events/sec with Apache Kafka and Go.
2. LedgerCore: Double-entry accounting service with strict ACID guarantees and PostgreSQL.
`;
  const customJd = `
Senior Software Engineer - Core Infrastructure
Requirements: Distributed systems, event-driven architectures, database consistency, high-throughput microservices.
`;

  test("STAGE 1: Pre-Interview Context Resolution & Evidence Grounding", async () => {
    invalidateCandidateDossierCache();
    const dossier = await buildCandidateInterviewDossier(candidateId, customResume, customJd);

    assert.ok(dossier, "Dossier must be resolved");
    assert.equal(dossier.candidateId, candidateId);
    assert.equal(dossier.experienceMode, "experienced");
    assert.ok(dossier.projects.length >= 1, "Must extract projects from resume claims");
    
    // Distinguishes verified vs unverified/claims
    assert.ok(Array.isArray(dossier.missingOrUnverified), "Missing or unverified items must be tracked");
    assert.ok(
      dossier.missingOrUnverified.some((m) => m.toLowerCase().includes("github")),
      "Missing GitHub evidence must be flagged honestly without hallucinating repos"
    );

    // Incomplete profile handling
    const incompleteDossier = await buildCandidateInterviewDossier("cand_incomplete_99", "", "");
    assert.ok(incompleteDossier, "Incomplete profile must resolve without crashing");
    assert.equal(incompleteDossier.candidateId, "cand_incomplete_99");
    assert.equal(incompleteDossier.experienceMode, "fresher");
    assert.ok(incompleteDossier.missingOrUnverified.length > 0, "Missing profile info must be transparently noted");
  });

  test("STAGE 2: Natural Opening and Introduction without Technical Interrogation", async () => {
    const dossier = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const greeting = generateOpeningGreeting(dossier);

    assert.ok(greeting.question, "Greeting question must exist");
    assert.equal(greeting.question_type, "warm-up");
    assert.equal(greeting.difficulty_level, "easy");
    assert.equal(greeting.is_follow_up, false);

    // Check tone: concise, professional, warm, under 50 words
    const wordCount = greeting.question.trim().split(/\s+/).length;
    assert.ok(wordCount <= 50, `Greeting must be concise (got ${wordCount} words)`);
    assert.ok(!greeting.question.toLowerCase().includes("leetcode"), "Opening must not be a leetcode question");
    assert.ok(!greeting.question.toLowerCase().includes("algorithm"), "Opening must not ask algorithmic puzzle upfront");

    // Transition on candidate intro
    const introText = "I'm a backend engineer focused on high-throughput event processing with Kafka and Go.";
    const transition = generateIntroductionTransition(introText, dossier);
    assert.ok(transition.length > 0, "Transition must be generated");
    assert.ok(
      transition.toLowerCase().includes("event") || transition.toLowerCase().includes("backend") || transition.toLowerCase().includes("background"),
      "Transition should acknowledge candidate's shared background"
    );
  });

  test("STAGE 3: Structured Project Exploration Across 4 Depths (Overview -> Contribution -> Trade-offs -> Failure)", async () => {
    const dossier = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const blueprint = generateInterviewBlueprint(dossier, "Senior Software Engineer", 45, "experienced");
    blueprint.currentSection = "resume_projects";
    const sessionState = createAdvancedSessionState(blueprint, dossier, "sess_p3_proj_exp");

    sessionState.candidateIntroduction = "I built EventMesh using Kafka and Go to route 25,000 events/sec.";

    // Depth 1: Overview
    const q1 = await generateNextAdaptiveQuestion(sessionState, dossier, "", null);
    assert.equal(sessionState.projectExplorationFocus, "overview");
    assert.ok(q1.question.length > 10, "Overview question generated");

    // Simulate turn 1 answer
    sessionState.turns.push({
      turnIndex: 1,
      question: q1,
      answer: "EventMesh acts as a centralized routing ingress that validates schemas before publishing to Kafka partition topics.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Clear architecture overview provided.",
        topics_demonstrated: ["Kafka", "Schema Validation"],
        next_action: "acknowledge_and_advance",
        difficulty_adjustment: "maintain",
      },
      timestamp: new Date().toISOString(),
    });

    // Depth 2: Personal Contribution
    const q2 = await generateNextAdaptiveQuestion(sessionState, dossier, "", sessionState.turns[0].assessment);
    assert.equal(sessionState.projectExplorationFocus, "personal_contribution");
    assert.ok(q2.question.length > 10, "Personal contribution question generated");

    // Simulate turn 2 answer
    sessionState.turns.push({
      turnIndex: 2,
      question: q2,
      answer: "I personally designed the zero-copy buffer pooling mechanism in Go and wrote the partition rebalance listener.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Distinct personal contributions articulated.",
        topics_demonstrated: ["Go Memory Pools", "Partition Rebalancing"],
        next_action: "acknowledge_and_advance",
        difficulty_adjustment: "escalate",
      },
      timestamp: new Date().toISOString(),
    });

    // Depth 3: Implementation Decision & Trade-off
    const q3 = await generateNextAdaptiveQuestion(sessionState, dossier, "", sessionState.turns[1].assessment);
    assert.equal(sessionState.projectExplorationFocus, "tradeoff_decision");
    assert.ok(q3.question.length > 10, "Trade-off question generated");

    // Simulate turn 3 answer
    sessionState.turns.push({
      turnIndex: 3,
      question: q3,
      answer: "We chose manual offset commits over auto-commit to prevent message loss during pod evictions, trading 3ms latency for at-least-once delivery.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Sound understanding of offset commit trade-offs.",
        topics_demonstrated: ["Offset Management", "Delivery Guarantees"],
        next_action: "acknowledge_and_advance",
        difficulty_adjustment: "maintain",
      },
      timestamp: new Date().toISOString(),
    });

    // Depth 4: Failure Mode & Challenge
    const q4 = await generateNextAdaptiveQuestion(sessionState, dossier, "", sessionState.turns[2].assessment);
    assert.equal(sessionState.projectExplorationFocus, "failure_challenge");
    assert.ok(q4.question.length > 10, "Failure mode question generated");
  });

  test("STAGE 4: Technical & Role-Specific Exploration with Dynamic Difficulty Calibration", async () => {
    const dossier = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const blueprint = generateInterviewBlueprint(dossier, "Senior Software Engineer", 45, "experienced");
    blueprint.currentSection = "technical_fundamentals";
    const sessionState = createAdvancedSessionState(blueprint, dossier, "sess_p3_difficulty");

    // Initial difficulty
    assert.equal(sessionState.currentDifficulty, "medium");

    // When candidate answers with strong depth -> difficulty adjusts or maintains at high level
    const strongAnswer = "We use Read Committed with MVCC in PostgreSQL. When concurrent updates hit the same row, row-level locks prevent dirty writes while non-blocking reads access snapshot data.";
    const result1 = await assessAndGenerateAdaptiveTurn(
      sessionState,
      dossier,
      "",
      "How does PostgreSQL handle concurrency control under heavy write loads?",
      strongAnswer
    );
    assert.ok(result1.assessment.answer_quality === "strong" || result1.assessment.answer_quality === "adequate");

    // When candidate answers 'I do not know' -> Next action is simplify or advance gracefully
    const uncertainAnswer = "I'm not really sure about how Raft handles split brain or leader elections in edge partitions.";
    const result2 = await assessAndGenerateAdaptiveTurn(
      sessionState,
      dossier,
      "",
      "Can you explain the leader election and log replication safety invariants in Raft?",
      uncertainAnswer
    );
    assert.ok(
      result2.assessment.answer_quality === "does_not_know" || result2.assessment.next_action === "acknowledge_and_advance",
      "Candidate expressing uncertainty must be treated gracefully"
    );
    assert.ok(!result2.nextQuestion.question.toLowerCase().includes("you failed"), "No shaming or hostile tone");
  });

  test("STAGE 5: Adaptive Follow-ups with Categorized FollowUpReason", () => {
    // 1. Unresolved concept
    const r1 = determineFollowUpReason(true, {
      answer_quality: "shallow",
      reasoning: "Missed failure recovery details",
      topics_demonstrated: ["Kafka"],
      unresolved_threads: ["Consumer group rebalance timeout"],
      next_action: "follow_up_probe",
      difficulty_adjustment: "maintain",
    });
    assert.equal(r1, "test_unresolved_concept");

    // 2. Verify claimed implementation
    const r2 = determineFollowUpReason(
      true,
      {
        answer_quality: "adequate",
        reasoning: "Claimed project implementation",
        topics_demonstrated: ["Postgres"],
        next_action: "follow_up_probe",
        difficulty_adjustment: "maintain",
      },
      "resume_projects",
      "What did you personally build versus team members?"
    );
    assert.equal(r2, "verify_claimed_implementation");

    // 3. Understand trade-off
    const r3 = determineFollowUpReason(
      true,
      {
        answer_quality: "adequate",
        reasoning: "Selected architecture",
        topics_demonstrated: ["Architecture"],
        next_action: "follow_up_probe",
        difficulty_adjustment: "maintain",
      },
      "coding_system_design",
      "What trade-off did you consider between consistency and latency?"
    );
    assert.equal(r3, "understand_trade_off");

    // 4. Explore failure mode
    const r4 = determineFollowUpReason(
      true,
      null,
      "technical_fundamentals",
      "What failure mode happens if the leader node crashes during sync?"
    );
    assert.equal(r4, "explore_failure_mode");

    // 5. Resolve contradiction
    const r5 = determineFollowUpReason(true, {
      answer_quality: "contradictory",
      reasoning: "Stated both synchronous and asynchronous without queue",
      topics_demonstrated: [],
      next_action: "clarify_ambiguity",
      difficulty_adjustment: "de-escalate",
    });
    assert.equal(r5, "resolve_contradiction");

    // 6. Non-follow-up question
    const r6 = determineFollowUpReason(false);
    assert.equal(r6, "none");
  });

  test("STAGE 6: Natural Topic Transitions without Robotic Clichés", () => {
    const t1 = generateSectionTransition("introduction", "resume_projects", null, "EventMesh");
    assert.ok(t1.includes("EventMesh"), "Transition mentions candidate project");

    const t2 = generateSectionTransition("resume_projects", "technical_fundamentals");
    assert.ok(t2.toLowerCase().includes("pivot") || t2.toLowerCase().includes("fundamentals"), "Clean pivot to fundamentals");

    const t3 = generateSectionTransition("technical_fundamentals", "coding_system_design");
    assert.ok(t3.toLowerCase().includes("system") || t3.toLowerCase().includes("architecture"), "Smooth pivot to system design");

    const t4 = generateSectionTransition("coding_system_design", "behavioral");
    assert.ok(t4.toLowerCase().includes("leadership") || t4.toLowerCase().includes("teamwork") || t4.toLowerCase().includes("behavioral"), "Pivot to behavioral");

    const t5 = generateSectionTransition("behavioral", "closing");
    assert.ok(t5.toLowerCase().includes("covers") || t5.toLowerCase().includes("wrap"), "Clear wrap-up transition");
  });

  test("STAGE 7: Early Finish & Natural Interview Conclusion Guard", () => {
    // Detects explicit wrap-up requests
    assert.equal(isCandidateEarlyFinishRequest("Can we wrap up the interview now?"), true);
    assert.equal(isCandidateEarlyFinishRequest("I would like to conclude here, thank you."), true);
    assert.equal(isCandidateEarlyFinishRequest("That's all I have for today, let's stop here."), true);
    assert.equal(isCandidateEarlyFinishRequest("I don't have anything else to add, can we finish?"), true);

    // Standard answers do not trigger early finish
    assert.equal(isCandidateEarlyFinishRequest("We can wrap the connection pool in a singleton."), false);
    assert.equal(isCandidateEarlyFinishRequest("That concludes my explanation of the algorithm."), false);
  });

  test("STAGE 8: Assessment and Final Report Generation with Exemplar Model Answers & DNA Evidence", async () => {
    const dossier = await buildCandidateInterviewDossier(candidateId, customResume, customJd);
    const blueprint = generateInterviewBlueprint(dossier, "Senior Software Engineer", 45, "experienced");
    const sessionId = "sess_p3_stage8_report";
    const sessionState = createAdvancedSessionState(blueprint, dossier, sessionId);

    // Add turns with simulated evaluation
    sessionState.turns.push({
      turnIndex: 1,
      question: {
        question: "How did you design EventMesh to handle 25,000 events/sec reliably?",
        question_targets: "System Architecture & Scalability",
        question_type: "technical",
        difficulty_level: "medium",
        is_follow_up: false,
        section: "resume_projects",
      },
      answer: "We partitioned Kafka topics by customer ID, deployed stateless Go ingress consumers with worker pools, and batched writes with Snappy compression.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Solid architecture partitioning and compression techniques.",
        topics_demonstrated: ["Kafka Partitioning", "Go Concurrency", "Batching"],
        next_action: "acknowledge_and_advance",
        difficulty_adjustment: "escalate",
      },
      rubricScore: 88,
      timestamp: new Date().toISOString(),
    });

    sessionState.turns.push({
      turnIndex: 2,
      question: {
        question: "How do you prevent data loss during Kafka consumer group rebalances?",
        question_targets: "Fault Tolerance & Consistency",
        question_type: "technical",
        difficulty_level: "hard",
        is_follow_up: true,
        follow_up_reason: "explore_failure_mode",
        section: "resume_projects",
      },
      answer: "We implemented custom cooperative sticky assignor and committed offsets synchronously inside the rebalance listener callback before relinquishing partitions.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Excellent mastery of cooperative sticky rebalances and offset synchronization.",
        topics_demonstrated: ["Cooperative Rebalance", "Offset Commits"],
        next_action: "acknowledge_and_advance",
        difficulty_adjustment: "maintain",
      },
      rubricScore: 92,
      timestamp: new Date().toISOString(),
    });

    const messages = [
      { role: "assistant", content: sessionState.turns[0].question.question },
      { role: "user", content: sessionState.turns[0].answer },
      { role: "assistant", content: sessionState.turns[1].question.question },
      { role: "user", content: sessionState.turns[1].answer },
    ];

    const report = await generateInterviewFinalReport(sessionState, messages, dossier);

    // Verify report fields
    assert.ok(report, "Final report must be generated");
    assert.equal(report.candidateId, candidateId);
    assert.equal(report.sessionId, sessionId);
    assert.ok(report.overallScore >= 70, "Strong turns should earn solid passing score");
    assert.ok(["HIRE", "STRONG_HIRE"].includes(report.hiringRecommendation), "Recommendation should reflect strong performance");
    assert.ok(report.questionByQuestionAnalysis, "Must include question-by-question analysis");
    assert.equal(report.questionByQuestionAnalysis.length, 2);

    // Exemplar model answers and dimensions present
    const q1Analysis = report.questionByQuestionAnalysis[0];
    assert.ok(q1Analysis.bestPossibleAnswer || q1Analysis.exemplarModelAnswer, "Exemplar model answer must be generated");
    assert.ok(q1Analysis.dimensionScores.length >= 4, "Dimension scoring breakdown present");

    // Provenance summary distinguishes verified facts and claims
    assert.ok(report.provenanceSummary, "Provenance summary must be populated");
    assert.ok(Array.isArray(report.provenanceSummary.verifiedFactsUsed));
    assert.ok(Array.isArray(report.provenanceSummary.unverifiedOrMissingSources));

    // Commit to Student DNA
    const commit = await commitInterviewEvidenceToDNA(candidateId, report);
    assert.ok(commit.success, "Evidence commit must succeed");
    assert.ok(typeof commit.evidenceAdded === "number", "Evidence added count is returned");

    // Verify updated Student DNA
    const dna = await getStudentDNAFull(candidateId);
    assert.ok(dna, "Student DNA exists");
  });
});
