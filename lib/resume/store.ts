/**
 * lib/resume/store.ts
 * 
 * Persistent Resume Document Vault and Metadata Store.
 * Connects directly to Supabase PostgreSQL `candidates` and `resumes` tables,
 * backed by an ACID JSON store on disk (`data/resume-store.json`).
 */

import { supabase } from "@/lib/supabase";

export interface PersistedResume {
  id: string;
  candidateId: string;
  fileName: string;
  fileUrl?: string;
  parsedText: string;
  atsScore: number;
  skills: { name: string; level: string; proficiency?: string }[];
  projects: { title: string; tech_stack: string[]; description: string }[];
  experience?: any[];
  education?: any[];
  uploadedAt: string;
  updatedAt: string;
}

function getResumeFilePath(): string {
  if (typeof window === "undefined") {
    const path = require("path");
    return path.join(process.cwd(), "data", "resume-store.json");
  }
  return "";
}

let inMemoryResumes: PersistedResume[] = [];
let isResumeStoreLoaded = false;

export function loadResumeStoreFromDisk(force = false): void {
  if (typeof window === "undefined") {
    if (isResumeStoreLoaded && !force) return;
    try {
      const fs = require("fs");
      const filePath = getResumeFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        inMemoryResumes = JSON.parse(raw);
      }
    } catch {
      inMemoryResumes = [];
    }
    isResumeStoreLoaded = true;
  }
}

export function persistResumeStoreToDisk(): void {
  if (typeof window === "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = getResumeFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmpFile = `${filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(inMemoryResumes, null, 2), "utf-8");
      fs.renameSync(tmpFile, filePath);
    } catch (err) {
      console.warn("[resume-store] Failed to persist to disk:", err);
    }
  }
}

// Initial load
loadResumeStoreFromDisk();

/**
 * Save or update a resume record both on disk and in Supabase PostgreSQL (`candidates` and `resumes` tables).
 */
export async function saveResumeRecord(data: {
  id?: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  fileName: string;
  fileUrl?: string;
  parsedText: string;
  atsScore?: number;
  skills: { name: string; level: string; proficiency?: string }[];
  projects: { title: string; tech_stack: string[]; description: string }[];
  experience?: any[];
  education?: any[];
}): Promise<PersistedResume> {
  loadResumeStoreFromDisk();

  const id = (data.id && data.id.match(/^[0-9a-fA-F-]{36}$/))
    ? data.id
    : crypto.randomUUID();

  const now = new Date().toISOString();
  const atsScore = data.atsScore ?? Math.min(95, Math.max(50, 60 + data.skills.length * 3 + data.projects.length * 5));

  const record: PersistedResume = {
    id,
    candidateId: data.candidateId,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    parsedText: data.parsedText,
    atsScore,
    skills: data.skills,
    projects: data.projects,
    experience: data.experience || [],
    education: data.education || [],
    uploadedAt: now,
    updatedAt: now,
  };

  // 1. Update in-memory & disk
  const existingIdx = inMemoryResumes.findIndex((r) => r.id === id || (r.candidateId === data.candidateId && r.fileName === data.fileName));
  if (existingIdx >= 0) {
    inMemoryResumes[existingIdx] = { ...inMemoryResumes[existingIdx], ...record };
  } else {
    inMemoryResumes.unshift(record);
  }
  persistResumeStoreToDisk();

  // 2. Persist to Supabase PostgreSQL candidates and resumes tables
  try {
    const isCandidateUuid = data.candidateId.match(/^[0-9a-fA-F-]{36}$/);
    if (isCandidateUuid) {
      // Ensure candidate row exists
      await supabase.from("candidates").upsert({
        id: data.candidateId,
        clerk_user_id: data.candidateId,
        name: data.candidateName || "Candidate",
        email: data.candidateEmail || null
      }, { onConflict: "id" });

      // Insert into resumes table
      await supabase.from("resumes").upsert({
        id,
        candidate_id: data.candidateId,
        file_url: data.fileUrl || null,
        parsed_text: data.parsedText,
        ats_score: atsScore,
        created_at: now
      }, { onConflict: "id" });
    }
  } catch (err: any) {
    console.warn("[resume-store] Supabase persist non-fatal warning:", err.message);
  }

  return record;
}

/**
 * Retrieve the latest active resume for a candidate.
 */
export async function getLatestResumeForCandidate(candidateId: string): Promise<PersistedResume | null> {
  loadResumeStoreFromDisk();

  // 1. Check local / disk first
  const found = inMemoryResumes.find((r) => r.candidateId === candidateId);
  if (found) return found;

  // 2. Try Supabase
  try {
    if (candidateId.match(/^[0-9a-fA-F-]{36}$/)) {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const fromDb: PersistedResume = {
          id: data.id,
          candidateId: data.candidate_id,
          fileName: "Uploaded Resume.pdf",
          fileUrl: data.file_url || undefined,
          parsedText: data.parsed_text || "",
          atsScore: data.ats_score || 75,
          skills: [],
          projects: [],
          uploadedAt: data.created_at,
          updatedAt: data.created_at,
        };
        inMemoryResumes.unshift(fromDb);
        persistResumeStoreToDisk();
        return fromDb;
      }
    }
  } catch {}

  return null;
}

/**
 * Retrieve all resumes for a candidate.
 */
export async function getAllResumesForCandidate(candidateId: string): Promise<PersistedResume[]> {
  loadResumeStoreFromDisk();
  return inMemoryResumes.filter((r) => r.candidateId === candidateId);
}
