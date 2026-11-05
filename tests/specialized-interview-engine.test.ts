import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  TRACK_EVALUATION_RUBRICS,
  SPECIALIZED_QUESTION_CATALOG,
  getTrackSpecializationConfig,
  generateSpecializedTrackFollowUp,
  evaluateIrrelevantAnswerPolicy,
} from "../lib/ai/interview-specialization-engine";
import {
  createTurnQuestionBlueprint,
  synthesizeDynamicQuestionFromBlueprint,
  TurnQuestionBlueprint,
} from "../lib/ai/interview-turn-blueprint";
import {
  assessAndGenerateAdaptiveTurn,
  generateNextAdaptiveQuestion,
  evaluateAnswerRubricAndModelAnswer,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  buildCandidateInterviewDossier,
  InterviewTrack,
  AdvancedSessionState,
} from "../lib/ai/interview-engine";

describe("Specialized Adaptive Technical Interview Engine", () => {
  const allTracks: InterviewTrack[] = [
    "traditional_coding_dsa",
    "code_comprehension",
    "debugging_code_repair",
    "ai_assisted_engineering",
    "system_design",
    "code_review_reliability",
    "senior_engineering_judgment",
    "behavioral_project_deep_dives",
  ];

  // ═════════════════════════════════════════════════════════════════════════
  // 1. ALL 8 TRACK RUBRICS VERIFICATION
  // ═════════════════════════════════════════════════════════════════════════
  test("All 8 preparation disciplines have 5-dimension rubrics totaling 100 points", () => {
    for (const track of allTracks) {
      const rubric = TRACK_EVALUATION_RUBRICS[track];
      assert.ok(rubric, `Track ${track} must have evaluation rubric defined`);
      assert.equal(rubric.length, 5, `Track ${track} must define exactly 5 dimensions`);

      const totalWeight = rubric.reduce((sum, d) => sum + d.weight, 0);
      assert.equal(totalWeight, 100, `Track ${track} dimension weights must sum to 100%`);

      for (const dim of rubric) {
        assert.ok(dim.name.length > 0, `Dimension ${dim.id} must have a name`);
        assert.ok(dim.whatStrongEvidenceLooksLike.length > 0, `Dimension ${dim.id} must specify strong evidence`);
        assert.ok(dim.whatWeakEvidenceLooksLike.length > 0, `Dimension ${dim.id} must specify weak evidence`);
      }
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 2. DISCIPLINE A: TRADITIONAL CODING & DSA
  // ═════════════════════════════════════════════════════════════════════════
  test("Traditional Coding & DSA synthesizes algorithmic problem statements with Big-O requirements", async () => {
    const dossier = await buildCandidateInterviewDossier("cand-dsa");
    const blueprint = createTurnQuestionBlueprint({
      currentSection: "coding_system_design",
      track: "traditional_coding_dsa",
      targetRole: "Software Development Engineer",
      targetCompany: "Google",
      experienceMode: "fresher",
      dossier,
      turnIndex: 3,
    });

    const question = synthesizeDynamicQuestionFromBlueprint(blueprint);
    assert.equal(blueprint.track, "traditional_coding_dsa");
    assert.ok(
      question.question.includes("O(") ||
      question.question.toLowerCase().includes("time complexity") ||
      question.question.toLowerCase().includes("space complexity") ||
      question.question.toLowerCase().includes("sliding window") ||
      question.question.toLowerCase().includes("heap") ||
      question.question.toLowerCase().includes("algorithm"),
      "Traditional Coding question must test algorithmic constraints and Big-O complexity"
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 3. DISCIPLINE B: CODE COMPREHENSION (CODE-FIRST)
  // ═════════════════════════════════════════════════════════════════════════
  test("Code Comprehension presents actual code snippets in markdown code blocks", async () => {
    const dossier = await buildCandidateInterviewDossier("cand-comp");
    const blueprint = createTurnQuestionBlueprint({
      currentSection: "technical_fundamentals",
      track: "code_comprehension",
      targetRole: "Full Stack Engineer",
      targetCompany: "Stripe",
      experienceMode: "1-3yr",
      dossier,
      turnIndex: 2,
    });

    const question = synthesizeDynamicQuestionFromBlueprint(blueprint);
    assert.equal(blueprint.track, "code_comprehension");
    assert.ok(blueprint.trackTemplate, "Code Comprehension turn must attach trackTemplate");
    assert.equal(blueprint.trackTemplate?.interactionFormat, "code_comprehension_snippet");
    assert.ok(
      question.question.includes("```"),
      "Code Comprehension questions must present actual code snippets in markdown blocks"
    );
    assert.ok(
      question.question.toLowerCase().includes("predict") ||
      question.question.toLowerCase().includes("output") ||
      question.question.toLowerCase().includes("trace") ||
      question.question.toLowerCase().includes("console"),
      "Code Comprehension questions must ask candidate to trace execution or predict output"
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 4. DISCIPLINE C: DEBUGGING & CODE REPAIR
  // ═════════════════════════════════════════════════════════════════════════
  test("Debugging & Code Repair presents broken code and demands defect line, root cause, and patch", async () => {
    const dossier = await buildCandidateInterviewDossier("cand-debug");
    const blueprint = createTurnQuestionBlueprint({
      currentSection: "technical_fundamentals",
      track: "debugging_code_repair",
      targetRole: "Backend Engineer",
      targetCompany: "Uber",
      experienceMode: "experienced",
      dossier,
      turnIndex: 3,
    });

    const question = synthesizeDynamicQuestionFromBlueprint(blueprint);
    assert.equal(blueprint.track, "debugging_code_repair");
    assert.ok(blueprint.trackTemplate, "Debugging turn must attach trackTemplate");
    assert.equal(blueprint.trackTemplate?.interactionFormat, "debugging_broken_code");
    assert.ok(
      question.question.includes("```"),
      "Debugging questions must embed broken code snippets in markdown code blocks"
    );
    assert.ok(
      question.question.toLowerCase().includes("bug") ||
      question.question.toLowerCase().includes("defect") ||
      question.question.toLowerCase().includes("root cause") ||
      question.question.toLowerCase().includes("patch"),
      "Debugging questions must demand defect location, root cause, and patch"
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 5. DISCIPLINE D: AI-ASSISTED ENGINEERING
  // ═════════════════════════════════════════════════════════════════════════
  test("AI-Assisted Engineering presents AI code audit tasks with subtle hallucinations or edge cases", async () => {
    const dossier = await buildCandidateInterviewDossier("cand-ai");
    const blueprint = createTurnQuestionBlueprint({
      currentSection: "technical_fundamentals",
      track: "ai_assisted_engineering",
      targetRole: "AI / ML Engineer",
      targetCompany: "OpenAI",
      experienceMode: "experienced",
      dossier,
      turnIndex: 2,
    });

    const question = synthesizeDynamicQuestionFromBlueprint(blueprint);
    assert.equal(blueprint.track, "ai_assisted_engineering");
    assert.ok(blueprint.trackTemplate, "AI-Assisted Engineering turn must attach trackTemplate");
    assert.equal(blueprint.trackTemplate?.interactionFormat, "ai_code_audit");
    assert.ok(
      question.question.includes("```"),
      "AI Engineering questions must embed AI-generated code for auditing"
    );
    assert.ok(
      question.question.toLowerCase().includes("audit") ||
      question.question.toLowerCase().includes("ai") ||
      question.question.toLowerCase().includes("flaw") ||
      question.question.toLowerCase().includes("hallucinat") ||
      question.question.toLowerCase().includes("subtle"),
      "AI Engineering questions must challenge the candidate to audit AI-generated code"
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 6. DISCIPLINE E: SYSTEM DESIGN & SCALE
  // ═════════════════════════════════════════════════════════════════════════
  test("System Design & Scale provides concrete scale numbers (RPS, storage, latency)", async () => {
    const dossier = await buildCandidateInterviewDossier("cand-sys");
    const blueprint = createTurnQuestionBlueprint({
      currentSection: "coding_system_design",
      track: "system_design",
      targetRole: "Staff Distributed Systems Engineer",
      targetCompany: "Netflix",
      experienceMode: "experienced",
      dossier,
      turnIndex: 4,
    });

    const question = synthesizeDynamicQuestionFromBlueprint(blueprint);
    assert.equal(blueprint.track, "system_design");
    assert.ok(
      question.question.includes("RPS") ||
      question.question.includes("requests per second") ||
      question.question.includes("latency") ||
      question.question.includes("partition") ||
      question.question.includes("scale"),
      "System Design questions must include concrete scale numbers and constraints"
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 7. DISCIPLINE F: CODE REVIEW & RELIABILITY
  // ═════════════════════════════════════════════════════════════════════════
  test("Code Review & Reliability presents PR diffs and queries for code smells and maintainability", async () => {
    const dossier = await buildCandidateInterviewDossier("cand-review");
    const blueprint = createTurnQuestionBlueprint({
      currentSection: "technical_fundamentals",
      track: "code_review_reliability",
      targetRole: "Senior Backend Engineer",
      targetCompany: "GitHub",
      experienceMode: "experienced",
      dossier,
      turnIndex: 2,
    });

    const question = synthesizeDynamicQuestionFromBlueprint(blueprint);
    assert.equal(blueprint.track, "code_review_reliability");
    assert.ok(blueprint.trackTemplate, "Code Review turn must attach trackTemplate");
    assert.equal(blueprint.trackTemplate?.interactionFormat, "code_review_diff");
    assert.ok(
      question.question.includes("```diff") || question.question.includes("PR") || question.question.includes("review"),
      "Code Review questions must present PR diffs and request code review comments"
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 8. DISCIPLINE G: SENIOR ENGINEERING JUDGMENT (TRADE-OFFS)
  // ═════════════════════════════════════════════════════════════════════════
  test("Senior Engineering Judgment presents real architecture dilemmas and trade-offs", async () => {
    const dossier = await buildCandidateInterviewDossier("cand-lead");
    const blueprint = createTurnQuestionBlueprint({
      currentSection: "technical_fundamentals",
      track: "senior_engineering_judgment",
      targetRole: "Principal Engineer",
      targetCompany: "Amazon",
      experienceMode: "experienced",
      dossier,
      turnIndex: 3,
    });

    const question = synthesizeDynamicQuestionFromBlueprint(blueprint);
    assert.equal(blueprint.track, "senior_engineering_judgment");
    assert.ok(
      question.question.toLowerCase().includes("trade-off") ||
      question.question.toLowerCase().includes("monolith") ||
      question.question.toLowerCase().includes("microservice") ||
      question.question.toLowerCase().includes("debt") ||
      question.question.toLowerCase().includes("decision"),
      "Senior Engineering Judgment questions must present architecture dilemmas"
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 9. DISCIPLINE H: BEHAVIORAL & PROJECT DEEP DIVES (STAR)
  // ═════════════════════════════════════════════════════════════════════════
  test("STAR & Engineering Ownership uses STAR inquiry anchored to candidate experience", async () => {
    const dossier = await buildCandidateInterviewDossier("cand-star");
    const blueprint = createTurnQuestionBlueprint({
      currentSection: "behavioral",
      track: "behavioral_project_deep_dives",
      targetRole: "Engineering Lead",
      targetCompany: "Airbnb",
      experienceMode: "experienced",
      dossier,
      turnIndex: 5,
    });

    const question = synthesizeDynamicQuestionFromBlueprint(blueprint);
    assert.equal(blueprint.track, "behavioral_project_deep_dives");
    assert.ok(
      question.question.toLowerCase().includes("tell me about") ||
      question.question.toLowerCase().includes("time when") ||
      question.question.toLowerCase().includes("incident") ||
      question.question.toLowerCase().includes("ownership") ||
      question.question.toLowerCase().includes("disagree"),
      "Behavioral & Project Deep Dives must use authentic STAR inquiry"
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 10. TRACK LOCKING: 80-90%+ SUBSTANTIVE QUESTIONS BELONG TO TRACK
  // ═════════════════════════════════════════════════════════════════════════
  test("80-90%+ of substantive assessment questions belong strictly to selected track", async () => {
    const targetTrack: InterviewTrack = "debugging_code_repair";
    const dossier = await buildCandidateInterviewDossier("cand-locked");
    const questionsAsked: any[] = [];
    let trackSpecificQuestionsCount = 0;
    const substantiveTurns = 8; // turns 2 through 9

    for (let turn = 1; turn <= substantiveTurns; turn++) {
      const blueprint = createTurnQuestionBlueprint({
        currentSection: "technical_fundamentals",
        track: targetTrack,
        targetRole: "Senior Systems Engineer",
        targetCompany: "Datadog",
        experienceMode: "experienced",
        dossier,
        turnIndex: turn + 1,
        questionsAsked,
      });

      const q = synthesizeDynamicQuestionFromBlueprint(blueprint, questionsAsked);
      questionsAsked.push(q);

      if (blueprint.trackTemplate?.track === targetTrack || q.question.includes("```")) {
        trackSpecificQuestionsCount++;
      }
    }

    const ratio = trackSpecificQuestionsCount / substantiveTurns;
    assert.ok(
      ratio >= 0.8,
      `Track locking violated: expected >= 80% track-locked questions, got ${Math.round(ratio * 100)}%`
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 11. SPECIALIZED FOLLOW-UP GENERATOR
  // ═════════════════════════════════════════════════════════════════════════
  test("Specialized Follow-Ups drill into candidate claims without repeating or exceeding 2 turns", () => {
    const followUp = generateSpecializedTrackFollowUp({
      track: "code_comprehension",
      candidateAnswer: "The child component will trigger a re-render when count state changes in the parent component.",
      originalQuestion: "What happens when button is clicked?",
      competency: "react_reconciliation",
      difficulty: "medium",
      followUpsCountOnTopic: 0,
    });

    assert.equal(followUp.actionTaken, "follow_up_probe");
    assert.ok(
      followUp.followUpQuestion.toLowerCase().includes("re-render") ||
      followUp.followUpQuestion.toLowerCase().includes("boundary") ||
      followUp.followUpQuestion.toLowerCase().includes("child"),
      "Follow-up must probe candidate's specific statement about re-rendering"
    );

    // Limit check: after 2 follow-ups on same topic, must advance to new topic
    const cappedFollowUp = generateSpecializedTrackFollowUp({
      track: "code_comprehension",
      candidateAnswer: "I memoized the child with React.memo.",
      originalQuestion: "What happens when button is clicked?",
      competency: "react_reconciliation",
      difficulty: "medium",
      followUpsCountOnTopic: 2,
    });

    assert.equal(cappedFollowUp.actionTaken, "advance_new_topic");
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 12. IRRELEVANT ANSWER POLICY
  // ═════════════════════════════════════════════════════════════════════════
  test("Irrelevant answer policy: Turn 1 redirects, Turn 2 clarifies expectations, Turn 3 concludes assessment", () => {
    const track: InterviewTrack = "debugging_code_repair";
    const question = "Please identify the root cause in the snippet above.";

    // Attempt 1: Nonsense
    const res1 = evaluateIrrelevantAnswerPolicy("idk", 0, track, question);
    assert.equal(res1.shouldTerminateEarly, false);
    assert.equal(res1.action, "redirect");
    assert.equal(res1.consecutiveIrrelevantCount, 1);
    assert.ok(res1.interviewerMessage.includes("refocus on the specific problem"));

    // Attempt 2: Nonsense
    const res2 = evaluateIrrelevantAnswerPolicy("blah blah", 1, track, question);
    assert.equal(res2.shouldTerminateEarly, false);
    assert.equal(res2.action, "clarify_expectations");
    assert.equal(res2.consecutiveIrrelevantCount, 2);
    assert.ok(res2.interviewerMessage.includes("we are specifically looking to evaluate"));

    // Attempt 3: Nonsense -> Early professional termination
    const res3 = evaluateIrrelevantAnswerPolicy("asdf", 2, track, question);
    assert.equal(res3.shouldTerminateEarly, true);
    assert.equal(res3.action, "conclude_assessment");
    assert.equal(res3.consecutiveIrrelevantCount, 3);
    assert.ok(res3.interviewerMessage.includes("we will conclude our interview session here today"));
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 13. TRACK-SPECIFIC EVALUATION RUBRICS
  // ═════════════════════════════════════════════════════════════════════════
  test("evaluateAnswerRubricAndModelAnswer produces track-specific evaluation dimensions", async () => {
    const result = await evaluateAnswerRubricAndModelAnswer(
      "Inspect the following PR diff and identify the architectural flaw.",
      "In lines 12-16 there is a severe N+1 query loop inside the for loop that makes individual DB queries per user instead of batching.",
      {
        section: "technical_fundamentals",
        experienceMode: "experienced",
        targetRole: "Senior Engineer",
        targetCompany: "GitHub",
        track: "code_review_reliability",
      }
    );

    assert.ok(result.score > 70, "Strong candidate answer should receive solid rubric score");
    assert.ok(
      result.dimensionScores.some((d) => d.dimension.toLowerCase().includes("defect") || d.dimension.toLowerCase().includes("correctness")),
      "Rubric must evaluate Defect Detection & Correctness for Code Review track"
    );
  });
});

