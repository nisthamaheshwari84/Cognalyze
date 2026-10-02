/**
 * COGNALYZE — EVIDENCE LEDGER & CLAIM LEDGER SYSTEM
 * 
 * CORE LAW: NO EVIDENCE = NO CLAIM
 * 
 * Distinguishes:
 * - CLAIM
 * - EVIDENCE
 * - VERIFICATION
 * - CONCLUSION
 * 
 * These four concepts must NEVER be collapsed into one.
 * The ledger is the single immutable source of truth for downstream analysis.
 */

import { verifyQuoteInSource } from "./quote-verifier";
import { checkNonEquivalenceViolation } from "./non-equivalence";

export type VerificationStatus =
  | "NOT_EVIDENCED"
  | "SELF_CLAIM"
  | "RESUME_SUPPORTED"
  | "EXTERNALLY_FOUND"
  | "EXTERNALLY_VERIFIED"
  | "CROSS_SOURCE_VERIFIED"
  | "PARTIAL"
  | "CONTRADICTED"
  | "INACCESSIBLE";

export type EvidenceSourceType =
  | "resume"
  | "github"
  | "linkedin"
  | "leetcode"
  | "deployment"
  | "portfolio"
  | "external_url";

export type EvidenceType =
  | "self_claim"
  | "resume_context"
  | "external_signal"
  | "repo_source"
  | "repo_config"
  | "dependency_manifest"
  | "live_deployment"
  | "profile_stats"
  | "profile_link"
  | "project_implementation"
  | "work_implementation"
  | "education"
  | "certification"
  | "DIRECT_IMPLEMENTATION"
  | "PROJECT_USAGE"
  | "EXPLICIT_CLAIM"
  | "SKILL_LIST"
  | "PROFILE_LINK"
  | "EDUCATION"
  | "CERTIFICATION"
  | "EMPLOYMENT"
  | "INDIRECT_CONTEXT"
  | "NO_EVIDENCE";

export interface VerificationCheck {
  check: string;
  result: "PASSED" | "FAILED" | "SKIPPED";
  detail?: string;
}

export interface EvidenceRecord {
  evidence_id: string;
  claim_id?: string;
  source_type: EvidenceSourceType;
  source_url?: string;
  source_document: string;
  page?: number;
  section: string;
  original_text: string; // MUST BE VERBATIM TEXT FROM DOCUMENT / INSPECTED REPO
  observed_fact: string;  // Normalized interpretation, NEVER overwrites original_text
  evidence_type: EvidenceType;
  verification_status: VerificationStatus;
  checked_at: string;
  supports: string[];     // Exact technologies / concepts proven
  does_not_prove: string[]; // Explicit non-implication / non-equivalence boundaries
  checks_performed: VerificationCheck[];
}

export interface CandidateClaimRecord {
  claim_id: string;
  claim_text: string;
  claim_type: "skill" | "project" | "education" | "experience" | "metric" | "deployment";
  source_section: string;
  evidence_ids: string[];
  status: VerificationStatus;
  external_verification: "NONE" | "ATTEMPTED" | "VERIFIED" | "FAILED" | "INACCESSIBLE" | "CONTRADICTORY";
  verification_notes: string;
}

export interface AuditLogEntry {
  check: string;
  source: string;
  action: string;
  result: string;
  evidence_id: string;
  timestamp: string;
}

export interface DiscoveredSourceRecord {
  source_id: string;
  type: "github" | "linkedin" | "leetcode" | "deployment" | "portfolio" | "other";
  url: string;
  associated_claims: string[];
  verification_status:
    | "NOT_PROVIDED"
    | "DISCOVERED"
    | "ACCESSIBLE"
    | "INACCESSIBLE"
    | "VERIFIED"
    | "NOT_VERIFIED"
    | "CONTRADICTORY";
  checks_performed: VerificationCheck[];
  observed_details?: Record<string, any>;
  last_inspected?: string;
}

export class EvidenceLedger {
  private evidence: Map<string, EvidenceRecord> = new Map();
  private claims: Map<string, CandidateClaimRecord> = new Map();
  private sources: Map<string, DiscoveredSourceRecord> = new Map();
  private auditTrail: AuditLogEntry[] = [];
  private evidenceCounter = 1;
  private claimCounter = 1;
  private sourceCounter = 1;

  constructor(private rawDocumentText: string = "", private documentName: string = "resume.pdf") {}

  /**
   * Adds an immutable raw evidence item to the ledger.
   */
  public addEvidence(item: Omit<EvidenceRecord, "evidence_id" | "checked_at">): EvidenceRecord {
    const evidence_id = `E-${String(this.evidenceCounter++).padStart(3, "0")}`;
    const checked_at = new Date().toISOString();

    const record: EvidenceRecord = Object.freeze({
      ...item,
      evidence_id,
      checked_at,
      supports: [...item.supports],
      does_not_prove: [...item.does_not_prove],
      checks_performed: [...item.checks_performed],
    });

    this.evidence.set(evidence_id, record);

    this.logAudit({
      check: `Ingest Evidence (${item.section})`,
      source: item.source_type,
      action: `Created evidence record for "${item.observed_fact.slice(0, 60)}"`,
      result: item.verification_status,
      evidence_id,
      timestamp: checked_at,
    });

    return record;
  }

  /**
   * Registers a candidate claim in the Claim Ledger.
   */
  public addClaim(claim: Omit<CandidateClaimRecord, "claim_id">): CandidateClaimRecord {
    const claim_id = `C-${String(this.claimCounter++).padStart(3, "0")}`;
    const record: CandidateClaimRecord = Object.freeze({
      ...claim,
      claim_id,
      evidence_ids: [...claim.evidence_ids],
    });

    this.claims.set(claim_id, record);
    return record;
  }

  /**
   * Registers a discovered external source.
   */
  public addSource(source: Omit<DiscoveredSourceRecord, "source_id">): DiscoveredSourceRecord {
    const source_id = `S-${String(this.sourceCounter++).padStart(3, "0")}`;
    const record: DiscoveredSourceRecord = {
      ...source,
      source_id,
      associated_claims: [...source.associated_claims],
      checks_performed: [...source.checks_performed],
    };

    this.sources.set(source_id, record);
    return record;
  }

  /**
   * Logs an entry in the Evidence Audit Trail.
   */
  public logAudit(entry: AuditLogEntry) {
    this.auditTrail.push(Object.freeze({ ...entry }));
  }

  public getEvidence(id: string): EvidenceRecord | undefined {
    return this.evidence.get(id);
  }

  public getAllEvidence(): EvidenceRecord[] {
    return Array.from(this.evidence.values());
  }

  public getClaim(id: string): CandidateClaimRecord | undefined {
    return this.claims.get(id);
  }

  public getAllClaims(): CandidateClaimRecord[] {
    return Array.from(this.claims.values());
  }

  public getAllSources(): DiscoveredSourceRecord[] {
    return Array.from(this.sources.values());
  }

  public getAuditTrail(): AuditLogEntry[] {
    return [...this.auditTrail];
  }

  /**
   * CLAIM VALIDATION GATE (PHASE 14)
   * Non-negotiable programmatic gate before any claim is returned or displayed.
   */
  public validateClaim(params: {
    claimText: string;
    targetRequirement?: string;
    evidenceIds: string[];
    requiresExternalVerification?: boolean;
  }): {
    allowed: boolean;
    rejectionReason?: string;
    evidenceRecords: EvidenceRecord[];
    effectiveStatus: VerificationStatus;
  } {
    // 1. Must have evidence IDs
    if (!params.evidenceIds || params.evidenceIds.length === 0) {
      return {
        allowed: false,
        rejectionReason: `REJECTED: Claim "${params.claimText}" has no traceable evidence records.`,
        evidenceRecords: [],
        effectiveStatus: "NOT_EVIDENCED",
      };
    }

    // 2. Evidence IDs must exist in the ledger
    const records: EvidenceRecord[] = [];
    for (const eid of params.evidenceIds) {
      const rec = this.evidence.get(eid);
      if (!rec) {
        return {
          allowed: false,
          rejectionReason: `REJECTED: Evidence ID "${eid}" does not exist in the Evidence Ledger.`,
          evidenceRecords: [],
          effectiveStatus: "NOT_EVIDENCED",
        };
      }
      records.push(rec);
    }

    // 3. For every resume record, check that the original_text exists in raw document
    for (const rec of records) {
      if (rec.source_type === "resume" && this.rawDocumentText) {
        const quoteCheck = verifyQuoteInSource(this.rawDocumentText, rec.original_text);
        if (!quoteCheck.verified) {
          return {
            allowed: false,
            rejectionReason: `REJECTED: Original source text for evidence ${rec.evidence_id} is not present in document.`,
            evidenceRecords: [],
            effectiveStatus: "NOT_EVIDENCED",
          };
        }
      }
    }

    // 4. Non-equivalence check: Does the evidence actually support the claim/requirement?
    if (params.targetRequirement) {
      for (const rec of records) {
        const violation = checkNonEquivalenceViolation(params.targetRequirement, rec.original_text);
        if (violation.isViolated && !rec.supports.includes(params.targetRequirement.toLowerCase())) {
          return {
            allowed: false,
            rejectionReason: `REJECTED: Non-equivalence violation: ${violation.explanation}`,
            evidenceRecords: records,
            effectiveStatus: "PARTIAL",
          };
        }
      }
    }

    // 5. External verification requirement
    if (params.requiresExternalVerification) {
      const hasExt = records.some(
        (r) =>
          r.source_type !== "resume" &&
          (r.verification_status === "EXTERNALLY_VERIFIED" || r.verification_status === "CROSS_SOURCE_VERIFIED")
      );
      if (!hasExt) {
        return {
          allowed: false,
          rejectionReason: `REJECTED: Independent external verification was required but external source could not be verified.`,
          evidenceRecords: records,
          effectiveStatus: "SELF_CLAIM",
        };
      }
    }

    // Determine highest defensible status
    let effectiveStatus: VerificationStatus = "SELF_CLAIM";
    if (records.some((r) => r.verification_status === "CROSS_SOURCE_VERIFIED")) {
      effectiveStatus = "CROSS_SOURCE_VERIFIED";
    } else if (records.some((r) => r.verification_status === "EXTERNALLY_VERIFIED")) {
      effectiveStatus = "EXTERNALLY_VERIFIED";
    } else if (records.some((r) => r.verification_status === "RESUME_SUPPORTED")) {
      effectiveStatus = "RESUME_SUPPORTED";
    } else if (records.some((r) => r.verification_status === "PARTIAL")) {
      effectiveStatus = "PARTIAL";
    } else if (records.some((r) => r.verification_status === "CONTRADICTED")) {
      effectiveStatus = "CONTRADICTED";
    } else if (records.some((r) => r.verification_status === "INACCESSIBLE")) {
      effectiveStatus = "INACCESSIBLE";
    }

    return {
      allowed: true,
      evidenceRecords: records,
      effectiveStatus,
    };
  }
}
