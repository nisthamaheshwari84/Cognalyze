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
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "hit" | "missed" | "completed">("all");

  useEffect(() => {
    let isMounted = true;
    async function init() {
      let activeCId = "";
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.authenticated && sessionData.user?.id) {
            activeCId = sessionData.user.id;
          }
        }
      } catch (err) {
        console.warn("Session check error in calendar history:", err);
      }

      if (!activeCId && typeof window !== "undefined") {
        activeCId = localStorage.getItem("cognalyze_student_id") || "";
      }

      if (isMounted) {
        setCandidateId(activeCId);
        loadHistory(activeCId);
      }
    }
    init();
    return () => { isMounted = false; };
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
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #E4E1DA",
          backgroundColor: "#FFFFFF",
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "16px 28px"
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/student/calendar" style={{ color: "#667085", textDecoration: "none", fontSize: 13 }}>
                ← Season Calendar
              </Link>
              <span style={{ color: "#98A2B3" }}>/</span>
              <span style={{ color: "#356AE6", fontSize: 13, fontWeight: 600 }}>Retrospective Log</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0", color: "#162A43", letterSpacing: "-0.5px" }}>
              📊 Placement Season Retrospective Log
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667085" }}>
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
              borderRadius: 7,
              backgroundColor: "#EFF4FE",
              border: "1px solid #D2E0FB",
              color: "#356AE6",
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
              borderRadius: 10,
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              boxShadow: "0 1px 3px rgba(16,24,40,0.04)",
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
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  padding: "4px 8px",
                  borderRadius: 5,
                  backgroundColor: "#EAF4EE",
                  color: "#2E7D5B",
                  border: "1px solid #C8E4D3"
                }}
              >
                EXECUTION DISCIPLINE STAT
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "10px 0 6px", color: "#162A43" }}>
                {metrics.headline_stat}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#667085", lineHeight: 1.5 }}>
                Computed directly from real application submissions versus opportunity deadlines. Zero estimation or rounded vanity metrics.
              </p>
            </div>

            <div style={{ display: "flex", gap: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 8,
                  backgroundColor: "#F6F5F1",
                  border: "1px solid #E4E1DA",
                  textAlign: "center",
                  minWidth: 120
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color: "#356AE6" }}>
                  {metrics.percentage_applied_before_deadline}%
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 2, fontWeight: 600 }}>
                  Hit Rate
                </div>
              </div>

              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 8,
                  backgroundColor: "#F6F5F1",
                  border: "1px solid #E4E1DA",
                  textAlign: "center",
                  minWidth: 120
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color: "#2E7D5B" }}>
                  {metrics.high_fit_applied_before_deadline} / {metrics.high_fit_passed_deadlines}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 2, fontWeight: 600 }}>
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
                backgroundColor: filter === tab.id ? "#EFF4FE" : "#FFFFFF",
                color: filter === tab.id ? "#356AE6" : "#667085",
                border: filter === tab.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                borderRadius: 7,
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
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(16,24,40,0.04)"
          }}
        >
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#162A43" }}>Timeline Events & Outcomes</h3>
            <span style={{ fontSize: 12, color: "#667085" }}>Showing {filteredHistory.length} events</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredHistory.map((item, idx) => {
              const isHit = item.outcome === "Hit";
              const isMissed = item.outcome === "Missed";
              const isCompleted = item.outcome === "Completed";

              const badgeColor = isHit ? "#2E7D5B" : isMissed ? "#C24141" : isCompleted ? "#356AE6" : "#667085";
              const badgeBg = isHit
                ? "#EAF4EE"
                : isMissed
                ? "#FDF2F2"
                : isCompleted
                ? "#EFF4FE"
                : "#F6F5F1";
              const badgeBorder = isHit
                ? "#C8E4D3"
                : isMissed
                ? "#F8C8C8"
                : isCompleted
                ? "#D2E0FB"
                : "#E4E1DA";

              return (
                <div
                  key={`${item.id}-${idx}`}
                  style={{
                    padding: "18px 24px",
                    borderBottom: "1px solid #E4E1DA",
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
                          borderRadius: 5,
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`
                        }}
                      >
                        {item.outcome.toUpperCase()}
                      </span>

                      {item.is_high_fit && (
                        <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 600 }}>
                          ⭐ High Fit ({item.fit_score}% match)
                        </span>
                      )}

                      <span style={{ fontSize: 12, color: "#667085" }}>
                        📅 Date: {item.date}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: "#17191C", marginBottom: 2 }}>
                      {item.title}
                    </div>

                    <p style={{ margin: 0, fontSize: 12, color: "#667085" }}>
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
                          backgroundColor: "#F6F5F1",
                          color: "#162A43",
                          border: "1px solid #E4E1DA"
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
                          color: "#356AE6",
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
              <div style={{ padding: "32px", textAlign: "center", color: "#667085", fontSize: 14 }}>
                No events found matching the selected filter.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
