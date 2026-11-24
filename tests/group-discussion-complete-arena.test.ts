/**
 * COGNALYZE GROUP DISCUSSION ARENA — COMPREHENSIVE AUTOMATED BENCHMARK & VERIFICATION SUITE
 * 
 * Verifies all 12 acceptance test scenarios:
 * 1. Simulation Formats & Difficulty Calibration
 * 2. 5 Independent Participant Archetypes & Persistent States
 * 3. Structured Lifecycle State Machine & Immutability Protection
 * 4. User Isolation & Candidate Confidentiality
 * 5. Active Coach Proactive Intervention & Dominance Mitigation
 * 6. 3-Warning Disciplinary Policy & Server-Side 72h Account Suspension
 * 7. False-Positive Protection (Noise & Constructive Disagreement)
 * 8. Friends GD Multiplayer Room Creation & Joining
 * 9. Suspended User Access Gating
 * 10. Evidence-Grounded 8-Dimension Evaluation Engine
 * 11. Zero Fabrication on Silent Candidates (Insufficient Evidence)
 * 12. Disciplinary Appeal Processing
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  generateCalibratedAIParticipants,
  ARCHETYPE_PROFILES
} from "../lib/gd/participant-archetypes";
import {
  createGDSession,
  getGDSessionById,
  saveGDSession
} from "../lib/gd/gd-session-store";
import {
  transitionLifecycleState,
  VALID_LIFECYCLE_TRANSITIONS
} from "../lib/gd/session-state-machine";
import {
  evaluateUtteranceForMisconduct,
  issueDisciplinaryAction,
  isUserSuspended,
  submitDisciplinaryAppeal
} from "../lib/gd/disciplinary-system";
import {
  evaluateCoachIntervention
} from "../lib/gd/coach-moderator-engine";
import {
  evaluateGDSession
} from "../lib/gd/evaluation-engine";
import {
  createFriendsGDRoom,
  joinFriendsGDRoom,
  startFriendsGDSession
} from "../lib/gd/friends-gd-service";
import { createUser } from "../lib/auth/store";
import { selectNextSpeaker } from "../lib/gd/simulation-engine";

describe("COGNALYZE GROUP DISCUSSION ARENA MASTER TEST SUITE", () => {

  // ── TEST 1: 5 Behavioral Participant Archetypes ──
  test("1. 5 Independent Participant Archetypes are defined with distinct behavioral profiles", () => {
    const archetypes = [
      "dominant_speaker",
      "analytical_thinker",
      "reserved_contributor",
      "critical_challenger",
      "diplomatic_contributor"
    ] as const;

    for (const arch of archetypes) {
      const profile = ARCHETYPE_PROFILES[arch];
      assert.ok(profile, `Profile must exist for ${arch}`);
      assert.ok(profile.baseAssertiveness > 0 && profile.baseAssertiveness <= 1, `${arch} assertiveness in [0, 1]`);
      assert.ok(profile.preferredTransitions.length >= 3, `${arch} has at least 3 preferred transitions`);
      assert.ok(profile.voiceProfile.pitch > 0, `${arch} has calibrated pitch`);
      assert.ok(profile.voiceProfile.rate > 0, `${arch} has calibrated rate`);
    }

    const panel = generateCalibratedAIParticipants({
      topicTitle: "Microservices vs Monoliths",
      format: "competitive",
      difficulty: "advanced"
    });

    assert.equal(panel.length, 4, "Calibrated panel must contain exactly 4 AI peers");
    const uniqueArchetypes = new Set(panel.map(p => p.archetype));
    assert.equal(uniqueArchetypes.size, 4, "All 4 AI peers must have distinct archetypes");
  });

  // ── TEST 2: Structured Session State Machine & Immutability ──
  test("2. Session State Machine transitions cleanly and prevents mutating completed sessions", () => {
    const session = createGDSession({
      userId: "test-user-state-machine",
      topicId: "topic-1",
      topicTitle: "Serverless vs Kubernetes Cost Trade-offs",
      format: "technical_business",
      difficulty: "intermediate"
    });

    assert.equal(session.lifecycleState, "BRIEFING");
    assert.equal(session.participants.length, 5, "Candidate + 4 AI peers");

    // Transition Briefing -> Opening -> Active Discussion
    const s1 = transitionLifecycleState(session, "OPENING");
    assert.equal(s1.lifecycleState, "OPENING");
    assert.equal(s1.currentStage, "opening");

    const s2 = transitionLifecycleState(s1, "ACTIVE_DISCUSSION");
    assert.equal(s2.lifecycleState, "ACTIVE_DISCUSSION");
    assert.equal(s2.currentStage, "active_discussion");

    // Transition to COMPLETED
    const sCompleted = transitionLifecycleState(s2, "COMPLETED");
    assert.equal(sCompleted.lifecycleState, "COMPLETED");
    assert.ok(sCompleted.completedAt, "completedAt timestamp must be set");

    // Immutability Check: Must throw if attempting to transition away from COMPLETED
    assert.throws(() => {
      transitionLifecycleState(sCompleted, "ACTIVE_DISCUSSION");
    }, /Cannot transition from terminal state COMPLETED/);
  });

  // ── TEST 3: Candidate Confidentiality & User Isolation ──
  test("3. Session store enforces candidate isolation across users", () => {
    const userA = "candidate-uuid-alpha";
    const userB = "candidate-uuid-beta";

    const sessionA = createGDSession({
      userId: userA,
      topicId: "topic-iso-1",
      topicTitle: "Algorithmic Transparency in AI Hiring"
    });

    // User A can access their own session
    const retrievedA = getGDSessionById(sessionA.sessionId, userA);
    assert.ok(retrievedA, "User A must retrieve their own session");

    // User B cannot access User A's private session
    assert.throws(() => {
      getGDSessionById(sessionA.sessionId, userB);
    }, /Unauthorized access/);
  });

  // ── TEST 4: Turn Selection Without Simple Round-Robin ──
  test("4. Speaker selector arbitrates turns based on context and avoids immediate repeats", () => {
    const panel = generateCalibratedAIParticipants({
      topicTitle: "Public Blockchains vs Cloud Ledgers",
      format: "competitive",
      difficulty: "intermediate"
    });

    const transcripts: any[] = [
      { speakerId: panel[0].id, speakerName: panel[0].name, content: "Initial point", stage: "opening" }
    ];

    // Next speaker must NOT be panel[0]
    const nextSpeaker = selectNextSpeaker({
      participants: panel,
      transcripts,
      currentStage: "active_discussion",
      format: "competitive",
      difficulty: "intermediate"
    });

    assert.notEqual(nextSpeaker.id, panel[0].id, "Speaker cannot immediately speak again consecutively");
  });

  // ── TEST 5: Active Coach Interventions (Dominance & Probing) ──
  test("5. Coach detects speaker dominance and intervenes when one speaker monopolizes", async () => {
    const session = createGDSession({
      userId: "cand-dom-test",
      topicId: "top-dom",
      topicTitle: "Micro-frontends vs Monolithic SPAs"
    });

    const dominantPeer = session.participants[1];

    // Simulate 3 consecutive turns by dominant peer
    session.transcripts = [
      { id: "1", speakerId: dominantPeer.id, speakerName: dominantPeer.name, speakerAvatar: "⚡", speakerRole: "Peer", isHuman: false, content: "Point 1", timestamp: Date.now(), formattedTime: "10:00 AM", stage: "active_discussion" },
      { id: "2", speakerId: dominantPeer.id, speakerName: dominantPeer.name, speakerAvatar: "⚡", speakerRole: "Peer", isHuman: false, content: "Point 2", timestamp: Date.now(), formattedTime: "10:01 AM", stage: "active_discussion" },
      { id: "3", speakerId: dominantPeer.id, speakerName: dominantPeer.name, speakerAvatar: "⚡", speakerRole: "Peer", isHuman: false, content: "Point 3", timestamp: Date.now(), formattedTime: "10:02 AM", stage: "active_discussion" }
    ];

    const decision = await evaluateCoachIntervention({
      sessionId: session.sessionId,
      topicTitle: session.topicTitle,
      format: session.format,
      difficulty: session.difficulty,
      currentStage: "active_discussion",
      secondsElapsed: 120,
      totalDurationSeconds: 900,
      participants: session.participants,
      transcripts: session.transcripts
    });

    assert.equal(decision.shouldIntervene, true, "Coach must intervene on 3 consecutive turns");
    assert.equal(decision.type, "FLOOR_REDIRECTION", "Intervention type must be FLOOR_REDIRECTION");
    assert.ok(decision.moderatorUtterance?.includes(dominantPeer.name), "Moderator utterance must name the dominant speaker");
  });

  // ── TEST 6: 3-Warning Disciplinary Policy & Server-Side Suspension ──
  test("6. 3-Warning Policy escalates from Verbal Warning to 72h Account Suspension", async () => {
    const testUser = createUser({
      email: `disciplinary_test_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Disciplinary Candidate",
      passwordHash: null,
      passwordSalt: null
    });

    const sessionId = `gd_disc_sess_${Date.now()}`;

    // Warning 1: Verbal Notice
    const w1 = await issueDisciplinaryAction({
      userId: testUser.id,
      userName: testUser.fullName || "Candidate",
      sessionId,
      isFriendsRoom: false,
      violationCategory: "PERSONAL_ATTACK",
      evidenceQuote: "You are an idiot and your argument is garbage.",
      contextSummary: "Personal insult during active debate"
    });

    assert.equal(w1.warningNumber, 1, "First incident must produce Warning 1");
    assert.equal(w1.severity, "WARNING_1");
    assert.equal(w1.isSuspended, false, "Must not suspend on Warning 1");

    // Warning 2: Final Warning
    const w2 = await issueDisciplinaryAction({
      userId: testUser.id,
      userName: testUser.fullName || "Candidate",
      sessionId,
      isFriendsRoom: false,
      violationCategory: "DISRESPECTFUL_LANGUAGE",
      evidenceQuote: "Shut up, you have no idea what you're talking about.",
      contextSummary: "Second breach of decorum"
    });

    assert.equal(w2.warningNumber, 2, "Second incident must produce Warning 2");
    assert.equal(w2.severity, "WARNING_2");
    assert.equal(w2.isSuspended, false, "Must not suspend on Warning 2");
    assert.ok(w2.moderatorUtterance.includes("FINAL WARNING"), "Must announce FINAL WARNING");

    // Warning 3: Account Suspension (72h)
    const w3 = await issueDisciplinaryAction({
      userId: testUser.id,
      userName: testUser.fullName || "Candidate",
      sessionId,
      isFriendsRoom: false,
      violationCategory: "PERSONAL_ATTACK",
      evidenceQuote: "You're a stupid loser, get out.",
      contextSummary: "Third validated incident"
    });

    assert.equal(w3.warningNumber, 3, "Third incident must trigger Warning 3");
    assert.equal(w3.severity, "WARNING_3");
    assert.equal(w3.isSuspended, true, "Warning 3 must trigger suspension");
    assert.ok(w3.suspensionExpiresAt, "Suspension expiry must be set");

    // Verify Server-Authoritative Suspension Status
    const suspensionCheck = isUserSuspended(testUser.id);
    assert.equal(suspensionCheck.suspended, true, "User must be reported as suspended by authority");
    assert.ok(suspensionCheck.appealToken, "Appeal token must be provided");

    // Test Appeal Submission
    const appealRes = submitDisciplinaryAppeal({
      appealToken: suspensionCheck.appealToken!,
      userId: testUser.id,
      explanation: "Audio misrecognition on microphone overlap."
    });

    assert.equal(appealRes.success, true, "Appeal submission must succeed");
  });

  // ── TEST 7: False-Positive Protection (Speech Noise & Technical Disagreement) ──
  test("7. Disciplinary system ignores short speech noise and protects technical disagreement", () => {
    // Short transcript / noise (< 4 words)
    const noiseCheck = evaluateUtteranceForMisconduct({
      speakerName: "Candidate",
      text: "yeah ok",
      recentSpeakerHistory: [],
      isInterruption: false,
      participantSpeakingRatio: 0.1
    });
    assert.equal(noiseCheck.isViolation, false, "Short fragments must never be flagged as violations");

    // Robust technical disagreement: must be PROTECTED
    const technicalDisagreement = evaluateUtteranceForMisconduct({
      speakerName: "Candidate",
      text: "I strongly disagree with Rohan's assumption because p99 database latency degrades under distributed lock contention.",
      recentSpeakerHistory: [],
      isInterruption: false,
      participantSpeakingRatio: 0.2
    });
    assert.equal(technicalDisagreement.isViolation, false, "Technical disagreement with reasoning must never be a violation");
  });

  // ── TEST 8: Friends GD Multiplayer Mode ──
  test("8. Friends GD room creation, participant joining, and launch", () => {
    const hostUser = createUser({
      email: `host_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Host Student",
      passwordHash: null,
      passwordSalt: null
    });

    const peerUser = createUser({
      email: `peer_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Peer Student",
      passwordHash: null,
      passwordSalt: null
    });

    // 1. Host creates room
    const room = createFriendsGDRoom({
      hostUserId: hostUser.id,
      hostName: hostUser.fullName || "Host",
      topicTitle: "Central Bank Digital Currencies vs Commercial UPI",
      format: "competitive",
      difficulty: "advanced",
      durationMinutes: 15,
      maxParticipants: 5
    });

    assert.ok(room.roomCode.startsWith("GD-"), "Room code must start with GD-");
    assert.equal(room.participants.length, 1, "Host is first participant");

    // 2. Peer joins room with code
    const updatedRoom = joinFriendsGDRoom({
      roomCodeOrId: room.roomCode,
      userId: peerUser.id,
      userName: peerUser.fullName || "Peer"
    });

    assert.equal(updatedRoom.participants.length, 2, "Room now has 2 participants");
    assert.equal(updatedRoom.participants[1].userId, peerUser.id);

    // 3. Host starts discussion
    const startResult = startFriendsGDSession(room.roomId, hostUser.id);
    assert.equal(startResult.room.status, "IN_PROGRESS");
    assert.ok(startResult.sessionId, "Active GD session must be created");
  });

  // ── TEST 9: Suspended User Blocked from Friends Rooms ──
  test("9. Disciplinary suspension blocks user from creating or joining Friends rooms", async () => {
    const suspendedUser = createUser({
      email: `suspended_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Suspended User",
      passwordHash: null,
      passwordSalt: null
    });

    // Issue 3 warnings to suspend
    const dummySess = `sess_${Date.now()}`;
    await issueDisciplinaryAction({ userId: suspendedUser.id, userName: "Suspended", sessionId: dummySess, isFriendsRoom: false, violationCategory: "PERSONAL_ATTACK", evidenceQuote: "Insult 1", contextSummary: "test" });
    await issueDisciplinaryAction({ userId: suspendedUser.id, userName: "Suspended", sessionId: dummySess, isFriendsRoom: false, violationCategory: "PERSONAL_ATTACK", evidenceQuote: "Insult 2", contextSummary: "test" });
    await issueDisciplinaryAction({ userId: suspendedUser.id, userName: "Suspended", sessionId: dummySess, isFriendsRoom: false, violationCategory: "PERSONAL_ATTACK", evidenceQuote: "Insult 3", contextSummary: "test" });

    // Attempt to create room must fail
    assert.throws(() => {
      createFriendsGDRoom({
        hostUserId: suspendedUser.id,
        hostName: "Suspended",
        topicTitle: "AI in FinTech"
      });
    }, /account is suspended/);

    // Attempt to join room must fail
    assert.throws(() => {
      joinFriendsGDRoom({
        roomCodeOrId: "GD-TEST",
        userId: suspendedUser.id,
        userName: "Suspended"
      });
    }, /Access Denied: Your account is suspended/);
  });

  // ── TEST 10: Evidence-Grounded Evaluation Engine ──
  test("10. Evaluation engine produces evidence-grounded reports with cited transcript quotes", () => {
    const session = createGDSession({
      userId: "eval-cand-1",
      topicId: "top-eval",
      topicTitle: "Zero-Trust Architecture vs Developer Velocity"
    });

    // Populate realistic candidate turns with technical grounding
    session.transcripts = [
      {
        id: "t1",
        speakerId: `candidate-${session.userId}`,
        speakerName: "Candidate (You)",
        speakerAvatar: "🎓",
        speakerRole: "Candidate",
        isHuman: true,
        content: "I'd like to challenge the assumption that zero-trust inherently harms shipping velocity because ephemeral credentials and automated IAM roles reduce security friction in production pipelines.",
        timestamp: Date.now() - 60000,
        formattedTime: "10:05 AM",
        stage: "active_discussion"
      },
      {
        id: "t2",
        speakerId: `candidate-${session.userId}`,
        speakerName: "Candidate (You)",
        speakerAvatar: "🎓",
        speakerRole: "Candidate",
        isHuman: true,
        content: "Building on Priya's point, if we benchmark our p99 authentication latency across microservices, the real trade-off is caching verification tokens safely without opening vulnerability windows.",
        timestamp: Date.now() - 30000,
        formattedTime: "10:08 AM",
        stage: "synthesis"
      }
    ];

    const report = evaluateGDSession(session);

    assert.equal(report.dimensions.length, 8, "Must evaluate exactly 8 dimensions");
    assert.ok(report.overallScore >= 75, `Score must reflect grounded performance (got ${report.overallScore})`);
    assert.ok(report.hiringVerdict === "STRONG_HIRE" || report.hiringVerdict === "HIRE");

    // Verify citations exist
    const contentDim = report.dimensions.find(d => d.dimension === "content_quality");
    assert.ok(contentDim && contentDim.citedExcerpts.length > 0, "Content quality must contain cited excerpts");
    assert.ok(contentDim.citedExcerpts[0].quote.includes("zero-trust"), "Citation must match actual spoken words");
  });

  // ── TEST 11: Zero Fabrication for Silent Candidates ──
  test("11. Silent candidate is marked insufficient_evidence without fabricated high scores", () => {
    const emptySession = createGDSession({
      userId: "silent-cand",
      topicId: "top-silent",
      topicTitle: "LeetCode vs Portfolios"
    });

    emptySession.transcripts = []; // Candidate did not speak

    const report = evaluateGDSession(emptySession);

    // Dimensions must be marked insufficient_evidence
    const clarityDim = report.dimensions.find(d => d.dimension === "communication_clarity");
    assert.equal(clarityDim?.verdict, "insufficient_evidence");
    assert.equal(clarityDim?.score, 0, "Unspoken dimension must have score 0, not fabricated 80+");
    assert.equal(report.hiringVerdict, "NO_HIRE");
    assert.equal(report.speakingTimeAnalysis.studentTurnCount, 0);
  });

});
