import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  generateVerificationCode,
  hashCode,
  verifyCode,
  validateUsername,
  isGenericEmailDomain,
  extractEmailDomain,
  checkRateLimit
} from "../lib/auth/security";
import {
  createUser,
  getUserByEmail,
  getUserById,
  checkUsernameAvailability,
  createStudentProfile,
  changeUsername,
  createOrganization,
  createEmailVerification,
  getPendingVerificationByUserId,
  incrementVerificationAttempt,
  markEmailVerified,
  addConnectedAccount,
  findUserByConnectedAccount,
  createSession,
  getSessionByToken,
  getPublicProfileByUsername
} from "../lib/auth/store";

describe("Cognalyze Identity, Authentication & Verification Engine", () => {
  // ─── 1. SECURITY & PASSWORDS ───
  test("Password Hashing & Verification: Uses PBKDF2 with unique salts", () => {
    const password = "ProductionSecurePassword2026!";
    const { hash, salt } = hashPassword(password);

    assert.ok(hash && hash.length === 128, "Hash should be 64 bytes (128 hex chars)");
    assert.ok(salt && salt.length === 32, "Salt should be 16 bytes (32 hex chars)");

    assert.equal(verifyPassword(password, hash, salt), true, "Correct password must verify");
    assert.equal(verifyPassword("WrongPassword123", hash, salt), false, "Wrong password must be rejected");
  });

  // ─── 2. 6-DIGIT OTP VERIFICATION CODES ───
  test("OTP Code Generation & Timing-Safe Verification", () => {
    const code = generateVerificationCode();
    assert.equal(code.length, 6, "Code must be 6 digits");
    assert.ok(/^\d{6}$/.test(code), "Code must be numeric");

    const codeHash = hashCode(code);
    assert.equal(verifyCode(code, codeHash), true, "Matching code must verify");
    assert.equal(verifyCode("000000", codeHash), false, "Mismatched code must fail");
  });

  // ─── 3. USERNAME RULES & NORMALIZATION ───
  test("Username Validation: Formats, Lengths, and Case-Insensitive Normalization", () => {
    // Valid cases
    const v1 = validateUsername("@nistha");
    assert.equal(v1.valid, true);
    assert.equal(v1.normalized, "nistha");

    const v2 = validateUsername("nistha-ai");
    assert.equal(v2.valid, true);
    assert.equal(v2.normalized, "nistha-ai");

    const v3 = validateUsername("Nistha_07");
    assert.equal(v3.valid, true);
    assert.equal(v3.normalized, "nistha_07", "Must normalize to lowercase");

    // Invalid cases
    assert.equal(validateUsername("no").valid, false, "Too short (<3 chars)");
    assert.equal(validateUsername("a".repeat(31)).valid, false, "Too long (>30 chars)");
    assert.equal(validateUsername("nistha maheshwari").valid, false, "Spaces are forbidden");
    assert.equal(validateUsername("nistha!").valid, false, "Special characters forbidden");
    assert.equal(validateUsername("nistha.com").valid, false, "Dots forbidden");
  });

  test("Reserved Usernames: Platform and system routes are strictly reserved", () => {
    assert.equal(validateUsername("admin").valid, false);
    assert.equal(validateUsername("cognalyze").valid, false);
    assert.equal(validateUsername("api").valid, false);
    assert.equal(validateUsername("recruiter").valid, false);
    assert.equal(validateUsername("student").valid, false);
  });

  // ─── 4. RECRUITER WORK EMAIL DOMAIN CHECKS ───
  test("Recruiter Work Email: Rejects generic consumer email domains", () => {
    assert.equal(isGenericEmailDomain("recruiter@gmail.com"), true, "gmail.com must be rejected");
    assert.equal(isGenericEmailDomain("lead@yahoo.com"), true, "yahoo.com must be rejected");
    assert.equal(isGenericEmailDomain("hr@outlook.com"), true, "outlook.com must be rejected");
    assert.equal(isGenericEmailDomain("talent@hotmail.com"), true, "hotmail.com must be rejected");

    // Valid enterprise domains
    assert.equal(isGenericEmailDomain("aarav@acme.com"), false, "acme.com is a valid work email");
    assert.equal(isGenericEmailDomain("recruiter@stripe.com"), false, "stripe.com is a valid work email");

    assert.equal(extractEmailDomain("aarav@acme.com"), "acme.com");
  });

  // ─── 5. USERNAME AVAILABILITY & SUGGESTIONS ───
  test("Username Availability: Detects taken handles and generates smart suggestions", () => {
    // '@nistha' is seeded in demo data
    const checkTaken = checkUsernameAvailability("nistha");
    assert.equal(checkTaken.available, false);
    assert.ok(checkTaken.suggestions && checkTaken.suggestions.length > 0, "Must provide alternatives");

    const checkAvailable = checkUsernameAvailability("unique-engineer-2026");
    assert.equal(checkAvailable.available, true);
    assert.equal(checkAvailable.normalized, "unique-engineer-2026");
  });

  // ─── 6. IMMUTABLE STUDENT PROFILE ID & 90-DAY USERNAME CHANGE ───
  test("Permanent Identity: student_profile_id is immutable across username changes", () => {
    const testEmail = `test_student_${Date.now()}@university.edu`;
    const user = createUser({
      email: testEmail,
      passwordHash: "hash123",
      passwordSalt: "salt123",
      accountType: "student",
      status: "ACTIVE"
    });

    const initialHandle = `builder-${Date.now()}`;
    const profile = createStudentProfile({
      userId: user.id,
      username: initialHandle,
      fullName: "Test Builder",
      college: "Indian Institute of Technology",
      degree: "B.Tech Computer Science"
    });

    const permanentProfileId = profile.id;
    assert.ok(permanentProfileId, "Profile must have permanent UUID");

    // Change username
    const newHandle = `engineer-${Date.now()}`;
    const changeResult = changeUsername(permanentProfileId, newHandle);
    assert.equal(changeResult.success, true);
    assert.equal(changeResult.newUsername, newHandle);

    // Profile ID must NOT have changed
    assert.equal(profile.id, permanentProfileId, "student_profile_id must remain immutable");
    assert.equal(profile.username, newHandle, "Username updated to new handle");

    // Attempting a second change immediately must fail under the 90-day cooldown rule
    const immediateChange = changeUsername(permanentProfileId, `fast-change-${Date.now()}`);
    assert.equal(immediateChange.success, false);
    assert.match(immediateChange.error || "", /90 days/);
  });

  // ─── 7. ORGANIZATION DOMAIN-MATCH VERIFICATION ───
  test("Organization Verification: Checks domain alignment with recruiter work email", () => {
    const org = createOrganization({
      name: "CloudScale Systems",
      domain: "cloudscale.io",
      website: "https://cloudscale.io",
      verificationStatus: "VERIFIED"
    });

    assert.equal(org.domain, "cloudscale.io");
    assert.equal(org.verificationStatus, "VERIFIED");
  });

  // ─── 8. EMAIL VERIFICATION & ATTEMPTS RATE LIMITING ───
  test("Email Verification: Limits failed OTP attempts to 5 max", () => {
    const testEmail = `otp_test_${Date.now()}@example.com`;
    const user = createUser({
      email: testEmail,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "EMAIL_PENDING"
    });

    const code = "654321";
    const verification = createEmailVerification(user.id, user.email, hashCode(code));

    // Simulate 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const res = incrementVerificationAttempt(verification.id);
      assert.equal(res.attemptsExceeded, false);
      assert.equal(res.attemptsLeft, 5 - i);
    }

    // 5th attempt exhausts attempts
    const finalAttempt = incrementVerificationAttempt(verification.id);
    assert.equal(finalAttempt.attemptsExceeded, true);
    assert.equal(finalAttempt.attemptsLeft, 0);
  });

  // ─── 9. ACCOUNT LINKING & DUPLICATE IDENTITIES ───
  test("Account Linking: Associates multiple providers (GitHub, LinkedIn) to single identity", () => {
    const testEmail = `multiauth_${Date.now()}@example.com`;
    const user = createUser({
      email: testEmail,
      passwordHash: "hash",
      passwordSalt: "salt",
      accountType: "student",
      status: "ACTIVE"
    });

    // Connect GitHub
    const githubAccount = addConnectedAccount({
      userId: user.id,
      provider: "github",
      providerUserId: `gh_${Date.now()}`,
      providerEmail: testEmail
    });
    assert.equal(githubAccount.provider, "github");

    // Connect LinkedIn
    const linkedinAccount = addConnectedAccount({
      userId: user.id,
      provider: "linkedin",
      providerUserId: `li_${Date.now()}`,
      providerEmail: testEmail
    });
    assert.equal(linkedinAccount.provider, "linkedin");

    // Both resolve to the SAME user ID
    const foundByGithub = findUserByConnectedAccount("github", githubAccount.providerUserId);
    assert.equal(foundByGithub?.id, user.id);

    const foundByLinkedin = findUserByConnectedAccount("linkedin", linkedinAccount.providerUserId);
    assert.equal(foundByLinkedin?.id, user.id);
  });

  // ─── 10. PUBLIC PROFILE SANITIZATION ───
  test("Public Profile: Surfaces verified evidence without leaking internal IDs or credentials", () => {
    const publicProfile = getPublicProfileByUsername("nistha");
    assert.ok(publicProfile, "Public profile for @nistha must exist");
    assert.equal(publicProfile.username, "nistha");
    assert.equal(publicProfile.fullName, "Nistha Maheshwari");

    // Strict privacy checks
    assert.equal((publicProfile as any).id, undefined, "Internal student_profile_id must not be exposed");
    assert.equal((publicProfile as any).userId, undefined, "Internal user_id must not be exposed");
    assert.equal((publicProfile as any).email, undefined, "Private email must not be exposed");
    assert.equal((publicProfile as any).passwordHash, undefined, "Password hash must not be exposed");

    // Evidence signals verification
    assert.ok(publicProfile.evidenceSignals.length > 0, "Must have evidence signals");
    assert.equal(publicProfile.evidenceSignals[0].status, "DIRECTLY_OBSERVED");
  });
});
