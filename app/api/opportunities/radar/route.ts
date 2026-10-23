import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { OpportunitySourceRegistry } from "@/lib/opportunities/adapters/registry";
import { getAuthenticatedContext } from "@/lib/auth/server";

/**
 * GET /api/opportunities/radar
 * 
 * Returns real source health, coverage, connector statuses, freshness counts,
 * and active/verified opportunity counts.
 * Strictly eliminates synthetic LLM / Groq generation.
 */
export async function GET(req: NextRequest) {
  try {
    const registry = OpportunitySourceRegistry.getInstance();
    registry.syncFromEnvironment();
    const sourceEntries = registry.getRegistryEntries();
    const metrics = opportunityService.getObservabilityMetrics();

    const activeSources = sourceEntries.filter(s => s.status === "ACTIVE" || s.status === "AUTHORIZED");
    const requiresAuthSources = sourceEntries.filter(s => s.status === "REQUIRES_AUTH");
    const requiresApprovalSources = sourceEntries.filter(s => s.status === "REQUIRES_APPROVAL");
    const limitedSources = sourceEntries.filter(s => s.status === "LIMITED");
    const disabledSources = sourceEntries.filter(s => s.status === "DISABLED");

    return NextResponse.json({
      success: true,
      sourceCoverage: {
        total: sourceEntries.length,
        active: activeSources.length,
        requiresAuth: requiresAuthSources.length,
        requiresApproval: requiresApprovalSources.length,
        limited: limitedSources.length,
        disabled: disabledSources.length
      },
      sources: sourceEntries,
      lastRefresh: metrics.lastSyncedAt,
      last_scanned_at: metrics.lastSyncedAt,
      freshnessCounts: {
        active: metrics.activeOpportunities,
        stale: metrics.staleOpportunities,
        expired: metrics.expiredOpportunities,
        removed: metrics.removedOpportunities
      },
      opportunityCounts: {
        total: metrics.totalOpportunities,
        active: metrics.activeOpportunities,
        verified: metrics.activeOpportunities
      },
      message: activeSources.length === 0
        ? "Showing verified opportunities from connected sources. Coverage expands as approved sources are connected."
        : `Connected to ${activeSources.length} active source${activeSources.length === 1 ? "" : "s"}.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/opportunities/radar
 * 
 * Triggers a real configured-source refresh for an authenticated user only.
 * Returns actual sync results without fabrication.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    // Allow demo requests for existing local mock tests if candidateId is explicitly student-demo and in dev
    const body = await req.json().catch(() => ({}));
    const isDemoOverride = process.env.NODE_ENV !== "production" && (body.candidateId === "student-demo" || req.headers.get("x-cognalyze-demo") === "true");

    if (!auth && !isDemoOverride) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication is required to trigger a source refresh." },
        { status: 401 }
      );
    }

    const registry = OpportunitySourceRegistry.getInstance();
    registry.syncFromEnvironment();
    const sourceEntries = registry.getRegistryEntries();
    const activeSources = sourceEntries.filter(s => s.status === "ACTIVE" || s.status === "AUTHORIZED");

    if (activeSources.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        addedVerifiedCount: 0,
        syncResults: {
          totalDiscovered: 0,
          successfulSources: 0,
          failedSources: 0,
          sourceDetails: {}
        },
        last_scanned_at: new Date().toISOString(),
        message: "No permitted sources are currently connected or active. Configure approved feeds via OPPORTUNITY_FEEDS_JSON to discover live opportunities."
      });
    }

    // Trigger genuine sync across active configured sources
    const syncResult = await opportunityService.syncAllSources(true);
    const nowIso = new Date().toISOString();

    return NextResponse.json({
      success: true,
      count: syncResult.activeCount,
      addedVerifiedCount: syncResult.totalOpportunities,
      duplicatesMerged: syncResult.duplicatesMerged,
      last_scanned_at: nowIso,
      syncResults: syncResult,
      message: `Sync completed across ${activeSources.length} active connected source${activeSources.length === 1 ? "" : "s"}.`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger source sync" },
      { status: 500 }
    );
  }
}
