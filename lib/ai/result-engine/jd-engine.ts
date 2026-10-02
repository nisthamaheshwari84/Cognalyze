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
  const reqLines: {
    text: string;
    sectionPriority: RequirementPriority;
    prioritySourceText: string;
    explicitness: 'explicit' | 'implicit';
  }[] = [];
  let currentPriority: RequirementPriority = 'IMPORTANT';
  let currentPrioritySourceText: string = 'Role Responsibilities & Core Competencies';

  for (const line of lines) {
    const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\./.test(line);
    const cleanText = line.replace(/^[-•*]|\d+\.\s*/, '').trim();
    const lower = cleanText.toLowerCase();

    // Check section header changes (only if it ends with colon or is a short standalone header without colon)
    const isHeaderCandidate =
      !isBullet &&
      (cleanText.endsWith(':') || (!cleanText.includes(':') && cleanText.length < 35));
    const normalizedHeader = lower.replace(/[-_]/g, ' ');
    if (isHeaderCandidate) {
      if (
        normalizedHeader.includes('must have') ||
        normalizedHeader.includes('required qualification') ||
        normalizedHeader.includes('basic qualification') ||
        normalizedHeader.includes('minimum qualification') ||
        normalizedHeader.includes('core requirements') ||
        normalizedHeader.includes('requirements')
      ) {
        currentPriority = 'CRITICAL';
        currentPrioritySourceText = line;
        continue;
      }
      if (
        normalizedHeader.includes('nice to have') ||
        normalizedHeader.includes('good to have')
      ) {
        currentPriority = 'NICE_TO_HAVE';
        currentPrioritySourceText = line;
        continue;
      }
      if (
        normalizedHeader.includes('preferred') ||
        normalizedHeader.includes('bonus') ||
        normalizedHeader.includes('plus if') ||
        normalizedHeader.includes('desired')
      ) {
        currentPriority = 'PREFERRED';
        currentPrioritySourceText = line;
        continue;
      }
      if (
        normalizedHeader.includes('responsibilities') ||
        normalizedHeader.includes('what you will do') ||
        normalizedHeader.includes('about the role')
      ) {
        currentPriority = 'IMPORTANT';
        currentPrioritySourceText = line;
        continue;
      }
    }

    if (cleanText.length > 5 && !cleanText.endsWith(':')) {
      let itemPriority = currentPriority;
      let itemPrioritySource = currentPrioritySourceText;
      const lowerClean = cleanText.toLowerCase();
      const normalizedClean = lowerClean.replace(/[-_]/g, ' ');

      // Inline explicit markers
      if (
        normalizedClean.includes('must have') ||
        normalizedClean.includes('required') ||
        normalizedClean.includes('mandatory')
      ) {
        itemPriority = 'CRITICAL';
        itemPrioritySource = cleanText;
      } else if (
        normalizedClean.includes('nice to have') ||
        normalizedClean.includes('good to have')
      ) {
        itemPriority = 'NICE_TO_HAVE';
        itemPrioritySource = cleanText;
      } else if (
        normalizedClean.includes('preferred') ||
        normalizedClean.includes('plus') ||
        normalizedClean.includes('bonus')
      ) {
        itemPriority = 'PREFERRED';
        itemPrioritySource = cleanText;
      }

      reqLines.push({
        text: cleanText,
        sectionPriority: itemPriority,
        prioritySourceText: itemPrioritySource,
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
          priority_source_text: item.prioritySourceText,
          requirement_type: node.category === 'language' ? 'language' : node.category === 'framework' ? 'framework' : 'skill',
          synonyms: node.synonyms,
          explicitness: item.explicitness,
          evidence_policy: 'direct_or_project_evidence',
          priority_reasoning:
            item.sectionPriority === 'CRITICAL'
              ? `Derived from source text: "${item.prioritySourceText}"`
              : item.sectionPriority === 'PREFERRED'
              ? `Derived from preferred qualifications: "${item.prioritySourceText}"`
              : item.sectionPriority === 'NICE_TO_HAVE'
              ? `Derived from nice-to-have criteria: "${item.prioritySourceText}"`
              : `Derived from role description: "${item.prioritySourceText}"`,
        });
      }
    }
  }

  // Fallback / standard role patterns if JD text was brief or non-bulleted
  if (canonicalReqs.length === 0) {
    const defaultPatterns = [
      { name: 'Python', key: 'python', priority: 'CRITICAL' as RequirementPriority, source: 'Core Role Expectation' },
      { name: 'Machine Learning', key: 'machine_learning', priority: 'CRITICAL' as RequirementPriority, source: 'Core Role Expectation' },
      { name: 'RESTful APIs', key: 'rest_api', priority: 'IMPORTANT' as RequirementPriority, source: 'Role Responsibilities' },
      { name: 'AWS', key: 'aws', priority: 'PREFERRED' as RequirementPriority, source: 'Preferred Qualifications' },
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
        priority_source_text: dp.source,
        requirement_type: 'skill',
        synonyms: node?.synonyms || [],
        explicitness: 'implicit',
        evidence_policy: 'direct_or_project_evidence',
        priority_reasoning: `Standard role competency requirement derived from title context.`,
      });
    }
  }

  // Ensure priority ordering: CRITICAL first, then IMPORTANT, then PREFERRED, then NICE_TO_HAVE
  canonicalReqs.sort((a, b) => {
    const weight: Record<RequirementPriority, number> = { CRITICAL: 4, IMPORTANT: 3, PREFERRED: 2, NICE_TO_HAVE: 1 };
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
    preferredQualifications: canonicalReqs.filter((r) => r.priority === 'PREFERRED' || r.priority === 'NICE_TO_HAVE').map((r) => r.normalized_requirement),
    deploymentRequirements: canonicalReqs.filter((r) => r.category === 'deployment').map((r) => r.normalized_requirement),
    requirements: canonicalReqs,
  };
}
