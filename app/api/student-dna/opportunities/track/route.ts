import { NextRequest, NextResponse } from "next/server";
import { authorizeStudentDnaAccess, DNA_NO_STORE_HEADERS } from "@/lib/dna/security-audit";
import {
  toggleStudentSavedOpportunity,
  upsertStudentTrackedApplication,
  ApplicationTrackerStage
} from "@/lib/dna/opportunity-intelligence";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: body.userId || body.candidateId,
      resourceName: "/api/student-dna/opportunities/track",
    });
    if (!authCheck.ok) return authCheck.response;

    const candidateId = authCheck.studentId;
    const { action, opportunityId, stage, notes, interviewDate } = body;

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: "opportunityId is required." },
        { status: 400 }
      );
    }

    const normalizedAction = (action || "").toLowerCase().trim();

    // Action 1: Toggle Bookmark / Save / Unsave
    if (normalizedAction === "save" || normalizedAction === "unsave" || normalizedAction === "toggle_save") {
      const isSaved = toggleStudentSavedOpportunity(candidateId, opportunityId);
      if (isSaved) {
        // Also ensure tracker entry exists as SAVED if not already in later stage
        upsertStudentTrackedApplication(candidateId, opportunityId, "SAVED", notes);
      }
      
      const { saveStoreToCloud } = await import("@/lib/auth/store");
      await saveStoreToCloud();

      return NextResponse.json({
        success: true,
        action: "save",
        opportunityId,
        isSaved,
        message: isSaved ? "Opportunity saved to your private collection." : "Opportunity removed from saved list."
      });
    }

    // Action 2: Update Application Tracker Lifecycle Stage
    if (normalizedAction === "track" || normalizedAction === "update_stage") {
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

      const targetStage: ApplicationTrackerStage = (stage || "APPLIED").toUpperCase();
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

      const { saveStoreToCloud } = await import("@/lib/auth/store");
      await saveStoreToCloud();

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
