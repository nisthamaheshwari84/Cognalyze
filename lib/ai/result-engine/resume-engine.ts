/**
 * COGNALYZE RESULT ENGINE — RESUME INGESTION ENGINE
 * Parses full resume text, preserving exact source location and verbatim evidence.
 */

import { CanonicalResumeEvidence, EvidenceSectionType, ParsedResume } from './types';
import { TECHNOLOGY_ONTOLOGY } from './ontology';

/**
 * Parses the full resume text and builds the structured evidence inventory.
 */
export function parseResume(resumeText: string): ParsedResume {
  const raw = resumeText?.trim() || '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  const evidenceItems: CanonicalResumeEvidence[] = [];
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

  // Section Tracking State Machine
  let currentSection: EvidenceSectionType = 'SUMMARY';
  let currentItemTitle = '';
  let currentBulletIdx = 0;
  let activeExpRole: any = null;
  let activeProject: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase().replace(/^#+\s*/, '').trim();

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
      const allTerms = [node.canonicalName.toLowerCase(), ...node.synonyms.map((s) => s.toLowerCase())];
      const match = allTerms.some((term) => {
        const rx = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return rx.test(lowerLine);
      });
      if (match && !detectedTech.includes(node.canonicalName)) {
        detectedTech.push(node.canonicalName);
      }
    }

    const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\./.test(line);
    const cleanLine = line.replace(/^[-•*]|\d+\.\s*/, '').trim();

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
      } else if (cleanLine.length > 10) {
        currentBulletIdx++;
        if (activeProject) {
          activeProject.bullets.push(cleanLine);
          for (const t of detectedTech) {
            if (!activeProject.technologies.includes(t)) activeProject.technologies.push(t);
          }
        }
        evidenceItems.push({
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: 'project',
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
        });
      }
    } else if (currentSection === 'EXPERIENCE' || currentSection === 'INTERNSHIPS') {
      if (!isBullet && cleanLine.length < 60 && !cleanLine.endsWith('.')) {
        // Experience role / company
        currentItemTitle = cleanLine;
        currentBulletIdx = 0;
        activeExpRole = {
          role: cleanLine,
          company: '',
          period: '',
          bullets: [],
        };
        experience.push(activeExpRole);
      } else if (cleanLine.length > 10) {
        currentBulletIdx++;
        if (activeExpRole) activeExpRole.bullets.push(cleanLine);
        evidenceItems.push({
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: currentSection === 'INTERNSHIPS' ? 'internship' : 'experience',
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
        });
      }
    } else if (currentSection === 'SKILLS') {
      if (cleanLine.length > 3) {
        const parts = cleanLine.split(':');
        const cat = parts.length > 1 ? parts[0].trim() : 'General Skills';
        const items = (parts.length > 1 ? parts[1] : parts[0]).split(/[,|•]/).map((s) => s.trim()).filter(Boolean);
        skillsCategorized.push({ category: cat, items });

        evidenceItems.push({
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: 'skill_claim',
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
        });
      }
    } else if (currentSection === 'EDUCATION') {
      if (cleanLine.length > 5) {
        education.push({
          degree: cleanLine,
          institution: 'Documented Academic Institution',
          year: cleanLine.match(/\b(20\d{2})\b/)?.[0] || 'Graduated',
          details: cleanLine,
        });
        evidenceItems.push({
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: 'education',
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
        });
      }
    } else if (currentSection === 'SUMMARY') {
      if (cleanLine.length > 15) {
        summary = summary ? `${summary} ${cleanLine}` : cleanLine;
        evidenceItems.push({
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: 'summary_claim',
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
        });
      }
    } else if (currentSection === 'CERTIFICATIONS') {
      if (cleanLine.length > 3) {
        certifications.push(cleanLine);
        evidenceItems.push({
          id: `evidence_${String(evidenceCounter++).padStart(3, '0')}`,
          type: 'certification',
          section: 'CERTIFICATIONS',
          title: cleanLine,
          text: cleanLine,
          technologies: detectedTech,
          source_location: { section: 'CERTIFICATIONS', item: cleanLine, line: i + 1 },
          verbatim_quote: line,
        });
      }
    } else if (currentSection === 'ACHIEVEMENTS') {
      if (cleanLine.length > 3) achievements.push(cleanLine);
    } else if (currentSection === 'LEADERSHIP') {
      if (cleanLine.length > 3) leadership.push(cleanLine);
    }
  }

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
    certifications,
    achievements,
    publications,
    openSource,
    hackathons,
    leadership,
    evidenceItems,
  };
}
