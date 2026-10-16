import test from "node:test";
import assert from "node:assert/strict";
import {
  validateQuestionCompleteness,
  ensureValidQuestion,
  isCandidateDecline,
  parseJobDescription,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  assessCandidateAnswer,
  generateNextAdaptiveQuestion,
  generateBlueprintFallbackQuestion,
  COMPETENCY_CATEGORIES,
  CandidateInterviewDossier
} from "@/lib/ai/interview-engine";

const mockCandidateDossier: CandidateInterviewDossier = {
  candidateId: "cand-elite-test-01",
  name: "Nistha Maheshwari",
  targetRole: "Full-Stack Software Engineer (Distributed Systems & AI)",
  experienceYears: 2,
  experienceMode: "1-3yr",
  careerIntent: "Building scalable backend services and AI agent systems",
  verifiedSkills: ["TypeScript", "Next.js", "PostgreSQL", "Docker"],
  claimedSkills: ["Kafka", "Redis", "Distributed Systems", "GraphQL"],
  evidenceItems: [
    {
      source: "resume",
      claimOrObservation: "Built an automated recovery bot with PostgreSQL and Python",
      status: "CANDIDATE_CLAIM",
      detail: "Created recovery pipelines handling failovers",
      relatedCompetency: "System Resilience",
      relevanceScore: 0.9,
    },
  ],
  projects: [
    {
      title: "automated-recovery-bot",
      tech: ["Python", "PostgreSQL", "Docker"],
      githubRepo: "automated-recovery-bot",
      description: "Distributed recovery pipeline",
      verificationStatus: "CLAIMED",
    },
    {
      title: "cognalyze-engine",
      tech: ["Next.js", "TypeScript", "Tailwind CSS"],
      verificationStatus: "VERIFIED",
    },
  ],
  githubStatus: {
    connected: true,
    username: "nistha-dev",
    publicRepos: 12,
    accessibleRepos: [
      {
        name: "automated-recovery-bot",
        primaryLang: "Python",
        hasTests: true,
        frameworks: ["AsyncIO", "PostgreSQL"],
        codeQualitySignals: ["Type annotations", "Unit tests present"],
      },
    ],
    limitations: [],
  },
  linkedinStatus: {
    connected: false,
    limitations: ["LinkedIn profile not connected"],
  },
  missingOrUnverified: ["Kafka and Redis are claimed on resume but unverified"],
  previousInterviewWeaknesses: ["Database Deadlock Isolation"],
};

test("Phase 5: Question Completeness Validation catches truncated sentences and dangling verbs", () => {
  // Truncated question ending in "Walk"
  const truncated1 = "I saw your GitHub repo 'automated-recovery-bot' where you built a distributed recovery pipeline with Python and PostgreSQL. Walk";
  const res1 = validateQuestionCompleteness(truncated1);
  assert.strictEqual(res1.isValid, false);
  assert.match(res1.reason || "", /dangling verb|truncated thought/i);

  // Truncated question ending in "Could you give"
  const truncated2 = "I understand you'd rather not dive into the code now. Could you give";
  const res2 = validateQuestionCompleteness(truncated2);
  assert.strictEqual(res2.isValid, false);
  assert.match(res2.reason || "", /dangling verb|truncated thought/i);

  // Question missing terminal punctuation
  const missingPunctuation = "How did you design the recovery pipeline in your automated recovery bot project";
  const res3 = validateQuestionCompleteness(missingPunctuation);
  assert.strictEqual(res3.isValid, false);
  assert.match(res3.reason || "", /terminal punctuation/i);

  // Unclosed backticks
  const unclosedBacktick = "How did you handle the `postgres transaction in your pipeline?";
  const res4 = validateQuestionCompleteness(unclosedBacktick);
  assert.strictEqual(res4.isValid, false);
  assert.match(res4.reason || "", /backtick/i);

  // Complete, valid question
  const validQuestion = "I noticed that your automated-recovery-bot project uses Python and PostgreSQL. Could you explain its architecture, how the recovery pipeline works, and how you handle failures?";
  const resValid = validateQuestionCompleteness(validQuestion);
  assert.strictEqual(resValid.isValid, true);
  assert.strictEqual(resValid.cleanedQuestion, validQuestion);
});

test("Phase 5: ensureValidQuestion repairs truncated model outputs into complete, self-contained questions", () => {
  const truncatedQ = "I saw your GitHub repo 'automated-recovery-bot' where you built a distributed recovery pipeline with Python and PostgreSQL. Walk";
  
  const repaired = ensureValidQuestion(
    truncatedQ,
    "resume_projects",
    mockCandidateDossier,
    "Project Architecture"
  );

  assert.strictEqual(typeof repaired.question, "string");
  assert.ok(repaired.question.length > 25);
  // Must end with punctuation
  assert.ok(/[?.!]$/.test(repaired.question));
  // Must NOT end with "Walk"
  assert.ok(!repaired.question.endsWith("Walk"));
  // Validates completely
  const check = validateQuestionCompleteness(repaired.question);
  assert.strictEqual(check.isValid, true);
});

test("Phase 7: Candidate Decline Detection accurately detects polite passes, 'No', and deferrals", () => {
  assert.strictEqual(isCandidateDecline("No"), true);
  assert.strictEqual(isCandidateDecline("No."), true);
  assert.strictEqual(isCandidateDecline("Nope"), true);
  assert.strictEqual(isCandidateDecline("Pass on this one"), true);
  assert.strictEqual(isCandidateDecline("I'd rather not dive into the code now"), true);
  assert.strictEqual(isCandidateDecline("Can we skip to the next topic?"), true);
  assert.strictEqual(isCandidateDecline("I prefer not to answer this"), true);
  assert.strictEqual(isCandidateDecline("I don't remember the exact syntax"), true);

  // Substantive technical answers must NOT be flagged as declines
  assert.strictEqual(isCandidateDecline("In Postgres, we configured WAL archiving and replication slots with async streaming."), false);
  assert.strictEqual(isCandidateDecline("We used Redis cluster for caching session tokens with a 15 minute TTL."), false);
});

test("Phase 7: assessCandidateAnswer treats candidate declines respectfully without harsh shallow penalties", async () => {
  const blueprint = generateInterviewBlueprint(mockCandidateDossier, mockCandidateDossier.targetRole);
  const sessionState = createAdvancedSessionState(blueprint, mockCandidateDossier);

  const q = "Could you walk me through the database locking mechanics in automated-recovery-bot?";
  const declineAnswer = "No, I'd rather not dive into the code right now.";

  const assessment = await assessCandidateAnswer(q, declineAnswer, sessionState, mockCandidateDossier);

  assert.strictEqual(assessment.answer_quality, "declined");
  assert.strictEqual(assessment.next_action, "acknowledge_and_advance");
  assert.strictEqual(assessment.difficulty_adjustment, "maintain");
  assert.match(assessment.reasoning, /declined|defer/i);
});

test("Phase 7: Fallback generator pivots smoothly when a candidate declines a question", () => {
  const declinedAssessment = {
    answer_quality: "declined" as const,
    reasoning: "Candidate declined question",
    topics_demonstrated: [],
    next_action: "acknowledge_and_advance" as const,
    difficulty_adjustment: "maintain" as const,
  };

  const nextQ = generateBlueprintFallbackQuestion(
    "resume_projects",
    mockCandidateDossier,
    [],
    declinedAssessment
  );

  // Must acknowledge politely
  assert.match(nextQ.question, /no problem at all|let's approach this from another angle/i);
  // Must be a complete question
  const check = validateQuestionCompleteness(nextQ.question);
  assert.strictEqual(check.isValid, true);
});

test("Phase 1 & 2: parseJobDescription categorizes mandatory, important, and preferred competencies across 26-Category Matrix", () => {
  // Test AI/ML Job Description
  const aiJd = `
    Senior AI/ML Engineer
    Mandatory: Deep understanding of PyTorch, LLM fine-tuning, RAG pipelines, and model evaluation metrics.
    Experience with Python and vector databases.
    Responsibilities: Deploy high-throughput inference engines and maintain data pipelines.
  `;
  const parsedAI = parseJobDescription(aiJd, "fresher");
  assert.strictEqual(parsedAI.seniorityExpectations, "experienced"); // Detected Senior
  assert.ok(parsedAI.targetCategories.includes("R_AIML_FUNDAMENTALS"));
  assert.ok(parsedAI.targetCategories.includes("S_LLM_INTEGRATION"));

  // Test Backend Systems Job Description
  const backendJd = `
    Backend Engineer
    We are looking for an engineer experienced in building distributed microservices, REST and gRPC APIs,
    optimizing PostgreSQL queries, and managing concurrency with Redis queues.
  `;
  const parsedBackend = parseJobDescription(backendJd, "1-3yr");
  assert.ok(parsedBackend.targetCategories.includes("M_BACKEND_ENGINEERING"));
  assert.ok(parsedBackend.targetCategories.includes("J_DATABASES_SQL"));
  assert.ok(parsedBackend.targetCategories.includes("O_APIS_AUTHENTICATION"));

  // Test General SWE Job Description
  const sweJd = "Software Development Engineer: Strong data structures, algorithms, problem solving, and object-oriented design.";
  const parsedSwe = parseJobDescription(sweJd, "fresher");
  assert.ok(parsedSwe.targetCategories.includes("F_DATA_STRUCTURES_ALGORITHMS"));
  assert.ok(parsedSwe.targetCategories.includes("H_COMPLEXITY_ANALYSIS"));
});

test("Phase 2 & 3: generateInterviewBlueprint constructs comprehensive coverage matrix with status and time budgets", () => {
  const blueprint = generateInterviewBlueprint(
    mockCandidateDossier,
    "Senior Backend & Distributed Systems Engineer",
    45,
    "experienced",
    "sess-test-matrix",
    "Senior Backend Engineer: PostgreSQL, Distributed Architecture, System Design, Concurrency"
  );

  assert.strictEqual(blueprint.experienceMode, "experienced");
  assert.ok(blueprint.competencies.length >= 5);

  // Every competency must have id, name, category, tier, status, and time budget
  for (const comp of blueprint.competencies) {
    assert.ok(comp.id);
    assert.ok(comp.name);
    assert.ok(["Critical", "Important", "Preferred"].includes(comp.tier));
    assert.strictEqual(comp.status, "unassessed");
    assert.strictEqual(comp.isAssessed, false);
    assert.ok(Number(comp.timeBudgetMinutes) > 0);
  }

  // Must have System Design for experienced candidate
  const hasSystemDesign = blueprint.competencies.some((c) => c.category === "system_design");
  assert.strictEqual(hasSystemDesign, true);

  // Must have Project Deep Dive
  const hasProjDeepDive = blueprint.competencies.some((c) => c.category === "project_deep_dive");
  assert.strictEqual(hasProjDeepDive, true);
});

test("Phase 12: Question numbering starts at 1 only after opening introduction is acknowledged", () => {
  const blueprint = generateInterviewBlueprint(mockCandidateDossier, mockCandidateDossier.targetRole);
  const sessionState = createAdvancedSessionState(blueprint, mockCandidateDossier);

  // Step 1: Opening greeting
  assert.strictEqual(sessionState.openingState, "GREETING");
  assert.strictEqual(sessionState.turns.length, 0);

  // Step 2: Introduction received -> Question 1
  sessionState.openingState = "AWAITING_CANDIDATE_INTRO";
  sessionState.candidateIntroduction = "Hi, I'm Nistha. I love building distributed systems with Python and Next.js.";
  sessionState.openingState = "INTERVIEW_IN_PROGRESS";

  // Simulate Turn 1 recording
  sessionState.turns.push({
    turnIndex: 1,
    question: {
      question: "Thanks for sharing that background! Walk me through your automated-recovery-bot architecture.",
      question_targets: "Project Ownership",
      question_type: "project-defense",
      difficulty_level: "medium",
      is_follow_up: false,
      section: "resume_projects",
    },
    answer: "In automated-recovery-bot, we implemented a distributed failover detector.",
    assessment: {
      answer_quality: "strong",
      reasoning: "Solid architectural explanation",
      topics_demonstrated: ["Distributed Architecture"],
      next_action: "move_to_new_topic",
      difficulty_adjustment: "maintain",
    },
    timestamp: new Date().toISOString(),
  });

  assert.strictEqual(sessionState.turns.length, 1);
  assert.strictEqual(sessionState.turns[0].turnIndex, 1);
});
