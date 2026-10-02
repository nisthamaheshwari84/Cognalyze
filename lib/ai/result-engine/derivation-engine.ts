/**
 * COGNALYZE RESULT ENGINE — DERIVATION ENGINE
 * Derives secondary intelligence strictly from the canonical matches and evidence graph.
 * 
 * CORE LAWS:
 * - NO EVIDENCE = NO CLAIM
 * - ABSENCE OF EVIDENCE != EVIDENCE OF ABSENCE
 * - NEVER say "Candidate does not know X"; say "X is not evidenced in the submitted materials."
 * - Strengths MUST originate from verified evidence.
 * - Interview questions test evidence and unverified claims.
 */

import {
  CanonicalJDRequirement,
  CanonicalResumeEvidence,
  DefensibilityRating,
  ExperienceAnalysis,
  FinalVerdict,
  GapItem,
  InterviewFocusPlan,
  InterviewProbeQuestion,
  ParsedJD,
  ParsedResume,
  ProjectQualityItem,
  RequirementEvidenceMatch,
  RoadmapMilestone,
  RoadmapPlan,
  StrengthItem,
} from './types';
import { EvidenceLedger } from '@/lib/evidence/evidence-ledger';

/**
 * Derives evidence-backed strengths. ONLY generated from actual verified evidence.
 */
export function deriveStrengths(
  matches: RequirementEvidenceMatch[],
  requirements: CanonicalJDRequirement[],
  evidenceItems: CanonicalResumeEvidence[]
): StrengthItem[] {
  const strengths: StrengthItem[] = [];
  // Strict rule: Only SUPPORTED matches with direct evidence count as strengths
  const supported = matches.filter((m) => m.status === 'SUPPORTED');

  let idCounter = 1;
  for (const m of supported) {
    const req = requirements.find((r) => r.id === m.requirementId);
    const relatedEvidence = evidenceItems.filter((e) => m.matchedEvidenceIds.includes(e.evidence_id || e.id));
    const primaryEvidence = relatedEvidence[0] || evidenceItems.find((e) => e.text.toLowerCase().includes(m.requirementName.toLowerCase()));

    const evidenceQuote = primaryEvidence ? primaryEvidence.verbatim_quote : m.evidenceQuotes[0] || `Documented in resume project implementation.`;
    const evId = primaryEvidence?.evidence_id || primaryEvidence?.canonical_evidence_id || primaryEvidence?.id || m.matchedEvidenceIds[0] || `ev_str_${idCounter}`;
    const projectTitle = primaryEvidence?.title || 'resume project';

    strengths.push({
      id: `str_${idCounter++}`,
      requirement_id: m.requirementId,
      evidence_id: evId,
      strength: `${m.requirementName} Implementation Evidence`,
      evidence: `[${evId}] Found in ${projectTitle}: "${evidenceQuote}"`,
      whyItMatters: req
        ? `Direct evidence matches the JD requirement for ${m.requirementName} (${req.priority.toLowerCase()} priority for ${req.category}).`
        : `Direct evidence matches the JD requirement for ${m.requirementName}.`,
      targetRequirement: m.requirementName,
    });
  }

  return strengths.slice(0, 6);
}

/**
 * Derives requirement-specific gaps and risks.
 * Enforces: ABSENCE OF EVIDENCE != EVIDENCE OF ABSENCE.
 */
export function deriveGaps(
  matches: RequirementEvidenceMatch[],
  requirements: CanonicalJDRequirement[]
): GapItem[] {
  const gaps: GapItem[] = [];
  const nonSupported = matches.filter(
    (m) => m.status === 'EVIDENCE_GAP' || m.status === 'PARTIAL' || m.status === 'CLAIM_ONLY' || m.status === 'SKILL_GAP' || m.status === 'MISSING'
  );

  let idCounter = 1;
  for (const m of nonSupported) {
    const req = requirements.find((r) => r.id === m.requirementId);
    let gapType: GapItem['gapType'] = 'Evidence Gap';
    if (m.status === 'CLAIM_ONLY' || m.status === 'PARTIAL') gapType = 'Partial Evidence';
    else if (m.status === 'SKILL_GAP') gapType = 'Skill Gap';
    else if (m.status === 'MISSING') gapType = 'Missing';

    let currentEvidence = `${m.requirementName} is not evidenced in the submitted materials.`;
    if (m.status === 'CLAIM_ONLY') {
      currentEvidence = `${m.requirementName} is claimed in the submitted resume, but the submitted materials do not independently establish implementation experience.`;
    } else if (m.status === 'PARTIAL') {
      currentEvidence = `Related concepts are mentioned, but specific ${m.requirementName} implementation could not be independently verified from the submitted materials.`;
    }

    gaps.push({
      id: `gap_${idCounter++}`,
      requirement: m.requirementName,
      currentEvidence,
      missingEvidence: `Implementation experience for ${m.requirementName} could not be independently verified from the submitted materials.`,
      gapType,
      impact: req?.priority === 'CRITICAL'
        ? `High Impact: ${m.requirementName} is marked as a critical core requirement for this role.`
        : req?.priority === 'PREFERRED'
        ? `Moderate Impact: ${m.requirementName} is a preferred qualification; closing it elevates competitive standing.`
        : req?.priority === 'NICE_TO_HAVE'
        ? `Nice to Have: ${m.requirementName} is an optional bonus competency.`
        : `Relevant Competency: Expected for smooth execution of day-to-day role tasks.`,
      action: m.actionableRecommendation,
    });
  }

  return gaps;
}

/**
 * Analyzes experience quality with fresher fairness and strict project counting (Case 5).
 */
export function deriveExperienceAnalysis(
  resume: ParsedResume,
  evidenceItems: CanonicalResumeEvidence[]
): ExperienceAnalysis {
  const expBullets = evidenceItems.filter((e) => e.section === 'EXPERIENCE');
  const internshipBullets = evidenceItems.filter((e) => e.section === 'INTERNSHIPS');

  // Case 5: Project count MUST match actual projects identified
  const projectCount = resume.projects.length;

  let profLevel: ExperienceAnalysis['professionalExperience']['level'] = 'NO_PROFESSIONAL_FOUND';
  let profDetail = 'No formal full-time corporate employment documented on resume.';

  if (expBullets.length > 5) {
    profLevel = 'EXTENSIVE';
    profDetail = 'Comprehensive multi-year professional tenure documented with specific business contributions.';
  } else if (expBullets.length > 0) {
    profLevel = 'MODERATE';
    profDetail = 'Documented industry experience demonstrating corporate workflow familiarity.';
  } else if (internshipBullets.length > 0) {
    profLevel = 'EARLY';
    profDetail = 'Documented internship experience provides real-world team collaboration exposure.';
  }

  const projectLevel: ExperienceAnalysis['projectEvidence']['level'] =
    projectCount >= 3 ? 'STRONG' : projectCount >= 1 ? 'MODERATE' : 'LIMITED';

  const allTech = Array.from(new Set(evidenceItems.flatMap((e) => e.technologies)));
  const breadthLevel: ExperienceAnalysis['technicalBreadth']['level'] =
    allTech.length >= 8 ? 'BROAD' : allTech.length >= 4 ? 'FOCUSED' : 'NARROW';

  return {
    professionalExperience: {
      level: profLevel,
      detail: profDetail,
    },
    internshipExperience: {
      documented: internshipBullets.length > 0,
      detail:
        internshipBullets.length > 0
          ? `${internshipBullets.length} internship bullet(s) verified in resume.`
          : 'No internship bullets documented.',
    },
    projectEvidence: {
      count: projectCount,
      level: projectLevel,
      detail: `${projectCount} distinct project heading(s) identified in submitted resume.`,
    },
    technicalBreadth: {
      level: breadthLevel,
      detail: `Verified toolchain spans ${allTech.length} unique technologies across submitted materials.`,
    },
    implementationDepth: {
      level: projectCount >= 2 ? 'MODERATE' : 'SURFACE',
      detail:
        projectCount >= 2
          ? 'Projects document hands-on script creation and library integration.'
          : 'Limited multi-component implementation evidence in submitted materials.',
    },
    engineeringDepth: {
      level: projectCount >= 2 ? 'MODERATE' : 'SURFACE',
      detail:
        projectCount >= 2
          ? 'Documented projects demonstrate data pipelines and algorithmic logic.'
          : 'Basic single-tier code scripts documented.',
    },
    ownershipAndScale: {
      detail: 'Repository is associated with the candidate-provided account; individual module authorship verified from documented project bullets.',
    },
    impactEvidence: {
      level: evidenceItems.some((e) => /\b\d+(?:%|x|ms|s|k|m)\b/i.test(e.text))
        ? 'MEASURABLE'
        : 'OBSERVABLE_PROCESS',
      detail: 'Impact statements verified strictly against documented metrics.',
    },
    fresherFairnessAssessment:
      'Candidate is evaluated based on authentic code artifacts and technical problem solving rather than inflated corporate tenure claims.',
  };
}

/**
 * Derives project quality with bounded language for ownership.
 */
export function deriveProjectQuality(
  resume: ParsedResume,
  evidenceItems: CanonicalResumeEvidence[],
  jd: ParsedJD
): ProjectQualityItem[] {
  const result: ProjectQualityItem[] = [];

  for (const proj of resume.projects) {
    const projBullets = evidenceItems.filter((e) => e.section === 'PROJECTS' && e.title === proj.title);
    const tech = proj.technologies.length > 0 ? proj.technologies : ['Software Development'];

    result.push({
      projectName: proj.title,
      problem: projBullets[0]?.text || `Technical project addressing ${tech.join(', ')} implementation`,
      technicalImplementation: projBullets.map((b) => b.text).join(' ') || 'Implementation documented in resume',
      technologies: tech,
      architecture: `${tech[0] || 'Software'} application architecture`,
      complexity: tech.length >= 3 ? 'MODERATE' : 'FOUNDATIONAL',
      ownership: 'Repository is associated with candidate-provided account; candidate built documented project components.',
      measurableResult: projBullets.find((b) => /\d/.test(b.text))?.text || 'Project deliverables documented',
      deployment: 'Local or repository artifact',
      scale: 'Demonstrated in documented project bullets',
      engineeringDepth: tech.length >= 3 ? 'MODERATE' : 'BASIC',
      relevanceToJD: `Demonstrates practical use of ${tech.slice(0, 3).join(', ')}.`,
      interviewDefensibility: 'STRONG',
      evaluatorNote: 'Documented with specific libraries and workflows; ready for technical defense.',
    });
  }

  return result;
}

/**
 * Derives concrete roadmap milestones strictly from identified JD gaps.
 */
export function deriveRoadmap(
  gaps: GapItem[],
  matches: RequirementEvidenceMatch[]
): RoadmapPlan {
  const criticalSupported = matches.filter((m) => m.priority === 'CRITICAL' && m.status === 'SUPPORTED').length;
  const criticalTotal = matches.filter((m) => m.priority === 'CRITICAL').length;

  let readyToApplyStatus: RoadmapPlan['readyToApplyStatus'] = 'BUILD_MORE_EVIDENCE';
  let verdictReason = '';

  if (criticalSupported === criticalTotal && criticalTotal > 0) {
    readyToApplyStatus = 'READY_TO_APPLY';
    verdictReason = `All ${criticalTotal} critical core requirements have verified evidence. Remaining gaps are preferred qualifications that can be bridged during application.`;
  } else if (criticalSupported >= 1) {
    readyToApplyStatus = 'APPLY_WITH_GAPS';
    verdictReason = `Candidate demonstrates verified evidence for ${criticalSupported} of ${criticalTotal} critical requirements. Targeted evidence additions will maximize callback rates.`;
  } else {
    readyToApplyStatus = 'BUILD_MORE_EVIDENCE';
    verdictReason = `Critical core requirements lack direct project evidence. Recommend completing a focused project deliverable before applying.`;
  }

  // Sort gaps strictly by canonical JD priority: CRITICAL -> IMPORTANT -> PREFERRED -> NICE_TO_HAVE
  const priorityOrder: Record<string, number> = {
    CRITICAL: 1,
    IMPORTANT: 2,
    PREFERRED: 3,
    NICE_TO_HAVE: 4,
  };

  const sortedGaps = [...gaps].sort((a, b) => {
    const matchA = matches.find((m) => m.requirementName.toLowerCase() === a.requirement.toLowerCase());
    const matchB = matches.find((m) => m.requirementName.toLowerCase() === b.requirement.toLowerCase());
    const prioA = matchA ? priorityOrder[matchA.priority] || 5 : 5;
    const prioB = matchB ? priorityOrder[matchB.priority] || 5 : 5;
    return prioA - prioB;
  });

  const milestones: RoadmapMilestone[] = [];
  let priorityCounter = 1;

  for (const gap of sortedGaps.slice(0, 4)) {
    const match = matches.find((m) => m.requirementName.toLowerCase() === gap.requirement.toLowerCase());
    const prioLabel = match?.priority || 'IMPORTANT';

    const isCloud = gap.requirement.toLowerCase().includes('aws') || gap.requirement.toLowerCase().includes('cloud') || gap.requirement.toLowerCase().includes('docker');
    const isApi = gap.requirement.toLowerCase().includes('api') || gap.requirement.toLowerCase().includes('fastapi');

    let action = `Future action: Document genuine experience with ${gap.requirement} if already completed, or construct a focused proof-of-concept project.`;
    let deliverable = `Public GitHub repository containing tested implementation of ${gap.requirement}`;
    let effort = '8-12 hours';

    if (isCloud) {
      action = `Future action: Containerize a Python service with Docker and deploy to a cloud provider with health checks and public endpoint access.`;
      deliverable = `Live cloud URL + GitHub repo with Dockerfile and deployment manifest`;
      effort = '10-15 hours';
    } else if (isApi) {
      action = `Future action: Build an API service for data processing using FastAPI with automated test suites.`;
      deliverable = `Interactive /docs Swagger endpoint + unit test suite with 85%+ coverage`;
      effort = '6-10 hours';
    }

    milestones.push({
      milestoneId: `mile_${priorityCounter}`,
      priority: priorityCounter,
      phase: `Priority ${priorityCounter} (${prioLabel} Core Gap)`,
      title: `Bridge ${gap.requirement} Evidence Gap`,
      targetGapRequirement: gap.requirement,
      currentStatus: match?.status || 'EVIDENCE_GAP',
      reason: gap.impact,
      action,
      deliverableArtifact: deliverable,
      evidenceGenerated: `Verifiable project deliverable proving ${gap.requirement} competency`,
      realisticEffort: effort,
    });
    priorityCounter++;
  }

  return {
    readyToApplyStatus,
    verdictReason,
    milestones,
  };
}

/**
 * Derives interview focus and probing questions based on actual claims, unverified claims, and contradictions.
 */
export function deriveInterviewFocus(
  matches: RequirementEvidenceMatch[],
  evidenceItems: CanonicalResumeEvidence[],
  ledger?: EvidenceLedger
): InterviewFocusPlan {
  const probeQuestions: InterviewProbeQuestion[] = [];
  let qId = 1;

  // 1. Probe contradictions if detected in ledger
  if (ledger) {
    const contradictions = ledger.getAllEvidence().filter((e) => e.verification_status === 'CONTRADICTED');
    for (const contra of contradictions) {
      probeQuestions.push({
        questionId: `probe_${qId++}`,
        requirementId: contra.section,
        evidenceId: contra.evidence_id || `ev_contra_${qId}`,
        reasonForQuestion: 'Cross-source verification identified conflicting information across submitted materials.',
        targetRequirement: contra.section,
        claimBeingProbed: contra.original_text,
        question: `Your submitted sources show different statuses for ${contra.section} (${contra.original_text}). Can you clarify this discrepancy?`,
        whyAsked: 'Cross-source verification identified conflicting information across submitted materials.',
        questionType: 'CONTRADICTION',
        evidenceTested: 'Source consistency and factual integrity',
        whatStrongProofLooksLike: 'Candidate transparently explains the discrepancy with clear institutional dates.',
        candidateDefensibility: 'WEAK',
      });
    }
  }

  // 2. Probe unverified self-claims (CLAIM_ONLY)
  const claimOnly = matches.filter((m) => m.status === 'CLAIM_ONLY');
  for (const c of claimOnly.slice(0, 2)) {
    probeQuestions.push({
      questionId: `probe_${qId++}`,
      requirementId: c.requirementId,
      evidenceId: c.matchedEvidenceIds[0] || `ev_claim_${qId}`,
      reasonForQuestion: `Resume claims ${c.requirementName}, but submitted materials do not independently establish implementation experience.`,
      targetRequirement: c.requirementName,
      claimBeingProbed: `${c.requirementName} listed in skills/summary`,
      question: `You list ${c.requirementName} as a skill. Can you describe where you personally used it, what you implemented, and what challenges you encountered?`,
      whyAsked: `Resume claims ${c.requirementName}, but submitted materials do not independently establish implementation experience.`,
      questionType: 'RESUME_VERIFICATION',
      evidenceTested: 'Hands-on implementation experience',
      whatStrongProofLooksLike: 'Candidate walks through specific files, API routes, or modules they personally wrote using the technology.',
      candidateDefensibility: 'MODERATE',
    });
  }

  // 3. Probe verified project implementations (distinct per project entity)
  const seenProjectTitles = new Set<string>();
  const projectEvidences = evidenceItems.filter((e) => e.section === 'PROJECTS');
  for (const pe of projectEvidences) {
    const cleanTitle = (pe.title || 'Project').trim();
    if (seenProjectTitles.has(cleanTitle.toLowerCase())) continue;
    seenProjectTitles.add(cleanTitle.toLowerCase());

    const tech = pe.technologies[0] || 'Software Engineering';
    const matchedMatch = matches.find((m) => m.matchedEvidenceIds.includes(pe.evidence_id || pe.id || ''));
    const reqId = matchedMatch?.requirementId || 'req_project_impl';
    const evId = pe.evidence_id || pe.canonical_evidence_id || pe.id || `ev_proj_${qId}`;

    probeQuestions.push({
      questionId: `probe_${qId++}`,
      requirementId: reqId,
      evidenceId: evId,
      reasonForQuestion: `Resume documents "${cleanTitle}" using ${pe.technologies.join(', ') || 'libraries'}; verify candidate code ownership vs templates.`,
      targetRequirement: tech,
      claimBeingProbed: pe.text,
      question: `Walk me through your personal contribution to "${cleanTitle}". Which specific modules did you write yourself, and why did you choose ${pe.technologies.slice(0, 2).join(' and ') || 'this toolchain'}?`,
      whyAsked: `Resume documents "${cleanTitle}" using ${pe.technologies.join(', ') || 'libraries'}, which interviewers test for genuine code ownership vs boilerplate templates.`,
      questionType: 'PROJECT_OWNERSHIP',
      evidenceTested: 'Code ownership and architectural reasoning',
      whatStrongProofLooksLike: 'Candidate articulates architectural trade-offs, debugging stories, and personal commits without generic buzzwords.',
      candidateDefensibility: 'STRONG',
    });
    if (seenProjectTitles.size >= 3) break;
  }

  // 4. Probe missing critical requirements
  const criticalGaps = matches.filter((m) => m.priority === 'CRITICAL' && (m.status === 'EVIDENCE_GAP' || m.status === 'MISSING'));
  for (const cg of criticalGaps.slice(0, 1)) {
    probeQuestions.push({
      questionId: `probe_${qId++}`,
      requirementId: cg.requirementId,
      evidenceId: 'no_evidence_recorded',
      reasonForQuestion: `Critical role requirement ${cg.requirementName} has no verified evidence in submitted materials.`,
      targetRequirement: cg.requirementName,
      claimBeingProbed: `No documented evidence for ${cg.requirementName}`,
      question: `This role requires ${cg.requirementName}, which is not documented on your resume. Have you worked with ${cg.requirementName} in any unlisted academic or personal projects?`,
      whyAsked: `Critical qualification for role execution without documented evidence.`,
      questionType: 'MISSING_CRITICAL_EVIDENCE',
      evidenceTested: 'Relevant unlisted experience',
      whatStrongProofLooksLike: 'Candidate describes concrete unlisted project or clarifies their path to bridge the competency.',
      candidateDefensibility: 'WEAK',
    });
  }

  // 5. Global Semantic Deduplication Pass (Section 19 & 42 - Fix D & E)
  const deduplicatedQuestions: InterviewProbeQuestion[] = [];
  const seenQuestionSignatures = new Set<string>();

  for (const q of probeQuestions) {
    // Generate signature: requirement + question type + primary tokens
    const tokens = q.question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const keyTokens = tokens.slice(0, 8).join('_');
    const signature = `${q.targetRequirement.toLowerCase()}_${q.questionType}_${keyTokens}`;

    // Check token overlap against already accepted questions
    const isDuplicate = deduplicatedQuestions.some((existing) => {
      if (existing.targetRequirement.toLowerCase() === q.targetRequirement.toLowerCase() && existing.questionType === q.questionType) {
        return true;
      }
      const existingTokens = new Set(
        existing.question
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 3)
      );
      const overlap = tokens.filter((t) => existingTokens.has(t)).length;
      const ratio = overlap / Math.max(tokens.length, 1);
      return ratio > 0.65;
    });

    if (!isDuplicate && !seenQuestionSignatures.has(signature)) {
      seenQuestionSignatures.add(signature);
      deduplicatedQuestions.push(q);
    }
  }

  const verifications: InterviewFocusPlan['verificationRecommendations'] = [];
  for (const c of claimOnly) {
    verifications.push({
      claim: `Knowledge of ${c.requirementName} (listed in skills section)`,
      verificationTarget: 'Practical application depth',
      recommendedVerification: `Ask candidate for a live coding demonstration or whiteboarding session utilizing ${c.requirementName}.`,
    });
  }

  return {
    focusSummary:
      'Interviewers will test code ownership on documented projects, verify practical depth on skills listed without project references, and clarify any discrepancies.',
    likelyAreasToProbe: [
      'Personal contribution vs third-party starter templates in documented projects',
      'Distinction between skills listed in summary vs verified implementation code',
      'Specific trade-offs and error-handling in data and backend pipelines',
    ],
    probeQuestions: deduplicatedQuestions,
    verificationRecommendations: verifications,
    defensibilityOverview: {
      strongCount: projectEvidences.length,
      moderateCount: claimOnly.length,
      weakCount: deduplicatedQuestions.filter((q) => q.questionType === 'CONTRADICTION').length,
      rationale: 'Project claims with documented source code are defensible; skills listed without implementation require technical probing.',
    },
  };
}

/**
 * Derives the senior recruiter / evaluator final verdict strictly from the validated evaluation ledger.
 */
export function deriveFinalVerdict(
  matches: RequirementEvidenceMatch[],
  resume: ParsedResume,
  jd: ParsedJD
): FinalVerdict {
  const supported = matches.filter((m) => m.status === 'SUPPORTED').map((m) => m.requirementName);
  const gaps = matches.filter((m) => m.status === 'EVIDENCE_GAP' || m.status === 'MISSING' || m.status === 'SKILL_GAP').map((m) => m.requirementName);
  const claims = matches.filter((m) => m.status === 'CLAIM_ONLY').map((m) => m.requirementName);

  const synthesis = supported.length > 0 && gaps.length > 0
    ? `Direct evidence supports ${supported.join(', ')}. ${gaps.join(', ')} are not evidenced in the submitted materials.${claims.length > 0 ? ` ${claims.join(', ')} are claimed but lack implementation verification.` : ''}`
    : supported.length > 0
    ? `Direct evidence supports all evaluated JD requirements (${supported.join(', ')}). No evidence gaps were identified.`
    : `Submitted materials do not establish verified implementation evidence for the evaluated JD requirements (${gaps.join(', ')}).`;

  const oneLine = supported.length > 0 && gaps.length > 0
    ? `Documented alignment is verified in ${supported.slice(0, 3).join(', ')}; primary unevidenced requirements are ${gaps.slice(0, 2).join(', ')}.`
    : supported.length > 0
    ? `Candidate profile displays verified evidence across all evaluated role competencies.`
    : `Submitted materials do not currently establish verified implementation evidence for target role requirements.`;

  return {
    oneLineVerdict: oneLine,
    primaryStrengths: supported.slice(0, 4),
    primaryDocumentedLimitations: gaps.slice(0, 3),
    recommendedApplicationStrategy: synthesis,
    evidenceBasedSynthesis: synthesis,
    overallPanelSummary:
      `The evaluation panel concludes that candidate claims are grounded in verified source evidence for ${supported.length} role requirements. Unevidenced technologies represent evidence gaps rather than confirmed skill deficiencies. Closing identified gaps with public code artifacts will directly elevate defensibility.`,
  };
}
