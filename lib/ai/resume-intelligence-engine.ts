/**
 * COGNALYZE — EVIDENCE-GROUNDED RESUME INTELLIGENCE ENGINE
 * Core Architecture & Single Source of Truth
 *
 * Re-exports the complete modular result engine and bridges canonical outputs
 * to ensure 100% backward compatibility with all UI and API routes.
 */

import {
  runCanonicalResultEngine,
  CanonicalAnalysisObject,
  CanonicalJDRequirement,
  CanonicalResumeEvidence,
  RequirementEvidenceMatch,
} from './result-engine';

export * from './result-engine';

// ============================================================
// 1. LEGACY DATA CONTRACTS & INTERFACES (PRESERVED)
// ============================================================

export type EvidenceLevel =
  | 'NO_EVIDENCE'
  | 'CLAIMED'
  | 'DEMONSTRATED'
  | 'ASSESSED'
  | 'VERIFIED'
  | 'CONFLICTING';

export type DefensibilityRating = 'STRONG' | 'MODERATE' | 'WEAK';

export type RequirementImportance = 'CRITICAL' | 'IMPORTANT' | 'PREFERRED';

export interface CandidateEvidenceItem {
  evidenceId: string;
  evidenceGroupId: string;
  section: 'SUMMARY' | 'EXPERIENCE' | 'PROJECTS' | 'SKILLS' | 'EDUCATION' | 'CERTIFICATIONS';
  claim: string;
  capability: string;
  technology: string[];
  projectOrRole?: string;
  dateOrDuration?: string;
  verbatimSourceQuote: string;
  evidenceLevel: EvidenceLevel;
  confidence: number;
  defensibility: DefensibilityRating;
}

export interface RoleRequirement {
  requirementId: string;
  name: string;
  description: string;
  importance: RequirementImportance;
  expectedCapability: string;
  expectedProof: string;
  sourceQuote: string;
}

export interface RequirementMatch {
  requirementId: string;
  requirementName: string;
  importance: RequirementImportance;
  evidenceLevel: EvidenceLevel;
  supportingEvidenceIds: string[];
  gapType: 'NONE' | 'EVIDENCE_GAP' | 'SKILL_GAP';
  evidenceSourceQuotes: string[];
  reasoning: string;
  actionableRecommendation: string;
}

export interface RoleAlignmentSummary {
  criticalSupported: { supported: number; total: number };
  importantSupported: { supported: number; total: number };
  preferredSupported: { supported: number; total: number };
  evidenceCoverage: 'HIGH' | 'MODERATE' | 'LOW';
  verificationNeededCount: number;
  alignmentPercentage: number;
  formulaVersion: string;
  calculatedAt: string;
  formulaExplanation: string;
}

export interface ExperienceQualityBreakdown {
  professionalExperience: {
    level: 'EXTENSIVE' | 'MODERATE' | 'EARLY' | 'NO_PROFESSIONAL_FOUND';
    detail: string;
  };
  projectEvidence: {
    count: number;
    level: 'STRONG' | 'MODERATE' | 'LIMITED';
    detail: string;
  };
  engineeringDepth: {
    level: 'DEEP' | 'MODERATE' | 'SURFACE';
    detail: string;
  };
  impactEvidence: {
    level: 'MEASURABLE' | 'OBSERVABLE_PROCESS' | 'LIMITED';
    detail: string;
  };
  fresherFriendlyAssessment: string;
}

export interface ProjectDefensibility {
  projectName: string;
  problemDocumented: string;
  technicalDepthDocumented: string;
  candidateContribution: string;
  evidenceQuote: string;
  outcomeDocumented: string;
  hasMeasurableMetric: boolean;
  relevanceToRole: string;
  interviewDefensibility: DefensibilityRating;
  defensibilityReason: string;
  missingToStrengthen: string;
}

export interface HonestMarketPosition {
  benchmarkStatus: 'BENCHMARK_UNAVAILABLE' | 'COHORT_BENCHMARK';
  cohortDefinition?: string;
  sampleSize?: number;
  explanation: string;
  evidenceProfileSummary: string;
  requiredCohortForPercentile: string;
}

export interface FeedbackSection {
  roleAlignmentSummary: RoleAlignmentSummary;
  strongEvidence: RequirementMatch[];
  partialEvidence: RequirementMatch[];
  claimedOnly: RequirementMatch[];
  missingEvidence: RequirementMatch[];
  conflictingEvidence: RequirementMatch[];
  experienceQuality: ExperienceQualityBreakdown;
  projectAnalyses: ProjectDefensibility[];
  marketPosition: HonestMarketPosition;
}

export interface SkillsGapItem {
  requirementId: string;
  name: string;
  importance: RequirementImportance;
  candidateEvidenceLevel: EvidenceLevel;
  gapType: 'NONE' | 'EVIDENCE_GAP' | 'SKILL_GAP';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  adjacentCapabilities: string[];
  whyPrioritized: string;
  recommendedAction: string;
}

export interface RewrittenBullet {
  bulletId: string;
  section: string;
  originalText: string;
  rewrittenText: string;
  transformationRationale: string;
  newFactsAdded: string; // Must be "NONE - Grounded strictly in original source"
  evidenceStatus: 'SUPPORTED' | 'EVIDENCE_GAP';
  targetRequirement?: string;
  interviewDefensibility: DefensibilityRating;
}

export interface RewrittenResume {
  version: string;
  summary: string;
  summaryOriginal?: string;
  skills: { category: string; items: string[] }[];
  experience: { role: string; company: string; period: string; bullets: RewrittenBullet[] }[];
  projects: { title: string; tech: string[]; bullets: RewrittenBullet[] }[];
  education: { degree: string; institution: string; year: string; details?: string }[];
  certifications: string[];
  atsStructureScore: 'STRONG' | 'ADEQUATE' | 'NEEDS_ATTENTION';
  atsNotes: string[];
  zeroFabricationCertified: boolean;
}

export interface RoadmapMilestone {
  milestoneId: string;
  phase: string;
  title: string;
  targetGapRequirement: string;
  currentEvidenceLevel: EvidenceLevel;
  action: string;
  concreteDeliverableArtifact: string;
  evidenceGenerated: string;
  realisticEffort: string;
}

export type ReadyToApplyStatus =
  | 'READY_TO_APPLY'
  | 'APPLY_WITH_GAPS'
  | 'BUILD_MORE_EVIDENCE'
  | 'INSUFFICIENT_DATA';

export interface RoadmapSection {
  readyToApplyStatus: ReadyToApplyStatus;
  readyToApplyReason: string;
  milestones: RoadmapMilestone[];
}

export interface InterviewProbeQuestion {
  questionId: string;
  targetRequirement: string;
  claimBeingProbed: string;
  question: string;
  whyAsked: string;
  questionType:
    | 'RESUME_VERIFICATION'
    | 'TECHNICAL_DEPTH'
    | 'PROJECT_OWNERSHIP'
    | 'ARCHITECTURE'
    | 'PROBLEM_SOLVING'
    | 'MISSING_CRITICAL_EVIDENCE'
    | 'CONTRADICTION';
  evidenceTested: string;
  whatStrongProofLooksLike: string;
  candidateDefensibility: DefensibilityRating;
}

export interface InterviewSection {
  focusSummary: string;
  likelyAreasToProbe: string[];
  probeQuestions: InterviewProbeQuestion[];
  defensibilityOverview: {
    strongCount: number;
    moderateCount: number;
    weakCount: number;
    rationale: string;
  };
}

export interface ResumeIntelligenceReport {
  evidenceItems: CandidateEvidenceItem[];
  requirements: RoleRequirement[];
  feedback: FeedbackSection;
  skillsGap: SkillsGapItem[];
  rewriter: RewrittenResume;
  roadmap: RoadmapSection;
  interview: InterviewSection;
  metadata: {
    timestamp: string;
    formulaVersion: string;
    noFabricationCertified: boolean;
    evidenceItemsCount: number;
    requirementsCount: number;
  };
  canonical: CanonicalAnalysisObject;
}

// ============================================================
// 2. ZERO-FABRICATION VERIFICATION GATE
// ============================================================

export function validateZeroFabrication(
  rewrittenBullets: RewrittenBullet[],
  originalResumeText: string
): { certified: boolean; violations: string[] } {
  const violations: string[] = [];
  const lowerOriginal = originalResumeText.toLowerCase();

  const metricRegex = /\b(\d+(?:\.\d+)?\s*(?:%|x|ms|s|k|m|users|requests|qps|accuracy|f1))\b/gi;

  for (const bullet of rewrittenBullets) {
    const rewrittenMatches = bullet.rewrittenText.match(metricRegex) || [];
    for (const metric of rewrittenMatches) {
      const cleanMetric = metric.trim().toLowerCase();
      if (!lowerOriginal.includes(cleanMetric) && !bullet.originalText.toLowerCase().includes(cleanMetric)) {
        violations.push(
          `Fabricated metric detected in bullet "${bullet.bulletId}": "${metric}" was not found in original resume text.`
        );
      }
    }
  }

  return {
    certified: violations.length === 0,
    violations,
  };
}

// ============================================================
// 3. MASTER INTEGRATION & CANONICAL BRIDGING
// ============================================================

export async function analyzeResumeIntelligence(
  resumeText: string,
  jobDescription: string,
  candidateProfile?: {
    githubUsername?: string;
    targetRole?: string;
    experienceLevel?: string;
  }
): Promise<ResumeIntelligenceReport> {
  // Execute canonical single source of truth engine
  const canonical = await runCanonicalResultEngine(resumeText, jobDescription, candidateProfile);

  // Map canonical requirements to legacy RoleRequirement[]
  const requirements: RoleRequirement[] = canonical.requirements.map((r) => ({
    requirementId: r.id,
    name: r.normalized_requirement,
    description: r.original_text,
    importance: r.priority,
    expectedCapability: `Demonstrated implementation in ${r.category}`,
    expectedProof: 'Project source code, production deployment, or verifiable technical bullets',
    sourceQuote: r.original_text,
  }));

  // Map canonical evidence to legacy CandidateEvidenceItem[]
  const evidenceItems: CandidateEvidenceItem[] = canonical.evidence.map((e) => {
    let level: EvidenceLevel = 'DEMONSTRATED';
    if (e.section === 'SKILLS' || e.section === 'SUMMARY') level = 'CLAIMED';
    let defensibility: DefensibilityRating = 'MODERATE';
    if (e.technologies.length >= 2) defensibility = 'STRONG';

    return {
      evidenceId: e.id,
      evidenceGroupId: `group_${e.section.toLowerCase()}`,
      section: (['SUMMARY', 'EXPERIENCE', 'PROJECTS', 'SKILLS', 'EDUCATION', 'CERTIFICATIONS'].includes(e.section)
        ? e.section
        : 'PROJECTS') as CandidateEvidenceItem['section'],
      claim: e.text.slice(0, 120),
      capability: e.technologies.join(', ') || 'Software Development',
      technology: e.technologies,
      projectOrRole: e.title,
      verbatimSourceQuote: e.verbatim_quote,
      evidenceLevel: level,
      confidence: 0.9,
      defensibility,
    };
  });

  // Map canonical matches to legacy RequirementMatch[]
  const requirementMatches: RequirementMatch[] = canonical.matches.map((m) => {
    let evLevel: EvidenceLevel = 'NO_EVIDENCE';
    if (m.status === 'SUPPORTED') evLevel = 'DEMONSTRATED';
    else if (m.status === 'CLAIM_ONLY') evLevel = 'CLAIMED';
    else if (m.status === 'PARTIAL') evLevel = 'CLAIMED';
    else if (m.status === 'CONTRADICTED') evLevel = 'CONFLICTING';

    let gapType: 'NONE' | 'EVIDENCE_GAP' | 'SKILL_GAP' = 'NONE';
    if (m.status === 'EVIDENCE_GAP' || m.status === 'MISSING') gapType = 'EVIDENCE_GAP';
    else if (m.status === 'SKILL_GAP') gapType = 'SKILL_GAP';

    return {
      requirementId: m.requirementId,
      requirementName: m.requirementName,
      importance: m.priority,
      evidenceLevel: evLevel,
      supportingEvidenceIds: m.matchedEvidenceIds,
      gapType,
      evidenceSourceQuotes: m.evidenceQuotes,
      reasoning: m.reasoning,
      actionableRecommendation: m.actionableRecommendation,
    };
  });

  // Map role alignment summary
  const roleAlignmentSummary: RoleAlignmentSummary = {
    criticalSupported: {
      supported: canonical.score.criticalStats.supported,
      total: canonical.score.criticalStats.total,
    },
    importantSupported: {
      supported: canonical.score.importantStats.supported,
      total: canonical.score.importantStats.total,
    },
    preferredSupported: {
      supported: canonical.score.preferredStats.supported,
      total: canonical.score.preferredStats.total,
    },
    evidenceCoverage:
      canonical.score.overallEvidenceMatch >= 70
        ? 'HIGH'
        : canonical.score.overallEvidenceMatch >= 40
        ? 'MODERATE'
        : 'LOW',
    verificationNeededCount: canonical.score.summaryCounts.claimOnly,
    alignmentPercentage: canonical.score.overallEvidenceMatch,
    formulaVersion: 'v3.0-deterministic-canonical',
    calculatedAt: canonical.score.calculatedAt,
    formulaExplanation: canonical.score.formulaExplanation,
  };

  // Group matches
  const strongEvidence = requirementMatches.filter((m) => m.evidenceLevel === 'DEMONSTRATED');
  const partialEvidence = requirementMatches.filter((m) => m.evidenceLevel === 'CLAIMED' && m.gapType === 'EVIDENCE_GAP');
  const claimedOnly = requirementMatches.filter((m) => m.evidenceLevel === 'CLAIMED' && m.gapType !== 'EVIDENCE_GAP');
  const missingEvidence = requirementMatches.filter((m) => m.evidenceLevel === 'NO_EVIDENCE');
  const conflictingEvidence = requirementMatches.filter((m) => m.evidenceLevel === 'CONFLICTING');

  // Feedback section
  const feedback: FeedbackSection = {
    roleAlignmentSummary,
    strongEvidence,
    partialEvidence,
    claimedOnly,
    missingEvidence,
    conflictingEvidence,
    experienceQuality: {
      professionalExperience: {
        level: canonical.experienceAnalysis.professionalExperience.level,
        detail: canonical.experienceAnalysis.professionalExperience.detail,
      },
      projectEvidence: {
        count: canonical.experienceAnalysis.projectEvidence.count,
        level: canonical.experienceAnalysis.projectEvidence.level,
        detail: canonical.experienceAnalysis.projectEvidence.detail,
      },
      engineeringDepth: {
        level: canonical.experienceAnalysis.engineeringDepth.level,
        detail: canonical.experienceAnalysis.engineeringDepth.detail,
      },
      impactEvidence: {
        level: canonical.experienceAnalysis.impactEvidence.level,
        detail: canonical.experienceAnalysis.impactEvidence.detail,
      },
      fresherFriendlyAssessment: canonical.experienceAnalysis.fresherFairnessAssessment,
    },
    projectAnalyses: canonical.projectAnalysis.map((p) => ({
      projectName: p.projectName,
      problemDocumented: p.problem,
      technicalDepthDocumented: p.technicalImplementation,
      candidateContribution: p.ownership,
      evidenceQuote: `Demonstrated with ${p.technologies.join(', ')}`,
      outcomeDocumented: p.measurableResult,
      hasMeasurableMetric: p.measurableResult.includes('metrics'),
      relevanceToRole: p.relevanceToJD,
      interviewDefensibility: p.interviewDefensibility,
      defensibilityReason: p.evaluatorNote,
      missingToStrengthen: p.deployment.includes('Local') ? 'Add containerized deployment or live URL.' : 'Add evaluation metrics.',
    })),
    marketPosition: {
      benchmarkStatus: canonical.marketPosition.benchmarkStatus,
      explanation: canonical.marketPosition.explanation,
      evidenceProfileSummary: canonical.marketPosition.evidenceProfileSummary,
      requiredCohortForPercentile: canonical.marketPosition.requiredCohortForPercentile,
    },
  };

  // Skills gap items
  const skillsGap: SkillsGapItem[] = canonical.matches
    .filter((m) => m.status !== 'SUPPORTED')
    .map((m) => ({
      requirementId: m.requirementId,
      name: m.requirementName,
      importance: m.priority,
      candidateEvidenceLevel: m.status === 'CLAIM_ONLY' ? 'CLAIMED' : 'NO_EVIDENCE',
      gapType: m.status === 'SKILL_GAP' ? 'SKILL_GAP' : 'EVIDENCE_GAP',
      priority: m.priority === 'CRITICAL' ? 'HIGH' : m.priority === 'IMPORTANT' ? 'MEDIUM' : 'LOW',
      adjacentCapabilities: ['General Software Engineering'],
      whyPrioritized: `${m.priority} role requirement with ${m.status.toLowerCase()} status.`,
      recommendedAction: m.actionableRecommendation,
    }));

  // Rewriter items
  const rewriter: RewrittenResume = {
    version: 'v3.0-truthful-canonical',
    summary: canonical.resumeRewrite.summary,
    skills: canonical.resumeRewrite.skills,
    experience: canonical.resumeRewrite.experience.map((e) => ({
      role: e.role,
      company: e.company,
      period: e.period,
      bullets: e.bullets.map((b) => ({
        bulletId: b.bulletId,
        section: b.section,
        originalText: b.originalText,
        rewrittenText: b.rewrittenText,
        transformationRationale: b.transformationRationale,
        newFactsAdded: b.newFactsAdded,
        evidenceStatus: b.evidenceStatus,
        targetRequirement: b.targetRequirement,
        interviewDefensibility: b.interviewDefensibility,
      })),
    })),
    projects: canonical.resumeRewrite.projects.map((p) => ({
      title: p.title,
      tech: p.technologies,
      bullets: p.bullets.map((b) => ({
        bulletId: b.bulletId,
        section: b.section,
        originalText: b.originalText,
        rewrittenText: b.rewrittenText,
        transformationRationale: b.transformationRationale,
        newFactsAdded: b.newFactsAdded,
        evidenceStatus: b.evidenceStatus,
        targetRequirement: b.targetRequirement,
        interviewDefensibility: b.interviewDefensibility,
      })),
    })),
    education: canonical.resumeRewrite.education,
    certifications: canonical.resumeRewrite.certifications,
    atsStructureScore: canonical.resumeRewrite.atsScore,
    atsNotes: canonical.resumeRewrite.atsNotes,
    zeroFabricationCertified: canonical.validation.zeroFabricationCertified,
  };

  // Roadmap
  const roadmap: RoadmapSection = {
    readyToApplyStatus: canonical.roadmap.readyToApplyStatus,
    readyToApplyReason: canonical.roadmap.verdictReason,
    milestones: canonical.roadmap.milestones.map((m) => ({
      milestoneId: m.milestoneId,
      phase: m.phase,
      title: m.title,
      targetGapRequirement: m.targetGapRequirement,
      currentEvidenceLevel: 'NO_EVIDENCE',
      action: m.action,
      concreteDeliverableArtifact: m.deliverableArtifact,
      evidenceGenerated: m.evidenceGenerated,
      realisticEffort: m.realisticEffort,
    })),
  };

  // Interview
  const interview: InterviewSection = {
    focusSummary: canonical.interviewFocus.focusSummary,
    likelyAreasToProbe: canonical.interviewFocus.likelyAreasToProbe,
    probeQuestions: canonical.interviewFocus.probeQuestions,
    defensibilityOverview: canonical.interviewFocus.defensibilityOverview,
  };

  return {
    evidenceItems,
    requirements,
    feedback,
    skillsGap,
    rewriter,
    roadmap,
    interview,
    metadata: {
      timestamp: canonical.metadata.timestamp,
      formulaVersion: 'v3.0-canonical-result-engine',
      noFabricationCertified: canonical.validation.zeroFabricationCertified,
      evidenceItemsCount: evidenceItems.length,
      requirementsCount: requirements.length,
    },
    canonical,
  };
}
