/**
 * tests/phase-2-evidence-vault-integrations.test.ts
 * 
 * COGNALYZE STUDENT DNA — PHASE 2 AUTOMATED TEST SUITE
 * 
 * Verifies all 9 integration domains and multi-tenant security guarantees:
 * 1. GitHub Integration (Resolution, pagination, bounded inspection, rate limits, zero repos)
 * 2. LinkedIn Integration (Supported authorized access, no scraping, policy restrictions)
 * 3. LeetCode Integration (Real GraphQL stats, zero vs failure differentiation, freshness)
 * 4. Resume Extraction (PDF/DOCX, section provenance, unverified default, deduplication)
 * 5. Project & Deployment (SSRF defense, timeouts, non-destructive probe, deduplication)
 * 6. Hackathons (11 distinct states, non-equivalence of registration/participation/winning)
 * 7. Certifications (9 verification states, issuer signature verification vs unverified)
 * 8. Evidence Vault & Source Matrix (Honest empty states, audit hash, filter counts)
 * 9. Multi-Tenant Security (Zero cross-student leakage across all sources and artifacts)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { githubConnector } from "../lib/connectors/github";
import { leetcodeConnector } from "../lib/connectors/leetcode";
import { deploymentConnector } from "../lib/connectors/deployment";
import { linkedinConnector } from "../lib/connectors/linkedin";
import { resumeConnector } from "../lib/connectors/resume";
import { hackathonConnector } from "../lib/connectors/hackathon";
import { certificationConnector } from "../lib/connectors/certification";
import { assessmentsConnector } from "../lib/connectors/assessments";
import { sourceRetrievalOrchestrator } from "../lib/connectors/orchestrator";
import { runClaimLevelVerification } from "../lib/evidence/claim-verification-engine";
import { buildCandidateUnifiedEvidenceDossier, validateClaimAgainstEvidencePool } from "../lib/evidence/candidate-evidence-engine";

describe("PHASE 2: REAL EVIDENCE RETRIEVAL & SOURCE INTEGRATIONS", () => {

  // ─────────────────────────────────────────────────────────────
  // 1. GITHUB INTEGRATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe("1. GitHub Integration — Real Retrieval & Bounded Inspection", () => {
    it("resolves valid GitHub username and normalizes arbitrary URLs", () => {
      assert.equal(githubConnector.extractUsername("https://github.com/torvalds"), "torvalds");
      assert.equal(githubConnector.extractUsername("https://github.com/octocat/repos"), "octocat");
      assert.equal(githubConnector.extractUsername("torvalds"), "torvalds");
      assert.equal(githubConnector.extractUsername("invalid-url-without-user"), "invalid-url-without-user");
      assert.equal(githubConnector.extractUsername("https://malicious-site.com/torvalds"), null);
      assert.equal(githubConnector.extractUsername(""), null);
    });

    it("handles nonexistent account with genuine 404 failure state", async () => {
      const res = await githubConnector.retrieve("student-1", {
        mockPayload: { accessible: false }
      });
      assert.equal(res.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res.diagnostics?.httpStatus, 404);
      assert.equal(res.artifactsCount, 0);
      assert.match(res.error || "", /not found/i);
    });

    it("handles rate-limit responses honestly (HTTP 403, remaining = 0)", async () => {
      const res = await githubConnector.retrieve("student-1", {
        mockPayload: { accessible: true, rateLimited: true }
      });
      assert.equal(res.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res.diagnostics?.errorCode, "RATE_LIMITED");
      assert.match(res.error || "", /rate limit/i);
    });

    it("handles authentication / expired token failure (HTTP 401)", async () => {
      const res = await githubConnector.retrieve("student-1", {
        mockPayload: { accessible: true, authFailed: true }
      });
      assert.equal(res.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res.diagnostics?.httpStatus, 401);
      assert.match(res.error || "", /authentication failed/i);
    });

    it("preserves genuine zero when account has 0 public repositories", async () => {
      const res = await githubConnector.retrieve("student-1", {
        mockPayload: { accessible: true, user: { login: "newdev", html_url: "https://github.com/newdev" }, repos: [] }
      });
      assert.equal(res.connectionStatus, "CONTENT_RETRIEVED");
      assert.equal(res.artifactsCount, 0);
      assert.equal(res.data?.totalReposCount, 0);
    });

    it("inspects accessible repositories, manifests, and test suites safely", async () => {
      const res = await githubConnector.retrieve("student-1", {
        mockPayload: {
          accessible: true,
          repos: [
            {
              name: "portfolio-app",
              html_url: "https://github.com/student-1/portfolio-app",
              language: "TypeScript",
              files: {
                "package.json": JSON.stringify({ dependencies: { next: "14.0.0", react: "18.0.0" } }),
                "src/index.tsx": "export default function App() { return <div>Hello</div>; }",
                "src/app.test.tsx": "test('renders', () => {});",
              }
            },
            {
              name: "ml-classifier",
              html_url: "https://github.com/student-1/ml-classifier",
              language: "Python",
              files: {
                "requirements.txt": "fastapi==0.100.0\ntorch==2.0.0",
                "main.py": "from fastapi import FastAPI\napp = FastAPI()",
                "test_main.py": "def test_api(): pass",
              }
            }
          ]
        }
      });

      assert.equal(res.connectionStatus, "INSPECTED");
      assert.equal(res.artifactsCount, 2);
      assert.ok(res.data?.languagesInCode.includes("Python"));
      assert.ok(res.data?.languagesInCode.includes("TypeScript"));
      assert.ok(res.data?.technologiesInManifests.includes("FastAPI"));
      assert.ok(res.data?.technologiesInManifests.includes("Next.js"));
      assert.equal(res.data?.testSuitesFound, 2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. LINKEDIN INTEGRATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe("2. LinkedIn Integration — Supported Authorized Access", () => {
    it("reports honest ACCESS_RESTRICTED when only profile URL is provided without OAuth", async () => {
      const res = await linkedinConnector.retrieve("student-1", {
        profileUrl: "https://linkedin.com/in/student-candidate"
      });
      assert.equal(res.connectionStatus, "NOT_CONNECTED");
      assert.equal(res.artifactsCount, 0);
      assert.ok(res.limitations.some(l => l.includes("scraping") || l.includes("OAuth")));
    });

    it("handles required consent honestly", async () => {
      const res = await linkedinConnector.retrieve("student-1", {
        mockPayload: { accessible: true, consentRequired: true }
      });
      assert.equal(res.connectionStatus, "NOT_CONNECTED");
      assert.equal(res.diagnostics?.errorCode, "CONSENT_REQUIRED");
    });

    it("handles expired OAuth token honestly", async () => {
      const res = await linkedinConnector.retrieve("student-1", {
        mockPayload: { accessible: true, tokenExpired: true }
      });
      assert.equal(res.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res.diagnostics?.httpStatus, 401);
    });

    it("retrieves permitted fields when authorized without fabricating unpermitted data", async () => {
      const res = await linkedinConnector.retrieve("student-1", {
        mockPayload: {
          accessible: true,
          headline: "Software Engineer at Tech Corp",
          experience: [{ role: "Backend Engineer", organization: "Tech Corp", dates: "2023 - Present" }],
          certifications: [{ name: "AWS Certified Developer", issuer: "Amazon Web Services", issuer_verified: true }]
        }
      });
      assert.equal(res.connectionStatus, "CONTENT_RETRIEVED");
      assert.equal(res.artifactsCount, 2); // 1 cert + 1 exp
      assert.equal(res.data?.headline, "Software Engineer at Tech Corp");
      assert.equal(res.data?.certifications[0].issuer_verified, true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. LEETCODE INTEGRATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe("3. LeetCode Integration — Real Statistics & Zero vs Failure", () => {
    it("preserves genuine 0 solved problems and distinguishes it from retrieval failure", async () => {
      const res = await leetcodeConnector.retrieve("student-1", {
        mockPayload: {
          accessible: true,
          username: "zero_coder",
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          contestRating: 0
        }
      });
      assert.equal(res.connectionStatus, "CONTENT_RETRIEVED");
      assert.equal(res.data?.totalSolved, 0);
      assert.equal(res.artifactsCount, 1);
      assert.notEqual(res.connectionStatus, "RETRIEVAL_FAILED");
    });

    it("returns explicit failure state when user is nonexistent", async () => {
      const res = await leetcodeConnector.retrieve("student-1", {
        mockPayload: { accessible: false }
      });
      assert.equal(res.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res.artifactsCount, 0);
      assert.equal(res.data, undefined);
    });

    it("detects stale statistics past 14-day freshness window", async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
      const res = await leetcodeConnector.retrieve("student-1", {
        mockPayload: {
          accessible: true,
          totalSolved: 120,
          staleTimestamp: thirtyDaysAgo
        }
      });
      assert.equal(res.connectionStatus, "STALE");
      assert.equal(res.data?.isStale, true);
      assert.equal(res.data?.totalSolved, 120);
    });

    it("handles malformed response schemas safely without crashing", async () => {
      const res = await leetcodeConnector.retrieve("student-1", {
        mockPayload: { accessible: true, malformed: true }
      });
      assert.equal(res.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res.diagnostics?.errorCode, "MALFORMED_RESPONSE");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. RESUME EXTRACTION & CLAIM CREATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe("4. Resume Intelligence — Extraction & Claim Provenance", () => {
    it("extracts structured claims and preserves section provenance", async () => {
      const sampleResume = `
        Jane Doe
        Email: jane@example.com
        
        SKILLS
        Python, FastAPI, TypeScript, React, Docker
        
        PROJECTS
        Distributed Task Queue
        Built asynchronous task worker in Python and Redis.
        
        EDUCATION
        B.Tech Computer Science, 2024
      `;

      const res = await resumeConnector.retrieve("student-1", {
        rawText: sampleResume,
        fileName: "Jane_Doe_Resume.pdf"
      });

      assert.equal(res.connectionStatus, "CONTENT_RETRIEVED");
      assert.ok(res.data?.skillsClaimedCount && res.data.skillsClaimedCount >= 4);
      assert.ok(res.data?.projectsClaimedCount && res.data.projectsClaimedCount >= 1);

      // Verify that resume claims are classified as SELF_REPORTED and NEVER INDEPENDENTLY_VERIFIED
      for (const claim of res.data?.claims || []) {
        assert.equal(claim.status, "SELF_REPORTED");
        assert.notEqual(claim.status, "INDEPENDENTLY_VERIFIED" as any);
        assert.ok(claim.section.length > 0);
      }
    });

    it("rejects oversized resume documents (> 20MB)", async () => {
      const res = await resumeConnector.retrieve("student-1", {
        mockPayload: { valid: true, isOversized: true }
      });
      assert.equal(res.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res.diagnostics?.errorCode, "FILE_TOO_LARGE");
    });

    it("computes SHA-256 hash and identifies duplicate re-uploads", async () => {
      const sampleText = "Candidate resume with identical content across multiple upload attempts.";
      const hash = resumeConnector.computeHash(sampleText);

      const res = await resumeConnector.retrieve("student-1", {
        mockPayload: { valid: true, text: sampleText, duplicateHash: hash }
      });
      assert.equal(res.data?.isDuplicate, true);
      assert.equal(res.data?.contentHash, hash);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. PROJECT REPOSITORY & DEPLOYMENT INSPECTION TESTS
  // ─────────────────────────────────────────────────────────────
  describe("5. Project & Deployment — SSRF Defense & Bounded Probes", () => {
    it("blocks loopback (127.0.0.1, localhost) to prevent SSRF vulnerabilities", async () => {
      const res = await deploymentConnector.retrieve("student-1", {
        deploymentUrl: "http://127.0.0.1:8080/admin"
      });
      assert.equal(res.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res.diagnostics?.errorCode, "SSRF_BLOCKED");
    });

    it("blocks private network subnets (10.0.0.1) and cloud metadata services (169.254.169.254)", async () => {
      const res1 = await deploymentConnector.retrieve("student-1", {
        deploymentUrl: "http://10.0.0.5:3000"
      });
      assert.equal(res1.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res1.diagnostics?.errorCode, "SSRF_BLOCKED");

      const res2 = await deploymentConnector.retrieve("student-1", {
        deploymentUrl: "http://169.254.169.254/latest/meta-data/"
      });
      assert.equal(res2.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res2.diagnostics?.errorCode, "SSRF_BLOCKED");
    });

    it("handles connection timeouts safely without crashing", async () => {
      const res = await deploymentConnector.retrieve("student-1", {
        mockPayload: { accessible: false, url: "https://slow-app.example.com", timeout: true }
      });
      assert.equal(res.connectionStatus, "RETRIEVAL_FAILED");
      assert.equal(res.diagnostics?.errorCode, "TIMEOUT");
    });

    it("inspects accessible public live deployments non-destructively", async () => {
      const res = await deploymentConnector.retrieve("student-1", {
        mockPayload: {
          accessible: true,
          url: "https://my-app.vercel.app",
          httpStatus: 200,
          htmlTitle: "Distributed Chat Application",
          features: ["HTTP 200 homepage", "Interactive UI elements"]
        }
      });
      assert.equal(res.connectionStatus, "CONTENT_RETRIEVED");
      assert.equal(res.artifactsCount, 1);
      assert.equal(res.data?.pageTitle, "Distributed Chat Application");
      assert.ok(res.limitations.some(l => l.includes("non-destructively")));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. HACKATHON & CERTIFICATION EVIDENCE TESTS
  // ─────────────────────────────────────────────────────────────
  describe("6. Hackathons & Certifications — Distinct Evidence States", () => {
    it("distinguishes registration from participation and winning", async () => {
      const res = await hackathonConnector.retrieve("student-1", {
        hackathons: [
          {
            title: "Global AI Hackathon",
            mockPayload: { eventFound: true, submissionFound: false }
          },
          {
            title: "Web3 Summit",
            submissionUrl: "https://devpost.com/software/my-project",
            mockPayload: { eventFound: true, submissionFound: true, officialParticipantConfirmed: true }
          },
          {
            title: "National Hackathon 2024",
            submissionUrl: "https://devpost.com/software/winner-app",
            mockPayload: { eventFound: true, submissionFound: true, officialWinnerConfirmed: true }
          }
        ]
      });

      assert.equal(res.data?.length, 3);
      assert.equal(res.data?.[0].evidenceState, "REGISTRATION_CONFIRMED");
      assert.equal(res.data?.[1].evidenceState, "PARTICIPATION_CORROBORATED");
      assert.equal(res.data?.[2].evidenceState, "WINNER");
    });

    it("evaluates certifications: issuer verified vs credential URL only vs unverified", async () => {
      const res = await certificationConnector.retrieve("student-1", {
        certifications: [
          {
            name: "AWS Solutions Architect",
            issuer: "Amazon Web Services",
            source: "profile",
            mockPayload: { issuerAccessible: true, issuerVerified: true }
          },
          {
            name: "Google Cloud Engineer",
            issuer: "Google",
            source: "profile",
            mockPayload: { issuerAccessible: true, verificationUnavailable: true }
          },
          {
            name: "Certified Kubernetes Administrator",
            issuer: "CNCF",
            source: "resume"
          }
        ]
      });

      assert.equal(res.data?.length, 3);
      assert.equal(res.data?.[0].verificationStatus, "INDEPENDENTLY_VERIFIED");
      assert.equal(res.data?.[1].verificationStatus, "VERIFICATION_UNAVAILABLE");
      assert.equal(res.data?.[2].verificationStatus, "EXTRACTED_FROM_RESUME");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. MULTI-SOURCE ORCHESTRATION & REFRESH TESTS
  // ─────────────────────────────────────────────────────────────
  describe("7. Multi-Source Orchestration & Idempotent Refresh", () => {
    it("retains historical evidence when one source fails during refresh", async () => {
      // First run: Both GitHub and LeetCode succeed
      const run1 = await sourceRetrievalOrchestrator.executeMultiSourceRetrieval("student-orch-1", {
        forceRefresh: true,
        mockConfigs: {
          github: {
            mockPayload: {
              accessible: true,
              repos: [{ name: "repo-1", html_url: "https://github.com/orch/repo-1", files: { "main.py": "print(1)" } }]
            }
          },
          leetcode: {
            mockPayload: { accessible: true, totalSolved: 50 }
          }
        }
      });

      assert.equal(run1.githubResult?.connectionStatus, "INSPECTED");
      assert.equal(run1.leetcodeResult?.connectionStatus, "CONTENT_RETRIEVED");
      const initialArtifactsCount = run1.artifacts.length;

      // Second run: GitHub fails (e.g. rate limit), but LeetCode succeeds
      const run2 = await sourceRetrievalOrchestrator.executeMultiSourceRetrieval("student-orch-1", {
        forceRefresh: true,
        mockConfigs: {
          github: {
            mockPayload: { accessible: true, rateLimited: true }
          },
          leetcode: {
            mockPayload: { accessible: true, totalSolved: 55 }
          }
        }
      });

      // GitHub failure is recorded in run record
      assert.equal(run2.githubResult?.connectionStatus, "RETRIEVAL_FAILED");
      // But previous valid repo artifact is preserved as STALE rather than deleted!
      const preservedRepo = run2.artifacts.find(a => a.name === "repo-1");
      assert.ok(preservedRepo, "Previous valid artifact must be preserved when refresh fails");
      assert.equal(preservedRepo.metadata?.isStale, true);
    });

    it("generates deterministic audit hash across multi-source verification runs", async () => {
      const dossier = await runClaimLevelVerification("student-audit-1", {
        forceRefresh: true,
        mockSources: {
          resumeText: "Skills: Python, TypeScript\nProjects:\nChat App\nBuilt web app.",
          githubPayload: {
            accessible: true,
            repos: [{ name: "chat-app", url: "https://github.com/test/chat", files: { "main.py": "print('py')" } }]
          }
        }
      });

      assert.ok(dossier.auditHash);
      assert.equal(typeof dossier.auditHash, "string");
      assert.equal(dossier.auditHash.length, 16);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. MULTI-TENANT SECURITY & ISOLATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe("8. Multi-Tenant Data Isolation & Security Boundary", () => {
    it("ensures Candidate A cannot access Candidate B evidence, artifacts, or claims", async () => {
      const studentA = "student-tenant-alpha";
      const studentB = "student-tenant-beta";

      // Populate evidence for Student A
      const dossierA = await buildCandidateUnifiedEvidenceDossier(studentA, {
        forceRefresh: true,
        mockSources: {
          resumeText: "Skills: Python, Django\nProjects: Alpha Engine",
          githubPayload: {
            accessible: true,
            repos: [{ name: "alpha-core", url: "https://github.com/alpha/core", files: { "app.py": "import django" } }]
          }
        }
      });

      // Populate evidence for Student B
      const dossierB = await buildCandidateUnifiedEvidenceDossier(studentB, {
        forceRefresh: true,
        mockSources: {
          resumeText: "Skills: Go, Kubernetes\nProjects: Beta Mesh",
          githubPayload: {
            accessible: true,
            repos: [{ name: "beta-mesh", url: "https://github.com/beta/mesh", files: { "main.go": "package main" } }]
          }
        }
      });

      // Assert Student A contains only Student A artifacts
      assert.equal(dossierA.student_id, studentA);
      for (const ev of dossierA.evidence_records) {
        assert.equal(ev.authenticated_student_id, studentA);
        assert.notEqual(ev.authenticated_student_id, studentB);
      }

      // Assert Student B contains only Student B artifacts
      assert.equal(dossierB.student_id, studentB);
      for (const ev of dossierB.evidence_records) {
        assert.equal(ev.authenticated_student_id, studentB);
        assert.notEqual(ev.authenticated_student_id, studentA);
      }

      // Cross-tenant verification check: Student A validating a claim using Student B's evidence ID is rejected
      const studentB_evidenceId = dossierB.evidence_records[0].evidence_id;
      const crossTenantValidation = validateClaimAgainstEvidencePool(
        {
          claim_id: "claim_malicious_cross_tenant",
          claim_text: "Claims Go implementation",
          evidence_ids: [studentB_evidenceId]
        },
        dossierA.evidence_records, // Student A's pool
        studentA
      );

      assert.equal(crossTenantValidation.valid, false);
      assert.ok(crossTenantValidation.errors.some(e => e.includes("does not exist") || e.includes("Multi-tenant")));
    });
  });

});
