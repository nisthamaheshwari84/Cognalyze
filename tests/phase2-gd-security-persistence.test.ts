import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createUser, createSession } from "../lib/auth/store";
import { issueDisciplinaryAction } from "../lib/gd/disciplinary-system";
import { POST as gdTurnPost } from "../app/api/student/gd-turn/route";
import { POST as friendsPost } from "../app/api/gd/friends/route";
import { POST as generateTopicsPost } from "../app/api/gd/generate-topics/route";
import { GET as gdSessionsGet } from "../app/api/gd/sessions/route";

function buildReq(url: string, method: "GET" | "POST", token?: string, body?: any): Request {
  const headers: Record<string, string> = {};
  if (method === "POST") headers["Content-Type"] = "application/json";
  if (token) headers["cookie"] = `cognalyze_session=${encodeURIComponent(token)}`;
  return new Request(url, {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined
  });
}

describe("PHASE 2 — GD ARENA AUTHENTICATION, ISOLATION & RLS HARDENING", () => {
  test("1. Rejects unauthenticated requests with 401 and Cache-Control: no-store", async () => {
    const res1 = await gdTurnPost(
      buildReq("http://localhost/api/student/gd-turn", "POST", undefined, { action: "start_discussion" })
    );
    assert.equal(res1.status, 401);
    assert.ok((res1.headers.get("cache-control") || "").includes("no-store"));

    const res2 = await friendsPost(
      buildReq("http://localhost/api/gd/friends", "POST", undefined, { action: "create_room", topicTitle: "Test" })
    );
    assert.equal(res2.status, 401);

    const res3 = await generateTopicsPost(
      buildReq("http://localhost/api/gd/generate-topics", "POST", undefined, { count: 3 })
    );
    assert.equal(res3.status, 401);

    const res4 = await gdSessionsGet(buildReq("http://localhost/api/gd/sessions", "GET"));
    assert.equal(res4.status, 401);
  });

  test("2. Rejects recruiter accounts from student-only GD Arena routes (403)", async () => {
    const recUser = createUser({
      email: `recruiter_gd_${Date.now()}@cognalyze.test`,
      accountType: "recruiter",
      fullName: "Recruiter Blocked",
      passwordHash: null,
      passwordSalt: null
    });
    const recSess = createSession(recUser.id, "recruiter");

    const res = await gdTurnPost(
      buildReq("http://localhost/api/student/gd-turn", "POST", recSess.token, {
        action: "start_discussion",
        topic: "API Design"
      })
    );
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error, "forbidden_student_only");
  });

  test("3. Enforces cross-student isolation on GD sessions and Friends rooms", async () => {
    const userA = createUser({
      email: `studA_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Student Alpha",
      passwordHash: null,
      passwordSalt: null
    });
    const sessA = createSession(userA.id, "student");

    const userB = createUser({
      email: `studB_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Student Beta",
      passwordHash: null,
      passwordSalt: null
    });
    const sessB = createSession(userB.id, "student");

    // Student A starts a private GD session
    const startRes = await gdTurnPost(
      buildReq("http://localhost/api/student/gd-turn", "POST", sessA.token, {
        action: "start_discussion",
        topic: "Distributed Consensus vs Eventual Consistency"
      })
    );
    assert.equal(startRes.status, 200);
    const startData = await startRes.json();
    assert.ok(startData.sessionId);

    // Student B attempts to finalize Student A's session -> must be 403 Forbidden
    const stealEvalRes = await gdTurnPost(
      buildReq("http://localhost/api/student/gd-turn", "POST", sessB.token, {
        action: "finalize_evaluation",
        sessionId: startData.sessionId
      })
    );
    assert.equal(stealEvalRes.status, 403);

    // Student A creates a Friends room
    const roomRes = await friendsPost(
      buildReq("http://localhost/api/gd/friends", "POST", sessA.token, {
        action: "create_room",
        topicTitle: "Zero-Trust Microservices"
      })
    );
    assert.equal(roomRes.status, 200);
    const roomData = await roomRes.json();

    // Non-member Student B attempts to poll Student A's room -> must be 403 Forbidden
    const spyPollRes = await friendsPost(
      buildReq("http://localhost/api/gd/friends", "POST", sessB.token, {
        action: "poll_room",
        roomId: roomData.room.roomId
      })
    );
    assert.equal(spyPollRes.status, 403);

    // Student A finalizes own session and verifies it appears in /api/gd/sessions for A only
    const evalA = await gdTurnPost(
      buildReq("http://localhost/api/student/gd-turn", "POST", sessA.token, {
        action: "finalize_evaluation",
        sessionId: startData.sessionId
      })
    );
    assert.equal(evalA.status, 200);

    const listARes = await gdSessionsGet(buildReq("http://localhost/api/gd/sessions", "GET", sessA.token));
    assert.equal(listARes.status, 200);
    const listAData = await listARes.json();
    assert.ok(listAData.sessions.some((s: any) => s.sessionId === startData.sessionId));

    const listBRes = await gdSessionsGet(buildReq("http://localhost/api/gd/sessions", "GET", sessB.token));
    assert.equal(listBRes.status, 200);
    const listBData = await listBRes.json();
    assert.ok(!listBData.sessions.some((s: any) => s.sessionId === startData.sessionId));
  });

  test("4. Suspended student is blocked from starting sessions/rooms, yet allowed to submit appeal", async () => {
    const badStudent = createUser({
      email: `susp_api_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Suspended Student",
      passwordHash: null,
      passwordSalt: null
    });
    const badSess = createSession(badStudent.id, "student");
    const dummyId = `gd_sess_${Date.now()}`;

    await issueDisciplinaryAction({
      userId: badStudent.id,
      userName: "Suspended Student",
      sessionId: dummyId,
      isFriendsRoom: false,
      violationCategory: "PERSONAL_ATTACK",
      evidenceQuote: "Strike 1",
      contextSummary: "test"
    });
    await issueDisciplinaryAction({
      userId: badStudent.id,
      userName: "Suspended Student",
      sessionId: dummyId,
      isFriendsRoom: false,
      violationCategory: "PERSONAL_ATTACK",
      evidenceQuote: "Strike 2",
      contextSummary: "test"
    });
    const w3 = await issueDisciplinaryAction({
      userId: badStudent.id,
      userName: "Suspended Student",
      sessionId: dummyId,
      isFriendsRoom: false,
      violationCategory: "PERSONAL_ATTACK",
      evidenceQuote: "Strike 3",
      contextSummary: "test"
    });

    const blockedStart = await gdTurnPost(
      buildReq("http://localhost/api/student/gd-turn", "POST", badSess.token, {
        action: "start_discussion",
        topic: "API Security"
      })
    );
    assert.equal(blockedStart.status, 403);
    const blockedJson = await blockedStart.json();
    assert.equal(blockedJson.error, "account_suspended");

    // Same suspended student MUST be able to appeal their warning token
    const appealRes = await friendsPost(
      buildReq("http://localhost/api/gd/friends", "POST", badSess.token, {
        action: "appeal_warning",
        appealToken: w3.disciplinaryRecord.appealToken,
        explanation: "False transcription trigger during overlapping voice test."
      })
    );
    assert.equal(appealRes.status, 200);
    const appealJson = await appealRes.json();
    assert.equal(appealJson.success, true);
  });
});
