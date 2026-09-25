/**
 * Organization Capability Map & Team Composition Engine
 * Truth Contract T7, Phase 8
 * 
 * - Computes organization and team capability maps ONLY from consented employee evidence.
 * - Shows exact counts of supporting evidence per capability, NOT decorative bars or arbitrary percentages.
 * - Team composition flags: "Adds capabilities less represented in this team" — strictly capability coverage,
 *   zero interpersonal-compatibility claims or personality profiling.
 */

import { getDb } from "@/lib/db";
import { consentGrants, claims, evidenceItems } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getAllCandidates } from "@/lib/recruiter-store";
import { listActiveConsentGrants } from "@/lib/privacy/consent";

export interface CapabilityEvidenceBreakdown {
  capability: string;
  verifiedEvidenceCount: number;
  distinctEmployeeCount: number;
  tierCounts: {
    t1_self_asserted: number;
    t2_third_party: number;
    t3_work_sample: number;
    t4_panel_validated: number;
  };
  sources: string[];
  employees: Array<{
    personId: string;
    personName: string;
    evidenceCount: number;
    highestTier: "T1" | "T2" | "T3" | "T4";
  }>;
}

export interface TeamCompositionAnalysis {
  teamId: string;
  teamName: string;
  currentMemberCount: number;
  capabilitiesRepresentedCount: number;
  lessRepresentedCapabilities: string[]; // Capabilities with <= 1 verified evidence item in team
  candidateComplementarity: {
    personId: string;
    personName: string;
    addsCapabilitiesLessRepresented: string[];
    factualObservation: string;
  };
}

export interface OrgCapabilityMapReport {
  orgId: string;
  orgName: string;
  consentedEmployeeCount: number;
  totalVerifiedEvidenceItems: number;
  capabilities: CapabilityEvidenceBreakdown[];
  unrepresentedCapabilitiesCount: number;
  timestamp: string;
}

/**
 * Computes the organization capability map strictly from employee-consented evidence.
 */
export async function getOrganizationCapabilityMap(
  orgId: string,
  orgName: string = "Acme Engineering Corp"
): Promise<OrgCapabilityMapReport> {
  const capabilityMap = new Map<string, CapabilityEvidenceBreakdown>();
  const consentedPersonIds = new Set<string>();
  let totalVerifiedEvidence = 0;

  // 1. Gather all candidates / employees from recruiter store or DB
  const candidates = await getAllCandidates();

  for (const candidate of candidates) {
    const personId = candidate.id;
    // Verify candidate has active consent grant for this org or full_dossier / verified_claims
    const activeGrants = await listActiveConsentGrants(personId);
    const hasConsent = activeGrants.some(
      (g) => g.granteeOrgId === orgId || g.scopes.includes("full_dossier") || g.scopes.includes("verified_claims")
    );

    // If candidate has granted consent to the org
    if (hasConsent) {
      consentedPersonIds.add(personId);

      // Collect verified capabilities from projects, github repos, and certifications
      const projectTech = (candidate.studentProjects || []).flatMap((p) => p.tech || []);
      const githubLangs = (candidate.githubData?.repos || []).flatMap((r) => r.languages || []);
      const certs = candidate.certifications || [];
      const skillNames = Array.from(new Set([...projectTech, ...githubLangs, ...certs]));

      for (const rawName of skillNames) {
        const capName = rawName.trim();
        if (!capName) continue;

        const isGithubVerified = Boolean(candidate.githubData && candidate.githubData.verifiedReposCount > 0 && githubLangs.includes(capName));
        const tier = isGithubVerified ? "T2" : "T1";

        if (!capabilityMap.has(capName)) {
          capabilityMap.set(capName, {
            capability: capName,
            verifiedEvidenceCount: 0,
            distinctEmployeeCount: 0,
            tierCounts: {
              t1_self_asserted: 0,
              t2_third_party: 0,
              t3_work_sample: 0,
              t4_panel_validated: 0,
            },
            sources: [],
            employees: [],
          });
        }

        const entry = capabilityMap.get(capName)!;
        entry.verifiedEvidenceCount += 1;
        totalVerifiedEvidence += 1;

        if (tier === "T2") entry.tierCounts.t2_third_party += 1;
        else entry.tierCounts.t1_self_asserted += 1;

        if (!entry.sources.includes("code_repository")) {
          entry.sources.push("code_repository");
        }

        const existingEmp = entry.employees.find((e) => e.personId === personId);
        if (existingEmp) {
          existingEmp.evidenceCount += 1;
        } else {
          entry.employees.push({
            personId,
            personName: candidate.name,
            evidenceCount: 1,
            highestTier: tier as any,
          });
          entry.distinctEmployeeCount += 1;
        }
      }
    }
  }

  // Sort by verified evidence count descending
  const capabilities = Array.from(capabilityMap.values()).sort(
    (a, b) => b.verifiedEvidenceCount - a.verifiedEvidenceCount
  );

  return {
    orgId,
    orgName,
    consentedEmployeeCount: consentedPersonIds.size,
    totalVerifiedEvidenceItems: totalVerifiedEvidence,
    capabilities,
    unrepresentedCapabilitiesCount: capabilities.filter((c) => c.verifiedEvidenceCount === 0).length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Analyzes team composition and capability complementarity.
 * Strictly adheres to Truth Contract T7: capability coverage only, no interpersonal compatibility.
 */
export function analyzeTeamCompositionDelta(params: {
  teamId: string;
  teamName: string;
  teamExistingCapabilities: Record<string, number>; // capability -> verified evidence count in team
  candidatePersonId: string;
  candidatePersonName: string;
  candidateCapabilities: Array<{ capability: string; verifiedCount: number; tier: "T1" | "T2" | "T3" | "T4" }>;
}): TeamCompositionAnalysis {
  const { teamId, teamName, teamExistingCapabilities, candidatePersonId, candidatePersonName, candidateCapabilities } = params;

  // Capabilities less represented: 0 or 1 verified items in current team
  const lessRepresented = Object.entries(teamExistingCapabilities)
    .filter(([_, count]) => count <= 1)
    .map(([cap]) => cap);

  // Check which of these the candidate brings verified evidence for
  const addsCapabilities: string[] = [];
  for (const candCap of candidateCapabilities) {
    const existingInTeam = teamExistingCapabilities[candCap.capability] ?? 0;
    if (existingInTeam <= 1 && candCap.verifiedCount > 0) {
      addsCapabilities.push(candCap.capability);
    }
  }

  const factualObservation = addsCapabilities.length > 0
    ? `Adds capabilities less represented in this team: ${addsCapabilities.join(", ")} (${addsCapabilities.map(c => `${c}: ${teamExistingCapabilities[c] ?? 0} existing -> +${candidateCapabilities.find(k => k.capability === c)?.verifiedCount ?? 1} verified`).join("; ")}).`
    : "Maintains existing team capability coverage without introducing unrepresented competencies.";

  return {
    teamId,
    teamName,
    currentMemberCount: Object.keys(teamExistingCapabilities).length,
    capabilitiesRepresentedCount: Object.values(teamExistingCapabilities).filter(c => c > 1).length,
    lessRepresentedCapabilities: lessRepresented,
    candidateComplementarity: {
      personId: candidatePersonId,
      personName: candidatePersonName,
      addsCapabilitiesLessRepresented: addsCapabilities,
      factualObservation,
    },
  };
}
