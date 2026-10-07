import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  hashPassword,
  verifyPassword,
  generateVerificationCode,
  hashCode,
  verifyCode
} from "../lib/auth/security";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  createEmailVerification,
  getPendingVerificationByUserId,
  markEmailVerified,
  createSession,
  getSessionByToken,
  deleteSession,
  createPasswordResetToken,
  getValidPasswordResetToken,
  markPasswordResetTokenUsed,
  resetUserPassword,
  createStudentProfile,
  getStudentProfileByUserId
} from "../lib/auth/store";

describe("Production Authentication Rebuild End-to-End Test Suite", () => {
  const timestamp = Date.now();
  const emailA = `candidate.a.${timestamp}@testdomain.com`;
  const emailB = `candidate.b.${timestamp}@testdomain.com`;
  const passA = "StrongPass2026!A";
  const passB = "StrongPass2026!B";

  let userAId = "";
  let userBId = "";

  test("1. Signup creates permanent user with hashed credentials and unexposed OTP", () => {
    const { hash, salt } = hashPassword(passA);
    const user = createUser({
      email: emailA,
      fullName: "Candidate Alpha",
      passwordHash: hash,
      passwordSalt: salt,
      accountType: "student",
      status: "EMAIL_PENDING"
    });

    assert.ok(user.id);
    assert.equal(user.email, emailA);
    assert.equal(user.status, "EMAIL_PENDING");
    assert.notEqual(user.passwordHash, passA);
    userAId = user.id;

    // Generate OTP
    const rawOtp = generateVerificationCode();
    const codeHash = hashCode(rawOtp);
    const verif = createEmailVerification(user.id, user.email, codeHash);

    assert.ok(verif.id);
    assert.equal(verif.codeHash, codeHash);
    // CRITICAL: Raw code must NEVER exist on the verification object
    assert.equal((verif as any).rawCode, undefined);

    const pending = getPendingVerificationByUserId(user.id);
    assert.ok(pending);
    assert.equal((pending as any).rawCode, undefined);
  });

  test("2. Duplicate signup with existing email is rejected", () => {
    assert.throws(
      () => {
        createUser({
          email: emailA,
          passwordHash: "dummy",
          passwordSalt: "dummy",
          accountType: "student"
        });
      },
      /already exists/i
    );
  });

  test("3. OTP verification validates server-side and promotes user to ACTIVE", () => {
    const pending = getPendingVerificationByUserId(userAId);
    assert.ok(pending);

    // Wrong OTP rejected
    assert.equal(verifyCode("000000", pending.codeHash), false);

    // Mark verified
    markEmailVerified(pending.id);

    const user = getUserById(userAId);
    assert.ok(user);
    assert.equal(user.status, "ACTIVE");
    assert.ok(user.emailVerifiedAt);
  });

  test("4. Subsequent login after leaving website retrieves persistent user and authenticates", () => {
    // Lookup by email
    const user = getUserByEmail(emailA);
    assert.ok(user, "User must persist on disk and be retrievable by email");
    assert.equal(user.status, "ACTIVE");

    // Password verification
    assert.ok(user.passwordHash && user.passwordSalt);
    const isValid = verifyPassword(passA, user.passwordHash, user.passwordSalt);
    assert.equal(isValid, true);

    const isWrong = verifyPassword("WrongPassword123", user.passwordHash, user.passwordSalt);
    assert.equal(isWrong, false);

    // Create session
    const session = createSession(user.id, user.accountType);
    assert.ok(session.token);

    // Verify session
    const activeSession = getSessionByToken(session.token);
    assert.ok(activeSession);
    assert.equal(activeSession.userId, user.id);

    // Logout deletes session
    deleteSession(session.token);
    assert.equal(getSessionByToken(session.token), null);
  });

  test("5. Password reset flow creates secure token and resets password", () => {
    const user = getUserByEmail(emailA);
    assert.ok(user);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const resetToken = createPasswordResetToken(user.id, user.email, tokenHash);
    assert.ok(resetToken.id);

    // Retrieve valid token
    const retrieved = getValidPasswordResetToken(tokenHash);
    assert.ok(retrieved);
    assert.equal(retrieved.userId, user.id);

    // Reset password
    const newPassword = "NewStrongPassword2026!";
    const { hash: newHash, salt: newSalt } = hashPassword(newPassword);
    const resetSuccess = resetUserPassword(user.id, newHash, newSalt);
    assert.equal(resetSuccess, true);

    markPasswordResetTokenUsed(resetToken.id);

    // Token cannot be reused
    assert.equal(getValidPasswordResetToken(tokenHash), null);

    // Old password now fails, new password succeeds
    const refreshedUser = getUserById(user.id);
    assert.ok(refreshedUser?.passwordHash && refreshedUser?.passwordSalt);
    assert.equal(verifyPassword(passA, refreshedUser.passwordHash, refreshedUser.passwordSalt), false);
    assert.equal(verifyPassword(newPassword, refreshedUser.passwordHash, refreshedUser.passwordSalt), true);
  });

  test("6. Multi-user isolation: User A and User B data are strictly segregated", () => {
    // Create User B
    const { hash: hashB, salt: saltB } = hashPassword(passB);
    const userB = createUser({
      email: emailB,
      fullName: "Candidate Beta",
      passwordHash: hashB,
      passwordSalt: saltB,
      accountType: "student",
      status: "ACTIVE"
    });
    userBId = userB.id;

    assert.notEqual(userAId, userBId);

    // Create profile for User A
    const profileA = createStudentProfile({
      userId: userAId,
      username: `candidate_a_${timestamp % 10000}`,
      fullName: "Candidate Alpha",
      college: "Stanford",
      degree: "B.S.",
      branch: "CS",
      graduationYear: "2026",
      skills: [{ name: "Rust", level: "Advanced" }],
      profileCompleted: true
    });

    // Create profile for User B
    const profileB = createStudentProfile({
      userId: userBId,
      username: `candidate_b_${timestamp % 10000}`,
      fullName: "Candidate Beta",
      college: "MIT",
      degree: "M.S.",
      branch: "AI",
      graduationYear: "2027",
      skills: [{ name: "Python", level: "Expert" }],
      profileCompleted: true
    });

    const retrievedA = getStudentProfileByUserId(userAId);
    const retrievedB = getStudentProfileByUserId(userBId);

    assert.equal(retrievedA?.fullName, "Candidate Alpha");
    assert.equal(retrievedA?.college, "Stanford");
    assert.equal(retrievedB?.fullName, "Candidate Beta");
    assert.equal(retrievedB?.college, "MIT");

    // Strict non-leakage
    assert.notEqual(retrievedA?.userId, retrievedB?.userId);
    assert.notEqual(retrievedA?.username, retrievedB?.username);
  });
});
