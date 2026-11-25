import { NextRequest, NextResponse } from "next/server";
import { saveSession, getSessionById, getActiveSessionState } from "@/lib/interview-session-store";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { isTestRuntime } from "@/lib/env";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization",
};

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth?.user?.id && !isTestRuntime()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to save interview sessions." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json();

    if (auth?.user?.id && body.candidate_id && body.candidate_id !== auth.user.id) {
      return NextResponse.json(
        { error: "Access denied. Candidate identity mismatch." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const candidateId = auth?.user?.id || (isTestRuntime() ? (body.candidate_id || "student-demo") : "");
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const saved = await saveSession({
      ...body,
      candidate_id: candidateId
    });

    return NextResponse.json({ success: true, session: saved }, { headers: NO_STORE_HEADERS });
  } catch (err: any) {
    console.error("[POST /api/interview/session] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save session" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth?.user?.id && !isTestRuntime()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id") || searchParams.get("sessionId");
    const candidateId = auth?.user?.id || (isTestRuntime() ? (searchParams.get("candidateId") || "student-demo") : "");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      const activeState = getActiveSessionState(sessionId);
      if (activeState) {
        if (activeState.candidateId && activeState.candidateId !== candidateId && !isTestRuntime()) {
          return NextResponse.json(
            { error: "Access denied. Session belongs to another candidate." },
            { status: 403, headers: NO_STORE_HEADERS }
          );
        }
        return NextResponse.json({ success: true, activeState }, { headers: NO_STORE_HEADERS });
      }
      return NextResponse.json({ error: "Session not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    // Candidate isolation check
    if (session.candidate_id && session.candidate_id !== candidateId) {
      return NextResponse.json(
        { error: "Access denied. Session belongs to another candidate." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ success: true, session }, { headers: NO_STORE_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

