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
  EvidenceStrengthLevel,
  EvidenceType,
  RejectedEvidenceItem,
  RequirementEvaluationRecord,
  RequirementEvidenceMatch,
  VerificationStatus,
} from './types';
import { canonicalizeSkill, matchTokenWithBoundaries, validateOntologyRelationship } from './ontology';
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

      const hasDirectWord = reqNames.some((name) => matchTokenWithBoundaries(eviText, name));

      const techMatch = evi.technologies.some((t) => {
        const tc = canonicalizeSkill(t);
        return tc && reqCanonical && tc.key === reqCanonical.key;
      });

      const alternativeMatch = Boolean(
        req.requirement_logic === 'OR' &&
        req.alternatives?.some((alt) => {
          const altNode = canonicalizeSkill(alt);
          const altNames = [alt.toLowerCase(), ...(altNode ? [altNode.canonicalName.toLowerCase()] : [])];
          return (
            altNames.some((name) => matchTokenWithBoundaries(eviText, name)) ||
            evi.technologies.some((t) => {
              const tc = canonicalizeSkill(t);
              return tc && altNode && tc.key === altNode.key;
            })
          );
        })
      );

      // Check for passive or in-progress learning phrases (Section 8 & Test 10)
      const isLearningOrPassive =
        /\b(currently learning|in the process of learning|actively learning|beginner in|exploring|interested in|familiarity with|familiar with|exposed to|awareness of)\b/i.test(lowerEvi) ||
        (/\blearning\b/i.test(lowerEvi) && !/\b(machine|deep|reinforcement|federated|transfer)\s+learning\b/i.test(lowerEvi));

      if (hasDirectWord || techMatch || ontResult.isDirect || alternativeMatch) {
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
        } else if (evi.section === 'EDUCATION' || evi.evidence_type === 'EDUCATION') {
          // Education section: Academic degree or coursework mention -> CLAIM_ONLY, never direct implementation
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'CLAIM_ONLY',
            verificationStatus: 'SELF_CLAIM',
            confidence: 0.45,
            reason: `Mentioned in academic curriculum/degree: "${evi.verbatim_quote.slice(0, 100)}"; practical project or production implementation is not established.`,
            supports: [req.normalized_requirement],
            doesNotProve: ['verified_implementation', 'production_experience', 'hands_on_project'],
          });
        } else if (evi.evidence_type === 'INTERNSHIP' || evi.evidence_type === 'EMPLOYMENT') {
          // Role or internship title heading without detailed implementation bullets -> CLAIM_ONLY
          matchedEvidenceList.push({
            evidence: evi,
            relationship: 'CLAIM_ONLY',
            verificationStatus: 'SELF_CLAIM',
            confidence: 0.50,
            reason: `Mentioned in role/internship title without detailed technical implementation bullets.`,
            supports: [req.normalized_requirement],
            doesNotProve: ['verified_implementation', 'production_experience', 'hands_on_project'],
          });
        } else if (
          (evi.section === 'PROJECTS' || evi.section === 'EXPERIENCE' || evi.section === 'INTERNSHIPS') &&
          (evi.evidence_type === 'DIRECT_IMPLEMENTATION' || evi.evidence_type === 'PROJECT_USAGE')
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
            relationship: 'CLAIM_ONLY',
            verificationStatus: 'SELF_CLAIM',
            confidence: 0.50,
            reason: `Mentioned in ${evi.section.toLowerCase()} without specific implementation bullets: "${evi.verbatim_quote.slice(0, 100)}..."`,
            supports: [req.normalized_requirement],
            doesNotProve: ['verified_implementation', 'production_experience', 'hands_on_project'],
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

    // Check ledger for externally verified signals
    if (ledger) {
      const ledgerEv = ledger.getAllEvidence().filter((le) =>
        le.supports.some((s) => s.toLowerCase() === req.normalized_requirement.toLowerCase()) ||
        req.synonyms.some((syn) => le.supports.some((s) => s.toLowerCase() === syn.toLowerCase()))
      );
      for (const le of ledgerEv) {
        if (le.verification_status === 'EXTERNALLY_VERIFIED' || le.verification_status === 'CROSS_SOURCE_VERIFIED') {
          matchedEvidenceList.unshift({
            evidence: {
              id: le.evidence_id,
              evidence_id: le.evidence_id,
              canonical_evidence_id: le.evidence_id,
              type: 'repo_source',
              evidence_type: 'DIRECT_IMPLEMENTATION',
              section: 'OPEN_SOURCE',
              title: 'Verified External Repository',
              text: le.original_text,
              technologies: le.supports,
              source_location: { section: 'OPEN_SOURCE', item: 'GitHub' },
              verbatim_quote: le.original_text,
              source_url: le.source_url,
              verification_status: le.verification_status,
              checks_performed: le.checks_performed,
            },
            relationship: 'DIRECT',
            verificationStatus: le.verification_status,
            confidence: 0.98,
            reason: `Independently verified in inspected external repository: ${le.observed_fact}`,
            supports: le.supports,
            doesNotProve: le.does_not_prove,
          });
        }
      }
    }

    // 5-Level Evidence Strength Classification (Phases 3, 4, 5)
    let finalStatus: EvidenceStatus = 'MISSING';
    let finalRelationship: EvidenceRelationship = 'NO_EVIDENCE';
    let finalConfidence = 0.0;
    let finalReasoning = '';
    let actionableRec = '';
    let finalVerifStatus: VerificationStatus = 'NOT_EVIDENCED';
    let finalEvidenceStrength: EvidenceStrength = 'NONE';
    let finalEvidenceType: EvidenceType = 'NO_EVIDENCE';
    let finalEvidenceLevel: EvidenceStrengthLevel = 'LEVEL_0_NO_EVIDENCE';
    let evidenceContribution = 0.0;
    let relevanceFactor = 1.0;

    const directItems = matchedEvidenceList.filter((m) => m.relationship === 'DIRECT');
    const claimOnlyItems = matchedEvidenceList.filter((m) => m.relationship === 'CLAIM_ONLY');
    const indirectItems = matchedEvidenceList.filter((m) => m.relationship === 'INDIRECT');

    if (directItems.length > 0) {
      const topDirect = directItems[0];
      const isExternallyVerified = topDirect.verificationStatus === 'EXTERNALLY_VERIFIED' || topDirect.verificationStatus === 'CROSS_SOURCE_VERIFIED';
      const hasArtifact = Boolean(
        (topDirect.evidence.source_url && (topDirect.evidence.source_url.startsWith('http') || topDirect.evidence.source_url.includes('github.com'))) ||
        topDirect.evidence.checks_performed?.some((c) =>
          c.result === 'PASSED' &&
          (c.check.includes('Repository') || c.check.includes('File tree') || c.check.includes('Live URL') || c.check.includes('Dependency manifest'))
        )
      );

      // Evidence Deduplication: Multi-skill chain without dedicated action verb is Contextual (0.35), not Implementation (0.65)
      const quote = topDirect.evidence.text;
      const isMultiSkillChain = (topDirect.evidence.technologies.length >= 4) &&
        !new RegExp(`(implemented|architected|modeled|deployed|configured|built|developed|optimized)\\s+[^.]*${req.normalized_requirement}`, 'i').test(quote);

      if (isExternallyVerified) {
        finalEvidenceLevel = 'LEVEL_5_INDEPENDENTLY_VERIFIED';
        evidenceContribution = 1.00;
        finalStatus = 'SUPPORTED';
        finalRelationship = 'DIRECT';
        finalConfidence = 0.98;
        finalVerifStatus = topDirect.verificationStatus;
        finalEvidenceType = 'DIRECT_IMPLEMENTATION';
        finalEvidenceStrength = 'DIRECT';
        finalReasoning = `${req.normalized_requirement} is independently verified through external code inspection or corroborated assessment artifacts.`;
        actionableRec = `Verified competency. Be prepared to explain technical implementation decisions and architectural edge cases in interviews.`;
      } else if (isMultiSkillChain) {
        finalEvidenceLevel = 'LEVEL_2_CONTEXTUAL';
        evidenceContribution = 0.35;
        finalStatus = 'PARTIAL';
        finalRelationship = 'PARTIAL';
        finalConfidence = 0.55;
        finalVerifStatus = 'PARTIAL';
        finalEvidenceType = 'PROJECT_USAGE';
        finalEvidenceStrength = 'MODERATE';
        finalReasoning = `${req.normalized_requirement} is mentioned as part of a multi-technology project stack in ${topDirect.evidence.title}, but individual implementation depth is not established.`;
        actionableRec = `Elaborate on your specific engineering contribution and architectural choices using ${req.normalized_requirement}.`;
      } else if (hasArtifact) {
        finalEvidenceLevel = 'LEVEL_4_ARTIFACT_BACKED';
        evidenceContribution = 0.85;
        finalStatus = 'SUPPORTED';
        finalRelationship = 'DIRECT';
        finalConfidence = 0.90;
        finalVerifStatus = 'RESUME_SUPPORTED';
        finalEvidenceType = topDirect.evidence.evidence_type || 'DIRECT_IMPLEMENTATION';
        finalEvidenceStrength = 'STRONG';
        finalReasoning = `${req.normalized_requirement} is supported by artifact-backed evidence with verifiable source references in ${topDirect.evidence.title || topDirect.evidence.section}.`;
        actionableRec = `Ensure your repository or deployment remains accessible for recruiter inspection.`;
      } else {
        finalEvidenceLevel = 'LEVEL_3_IMPLEMENTATION';
        evidenceContribution = 0.65;
        finalStatus = 'SUPPORTED';
        finalRelationship = 'DIRECT';
        finalConfidence = 0.80;
        finalVerifStatus = 'RESUME_SUPPORTED';
        finalEvidenceType = topDirect.evidence.evidence_type || 'DIRECT_IMPLEMENTATION';
        finalEvidenceStrength = 'STRONG';
        finalReasoning = `${req.normalized_requirement} is supported by direct implementation evidence in ${topDirect.evidence.title || topDirect.evidence.section}: "${topDirect.evidence.verbatim_quote.slice(0, 100)}..."`;
        actionableRec = `Ensure you can discuss technical implementation tradeoffs, data flow, and architecture in interview discussions.`;
      }

      // Relevance factor: 1.00 for professional experience, 0.95 for personal projects
      relevanceFactor = topDirect.evidence.section === 'PROJECTS' ? 0.95 : 1.00;
    } else if (indirectItems.length > 0) {
      finalEvidenceLevel = 'LEVEL_2_CONTEXTUAL';
      evidenceContribution = 0.35;
      finalStatus = 'PARTIAL';
      finalRelationship = 'PARTIAL';
      finalConfidence = 0.40;
      finalVerifStatus = 'PARTIAL';
      finalEvidenceType = 'INDIRECT_CONTEXT';
      finalEvidenceStrength = 'MODERATE';
      finalReasoning = `${req.normalized_requirement} has related contextual evidence, but specific direct implementation is not explicitly documented.`;
      actionableRec = `Clarify how your related background connects to ${req.normalized_requirement}, or document specific tools used.`;
    } else if (claimOnlyItems.length > 0) {
      finalEvidenceLevel = 'LEVEL_1_MENTIONED';
      evidenceContribution = 0.10;
      finalStatus = 'CLAIM_ONLY';
      finalRelationship = 'CLAIM_ONLY';
      finalConfidence = 0.45;
      finalVerifStatus = 'SELF_CLAIM';
      const topClaim = claimOnlyItems[0];
      finalEvidenceType = topClaim.evidence.evidence_type || 'SKILL_LIST';
      finalEvidenceStrength = 'WEAK';
      finalReasoning = `${req.normalized_requirement} is listed in skills or summary, but implementation is not demonstrated.`;
      actionableRec = `Add a specific project bullet or GitHub repository demonstrating practical application of ${req.normalized_requirement} to move from claimed to demonstrated.`;
    } else {
      finalEvidenceLevel = 'LEVEL_0_NO_EVIDENCE';
      evidenceContribution = 0.00;
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

    // Gate 5: Non-equivalence tracking
    const nonEquivalenceApplied = rejectedEvidenceList.some((r) =>
      /do(es)? not (prove|establish|identify)/i.test(r.reason) ||
      /non-equivalence|boundary|profile link/i.test(r.reason)
    );

    // Gate 5: Limitations derivation based on specificity & evidence level
    const limitations: string[] = [];
    if (finalEvidenceLevel === 'LEVEL_5_INDEPENDENTLY_VERIFIED') {
      // No fundamental limitations when independently verified in AST/source
    } else if (finalEvidenceLevel === 'LEVEL_4_ARTIFACT_BACKED') {
      limitations.push('External repository present but source AST deep verification pending');
    } else if (finalEvidenceLevel === 'LEVEL_3_IMPLEMENTATION') {
      limitations.push('Ownership is not independently established through external commit history');
      limitations.push('Production-scale reliability is not independently demonstrated');
    } else if (finalEvidenceLevel === 'LEVEL_2_CONTEXTUAL') {
      limitations.push('Implementation depth is not isolated from surrounding technology stack');
      limitations.push('Production-scale ownership not demonstrated');
    } else if (finalEvidenceLevel === 'LEVEL_1_MENTIONED') {
      limitations.push('Candidate-reported claim only without project or work implementation evidence');
      limitations.push('Demonstrable competency cannot be established from skills list');
    } else {
      limitations.push('No supporting evidence found in submitted resume or linked profiles');
    }

    if (nonEquivalenceApplied) {
      limitations.push('Evidence rejected due to non-equivalence or domain boundary violation');
    }

    // Gate 5: Demonstrable Level Requirement Enforcement
    let demonstrableCheckPassed = true;
    if (req.demonstrableLevelRequired === 'hands_on_project') {
      const hasHandsOn = (
        finalEvidenceLevel === 'LEVEL_3_IMPLEMENTATION' ||
        finalEvidenceLevel === 'LEVEL_4_ARTIFACT_BACKED' ||
        finalEvidenceLevel === 'LEVEL_5_INDEPENDENTLY_VERIFIED'
      );
      if (!hasHandsOn) {
        demonstrableCheckPassed = false;
        limitations.unshift('Demonstrable hands-on project requirement not satisfied by self-reported mention or contextual evidence.');
        if (finalStatus === 'SUPPORTED') {
          finalStatus = 'PARTIAL';
          evidenceContribution = 0.35;
        }
      }
    } else if (req.demonstrableLevelRequired === 'production_scale') {
      const hasProduction = (
        finalEvidenceLevel === 'LEVEL_5_INDEPENDENTLY_VERIFIED' ||
        (directItems.length > 0 && directItems.some((d) => d.evidence.section === 'EXPERIENCE' || d.evidence.section === 'INTERNSHIPS'))
      );
      if (!hasProduction) {
        demonstrableCheckPassed = false;
        limitations.unshift('Production-scale implementation required by role, but candidate evidence is limited to personal projects or self-claim.');
        if (finalStatus === 'SUPPORTED') {
          finalStatus = 'PARTIAL';
          evidenceContribution = 0.35;
        }
      }
    } else if (req.demonstrableLevelRequired === 'knowledge') {
      demonstrableCheckPassed = finalEvidenceLevel !== 'LEVEL_0_NO_EVIDENCE';
      if (!demonstrableCheckPassed) {
        limitations.unshift('Fundamental knowledge requirement unevidenced.');
      }
    }

    // Gate 5: Review Required determination
    const isCriticalDeficiency = (req.priority === 'CRITICAL' && finalStatus !== 'SUPPORTED');
    const isImportantDeficiency = (req.priority === 'IMPORTANT' && finalStatus !== 'SUPPORTED');
    const isLowConfidence = ((req.priority === 'CRITICAL' || req.priority === 'IMPORTANT') && finalConfidence < 0.65);
    const hasUnresolvedNonEquivalence = nonEquivalenceApplied && matchedEvidenceList.length === 0;
    const reviewRequired = Boolean(
      isCriticalDeficiency ||
      isImportantDeficiency ||
      !demonstrableCheckPassed ||
      isLowConfidence ||
      hasUnresolvedNonEquivalence ||
      (finalStatus as string) === 'CONTRADICTED' ||
      (finalRelationship as string) === 'CONTRADICTED'
    );

    // Gate 5: Supporting reason synthesis
    let supportingReason = finalReasoning;
    if (finalStatus === 'SUPPORTED') {
      supportingReason = finalEvidenceLevel === 'LEVEL_5_INDEPENDENTLY_VERIFIED'
        ? `Independently verified implementation found for ${req.normalized_requirement}.`
        : `Demonstrated implementation present in candidate experience or projects for ${req.normalized_requirement}.`;
    } else if (finalStatus === 'PARTIAL') {
      supportingReason = `Partial or contextual evidence identified for ${req.normalized_requirement}, but full standalone implementation is unverified.`;
    } else if (finalStatus === 'CLAIM_ONLY') {
      supportingReason = `${req.normalized_requirement} is stated as a self-reported claim without demonstrable implementation evidence.`;
    } else if (finalStatus === 'EVIDENCE_GAP' || finalStatus === 'MISSING') {
      supportingReason = `No verifiable evidence found in candidate materials for ${req.normalized_requirement}.`;
    }

    // Check alternative satisfaction for OR requirements
    let acceptedAlt: string | undefined = undefined;
    let alternativeSatisfied = false;
    if (req.requirement_logic === 'OR' && req.alternatives) {
      for (const alt of req.alternatives) {
        const altNode = canonicalizeSkill(alt);
        const altNames = [alt.toLowerCase(), ...(altNode ? [altNode.canonicalName.toLowerCase()] : [])];
        const hasAltEvidence = matchedEvidenceList.some(
          (m) =>
            altNames.some((n) => matchTokenWithBoundaries(m.evidence.text, n)) ||
            m.evidence.technologies.some((t) => t.toLowerCase() === alt.toLowerCase() || (altNode && t.toLowerCase() === altNode.canonicalName.toLowerCase()))
        );
        if (hasAltEvidence) {
          acceptedAlt = alt;
          alternativeSatisfied = true;
          break;
        }
      }
      if (acceptedAlt) {
        finalReasoning = `Alternative qualification (${req.normalized_requirement}) is satisfied via ${acceptedAlt} (${finalStatus.replace(/_/g, ' ')}). Alternative options not chosen are optional and not penalized.`;
        actionableRec = `Demonstrated competency in ${acceptedAlt} satisfies this requirement.`;
      }
    }

    // Map matched evidence IDs preferring evidence_id (e.g. E-001) or id
    const matchedEvidenceIds = matchedEvidenceList.map((m) => m.evidence.evidence_id || m.evidence.id);

    // Deterministic points calculation (Phases 5B, 5C, 5D)
    // Requirement Score = Requirement Weight × Evidence Contribution × Relevance Factor
    const priorityWeights: Record<string, number> = {
      CRITICAL: 6,
      IMPORTANT: 3,
      PREFERRED: 1,
      NICE_TO_HAVE: 1,
    };
    const reqWeight = priorityWeights[req.priority] ?? 3;
    const earnedPoints = Math.round(reqWeight * evidenceContribution * relevanceFactor * 100) / 100;
    const possiblePoints = reqWeight;
    const statusMult = evidenceContribution;

    matches.push({
      requirementId: req.id,
      requirementName: req.normalized_requirement,
      priority: req.priority,
      prioritySourceText: req.priority_source_text,
      relationship: finalRelationship,
      status: finalStatus,
      evidenceStrength: finalEvidenceStrength,
      evidenceStrengthLevel: finalEvidenceLevel,
      evidenceContribution,
      relevanceFactor,
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
      decomposedFrom: req.parent_compound_requirement,
      limitations,
      review_required: reviewRequired,
      supporting_reason: supportingReason,
      demonstrableCheckPassed,
      nonEquivalenceApplied,
      requirement_logic: req.requirement_logic,
      alternative_group_id: req.alternative_group_id,
      alternatives: req.alternatives,
      acceptance_rule: req.acceptance_rule,
      is_alternative: req.is_alternative,
      alternative_satisfied: alternativeSatisfied,
      accepted_alternative: acceptedAlt,
    });
  }

  return matches;
}

/**
 * Builds canonical RequirementEvaluationRecords from matches (Phase 5 / Section 9).
 * Decouples individual requirement evaluation from presentation surfaces.
 */
export function buildRequirementEvaluationRecords(
  matches: RequirementEvidenceMatch[],
  candidateId: string
): RequirementEvaluationRecord[] {
  return matches.map((m) => ({
    requirement_id: m.requirementId,
    candidate_id: candidateId,
    status: m.status === 'PARTIAL' ? 'PARTIALLY_SUPPORTED' : m.status,
    evidence_ids: m.matchedEvidenceIds,
    supporting_reason: m.supporting_reason || m.reasoning,
    limitations: m.limitations || [],
    confidence: m.confidence,
    review_required: m.review_required ?? false,
    demonstrableCheckPassed: m.demonstrableCheckPassed,
    nonEquivalenceApplied: m.nonEquivalenceApplied,
  }));
}
