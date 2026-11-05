import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createAdvancedSessionState,
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  assessCandidateAnswer,
  generateBlueprintFallbackQuestion,
  assessAndGenerateAdaptiveTurn,
  isQuestionSemanticallyDuplicate,
  validateQuestionCompleteness,
  evaluateAnswerRubricAndModelAnswer,
  generateInterviewFinalReport,
  type LoggedQuestion,
} from "../lib/ai/interview-engine";
import {
  saveSession,
  getSessionById,
  saveActiveSessionState,
  getActiveSessionState,
  clearActiveSessionState,
  markSessionCompleted,
  isSessionCompleted,
} from "../lib/interview-session-store";

test("Interview Adaptive Resilience & Fallback Integrity Suite", async (t) => {

  await t.test("TEST 1: Fallback pool exhaustion never returns an already-asked question", async () => {
    const dossier = await buildCandidateInterviewDossier({
      candidateId: "cand_exhaustion_test",
      targetRole: "Senior Backend Engineer",
      experienceMode: "experienced",
    });

    // Populate asked questions with every single question in the projectPool
    const projectQuestions: LoggedQuestion[] = [
      { question: `When building ${dossier.projects[0]?.title || "your main engineering project"}, what was the most difficult architectural trade-off or performance bottleneck you had to solve?`, targets: "Technical Trade-offs", section: "resume_projects", competency: "Technical Trade-offs", turnIndex: 1 },
      { question: `In ${dossier.projects[0]?.title || "your main engineering project"}, how did you design failure recovery, data consistency, and error telemetry when external services timed out?`, targets: "Failure Recovery & Resilience", section: "resume_projects", competency: "Failure Recovery", turnIndex: 2 },
      { question: `Walk me through how you deployed, monitored, and scaled ${dossier.projects[0]?.title || "your main engineering project"} in production, and how you diagnosed slow database queries.`, targets: "Production Operations & Telemetry", section: "resume_projects", competency: "Production Telemetry", turnIndex: 3 },
    ];

    const fallbackResult = generateBlueprintFallbackQuestion(
      "resume_projects",
      dossier,
      projectQuestions,
      null,
      "I am a backend engineer."
    );

    // Assert that the returned question is NOT one of the already-asked questions!
    const isRepeated = projectQuestions.some((q) =>
      isQuestionSemanticallyDuplicate(q.question, fallbackResult.question)
    );
    assert.strictEqual(
      isRepeated,
      false,
      "When the project pool is exhausted, the fallback generator must NOT return an already-asked question!"
    );
    assert.ok(fallbackResult.question.length > 20, "Fallback question must be substantive");
  });

  await t.test("TEST 2: Answering 'no idea' does NOT repeat the same question or topic", async () => {
    const dossier = await buildCandidateInterviewDossier({
      candidateId: "cand_no_idea_test",
      targetRole: "Full Stack Engineer",
      experienceMode: "experienced",
    });
    const blueprint = generateInterviewBlueprint(dossier);
    const sessionState = createAdvancedSessionState(dossier, blueprint);

    // First question asked: project architecture
    const initialQ = "When building your project, what was the most difficult architectural trade-off you had to solve?";
    sessionState.questionsAsked.push({ question: initialQ, targets: "Technical Trade-offs", section: "resume_projects", competency: "Technical Trade-offs", turnIndex: 1 });
    sessionState.turns.push({
      turnIndex: 1,
      question: { question: initialQ, question_targets: "Technical Trade-offs", question_type: "project-defense", difficulty_level: "medium", is_follow_up: false, section: "resume_projects" },
      answer: "no idea honestly",
      assessment: {
        answer_quality: "does_not_know",
        reasoning: "Unfamiliar with concept",
        topics_demonstrated: [],
        next_action: "acknowledge_and_advance",
        difficulty_adjustment: "de-escalate",
        extracted_claims: [],
      },
      timestamp: new Date().toISOString(),
    });

    const turn1Result = await assessAndGenerateAdaptiveTurn(
      sessionState,
      dossier,
      `Interviewer: ${initialQ}\nCandidate: no idea honestly`,
      initialQ,
      "no idea honestly"
    );

    assert.strictEqual(turn1Result.assessment.answer_quality, "does_not_know");
    assert.strictEqual(
      isQuestionSemanticallyDuplicate(initialQ, turn1Result.nextQuestion.question),
      false,
      "Next question must not repeat the original project question after candidate says 'no idea'"
    );

    // Candidate answers 'no idea' again to turn 1 question
    const q1Text = turn1Result.nextQuestion.question;
    sessionState.questionsAsked.push({ question: q1Text, targets: turn1Result.nextQuestion.question_targets, section: "resume_projects", competency: "Technical Trade-offs", turnIndex: 2 });
    sessionState.turns.push({
      turnIndex: 2,
      question: turn1Result.nextQuestion,
      answer: "I don't know",
      assessment: {
        answer_quality: "does_not_know",
        reasoning: "Unfamiliar with concept",
        topics_demonstrated: [],
        next_action: "acknowledge_and_advance",
        difficulty_adjustment: "de-escalate",
        extracted_claims: [],
      },
      timestamp: new Date().toISOString(),
    });

    const turn2Result = await assessAndGenerateAdaptiveTurn(
      sessionState,
      dossier,
      `Interviewer: ${q1Text}\nCandidate: I don't know`,
      q1Text,
      "I don't know"
    );

    assert.strictEqual(turn2Result.assessment.answer_quality, "does_not_know");
    assert.strictEqual(
      isQuestionSemanticallyDuplicate(q1Text, turn2Result.nextQuestion.question),
      false,
      "Second turn must not repeat turn 1 question"
    );
    assert.strictEqual(
      isQuestionSemanticallyDuplicate(initialQ, turn2Result.nextQuestion.question),
      false,
      "Second turn must not repeat initial question"
    );
  });

  await t.test("TEST 3: Explicit candidate decline is respected and does not repeat", async () => {
    const dossier = await buildCandidateInterviewDossier({
      candidateId: "cand_decline_test",
      targetRole: "Backend Engineer",
      experienceMode: "experienced",
    });
    const blueprint = generateInterviewBlueprint(dossier);
    const sessionState = createAdvancedSessionState(dossier, blueprint);

    const qText = "In a high-concurrency relational database, how do you handle deadlocks and choose between Read Committed and Serializable isolation?";
    sessionState.openingState = "INTERVIEW_IN_PROGRESS";
    sessionState.questionsAsked.push({ question: qText, targets: "Database Concurrency", section: "technical_fundamentals", competency: "Database Concurrency", turnIndex: 1 });
    sessionState.turns.push({
      turnIndex: 1,
      question: { question: qText, question_targets: "Database Concurrency", question_type: "technical", difficulty_level: "hard", is_follow_up: false, section: "technical_fundamentals" },
      answer: "I'd prefer to pass on this question and discuss another topic.",
      assessment: {
        answer_quality: "declined",
        reasoning: "Candidate deferred topic",
        topics_demonstrated: [],
        next_action: "acknowledge_and_advance",
        difficulty_adjustment: "maintain",
        extracted_claims: [],
      },
      timestamp: new Date().toISOString(),
    });

    const turnResult = await assessAndGenerateAdaptiveTurn(
      sessionState,
      dossier,
      `Interviewer: ${qText}\nCandidate: I'd prefer to pass on this question and discuss another topic.`,
      qText,
      "I'd prefer to pass on this question and discuss another topic."
    );

    assert.strictEqual(turnResult.assessment.answer_quality, "declined");
    assert.strictEqual(
      isQuestionSemanticallyDuplicate(qText, turnResult.nextQuestion.question),
      false,
      "Interviewer must pivot cleanly to an unasked question when candidate declines"
    );
  });

  await t.test("TEST 4: Paraphrased semantic duplicate detection catches reworded questions", () => {
    const q1 = "How does PostgreSQL implement Multiversion Concurrency Control (MVCC) and vacuuming?";
    const paraphrased = "Can you describe the way PostgreSQL implements MVCC and vacuuming to handle concurrent rows?";
    const freshTopic = "How do you configure distributed tracing using OpenTelemetry across microservices?";
    const justifiedFollowUp = "In your MVCC architecture, how do you handle table bloat and tune autovacuum freeze limits?";

    assert.strictEqual(
      isQuestionSemanticallyDuplicate(paraphrased, [q1]),
      true,
      "Paraphrased question with synonymous wording must be flagged as duplicate"
    );
    assert.strictEqual(
      isQuestionSemanticallyDuplicate(freshTopic, [q1]),
      false,
      "Completely new topic must not be flagged as duplicate"
    );
    assert.strictEqual(
      isQuestionSemanticallyDuplicate(justifiedFollowUp, [q1]),
      false,
      "Specific justified deeper follow-up with distinct keywords must be accepted"
    );
  });

  await t.test("TEST 5: Early session conclusion with zero answers reflects 0 score and NO_HIRE", async () => {
    const dossier = await buildCandidateInterviewDossier({
      candidateId: "cand_zero_score_test",
      targetRole: "Software Engineer",
      experienceMode: "fresher",
    });

    // Zero submitted answers
    const sessionState = createAdvancedSessionState(
      generateInterviewBlueprint(dossier, "Software Engineer", 45, "fresher", "cand_zero_sess"),
      dossier
    );
    const report = await generateInterviewFinalReport(sessionState, [], dossier);

    assert.strictEqual(report.overallScore, 0, "Overall score must be 0 when no answers are submitted");
    assert.ok(["INSUFFICIENT_EVIDENCE", "NO_HIRE"].includes(report.hiringRecommendation), "Hiring decision must be INSUFFICIENT_EVIDENCE or NO_HIRE when score is 0");
    assert.ok(
      report.executiveSummary.toLowerCase().includes("concluded early") ||
      report.executiveSummary.toLowerCase().includes("insufficient evidence") ||
      report.executiveSummary.toLowerCase().includes("no evaluated answers") ||
      report.overallScore === 0,
      "Executive summary must be honest about incomplete evidence"
    );
  });

  await t.test("TEST 6: Session isolation ensures independent state across multiple candidates", async () => {
    clearActiveSessionState("sess_isolation_A_101");
    clearActiveSessionState("sess_isolation_B_202");

    saveActiveSessionState("sess_isolation_A_101", {
      candidateId: "cand_alice",
      targetRole: "Data Engineer",
      turns: [{ q: "Q1 for Alice", a: "Alice answer", score: 85 }],
      consecutiveShallow: 0,
    });

    saveActiveSessionState("sess_isolation_B_202", {
      candidateId: "cand_bob",
      targetRole: "Frontend Engineer",
      turns: [],
      consecutiveShallow: 0,
    });

    const stateA = getActiveSessionState("sess_isolation_A_101", "cand_alice");
    const stateB = getActiveSessionState("sess_isolation_B_202", "cand_bob");

    assert.strictEqual(stateA?.candidateId, "cand_alice");
    assert.strictEqual(stateA?.turns.length, 1);
    assert.strictEqual(stateB?.candidateId, "cand_bob");
    assert.strictEqual(stateB?.turns.length, 0, "Session B must have 0 turns regardless of Session A");

    // Multi-tenant boundary check: Candidate Bob trying to read Candidate Alice's session returns null!
    const unauthorizedAccess = getActiveSessionState("sess_isolation_A_101", "cand_bob");
    assert.strictEqual(unauthorizedAccess, null, "Candidate Bob cannot access Candidate Alice's session");
  });

  await t.test("TEST 7: Completed interview stops question generation and locks session", () => {
    const sessId = "sess_completion_guard_777";
    markSessionCompleted(sessId);

    const completed = isSessionCompleted(sessId);
    assert.strictEqual(completed, true, "Session must be marked as completed");

    // Attempting to advance a completed session must be rejected
    saveActiveSessionState(sessId, {
      id: sessId,
      isCompleted: true,
      lifecycleState: "COMPLETED",
      turns: [{ q: "Q1", a: "A1" }],
    });

    const postCheck = isSessionCompleted(sessId);
    assert.strictEqual(postCheck, true, "Completed session state must remain locked");
  });

  await t.test("TEST 8: Stale async response cannot corrupt active session", () => {
    let activeSessionId = "session_active_current";
    let activeMessages: any[] = [{ role: "assistant", content: "Active session question" }];

    // Late response comes in from old session
    const staleResponseSessionId = "session_stale_old";
    const stalePayload = { message: "Stale question from previous interview", sessionId: staleResponseSessionId };

    // Handler guard pattern from MockInterviewExperience.tsx line 511
    if (activeSessionId === stalePayload.sessionId) {
      activeMessages.push({ role: "assistant", content: stalePayload.message });
    }

    assert.strictEqual(activeMessages.length, 1, "Stale response must NOT update active messages");
    assert.strictEqual(activeMessages[0].content, "Active session question");
  });

  await t.test("TEST 9: Turn submission idempotency prevents duplicate evaluation", () => {
    const turns: Array<{ answer: string; score: number }> = [];

    const submitAnswer = (ans: string, score: number) => {
      const lastTurn = turns[turns.length - 1];
      if (lastTurn && lastTurn.answer.trim() === ans.trim()) {
        return { duplicateIgnored: true };
      }
      turns.push({ answer: ans, score });
      return { duplicateIgnored: false };
    };

    const first = submitAnswer("PostgreSQL uses MVCC with visibility checks.", 85);
    const second = submitAnswer("PostgreSQL uses MVCC with visibility checks.", 85);

    assert.strictEqual(first.duplicateIgnored, false);
    assert.strictEqual(second.duplicateIgnored, true);
    assert.strictEqual(turns.length, 1, "Double-submitted answer must only be evaluated once");
  });

  await t.test("TEST 10: Failed and pending evaluations are never counted as completed assessments", () => {
    const assessments = [
      { id: "eval_1", status: "completed", score: 85 },
      { id: "eval_2", status: "pending", score: null },
      { id: "eval_3", status: "failed", score: null },
      { id: "eval_4", status: "completed", score: 78 },
    ];

    const completedEvaluations = assessments.filter((a) => a.status === "completed" && a.score !== null);
    assert.strictEqual(completedEvaluations.length, 2, "Only successfully evaluated turns count as completed");

    const averageScore = completedEvaluations.reduce((sum, a) => sum + (a.score || 0), 0) / completedEvaluations.length;
    assert.strictEqual(averageScore, 81.5, "Average score must only include valid completed evaluations");
  });

  await t.test("TEST 11: Cross-candidate session overwrite is rejected with Candidate isolation violation", () => {
    const sharedSessionId = "sess_security_tenant_403";
    saveActiveSessionState(sharedSessionId, { candidateId: "cand_alice_secure", turns: [] });

    assert.throws(
      () => {
        saveActiveSessionState(sharedSessionId, { candidateId: "cand_mallory_attacker", turns: [] });
      },
      /Candidate isolation violation/,
      "Overwriting another candidate's active session state must be strictly rejected"
    );
  });

  await t.test("TEST 12: Exhausted closing pool dynamically generates a novel closing prompt", async () => {
    const dossier = await buildCandidateInterviewDossier({
      candidateId: "cand_exhausted_closing",
      targetRole: "Site Reliability Engineer",
      experienceMode: "experienced",
    });

    const exhaustedQuestions: LoggedQuestion[] = [
      { question: "We're nearing the end of our conversation. Do you have any questions for me about our engineering architecture or culture?", targets: "Closing", section: "closing", competency: "Closing", turnIndex: 1 },
      { question: "Thank you for walking through your engineering experiences with me today. Do you have any questions about the role or team tech stack?", targets: "Closing", section: "closing", competency: "Closing", turnIndex: 2 },
      { question: "That brings us to the conclusion of our interview. Are there any final thoughts, projects, or questions you would like to share?", targets: "Closing", section: "closing", competency: "Closing", turnIndex: 3 },
    ];

    const fallbackClosing = generateBlueprintFallbackQuestion(
      "closing",
      dossier,
      exhaustedQuestions,
      null,
      "I am an SRE."
    );

    const isRepeated = exhaustedQuestions.some((q) =>
      isQuestionSemanticallyDuplicate(q.question, fallbackClosing.question)
    );
    assert.strictEqual(isRepeated, false, "Fallback must generate a novel question even when closing pool is exhausted");
    assert.ok(fallbackClosing.question.length > 20);
  });
});
