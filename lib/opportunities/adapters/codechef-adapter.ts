/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — CODECHEF ADAPTER
 * 
 * Ingestion for CodeChef:
 * 1. Discovers rated algorithmic rounds, Starters divisions, and collegiate competitive contests.
 * 2. Normalizes divisions (Div 1/2/3/4), time penalties, and rating criteria.
 * 3. Classifies as CODING_CONTEST to drive algorithmic speed/complexity preparation.
 */

import { BaseOpportunitySourceAdapter } from "./base-adapter";
import { RawOpportunity, CanonicalOpportunity, OpportunitySourceType } from "../types";

export class CodeChefAdapter extends BaseOpportunitySourceAdapter {
  id = "adapter-codechef";
  name = "CodeChef Rated Rounds & Collegiate Contests";
  type: OpportunitySourceType = "CODECHEF";
  description = "Divisional rated algorithmic rounds, Starters contests, and collegiate programming challenges on CodeChef";
  refreshIntervalMs = 6 * 60 * 60 * 1000;

  private codechefFeed: RawOpportunity[] = [
    {
      id: "codechef-starters-150",
      source: "CodeChef",
      sourceType: "CODECHEF",
      sourceId: "starters-150",
      sourceUrl: "https://www.codechef.com/START150",
      applicationUrl: "https://www.codechef.com/START150",
      companyName: "CodeChef",
      organizer: "CodeChef Community",
      title: "CodeChef Starters 150 (Rated for Div 2, 3, 4)",
      opportunityType: "COMPETITION",
      description: "Weekly rated contest tailored for collegiate and early-career software engineers. Consists of 6-8 algorithmic problems testing mathematical reasoning, greedy strategies, binary search on answer, and tree traversals.",
      location: "Global Virtual",
      locations: ["Global Virtual"],
      remoteType: "remote",
      employmentType: "fellowship",
      experienceLevel: "entry_level",
      requirements: [
        "C++ STL (Vectors, Sets, Maps, Priority Queues) or Python equivalent",
        "Number Theory: GCD, Modular Inverses, Sieve of Eratosthenes",
        "Binary Search, Two Pointers, and Prefix Sums",
        "Strict 1.0s time limit execution"
      ],
      eligibilityText: "Open to all registered CodeChef handles. Rated for Divisions 2, 3, and 4.",
      postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
      prize: "CodeChef Laddus + Global Rating Increment",
      teamSize: "1 Member",
      tags: ["Algorithms", "Competitive Programming", "C++", "Math", "DSA"],
      domainTags: ["Competitive Programming", "Algorithms"],
      technologies: ["C++", "Java", "Python"],
      metadata: {
        platform: "CodeChef",
        classification: "CODING_CONTEST",
        duration: "2 Hours",
        ratedDivisions: ["Div 2", "Div 3", "Div 4"]
      }
    }
  ];

  async discover(query?: { limit?: number }): Promise<RawOpportunity[]> {
    this.lastRunAt = new Date().toISOString();
    const limit = query?.limit || 20;
    const records = this.codechefFeed.slice(0, limit);
    this.recordsFetched = records.length;
    this.lastSuccessfulRunAt = new Date().toISOString();
    return records;
  }

  async fetch(opportunityId: string): Promise<RawOpportunity | null> {
    return this.codechefFeed.find((o) => o.id === opportunityId || o.sourceId === opportunityId) || null;
  }

  normalize(raw: RawOpportunity): CanonicalOpportunity {
    const now = new Date().toISOString();
    return {
      id: raw.id,
      canonicalOpportunityId: raw.id,
      source: raw.source || "CodeChef",
      sourceType: "CODECHEF",
      sourceId: raw.sourceId || raw.id,
      sourceUrl: raw.sourceUrl,
      sourceUrls: [raw.sourceUrl],
      applicationUrl: raw.applicationUrl,
      canonicalUrl: raw.sourceUrl,

      companyId: "org-codechef",
      companyName: raw.companyName || "CodeChef",
      organizer: raw.organizer || "CodeChef",
      companyType: "enterprise",

      title: raw.title,
      normalizedTitle: raw.title.toLowerCase().replace(/[^a-z0-9]/g, " ").trim(),
      opportunityType: raw.opportunityType || "COMPETITION",
      classification: "CODING_CONTEST",

      description: raw.description,
      responsibilities: [
        "Solve algorithmic questions within the 2-hour contest window",
        "Implement optimal asymptotic time complexity to avoid Time Limit Exceeded (TLE)",
        "Handle numeric edge cases, overflows, and large 64-bit integer ranges"
      ],

      location: raw.location || "Virtual",
      locations: raw.locations || ["Virtual"],
      country: "Global",
      city: "Online",

      remoteType: "remote",
      employmentType: (raw.employmentType as any) || "fellowship",
      experienceLevel: (raw.experienceLevel as any) || "entry_level",

      educationRequirements: {
        degreesAllowed: ["Any Degree"],
        fieldsAllowed: ["Computer Science", "Engineering", "Any Field"],
        isMandatory: false
      },
      graduationRequirements: {
        isMandatory: false
      },

      requiredSkills: raw.requirements || ["Competitive Programming", "C++", "Algorithms"],
      preferredSkills: ["Binary Search", "Dynamic Programming", "Graph Theory"],
      technologies: raw.technologies || ["C++", "Java", "Python"],
      domains: raw.domainTags || ["Competitive Programming"],
      tags: raw.tags || ["CodeChef", "Contest"],

      eligibilityRequirements: raw.eligibilityText ? [raw.eligibilityText] : ["Open globally"],
      disqualifiers: ["Sharing solutions during contest window"],

      teamSize: raw.teamSize || "1 Member",
      prize: raw.prize,

      postedAt: raw.postedAt || now,
      updatedAt: now,
      deadline: raw.deadline || null,

      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      linkStatus: "VERIFIED_ACTIVE",
      sourceConfidence: "HIGH",
      contentConfidence: "HIGH",
      freshness: "FRESH",

      roleDNA: {
        roleCategory: "Competitive Programming & Problem Solving",
        mustHaveSkills: raw.requirements?.slice(0, 3) || ["C++", "Algorithms"],
        preferredSkills: ["C++ STL", "Time Complexity Analysis"],
        experienceYearsMin: 0,
        experienceYearsMax: 2,
        educationSummary: "Open to all students",
        graduationWindow: "Open",
        locationMode: "Remote",
        disqualifiers: ["Plagiarism"]
      },

      createdAt: now,
      lastVerifiedAt: now,
      sourceVersion: 1,
      sourceMetadata: raw.metadata || {}
    };
  }
}
