/**
 * PIPELINE STAGES & ATTENTION RULES (PART 8)
 * 
 * Screen: Pipeline — "What requires your attention?"
 * 
 * Stages:
 * Open role -> Applicants -> Screened -> Deep review -> Interview -> Finalists -> Hired
 * 
 * Non-Negotiable Contract S2:
 * Every number on screen comes from a database query. No static funnel numbers.
 * Attention items come from defined deterministic rules. Max ~6 primary numbers on page.
 */

export type PipelineStage =
  | "open_role"
  | "applicants"
  | "screened"
  | "deep_review"
  | "interview"
  | "finalists"
  | "hired";

export interface PipelineStageMetric {
  stage: PipelineStage;
  label: string;
  count: number;
  attentionLine: string;
  primaryActionLabel: string;
  primaryActionUrl: string;
  urgency: "normal" | "attention_needed" | "immediate_action";
}

export interface CandidatePipelineRecord {
  id: string;
  fullName: string;
  stage: PipelineStage;
  hasUnresolvedConflict?: boolean;
  hasPendingValidationReview?: boolean;
  hasUnplannedCoreUnknown?: boolean;
  hasPendingDecision?: boolean;
}

/**
 * Computes exact pipeline stage metrics and actionable attention items directly from candidate rows.
 */
export function computePipelineStages(
  candidates: CandidatePipelineRecord[],
  openRolesCount = 1
): PipelineStageMetric[] {
  const stageCounts: Record<PipelineStage, number> = {
    open_role: openRolesCount,
    applicants: 0,
    screened: 0,
    deep_review: 0,
    interview: 0,
    finalists: 0,
    hired: 0,
  };

  for (const c of candidates) {
    if (stageCounts[c.stage] !== undefined) {
      stageCounts[c.stage]++;
    }
  }

  // Attention rules calculation
  const conflictsCount = candidates.filter((c) => c.hasUnresolvedConflict).length;
  const pendingValidationCount = candidates.filter((c) => c.hasPendingValidationReview).length;
  const unplannedUnknowns = candidates.filter((c) => c.stage === "deep_review" && c.hasUnplannedCoreUnknown).length;
  const pendingDecisions = candidates.filter((c) => c.stage === "finalists" && c.hasPendingDecision).length;

  return [
    {
      stage: "open_role",
      label: "Open Roles",
      count: openRolesCount,
      attentionLine: openRolesCount > 0 ? "Role requirements and JD review active." : "No active roles.",
      primaryActionLabel: "Review Roles",
      primaryActionUrl: "/recruiter/roles",
      urgency: "normal",
    },
    {
      stage: "applicants",
      label: "Applicants",
      count: stageCounts.applicants,
      attentionLine: stageCounts.applicants > 0 ? `${stageCounts.applicants} unverified applicant resumes pending intake.` : "Queue empty. All applicants screened.",
      primaryActionLabel: "Start Screening",
      primaryActionUrl: "/recruiter/candidates?stage=applicants",
      urgency: stageCounts.applicants > 0 ? "attention_needed" : "normal",
    },
    {
      stage: "screened",
      label: "Screened",
      count: stageCounts.screened,
      attentionLine: conflictsCount > 0
        ? `⚠️ ${conflictsCount} candidate${conflictsCount === 1 ? "" : "s"} have conflicting evidence links requiring review.`
        : "Evidence extraction and baseline comparator complete.",
      primaryActionLabel: "View Candidates",
      primaryActionUrl: "/recruiter/candidates?stage=screened",
      urgency: conflictsCount > 0 ? "immediate_action" : "normal",
    },
    {
      stage: "deep_review",
      label: "Deep Review",
      count: stageCounts.deep_review,
      attentionLine: unplannedUnknowns > 0
        ? `${unplannedUnknowns} candidate${unplannedUnknowns === 1 ? "" : "s"} have core requirements UNKNOWN with no validation plan.`
        : "Profiles prioritized by core established capabilities.",
      primaryActionLabel: "Plan Validations",
      primaryActionUrl: "/recruiter/candidates?stage=deep_review",
      urgency: unplannedUnknowns > 0 ? "attention_needed" : "normal",
    },
    {
      stage: "interview",
      label: "Interview",
      count: stageCounts.interview,
      attentionLine: pendingValidationCount > 0
        ? `📋 ${pendingValidationCount} completed validation session${pendingValidationCount === 1 ? "" : "s"} awaiting rubric review.`
        : "Adaptive validation sessions underway.",
      primaryActionLabel: "Conduct Session",
      primaryActionUrl: "/recruiter/interviews",
      urgency: pendingValidationCount > 0 ? "immediate_action" : "normal",
    },
    {
      stage: "finalists",
      label: "Finalists",
      count: stageCounts.finalists,
      attentionLine: pendingDecisions > 0
        ? `${pendingDecisions} finalist${pendingDecisions === 1 ? "" : "s"} ready for recorded human decision.`
        : "Evidence packets assembled.",
      primaryActionLabel: "Make Decisions",
      primaryActionUrl: "/recruiter/decision-room",
      urgency: pendingDecisions > 0 ? "immediate_action" : "normal",
    },
    {
      stage: "hired",
      label: "Hired",
      count: stageCounts.hired,
      attentionLine: stageCounts.hired > 0
        ? `${stageCounts.hired} completed hire${stageCounts.hired === 1 ? "" : "s"}. 30/60/90 outcome checkpoints scheduled.`
        : "No hires recorded yet for this cohort.",
      primaryActionLabel: "View Outcomes",
      primaryActionUrl: "/recruiter/quality-of-hire",
      urgency: "normal",
    },
  ];
}
