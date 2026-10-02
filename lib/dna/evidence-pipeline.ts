/**
 * lib/dna/evidence-pipeline.ts
 * EVIDENCE VALIDATION, NORMALIZATION & DEDUPLICATION PIPELINE
 * 
 * Implements:
 * 1. Normalized Evidence Object Schema with provenance.
 * 2. Source Reliability Hierarchy (Self-Declared to Verified Assessment).
 * 3. Raw Data Validation Layer (Reject impossible values, schema errors).
 * 4. Entity Deduplication (Resume + GitHub + LinkedIn = 1 project entity).
 * 5. Multi-Source Corroboration (Strengthens confidence without multiplying count).
 * 6. Contradiction Detection (Neutral mismatch alerts without accusations).
 * 7. Temporal & Recency Layer (Decay calculation without destructive overwrites).
 */

import { normalizeSkill, getCanonicalSkill } from "./taxonomy";

export type DNASourceType =
  | "resume"
  | "project"
  | "github"
  | "leetcode"
  | "codeforces"
  | "assessment"
  | "practice"
  | "interview"
  | "hackathon"
  | "certification"
  | "linkedin"
  | "self_declared";

export type EvidenceVerificationStatus =
  | "CLAIMED"       // Student stated it
  | "OBSERVED"      // Code or repository artifact exists
  | "DEMONSTRATED"  // Solved task or completed project
  | "VERIFIED"      // Independently tested or verified on public API
  | "REPEATED"      // Multiple independent instances
  | "CONFLICTING";  // Contradicted by assessment or interview

export type RecencyState = "CURRENT" | "RECENT" | "AGING" | "STALE";

export interface DNAEvidence {
  id: string;
  userId: string;
  sourceType: DNASourceType;
  sourceId: string;
  sourceUrl?: string;
  skillId: string; // Canonical skill id
  evidenceType: string;
  claim: string;
  extractedValue?: any;
  strength: number; // 0.0 to 1.0
  reliability: number; // 0.0 to 1.0 based on source hierarchy
  confidence: "HIGH" | "MEDIUM" | "LOW";
  recency: RecencyState;
  verificationStatus: EvidenceVerificationStatus;
  provenance: string; // e.g. "Resume -> Projects -> L12"
  createdAt: string;
  observedAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

// ── 1. CONFIGURABLE SOURCE RELIABILITY HIERARCHY (Section 6) ─────────────────
export const SOURCE_RELIABILITY_MAP: Record<DNASourceType, number> = {
  self_declared: 0.3,
  resume: 0.45,
  linkedin: 0.5,
  hackathon: 0.65,
  project: 0.75,
  github: 0.85,
  leetcode: 0.85,
  codeforces: 0.85,
  practice: 0.88,
  assessment: 0.92,
  interview: 0.95,
  certification: 0.7
};

// ── 2. RAW DATA VALIDATION LAYER (Section 5) ─────────────────────────────────

export interface RawValidationResult {
  valid: boolean;
  sanitizedData?: any;
  rejectionReason?: string;
  flags: string[];
}

export function validateRawSourceData(
  sourceType: DNASourceType,
  userId: string,
  rawPayload: any
): RawValidationResult {
  const flags: string[] = [];

  // A. Guard: Payload existence
  if (!rawPayload || typeof rawPayload !== "object") {
    return { valid: false, rejectionReason: "Empty or malformed payload.", flags };
  }

  // B. Guard: User identity verification
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return { valid: false, rejectionReason: "Missing authenticated user ID.", flags };
  }

  // C. Source-specific validation rules
  if (sourceType === "assessment" || sourceType === "practice") {
    const score = rawPayload.score;
    if (typeof score !== "number" || isNaN(score) || score < 0 || score > 100) {
      return {
        valid: false,
        rejectionReason: `Impossible assessment score: ${score}. Scores must be within [0, 100].`,
        flags
      };
    }
  }

  if (sourceType === "leetcode" || sourceType === "codeforces") {
    const totalSolved = rawPayload.total_solved || rawPayload.totalSolved;
    if (typeof totalSolved === "number" && totalSolved < 0) {
      return {
        valid: false,
        rejectionReason: `Negative problem count detected: ${totalSolved}.`,
        flags
      };
    }
  }

  if (sourceType === "github") {
    // Check for impossible future dates
    if (rawPayload.latestCommitDate) {
      const commitTime = new Date(rawPayload.latestCommitDate).getTime();
      const now = Date.now() + 60000; // 1 min margin
      if (commitTime > now) {
        flags.push("Future-dated commit timestamp flagged.");
      }
    }
  }

  return {
    valid: true,
    sanitizedData: rawPayload,
    flags
  };
}

// ── 3. TEMPORAL & RECENCY CALCULATOR (Section 13) ───────────────────────────

export function calculateRecencyState(observedDateStr?: string): {
  recency: RecencyState;
  multiplier: number;
  label: string;
} {
  if (!observedDateStr) {
    return { recency: "RECENT", multiplier: 0.9, label: "Observed recently" };
  }

  const observed = new Date(observedDateStr).getTime();
  const now = Date.now();
  const diffDays = Math.max(0, Math.floor((now - observed) / (1000 * 60 * 60 * 24)));

  if (diffDays <= 90) {
    return { recency: "CURRENT", multiplier: 1.0, label: "Demonstrated recently (< 3 months)" };
  }
  if (diffDays <= 180) {
    return { recency: "RECENT", multiplier: 0.9, label: "Demonstrated 3–6 months ago" };
  }
  if (diffDays <= 365) {
    return { recency: "AGING", multiplier: 0.75, label: "Demonstrated 6–12 months ago" };
  }
  return { recency: "STALE", multiplier: 0.6, label: "Evidence aging (> 1 year ago)" };
}

// ── 4. CANONICAL PROJECT ENTITY NORMALIZATION (Section 11) ────────────────────

export function generateCanonicalProjectId(projectTitle: string): string {
  return "proj_" + projectTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// ── 5. EVIDENCE FACTORY & NORMALIZATION ──────────────────────────────────────

export interface CreateEvidenceParams {
  userId: string;
  sourceType: DNASourceType;
  sourceId: string;
  sourceUrl?: string;
  rawSkill: string;
  evidenceType: string;
  claim: string;
  extractedValue?: any;
  observedAt?: string;
  provenance: string;
  metadata?: Record<string, any>;
}

export function createNormalizedEvidence(params: CreateEvidenceParams): DNAEvidence | null {
  const canonical = normalizeSkill(params.rawSkill);
  if (!canonical) {
    return null; // Skill unrecognized in canonical taxonomy
  }

  const reliability = SOURCE_RELIABILITY_MAP[params.sourceType] || 0.5;
  const observedDate = params.observedAt || new Date().toISOString();
  const { recency } = calculateRecencyState(observedDate);

  // Compute baseline strength and verification status
  let verificationStatus: EvidenceVerificationStatus = "CLAIMED";
  let strength = 0.5;

  if (params.sourceType === "assessment" || params.sourceType === "interview") {
    verificationStatus = "VERIFIED";
    strength = 0.95;
  } else if (params.sourceType === "github" || params.sourceType === "project") {
    verificationStatus = "DEMONSTRATED";
    strength = 0.8;
  } else if (params.sourceType === "leetcode" || params.sourceType === "codeforces") {
    verificationStatus = "OBSERVED";
    strength = 0.85;
  }

  const id = `ev_${params.userId}_${canonical.skillId}_${params.sourceType}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id,
    userId: params.userId,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    sourceUrl: params.sourceUrl,
    skillId: canonical.skillId,
    evidenceType: params.evidenceType,
    claim: params.claim,
    extractedValue: params.extractedValue,
    strength,
    reliability,
    confidence: reliability >= 0.8 ? "HIGH" : reliability >= 0.5 ? "MEDIUM" : "LOW",
    recency,
    verificationStatus,
    provenance: params.provenance,
    createdAt: new Date().toISOString(),
    observedAt: observedDate,
    metadata: params.metadata
  };
}

// ── 6. CONTRADICTION DETECTION ENGINE (Section 14) ───────────────────────────

export interface ContradictionFinding {
  skillId: string;
  skillName: string;
  claimedLevel: string;
  conflictingSource: string;
  conflictingValue: string;
  neutralExplanation: string;
}

export function detectContradictions(
  skillId: string,
  evidenceList: DNAEvidence[]
): ContradictionFinding | null {
  const canonical = getCanonicalSkill(skillId);
  if (!canonical) return null;

  const resumeClaim = evidenceList.find(e => e.sourceType === "resume");
  const assessment = evidenceList.find(e => e.sourceType === "assessment" || e.sourceType === "practice");

  if (resumeClaim && assessment) {
    const claimLower = resumeClaim.claim.toLowerCase();
    const isClaimedAdvanced = claimLower.includes("advanced") || claimLower.includes("expert");
    const assessmentScore = assessment.extractedValue?.score || assessment.metadata?.score;

    if (isClaimedAdvanced && typeof assessmentScore === "number" && assessmentScore < 50) {
      return {
        skillId,
        skillName: canonical.name,
        claimedLevel: "Advanced / Expert",
        conflictingSource: "Practical Assessment",
        conflictingValue: `${assessmentScore}% Score`,
        neutralExplanation: `You have claimed advanced ${canonical.name}, but your recent practical assessment score (${assessmentScore}%) indicates foundational concepts require further reinforcement.`
      };
    }
  }

  return null;
}

// ── 7. RAW SOURCE DATA INTERFACE & BATCH PROCESSING PIPELINE ───────────────

export interface RawSourceData {
  sourceType: DNASourceType;
  sourceId: string;
  sourceUrl?: string;
  userId: string;
  skillRaw: string;
  evidenceType: string;
  claim: string;
  extractedValue?: any;
  strength?: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface EvidenceFilter {
  skillId?: string;
  sourceType?: DNASourceType;
  minReliability?: number;
  recency?: RecencyState;
}

/**
 * Process a batch of raw source items through validation, canonical taxonomy normalization,
 * project entity deduplication, and reliability weighting.
 */
export function processEvidencePipeline(rawItems: RawSourceData[]): DNAEvidence[] {
  const result: DNAEvidence[] = [];
  const canonicalProjectEntityMap: Map<string, DNAEvidence> = new Map();

  for (const raw of rawItems) {
    // 1. Validation
    const validation = validateRawSourceData(raw.sourceType, raw.userId, raw.metadata || raw);
    if (!validation.valid) {
      continue; // Skip invalid raw data
    }

    // 2. Canonical Skill Mapping
    const canonical = normalizeSkill(raw.skillRaw);
    if (!canonical) {
      continue; // Unrecognized skill
    }

    // 3. Project Entity Deduplication (Section 11)
    // If multiple sources (Resume, GitHub, LinkedIn, Portfolio) reference the same underlying project entity,
    // we unify into 1 entity and corroborate rather than inflating counts.
    const projectTitle = raw.metadata?.projectTitle || raw.metadata?.canonicalProjectId;
    if (projectTitle && (raw.sourceType === "project" || raw.sourceType === "github" || raw.sourceType === "resume" || raw.sourceType === "linkedin")) {
      const canonicalProjId = generateCanonicalProjectId(projectTitle) + "_" + canonical.skillId;
      const existing = canonicalProjectEntityMap.get(canonicalProjId);

      if (existing) {
        // Corroborate existing evidence without duplicate counting
        existing.verificationStatus = "REPEATED";
        existing.confidence = "HIGH";
        existing.strength = Math.min(1.0, existing.strength + 0.1);
        if (!existing.provenance.toLowerCase().includes(raw.sourceType.toLowerCase())) {
          existing.provenance += ` + ${raw.sourceType}`;
        }
        continue;
      }
    }

    // 4. Create normalized evidence
    const normalized = createNormalizedEvidence({
      userId: raw.userId,
      sourceType: raw.sourceType,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      rawSkill: raw.skillRaw,
      evidenceType: raw.evidenceType,
      claim: raw.claim,
      extractedValue: raw.extractedValue,
      observedAt: raw.timestamp,
      provenance: `${raw.sourceType.toUpperCase()} -> ${raw.sourceId}`,
      metadata: raw.metadata
    });

    if (normalized) {
      if (typeof raw.strength === "number") {
        normalized.strength = Math.min(1.0, Math.max(0.1, raw.strength));
      }
      result.push(normalized);

      if (projectTitle) {
        const canonicalProjId = generateCanonicalProjectId(projectTitle) + "_" + canonical.skillId;
        canonicalProjectEntityMap.set(canonicalProjId, normalized);
      }
    }
  }

  return result;
}

