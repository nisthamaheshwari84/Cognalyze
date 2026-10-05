import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false });
    }

    let pendingVerification = null;
    if (auth.user.status === "EMAIL_PENDING") {
      const { getPendingVerificationByUserId } = await import("@/lib/auth/store");
      const pending = getPendingVerificationByUserId(auth.user.id);
      if (pending) {
        pendingVerification = {
          email: pending.email,
          expiresAt: pending.expiresAt,
          attemptCount: pending.attemptCount,
          fallbackCode: pending.rawCode,
        };
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        fullName: auth.user.fullName || auth.studentProfile?.fullName || auth.recruiterProfile?.fullName,
        accountType: auth.user.accountType,
        status: auth.user.status,
        profileCompleted: auth.user.profileCompleted || !!auth.studentProfile?.profileCompleted,
        emailVerifiedAt: auth.user.emailVerifiedAt
      },
      pendingVerification,
      studentProfile: auth.studentProfile,
      recruiterProfile: auth.recruiterProfile,
      organization: auth.organization,
      connectedAccounts: auth.connectedAccounts
    });
  } catch (err: any) {
    console.error("Session check error:", err);
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}
