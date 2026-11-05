import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateAnswerRubricAndModelAnswer,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  assessCandidateAnswer,
  isQuestionSemanticallyDuplicate,
  validateQuestionCompleteness,
  generateBlueprintFallbackQuestion,
  generateLogicalFollowUps,
  CandidateInterviewDossier,
  InterviewBlueprint,
  AdvancedSessionState,
} from "../lib/ai/interview-engine";
import {
  saveActiveSessionState,
  getActiveSessionState,
  clearActiveSessionState,
} from "../lib/interview-session-store";

// ═══════════════════════════════════════════════════════════════
// TEST SUITE: P0 BUG FIX & ADAPTIVE INTERVIEW ENGINE REPAIR
// ═══════════════════════════════════════════════════════════════

test("Adaptive Interview Engine P0 Regression Suite", async (t) => {
  // ── TEST A: DIFFERENT CANDIDATES ─────────────────────────────
  await t.test("Test A: Different candidates yield distinct blueprints and question contexts", async () => {
    const candidateFrontend: CandidateInterviewDossier = {
      candidateId: "cand_frontend_01",
      name: "Priya Sharma",
      targetRole: "Frontend Engineer",
      experienceMode: "fresher",
      targetCompany: "Vercel",
      verifiedSkills: ["React", "TypeScript", "Next.js", "CSS Grid"],
      claimedSkills: ["Web Performance", "TailwindCSS"],
      githubStatus: { connected: true, publicRepos: 4, accessibleRepos: [], limitations: [] },
      linkedinStatus: { connected: false, limitations: [] },
      projects: [
        {
          title: "Accessible Component Library",
          tech: ["React", "TypeScript", "TailwindCSS"],
          description: "ARIA-compliant headless component primitives with zero-runtime CSS.",
          verificationStatus: "verified",
        },
      ],
      missingOrUnverified: [],
      experienceYears: 0,
      careerIntent: "Frontend Engineer",
      evidenceItems: [],
      previousInterviewWeaknesses: [],
      interviewType: "technical",
    };

    const candidateBackend: CandidateInterviewDossier = {
      candidateId: "cand_backend_02",
      name: "Marcus Vance",
      targetRole: "Distributed Systems Backend Engineer",
      experienceMode: "experienced",
      targetCompany: "Datadog",
      verifiedSkills: ["Go", "Kafka", "PostgreSQL", "Raft Consensus"],
      claimedSkills: ["Kubernetes", "gRPC"],
      githubStatus: { connected: true, publicRepos: 8, accessibleRepos: [], limitations: [] },
      linkedinStatus: { connected: false, limitations: [] },
      projects: [
        {
          title: "Distributed Write-Ahead Log",
          tech: ["Go", "Raft", "gRPC"],
          description: "Replicated commit log implementing Raft consensus for partitioned state machines.",
          verificationStatus: "verified",
        },
      ],
      missingOrUnverified: [],
      experienceYears: 4,
      careerIntent: "Distributed Systems Backend Engineer",
      evidenceItems: [],
      previousInterviewWeaknesses: [],
      interviewType: "technical",
    };

    const bpFrontend = generateInterviewBlueprint(
      candidateFrontend,
      candidateFrontend.targetRole,
      45,
      "fresher",
      "sess_fe_01",
      "",
      "technical",
      "Vercel",
      ["React", "Web Performance"]
    );

    const bpBackend = generateInterviewBlueprint(
      candidateBackend,
      candidateBackend.targetRole,
      45,
      "experienced",
      "sess_be_02",
      "",
      "technical",
      "Datadog",
      ["Distributed Systems", "Kafka", "Go"]
    );

    // Assert that their blueprints and skills focus are distinct
    assert.notDeepEqual(bpFrontend.skillsFocus, bpBackend.skillsFocus);
    assert.ok(bpFrontend.skillsFocus?.includes("React"));
    assert.ok(bpBackend.skillsFocus?.includes("Distributed Systems"));

    // Verify generated questions target their distinct projects
    const fallbackFE = generateBlueprintFallbackQuestion(
      "resume_projects",
      candidateFrontend,
      [],
      null,
      "I built an Accessible Component Library in React."
    );
    const fallbackBE = generateBlueprintFallbackQuestion(
      "resume_projects",
      candidateBackend,
      [],
      null,
      "I built a Distributed Write-Ahead Log in Go."
    );

    assert.ok(
      fallbackFE.question.toLowerCase().includes("accessible") || fallbackFE.question.toLowerCase().includes("component"),
      `Frontend question should reference their project: ${fallbackFE.question}`
    );
    assert.ok(
      fallbackBE.question.toLowerCase().includes("distributed") || fallbackBE.question.toLowerCase().includes("write-ahead"),
      `Backend question should reference their project: ${fallbackBE.question}`
    );
    assert.notEqual(fallbackFE.question, fallbackBE.question);
  });

  // ── TEST B: ANSWER-DEPENDENT FOLLOW-UP ─────────────────────────
  await t.test("Test B: Answer-dependent follow-up probes technical depth on strong answers and clarifies vague answers", async () => {
    const testDossier: CandidateInterviewDossier = {
      candidateId: "cand_test_b",
      name: "Marcus Vance",
      targetRole: "Distributed Systems Backend Engineer",
      experienceMode: "experienced",
      targetCompany: "Datadog",
      verifiedSkills: ["Go", "Kafka", "PostgreSQL"],
      claimedSkills: ["Kubernetes", "gRPC"],
      githubStatus: { connected: true, publicRepos: 2, accessibleRepos: [], limitations: [] },
      linkedinStatus: { connected: false, limitations: [] },
      projects: [
        {
          title: "Distributed Task Queue",
          tech: ["Go", "Kafka", "PostgreSQL"],
          description: "High-throughput asynchronous job processing system with retry backoff.",
          verificationStatus: "verified",
        },
      ],
      missingOrUnverified: [],
      experienceYears: 3,
      careerIntent: "Distributed Systems Backend Engineer",
      evidenceItems: [],
      previousInterviewWeaknesses: [],
      interviewType: "technical",
    };

    const bp = generateInterviewBlueprint(testDossier, testDossier.targetRole, 45, "experienced", "sess_test_b");
    const sessionState = createAdvancedSessionState(bp, testDossier);

    // 1. Technically strong answer with specific architecture
    const question = "In your primary project, how did you handle data consistency and message delivery between microservices?";
    const strongAnswer =
      "I implemented the Transactional Outbox pattern. Inside an ACID database transaction, we write the business entity update along with an outbox event record. An asynchronous worker polls or tails the WAL (via Debezium CDC) and publishes events to Kafka with an idempotency key to guarantee at-least-once delivery.";

    const assessmentStrong = await assessCandidateAnswer(
      question,
      strongAnswer,
      sessionState,
      testDossier
    );

    assert.equal(assessmentStrong.answer_quality, "strong");
    assert.ok(
      assessmentStrong.topics_demonstrated.some((t) => t.toLowerCase().includes("outbox") || t.toLowerCase().includes("transaction")),
      "Recognizes outbox and transactional patterns"
    );

    // Follow-ups generated for this strong answer should probe concrete trade-offs, CDC, or idempotency deduplication
    const followUps = generateLogicalFollowUps(question, strongAnswer, {
      section: "resume_projects",
      targetRole: "Backend Engineer",
    });

    assert.ok(followUps.length > 0, "Must generate logical follow-ups");
    const mentionsDeepDetail = followUps.some(
      (fu) =>
        fu.toLowerCase().includes("idempotency") ||
        fu.toLowerCase().includes("outbox") ||
        fu.toLowerCase().includes("cdc") ||
        fu.toLowerCase().includes("debezium") ||
        fu.toLowerCase().includes("consumer") ||
        fu.toLowerCase().includes("at-least-once") ||
        fu.toLowerCase().includes("failure")
    );
    assert.ok(mentionsDeepDetail, `Follow-up should probe architecture, not repeat generic question: ${followUps[0]}`);

    // 2. Vague answer
    const vagueAnswer = "We had some errors occasionally so we added retries and it worked fine.";
    const assessmentVague = await assessCandidateAnswer(
      question,
      vagueAnswer,
      sessionState,
      testDossier
    );

    assert.ok(
      assessmentVague.answer_quality === "shallow" || assessmentVague.answer_quality === "adequate",
      "Flags superficial answer as shallow or adequate"
    );
    assert.ok(
      assessmentVague.difficulty_adjustment === "de-escalate" || assessmentVague.difficulty_adjustment === "maintain",
      "Adjusts difficulty appropriately without escalating"
    );
  });

  // ── TEST C: COMPETENCY TRANSITION ─────────────────────────────
  await t.test("Test C: Sufficiently strong answer triggers transition to new competency", async () => {
    const testDossier: CandidateInterviewDossier = {
      candidateId: "cand_test_c",
      name: "Marcus Vance",
      targetRole: "Distributed Systems Backend Engineer",
      experienceMode: "experienced",
      targetCompany: "Datadog",
      verifiedSkills: ["Go", "Kafka", "PostgreSQL"],
      claimedSkills: ["Kubernetes", "gRPC"],
      githubStatus: { connected: true, publicRepos: 2, accessibleRepos: [], limitations: [] },
      linkedinStatus: { connected: false, limitations: [] },
      projects: [],
      missingOrUnverified: [],
      experienceYears: 3,
      careerIntent: "Distributed Systems Backend Engineer",
      evidenceItems: [],
      previousInterviewWeaknesses: [],
      interviewType: "technical",
    };

    const bp = generateInterviewBlueprint(testDossier, testDossier.targetRole, 45, "experienced", "sess_test_c");
    const sessionState = createAdvancedSessionState(bp, testDossier);

    const question = "How does B+ tree depth impact disk I/O in relation to page size?";
    const comprehensiveAnswer =
      "In a B+ tree, each node corresponds to a filesystem page, typically 4KB to 16KB. With high fanout (e.g., 100 to 500 keys per node), a 3-level B+ tree can index millions of rows with at most 3 page reads. Because leaf nodes are linked sequentially, range scans require sequential disk I/O rather than random seeks.";

    const assessment = await assessCandidateAnswer(
      question,
      comprehensiveAnswer,
      sessionState,
      testDossier
    );

    assert.ok(
      assessment.answer_quality === "strong" || assessment.answer_quality === "adequate",
      `Answer quality should be strong or adequate: ${assessment.answer_quality}`
    );
    // With mastery demonstrated, the system moves to a new competency instead of repetitive probing
    assert.ok(
      assessment.next_action === "move_to_new_topic" || assessment.next_action === "advance_section",
      `Must transition to new competency or section: ${assessment.next_action}`
    );
  });

  // ── TEST D: SEMANTIC DUPLICATE PREVENTION ─────────────────────
  await t.test("Test D: Session-level semantic question deduplication rejects redundant questions", () => {
    const q1 = "In your primary project, how did you handle data consistency, failure recovery, or error handling when external services or databases failed?";
    const qDuplicateSlightlyReworded = "In your main project, how did you handle error handling, data consistency, and failure recovery when databases or external services failed?";
    const qJustifiedFollowUp = "You mentioned using an idempotency key in PostgreSQL—how do you handle cleanup of expired idempotency keys under high write volume?";

    // 1. Semantic duplicate should be caught
    const isDup = isQuestionSemanticallyDuplicate(q1, qDuplicateSlightlyReworded);
    assert.ok(isDup, "Should detect reworded version of the same question as semantically duplicate");

    // 2. Justified deep follow-up on a specific concept should NOT be rejected
    const isFollowUpRejected = isQuestionSemanticallyDuplicate(q1, qJustifiedFollowUp);
    assert.equal(isFollowUpRejected, false, "Specific justified follow-up must NOT be rejected as duplicate");

    // 3. Completeness check ensures questions are not cut off
    const incompleteQ = "Could you tell me how the retry logic was configured and what happens if";
    const completeQ = "Could you tell me how the retry logic was configured and what happens if the worker crashes?";

    assert.equal(validateQuestionCompleteness(incompleteQ).isValid, false, "Incomplete question flagged as invalid");
    assert.equal(validateQuestionCompleteness(completeQ).isValid, true, "Complete question accepted");
  });

  // ── TEST E: EVIDENCE-BASED SCORING & RUBRICS ──────────────────
  await t.test("Test E: Question-type specific 100-point rubrics sum exactly and explain deductions", async () => {
    // 1. Behavioral Question Rubric
    const behavioralEval = await evaluateAnswerRubricAndModelAnswer(
      "Tell me about a time you had a technical disagreement with a colleague over architecture.",
      "In my last internship, a teammate wanted to use MongoDB for transaction ledger data, while I advocated for PostgreSQL. I set up a benchmark demonstrating ACID compliance and isolation levels. We agreed on PostgreSQL with a JSONB column for flexibility.",
      { section: "behavioral", targetRole: "Software Engineer", experienceMode: "fresher" }
    );

    assert.equal(behavioralEval.dimensionScores.length, 5);
    const behavioralSum = behavioralEval.dimensionScores.reduce((s, d) => s + d.maxPoints, 0);
    assert.equal(behavioralSum, 100, "Behavioral rubric must sum to 100");
    assert.ok(behavioralEval.dimensionScores.some((d) => d.dimension.includes("STAR")));

    // 2. Project Question Rubric
    const projectEval = await evaluateAnswerRubricAndModelAnswer(
      "Walk me through the architecture of your distributed cache and your personal contribution.",
      "I designed the distributed cache using consistent hashing with virtual nodes. I personally wrote the key partitioner in Go and handled server node failures by replicating keys across the next 2 clockwise nodes.",
      { section: "resume_projects", targetRole: "Backend Engineer", experienceMode: "experienced" }
    );

    const projectSum = projectEval.dimensionScores.reduce((s, d) => s + d.maxPoints, 0);
    assert.equal(projectSum, 100, "Project defense rubric must sum to 100");
    assert.ok(projectEval.dimensionScores.some((d) => d.dimension.includes("Architecture")));

    // 3. Coding / Algorithmic Rubric
    const codingEval = await evaluateAnswerRubricAndModelAnswer(
      "How would you find the longest substring without repeating characters in O(N) time?",
      "We can use a sliding window with two pointers and a hash map storing the last seen index of each character. As the right pointer advances, if a character is repeated within the current window, we jump the left pointer. Time complexity is O(N) and space complexity is O(min(N, M)).",
      { section: "coding_system_design", targetRole: "Software Engineer", experienceMode: "fresher" }
    );

    const codingSum = codingEval.dimensionScores.reduce((s, d) => s + d.maxPoints, 0);
    assert.equal(codingSum, 100, "Coding rubric must sum to 100");
    assert.ok(codingEval.dimensionScores.some((d) => d.dimension.includes("Algorithm & Data Structure")));

    // 4. Deductions are justified and evidence-based
    assert.ok(Array.isArray(codingEval.deductionReasons), "Must provide deduction explanations");
    assert.ok(Array.isArray(codingEval.whatYouDidWell), "Must provide what was done well");
  });

  // ── TEST F: USER ISOLATION & MULTI-TENANT PROTECTION ──────────
  await t.test("Test F: Session store guarantees strict user isolation", () => {
    const sessionId = "sess_iso_1001";
    const userA = "user_priya_sharma";
    const userB = "user_hacker_impostor";

    // Save session belonging to userA
    saveActiveSessionState(sessionId, {
      candidateId: userA,
      sessionId,
      turns: [{ turnIndex: 1, question: "Question A", answer: "Answer A" }],
      overallScore: 85,
    });

    // User A can access their own session
    const accessedByA = getActiveSessionState(sessionId, userA);
    assert.ok(accessedByA, "User A should successfully access their session");
    assert.equal(accessedByA.candidateId, userA);

    // User B CANNOT access User A's session
    const accessedByB = getActiveSessionState(sessionId, userB);
    assert.equal(accessedByB, null, "User B must receive null when querying User A's session");

    // Cleanup
    clearActiveSessionState(sessionId);
    assert.equal(getActiveSessionState(sessionId), null);
  });

  // ── TEST G: FAILURE RECOVERY & SAFE PRESERVATION ──────────────
  await t.test("Test G: Fallback generation safely recovers without duplicating state on engine timeout", () => {
    const candidate: CandidateInterviewDossier = {
      candidateId: "cand_recover_01",
      name: "Samir Gupta",
      targetRole: "Full-Stack Engineer",
      experienceMode: "fresher",
      targetCompany: "Amazon",
      verifiedSkills: ["TypeScript", "Node.js", "DynamoDB"],
      claimedSkills: ["Docker"],
      githubStatus: { connected: true, publicRepos: 2, accessibleRepos: [], limitations: [] },
      linkedinStatus: { connected: false, limitations: [] },
      projects: [{ title: "E-Commerce Checkout", tech: ["Node.js", "DynamoDB"], description: "Payment workflow.", verificationStatus: "verified" }],
      missingOrUnverified: [],
      experienceYears: 0,
      careerIntent: "Full-Stack Engineer",
      evidenceItems: [],
      previousInterviewWeaknesses: [],
      interviewType: "technical",
    };

    const questionsAsked = [
      { question: "Welcome! To start, give me a quick walkthrough of E-Commerce Checkout." },
    ];

    // Simulate fallback generation after simulated LLM failure
    const fallback = generateBlueprintFallbackQuestion(
      "resume_projects",
      candidate,
      questionsAsked as any,
      null,
      "I built the payment workflow using Node.js and DynamoDB."
    );

    assert.ok(fallback.question, "Fallback question is generated successfully");
    assert.notEqual(fallback.question, questionsAsked[0].question, "Fallback must not duplicate previous questions");
    assert.ok(
      validateQuestionCompleteness(fallback.question).isValid,
      "Fallback question is fully grammatically complete"
    );
  });
});
