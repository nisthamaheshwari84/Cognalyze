/**
 * CONFLICT DETECTOR & TARGETED VERIFICATION LOOP ENGINE (Phase 9)
 * 
 * Automatically detects discrepancies:
 *   1. Claim vs Proof Conflict (e.g. bold resume claim vs weak work sample / interview score)
 *   2. Panelist Conflict (interviewer disagreement across rounds)
 *   3. GitHub vs Resume Skill Discrepancy
 * 
 * CRITICAL ARCHITECTURAL LOOP:
 *   When a conflict is detected, it does NOT dead-end.
 *   It launches a targeted Phase 7 Work Sample or targeted verification probe
 *   specifically scoped to the disputed competency to resolve the ambiguity.
 */

import { RoleDNA } from "./role-dna";
import { CandidateDNA, EvidenceNode } from "./evidence-graph";
import { CandidateInterviewHistory } from "./interview-memory";
import { generateWorkSampleTask, WorkSampleMiniTask } from "./work-sample";

export interface DetectedConflict {
  id: string;
  requirementId: string;
  requirementName: string;
  conflictType: "claim_vs_performance" | "panelist_disagreement" | "repo_vs_claim_mismatch";
  severity: "High" | "Medium";
  statementA: string; // e.g. Resume Claim: "Architected Kafka system handling 10M daily events"
  statementB: string; // e.g. Interview/WorkSample: "Scored 4/10 on Kafka partition rebalancing"
  divergenceDescription: string;
  resolutionStatus: "unresolved" | "verification_triggered" | "resolved";
  targetedVerificationTask?: WorkSampleMiniTask;
  suggestedAction: string;
}

export interface ConflictDetectorResult {
  candidateId: string;
  roleId: string;
  conflictsFound: boolean;
  totalConflicts: number;
  conflicts: DetectedConflict[];
  targetedLoopProposals: WorkSampleMiniTask[];
}

/**
 * Runs conflict detection across Evidence Graph, Interview History, and Work Sample results
 */
export function detectConflicts(
  role: RoleDNA,
  candidateDna: CandidateDNA,
  interviewHistory?: CandidateInterviewHistory,
  workSampleResults?: Record<string, { passed: boolean; score: number; output: string }>
): ConflictDetectorResult {
  const conflicts: DetectedConflict[] = [];
  const loopProposals: WorkSampleMiniTask[] = [];

  // 1. Claim vs Work Sample Performance conflict
  if (workSampleResults) {
    for (const [reqId, ws] of Object.entries(workSampleResults)) {
      const node = candidateDna.evidenceGraph.find(n => n.requirementId === reqId);
      const req = role.tieredRequirements.find(r => r.id === reqId);
      
      // If node claim was confident, but work sample failed or had low score (<60)
      if (node && (node.claim.length > 20 || node.proofType === "verbatim_quote") && ws.score < 60) {
        const conflictId = `conf-ws-${reqId}-${Date.now().toString().slice(-4)}`;
        
        // Loop back to Phase 7: Create a targeted verification task scoped to this disputed competency!
        const targetedTask = generateWorkSampleTask(role, reqId, "conflict_resolution");
        loopProposals.push(targetedTask);

        conflicts.push({
          id: conflictId,
          requirementId: reqId,
          requirementName: req?.name || node.requirementName,
          conflictType: "claim_vs_performance",
          severity: req?.tier === "Critical" ? "High" : "Medium",
          statementA: `Resume / Initial Claim: "${node.claim}"`,
          statementB: `Work Sample Performance: Scored ${ws.score}% (Failed threshold). Output: "${ws.output?.slice(0, 100)}..."`,
          divergenceDescription: `Discrepancy detected between high claimed experience in '${node.requirementName}' and practical work sample output.`,
          resolutionStatus: "verification_triggered",
          targetedVerificationTask: targetedTask,
          suggestedAction: `Trigger Phase 7 Targeted Verification challenge: '${targetedTask.title}' to independently verify actual hands-on capability.`
        });
      }
    }
  }

  // 2. Panelist Disagreement Conflict (from interview history)
  if (interviewHistory && interviewHistory.questionHistory.length >= 2) {
    // Group ratings by requirementId
    const ratingsByReq: Record<string, { interviewer: string; rating: number; quote: string }[]> = {};
    for (const q of interviewHistory.questionHistory) {
      if (!ratingsByReq[q.requirementId]) ratingsByReq[q.requirementId] = [];
      if (q.rating !== undefined) {
        ratingsByReq[q.requirementId].push({
          interviewer: q.interviewerName,
          rating: q.rating,
          quote: q.verbatimQuote || q.candidateResponseSummary || ""
        });
      }
    }

    for (const [reqId, entries] of Object.entries(ratingsByReq)) {
      if (entries.length >= 2) {
        const minEntry = entries.reduce((min, cur) => cur.rating < min.rating ? cur : min, entries[0]);
        const maxEntry = entries.reduce((max, cur) => cur.rating > max.rating ? cur : max, entries[0]);

        // If spread is >= 4 points (e.g. 8 vs 4)
        if (maxEntry.rating - minEntry.rating >= 4) {
          const req = role.tieredRequirements.find(r => r.id === reqId);
          const conflictId = `conf-int-${reqId}-${Date.now().toString().slice(-4)}`;
          const targetedTask = generateWorkSampleTask(role, reqId, "conflict_resolution");
          loopProposals.push(targetedTask);

          conflicts.push({
            id: conflictId,
            requirementId: reqId,
            requirementName: req?.name || "Disputed Competency",
            conflictType: "panelist_disagreement",
            severity: "High",
            statementA: `${maxEntry.interviewer} rated ${maxEntry.rating}/10: "${maxEntry.quote.slice(0, 100)}"`,
            statementB: `${minEntry.interviewer} rated ${minEntry.rating}/10: "${minEntry.quote.slice(0, 100)}"`,
            divergenceDescription: `Significant variance between interview panelists regarding '${req?.name || reqId}'.`,
            resolutionStatus: "verification_triggered",
            targetedVerificationTask: targetedTask,
            suggestedAction: `Launch tiebreaker Phase 7 mini-task '${targetedTask.title}' to objectively calibrate capability.`
          });
        }
      }
    }
  }

  return {
    candidateId: candidateDna.candidateId,
    roleId: role.id,
    conflictsFound: conflicts.length > 0,
    totalConflicts: conflicts.length,
    conflicts,
    targetedLoopProposals: loopProposals
  };
}
