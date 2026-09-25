/**
 * EVIDENCE LAYER — PERSISTENCE STORE
 * 
 * Dual-Mode Storage:
 * 1. Supabase / Postgres `evidence` table when available.
 * 2. In-memory / local JSON store for offline test execution and failure resilience.
 */

import fs from "fs";
import path from "path";
import { supabase, isSupabaseAvailable } from "@/lib/supabase";
import { EvidenceRecord } from "./types";

const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "evidence-store.json");

// In-memory cache for fast lookups and offline testing
let inMemoryRecords: EvidenceRecord[] = [];
let initialized = false;

function loadLocalStore(): EvidenceRecord[] {
  if (initialized) return inMemoryRecords;
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const content = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
      inMemoryRecords = JSON.parse(content);
    }
  } catch {
    inMemoryRecords = [];
  }
  initialized = true;
  return inMemoryRecords;
}

function persistLocalStore(): void {
  try {
    const dir = path.dirname(LOCAL_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(inMemoryRecords, null, 2), "utf-8");
  } catch {
    // Ignore file write issues in restricted environments
  }
}

/**
 * Saves evidence records to Supabase with local fallback.
 */
export async function saveEvidenceRecords(records: EvidenceRecord[]): Promise<void> {
  if (!records || records.length === 0) return;

  // Always keep in-memory / local copy up to date
  loadLocalStore();
  for (const rec of records) {
    const existingIdx = inMemoryRecords.findIndex((r) => r.id === rec.id);
    if (existingIdx >= 0) {
      inMemoryRecords[existingIdx] = rec;
    } else {
      inMemoryRecords.push(rec);
    }
  }
  persistLocalStore();

  // If Supabase is available, sync to the postgres table
  try {
    const available = await isSupabaseAvailable();
    if (available) {
      const dbPayload = records.map((r) => ({
        id: r.id,
        candidate_id: r.candidate_id,
        role_id: r.role_id,
        source: r.source,
        claim: r.claim,
        raw_data: r.raw_data,
        normalized_facts: r.normalized_facts,
        extracted_summary: r.extracted_summary,
        status: r.status,
        status_reason: r.status_reason,
        role_relevance: r.role_relevance,
        fetched_at: r.fetched_at,
      }));

      const { error } = await supabase.from("evidence").upsert(dbPayload);
      if (error) {
        console.warn("[EvidenceStore] Supabase upsert error, saved locally:", error.message);
      }
    }
  } catch (err: any) {
    console.warn("[EvidenceStore] Supabase sync failed, retained in local store:", err?.message);
  }
}

/**
 * Retrieves all evidence records for a candidate and role.
 */
export async function getEvidenceForCandidate(
  candidateId: string,
  roleId?: string
): Promise<EvidenceRecord[]> {
  loadLocalStore();

  try {
    const available = await isSupabaseAvailable();
    if (available) {
      let query = supabase.from("evidence").select("*").eq("candidate_id", candidateId);
      if (roleId) {
        query = query.eq("role_id", roleId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return data as EvidenceRecord[];
      }
    }
  } catch {
    // Fall back to local records
  }

  return inMemoryRecords.filter(
    (r) => r.candidate_id === candidateId && (!roleId || r.role_id === roleId)
  );
}

/**
 * Clears records for a candidate (useful for tests or re-evaluations).
 */
export async function clearEvidenceForCandidate(
  candidateId: string,
  roleId?: string
): Promise<void> {
  loadLocalStore();
  inMemoryRecords = inMemoryRecords.filter(
    (r) => !(r.candidate_id === candidateId && (!roleId || r.role_id === roleId))
  );
  persistLocalStore();

  try {
    const available = await isSupabaseAvailable();
    if (available) {
      let query = supabase.from("evidence").delete().eq("candidate_id", candidateId);
      if (roleId) {
        query = query.eq("role_id", roleId);
      }
      await query;
    }
  } catch {
    // Ignore error
  }
}
