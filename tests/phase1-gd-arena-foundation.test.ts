import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  GD_ARENA_TABS,
  GD_EXPERIENCE_MODES,
  GD_SKILLS_LAB_TRACKS,
  getGDTheme
} from "../components/gd/gd-theme";

describe("PHASE 1 — COGNALYZE GD ARENA UX FOUNDATION", () => {
  test("1. Defines all 7 student-only Arena navigation tabs without recruiter/admin tabs", () => {
    const ids = GD_ARENA_TABS.map((t) => t.id);
    assert.deepEqual(ids, [
      "overview",
      "setup",
      "friends",
      "topics",
      "skills-lab",
      "performance",
      "guidelines"
    ]);
    for (const tab of GD_ARENA_TABS) {
      const lower = `${tab.label} ${tab.description}`.toLowerCase();
      assert.ok(!lower.includes("shortlist"), "Out-of-scope recruiter shortlisting must not appear");
      assert.ok(!lower.includes("placement cell"), "Out-of-scope college admin must not appear");
    }
  });

  test("2. Design system tokens preserve white/ivory light surfaces and purple accents", () => {
    const light = getGDTheme(false);
    const dark = getGDTheme(true);
    assert.equal(light.bgPage, "#F6F5F1");
    assert.equal(light.bgCard, "#FFFFFF");
    assert.equal(light.accent, "#4F46E5");
    assert.equal(light.accentSecondary, "#7C3AED");
    assert.equal(dark.bgPage, "#07111F");
  });

  test("3. Experience modes & 12 Skills Lab tracks are fully defined", () => {
    assert.equal(GD_EXPERIENCE_MODES.length, 4);
    assert.equal(GD_SKILLS_LAB_TRACKS.length, 12);
    const uniqueIds = new Set(GD_SKILLS_LAB_TRACKS.map((t) => t.id));
    assert.equal(uniqueIds.size, 12);
    for (const track of GD_SKILLS_LAB_TRACKS) {
      assert.ok(track.rubricFocus.length >= 3, `${track.id} must have >= 3 rubric signals`);
      assert.ok(track.dnaTag.length > 0, `${track.id} must map to Student DNA tag`);
    }
  });
});
