import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recordHumanDecision, computeProcessIntelligence } from "../lib/decisions/engine";
import { computeQualityOfHireAnalytics, MINIMUM_RECORDS_THRESHOLD } from "../lib/ai/quality-of-hire";
import { calculateCompanyQualityScore, calculateEducationQualityScore, calculateTrajectoryScore } from "../lib/scoring";
import { scoreCandidateLocal } from "../lib/ai/ranking";
import { RedrobCandidate } from "../types/matching";

describe("Phase 6: Decisions, Gated Outcomes, Process Intelligence & Purging Magic Weights", () => {
  it("records human decision with immutable snapshot and audit tracking", async () => {
    const result = await recordHumanDecision({
      applicationId: "app-test-101",
      candidateId: "cand-test-101",
      roleId: "role-test-101",
      decision: "hire",
      deciderUserId: "lead-interviewer-dr-smith",
      rationale: "Demonstrated exemplary Raft consensus implementation and clear system architecture in verified work sample.",
      citedEvidenceIds: ["evi-raft-101", "evi-perf-102"],
      assessmentsSnapshot: {
        timestamp: "2026-09-20T03:00:00Z",
        overallState: "ESTABLISHED",
        requirements: {
          raft_consensus: "ESTABLISHED",
          distributed_tracing: "ESTABLISHED",
        },
      },
      fromStage: "deliberation",
      toStage: "Hired",
    });

    assert.equal(result.success, true);
    assert.equal(result.decision, "hire");
    assert.equal(result.nextStage, "Hired");
    assert.ok(result.decisionId);
    assert.ok(result.decidedAt);
  });

  it("strictly enforces N >= 20 threshold before inferring predictive hire patterns (ADR-003)", () => {
    assert.equal(MINIMUM_RECORDS_THRESHOLD, 20);

    // Test with 5 records (< 20) -> must be gated
    const fiveRecords: any[] = Array.from({ length: 5 }, (_, i) => ({
      hireId: `hire-${i + 1}`,
      candidateId: `cand-${i + 1}`,
      candidateName: `Candidate ${i + 1}`,
      roleId: "role-1",
      roleTitle: "Staff Engineer",
      hiredAt: "2026-01-01T00:00:00Z",
      preHireSignals: {
        overallFitScore: 85,
        hadVerifiedWorkSample: true,
        interviewScore: 88,
        criticalGapsIdentified: [],
        evidenceTypeForCritical: "work_sample",
      },
      day90Milestone: {
        recordedAt: "2026-04-01T00:00:00Z",
        businessOutcomeMet: true,
        overall90DayPerformance: 88,
        retentionRisk: "Low",
        managerVerdict: "Exceeded Expectations",
        keyLearnings: "Strong delivery.",
      },
    }));

    const gatedAnalytics = computeQualityOfHireAnalytics(fiveRecords, []);
    assert.equal(gatedAnalytics.status, "insufficient_data");
    assert.equal(gatedAnalytics.currentRecordsCount, 5);
    assert.equal(gatedAnalytics.minimumThreshold, 20);
    assert.ok(gatedAnalytics.message.includes("5 of 20"));
    assert.ok(gatedAnalytics.metrics === undefined);

    // Test with 20 records (>= 20) -> threshold met
    const twentyRecords: any[] = Array.from({ length: 20 }, (_, i) => ({
      hireId: `hire-${i + 1}`,
      candidateId: `cand-${i + 1}`,
      candidateName: `Candidate ${i + 1}`,
      roleId: "role-1",
      roleTitle: "Staff Engineer",
      hiredAt: "2026-01-01T00:00:00Z",
      preHireSignals: {
        overallFitScore: 85,
        hadVerifiedWorkSample: i % 2 === 0,
        interviewScore: 88,
        criticalGapsIdentified: [],
        evidenceTypeForCritical: i % 2 === 0 ? "work_sample" : "interview_only",
      },
      day90Milestone: {
        recordedAt: "2026-04-01T00:00:00Z",
        businessOutcomeMet: true,
        overall90DayPerformance: 85,
        retentionRisk: "Low",
        managerVerdict: "Exceeded Expectations",
        keyLearnings: "Strong delivery.",
      },
    }));

    const metAnalytics = computeQualityOfHireAnalytics(twentyRecords, []);
    assert.equal(metAnalytics.status, "threshold_met");
    assert.equal(metAnalytics.currentRecordsCount, 20);
    assert.ok(metAnalytics.metrics);
    assert.equal(metAnalytics.metrics.average90DayPerformance, 85);
  });

  it("computes verifiable process intelligence and flags bottlenecks (>7 days in stage)", () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const events = [
      { applicationId: "app-1", fromStage: null, toStage: "Applied", occurredAt: new Date(now - 20 * day).toISOString() },
      { applicationId: "app-1", fromStage: "Applied", toStage: "Screened", occurredAt: new Date(now - 19 * day).toISOString() }, // 1 day
      { applicationId: "app-1", fromStage: "Screened", toStage: "Validated", occurredAt: new Date(now - 9 * day).toISOString() }, // 10 days -> bottleneck!
      { applicationId: "app-1", fromStage: "Validated", toStage: "Hired", occurredAt: new Date(now - 7 * day).toISOString() }, // 2 days
    ];

    const report = computeProcessIntelligence(events, 1);
    assert.equal(report.totalApplications, 1);
    assert.ok(report.stageMetrics.some(m => m.stageName === "Screened" && m.isBottleneck === true));
    assert.ok(report.activeBottlenecks.includes("Screened"));
  });

  it("purges prestige tiers and employer blacklists from scoring and ranking", () => {
    // 1. Company quality and education quality prestige tiers are purged (Truth Contract T7)
    assert.equal(calculateCompanyQualityScore(1), 100);
    assert.equal(calculateCompanyQualityScore(4), 100);
    assert.equal(calculateEducationQualityScore(4, false), 100);

    // 2. Trajectory score reflects tenure and advancement, not company pedigree
    const trajectory = calculateTrajectoryScore(36, 2);
    assert.ok(trajectory >= 90);

    // 3. Ranking does not penalize candidates from consulting backgrounds
    const consultingCandidate = {
      candidate_id: "cand-consulting-1",
      skills: [
        { name: "machine learning", duration_months: 48, proficiency: "expert", endorsements: 12 },
        { name: "python", duration_months: 48, proficiency: "expert", endorsements: 20 },
        { name: "embeddings", duration_months: 36, proficiency: "advanced", endorsements: 8 },
      ],
      career_history: [
        {
          company: "Tata Consultancy Services (TCS)",
          title: "Senior ML Engineer",
          start_date: "2020-01-01",
          end_date: null,
          duration_months: 48,
          is_current: true,
          company_size: "10001+",
          industry: "Information Technology",
          description: "Built large scale vector search infrastructure",
        },
      ],
      education: [],
      profile: {
        anonymized_name: "Devendra Patel",
        years_of_experience: 6,
        headline: "ML Infrastructure Specialist",
        summary: "Distributed ML engineer",
        location: "Bengaluru, India",
        country: "India",
        current_title: "Senior ML Engineer",
        current_company: "TCS",
        current_company_size: "10001+",
        current_industry: "Technology",
      },
    } as unknown as RedrobCandidate;


    const scored = scoreCandidateLocal(consultingCandidate, 6);
    assert.equal(scored.isHoneypot, false);
    assert.ok(scored.score > 0.4);
    assert.ok(!scored.reasoning.includes("disqualified service company"));
  });
});
