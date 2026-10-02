/**
 * COGNALYZE RESULT ENGINE — MATCHING ENGINE & EVIDENCE GRAPH
 * Implements strict evidence-first matching, non-equivalence enforcement,
 * and zero-hallucination verification.
 * 
 * CORE LAW: NO EVIDENCE = NO CLAIM
 * Semantic similarity != proof.
 * Python != FastAPI. AI/ML != LLM.
 */

import {
  CanonicalJDRequirement,
  CanonicalResumeEvidence,
  ConfidenceTier,
  EvidenceRelationship,
  EvidenceStatus,
  EvidenceStrength,
  EvidenceType,
  RejectedEvidenceItem,
  RequirementEvidenceMatch,
  VerificationStatus,
} from './types';
import { canonicalizeSkill, validateOntologyRelationship } from './ontology';
import { checkNonEquivalenceViolation } from '@/lib/evidence/non-equivalence';
import { EvidenceLedger } from '@/lib/evidence/evidence-ledger';

/**
 * Builds the canonical evidence graph and maps each requirement to resume evidence.
 */
export function matchRequirementsToEvidence(
  requirements: CanonicalJDRequirement[],
  evidenceItems: CanonicalResumeEvidence[],
  ledger?: EvidenceLedger
): RequirementEvidenceMatch[] {
  const matches: RequirementEvidenceMatch[] = [];

  for (const req of requirements) {
    const reqCanonical = canonicalizeSkill(req.normalized_requirement);
    const rejectedEvidenceList: RejectedEvidenceItem[] = [];

    // Collect candidate evidence items matching this requirement
    const matchedEvidenceList: {
      evidence: CanonicalResumeEvidence;
      relationship: EvidenceRelationship;
      verificationStatus: VerificationStatus;
      confidence: number;
      reason: string;
      supports: string[];
      doesNotProve: string[];
    }[] = [];

    for (const evi of evidenceItems) {
      const eviText = evi.text;
      const lowerEvi = eviText.toLowerCase();

      // Rule 6: GitHub URL is a PROFILE_LINK and must NOT match Git or Version Control
      if (
        (req.normalized_requirement.toLowerCase().includes('git') || reqCanonical?.key === 'git') &&
        evi.evidence_type === 'PROFILE_LINK'
      ) {
        rejectedEvidenceList.push({
          retrievedText: eviText,
          reason: 'A GitHub URL is a profile link; it does not establish Git, Version Control, or Git workflow experience without explicit text evidence.',
          decision: 'REJECTED',
          evidenceId: evi.evidence_id || evi.id,
        });
        continue;
      }

      // 1. HARD NON-EQUIVALENCE GATE
      // Check if this evidence only mentions a broader concept that is non-equivalent
      const violation = checkNonEquivalenceViolation(req.normalized_requirement, eviText);
      if (violation.isViolated) {
        // Record rejected evidence per Section 11
        rejectedEvidenceList.push({
          retrievedText: eviText,
          reason: violation.explanation || `The source describes related activity but does not establish ${req.normalized_requirement}.`,
          decision: 'REJECTED',
          evidenceId: evi.evidence_id || evi.id,
        });
        continue;
      }

      // Check ontology relationship
      const ontResult = reqCanonical
        ? validateOntologyRelationship(reqCanonical.key, eviText)
        : { isDirect: false, isPartial: false, violatesBound: false, reasoning: '' };

      if (ontResult.violatesBound) {
        rejectedEvidenceList.push({
          retrievedText: eviText,
          reason: ontResult.reasoning || `Violates ontology boundaries for ${req.normalized_requirement}.`,
          decision: 'REJECTED',
          evidenceId: evi.evidence_id || evi.id,
        });
        continue;
      }

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

      // Check for passive or in-progress learning phrases (Section 8 & Test 10)
      const isLearningOrPassive =
        /\b(currently learning|in the process of learning|actively learning|beginner in|exploring|interested in|familiarity with|familiar with|exposed to|awareness of)\b/i.test(lowerEvi) ||
        (/\blearning\b/i.test(lowerEvi) && !/\b(machine|deep|reinforcement|federated|transfer)\s+learning\b/i.test(lowerEvi));

      if (hasDirectWord || techMatch || ontResult.isDirect) {
        // Direct match found
        if (isLearningOrPassive) {
          // In-progress learning or passive familiarity is CLAIM_ONLY, never SUPPORTED
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'CLAIM_ONLY',
            verificationStatus: 'SELF_CLAIM',
            confidence: 0.35,
            reason: `${req.normalized_requirement} is stated as in-progress learning or passive familiarity; implementation is not established.`,
            supports: [req.normalized_requirement],
            doesNotProve: ['verified_implementation', 'production_experience'],
          });
        } else if (evi.section === 'SKILLS' || evi.evidence_type === 'SKILL_LIST') {
          // Skills section declaration: CLAIM_ONLY per Section 4 & 5
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'CLAIM_ONLY',
            verificationStatus: 'SELF_CLAIM',
            confidence: 0.50,
            reason: `Directly listed in skills section without project or work implementation evidence.`,
            supports: [req.normalized_requirement],
            doesNotProve: ['verified_implementation', 'production_experience'],
          });
        } else if (evi.section === 'SUMMARY' || evi.evidence_type === 'EXPLICIT_CLAIM') {
          // Summary claim: CLAIM_ONLY per Section 8
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'CLAIM_ONLY',
            verificationStatus: 'SELF_CLAIM',
            confidence: 0.50,
            reason: `Explicitly claimed in professional summary without detailed implementation context.`,
            supports: [req.normalized_requirement],
            doesNotProve: ['verified_implementation', 'production_experience'],
          });
        } else if (
          (evi.section === 'PROJECTS' || evi.section === 'EXPERIENCE' || evi.section === 'INTERNSHIPS') &&
          (evi.evidence_type === 'DIRECT_IMPLEMENTATION' || evi.evidence_type === 'PROJECT_USAGE' || !evi.evidence_type)
        ) {
          // Project or work implementation
          const isExternallyVerified = evi.verification_status === 'EXTERNALLY_VERIFIED' || evi.verification_status === 'CROSS_SOURCE_VERIFIED';
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'DIRECT',
            verificationStatus: isExternallyVerified ? (evi.verification_status || 'EXTERNALLY_VERIFIED') : 'RESUME_SUPPORTED',
            confidence: isExternallyVerified ? 0.98 : 0.90,
            reason: isExternallyVerified
              ? `Implementation independently verified in inspected source code: "${evi.verbatim_quote.slice(0, 100)}..."`
              : `Implementation documented in resume project/experience: "${evi.verbatim_quote.slice(0, 100)}..."`,
            supports: [req.normalized_requirement],
            doesNotProve: evi.does_not_prove || [],
          });
        } else {
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'DIRECT',
            verificationStatus: 'RESUME_SUPPORTED',
            confidence: 0.80,
            reason: `Documented in ${evi.section.toLowerCase()}: "${evi.verbatim_quote.slice(0, 100)}..."`,
            supports: [req.normalized_requirement],
            doesNotProve: evi.does_not_prove || [],
          });
        }
      } else if (ontResult.isPartial) {
        // Genuine sub-component or direct subset (where allowed by ontology)
        matchedEvidenceList.push({
          evidence: evi,
          relationship: 'INDIRECT',
          verificationStatus: 'PARTIAL',
          confidence: 0.40,
          reason: ontResult.reasoning,
          supports: [],
          doesNotProve: [req.normalized_requirement],
        });
      } else {
        // Check if candidate text is partially related (e.g. mentions deployment for AWS) to record as rejected
        if (
          (req.normalized_requirement.toLowerCase() === 'aws' && lowerEvi.includes('deploy')) ||
          (req.normalized_requirement.toLowerCase() === 'postgresql' && lowerEvi.includes('database'))
        ) {
          rejectedEvidenceList.push({
            retrievedText: eviText,
            reason: `The source describes related activity but does not identify ${req.normalized_requirement}.`,
            decision: 'REJECTED',
            evidenceId: evi.evidence_id || evi.id,
          });
        }
      }
    }

    // Determine primary status, relationship, and evidence strength
    let finalStatus: EvidenceStatus = 'MISSING';
    let finalRelationship: EvidenceRelationship = 'NO_EVIDENCE';
    let finalConfidence = 0.0;
    let finalReasoning = '';
    let actionableRec = '';
    let finalVerifStatus: VerificationStatus = 'NOT_EVIDENCED';
    let finalEvidenceStrength: EvidenceStrength = 'NONE';
    let finalEvidenceType: EvidenceType = 'NO_EVIDENCE';

    const directItems = matchedEvidenceList.filter((m) => m.relationship === 'DIRECT');
    const claimOnlyItems = matchedEvidenceList.filter((m) => m.relationship === 'CLAIM_ONLY');
    const indirectItems = matchedEvidenceList.filter((m) => m.relationship === 'INDIRECT');

    if (directItems.length > 0) {
      finalStatus = 'SUPPORTED';
      finalRelationship = 'DIRECT';
      finalConfidence = Math.max(...directItems.map((d) => d.confidence));
      const topDirect = directItems[0];
      finalVerifStatus = topDirect.verificationStatus;
      finalEvidenceType = topDirect.evidence.evidence_type || 'DIRECT_IMPLEMENTATION';
      finalEvidenceStrength = finalEvidenceType === 'DIRECT_IMPLEMENTATION' ? 'DIRECT' : 'STRONG';
      finalReasoning = `${req.normalized_requirement} is supported by direct implementation evidence in ${topDirect.evidence.title || topDirect.evidence.section}.`;
      actionableRec = `Ensure you can discuss technical implementation tradeoffs, data flow, and architecture in interview discussions.`;
    } else if (claimOnlyItems.length > 0) {
      finalStatus = 'CLAIM_ONLY';
      finalRelationship = 'CLAIM_ONLY';
      finalConfidence = 0.45;
      finalVerifStatus = 'SELF_CLAIM';
      const topClaim = claimOnlyItems[0];
      finalEvidenceType = topClaim.evidence.evidence_type || 'SKILL_LIST';
      finalEvidenceStrength = finalEvidenceType === 'EXPLICIT_CLAIM' ? 'MODERATE' : 'WEAK';
      finalReasoning = `${req.normalized_requirement} is claimed in submitted materials, but implementation is not demonstrated.`;
      actionableRec = `Add a specific project bullet or GitHub repository demonstrating practical application of ${req.normalized_requirement} to move from claimed to demonstrated.`;
    } else if (indirectItems.length > 0) {
      finalStatus = 'PARTIAL';
      finalRelationship = 'PARTIAL';
      finalConfidence = 0.40;
      finalVerifStatus = 'PARTIAL';
      finalEvidenceType = 'INDIRECT_CONTEXT';
      finalEvidenceStrength = 'MODERATE';
      finalReasoning = `${req.normalized_requirement} has related contextual evidence, but specific direct implementation is not explicitly documented.`;
      actionableRec = `Clarify how your related background connects to ${req.normalized_requirement}, or document specific tools used.`;
    } else {
      // Zero valid evidence found.
      finalStatus = 'EVIDENCE_GAP';
      finalRelationship = 'NO_EVIDENCE';
      finalConfidence = 0.0;
      finalVerifStatus = 'NOT_EVIDENCED';
      finalEvidenceType = 'NO_EVIDENCE';
      finalEvidenceStrength = 'NONE';
      finalReasoning = `${req.normalized_requirement} is not evidenced in the submitted materials.`;
      actionableRec = `If you have genuine experience with ${req.normalized_requirement}, document the project or implementation. If not, consider building a defensible prototype before claiming it.`;
    }

    // Confidence tier mapping
    let confidenceTier: ConfidenceTier = 'INSUFFICIENT';
    if (finalConfidence >= 0.85) confidenceTier = 'HIGH';
    else if (finalConfidence >= 0.60) confidenceTier = 'HIGH';
    else if (finalConfidence >= 0.40) confidenceTier = 'MEDIUM';
    else if (finalConfidence > 0) confidenceTier = 'LOW';

    // Map matched evidence IDs preferring evidence_id (e.g. E-001) or id
    const matchedEvidenceIds = matchedEvidenceList.map((m) => m.evidence.evidence_id || m.evidence.id);

    // Deterministic points calculation (Section 27 & 28)
    const priorityWeights: Record<string, number> = {
      CRITICAL: 6,
      IMPORTANT: 3,
      PREFERRED: 1,
      NICE_TO_HAVE: 1,
    };
    const reqWeight = priorityWeights[req.priority] ?? 3;

    const statusMultipliers: Record<string, number> = {
      SUPPORTED: 1.0,
      PARTIAL: 0.5,
      CLAIM_ONLY: 0.25,
      EVIDENCE_GAP: 0.0,
      SKILL_GAP: 0.0,
      MISSING: 0.0,
      CONTRADICTED: 0.0,
    };
    const statusMult = statusMultipliers[finalStatus] ?? 0.0;
    const earnedPoints = reqWeight * statusMult;
    const possiblePoints = reqWeight;

    matches.push({
      requirementId: req.id,
      requirementName: req.normalized_requirement,
      priority: req.priority,
      prioritySourceText: req.priority_source_text,
      relationship: finalRelationship,
      status: finalStatus,
      evidenceStrength: finalEvidenceStrength,
      evidenceType: finalEvidenceType,
      confidence: Math.round(finalConfidence * 100) / 100,
      confidenceTier,
      matchedEvidenceIds,
      evidenceQuotes: matchedEvidenceList.map((m) => m.evidence.verbatim_quote),
      reasoning: finalReasoning,
      actionableRecommendation: actionableRec,
      verificationStatus: finalVerifStatus,
      supports: [req.normalized_requirement],
      doesNotProve: matchedEvidenceList.flatMap((m) => m.doesNotProve),
      checksPerformed: matchedEvidenceList.flatMap((m) => m.evidence.checks_performed || []),
      rejectedEvidence: rejectedEvidenceList,
      requirement_weight: reqWeight,
      status_multiplier: statusMult,
      earned_points: earnedPoints,
      possible_points: possiblePoints,
    });
  }

  return matches;
}
