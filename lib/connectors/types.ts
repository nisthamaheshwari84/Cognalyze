/**
 * lib/connectors/types.ts
 * 
 * COGNALYZE SOURCE INTEGRATION CONNECTOR CONTRACTS (PHASE 2)
 * 
 * Formal interface contracts for all external and internal source connectors:
 * - Resume (PDF / DOCX text extraction & claim parsing)
 * - GitHub (Account resolution, repository retrieval & safe content inspection)
 * - LinkedIn (Supported authorized OAuth / API integration only; no unauthorized scraping)
 * - LeetCode (Real profile statistics via public GraphQL/REST; zero vs failure differentiation)
 * - Live Deployment (SSRF-protected, safe non-destructive HTTP probe)
 * - Hackathons (Submission and event corroboration)
 * - Certifications (Credential URL check and issuer verification where supported)
 * - Cognalyze Internal Assessments (Direct session and evaluation history)
 */

import { DNASourceConnectionStatus, DNAClaimStatus, DNASourceProviderType } from "@/lib/dna/contracts";

export type InspectionCompleteness = "COMPLETE" | "PARTIAL" | "NOT_ATTEMPTED";

export interface ConnectorDiagnosticInfo {
  httpStatus?: number;
  rateLimitRemaining?: number;
  rateLimitReset?: string;
  errorCode?: string;
  errorMessage?: string;
  safeDetails?: string;
}

export interface NormalizedSourceArtifact {
  artifactId: string;
  sourceType: DNASourceProviderType;
  sourceIdentifier: string; // URL, canonical handle, repo full name, or document ID
  name: string;
  title: string;
  description?: string;
  rawUrl?: string;
  retrievedAt: string;
  inspectedAt?: string;
  contentHash?: string;
  isFork?: boolean;
  primaryLanguage?: string;
  languagesObserved: string[];
  manifestsFound: string[];
  testFilesFound: string[];
  ciConfigured: boolean;
  snippets: Array<{
    filePath?: string;
    section?: string;
    lineRange?: string;
    excerpt: string;
  }>;
  metadata?: Record<string, any>;
}

export interface ConnectorRetrievalResult<T = any> {
  sourceType: DNASourceProviderType;
  authenticatedStudentId: string;
  authorizedSourceIdentity?: string; // Resolved handle or account ID
  canonicalSourceUrl?: string;
  connectionStatus: DNASourceConnectionStatus;
  inspectionStatus: "INSPECTED" | "PARTIALLY_INSPECTED" | "INSPECTION_PENDING" | "UNAVAILABLE";
  completeness: InspectionCompleteness;
  retrievedAt: string;
  inspectedAt?: string;
  artifacts: NormalizedSourceArtifact[];
  artifactsCount: number;
  inspectedCount: number;
  data?: T;
  diagnostics?: ConnectorDiagnosticInfo;
  limitations: string[];
  error?: string;
}

export interface SourceRetrievalRunRecord {
  runId: string;
  studentId: string;
  sourceType: DNASourceProviderType;
  sourceIdentifier: string;
  startedAt: string;
  finishedAt: string;
  finalStatus: DNASourceConnectionStatus;
  completeness: InspectionCompleteness;
  artifactsRetrievedCount: number;
  artifactsInspectedCount: number;
  errorCategory?: string;
  diagnosticMessage?: string;
  isStale: boolean;
}

export interface BaseSourceConnector<TConfig = any, TOutput = any> {
  readonly sourceType: DNASourceProviderType;
  retrieve(
    studentId: string,
    config: TConfig,
    options?: { forceRefresh?: boolean; dryRun?: boolean }
  ): Promise<ConnectorRetrievalResult<TOutput>>;
}
