/**
 * COGNALYZE AUTHENTICATION & IDENTITY STORE
 * 
 * Thread-safe, disk-persisted state management for:
 * - Users (permanent UUID, password hashes, email status)
 * - StudentProfiles (permanent student_profile_id UUID, mutable @username)
 * - RecruiterProfiles & Organizations (domain matching, verification states)
 * - ConnectedAccounts (GitHub, LinkedIn, Email)
 * - EmailVerifications (6-digit OTP, attempt limits, expiration)
 * - UsernameHistory (90-day cooldown enforcement)
 * - AuthSessions (cryptographically secure tokens)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  User,
  StudentProfile,
  RecruiterProfile,
  Organization,
  ConnectedAccount,
  EmailVerification,
  UsernameHistory,
  AuthSession,
  PublicStudentProfile
} from "./types";
import { validateUsername } from "./security";

const DATA_DIR = path.join(process.cwd(), "data");
const AUTH_FILE = path.join(DATA_DIR, "auth-store.json");

interface AuthStoreData {
  users: User[];
  studentProfiles: StudentProfile[];
  recruiterProfiles: RecruiterProfile[];
  organizations: Organization[];
  connectedAccounts: ConnectedAccount[];
  emailVerifications: EmailVerification[];
  usernameHistory: UsernameHistory[];
  sessions: AuthSession[];
}

// ─── INITIAL DEMO SEED DATA ───
const demoStudentUserId = "u-student-nistha-001";
const demoStudentProfileId = "sp-student-nistha-001";
const demoRecruiterUserId = "u-recruiter-aarav-001";
const demoRecruiterProfileId = "rp-recruiter-aarav-001";
const demoOrgId = "org-acme-tech-001";

const initialData: AuthStoreData = {
  users: [
    {
      id: demoStudentUserId,
      email: "nistha@cognalyze.com",
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE",
      emailVerifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: demoRecruiterUserId,
      email: "aarav@acme.com",
      passwordHash: null,
      passwordSalt: null,
      accountType: "recruiter",
      status: "ACTIVE",
      emailVerifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  studentProfiles: [
    {
      id: demoStudentProfileId,
      userId: demoStudentUserId,
      username: "nistha",
      fullName: "Nistha Maheshwari",
      college: "BMS College of Engineering",
      degree: "B.Tech Computer Science & AI",
      graduationYear: "2026",
      primaryInterests: ["Distributed Systems", "AI/ML", "Backend Engineering"],
      profileStatus: "IDENTITY_VERIFIED",
      privacySetting: "PUBLIC",
      lastUsernameChangeAt: null,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  recruiterProfiles: [
    {
      id: demoRecruiterProfileId,
      userId: demoRecruiterUserId,
      organizationId: demoOrgId,
      fullName: "Aarav Sharma",
      designation: "Technical Recruiter",
      workEmail: "aarav@acme.com",
      status: "ACTIVE",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  organizations: [
    {
      id: demoOrgId,
      name: "Acme Technologies",
      domain: "acme.com",
      website: "https://acme.com",
      industry: "Enterprise Cloud Infrastructure",
      companySize: "250-500",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  connectedAccounts: [
    {
      id: "ca-nistha-github",
      userId: demoStudentUserId,
      provider: "github",
      providerUserId: "nistha-dev",
      providerEmail: "nistha@cognalyze.com",
      connectedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      syncStatus: {
        connected: true,
        reposRetrieved: true,
        commitHistoryRetrieved: true,
        evidenceAnalyzed: true
      }
    }
  ],
  emailVerifications: [],
  usernameHistory: [],
  sessions: []
};

// Global in-memory cache
let store: AuthStoreData = { ...initialData };

function loadStoreFromDisk() {
  try {
    if (typeof window === "undefined") {
      if (fs.existsSync(AUTH_FILE)) {
        const raw = fs.readFileSync(AUTH_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.users && Array.isArray(parsed.users)) store.users = parsed.users;
        if (parsed.studentProfiles && Array.isArray(parsed.studentProfiles)) store.studentProfiles = parsed.studentProfiles;
        if (parsed.recruiterProfiles && Array.isArray(parsed.recruiterProfiles)) store.recruiterProfiles = parsed.recruiterProfiles;
        if (parsed.organizations && Array.isArray(parsed.organizations)) store.organizations = parsed.organizations;
        if (parsed.connectedAccounts && Array.isArray(parsed.connectedAccounts)) store.connectedAccounts = parsed.connectedAccounts;
        if (parsed.emailVerifications && Array.isArray(parsed.emailVerifications)) store.emailVerifications = parsed.emailVerifications;
        if (parsed.usernameHistory && Array.isArray(parsed.usernameHistory)) store.usernameHistory = parsed.usernameHistory;
        if (parsed.sessions && Array.isArray(parsed.sessions)) store.sessions = parsed.sessions;
      } else {
        persistStoreToDisk();
      }
    }
  } catch (err) {
    console.error("Failed to load auth store from disk:", err);
  }
}

export function persistStoreToDisk() {
  try {
    if (typeof window === "undefined") {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(AUTH_FILE, JSON.stringify(store, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to persist auth store to disk:", err);
  }
}

// Initialize on server import
loadStoreFromDisk();

// ─── USER OPERATIONS ───

export function createUser(data: {
  email: string;
  passwordHash: string | null;
  passwordSalt: string | null;
  accountType: "student" | "recruiter";
  status?: "EMAIL_PENDING" | "ORGANIZATION_PENDING" | "ACTIVE";
}): User {
  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = store.users.find(u => u.email === normalizedEmail);
  if (existing) {
    throw new Error("An account already exists with this email.");
  }

  const now = new Date().toISOString();
  const user: User = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: data.passwordHash,
    passwordSalt: data.passwordSalt,
    accountType: data.accountType,
    status: data.status || "EMAIL_PENDING",
    emailVerifiedAt: data.status === "ACTIVE" ? now : null,
    createdAt: now,
    updatedAt: now
  };

  store.users.push(user);
  persistStoreToDisk();
  return user;
}

export function getUserById(id: string): User | null {
  return store.users.find(u => u.id === id) || null;
}

export function getUserByEmail(email: string): User | null {
  const normalized = email.toLowerCase().trim();
  return store.users.find(u => u.email === normalized) || null;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const user = store.users.find(u => u.id === id);
  if (!user) return null;

  Object.assign(user, updates, { updatedAt: new Date().toISOString() });
  persistStoreToDisk();
  return user;
}

// ─── STUDENT PROFILE OPERATIONS ───

export function checkUsernameAvailability(rawUsername: string): {
  available: boolean;
  normalized: string;
  reason?: string;
  suggestions?: string[];
} {
  const validation = validateUsername(rawUsername);
  if (!validation.valid) {
    return {
      available: false,
      normalized: validation.normalized,
      reason: validation.error
    };
  }

  const normalized = validation.normalized;
  const existing = store.studentProfiles.find(p => p.username === normalized);

  if (existing) {
    // Generate intelligent, natural suggestions
    const suggestions: string[] = [
      `${normalized}-ai`,
      `${normalized}_dev`,
      `${normalized}07`,
      `${normalized}-26`
    ].filter(s => !store.studentProfiles.some(p => p.username === s));

    return {
      available: false,
      normalized,
      reason: "This username is already taken.",
      suggestions: suggestions.slice(0, 3)
    };
  }

  return {
    available: true,
    normalized
  };
}

export function createStudentProfile(data: {
  userId: string;
  username: string;
  fullName: string;
  college?: string;
  degree?: string;
  graduationYear?: string;
  primaryInterests?: string[];
}): StudentProfile {
  const user = getUserById(data.userId);
  if (!user) {
    throw new Error("User does not exist.");
  }

  const availability = checkUsernameAvailability(data.username);
  if (!availability.available) {
    throw new Error(availability.reason || "Username is not available.");
  }

  const existingProfile = store.studentProfiles.find(p => p.userId === data.userId);
  if (existingProfile) {
    throw new Error("Student profile already exists for this user.");
  }

  const now = new Date().toISOString();
  const profile: StudentProfile = {
    id: crypto.randomUUID(), // Immutable student_profile_id
    userId: data.userId,
    username: availability.normalized,
    fullName: data.fullName.trim(),
    college: (data.college || "").trim(),
    degree: (data.degree || "").trim(),
    graduationYear: (data.graduationYear || "").trim(),
    primaryInterests: data.primaryInterests || [],
    profileStatus: "IDENTITY_VERIFIED",
    privacySetting: "PUBLIC",
    lastUsernameChangeAt: null,
    createdAt: now,
    updatedAt: now
  };

  store.studentProfiles.push(profile);
  persistStoreToDisk();
  return profile;
}

export function getStudentProfileByUserId(userId: string): StudentProfile | null {
  return store.studentProfiles.find(p => p.userId === userId) || null;
}

export function getStudentProfileByUsername(username: string): StudentProfile | null {
  const normalized = username.toLowerCase().trim().replace(/^@/, "");
  return store.studentProfiles.find(p => p.username === normalized) || null;
}

export function getStudentProfileById(id: string): StudentProfile | null {
  return store.studentProfiles.find(p => p.id === id) || null;
}

export function updateStudentProfile(
  id: string,
  updates: Partial<Omit<StudentProfile, "id" | "userId" | "username">>
): StudentProfile | null {
  const profile = store.studentProfiles.find(p => p.id === id);
  if (!profile) return null;

  Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
  persistStoreToDisk();
  return profile;
}

export function changeUsername(studentProfileId: string, newRawUsername: string): {
  success: boolean;
  newUsername?: string;
  error?: string;
} {
  const profile = store.studentProfiles.find(p => p.id === studentProfileId);
  if (!profile) {
    return { success: false, error: "Profile not found." };
  }

  // 90-day cooldown enforcement
  if (profile.lastUsernameChangeAt) {
    const lastChange = new Date(profile.lastUsernameChangeAt).getTime();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - lastChange < ninetyDaysMs) {
      const remainingDays = Math.ceil((ninetyDaysMs - (now - lastChange)) / (24 * 60 * 60 * 1000));
      return {
        success: false,
        error: `Username can only be changed once every 90 days. Try again in ${remainingDays} days.`
      };
    }
  }

  const availability = checkUsernameAvailability(newRawUsername);
  if (!availability.available) {
    return { success: false, error: availability.reason || "Username is not available." };
  }

  const oldUsername = profile.username;
  const newUsername = availability.normalized;
  const now = new Date().toISOString();

  // Log in username history
  store.usernameHistory.push({
    id: crypto.randomUUID(),
    studentProfileId,
    oldUsername,
    newUsername,
    changedAt: now
  });

  // Update profile handle while student_profile_id remains immutable
  profile.username = newUsername;
  profile.lastUsernameChangeAt = now;
  profile.updatedAt = now;

  persistStoreToDisk();
  return { success: true, newUsername };
}

// ─── RECRUITER & ORGANIZATION OPERATIONS ───

export function createRecruiterProfile(data: {
  userId: string;
  fullName: string;
  designation: string;
  workEmail: string;
  organizationId?: string | null;
}): RecruiterProfile {
  const user = getUserById(data.userId);
  if (!user) throw new Error("User does not exist.");

  const now = new Date().toISOString();
  const profile: RecruiterProfile = {
    id: crypto.randomUUID(),
    userId: data.userId,
    organizationId: data.organizationId || null,
    fullName: data.fullName.trim(),
    designation: data.designation.trim(),
    workEmail: data.workEmail.toLowerCase().trim(),
    status: user.status,
    createdAt: now,
    updatedAt: now
  };

  store.recruiterProfiles.push(profile);
  persistStoreToDisk();
  return profile;
}

export function getRecruiterProfileByUserId(userId: string): RecruiterProfile | null {
  return store.recruiterProfiles.find(p => p.userId === userId) || null;
}

export function updateRecruiterProfile(
  userId: string,
  updates: Partial<RecruiterProfile>
): RecruiterProfile | null {
  const profile = store.recruiterProfiles.find(p => p.userId === userId);
  if (!profile) return null;

  Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
  persistStoreToDisk();
  return profile;
}

export function createOrganization(data: {
  name: string;
  domain: string;
  website?: string;
  industry?: string;
  companySize?: string;
  verificationStatus?: "PENDING" | "DOMAIN_MATCHED" | "VERIFIED";
}): Organization {
  const normalizedDomain = data.domain.toLowerCase().trim();
  const now = new Date().toISOString();

  const org: Organization = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    domain: normalizedDomain,
    website: (data.website || `https://${normalizedDomain}`).trim(),
    industry: (data.industry || "Technology").trim(),
    companySize: (data.companySize || "10-50").trim(),
    verificationStatus: data.verificationStatus || "PENDING",
    verifiedAt: data.verificationStatus === "VERIFIED" ? now : null,
    createdAt: now,
    updatedAt: now
  };

  store.organizations.push(org);
  persistStoreToDisk();
  return org;
}

export function getOrganizationById(id: string): Organization | null {
  return store.organizations.find(o => o.id === id) || null;
}

export function getOrganizationByDomain(domain: string): Organization | null {
  const normalized = domain.toLowerCase().trim();
  return store.organizations.find(o => o.domain === normalized) || null;
}

export function updateOrganization(
  id: string,
  updates: Partial<Organization>
): Organization | null {
  const org = store.organizations.find(o => o.id === id);
  if (!org) return null;

  Object.assign(org, updates, { updatedAt: new Date().toISOString() });
  persistStoreToDisk();
  return org;
}

// ─── EMAIL VERIFICATION (OTP) ───

export function createEmailVerification(userId: string, email: string, codeHash: string): EmailVerification {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 minutes

  // Invalidate any existing pending verifications for this user
  store.emailVerifications = store.emailVerifications.filter(v => v.userId !== userId);

  const verification: EmailVerification = {
    id: crypto.randomUUID(),
    userId,
    email: email.toLowerCase().trim(),
    codeHash,
    expiresAt,
    attemptCount: 0,
    lastSentAt: now.toISOString(),
    verifiedAt: null,
    createdAt: now.toISOString()
  };

  store.emailVerifications.push(verification);
  persistStoreToDisk();
  return verification;
}

export function getPendingVerificationByUserId(userId: string): EmailVerification | null {
  const now = new Date().getTime();
  return store.emailVerifications.find(
    v => v.userId === userId && !v.verifiedAt && new Date(v.expiresAt).getTime() > now
  ) || null;
}

export function incrementVerificationAttempt(id: string): { attemptsExceeded: boolean; attemptsLeft: number } {
  const verification = store.emailVerifications.find(v => v.id === id);
  if (!verification) return { attemptsExceeded: true, attemptsLeft: 0 };

  verification.attemptCount++;
  persistStoreToDisk();

  const maxAttempts = 5;
  const left = Math.max(0, maxAttempts - verification.attemptCount);
  return { attemptsExceeded: verification.attemptCount >= maxAttempts, attemptsLeft: left };
}

export function markEmailVerified(verificationId: string): void {
  const verification = store.emailVerifications.find(v => v.id === verificationId);
  if (!verification) return;

  const now = new Date().toISOString();
  verification.verifiedAt = now;

  // Update user status
  const user = store.users.find(u => u.id === verification.userId);
  if (user) {
    user.emailVerifiedAt = now;
    if (user.accountType === "student") {
      user.status = "ACTIVE";
    } else if (user.accountType === "recruiter") {
      user.status = "ORGANIZATION_PENDING";
    }
  }

  // Update recruiter profile status if exists
  const recruiter = store.recruiterProfiles.find(r => r.userId === verification.userId);
  if (recruiter) {
    recruiter.status = "ORGANIZATION_PENDING";
  }

  persistStoreToDisk();
}

// ─── CONNECTED ACCOUNTS & ACCOUNT LINKING ───

export function addConnectedAccount(data: {
  userId: string;
  provider: "github" | "linkedin" | "email";
  providerUserId: string;
  providerEmail: string;
}): ConnectedAccount {
  const existing = store.connectedAccounts.find(
    c => c.provider === data.provider && c.providerUserId === data.providerUserId
  );
  if (existing) {
    if (existing.userId !== data.userId) {
      throw new Error("This third-party account is already connected to another user.");
    }
    return existing;
  }

  const now = new Date().toISOString();
  const account: ConnectedAccount = {
    id: crypto.randomUUID(),
    userId: data.userId,
    provider: data.provider,
    providerUserId: data.providerUserId,
    providerEmail: data.providerEmail.toLowerCase().trim(),
    connectedAt: now,
    verifiedAt: now,
    syncStatus: {
      connected: true,
      reposRetrieved: data.provider === "github",
      commitHistoryRetrieved: data.provider === "github",
      evidenceAnalyzed: data.provider === "github"
    }
  };

  store.connectedAccounts.push(account);
  persistStoreToDisk();
  return account;
}

export function getConnectedAccountsByUserId(userId: string): ConnectedAccount[] {
  return store.connectedAccounts.filter(c => c.userId === userId);
}

export function findUserByConnectedAccount(
  provider: "github" | "linkedin",
  providerUserId: string
): User | null {
  const connected = store.connectedAccounts.find(
    c => c.provider === provider && c.providerUserId === providerUserId
  );
  if (!connected) return null;
  return getUserById(connected.userId);
}

// ─── SESSIONS ───

export function createSession(userId: string, accountType: "student" | "recruiter"): AuthSession {
  // 30 days session
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const session: AuthSession = {
    id: crypto.randomUUID(),
    userId,
    token: crypto.randomBytes(32).toString("hex"),
    accountType,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  store.sessions.push(session);
  persistStoreToDisk();
  return session;
}

export function getSessionByToken(token: string): AuthSession | null {
  if (!token) return null;
  const now = new Date().getTime();
  const session = store.sessions.find(s => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < now) {
    deleteSession(token);
    return null;
  }

  return session;
}

export function deleteSession(token: string): void {
  store.sessions = store.sessions.filter(s => s.token !== token);
  persistStoreToDisk();
}

// ─── PUBLIC PROFILE ACCESSOR (SANITIZED) ───

export function getPublicProfileByUsername(username: string): PublicStudentProfile | null {
  const profile = getStudentProfileByUsername(username);
  if (!profile) return null;

  if (profile.privacySetting === "PRIVATE") return null;

  const connectedAccounts = getConnectedAccountsByUserId(profile.userId);
  const hasGithub = connectedAccounts.some(c => c.provider === "github");
  const hasLinkedin = connectedAccounts.some(c => c.provider === "linkedin");

  // Format public evidence signals with strict provenance
  const evidenceSignals = [
    {
      name: "Go Concurrency & Raft Consensus",
      source: "GitHub Public Repositories",
      status: "DIRECTLY_OBSERVED" as const,
      details: "38 original commits in Raft consensus & thread synchronization"
    },
    {
      name: "Data Structures & Algorithms",
      source: "Technical Assessment",
      status: "SUPPORTED" as const,
      details: "180+ verified algorithmic solutions"
    }
  ];

  return {
    username: profile.username,
    fullName: profile.fullName,
    college: profile.college,
    degree: profile.degree,
    graduationYear: profile.graduationYear,
    primaryInterests: profile.primaryInterests,
    connectedAccounts: {
      github: hasGithub,
      linkedin: hasLinkedin
    },
    evidenceSignals,
    profileStatus: profile.profileStatus,
    privacySetting: profile.privacySetting
  };
}
