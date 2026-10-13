/**
 * tests/claim-level-evidence-verification.test.ts
 *
 * COGNALYZE CLAIM-LEVEL MULTI-SOURCE EVIDENCE VERIFICATION TEST SUITE
 * Complete 15-Scenario Test Matrix (TEST 1 to TEST 15)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  runClaimLevelVerification,
  extractClaimsFromResume,
  calculateDeterministicAuditHash,
  invalidateClaimVerificationCache,
  ClaimVerificationRecord
} from "../lib/evidence/claim-verification-engine";
import {
  createUser,
  createSession,
  upsertStudentProfileByUserId,
  getStudentProfileByUserId
} from "../lib/auth/store";

describe("Cognalyze Claim-Level Multi-Source Evidence Verification (15-Scenario Matrix)", () => {

  // ── TEST 1: Python claim + Python in inspected repo ──
  test("TEST 1: Resume claims Python and inspected repository contains relevant Python implementation -> Supported with exact links", async () => {
    const studentId = `test_std_1_${Date.now()}`;
    const resumeText = `John Doe\nSkills: Python, React\nProjects:\nML Predictor: Built prediction engine using Python.`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        githubPayload: {
          accessible: true,
          repos: [
            {
              name: "ml-predictor",
              url: "https://github.com/johndoe/ml-predictor",
              files: {
                "main.py": "import numpy as np\ndef predict(x): return x * 2",
                "requirements.txt": "numpy==1.24.0\npytest"
              }
            }
          ]
        }
      }
    });

    const pythonClaim = dossier.claims.find(c => c.claimText.toLowerCase().includes("python"));
    assert.ok(pythonClaim, "Python claim must be extracted from resume");
    assert.equal(pythonClaim.verificationResult, "SUPPORTED", "Claim must be SUPPORTED when repo contains actual Python code");
    assert.ok(pythonClaim.supportingEvidence.length > 0, "Must contain supporting evidence");
    assert.ok(pythonClaim.supportingEvidence[0].excerpt.includes("Python"), "Excerpt must explicitly mention Python");
    assert.ok(pythonClaim.relevantFilesInspected.some(f => f.endsWith(".py")), "Inspected files must list Python source files");
  });

  // ── TEST 2: Python claim + Repo has JS/TS and NO Python ──
  test("TEST 2: Resume claims Python, but repo contains JS/TS and no Python -> Records actual mismatch and inspection limitations", async () => {
    const studentId = `test_std_2_${Date.now()}`;
    const resumeText = `Jane Smith\nSkills: Python\nProjects:\nFrontend App: Web dashboard.`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        githubPayload: {
          accessible: true,
          repos: [
            {
              name: "frontend-app",
              url: "https://github.com/janesmith/frontend-app",
              files: {
                "src/App.tsx": "export default function App() { return <div>Hello</div> }",
                "package.json": '{"dependencies": {"react": "^18.0.0"}}'
              }
            }
          ]
        }
      }
    });

    const pythonClaim = dossier.claims.find(c => c.claimText.toLowerCase().includes("python"));
    assert.ok(pythonClaim, "Python claim must be extracted");
    assert.equal(pythonClaim.verificationResult, "NOT_FOUND", "Claim must be marked NOT_FOUND in inspected repo");
    assert.ok(pythonClaim.conflictingEvidence.length > 0, "Must record discrepancy");
    assert.ok(
      pythonClaim.conflictingEvidence[0].claimDiff.includes("The submitted repository does not currently provide evidence of the claimed Python implementation"),
      "Must state honest mismatch message"
    );
    assert.ok(
      dossier.discrepancies.some(d => d.discrepancyType === "LANGUAGE_MISMATCH"),
      "Must register a LANGUAGE_MISMATCH discrepancy"
    );
  });

  // ── TEST 3: ML project claim + Inaccessible repo ──
  test("TEST 3: Resume lists ML project, but repo is inaccessible -> Repository verification is unavailable, no ML invented", async () => {
    const studentId = `test_std_3_${Date.now()}`;
    const resumeText = `Bob Jones\nProjects:\nML Engine: https://github.com/bobjones/private-ml-engine`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        githubPayload: {
          accessible: false
        }
      }
    });

    const mlClaim = dossier.claims.find(c => c.claimCategory === "project");
    assert.ok(mlClaim, "Project claim must exist");
    assert.equal(mlClaim.verificationResult, "SOURCE_UNAVAILABLE", "Must be SOURCE_UNAVAILABLE when repo cannot be reached");
    assert.ok(mlClaim.retrievalErrors.some(e => e.includes("Repository verification could not be completed")), "Must record failure to reach repository");
    assert.equal(mlClaim.supportingEvidence.length, 0, "Zero supporting evidence must be fabricated");
  });

  // ── TEST 4: LinkedIn certification matches claim but issuer verification unavailable ──
  test("TEST 4: LinkedIn certification matches claim but lacks issuer verification -> Supported as profile claim, issuer verification unavailable", async () => {
    const studentId = `test_std_4_${Date.now()}`;
    const resumeText = `Alice Brown\nCertifications:\nCertified Kubernetes Administrator (CKA)`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        linkedinPayload: {
          accessible: true,
          certifications: [
            {
              name: "Certified Kubernetes Administrator (CKA)",
              issuer: "Linux Foundation",
              credential_id: "LF-CKA-9921",
              credential_url: "https://www.cncf.io/verify/LF-CKA-9921",
              issuer_verified: false
            }
          ]
        }
      }
    });

    const certClaim = dossier.claims.find(c => c.claimCategory === "certification");
    assert.ok(certClaim, "Certification claim must be extracted");
    assert.equal(certClaim.verificationResult, "PARTIALLY_SUPPORTED", "Must be PARTIALLY_SUPPORTED when listed on LinkedIn without issuer signature");
    assert.ok(certClaim.knownLimitations.some(l => l.includes("profile-reported record")), "Must note profile-reported limitation");
    assert.ok(certClaim.missingEvidence.some(m => m.includes("issuer signature")), "Must state missing third-party confirmation");
  });

  // ── TEST 5: Certification in resume but absent on LinkedIn ──
  test("TEST 5: Certification on resume absent from LinkedIn -> Reports no matching LinkedIn record found, does not label fake", async () => {
    const studentId = `test_std_5_${Date.now()}`;
    const resumeText = `Charlie Dave\nCertifications:\nAWS Certified Solutions Architect`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        linkedinPayload: {
          accessible: true,
          certifications: [
            {
              name: "Scrum Master",
              issuer: "Scrum.org",
              issuer_verified: false
            }
          ]
        }
      }
    });

    const certClaim = dossier.claims.find(c => c.claimText.includes("AWS Certified Solutions Architect"));
    assert.ok(certClaim, "AWS cert claim extracted");
    assert.equal(certClaim.verificationResult, "NOT_FOUND", "Result must be NOT_FOUND");
    assert.ok(certClaim.missingEvidence.some(m => m.includes("No matching LinkedIn certification was retrieved")), "Must specify no matching LinkedIn record");
    assert.ok(certClaim.knownLimitations.some(l => l.includes("does not prove that a certification does not exist")), "Must NOT accuse candidate of fake certification");
  });

  // ── TEST 6: Repository connected but 0 source files inspected ──
  test("TEST 6: Repository URL connected but 0 source files inspected -> Does not mark technical skill demonstrated", async () => {
    const studentId = `test_std_6_${Date.now()}`;
    const resumeText = `Eve Frank\nSkills: Go\nProjects:\nGo Backend: Built microservice`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        githubPayload: {
          accessible: true,
          repos: [
            {
              name: "empty-repo",
              url: "https://github.com/eve/empty-repo",
              files: {} // Zero files
            }
          ]
        }
      }
    });

    const goClaim = dossier.claims.find(c => c.claimText.includes("Go"));
    assert.ok(goClaim, "Go claim extracted");
    assert.notEqual(goClaim.verificationResult, "SUPPORTED", "Cannot be marked SUPPORTED when 0 code files exist");
  });

  // ── TEST 7: Resume changes -> Claims recalculated ──
  test("TEST 7: Resume changes -> New document extracted and affected claims recalculated", async () => {
    const studentId = `test_std_7_${Date.now()}`;
    const resumeV1 = `Resume A\nSkills: Python`;
    const resumeV2 = `Resume B\nSkills: Rust, Go`;

    const dossierV1 = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: { resumeText: resumeV1 }
    });
    assert.ok(dossierV1.claims.some(c => c.claimText.includes("Python")));
    assert.ok(!dossierV1.claims.some(c => c.claimText.includes("Rust")));

    // User updates resume
    invalidateClaimVerificationCache(studentId);
    const dossierV2 = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: { resumeText: resumeV2 }
    });
    assert.ok(!dossierV2.claims.some(c => c.claimText.includes("Python")));
    assert.ok(dossierV2.claims.some(c => c.claimText.includes("Rust")));
    assert.ok(dossierV2.claims.some(c => c.claimText.includes("Go")));
  });

  // ── TEST 8: Repository changes -> Findings refreshed ──
  test("TEST 8: Repository changes -> Affected findings refreshed on updated retrieval", async () => {
    const studentId = `test_std_8_${Date.now()}`;
    const resumeText = `Skills: Python`;

    // Phase 1: Repo has no Python
    const dossierV1 = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        githubPayload: {
          accessible: true,
          repos: [{ name: "my-code", url: "https://github.com/test/repo", files: { "readme.md": "docs" } }]
        }
      }
    });
    const cV1 = dossierV1.claims.find(c => c.claimText.includes("Python"))!;
    assert.equal(cV1.verificationResult, "NOT_FOUND");

    // Phase 2: Candidate commits Python code
    invalidateClaimVerificationCache(studentId);
    const dossierV2 = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        githubPayload: {
          accessible: true,
          repos: [{ name: "my-code", url: "https://github.com/test/repo", files: { "main.py": "print('hello')" } }]
        }
      }
    });
    const cV2 = dossierV2.claims.find(c => c.claimText.includes("Python"))!;
    assert.equal(cV2.verificationResult, "SUPPORTED");
  });

  // ── TEST 9: Source cannot be accessed -> Result is SOURCE_UNAVAILABLE ──
  test("TEST 9: Source cannot be accessed -> Result is SOURCE_UNAVAILABLE, not NOT_FOUND or VERIFIED", async () => {
    const studentId = `test_std_9_${Date.now()}`;
    const resumeText = `Projects:\nAPI Server: https://github.com/test/server`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        githubPayload: { accessible: false }
      }
    });

    const projClaim = dossier.claims.find(c => c.claimCategory === "project")!;
    assert.equal(projClaim.verificationResult, "SOURCE_UNAVAILABLE", "Must strictly be SOURCE_UNAVAILABLE");
  });

  // ── TEST 10: No evidence exists -> Remains unverified without fabrication ──
  test("TEST 10: No evidence exists for a claim -> Remains unverified, no evidence fabricated", async () => {
    const studentId = `test_std_10_${Date.now()}`;
    const resumeText = `Skills: Haskell`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        githubPayload: undefined // Not connected
      }
    });

    const haskellClaim = dossier.claims.find(c => c.claimText.includes("Haskell"))!;
    assert.equal(haskellClaim.verificationResult, "NOT_INSPECTED");
    assert.equal(haskellClaim.supportingEvidence.length, 0);
  });

  // ── TEST 11: Repeated statements across sources are not independent confirmations ──
  test("TEST 11: Repeated student statements across resume and LinkedIn -> Not counted as independent confirmations", async () => {
    const studentId = `test_std_11_${Date.now()}`;
    const resumeText = `Certifications:\nDeep Learning Specialization`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        linkedinPayload: {
          accessible: true,
          certifications: [
            {
              name: "Deep Learning Specialization",
              issuer: "Coursera",
              issuer_verified: false // Candidate profile entry only
            }
          ]
        }
      }
    });

    const certClaim = dossier.claims.find(c => c.claimCategory === "certification")!;
    assert.equal(certClaim.verificationResult, "PARTIALLY_SUPPORTED");
    assert.equal(certClaim.supportingEvidence[0].isIndependentConfirmation, false, "Self-reported LinkedIn entry is NOT an independent confirmation");
  });

  // ── TEST 12: Candidate A and Candidate B isolation ──
  test("TEST 12: Candidate A and Candidate B use system -> Zero data, claims, or findings leakage", async () => {
    const studentA = `std_a_${Date.now()}`;
    const studentB = `std_b_${Date.now()}`;

    const dossierA = await runClaimLevelVerification(studentA, {
      forceRefresh: true,
      mockSources: { resumeText: "Skills: Rust" }
    });
    const dossierB = await runClaimLevelVerification(studentB, {
      forceRefresh: true,
      mockSources: { resumeText: "Skills: Solidity" }
    });

    assert.ok(dossierA.claims.some(c => c.claimText.includes("Rust")));
    assert.ok(!dossierA.claims.some(c => c.claimText.includes("Solidity")));

    assert.ok(dossierB.claims.some(c => c.claimText.includes("Solidity")));
    assert.ok(!dossierB.claims.some(c => c.claimText.includes("Rust")));

    assert.notEqual(dossierA.studentId, dossierB.studentId);
  });

  // ── TEST 13: Deployed project accessible but repository unlinked -> Separate findings ──
  test("TEST 13: Project is deployed, but repository cannot be established -> Deployment observations and source-code verification remain separate", async () => {
    const studentId = `test_std_13_${Date.now()}`;
    const resumeText = `Projects:\nLive Dashboard: https://my-dashboard.vercel.app`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        deploymentPayload: {
          accessible: true,
          url: "https://my-dashboard.vercel.app",
          features: ["HTTP 200 homepage", "Interactive charts"]
        },
        githubPayload: undefined // No repo linked
      }
    });

    const projClaim = dossier.claims.find(c => c.claimCategory === "project")!;
    assert.ok(projClaim.supportingEvidence.some(s => s.source.includes("Deployment")), "Deployment evidence observed");
    assert.ok(projClaim.missingEvidence.some(m => m.includes("project repository")), "Repository remains missing and unlinked");
  });

  // ── TEST 14: Deterministic Audit Hash ──
  test("TEST 14: Audit hash is regenerated -> Hash is derived from actual documented audit record representation", () => {
    const records = [
      {
        operationId: "op_001",
        studentId: "std_test",
        claimIdsAffected: ["claim_1"],
        sourcesInspected: ["Resume", "GitHub"],
        retrievalOutcome: "SUPPORTED",
        verificationMethod: "AST Code Inspection",
        result: "SUPPORTED",
        relevantEvidenceRefs: ["https://github.com/repo"],
        timestamp: "2026-10-11T12:00:00Z",
        analysisVersion: "2.5.0"
      }
    ];

    const hash1 = calculateDeterministicAuditHash(records);
    const hash2 = calculateDeterministicAuditHash(records);

    assert.equal(hash1, hash2, "Audit hash must be deterministic across identical records");
    assert.match(hash1, /^[0-9a-f]{16}$/, "Must be valid 16-char hex hash");
  });

  // ── TEST 15: Filters return correct actual records ──
  test("TEST 15: Evidence Vault filter queries -> Return exact matching records and counts", async () => {
    const studentId = `test_std_15_${Date.now()}`;
    const resumeText = `Skills: Python, React\nProjects:\nPortfolio: Web portfolio.`;

    const dossier = await runClaimLevelVerification(studentId, {
      forceRefresh: true,
      mockSources: {
        resumeText,
        githubPayload: {
          accessible: true,
          repos: [
            {
              name: "portfolio",
              url: "https://github.com/test/portfolio",
              files: { "main.py": "print(1)" }
            }
          ]
        }
      }
    });

    const supportedList = dossier.claims.filter(c => c.verificationResult === "SUPPORTED");
    const notFoundList = dossier.claims.filter(c => c.verificationResult === "NOT_FOUND");
    const projectList = dossier.claims.filter(c => c.claimCategory === "project");

    assert.equal(dossier.coverage.claimsSupported, supportedList.length, "Supported count must match filter count");
    assert.equal(dossier.coverage.claimsNotFound, notFoundList.length, "NotFound count must match filter count");
    assert.ok(projectList.length > 0, "Must have project claims");
  });
});
