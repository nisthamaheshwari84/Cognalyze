import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/lib/auth/security";
import {
  getPendingVerificationByUserId,
  incrementVerificationAttempt,
  markEmailVerified,
  getUserById,
  getSessionByToken
} from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId: explicitUserId } = body;

    // 1. Resolve User ID from session cookie or body
    let userId = explicitUserId;
    if (!userId) {
      const sessionToken = req.cookies.get("cognalyze_session")?.value;
      if (sessionToken) {
        const session = getSessionByToken(sessionToken);
        if (session) userId = session.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized session. Please sign in." }, { status: 401 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 2. Fetch pending verification
    const pending = getPendingVerificationByUserId(userId);
    if (!pending) {
      return NextResponse.json(
        { error: "No active verification code found or code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "That code has expired. Request a new one." },
        { status: 400 }
      );
    }

    // 3. Rate limit attempt check
    const { attemptsExceeded, attemptsLeft } = incrementVerificationAttempt(pending.id);
    if (attemptsExceeded) {
      return NextResponse.json(
        { error: "Too many failed attempts. That code is no longer valid. Request a new one." },
        { status: 429 }
      );
    }

    // 4. Validate Code
    const isValid = verifyCode(code || "", pending.codeHash);
    if (!isValid) {
      return NextResponse.json(
        {
          error: `That code isn't valid. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`,
          attemptsLeft
        },
        { status: 400 }
      );
    }

    // 5. Success: Promote status
    markEmailVerified(pending.id);

    // Compute next URL based on account type
    const nextUrl = user.accountType === "student"
      ? "/student/onboarding"
      : "/recruiter/organization/setup";

    return NextResponse.json({
      success: true,
      email: user.email,
      accountType: user.accountType,
      status: user.accountType === "student" ? "ACTIVE" : "ORGANIZATION_PENDING",
      nextUrl
    });
  } catch (err: any) {
    console.error("Verify email error:", err);
    return NextResponse.json({ error: err.message || "Failed to verify email." }, { status: 500 });
  }
}
