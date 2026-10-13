import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getSessionByToken } from "@/lib/auth/store";
import { invalidateUserDNAScope } from "@/lib/dna/store";
import { invalidatePlacementProfile } from "@/lib/placement-store";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("cognalyze_session")?.value;
    if (sessionToken) {
      const session = getSessionByToken(sessionToken);
      if (session?.userId) {
        invalidateUserDNAScope(session.userId);
        invalidatePlacementProfile(session.userId);
      }
      deleteSession(sessionToken);
    }

    const res = NextResponse.json({ success: true, message: "Signed out successfully." });
    res.cookies.delete("cognalyze_session");
    res.cookies.delete("cognalyze_role");
    res.cookies.delete("sb-access-token");
    res.cookies.delete("sb-refresh-token");
    return res;
  } catch (err: any) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: err.message || "Failed to sign out." }, { status: 500 });
  }
}

