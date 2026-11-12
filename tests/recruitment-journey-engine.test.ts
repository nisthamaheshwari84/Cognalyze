/**
 * tests/recruitment-journey-engine.test.ts
 * 
 * Verification of Dynamic Recruitment Journey Engine, DAG dependencies,
 * stage progression, and scoring.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createJourney,
  canAttemptStage,
  getAvailableStages,
  advanceJourneyWithAttempt,
} from "../lib/recruitment/journey-engine";

import {
  saveJourney,
  getJourneyById,
  getJourneysByStudent,
} from "../lib/recruitment/journey-store";

describe("Recruitment Arena Phase 2 — Journey Engine & DAG Progression", () => {
  const testStudentId = "test_cand_dna_42";

  it("initializes a valid student journey against Google SDE blueprint", () => {
    const journey = createJourney({
      studentId: testStudentId,
      companyId: "google",
      roleFamily: "sde",
      hiringChannel: "campus",
    });

    assert.ok(journey.id.startsWith("jny_google_sde_"));
    assert.strictEqual(journey.studentId, testStudentId);
    assert.strictEqual(journey.companyId, "google");
    assert.strictEqual(journey.blueprintId, "bp_google_sde_campus_v1");
    assert.strictEqual(journey.blueprintVersion, "1.0.0");
    assert.strictEqual(journey.status, "IN_PROGRESS");
    assert.strictEqual(journey.overallScore, 0);

    // Google has 5 stages
    const stageIds = Object.keys(journey.stageProgress);
    assert.strictEqual(stageIds.length, 5);
    assert.strictEqual(journey.currentStageId, "stage_google_oa");
    assert.strictEqual(journey.stageProgress["stage_google_oa"].status, "NOT_STARTED");
  });

  it("enforces strict DAG dependencies on stage execution", () => {
    const journey = createJourney({
      studentId: testStudentId,
      companyId: "google",
      roleFamily: "sde",
      hiringChannel: "campus",
    });

    // Stage 1 has no dependencies: should be allowed
    const check1 = canAttemptStage(journey, "stage_google_oa");
    assert.strictEqual(check1.allowed, true);

    // Stage 2 depends on Stage 1: must be blocked
    const check2 = canAttemptStage(journey, "stage_google_tech_1");
    assert.strictEqual(check2.allowed, false);
    assert.ok(check2.reason?.includes("Google Online Challenge"));

    // Stage 4 (Behavioral) must also be blocked
    const check4 = canAttemptStage(journey, "stage_google_behavioral");
    assert.strictEqual(check4.allowed, false);

    // getAvailableStages should only return Stage 1
    const available = getAvailableStages(journey);
    assert.strictEqual(available.length, 1);
    assert.strictEqual(available[0].id, "stage_google_oa");
  });

  it("advances journey state and unlocks next stage upon passing score", () => {
    const journey = createJourney({
      studentId: testStudentId,
      companyId: "google",
      roleFamily: "sde",
      hiringChannel: "campus",
    });

    // Submit passing attempt for Stage 1 (Score 80 > 75 threshold)
    const result1 = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: "stage_google_oa",
      rawScore: 80,
      maxScore: 100,
      durationSeconds: 3200,
      telemetry: { publicTestsPassed: 10, hiddenTestsPassed: 10 },
      evaluatorFeedback: "Clean O(N log N) solution.",
    });

    assert.strictEqual(result1.stagePassed, true);
    assert.strictEqual(result1.isCompleted, false);
    assert.strictEqual(result1.nextStageId, "stage_google_tech_1");

    const updated = result1.updatedJourney;
    assert.strictEqual(updated.currentStageId, "stage_google_tech_1");
    assert.strictEqual(updated.stageProgress["stage_google_oa"].status, "PASSED");
    assert.strictEqual(updated.stageProgress["stage_google_oa"].percentageScore, 80);
    assert.strictEqual(updated.overallScore, 80);
    assert.ok(updated.competencyScores["algorithmic_problem_solving"] > 0);

    // Now Stage 2 should be unlocked
    const checkStage2 = canAttemptStage(updated, "stage_google_tech_1");
    assert.strictEqual(checkStage2.allowed, true);

    const availableNow = getAvailableStages(updated);
    assert.strictEqual(availableNow.length, 1);
    assert.strictEqual(availableNow[0].id, "stage_google_tech_1");
  });

  it("transitions to DID_NOT_PASS when a mandatory stage is failed", () => {
    const journey = createJourney({
      studentId: testStudentId,
      companyId: "google",
      roleFamily: "sde",
      hiringChannel: "campus",
    });

    // Submit failing attempt for Stage 1 (Score 40 < 75 threshold)
    const result = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: "stage_google_oa",
      rawScore: 40,
      maxScore: 100,
      durationSeconds: 2400,
      telemetry: { publicTestsPassed: 4, hiddenTestsPassed: 0 },
      evaluatorFeedback: "Time limit exceeded on hidden test suite.",
    });

    assert.strictEqual(result.stagePassed, false);
    assert.strictEqual(result.isCompleted, true);
    assert.strictEqual(result.updatedJourney.status, "DID_NOT_PASS");
    assert.strictEqual(result.updatedJourney.stageProgress["stage_google_oa"].status, "FAILED");

    // Subsequent stages must be blocked
    const checkNext = canAttemptStage(result.updatedJourney, "stage_google_tech_1");
    assert.strictEqual(checkNext.allowed, false);
    assert.ok(checkNext.reason?.includes("DID_NOT_PASS"));
  });

  it("extends offer when candidate passes all 5 stages in sequence", () => {
    let journey = createJourney({
      studentId: testStudentId,
      companyId: "google",
      roleFamily: "sde",
      hiringChannel: "campus",
    });

    const stageScores = [
      { id: "stage_google_oa", score: 85 },
      { id: "stage_google_tech_1", score: 80 },
      { id: "stage_google_tech_2", score: 90 },
      { id: "stage_google_behavioral", score: 85 },
      { id: "stage_google_verdict", score: 88 },
    ];

    for (let i = 0; i < stageScores.length; i++) {
      const { id, score } = stageScores[i];
      const result = advanceJourneyWithAttempt(journey, {
        journeyId: journey.id,
        stageId: id,
        rawScore: score,
        maxScore: 100,
        durationSeconds: 1800,
        telemetry: { mockEvaluation: true },
        evaluatorFeedback: `Candidate demonstrated strong competence in stage ${i + 1}.`,
      });

      assert.strictEqual(result.stagePassed, true, `Stage ${id} must pass`);
      journey = result.updatedJourney;

      if (i < stageScores.length - 1) {
        assert.strictEqual(result.isCompleted, false);
      } else {
        assert.strictEqual(result.isCompleted, true);
      }
    }

    assert.strictEqual(journey.status, "OFFER_EXTENDED");
    assert.ok(journey.completedAt !== undefined);
    assert.strictEqual(journey.overallScore, 85.6); // (85 + 80 + 90 + 85 + 88) / 5 = 85.6
  });

  it("persists journey to store and retrieves cleanly", async () => {
    const journey = createJourney({
      studentId: "persisted_student_99",
      companyId: "amazon",
      roleFamily: "sde",
      hiringChannel: "campus",
    });

    await saveJourney(journey);

    const fetched = await getJourneyById(journey.id);
    assert.ok(fetched);
    assert.strictEqual(fetched.id, journey.id);
    assert.strictEqual(fetched.companyId, "amazon");
    assert.strictEqual(fetched.blueprintId, "bp_amazon_sde_campus_v1");

    const studentJourneys = await getJourneysByStudent("persisted_student_99");
    assert.ok(studentJourneys.length >= 1);
    assert.strictEqual(studentJourneys[0].id, journey.id);
  });
});

