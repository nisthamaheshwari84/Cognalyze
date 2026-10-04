/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — SOURCE REGISTRY
 * 
 * Central registry managing all permitted source connectors.
 * Enforces:
 * 1. Graceful isolation: Failure of one connector never breaks the Opportunity Engine.
 * 2. Status monitoring: ACTIVE, LIMITED, DISABLED, ERROR, REQUIRES_AUTH, REQUIRES_APPROVAL.
 * 3. Observability: Tracks success rates, last synced timestamps, error details, and records counts.
 * 4. Extensibility: New connectors register with a single call.
 * 5. Multi-Source Ecosystem: Covers Unstop, Devpost, Devfolio, MLH, Hack2Skill, IITs, ATS, Companies, and Startups.
 */

import { IOpportunitySourceAdapter } from "./base-adapter";
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
import { SourceRegistryEntry, RawOpportunity, CanonicalOpportunity, ConnectorStatus } from "../types";

export class OpportunitySourceRegistry {
  private static instance: OpportunitySourceRegistry;
  private adapters: Map<string, IOpportunitySourceAdapter> = new Map();
  private registryEntries: Map<string, SourceRegistryEntry> = new Map();

  private constructor() {
    this.registerDefaultAdapters();
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
      this.registerAdapter(adapter);
    }
  }

  public registerAdapter(adapter: IOpportunitySourceAdapter) {
    this.adapters.set(adapter.id, adapter);
    this.registryEntries.set(adapter.id, {
      id: adapter.id,
      name: adapter.name,
      type: adapter.type,
      status: adapter.accessStatus || (adapter.enabled ? "ACTIVE" : "DISABLED"),
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
      durationMs: 0,
      successRate: 100,
      rateLimitConfig: adapter.rateLimitConfig
    });
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
      entry.status = enabled ? "ACTIVE" : "DISABLED";
    }
  }

  public setAdapterAccessStatus(id: string, status: ConnectorStatus) {
    const adapter = this.adapters.get(id);
    const entry = this.registryEntries.get(id);
    if (adapter && entry) {
      adapter.accessStatus = status;
      entry.status = status;
    }
  }

  /**
   * Researches across all active, enabled sources asynchronously with resilient error isolation.
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
      if (!adapter.enabled) continue;

      const runStart = Date.now();
      const entry = this.registryEntries.get(adapter.id);

      try {
        const rawItems = await adapter.discover(query);
        rawList.push(...rawItems);

        let validCount = 0;
        for (const raw of rawItems) {
          try {
            const canonical = adapter.normalize(raw);
            const isValid = await adapter.validate(canonical);
            if (isValid) {
              canonicalList.push(canonical);
              validCount++;
            }
          } catch (normErr) {
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
          entry.durationMs = duration;
          entry.status = "ACTIVE";
          entry.successRate = 100;
        }

        sourceDetails[adapter.id] = {
          status: "ACTIVE",
          fetched: rawItems.length
        };
        successful++;
      } catch (adapterErr: any) {
        console.error(`[OpportunityRegistry] Adapter ${adapter.name} failed:`, adapterErr);
        const duration = Date.now() - runStart;
        if (entry) {
          entry.lastRunAt = new Date().toISOString();
          entry.lastFailureAt = new Date().toISOString();
          entry.lastError = adapterErr?.message || "Unknown adapter error";
          entry.durationMs = duration;
          entry.status = "ERROR";
          entry.successRate = Math.max(0, entry.successRate - 20);
        }

        sourceDetails[adapter.id] = {
          status: "ERROR",
          fetched: 0,
          error: adapterErr?.message || "Source failure"
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
