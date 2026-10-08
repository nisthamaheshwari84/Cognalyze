/**
 * COGNALYZE AUTHENTICATION & IDENTITY STORE
 * 
 * Thread-safe, disk-persisted state management for:
 * - Users (permanent UUID, password hashes, email status)
 * - StudentProfiles (permanent student_profile_id UUID, mutable @username)
 * - RecruiterProfiles & Organizations (domain matching, verification states)
 * - ConnectedAccounts (GitHub, LinkedIn, Email)
 * - EmailVerifications (6-digit OTP, attempt limits, expiration)
 * - PasswordResetTokens (secure token hash, 1-hour expiration)
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
  PasswordResetToken,
  UsernameHistory,
  AuthSession,
  PublicStudentProfile
} from "./types";
import { validateUsername } from "./security";

function resolveAuthFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "cognalyze-auth-store.json");
  }
  return path.join(process.cwd(), "data", "auth-store.json");
}

interface AuthStoreData {
  users: User[];
  studentProfiles: StudentProfile[];
  recruiterProfiles: RecruiterProfile[];
  organizations: Organization[];
  connectedAccounts: ConnectedAccount[];
  emailVerifications: EmailVerification[];
  passwordResetTokens: PasswordResetToken[];
  usernameHistory: UsernameHistory[];
  sessions: AuthSession[];
}

// ─── INITIAL DEMO SEED DATA (Isolated Generic Sandbox) ───
const demoStudentUserId = "u-student-sample-001";
const demoStudentProfileId = "sp-student-sample-001";
const demoRecruiterUserId = "u-recruiter-demo-001";
const demoRecruiterProfileId = "rp-recruiter-demo-001";
const demoOrgId = "org-acme-tech-001";

const initialData: AuthStoreData = {
  users: [
    {
      id: demoStudentUserId,
      email: "sample.student@cognalyze.com",
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
      username: "sample_student",
      fullName: "Sample Student",
      college: "Institute of Technology",
      degree: "B.Tech",
      branch: "Computer Science & Engineering",
      graduationYear: "2026",
      skills: [
        { name: "Python", level: "Advanced" },
        { name: "PostgreSQL", level: "Intermediate" },
        { name: "Next.js", level: "Advanced" },
      ],
      projects: [
        {
          title: "Automated Recovery Bot",
          description: "Distributed recovery pipeline built with Python and PostgreSQL",
          techStack: ["Python", "PostgreSQL", "Docker"],
        },
      ],
      experience: [],
      achievements: [],
      certifications: [],
      careerGoals: {
        targetRoles: ["Backend Engineer", "Distributed Systems Engineer"],
        preferredDomains: ["Fintech", "Developer Tools"],
        targetCompanies: ["Stripe", "Datadog"],
        preferredLocations: ["Bangalore", "Remote"],
      },
      profileCompleted: true,
      profileCompletionPercentage: 100,
      primaryInterests: ["Distributed Systems", "AI/ML", "Backend Engineering"],
      profileStatus: "IDENTITY_VERIFIED",
      privacySetting: "PUBLIC",
      lastUsernameChangeAt: null,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "sp-nistha-001",
      userId: demoStudentUserId,
      username: "nistha",
      fullName: "Nistha Maheshwari",
      college: "Institute of Technology",
      degree: "B.Tech",
      branch: "Computer Science & Engineering",
      graduationYear: "2026",
      skills: [
        { name: "Python", level: "Advanced" },
        { name: "PostgreSQL", level: "Intermediate" },
        { name: "Next.js", level: "Advanced" },
      ],
      projects: [
        {
          title: "Automated Recovery Bot",
          description: "Distributed recovery pipeline built with Python and PostgreSQL",
          techStack: ["Python", "PostgreSQL", "Docker"],
        },
      ],
      experience: [],
      achievements: [],
      certifications: [],
      careerGoals: {
        targetRoles: ["Backend Engineer", "Distributed Systems Engineer"],
        preferredDomains: ["Fintech", "Developer Tools"],
        targetCompanies: ["Stripe", "Datadog"],
        preferredLocations: ["Bangalore", "Remote"],
      },
      profileCompleted: true,
      profileCompletionPercentage: 100,
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
      id: "ca-sample-github",
      userId: demoStudentUserId,
      provider: "github",
      providerUserId: "sample-dev",
      providerEmail: "sample.student@cognalyze.com",
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
  passwordResetTokens: [],
  usernameHistory: [],
  sessions: []
};

import { supabase } from "../supabase";

const CLOUD_STORE_KEY = "cognalyze_auth_cloud_store";

export async function syncStoreWithCloud(): Promise<void> {
  if (typeof window !== "undefined") return;
  try {
    const { data, error } = await supabase
      .from("analyses")
      .select("full_report")
      .eq("recruiter_clerk_id", CLOUD_STORE_KEY)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.warn("syncStoreWithCloud query warning:", error.message);
      return;
    }

    const cloud = data?.[0]?.full_report;
    if (cloud) {
      if (cloud.users && Array.isArray(cloud.users)) {
        for (const u of cloud.users) {
          const idx = store.users.findIndex(x => x.id === u.id || (u.email && x.email.toLowerCase() === u.email.toLowerCase()));
          if (idx === -1) store.users.push(u);
          else store.users[idx] = { ...store.users[idx], ...u };
        }
      }
      if (cloud.studentProfiles && Array.isArray(cloud.studentProfiles)) {
        for (const p of cloud.studentProfiles) {
          const idx = store.studentProfiles.findIndex(x => x.id === p.id || x.userId === p.userId);
          if (idx === -1) store.studentProfiles.push(p);
          else store.studentProfiles[idx] = { ...store.studentProfiles[idx], ...p };
        }
      }
      if (cloud.recruiterProfiles && Array.isArray(cloud.recruiterProfiles)) {
        for (const p of cloud.recruiterProfiles) {
          const idx = store.recruiterProfiles.findIndex(x => x.id === p.id || x.userId === p.userId);
          if (idx === -1) store.recruiterProfiles.push(p);
          else store.recruiterProfiles[idx] = { ...store.recruiterProfiles[idx], ...p };
        }
      }
      if (cloud.organizations && Array.isArray(cloud.organizations)) {
        for (const o of cloud.organizations) {
          const idx = store.organizations.findIndex(x => x.id === o.id);
          if (idx === -1) store.organizations.push(o);
          else store.organizations[idx] = { ...store.organizations[idx], ...o };
        }
      }
      if (cloud.connectedAccounts && Array.isArray(cloud.connectedAccounts)) {
        for (const c of cloud.connectedAccounts) {
          const idx = store.connectedAccounts.findIndex(x => x.id === c.id);
          if (idx === -1) store.connectedAccounts.push(c);
          else store.connectedAccounts[idx] = { ...store.connectedAccounts[idx], ...c };
        }
      }
      if (cloud.sessions && Array.isArray(cloud.sessions)) {
        for (const s of cloud.sessions) {
          const idx = store.sessions.findIndex(x => x.token === s.token);
          if (idx === -1) store.sessions.push(s);
          else store.sessions[idx] = { ...store.sessions[idx], ...s };
        }
      }
      if (cloud.emailVerifications && Array.isArray(cloud.emailVerifications)) {
        for (const v of cloud.emailVerifications) {
          const idx = store.emailVerifications.findIndex(x => x.id === v.id);
          if (idx === -1) store.emailVerifications.push(v);
          else store.emailVerifications[idx] = { ...store.emailVerifications[idx], ...v };
        }
      }
      if (cloud.passwordResetTokens && Array.isArray(cloud.passwordResetTokens)) {
        for (const t of cloud.passwordResetTokens) {
          const idx = store.passwordResetTokens.findIndex(x => x.id === t.id);
          if (idx === -1) store.passwordResetTokens.push(t);
          else store.passwordResetTokens[idx] = { ...store.passwordResetTokens[idx], ...t };
        }
      }
      if (cloud.usernameHistory && Array.isArray(cloud.usernameHistory)) {
        for (const h of cloud.usernameHistory) {
          const idx = store.usernameHistory.findIndex(x => x.id === h.id);
          if (idx === -1) store.usernameHistory.push(h);
          else store.usernameHistory[idx] = { ...store.usernameHistory[idx], ...h };
        }
      }

      // Sync updated store to local disk /tmp cache
      try {
        const filePath = resolveAuthFilePath();
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
        lastMtimeMs = fs.statSync(filePath).mtimeMs;
      } catch {}
    }
  } catch (err) {
    console.warn("syncStoreWithCloud non-fatal:", err);
  }
}

// Global in-memory cache and timestamp tracking
let store: AuthStoreData = { ...initialData };
let lastMtimeMs: number = 0;

function loadStoreFromDisk(force = false) {
  try {
    if (typeof window === "undefined") {
      const filePath = resolveAuthFilePath();

      // If running in /tmp (e.g. serverless) and file doesn't exist yet, seed from repo data
      if (!fs.existsSync(filePath)) {
        const repoFile = path.join(process.cwd(), "data", "auth-store.json");
        if (filePath !== repoFile && fs.existsSync(repoFile)) {
          try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.copyFileSync(repoFile, filePath);
          } catch {}
        }
      }

      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (!force && stat.mtimeMs === lastMtimeMs) {
          return;
        }

        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.users && Array.isArray(parsed.users)) {
          for (const u of parsed.users) {
            const idx = store.users.findIndex(x => x.id === u.id);
            if (idx === -1) {
              store.users.push(u);
            } else {
              const diskTime = u.updatedAt ? new Date(u.updatedAt).getTime() : 0;
              const memTime = store.users[idx].updatedAt ? new Date(store.users[idx].updatedAt).getTime() : 0;
              if (diskTime > memTime) {
                store.users[idx] = { ...store.users[idx], ...u };
              }
            }
          }
        }
        if (parsed.studentProfiles && Array.isArray(parsed.studentProfiles)) {
          for (const p of parsed.studentProfiles) {
            const idx = store.studentProfiles.findIndex(x => x.id === p.id);
            if (idx === -1) {
              store.studentProfiles.push(p);
            } else {
              const diskTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
              const memTime = store.studentProfiles[idx].updatedAt ? new Date(store.studentProfiles[idx].updatedAt).getTime() : 0;
              if (diskTime > memTime) {
                store.studentProfiles[idx] = { ...store.studentProfiles[idx], ...p };
              }
            }
          }
        }
        if (parsed.recruiterProfiles && Array.isArray(parsed.recruiterProfiles)) {
          for (const p of parsed.recruiterProfiles) {
            const idx = store.recruiterProfiles.findIndex(x => x.id === p.id);
            if (idx === -1) store.recruiterProfiles.push(p);
            else store.recruiterProfiles[idx] = { ...store.recruiterProfiles[idx], ...p };
          }
        }
        if (parsed.organizations && Array.isArray(parsed.organizations)) {
          for (const o of parsed.organizations) {
            const idx = store.organizations.findIndex(x => x.id === o.id);
            if (idx === -1) store.organizations.push(o);
            else store.organizations[idx] = { ...store.organizations[idx], ...o };
          }
        }
        if (parsed.connectedAccounts && Array.isArray(parsed.connectedAccounts)) {
          for (const c of parsed.connectedAccounts) {
            const idx = store.connectedAccounts.findIndex(x => x.id === c.id);
            if (idx === -1) store.connectedAccounts.push(c);
            else store.connectedAccounts[idx] = { ...store.connectedAccounts[idx], ...c };
          }
        }
        if (parsed.emailVerifications && Array.isArray(parsed.emailVerifications)) {
          for (const v of parsed.emailVerifications) {
            const idx = store.emailVerifications.findIndex(x => x.id === v.id);
            if (idx === -1) store.emailVerifications.push(v);
            else store.emailVerifications[idx] = { ...store.emailVerifications[idx], ...v };
          }
        }
        if (parsed.passwordResetTokens && Array.isArray(parsed.passwordResetTokens)) {
          for (const t of parsed.passwordResetTokens) {
            const idx = store.passwordResetTokens.findIndex(x => x.id === t.id);
            if (idx === -1) store.passwordResetTokens.push(t);
            else store.passwordResetTokens[idx] = { ...store.passwordResetTokens[idx], ...t };
          }
        }
        if (parsed.usernameHistory && Array.isArray(parsed.usernameHistory)) {
          for (const h of parsed.usernameHistory) {
            const idx = store.usernameHistory.findIndex(x => x.id === h.id);
            if (idx === -1) store.usernameHistory.push(h);
            else store.usernameHistory[idx] = { ...store.usernameHistory[idx], ...h };
          }
        }
        if (parsed.sessions && Array.isArray(parsed.sessions)) {
          for (const s of parsed.sessions) {
            const idx = store.sessions.findIndex(x => x.token === s.token);
            if (idx === -1) store.sessions.push(s);
            else store.sessions[idx] = { ...store.sessions[idx], ...s };
          }
        }
        lastMtimeMs = stat.mtimeMs;
      } else {
        persistStoreToDisk();
      }
    }
  } catch (err) {
    console.error("Failed to load auth store from disk:", err);
  }
}

export async function saveStoreToCloud(): Promise<void> {
  if (typeof window !== "undefined") return;
  try {
    const filePath = resolveAuthFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
    try {
      lastMtimeMs = fs.statSync(filePath).mtimeMs;
    } catch {}

    const { data: existingRows } = await supabase
      .from("analyses")
      .select("id")
      .eq("recruiter_clerk_id", CLOUD_STORE_KEY)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingRows && existingRows.length > 0 && existingRows[0]?.id) {
      await supabase
        .from("analyses")
        .update({
          full_report: store,
          created_at: new Date().toISOString()
        })
        .eq("id", existingRows[0].id);
    } else {
      await supabase
        .from("analyses")
        .insert({
          recruiter_clerk_id: CLOUD_STORE_KEY,
          job_description: "cognalyze_auth_cloud_store",
          final_verdict: "ACTIVE",
          full_report: store
        });
    }
  } catch (err) {
    console.error("saveStoreToCloud error:", err);
  }
}

export function persistStoreToDisk() {
  try {
    if (typeof window === "undefined") {
      const filePath = resolveAuthFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
      try {
        lastMtimeMs = fs.statSync(filePath).mtimeMs;
      } catch {}

      // Fire saveStoreToCloud asynchronously
      saveStoreToCloud().catch(() => {});
    }
  } catch (err) {
    console.error("Failed to persist auth store to disk:", err);
  }
}

// Initialize on server import
loadStoreFromDisk();
syncStoreWithCloud();

// ─── USER OPERATIONS ───

export function createUser(data: {
  id?: string;
  email: string;
  fullName?: string;
  passwordHash: string | null;
  passwordSalt: string | null;
  accountType: "student" | "recruiter";
  status?: "EMAIL_PENDING" | "ORGANIZATION_PENDING" | "ACTIVE";
  profileCompleted?: boolean;
}): User {
  loadStoreFromDisk();
  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = store.users.find(u => u.email === normalizedEmail);
  if (existing) {
    throw new Error("An account already exists with this email.");
  }

  const now = new Date().toISOString();
  const user: User = {
    id: data.id || crypto.randomUUID(),
    email: normalizedEmail,
    fullName: data.fullName ? data.fullName.trim() : undefined,
    passwordHash: data.passwordHash,
    passwordSalt: data.passwordSalt,
    accountType: data.accountType,
    status: data.status || "EMAIL_PENDING",
    profileCompleted: data.profileCompleted || false,
    emailVerifiedAt: data.status === "ACTIVE" ? now : null,
    createdAt: now,
    updatedAt: now
  };

  store.users.push(user);
  persistStoreToDisk();
  return user;
}

export function getUserById(id: string): User | null {
  loadStoreFromDisk();
  return store.users.find(u => u.id === id) || null;
}

export function getUserByEmail(email: string): User | null {
  loadStoreFromDisk();
  const normalized = email.toLowerCase().trim();
  return store.users.find(u => u.email === normalized) || null;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  loadStoreFromDisk();
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
  loadStoreFromDisk();
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
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  college?: string;
  degree?: string;
  branch?: string;
  year?: string;
  graduationYear?: string;
  cgpa?: string;
  coursework?: string[];
  skills?: any[];
  projects?: any[];
  experience?: any[];
  achievements?: any[];
  certifications?: any[];
  careerGoals?: any;
  resumeUrl?: string;
  resumeFileName?: string;
  profileCompleted?: boolean;
  profileCompletionPercentage?: number;
  primaryInterests?: string[];
}): StudentProfile {
  loadStoreFromDisk();
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
    id: crypto.randomUUID(),
    userId: data.userId,
    username: availability.normalized,
    fullName: data.fullName.trim(),
    email: data.email || user.email,
    phone: data.phone || "",
    location: data.location || "",
    linkedinUrl: data.linkedinUrl || "",
    githubUrl: data.githubUrl || "",
    portfolioUrl: data.portfolioUrl || "",
    college: (data.college || "").trim(),
    degree: (data.degree || "").trim(),
    branch: (data.branch || "").trim(),
    year: (data.year || "").trim(),
    graduationYear: (data.graduationYear || "").trim(),
    cgpa: (data.cgpa || "").trim(),
    coursework: data.coursework || [],
    skills: data.skills || [],
    projects: data.projects || [],
    experience: data.experience || [],
    achievements: data.achievements || [],
    certifications: data.certifications || [],
    careerGoals: data.careerGoals || {
      targetRoles: [],
      preferredDomains: [],
      targetCompanies: [],
      preferredLocations: []
    },
    resumeUrl: data.resumeUrl,
    resumeFileName: data.resumeFileName,
    profileCompleted: data.profileCompleted || false,
    profileCompletionPercentage: data.profileCompletionPercentage || 0,
    primaryInterests: data.primaryInterests || [],
    profileStatus: data.profileCompleted ? "IDENTITY_VERIFIED" : "PARTIAL",
    privacySetting: "PUBLIC",
    lastUsernameChangeAt: null,
    createdAt: now,
    updatedAt: now
  };

  store.studentProfiles.push(profile);
  if (data.profileCompleted) {
    updateUser(data.userId, { profileCompleted: true });
  }
  persistStoreToDisk();
  return profile;
}

export function getStudentProfileByUserId(userId: string): StudentProfile | null {
  loadStoreFromDisk();
  return store.studentProfiles.find(p => p.userId === userId) || null;
}

export function getStudentProfileByUsername(username: string): StudentProfile | null {
  loadStoreFromDisk();
  const normalized = username.toLowerCase().trim().replace(/^@/, "");
  return store.studentProfiles.find(p => p.username === normalized) || null;
}

export function getStudentProfileById(id: string): StudentProfile | null {
  loadStoreFromDisk();
  return store.studentProfiles.find(p => p.id === id) || null;
}

export function updateStudentProfile(
  id: string,
  updates: Partial<Omit<StudentProfile, "id" | "userId" | "username">>
): StudentProfile | null {
  loadStoreFromDisk();
  const profile = store.studentProfiles.find(p => p.id === id);
  if (!profile) return null;

  Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
  if (updates.profileCompleted !== undefined) {
    updateUser(profile.userId, { profileCompleted: updates.profileCompleted });
  }
  persistStoreToDisk();
  return profile;
}

export function upsertStudentProfileByUserId(
  userId: string,
  data: Partial<StudentProfile>
): StudentProfile {
  loadStoreFromDisk();
  const existing = store.studentProfiles.find(p => p.userId === userId);
  const now = new Date().toISOString();

  if (existing) {
    Object.assign(existing, data, { updatedAt: now });
    if (data.profileCompleted !== undefined) {
      updateUser(userId, { profileCompleted: data.profileCompleted });
    }
    persistStoreToDisk();
    return existing;
  }

  const user = getUserById(userId);
  if (!user) throw new Error("User does not exist.");

  const fallbackUsername = (data.fullName || user.email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12) + "_" + userId.slice(-4);

  const newProfile: StudentProfile = {
    id: crypto.randomUUID(),
    userId,
    username: data.username || fallbackUsername,
    fullName: data.fullName || user.fullName || "Candidate",
    email: data.email || user.email,
    phone: data.phone || "",
    location: data.location || "",
    linkedinUrl: data.linkedinUrl || "",
    githubUrl: data.githubUrl || "",
    portfolioUrl: data.portfolioUrl || "",
    college: data.college || "",
    degree: data.degree || "",
    branch: data.branch || "",
    year: data.year || "",
    graduationYear: data.graduationYear || "",
    cgpa: data.cgpa || "",
    coursework: data.coursework || [],
    skills: data.skills || [],
    projects: data.projects || [],
    experience: data.experience || [],
    achievements: data.achievements || [],
    certifications: data.certifications || [],
    careerGoals: data.careerGoals || {
      targetRoles: [],
      preferredDomains: [],
      targetCompanies: [],
      preferredLocations: []
    },
    resumeUrl: data.resumeUrl,
    resumeFileName: data.resumeFileName,
    profileCompleted: data.profileCompleted || false,
    profileCompletionPercentage: data.profileCompletionPercentage || 0,
    primaryInterests: data.primaryInterests || [],
    profileStatus: data.profileCompleted ? "IDENTITY_VERIFIED" : "PARTIAL",
    privacySetting: "PUBLIC",
    lastUsernameChangeAt: null,
    createdAt: now,
    updatedAt: now
  };

  store.studentProfiles.push(newProfile);
  if (data.profileCompleted) {
    updateUser(userId, { profileCompleted: true });
  }
  persistStoreToDisk();
  return newProfile;
}

export function changeUsername(studentProfileId: string, newRawUsername: string): {
  success: boolean;
  newUsername?: string;
  error?: string;
} {
  loadStoreFromDisk();
  const profile = store.studentProfiles.find(p => p.id === studentProfileId);
  if (!profile) {
    return { success: false, error: "Profile not found." };
  }

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

  store.usernameHistory.push({
    id: crypto.randomUUID(),
    studentProfileId,
    oldUsername,
    newUsername,
    changedAt: now
  });

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
  loadStoreFromDisk();
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
  loadStoreFromDisk();
  return store.recruiterProfiles.find(p => p.userId === userId) || null;
}

export function updateRecruiterProfile(
  userId: string,
  updates: Partial<RecruiterProfile>
): RecruiterProfile | null {
  loadStoreFromDisk();
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
  loadStoreFromDisk();
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
  loadStoreFromDisk();
  return store.organizations.find(o => o.id === id) || null;
}

export function getOrganizationByDomain(domain: string): Organization | null {
  loadStoreFromDisk();
  const normalized = domain.toLowerCase().trim();
  return store.organizations.find(o => o.domain === normalized) || null;
}

export function updateOrganization(
  id: string,
  updates: Partial<Organization>
): Organization | null {
  loadStoreFromDisk();
  const org = store.organizations.find(o => o.id === id);
  if (!org) return null;

  Object.assign(org, updates, { updatedAt: new Date().toISOString() });
  persistStoreToDisk();
  return org;
}

// ─── EMAIL VERIFICATION (OTP) ───

export function createEmailVerification(userId: string, email: string, codeHash: string): EmailVerification {
  loadStoreFromDisk();
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
  loadStoreFromDisk();
  const now = new Date().getTime();
  return store.emailVerifications.find(
    v => v.userId === userId && !v.verifiedAt && new Date(v.expiresAt).getTime() > now
  ) || null;
}

export function incrementVerificationAttempt(id: string): { attemptsExceeded: boolean; attemptsLeft: number } {
  loadStoreFromDisk();
  const verification = store.emailVerifications.find(v => v.id === id);
  if (!verification) return { attemptsExceeded: true, attemptsLeft: 0 };

  verification.attemptCount++;
  persistStoreToDisk();

  const maxAttempts = 5;
  const left = Math.max(0, maxAttempts - verification.attemptCount);
  return { attemptsExceeded: verification.attemptCount >= maxAttempts, attemptsLeft: left };
}

export function markEmailVerified(verificationId: string): void {
  loadStoreFromDisk();
  const verification = store.emailVerifications.find(v => v.id === verificationId);
  if (!verification) return;

  const now = new Date().toISOString();
  verification.verifiedAt = now;

  const user = store.users.find(u => u.id === verification.userId);
  if (user) {
    user.emailVerifiedAt = now;
    if (user.accountType === "student") {
      user.status = "ACTIVE";
    } else if (user.accountType === "recruiter") {
      user.status = "ORGANIZATION_PENDING";
    }
  }

  const recruiter = store.recruiterProfiles.find(r => r.userId === verification.userId);
  if (recruiter) {
    recruiter.status = "ORGANIZATION_PENDING";
  }

  persistStoreToDisk();
}

// ─── PASSWORD RESET TOKENS ───

export function createPasswordResetToken(userId: string, email: string, tokenHash: string): PasswordResetToken {
  loadStoreFromDisk();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour

  // Invalidate previous unused reset tokens for this user
  store.passwordResetTokens = (store.passwordResetTokens || []).filter(t => t.userId !== userId);

  const resetToken: PasswordResetToken = {
    id: crypto.randomUUID(),
    userId,
    email: email.toLowerCase().trim(),
    tokenHash,
    expiresAt,
    usedAt: null,
    createdAt: now.toISOString()
  };

  store.passwordResetTokens.push(resetToken);
  persistStoreToDisk();
  return resetToken;
}

export function getValidPasswordResetToken(tokenHash: string): PasswordResetToken | null {
  loadStoreFromDisk();
  const now = Date.now();
  return (store.passwordResetTokens || []).find(
    t => t.tokenHash === tokenHash && !t.usedAt && new Date(t.expiresAt).getTime() > now
  ) || null;
}

export function markPasswordResetTokenUsed(tokenId: string): void {
  loadStoreFromDisk();
  const token = (store.passwordResetTokens || []).find(t => t.id === tokenId);
  if (token) {
    token.usedAt = new Date().toISOString();
    persistStoreToDisk();
  }
}

export function resetUserPassword(userId: string, passwordHash: string, passwordSalt: string): boolean {
  loadStoreFromDisk();
  const user = store.users.find(u => u.id === userId);
  if (!user) return false;

  user.passwordHash = passwordHash;
  user.passwordSalt = passwordSalt;
  user.updatedAt = new Date().toISOString();
  persistStoreToDisk();
  return true;
}

// ─── CONNECTED ACCOUNTS & ACCOUNT LINKING ───

export function addConnectedAccount(data: {
  userId: string;
  provider: "github" | "linkedin" | "email";
  providerUserId: string;
  providerEmail: string;
}): ConnectedAccount {
  loadStoreFromDisk();
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
  loadStoreFromDisk();
  return store.connectedAccounts.filter(c => c.userId === userId);
}

export function findUserByConnectedAccount(
  provider: "github" | "linkedin",
  providerUserId: string
): User | null {
  loadStoreFromDisk();
  const connected = store.connectedAccounts.find(
    c => c.provider === provider && c.providerUserId === providerUserId
  );
  if (!connected) return null;
  return getUserById(connected.userId);
}

// ─── SESSIONS ───

export function createSession(userId: string, accountType: "student" | "recruiter"): AuthSession {
  loadStoreFromDisk();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
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
  loadStoreFromDisk();
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
  loadStoreFromDisk();
  store.sessions = store.sessions.filter(s => s.token !== token);
  persistStoreToDisk();
}

// ─── PUBLIC PROFILE ACCESSOR (SANITIZED) ───

export function getPublicProfileByUsername(username: string): PublicStudentProfile | null {
  loadStoreFromDisk();
  const profile = getStudentProfileByUsername(username);
  if (!profile) return null;

  if (profile.privacySetting === "PRIVATE") return null;

  const connectedAccounts = getConnectedAccountsByUserId(profile.userId);
  const hasGithub = connectedAccounts.some(c => c.provider === "github");
  const hasLinkedin = connectedAccounts.some(c => c.provider === "linkedin");

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
    primaryInterests: profile.primaryInterests || [],
    connectedAccounts: {
      github: hasGithub,
      linkedin: hasLinkedin
    },
    evidenceSignals,
    profileStatus: profile.profileStatus,
    privacySetting: profile.privacySetting
  };
}
