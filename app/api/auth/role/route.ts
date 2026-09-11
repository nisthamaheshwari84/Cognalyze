import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const roleCookie = req.cookies.get("cognalyze_role");
  const role = roleCookie?.value || "student";
  return NextResponse.json({ role });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newRole = body.role;

    if (!["student", "recruiter", "admin"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const res = NextResponse.json({ success: true, role: newRole });
    res.cookies.set("cognalyze_role", newRole, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax"
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to set role" }, { status: 500 });
  }
}
