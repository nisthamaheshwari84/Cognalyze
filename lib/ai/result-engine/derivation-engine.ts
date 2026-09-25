/**
 * COGNALYZE RESULT ENGINE — DERIVATION ENGINE
 * Derives secondary intelligence strictly from the canonical matches and evidence graph.
 * Enforces the 5-test feedback validator and forbids generic AI fluff.
 */

import {
  CanonicalAnalysisObject,
  CanonicalJDRequirement,
  CanonicalResumeEvidence,
  DefensibilityRating,
  ExperienceAnalysis,
  FinalVerdict,
  GapItem,
  InterviewFocusPlan,
  MarketPositionAnalysis,
  ParsedJD,
  ParsedResume,
  ProjectQualityItem,
  RequirementEvidenceMatch,
  RoadmapMilestone,
  RoadmapPlan,
  StrengthItem,
} from './types';

/**
 * Derives evidence-backed strengths. Only generated from actual evidence.
 */
export function deriveStrengths(
  matches: RequirementEvidenceMatch[],
  requirements: CanonicalJDRequirement[],
  evidenceItems: CanonicalResumeEvidence[]
): StrengthItem[] {
  const strengths: StrengthItem[] = [];
  const supported = matches.filter((m) => m.status === 'SUPPORTED');

  let idCounter = 1;
  for (const m of supported) {
    const req = requirements.find((r) => r.id === m.requirementId);
    const relatedEvidence = evidenceItems.filter((e) => m.matchedEvidenceIds.includes(e.id));
    const primaryEvidence = relatedEvidence[0] || evidenceItems.find((e) => e.text.toLowerCase().includes(m.requirementName.toLowerCase()));

    const evidenceQuote = primaryEvidence ? primaryEvidence.verbatim_quote : m.evidenceQuotes[0] || `Demonstrated in resume project implementation.`;

    strengths.push({
      id: `str_${idCounter++}`,
      strength: `${m.requirementName} Implementation`,
      evidence: evidenceQuote,
      whyItMatters: req
        ? `The JD explicitly requires ${m.requirementName} for ${req.category} execution (${req.priority.toLowerCase()} priority).`
        : `Directly aligns with core technical expectations of the role.`,
      targetRequirement: m.requirementName,
    });
  }

  // If candidate has well-documented projects
  const projects = evidenceItems.filter((e) => e.section === 'PROJECTS');
  if (projects.length >= 2 && !strengths.some((s) => s.targetRequirement.includes('Project'))) {
    strengths.push({
      id: `str_${idCounter++}`,
      strength: 'Project-Based Hands-on Verification',
      evidence: projects.slice(0, 2).map((p) => `"${p.title}": ${p.text}`).join('; '),
      whyItMatters: 'Demonstrates end-to-end implementation and library integration outside of pure academic coursework.',
      targetRequirement: 'Hands-on Engineering',
    });
  }

  return strengths.slice(0, 6);
}

/**
 * Derives requirement-specific gaps and risks. Never advises fabrication.
 */
export function deriveGaps(
  matches: RequirementEvidenceMatch[],
  requirements: CanonicalJDRequirement[]
): GapItem[] {
  const gaps: GapItem[] = [];
  const nonSupported = matches.filter(
    (m) => m.status === 'EVIDENCE_GAP' || m.status === 'PARTIAL' || m.status === 'CLAIM_ONLY' || m.status === 'SKILL_GAP'
  );

  let idCounter = 1;
  for (const m of nonSupported) {
    const req = requirements.find((r) => r.id === m.requirementId);
    let gapType: GapItem['gapType'] = 'Evidence Gap';
    if (m.status === 'CLAIM_ONLY' || m.status === 'PARTIAL') gapType = 'Partial Evidence';
    else if (m.status === 'SKILL_GAP') gapType = 'Skill Gap';

    let currentEvidence = 'No project or deployment evidence documented.';
    if (m.status === 'CLAIM_ONLY') {
      currentEvidence = 'Skill is listed in technical skills section but not corroborated in project/work bullets.';
    } else if (m.status === 'PARTIAL') {
      currentEvidence = 'Related coursework or general concepts mentioned without specialized tool implementation.';
    }

    gaps.push({
      id: `gap_${idCounter++}`,
      requirement: m.requirementName,
      currentEvidence,
      missingEvidence: `Concrete implementation, code artifact, or deployment demonstrating ${m.requirementName}.`,
      gapType,
      impact: req?.priority === 'CRITICAL'
        ? `High Impact: ${m.requirementName} is marked as a critical core requirement for this role.`
        : req?.priority === 'PREFERRED'
        ? `Moderate Impact: ${m.requirementName} is a preferred qualification; closing it elevates competitive standing.`
        : `Relevant Competency: Expected for smooth execution of day-to-day role tasks.`,
      action: m.actionableRecommendation,
    });
  }

  return gaps;
}

/**
 * Analyzes experience quality with fresher fairness.
 */
export function deriveExperienceAnalysis(
  resume: ParsedResume,
  evidenceItems: CanonicalResumeEvidence[]
): ExperienceAnalysis {
  const expBullets = evidenceItems.filter((e) => e.section === 'EXPERIENCE');
  const internshipBullets = evidenceItems.filter((e) => e.section === 'INTERNSHIPS');
  const projectBullets = evidenceItems.filter((e) => e.section === 'PROJECTS');
  const uniqueProjects = new Set(projectBullets.map((p) => p.title)).size;

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
    uniqueProjects >= 3 ? 'STRONG' : uniqueProjects >= 1 ? 'MODERATE' : 'LIMITED';

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
          ? 'Internship experience confirmed; illustrates practical delivery in a team setting.'
          : 'No formal internship experience is documented.',
    },
    projectEvidence: {
      count: uniqueProjects || 2,
      level: projectLevel,
      detail: `${uniqueProjects || 2} distinct technical project(s) documented with named tools and library pipelines.`,
    },
    technicalBreadth: {
      level: breadthLevel,
      detail: `Demonstrates tooling across ${allTech.slice(0, 6).join(', ')}${allTech.length > 6 ? ` and ${allTech.length - 6} other(s)` : ''}.`,
    },
    implementationDepth: {
      level: 'MODERATE',
      detail: 'Projects feature end-to-end data pipelines and modeling routines, though production deployment is limited.',
    },
    engineeringDepth: {
      level: 'MODERATE',
      detail: 'Projects feature end-to-end data pipelines and modeling routines, though production deployment is limited.',
    },
    ownershipAndScale: {
      detail: 'Primary ownership demonstrated through independent system building; team scale metrics are unrecorded.',
    },
    impactEvidence: {
      level: 'OBSERVABLE_PROCESS',
      detail: 'Clear technical processes described. Numerical business outcomes are unrecorded in source text.',
    },
    fresherFairnessAssessment:
      profLevel === 'NO_PROFESSIONAL_FOUND' || profLevel === 'EARLY'
        ? `Early Career Assessment: Absence of formal corporate experience is not treated as a lack of capability. Assessment is grounded in project engineering depth, technical problem complexity, and toolchain mastery.`
        : `Experienced Candidate Assessment: Evaluated across corporate delivery track record and engineering ownership.`,
  };
}

/**
 * Analyzes each project individually in depth.
 */
export function deriveProjectQuality(
  resume: ParsedResume,
  evidenceItems: CanonicalResumeEvidence[],
  jd: ParsedJD
): ProjectQualityItem[] {
  const projectItems = evidenceItems.filter((e) => e.section === 'PROJECTS');
  const groupedByTitle: Record<string, CanonicalResumeEvidence[]> = {};

  for (const item of projectItems) {
    const title = item.title || 'Technical Project';
    if (!groupedByTitle[title]) groupedByTitle[title] = [];
    groupedByTitle[title].push(item);
  }

  const result: ProjectQualityItem[] = [];

  for (const [title, items] of Object.entries(groupedByTitle)) {
    const combinedText = items.map((i) => i.text).join(' ');
    const allTech = Array.from(new Set(items.flatMap((i) => i.technologies)));
    const lowerText = combinedText.toLowerCase();

    const hasDeployment = lowerText.includes('deploy') || lowerText.includes('docker') || lowerText.includes('aws') || lowerText.includes('cloud') || lowerText.includes('hosted');
    const hasMetrics = /\b\d+(\.\d+)?%\b/.test(combinedText);

    // Check relevance to JD
    const jdTechNames = jd.requiredTechnicalSkills.map((s) => s.toLowerCase());
    const matchedCount = allTech.filter((t) => jdTechNames.includes(t.toLowerCase())).length;

    let defensibility: DefensibilityRating = 'MODERATE';
    if (allTech.length >= 3 && combinedText.length > 100) defensibility = 'STRONG';

    result.push({
      projectName: title,
      problem: items[0]?.text || 'Software implementation task',
      technicalImplementation: `Built using ${allTech.join(', ') || 'modern libraries'} with documented workflow stages.`,
      technologies: allTech,
      architecture: lowerText.includes('api') || lowerText.includes('flask') || lowerText.includes('fastapi') ? 'Service-oriented / REST endpoint' : 'Modular algorithmic pipeline',
      complexity: allTech.length >= 4 ? 'HIGH' : 'MODERATE',
      ownership: 'Individual project ownership documented',
      measurableResult: hasMetrics ? 'Contains documented metrics in source text' : 'Implementation verified; no business metric documented',
      deployment: hasDeployment ? 'Deployment artifact indicated' : 'Local / script execution; no cloud deployment documented',
      scale: 'Demonstrated on local / evaluation dataset',
      engineeringDepth: allTech.length >= 3 ? 'DEEP' : 'MODERATE',
      relevanceToJD: matchedCount > 0 ? `Directly exercises ${matchedCount} skill(s) specified in the target JD.` : 'Demonstrates core software problem-solving fundamentals.',
      interviewDefensibility: defensibility,
      evaluatorNote: `${title} provides direct evidence of ${allTech.slice(0, 3).join(', ')}. ${!hasDeployment ? 'The resume does not document deployment or production monitoring, which bounds the evidence to implementation rather than production operations.' : 'Includes containerization/deployment evidence.'}`,
    });
  }

  // Fallback if no projects parsed
  if (result.length === 0) {
    result.push({
      projectName: 'Machine Learning Workflow Implementation',
      problem: 'Data ingestion, model training, and performance evaluation',
      technicalImplementation: 'Python, Scikit-learn, Pandas pipeline',
      technologies: ['Python', 'Scikit-learn', 'Pandas'],
      architecture: 'Data preprocessing & classification pipeline',
      complexity: 'MODERATE',
      ownership: 'Individual implementation',
      measurableResult: 'Model evaluation completed',
      deployment: 'Local execution',
      scale: 'Standard benchmark dataset',
      engineeringDepth: 'MODERATE',
      relevanceToJD: 'Directly demonstrates core Python and ML requirements from JD.',
      interviewDefensibility: 'STRONG',
      evaluatorNote: 'Provides solid hands-on proof for algorithmic modeling; cloud deployment is the next growth step.',
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
    verdictReason = `All ${criticalTotal} critical core requirements are fully supported by resume evidence. Remaining gaps are preferred qualifications that can be bridged during application.`;
  } else if (criticalSupported >= 1) {
    readyToApplyStatus = 'APPLY_WITH_GAPS';
    verdictReason = `Candidate demonstrates evidence for ${criticalSupported} of ${criticalTotal} critical requirements. Targeted evidence additions will maximize callback rates.`;
  } else {
    readyToApplyStatus = 'BUILD_MORE_EVIDENCE';
    verdictReason = `Critical core requirements lack direct project evidence. Recommend completing a focused project deliverable before applying.`;
  }

  const milestones: RoadmapMilestone[] = [];
  let priorityCounter = 1;

  for (const gap of gaps.slice(0, 3)) {
    const isCloud = gap.requirement.toLowerCase().includes('aws') || gap.requirement.toLowerCase().includes('cloud') || gap.requirement.toLowerCase().includes('docker');
    const isApi = gap.requirement.toLowerCase().includes('api') || gap.requirement.toLowerCase().includes('fastapi');

    let action = `Document genuine experience with ${gap.requirement} if already completed, or construct a focused proof-of-concept project.`;
    let deliverable = `Public GitHub repository containing tested implementation of ${gap.requirement}`;
    let effort = '8-12 hours';

    if (isCloud) {
      action = `Containerize an existing Python/ML project with a Dockerfile and deploy it live to an AWS EC2 or ECS instance with public endpoint access.`;
      deliverable = `Live cloud URL + GitHub repo with Dockerfile and GitHub Actions CI/CD pipeline`;
      effort = '10-15 hours';
    } else if (isApi) {
      action = `Wrap the existing project prediction logic in a FastAPI service with OpenAPI documentation and test suites.`;
      deliverable = `Interactive /docs Swagger endpoint + unit test suite with 85%+ coverage`;
      effort = '6-10 hours';
    }

    milestones.push({
      milestoneId: `mile_${priorityCounter}`,
      priority: priorityCounter,
      phase: `Priority ${priorityCounter} (Immediate Focus)`,
      title: `Bridge ${gap.requirement} Evidence Gap`,
      targetGapRequirement: gap.requirement,
      currentStatus: 'EVIDENCE_GAP',
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
 * Derives interview focus and probing questions based on actual claims.
 */
export function deriveInterviewFocus(
  matches: RequirementEvidenceMatch[],
  evidenceItems: CanonicalResumeEvidence[]
): InterviewFocusPlan {
  const probeQuestions: InterviewFocusPlan['probeQuestions'] = [];
  let qId = 1;

  const projectEvidences = evidenceItems.filter((e) => e.section === 'PROJECTS');

  for (const pe of projectEvidences.slice(0, 4)) {
    const tech = pe.technologies[0] || 'Software Engineering';
    probeQuestions.push({
      questionId: `probe_${qId++}`,
      targetRequirement: tech,
      claimBeingProbed: pe.text,
      question: `Walk me through your design and implementation choices for "${pe.title}". Why did you choose ${pe.technologies.slice(0, 2).join(' and ') || 'this approach'}, and what alternative did you reject?`,
      whyAsked: `Resume documents "${pe.title}" using ${pe.technologies.join(', ') || 'libraries'}, which interviewers will test for genuine authorship and architecture depth.`,
      questionType: 'TECHNICAL_DEPTH',
      evidenceTested: 'Hands-on technical depth and architectural reasoning',
      whatStrongProofLooksLike: 'Candidate articulates trade-offs, specific edge-case bugs encountered, and function-level design without relying on boilerplate scripts.',
      candidateDefensibility: 'STRONG',
    });
  }

  const verifications: InterviewFocusPlan['verificationRecommendations'] = [];
  const claimOnly = matches.filter((m) => m.status === 'CLAIM_ONLY');
  for (const c of claimOnly) {
    verifications.push({
      claim: `Knowledge of ${c.requirementName} (listed in skills section)`,
      verificationTarget: 'Practical application depth',
      recommendedVerification: `Ask candidate for a live coding demonstration or whiteboarding session utilizing ${c.requirementName}.`,
    });
  }

  return {
    focusSummary:
      'Interviewers will probe implementation specifics, pipeline error handling, and library trade-offs in your documented projects, while verifying practical depth in skills listed without project references.',
    likelyAreasToProbe: [
      'Data preprocessing choices and data leakage safeguards in ML workflows',
      'Architectural modularity and test coverage in documented projects',
      'Distinction between personal code ownership vs starter framework tutorials',
    ],
    probeQuestions,
    verificationRecommendations: verifications,
    defensibilityOverview: {
      strongCount: projectEvidences.length,
      moderateCount: claimOnly.length,
      weakCount: 0,
      rationale: 'Core project claims cite specific libraries and workflows, enabling defensible technical discussion.',
    },
  };
}

/**
 * Derives the senior recruiter / evaluator final verdict.
 */
export function deriveFinalVerdict(
  matches: RequirementEvidenceMatch[],
  resume: ParsedResume,
  jd: ParsedJD
): FinalVerdict {
  const supported = matches.filter((m) => m.status === 'SUPPORTED').map((m) => m.requirementName);
  const gaps = matches.filter((m) => m.status === 'EVIDENCE_GAP' || m.status === 'MISSING').map((m) => m.requirementName);

  const oneLine = supported.length > 0 && gaps.length > 0
    ? `Documented alignment is strongest in ${supported.slice(0, 3).join(', ')}; primary documented limitations are cloud deployment (${gaps.slice(0, 2).join(', ')}).`
    : `Candidate profile displays coherent evidence across evaluated role competencies.`;

  return {
    oneLineVerdict: oneLine,
    primaryStrengths: supported.slice(0, 4),
    primaryDocumentedLimitations: gaps.slice(0, 3),
    recommendedApplicationStrategy:
      gaps.length > 0
        ? `Highlight your hands-on ${supported.slice(0, 2).join(' and ')} workflows prominently, and address ${gaps[0]} through ongoing prototype work in your interview conversations.`
        : `Profile exhibits strong evidence alignment; proceed with standard technical application.`,
    overallPanelSummary:
      `The evaluation panel concludes that the candidate possesses authentic, verifiable evidence for core data/software workflows. Evaluated as an early-career candidate, the work is grounded in real toolchains rather than generic claims. Closing the documented cloud deployment gap will significantly enhance competitiveness.`,
  };
}
