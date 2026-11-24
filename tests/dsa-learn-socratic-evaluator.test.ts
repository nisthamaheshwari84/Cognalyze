/**
 * COGNALYZE DSA LEARN — AUTOMATED TEST SUITE: PHASE 6
 * Verifies Socratic AI Tutoring, Free-Text Evaluation Engine & API Integration
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateHeuristicFallback,
  generateSocraticTutorReply,
  FreeTextEvaluationRequest
} from "../lib/skills/learn/socratic-evaluator";
import { KADANE_ALGORITHM_MODULE } from "../lib/skills/learn/modules/kadane-algorithm";

test("Phase 6 — Socratic AI Tutoring & Free-Text Evaluation Engine", async (t) => {

  await t.test("1. Heuristic engine awards passing score (>= 80%) to complete conceptual explanation", () => {
    const req: FreeTextEvaluationRequest = {
      microConceptId: "mc-3-2-1-1",
      userExplanation: `In Kadane's algorithm, we perform a single pass O(N) inspection with O(1) space.
We keep a running currSum and global maxSum.
Whenever currSum becomes negative, it acts as a penalty or drag on future numbers, so we reset currSum to 0.
To handle all-negative arrays correctly, we initialize maxSum = nums[0] and update maxSum before resetting, so the least negative number is captured.`,
      language: "en"
    };

    const result = evaluateHeuristicFallback(req, KADANE_ALGORITHM_MODULE);

    assert.equal(result.isPassing, true, "Comprehensive answer must pass");
    assert.ok(result.overallMasteryScore >= 80, `Expected score >= 80, got ${result.overallMasteryScore}`);
    assert.equal(result.criteriaResults.length, 4, "Must evaluate 4 criteria");
    assert.ok(result.criteriaResults.every((c) => c.isUnderstood), "All criteria should be understood");
    assert.equal(result.evaluationMode, "heuristic_fallback");
  });

  await t.test("2. Detects all-negative array misconception and penalizes score", () => {
    const req: FreeTextEvaluationRequest = {
      microConceptId: "mc-3-2-1-1",
      userExplanation: `Kadane algorithm sums numbers. If all elements are negative, it should return 0 because we initialize maxSum = 0 and empty array has sum 0.`,
      language: "en"
    };

    const result = evaluateHeuristicFallback(req, KADANE_ALGORITHM_MODULE);

    assert.equal(result.isPassing, false, "Flawed answer with misconception must not pass");
    assert.ok(result.overallMasteryScore < 80, "Score must be below passing threshold");

    const negMisconception = result.misconceptions.find((m) => m.misconceptionId === "det-all-negative-zero-bug");
    assert.ok(negMisconception, "Must contain all-negative misconception detector");
    assert.equal(negMisconception?.isDetected, true, "Must flag misconception as detected");
  });

  await t.test("3. Handles Hinglish conceptual explanation correctly", () => {
    const req: FreeTextEvaluationRequest = {
      microConceptId: "mc-3-2-1-1",
      userExplanation: `Jab bhi running sum negative ho jaye toh currSum ko 0 par reset karte hain taaki aage drag na ho.
maxSum global peak maintain karta hai aur currSum local ending at current index.
All-negative arrays ke liye maxSum ko nums[0] se update pehle karte hain. O(N) single pass inspect karta hai.`,
      language: "hinglish"
    };

    const result = evaluateHeuristicFallback(req, KADANE_ALGORITHM_MODULE);

    assert.equal(result.isPassing, true, "Hinglish answer with solid reasoning should pass");
    assert.ok(result.overallMasteryScore >= 75);
    assert.ok(result.socraticFeedback.includes("Kadane's algorithm"));
  });

  await t.test("4. Penalizes empty or superficial explanation", () => {
    const req: FreeTextEvaluationRequest = {
      microConceptId: "mc-3-2-1-1",
      userExplanation: `i don't know just use a loop`,
      language: "en"
    };

    const result = evaluateHeuristicFallback(req, KADANE_ALGORITHM_MODULE);

    assert.equal(result.isPassing, false);
    assert.ok(result.overallMasteryScore < 30);
  });

  await t.test("5. Socratic tutor generates pedagogical fallback reply in English and Hinglish", async () => {
    // English tutor test
    const enReply = await generateSocraticTutorReply({
      microConceptId: "mc-3-2-1-1",
      userMessage: "Why can't I just keep the negative sum?",
      language: "en"
    });
    assert.ok(enReply.reply.length > 20);

    // Hinglish tutor test
    const hiReply = await generateSocraticTutorReply({
      microConceptId: "mc-3-2-1-1",
      userMessage: "Agar saare numbers negative hon toh kya hoga?",
      language: "hinglish"
    });
    assert.ok(hiReply.reply.length > 20);
  });

  await t.test("6. SocraticMentorDrawer component and API routes compile cleanly", async () => {
    const drawer = await import("../components/skills/learn/SocraticMentorDrawer");
    assert.ok(drawer.default, "SocraticMentorDrawer must export default component");

    const evalRoute = await import("../app/api/learn/evaluate-answer/route");
    assert.ok(evalRoute.POST, "evaluate-answer route must export POST handler");

    const tutorRoute = await import("../app/api/learn/socratic-tutor/route");
    assert.ok(tutorRoute.POST, "socratic-tutor route must export POST handler");
  });
});
