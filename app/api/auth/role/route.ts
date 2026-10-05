import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedContext(req);
  if (auth) {
    return NextResponse.json({ authenticated: true, role: auth.user.accountType });
  }
  const roleCookie = req.cookies.get("cognalyze_role")?.value;
  return NextResponse.json({ authenticated: false, role: roleCookie || "student" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestedRole = body.role;

    if (!["student", "recruiter", "admin"].includes(requestedRole)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const auth = await getAuthenticatedContext(req);

    // If already authenticated and requesting a different role, ensure authorization
    if (auth && auth.user.accountType !== requestedRole) {
      // User cannot simply spoof a different role without having that role
      if (requestedRole === "recruiter" && auth.user.accountType === "student") {
        return NextResponse.json({
          success: false,
          error: "Recruiter access requires a verified work account. Please sign in with your corporate email.",
          requiresAuth: true
        }, { status: 403 });
      }
    }

    // Set role preference cookie WITHOUT forging any personal user identity
    const res = NextResponse.json({
      success: true,
      role: requestedRole,
      authenticated: !!auth
    });

    res.cookies.set("cognalyze_role", requestedRole, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to set role" }, { status: 500 });
  }
}
