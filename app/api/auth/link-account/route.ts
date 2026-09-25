import { NextRequest, NextResponse } from "next/server";
import { addConnectedAccount, getUserById, createSession, getStudentProfileByUserId } from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, provider, providerUserId, providerEmail } = body;

    if (!userId || !provider || !providerUserId || !providerEmail) {
      return NextResponse.json({ error: "Missing required account linking fields." }, { status: 400 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "Target user account not found." }, { status: 404 });
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

    const nextUrl = !studentProfile ? "/student/onboarding" : "/student/dashboard";

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
