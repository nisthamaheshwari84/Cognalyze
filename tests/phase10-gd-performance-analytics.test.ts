import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createUser, createSession } from "../lib/auth/store";
import { saveGDSessionAsync } from "../lib/gd/gd-session-store";
import {
  computeGDPerformanceAnalytics,
  calculateGDPracticeStreak,
  type GDPerformanceSessionRecord
} from "../lib/gd/performance-analytics";
import { GET as sessionsGet } from "../app/api/gd/sessions/route";
import type { GDSessionData } from "../lib/gd/types";

describe("PHASE 10 — GD PERFORMANCE CENTRE ANALYTICS & INTEGRITY", () => {
  test("1. Zero-session empty state never fabricates composite scores, trends, or streaks", () => {
    const analytics = computeGDPerformanceAnalytics({
      sessions: [],
      skillsProgress: [],
      warningHistoryCount: 0,
      suspended: false,
      now: new Date("2026-11-25T12:00:00.000Z")
    });

    assert.equal(analytics.completedSessionsCount, 0);
    assert.equal(analytics.compositeAverage, null);
    assert.equal(analytics.peakScore, null);
    assert.equal(analytics.latestScore, null);
    assert.equal(analytics.scoreDelta, null);
    assert.equal(analytics.scoreTrend.length, 0);
    assert.equal(analytics.weakestDimensions.length, 0);
    assert.equal(analytics.practiceStreakDays, 0);
    assert.equal(analytics.activeDaysTotal, 0);
    assert.ok(analytics.dimensionAverages.every((d) => d.averageScore === null && d.assessedCount === 0));
    assert.ok(analytics.milestones.every((m) => m.earned === false));
  });

  test("2. Computes chronological score trend, excludes insufficient_evidence dims, tracks UTC streak, and surfaces weak Skills Lab targets", () => {
    const now = new Date("2026-11-25T12:00:00.000Z");
    const sessions: GDPerformanceSessionRecord[] = [
      {
        sessionId: "gd_s2",
        topicTitle: "AI Inference Cost vs Latency",
        format: "competitive",
        difficulty: "intermediate",
        overallScore: 80,
        hiringVerdict: "HIRE",
        createdAt: "2026-11-25T09:00:00.000Z",
        dimensions: [
          {
            dimension: "communication_clarity",
            label: "Clarity & Articulation",
            weight: 0.15,
            score: 84,
            verdict: "proficient",
            feedback: "Concise framing.",
            citedExcerpts: []
          },
          {
            dimension: "critical_thinking",
            label: "Critical Thinking",
            weight: 0.1,
            score: 62,
            verdict: "developing",
            feedback: "Needs stronger counter-examples.",
            citedExcerpts: []
          }
        ]
      },
      {
        sessionId: "gd_s1",
        topicTitle: "Zero-Downtime Migrations",
        format: "technical_business",
        difficulty: "beginner",
        overallScore: 68,
        hiringVerdict: "LEAN_HIRE",
        createdAt: "2026-11-24T15:00:00.000Z",
        dimensions: [
          {
            dimension: "communication_clarity",
            label: "Clarity & Articulation",
            weight: 0.15,
            score: 72,
            verdict: "proficient",
            feedback: "Readable structure.",
            citedExcerpts: []
          },
          {
            dimension: "critical_thinking",
            label: "Critical Thinking",
            weight: 0.1,
            score: 0,
            verdict: "insufficient_evidence",
            feedback: "Did not challenge peer claim.",
            citedExcerpts: []
          }
        ]
      }
    ];

    const analytics = computeGDPerformanceAnalytics({
      sessions,
      skillsProgress: [
        {
          userId: "u-streak",
          trackId: "skill-opening-frame",
          attemptCount: 2,
          bestScore: 88,
          latestScore: 88,
          completedAt: "2026-11-23T18:00:00.000Z",
          updatedAt: "2026-11-23T18:00:00.000Z"
        }
      ],
      warningHistoryCount: 0,
      suspended: false,
      now
    });

    // Chronological order: Nov 24 (68) -> Nov 25 (80)
    assert.equal(analytics.completedSessionsCount, 2);
    assert.equal(analytics.compositeAverage, 74);
    assert.equal(analytics.peakScore, 80);
    assert.equal(analytics.latestScore, 80);
    assert.equal(analytics.scoreDelta, 12);
    assert.equal(analytics.scoreTrend[0].sessionId, "gd_s1");
    assert.equal(analytics.scoreTrend[1].sessionId, "gd_s2");

    // Excluded insufficient_evidence from Round 1 for critical_thinking -> avg = 62 (1 assessed), NOT (0+62)/2 = 31!
    const clarity = analytics.dimensionAverages.find((d) => d.dimension === "communication_clarity")!;
    const critical = analytics.dimensionAverages.find((d) => d.dimension === "critical_thinking")!;
    assert.equal(clarity.averageScore, 78);
    assert.equal(clarity.assessedCount, 2);
    assert.equal(critical.averageScore, 62);
    assert.equal(critical.assessedCount, 1);

    // Weakest dimension maps directly to Skills Lab counter-arguments track
    assert.equal(analytics.weakestDimensions.length, 1);
    assert.equal(analytics.weakestDimensions[0].recommendedSkillTrackId, "skill-constructive-counter");

    // 3 consecutive days: Nov 25, Nov 24, Nov 23
    assert.equal(analytics.practiceStreakDays, 3);
    assert.equal(analytics.activeDaysTotal, 3);

    // Streak breaks cleanly if gap > 1 day
    const stale = calculateGDPracticeStreak(["2026-11-20T10:00:00.000Z"], now);
    assert.equal(stale.practiceStreakDays, 0);
    assert.equal(stale.activeDaysTotal, 1);
  });

  test("3. /api/gd/sessions rejects unauthenticated calls and serves analytics + no-store for authenticated student", async () => {
    const unauth = await sessionsGet(new Request("http://localhost/api/gd/sessions"));
    assert.equal(unauth.status, 401);

    const student = createUser({
      email: `perf_student_${Date.now()}@cognalyze.test`,
      name: "Perf Student",
      password: "Password123!",
      role: "student"
    });
    const session = createSession(student.id, "student");

    const gdSession: GDSessionData = {
      sessionId: `gd_perf_${Date.now()}`,
      userId: student.id,
      topicId: "topic-perf-1",
      topicTitle: "Distributed Caching Consistency Trade-Offs",
      format: "technical_business",
      difficulty: "intermediate",
      targetRole: "Backend Engineer",
      lifecycleState: "COMPLETED",
      currentStage: "EVALUATION_READY",
      stageTimeRemainingSeconds: 0,
      totalDurationSeconds: 600,
      isFriendsRoom: false,
      participants: [],
      activeSpeakerId: null,
      transcripts: [],
      moderationIncidents: [],
      studentWarningCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      evaluationReport: {
        sessionId: "gd_perf",
        studentId: student.id,
        studentName: "Perf Student",
        topicTitle: "Distributed Caching Consistency Trade-Offs",
        format: "technical_business",
        difficulty: "intermediate",
        totalDurationSeconds: 600,
        overallScore: 81,
        hiringVerdict: "HIRE",
        verdictSummary: "Solid architectural reasoning.",
        dimensions: [
          {
            dimension: "communication_clarity",
            label: "Clarity & Articulation",
            weight: 0.15,
            score: 82,
            verdict: "proficient",
            feedback: "Clear opening.",
            citedExcerpts: []
          }
        ],
        strongestContributions: [],
        weakestContributions: [],
        missedOpportunities: [],
        unsupportedClaims: [],
        speakingTimeAnalysis: {
          studentSpeakingTimeSeconds: 90,
          studentTurnCount: 3,
          speakingPercentage: 25,
          groupAverageTurnCount: 3,
          dominanceRatio: "balanced_optimal"
        },
        moderationHistory: [],
        targetedImprovementPlan: ["Quantify p99 tail latency earlier."],
        nextRecommendedPracticeTopic: "Consensus in Geo-Replicated Databases",
        createdAt: new Date().toISOString()
      }
    };

    await saveGDSessionAsync(gdSession);

    const res = await sessionsGet(
      new Request("http://localhost/api/gd/sessions", {
        headers: { cookie: `cognalyze_session=${session.token}` }
      })
    );
    assert.equal(res.status, 200);
    assert.ok((res.headers.get("cache-control") || "").includes("no-store"));
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.sessions.length, 1);
    assert.equal(body.analytics.completedSessionsCount, 1);
    assert.equal(body.analytics.compositeAverage, 81);
    assert.equal(body.analytics.practiceStreakDays >= 1, true);
    assert.ok(Array.isArray(body.analytics.dimensionAverages));
    assert.ok(body.conductStanding);
  });
});
