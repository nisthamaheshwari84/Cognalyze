import test from "node:test";
import assert from "node:assert/strict";
import { sendVerificationOtpEmail, sendNotificationEmail, isEmailConfigured } from "../lib/email/email-service";
import { createNotification, getNotifications } from "../lib/notifications";
import { createUser, createEmailVerification, getPendingVerificationByUserId } from "../lib/auth/store";
import { hashCode } from "../lib/auth/security";

test("Email Service & Notification Dispatch Engine", async (t) => {
  await t.test("isEmailConfigured returns boolean depending on environment", () => {
    const configured = isEmailConfigured();
    assert.equal(typeof configured, "boolean");
  });

  await t.test("sendVerificationOtpEmail generates valid dispatch or fallback", async () => {
    const result = await sendVerificationOtpEmail("test@example.com", "849201", "Test User");
    assert.ok(result.success);
    assert.ok(result.deliveryNotice.length > 0);
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
    assert.ok(result.success);
    assert.ok(result.deliveryNotice.length > 0);
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

  await t.test("Email verification OTP store saves raw code for fallback resilience", () => {
    const code = "736192";
    const hash = hashCode(code);
    const verif = createEmailVerification("user-999", "fallback@example.com", hash, code);
    assert.equal(verif.rawCode, code);

    const pending = getPendingVerificationByUserId("user-999");
    assert.ok(pending);
    assert.equal(pending.rawCode, code);
  });
});
