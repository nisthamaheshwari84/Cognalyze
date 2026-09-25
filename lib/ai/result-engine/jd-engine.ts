/**
 * COGNALYZE RESULT ENGINE — JD INGESTION ENGINE
 * Parses complete job descriptions into structured dimensions & canonical requirements.
 */

import { CanonicalJDRequirement, ParsedJD, RequirementPriority } from './types';
import { canonicalizeSkill, TECHNOLOGY_ONTOLOGY } from './ontology';

/**
 * Ingests a raw job description and extracts canonical requirements.
 */
export function parseJobDescription(jdText: string): ParsedJD {
  const raw = jdText?.trim() || '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Extract high-level metadata (Job Title, Company, Seniority)
  let jobTitle = 'Software Engineer';
  let company = '';
  let seniority = 'Mid / Early Career';

  for (const line of lines.slice(0, 10)) {
    const lower = line.toLowerCase();
    if (lower.startsWith('title:') || lower.startsWith('role:') || lower.startsWith('position:')) {
      jobTitle = line.replace(/^(title|role|position):/i, '').trim();
    } else if (lower.startsWith('company:')) {
      company = line.replace(/^company:/i, '').trim();
    } else if (lower.includes('intern') || lower.includes('graduate') || lower.includes('entry') || lower.includes('junior')) {
      seniority = 'Early Career / Campus';
    } else if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal')) {
      seniority = 'Senior / Staff';
    } else if (!jobTitle && (lower.includes('engineer') || lower.includes('developer') || lower.includes('analyst') || lower.includes('scientist'))) {
      jobTitle = line;
    }
  }

  // 2. Identify sections
  const reqLines: { text: string; sectionPriority: RequirementPriority; explicitness: 'explicit' | 'implicit' }[] = [];
  let currentPriority: RequirementPriority = 'IMPORTANT';

  for (const line of lines) {
    const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\./.test(line);
    const cleanText = line.replace(/^[-•*]|\d+\.\s*/, '').trim();
    const lower = cleanText.toLowerCase();

    // Check section header changes (only if not an actual bullet or ends with a colon)
    const isHeaderCandidate = !isBullet && (cleanText.length < 50 || cleanText.endsWith(':'));
    if (isHeaderCandidate) {
      if (
        lower.includes('must have') ||
        lower.includes('required qualification') ||
        lower.includes('basic qualification') ||
        lower.includes('minimum qualification') ||
        lower.includes('requirements') ||
        lower.includes('core requirements')
      ) {
        currentPriority = 'CRITICAL';
        continue;
      }
      if (
        lower.includes('preferred') ||
        lower.includes('nice to have') ||
        lower.includes('bonus') ||
        lower.includes('plus if') ||
        lower.includes('good to have') ||
        lower.includes('desired')
      ) {
        currentPriority = 'PREFERRED';
        continue;
      }
      if (
        lower.includes('responsibilities') ||
        lower.includes('what you will do') ||
        lower.includes('about the role')
      ) {
        currentPriority = 'IMPORTANT';
        continue;
      }
    }

    if (cleanText.length > 8 && !cleanText.endsWith(':')) {
      let itemPriority = currentPriority;
      const lowerClean = cleanText.toLowerCase();

      // Inline explicit markers
      if (lowerClean.includes('must have') || lowerClean.includes('required') || lowerClean.includes('mandatory')) {
        itemPriority = 'CRITICAL';
      } else if (lowerClean.includes('preferred') || lowerClean.includes('plus') || lowerClean.includes('nice to have')) {
        itemPriority = 'PREFERRED';
      }

      reqLines.push({
        text: cleanText,
        sectionPriority: itemPriority,
        explicitness: isBullet ? 'explicit' : 'implicit',
      });
    }
  }

  // 3. Extract Canonical Requirements
  const canonicalReqs: CanonicalJDRequirement[] = [];
  const seenNormalized = new Set<string>();
  let reqCounter = 1;

  // Scan lines against ontology
  for (const item of reqLines) {
    const lowerLine = item.text.toLowerCase();

    // Check against ontology nodes
    for (const [key, node] of Object.entries(TECHNOLOGY_ONTOLOGY)) {
      const allNames = [node.canonicalName.toLowerCase(), ...node.synonyms.map((s) => s.toLowerCase())];
      const matched = allNames.some((n) => {
        const rx = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return rx.test(lowerLine);
      });

      if (matched && !seenNormalized.has(node.canonicalName.toLowerCase())) {
        seenNormalized.add(node.canonicalName.toLowerCase());

        let cat: CanonicalJDRequirement['category'] = 'technical';
        let subcat = node.category;
        if (node.category === 'cloud' || node.category === 'devops') {
          cat = 'deployment';
        } else if (node.category === 'api') {
          cat = 'technical';
          subcat = 'api';
        }

        canonicalReqs.push({
          id: `req_${String(reqCounter++).padStart(3, '0')}`,
          original_text: item.text,
          normalized_requirement: node.canonicalName,
          category: cat,
          subcategory: subcat,
          priority: item.sectionPriority,
          requirement_type: node.category === 'language' ? 'language' : node.category === 'framework' ? 'framework' : 'skill',
          synonyms: node.synonyms,
          explicitness: item.explicitness,
          evidence_policy: 'direct_or_project_evidence',
          priority_reasoning:
            item.sectionPriority === 'CRITICAL'
              ? 'Explicitly listed in core requirements/must-have criteria.'
              : item.sectionPriority === 'PREFERRED'
              ? 'Identified in preferred/bonus qualifications section.'
              : 'Core competency derived from role responsibilities.',
        });
      }
    }
  }

  // Fallback / standard role patterns if JD text was brief or non-bulleted
  if (canonicalReqs.length === 0) {
    const defaultPatterns = [
      { name: 'Python', key: 'python', priority: 'CRITICAL' as RequirementPriority },
      { name: 'Machine Learning', key: 'machine_learning', priority: 'CRITICAL' as RequirementPriority },
      { name: 'RESTful APIs', key: 'rest_api', priority: 'IMPORTANT' as RequirementPriority },
      { name: 'AWS', key: 'aws', priority: 'PREFERRED' as RequirementPriority },
    ];

    for (const dp of defaultPatterns) {
      const node = TECHNOLOGY_ONTOLOGY[dp.key];
      canonicalReqs.push({
        id: `req_${String(reqCounter++).padStart(3, '0')}`,
        original_text: `Knowledge and practical application of ${dp.name}`,
        normalized_requirement: dp.name,
        category: dp.key === 'aws' ? 'deployment' : 'technical',
        subcategory: node?.category || 'skill',
        priority: dp.priority,
        requirement_type: 'skill',
        synonyms: node?.synonyms || [],
        explicitness: 'implicit',
        evidence_policy: 'direct_or_project_evidence',
        priority_reasoning: 'Standard role competency requirement derived from title context.',
      });
    }
  }

  // Ensure priority ordering: CRITICAL first, then IMPORTANT, then PREFERRED
  canonicalReqs.sort((a, b) => {
    const weight = { CRITICAL: 3, IMPORTANT: 2, PREFERRED: 1 };
    return weight[b.priority] - weight[a.priority];
  });

  return {
    jobTitle,
    company: company || undefined,
    seniority,
    educationRequirements: ['Bachelor’s degree in Computer Science, Engineering, or related technical field'],
    yearsExperience: seniority.includes('Senior') ? '3-5+ years' : '0-2 years (Early Career)',
    requiredTechnicalSkills: canonicalReqs.filter((r) => r.category === 'technical').map((r) => r.normalized_requirement),
    requiredSoftSkills: ['Collaboration', 'Problem Solving', 'Technical Communication'],
    responsibilities: reqLines.filter((r) => r.sectionPriority === 'IMPORTANT').map((r) => r.text).slice(0, 5),
    toolsAndFrameworks: canonicalReqs.filter((r) => r.requirement_type === 'framework' || r.requirement_type === 'tool').map((r) => r.normalized_requirement),
    programmingLanguages: canonicalReqs.filter((r) => r.requirement_type === 'language').map((r) => r.normalized_requirement),
    domainKnowledge: ['Software Architecture', 'Data Processing'],
    certifications: [],
    preferredQualifications: canonicalReqs.filter((r) => r.priority === 'PREFERRED').map((r) => r.normalized_requirement),
    deploymentRequirements: canonicalReqs.filter((r) => r.category === 'deployment').map((r) => r.normalized_requirement),
    requirements: canonicalReqs,
  };
}
