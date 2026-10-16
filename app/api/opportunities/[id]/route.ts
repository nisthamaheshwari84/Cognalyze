import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const studentId = auth?.user?.id || (searchParams.get("studentId") === "student-demo" ? "student-demo" : null);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    const match = await opportunityService.getOpportunityById(id, studentId || "guest");

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Opportunity not found or expired" },
        { status: 404 }
      );
    }

    const isSaved = studentId ? opportunityService.isOpportunitySaved(studentId, id) : false;

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
