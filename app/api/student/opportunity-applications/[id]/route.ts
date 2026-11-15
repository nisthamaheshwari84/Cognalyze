import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { studentApplicationService } from "@/lib/opportunities/student-application-service";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

/**
 * GET /api/student/opportunity-applications/[id]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = auth?.user?.id || (searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const application = await studentApplicationService.getApplicationById(userId, id);
    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    const opp = await opportunityService.getOpportunityById(application.opportunityId, userId);

    return NextResponse.json({
      success: true,
      application: {
        ...application,
        opportunity: opp?.opportunity || null,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/student/opportunity-applications/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve application" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/student/opportunity-applications/[id]
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const userId = auth?.user?.id || (body.candidateId === "student-demo" || searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updated = await studentApplicationService.updateStage(
      userId,
      id,
      body.stage,
      body.notes,
      body.followUpDate
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: updated,
    });
  } catch (error: any) {
    console.error("[PATCH /api/student/opportunity-applications/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update application" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/student/opportunity-applications/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = auth?.user?.id || (searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await studentApplicationService.deleteApplication(userId, id);

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error: any) {
    console.error("[DELETE /api/student/opportunity-applications/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete application" },
      { status: 500 }
    );
  }
}
