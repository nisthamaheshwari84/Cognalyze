import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as arenaPost, GET as arenaGet } from "../app/api/skills/ai-data/route";
import {
  getAllCurriculumTopicsFlat,
  TAXONOMY_SUBJECTS,
  getTaxonomyTopicById,
} from "../lib/skills/ai-data/master-curriculum-taxonomy";
import { getAllTargetRoles } from "../lib/skills/ai-data/roles";
import { buildMicroLearningPackage } from "../lib/skills/ai-data/micro-learning-engine";
import {
  getTopicComprehensionSuite,
  evaluateComprehensionExercise,
} from "../lib/skills/ai-data/comprehension-engine";
import {
  getPracticalLabForTopic,
  evaluatePracticalLabSubmission,
} from "../lib/skills/ai-data/practical-lab-engine";
import { buildTopicAssessment } from "../lib/skills/ai-data/assessment-engine";
import { INTEGRATED_PROJECTS } from "../lib/skills/ai-data/projects-engine";
import { generateContextAwareMentorReply } from "../lib/skills/ai-data/mentor-service";

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/skills/ai-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("AI & Data Mastery Arena — Complete Sequential Learning & Mastery E2E Suite", () => {
  const uniqueCid = `student-test-seq-e2e-${Date.now()}`;

  it("1. Supports all 10 required AI & Data target roles + custom target role configuration via HTTP API", async () => {
    const roles = getAllTargetRoles();
    const expectedSlugs = [
      "ai_engineer",
      "ml_engineer",
      "data_scientist",
      "data_analyst",
      "data_engineer",
      "genai_llm_engineer",
      "applied_ai_engineer",
      "nlp_engineer",
      "cv_engineer",
      "mlops_engineer",
    ];
    for (const slug of expectedSlugs) {
      assert.ok(
        roles.some((r) => r.slug === slug),
        `Missing required target role: ${slug}`
      );
    }

    // Configure custom target role via API route
    const customRes = await arenaPost(
      makePostRequest({
        action: "set_custom_target_role",
        candidateId: uniqueCid,
        slug: "custom_rag_architect",
        title: "Enterprise RAG & Eval Architect",
        summary: "Focused custom path on Python, SQL, GenAI, RAG, and AI Evals",
        requiredSubjectIds: ["subj_python", "subj_sql", "subj_genai_llm", "subj_rag", "subj_ai_eval"],
        requiredSkills: ["python", "sql", "rag_architecture_and_retrieval", "llm_evaluations_and_safety"],
      })
    );
    assert.equal(customRes.status, 200);
    const customJson = await customRes.json();
    assert.equal(customJson.success, true);
    assert.equal(customJson.summary.canonicalRoadmap.roleTitle, "Enterprise RAG & Eval Architect");
  });

  it("2. Enforces tenant security isolation (401 on arbitrary unauthenticated candidateId, 200 on test/demo)", async () => {
    const blockedRes = await arenaGet(
      new NextRequest("http://localhost:3000/api/skills/ai-data?candidateId=arbitrary-other-student-999")
    );
    assert.equal(blockedRes.status, 401);

    const allowedRes = await arenaPost(
      makePostRequest({ action: "get_canonical_context", candidateId: uniqueCid })
    );
    assert.equal(allowedRes.status, 200);
  });

  it("3. Builds bilingual (English & Hinglish) 10-part micro-learning packages across ALL 154 canonical topics / 309 subtopics", async () => {
    const allTopics = getAllCurriculumTopicsFlat();
    assert.equal(TAXONOMY_SUBJECTS.length, 14, "Must preserve 14 canonical subjects");
    assert.equal(allTopics.length, 154, "Must preserve 154 canonical topics");

    let subtopicCount = 0;
    for (const flat of allTopics) {
      const tid = flat.topic.id;
      const topicObj = getTaxonomyTopicById(tid);
      assert.ok(topicObj, `Topic ${tid} must resolve cleanly`);
      subtopicCount += topicObj.subtopics.length;

      const enPkg = buildMicroLearningPackage(tid, "ai_engineer", "english");
      assert.ok(enPkg && enPkg.subtopicUnits.length > 0, `Missing EN micro-package for ${tid}`);
      const u0 = enPkg.subtopicUnits[0];
      assert.ok(u0.whatIsIt.english.length > 10);
      assert.ok(u0.whyItMatters.english.length > 10);
      assert.ok(u0.howItWorksSimple.english.length > 10);
      assert.ok(u0.howItWorksDeep.length > 10);
      assert.ok(u0.realWorldAnalogy.english.length > 10);
      assert.ok(u0.runnableCodeExample.code.length > 5);
      assert.ok(u0.microCheck.questionPrompt.length > 5);

      const hiPkg = buildMicroLearningPackage(tid, "ai_engineer", "hinglish");
      assert.ok(hiPkg && hiPkg.subtopicUnits.length > 0, `Missing Hinglish micro-package for ${tid}`);
      assert.ok(hiPkg.subtopicUnits[0].whatIsIt.hinglish.length > 10);
    }
    assert.equal(subtopicCount, 309, "Must cover all 309 canonical subtopics");
  });

  it("4. Runs authentic live sandbox execution for Micro-Examples, Comprehension Debugging, SQL Labs & ML Labs", async () => {
    // 4a. Micro-example Python sandbox via HTTP POST
    const microRunRes = await arenaPost(
      makePostRequest({
        action: "run_micro_example",
        candidateId: uniqueCid,
        language: "python",
        code: 'print("COGNALYZE_SEQ_OK", sum([2, 4, 6]))',
      })
    );
    const microRunJson = await microRunRes.json();
    assert.equal(microRunJson.success, true);
    assert.match(microRunJson.result.stdout, /COGNALYZE_SEQ_OK 12/);

    // 4b. Comprehension Debug Fix: buggy code fails, fixed code passes in Python sandbox
    const suite = getTopicComprehensionSuite("py-01-intro-interpreter");
    const debugChal = suite.find((c) => c.kind === "debug_fix");
    assert.ok(debugChal, "py-01-intro-interpreter must include debug_fix challenge");

    const badDebug = await evaluateComprehensionExercise({
      topicId: "py-01-intro-interpreter",
      challengeId: debugChal.id,
      userFixCode: "def safe_ratio_percent(num, den):\n    return (num / den) * 100",
    });
    assert.equal(badDebug.passed, false, "Zero-division bug must fail live sandbox verification");

    const goodDebug = await evaluateComprehensionExercise({
      topicId: "py-01-intro-interpreter",
      challengeId: debugChal.id,
      userFixCode:
        "def safe_ratio_percent(num, den):\n    if not den:\n        return 0.0\n    return round((num / den) * 100, 2)",
    });
    assert.equal(goodDebug.passed, true, "Fixed safe_ratio_percent implementation must pass live sandbox");

    // 4c. SQL Practical Lab verification (real SQLite against seeded ecommerce_analytics)
    const sqlLab = getPracticalLabForTopic("sql-01-joins-execution-model");
    assert.ok(sqlLab && sqlLab.labType === "sql_lab");
    const sqlFail = await evaluatePracticalLabSubmission({
      topicId: "sql-01-joins-execution-model",
      submissionText: "SELECT 1 AS wrong",
    });
    assert.equal(sqlFail.passed, false);

    const sqlPass = await evaluatePracticalLabSubmission({
      topicId: "sql-01-joins-execution-model",
      submissionText: sqlLab.referenceSql!,
    });
    assert.equal(sqlPass.passed, true, "Reference SQL query must match SQLite reference output");

    // 4d. Real ML Experiment Practical Lab (real gradient descent trainer)
    const mlLab = getPracticalLabForTopic("ml-001-what-is-ml");
    assert.ok(mlLab && mlLab.labType === "ml_experiment_lab");
    const mlPass = await evaluatePracticalLabSubmission({
      topicId: "ml-001-what-is-ml",
      submissionText: JSON.stringify({
        datasetId: "customer_churn",
        selectedFeatures: ["tenure_months", "monthly_charges", "tech_support_calls"],
        algorithm: "logistic_regression",
        learningRate: 0.15,
        epochs: 120,
        regularizationLambda: 0.01,
      }),
    });
    assert.equal(mlPass.passed, true);
    assert.ok(mlPass.score >= 70);
  });

  it("5. Enforces strict sequential DAG unlocking, assessment remediation on failure, and verified mastery progression across gates", async () => {
    const gateCid = `student-test-gate-${Date.now()}`;
    const ctx1Res = await arenaPost(
      makePostRequest({ action: "get_canonical_context", candidateId: gateCid })
    );
    const ctx1 = await ctx1Res.json();
    const pythonNodes = ctx1.summary.canonicalRoadmap.subjects.find(
      (s: { subjectId: string }) => s.subjectId === "subj_python"
    ).topics;

    // Topic 0 is AVAILABLE; Topic 1 is LOCKED because Topic 0 isn't completed yet
    assert.notEqual(pythonNodes[0].lockState, "LOCKED");
    assert.equal(pythonNodes[1].lockState, "LOCKED");

    const topic0Id = pythonNodes[0].topicId;
    const bundle = buildTopicAssessment(topic0Id, "intermediate")!;
    assert.ok(bundle.items.length >= 5, "Topic assessment must have multi-format items");

    // Fail assessment deliberately -> must trigger remediationRequired + non-empty remediationPlan
    const failRes = await arenaPost(
      makePostRequest({
        action: "submit_topic_assessment",
        candidateId: gateCid,
        topicId: topic0Id,
        answers: {},
      })
    );
    const failJson = await failRes.json();
    assert.equal(failJson.report.passed, false);
    assert.equal(failJson.report.masteryRecord.remediationRequired, true);
    assert.ok(Array.isArray(failJson.report.remediationPlan) && failJson.report.remediationPlan.length > 0);
    assert.ok(failJson.report.weakConcepts.length > 0);

    // Complete micro-learning, comprehension, practical lab, then pass assessment -> unlocks Topic 1!
    const pkg = buildMicroLearningPackage(topic0Id, "ai_engineer", "english")!;
    for (const unit of pkg.subtopicUnits) {
      await arenaPost(
        makePostRequest({
          action: "submit_micro_check",
          candidateId: gateCid,
          topicId: topic0Id,
          subtopicId: unit.subtopicId,
          selectedOptionId: unit.microCheck.correctOptionId,
          explanationText: `${unit.concepts.join(" ")} is a foundational mechanism in Python execution and data safety.`,
        })
      );
    }

    const debugItem = getTopicComprehensionSuite(topic0Id).find((c) => c.kind === "debug_fix");
    assert.ok(debugItem, "Debug comprehension challenge must exist");
    await arenaPost(
      makePostRequest({
        action: "submit_comprehension",
        candidateId: gateCid,
        topicId: topic0Id,
        challengeId: debugItem.id,
        userFixCode:
          "def safe_ratio_percent(num, den):\n    if not den:\n        return 0.0\n    return round((num / den) * 100, 2)",
      })
    );

    const labRes = await arenaPost(
      makePostRequest({
        action: "submit_practical_lab",
        candidateId: gateCid,
        topicId: topic0Id,
        submissionText: `def process_batch_records(records):
    valid_count = 0
    counts = {}
    for r in records:
        lbl = str(r.get("label", "")).strip().lower()
        sc = r.get("score")
        if lbl and isinstance(sc, (int, float)) and not isinstance(sc, bool) and sc > 0:
            valid_count += 1
            counts[lbl] = counts.get(lbl, 0) + 1
    return {"valid_count": valid_count, "label_counts": counts}`,
      })
    );
    const labJson = await labRes.json();
    assert.equal(labJson.evaluation.passed, true, "Valid Python practical lab must pass all assertions");

    const perfectAnswers: Record<string, string | string[]> = {};
    for (const it of bundle.items) {
      if ((it.format === "mcq" || it.format === "scenario") && it.correctOptionIds) {
        perfectAnswers[it.id] = it.correctOptionIds[0];
      } else if (it.format === "multi_select" && it.correctOptionIds) {
        perfectAnswers[it.id] = it.correctOptionIds;
      } else if (it.format === "output_prediction") {
        perfectAnswers[it.id] = it.expectedOutputText || "";
      } else if (it.format === "coding") {
        perfectAnswers[it.id] =
          "def assess_transform(nums):\n    return [x * x for x in nums if isinstance(x, (int, float)) and not isinstance(x, bool) and x > 0]";
      } else if (it.format === "viva_explanation") {
        perfectAnswers[it.id] =
          `${(it.requiredConceptKeywords || []).join(" ")} — clean validation architecture isolates edge cases, prevents invalid state mutations, and supports reproducible production debugging.`;
      }
    }

    const passRes = await arenaPost(
      makePostRequest({
        action: "submit_topic_assessment",
        candidateId: gateCid,
        topicId: topic0Id,
        answers: perfectAnswers,
      })
    );
    const passJson = await passRes.json();
    assert.equal(passJson.report.passed, true, "Valid answers across all formats must pass assessment");
    assert.equal(passJson.report.masteryRecord.status, "mastered_verified", "All 5 gates met -> mastered_verified");

    const updatedPython = passJson.summary.canonicalRoadmap.subjects.find(
      (s: { subjectId: string }) => s.subjectId === "subj_python"
    ).topics;
    assert.notEqual(
      updatedPython[1].lockState,
      "LOCKED",
      "Completing Topic 0 must sequentially unlock Topic 1"
    );
  });

  it("6. Verifies 3-level integrated projects with milestone evaluation + context-aware AI Mentor without fabricated execution", async () => {
    const projRes = await arenaPost(
      makePostRequest({ action: "get_integrated_projects", candidateId: uniqueCid })
    );
    const projJson = await projRes.json();
    assert.equal(projJson.success, true);
    assert.equal(projJson.projects.length, INTEGRATED_PROJECTS.length);
    assert.ok(projJson.projects.some((p: { level: number }) => p.level === 1));
    assert.ok(projJson.projects.some((p: { level: number }) => p.level === 2));
    assert.ok(projJson.projects.some((p: { level: number }) => p.level === 3));

    const firstMilestoneRes = await arenaPost(
      makePostRequest({
        action: "verify_project_milestone",
        candidateId: uniqueCid,
        projectId: "lvl1-py-telemetry-cleaner",
        milestoneId: "m1-sanitize",
        userCode: `def summarize_latencies(ms_values: list) -> dict:
    valid = [float(v) for v in ms_values if not isinstance(v, bool) and isinstance(v, (int, float)) and v >= 0]
    if not valid:
        return {"count": 0, "mean_ms": 0.0, "max_ms": 0.0}
    return {
        "count": len(valid),
        "mean_ms": round(sum(valid) / len(valid), 2),
        "max_ms": float(max(valid)),
    }`,
      })
    );
    const milestoneJson = await firstMilestoneRes.json();
    assert.equal(milestoneJson.result.passed, true);

    const reply = await generateContextAwareMentorReply({
      candidateId: uniqueCid,
      targetRole: "AI Engineer",
      subjectTitle: "Python Foundations",
      topicId: "py-01-intro-interpreter",
      topicTitle: "Python Interpreter & Memory Execution Model",
      learningPhase: "understand",
      language: "english",
      userMessage: "Explain this bug in my code without spoiling the full solution",
      userCode: "x = [1, 2]\ny = x",
      executionStderr: "IndexError: list index out of range",
      weakConcepts: ["Reference Aliasing"],
    });
    assert.ok(reply.reply.length > 30);
    assert.match(reply.reply, /Python Interpreter & Memory Execution Model|IndexError|Reference Aliasing/i);
  });
});
