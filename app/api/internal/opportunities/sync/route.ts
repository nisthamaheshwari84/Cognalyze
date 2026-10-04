import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

/**
 * POST /api/internal/opportunities/sync
 * 
 * Scheduled / on-demand background sync endpoint.
 * Discovers and synchronizes opportunities across all active source adapters:
 * Unstop, Devpost, Devfolio, MLH, Hack2Skill, IIT Portals, Company Careers, Startups, ATS.
 * 
 * Query / Body parameters:
 * - forceRefresh (boolean): Forces re-discovery ignoring TTL.
 */
export async function POST(request: NextRequest) {
  try {
    let forceRefresh = false;

    // Check query params or body
    const { searchParams } = new URL(request.url);
    if (searchParams.get("forceRefresh") === "true") {
      forceRefresh = true;
    } else {
      try {
        const body = await request.json();
        if (body.forceRefresh) forceRefresh = true;
      } catch {
        // Body optional
      }
    }

    const syncResult = await opportunityService.syncAllSources(forceRefresh);

    return NextResponse.json({
      success: true,
      message: "Multi-source opportunity synchronization completed",
      syncResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[POST /api/internal/opportunities/sync] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to synchronize opportunity sources"
      },
      { status: 500 }
    );
  }
}
