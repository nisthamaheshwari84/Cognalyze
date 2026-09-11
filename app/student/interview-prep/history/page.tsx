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
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 24px" }}>
        {/* Navigation & Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Link
                href="/student/interview-prep"
                style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", background: "rgba(99,102,241,0.15)", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}
              >
                ← Back to Prep Arenas
              </Link>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Session History & Evidence Telemetry</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              📊 Interview & Assessment Prep History
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 650, lineHeight: 1.5 }}>
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
                borderRadius: 10,
                background: "linear-gradient(135deg,#10b981,#059669)",
                color: "white",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
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
                borderRadius: 10,
                background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "white",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              + Assessment Arena
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              TOTAL COMPLETED SESSIONS
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "white" }}>{totalSessions}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              Across adaptive mock rounds & timed arenas
            </div>
          </div>

          <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              CUMULATIVE BENCHMARK SCORE
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: avgScore >= 75 ? "#34d399" : avgScore >= 50 ? "#fbbf24" : "#f87171" }}>
              {avgScore} <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>/ 100</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              Mean evaluation across all questions
            </div>
          </div>

          <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              ANSWER DEPTH PROFILE
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginTop: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#34d399" }}>{totalStrong} <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Strong</span></span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#fbbf24" }}>{totalAdequate} <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Adequate</span></span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#f97316" }}>{totalShallow} <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Shallow</span></span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
              Shallow answers trigger automated deep-probe followups
            </div>
          </div>
        </div>

        {/* Weak Topics Warning Banner */}
        {topWeakTopics.length > 0 && (
          <div style={{ padding: "1rem 1.25rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24", marginBottom: 2 }}>
                ⚠️ FREQUENTLY PROBED TOPICS IN PRIOR SESSIONS
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                These topics had consecutive shallow answers: {topWeakTopics.map(([t]) => t).join(", ")}. Future rounds will prioritize these.
              </div>
            </div>
            <Link
              href="/student/practice-interview"
              style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(245,158,11,0.2)", color: "#fbbf24", textDecoration: "none", fontSize: 12, fontWeight: 700 }}
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
                borderRadius: 8,
                border: selectedFilter === filter ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                background: selectedFilter === filter ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.02)",
                color: selectedFilter === filter ? "white" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {filter === "all" ? "All History" : filter === "mock_interview" ? "Mock Interviews" : "Assessment Arenas"}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#94a3b8", fontSize: 14 }}>
            Loading preparation history...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>No Preparation Sessions Recorded Yet</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", maxWidth: 450, margin: "0 auto 20px", lineHeight: 1.5 }}>
              Complete your first adaptive mock interview or proctored technical assessment to establish your preparation trajectory.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <Link
                href="/student/practice-interview"
                style={{ padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700 }}
              >
                Start Adaptive Interview
              </Link>
              <Link
                href="/student/assessment-arena"
                style={{ padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700 }}
              >
                Launch Assessment Arena
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredSessions.map((session) => {
              const isArena = session.session_type === "assessment_arena";
              const scoreColor = session.overall_score >= 75 ? "#34d399" : session.overall_score >= 50 ? "#fbbf24" : "#f87171";
              return (
                <div
                  key={session.id}
                  style={{
                    padding: "1.25rem 1.5rem",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: isArena ? "rgba(244,63,94,0.15)" : "rgba(16,185,129,0.15)",
                          color: isArena ? "#f43f5e" : "#34d399",
                        }}
                      >
                        {isArena ? "🛡️ Assessment Arena" : "👔 Mock Interview"}
                      </span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "#a5b4fc", fontWeight: 700 }}>
                        {session.experience_mode || "Fresher"}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {new Date(session.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "white" }}>
                      {session.target_role}
                    </h3>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                      Target: {session.target_company || "FAANG / Tier 1 Standard"}
                    </div>

                    {session.topics_covered && session.topics_covered.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {session.topics_covered.map((topic, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: "rgba(255,255,255,0.04)",
                              color: "rgba(255,255,255,0.7)",
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
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                          ANSWER QUALITY
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>
                            {session.answer_distribution.strong || 0} strong
                          </span>
                          <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                            {session.answer_distribution.adequate || 0} adeq
                          </span>
                          <span style={{ fontSize: 11, color: "#f97316", fontWeight: 700 }}>
                            {session.answer_distribution.shallow || 0} shallow
                          </span>
                        </div>
                        {session.security_flags && (session.security_flags.tab_switches > 0 || session.security_flags.face_violations > 0) && (
                          <div style={{ fontSize: 10, color: "#f87171", marginTop: 4 }}>
                            ⚠️ {session.security_flags.tab_switches} tab switch(es)
                          </div>
                        )}
                      </div>
                    )}

                    {/* Overall Score */}
                    <div
                      style={{
                        minWidth: 70,
                        height: 70,
                        borderRadius: 16,
                        background: `rgba(${session.overall_score >= 75 ? "16,185,129" : session.overall_score >= 50 ? "245,158,11" : "239,68,68"},0.12)`,
                        border: `1.5px solid ${scoreColor}40`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                        {session.overall_score}
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>/ 100</div>
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
