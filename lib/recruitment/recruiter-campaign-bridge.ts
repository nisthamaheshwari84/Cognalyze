/**
 * lib/recruitment/recruiter-campaign-bridge.ts
 * 
 * Bridges Recruitment Arena Blueprints & Journeys to the Enterprise Recruiter Decision Room.
 * Enables recruiters to launch hiring campaigns based on verified company blueprints,
 * inspect candidate stage telemetry, and issue auditable hiring verdicts.
 */

import { StudentRecruitmentJourney } from "./types";
import { getAnyBlueprintById } from "./dynamic-blueprint-engine";
import { getCompanyById } from "./company-registry";
import { getJourneysByStudent } from "./journey-store";
import { JDIntelligenceProfile, CompetencyRequirement } from "../recruiter/decision-room-engine";
import { TRACK_WEIGHT_MATRIX, InterviewTrackId } from "../interview/final-report-generator";
import { PROVENANCE_HIERARCHY } from "../interview/dna-sync-engine";

export interface RecruiterCampaignSummary {
  campaignId: string;
  companyId: string;
  companyName: string;
  roleFamily: string;
  blueprintTitle: string;
  blueprintVersion: string;
  totalApplicants: number;
  inProgressCount: number;
  passedCount: number;
  didNotPassCount: number;
  averageScore: number;
}

export interface CandidatePipelineCard {
  journeyId: string;
  studentId: string;
  companyId: string;
  companyName: string;
  roleFamily: string;
  currentStageTitle: string;
  status: string;
  overallScore: number;
  completedStagesCount: number;
  totalStagesCount: number;
  topCompetencies: Array<{ name: string; score: number }>;
  updatedAt: string;
}

/**
 * Transforms a verified blueprint into a calibrated Recruiter JD Intelligence Profile.
 */
export function blueprintToJDProfile(
  blueprintId: string,
  organizationId: string = "org_cognalyze_enterprise"
): JDIntelligenceProfile {
  const bp = getAnyBlueprintById(blueprintId);
  if (!bp) {
    throw new Error(`Blueprint ${blueprintId} not found.`);
  }

  const company = getCompanyById(bp.companyId);
  const companyName = company ? company.name : bp.companyId.toUpperCase();

  const mustHaveCompetencies: CompetencyRequirement[] = Object.entries(bp.competencyRubric).map(
    ([key, item], idx) => ({
      id: `req_${bp.id}_${idx}`,
      name: key.replace(/_/g, " ").toUpperCase(),
      dimensionId: key.includes("algo") || key.includes("code") ? "DIM_3_PRACTICAL_IMPL" : "DIM_2_PROBLEM_SOLVING",
      importance: "MUST_HAVE",
      minimumProvenance: PROVENANCE_HIERARCHY.LEVEL_1_SANDBOX,
      evidenceExpectation: item.description,
      weight: item.weight,
    })
  );

  const trackId: InterviewTrackId = bp.roleFamily === "sde" ? "general_swe" : bp.roleFamily === "ai_ml" ? "ml_data" : "general_swe";

  return {
    roleId: `role_${bp.id}`,
    title: `${companyName} — ${bp.title}`,
    organizationId,
    trackId,
    experienceLevel: bp.hiringChannel === "experienced" ? "mid_level" : "entry_level",
    rawJdText: bp.overview,
    mustHaveCompetencies,
    goodToHaveCompetencies: [],
    unsupportedOrAmbiguous: [],
    dimensionWeights: TRACK_WEIGHT_MATRIX[trackId],
    createdAt: bp.createdAt,
  };
}

/**
 * Transforms student journeys into recruiter pipeline overview cards.
 */
export function journeyToCandidateCard(journey: StudentRecruitmentJourney): CandidatePipelineCard {
  const company = getCompanyById(journey.companyId);
  const companyName = company ? company.name : journey.companyId.toUpperCase();
  const blueprint = getAnyBlueprintById(journey.blueprintId);

  const totalStagesCount = blueprint ? blueprint.stages.length : Object.keys(journey.stageProgress).length;
  const completedStagesCount = Object.values(journey.stageProgress).filter(
    (s) => s.status === "PASSED" || s.status === "FAILED"
  ).length;

  const currentStageDef = blueprint?.stages.find((s) => s.id === journey.currentStageId);
  const currentStageTitle = currentStageDef ? currentStageDef.title : "Journey Completed";

  const topCompetencies = Object.entries(journey.competencyScores)
    .map(([name, score]) => ({ name: name.replace(/_/g, " "), score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    journeyId: journey.id,
    studentId: journey.studentId,
    companyId: journey.companyId,
    companyName,
    roleFamily: journey.roleFamily,
    currentStageTitle,
    status: journey.status,
    overallScore: journey.overallScore,
    completedStagesCount,
    totalStagesCount,
    topCompetencies,
    updatedAt: journey.updatedAt,
  };
}
