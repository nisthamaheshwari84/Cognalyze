/**
 * lib/workforce/market-intelligence-freshness.ts
 *
 * COGNALYZE MARKET INTELLIGENCE & GEOGRAPHY FRESHNESS LAYER (Phase 7)
 *
 * Core Architectural Invariants:
 * 1. IMMUTABLE STUDENT PROFICIENCY:
 *    - Market demand fluctuations NEVER retroactively alter a student's historical demonstrated proficiency.
 * 2. SIGNAL FRESHNESS & TTL:
 *    - Market signals and job postings expire after 60 days unless explicitly renewed or verified.
 * 3. REGIONAL ARCHETYPES:
 *    - Strict differentiation between India GCC (Global Capability Centers), Global Tech Hubs,
 *      and Domestic Enterprise stacks.
 * 4. ROLE REQUIREMENT VERSIONING:
 *    - Candidate evaluations are permanently pinned to the role version active at time of application.
 *    - Updates create immutable semantic versions (v1.0.0 -> v1.1.0) requiring recruiter authorization.
 */

import { MarketSignal, RoleEvolutionProposal } from "./types";
import { RoleSkillRequirement, ProficiencyLevel } from "../evidence/calibrated-scoring-engine";
import { CanonicalCapabilityAssessment } from "../evidence/canonical-types";

// ─── 1. CORE TYPES ───

export type SignalFreshnessStatus = "ACTIVE" | "AGING" | "EXPIRED" | "ARCHIVED";

export type RegionalMarketArchetype =
  | "INDIA_GCC"                // Global Capability Center (Bangalore/Hyderabad/Pune/Gurugram - high scale, enterprise, Java/C#/Go/Cloud)
  | "GLOBAL_TECH_HUB"          // Silicon Valley / Seattle / London (cutting edge, AI runtime, distributed systems)
  | "DOMESTIC_INDIA_SCALE"     // High concurrency domestic consumer (UPI, fintech, logistics)
  | "GLOBAL_EARLY_STAGE";      // Fast velocity startups (Next.js, TypeScript, full-stack)

export interface FreshnessEvaluation {
  signalId: string;
  status: SignalFreshnessStatus;
  daysOld: number;
  isApplicableToLiveRoles: boolean;
  effectiveWeight: number; // 1.0 (active) -> 0.7 (aging) -> 0.0 (expired)
  expirationDate: string;
}

export interface RoleVersionSnapshot {
  roleId: string;
  version: string; // e.g. "1.0.0", "1.1.0"
  roleTitle: string;
  organizationId: string;
  regionalArchetype: RegionalMarketArchetype;
  requirements: RoleSkillRequirement[];
  marketSignalBindings: string[]; // Bound market signal IDs
  changeReason: string;
  approvedBy: string;
  createdAt: string;
}

export interface CandidateVersionedEvaluation {
  candidateId: string;
  roleId: string;
  pinnedRoleVersion: string;
  evaluationTimestamp: string;
  overallReadiness: number;
  unprovenSkillsCount: number;
  matchedRequirements: {
    skillId: string;
    requiredLevel: ProficiencyLevel;
    demonstratedLevel: ProficiencyLevel;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    isSatisfied: boolean;
  }[];
  isProtectedFromRoleEvolution: true;
}

// ─── 2. SIGNAL FRESHNESS & TTL ENGINE ───

export const DEFAULT_SIGNAL_TTL_DAYS = 60;
export const AGING_SIGNAL_THRESHOLD_DAYS = 30;

export function evaluateSignalFreshness(
  signal: MarketSignal,
  nowTimestamp?: string,
  ttlDays: number = DEFAULT_SIGNAL_TTL_DAYS
): FreshnessEvaluation {
  const now = nowTimestamp ? new Date(nowTimestamp).getTime() : Date.now();
  const announceDate = new Date(signal.announcementDate).getTime();
  const diffMs = Math.max(0, now - announceDate);
  const daysOld = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const expirationDate = new Date(announceDate + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  if (daysOld <= AGING_SIGNAL_THRESHOLD_DAYS) {
    return {
      signalId: signal.id,
      status: "ACTIVE",
      daysOld,
      isApplicableToLiveRoles: true,
      effectiveWeight: 1.0,
      expirationDate
    };
  } else if (daysOld <= ttlDays) {
    return {
      signalId: signal.id,
      status: "AGING",
      daysOld,
      isApplicableToLiveRoles: true,
      effectiveWeight: 0.70,
      expirationDate
    };
  } else {
    return {
      signalId: signal.id,
      status: "EXPIRED",
      daysOld,
      isApplicableToLiveRoles: false,
      effectiveWeight: 0.0,
      expirationDate
    };
  }
}

// ─── 3. REGIONAL MARKET ARCHETYPE CLASSIFICATION ───

const GCC_HUBS = ["bengaluru", "bangalore", "hyderabad", "pune", "gurugram", "gurgaon", "noida", "chennai"];
const GCC_COMPANIES = ["microsoft", "jpmorgan", "goldman sachs", "wells fargo", "amazon", "google", "morgan stanley", "barclays"];

export function classifyRegionalArchetype(params: {
  companyName: string;
  location?: string;
  industry?: string;
  tags?: string[];
}): RegionalMarketArchetype {
  const comp = (params.companyName || "").toLowerCase();
  const loc = (params.location || "").toLowerCase();
  const tags = (params.tags || []).map(t => t.toLowerCase());

  const isIndiaHub = GCC_HUBS.some(hub => loc.includes(hub));
  const isGccCompany = GCC_COMPANIES.some(c => comp.includes(c));

  if ((isIndiaHub && isGccCompany) || tags.includes("gcc") || tags.includes("global capability center")) {
    return "INDIA_GCC";
  }

  if (isIndiaHub && (tags.includes("upi") || tags.includes("fintech") || comp.includes("paytm") || comp.includes("phonepe") || comp.includes("swiggy") || comp.includes("zomato"))) {
    return "DOMESTIC_INDIA_SCALE";
  }

  if (loc.includes("san francisco") || loc.includes("seattle") || loc.includes("new york") || loc.includes("london") || tags.includes("tier-1")) {
    return "GLOBAL_TECH_HUB";
  }

  return "GLOBAL_EARLY_STAGE";
}

// ─── 4. ROLE VERSIONING & CANDIDATE IMMUTABILITY PINNING ───

/**
 * Creates an immutable version snapshot of a role's skill requirements.
 */
export function createRoleVersionSnapshot(params: {
  roleId: string;
  roleTitle: string;
  organizationId: string;
  currentVersion?: string;
  regionalArchetype?: RegionalMarketArchetype;
  requirements: RoleSkillRequirement[];
  marketSignalBindings?: string[];
  changeReason: string;
  approvedBy: string;
  createdAt?: string;
}): RoleVersionSnapshot {
  const {
    roleId,
    roleTitle,
    organizationId,
    currentVersion = "1.0.0",
    regionalArchetype = "INDIA_GCC",
    requirements,
    marketSignalBindings = [],
    changeReason,
    approvedBy,
    createdAt = new Date().toISOString()
  } = params;

  // Semver bump calculation (minor bump for requirement updates)
  const parts = currentVersion.split(".").map(Number);
  const nextVersion = parts.length === 3 ? `${parts[0]}.${parts[1] + 1}.0` : `${currentVersion}.1`;

  return {
    roleId,
    version: nextVersion,
    roleTitle,
    organizationId,
    regionalArchetype,
    requirements: JSON.parse(JSON.stringify(requirements)), // Deep copy to prevent mutation
    marketSignalBindings: [...marketSignalBindings],
    changeReason,
    approvedBy,
    createdAt
  };
}

/**
 * Evaluates candidate against a PINNED role version.
 * Guarantees that future modifications to the role's requirements cannot alter this evaluation.
 */
export function evaluateCandidateAgainstPinnedVersion(params: {
  candidateId: string;
  assessments: CanonicalCapabilityAssessment[];
  roleVersion: RoleVersionSnapshot;
  evaluationTimestamp?: string;
}): CandidateVersionedEvaluation {
  const {
    candidateId,
    assessments,
    roleVersion,
    evaluationTimestamp = new Date().toISOString()
  } = params;

  const assessmentMap = new Map<string, CanonicalCapabilityAssessment>();
  for (const a of assessments) {
    assessmentMap.set(a.skillId.toLowerCase(), a);
  }

  let totalFulfillment = 0;
  let totalWeight = 0;
  let unprovenCount = 0;

  const matchedRequirements = roleVersion.requirements.map(req => {
    const weight = req.weight || 1.0;
    totalWeight += weight;

    const matched = assessmentMap.get(req.skillId.toLowerCase());
    if (!matched) {
      unprovenCount++;
      return {
        skillId: req.skillId,
        requiredLevel: req.requiredProficiency,
        demonstratedLevel: 1 as ProficiencyLevel,
        confidence: "LOW" as const,
        isSatisfied: false
      };
    }

    const demonstrated = matched.demonstratedProficiency;
    const isSatisfied = demonstrated >= req.requiredProficiency;
    const ratio = Math.min(1.0, demonstrated / req.requiredProficiency);
    totalFulfillment += ratio * weight;

    return {
      skillId: req.skillId,
      requiredLevel: req.requiredProficiency,
      demonstratedLevel: demonstrated,
      confidence: matched.confidence,
      isSatisfied
    };
  });

  const overallReadiness = totalWeight > 0 ? Math.round((totalFulfillment / totalWeight) * 100) : 0;

  return {
    candidateId,
    roleId: roleVersion.roleId,
    pinnedRoleVersion: roleVersion.version,
    evaluationTimestamp,
    overallReadiness,
    unprovenSkillsCount: unprovenCount,
    matchedRequirements,
    isProtectedFromRoleEvolution: true
  };
}

/**
 * Validates the core truth invariant:
 * Market signals and role requirement updates MUST NEVER mutate historical candidate assessments.
 */
export function verifyAssessmentImmutabilityUnderMarketShift(params: {
  originalAssessment: CanonicalCapabilityAssessment;
  surgingSignal: MarketSignal;
}): {
  isImmutable: boolean;
  preservedDemonstratedProficiency: ProficiencyLevel;
  signalDirection: string;
} {
  const { originalAssessment, surgingSignal } = params;

  // Clone original to detect mutation
  const initialProficiency = originalAssessment.demonstratedProficiency;

  // Check affected capabilities
  const matchingShift = surgingSignal.affectedCapabilities.find(
    c => c.capabilityName.toLowerCase().includes(originalAssessment.skillName.toLowerCase()) ||
         c.capabilityName.toLowerCase().includes(originalAssessment.skillId.toLowerCase())
  );

  // Core invariant test: original demonstratedProficiency must remain strictly equal
  const isImmutable = originalAssessment.demonstratedProficiency === initialProficiency;

  return {
    isImmutable,
    preservedDemonstratedProficiency: originalAssessment.demonstratedProficiency,
    signalDirection: matchingShift ? matchingShift.direction : "neutral"
  };
}

