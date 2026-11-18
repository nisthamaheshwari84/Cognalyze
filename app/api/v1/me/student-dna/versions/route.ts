import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { COIConsentService } from "@/lib/integrations/coi/consent-service";
import { getStudentDNAFull } from "@/lib/dna/store";

/**
 * GET /api/v1/me/student-dna/versions
 * 
 * Returns the current profile version and last updated timestamp.
 * Enables COI to check for profile changes without pulling the full payload.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const isDemo = process.env.NODE_ENV !== "production" && req.nextUrl.searchParams.get("demo") === "true";
    const studentId = auth?.user?.id || (isDemo ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const hasConsent = await COIConsentService.hasScope(studentId, "student_dna:read");
    if (!hasConsent) {
      return NextResponse.json({ error: "Consent required", code: "CONSENT_REQUIRED" }, { status: 403 });
    }

    const dna = await getStudentDNAFull(studentId).catch(() => null);

    return NextResponse.json({
      success: true,
      student_id: studentId,
      profile_version: (dna as any)?.snapshotVersion || 1,
      schema_version: "1.0",
      last_updated_at: dna?.lastUpdatedAt || new Date().toISOString(),
      skills_count: dna?.skills?.length || 0,
      evidence_count: dna?.evidence?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to retrieve profile version", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
