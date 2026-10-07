import test from "node:test";
import assert from "node:assert/strict";
import { sendVerificationOtpEmail, sendNotificationEmail, sendPasswordResetEmail, isEmailConfigured } from "../lib/email/email-service";
import { createNotification, getNotifications } from "../lib/notifications";
import { createUser, createEmailVerification, getPendingVerificationByUserId } from "../lib/auth/store";
import { hashCode } from "../lib/auth/security";

test("Email Service & Notification Dispatch Engine", async (t) => {
  await t.test("isEmailConfigured returns boolean depending on environment", () => {
    const configured = isEmailConfigured();
    assert.equal(typeof configured, "boolean");
  });

  await t.test("sendVerificationOtpEmail generates valid dispatch result without leaking code", async () => {
    const result = await sendVerificationOtpEmail("test@example.com", "849201", "Test User");
    assert.equal(typeof result.success, "boolean");
    assert.equal((result as any).code, undefined);
    assert.ok(["resend", "brevo", "sendgrid", "postmark", "supabase", "fallback"].includes(result.provider));
  });

  await t.test("sendPasswordResetEmail generates valid dispatch result", async () => {
    const result = await sendPasswordResetEmail("test@example.com", "https://cognalyze-gules.vercel.app/reset-password?token=sample", "Test User");
    assert.equal(typeof result.success, "boolean");
    assert.ok(["resend", "brevo", "sendgrid", "postmark", "supabase", "fallback"].includes(result.provider));
  });

  await t.test("sendNotificationEmail dispatches alert without throwing", async () => {
    const result = await sendNotificationEmail(
      "test@example.com",
      "New Job Match: Software Engineer",
      "A new role matching your profile has been posted.",
      "/student/opportunities",
      "high"
    );
    assert.equal(typeof result.success, "boolean");
  });

  await t.test("createNotification dispatches notification and attempts registered user email delivery", async () => {
    const uniqueEmail = `notif-${Date.now()}@example.com`;
    const user = createUser({
      email: uniqueEmail,
      fullName: "Notif Student",
      passwordHash: "hash123",
      passwordSalt: "salt123",
      accountType: "student",
      status: "ACTIVE",
      profileCompleted: true
    });

    const notif = await createNotification({
      studentId: user.id,
      sourceFeature: "matching",
      notificationType: "new_opportunity",
      title: "Google Software Engineering Intern",
      body: "Applications are now open with a high match score.",
      linkUrl: "/student/opportunities",
      priority: "high"
    });

    assert.ok(notif.id.startsWith("notif-"));
    assert.equal(notif.title, "Google Software Engineering Intern");
    assert.equal(notif.is_read, false);

    const { notifications } = await getNotifications(user.id);
    const found = notifications.find((n) => n.id === notif.id);
    assert.ok(found);
  });

  await t.test("Email verification OTP store securely hashes code and does NOT store raw code", () => {
    const code = "736192";
    const hash = hashCode(code);
    const verif = createEmailVerification("user-999", "fallback@example.com", hash);
    assert.ok(verif.codeHash);
    assert.equal((verif as any).rawCode, undefined);

    const pending = getPendingVerificationByUserId("user-999");
    assert.ok(pending);
    assert.equal((pending as any).rawCode, undefined);
  });
});
