import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  getInterviewIntelligenceOrigin,
  issueLaunchTicket,
} from "@/lib/interview-intelligence/handoff";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization",
};

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
          message: "Please sign in to Cognalyze to launch the Personalized Interview Arena.",
          loginUrl: "/login?redirect=/student/practice-interview",
        },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    if (auth.user.accountType !== "student") {
      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN",
          message: "Personalized Interview Arena requires a student account.",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json().catch(() => ({}));
    const username =
      auth.studentProfile?.username ||
      (auth.user.email ? auth.user.email.split("@")[0].toLowerCase() : auth.user.id.slice(0, 12));
    const fullName = auth.studentProfile?.fullName || auth.user.fullName || username;

    const { ticket, payload } = await issueLaunchTicket({
      userId: auth.user.id,
      username,
      fullName,
    });

    const launchOrigin = getInterviewIntelligenceOrigin();

    return NextResponse.json(
      {
        success: true,
        ticket,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        launchOrigin,
        postLaunchUrl: `${launchOrigin}/api/sso/launch`,
        identity: {
          userId: auth.user.id,
          username,
          fullName,
        },
        contextHints: {
          targetRole: typeof body.targetRole === "string" ? body.targetRole.slice(0, 140) : undefined,
          companyContext: typeof body.companyContext === "string" ? body.companyContext.slice(0, 140) : undefined,
          opportunityId: typeof body.opportunityId === "string" ? body.opportunityId.slice(0, 80) : undefined,
          roundType: typeof body.roundType === "string" ? body.roundType.slice(0, 60) : undefined,
          focusAreas: Array.isArray(body.focusAreas)
            ? body.focusAreas.filter((f: unknown) => typeof f === "string").slice(0, 10)
            : undefined,
        },
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error("[POST /api/interview-intelligence/launch] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "LAUNCH_FAILED",
        message: err?.message || "Failed to generate secure interview launch ticket.",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
