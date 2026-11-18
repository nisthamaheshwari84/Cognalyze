import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { COIConsentService } from "@/lib/integrations/coi/consent-service";
import { COIDNAExportService } from "@/lib/integrations/coi/dna-export-service";
import { invalidateUserDNAScope } from "@/lib/dna/store";

/**
 * GET /api/v1/me/student-dna
 * 
 * Returns the authorized, versioned Student DNA snapshot for the authenticated student.
 * Strictly enforces student consent grant before exposing evidence and skills.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const isDemo = process.env.NODE_ENV !== "production" && req.nextUrl.searchParams.get("demo") === "true";
    const studentId = auth?.user?.id || (isDemo ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({
        error: "Unauthorized. Authentication is required to access Student DNA.",
        code: "UNAUTHORIZED"
      }, { status: 401 });
    }

    if (auth?.user?.accountType === "recruiter") {
      return NextResponse.json({
        error: "Forbidden. Recruiter accounts cannot access student DNA APIs.",
        code: "FORBIDDEN"
      }, { status: 403 });
    }

    // 1. Consent Gate
    const hasConsent = await COIConsentService.hasScope(studentId, "student_dna:read");
    if (!hasConsent) {
      return NextResponse.json({
        error: "Student has not granted authorization to access Student DNA.",
        code: "CONSENT_REQUIRED",
        required_scope: "student_dna:read",
        consent_url: "/connections/consent"
      }, { status: 403 });
    }

    // 2. Cache Invalidation if requested
    if (req.nextUrl.searchParams.get("refresh") === "true") {
      invalidateUserDNAScope(studentId);
    }

    // 3. Export Snapshot
    const snapshot = await COIDNAExportService.exportSnapshot(studentId);

    return NextResponse.json({
      success: true,
      ...snapshot
    });
  } catch (err: any) {
    console.error("GET /api/v1/me/student-dna error:", err);
    return NextResponse.json({
      error: err.message || "Failed to retrieve Student DNA snapshot",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}
