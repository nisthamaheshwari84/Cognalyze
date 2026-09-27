/**
 * COGNALYZE IDENTITY & AUTHENTICATION SYSTEM — CORE TYPES
 * 
 * Strict separation of:
 * - Authentication (credential proof)
 * - Identity (permanent UUID vs mutable @username)
 * - Verification (email != org != education != evidence)
 * - Evidence (provenance levels)
 */

export type AccountType = "student" | "recruiter";

export type UserStatus = 
  | "EMAIL_PENDING" 
  | "ORGANIZATION_PENDING" 
  | "ACTIVE" 
  | "SUSPENDED" 
  | "REVOKED";

export type ProfileStatus = 
  | "IDENTITY_VERIFIED" 
  | "PARTIAL" 
  | "EVIDENCE_ATTACHED";

export type OrgVerificationStatus = 
  | "PENDING" 
  | "DOMAIN_MATCHED" 
  | "VERIFIED" 
  | "REJECTED";

export type PrivacySetting = 
  | "PUBLIC" 
  | "CREDENTIALS_ONLY" 
  | "PRIVATE";

export type EvidenceProvenanceStatus = 
  | "DIRECTLY_OBSERVED" 
  | "SUPPORTED" 
  | "USER_PROVIDED" 
  | "INFERRED" 
  | "NOT_VERIFIED" 
  | "REQUIRES_VERIFICATION";

export interface User {
  id: string; // Permanent Immutable UUID
  email: string; // Normalized lowercase
  fullName?: string;
  passwordHash: string | null;
  passwordSalt: string | null;
  accountType: AccountType;
  status: UserStatus;
  profileCompleted?: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSkill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience?: number;
  evidenceSource?: string;
  evidence?: string;
}

export interface StudentProject {
  id?: string;
  title: string;
  description: string;
  problemSolved?: string;
  techStack: string[];
  role?: string;
  contributions?: string;
  githubUrl?: string;
  liveUrl?: string;
  duration?: string;
}

export interface StudentExperience {
  id?: string;
  organization: string;
  role: string;
  duration: string;
  type?: "Internship" | "Freelance" | "Part-time" | "Research" | "Open Source" | "Volunteer" | "Other";
  responsibilities?: string;
  achievements?: string;
  technologies: string[];
  evidence?: string;
}

export interface StudentAchievement {
  id?: string;
  title: string;
  type: string;
  description?: string;
  date?: string;
  proofUrl?: string;
}

export interface StudentCertification {
  id?: string;
  title: string;
  issuer: string;
  date?: string;
  credentialUrl?: string;
}

export interface StudentCareerGoals {
  targetRoles: string[];
  preferredDomains: string[];
  targetCompanies: string[];
  preferredLocations: string[];
  careerGoals?: string;
}

export interface StudentProfile {
  id: string; // Permanent Immutable UUID (student_profile_id)
  userId: string; // Foreign key to User.id
  username: string; // Normalized lowercase public handle
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  
  // Education
  college: string;
  degree: string;
  branch: string;
  year?: string;
  graduationYear: string;
  cgpa?: string;
  coursework?: string[];

  // 9-Section Comprehensive Student Data
  skills: StudentSkill[];
  projects: StudentProject[];
  experience: StudentExperience[];
  achievements: StudentAchievement[];
  certifications: StudentCertification[];
  careerGoals: StudentCareerGoals;
  resumeUrl?: string;
  resumeFileName?: string;
  resumeUploadedAt?: string;

  profileCompleted: boolean;
  profileCompletionPercentage?: number;
  profileStatus: ProfileStatus;
  privacySetting: PrivacySetting;
  primaryInterests?: string[];
  lastUsernameChangeAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecruiterProfile {
  id: string; // Permanent Immutable UUID (recruiter_profile_id)
  userId: string; // Foreign key to User.id
  organizationId: string | null; // Foreign key to Organization.id
  fullName: string;
  designation: string;
  workEmail: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string; // Permanent Immutable UUID
  name: string;
  domain: string; // e.g. "acme.com"
  website: string;
  industry: string;
  companySize: string;
  verificationStatus: OrgVerificationStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedAccount {
  id: string;
  userId: string;
  provider: "github" | "linkedin" | "email";
  providerUserId: string;
  providerEmail: string;
  connectedAt: string;
  verifiedAt: string | null;
  syncStatus: {
    connected: boolean;
    reposRetrieved?: boolean;
    commitHistoryRetrieved?: boolean;
    evidenceAnalyzed?: boolean;
  };
}

export interface EmailVerification {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: string;
  attemptCount: number;
  lastSentAt: string;
  verifiedAt: string | null;
  createdAt: string;
}

export interface UsernameHistory {
  id: string;
  studentProfileId: string;
  oldUsername: string;
  newUsername: string;
  changedAt: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  accountType: AccountType;
  expiresAt: string;
  createdAt: string;
}

export interface PublicStudentProfile {
  username: string;
  fullName: string;
  college: string;
  degree: string;
  graduationYear: string;
  primaryInterests: string[];
  connectedAccounts: {
    github: boolean;
    linkedin: boolean;
  };
  evidenceSignals: {
    name: string;
    source: string;
    status: EvidenceProvenanceStatus;
    details?: string;
  }[];
  profileStatus: ProfileStatus;
  privacySetting: PrivacySetting;
}
