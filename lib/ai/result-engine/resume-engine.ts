/**
 * COGNALYZE RESULT ENGINE — RESUME INGESTION ENGINE
 * Parses full resume text, preserving exact source location and verbatim evidence.
 * Integrates directly with EvidenceLedger, Claim Ledger, and URL Discovery.
 */

import crypto from 'crypto';
import {
  CanonicalResumeEvidence,
  EvidenceSectionType,
  EvidenceType,
  ParsedResume,
  NormalizedCandidateProfile,
} from './types';
import { matchTokenWithBoundaries, TECHNOLOGY_ONTOLOGY } from './ontology';
import { EvidenceLedger } from '@/lib/evidence/evidence-ledger';
import { discoverExternalUrls } from '@/lib/evidence/source-verifier';
import { detectEducationStatus, HARD_NON_EQUIVALENCE_RULES } from '@/lib/evidence/non-equivalence';
import { calculateDocumentedExperienceYears } from '@/lib/screening/candidate-screening-engine';

export interface ParseResumeResult extends ParsedResume {
  ledger: EvidenceLedger;
}

const isActionVerb = (txt: string): boolean =>
  /\b(developed|built|engineered|implemented|designed|created|trained|deployed|configured|integrated|optimized|refactored|architected|authored|wrote|constructed)\b/i.test(txt);

/**
 * Parses the full resume text and builds the structured evidence inventory and Evidence Ledger.
 */
export function parseResume(resumeText: string): ParseResumeResult {
  const raw = resumeText?.trim() || '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  const ledger = new EvidenceLedger(raw, 'resume.pdf');
  const evidenceItems: CanonicalResumeEvidence[] = [];
  const canonicalEvidenceMap = new Map<string, CanonicalResumeEvidence>();
  let evidenceCounter = 1;

  // Track candidate details
  let name = 'Candidate';
  let email = '';
  let phone = '';
  const links: string[] = [];
  let summary = '';

  const education: ParsedResume['education'] = [];
  const experience: ParsedResume['experience'] = [];
  const projects: ParsedResume['projects'] = [];
  const skillsCategorized: ParsedResume['skillsCategorized'] = [];
  const certifications: string[] = [];
  const achievements: string[] = [];
  const publications: string[] = [];
  const openSource: string[] = [];
  const hackathons: string[] = [];
  const leadership: string[] = [];

  // Parse header lines (name, contact)
  if (lines.length > 0 && !lines[0].includes(':') && lines[0].length < 50) {
    name = lines[0].replace(/^#+\s*/, '').trim();
  }

  for (const line of lines.slice(0, 10)) {
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];

    const phoneMatch = line.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) phone = phoneMatch[0];

    const urlMatches = line.match(/(?:https?:\/\/)?(?:www\.)?(github\.com\/[^\s,|]+|linkedin\.com\/in\/[^\s,|]+)/gi);
    if (urlMatches) {
      links.push(...urlMatches);
    }
  }

  // 1. External URL Discovery & Source Registration
  const discovered = discoverExternalUrls(raw);
  for (const ghUrl of discovered.githubUrls) {
    if (!links.includes(ghUrl)) links.push(ghUrl);
    const src = ledger.addSource({
      type: 'github',
      url: ghUrl,
      associated_claims: [],
      verification_status: 'DISCOVERED',
      checks_performed: [{ check: 'URL Discovered in Resume', result: 'PASSED', detail: ghUrl }],
    });
    const ev = ledger.addEvidence({
      source_type: 'github',
      source_url: ghUrl,
      source_document: 'resume.pdf',
      section: 'SUMMARY',
      original_text: ghUrl,
      observed_fact: `Candidate provides GitHub profile link: ${ghUrl}`,
      evidence_type: 'profile_link',
      verification_status: 'SELF_CLAIM',
      supports: [],
      does_not_prove: ['Git & Version Control', 'Git', 'version control', 'Git workflow', 'commit activity'],
      checks_performed: [{ check: 'URL Discovered in Resume', result: 'PASSED', detail: ghUrl }],
    });
    evidenceItems.push({
      id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
      type: 'profile_link',
      evidence_type: 'PROFILE_LINK',
      canonical_evidence_id: ev.evidence_id,
      section: 'SUMMARY',
      title: 'GitHub Profile Link',
      text: ghUrl,
      technologies: [],
      source_location: { section: 'SUMMARY', item: 'Profile Link', line: 1 },
      verbatim_quote: ghUrl,
      evidence_id: ev.evidence_id,
      source_type: 'github',
      source_url: ghUrl,
      observed_fact: ev.observed_fact,
      verification_status: 'SELF_CLAIM',
      supports: [],
      does_not_prove: ['Git & Version Control', 'Git', 'version control', 'Git workflow'],
      checks_performed: ev.checks_performed,
    });
  }
  for (const liUrl of discovered.linkedinUrls) {
    if (!links.includes(liUrl)) links.push(liUrl);
    ledger.addSource({
      type: 'linkedin',
      url: liUrl,
      associated_claims: [],
      verification_status: 'DISCOVERED',
      checks_performed: [{ check: 'URL Discovered in Resume', result: 'PASSED', detail: liUrl }],
    });
  }
  for (const lcUrl of discovered.leetcodeUrls) {
    if (!links.includes(lcUrl)) links.push(lcUrl);
    ledger.addSource({
      type: 'leetcode',
      url: lcUrl,
      associated_claims: [],
      verification_status: 'DISCOVERED',
      checks_performed: [{ check: 'URL Discovered in Resume', result: 'PASSED', detail: lcUrl }],
    });
  }
  for (const depUrl of discovered.deploymentUrls) {
    if (!links.includes(depUrl)) links.push(depUrl);
    ledger.addSource({
      type: 'deployment',
      url: depUrl,
      associated_claims: [],
      verification_status: 'DISCOVERED',
      checks_performed: [{ check: 'URL Discovered in Resume', result: 'PASSED', detail: depUrl }],
    });
  }

  // Helper to determine non-equivalence exclusions (what this evidence does NOT prove)
  const getNonEquivalenceExclusions = (techs: string[]): string[] => {
    const doesNotProve: string[] = [];
    for (const rule of HARD_NON_EQUIVALENCE_RULES) {
      for (const t of techs) {
        const lowerT = t.toLowerCase();
        if (rule.forbiddenBroaderOrPeers.includes(lowerT)) {
          if (!doesNotProve.includes(rule.target)) {
            doesNotProve.push(rule.target);
          }
        }
      }
    }
    return doesNotProve;
  };

  // Section Tracking State Machine
  let currentSection: EvidenceSectionType = 'SUMMARY';
  let currentItemTitle = '';
  let currentBulletIdx = 0;
  let activeExpRole: any = null;
  let activeProject: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line
      .toUpperCase()
      .replace(/^[\d+.\-•*#\s]+/, '')
      .replace(/[:\-—–|#*]+$/g, '')
      .trim();

    // Section Header Detectors
    if (
      upper === 'SUMMARY' ||
      upper === 'PROFESSIONAL SUMMARY' ||
      upper === 'ABOUT' ||
      upper === 'PROFILE'
    ) {
      currentSection = 'SUMMARY';
      currentItemTitle = 'Summary';
      currentBulletIdx = 0;
      continue;
    }
    if (
      upper === 'EXPERIENCE' ||
      upper === 'WORK EXPERIENCE' ||
      upper === 'PROFESSIONAL EXPERIENCE' ||
      upper === 'EMPLOYMENT'
    ) {
      currentSection = 'EXPERIENCE';
      currentItemTitle = '';
      currentBulletIdx = 0;
      continue;
    }
    if (upper === 'INTERNSHIPS' || upper === 'INTERNSHIP EXPERIENCE') {
      currentSection = 'INTERNSHIPS';
      currentItemTitle = '';
      currentBulletIdx = 0;
      continue;
    }
    if (
      upper === 'PROJECTS' ||
      upper === 'TECHNICAL PROJECTS' ||
      upper === 'KEY PROJECTS' ||
      upper === 'ACADEMIC PROJECTS' ||
      upper === 'PERSONAL PROJECTS' ||
      upper === 'SELECTED WORK' ||
      upper === 'EXPERIENCE & PROJECTS' ||
      upper === 'PROJECTS & EXPERIENCE'
    ) {
      currentSection = 'PROJECTS';
      currentItemTitle = '';
      currentBulletIdx = 0;
      continue;
    }
    if (
      upper === 'SKILLS' ||
      upper === 'TECHNICAL SKILLS' ||
      upper === 'CORE COMPETENCIES' ||
      upper === 'SKILLS & TOOLS'
    ) {
      currentSection = 'SKILLS';
      currentItemTitle = 'Technical Skills';
      currentBulletIdx = 0;
      continue;
    }
    if (
      upper === 'EDUCATION' ||
      upper === 'ACADEMIC BACKGROUND' ||
      upper === 'ACADEMICS'
    ) {
      currentSection = 'EDUCATION';
      currentItemTitle = '';
      currentBulletIdx = 0;
      continue;
    }
    if (
      upper === 'CERTIFICATIONS' ||
      upper === 'LICENSES & CERTIFICATIONS' ||
      upper === 'CERTIFICATES'
    ) {
      currentSection = 'CERTIFICATIONS';
      currentItemTitle = 'Certifications';
      currentBulletIdx = 0;
      continue;
    }
    if (upper === 'ACHIEVEMENTS' || upper === 'HONORS & AWARDS') {
      currentSection = 'ACHIEVEMENTS';
      currentItemTitle = 'Achievements';
      currentBulletIdx = 0;
      continue;
    }
    if (upper === 'PUBLICATIONS') {
      currentSection = 'PUBLICATIONS';
      currentItemTitle = 'Publications';
      currentBulletIdx = 0;
      continue;
    }
    if (upper === 'OPEN SOURCE' || upper === 'OPEN-SOURCE CONTRIBUTIONS') {
      currentSection = 'OPEN_SOURCE';
      currentItemTitle = 'Open Source';
      currentBulletIdx = 0;
      continue;
    }
    if (upper === 'HACKATHONS') {
      currentSection = 'HACKATHONS';
      currentItemTitle = 'Hackathons';
      currentBulletIdx = 0;
      continue;
    }
    if (
      upper === 'LEADERSHIP' ||
      upper === 'POSITIONS OF RESPONSIBILITY' ||
      upper === 'EXTRACURRICULAR'
    ) {
      currentSection = 'LEADERSHIP';
      currentItemTitle = 'Leadership';
      currentBulletIdx = 0;
      continue;
    }

    // Technology Detection for this line
    const lowerLine = line.toLowerCase();
    const detectedTech: string[] = [];
    for (const [key, node] of Object.entries(TECHNOLOGY_ONTOLOGY)) {
      // Rule 6: GitHub/GitLab URL is a PROFILE_LINK and must NOT automatically detect Git & Version Control
      if (node.canonicalName === 'Git & Version Control') {
        const lineWithoutUrls = line.replace(/(?:https?:\/\/)?(?:www\.)?(github\.com|gitlab\.com|bitbucket\.org)[^\s,|]*/gi, '');
        const hasExplicitGit = /\bgit\b/i.test(lineWithoutUrls);
        const hasVersionControl = /\bversion control\b/i.test(lineWithoutUrls);
        if (!hasExplicitGit && !hasVersionControl) {
          continue;
        }
      }

      const allTerms = [node.canonicalName.toLowerCase(), ...node.synonyms.map((s) => s.toLowerCase())];
      const match = allTerms.some((term) => {
        // Special guard for short ambiguous tokens like 'go'
        if (term === 'go') {
          return /\b(golang|go programming)\b/i.test(line) || /\bGo\b/.test(line);
        }
        if (term === 'github' || term === 'gitlab') {
          return false;
        }
        return matchTokenWithBoundaries(line, term);
      });
      if (match && !detectedTech.includes(node.canonicalName)) {
        detectedTech.push(node.canonicalName);
      }
    }

    const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\./.test(line);
    const cleanLine = line.replace(/^([-•*]|\d+\.)\s*/, '').trim();

    // Deduplication & canonical ID helper (Section 31)
    const getCanonicalTracking = (textKey: string, section: EvidenceSectionType, itemTitle: string, lineNum: number) => {
      const normKey = textKey.toLowerCase().trim();
      let canonId = `E-${String(evidenceCounter).padStart(3, '0')}`;
      let occurrences: any[] = [{ section, item: itemTitle || section, line: lineNum }];
      const existing = canonicalEvidenceMap.get(normKey);
      if (existing) {
        canonId = existing.canonical_evidence_id || existing.evidence_id || existing.id;
        if (!existing.occurrences) existing.occurrences = [existing.source_location];
        existing.occurrences.push({ section, item: itemTitle || section, line: lineNum });
        occurrences = existing.occurrences;
      }
      return { canonId, occurrences, existing };
    };

    // Section specific parsing
    if (currentSection === 'PROJECTS') {
      const candidateTitle = cleanLine.replace(/^[-•*#\d.]+\s*/, '').replace(/[:\-—–|.]+$/g, '').trim();
      const isAction = isActionVerb(cleanLine);
      const isTitleLine =
        !isAction &&
        candidateTitle.length >= 2 &&
        candidateTitle.length < 75 &&
        (
          !activeProject ||
          !isBullet ||
          cleanLine.includes('|') ||
          cleanLine.includes(':') ||
          candidateTitle.split(' ').length <= 6
        );

      if (isTitleLine) {
        // Project Title heading
        currentItemTitle = candidateTitle;
        currentBulletIdx = 0;
        activeProject = {
          title: candidateTitle,
          technologies: [...detectedTech],
          bullets: [],
        };
        projects.push(activeProject);

        // Register in Claim Ledger
        const claim = ledger.addClaim({
          claim_text: `Built ${candidateTitle}`,
          claim_type: 'project',
          source_section: 'PROJECTS',
          evidence_ids: [],
          status: 'SELF_CLAIM',
          external_verification: 'NONE',
          verification_notes: 'Project claimed in resume document.',
        });

        // Add Evidence Record for project heading
        const ev = ledger.addEvidence({
          source_type: 'resume',
          source_document: 'resume.pdf',
          section: 'PROJECTS',
          original_text: line,
          observed_fact: `Candidate lists project "${candidateTitle}" in Projects section`,
          evidence_type: 'self_claim',
          verification_status: 'SELF_CLAIM',
          supports: detectedTech,
          does_not_prove: ['independently_verified_implementation', ...getNonEquivalenceExclusions(detectedTech)],
          checks_performed: [
            { check: 'Document text extraction', result: 'PASSED', detail: `Line ${i + 1}` },
          ],
        });
        claim.evidence_ids.push(ev.evidence_id);
      } else if (cleanLine.length > 8) {
        currentBulletIdx++;
        if (activeProject) {
          activeProject.bullets.push(cleanLine);
          for (const t of detectedTech) {
            if (!activeProject.technologies.includes(t)) activeProject.technologies.push(t);
          }
        }

        const isAction = isActionVerb(cleanLine);
        const evType: EvidenceType = isAction ? 'DIRECT_IMPLEMENTATION' : 'PROJECT_USAGE';
        const { canonId, occurrences, existing } = getCanonicalTracking(cleanLine, 'PROJECTS', currentItemTitle, i + 1);

        const ev = ledger.addEvidence({
          source_type: 'resume',
          source_document: 'resume.pdf',
          section: 'PROJECTS',
          original_text: line,
          observed_fact: `Project "${currentItemTitle || 'Project'}" implementation: ${cleanLine}`,
          evidence_type: isAction ? 'project_implementation' : 'resume_context',
          verification_status: 'RESUME_SUPPORTED',
          supports: detectedTech,
          does_not_prove: getNonEquivalenceExclusions(detectedTech),
          checks_performed: [
            { check: 'Source quote verification', result: 'PASSED', detail: `Line ${i + 1}` },
          ],
        });

        const evItem: CanonicalResumeEvidence = {
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: 'project',
          evidence_type: evType,
          canonical_evidence_id: canonId,
          occurrences,
          section: 'PROJECTS',
          title: currentItemTitle || 'Documented Project',
          text: cleanLine,
          technologies: detectedTech,
          source_location: {
            section: 'PROJECTS',
            item: currentItemTitle || 'Documented Project',
            bullet: currentBulletIdx,
            line: i + 1,
          },
          verbatim_quote: line,
          evidence_id: ev.evidence_id,
          source_type: 'resume',
          observed_fact: ev.observed_fact,
          verification_status: ev.verification_status,
          supports: ev.supports,
          does_not_prove: ev.does_not_prove,
          checks_performed: ev.checks_performed,
        };
        evidenceItems.push(evItem);
        if (!existing) canonicalEvidenceMap.set(cleanLine.toLowerCase().trim(), evItem);
      }
    } else if (currentSection === 'EXPERIENCE' || currentSection === 'INTERNSHIPS') {
      const candidateTitle = cleanLine.replace(/^[-•*#\d.]+\s*/, '').replace(/[:\-—–|.]+$/g, '').trim();
      const isAction = isActionVerb(cleanLine);
      const isIntern = /\b(intern|internship|trainee|fellow|apprentice)\b/i.test(cleanLine);
      const effectiveSection: EvidenceSectionType = (isIntern || currentSection === 'INTERNSHIPS') ? 'INTERNSHIPS' : 'EXPERIENCE';

      const isRoleTitle =
        !isAction &&
        candidateTitle.length >= 2 &&
        candidateTitle.length < 80 &&
        (!activeExpRole || !isBullet || isIntern || candidateTitle.split(' ').length <= 8);

      if (isRoleTitle) {
        currentItemTitle = candidateTitle;
        currentBulletIdx = 0;

        let cleanTitleWithoutPeriod = candidateTitle;
        let extractedPeriod = '';

        // Extract dates in parentheses or trailing date ranges: e.g. (2024 - 2021) or (Jan 2020 - Present)
        const parenPeriodMatch = candidateTitle.match(/\(([^)]*(?:19\d\d|20\d\d|present)[^)]*)\)/i);
        if (parenPeriodMatch) {
          extractedPeriod = parenPeriodMatch[1].trim();
          cleanTitleWithoutPeriod = candidateTitle.replace(parenPeriodMatch[0], '').trim();
        } else {
          const trailingPeriodMatch = candidateTitle.match(/[-–—|]\s*((?:19\d\d|20\d\d)\s*[-–—to]+\s*(?:19\d\d|20\d\d|present|current))\s*$/i);
          if (trailingPeriodMatch) {
            extractedPeriod = trailingPeriodMatch[1].trim();
            cleanTitleWithoutPeriod = candidateTitle.replace(trailingPeriodMatch[0], '').trim();
          }
        }

        // Split role and company without breaking on hyphens inside dates or names
        const roleParts = cleanTitleWithoutPeriod.split(/\s*[@|]\s*|\s+at\s+|\s+[-–—]\s+|,\s*/i).map((s) => s.trim()).filter(Boolean);
        const parsedRole = roleParts[0] || cleanTitleWithoutPeriod;
        const parsedCompany = roleParts.length > 1 ? roleParts[1] : '';

        activeExpRole = {
          role: parsedRole,
          company: parsedCompany,
          period: extractedPeriod,
          bullets: [],
        };
        experience.push(activeExpRole);

        const ev = ledger.addEvidence({
          source_type: 'resume',
          source_document: 'resume.pdf',
          section: effectiveSection,
          original_text: line,
          observed_fact: isIntern ? `Candidate documents internship: ${candidateTitle}` : `Candidate documents employment role: ${candidateTitle}`,
          evidence_type: isIntern ? 'internship' : 'resume_context',
          verification_status: 'SELF_CLAIM',
          supports: detectedTech,
          does_not_prove: getNonEquivalenceExclusions(detectedTech),
          checks_performed: [
            { check: 'Document text extraction', result: 'PASSED', detail: `Line ${i + 1}` },
          ],
        });

        const evItem: CanonicalResumeEvidence = {
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: effectiveSection === 'INTERNSHIPS' ? 'internship' : 'experience',
          evidence_type: isIntern ? 'INTERNSHIP' : 'EMPLOYMENT',
          canonical_evidence_id: `E-${String(evidenceCounter).padStart(3, '0')}`,
          occurrences: [{ section: effectiveSection, item: candidateTitle, line: i + 1 }],
          section: effectiveSection,
          title: candidateTitle,
          text: candidateTitle,
          technologies: detectedTech,
          source_location: {
            section: effectiveSection,
            item: candidateTitle,
            line: i + 1,
          },
          verbatim_quote: line,
          evidence_id: ev.evidence_id,
          source_type: 'resume',
          observed_fact: ev.observed_fact,
          verification_status: ev.verification_status,
          supports: ev.supports,
          does_not_prove: ev.does_not_prove,
          checks_performed: ev.checks_performed,
        };
        evidenceItems.push(evItem);

        ledger.addClaim({
          claim_text: `Role ${candidateTitle}`,
          claim_type: isIntern ? 'internship' : 'experience',
          source_section: effectiveSection,
          evidence_ids: [ev.evidence_id],
          status: 'SELF_CLAIM',
          external_verification: 'NONE',
          verification_notes: isIntern ? 'Internship declared in resume.' : 'Employment role declared in resume.',
        });
      } else if (cleanLine.length > 3) {
        const isDateLine = /^\(?\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:19\d\d|20\d\d)\s*[-–—to]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:19\d\d|20\d\d)|present|current))\s*\)?$/i.test(cleanLine.trim());
        if (isDateLine && activeExpRole && !activeExpRole.period) {
          activeExpRole.period = cleanLine.replace(/[()]/g, '').trim();
          continue;
        }

        currentBulletIdx++;
        if (activeExpRole) activeExpRole.bullets.push(cleanLine);

        const isAction = isActionVerb(cleanLine);
        const evType: EvidenceType = isAction ? 'DIRECT_IMPLEMENTATION' : (effectiveSection === 'INTERNSHIPS' ? 'INTERNSHIP' : 'EMPLOYMENT');
        const { canonId, occurrences, existing } = getCanonicalTracking(cleanLine, effectiveSection, currentItemTitle, i + 1);

        const ev = ledger.addEvidence({
          source_type: 'resume',
          source_document: 'resume.pdf',
          section: effectiveSection,
          original_text: line,
          observed_fact: `Work experience at "${currentItemTitle || 'Work'}": ${cleanLine}`,
          evidence_type: isAction ? 'work_implementation' : 'resume_context',
          verification_status: 'RESUME_SUPPORTED',
          supports: detectedTech,
          does_not_prove: getNonEquivalenceExclusions(detectedTech),
          checks_performed: [
            { check: 'Source quote verification', result: 'PASSED', detail: `Line ${i + 1}` },
          ],
        });

        const evItem: CanonicalResumeEvidence = {
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: effectiveSection === 'INTERNSHIPS' ? 'internship' : 'experience',
          evidence_type: evType,
          canonical_evidence_id: canonId,
          occurrences,
          section: effectiveSection,
          title: currentItemTitle || (effectiveSection === 'INTERNSHIPS' ? 'Internship' : 'Work Experience'),
          text: cleanLine,
          technologies: detectedTech,
          source_location: {
            section: effectiveSection,
            item: currentItemTitle || (effectiveSection === 'INTERNSHIPS' ? 'Internship' : 'Work Experience'),
            bullet: currentBulletIdx,
            line: i + 1,
          },
          verbatim_quote: line,
          evidence_id: ev.evidence_id,
          source_type: 'resume',
          observed_fact: ev.observed_fact,
          verification_status: ev.verification_status,
          supports: ev.supports,
          does_not_prove: ev.does_not_prove,
          checks_performed: ev.checks_performed,
        };
        evidenceItems.push(evItem);
        if (!existing) canonicalEvidenceMap.set(cleanLine.toLowerCase().trim(), evItem);
      }
    } else if (currentSection === 'SKILLS') {
      if (cleanLine.length > 2) {
        const parts = cleanLine.split(':');
        let cat = parts.length > 1 ? parts[0].trim() : '';
        const items = (parts.length > 1 ? parts[1] : parts[0])
          .split(/[,|•/]/)
          .map((s) => s.trim())
          .filter(Boolean);

        if (items.length > 0) {
          // If no explicit category given on line, classify items using ontology
          if (!cat) {
            const hasLang = items.some((it) => {
              const node = Object.values(TECHNOLOGY_ONTOLOGY).find(
                (n) => n.canonicalName.toLowerCase() === it.toLowerCase() || n.synonyms.some((s) => s.toLowerCase() === it.toLowerCase())
              );
              return node?.category === 'language';
            });
            const hasDb = items.some((it) => {
              const node = Object.values(TECHNOLOGY_ONTOLOGY).find(
                (n) => n.canonicalName.toLowerCase() === it.toLowerCase() || n.synonyms.some((s) => s.toLowerCase() === it.toLowerCase())
              );
              return node?.category === 'database';
            });
            const hasCloud = items.some((it) => {
              const node = Object.values(TECHNOLOGY_ONTOLOGY).find(
                (n) => n.canonicalName.toLowerCase() === it.toLowerCase() || n.synonyms.some((s) => s.toLowerCase() === it.toLowerCase())
              );
              return node?.category === 'cloud' || node?.category === 'devops';
            });

            if (hasLang && !hasDb && !hasCloud) cat = 'Programming Languages';
            else if (hasDb && !hasLang) cat = 'Databases';
            else if (hasCloud && !hasLang) cat = 'Cloud & DevOps';
            else cat = 'Technical Skills';
          }

          // Deduplicate category labels (Fix B: never repeat "General Skills" or duplicate categories)
          const existingCat = skillsCategorized.find((c) => c.category.toLowerCase() === cat.toLowerCase());
          if (existingCat) {
            for (const item of items) {
              if (!existingCat.items.some((it) => it.toLowerCase() === item.toLowerCase())) {
                existingCat.items.push(item);
              }
            }
          } else {
            skillsCategorized.push({ category: cat, items });
          }

        // Add claim for each individual listed skill
        for (const item of items) {
          ledger.addClaim({
            claim_text: `Uses ${item}`,
            claim_type: 'skill',
            source_section: 'SKILLS',
            evidence_ids: [],
            status: 'SELF_CLAIM',
            external_verification: 'NONE',
            verification_notes: `Candidate lists ${item} in ${cat}. A candidate claim is NOT automatically evidence of implementation.`,
          });
        }

          const { canonId, occurrences, existing } = getCanonicalTracking(cleanLine, 'SKILLS', cat, i + 1);
          const ev = ledger.addEvidence({
            source_type: 'resume',
            source_document: 'resume.pdf',
            section: 'SKILLS',
            original_text: line,
            observed_fact: `Candidate lists skills in ${cat}: ${items.join(', ')}`,
            evidence_type: 'self_claim',
            verification_status: 'SELF_CLAIM',
            supports: detectedTech,
            does_not_prove: ['verified_implementation', ...getNonEquivalenceExclusions(detectedTech)],
            checks_performed: [
              { check: 'Source quote verification', result: 'PASSED', detail: `Line ${i + 1}` },
            ],
          });

          const evItem: CanonicalResumeEvidence = {
            id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
            type: 'skill_claim',
            evidence_type: 'SKILL_LIST',
            canonical_evidence_id: canonId,
            occurrences,
            section: 'SKILLS',
            title: cat,
            text: cleanLine,
            technologies: detectedTech,
            source_location: {
              section: 'SKILLS',
              item: cat,
              bullet: 1,
              line: i + 1,
            },
            verbatim_quote: line,
            evidence_id: ev.evidence_id,
            source_type: 'resume',
            observed_fact: ev.observed_fact,
            verification_status: ev.verification_status,
            supports: ev.supports,
            does_not_prove: ev.does_not_prove,
            checks_performed: ev.checks_performed,
          };
          evidenceItems.push(evItem);
          if (!existing) canonicalEvidenceMap.set(cleanLine.toLowerCase().trim(), evItem);
        }
      }
    } else if (currentSection === 'EDUCATION') {
      if (cleanLine.length >= 3) {
        // If line is a GPA or detail line for the preceding education entry
        const isGpaLine = /^(?:cgpa|gpa|grade|score|percentage|honors)\b/i.test(cleanLine);
        if (isGpaLine && education.length > 0) {
          const prev = education[education.length - 1];
          const gpaMatch = cleanLine.match(/(?:gpa|cgpa|grade|score)?\s*:?\s*(\d+(?:\.\d+)?)\s*(?:\/|\s*out of\s*)\s*(\d+(?:\.\d+)?)/i);
          if (gpaMatch) {
            prev.gpa = gpaMatch[1];
            prev.gpaScale = parseFloat(gpaMatch[2]);
          } else {
            const simpleGpaMatch = cleanLine.match(/(?:gpa|cgpa)\s*:?\s*(\d+\.\d+)/i);
            if (simpleGpaMatch) {
              prev.gpa = simpleGpaMatch[1];
              const val = parseFloat(prev.gpa);
              prev.gpaScale = val > 4.0 ? 10 : 4;
            }
          }
          prev.details = `${prev.details} | ${cleanLine}`;
          continue;
        }

        const eduStatus = detectEducationStatus(cleanLine);
        // Extract institution strictly if present in source, else keep empty (Section 19 & 21)
        let inst = '';
        const instMatch = cleanLine.match(/(?:at|from|,)\s+([A-Za-z\s]+(?:University|College|Institute|Academy|School)[A-Za-z\s]*)/i);
        if (instMatch) {
          inst = instMatch[1].trim();
        }
        const gradYear = cleanLine.match(/\b(20\d{2})\b/)?.[0] || '';
        const isGraduatedInText = /\b(graduated|degree awarded|completed)\b/i.test(cleanLine);
        const yearDisplay = gradYear || (eduStatus === 'CURRENTLY_PURSUING' ? 'Expected' : isGraduatedInText ? 'Graduated' : '');

        let gpa: string | undefined = undefined;
        let gpaScale: number | undefined = undefined;
        const gpaMatch = cleanLine.match(/(?:gpa|cgpa|grade|score)?\s*:?\s*(\d+(?:\.\d+)?)\s*(?:\/|\s*out of\s*)\s*(\d+(?:\.\d+)?)/i);
        if (gpaMatch) {
          gpa = gpaMatch[1];
          gpaScale = parseFloat(gpaMatch[2]);
        } else {
          const simpleGpaMatch = cleanLine.match(/(?:gpa|cgpa)\s*:?\s*(\d+\.\d+)/i);
          if (simpleGpaMatch) {
            gpa = simpleGpaMatch[1];
            const val = parseFloat(gpa);
            gpaScale = val > 4.0 ? 10 : 4;
          }
        }

        education.push({
          degree: cleanLine,
          institution: inst,
          year: yearDisplay,
          gpa,
          gpaScale,
          details: cleanLine,
        });

        const { canonId, occurrences, existing } = getCanonicalTracking(cleanLine, 'EDUCATION', cleanLine, i + 1);
        ledger.addClaim({
          claim_text: `Education: ${cleanLine}`,
          claim_type: 'education',
          source_section: 'EDUCATION',
          evidence_ids: [],
          status: 'SELF_CLAIM',
          external_verification: 'NONE',
          verification_notes: `Education status evaluated: ${eduStatus}`,
        });

        const ev = ledger.addEvidence({
          source_type: 'resume',
          source_document: 'resume.pdf',
          section: 'EDUCATION',
          original_text: line,
          observed_fact: `Candidate documents education: ${cleanLine} (Status: ${eduStatus})`,
          evidence_type: 'education',
          verification_status: 'SELF_CLAIM',
          supports: detectedTech,
          does_not_prove: ['hands_on_implementation', 'production_scale', 'commercial_experience', 'independent_project', ...getNonEquivalenceExclusions(detectedTech)],
          checks_performed: [
            { check: 'Source quote verification', result: 'PASSED', detail: `Line ${i + 1}` },
          ],
        });

        const evItem: CanonicalResumeEvidence = {
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: 'education',
          evidence_type: 'EDUCATION',
          canonical_evidence_id: canonId,
          occurrences,
          section: 'EDUCATION',
          title: cleanLine,
          text: cleanLine,
          technologies: detectedTech,
          source_location: {
            section: 'EDUCATION',
            item: cleanLine,
            line: i + 1,
          },
          verbatim_quote: line,
          evidence_id: ev.evidence_id,
          source_type: 'resume',
          observed_fact: ev.observed_fact,
          verification_status: ev.verification_status,
          supports: ev.supports,
          does_not_prove: ev.does_not_prove,
          checks_performed: ev.checks_performed,
        };
        evidenceItems.push(evItem);
        if (!existing) canonicalEvidenceMap.set(cleanLine.toLowerCase().trim(), evItem);
      }
    } else if (currentSection === 'SUMMARY') {
      if (cleanLine.length > 15) {
        summary = summary ? `${summary} ${cleanLine}` : cleanLine;
        const { canonId, occurrences, existing } = getCanonicalTracking(cleanLine, 'SUMMARY', 'Professional Summary', i + 1);

        const ev = ledger.addEvidence({
          source_type: 'resume',
          source_document: 'resume.pdf',
          section: 'SUMMARY',
          original_text: line,
          observed_fact: `Candidate states in summary: ${cleanLine}`,
          evidence_type: 'self_claim',
          verification_status: 'SELF_CLAIM',
          supports: detectedTech,
          does_not_prove: ['verified_implementation', ...getNonEquivalenceExclusions(detectedTech)],
          checks_performed: [
            { check: 'Source quote verification', result: 'PASSED', detail: `Line ${i + 1}` },
          ],
        });

        const evItem: CanonicalResumeEvidence = {
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: 'summary_claim',
          evidence_type: 'EXPLICIT_CLAIM',
          canonical_evidence_id: canonId,
          occurrences,
          section: 'SUMMARY',
          title: 'Professional Summary',
          text: cleanLine,
          technologies: detectedTech,
          source_location: {
            section: 'SUMMARY',
            item: 'Professional Summary',
            line: i + 1,
          },
          verbatim_quote: line,
          evidence_id: ev.evidence_id,
          source_type: 'resume',
          observed_fact: ev.observed_fact,
          verification_status: ev.verification_status,
          supports: ev.supports,
          does_not_prove: ev.does_not_prove,
          checks_performed: ev.checks_performed,
        };
        evidenceItems.push(evItem);
        if (!existing) canonicalEvidenceMap.set(cleanLine.toLowerCase().trim(), evItem);
      }
    } else if (currentSection === 'CERTIFICATIONS') {
      if (cleanLine.length > 3) {
        certifications.push(cleanLine);
        const { canonId, occurrences, existing } = getCanonicalTracking(cleanLine, 'CERTIFICATIONS', cleanLine, i + 1);

        const ev = ledger.addEvidence({
          source_type: 'resume',
          source_document: 'resume.pdf',
          section: 'CERTIFICATIONS',
          original_text: line,
          observed_fact: `Candidate lists certification: ${cleanLine}`,
          evidence_type: 'profile_stats',
          verification_status: 'SELF_CLAIM',
          supports: detectedTech,
          does_not_prove: ['independent_credential_verification'],
          checks_performed: [
            { check: 'Source quote verification', result: 'PASSED', detail: `Line ${i + 1}` },
          ],
        });

        const evItem: CanonicalResumeEvidence = {
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: 'certification',
          evidence_type: 'CERTIFICATION',
          canonical_evidence_id: canonId,
          occurrences,
          section: 'CERTIFICATIONS',
          title: cleanLine,
          text: cleanLine,
          technologies: detectedTech,
          source_location: { section: 'CERTIFICATIONS', item: cleanLine, line: i + 1 },
          verbatim_quote: line,
          evidence_id: ev.evidence_id,
          source_type: 'resume',
          observed_fact: ev.observed_fact,
          verification_status: ev.verification_status,
          supports: ev.supports,
          does_not_prove: ev.does_not_prove,
          checks_performed: ev.checks_performed,
        };
        evidenceItems.push(evItem);
        if (!existing) canonicalEvidenceMap.set(cleanLine.toLowerCase().trim(), evItem);
      }
    } else if (currentSection === 'ACHIEVEMENTS') {
      if (cleanLine.length > 3) achievements.push(cleanLine);
    } else if (currentSection === 'LEADERSHIP') {
      if (cleanLine.length > 3) leadership.push(cleanLine);
    }
  }

  // Extract typed skill arrays (Fix A: Languages populated cleanly)
  const languages: string[] = [];
  const frameworks: string[] = [];
  const databases: string[] = [];
  const cloud: string[] = [];
  const tools: string[] = [];

  for (const sc of skillsCategorized) {
    const catLower = sc.category.toLowerCase();
    for (const it of sc.items) {
      const node = Object.values(TECHNOLOGY_ONTOLOGY).find(
        (n) => n.canonicalName.toLowerCase() === it.toLowerCase() || n.synonyms.some((s) => s.toLowerCase() === it.toLowerCase())
      );
      if (node?.category === 'language' || catLower.includes('language')) {
        if (!languages.some((l) => l.toLowerCase() === it.toLowerCase())) languages.push(it);
      } else if (node?.category === 'framework' || node?.category === 'library' || catLower.includes('framework')) {
        if (!frameworks.some((f) => f.toLowerCase() === it.toLowerCase())) frameworks.push(it);
      } else if (node?.category === 'database' || catLower.includes('database')) {
        if (!databases.some((d) => d.toLowerCase() === it.toLowerCase())) databases.push(it);
      } else if (node?.category === 'cloud' || node?.category === 'devops' || catLower.includes('cloud')) {
        if (!cloud.some((c) => c.toLowerCase() === it.toLowerCase())) cloud.push(it);
      } else {
        if (!tools.some((t) => t.toLowerCase() === it.toLowerCase())) tools.push(it);
      }
    }
  }

  // Calculate unique source lines to prevent evidence inflation (Rule 12)
  const uniqueSourceLines = new Set(evidenceItems.map((e) => e.source_location.line)).size;

  const sourceHash = crypto.createHash('sha256').update(raw).digest('hex');
  const expCalc = calculateDocumentedExperienceYears(raw);
  const experienceBreakdown = {
    totalNonOverlappingYears: expCalc.approxYears,
    fullTimeYears: expCalc.fullTimeYears,
    internshipYears: expCalc.internshipYears,
    totalNonOverlappingMonths: expCalc.totalNonOverlappingMonths,
    rangesFound: expCalc.rangesFound,
  };

  return {
    name,
    email: email || undefined,
    phone: phone || undefined,
    links,
    summary: summary || undefined,
    rawResumeVerbatim: raw,
    sourceHash,
    experienceBreakdown,
    education,
    experience,
    projects,
    skillsCategorized,
    languages,
    frameworks,
    databases,
    cloud,
    tools,
    uniqueSourcesCount: uniqueSourceLines,
    certifications,
    achievements,
    publications,
    openSource,
    hackathons,
    leadership,
    evidenceItems,
    ledger,
  };
}

/**
 * Builds an immutable, attributed NormalizedCandidateProfile from a parsed resume.
 */
export function buildNormalizedCandidateProfile(
  result: ParseResumeResult,
  candidateId?: string
): NormalizedCandidateProfile {
  return {
    id: candidateId || `cand_${result.sourceHash?.slice(0, 12) || 'unknown'}`,
    sourceHash: result.sourceHash || '',
    rawResumeVerbatim: result.rawResumeVerbatim || '',
    contact: {
      name: result.name,
      email: result.email,
      phone: result.phone,
      location: result.location,
      links: result.links,
    },
    experienceBreakdown: result.experienceBreakdown || {
      totalNonOverlappingYears: 0,
      fullTimeYears: 0,
      internshipYears: 0,
      totalNonOverlappingMonths: 0,
      rangesFound: [],
    },
    education: result.education.map((e) => ({
      degree: e.degree,
      institution: e.institution,
      graduationYear: e.year,
      cgpa: e.gpa,
      cgpaScale: e.gpaScale,
    })),
    workHistory: result.experience.map((exp) => ({
      title: exp.role,
      company: exp.company,
      dateRange: exp.period,
      isInternship: /\b(intern|internship)\b/i.test(`${exp.role} ${exp.company}`),
      responsibilities: exp.bullets,
      technologies: [],
    })),
    projects: result.projects.map((proj) => ({
      title: proj.title,
      technologies: proj.technologies,
      implementationBullets: proj.bullets,
      liveUrl: proj.link,
    })),
    skillsCategorized: result.skillsCategorized,
  };
}
