/**
 * Internal Mobility & Capability Matching Engine
 * Truth Contract T7, Phase 8
 * 
 * Reuses the exact same pure assessment function derive() on consented employee evidence.
 * Generates truthful, evidence-backed internal mobility matching with cited evidence IDs,
 * zero arbitrary scores, zero pedigree bias, and honest uncertainty for missing evidence.
 */

import { derive, EvidenceItemInput, DerivationResult } from "@/lib/evidence/derive";
import { getCandidateById } from "@/lib/recruiter-store";
import { listActiveConsentGrants } from "@/lib/privacy/consent";
import { planNextBestEvidence, ValidationPlan } from "@/lib/validation/planner";

export interface InternalRoleRequirement {
  id: string;
  roleId: string;
  text: string;
  category: "core" | "trainable" | "evaluated" | "context";
}

export interface InternalRoleListing {
  id: string;
  orgId: string;
  title: string;
  department: string;
  requirements: InternalRoleRequirement[];
}

export interface RequirementMobilityAssessment {
  requirementId: string;
  requirementText: string;
  category: "core" | "trainable" | "evaluated" | "context";
  state: "ESTABLISHED" | "PARTIAL" | "UNKNOWN" | "CONFLICTING" | "NOT_APPLICABLE" | "NOT_ESTABLISHED_AFTER_VALIDATION";
  derivation: DerivationResult;
  citedEvidenceIds: string[];
  citedSources: string[];
  growthRecommendation?: string;
}

export interface InternalMobilityMatchReport {
  employeePersonId: string;
  employeeName: string;
  targetRoleId: string;
  targetRoleTitle: string;
  orgId: string;
  consentVerified: boolean;
  summary: {
    totalRequirements: number;
    establishedCount: number;
    partialCount: number;
    unknownCount: number;
    conflictingCount: number;
  };
  assessments: RequirementMobilityAssessment[];
  recommendedValidationPlan?: ValidationPlan;
  timestamp: string;
}

/**
 * Evaluates an employee against an internal open role using pure derive().
 */
export async function evaluateInternalMobility(params: {
  employeePersonId: string;
  role: InternalRoleListing;
  mockEvidenceForTest?: Record<string, EvidenceItemInput[]>;
}): Promise<InternalMobilityMatchReport> {
  const { employeePersonId, role, mockEvidenceForTest } = params;

  // 1. Verify Employee Consent
  const activeGrants = await listActiveConsentGrants(employeePersonId);
  const consentVerified = activeGrants.some(
    (g) => g.granteeOrgId === role.orgId || g.scopes.includes("full_dossier") || g.scopes.includes("verified_claims")
  );

  // 2. Fetch employee profile
  const employee = await getCandidateById(employeePersonId);
  const employeeName = employee?.name || "Internal Employee";

  // 3. For each role requirement, gather relevant evidence items and call pure derive()
  const assessments: RequirementMobilityAssessment[] = [];
  let establishedCount = 0;
  let partialCount = 0;
  let unknownCount = 0;
  let conflictingCount = 0;

  for (const req of role.requirements) {
    let items: EvidenceItemInput[] = [];

    if (mockEvidenceForTest && mockEvidenceForTest[req.id]) {
      items = mockEvidenceForTest[req.id];
    } else if (employee) {
      // Extract from employee projects and github
      const reqLower = req.text.toLowerCase();
      const projectTech = (employee.studentProjects || []).flatMap((p) => p.tech || []);
      const githubLangs = (employee.githubData?.repos || []).flatMap((r) => r.languages || []);
      const matchingTech = [...projectTech, ...githubLangs].find((t) =>
        reqLower.includes(t.toLowerCase()) || t.toLowerCase().includes(reqLower)
      );

      if (matchingTech) {
        const isGithubVerified = Boolean(employee.githubData && githubLangs.includes(matchingTech));
        items.push({
          id: `evi_${req.id}_${employeePersonId}`,
          sourceId: isGithubVerified ? "github_connector" : "project_span",
          tier: isGithubVerified ? "T2" : "T1",
          coverage: "direct",
          relation: "supports",
          observedAt: new Date().toISOString(),
        });
      }
    }

    // Call pure derive() function
    const derivation = derive(req.id, items);

    if (derivation.state === "ESTABLISHED") establishedCount++;
    else if (derivation.state === "PARTIAL") partialCount++;
    else if (derivation.state === "UNKNOWN") unknownCount++;
    else if (derivation.state === "CONFLICTING") conflictingCount++;

    let growthRecommendation: string | undefined;
    if (derivation.state === "UNKNOWN") {
      growthRecommendation = `No verified evidence currently exists for "${req.text}". Recommended: 45-minute structured work sample or internal shadow sprint.`;
    } else if (derivation.state === "PARTIAL") {
      growthRecommendation = `Partial or adjacent evidence found. Recommended: targeted ownership task to demonstrate production depth.`;
    }

    assessments.push({
      requirementId: req.id,
      requirementText: req.text,
      category: req.category,
      state: derivation.state,
      derivation,
      citedEvidenceIds: derivation.inputEvidenceIds,
      citedSources: items.map((i) => i.sourceId),
      growthRecommendation,
    });
  }

  // 4. Generate validation plan for unresolved core requirements
  const unresolvedCore = assessments.filter(
    (a) => a.category === "core" && (a.state === "UNKNOWN" || a.state === "PARTIAL")
  );

  let recommendedValidationPlan: ValidationPlan | undefined;
  if (unresolvedCore.length > 0) {
    recommendedValidationPlan = planNextBestEvidence({
      roleId: role.id,
      candidateId: employeePersonId,
      openAssessments: unresolvedCore.map((a) => ({
        requirementId: a.requirementId,
        requirementName: a.requirementText,
        category: a.category,
        state: a.state as "UNKNOWN" | "PARTIAL",
        assessmentId: `asm_${a.requirementId}`,
      })),
    });
  }

  return {
    employeePersonId,
    employeeName,
    targetRoleId: role.id,
    targetRoleTitle: role.title,
    orgId: role.orgId,
    consentVerified,
    summary: {
      totalRequirements: role.requirements.length,
      establishedCount,
      partialCount,
      unknownCount,
      conflictingCount,
    },
    assessments,
    recommendedValidationPlan,
    timestamp: new Date().toISOString(),
  };
}
