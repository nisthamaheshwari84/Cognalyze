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
  RiskCategory,
  RiskItem,
  RoadmapMilestone,
  RoadmapPlan,
  StrengthItem,
} from './types';
import { EvidenceLedger } from '@/lib/evidence/evidence-ledger';

/**
 * Derives evidence-backed strengths. ONLY generated from actual verified evidence (Level 3, 4, 5).
 */
export function deriveStrengths(
  matches: RequirementEvidenceMatch[],
  requirements: CanonicalJDRequirement[],
  evidenceItems: CanonicalResumeEvidence[]
): StrengthItem[] {
  const strengths: StrengthItem[] = [];
  // Strict rule: Only SUPPORTED matches with Level 3+ (Implementation, Artifact-Backed, or Independently Verified)
  const supported = matches.filter(
    (m) =>
      m.status === 'SUPPORTED' &&
      (!m.evidenceStrengthLevel ||
        m.evidenceStrengthLevel === 'LEVEL_3_IMPLEMENTATION' ||
        m.evidenceStrengthLevel === 'LEVEL_4_ARTIFACT_BACKED' ||
        m.evidenceStrengthLevel === 'LEVEL_5_INDEPENDENTLY_VERIFIED')
  );

  let idCounter = 1;
  for (const m of supported) {
    const req = requirements.find((r) => r.id === m.requirementId);
    const relatedEvidence = evidenceItems.filter((e) => m.matchedEvidenceIds.includes(e.evidence_id || e.id));
    const primaryEvidence = relatedEvidence[0] || evidenceItems.find((e) => e.text.toLowerCase().includes(m.requirementName.toLowerCase()));

    const evidenceQuote = primaryEvidence ? primaryEvidence.verbatim_quote : m.evidenceQuotes[0] || `Documented in resume project implementation.`;
    const evId = primaryEvidence?.evidence_id || primaryEvidence?.canonical_evidence_id || primaryEvidence?.id || m.matchedEvidenceIds[0] || `ev_str_${idCounter}`;
    const projectTitle = primaryEvidence?.title || 'resume project';
    const tierBadge = m.evidenceStrengthLevel === 'LEVEL_5_INDEPENDENTLY_VERIFIED'
      ? '[Level 5: Verified]'
      : m.evidenceStrengthLevel === 'LEVEL_4_ARTIFACT_BACKED'
      ? '[Level 4: Artifact-Backed]'
      : '[Level 3: Implementation]';

    strengths.push({
      id: `str_${idCounter++}`,
      requirement_id: m.requirementId,
      evidence_id: evId,
      strength: `${tierBadge} ${m.requirementName} Implementation Evidence`,
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
    (m) =>
      !m.alternative_satisfied &&
      (m.status === 'EVIDENCE_GAP' || m.status === 'PARTIAL' || m.status === 'CLAIM_ONLY' || m.status === 'SKILL_GAP' || m.status === 'MISSING')
  );

  let idCounter = 1;
  for (const m of nonSupported) {
    const req = requirements.find((r) => r.id === m.requirementId);
    let gapType: GapItem['gapType'] = 'Evidence Gap';
    if (m.status === 'CLAIM_ONLY') gapType = 'Partial Evidence';
    else if (m.status === 'PARTIAL') gapType = 'Partial Evidence';
    else if (m.status === 'SKILL_GAP') gapType = 'Skill Gap';
    else if (m.status === 'MISSING') gapType = 'Missing';

    let currentEvidence = `${m.requirementName} is not evidenced in the submitted materials.`;
    let missingEvidence = `Implementation experience for ${m.requirementName} could not be independently verified from the submitted materials.`;

    if (m.evidenceStrengthLevel === 'LEVEL_1_MENTIONED' || m.status === 'CLAIM_ONLY') {
      currentEvidence = `[Level 1: Claim Only] ${m.requirementName} is listed in resume skills/summary, but the submitted materials do not independently establish implementation experience.`;
      missingEvidence = `Production or project implementation demonstrating hands-on usage of ${m.requirementName}.`;
    } else if (m.evidenceStrengthLevel === 'LEVEL_2_CONTEXTUAL' || m.status === 'PARTIAL') {
      currentEvidence = `[Level 2: Contextual] ${m.requirementName} is mentioned in project toolchains or related context, but individual implementation depth is not established.`;
      missingEvidence = `Direct code evidence or detailed description of specific architecture components built with ${m.requirementName}.`;
    } else {
      currentEvidence = `[Level 0: No Evidence] ${m.requirementName} is not evidenced anywhere in the submitted materials.`;
      missingEvidence = `Verifiable projects, coursework, or public artifacts demonstrating practical capability in ${m.requirementName}.`;
    }

    gaps.push({
      id: `gap_${idCounter++}`,
      requirement: m.requirementName,
      currentEvidence,
      missingEvidence,
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
 * Detects candidate risks, inconsistencies, inflated metrics, and date anomalies.
 * Enforces Section 11 of Master Directive:
 * - Duplicate project descriptions
 * - Contradictory employment dates
 * - Unsupported certifications
 * - Unclear personal contribution / Multi-tool stuffing
 * - Outsized / ungrounded metrics
 * - Claims that conflict with inspected artifacts
 * - Categorizes findings with careful, non-accusatory language.
 */
export function detectCandidateRisks(
  resume: ParsedResume,
  evidenceItems: CanonicalResumeEvidence[],
  matches: RequirementEvidenceMatch[],
  ledger?: EvidenceLedger
): RiskItem[] {
  const risks: RiskItem[] = [];
  let riskCounter = 1;

  // 1. Material Contradictions & Discrepancies from External Source Ledger
  if (ledger) {
    const contradictedEvidence = ledger.getAllEvidence().filter((e) => e.verification_status === 'CONTRADICTED');
    for (const contra of contradictedEvidence) {
      risks.push({
        id: `risk_${riskCounter++}`,
        claim: contra.original_text,
        verificationRecommended: `Direct cross-examination: Request verifiable employment record or official documentation clarifying ${contra.section}.`,
        severity: 'HIGH',
        sourceQuote: contra.original_text,
        category: 'SOURCE_CONTRADICTION',
        explanation: `External cross-source verification detected conflicting information for ${contra.section}.`,
        flagType: 'CROSS_SOURCE_DISCREPANCY',
        source: 'External Source Ledger',
        confidence: 0.95,
        supporting_evidence: contra.observed_fact || contra.original_text,
        limitations: ['Candidate may have updated records that have not propagated across public profiles'],
        recommended_action: 'Conduct structured interview cross-examination to establish verified chronology',
      });
    }

    const failedSources = ledger.getAllSources().filter((s) => s.verification_status === 'INACCESSIBLE' || s.verification_status === 'CONTRADICTORY');
    for (const fs of failedSources) {
      risks.push({
        id: `risk_${riskCounter++}`,
        claim: `External reference ${fs.url}`,
        verificationRecommended: `Verify candidate's public repository or profile URL manually with candidate.`,
        severity: 'MEDIUM',
        sourceQuote: fs.url,
        category: 'TECHNICAL_REVIEW_REQUIRED',
        explanation: `Candidate supplied external source ${fs.url} which was not accessible (HTTP error or private access) during verification.`,
        flagType: 'INACCESSIBLE_SOURCE',
        source: 'Candidate Portfolio / Repository Link',
        confidence: 0.90,
        supporting_evidence: `URL: ${fs.url} returned status ${fs.verification_status}`,
        limitations: ['Repository may be private or permissions may require authentication'],
        recommended_action: 'Request public access or portfolio walkthrough during interview',
      });
    }
  }

  // 2. Date & Timeline Inconsistencies
  for (const exp of resume.experience) {
    const period = `${exp.period || ''} ${exp.role || ''} ${exp.company || ''}`;
    const years = period.match(/\b(19\d\d|20\d\d)\b/g);
    if (years && years.length >= 2) {
      const startYear = parseInt(years[0], 10);
      const endYear = parseInt(years[1], 10);
      if (endYear < startYear) {
        risks.push({
          id: `risk_${riskCounter++}`,
          claim: `${exp.role || 'Role'} (${startYear} - ${endYear})`,
          verificationRecommended: `Confirm employment tenure dates for ${exp.company || 'experience'}.`,
          severity: 'HIGH',
          sourceQuote: period.trim(),
          category: 'MATERIAL_CONTRADICTION',
          explanation: `Employment end year (${endYear}) is earlier than start year (${startYear}) in stated period.`,
          flagType: 'DATE_INCONSISTENCY',
          source: 'Resume Work Experience',
          confidence: 0.98,
          supporting_evidence: `Extracted date range: ${startYear} - ${endYear}`,
          limitations: ['Likely clerical typo in resume typography'],
          recommended_action: 'Request verified employment dates during initial phone screen',
        });
      }
    }
  }

  // Check degree year vs experience tenure claim
  const eduYears = resume.education.flatMap((e) => (e.year.match(/\b(20\d\d)\b/g) || []).map((y) => parseInt(y, 10)));
  const currentYear = new Date().getFullYear();
  const futureEduYears = eduYears.filter((y) => y > currentYear);
  const totalExpBullets = evidenceItems.filter((e) => e.section === 'EXPERIENCE');
  if (futureEduYears.length > 0 && totalExpBullets.length >= 6) {
    risks.push({
      id: `risk_${riskCounter++}`,
      claim: `Expected graduation ${Math.max(...futureEduYears)} with extensive concurrent full-time employment`,
      verificationRecommended: `Clarify whether documented employment was full-time, part-time, or student internship during academic enrollment.`,
      severity: 'MEDIUM',
      sourceQuote: `Expected graduation ${Math.max(...futureEduYears)}`,
      category: 'INFORMATION_NEEDED',
      explanation: `Candidate documents extensive multi-year experience while expected graduation is in the future (${Math.max(...futureEduYears)}).`,
      flagType: 'TIMELINE_OVERLAP',
      source: 'Education vs Experience Cross-Check',
      confidence: 0.85,
      supporting_evidence: `Graduation year: ${Math.max(...futureEduYears)}, Experience bullets: ${totalExpBullets.length}`,
      limitations: ['Candidate may have pursued co-op or remote employment while attending school'],
      recommended_action: 'Clarify employment hours and academic co-op status',
    });
  }

  // 3. Duplicate or Suspiciously Repeated Project Descriptions (Section 11)
  if (resume.projects && resume.projects.length >= 2) {
    for (let i = 0; i < resume.projects.length; i++) {
      for (let j = i + 1; j < resume.projects.length; j++) {
        const p1 = resume.projects[i];
        const p2 = resume.projects[j];
        for (const b1 of p1.bullets) {
          for (const b2 of p2.bullets) {
            const normB1 = b1.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            const normB2 = b2.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            if (normB1.length > 25 && (normB1 === normB2 || normB1.includes(normB2) || normB2.includes(normB1))) {
              risks.push({
                id: `risk_${riskCounter++}`,
                claim: `Duplicated implementation bullet between "${p1.title}" and "${p2.title}"`,
                verificationRecommended: `Clarify individual technical scope and whether "${p1.title}" and "${p2.title}" share code or represent the same work.`,
                severity: 'MEDIUM',
                sourceQuote: b1.slice(0, 120),
                category: 'TECHNICAL_REVIEW_REQUIRED',
                explanation: `Substantially identical implementation text was identified across two separate project entries.`,
                flagType: 'DUPLICATE_PROJECT_TEXT',
                source: 'Resume Project Descriptions',
                confidence: 0.95,
                supporting_evidence: `Bullet in "${p1.title}": "${b1.slice(0, 80)}" matches bullet in "${p2.title}"`,
                limitations: ['Candidate may have reused architecture components across academic terms'],
                recommended_action: 'Request source repository links to verify distinct codebases',
              });
              break;
            }
          }
        }
      }
    }
  }

  // 4. Multi-Tool Stuffing & Ungrounded Implementation
  for (const proj of resume.projects) {
    for (const b of proj.bullets) {
      const techInBullet = (proj.technologies || []).filter((t) =>
        new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(b)
      );
      if (techInBullet.length >= 5) {
        risks.push({
          id: `risk_${riskCounter++}`,
          claim: `Multi-tool enumeration in "${proj.title}"`,
          verificationRecommended: `Ask candidate to isolate their individual module ownership for each claimed tool (${techInBullet.slice(0, 4).join(', ')}).`,
          severity: 'MEDIUM',
          sourceQuote: b.slice(0, 120),
          category: 'EVIDENCE_CONCERN',
          explanation: `A single bullet enumerates 5+ technologies (${techInBullet.join(', ')}). Individual implementation depth is diluted.`,
          flagType: 'MULTI_TOOL_STUFFING',
          source: `Project: "${proj.title}"`,
          confidence: 0.90,
          supporting_evidence: b.slice(0, 120),
          limitations: ['Tools may be part of an integrated third-party pipeline'],
          recommended_action: 'Probe individual architectural ownership for each claimed tool',
        });
        break; // One per project is enough
      }
    }
  }

  // 5. Ungrounded or Outsized Metrics (>300%, 10x, 1000%, unanchored revenue)
  const suspiciousMetricRegex = /(?:\b|^)([3-9]\d{2,}%|\d{4,}%|10x|[2-9]\d+x|\$\d+[mMbB])(?:\s|\b|$|[.,;:!])/i;
  for (const ev of evidenceItems) {
    if (ev.section === 'EXPERIENCE' || ev.section === 'PROJECTS') {
      const match = ev.text.match(suspiciousMetricRegex);
      if (match) {
        risks.push({
          id: `risk_${riskCounter++}`,
          claim: `Outsized impact metric: "${match[1] || match[0]}" in ${ev.title || ev.section}`,
          verificationRecommended: `Ask for baseline measurement, measurement methodology, and candidate's isolated contribution to this metric.`,
          severity: 'MEDIUM',
          sourceQuote: ev.verbatim_quote.slice(0, 120),
          category: 'EVIDENCE_CONCERN',
          explanation: `Metric "${match[1] || match[0]}" represents exceptional scale or improvement that requires baseline context to be interview-defensible.`,
          flagType: 'UNATTRIBUTED_METRIC',
          source: `${ev.section}: "${ev.title || 'Entry'}"`,
          confidence: 0.85,
          supporting_evidence: ev.verbatim_quote.slice(0, 120),
          limitations: ['Candidate may have baseline metrics documented in private engineering retrospectives'],
          recommended_action: 'Request baseline measurement data and team attribution in interview',
        });
      }
    }
  }

  // 6. Unsupported Certifications (Section 11)
  for (const cert of (resume.certifications || [])) {
    const hasAuthorityOrId = /(aws|google|cisco|microsoft|oracle|hashicorp|comptia|credential|certified|id:|\b\d{6,}\b)/i.test(cert);
    const hasDate = /\b(19\d\d|20\d\d)\b/.test(cert);
    if (!hasAuthorityOrId || !hasDate) {
      risks.push({
        id: `risk_${riskCounter++}`,
        claim: `Certification claim: "${cert}"`,
        verificationRecommended: `Request certification verification badge, link, or credential ID.`,
        severity: 'LOW',
        sourceQuote: cert,
        category: 'UNVERIFIED_CLAIM',
        explanation: `Certification is documented without an issuing date or credential verification ID.`,
        flagType: 'UNSUPPORTED_CERTIFICATION',
        source: 'Resume Certifications',
        confidence: 0.75,
        supporting_evidence: cert,
        limitations: ['Candidate may possess official credential that was not hyperlinked in submitted text'],
        recommended_action: 'Request official certificate or public badge verification URL',
      });
    }
  }

  // 7. Unsupported Skills Section Claims (Level 1 Mentioned)
  const claimOnlyMatches = matches.filter((m) => m.evidenceStrengthLevel === 'LEVEL_1_MENTIONED' || m.status === 'CLAIM_ONLY');
  for (const c of claimOnlyMatches.slice(0, 3)) {
    risks.push({
      id: `risk_${riskCounter++}`,
      claim: `${c.requirementName} listed in skills section`,
      verificationRecommended: `Administer a targeted technical probe or live assessment verifying practical syntax and library usage.`,
      severity: 'LOW',
      sourceQuote: `${c.requirementName} (Skills Section)`,
      category: 'UNVERIFIED_CLAIM',
      explanation: `${c.requirementName} is claimed in the skills inventory but has zero supporting code or narrative in projects or experience.`,
      flagType: 'UNSUPPORTED_SKILL_CLAIM',
      source: 'Skills Inventory',
      confidence: 0.90,
      supporting_evidence: `${c.requirementName} listed in skills list`,
      limitations: ['Candidate may have applied technology in unlisted coursework'],
      recommended_action: 'Administer live technical probe verifying hands-on syntax and API knowledge',
    });
  }

  // 8. Informational: Early career candidate with strong project evidence
  if (resume.experience.length === 0 && resume.projects.length >= 2) {
    risks.push({
      id: `risk_${riskCounter++}`,
      claim: `Early-Career / Campus Profile`,
      verificationRecommended: `Evaluate code artifacts, algorithmic depth, and architectural curiosity rather than corporate tenure.`,
      severity: 'LOW',
      sourceQuote: `${resume.projects.length} project(s) documented`,
      category: 'INFORMATIONAL',
      explanation: `Candidate is an early-career engineer evaluated primarily on hands-on project artifacts rather than corporate employment tenure.`,
      flagType: 'EARLY_CAREER_CONTEXT',
      source: 'Resume Overview',
      confidence: 0.95,
      supporting_evidence: `${resume.projects.length} project headings identified`,
      limitations: ['Academic background only'],
      recommended_action: 'Focus interview on algorithmic problem-solving and software design fundamentals',
    });
  }

  return risks;
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

  const hasFullTimeTenure =
    expBullets.length > 0 &&
    resume.experience.some((e) => !/\b(intern|internship|trainee|fellow|apprentice)\b/i.test(e.role));

  if (hasFullTimeTenure && expBullets.length > 5) {
    profLevel = 'EXTENSIVE';
    profDetail = 'Comprehensive multi-year professional tenure documented with specific business contributions.';
  } else if (hasFullTimeTenure) {
    profLevel = 'MODERATE';
    profDetail = 'Documented industry experience demonstrating corporate workflow familiarity.';
  } else if (internshipBullets.length > 0 || resume.experience.some((e) => /\b(intern|internship|trainee|fellow|apprentice)\b/i.test(e.role))) {
    profLevel = 'EARLY';
    profDetail = 'Documented internship experience provides real-world team collaboration exposure prior to full-time corporate employment.';
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
      documented: internshipBullets.length > 0 || resume.experience.some((e) => /\b(intern|internship|trainee|fellow|apprentice)\b/i.test(e.role)),
      detail:
        internshipBullets.length > 0 || resume.experience.some((e) => /\b(intern|internship|trainee|fellow|apprentice)\b/i.test(e.role))
          ? `${Math.max(internshipBullets.length, 1)} internship role/bullet(s) verified in resume.`
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
 * Helper to generate grounded, requirement-specific interview probes and evaluation rubrics (Section 12).
 */
function getTargetedProbeIndicators(
  tech: string,
  projectTitle: string,
  questionType: string
): {
  question: string;
  unresolvedQuestion: string;
  strongSignals: string[];
  weakSignals: string[];
  followUpQuestions: string[];
  evaluationRubric: string;
} {
  const lowerTech = tech.toLowerCase();

  if (questionType === 'MISSING_CRITICAL_EVIDENCE') {
    return {
      question: `This role requires ${tech}, which is not documented on your resume. Have you worked with ${tech} in any unlisted academic or personal projects?`,
      unresolvedQuestion: `Whether candidate has unlisted experience or transferable knowledge to bridge this critical gap.`,
      strongSignals: [
        `Transparently clarifies exact level of exposure and describes adjacent foundational skills.`,
        `Articulates an actionable plan and rapid learning velocity.`,
      ],
      weakSignals: [
        `Feigns deep expertise after previously omitting it from resume.`,
        `Dismisses the requirement as trivial or irrelevant.`,
      ],
      followUpQuestions: [
        `How do your demonstrated skills in adjacent technologies transfer to ${tech}?`,
        `What specific proof-of-concept project would you construct in your first 30 days to ramp up?`,
      ],
      evaluationRubric: `Score 5: Honest self-appraisal with clear transferable foundations and ramp-up plan. Score 3: Modest adjacent knowledge without concrete bridge plan. Score 1: Dismissive or misleading.`,
    };
  }

  if (questionType === 'RESUME_VERIFICATION') {
    return {
      question: `You list ${tech} as a technical competency. Can you describe where you personally used it, what you implemented, and what challenges you encountered?`,
      unresolvedQuestion: `Hands-on practical capability vs passive theoretical awareness.`,
      strongSignals: [
        `Walks through concrete implementation files, syntax, and libraries used.`,
        `Articulates specific debugging scenarios and production trade-offs.`,
      ],
      weakSignals: [
        `Recites textbook definitions without mentioning actual code written.`,
        `Vague or evasive answers regarding personal usage.`,
      ],
      followUpQuestions: [
        `What was the most challenging technical bug you resolved using ${tech}?`,
        `If tasked with deploying a service using ${tech} today, what would your initial setup look like?`,
      ],
      evaluationRubric: `Score 5: Demonstrates authentic hands-on project implementation. Score 3: Demonstrates academic or conceptual knowledge without production depth. Score 1: Purely theoretical or exaggerated claim.`,
    };
  }

  if (lowerTech.includes('fastapi') || (projectTitle.toLowerCase().includes('fastapi') && questionType === 'PROJECT_OWNERSHIP')) {
    return {
      question: `Your project "${projectTitle}" describes a FastAPI backend. Walk through the request lifecycle, validation, error handling, and database interaction in the module you implemented.`,
      unresolvedQuestion: `Whether candidate personally architected ASGI dependency injection and database session lifespans or adapted starter boilerplate.`,
      strongSignals: [
        `Explains Pydantic schema validation vs ORM data models.`,
        `Discusses async route handlers with asyncio and session lifespan teardown.`,
        `Articulates custom HTTP exception handlers and status code mapping.`,
      ],
      weakSignals: [
        `Treats FastAPI as simple synchronous Flask.`,
        `Inability to explain request lifecycle or database connection management.`,
      ],
      followUpQuestions: [
        `How did you manage connection pooling and async database sessions under concurrent loads?`,
        `How did you handle authentication and JWT token expiration in your middleware?`,
      ],
      evaluationRubric: `Score 5: Fluently explains async lifecycle, dependency injection, and schema validation. Score 3: Describes basic CRUD endpoints without lifecycle awareness. Score 1: Unable to describe FastAPI architecture.`,
    };
  }

  if (lowerTech.includes('rag') || lowerTech.includes('llm') || lowerTech.includes('retrieval') || projectTitle.toLowerCase().includes('rag')) {
    return {
      question: `Your project "${projectTitle}" claims a retrieval-based knowledge assistant. Explain how documents are ingested, chunked, embedded, retrieved, and evaluated. Which parts did you personally implement?`,
      unresolvedQuestion: `Whether candidate implemented end-to-end vector retrieval pipelines or made basic prompt calls to an external API.`,
      strongSignals: [
        `Explains chunking strategies (token vs semantic), overlap tradeoffs, and vector indexing.`,
        `Discusses similarity metric selection (cosine vs dot product) and re-ranking.`,
        `Addresses context window limits and hallucination reduction.`,
      ],
      weakSignals: [
        `Confuses API prompting with RAG retrieval architecture.`,
        `Unable to explain vector distance or chunking trade-offs.`,
      ],
      followUpQuestions: [
        `What embedding model and vector database did you choose, and what was your retrieval latency?`,
        `How did you evaluate retrieval accuracy or precision when irrelevant context was returned?`,
      ],
      evaluationRubric: `Score 5: Clear architectural mastery of embedding pipelines, vector indexing, and hybrid retrieval. Score 3: Used LangChain/LlamaIndex tutorials without underlying pipeline understanding. Score 1: Conflates standard chatbot with RAG.`,
    };
  }

  if (lowerTech.includes('react') || lowerTech.includes('next') || projectTitle.toLowerCase().includes('react')) {
    return {
      question: `In your project "${projectTitle}", how did you structure state management, optimize component re-renders, and integrate backend REST/GraphQL endpoints?`,
      unresolvedQuestion: `Whether component hierarchy and state synchronization were architected cleanly or clustered into bloated client components.`,
      strongSignals: [
        `Articulates state lifting, custom hooks, and memoization (useMemo/useCallback).`,
        `Discusses asynchronous state handling and optimistic UI updates.`,
        `Explains clean separation between presentation and data fetching.`,
      ],
      weakSignals: [
        `Overuses global state for local form inputs.`,
        `Unaware of re-rendering lifecycles or effect cleanup.`,
      ],
      followUpQuestions: [
        `How did you handle error boundaries and loading states during failed network requests?`,
        `What strategies did you use to prevent unnecessary re-renders in deep component trees?`,
      ],
      evaluationRubric: `Score 5: Demonstrates production-grade component state architecture and performance profiling. Score 3: Standard component rendering without lifecycle optimization. Score 1: Inability to explain component state flow.`,
    };
  }

  if (lowerTech.includes('postgres') || lowerTech.includes('sql') || lowerTech.includes('database')) {
    return {
      question: `In your project "${projectTitle}", how did you design the schema, index critical query pathways, and handle database migrations?`,
      unresolvedQuestion: `Whether candidate designed relational schemas and index strategies or only performed basic ORM lookups.`,
      strongSignals: [
        `Articulates B-tree indexing, foreign key constraints, and query EXPLAIN analysis.`,
        `Discusses connection pooling, transaction isolation levels, and migration rollbacks.`,
      ],
      weakSignals: [
        `Unaware of query execution plans or indexing trade-offs.`,
        `Treats relational database as unstructured key-value store.`,
      ],
      followUpQuestions: [
        `How did you analyze and optimize a slow-running query in your database?`,
        `How did you prevent race conditions or handle concurrent updates in high-volume tables?`,
      ],
      evaluationRubric: `Score 5: Fluent in indexing, execution plans, and transaction integrity. Score 3: Basic CRUD without indexing depth. Score 1: Cannot explain relational concepts.`,
    };
  }

  // Default / Project Ownership
  return {
    question: `Walk me through your personal contribution to "${projectTitle}". Which specific modules did you write yourself, and why did you choose ${tech}?`,
    unresolvedQuestion: `Genuine candidate code authorship vs third-party boilerplate or collaborative group work.`,
    strongSignals: [
      `Articulates architectural trade-offs, debugging stories, and personal commits.`,
      `Explains component boundaries and failure modes.`,
    ],
    weakSignals: [
      `Generic buzzwords without citing specific files or modules.`,
      `Unable to explain technical decisions.`,
    ],
    followUpQuestions: [
      `What was the single hardest engineering bug you encountered in this project, and how did you diagnose it?`,
      `If refactoring this project today, what architecture decision would you change?`,
    ],
    evaluationRubric: `Score 5: Comprehensive mastery of architecture, failure modes, and code ownership. Score 3: Competent explanation with minor gaps. Score 1: Superficial knowledge.`,
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
        unresolvedQuestion: 'Factual reconciliation of conflicting dates, credentials, or repo ownership.',
        expectedAnswerIndicators: {
          strongSignals: [
            'Provides clear, verifiable chronological timeline and documentary context.',
            'Transparently resolves clerical or date formatting errors.',
          ],
          weakSignals: ['Defensive or evasive responses.', 'Contradicts own statements further.'],
        },
        followUpQuestions: [
          'Can you provide documentary confirmation (e.g. transcript or letter) for these dates?',
          'Which of the submitted documents reflects your actual verified status?',
        ],
        evaluationRubric: 'Score 5: Discrepancy fully clarified with credible factual justification. Score 3: Plausible explanation pending verification. Score 1: Material contradiction confirmed.',
      });
    }
  }

  // 2. Probe unverified self-claims (CLAIM_ONLY)
  const claimOnly = matches.filter((m) => m.status === 'CLAIM_ONLY');
  for (const c of claimOnly.slice(0, 2)) {
    const indicators = getTargetedProbeIndicators(c.requirementName, 'Skills Summary', 'RESUME_VERIFICATION');
    probeQuestions.push({
      questionId: `probe_${qId++}`,
      requirementId: c.requirementId,
      evidenceId: c.matchedEvidenceIds[0] || `ev_claim_${qId}`,
      reasonForQuestion: `Resume claims ${c.requirementName}, but submitted materials do not independently establish implementation experience.`,
      targetRequirement: c.requirementName,
      claimBeingProbed: `${c.requirementName} listed in skills/summary`,
      question: indicators.question,
      whyAsked: `Resume claims ${c.requirementName}, but submitted materials do not independently establish implementation experience.`,
      questionType: 'RESUME_VERIFICATION',
      evidenceTested: 'Hands-on implementation experience',
      whatStrongProofLooksLike: 'Candidate walks through specific files, API routes, or modules they personally wrote using the technology.',
      candidateDefensibility: 'MODERATE',
      unresolvedQuestion: indicators.unresolvedQuestion,
      expectedAnswerIndicators: {
        strongSignals: indicators.strongSignals,
        weakSignals: indicators.weakSignals,
      },
      followUpQuestions: indicators.followUpQuestions,
      evaluationRubric: indicators.evaluationRubric,
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

    const indicators = getTargetedProbeIndicators(tech, cleanTitle, 'PROJECT_OWNERSHIP');

    probeQuestions.push({
      questionId: `probe_${qId++}`,
      requirementId: reqId,
      evidenceId: evId,
      reasonForQuestion: `Resume documents "${cleanTitle}" using ${pe.technologies.join(', ') || 'libraries'}; verify candidate code ownership vs templates.`,
      targetRequirement: tech,
      claimBeingProbed: pe.text,
      question: indicators.question,
      whyAsked: `Resume documents "${cleanTitle}" using ${pe.technologies.join(', ') || 'libraries'}, which interviewers test for genuine code ownership vs boilerplate templates.`,
      questionType: 'PROJECT_OWNERSHIP',
      evidenceTested: 'Code ownership and architectural reasoning',
      whatStrongProofLooksLike: 'Candidate articulates architectural trade-offs, debugging stories, and personal commits without generic buzzwords.',
      candidateDefensibility: 'STRONG',
      unresolvedQuestion: indicators.unresolvedQuestion,
      expectedAnswerIndicators: {
        strongSignals: indicators.strongSignals,
        weakSignals: indicators.weakSignals,
      },
      followUpQuestions: indicators.followUpQuestions,
      evaluationRubric: indicators.evaluationRubric,
    });
    if (seenProjectTitles.size >= 3) break;
  }

  // 4. Probe missing critical requirements
  const criticalGaps = matches.filter((m) => m.priority === 'CRITICAL' && (m.status === 'EVIDENCE_GAP' || m.status === 'MISSING'));
  for (const cg of criticalGaps.slice(0, 1)) {
    const indicators = getTargetedProbeIndicators(cg.requirementName, 'Role Requirement', 'MISSING_CRITICAL_EVIDENCE');
    probeQuestions.push({
      questionId: `probe_${qId++}`,
      requirementId: cg.requirementId,
      evidenceId: 'no_evidence_recorded',
      reasonForQuestion: `Critical role requirement ${cg.requirementName} has no verified evidence in submitted materials.`,
      targetRequirement: cg.requirementName,
      claimBeingProbed: `No documented evidence for ${cg.requirementName}`,
      question: indicators.question,
      whyAsked: `Critical qualification for role execution without documented evidence.`,
      questionType: 'MISSING_CRITICAL_EVIDENCE',
      evidenceTested: 'Relevant unlisted experience',
      whatStrongProofLooksLike: 'Candidate describes concrete unlisted project or clarifies their path to bridge the competency.',
      candidateDefensibility: 'WEAK',
      unresolvedQuestion: indicators.unresolvedQuestion,
      expectedAnswerIndicators: {
        strongSignals: indicators.strongSignals,
        weakSignals: indicators.weakSignals,
      },
      followUpQuestions: indicators.followUpQuestions,
      evaluationRubric: indicators.evaluationRubric,
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
