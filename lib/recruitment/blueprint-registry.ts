/**
 * lib/recruitment/blueprint-registry.ts
 * 
 * Central Blueprint Registry for the Cognalyze Recruitment Arena.
 * Unites verified company hiring blueprints across all 10 initial enterprise partners.
 */

import { RecruitmentBlueprint, RoleFamily, HiringChannel, BlueprintStageDefinition, ResearchClaim } from "./types";
import { GOOGLE_BLUEPRINTS } from "./blueprints/google-blueprints";
import { AMAZON_BLUEPRINTS } from "./blueprints/amazon-blueprints";
import { MICROSOFT_BLUEPRINTS } from "./blueprints/microsoft-blueprints";
import { ADOBE_BLUEPRINTS } from "./blueprints/adobe-blueprints";
import { ATLASSIAN_BLUEPRINTS } from "./blueprints/atlassian-blueprints";
import { DELOITTE_BLUEPRINTS } from "./blueprints/deloitte-blueprints";
import { TCS_BLUEPRINTS } from "./blueprints/tcs-blueprints";
import { INFOSYS_BLUEPRINTS } from "./blueprints/infosys-blueprints";
import { ACCENTURE_BLUEPRINTS } from "./blueprints/accenture-blueprints";
import { JPMORGAN_BLUEPRINTS } from "./blueprints/jpmorgan-blueprints";

export const ALL_RECRUITMENT_BLUEPRINTS: RecruitmentBlueprint[] = [
  ...GOOGLE_BLUEPRINTS,
  ...AMAZON_BLUEPRINTS,
  ...MICROSOFT_BLUEPRINTS,
  ...ADOBE_BLUEPRINTS,
  ...ATLASSIAN_BLUEPRINTS,
  ...DELOITTE_BLUEPRINTS,
  ...TCS_BLUEPRINTS,
  ...INFOSYS_BLUEPRINTS,
  ...ACCENTURE_BLUEPRINTS,
  ...JPMORGAN_BLUEPRINTS,
];

export function getAllBlueprints(): RecruitmentBlueprint[] {
  return [...ALL_RECRUITMENT_BLUEPRINTS];
}

export function getBlueprintById(id: string): RecruitmentBlueprint | null {
  return ALL_RECRUITMENT_BLUEPRINTS.find((b) => b.id.toLowerCase() === id.toLowerCase()) || null;
}

export function getBlueprintsByCompany(companyId: string): RecruitmentBlueprint[] {
  return ALL_RECRUITMENT_BLUEPRINTS.filter(
    (b) => b.companyId.toLowerCase() === companyId.toLowerCase()
  );
}

/**
 * Resolves a specific company blueprint based on role family, channel, country, and version.
 * Falls back gracefully to the first matching company + role blueprint if channel isn't an exact match.
 */
export function getBlueprint(
  companyId: string,
  roleFamily: RoleFamily,
  hiringChannel?: HiringChannel,
  country?: string,
  version?: string
): RecruitmentBlueprint | null {
  const companyBlueprints = getBlueprintsByCompany(companyId);
  if (companyBlueprints.length === 0) return null;

  // Filter by role
  const roleMatches = companyBlueprints.filter((b) => b.roleFamily === roleFamily);
  if (roleMatches.length === 0) {
    return null;
  }
  let matching = roleMatches;

  // Filter by channel if provided
  if (hiringChannel) {
    const channelMatches = matching.filter((b) => b.hiringChannel === hiringChannel);
    if (channelMatches.length > 0) {
      matching = channelMatches;
    }
  }

  // Filter by country if provided
  if (country) {
    const countryMatches = matching.filter(
      (b) => b.country.toUpperCase() === country.toUpperCase() || b.country === "GLOBAL"
    );
    if (countryMatches.length > 0) {
      matching = countryMatches;
    } else {
      return null;
    }
  }

  // Filter by version if provided
  if (version) {
    const versionMatch = matching.find((b) => b.version === version);
    if (versionMatch) return versionMatch;
  }

  return matching[0] || null;
}

export function getBlueprintStages(blueprintId: string): BlueprintStageDefinition[] {
  const bp = getBlueprintById(blueprintId);
  if (!bp) return [];
  return [...bp.stages].sort((a, b) => a.order - b.order);
}

export function getResearchClaims(blueprintId: string): ResearchClaim[] {
  const bp = getBlueprintById(blueprintId);
  if (!bp) return [];
  return [...bp.verifiedSources];
}

export function getAllResearchClaims(): ResearchClaim[] {
  return ALL_RECRUITMENT_BLUEPRINTS.flatMap((b) => b.verifiedSources);
}

