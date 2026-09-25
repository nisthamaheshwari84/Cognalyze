/**
 * COGNALYZE RESULT ENGINE — MASTER PIPELINE ORCHESTRATOR
 * Executes the complete pipeline:
 * JD Ingestion -> Resume Ingestion -> Normalization -> Hybrid Matching ->
 * Deterministic Scoring -> Derivation Engine -> Truthful Rewriter -> Validation Layer
 */

import { CanonicalAnalysisObject } from './types';
import { parseJobDescription } from './jd-engine';
import { parseResume } from './resume-engine';
import { matchRequirementsToEvidence } from './matching-engine';
import { calculateDeterministicScore } from './score-engine';
import {
  deriveExperienceAnalysis,
  deriveFinalVerdict,
  deriveGaps,
  deriveInterviewFocus,
  deriveProjectQuality,
  deriveRoadmap,
  deriveStrengths,
} from './derivation-engine';
import { rewriteFullResume } from './resume-rewriter';
import { validateCanonicalAnalysis } from './validation-layer';

export * from './types';
export * from './ontology';
export * from './jd-engine';
export * from './resume-engine';
export * from './matching-engine';
export * from './score-engine';
export * from './derivation-engine';
export * from './resume-rewriter';
export * from './validation-layer';

/**
 * Runs the complete evidence-grounded result engine on the input JD and Resume.
 * Guaranteed:
 * - Deterministic scoring math
 * - Zero ungrounded metric fabrication
 * - Single source of truth canonical object
 * - Never returns 0% upon pipeline error
 */
export async function runCanonicalResultEngine(
  resumeText: string,
  jdText: string,
  candidateProfile?: {
    githubUsername?: string;
    targetRole?: string;
    experienceLevel?: string;
  }
): Promise<CanonicalAnalysisObject> {
  const startTime = Date.now();
  const cleanResume = resumeText?.trim() || '';
  const cleanJd = jdText?.trim() || '';

  if (!cleanResume) {
    throw new Error('Analysis incomplete: Resume text cannot be empty.');
  }

  // 1. Ingest JD & Extract Canonical Requirements
  const jd = parseJobDescription(cleanJd);

  // 2. Ingest Resume & Extract Source-Located Evidence Inventory
  const resume = parseResume(cleanResume);

  // 3. Build Evidence Graph & Execute Hybrid Matching
  const matches = matchRequirementsToEvidence(jd.requirements, resume.evidenceItems);

  // 4. Calculate Deterministic Evidence Score
  const score = calculateDeterministicScore(jd.requirements, matches);

  // 5. Derive Secondary Intelligence (strictly from canonical matches)
  const strengths = deriveStrengths(matches, jd.requirements, resume.evidenceItems);
  const gaps = deriveGaps(matches, jd.requirements);
  const experienceAnalysis = deriveExperienceAnalysis(resume, resume.evidenceItems);
  const projectAnalysis = deriveProjectQuality(resume, resume.evidenceItems, jd);
  const roadmap = deriveRoadmap(gaps, matches);
  const interviewFocus = deriveInterviewFocus(matches, resume.evidenceItems);
  const finalVerdict = deriveFinalVerdict(matches, resume, jd);

  // 6. Generate Truthful Rewritten Resume
  const resumeRewrite = rewriteFullResume(resume, jd, jd.requirements, cleanResume);

  // 7. Execute Validation Layer (cross-section consistency, zero fabrication, score consistency)
  const validation = validateCanonicalAnalysis({
    requirements: jd.requirements,
    evidenceItems: resume.evidenceItems,
    matches,
    score,
    strengths,
    gaps,
    resumeRewrite,
    originalResumeText: cleanResume,
  });

  // 8. Market Position (honest benchmark standard)
  const supportedCount = matches.filter((m) => m.status === 'SUPPORTED').length;
  const marketPosition = {
    benchmarkStatus: 'BENCHMARK_UNAVAILABLE' as const,
    explanation:
      'Market benchmark unavailable: Cognalyze compares candidates only against statistically validated real-world cohorts rather than fabricating arbitrary percentiles.',
    evidenceProfileSummary: `Your resume demonstrates verified evidence across ${supportedCount} of ${jd.requirements.length} target role requirements.`,
    requiredCohortForPercentile:
      'Defensible percentiles require an active, verified cohort of 200+ campus/early-career peers targeting this tech stack.',
  };

  const canonicalObject: CanonicalAnalysisObject = {
    candidate: resume,
    jd,
    requirements: jd.requirements,
    evidence: resume.evidenceItems,
    matches,
    score,
    strengths,
    gaps,
    risks: interviewFocus.verificationRecommendations.map((v, idx) => ({
      id: `risk_${idx + 1}`,
      claim: v.claim,
      verificationRecommended: v.recommendedVerification,
      severity: 'MEDIUM',
      sourceQuote: v.claim,
    })),
    experienceAnalysis,
    projectAnalysis,
    resumeRewrite,
    roadmap,
    interviewFocus,
    marketPosition,
    finalVerdict,
    validation,
    metadata: {
      version: 'v3.0-canonical-result-engine',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    },
  };

  return canonicalObject;
}
