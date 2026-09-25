/**
 * VALIDATION PLANNER ("NEXT BEST EVIDENCE") (PART 5.9 & PART 5.10)
 * 
 * Rule-based validation planner.
 * Determines the lowest-effort validation method set that resolves open core requirements
 * (states: UNKNOWN, PARTIAL, CONFLICTING).
 * 
 * Guardrail (PART 5.10):
 * Every generated task must reference (requirement_id, open_assessment_id) it resolves.
 * Ownership tasks: explain / modify / debug / extend on candidate's submitted project.
 */

export interface ValidationMethodCatalogItem {
  methodId: string;
  name: string;
  description: string;
  resolvesTypes: ("unknown_core" | "partial_core" | "conflicting_evidence" | "ownership_verification")[];
  candidateMinutes: number;
  recruiterMinutes: number;
  elapsedHours: number;
}

export const VALIDATION_METHOD_CATALOG: ValidationMethodCatalogItem[] = [
  {
    methodId: "targeted_interview_probe",
    name: "Targeted Technical Probe",
    description: "Structured 20-minute interview discussion probing trade-offs, architecture decisions, and system constraints.",
    resolvesTypes: ["unknown_core", "partial_core"],
    candidateMinutes: 20,
    recruiterMinutes: 20,
    elapsedHours: 24,
  },
  {
    methodId: "ownership_modification_exercise",
    name: "Project Ownership & Modification Task",
    description: "Explain, debug, or extend a feature on the candidate's own submitted project to verify authorship and depth.",
    resolvesTypes: ["ownership_verification", "partial_core"],
    candidateMinutes: 30,
    recruiterMinutes: 15,
    elapsedHours: 24,
  },
  {
    methodId: "focused_work_sample",
    name: "Focused Practical Work Sample",
    description: "Self-paced mini-task in an isolated sandbox implementing or refactoring a core module.",
    resolvesTypes: ["unknown_core"],
    candidateMinutes: 45,
    recruiterMinutes: 15,
    elapsedHours: 48,
  },
  {
    methodId: "conflict_resolution_audit",
    name: "Evidence Reconciliation Review",
    description: "Targeted review of conflicting dates, claims, or telemetry to resolve discrepancies with the candidate.",
    resolvesTypes: ["conflicting_evidence"],
    candidateMinutes: 15,
    recruiterMinutes: 15,
    elapsedHours: 24,
  },
];

export interface PlannedValidationTask {
  taskId: string;
  requirementId: string;
  requirementName: string;
  openAssessmentId: string;
  methodId: string;
  methodName: string;
  taskType: "explain" | "modify" | "debug" | "extend" | "defend_tradeoffs";
  promptOrScenario: string;
  rubric: {
    criterion: string;
    whatStrongProofLooksLike: string;
    whatInadequateProofLooksLike: string;
  }[];
  candidateMinutes: number;
  recruiterMinutes: number;
  status: "proposed" | "accepted" | "in_progress" | "completed" | "rejected";
}

export interface ValidationPlan {
  planId: string;
  candidateId: string;
  roleId: string;
  tasks: PlannedValidationTask[];
  totalCandidateMinutes: number;
  totalRecruiterMinutes: number;
  resolvesRequirementsCount: number;
  resolvedRequirementNames: string[];
  effortSummary: string;
  isRecruiterEditable: boolean;
}

export interface OpenAssessmentTarget {
  requirementId: string;
  requirementName: string;
  state: "UNKNOWN" | "PARTIAL" | "CONFLICTING";
  assessmentId: string;
  candidateProjectName?: string;
  candidateProjectTech?: string[];
}

/**
 * Plans the Next Best Evidence to resolve open core uncertainties.
 */
export function planNextBestEvidence(params: {
  candidateId: string;
  roleId: string;
  openAssessments: OpenAssessmentTarget[];
}): ValidationPlan {
  const { candidateId, roleId, openAssessments } = params;
  const tasks: PlannedValidationTask[] = [];

  for (let i = 0; i < openAssessments.length; i++) {
    const target = openAssessments[i];
    const taskId = `val-task-${Date.now().toString(36)}-${i + 1}`;

    if (target.state === "CONFLICTING") {
      tasks.push({
        taskId,
        requirementId: target.requirementId,
        requirementName: target.requirementName,
        openAssessmentId: target.assessmentId,
        methodId: "conflict_resolution_audit",
        methodName: "Evidence Reconciliation Review",
        taskType: "defend_tradeoffs",
        promptOrScenario: `Review discrepancy regarding ${target.requirementName} with candidate. Candidate explains context and timeline.`,
        rubric: [
          {
            criterion: "Timeline & Responsibility Clarity",
            whatStrongProofLooksLike: "Candidate articulates exact individual scope and resolves discrepancy with specific artifacts.",
            whatInadequateProofLooksLike: "Vague or contradictory explanations without factual backing.",
          },
        ],
        candidateMinutes: 15,
        recruiterMinutes: 15,
        status: "proposed",
      });
      continue;
    }

    if (target.state === "PARTIAL" && target.candidateProjectName) {
      // Ownership Task on Candidate's own submitted project
      tasks.push({
        taskId,
        requirementId: target.requirementId,
        requirementName: target.requirementName,
        openAssessmentId: target.assessmentId,
        methodId: "ownership_modification_exercise",
        methodName: "Project Ownership & Modification Task",
        taskType: "modify",
        promptOrScenario: `In your project "${target.candidateProjectName}", explain the concurrency/state management pattern and outline how you would extend it to satisfy ${target.requirementName}.`,
        rubric: [
          {
            criterion: "Architectural Authorship & Deep Ownership",
            whatStrongProofLooksLike: "Candidate instantly locates code components, explains internal design choices, and defends trade-offs.",
            whatInadequateProofLooksLike: "Candidate struggles to navigate codebase or describe component interactions.",
          },
        ],
        candidateMinutes: 30,
        recruiterMinutes: 15,
        status: "proposed",
      });
      continue;
    }

    // Default: Targeted technical probe for UNKNOWN core requirement
    tasks.push({
      taskId,
      requirementId: target.requirementId,
      requirementName: target.requirementName,
      openAssessmentId: target.assessmentId,
      methodId: "targeted_interview_probe",
      methodName: "Targeted Technical Probe",
      taskType: "defend_tradeoffs",
      promptOrScenario: `Evaluate hands-on capability for ${target.requirementName}: "Walk me through how you implement and debug ${target.requirementName} in production. What failure modes have you observed?"`,
      rubric: [
        {
          criterion: "Practical Operational Proficiency",
          whatStrongProofLooksLike: "Describes real production constraints, telemetry, edge cases, and recovery strategies.",
          whatInadequateProofLooksLike: "Recites textbook definitions without real debugging or failure experience.",
        },
      ],
      candidateMinutes: 20,
      recruiterMinutes: 20,
      status: "proposed",
    });
  }

  const totalCandidateMinutes = tasks.reduce((sum, t) => sum + t.candidateMinutes, 0);
  const totalRecruiterMinutes = tasks.reduce((sum, t) => sum + t.recruiterMinutes, 0);
  const resolvedRequirementNames = tasks.map((t) => t.requirementName);

  return {
    planId: `plan-${candidateId}-${roleId}`,
    candidateId,
    roleId,
    tasks,
    totalCandidateMinutes,
    totalRecruiterMinutes,
    resolvesRequirementsCount: tasks.length,
    resolvedRequirementNames,
    effortSummary: `Resolves ${tasks.length} open requirement${tasks.length === 1 ? "" : "s"} · Candidate: ${totalCandidateMinutes}m · Recruiter: ${totalRecruiterMinutes}m`,
    isRecruiterEditable: true,
  };
}
