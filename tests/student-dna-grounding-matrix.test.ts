/**
 * tests/student-dna-grounding-matrix.test.ts
 * 
 * Comprehensive 16-Scenario Regression Matrix (TEST A - TEST P)
 * Mandated by Section 15 of COGNALYZE STUDENT DNA — EVIDENCE-GROUNDED ANALYSIS REBUILD
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { getStudentDNA, invalidateStudentDNACache, recordHackathonOutcome } from "../lib/ai/student-dna";
import { 
  getStudentDNAFull, 
  initializeUserEvidenceIfEmpty, 
  invalidateUserDNAScope,
  addStudentEvidenceRecord,
  getStudentEvidenceList
} from "../lib/dna/store";
import { 
  getStudentProfileByUserId, 
  upsertStudentProfileByUserId, 
  getStudentProfileCompletionState,
  createUser
} from "../lib/auth/store";
import { extractResumeFacts } from "../lib/evidence-collector/resume";
import { enforceEvidenceGuard } from "../lib/evidence-collector/guard";
import { detectContradictions } from "../lib/dna/evidence-pipeline";
import { getStudentEvidence, addEvidenceItem } from "../lib/intelligence/student-intelligence";
import { verifyHackathonClaim } from "../lib/evidence/hackathon-agent";

function registerTestUser(id: string, name: string) {
  try {
    createUser({
      id,
      email: `${id}@test.cognalyze.com`,
      fullName: name,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE",
      profileCompleted: true
    });
  } catch {
    // User already exists
  }
}

test("COGNALYZE EVIDENCE-GROUNDED ANALYSIS MATRIX (TEST A - TEST P)", async (t) => {
  const userA = "test-matrix-student-a-" + Date.now();
  const userB = "test-matrix-student-b-" + Date.now();
  registerTestUser(userA, "Student A");
  registerTestUser(userB, "Student B");

  // ─────────────────────────────────────────────────────────────
  // TEST A — Zero Hackathons
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST A — Zero hackathons: No invented hackathons, trophies, or participation", async () => {
    // Student with skills and projects, but ZERO hackathons
    upsertStudentProfileByUserId(userA, {
      fullName: "Student A",
      degree: "B.Tech",
      branch: "Computer Science",
      college: "Test University",
      graduationYear: "2026",
      skills: [{ name: "Python", level: "Intermediate" }],
      projects: [{ title: "Search Engine", description: "Built inverted index", techStack: ["Python"] }],
      achievements: [], // Explicitly zero
      currentStep: 9,
      profileCompleted: true
    });

    invalidateStudentDNACache(userA);
    invalidateUserDNAScope(userA);

    const dna = await getStudentDNA(userA);
    assert.equal(dna.hackathon_history.length, 0, "Hackathon history must be completely empty");

    const dnaFull = await getStudentDNAFull(userA);
    assert.equal(dnaFull.snapshot.proofSummary.hackathonsCount, 0, "Snapshot hackathons count must be strictly 0");
    
    // Ensure no fallback hackathon titles exist
    const hasInventedHack = dna.hackathon_history.some(h => h.hackathon_title.includes("Flipkart") || h.hackathon_title.includes("Smart India"));
    assert.equal(hasInventedHack, false, "Must not invent Flipkart GRiD or SIH for student with zero hackathons");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST B — One Hackathon
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST B — One hackathon: Analyzes only that single record, unverified claims stay labeled", async () => {
    const userWithOneHack = "student-one-hack-" + Date.now();
    registerTestUser(userWithOneHack, "One Hack Student");
    upsertStudentProfileByUserId(userWithOneHack, {
      fullName: "One Hack Student",
      degree: "B.Tech",
      branch: "ECE",
      college: "Tech College",
      graduationYear: "2026",
      skills: [{ name: "C++", level: "Intermediate" }],
      projects: [],
      achievements: [
        {
          title: "HackNITK 2026",
          type: "Hackathon",
          description: "Submitted automated drone payload classifier"
        }
      ],
      currentStep: 9,
      profileCompleted: true
    });

    invalidateStudentDNACache(userWithOneHack);
    invalidateUserDNAScope(userWithOneHack);

    const dna = await getStudentDNA(userWithOneHack);
    assert.equal(dna.hackathon_history.length, 1, "Must contain exactly 1 hackathon record");
    assert.equal(dna.hackathon_history[0].hackathon_title, "HackNITK 2026");

    const dnaFull = await getStudentDNAFull(userWithOneHack);
    assert.equal(dnaFull.snapshot.proofSummary.hackathonsCount, 1, "Hackathons count must be strictly 1");

    // Test external verification check on unverified link
    const claimRes = await verifyHackathonClaim(userWithOneHack, {
      name: "HackNITK 2026",
      claimed_project_link: "",
      claimed_description: "Submitted automated drone payload classifier",
      claimed_result: "Participant"
    });
    assert.equal(claimRes.verified.url_verified, false, "Unprovided or unverified link must remain url_verified: false");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST C — No Projects
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST C — No projects: No project-specific analysis produced", async () => {
    const userNoProjects = "student-no-projects-" + Date.now();
    registerTestUser(userNoProjects, "No Projects Student");
    upsertStudentProfileByUserId(userNoProjects, {
      fullName: "No Projects Student",
      college: "Institute",
      degree: "B.Tech",
      branch: "IT",
      graduationYear: "2026",
      skills: [{ name: "Java", level: "Beginner" }],
      projects: [], // Zero projects
      achievements: [],
      currentStep: 9,
      profileCompleted: true
    });

    invalidateStudentDNACache(userNoProjects);
    invalidateUserDNAScope(userNoProjects);

    const dna = await getStudentDNA(userNoProjects);
    assert.equal(dna.projects.length, 0, "Must have 0 projects");
    assert.deepEqual(dna.project_count_by_domain, {}, "Domain breakdown must be empty");

    const dnaFull = await getStudentDNAFull(userNoProjects);
    assert.equal(dnaFull.snapshot.proofSummary.projectsCount, 0, "Projects built count must be 0");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST D — Project With Inaccessible Repository
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST D — Project with inaccessible repository: Claim retained, verification marked unavailable", async () => {
    const userBrokenRepo = "student-broken-repo-" + Date.now();
    registerTestUser(userBrokenRepo, "Broken Repo Student");
    upsertStudentProfileByUserId(userBrokenRepo, {
      fullName: "Broken Repo Student",
      college: "Institute",
      degree: "B.Tech",
      branch: "IT",
      graduationYear: "2026",
      skills: [{ name: "TypeScript", level: "Intermediate" }],
      projects: [
        {
          title: "Dead Link App",
          description: "A fullstack application",
          techStack: ["TypeScript", "Next.js"],
          githubUrl: "https://github.com/nonexistent-org-random-404-dead/repo-does-not-exist"
        }
      ],
      currentStep: 9,
      profileCompleted: true
    });

    invalidateStudentDNACache(userBrokenRepo);
    const dna = await getStudentDNA(userBrokenRepo);
    assert.equal(dna.projects.length, 1, "Original claim retained");
    assert.equal(dna.projects[0].github_verified, false, "Broken repository must NOT be marked verified");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST E — Resume Missing
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST E — Resume missing: System does not claim to have analyzed a resume", () => {
    const completion = getStudentProfileCompletionState(userA);
    // Profile A has no resume uploaded
    assert.equal(completion.profileSummary?.hasResume, false, "Must detect resume missing");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST F — Resume Extraction Failure
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST F — Resume extraction failure: Returns null normalized_facts, no substitute resume generated", () => {
    const res = extractResumeFacts("");
    assert.equal(res.normalized_facts, null, "Empty resume must yield null normalized facts");
    assert.ok(res.raw_data.error, "Error must be reported");

    const shortRes = extractResumeFacts("Too short");
    assert.equal(shortRes.normalized_facts, null, "Short unreadable text must fail extraction");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST G — Conflicting Sources
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST G — Conflicting sources: Discrepancy explicitly flagged without guessing", () => {
    const finding = detectContradictions("python", [
      {
        id: "ev_1",
        sourceType: "resume",
        sourceId: "res_1",
        userId: "student-conflict",
        skillId: "python",
        evidenceType: "resume_text",
        claim: "Advanced Python engineer with 4 years experience",
        extractedValue: "Advanced",
        strength: 0.9,
        reliability: 0.5,
        confidence: "MEDIUM",
        recency: "CURRENT",
        verificationStatus: "CLAIMED",
        provenance: "Resume L1",
        createdAt: new Date().toISOString(),
        observedAt: new Date().toISOString()
      },
      {
        id: "ev_2",
        sourceType: "assessment",
        sourceId: "assess_1",
        userId: "student-conflict",
        skillId: "python",
        evidenceType: "test_score",
        claim: "Diagnostic Python assessment score was 35%",
        extractedValue: { score: 35 },
        strength: 0.2,
        reliability: 0.95,
        confidence: "HIGH",
        recency: "CURRENT",
        verificationStatus: "VERIFIED",
        provenance: "Assessment Q12",
        createdAt: new Date().toISOString(),
        observedAt: new Date().toISOString()
      }
    ]);

    assert.ok(finding, "Contradiction must be detected");
    assert.equal(finding.skillName, "Python");
    assert.ok(finding.neutralExplanation.length > 0, "Must provide explicit non-accusatory reason");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST H — Empty Student Profile
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST H — Empty student profile: Returns NO_PROFILE and blocks fake Student DNA", () => {
    const emptyUserId = "brand-new-unonboarded-" + Date.now();
    const state = getStudentProfileCompletionState(emptyUserId);
    assert.equal(state.state, "NO_PROFILE", "Must be NO_PROFILE");
    assert.equal(state.isCompleted, false);
    assert.equal(state.completedStepsCount, 0);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST I — Cross-Account Isolation
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST I — Cross-account isolation: User B cannot access User A's private records or analysis", async () => {
    upsertStudentProfileByUserId(userB, {
      fullName: "Student B",
      college: "Another University",
      degree: "B.Tech",
      branch: "Mechanical",
      graduationYear: "2027",
      skills: [{ name: "SolidWorks", level: "Advanced" }],
      projects: [{ title: "Gearbox Design", description: "Mechanical gearbox", techStack: ["SolidWorks"] }],
      achievements: [{ title: "CAD Contest 2026", type: "Contest" }],
      currentStep: 9,
      profileCompleted: true
    });

    invalidateUserDNAScope(userA);
    invalidateUserDNAScope(userB);

    const dnaA = await getStudentDNAFull(userA);
    const dnaB = await getStudentDNAFull(userB);

    // User B should NOT have User A's Python skills or Search Engine project
    const userBHasPython = dnaB.skills.some(s => s.skillName === "Python" && s.estimatedLevel > 0);
    assert.equal(userBHasPython, false, "User B must not inherit User A's Python evidence");

    const userAHasSolidWorks = dnaA.skills.some(s => s.skillName === "SolidWorks" && s.estimatedLevel > 0);
    assert.equal(userAHasSolidWorks, false, "User A must not inherit User B's SolidWorks evidence");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST J — Stale Analysis Invalidation
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST J — Stale analysis: Record modifications invalidate cached snapshot", async () => {
    const userStale = "student-stale-" + Date.now();
    registerTestUser(userStale, "Stale Test User");
    upsertStudentProfileByUserId(userStale, {
      fullName: "Stale Test User",
      college: "College",
      degree: "B.Tech",
      branch: "CSE",
      graduationYear: "2026",
      skills: [{ name: "Go", level: "Beginner" }],
      projects: [],
      currentStep: 9,
      profileCompleted: true
    });

    const dna1 = await getStudentDNAFull(userStale);
    assert.equal(dna1.snapshot.proofSummary.projectsCount, 0);

    // Now update profile by adding a project
    upsertStudentProfileByUserId(userStale, {
      projects: [{ title: "Go Microservice", description: "REST API in Go", techStack: ["Go"] }]
    });

    // Invalidate scope
    invalidateUserDNAScope(userStale);
    const dna2 = await getStudentDNAFull(userStale);
    assert.equal(dna2.snapshot.proofSummary.projectsCount, 1, "Snapshot must reflect newly added project after invalidation");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST K — Invalid AI Output Rejection
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST K — Invalid AI output: Unsupported claims downgraded to unknown", () => {
    // Model claims student is established in Kubernetes, but normalizedFacts has NO Kubernetes facts
    const guardRes = enforceEvidenceGuard(
      "established",
      "Model claims candidate has built large scale Kubernetes clusters.",
      "Kubernetes",
      "github",
      {
        repo_count: 1,
        top_languages: ["JavaScript"],
        commits_last_6mo: 2,
        top_repos: ["simple-todo-js"]
      } as any
    );

    assert.equal(guardRes.finalStatus, "unknown", "Must downgrade unsupported claim to unknown");
    assert.equal(guardRes.downgraded, true);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST L — Duplicate and Incomplete Records
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST L — Duplicate records: Deduplicates multiple entries referencing same artifact", () => {
    const userDup = "student-dup-" + Date.now();
    // Add resume claim for project
    addEvidenceItem({
      id: "ev1",
      studentId: userDup,
      sourceType: "resume",
      sourceId: "resume_1",
      capability: "Docker",
      claim: "Used Docker in E-commerce project",
      extractedEvidence: "Docker containerization",
      evidenceLevel: 1,
      confidence: "MEDIUM",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verificationStatus: "unverified",
      provenance: { sourceName: "Resume" },
      evidenceGroupId: "project_ecommerce"
    });

    // Add portfolio claim for the exact same project
    const secondAdd = addEvidenceItem({
      id: "ev2",
      studentId: userDup,
      sourceType: "project",
      sourceId: "project_1",
      capability: "Docker",
      claim: "Configured Docker compose for multi-service setup",
      extractedEvidence: "Dockerfile and docker-compose.yml present",
      evidenceLevel: 2,
      confidence: "HIGH",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verificationStatus: "corroborated",
      provenance: { sourceName: "Project Vault" },
      evidenceGroupId: "project_ecommerce"
    });

    assert.equal(secondAdd.isCorroborated, true, "Must flag as corroboration rather than duplicate count");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST M — Empty GitHub Integration
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST M — Empty GitHub integration: Does not invent repos or languages", async () => {
    const userNoGh = "student-no-gh-" + Date.now();
    registerTestUser(userNoGh, "No GH User");
    upsertStudentProfileByUserId(userNoGh, {
      fullName: "No GH User",
      college: "College",
      degree: "B.Tech",
      branch: "CSE",
      graduationYear: "2026",
      skills: [{ name: "SQL", level: "Intermediate" }],
      projects: [],
      currentStep: 9,
      profileCompleted: true
    });

    invalidateStudentDNACache(userNoGh);
    const dna = await getStudentDNA(userNoGh);
    assert.equal(dna.github_enrichment.provided, false, "GitHub enrichment must be provided: false");
    assert.equal(dna.github_enrichment.verified, false);
    assert.equal(dna.github_enrichment.reposCount, 0);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST N — Unsupported Readiness Score
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST N — Unsupported readiness score: No fabricated scores on empty dimensions", async () => {
    const userPartial = "student-partial-" + Date.now();
    registerTestUser(userPartial, "Partial User");
    upsertStudentProfileByUserId(userPartial, {
      fullName: "Partial User",
      college: "College",
      degree: "B.Tech",
      branch: "CSE",
      graduationYear: "2026",
      skills: [], // No skills yet
      currentStep: 2,
      profileCompleted: false
    });

    const completion = getStudentProfileCompletionState(userPartial);
    assert.equal(completion.state, "PARTIAL_PROFILE");
    // Ensure overall coverage is unknown or low without numbers
    const dnaFull = await getStudentDNAFull(userPartial);
    assert.equal(dnaFull.snapshot.strongestSkills.length, 0, "No fake strongest skills");
    assert.equal(dnaFull.snapshot.overallCoverage, "LOW");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST O — Real Evidence Grounding
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST O — Real evidence: Distinguishes student-reported vs verified facts", async () => {
    const userReal = "student-real-evidence-" + Date.now();
    registerTestUser(userReal, "Real Evidence Candidate");
    upsertStudentProfileByUserId(userReal, {
      fullName: "Real Evidence Candidate",
      college: "National Tech",
      degree: "B.Tech",
      branch: "CSE",
      graduationYear: "2026",
      skills: [
        { name: "Python", level: "Advanced" },
        { name: "React", level: "Intermediate" }
      ],
      projects: [
        {
          title: "Distributed Pipeline",
          description: "Kafka stream ingestion",
          techStack: ["Python", "Kafka"],
          githubUrl: "https://github.com/realcandidate/pipeline"
        }
      ],
      achievements: [
        {
          title: "CodeCon Hackathon 2026",
          type: "Hackathon",
          description: "Runner up for data processing bot"
        }
      ],
      currentStep: 9,
      profileCompleted: true
    });

    invalidateUserDNAScope(userReal);
    const dnaFull = await getStudentDNAFull(userReal);
    
    assert.equal(dnaFull.snapshot.proofSummary.hackathonsCount, 1, "Real hackathon recorded");
    assert.equal(dnaFull.snapshot.proofSummary.projectsCount, 1, "Real project recorded");
    
    // Check skills are grounded in evidence items
    const pythonSkill = dnaFull.skills.find(s => s.skillName === "Python");
    assert.ok(pythonSkill, "Python skill exists");
    assert.ok(pythonSkill.evidenceList.length > 0, "Python has real supporting evidence");
  });

  // ─────────────────────────────────────────────────────────────
  // TEST P — Source Retrieval Failure
  // ─────────────────────────────────────────────────────────────
  await t.test("TEST P — Source retrieval failure: Marked unavailable without penalizing student ability", async () => {
    const claimRes = await verifyHackathonClaim("test-p-user", {
      name: "Unavailable Hackathon",
      claimed_project_link: "https://invalid-nonexistent-domain-504-timeout.org/bad-url",
      claimed_description: "Real-time AI",
      claimed_result: "Submitted"
    });

    assert.equal(claimRes.verified.url_verified, false);
    assert.equal(claimRes.evidence[0].source_type, "hackathon_submission");
    assert.ok(claimRes.evidence[0].quote_or_fact.includes("Content could not be verified"));
  });
});
