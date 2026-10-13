/**
 * lib/connectors/linkedin.ts
 * 
 * COGNALYZE LINKEDIN CONNECTOR — AUTHORIZED INTEGRATION & EXPLICIT ACCESS POLICIES (PHASE 2)
 * 
 * Strict compliance with Section 8:
 * - Supported authorized integration only (OAuth / partner API token).
 * - Zero unauthorized scraping or headless browser evasion.
 * - When unconfigured or without authorized token: reports honest "ACCESS_RESTRICTED" / "NOT_CONNECTED".
 * - Storing profile URL alone does NOT count as inspecting profile content.
 * - Zero AI-hallucinated employment or education history.
 */

import {
  BaseSourceConnector,
  ConnectorRetrievalResult,
  NormalizedSourceArtifact
} from "./types";

export interface LinkedInConnectorConfig {
  profileUrl?: string;
  accessToken?: string;
  mockPayload?: {
    accessible: boolean;
    headline?: string;
    vanityName?: string;
    profileUrl?: string;
    experience?: Array<{
      role: string;
      organization: string;
      dates?: string;
      description?: string;
    }>;
    certifications?: Array<{
      name: string;
      issuer: string;
      issue_date?: string;
      credential_id?: string;
      credential_url?: string;
      issuer_verified?: boolean;
    }>;
    education?: Array<{
      institution: string;
      degree?: string;
      fieldOfStudy?: string;
      dates?: string;
    }>;
    tokenExpired?: boolean;
    permissionInsufficient?: boolean;
    consentRequired?: boolean;
  };
}

export interface LinkedInProfileData {
  profileUrl: string;
  headline?: string;
  experience: Array<{
    role: string;
    organization: string;
    dates?: string;
    description?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issue_date?: string;
    credential_id?: string;
    credential_url?: string;
    issuer_verified: boolean;
  }>;
  education: Array<{
    institution: string;
    degree?: string;
    fieldOfStudy?: string;
    dates?: string;
  }>;
  retrievedAt: string;
}

export class LinkedInSourceConnector implements BaseSourceConnector<LinkedInConnectorConfig, LinkedInProfileData> {
  readonly sourceType = "linkedin" as const;

  public async retrieve(
    studentId: string,
    config: LinkedInConnectorConfig,
    options?: { forceRefresh?: boolean; dryRun?: boolean }
  ): Promise<ConnectorRetrievalResult<LinkedInProfileData>> {
    const now = new Date().toISOString();
    const artifacts: NormalizedSourceArtifact[] = [];
    const limitations: string[] = [];

    // 1. Not provided
    if (!config.profileUrl && !config.mockPayload && !config.accessToken) {
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
        limitations: ["No LinkedIn profile URL or OAuth connection provided."],
      };
    }

    // 2. Mock payload for testing
    if (config.mockPayload) {
      const mock = config.mockPayload;

      if (mock.consentRequired) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          canonicalSourceUrl: mock.profileUrl || config.profileUrl,
          connectionStatus: "NOT_CONNECTED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { errorCode: "CONSENT_REQUIRED", errorMessage: "Candidate consent required for LinkedIn import" },
          limitations: ["Candidate consent has not yet been granted for authorized LinkedIn data import."],
          error: "Candidate consent required.",
        };
      }

      if (mock.tokenExpired) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          canonicalSourceUrl: mock.profileUrl || config.profileUrl,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { httpStatus: 401, errorCode: "TOKEN_EXPIRED", errorMessage: "OAuth token has expired" },
          limitations: ["LinkedIn OAuth authorization has expired. Re-authentication required."],
          error: "LinkedIn access token expired.",
        };
      }

      if (mock.permissionInsufficient) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          canonicalSourceUrl: mock.profileUrl || config.profileUrl,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { httpStatus: 403, errorCode: "INSUFFICIENT_SCOPE", errorMessage: "Required profile scopes not granted" },
          limitations: ["Integration permissions insufficient to access full LinkedIn profile fields."],
          error: "LinkedIn integration permissions insufficient.",
        };
      }

      if (!mock.accessible) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          canonicalSourceUrl: mock.profileUrl || config.profileUrl,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { httpStatus: 404, errorCode: "NOT_FOUND", errorMessage: "Profile not found or provider unavailable" },
          limitations: ["LinkedIn profile could not be reached through authorized gateway."],
          error: "LinkedIn profile content could not be retrieved through the currently configured authorized integration.",
        };
      }

      // Successful authorized retrieval
      const profileUrl = mock.profileUrl || config.profileUrl || "https://linkedin.com/in/candidate";
      const certs = (mock.certifications || []).map(c => ({
        name: c.name,
        issuer: c.issuer,
        issue_date: c.issue_date,
        credential_id: c.credential_id,
        credential_url: c.credential_url,
        issuer_verified: Boolean(c.issuer_verified),
      }));

      // Create artifacts for certs and experience
      certs.forEach((c, idx) => {
        artifacts.push({
          artifactId: `li_art_${studentId}_cert_${idx}`,
          sourceType: "linkedin",
          sourceIdentifier: c.credential_url || profileUrl,
          name: c.name,
          title: `LinkedIn Certification: ${c.name}`,
          description: `Issued by ${c.issuer}`,
          rawUrl: c.credential_url,
          retrievedAt: now,
          inspectedAt: now,
          languagesObserved: [],
          manifestsFound: [],
          testFilesFound: [],
          ciConfigured: false,
          snippets: [{
            section: "Certifications",
            excerpt: `${c.name} (${c.issuer}) - Verified by issuer: ${c.issuer_verified}`
          }],
          metadata: { ...c }
        });
      });

      (mock.experience || []).forEach((e, idx) => {
        artifacts.push({
          artifactId: `li_art_${studentId}_exp_${idx}`,
          sourceType: "linkedin",
          sourceIdentifier: profileUrl,
          name: `${e.role} at ${e.organization}`,
          title: `LinkedIn Experience: ${e.role}`,
          description: `${e.organization} (${e.dates || "Tenure unspecified"})`,
          rawUrl: profileUrl,
          retrievedAt: now,
          inspectedAt: now,
          languagesObserved: [],
          manifestsFound: [],
          testFilesFound: [],
          ciConfigured: false,
          snippets: [{
            section: "Experience",
            excerpt: `${e.role} at ${e.organization}. ${e.description || ""}`
          }],
          metadata: { ...e }
        });
      });

      limitations.push("LinkedIn entries reflect self-reported candidate profile entries unless authenticated by official credential issuer.");

      const data: LinkedInProfileData = {
        profileUrl,
        headline: mock.headline,
        experience: mock.experience || [],
        certifications: certs,
        education: mock.education || [],
        retrievedAt: now,
      };

      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        authorizedSourceIdentity: mock.vanityName || undefined,
        canonicalSourceUrl: profileUrl,
        connectionStatus: "CONTENT_RETRIEVED",
        inspectionStatus: "INSPECTED",
        completeness: "COMPLETE",
        retrievedAt: now,
        inspectedAt: now,
        artifacts,
        artifactsCount: artifacts.length,
        inspectedCount: artifacts.length,
        data,
        limitations,
      };
    }

    // 3. Live LinkedIn flow without active enterprise OAuth
    const profileUrl = config.profileUrl ? config.profileUrl.trim() : "";
    const hasToken = Boolean(config.accessToken || process.env.LINKEDIN_CLIENT_ID);

    if (profileUrl && !hasToken) {
      // Profile URL supplied, but no OAuth connection configured
      limitations.push("LinkedIn profile URL recorded. Automated web scraping of LinkedIn public pages is strictly prohibited by platform terms of service and security policy.");
      limitations.push("Connect your account with authorized OAuth consent to import profile experience and certifications.");

      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        canonicalSourceUrl: profileUrl,
        connectionStatus: "NOT_CONNECTED",
        inspectionStatus: "UNAVAILABLE",
        completeness: "NOT_ATTEMPTED",
        retrievedAt: now,
        artifacts: [],
        artifactsCount: 0,
        inspectedCount: 0,
        diagnostics: {
          errorCode: "OAUTH_REQUIRED",
          errorMessage: "Direct scraping is prohibited. Authorized OAuth required for profile data retrieval."
        },
        limitations,
        error: "LinkedIn profile content could not be retrieved through the currently configured authorized integration.",
      };
    }

    // If OAuth is configured but student has not connected
    return {
      sourceType: this.sourceType,
      authenticatedStudentId: studentId,
      canonicalSourceUrl: profileUrl || undefined,
      connectionStatus: "NOT_CONNECTED",
      inspectionStatus: "UNAVAILABLE",
      completeness: "NOT_ATTEMPTED",
      retrievedAt: now,
      artifacts: [],
      artifactsCount: 0,
      inspectedCount: 0,
      limitations: ["LinkedIn OAuth connection pending. Please connect via candidate settings."],
      error: "LinkedIn account not connected.",
    };
  }
}

export const linkedinConnector = new LinkedInSourceConnector();
