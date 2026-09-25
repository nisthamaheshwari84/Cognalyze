/**
 * COGNALYZE RESULT ENGINE — MATCHING ENGINE & EVIDENCE GRAPH
 * Implements hybrid matching, strict 7-status evidence model, and skill-vs-evidence gap logic.
 */

import {
  CanonicalJDRequirement,
  CanonicalResumeEvidence,
  ConfidenceTier,
  EvidenceRelationship,
  EvidenceStatus,
  RequirementEvidenceMatch,
} from './types';
import { canonicalizeSkill, validateOntologyRelationship } from './ontology';

/**
 * Builds the canonical evidence graph and maps each requirement to resume evidence.
 */
export function matchRequirementsToEvidence(
  requirements: CanonicalJDRequirement[],
  evidenceItems: CanonicalResumeEvidence[]
): RequirementEvidenceMatch[] {
  const matches: RequirementEvidenceMatch[] = [];

  for (const req of requirements) {
    const reqCanonical = canonicalizeSkill(req.normalized_requirement);
    const reqKey = reqCanonical ? reqCanonical.key : req.normalized_requirement.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Collect candidate evidence items matching this requirement
    const matchedEvidenceList: {
      evidence: CanonicalResumeEvidence;
      relationship: EvidenceRelationship;
      confidence: number;
      reason: string;
    }[] = [];

    for (const evi of evidenceItems) {
      const eviText = evi.text;
      const lowerEvi = eviText.toLowerCase();

      // Check ontology relationship
      const ontResult = reqCanonical ? validateOntologyRelationship(reqCanonical.key, eviText) : { isDirect: false, isPartial: false, violatesBound: false, reasoning: '' };

      // Exact or synonym matching
      const reqNames = [
        req.normalized_requirement.toLowerCase(),
        ...req.synonyms.map((s) => s.toLowerCase()),
      ];
      const hasDirectWord = reqNames.some((name) => {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(lowerEvi);
      });

      const techMatch = evi.technologies.some((t) => {
        const tc = canonicalizeSkill(t);
        return tc && reqCanonical && tc.key === reqCanonical.key;
      });

      if (hasDirectWord || techMatch || ontResult.isDirect) {
        // Direct match found
        if (evi.section === 'SKILLS' || evi.section === 'SUMMARY') {
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'CLAIM_ONLY',
            confidence: 0.65,
            reason: `Directly claimed in ${evi.section.toLowerCase()} without implementation details.`,
          });
        } else if (evi.section === 'PROJECTS' || evi.section === 'EXPERIENCE' || evi.section === 'INTERNSHIPS') {
          // Direct project/work implementation
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'DIRECT',
            confidence: 0.95,
            reason: `Direct implementation demonstrated in ${evi.title || 'project'}: "${evi.verbatim_quote.slice(0, 100)}..."`,
          });
        } else {
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'DIRECT',
            confidence: 0.85,
            reason: `Mentioned in ${evi.section.toLowerCase()}: "${evi.verbatim_quote.slice(0, 100)}..."`,
          });
        }
      } else if (ontResult.isPartial || ontResult.violatesBound) {
        // Related or broader concept (e.g. Cloud vs AWS)
        matchedEvidenceList.push({
          evidence: evi,
          relationship: 'INDIRECT',
          confidence: 0.40,
          reason: ontResult.reasoning,
        });
      }
    }

    // Determine primary status, confidence tier, and relationship
    let finalStatus: EvidenceStatus = 'MISSING';
    let finalRelationship: EvidenceRelationship = 'NO_EVIDENCE';
    let finalConfidence = 0.0;
    let finalReasoning = '';
    let actionableRec = '';

    const directItems = matchedEvidenceList.filter((m) => m.relationship === 'DIRECT');
    const claimOnlyItems = matchedEvidenceList.filter((m) => m.relationship === 'CLAIM_ONLY');
    const indirectItems = matchedEvidenceList.filter((m) => m.relationship === 'INDIRECT');

    if (directItems.length > 0) {
      finalStatus = 'SUPPORTED';
      finalRelationship = 'DIRECT';
      finalConfidence = Math.max(...directItems.map((d) => d.confidence));
      const topDirect = directItems[0];
      finalReasoning = `${req.normalized_requirement} is directly supported by ${directItems.length} implementation item(s) (e.g., ${topDirect.evidence.title || topDirect.evidence.section}).`;
      actionableRec = `Ensure you can discuss technical implementation tradeoffs, data flow, and architecture in interview discussions.`;
    } else if (claimOnlyItems.length > 0) {
      finalStatus = 'CLAIM_ONLY';
      finalRelationship = 'CLAIM_ONLY';
      finalConfidence = 0.50;
      finalReasoning = `${req.normalized_requirement} is listed in skills or summary, but lacks supporting project or professional implementation bullets.`;
      actionableRec = `Add a specific project bullet or GitHub repository demonstrating practical application of ${req.normalized_requirement} to move from claimed to demonstrated.`;
    } else if (indirectItems.length > 0) {
      finalStatus = 'PARTIAL';
      finalRelationship = 'PARTIAL';
      finalConfidence = 0.45;
      finalReasoning = `${req.normalized_requirement} has related contextual evidence, but specific tooling or direct implementation is not explicitly documented.`;
      actionableRec = `Clarify how your related background connects to ${req.normalized_requirement}, or document specific tools used.`;
    } else {
      // Zero evidence found.
      // Strict rule: DO NOT classify as SKILL_GAP without contextual evidence.
      // If it's preferred or missing from resume -> EVIDENCE_GAP
      finalStatus = 'EVIDENCE_GAP';
      finalRelationship = 'NO_EVIDENCE';
      finalConfidence = 0.10;
      finalReasoning = `The JD explicitly requires or prefers ${req.normalized_requirement}. Your resume mentions no project, deployment, or implementation evidence for ${req.normalized_requirement}. This is therefore classified as an Evidence Gap, not a confirmed Skill Gap.`;
      actionableRec = `If you have genuine experience with ${req.normalized_requirement}, document the project or implementation. If not, consider building a defensible prototype before claiming it.`;
    }

    // Confidence tier mapping
    let confidenceTier: ConfidenceTier = 'INSUFFICIENT';
    if (finalConfidence >= 0.90) confidenceTier = 'HIGH';
    else if (finalConfidence >= 0.70) confidenceTier = 'HIGH';
    else if (finalConfidence >= 0.50) confidenceTier = 'MEDIUM';
    else if (finalConfidence >= 0.25) confidenceTier = 'LOW';

    matches.push({
      requirementId: req.id,
      requirementName: req.normalized_requirement,
      priority: req.priority,
      relationship: finalRelationship,
      status: finalStatus,
      confidence: Math.round(finalConfidence * 100) / 100,
      confidenceTier,
      matchedEvidenceIds: matchedEvidenceList.map((m) => m.evidence.id),
      evidenceQuotes: matchedEvidenceList.map((m) => m.evidence.verbatim_quote),
      reasoning: finalReasoning,
      actionableRecommendation: actionableRec,
    });
  }

  return matches;
}
