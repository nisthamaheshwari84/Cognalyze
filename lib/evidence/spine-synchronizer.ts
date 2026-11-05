/**
 * lib/evidence/spine-synchronizer.ts
 * 
 * COGNALYZE RELATIONAL SPINE SYNCHRONIZER (Phase 5)
 * 
 * Bridges canonical evidence items, claims, and capability nodes to the
 * relational spine tables defined in `20260920_evidence_operating_system_spine.sql`:
 * - `sources`
 * - `claims`
 * - `evidence_items`
 * - `capability_nodes`
 * - `capability_edges`
 * - `evidence_links`
 * 
 * Features:
 * 1. Dual-mode persistence: Writes to Supabase tables when available, with
 *    resilient local file/memory fallback (`data/evidence-spine-store.json`).
 * 2. Strict multi-tenant isolation keyed to `person_id` (candidateId).
 * 3. Bidirectional mapping between canonical evidence contracts and spine records.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { supabase, isSupabaseAvailable } from "../supabase";
import {
  CanonicalEvidenceItem,
  CanonicalClaimRecord,
  CanonicalVerificationEvent,
} from "./canonical-types";
import { capabilityGraph, EvidenceLinkRecord } from "./capability-graph";

export interface SpineSourceRecord {
  id: string;
  person_id: string;
  type: string;
  uri_blob_key?: string;
  content_hash: string;
  retrieved_at: string;
  raw_text_ref?: string;
}

export interface SpineClaimRecord {
  id: string;
  person_id: string;
  source_id: string;
  kind: string;
  text: string;
  created_at: string;
}

export interface SpineEvidenceItemRecord {
  id: string;
  person_id: string;
  source_id: string;
  quote: string;
  artifact_ref?: string;
  tier: "T0" | "T1" | "T2" | "T3" | "T4";
  verification_status: string;
  extractor: string;
  quote_verified: boolean;
  observed_at: string;
  created_at: string;
}

export interface SpineEvidenceLinkRecord {
  id: string;
  evidence_id: string;
  capability_node_id?: string;
  claim_id?: string;
  relation: "supports" | "partially_supports" | "adjacent_to" | "contradicts";
  coverage: "direct" | "adjacent" | "partial";
  created_at: string;
}

interface SpineLocalStoreShape {
  sources: Record<string, SpineSourceRecord>;
  claims: Record<string, SpineClaimRecord>;
  evidence_items: Record<string, SpineEvidenceItemRecord>;
  evidence_links: Record<string, SpineEvidenceLinkRecord>;
}

function getLocalStoreFile(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "cognalyze-evidence-spine-store.json");
  }
  return path.join(process.cwd(), "data", "evidence-spine-store.json");
}

const LOCAL_STORE_FILE = getLocalStoreFile();

function getLocalSpineStore(): SpineLocalStoreShape {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const content = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // Return empty store on read error
  }
  return { sources: {}, claims: {}, evidence_items: {}, evidence_links: {} };
}

function writeLocalSpineStore(store: SpineLocalStoreShape): void {
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

/**
 * Maps evidence directness to evidence tier (T0-T4).
 */
export function mapDirectnessToTier(directness: string): "T0" | "T1" | "T2" | "T3" | "T4" {
  switch (directness) {
    case "DIRECT_IMPLEMENTATION":
      return "T3";
    case "TEST_ASSERTION":
      return "T3";
    case "ASSESSMENT_RESPONSE":
      return "T4";
    case "THIRD_PARTY_CREDENTIAL":
      return "T4";
    case "CONFIGURED_DEPENDENCY":
      return "T2";
    case "DOCUMENTED_MENTION":
      return "T1";
    default:
      return "T0";
  }
}

/**
 * Synchronizes canonical evidence items and claims into the relational spine tables.
 */
export async function syncCanonicalEvidenceToSpine(
  candidateId: string,
  items: CanonicalEvidenceItem[],
  claims: CanonicalClaimRecord[] = [],
  events: CanonicalVerificationEvent[] = []
): Promise<{
  sourcesCount: number;
  claimsCount: number;
  evidenceItemsCount: number;
  linksCount: number;
}> {
  const now = new Date().toISOString();
  const sourceMap = new Map<string, SpineSourceRecord>();
  const spineClaims: SpineClaimRecord[] = [];
  const spineEvidenceItems: SpineEvidenceItemRecord[] = [];
  const spineLinks: SpineEvidenceLinkRecord[] = [];

  // 1. Process sources from evidence items and claims
  for (const item of items) {
    const srcKey = `${item.sourceType}::${item.sourceUrl || item.sourceId}`;
    if (!sourceMap.has(srcKey)) {
      const srcId = `src_${crypto.createHash("md5").update(`${candidateId}::${srcKey}`).digest("hex").slice(0, 16)}`;
      const hash = crypto.createHash("sha256").update(item.verbatimQuote || item.id).digest("hex");
      sourceMap.set(srcKey, {
        id: srcId,
        person_id: candidateId,
        type: item.sourceType,
        uri_blob_key: item.sourceUrl,
        content_hash: hash,
        retrieved_at: item.observedAt || now,
        raw_text_ref: item.artifactRef,
      });
    }

    const sourceRecord = sourceMap.get(srcKey)!;
    const tier = mapDirectnessToTier(item.directness);

    // Create Spine Evidence Item
    spineEvidenceItems.push({
      id: item.id,
      person_id: candidateId,
      source_id: sourceRecord.id,
      quote: item.verbatimQuote || `Observed ${item.skillName || item.skillId} evidence`,
      artifact_ref: item.artifactRef,
      tier,
      verification_status: item.verificationStatus.toLowerCase(),
      extractor: item.verificationMethod || "automated_analyzer",
      quote_verified: item.verificationStatus === "VERIFIED",
      observed_at: item.observedAt || now,
      created_at: now,
    });

    // Create Evidence Link to Capability Node if node exists
    const capNode = capabilityGraph.getNodeBySlug(item.skillId);
    if (capNode) {
      const linkId = `lnk_${item.id}_${capNode.id}`;
      const relation = item.verificationStatus === "CONFLICTING" ? "contradicts" : "supports";
      const coverage = item.directness === "DIRECT_IMPLEMENTATION" ? "direct" : "partial";

      spineLinks.push({
        id: linkId,
        evidence_id: item.id,
        capability_node_id: capNode.id,
        claim_id: item.claimId,
        relation,
        coverage,
        created_at: now,
      });

      // Update in-memory capability graph
      capabilityGraph.linkEvidence({
        id: linkId,
        candidateId,
        evidenceId: item.id,
        capabilityNodeId: capNode.id,
        claimId: item.claimId,
        relation,
        coverage,
        createdAt: now,
      });
    }
  }

  // 2. Process claims
  for (const claim of claims) {
    const srcKey = `${claim.sourceType}::claim_source`;
    if (!sourceMap.has(srcKey)) {
      const srcId = `src_${crypto.createHash("md5").update(`${candidateId}::${srcKey}`).digest("hex").slice(0, 16)}`;
      sourceMap.set(srcKey, {
        id: srcId,
        person_id: candidateId,
        type: claim.sourceType,
        content_hash: crypto.createHash("sha256").update(claim.statement).digest("hex"),
        retrieved_at: claim.extractedAt || now,
      });
    }

    const sourceRecord = sourceMap.get(srcKey)!;
    spineClaims.push({
      id: claim.id,
      person_id: candidateId,
      source_id: sourceRecord.id,
      kind: claim.category,
      text: claim.statement,
      created_at: claim.extractedAt || now,
    });
  }

  const allSources = Array.from(sourceMap.values());

  // 3. Dual-mode persistence
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      if (allSources.length > 0) {
        await supabase.from("sources").upsert(allSources, { onConflict: "id" });
      }
      if (spineClaims.length > 0) {
        await supabase.from("claims").upsert(spineClaims, { onConflict: "id" });
      }
      if (spineEvidenceItems.length > 0) {
        await supabase.from("evidence_items").upsert(spineEvidenceItems, { onConflict: "id" });
      }
      if (spineLinks.length > 0) {
        await supabase.from("evidence_links").upsert(spineLinks, { onConflict: "id" });
      }
    } catch {
      // Fall through to local fallback
    }
  }

  // Local file fallback
  const store = getLocalSpineStore();
  for (const s of allSources) store.sources[s.id] = s;
  for (const c of spineClaims) store.claims[c.id] = c;
  for (const e of spineEvidenceItems) store.evidence_items[e.id] = e;
  for (const l of spineLinks) store.evidence_links[l.id] = l;
  writeLocalSpineStore(store);

  return {
    sourcesCount: allSources.length,
    claimsCount: spineClaims.length,
    evidenceItemsCount: spineEvidenceItems.length,
    linksCount: spineLinks.length,
  };
}

/**
 * Retrieves all spine evidence items for a specific candidate with multi-tenant isolation.
 */
export async function getSpineEvidenceForCandidate(candidateId: string): Promise<SpineEvidenceItemRecord[]> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("evidence_items")
        .select("*")
        .eq("person_id", candidateId);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as SpineEvidenceItemRecord[];
      }
    } catch {
      // Fallback
    }
  }

  const store = getLocalSpineStore();
  return Object.values(store.evidence_items).filter((e) => e.person_id === candidateId);
}

/**
 * Retrieves all spine claims for a specific candidate.
 */
export async function getSpineClaimsForCandidate(candidateId: string): Promise<SpineClaimRecord[]> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .eq("person_id", candidateId);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as SpineClaimRecord[];
      }
    } catch {
      // Fallback
    }
  }

  const store = getLocalSpineStore();
  return Object.values(store.claims).filter((c) => c.person_id === candidateId);
}

/**
 * Retrieves all spine sources for a specific candidate.
 */
export async function getSpineSourcesForCandidate(candidateId: string): Promise<SpineSourceRecord[]> {
  const available = await isSupabaseAvailable();
  if (available && supabase) {
    try {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("person_id", candidateId);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as SpineSourceRecord[];
      }
    } catch {
      // Fallback
    }
  }

  const store = getLocalSpineStore();
  return Object.values(store.sources).filter((s) => s.person_id === candidateId);
}

