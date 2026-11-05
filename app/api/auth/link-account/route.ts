import { NextRequest, NextResponse } from "next/server";
import {
  addConnectedAccount,
  getUserById,
  createSession,
  getStudentProfileByUserId,
  verifyAndConsumeAccountLinkingProof
} from "@/lib/auth/store";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, provider, providerUserId, providerEmail, linkingProof } = body;

    if (!userId || !provider || !providerUserId || !providerEmail) {
      return NextResponse.json({ error: "Missing required account linking fields." }, { status: 400 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "Target user account not found." }, { status: 404 });
    }

    // ── IDENTITY OWNERSHIP VERIFICATION (P0 Fix SEC-AUTH-02) ──
    const auth = await getAuthenticatedContext(req);

    if (auth?.user) {
      // 1. Authenticated session caller: MUST match the target userId
      if (auth.user.id !== userId) {
        return NextResponse.json(
          { error: "Forbidden. Cannot link a third-party account to a different user identity." },
          { status: 403 }
        );
      }
    } else {
      // 2. Unauthenticated caller: MUST supply a valid, expiring, single-use linking proof
      if (!linkingProof) {
        return NextResponse.json(
          { error: "Unauthorized. Account linking requires an authenticated session or valid linking proof." },
          { status: 401 }
        );
      }

      const proofVerification = verifyAndConsumeAccountLinkingProof(linkingProof, {
        userId,
        provider,
        providerUserId,
        providerEmail
      });

      if (!proofVerification.valid) {
        return NextResponse.json(
          { error: `Unauthorized. ${proofVerification.error || "Invalid linking proof."}` },
          { status: 401 }
        );
      }
    }

    // Connect the account
    const connected = addConnectedAccount({
      userId,
      provider,
      providerUserId,
      providerEmail
    });

    const studentProfile = getStudentProfileByUserId(userId);
    const session = createSession(userId, user.accountType);

    const nextUrl = "/student/dashboard";

    const res = NextResponse.json({
      success: true,
      message: `Successfully connected ${provider === "github" ? "GitHub" : "LinkedIn"} to your Cognalyze profile.`,
      connectedAccount: connected,
      nextUrl
    });

    res.cookies.set("cognalyze_session", session.token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60
    });
    res.cookies.set("cognalyze_role", user.accountType, {
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60
    });

    return res;
  } catch (err: any) {
    console.error("Link account error:", err);
    return NextResponse.json({ error: err.message || "Failed to link account." }, { status: 500 });
  }
}

