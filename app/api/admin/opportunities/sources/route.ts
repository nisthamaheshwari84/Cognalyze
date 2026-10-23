import { NextRequest, NextResponse } from "next/server";
import { OpportunitySourceRegistry } from "@/lib/opportunities/adapters/registry";
import { getAuthenticatedContext } from "@/lib/auth/server";

/**
 * GET /api/admin/opportunities/sources
 * 
 * Returns the comprehensive Source Directory for administrative inspection,
 * observability, connector health monitoring, and feed configuration guidance.
 * Protects secrets: Never exposes API tokens, auth headers, or private query params.
 */
export async function GET(req: NextRequest) {
  try {
    const registry = OpportunitySourceRegistry.getInstance();
    registry.syncFromEnvironment();
    const entries = registry.getRegistryEntries();

    // Map configuration guidance for known connectors
    const enrichedEntries = entries.map((entry) => {
      let configurationGuidance = "";
      if (entry.status === "REQUIRES_APPROVAL") {
        configurationGuidance = `Requires approved official feed or partner API contract. Connect by adding a feed entry to OPPORTUNITY_FEEDS_JSON.`;
      } else if (entry.status === "REQUIRES_AUTH") {
        configurationGuidance = `Requires API credentials in environment variables (e.g. ${entry.type === "JOB_API" ? "ADZUNA_APP_ID / ADZUNA_APP_KEY" : "API token"}).`;
      } else if (entry.status === "LIMITED") {
        configurationGuidance = `Temporarily limited by rate limit (HTTP 429). Exponential backoff active.`;
      } else if (entry.status === "ERROR") {
        configurationGuidance = `Check endpoint reachability, TLS certificates, and network permissions.`;
      } else if (entry.status === "DISABLED") {
        configurationGuidance = `Connector is intentionally disabled. Toggle enabled state to activate.`;
      } else {
        configurationGuidance = `Connector is active and healthy. Syncs every ${Math.round(entry.refreshIntervalMs / 60000)} minutes.`;
      }

      return {
        id: entry.id,
        name: entry.name,
        type: entry.type,
        status: entry.status,
        description: entry.description,
        connectorKind: entry.connectorKind || "REST",
        enabled: entry.status === "ACTIVE" || entry.status === "AUTHORIZED",
        endpointHost: entry.endpointHost || (entry.type === "UNSTOP" ? "unstop.com" : entry.type === "DEVFOLIO" ? "devfolio.co" : entry.type === "DEVPOST" ? "devpost.com" : "Configured host"),
        requiresAuth: entry.requiresAuth ?? (entry.status === "REQUIRES_AUTH"),
        permittedAccess: entry.permittedAccess ?? (entry.status !== "REQUIRES_APPROVAL"),
        refreshIntervalMinutes: Math.round(entry.refreshIntervalMs / 60000),
        supportedCategories: entry.categories || [entry.type.toLowerCase()],
        supportedRegions: entry.regions || ["Global", "India"],
        lastSyncedAt: entry.lastSyncedAt,
        lastSuccessfulRunAt: entry.lastSuccessfulRunAt,
        lastFailureAt: entry.lastFailureAt,
        lastError: entry.lastError,
        recordsFetched: entry.recordsFetched,
        recordsAccepted: entry.recordsAccepted || entry.recordsInserted,
        recordsRejected: entry.recordsRejected || 0,
        recordsDeduplicated: entry.recordsDeduplicated,
        successRate: entry.successRate,
        durationMs: entry.durationMs,
        configurationGuidance
      };
    });

    const activeCount = enrichedEntries.filter(e => e.status === "ACTIVE" || e.status === "AUTHORIZED").length;
    const requiresApprovalCount = enrichedEntries.filter(e => e.status === "REQUIRES_APPROVAL").length;
    const requiresAuthCount = enrichedEntries.filter(e => e.status === "REQUIRES_AUTH").length;
    const disabledCount = enrichedEntries.filter(e => e.status === "DISABLED").length;

    return NextResponse.json({
      success: true,
      summary: {
        totalConnectors: enrichedEntries.length,
        activeConnectors: activeCount,
        requiresApproval: requiresApprovalCount,
        requiresAuth: requiresAuthCount,
        disabled: disabledCount
      },
      sources: enrichedEntries,
      environmentConfig: {
        configuredFeedsEnvPresent: Boolean(process.env.OPPORTUNITY_FEEDS_JSON),
        cronSecretConfigured: Boolean(process.env.OPPORTUNITY_CRON_SECRET)
      }
    });
  } catch (error: any) {
    console.error("[GET /api/admin/opportunities/sources] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load source directory" },
      { status: 500 }
    );
  }
}
