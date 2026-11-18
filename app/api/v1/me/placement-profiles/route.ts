import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { COIConsentService } from "@/lib/integrations/coi/consent-service";
import { getStudentProfile } from "@/lib/placement-store";

/**
 * GET /api/v1/me/placement-profiles
 * 
 * Returns permitted student placement profiles.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const isDemo = process.env.NODE_ENV !== "production" && req.nextUrl.searchParams.get("demo") === "true";
    const studentId = auth?.user?.id || (isDemo ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const hasConsent = await COIConsentService.hasScope(studentId, "placement_profiles:read");
    if (!hasConsent) {
      return NextResponse.json({ error: "Consent required", code: "CONSENT_REQUIRED" }, { status: 403 });
    }

    const profile = await getStudentProfile(studentId);

    return NextResponse.json({
      success: true,
      student_id: studentId,
      placement_profiles: profile ? [
        {
          candidate_id: profile.candidate_id,
          target_roles: profile.target_roles,
          target_companies_or_events: profile.target_companies_or_events,
          availability: profile.availability,
          risk_appetite: profile.risk_appetite,
          experience_level: profile.experience_level,
          skills: profile.skills,
          past_projects: profile.past_projects,
        }
      ] : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to retrieve placement profiles", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
