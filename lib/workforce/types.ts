/**
 * GLOBAL WORKFORCE INTELLIGENCE & INDIA IMPACT TYPES (Phase 1 / Pillar 2)
 *
 * Types for:
 *   - Verified Market Signals (layoffs, hiring surges, GCC expansion, skill shifts)
 *   - India-First Impact Classification (strict evidence hierarchy)
 *   - Proactive Role Evolution Proposals (human-approved capability updates)
 */

export type MarketSignalEventType =
  | "layoff"
  | "hiring_surge"
  | "hiring_freeze"
  | "restructuring"
  | "relocation"
  | "skill_shift";

export type IndiaImpactStatus =
  | "confirmed_india_impact"
  | "reported_india_impact"
  | "potential_india_impact"
  | "no_established_india_impact"
  | "insufficient_evidence";

export interface CapabilityShiftImpact {
  capabilityName: string;
  direction: "surging" | "declining" | "transforming";
  rationale: string;
}

export interface MarketSignal {
  id: string;
  companyName: string;
  industry: string;
  country: string;
  eventType: MarketSignalEventType;
  announcementDate: string;
  headcountAffected?: number;
  indiaImpactStatus: IndiaImpactStatus;
  indiaImpactDetails: string;
  affectedCapabilities: CapabilityShiftImpact[];
  sourceUrls: string[];
  confidence: number;
  verifiedByHuman: boolean;
  createdAt?: string;
}

export type EvolutionProposalType =
  | "add_capability"
  | "deprecate_capability"
  | "adjust_depth"
  | "update_responsibility";

export type EvolutionProposalStatus =
  | "pending_approval"
  | "approved"
  | "rejected";

export interface RoleEvolutionProposal {
  id: string;
  roleId: string;
  roleTitle: string;
  marketSignalId?: string;
  targetCanonicalRole: string;
  proposedChange: string;
  changeType: EvolutionProposalType;
  marketRationale: string;
  suggestedCapability?: {
    name: string;
    tier: "Critical" | "Important" | "Preferred";
    verificationMethod: "work_sample" | "code_execution" | "targeted_interview" | "portfolio_audit";
  };
  status: EvolutionProposalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface WorkforceIntelligenceSummary {
  totalSignals: number;
  indiaImpactBreakdown: {
    confirmed: number;
    reported: number;
    potential: number;
    noEstablished: number;
    insufficientEvidence: number;
  };
  surgingSkills: {
    skill: string;
    demandMultiplier: number;
    context: string;
  }[];
  decliningSkills: {
    skill: string;
    dropPct: number;
    context: string;
  }[];
  gccExpansionHighlights: {
    hub: string;
    focusAreas: string[];
    netHiringTrend: "aggressive" | "moderate" | "steady";
  }[];
}

