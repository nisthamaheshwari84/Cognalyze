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
  passwordHash: string | null;
  passwordSalt: string | null;
  accountType: AccountType;
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string; // Permanent Immutable UUID (student_profile_id)
  userId: string; // Foreign key to User.id
  username: string; // Normalized lowercase public handle (e.g. "nistha")
  fullName: string;
  college: string;
  degree: string;
  graduationYear: string;
  primaryInterests: string[];
  profileStatus: ProfileStatus;
  privacySetting: PrivacySetting;
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
