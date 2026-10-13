/**
 * lib/connectors/orchestrator.ts
 * 
 * COGNALYZE SOURCE RETRIEVAL ORCHESTRATOR & HISTORY LEDGER (PHASE 2)
 * 
 * Strict compliance with Sections 14, 15, 17, and 20:
 * 1. Coordinates multi-source retrieval (GitHub, LeetCode, Resume, LinkedIn, Deployments, Hackathons, Certs, Assessments).
 * 2. Strict independent source execution: A failure in one source does not wipe or impede others.
 * 3. Immutable retrieval history logging (run ID, timestamps, status, diagnostics, counts).
 * 4. Evidence deduplication across refreshes using canonical artifact identifiers.
 * 5. Safe refresh preservation: If a refresh fails, retains previous valid evidence and marks stale.
 * 6. Multi-tenant isolation: strictly scoped by authenticated studentId.
 */

import crypto from "crypto";
import {
  ConnectorRetrievalResult,
  NormalizedSourceArtifact,
  SourceRetrievalRunRecord
} from "./types";
import { githubConnector, GitHubConnectorConfig } from "./github";
import { leetcodeConnector, LeetCodeConnectorConfig } from "./leetcode";
import { deploymentConnector, DeploymentConnectorConfig } from "./deployment";
import { linkedinConnector, LinkedInConnectorConfig } from "./linkedin";
import { resumeConnector, ResumeConnectorConfig } from "./resume";
import { hackathonConnector, HackathonConnectorConfig } from "./hackathon";
import { certificationConnector, CertificationConnectorConfig } from "./certification";
import { assessmentsConnector } from "./assessments";
import { getStudentProfileByUserId } from "@/lib/auth/store";
import { DNASourceProviderType } from "@/lib/dna/contracts";

export interface UnifiedMultiSourceEvidenceBundle {
  studentId: string;
  retrievedAt: string;
  sourceRuns: SourceRetrievalRunRecord[];
  artifacts: NormalizedSourceArtifact[];
  githubResult?: ConnectorRetrievalResult;
  leetcodeResult?: ConnectorRetrievalResult;
  deploymentResult?: ConnectorRetrievalResult;
  linkedinResult?: ConnectorRetrievalResult;
  resumeResult?: ConnectorRetrievalResult;
  hackathonResult?: ConnectorRetrievalResult;
  certificationResult?: ConnectorRetrievalResult;
  assessmentsResult?: ConnectorRetrievalResult;
  overallCoverage: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
  auditHash: string;
}

// In-memory cache & historical run store keyed by studentId
const SOURCE_RUNS_STORE = new Map<string, SourceRetrievalRunRecord[]>();
const ARTIFACTS_CACHE = new Map<string, NormalizedSourceArtifact[]>();
const BUNDLE_CACHE = new Map<string, UnifiedMultiSourceEvidenceBundle>();

export function getRetrievalRunHistory(studentId: string): SourceRetrievalRunRecord[] {
  return SOURCE_RUNS_STORE.get(studentId) || [];
}

export function recordSourceRun(record: SourceRetrievalRunRecord): void {
  const current = SOURCE_RUNS_STORE.get(record.studentId) || [];
  current.unshift(record);
  if (current.length > 100) current.pop();
  SOURCE_RUNS_STORE.set(record.studentId, current);
}

export function invalidateStudentOrchestrationCache(studentId: string): void {
  BUNDLE_CACHE.delete(studentId);
}

export class SourceRetrievalOrchestrator {
  /**
   * Orchestrates multi-source retrieval for an authenticated student with failure isolation and deduplication.
   */
  public async executeMultiSourceRetrieval(
    studentId: string,
    options?: {
      forceRefresh?: boolean;
      mockConfigs?: {
        github?: GitHubConnectorConfig;
        leetcode?: LeetCodeConnectorConfig;
        deployment?: DeploymentConnectorConfig;
        linkedin?: LinkedInConnectorConfig;
        resume?: ResumeConnectorConfig;
        hackathon?: HackathonConnectorConfig;
        certification?: CertificationConnectorConfig;
      };
    }
  ): Promise<UnifiedMultiSourceEvidenceBundle> {
    if (!options?.forceRefresh && !options?.mockConfigs) {
      const cached = BUNDLE_CACHE.get(studentId);
      if (cached) return cached;
    }

    const profile = getStudentProfileByUserId(studentId);
    const now = new Date().toISOString();
    const sourceRuns: SourceRetrievalRunRecord[] = [];
    const aggregatedArtifacts: NormalizedSourceArtifact[] = [];

    // Helper to run connector safely with failure isolation
    async function executeSafeConnector<TConfig, TResult>(
      sourceType: DNASourceProviderType,
      runFn: () => Promise<ConnectorRetrievalResult<TResult>>
    ): Promise<ConnectorRetrievalResult<TResult>> {
      const startedAt = new Date().toISOString();
      const runId = `run_${sourceType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      try {
        const result = await runFn();
        const finishedAt = new Date().toISOString();

        const runRecord: SourceRetrievalRunRecord = {
          runId,
          studentId,
          sourceType,
          sourceIdentifier: result.canonicalSourceUrl || result.authorizedSourceIdentity || sourceType,
          startedAt,
          finishedAt,
          finalStatus: result.connectionStatus,
          completeness: result.completeness,
          artifactsRetrievedCount: result.artifactsCount,
          artifactsInspectedCount: result.inspectedCount,
          errorCategory: result.diagnostics?.errorCode,
          diagnosticMessage: result.diagnostics?.errorMessage || result.error,
          isStale: result.connectionStatus === "STALE",
        };

        recordSourceRun(runRecord);
        sourceRuns.push(runRecord);

        return result;
      } catch (err: any) {
        const finishedAt = new Date().toISOString();
        const failureRecord: SourceRetrievalRunRecord = {
          runId,
          studentId,
          sourceType,
          sourceIdentifier: sourceType,
          startedAt,
          finishedAt,
          finalStatus: "RETRIEVAL_FAILED",
          completeness: "NOT_ATTEMPTED",
          artifactsRetrievedCount: 0,
          artifactsInspectedCount: 0,
          errorCategory: "EXCEPTION",
          diagnosticMessage: err.message,
          isStale: false,
        };

        recordSourceRun(failureRecord);
        sourceRuns.push(failureRecord);

        return {
          sourceType,
          authenticatedStudentId: studentId,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: finishedAt,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { errorMessage: err.message },
          limitations: [`Failed to retrieve ${sourceType}: ${err.message}`],
          error: err.message,
        };
      }
    }

    // 1. Resume Connector
    const resumeConfig: ResumeConnectorConfig = options?.mockConfigs?.resume || {
      rawText: profile?.resumeUrl ? profile.resumeFileName || "" : undefined,
      fileName: profile?.resumeFileName || "resume.pdf",
    };
    const resumeRes = await executeSafeConnector("resume", () => resumeConnector.retrieve(studentId, resumeConfig));

    // 2. GitHub Connector
    const githubConfig: GitHubConnectorConfig = options?.mockConfigs?.github || {
      profileUrlOrUsername: profile?.githubUrl,
    };
    const githubRes = await executeSafeConnector("github", () => githubConnector.retrieve(studentId, githubConfig));

    // 3. LeetCode Connector
    const leetcodeConfig: LeetCodeConnectorConfig = options?.mockConfigs?.leetcode || {
      usernameOrUrl: profile?.skills?.find(s => /dsa|leetcode/i.test(s.name))?.name,
    };
    const leetcodeRes = await executeSafeConnector("leetcode", () => leetcodeConnector.retrieve(studentId, leetcodeConfig));

    // 4. Deployment Connector
    const primaryLiveProj = (profile?.projects || []).find(p => p.liveUrl);
    const deploymentConfig: DeploymentConnectorConfig = options?.mockConfigs?.deployment || {
      deploymentUrl: primaryLiveProj?.liveUrl,
      projectTitle: primaryLiveProj?.title,
      linkedRepoUrl: primaryLiveProj?.githubUrl,
    };
    const deploymentRes = await executeSafeConnector("live_deployment", () => deploymentConnector.retrieve(studentId, deploymentConfig));

    // 5. LinkedIn Connector
    const linkedinConfig: LinkedInConnectorConfig = options?.mockConfigs?.linkedin || {
      profileUrl: profile?.linkedinUrl,
    };
    const linkedinRes = await executeSafeConnector("linkedin", () => linkedinConnector.retrieve(studentId, linkedinConfig));

    // 6. Hackathons Connector
    const rawAchievements = profile?.achievements || [];
    const hackathonEntries = rawAchievements
      .filter(a => (a.title || "").toLowerCase().includes("hackathon") || (a.type || "").toLowerCase().includes("hackathon"))
      .map(a => ({
        title: a.title,
        submissionUrl: a.proofUrl,
        date: a.date,
        reportedResult: a.title.toLowerCase().includes("winner") ? ("Winner" as const) : ("Participant" as const),
      }));

    const hackathonConfig: HackathonConnectorConfig = options?.mockConfigs?.hackathon || {
      hackathons: hackathonEntries,
    };
    const hackathonRes = await executeSafeConnector("hackathon", () => hackathonConnector.retrieve(studentId, hackathonConfig));

    // 7. Certifications Connector
    const profileCerts = (profile?.certifications || []).map(c => ({
      name: c.title,
      issuer: c.issuer,
      credentialUrl: c.credentialUrl,
      source: "profile" as const,
    }));
    const certConfig: CertificationConnectorConfig = options?.mockConfigs?.certification || {
      certifications: profileCerts,
    };
    const certRes = await executeSafeConnector("certification", () => certificationConnector.retrieve(studentId, certConfig));

    // 8. Assessments Connector
    const assessmentsRes = await executeSafeConnector("internal_assessment", () => assessmentsConnector.retrieve(studentId));

    // ── DEDUPLICATION & MERGING ──
    const allRetrievedArtifacts = [
      ...resumeRes.artifacts,
      ...githubRes.artifacts,
      ...leetcodeRes.artifacts,
      ...deploymentRes.artifacts,
      ...linkedinRes.artifacts,
      ...hackathonRes.artifacts,
      ...certRes.artifacts,
      ...assessmentsRes.artifacts,
    ];

    // Deduplicate by artifactId or (sourceType + sourceIdentifier)
    const seenArtifactKeys = new Set<string>();
    for (const art of allRetrievedArtifacts) {
      const key = `${art.sourceType}::${(art.sourceIdentifier || art.name).toLowerCase()}`;
      if (!seenArtifactKeys.has(key)) {
        seenArtifactKeys.add(key);
        aggregatedArtifacts.push(art);
      }
    }

    // Preservation: If a source failed on this refresh, but had previous valid cached artifacts, retain them with STALE flag
    const previousCachedArtifacts = ARTIFACTS_CACHE.get(studentId) || [];
    if (previousCachedArtifacts.length > 0) {
      for (const prev of previousCachedArtifacts) {
        const key = `${prev.sourceType}::${(prev.sourceIdentifier || prev.name).toLowerCase()}`;
        if (!seenArtifactKeys.has(key)) {
          // Check if that source failed in current run
          const runForSource = sourceRuns.find(r => r.sourceType === prev.sourceType);
          if (runForSource && runForSource.finalStatus === "RETRIEVAL_FAILED") {
            seenArtifactKeys.add(key);
            aggregatedArtifacts.push({
              ...prev,
              metadata: {
                ...prev.metadata,
                preservedFromPreviousSuccess: true,
                isStale: true,
              }
            });
          }
        }
      }
    }

    ARTIFACTS_CACHE.set(studentId, aggregatedArtifacts);

    // Compute coverage
    const connectedSourcesCount = [
      resumeRes.connectionStatus === "CONTENT_RETRIEVED" || resumeRes.connectionStatus === "INSPECTED",
      githubRes.connectionStatus === "INSPECTED" || githubRes.connectionStatus === "CONTENT_RETRIEVED",
      leetcodeRes.connectionStatus === "CONTENT_RETRIEVED" || leetcodeRes.connectionStatus === "INSPECTED",
      deploymentRes.connectionStatus === "CONTENT_RETRIEVED" || deploymentRes.connectionStatus === "INSPECTED",
      linkedinRes.connectionStatus === "CONTENT_RETRIEVED" || linkedinRes.connectionStatus === "INSPECTED",
      hackathonRes.artifactsCount > 0,
      certRes.artifactsCount > 0,
      assessmentsRes.artifactsCount > 0,
    ].filter(Boolean).length;

    const overallCoverage: UnifiedMultiSourceEvidenceBundle["overallCoverage"] =
      connectedSourcesCount >= 4 ? "HIGH" : connectedSourcesCount >= 2 ? "MEDIUM" : connectedSourcesCount >= 1 ? "LOW" : "INSUFFICIENT";

    // Deterministic audit hash
    const canonicalStr = sourceRuns
      .slice()
      .sort((a, b) => a.runId.localeCompare(b.runId))
      .map(r => `${r.runId}|${r.sourceType}|${r.finalStatus}|${r.artifactsRetrievedCount}`)
      .join("::");

    const auditHash = crypto.createHash("sha256").update(canonicalStr).digest("hex").slice(0, 16);

    const bundle: UnifiedMultiSourceEvidenceBundle = {
      studentId,
      retrievedAt: now,
      sourceRuns,
      artifacts: aggregatedArtifacts,
      githubResult: githubRes,
      leetcodeResult: leetcodeRes,
      deploymentResult: deploymentRes,
      linkedinResult: linkedinRes,
      resumeResult: resumeRes,
      hackathonResult: hackathonRes,
      certificationResult: certRes,
      assessmentsResult: assessmentsRes,
      overallCoverage,
      auditHash,
    };

    BUNDLE_CACHE.set(studentId, bundle);
    return bundle;
  }
}

export const sourceRetrievalOrchestrator = new SourceRetrievalOrchestrator();
