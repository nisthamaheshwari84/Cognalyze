/**
 * TALENT RECOVERY & CANDIDATE RECYCLING ENGINE (Phase 11)
 * 
 * Triggered when a candidate is rejected for a specific role (e.g. Senior Distributed Lead).
 * Instead of discarding talent, the engine maps the candidate's verified Candidate DNA
 * against all other open Role DNAs in the organization and recommends high-compatibility matches.
 */

import { RoleDNA } from "./role-dna";
import { CandidateDNA } from "./evidence-graph";

export interface RecoveredRoleMatch {
  targetRoleId: string;
  targetRoleTitle: string;
  department: string;
  compatibilityScore: number; // 0-100
  strongSkillsTransferred: string[];
  remainingGaps: string[];
  recommendationNarrative: string;
  directRoutingAction: string;
}

export interface TalentRecoveryResult {
  candidateId: string;
  candidateName: string;
  rejectedFromRoleId: string;
  rejectedFromRoleTitle: string;
  eligibleAlternativeRolesCount: number;
  recoveredMatches: RecoveredRoleMatch[];
}

/**
 * Recovers rejected candidate by computing cross-role competency transfer against all other open Role DNAs
 */
export function evaluateTalentRecovery(
  candidateDna: CandidateDNA,
  rejectedRoleId: string,
  allOpenRoles: RoleDNA[]
): TalentRecoveryResult {
  const rejectedRole = allOpenRoles.find(r => r.id === rejectedRoleId);
  const otherRoles = allOpenRoles.filter(r => r.id !== rejectedRoleId && r.status === "active");

  const matches: RecoveredRoleMatch[] = [];

  // Extract candidate's verified capabilities and evidence tokens
  const knownNodes = candidateDna.evidenceGraph.filter(n => n.uncertaintyStatus === "known" || n.uncertaintyStatus === "partially_known");
  const candidateStrengthTokens = new Set<string>();

  for (const node of knownNodes) {
    const tokens = node.requirementName.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    tokens.forEach(t => candidateStrengthTokens.add(t));
    if (node.claim) {
      node.claim.toLowerCase().split(/\W+/).filter(t => t.length > 3).forEach(t => candidateStrengthTokens.add(t));
    }
  }

  // Also include hidden talents
  for (const ht of candidateDna.hiddenTalents || []) {
    ht.competency.toLowerCase().split(/\W+/).filter(t => t.length > 2).forEach(t => candidateStrengthTokens.add(t));
  }

  for (const altRole of otherRoles) {
    const strongTransferred: string[] = [];
    const remainingGaps: string[] = [];
    let weightedScoreSum = 0;

    for (const req of altRole.tieredRequirements) {
      const reqTokens = req.name.toLowerCase().split(/\W+/).filter(t => t.length > 2);
      const matchesToken = reqTokens.some(t => candidateStrengthTokens.has(t));

      // Check if candidate has directly matching or transferable skill
      if (matchesToken) {
        strongTransferred.push(req.name);
        weightedScoreSum += req.weightPct;
      } else {
        remainingGaps.push(`${req.name} (${req.tier})`);
        // If trainable, give partial baseline
        if (req.tier === "Trainable") {
          weightedScoreSum += (req.weightPct * 0.7);
        }
      }
    }

    // Blend with growth velocity
    const baseCompatibility = Math.round(weightedScoreSum);
    const compatibilityScore = Math.min(95, Math.max(30, Math.round((baseCompatibility * 0.7) + (candidateDna.growthVelocityScore * 0.3))));

    if (compatibilityScore >= 50 || strongTransferred.length >= 1) {
      const narrative = `While disqualified for ${rejectedRole?.title || "original role"} due to specialized constraints, ${candidateDna.name} demonstrates strong verified capabilities in ${strongTransferred.slice(0, 2).join(" & ") || "engineering core fundamentals"}, making them an exceptional fit for ${altRole.title}.`;

      matches.push({
        targetRoleId: altRole.id,
        targetRoleTitle: altRole.title,
        department: altRole.department,
        compatibilityScore,
        strongSkillsTransferred: strongTransferred.length > 0 ? strongTransferred : ["Software Engineering Fundamentals", "System Problem Solving"],
        remainingGaps,
        recommendationNarrative: narrative,
        directRoutingAction: `Route candidate dossier directly to hiring manager for ${altRole.title}`
      });
    }
  }

  // Sort by highest compatibility score
  matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return {
    candidateId: candidateDna.candidateId,
    candidateName: candidateDna.name,
    rejectedFromRoleId: rejectedRoleId,
    rejectedFromRoleTitle: rejectedRole?.title || "Original Role",
    eligibleAlternativeRolesCount: matches.length,
    recoveredMatches: matches
  };
}
