/**
 * lib/evidence/calibrated-scoring-engine.ts
 *
 * COGNALYZE CALIBRATED EVALUATION & CONFIDENCE ENGINE (Phase 6)
 *
 * Mathematical & Architectural Principles:
 * 1. PROFICIENCY != CONFIDENCE:
 *    - Proficiency (1-5): The depth of technical ability evidenced in code, architecture, or tests.
 *    - Confidence (HIGH, MEDIUM, LOW): The statistical and provenance certainty of our evaluation.
 * 2. UNPROVEN != ZERO:
 *    - Absence of evidence is not evidence of absence. An unproven skill is UNPROVEN, not failed.
 * 3. CONTRADICTION DAMPENING:
 *    - Overclaims (e.g. claiming level 5 but evidenced at level 1 or forks without commits) dampen confidence to LOW.
 * 4. AGING & HALF-LIFE DECAY:
 *    - Historical facts remain immutable, but effective recency degrades over time (>180d, >365d, >730d).
 * 5. MULTI-SOURCE CORROBORATION BOOST:
 *    - Independent multi-source corroboration boosts confidence; circular self-reporting does not.
 */

import {
  CanonicalEvidenceItem,
  CanonicalClaimRecord,
  CanonicalVerificationEvent,
  CanonicalCapabilityAssessment,
  EvidenceDirectness,
  CanonicalVerificationStatus
} from "./canonical-types";

// ─── 1. CORE TYPES & INTERFACES ───

export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;
export type ConfidenceTier = "HIGH" | "MEDIUM" | "LOW";
export type FreshnessCategory = "CURRENT" | "RECENT" | "AGING" | "STALE";

export interface EvidenceScoringParams {
  skillId: string;
  skillName?: string;
  category?: string;
  claims?: CanonicalClaimRecord[];
  evidenceItems: CanonicalEvidenceItem[];
  verificationEvents?: CanonicalVerificationEvent[];
  selfReportedLevel?: ProficiencyLevel;
  evaluationTimestamp?: string;
}

export interface CalibratedCapabilityResult {
  skillId: string;
  skillName: string;
  category: string;
  status: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNPROVEN" | "CONFLICTING";
  demonstratedProficiency: ProficiencyLevel;
  selfReportedProficiency?: ProficiencyLevel;
  confidence: ConfidenceTier;
  confidenceScore: number;           // 0.0 to 1.0 numeric confidence
  coveragePercent: number;           // 0% to 100%
  freshnessState: FreshnessCategory;
  freshnessFactor: number;           // 0.55 to 1.0
  effectiveProficiencyScore: number; // demonstratedProficiency * freshnessFactor
  discrepancyDetected: boolean;
  discrepancyDetails?: string;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  corroborationStatus: "INDEPENDENT_CORROBORATION" | "CIRCULAR_SELF_REPORTING" | "SINGLE_SOURCE" | "NONE";
  gapsIdentified: string[];
  recommendation?: string;
  evaluatedAt: string;
}

export interface RoleSkillRequirement {
  skillId: string;
  skillName: string;
  category?: string;
  requiredProficiency: ProficiencyLevel;
  weight?: number; // e.g. 1.0 (default), 1.5, 2.0
  isMustHave?: boolean;
}

export interface RoleReadinessEvaluation {
  roleId?: string;
  overallDemonstratedReadiness: number; // 0 to 100%
  potentialReadiness: number;           // 0 to 100% assuming unproven skills are fulfilled
  overallConfidence: ConfidenceTier;
  verifiedMatchPercentage: number;
  mustHaveMet: boolean;
  unprovenSkillsCount: number;
  conflictingSkillsCount: number;
  totalRequirementsCount: number;
  skillEvaluations: CalibratedCapabilityResult[];
  criticalGaps: string[];
  actionableEvidenceRecommendations: string[];
  evaluatedAt: string;
}

// ─── 2. AGING & FRESHNESS CALCULATION ───

export const FRESHNESS_THRESHOLDS_DAYS = {
  CURRENT: 180,  // < 6 months: 1.0 factor
  RECENT: 365,   // 6 - 12 months: 0.90 factor
  AGING: 730,    // 1 - 2 years: 0.75 factor
  STALE: 730     // > 2 years: 0.55 factor
};

export function computeFreshness(
  timestamp?: string,
  nowTimestamp?: string
): { state: FreshnessCategory; factor: number; daysOld: number } {
  if (!timestamp) {
    return { state: "AGING", factor: 0.75, daysOld: 400 };
  }

  const now = nowTimestamp ? new Date(nowTimestamp).getTime() : Date.now();
  const eventTime = new Date(timestamp).getTime();
  const diffMs = Math.max(0, now - eventTime);
  const daysOld = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysOld <= FRESHNESS_THRESHOLDS_DAYS.CURRENT) {
    return { state: "CURRENT", factor: 1.0, daysOld };
  } else if (daysOld <= FRESHNESS_THRESHOLDS_DAYS.RECENT) {
    return { state: "RECENT", factor: 0.90, daysOld };
  } else if (daysOld <= FRESHNESS_THRESHOLDS_DAYS.AGING) {
    return { state: "AGING", factor: 0.75, daysOld };
  } else {
    return { state: "STALE", factor: 0.55, daysOld };
  }
}

// ─── 3. PROFICIENCY EVALUATOR (1 TO 5) ───

/**
 * Determines demonstrated proficiency strictly based on concrete code artifacts,
 * test assertions, and verified architectural implementations.
 */
export function evaluateDemonstratedProficiency(
  evidenceItems: CanonicalEvidenceItem[]
): {
  proficiency: ProficiencyLevel;
  directnessSummary: Record<EvidenceDirectness, number>;
  hasTests: boolean;
  hasArchitecturalPatterns: boolean;
  hasProductionMaturity: boolean;
} {
  const directnessSummary: Record<EvidenceDirectness, number> = {
    DIRECT_IMPLEMENTATION: 0,
    TEST_ASSERTION: 0,
    CONFIGURED_DEPENDENCY: 0,
    DOCUMENTED_MENTION: 0,
    ASSESSMENT_RESPONSE: 0,
    THIRD_PARTY_CREDENTIAL: 0
  };

  let hasTests = false;
  let hasArchitecturalPatterns = false;
  let hasProductionMaturity = false;

  for (const item of evidenceItems) {
    if (item.directness && directnessSummary[item.directness] !== undefined) {
      directnessSummary[item.directness]++;
    }

    if (item.directness === "TEST_ASSERTION") {
      hasTests = true;
    }

    // Inspect metadata for architectural markers
    const meta = item.metadata || {};
    if (meta.has_transactions || meta.has_middleware || meta.has_distributed_patterns || meta.architecturalScore >= 3) {
      hasArchitecturalPatterns = true;
    }
    if (meta.maturity === "PRODUCTION_READY" || meta.isProductionReady) {
      hasProductionMaturity = true;
    }
  }

  // Level 5: Production-ready codebase + Architectural patterns + Tests + Multiple direct implementations
  if (
    hasProductionMaturity &&
    hasArchitecturalPatterns &&
    hasTests &&
    directnessSummary.DIRECT_IMPLEMENTATION >= 3
  ) {
    return { proficiency: 5, directnessSummary, hasTests, hasArchitecturalPatterns, hasProductionMaturity };
  }

  // Level 4: Advanced architectural patterns or verified thorough tests with direct implementation
  if (
    (hasArchitecturalPatterns || hasTests) &&
    directnessSummary.DIRECT_IMPLEMENTATION >= 2
  ) {
    return { proficiency: 4, directnessSummary, hasTests, hasArchitecturalPatterns, hasProductionMaturity };
  }

  // Level 3: Active direct implementation or demonstrated assessment response
  if (
    directnessSummary.DIRECT_IMPLEMENTATION >= 1 ||
    directnessSummary.ASSESSMENT_RESPONSE >= 1
  ) {
    return { proficiency: 3, directnessSummary, hasTests, hasArchitecturalPatterns, hasProductionMaturity };
  }

  // Level 2: Configured dependency or valid credential without direct source files
  if (
    directnessSummary.CONFIGURED_DEPENDENCY >= 1 ||
    directnessSummary.THIRD_PARTY_CREDENTIAL >= 1
  ) {
    return { proficiency: 2, directnessSummary, hasTests, hasArchitecturalPatterns, hasProductionMaturity };
  }

  // Level 1: Documented mention on resume or profile
  return { proficiency: 1, directnessSummary, hasTests, hasArchitecturalPatterns, hasProductionMaturity };
}

// ─── 4. CONFIDENCE & CORROBORATION EVALUATOR ───

export function evaluateConfidenceTier(params: {
  evidenceItems: CanonicalEvidenceItem[];
  verificationEvents?: CanonicalVerificationEvent[];
  isContradicting: boolean;
  freshnessState: FreshnessCategory;
}): {
  tier: ConfidenceTier;
  numericConfidence: number;
  corroborationStatus: "INDEPENDENT_CORROBORATION" | "CIRCULAR_SELF_REPORTING" | "SINGLE_SOURCE" | "NONE";
} {
  const { evidenceItems, verificationEvents = [], isContradicting, freshnessState } = params;

  if (evidenceItems.length === 0) {
    return { tier: "LOW", numericConfidence: 0.1, corroborationStatus: "NONE" };
  }

  // Contradiction immediately dampens confidence
  if (isContradicting) {
    return { tier: "LOW", numericConfidence: 0.2, corroborationStatus: "SINGLE_SOURCE" };
  }

  // Determine source diversity
  const uniqueSourceTypes = new Set(evidenceItems.map(e => e.sourceType));
  const hasGithub = uniqueSourceTypes.has("github");
  const hasResume = uniqueSourceTypes.has("resume");
  const hasLinkedin = uniqueSourceTypes.has("linkedin");
  const hasAssessment = uniqueSourceTypes.has("interview") || uniqueSourceTypes.has("practical_assessment");
  const hasDeployment = uniqueSourceTypes.has("deployment");

  let corroborationStatus: "INDEPENDENT_CORROBORATION" | "CIRCULAR_SELF_REPORTING" | "SINGLE_SOURCE" | "NONE" = "SINGLE_SOURCE";

  if (uniqueSourceTypes.size === 1) {
    corroborationStatus = "SINGLE_SOURCE";
  } else if ((hasResume || hasLinkedin) && !hasGithub && !hasAssessment && !hasDeployment) {
    // Only self-reported sources without technical verification
    corroborationStatus = "CIRCULAR_SELF_REPORTING";
  } else if ((hasGithub || hasAssessment || hasDeployment) && (uniqueSourceTypes.size >= 2)) {
    // Independent external inspection confirms self-reported claim
    corroborationStatus = "INDEPENDENT_CORROBORATION";
  }

  // Check cryptographic / high-tier verification events
  const hasCryptographicEvent = verificationEvents.some(
    v => v.verificationLevel === "LEVEL_C_CRYPTOGRAPHIC" && v.result === "PASS"
  );
  const hasIssuerDirectEvent = verificationEvents.some(
    v => v.verificationLevel === "LEVEL_B_ISSUER_DIRECT" && v.result === "PASS"
  );

  let rawScore = 0.5;

  // Direct implementation weight
  const directImpls = evidenceItems.filter(e => e.directness === "DIRECT_IMPLEMENTATION");
  const testAssertions = evidenceItems.filter(e => e.directness === "TEST_ASSERTION");

  if (hasCryptographicEvent || (directImpls.length >= 2 && testAssertions.length >= 1)) {
    rawScore = 0.95;
  } else if (hasIssuerDirectEvent || directImpls.length >= 1) {
    rawScore = 0.80;
  } else if (evidenceItems.some(e => e.directness === "CONFIGURED_DEPENDENCY")) {
    rawScore = 0.60;
  } else {
    rawScore = 0.35;
  }

  // Corroboration adjustments
  if (corroborationStatus === "INDEPENDENT_CORROBORATION") {
    rawScore = Math.min(1.0, rawScore + 0.10);
  } else if (corroborationStatus === "CIRCULAR_SELF_REPORTING") {
    rawScore = Math.max(0.2, rawScore - 0.15);
  }

  // Freshness decay on confidence
  if (freshnessState === "STALE") {
    rawScore *= 0.65;
  } else if (freshnessState === "AGING") {
    rawScore *= 0.85;
  }

  let tier: ConfidenceTier = "LOW";
  if (rawScore >= 0.75) {
    tier = "HIGH";
  } else if (rawScore >= 0.45) {
    tier = "MEDIUM";
  } else {
    tier = "LOW";
  }

  return {
    tier,
    numericConfidence: Math.round(rawScore * 100) / 100,
    corroborationStatus
  };
}

// ─── 5. CONTRADICTION & OVERCLAIM DETECTOR ───

export function detectDiscrepancy(params: {
  selfReportedLevel?: ProficiencyLevel;
  demonstratedProficiency: ProficiencyLevel;
  evidenceItems: CanonicalEvidenceItem[];
  verificationEvents?: CanonicalVerificationEvent[];
}): {
  isDiscrepancy: boolean;
  details?: string;
  overclaimDelta: number;
} {
  const { selfReportedLevel, demonstratedProficiency, evidenceItems, verificationEvents = [] } = params;

  // 1. Check for explicit failed verification events (e.g. template clone, fork without commits)
  for (const v of verificationEvents) {
    if (v.result === "FAIL" || v.limitations?.includes("FORK_WITHOUT_CONTRIBUTIONS") || v.limitations?.includes("TEMPLATE_CLONE_DETECTED")) {
      return {
        isDiscrepancy: true,
        details: `Verification failure: ${v.details || v.limitations?.join(", ") || "Source artifact failed attribution inspection"}`,
        overclaimDelta: selfReportedLevel ? Math.max(0, selfReportedLevel - demonstratedProficiency) : 2
      };
    }
  }

  // 2. Check for overclaim between self-reported and demonstrated
  if (selfReportedLevel && selfReportedLevel > demonstratedProficiency) {
    const delta = selfReportedLevel - demonstratedProficiency;
    // An overclaim of 2 or more levels is a significant discrepancy
    if (delta >= 2) {
      return {
        isDiscrepancy: true,
        details: `Overclaim detected: Self-reported level ${selfReportedLevel} exceeds demonstrated level ${demonstratedProficiency} by ${delta} levels.`,
        overclaimDelta: delta
      };
    }
  }

  return { isDiscrepancy: false, overclaimDelta: 0 };
}

// ─── 6. CALIBRATED CAPABILITY SCORER ───

/**
 * Calibrates a single capability based on all available evidence, claims, and verification events.
 * Strictly guarantees UNPROVEN != ZERO and PROFICIENCY != CONFIDENCE.
 */
export function calibrateCapabilityScore(params: EvidenceScoringParams): CalibratedCapabilityResult {
  const {
    skillId,
    skillName = skillId,
    category = "General",
    claims = [],
    evidenceItems = [],
    verificationEvents = [],
    selfReportedLevel,
    evaluationTimestamp
  } = params;

  const now = evaluationTimestamp || new Date().toISOString();

  // 1. Handle Unproven Condition (Zero Evidence Provided)
  if (evidenceItems.length === 0) {
    return {
      skillId,
      skillName,
      category,
      status: "UNPROVEN",
      demonstratedProficiency: 1,
      selfReportedProficiency: selfReportedLevel,
      confidence: "LOW",
      confidenceScore: 0.1,
      coveragePercent: 0,
      freshnessState: "CURRENT",
      freshnessFactor: 1.0,
      effectiveProficiencyScore: 1.0,
      discrepancyDetected: false,
      supportingEvidenceIds: [],
      contradictingEvidenceIds: [],
      corroborationStatus: "NONE",
      gapsIdentified: ["No inspectable code, commits, or artifacts provided yet. Capability is unproven, not disproven."],
      recommendation: `Provide a public repository, commit history, or take a quick assessment in ${skillName}.`,
      evaluatedAt: now
    };
  }

  // 2. Compute Freshness from latest evidence item
  let mostRecentDate: string | undefined;
  for (const item of evidenceItems) {
    const itemDate = item.occurredAt || item.observedAt || item.verificationTimestamp;
    if (itemDate) {
      if (!mostRecentDate || new Date(itemDate).getTime() > new Date(mostRecentDate).getTime()) {
        mostRecentDate = itemDate;
      }
    }
  }
  const freshness = computeFreshness(mostRecentDate, now);

  // 3. Evaluate Demonstrated Proficiency (1 to 5)
  const profEval = evaluateDemonstratedProficiency(evidenceItems);
  const demonstratedProficiency = profEval.proficiency;

  // 4. Check for Contradictions & Overclaims
  const discrepancy = detectDiscrepancy({
    selfReportedLevel,
    demonstratedProficiency,
    evidenceItems,
    verificationEvents
  });

  // 5. Evaluate Confidence Tier & Corroboration
  const confEval = evaluateConfidenceTier({
    evidenceItems,
    verificationEvents,
    isContradicting: discrepancy.isDiscrepancy,
    freshnessState: freshness.state
  });

  // 6. Compute Coverage Percentage
  // Coverage measures how many dimensions of capability are backed by evidence:
  // - Direct code authored: 40%
  // - Unit test assertions: 30%
  // - Architectural/Production patterns: 20%
  // - Multi-source corroboration: 10%
  let coverage = 0;
  if (profEval.directnessSummary.DIRECT_IMPLEMENTATION > 0) coverage += 40;
  if (profEval.hasTests) coverage += 30;
  if (profEval.hasArchitecturalPatterns || profEval.hasProductionMaturity) coverage += 20;
  if (confEval.corroborationStatus === "INDEPENDENT_CORROBORATION") coverage += 10;
  if (coverage === 0 && evidenceItems.length > 0) coverage = 15; // Mention/manifest baseline

  // Effective proficiency score (accounting for aging decay)
  const effectiveScore = Math.round(demonstratedProficiency * freshness.factor * 100) / 100;

  // Determine overall status
  let status: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNPROVEN" | "CONFLICTING" = "PARTIALLY_VERIFIED";
  if (discrepancy.isDiscrepancy) {
    status = "CONFLICTING";
  } else if (confEval.tier === "HIGH" && demonstratedProficiency >= 3) {
    status = "VERIFIED";
  } else if (confEval.tier === "LOW" && demonstratedProficiency <= 1) {
    status = "UNPROVEN";
  }

  // Identify gaps
  const gaps: string[] = [];
  if (!profEval.hasTests) {
    gaps.push(`No automated test assertions found validating ${skillName} functionality.`);
  }
  if (!profEval.hasArchitecturalPatterns && demonstratedProficiency >= 3) {
    gaps.push(`Architectural reliability patterns (transactions, middleware, schema validation) not yet observed.`);
  }
  if (freshness.state === "STALE" || freshness.state === "AGING") {
    gaps.push(`Evidence is aging (${freshness.daysOld} days old). Fresh project activity recommended.`);
  }
  if (discrepancy.isDiscrepancy && discrepancy.details) {
    gaps.push(discrepancy.details);
  }

  // Supporting evidence IDs
  const supportingIds = evidenceItems.map(e => e.id);
  const contradictingIds = discrepancy.isDiscrepancy
    ? verificationEvents.filter(v => v.result === "FAIL").map(v => v.id)
    : [];

  return {
    skillId,
    skillName,
    category,
    status,
    demonstratedProficiency,
    selfReportedProficiency: selfReportedLevel,
    confidence: confEval.tier,
    confidenceScore: confEval.numericConfidence,
    coveragePercent: Math.min(100, coverage),
    freshnessState: freshness.state,
    freshnessFactor: freshness.factor,
    effectiveProficiencyScore: effectiveScore,
    discrepancyDetected: discrepancy.isDiscrepancy,
    discrepancyDetails: discrepancy.details,
    supportingEvidenceIds: supportingIds,
    contradictingEvidenceIds: contradictingIds,
    corroborationStatus: confEval.corroborationStatus,
    gapsIdentified: gaps,
    recommendation: gaps.length > 0 ? gaps[0] : `Demonstrated mastery at level ${demonstratedProficiency}.`,
    evaluatedAt: now
  };
}

// ─── 7. ROLE READINESS & OVERALL CALIBRATION ENGINE ───

/**
 * Evaluates candidate readiness against a set of role requirements.
 * Ensures:
 * - Unproven capabilities do not artificially collapse verified scores into 0.
 * - Both Verified Match Score and Potential Match Score are reported.
 * - Discrepancies and critical gaps are highlighted for recruiters and candidates.
 */
export function evaluateCandidateRoleReadiness(params: {
  roleId?: string;
  requirements: RoleSkillRequirement[];
  evidenceBySkill: Map<string, CanonicalEvidenceItem[]> | Record<string, CanonicalEvidenceItem[]>;
  claimsBySkill?: Map<string, CanonicalClaimRecord[]> | Record<string, CanonicalClaimRecord[]>;
  verificationEvents?: CanonicalVerificationEvent[];
  selfReportedLevels?: Record<string, ProficiencyLevel>;
  evaluationTimestamp?: string;
}): RoleReadinessEvaluation {
  const {
    roleId,
    requirements,
    evidenceBySkill,
    claimsBySkill = {},
    verificationEvents = [],
    selfReportedLevels = {},
    evaluationTimestamp
  } = params;

  const now = evaluationTimestamp || new Date().toISOString();

  const getEvidence = (skillId: string): CanonicalEvidenceItem[] => {
    if (evidenceBySkill instanceof Map) {
      return evidenceBySkill.get(skillId) || [];
    }
    return evidenceBySkill[skillId] || [];
  };

  const getClaims = (skillId: string): CanonicalClaimRecord[] => {
    if (claimsBySkill instanceof Map) {
      return claimsBySkill.get(skillId) || [];
    }
    return claimsBySkill[skillId] || [];
  };

  const skillEvaluations: CalibratedCapabilityResult[] = [];
  let totalWeightedFulfillment = 0;
  let totalPotentialFulfillment = 0;
  let totalWeight = 0;
  let unprovenCount = 0;
  let conflictingCount = 0;
  let mustHaveMet = true;
  const criticalGaps: string[] = [];
  const actionableRecommendations: string[] = [];

  for (const req of requirements) {
    const weight = req.weight || 1.0;
    totalWeight += weight;

    const evidence = getEvidence(req.skillId);
    const claims = getClaims(req.skillId);
    const selfReported = selfReportedLevels[req.skillId];

    const evalResult = calibrateCapabilityScore({
      skillId: req.skillId,
      skillName: req.skillName,
      category: req.category,
      claims,
      evidenceItems: evidence,
      verificationEvents,
      selfReportedLevel: selfReported,
      evaluationTimestamp: now
    });

    skillEvaluations.push(evalResult);

    if (evalResult.status === "UNPROVEN") {
      unprovenCount++;
      if (req.isMustHave) {
        mustHaveMet = false;
        criticalGaps.push(`Must-have requirement '${req.skillName}' has no inspectable evidence (unproven).`);
      }
      actionableRecommendations.push(
        `Provide project evidence or complete practical assessment for '${req.skillName}'.`
      );
    } else if (evalResult.status === "CONFLICTING") {
      conflictingCount++;
      if (req.isMustHave) {
        mustHaveMet = false;
        criticalGaps.push(`Must-have requirement '${req.skillName}' has conflicting verification results.`);
      }
    }

    // Ratio of demonstrated proficiency to required proficiency (capped at 1.0)
    // If a capability is UNPROVEN, demonstrated fulfillment is 0 (no verified credit)
    const fulfillmentRatio = evalResult.status === "UNPROVEN"
      ? 0
      : Math.min(1.0, evalResult.demonstratedProficiency / req.requiredProficiency);
    totalWeightedFulfillment += fulfillmentRatio * weight;

    // Potential fulfillment assumes unproven skill could achieve at least required level
    const potentialRatio = evalResult.status === "UNPROVEN"
      ? 1.0
      : fulfillmentRatio;
    totalPotentialFulfillment += potentialRatio * weight;
  }

  const overallReadiness = totalWeight > 0
    ? Math.round((totalWeightedFulfillment / totalWeight) * 100)
    : 0;

  const potentialReadiness = totalWeight > 0
    ? Math.round((totalPotentialFulfillment / totalWeight) * 100)
    : 0;

  // Aggregate confidence
  const highConfCount = skillEvaluations.filter(s => s.confidence === "HIGH").length;
  const lowConfCount = skillEvaluations.filter(s => s.confidence === "LOW").length;

  let overallConfidence: ConfidenceTier = "MEDIUM";
  if (highConfCount >= Math.ceil(requirements.length * 0.6)) {
    overallConfidence = "HIGH";
  } else if (lowConfCount >= Math.ceil(requirements.length * 0.5) || conflictingCount > 0) {
    overallConfidence = "LOW";
  }

  return {
    roleId,
    overallDemonstratedReadiness: overallReadiness,
    potentialReadiness,
    overallConfidence,
    verifiedMatchPercentage: overallReadiness,
    mustHaveMet,
    unprovenSkillsCount: unprovenCount,
    conflictingSkillsCount: conflictingCount,
    totalRequirementsCount: requirements.length,
    skillEvaluations,
    criticalGaps,
    actionableEvidenceRecommendations: actionableRecommendations,
    evaluatedAt: now
  };
}

// ─── 8. CANONICAL ASSESSMENT CONVERTER ───

/**
 * Converts a CalibratedCapabilityResult into the canonical assessment contract
 * for persistence into Student DNA and the Supabase evidence spine.
 */
export function toCanonicalAssessment(result: CalibratedCapabilityResult): CanonicalCapabilityAssessment {
  return {
    skillId: result.skillId,
    skillName: result.skillName,
    category: result.category,
    demonstratedProficiency: result.demonstratedProficiency,
    selfReportedProficiency: result.selfReportedProficiency,
    confidence: result.confidence,
    coveragePercent: result.coveragePercent,
    freshnessState: result.freshnessState,
    supportingEvidenceIds: result.supportingEvidenceIds,
    gapsIdentified: result.gapsIdentified,
    lastEvaluated: result.evaluatedAt
  };
}
