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
    const syncSummary = await opportunityService.syncAllSources(true);
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
