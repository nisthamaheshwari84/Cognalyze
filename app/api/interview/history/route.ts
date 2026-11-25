import { NextRequest, NextResponse } from "next/server";
import { getSessionHistory } from "@/lib/interview-session-store";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { isTestRuntime } from "@/lib/env";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization",
};

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const queryCandidateId = searchParams.get("candidateId");

    if (!auth?.user?.id && !isTestRuntime()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to view interview history." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    if (auth?.user?.id && queryCandidateId && queryCandidateId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Cannot access another student's interview history." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const candidateId = auth?.user?.id || (isTestRuntime() ? (queryCandidateId || "") : "");
    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const sessions = await getSessionHistory(candidateId);

    return NextResponse.json(
      {
        success: true,
        candidateId,
        total: sessions.length,
        sessions
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error("[GET /api/interview/history] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load session history" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

