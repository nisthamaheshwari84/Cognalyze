// lib/evidence/storage.ts
//
// Dual-mode persistence layer for Evidence and CandidateDecisions:
// Uses Supabase tables (pipeline_evidence, pipeline_candidate_decisions) when available,
// with resilient local file/memory fallback for local development and offline test suites.

import fs from "fs";
import path from "path";
import { Evidence, CandidateDecision, validateCandidateDecision } from "./types";
import { supabase, isSupabaseAvailable } from "../supabase";

const LOCAL_STORE_FILE = path.join(process.cwd(), "data", "evidence-pipeline-store.json");

interface LocalStoreShape {
  evidence: Record<string, Evidence>; // keyed by evidence.id
  decisions: Record<string, CandidateDecision>; // keyed by `${candidate_id}:${stage}`
}

function getLocalStore(): LocalStoreShape {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const content = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // Return empty store on read error
  }
  return { evidence: {}, decisions: {} };
}

function writeLocalStore(store: LocalStoreShape): void {
  try {
    const dir = path.dirname(LOCAL_STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // Fail silently in environments where write access is restricted
  }
}

export async function saveEvidenceBatch(candidateId: string, evidenceList: Evidence[]): Promise<void> {
  if (evidenceList.length === 0) return;

  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const records = evidenceList.map((e) => ({
        id: e.id,
        candidate_id: candidateId,
        source_type: e.source_type,
        source_ref: e.source_ref,
        quote_or_fact: e.quote_or_fact,
        extracted_at: e.extracted_at,
      }));

      const { error } = await supabase
        .from("pipeline_evidence")
        .upsert(records, { onConflict: "id" });

      if (!error) return;
    } catch {
      // Fallback to local store on error
    }
  }

  // Local fallback
  const store = getLocalStore();
  for (const item of evidenceList) {
    store.evidence[item.id] = item;
  }
  writeLocalStore(store);
}

export async function getEvidenceForCandidate(candidateId: string): Promise<Evidence[]> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("pipeline_evidence")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("extracted_at", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          source_type: d.source_type,
          source_ref: d.source_ref,
          quote_or_fact: d.quote_or_fact,
          extracted_at: d.extracted_at,
        }));
      }
    } catch {
      // Fall through to local fallback
    }
  }

  // Local fallback
  const store = getLocalStore();
  return Object.values(store.evidence).filter((e) =>
    e.id.includes(candidateId) || (e as any).candidate_id === candidateId
  );
}

export async function saveCandidateDecision(decision: CandidateDecision): Promise<void> {
  const available = await isSupabaseAvailable();
  const decisionId = `dec_${decision.candidate_id}_${decision.stage}`;

  if (available && supabase) {
    try {
      const { error } = await supabase
        .from("pipeline_candidate_decisions")
        .upsert({
          id: decisionId,
          candidate_id: decision.candidate_id,
          stage: decision.stage,
          outcome: decision.outcome,
          criteria_results: decision.criteria_results,
          overall_confidence: decision.overall_confidence,
          rejection_summary: decision.rejection_summary || null,
          created_at: decision.created_at,
        }, { onConflict: "id" });

      if (!error) return;
    } catch {
      // Fallback to local store
    }
  }

  // Local fallback
  const store = getLocalStore();
  store.decisions[`${decision.candidate_id}:${decision.stage}`] = decision;
  writeLocalStore(store);
}

export async function getCandidateDecisions(candidateId: string): Promise<CandidateDecision[]> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("pipeline_candidate_decisions")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d: any) => ({
          candidate_id: d.candidate_id,
          stage: d.stage,
          outcome: d.outcome,
          criteria_results: d.criteria_results,
          overall_confidence: d.overall_confidence,
          rejection_summary: d.rejection_summary,
          created_at: d.created_at,
        }));
      }
    } catch {
      // Fall through to local
    }
  }

  const store = getLocalStore();
  return Object.entries(store.decisions)
    .filter(([key]) => key.startsWith(`${candidateId}:`))
    .map(([, val]) => val);
}

export async function getCandidateDecisionForStage(
  candidateId: string,
  stage: CandidateDecision["stage"]
): Promise<CandidateDecision | null> {
  const decisions = await getCandidateDecisions(candidateId);
  return decisions.find((d) => d.stage === stage) ?? null;
}
