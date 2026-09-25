/**
 * FEATURE FLAGS SYSTEM (Phase 1 Foundation)
 * 
 * Enables safe, progressive rollout of Evidence Operating System modules
 * behind feature flags while preserving existing routes.
 */

export interface FeatureFlags {
  evidence_operating_system: boolean;
  blind_review_mode: boolean;
  candidate_feedback_disclosure: boolean;
  durable_bulk_screening: boolean;
  adaptive_interview_tasks: boolean;
  gated_learning_loop: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  evidence_operating_system: true,
  blind_review_mode: false,
  candidate_feedback_disclosure: false,
  durable_bulk_screening: true,
  adaptive_interview_tasks: true,
  gated_learning_loop: true,
};

export function getFeatureFlag(flag: keyof FeatureFlags): boolean {
  // Check process.env override (e.g. NEXT_PUBLIC_FF_BLIND_REVIEW_MODE=true)
  const envKey = `NEXT_PUBLIC_FF_${flag.toUpperCase()}`;
  if (typeof process !== "undefined" && process.env && process.env[envKey] !== undefined) {
    return process.env[envKey] === "true" || process.env[envKey] === "1";
  }
  return DEFAULT_FLAGS[flag] ?? false;
}

export function getAllFeatureFlags(): FeatureFlags {
  return {
    evidence_operating_system: getFeatureFlag("evidence_operating_system"),
    blind_review_mode: getFeatureFlag("blind_review_mode"),
    candidate_feedback_disclosure: getFeatureFlag("candidate_feedback_disclosure"),
    durable_bulk_screening: getFeatureFlag("durable_bulk_screening"),
    adaptive_interview_tasks: getFeatureFlag("adaptive_interview_tasks"),
    gated_learning_loop: getFeatureFlag("gated_learning_loop"),
  };
}
