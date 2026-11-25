import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createUser, createSession } from "../lib/auth/store";
import { setGDAIExecutorForTest } from "../lib/gd/ai-gateway";
import { POST as friendsPost } from "../app/api/gd/friends/route";

function req(token: string, body: any): Request {
  return new Request("http://localhost/api/gd/friends", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `cognalyze_session=${encodeURIComponent(token)}`
    },
    body: JSON.stringify(body)
  });
}

describe("PHASE 8 — MULTIPLAYER FRIENDS GD REALTIME ROOM, TURN SYNC & PER-USER EVAL", () => {
  afterEach(() => {
    setGDAIExecutorForTest(null);
  });

  test("1. Supports multi-student room creation, join, launch, presence, live turn sync, and isolated evaluations", async () => {
    setGDAIExecutorForTest(async () => ({
      text: JSON.stringify({
        verdictSummary: "Candidate delivered grounded points specific to their turns.",
        dimensions: [
          { dimension: "communication_clarity", score: 82, verdict: "proficient", feedback: "Clear delivery.", turnNumber: 2 },
          { dimension: "content_quality", score: 84, verdict: "proficient", feedback: "Solid operational focus.", turnNumber: 2 },
          { dimension: "logical_reasoning", score: 80, verdict: "proficient", feedback: "Clear causality.", turnNumber: 2 },
          { dimension: "active_listening", score: 78, verdict: "proficient", feedback: "Constructive reply.", turnNumber: 2 },
          { dimension: "critical_thinking", score: 79, verdict: "proficient", feedback: "Good premise check.", turnNumber: 2 },
          { dimension: "collaboration", score: 81, verdict: "proficient", feedback: "Balanced tone.", turnNumber: 2 },
          { dimension: "leadership", score: 75, verdict: "proficient", feedback: "Helpful framing.", turnNumber: 2 }
        ],
        strongestContributions: [{ turnNumber: 2, whyStrong: "Clear risk point." }],
        weakestContributions: [{ turnNumber: 2, whyNeedsImprovement: "Add SLA number.", recruiterRewrite: "Specify p99 SLA boundaries." }],
        missedOpportunities: ["Synthesize across camps."],
        targetedImprovementPlan: ["Quantify constraints"],
        nextRecommendedPracticeTopic: "Cloud Reliability Governance"
      })
    }));

    const host = createUser({
      email: `host_p8_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Host Aditi",
      passwordHash: null,
      passwordSalt: null
    });
    const peerA = createUser({
      email: `peerA_p8_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Peer Rohan",
      passwordHash: null,
      passwordSalt: null
    });
    const outsider = createUser({
      email: `outsider_p8_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Outsider",
      passwordHash: null,
      passwordSalt: null
    });

    const hostSess = createSession(host.id, "student");
    const peerASess = createSession(peerA.id, "student");
    const outsiderSess = createSession(outsider.id, "student");

    const createRes = await friendsPost(
      req(hostSess.token, {
        action: "create_room",
        topicTitle: "Modular Monoliths vs Microservices",
        format: "competitive",
        difficulty: "intermediate"
      })
    );
    assert.equal(createRes.status, 200);
    const created = await createRes.json();
    const roomId = created.room.roomId;
    const roomCode = created.room.roomCode;

    // Peer A joins via roomCode
    const joinRes = await friendsPost(
      req(peerASess.token, { action: "join_room", roomCodeOrId: roomCode })
    );
    assert.equal(joinRes.status, 200);

    // Non-member Outsider must be rejected from poll_room
    const outsiderPoll = await friendsPost(
      req(outsiderSess.token, { action: "poll_room", roomId })
    );
    assert.equal(outsiderPoll.status, 403);

    // Host starts room -> initializes shared session + moderator intro
    const startRes = await friendsPost(
      req(hostSess.token, { action: "start_room", roomId })
    );
    assert.equal(startRes.status, 200);
    const started = await startRes.json();
    assert.equal(started.room.status, "IN_PROGRESS");
    assert.ok(started.transcripts.length >= 1);

    // Peer A updates mic & hand presence
    const presRes = await friendsPost(
      req(peerASess.token, { action: "toggle_presence", roomId, micActive: true, handRaised: true })
    );
    assert.equal(presRes.status, 200);
    const presJson = await presRes.json();
    assert.equal(presJson.room.participants.find((p: any) => p.userId === peerA.id)?.micActive, true);

    // Host submits turn 1, Peer A submits turn 2
    const turn1 = await friendsPost(
      req(hostSess.token, {
        action: "submit_turn",
        roomId,
        content: "Starting with a modular monolith accelerates deployment velocity because schema boundaries stay local."
      })
    );
    assert.equal(turn1.status, 200);

    const turn2 = await friendsPost(
      req(peerASess.token, {
        action: "submit_turn",
        roomId,
        content: "Agreed with Aditi on initial speed, though independent scaling justifies extraction once hot paths saturate."
      })
    );
    assert.equal(turn2.status, 200);

    // Both participants finalize independently -> each scored ONLY on their own turns
    const evalHostRes = await friendsPost(
      req(hostSess.token, { action: "finalize_room_evaluation", roomId, closeRoom: true })
    );
    assert.equal(evalHostRes.status, 200);
    const evalHost = await evalHostRes.json();
    assert.equal(evalHost.report.studentId, host.id);
    assert.equal(evalHost.report.speakingTimeAnalysis.studentTurnCount, 1);

    const evalPeerRes = await friendsPost(
      req(peerASess.token, { action: "finalize_room_evaluation", roomId })
    );
    assert.equal(evalPeerRes.status, 200);
    const evalPeer = await evalPeerRes.json();
    assert.equal(evalPeer.report.studentId, peerA.id);
    assert.equal(evalPeer.report.speakingTimeAnalysis.studentTurnCount, 1);
  });

  test("2. Ejects violating friend on 3rd strike while keeping room active for remaining students", async () => {
    setGDAIExecutorForTest(async () => ({
      text: JSON.stringify({ participants: [] })
    }));

    const host = createUser({
      email: `host_eject_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Host Calm",
      passwordHash: null,
      passwordSalt: null
    });
    const offender = createUser({
      email: `offender_eject_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Offender Peer",
      passwordHash: null,
      passwordSalt: null
    });

    const hostSess = createSession(host.id, "student");
    const offenderSess = createSession(offender.id, "student");

    const createRes = await friendsPost(
      req(hostSess.token, { action: "create_room", topicTitle: "Ethical AI Governance" })
    );
    const created = await createRes.json();
    const roomId = created.room.roomId;

    await friendsPost(req(offenderSess.token, { action: "join_room", roomCodeOrId: created.room.roomCode }));
    await friendsPost(req(hostSess.token, { action: "start_room", roomId }));

    await friendsPost(req(offenderSess.token, { action: "submit_turn", roomId, content: "You are an idiot and this point is garbage." }));
    await friendsPost(req(offenderSess.token, { action: "submit_turn", roomId, content: "Shut up right now, you have no idea what you mean." }));
    const strike3Res = await friendsPost(
      req(offenderSess.token, { action: "submit_turn", roomId, content: "You're a stupid loser, get out of here." })
    );
    assert.equal(strike3Res.status, 200);
    const strike3 = await strike3Res.json();
    assert.equal(strike3.ejected, true);
    assert.ok(!strike3.room.participants.some((p: any) => p.userId === offender.id), "Offender must be ejected from room");

    // Host continues cleanly in active room
    const hostPoll = await friendsPost(req(hostSess.token, { action: "poll_room", roomId }));
    assert.equal(hostPoll.status, 200);
    const pollData = await hostPoll.json();
    assert.equal(pollData.room.status, "IN_PROGRESS");
  });
});
