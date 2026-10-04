import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

/**
 * GET /api/opportunities/[id]
 * 
 * Fetches deep-dive analysis for a single opportunity:
 * - Canonical opportunity & source instances
 * - Role DNA breakdown (Must-have, preferred, experience, education, disqualifiers)
 * - Eligibility result with blockers and satisfied requirements
 * - Candidate match details & internal heuristic score
 * - Evidence mapping (PROVEN, SUPPORTED, CLAIMED, WEAK, MISSING) with provenance
 * - "Why this opportunity?" transparent explanation
 * - Action plan for BUILD_EVIDENCE gaps
 * - Official direct application links
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    const match = await opportunityService.getOpportunityById(id, studentId);

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Opportunity not found or expired" },
        { status: 404 }
      );
    }

    const isSaved = opportunityService.isOpportunitySaved(studentId, id);

    return NextResponse.json({
      success: true,
      match,
      isSaved,
    });
  } catch (error: any) {
    console.error("[GET /api/opportunities/[id]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve opportunity details",
      },
      { status: 500 }
    );
  }
}
