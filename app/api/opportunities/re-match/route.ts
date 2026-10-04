import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

/**
 * POST /api/opportunities/re-match
 * 
 * Dynamic Re-Matching:
 * When the candidate adds or updates evidence (e.g. "Docker", "PyTorch"),
 * recalculates affected opportunities, upgrades recommendations (BUILD_EVIDENCE -> APPLY_NOW),
 * and logs a DNA change in the Career Intelligence loop.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId = "student-demo", newEvidenceSkill } = body;

    if (!newEvidenceSkill || typeof newEvidenceSkill !== "string") {
      return NextResponse.json(
        { success: false, error: "newEvidenceSkill string is required" },
        { status: 400 }
      );
    }

    const result = await opportunityService.recalculateAffectedOpportunities(
      studentId,
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
