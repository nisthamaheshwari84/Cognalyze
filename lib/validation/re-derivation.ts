/**
 * VALIDATION RESULT RECORDING & RE-DERIVATION LOOP (PART 5.2 & Phase 5)
 * 
 * Closes the loop:
 * Validation result -> New Evidence (T3/T4) -> Re-derive Assessment -> State changes deterministically.
 */

import { deriveRequirementState, DerivationResult, EvidenceItemInput, ValidationResultInput } from "@/lib/evidence/derive";

export interface RecordValidationParams {
  taskId: string;
  requirementId: string;
  candidateId: string;
  evaluatorId: string;
  tier: "T3" | "T4";
  established: boolean;
  evaluatorNotes: string;
  existingEvidence: EvidenceItemInput[];
  existingValidations?: ValidationResultInput[];
  now?: Date;
}

export interface ReDerivationResponse {
  newEvidenceItem?: EvidenceItemInput;
  updatedAssessment: DerivationResult;
  previousState?: string;
  newState: string;
  loopClosed: boolean;
}

/**
 * Records the human observation/task outcome, generates the new T3/T4 evidence item,
 * and re-derives the requirement state.
 */
export function recordValidationResultAndReDerive(params: RecordValidationParams): ReDerivationResponse {
  const {
    taskId,
    requirementId,
    candidateId,
    tier,
    established,
    evaluatorNotes,
    existingEvidence,
    existingValidations = [],
    now = new Date(),
  } = params;

  // 1. Create the Validation Result record
  const newValidation: ValidationResultInput = {
    taskId,
    requirementId,
    tier,
    established,
    evaluatedAt: now.toISOString(),
    evaluatorNotes,
  };

  const allValidations = [newValidation, ...existingValidations];
  let updatedEvidence = [...existingEvidence];
  let newEvidenceItem: EvidenceItemInput | undefined;

  // 2. If established, create a new verified T3/T4 evidence item
  if (established) {
    newEvidenceItem = {
      id: `ev-val-${taskId}`,
      sourceId: `src-val-${tier.toLowerCase()}-${candidateId}`,
      tier,
      coverage: "direct",
      relation: "supports",
      occurredAt: now.toISOString(),
      observedAt: now.toISOString(),
      isConflictResolved: true,
    };
    updatedEvidence.push(newEvidenceItem);
  }

  // 3. Re-derive assessment deterministically
  const updatedAssessment = deriveRequirementState(requirementId, updatedEvidence, allValidations, {
    now,
  });

  return {
    newEvidenceItem,
    updatedAssessment,
    newState: updatedAssessment.state,
    loopClosed: true,
  };
}
