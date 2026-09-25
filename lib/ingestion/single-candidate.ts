/**
 * SINGLE-CANDIDATE INGESTION PIPELINE (Phase 3)
 * 
 * Pipeline:
 * Raw Resume -> Text Normalization & Delimiting -> Claims Extraction ->
 * Deterministic Quote Verification (T4) -> Source & Evidence Model -> Assessments Derivation.
 * 
 * Non-Negotiable Guarantees:
 * - 100% of shown evidence carries a verified verbatim quote and exact character offsets.
 * - Resume text is strictly treated as untrusted data (prompt-injection resistant).
 * - Absence of evidence produces UNKNOWN states, never fabricated claims or negative scores.
 */

import { verifyQuoteInSource } from "@/lib/evidence/quote-verifier";
import { deriveRequirementState, DerivationResult } from "@/lib/evidence/derive";
import { JdRequirement } from "@/lib/roles/types";

export interface CandidateIdentity {
  fullName: string;
  email?: string;
  phone?: string;
  isSynthetic: boolean;
}

export interface IngestedClaim {
  id: string;
  kind: "skill" | "project" | "role_held" | "responsibility" | "achievement" | "education";
  text: string;
  span: {
    startChar: number;
    endChar: number;
    rawSnippet: string;
  };
}

export interface IngestedEvidenceItem {
  id: string;
  sourceId: string;
  tier: "T0" | "T1" | "T2" | "T3" | "T4";
  quote: string;
  span: {
    startChar: number;
    endChar: number;
  };
  quoteVerified: boolean;
  artifactRef?: string;
  occurredAt?: string;
  observedAt: string;
  extractor: "deterministic" | "llm_verified";
}

export interface IngestedCandidateResult {
  candidateId: string;
  identity: CandidateIdentity;
  source: {
    id: string;
    type: "resume_pdf" | "candidate_submitted";
    contentHash: string;
    rawText: string;
  };
  claims: IngestedClaim[];
  evidenceItems: IngestedEvidenceItem[];
  discardedCount: number;
  discardLogs: { quote: string; reason: string }[];
  assessments?: Record<string, DerivationResult>; // requirementId -> DerivationResult
}

/**
 * Deterministically ingests a candidate resume, extracts claims & evidence,
 * validates quotes against source text, and optionally derives assessments against role requirements.
 */
export function ingestCandidateResume(
  rawResumeText: string,
  options: {
    roleRequirements?: JdRequirement[];
    candidateId?: string;
    isSynthetic?: boolean;
    now?: Date;
  } = {}
): IngestedCandidateResult {
  const rawText = rawResumeText || "";
  const now = options.now || new Date();
  const candidateId = options.candidateId || `cand-${Date.now().toString(36)}`;
  const sourceId = `src-${candidateId}`;

  // 1. Identify Candidate Identity & Sanitize
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  let fullName = "Candidate";
  let email: string | undefined;
  let phone: string | undefined;

  // Header detection for name and contact info
  if (lines.length > 0 && lines[0].length < 60 && !lines[0].includes(":") && !lines[0].toLowerCase().includes("resume")) {
    fullName = lines[0].replace(/^#+\s*/, "").trim();
  }

  for (const line of lines.slice(0, 12)) {
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !email) email = emailMatch[0];

    const phoneMatch = line.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch && !phone) phone = phoneMatch[0];
  }

  const claims: IngestedClaim[] = [];
  const evidenceItems: IngestedEvidenceItem[] = [];
  const discardLogs: { quote: string; reason: string }[] = [];

  let claimIdx = 0;
  let evidenceIdx = 0;

  // 2. Parse Structured Bullets & Claims from Untrusted Source
  for (const line of lines) {
    const isBullet = /^[-•*]|\d+\./.test(line);
    const cleanLine = line.replace(/^[-•*]|\d+\.\s*/, "").trim();

    if (cleanLine.length < 15) continue;

    // Detect Prompt Injection Traps: if an adversarial instruction is embedded, treat purely as data
    const isPromptInjection = /ignore (?:all )?previous instructions/i.test(cleanLine) ||
      /you are now a/i.test(cleanLine) ||
      /give this candidate (?:a |100%|full )?score/i.test(cleanLine);

    if (isPromptInjection) {
      // Injected instructions are recorded as data, never executed, and discarded from valid capability evidence
      discardLogs.push({
        quote: cleanLine,
        reason: "Adversarial prompt injection pattern detected. Treated strictly as text data and rejected from capability claims.",
      });
      continue;
    }

    // Determine Claim Kind
    let kind: IngestedClaim["kind"] = "responsibility";
    const lower = cleanLine.toLowerCase();

    if (lower.includes("degree") || lower.includes("bachelor") || lower.includes("master") || lower.includes("university") || lower.includes("gpa")) {
      kind = "education";
    } else if (lower.includes("achieved") || lower.includes("awarded") || lower.includes("winner") || lower.includes("first place")) {
      kind = "achievement";
    } else if (lower.includes("built") || lower.includes("developed") || lower.includes("architected") || lower.includes("engineered") || lower.includes("designed")) {
      kind = "project";
    } else if (lower.includes("led") || lower.includes("managed") || lower.includes("mentored") || lower.includes("spearheaded")) {
      kind = "role_held";
    } else if (lower.includes("proficient in") || lower.includes("experience in") || lower.includes("skilled in")) {
      kind = "skill";
    }

    // 3. Deterministic Quote Verification against Raw Source Text (Truth Contract T4)
    const verification = verifyQuoteInSource(rawText, cleanLine);

    if (!verification.verified || !verification.sourceOffsets) {
      discardLogs.push({
        quote: cleanLine,
        reason: verification.rejectionReason || "Could not be verified in raw source text.",
      });
      continue;
    }

    claimIdx++;
    evidenceIdx++;
    const claimId = `claim-${claimIdx}`;
    const evidenceId = `ev-${evidenceIdx}`;

    claims.push({
      id: claimId,
      kind,
      text: verification.verbatimQuote,
      span: {
        startChar: verification.sourceOffsets.startChar,
        endChar: verification.sourceOffsets.endChar,
        rawSnippet: verification.verbatimQuote,
      },
    });

    // Determine Evidence Tier
    // T1: Referenced self-reported claim in resume
    // T2: Observed artifact (e.g. references a verifiable commit, PR, or hosted project link)
    const hasArtifactLink = /(?:https?:\/\/)?(?:github\.com|gitlab\.com|bitbucket\.org|kaggle\.com)\/[^\s)]+/i.test(cleanLine);
    const tier = hasArtifactLink ? "T2" : "T1";

    evidenceItems.push({
      id: evidenceId,
      sourceId,
      tier,
      quote: verification.verbatimQuote,
      span: {
        startChar: verification.sourceOffsets.startChar,
        endChar: verification.sourceOffsets.endChar,
      },
      quoteVerified: true,
      artifactRef: hasArtifactLink ? cleanLine.match(/(?:https?:\/\/)?(?:github\.com|gitlab\.com)\/[^\s)]+/i)?.[0] : undefined,
      observedAt: now.toISOString(),
      extractor: "deterministic",
    });
  }

  // 4. Derive Assessments against Role Requirements if provided
  let assessments: Record<string, DerivationResult> | undefined;

  const STOP_WORDS = new Set([
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "at", "by", "for", "with",
    "about", "against", "between", "into", "through", "during", "before", "after", "above", "below",
    "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further",
    "then", "once", "here", "there", "all", "any", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can",
    "will", "just", "should", "now", "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "this", "that", "these", "those",
    // Generic recruiting noise
    "engineer", "engineering", "developer", "development", "experience", "experienced",
    "years", "deep", "high", "hands", "demonstrated", "skills", "proficient", "proficiency",
    "services", "systems", "platform", "production", "enterprise", "building", "built", "role",
  ]);

  if (options.roleRequirements && options.roleRequirements.length > 0) {
    assessments = {};
    for (const req of options.roleRequirements) {
      // Extract specific key technical tokens from requirement text
      const reqTokens = req.text
        .toLowerCase()
        .split(/[^a-zA-Z0-9+#_.-]+/)
        .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

      const relevantEvidence = evidenceItems
        .filter((ev) => {
          const evLower = ev.quote.toLowerCase();
          return reqTokens.some((token) => {
            const regex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
            return regex.test(evLower);
          });
        })
        .map((ev) => ({
          id: ev.id,
          sourceId: ev.sourceId,
          tier: ev.tier,
          coverage: "direct" as const,
          relation: "supports" as const,
          occurredAt: ev.observedAt,
        }));

      assessments[req.id] = deriveRequirementState(req.id, relevantEvidence, [], {
        now,
        isDismissedByRecruiter: req.status === "dismissed",
      });
    }
  }

  return {
    candidateId,
    identity: {
      fullName,
      email,
      phone,
      isSynthetic: options.isSynthetic ?? false,
    },
    source: {
      id: sourceId,
      type: "resume_pdf",
      contentHash: `hash-${rawText.length}-${candidateId}`,
      rawText,
    },
    claims,
    evidenceItems,
    discardedCount: discardLogs.length,
    discardLogs,
    assessments,
  };
}
