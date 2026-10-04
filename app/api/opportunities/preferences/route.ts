import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

/**
 * GET /api/opportunities/preferences
 * Retrieves personalized preferences for a student.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const preferences = opportunityService.getPreferences(studentId);
    return NextResponse.json({ success: true, preferences });
  } catch (error: any) {
    console.error("[GET /api/opportunities/preferences] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/opportunities/preferences
 * Updates student preferences for personalized opportunity research.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId = "student-demo", preferences } = body;

    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json(
        { success: false, error: "Valid preferences object is required" },
        { status: 400 }
      );
    }

    const updated = opportunityService.updatePreferences(studentId, preferences);
    return NextResponse.json({
      success: true,
      preferences: updated,
      message: "Preferences updated successfully",
    });
  } catch (error: any) {
    console.error("[POST /api/opportunities/preferences] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update preferences" },
      { status: 500 }
    );
  }
}
