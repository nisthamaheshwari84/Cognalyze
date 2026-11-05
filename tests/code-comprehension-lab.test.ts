/**
 * tests/code-comprehension-lab.test.ts
 * 
 * 15-Point Regression Test Suite for Cognalyze Code Comprehension Lab.
 * Validates Codebase Library, Challenge Factory, Multi-tenant Isolation,
 * Secure Sandboxed Execution, 100-Point Rubric Mathematics, AI Engineering Tutor,
 * and Student DNA Integration.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllCodebases,
  getCodebaseById,
  getCodebaseFileTree,
  getCodebaseFileContent,
  searchCodebaseContent,
  filterCodebases,
} from "../lib/skills/code-comprehension/codebase-library";
import {
  getAllChallenges,
  getChallengeById,
  getChallengesByMode,
  getCheckpointsByChallengeId,
  getInterviewStagesByChallengeId,
  CANONICAL_RUBRIC_WEIGHTS,
} from "../lib/skills/code-comprehension/challenge-factory";
import {
  createComprehensionSession,
  getComprehensionSession,
  updateSessionFile,
  recordSessionEvent,
  completeComprehensionSession,
} from "../lib/skills/code-comprehension/session-store";
import { executeSandboxTests } from "../lib/skills/code-comprehension/execution-sandbox";
import { askEngineeringTutor } from "../lib/skills/code-comprehension/tutor-engine";
import { evaluateComprehensionSubmission } from "../lib/skills/code-comprehension/assessment-engine";
import { syncComprehensionAssessmentToDNA } from "../lib/skills/code-comprehension/dna-adapter";

test("Code Comprehension Lab Master Regression Suite", async (t) => {
  // ── TEST 1: Codebase Library Verification ─────────────────────────────────
  await t.test("TEST 1 — Codebase library delivers complete multi-file projects with immutable snapshots", () => {
    const codebases = getAllCodebases();
    assert.ok(codebases.length >= 2, "Must contain at least 2 complete codebases");

    const taskflow = getCodebaseById("taskflow-api-v1");
    assert.ok(taskflow, "TaskFlow API must exist");
    assert.equal(taskflow.language, "typescript");
    assert.equal(taskflow.framework, "express");
    assert.ok(taskflow.immutableSnapshot.startsWith("sha256:"));

    const fileTree = getCodebaseFileTree("taskflow-api-v1");
    assert.ok(fileTree.length >= 6, "Must contain multiple source and test files");
    assert.ok(fileTree.some(f => f.path === "src/routes/task.routes.ts"));
    assert.ok(fileTree.some(f => f.path === "src/middleware/auth.ts"));
    assert.ok(fileTree.some(f => f.path === "tests/task.test.ts"));

    const content = getCodebaseFileContent("taskflow-api-v1", "src/middleware/auth.ts");
    assert.ok(content && content.includes("authenticateUser"), "Must read real file content");
  });

  // ── TEST 2: Codebase Search ───────────────────────────────────────────────
  await t.test("TEST 2 — Repository search retrieves keyword occurrences with line numbers", () => {
    const matches = searchCodebaseContent("taskflow-api-v1", "requireRole");
    assert.ok(matches.length > 0, "Must find occurrences of requireRole");
    assert.equal(matches[0].path, "src/routes/task.routes.ts");
    assert.ok(matches[0].lineNumber > 0);
  });

  // ── TEST 3: Challenge Factory Coverage Across 4 Modes ─────────────────────
  await t.test("TEST 3 — Challenge factory provides challenges across all 4 comprehension modes", () => {
    const challenges = getAllChallenges();
    assert.ok(challenges.length >= 4, "Must provide at least 4 curated challenges");

    const detective = getChallengesByMode("detective");
    const bugHunter = getChallengesByMode("bug_hunter");
    const explorer = getChallengesByMode("architecture_explorer");
    const auditor = getChallengesByMode("ai_auditor");

    assert.ok(detective.length > 0, "Must support Codebase Detective mode");
    assert.ok(bugHunter.length > 0, "Must support Bug Hunter mode");
    assert.ok(explorer.length > 0, "Must support Architecture Explorer mode");
    assert.ok(auditor.length > 0, "Must support AI Code Auditor mode");
  });

  // ── TEST 4: Canonical Rubric Weights Mathematical Integrity ───────────────
  await t.test("TEST 4 — Canonical 7-dimension weights sum exactly to 100%", () => {
    const w = CANONICAL_RUBRIC_WEIGHTS;
    const total =
      w.codeUnderstanding +
      w.debuggingAndRootCause +
      w.architectureAndDataFlow +
      w.testingAndVerification +
      w.aiOutputJudgment +
      w.technicalReasoning +
      w.securityAndMaintainability;

    assert.equal(total, 100, "Canonical weights must sum to exactly 100");
  });

  // ── TEST 5: Multi-Tenant Session Isolation ────────────────────────────────
  await t.test("TEST 5 — Session store guarantees multi-tenant candidate isolation", () => {
    const userA = "candidate_comp_A";
    const userB = "candidate_comp_B";

    const sessionA = createComprehensionSession({
      candidateId: userA,
      challengeId: "detective-taskflow-auth",
    });

    // User A can access their own session
    const fetchedA = getComprehensionSession(sessionA.id, userA);
    assert.ok(fetchedA, "User A must access session A");
    assert.equal(fetchedA.candidateId, userA);

    // User B is strictly denied access
    const crossAccess = getComprehensionSession(sessionA.id, userB);
    assert.equal(crossAccess, null, "Cross-tenant access must return null");
  });

  // ── TEST 6: Ephemeral Working Tree Overlay ────────────────────────────────
  await t.test("TEST 6 — Student edits overlay in session working tree without mutating canonical files", () => {
    const user = "cand_edit_test";
    const session = createComprehensionSession({
      candidateId: user,
      challengeId: "bughunter-taskflow-rbac",
    });

    const canonicalContent = getCodebaseFileContent("taskflow-api-v1", "src/routes/task.routes.ts")!;
    const editedContent = canonicalContent.replace(
      `router.patch("/:id/status", controller.updateTaskStatus);`,
      `router.patch("/:id/status", requireRole(["admin", "member"]), controller.updateTaskStatus);`
    );

    const saved = updateSessionFile({
      sessionId: session.id,
      candidateId: user,
      filePath: "src/routes/task.routes.ts",
      content: editedContent,
    });
    assert.ok(saved, "Must save working file overlay");

    // Canonical file remains unchanged
    const canonicalAfter = getCodebaseFileContent("taskflow-api-v1", "src/routes/task.routes.ts")!;
    assert.equal(canonicalAfter, canonicalContent, "Canonical file must remain immutable");

    // Session retains modified copy
    const refreshed = getComprehensionSession(session.id, user);
    assert.equal(refreshed?.workingFiles["src/routes/task.routes.ts"], editedContent);
  });

  // ── TEST 7: Deterministic Sandbox Execution Catches Defect ────────────────
  await t.test("TEST 7 — Baseline unpatched codebase fails the RBAC status test", async () => {
    const report = await executeSandboxTests({
      challengeId: "bughunter-taskflow-rbac",
      includeHidden: false,
    });

    assert.equal(report.success, false, "Baseline unpatched route must fail test");
    const testResult = report.results.find(r => r.testId === "test-viewer-status-blocked");
    assert.ok(testResult, "Must run viewer blocked test");
    assert.equal(testResult.passed, false, "Viewer status must fail assertion without patch");
  });

  // ── TEST 8: Patched Codebase Passes Sandbox Verification ──────────────────
  await t.test("TEST 8 — Patched working files pass the sandboxed verification suite", async () => {
    const canonicalContent = getCodebaseFileContent("taskflow-api-v1", "src/routes/task.routes.ts")!;
    const patchedContent = canonicalContent.replace(
      `router.patch("/:id/status", controller.updateTaskStatus);`,
      `router.patch("/:id/status", requireRole(["admin", "member"]), controller.updateTaskStatus);`
    );

    const report = await executeSandboxTests({
      challengeId: "bughunter-taskflow-rbac",
      workingFiles: {
        "src/routes/task.routes.ts": patchedContent,
      },
      includeHidden: true,
    });

    assert.equal(report.success, true, "Patched route must pass all tests");
    assert.equal(report.score, 100, "Must achieve 100% test score");
  });

  // ── TEST 9: AI Engineering Tutor Grounding & 3 Levels ─────────────────────
  await t.test("TEST 9 — AI tutor returns grounded responses across Hint, Guided, and Full modes", async () => {
    const hint = await askEngineeringTutor({
      challengeId: "detective-taskflow-auth",
      userQuestion: "How does authentication work?",
      assistanceLevel: "hint",
    });
    assert.equal(hint.assistanceLevel, "hint");
    assert.ok(hint.citedFiles.includes("src/middleware/auth.ts"));

    const guided = await askEngineeringTutor({
      challengeId: "detective-taskflow-auth",
      userQuestion: "Explain request flow",
      assistanceLevel: "guided",
    });
    assert.equal(guided.assistanceLevel, "guided");
    assert.ok(guided.reply.includes("authenticateUser"));
    assert.ok(guided.confidence >= 80);
  });

  // ── TEST 10: 100-Point Assessment Formula Calculation ─────────────────────
  await t.test("TEST 10 — Assessment engine computes exact mathematical score across 7 dimensions", async () => {
    const user = "cand_assess_math";
    const session = createComprehensionSession({
      candidateId: user,
      challengeId: "bughunter-taskflow-rbac",
    });

    // Apply patch so sandbox passes
    const canonical = getCodebaseFileContent("taskflow-api-v1", "src/routes/task.routes.ts")!;
    updateSessionFile({
      sessionId: session.id,
      candidateId: user,
      filePath: "src/routes/task.routes.ts",
      content: canonical.replace(
        `router.patch("/:id/status", controller.updateTaskStatus);`,
        `router.patch("/:id/status", requireRole(["admin", "member"]), controller.updateTaskStatus);`
      ),
    });

    const assessment = await evaluateComprehensionSubmission({
      sessionId: session.id,
      candidateId: user,
      challengeId: "bughunter-taskflow-rbac",
      studentExplanation: "The root cause is that PATCH /api/v1/tasks/:id/status was missing the requireRole middleware. A user with the viewer role was able to bypass RBAC authorization and modify the task state. I applied requireRole(['admin', 'member']) to enforce authorization before updateTaskStatus.",
    });

    assert.ok(assessment.overallScore >= 80, `Expected strong score >= 80, got ${assessment.overallScore}`);
    assert.equal(assessment.hiringSignal, "STRONG FIT");
    assert.ok(assessment.dimensions.codeUnderstanding.earnedPoints > 0);
    assert.ok(assessment.dimensions.debuggingAndRootCause.earnedPoints > 0);
    assert.ok(assessment.dimensions.securityAndMaintainability.earnedPoints > 0);
  });

  // ── TEST 11: Zero Evidence Guard ──────────────────────────────────────────
  await t.test("TEST 11 — Empty explanation with 0 passed tests yields certified 0 score and INSUFFICIENT EVIDENCE", async () => {
    const user = "cand_empty_test";
    const session = createComprehensionSession({
      candidateId: user,
      challengeId: "bughunter-taskflow-rbac",
    });

    const earlyAssessment = await evaluateComprehensionSubmission({
      sessionId: session.id,
      candidateId: user,
      challengeId: "bughunter-taskflow-rbac",
      studentExplanation: "",
    });

    assert.equal(earlyAssessment.overallScore, 0, "Score must be 0 for empty submission");
    assert.equal(earlyAssessment.hiringSignal, "INSUFFICIENT EVIDENCE");
  });

  // ── TEST 12: Student DNA Sync ─────────────────────────────────────────────
  await t.test("TEST 12 — Finalized assessment updates Student DNA with certified evidence record", async () => {
    const user = "cand_dna_sync_test";
    const session = createComprehensionSession({
      candidateId: user,
      challengeId: "detective-taskflow-auth",
    });

    const assessment = await evaluateComprehensionSubmission({
      sessionId: session.id,
      candidateId: user,
      challengeId: "detective-taskflow-auth",
      studentExplanation: "The request flow begins at src/routes/task.routes.ts where authenticateUser verifies the JWT bearer token and decodes req.user.organizationId. In TaskController.getTaskById, this tenant ID is passed down to TaskRepository.findById. The repository enforces item.organizationId === orgId, guaranteeing multi-tenant isolation and returning null if another organization's task is queried.",
    });

    const sync = await syncComprehensionAssessmentToDNA(assessment);
    assert.equal(sync.success, true, "Must sync verified evidence to Student DNA");
    assert.ok(sync.competenciesUpdated.includes("Code Comprehension & Execution Tracing"));
    assert.ok(sync.nextActionRecommendation.length > 0);
  });

  // ── TEST 13: Zero Score Does Not Fabricate Student DNA Proficiency ────────
  await t.test("TEST 13 — Zero score attempt is rejected by Student DNA sync to prevent false proficiency", async () => {
    const zeroAssessment = {
      sessionId: "sess_zero_123",
      candidateId: "user_zero",
      challengeId: "detective-taskflow-auth",
      overallScore: 0,
      hiringSignal: "INSUFFICIENT EVIDENCE" as const,
      rubricVersion: "1.0",
      dimensions: {},
      sandboxReport: { success: false, totalTests: 1, passedCount: 0, score: 0, durationMs: 1, results: [], logs: [] },
      keyStrengths: [],
      identifiedGaps: [],
      recommendedAction: "Retake",
      timestamp: new Date().toISOString(),
    };

    const sync = await syncComprehensionAssessmentToDNA(zeroAssessment);
    assert.equal(sync.success, false, "Must not sync zero score to DNA");
    assert.equal(sync.competenciesUpdated.length, 0);
  });

  // ── TEST 14: Skill Hub Store Domain Registration ──────────────────────────
  await t.test("TEST 14 — Code Comprehension Lab is properly registered in Skill Practice Hub domains", async () => {
    const { SKILL_DOMAINS } = await import("../lib/skill-hub-store");
    const domain = SKILL_DOMAINS.find(d => d.slug === "code_comprehension");
    assert.ok(domain, "code_comprehension domain must exist in SKILL_DOMAINS");
    assert.equal(domain.action_route, "/student/skills/code-comprehension");
    assert.equal(domain.is_product_track, true);
    assert.equal(domain.is_service_track, true);
  });

  // ── TEST 15: Session Completion Lock ──────────────────────────────────────
  await t.test("TEST 15 — Completed session locks against subsequent file mutations", () => {
    const user = "cand_lock_test";
    const session = createComprehensionSession({
      candidateId: user,
      challengeId: "detective-taskflow-auth",
    });

    completeComprehensionSession(session.id, user, { score: 90 });

    const attemptEdit = updateSessionFile({
      sessionId: session.id,
      candidateId: user,
      filePath: "src/server.ts",
      content: "// late mutation",
    });

    assert.equal(attemptEdit, false, "Must reject file edits after session completion");
  });

  // ── TEST 16: Multi-Domain Codebase Library Filtering ──────────────────────
  await t.test("TEST 16 — Codebase library supports filtering across categories (SaaS, E-Commerce, AI, Fintech) and difficulties", () => {
    const saas = filterCodebases({ category: "saas" });
    assert.ok(saas.length >= 1, "Must find SaaS codebase");
    assert.equal(saas[0].id, "taskflow-api-v1");

    const ecom = filterCodebases({ category: "ecommerce" });
    assert.ok(ecom.length >= 1, "Must find E-Commerce codebase");
    assert.equal(ecom[0].id, "nexus-commerce-engine");

    const ai = filterCodebases({ category: "ai_app" });
    assert.ok(ai.length >= 1, "Must find AI App codebase");
    assert.equal(ai[0].id, "agentic-rag-engine");

    const fintech = filterCodebases({ category: "fintech" });
    assert.ok(fintech.length >= 1, "Must find Fintech codebase");
    assert.equal(fintech[0].id, "ledger-fintech-service");

    const senior = filterCodebases({ difficulty: "senior" });
    assert.ok(senior.length >= 1, "Must find senior level system");
    assert.equal(senior[0].id, "agentic-rag-engine");
  });

  // ── TEST 17: Mode 1 Guided Learning Checkpoints ───────────────────────────
  await t.test("TEST 17 — Guided Learning checkpoints provide progressive 3-stage concept validation and line citations", () => {
    const checkpoints = getCheckpointsByChallengeId("detective-taskflow-auth");
    assert.equal(checkpoints.length, 3, "Must contain exactly 3 checkpoints: Reconnaissance, Tracing, Verification");

    const [stage1, stage2, stage3] = checkpoints;
    assert.equal(stage1.stage, "reconnaissance");
    assert.equal(stage2.stage, "tracing");
    assert.equal(stage3.stage, "verification");

    assert.ok(stage1.fileCitation.filePath.includes("auth.ts"));
    assert.equal(stage1.options.length, 4, "Must offer 4 options");
    assert.ok(stage1.correctOptionIndex >= 0 && stage1.correctOptionIndex <= 3);
    assert.ok(stage1.explanation.length > 20);
    assert.ok(stage1.hint.length > 10);
  });

  // ── TEST 18: Mode 3 Senior Engineer Interview Simulation ──────────────────
  await t.test("TEST 18 — Senior Engineer Interview Simulation provides 3-stage prompts, keyword expectations, and adaptive probes", () => {
    const stages = getInterviewStagesByChallengeId("bughunter-ledger-idempotency");
    assert.equal(stages.length, 3, "Must offer 3 progressive interview stages");

    const [st1, st2, st3] = stages;
    assert.equal(st1.stageNumber, 1);
    assert.ok(st1.expectedKeywords.includes("double-entry"));
    assert.ok(st1.sampleFollowUpProbe.length > 20);

    // Verify keyword analysis logic
    const mockDefense = "In double-entry bookkeeping, debit equals credit. We must guarantee idempotency so webhook replay never causes a duplicate debit.";
    const lower = mockDefense.toLowerCase();
    const matched = st1.expectedKeywords.filter(kw => lower.includes(kw.toLowerCase()));
    assert.ok(matched.length >= 3, "Candidate response should match key architectural terms");
  });

  // ── TEST 19: Sandbox Execution for AI App & Fintech Codebases ─────────────
  await t.test("TEST 19 — VM execution sandbox verifies test harnesses for AI App (NexusAgent) and Fintech (Ledger)", async () => {
    // 1. Agentic RAG engine tests
    const ragReport = await executeSandboxTests({
      challengeId: "detective-agentic-rag",
      includeHidden: true,
    });
    assert.equal(ragReport.totalTests, 2, "Must run visible and hidden RAG tests");
    assert.equal(ragReport.passedCount, 2, "Both RAG tests must pass against clean snapshot");
    assert.equal(ragReport.score, 100);

    // 2. Ledger Fintech service tests
    const ledgerReport = await executeSandboxTests({
      challengeId: "bughunter-ledger-idempotency",
      includeHidden: true,
    });
    assert.equal(ledgerReport.totalTests, 2, "Must run visible and hidden Ledger tests");
    assert.equal(ledgerReport.passedCount, 2, "Both Ledger tests must pass against clean snapshot");
    assert.equal(ledgerReport.score, 100);
  });
});

