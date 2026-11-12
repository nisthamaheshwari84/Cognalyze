import { describe, it } from "node:test";
import assert from "node:assert";
import {
  MASTER_CURRICULUM_SUBJECTS,
  getTaxonomySubjectBySlug,
  getTaxonomyTopicById,
} from "../lib/skills/ai-data/master-curriculum-taxonomy";
import { resolveNextTopicRecommendation } from "../lib/skills/ai-data/sequencing-engine";
import { TARGET_ROLE_PROFILES } from "../lib/skills/ai-data/roles";
import { TargetRoleSlug } from "../lib/skills/ai-data/types";
import {
  generateTopicRevisionDocument,
  persistTopicNotes,
  getTopicNotes,
} from "../lib/skills/ai-data/revision-pdf-engine";

describe("AI & Data Engineering Studio — Navigation, 14 Domains & 10 Studios", () => {
  it("1. 14 Canonical Subject Domains: Exactly 14 structured domains exist", () => {
    assert.strictEqual(
      MASTER_CURRICULUM_SUBJECTS.length,
      14,
      `Expected exactly 14 canonical subjects, found ${MASTER_CURRICULUM_SUBJECTS.length}`
    );

    const requiredSlugs = [
      "python",
      "numpy",
      "pandas",
      "sql",
      "statistics-ab-testing",
      "machine-learning",
      "deep-learning",
      "generative-ai-llms",
      "rag",
      "agentic-ai",
      "data-engineering",
      "mlops-llmops",
      "ai-evaluation-safety",
      "applied-ai-projects",
    ];

    for (const slug of requiredSlugs) {
      const subj = getTaxonomySubjectBySlug(slug);
      assert.ok(subj, `Subject with slug '${slug}' must exist in curriculum taxonomy`);
      assert.ok(subj.modules.length > 0, `Subject '${slug}' must contain at least 1 module`);
      const totalTopics = subj.modules.flatMap((m) => m.topics);
      assert.ok(totalTopics.length > 0, `Subject '${slug}' must contain topics`);
    }
  });

  it("2. Milestone Recommendation: Resolves next topic across all 8 career roles", () => {
    const roles = Object.keys(TARGET_ROLE_PROFILES) as TargetRoleSlug[];
    for (const role of roles) {
      const rec = resolveNextTopicRecommendation(role, []);
      assert.ok(rec, `Recommendation must be resolved for role ${role}`);
      assert.ok(rec.recommendedTopic, `Recommended topic must exist for role ${role}`);
      assert.ok(rec.subject, `Subject must exist for role ${role}`);
      assert.ok(rec.module, `Module must exist for role ${role}`);
      assert.ok(rec.rationale.length > 10, `Rationale must be descriptive for role ${role}`);
    }
  });

  it("3. Revision PDF Engine: Generates all 3 document modes without throwing", () => {
    const sampleTopic = MASTER_CURRICULUM_SUBJECTS[0].modules[0].topics[0];
    assert.ok(sampleTopic, "Sample topic must exist");
    const parentSubj = MASTER_CURRICULUM_SUBJECTS[0];

    const modes = ["quick", "complete", "cheatsheet"] as const;
    for (const mode of modes) {
      const doc = generateTopicRevisionDocument({
        topic: sampleTopic,
        subject: parentSubj,
        mode,
        candidateName: "Test Student",
        targetRoleTitle: "AI Engineer",
      });

      assert.strictEqual(doc.mode, mode);
      assert.ok(doc.topicTitle.includes("CPython Architecture"));
      assert.ok(doc.summaryPoints.length > 0, `Mode ${mode} must produce summary points`);
      assert.ok(doc.htmlContent.includes("<!DOCTYPE html>"), "Must generate printable HTML");
      assert.ok(doc.htmlContent.includes("CPython Architecture"), "HTML must include topic title");
    }
  });

  it("4. Personal Notes Persistence: Safely saves and retrieves candidate study notes", () => {
    const topicId = "py-04-conditionals";
    const testNotes = "Important note: Python integers have arbitrary precision, avoiding 64-bit overflow.";

    persistTopicNotes(topicId, testNotes);
    const retrieved = getTopicNotes(topicId);
    assert.strictEqual(retrieved, testNotes, "Retrieved notes must match persisted notes exactly");
  });
});
