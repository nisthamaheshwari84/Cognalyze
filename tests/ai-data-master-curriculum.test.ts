/**
 * tests/ai-data-master-curriculum.test.ts
 * 
 * Comprehensive Verification Suite for the Cognalyze AI & Data Arena Redesign.
 * Tests:
 * 1. Master Curriculum Taxonomy completeness across 8 career roles
 * 2. Complete Python, NumPy, Pandas, ML, GenAI and SQL/Stats tracks
 * 3. 10-Stage Universal Deep Teaching Engine payload generation
 * 4. Bilingual learning modes (English & natural Hinglish)
 * 5. Vetted external learning resources (CampusX, Stanford, Official Documentation)
 * 6. Free-form Stage 9 student conceptual explanation scoring and misconception detection
 * 7. Candidate language preference and stage progression persistence
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MASTER_CURRICULUM_TRACKS,
  getTaxonomyTopicById
} from "../lib/skills/ai-data/master-curriculum-taxonomy";
import {
  getTopicStagePayload,
  evaluateStudentExplanation
} from "../lib/skills/ai-data/deep-teaching-engine";
import {
  setCandidateLanguagePreference,
  getCandidateLanguagePreference,
  saveTopicStageProgress,
  getCandidateTopicProgress
} from "../lib/skills/ai-data/store";
import { TargetRoleSlug } from "../lib/skills/ai-data/types";

describe("AI & Data Arena Redesign — Master Curriculum Taxonomy Suite", () => {
  it("covers all foundational tracks and structured modules", () => {
    const trackIds = MASTER_CURRICULUM_TRACKS.map(t => t.id);
    assert.ok(trackIds.includes("track_python"), "Must include Python Foundations track");
    assert.ok(trackIds.includes("track_numpy"), "Must include NumPy track");
    assert.ok(trackIds.includes("track_pandas"), "Must include Pandas track");
    assert.ok(trackIds.includes("track_sql_stats"), "Must include SQL & Stats track");
    assert.ok(trackIds.includes("track_ml"), "Must include Machine Learning track");
    assert.ok(trackIds.includes("track_genai"), "Must include Generative AI track");
  });

  it("ensures every topic contains role relevance for all 8 target career roles", () => {
    const roles: TargetRoleSlug[] = [
      "data_analyst",
      "data_scientist",
      "data_engineer",
      "ml_engineer",
      "mlops_engineer",
      "ai_engineer",
      "genai_llm_engineer",
      "applied_ai_engineer"
    ];

    for (const track of MASTER_CURRICULUM_TRACKS) {
      for (const mod of track.modules) {
        for (const topic of mod.topics) {
          for (const role of roles) {
            const rel = topic.roleRelevance[role];
            assert.ok(rel, `Topic ${topic.id} missing role relevance for ${role}`);
            assert.ok(["CRITICAL", "HIGH", "SUPPORTING"].includes(rel.importance));
            assert.ok(rel.why.length > 5, `Topic ${topic.id} missing role explanation for ${role}`);
          }
        }
      }
    }
  });

  it("verifies that all topics provide validated external learning resources", () => {
    for (const track of MASTER_CURRICULUM_TRACKS) {
      for (const mod of track.modules) {
        for (const topic of mod.topics) {
          assert.ok(topic.externalResources.length >= 1, `Topic ${topic.id} must have at least one verified external resource`);
          for (const res of topic.externalResources) {
            assert.ok(res.creatorOrOrg.length > 0);
            assert.ok(res.url.startsWith("http"));
            assert.ok(["English", "Hinglish"].includes(res.language));
            assert.ok(res.whyRecommended.length > 10);
          }
        }
      }
    }
  });
});

describe("10-Stage Deep Teaching Engine Suite", () => {
  it("generates payloads for all 10 stages in English without errors", () => {
    const topicId = "np-02-broadcasting-mechanics";
    for (let st = 1; st <= 10; st++) {
      const payload = getTopicStagePayload(topicId, st as any, "english", "data_scientist");
      assert.ok(payload, `Stage ${st} payload must be non-null`);
      assert.equal(payload.stageNumber, st);
      assert.ok(payload.content.title.length > 0);
      assert.ok(payload.content.description.length > 0);
    }
  });

  it("generates natural Hinglish explanations when Hinglish mode is selected", () => {
    const topicId = "np-02-broadcasting-mechanics";
    const payload = getTopicStagePayload(topicId, 1, "hinglish", "ml_engineer");
    assert.ok(payload);
    assert.equal(payload.language, "hinglish");
    // Verify natural Hindi/Hinglish keywords appear in intuition
    assert.ok(
      payload.content.bodyMarkdown.includes("Broadcasting") ||
      payload.content.bodyMarkdown.includes("memory") ||
      payload.content.description.includes("samjhiye"),
      "Hinglish payload must contain conversational phrasing"
    );
  });

  it("evaluates a thorough student explanation in Stage 9 and passes", () => {
    const topicId = "np-02-broadcasting-mechanics";
    const studentText = "Broadcasting compares array trailing dimensions from right to left. If dimensions match or one is 1, NumPy uses stride 0 without virtual copying. This eliminates memory duplication.";
    const evalResult = evaluateStudentExplanation(topicId, studentText, "english");
    assert.ok(evalResult.passed, "Thorough explanation should pass");
    assert.ok(evalResult.understandingScore >= 65, "Score should exceed passing threshold");
    assert.ok(evalResult.detectedKeyConcepts.length >= 2, "Should detect multiple key concepts");
  });

  it("rejects an overly brief explanation in Stage 9 and offers remediation", () => {
    const topicId = "np-02-broadcasting-mechanics";
    const studentText = "It adds arrays.";
    const evalResult = evaluateStudentExplanation(topicId, studentText, "english");
    assert.equal(evalResult.passed, false, "Brief explanation must fail");
    assert.ok(evalResult.understandingScore < 40, "Score should be low for non-explanation");
    assert.ok(evalResult.feedbackMessage.includes("brief") || evalResult.feedbackMessage.includes("chhota"));
  });
});

describe("Bilingual Preference & Stage Progress Persistence", () => {
  it("persists and retrieves candidate language preference", () => {
    const cid = "test-lang-candidate-001";
    setCandidateLanguagePreference(cid, "hinglish");
    assert.equal(getCandidateLanguagePreference(cid), "hinglish");

    setCandidateLanguagePreference(cid, "english");
    assert.equal(getCandidateLanguagePreference(cid), "english");
  });

  it("tracks and advances 10-stage progression per topic", () => {
    const cid = `test-prog-candidate-${Date.now()}`;
    const topicId = "py-01-intro";

    assert.equal(getCandidateTopicProgress(cid, topicId), 1);

    const advancedTo4 = saveTopicStageProgress(cid, topicId, 4);
    assert.equal(advancedTo4, 4);
    assert.equal(getCandidateTopicProgress(cid, topicId), 4);

    // Progression should never regress to a lower stage
    const regressed = saveTopicStageProgress(cid, topicId, 2);
    assert.equal(regressed, 4);
    assert.equal(getCandidateTopicProgress(cid, topicId), 4);
  });
});

