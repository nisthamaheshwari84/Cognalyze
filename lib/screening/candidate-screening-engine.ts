/**
 * CANDIDATE SCREENING ENGINE (Feature 2)
 * 
 * Truth Contracts:
 * 1. Evidence-first: Requirement -> Candidate Evidence -> Requirement-Level Comparison -> Traceable Assessment.
 * 2. Controlled 5 Evidence States:
 *    - SUPPORTED: Direct evidence supports the requirement.
 *    - PARTIALLY_SUPPORTED: Some evidence found, but full requirement not established.
 *    - EVIDENCE_NOT_FOUND: No supporting evidence identified in submitted materials (never "Candidate lacks X").
 *    - CONFLICTING: Contradictory evidence in candidate materials.
 *    - NEEDS_REVIEW: Ambiguous evidence or requirement.
 * 3. Technology Equivalence: MySQL does not satisfy PostgreSQL unless JD allows alternatives.
 * 4. Evidence Depth: Level 1 (Mentioned), Level 2 (Project), Level 3 (Work Experience), Level 4 (Quantified).
 * 5. Experience Calculation: Derived only from documented dates; overlaps flagged, zero guessing.
 * 6. No Personality Claims & No Future Performance Claims.
 * 7. Zero Arbitrary 0-100 Scores & Zero Autonomous Hire/Reject Verdicts.
 */

import { RoleDNA, StructuredRoleRequirement } from "@/lib/ai/role-dna";

export type EvidenceMatchState =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "EVIDENCE_NOT_FOUND"
  | "CONFLICTING"
  | "NEEDS_REVIEW";

export type EvidenceDepth =
  | "level_1_mentioned"
  | "level_2_project"
  | "level_3_work_experience"
  | "level_4_quantified";

export type EvidenceCoverageSummary =
  | "STRONG EVIDENCE COVERAGE"
  | "PARTIAL EVIDENCE COVERAGE"
  | "LIMITED EVIDENCE"
  | "NEEDS HUMAN REVIEW";

export interface RecruiterCorrection {
  requirementId: string;
  originalState: EvidenceMatchState;
  correctedState: EvidenceMatchState;
  reason: string;
  correctedAt: string;
}

export interface RequirementAssessmentItem {
  requirementId: string;
  requirementText: string;
  category: "required" | "preferred" | "experience" | "education" | "other";
  evidenceState: EvidenceMatchState;
  evidenceDepth: EvidenceDepth;
  candidateEvidence: string;
  sourceSection: string;
  sourceText: string;
  assessmentExplanation: string;
  isRecruiterAddedRequirement?: boolean;
  contextualNote?: string;
  whyChain: {
    roleRequirement: string;
    candidateEvidence: string;
    assessment: string;
    sourceSection: string;
  };
}

export interface CandidateScreeningDossier {
  candidateId: string;
  candidateName: string;
  email?: string;
  roleId: string;
  roleTitle: string;
  roleVersion: number;
  analyzedAt: string;
  overallCoverage: EvidenceCoverageSummary;
  narrativeSummary: string;
  coverageCounts: {
    totalAssessed: number;
    supportedCount: number;
    partialCount: number;
    notFoundCount: number;
    conflictingCount: number;
    needsReviewCount: number;
  };
  assessments: RequirementAssessmentItem[];
  detectedContradictions: {
    topic: string;
    statementA: string;
    statementB: string;
    reason: string;
  }[];
  documentedExperienceYears?: number;
  recruiterCorrections?: RecruiterCorrection[];
  originalResumeText: string;
}

// Canonical entity normalization mapping (deterministic)
const CANONICAL_SYNONYMS: Record<string, string> = {
  postgres: "postgresql",
  postgresql: "postgresql",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  golang: "go",
  kafka: "kafka",
  docker: "docker",
  fastapi: "fastapi",
  react: "react",
  reactjs: "react",
  nextjs: "next.js",
  "next.js": "next.js",
  node: "node.js",
  nodejs: "node.js",
  "node.js": "node.js",
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
  python: "python",
  java: "java",
};

/**
 * Normalizes a technical term to its canonical form
 */
export function normalizeTechTerm(term: string): string {
  const clean = term.toLowerCase().replace(/[^a-z0-9.]/g, "").trim();
  return CANONICAL_SYNONYMS[clean] || clean;
}

/**
 * Parses resume text into structured sections (Summary, Experience, Projects, Skills, Education)
 */
export function parseResumeSections(resumeText: string) {
  const lines = (resumeText || "").split(/\r?\n/);
  const sections: {
    summary: string[];
    experience: { title?: string; company?: string; dates?: string; bullets: string[] }[];
    projects: { title?: string; bullets: string[] }[];
    skills: string[];
    education: string[];
    other: string[];
  } = {
    summary: [],
    experience: [],
    projects: [],
    skills: [],
    education: [],
    other: [],
  };

  let currentSection = "summary";
  let currentExpBlock: { title?: string; company?: string; dates?: string; bullets: string[] } | null = null;
  let currentProjBlock: { title?: string; bullets: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const lower = line.toLowerCase();

    // Section header identification
    if (lower.startsWith("experience") || lower.startsWith("work experience") || lower.startsWith("employment history")) {
      currentSection = "experience";
      continue;
    }
    if (lower.startsWith("projects") || lower.startsWith("technical projects") || lower.startsWith("key projects")) {
      currentSection = "projects";
      continue;
    }
    if (lower.startsWith("skills") || lower.startsWith("technical skills") || lower.startsWith("core competencies")) {
      currentSection = "skills";
      continue;
    }
    if (lower.startsWith("education") || lower.startsWith("academics") || lower.startsWith("qualifications")) {
      currentSection = "education";
      continue;
    }

    if (currentSection === "experience") {
      // Check if line represents a job title/date line (e.g. "Software Engineer at Company X (2021-2024)")
      const dateMatch = line.match(/\b(20\d\d|19\d\d)\s*[-–—to]+\s*(20\d\d|present|current)\b/i);
      if (dateMatch || line.includes(" at ") || line.includes(" - ") && !line.startsWith("-")) {
        currentExpBlock = { title: line, bullets: [] };
        sections.experience.push(currentExpBlock);
      } else if (currentExpBlock) {
        currentExpBlock.bullets.push(line);
      } else {
        currentExpBlock = { title: "Work Experience", bullets: [line] };
        sections.experience.push(currentExpBlock);
      }
    } else if (currentSection === "projects") {
      if (!line.startsWith("-") && !line.startsWith("•") && line.length < 60) {
        currentProjBlock = { title: line, bullets: [] };
        sections.projects.push(currentProjBlock);
      } else if (currentProjBlock) {
        currentProjBlock.bullets.push(line);
      } else {
        currentProjBlock = { title: "Project", bullets: [line] };
        sections.projects.push(currentProjBlock);
      }
    } else if (currentSection === "skills") {
      sections.skills.push(line);
    } else if (currentSection === "education") {
      sections.education.push(line);
    } else {
      sections.summary.push(line);
    }
  }

  return sections;
}

/**
 * Calculates documented total employment duration from explicit date ranges.
 * Warns on overlaps and prevents double counting.
 */
const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

/**
 * Calculates documented total employment duration from explicit date ranges.
 * Merges overlapping calendar intervals to prevent tenure inflation and double-counting.
 */
export function calculateDocumentedExperienceYears(resumeText: string): {
  approxYears: number;
  rangesFound: string[];
  hasAmbiguousDates: boolean;
  totalNonOverlappingMonths: number;
  fullTimeYears: number;
  internshipYears: number;
} {
  const matches = Array.from(
    resumeText.matchAll(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*(20\d\d|19\d\d)\s*[-–—to]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*(20\d\d|present|current)\b/gi
    )
  );

  if (matches.length === 0) {
    return {
      approxYears: 0,
      rangesFound: [],
      hasAmbiguousDates: true,
      totalNonOverlappingMonths: 0,
      fullTimeYears: 0,
      internshipYears: 0,
    };
  }

  const currentYear = 2026;
  const currentMonth = 11;
  const rangesFound: string[] = [];
  const intervals: Array<{ startMonthIndex: number; endMonthIndex: number; isInternship: boolean }> = [];

  for (const m of matches) {
    const rawRange = m[0];
    rangesFound.push(rawRange);

    const startMonthStr = m[1]?.toLowerCase();
    const startYear = parseInt(m[2], 10);
    const startMonth = startMonthStr && MONTH_MAP[startMonthStr.slice(0, 3)] ? MONTH_MAP[startMonthStr.slice(0, 3)] : 1;

    const endMonthStr = m[3]?.toLowerCase();
    const endTerm = m[4]?.toLowerCase();
    const isPresent = endTerm === 'present' || endTerm === 'current';
    const endYear = isPresent ? currentYear : parseInt(m[4], 10);
    const endMonth = isPresent
      ? currentMonth
      : endMonthStr && MONTH_MAP[endMonthStr.slice(0, 3)]
      ? MONTH_MAP[endMonthStr.slice(0, 3)]
      : 12;

    if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear) {
      const startIndex = startYear * 12 + startMonth;
      const endIndex = endYear * 12 + endMonth;

      // Check surrounding context (60 characters before/after) to detect internship/freelance
      const matchIndex = m.index ?? 0;
      const contextWindow = resumeText.slice(Math.max(0, matchIndex - 60), Math.min(resumeText.length, matchIndex + 60)).toLowerCase();
      const isIntern = /\b(intern|internship|trainee|apprentice)\b/i.test(contextWindow);

      if (endIndex >= startIndex) {
        intervals.push({
          startMonthIndex: startIndex,
          endMonthIndex: endIndex,
          isInternship: isIntern,
        });
      }
    }
  }

  if (intervals.length === 0) {
    return {
      approxYears: 0,
      rangesFound,
      hasAmbiguousDates: true,
      totalNonOverlappingMonths: 0,
      fullTimeYears: 0,
      internshipYears: 0,
    };
  }

  // Merge overlapping intervals to get true calendar coverage
  const sorted = [...intervals].sort((a, b) => a.startMonthIndex - b.startMonthIndex);
  const merged: Array<{ start: number; end: number }> = [{ start: sorted[0].startMonthIndex, end: sorted[0].endMonthIndex }];

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];

    if (curr.startMonthIndex <= prev.end + 1) {
      prev.end = Math.max(prev.end, curr.endMonthIndex);
    } else {
      merged.push({ start: curr.startMonthIndex, end: curr.endMonthIndex });
    }
  }

  const totalNonOverlappingMonths = merged.reduce((sum, int) => sum + Math.max(1, int.end - int.start + 1), 0);
  const approxYears = Math.round((totalNonOverlappingMonths / 12) * 10) / 10;

  // Calculate internship vs full time non-overlapping months
  const internIntervals = intervals.filter((i) => i.isInternship).map((i) => ({ start: i.startMonthIndex, end: i.endMonthIndex }));
  const ftIntervals = intervals.filter((i) => !i.isInternship).map((i) => ({ start: i.startMonthIndex, end: i.endMonthIndex }));

  const mergeSimple = (list: Array<{ start: number; end: number }>) => {
    if (list.length === 0) return 0;
    const s = [...list].sort((a, b) => a.start - b.start);
    const m = [{ ...s[0] }];
    for (let i = 1; i < s.length; i++) {
      const p = m[m.length - 1];
      if (s[i].start <= p.end + 1) p.end = Math.max(p.end, s[i].end);
      else m.push({ ...s[i] });
    }
    return m.reduce((acc, x) => acc + Math.max(1, x.end - x.start + 1), 0);
  };

  const internshipMonths = mergeSimple(internIntervals);
  const ftMonths = mergeSimple(ftIntervals);

  return {
    approxYears,
    rangesFound,
    hasAmbiguousDates: false,
    totalNonOverlappingMonths,
    fullTimeYears: Math.round((ftMonths / 12) * 10) / 10,
    internshipYears: Math.round((internshipMonths / 12) * 10) / 10,
  };
}

/**
 * Evaluates a single role requirement against parsed candidate resume sections.
 */
export function evaluateRequirementAgainstCandidate(
  req: { id: string; name: string; category?: string; evidenceQuote?: string; source?: string },
  resumeText: string,
  sections: ReturnType<typeof parseResumeSections>
): RequirementAssessmentItem {
  const reqText = req.name;
  const lowerReq = reqText.toLowerCase();
  const lowerResume = resumeText.toLowerCase();
  const reqCategory = (req.category || "required") as RequirementAssessmentItem["category"];
  const isRecruiterAdded = req.source === "recruiter_added";

  // Check if requirement specifies a quantified years threshold (e.g. "5+ years", "3 years")
  const yearsMatch = reqText.match(/(\d+)\+?\s*years?/i) || (req.evidenceQuote ? req.evidenceQuote.match(/(\d+)\+?\s*years?/i) : null);
  const requiredYears = yearsMatch ? parseInt(yearsMatch[1], 10) : null;

  // Extract core keywords from requirement name (excluding noise words)
  const stopWords = new Set(["experience", "with", "and", "or", "in", "of", "the", "for", "years", "strong", "knowledge", "hands-on", "deep", "mastery"]);
  const keywords = lowerReq
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Check Technology Equivalence Guardrail:
  // If JD requires PostgreSQL specifically, and resume only mentions MySQL (without PostgreSQL):
  if (lowerReq.includes("postgresql") || lowerReq.includes("postgres")) {
    if (!lowerResume.includes("postgresql") && !lowerResume.includes("postgres")) {
      const mentionsMySQL = lowerResume.includes("mysql");
      return {
        requirementId: req.id,
        requirementText: reqText,
        category: reqCategory,
        evidenceState: "EVIDENCE_NOT_FOUND",
        evidenceDepth: "level_1_mentioned",
        candidateEvidence: mentionsMySQL ? "Resume mentions MySQL under database experience." : "No database experience documented.",
        sourceSection: mentionsMySQL ? "Skills / Projects" : "Submitted Materials",
        sourceText: mentionsMySQL ? "MySQL" : "Not present",
        assessmentExplanation: mentionsMySQL
          ? "The resume documents MySQL experience; this is related database experience but does not establish PostgreSQL experience."
          : "No PostgreSQL evidence was identified in the submitted resume.",
        contextualNote: mentionsMySQL ? "Related technology present: MySQL (not equivalent unless permitted by role criteria)." : undefined,
        isRecruiterAddedRequirement: isRecruiterAdded,
        whyChain: {
          roleRequirement: reqText,
          candidateEvidence: mentionsMySQL ? "MySQL" : "None identified",
          assessment: "PostgreSQL is not explicitly documented in candidate materials.",
          sourceSection: mentionsMySQL ? "Skills" : "Entire Resume"
        }
      };
    }
  }

  // 1. Search in Work Experience Bullets (Highest Evidence Level: Level 3 or 4)
  for (const exp of sections.experience) {
    for (const bullet of exp.bullets) {
      const lowerBullet = bullet.toLowerCase();
      const matchCount = keywords.filter(k => lowerBullet.includes(k) || lowerBullet.includes(normalizeTechTerm(k))).length;
      if (matchCount >= Math.min(2, keywords.length) || (keywords.length === 1 && lowerBullet.includes(keywords[0]))) {
        const isQuantified = /\b(\d+[%kKmM]|\d+\+?\s*tps|\d+\s*users|\d+\s*services|\d+\s*latency)\b/.test(bullet);

        // If required years specified, verify if candidate has sufficient duration
        if (requiredYears !== null) {
          const expCalculation = calculateDocumentedExperienceYears(resumeText);
          if (expCalculation.approxYears < requiredYears) {
            return {
              requirementId: req.id,
              requirementText: reqText,
              category: reqCategory,
              evidenceState: "PARTIALLY_SUPPORTED",
              evidenceDepth: isQuantified ? "level_4_quantified" : "level_3_work_experience",
              candidateEvidence: bullet,
              sourceSection: `Experience → ${exp.title || 'Role'}`,
              sourceText: bullet,
              assessmentExplanation: `The resume documents ${reqText} during professional employment, but documented duration (${expCalculation.approxYears} years) is below the stated ${requiredYears}+ years requirement.`,
              isRecruiterAddedRequirement: isRecruiterAdded,
              whyChain: {
                roleRequirement: reqText,
                candidateEvidence: bullet,
                assessment: `Documented duration (~${expCalculation.approxYears} yrs) does not fully establish stated ${requiredYears}+ years.`,
                sourceSection: `Experience → ${exp.title || 'Role'}`
              }
            };
          }
        }

        return {
          requirementId: req.id,
          requirementText: reqText,
          category: reqCategory,
          evidenceState: "SUPPORTED",
          evidenceDepth: isQuantified ? "level_4_quantified" : "level_3_work_experience",
          candidateEvidence: bullet,
          sourceSection: `Experience → ${exp.title || 'Role'}`,
          sourceText: bullet,
          assessmentExplanation: `Direct professional experience supports this requirement at ${exp.title || 'past employment'}.`,
          isRecruiterAddedRequirement: isRecruiterAdded,
          whyChain: {
            roleRequirement: reqText,
            candidateEvidence: bullet,
            assessment: "Direct professional experience supports the stated capability.",
            sourceSection: `Experience → ${exp.title || 'Role'}`
          }
        };
      }
    }
  }

  // 2. Search in Projects (Evidence Level: Level 2)
  for (const proj of sections.projects) {
    for (const bullet of proj.bullets) {
      const lowerBullet = bullet.toLowerCase();
      const matchCount = keywords.filter(k => lowerBullet.includes(k) || lowerBullet.includes(normalizeTechTerm(k))).length;
      if (matchCount >= Math.min(2, keywords.length) || (keywords.length === 1 && lowerBullet.includes(keywords[0]))) {
        return {
          requirementId: req.id,
          requirementText: reqText,
          category: reqCategory,
          evidenceState: requiredYears ? "PARTIALLY_SUPPORTED" : "SUPPORTED",
          evidenceDepth: "level_2_project",
          candidateEvidence: bullet,
          sourceSection: `Projects → ${proj.title || 'Project'}`,
          sourceText: bullet,
          assessmentExplanation: requiredYears
            ? `Demonstrated project implementation found in "${proj.title || 'Project'}", but project evidence alone does not verify ${requiredYears}+ years of production tenure.`
            : `Hands-on project evidence supports this capability in "${proj.title || 'Project'}".`,
          isRecruiterAddedRequirement: isRecruiterAdded,
          whyChain: {
            roleRequirement: reqText,
            candidateEvidence: bullet,
            assessment: "Documented project implementation demonstrates technical application.",
            sourceSection: `Projects → ${proj.title || 'Project'}`
          }
        };
      }
    }
  }

  // 3. Search in Skills List (Evidence Level: Level 1 - Mentioned Only)
  for (const skillLine of sections.skills) {
    const lowerSkill = skillLine.toLowerCase();
    const match = keywords.some(k => lowerSkill.includes(k) || lowerSkill.includes(normalizeTechTerm(k)));
    if (match) {
      return {
        requirementId: req.id,
        requirementText: reqText,
        category: reqCategory,
        evidenceState: "PARTIALLY_SUPPORTED",
        evidenceDepth: "level_1_mentioned",
        candidateEvidence: skillLine,
        sourceSection: "Skills",
        sourceText: skillLine,
        assessmentExplanation: `"${reqText}" is listed in candidate's flat skills list as a self-reported keyword (Level 1 Mentioned). It does not constitute demonstrated project implementation or production capability.`,
        isRecruiterAddedRequirement: isRecruiterAdded,
        whyChain: {
          roleRequirement: reqText,
          candidateEvidence: skillLine,
          assessment: "Skill is acknowledged in self-reported skills inventory without verified implementation.",
          sourceSection: "Skills"
        }
      };
    }
  }

  // 4. Search in Education section
  if (reqCategory === "education" || lowerReq.includes("degree") || lowerReq.includes("bachelor") || lowerReq.includes("computer science")) {
    for (const eduLine of sections.education) {
      const lowerEdu = eduLine.toLowerCase();
      if (lowerEdu.includes("bachelor") || lowerEdu.includes("b.tech") || lowerEdu.includes("b.e") || lowerEdu.includes("computer science") || lowerEdu.includes("degree")) {
        return {
          requirementId: req.id,
          requirementText: reqText,
          category: "education",
          evidenceState: "SUPPORTED",
          evidenceDepth: "level_3_work_experience",
          candidateEvidence: eduLine,
          sourceSection: "Education",
          sourceText: eduLine,
          assessmentExplanation: "Documented academic degree matches stated educational criteria.",
          isRecruiterAddedRequirement: isRecruiterAdded,
          whyChain: {
            roleRequirement: reqText,
            candidateEvidence: eduLine,
            assessment: "Academic qualification is documented in candidate materials.",
            sourceSection: "Education"
          }
        };
      }
    }
  }

  // 5. Default: EVIDENCE NOT FOUND (Truth Contract: Never say "Candidate lacks X")
  return {
    requirementId: req.id,
    requirementText: reqText,
    category: reqCategory,
    evidenceState: "EVIDENCE_NOT_FOUND",
    evidenceDepth: "level_1_mentioned",
    candidateEvidence: "No relevant mention identified in submitted resume.",
    sourceSection: "Submitted Materials",
    sourceText: "Not found",
    assessmentExplanation: `No ${reqText} evidence was identified in the submitted resume.`,
    isRecruiterAddedRequirement: isRecruiterAdded,
    whyChain: {
      roleRequirement: reqText,
      candidateEvidence: "No matching record",
      assessment: "Absence of documented evidence in candidate materials.",
      sourceSection: "Entire Resume"
    }
  };
}

/**
 * Screens a candidate against a confirmed role version.
 */
export function screenCandidateAgainstRole(
  candidate: { id: string; name: string; email?: string; phone?: string; resumeText: string },
  role: RoleDNA
): CandidateScreeningDossier {
  const sections = parseResumeSections(candidate.resumeText);
  const expCalc = calculateDocumentedExperienceYears(candidate.resumeText);

  // Requirements source: structuredRequirements if present, else tieredRequirements
  const requirementsToAssess: { id: string; name: string; category?: string; evidenceQuote?: string; source?: string }[] =
    role.structuredRequirements && role.structuredRequirements.length > 0
      ? role.structuredRequirements
      : role.tieredRequirements.map(t => ({
          id: t.id,
          name: t.name,
          category: t.tier === "Critical" ? "required" : "preferred",
          evidenceQuote: t.description,
          source: "job_description"
        }));

  // Assess each requirement independently
  const assessments = requirementsToAssess.map(req =>
    evaluateRequirementAgainstCandidate(req, candidate.resumeText, sections)
  );

  // Contradiction detection (e.g. Summary claims "10 years" but dates indicate ~2-3 years)
  const detectedContradictions: CandidateScreeningDossier["detectedContradictions"] = [];
  const fullCandidateText = sections.summary.join(" ") + " " + candidate.resumeText;
  const summaryYearsMatch = fullCandidateText.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:[a-z]+\s+)*experience/i);

  if (summaryYearsMatch) {
    const claimedYears = parseInt(summaryYearsMatch[1], 10);
    if (!isNaN(claimedYears) && expCalc.approxYears > 0 && claimedYears >= expCalc.approxYears + 3) {
      detectedContradictions.push({
        topic: "Experience Duration Discrepancy",
        statementA: `Resume states "${summaryYearsMatch[0]}".`,
        statementB: `Documented employment date ranges span approximately ${expCalc.approxYears} years (${expCalc.rangesFound.join(", ")}).`,
        reason: "Potential inconsistency detected between stated overall experience and documented employment dates."
      });

      // Mark affected experience assessments as CONFLICTING or NEEDS_REVIEW
      assessments.forEach(a => {
        if (a.category === "experience") {
          a.evidenceState = "CONFLICTING";
          a.assessmentExplanation = `Potential conflict: Resume states "${summaryYearsMatch[0]}", while date ranges indicate ~${expCalc.approxYears} years.`;
        }
      });
    }
  }

  // Count evidence states
  const supportedCount = assessments.filter(a => a.evidenceState === "SUPPORTED").length;
  const partialCount = assessments.filter(a => a.evidenceState === "PARTIALLY_SUPPORTED").length;
  const notFoundCount = assessments.filter(a => a.evidenceState === "EVIDENCE_NOT_FOUND").length;
  const conflictingCount = assessments.filter(a => a.evidenceState === "CONFLICTING").length;
  const needsReviewCount = assessments.filter(a => a.evidenceState === "NEEDS_REVIEW").length;
  const totalAssessed = assessments.length;

  // Determine overall evidence coverage description (Defensible description, never Hire/Reject verdict)
  let overallCoverage: EvidenceCoverageSummary = "PARTIAL EVIDENCE COVERAGE";
  if (conflictingCount > 0 || needsReviewCount > 0) {
    overallCoverage = "NEEDS HUMAN REVIEW";
  } else if (supportedCount / totalAssessed >= 0.7) {
    overallCoverage = "STRONG EVIDENCE COVERAGE";
  } else if (supportedCount / totalAssessed < 0.4) {
    overallCoverage = "LIMITED EVIDENCE";
  }

  // Narrative summary based solely on documented evidence
  let narrativeSummary = `Evaluated against confirmed role requirements for "${role.title}" (Version ${role.version || 1}). `;
  if (overallCoverage === "STRONG EVIDENCE COVERAGE") {
    narrativeSummary += `Most documented role requirements (${supportedCount}/${totalAssessed}) have direct supporting evidence in submitted materials.`;
  } else if (overallCoverage === "NEEDS HUMAN REVIEW") {
    narrativeSummary += `Ambiguous or conflicting signals were detected in candidate materials that require recruiter review.`;
  } else if (overallCoverage === "PARTIAL EVIDENCE COVERAGE") {
    narrativeSummary += `${supportedCount} requirements are supported, while ${partialCount} have partial evidence and ${notFoundCount} lack documentation in the resume.`;
  } else {
    narrativeSummary += `Limited evidence found relative to stated requirements (${notFoundCount}/${totalAssessed} requirements not documented).`;
  }

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    email: candidate.email,
    roleId: role.id,
    roleTitle: role.title,
    roleVersion: role.version || 1,
    analyzedAt: new Date().toISOString(),
    overallCoverage,
    narrativeSummary,
    coverageCounts: {
      totalAssessed,
      supportedCount,
      partialCount,
      notFoundCount,
      conflictingCount,
      needsReviewCount
    },
    assessments,
    detectedContradictions,
    documentedExperienceYears: expCalc.approxYears,
    originalResumeText: candidate.resumeText
  };
}
