import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { COIConsentService } from "@/lib/integrations/coi/consent-service";

/**
 * /api/v1/connections/consent
 * 
 * Manages explicit student consent for COI access to Student DNA.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const isDemo = process.env.NODE_ENV !== "production" && req.nextUrl.searchParams.get("demo") === "true";
    const studentId = auth?.user?.id || (isDemo ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const consent = await COIConsentService.getActiveConsent(studentId);

    return NextResponse.json({
      success: true,
      connected: !!consent,
      consent: consent || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch consent" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json().catch(() => ({}));
    const isDemo = process.env.NODE_ENV !== "production" && (req.nextUrl.searchParams.get("demo") === "true" || body.demo === true);
    const studentId = auth?.user?.id || (isDemo ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scopes = Array.isArray(body.scopes) && body.scopes.length > 0
      ? body.scopes
      : ["student_dna:read", "placement_profiles:read"];

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const grant = await COIConsentService.grantConsent(studentId, scopes, "coi", { ipAddress, userAgent });

    return NextResponse.json({
      success: true,
      message: "Consent successfully granted for Cognalyze Opportunity Intelligence.",
      consent: grant,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to grant consent" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const isDemo = process.env.NODE_ENV !== "production" && req.nextUrl.searchParams.get("demo") === "true";
    const studentId = auth?.user?.id || (isDemo ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const revoked = await COIConsentService.revokeConsent(studentId);

    return NextResponse.json({
      success: true,
      revoked,
      message: "Consent successfully revoked. COI access to Student DNA terminated.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to revoke consent" }, { status: 500 });
  }
}
