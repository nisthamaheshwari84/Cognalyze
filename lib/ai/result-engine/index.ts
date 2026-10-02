/**
 * COGNALYZE RESULT ENGINE — MASTER PIPELINE ORCHESTRATOR
 * Executes the complete evidence-first verification pipeline:
 * 
 * 1. Extract JD & Canonical Requirements
 * 2. Parse Resume (Document Truth, exact provenance, bullet boundaries)
 * 3. Extract Candidate Claims -> Claim Ledger
 * 4. Discover External Sources -> Source Ledger
 * 5. Inspect External Sources (GitHub, LinkedIn, LeetCode, Deployment)
 * 6. Cross-Check Sources & Contradiction Detection
 * 7. Build Evidence Ledger
 * 8. Map Requirements to Evidence (enforcing non-equivalence rules)
 * 9. Calculate Deterministic Score
 * 10. Derive Strengths (strictly from verified evidence)
 * 11. Derive Gaps (evidence-aware: absence of evidence != evidence of absence)
 * 12. Derive Roadmap & Evidence-Generating Milestones
 * 13. Derive Interview Defensibility Probes
 * 14. Synthesize Final Verdict from Evaluation Ledger
 * 15. Generate Truthful Rewritten Resume
 * 16. Enforce Claim Validation Gate & Quote Validation Gate
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
import {
  crossCheckSources,
  inspectGithubRepository,
  RepoInspectionResult,
  LinkedInInspectionResult,
  LeetCodeInspectionResult,
  DeploymentInspectionResult,
} from '@/lib/evidence/source-verifier';

export * from './types';
export * from './ontology';
export * from './jd-engine';
export * from './resume-engine';
export * from './matching-engine';
export * from './score-engine';
export * from './derivation-engine';
export * from './resume-rewriter';
export * from './validation-layer';

export interface ExternalInspectionOverrides {
  githubMock?: {
    accessible: boolean;
    readmeText?: string;
    files?: Record<string, string>;
  };
  linkedinMock?: LinkedInInspectionResult;
  leetcodeMock?: LeetCodeInspectionResult;
  deploymentMock?: DeploymentInspectionResult;
}

/**
 * Runs the complete evidence-grounded result engine on the input JD and Resume.
 * Guaranteed:
 * - NO EVIDENCE = NO CLAIM
 * - Deterministic scoring math
 * - Zero ungrounded metric fabrication
 * - Single source of truth canonical object with Evidence Ledger and Audit Trail
 */
export async function runCanonicalResultEngine(
  resumeText: string,
  jdText: string,
  candidateProfile?: {
    githubUsername?: string;
    targetRole?: string;
    experienceLevel?: string;
    overrides?: ExternalInspectionOverrides;
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

  // 2. Ingest Resume & Extract Source-Located Evidence Inventory + Ledger
  const resume = parseResume(cleanResume);
  const ledger = resume.ledger;

  // 3. Discover & Inspect External Sources (Phases 3, 4, 5, 6, 7, 8)
  const discoveredSources = ledger.getAllSources();
  const ghSource = discoveredSources.find((s) => s.type === 'github');
  const liSource = discoveredSources.find((s) => s.type === 'linkedin');
  const lcSource = discoveredSources.find((s) => s.type === 'leetcode');
  const depSource = discoveredSources.find((s) => s.type === 'deployment');

  let ghInspection: RepoInspectionResult | undefined;
  let liInspection: LinkedInInspectionResult | undefined = candidateProfile?.overrides?.linkedinMock;
  let lcInspection: LeetCodeInspectionResult | undefined = candidateProfile?.overrides?.leetcodeMock;
  let depInspection: DeploymentInspectionResult | undefined = candidateProfile?.overrides?.deploymentMock;

  // Extract all claimed technologies to independently audit
  const claimedTech = Array.from(new Set(resume.evidenceItems.flatMap((e) => e.technologies)));

  if (ghSource || candidateProfile?.githubUsername || candidateProfile?.overrides?.githubMock) {
    const ghTarget = ghSource?.url || candidateProfile?.githubUsername || 'candidate-repo';
    ghInspection = await inspectGithubRepository(
      ghTarget,
      claimedTech,
      candidateProfile?.overrides?.githubMock
    );

    // Update discovered source status
    if (ghSource) {
      ghSource.verification_status = ghInspection.accessible ? 'VERIFIED' : 'INACCESSIBLE';
      ghSource.checks_performed = ghInspection.checks;
    }
  }

  // Cross-check sources & detect contradictions (Phases 9 & 10)
  crossCheckSources({
    ledger,
    resumeText: cleanResume,
    githubInspection: ghInspection,
    linkedinInspection: liInspection,
    leetcodeInspection: lcInspection,
    deploymentInspection: depInspection,
  });

  // 4. Build Evidence Graph & Execute Matching with Non-Equivalence Rules
  const matches = matchRequirementsToEvidence(jd.requirements, resume.evidenceItems, ledger);

  // 5. Calculate Deterministic Evidence Score (Phase 20)
  const score = calculateDeterministicScore(jd.requirements, matches);

  // 6. Derive Secondary Intelligence (strictly from verified matches and ledger)
  const strengths = deriveStrengths(matches, jd.requirements, resume.evidenceItems);
  const gaps = deriveGaps(matches, jd.requirements);
  const experienceAnalysis = deriveExperienceAnalysis(resume, resume.evidenceItems);
  const projectAnalysis = deriveProjectQuality(resume, resume.evidenceItems, jd);
  const roadmap = deriveRoadmap(gaps, matches);
  const interviewFocus = deriveInterviewFocus(matches, resume.evidenceItems, ledger);
  const finalVerdict = deriveFinalVerdict(matches, resume, jd);

  // 7. Generate Truthful Rewritten Resume (zero fabrication)
  const resumeRewrite = rewriteFullResume(resume, jd, jd.requirements, cleanResume);

  // 8. Execute Validation Layer (15-Check Cross-Section Audit & Certification)
  const validation = validateCanonicalAnalysis({
    requirements: jd.requirements,
    evidenceItems: resume.evidenceItems,
    matches,
    score,
    strengths,
    gaps,
    resumeRewrite,
    originalResumeText: cleanResume,
    ledger,
    roadmap,
    interviewFocus,
    finalVerdict,
  });

  // 9. Market Position (honest benchmark standard)
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
    evidenceLedger: ledger.getAllEvidence(),
    claimLedger: ledger.getAllClaims(),
    discoveredSources: ledger.getAllSources(),
    auditTrail: ledger.getAuditTrail(),
    metadata: {
      version: 'v3.0-canonical-result-engine',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    },
  };

  return canonicalObject;
}
