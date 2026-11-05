import { NextRequest, NextResponse } from "next/server";
import { getSessionHistory } from "@/lib/interview-session-store";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const candidateId = auth?.user?.id || searchParams.get("candidateId") || "";

    const sessions = candidateId
      ? await getSessionHistory(candidateId)
      : await getSessionHistory();

    return NextResponse.json({
      success: true,
      candidateId,
      total: sessions.length,
      sessions
    });
  } catch (err: any) {
    console.error("[GET /api/interview/history] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to load session history" }, { status: 500 });
  }
}

