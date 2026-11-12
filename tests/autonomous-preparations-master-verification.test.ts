/**
 * COGNALYZE AUTONOMOUS OPPORTUNITY PREPARATION ENGINE
 * Comprehensive Master Verification Suite (Part 13 + Experience Intelligence Criteria)
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { getAllPreparationArenas, getPreparationArenaBySlug } from "../lib/skills/preparations/canonical-arenas-registry";
import { preparationOrchestrator } from "../lib/skills/preparations/orchestrator";
import { autonomousAssessmentEngine } from "../lib/skills/preparations/autonomous-assessment-engine";
import { autonomousInterviewStudio } from "../lib/skills/preparations/interview-studio-engine";
import { githubDiscoveryEngine } from "../lib/skills/preparations/github-discovery-engine";
import {
  EXPERIENCE_KNOWLEDGE_BASE,
  computeSourceCoverageReport,
  explainResourceForStudent,
} from "../lib/skills/preparations/experience-knowledge-base";
import { videoIntelligenceEngine } from "../lib/skills/preparations/video-intelligence-engine";
import { buildPersonalizedPlaybookFromJourneys } from "../lib/skills/preparations/journey-reconstruction-engine";
import { proposalEvaluator } from "../lib/skills/preparations/proposal-evaluator";
import { preparationsStore } from "../lib/skills/preparations/arena-store";
import { createUser, createSession } from "../lib/auth/store";
import { addStudentEvidenceRecord } from "../lib/dna/store";
import { GET as getArenaAPI, POST as postArenaAPI } from "../app/api/skills/preparations/[arenaId]/route";
import { GET as getCatalogAPI } from "../app/api/skills/preparations/route";

describe("Autonomous Opportunity Preparation & Experience Intelligence Master Verification", () => {
  test("1. Cycle-Aware Opportunity Dates: GSoC 2027 upcoming cycle, JPMC, Imagine Cup, SIH & non-expired timelines", () => {
    const gsoc = getPreparationArenaBySlug("gsoc-2027");
    assert.ok(gsoc, "gsoc-2027 must exist");
    assert.equal(gsoc.cycleYear, 2027);
    assert.equal(gsoc.cycleStatus, "upcoming_unannounced");
    assert.equal(gsoc.dateVerificationStatus, "estimated_from_previous_cycle");
    assert.ok(new Date(gsoc.applicationDeadline).getFullYear() >= 2027, "GSoC deadline must target 2027 cycle");

    const allArenas = getAllPreparationArenas();
    const slugs = allArenas.map(a => a.slug);
    assert.ok(slugs.includes("jpmc-code-for-good-2027"), "Must include JPMC Code for Good");
    assert.ok(slugs.includes("microsoft-imagine-cup-2027"), "Must include Microsoft Imagine Cup");
    assert.ok(slugs.includes("sih-2027"), "Must include Smart India Hackathon");
  });

  test("2. Different Student DNA profiles produce distinct dependency roadmaps and assessments", async () => {
    const uidA = `verify-stu-a-${Date.now()}`;
    const uidB = `verify-stu-b-${Date.now()}`;

    // Student A: beginner with no verified skills
    // Student B: has verified Go & Git skills
    const resGo = await addStudentEvidenceRecord(uidB, {
      userId: uidB,
      sourceType: "assessment",
      sourceId: "seed-go-1",
      skillRaw: "Go",
      evidenceType: "assessment_verified",
      claim: "Verified Go systems assessment",
      strength: 0.9,
      trustedServerVerified: true,
      metadata: { score: 90 },
    });
    assert.ok(resGo.success, resGo.error);

    const resGit = await addStudentEvidenceRecord(uidB, {
      userId: uidB,
      sourceType: "assessment",
      sourceId: "seed-git-1",
      skillRaw: "Git",
      evidenceType: "assessment_verified",
      claim: "Verified Git rebase workflow",
      strength: 0.9,
      trustedServerVerified: true,
      metadata: { score: 92 },
    });
    assert.ok(resGit.success, resGit.error);

    const ctxA = await preparationOrchestrator.orchestrateArenaAsync(uidA, "gsoc-2027", { allowNetwork: false, isAuthenticated: true });
    const ctxB = await preparationOrchestrator.orchestrateArenaAsync(uidB, "gsoc-2027", { allowNetwork: false, isAuthenticated: true });

    assert.ok(ctxA && ctxB);
    assert.ok(ctxB.studentDNA.verifiedSkills.length > ctxA.studentDNA.verifiedSkills.length, "Student B must show more verified skills");

    // Roadmaps must differ in competency focus / mastery state
    assert.notEqual(
      ctxA.dependencyRoadmap[0].expectedCompetency,
      ctxB.dependencyRoadmap[0].expectedCompetency,
      "Different DNA profiles must produce different priority roadmap objectives"
    );

    // Assessments must differ cleanly between Student A and Student B
    const assessA = autonomousAssessmentEngine.generateAutonomousAssessment(
      "gsoc-2027",
      "beginner",
      ctxA.studentDNA.verifiedSkills.map(s => s.skill),
      ctxA.studentDNA.identifiedSkillGaps.map(g => g.skill),
      ctxA.studentDNA.programmingLanguages
    );
    const assessB = autonomousAssessmentEngine.generateAutonomousAssessment(
      "gsoc-2027",
      "intermediate",
      ctxB.studentDNA.verifiedSkills.map(s => s.skill),
      ctxB.studentDNA.identifiedSkillGaps.map(g => g.skill),
      ["Go"]
    );

    assert.notDeepEqual(
      assessA.questions.map(q => q.id),
      assessB.questions.map(q => q.id),
      "Different students must receive distinct personalized assessments"
    );
  });

  test("3. Open Source Discovery excludes closed issues, provides explainable compatibility & 10-stage workspace", async () => {
    const ctx = await preparationOrchestrator.orchestrateArenaAsync("oss-test-user", "gsoc-2027", { allowNetwork: false });
    assert.ok(ctx);
    assert.ok(ctx.githubDiscovery.opportunities.length > 0, "Must return active open-source opportunities");

    for (const opp of ctx.githubDiscovery.opportunities) {
      assert.notEqual(opp.openStatus, "closed", "Closed issues must never be presented as active opportunities");
      assert.ok(opp.issueUrl.startsWith("https://github.com/"), `Valid GitHub URL required for ${opp.id}`);
      assert.ok(opp.compatibility.explainableReasons.length > 0, "Explainable compatibility reasons required");
      assert.equal(opp.contributionWorkspacePlan.length, 10, "Must provide 10-stage contribution workspace");
    }
  });

  test("4. GitHub PR Verifier never falsely marks unverified or invalid PR URLs as merged/verified", async () => {
    const check = await githubDiscoveryEngine.verifyPullRequestUrl("https://not-github.com/fake/pr");
    assert.equal(check.verified, false);
    assert.equal(check.status, "unverified_check_failed");
  });

  test("5. Assessment attempts persist and update Student DNA", async () => {
    const uid = `assess-persist-${Date.now()}`;
    const arena = getPreparationArenaBySlug("flipkart-grid-7")!;
    const session = autonomousAssessmentEngine.generateAutonomousAssessment("flipkart-grid-7", "intermediate", []);

    const strongResponses: Record<string, string> = {};
    for (const q of session.questions) {
      if (q.type === "conceptual" && q.correctAnswer) strongResponses[q.id] = q.correctAnswer;
      else strongResponses[q.id] = "Sort by deadline and use max-heap greedy scheduling with O(N log N) priority queue + atomic Redis Lua lock + unit test.";
    }

    const { evaluation, persistedAttempt } = await autonomousAssessmentEngine.evaluateAndPersistAssessment({
      candidateId: uid,
      arena,
      session,
      submittedAnswers: strongResponses,
    });

    assert.ok(evaluation.passed, "Strong responses should pass evaluation");
    assert.equal(persistedAttempt.status, "completed");

    const stored = preparationsStore.getAssessmentAttempt(uid, arena.id, session.sessionId);
    assert.ok(stored, "Assessment attempt must persist across reads");
    assert.equal(stored.percentage, evaluation.percentage);
  });

  test("6. Conversational Technical Interview turns evaluate across 4 pillars and persist", async () => {
    const uid = `interview-persist-${Date.now()}`;
    const arena = getPreparationArenaBySlug("amazon-hackon-2026")!;
    const ctx = await preparationOrchestrator.orchestrateArenaAsync(uid, "amazon-hackon-2026", { allowNetwork: false });
    assert.ok(ctx);

    let session = await autonomousInterviewStudio.startInterviewSession({
      candidateId: uid,
      arena,
      dna: ctx.studentDNA,
      mode: "technical_interview",
    });
    assert.equal(session.status, "active");
    assert.equal(session.turns.length, 1);

    for (let i = 0; i < 4; i++) {
      session = await autonomousInterviewStudio.submitInterviewTurn({
        candidateId: uid,
        arena,
        dna: ctx.studentDNA,
        sessionId: session.sessionId,
        studentResponse: "Use idempotency keys backed by PostgreSQL unique transaction constraints, exponential backoff with jitter, and bounded circuit breakers.",
      });
    }

    assert.equal(session.status, "completed");
    assert.ok(session.finalReport, "Completed interview must generate final report");
    assert.ok(session.finalReport.averages.technicalCorrectness >= 5);

    const persisted = preparationsStore.getInterviewSession(uid, arena.id, session.sessionId);
    assert.ok(persisted && persisted.status === "completed");
  });

  test("7. Strict User Isolation: Authenticated user A receives 403 Forbidden if querying/mutating user B", async () => {
    const userA = createUser({
      id: `iso-a-${Date.now()}`,
      email: `iso-a-${Date.now()}@test.local`,
      passwordHash: null,
      passwordSalt: null,
      accountType: "student",
      status: "ACTIVE",
    });
    const sessionA = createSession(userA.id, "student");
    const cookieHeader = `cognalyze_session=${sessionA.token}`;

    // Attempt to GET Catalog with another user's candidateId
    const resCat = await getCatalogAPI(
      new NextRequest("http://localhost:3000/api/skills/preparations?candidateId=victim-user-999", {
        headers: { cookie: cookieHeader },
      })
    );
    assert.equal(resCat.status, 403, "Catalog API must reject cross-user candidateId query");

    // Attempt to GET Arena with another user's candidateId
    const resGet = await getArenaAPI(
      new NextRequest("http://localhost:3000/api/skills/preparations/gsoc-2027?candidateId=victim-user-999", {
        headers: { cookie: cookieHeader },
      }),
      { params: Promise.resolve({ arenaId: "gsoc-2027" }) }
    );
    assert.equal(resGet.status, 403, "Arena GET API must reject cross-user inspection");

    // Attempt to POST Arena mutation with another user's candidateId
    const resPost = await postArenaAPI(
      new NextRequest("http://localhost:3000/api/skills/preparations/gsoc-2027", {
        method: "POST",
        headers: { cookie: cookieHeader, "content-type": "application/json" },
        body: JSON.stringify({ candidateId: "victim-user-999", action: "set_level", level: "advanced" }),
      }),
      { params: Promise.resolve({ arenaId: "gsoc-2027" }) }
    );
    assert.equal(resPost.status, 403, "Arena POST API must reject cross-user mutation");

    // Attempt to fake 'independently_verified' on a roadmap node by just clicking it
    const resFakeVerify = await postArenaAPI(
      new NextRequest("http://localhost:3000/api/skills/preparations/gsoc-2027", {
        method: "POST",
        headers: { cookie: cookieHeader, "content-type": "application/json" },
        body: JSON.stringify({ action: "update_roadmap_node", nodeId: "gsoc-2027-node-1-foundation", masteryState: "independently_verified" }),
      }),
      { params: Promise.resolve({ arenaId: "gsoc-2027" }) }
    );
    assert.equal(resFakeVerify.status, 400, "Opening/clicking a node must not allow faking independently_verified state");
  });

  test("8. Proposal Evaluator explicitly differentiates AI guidance from Official Mentor approval", () => {
    const gsoc = getPreparationArenaBySlug("gsoc-2027")!;
    const res = proposalEvaluator.evaluateProposal(gsoc, "Too short draft");
    assert.equal(res.verdict, "NEEDS_REVISION");
    assert.equal(res.sourceAttribution, "AI-Generated Evaluation — Not Official Mentor Approval");
  });

  test("9. Real-World Experience Knowledge Base, Video Intelligence & Source Coverage Integrity", async () => {
    assert.ok(EXPERIENCE_KNOWLEDGE_BASE.length >= 10, "Must contain verified public sources");
    for (const res of EXPERIENCE_KNOWLEDGE_BASE) {
      assert.ok(res.url.startsWith("https://"), `Resource ${res.id} must have genuine https URL`);
      assert.ok(res.trustClassification.length > 0);
    }

    const cov = computeSourceCoverageReport();
    assert.equal(cov.totalResources, EXPERIENCE_KNOWLEDGE_BASE.length);

    // Offline video inspection must report not_analyzed honestly without fabricating transcripts
    const vidCheck = await videoIntelligenceEngine.inspectVideoResource("https://www.youtube.com/watch?v=RGOj5yH7evk", {
      allowNetwork: false,
    });
    assert.equal(vidCheck.transcriptStatus, "not_analyzed");
    assert.equal(vidCheck.timestamps.length, 0, "Must never fabricate timestamps offline");

    const ctx = await preparationOrchestrator.orchestrateArenaAsync("exp-test-user", "gsoc-2027", { allowNetwork: false });
    assert.ok(ctx);
    const reason = explainResourceForStudent(EXPERIENCE_KNOWLEDGE_BASE[0], ctx.studentDNA);
    assert.ok(reason.length > 10);

    const playbook = buildPersonalizedPlaybookFromJourneys("gsoc-2027", ctx.studentDNA);
    assert.ok(playbook.actionMappings.length > 0);
    assert.ok(ctx.agentTraceLedger.length >= 2, "Orchestrator must maintain traceable agent decisions");
  });
});
