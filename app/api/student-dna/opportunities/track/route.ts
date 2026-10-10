import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  toggleStudentSavedOpportunity,
  upsertStudentTrackedApplication,
  ApplicationTrackerStage
} from "@/lib/dna/opportunity-intelligence";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts cannot track student opportunities." },
        { status: 403 }
      );
    }

    const candidateId = auth.user.id;
    const body = await req.json();
    const { action, opportunityId, stage, notes, interviewDate } = body;

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: "opportunityId is required." },
        { status: 400 }
      );
    }

    // Action 1: Toggle Bookmark / Save
    if (action === "save" || action === "toggle_save") {
      const isSaved = toggleStudentSavedOpportunity(candidateId, opportunityId);
      if (isSaved) {
        // Also ensure tracker entry exists as SAVED if not already in later stage
        upsertStudentTrackedApplication(candidateId, opportunityId, "SAVED", notes);
      }
      return NextResponse.json({
        success: true,
        action: "save",
        opportunityId,
        isSaved,
        message: isSaved ? "Opportunity saved to your private collection." : "Opportunity removed from saved list."
      });
    }

    // Action 2: Update Application Tracker Lifecycle Stage
    if (action === "track" || action === "update_stage") {
      const validStages: ApplicationTrackerStage[] = [
        "SAVED",
        "PLANNED",
        "APPLIED",
        "ASSESSMENT",
        "INTERVIEW",
        "OFFER",
        "REJECTED",
        "WITHDRAWN",
        "CLOSED"
      ];

      const targetStage: ApplicationTrackerStage = stage || "APPLIED";
      if (!validStages.includes(targetStage)) {
        return NextResponse.json(
          { success: false, error: `Invalid stage. Must be one of: ${validStages.join(", ")}` },
          { status: 400 }
        );
      }

      const updated = upsertStudentTrackedApplication(
        candidateId,
        opportunityId,
        targetStage,
        notes,
        interviewDate
      );

      return NextResponse.json({
        success: true,
        action: "track",
        application: updated,
        message: `Application status updated to ${targetStage}.`
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/student-dna/opportunities/track error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update opportunity state." },
      { status: 500 }
    );
  }
}
