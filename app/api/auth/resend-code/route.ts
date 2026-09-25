import { NextRequest, NextResponse } from "next/server";
import { generateVerificationCode, hashCode } from "@/lib/auth/security";
import {
  getUserById,
  getSessionByToken,
  getPendingVerificationByUserId,
  createEmailVerification
} from "@/lib/auth/store";

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
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Check cooldown (60 seconds)
    const pending = getPendingVerificationByUserId(userId);
    if (pending) {
      const timeSinceLastSent = (Date.now() - new Date(pending.lastSentAt).getTime()) / 1000;
      const cooldownRemaining = Math.ceil(60 - timeSinceLastSent);
      if (cooldownRemaining > 0) {
        return NextResponse.json(
          {
            error: `Please wait ${cooldownRemaining}s before requesting a new code.`,
            retryAfterSeconds: cooldownRemaining
          },
          { status: 429 }
        );
      }
    }

    // Issue new code
    const newCode = generateVerificationCode();
    const codeHash = hashCode(newCode);
    createEmailVerification(user.id, user.email, codeHash);

    return NextResponse.json({
      success: true,
      message: "Verification code sent.",
      demoVerificationCode: process.env.NODE_ENV !== "production" ? newCode : undefined
    });
  } catch (err: any) {
    console.error("Resend code error:", err);
    return NextResponse.json({ error: err.message || "Failed to resend code." }, { status: 500 });
  }
}
