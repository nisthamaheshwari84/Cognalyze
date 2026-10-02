/**
 * COGNALYZE RESUME INTELLIGENCE — MASTER DATA MODEL & TYPES
 * 
 * Defines the structured document model, evidence tracking, template settings,
 * ATS validation, and export contracts.
 */

export type ClaimStatus =
  | 'VERIFIED_DIRECT'
  | 'VERIFIED_DERIVED'
  | 'PARTIALLY_SUPPORTED'
  | 'USER_ASSERTED_UNVERIFIED'
  | 'UNSUPPORTED'
  | 'CONTRADICTED';

export type EvidenceType =
  | 'DIRECT'
  | 'DERIVED'
  | 'PARTIAL'
  | 'USER_ASSERTED'
  | 'UNSUPPORTED'
  | 'CONTRADICTED';

export interface ResumeBullet {
  id: string;
  text: string;
  evidence_ids: string[];
  evidence_type: EvidenceType;
  claim_status: ClaimStatus;
  original_text?: string;
  source_section?: string;
  transformation_notes?: string;
  why_allowed?: string;
  target_jd_requirement?: string;
  unverified_flags?: string[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  type?: 'full-time' | 'internship' | 'part-time' | 'freelance' | 'founder' | 'research';
  bullets: ResumeBullet[];
  technologies?: string[];
  evidence_ids?: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  subtitle?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
  bullets: ResumeBullet[];
  evidence_ids?: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  expectedGraduation?: string;
  gpa?: string;
  honors?: string;
  coursework?: string[];
  bullets?: ResumeBullet[];
  evidence_ids?: string[];
}

export interface SkillCategory {
  id: string;
  name: string;
  items: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  url?: string;
  evidence_ids?: string[];
}

export interface PublicationItem {
  id: string;
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  bullets?: ResumeBullet[];
}

export type SectionType =
  | 'header'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'achievements'
  | 'leadership'
  | 'publications'
  | 'coursework'
  | 'custom';

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  order: number;
  items?: (ExperienceItem | ProjectItem | EducationItem | CertificationItem | PublicationItem | ResumeBullet | SkillCategory | string)[];
}

export type TemplateId =
  | 'ats-classic'
  | 'modern-tech'
  | 'student'
  | 'swe'
  | 'minimal'
  | 'corporate'
  | 'startup'
  | 'academic'
  | 'compact'
  | 'creative';

export type PaperSize = 'A4' | 'Letter';
export type FontFamily = 'Inter' | 'IBM Plex Sans' | 'Source Sans 3' | 'Lato' | 'Georgia' | 'Times New Roman';
export type FontSize = 'small' | 'medium' | 'large';
export type SpacingScale = 'compact' | 'normal' | 'spacious';
export type AccentColor = 'black' | 'charcoal' | 'navy' | 'blue' | 'green' | 'burgundy' | 'purple' | 'neutral';

export interface DesignSettings {
  template: TemplateId;
  paperSize: PaperSize;
  fontFamily: FontFamily;
  fontSize: FontSize;
  lineHeight: SpacingScale;
  sectionSpacing: SpacingScale;
  margins: SpacingScale;
  accentColor: AccentColor;
  singlePageMode: boolean;
}

export interface ContactInfo {
  name: string;
  title?: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface MasterResumeProfile {
  id: string;
  candidateName: string;
  title: string;
  contact: ContactInfo;
  personal?: ContactInfo;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillCategory[];
  certifications: CertificationItem[];
  achievements: string[];
  hackathons?: Array<{ name: string; date?: string; projectBuilt?: string; outcome?: string }>;
  leadership?: Array<{ role: string; organization: string; dates?: string; bullets?: string[] }>;
  publications?: PublicationItem[];
  languages?: string[];
  interests?: string[];
}

export interface ResumeDocument {
  documentId: string;
  title: string;
  version: number;
  isMaster: boolean;
  targetRole?: string;
  targetJdText?: string;
  lastSaved: string;
  contact: ContactInfo;
  summary: {
    text: string;
    bullets?: ResumeBullet[];
    evidence_ids?: string[];
    claim_status?: ClaimStatus;
  };
  sections: ResumeSection[];
  settings: DesignSettings;
  masterProfile?: MasterResumeProfile;
}

// ATS and Validation Contracts
export interface ATSCheckItem {
  id: string;
  title: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  description: string;
  remediation?: string;
}

export interface ATSValidationResult {
  overallScore: number;
  evidenceIntegrityScore: number;
  jdAlignmentScore: number;
  atsStructureScore: number;
  readabilityScore: number;
  formattingScore: number;
  completenessScore: number;
  checks: ATSCheckItem[];
  extractedText: string;
  readingOrderValid: boolean;
  pageCountEstimate: number;
  isSinglePage: boolean;
}

export interface ExportValidationResult {
  readyToExport: boolean;
  blockers: string[];
  warnings: string[];
  evidenceIntegrityCertified: boolean;
  atsCertified: boolean;
  pageGeometryCertified: boolean;
}

export interface JDTailorMatch {
  requirementName: string;
  priority: 'CRITICAL' | 'IMPORTANT' | 'PREFERRED' | 'NICE_TO_HAVE';
  status: 'DIRECTLY_SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CLAIM_ONLY' | 'EVIDENCE_GAP';
  matchedBulletIds: string[];
  suggestedBullets: string[];
  recommendation: string;
}
