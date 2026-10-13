import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { getAuthenticatedContext } from "@/lib/auth/server";

/**
 * POST /api/admin/opportunities/import
 * 
 * Secure manual import endpoint for administrators:
 * Requires verified administrator identity or authorized admin key header.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const adminKeyHeader = request.headers.get("x-admin-key");
    const configuredAdminKey = process.env.ADMIN_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isAuthorizedByHeader = Boolean(configuredAdminKey && adminKeyHeader && adminKeyHeader === configuredAdminKey);
    const isAuthorizedBySession = Boolean(
      auth && (
        (auth.user as any).role === "admin" ||
        auth.user.email.endsWith("@cognalyze.com") ||
        auth.user.email === "nisthamaheshwari85@gmail.com"
      )
    );

    if (!isAuthorizedByHeader && !isAuthorizedBySession) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Administrative authorization required." },
        { status: 403 }
      );
    }
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
