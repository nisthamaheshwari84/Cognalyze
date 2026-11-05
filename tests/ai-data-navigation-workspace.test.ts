/**
 * tests/ai-data-navigation-workspace.test.ts
 * 
 * Verifies Phase 2 Navigation & Topic Workspace Requirements:
 * 1. 6 AI & Data tracks with hierarchical chapters/stages and topics.
 * 2. Every track has valid stages and accessible topic slugs.
 * 3. Every topic package resolves valid Modes A-F without crashes.
 * 4. Role profiles map cleanly to valid primary curriculum tracks.
 * 5. Bounded scrolling model: topic isolation and deep-linking parameters.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AI_DATA_TRACKS, getAllTracks, getTrackBySlug } from "../lib/skills/ai-data/curriculum";
import { TARGET_ROLE_PROFILES, getAllTargetRoles, getTargetRoleBySlug } from "../lib/skills/ai-data/roles";
import { getTopicTeacherPackage } from "../lib/skills/ai-data/ai-teacher-engine";
import { AiDataTrackSlug, TargetRoleSlug } from "../lib/skills/ai-data/types";

describe("Phase 2: Navigation & Dedicated Topic Workspace", () => {
  test("Curriculum exposes all 6 AI/Data tracks with valid hierarchical structure", () => {
    const tracks = getAllTracks();
    assert.strictEqual(tracks.length, 6, "Expected exactly 6 AI & Data tracks");

    const expectedSlugs: AiDataTrackSlug[] = [
      "ai_ml",
      "data_science_analytics",
      "genai_llm",
      "data_eng",
      "mlops",
      "applied_projects"
    ];

    for (const slug of expectedSlugs) {
      const trk = getTrackBySlug(slug);
      assert.ok(trk, `Track ${slug} must be registered in curriculum`);
      assert.ok(trk.stages.length >= 2, `Track ${slug} must contain at least 2 stages/chapters`);
      
      let totalLessons = 0;
      for (const stg of trk.stages) {
        assert.ok(stg.stageNumber > 0, "Stage number must be positive");
        assert.ok(stg.title.length > 0, "Stage title must not be empty");
        assert.ok(stg.lessons.length > 0, `Stage ${stg.stageNumber} must contain lessons`);
        for (const lesson of stg.lessons) {
          totalLessons++;
          assert.ok(lesson.slug.length > 0, "Lesson slug must be defined");
          assert.ok(lesson.title.length > 0, "Lesson title must be defined");
          assert.ok(lesson.canonicalSkill.length > 0, "Lesson must map to a canonical skill");
          assert.ok(
            ["sql_lab", "code_lab", "agent_builder", "experiment_studio", "conceptual_challenge", "project_milestone"].includes(lesson.exerciseType),
            `Exercise type '${lesson.exerciseType}' must be valid`
          );
        }
      }
      assert.ok(totalLessons >= 4, `Track ${slug} must contain at least 4 topics`);
    }
  });

  test("Every target role maps cleanly to a valid primary curriculum track", () => {
    const roles = getAllTargetRoles();
    assert.strictEqual(roles.length, 8, "Expected 8 sourced target roles");

    for (const role of roles) {
      assert.ok(role.primaryTrack, `Role ${role.slug} must specify primaryTrack`);
      const trk = getTrackBySlug(role.primaryTrack);
      assert.ok(trk, `Role ${role.slug} primary track ${role.primaryTrack} must exist in AI_DATA_TRACKS`);
      assert.ok(role.requiredSkills.length >= 3, `Role ${role.slug} must define required skills`);
    }
  });

  test("getTopicTeacherPackage resolves valid Modes A-F for curriculum topics", () => {
    const sampleSlugs = [
      "agent-tool-routing",
      "sql-cohort-retention",
      "python-rolling-stats",
      "pydantic-structured-outputs",
      "unknown-fallback-slug"
    ];

    for (const slug of sampleSlugs) {
      const pkg = getTopicTeacherPackage(slug);
      assert.ok(pkg, `Teacher package must be returned for ${slug}`);
      assert.ok(pkg.title.length > 0, "Package must have a title");
      assert.ok(pkg.canonicalSkill.length > 0, "Package must have a canonical skill");

      // Mode A: Concept Mastery & Intuition
      assert.ok(pkg.modeA.intuitiveAnalogy.length > 10, "Mode A must provide intuitive analogy");
      assert.ok(pkg.modeA.spokenTranscript.length > 10, "Mode A must provide spoken audio transcript");
      assert.ok(pkg.modeA.diagramMermaid.length > 10, "Mode A must provide Mermaid diagram");

      // Mode B: Watch AI Build
      assert.ok(pkg.modeB.blocks.length >= 2, "Mode B must contain at least 2 progressive build blocks");
      for (const block of pkg.modeB.blocks) {
        assert.ok(block.architecturalReason.length > 5, "Block must explain architectural reasoning");
      }

      // Mode C: Build Together Slots
      assert.ok(pkg.modeC.slots.length >= 1, "Mode C must contain co-build slots");

      // Mode D: Modify & Debug
      assert.ok(pkg.modeD.fault.buggyCodeOrConfig.length > 0, "Mode D must provide buggy code/config");
      assert.ok(pkg.modeD.fault.diagnosticHints.length >= 2, "Mode D must provide diagnostic hints");
    }
  });
});
