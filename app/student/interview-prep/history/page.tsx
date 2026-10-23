"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { getSessionHistory, InterviewSession } from "@/lib/interview-session-store";
import { useTheme } from "@/components/ThemeProvider";

export default function InterviewPrepHistoryPage() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "mock_interview" | "assessment_arena">("all");
  const [selectedSessionReport, setSelectedSessionReport] = useState<InterviewSession | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setLoading(true);
      let candidateId = "";
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.authenticated && sessionData.user?.id) {
            candidateId = sessionData.user.id;
          }
        }
      } catch (err) {
        console.warn("Session check error in interview history:", err);
      }

      if (!candidateId && typeof window !== "undefined") {
        candidateId = localStorage.getItem("cognalyze_student_id") || "";
      }

      const data = candidateId ? await getSessionHistory(candidateId) : await getSessionHistory();
      if (isMounted) {
        setSessions(data);
        setLoading(false);
      }
    }
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (selectedFilter === "all") return true;
    return s.session_type === selectedFilter;
  });

  // Calculate aggregated stats
  const totalSessions = sessions.length;
  const avgScore =
    totalSessions > 0
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#07111F" : "#F6F5F1",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      <AppNav role="student" />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 24px 60px" }}>
        {/* Navigation & Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Link
                href="/interview"
                style={{
                  fontSize: 12,
                  color: isDark ? "#3478F6" : "#356AE6",
                  textDecoration: "none",
                  backgroundColor: isDark ? "#13243A" : "#EFF4FE",
                  border: `1px solid ${isDark ? "#223750" : "#D2E0FB"}`,
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                ← Back to Mock Interview
              </Link>
              <span style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085" }}>
                Session History & Performance Telemetry
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.5rem, 2.5vw, 1.9rem)",
                fontWeight: 800,
                margin: 0,
                color: isDark ? "#F2F6FC" : "#162A43",
                letterSpacing: "-0.4px",
              }}
            >
              📊 Mock Interview & Practice History
            </h1>
            <p style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085", margin: "8px 0 0", maxWidth: 680, lineHeight: 1.5 }}>
              Track your interview performance, answer depth curves, and verified competencies across personalized mock interviews and proctored technical evaluations.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/interview"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: "#356AE6",
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 2px 6px rgba(53, 106, 230, 0.25)",
              }}
            >
              + New Mock Interview
            </Link>
            <Link
              href="/skill-practice"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                color: isDark ? "#F2F6FC" : "#162A43",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⚡ Skill Practice Hub
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div
            style={{
              padding: "20px",
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 14,
              boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.2)" : "0 1px 3px rgba(16, 24, 40, 0.04)",
            }}
          >
            <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              TOTAL COMPLETED SESSIONS
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: isDark ? "#F2F6FC" : "#162A43" }}>{totalSessions}</div>
            <div style={{ fontSize: 12, color: isDark ? "#7E8FA6" : "#98A2B3", marginTop: 4 }}>
              Persisted against your authenticated candidate profile
            </div>
          </div>

          <div
            style={{
              padding: "20px",
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 14,
              boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.2)" : "0 1px 3px rgba(16, 24, 40, 0.04)",
            }}
          >
            <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              CUMULATIVE BENCHMARK SCORE
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: avgScore >= 75 ? "#2E7D5B" : avgScore >= 50 ? "#B7791F" : "#C24141" }}>
              {avgScore} <span style={{ fontSize: 16, color: isDark ? "#7E8FA6" : "#98A2B3" }}>/ 100</span>
            </div>
            <div style={{ fontSize: 12, color: isDark ? "#7E8FA6" : "#98A2B3", marginTop: 4 }}>
              Mean evaluation across all adaptive rounds
            </div>
          </div>

          <div
            style={{
              padding: "20px",
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 14,
              boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.2)" : "0 1px 3px rgba(16, 24, 40, 0.04)",
            }}
          >
            <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              ANSWER DEPTH PROFILE
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", marginTop: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#2E7D5B" }}>
                {totalStrong} <span style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085" }}>Strong</span>
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#B7791F" }}>
                {totalAdequate} <span style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085" }}>Adequate</span>
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#C24141" }}>
                {totalShallow} <span style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085" }}>Shallow</span>
              </span>
            </div>
            <div style={{ fontSize: 12, color: isDark ? "#7E8FA6" : "#98A2B3", marginTop: 6 }}>
              Probes triggered automatically on shallow answers
            </div>
          </div>
        </div>

        {/* Weak Topics Warning Banner */}
        {topWeakTopics.length > 0 && (
          <div
            style={{
              padding: "14px 18px",
              backgroundColor: isDark ? "rgba(183,121,31,0.15)" : "#FEF7ED",
              border: `1px solid ${isDark ? "#F8D8A7" : "#F8D8A7"}`,
              borderRadius: 12,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#B7791F", marginBottom: 2 }}>
                ⚠️ FREQUENTLY PROBED TOPICS IN PRIOR SESSIONS
              </div>
              <div style={{ fontSize: 12, color: isDark ? "#F2F6FC" : "#162A43" }}>
                Topics requiring depth refinement: <strong>{topWeakTopics.map(([t]) => t).join(", ")}</strong>. Drill these in the Skill Practice Hub.
              </div>
            </div>
            <Link
              href="/skill-practice"
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                backgroundColor: "#356AE6",
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Drill Weak Topics ➔
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["all", "mock_interview", "assessment_arena"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: selectedFilter === filter ? "#356AE6" : isDark ? "#223750" : "#E4E1DA",
                backgroundColor: selectedFilter === filter ? "#356AE6" : isDark ? "#0E1B2E" : "#FFFFFF",
                color: selectedFilter === filter ? "#FFFFFF" : isDark ? "#B6C4D6" : "#667085",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {filter === "all" ? "All History" : filter === "mock_interview" ? "Mock Interviews" : "Assessment Arenas"}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: isDark ? "#B6C4D6" : "#667085", fontSize: 14 }}>
            Loading preparation history...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              borderRadius: 16,
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: isDark ? "#F2F6FC" : "#162A43" }}>
              No Preparation Sessions Recorded Yet
            </h3>
            <p style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085", maxWidth: 450, margin: "0 auto 20px", lineHeight: 1.5 }}>
              Complete your first personalized mock interview or assessment arena to establish your verified interview trajectory.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <Link
                href="/interview"
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Start Mock Interview
              </Link>
              <Link
                href="/skill-practice"
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  backgroundColor: isDark ? "#13243A" : "#F6F5F1",
                  border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  color: isDark ? "#F2F6FC" : "#162A43",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Go to Skill Practice Hub
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredSessions.map((session) => {
              const isArena = session.session_type === "assessment_arena";
              const scoreBg =
                session.overall_score >= 75
                  ? isDark
                    ? "rgba(46,125,91,0.2)"
                    : "#EAF4EE"
                  : session.overall_score >= 50
                  ? isDark
                    ? "rgba(183,121,31,0.2)"
                    : "#FEF7ED"
                  : isDark
                  ? "rgba(194,65,65,0.2)"
                  : "#FDF2F2";
              const scoreBorder = session.overall_score >= 75 ? "#2E7D5B" : session.overall_score >= 50 ? "#B7791F" : "#C24141";
              const scoreText = session.overall_score >= 75 ? "#2E7D5B" : session.overall_score >= 50 ? "#B7791F" : "#C24141";

              return (
                <div
                  key={session.id}
                  style={{
                    padding: "16px 20px",
                    backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                    borderRadius: 14,
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
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: 5,
                          backgroundColor: isArena ? (isDark ? "rgba(194,65,65,0.2)" : "#FDF2F2") : isDark ? "rgba(52,120,246,0.15)" : "#EFF4FE",
                          color: isArena ? "#C24141" : isDark ? "#3478F6" : "#356AE6",
                          border: `1px solid ${isArena ? "#F8C8C8" : isDark ? "#223750" : "#D2E0FB"}`,
                        }}
                      >
                        {isArena ? "🛡️ Assessment Arena" : "🎙️ Mock Interview"}
                      </span>
                      {session.interview_type && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: 5,
                            backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                            color: isDark ? "#3478F6" : "#356AE6",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {session.interview_type}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 5,
                          backgroundColor: isDark ? "#13243A" : "#F6F5F1",
                          color: isDark ? "#F2F6FC" : "#162A43",
                          border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                          fontWeight: 600,
                        }}
                      >
                        {session.experience_mode || "Fresher"}
                      </span>
                      <span style={{ fontSize: 11, color: isDark ? "#7E8FA6" : "#667085" }}>
                        {new Date(session.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: isDark ? "#F2F6FC" : "#162A43" }}>
                      {session.target_role}
                    </h3>
                    <div style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", marginBottom: 8 }}>
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
                              backgroundColor: isDark ? "#13243A" : "#F6F5F1",
                              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                              color: isDark ? "#B6C4D6" : "#162A43",
                            }}
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right side stats & action */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Answer distribution */}
                    {session.answer_distribution && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: isDark ? "#7E8FA6" : "#667085", marginBottom: 4, fontWeight: 600 }}>
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
                      </div>
                    )}

                    {/* Overall Score */}
                    <div
                      style={{
                        minWidth: 60,
                        height: 60,
                        borderRadius: 10,
                        backgroundColor: scoreBg,
                        border: `1px solid ${scoreBorder}`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 800, color: scoreText, lineHeight: 1 }}>
                        {session.overall_score}
                      </div>
                      <div style={{ fontSize: 9, color: isDark ? "#7E8FA6" : "#667085", marginTop: 2 }}>/ 100</div>
                    </div>

                    {/* View Report Button */}
                    {session.report && (
                      <button
                        type="button"
                        onClick={() => setSelectedSessionReport(session)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 7,
                          backgroundColor: isDark ? "#13243A" : "#EFF4FE",
                          border: `1px solid ${isDark ? "#223750" : "#D2E0FB"}`,
                          color: isDark ? "#3478F6" : "#356AE6",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        View Report ➔
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for viewing past report */}
        {selectedSessionReport && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.65)",
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 820,
                maxHeight: "90vh",
                overflowY: "auto",
                backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 16,
                padding: "24px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", textTransform: "uppercase" }}>
                    SAVED EVALUATION REPORT
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 0", color: isDark ? "#F2F6FC" : "#162A43" }}>
                    {selectedSessionReport.target_role} · {selectedSessionReport.target_company || "FAANG / Tier 1"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSessionReport(null)}
                  style={{
                    background: "transparent",
                    border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                    borderRadius: 8,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontSize: 13,
                    color: isDark ? "#B6C4D6" : "#667085",
                  }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ padding: "12px 16px", borderRadius: 10, backgroundColor: isDark ? "#13243A" : "#FAF9F6", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", marginBottom: 4 }}>
                  {selectedSessionReport.report?.headline || `Evaluation: ${selectedSessionReport.target_role}`}
                </div>
                <div style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.5 }}>
                  {selectedSessionReport.report?.overview || "Completed technical evaluation session."}
                </div>
              </div>

              {selectedSessionReport.report?.hire_reasons?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", marginBottom: 4 }}>
                    ✓ DEMONSTRATED STRENGTHS
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 12, color: isDark ? "#F2F6FC" : "#17191C" }}>
                    {selectedSessionReport.report.hire_reasons.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSessionReport.report?.no_hire_reasons?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", marginBottom: 4 }}>
                    ⚠️ CRITICAL GAPS & REFINEMENT AREAS
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 12, color: isDark ? "#F2F6FC" : "#17191C" }}>
                    {selectedSessionReport.report.no_hire_reasons.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSessionReport.transcript && selectedSessionReport.transcript.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#3478F6" : "#356AE6", marginBottom: 8, textTransform: "uppercase" }}>
                    TURN TRANSCRIPT AUDIT
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                    {selectedSessionReport.transcript.map((t, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          backgroundColor: t.role === "assistant" ? (isDark ? "#13243A" : "#F6F5F1") : isDark ? "rgba(52,120,246,0.1)" : "#EFF4FE",
                          fontSize: 11.5,
                          lineHeight: 1.4,
                        }}
                      >
                        <strong>{t.role === "assistant" ? "Interviewer" : "Candidate"}:</strong> {t.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
