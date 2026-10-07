import { NextRequest, NextResponse } from "next/server";
import { generateVerificationCode, hashCode } from "@/lib/auth/security";
import {
  getUserById,
  getSessionByToken,
  getPendingVerificationByUserId,
  createEmailVerification
} from "@/lib/auth/store";
import { sendVerificationOtpEmail, EmailDispatchResult } from "@/lib/email/email-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let userId = body.userId;

    if (!userId) {
      const sessionToken = req.cookies.get("cognalyze_session")?.value;
      if (sessionToken) {
        const session = getSessionByToken(sessionToken);
        if (session) userId = session.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized session. Please sign in or register." }, { status: 401 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Check cooldown (30 seconds per specification)
    const pending = getPendingVerificationByUserId(userId);
    if (pending) {
      const timeSinceLastSent = (Date.now() - new Date(pending.lastSentAt).getTime()) / 1000;
      const cooldownRemaining = Math.ceil(30 - timeSinceLastSent);
      if (cooldownRemaining > 0) {
        return NextResponse.json(
          {
            error: `Resend available in ${cooldownRemaining} seconds.`,
            retryAfterSeconds: cooldownRemaining
          },
          { status: 429 }
        );
      }
    }

    // Invalidate previous OTP & issue new code
    const newCode = generateVerificationCode();
    const codeHash = hashCode(newCode);
    createEmailVerification(user.id, user.email, codeHash);

    // Dispatch email
    let emailResult: EmailDispatchResult = { provider: "fallback", success: false };
    try {
      emailResult = await sendVerificationOtpEmail(user.email, newCode, user.fullName);
    } catch (err: any) {
      console.error("Failed to dispatch verification email on resend:", err);
      return NextResponse.json(
        { error: "Failed to communicate with email provider. Please try again." },
        { status: 502 }
      );
    }

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: emailResult.error || "We couldn't send the verification email. Please try again.",
          deliveryNotice: emailResult.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A new verification code has been dispatched to ${user.email}.`,
      deliveryNotice: `Verification code sent to ${user.email}.`
    });
  } catch (err: any) {
    console.error("Resend code error:", err);
    return NextResponse.json({ error: err.message || "Failed to resend code." }, { status: 500 });
  }
}
