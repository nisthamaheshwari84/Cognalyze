import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

/**
 * POST /api/admin/opportunities/import
 * 
 * Emergency manual import fallback endpoint:
 * Allows administrators to directly import or verify high-priority opportunities.
 * Normalizes, validates, and incorporates into the live canonical database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.sourceUrl || (!body.organizer && !body.companyName)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, sourceUrl, and organizer/companyName are required."
        },
        { status: 400 }
      );
    }

    const canonical = opportunityService.manualImport({
      sourceUrl: body.sourceUrl,
      applicationUrl: body.applicationUrl || body.sourceUrl,
      title: body.title,
      organizer: body.organizer || body.companyName,
      companyName: body.companyName || body.organizer,
      opportunityType: body.opportunityType || "HACKATHON",
      deadline: body.deadline,
      mode: body.mode || "hybrid",
      eligibilityText: body.eligibilityText,
      prize: body.prize,
      teamSize: body.teamSize,
      skills: Array.isArray(body.skills) ? body.skills : undefined,
      description: body.description || "Admin imported opportunity",
      location: body.location,
      adminUserId: body.adminUserId || "admin"
    });

    return NextResponse.json({
      success: true,
      message: "Opportunity successfully imported and incorporated into live database",
      opportunity: canonical
    });
  } catch (error: any) {
    console.error("[POST /api/admin/opportunities/import] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to manually import opportunity"
      },
      { status: 500 }
    );
  }
}
