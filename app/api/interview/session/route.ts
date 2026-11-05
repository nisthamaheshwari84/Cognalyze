import { NextRequest, NextResponse } from "next/server";
import { saveSession, getSessionById, getActiveSessionState } from "@/lib/interview-session-store";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();

    const candidateId = auth?.user?.id || body.candidate_id || "student-demo";
    if (auth?.user?.id && body.candidate_id && body.candidate_id !== auth.user.id) {
      return NextResponse.json({ error: "Access denied. Candidate identity mismatch." }, { status: 403 });
    }

    const saved = await saveSession({
      ...body,
      candidate_id: candidateId
    });

    return NextResponse.json({ success: true, session: saved });
  } catch (err: any) {
    console.error("[POST /api/interview/session] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to save session" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id") || searchParams.get("sessionId");
    const candidateId = auth?.user?.id || searchParams.get("candidateId") || "student-demo";

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      const activeState = getActiveSessionState(sessionId);
      if (activeState) {
        return NextResponse.json({ success: true, activeState });
      }
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Candidate isolation check
    if (session.candidate_id && session.candidate_id !== candidateId && auth?.user?.id) {
      return NextResponse.json({ error: "Access denied. Session belongs to another candidate." }, { status: 403 });
    }

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

