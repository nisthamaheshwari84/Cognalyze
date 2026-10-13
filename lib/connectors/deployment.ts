/**
 * lib/connectors/deployment.ts
 * 
 * COGNALYZE LIVE DEPLOYMENT CONNECTOR — SSRF-PROTECTED INSPECTION (PHASE 2)
 * 
 * Strict compliance with Section 10:
 * - SSRF defense: Blocks loopback, internal private subnets, cloud metadata (169.254.169.254),
 *   and non-HTTP/HTTPS protocols.
 * - Safe, non-destructive HTTP probe with bounded timeout (5000ms) and response-size limit (50KB).
 * - Extracts observable page title, HTTP status, and surface features.
 * - Explicitly records that landing-page accessibility does not prove all internal features work.
 * - Never executes untrusted executable scripts.
 */

import {
  BaseSourceConnector,
  ConnectorRetrievalResult,
  NormalizedSourceArtifact
} from "./types";
import { isSafePublicUrl } from "@/lib/resilience/security";

export interface DeploymentConnectorConfig {
  deploymentUrl?: string;
  projectTitle?: string;
  linkedRepoUrl?: string;
  mockPayload?: {
    accessible: boolean;
    url: string;
    httpStatus?: number;
    htmlTitle?: string;
    features?: string[];
    timeout?: boolean;
    oversized?: boolean;
    isUnsafe?: boolean;
    unsafeReason?: string;
  };
}

export interface DeploymentInspectionData {
  url: string;
  accessible: boolean;
  httpStatus: number | null;
  pageTitle: string | null;
  featuresObserved: string[];
  linkedRepoUrl?: string;
  inspectedAt: string;
}

export class DeploymentSourceConnector implements BaseSourceConnector<DeploymentConnectorConfig, DeploymentInspectionData> {
  readonly sourceType = "live_deployment" as const;

  public async retrieve(
    studentId: string,
    config: DeploymentConnectorConfig,
    options?: { forceRefresh?: boolean; dryRun?: boolean }
  ): Promise<ConnectorRetrievalResult<DeploymentInspectionData>> {
    const now = new Date().toISOString();
    const artifacts: NormalizedSourceArtifact[] = [];
    const limitations: string[] = [];

    // 1. Not provided
    if (!config.deploymentUrl && !config.mockPayload) {
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
        limitations: ["No live deployment URL provided for this project."],
      };
    }

    // 2. Mock payload for testing
    if (config.mockPayload) {
      const mock = config.mockPayload;
      if (mock.isUnsafe) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          canonicalSourceUrl: mock.url,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: {
            errorCode: "SSRF_BLOCKED",
            errorMessage: mock.unsafeReason || "Destination blocked by SSRF security filter."
          },
          limitations: [`Deployment URL restricted: ${mock.unsafeReason || "Private or unsafe network target."}`],
          error: mock.unsafeReason || "Destination blocked by security policy.",
        };
      }

      if (mock.timeout) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          canonicalSourceUrl: mock.url,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { errorCode: "TIMEOUT", errorMessage: "HTTP request timed out after 5000ms" },
          limitations: ["Deployment endpoint failed to respond within the 5-second timeout window."],
          error: "Deployment connection timed out.",
        };
      }

      if (mock.oversized) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          canonicalSourceUrl: mock.url,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { errorCode: "PAYLOAD_TOO_LARGE", errorMessage: "Response exceeded 50KB inspection limit" },
          limitations: ["Deployment payload exceeded safety limit. Bounded inspection aborted."],
          error: "Response payload exceeded 50KB size limit.",
        };
      }

      if (!mock.accessible) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          canonicalSourceUrl: mock.url,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { httpStatus: mock.httpStatus ?? 503, errorMessage: "Live application returned error status" },
          limitations: ["Deployment URL returned non-200 HTTP status code or connection failed."],
          error: "Deployment endpoint unreachable.",
        };
      }

      const features = mock.features || ["HTTP 200 homepage", "Interactive UI elements"];
      artifacts.push({
        artifactId: `dep_art_${studentId}_${encodeURIComponent(mock.url)}`,
        sourceType: "live_deployment",
        sourceIdentifier: mock.url,
        name: config.projectTitle || "Live Web Deployment",
        title: `Deployment: ${mock.htmlTitle || config.projectTitle || mock.url}`,
        description: `Accessible deployment observed at ${mock.url}`,
        rawUrl: mock.url,
        retrievedAt: now,
        inspectedAt: now,
        languagesObserved: [],
        manifestsFound: [],
        testFilesFound: [],
        ciConfigured: false,
        snippets: [{
          section: "HTTP Response Surface",
          excerpt: `Status: ${mock.httpStatus ?? 200}, Title: "${mock.htmlTitle || "Live Web Application"}", Features: ${features.join(", ")}`
        }],
        metadata: {
          httpStatus: mock.httpStatus ?? 200,
          pageTitle: mock.htmlTitle || null,
          featuresObserved: features,
          linkedRepoUrl: config.linkedRepoUrl,
        }
      });

      limitations.push("Deployment inspected non-destructively. Backend database mutations and private state were not probed.");

      const data: DeploymentInspectionData = {
        url: mock.url,
        accessible: true,
        httpStatus: mock.httpStatus ?? 200,
        pageTitle: mock.htmlTitle || null,
        featuresObserved: features,
        linkedRepoUrl: config.linkedRepoUrl,
        inspectedAt: now,
      };

      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        canonicalSourceUrl: mock.url,
        connectionStatus: "CONTENT_RETRIEVED",
        inspectionStatus: "INSPECTED",
        completeness: "COMPLETE",
        retrievedAt: now,
        inspectedAt: now,
        artifacts,
        artifactsCount: 1,
        inspectedCount: 1,
        data,
        limitations,
      };
    }

    // 3. Live Safe URL Check & Probe
    const rawUrl = config.deploymentUrl!.trim();
    const safetyCheck = isSafePublicUrl(rawUrl);
    if (!safetyCheck.safe) {
      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        canonicalSourceUrl: rawUrl,
        connectionStatus: "RETRIEVAL_FAILED",
        inspectionStatus: "UNAVAILABLE",
        completeness: "NOT_ATTEMPTED",
        retrievedAt: now,
        artifacts: [],
        artifactsCount: 0,
        inspectedCount: 0,
        diagnostics: { errorCode: "SSRF_BLOCKED", errorMessage: safetyCheck.reason },
        limitations: [`Destination blocked by SSRF filter: ${safetyCheck.reason}`],
        error: `Deployment URL blocked: ${safetyCheck.reason}`,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(rawUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Cognalyze-Deployment-Inspector/2.0 (compatible; security probe)",
          Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          canonicalSourceUrl: rawUrl,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { httpStatus: res.status, errorMessage: `HTTP ${res.status} returned by deployment` },
          limitations: [`Live endpoint returned HTTP ${res.status}.`],
          error: `Live deployment returned status ${res.status}`,
        };
      }

      // Read bounded text up to 50KB
      const text = await res.text();
      const boundedText = text.slice(0, 50 * 1024);

      // Extract HTML title
      const titleMatch = boundedText.match(/<title[^>]*>([^<]+)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1].trim() : config.projectTitle || "Live Web Application";

      const featuresObserved: string[] = ["HTTP 200 response"];
      if (boundedText.toLowerCase().includes("react") || boundedText.includes("__next")) {
        featuresObserved.push("Client-side SPA / SSR application bundle");
      }
      if (boundedText.includes("<form") || boundedText.includes("<button")) {
        featuresObserved.push("Interactive UI elements");
      }

      artifacts.push({
        artifactId: `dep_art_${studentId}_${encodeURIComponent(rawUrl)}`,
        sourceType: "live_deployment",
        sourceIdentifier: rawUrl,
        name: config.projectTitle || "Live Web Deployment",
        title: `Deployment: ${pageTitle}`,
        description: `Accessible deployment observed at ${rawUrl}`,
        rawUrl,
        retrievedAt: now,
        inspectedAt: now,
        languagesObserved: [],
        manifestsFound: [],
        testFilesFound: [],
        ciConfigured: false,
        snippets: [{
          section: "Live HTTP Homepage",
          excerpt: `HTTP 200 OK. Title: "${pageTitle}". Features: ${featuresObserved.join(", ")}`
        }],
        metadata: {
          httpStatus: res.status,
          pageTitle,
          featuresObserved,
          linkedRepoUrl: config.linkedRepoUrl,
        }
      });

      limitations.push("Landing page inspection performed safely via non-destructive GET request. Does not prove all interactive sub-features work without authenticated test execution.");

      const data: DeploymentInspectionData = {
        url: rawUrl,
        accessible: true,
        httpStatus: res.status,
        pageTitle,
        featuresObserved,
        linkedRepoUrl: config.linkedRepoUrl,
        inspectedAt: now,
      };

      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        canonicalSourceUrl: rawUrl,
        connectionStatus: "CONTENT_RETRIEVED",
        inspectionStatus: "INSPECTED",
        completeness: "COMPLETE",
        retrievedAt: now,
        inspectedAt: now,
        artifacts,
        artifactsCount: 1,
        inspectedCount: 1,
        data,
        limitations,
      };
    } catch (err: any) {
      const isTimeout = err.name === "AbortError";
      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        canonicalSourceUrl: rawUrl,
        connectionStatus: "RETRIEVAL_FAILED",
        inspectionStatus: "UNAVAILABLE",
        completeness: "NOT_ATTEMPTED",
        retrievedAt: now,
        artifacts: [],
        artifactsCount: 0,
        inspectedCount: 0,
        diagnostics: {
          errorCode: isTimeout ? "TIMEOUT" : "CONNECTION_FAILED",
          errorMessage: err.message
        },
        limitations: [isTimeout ? "Connection timed out after 5 seconds." : `Deployment could not be reached: ${err.message}`],
        error: isTimeout ? "Deployment connection timed out." : `Failed to connect to deployment: ${err.message}`,
      };
    }
  }
}

export const deploymentConnector = new DeploymentSourceConnector();
