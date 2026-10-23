/**
 * tests/mock-interview-restructure.test.ts
 * 
 * Verification Test Suite for Mock Interview & Skill Practice Hub Restructuring:
 * 1. Primary Navigation & Separation of Modules
 * 2. Personalized Interview Configuration (Role, Company, Level, Type, Skills, Duration, Difficulty)
 * 3. Dynamic Adaptive Blueprint Planning by Interview Type
 * 4. Adaptive Questioning & Socratic Follow-Up Behavior
 * 5. Complete Lifecycle, Scorecard Telemetry & Multi-Tenant Data Isolation
 */

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

import {
  generateInterviewBlueprint,
  createAdvancedSessionState,
  CandidateInterviewDossier,
  InterviewType,
} from "../lib/ai/interview-engine";

import {
  saveSession,
  getSessionHistory,
  InterviewSession,
} from "../lib/interview-session-store";

test("Personalized Interview Arena & Actual Interview Verification Suite", async (t) => {

  // ── TEST 1: Primary Navigation includes both Interviews and Personalized Interview Arena ──
  await t.test("1. AppNav contains Interviews and Personalized Interview Arena", () => {
    const appNavPath = path.join(process.cwd(), "components", "AppNav.tsx");
    assert.ok(fs.existsSync(appNavPath), "components/AppNav.tsx must exist");
    const content = fs.readFileSync(appNavPath, "utf-8");

    // Must have original Interviews in navigation
    assert.ok(
      content.includes('label: "Interviews"'),
      "studentNavItems must contain label 'Interviews'"
    );
    assert.ok(
      content.includes('href: "/interview"'),
      "Interviews must link directly to '/interview'"
    );

    // Must have Personalized Interview Arena in navigation
    assert.ok(
      content.includes('label: "Personalized Interview Arena"'),
      "studentNavItems must contain label 'Personalized Interview Arena'"
    );
    assert.ok(
      content.includes('href: "/student/practice-interview"'),
      "Personalized Interview Arena must link to '/student/practice-interview'"
    );

    // Must also have Skill Practice Hub
    assert.ok(
      content.includes('label: "Skill Practice Hub"'),
      "studentNavItems must contain 'Skill Practice Hub'"
    );
    assert.ok(
      content.includes('href: "/skill-practice"'),
      "Skill Practice Hub must link to '/skill-practice'"
    );
  });

  // ── TEST 2: Active route matching for both interview modes ──
  await t.test("2. AppNav activates correct items across /interview and /student/practice-interview", () => {
    const appNavPath = path.join(process.cwd(), "components", "AppNav.tsx");
    const content = fs.readFileSync(appNavPath, "utf-8");

    assert.ok(
      content.includes('pathname === "/interview"'),
      "isItemActive must check pathname === '/interview'"
    );
    assert.ok(
      content.includes('pathname === "/student/practice-interview"'),
      "isItemActive must check pathname === '/student/practice-interview'"
    );
    assert.ok(
      content.includes('pathname === "/student/interview-prep"'),
      "isItemActive must check interview prep routes"
    );
  });

  // ── TEST 3: Original interview preserved and Personalized Interview Arena rendered ──
  await t.test("3. Original actual interview preserved in /interview and Personalized Arena in /student/practice-interview", () => {
    const interviewPagePath = path.join(process.cwd(), "app", "interview", "page.tsx");
    const practicePagePath = path.join(process.cwd(), "app", "student", "practice-interview", "page.tsx");

    assert.ok(fs.existsSync(interviewPagePath), "app/interview/page.tsx must exist");
    assert.ok(fs.existsSync(practicePagePath), "app/student/practice-interview/page.tsx must exist");

    const interviewContent = fs.readFileSync(interviewPagePath, "utf-8");
    const practiceContent = fs.readFileSync(practicePagePath, "utf-8");

    // Original interview must contain its authentic proctoring and vision pipeline
    assert.ok(
      interviewContent.includes("VisionPipeline") && interviewContent.includes("TemporalTracker"),
      "app/interview/page.tsx must preserve the original actual interview with VisionPipeline & TemporalTracker"
    );
    assert.ok(
      practiceContent.includes("MockInterviewExperience"),
      "app/student/practice-interview/page.tsx must render MockInterviewExperience"
    );
  });

  function createTestDossier(candidateId: string, name: string, targetRole: string, expMode: any = "experienced"): CandidateInterviewDossier {
    return {
      candidateId,
      name,
      targetRole,
      experienceYears: expMode === "fresher" ? 0 : 4,
      experienceMode: expMode,
      careerIntent: "Grow as an engineer",
      verifiedSkills: ["System Design", "TypeScript"],
      claimedSkills: ["Architecture", "Go"],
      evidenceItems: [],
      projects: [{ title: "Scale Infra", tech: ["AWS", "Docker"], verificationStatus: "verified" }],
      githubStatus: { connected: false, publicRepos: 0, accessibleRepos: [], limitations: [] },
      linkedinStatus: { connected: false, limitations: [] },
      missingOrUnverified: [],
      previousInterviewWeaknesses: [],
    };
  }

  // ── TEST 4: Personalized Blueprint supports Behavioral Interview Type ──
  await t.test("4. Blueprint generator adapts section plan for Behavioral interview type", () => {
    const mockDossier = createTestDossier("cand_test_behavioral", "Jane Doe", "Engineering Manager", "experienced");

    const blueprint = generateInterviewBlueprint(
      mockDossier,
      "Engineering Manager",
      45,
      "experienced",
      "sess_behav_01",
      "Leadership and scaling teams",
      "behavioral",
      "Amazon",
      "Conflict Resolution, STAR method"
    );

    assert.strictEqual(blueprint.interviewType, "behavioral");
    assert.strictEqual(blueprint.targetCompany, "Amazon");

    const behavioralSection = blueprint.sectionPlan.find((s) => s.section === "behavioral");
    assert.ok(behavioralSection, "Section plan must contain 'behavioral' section");
    assert.ok(
      behavioralSection.targetTurns >= 3,
      `Behavioral interview must allocate majority turns to behavioral scenarios (got ${behavioralSection.targetTurns})`
    );
  });

  // ── TEST 5: Personalized Blueprint supports System Design Interview Type ──
  await t.test("5. Blueprint generator adapts section plan for System Design interview type", () => {
    const mockDossier = createTestDossier("cand_test_sysdesign", "Alex Smith", "Staff Systems Engineer", "experienced");

    const blueprint = generateInterviewBlueprint(
      mockDossier,
      "Staff Systems Engineer",
      45,
      "experienced",
      "sess_sys_01",
      "High scale distributed microservices",
      "system_design",
      "Uber",
      "Distributed Caching, Sharding, Consensus"
    );

    assert.strictEqual(blueprint.interviewType, "system_design");
    assert.strictEqual(blueprint.targetCompany, "Uber");

    const sysDesignSection = blueprint.sectionPlan.find((s) => s.section === "coding_system_design");
    assert.ok(sysDesignSection, "Section plan must contain 'coding_system_design' section");
    assert.ok(
      sysDesignSection.targetTurns >= 3,
      `System Design round must allocate high turn budget to system design (got ${sysDesignSection.targetTurns})`
    );
  });

  // ── TEST 6: Technical Interview includes CS Fundamentals & DSA ──
  await t.test("6. Blueprint generator for Technical interview includes both fundamentals and coding/DSA", () => {
    const mockDossier = createTestDossier("cand_test_tech", "Bob Dev", "Software Engineer", "fresher");

    const blueprint = generateInterviewBlueprint(
      mockDossier,
      "Software Engineer Fresher",
      45,
      "fresher",
      "sess_tech_01",
      "Algorithms, Data Structures, Concurrency & SQL",
      "technical",
      "Google",
      "DSA, Operating Systems, SQL"
    );

    assert.strictEqual(blueprint.interviewType, "technical");
    const fundamentalsSection = blueprint.sectionPlan.find((s) => s.section === "technical_fundamentals");
    const codingSection = blueprint.sectionPlan.find((s) => s.section === "coding_system_design");

    assert.ok(fundamentalsSection, "Technical round must include 'technical_fundamentals'");
    assert.ok(codingSection, "Technical round must include 'coding_system_design'");
    assert.ok(fundamentalsSection.targetTurns >= 2, "Must allocate turns to fundamentals");
    assert.ok(codingSection.targetTurns >= 2, "Must allocate turns to coding/DSA");
  });

  // ── TEST 7: Specific Skills Focus creates targeted blueprint competency ──
  await t.test("7. Providing technical skills focus creates dedicated targeted competency", () => {
    const mockDossier = createTestDossier("cand_test_focus", "Charlie", "Full Stack Engineer", "1-3yr");

    const blueprint = generateInterviewBlueprint(
      mockDossier,
      "Full Stack Engineer",
      45,
      "1-3yr",
      "sess_focus_01",
      "Web applications with Next.js and Postgres",
      "technical",
      "Stripe",
      "PostgreSQL Indexing, React Concurrency"
    );

    const focusComp = blueprint.competencies.find((c) => c.id === "comp-candidate-skills-focus");
    assert.ok(focusComp, "Must create dedicated competency for specified skills focus");
    assert.ok(
      focusComp.name.includes("PostgreSQL Indexing, React Concurrency"),
      "Competency name must cite candidate focus skills"
    );
  });

  // ── TEST 8: Session State Management & Initial Opening State ──
  await t.test("8. AdvancedSessionState initializes with GREETING state and turnCount 0", () => {
    const mockDossier = createTestDossier("cand_test_state", "Diana", "Backend Engineer", "1-3yr");

    const blueprint = generateInterviewBlueprint(mockDossier, "Backend Engineer", 30);
    const sessionState = createAdvancedSessionState(blueprint, mockDossier, "sess_state_01");

    assert.strictEqual(sessionState.openingState, "GREETING");
    assert.strictEqual(sessionState.turns.length, 0);
    assert.strictEqual(sessionState.consecutiveShallow, 0);
    assert.strictEqual(sessionState.answerDistribution.strong, 0);
    assert.strictEqual(sessionState.answerDistribution.shallow, 0);
  });

  // ── TEST 9: Completed Session Persistence against Authenticated User ──
  await t.test("9. saveSession persists completed session with rich metadata and prevents cross-user leakage", async () => {
    const candidateA = `candidate_test_alice_${Date.now()}`;
    const candidateB = `candidate_test_bob_${Date.now()}`;

    // Save session for candidate A
    const sessionA = await saveSession({
      candidate_id: candidateA,
      session_type: "mock_interview",
      experience_mode: "1-3yr",
      target_role: "Backend Engineer",
      target_company: "Stripe",
      interview_type: "technical",
      difficulty: "adaptive",
      duration_minutes: 45,
      topics_covered: ["PostgreSQL", "Concurrency", "API Design"],
      answer_distribution: { strong: 3, adequate: 2, shallow: 1, off_topic: 0 },
      security_flags: { tab_switches: 0, face_violations: 0 },
      overall_score: 86,
      weak_topics_identified: ["High-scale database connection pooling"],
      created_at: new Date().toISOString(),
    });

    assert.ok(sessionA.id, "Session must have an ID");
    assert.strictEqual(sessionA.candidate_id, candidateA);
    assert.strictEqual(sessionA.overall_score, 86);
    assert.strictEqual(sessionA.target_company, "Stripe");

    // Candidate A must see their session
    const historyA = await getSessionHistory(candidateA);
    assert.ok(historyA.length > 0, "Candidate A must have at least 1 session");
    const foundSessionA = historyA.find((s) => s.id === sessionA.id);
    assert.ok(foundSessionA, "Candidate A history must contain sessionA");
    assert.strictEqual(foundSessionA.overall_score, 86);

    // Candidate B must NOT see Candidate A's session
    const historyB = await getSessionHistory(candidateB);
    const leakedSession = historyB.find((s) => s.id === sessionA.id);
    assert.strictEqual(leakedSession, undefined, "Candidate B MUST NOT have access to Candidate A's session");
  });

  // ── TEST 10: History Page and Report Screen Navigation Integration ──
  await t.test("10. History page links back to /interview and /skill-practice without dead ends", () => {
    const historyPagePath = path.join(process.cwd(), "app", "student", "interview-prep", "history", "page.tsx");
    assert.ok(fs.existsSync(historyPagePath), "History page must exist");
    const content = fs.readFileSync(historyPagePath, "utf-8");

    assert.ok(content.includes('href="/interview"'), "History page must link to '/interview'");
    assert.ok(content.includes('href="/skill-practice"'), "History page must link to '/skill-practice'");
    assert.ok(content.includes("Mock Interview"), "History page must reference Mock Interview");
  });

});
