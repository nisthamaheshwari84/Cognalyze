/**
 * COGNALYZE — EXTERNAL SOURCE DISCOVERY & VERIFICATION ENGINE
 * 
 * Inspects external URLs discovered in candidate submissions:
 * - GitHub (repos, file tree, dependencies, source code, commits)
 * - LinkedIn (education, roles, tenure, contradiction checks)
 * - LeetCode (solved counts, difficulty distribution, contest rating)
 * - Live Deployments (availability, observable signals)
 * 
 * INVARIANT: If a source cannot be accessed:
 * DO NOT GUESS. DO NOT FABRICATE.
 * State: INACCESSIBLE.
 */

import crypto from "crypto";
import { URL } from "url";
import {
  DiscoveredSourceRecord,
  EvidenceLedger,
  EvidenceRecord,
  VerificationCheck,
} from "./evidence-ledger";
import { detectEducationStatus } from "./non-equivalence";

export type SourceAccessStatus =
  | 'ACCESSIBLE'
  | 'PARTIALLY_ACCESSIBLE'
  | 'INACCESSIBLE'
  | 'INVALID_URL'
  | 'AUTHENTICATION_REQUIRED'
  | 'RATE_LIMITED'
  | 'SOURCE_NOT_FOUND'
  | 'INSPECTION_FAILED'
  | 'NOT_PROVIDED';

export type OwnershipStatus =
  | 'CONFIRMED_AUTHOR'
  | 'CONTRIBUTOR'
  | 'FORK_OR_COLLABORATOR'
  | 'NOT_INDEPENDENTLY_ESTABLISHED'
  | 'NO_AUTHORSHIP_SIGNAL';

export interface RepoInspectionResult {
  accessible: boolean;
  accessStatus?: SourceAccessStatus;
  repoName: string;
  owner: string;
  description: string;
  hasReadme: boolean;
  readmeText: string;
  readmeTechnologiesMentioned?: string[];
  verificationStatus?: 'VERIFIED' | 'INACCESSIBLE' | 'NOT_VERIFIED' | 'FAILED_SECURITY_CHECK';
  ownershipStatus?: OwnershipStatus;
  sourceHash?: string;
  dependenciesFound: string[];
  sourceTechnologiesFound: string[];
  astSignalsFound?: Record<string, string[]>;
  checks: VerificationCheck[];
  limitations?: string[];
  error?: string;
}

/**
 * Validates an external URL against SSRF and private network access boundaries.
 */
export function validateExternalUrl(rawUrl: string): {
  isValid: boolean;
  sanitizedUrl?: string;
  accessStatus: SourceAccessStatus;
  reason?: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, accessStatus: 'INVALID_URL', reason: 'URL string is empty or missing.' };
  }

  const trimmed = rawUrl.trim();

  // Reject non-http(s) schemes immediately if an explicit protocol is present
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return {
      isValid: false,
      accessStatus: 'INVALID_URL',
      reason: `Disallowed protocol scheme. Only HTTP and HTTPS are permitted.`,
    };
  }

  let parsed: URL;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return { isValid: false, accessStatus: 'INVALID_URL', reason: 'Malformed URL format.' };
  }

  // Reject non-http(s) schemes
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      accessStatus: 'INVALID_URL',
      reason: `Disallowed protocol scheme: ${parsed.protocol}. Only HTTP and HTTPS are permitted.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // SSRF & Loopback / Private IP Guards
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return {
      isValid: false,
      accessStatus: 'INVALID_URL',
      reason: 'Access to loopback, localhost, and local internal domain names is strictly prohibited (SSRF guard).',
    };
  }

  // Cloud metadata service (169.254.169.254 / metadata.google.internal)
  if (hostname === '169.254.169.254' || hostname.includes('metadata.google') || hostname.includes('169.254.')) {
    return {
      isValid: false,
      accessStatus: 'INVALID_URL',
      reason: 'Access to cloud instance metadata services is strictly prohibited (SSRF guard).',
    };
  }

  // Private IP CIDR ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const p1 = parseInt(ipv4Match[1], 10);
    const p2 = parseInt(ipv4Match[2], 10);
    if (
      p1 === 10 ||
      (p1 === 172 && p2 >= 16 && p2 <= 31) ||
      (p1 === 192 && p2 === 168) ||
      p1 === 127 ||
      p1 === 0
    ) {
      return {
        isValid: false,
        accessStatus: 'INVALID_URL',
        reason: 'Access to private internal RFC-1918 IPv4 ranges is prohibited (SSRF guard).',
      };
    }
  }

  return { isValid: true, sanitizedUrl: parsed.href, accessStatus: 'ACCESSIBLE' };
}

export interface LinkedInInspectionResult {
  accessible: boolean;
  profileFound?: boolean;
  profileName?: string;
  headline?: string;
  experience?: any[];
  educationStatus?: "CURRENTLY_PURSUING" | "GRADUATED" | "UNKNOWN";
  education?: Array<{ degree?: string; dates?: string; institution?: string; school?: string }>;
  rolesDocumented?: string[];
  skillsListed?: string[];
  skills?: string[];
  checks: VerificationCheck[];
  error?: string;
}

export interface LeetCodeInspectionResult {
  accessible: boolean;
  username?: string;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  contestRating?: number;
  checks: VerificationCheck[];
  error?: string;
}

export interface DeploymentInspectionResult {
  accessible: boolean;
  url: string;
  httpStatus?: number;
  observableTitle?: string;
  isFunctional: boolean;
  checks: VerificationCheck[];
  error?: string;
}

/**
 * Discovers public URLs from raw resume text.
 */
export function discoverExternalUrls(resumeText: string): {
  githubUrls: string[];
  linkedinUrls: string[];
  leetcodeUrls: string[];
  deploymentUrls: string[];
  otherUrls: string[];
} {
  const githubUrls: string[] = [];
  const linkedinUrls: string[] = [];
  const leetcodeUrls: string[] = [];
  const deploymentUrls: string[] = [];
  const otherUrls: string[] = [];

  // Match URLs in text
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9/._~-]{2,})/gi;
  const matches = resumeText.match(urlRegex) || [];

  for (const raw of matches) {
    const clean = raw.trim().replace(/[.,;)]+$/, "");
    const lower = clean.toLowerCase();

    if (lower.includes("github.com/")) {
      if (!githubUrls.includes(clean)) githubUrls.push(clean);
    } else if (lower.includes("linkedin.com/in/")) {
      if (!linkedinUrls.includes(clean)) linkedinUrls.push(clean);
    } else if (lower.includes("leetcode.com/")) {
      if (!leetcodeUrls.includes(clean)) leetcodeUrls.push(clean);
    } else if (
      lower.includes(".vercel.app") ||
      lower.includes(".netlify.app") ||
      lower.includes(".onrender.com") ||
      lower.includes(".railway.app") ||
      lower.includes(".fly.dev")
    ) {
      if (!deploymentUrls.includes(clean)) deploymentUrls.push(clean);
    } else if (
      lower.includes("gitlab.com") ||
      lower.includes("kaggle.com") ||
      lower.includes("huggingface.co") ||
      lower.includes("npmjs.com") ||
      lower.includes("pypi.org")
    ) {
      if (!otherUrls.includes(clean)) otherUrls.push(clean);
    }
  }

  return { githubUrls, linkedinUrls, leetcodeUrls, deploymentUrls, otherUrls };
}

/**
 * Inspects file contents and README to detect dependencies, AST signals, and README-only mentions.
 */
export function inspectCodePatterns(files: Record<string, string>, readmeText: string): {
  dependenciesFound: string[];
  sourceTechnologiesFound: string[];
  readmeTechnologiesMentioned: string[];
  astSignalsFound: Record<string, string[]>;
  limitations: string[];
  sourceHash: string;
} {
  const dependenciesFound: string[] = [];
  const sourceTechnologiesFound: string[] = [];
  const readmeTechnologiesMentioned: string[] = [];
  const astSignalsFound: Record<string, string[]> = {
    python: [],
    react: [],
    backend_api: [],
    rag: [],
    devops_cloud: [],
    kubernetes: [],
  };
  const limitations: string[] = [];

  const hash = crypto.createHash('sha256');
  hash.update(readmeText || '');

  for (const [filename, content] of Object.entries(files)) {
    hash.update(`${filename}:${content}`);
    const lowerContent = content.toLowerCase();
    const lowerFile = filename.toLowerCase();

    // 1. Python Inspection
    if (lowerFile.endsWith('.py')) {
      if (!sourceTechnologiesFound.includes('python')) sourceTechnologiesFound.push('python');
      if (/\bclass\s+\w+/i.test(content)) astSignalsFound.python.push('class_definitions');
      if (/\basync\s+def\s+\w+/i.test(content)) astSignalsFound.python.push('async_def_concurrency');
      if (/\b(?:from\s+typing\s+import|def\s+\w+\([^)]*\)\s*->)/i.test(content)) astSignalsFound.python.push('type_annotations');
      if (/\b(?:import\s+pytest|def\s+test_)/i.test(content)) astSignalsFound.python.push('pytest_automated_testing');

      // Frameworks in Python
      if (lowerContent.includes('from fastapi') || lowerContent.includes('import fastapi') || lowerContent.includes('fastapi()')) {
        if (!sourceTechnologiesFound.includes('fastapi')) sourceTechnologiesFound.push('fastapi');
        astSignalsFound.backend_api.push('fastapi_app_initialization');
      }
      if (lowerContent.includes('from flask') || lowerContent.includes('import flask')) {
        if (!sourceTechnologiesFound.includes('flask')) sourceTechnologiesFound.push('flask');
      }
      if (lowerContent.includes('from django') || lowerContent.includes('import django')) {
        if (!sourceTechnologiesFound.includes('django')) sourceTechnologiesFound.push('django');
      }

      // API Endpoints in Python
      if (/@(?:app|router)\.(get|post|put|delete|patch)\b/i.test(content)) {
        if (!sourceTechnologiesFound.includes('rest_api')) sourceTechnologiesFound.push('rest_api');
        astSignalsFound.backend_api.push('http_method_route_handlers');
      }
      if (/\bclass\s+\w+\s*\(\s*BaseModel\s*\)/i.test(content)) {
        astSignalsFound.backend_api.push('pydantic_schema_validation');
      }

      // RAG in Python
      const hasVectorDb = /\b(pinecone|qdrant|chroma|chromadb|pgvector|faiss|weaviate)\b/i.test(content);
      const hasEmbeddings = /\b(embeddings|sentence_transformers|text-embedding-|openai\.embeddings)\b/i.test(content);
      const hasChunking = /\b(charactertextsplitter|recursivecharactertextsplitter|chunk_size|token_splitter)\b/i.test(content);
      const hasRetrieval = /\b(similarity_search|as_retriever|retriever\.get_relevant_documents)\b|\.query\s*\(/i.test(content);

      if (hasVectorDb || hasEmbeddings || hasChunking || hasRetrieval) {
        if (!sourceTechnologiesFound.includes('rag')) sourceTechnologiesFound.push('rag');
        if (hasVectorDb) astSignalsFound.rag.push('vector_database_integration');
        if (hasEmbeddings) astSignalsFound.rag.push('semantic_embeddings');
        if (hasChunking) astSignalsFound.rag.push('document_chunking');
        if (hasRetrieval) astSignalsFound.rag.push('vector_retrieval_query');
      }
    }

    // 2. Python Dependencies
    if (lowerFile === 'requirements.txt' || lowerFile === 'pyproject.toml' || lowerFile === 'pipfile') {
      if (lowerContent.includes('fastapi')) dependenciesFound.push('fastapi');
      if (lowerContent.includes('flask')) dependenciesFound.push('flask');
      if (lowerContent.includes('django')) dependenciesFound.push('django');
      if (lowerContent.includes('psycopg2') || lowerContent.includes('asyncpg') || lowerContent.includes('sqlalchemy')) {
        dependenciesFound.push('postgresql');
      }
      if (lowerContent.includes('pinecone') || lowerContent.includes('chromadb') || lowerContent.includes('qdrant-client')) {
        dependenciesFound.push('rag');
      }
      if (lowerContent.includes('torch') || lowerContent.includes('pytorch')) dependenciesFound.push('pytorch');
      if (lowerContent.includes('pandas')) dependenciesFound.push('pandas');
      if (lowerContent.includes('pydantic')) dependenciesFound.push('pydantic');
      if (lowerContent.includes('pytest')) dependenciesFound.push('pytest');
    }

    // 3. React / Next.js / TypeScript
    if (lowerFile.endsWith('.tsx') || lowerFile.endsWith('.jsx') || lowerFile.endsWith('.ts') || lowerFile.endsWith('.js')) {
      if (lowerFile.endsWith('.tsx') || lowerFile.endsWith('.ts')) {
        if (!sourceTechnologiesFound.includes('typescript')) sourceTechnologiesFound.push('typescript');
        astSignalsFound.react.push('typescript_interfaces_and_types');
      }
      if (lowerContent.includes('react') || lowerFile.endsWith('.tsx') || lowerFile.endsWith('.jsx')) {
        if (!sourceTechnologiesFound.includes('react')) sourceTechnologiesFound.push('react');
        if (/\b(?:useState|useEffect|useCallback|useMemo)\b/.test(content)) {
          astSignalsFound.react.push('standard_react_hooks');
        }
        if (/\bfunction\s+use[A-Z]\w+|\bconst\s+use[A-Z]\w+\s*=/i.test(content)) {
          astSignalsFound.react.push('custom_react_hooks');
        }
      }
      if (lowerContent.includes('next/navigation') || lowerContent.includes('next/router') || lowerFile.includes('app/') || lowerFile.includes('pages/')) {
        if (!sourceTechnologiesFound.includes('nextjs')) sourceTechnologiesFound.push('nextjs');
        if (!sourceTechnologiesFound.includes('next.js')) sourceTechnologiesFound.push('next.js');
        if (lowerContent.includes("'use client'") || lowerContent.includes('"use client"')) {
          astSignalsFound.react.push('nextjs_client_component');
        }
        if (lowerContent.includes("'use server'") || lowerContent.includes('"use server"')) {
          astSignalsFound.react.push('nextjs_server_action');
        }
      }
    }

    // 4. JS/TS package.json
    if (lowerFile === 'package.json') {
      if (lowerContent.includes('"react"')) dependenciesFound.push('react');
      if (lowerContent.includes('"next"')) {
        dependenciesFound.push('nextjs');
        dependenciesFound.push('next.js');
      }
      if (lowerContent.includes('"typescript"')) dependenciesFound.push('typescript');
      if (lowerContent.includes('"tailwindcss"')) dependenciesFound.push('tailwind');
      if (lowerContent.includes('"zod"')) dependenciesFound.push('zod');
    }

    // 5. Docker & Containerization
    if (lowerFile === 'dockerfile' || lowerFile.includes('docker-compose')) {
      if (!sourceTechnologiesFound.includes('docker')) sourceTechnologiesFound.push('docker');
      if (/\bFROM\s+[^\s]+\s+AS\s+[^\s]+/i.test(content)) {
        astSignalsFound.devops_cloud.push('docker_multistage_build');
      }
    }

    // 6. Kubernetes
    if ((lowerFile.endsWith('.yaml') || lowerFile.endsWith('.yml')) && !lowerFile.includes('.github/')) {
      if (lowerContent.includes('kind: deployment') || lowerContent.includes('kind: service') || lowerContent.includes('kind: ingress')) {
        if (!sourceTechnologiesFound.includes('kubernetes')) sourceTechnologiesFound.push('kubernetes');
        if (lowerContent.includes('kind: deployment')) astSignalsFound.kubernetes.push('k8s_deployment_manifest');
        if (lowerContent.includes('kind: service')) astSignalsFound.kubernetes.push('k8s_service_manifest');
        if (lowerContent.includes('kind: ingress')) astSignalsFound.kubernetes.push('k8s_ingress_manifest');
      }
    }

    // 7. Terraform & Cloud
    if (lowerFile.endsWith('.tf')) {
      if (!sourceTechnologiesFound.includes('terraform')) sourceTechnologiesFound.push('terraform');
      if (lowerContent.includes('provider "aws"') || lowerContent.includes('resource "aws_')) {
        if (!sourceTechnologiesFound.includes('aws')) sourceTechnologiesFound.push('aws');
        astSignalsFound.devops_cloud.push('aws_terraform_infrastructure');
      }
    }
  }

  // 8. README Mention vs Source Code Implementation Check
  const keyTechsToCheck = ['kubernetes', 'docker', 'fastapi', 'react', 'nextjs', 'next.js', 'rag', 'aws', 'postgresql', 'python', 'typescript'];
  const lowerReadme = (readmeText || '').toLowerCase();

  for (const tech of keyTechsToCheck) {
    if (lowerReadme.includes(tech)) {
      if (!readmeTechnologiesMentioned.includes(tech)) readmeTechnologiesMentioned.push(tech);
      const inDeps = dependenciesFound.includes(tech);
      const inCode = sourceTechnologiesFound.includes(tech);

      if (!inDeps && !inCode) {
        const displayTech = tech === 'kubernetes' ? 'Kubernetes' : tech.charAt(0).toUpperCase() + tech.slice(1);
        limitations.push(
          `Technology "${displayTech}" is mentioned in repository README, but no corresponding implementation was found in source files or dependencies.`
        );
      }
    }
  }

  return {
    dependenciesFound: Array.from(new Set(dependenciesFound)),
    sourceTechnologiesFound: Array.from(new Set(sourceTechnologiesFound)),
    readmeTechnologiesMentioned,
    astSignalsFound,
    limitations,
    sourceHash: hash.digest('hex'),
  };
}

/**
 * Real GitHub Repository Inspector
 * Inspects repository files, dependencies, and actual implementation.
 * 
 * Technology-by-technology audit:
 * README mentioning technology X != technology X actually implemented!
 */
export async function inspectGithubRepository(
  urlOrOwnerRepo: string,
  claimedTechnologies: string[] = [],
  mockPayload?: {
    accessible: boolean;
    readmeText?: string;
    files?: Record<string, string>; // filename -> content
  },
  candidateHandle?: string
): Promise<RepoInspectionResult> {
  const checks: VerificationCheck[] = [];

  // SSRF & Security Validation on raw URL input
  if (urlOrOwnerRepo.startsWith('http://') || urlOrOwnerRepo.startsWith('https://')) {
    const urlValidation = validateExternalUrl(urlOrOwnerRepo);
    if (!urlValidation.isValid) {
      checks.push({
        check: 'SSRF & URL Security Validation',
        result: 'FAILED',
        detail: urlValidation.reason || 'Invalid URL',
      });
      return {
        accessible: false,
        accessStatus: urlValidation.accessStatus,
        verificationStatus: 'FAILED_SECURITY_CHECK',
        repoName: urlOrOwnerRepo,
        owner: '',
        description: '',
        hasReadme: false,
        readmeText: '',
        readmeTechnologiesMentioned: [],
        dependenciesFound: [],
        sourceTechnologiesFound: [],
        astSignalsFound: {},
        ownershipStatus: 'NO_AUTHORSHIP_SIGNAL',
        checks,
        limitations: [urlValidation.reason || 'Disallowed by SSRF protection.'],
        error: urlValidation.reason,
      };
    }
  }

  // Extract owner/repo
  const cleanUrl = urlOrOwnerRepo.replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '');
  const parts = cleanUrl.split('/');
  const owner = parts[0] || '';
  const repoName = parts[1] || '';

  if (!owner || !repoName) {
    return {
      accessible: false,
      accessStatus: 'INVALID_URL',
      verificationStatus: 'INACCESSIBLE',
      repoName: cleanUrl,
      owner: '',
      description: '',
      hasReadme: false,
      readmeText: '',
      dependenciesFound: [],
      sourceTechnologiesFound: [],
      checks: [{ check: 'GitHub URL Format', result: 'FAILED', detail: 'Invalid GitHub repository path' }],
      error: 'Invalid repository format',
    };
  }

  // If mock payload provided (e.g. for deterministic anti-hallucination unit testing)
  if (mockPayload) {
    if (!mockPayload.accessible) {
      checks.push({ check: 'Repository accessible', result: 'FAILED', detail: 'HTTP 404 or network inaccessible' });
      return {
        accessible: false,
        accessStatus: 'INACCESSIBLE',
        verificationStatus: 'INACCESSIBLE',
        repoName,
        owner,
        description: '',
        hasReadme: false,
        readmeText: '',
        dependenciesFound: [],
        sourceTechnologiesFound: [],
        ownershipStatus: 'NO_AUTHORSHIP_SIGNAL',
        checks,
        error: 'Repository could not be accessed.',
      };
    }

    checks.push({ check: 'Repository accessible', result: 'PASSED', detail: 'Repository confirmed accessible' });
    checks.push({ check: 'Repository identified', result: 'PASSED', detail: `${owner}/${repoName}` });

    const readme = mockPayload.readmeText || '';
    const hasReadme = readme.length > 0;
    checks.push({ check: 'README inspected', result: hasReadme ? 'PASSED' : 'FAILED' });

    const files = mockPayload.files || {};
    const codePatterns = inspectCodePatterns(files, readme);

    // Technology-by-technology evaluation
    for (const tech of claimedTechnologies) {
      const normTech = tech.toLowerCase();
      const inDeps = codePatterns.dependenciesFound.includes(normTech);
      const inSource = codePatterns.sourceTechnologiesFound.includes(normTech);
      const inReadmeOnly = codePatterns.readmeTechnologiesMentioned.includes(normTech) && !inDeps && !inSource;

      if (inDeps || inSource) {
        checks.push({
          check: `Technology check: ${tech}`,
          result: 'PASSED',
          detail: inSource ? 'Source code implementation verified' : 'Declared in package dependencies',
        });
      } else if (inReadmeOnly) {
        checks.push({
          check: `Technology check: ${tech}`,
          result: 'FAILED',
          detail: `${tech} mentioned in README only without source implementation`,
        });
      } else {
        checks.push({
          check: `Technology check: ${tech}`,
          result: 'FAILED',
          detail: `${tech} dependency or source implementation NOT found in repository`,
        });
      }
    }

    const ownershipStatus: OwnershipStatus =
      candidateHandle && owner.toLowerCase() === candidateHandle.toLowerCase()
        ? 'CONFIRMED_AUTHOR'
        : 'NOT_INDEPENDENTLY_ESTABLISHED';

    return {
      accessible: true,
      accessStatus: 'ACCESSIBLE',
      verificationStatus: codePatterns.sourceTechnologiesFound.length > 0 ? 'VERIFIED' : 'NOT_VERIFIED',
      repoName,
      owner,
      description: 'Inspected repository artifact',
      hasReadme,
      readmeText: readme,
      readmeTechnologiesMentioned: codePatterns.readmeTechnologiesMentioned,
      dependenciesFound: codePatterns.dependenciesFound,
      sourceTechnologiesFound: codePatterns.sourceTechnologiesFound,
      astSignalsFound: codePatterns.astSignalsFound,
      ownershipStatus,
      sourceHash: codePatterns.sourceHash,
      limitations: codePatterns.limitations,
      checks,
    };
  }

  // Real fetch via GitHub API (if network / token available)
  const ghToken = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    ...(ghToken ? { Authorization: `Bearer ${ghToken}` } : {}),
  };

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (repoRes.status === 404 || !repoRes.ok) {
      checks.push({
        check: "Repository accessible",
        result: "FAILED",
        detail: `GitHub returned status ${repoRes.status} (Inaccessible or private)`,
      });
      return {
        accessible: false,
        verificationStatus: 'INACCESSIBLE',
        repoName,
        owner,
        description: "",
        hasReadme: false,
        readmeText: "",
        dependenciesFound: [],
        sourceTechnologiesFound: [],
        checks,
        error: "Repository is inaccessible or does not exist.",
      };
    }

    const repoJson = await repoRes.json();
    checks.push({ check: "Repository accessible", result: "PASSED", detail: "Repository confirmed accessible" });
    checks.push({ check: "Repository identified", result: "PASSED", detail: repoJson.full_name });

    // Fetch README
    let readmeText = "";
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/readme`, {
        headers,
        signal: AbortSignal.timeout(4000),
      });
      if (readmeRes.ok) {
        const readmeJson = await readmeRes.json();
        if (readmeJson.content) {
          readmeText = Buffer.from(readmeJson.content, "base64").toString("utf-8");
          checks.push({ check: "README inspected", result: "PASSED", detail: `${readmeText.length} bytes inspected` });
        }
      } else {
        checks.push({ check: "README inspected", result: "FAILED", detail: "No README found" });
      }
    } catch {
      checks.push({ check: "README inspected", result: "FAILED", detail: "Could not fetch README" });
    }

    // Inspect repository file tree (root level)
    const dependenciesFound: string[] = [];
    const sourceTechnologiesFound: string[] = [];

    try {
      const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents`, {
        headers,
        signal: AbortSignal.timeout(4000),
      });

      if (contentsRes.ok) {
        const contents = await contentsRes.json();
        if (Array.isArray(contents)) {
          checks.push({ check: "Source files inspected", result: "PASSED", detail: `${contents.length} root items` });

          // Check for Dockerfile
          if (contents.some((c) => c.name.toLowerCase().includes("dockerfile"))) {
            sourceTechnologiesFound.push("docker");
          }

          // Check requirements.txt
          const reqFile = contents.find((c) => c.name.toLowerCase() === "requirements.txt");
          if (reqFile && reqFile.download_url) {
            const rawReq = await (await fetch(reqFile.download_url, { signal: AbortSignal.timeout(3000) })).text();
            if (rawReq.toLowerCase().includes("fastapi")) dependenciesFound.push("fastapi");
            if (rawReq.toLowerCase().includes("flask")) dependenciesFound.push("flask");
            if (rawReq.toLowerCase().includes("django")) dependenciesFound.push("django");
            if (rawReq.toLowerCase().includes("postgres") || rawReq.toLowerCase().includes("psycopg")) {
              dependenciesFound.push("postgresql");
            }
          }

          // Check package.json
          const pkgFile = contents.find((c) => c.name.toLowerCase() === "package.json");
          if (pkgFile && pkgFile.download_url) {
            const rawPkg = await (await fetch(pkgFile.download_url, { signal: AbortSignal.timeout(3000) })).text();
            if (rawPkg.includes('"react"')) dependenciesFound.push("react");
            if (rawPkg.includes('"next"')) dependenciesFound.push("nextjs");
          }
        }
      }
    } catch (e: any) {
      checks.push({ check: "Source files inspected", result: "FAILED", detail: e.message || "Timeout" });
    }

    // If primary language is Python
    if (repoJson.language?.toLowerCase() === "python") {
      sourceTechnologiesFound.push("python");
    }

    // Technology-by-technology check
    for (const tech of claimedTechnologies) {
      const normTech = tech.toLowerCase();
      const inDeps = dependenciesFound.includes(normTech);
      const inSource = sourceTechnologiesFound.includes(normTech);

      if (inDeps || inSource) {
        checks.push({
          check: `Technology check: ${tech}`,
          result: "PASSED",
          detail: inSource ? "Source implementation confirmed" : "Dependency manifest confirmed",
        });
      } else {
        checks.push({
          check: `Technology check: ${tech}`,
          result: "FAILED",
          detail: `${tech} implementation not found in repository manifests or source files`,
        });
      }
    }

    return {
      accessible: true,
      verificationStatus: sourceTechnologiesFound.length > 0 ? 'VERIFIED' : 'NOT_VERIFIED',
      repoName,
      owner,
      description: repoJson.description || "",
      hasReadme: readmeText.length > 0,
      readmeText,
      dependenciesFound,
      sourceTechnologiesFound,
      checks,
    };
  } catch (err: any) {
    checks.push({
      check: "Repository accessible",
      result: "FAILED",
      detail: `Connection error: ${err.message || "Network unreachable"}`,
    });
    return {
      accessible: false,
      verificationStatus: 'INACCESSIBLE',
      repoName,
      owner,
      description: "",
      hasReadme: false,
      readmeText: "",
      dependenciesFound: [],
      sourceTechnologiesFound: [],
      checks,
      error: "External repository could not be inspected.",
    };
  }
}

/**
 * Cross-checks resume against external sources and builds verified Evidence Ledger entries.
 */
export function crossCheckSources(params: {
  ledger: EvidenceLedger;
  resumeText: string;
  githubInspection?: RepoInspectionResult;
  linkedinInspection?: LinkedInInspectionResult;
  leetcodeInspection?: LeetCodeInspectionResult;
  deploymentInspection?: DeploymentInspectionResult;
}) {
  const { ledger, resumeText, githubInspection, linkedinInspection, leetcodeInspection, deploymentInspection } = params;

  // 1. Cross-check Education Status (Contradiction Detection)
  const resumeEduStatus = detectEducationStatus(resumeText);
  let liEduStatus = linkedinInspection?.educationStatus;
  if (!liEduStatus && linkedinInspection?.education && linkedinInspection.education.length > 0) {
    const liText = linkedinInspection.education.map((e) => `${e.degree || ''} ${e.dates || ''}`).join(' ');
    liEduStatus = detectEducationStatus(liText);
  }

  if (linkedinInspection?.accessible && liEduStatus) {
    const isContradiction =
      (resumeEduStatus === "CURRENTLY_PURSUING" && liEduStatus === "GRADUATED") ||
      (resumeEduStatus === "GRADUATED" && liEduStatus === "CURRENTLY_PURSUING");

    if (isContradiction) {
      ledger.addEvidence({
        source_type: "linkedin",
        source_url: "LinkedIn Profile",
        source_document: "linkedin_profile",
        section: "Education Status",
        original_text: `Resume: "${resumeEduStatus}", LinkedIn: "${liEduStatus}"`,
        observed_fact: `Contradiction detected: Resume claims ${resumeEduStatus} while LinkedIn profile indicates ${liEduStatus}.`,
        evidence_type: "profile_stats",
        verification_status: "CONTRADICTED",
        supports: [],
        does_not_prove: ["graduated", "pursuing"],
        checks_performed: [
          {
            check: "Education status consistency",
            result: "FAILED",
            detail: `Conflicting education statuses found across Resume (${resumeEduStatus}) and LinkedIn (${linkedinInspection.educationStatus})`,
          },
        ],
      });
    }
  }

  // 2. Cross-check GitHub Repository Evidence
  if (githubInspection) {
    if (!githubInspection.accessible) {
      ledger.addEvidence({
        source_type: "github",
        source_document: "github_repo",
        section: "External Repository",
        original_text: `GitHub repository ${githubInspection.owner}/${githubInspection.repoName}`,
        observed_fact: "External GitHub repository could not be accessed or verified.",
        evidence_type: "external_signal",
        verification_status: "INACCESSIBLE",
        supports: [],
        does_not_prove: ["implementation"],
        checks_performed: githubInspection.checks,
      });
    } else {
      // Bounded ownership wording
      const boundedOwnership = `Repository is associated with the candidate-provided GitHub account (${githubInspection.owner}).`;

      // Record verified technologies
      for (const tech of githubInspection.sourceTechnologiesFound) {
        ledger.addEvidence({
          source_type: "github",
          source_url: `https://github.com/${githubInspection.owner}/${githubInspection.repoName}`,
          source_document: "github_repo",
          section: "Source Code Implementation",
          original_text: `Verified source files found for ${tech} in ${githubInspection.owner}/${githubInspection.repoName}`,
          observed_fact: `Actual ${tech} code verified in repository. ${boundedOwnership}`,
          evidence_type: "repo_source",
          verification_status: "EXTERNALLY_VERIFIED",
          supports: [tech],
          does_not_prove: [`production_${tech}`, `exclusive_authorship`],
          checks_performed: githubInspection.checks.filter((c) => c.check.includes(tech) || c.check.includes("accessible")),
        });
      }

      // Record manifest dependencies
      for (const dep of githubInspection.dependenciesFound) {
        if (!githubInspection.sourceTechnologiesFound.includes(dep)) {
          ledger.addEvidence({
            source_type: "github",
            source_url: `https://github.com/${githubInspection.owner}/${githubInspection.repoName}`,
            source_document: "github_repo",
            section: "Dependency Manifest",
            original_text: `Declared dependency "${dep}" in package configuration`,
            observed_fact: `${dep} configuration found in dependencies. Source implementation not directly confirmed.`,
            evidence_type: "dependency_manifest",
            verification_status: "EXTERNALLY_FOUND",
            supports: [dep],
            does_not_prove: [`production_${dep}`, `advanced_${dep}`],
            checks_performed: githubInspection.checks.filter((c) => c.check.includes(dep) || c.check.includes("accessible")),
          });
        }
      }
    }
  }

  // 3. Cross-check LeetCode Evidence
  if (leetcodeInspection) {
    if (!leetcodeInspection.accessible) {
      ledger.addEvidence({
        source_type: "leetcode",
        source_document: "leetcode_profile",
        section: "Algorithmic Problem Solving",
        original_text: "LeetCode profile link",
        observed_fact: "Public LeetCode profile could not be verified from submitted materials.",
        evidence_type: "profile_stats",
        verification_status: "INACCESSIBLE",
        supports: [],
        does_not_prove: ["dsa_mastery"],
        checks_performed: leetcodeInspection.checks,
      });
    } else if (leetcodeInspection.totalSolved !== undefined) {
      ledger.addEvidence({
        source_type: "leetcode",
        source_document: "leetcode_profile",
        section: "Algorithmic Problem Solving",
        original_text: `Public LeetCode profile shows ${leetcodeInspection.totalSolved} solved problems (Easy: ${leetcodeInspection.easySolved || 0}, Medium: ${leetcodeInspection.mediumSolved || 0}, Hard: ${leetcodeInspection.hardSolved || 0}).`,
        observed_fact: `Public profile shows ${leetcodeInspection.totalSolved} solved problems.`,
        evidence_type: "profile_stats",
        verification_status: "EXTERNALLY_VERIFIED",
        supports: ["dsa", "algorithmic_problem_solving"],
        does_not_prove: ["competitive_programming_mastery", "system_design"],
        checks_performed: leetcodeInspection.checks,
      });
    }
  }

  // 4. Cross-check Live Deployment Evidence
  if (deploymentInspection) {
    if (deploymentInspection.accessible && deploymentInspection.isFunctional) {
      ledger.addEvidence({
        source_type: "deployment",
        source_url: deploymentInspection.url,
        source_document: "live_deployment",
        section: "Live Application Deployment",
        original_text: `Deployment URL: ${deploymentInspection.url}`,
        observed_fact: "Public deployment URL was accessible and displayed the claimed application.",
        evidence_type: "live_deployment",
        verification_status: "EXTERNALLY_VERIFIED",
        supports: ["deployment", "cloud_hosting"],
        does_not_prove: ["high_availability", "auto_scaling", "enterprise_sla"],
        checks_performed: deploymentInspection.checks,
      });
    } else {
      ledger.addEvidence({
        source_type: "deployment",
        source_url: deploymentInspection.url,
        source_document: "live_deployment",
        section: "Live Application Deployment",
        original_text: `Deployment URL: ${deploymentInspection.url}`,
        observed_fact: "Submitted deployment URL could not be verified or was inaccessible.",
        evidence_type: "live_deployment",
        verification_status: "INACCESSIBLE",
        supports: [],
        does_not_prove: ["live_deployment"],
        checks_performed: deploymentInspection.checks,
      });
    }
  }
}

/**
 * Detects duplicate quotations and repeated summary descriptions across evidence items.
 * Prevents identical or paraphrased text from counting as multiple independent proofs.
 */
export function detectEvidenceDuplication(
  items: Array<{ id: string; exactVerbatimText?: string; text?: string; section?: string }>
): {
  uniqueCount: number;
  duplicateCount: number;
  duplicateClusters: Array<{ originalId: string; duplicates: string[]; sharedText: string }>;
} {
  const seenMap = new Map<string, { originalId: string; duplicates: string[] }>();
  let duplicateCount = 0;

  for (const item of items) {
    const raw = (item.exactVerbatimText || item.text || '').trim();
    if (raw.length < 15) continue; // skip short generic labels

    const normalized = raw.toLowerCase().replace(/\s+/g, ' ');
    if (seenMap.has(normalized)) {
      const cluster = seenMap.get(normalized)!;
      cluster.duplicates.push(item.id);
      duplicateCount++;
    } else {
      seenMap.set(normalized, { originalId: item.id, duplicates: [] });
    }
  }

  const duplicateClusters = Array.from(seenMap.entries())
    .filter(([_, cluster]) => cluster.duplicates.length > 0)
    .map(([text, cluster]) => ({
      originalId: cluster.originalId,
      duplicates: cluster.duplicates,
      sharedText: text,
    }));

  return {
    uniqueCount: seenMap.size,
    duplicateCount,
    duplicateClusters,
  };
}

/**
 * Detects negative signals: inaccessible repositories, missing claimed tech, and metric anomalies.
 */
export function detectNegativeAndContradictoryEvidence(options: {
  repoInspections?: RepoInspectionResult[];
  claimedSkills?: string[];
  claimedEmploymentYears?: number;
  actualCalculatedYears?: number;
}): {
  inaccessibleRepositories: string[];
  unsupportedClaims: Array<{ skill: string; reason: string }>;
  experienceDiscrepancies: Array<{ claimed: number; actual: number; reason: string }>;
  hasNegativeSignals: boolean;
} {
  const { repoInspections = [], claimedSkills = [], claimedEmploymentYears = 0, actualCalculatedYears = 0 } = options;
  const inaccessibleRepositories: string[] = [];
  const unsupportedClaims: Array<{ skill: string; reason: string }> = [];
  const experienceDiscrepancies: Array<{ claimed: number; actual: number; reason: string }> = [];

  // 1. Inaccessible repos
  for (const repo of repoInspections) {
    if (!repo.accessible || repo.verificationStatus === 'INACCESSIBLE' || repo.verificationStatus === 'FAILED_SECURITY_CHECK') {
      inaccessibleRepositories.push(repo.repoName || `${repo.owner}/${repo.repoName}`);
    }
  }

  // 2. Claimed technologies missing across inspected code
  if (repoInspections.length > 0 && repoInspections.some((r) => r.accessible)) {
    const allFound = new Set<string>();
    for (const r of repoInspections) {
      r.sourceTechnologiesFound.forEach((t) => allFound.add(t.toLowerCase()));
      r.dependenciesFound.forEach((d) => allFound.add(d.toLowerCase()));
    }

    for (const claimed of claimedSkills) {
      const cleanClaim = claimed.toLowerCase().trim();
      if (['kubernetes', 'rag', 'docker', 'fastapi'].includes(cleanClaim) && !allFound.has(cleanClaim)) {
        unsupportedClaims.push({
          skill: claimed,
          reason: `Claimed competency "${claimed}" has no observable implementation or dependencies across inspected public repositories.`,
        });
      }
    }
  }

  // 3. Experience discrepancies
  if (claimedEmploymentYears > 0 && actualCalculatedYears > 0 && claimedEmploymentYears >= actualCalculatedYears + 3) {
    experienceDiscrepancies.push({
      claimed: claimedEmploymentYears,
      actual: actualCalculatedYears,
      reason: `Claimed ${claimedEmploymentYears} years of experience, but documented non-overlapping employment spans only ${actualCalculatedYears} years.`,
    });
  }

  const hasNegativeSignals =
    inaccessibleRepositories.length > 0 || unsupportedClaims.length > 0 || experienceDiscrepancies.length > 0;

  return {
    inaccessibleRepositories,
    unsupportedClaims,
    experienceDiscrepancies,
    hasNegativeSignals,
  };
}
