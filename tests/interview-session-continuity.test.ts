import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import {
  saveActiveSessionState,
  getActiveSessionState,
  getActiveSessionForCandidate,
  markSessionCompleted,
  isSessionCompleted,
} from "../lib/interview-session-store";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
} from "../lib/ai/interview-engine";
import { POST, GET } from "../app/api/interview-chat/route";

describe("Phase 2.1: Session Continuity, Authoritative Restoration & Security Hotfix", () => {
  const candidateAlice = "student_alice_continuity_101";
  const candidateBob = "student_bob_continuity_202";

  test("SCENARIO 1: Navigation away and return to the same active interview", async () => {
    // 1. Kickoff interview for Alice
    const kickoffReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidateAlice,
        track: "fullstack",
        durationMinutes: 30,
        messages: [],
      }),
    });

    const kickoffRes = await POST(kickoffReq);
    assert.strictEqual(kickoffRes.status, 200, "Kickoff must succeed");
    const kickoffData = await kickoffRes.json();
    assert.ok(kickoffData.sessionId, "Must return valid sessionId");
    const sessionId = kickoffData.sessionId;

    // 2. Candidate answers Q1
    const answerReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        candidateId: candidateAlice,
        track: "fullstack",
        messages: [
          { role: "assistant", content: kickoffData.message },
          { role: "user", content: "I have 4 years of experience building microservices with Node.js and React." },
        ],
      }),
    });

    const answerRes = await POST(answerReq);
    assert.strictEqual(answerRes.status, 200, "Answer submission must succeed");
    const answerData = await answerRes.json();
    assert.strictEqual(answerData.sessionId, sessionId, "SessionId must remain stable");

    // 3. Candidate navigates away to /student/dashboard, then returns to /interview
    // Client invokes GET /api/interview-chat without sessionId (using candidate auth)
    const returnReqCandidate = new Request(`http://localhost:3000/api/interview-chat?candidateId=${candidateAlice}`);
    const returnResCandidate = await GET(returnReqCandidate);
    assert.strictEqual(returnResCandidate.status, 200, "Candidate active lookup must find ongoing session");
    const returnDataCandidate = await returnResCandidate.json();

    assert.strictEqual(returnDataCandidate.success, true);
    assert.strictEqual(returnDataCandidate.resumable, true, "Session must be marked resumable");
    assert.strictEqual(returnDataCandidate.session.id, sessionId, "Must restore the EXACT same session ID");
    assert.strictEqual(returnDataCandidate.session.track, "fullstack", "Must restore fullstack track");
    assert.ok(returnDataCandidate.session.questionsAsked.length >= 1, "Must retain asked questions history");
  });

  test("SCENARIO 2: Browser refresh and session restoration via stored sessionId", async () => {
    // Start session
    const kickoffReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidateAlice,
        track: "cloud_devops",
        messages: [],
      }),
    });
    const kickoffRes = await POST(kickoffReq);
    const { sessionId, message: greeting } = await kickoffRes.json();

    // Browser refreshes: client reads sessionId from sessionStorage and invokes GET ?sessionId=...
    const refreshReq = new Request(`http://localhost:3000/api/interview-chat?sessionId=${sessionId}&candidateId=${candidateAlice}`);
    const refreshRes = await GET(refreshReq);
    assert.strictEqual(refreshRes.status, 200);

    const refreshData = await refreshRes.json();
    assert.strictEqual(refreshData.success, true);
    assert.strictEqual(refreshData.session.id, sessionId);
    assert.strictEqual(refreshData.session.track, "cloud_devops");
    assert.ok(refreshData.session.messages.length >= 1, "Transcript messages must be reconstructed");
    assert.strictEqual(refreshData.session.messages[0].content, greeting, "Greeting must match");
  });

  test("SCENARIO 3: Correct track and transcript restoration across multiple turns", async () => {
    const track = "data_engineering";
    const initReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidateAlice,
        track,
        messages: [],
      }),
    });
    const initRes = await POST(initReq);
    const { sessionId, message: q0 } = await initRes.json();

    // Turn 1 (Intro response -> returns Question 1)
    const t1Ans = "I design ETL pipelines using Apache Spark, Kafka, and Delta Lake with strict schema enforcement.";
    const t1Req = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        candidateId: candidateAlice,
        track,
        messages: [
          { role: "assistant", content: q0 },
          { role: "user", content: t1Ans },
        ],
      }),
    });
    const t1Res = await POST(t1Req);
    const t1Data = await t1Res.json();
    assert.strictEqual(t1Res.status, 200);

    // Turn 2 (Answer to Question 1 -> evaluated and recorded as substantive turn)
    const t2Ans = "We partition Parquet data by event_date, employ snappy compression, and route poisoned records to a dead-letter Kafka topic.";
    const t2Req = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        candidateId: candidateAlice,
        track,
        messages: [
          { role: "assistant", content: q0 },
          { role: "user", content: t1Ans },
          { role: "assistant", content: t1Data.message },
          { role: "user", content: t2Ans },
        ],
      }),
    });
    const t2Res = await POST(t2Req);
    assert.strictEqual(t2Res.status, 200);

    // Restore via GET
    const restoreReq = new Request(`http://localhost:3000/api/interview-chat?sessionId=${sessionId}&candidateId=${candidateAlice}`);
    const restoreRes = await GET(restoreReq);
    const restored = await restoreRes.json();

    assert.strictEqual(restored.session.track, "data_engineering", "Track must be preserved");
    assert.ok(restored.session.turns.length >= 1, "Recorded turns must be preserved");
    // Verify messages array contains opening, intro, and question answers
    const userMsgs = restored.session.messages.filter((m: any) => m.role === "user");
    assert.ok(userMsgs.some((m: any) => m.content.includes("Apache Spark")), "Intro must be in transcript");
    assert.ok(userMsgs.some((m: any) => m.content.includes("snappy compression")), "Substantive answer must be in transcript");
  });

  test("SCENARIO 4: Completed session restored as completed, never reopened for active answering", async () => {
    // 1. Create session
    const kickoffReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidateAlice,
        track: "machine_learning",
        messages: [],
      }),
    });
    const kickoffRes = await POST(kickoffReq);
    const { sessionId } = await kickoffRes.json();

    // 2. Mark session completed with mock report
    const mockReport = {
      overallScore: 88,
      verdict: "STRONG_HIRE",
      summary: "Excellent deep learning and model deployment fundamentals.",
    };
    markSessionCompleted(sessionId, mockReport);

    // 3. Client re-visits URL or refreshes
    const checkReq = new Request(`http://localhost:3000/api/interview-chat?sessionId=${sessionId}&candidateId=${candidateAlice}`);
    const checkRes = await GET(checkReq);
    assert.strictEqual(checkRes.status, 200);
    const checkData = await checkRes.json();

    assert.strictEqual(checkData.isCompleted, true, "Must be flagged as completed");
    assert.strictEqual(checkData.resumable, false, "Completed session MUST NOT be resumable for answering");
    assert.strictEqual(checkData.session.report.verdict, "STRONG_HIRE", "Must provide completed report");

    // 4. Attempt to submit an answer to this completed session
    const postToCompleted = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        candidateId: candidateAlice,
        messages: [{ role: "user", content: "Another answer after completion" }],
      }),
    });
    const postRes = await POST(postToCompleted);
    assert.strictEqual(postRes.status, 400, "Must reject submissions to completed session with 400 Bad Request");
    const postData = await postRes.json();
    assert.strictEqual(postData.isCompleted, true);
    assert.ok(postData.error.includes("completed"));
  });

  test("SCENARIO 5: Missing or expired session produces clear recovery path", async () => {
    const missingReq = new Request(`http://localhost:3000/api/interview-chat?sessionId=sess_nonexistent_xyz_999&candidateId=${candidateAlice}`);
    const missingRes = await GET(missingReq);

    assert.strictEqual(missingRes.status, 404, "Must return 404 for missing session");
    const missingData = await missingRes.json();
    assert.strictEqual(missingData.resumable, false, "Missing session cannot be resumable");
    assert.strictEqual(missingData.error, "Session not found");
  });

  test("SCENARIO 6: Cross-candidate session access is strictly rejected with 403 Forbidden", async () => {
    // 1. Candidate Alice starts session
    const kickoffReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidateAlice,
        track: "security_systems",
        messages: [],
      }),
    });
    const kickoffRes = await POST(kickoffReq);
    const { sessionId } = await kickoffRes.json();

    // 2. Candidate Bob maliciously attempts to GET Alice's session
    const bobSpyReq = new Request(`http://localhost:3000/api/interview-chat?sessionId=${sessionId}&candidateId=${candidateBob}`);
    const bobSpyRes = await GET(bobSpyReq);
    assert.strictEqual(bobSpyRes.status, 403, "Must return 403 Forbidden for cross-candidate access");
    const bobSpyData = await bobSpyRes.json();
    assert.ok(bobSpyData.error.includes("Access denied"), "Error message must state access denied");

    // 3. Direct memory verification: getActiveSessionState with wrong candidateId returns null
    const crossAccess = getActiveSessionState(sessionId, candidateBob);
    assert.strictEqual(crossAccess, null, "Store must prevent cross-tenant state retrieval");

    // 4. Correct candidate Alice still has valid access
    const aliceValidAccess = getActiveSessionState(sessionId, candidateAlice);
    assert.ok(aliceValidAccess !== null, "Owner must still have access");
    assert.strictEqual(aliceValidAccess.sessionId, sessionId);
  });

  test("SCENARIO 7: Duplicate submissions and idempotent turn handling", async () => {
    // 1. Kickoff
    const kickoffReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidateAlice,
        track: "frontend_mobile",
        messages: [],
      }),
    });
    const kickoffRes1 = await POST(kickoffReq);
    const kickoffData1 = await kickoffRes1.json();

    // 2. Duplicate kickoff with same sessionId (e.g. React StrictMode or connection retry)
    const duplicateKickoffReq = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: kickoffData1.sessionId,
        candidateId: candidateAlice,
        track: "frontend_mobile",
        messages: [],
      }),
    });
    const kickoffRes2 = await POST(duplicateKickoffReq);
    const kickoffData2 = await kickoffRes2.json();

    assert.strictEqual(kickoffData2.sessionId, kickoffData1.sessionId);
    assert.strictEqual(kickoffData2.message, kickoffData1.message, "Duplicate kickoff must return identical greeting");
  });

  test("SCENARIO 8: Starting a genuinely new interview creates fresh session when explicitly requested", async () => {
    // 1. Candidate Alice has an ongoing session
    const s1Req = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidateAlice,
        track: "systems_architecture",
        messages: [],
      }),
    });
    const s1Res = await POST(s1Req);
    const { sessionId: session1Id } = await s1Res.json();

    // 2. Candidate explicitly clicks "Start Clean Interview" / "Discard & Start Fresh"
    // Client does NOT pass session1Id in the new request
    const s2Req = new Request("http://localhost:3000/api/interview-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidateAlice,
        track: "qa_reliability",
        messages: [],
      }),
    });
    const s2Res = await POST(s2Req);
    const { sessionId: session2Id } = await s2Res.json();

    assert.notStrictEqual(session2Id, session1Id, "Fresh interview must produce a new unique sessionId");
    assert.ok(session2Id.startsWith("sess_"), "Session ID must follow format");

    // Verify Session 2 track is qa_reliability and Session 1 track remains systems_architecture
    const s1State = getActiveSessionState(session1Id, candidateAlice);
    const s2State = getActiveSessionState(session2Id, candidateAlice);

    assert.strictEqual(s1State?.track, "systems_architecture");
    assert.strictEqual(s2State?.track, "qa_reliability");
  });
});
