import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { studentApplicationService } from "@/lib/opportunities/student-application-service";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

/**
 * GET /api/opportunities/saved
 * 
 * Returns all saved/bookmarked opportunities for the current student.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { searchParams } = new URL(request.url);
    const userId = auth?.user?.id || (searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!userId) {
      return NextResponse.json({
        success: true,
        savedOpportunities: [],
        savedIds: [],
        count: 0,
      });
    }

    const savedIds = await studentApplicationService.getSavedOpportunityIds(userId);
    const allOpps = await opportunityService.ensureIngested();
    const savedOpps = allOpps.filter((opp) => savedIds.includes(opp.id));

    return NextResponse.json({
      success: true,
      savedIds,
      savedOpportunities: savedOpps,
      count: savedOpps.length,
    });
  } catch (error: any) {
    console.error("[GET /api/opportunities/saved] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve saved opportunities" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/opportunities/saved
 * 
 * Saves an opportunity bookmark for the current student.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);

    const userId = auth?.user?.id || (body.candidateId === "student-demo" || searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication is required to bookmark opportunities." },
        { status: 401 }
      );
    }

    const opportunityId = body.opportunityId || body.id;
    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: "opportunityId is required" },
        { status: 400 }
      );
    }

    await studentApplicationService.saveOpportunity(userId, opportunityId);
    opportunityService.saveOpportunity(userId, opportunityId);

    // Also auto-track in student_opportunity_applications if opp details exist
    const opp = await opportunityService.getOpportunityById(opportunityId, userId);
    if (opp?.opportunity) {
      await studentApplicationService.upsertApplication(userId, {
        opportunityId,
        stage: "Saved",
        organizationName: opp.opportunity.companyName || opp.opportunity.organizer || "Organization",
        positionTitle: opp.opportunity.title,
        applyUrl: opp.opportunity.applicationUrl || opp.opportunity.sourceUrl,
        deadline: opp.opportunity.deadline,
      });
    }

    return NextResponse.json({
      success: true,
      isSaved: true,
      opportunityId,
      message: "Opportunity saved to bookmarks",
    });
  } catch (error: any) {
    console.error("[POST /api/opportunities/saved] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save opportunity" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/opportunities/saved
 * 
 * Removes an opportunity from bookmarks.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);

    const userId = auth?.user?.id || (body.candidateId === "student-demo" || searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication is required." },
        { status: 401 }
      );
    }

    const opportunityId = body.opportunityId || searchParams.get("opportunityId") || searchParams.get("id");
    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: "opportunityId is required" },
        { status: 400 }
      );
    }

    await studentApplicationService.unsaveOpportunity(userId, opportunityId);
    opportunityService.unsaveOpportunity(userId, opportunityId);

    return NextResponse.json({
      success: true,
      isSaved: false,
      opportunityId,
      message: "Opportunity removed from bookmarks",
    });
  } catch (error: any) {
    console.error("[DELETE /api/opportunities/saved] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove saved opportunity" },
      { status: 500 }
    );
  }
}
