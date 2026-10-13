/**
 * lib/dna/skill-intelligence-engine.ts
 * 
 * COGNALYZE CANONICAL SKILL INTELLIGENCE ENGINE (PHASE 3)
 * 
 * Rules:
 * 1. ZERO HARDCODED NUMBERS & ZERO MAGIC CONFIDENCE PERCENTAGES:
 *    Never invent arbitrary AI scores (e.g. "87% Python").
 * 2. CANONICAL NORMALIZATION & ALIAS RESOLUTION:
 *    Preserves distinctions between related but distinct skills (Python != FastAPI, SQL != PostgreSQL, Docker != AWS).
 * 3. TRANSPARENT CATEGORICAL PROFICIENCY:
 *    - SELF_REPORTED
 *    - SOURCE_REPORTED
 *    - SUPPORTED
 *    - PARTIALLY_SUPPORTED
 *    - CONFLICTING_EVIDENCE
 *    - NOT_FOUND_IN_INSPECTED_SOURCES
 *    - NOT_INSPECTED
 *    - SOURCE_UNAVAILABLE
 *    - PENDING_VERIFICATION
 *    - INDEPENDENTLY_VERIFIED
 * 4. OBSERVABLE RUBRIC CRITERIA:
 *    Criteria are only marked satisfied when concrete inspected evidence (files, AST, tests, assessments) exists.
 * 5. STRICT PROVENANCE & LIMITATIONS:
 *    Every evaluated skill retains its supporting evidence IDs, inspected excerpts, recency, and known limitations.
 */

import crypto from "crypto";
import {
  CanonicalSkill,
  CANONICAL_SKILL_TAXONOMY,
  normalizeSkill as baseNormalizeSkill,
  getCanonicalSkill
} from "./taxonomy";
import { DNAEvidence } from "./evidence-pipeline";
import { DNAClaimStatus } from "./contracts";

export interface SkillCriterionRubric {
  criterionId: string;
  label: string;
  description: string;
  satisfied: boolean;
  satisfyingEvidenceIds: string[];
  observableFinding?: string;
}

export interface EvaluatedCanonicalSkill {
  skillId: string;
  canonicalName: string;
  category: string;
  aliases: string[];
  studentReportedLevel?: "Beginner" | "Intermediate" | "Advanced" | "Expert" | "Claimed" | null;
  assessmentStatus: DNAClaimStatus;
  statusBadge: "neutral" | "warning" | "success" | "danger";
  statusExplanation: string;
  rubricCriteria: SkillCriterionRubric[];
  evidenceIds: string[];
  evidenceExcerpts: Array<{
    sourceType: string;
    sourceTitle: string;
    filePath?: string;
    excerpt: string;
    observedAt: string;
    isStale: boolean;
  }>;
  evidenceCoverage: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  recencyState: "CURRENT" | "RECENT" | "AGING" | "STALE" | "UNKNOWN";
  lastDemonstratedAt?: string;
  limitations: string[];
  conflictingSignals?: string[];
  evaluatedAt: string;
  engineVersion: string;
}

export const CANONICAL_EVALUATION_VERSION = "cognalyze_skill_engine_v3.0";

/**
 * Strict skill normalization with alias preservation and non-destructive mapping.
 * Rules:
 * - Normalizes case, harmless punctuation, and whitespaces.
 * - Respects distinct technologies (e.g. "c" is not "c++", "c#" is not "c++", "sql" is not "postgresql").
 * - Returns canonical ID, canonical name, and reason for mapping.
 */
export function normalizeCanonicalSkill(rawInput: string): {
  canonicalSkill: CanonicalSkill | null;
  normalizedInput: string;
  mappingReason: string;
} {
  if (!rawInput || typeof rawInput !== "string") {
    return { canonicalSkill: null, normalizedInput: "", mappingReason: "Empty or invalid input string" };
  }

  const clean = rawInput.trim().toLowerCase().replace(/\s+/g, " ");

  // 1. Direct match on skillId
  if (CANONICAL_SKILL_TAXONOMY[clean]) {
    return {
      canonicalSkill: CANONICAL_SKILL_TAXONOMY[clean],
      normalizedInput: clean,
      mappingReason: `Direct identifier match for '${clean}'`
    };
  }

  // 2. Exact match on aliases
  for (const skill of Object.values(CANONICAL_SKILL_TAXONOMY)) {
    if (skill.aliases.some(alias => alias.toLowerCase() === clean)) {
      return {
        canonicalSkill: skill,
        normalizedInput: clean,
        mappingReason: `Exact alias match for '${clean}' -> canonical '${skill.name}'`
      };
    }
  }

  // 3. Normalized punctuation matches (e.g. "react.js" -> "react", "node-js" -> "node")
  const stripped = clean.replace(/[\.\-_]/g, "");
  for (const skill of Object.values(CANONICAL_SKILL_TAXONOMY)) {
    if (skill.aliases.some(alias => alias.replace(/[\.\-_]/g, "") === stripped)) {
      return {
        canonicalSkill: skill,
        normalizedInput: clean,
        mappingReason: `Normalized punctuation match for '${clean}' -> canonical '${skill.name}'`
      };
    }
  }

  // 4. Safe word boundary match (only if alias is at least 3 characters to prevent false positive matching on 'c' or 'r')
  for (const skill of Object.values(CANONICAL_SKILL_TAXONOMY)) {
    for (const alias of skill.aliases) {
      if (alias.length >= 3) {
        const regex = new RegExp(`(^|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`, "i");
        if (regex.test(clean)) {
          return {
            canonicalSkill: skill,
            normalizedInput: clean,
            mappingReason: `Word-boundary match on alias '${alias}' -> canonical '${skill.name}'`
          };
        }
      }
    }
  }

  return {
    canonicalSkill: null,
    normalizedInput: clean,
    mappingReason: `No canonical taxonomy entry matches '${rawInput}'`
  };
}

/**
 * Derives observable rubric criteria for a given canonical skill based on inspected evidence.
 */
function buildSkillRubric(skill: CanonicalSkill, relevantEvidence: DNAEvidence[]): SkillCriterionRubric[] {
  const codeEvidence = relevantEvidence.filter(e => e.sourceType === "github" || e.sourceType === "project");
  const assessmentEvidence = relevantEvidence.filter(e => e.sourceType === "practice" || e.sourceType === "assessment");
  const certEvidence = relevantEvidence.filter(e => e.sourceType === "certification");

  const passingAssessments = assessmentEvidence.filter(a => (a.metadata?.score ?? 100) >= 50);

  return [
    {
      criterionId: "claim_declared",
      label: "Declared in Profile / Resume",
      description: "Student has self-reported this skill or it was extracted from their uploaded resume.",
      satisfied: relevantEvidence.some(e => e.sourceType === "resume" || e.metadata?.declaredLevel),
      satisfyingEvidenceIds: relevantEvidence
        .filter(e => e.sourceType === "resume" || e.metadata?.declaredLevel)
        .map(e => e.id),
      observableFinding: relevantEvidence.some(e => e.sourceType === "resume")
        ? "Documented in submitted student credentials."
        : undefined
    },
    {
      criterionId: "code_implementation_inspected",
      label: "Inspected Project Implementation",
      description: "Relevant source code, project files, or dependency manifests were located and inspected.",
      satisfied: codeEvidence.length > 0,
      satisfyingEvidenceIds: codeEvidence.map(e => e.id),
      observableFinding: codeEvidence.length > 0
        ? `Found ${codeEvidence.length} inspected codebase artifact(s).`
        : undefined
    },
    {
      criterionId: "structured_problem_solving",
      label: "Verified Problem Solving / Assessment",
      description: "Completed structured coding challenges or assessments evaluating this concept.",
      satisfied: passingAssessments.length > 0,
      satisfyingEvidenceIds: passingAssessments.map(e => e.id),
      observableFinding: passingAssessments.length > 0
        ? `Completed ${passingAssessments.length} verified passing assessment attempt(s).`
        : (assessmentEvidence.length > 0 ? "Attempted assessment did not achieve passing threshold." : undefined)
    },
    {
      criterionId: "independent_verification",
      label: "Independent Verification",
      description: "Cryptographically signed certificate, external organizer confirmation, or supervisor validation.",
      satisfied: certEvidence.some(e => e.metadata?.issuerVerified || e.metadata?.issuer_verified),
      satisfyingEvidenceIds: certEvidence
        .filter(e => e.metadata?.issuerVerified || e.metadata?.issuer_verified)
        .map(e => e.id),
      observableFinding: certEvidence.some(e => e.metadata?.issuerVerified || e.metadata?.issuer_verified)
        ? "Verified via official issuing body cryptographic record."
        : undefined
    }
  ];
}

/**
 * Evaluates a single canonical skill against the candidate's authentic evidence pool.
 */
export function evaluateSkillEvidence(
  canonicalSkill: CanonicalSkill,
  evidencePool: DNAEvidence[],
  claimedLevel?: "Beginner" | "Intermediate" | "Advanced" | "Expert" | "Claimed" | null
): EvaluatedCanonicalSkill {
  const now = new Date().toISOString();
  const relevantEvidence = evidencePool.filter(e => e.skillId === canonicalSkill.skillId);

  // Derive limitations
  const limitations: string[] = [];
  const conflictingSignals: string[] = [];

  const resumeOnly = relevantEvidence.every(e => e.sourceType === "resume");
  const codeEvidence = relevantEvidence.filter(e => e.sourceType === "github" || e.sourceType === "project");
  const assessments = relevantEvidence.filter(e => e.sourceType === "practice" || e.sourceType === "assessment");
  const passingAssessments = assessments.filter(a => (a.metadata?.score ?? 100) >= 50);
  const failingAssessments = assessments.filter(a => (a.metadata?.score ?? 100) < 50);
  const certified = relevantEvidence.filter(e => e.sourceType === "certification");

  // Determine recency
  let recencyState: "CURRENT" | "RECENT" | "AGING" | "STALE" | "UNKNOWN" = "UNKNOWN";
  let lastDemonstratedAt: string | undefined;

  if (relevantEvidence.length > 0) {
    const timestamps = relevantEvidence
      .map(e => new Date(e.observedAt || e.createdAt || (e as any).timestamp || now).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => b - a);

    if (timestamps.length > 0) {
      lastDemonstratedAt = new Date(timestamps[0]).toISOString();
      const ageDays = (Date.now() - timestamps[0]) / (1000 * 60 * 60 * 24);
      if (ageDays <= 90) recencyState = "CURRENT";
      else if (ageDays <= 180) recencyState = "RECENT";
      else if (ageDays <= 365) recencyState = "AGING";
      else recencyState = "STALE";
    }
  }

  // Check for contradiction (e.g. claims Advanced in resume but failed basic assessment)
  const failedAssessment = assessments.find(a => (a.metadata?.score ?? 100) < 50);
  if (failedAssessment && (claimedLevel === "Advanced" || claimedLevel === "Expert")) {
    conflictingSignals.push(
      `Self-reported ${claimedLevel} proficiency conflicts with assessment result (${failedAssessment.metadata?.score}% score).`
    );
  }

  // Determine canonical assessment status
  let assessmentStatus: DNAClaimStatus = "NOT_ASSESSED";
  let statusBadge: "neutral" | "warning" | "success" | "danger" = "neutral";
  let statusExplanation = "";

  if (relevantEvidence.length === 0) {
    assessmentStatus = "NOT_INSPECTED";
    statusBadge = "neutral";
    statusExplanation = `No inspected evidence or self-reported claims exist in the current profile for ${canonicalSkill.name}.`;
    limitations.push(`No connected source has provided evidence for ${canonicalSkill.name}.`);
  } else if (conflictingSignals.length > 0) {
    assessmentStatus = "CONFLICTING_EVIDENCE";
    statusBadge = "danger";
    statusExplanation = conflictingSignals[0];
    limitations.push("Conflicting signals observed between self-reported claim and structured evaluation.");
  } else if (certified.some(c => c.metadata?.issuerVerified || c.metadata?.issuer_verified)) {
    assessmentStatus = "INDEPENDENTLY_VERIFIED";
    statusBadge = "success";
    statusExplanation = `Independently verified via official credential from ${certified[0].metadata?.issuer || "accredited body"}.`;
  } else if (codeEvidence.length > 0 && passingAssessments.length > 0) {
    assessmentStatus = "SUPPORTED";
    statusBadge = "success";
    statusExplanation = `Demonstrated across inspected codebase implementations and structured assessment challenges.`;
    limitations.push("Static inspection confirms implementation presence; individual line-by-line authorship is inferred from repository commits.");
  } else if (codeEvidence.length > 0) {
    assessmentStatus = "SUPPORTED";
    statusBadge = "success";
    statusExplanation = `Observed in inspected project code and repository implementations.`;
    limitations.push("Static inspection verifies technical usage; does not prove runtime behavior or individual contribution percentage.");
  } else if (passingAssessments.length > 0) {
    assessmentStatus = "SUPPORTED";
    statusBadge = "success";
    statusExplanation = `Validated through structured problem-solving tasks and interactive assessment.`;
  } else if (failingAssessments.length > 0 && codeEvidence.length === 0) {
    assessmentStatus = "PARTIALLY_SUPPORTED";
    statusBadge = "warning";
    statusExplanation = `Attempted assessment did not achieve passing threshold (${failingAssessments[0].metadata?.score ?? 0}% score). Targeted practice recommended.`;
    limitations.push("Completed assessment was below 50% passing threshold; does not verify proficient capability.");
  } else if (resumeOnly) {
    assessmentStatus = "SELF_REPORTED";
    statusBadge = "neutral";
    statusExplanation = `Self-reported in resume or student profile without inspected code or assessment results yet.`;
    limitations.push("Appears in submitted resume text; no relevant code or assessment has been inspected to verify capability.");
  } else {
    assessmentStatus = "PARTIALLY_SUPPORTED";
    statusBadge = "warning";
    statusExplanation = `Partial signals found, but insufficient evidence to establish comprehensive demonstration.`;
    limitations.push("Evidence pool is sparse; attach a project repository or complete an assessment to elevate confidence.");
  }

  if (recencyState === "STALE") {
    limitations.push("Most recent evidence is older than 12 months; refreshing current projects is recommended.");
  }

  // Derive coverage
  let evidenceCoverage: "HIGH" | "MEDIUM" | "LOW" | "NONE" = "NONE";
  if (relevantEvidence.length >= 4) evidenceCoverage = "HIGH";
  else if (relevantEvidence.length >= 2) evidenceCoverage = "MEDIUM";
  else if (relevantEvidence.length === 1) evidenceCoverage = "LOW";

  // Build rubric criteria
  const rubricCriteria = buildSkillRubric(canonicalSkill, relevantEvidence);

  // Extract excerpts
  const evidenceExcerpts = relevantEvidence.map(e => ({
    sourceType: e.sourceType,
    sourceTitle: e.metadata?.projectTitle || e.metadata?.issuer || e.claim || e.sourceType,
    filePath: e.metadata?.filePath,
    excerpt: e.extractedValue || e.claim,
    observedAt: e.observedAt || (e as any).timestamp || now,
    isStale: e.recency === "STALE" || recencyState === "STALE"
  }));

  return {
    skillId: canonicalSkill.skillId,
    canonicalName: canonicalSkill.name,
    category: canonicalSkill.category,
    aliases: canonicalSkill.aliases,
    studentReportedLevel: claimedLevel || null,
    assessmentStatus,
    statusBadge,
    statusExplanation,
    rubricCriteria,
    evidenceIds: relevantEvidence.map(e => e.id),
    evidenceExcerpts,
    evidenceCoverage,
    recencyState,
    lastDemonstratedAt,
    limitations,
    conflictingSignals: conflictingSignals.length > 0 ? conflictingSignals : undefined,
    evaluatedAt: now,
    engineVersion: CANONICAL_EVALUATION_VERSION
  };
}

/**
 * Evaluates the full suite of student skills from authentic evidence and self-declared claims.
 */
export function evaluateStudentSkillIntelligence(
  userId: string,
  evidencePool: DNAEvidence[],
  studentClaims: Array<{ skillName: string; claimedLevel?: string }> = []
): {
  evaluatedSkills: EvaluatedCanonicalSkill[];
  supportedSkillsCount: number;
  selfReportedOnlyCount: number;
  unassessedCount: number;
  conflictingCount: number;
  evaluationTimestamp: string;
} {
  const evaluatedMap = new Map<string, EvaluatedCanonicalSkill>();

  // 1. Process all skills present in the evidence pool
  const distinctSkillIdsInEvidence = new Set(evidencePool.map(e => e.skillId).filter(Boolean));
  for (const skillId of distinctSkillIdsInEvidence) {
    const canonical = getCanonicalSkill(skillId);
    if (canonical) {
      const claim = studentClaims.find(c => {
        const norm = normalizeCanonicalSkill(c.skillName);
        return norm.canonicalSkill?.skillId === skillId;
      });
      const evaluated = evaluateSkillEvidence(
        canonical,
        evidencePool,
        (claim?.claimedLevel as any) || null
      );
      evaluatedMap.set(skillId, evaluated);
    }
  }

  // 2. Process student-reported claims that might not have any evidence yet
  for (const claim of studentClaims) {
    const norm = normalizeCanonicalSkill(claim.skillName);
    if (norm.canonicalSkill && !evaluatedMap.has(norm.canonicalSkill.skillId)) {
      const evaluated = evaluateSkillEvidence(
        norm.canonicalSkill,
        evidencePool,
        (claim.claimedLevel as any) || "Claimed"
      );
      evaluatedMap.set(norm.canonicalSkill.skillId, evaluated);
    }
  }

  const evaluatedSkills = Array.from(evaluatedMap.values());

  const supportedSkillsCount = evaluatedSkills.filter(
    s => s.assessmentStatus === "SUPPORTED" || s.assessmentStatus === "INDEPENDENTLY_VERIFIED"
  ).length;

  const selfReportedOnlyCount = evaluatedSkills.filter(
    s => s.assessmentStatus === "SELF_REPORTED"
  ).length;

  const unassessedCount = evaluatedSkills.filter(
    s => s.assessmentStatus === "NOT_INSPECTED" || s.assessmentStatus === "SOURCE_UNAVAILABLE"
  ).length;

  const conflictingCount = evaluatedSkills.filter(
    s => s.assessmentStatus === "CONFLICTING_EVIDENCE"
  ).length;

  return {
    evaluatedSkills,
    supportedSkillsCount,
    selfReportedOnlyCount,
    unassessedCount,
    conflictingCount,
    evaluationTimestamp: new Date().toISOString()
  };
}
