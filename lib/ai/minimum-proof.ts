/**
 * ROLE <-> CANDIDATE MATCH ENGINE & MINIMUM PROOF ENGINE (Phase 5 & Phase 6)
 * 
 * Computes:
 *   1. Explicit 3-way Evidence Split:
 *      - Strong: Verified work, code commit, or passed work sample (known)
 *      - Partial: Mentioned in resume, coursework, or unverified claim (partially_known)
 *      - Unknown: No verifiable signal present in dossier (unknown)
 *   2. Minimum Proof Engine:
 *      - Solves for the minimal set of verification questions or mini-tasks
 *        needed to resolve decision uncertainty.
 *      - STRICT PRIORITIZATION RULE: Critical-tier unknowns ALWAYS come first
 *        before Important-tier, which come before Preferred/Trainable.
 */

import { RoleDNA, TieredRequirement } from "./role-dna";
import { CandidateDNA, EvidenceNode } from "./evidence-graph";

export interface EvidenceSplitItem {
  requirementId: string;
  name: string;
  tier: "Critical" | "Important" | "Preferred" | "Trainable";
  category: string;
  weightPct: number;
  dealBreaker: boolean;
  status: "Strong" | "Partial" | "Unknown";
  proofLocation: string;
  verbatimSnippet: string | null;
  confidence: number;
}

export interface MatchEngineResult {
  roleId: string;
  candidateId: string;
  matchScore: number; // 0-100
  overallVerdict: "Strong Fit" | "Conditional / Verification Needed" | "High Uncertainty Gap" | "Misaligned";
  decisionReadiness: "Ready for Decision Room" | "Needs Targeted Verification";
  evidenceSplit: {
    strong: EvidenceSplitItem[];
    partial: EvidenceSplitItem[];
    unknown: EvidenceSplitItem[];
  };
  coverageSummary: {
    criticalCoveragePct: number;
    importantCoveragePct: number;
    overallCoveragePct: number;
  };
}

export interface VerificationProbeProposal {
  priorityRank: number;
  requirementId: string;
  requirementName: string;
  tier: "Critical" | "Important" | "Preferred" | "Trainable";
  gapSeverity: "Critical Dealbreaker" | "Important Core Competency" | "Secondary Preference" | "Trainable";
  recommendedMethod: "work_sample" | "code_execution" | "targeted_interview" | "portfolio_audit" | "behavioral_probe";
  estimatedMinutesToVerify: number;
  rationale: string;
  proposedTaskOrQuestion: string;
  uncertaintyReductionImpact: number; // 0-100 impact on reducing decision risk
}

export interface MinimumProofPlan {
  candidateId: string;
  roleId: string;
  currentUncertaintyRatio: number;
  criticalGapsRemaining: number;
  trainableGapsCount: number;
  minimalActionsCount: number;
  totalTimeEstimateMinutes: number;
  proposals: VerificationProbeProposal[];
  prioritizationIntegrityCheck: {
    criticalPrioritizedFirst: boolean;
    explanation: string;
  };
}

/**
 * Computes Role ↔ Candidate Match and the explicit 3-way Strong/Partial/Unknown evidence split (Phase 5)
 */
export function computeRoleCandidateMatch(
  role: RoleDNA,
  candidateDna: CandidateDNA
): MatchEngineResult {
  const strong: EvidenceSplitItem[] = [];
  const partial: EvidenceSplitItem[] = [];
  const unknown: EvidenceSplitItem[] = [];

  for (const req of role.tieredRequirements) {
    const node = candidateDna.evidenceGraph.find(n => n.requirementId === req.id);
    const status = node?.uncertaintyStatus === "known"
      ? "Strong"
      : node?.uncertaintyStatus === "partially_known"
      ? "Partial"
      : "Unknown";

    const item: EvidenceSplitItem = {
      requirementId: req.id,
      name: req.name,
      tier: req.tier,
      category: req.category,
      weightPct: req.weightPct,
      dealBreaker: req.dealBreakerIfMissing,
      status,
      proofLocation: node?.proofLocation || "None",
      verbatimSnippet: node?.verbatimProof || null,
      confidence: node?.confidenceScore || 0
    };

    if (status === "Strong") strong.push(item);
    else if (status === "Partial") partial.push(item);
    else unknown.push(item);
  }

  // Calculate coverage
  const criticalReqs = role.tieredRequirements.filter(r => r.tier === "Critical");
  const importantReqs = role.tieredRequirements.filter(r => r.tier === "Important");

  const strongIds = new Set(strong.map(s => s.requirementId));
  const partialIds = new Set(partial.map(p => p.requirementId));

  const criticalScore = criticalReqs.reduce((sum, r) => {
    if (strongIds.has(r.id)) return sum + 1.0;
    if (partialIds.has(r.id)) return sum + 0.5;
    return sum;
  }, 0);
  const criticalCoveragePct = criticalReqs.length > 0 ? Math.round((criticalScore / criticalReqs.length) * 100) : 100;

  const importantScore = importantReqs.reduce((sum, r) => {
    if (strongIds.has(r.id)) return sum + 1.0;
    if (partialIds.has(r.id)) return sum + 0.5;
    return sum;
  }, 0);
  const importantCoveragePct = importantReqs.length > 0 ? Math.round((importantScore / importantReqs.length) * 100) : 100;

  const matchScore = candidateDna.overallScore;

  let overallVerdict: MatchEngineResult["overallVerdict"] = "Strong Fit";
  let decisionReadiness: MatchEngineResult["decisionReadiness"] = "Ready for Decision Room";

  const hasCriticalUnknown = unknown.some(u => u.tier === "Critical");

  if (hasCriticalUnknown || criticalCoveragePct < 70) {
    overallVerdict = "Conditional / Verification Needed";
    decisionReadiness = "Needs Targeted Verification";
  } else if (matchScore < 50) {
    overallVerdict = "High Uncertainty Gap";
    decisionReadiness = "Needs Targeted Verification";
  } else if (matchScore < 65) {
    overallVerdict = "Conditional / Verification Needed";
    decisionReadiness = "Needs Targeted Verification";
  }

  return {
    roleId: role.id,
    candidateId: candidateDna.candidateId,
    matchScore,
    overallVerdict,
    decisionReadiness,
    evidenceSplit: {
      strong,
      partial,
      unknown
    },
    coverageSummary: {
      criticalCoveragePct,
      importantCoveragePct,
      overallCoveragePct: matchScore
    }
  };
}

/**
 * Minimum Proof Engine (Phase 6):
 * Computes the smallest set of verification probes to resolve decision uncertainty.
 * Rigorously enforces: Critical > Important > Preferred > Trainable.
 */
export function generateMinimumProofPlan(
  role: RoleDNA,
  candidateDna: CandidateDNA
): MinimumProofPlan {
  const match = computeRoleCandidateMatch(role, candidateDna);
  const gaps = [...match.evidenceSplit.unknown, ...match.evidenceSplit.partial];

  // Tier prioritization weights
  const tierOrder: Record<string, number> = {
    Critical: 1,
    Important: 2,
    Preferred: 3,
    Trainable: 4
  };

  // Sort strictly by: 1) Tier priority (Critical first), 2) Dealbreaker status, 3) Unknown before Partial, 4) Weight
  const sortedGaps = [...gaps].sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;

    if (a.dealBreaker && !b.dealBreaker) return -1;
    if (!a.dealBreaker && b.dealBreaker) return 1;

    if (a.status === "Unknown" && b.status === "Partial") return -1;
    if (a.status === "Partial" && b.status === "Unknown") return 1;

    return b.weightPct - a.weightPct;
  });

  const proposals: VerificationProbeProposal[] = sortedGaps.map((gap, index) => {
    const reqDef = role.tieredRequirements.find(r => r.id === gap.requirementId);
    const method = reqDef?.verificationMethod || "work_sample";
    
    let taskOrQuestion = "";
    let timeEst = 30;

    if (gap.tier === "Critical") {
      timeEst = 45;
      taskOrQuestion = `Mini-Work Sample: Design & explain a fault-tolerant scenario for ${gap.name}. Trace edge cases, concurrency hazards, and recovery mechanics.`;
    } else if (gap.tier === "Important") {
      timeEst = 20;
      taskOrQuestion = `Precision Interview Probe: Walk through your production setup for ${gap.name}. What metrics did you monitor and what failure modes occurred?`;
    } else if (gap.tier === "Trainable") {
      timeEst = 10;
      taskOrQuestion = `Learning Capacity Screen: Given a starter repo with ${gap.name}, assess ability to complete an onboarding tutorial and write a unit test.`;
    } else {
      timeEst = 15;
      taskOrQuestion = `Behavioral Alignment Question: How have you leveraged ${gap.name} to accelerate team velocity in previous projects?`;
    }

    const impact = gap.tier === "Critical" ? 45 : gap.tier === "Important" ? 25 : gap.tier === "Preferred" ? 15 : 5;

    return {
      priorityRank: index + 1,
      requirementId: gap.requirementId,
      requirementName: gap.name,
      tier: gap.tier,
      gapSeverity: gap.tier === "Critical" 
        ? "Critical Dealbreaker" 
        : gap.tier === "Important" 
        ? "Important Core Competency" 
        : gap.tier === "Trainable" 
        ? "Trainable" 
        : "Secondary Preference",
      recommendedMethod: method,
      estimatedMinutesToVerify: timeEst,
      rationale: `Requirement is in tier '${gap.tier}' with status '${gap.status}'. Resolving this directly impacts ${gap.weightPct}% of role weighting.`,
      proposedTaskOrQuestion: taskOrQuestion,
      uncertaintyReductionImpact: impact
    };
  });

  // Verify that Critical is indeed before Trainable
  const firstCriticalIndex = proposals.findIndex(p => p.tier === "Critical");
  const firstTrainableIndex = proposals.findIndex(p => p.tier === "Trainable");
  const criticalPrioritizedFirst = (firstCriticalIndex === -1 && firstTrainableIndex === -1) ||
    (firstCriticalIndex !== -1 && (firstTrainableIndex === -1 || firstCriticalIndex < firstTrainableIndex));

  const totalTime = proposals.slice(0, 3).reduce((acc, p) => acc + p.estimatedMinutesToVerify, 0);

  return {
    candidateId: candidateDna.candidateId,
    roleId: role.id,
    currentUncertaintyRatio: candidateDna.uncertaintySummary.overallUncertaintyRatio,
    criticalGapsRemaining: proposals.filter(p => p.tier === "Critical").length,
    trainableGapsCount: proposals.filter(p => p.tier === "Trainable").length,
    minimalActionsCount: Math.min(3, proposals.length),
    totalTimeEstimateMinutes: totalTime,
    proposals,
    prioritizationIntegrityCheck: {
      criticalPrioritizedFirst,
      explanation: criticalPrioritizedFirst
        ? "Minimum Proof Engine successfully prioritized Critical dealbreakers before Trainable skills."
        : "Warning: Prioritization violation detected."
    }
  };
}
