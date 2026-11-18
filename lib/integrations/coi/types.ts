/**
 * lib/integrations/coi/types.ts
 * 
 * Formal TypeScript contracts for Cognalyze Opportunity Intelligence (COI) Integration.
 * Adheres strictly to Master Engineering Prompt Section 8 & Section 7 specifications.
 */

export type COIDNAEvidenceClaimStatus =
  | "SELF_REPORTED"
  | "SOURCE_REPORTED"
  | "SUPPORTED"
  | "INDEPENDENTLY_VERIFIED"
  | "UNASSESSED";

export interface COITechnicalSkill {
  name: string;
  category: string;
  proficiencyLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  evidenceStatus: COIDNAEvidenceClaimStatus;
  confidenceScore: number; // 0.0 to 1.0
  evidenceCount: number;
  corroboratingSources: string[]; // e.g. ["github", "internal_assessment"]
  lastEvaluatedAt?: string;
}

export interface COIProblemSolvingEvidence {
  platform: "leetcode" | "codeforces" | "hacker_rank" | "cognalyze_lab";
  handle?: string;
  totalSolved?: number;
  easyCount?: number;
  mediumCount?: number;
  hardCount?: number;
  rating?: number;
  verifiedAt?: string;
}

export interface COIProjectEvidence {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  provenance: "github_scanned" | "self_reported" | "verified_deployment";
  contributionDetails?: string;
}

export interface COIExperienceEvidence {
  id: string;
  organization: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  type: "internship" | "full_time" | "research" | "freelance";
  responsibilities: string[];
  provenance: "resume_parsed" | "verified_offer" | "self_reported";
}

export interface COICareerGoal {
  targetRoleTitle: string;
  targetRoleKey?: string;
  targetDomains: string[];
  workModePreference: "remote" | "hybrid" | "onsite" | "any";
  geographicPreferences: string[];
  availability: string;
  riskAppetite: "Conservative" | "Moderate" | "Aggressive";
}

export interface COIPlacementProfile {
  id: string;
  roleTitle: string;
  roleCategory: string;
  readinessScore: number;
  topSkills: string[];
  missingSkills: string[];
  tierTarget?: string;
}

export interface COIStudentDNASnapshot {
  schema_version: "1.0";
  student_id: string;
  profile_version: number;
  updated_at: string;
  profile_completeness: {
    status: "COMPLETE" | "PARTIAL" | "NOT_STARTED";
    percentage: number;
    missing_sections: string[];
  };
  identity: {
    fullName: string;
    username: string;
    college?: string;
    degree?: string;
    branch?: string;
    graduationYear?: string;
  };
  technical_skills: COITechnicalSkill[];
  problem_solving: COIProblemSolvingEvidence[];
  projects: COIProjectEvidence[];
  experience: COIExperienceEvidence[];
  career_goals: COICareerGoal[];
  placement_profiles: COIPlacementProfile[];
  evidence_summary: {
    totalVerifiedArtifacts: number;
    sourcesConnected: string[];
    lastEvidenceAddedAt?: string;
  };
  consent: {
    granted: boolean;
    grantedAt: string;
    scopes: string[];
    expiresAt?: string;
  };
}

export interface COIConsentRecord {
  id: string;
  studentId: string;
  clientId: string; // e.g. "coi"
  granted: boolean;
  scopes: string[];
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  ipAddress?: string;
  userAgent?: string;
}

export interface COIWebhookSubscription {
  id: string;
  targetUrl: string;
  events: Array<
    | "student_dna.created"
    | "student_dna.updated"
    | "student_dna.evidence.updated"
    | "student_dna.placement_profile.updated"
    | "student_dna.deleted"
    | "student.consent.revoked"
  >;
  secret: string;
  createdAt: string;
  active: boolean;
}
