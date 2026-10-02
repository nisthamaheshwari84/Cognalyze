/**
 * COGNALYZE RESULT ENGINE — RESUME INGESTION ENGINE
 * Parses full resume text, preserving exact source location and verbatim evidence.
 * Integrates directly with EvidenceLedger, Claim Ledger, and URL Discovery.
 */

import { CanonicalResumeEvidence, EvidenceSectionType, EvidenceType, ParsedResume } from './types';
import { TECHNOLOGY_ONTOLOGY } from './ontology';
import { EvidenceLedger } from '@/lib/evidence/evidence-ledger';
import { discoverExternalUrls } from '@/lib/evidence/source-verifier';
import { detectEducationStatus, HARD_NON_EQUIVALENCE_RULES } from '@/lib/evidence/non-equivalence';

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
      upper === 'ACADEMIC PROJECTS'
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
        const rx = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return rx.test(lowerLine);
      });
      if (match && !detectedTech.includes(node.canonicalName)) {
        detectedTech.push(node.canonicalName);
      }
    }

    const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\./.test(line);
    const cleanLine = line.replace(/^[-•*]|\d+\.\s*/, '').trim();

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
      if (!isBullet && cleanLine.length < 60 && !cleanLine.endsWith('.')) {
        // Project Title heading
        currentItemTitle = cleanLine;
        currentBulletIdx = 0;
        activeProject = {
          title: cleanLine,
          technologies: detectedTech,
          bullets: [],
        };
        projects.push(activeProject);

        // Register in Claim Ledger
        const claim = ledger.addClaim({
          claim_text: `Built ${cleanLine}`,
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
          observed_fact: `Candidate lists project "${cleanLine}" in Projects section`,
          evidence_type: 'self_claim',
          verification_status: 'SELF_CLAIM',
          supports: detectedTech,
          does_not_prove: ['independently_verified_implementation', ...getNonEquivalenceExclusions(detectedTech)],
          checks_performed: [
            { check: 'Document text extraction', result: 'PASSED', detail: `Line ${i + 1}` },
          ],
        });
        claim.evidence_ids.push(ev.evidence_id);
      } else if (cleanLine.length > 10) {
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
      if (!isBullet && cleanLine.length < 60 && !cleanLine.endsWith('.')) {
        currentItemTitle = cleanLine;
        currentBulletIdx = 0;
        activeExpRole = {
          role: cleanLine,
          company: '',
          period: '',
          bullets: [],
        };
        experience.push(activeExpRole);

        ledger.addClaim({
          claim_text: `Role ${cleanLine}`,
          claim_type: 'experience',
          source_section: currentSection,
          evidence_ids: [],
          status: 'SELF_CLAIM',
          external_verification: 'NONE',
          verification_notes: 'Employment role declared in resume.',
        });
      } else if (cleanLine.length > 10) {
        currentBulletIdx++;
        if (activeExpRole) activeExpRole.bullets.push(cleanLine);

        const isAction = isActionVerb(cleanLine);
        const evType: EvidenceType = isAction ? 'DIRECT_IMPLEMENTATION' : 'EMPLOYMENT';
        const { canonId, occurrences, existing } = getCanonicalTracking(cleanLine, currentSection, currentItemTitle, i + 1);

        const ev = ledger.addEvidence({
          source_type: 'resume',
          source_document: 'resume.pdf',
          section: currentSection,
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
          type: currentSection === 'INTERNSHIPS' ? 'internship' : 'experience',
          evidence_type: evType,
          canonical_evidence_id: canonId,
          occurrences,
          section: currentSection,
          title: currentItemTitle || 'Work Experience',
          text: cleanLine,
          technologies: detectedTech,
          source_location: {
            section: currentSection,
            item: currentItemTitle || 'Work Experience',
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
      if (cleanLine.length > 5) {
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

        education.push({
          degree: cleanLine,
          institution: inst,
          year: yearDisplay,
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
          verification_status: 'RESUME_SUPPORTED',
          supports: detectedTech,
          does_not_prove: getNonEquivalenceExclusions(detectedTech),
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

  return {
    name,
    email: email || undefined,
    phone: phone || undefined,
    links,
    summary: summary || undefined,
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
