import { NextRequest, NextResponse } from "next/server";
import {
  syncInterviewSessionToCognalyze,
  verifyServiceHeaders,
} from "@/lib/interview-intelligence/handoff";
import { getSessionHistory } from "@/lib/interview-session-store";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Authorization, Cookie, X-Cognalyze-Service-Sig, X-Cognalyze-Verified-User-Id",
};

export async function GET(req: NextRequest) {
  try {
    const serviceCheck = verifyServiceHeaders(req, "");
    if (!serviceCheck.ok) {
      return NextResponse.json(
        { success: false, error: serviceCheck.code, message: serviceCheck.message },
        { status: serviceCheck.status, headers: NO_STORE_HEADERS }
      );
    }

    const verifiedUserId = (req.headers.get("x-cognalyze-verified-user-id") || "").trim();
    if (!verifiedUserId) {
      return NextResponse.json(
        { success: false, error: "MISSING_USER_ID", message: "Verified userId header required." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const sessions = await getSessionHistory(verifiedUserId);
    const interviews: any[] = [];
    const reports: any[] = [];

    for (const sess of sessions) {
      const state = (sess?.report as any)?.interviewState;
      if (state && typeof state.id === "string") {
        interviews.push({ ...state, candidateId: verifiedUserId });
      }
      if (sess?.report && (sess.report as any).overview && (sess.report as any).id) {
        const rep = { ...(sess.report as any) };
        delete rep.interviewState;
        reports.push({ ...rep, candidateId: verifiedUserId });
      }
    }

    return NextResponse.json(
      { success: true, userId: verifiedUserId, interviews, reports },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error("[GET /api/interview-intelligence/sync-result] Error:", err);
    return NextResponse.json(
      { success: false, error: "SYNC_READ_FAILED", message: err?.message || "Failed to fetch sessions." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const serviceCheck = verifyServiceHeaders(req, rawBody);
    if (!serviceCheck.ok) {
      return NextResponse.json(
        { success: false, error: serviceCheck.code, message: serviceCheck.message },
        { status: serviceCheck.status, headers: NO_STORE_HEADERS }
      );
    }

    const verifiedUserId = (req.headers.get("x-cognalyze-verified-user-id") || "").trim();
    if (!verifiedUserId) {
      return NextResponse.json(
        { success: false, error: "MISSING_USER_ID", message: "Verified userId header required." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const body = JSON.parse(rawBody || "{}");
    const result = await syncInterviewSessionToCognalyze(verifiedUserId, {
      interview: body.interview,
      report: body.report,
    });

    return NextResponse.json(
      { success: true, synced: result.synced },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error("[POST /api/interview-intelligence/sync-result] Error:", err);
    return NextResponse.json(
      { success: false, error: "SYNC_WRITE_FAILED", message: err?.message || "Failed to persist interview result." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
