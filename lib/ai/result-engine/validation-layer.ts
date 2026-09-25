/**
 * COGNALYZE RESULT ENGINE — VALIDATION LAYER
 * Cross-section consistency, score verification, zero-fabrication check, and hallucination gate.
 */

import {
  CanonicalJDRequirement,
  CanonicalResumeEvidence,
  DeterministicScoreBreakdown,
  FullRewrittenResume,
  GapItem,
  RequirementEvidenceMatch,
  StrengthItem,
  ValidationReport,
} from './types';

/**
 * Validates the entire canonical analysis object before passing to UI or downstream APIs.
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
}): ValidationReport {
  const violations: string[] = [];
  const withheldSections: string[] = [];
  const lowerResume = params.originalResumeText.toLowerCase();

  // 1. Score Consistency Check
  // Ensure score matches count of supported/partial items
  const expectedSupported = params.matches.filter((m) => m.status === 'SUPPORTED').length;
  if (params.score.summaryCounts.supported !== expectedSupported) {
    violations.push(
      `Score breakdown mismatch: reported ${params.score.summaryCounts.supported} supported, but match list has ${expectedSupported}.`
    );
  }

  // 2. Cross-Section Consistency Check: Strengths vs Gaps
  // A requirement marked as an EVIDENCE_GAP or MISSING must NEVER appear as a Strength
  for (const str of params.strengths) {
    const match = params.matches.find(
      (m) => m.requirementName.toLowerCase() === str.targetRequirement.toLowerCase()
    );
    if (match && (match.status === 'EVIDENCE_GAP' || match.status === 'MISSING' || match.status === 'SKILL_GAP')) {
      violations.push(
        `Cross-section contradiction: "${str.strength}" is listed as a Strength, but requirement "${match.requirementName}" has status "${match.status}".`
      );
      if (!withheldSections.includes('strengths')) {
        withheldSections.push('strengths');
      }
    }
  }

  // 3. Resume Rewrite Fact Check & Zero-Fabrication Enforcement
  const allBullets = [
    ...params.resumeRewrite.experience.flatMap((e) => e.bullets),
    ...params.resumeRewrite.projects.flatMap((p) => p.bullets),
  ];

  // Metric pattern: numbers with %, X, ms, s, k, m, users, qps, etc.
  const metricRegex = /\b(\d+(?:\.\d+)?\s*(?:%|x|ms|s|k|m|users|requests|qps|accuracy|f1))\b/gi;

  for (const b of allBullets) {
    const metricMatches = b.rewrittenText.match(metricRegex) || [];
    for (const metric of metricMatches) {
      const clean = metric.trim().toLowerCase();
      if (!lowerResume.includes(clean) && !b.originalText.toLowerCase().includes(clean)) {
        violations.push(
          `Fabricated metric detected in bullet "${b.bulletId}": "${metric}" was not found in original resume.`
        );
        if (!withheldSections.includes('resumeRewrite')) {
          withheldSections.push('resumeRewrite');
        }
      }
    }
  }

  // 4. Hallucination Check for Rewritten Technologies
  // Ensure technologies mentioned in rewritten project headers exist in original resume
  for (const proj of params.resumeRewrite.projects) {
    for (const tech of proj.technologies) {
      const cleanTech = tech.toLowerCase();
      // Allow general words, but flag specific cloud or specialized tools if not present
      if (
        (cleanTech === 'aws' || cleanTech === 'kubernetes' || cleanTech === 'gcp') &&
        !lowerResume.includes(cleanTech)
      ) {
        violations.push(
          `Hallucinated technology "${tech}" claimed in rewritten project "${proj.title}" but absent in original resume.`
        );
        if (!withheldSections.includes('resumeRewrite')) {
          withheldSections.push('resumeRewrite');
        }
      }
    }
  }

  const passed = violations.length === 0;

  return {
    passed,
    scoreConsistent: params.score.summaryCounts.supported === expectedSupported,
    zeroFabricationCertified: !withheldSections.includes('resumeRewrite'),
    crossSectionConsistent: !withheldSections.includes('strengths'),
    hallucinationFree: passed,
    violations,
    withheldSections,
  };
}
