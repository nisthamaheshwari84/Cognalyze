import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { ApplicationStage } from "@/lib/opportunities/types";

/**
 * GET /api/opportunities/track
 * Retrieves all tracked applications and saved opportunities for a student.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const applications = opportunityService.getStudentApplications(studentId);
    const savedMatches = await opportunityService.getSavedOpportunities(studentId);

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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId = "student-demo", opportunityId, action, stage, notes, outcomeReason, feedbackNotes } = body;

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    // Action: Save / Unsave
    if (action === "save") {
      const isSaved = opportunityService.saveOpportunity(studentId, opportunityId);
      return NextResponse.json({ success: true, isSaved: true, message: "Opportunity saved to watchlist" });
    }

    if (action === "unsave") {
      const isSaved = !opportunityService.unsaveOpportunity(studentId, opportunityId);
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
      studentId,
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
