import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("cognalyze_session")?.value;
    if (sessionToken) {
      deleteSession(sessionToken);
    }

    const res = NextResponse.json({ success: true, message: "Signed out successfully." });
    res.cookies.delete("cognalyze_session");
    res.cookies.delete("cognalyze_role");
    return res;
  } catch (err: any) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: err.message || "Failed to sign out." }, { status: 500 });
  }
}
