/**
 * Phase 2 Verification Suite: Student Identity, Cross-User Isolation,
 * Token Redaction, SSRF Defense, Source Disconnection & Data Purge.
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { NextRequest } from "next/server";

import {
  addConnectedAccount,
  createSession,
  createStudentProfile,
  createUser,
  deleteSession,
  getConnectedAccountsByUserId,
  getDecryptedTokenForUser,
} from "../lib/auth/store";
import { addStudentEvidenceRecord, getStudentEvidenceList, invalidateUserDNAScope } from "../lib/dna/store";
import { getDnaSecurityAuditLogs, sanitizeConnectedAccountForClient } from "../lib/dna/security-audit";
import { isSafePublicUrl } from "../lib/resilience/security";

import { GET as sessionGetRoute } from "../app/api/auth/session/route";
import { GET as skillWhyGetRoute } from "../app/api/student-dna/skills/[skillId]/route";
import { GET as studentEvidenceGetRoute, POST as studentEvidencePostRoute } from "../app/api/student/evidence/route";
import { GET as dnaEvidenceGetRoute, POST as dnaEvidencePostRoute } from "../app/api/student-dna/evidence/route";
import { GET as sourceIntelGetRoute } from "../app/api/student-dna/source-intelligence/route";
import { POST as gapAnalysisPostRoute } from "../app/api/student-dna/gap-analysis/route";
import { GET as metricProofGetRoute } from "../app/api/student-dna/metric-proof/route";
import { GET as oppsGetRoute } from "../app/api/student-dna/opportunities/route";
import { POST as actionPostRoute } from "../app/api/student-dna/action/route";
import {
  GET as privacyGetRoute,
  POST as privacyPostRoute,
  DELETE as privacyDeleteRoute,
} from "../app/api/student-dna/privacy/route";
import { POST as webhookSubscribeRoute } from "../app/api/v1/webhooks/subscribe/route";

function makeReq(url: string, opts: { method?: string; sessionToken?: string; body?: any } = {}): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.sessionToken) {
    headers.cookie = `cognalyze_session=${encodeURIComponent(opts.sessionToken)}`;
  }
  return new NextRequest(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

test("Phase 2 — Student DNA Identity, Privacy, SSRF & Cross-User Isolation Verification", async (t) => {
  const suffix = crypto.randomBytes(4).toString("hex");
  const studentAId = `p2_stu_a_${suffix}`;
  const studentBId = `p2_stu_b_${suffix}`;
  const recruiterId = `p2_rec_${suffix}`;

  const userA = createUser({
    id: studentAId,
    email: `p2_a_${suffix}@example.test`,
    fullName: "Student Alpha",
    passwordHash: null,
    passwordSalt: null,
    accountType: "student",
    status: "ACTIVE",
    profileCompleted: true,
  });
  createStudentProfile({
    userId: userA.id,
    username: `alpha_${suffix}`,
    fullName: "Student Alpha",
    githubUrl: "https://github.com/alpha-dev",
    skills: [{ name: "Python", category: "Language", level: "Advanced" }],
    profileCompleted: true,
    profileCompletionPercentage: 85,
  });
  const secretTokenA = `ghp_secret_alpha_${suffix}_TOKENVALUE`;
  addConnectedAccount({
    userId: userA.id,
    provider: "github",
    providerUserId: `gh_a_${suffix}`,
    providerEmail: userA.email,
    accessToken: secretTokenA,
    tokenScope: ["read:user"],
  });
  await addStudentEvidenceRecord(userA.id, {
    sourceType: "github",
    sourceId: `repo_a_${suffix}`,
    userId: userA.id,
    skillRaw: "Python",
    evidenceType: "repository_inspection",
    claim: "Student Alpha authored async FastAPI microservice in repo_a",
    strength: 0.9,
    trustedServerVerified: true,
  });

  const userB = createUser({
    id: studentBId,
    email: `p2_b_${suffix}@example.test`,
    fullName: "Student Beta",
    passwordHash: null,
    passwordSalt: null,
    accountType: "student",
    status: "ACTIVE",
    profileCompleted: true,
  });
  createStudentProfile({
    userId: userB.id,
    username: `beta_${suffix}`,
    fullName: "Student Beta",
    githubUrl: "https://github.com/beta-dev",
    skills: [{ name: "Rust", category: "Language", level: "Advanced" }],
    profileCompleted: true,
    profileCompletionPercentage: 85,
  });
  await addStudentEvidenceRecord(userB.id, {
    sourceType: "github",
    sourceId: `repo_b_${suffix}`,
    userId: userB.id,
    skillRaw: "Rust",
    evidenceType: "repository_inspection",
    claim: "Student Beta authored secret zero-copy Rust parser",
    strength: 0.92,
    trustedServerVerified: true,
  });

  const recUser = createUser({
    id: recruiterId,
    email: `p2_rec_${suffix}@corp.test`,
    fullName: "Recruiter One",
    passwordHash: null,
    passwordSalt: null,
    accountType: "recruiter",
    status: "ACTIVE",
  });

  const sessionA = createSession(userA.id, "student");
  const sessionB = createSession(userB.id, "student");
  const sessionRec = createSession(recUser.id, "recruiter");

  try {
    await t.test("1. All Student DNA & Evidence endpoints reject unauthenticated access (401 + no-store)", async () => {
      const checks = await Promise.all([
        skillWhyGetRoute(makeReq("http://127.0.0.1:3000/api/student-dna/skills/python"), {
          params: Promise.resolve({ skillId: "python" }),
        }),
        studentEvidenceGetRoute(makeReq("http://127.0.0.1:3000/api/student/evidence")),
        dnaEvidenceGetRoute(makeReq("http://127.0.0.1:3000/api/student-dna/evidence")),
        sourceIntelGetRoute(makeReq("http://127.0.0.1:3000/api/student-dna/source-intelligence")),
        metricProofGetRoute(makeReq("http://127.0.0.1:3000/api/student-dna/metric-proof")),
        oppsGetRoute(makeReq("http://127.0.0.1:3000/api/student-dna/opportunities")),
        privacyGetRoute(makeReq("http://127.0.0.1:3000/api/student-dna/privacy")),
        gapAnalysisPostRoute(makeReq("http://127.0.0.1:3000/api/student-dna/gap-analysis", { method: "POST", body: {} })),
        actionPostRoute(
          makeReq("http://127.0.0.1:3000/api/student-dna/action", {
            method: "POST",
            body: { actionId: "act_1", skillId: "python" },
          }),
        ),
        webhookSubscribeRoute(
          makeReq("http://127.0.0.1:3000/api/v1/webhooks/subscribe", {
            method: "POST",
            body: { targetUrl: "https://example.com/hook" },
          }),
        ),
      ]);

      for (const res of checks) {
        assert.equal(res.status, 401, `Expected 401 on unauthenticated request, got ${res.status}`);
        assert.match(res.headers.get("cache-control") || "", /no-store/);
      }
    });

    await t.test("2. Student A cannot read or mutate Student B data via query params, paths, or request bodies (403 + audit logged)", async () => {
      const crossAttempts = await Promise.all([
        skillWhyGetRoute(
          makeReq(`http://127.0.0.1:3000/api/student-dna/skills/rust?candidateId=${studentBId}`, {
            sessionToken: sessionA.token,
          }),
          { params: Promise.resolve({ skillId: "rust" }) },
        ),
        studentEvidenceGetRoute(
          makeReq(`http://127.0.0.1:3000/api/student/evidence?candidateId=${studentBId}`, {
            sessionToken: sessionA.token,
          }),
        ),
        dnaEvidenceGetRoute(
          makeReq(`http://127.0.0.1:3000/api/student-dna/evidence?candidateId=${studentBId}`, {
            sessionToken: sessionA.token,
          }),
        ),
        dnaEvidencePostRoute(
          makeReq("http://127.0.0.1:3000/api/student-dna/evidence", {
            method: "POST",
            sessionToken: sessionA.token,
            body: { userId: studentBId, sourceType: "project", sourceId: "x", skillRaw: "Rust", evidenceType: "claim", claim: "Spoof" },
          }),
        ),
        sourceIntelGetRoute(
          makeReq(`http://127.0.0.1:3000/api/student-dna/source-intelligence?candidateId=${studentBId}`, {
            sessionToken: sessionA.token,
          }),
        ),
        gapAnalysisPostRoute(
          makeReq("http://127.0.0.1:3000/api/student-dna/gap-analysis", {
            method: "POST",
            sessionToken: sessionA.token,
            body: { candidateId: studentBId, roleKey: "sde_intern" },
          }),
        ),
        metricProofGetRoute(
          makeReq(`http://127.0.0.1:3000/api/student-dna/metric-proof?candidateId=${studentBId}`, {
            sessionToken: sessionA.token,
          }),
        ),
        privacyGetRoute(
          makeReq(`http://127.0.0.1:3000/api/student-dna/privacy?candidateId=${studentBId}`, {
            sessionToken: sessionA.token,
          }),
        ),
        studentEvidencePostRoute(
          makeReq("http://127.0.0.1:3000/api/student/evidence", {
            method: "POST",
            sessionToken: sessionA.token,
            body: { candidateId: studentBId },
          }),
        ),
      ]);

      for (const res of crossAttempts) {
        assert.equal(res.status, 403, `Expected 403 on cross-user request, got ${res.status}`);
        assert.match(res.headers.get("cache-control") || "", /no-store/);
      }

      const logsA = getDnaSecurityAuditLogs(studentAId);
      assert.ok(
        logsA.some((l) => l.action === "CROSS_USER_ACCESS_DENIED" && l.outcome === "DENIED"),
        "Security audit log must record blocked cross-user attempts",
      );
    });

    await t.test("3. Recruiters are blocked from private Student DNA endpoints directly (403)", async () => {
      const recChecks = await Promise.all([
        skillWhyGetRoute(
          makeReq(`http://127.0.0.1:3000/api/student-dna/skills/python?candidateId=${studentAId}`, {
            sessionToken: sessionRec.token,
          }),
          { params: Promise.resolve({ skillId: "python" }) },
        ),
        studentEvidenceGetRoute(
          makeReq(`http://127.0.0.1:3000/api/student/evidence?candidateId=${studentAId}`, {
            sessionToken: sessionRec.token,
          }),
        ),
      ]);
      for (const res of recChecks) {
        assert.equal(res.status, 403);
      }
    });

    await t.test("4. OAuth tokens and encrypted ciphertexts NEVER expose to frontend APIs", async () => {
      // Encrypted token is present on server vault ONLY
      const decrypted = getDecryptedTokenForUser(studentAId, "github");
      assert.equal(decrypted, secretTokenA);

      const sessRes = await sessionGetRoute(
        makeReq("http://127.0.0.1:3000/api/auth/session", { sessionToken: sessionA.token }),
      );
      assert.equal(sessRes.status, 200);
      const sessText = await sessRes.text();
      assert.equal(sessText.includes(secretTokenA), false, "Raw OAuth token must NEVER appear in /api/auth/session");
      assert.equal(sessText.includes("encryptedAccessToken"), false, "encryptedAccessToken field must be stripped");

      const privRes = await privacyGetRoute(
        makeReq("http://127.0.0.1:3000/api/student-dna/privacy", { sessionToken: sessionA.token }),
      );
      assert.equal(privRes.status, 200);
      const privText = await privRes.text();
      assert.equal(privText.includes(secretTokenA), false);
      assert.equal(privText.includes("encryptedAccessToken"), false);

      const rawAcc = getConnectedAccountsByUserId(studentAId)[0];
      const safeAcc = sanitizeConnectedAccountForClient(rawAcc) as any;
      assert.equal(safeAcc.encryptedAccessToken, undefined);
    });

    await t.test("5. SSRF defense blocks loopback, IPv6, integer/hex/octal obfuscation, CGNAT, and userinfo", async () => {
      const unsafeUrls = [
        "http://localhost:3000/admin",
        "http://127.0.0.1/metadata",
        "http://0x7f000001/secret",
        "http://2130706433/",
        "http://0177.0.0.1/",
        "http://[::1]/internal",
        "http://[::ffff:169.254.169.254]/latest/meta-data",
        "http://100.64.1.5/internal",
        "https://user:pass@example.com/callback",
        "http://example.com:8080/internal",
        "file:///etc/passwd",
      ];
      for (const u of unsafeUrls) {
        assert.equal(isSafePublicUrl(u).safe, false, `Expected SSRF blocker to reject ${u}`);
      }
      assert.equal(isSafePublicUrl("https://api.github.com/users/octocat").safe, true);

      const hookRes = await webhookSubscribeRoute(
        makeReq("http://127.0.0.1:3000/api/v1/webhooks/subscribe", {
          method: "POST",
          sessionToken: sessionA.token,
          body: { targetUrl: "http://0x7f000001/steal" },
        }),
      );
      assert.equal(hookRes.status, 400);
    });

    await t.test("6. Consent management, provider disconnection, and full DNA purge isolate strictly per student", async () => {
      // Grant & verify consent for A
      const grantRes = await privacyPostRoute(
        makeReq("http://127.0.0.1:3000/api/student-dna/privacy", {
          method: "POST",
          sessionToken: sessionA.token,
          body: { action: "grant_consent", scopes: ["student_dna:read"] },
        }),
      );
      assert.equal(grantRes.status, 200);

      // Disconnect GitHub for A only
      const disconnectRes = await privacyDeleteRoute(
        makeReq("http://127.0.0.1:3000/api/student-dna/privacy?provider=github", {
          method: "DELETE",
          sessionToken: sessionA.token,
        }),
      );
      assert.equal(disconnectRes.status, 200);
      const disconnectJson = (await disconnectRes.json()) as any;
      assert.equal(disconnectJson.disconnected, true);
      assert.equal(getConnectedAccountsByUserId(studentAId).length, 0);

      // Verify Student B evidence was NOT affected
      const evidenceB = await getStudentEvidenceList(studentBId);
      assert.ok(evidenceB.some((e) => e.sourceId === `repo_b_${suffix}`), "Student B evidence must remain intact");

      // Full Student DNA purge for Student A
      const purgeRes = await privacyDeleteRoute(
        makeReq("http://127.0.0.1:3000/api/student-dna/privacy?scope=all_dna", {
          method: "DELETE",
          sessionToken: sessionA.token,
        }),
      );
      assert.equal(purgeRes.status, 200);
      invalidateUserDNAScope(studentAId);
      const evidenceAAfterPurge = await getStudentEvidenceList(studentAId);
      assert.equal(evidenceAAfterPurge.length, 0);

      // Student B remains 100% isolated & intact
      const evidenceBAfterPurge = await getStudentEvidenceList(studentBId);
      assert.ok(evidenceBAfterPurge.some((e) => e.sourceId === `repo_b_${suffix}`));
    });
  } finally {
    deleteSession(sessionA.token);
    deleteSession(sessionB.token);
    deleteSession(sessionRec.token);
  }
});
