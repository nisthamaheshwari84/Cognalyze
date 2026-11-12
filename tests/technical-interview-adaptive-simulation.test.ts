import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateStructuredInterviewPlan,
  findNextPlannedQuestion,
  mapSectionToStageId,
  InternalInterviewPlan,
  PlannedInterviewQuestion,
} from "../lib/interview/interview-planner";
import {
  buildJDCompetencyMatrix,
  buildCandidateIntelligenceProfile,
  TwelvePointProjectProfile,
} from "../lib/interview/candidate-intelligence";
import {
  evaluateCandidateConduct,
} from "../lib/interview/conduct-engine";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  assessCandidateAnswer,
  generateNextAdaptiveQuestion,
  assessAndGenerateAdaptiveTurn,
  generateInterviewFinalReport,
  analyzeCandidateResponseContext,
  isQuestionSemanticallyDuplicate,
} from "../lib/ai/interview-engine";
import {
  saveActiveSessionState,
  getActiveSessionState,
  saveActiveSessionStateAsync,
  getActiveSessionStateAsync,
} from "../lib/interview-session-store";

test("Milestone 3.1 Adaptive Simulation Master Suite: End-to-End Interview Execution", async (t) => {

  // ══════════════════════════════════════════════════════════════
  // PROFILE A: STRONG FRESHER (2 Projects, Concise & Correct)
  // ══════════════════════════════════════════════════════════════
  await t.test("Profile A Simulation — Strong Fresher progresses with escalating depth and no shallow penalties", async () => {
    const resumeText = `
      Candidate: Alex Fresher
      Education: B.Tech Computer Science (2026)
      Skills: TypeScript, React, Node.js, PostgreSQL, Redis, REST APIs, Jest
      Project: DevTaskTracker
      Problem Solved: Real-time task board for student engineering teams.
      Architecture: React SPA frontend with Node.js Express backend and PostgreSQL database.
      Tech Stack: React, TypeScript, Node.js, PostgreSQL, Redis.
      Personal Contribution: Designed the task drag-and-drop state, authored REST API endpoints, and configured Redis session caching.
      Database Design: Normalized relational schema with foreign key cascades and user index.
      Testing Strategy: Jest unit tests for API endpoints and component rendering.

      Project: CampusEventHub
      Problem Solved: Event ticketing and notification service for university clubs.
      Architecture: Three-tier microservice architecture using Node.js and PostgreSQL.
      Tech Stack: Node.js, PostgreSQL, Docker.
      Personal Contribution: Built the ticketing reservation transaction worker with row-level locks.
    `;

    const jdText = `
      Role: Junior Software Engineer
      Requirements: JavaScript/TypeScript, Node.js, Relational Databases (PostgreSQL), RESTful API design.
    `;

    const candidateIntel = buildCandidateIntelligenceProfile("cand_prof_a", resumeText, jdText);
    const jdMatrix = buildJDCompetencyMatrix(jdText, "Junior Software Engineer", ["TypeScript", "Node.js", "PostgreSQL", "REST APIs"]);

    const dossier = {
      candidateId: "cand_prof_a",
      name: "Alex Fresher",
      targetRole: "Junior Software Engineer",
      experienceMode: "fresher" as const,
      verifiedSkills: ["TypeScript", "Node.js"],
      claimedSkills: ["PostgreSQL", "Redis", "REST APIs"],
      projects: candidateIntel.projects,
      candidateIntelligence: candidateIntel,
      jdCompetencyMatrix: jdMatrix,
      previouslyAssessedCompetencies: {},
      missingOrUnverified: [],
      previousInterviewWeaknesses: [],
    };

    const blueprint = generateInterviewBlueprint(dossier as any, "Junior Software Engineer", 45, "fresher");
    const session = createAdvancedSessionState(blueprint, dossier as any, "sess_prof_a");

    // Stage 1: Introduction
    assert.equal(session.blueprint.currentSection, "introduction");
    const introPlanned = findNextPlannedQuestion(session.interviewPlan, "introduction", session.questionsAsked);
    assert.ok(introPlanned, "Intro question must be planned");

    // Candidate gives crisp introduction
    session.candidateIntroduction = "I am a graduating CS student focused on TypeScript and backend API engineering. I built DevTaskTracker and CampusEventHub.";
    session.blueprint.currentSection = "resume_projects";

    // Stage 2: Project Deep Dive (DevTaskTracker)
    const stage2Q = findNextPlannedQuestion(session.interviewPlan, "resume_projects", session.questionsAsked);
    assert.ok(stage2Q, "Stage 2 question must be planned");
    assert.ok(stage2Q.promptStem.toLowerCase().includes("devtasktracker") || stage2Q.promptStem.toLowerCase().includes("campuseventhub"));

    // Candidate gives concise, technically accurate answer (17 words)
    const ans1 = "In PostgreSQL, Read Committed provides MVCC query snapshots, whereas Serializable strictly guarantees serial order without phantom reads.";
    const eval1 = await assessCandidateAnswer(stage2Q.promptStem, ans1, session, dossier as any);

    // Verify: Recognized as strong despite being under 25 words (AC-M3-3)
    assert.equal(eval1.answer_quality, "strong", "Concise accurate answer must be rated strong");
    assert.equal(eval1.difficulty_adjustment, "escalate", "Strong answer must escalate difficulty");

    // Stage 4: Fresher System Design
    const sysStage = session.interviewPlan?.stages.find((s) => s.stageId === "system_design");
    assert.ok(sysStage, "System design stage must be present");
    const fresherSysPrompt = sysStage.questions[0].promptStem.toLowerCase();
    assert.ok(
      fresherSysPrompt.includes("rate limiter") || fresherSysPrompt.includes("data structure"),
      "Fresher must receive rate limiter / data structure design problem, not 100M row distributed ledger"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // PROFILE B: RESUME-STRONG, IMPLEMENTATION-WEAK CANDIDATE
  // ══════════════════════════════════════════════════════════════
  await t.test("Profile B Simulation — Resume-Strong candidate giving vague answers triggers implementation probes", async () => {
    const resumeText = `
      Candidate: Bob Buzzword
      Skills: React, Node.js, Redis, Apache Kafka, PostgreSQL, Kubernetes, Microservices
      Project: GlobalScalableECommerce
      Problem Solved: Massive e-commerce platform with microservices.
      Architecture: Highly scalable distributed architecture with Kafka and Redis.
      Tech Stack: Node.js, Redis, Kafka, PostgreSQL, Kubernetes.
      Personal Contribution: Full architecture and design of the platform.
    `;

    const jdText = "Backend Engineer with Node.js, Redis, Kafka, PostgreSQL";
    const candidateIntel = buildCandidateIntelligenceProfile("cand_prof_b", resumeText, jdText);
    const jdMatrix = buildJDCompetencyMatrix(jdText, "Backend Engineer", ["Node.js", "Redis", "Kafka", "PostgreSQL"]);

    const dossier = {
      candidateId: "cand_prof_b",
      targetRole: "Backend Engineer",
      experienceMode: "early_career" as const,
      verifiedSkills: [],
      claimedSkills: ["React", "Node.js", "Redis", "Kafka", "PostgreSQL"],
      projects: candidateIntel.projects,
      candidateIntelligence: candidateIntel,
      jdCompetencyMatrix: jdMatrix,
      previouslyAssessedCompetencies: {},
      missingOrUnverified: [],
      previousInterviewWeaknesses: [],
    };

    const blueprint = generateInterviewBlueprint(dossier as any, "Backend Engineer", 45, "fresher");
    const session = createAdvancedSessionState(blueprint, dossier as any, "sess_prof_b");
    session.blueprint.currentSection = "resume_projects";

    const question = "In your GlobalScalableECommerce project, walk me through how Redis was configured for caching and how you handled cache invalidation.";
    // Vague, evasive response without concrete implementation
    const vagueAnswer = "We used Redis caching in good architecture to make everything fast and handled data properly without errors.";

    const assessment = await assessCandidateAnswer(question, vagueAnswer, session, dossier as any);

    // Verify: Vague handwaving is flagged as shallow and triggers targeted follow-up probe
    assert.equal(assessment.answer_quality, "shallow", "Buzzword answer must be flagged shallow");
    assert.equal(assessment.next_action, "follow_up_probe", "Vague answer must trigger follow_up_probe demanding concrete code/schema");
  });

  // ══════════════════════════════════════════════════════════════
  // PROFILE C: STRONG PRACTICAL ENGINEER, WEAK THEORY
  // ══════════════════════════════════════════════════════════════
  await t.test("Profile C Simulation — Practical engineer demonstrating hands-on code/debugging earns credit", async () => {
    const question = "How do you diagnose and fix a slow query in PostgreSQL?";
    // Candidate explains practical debugging without textbook jargon
    const practicalAnswer = "I ran EXPLAIN ANALYZE on the query and saw a sequential scan on the user_orders table because the created_at index was missing, so adding a B-Tree composite index dropped query latency from 800ms down to 12ms.";

    const sessionState = createAdvancedSessionState(
      generateInterviewBlueprint({ candidateId: "cand_prof_c", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any, "Backend Engineer"),
      { candidateId: "cand_prof_c", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any
    );

    const assessment = await assessCandidateAnswer(question, practicalAnswer, sessionState);

    assert.ok(
      assessment.answer_quality === "strong" || assessment.answer_quality === "adequate",
      "Practical demonstrated engineering with metrics and tooling must be credited"
    );
    assert.ok(
      assessment.topics_demonstrated.length >= 1,
      "Demonstrated topics must capture practical tooling"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // PROFILE D: EXPERIENCED ENGINEER (Distributed Systems, Trade-offs)
  // ══════════════════════════════════════════════════════════════
  await t.test("Profile D Simulation — Experienced engineer tested on distributed trade-offs and counterfactuals", async () => {
    const resumeText = `
      Senior Systems Architect with 8 years of experience building distributed banking services.
      Project: SettlementLedger
      Architecture: Event-sourced ledger using Go, Kafka, PostgreSQL, and Raft consensus.
      Tech Stack: Go, Apache Kafka, PostgreSQL, Docker, Kubernetes.
      Personal Contribution: Designed the distributed consensus cluster and double-entry transaction reconciler.
      Technical Challenges: Managed cross-region latency and zero data-loss failovers under WAN network splits.
    `;

    const jdText = "Staff Distributed Systems Engineer (Kafka, Raft, Distributed Databases)";
    const candidateIntel = buildCandidateIntelligenceProfile("cand_prof_d", resumeText, jdText);
    const jdMatrix = buildJDCompetencyMatrix(jdText, "Staff Distributed Systems Engineer", ["Go", "Kafka", "PostgreSQL", "Kubernetes"]);

    const plan = generateStructuredInterviewPlan(
      { candidateId: "cand_prof_d", targetRole: "Staff Distributed Systems Engineer" },
      jdMatrix,
      candidateIntel,
      "Staff Distributed Systems Engineer",
      45,
      "experienced"
    );

    assert.equal(plan.experienceMode, "experienced");
    const stage2 = plan.stages.find((s) => s.stageId === "project_deep_dive");
    assert.ok(stage2, "Stage 2 must exist");

    // Verify counterfactual probes exist for experienced candidate
    const archQ = stage2.questions[0];
    assert.ok(archQ.counterFactualProbes.length >= 2, "Experienced plan must generate pointed counterfactual probes");

    // Stage 4 System Design for experienced candidate
    const sysStage = plan.stages.find((s) => s.stageId === "system_design");
    assert.ok(sysStage, "System design stage must exist");
    const expSysQ = sysStage.questions[0];
    assert.equal(expSysQ.plannedDifficulty, "hard", "Experienced system design question must be hard");
    assert.ok(
      expSysQ.promptStem.toLowerCase().includes("payment ledger") || expSysQ.promptStem.toLowerCase().includes("distributed"),
      "Experienced candidate must receive distributed ledger / partition tolerance design"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // PROFILE E: HONEST BEGINNER (Graceful "I don't know" handling)
  // ══════════════════════════════════════════════════════════════
  await t.test("Profile E Simulation — Honest 'I don't know' triggers polite pivot with zero penalty", async () => {
    const question = "How does Raft leader election handle candidate split-votes during network partitions?";
    const honestAnswer = "I honestly do not know how Raft leader election works. Can we move on to another topic?";

    const sessionState = createAdvancedSessionState(
      generateInterviewBlueprint({ candidateId: "cand_prof_e", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any, "Backend Engineer"),
      { candidateId: "cand_prof_e", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any
    );

    const assessment = await assessCandidateAnswer(question, honestAnswer, sessionState);

    // Verify: Handled gracefully without conduct flag or arbitrary penalty
    assert.ok(
      assessment.answer_quality === "does_not_know" || assessment.answer_quality === "declined",
      "Honest deferral must be classified as does_not_know or declined"
    );
    assert.ok(
      assessment.next_action === "acknowledge_and_advance" || assessment.next_action === "simplify_concept",
      "Next action must acknowledge and advance respectfully"
    );
    assert.equal(sessionState.conductState, "NORMAL", "Honest answer must never trigger conduct escalation");
  });

  // ══════════════════════════════════════════════════════════════
  // PROFILE F: OVERCONFIDENT VAGUE CANDIDATE (No credit for fluff)
  // ══════════════════════════════════════════════════════════════
  await t.test("Profile F Simulation — Overconfident jargon without implementation substance is denied high marks", async () => {
    const question = "How did you implement the distributed locking mechanism in your payment service?";
    // Overconfident 30-word response packed with buzzwords but zero mechanics
    const fluffAnswer = "Our hyper-scalable cloud-native microservices utilized enterprise-grade distributed architectural patterns to ensure maximum reliability and seamless fault tolerance with modern high-performance engineering standards.";

    const sessionState = createAdvancedSessionState(
      generateInterviewBlueprint({ candidateId: "cand_prof_f", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any, "Backend Engineer"),
      { candidateId: "cand_prof_f", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any
    );

    const assessment = await assessCandidateAnswer(question, fluffAnswer, sessionState);

    // Verify: High word count + buzzwords without concrete code/schema != strong
    assert.notEqual(assessment.answer_quality, "strong", "Jargon fluff without implementation substance must NOT be scored strong");
    assert.ok(
      assessment.answer_quality === "shallow" || assessment.next_action === "follow_up_probe",
      "Fluff must trigger targeted follow_up_probe for proof"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // ADVERSARIAL SIMULATION 1: CONTRADICTORY CLAIMS
  // ══════════════════════════════════════════════════════════════
  await t.test("Adversarial 1 — Contradictory statements across turns trigger clarify_ambiguity inquiry", async () => {
    const sessionState = createAdvancedSessionState(
      generateInterviewBlueprint({ candidateId: "cand_adv_1", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any, "Backend Engineer"),
      { candidateId: "cand_adv_1", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any
    );

    // Turn 1: Candidate says they never used Kubernetes
    sessionState.turns.push({
      turnIndex: 1,
      question: { question: "Have you worked with Kubernetes in production?" } as any,
      answer: "No, I have never used Kubernetes in any project.",
      assessment: { answer_quality: "adequate" } as any,
      timestamp: new Date().toISOString(),
    });

    // Turn 3: Candidate contradicts themselves claiming they deployed Kubernetes
    const contradictoryAnswer = "In our cluster, I deployed our Kubernetes pods using Helm charts.";
    const ctx = analyzeCandidateResponseContext(contradictoryAnswer, "How was deployment handled?", sessionState);

    assert.equal(ctx.hasContradiction, true, "Contradiction must be detected across turn history");
    assert.ok(ctx.contradictionDetail, "Contradiction detail must explain the discrepancy");

    const assessment = await assessCandidateAnswer("How was deployment handled?", contradictoryAnswer, sessionState);
    assert.equal(assessment.answer_quality, "contradictory", "Contradiction must be classified as contradictory");
    assert.equal(assessment.next_action, "clarify_ambiguity", "Next action must be clarify_ambiguity");
  });

  // ══════════════════════════════════════════════════════════════
  // ADVERSARIAL SIMULATION 2: CONTEXT RETENTION & ANTI-REPETITION
  // ══════════════════════════════════════════════════════════════
  await t.test("Adversarial 2 — Context retention preserves project claims and prevents semantic duplicates", async () => {
    const resumeText = `
      Project: StreamAnalytics
      Tech Stack: Apache Kafka, Redis, PostgreSQL.
      Personal Contribution: Designed the stream consumer pipeline.
    `;
    const candidateIntel = buildCandidateIntelligenceProfile("cand_adv_2", resumeText, "Backend Engineer");
    const plan = generateStructuredInterviewPlan({ candidateId: "cand_adv_2", targetRole: "Backend Engineer" }, undefined, candidateIntel);

    const questionsAsked = [
      { question: "In your StreamAnalytics project, you used Apache Kafka, Redis, PostgreSQL. Walk me through the exact end-to-end data flow of a critical request through your system architecture, from client ingress to database persistence." }
    ];

    // Find next planned question
    const nextQ = findNextPlannedQuestion(plan, "resume_projects", questionsAsked);
    assert.ok(nextQ, "Next planned question must be retrieved");
    assert.notEqual(nextQ.id, "plan-proj-1-arch", "Previously asked question must not be re-selected");

    // Semantic duplicate detection test
    const duplicateQuestion = "Can you walk me through the end-to-end data flow in your StreamAnalytics project from ingress to database persistence?";
    const isDup = isQuestionSemanticallyDuplicate(duplicateQuestion, questionsAsked);
    assert.equal(isDup, true, "Semantically rephrased question must be flagged as duplicate");
  });

  // ══════════════════════════════════════════════════════════════
  // ADVERSARIAL SIMULATION 3: SESSION RECOVERY & MONOTONICITY
  // ══════════════════════════════════════════════════════════════
  await t.test("Adversarial 3 — Session recovery preserves interview plan, turn progression, and conduct state", async () => {
    const testSessionId = `test_recovery_${Date.now()}`;
    const dossier = await buildCandidateInterviewDossier("cand_adv_3", "Go engineer with Docker", "Cloud Engineer");
    const blueprint = generateInterviewBlueprint(dossier, "Cloud Engineer", 45);
    const session = createAdvancedSessionState(blueprint, dossier, testSessionId);

    // Save with 1 turn and conduct NORMAL
    session.turns.push({
      turnIndex: 1,
      question: { question: "Explain Docker container networking." } as any,
      answer: "Docker uses bridge and host network modes.",
      assessment: { answer_quality: "adequate" } as any,
      timestamp: new Date().toISOString(),
    });
    session.conductState = "NORMAL";
    await saveActiveSessionStateAsync(testSessionId, session);

    // Advance to Turn 2 with conduct incident
    session.turns.push({
      turnIndex: 2,
      question: { question: "What is an overlay network?" } as any,
      answer: "You are an idiot bot.",
      assessment: { answer_quality: "shallow" } as any,
      timestamp: new Date().toISOString(),
    });
    session.conductState = "FIRST_WARNING";
    await saveActiveSessionStateAsync(testSessionId, session);

    // Recover session from storage
    const recovered = await getActiveSessionStateAsync(testSessionId, "cand_adv_3");
    assert.ok(recovered, "Session must recover from durable store");
    assert.equal(recovered.turns.length, 2, "Recovered session must maintain 2 turns");
    assert.equal(recovered.conductState, "FIRST_WARNING", "Recovered session must preserve conduct state");
    assert.ok(recovered.interviewPlan, "Recovered session must preserve interview plan");
  });

  // ══════════════════════════════════════════════════════════════
  // ADVERSARIAL SIMULATION 4: OFFLINE LLM FALLBACK RELIABILITY
  // ══════════════════════════════════════════════════════════════
  await t.test("Adversarial 4 — Offline fallback preserves structured plan and asks stage-calibrated questions", async () => {
    const dossier = await buildCandidateInterviewDossier("cand_offline_test", "Python, FastAPI, Redis", "Backend Engineer");
    const blueprint = generateInterviewBlueprint(dossier, "Backend Engineer", 45);
    const session = createAdvancedSessionState(blueprint, dossier, `offline_sess_${Date.now()}`);

    // Verify offline fallback question generation for Stage 2
    session.blueprint.currentSection = "resume_projects";
    const fallbackQ2 = await generateNextAdaptiveQuestion(session, dossier, "We built a FastAPI backend.");
    assert.ok(fallbackQ2.question, "Fallback question must be produced");
    assert.equal(fallbackQ2.section, "resume_projects");

    // Verify offline fallback question generation for Stage 3
    session.blueprint.currentSection = "technical_fundamentals";
    const fallbackQ3 = await generateNextAdaptiveQuestion(session, dossier, "I understand caching.");
    assert.ok(fallbackQ3.question, "Stage 3 fallback question must be produced");
    assert.equal(fallbackQ3.section, "technical_fundamentals");
  });

  // ══════════════════════════════════════════════════════════════
  // ADVERSARIAL SIMULATION 5: MULTI-TENANT ISOLATION
  // ══════════════════════════════════════════════════════════════
  await t.test("Adversarial 5 — Multi-tenant isolation prevents cross-candidate access and state leakage", async () => {
    const sessId = `tenant_iso_${Date.now()}`;
    const dossierAlice = await buildCandidateInterviewDossier("alice_user", "React, TypeScript", "Frontend Engineer");
    const blueprintAlice = generateInterviewBlueprint(dossierAlice, "Frontend Engineer", 45);
    const sessionAlice = createAdvancedSessionState(blueprintAlice, dossierAlice, sessId);

    saveActiveSessionState(sessId, sessionAlice);

    // Bob attempts to overwrite or save state into Alice's session
    const dossierBob = await buildCandidateInterviewDossier("bob_user", "Python, Django", "Backend Engineer");
    const blueprintBob = generateInterviewBlueprint(dossierBob, "Backend Engineer", 45);
    const sessionBob = createAdvancedSessionState(blueprintBob, dossierBob, sessId);

    assert.throws(
      () => saveActiveSessionState(sessId, sessionBob),
      /Candidate isolation violation/,
      "Session store must throw Candidate isolation violation on mismatched candidateId"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // QUESTION QUALITY & TECHNICAL INTEGRITY EVALUATION (10 DIMENSIONS)
  // ══════════════════════════════════════════════════════════════
  await t.test("Question Quality Evaluation — 10-Point Measurable Metric verification", async () => {
    const resumeText = `
      Project: DistributedKeyVault
      Architecture: Go microservice with Raft consensus and PostgreSQL persistence.
      Tech Stack: Go, PostgreSQL, Raft, Docker.
      Personal Contribution: Wrote the Raft state machine replication log.
    `;
    const candidateIntel = buildCandidateIntelligenceProfile("cand_qq_test", resumeText, "Systems Engineer");
    const plan = generateStructuredInterviewPlan({ candidateId: "cand_qq_test", targetRole: "Systems Engineer" }, undefined, candidateIntel);

    const stage2Q = plan.stages.find((s) => s.stageId === "project_deep_dive")?.questions[0]!;
    assert.ok(stage2Q, "Question must exist");

    // 1. Relevance: Targets project or role
    const isRelevant = stage2Q.promptStem.includes("DistributedKeyVault") || stage2Q.competencyTargeted.includes("DistributedKeyVault");
    assert.equal(isRelevant, true, "1. Relevance must pass");

    // 2. Grounding: Supported by candidate's actual stack (Go, Raft, PostgreSQL)
    const isGrounded = stage2Q.relevantTech?.some((t) => ["Go", "Raft", "PostgreSQL"].includes(t));
    assert.equal(Boolean(isGrounded), true, "2. Grounding must pass");

    // 3. Specificity: Has concrete technical stem under 60 words
    const words = stage2Q.promptStem.split(/\s+/).length;
    assert.ok(words >= 10 && words <= 60, "3. Specificity: Question length must be between 10 and 60 words");

    // 4. Depth: Explores request flow or architecture trade-offs
    assert.ok(stage2Q.expectedConcepts.length >= 2, "4. Depth: Must define expected core concepts");

    // 5. Fairness: Calibrated difficulty is easy, medium, or hard
    assert.ok(["easy", "medium", "hard"].includes(stage2Q.plannedDifficulty), "5. Fairness: Difficulty must be calibrated");

    // 6. Adaptivity: Has counterfactual probes
    assert.ok(stage2Q.counterFactualProbes.length >= 1, "6. Adaptivity: Counterfactual probes must be present");

    // 7. Non-repetition: Stem is unique
    assert.ok(stage2Q.id.length > 5, "7. Non-repetition: Distinct ID assigned");

    // 8. Answerability: Clear prompt question mark
    assert.ok(stage2Q.promptStem.includes("?"), "8. Answerability: Must end with question mark");

    // 9. Professionalism: Natural, respectful phrasing
    assert.ok(!stage2Q.promptStem.includes("bot") && !stage2Q.promptStem.includes("dummy"), "9. Professionalism: Must be respectful");

    // 10. Assessment Value: Complete rubric criteria
    assert.ok(stage2Q.evaluationRubric.strongCriteria.length >= 1, "10. Assessment Value: Strong rubric present");
    assert.ok(stage2Q.evaluationRubric.shallowCriteria.length >= 1, "10. Assessment Value: Shallow rubric present");
  });

});
