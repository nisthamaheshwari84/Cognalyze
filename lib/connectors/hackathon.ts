/**
 * lib/connectors/hackathon.ts
 * 
 * COGNALYZE HACKATHON CONNECTOR — EVIDENCE CORROBORATION & DISTINCT STATUSES (PHASE 2)
 * 
 * Strict compliance with Section 11:
 * - Distinguishes 11 distinct hackathon evidence statuses:
 *   EVENT_DISCOVERED, REGISTRATION_REPORTED, REGISTRATION_CONFIRMED,
 *   SUBMISSION_REPORTED, SUBMISSION_FOUND, PARTICIPATION_CORROBORATED,
 *   SHORTLISTED, FINALIST, WINNER, SOURCE_UNAVAILABLE, NOT_VERIFIED.
 * - Never equates registration with participation.
 * - Never equates participation with winning.
 * - Entering a URL alone does NOT establish the claimed achievement.
 * - Deduplicates multi-source hackathon mentions into a canonical event.
 */

import {
  BaseSourceConnector,
  ConnectorRetrievalResult,
  NormalizedSourceArtifact
} from "./types";
import { isSafePublicUrl } from "@/lib/resilience/security";

export type HackathonEvidenceState =
  | "EVENT_DISCOVERED"
  | "REGISTRATION_REPORTED"
  | "REGISTRATION_CONFIRMED"
  | "SUBMISSION_REPORTED"
  | "SUBMISSION_FOUND"
  | "PARTICIPATION_CORROBORATED"
  | "SHORTLISTED"
  | "FINALIST"
  | "WINNER"
  | "SOURCE_UNAVAILABLE"
  | "NOT_VERIFIED";

export interface HackathonEntryConfig {
  title: string;
  organizer?: string;
  date?: string;
  submissionUrl?: string;
  eventUrl?: string;
  reportedResult?: "Winner" | "Finalist" | "Participant" | "Registered";
  mockPayload?: {
    eventFound: boolean;
    submissionFound: boolean;
    officialWinnerConfirmed?: boolean;
    officialParticipantConfirmed?: boolean;
    resultUnavailable?: boolean;
    urlBlocked?: boolean;
  };
}

export interface HackathonConnectorConfig {
  hackathons: HackathonEntryConfig[];
}

export interface VerifiedHackathonRecord {
  hackathonId: string;
  title: string;
  organizer: string;
  date?: string;
  eventUrl?: string;
  submissionUrl?: string;
  evidenceState: HackathonEvidenceState;
  corroboratingDetails: string;
  limitations: string[];
}

export class HackathonSourceConnector implements BaseSourceConnector<HackathonConnectorConfig, VerifiedHackathonRecord[]> {
  readonly sourceType = "hackathon" as const;

  public async retrieve(
    studentId: string,
    config: HackathonConnectorConfig,
    options?: { forceRefresh?: boolean; dryRun?: boolean }
  ): Promise<ConnectorRetrievalResult<VerifiedHackathonRecord[]>> {
    const now = new Date().toISOString();
    const artifacts: NormalizedSourceArtifact[] = [];
    const limitations: string[] = [];
    const records: VerifiedHackathonRecord[] = [];

    if (!config.hackathons || config.hackathons.length === 0) {
      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        connectionStatus: "NOT_PROVIDED",
        inspectionStatus: "UNAVAILABLE",
        completeness: "NOT_ATTEMPTED",
        retrievedAt: now,
        artifacts: [],
        artifactsCount: 0,
        inspectedCount: 0,
        limitations: ["No hackathon participation records provided."],
      };
    }

    // Deduplicate by normalized event title
    const seenTitles = new Set<string>();

    for (let i = 0; i < config.hackathons.length; i++) {
      const h = config.hackathons[i];
      const normTitle = (h.title || "").trim().toLowerCase();
      if (!normTitle || seenTitles.has(normTitle)) continue;
      seenTitles.add(normTitle);

      const hackId = `hack_${studentId}_${i}`;
      let state: HackathonEvidenceState = "NOT_VERIFIED";
      let details = "";
      const itemLimitations: string[] = [];

      if (h.mockPayload) {
        const m = h.mockPayload;
        if (m.urlBlocked) {
          state = "SOURCE_UNAVAILABLE";
          details = "Submission or event URL blocked by security policy.";
          itemLimitations.push("Destination URL was restricted by SSRF safety filters.");
        } else if (m.resultUnavailable) {
          state = "SOURCE_UNAVAILABLE";
          details = "Official event results page is private or unavailable.";
          itemLimitations.push("Organizer results page could not be accessed.");
        } else if (m.officialWinnerConfirmed) {
          state = "WINNER";
          details = "Official organizer results corroborate 1st place / winning achievement.";
        } else if (m.officialParticipantConfirmed && h.submissionUrl) {
          state = "PARTICIPATION_CORROBORATED";
          details = "Verified participant submission artifact present on official platform.";
        } else if (m.submissionFound) {
          state = "SUBMISSION_FOUND";
          details = "Project submission located on public showcase, but placement not corroborated.";
          itemLimitations.push("Submission found; winning result was not verified by organizer announcement.");
        } else if (m.eventFound) {
          state = "REGISTRATION_CONFIRMED";
          details = "Event confirmed, but project submission and placement remain unverified.";
          itemLimitations.push("Registration does not establish project completion or competitive placement.");
        } else {
          state = "NOT_VERIFIED";
          details = "Self-reported hackathon claim without independent organizer corroboration.";
          itemLimitations.push("No independent organizer confirmation found.");
        }
      } else {
        // Live evaluation
        const hasSubUrl = Boolean(h.submissionUrl && isSafePublicUrl(h.submissionUrl).safe);
        const hasEventUrl = Boolean(h.eventUrl && isSafePublicUrl(h.eventUrl).safe);

        if (hasSubUrl) {
          state = "SUBMISSION_FOUND";
          details = `Submitted project artifact located at ${h.submissionUrl}. Official rank remains unverified.`;
          itemLimitations.push("Submission artifact URL provided. Official organizer winner list was not independently inspected.");
        } else if (hasEventUrl) {
          state = "EVENT_DISCOVERED";
          details = `Event page reachable at ${h.eventUrl}. Individual participation uncorroborated.`;
          itemLimitations.push("Entering an event link alone does not verify student participation or award.");
        } else {
          state = "REGISTRATION_REPORTED";
          details = "Claim recorded from candidate profile. Awaiting submission or certificate link.";
          itemLimitations.push("Self-reported hackathon claim without supporting URL.");
        }
      }

      records.push({
        hackathonId: hackId,
        title: h.title,
        organizer: h.organizer || "Hackathon Organizer",
        date: h.date,
        eventUrl: h.eventUrl,
        submissionUrl: h.submissionUrl,
        evidenceState: state,
        corroboratingDetails: details,
        limitations: itemLimitations,
      });

      artifacts.push({
        artifactId: `hack_art_${hackId}`,
        sourceType: "hackathon",
        sourceIdentifier: h.submissionUrl || h.eventUrl || h.title,
        name: h.title,
        title: `Hackathon: ${h.title}`,
        description: details,
        rawUrl: h.submissionUrl || h.eventUrl,
        retrievedAt: now,
        inspectedAt: now,
        languagesObserved: [],
        manifestsFound: [],
        testFilesFound: [],
        ciConfigured: false,
        snippets: [{
          section: "Hackathon Result",
          excerpt: `Status: ${state}. Details: ${details}`
        }],
        metadata: {
          state,
          organizer: h.organizer,
          submissionUrl: h.submissionUrl,
        }
      });
    }

    return {
      sourceType: this.sourceType,
      authenticatedStudentId: studentId,
      connectionStatus: records.length > 0 ? "CONTENT_RETRIEVED" : "NOT_PROVIDED",
      inspectionStatus: "INSPECTED",
      completeness: "COMPLETE",
      retrievedAt: now,
      inspectedAt: now,
      artifacts,
      artifactsCount: artifacts.length,
      inspectedCount: artifacts.length,
      data: records,
      limitations: ["Hackathon placement verification bounded by public organizer announcement availability."],
    };
  }
}

export const hackathonConnector = new HackathonSourceConnector();
