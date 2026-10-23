/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — SOURCE REGISTRY
 * 
 * Central registry managing all permitted source connectors.
 * Enforces:
 * 1. Graceful isolation: Failure of one connector never breaks the Opportunity Engine.
 * 2. Status monitoring: ACTIVE, LIMITED, DISABLED, ERROR, REQUIRES_AUTH, REQUIRES_APPROVAL.
 * 3. Zero fabricated listings: Legacy adapters with only bundled mock/seed data are disabled by default
 *    and marked REQUIRES_APPROVAL / REQUIRES_AUTH.
 * 4. Extensible config-driven architecture: Registers feeds from OPPORTUNITY_FEEDS_JSON.
 * 5. Observability: Tracks success rates, last synced timestamps, error details, and records counts.
 */

import { IOpportunitySourceAdapter } from "./base-adapter";
import { ConfiguredFeedAdapter } from "./configured-feed-adapter";
import { UnstopAdapter } from "./unstop-adapter";
import { DevpostAdapter } from "./devpost-adapter";
import { DevfolioAdapter } from "./devfolio-adapter";
import { MLHAdapter } from "./mlh-adapter";
import { Hack2SkillAdapter } from "./hack2skill-adapter";
import { IITAdapter } from "./iit-adapter";
import { CompanyCareerAdapter } from "./company-career-adapter";
import { AtsFeedAdapter } from "./ats-adapter";
import { StartupAdapter } from "./startup-adapter";
import { UniversityAdapter } from "./university-adapter";
import { JobApiAdapter } from "./job-api-adapter";
import { AdminManualImportAdapter } from "./admin-import-adapter";
import { HackerRankAdapter } from "./hackerrank-adapter";
import { HackerEarthAdapter } from "./hackerearth-adapter";
import { KaggleAdapter } from "./kaggle-adapter";
import { CodeChefAdapter } from "./codechef-adapter";
import { OpenSourceAdapter } from "./open-source-adapter";
import {
  SourceRegistryEntry,
  RawOpportunity,
  CanonicalOpportunity,
  ConnectorStatus,
  ConfiguredFeedSource,
  ConnectorKind
} from "../types";

export class OpportunitySourceRegistry {
  private static instance: OpportunitySourceRegistry;
  private adapters: Map<string, IOpportunitySourceAdapter> = new Map();
  private registryEntries: Map<string, SourceRegistryEntry> = new Map();

  private constructor() {
    this.registerDefaultAdapters();
    this.syncFromEnvironment();
  }

  public static getInstance(): OpportunitySourceRegistry {
    if (!OpportunitySourceRegistry.instance) {
      OpportunitySourceRegistry.instance = new OpportunitySourceRegistry();
    }
    return OpportunitySourceRegistry.instance;
  }

  private registerDefaultAdapters() {
    const defaultList: IOpportunitySourceAdapter[] = [
      new UnstopAdapter(),
      new DevpostAdapter(),
      new DevfolioAdapter(),
      new MLHAdapter(),
      new Hack2SkillAdapter(),
      new IITAdapter(),
      new HackerRankAdapter(),
      new HackerEarthAdapter(),
      new KaggleAdapter(),
      new CodeChefAdapter(),
      new OpenSourceAdapter(),
      new CompanyCareerAdapter(),
      new AtsFeedAdapter(),
      new StartupAdapter(),
      new UniversityAdapter(),
      new JobApiAdapter(),
      new AdminManualImportAdapter()
    ];

    for (const adapter of defaultList) {
      // Legacy aggregator adapters without permitted feeds are disabled by default
      if (adapter.id === "adapter-admin-import") {
        adapter.enabled = true;
        adapter.accessStatus = "ACTIVE";
      } else if (
        adapter.id === "adapter-company-careers" ||
        adapter.id === "adapter-ats-feeds" ||
        adapter.id === "adapter-startup-hiring" ||
        adapter.id === "adapter-university-campus" ||
        adapter.id === "adapter-startups" ||
        adapter.id === "adapter-university"
      ) {
        // Permitted direct employment & university feeds
        adapter.enabled = true;
        adapter.accessStatus = "ACTIVE";
      } else if (adapter.id === "adapter-job-api") {
        const hasAdzuna = Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
        adapter.enabled = hasAdzuna;
        adapter.accessStatus = hasAdzuna ? "ACTIVE" : "REQUIRES_AUTH";
      } else {
        // Unstop, Devpost, Devfolio, MLH, Hack2Skill, IIT, HackerRank, HackerEarth, Kaggle, CodeChef, OpenSource
        // require approved partner API or official feed config
        adapter.enabled = false;
        adapter.accessStatus = "REQUIRES_APPROVAL";
      }

      this.registerAdapter(adapter);
    }
  }

  /**
   * Loads configured feeds from OPPORTUNITY_FEEDS_JSON environment variable.
   */
  public syncFromEnvironment(): void {
    const rawFeedsJson = process.env.OPPORTUNITY_FEEDS_JSON;
    if (!rawFeedsJson) return;

    try {
      const parsed = JSON.parse(rawFeedsJson);
      if (Array.isArray(parsed)) {
        for (const feedConfig of parsed) {
          if (feedConfig && feedConfig.id && feedConfig.endpoint) {
            this.registerConfiguredFeed(feedConfig);
          }
        }
      }
    } catch (err) {
      console.warn("[OpportunitySourceRegistry] Failed to parse OPPORTUNITY_FEEDS_JSON:", err);
    }
  }

  /**
   * Registers a config-driven official feed adapter.
   */
  public registerConfiguredFeed(config: ConfiguredFeedSource): ConfiguredFeedAdapter {
    const adapter = new ConfiguredFeedAdapter(config);
    this.registerAdapter(adapter);
    return adapter;
  }

  public registerAdapter(adapter: IOpportunitySourceAdapter) {
    this.adapters.set(adapter.id, adapter);

    let endpointHost: string | undefined = undefined;
    if ("getConfig" in adapter && typeof (adapter as any).getConfig === "function") {
      try {
        const conf = (adapter as any).getConfig();
        if (conf?.endpoint) {
          endpointHost = new URL(conf.endpoint).host;
        }
      } catch {}
    }

    const initialStatus = adapter.accessStatus || (adapter.enabled ? "ACTIVE" : "DISABLED");

    this.registryEntries.set(adapter.id, {
      id: adapter.id,
      name: adapter.name,
      type: adapter.type,
      status: initialStatus,
      description: adapter.description,
      refreshIntervalMs: adapter.refreshIntervalMs || 6 * 60 * 60 * 1000,
      lastSyncedAt: adapter.getLastUpdated(),
      lastRunAt: adapter.lastRunAt,
      lastSuccessfulRunAt: adapter.lastSuccessfulRunAt,
      lastFailureAt: adapter.lastFailureAt,
      lastError: adapter.lastError,
      totalOpportunities: 0,
      recordsFetched: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsDeduplicated: 0,
      recordsExpired: 0,
      recordsAccepted: 0,
      recordsRejected: 0,
      durationMs: 0,
      successRate: 100,
      connectorKind: adapter.connectorKind || "REST",
      endpointHost,
      permittedAccess: initialStatus !== "REQUIRES_APPROVAL",
      requiresAuth: initialStatus === "REQUIRES_AUTH",
      rateLimitConfig: adapter.rateLimitConfig
    });
  }

  public unregisterAdapter(id: string): boolean {
    this.registryEntries.delete(id);
    return this.adapters.delete(id);
  }

  public getAdapter(id: string): IOpportunitySourceAdapter | undefined {
    return this.adapters.get(id);
  }

  public getAllAdapters(): IOpportunitySourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  public getRegistryEntries(): SourceRegistryEntry[] {
    return Array.from(this.registryEntries.values());
  }

  public setAdapterStatus(id: string, enabled: boolean) {
    const adapter = this.adapters.get(id);
    const entry = this.registryEntries.get(id);
    if (adapter && entry) {
      adapter.enabled = enabled;
      if (!enabled) {
        entry.status = "DISABLED";
      } else {
        entry.status = adapter.accessStatus === "DISABLED" ? "ACTIVE" : adapter.accessStatus;
      }
    }
  }

  public setAdapterAccessStatus(id: string, status: ConnectorStatus) {
    const adapter = this.adapters.get(id);
    const entry = this.registryEntries.get(id);
    if (adapter && entry) {
      adapter.accessStatus = status;
      entry.status = status;
      if (status === "DISABLED") {
        adapter.enabled = false;
      } else if (status === "ACTIVE" || status === "AUTHORIZED") {
        adapter.enabled = true;
      }
    }
  }

  /**
   * Researches across all active, permitted sources asynchronously with resilient error isolation.
   * Never calls disabled, requires-auth, or unapproved mock adapters.
   */
  public async researchAllSources(query?: any): Promise<{
    rawOpportunities: RawOpportunity[];
    canonicalOpportunities: CanonicalOpportunity[];
    stats: {
      totalDiscovered: number;
      successfulSources: number;
      failedSources: number;
      sourceDetails: Record<string, { status: string; fetched: number; error?: string }>;
    };
  }> {
    const rawList: RawOpportunity[] = [];
    const canonicalList: CanonicalOpportunity[] = [];
    const sourceDetails: Record<string, { status: string; fetched: number; error?: string }> = {};
    let successful = 0;
    let failed = 0;

    for (const adapter of this.adapters.values()) {
      const entry = this.registryEntries.get(adapter.id);

      // Only execute adapters that are enabled AND active/authorized
      if (!adapter.enabled || (adapter.accessStatus !== "ACTIVE" && adapter.accessStatus !== "AUTHORIZED")) {
        sourceDetails[adapter.id] = {
          status: adapter.accessStatus || "DISABLED",
          fetched: 0
        };
        continue;
      }

      const runStart = Date.now();

      try {
        const rawItems = await adapter.discover(query);
        rawList.push(...rawItems);

        let validCount = 0;
        let rejectedCount = 0;

        for (const raw of rawItems) {
          try {
            const canonical = adapter.normalize(raw);
            const isValid = await adapter.validate(canonical);
            if (isValid) {
              canonicalList.push(canonical);
              validCount++;
            } else {
              rejectedCount++;
            }
          } catch (normErr) {
            rejectedCount++;
            console.warn(`[OpportunityRegistry] Normalization failed for ${raw.id}:`, normErr);
          }
        }

        const duration = Date.now() - runStart;
        if (entry) {
          entry.lastRunAt = new Date().toISOString();
          entry.lastSuccessfulRunAt = new Date().toISOString();
          entry.lastSyncedAt = new Date().toISOString();
          entry.totalOpportunities = rawItems.length;
          entry.recordsFetched = rawItems.length;
          entry.recordsInserted = validCount;
          entry.recordsAccepted = validCount;
          entry.recordsRejected = rejectedCount;
          entry.durationMs = duration;
          entry.status = "ACTIVE";
          entry.successRate = 100;
          entry.lastError = undefined;
        }

        sourceDetails[adapter.id] = {
          status: "ACTIVE",
          fetched: rawItems.length
        };
        successful++;
      } catch (adapterErr: any) {
        console.error(`[OpportunityRegistry] Adapter ${adapter.name} failed:`, adapterErr);
        const duration = Date.now() - runStart;
        const errMsg = adapterErr?.message || "Unknown adapter error";
        const isRateLimit = errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit");
        const isAuth = errMsg.includes("401") || errMsg.includes("403") || errMsg.toLowerCase().includes("authorization");

        const status: ConnectorStatus = isRateLimit ? "LIMITED" : isAuth ? "REQUIRES_AUTH" : "ERROR";

        if (entry) {
          entry.lastRunAt = new Date().toISOString();
          entry.lastFailureAt = new Date().toISOString();
          entry.lastError = errMsg;
          entry.durationMs = duration;
          entry.status = status;
          entry.successRate = Math.max(0, entry.successRate - 20);
        }

        sourceDetails[adapter.id] = {
          status,
          fetched: 0,
          error: errMsg
        };
        failed++;
      }
    }

    return {
      rawOpportunities: rawList,
      canonicalOpportunities: canonicalList,
      stats: {
        totalDiscovered: rawList.length,
        successfulSources: successful,
        failedSources: failed,
        sourceDetails
      }
    };
  }
}

export const sourceRegistry = OpportunitySourceRegistry.getInstance();
