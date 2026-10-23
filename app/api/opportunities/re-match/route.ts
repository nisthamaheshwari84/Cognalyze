import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { getAuthenticatedContext } from "@/lib/auth/server";

/**
 * POST /api/opportunities/re-match
 * 
 * Dynamic Re-Matching:
 * When the candidate adds or updates evidence (e.g. "Docker", "PyTorch"),
 * recalculates affected opportunities, upgrades recommendations (BUILD_EVIDENCE -> APPLY_NOW),
 * and logs a DNA change in the Career Intelligence loop.
 * 
 * Strict User Isolation:
 * Re-matching strictly uses the authenticated server session identity.
 * Rejects attempts to spoof or mutate another student's profile via body or query params.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const body = await request.json().catch(() => ({}));
    const { newEvidenceSkill } = body;

    // Check for explicit demo mode in non-production environments
    const isDemo = process.env.NODE_ENV !== "production" && (body.studentId === "student-demo" || request.headers.get("x-cognalyze-demo") === "true");

    if (!auth && !isDemo) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to trigger re-matching." },
        { status: 401 }
      );
    }

    // Strictly enforce session identity — never trust body.studentId if authenticated
    const effectiveStudentId = auth ? auth.user.id : "student-demo";

    if (!newEvidenceSkill || typeof newEvidenceSkill !== "string") {
      return NextResponse.json(
        { success: false, error: "newEvidenceSkill string is required" },
        { status: 400 }
      );
    }

    const result = await opportunityService.recalculateAffectedOpportunities(
      effectiveStudentId,
      newEvidenceSkill
    );

    return NextResponse.json({
      success: true,
      affectedCount: result.affectedCount,
      promotedToApplyNow: result.promotedToApplyNow,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[POST /api/opportunities/re-match] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger re-matching" },
      { status: 500 }
    );
  }
}
