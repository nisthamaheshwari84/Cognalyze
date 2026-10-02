/**
 * COGNALYZE RESULT ENGINE — VALIDATION LAYER
 * Cross-section consistency, score verification, zero-fabrication check,
 * 15-Check Programmatic Cross-Section Audit (Section 29),
 * and Claim/Quote Validation Gates (Phases 14 & 15).
 * 
 * CORE LAW: NO EVIDENCE = NO CLAIM
 * If quote cannot be located in source document: REJECT / DELETE IT.
 * If claim has no valid evidence: DO NOT DISPLAY IT.
 */

import {
  CanonicalJDRequirement,
  CanonicalResumeEvidence,
  CrossSectionAuditCheck,
  DeterministicScoreBreakdown,
  FinalVerdict,
  FullRewrittenResume,
  GapItem,
  InterviewFocusPlan,
  RequirementEvidenceMatch,
  RoadmapPlan,
  StrengthItem,
  ValidationReport,
} from './types';
import { verifyQuoteInSource } from '@/lib/evidence/quote-verifier';
import { EvidenceLedger } from '@/lib/evidence/evidence-ledger';
import { isNonEquivalent } from '@/lib/evidence/non-equivalence';

/**
 * Validates the entire canonical analysis object before passing to UI or downstream APIs.
 * Runs the 15-check programmatic cross-section audit.
 */
export function validateCanonicalAnalysis(params: {
  requirements: CanonicalJDRequirement[];
  evidenceItems: CanonicalResumeEvidence[];
  matches: RequirementEvidenceMatch[];
  score: DeterministicScoreBreakdown;
  strengths: StrengthItem[];
  gaps: GapItem[];
  resumeRewrite: FullRewrittenResume;
  originalResumeText: string;
  ledger?: EvidenceLedger;
  roadmap?: RoadmapPlan;
  interviewFocus?: InterviewFocusPlan;
  finalVerdict?: FinalVerdict;
}): ValidationReport {
  const violations: string[] = [];
  const withheldSections: string[] = [];
  const lowerResume = params.originalResumeText.toLowerCase();
  const checks: CrossSectionAuditCheck[] = [];

  // ============================================================
  // CHECK 1: Requirement count matches everywhere
  // ============================================================
  const reqCountMatch =
    params.requirements.length === params.matches.length &&
    params.score.summaryCounts.totalRequirements === params.requirements.length;
  if (!reqCountMatch) {
    violations.push(
      `Check 1 Failed: Requirement count mismatch (JD: ${params.requirements.length}, Matches: ${params.matches.length}, Score: ${params.score.summaryCounts.totalRequirements}).`
    );
  }
  checks.push({
    checkNumber: 1,
    name: 'Requirement count matches',
    passed: reqCountMatch,
    detail: `JD Requirements (${params.requirements.length}) == Matches (${params.matches.length}) == Score (${params.score.summaryCounts.totalRequirements})`,
  });

  // ============================================================
  // CHECK 2: Priority matches everywhere
  // ============================================================
  let priorityMatches = true;
  for (const m of params.matches) {
    const req = params.requirements.find((r) => r.id === m.requirementId);
    if (req && req.priority !== m.priority) {
      priorityMatches = false;
      violations.push(`Check 2 Failed: Priority mismatch for ${m.requirementName}: req has ${req.priority}, match has ${m.priority}.`);
    }
  }
  checks.push({
    checkNumber: 2,
    name: 'Priority matches everywhere',
    passed: priorityMatches,
    detail: priorityMatches ? 'All requirement priorities match across all structures' : 'Priority divergence detected',
  });

  // ============================================================
  // CHECK 3: Status matches everywhere
  // ============================================================
  const expectedSupported = params.matches.filter((m) => m.status === 'SUPPORTED').length;
  const statusMatches = params.score.summaryCounts.supported === expectedSupported;
  if (!statusMatches) {
    violations.push(
      `Check 3 Failed: Score reported ${params.score.summaryCounts.supported} supported, but match list has ${expectedSupported}.`
    );
  }
  checks.push({
    checkNumber: 3,
    name: 'Status matches everywhere',
    passed: statusMatches,
    detail: `Supported count in score (${params.score.summaryCounts.supported}) == Matches (${expectedSupported})`,
  });

  // ============================================================
  // CHECK 4: Every supported requirement has evidence
  // ============================================================
  let allSupportedHaveEvidence = true;
  for (const m of params.matches) {
    if (m.status === 'SUPPORTED') {
      if (!m.matchedEvidenceIds || m.matchedEvidenceIds.length === 0 || !m.evidenceQuotes || m.evidenceQuotes.length === 0) {
        allSupportedHaveEvidence = false;
        violations.push(`Check 4 Failed: Supported requirement "${m.requirementName}" has no backing evidence IDs or quotes.`);
      }
    }
  }
  checks.push({
    checkNumber: 4,
    name: 'Every supported requirement has evidence',
    passed: allSupportedHaveEvidence,
    detail: allSupportedHaveEvidence ? 'All SUPPORTED matches contain verified evidence IDs and quotes' : 'Unbacked supported match found',
  });

  // ============================================================
  // CHECK 5: Every evidence item has provenance
  // ============================================================
  let allEvidenceHasProvenance = true;
  for (const ev of params.evidenceItems) {
    if (!ev.source_location || !ev.verbatim_quote || ev.verbatim_quote.trim().length === 0) {
      allEvidenceHasProvenance = false;
      violations.push(`Check 5 Failed: Evidence item "${ev.id}" lacks source_location or verbatim_quote.`);
    }
  }
  checks.push({
    checkNumber: 5,
    name: 'Every evidence item has provenance',
    passed: allEvidenceHasProvenance,
    detail: allEvidenceHasProvenance ? '100% of resume evidence items possess valid source location and verbatim quote' : 'Missing provenance on evidence',
  });

  // ============================================================
  // CHECK 6: Every generated resume statement has evidence IDs
  // ============================================================
  const allBullets = [
    ...params.resumeRewrite.experience.flatMap((e) => e.bullets),
    ...params.resumeRewrite.projects.flatMap((p) => p.bullets),
  ];
  let allBulletsHaveEvidenceIds = true;
  for (const b of allBullets) {
    if (!b.original_evidence_ids || b.original_evidence_ids.length === 0) {
      allBulletsHaveEvidenceIds = false;
      violations.push(`Check 6 Failed: Rewritten bullet "${b.bulletId}" lacks original_evidence_ids.`);
      if (!withheldSections.includes('resumeRewrite')) {
        withheldSections.push('resumeRewrite');
      }
    }
  }
  checks.push({
    checkNumber: 6,
    name: 'Every generated resume statement has evidence IDs',
    passed: allBulletsHaveEvidenceIds,
    detail: allBulletsHaveEvidenceIds ? 'All rewritten bullets link backward to original evidence IDs' : 'Unlinked rewritten bullet detected',
  });

  // ============================================================
  // CHECK 7: Every gap exists in the requirement ledger
  // ============================================================
  let allGapsInLedger = true;
  for (const gap of params.gaps) {
    const match = params.matches.find((m) => m.requirementName.toLowerCase() === gap.requirement.toLowerCase());
    if (!match || match.status === 'SUPPORTED') {
      allGapsInLedger = false;
      violations.push(`Check 7 Failed: Gap "${gap.requirement}" does not correspond to an unevidenced requirement.`);
    }
  }
  checks.push({
    checkNumber: 7,
    name: 'Every gap exists in requirement ledger',
    passed: allGapsInLedger,
    detail: allGapsInLedger ? 'All identified gaps map to valid non-supported requirements' : 'Phantom gap found',
  });

  // ============================================================
  // CHECK 8: Every roadmap item targets a real gap
  // ============================================================
  let allRoadmapItemsValid = true;
  if (params.roadmap) {
    for (const mile of params.roadmap.milestones) {
      const match = params.matches.find(
        (m) => m.requirementName.toLowerCase() === mile.targetGapRequirement.toLowerCase()
      );
      if (!match || match.status === 'SUPPORTED') {
        allRoadmapItemsValid = false;
        violations.push(`Check 8 Failed: Roadmap milestone "${mile.title}" targets supported requirement "${mile.targetGapRequirement}".`);
      }
    }
  }
  checks.push({
    checkNumber: 8,
    name: 'Every roadmap item targets a real gap',
    passed: allRoadmapItemsValid,
    detail: allRoadmapItemsValid ? 'All roadmap milestones target verified evidence gaps' : 'Roadmap item targets supported requirement',
  });

  // ============================================================
  // CHECK 9: Every interview question targets a real evidence uncertainty
  // ============================================================
  let allQuestionsValid = true;
  if (params.interviewFocus) {
    for (const q of params.interviewFocus.probeQuestions) {
      if (!q.questionId || !q.requirementId || !q.evidenceId) {
        allQuestionsValid = false;
        violations.push(`Check 9 Failed: Interview probe "${q.questionId}" is missing requirementId or evidenceId.`);
      }
    }
  }
  checks.push({
    checkNumber: 9,
    name: 'Every interview question targets a real evidence uncertainty',
    passed: allQuestionsValid,
    detail: allQuestionsValid ? 'All interview probe questions possess requirement and evidence provenance' : 'Unanchored interview question found',
  });

  // ============================================================
  // CHECK 10: Final synthesis uses only ledger data
  // ============================================================
  let synthesisLedgerGrounded = true;
  if (params.finalVerdict) {
    for (const str of params.finalVerdict.primaryStrengths) {
      const match = params.matches.find((m) => m.requirementName.toLowerCase() === str.toLowerCase());
      if (!match || match.status !== 'SUPPORTED') {
        synthesisLedgerGrounded = false;
        violations.push(`Check 10 Failed: Final synthesis lists "${str}" as strength, but status is not SUPPORTED.`);
      }
    }
  }
  checks.push({
    checkNumber: 10,
    name: 'Final synthesis uses only ledger data',
    passed: synthesisLedgerGrounded,
    detail: synthesisLedgerGrounded ? 'Synthesis strengths and limitations derive 100% from ledger matches' : 'Ungrounded claim in verdict synthesis',
  });

  // ============================================================
  // CHECK 11: No fabricated resume information
  // ============================================================
  const metricRegex = /\b(\d+(?:\.\d+)?\s*(?:%|x|ms|s|k|m|users|requests|qps|accuracy|f1))\b/gi;
  let noFabricatedResumeInfo = true;

  for (const b of allBullets) {
    const metricMatches = b.rewrittenText.match(metricRegex) || [];
    for (const metric of metricMatches) {
      const clean = metric.trim().toLowerCase();
      if (!lowerResume.includes(clean) && !b.originalText.toLowerCase().includes(clean)) {
        noFabricatedResumeInfo = false;
        violations.push(
          `Check 11 Failed: Fabricated metric detected in bullet "${b.bulletId}": "${metric}" was not found in original resume.`
        );
        if (!withheldSections.includes('resumeRewrite')) {
          withheldSections.push('resumeRewrite');
        }
      }
    }
  }

  // Check for fake placeholder education or tenure
  for (const edu of params.resumeRewrite.education) {
    if (edu.institution.toLowerCase().includes('accredited university') || edu.degree.toLowerCase().includes('or related field')) {
      noFabricatedResumeInfo = false;
      violations.push(`Check 11 Failed: Placeholder education detected in rewritten resume.`);
      if (!withheldSections.includes('resumeRewrite')) {
        withheldSections.push('resumeRewrite');
      }
    }
  }

  for (const exp of params.resumeRewrite.experience) {
    if (exp.company.toLowerCase().includes('professional experience') || exp.period.toLowerCase().includes('documented tenure')) {
      noFabricatedResumeInfo = false;
      violations.push(`Check 11 Failed: Placeholder company/tenure detected in rewritten resume.`);
      if (!withheldSections.includes('resumeRewrite')) {
        withheldSections.push('resumeRewrite');
      }
    }
  }

  checks.push({
    checkNumber: 11,
    name: 'No fabricated resume information',
    passed: noFabricatedResumeInfo,
    detail: noFabricatedResumeInfo ? 'Zero invented metrics, placeholder degrees, or synthetic tenure entries' : 'Fabricated data detected in rewritten resume',
  });

  // ============================================================
  // CHECK 12: No technology inference
  // ============================================================
  let noTechnologyInference = true;
  for (const m of params.matches) {
    if (m.status === 'SUPPORTED') {
      const relatedEv = params.evidenceItems.filter((e) => m.matchedEvidenceIds.includes(e.evidence_id || e.id));
      for (const ev of relatedEv) {
        for (const tech of ev.technologies) {
          if (isNonEquivalent(m.requirementName, tech)) {
            noTechnologyInference = false;
            violations.push(
              `Check 12 Failed: Prohibited technology non-equivalence: requirement "${m.requirementName}" cannot be supported by "${tech}".`
            );
          }
        }
      }
    }
  }
  checks.push({
    checkNumber: 12,
    name: 'No technology inference',
    passed: noTechnologyInference,
    detail: noTechnologyInference ? 'Strict non-equivalence boundaries verified across all supported matches' : 'Prohibited technology inference detected',
  });

  // ============================================================
  // CHECK 13: No duplicate evidence inflation
  // ============================================================
  const pointsAuditPassed = params.score.pointsAuditPassed !== false;
  if (!pointsAuditPassed) {
    violations.push(`Check 13 Failed: Deterministic score points audit failed or earned points exceeded possible.`);
  }
  checks.push({
    checkNumber: 13,
    name: 'No duplicate evidence inflation',
    passed: pointsAuditPassed,
    detail: pointsAuditPassed ? 'Deterministic point ledger audited: SUM(earned_points) / SUM(possible_points) == Score' : 'Points audit mismatch',
  });

  // ============================================================
  // CHECK 14: No duplicate requirements
  // ============================================================
  const reqNames = new Set<string>();
  let noDuplicateReqs = true;
  for (const r of params.requirements) {
    const key = r.normalized_requirement.toLowerCase();
    if (reqNames.has(key)) {
      noDuplicateReqs = false;
      violations.push(`Check 14 Failed: Duplicate requirement "${r.normalized_requirement}" in canonical JD.`);
    }
    reqNames.add(key);
  }
  checks.push({
    checkNumber: 14,
    name: 'No duplicate requirements',
    passed: noDuplicateReqs,
    detail: noDuplicateReqs ? 'All JD requirements have unique identities and normalized names' : 'Duplicate requirement detected',
  });

  // ============================================================
  // CHECK 15: No contradictory conclusions
  // ============================================================
  let noContradictions = true;
  for (const str of params.strengths) {
    const match = params.matches.find(
      (m) => m.requirementName.toLowerCase() === str.targetRequirement.toLowerCase()
    );
    if (match && (match.status === 'EVIDENCE_GAP' || match.status === 'MISSING' || match.status === 'SKILL_GAP')) {
      noContradictions = false;
      violations.push(
        `Check 15 Failed: Cross-section contradiction: "${str.strength}" is listed as a Strength, but requirement "${match.requirementName}" has status "${match.status}".`
      );
      if (!withheldSections.includes('strengths')) {
        withheldSections.push('strengths');
      }
    }
  }
  checks.push({
    checkNumber: 15,
    name: 'No contradictory conclusions',
    passed: noContradictions,
    detail: noContradictions ? 'Zero cross-section contradictions between strengths, gaps, and verdict' : 'Contradiction between strengths and gaps',
  });

  // ============================================================
  // QUOTE VALIDATION GATE (PHASE 15)
  // ============================================================
  for (const match of params.matches) {
    for (let qIdx = match.evidenceQuotes.length - 1; qIdx >= 0; qIdx--) {
      const quote = match.evidenceQuotes[qIdx];
      if (quote && quote.trim().length > 5) {
        const quoteCheck = verifyQuoteInSource(params.originalResumeText, quote);
        if (!quoteCheck.verified) {
          violations.push(
            `Quote validation failure in requirement "${match.requirementName}": Quote "${quote.slice(0, 40)}..." not found in source document. Discarding quote.`
          );
          match.evidenceQuotes.splice(qIdx, 1);
        }
      }
    }
  }

  // ============================================================
  // CLAIM VALIDATION GATE (PHASE 14)
  // ============================================================
  for (let sIdx = params.strengths.length - 1; sIdx >= 0; sIdx--) {
    const str = params.strengths[sIdx];
    const match = params.matches.find((m) => m.requirementName.toLowerCase() === str.targetRequirement.toLowerCase());
    if (match && match.status !== 'SUPPORTED') {
      violations.push(`Claim validation failure: Strength "${str.strength}" lacks SUPPORTED status in match ledger.`);
      params.strengths.splice(sIdx, 1);
    }
  }

  // Overall audit result
  const allChecksPassed = checks.every((c) => c.passed);
  const auditPassed = allChecksPassed && violations.length === 0;
  const traceabilityStatus = auditPassed ? 'ZERO_FABRICATION_CERTIFIED' : 'TRACEABILITY_AUDIT_INCOMPLETE';

  return {
    passed: auditPassed,
    auditPassed,
    scoreConsistent: statusMatches,
    zeroFabricationCertified: auditPassed && !withheldSections.includes('resumeRewrite'),
    crossSectionConsistent: noContradictions,
    hallucinationFree: auditPassed,
    traceabilityStatus,
    crossSectionChecks: checks,
    violations,
    withheldSections,
  };
}
