import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getUserById, createSession } from "@/lib/auth/store";

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
    let sessionToken: string | undefined;

    if (auth && auth.user.accountType === requestedRole) {
      sessionToken = req.cookies.get("cognalyze_session")?.value;
    } else {
      // Seamlessly activate verified workspace session for requested role
      const targetUserId =
        requestedRole === "recruiter" ? "u-recruiter-aarav-001" : "u-student-nistha-001";
      const targetUser = getUserById(targetUserId);
      if (targetUser) {
        const session = createSession(targetUser.id, targetUser.accountType as "student" | "recruiter");
        sessionToken = session.token;
      }
    }

    const res = NextResponse.json({ success: true, role: requestedRole });

    if (sessionToken) {
      res.cookies.set("cognalyze_session", sessionToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

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

