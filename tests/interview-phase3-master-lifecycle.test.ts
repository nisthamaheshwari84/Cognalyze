import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  InterviewTrack,
  TRACK_CONFIGURATIONS,
  normalizeInterviewTrack,
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  generateOpeningGreeting,
  generateNextAdaptiveQuestion,
  assessCandidateAnswer,
  assessAndGenerateAdaptiveTurn,
  determineFollowUpReason,
  generateInterviewFinalReport,
  commitInterviewEvidenceToDNA,
  validateLifecycleTransition,
  transitionLifecycleState,
  normalizeLifecycleState,
  isCandidateEarlyFinishRequest,
  invalidateCandidateDossierCache,
} from "../lib/ai/interview-engine";
import {
  saveActiveSessionState,
  getActiveSessionState,
  clearActiveSessionState,
  markSessionCompleted,
  isSessionCompleted,
  acquireTurnLock,
  releaseTurnLock,
} from "../lib/interview-session-store";
import { getStudentDNAFull } from "../lib/dna/store";

describe("Phase 3 Master Lifecycle Integration Suite: All 8 Stages & Tracks", () => {
  const ALL_TRACKS: InterviewTrack[] = [
    "traditional_coding_dsa",
    "code_comprehension",
    "debugging_code_repair",
    "ai_assisted_engineering",
    "system_design",
    "code_review_reliability",
    "senior_engineering_judgment",
    "behavioral_project_deep_dives",
  ];

  // ══════════════════════════════════════════════════════════════
  // SUITE 1: ALL 8 TRACKS COVERAGE & BLUEPRINT INITIALIZATION
  // ══════════════════════════════════════════════════════════════
  describe("Suite 1: All 8 Tracks Blueprint & Question Generation", () => {
    const candidateId = "cand_p3_master_tracks";
    const sampleResume = `
      Jordan Casey - Full Stack Systems Engineer
      Experience: 3 years
      Skills: TypeScript, Python, Go, React, PostgreSQL, Docker, Kubernetes, AWS.
      Projects:
      - CloudPulse: Distributed metrics telemetry pipeline processing 50k metrics/sec.
      - SafeDeploy: Automated CI/CD Canary deployment gating tool.
    `;
    const sampleJd = `
      Senior Software Engineer - Platform Engineering
      Requirements: Distributed systems, system design, code quality, incident recovery, AI workflows.
    `;

    test("1.1 All 8 tracks exist in TRACK_CONFIGURATIONS with required competencies & fallbacks", () => {
      assert.equal(ALL_TRACKS.length, 8, "Exactly 8 interview tracks must be supported");
      for (const track of ALL_TRACKS) {
        const config = TRACK_CONFIGURATIONS[track];
        assert.ok(config, `Track configuration for '${track}' must exist`);
        assert.equal(config.id, track);
        assert.ok(config.name.length > 0, `Track '${track}' must have a name`);
        assert.ok(config.coreCompetencies.length >= 3, `Track '${track}' must have at least 3 core competencies`);
        assert.ok(config.evalCriteria.length >= 3, `Track '${track}' must have evaluation criteria`);
        assert.ok(config.fallbackQuestions.length >= 3, `Track '${track}' must have at least 3 fallback questions`);
      }
    });

    test("1.2 Track normalization handles raw inputs, aliases, and defaults safely", () => {
      assert.equal(normalizeInterviewTrack("traditional_coding_dsa"), "traditional_coding_dsa");
      assert.equal(normalizeInterviewTrack("dsa"), "traditional_coding_dsa");
      assert.equal(normalizeInterviewTrack("code_comprehension"), "code_comprehension");
      assert.equal(normalizeInterviewTrack("debugging"), "debugging_code_repair");
      assert.equal(normalizeInterviewTrack("ai_assisted"), "ai_assisted_engineering");
      assert.equal(normalizeInterviewTrack("system_design"), "system_design");
      assert.equal(normalizeInterviewTrack("code_review"), "code_review_reliability");
      assert.equal(normalizeInterviewTrack("senior_judgment"), "senior_engineering_judgment");
      assert.equal(normalizeInterviewTrack("behavioral"), "behavioral_project_deep_dives");
      // Unknown defaults to traditional_coding_dsa
      assert.equal(normalizeInterviewTrack("unknown_track_xyz"), "traditional_coding_dsa");
    });

    for (const track of ALL_TRACKS) {
      test(`1.3 End-to-end blueprint & initial question generation for track: ${track}`, async () => {
        invalidateCandidateDossierCache();
        const dossier = await buildCandidateInterviewDossier(candidateId, sampleResume, sampleJd);
        const blueprint = generateInterviewBlueprint(
          dossier,
          "Senior Platform Engineer",
          45,
          "experienced",
          `sess_p3_track_${track}`,
          sampleJd,
          "technical",
          "Tier 1",
          "Distributed Systems",
          track
        );

        assert.equal(blueprint.track, track, `Blueprint track must be ${track}`);
        assert.ok(blueprint.sectionPlan.length >= 3, `Blueprint must have multiple sections in sectionPlan`);
        assert.ok(blueprint.competencies.length >= 3, `Blueprint must have competencies`);

        const sessionState = createAdvancedSessionState(blueprint, dossier, `sess_p3_track_${track}`);
        assert.equal(sessionState.track, track);
        assert.equal(sessionState.lifecycleState, "PLAN_READY");

        // Opening greeting
        const greeting = generateOpeningGreeting(dossier);
        assert.ok(greeting.question.length > 0, "Opening question must be generated");
        assert.equal(greeting.is_follow_up, false);

        // First technical adaptive question for track
        blueprint.currentSection = "technical_fundamentals";
        const q1 = await generateNextAdaptiveQuestion(sessionState, dossier, "", null);
        assert.ok(q1.question.length > 0, `Track ${track} must generate an adaptive technical question`);
        const target = q1.question_targets || q1.competency_focus || (q1 as any).competency_targeted;
        assert.ok(target && target.length > 0, `Track ${track} question must have a competency/question target`);
      });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE 2: LIFECYCLE STATE MACHINE VALIDATION & IMMUTABILITY
  // ══════════════════════════════════════════════════════════════
  describe("Suite 2: Lifecycle State Machine Transitions & Invariants", () => {
    test("2.1 Valid transitions succeed across full interview progression", () => {
      // PLAN_READY -> AWAITING_ANSWER
      const t1 = validateLifecycleTransition("PLAN_READY", "AWAITING_ANSWER");
      assert.equal(t1.allowed, true);

      // AWAITING_ANSWER -> EVALUATING_ANSWER
      const t2 = validateLifecycleTransition("AWAITING_ANSWER", "EVALUATING_ANSWER");
      assert.equal(t2.allowed, true);

      // EVALUATING_ANSWER -> FOLLOW_UP_REQUIRED
      const t3 = validateLifecycleTransition("EVALUATING_ANSWER", "FOLLOW_UP_REQUIRED");
      assert.equal(t3.allowed, true);

      // FOLLOW_UP_REQUIRED -> AWAITING_ANSWER
      const t4 = validateLifecycleTransition("FOLLOW_UP_REQUIRED", "AWAITING_ANSWER");
      assert.equal(t4.allowed, true);

      // EVALUATING_ANSWER -> ADVANCING_COMPETENCY
      const t5 = validateLifecycleTransition("EVALUATING_ANSWER", "ADVANCING_COMPETENCY");
      assert.equal(t5.allowed, true);

      // ADVANCING_COMPETENCY -> AWAITING_ANSWER
      const t6 = validateLifecycleTransition("ADVANCING_COMPETENCY", "AWAITING_ANSWER");
      assert.equal(t6.allowed, true);

      // AWAITING_ANSWER -> READY_TO_FINISH -> COMPLETED
      const t7 = validateLifecycleTransition("AWAITING_ANSWER", "READY_TO_FINISH");
      assert.equal(t7.allowed, true);
      const t8 = validateLifecycleTransition("READY_TO_FINISH", "COMPLETED");
      assert.equal(t8.allowed, true);
    });

    test("2.2 Pause and resume transitions maintain lifecycle integrity", () => {
      // Pause mid-interview
      const pauseCheck = validateLifecycleTransition("AWAITING_ANSWER", "PAUSED");
      assert.equal(pauseCheck.allowed, true);

      // Resume from paused
      const resumeCheck = validateLifecycleTransition("PAUSED", "AWAITING_ANSWER");
      assert.equal(resumeCheck.allowed, true);

      // Cancel from paused
      const cancelFromPaused = validateLifecycleTransition("PAUSED", "CANCELLED");
      assert.equal(cancelFromPaused.allowed, true);
    });

    test("2.3 Terminal state immutability: completed and cancelled sessions cannot transition", () => {
      // Completed session cannot return to active states
      const c1 = validateLifecycleTransition("COMPLETED", "AWAITING_ANSWER");
      assert.equal(c1.allowed, false, "Completed session cannot transition to AWAITING_ANSWER");
      assert.ok(c1.reason?.includes("terminal"));

      const c2 = validateLifecycleTransition("COMPLETED", "PLAN_READY");
      assert.equal(c2.allowed, false, "Completed session cannot transition to PLAN_READY");

      // Cancelled session cannot return to active states
      const c3 = validateLifecycleTransition("CANCELLED", "AWAITING_ANSWER");
      assert.equal(c3.allowed, false, "Cancelled session cannot transition to AWAITING_ANSWER");
    });

    test("2.4 transitionLifecycleState updates state and enforces completion flag", () => {
      const mockState: any = {
        sessionId: "sess_p3_lifecycle_trans",
        lifecycleState: "PLAN_READY",
        isCompleted: false,
      };

      // Valid advance
      const r1 = transitionLifecycleState(mockState, "AWAITING_ANSWER");
      assert.equal(r1.success, true);
      assert.equal(mockState.lifecycleState, "AWAITING_ANSWER");

      // Valid pause
      const r2 = transitionLifecycleState(mockState, "PAUSED");
      assert.equal(r2.success, true);
      assert.equal(mockState.lifecycleState, "PAUSED");

      // Valid resume
      const r3 = transitionLifecycleState(mockState, "AWAITING_ANSWER");
      assert.equal(r3.success, true);
      assert.equal(mockState.lifecycleState, "AWAITING_ANSWER");

      // Valid completion
      const r4 = transitionLifecycleState(mockState, "COMPLETED");
      assert.equal(r4.success, true);
      assert.equal(mockState.lifecycleState, "COMPLETED");
      assert.equal(mockState.isCompleted, true, "isCompleted must be true when reaching COMPLETED");

      // Invalid attempt to reopen completed session
      const r5 = transitionLifecycleState(mockState, "AWAITING_ANSWER");
      assert.equal(r5.success, false, "Must reject transition out of COMPLETED");
      assert.ok(r5.error?.includes("terminal"));
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE 3: BOUNDED ADAPTIVE FOLLOW-UPS & TOPIC TRAP PREVENTION
  // ══════════════════════════════════════════════════════════════
  describe("Suite 3: Adaptive Follow-up Clamping & Categorization", () => {
    test("3.1 Follow-up depth strictly bounded to max 1 per topic", async () => {
      const dossier = await buildCandidateInterviewDossier("cand_p3_bounded", "Candidate Resume", "Target JD");
      const blueprint = generateInterviewBlueprint(dossier, "Staff Engineer", 45, "experienced", "system_design");
      const sessionState = createAdvancedSessionState(blueprint, dossier, "sess_p3_bounded_followup");

      // Turn 1: shallow answer triggers a follow-up probe
      sessionState.followUpsOnCurrentTopic = 0;
      const turn1 = await assessAndGenerateAdaptiveTurn(
        sessionState,
        dossier,
        "",
        "How do you partition a distributed key-value store across nodes?",
        "We use consistent hashing with virtual nodes."
      );
      assert.ok(turn1.assessment, "Assessment returned");

      // Simulate follow-up was generated: increment follow-up counter
      sessionState.followUpsOnCurrentTopic = 1;

      // Turn 2: candidate gives another response. Bounding MUST clamp next_action to move_to_new_topic
      const turn2 = await assessAndGenerateAdaptiveTurn(
        sessionState,
        dossier,
        "",
        turn1.nextQuestion.question,
        "We use MD5 for hashing and place nodes on the ring."
      );

      assert.ok(
        ["move_to_new_topic", "acknowledge_and_advance", "advance_section"].includes(turn2.assessment.next_action),
        "When followUpsOnCurrentTopic >= 1, next_action MUST advance/move to new topic to prevent topic trap"
      );
      assert.equal(turn2.nextQuestion.is_follow_up, false, "Next question must not be a follow up probe");
    });

    test("3.2 determineFollowUpReason categorizes all probe types correctly", () => {
      // Unresolved concept
      const r1 = determineFollowUpReason(true, {
        answer_quality: "shallow",
        reasoning: "Did not explain write amplification",
        unresolved_threads: ["LSM tree compaction"],
        next_action: "follow_up_probe",
      } as any);
      assert.equal(r1, "test_unresolved_concept");

      // Verify claimed implementation
      const r2 = determineFollowUpReason(
        true,
        { answer_quality: "adequate", reasoning: "Examining resume claims", next_action: "follow_up_probe" } as any,
        "resume_projects",
        "What specific module did you write?"
      );
      assert.equal(r2, "verify_claimed_implementation");

      // Understand trade-offs
      const r3 = determineFollowUpReason(
        true,
        { answer_quality: "adequate", reasoning: "Trade-off analysis", next_action: "follow_up_probe" } as any,
        "coding_system_design",
        "What trade-off exists between latency and durability here?"
      );
      assert.equal(r3, "understand_trade_off");

      // Explore failure mode
      const r4 = determineFollowUpReason(
        true,
        null,
        "technical_fundamentals",
        "What failure occurs when leader node crashes unexpectedly?"
      );
      assert.equal(r4, "explore_failure_mode");

      // Resolve contradiction
      const r5 = determineFollowUpReason(true, {
        answer_quality: "contradictory",
        reasoning: "Stated synchronous yet lockless without queue",
        next_action: "clarify_ambiguity",
      } as any);
      assert.equal(r5, "resolve_contradiction");
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE 4: CONCURRENCY TURN LOCKING & STORE IDEMPOTENCY
  // ══════════════════════════════════════════════════════════════
  describe("Suite 4: Concurrency Locks & Store Safety", () => {
    test("4.1 acquireTurnLock prevents overlapping concurrent requests on same session", () => {
      const sessionId = "sess_p3_lock_test_01";
      releaseTurnLock(sessionId); // Ensure clean start

      // First acquire succeeds
      const acquired1 = acquireTurnLock(sessionId);
      assert.equal(acquired1, true, "First lock acquire must succeed");

      // Second concurrent acquire fails
      const acquired2 = acquireTurnLock(sessionId);
      assert.equal(acquired2, false, "Second concurrent lock acquire on same session MUST fail");

      // Release allows next acquisition
      releaseTurnLock(sessionId);
      const acquired3 = acquireTurnLock(sessionId);
      assert.equal(acquired3, true, "After release, lock acquisition succeeds");
      releaseTurnLock(sessionId);
    });

    test("4.2 Candidate session isolation prevents cross-tenant mutation", () => {
      const sessionId = "sess_p3_tenant_iso";
      clearActiveSessionState(sessionId);

      // Save state owned by Candidate Alpha
      saveActiveSessionState(sessionId, {
        sessionId,
        candidateId: "candidate_alpha",
        lifecycleState: "AWAITING_ANSWER",
      });

      // Attempt by Candidate Beta to mutate Candidate Alpha's session MUST throw
      assert.throws(
        () => {
          saveActiveSessionState(sessionId, {
            sessionId,
            candidateId: "candidate_beta",
            lifecycleState: "AWAITING_ANSWER",
          });
        },
        /Candidate isolation violation/,
        "Must reject mutation of session by unauthorized candidate"
      );

      clearActiveSessionState(sessionId);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE 5: EARLY FINISH, SKIP & HONEST FINAL EVALUATIONS
  // ══════════════════════════════════════════════════════════════
  describe("Suite 5: Early Finish & Honest Final Evaluations", () => {
    test("5.1 isCandidateEarlyFinishRequest recognizes standard finish phrasing", () => {
      assert.equal(isCandidateEarlyFinishRequest("I'd like to end the interview now."), true);
      assert.equal(isCandidateEarlyFinishRequest("Can we wrap up here?"), true);
      assert.equal(isCandidateEarlyFinishRequest("I need to stop the session."), true);
      assert.equal(isCandidateEarlyFinishRequest("Let's conclude the interview, thank you."), true);

      // False alarms correctly ignored
      assert.equal(isCandidateEarlyFinishRequest("We wrap the database query in a transaction."), false);
      assert.equal(isCandidateEarlyFinishRequest("I stop the event listener when unmounting."), false);
    });

    test("5.2 Zero answers early finish yields INSUFFICIENT_EVIDENCE / NO_HIRE without fake score", async () => {
      const dossier = await buildCandidateInterviewDossier("cand_p3_early_exit", "Resume", "JD");
      const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 45, "experienced", "traditional_coding_dsa");
      const sessionId = "sess_p3_zero_answers";
      const sessionState = createAdvancedSessionState(blueprint, dossier, sessionId);
      sessionState.lifecycleState = "READY_TO_FINISH";

      // 0 answers submitted
      const messages = [
        { role: "assistant", content: "Welcome! Tell me about your background." },
        { role: "user", content: "Can we conclude here? I have to go." },
      ];

      const report = await generateInterviewFinalReport(sessionState, messages, dossier);
      assert.ok(report, "Report generated");
      assert.equal(report.overallScore, 0, "Zero substantive answers must result in 0 score");
      assert.ok(
        ["INSUFFICIENT_EVIDENCE", "NO_HIRE"].includes(report.hiringRecommendation),
        "Recommendation must be INSUFFICIENT_EVIDENCE or NO_HIRE when 0 answers submitted"
      );
      assert.ok(
        report.executiveSummary.toLowerCase().includes("early") ||
        report.executiveSummary.toLowerCase().includes("concluded") ||
        report.executiveSummary.toLowerCase().includes("insufficient"),
        "Assessment must honestly acknowledge early conclusion"
      );
    });

    test("5.3 Substantive session generates comprehensive evidence-based report and commits to Student DNA", async () => {
      const dossier = await buildCandidateInterviewDossier("cand_p3_full_flow", "Resume", "JD");
      const blueprint = generateInterviewBlueprint(
        dossier,
        "Senior SDE",
        30,
        "experienced",
        "sess_p3_full_flow_done",
        "JD",
        "technical",
        "Tier 1",
        "Debugging",
        "debugging_code_repair"
      );
      blueprint.totalTargetTurns = 2;
      const sessionId = "sess_p3_full_flow_done";
      const sessionState = createAdvancedSessionState(blueprint, dossier, sessionId);

      sessionState.turns.push({
        turnIndex: 1,
        question: {
          question: "How do you systematically isolate intermittent memory leaks in Node.js?",
          question_targets: "Root Cause Isolation & Memory Profiling",
          question_type: "technical",
          difficulty_level: "hard",
          is_follow_up: false,
          section: "technical_fundamentals",
        },
        answer: "We capture heap snapshots at intervals, inspect retaining trees for uncollected closures and global event listeners, and analyze allocation timelines.",
        assessment: {
          answer_quality: "strong",
          reasoning: "Thorough understanding of heap snapshot diffing and retaining paths.",
          topics_demonstrated: ["V8 Heap Snapshots", "Retaining Trees", "Memory Leaks"],
          next_action: "acknowledge_and_advance",
          difficulty_adjustment: "maintain",
        },
        rubricScore: 90,
        timestamp: new Date().toISOString(),
      });

      sessionState.turns.push({
        turnIndex: 2,
        question: {
          question: "How do you verify the fix does not reintroduce concurrency deadlocks?",
          question_targets: "Regression Prevention & Concurrency",
          question_type: "technical",
          difficulty_level: "hard",
          is_follow_up: false,
          section: "technical_fundamentals",
        },
        answer: "We write automated concurrent stress tests under simulated load using k6 and add invariant assertions around lock acquisition order.",
        assessment: {
          answer_quality: "strong",
          reasoning: "Solid automated regression verification and lock ordering invariants.",
          topics_demonstrated: ["Stress Testing", "Lock Ordering Invariants"],
          next_action: "acknowledge_and_advance",
          difficulty_adjustment: "maintain",
        },
        rubricScore: 88,
        timestamp: new Date().toISOString(),
      });

      const messages = [
        { role: "assistant", content: sessionState.turns[0].question.question },
        { role: "user", content: sessionState.turns[0].answer },
        { role: "assistant", content: sessionState.turns[1].question.question },
        { role: "user", content: sessionState.turns[1].answer },
      ];

      const report = await generateInterviewFinalReport(sessionState, messages, dossier);
      assert.ok(report.overallScore >= 75, "Strong answer earns passing score");
      assert.ok(["HIRE", "STRONG_HIRE"].includes(report.hiringRecommendation));
      assert.ok(report.questionByQuestionAnalysis && report.questionByQuestionAnalysis.length >= 2);

      // Verify commit to DNA
      const commitRes = await commitInterviewEvidenceToDNA("cand_p3_full_flow", report);
      assert.equal(commitRes.success, true);
      assert.ok(commitRes.evidenceAdded >= 1);

      const dna = await getStudentDNAFull("cand_p3_full_flow");
      assert.ok(dna, "Student DNA updated with new verified evidence");
    });
  });
});
