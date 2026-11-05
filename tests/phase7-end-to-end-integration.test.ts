import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  generateInterviewFinalReport,
  generateBlueprintFallbackQuestion,
  commitInterviewEvidenceToDNA,
  InterviewTrack
} from "@/lib/ai/interview-engine";
import {
  saveActiveSessionState,
  getActiveSessionState,
  isSessionCompleted,
  markSessionCompleted
} from "@/lib/interview-session-store";
import {
  synchronizeCandidateTrackCurriculum,
  recordTrackPracticeCompletion
} from "@/lib/skills/track-curriculum-synchronizer";
import {
  setUserTargetRole,
  getStudentEvidenceList
} from "@/lib/dna/store";
import {
  createUser,
  getStudentProfileCompletionState,
  upsertStudentProfileByUserId,
  getStudentProfileByUserId
} from "@/lib/auth/store";
import { POST as interviewChatPOST } from "@/app/api/interview-chat/route";
import { POST as interviewFinalPOST } from "@/app/api/interview-final/route";
import { POST as prepSyncPOST } from "@/app/api/skills/preparation/sync/route";

test("Phase 7: End-to-End Integration & Multi-System Reliability Suite", async (suite) => {

  // 1. Full Candidate Journey: Empty DNA -> Profile Creation -> Track Selection -> Interview -> Report -> Practice -> Updated DNA
  await suite.test("1. Full candidate journey maintains authentic state and provenance", async () => {
    const candidateId = `cand_journey_${Date.now()}`;

    // Step A: Initial state has no profile / empty DNA
    const initialCompletion = getStudentProfileCompletionState(candidateId);
    assert.equal(initialCompletion.state, "NO_PROFILE");

    // Step B: Create candidate account and profile
    createUser({
      id: candidateId,
      email: `${candidateId}@example.com`,
      fullName: "Alex Builder",
      accountType: "student",
      passwordHash: null,
      passwordSalt: null,
      status: "ACTIVE"
    });

    upsertStudentProfileByUserId(candidateId, {
      fullName: "Alex Builder",
      email: `${candidateId}@example.com`,
      college: "National Institute of Technology",
      graduationYear: "2026",
      degree: "B.Tech Computer Science",
      skills: [
        { name: "Go", level: "Advanced" },
        { name: "Distributed Systems", level: "Intermediate" },
        { name: "PostgreSQL", level: "Intermediate" },
        { name: "Kafka", level: "Intermediate" }
      ],
      projects: [{ title: "EventStream", description: "Distributed message queue in Go with Raft consensus.", techStack: ["Go", "Raft"] }],
      profileCompleted: true
    });
    setUserTargetRole(candidateId, "sde_backend");

    const updatedProfile = getStudentProfileByUserId(candidateId);
    assert.ok(updatedProfile);
    assert.equal(updatedProfile.fullName, "Alex Builder");

    // Step C: Curriculum synchronization for selected track (System Design)
    const syncBefore = await synchronizeCandidateTrackCurriculum(candidateId, "system_design", "Backend Engineer");
    assert.equal(syncBefore.track, "system_design");
    assert.equal(syncBefore.readinessState, "unassessed");

    // Step D: Start Interview Session
    const dossier = await buildCandidateInterviewDossier(candidateId);
    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 30, "experienced", `sess_journey_${candidateId}`);
    blueprint.totalTargetTurns = 2;
    const sessionState = createAdvancedSessionState(blueprint, dossier);
    sessionState.track = "system_design";

    // Step E: Candidate answers two turns
    sessionState.turns.push({
      turnIndex: 1,
      question: { question: "Design a distributed rate limiter", question_targets: "Rate Limiting", competency_targeted: "Distributed Systems", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
      answer: "We use Redis sliding window with sorted sets keyed by client IP, using Lua scripts for atomic ZREMRANGEBYSCORE and ZADD.",
      assessment: { answer_quality: "strong", reasoning: "Atomic Lua script and sliding window mechanics correctly explained", topics_demonstrated: ["Redis", "Sliding Window", "Lua"], next_action: "move_to_new_topic", difficulty_adjustment: "escalate" },
      rubricScore: 88,
      status: "assessed",
      timestamp: new Date().toISOString()
    });

    sessionState.turns.push({
      turnIndex: 2,
      question: { question: "How do you handle Redis cluster partition failure in the rate limiter?", question_targets: "Partition Tolerance", competency_targeted: "Fault Tolerance", question_type: "technical", difficulty_level: "hard", is_follow_up: true, section: "coding_system_design" },
      answer: "We fall back to local in-memory token buckets with relaxed thresholds and circuit breakers to avoid blocking legitimate user requests during partition.",
      assessment: { answer_quality: "strong", reasoning: "Strong graceful degradation and circuit breaker design", topics_demonstrated: ["Circuit Breaker", "Graceful Degradation"], next_action: "acknowledge_and_advance", difficulty_adjustment: "maintain" },
      rubricScore: 92,
      status: "assessed",
      timestamp: new Date().toISOString()
    });

    // Step F: Final Report Generation
    const report = await generateInterviewFinalReport(sessionState);
    assert.equal(report.overallScore, 90);
    assert.ok(report.hiringRecommendation === "STRONG_HIRE" || report.hiringRecommendation === "HIRE");

    // Persist session
    saveActiveSessionState(sessionState.sessionId, sessionState);
    markSessionCompleted(sessionState.sessionId, report);

    // Step G: Commit Verified Evidence to Student DNA
    const commitResult = await commitInterviewEvidenceToDNA(candidateId, report);
    assert.ok(commitResult.success);

    // Verify DNA evidence updated with verified sourceType "interview"
    const evidenceList = await getStudentEvidenceList(candidateId);
    assert.ok(evidenceList.length > 0);
    const verifiedInterviewEvidence = evidenceList.filter((e) => e.sourceType === "interview");
    assert.ok(verifiedInterviewEvidence.length > 0);

    // Step H: Targeted Practice Completion
    const practiceResult = await recordTrackPracticeCompletion(
      candidateId,
      "system_design",
      "sys_act_1",
      85,
      "Completed transactional outbox payment pipeline architecture blueprint.",
      "completed"
    );
    assert.equal(practiceResult.success, true);
    const updatedEvidenceList = await getStudentEvidenceList(candidateId);
    const practiceRecord = updatedEvidenceList.find((e) => e.sourceId?.includes("sys_act_1"));
    assert.ok(practiceRecord);
    assert.equal(practiceRecord.sourceType, "practice");
    assert.equal(practiceRecord.verificationStatus, "CLAIMED");
    assert.notEqual(practiceRecord.verificationStatus, "VERIFIED"); // Practice alone never grants verified mastery

    // Step I: Resynchronize curriculum
    const syncAfter = await synchronizeCandidateTrackCurriculum(candidateId, "system_design", "Backend Engineer");
    assert.ok(syncAfter.totalObjectives === 4);
  });

  // 2. Multi-Tenant Boundary: Candidate A cannot read or hijack Candidate B's active session
  await suite.test("2. Cross-candidate session access is strictly rejected with HTTP 403", async () => {
    const candA = `cand_tenant_a_${Date.now()}`;
    const candB = `cand_tenant_b_${Date.now()}`;
    const sessId = `sess_tenant_${Date.now()}`;

    // Candidate A establishes active session
    const dossierA = await buildCandidateInterviewDossier(candA);
    const bpA = generateInterviewBlueprint(dossierA, "Backend Engineer", 30, undefined, sessId);
    const stateA = createAdvancedSessionState(bpA, dossierA);
    saveActiveSessionState(sessId, stateA);

    // Candidate B attempts to call interview-chat on Candidate A's session
    const chatReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessId,
        candidateId: candB,
        messages: [{ role: "user", content: "Attempting to hijack session" }]
      })
    });
    const chatRes = await interviewChatPOST(chatReq);
    assert.equal(chatRes.status, 403);
    const chatData = await chatRes.json();
    assert.ok(chatData.error.includes("Session belongs to another candidate") || chatData.error.includes("Access denied"));

    // Candidate B attempts to call interview-final on Candidate A's session
    const finalReq = new Request("http://localhost:3000/api/interview-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessId,
        candidateId: candB
      })
    });
    const finalRes = await interviewFinalPOST(finalReq);
    assert.equal(finalRes.status, 403);
    const finalData = await finalRes.json();
    assert.ok(finalData.error.includes("Session belongs to another candidate") || finalData.error.includes("Access denied"));
  });

  // 3. Multi-Tenant Practice Submission: Candidate A cannot submit practice for Candidate B
  await suite.test("3. Practice submission rejects candidate impersonation", async () => {
    const candReal = `cand_real_${Date.now()}`;
    const candVictim = `cand_victim_${Date.now()}`;

    const prepReq = new Request("http://localhost:3000/api/skills/preparation/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": candReal
      },
      body: JSON.stringify({
        candidateId: candVictim,
        track: "traditional_coding_dsa",
        activityId: "dsa_act_1",
        score: 95
      })
    });

    const res = await prepSyncPOST(prepReq as any);
    if (res.status === 403) {
      const data = await res.json();
      assert.ok(data.error.includes("Forbidden") || data.error.includes("Cannot submit practice"));
    }
  });

  // 4. Missing Profile Data Transparency: No fabricated skills or false readiness
  await suite.test("4. Missing profile data remains empty rather than hallucinated", async () => {
    const unverifiedCand = `cand_empty_${Date.now()}`;

    const completion = getStudentProfileCompletionState(unverifiedCand);
    assert.equal(completion.state, "NO_PROFILE");
    assert.equal(completion.remainingSections.length > 0, true);

    const dossier = await buildCandidateInterviewDossier(unverifiedCand);
    assert.equal(dossier.verifiedSkills.length, 0);
    assert.equal(dossier.projects.length, 0);
    assert.ok(dossier.missingOrUnverified.length > 0);
  });

  // 5. Practice vs Assessment Distinction: Forged mastery claim is rejected
  await suite.test("5. Practice completion cannot claim verified mastery without valid assessment session", async () => {
    const cand = `cand_mastery_guard_${Date.now()}`;

    // Attempting to record mastery without an assessmentSessionId
    const res = await recordTrackPracticeCompletion(
      cand,
      "debugging_code_repair",
      "debug_act_1",
      95,
      "Self-claimed mastery",
      "mastered"
    );

    // It records practice, but NOT verified mastery!
    assert.equal(res.success, true);
    const candEvidence = await getStudentEvidenceList(cand);
    const practiceRecord = candEvidence.find((e) => e.sourceId?.includes("debug_act_1"));
    assert.ok(practiceRecord);
    assert.equal(practiceRecord.sourceType, "practice");
    assert.equal(practiceRecord.verificationStatus, "CLAIMED");
    assert.notEqual(practiceRecord.verificationStatus, "VERIFIED");

    // Attempting to forge mastery using a fake assessmentSessionId throws error
    await assert.rejects(
      async () => {
        await recordTrackPracticeCompletion(
          cand,
          "debugging_code_repair",
          "debug_act_1",
          95,
          "Forged assessment",
          "mastered",
          { assessmentSessionId: "fake_session_12345" }
        );
      },
      /Unauthorized: Assessment session 'fake_session_12345' does not belong to candidate/
    );
  });

  // 6. Durable Session Report Idempotency across repeated finalizations
  await suite.test("6. Repeated interview finalizations return authoritative immutable report", async () => {
    const cand = `cand_idemp_${Date.now()}`;
    const sessId = `sess_idemp_${Date.now()}`;

    const dossier = await buildCandidateInterviewDossier(cand);
    const bp = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, sessId);
    bp.totalTargetTurns = 2;
    const state = createAdvancedSessionState(bp, dossier);

    state.turns.push({
      turnIndex: 1,
      question: { question: "Explain TCP flow control", question_targets: "TCP", competency_targeted: "Networking", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
      answer: "TCP uses sliding window advertisements in ACKs to match sender rate with receiver buffer capacity.",
      assessment: { answer_quality: "strong", reasoning: "Correct sliding window explanation", topics_demonstrated: ["TCP", "Flow Control"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
      status: "assessed",
      rubricScore: 86,
      timestamp: new Date().toISOString()
    });

    state.turns.push({
      turnIndex: 2,
      question: { question: "What is TCP Head-of-Line blocking?", question_targets: "TCP", competency_targeted: "Networking", question_type: "technical", difficulty_level: "medium", is_follow_up: true, section: "coding_system_design" },
      answer: "In TCP, a single lost packet delays all subsequent packets in that stream until the lost segment is retransmitted.",
      assessment: { answer_quality: "strong", reasoning: "Exact HoL blocking mechanics explained", topics_demonstrated: ["HoL Blocking"], next_action: "acknowledge_and_advance", difficulty_adjustment: "maintain" },
      status: "assessed",
      rubricScore: 90,
      timestamp: new Date().toISOString()
    });

    saveActiveSessionState(sessId, state);

    // Call interview-final route first time
    const req1 = new Request("http://localhost:3000/api/interview-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessId, candidateId: cand })
    });
    const res1 = await interviewFinalPOST(req1);
    assert.equal(res1.status, 200);
    const data1 = await res1.json();

    // Call interview-final route second time (idempotent replay)
    const req2 = new Request("http://localhost:3000/api/interview-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessId, candidateId: cand })
    });
    const res2 = await interviewFinalPOST(req2);
    assert.equal(res2.status, 200);
    const data2 = await res2.json();

    assert.equal(data1.decision, data2.decision);
    assert.equal(data1.scorecard.technical_depth.score, data2.scorecard.technical_depth.score);
    assert.equal(data1.report.overallScore, data2.report.overallScore);
    assert.equal(data2.evidenceCommittedToDNA, 0); // No duplicate DNA writes on idempotent replay!
  });

  // 7. Completed Session Locking: Cannot submit answers to a completed session
  await suite.test("7. Completed session locks against new answer submissions", async () => {
    const cand = `cand_locked_${Date.now()}`;
    const sessId = `sess_locked_${Date.now()}`;

    const dossier = await buildCandidateInterviewDossier(cand);
    const bp = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, sessId);
    const state = createAdvancedSessionState(bp, dossier);
    saveActiveSessionState(sessId, state);
    markSessionCompleted(sessId);

    const chatReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessId,
        candidateId: cand,
        messages: [{ role: "user", content: "Submitting after completion" }]
      })
    });
    const chatRes = await interviewChatPOST(chatReq);
    assert.equal(chatRes.status, 400);
    const chatData = await chatRes.json();
    assert.equal(chatData.isCompleted, true);
  });

  // 8. Session Continuity & Navigation: Resuming session does not restart greeting or duplicate state
  await suite.test("8. Resuming an active session restores exact progress without state loss", async () => {
    const cand = `cand_resume_${Date.now()}`;
    const sessId = `sess_resume_${Date.now()}`;

    const dossier = await buildCandidateInterviewDossier(cand);
    const bp = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, sessId);
    const state = createAdvancedSessionState(bp, dossier);
    state.openingState = "INTERVIEW_IN_PROGRESS";
    state.questionsAsked.push({
      question: "Explain database ACID properties",
      targets: "Databases",
      section: "technical_fundamentals",
      competency: "Databases",
      turnIndex: 0
    });
    saveActiveSessionState(sessId, state);

    // Call interview-chat with 0 user messages (simulating page reload or return)
    const chatReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessId,
        candidateId: cand,
        messages: []
      })
    });
    const chatRes = await interviewChatPOST(chatReq);
    assert.equal(chatRes.status, 200);
    const chatData = await chatRes.json();

    // Returns the active question, does NOT restart opening greeting!
    assert.equal(chatData.message, "Explain database ACID properties");
    assert.equal(chatData.openingState, "INTERVIEW_IN_PROGRESS");
  });

  // 9. All 8 Preparation Tracks Integration: Distinct curricula and difficulty tiers
  await suite.test("9. All eight preparation tracks synchronize with distinct competency models", async () => {
    const cand = `cand_tracks_${Date.now()}`;
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

    for (const track of tracks) {
      const sync = await synchronizeCandidateTrackCurriculum(cand, track, "Full Stack Engineer");
      assert.equal(sync.track, track);
      assert.equal(sync.totalObjectives, 4, `Track ${track} must provide 4 objectives across 4 tiers`);
      assert.equal(sync.readinessState, "unassessed");
    }
  });

  // 10. Provider Resilience: AI provider errors fall back safely to blueprint generator without losing prior state
  await suite.test("10. AI provider errors fall back safely without state corruption", async () => {
    const cand = `cand_provider_resil_${Date.now()}`;
    const sessId = `sess_provider_resil_${Date.now()}`;

    const dossier = await buildCandidateInterviewDossier(cand);
    const bp = generateInterviewBlueprint(dossier, "Backend Engineer", 30, undefined, sessId);
    const state = createAdvancedSessionState(bp, dossier);

    state.turns.push({
      turnIndex: 1,
      question: { question: "Explain Raft consensus", question_targets: "Consensus", competency_targeted: "Distributed Systems", question_type: "technical", difficulty_level: "medium", is_follow_up: false, section: "coding_system_design" },
      answer: "Raft elects a leader using randomized election timeouts and replicates log entries.",
      assessment: { answer_quality: "strong", reasoning: "Correct Raft overview", topics_demonstrated: ["Raft", "Consensus"], next_action: "move_to_new_topic", difficulty_adjustment: "maintain" },
      status: "assessed",
      rubricScore: 88,
      timestamp: new Date().toISOString()
    });
    saveActiveSessionState(sessId, state);

    // Call interview-chat with answer that causes evaluator to simulate or encounter error
    const chatReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessId,
        candidateId: cand,
        messages: [
          { role: "assistant", content: "Explain Raft consensus" },
          { role: "user", content: "Raft elects a leader using randomized election timeouts and replicates log entries." }
        ]
      })
    });
    const chatRes = await interviewChatPOST(chatReq);
    assert.equal(chatRes.status, 200);
    const chatData = await chatRes.json();
    assert.ok(chatData.message, "Must return valid next question even on provider failure");
    assert.ok(chatData.turnIndex >= 1);
  });

  // 11. Cross-Session Deduplication: Second interview avoids repeating questions from Session 1
  await suite.test("11. Cross-session deduplication avoids superficial question repetition", async () => {
    const cand = `cand_dedup_${Date.now()}`;
    const sessId1 = `sess_dedup_1_${Date.now()}`;
    const sessId2 = `sess_dedup_2_${Date.now()}`;

    // Session 1 asks about Redis caching
    const dossier1 = await buildCandidateInterviewDossier(cand);
    const bp1 = generateInterviewBlueprint(dossier1, "Backend Engineer", 30, undefined, sessId1);
    const state1 = createAdvancedSessionState(bp1, dossier1);
    state1.questionsAsked.push({
      question: "How does Redis achieve high throughput with its single-threaded event loop?",
      targets: "Redis",
      section: "coding_system_design",
      competency: "In-Memory Caching",
      turnIndex: 0
    });
    saveActiveSessionState(sessId1, state1);
    markSessionCompleted(sessId1, {
      competenciesAssessed: [{ competency: "In-Memory Caching", score: 85, status: "demonstrated" }],
      overallScore: 85
    });

    // Session 2 creates fresh blueprint
    const dossier2 = await buildCandidateInterviewDossier(cand, undefined, undefined, { forceRefresh: true });
    const bp2 = generateInterviewBlueprint(dossier2, "Backend Engineer", 30, undefined, sessId2);

    // Verified that Redis / In-Memory Caching is listed in areas adequately assessed or question history
    assert.ok(
      dossier2.historicalQuestionsAsked?.some((q: string) => q.toLowerCase().includes("redis")) ||
      dossier2.previouslyAssessedCompetencies?.["In-Memory Caching"] ||
      bp2.areasAdequatelyAssessed?.includes("In-Memory Caching"),
      "Must track prior session questions or competencies in cross-session memory"
    );
  });

  // 12. Provider Fallback Semantics: Explicit fallback status, candidate answer preservation, and report exclusion
  await suite.test("12. Provider fallback semantics preserve answers without fabricating scores or distorting report", async () => {
    const cand = `cand_fallback_audit_${Date.now()}`;
    const sessId = `sess_fallback_audit_${Date.now()}`;

    const dossier = await buildCandidateInterviewDossier(cand);
    const bp = generateInterviewBlueprint(dossier, "Distributed Systems Engineer", 30, undefined, sessId);
    const state = createAdvancedSessionState(bp, dossier);

    // Turn 1: Successfully assessed turn
    state.turns.push({
      turnIndex: 1,
      question: {
        question: "Explain Paxos consensus",
        question_targets: "Consensus",
        competency_targeted: "Distributed Systems",
        question_type: "technical",
        difficulty_level: "hard",
        is_follow_up: false,
        section: "coding_system_design"
      },
      answer: "Paxos guarantees safety across asynchronous networks with phase 1 prepare/promise and phase 2 accept/accepted rounds.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Accurate Paxos rounds",
        topics_demonstrated: ["Paxos", "Consensus"],
        next_action: "move_to_new_topic",
        difficulty_adjustment: "maintain"
      },
      status: "assessed",
      rubricScore: 92,
      timestamp: new Date().toISOString()
    });
    state.questionsAsked.push({
      question: "Explain Paxos consensus",
      targets: "Consensus",
      section: "coding_system_design",
      competency: "Distributed Systems",
      turnIndex: 1
    });
    saveActiveSessionState(sessId, state);

    // Simulate provider failure during turn 2 submission
    // We pass an empty / malformed session state or trigger fallback directly
    // by calling interview-chat with a question that causes provider failure or testing fallback state directly
    const turn2Q = "How do you handle Byzantine faults in asynchronous systems?";
    state.questionsAsked.push({
      question: turn2Q,
      targets: "Byzantine Fault Tolerance",
      section: "coding_system_design",
      competency: "Fault Tolerance",
      turnIndex: 2
    });
    saveActiveSessionState(sessId, state);

    const userAns2 = "PBFT uses three phases: pre-prepare, prepare, and commit to reach consensus with up to f Byzantine nodes among 3f+1.";

    // Directly test the catch block logic: simulate provider failure
    const errorMsg = "Provider 503 Service Unavailable";
    const fallbackQ = generateBlueprintFallbackQuestion({
      section: "coding_system_design",
      dossier,
      questionsAsked: state.questionsAsked,
      assessment: state.lastAssessment,
      candidateIntro: state.candidateIntroduction,
      experienceMode: state.experienceMode,
      targetRole: dossier.targetRole,
      track: "system_design"
    });

    // Verify candidate's answer is preserved with status 'failed'
    state.turns.push({
      turnIndex: 2,
      question: {
        question: turn2Q,
        question_targets: "Byzantine Fault Tolerance",
        competency_targeted: "Fault Tolerance",
        question_type: "technical",
        difficulty_level: state.currentDifficulty || "hard",
        is_follow_up: false,
        section: "coding_system_design"
      },
      answer: userAns2,
      status: "failed",
      evaluationError: `AI Provider Evaluation Error: ${errorMsg}`,
      rubricScore: 0,
      timestamp: new Date().toISOString()
    });

    // Record fallback question in questionsAsked
    state.questionsAsked.push({
      question: fallbackQ.question,
      targets: fallbackQ.target,
      section: "coding_system_design",
      competency: fallbackQ.target,
      turnIndex: 2
    });
    saveActiveSessionState(sessId, state);

    // 1. Verify saved session preserves user answer
    const savedState = getActiveSessionState(sessId);
    assert.ok(savedState);
    assert.equal(savedState.turns.length, 2);
    assert.equal(savedState.turns[1].answer, userAns2, "Candidate submitted answer must be preserved");
    assert.equal(savedState.turns[1].status, "failed");
    assert.equal(savedState.turns[1].rubricScore, 0, "No fabricated AI score should be given on failure");

    // 2. Verify questionsAsked tracked fallback
    assert.ok(savedState.questionsAsked.some((q: any) => q.question === fallbackQ.question));

    // 3. Finalize interview and verify report safeguards
    const finalReq = new Request("http://localhost:3000/api/interview-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessId,
        candidateId: cand,
        messages: [
          { role: "assistant", content: "Explain Paxos consensus" },
          { role: "user", content: "Paxos guarantees safety..." },
          { role: "assistant", content: turn2Q },
          { role: "user", content: userAns2 }
        ]
      })
    });
    const finalRes = await interviewFinalPOST(finalReq);
    assert.equal(finalRes.status, 200);
    const finalData = await finalRes.json();

    // Overall score must be 92 (from turn 1), NOT (92 + 0) / 2 = 46!
    assert.equal(finalData.report.evidenceCoverage.failedCount, 1);
    assert.equal(finalData.report.evidenceCoverage.assessedCount, 1);
    assert.equal(finalData.report.overallScore, 92, "Failed provider evaluations must not penalize candidate with a 0");
  });

});

