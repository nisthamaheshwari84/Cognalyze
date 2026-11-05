/**
 * lib/evidence/assessment-convergence.ts
 *
 * COGNALYZE ASSESSMENT & DOWNSTREAM CONVERGENCE ENGINE (Phase 8)
 *
 * Connects the Evidence Intelligence Engine directly to:
 * 1. Interview Arena: Generates targeted, adaptive probing questions grounded in verified artifacts and unproven gaps.
 * 2. Recruiter Decision Room: Assembles an unforgeable, transparent dossier with file paths, commit SHAs, and verification tiers.
 * 3. Student DNA Snapshots: Persists cryptographically hashed, immutable snapshots of candidate capabilities.
 */

import crypto from "crypto";
import {
  CalibratedCapabilityResult,
  RoleReadinessEvaluation,
  ProficiencyLevel,
  ConfidenceTier,
  RoleSkillRequirement
} from "./calibrated-scoring-engine";
import {
  CanonicalEvidenceItem,
  CanonicalCapabilityAssessment,
  EvidenceDirectness
} from "./canonical-types";

// ─── 1. ADAPTIVE INTERVIEW TYPES ───

export type ProbeType =
  | "PROVE_UNPROVEN_SKILL"
  | "CHALLENGE_OVERCLAIM"
  | "ELEVATED_ARCHITECTURAL_EXPLORATION"
  | "CODE_ARTIFACT_DRILLDOWN";

export interface AdaptiveInterviewProbe {
  id: string;
  skillId: string;
  skillName: string;
  probeType: ProbeType;
  targetProficiency: ProficiencyLevel;
  contextArtifactRef?: string;
  question: string;
  rationale: string;
  evaluationRubric: {
    expectedKeyPoints: string[];
    passingProficiency: ProficiencyLevel;
  };
}

// ─── 2. DECISION ROOM DOSSIER TYPES ───

export interface DossierEvidenceEntry {
  sourceType: string;
  artifactRef?: string;
  commitSha?: string;
  verbatimExcerpt?: string;
  verificationMethod: string;
  directnessTier: "T0" | "T1" | "T2" | "T3" | "T4";
  confidence: ConfidenceTier;
}

export interface DossierCompetencyEntry {
  skillId: string;
  skillName: string;
  category: string;
  status: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNPROVEN" | "CONFLICTING";
  demonstratedProficiency: ProficiencyLevel;
  requiredProficiency?: ProficiencyLevel;
  confidence: ConfidenceTier;
  coveragePercent: number;
  evidenceTrail: DossierEvidenceEntry[];
  discrepancyFlag?: string;
}

export interface DecisionRoomDossier {
  candidateId: string;
  roleId: string;
  verifiedMatchScore: number;
  potentialMatchScore: number;
  overallConfidence: ConfidenceTier;
  mustHavesMet: boolean;
  unprovenCount: number;
  conflictingCount: number;
  competencyLedger: DossierCompetencyEntry[];
  criticalGaps: string[];
  actionableNextSteps: string[];
  auditSignature: string; // SHA-256 hash of entire dossier state
  generatedAt: string;
}

export interface StudentDNASnapshot {
  snapshotId: string;
  studentId: string;
  assessments: CanonicalCapabilityAssessment[];
  evidenceCount: number;
  verifiedCount: number;
  unprovenCount: number;
  conflictingCount: number;
  snapshotHash: string;
  createdAt: string;
}

// ─── 3. ADAPTIVE INTERVIEW QUESTION GENERATION ───

export function generateAdaptiveInterviewProbes(params: {
  candidateAssessments: CalibratedCapabilityResult[];
  roleRequirements?: RoleSkillRequirement[];
}): AdaptiveInterviewProbe[] {
  const { candidateAssessments, roleRequirements = [] } = params;
  const probes: AdaptiveInterviewProbe[] = [];

  const reqMap = new Map<string, RoleSkillRequirement>();
  for (const r of roleRequirements) {
    reqMap.set(r.skillId.toLowerCase(), r);
  }

  for (const assess of candidateAssessments) {
    const req = reqMap.get(assess.skillId.toLowerCase());
    const targetProficiency = req ? req.requiredProficiency : assess.demonstratedProficiency;

    // 1. Challenge Overclaim / Discrepancy
    if (assess.discrepancyDetected) {
      probes.push({
        id: `probe-disc-${assess.skillId}`,
        skillId: assess.skillId,
        skillName: assess.skillName,
        probeType: "CHALLENGE_OVERCLAIM",
        targetProficiency,
        question: `Your profile indicates advanced proficiency in ${assess.skillName}, but our automated repository inspection observed limited direct implementations and automated tests. Can you explain your experience architecting and maintaining production systems using ${assess.skillName}?`,
        rationale: assess.discrepancyDetails || `Candidate self-reported level ${assess.selfReportedProficiency} vs evidenced level ${assess.demonstratedProficiency}.`,
        evaluationRubric: {
          expectedKeyPoints: [
            `Concrete discussion of architectural trade-offs in ${assess.skillName}`,
            "Practical handling of edge cases and debugging in production",
            "Testing methodology and error boundaries"
          ],
          passingProficiency: targetProficiency
        }
      });
      continue;
    }

    // 2. Prove Unproven Skill (Essential for Candidate to substantiate ability)
    if (assess.status === "UNPROVEN") {
      probes.push({
        id: `probe-unproven-${assess.skillId}`,
        skillId: assess.skillId,
        skillName: assess.skillName,
        probeType: "PROVE_UNPROVEN_SKILL",
        targetProficiency: targetProficiency || 3,
        question: `We haven't yet observed inspectable repository code for ${assess.skillName}. Walk us through how you would configure and utilize ${assess.skillName} in a high-reliability service.`,
        rationale: "No inspectable repository code or artifacts provided yet. Unproven != Zero.",
        evaluationRubric: {
          expectedKeyPoints: [
            `Core syntax and configuration patterns for ${assess.skillName}`,
            "Basic error handling and lifecycle integration",
            "Real-world use case explanation"
          ],
          passingProficiency: targetProficiency || 3
        }
      });
      continue;
    }

    // 3. Elevated Architectural Exploration (For candidates with proven Level 4/5)
    if (assess.demonstratedProficiency >= 4 && assess.confidence === "HIGH") {
      probes.push({
        id: `probe-elevated-${assess.skillId}`,
        skillId: assess.skillId,
        skillName: assess.skillName,
        probeType: "ELEVATED_ARCHITECTURAL_EXPLORATION",
        targetProficiency: 5,
        contextArtifactRef: assess.supportingEvidenceIds[0],
        question: `You have strongly demonstrated ${assess.skillName} implementation with passing unit tests. In a system handling 20,000 requests/sec, how would you design telemetry, connection pooling, and circuit breakers for ${assess.skillName}?`,
        rationale: `Candidate has established Level ${assess.demonstratedProficiency} with HIGH confidence. Skip trivial syntax questions.`,
        evaluationRubric: {
          expectedKeyPoints: [
            "Connection pooling and backpressure handling",
            "Distributed tracing, latency percentiles (p99)",
            "Graceful degradation under resource exhaustion"
          ],
          passingProficiency: 5
        }
      });
      continue;
    }

    // 4. Code Artifact Drilldown (Level 2 or 3 intermediate)
    if (assess.demonstratedProficiency >= 2) {
      probes.push({
        id: `probe-drilldown-${assess.skillId}`,
        skillId: assess.skillId,
        skillName: assess.skillName,
        probeType: "CODE_ARTIFACT_DRILLDOWN",
        targetProficiency: (Math.min(5, assess.demonstratedProficiency + 1)) as ProficiencyLevel,
        contextArtifactRef: assess.supportingEvidenceIds[0],
        question: `In your project work with ${assess.skillName}, how do you structure your automated testing and transaction boundaries?`,
        rationale: `Probing gap between demonstrated level ${assess.demonstratedProficiency} and advanced level.`,
        evaluationRubric: {
          expectedKeyPoints: [
            "Automated test runner and mocking strategies",
            "Transaction management (ACID/isolation)",
            "Dependency injection and modular organization"
          ],
          passingProficiency: (Math.min(5, assess.demonstratedProficiency + 1)) as ProficiencyLevel
        }
      });
    }
  }

  return probes;
}

// ─── 4. RECRUITER DECISION ROOM DOSSIER SYNTHESIS ───

function directnessToTier(directness: EvidenceDirectness, isCrypto?: boolean): "T0" | "T1" | "T2" | "T3" | "T4" {
  if (isCrypto) return "T0";
  switch (directness) {
    case "DIRECT_IMPLEMENTATION":
    case "TEST_ASSERTION":
      return "T1";
    case "CONFIGURED_DEPENDENCY":
    case "ASSESSMENT_RESPONSE":
    case "THIRD_PARTY_CREDENTIAL":
      return "T2";
    case "DOCUMENTED_MENTION":
      return "T3";
    default:
      return "T4";
  }
}

export function synthesizeDecisionRoomDossier(params: {
  candidateId: string;
  roleId: string;
  evaluation: RoleReadinessEvaluation;
  evidenceItems: CanonicalEvidenceItem[];
  evaluationTimestamp?: string;
}): DecisionRoomDossier {
  const {
    candidateId,
    roleId,
    evaluation,
    evidenceItems,
    evaluationTimestamp = new Date().toISOString()
  } = params;

  const evidenceMap = new Map<string, CanonicalEvidenceItem>();
  for (const item of evidenceItems) {
    evidenceMap.set(item.id, item);
  }

  const competencyLedger: DossierCompetencyEntry[] = evaluation.skillEvaluations.map(skillEval => {
    const trails: DossierEvidenceEntry[] = skillEval.supportingEvidenceIds
      .map(id => evidenceMap.get(id))
      .filter((item): item is CanonicalEvidenceItem => Boolean(item))
      .map(item => ({
        sourceType: item.sourceType,
        artifactRef: item.artifactRef || item.sourceUrl,
        commitSha: item.commitSha,
        verbatimExcerpt: item.verbatimQuote,
        verificationMethod: item.verificationMethod,
        directnessTier: directnessToTier(item.directness, item.confidence === "HIGH" && item.commitSha !== undefined),
        confidence: item.confidence
      }));

    return {
      skillId: skillEval.skillId,
      skillName: skillEval.skillName,
      category: skillEval.category,
      status: skillEval.status,
      demonstratedProficiency: skillEval.demonstratedProficiency,
      confidence: skillEval.confidence,
      coveragePercent: skillEval.coveragePercent,
      evidenceTrail: trails,
      discrepancyFlag: skillEval.discrepancyDetected ? skillEval.discrepancyDetails : undefined
    };
  });

  // Calculate audit signature over dossier contents
  const signaturePayload = JSON.stringify({
    candidateId,
    roleId,
    verifiedMatchScore: evaluation.verifiedMatchPercentage,
    potentialMatchScore: evaluation.potentialReadiness,
    mustHavesMet: evaluation.mustHaveMet,
    competencies: competencyLedger.map(c => ({
      skillId: c.skillId,
      status: c.status,
      level: c.demonstratedProficiency,
      trailsCount: c.evidenceTrail.length
    }))
  });

  const auditSignature = crypto.createHash("sha256").update(signaturePayload).digest("hex");

  return {
    candidateId,
    roleId,
    verifiedMatchScore: evaluation.verifiedMatchPercentage,
    potentialMatchScore: evaluation.potentialReadiness,
    overallConfidence: evaluation.overallConfidence,
    mustHavesMet: evaluation.mustHaveMet,
    unprovenCount: evaluation.unprovenSkillsCount,
    conflictingCount: evaluation.conflictingSkillsCount,
    competencyLedger,
    criticalGaps: evaluation.criticalGaps,
    actionableNextSteps: evaluation.actionableEvidenceRecommendations,
    auditSignature,
    generatedAt: evaluationTimestamp
  };
}

// ─── 5. STUDENT DNA SNAPSHOT GENERATION ───

export function generateStudentDNASnapshot(params: {
  studentId: string;
  assessments: CalibratedCapabilityResult[];
  evidenceItems: CanonicalEvidenceItem[];
  createdAt?: string;
}): StudentDNASnapshot {
  const {
    studentId,
    assessments,
    evidenceItems,
    createdAt = new Date().toISOString()
  } = params;

  let verifiedCount = 0;
  let unprovenCount = 0;
  let conflictingCount = 0;

  const canonicalAssessments: CanonicalCapabilityAssessment[] = assessments.map(a => {
    if (a.status === "VERIFIED") verifiedCount++;
    else if (a.status === "UNPROVEN") unprovenCount++;
    else if (a.status === "CONFLICTING") conflictingCount++;

    return {
      skillId: a.skillId,
      skillName: a.skillName,
      category: a.category,
      demonstratedProficiency: a.demonstratedProficiency,
      selfReportedProficiency: a.selfReportedProficiency,
      confidence: a.confidence,
      coveragePercent: a.coveragePercent,
      freshnessState: a.freshnessState,
      supportingEvidenceIds: a.supportingEvidenceIds,
      gapsIdentified: a.gapsIdentified,
      lastEvaluated: a.evaluatedAt
    };
  });

  const snapshotPayload = JSON.stringify({
    studentId,
    assessments: canonicalAssessments,
    evidenceIds: evidenceItems.map(e => e.id).sort(),
    createdAt
  });

  const snapshotHash = crypto.createHash("sha256").update(snapshotPayload).digest("hex");
  const snapshotId = `dna_snap_${snapshotHash.slice(0, 16)}`;

  return {
    snapshotId,
    studentId,
    assessments: canonicalAssessments,
    evidenceCount: evidenceItems.length,
    verifiedCount,
    unprovenCount,
    conflictingCount,
    snapshotHash,
    createdAt
  };
}
