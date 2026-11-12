/**
 * tests/recruitment-arena-end-to-end.test.ts
 * 
 * End-to-End Integration Test Suite for Cognalyze Recruitment Arena.
 * Verifies complete student recruitment journey, sandboxed code execution,
 * work simulation, interview evaluation, anti-simulation DNA sync, and recruiter campaign bridge.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createJourney,
  canAttemptStage,
  advanceJourneyWithAttempt,
} from "../lib/recruitment/journey-engine";

import {
  evaluateCodingProblem,
  evaluateWorkSimulation,
} from "../lib/recruitment/assessment-runner";

import {
  AMAZON_OA_PROBLEMS,
  AMAZON_WORK_SIMULATION_SCENARIOS,
} from "../lib/recruitment/assessment-problems";

import {
  evaluateInterviewResponse,
  generateStageInterviewConfig,
} from "../lib/recruitment/interview-adapter";

import {
  syncRecruitmentStageAttemptToDNA,
  getRemediationTopicsForWeaknesses,
} from "../lib/recruitment/dna-recruitment-bridge";

import {
  blueprintToJDProfile,
  journeyToCandidateCard,
} from "../lib/recruitment/recruiter-campaign-bridge";

describe("Recruitment Arena — Complete End-to-End Acceptance Lifecycle", () => {
  const candidateId = "cand_verified_e2e_77";

  it("completes full authentic Amazon SDE recruitment journey from OA1 to Bar Raiser Offer", async () => {
    // 1. Initialize Journey
    let journey = createJourney({
      studentId: candidateId,
      companyId: "amazon",
      roleFamily: "sde",
      hiringChannel: "campus",
    });

    assert.strictEqual(journey.companyId, "amazon");
    assert.strictEqual(journey.status, "IN_PROGRESS");
    assert.strictEqual(journey.currentStageId, "stage_amzn_oa1");

    // 2. Stage 1: Amazon OA1 Coding Challenge (Real Python Execution)
    const prob = AMAZON_OA_PROBLEMS.find((p) => p.id === "amzn_02_sliding_inventory")!;
    assert.ok(prob);

    const workingPythonCode = `
from collections import defaultdict

def longest_stable_window(departures: str, k: int) -> int:
    if k == 0 or not departures:
        return 0
    counts = defaultdict(int)
    left = 0
    max_len = 0
    for right in range(len(departures)):
        counts[departures[right]] += 1
        while len(counts) > k:
            counts[departures[left]] -= 1
            if counts[departures[left]] == 0:
                del counts[departures[left]]
            left += 1
        max_len = max(max_len, right - left + 1)
    return max_len
`;

    const codeEval = await evaluateCodingProblem(prob, workingPythonCode);
    assert.strictEqual(codeEval.passed, true, "Python solution must pass all sliding window tests");
    assert.strictEqual(codeEval.score, 100);

    const step1 = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: "stage_amzn_oa1",
      rawScore: codeEval.score,
      maxScore: 100,
      durationSeconds: 1500,
      telemetry: codeEval.telemetry,
      evaluatorFeedback: codeEval.feedback,
    });

    assert.strictEqual(step1.stagePassed, true);
    assert.strictEqual(step1.nextStageId, "stage_amzn_oa2");
    journey = step1.updatedJourney;

    // 3. Stage 2: Amazon OA2 Work Simulation (Leadership Principles Evaluation)
    const workSimEval = evaluateWorkSimulation(AMAZON_WORK_SIMULATION_SCENARIOS, {
      amzn_ws_01_priority_conflict: "opt_a", // Customer Obsessed Option
    });
    assert.strictEqual(workSimEval.passed, true);
    assert.ok(workSimEval.score >= 90);

    const step2 = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: "stage_amzn_oa2",
      rawScore: workSimEval.score,
      maxScore: 100,
      durationSeconds: 1200,
      telemetry: { lpScores: workSimEval.lpScores },
      evaluatorFeedback: workSimEval.feedback,
    });

    assert.strictEqual(step2.stagePassed, true);
    assert.strictEqual(step2.nextStageId, "stage_amzn_onsite_1");
    journey = step2.updatedJourney;

    // 4. Stage 3: Virtual Onsite 1 (DSA + 2 LPs)
    const step3 = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: "stage_amzn_onsite_1",
      rawScore: 85,
      maxScore: 100,
      durationSeconds: 3600,
      telemetry: { dsaPassed: true },
      evaluatorFeedback: "Strong algorithmic complexity analysis.",
    });
    assert.strictEqual(step3.stagePassed, true);
    journey = step3.updatedJourney;

    // 5. Stage 4: Virtual Onsite 2 (LLD + 2 LPs)
    const step4 = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: "stage_amzn_onsite_2",
      rawScore: 80,
      maxScore: 100,
      durationSeconds: 3600,
      telemetry: { lldPassed: true },
      evaluatorFeedback: "Clean class hierarchy with Strategy pattern.",
    });
    assert.strictEqual(step4.stagePassed, true);
    journey = step4.updatedJourney;

    // 6. Stage 5: The Bar Raiser Round (STAR Behavioral Probing)
    const interviewText = `
In my previous project at my university internship, the client portal was experiencing intermittent 500 errors during peak morning registration.
My task was to identify the root cause and ensure zero checkout drops.
I decided to instrument distributed tracing using OpenTelemetry and discovered a database connection pool starvation under concurrent load. I refactored the connection timeout and implemented exponential backoff with jitter.
As a result, transaction error rate dropped from 4.2% to 0.01%, improving overall throughput by 35% without adding new server instances.
`;

    const starEval = evaluateInterviewResponse(interviewText, ["customer_obsession", "dive_deep"]);
    assert.strictEqual(starEval.starBreakdown.situationPresent, true);
    assert.strictEqual(starEval.starBreakdown.taskPresent, true);
    assert.strictEqual(starEval.starBreakdown.actionPresent, true);
    assert.strictEqual(starEval.starBreakdown.resultPresent, true);
    assert.ok(starEval.score >= 85);

    const step5 = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: "stage_amzn_bar_raiser",
      rawScore: starEval.score,
      maxScore: 100,
      durationSeconds: 3600,
      telemetry: { star: starEval.starBreakdown },
      evaluatorFeedback: "Bar Raiser approved. Demonstrated high dive deep and ownership.",
    });
    assert.strictEqual(step5.stagePassed, true);
    journey = step5.updatedJourney;

    // 7. Stage 6: Final Bar Raiser Debrief & Placement Verdict
    const step6 = advanceJourneyWithAttempt(journey, {
      journeyId: journey.id,
      stageId: "stage_amzn_verdict",
      rawScore: 90,
      maxScore: 100,
      durationSeconds: 1800,
      telemetry: { barRaiserConsensus: true },
      evaluatorFeedback: "Unanimous committee hire decision for SDE I.",
    });

    assert.strictEqual(step6.stagePassed, true);
    assert.strictEqual(step6.isCompleted, true);
    assert.strictEqual(step6.updatedJourney.status, "OFFER_EXTENDED");
    assert.ok(step6.updatedJourney.overallScore >= 80);
  });

  it("strictly enforces Anti-Simulation: failing stages are blocked from Student DNA", async () => {
    const journey = createJourney({
      studentId: candidateId,
      companyId: "amazon",
      roleFamily: "sde",
      hiringChannel: "campus",
    });

    const failedProgress = {
      stageId: "stage_amzn_oa1",
      stageType: "algorithmic_coding" as const,
      title: "Amazon OA1 Code Assessment",
      order: 1,
      status: "FAILED" as const,
      rawScore: 40,
      maxScore: 100,
      percentageScore: 40,
      attemptCount: 1,
      evaluatorFeedback: "Failed hidden edge-case tests.",
    };

    const syncResult = await syncRecruitmentStageAttemptToDNA(journey, failedProgress);
    assert.strictEqual(syncResult.dnaUpdated, false, "Failing attempt must NOT write to Student DNA");
    assert.ok(syncResult.remediationRecommendations);
    assert.ok(syncResult.remediationRecommendations.length >= 1);
  });

  it("generates actionable remediation links for weak competencies", () => {
    const weaknesses = ["algorithmic_problem_solving", "sql_data_modeling"];
    const recommendations = getRemediationTopicsForWeaknesses(weaknesses);

    assert.strictEqual(recommendations.length, 2);
    assert.ok(recommendations[0].practiceUrl.includes("/student/skills/ai-data?tab=practice&subject=python"));
    assert.ok(recommendations[1].practiceUrl.includes("/student/skills/ai-data?tab=practice&subject=sql"));
  });

  it("bridges recruitment blueprints and journeys into calibrated recruiter profiles and candidate cards", () => {
    // 1. Recruiter JD Profile from Google Blueprint
    const jdProfile = blueprintToJDProfile("bp_google_sde_campus_v1");
    assert.strictEqual(jdProfile.trackId, "general_swe");
    assert.ok(jdProfile.title.includes("Google"));
    assert.ok(jdProfile.mustHaveCompetencies.length >= 2);
    assert.ok(jdProfile.dimensionWeights.DIM_3_PRACTICAL_IMPL > 0);

    // 2. Candidate Pipeline Card from Student Journey
    const journey = createJourney({
      studentId: candidateId,
      companyId: "google",
      roleFamily: "sde",
      hiringChannel: "campus",
    });

    const card = journeyToCandidateCard(journey);
    assert.strictEqual(card.studentId, candidateId);
    assert.strictEqual(card.companyId, "google");
    assert.strictEqual(card.companyName, "Google");
    assert.strictEqual(card.totalStagesCount, 5);
  });
});

