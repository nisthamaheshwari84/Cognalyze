/**
 * End-to-End Integration, Handoff, Shared DNA & Multi-User Security Tests
 * for Cognalyze <-> Interview Intelligence.
 *
 * Executes actual Cognalyze Next.js Route Handlers and the real Interview Intelligence
 * Express router/middleware stack in-process so it works in zero-network sandboxes and CI.
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { NextRequest } from "next/server";

process.env.COGNALYZE_INTERVIEW_HANDOFF_SECRET =
  process.env.COGNALYZE_INTERVIEW_HANDOFF_SECRET || "test_handoff_secret_64_bytes_minimum_entropy_abcdef1234567890";

import {
  createUser,
  createStudentProfile,
  createSession,
  deleteSession,
} from "../lib/auth/store";
import { addStudentEvidenceRecord, invalidateUserDNAScope, setUserTargetRole } from "../lib/dna/store";
import { getHandoffSecret } from "../lib/interview-intelligence/handoff";

import { POST as launchRoute } from "../app/api/interview-intelligence/launch/route";
import { POST as redeemRoute } from "../app/api/interview-intelligence/redeem/route";
import { GET as dnaBridgeRoute } from "../app/api/interview-intelligence/dna/route";
import {
  GET as syncGetRoute,
  POST as syncPostRoute,
} from "../app/api/interview-intelligence/sync-result/route";
import { POST as logoutRoute } from "../app/api/interview-intelligence/logout/route";

import iiApp from "../interview-intelligence/api/index";
import { interviewRepository } from "../interview-intelligence/src/server/storage/interviewStore";

function createAuthCookieRequest(url: string, opts: { method?: string; sessionToken?: string; body?: any } = {}): NextRequest {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (opts.sessionToken) {
    headers.cookie = `cognalyze_session=${encodeURIComponent(opts.sessionToken)}`;
  }
  return new NextRequest(url, {
    method: opts.method || "POST",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

async function dispatchExpress(
  app: any,
  method: string,
  urlPath: string,
  options: { headers?: Record<string, string>; body?: any } = {},
): Promise<{ status: number; headers: Record<string, string>; json: any; text: string }> {
  const reqStream = new PassThrough() as any;
  const rawBody =
    options.body === undefined
      ? ""
      : typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);

  const lowerHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(options.headers || {})) {
    lowerHeaders[k.toLowerCase()] = v;
  }
  if (rawBody && !lowerHeaders["content-type"]) {
    lowerHeaders["content-type"] = "application/json";
  }
  if (rawBody && !lowerHeaders["content-length"]) {
    lowerHeaders["content-length"] = String(Buffer.byteLength(rawBody));
  }

  reqStream.url = urlPath;
  reqStream.originalUrl = urlPath;
  reqStream.method = method.toUpperCase();
  reqStream.headers = lowerHeaders;
  reqStream.socket = { remoteAddress: "127.0.0.1", encrypted: false };
  reqStream.connection = reqStream.socket;

  if (rawBody) {
    process.nextTick(() => {
      reqStream.push(Buffer.from(rawBody, "utf8"));
      reqStream.push(null);
    });
  } else {
    process.nextTick(() => {
      reqStream.push(null);
    });
  }

  return new Promise((resolve, reject) => {
    const resHeaders: Record<string, string> = {};
    const chunks: Buffer[] = [];
    const resObj: any = new EventEmitter();
    resObj.statusCode = 200;
    resObj.locals = {};
    resObj.headersSent = false;
    resObj.writableEnded = false;
    resObj.setHeader = (name: string, value: any) => {
      resHeaders[name.toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
      return resObj;
    };
    resObj.getHeader = (name: string) => resHeaders[name.toLowerCase()];
    resObj.hasHeader = (name: string) => name.toLowerCase() in resHeaders;
    resObj.removeHeader = (name: string) => {
      delete resHeaders[name.toLowerCase()];
    };
    resObj.getHeaders = () => ({ ...resHeaders });
    resObj.writeHead = (code: number, headersArg?: Record<string, any>) => {
      resObj.statusCode = code;
      if (headersArg) {
        for (const [k, v] of Object.entries(headersArg)) resObj.setHeader(k, v);
      }
      return resObj;
    };
    resObj.flushHeaders = () => {
      resObj.headersSent = true;
    };
    resObj.write = (chunk: any) => {
      resObj.headersSent = true;
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      return true;
    };
    resObj.end = (chunk?: any) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      resObj.writableEnded = true;
      resObj.headersSent = true;
      const text = Buffer.concat(chunks).toString("utf8");
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      resolve({
        status: resObj.statusCode,
        headers: resHeaders,
        json,
        text,
      });
      return resObj;
    };

    try {
      app.handle(reqStream, resObj, (err: any) => {
        if (err) reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

test("Cognalyze <-> Interview Intelligence End-to-End Single-Identity, Handoff, DNA & Multi-User Isolation", async (t) => {
  const originalFetch = globalThis.fetch;
  const prevBaseUrl = process.env.COGNALYZE_API_BASE_URL;
  const virtualCognalyzeOrigin = "http://cognalyze.internal.test";
  process.env.COGNALYZE_API_BASE_URL = virtualCognalyzeOrigin;

  // Route Express server-to-server calls to Cognalyze directly into real Next.js Route Handlers
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (urlStr.startsWith(virtualCognalyzeOrigin)) {
      const parsedUrl = new URL(urlStr);
      const method = (init?.method || "GET").toUpperCase();
      const rawBody = typeof init?.body === "string" ? init.body : undefined;
      const nextReq = new NextRequest(urlStr, {
        method,
        headers: init?.headers as Record<string, string>,
        body: method === "GET" || method === "HEAD" ? undefined : rawBody,
      });
      if (parsedUrl.pathname === "/api/interview-intelligence/redeem") {
        return redeemRoute(nextReq);
      }
      if (parsedUrl.pathname === "/api/interview-intelligence/dna") {
        return dnaBridgeRoute(nextReq);
      }
      if (parsedUrl.pathname === "/api/interview-intelligence/sync-result") {
        return method === "GET" ? syncGetRoute(nextReq) : syncPostRoute(nextReq);
      }
      return new Response(JSON.stringify({ error: "NOT_FOUND" }), { status: 404 });
    }
    return originalFetch(input, init);
  }) as typeof fetch;

  const suffix = crypto.randomBytes(4).toString("hex");
  const studentAId = `stu_a_${suffix}`;
  const studentBId = `stu_b_${suffix}`;
  const usernameA = `ananya_${suffix}`;
  const usernameB = `rohan_${suffix}`;

  const userA = createUser({
    id: studentAId,
    email: `${usernameA}@example.test`,
    fullName: "Ananya Verma",
    passwordHash: null,
    passwordSalt: null,
    accountType: "student",
    status: "ACTIVE",
    profileCompleted: true,
  });
  createStudentProfile({
    userId: userA.id,
    username: usernameA,
    fullName: "Ananya Verma",
    college: "IIIT Hyderabad",
    degree: "B.Tech",
    branch: "Computer Science",
    graduationYear: "2026",
    skills: [
      { name: "TypeScript", category: "Language", level: "Advanced" },
      { name: "Distributed Systems", category: "Architecture", level: "Intermediate" },
    ],
    projects: [
      {
        id: `proj_${suffix}`,
        title: "Realtime Telemetry Pipeline",
        description: "Kafka + Go stream processor handling 25k events/sec",
        techStack: ["Go", "Kafka", "PostgreSQL"],
        contributions: "Designed partitioned consumer groups and backpressure controller",
      },
    ],
    experience: [
      {
        organization: "CloudScale Labs",
        role: "SDE Intern",
        duration: "3 months",
        technologies: ["TypeScript", "Redis"],
      },
    ],
    careerGoals: {
      targetRoles: ["Backend Engineer"],
      preferredDomains: ["Distributed Systems"],
      targetCompanies: ["Stripe", "Atlassian"],
      careerGoalsSummary: "Build reliable high-throughput backend systems.",
    },
    profileCompleted: true,
    profileCompletionPercentage: 90,
  });
  setUserTargetRole(userA.id, "backend_engineer");
  await addStudentEvidenceRecord(userA.id, {
    sourceType: "project",
    sourceId: `proj_${suffix}`,
    userId: userA.id,
    skillRaw: "TypeScript",
    evidenceType: "project_artifact",
    claim: "Built distributed TypeScript services",
    strength: 0.9,
    trustedServerVerified: true,
    metadata: { title: "Realtime Telemetry Pipeline" },
  });
  await addStudentEvidenceRecord(userA.id, {
    sourceType: "project",
    sourceId: `proj2_${suffix}`,
    userId: userA.id,
    skillRaw: "Distributed Systems",
    evidenceType: "project_artifact",
    claim: "Worked with Kafka consumer groups",
    strength: 0.75,
    trustedServerVerified: true,
    metadata: { title: "Realtime Telemetry Pipeline" },
  });
  invalidateUserDNAScope(userA.id);

  const userB = createUser({
    id: studentBId,
    email: `${usernameB}@example.test`,
    fullName: "Rohan Mehta",
    passwordHash: null,
    passwordSalt: null,
    accountType: "student",
    status: "ACTIVE",
    profileCompleted: false,
  });
  createStudentProfile({
    userId: userB.id,
    username: usernameB,
    fullName: "Rohan Mehta",
    skills: [],
    projects: [],
    experience: [],
    profileCompleted: false,
    profileCompletionPercentage: 10,
  });
  invalidateUserDNAScope(userB.id);

  const sessionA = createSession(userA.id, "student");
  const sessionB = createSession(userB.id, "student");

  try {
    await t.test("1. Unauthenticated launch & client-spoofed headers are rejected", async () => {
      const unauthLaunch = await launchRoute(createAuthCookieRequest("http://127.0.0.1:3000/api/interview-intelligence/launch"));
      assert.equal(unauthLaunch.status, 401);
      assert.match(unauthLaunch.headers.get("cache-control") || "", /no-store/);

      const spoofedRes = await dispatchExpress(iiApp, "GET", "/api/interviews", {
        headers: { "X-Cogninest-Student-Id": studentAId },
      });
      assert.equal(spoofedRes.status, 401);
      assert.match(spoofedRes.headers["cache-control"] || "", /no-store/);
    });

    let ticketA = "";
    let tokenA = "";
    let interviewAId = "";

    await t.test("2. Student A issues single-use ticket, redeems it on Express server, and receives real DNA + identity", async () => {
      const launchRes = await launchRoute(
        createAuthCookieRequest("http://127.0.0.1:3000/api/interview-intelligence/launch", {
          sessionToken: sessionA.token,
          body: { targetRole: "Backend Engineer", companyContext: "Stripe" },
        }),
      );
      assert.equal(launchRes.status, 200);
      const launchJson = (await launchRes.json()) as any;
      assert.equal(launchJson.success, true);
      assert.equal(launchJson.identity.userId, studentAId);
      assert.equal(launchJson.identity.username, usernameA);
      assert.ok(typeof launchJson.ticket === "string" && launchJson.ticket.includes("."));
      ticketA = launchJson.ticket;

      const redeemRes = await dispatchExpress(iiApp, "POST", "/api/auth/redeem", {
        body: { ticket: ticketA },
      });
      assert.equal(redeemRes.status, 200);
      assert.match(redeemRes.headers["cache-control"] || "", /no-store/);

      const redeemJson = redeemRes.json;
      assert.equal(redeemJson.authenticated, true);
      assert.equal(redeemJson.identity.userId, studentAId);
      assert.equal(redeemJson.identity.username, usernameA);
      assert.equal(redeemJson.identity.fullName, "Ananya Verma");
      assert.equal(redeemJson.studentDna.hasDna, true);
      assert.ok(
        redeemJson.studentDna.skills.some((s: any) => s.name === "TypeScript"),
        "Student A real TypeScript skill must be included in shared Student DNA",
      );
      assert.ok(
        redeemJson.studentDna.projects.some((p: any) => p.title === "Realtime Telemetry Pipeline"),
        "Student A real project must be included in shared Student DNA",
      );
      tokenA = redeemJson.sessionToken;
      assert.ok(tokenA);
    });

    await t.test("3. Ticket replay, expired ticket, and invalid signature are rejected", async () => {
      const replayRes = await dispatchExpress(iiApp, "POST", "/api/auth/redeem", {
        body: { ticket: ticketA },
      });
      assert.equal(replayRes.status, 409);
      assert.equal(replayRes.json.error, "TICKET_REPLAYED");

      const tamperedTicket = `${ticketA.slice(0, -4)}XXXX`;
      const tamperRes = await dispatchExpress(iiApp, "POST", "/api/auth/redeem", {
        body: { ticket: tamperedTicket },
      });
      assert.equal(tamperRes.status, 401);
      assert.equal(tamperRes.json.error, "INVALID_SIGNATURE");

      const expiredPayload = {
        iss: "cognalyze",
        aud: "interview-intelligence",
        sub: studentAId,
        username: usernameA,
        fullName: "Ananya Verma",
        accountType: "student",
        scope: "interview:launch student_dna:read interview_reports:write",
        jti: crypto.randomBytes(12).toString("hex"),
        nonce: crypto.randomBytes(8).toString("hex"),
        iat: Math.floor(Date.now() / 1000) - 240,
        exp: Math.floor(Date.now() / 1000) - 120,
      };
      const encExpired = Buffer.from(JSON.stringify(expiredPayload))
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const sigExpired = crypto
        .createHmac("sha256", getHandoffSecret())
        .update(encExpired)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const expRes = await dispatchExpress(iiApp, "POST", "/api/auth/redeem", {
        body: { ticket: `${encExpired}.${sigExpired}` },
      });
      assert.equal(expRes.status, 401);
      assert.equal(expRes.json.error, "TICKET_EXPIRED");
    });

    await t.test("4. Student A owns interview session and Student B (empty DNA, zero fabrication) cannot access A's data", async () => {
      interviewAId = `int_a_${suffix}`;
      interviewRepository.saveInterview({
        schemaVersion: "1.0.0",
        id: interviewAId,
        candidateId: studentAId,
        candidateName: "Ananya Verma",
        mode: "adaptive_comprehensive",
        sessionExperience: "mock_practice",
        targetRole: "Backend Engineer",
        seniority: "junior",
        companyContext: "Stripe",
        jobDescription: "",
        status: "completed",
        currentPhase: "PHASE_16_STUDENT_DNA_UPDATE",
        difficultyLevel: "intermediate",
        timeBudgetMinutes: 30,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        turns: [],
        demonstratedSkills: ["TypeScript", "Distributed Systems"],
        unverifiedClaims: [],
        misunderstoodConcepts: [],
        followUpQueue: [],
        competencyScores: {},
        candidateContext: {
          schemaVersion: "1.0.0",
          candidateName: "Ananya Verma",
          education: {
            institution: "IIIT Hyderabad",
            degree: "B.Tech",
            academicYear: "4",
            graduationYear: "2026",
            relevantCoursework: [],
            academicAchievements: [],
            sourceReference: "cognalyze_student_dna",
          },
          technicalSkills: [],
          projects: [],
          experiences: [],
          additionalInfo: {
            certifications: [],
            competitions: [],
            hackathons: [],
            publications: [],
            positionsOfResponsibility: [],
          },
          flaggedClarifications: [],
          rawResumeExcerpt: "",
        },
        roleMatrix: {
          targetRole: "Backend Engineer",
          seniorityLevel: "junior",
          companyName: "Stripe",
          domainScope: [],
          competencies: [],
          unverifiedRequirements: [],
        },
        interviewPlan: {
          strategySummary: "",
          initialDifficulty: "intermediate",
          prioritizedTopics: [],
          codingAssessmentRequired: false,
          estimatedTurns: 5,
        },
        integrityEvents: [],
      } as any);

      const { signServiceHeaders } = await import("../interview-intelligence/src/server/middleware/cognalyzeHandoff");
      const bodyStr = JSON.stringify({ interview: interviewRepository.getInterview(interviewAId) });
      const syncOkRes = await syncPostRoute(
        new NextRequest("http://127.0.0.1:3000/api/interview-intelligence/sync-result", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-cognalyze-verified-user-id": studentAId,
            ...signServiceHeaders("POST", "/api/interview-intelligence/sync-result", bodyStr),
          },
          body: bodyStr,
        }),
      );
      assert.equal(syncOkRes.status, 200);

      // Launch Student B (empty profile -> zero fabrication)
      const launchBRes = await launchRoute(
        createAuthCookieRequest("http://127.0.0.1:3000/api/interview-intelligence/launch", {
          sessionToken: sessionB.token,
        }),
      );
      assert.equal(launchBRes.status, 200);
      const launchBJson = (await launchBRes.json()) as any;
      assert.equal(launchBJson.identity.userId, studentBId);

      const redeemBRes = await dispatchExpress(iiApp, "POST", "/api/auth/redeem", {
        body: { ticket: launchBJson.ticket },
      });
      assert.equal(redeemBRes.status, 200);
      const redeemBJson = redeemBRes.json;
      const tokenB = redeemBJson.sessionToken as string;

      assert.equal(redeemBJson.identity.userId, studentBId);
      assert.equal(redeemBJson.identity.username, usernameB);
      assert.equal(redeemBJson.studentDna.hasDna, false);
      assert.equal(redeemBJson.studentDna.skills.length, 0);
      assert.equal(redeemBJson.studentDna.projects.length, 0);

      // Student B tries to read Student A's interviews, direct interview ID, direct DNA, and spoofed query param
      const bListRes = await dispatchExpress(
        iiApp,
        "GET",
        `/api/interviews?candidateId=${encodeURIComponent(studentAId)}`,
        {
          headers: {
            Authorization: `Bearer ${tokenB}`,
            "X-Cogninest-Student-Id": studentAId,
          },
        },
      );
      assert.equal(bListRes.status, 200);
      assert.equal(
        bListRes.json.interviews.some((i: any) => i.candidateId === studentAId),
        false,
        "Student B must NEVER see Student A interviews even with query param or spoofed header",
      );

      const bDirectRes = await dispatchExpress(iiApp, "GET", `/api/interviews/${interviewAId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.equal(bDirectRes.status, 403);

      const bDnaDirectRes = await dispatchExpress(iiApp, "GET", `/api/student-dna/${encodeURIComponent(studentAId)}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.equal(bDnaDirectRes.status, 403);

      // Concurrent multi-user isolation
      const [concA, concB] = await Promise.all([
        dispatchExpress(iiApp, "GET", "/api/auth/session", { headers: { Authorization: `Bearer ${tokenA}` } }),
        dispatchExpress(iiApp, "GET", "/api/auth/session", { headers: { Authorization: `Bearer ${tokenB}` } }),
      ]);
      assert.equal(concA.status, 200);
      assert.equal(concB.status, 200);
      assert.equal(concA.json.identity.userId, studentAId);
      assert.equal(concB.json.identity.userId, studentBId);
      assert.equal(concA.json.studentDna.hasDna, true);
      assert.equal(concB.json.studentDna.hasDna, false);
    });

    await t.test("5. Logout revokes Interview Intelligence token & Cognalyze session", async () => {
      const logoutIiRes = await dispatchExpress(iiApp, "POST", "/api/auth/logout", {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(logoutIiRes.status, 200);

      const afterLogoutRes = await dispatchExpress(iiApp, "GET", "/api/auth/session", {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(afterLogoutRes.status, 401);

      const cognalyzeLogoutRes = await logoutRoute(
        createAuthCookieRequest("http://127.0.0.1:3000/api/interview-intelligence/logout", {
          sessionToken: sessionA.token,
        }),
      );
      assert.equal(cognalyzeLogoutRes.status, 200);
    });
  } finally {
    deleteSession(sessionA.token);
    deleteSession(sessionB.token);
    globalThis.fetch = originalFetch;
    if (prevBaseUrl === undefined) {
      delete process.env.COGNALYZE_API_BASE_URL;
    } else {
      process.env.COGNALYZE_API_BASE_URL = prevBaseUrl;
    }
  }
});
