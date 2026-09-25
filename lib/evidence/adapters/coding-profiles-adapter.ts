/**
 * COGNALYZE — CODING & COMPETITIVE PROFILES ADAPTER (Section 7, 27)
 * 
 * Handles LeetCode, Codeforces, HackerRank, CodeChef, Devpost, Unstop.
 * Extracts observable facts without manufacturing ratings or scores.
 * Enforces identity verification before attributing problem-solving metrics.
 */

import {
  EvidenceSource,
  EvidenceItem,
  IdentityResolutionState
} from "../types";

export interface CodingProfileData {
  platform: "LeetCode" | "Codeforces" | "HackerRank" | "CodeChef" | "Devpost" | "Unstop";
  handle: string;
  url: string;
  problemsSolvedCount?: number;
  contestsCount?: number;
  ratingTier?: string;
  hackathonWins?: string[];
  lastActiveDate?: string;
}

export class CodingProfilesAdapter {
  public resolveIdentity(
    candidateName: string,
    candidateHandle: string,
    profileRealName?: string
  ): { status: IdentityResolutionState; reason: string } {
    if (!profileRealName) {
      return {
        status: "PROBABLE",
        reason: `Handle '${candidateHandle}' provided directly in candidate profile, but real name is unlisted on the public platform.`
      };
    }

    const cleanCandidate = candidateName.toLowerCase().trim();
    const cleanProfileName = profileRealName.toLowerCase().trim();

    if (cleanCandidate === cleanProfileName) {
      return {
        status: "VERIFIED",
        reason: `Exact full name match ('${profileRealName}') on public ${profileRealName} profile.`
      };
    }

    return {
      status: "AMBIGUOUS",
      reason: `Name on public profile ('${profileRealName}') does not match candidate ('${candidateName}').`
    };
  }

  public extractEvidence(
    data: CodingProfileData,
    candidateId: string,
    identityStatus: IdentityResolutionState
  ): { source: EvidenceSource; evidenceItems: EvidenceItem[] } {
    const sourceId = `src-${data.platform.toLowerCase()}-${data.handle}`;
    const retrievedAt = new Date().toISOString();

    const source: EvidenceSource = {
      sourceId,
      candidateId,
      category: "PUBLIC_CODING_PROFILE",
      name: `${data.platform} Profile (${data.handle})`,
      url: data.url,
      identifier: data.handle,
      isCandidateProvided: true,
      retrievalStatus: "SUCCESS",
      identityStatus,
      identityReason: `Extracted from candidate-provided ${data.platform} profile handle.`,
      retrievedAt,
      lastCheckedAt: retrievedAt,
      sourceVersion: 1
    };

    const evidenceItems: EvidenceItem[] = [];

    if (data.problemsSolvedCount !== undefined) {
      evidenceItems.push({
        evidenceId: `evi-${sourceId}-solved`,
        candidateId,
        sourceId,
        sourceType: "PUBLIC_CODING_PROFILE",
        sourceUrl: data.url,
        sourceTitle: `${data.platform} Solved Problems`,
        retrievedAt,
        classification: "SOURCE_FACT",
        hierarchyLevel: "LEVEL_2_PUBLIC_SOURCE",
        evidenceStatus: identityStatus === "VERIFIED" ? "SUPPORTED" : "UNVERIFIED",
        verbatimSnippet: `Public profile shows ${data.problemsSolvedCount} solved problems.`,
        structuredObservation: `${data.problemsSolvedCount} algorithm problems solved on ${data.platform}`,
        sourceLocation: `${data.url}#solved`,
        evidenceVersion: 1
      });
    }

    if (data.hackathonWins && data.hackathonWins.length > 0) {
      for (let i = 0; i < data.hackathonWins.length; i++) {
        const win = data.hackathonWins[i];
        evidenceItems.push({
          evidenceId: `evi-${sourceId}-win-${i}`,
          candidateId,
          sourceId,
          sourceType: "PUBLIC_HACKATHON",
          sourceUrl: data.url,
          sourceTitle: `${data.platform} Hackathon Placement`,
          retrievedAt,
          classification: "SOURCE_FACT",
          hierarchyLevel: "LEVEL_2_PUBLIC_SOURCE",
          evidenceStatus: identityStatus === "VERIFIED" ? "CORROBORATED" : "UNVERIFIED",
          verbatimSnippet: `Awarded: ${win}`,
          structuredObservation: `Documented hackathon placement: ${win}`,
          sourceLocation: `${data.url}#awards`,
          evidenceVersion: 1
        });
      }
    }

    return { source, evidenceItems };
  }
}
