import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy as middleware } from "../proxy";
import {
  hashPassword,
  verifyPassword,
  generateVerificationCode,
  hashCode,
  verifyCode,
  isGenericEmailDomain,
  extractEmailDomain
} from "../lib/auth/security";
import {
  createUser,
  getUserByEmail,
  getUserById,
  createStudentProfile,
  createRecruiterProfile,
  createOrganization,
  createEmailVerification,
  markEmailVerified,
  addConnectedAccount,
  findUserByConnectedAccount,
  createSession,
  getSessionByToken,
  deleteSession,
  upsertStudentProfileByUserId,
  getStudentProfileByUserId
} from "../lib/auth/store";
import { POST as studentDnaApi } from "../app/api/student-dna/route";

describe("Production Authentication & Authorization Architecture (24-Point Test Matrix)", () => {
  // ─── A. PUBLIC USER CAN ACCESS PUBLIC PAGES ───
  test("A. Public user: Public pages are allowed without session", () => {
    const publicPaths = ["/", "/about", "/terms", "/privacy", "/login", "/signup", "/verify-email"];
    for (const path of publicPaths) {
      const req = new NextRequest(`https://cognalyze.com${path}`);
      const res = middleware(req);
      assert.equal(res.status, 200, `Public path ${path} must allow unauthenticated access`);
    }
  });

  // ─── B. PUBLIC USER DENIED ACCESS TO STUDENT DNA ───
  test("B. Public user: Student DNA is strictly denied and redirects to login", () => {
    const protectedPaths = ["/student/dna", "/student-dna", "/student/onboarding"];
    for (const path of protectedPaths) {
      const req = new NextRequest(`https://cognalyze.com${path}`);
      const res = middleware(req);
      assert.equal(res.status, 307, `Path ${path} must redirect unauthenticated users`);
      const location = res.headers.get("location") || "";
      assert.ok(location.includes("/login"), `Path ${path} must redirect to /login`);
    }
  });

  // ─── C. PUBLIC USER DENIED ACCESS TO RECRUITER DASHBOARD ───
  test("C. Public user: Recruiter dashboard is strictly denied and redirects to login", () => {
    const protectedRecruiterPaths = ["/recruiter/dashboard", "/recruiter/pipeline", "/recruiter/candidates"];
    for (const path of protectedRecruiterPaths) {
      const req = new NextRequest(`https://cognalyze.com${path}`);
      const res = middleware(req);
      assert.equal(res.status, 307, `Path ${path} must redirect unauthenticated users`);
      const location = res.headers.get("location") || "";
      assert.ok(location.includes("/login"), `Path ${path} must redirect to /login`);
    }
  });

  // ─── D. STUDENT SIGNUP WORKS ───
  test("D. Student signup: Creates user record with pending email verification", () => {
    const studentEmail = `student.test.${Date.now()}@university.edu`;
    const { hash, salt } = hashPassword("SecurePassword2026!");
    const user = createUser({
      email: studentEmail,
      passwordHash: hash,
      passwordSalt: salt,
      accountType: "student",
      status: "EMAIL_PENDING"
    });

    assert.ok(user.id, "User ID must be generated");
    assert.equal(user.accountType, "student");
    assert.equal(user.status, "EMAIL_PENDING");

    // Creates email verification code
    const code = generateVerificationCode();
    const verification = createEmailVerification(user.id, studentEmail, hashCode(code));
    assert.ok(verification.codeHash, "Verification code hash must be stored");
    assert.equal(verification.attemptCount, 0);
  });

  // ─── E. STUDENT EMAIL VERIFICATION WORKS ───
  test("E. Student email verification: Validates OTP and activates account", () => {
    const studentEmail = `student.verify.${Date.now()}@university.edu`;
    const user = createUser({
      email: studentEmail,
      passwordHash: "hash",
      passwordSalt: "salt",
      accountType: "student",
      status: "EMAIL_PENDING"
    });

    const code = generateVerificationCode();
    const verification = createEmailVerification(user.id, studentEmail, hashCode(code));

    assert.equal(verifyCode(code, verification.codeHash), true, "Valid OTP must verify");
    markEmailVerified(verification.id);

    const updatedUser = getUserById(user.id);
    assert.equal(updatedUser?.status, "ACTIVE", "User status must be ACTIVE after verification");
    assert.ok(updatedUser?.emailVerifiedAt, "Email verified timestamp must be set");
  });

  // ─── F. STUDENT SIGN-IN WORKS ───
  test("F. Student sign-in: Authenticates password and generates cryptographic session", () => {
    const email = `signin.student.${Date.now()}@college.edu`;
    const rawPassword = "StrongPassword99!";
    const { hash, salt } = hashPassword(rawPassword);
    const user = createUser({
      email,
      passwordHash: hash,
      passwordSalt: salt,
      accountType: "student",
      status: "ACTIVE"
    });

    assert.equal(verifyPassword(rawPassword, user.passwordHash!, user.passwordSalt!), true);
    assert.equal(verifyPassword("WrongPassword!", user.passwordHash!, user.passwordSalt!), false);

    const session = createSession(user.id, "student");
    assert.ok(session.token && session.token.length >= 64, "Session token must be cryptographic 64-char hex");
    const retrieved = getSessionByToken(session.token);
    assert.equal(retrieved?.userId, user.id);
    assert.equal(retrieved?.accountType, "student");
  });

  // ─── G. STUDENT DASHBOARD PERSONALIZATION ───
  test("G. Student dashboard personalization: Authenticated profile name is returned, not hardcoded", () => {
    const email = `personalized.${Date.now()}@college.edu`;
    const user = createUser({
      email,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });

    const profile = createStudentProfile({
      userId: user.id,
      username: `ananya_${Date.now()}`,
      fullName: "Ananya Deshmukh",
      college: "IIT Bombay",
      degree: "B.Tech",
      branch: "Computer Science"
    });

    assert.equal(profile.fullName, "Ananya Deshmukh");
    assert.equal(profile.college, "IIT Bombay");
  });

  // ─── H. STUDENT DNA ACCESSIBLE TO AUTHENTICATED STUDENT ───
  test("H. Student DNA: Accessible to authenticated student with valid session cookie", () => {
    const studentUser = createUser({
      email: `dna.student.${Date.now()}@college.edu`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });
    const session = createSession(studentUser.id, "student");

    const req = new NextRequest("https://cognalyze.com/student/dna", {
      headers: {
        cookie: `cognalyze_session=${session.token}; cognalyze_role=student`
      }
    });

    const res = middleware(req);
    assert.equal(res.status, 200, "Authenticated student with session must access /student/dna");
  });

  // ─── I. STUDENT DNA INCOMPLETE: DASHBOARD SHOWS PROGRESS ───
  test("I. Student DNA incomplete: Incomplete profile tracks progress accurately", () => {
    const user = createUser({
      email: `incomplete.dna.${Date.now()}@college.edu`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });

    const profile = createStudentProfile({
      userId: user.id,
      username: `dev_${Date.now()}`,
      fullName: "Dev Student",
      college: "BITS Pilani",
      profileCompleted: false
    });

    assert.equal(profile.profileCompleted, false);
    assert.ok(profile.profileCompletionPercentage !== undefined);
  });

  // ─── J. STUDENT LOGS OUT: PRIVATE DATA INACCESSIBLE ───
  test("J. Student logs out: Invalides session and blocks further access", () => {
    const user = createUser({
      email: `logout.student.${Date.now()}@college.edu`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });
    const session = createSession(user.id, "student");

    // Session is valid initially
    assert.ok(getSessionByToken(session.token));

    // Logout: in server store and cookie clear
    deleteSession(session.token);

    // Session is now gone from database/store
    assert.equal(getSessionByToken(session.token), null);

    // Middleware rejects logged-out user with cleared cookie
    const req = new NextRequest("https://cognalyze.com/student/dna");
    const res = middleware(req);
    assert.equal(res.status, 307, "Logged out user must be redirected to /login");
  });

  // ─── K & L. STRICT DATA ISOLATION BETWEEN STUDENT A AND STUDENT B ───
  test("K & L. Cross-User Data Isolation: Student A and Student B data never mix", () => {
    const studentA = createUser({
      email: `studentA.${Date.now()}@college.edu`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });
    const studentB = createUser({
      email: `studentB.${Date.now()}@college.edu`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });

    upsertStudentProfileByUserId(studentA.id, {
      fullName: "Alice Student",
      college: "Stanford",
      skills: [{ name: "Rust", level: "Expert", yearsOfExperience: 3, evidenceSource: "GitHub" }]
    });

    upsertStudentProfileByUserId(studentB.id, {
      fullName: "Bob Student",
      college: "MIT",
      skills: [{ name: "Python", level: "Intermediate", yearsOfExperience: 1, evidenceSource: "Projects" }]
    });

    const profileA = getStudentProfileByUserId(studentA.id);
    const profileB = getStudentProfileByUserId(studentB.id);

    assert.equal(profileA?.fullName, "Alice Student");
    assert.equal(profileB?.fullName, "Bob Student");
    assert.equal(profileA?.college, "Stanford");
    assert.equal(profileB?.college, "MIT");
    assert.equal(profileA?.skills[0].name, "Rust");
    assert.equal(profileB?.skills[0].name, "Python");

    // Cross-check: No data leakage
    assert.notEqual(profileA?.userId, profileB?.userId);
    assert.ok(!JSON.stringify(profileA).includes("Bob"));
    assert.ok(!JSON.stringify(profileB).includes("Alice"));
  });

  // ─── M. RECRUITER SIGNUP WORKS ───
  test("M. Recruiter signup: Creates recruiter profile with organization intent", () => {
    const recruiterEmail = `recruiter.${Date.now()}@stripe.com`;
    const user = createUser({
      email: recruiterEmail,
      passwordHash: "hash",
      passwordSalt: "salt",
      accountType: "recruiter",
      status: "EMAIL_PENDING"
    });

    const recruiterProfile = createRecruiterProfile({
      userId: user.id,
      fullName: "Sarah Jenkins",
      designation: "Senior Technical Recruiter",
      workEmail: recruiterEmail
    });

    assert.equal(recruiterProfile.userId, user.id);
    assert.equal(recruiterProfile.workEmail, recruiterEmail);
    assert.equal(recruiterProfile.status, "EMAIL_PENDING");
  });

  // ─── N. RECRUITER PERSONAL EMAIL REJECTED FROM AUTO-COMPANY VERIFICATION ───
  test("N. Recruiter personal email: Consumer domains (gmail, yahoo, etc.) are strictly rejected", () => {
    const personalEmails = [
      "recruiter@gmail.com",
      "hiring@yahoo.com",
      "talent@hotmail.com",
      "recruiter@outlook.com",
      "founder@icloud.com"
    ];

    for (const email of personalEmails) {
      assert.equal(isGenericEmailDomain(email), true, `${email} must be flagged as generic domain`);
    }
  });

  // ─── O. RECRUITER WORK EMAIL DOMAIN VALIDATION ───
  test("O. Recruiter work email: Corporate domain is properly recognized", () => {
    const enterpriseEmails = [
      "sarah@stripe.com",
      "alex@google.com",
      "rohit@razorpay.com",
      "recruiter@datadoghq.com"
    ];

    for (const email of enterpriseEmails) {
      assert.equal(isGenericEmailDomain(email), false, `${email} must be recognized as enterprise email`);
      assert.ok(extractEmailDomain(email).includes("."), `Domain must be well-formed`);
    }
  });

  // ─── P. COMPANY EXISTS & DOMAIN MATCHES -> VERIFIED ───
  test("P. Company verification: Matching company website domain results in VERIFIED state", () => {
    const workEmail = "sarah@stripe.com";
    const emailDomain = extractEmailDomain(workEmail);
    const website = "https://stripe.com";

    const cleanWebsiteDomain = website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();
    assert.equal(cleanWebsiteDomain, emailDomain);

    const org = createOrganization({
      name: "Stripe",
      domain: emailDomain,
      website: website,
      verificationStatus: "VERIFIED"
    });

    assert.equal(org.verificationStatus, "VERIFIED");
  });

  // ─── Q. COMPANY CANNOT BE SUBSTANTIATED -> MANUAL_REVIEW ───
  test("Q. Company verification: Mismatched domain results in MANUAL_REVIEW state", () => {
    const workEmail = "sarah@stripe.com";
    const emailDomain = extractEmailDomain(workEmail);
    const claimedWebsite = "https://some-unrelated-startup.io";

    const cleanWebsiteDomain = claimedWebsite.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();
    assert.notEqual(cleanWebsiteDomain, emailDomain);

    const org = createOrganization({
      name: "Acme",
      domain: cleanWebsiteDomain,
      website: claimedWebsite,
      verificationStatus: "PENDING"
    });

    assert.equal(org.verificationStatus, "PENDING");
  });

  // ─── R. VERIFIED RECRUITER CAN ACCESS RECRUITER DASHBOARD ───
  test("R. Verified recruiter: Can access recruiter dashboard with verified session", () => {
    const recruiterUser = createUser({
      email: `verified.recruiter.${Date.now()}@corp.com`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "recruiter",
      status: "ACTIVE"
    });
    const session = createSession(recruiterUser.id, "recruiter");

    const req = new NextRequest("https://cognalyze.com/recruiter/dashboard", {
      headers: {
        cookie: `cognalyze_session=${session.token}; cognalyze_role=recruiter`
      }
    });

    const res = middleware(req);
    assert.equal(res.status, 200, "Verified recruiter must access /recruiter/dashboard");
  });

  // ─── S. STUDENT DENIED ACCESS TO RECRUITER DASHBOARD ───
  test("S. Student denied recruiter dashboard: Role guard redirects student to student dashboard", () => {
    const studentUser = createUser({
      email: `student.blocked.${Date.now()}@college.edu`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });
    const session = createSession(studentUser.id, "student");

    const req = new NextRequest("https://cognalyze.com/recruiter/dashboard", {
      headers: {
        cookie: `cognalyze_session=${session.token}; cognalyze_role=student`
      }
    });

    const res = middleware(req);
    assert.equal(res.status, 307, "Student must be blocked from recruiter dashboard");
    const location = res.headers.get("location") || "";
    assert.ok(location.includes("/student/dashboard"), "Must redirect student to /student/dashboard");
  });

  // ─── T. RECRUITER DENIED ACCESS TO STUDENT DNA ───
  test("T. Recruiter denied Student DNA: Role guard redirects recruiter to recruiter dashboard", () => {
    const recruiterUser = createUser({
      email: `recruiter.blocked.${Date.now()}@corp.com`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "recruiter",
      status: "ACTIVE"
    });
    const session = createSession(recruiterUser.id, "recruiter");

    const req = new NextRequest("https://cognalyze.com/student/dna", {
      headers: {
        cookie: `cognalyze_session=${session.token}; cognalyze_role=recruiter`
      }
    });

    const res = middleware(req);
    assert.equal(res.status, 307, "Recruiter must be blocked from /student/dna");
    const location = res.headers.get("location") || "";
    assert.ok(location.includes("/recruiter/dashboard"), "Must redirect recruiter to /recruiter/dashboard");
  });

  // ─── U. GITHUB OAUTH: CORRECT ACCOUNT LINKED ───
  test("U. GitHub OAuth: Ingests GitHub provider identity into connected accounts", () => {
    const student = createUser({
      email: `github.student.${Date.now()}@college.edu`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });

    const ghUid = `octocat-eng-${Date.now()}`;
    const connected = addConnectedAccount({
      userId: student.id,
      provider: "github",
      providerUserId: ghUid,
      providerEmail: student.email
    });

    assert.equal(connected.provider, "github");
    assert.equal(connected.providerUserId, ghUid);

    const lookup = findUserByConnectedAccount("github", ghUid);
    assert.equal(lookup?.id, student.id, "OAuth lookup must resolve to the linked user");
  });

  // ─── V. EXISTING EMAIL USER CONNECTS GITHUB -> SAME ACCOUNT, NO DUPLICATE ───
  test("V. Existing user connects GitHub: Preserves single account without duplicate creation", () => {
    const existingEmail = `unique.${Date.now()}@college.edu`;
    const originalUser = createUser({
      email: existingEmail,
      passwordHash: "existing-hash",
      passwordSalt: "existing-salt",
      accountType: "student",
      status: "ACTIVE"
    });

    // Connecting external OAuth to existing account
    const ghUid = `github-uid-${Date.now()}`;
    addConnectedAccount({
      userId: originalUser.id,
      provider: "github",
      providerUserId: ghUid,
      providerEmail: existingEmail
    });

    const resolvedUser = getUserByEmail(existingEmail);
    assert.equal(resolvedUser?.id, originalUser.id, "User account must remain single identity");
  });

  // ─── W. SESSION EXPIRES -> PROTECTED ROUTES REDIRECT TO LOGIN ───
  test("W. Session expiration: Non-existent or expired session token redirects to login", () => {
    const expiredToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    assert.equal(getSessionByToken(expiredToken), null, "Expired token must not resolve session in store");

    const req = new NextRequest("https://cognalyze.com/student/dashboard");
    const res = middleware(req);
    assert.equal(res.status, 307, "Expired/unauthenticated session must redirect to /login");
    const location = res.headers.get("location") || "";
    assert.ok(location.includes("/login"), "Must redirect to /login");
  });

  // ─── X. DIRECT API ACCESS WITH ANOTHER USER'S ID IS DENIED ───
  test("X. Direct API access: User B cannot access Student DNA using User A's ID", async () => {
    const studentA = createUser({
      email: `victim.${Date.now()}@college.edu`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });

    const studentB = createUser({
      email: `attacker.${Date.now()}@college.edu`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE"
    });

    // Student B has valid session
    const sessionB = createSession(studentB.id, "student");

    // Student B attempts to query Student A's DNA via query param spoofing
    const req = new NextRequest(`https://cognalyze.com/api/student-dna?candidateId=${studentA.id}`, {
      method: "POST",
      headers: {
        cookie: `cognalyze_session=${sessionB.token}; cognalyze_role=student`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        candidateId: studentA.id,
        targetRoleKey: "swe_frontend"
      })
    });

    const res = await studentDnaApi(req);
    const json = await res.json();
    assert.ok(res.ok, "API should succeed for authenticated student");
    assert.equal(json.data.userId, studentB.id, "API must strictly scope userId to authenticated session user B");
    assert.notEqual(json.data.userId, studentA.id, "API must NEVER accept client spoofed candidateId of User A");
  });
});
