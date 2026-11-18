import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { COIConsentService } from "@/lib/integrations/coi/consent-service";

/**
 * GET /api/v1/me
 * 
 * Returns the authenticated student's identity and active connection status with COI.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const isDemo = process.env.NODE_ENV !== "production" && req.nextUrl.searchParams.get("demo") === "true";
    const studentId = auth?.user?.id || (isDemo ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized. Please authenticate." }, { status: 401 });
    }

    if (auth?.user?.accountType === "recruiter") {
      return NextResponse.json(
        { error: "Forbidden. Recruiter accounts are restricted from accessing Student DNA APIs." },
        { status: 403 }
      );
    }

    const consent = await COIConsentService.getActiveConsent(studentId);

    return NextResponse.json({
      success: true,
      student_id: studentId,
      email: auth?.user?.email || "student@cognalyze.local",
      account_type: auth?.user?.accountType || "student",
      status: auth?.user?.status || "ACTIVE",
      coi_connection: {
        connected: !!consent,
        granted_at: consent?.grantedAt || null,
        scopes: consent?.scopes || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
