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
  extractTwelvePointProjectProfile,
  buildJDCompetencyMatrix,
  buildCandidateIntelligenceProfile,
} from "../lib/interview/candidate-intelligence";
import {
  evaluateCandidateConduct,
  ConductState,
} from "../lib/interview/conduct-engine";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  assessCandidateAnswer,
  generateNextAdaptiveQuestion,
  assessAndGenerateAdaptiveTurn,
} from "../lib/ai/interview-engine";

test("Milestone 3 Master Engineering Suite: Interview Planning & Adaptive Questioning", async (t) => {

  // ══════════════════════════════════════════════════════════════
  // M3-1: AC-M3-1 PROJECT ARCHITECTURE DEEP-DIVE PROBES
  // ══════════════════════════════════════════════════════════════
  await t.test("AC-M3-1: Candidate's actual project technologies (Redis, Kafka, PostgreSQL) are cited in Stage 2 questions", async () => {
    const resumeText = `
      Project: Distributed Payment Gateway & Settlement Engine
      Problem Solved: Handled high transaction volume payment processing with reconciliation latency under 2 seconds.
      Architecture: Event-driven microservices using Node.js, TypeScript, Kafka message broker, and Redis distributed caching.
      Tech Stack: Node.js, Express, TypeScript, Apache Kafka, PostgreSQL, Redis, Docker, Kubernetes.
      Personal Contribution: Designed the distributed lock mechanism, implemented idempotency keys, and built the webhook delivery retry worker.
      Technical Challenges: Mitigated race conditions and double charges during network partitions using Redis Redlock.
      Database Design: PostgreSQL with schema isolation per merchant, read replicas, and partitioned ledger entries.
      Security Measures: Encrypted PAN tokens at rest using AES-256-GCM, TLS 1.3 in transit.
      Performance Optimizations: Reduced p99 latency from 450ms to 85ms via Redis multi-level caching.
      Testing Strategy: 92% unit test coverage using Jest and Testcontainers.
    `;

    const jdText = `
      Role: Senior Backend Engineer
      Requirements: High-throughput microservices, PostgreSQL, Apache Kafka, Redis, Distributed Systems.
    `;

    const candidateIntel = buildCandidateIntelligenceProfile("cand_m3_1", resumeText, jdText);
    const jdMatrix = buildJDCompetencyMatrix(jdText, "Senior Backend Engineer", ["Node.js", "PostgreSQL", "Kafka", "Redis"]);

    const plan = generateStructuredInterviewPlan(
      { candidateId: "cand_m3_1", targetRole: "Senior Backend Engineer" },
      jdMatrix,
      candidateIntel,
      "Senior Backend Engineer",
      45,
      "experienced"
    );

    assert.ok(plan, "Interview plan must be successfully created");
    assert.equal(plan.stages.length, 5, "Plan must define 5 stages");

    const stage2 = plan.stages.find((s) => s.stageId === "project_deep_dive");
    assert.ok(stage2, "Stage 2 project_deep_dive must exist");
    assert.ok(stage2.questions.length >= 3, "Stage 2 must generate at least 3 pointed questions");

    // Verify architecture question cites candidate's actual project and tech stack
    const archQ = stage2.questions.find((q) => q.id.includes("arch"));
    assert.ok(archQ, "Architecture question must be planned");
    assert.ok(
      archQ.promptStem.includes("Distributed Payment Gateway") || archQ.promptStem.includes("Payment Gateway"),
      "Prompt stem must cite candidate's actual project title"
    );

    const promptLower = archQ.promptStem.toLowerCase();
    const hasTechCited =
      promptLower.includes("kafka") ||
      promptLower.includes("redis") ||
      promptLower.includes("postgresql") ||
      promptLower.includes("node.js");

    assert.ok(hasTechCited, "Stage 2 question prompt must explicitly cite candidate's actual technologies");
    assert.equal(archQ.provenanceSource, "resume_project", "Provenance must be resume_project");
    assert.ok(archQ.counterFactualProbes.length > 0, "Counterfactual probes must be populated");
  });

  // ══════════════════════════════════════════════════════════════
  // M3-2: AC-M3-2 UNSUPPORTED JD GAPS TARGETED IN STAGE 3
  // ══════════════════════════════════════════════════════════════
  await t.test("AC-M3-2: Unsupported JD competencies (Kubernetes, Kafka) are targeted during Stage 3 questions", async () => {
    // Resume has only React and Node.js; JD requires Kubernetes and Kafka
    const resumeText = `
      Software Engineer with experience in React, JavaScript, and Node.js building responsive web applications.
      Built simple frontend dashboards using React and Express APIs.
    `;

    const jdText = `
      Senior Backend Engineer
      Required Experience:
      - Apache Kafka for distributed streaming
      - Kubernetes for cluster orchestration and deployment
      - PostgreSQL database optimization
    `;

    const candidateIntel = buildCandidateIntelligenceProfile("cand_m3_2", resumeText, jdText);
    const jdMatrix = buildJDCompetencyMatrix(jdText, "Senior Backend Engineer", ["React", "JavaScript", "Node.js"]);

    // Verify unsupported requirements were detected
    assert.ok(
      jdMatrix.unsupportedJDRequirements.length >= 1,
      "JD matrix must flag unsupported requirements"
    );

    const plan = generateStructuredInterviewPlan(
      { candidateId: "cand_m3_2", targetRole: "Senior Backend Engineer" },
      jdMatrix,
      candidateIntel,
      "Senior Backend Engineer",
      45,
      "early_career"
    );

    const stage3 = plan.stages.find((s) => s.stageId === "jd_gap_verification");
    assert.ok(stage3, "Stage 3 jd_gap_verification must exist");
    assert.ok(stage3.questions.length >= 1, "Stage 3 must contain diagnostic gap questions");

    const gapQuestions = stage3.questions.filter((q) => q.provenanceSource === "unsupported_jd_gap");
    assert.ok(gapQuestions.length >= 1, "Stage 3 must target unsupported JD gaps");

    // Verify that at least one gap question explicitly targets Kubernetes or Kafka
    const allGapPrompts = gapQuestions.map((q) => q.promptStem.toLowerCase()).join(" ");
    const targetsGap =
      allGapPrompts.includes("kubernetes") ||
      allGapPrompts.includes("kafka") ||
      allGapPrompts.includes("message") ||
      allGapPrompts.includes("postgres");

    assert.ok(targetsGap, "Stage 3 prompts must target unsupported JD gaps from JD matrix");
  });

  // ══════════════════════════════════════════════════════════════
  // M3-3: AC-M3-3 CONCISE CORRECT ANSWERS ADVANCE WITHOUT SHALLOW PENALTY
  // ══════════════════════════════════════════════════════════════
  await t.test("AC-M3-3: Concise correct answers (< 25 words) are scored as strong and advance to deeper trade-offs", async () => {
    const questionText = "In PostgreSQL, how do Read Committed and Serializable transaction isolation levels differ?";
    // Concise answer (15 words, high technical precision, zero errors)
    const conciseAnswer = "Read Committed creates an MVCC snapshot per query, whereas Serializable guarantees serial execution order.";

    const sessionState = createAdvancedSessionState(
      generateInterviewBlueprint(
        { candidateId: "cand_m3_3", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any,
        "Backend Engineer"
      ),
      { candidateId: "cand_m3_3", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any
    );

    const assessment = await assessCandidateAnswer(questionText, conciseAnswer, sessionState);

    assert.equal(assessment.answer_quality, "strong", "Accurate concise answer must be classified as strong, NOT shallow");
    assert.equal(assessment.difficulty_adjustment, "escalate", "Strong answer must escalate difficulty");
    assert.ok(
      assessment.next_action === "move_to_new_topic" || assessment.next_action === "advance_section",
      "Strong answer must advance rather than trap in follow-up loops"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // M3-4: AC-M3-4 VAGUE ANSWERS TRIGGER TARGETED PROBE
  // ══════════════════════════════════════════════════════════════
  await t.test("AC-M3-4: Vague or evasive answers trigger a targeted probe requesting concrete implementation details", async () => {
    const questionText = "Walk me through how you designed your Redis distributed lock mechanism to handle network splits.";
    const vagueAnswer = "We used a distributed lock in Redis and made sure everything worked reliably without errors.";

    const sessionState = createAdvancedSessionState(
      generateInterviewBlueprint(
        { candidateId: "cand_m3_4", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any,
        "Backend Engineer"
      ),
      { candidateId: "cand_m3_4", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any
    );

    const assessment = await assessCandidateAnswer(questionText, vagueAnswer, sessionState);

    assert.equal(assessment.answer_quality, "shallow", "Vague buzzword response must be classified as shallow");
    assert.equal(assessment.next_action, "follow_up_probe", "Vague answer must trigger a targeted follow_up_probe");
  });

  // ══════════════════════════════════════════════════════════════
  // M3-5: AC-M3-5 CANDIDATE SKIP / UNCERTAINTY TRIGGERS POLITE PIVOT
  // ══════════════════════════════════════════════════════════════
  await t.test("AC-M3-5: Candidate stating 'I don't know' or 'skip' triggers a polite transition without repeated nagging", async () => {
    const questionText = "How do you configure Raft consensus heartbeats to prevent split-brain during WAN partitioning?";
    const skipAnswer = "I honestly don't know about Raft heartbeats, can we skip to the next topic?";

    const sessionState = createAdvancedSessionState(
      generateInterviewBlueprint(
        { candidateId: "cand_m3_5", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any,
        "Backend Engineer"
      ),
      { candidateId: "cand_m3_5", targetRole: "Backend Engineer", verifiedSkills: [], claimedSkills: [], projects: [] } as any
    );

    const assessment = await assessCandidateAnswer(questionText, skipAnswer, sessionState);

    assert.ok(
      assessment.answer_quality === "does_not_know" || assessment.answer_quality === "declined",
      "Explicit uncertainty / skip must be classified as does_not_know or declined"
    );
    assert.ok(
      assessment.next_action === "acknowledge_and_advance" || assessment.next_action === "simplify_concept",
      "Interviewer must acknowledge and advance or simplify without penalties"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // M3-6: AC-M3-6 CONDUCT STATE MACHINE INTEGRITY PRESERVED
  // ══════════════════════════════════════════════════════════════
  await t.test("AC-M3-6: Conduct State Machine (Milestone 2) remains 100% operational and halts turns on abusive inputs", async () => {
    // Normal turn
    const res1 = evaluateCandidateConduct("I used Redis Redlock with bounded exponential backoff.", "NORMAL", 1);
    assert.equal(res1.isMisconduct, false);
    assert.equal(res1.newState, "NORMAL");

    // Abusive turn
    const res2 = evaluateCandidateConduct("You are an idiot and this interview is garbage.", "NORMAL", 2);
    assert.equal(res2.isMisconduct, true);
    assert.equal(res2.shouldHaltTurn, true);
    assert.equal(res2.newState, "FIRST_WARNING");
    assert.ok(res2.interviewerMessage, "Warning message must be issued");
  });

  // ══════════════════════════════════════════════════════════════
  // M3-7: AC-M3-7 DETERMINISTIC BLUEPRINT FALLBACK PRESERVES PLAN STRUCTURE
  // ══════════════════════════════════════════════════════════════
  await t.test("AC-M3-7: Fallback question generator preserves plan structure and uses planned questions when LLM is offline", async () => {
    const resumeText = `
      Project: KafkaStreamFlow
      Architecture: Event streaming with Apache Kafka and PostgreSQL.
      Tech Stack: Apache Kafka, PostgreSQL, Docker.
      Personal Contribution: Built the stream consumer worker.
    `;
    const jdText = "Backend Engineer with Kafka, Kubernetes, PostgreSQL";

    const candidateIntel = buildCandidateIntelligenceProfile("cand_m3_7", resumeText, jdText);
    const jdMatrix = buildJDCompetencyMatrix(jdText, "Backend Engineer", ["Kafka", "PostgreSQL"]);

    const dossier = {
      candidateId: "cand_m3_7",
      targetRole: "Backend Engineer",
      experienceMode: "experienced" as const,
      verifiedSkills: ["Kafka"],
      claimedSkills: ["PostgreSQL"],
      projects: candidateIntel.projects,
      candidateIntelligence: candidateIntel,
      jdCompetencyMatrix: jdMatrix,
      previouslyAssessedCompetencies: {},
      missingOrUnverified: [],
      previousInterviewWeaknesses: [],
    };

    const blueprint = generateInterviewBlueprint(dossier as any, "Backend Engineer", 45, "experienced");
    const sessionState = createAdvancedSessionState(blueprint, dossier as any);

    // Set active section to resume_projects (Stage 2)
    sessionState.blueprint.currentSection = "resume_projects";

    // Call fallback question generator in offline mode
    const fallbackQ = await generateNextAdaptiveQuestion(
      sessionState,
      dossier as any,
      "I have worked with Kafka and PostgreSQL."
    );

    assert.ok(fallbackQ, "Fallback question must be successfully produced");
    assert.ok(fallbackQ.question.length > 10, "Question must have substantive text");

    // Verify it targets project architecture and references project or tech
    assert.ok(
      fallbackQ.question.includes("KafkaStreamFlow") ||
      fallbackQ.question.toLowerCase().includes("kafka") ||
      fallbackQ.question.toLowerCase().includes("data flow"),
      "Fallback question in Stage 2 must cite candidate's planned project or tech stack"
    );
  });

  // ══════════════════════════════════════════════════════════════
  // M3-8: EXPERIENCE LEVEL CALIBRATION (FRESHER VS EXPERIENCED)
  // ══════════════════════════════════════════════════════════════
  await t.test("AC-M3-8: Stage 4 System Design calibrates difficulty by experience mode (Fresher vs Experienced)", async () => {
    const fresherPlan = generateStructuredInterviewPlan(
      { candidateId: "fresher_1", targetRole: "Software Engineer" },
      undefined,
      undefined,
      "Software Engineer",
      45,
      "fresher"
    );

    const experiencedPlan = generateStructuredInterviewPlan(
      { candidateId: "exp_1", targetRole: "Staff Software Engineer" },
      undefined,
      undefined,
      "Staff Software Engineer",
      45,
      "experienced"
    );

    const fresherSysStage = fresherPlan.stages.find((s) => s.stageId === "system_design");
    const experiencedSysStage = experiencedPlan.stages.find((s) => s.stageId === "system_design");

    assert.ok(fresherSysStage, "Fresher plan must have system design stage");
    assert.ok(experiencedSysStage, "Experienced plan must have system design stage");

    // Fresher stage focuses on data structures / rate limiting / API design
    const fresherPrompts = fresherSysStage.questions.map((q) => q.promptStem.toLowerCase()).join(" ");
    assert.ok(
      fresherPrompts.includes("rate limiter") || fresherPrompts.includes("data structure"),
      "Fresher system design should focus on algorithmic / rate limiting problems"
    );

    // Experienced stage focuses on distributed ledger / partition tolerance / scale
    const expPrompts = experiencedSysStage.questions.map((q) => q.promptStem.toLowerCase()).join(" ");
    assert.ok(
      expPrompts.includes("distributed") || expPrompts.includes("payment ledger") || expPrompts.includes("partition"),
      "Experienced system design should focus on distributed systems & partition tolerance"
    );
  });

});

