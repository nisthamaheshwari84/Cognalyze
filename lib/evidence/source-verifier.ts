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

import {
  DiscoveredSourceRecord,
  EvidenceLedger,
  EvidenceRecord,
  VerificationCheck,
} from "./evidence-ledger";
import { detectEducationStatus } from "./non-equivalence";

export interface RepoInspectionResult {
  accessible: boolean;
  repoName: string;
  owner: string;
  description: string;
  hasReadme: boolean;
  readmeText: string;
  verificationStatus?: 'VERIFIED' | 'INACCESSIBLE' | 'NOT_VERIFIED';
  dependenciesFound: string[];
  sourceTechnologiesFound: string[];
  checks: VerificationCheck[];
  error?: string;
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
  }
): Promise<RepoInspectionResult> {
  const checks: VerificationCheck[] = [];

  // Extract owner/repo
  const cleanUrl = urlOrOwnerRepo.replace(/^https?:\/\/github\.com\//i, "").replace(/\/$/, "");
  const parts = cleanUrl.split("/");
  const owner = parts[0] || "";
  const repoName = parts[1] || "";

  if (!owner || !repoName) {
    return {
      accessible: false,
      verificationStatus: 'INACCESSIBLE',
      repoName: cleanUrl,
      owner: "",
      description: "",
      hasReadme: false,
      readmeText: "",
      dependenciesFound: [],
      sourceTechnologiesFound: [],
      checks: [{ check: "GitHub URL Format", result: "FAILED", detail: "Invalid GitHub repository path" }],
      error: "Invalid repository format",
    };
  }

  // If mock payload provided (e.g. for deterministic anti-hallucination unit testing)
  if (mockPayload) {
    if (!mockPayload.accessible) {
      checks.push({ check: "Repository accessible", result: "FAILED", detail: "HTTP 404 or network inaccessible" });
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
        error: "Repository could not be accessed.",
      };
    }

    checks.push({ check: "Repository accessible", result: "PASSED", detail: "Repository confirmed accessible" });
    checks.push({ check: "Repository identified", result: "PASSED", detail: `${owner}/${repoName}` });

    const readme = mockPayload.readmeText || "";
    const hasReadme = readme.length > 0;
    checks.push({ check: "README inspected", result: hasReadme ? "PASSED" : "FAILED" });

    const files = mockPayload.files || {};
    const dependenciesFound: string[] = [];
    const sourceTechnologiesFound: string[] = [];

    // Check package manifests and code files
    for (const [filename, content] of Object.entries(files)) {
      const lowerContent = content.toLowerCase();
      const lowerFile = filename.toLowerCase();

      // Check python
      if (lowerFile.endsWith(".py")) {
        if (!sourceTechnologiesFound.includes("python")) sourceTechnologiesFound.push("python");
        if (lowerContent.includes("from fastapi") || lowerContent.includes("import fastapi")) {
          if (!sourceTechnologiesFound.includes("fastapi")) sourceTechnologiesFound.push("fastapi");
        }
        if (lowerContent.includes("from flask") || lowerContent.includes("import flask")) {
          if (!sourceTechnologiesFound.includes("flask")) sourceTechnologiesFound.push("flask");
        }
        if (lowerContent.includes("from django") || lowerContent.includes("import django")) {
          if (!sourceTechnologiesFound.includes("django")) sourceTechnologiesFound.push("django");
        }
      }

      // Check requirements.txt or pyproject.toml
      if (lowerFile === "requirements.txt" || lowerFile === "pyproject.toml") {
        if (lowerContent.includes("fastapi")) dependenciesFound.push("fastapi");
        if (lowerContent.includes("flask")) dependenciesFound.push("flask");
        if (lowerContent.includes("django")) dependenciesFound.push("django");
        if (lowerContent.includes("psycopg2") || lowerContent.includes("asyncpg") || lowerContent.includes("postgres")) {
          dependenciesFound.push("postgresql");
        }
        if (lowerContent.includes("pandas")) dependenciesFound.push("pandas");
        if (lowerContent.includes("torch")) dependenciesFound.push("pytorch");
      }

      // Check Dockerfile
      if (lowerFile === "dockerfile" || lowerFile.includes("docker-compose")) {
        if (!sourceTechnologiesFound.includes("docker")) sourceTechnologiesFound.push("docker");
      }

      // Check package.json
      if (lowerFile === "package.json") {
        if (lowerContent.includes('"react"')) dependenciesFound.push("react");
        if (lowerContent.includes('"next"')) dependenciesFound.push("nextjs");
      }

      // Check js/ts files
      if (lowerFile.endsWith(".tsx") || lowerFile.endsWith(".jsx") || lowerFile.endsWith(".ts") || lowerFile.endsWith(".js")) {
        if (lowerContent.includes("react")) {
          if (!sourceTechnologiesFound.includes("react")) sourceTechnologiesFound.push("react");
        }
      }
    }

    // Technology-by-technology evaluation
    for (const tech of claimedTechnologies) {
      const normTech = tech.toLowerCase();
      const inDeps = dependenciesFound.includes(normTech);
      const inSource = sourceTechnologiesFound.includes(normTech);

      if (inDeps || inSource) {
        checks.push({
          check: `Technology check: ${tech}`,
          result: "PASSED",
          detail: inSource ? "Source code implementation verified" : "Declared in package dependencies",
        });
      } else {
        checks.push({
          check: `Technology check: ${tech}`,
          result: "FAILED",
          detail: `${tech} dependency or source implementation NOT found in repository`,
        });
      }
    }

    return {
      accessible: true,
      verificationStatus: sourceTechnologiesFound.length > 0 ? 'VERIFIED' : 'NOT_VERIFIED',
      repoName,
      owner,
      description: "Inspected repository artifact",
      hasReadme,
      readmeText: readme,
      dependenciesFound,
      sourceTechnologiesFound,
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
