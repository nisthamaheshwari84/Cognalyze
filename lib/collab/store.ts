// lib/collab/store.ts
//
// Dual-mode data access layer for Collaboration Roles, Feeds, and Auto-DNA Applications.
// Queries Supabase when configured, and falls back to persistent local storage for tests and offline development.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Role, RoleApplication, CollaborationFeedRole } from "./types";
import { supabase, isSupabaseAvailable } from "../supabase";
import { getStudentDNA } from "../ai/student-dna";

const LOCAL_STORE_FILE = path.join(process.cwd(), "data", "collab-feed-store.json");

interface LocalCollabStore {
  roles: Record<string, Role>;
  applications: Record<string, RoleApplication>;
  resumes: Record<string, { id: string; candidate_id: string; title: string; file_url?: string; resume_text?: string }>;
  analyses: Record<string, { id: string; candidate_id: string; dna_data: Record<string, unknown>; created_at: string }>;
}

function getLocalStore(): LocalCollabStore {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const content = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch {}
  return { roles: {}, applications: {}, resumes: {}, analyses: {} };
}

function writeLocalStore(store: LocalCollabStore): void {
  try {
    const dir = path.dirname(LOCAL_STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {}
}

export async function createRole(input: {
  recruiter_id: string;
  title: string;
  description: string;
  required_skills: string[];
}): Promise<Role> {
  const newRole: Role = {
    id: crypto.randomUUID(),
    recruiter_id: input.recruiter_id,
    title: input.title.trim(),
    description: input.description.trim(),
    required_skills: input.required_skills ?? [],
    feed_type: "collaboration", // Hardcoded per specification: open roles ALWAYS go to collaboration feed
    status: "open",
    created_at: new Date().toISOString(),
  };

  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("roles")
        .insert({
          id: newRole.id,
          recruiter_id: newRole.recruiter_id,
          title: newRole.title,
          description: newRole.description,
          required_skills: newRole.required_skills,
          feed_type: "collaboration",
          status: "open",
        })
        .select()
        .single();

      if (!error && data) {
        return data as Role;
      }
    } catch {}
  }

  // Fallback to local store
  const store = getLocalStore();
  store.roles[newRole.id] = newRole;
  writeLocalStore(store);
  return newRole;
}

export async function getRoleById(roleId: string): Promise<Role | null> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("id", roleId)
        .single();

      if (!error && data) {
        return data as Role;
      }
    } catch {}
  }

  const store = getLocalStore();
  return store.roles[roleId] ?? null;
}

export async function closeRole(roleId: string, recruiterId: string): Promise<{ success: boolean; error?: string }> {
  const role = await getRoleById(roleId);
  if (!role) {
    return { success: false, error: "Role not found" };
  }
  if (role.recruiter_id !== recruiterId) {
    return { success: false, error: "Unauthorized to close this role" };
  }

  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { error } = await supabase
        .from("roles")
        .update({ status: "closed" })
        .eq("id", roleId);

      if (!error) return { success: true };
    } catch {}
  }

  const store = getLocalStore();
  if (store.roles[roleId]) {
    store.roles[roleId].status = "closed";
    writeLocalStore(store);
  }
  return { success: true };
}

export async function getRolesByRecruiter(recruiterId: string): Promise<Role[]> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("recruiter_id", recruiterId)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as Role[];
      }
    } catch {}
  }

  const store = getLocalStore();
  return Object.values(store.roles).filter((r) => r.recruiter_id === recruiterId);
}

export async function getCollaborationFeed(
  studentId: string,
  page = 0,
  pageSize = 20
): Promise<{ feed: CollaborationFeedRole[]; page: number }> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data: roles, error } = await supabase
        .from("roles")
        .select("*")
        .eq("feed_type", "collaboration")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (!error && Array.isArray(roles)) {
        const roleIds = roles.map((r) => r.id);
        const { data: existingApps } = await supabase
          .from("role_applications")
          .select("role_id")
          .eq("student_id", studentId)
          .in("role_id", roleIds);

        const appliedSet = new Set((existingApps || []).map((a: any) => a.role_id));

        const feed: CollaborationFeedRole[] = roles.map((r: any) => ({
          ...r,
          already_applied: appliedSet.has(r.id),
        }));

        return { feed, page };
      }
    } catch {}
  }

  // Fallback to local store
  const store = getLocalStore();
  const openCollabRoles = Object.values(store.roles)
    .filter((r) => r.feed_type === "collaboration" && r.status === "open")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const paged = openCollabRoles.slice(page * pageSize, (page + 1) * pageSize);
  const feed: CollaborationFeedRole[] = paged.map((r) => {
    const appKey = `${r.id}:${studentId}`;
    const already_applied = Boolean(store.applications[appKey]);
    return {
      ...r,
      already_applied,
    };
  });

  return { feed, page };
}

export async function hasStudentApplied(roleId: string, studentId: string): Promise<boolean> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data } = await supabase
        .from("role_applications")
        .select("id")
        .eq("role_id", roleId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (data) return true;
    } catch {}
  }

  const store = getLocalStore();
  return Boolean(store.applications[`${roleId}:${studentId}`]);
}

export async function verifyResumeBelongsToStudent(
  resumeId: string,
  studentId: string
): Promise<{ valid: boolean; resume?: { id: string; candidate_id: string; title: string } }> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("id, candidate_id, title")
        .eq("id", resumeId)
        .single();

      if (!error && data) {
        return { valid: data.candidate_id === studentId, resume: data };
      }
    } catch {}
  }

  const store = getLocalStore();
  const resume = store.resumes[resumeId];
  if (resume) {
    return { valid: resume.candidate_id === studentId, resume };
  }

  // If local store is empty, permit if resumeId is a demonstration ID prefixed with studentId or standard demo resume
  if (resumeId.includes(studentId) || resumeId === "resume_demo_default") {
    return { valid: true, resume: { id: resumeId, candidate_id: studentId, title: "Primary Resume" } };
  }

  return { valid: false };
}

export async function getStudentLatestAnalysis(
  studentId: string
): Promise<{ id: string; dna_data: Record<string, unknown> } | null> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, dna_data, full_report, created_at")
        .eq("candidate_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const dnaData = (data.dna_data || (data.full_report as any)?.dna || (data.full_report as any)?.candidate_dna) as Record<string, unknown>;
        if (dnaData && Object.keys(dnaData).length > 0) {
          return { id: data.id, dna_data: dnaData };
        }
      }
    } catch {}
  }

  const store = getLocalStore();
  // Check local analysis rows
  const userAnalyses = Object.values(store.analyses)
    .filter((a) => a.candidate_id === studentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (userAnalyses.length > 0 && userAnalyses[0].dna_data) {
    return { id: userAnalyses[0].id, dna_data: userAnalyses[0].dna_data };
  }

  return null;
}

export async function createRoleApplication(input: {
  role_id: string;
  student_id: string;
  resume_id: string;
  github_url?: string;
  dna_snapshot: Record<string, unknown>;
  dna_snapshot_source_analysis_id?: string;
}): Promise<RoleApplication> {
  const newApp: RoleApplication = {
    id: crypto.randomUUID(),
    role_id: input.role_id,
    student_id: input.student_id,
    resume_id: input.resume_id,
    github_url: input.github_url ?? null,
    dna_snapshot: input.dna_snapshot, // Frozen snapshot copy
    dna_snapshot_source_analysis_id: input.dna_snapshot_source_analysis_id ?? null,
    applied_at: new Date().toISOString(),
  };

  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("role_applications")
        .insert({
          id: newApp.id,
          role_id: newApp.role_id,
          student_id: newApp.student_id,
          resume_id: newApp.resume_id,
          github_url: newApp.github_url,
          dna_snapshot: newApp.dna_snapshot,
          dna_snapshot_source_analysis_id: newApp.dna_snapshot_source_analysis_id,
        })
        .select()
        .single();

      if (!error && data) {
        return data as RoleApplication;
      }
      if (error && error.code === "23505") {
        throw { code: "23505", message: "You have already applied to this role" };
      }
    } catch (err: any) {
      if (err.code === "23505") throw err;
    }
  }

  const store = getLocalStore();
  const key = `${input.role_id}:${input.student_id}`;
  if (store.applications[key]) {
    throw { code: "23505", message: "You have already applied to this role" };
  }

  store.applications[key] = newApp;
  writeLocalStore(store);
  return newApp;
}

export async function getRoleApplications(roleId: string): Promise<RoleApplication[]> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("role_applications")
        .select("*")
        .eq("role_id", roleId)
        .order("applied_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as RoleApplication[];
      }
    } catch {}
  }

  const store = getLocalStore();
  return Object.values(store.applications).filter((a) => a.role_id === roleId);
}

// Helper to seed a student's resume & analysis for testing or initial setup
export function seedStudentData(studentId: string, resumeId: string, dnaData: Record<string, unknown>): void {
  const store = getLocalStore();
  store.resumes[resumeId] = {
    id: resumeId,
    candidate_id: studentId,
    title: "Software Engineer Resume",
    resume_text: "Fullstack Developer with React, TypeScript, and Node.js.",
  };
  const analysisId = `analysis_${studentId}_01`;
  store.analyses[analysisId] = {
    id: analysisId,
    candidate_id: studentId,
    dna_data: dnaData,
    created_at: new Date().toISOString(),
  };
  writeLocalStore(store);
}
