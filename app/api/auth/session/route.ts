import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        accountType: auth.user.accountType,
        status: auth.user.status,
        emailVerifiedAt: auth.user.emailVerifiedAt
      },
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
