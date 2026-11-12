/**
 * lib/recruitment/dna-recruitment-bridge.ts
 * 
 * Integration bridge between Cognalyze Recruitment Arena and Student DNA.
 * Implements strict Anti-Simulation rules: only genuine passing stage attempts
 * write immutable verified evidence to the student's DNA dossier.
 * Maps weakness areas directly to actionable remediation lessons in Skill Practice Hub.
 */

import { addStudentEvidenceRecord } from "../dna/store";
import { RawSourceData } from "../dna/evidence-pipeline";
import { StudentRecruitmentJourney, StageProgressItem } from "./types";
import { getCompanyById } from "./company-registry";
import { getAnyBlueprintById } from "./dynamic-blueprint-engine";
import { getRemediationTopicsForWeaknesses, RemediationRecommendation } from "./remediation-map";

export interface DNASyncResult {
  success: boolean;
  evidenceId?: string;
  dnaUpdated: boolean;
  remediationRecommendations?: RemediationRecommendation[];
  message: string;
}

export { getRemediationTopicsForWeaknesses };
export type { RemediationRecommendation };

/**
 * Syncs a passed stage attempt to the Student DNA Evidence dossier.
 * Strictly enforces Anti-Simulation: Fails or attempts with score < 70 are rejected.
 */
export async function syncRecruitmentStageAttemptToDNA(
  journey: StudentRecruitmentJourney,
  stageProgress: StageProgressItem
): Promise<DNASyncResult> {
  const company = getCompanyById(journey.companyId);
  const companyName = company ? company.name : journey.companyId.toUpperCase();

  // 1. Anti-Simulation Quality Gate
  if (stageProgress.status !== "PASSED" || stageProgress.percentageScore < 70) {
    const blueprint = getAnyBlueprintById(journey.blueprintId);
    const stageDef = blueprint?.stages.find((s) => s.id === stageProgress.stageId);
    const stageComps = stageDef?.targetCompetencies || [];

    const weakScores = Object.entries(journey.competencyScores)
      .filter(([_, score]) => score < 70)
      .map(([comp]) => comp);

    const allWeak = Array.from(new Set([...weakScores, ...stageComps]));
    const recommendations = getRemediationTopicsForWeaknesses(allWeak);

    return {
      success: false,
      dnaUpdated: false,
      remediationRecommendations: recommendations,
      message: `Stage '${stageProgress.title}' not passed. Attempt preserved in journey history but blocked from polluting Student DNA dossier.`,
    };
  }

  // 2. Map stage type to canonical skill category
  let canonicalSkill = "computer_science_fundamentals";
  if (stageProgress.stageType.includes("coding") || stageProgress.stageType.includes("dsa")) {
    canonicalSkill = "data_structures_algorithms";
  } else if (stageProgress.stageType.includes("sql")) {
    canonicalSkill = "sql_database_engineering";
  } else if (stageProgress.stageType.includes("design") || stageProgress.stageType.includes("lld")) {
    canonicalSkill = "system_architecture_design";
  } else if (stageProgress.stageType.includes("ai_ml")) {
    canonicalSkill = "machine_learning_engineering";
  } else if (stageProgress.stageType.includes("behavioral") || stageProgress.stageType.includes("managerial")) {
    canonicalSkill = "professional_leadership_communication";
  }

  // 3. Assemble immutable evidence payload
  const rawEvidence: RawSourceData = {
    sourceType: stageProgress.stageType.includes("interview") ? "interview" : "assessment",
    sourceId: `${journey.id}_${stageProgress.stageId}_attempt${stageProgress.attemptCount}`,
    userId: journey.studentId,
    skillRaw: canonicalSkill,
    evidenceType: `recruitment_stage_${stageProgress.stageType}`,
    claim: `Demonstrated verified ${stageProgress.percentageScore}% proficiency on ${companyName} recruitment stage: '${stageProgress.title}'.`,
    strength: Math.min(1.0, Math.max(0.7, stageProgress.percentageScore / 100)),
    timestamp: stageProgress.completedAt || new Date().toISOString(),
    trustedServerVerified: true,
    metadata: {
      journeyId: journey.id,
      companyId: journey.companyId,
      companyName,
      roleFamily: journey.roleFamily,
      hiringChannel: journey.hiringChannel,
      blueprintVersion: journey.blueprintVersion,
      stageId: stageProgress.stageId,
      stageTitle: stageProgress.title,
      score: stageProgress.percentageScore,
      rawScore: stageProgress.rawScore,
      maxScore: stageProgress.maxScore,
      percentageScore: stageProgress.percentageScore,
      durationSeconds: stageProgress.durationSeconds,
      rubricEvaluations: stageProgress.rubricEvaluations,
    },
  };

  try {
    const recordResult = await addStudentEvidenceRecord(journey.studentId, rawEvidence);
    if (recordResult.success && recordResult.evidence) {
      return {
        success: true,
        evidenceId: recordResult.evidence.id,
        dnaUpdated: true,
        message: `Verified evidence recorded in Student DNA for ${companyName} ${stageProgress.title}.`,
      };
    } else {
      return {
        success: true,
        dnaUpdated: false,
        message: `Attempt recorded locally; DNA update skipped (${recordResult.error || "validation"}).`,
      };
    }
  } catch (err: any) {
    return {
      success: true,
      dnaUpdated: false,
      message: `Stage attempt passed and saved. DNA bridge logged: ${err.message}`,
    };
  }
}
