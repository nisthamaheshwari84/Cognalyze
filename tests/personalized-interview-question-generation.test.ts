import test from "node:test";
import assert from "node:assert/strict";
import {
  createTurnQuestionBlueprint,
  synthesizeDynamicQuestionFromBlueprint,
  determineRoleCategory,
} from "../lib/ai/interview-turn-blueprint";
import { resolveCompanyIntelligence } from "../lib/ai/company-intelligence";
import {
  generateBlueprintFallbackQuestion,
  generateNextAdaptiveQuestion,
  isQuestionSemanticallyDuplicate,
  CandidateInterviewDossier,
  AdvancedSessionState,
} from "../lib/ai/interview-engine";

function createMockDossier(overrides: Partial<CandidateInterviewDossier> = {}): CandidateInterviewDossier {
  return {
    candidateId: "cand-" + Math.random().toString(36).substring(7),
    name: "Alex Candidate",
    targetRole: "Software Engineering Intern",
    targetCompany: "Google",
    experienceYears: 0,
    experienceMode: "fresher",
    careerIntent: "Software Engineering",
    verifiedSkills: ["TypeScript", "React", "Node.js"],
    claimedSkills: ["Docker", "Kubernetes"],
    evidenceItems: [],
    projects: [
      {
        title: "Autonomous Logistics Engine",
        tech: ["TypeScript", "Node.js", "Redis"],
        verificationStatus: "verified",
      },
    ],
    githubStatus: {
      connected: true,
      username: "alex-eng",
      publicRepos: 5,
      accessibleRepos: [],
      limitations: [],
    },
    linkedinStatus: {
      connected: false,
      limitations: [],
    },
    missingOrUnverified: ["Distributed Consensus"],
    previousInterviewWeaknesses: [],
    accumulatedWeakTopics: [],
    historicalQuestionsAsked: [],
    ...overrides,
  };
}

function createMockSessionState(overrides: Partial<AdvancedSessionState> = {}): AdvancedSessionState {
  const baseDossier = createMockDossier();
  return {
    sessionId: "sess-" + Math.random().toString(36).substring(7),
    candidateId: baseDossier.candidateId,
    track: "traditional_coding_dsa",
    currentDifficulty: "medium",
    dossier: baseDossier,
    blueprint: {
      totalTargetTurns: 8,
      currentSection: "resume_projects",
      targetRole: baseDossier.targetRole,
      targetCompany: baseDossier.targetCompany,
      experienceMode: baseDossier.experienceMode,
      skillsFocus: ["Algorithms", "Data Structures"],
      sectionPlan: [
        { section: "introduction", targetTurns: 1, focus: "Communication", completed: false },
        { section: "resume_projects", targetTurns: 2, focus: "Project Defense", completed: false },
        { section: "technical_fundamentals", targetTurns: 2, focus: "CS Fundamentals", completed: false },
        { section: "coding_system_design", targetTurns: 2, focus: "DSA", completed: false },
        { section: "behavioral", targetTurns: 1, focus: "Teamwork", completed: false },
        { section: "closing", targetTurns: 1, focus: "Q&A", completed: false },
      ],
      competencies: [],
      sessionId: "sess-test",
      candidateId: baseDossier.candidateId,
      durationMinutes: 45,
      turnCount: 0,
    },
    openingState: "INTERVIEW_IN_PROGRESS",
    turns: [],
    questionsAsked: [],
    topicsCovered: [],
    answerDistribution: { strong: 0, adequate: 0, shallow: 0, off_topic: 0, does_not_know: 0, contradictory: 0 },
    lastAssessment: null,
    consecutiveShallow: 0,
    experienceMode: baseDossier.experienceMode,
    remainingTimeMinutes: 45,
    completedTurns: 0,
    history: [],
    assessedCompetencies: {},
    ...overrides,
  };
}

test("Personalized Interview Question Generation — Scenario Verification Suite", async (t) => {

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO A: AI/ML Intern vs SDE Intern
  // Both candidates are freshers, but applying for completely different roles.
  // Question generation must test distinct domain competencies with zero overlap.
  // ═══════════════════════════════════════════════════════════════════════════
  await t.test("Scenario A: AI/ML Intern vs SDE Intern Domain Separation", () => {
    const aimlDossier = createMockDossier({
      targetRole: "AI/ML Engineering Intern",
      projects: [
        {
          title: "Vision Transformer Segmentation",
          tech: ["PyTorch", "Python", "OpenCV"],
          verificationStatus: "verified",
        },
      ],
      missingOrUnverified: ["Loss Function Convergence"],
    });

    const sdeDossier = createMockDossier({
      targetRole: "Software Engineering Intern",
      projects: [
        {
          title: "Real-time Order Dispatcher",
          tech: ["Go", "PostgreSQL", "Kafka"],
          verificationStatus: "verified",
        },
      ],
      missingOrUnverified: ["Database B-Tree Indexing"],
    });

    // 1. Role Category Domain Verification
    const aimlCategory = determineRoleCategory(aimlDossier.targetRole);
    const sdeCategory = determineRoleCategory(sdeDossier.targetRole);
    assert.equal(aimlCategory, "aiml", "AI/ML role must map to aiml domain");
    assert.equal(sdeCategory, "sde_backend", "SDE role must map to sde_backend domain");

    // 2. Technical Fundamentals Blueprint Comparison
    const aimlBlueprint = createTurnQuestionBlueprint({
      section: "technical_fundamentals",
      targetRole: aimlDossier.targetRole,
      targetCompany: "Tech Corp",
      experienceMode: "fresher",
      dossier: aimlDossier,
    });

    const sdeBlueprint = createTurnQuestionBlueprint({
      section: "technical_fundamentals",
      targetRole: sdeDossier.targetRole,
      targetCompany: "Tech Corp",
      experienceMode: "fresher",
      dossier: sdeDossier,
    });

    assert.notEqual(
      aimlBlueprint.competencyEvaluated,
      sdeBlueprint.competencyEvaluated,
      "AI/ML and SDE fundamentals competencies must be completely distinct"
    );

    // AI/ML should evaluate ML mechanics (Loss functions, Overfitting, PyTorch, Embeddings)
    assert.match(
      `${aimlBlueprint.competencyEvaluated} ${aimlBlueprint.specificSkillTested}`.toLowerCase(),
      /loss|gradient|overfitting|generalization|hyperparameter|activation|regularization|embedding/i,
      "AI/ML blueprint must target genuine ML concepts"
    );

    // SDE should evaluate core software/database concepts (Complexity, Indexes, HTTP/REST, Memory)
    assert.match(
      `${sdeBlueprint.competencyEvaluated} ${sdeBlueprint.specificSkillTested}`.toLowerCase(),
      /time & space complexity|memory layout|pointers|rest|http|api contracts|concurrency|indexing/i,
      "SDE blueprint must target core software engineering concepts"
    );

    // 3. Question Synthesis must be non-generic and role-specific
    const aimlQ = synthesizeDynamicQuestionFromBlueprint(aimlBlueprint);
    const sdeQ = synthesizeDynamicQuestionFromBlueprint(sdeBlueprint);

    assert.ok(!isQuestionSemanticallyDuplicate(aimlQ.question, [sdeQ.question]), "Questions must not be duplicates");
    assert.match(aimlQ.question.toLowerCase(), /overfitting|generalization|loss|dataset|validation|regularization|parameter/i);
    assert.match(sdeQ.question.toLowerCase(), /time and space complexity|worst-case|big-o|memory|array|pointer|http|api|database|index|disk|throughput/i);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO B: Google SDE Intern vs Early-Stage Startup SDE Intern
  // Same role and experience, but different company culture & evaluation style.
  // Google = algorithmic bounds, mathematical optimality, modular invariants.
  // Startup = pragmatic build-vs-buy, velocity, ambiguous specs, production hotfixes.
  // ═══════════════════════════════════════════════════════════════════════════
  await t.test("Scenario B: Google SDE Intern vs Startup SDE Intern Company Culture", () => {
    const googleProfile = resolveCompanyIntelligence("Google");
    const startupProfile = resolveCompanyIntelligence("RapidFlow AI (Y Combinator Startup)");

    assert.equal(googleProfile.isVerifiedCompany, true, "Google must be resolved as a verified company");
    assert.equal(googleProfile.interviewVibe, "algorithmic_rigor", "Google must have algorithmic_rigor vibe");
    assert.equal(startupProfile.interviewVibe, "pragmatic_velocity", "Startup must have pragmatic_velocity vibe");

    const dossier = createMockDossier({
      targetRole: "Software Engineering Intern",
      projects: [{ title: "Micro-ECommerce Backend", tech: ["TypeScript", "PostgreSQL"], verificationStatus: "verified" }],
    });

    const googleBlueprint = createTurnQuestionBlueprint({
      section: "introduction",
      targetRole: dossier.targetRole,
      targetCompany: "Google",
      experienceMode: "fresher",
      dossier,
    });

    const startupBlueprint = createTurnQuestionBlueprint({
      section: "introduction",
      targetRole: dossier.targetRole,
      targetCompany: "RapidFlow Startup",
      experienceMode: "fresher",
      dossier,
    });

    const googleIntro = synthesizeDynamicQuestionFromBlueprint(googleBlueprint);
    const startupIntro = synthesizeDynamicQuestionFromBlueprint(startupBlueprint);

    assert.ok(
      googleIntro.question.includes("Google") && googleIntro.question.includes("computational foundations"),
      "Google question must reflect computational rigor and clean abstractions"
    );
    assert.ok(
      startupIntro.question.includes("RapidFlow Startup") && startupIntro.question.includes("startup environment"),
      "Startup question must reflect velocity, end-to-end ownership, and pragmatic delivery"
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO C: Fresher vs Experienced Backend Engineer
  // Same role and company, different experience tier.
  // Fresher = core fundamentals, language mechanics, basic indexing.
  // Experienced = high-concurrency race conditions, distributed consistency, sharding.
  // ═══════════════════════════════════════════════════════════════════════════
  await t.test("Scenario C: Fresher vs Experienced Backend Engineer Depth Calibration", () => {
    const fresherDossier = createMockDossier({
      targetRole: "Backend Engineer",
      experienceMode: "fresher",
      experienceYears: 0,
      projects: [{ title: "Task Manager REST API", tech: ["Node.js", "Express", "PostgreSQL"], verificationStatus: "verified" }],
    });

    const experiencedDossier = createMockDossier({
      targetRole: "Backend Engineer",
      experienceMode: "experienced",
      experienceYears: 6,
      projects: [{ title: "Distributed Payment Orchestrator", tech: ["Java", "Kafka", "Cassandra", "PostgreSQL"], verificationStatus: "verified" }],
    });

    const fresherBlueprint = createTurnQuestionBlueprint({
      section: "coding_system_design",
      targetRole: "Backend Engineer",
      targetCompany: "Stripe",
      experienceMode: "fresher",
      dossier: fresherDossier,
    });

    const experiencedBlueprint = createTurnQuestionBlueprint({
      section: "coding_system_design",
      targetRole: "Backend Engineer",
      targetCompany: "Stripe",
      experienceMode: "experienced",
      dossier: experiencedDossier,
    });

    assert.equal(fresherBlueprint.difficulty, "medium", "Fresher coding should be medium difficulty");
    assert.equal(fresherBlueprint.questionType, "coding", "Fresher should receive coding question in this section");
    assert.equal(experiencedBlueprint.difficulty, "hard", "Experienced should be hard difficulty");
    assert.equal(experiencedBlueprint.questionType, "system-design", "Experienced should receive system-design in this section");

    const fresherQ = synthesizeDynamicQuestionFromBlueprint(fresherBlueprint);
    const experiencedQ = synthesizeDynamicQuestionFromBlueprint(experiencedBlueprint);

    // Fresher question tests algorithmic problem solving (hash maps, min-heap, two pointers, complexity)
    assert.match(fresherQ.question.toLowerCase(), /hash map|hash table|min-heap|heap|two-pointer|two pointer|big-o|o\(|in-place|edge cases/i);

    // Experienced question tests system architecture, scaling, consensus, or sharding
    assert.match(experiencedQ.question.toLowerCase(), /scale|distributed|database sharding|consistency|idempotency|throughput|partition/i);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO D: Two AI/ML Candidates with Different Projects & Skill Gaps
  // Candidate 1: YOLO Object Detector, gap = Model Quantization & ONNX Export
  // Candidate 2: LangChain Retrieval Engine, gap = Vector DB Reranking
  // Questions must directly anchor to their specific projects and probe their specific unverified gaps.
  // ═══════════════════════════════════════════════════════════════════════════
  await t.test("Scenario D: Project and Gap Grounding for Distinct AI/ML Candidates", () => {
    const cand1 = createMockDossier({
      targetRole: "Computer Vision Engineer",
      projects: [
        {
          title: "YOLO Real-time Edge Detector",
          tech: ["PyTorch", "YOLOv8", "TensorRT", "C++"],
          verificationStatus: "verified",
        },
      ],
      missingOrUnverified: ["Model Quantization & ONNX Export"],
    });

    const cand2 = createMockDossier({
      targetRole: "GenAI Applications Engineer",
      projects: [
        {
          title: "LangChain Enterprise Search Agent",
          tech: ["LangChain", "OpenAI", "Pinecone", "FastAPI"],
          verificationStatus: "verified",
        },
      ],
      missingOrUnverified: ["Vector DB Reranking & Hybrid Search"],
    });

    const bp1 = createTurnQuestionBlueprint({
      section: "resume_projects",
      targetRole: cand1.targetRole,
      targetCompany: "NVIDIA",
      experienceMode: "1-3yr",
      dossier: cand1,
    });

    const bp2 = createTurnQuestionBlueprint({
      section: "resume_projects",
      targetRole: cand2.targetRole,
      targetCompany: "Anthropic",
      experienceMode: "1-3yr",
      dossier: cand2,
    });

    assert.equal(bp1.targetProject?.title, "YOLO Real-time Edge Detector");
    assert.equal(bp1.targetGap, "Model Quantization & ONNX Export");
    assert.ok(bp1.candidateRelevance.includes("YOLO Real-time Edge Detector"));
    assert.ok(bp1.candidateRelevance.includes("Model Quantization & ONNX Export"));

    assert.equal(bp2.targetProject?.title, "LangChain Enterprise Search Agent");
    assert.equal(bp2.targetGap, "Vector DB Reranking & Hybrid Search");
    assert.ok(bp2.candidateRelevance.includes("LangChain Enterprise Search Agent"));
    assert.ok(bp2.candidateRelevance.includes("Vector DB Reranking & Hybrid Search"));

    const q1 = synthesizeDynamicQuestionFromBlueprint(bp1);
    const q2 = synthesizeDynamicQuestionFromBlueprint(bp2);

    assert.ok(q1.question.includes("YOLO Real-time Edge Detector"));
    assert.ok(q2.question.includes("LangChain Enterprise Search Agent"));
    assert.notEqual(q1.question, q2.question);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO E: Same Candidate Across Two Consecutive Interview Sessions
  // Session 1: Candidate takes an interview and struggles on "Concurrency Deadlocks"
  // Session 2: Questions must NEVER duplicate Session 1, and should prioritize weak areas.
  // ═══════════════════════════════════════════════════════════════════════════
  await t.test("Scenario E: Anti-Repetition and Weak Area Targeting across Sessions", () => {
    // Session 1 History
    const session1Questions = [
      "In your project Autonomous Logistics Engine, walk me through your high-level component architecture and database boundaries.",
      "Explain the fundamental difference between optimistic locking and pessimistic locking under high database contention.",
      "How would you detect and prevent deadlocks when multiple workers acquire distributed locks across Redis?",
    ];

    const returningCandidate = createMockDossier({
      targetRole: "Backend Engineer",
      experienceMode: "experienced",
      // Session 1 identified weak topics and historical questions
      historicalQuestionsAsked: session1Questions,
      accumulatedWeakTopics: ["Distributed Concurrency Deadlocks", "Idempotent Retry Patterns"],
      missingOrUnverified: ["Distributed Concurrency Deadlocks"],
      previousInterviewWeaknesses: ["Struggled with deadlock detection invariants in session 1"],
    });

    // Session 2 Turn 1: Resume & Projects
    const session2Bp1 = createTurnQuestionBlueprint({
      section: "resume_projects",
      targetRole: returningCandidate.targetRole,
      targetCompany: "Uber",
      experienceMode: "experienced",
      dossier: returningCandidate,
      questionsAsked: session1Questions.map((q, i) => ({
        question: q,
        targets: "History Target",
        section: "technical_fundamentals",
        competency: "History",
        turnIndex: i + 1,
      })),
    });

    // Session 2 question must target the accumulated weak topic
    assert.equal(
      session2Bp1.targetGap,
      "Distributed Concurrency Deadlocks",
      "Session 2 must target candidate weak topic from session 1"
    );

    const session2Q1 = synthesizeDynamicQuestionFromBlueprint(
      session2Bp1,
      session1Questions
    );

    // Verify Session 2 question is NOT duplicate of any Session 1 questions
    for (const pastQ of session1Questions) {
      assert.ok(
        !isQuestionSemanticallyDuplicate(session2Q1.question, [pastQ]),
        `Session 2 question should not be a duplicate of past question: "${pastQ}"`
      );
    }

    // Verify Fallback Question generation also respects anti-repetition and candidate dossier
    const fallbackQ = generateBlueprintFallbackQuestion({
      section: "technical_fundamentals",
      dossier: returningCandidate,
      questionsAsked: session1Questions.map((q, i) => ({
        question: q,
        targets: "Locking Target",
        section: "technical_fundamentals",
        competency: "Locking",
        turnIndex: i + 1,
      })),
      experienceMode: "experienced",
      targetRole: returningCandidate.targetRole,
    });

    assert.ok(fallbackQ.question.length > 30, "Fallback question must be robust and non-empty");
    for (const pastQ of session1Questions) {
      assert.ok(
        !isQuestionSemanticallyDuplicate(fallbackQ.question, [pastQ]),
        `Fallback question must not duplicate session 1 question: "${pastQ}"`
      );
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADAPTIVE TURN PROGRESSION: Reacting to candidate answer quality
  // Strong answer -> escalate depth
  // Vague/shallow answer -> probe concrete mechanics/metrics
  // Doesn't know -> simplify prerequisite gracefully
  // ═══════════════════════════════════════════════════════════════════════════
  await t.test("Adaptive Progression: Escalation, Probing, and Deferral", () => {
    const dossier = createMockDossier({
      targetRole: "Backend Engineer",
      experienceMode: "experienced",
    });

    // 1. Escalate Depth after Strong Answer
    const escalateBp = createTurnQuestionBlueprint({
      section: "resume_projects",
      targetRole: dossier.targetRole,
      targetCompany: "Amazon",
      experienceMode: "experienced",
      dossier,
      assessment: {
        answer_quality: "strong",
        reasoning: "Candidate gave rigorous explanation of Redis caching layer.",
        topics_demonstrated: ["Redis", "Caching"],
        next_action: "follow_up_probe",
        difficulty_adjustment: "escalate",
        extracted_claims: [],
      },
    });

    assert.equal(escalateBp.adaptedFromPreviousTurn?.actionTaken, "escalate_depth");
    const escalateQ = synthesizeDynamicQuestionFromBlueprint(escalateBp);
    assert.match(escalateQ.question.toLowerCase(), /building on that|hardest production failure|race condition/i);

    // 2. Probe Concrete Metrics after Shallow/Vague Answer
    const probeBp = createTurnQuestionBlueprint({
      section: "resume_projects",
      targetRole: dossier.targetRole,
      targetCompany: "Amazon",
      experienceMode: "experienced",
      dossier,
      assessment: {
        answer_quality: "shallow",
        reasoning: "Candidate used buzzwords without explaining implementation details.",
        topics_demonstrated: [],
        next_action: "follow_up_probe",
        difficulty_adjustment: "maintain",
        extracted_claims: [],
      },
    });

    assert.equal(probeBp.adaptedFromPreviousTurn?.actionTaken, "probe_gap");
    const probeQ = synthesizeDynamicQuestionFromBlueprint(probeBp);
    assert.match(probeQ.question.toLowerCase(), /personally write|frameworks|quantitative metric/i);

    // 3. Simplify Prerequisite after Does Not Know
    const simplifyBp = createTurnQuestionBlueprint({
      section: "resume_projects",
      targetRole: dossier.targetRole,
      targetCompany: "Amazon",
      experienceMode: "experienced",
      dossier,
      assessment: {
        answer_quality: "does_not_know",
        reasoning: "Candidate stated they are not familiar with distributed consensus.",
        topics_demonstrated: [],
        next_action: "simplify_concept",
        difficulty_adjustment: "de-escalate",
        extracted_claims: [],
      },
    });

    assert.equal(simplifyBp.adaptedFromPreviousTurn?.actionTaken, "simplify_prerequisite");
    const simplifyQ = synthesizeDynamicQuestionFromBlueprint(simplifyBp);
    assert.match(simplifyQ.question.toLowerCase(), /no problem at all|step back|fundamental/i);
  });
});
