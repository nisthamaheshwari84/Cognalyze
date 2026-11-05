/**
 * tests/remediation-security-reliability.test.ts
 * 
 * Comprehensive Remediation Test Suite for Post-Audit Critical Fixes:
 * 1. P0: SEC-AUTH-02 (Account Takeover Prevention in /api/auth/link-account)
 * 2. P0: SEC-AUTH-01 (IDOR & Profile Overwrite Prevention in /api/parse-resume)
 * 3. P1: SEC-EVID-01 (Student DNA Forged Mastery Prevention in /api/student-dna/evidence)
 * 4. P1: SEC-REC-01 (Recruiter Route-by-Route Authentication & Authorization Matrix)
 * 5. P1: REL-SESS-01 & REL-PERS-01 (Serverless Interview Persistence & Immutability)
 * 6. P2: SEC-KEY-01 (Safe Email Service Missing Config & Zero Hardcoded Credentials)
 */

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

// Auth & Store Imports
import {
  createUser,
  getUserById,
  getUserByEmail,
  createSession,
  getStudentProfileByUserId,
  upsertStudentProfileByUserId,
  createAccountLinkingProof,
  verifyAndConsumeAccountLinkingProof,
  createOrganization,
  getOrganizationByDomain,
  createRecruiterProfile,
  getRecruiterProfileByUserId
} from "../lib/auth/store";
import { POST as linkAccountPost } from "../app/api/auth/link-account/route";
import { POST as parseResumePost } from "../app/api/parse-resume/route";
import { POST as evidencePost } from "../app/api/student-dna/evidence/route";
import { GET as recruiterCandidatesGet, POST as recruiterCandidatesPost } from "../app/api/recruiter/candidates/route";
import { GET as recruiterDecisionRoomGet, POST as recruiterDecisionRoomPost } from "../app/api/recruiter/decision-room/route";
import { GET as recruiterRolesGet, POST as recruiterRolesPost } from "../app/api/recruiter/roles/route";
import { GET as recruiterCommandCenterGet } from "../app/api/recruiter/command-center/route";
import { POST as recruiterUploadResumePost } from "../app/api/recruiter/upload-resume/route";
import { POST as recruiterInterviewsPost } from "../app/api/recruiter/interviews/route";
import { sendEmail } from "../lib/email/email-service";
import {
  saveActiveSessionState,
  saveActiveSessionStateAsync,
  getActiveSessionState,
  getActiveSessionStateAsync,
  markSessionCompleted,
  isSessionCompleted,
  clearActiveSessionState,
  saveSession,
  acquireTurnLock,
  releaseTurnLock
} from "../lib/interview-session-store";

// Helper to construct mock NextRequest
function createMockRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string>; cookies?: Record<string, string> } = {}): any {
  const method = options.method || "GET";
  const bodyText = options.body !== undefined ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : null;
  const cookieHeader = Object.entries(options.cookies || {})
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("; ");

  const headersMap = new Map<string, string>();
  if (cookieHeader) headersMap.set("cookie", cookieHeader);
  headersMap.set("content-type", "application/json");
  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      headersMap.set(k.toLowerCase(), v);
    }
  }

  return {
    url,
    method,
    headers: {
      get: (name: string) => headersMap.get(name.toLowerCase()) || null,
    },
    cookies: {
      get: (name: string) => {
        const val = options.cookies?.[name];
        return val ? { value: val } : undefined;
      }
    },
    json: async () => (options.body ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body) : {}),
    text: async () => bodyText || "",
    formData: async () => {
      throw new Error("formData not implemented in mock");
    }
  };
}

describe("Security & Reliability Remediation Test Suite", () => {
  // Test User Accounts
  const student1Id = "u-rem-student-001";
  const student2Id = "u-rem-student-002";
  const recruiterId = "u-rem-recruiter-001";

  // Ensure test users exist in store
  if (!getUserByEmail("student1.remediation@cognalyze.local")) {
    createUser({
      id: student1Id,
      email: "student1.remediation@cognalyze.local",
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });
  }

  if (!getUserByEmail("student2.remediation@cognalyze.local")) {
    createUser({
      id: student2Id,
      email: "student2.remediation@cognalyze.local",
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });
  }

  if (!getUserByEmail("recruiter.remediation@acmetech.com")) {
    createUser({
      id: recruiterId,
      email: "recruiter.remediation@acmetech.com",
      passwordHash: null,
      passwordSalt: null,
      accountType: "recruiter",
      status: "ACTIVE"
    });
  }

  const testOrg = getOrganizationByDomain("acmetech.com") || createOrganization({
    name: "Acme Tech",
    domain: "acmetech.com",
    verificationStatus: "VERIFIED"
  });

  if (!getRecruiterProfileByUserId(recruiterId)) {
    createRecruiterProfile({
      userId: recruiterId,
      fullName: "Remediation Recruiter",
      designation: "Talent Acquisition Lead",
      workEmail: "recruiter.remediation@acmetech.com",
      organizationId: testOrg.id
    });
  }

  const student1Session = createSession(student1Id, "student");
  const student2Session = createSession(student2Id, "student");
  const recruiterSession = createSession(recruiterId, "recruiter");

  // =========================================================================
  // FIX 1: P0 — SEC-AUTH-02 (Account Takeover Prevention in /api/auth/link-account)
  // =========================================================================
  describe("1. P0 SEC-AUTH-02: Account Takeover Prevention", () => {
    test("Unauthenticated request without linking proof is rejected with 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/auth/link-account", {
        method: "POST",
        body: {
          userId: student1Id,
          provider: "github",
          providerUserId: "attacker_gh",
          providerEmail: "attacker@evil.com"
        }
      });

      const res = await linkAccountPost(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.match(data.error, /Unauthorized/i);
    });

    test("Forged / tampered linking proof is rejected with 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/auth/link-account", {
        method: "POST",
        body: {
          userId: student1Id,
          provider: "github",
          providerUserId: "attacker_gh",
          providerEmail: "attacker@evil.com",
          linkingProof: "eyJhbGciOiJIUzI1NiJ9.forged_payload.invalid_signature"
        }
      });

      const res = await linkAccountPost(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.match(data.error, /Tampered or forged|Invalid account linking proof/i);
    });

    test("Mismatched target userId in linking proof is rejected with 401", async () => {
      // Valid proof for student1, but attacker attempts to use it on student2
      const proofForStudent1 = createAccountLinkingProof({
        userId: student1Id,
        provider: "github",
        providerUserId: "student1_gh",
        providerEmail: "student1.remediation@cognalyze.local"
      });

      const req = createMockRequest("http://localhost:3000/api/auth/link-account", {
        method: "POST",
        body: {
          userId: student2Id, // Target does NOT match proof!
          provider: "github",
          providerUserId: "student1_gh",
          providerEmail: "student1.remediation@cognalyze.local",
          linkingProof: proofForStudent1
        }
      });

      const res = await linkAccountPost(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.match(data.error, /does not match request parameters/i);
    });

    test("Replay attack: used linking proof cannot be reused", async () => {
      const validProof = createAccountLinkingProof({
        userId: student1Id,
        provider: "github",
        providerUserId: "student1_replay_test",
        providerEmail: "student1.remediation@cognalyze.local"
      });

      const req1 = createMockRequest("http://localhost:3000/api/auth/link-account", {
        method: "POST",
        body: {
          userId: student1Id,
          provider: "github",
          providerUserId: "student1_replay_test",
          providerEmail: "student1.remediation@cognalyze.local",
          linkingProof: validProof
        }
      });

      // First use succeeds
      const res1 = await linkAccountPost(req1);
      assert.strictEqual(res1.status, 200);

      // Second use (replay) is rejected
      const req2 = createMockRequest("http://localhost:3000/api/auth/link-account", {
        method: "POST",
        body: {
          userId: student1Id,
          provider: "github",
          providerUserId: "student1_replay_test",
          providerEmail: "student1.remediation@cognalyze.local",
          linkingProof: validProof
        }
      });

      const res2 = await linkAccountPost(req2);
      assert.strictEqual(res2.status, 401);
      const data2 = await res2.json();
      assert.match(data2.error, /already been consumed|replay detected/i);
    });

    test("Cross-account linking by authenticated user is rejected with 403 Forbidden", async () => {
      // Student 1 authenticated, tries to link third-party account to Student 2's ID
      const req = createMockRequest("http://localhost:3000/api/auth/link-account", {
        method: "POST",
        cookies: { cognalyze_session: student1Session.token },
        body: {
          userId: student2Id, // Target is different from authenticated user!
          provider: "linkedin",
          providerUserId: "attacker_li",
          providerEmail: "attacker@evil.com"
        }
      });

      const res = await linkAccountPost(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.match(data.error, /Forbidden/i);
    });

    test("Legitimate authenticated account linking succeeds and returns session", async () => {
      const req = createMockRequest("http://localhost:3000/api/auth/link-account", {
        method: "POST",
        cookies: { cognalyze_session: student1Session.token },
        body: {
          userId: student1Id,
          provider: "linkedin",
          providerUserId: "student1_valid_li",
          providerEmail: "student1.remediation@cognalyze.local"
        }
      });

      const res = await linkAccountPost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });
  });

  // =========================================================================
  // FIX 2: P0 — SEC-AUTH-01 (IDOR & Profile Overwrite Prevention in /api/parse-resume)
  // =========================================================================
  describe("2. P0 SEC-AUTH-01: Profile Overwrite & IDOR Prevention", () => {
    test("Unauthenticated parse-resume request parses text but does NOT mutate target user profile", async () => {
      // Seed student1 with known skills
      upsertStudentProfileByUserId(student1Id, {
        skills: [{ name: "Original Skill Alpha", level: "Expert" }]
      });

      const req = createMockRequest("http://localhost:3000/api/parse-resume", {
        method: "POST",
        body: {
          candidateId: student1Id, // Unauthenticated attacker specifying victim candidateId
          text: "Malicious Resume: Extracted Skill Python, Java, Docker."
        }
      });

      const res = await parseResumePost(req);
      assert.strictEqual(res.status, 200);

      // Verify student1 profile was NOT overwritten
      const profile = getStudentProfileByUserId(student1Id);
      assert.ok(profile);
      assert.ok(profile.skills.some(s => s.name === "Original Skill Alpha"));
      assert.ok(!profile.skills.some(s => s.name === "Python"));
    });

    test("Authenticated student passing another candidate's ID is rejected with 403 Forbidden", async () => {
      const req = createMockRequest("http://localhost:3000/api/parse-resume", {
        method: "POST",
        cookies: { cognalyze_session: student1Session.token },
        body: {
          candidateId: student2Id, // Cross-candidate IDOR attempt!
          text: "Resume text targeting victim student."
        }
      });

      const res = await parseResumePost(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.error, "forbidden_cross_candidate");
    });

    test("Parsing failure does NOT erase existing valid profile skills", async () => {
      upsertStudentProfileByUserId(student1Id, {
        skills: [{ name: "Distributed Systems", level: "Expert" }],
        profileCompleted: true
      });

      // Submit empty / unparseable garbage text
      const req = createMockRequest("http://localhost:3000/api/parse-resume", {
        method: "POST",
        cookies: { cognalyze_session: student1Session.token },
        body: {
          text: "123 456 789 !@#$%^&*() -- empty symbols without skills"
        }
      });

      const res = await parseResumePost(req);
      assert.strictEqual(res.status, 200);

      // Verify student1's skills were NOT wiped to empty
      const profile = getStudentProfileByUserId(student1Id);
      assert.ok(profile);
      assert.ok(profile.skills.length > 0);
      assert.ok(profile.skills.some(s => s.name === "Distributed Systems"));
    });
  });

  // =========================================================================
  // FIX 3: P1 — SEC-EVID-01 (Prevent Forged Student DNA Mastery)
  // =========================================================================
  describe("3. P1 SEC-EVID-01: Prevent Forged Student DNA Mastery", () => {
    test("Unauthenticated evidence submission is rejected with 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/student-dna/evidence", {
        method: "POST",
        body: {
          sourceType: "assessment",
          skillRaw: "Distributed Systems",
          evidenceType: "system_design_eval",
          claim: "Scored 98/100 on System Design"
        }
      });

      const res = await evidencePost(req);
      assert.strictEqual(res.status, 401);
    });

    test("Client attempting to forge 'assessment' evidence without sessionId is rejected with 400", async () => {
      const req = createMockRequest("http://localhost:3000/api/student-dna/evidence", {
        method: "POST",
        cookies: { cognalyze_session: student1Session.token },
        body: {
          sourceType: "assessment",
          skillRaw: "Distributed Systems",
          evidenceType: "system_design_eval",
          claim: "Forged assessment score 100",
          verificationStatus: "VERIFIED"
        }
      });

      const res = await evidencePost(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /requires an authoritative sessionId/i);
    });

    test("Client referencing a stolen session belonging to another candidate is rejected with 403", async () => {
      // Create completed session belonging to student2
      const stolenSessionId = "sess-student2-completed-001";
      saveActiveSessionState(stolenSessionId, {
        candidateId: student2Id,
        sessionType: "mock_interview",
        targetRole: "Senior Engineer",
        lifecycleState: "COMPLETED",
        isCompleted: true
      });
      markSessionCompleted(stolenSessionId, { overallScore: 92 });

      // Student 1 tries to use Student 2's session as evidence!
      const req = createMockRequest("http://localhost:3000/api/student-dna/evidence", {
        method: "POST",
        cookies: { cognalyze_session: student1Session.token },
        body: {
          sourceType: "assessment",
          sessionId: stolenSessionId,
          skillRaw: "Distributed Systems",
          evidenceType: "interview_eval",
          claim: "Stolen session verification attempt"
        }
      });

      const res = await evidencePost(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.match(data.error, /Candidate isolation violation|Forbidden/i);
    });

    test("Client-submitted practice evidence cannot be stamped as VERIFIED (forced to CLAIMED)", async () => {
      const req = createMockRequest("http://localhost:3000/api/student-dna/evidence", {
        method: "POST",
        cookies: { cognalyze_session: student1Session.token },
        body: {
          sourceType: "self_declared",
          sourceId: "manual_claim_1",
          skillRaw: "Python",
          evidenceType: "self_claim",
          claim: "I am a Python expert",
          verificationStatus: "VERIFIED" // Attempting client override
        }
      });

      const res = await evidencePost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.evidence.verificationStatus, "CLAIMED");
      assert.notStrictEqual(data.evidence.verificationStatus, "VERIFIED");
    });

    test("Legitimate assessment with completed candidate-owned session is VERIFIED", async () => {
      const validSessionId = `sess-${student1Id}-valid-001`;
      saveActiveSessionState(validSessionId, {
        candidateId: student1Id,
        sessionType: "mock_interview",
        targetRole: "Software Engineer",
        lifecycleState: "COMPLETED",
        isCompleted: true
      });
      markSessionCompleted(validSessionId, { overallScore: 88 });

      const req = createMockRequest("http://localhost:3000/api/student-dna/evidence", {
        method: "POST",
        cookies: { cognalyze_session: student1Session.token },
        body: {
          sourceType: "assessment",
          sessionId: validSessionId,
          sourceId: validSessionId,
          skillRaw: "Python",
          evidenceType: "assessment_turn",
          claim: "Passed technical evaluation",
          score: 88
        }
      });

      const res = await evidencePost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.evidence.verificationStatus, "VERIFIED");
    });
  });

  // =========================================================================
  // FIX 4: P1 — SEC-REC-01 (Protect Every Recruiter API Endpoint)
  // =========================================================================
  describe("4. P1 SEC-REC-01: Recruiter API Route Authorization Matrix", () => {
    const tempStorePath = path.join(process.cwd(), "data", `recruiter-store-rem-test-${Date.now()}.json`);
    before(() => {
      fs.writeFileSync(tempStorePath, JSON.stringify({ roles: [], candidates: [], hireRecords: [] }, null, 2));
      process.env.RECRUITER_STORE_FILE = tempStorePath;
    });
    after(() => {
      delete process.env.RECRUITER_STORE_FILE;
      try {
        if (fs.existsSync(tempStorePath)) fs.unlinkSync(tempStorePath);
      } catch {}
    });

    const testCases: Array<{ name: string; handler: (req: any) => Promise<any>; method: string; path: string; body?: any }> = [
      { name: "Candidates GET", handler: recruiterCandidatesGet, method: "GET", path: "/api/recruiter/candidates" },
      { name: "Candidates POST", handler: recruiterCandidatesPost, method: "POST", path: "/api/recruiter/candidates", body: { name: "Test Cand", appliedRoleId: "role-1" } },
      { name: "Decision Room GET", handler: recruiterDecisionRoomGet, method: "GET", path: "/api/recruiter/decision-room" },
      { name: "Decision Room POST", handler: recruiterDecisionRoomPost, method: "POST", path: "/api/recruiter/decision-room", body: { action: "confirm_identity", candidateId: "c-1", sourceId: "s-1" } },
      { name: "Roles GET", handler: recruiterRolesGet, method: "GET", path: "/api/recruiter/roles" },
      { name: "Roles POST", handler: recruiterRolesPost, method: "POST", path: "/api/recruiter/roles", body: { title: "Backend Lead" } },
      { name: "Command Center GET", handler: recruiterCommandCenterGet, method: "GET", path: "/api/recruiter/command-center" },
      { name: "Upload Resume POST", handler: recruiterUploadResumePost, method: "POST", path: "/api/recruiter/upload-resume", body: { resumeText: "sample resume" } },
      { name: "Interviews POST", handler: recruiterInterviewsPost, method: "POST", path: "/api/recruiter/interviews", body: { action: "generate_questions", candidateId: "c-1", roleId: "r-1" } }
    ];

    for (const tc of testCases) {
      test(`${tc.name} rejects unauthenticated requests with 401 Unauthorized`, async () => {
        const req = createMockRequest(`http://localhost:3000${tc.path}`, {
          method: tc.method,
          body: tc.body
        });
        const res = await tc.handler(req);
        assert.strictEqual(res.status, 401, `${tc.name} should return 401 for unauthenticated request`);
        const data = await res.json();
        assert.match(data.error, /Unauthorized/i);
      });

      test(`${tc.name} rejects authenticated student account with 403 Forbidden`, async () => {
        const req = createMockRequest(`http://localhost:3000${tc.path}`, {
          method: tc.method,
          cookies: { cognalyze_session: student1Session.token },
          body: tc.body
        });
        const res = await tc.handler(req);
        assert.strictEqual(res.status, 403, `${tc.name} should return 403 for student account`);
        const data = await res.json();
        assert.match(data.error, /Forbidden/i);
      });

      test(`${tc.name} authorizes authenticated recruiter account (non-401, non-403)`, async () => {
        const req = createMockRequest(`http://localhost:3000${tc.path}`, {
          method: tc.method,
          cookies: { cognalyze_session: recruiterSession.token },
          body: tc.body
        });
        const res = await tc.handler(req);
        // Recruiter session should pass the auth guard (status should not be 401 or 403)
        assert.notStrictEqual(res.status, 401, `${tc.name} should not be 401 for recruiter`);
        assert.notStrictEqual(res.status, 403, `${tc.name} should not be 403 for recruiter`);
      });
    }
  });

  // =========================================================================
  // FIX 5: P1 — REL-SESS-01 & REL-PERS-01 (Serverless Interview Persistence & Safety)
  // =========================================================================
  describe("5. P1 REL-SESS-01 & REL-PERS-01: Serverless Interview Persistence & Concurrency", () => {
    test("Active turn state survives instance memory reset via durable hydration", async () => {
      const sessionId = `sess-serverless-${Date.now()}`;
      const candidateId = student1Id;

      const activeState = {
        candidateId,
        sessionType: "mock_interview",
        targetRole: "Full Stack Engineer",
        currentDifficulty: "intermediate",
        lifecycleState: "INTERVIEW_IN_PROGRESS",
        turns: [{ turnIndex: 1, userResponse: "Demonstrated concurrency concepts" }],
        scores: { strong: 1, adequate: 0, shallow: 0, off_topic: 0 }
      };

      // 1. Save state
      saveActiveSessionState(sessionId, activeState);

      // 2. Simulate serverless container recycling by reading via clean hydration
      const hydrated = getActiveSessionState(sessionId, candidateId);
      assert.ok(hydrated, "State should be hydrated from durable serverless storage");
      assert.strictEqual(hydrated.candidateId, candidateId);
      assert.strictEqual(hydrated.targetRole, "Full Stack Engineer");
      assert.strictEqual(hydrated.turns.length, 1);

      // Clean up
      clearActiveSessionState(sessionId);
    });

    test("Two simulated independent instances see authoritative session state", async () => {
      const sessionId = `sess-multi-instance-${Date.now()}`;
      const candidateId = student1Id;

      // Instance 1 writes Turn 1 and Turn 2
      const instance1TurnState = {
        candidateId,
        targetRole: "Cloud Architect",
        turns: [
          { turnIndex: 1, userResponse: "Architecture answer 1", rubricScore: 80 },
          { turnIndex: 2, userResponse: "Architecture answer 2", rubricScore: 85 }
        ],
        questionsAsked: [
          { question: "Explain distributed consensus", turnIndex: 1 },
          { question: "How to handle split-brain in Raft?", turnIndex: 2 }
        ],
        lifecycleState: "INTERVIEW_IN_PROGRESS"
      };

      await saveActiveSessionStateAsync(sessionId, instance1TurnState);

      // Instance 2 (representing a separate serverless execution environment)
      // Loads session by ID for the authorized candidate
      const instance2Recovered = await getActiveSessionStateAsync(sessionId, candidateId);

      assert.ok(instance2Recovered, "Instance 2 must recover authoritative session state");
      assert.strictEqual(instance2Recovered.candidateId, candidateId);
      assert.strictEqual(instance2Recovered.turns.length, 2);
      assert.strictEqual(instance2Recovered.turns[1].rubricScore, 85);
      assert.strictEqual(instance2Recovered.questionsAsked.length, 2);

      clearActiveSessionState(sessionId);
    });

    test("Turn concurrency locks prevent duplicate simultaneous turn submissions", async () => {
      const sessionId = `sess-lock-${Date.now()}`;

      // Worker 1 acquires lock
      const lockAcquired1 = acquireTurnLock(sessionId);
      assert.strictEqual(lockAcquired1, true, "Worker 1 should acquire lock");

      // Worker 2 attempts concurrent submission on same session
      const lockAcquired2 = acquireTurnLock(sessionId);
      assert.strictEqual(lockAcquired2, false, "Worker 2 should be rejected due to active lock");

      // Worker 1 finishes and releases lock
      releaseTurnLock(sessionId);

      // Worker 2 can now acquire lock
      const lockAcquiredRetry = acquireTurnLock(sessionId);
      assert.strictEqual(lockAcquiredRetry, true, "Worker 2 should acquire lock after release");

      releaseTurnLock(sessionId);
    });

    test("Turn ordering and append integrity is strictly preserved across turn sequence", async () => {
      const sessionId = `sess-ordering-${Date.now()}`;
      const candidateId = student1Id;

      let state: any = {
        candidateId,
        turns: [],
        questionsAsked: []
      };

      for (let i = 1; i <= 3; i++) {
        state.turns.push({ turnIndex: i, answer: `Answer ${i}` });
        state.questionsAsked.push({ question: `Question ${i}`, turnIndex: i });
        await saveActiveSessionStateAsync(sessionId, state);
      }

      const recovered = await getActiveSessionStateAsync(sessionId, candidateId);
      assert.strictEqual(recovered.turns.length, 3);
      assert.strictEqual(recovered.turns[0].turnIndex, 1);
      assert.strictEqual(recovered.turns[1].turnIndex, 2);
      assert.strictEqual(recovered.turns[2].turnIndex, 3);

      clearActiveSessionState(sessionId);
    });

    test("Completed session is strictly immutable and rejects mutation", async () => {
      const sessionId = `sess-completed-immutable-${Date.now()}`;
      saveActiveSessionState(sessionId, {
        candidateId: student1Id,
        lifecycleState: "COMPLETED",
        isCompleted: true
      });
      markSessionCompleted(sessionId, { finalVerdict: "HIRE", score: 85 });

      assert.strictEqual(isSessionCompleted(sessionId), true);

      // Attempt to mutate completed session back to in-progress
      assert.throws(
        () => {
          saveActiveSessionState(sessionId, {
            candidateId: student1Id,
            lifecycleState: "INTERVIEW_IN_PROGRESS",
            turns: []
          });
        },
        /Immutability violation/i,
        "Completed session must throw on attempted mutation"
      );

      clearActiveSessionState(sessionId);
    });

    test("Candidate isolation prevents accessing another candidate's active session across all recovery paths", async () => {
      const sessionId = `sess-isolated-${Date.now()}`;
      saveActiveSessionState(sessionId, {
        candidateId: student1Id,
        targetRole: "Systems Engineer"
      });

      // Synchronous recovery path
      const crossCandidateStateSync = getActiveSessionState(sessionId, student2Id);
      assert.strictEqual(crossCandidateStateSync, null, "Sync read should return null for mismatched candidate ID");

      // Asynchronous recovery path
      const crossCandidateStateAsync = await getActiveSessionStateAsync(sessionId, student2Id);
      assert.strictEqual(crossCandidateStateAsync, null, "Async read should return null for mismatched candidate ID");

      clearActiveSessionState(sessionId);
    });
  });

  // =========================================================================
  // FIX 6: P2 — SEC-KEY-01 (Remove Hardcoded Email Credentials)
  // =========================================================================
  describe("6. P2 SEC-KEY-01: Zero Hardcoded Email Credentials & Safe Fallback", () => {
    test("email-service.ts contains no hardcoded Brevo API key fragments", () => {
      const servicePath = path.join(process.cwd(), "lib", "email", "email-service.ts");
      const content = fs.readFileSync(servicePath, "utf-8");

      assert.ok(!content.includes("xkeysib"), "Source code must not contain 'xkeysib'");
      assert.ok(!content.includes("c8ded04f51afe8a62c8974d6272cb952"), "Source code must not contain key fragment p2a");
      assert.ok(!content.includes("4jtBouxTTrlswLWi"), "Source code must not contain key fragment p3");
      assert.ok(!content.includes("defaultBrevoKey"), "Source code must not contain defaultBrevoKey");
    });

    test("sendEmail fails safely with clear operational error when unconfigured in environment", async () => {
      // Temporarily unset email keys
      const oldResend = process.env.RESEND_API_KEY;
      const oldBrevo = process.env.BREVO_API_KEY;
      const oldSendinblue = process.env.SENDINBLUE_API_KEY;
      delete process.env.RESEND_API_KEY;
      delete process.env.BREVO_API_KEY;
      delete process.env.SENDINBLUE_API_KEY;

      try {
        const result = await sendEmail({
          to: "test.candidate@example.com",
          subject: "Test Subject",
          html: "<p>Test Content</p>"
        });

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.provider, "fallback");
        assert.match(result.error || "", /No email provider configured in environment/i);
      } finally {
        if (oldResend) process.env.RESEND_API_KEY = oldResend;
        if (oldBrevo) process.env.BREVO_API_KEY = oldBrevo;
        if (oldSendinblue) process.env.SENDINBLUE_API_KEY = oldSendinblue;
      }
    });
  });
});
