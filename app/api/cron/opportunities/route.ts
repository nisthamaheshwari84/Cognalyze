import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { OpportunitySourceRegistry } from "@/lib/opportunities/adapters/registry";

/**
 * GET /api/cron/opportunities
 * POST /api/cron/opportunities
 * 
 * Protected scheduled refresh endpoint.
 * Requires: Authorization: Bearer ${OPPORTUNITY_CRON_SECRET}
 * Strictly executes configured, permitted sources only.
 * Runs discovery, link verification, deduplication, freshness lifecycle, and disk/DB persistence.
 */
async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.OPPORTUNITY_CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Valid Authorization Bearer token matching OPPORTUNITY_CRON_SECRET is required." },
      { status: 401 }
    );
  }

  try {
    const registry = OpportunitySourceRegistry.getInstance();
    registry.syncFromEnvironment();

    const startTime = Date.now();
    
    // Bounded execution budget: 24,000ms max
    const budgetPromise = new Promise<{ timeout: true }>((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 24000)
    );

    const syncPromise = opportunityService.syncAllSources(true);
    const outcome = await Promise.race([syncPromise, budgetPromise]);

    if ("timeout" in outcome) {
      console.warn("[CRON /api/cron/opportunities] Execution budget of 24s reached; returning partial results");
    }

    const syncSummary = "timeout" in outcome
      ? { totalOpportunities: 0, activeCount: 0, expiredCount: 0, duplicatesMerged: 0, timedOut: true }
      : outcome;
    const durationMs = Date.now() - startTime;

    const sources = registry.getRegistryEntries();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      syncSummary,
      sourceHealth: sources.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        status: s.status,
        connectorKind: s.connectorKind,
        recordsFetched: s.recordsFetched,
        recordsAccepted: s.recordsAccepted,
        recordsRejected: s.recordsRejected,
        durationMs: s.durationMs,
        lastError: s.lastError,
        lastSyncedAt: s.lastSyncedAt
      }))
    });
  } catch (error: any) {
    console.error("[CRON /api/cron/opportunities] Scheduled sync failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Scheduled sync failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}
