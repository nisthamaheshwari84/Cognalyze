/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — ADMIN MANUAL IMPORT ADAPTER
 * 
 * Emergency Fallback Source Adapter:
 * Allows administrators to directly import or verify high-priority opportunities
 * that cannot be automatically fetched due to bot protection or private portal requirements.
 * 
 * Preserves complete provenance:
 * - Admin creator attribution
 * - Direct application URL
 * - Explicit deadlines and requirements
 */

import { BaseOpportunitySourceAdapter } from "./base-adapter";
import { RawOpportunity, CanonicalOpportunity, OpportunitySourceType } from "../types";

export class AdminManualImportAdapter extends BaseOpportunitySourceAdapter {
  id = "adapter-admin-import";
  name = "Admin Verified Manual Imports";
  type: OpportunitySourceType = "ADMIN_IMPORT";
  description = "Emergency manual fallback adapter for verified institutional and partner opportunities";
  refreshIntervalMs = 24 * 60 * 60 * 1000;

  private manualOpportunities: RawOpportunity[] = [];

  public importOpportunity(payload: {
    sourceUrl: string;
    applicationUrl?: string;
    title: string;
    organizer: string;
    companyName?: string;
    opportunityType?: string;
    deadline?: string;
    mode?: "remote" | "hybrid" | "onsite";
    eligibilityText?: string;
    prize?: string;
    teamSize?: string;
    skills?: string[];
    description: string;
    location?: string;
    adminUserId?: string;
  }): RawOpportunity {
    const id = `manual-import-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const raw: RawOpportunity = {
      id,
      source: `Admin Import (${payload.organizer || "Verified Partner"})`,
      sourceType: "ADMIN_IMPORT",
      sourceId: id,
      sourceUrl: payload.sourceUrl,
      applicationUrl: payload.applicationUrl || payload.sourceUrl,
      companyName: payload.companyName || payload.organizer,
      organizer: payload.organizer,
      title: payload.title,
      opportunityType: (payload.opportunityType as any) || "HACKATHON",
      description: payload.description,
      location: payload.location || (payload.mode === "remote" ? "Remote / Virtual" : "India"),
      locations: [payload.location || "India"],
      remoteType: payload.mode || "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      requirements: payload.skills || ["Software Engineering"],
      eligibilityText: payload.eligibilityText || "Open to eligible students",
      postedAt: new Date().toISOString(),
      deadline: payload.deadline || undefined,
      prize: payload.prize,
      teamSize: payload.teamSize,
      tags: payload.skills || ["Verified"],
      domainTags: ["Curated Opportunity"],
      technologies: payload.skills || [],
      metadata: {
        importedBy: payload.adminUserId || "admin",
        importedAt: new Date().toISOString(),
        isManualEmergencyFallback: true
      }
    };

    this.manualOpportunities.push(raw);
    this.recordsInserted++;
    this.lastUpdated = new Date().toISOString();
    return raw;
  }

  async discover(): Promise<RawOpportunity[]> {
    this.lastRunAt = new Date().toISOString();
    this.recordsFetched = this.manualOpportunities.length;
    this.lastSuccessfulRunAt = new Date().toISOString();
    return [...this.manualOpportunities];
  }

  async fetch(opportunityId: string): Promise<RawOpportunity | null> {
    const found = this.manualOpportunities.find((o) => o.id === opportunityId);
    return found || null;
  }

  normalize(raw: RawOpportunity): CanonicalOpportunity {
    const now = new Date().toISOString();
    const skills = raw.tags || ["General"];

    return {
      id: raw.id,
      source: raw.source,
      sourceType: "ADMIN_IMPORT",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      applicationUrl: raw.applicationUrl,
      companyId: `org-${raw.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      companyName: raw.companyName,
      organizer: raw.organizer || raw.companyName,
      companyType: "enterprise",
      title: raw.title,
      normalizedTitle: raw.title.replace(/\s*—.*$/, "").trim(),
      opportunityType: raw.opportunityType || "HACKATHON",
      description: raw.description,
      rawDescription: raw.description,
      responsibilities: ["Review guidelines and submit direct application before deadline"],
      location: raw.location || "India",
      country: "India",
      city: "National Virtual",
      remoteType: (raw.remoteType as any) || "hybrid",
      employmentType: (raw.employmentType as any) || "internship",
      experienceLevel: (raw.experienceLevel as any) || "intern",
      educationRequirements: {
        degreesAllowed: ["All Degrees"],
        fieldsAllowed: ["All Disciplines"],
        isMandatory: false
      },
      graduationRequirements: {
        currentlyEnrolledRequired: false,
        isMandatory: false
      },
      requiredSkills: skills.slice(0, 3),
      preferredSkills: skills.slice(3),
      technologies: raw.technologies || skills,
      domains: raw.domainTags || ["Curated"],
      tags: raw.tags || ["Admin Verified"],
      eligibilityRequirements: [raw.eligibilityText || "As stated in listing"],
      disqualifiers: [],
      teamSize: raw.teamSize || "Individual / Team",
      prize: raw.prize,
      postedAt: raw.postedAt || now,
      updatedAt: now,
      deadline: raw.deadline || null,
      status: "ACTIVE",
      freshness: "ACTIVE",
      roleDNA: {
        roleCategory: "Admin Verified Opportunity",
        mustHaveSkills: skills.slice(0, 3),
        preferredSkills: skills.slice(3),
        experienceYearsMin: 0,
        experienceYearsMax: 2,
        educationSummary: raw.eligibilityText || "Open to eligible students",
        graduationWindow: "Any",
        locationMode: raw.remoteType || "hybrid",
        disqualifiers: []
      },
      createdAt: raw.postedAt || now,
      lastFetchedAt: now,
      lastVerifiedAt: now,
      contentHash: `admin-${raw.id}-${raw.deadline || ""}`,
      rawSourceData: raw.metadata || {},
      sourceInstances: [
        {
          source: raw.source,
          sourceType: "ADMIN_IMPORT",
          sourceUrl: raw.sourceUrl,
          applicationUrl: raw.applicationUrl,
          retrievedAt: now,
          lastVerifiedAt: now
        }
      ]
    };
  }
}
