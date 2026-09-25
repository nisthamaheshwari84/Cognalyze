import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatRequirementStatement,
  validateLanguageContract,
  getRequirementStatusDescriptor,
  formatLearningLoopStatus,
  RequirementState,
} from "../lib/copy/language";

describe("Language Contract (lib/copy/language.ts)", () => {
  it("strictly flags banned negative assertions and accusations", () => {
    const badTexts = [
      "Candidate does not know Kubernetes.",
      "The candidate lied about their experience.",
      "Candidate is dishonest.",
      "AI predicts success for this role.",
      "Candidate will be a great employee.",
      "Candidate is highly intelligent and top-tier.",
      "Disqualified service company background found.",
    ];

    for (const text of badTexts) {
      const result = validateLanguageContract(text);
      assert.strictEqual(result.valid, false);
      assert.ok(result.violations.length > 0);
    }
  });

  it("passes compliant, evidence-grounded statements", () => {
    const goodTexts = [
      "Kubernetes capability is not sufficiently established from the available evidence.",
      "The available evidence does not currently establish this claim.",
      "Relevant capability is established; remaining uncertainty concerns system scaling.",
      "Historical organizational evidence can be reviewed alongside the candidate's established capabilities.",
      "Available project evidence shows increasing technical complexity over time.",
    ];

    for (const text of goodTexts) {
      const result = validateLanguageContract(text);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.violations.length, 0);
    }
  });

  it("generates honest statements for all 6 requirement states", () => {
    const states: RequirementState[] = [
      "ESTABLISHED",
      "PARTIAL",
      "UNKNOWN",
      "CONFLICTING",
      "NOT_ESTABLISHED_AFTER_VALIDATION",
      "NOT_APPLICABLE",
    ];

    for (const state of states) {
      const desc = getRequirementStatusDescriptor(state);
      assert.ok(desc.label);
      assert.ok(desc.glyph);

      const stmt = formatRequirementStatement({
        requirementName: "PostgreSQL Query Optimization",
        state,
        evidenceCount: 2,
        sourceCount: 2,
        validationDate: "2026-09-15",
      });

      assert.ok(stmt.includes("PostgreSQL Query Optimization"));
      const validation = validateLanguageContract(stmt);
      assert.strictEqual(validation.valid, true);
    }
  });

  it("enforces N >= 20 gate on organizational learning loop", () => {
    const gated = formatLearningLoopStatus(5, 20);
    assert.strictEqual(gated.isGated, true);
    assert.ok(gated.message.includes("Not enough completed hires yet (5 of 20)"));

    const open = formatLearningLoopStatus(24, 20);
    assert.strictEqual(open.isGated, false);
    assert.ok(open.message.includes("Observational patterns derived from 24 completed 90-day hire reviews"));
  });
});
