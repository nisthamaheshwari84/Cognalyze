import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { sanitizeConnectedAccountForClient } from "@/lib/dna/security-audit";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization",
};

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false }, { headers: NO_STORE_HEADERS });
    }

    let pendingVerification = null;
    if (auth.user.status === "EMAIL_PENDING") {
      const { getPendingVerificationByUserId } = await import("@/lib/auth/store");
      const pending = getPendingVerificationByUserId(auth.user.id);
      if (pending) {
        pendingVerification = {
          email: pending.email,
          expiresAt: pending.expiresAt,
          attemptCount: pending.attemptCount
        };
      }
    }

    return NextResponse.json(
      {
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
        connectedAccounts: auth.connectedAccounts.map(sanitizeConnectedAccountForClient)
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error("Session check error:", err);
    return NextResponse.json(
      { authenticated: false, error: err.message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
