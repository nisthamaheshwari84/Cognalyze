import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { ApplicationStage } from "@/lib/opportunities/types";
import { getAuthenticatedContext } from "@/lib/auth/server";

/**
 * GET /api/opportunities/track
 * Retrieves all tracked applications and saved opportunities for the authenticated student.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { searchParams } = new URL(request.url);
    const isDemo = process.env.NODE_ENV !== "production" && (searchParams.get("studentId") === "student-demo" || request.headers.get("x-cognalyze-demo") === "true");

    if (!auth && !isDemo) {
      return NextResponse.json({
        success: true,
        applications: [],
        saved: [],
      });
    }

    const effectiveStudentId = auth ? auth.user.id : "student-demo";
    const applications = opportunityService.getStudentApplications(effectiveStudentId);
    const savedMatches = await opportunityService.getSavedOpportunities(effectiveStudentId);

    return NextResponse.json({
      success: true,
      applications,
      saved: savedMatches,
    });
  } catch (error: any) {
    console.error("[GET /api/opportunities/track] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch application tracking data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/opportunities/track
 * Updates or creates an application tracking entry or toggles save status.
 * Strictly uses authenticated server-side user identity.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const body = await request.json().catch(() => ({}));
    const isDemo = process.env.NODE_ENV !== "production" && (body.studentId === "student-demo" || request.headers.get("x-cognalyze-demo") === "true");

    if (!auth && !isDemo) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Tracking opportunities requires authentication." },
        { status: 401 }
      );
    }

    const effectiveStudentId = auth ? auth.user.id : "student-demo";
    const { opportunityId, action, stage, notes, outcomeReason, feedbackNotes } = body;

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    // Action: Save / Unsave
    if (action === "save") {
      const isSaved = opportunityService.saveOpportunity(effectiveStudentId, opportunityId);
      return NextResponse.json({ success: true, isSaved: true, message: "Opportunity saved to watchlist" });
    }

    if (action === "unsave") {
      const isSaved = !opportunityService.unsaveOpportunity(effectiveStudentId, opportunityId);
      return NextResponse.json({ success: true, isSaved: false, message: "Opportunity removed from saved" });
    }

    // Action: Stage update (Applied, Interview, Offer, Rejected, etc.)
    const validStages: ApplicationStage[] = [
      "Saved",
      "Considering",
      "Applied",
      "Assessment",
      "Interview",
      "Offer",
      "Accepted",
      "Rejected",
      "Withdrawn",
    ];

    const targetStage: ApplicationStage = validStages.includes(stage) ? stage : "Applied";

    const updatedRecord = opportunityService.trackApplicationStage({
      studentId: effectiveStudentId,
      opportunityId,
      stage: targetStage,
      notes,
      outcomeReason,
      feedbackNotes,
    });

    return NextResponse.json({
      success: true,
      record: updatedRecord,
      message: `Application stage updated to ${targetStage}`,
    });
  } catch (error: any) {
    console.error("[POST /api/opportunities/track] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update tracking stage" },
      { status: 500 }
    );
  }
}
