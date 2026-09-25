/**
 * REQUIREMENT STATE MACHINE (PART 5.2)
 * 
 * Single pure function derive(), unit-tested, versioned.
 * Governed by ADR-003 and Truth Contracts T1, T2, T3, T5, T6.
 */

import { RequirementState } from "@/lib/copy/language";

export type EvidenceTier = "T0" | "T1" | "T2" | "T3" | "T4";

export type EvidenceCoverage = "direct" | "adjacent" | "partial";

export type EvidenceRelation = "supports" | "partially_supports" | "adjacent_to" | "contradicts";

export interface EvidenceItemInput {
  id: string;
  sourceId: string;
  tier: EvidenceTier;
  coverage: EvidenceCoverage;
  relation: EvidenceRelation;
  occurredAt?: string; // ISO date string
  observedAt?: string; // ISO date string
  isConflictResolved?: boolean;
}

export interface ValidationResultInput {
  taskId: string;
  requirementId: string;
  tier: "T3" | "T4";
  established: boolean; // did the candidate meet the rubric?
  evaluatedAt: string;
  evaluatorNotes?: string;
}

export interface DeriveOptions {
  recencyWindowMonths?: number; // default 24
  now?: Date; // inject for reproducible testing
  isDismissedByRecruiter?: boolean;
}

export interface DerivationResult {
  state: RequirementState;
  derivationVersion: string;
  inputEvidenceIds: string[];
  explanation: string;
  qualifyingEvidenceCount: number;
  independentSourcesCount: number;
  conflictingEvidenceIds: string[];
  hasValidationAttempt: boolean;
}

export const CURRENT_DERIVATION_VERSION = "2.0.0";

const TIER_ORDINAL: Record<EvidenceTier, number> = {
  T0: 0,
  T1: 1,
  T2: 2,
  T3: 3,
  T4: 4,
};

/**
 * Pure function to derive requirement state from stored evidence and validation results.
 * 
 * Truth Contract Guarantees:
 * 1. Absence of evidence is NEVER treated as negative evidence (results in UNKNOWN).
 * 2. Unresolved contradictions lead to CONFLICTING.
 * 3. Validation failures lead to NOT_ESTABLISHED_AFTER_VALIDATION.
 * 4. Recruiter waiver leads to NOT_APPLICABLE.
 * 5. Direct T2+ or direct T1+ across >=2 independent sources leads to ESTABLISHED.
 */
export function deriveRequirementState(
  requirementId: string,
  evidenceItems: EvidenceItemInput[],
  validationResults: ValidationResultInput[] = [],
  options: DeriveOptions = {}
): DerivationResult {
  const {
    recencyWindowMonths = 24,
    now = new Date(),
    isDismissedByRecruiter = false,
  } = options;

  // 1. Recruiter Waiver / Dismissal
  if (isDismissedByRecruiter) {
    return {
      state: "NOT_APPLICABLE",
      derivationVersion: CURRENT_DERIVATION_VERSION,
      inputEvidenceIds: evidenceItems.map((e) => e.id),
      explanation: "Requirement has been waived or marked not applicable by recruiter.",
      qualifyingEvidenceCount: 0,
      independentSourcesCount: 0,
      conflictingEvidenceIds: [],
      hasValidationAttempt: false,
    };
  }

  // 2. Check for Unresolved Conflicts
  const unresolvedConflicts = evidenceItems.filter(
    (e) => e.relation === "contradicts" && !e.isConflictResolved
  );
  if (unresolvedConflicts.length > 0) {
    return {
      state: "CONFLICTING",
      derivationVersion: CURRENT_DERIVATION_VERSION,
      inputEvidenceIds: evidenceItems.map((e) => e.id),
      explanation: `Contradicting evidence items detected (${unresolvedConflicts.length}) requiring human review.`,
      qualifyingEvidenceCount: 0,
      independentSourcesCount: new Set(evidenceItems.map((e) => e.sourceId)).size,
      conflictingEvidenceIds: unresolvedConflicts.map((e) => e.id),
      hasValidationAttempt: false,
    };
  }

  // 3. Check Validation Results (T3/T4)
  // Sort by most recent evaluation date
  const sortedValidations = [...validationResults].sort(
    (a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
  );
  const latestValidation = sortedValidations[0];

  if (latestValidation && !latestValidation.established) {
    return {
      state: "NOT_ESTABLISHED_AFTER_VALIDATION",
      derivationVersion: CURRENT_DERIVATION_VERSION,
      inputEvidenceIds: evidenceItems.map((e) => e.id),
      explanation: `Structured ${latestValidation.tier} validation did not establish the requirement against rubric.`,
      qualifyingEvidenceCount: 0,
      independentSourcesCount: new Set(evidenceItems.map((e) => e.sourceId)).size,
      conflictingEvidenceIds: [],
      hasValidationAttempt: true,
    };
  }

  // 4. Zero Evidence -> UNKNOWN (Truth Contract T5: Absence of evidence is not evidence of absence)
  const supportingItems = evidenceItems.filter(
    (e) => e.relation === "supports" || e.relation === "partially_supports" || e.relation === "adjacent_to"
  );

  if (supportingItems.length === 0 && (!latestValidation || !latestValidation.established)) {
    return {
      state: "UNKNOWN",
      derivationVersion: CURRENT_DERIVATION_VERSION,
      inputEvidenceIds: [],
      explanation: "No qualifying evidence currently available.",
      qualifyingEvidenceCount: 0,
      independentSourcesCount: 0,
      conflictingEvidenceIds: [],
      hasValidationAttempt: false,
    };
  }

  // If latest validation was positive (T3/T4 established)
  if (latestValidation && latestValidation.established) {
    return {
      state: "ESTABLISHED",
      derivationVersion: CURRENT_DERIVATION_VERSION,
      inputEvidenceIds: [...evidenceItems.map((e) => e.id), latestValidation.taskId],
      explanation: `Requirement established via structured ${latestValidation.tier} validation task.`,
      qualifyingEvidenceCount: supportingItems.length + 1,
      independentSourcesCount: new Set(evidenceItems.map((e) => e.sourceId)).size + 1,
      conflictingEvidenceIds: [],
      hasValidationAttempt: true,
    };
  }

  // 5. Evaluate Supporting Evidence Items
  // Filter for direct coverage
  const directSupporting = supportingItems.filter((e) => e.coverage === "direct" && e.relation === "supports");

  // Check freshness for T2+
  const isFresh = (item: EvidenceItemInput): boolean => {
    if (!item.occurredAt) return true; // if unstated, assume within window or pending inspection
    const itemDate = new Date(item.occurredAt);
    const monthsDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
    return monthsDiff <= recencyWindowMonths;
  };

  const freshDirectT2Plus = directSupporting.filter(
    (e) => TIER_ORDINAL[e.tier] >= TIER_ORDINAL["T2"] && isFresh(e)
  );

  // Condition 1: >= 1 fresh direct-coverage evidence at T2+
  if (freshDirectT2Plus.length >= 1) {
    const uniqueSources = new Set(freshDirectT2Plus.map((e) => e.sourceId));
    return {
      state: "ESTABLISHED",
      derivationVersion: CURRENT_DERIVATION_VERSION,
      inputEvidenceIds: freshDirectT2Plus.map((e) => e.id),
      explanation: `Established via ${freshDirectT2Plus.length} direct T2+ evidence item(s) across ${uniqueSources.size} source(s).`,
      qualifyingEvidenceCount: freshDirectT2Plus.length,
      independentSourcesCount: uniqueSources.size,
      conflictingEvidenceIds: [],
      hasValidationAttempt: false,
    };
  }

  // Condition 2: Direct-coverage T1+ evidence from >= 2 independent sources
  const directT1Plus = directSupporting.filter((e) => TIER_ORDINAL[e.tier] >= TIER_ORDINAL["T1"]);
  const independentT1Sources = new Set(directT1Plus.map((e) => e.sourceId));

  if (independentT1Sources.size >= 2) {
    return {
      state: "ESTABLISHED",
      derivationVersion: CURRENT_DERIVATION_VERSION,
      inputEvidenceIds: directT1Plus.map((e) => e.id),
      explanation: `Established via direct referenced evidence across ${independentT1Sources.size} independent sources.`,
      qualifyingEvidenceCount: directT1Plus.length,
      independentSourcesCount: independentT1Sources.size,
      conflictingEvidenceIds: [],
      hasValidationAttempt: false,
    };
  }

  // 6. Otherwise PARTIAL (adjacent coverage, dated T2+, or single-source T0/T1)
  const allUniqueSources = new Set(supportingItems.map((e) => e.sourceId));
  let partialReason = "Direct evidence is limited to a single referenced source or self-reported claim.";
  if (supportingItems.some((e) => e.coverage === "adjacent")) {
    partialReason = "Evidence provides adjacent capability coverage; direct implementation requires validation.";
  } else if (directSupporting.some((e) => !isFresh(e))) {
    partialReason = "Direct evidence exists but occurred outside the active recency window.";
  }

  return {
    state: "PARTIAL",
    derivationVersion: CURRENT_DERIVATION_VERSION,
    inputEvidenceIds: supportingItems.map((e) => e.id),
    explanation: partialReason,
    qualifyingEvidenceCount: supportingItems.length,
    independentSourcesCount: allUniqueSources.size,
    conflictingEvidenceIds: [],
    hasValidationAttempt: false,
  };
}

export const derive = deriveRequirementState;
