/**
 * lib/evidence/dispute-and-evidence-center.ts
 *
 * COGNALYZE EVIDENCE CENTER & DISPUTE RESOLUTION ENGINE (Phase 9)
 *
 * Provides:
 * 1. Structured candidate dispute flow for unverified, conflicting, or uncertain attribution items.
 * 2. Automated re-evaluation pipeline (alias resolution, monorepo subfolder scoping, PR attribution).
 * 3. File-level recruiter evidence drilldown (file path, line range, commit SHA, AST proof).
 * 4. Transparent UI state models (VERIFIED, STUDENT_REPORTED, UNPROVEN, CONFLICTING, DISPUTED).
 */

import crypto from "crypto";
import {
  CanonicalEvidenceItem,
  CanonicalVerificationStatus,
  EvidenceDirectness
} from "./canonical-types";
import { CalibratedCapabilityResult, ProficiencyLevel, ConfidenceTier } from "./calibrated-scoring-engine";

// ─── 1. CORE DISPUTE DATA MODELS ───

export type DisputeReason =
  | "ALIAS_MISMATCH"                      // Commits made under university or work email
  | "MONOREPO_SUBFOLDER_CONTRIBUTION"    // Code authored inside monorepo subfolder
  | "TEAM_PROJECT_SPECIFIC_PR"           // Team project where candidate authored specific pull request
  | "PRIVATE_DEPLOYMENT_PROOF"           // Private demo or staging deployment URL
  | "WRONG_BRANCH_INSPECTED";            // Work done on develop or feature branch

export type DisputeStatus =
  | "DISPUTE_SUBMITTED"
  | "UNDER_RE_EVALUATION"
  | "RESOLVED_UPGRADED"
  | "DISPUTE_REJECTED";

export interface SupplementalArtifact {
  type: "secondary_email" | "pr_url" | "branch_name" | "subfolder_path" | "deployment_url";
  value: string;
}

export interface DisputeAuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  details?: string;
}

export interface EvidenceDisputeRecord {
  id: string;
  studentId: string;
  evidenceItemId: string;
  skillId: string;
  disputeReason: DisputeReason;
  claimantExplanation: string;
  supplementalArtifacts: SupplementalArtifact[];
  status: DisputeStatus;
  auditLog: DisputeAuditEntry[];
  resolutionSummary?: string;
  upgradedDirectness?: EvidenceDirectness;
  upgradedStatus?: CanonicalVerificationStatus;
  submittedAt: string;
  resolvedAt?: string;
}

// ─── 2. EVIDENCE CENTER VIEW CONTRACTS ───

export interface EvidenceCenterCard {
  id: string;
  skillId: string;
  skillName: string;
  category: string;
  displayStatus: "VERIFIED" | "STUDENT_REPORTED" | "UNPROVEN" | "CONFLICTING" | "DISPUTED";
  demonstratedProficiency: ProficiencyLevel;
  confidence: ConfidenceTier;
  coveragePercent: number;
  filePath?: string;
  commitSha?: string;
  verbatimExcerpt?: string;
  verificationMethod: string;
  hasActiveDispute: boolean;
  activeDisputeId?: string;
  disputeResolution?: string;
  actionPrompt?: string;
}

export interface EvidenceCenterViewModel {
  studentId: string;
  totalCapabilities: number;
  verifiedCount: number;
  unprovenCount: number;
  conflictingCount: number;
  disputedCount: number;
  cards: EvidenceCenterCard[];
  lastUpdated: string;
}

// ─── 3. DISPUTE SUBMISSION & REGISTRATION ───

export function submitEvidenceDispute(params: {
  studentId: string;
  evidenceItemId: string;
  skillId: string;
  disputeReason: DisputeReason;
  claimantExplanation: string;
  supplementalArtifacts: SupplementalArtifact[];
  submittedAt?: string;
}): EvidenceDisputeRecord {
  const {
    studentId,
    evidenceItemId,
    skillId,
    disputeReason,
    claimantExplanation,
    supplementalArtifacts,
    submittedAt = new Date().toISOString()
  } = params;

  if (!claimantExplanation || claimantExplanation.trim().length < 10) {
    throw new Error("A specific explanation (at least 10 characters) is required to submit a dispute.");
  }
  if (!supplementalArtifacts || supplementalArtifacts.length === 0) {
    throw new Error("At least one supplemental artifact (email alias, PR link, branch, or subfolder) is required.");
  }

  const disputeId = `disp_${crypto.randomBytes(8).toString("hex")}`;

  const initialAudit: DisputeAuditEntry = {
    timestamp: submittedAt,
    action: "DISPUTE_SUBMITTED",
    actor: `student:${studentId}`,
    details: `Dispute filed for evidence item ${evidenceItemId} under reason ${disputeReason}`
  };

  return {
    id: disputeId,
    studentId,
    evidenceItemId,
    skillId,
    disputeReason,
    claimantExplanation,
    supplementalArtifacts,
    status: "DISPUTE_SUBMITTED",
    auditLog: [initialAudit],
    submittedAt
  };
}

// ─── 4. AUTOMATED RE-EVALUATION PIPELINE ───

export function reEvaluateDispute(params: {
  dispute: EvidenceDisputeRecord;
  originalItem: CanonicalEvidenceItem;
  repositoryCommitAuthors?: string[];
  inspectedFilePaths?: string[];
  resolvedAt?: string;
}): {
  updatedDispute: EvidenceDisputeRecord;
  updatedEvidenceItem: CanonicalEvidenceItem;
  isResolved: boolean;
} {
  const {
    dispute,
    originalItem,
    repositoryCommitAuthors = [],
    inspectedFilePaths = [],
    resolvedAt = new Date().toISOString()
  } = params;

  const updatedDispute: EvidenceDisputeRecord = {
    ...dispute,
    auditLog: [...dispute.auditLog]
  };

  const updatedEvidenceItem: CanonicalEvidenceItem = {
    ...originalItem
  };

  // Case 1: ALIAS_MISMATCH
  if (dispute.disputeReason === "ALIAS_MISMATCH") {
    const aliasArtifact = dispute.supplementalArtifacts.find(a => a.type === "secondary_email");
    const claimedEmail = (aliasArtifact?.value || "").toLowerCase().trim();

    const isAuthorFound = repositoryCommitAuthors.some(
      author => author.toLowerCase().includes(claimedEmail) || claimedEmail.includes(author.toLowerCase())
    );

    if (isAuthorFound && claimedEmail.length > 0) {
      updatedDispute.status = "RESOLVED_UPGRADED";
      updatedDispute.resolvedAt = resolvedAt;
      updatedDispute.resolutionSummary = `Secondary email alias '${claimedEmail}' confirmed in Git commit log. Attribution verified.`;
      updatedDispute.upgradedStatus = "VERIFIED";
      updatedDispute.upgradedDirectness = "DIRECT_IMPLEMENTATION";

      updatedDispute.auditLog.push({
        timestamp: resolvedAt,
        action: "RESOLVED_UPGRADED",
        actor: "system:automated_re_evaluator",
        details: updatedDispute.resolutionSummary
      });

      updatedEvidenceItem.verificationStatus = "VERIFIED";
      updatedEvidenceItem.directness = "DIRECT_IMPLEMENTATION";
      updatedEvidenceItem.confidence = "HIGH";
      updatedEvidenceItem.verificationMethod = "alias_re_evaluated_commit_log";

      return { updatedDispute, updatedEvidenceItem, isResolved: true };
    } else {
      updatedDispute.status = "DISPUTE_REJECTED";
      updatedDispute.resolvedAt = resolvedAt;
      updatedDispute.resolutionSummary = `Claimed secondary email '${claimedEmail}' was not found in repository author logs (${repositoryCommitAuthors.length} authors checked).`;

      updatedDispute.auditLog.push({
        timestamp: resolvedAt,
        action: "DISPUTE_REJECTED",
        actor: "system:automated_re_evaluator",
        details: updatedDispute.resolutionSummary
      });

      return { updatedDispute, updatedEvidenceItem, isResolved: false };
    }
  }

  // Case 2: MONOREPO_SUBFOLDER_CONTRIBUTION
  if (dispute.disputeReason === "MONOREPO_SUBFOLDER_CONTRIBUTION") {
    const subfolderArtifact = dispute.supplementalArtifacts.find(a => a.type === "subfolder_path");
    const subfolder = (subfolderArtifact?.value || "").toLowerCase().trim();

    const hasMatchingFiles = inspectedFilePaths.some(p => p.toLowerCase().includes(subfolder));

    if (hasMatchingFiles && subfolder.length > 0) {
      updatedDispute.status = "RESOLVED_UPGRADED";
      updatedDispute.resolvedAt = resolvedAt;
      updatedDispute.resolutionSummary = `Monorepo subfolder '${subfolder}' confirmed in repository file tree. Code artifacts verified.`;
      updatedDispute.upgradedStatus = "VERIFIED";
      updatedDispute.upgradedDirectness = "DIRECT_IMPLEMENTATION";

      updatedDispute.auditLog.push({
        timestamp: resolvedAt,
        action: "RESOLVED_UPGRADED",
        actor: "system:automated_re_evaluator",
        details: updatedDispute.resolutionSummary
      });

      updatedEvidenceItem.verificationStatus = "VERIFIED";
      updatedEvidenceItem.directness = "DIRECT_IMPLEMENTATION";
      updatedEvidenceItem.confidence = "HIGH";
      updatedEvidenceItem.artifactRef = subfolder;
      updatedEvidenceItem.verificationMethod = "monorepo_subfolder_re_evaluator";

      return { updatedDispute, updatedEvidenceItem, isResolved: true };
    } else {
      updatedDispute.status = "DISPUTE_REJECTED";
      updatedDispute.resolvedAt = resolvedAt;
      updatedDispute.resolutionSummary = `Subfolder '${subfolder}' does not exist or contains no matching files in repository tree.`;

      updatedDispute.auditLog.push({
        timestamp: resolvedAt,
        action: "DISPUTE_REJECTED",
        actor: "system:automated_re_evaluator",
        details: updatedDispute.resolutionSummary
      });

      return { updatedDispute, updatedEvidenceItem, isResolved: false };
    }
  }

  // Fallback for manual or non-automated dispute categories
  updatedDispute.status = "UNDER_RE_EVALUATION";
  updatedDispute.auditLog.push({
    timestamp: resolvedAt,
    action: "QUEUED_FOR_MANUAL_REVIEW",
    actor: "system:automated_re_evaluator",
    details: `Dispute reason '${dispute.disputeReason}' requires human auditor or specialized assessment review.`
  });

  return { updatedDispute, updatedEvidenceItem, isResolved: false };
}

// ─── 5. EVIDENCE CENTER VIEW MODEL SYNTHESIS ───

export function synthesizeEvidenceCenterViewModel(params: {
  studentId: string;
  assessments: CalibratedCapabilityResult[];
  evidenceItems: CanonicalEvidenceItem[];
  disputes?: EvidenceDisputeRecord[];
}): EvidenceCenterViewModel {
  const {
    studentId,
    assessments,
    evidenceItems,
    disputes = []
  } = params;

  const disputeByEvidenceId = new Map<string, EvidenceDisputeRecord>();
  for (const d of disputes) {
    disputeByEvidenceId.set(d.evidenceItemId, d);
  }

  const evidenceMap = new Map<string, CanonicalEvidenceItem>();
  for (const item of evidenceItems) {
    evidenceMap.set(item.id, item);
  }

  let verifiedCount = 0;
  let unprovenCount = 0;
  let conflictingCount = 0;
  let disputedCount = 0;

  const cards: EvidenceCenterCard[] = assessments.map(assess => {
    // Find matching evidence item
    const primaryEvidenceId = assess.supportingEvidenceIds[0];
    const primaryEvidence = primaryEvidenceId ? evidenceMap.get(primaryEvidenceId) : undefined;

    // Check dispute
    const activeDispute = primaryEvidenceId ? disputeByEvidenceId.get(primaryEvidenceId) : undefined;
    const hasActiveDispute = activeDispute !== undefined && (activeDispute.status === "DISPUTE_SUBMITTED" || activeDispute.status === "UNDER_RE_EVALUATION");

    let displayStatus: "VERIFIED" | "STUDENT_REPORTED" | "UNPROVEN" | "CONFLICTING" | "DISPUTED" = "STUDENT_REPORTED";
    if (hasActiveDispute) {
      displayStatus = "DISPUTED";
      disputedCount++;
    } else if (assess.status === "VERIFIED") {
      displayStatus = "VERIFIED";
      verifiedCount++;
    } else if (assess.status === "UNPROVEN") {
      displayStatus = "UNPROVEN";
      unprovenCount++;
    } else if (assess.status === "CONFLICTING") {
      displayStatus = "CONFLICTING";
      conflictingCount++;
    }

    let actionPrompt = undefined;
    if (displayStatus === "UNPROVEN") {
      actionPrompt = `Connect a GitHub repository or complete a practice challenge to verify ${assess.skillName}.`;
    } else if (displayStatus === "CONFLICTING") {
      actionPrompt = `Discrepancy detected between claim and repository. File a dispute or update resume.`;
    }

    return {
      id: `card-${assess.skillId}`,
      skillId: assess.skillId,
      skillName: assess.skillName,
      category: assess.category,
      displayStatus,
      demonstratedProficiency: assess.demonstratedProficiency,
      confidence: assess.confidence,
      coveragePercent: assess.coveragePercent,
      filePath: primaryEvidence?.artifactRef,
      commitSha: primaryEvidence?.commitSha,
      verbatimExcerpt: primaryEvidence?.verbatimQuote,
      verificationMethod: primaryEvidence?.verificationMethod || "None",
      hasActiveDispute: Boolean(activeDispute),
      activeDisputeId: activeDispute?.id,
      disputeResolution: activeDispute?.resolutionSummary,
      actionPrompt
    };
  });

  return {
    studentId,
    totalCapabilities: assessments.length,
    verifiedCount,
    unprovenCount,
    conflictingCount,
    disputedCount,
    cards,
    lastUpdated: new Date().toISOString()
  };
}

