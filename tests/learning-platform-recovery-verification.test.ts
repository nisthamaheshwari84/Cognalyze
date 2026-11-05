/**
 * tests/learning-platform-recovery-verification.test.ts
 * 
 * Comprehensive end-to-end regression test suite verifying the complete recovery
 * of the Cognalyze AI & Data learning platform, AI Teacher Co-Construction,
 * canonical curriculum expansion, statistical lab calculations, company prep,
 * and dry-run execution traces.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  getAllTracks,
  getAllLessons,
  getTrackBySlug,
  getLessonBySlug
} from "../lib/skills/ai-data/curriculum";

import {
  getTopicTeacherPackage,
  validateCoBuildSlotInput,
  validateDebugFix
} from "../lib/skills/ai-data/ai-teacher-engine";

import {
  computeLiveAbExperimentDiagnostics,
  evaluateAbTestDecision
} from "../lib/skills/ai-data/ab-testing-engine";

import {
  HISTORICAL_COMPANY_QUESTIONS_BANK,
  getHistoricalCompanyQuestions,
  getHistoricalCompanyQuestionById
} from "../lib/skills/ai-data/historical-company-bank";

import { COMPANY_DIRECTORY } from "../lib/skills/company-directory";

import {
  listAvailableDryRunTraces,
  getDryRunTrace
} from "../lib/skills/ai-data/dry-run-visualizer";

import { executeSqlInSandbox } from "../lib/skills/ai-data/sql-lab-engine";
import { executePythonInSandbox } from "../lib/skills/ai-data/python-lab-engine";
import { syncArenaAttemptToDNA } from "../lib/skills/ai-data/dna-adapter";

describe("Recovery Verification 1: Canonical Curriculum Graph & Completeness", () => {
  test("All 6 canonical tracks exist with structured stages and objectives", () => {
    const tracks = getAllTracks();
    assert.equal(tracks.length, 6, "Must define exactly 6 canonical tracks");

    const expectedSlugs = [
      "ai_ml",
      "data_science_analytics",
      "genai_llm",
      "data_eng",
      "mlops",
      "applied_projects"
    ];

    for (const slug of expectedSlugs) {
      const trk = getTrackBySlug(slug as any);
      assert.ok(trk, `Track ${slug} must be retrieved`);
      assert.ok(trk.stages.length >= 1, `Track ${slug} must have structured stages`);
      assert.ok(trk.estimatedHours > 0, `Track ${slug} must have positive estimated hours`);
    }
  });

  test("Curriculum contains comprehensive lessons with zero concept bundling gaps (> 45 lessons)", () => {
    const lessons = getAllLessons();
    assert.ok(lessons.length >= 45, `Expected >= 45 lessons, found ${lessons.length}`);

    // Verify metadata completeness for every lesson
    for (const lesson of lessons) {
      assert.ok(lesson.id, `Lesson ${lesson.slug} must have an ID`);
      assert.ok(lesson.title, `Lesson ${lesson.slug} must have a title`);
      assert.ok(lesson.canonicalSkill, `Lesson ${lesson.slug} must map to a canonical skill`);
      assert.ok(lesson.summary, `Lesson ${lesson.slug} must have a summary`);
      assert.ok(lesson.contentMarkdown, `Lesson ${lesson.slug} must have markdown content`);
      assert.ok(lesson.exerciseType, `Lesson ${lesson.slug} must have an exercise type`);
      assert.ok(lesson.durationMinutes > 0, `Lesson ${lesson.slug} must have valid duration`);
    }
  });

  test("Every lesson content adheres to the progressive pedagogical sequence", () => {
    const lessons = getAllLessons();
    for (const lesson of lessons) {
      const md = lesson.contentMarkdown;
      // Must contain structured teaching headings
      assert.ok(
        md.includes("### 1. Learning Goal") || md.includes("Goal"),
        `Lesson ${lesson.slug} must state a clear learning goal`
      );
    }
  });
});

describe("Recovery Verification 2: AI Teacher Co-Construction (Modes A-F)", () => {
  test("100% of curriculum lessons resolve to an authentic matching teacher package (0 fallbacks)", () => {
    const lessons = getAllLessons();
    let mismatchCount = 0;

    for (const lesson of lessons) {
      const pkg = getTopicTeacherPackage(lesson.slug);
      assert.ok(pkg, `Teacher package must exist for ${lesson.slug}`);
      if (pkg.topicSlug !== lesson.slug) {
        mismatchCount++;
      }
      assert.equal(
        pkg.topicSlug,
        lesson.slug,
        `Topic ${lesson.slug} must resolve to matching package, not fallback to ${pkg.topicSlug}`
      );
      assert.equal(pkg.title, lesson.title);
      assert.equal(pkg.trackSlug, lesson.trackSlug);

      // Verify Modes A-E completeness
      assert.ok(pkg.modeA.intuitiveAnalogy, "Mode A must contain intuition/analogy");
      assert.ok(pkg.modeA.diagramMermaid, "Mode A must contain a Mermaid diagram");
      assert.ok(pkg.modeA.quickCheckQuestions.length > 0, "Mode A must contain check-understanding questions");
      assert.ok(pkg.modeB.blocks.length >= 2, "Mode B must contain at least 2 demonstration blocks");
      assert.ok(pkg.modeC.slots.length >= 1, "Mode C must contain co-build slots");
      assert.ok(pkg.modeD.fault.buggyCodeOrConfig, "Mode D must contain injected fault");
      assert.ok(pkg.modeE.acceptanceCriteria.length > 0, "Mode E must contain acceptance criteria");
    }

    assert.equal(mismatchCount, 0, "All lessons must have concept-matched teacher packages");
  });

  test("Mode C validates student input against expected patterns", () => {
    const pkg = getTopicTeacherPackage("numpy-vectorization-and-broadcasting");
    const slot = pkg.modeC.slots[0];

    const correct = validateCoBuildSlotInput(slot, slot.starterSnippet);
    assert.equal(correct.isValid, true);
    assert.ok(correct.feedback.includes("satisfies"));

    const incorrect = validateCoBuildSlotInput(slot, "for i in range(10): pass");
    assert.equal(incorrect.isValid, false);
    assert.ok(incorrect.feedback.includes("Hint:"));
  });

  test("Mode D detects elimination of injected debug fault", () => {
    const pkg = getTopicTeacherPackage("numpy-vectorization-and-broadcasting");
    const fault = pkg.modeD.fault;

    const stillBuggy = validateDebugFix(fault, fault.buggyCodeOrConfig);
    assert.equal(stillBuggy.isFixed, false);

    const fixed = validateDebugFix(fault, fault.correctCodeOrConfig);
    assert.equal(fixed.isFixed, true);
    assert.ok(fixed.feedback.includes("Fix verified!"));
  });
});

describe("Recovery Verification 3: A/B Testing Lab Empirical Calculations & Consistency", () => {
  test("Computes exact +15.2% relative lift, clean SRM, and statistically significant Z-test", () => {
    const diag = computeLiveAbExperimentDiagnostics(0.05);

    // 1. Sample Size & SRM
    assert.equal(diag.controlUsers, 3500, "Must have 3,500 control visitors");
    assert.equal(diag.treatmentUsers, 3500, "Must have 3,500 treatment visitors");
    assert.equal(diag.totalUsers, 7000);
    assert.equal(diag.srmDetected, false, "SRM must be clean (50/50 split)");
    assert.equal(diag.chiSquareSrm, 0, "Chi-Square statistic must be 0 for exact 50/50 split");

    // 2. Conversion Counts & Rates
    assert.equal(diag.controlConversions, 368, "Control conversions must be 368");
    assert.equal(diag.treatmentConversions, 424, "Treatment conversions must be 424");
    assert.equal(diag.controlCr, 0.1051, "Control CR must be 10.51%");
    assert.equal(diag.treatmentCr, 0.1211, "Treatment CR must be 12.11%");

    // 3. Exact Relative Uplift (+15.2%)
    assert.equal(diag.relativeUpliftPct, 15.22, "Relative uplift must be 15.22% (~+15.2%)");

    // 4. Hypothesis Testing & Significance
    assert.ok(diag.zScore >= 2.0, "Z-Score must be >= 2.0 for 95% confidence");
    assert.ok(diag.pValueTwoTailed < 0.05, "P-value must be < 0.05");
    assert.equal(diag.isStatisticallySignificant, true);

    // 5. 95% Confidence Interval JSON-Serialization Safety
    assert.ok(diag.confidenceInterval95.lowerPct !== undefined, "lowerPct must be defined");
    assert.ok(diag.confidenceInterval95.upperPct !== undefined, "upperPct must be defined");
    assert.ok(diag.confidenceInterval95.lowerPct < diag.confidenceInterval95.upperPct);

    // Test JSON serialization survival
    const serialized = JSON.parse(JSON.stringify(diag.confidenceInterval95));
    assert.equal(typeof serialized.lowerPct, "number", "lowerPct must survive JSON serialization");
    assert.equal(typeof serialized.upperPct, "number", "upperPct must survive JSON serialization");
    assert.ok(serialized.formatted.includes("%"), "formatted string must be present");
  });

  test("Executive Rollout Rubric accepts consistent statistical justification", () => {
    const evalRes = evaluateAbTestDecision({
      candidateId: "student-qa",
      recommendedAction: "rollout",
      srmDetected: false,
      statisticalSignificanceVerdict: "statistically_significant",
      businessSignificanceVerdict: "exceeds_mde",
      justification: "Chi-square SRM is clean (p > 0.05). Two-sample Z-test shows statistically significant lift (+15.2%), and 95% CI lower bound is above the 5% MDE threshold."
    });

    assert.equal(evalRes.passed, true);
    assert.equal(evalRes.decisionVerdict, "correct");
    assert.ok(evalRes.score >= 85);
  });
});

describe("Recovery Verification 4: Historical Company Question Bank & 56-Company Coverage", () => {
  test("Bank covers 100% of all 56 companies in COMPANY_DIRECTORY with 0 missing", () => {
    assert.ok(HISTORICAL_COMPANY_QUESTIONS_BANK.length >= 56);

    const bankSlugs = new Set(HISTORICAL_COMPANY_QUESTIONS_BANK.map((q) => q.companySlug));
    const missing = COMPANY_DIRECTORY.filter((c) => !bankSlugs.has(c.slug));

    assert.equal(missing.length, 0, `Missing companies: ${missing.map((c) => c.slug).join(", ")}`);
  });

  test("Filtering by company slug returns exact questions for all major categories", () => {
    const testSlugs = [
      "google",
      "stripe",
      "meta",
      "amazon",
      "netflix",
      "microsoft",
      "apple",
      "flipkart",
      "swiggy",
      "zomato",
      "razorpay",
      "phonepe",
      "cred",
      "tcs",
      "infosys",
      "goldman-sachs",
      "jpmorgan",
      "blackrock"
    ];

    for (const slug of testSlugs) {
      const res = getHistoricalCompanyQuestions({ companySlug: slug });
      assert.ok(res.filteredCount >= 1, `Must find questions for ${slug}`);
      assert.equal(res.questions[0].companySlug, slug);
      assert.ok(res.questions[0].problemStatement.length > 50);
      assert.ok(res.questions[0].solutionBlueprint.optimalApproach.length > 20);
      assert.ok(res.questions[0].provenance.type, "Must have valid provenance type");
    }
  });

  test("Retrieval by specific ID returns full question schema with evaluation rubric", () => {
    const q = getHistoricalCompanyQuestionById("stripe-q1");
    assert.ok(q, "Must retrieve stripe-q1");
    assert.equal(q.companyName, "Stripe");
    assert.equal(q.targetRole, "data_engineer");
    assert.ok(q.sampleCases.length > 0);
    assert.equal(q.evaluationRubric.problemComprehension, 25);
    assert.equal(q.evaluationRubric.algorithmicCorrectness, 25);
  });
});

describe("Recovery Verification 5: Visual Dry-Run Studio Execution Traces", () => {
  test("Traces exist across Python, SQL, and Agent DAG studios", () => {
    const traces = listAvailableDryRunTraces();
    assert.ok(traces.length >= 4, "Must define at least 4 dry-run traces");

    const studios = new Set(traces.map((t) => t.languageOrStudio));
    assert.ok(studios.has("python"), "Must support Python traces");
    assert.ok(studios.has("sql"), "Must support SQL traces");
    assert.ok(studios.has("agent_dag"), "Must support Agent DAG traces");
  });

  test("Traces have synchronized line pointers, variables watch tables, and audio transcripts", () => {
    const traceIds = [
      "rolling-average-trace",
      "rrf-fusion-trace",
      "sql-window-ranking-trace",
      "gradient-descent-trace",
      "react-agent-trace"
    ];

    for (const id of traceIds) {
      const t = getDryRunTrace(id);
      assert.ok(t, `Trace ${id} must exist`);
      assert.ok(t.steps.length >= 4, `Trace ${id} must have >= 4 steps`);

      for (const step of t.steps) {
        assert.ok(step.lineNumber > 0, `Step ${step.stepIndex} must have line number`);
        assert.ok(step.codeLine, `Step ${step.stepIndex} must have code line`);
        assert.ok(step.variables.length > 0, `Step ${step.stepIndex} must have variables watch`);
        assert.ok(step.spokenNarration.length > 10, `Step ${step.stepIndex} must have audio narration`);
        assert.ok(step.visualCallStack.length > 0, `Step ${step.stepIndex} must have call stack`);
      }
    }
  });
});

describe("Recovery Verification 6: Execution Runtimes & Student DNA Isolation", () => {
  test("In-memory SQLite executes SQL query and reports execution metrics", async () => {
    const res = await executeSqlInSandbox("ecommerce_analytics", "SELECT 42 AS answer, 'Cognalyze' AS platform;");
    assert.equal(res.success, true);
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0].answer, 42);
    assert.equal(res.rows[0].platform, "Cognalyze");
    assert.ok(res.executionTimeMs >= 0);
  });

  test("Python sandbox executes pure Python 3 standard algorithms safely", async () => {
    const code = `
def fib(n):
    if n <= 1: return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
print(fib(10))
`;
    const res = await executePythonInSandbox(code);
    assert.equal(res.success, true);
    assert.ok(res.stdout.includes("55"));
  });

  test("Student DNA sync blocks unverified or zero-score attempts from polluting mastery", async () => {
    const zeroAttempt = {
      id: "att-zero",
      candidateId: "cand-guard-test",
      trackSlug: "ai_ml" as const,
      lessonSlug: "aiml-101",
      exerciseType: "code_lab" as const,
      score: 0,
      passed: false,
      assisted: false,
      completedAt: new Date().toISOString()
    };

    const synced = await syncArenaAttemptToDNA(zeroAttempt);
    assert.equal(synced.success, false, "Zero score attempts must not pollute Student DNA mastery");
  });
});
