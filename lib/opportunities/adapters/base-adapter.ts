/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — BASE SOURCE ADAPTER
 * 
 * Generic adapter interface for multi-source ingestion.
 * Strictly adheres to:
 * - Extensibility: Any source can be swapped or disabled independently.
 * - Source Attribution: Preserves original source URL, timestamp, and application link.
 * - Normalized Contract: Converts heterogeneous source payloads into RawOpportunity / CanonicalOpportunity.
 */

import {
  OpportunitySourceType,
  RawOpportunity,
  CanonicalOpportunity,
  ConnectorStatus
} from "../types";

export interface IOpportunitySourceAdapter {
  id: string;
  name: string;
  type: OpportunitySourceType;
  description: string;
  enabled: boolean;
  accessStatus: ConnectorStatus;
  refreshIntervalMs: number;

  lastRunAt?: string;
  lastSuccessfulRunAt?: string;
  lastFailureAt?: string;
  lastError?: string;
  recordsFetched: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsDeduplicated: number;
  recordsExpired: number;
  durationMs: number;
  successRate: number;
  rateLimitConfig?: {
    requestsPerMinute: number;
    dailyLimit: number;
  };

  discover(query?: {
    roles?: string[];
    locations?: string[];
    experienceLevel?: string;
    limit?: number;
  }): Promise<RawOpportunity[]>;

  fetch(opportunityId: string): Promise<RawOpportunity | null>;

  parse?(payload: any): RawOpportunity[];

  normalize(raw: RawOpportunity): CanonicalOpportunity;

  validate(opp: CanonicalOpportunity): Promise<boolean>;

  getLastUpdated(): string;
}

export abstract class BaseOpportunitySourceAdapter implements IOpportunitySourceAdapter {
  abstract id: string;
  abstract name: string;
  abstract type: OpportunitySourceType;
  abstract description: string;
  enabled: boolean = true;
  accessStatus: ConnectorStatus = "ACTIVE";
  refreshIntervalMs: number = 6 * 60 * 60 * 1000; // 6 hours default
  
  lastRunAt?: string;
  lastSuccessfulRunAt?: string;
  lastFailureAt?: string;
  lastError?: string;
  recordsFetched: number = 0;
  recordsInserted: number = 0;
  recordsUpdated: number = 0;
  recordsDeduplicated: number = 0;
  recordsExpired: number = 0;
  durationMs: number = 0;
  successRate: number = 100;
  rateLimitConfig?: {
    requestsPerMinute: number;
    dailyLimit: number;
  };

  protected lastUpdated: string = new Date().toISOString();

  abstract discover(query?: {
    roles?: string[];
    locations?: string[];
    experienceLevel?: string;
    limit?: number;
  }): Promise<RawOpportunity[]>;

  abstract fetch(opportunityId: string): Promise<RawOpportunity | null>;

  abstract normalize(raw: RawOpportunity): CanonicalOpportunity;

  async validate(opp: CanonicalOpportunity): Promise<boolean> {
    // Basic validation: must have ID, title, company/organizer, valid application URL
    if (!opp.id || !opp.title || (!opp.companyName && !opp.organizer)) return false;
    if (!opp.applicationUrl || !opp.applicationUrl.startsWith("http")) return false;
    return true;
  }

  getLastUpdated(): string {
    return this.lastUpdated;
  }
}
