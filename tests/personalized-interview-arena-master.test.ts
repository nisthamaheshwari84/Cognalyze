import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateAnswerRubricAndModelAnswer,
  generateExemplarModelAnswer,
  extractKeyConceptsForTopic,
  generateLogicalFollowUps,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  generateInterviewFinalReport,
  generateBlueprintFallbackQuestion,
  CandidateInterviewDossier,
  InterviewBlueprint,
} from "../lib/ai/interview-engine";

const mockDossier: CandidateInterviewDossier = {
  candidateId: "cand_master_test",
  name: "Alex Rivera",
  targetRole: "Full-Stack Software Engineer",
  experienceMode: "fresher",
  targetCompany: "Google",
  verifiedSkills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
  claimedSkills: ["System Design", "Redis", "Distributed Systems"],
  githubStatus: {
    connected: true,
    publicRepos: 5,
    accessibleRepos: [],
    limitations: [],
  },
  linkedinStatus: {
    connected: false,
    limitations: [],
  },
  projects: [
    {
      title: "Distributed Task Queue",
      tech: ["Node.js", "Redis", "PostgreSQL"],
      description: "High-throughput asynchronous job processing system with retry backoff.",
      verificationStatus: "verified",
    },
  ],
  missingOrUnverified: [],
  experienceYears: 0,
  careerIntent: "Software Engineer",
  evidenceItems: [],
  previousInterviewWeaknesses: [],
  interviewType: "technical",
};

test("Personalized Interview Arena Master Suite", async (t) => {
  await t.test("1. 100-Point Canonical Rubric: Max dimensions sum exactly to 100", async () => {
    const question = "How do database indexes impact read performance versus write throughput?";
    const answer =
      "B+ tree indexes drastically reduce read latency from an O(N) sequential table scan down to O(log N) tree lookups. However, on writes like INSERT and UPDATE, each index on the table must be updated synchronously, creating write I/O amplification and potential page splits.";

    const evaluation = await evaluateAnswerRubricAndModelAnswer(question, answer, {
      section: "technical_fundamentals",
      experienceMode: "fresher",
      targetRole: "Full-Stack Software Engineer",
      targetCompany: "Google",
      competency: "SQL & Database Indexing",
      dossier: mockDossier,
    });

    assert.ok(evaluation, "Evaluation must return an object");
    assert.equal(typeof evaluation.score, "number", "Score must be a number");
    assert.ok(evaluation.score >= 0 && evaluation.score <= 100, "Score must be within 0-100");

    assert.ok(Array.isArray(evaluation.dimensionScores), "Dimension scores must be an array");
    assert.equal(evaluation.dimensionScores.length, 5, "Must evaluate exactly 5 rubric dimensions");

    const totalMax = evaluation.dimensionScores.reduce((acc, dim) => acc + dim.maxPoints, 0);
    assert.equal(totalMax, 100, "Total maxPoints across dimensions must equal 100");

    for (const dim of evaluation.dimensionScores) {
      assert.ok(dim.earnedPoints >= 0, `${dim.dimension} earnedPoints >= 0`);
      assert.ok(dim.earnedPoints <= dim.maxPoints, `${dim.dimension} earnedPoints <= maxPoints`);
      assert.ok(dim.explanation.length > 0, `${dim.dimension} must have an explanation`);
    }

    assert.ok(evaluation.bestPossibleAnswer.length > 50, "Must provide an exemplar model answer");
    assert.ok(Array.isArray(evaluation.whatYouDidWell), "Must provide what candidate did well");
    assert.ok(Array.isArray(evaluation.whatWasMissing), "Must provide what was missing");
    assert.ok(Array.isArray(evaluation.likelyFollowUps), "Must provide likely follow-up questions");
  });

  await t.test("2. Candidate Deferral: Candidly declining topic is handled professionally", async () => {
    const question = "Can you explain how the Linux kernel handles page replacement under memory pressure?";
    const answer = "I haven't worked deeply with Linux kernel internals, so I'd prefer to skip this one.";

    const evaluation = await evaluateAnswerRubricAndModelAnswer(question, answer, {
      section: "technical_fundamentals",
      experienceMode: "fresher",
      targetRole: "Full-Stack Software Engineer",
      targetCompany: "Google",
      competency: "Operating Systems & Memory",
      dossier: mockDossier,
      answerQuality: "declined",
    });

    assert.ok(evaluation.score >= 10 && evaluation.score <= 30, "Deferral score should reflect candor baseline");
    assert.ok(
      evaluation.whatYouDidWell.some((s) => s.toLowerCase().includes("candor") || s.toLowerCase().includes("professional")),
      "Recognizes professional candor"
    );
    assert.ok(evaluation.bestPossibleAnswer.length > 50, "Still provides exemplar answer for candidate learning");
  });

  await t.test("3. Exemplar Model Answer Engine covers core CS topics", () => {
    const deadlockAnswer = generateExemplarModelAnswer("How do you prevent deadlocks in high concurrency?", {
      section: "technical_fundamentals",
    });
    assert.ok(deadlockAnswer.toLowerCase().includes("deadlock"), "Model answer mentions deadlock mechanics");

    const rateLimitAnswer = generateExemplarModelAnswer("Design a distributed rate limiter for 50,000 requests per second", {
      section: "coding_system_design",
    });
    assert.ok(rateLimitAnswer.toLowerCase().includes("redis") || rateLimitAnswer.toLowerCase().includes("token bucket"), "Model answer covers rate limiting architectures");

    const conflictAnswer = generateExemplarModelAnswer("Tell me about a time you had a technical disagreement with a teammate", {
      section: "behavioral",
    });
    assert.ok(conflictAnswer.toLowerCase().includes("disagreement") || conflictAnswer.toLowerCase().includes("metrics") || conflictAnswer.toLowerCase().includes("trade-offs"), "STAR model answer provided for behavioral conflict");
  });

  await t.test("4. Anti-Repetition Question Engine: Generates diverse non-duplicate questions", () => {
    const questionsAsked: Array<{ question: string }> = [
      { question: "Can you explain how database deadlocks happen and how Read Committed compares to Serializable?" },
    ];

    const nextQ1 = generateBlueprintFallbackQuestion(
      "technical_fundamentals",
      mockDossier,
      questionsAsked as any,
      null,
      "Hello, I am Alex"
    );

    assert.notEqual(
      nextQ1.question,
      questionsAsked[0].question,
      "Fallback question MUST NOT repeat the already asked question"
    );

    questionsAsked.push({ question: nextQ1.question });

    const nextQ2 = generateBlueprintFallbackQuestion(
      "technical_fundamentals",
      mockDossier,
      questionsAsked as any,
      null,
      "Hello, I am Alex"
    );

    assert.notEqual(nextQ2.question, nextQ1.question, "Next fallback question must not repeat previous turn");
  });

  await t.test("5. Blueprint preserves candidate's selected skillsFocus", () => {
    const blueprint: InterviewBlueprint = generateInterviewBlueprint(
      mockDossier,
      "Full-Stack Software Engineer",
      45,
      "fresher",
      "sess_test_skills",
      "",
      "technical",
      "Google",
      ["PostgreSQL", "System Design", "Concurrency"]
    );

    assert.ok(blueprint.skillsFocus, "Blueprint must have skillsFocus property");
    assert.equal(blueprint.skillsFocus.length, 3, "skillsFocus must contain all 3 selected items");
    assert.ok(blueprint.skillsFocus.includes("PostgreSQL"));
  });

  await t.test("6. Final Report includes Question-by-Question Analysis with Rubric Breakdown", async () => {
    const blueprint = generateInterviewBlueprint(
      mockDossier,
      "Full-Stack Software Engineer",
      45,
      "fresher",
      "sess_report_test"
    );
    const sessionState = createAdvancedSessionState(blueprint, mockDossier);

    // Simulate 2 evaluated turns
    sessionState.turns.push({
      turnIndex: 1,
      question: {
        question: "Walk me through how database indexes impact read performance versus write throughput.",
        question_targets: "SQL & Database Indexing",
        question_type: "technical",
        difficulty_level: "medium",
        is_follow_up: false,
        section: "technical_fundamentals",
      },
      answer: "B+ trees provide O(log N) lookups for reads, but each index must be updated synchronously during writes, increasing WAL logging and write I/O.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Accurate analysis of B+ tree lookup and write I/O overhead.",
        topics_demonstrated: ["Database Indexing", "B+ Trees", "Write Amplification"],
        next_action: "move_to_new_topic",
        difficulty_adjustment: "maintain",
      },
      timestamp: new Date().toISOString(),
      rubricScore: 88,
    });

    sessionState.turns.push({
      turnIndex: 2,
      question: {
        question: "How would you design a distributed rate limiter for 50,000 requests per second?",
        question_targets: "Distributed Systems & Caching",
        question_type: "system-design",
        difficulty_level: "hard",
        is_follow_up: false,
        section: "coding_system_design",
      },
      answer: "We can use a Redis cluster running a sliding window counter via Lua script to prevent race conditions.",
      assessment: {
        answer_quality: "strong",
        reasoning: "Good identification of Redis cluster and atomic Lua script execution.",
        topics_demonstrated: ["Distributed Rate Limiting", "Redis", "Atomic Scripts"],
        next_action: "move_to_new_topic",
        difficulty_adjustment: "maintain",
      },
      timestamp: new Date().toISOString(),
      rubricScore: 90,
    });

    const report = await generateInterviewFinalReport(sessionState, [], mockDossier);

    assert.ok(report, "Final report generated");
    assert.ok(report.overallScore >= 80, `Overall score (${report.overallScore}) must reflect answer rubric scores`);
    assert.ok(
      Array.isArray(report.questionByQuestionAnalysis),
      "Report must contain questionByQuestionAnalysis array"
    );
    assert.equal(
      report.questionByQuestionAnalysis!.length,
      2,
      "questionByQuestionAnalysis must contain both turns"
    );

    const firstQ = report.questionByQuestionAnalysis![0];
    assert.equal(firstQ.turnIndex, 1);
    assert.ok(firstQ.exemplarModelAnswer && firstQ.exemplarModelAnswer.length > 50, "Exemplar model answer must be present");
    assert.equal(firstQ.dimensionScores.length, 5, "All 5 rubric dimensions must be present");
  });
});
