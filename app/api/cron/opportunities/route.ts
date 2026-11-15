import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { OpportunitySourceRegistry } from "@/lib/opportunities/adapters/registry";
import { OpportunitySyncLeaseManager } from "@/lib/opportunities/concurrency/sync-lease";

/**
 * GET /api/cron/opportunities
 * POST /api/cron/opportunities
 * 
 * Protected scheduled refresh endpoint.
 * Requires: Authorization: Bearer ${OPPORTUNITY_CRON_SECRET}
 * Strictly executes configured, permitted sources only.
 * Runs discovery, link verification, deduplication, freshness lifecycle, and disk/DB persistence.
 * Implements 3-source bounded batching and PostgreSQL distributed lease locking.
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

  const leaseManager = OpportunitySyncLeaseManager.getInstance();
  const lease = await leaseManager.acquireLease("cron-batch-opportunity-sync", 120);

  if (!lease.acquired) {
    return NextResponse.json({
      success: true,
      skipped: true,
      message: `Batch sync skipped: Active lease held until ${lease.expiresAt}`,
    });
  }

  try {
    const registry = OpportunitySourceRegistry.getInstance();
    registry.syncFromEnvironment();

    const startTime = Date.now();
    
    // Bounded execution budget: 20,000ms max for serverless safety
    const budgetPromise = new Promise<{ timeout: true }>((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 20000)
    );

    const syncPromise = opportunityService.syncAllSources(true);
    const outcome = await Promise.race([syncPromise, budgetPromise]);

    if ("timeout" in outcome) {
      console.warn("[CRON /api/cron/opportunities] Execution budget of 20s reached; returning partial results");
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
  } finally {
    await leaseManager.releaseLease("cron-batch-opportunity-sync");
  }
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}
