"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { getSessionHistory, InterviewSession } from "@/lib/interview-session-store";

export default function InterviewPrepHistoryPage() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "mock_interview" | "assessment_arena">("all");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      const candidateId = typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") || "student-demo" : "student-demo";
      const data = await getSessionHistory(candidateId);
      setSessions(data);
      setLoading(false);
    }
    loadHistory();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (selectedFilter === "all") return true;
    return s.session_type === selectedFilter;
  });

  // Calculate aggregated stats
  const totalSessions = sessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.overall_score || 0), 0) / totalSessions)
    : 0;

  const totalStrong = sessions.reduce((acc, s) => acc + (s.answer_distribution?.strong || 0), 0);
  const totalAdequate = sessions.reduce((acc, s) => acc + (s.answer_distribution?.adequate || 0), 0);
  const totalShallow = sessions.reduce((acc, s) => acc + (s.answer_distribution?.shallow || 0), 0);

  // Aggregated weak topics
  const weakTopicCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    (s.weak_topics_identified || []).forEach((t) => {
      const clean = t.trim();
      if (clean) weakTopicCounts[clean] = (weakTopicCounts[clean] || 0) + 1;
    });
  });
  const topWeakTopics = Object.entries(weakTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "Inter, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 24px" }}>
        {/* Navigation & Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Link
                href="/student/interview-prep"
                style={{ fontSize: 12, color: "#356AE6", textDecoration: "none", backgroundColor: "#EFF4FE", border: "1px solid #D2E0FB", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}
              >
                ← Back to Prep Arenas
              </Link>
              <span style={{ fontSize: 12, color: "#667085" }}>Session History & Evidence Telemetry</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.5rem, 2.5vw, 1.9rem)", fontWeight: 700, margin: 0, color: "#162A43", letterSpacing: "-0.4px" }}>
              📊 Interview & Assessment Prep History
            </h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "8px 0 0", maxWidth: 680, lineHeight: 1.5 }}>
              Track your interview performance, answer depth curves, and areas requiring follow-up focus across mock interviews and proctored arenas.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/student/practice-interview"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 7,
                backgroundColor: "#2E7D5B",
                color: "white",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 2px 6px rgba(46, 125, 91, 0.2)"
              }}
            >
              + New Practice Round
            </Link>
            <Link
              href="/student/assessment-arena"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 7,
                backgroundColor: "#356AE6",
                color: "white",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 2px 6px rgba(53, 106, 230, 0.2)"
              }}
            >
              + Assessment Arena
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div style={{ padding: "20px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              TOTAL COMPLETED SESSIONS
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#162A43" }}>{totalSessions}</div>
            <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
              Across adaptive mock rounds & timed arenas
            </div>
          </div>

          <div style={{ padding: "20px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              CUMULATIVE BENCHMARK SCORE
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: avgScore >= 75 ? "#2E7D5B" : avgScore >= 50 ? "#B7791F" : "#C24141" }}>
              {avgScore} <span style={{ fontSize: 16, color: "#98A2B3" }}>/ 100</span>
            </div>
            <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
              Mean evaluation across all questions
            </div>
          </div>

          <div style={{ padding: "20px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              ANSWER DEPTH PROFILE
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", marginTop: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#2E7D5B" }}>{totalStrong} <span style={{ fontSize: 11, color: "#667085" }}>Strong</span></span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#B7791F" }}>{totalAdequate} <span style={{ fontSize: 11, color: "#667085" }}>Adequate</span></span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#C24141" }}>{totalShallow} <span style={{ fontSize: 11, color: "#667085" }}>Shallow</span></span>
            </div>
            <div style={{ fontSize: 12, color: "#667085", marginTop: 6 }}>
              Shallow answers trigger automated deep-probe followups
            </div>
          </div>
        </div>

        {/* Weak Topics Warning Banner */}
        {topWeakTopics.length > 0 && (
          <div style={{ padding: "14px 18px", backgroundColor: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 10, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#B7791F", marginBottom: 2 }}>
                ⚠️ FREQUENTLY PROBED TOPICS IN PRIOR SESSIONS
              </div>
              <div style={{ fontSize: 12, color: "#162A43" }}>
                These topics had consecutive shallow answers: <strong>{topWeakTopics.map(([t]) => t).join(", ")}</strong>. Future rounds will prioritize these.
              </div>
            </div>
            <Link
              href="/student/practice-interview"
              style={{ padding: "6px 14px", borderRadius: 7, backgroundColor: "#356AE6", color: "#ffffff", textDecoration: "none", fontSize: 12, fontWeight: 600 }}
            >
              Drill Weak Topics ➔
            </Link>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["all", "mock_interview", "assessment_arena"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                border: "1px solid",
                borderColor: selectedFilter === filter ? "#356AE6" : "#E4E1DA",
                backgroundColor: selectedFilter === filter ? "#356AE6" : "#FFFFFF",
                color: selectedFilter === filter ? "#ffffff" : "#667085",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)"
              }}
            >
              {filter === "all" ? "All History" : filter === "mock_interview" ? "Mock Interviews" : "Assessment Arenas"}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#667085", fontSize: 14 }}>
            Loading preparation history...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "#162A43" }}>No Preparation Sessions Recorded Yet</h3>
            <p style={{ fontSize: 13, color: "#667085", maxWidth: 450, margin: "0 auto 20px", lineHeight: 1.5 }}>
              Complete your first adaptive mock interview or proctored technical assessment to establish your preparation trajectory.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <Link
                href="/student/practice-interview"
                style={{ padding: "8px 18px", borderRadius: 7, backgroundColor: "#2E7D5B", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
              >
                Start Adaptive Interview
              </Link>
              <Link
                href="/student/assessment-arena"
                style={{ padding: "8px 18px", borderRadius: 7, backgroundColor: "#356AE6", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
              >
                Launch Assessment Arena
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredSessions.map((session) => {
              const isArena = session.session_type === "assessment_arena";
              const scoreBg = session.overall_score >= 75 ? "#EAF4EE" : session.overall_score >= 50 ? "#FEF7ED" : "#FDF2F2";
              const scoreBorder = session.overall_score >= 75 ? "#C8E4D3" : session.overall_score >= 50 ? "#F8D8A7" : "#F8C8C8";
              const scoreText = session.overall_score >= 75 ? "#2E7D5B" : session.overall_score >= 50 ? "#B7791F" : "#C24141";

              return (
                <div
                  key={session.id}
                  style={{
                    padding: "16px 20px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                    boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
                  }}
                >
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: 5,
                          backgroundColor: isArena ? "#FDF2F2" : "#EFF4FE",
                          color: isArena ? "#C24141" : "#356AE6",
                          border: `1px solid ${isArena ? "#F8C8C8" : "#D2E0FB"}`
                        }}
                      >
                        {isArena ? "🛡️ Assessment Arena" : "👔 Mock Interview"}
                      </span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, backgroundColor: "#F6F5F1", color: "#162A43", border: "1px solid #E4E1DA", fontWeight: 600 }}>
                        {session.experience_mode || "Fresher"}
                      </span>
                      <span style={{ fontSize: 11, color: "#667085" }}>
                        {new Date(session.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: "#162A43" }}>
                      {session.target_role}
                    </h3>
                    <div style={{ fontSize: 12, color: "#667085", marginBottom: 8 }}>
                      Target: {session.target_company || "FAANG / Tier 1 Standard"}
                    </div>

                    {session.topics_covered && session.topics_covered.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {session.topics_covered.map((topic, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 4,
                              backgroundColor: "#F6F5F1",
                              border: "1px solid #E4E1DA",
                              color: "#162A43",
                            }}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right side stats */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    {/* Answer distribution */}
                    {session.answer_distribution && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#667085", marginBottom: 4, fontWeight: 600 }}>
                          ANSWER QUALITY
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>
                            {session.answer_distribution.strong || 0} strong
                          </span>
                          <span style={{ fontSize: 11, color: "#B7791F", fontWeight: 700 }}>
                            {session.answer_distribution.adequate || 0} adeq
                          </span>
                          <span style={{ fontSize: 11, color: "#C24141", fontWeight: 700 }}>
                            {session.answer_distribution.shallow || 0} shallow
                          </span>
                        </div>
                        {session.security_flags && (session.security_flags.tab_switches > 0 || session.security_flags.face_violations > 0) && (
                          <div style={{ fontSize: 10, color: "#C24141", marginTop: 4, fontWeight: 600 }}>
                            ⚠️ {session.security_flags.tab_switches} tab switch(es)
                          </div>
                        )}
                      </div>
                    )}

                    {/* Overall Score */}
                    <div
                      style={{
                        minWidth: 64,
                        height: 64,
                        borderRadius: 10,
                        backgroundColor: scoreBg,
                        border: `1px solid ${scoreBorder}`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 700, color: scoreText, lineHeight: 1 }}>
                        {session.overall_score}
                      </div>
                      <div style={{ fontSize: 10, color: "#667085", marginTop: 2 }}>/ 100</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
