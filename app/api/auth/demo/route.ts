import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/store";

const DEMO_STUDENT_USER_ID = "u-student-sample-001";
const DEMO_RECRUITER_USER_ID = "u-recruiter-demo-001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role } = body;

    if (role !== "student" && role !== "recruiter") {
      return NextResponse.json({ error: "Invalid demo role." }, { status: 400 });
    }

    const userId = role === "student" ? DEMO_STUDENT_USER_ID : DEMO_RECRUITER_USER_ID;
    const session = createSession(userId, role);

    const nextUrl = role === "student" ? "/student/dashboard" : "/recruiter/dashboard";

    const res = NextResponse.json({
      success: true,
      demo: true,
      role,
      nextUrl
    });

    res.cookies.set("cognalyze_session", session.token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 24 hours for demo preview
    });

    res.cookies.set("cognalyze_role", role, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24
    });

    return res;
  } catch (err: any) {
    console.error("Demo login error:", err);
    return NextResponse.json({ error: "Failed to initialize demo session." }, { status: 500 });
  }
}
