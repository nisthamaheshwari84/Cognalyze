import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getStudentMentorContext,
  getDeterministicMentorResponse,
  executeMentorTurn
} from "../lib/mentor/ai-mentor-service";

describe("Cognalyze AI Mentor — Intelligence & Context Ingestion", () => {
  it("ingests Student DNA and derives 4 targeted Today's Focus items", () => {
    const context = getStudentMentorContext("student-demo");
    assert.strictEqual(context.studentName, "Nistha Maheshwari");
    assert.ok(context.verifiedSkills.length > 0, "Must have verified capabilities");
    assert.ok(context.verifiedSkills.includes("Python") || context.verifiedSkills.includes("Machine Learning"), "Has core demonstrated skills");
    assert.strictEqual(context.todaysFocus.length, 4, "Must derive exactly 4 daily focus items");

    for (const item of context.todaysFocus) {
      assert.ok(item.title, "Focus item must have a title");
      assert.ok(item.why, "Focus item must include an evidence-grounded 'Why?'");
      assert.ok(item.actionHref, "Focus item must link to an actionable Cognalyze tool");
    }
  });

  it("handles OOP learning inquiries with analogy, simple code, and understanding check", () => {
    const context = getStudentMentorContext("student-demo");
    const turn = getDeterministicMentorResponse("Teach me OOP concepts and polymorphism", "learn", context);

    assert.ok(turn.content.includes("blueprint"), "Uses class/blueprint analogy");
    assert.ok(turn.content.includes("Polymorphism"), "Explains polymorphism");
    assert.ok(turn.content.includes("```python"), "Provides clean Python snippet");
    assert.ok(turn.content.includes("Quick Check"), "Tests student understanding");
    assert.ok(turn.why.length > 0, "Provides explainable 'Why?' justification");
    assert.ok(turn.quickReplies.length > 0, "Provides pedagogical quick replies");
    assert.ok(turn.featureLinks.some((l) => l.href === "/question-bank"), "Links to Question Bank");
  });

  it("handles DSA inquiries with intuition, base case, dry run, and socratic checks", () => {
    const context = getStudentMentorContext("student-demo");
    const turn = getDeterministicMentorResponse("Teach me recursion for binary trees", "dsa", context);

    assert.ok(turn.content.includes("Base Case"), "Explains base case requirement");
    assert.ok(turn.content.includes("Recursive Step"), "Explains recursive step");
    assert.ok(turn.content.includes("Dry-Run"), "Includes call stack dry run");
    assert.ok(turn.quickReplies.length > 0, "Provides next practice suggestions");
    assert.ok(turn.featureLinks.some((l) => l.href === "/dsa-tracker"), "Links directly to DSA Tracker");
  });

  it("handles project explanation inquiries using real Student DNA project evidence", () => {
    const context = getStudentMentorContext("student-demo");
    const turn = getDeterministicMentorResponse("How do I explain my project in an interview?", "projects", context);

    assert.ok(turn.content.includes("Elevator Pitch"), "Provides concise pitch structure");
    assert.ok(turn.content.includes("Trade-offs"), "Highlights technical trade-offs");
    assert.ok(turn.content.includes("Autonomous Payment Recovery Agent"), "Cites actual project from Student DNA");
    assert.ok(turn.featureLinks.some((l) => l.href === "/resume"), "Links to Resume Workspace");
  });

  it("handles resume review inquiries grounded in verified skills without hallucinating credentials", () => {
    const context = getStudentMentorContext("student-demo");
    const turn = getDeterministicMentorResponse("Review my resume and ATS readiness", "resume", context);

    assert.ok(turn.content.includes("Verified Capabilities"), "Cites verified skills");
    assert.ok(turn.content.includes("XYZ formula"), "Teaches Google XYZ impact formula");
    assert.ok(turn.featureLinks.some((l) => l.href === "/resume"), "Links to Resume Studio");
  });

  it("handles 2-week study plan generation with day-by-day objectives", () => {
    const context = getStudentMentorContext("student-demo");
    const turn = getDeterministicMentorResponse("Make me a 2-week DSA study plan", "career", context);

    assert.ok(turn.content.includes("Day 1–3"), "Breaks down timeline");
    assert.ok(turn.content.includes("Trees & Recursion"), "Includes high priority topics");
    assert.ok(turn.featureLinks.some((l) => l.href === "/dsa-tracker"), "Links to practice tools");
  });
});
