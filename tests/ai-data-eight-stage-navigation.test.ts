/**
 * tests/ai-data-eight-stage-navigation.test.ts
 *
 * Comprehensive Automated Test Suite for:
 * 1. Master Curriculum Completeness Audit (10 Subjects, Modules, Topics, Subtopics)
 * 2. Intelligent Role-Based Sequencing Engine across all 8 Career Roles
 * 3. Prerequisite Resolution and Dynamic Topic Unlocking
 * 4. Seamless Eight-Stage Navigation & Deep Concept Verification
 * 5. Bilingual Payload Integrity (English & Hinglish)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MASTER_CURRICULUM_SUBJECTS,
  getAllTaxonomySubjects,
  getTaxonomySubjectBySlug,
  getTaxonomyTopicById,
} from "../lib/skills/ai-data/master-curriculum-taxonomy";

import {
  ROLE_SUBJECT_PROGRESSIONS,
  getRoleSubjectProgression,
  isSubjectUnlockedForCandidate,
  resolveNextTopicRecommendation,
} from "../lib/skills/ai-data/sequencing-engine";

import {
  CANONICAL_EIGHT_STAGES,
  CanonicalStageNumber,
} from "../components/skills/ai-data/EightStageLearningWorkspace";

import {
  getTopicStagePayload,
  TeachingStageNumber,
} from "../lib/skills/ai-data/deep-teaching-engine";

import { runMasterCurriculumAudit } from "../lib/skills/ai-data/curriculum-auditor";
import { TARGET_ROLE_PROFILES } from "../lib/skills/ai-data/roles";
import { TargetRoleSlug } from "../lib/skills/ai-data/types";

describe("AI & Data Arena — Eight-Stage Navigation & Master Curriculum Test Suite", () => {
  // =========================================================================
  // TEST 1: Curriculum Completeness Auditor
  // =========================================================================
  it("Auditor: verifies all canonical subjects are complete and structured", () => {
    const report = runMasterCurriculumAudit();

    assert.ok(report.totalSubjects >= 10, "Must have all canonical subjects (at least 10, expanded to 14)");
    assert.ok(report.totalModules >= 15, `Total modules (${report.totalModules}) must be >= 15`);
    assert.ok(report.totalTopics >= 25, `Total topics (${report.totalTopics}) must be >= 25`);
    assert.ok(report.totalSubtopics >= 30, `Total subtopics (${report.totalSubtopics}) must be >= 30`);
    assert.ok(report.overallCompletenessPercent >= 80, `Completeness score (${report.overallCompletenessPercent}%) must be >= 80%`);

    // Verify 0 broken references across the entire curriculum
    for (const subAudit of report.subjectAudits) {
      assert.deepEqual(subAudit.brokenReferences, [], `Subject ${subAudit.subjectId} must have no broken references`);
      assert.deepEqual(subAudit.duplicateTopicIds, [], `Subject ${subAudit.subjectId} must have no duplicate topic IDs`);
      assert.ok(subAudit.totalTopics >= 2, `Subject ${subAudit.subjectId} must have at least 2 topics`);
    }
  });

  // =========================================================================
  // TEST 2: Canonical 8 Stages Specification
  // =========================================================================
  it("Canonical Stages: defines all 8 stages with correct sequence and titles", () => {
    assert.equal(CANONICAL_EIGHT_STAGES.length, 8, "Must define exactly 8 canonical stages");
    const expectedTitles = [
      "Context & Intuition",
      "Deep Concept",
      "Visual Demo",
      "Worked Example",
      "Experiment",
      "Guided Practice",
      "Debugging",
      "Independent Challenge",
    ];

    CANONICAL_EIGHT_STAGES.forEach((stage, idx) => {
      assert.equal(stage.num, idx + 1, `Stage number must be ${idx + 1}`);
      assert.equal(stage.title, expectedTitles[idx], `Stage ${idx + 1} title mismatch`);
      assert.ok(stage.icon, `Stage ${idx + 1} must have an icon`);
    });
  });

  // =========================================================================
  // TEST 3: Deep Concept Navigation & Payload Integrity (CRITICAL BUG FIX)
  // =========================================================================
  it("Deep Concept: loads Stage 2 payloads across all topics without throwing errors", () => {
    const sampleTopicIds = [
      "py-01-intro-interpreter",
      "py-02-variables-data-types",
      "np-01-intro-why-numpy",
      "np-04-broadcasting-rules",
      "pd-01-series-dataframe",
      "pd-02-loc-vs-iloc",
      "sql-01-joins-execution-model",
      "stats-01-clt-distributions",
      "ml-01-linear-regression-gradient-descent",
      "dl-01-backpropagation-chain-rule",
      "genai-01-foundations-scaling",
      "rag-01-chunking-embeddings",
      "agent-01-react-loop-tools",
    ];

    for (const topicId of sampleTopicIds) {
      // Must not throw for Stage 2 (Deep Concept) in English
      const englishPayload = getTopicStagePayload(topicId, 2, "english", "ai_engineer");
      assert.ok(englishPayload, `Deep Concept payload must exist for topic ${topicId}`);
      assert.ok(englishPayload.content.title, `Title must exist for ${topicId}`);
      assert.ok(englishPayload.content.description, `Description must exist for ${topicId}`);
      assert.ok(englishPayload.content.bodyMarkdown.length > 50, `Markdown content must be substantial for ${topicId}`);

      // Must not throw for Stage 2 (Deep Concept) in Hinglish
      const hinglishPayload = getTopicStagePayload(topicId, 2, "hinglish", "ai_engineer");
      assert.ok(hinglishPayload, `Hinglish Deep Concept payload must exist for topic ${topicId}`);
      assert.ok(hinglishPayload.content.bodyMarkdown.length > 50, `Hinglish content must be substantial for ${topicId}`);

      // Verify underlying topic deepExplanation structure
      const topic = getTaxonomyTopicById(topicId);
      assert.ok(topic, `Topic ${topicId} must exist in taxonomy`);
      assert.ok(topic.deepExplanation.internalMechanics.length > 10, `Internal mechanics required for ${topicId}`);
      assert.ok(topic.deepExplanation.realWorldUsage.length > 10, `Real-world usage required for ${topicId}`);
      assert.ok(Array.isArray(topic.deepExplanation.commonMistakes), `commonMistakes must be an array for ${topicId}`);
      assert.ok(topic.deepExplanation.commonMistakes.length > 0, `Must have at least one common mistake for ${topicId}`);
    }
  });

  // =========================================================================
  // TEST 4: Seamless 8-Stage Sequential Navigation Across Topics
  // =========================================================================
  it("Navigation: all 8 stages resolve valid non-null payloads for representative topics", () => {
    const testTopics = ["np-04-broadcasting-rules", "rag-01-chunking-embeddings", "agent-01-react-loop-tools"];

    for (const tId of testTopics) {
      for (let stageNum = 1; stageNum <= 8; stageNum++) {
        const payload = getTopicStagePayload(tId, stageNum as TeachingStageNumber, "english", "ai_engineer");
        assert.ok(payload, `Stage ${stageNum} payload must not be null for topic ${tId}`);
        assert.ok(payload.stageNumber === stageNum, `Payload stageNumber must match requested ${stageNum}`);
        assert.ok(payload.content.title.length > 0, `Stage ${stageNum} title must not be empty`);

        if (stageNum === 5 || stageNum === 6 || stageNum === 8) {
          assert.ok(
            payload.content.starterCode && payload.content.starterCode.length > 0,
            `Stage ${stageNum} must provide starter code for ${tId}`
          );
        } else if (stageNum === 7) {
          assert.ok(
            payload.content.brokenCode && payload.content.brokenCode.length > 0,
            `Stage 7 (Debugging) must provide broken code for ${tId}`
          );
        }
      }
    }
  });

  // =========================================================================
  // TEST 5: Role-Based Subject Sequencing for All 8 Career Roles
  // =========================================================================
  it("Sequencing: validates prerequisite ordering across all 8 career roles", () => {
    const allRoles: TargetRoleSlug[] = [
      "data_analyst",
      "data_scientist",
      "data_engineer",
      "ml_engineer",
      "mlops_engineer",
      "ai_engineer",
      "genai_llm_engineer",
      "applied_ai_engineer",
    ];

    for (const role of allRoles) {
      const progression = getRoleSubjectProgression(role);
      assert.equal(progression.role, role, `Progression role must match ${role}`);
      assert.ok(progression.subjects.length >= 5, `Role ${role} must have at least 5 sequenced subjects`);

      // Verify sequence ordering is monotonically increasing
      progression.subjects.forEach((subj, idx) => {
        assert.equal(subj.recommendedOrder, idx + 1, `Subject ${subj.subjectId} order must be sequential`);
        // Verify subject exists in master taxonomy
        const masterSubj = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === subj.subjectId);
        assert.ok(masterSubj, `Subject ${subj.subjectId} in role ${role} must exist in master taxonomy`);
      });

      // Role-specific structural checks
      if (role === "data_analyst") {
        const subjIds = progression.subjects.map((s) => s.subjectId);
        assert.ok(subjIds.includes("subj_sql"), "Data Analyst must include SQL");
        assert.ok(subjIds.includes("subj_pandas"), "Data Analyst must include Pandas");
        assert.ok(subjIds.includes("subj_stats_ab"), "Data Analyst must include A/B Testing");
      } else if (role === "ai_engineer") {
        const subjIds = progression.subjects.map((s) => s.subjectId);
        assert.ok(subjIds.includes("subj_genai_llm"), "AI Engineer must include GenAI");
        assert.ok(subjIds.includes("subj_rag"), "AI Engineer must include RAG");
        assert.ok(subjIds.includes("subj_agents"), "AI Engineer must include Autonomous Agents");
      }
    }
  });

  // =========================================================================
  // TEST 6: Dynamic Prerequisite Subject Unlocking
  // =========================================================================
  it("Prerequisites: correctly gates and unlocks subjects based on completed topics", () => {
    const role: TargetRoleSlug = "ai_engineer";

    // Scenario 1: New student with 0 completed topics
    const initialPythonStatus = isSubjectUnlockedForCandidate("subj_python", role, []);
    assert.equal(initialPythonStatus.isUnlocked, true, "Python has no prerequisites and must be unlocked initially");

    const initialRagStatus = isSubjectUnlockedForCandidate("subj_rag", role, []);
    assert.equal(initialRagStatus.isUnlocked, false, "RAG requires prerequisites and must be locked initially");
    assert.ok(initialRagStatus.missingPrerequisites.length > 0, "Missing prerequisites must be returned");

    // Scenario 2: Student completes Python, NumPy, & GenAI topics -> RAG should unlock when NumPy and GenAI are met
    const unlockedAfterPrereqs = isSubjectUnlockedForCandidate(
      "subj_rag",
      role,
      ["py-01-intro-interpreter", "np-01-intro-why-numpy", "genai-01-foundations-scaling"]
    );
    assert.equal(unlockedAfterPrereqs.isUnlocked, true, "RAG must unlock once NumPy and GenAI topics are completed");
  });

  // =========================================================================
  // TEST 7: Intelligent Next Recommended Topic Resolution
  // =========================================================================
  it("Next Topic Recommendation: resolves the correct sequential milestone", () => {
    const role: TargetRoleSlug = "data_scientist";

    // When student has completed no topics, recommendations should start with first Python topic
    const initialRec = resolveNextTopicRecommendation(role, []);
    assert.equal(initialRec.recommendedTopic.id, "py-01-intro-interpreter", "Must recommend py-01-intro-interpreter for brand new student");
    assert.equal(initialRec.subject.id, "subj_python");

    // When student completes py-01-intro-interpreter, next topic should be py-02-variables-data-types
    const nextRec = resolveNextTopicRecommendation(role, ["py-01-intro-interpreter"]);
    assert.equal(nextRec.recommendedTopic.id, "py-02-variables-data-types");

    // When student completes all Python topics, recommendation advances to NumPy
    const pythonTopicIds = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === "subj_python")!
      .modules.flatMap((m) => m.topics.map((t) => t.id));
    const numpyRec = resolveNextTopicRecommendation(role, pythonTopicIds);
    assert.equal(numpyRec.subject.id, "subj_numpy", "Must advance to NumPy after completing Python");
    assert.equal(numpyRec.recommendedTopic.id, "np-01-intro-why-numpy");
  });
});
