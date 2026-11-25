import { NextRequest, NextResponse } from "next/server";
import { getUserById, getStudentProfileByUserId, syncStoreWithCloud } from "@/lib/auth/store";
import {
  buildSharedStudentDnaForInterview,
  verifyAndRedeemLaunchTicket,
  verifyServiceHeaders,
} from "@/lib/interview-intelligence/handoff";
import { getSessionHistory } from "@/lib/interview-session-store";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Authorization, Cookie, X-Cognalyze-Service-Sig",
};

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const serviceCheck = verifyServiceHeaders(req, rawBody);
    if (!serviceCheck.ok) {
      return NextResponse.json(
        { valid: false, error: serviceCheck.code, message: serviceCheck.message },
        { status: serviceCheck.status, headers: NO_STORE_HEADERS }
      );
    }

    let parsed: { ticket?: string } = {};
    try {
      parsed = JSON.parse(rawBody || "{}");
    } catch {
      return NextResponse.json(
        { valid: false, error: "INVALID_JSON", message: "Request body must be valid JSON." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (!parsed.ticket) {
      return NextResponse.json(
        { valid: false, error: "MISSING_TICKET", message: "Launch ticket is required." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const result = await verifyAndRedeemLaunchTicket(parsed.ticket);
    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.code, message: result.message },
        { status: result.status, headers: NO_STORE_HEADERS }
      );
    }

    await syncStoreWithCloud().catch(() => {});
    const userId = result.payload.sub;
    const user = getUserById(userId);

    if (user && (user.status === "SUSPENDED" || user.status === "REVOKED")) {
      return NextResponse.json(
        { valid: false, error: "ACCOUNT_RESTRICTED", message: "Account is suspended or revoked." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const profile = getStudentProfileByUserId(userId);
    const username = profile?.username || result.payload.username;
    const fullName = profile?.fullName || user?.fullName || result.payload.fullName || username;

    const [studentDna, priorSessions] = await Promise.all([
      buildSharedStudentDnaForInterview(userId),
      getSessionHistory(userId).catch(() => []),
    ]);

    const hydratedInterviews: any[] = [];
    const hydratedReports: any[] = [];
    for (const sess of priorSessions) {
      const state = (sess?.report as any)?.interviewState;
      if (state && typeof state.id === "string") {
        hydratedInterviews.push({ ...state, candidateId: userId });
      }
      if (sess?.report && (sess.report as any).overview && (sess.report as any).id) {
        const rep = { ...(sess.report as any) };
        delete rep.interviewState;
        hydratedReports.push({ ...rep, candidateId: userId });
      }
    }

    return NextResponse.json(
      {
        valid: true,
        identity: {
          userId,
          username,
          fullName,
          accountType: "student",
        },
        scope: result.payload.scope,
        studentDna,
        interviews: hydratedInterviews,
        reports: hydratedReports,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error("[POST /api/interview-intelligence/redeem] Error:", err);
    return NextResponse.json(
      { valid: false, error: "REDEEM_FAILED", message: err?.message || "Failed to verify ticket." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
