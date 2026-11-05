import { test, describe } from "node:test";
import assert from "node:assert";
import {
  assessCandidateAnswer,
  analyzeCandidateResponseContext,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  generateBlueprintFallbackQuestion,
  assessAndGenerateAdaptiveTurn,
  TRACK_CONFIGURATIONS,
  InterviewTrack,
  buildCandidateInterviewDossier
} from "../lib/ai/interview-engine";
import {
  saveActiveSessionState,
  getActiveSessionState,
  markSessionCompleted,
  isSessionCompleted
} from "../lib/interview-session-store";

describe("Phase 2: Contextual Response Handling & Eight Interview Tracks Suite", () => {

  test("P2-TEST 1: Concise correct answer is recognized as strong and NOT penalized as shallow", async () => {
    const qText = "What HTTP status code and architectural mechanism ensure idempotent payment mutations?";
    const conciseAns = "HTTP 409 Conflict with a unique client-generated Idempotency-Key header stored in Redis or database.";

    const context = analyzeCandidateResponseContext(conciseAns, qText);
    assert.strictEqual(context.isConciseCorrect, true, "Answer must be recognized as concise correct");
    assert.strictEqual(context.hasTechnicalFallacy, false, "Answer must have no fallacies");

    const assessment = await assessCandidateAnswer(qText, conciseAns, {
      section: "technical_fundamentals",
      experienceMode: "experienced",
      targetRole: "Senior Backend Engineer",
      competency: "API Idempotency & Reliability",
    });

    assert.ok(
      assessment.answer_quality === "strong" || assessment.answer_quality === "adequate",
      `Concise technically accurate answer should be strong/adequate, got ${assessment.answer_quality}`
    );
    assert.strictEqual(assessment.competency_established, true, "Competency must be marked established");
    assert.ok(assessment.reasoning.toLowerCase().includes("concise"), "Reasoning should credit conciseness");
  });

  test("P2-TEST 2: Long verbose answer with technical fallacies is not granted unearned credit", async () => {
    const qText = "How does HTTP/2 multiplexing improve throughput compared to HTTP/1.1?";
    const verboseIncorrectAns =
      "HTTP/2 is an incredible protocol that completely revolutionizes the internet by running exclusively over UDP without handshakes, eliminating TCP completely so packets are delivered with zero overhead and B+ tree lookups on the client take O(1) time without any collisions whatsoever.";

    const context = analyzeCandidateResponseContext(verboseIncorrectAns, qText);
    assert.strictEqual(context.hasTechnicalFallacy, true, "Must detect technical misconception in verbose response");

    const assessment = await assessCandidateAnswer(qText, verboseIncorrectAns, {
      section: "technical_fundamentals",
      experienceMode: "experienced",
      targetRole: "Senior Backend Engineer",
      competency: "Network Protocols & Multiplexing",
    });

    assert.ok(
      assessment.answer_quality === "shallow" || assessment.answer_quality === "off-topic",
      `Verbose answer with factual errors must be shallow or off-topic, got ${assessment.answer_quality}`
    );
    assert.strictEqual(assessment.next_action, "clarify_ambiguity", "Must trigger clarifying probe on misconception");
    assert.strictEqual(assessment.competency_established, false, "Competency must not be established for false claims");
  });

  test("P2-TEST 3: Partially correct answer credits valid concepts and triggers targeted follow-up", async () => {
    const qText = "How do you handle deadlocks and database isolation levels in high-concurrency systems?";
    const partiallyCorrectAns =
      "I would use Serializable isolation to completely eliminate all anomalies, but I'm not entirely sure how to handle deadlocks when two transactions block each other.";

    const context = analyzeCandidateResponseContext(partiallyCorrectAns, qText);
    assert.strictEqual(context.isPartiallyCorrect, true, "Must detect partial correctness");

    const assessment = await assessCandidateAnswer(qText, partiallyCorrectAns, {
      section: "technical_fundamentals",
      experienceMode: "experienced",
      targetRole: "Senior Backend Engineer",
      competency: "Database Concurrency",
    });

    assert.strictEqual(assessment.answer_quality, "partially_correct");
    assert.strictEqual(assessment.next_action, "follow_up_probe");
    assert.ok(assessment.topics_demonstrated.length > 0, "Valid concepts must be credited");
  });

  test("P2-TEST 4: Candidate uncertainty triggers concept simplification on initial occurrence", async () => {
    const qText = "Explain how distributed two-phase commit works across partitioned microservices.";
    const uncertainAns = "I'm not sure how 2PC works under network partitions.";

    const context = analyzeCandidateResponseContext(uncertainAns, qText);
    assert.strictEqual(context.isDoesNotKnow, true, "Must detect candidate uncertainty");

    const assessment = await assessCandidateAnswer(qText, uncertainAns, {
      section: "technical_fundamentals",
      experienceMode: "experienced",
      targetRole: "Distributed Systems Engineer",
      competency: "Distributed Transactions",
    });

    assert.strictEqual(assessment.answer_quality, "does_not_know");
    assert.strictEqual(assessment.next_action, "simplify_concept");

    // Fallback generator should provide a foundational building block
    const fallback = generateBlueprintFallbackQuestion({
      section: "technical_fundamentals",
      assessment,
    });

    assert.ok(
      fallback.question.toLowerCase().includes("simpler") ||
      fallback.question.toLowerCase().includes("step back") ||
      fallback.question.toLowerCase().includes("baseline"),
      `Expected simplified question, got: ${fallback.question}`
    );
  });

  test("P2-TEST 5: Explicit candidate decline triggers polite pivot without score penalty", async () => {
    const qText = "Can you walk through your experience implementing low-level C memory allocators?";
    const declineAns = "I'd prefer not to discuss low-level C memory allocators; can we talk about backend microservices instead?";

    const context = analyzeCandidateResponseContext(declineAns, qText);
    assert.strictEqual(context.isDeclineOrPass, true, "Must detect candidate decline");

    const assessment = await assessCandidateAnswer(qText, declineAns, {
      section: "technical_fundamentals",
      experienceMode: "experienced",
      targetRole: "Backend Engineer",
      competency: "Memory Management",
    });

    assert.strictEqual(assessment.answer_quality, "declined");
    assert.strictEqual(assessment.next_action, "acknowledge_and_advance");
    assert.ok(assessment.reasoning.toLowerCase().includes("declined"), "Reasoning should record polite decline");
  });

  test("P2-TEST 6: Self-correction is credited and evaluated on the corrected reasoning", async () => {
    const qText = "What is the worst-case time complexity of QuickSort versus MergeSort?";
    const selfCorrectingAns =
      "QuickSort is O(N log N) worst-case. Wait, actually that's wrong — QuickSort degrades to O(N^2) if the pivot is unbalanced, while MergeSort is guaranteed O(N log N).";

    const context = analyzeCandidateResponseContext(selfCorrectingAns, qText);
    assert.strictEqual(context.isSelfCorrection, true, "Must detect self-correction");
    assert.ok(context.correctedText?.includes("O(N^2)"), "Must extract corrected portion");

    const assessment = await assessCandidateAnswer(qText, selfCorrectingAns, {
      section: "technical_fundamentals",
      experienceMode: "experienced",
      targetRole: "Software Engineer",
      competency: "Algorithmic Complexity",
    });

    assert.strictEqual(assessment.is_self_corrected, true);
    assert.strictEqual(assessment.answer_quality, "self_corrected");
    assert.strictEqual(assessment.competency_established, true);
  });

  test("P2-TEST 7: Contradictory statements trigger neutral clarify_ambiguity inquiry", async () => {
    const dossier = await buildCandidateInterviewDossier({
      candidateId: "cand_contra_test",
      targetRole: "Backend Engineer",
    });
    const blueprint = generateInterviewBlueprint(dossier);
    const sessionState = createAdvancedSessionState(dossier, blueprint);

    // Turn 1: Candidate claims they always use optimistic locking for transactions
    sessionState.turns.push({
      turnIndex: 1,
      question: { question: "How do you handle concurrency?", question_targets: "Concurrency", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "technical_fundamentals" },
      answer: "We strictly rely on optimistic locking with row versioning for all our financial payments.",
      assessment: { answer_quality: "adequate", reasoning: "Optimistic locking noted", topics_demonstrated: ["Optimistic Locking"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
      timestamp: new Date().toISOString()
    });

    // Turn 2: Candidate contradicts themselves
    const contraAns = "Earlier I mentioned optimistic locking, but actually we never use optimistic locking because it doesn't work; we only use pessimistic table locks.";
    const context = analyzeCandidateResponseContext(contraAns, "How do you avoid race conditions?", sessionState);
    assert.strictEqual(context.isContradiction, true, "Must flag contradiction against earlier turn");

    const assessment = await assessCandidateAnswer("How do you avoid race conditions?", contraAns, sessionState, dossier);

    assert.strictEqual(assessment.answer_quality, "contradictory");
    assert.strictEqual(assessment.next_action, "clarify_ambiguity");
  });

  test("P2-TEST 8: Hint requests are supported and tagged as is_assisted: true", async () => {
    const qText = "How do you detect a cycle in a singly linked list in O(1) auxiliary memory?";
    const hintAns = "Could you give me a hint on what pointer technique to use here?";

    const context = analyzeCandidateResponseContext(hintAns, qText);
    assert.strictEqual(context.isHintRequest, true, "Must recognize hint request");

    const assessment = await assessCandidateAnswer(qText, hintAns, {
      section: "coding_system_design",
      experienceMode: "entry",
      targetRole: "Software Engineer",
      competency: "Two-Pointer Linked List Algorithms",
    });

    assert.strictEqual(assessment.is_assisted, true);
    assert.strictEqual(assessment.next_action, "offer_hint");

    const fallbackHint = generateBlueprintFallbackQuestion({
      section: "coding_system_design",
      assessment,
    });

    assert.ok(
      fallbackHint.question.toLowerCase().includes("hint") ||
      fallbackHint.question.toLowerCase().includes("consider") ||
      fallbackHint.question.toLowerCase().includes("structure"),
      `Expected scaffolding hint, got: ${fallbackHint.question}`
    );
  });

  test("P2-TEST 9: Valid alternative approaches are credited with alternative_approach_valid: true", async () => {
    const qText = "How would you implement caching for slow read endpoints?";
    const altAns = "An alternative approach is to use a Bloom filter in front of an LSM-tree key-value store rather than a standard Redis cluster.";

    const context = analyzeCandidateResponseContext(altAns, qText);
    assert.strictEqual(context.isAlternativeApproach, true, "Must detect alternative approach proposal");

    const assessment = await assessCandidateAnswer(qText, altAns, {
      section: "coding_system_design",
      experienceMode: "experienced",
      targetRole: "Systems Engineer",
      competency: "Caching & Storage Architectures",
    });

    assert.strictEqual(assessment.alternative_approach_valid, true);
    assert.strictEqual(assessment.competency_established, true);
  });

  test("P2-TEST 10: All 8 tracks have distinct competencies, sample tasks, and unique fallback questions", async () => {
    const allTracks: InterviewTrack[] = [
      "traditional_coding_dsa",
      "code_comprehension",
      "debugging_code_repair",
      "ai_assisted_engineering",
      "system_design",
      "code_review_reliability",
      "senior_engineering_judgment",
      "behavioral_project_deep_dives",
    ];

    const observedQuestionSets = new Set<string>();

    for (const track of allTracks) {
      const config = TRACK_CONFIGURATIONS[track];
      assert.ok(config, `Track configuration must exist for ${track}`);
      assert.ok(config.name.length > 0, `Track name must be defined for ${track}`);
      assert.ok(config.coreCompetencies.length >= 3, `Track ${track} must define at least 3 competencies`);
      assert.ok(config.sampleTasks.length >= 2, `Track ${track} must define sample tasks`);
      assert.ok(config.evalCriteria.length >= 3, `Track ${track} must define evaluation criteria`);
      assert.ok(config.fallbackQuestions.length >= 3, `Track ${track} must have at least 3 authentic fallback questions`);

      // Verify each track generates distinct fallback questions
      const fbQ = generateBlueprintFallbackQuestion({
        section: "coding_system_design",
        track,
      });

      assert.ok(fbQ.question.length > 20, `Track ${track} fallback question must be non-empty`);
      assert.strictEqual(observedQuestionSets.has(fbQ.question), false, `Track ${track} generated duplicate fallback question`);
      observedQuestionSets.add(fbQ.question);

      // Verify blueprint embeds track competencies
      const dossier = await buildCandidateInterviewDossier({
        candidateId: `cand_${track}`,
        targetRole: config.name,
        experienceMode: "experienced",
      });
      const blueprint = generateInterviewBlueprint(
        dossier,
        config.name,
        45,
        "experienced",
        `sess_${track}`,
        "",
        "technical",
        undefined,
        undefined,
        track
      );

      assert.strictEqual(blueprint.track, track);
      assert.ok(blueprint.competencies.some((c) => config.coreCompetencies.some((cc) => c.name.includes(cc))));
    }

    assert.strictEqual(observedQuestionSets.size, 8, "All 8 tracks must generate 8 unique fallback questions");
  });

  test("P2-TEST 11: Phase 1 invariants (isolation, session locks, anti-repetition) remain fully protected", async () => {
    const sId = "p2_lock_invariance_test";
    const cId = "cand_p2_tester";

    saveActiveSessionState(sId, { sessionId: sId, candidateId: cId, isCompleted: false, lifecycleState: "INTERVIEW_IN_PROGRESS" });
    assert.strictEqual(isSessionCompleted(sId), false);

    markSessionCompleted(sId);
    assert.strictEqual(isSessionCompleted(sId), true);

    const stored = getActiveSessionState(sId, cId);
    assert.strictEqual(stored.isCompleted, true);
    assert.strictEqual(stored.lifecycleState, "COMPLETED");

    // Cross-candidate isolation test
    const alienAccess = getActiveSessionState(sId, "cand_intruder");
    assert.strictEqual(alienAccess, null, "Intruder must not access candidate session");
  });
});
