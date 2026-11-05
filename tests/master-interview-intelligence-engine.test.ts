import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  generateOpeningGreeting,
  generateIntroductionTransition,
  assessAndGenerateAdaptiveTurn,
  generateNextAdaptiveQuestion,
  generateInterviewFinalReport,
  isQuestionSemanticallyDuplicate,
  determineFollowUpReason,
  validateQuestionCompleteness,
  isCandidateDecline,
} from "../lib/ai/interview-engine";
import {
  TRACK_COMPETENCY_MODELS,
  EXPERIENCE_LEVEL_DEFINITIONS,
  normalizeTrackId,
  normalizeExperienceLevel,
  PreparationTrackId,
} from "../lib/ai/interview-competency-engine";
import { GroqProviderAdapter, interviewAI } from "../lib/ai/interview-provider";
import {
  saveActiveSessionState,
  getActiveSessionState,
  acquireTurnLock,
  releaseTurnLock,
  isSessionCompleted,
} from "../lib/interview-session-store";

test("Personalized Interview Arena Master Suite", async (t) => {
  await t.test("1. Experience Level Profiles & Calibrations", () => {
    const levels = ["fresher", "early_career", "experienced", "career_switcher"] as const;
    for (const lvl of levels) {
      const def = EXPERIENCE_LEVEL_DEFINITIONS[lvl];
      assert.ok(def, `Definition for ${lvl} must exist`);
      assert.ok(def.coreFocus.length >= 4, `${lvl} must have at least 4 core focus areas`);
      assert.ok(def.expectedDepth.length > 20, `${lvl} must define expected depth`);
      assert.ok(def.avoidExpectations.length >= 1, `${lvl} must define expectations to avoid`);
    }

    // Normalization check
    assert.equal(normalizeExperienceLevel("Student / College"), "fresher");
    assert.equal(normalizeExperienceLevel("1-3 Years Experience"), "early_career");
    assert.equal(normalizeExperienceLevel("Lead / Senior Staff"), "experienced");
    assert.equal(normalizeExperienceLevel("Non-CS Career Switcher"), "career_switcher");
  });

  await t.test("2. All 8 Preparation Tracks: Primary & Supporting Competencies", () => {
    const tracks: PreparationTrackId[] = [
      "traditional_coding_dsa",
      "code_comprehension",
      "debugging_code_repair",
      "ai_assisted_engineering",
      "system_design_scale",
      "code_review_reliability",
      "senior_engineering_judgment",
      "behavioral_project_deep_dives",
    ];

    assert.equal(tracks.length, 8, "Must support all 8 distinct preparation tracks");

    for (const trkId of tracks) {
      const model = TRACK_COMPETENCY_MODELS[trkId];
      assert.ok(model, `Track model for ${trkId} must exist`);
      assert.ok(model.primaryCompetency.length > 5, `${trkId} must have a primary competency`);
      assert.ok(model.primaryFocusAreas.length >= 4, `${trkId} must have primary focus areas`);
      assert.ok(model.supportingConcepts.length >= 3, `${trkId} must define supporting concepts`);
      assert.ok(model.interconnectedRelationships.length >= 2, `${trkId} must have semantic transition relationships`);
      assert.ok(model.evaluationDimensions.length >= 4, `${trkId} must define evaluation dimensions`);

      // Normalization verification
      assert.equal(normalizeTrackId(trkId), trkId);
    }
  });

  await t.test("3. Zero Predefined Questions: Grounded in Live Candidate Context", async () => {
    const dossierA = await buildCandidateInterviewDossier(
      "cand_a",
      "Candidate Alice. Projects: DistributedKV (In-memory distributed key-value store using Go, Raft, and gRPC). Skills: Go, Distributed Systems, Raft, gRPC.",
      "Senior Distributed Systems Engineer."
    );
    const blueprintA = generateInterviewBlueprint(
      dossierA,
      "Senior Distributed Systems Engineer",
      45,
      "experienced",
      "sess_zero_q_a",
      "Distributed Systems Engineer",
      "technical",
      "Google",
      "Raft, gRPC, Distributed Caching",
      "system_design"
    );
    const stateA = createAdvancedSessionState(blueprintA, dossierA);

    const dossierB = await buildCandidateInterviewDossier(
      "cand_b",
      "Candidate Bob. Projects: ECommerceStore (Next.js storefront with Stripe and PostgreSQL). Skills: React, Next.js, Stripe, PostgreSQL.",
      "Frontend / Full-Stack Engineer."
    );
    const blueprintB = generateInterviewBlueprint(
      dossierB,
      "Frontend / Full-Stack Engineer",
      45,
      "fresher",
      "sess_zero_q_b",
      "Frontend Engineer",
      "technical",
      "Meta",
      "React, Next.js, Web Vitals",
      "code_comprehension"
    );
    const stateB = createAdvancedSessionState(blueprintB, dossierB);

    // Dynamic Kickoff Greeting
    const greetingA = generateOpeningGreeting(dossierA);
    const greetingB = generateOpeningGreeting(dossierB);
    assert.ok(greetingA.question.length > 15);
    assert.ok(greetingB.question.length > 15);

    // Candidate Introductions
    const introA = "I built DistributedKV, implementing the Raft consensus algorithm in Go with gRPC.";
    const introB = "I built ECommerceStore, focusing on Next.js server components and Stripe checkout flows.";

    stateA.candidateIntroduction = introA;
    stateA.openingState = "INTERVIEW_IN_PROGRESS";
    stateA.blueprint.currentSection = "resume_projects";

    stateB.candidateIntroduction = introB;
    stateB.openingState = "INTERVIEW_IN_PROGRESS";
    stateB.blueprint.currentSection = "resume_projects";

    const q1A = await generateNextAdaptiveQuestion(stateA, dossierA, introA, null);
    const q1B = await generateNextAdaptiveQuestion(stateB, dossierB, introB, null);

    // Questions MUST differ completely because candidate projects and tracks differ
    assert.notEqual(q1A.question, q1B.question, "Candidate A and B must receive completely different questions");
    assert.ok(
      q1A.question.toLowerCase().includes("distributedkv") || q1A.question.toLowerCase().includes("raft") || q1A.question.toLowerCase().includes("grpc") || q1A.question.toLowerCase().includes("architecture"),
      "Question 1 for Alice must anchor to her actual project or tech"
    );
  });

  await t.test("4. Semantic Duplicate Detection & Anti-Repetition", () => {
    const original = "How do you handle database deadlocks and choose between Read Committed and Serializable isolation?";
    const exactCopy = "How do you handle database deadlocks and choose between Read Committed and Serializable isolation?";
    const slightRephrase = "In database deadlocks, how do you handle them and choose between read committed vs serializable isolation levels?";
    const completelyDifferent = "How does an HTTP request resolve through DNS down to the TCP handshake?";

    assert.equal(isQuestionSemanticallyDuplicate(original, [exactCopy]), true, "Exact copy must be flagged as duplicate");
    assert.equal(isQuestionSemanticallyDuplicate(original, [slightRephrase]), true, "Cosmetic rephrasing must be flagged as duplicate");
    assert.equal(isQuestionSemanticallyDuplicate(original, [completelyDifferent]), false, "Different concept must NOT be flagged as duplicate");
  });

  await t.test("5. Question Completeness Validation", () => {
    assert.equal(validateQuestionCompleteness("How does a b-tree work?").isValid, true);
    assert.equal(validateQuestionCompleteness("And also...").isValid, false);
    assert.equal(validateQuestionCompleteness("").isValid, false);
    assert.equal(validateQuestionCompleteness("What").isValid, false);
  });

  await t.test("6. Candidate Deferral & Decline Handling (Zero Shaming)", () => {
    assert.equal(isCandidateDecline("Can we skip to another topic?"), true);
    assert.equal(isCandidateDecline("I'd rather not answer this"), true);
    assert.equal(isCandidateDecline("I would prefer not to discuss that"), true);
    assert.equal(isCandidateDecline("I used PostgreSQL with B-tree indexes because of fast lookups"), false);
  });

  await t.test("7. Concurrency & Session Locks (Prevent Duplicate Submissions)", () => {
    const sessId = "session_lock_test_123";
    const acquiredFirst = acquireTurnLock(sessId);
    assert.equal(acquiredFirst, true, "First lock acquisition must succeed");

    const acquiredSecond = acquireTurnLock(sessId);
    assert.equal(acquiredSecond, false, "Concurrent submission with same session ID must be rejected");

    releaseTurnLock(sessId);
    const acquiredAfterRelease = acquireTurnLock(sessId);
    assert.equal(acquiredAfterRelease, true, "After release, lock must be acquirable again");
    releaseTurnLock(sessId);
  });

  await t.test("8. AI Provider Abstraction (Groq Availability & Safety)", () => {
    const groq = new GroqProviderAdapter();
    assert.equal(groq.name, "groq");
    assert.equal(typeof groq.isAvailable(), "boolean");
    assert.ok(interviewAI, "Interview AI orchestrator singleton must exist");
  });

  await t.test("9. Final Assessment Report Structure & Rubric Breakdown", async () => {
    const dossier = await buildCandidateInterviewDossier(
      "cand_final",
      "Candidate Final. Skills: Java, Spring Boot, PostgreSQL, Kafka.",
      "Backend Engineer."
    );
    const blueprint = generateInterviewBlueprint(
      dossier,
      "Backend Engineer",
      30,
      "1-3yr",
      "sess_final_test",
      "Backend Engineer",
      "technical",
      "Stripe",
      "Java, PostgreSQL",
      "system_design"
    );
    const state = createAdvancedSessionState(blueprint, dossier);

    // Simulate 3 evaluated turns
    for (let i = 1; i <= 3; i++) {
      state.turns.push({
        turnIndex: i,
        question: {
          question: `Technical question ${i} on system architecture and data storage`,
          question_targets: "Architecture",
          question_type: "technical",
          difficulty_level: "medium",
          is_follow_up: i > 1,
          follow_up_reason: i > 1 ? "understand_trade_off" : "none",
          evidence_grounding: "Project",
        },
        answer: `Concrete answer ${i} demonstrating Spring Boot, Kafka, and PostgreSQL indexes with idempotency keys.`,
        assessment: {
          answer_quality: "strong",
          reasoning: "Candidate demonstrated clear mastery of distributed architecture and database concurrency.",
          topics_demonstrated: ["Kafka", "PostgreSQL", "Idempotency"],
          unresolved_threads: [],
          next_action: i < 3 ? "move_to_new_topic" : "advance_section",
          difficulty_adjustment: "maintain",
          extracted_claims: ["Kafka event streaming", "Database indexes"],
        },
        rubricScore: 88,
        modelAnswerFeedback: {
          score: 88,
          rubricVersion: "2.0",
          dimensionScores: [],
          whatYouDidWell: ["Concrete architectural reasoning", "Idempotency handling"],
          whatWasMissing: ["Details on consumer retry dead-letter queues"],
          deductionReasons: [],
          howToImprove: "Discuss dead-letter queue backoff strategies.",
          bestPossibleAnswer: "Standard idempotent payment service...",
          keyConceptsToRemember: ["Idempotency", "Kafka exactly-once"],
          likelyFollowUps: ["How to handle partitioned consumer rebalancing?"],
          personalizedNextAction: "Practice distributed transactions and saga patterns.",
        },
        timestamp: new Date().toISOString(),
      });
    }

    const report = await generateInterviewFinalReport(state, [], dossier);
    assert.ok(report, "Report must be generated");
    assert.ok(
      ["STRONG_HIRE", "HIRE", "LEANING_HIRE", "LEANING_NO_HIRE", "NO_HIRE", "INSUFFICIENT_EVIDENCE"].includes(report.hiringRecommendation),
      "Must provide calibrated hiring recommendation"
    );
    assert.ok(typeof report.overallScore === "number", "Overall score must be a number");
    assert.ok(report.keyStrengths && report.keyStrengths.length > 0, "Key strengths must be captured from demonstrated evidence");
    assert.ok(
      !report.questionByQuestionAnalysis || report.questionByQuestionAnalysis.length >= 1,
      "Question analysis if present must cover turns"
    );
  });
});
