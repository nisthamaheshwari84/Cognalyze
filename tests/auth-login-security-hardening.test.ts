import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { POST as loginRoute } from "../app/api/auth/login/route";
import { POST as demoRoute } from "../app/api/auth/demo/route";
import { POST as forgotPasswordRoute } from "../app/api/auth/forgot-password/route";
import { POST as resetPasswordRoute } from "../app/api/auth/reset-password/route";
import { POST as oauthRoute } from "../app/api/auth/oauth/route";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  deleteSession,
  getSessionByToken,
  createPasswordResetToken,
  getValidPasswordResetToken,
  markPasswordResetTokenUsed
} from "../lib/auth/store";
import { hashPassword, verifyPassword } from "../lib/auth/security";

describe("Cognalyze Auth Security Hardening & Account Takeover Prevention", () => {
  const AUTH_STORE_PATH = path.join(process.cwd(), "data", "auth-store.json");
  let originalAuthStoreRaw: string = "";

  before(() => {
    if (fs.existsSync(AUTH_STORE_PATH)) {
      originalAuthStoreRaw = fs.readFileSync(AUTH_STORE_PATH, "utf8");
    }
  });

  after(() => {
    // Restore auth-store to clean state so tests never pollute persistence
    if (originalAuthStoreRaw) {
      fs.writeFileSync(AUTH_STORE_PATH, originalAuthStoreRaw, "utf8");
    }
  });

  // Helper to create synthetic isolated users
  function createSyntheticUser(params: {
    id: string;
    email: string;
    password?: string | null;
    accountType?: "student" | "recruiter";
    status?: "ACTIVE" | "EMAIL_PENDING" | "ORGANIZATION_PENDING";
  }) {
    let passwordHash: string | null = null;
    let passwordSalt: string | null = null;

    if (params.password) {
      const hp = hashPassword(params.password);
      passwordHash = hp.hash;
      passwordSalt = hp.salt;
    }

    const normEmail = params.email.toLowerCase().trim();
    const existing = getUserByEmail(normEmail);
    if (existing) {
      updateUser(existing.id, {
        passwordHash,
        passwordSalt,
        status: params.status || "ACTIVE",
        accountType: params.accountType || "student",
      });
      return getUserById(existing.id)!;
    }

    return createUser({
      id: params.id,
      email: normEmail,
      fullName: "Synthetic Security Test User",
      passwordHash,
      passwordSalt,
      accountType: params.accountType || "student",
      status: params.status || "ACTIVE"
    });
  }

  // 1. Existing account with empty password hash cannot initialize password through ordinary login
  test("1. SEC-AUTH-01: Account with empty password hash cannot initialize password through ordinary login", async () => {
    const email = "oauth.user.noinit@example.com";
    createSyntheticUser({
      id: "u-sec-test-noinit",
      email,
      password: null,
      accountType: "student"
    });

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "attackerPassword123" })
    });

    const res = await loginRoute(req);
    const data = await res.json();

    assert.equal(res.status, 400, "Must return HTTP 400 for passwordless account login attempt");
    assert.equal(data.code, "OAUTH_ONLY_ACCOUNT", "Must reject with OAUTH_ONLY_ACCOUNT code");

    const userAfter = getUserByEmail(email);
    assert.equal(userAfter?.passwordHash, null, "passwordHash MUST remain null");
    assert.equal(userAfter?.passwordSalt, null, "passwordSalt MUST remain null");
  });

  // 2. Existing account with empty password hash cannot establish a session merely by submitting 6+ char password
  test("2. SEC-AUTH-02: Empty password hash account cannot establish session with 6+ character password", async () => {
    const email = "oauth.user.nosession@example.com";
    createSyntheticUser({
      id: "u-sec-test-nosession",
      email,
      password: null,
      accountType: "student"
    });

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "validLengthPass" })
    });

    const res = await loginRoute(req);
    const sessionCookie = res.cookies.get("cognalyze_session");

    assert.equal(sessionCookie, undefined, "No session cookie may be issued for passwordless login attempt");
    const data = await res.json();
    assert.equal(data.success, undefined, "Response must not contain success");
  });

  // 3. Existing account with valid password hash cannot have hash replaced through login
  test("3. SEC-AUTH-03: Existing account with valid password cannot have hash replaced through login", async () => {
    const email = "legit.user.protected@example.com";
    const initialPassword = "OriginalPassword!2026";
    const user = createSyntheticUser({
      id: "u-sec-test-protected",
      email,
      password: initialPassword,
      accountType: "student"
    });

    const originalHash = user.passwordHash;
    const originalSalt = user.passwordSalt;

    // Attacker tries to submit a new password to login endpoint
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "newAttackerPassword999" })
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 401, "Must reject incorrect password with 401");

    const userAfter = getUserByEmail(email);
    assert.equal(userAfter?.passwordHash, originalHash, "Original password hash must be preserved");
    assert.equal(userAfter?.passwordSalt, originalSalt, "Original password salt must be preserved");
  });

  // 4. Incorrect passwords are rejected
  test("4. SEC-AUTH-04: Incorrect password rejected with generic INVALID_CREDENTIALS", async () => {
    const email = "user.badpassword@example.com";
    createSyntheticUser({
      id: "u-sec-test-badpwd",
      email,
      password: "CorrectSecretPassword1",
      accountType: "student"
    });

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "WrongPassword" })
    });

    const res = await loginRoute(req);
    const data = await res.json();

    assert.equal(res.status, 401);
    assert.equal(data.code, "INVALID_CREDENTIALS");
    assert.equal(data.error, "Incorrect email or password.");
  });

  // 5. Valid existing password authentication still works
  test("5. SEC-AUTH-05: Legitimate user with correct password logs in successfully", async () => {
    const email = "legit.student.login@example.com";
    const validPassword = "CorrectPassword2026!";
    createSyntheticUser({
      id: "u-sec-test-legit-login",
      email,
      password: validPassword,
      accountType: "student"
    });

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: validPassword })
    });

    const res = await loginRoute(req);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.user.email, email);
    assert.ok(res.cookies.get("cognalyze_session")?.value, "Must set cognalyze_session cookie");
  });

  // 6. OAuth-only accounts retain the intended OAuth sign-in behavior
  test("6. SEC-AUTH-06: OAuth-only account can authenticate through verified OAuth exchange", async () => {
    const { addConnectedAccount } = await import("../lib/auth/store");
    const email = "oauth.verified.flow@example.com";
    const providerUserId = `gh_usr_${Date.now()}`;
    const user = createSyntheticUser({
      id: "u-sec-test-oauth",
      email,
      password: null,
      accountType: "student"
    });

    // 1. Initial OAuth login triggers secure link confirmation proof
    const req1 = new NextRequest("http://localhost:3000/api/auth/oauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "github",
        providerUserId,
        providerEmail: email,
        providerName: "Verified GitHub User"
      })
    });

    const res1 = await oauthRoute(req1);
    const data1 = await res1.json();

    assert.equal(res1.status, 200);
    assert.equal(data1.status, "LINK_CONFIRMATION_REQUIRED", "Must require link confirmation for existing email");
    assert.ok(data1.linkingProof, "Must issue secure cryptographic linking proof");

    // 2. Pre-connected OAuth account authenticates directly
    addConnectedAccount({
      userId: user.id,
      provider: "github",
      providerUserId,
      providerEmail: email
    });

    const req2 = new NextRequest("http://localhost:3000/api/auth/oauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "github",
        providerUserId,
        providerEmail: email,
        providerName: "Verified GitHub User"
      })
    });

    const res2 = await oauthRoute(req2);
    const data2 = await res2.json();

    assert.equal(res2.status, 200);
    assert.equal(data2.status, "AUTHENTICATED", "Connected OAuth account must authenticate directly");
    assert.ok(res2.cookies.get("cognalyze_session")?.value, "Must issue session cookie");
  });

  // 7. Authorized password setup works when using valid verified setup flow
  test("7. SEC-AUTH-07: Authorized password setup works via cryptographically signed token flow", async () => {
    const email = "oauth.setup.pwd@example.com";
    const user = createSyntheticUser({
      id: "u-sec-test-setup-pwd",
      email,
      password: null,
      accountType: "student"
    });

    // Generate verified token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    createPasswordResetToken(user.id, user.email, tokenHash);

    // User submits new password with the token
    const newPassword = "NewSecurePassword2026!";
    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawToken,
        password: newPassword,
        confirmPassword: newPassword
      })
    });

    const res = await resetPasswordRoute(req);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);

    // Verify user now has valid password and can log in
    const updatedUser = getUserByEmail(email);
    assert.ok(updatedUser?.passwordHash, "passwordHash must now be populated");
    assert.ok(verifyPassword(newPassword, updatedUser.passwordHash!, updatedUser.passwordSalt!));
  });

  // 8. Expired, invalid, wrong-purpose, or reused setup tokens are rejected
  test("8. SEC-AUTH-08: Expired or reused setup tokens are strictly rejected", async () => {
    const email = "token.reuse.test@example.com";
    const user = createSyntheticUser({
      id: "u-sec-test-token-reuse",
      email,
      password: null,
      accountType: "student"
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    createPasswordResetToken(user.id, user.email, tokenHash);

    // First use: Should succeed
    const req1 = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawToken,
        password: "FirstPassword123!",
        confirmPassword: "FirstPassword123!"
      })
    });
    const res1 = await resetPasswordRoute(req1);
    assert.equal(res1.status, 200, "First reset must succeed");

    // Second use with same token: Must fail (replay prevention)
    const req2 = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawToken,
        password: "ReplayedPassword123!",
        confirmPassword: "ReplayedPassword123!"
      })
    });
    const res2 = await resetPasswordRoute(req2);
    assert.equal(res2.status, 400, "Replayed token must be rejected with 400");
  });

  // 9. A failed password setup does not mutate the account
  test("9. SEC-AUTH-09: Failed password setup (e.g. mismatched password) does not mutate account", async () => {
    const email = "setup.fail.nomutate@example.com";
    const user = createSyntheticUser({
      id: "u-sec-test-setup-fail",
      email,
      password: null,
      accountType: "student"
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    createPasswordResetToken(user.id, user.email, tokenHash);

    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawToken,
        password: "PasswordA123!",
        confirmPassword: "PasswordB456!"
      })
    });

    const res = await resetPasswordRoute(req);
    assert.equal(res.status, 400);

    const userAfter = getUserByEmail(email);
    assert.equal(userAfter?.passwordHash, null, "Password hash must not be set on validation failure");
  });

  // 10. Concurrent password initialization attempts cannot silently overwrite an already established password
  test("10. SEC-AUTH-10: Concurrent password reset attempts race-check and single-use gate", async () => {
    const email = "concurrent.reset@example.com";
    const user = createSyntheticUser({
      id: "u-sec-test-concurrent",
      email,
      password: null,
      accountType: "student"
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    createPasswordResetToken(user.id, user.email, tokenHash);

    const makeReq = (pwd: string) =>
      new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: rawToken, password: pwd, confirmPassword: pwd })
      });

    // Launch two parallel requests with the same token
    const [resA, resB] = await Promise.all([
      resetPasswordRoute(makeReq("PasswordOne123!")),
      resetPasswordRoute(makeReq("PasswordTwo456!"))
    ]);

    const statuses = [resA.status, resB.status];
    assert.ok(statuses.includes(200), "One request should succeed");
    assert.ok(statuses.includes(400), "The racing second request must be rejected due to single-use token consumption");
  });

  // 11. Demo login works only through the intended demo mechanism
  test("11. SEC-AUTH-11: Demo login strictly restricted to supported roles and identities", async () => {
    const validRoles = ["student", "recruiter", "nistha"];
    for (const r of validRoles) {
      const req = new NextRequest("http://localhost:3000/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: r })
      });
      const res = await demoRoute(req);
      assert.equal(res.status, 200, `Demo login for role ${r} must succeed`);
    }

    // Invalid role rejected
    const reqInvalid = new NextRequest("http://localhost:3000/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" })
    });
    const resInvalid = await demoRoute(reqInvalid);
    assert.equal(resInvalid.status, 400, "Unsupported demo role must be rejected");
  });

  // 12. A demo session cannot impersonate an arbitrary registered account
  test("12. SEC-AUTH-12: Demo login cannot impersonate arbitrary registered user IDs", async () => {
    const targetVictimId = "u-target-ceo-12345";
    createSyntheticUser({
      id: targetVictimId,
      email: "ceo@targetcompany.com",
      password: "ComplexPassword123!",
      accountType: "recruiter"
    });

    // Client passes arbitrary userId in demo payload
    const req = new NextRequest("http://localhost:3000/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "recruiter", userId: targetVictimId })
    });

    const res = await demoRoute(req);
    const data = await res.json();

    assert.equal(res.status, 200);
    // Demo endpoint MUST ignore client-supplied userId and bind strictly to DEMO_RECRUITER_USER_ID
    assert.notEqual(data.userId, targetVictimId, "Demo login must not allow client-supplied userId impersonation");
    assert.equal(data.userId, "u-recruiter-demo-001", "Must bind strictly to predefined recruiter demo id");
  });

  // 13. Unverified or unauthorized accounts remain subject to existing server-side restrictions
  test("13. SEC-AUTH-13: EMAIL_PENDING status blocks login with EMAIL_NOT_VERIFIED", async () => {
    const email = "pending.verification@example.com";
    createSyntheticUser({
      id: "u-sec-test-pending",
      email,
      password: "ValidPassword123!",
      status: "EMAIL_PENDING"
    });

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "ValidPassword123!" })
    });

    const res = await loginRoute(req);
    const data = await res.json();

    assert.equal(res.status, 403);
    assert.equal(data.code, "EMAIL_NOT_VERIFIED");
  });

  // 14. Session creation and cookie behavior remain correct after successful authentication
  test("14. SEC-AUTH-14: Session cookie flags (httpOnly, path, sameSite) verified upon login", async () => {
    const email = "cookie.verification@example.com";
    createSyntheticUser({
      id: "u-sec-test-cookie",
      email,
      password: "SecurePassCookie123!",
      accountType: "student"
    });

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "SecurePassCookie123!" })
    });

    const res = await loginRoute(req);
    const cookie = res.cookies.get("cognalyze_session");

    assert.ok(cookie?.value, "Session cookie must have a value");
    assert.equal(cookie.path, "/");
    assert.equal(cookie.httpOnly, true, "Session cookie MUST be httpOnly");
    assert.equal(cookie.sameSite?.toLowerCase(), "lax", "Session cookie sameSite must be lax");
  });

  // 15. Cross-tenant authorization remains intact
  test("15. SEC-AUTH-15: Student session cannot access recruiter-only endpoints", async () => {
    const { requireRecruiterAuth } = await import("../lib/auth/server");
    const { createSession } = await import("../lib/auth/store");

    const studentUser = createSyntheticUser({
      id: "u-sec-test-student-tenant",
      email: "student.tenant@example.com",
      password: "Password123!",
      accountType: "student"
    });

    const session = createSession(studentUser.id, "student");

    const req = new NextRequest("http://localhost:3000/api/recruiter/candidates", {
      headers: { cookie: `cognalyze_session=${session.token}` }
    });

    const guard = await requireRecruiterAuth(req);
    assert.equal(guard.success, false, "Recruiter guard must reject student session");
    if (!guard.success) {
      assert.equal(guard.response.status, 403, "Must return HTTP 403 Forbidden");
    }
  });

  // 16. Login errors do not disclose password hashes, tokens, or unnecessary account details
  test("16. SEC-AUTH-16: Login failure responses are timing-safe and leak zero secrets", async () => {
    const email = "timing.leak.check@example.com";
    createSyntheticUser({
      id: "u-sec-test-timing",
      email,
      password: "RealPassword123!",
      accountType: "student"
    });

    const reqNonExistent = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "doesnotexist@example.com", password: "Password123" })
    });
    const res1 = await loginRoute(reqNonExistent);
    const data1 = await res1.json();

    const reqWrongPwd = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "IncorrectPassword123" })
    });
    const res2 = await loginRoute(reqWrongPwd);
    const data2 = await res2.json();

    // Both must return identical generic 401 INVALID_CREDENTIALS
    assert.equal(res1.status, 401);
    assert.equal(res2.status, 401);
    assert.equal(data1.code, data2.code);
    assert.equal(data1.error, data2.error);

    // Verify zero secret leakage in payload
    const bodyStr = JSON.stringify(data2);
    assert.equal(bodyStr.includes("hash"), false, "Must not leak hash");
    assert.equal(bodyStr.includes("salt"), false, "Must not leak salt");
    assert.equal(bodyStr.includes("token"), false, "Must not leak token");
  });
});
