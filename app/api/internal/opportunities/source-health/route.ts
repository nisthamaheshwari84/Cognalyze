import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

/**
 * GET /api/internal/opportunities/source-health
 * 
 * Provides real-time health, error reporting, and sync metrics
 * for every external source adapter in the Opportunity Discovery Engine.
 */
export async function GET(request: NextRequest) {
  try {
    const health = opportunityService.getSourceHealth();
    const metrics = opportunityService.getObservabilityMetrics();

    return NextResponse.json({
      success: true,
      metrics,
      sources: health,
      evaluatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[GET /api/internal/opportunities/source-health] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve source health metrics"
      },
      { status: 500 }
    );
  }
}
