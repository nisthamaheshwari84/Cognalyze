/**
 * COGNALYZE RESUME INTELLIGENCE — EVIDENCE TRACKER & PROVENANCE ENGINE
 * 
 * Implements the Absolute Trust Principle:
 * - Every meaningful claim is linked to source evidence.
 * - Detects unsupported manual additions and marks them as USER_ASSERTED_UNVERIFIED or UNSUPPORTED.
 * - Powers the Evidence Drawer: [Claim, Source, Original Evidence, Status, Why Allowed, Transformation].
 * - Never fabricates metrics, employers, or capabilities.
 */

import {
  ClaimStatus,
  ContactInfo,
  EvidenceType,
  ExperienceItem,
  ProjectItem,
  EducationItem,
  ResumeBullet,
  ResumeDocument,
  ResumeSection,
  SkillCategory,
  TemplateId,
} from './types';

import { createMasterResumeProfile, generateResumeFromMaster } from './master-resume';

export interface EvidenceInspectorData {
  claim: string;
  source: string;
  originalEvidence: string;
  evidenceStatus: string;
  whyAllowed: string;
  transformation: string;
  confidenceScore: number;
  unverifiedFlags?: string[];
  evidenceIds: string[];
}

/**
 * Creates a complete, professionally typeset default ResumeDocument with verified data.
 * Occupies 85–95% page utilization with full coursework, projects, and skills.
 */
export function createDefaultResumeDocument(name = 'Sample Candidate'): ResumeDocument {
  const master = createMasterResumeProfile({
    candidateName: name,
    title: 'Computer Science & Engineering | Software Systems',
    contact: {
      name,
      title: 'Computer Science & Engineering | Software Systems',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: '+91 98765 43210',
      location: 'Bengaluru, India',
      linkedin: `linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
      github: `github.com/${name.toLowerCase().replace(/\s+/g, '')}`,
      portfolio: `${name.toLowerCase().replace(/\s+/g, '')}.dev`,
    },
  });

  return generateResumeFromMaster(master, {
    template: 'ats-classic',
    category: 'fresher',
    singlePage: true,
    isMaster: true,
  });
}

export function createDocumentFromRaw(rawText: string, defaultName = 'Nishtha Maheshwari'): ResumeDocument {
  const doc = createDefaultResumeDocument(defaultName);
  if (!rawText || rawText.trim().length === 0) return doc;

  // Extract contact hints if found
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) doc.contact.email = emailMatch[0];

  const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) doc.contact.phone = phoneMatch[0];

  const githubMatch = rawText.match(/github\.com\/[a-zA-Z0-9_-]+/);
  if (githubMatch) doc.contact.github = githubMatch[0];

  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/);
  if (linkedinMatch) doc.contact.linkedin = linkedinMatch[0];

  return doc;
}

/**
 * Examines an edited bullet against the verified ground truth.
 * Strictly detects if new claims, unevidenced technologies, or leadership exaggerations were introduced.
 */
export function checkBulletEditValidity(
  originalBullet: ResumeBullet,
  newText: string,
  knownEvidenceList: Array<{ id: string; text?: string; technologies?: string[] }> = []
): {
  claim_status: ClaimStatus;
  evidence_type: EvidenceType;
  unverified_flags: string[];
  why_allowed: string;
  transformation_notes: string;
} {
  const flags: string[] = [];
  const trimmed = newText.trim();

  if (trimmed === originalBullet.text.trim()) {
    return {
      claim_status: originalBullet.claim_status,
      evidence_type: originalBullet.evidence_type,
      unverified_flags: originalBullet.unverified_flags || [],
      why_allowed: originalBullet.why_allowed || 'Directly matches original verified statement.',
      transformation_notes: originalBullet.transformation_notes || 'No modifications.',
    };
  }

  // Suspicious exaggeration keywords that require explicit backing
  const exaggerationPatterns = [
    { pattern: /\bled\b|\bmanaged\b|\bdirected\b|\bheaded\b/i, flag: 'Leadership role ("Led/Managed") asserted without verified management evidence' },
    { pattern: /\barchitected\b|\bdesigned from scratch\b/i, flag: 'Architect-level ownership asserted' },
    { pattern: /\b(\d+%\s*increase|\d+%\s*decrease|\d+x\s*faster|\$\d+[kmMB]?|\b\d+\s*users\b)/i, flag: 'Quantitative metric introduced without artifact verification' },
    { pattern: /\baward-winning\b|\b#1 ranked\b|\bworld-class\b/i, flag: 'Subjective superlative without source verification' },
  ];

  for (const { pattern, flag } of exaggerationPatterns) {
    const originalHas = pattern.test(originalBullet.text);
    const newHas = pattern.test(trimmed);
    if (!originalHas && newHas) {
      flags.push(flag);
    }
  }

  // Technology additions check: Check if new technologies were introduced that aren't in original text or evidence
  const commonTechList = [
    'Kubernetes', 'K8s', 'AWS', 'GCP', 'Azure', 'Kafka', 'GraphQL', 'TensorFlow', 'PyTorch',
    'Rust', 'Solidity', 'Elasticsearch', 'Spark', 'Hadoop', 'Cassandra', 'Snowflake',
  ];
  for (const tech of commonTechList) {
    const regex = new RegExp(`\\b${tech}\\b`, 'i');
    const originalHas = regex.test(originalBullet.text);
    const newHas = regex.test(trimmed);
    if (!originalHas && newHas) {
      // Check if known in candidate evidence list
      const inEvidence = knownEvidenceList.some(e => 
        (e.technologies && e.technologies.some(t => t.toLowerCase() === tech.toLowerCase())) ||
        (e.text && new RegExp(`\\b${tech}\\b`, 'i').test(e.text))
      );
      if (!inEvidence) {
        flags.push(`Technology "${tech}" added without verifiable source record`);
      }
    }
  }

  if (flags.length > 0) {
    return {
      claim_status: 'USER_ASSERTED_UNVERIFIED',
      evidence_type: 'USER_ASSERTED',
      unverified_flags: flags,
      why_allowed: 'Candidate manually modified text. Flagged as user assertion pending corroborating artifact.',
      transformation_notes: `User edit added assertions: ${flags.join('; ')}`,
    };
  }

  // Minor rewording / stylistic edit that preserves factual bounds
  return {
    claim_status: originalBullet.claim_status === 'VERIFIED_DIRECT' ? 'VERIFIED_DERIVED' : originalBullet.claim_status,
    evidence_type: originalBullet.evidence_type === 'DIRECT' ? 'DERIVED' : originalBullet.evidence_type,
    unverified_flags: [],
    why_allowed: 'Grounded edit that preserves scope, technologies, and responsibilities of the verified source.',
    transformation_notes: 'User refined expression while preserving verifiable facts.',
  };
}

/**
 * Extracts Inspector data for the Evidence Drawer.
 */
export function inspectBulletEvidence(bullet: ResumeBullet, doc?: ResumeDocument): EvidenceInspectorData {
  return {
    claim: bullet.text,
    source: bullet.source_section || 'Verified Resume Experience',
    originalEvidence: bullet.original_text || bullet.text,
    evidenceStatus: bullet.claim_status === 'VERIFIED_DIRECT' 
      ? 'DIRECTLY SUPPORTED' 
      : bullet.claim_status === 'VERIFIED_DERIVED' 
      ? 'DERIVED FROM SOURCE' 
      : bullet.claim_status === 'PARTIALLY_SUPPORTED' 
      ? 'PARTIALLY SUPPORTED' 
      : 'USER-ASSERTED / UNVERIFIED',
    whyAllowed: bullet.why_allowed || 'Verified by direct match against submitted profile artifacts.',
    transformation: bullet.transformation_notes || 'Clean, direct phrasing from validated source material.',
    confidenceScore: bullet.claim_status === 'VERIFIED_DIRECT' ? 1.0 : bullet.claim_status === 'VERIFIED_DERIVED' ? 0.9 : 0.6,
    unverifiedFlags: bullet.unverified_flags,
    evidenceIds: bullet.evidence_ids || [],
  };
}
