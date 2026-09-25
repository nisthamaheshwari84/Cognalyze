/**
 * CENTRAL COPY & LANGUAGE CONTRACT (Part 2.5)
 * 
 * Owns all evidence-status phrasing across UI and generated text.
 * Strictly enforces truthfulness, neutrality, provenance-grounding, and fairness.
 * 
 * BANNED:
 * - Negative capability claims without validation: "Candidate does not know X", "lacks skill Y"
 * - Accusations of dishonesty: "lied", "dishonest", "fraud", "fake candidate"
 * - AI predictions of human worth: "will be a great employee", "AI predicts success", "perfect fit"
 * - Intelligence/personality judgments: "highly intelligent", "smart", "lazy", "low culture fit"
 * 
 * REQUIRED:
 * - Neutral evidence-grounded phrasing:
 *   - "Capability is not sufficiently established from the available evidence."
 *   - "The available evidence does not currently establish this claim."
 *   - "Relevant capability is established; remaining uncertainty concerns X."
 */

export type RequirementState =
  | "ESTABLISHED"
  | "PARTIAL"
  | "UNKNOWN"
  | "CONFLICTING"
  | "NOT_ESTABLISHED_AFTER_VALIDATION"
  | "NOT_APPLICABLE";

export type EvidenceTier = "T0" | "T1" | "T2" | "T3" | "T4";

export interface RequirementPhrasingParams {
  requirementName: string;
  state: RequirementState;
  evidenceCount?: number;
  sourceCount?: number;
  validationDate?: string;
  uncertaintyAspect?: string;
}

export const BANNED_PHRASES: readonly RegExp[] = [
  /does not know/i,
  /lacks skill/i,
  /has no knowledge of/i,
  /candidate lied/i,
  /is dishonest/i,
  /fake candidate/i,
  /fraudulent claim/i,
  /will be a great employee/i,
  /ai predicts success/i,
  /ai recommends hire/i,
  /candidate is highly intelligent/i,
  /candidate is smart/i,
  /low culture fit/i,
  /disqualified service company/i,
];

/**
 * Format status label and glyph for UI display.
 * Never uses color alone: returns both label, glyph, and accessible description.
 */
export function getRequirementStatusDescriptor(state: RequirementState): {
  state: RequirementState;
  label: string;
  glyph: string;
  shortDescription: string;
  badgeClass: string;
} {
  switch (state) {
    case "ESTABLISHED":
      return {
        state,
        label: "Established",
        glyph: "●",
        shortDescription: "Sufficient qualifying direct evidence exists.",
        badgeClass: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
      };
    case "PARTIAL":
      return {
        state,
        label: "Partial Evidence",
        glyph: "◐",
        shortDescription: "Relevant evidence exists with adjacent coverage or pending recency/depth check.",
        badgeClass: "text-amber-400 bg-amber-950/40 border-amber-500/30",
      };
    case "UNKNOWN":
      return {
        state,
        label: "Unknown",
        glyph: "○",
        shortDescription: "No qualifying evidence currently available.",
        badgeClass: "text-slate-400 bg-slate-900/50 border-slate-700/40",
      };
    case "CONFLICTING":
      return {
        state,
        label: "Conflicting Evidence",
        glyph: "⊗",
        shortDescription: "Contradicting evidence items require human review.",
        badgeClass: "text-rose-400 bg-rose-950/40 border-rose-500/30",
      };
    case "NOT_ESTABLISHED_AFTER_VALIDATION":
      return {
        state,
        label: "Not Established in Validation",
        glyph: "⊘",
        shortDescription: "Structured validation against rubric did not establish the requirement.",
        badgeClass: "text-orange-400 bg-orange-950/40 border-orange-500/30",
      };
    case "NOT_APPLICABLE":
      return {
        state,
        label: "Not Applicable",
        glyph: "—",
        shortDescription: "Waived or dismissed by recruiter for this role.",
        badgeClass: "text-neutral-500 bg-neutral-900/30 border-neutral-800",
      };
  }
}

/**
 * Deterministically formats the statement for a requirement state adhering to the language contract.
 */
export function formatRequirementStatement(params: RequirementPhrasingParams): string {
  const { requirementName, state, evidenceCount = 0, sourceCount = 0, validationDate, uncertaintyAspect } = params;

  switch (state) {
    case "ESTABLISHED":
      if (evidenceCount > 0 && sourceCount > 0) {
        return `${requirementName} capability is established from ${evidenceCount} verified item${evidenceCount === 1 ? "" : "s"} across ${sourceCount} independent source${sourceCount === 1 ? "" : "s"}.`;
      }
      return `${requirementName} capability is established from qualifying verified evidence.`;

    case "PARTIAL":
      if (uncertaintyAspect) {
        return `${requirementName} evidence is partially documented; remaining uncertainty concerns ${uncertaintyAspect}.`;
      }
      return `${requirementName} capability is partially evidenced; additional validation is needed for complete direct coverage.`;

    case "UNKNOWN":
      return `${requirementName} capability is not established from the available evidence.`;

    case "CONFLICTING":
      return `Available evidence regarding ${requirementName} contains contradictory records that require human review.`;

    case "NOT_ESTABLISHED_AFTER_VALIDATION":
      if (validationDate) {
        return `${requirementName} capability was not established during structured validation on ${validationDate}. Additional evidence may be submitted.`;
      }
      return `${requirementName} capability was not established during structured validation. Additional evidence may be submitted.`;

    case "NOT_APPLICABLE":
      return `${requirementName} has been waived or marked not applicable by the hiring team.`;
  }
}

/**
 * Format claim validation notice without accusing the candidate.
 */
export function formatClaimNotice(claimText: string, reason: string): string {
  return `The available evidence does not currently establish the claim "${claimText}". Validation detail: ${reason}.`;
}

/**
 * Format trajectory statement without grading personality or potential.
 */
export function formatComplexityTrajectory(projectCount: number): string {
  if (projectCount >= 3) {
    return "Available project evidence shows increasing technical complexity over time across documented systems.";
  }
  return "Available project evidence documents foundational technical implementations.";
}

/**
 * Format organizational learning headline with mandatory sample size disclosure.
 */
export function formatLearningLoopStatus(completedHiresCount: number, minimumRequired: number = 20): {
  isGated: boolean;
  message: string;
  caveat: string;
} {
  if (completedHiresCount < minimumRequired) {
    return {
      isGated: true,
      message: `Not enough completed hires yet (${completedHiresCount} of ${minimumRequired}).`,
      caveat: "Statistical patterns require minimum cohort volume to prevent spurious correlation.",
    };
  }
  return {
    isGated: false,
    message: `Observational patterns derived from ${completedHiresCount} completed 90-day hire reviews.`,
    caveat: "Observational only: reflects historical hiring outcomes for this organization; subject to survivorship selection.",
  };
}

/**
 * Validates text against the language contract.
 * Returns an array of violations (empty array means valid).
 */
export function validateLanguageContract(text: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const regex of BANNED_PHRASES) {
    const match = text.match(regex);
    if (match) {
      violations.push(`Found banned phrase pattern: "${match[0]}"`);
    }
  }
  return {
    valid: violations.length === 0,
    violations,
  };
}
