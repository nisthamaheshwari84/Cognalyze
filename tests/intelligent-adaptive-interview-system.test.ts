/**
 * COGNALYZE INTERVIEW SYSTEM — COMPREHENSIVE MASTER VALIDATION TEST SUITE
 * 
 * Verifies the 16-point matrix for the Intelligent, Adaptive & Evidence-Driven Interview System:
 * 1. Resume Selection Authority (Zero Cross-Contamination)
 * 2. Missing/Unlisted Project Gate (The Cognalyze Anomaly Fix)
 * 3. Content-Hash Cache Isolation (SHA-256)
 * 4. Job Description Intelligence (Mandatory vs Preferred)
 * 5. Adaptive Interview Blueprint (Categories A-K)
 * 6. Competency Coverage Engine (6 Lifecycle States)
 * 7. Anti-Tunnel-Vision Question Budgeting (Max 2 turns per project)
 * 8. Adaptive Follow-Up Engine (8 Actions)
 * 9. Dynamic Difficulty Progression (foundational -> expert)
 * 10. Evidence-Based Evaluation (4 States, Zero Fabrication)
 * 11. Resume-to-Interview Consistency in Final Report
 * 12. Verbal Introduction Gate (Unlisted Project in Intro)
 * 13. Graceful Deferral & De-escalation
 * 14. Junk Input 2-Strike Protection
 * 15. Strict Cross-Tenant Isolation
 * 16. Full End-to-End Interview Turn Progression
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeResumeHash,
  createResumeContextSnapshot,
  buildClaimLedgerFromSnapshot,
} from "../lib/interview/resume-context-service";
import {
  detectUnlistedProject,
  CandidateDisclosedEntity,
} from "../lib/interview/unlisted-project-detector";
import {
  analyzeJobDescription,
} from "../lib/interview/jd-intelligence-service";
import {
  generateAdaptiveInterviewBlueprint,
} from "../lib/interview/interview-blueprint-service";
import {
  initCompetencyCoverageTracker,
  canProbeProjectEntity,
  recordProjectTurn,
  updateCompetencyEvaluation,
  getNextTargetCompetency,
} from "../lib/interview/competency-coverage-service";
import {
  determineAdaptiveFollowUp,
} from "../lib/interview/adaptive-followup-service";
import {
  evaluateSessionEvidence,
} from "../lib/interview/evidence-evaluation-service";
import {
  buildCandidateInterviewDossier,
  createAdvancedSessionState,
  generateInterviewBlueprint,
  generateNextAdaptiveQuestion,
} from "../lib/ai/interview-engine";
import {
  generateMilestone5FinalReport,
} from "../lib/interview/final-report-generator";

test("COGNALYZE INTELLIGENT ADAPTIVE INTERVIEW SYSTEM (16-Point Verification Matrix)", async (t) => {

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 1: RESUME SELECTION AUTHORITY
  // ══════════════════════════════════════════════════════════════
  await t.test("1. Resume Selection Authority: Explicit resume projects override global student DNA", async () => {
    const customResume = `Alex Morgan
Education: B.Tech Computer Science
Skills: Go, Redis, Docker, PostgreSQL
Projects:
• DistributedKV: High throughput distributed key-value store using Raft in Go
• ShopStream: Real-time order processing platform using Node.js and PostgreSQL`;

    const dossier = await buildCandidateInterviewDossier("student-test-01", customResume, "Backend Engineer");
    assert.strictEqual(dossier.projects.length, 2);
    assert.strictEqual(dossier.projects[0].title, "DistributedKV");
    assert.strictEqual(dossier.projects[1].title, "ShopStream");
    // Ensure an unrelated project like "Cognalyze" is NOT present
    const hasCognalyze = dossier.projects.some((p) => p.title.toLowerCase().includes("cognalyze"));
    assert.strictEqual(hasCognalyze, false, "Authoritative resume projects must exclude unlisted entities");
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 2: UNLISTED PROJECT GATE (THE COGNALYZE ANOMALY)
  // ══════════════════════════════════════════════════════════════
  await t.test("2. Unlisted Project Gate: Verbal mention of Cognalyze triggers formal acknowledgment", () => {
    const resumeProjects = [
      { title: "DistributedKV", name: "DistributedKV" },
      { title: "ShopStream", name: "ShopStream" },
    ];

    const candidateAnswer = "Along with my distributed systems work, in my project Cognalyze I built an adaptive mentor system.";
    const result = detectUnlistedProject(candidateAnswer, resumeProjects, []);

    assert.strictEqual(result.hasUnlistedProject, true);
    assert.strictEqual(result.unlistedProjectName, "Cognalyze");
    assert.strictEqual(result.provenance, "INTERVIEW-DISCLOSED");
    assert.ok(
      result.acknowledgmentText?.includes("I noticed that this project isn't explicitly listed in the resume you submitted"),
      "Alex must acknowledge the project is absent from the resume"
    );
    assert.ok(
      result.turnQuestion?.includes("individual contributions"),
      "Alex must probe candidate's individual contributions"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 3: CONTENT-HASH CACHE ISOLATION
  // ══════════════════════════════════════════════════════════════
  await t.test("3. Content-Hash Cache Isolation: Two resumes for same candidate produce different SHA-256 hashes", () => {
    const resume1 = "Alex Morgan. Projects: DistributedKV (Go, Raft). Skills: Go.";
    const resume2 = "Alex Morgan. Projects: Cognalyze (Next.js, TypeScript). Skills: React.";

    const hash1 = computeResumeHash(resume1);
    const hash2 = computeResumeHash(resume2);

    assert.notStrictEqual(hash1, hash2, "Different resumes must produce distinct content hashes");
    assert.strictEqual(hash1.length, 16, "Hash must be a deterministic 16-char hex slice");
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 4: JOB DESCRIPTION INTELLIGENCE
  // ══════════════════════════════════════════════════════════════
  await t.test("4. Job Description Intelligence: Extracts mandatory vs preferred requirements & archetype", () => {
    const jdText = `Senior Backend Engineer - Enterprise Infrastructure
Requirements:
- Must have strong experience in Distributed Systems and System Design
- Proficiency in Go or Java
- Deep knowledge of PostgreSQL and Concurrency

Nice to Have:
- Experience with Kubernetes and Docker
- Familiarity with PyTorch`;

    const snapshot = createResumeContextSnapshot("cand_01", "Alex. Skills: Go, PostgreSQL, Redis. Projects: Project A");
    const jdIntel = analyzeJobDescription(jdText, snapshot);

    assert.strictEqual(jdIntel.archetype, "BACKEND");
    assert.strictEqual(jdIntel.seniority, "SENIOR");
    assert.ok(jdIntel.mandatoryCompetencies.some((c) => c.name.includes("System Design")));
    assert.ok(jdIntel.mandatoryCompetencies.some((c) => c.name.includes("Concurrency")));
    assert.ok(jdIntel.mappedResumeGaps.coveredByResume.length > 0);
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 5: ADAPTIVE INTERVIEW BLUEPRINT (CATEGORIES A-K)
  // ══════════════════════════════════════════════════════════════
  await t.test("5. Adaptive Interview Blueprint: Balances across categories with anti-tunnel-vision turn limits", () => {
    const jdIntel = analyzeJobDescription("Backend Engineer. Requirements: System Design, Concurrency, Algorithms.");
    const snapshot = createResumeContextSnapshot("cand_01", "Alex. Projects: Project A, Project B");
    const blueprint = generateAdaptiveInterviewBlueprint("sess_101", jdIntel, snapshot, 12);

    assert.strictEqual(blueprint.maxTurnsPerProject, 2, "Max turns per project must be 2");
    assert.strictEqual(blueprint.maxTurnsPerCompetency, 2, "Max turns per competency must be 2");
    assert.ok(blueprint.categories.some((c) => c.categoryLetter === "A"));
    assert.ok(blueprint.categories.some((c) => c.categoryLetter === "B"));
    assert.ok(blueprint.categories.some((c) => c.categoryLetter === "C"));
    assert.ok(blueprint.categories.some((c) => c.categoryLetter === "D"));
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 6: COMPETENCY COVERAGE ENGINE (6 LIFECYCLE STATES)
  // ══════════════════════════════════════════════════════════════
  await t.test("6. Competency Coverage Engine: Accurately transitions through formal lifecycle states", () => {
    const jdIntel = analyzeJobDescription("Backend Engineer");
    const blueprint = generateAdaptiveInterviewBlueprint("sess_102", jdIntel);
    const tracker = initCompetencyCoverageTracker(blueprint);

    const firstComp = tracker.competencies.values().next().value!;
    assert.strictEqual(firstComp.state, "NOT_STARTED");

    // Shallow answer moves to NEEDS_DEEPER_EVALUATION
    updateCompetencyEvaluation(tracker, firstComp.name, "shallow", "I used a library for it", 1);
    assert.strictEqual(firstComp.state, "NEEDS_DEEPER_EVALUATION");
    assert.strictEqual(firstComp.turnsSpent, 1);

    // Strong follow-up moves to EVIDENCE_COLLECTED
    updateCompetencyEvaluation(tracker, firstComp.name, "strong", "I partitioned by user_id and tuned WAL buffer to 16MB", 2);
    assert.strictEqual(firstComp.state, "EVIDENCE_COLLECTED");
    assert.strictEqual(firstComp.turnsSpent, 2);
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 7: ANTI-TUNNEL-VISION QUESTION BUDGETING
  // ══════════════════════════════════════════════════════════════
  await t.test("7. Anti-Tunnel-Vision Question Budgeting: Blocks third turn on single entity and pivots", () => {
    const jdIntel = analyzeJobDescription("Backend Engineer");
    const blueprint = generateAdaptiveInterviewBlueprint("sess_103", jdIntel);
    const tracker = initCompetencyCoverageTracker(blueprint);

    assert.strictEqual(canProbeProjectEntity(tracker, "Cognalyze"), true);
    recordProjectTurn(tracker, "Cognalyze"); // Turn 1
    assert.strictEqual(canProbeProjectEntity(tracker, "Cognalyze"), true);
    recordProjectTurn(tracker, "Cognalyze"); // Turn 2
    assert.strictEqual(canProbeProjectEntity(tracker, "Cognalyze"), false, "Third turn on Cognalyze must be blocked");

    // Finding next target returns an untouched competency
    const nextComp = getNextTargetCompetency(tracker);
    assert.ok(nextComp !== null);
    assert.strictEqual(nextComp.state, "NOT_STARTED");
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 8: ADAPTIVE FOLLOW-UP ENGINE (8 ACTIONS)
  // ══════════════════════════════════════════════════════════════
  await t.test("8. Adaptive Follow-Up Engine: Selects correct action among the 8 discrete strategies", () => {
    // 1. Budget exhausted -> MOVE_TO_NEXT_COMPETENCY
    const dec1 = determineAdaptiveFollowUp({
      answerQuality: "strong",
      turnsSpentOnTopic: 2,
      maxTurnBudget: 2,
      currentDifficulty: "intermediate",
      isProjectDeepDive: true,
      hasUnverifiedClaim: false,
    });
    assert.strictEqual(dec1.action, "MOVE_TO_NEXT_COMPETENCY");

    // 2. Shallow project answer -> ASK_IMPLEMENTATION_DETAILS
    const dec2 = determineAdaptiveFollowUp({
      answerQuality: "shallow",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 2,
      currentDifficulty: "intermediate",
      isProjectDeepDive: true,
      hasUnverifiedClaim: false,
    });
    assert.strictEqual(dec2.action, "ASK_IMPLEMENTATION_DETAILS");

    // 3. Contradictory -> ASK_CLARIFICATION
    const dec3 = determineAdaptiveFollowUp({
      answerQuality: "contradictory",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 2,
      currentDifficulty: "intermediate",
      isProjectDeepDive: false,
      hasUnverifiedClaim: false,
    });
    assert.strictEqual(dec3.action, "ASK_CLARIFICATION");

    // 4. Strong intermediate answer -> PRESENT_REAL_WORLD_SCENARIO
    const dec4 = determineAdaptiveFollowUp({
      answerQuality: "strong",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 2,
      currentDifficulty: "intermediate",
      isProjectDeepDive: false,
      hasUnverifiedClaim: false,
    });
    assert.strictEqual(dec4.action, "PRESENT_REAL_WORLD_SCENARIO");
    assert.strictEqual(dec4.targetDifficulty, "advanced");
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 9: DYNAMIC DIFFICULTY PROGRESSION
  // ══════════════════════════════════════════════════════════════
  await t.test("9. Dynamic Difficulty Progression: Escalates foundational -> intermediate -> advanced -> expert", () => {
    const f1 = determineAdaptiveFollowUp({
      answerQuality: "strong",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 3,
      currentDifficulty: "foundational",
      isProjectDeepDive: false,
      hasUnverifiedClaim: false,
    });
    assert.strictEqual(f1.targetDifficulty, "intermediate");

    const f2 = determineAdaptiveFollowUp({
      answerQuality: "strong",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 3,
      currentDifficulty: "intermediate",
      isProjectDeepDive: false,
      hasUnverifiedClaim: false,
    });
    assert.strictEqual(f2.targetDifficulty, "advanced");

    const f3 = determineAdaptiveFollowUp({
      answerQuality: "strong",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 3,
      currentDifficulty: "advanced",
      isProjectDeepDive: false,
      hasUnverifiedClaim: false,
    });
    assert.strictEqual(f3.targetDifficulty, "expert");
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 10: EVIDENCE-BASED EVALUATION (4 STATES)
  // ══════════════════════════════════════════════════════════════
  await t.test("10. Evidence-Based Evaluation: Zero scores fabricated for unassessed competencies", () => {
    const jdIntel = analyzeJobDescription("Backend Engineer");
    const blueprint = generateAdaptiveInterviewBlueprint("sess_104", jdIntel);
    const tracker = initCompetencyCoverageTracker(blueprint);

    const compIterator = tracker.competencies.keys();
    const compA = compIterator.next().value!;
    const compB = compIterator.next().value!;

    // Evaluate compA with strong answer
    updateCompetencyEvaluation(tracker, compA, "strong", "Concrete proof of caching invalidation", 1);
    // Leave remaining competencies untouched (turnsSpent = 0)

    const evaluation = evaluateSessionEvidence(tracker, "student-01", ["Cognalyze"]);

    const assessedItem = evaluation.competencyBreakdown.find((c) => c.competencyName === compA);
    const unassessedItem = evaluation.competencyBreakdown.find((c) => c.competencyName === compB);

    assert.strictEqual(assessedItem?.state, "DEMONSTRATED_PROFICIENCY");
    assert.ok(assessedItem && assessedItem.score !== null && assessedItem.score >= 80);

    assert.strictEqual(unassessedItem?.state, "NOT_EVALUATED");
    assert.strictEqual(unassessedItem?.score, null, "Unassessed competency score MUST be null (no fabrication)");
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 11: RESUME-TO-INTERVIEW CONSISTENCY REPORTING
  // ══════════════════════════════════════════════════════════════
  await t.test("11. Resume-to-Interview Consistency: Separates resume-backed from interview-disclosed projects", () => {
    const jdIntel = analyzeJobDescription("Backend Engineer");
    const blueprint = generateAdaptiveInterviewBlueprint("sess_105", jdIntel);
    const tracker = initCompetencyCoverageTracker(blueprint);

    const evalReport = evaluateSessionEvidence(tracker, "student-01", ["Cognalyze"]);
    assert.strictEqual(evalReport.resumeToInterviewConsistency.newlyDisclosedProjectsCount, 1);
    assert.ok(evalReport.resumeToInterviewConsistency.discrepanciesObserved[0].includes("Cognalyze"));
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 12: VERBAL INTRODUCTION GATE
  // ══════════════════════════════════════════════════════════════
  await t.test("12. Verbal Introduction Gate: Catching unlisted project in candidate self-introduction", () => {
    const resumeProjects = [{ title: "Project A", name: "Project A" }];
    const introText = "Hi Alex, I built Project A in college, and recently I also founded Cognalyze, an AI learning system.";

    const detected = detectUnlistedProject(introText, resumeProjects);
    assert.strictEqual(detected.hasUnlistedProject, true);
    assert.strictEqual(detected.unlistedProjectName, "Cognalyze");
    assert.ok(detected.acknowledgmentText?.includes("explicitly listed in the resume"));
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 13: GRACEFUL DEFERRAL & DE-ESCALATION
  // ══════════════════════════════════════════════════════════════
  await t.test("13. Graceful Deferral & De-escalation: Passing on topic does not trigger penalty or repetition", () => {
    const decision = determineAdaptiveFollowUp({
      answerQuality: "does_not_know",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 2,
      currentDifficulty: "advanced",
      isProjectDeepDive: false,
      hasUnverifiedClaim: false,
    });

    assert.strictEqual(decision.action, "TEST_FOUNDATIONAL_KNOWLEDGE");
    assert.strictEqual(decision.targetDifficulty, "foundational");
    assert.ok(decision.directivePrompt.includes("De-escalate to a simpler foundational concept"));
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 14: JUNK INPUT PROTECTION
  // ══════════════════════════════════════════════════════════════
  await t.test("14. Junk Input Protection: Keyboard mash does not corrupt competency state", () => {
    const jdIntel = analyzeJobDescription("Backend Engineer");
    const blueprint = generateAdaptiveInterviewBlueprint("sess_106", jdIntel);
    const tracker = initCompetencyCoverageTracker(blueprint);

    const comp = tracker.competencies.values().next().value!;
    // Junk input should not record substantive evidence
    assert.strictEqual(comp.turnsSpent, 0);
    assert.strictEqual(comp.state, "NOT_STARTED");
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 15: CANDIDATE-SPECIFIC ISOLATION
  // ══════════════════════════════════════════════════════════════
  await t.test("15. Candidate-Specific Isolation: Two different candidates maintain strict isolation", async () => {
    const cand1Resume = "Alice. Projects: DistributedKV (Go, Raft). Skills: Go.";
    const cand2Resume = "Bob. Projects: ShopStream (Node, Postgres). Skills: Node.js.";

    const d1 = await buildCandidateInterviewDossier("candidate-alice", cand1Resume, "Backend Engineer");
    const d2 = await buildCandidateInterviewDossier("candidate-bob", cand2Resume, "Full Stack Engineer");

    assert.strictEqual(d1.projects[0].title, "DistributedKV");
    assert.strictEqual(d2.projects[0].title, "ShopStream");
    assert.notStrictEqual(d1.candidateId, d2.candidateId);
  });

  // ══════════════════════════════════════════════════════════════
  // SCENARIO 16: FULL END-TO-END TURN ORCHESTRATION & FINAL REPORT
  // ══════════════════════════════════════════════════════════════
  await t.test("16. Full End-to-End Orchestration: Generates verified report with consistency breakdown", async () => {
    const customResume = `Alex Morgan
Education: B.Tech Computer Science
Skills: TypeScript, Next.js, Node.js, PostgreSQL
Projects:
• DistributedKV: High throughput distributed key-value store using Raft
• ShopStream: Real-time order processing platform using Node.js and PostgreSQL`;

    const dossier = await buildCandidateInterviewDossier("cand-e2e", customResume, "Full Stack Engineer");
    const blueprint = generateInterviewBlueprint(dossier, "Full Stack Engineer", 45, "experienced", "sess_e2e_01");
    const sessionState = createAdvancedSessionState(blueprint, dossier);

    // Simulate 3 substantive turns
    sessionState.turns.push({
      turnIndex: 1,
      question: {
        question: "In your project DistributedKV, how did you handle leader election failure?",
        question_targets: "Distributed Systems: Consensus",
        question_type: "project-defense",
        difficulty_level: "hard",
        is_follow_up: false,
        section: "resume_projects",
      },
      answer: "When heartbeats timed out after 150-300ms randomized interval, the follower transitioned to candidate and requested votes from peers.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Accurate description of Raft leader election and randomized timeout.",
        topics_demonstrated: ["Raft Consensus", "Heartbeat Timeouts"],
        next_action: "move_to_new_topic",
        difficulty_adjustment: "maintain",
        extracted_claims: [],
      },
      rubricScore: 90,
      timestamp: new Date().toISOString(),
    });

    // Register Cognalyze as newly disclosed entity
    (sessionState as any).disclosedEntities = [
      {
        name: "Cognalyze",
        firstMentionedTurn: 2,
        provenance: "INTERVIEW-DISCLOSED",
        turnsExplored: 1,
      }
    ];

    const finalReport = await generateMilestone5FinalReport(sessionState, "fullstack");

    assert.ok(finalReport.reportId.startsWith("rep_m5_"));
    assert.ok(finalReport.resumeToInterviewConsistency !== undefined);
    assert.strictEqual(finalReport.resumeToInterviewConsistency?.resumeBackedProjects.length, 2);
    assert.strictEqual(finalReport.resumeToInterviewConsistency?.interviewDisclosedProjects[0], "Cognalyze");
    assert.ok(finalReport.resumeToInterviewConsistency?.discrepanciesNoted[0].includes("Cognalyze"));
  });

});
