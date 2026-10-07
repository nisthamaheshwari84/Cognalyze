/**
 * COGNALYZE MULTI-PROVIDER EMAIL & NOTIFICATION DISPATCH ENGINE
 * 
 * Production-ready email delivery engine supporting:
 * 1. Resend API (HTTPS direct REST, primary)
 * 2. Brevo / Sendinblue (HTTPS REST)
 * 3. SendGrid (HTTPS REST)
 * 4. Postmark (HTTPS REST)
 * 
 * Strict Security Rules:
 * - NEVER leaks raw OTP/verification codes to client or logs.
 * - Accurately reports delivery status and errors.
 */

export interface EmailDispatchResult {
  success: boolean;
  provider: "resend" | "brevo" | "sendgrid" | "postmark" | "supabase" | "fallback";
  messageId?: string;
  error?: string;
  deliveryNotice?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Universal email sender that routes through configured environment providers
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailDispatchResult> {
  const { to, subject, html, text, from = process.env.EMAIL_FROM || "Cognalyze <auth@cognalyze.ai>" } = params;

  // ─── 1. RESEND API DISPATCH (Primary modern standard) ───
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ""),
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.id) {
        return {
          success: true,
          provider: "resend",
          messageId: data.id,
          deliveryNotice: `Verification code sent to ${to}. Please check your inbox and Spam folder.`
        };
      }

      console.warn("Resend email delivery failure:", data?.message || data);
      if (res.status === 403 && data?.message) {
        return {
          success: false,
          provider: "resend",
          error: data.message
        };
      }

      return {
        success: false,
        provider: "resend",
        error: data?.message || `Resend delivery failed with status ${res.status}`
      };
    } catch (err: any) {
      console.error("Resend API network error:", err.message);
      return {
        success: false,
        provider: "resend",
        error: err.message || "Failed to connect to email provider."
      };
    }
  }

  // ─── 2. BREVO / SENDINBLUE API DISPATCH ───
  const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (brevoKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { email: from.includes("<") ? from.split("<")[1].replace(">", "").trim() : from, name: "Cognalyze" },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      const data = await res.json();
      if (res.ok && (data?.messageId || data?.id)) {
        return { success: true, provider: "brevo", messageId: data.messageId || data.id };
      }
      return { success: false, provider: "brevo", error: data?.message || "Brevo delivery failed." };
    } catch (err: any) {
      return { success: false, provider: "brevo", error: err.message };
    }
  }

  // ─── 3. SENDGRID API DISPATCH ───
  if (process.env.SENDGRID_API_KEY) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from.includes("<") ? from.split("<")[1].replace(">", "").trim() : from, name: "Cognalyze" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });

      if (res.status === 202 || res.ok) {
        return { success: true, provider: "sendgrid" };
      }
      const data = await res.text();
      return { success: false, provider: "sendgrid", error: data || "SendGrid delivery failed." };
    } catch (err: any) {
      return { success: false, provider: "sendgrid", error: err.message };
    }
  }

  // ─── 4. POSTMARK API DISPATCH ───
  if (process.env.POSTMARK_SERVER_TOKEN) {
    try {
      const res = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          From: from,
          To: to,
          Subject: subject,
          HtmlBody: html,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.MessageID) {
        return { success: true, provider: "postmark", messageId: data.MessageID };
      }
      return { success: false, provider: "postmark", error: data?.Message || "Postmark delivery failed." };
    } catch (err: any) {
      return { success: false, provider: "postmark", error: err.message };
    }
  }

  // ─── 5. UNCONFIGURED FALLBACK ───
  console.warn(`[EMAIL_DISPATCH_WARNING] No external email provider configured. Recipient: ${to}`);
  return {
    success: false,
    provider: "fallback",
    error: "Email delivery provider is not configured. Please set RESEND_API_KEY.",
    deliveryNotice: "Email provider not configured."
  };
}

/**
 * Dispatches a high-priority 6-digit OTP verification email.
 * Never leaks the OTP code into return data or frontend.
 */
export async function sendVerificationOtpEmail(
  toEmail: string,
  otpCode: string,
  fullName: string = "User"
): Promise<EmailDispatchResult> {
  const firstName = fullName.trim().split(" ")[0] || "there";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cognalyze-gules.vercel.app";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cognalyze Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F6F5F1; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E4E1DA; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);">
          <!-- Top Header -->
          <tr>
            <td style="background-color: #07111F; padding: 24px 32px; text-align: left;">
              <span style="font-size: 18px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                COGNALYZE
              </span>
              <span style="font-size: 11px; font-weight: 700; color: #4C8DFF; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                SECURITY
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #162A43; letter-spacing: -0.3px;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 24px; font-size: 14.5px; line-height: 1.55; color: #4A5568;">
                Hi ${firstName}, welcome to <strong>Cognalyze</strong>. Please use the 6-digit verification code below to confirm your registered email address and activate your account.
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 28px;">
                <tr>
                  <td align="center" style="background-color: #F0F5FF; border: 1.5px dashed #356AE6; border-radius: 10px; padding: 22px 16px;">
                    <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #162A43;">
                      ${otpCode}
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; color: #667085; font-weight: 500;">
                      Valid for 15 minutes · Do not share this code with anyone
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/verify-email" target="_blank" style="display: inline-block; background-color: #162A43; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 7px;">
                      Enter Verification Code →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #718096;">
                If you did not request this verification code, you can safely ignore this email. No changes will be made to your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF9F6; border-top: 1px solid #ECE9E1; padding: 18px 32px; text-align: center; font-size: 11.5px; color: #8A94A6;">
              © 2026 Cognalyze — Evidence-First Career & Hiring Intelligence. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Hi ${firstName},\n\nYour Cognalyze verification code is: ${otpCode}\n\nThis code will expire in 15 minutes.\n\nVerify online: ${appUrl}/verify-email\n\n© 2026 Cognalyze`;

  return sendEmail({
    to: toEmail,
    subject: `${otpCode} is your Cognalyze verification code`,
    html,
    text,
  });
}

/**
 * Dispatches a password reset email containing a secure one-time link.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string,
  fullName: string = "User"
): Promise<EmailDispatchResult> {
  const firstName = fullName.trim().split(" ")[0] || "there";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Cognalyze Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17191C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F6F5F1; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E4E1DA; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);">
          <!-- Top Header -->
          <tr>
            <td style="background-color: #07111F; padding: 24px 32px; text-align: left;">
              <span style="font-size: 18px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                COGNALYZE
              </span>
              <span style="font-size: 11px; font-weight: 700; color: #4C8DFF; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                SECURITY
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #162A43; letter-spacing: -0.3px;">
                Reset your password
              </h1>
              <p style="margin: 0 0 24px; font-size: 14.5px; line-height: 1.55; color: #4A5568;">
                Hi ${firstName}, we received a request to reset the password for your Cognalyze account. Click the button below to choose a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #356AE6; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(53, 106, 230, 0.25);">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 12.5px; line-height: 1.5; color: #718096;">
                This link will expire in 1 hour. If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 11.5px; word-break: break-all; color: #356AE6;">
                <a href="${resetUrl}" style="color: #356AE6; text-decoration: underline;">${resetUrl}</a>
              </p>

              <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #718096;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF9F6; border-top: 1px solid #ECE9E1; padding: 18px 32px; text-align: center; font-size: 11.5px; color: #8A94A6;">
              © 2026 Cognalyze — Evidence-First Career & Hiring Intelligence. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Hi ${firstName},\n\nWe received a request to reset your Cognalyze password.\n\nReset link: ${resetUrl}\n\nThis link is valid for 1 hour.\n\nIf you did not request this, please ignore this email.\n\n© 2026 Cognalyze`;

  return sendEmail({
    to: toEmail,
    subject: "Reset your Cognalyze password",
    html,
    text,
  });
}

/**
 * Dispatches an email notification for opportunities, applications, and calendar updates
 */
export async function sendNotificationEmail(
  toEmail: string,
  title: string,
  body: string,
  linkUrl: string = "/student",
  priority: string = "normal"
): Promise<EmailDispatchResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cognalyze-gules.vercel.app";
  const fullLink = linkUrl.startsWith("http") ? linkUrl : `${appUrl}${linkUrl}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #17191C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F6F5F1; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 10px; border: 1px solid #E4E1DA; overflow: hidden;">
          <tr>
            <td style="background-color: #07111F; padding: 20px 28px;">
              <span style="font-size: 16px; font-weight: 800; color: #FFFFFF;">COGNALYZE</span>
              <span style="font-size: 11px; font-weight: 600; color: ${priority === "high" ? "#F56565" : "#4C8DFF"}; margin-left: 8px;">
                ${priority.toUpperCase()} ALERT
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px;">
              <h2 style="margin: 0 0 10px; font-size: 18px; color: #162A43;">${title}</h2>
              <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.55; color: #4A5568;">${body}</p>
              <a href="${fullLink}" target="_blank" style="display: inline-block; background-color: #356AE6; color: #FFFFFF; font-weight: 600; font-size: 13px; text-decoration: none; padding: 10px 22px; border-radius: 6px;">
                View on Cognalyze →
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FAF9F6; border-top: 1px solid #ECE9E1; padding: 14px 28px; text-align: center; font-size: 11px; color: #8A94A6;">
              You received this notification from your Cognalyze account.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({
    to: toEmail,
    subject: `[Cognalyze] ${title}`,
    html,
    text: `${title}\n\n${body}\n\nView details: ${fullLink}`,
  });
}

/**
 * Checks whether an external email transport is actively configured in environment variables
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.RESEND_API_KEY ||
    process.env.BREVO_API_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    process.env.SENDGRID_API_KEY ||
    process.env.POSTMARK_SERVER_TOKEN ||
    (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
  );
}
