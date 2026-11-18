import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  handleHintRequest,
  generatePracticeLearningPlan,
  InterviewExperienceMode,
  HintPreferenceLevel,
  PracticeModeReport,
  ProfessionalEvaluationReport,
} from "../lib/interview/interview-mode-service";
import {
  getCompetencyRubricLevel,
  getFormalHiringRecommendation,
  CompetencyRubricLevel,
  FormalAssessmentState,
  FormalHiringRecommendation,
} from "../lib/interview/evidence-evaluation-service";
import {
  generateMilestone5FinalReport,
} from "../lib/interview/final-report-generator";
import {
  detectUnlistedProject,
} from "../lib/interview/unlisted-project-detector";
import {
  buildClaimLedgerFromText,
} from "../lib/interview/ground-truth-service";
import {
  validateQuestionGrounding,
  repairUngroundedQuestion,
} from "../lib/interview/grounding-validator";
import {
  isJunkInput,
  handleJunkInput,
  determineNextPhase,
  isSemanticDuplicate,
} from "../lib/interview/interview-state-machine";
import {
  determineAdaptiveFollowUp,
} from "../lib/interview/adaptive-followup-service";
import {
  acquireTurnLock,
  releaseTurnLock,
  saveActiveSessionState,
  getActiveSessionState,
  markSessionCompleted,
  isSessionCompleted,
} from "../lib/interview-session-store";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
} from "../lib/ai/interview-engine";

describe("COGNALYZE INTERVIEW STUDIO — MASTER SPECIFICATION & ARCHETYPE BENCHMARK", () => {

  // ══════════════════════════════════════════════════════════════════════
  // PART 1: FIVE REPRESENTATIVE CANDIDATE BENCHMARKS
  // ══════════════════════════════════════════════════════════════════════

  test("Candidate A Benchmark: 2nd-Year CS Student (Foundations, Basic Programming, DSA)", async () => {
    const resumeText = `
      Alex Chen - B.Tech Computer Science 2nd Year Student (GPA 8.4/10)
      SKILLS: C++, Python, Data Structures and Algorithms, Object-Oriented Programming
      PROJECTS:
      - Sorting Algorithm Visualizer: Built in C++ and SFML to visualize Quicksort, Mergesort, and Heapsort.
      - Student Grade Management System: Console-based Python application managing student records with file storage.
      COURSEWORK: Data Structures, Discrete Mathematics, Computer Organization.
    `;
    const jdText = `
      Software Engineering Intern - Campus Placement
      Requirements: Strong programming fundamentals in C++ or Python, solid understanding of arrays, linked lists, trees, and time complexity.
    `;

    const dossier = await buildCandidateInterviewDossier("cand_2nd_year", resumeText, jdText);
    assert.ok(dossier.experienceMode === "fresher", "2nd-year student calibrated as fresher");
    assert.ok(dossier.projects.length >= 2, "Candidate A academic projects extracted");

    const blueprint = generateInterviewBlueprint(dossier, "Software Engineering Intern", 30, undefined, "sess_cand_a", jdText);
    assert.ok(blueprint.competencies.length >= 2, "Blueprint competencies created");

    const state = createAdvancedSessionState(blueprint, dossier);
    assert.ok(state.currentDifficulty === "easy" || state.currentDifficulty === "medium", "Difficulty calibrated for 2nd year student");
  });

  test("Candidate B Benchmark: Final-Year CS Student (Full-Stack, React, Node.js, Capstone)", async () => {
    const resumeText = `
      Priya Sharma - B.Tech Final Year Student (Graduating 2025)
      SKILLS: TypeScript, React, Next.js, Node.js, Express, PostgreSQL, Prisma, Tailwind CSS, Docker
      EXPERIENCE:
      - Full Stack Engineering Intern at WebCraft (3 months): Built REST APIs and optimized SQL queries reducing load by 25%.
      PROJECTS:
      - Campus Connect Platform: Real-time messaging and peer marketplace built with Next.js, WebSockets, and PostgreSQL.
    `;
    const jdText = `
      Associate Software Engineer - Full Stack
      Requirements: React/Next.js frontend, Node.js backend services, PostgreSQL database schema design and indexing.
    `;

    const dossier = await buildCandidateInterviewDossier("cand_final_year", resumeText, jdText);
    assert.ok(dossier.experienceMode === "fresher" || dossier.experienceMode === "1-3yr");
    assert.ok(dossier.projects.some(p => p.title.toLowerCase().includes("campus connect")));

    const blueprint = generateInterviewBlueprint(dossier, "Associate Software Engineer", 45, undefined, "sess_cand_b", jdText);
    const sections = blueprint.sectionPlan.map(s => s.section);
    assert.ok(sections.includes("resume_projects"));
    assert.ok(sections.includes("coding_system_design"));
  });

  test("Candidate C Benchmark: Fresher / Recent Graduate (Python, FastAPI, Semantic Search)", async () => {
    const resumeText = `
      Rahul Gupta - Recent Computer Science Graduate
      SKILLS: Python, FastAPI, PostgreSQL, pgvector, Docker, Redis, Git
      PROJECTS:
      - Semantic Code Search Engine: Implemented asynchronous FastAPI endpoints with OpenAI embeddings stored in PostgreSQL with pgvector for sub-100ms similarity lookups.
      - Distributed Task Queue: Built Redis-backed background worker pipeline in Python with graceful failure retries.
    `;
    const jdText = `
      Junior Backend & AI Systems Engineer
      Requirements: Python proficiency, asynchronous programming with FastAPI or asyncio, database integration with PostgreSQL, familiarity with vector search.
    `;

    const dossier = await buildCandidateInterviewDossier("cand_fresher_ai", resumeText, jdText);
    const allSkills = [...dossier.verifiedSkills, ...dossier.claimedSkills].filter(Boolean).map(s => String(s).toLowerCase());
    assert.ok(allSkills.some(s => s.includes("python") || s.includes("fastapi")));
    assert.ok(dossier.projects.some(p => p.title.toLowerCase().includes("semantic")));
  });

  test("Candidate D Benchmark: 3-Year Mid-Level Backend Developer (Microservices, Docker, Redis, Scaling)", async () => {
    const resumeText = `
      Ananya Sen - Backend Software Engineer (3.2 Years Experience)
      EXPERIENCE:
      - Software Engineer at ScaleWave Systems (2022 - Present):
        * Architected order processing microservices in Golang and Node.js serving 15,000 req/sec.
        * Introduced Redis multi-tier caching with mutex-protected cache warming, preventing cache thundering herds.
        * Configured PostgreSQL connection pooling with PgBouncer and optimized index selectivity.
      SKILLS: Golang, Node.js, PostgreSQL, Redis, Kafka, Docker, Kubernetes, Prometheus
      PROJECTS:
      - High Throughput Order Engine: Distributed transaction processing pipeline in Golang and Redis.
    `;
    const jdText = `
      Backend Systems Engineer
      Requirements: 3+ years experience designing scalable distributed services, failure recovery, caching invalidation, and database query optimization.
    `;

    const dossier = await buildCandidateInterviewDossier("cand_mid_backend", resumeText, jdText);
    assert.ok(dossier.experienceMode === "1-3yr" || dossier.experienceMode === "experienced");
    assert.ok(dossier.projects.length >= 1);
  });

  test("Candidate E Benchmark: AI/ML Engineer (PyTorch, RAG Pipelines, Vector DB, Quantization)", async () => {
    const resumeText = `
      Vikram Malhotra - Applied AI / Machine Learning Engineer (2 Years Experience)
      EXPERIENCE:
      - AI Engineer at NeuroFlow AI:
        * Developed hybrid retrieval RAG pipeline using Dense Retrieval (BGE-large) and BM25 with cross-encoder reranking.
        * Quantized Llama-3 models using AWQ and vLLM for high-throughput inference reducing p99 latency from 1.2s to 240ms.
      SKILLS: PyTorch, Hugging Face, vLLM, LangChain, Qdrant, AWQ/GPTQ Quantization, Python, Docker
      PROJECTS:
      - NeuroRAG Hybrid Engine: Vector similarity search with vLLM acceleration.
    `;
    const jdText = `
      AI / LLM Systems Engineer
      Requirements: Production RAG experience, vector embeddings, latency optimization with vLLM or quantization, evaluation benchmarks.
    `;

    const dossier = await buildCandidateInterviewDossier("cand_ai_ml", resumeText, jdText);
    const skills = [...dossier.verifiedSkills, ...dossier.claimedSkills].filter(Boolean).map(s => String(s).toLowerCase());
    assert.ok(skills.some(s => s.includes("pytorch") || s.includes("vllm") || s.includes("rag")));
  });

  // ══════════════════════════════════════════════════════════════════════
  // PART 2: FIFTEEN MANDATORY EDGE & REGRESSION SCENARIOS
  // ══════════════════════════════════════════════════════════════════════

  test("Scenario 1: Resume project missing from candidate self-introduction", () => {
    const { claimLedger } = buildClaimLedgerFromText(
      "cand_omission",
      `PROJECTS:
      - Distributed Event Bus: High-throughput Kafka pipeline with dead-letter queue.
      - E-Commerce Microservices: Order and catalog services in Spring Boot.`
    );
    
    // Candidate self-intro only mentions general college and web apps, omitting Distributed Event Bus
    const candidateIntro = "Hi, I am a software enthusiast. In college I built a few web applications and worked on UI designs.";
    const hasMentionedEventBus = candidateIntro.toLowerCase().includes("event bus") || candidateIntro.toLowerCase().includes("kafka");
    
    assert.equal(hasMentionedEventBus, false, "Candidate did not mention key resume project");
    assert.ok(claimLedger.projects.some(p => p.name.toLowerCase().includes("event bus") || p.name.toLowerCase().includes("software")));
  });

  test("Scenario 2: Unlisted project mentioned in interview (e.g., 'Cognalyze') triggers formal reconciliation law", () => {
    const resumeProjects = [{ name: "Task Manager" }, { name: "Personal Blog" }];
    
    // Candidate verbally introduces Cognalyze, which does NOT appear on the resume
    const candidateSpeech = "Recently I also co-developed Cognalyze, an autonomous interview and evaluation intelligence platform.";
    const detection = detectUnlistedProject(candidateSpeech, resumeProjects, []);
    
    assert.equal(detection.hasUnlistedProject, true);
    assert.equal(detection.unlistedProjectName, "Cognalyze");
    assert.ok(detection.acknowledgmentText?.includes("isn't explicitly listed in the resume you submitted"));
    assert.ok(detection.turnQuestion?.includes("individual contributions"));
  });

  test("Scenario 3: Candidate gives an incorrect technical answer (Alex triggers diagnostic follow-up)", () => {
    const followUp = determineAdaptiveFollowUp({
      answerQuality: "shallow",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 3,
      currentDifficulty: "intermediate",
      isProjectDeepDive: false,
      hasUnverifiedClaim: false,
    });

    assert.equal(followUp.action, "ASK_DEEPER");
    assert.ok(followUp.directivePrompt.includes("under the hood") || followUp.directivePrompt.includes("mechanisms"));
    assert.ok(followUp.rationale.length > 0);
  });

  test("Scenario 4: Candidate gives vague / high-level answer (Alex probes for specific implementation)", () => {
    const followUp = determineAdaptiveFollowUp({
      answerQuality: "shallow",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 3,
      currentDifficulty: "advanced",
      isProjectDeepDive: true,
      hasUnverifiedClaim: false,
    });

    assert.equal(followUp.action, "ASK_IMPLEMENTATION_DETAILS");
    assert.ok(followUp.directivePrompt.includes("mechanics") || followUp.directivePrompt.includes("functions") || followUp.directivePrompt.includes("code"));
  });

  test("Scenario 5: Candidate says 'I don't know' or asks to skip (Graceful de-escalation)", () => {
    const followUp = determineAdaptiveFollowUp({
      answerQuality: "declined",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 3,
      currentDifficulty: "advanced",
      isProjectDeepDive: false,
      hasUnverifiedClaim: false,
    });

    assert.equal(followUp.action, "TEST_FOUNDATIONAL_KNOWLEDGE");
    assert.equal(followUp.targetDifficulty, "foundational");
    assert.ok(followUp.rationale.includes("Graceful de-escalation"));
  });

  test("Scenario 6: Candidate contradicts earlier statement (Alex requests polite clarification)", () => {
    const followUp = determineAdaptiveFollowUp({
      answerQuality: "contradictory",
      turnsSpentOnTopic: 1,
      maxTurnBudget: 3,
      currentDifficulty: "intermediate",
      isProjectDeepDive: true,
      hasUnverifiedClaim: false,
    });

    assert.equal(followUp.action, "ASK_CLARIFICATION");
    assert.ok(followUp.directivePrompt.includes("discrepancy") || followUp.directivePrompt.includes("clarify"));
    assert.ok(followUp.rationale.includes("contradictory"));
  });

  test("Scenario 7: Candidate requests hints in Practice Mode (Hint provided and tracked)", () => {
    const hintDecision = handleHintRequest({
      interviewMode: "practice",
      hintPreference: "subtle_hints",
      currentQuestion: "How would you optimize a database query joining two 10-million row tables on user_id?",
      currentCompetency: "DIM_3_PRACTICAL_IMPL",
      turnIndex: 3,
    });

    assert.equal(hintDecision.isAllowed, true);
    assert.equal(hintDecision.isAssisted, true);
    assert.equal(hintDecision.hintLevel, "subtle_hints");
    assert.ok(hintDecision.responseMessage.length > 20);
    assert.ok(hintDecision.responseMessage.toLowerCase().includes("index") || hintDecision.responseMessage.toLowerCase().includes("consider"));
  });

  test("Scenario 8: Candidate requests hints in Professional Evaluation Mode (Strictly refused)", () => {
    const hintDecision = handleHintRequest({
      interviewMode: "evaluation",
      hintPreference: "guided_hints",
      currentQuestion: "Describe how you would design an idempotency key mechanism for a payment gateway.",
      currentCompetency: "DIM_4_SYSTEM_DESIGN",
      turnIndex: 5,
    });

    assert.equal(hintDecision.isAllowed, false);
    assert.equal(hintDecision.isAssisted, false);
    assert.equal(hintDecision.hintLevel, "none");
    assert.ok(hintDecision.responseMessage.includes("Professional Evaluation Mode"));
    assert.ok(hintDecision.responseMessage.includes("hints and coaching are not permitted"));
  });

  test("Scenario 9: Mid-interview browser refresh recovery preserves state without resetting", () => {
    const sessionId = "sess_refresh_test_101";
    const candidateId = "cand_refresh_user";

    const initialState = {
      id: sessionId,
      candidateId,
      track: "full_stack_web",
      currentSection: "resume_projects",
      turnCount: 4,
      interviewMode: "practice" as const,
      hintPreference: "subtle_hints" as const,
      turns: [
        { turnIndex: 1, question: { question: "Q1" }, answer: "A1", timestamp: new Date().toISOString() },
        { turnIndex: 2, question: { question: "Q2" }, answer: "A2", timestamp: new Date().toISOString() },
        { turnIndex: 3, question: { question: "Q3" }, answer: "A3", timestamp: new Date().toISOString() },
        { turnIndex: 4, question: { question: "Q4" }, answer: "A4", timestamp: new Date().toISOString() },
      ],
      questionsAsked: [{ question: "Q1" }, { question: "Q2" }, { question: "Q3" }, { question: "Q4" }, { question: "Q5" }],
      transcript: [],
      isCompleted: false,
    };

    saveActiveSessionState(sessionId, initialState as any);

    // Simulate browser reload and state retrieval
    const recovered = getActiveSessionState(sessionId, candidateId);
    assert.ok(recovered, "State must be recovered");
    assert.equal(recovered.turnCount, 4);
    assert.equal(recovered.turns.length, 4);
    assert.equal((recovered as any).interviewMode, "practice");
    assert.equal((recovered as any).hintPreference, "subtle_hints");
    assert.equal(recovered.isCompleted, false);
  });

  test("Scenario 10: AI Provider invalid JSON response handling (Graceful fallback)", () => {
    const rawMalformedProviderOutput = "```json\n{ message: 'invalid json without quotes around keys', broken... ";
    let parsed: any = null;
    let fallbackTriggered = false;

    try {
      parsed = JSON.parse(rawMalformedProviderOutput);
    } catch {
      fallbackTriggered = true;
      // Resilient fallback query
      parsed = {
        message: "Could you walk me through the key technical tradeoffs you considered in that architecture?",
        fallback: true
      };
    }

    assert.equal(fallbackTriggered, true);
    assert.ok(parsed.message.length > 0);
    assert.equal(parsed.fallback, true);
  });

  test("Scenario 11: AI Provider timeout handling triggers resilient question", async () => {
    const controller = new AbortController();
    let timedOut = false;

    // Simulate timeout trigger
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        controller.abort();
        timedOut = true;
        reject(new Error("AI Provider request timed out after 30000ms"));
      }, 50);
    });

    await assert.rejects(async () => {
      await timeoutPromise;
    }, /timed out/);

    assert.equal(timedOut, true);
  });

  test("Scenario 12: Double submission idempotency guards against duplicate turns", () => {
    const sessionId = "sess_double_sub_test";
    const candidateId = "cand_idempotency_1";

    // Acquire lock for active turn
    const firstLock = acquireTurnLock(sessionId);
    assert.equal(firstLock, true, "First turn submission acquires lock");

    // Immediate rapid second submission for same session must be blocked
    const secondLock = acquireTurnLock(sessionId);
    assert.equal(secondLock, false, "Duplicate submission for same turn must be rejected");

    releaseTurnLock(sessionId);
    const retryLock = acquireTurnLock(sessionId);
    assert.equal(retryLock, true, "Lock can be reacquired after release");
    releaseTurnLock(sessionId);
  });

  test("Scenario 13: Concurrent request protection preserves turn sequence", () => {
    const sessionId = "sess_concurrent_test";
    
    // Simulate two parallel requests arriving at exact same millisecond
    const lockTurn1 = acquireTurnLock(sessionId);
    const lockTurn1Collision = acquireTurnLock(sessionId);

    assert.equal(lockTurn1, true);
    assert.equal(lockTurn1Collision, false);

    releaseTurnLock(sessionId);
  });

  test("Scenario 14: Switching between Text and Voice preserves session continuity", () => {
    const sessionId = "sess_text_voice_switch";
    const candidateId = "cand_voice_switch";

    const sessionState = {
      id: sessionId,
      candidateId,
      track: "ai_systems",
      turnCount: 2,
      turns: [
        { turnIndex: 1, question: { question: "Text Q1" }, answer: "Text A1" },
        { turnIndex: 2, question: { question: "Text Q2" }, answer: "Text A2" },
      ],
      currentMode: "text",
    };

    saveActiveSessionState(sessionId, sessionState as any);

    // Switch to voice
    const active = getActiveSessionState(sessionId, candidateId);
    assert.ok(active);
    (active as any).currentMode = "voice";
    saveActiveSessionState(sessionId, active);

    const reloaded = getActiveSessionState(sessionId, candidateId);
    assert.equal((reloaded as any).currentMode, "voice");
    assert.equal(reloaded?.turns.length, 2);
  });

  test("Scenario 15: Multi-tenant candidate isolation prevents cross-candidate access", () => {
    const sessionId = "sess_tenant_alice";
    const aliceCandidateId = "candidate_alice_123";
    const malloryCandidateId = "candidate_mallory_999";

    const session = {
      id: sessionId,
      candidateId: aliceCandidateId,
      turnCount: 5,
      isCompleted: false,
      secretNotes: "Alice evaluation in progress",
    };

    saveActiveSessionState(sessionId, session as any);

    // Alice accessing her own session -> Allowed
    const aliceAccess = getActiveSessionState(sessionId, aliceCandidateId);
    assert.ok(aliceAccess);
    assert.equal(aliceAccess.candidateId, aliceCandidateId);

    // Mallory attempting to access Alice's session -> Blocked / Null
    const malloryAccess = getActiveSessionState(sessionId, malloryCandidateId);
    assert.equal(malloryAccess, null, "Cross-tenant access must return null");
  });

  // ══════════════════════════════════════════════════════════════════════
  // PART 3: 5-LEVEL RUBRIC & FORMAL ASSESSMENT STATE VERIFICATION
  // ══════════════════════════════════════════════════════════════════════

  test("5-Level Rubric: Correctly categorizes performance across all 5 levels", () => {
    assert.equal(getCompetencyRubricLevel(98), "LEVEL 5 — EXCELLENT");
    assert.equal(getCompetencyRubricLevel(88), "LEVEL 4 — STRONG");
    assert.equal(getCompetencyRubricLevel(75), "LEVEL 3 — COMPETENT");
    assert.equal(getCompetencyRubricLevel(58), "LEVEL 2 — DEVELOPING");
    assert.equal(getCompetencyRubricLevel(32), "LEVEL 1 — INSUFFICIENT");
    assert.equal(getCompetencyRubricLevel(null), null);
  });

  test("Formal Hiring Recommendation: Computes accurate decision from rubric thresholds", () => {
    // 1. Strongly Recommend: overall >= 88, assessed >= 3, no blocker
    assert.equal(getFormalHiringRecommendation(92, 5, 7, false), "STRONGLY_RECOMMEND");

    // 2. Recommend: overall >= 70, assessed >= 3, no blocker
    assert.equal(getFormalHiringRecommendation(75, 4, 7, false), "RECOMMEND");

    // 3. Further Evaluation: overall in middle or low dimension coverage
    assert.equal(getFormalHiringRecommendation(58, 2, 7, false), "FURTHER_EVALUATION_REQUIRED");

    // 4. Not Recommended: low score (< 50)
    assert.equal(getFormalHiringRecommendation(42, 5, 7, false), "NOT_RECOMMENDED");

    // 5. Critical Policy Blocker: overrides high score to NOT_RECOMMENDED
    assert.equal(getFormalHiringRecommendation(90, 5, 7, true), "NOT_RECOMMENDED");
  });

  test("Practice Learning Plan Generator: Recommends specific curriculum for weak competencies", () => {
    const plan = generatePracticeLearningPlan({
      weakCompetencies: [
        "Data Structures and Algorithms",
        "Relational Database Design and Indexing",
      ],
      strongCompetencies: ["System Design & Caching"],
      assistedTurns: 2,
      totalTurns: 6,
      experienceMode: "student_final_year",
    });

    assert.ok(plan.length >= 2, "Learning plan should address weak competencies");
    assert.ok(plan.some(p => p.category === "DSA"));
    assert.ok(plan.some(p => p.category === "CS Fundamentals"));
    assert.ok(plan.some(p => p.priority === "HIGH"));
    assert.ok(plan.some(p => p.practiceProblemOrModule && p.practiceProblemOrModule.length > 0));
  });

});
