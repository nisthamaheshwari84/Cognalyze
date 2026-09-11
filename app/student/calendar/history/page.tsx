"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  event_type: string;
  fit_score: number;
  application_stage: string | null;
  outcome: "Hit" | "Missed" | "Completed" | "Dismissed" | "Upcoming";
  is_high_fit: boolean;
  notes: string;
  opportunity_id?: string;
}

interface Metrics {
  high_fit_passed_deadlines: number;
  high_fit_applied_before_deadline: number;
  percentage_applied_before_deadline: number;
  headline_stat: string;
}

export default function CalendarHistoryPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "hit" | "missed" | "completed">("all");

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    loadHistory(stored);
  }, []);

  const loadHistory = async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/calendar/history?candidateId=${cId}`);
      const data = await res.json();
      if (data.metrics) {
        setMetrics(data.metrics);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === "hit") return item.outcome === "Hit";
    if (filter === "missed") return item.outcome === "Missed";
    if (filter === "completed") return item.outcome === "Completed";
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f1f5f9", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "16px 28px"
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/student/calendar" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>
                ← Season Calendar
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#38bdf8", fontSize: 13, fontWeight: 600 }}>Retrospective Log</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0", letterSpacing: "-0.5px" }}>
              📊 Placement Season Retrospective Log
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
              Verifiable audit trail of hit vs missed deadlines, completed practice sessions, and execution accuracy.
            </p>
          </div>

          <Link
            href="/student/calendar"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              backgroundColor: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              color: "#38bdf8",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            📅 Back to Live Calendar
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Metric Banner: Exact Calculation */}
        {metrics && (
          <div
            style={{
              padding: "24px 28px",
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              marginBottom: 32,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
              alignItems: "center"
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  padding: "4px 8px",
                  borderRadius: 6,
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.4)"
                }}
              >
                EXECUTION DISCIPLINE STAT
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "10px 0 6px", color: "#ffffff" }}>
                {metrics.headline_stat}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
                Computed directly from real application submissions versus opportunity deadlines. Zero estimation or rounded vanity metrics.
              </p>
            </div>

            <div style={{ display: "flex", gap: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 12,
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  textAlign: "center",
                  minWidth: 120
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color: "#38bdf8" }}>
                  {metrics.percentage_applied_before_deadline}%
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  Hit Rate
                </div>
              </div>

              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 12,
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  textAlign: "center",
                  minWidth: 120
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981" }}>
                  {metrics.high_fit_applied_before_deadline} / {metrics.high_fit_passed_deadlines}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  High-Fit Deadlines
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All History (${history.length})` },
            { id: "hit", label: `✅ Deadlines Hit (${history.filter(h => h.outcome === "Hit").length})` },
            { id: "missed", label: `❌ Deadlines Missed (${history.filter(h => h.outcome === "Missed").length})` },
            { id: "completed", label: `⚡ Practice Completed (${history.filter(h => h.outcome === "Completed").length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                backgroundColor: filter === tab.id ? "#38bdf8" : "rgba(30, 41, 59, 0.6)",
                color: filter === tab.id ? "#090d16" : "#94a3b8",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: filter === tab.id ? 700 : 500,
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Historical Log Table / Cards */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            overflow: "hidden"
          }}
        >
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Timeline Events & Outcomes</h3>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Showing {filteredHistory.length} events</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredHistory.map((item, idx) => {
              const isHit = item.outcome === "Hit";
              const isMissed = item.outcome === "Missed";
              const isCompleted = item.outcome === "Completed";
              const isDismissed = item.outcome === "Dismissed";

              const badgeColor = isHit ? "#34d399" : isMissed ? "#f87171" : isCompleted ? "#a855f7" : "#94a3b8";
              const badgeBg = isHit
                ? "rgba(16, 185, 129, 0.15)"
                : isMissed
                ? "rgba(239, 68, 68, 0.15)"
                : isCompleted
                ? "rgba(168, 85, 247, 0.15)"
                : "rgba(148, 163, 184, 0.15)";

              return (
                <div
                  key={`${item.id}-${idx}`}
                  style={{
                    padding: "18px 24px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeColor}33`
                        }}
                      >
                        {item.outcome.toUpperCase()}
                      </span>

                      {item.is_high_fit && (
                        <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 600 }}>
                          ⭐ High Fit ({item.fit_score}% match)
                        </span>
                      )}

                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        📅 Date: {item.date}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", marginBottom: 2 }}>
                      {item.title}
                    </div>

                    <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                      {item.notes}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {item.application_stage && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 6,
                          backgroundColor: "rgba(30, 41, 59, 0.8)",
                          color: "#cbd5e1",
                          border: "1px solid rgba(255, 255, 255, 0.08)"
                        }}
                      >
                        Stage: {item.application_stage}
                      </span>
                    )}

                    {item.opportunity_id && (
                      <Link
                        href={`/student/opportunities/${item.opportunity_id}`}
                        style={{
                          fontSize: 12,
                          color: "#38bdf8",
                          textDecoration: "none",
                          fontWeight: 600
                        }}
                      >
                        View Opportunity →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredHistory.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
                No events found matching the selected filter.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
