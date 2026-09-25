"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  runEvidenceEngine,
  EvidenceEngineOutput,
  StudentCapabilityItem,
  KeyEvidenceItem,
  StudentGapItem,
  TrajectoryItem,
  NextActionItem,
  CapabilityState,
} from "@/lib/intelligence/evidence-engine";

export default function StudentDNAPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [engineData, setEngineData] = useState<EvidenceEngineOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<"overview" | "skills" | "evidence" | "gaps" | "trajectory" | "actions">("overview");

  // Level 2: Capability Inspector Drawer
  const [selectedCap, setSelectedCap] = useState<StudentCapabilityItem | null>(null);

  // Level 3: Deep Evidence Item Modal
  const [selectedEvidence, setSelectedEvidence] = useState<KeyEvidenceItem | null>(null);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("cognalyze_student_id") || "student-demo"
        : "student-demo";
    setCandidateId(stored);
    loadData(stored);
  }, []);

  const loadData = async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/dna?candidateId=${cId}`);
      const data = await res.json();
      if (data.evidenceEngine) {
        setEngineData(data.evidenceEngine);
      } else {
        // Fallback to local engine generator
        setEngineData(runEvidenceEngine(cId));
      }
    } catch (err) {
      console.error("Failed to load DNA engine data:", err);
      setEngineData(runEvidenceEngine(cId));
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId: string, navKey: any) => {
    setActiveNav(navKey);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getStateStyle = (state: CapabilityState) => {
    switch (state) {
      case "DEMONSTRATED":
      case "VERIFIED":
        return {
          color: "#10b981",
          bg: "rgba(16, 185, 129, 0.12)",
          border: "rgba(16, 185, 129, 0.35)",
        };
      case "DEVELOPING":
        return {
          color: "#f59e0b",
          bg: "rgba(245, 158, 11, 0.12)",
          border: "rgba(245, 158, 11, 0.35)",
        };
      case "GAP":
      case "REPEATED GAP":
        return {
          color: "#ef4444",
          bg: "rgba(239, 68, 68, 0.12)",
          border: "rgba(239, 68, 68, 0.35)",
        };
      case "EVIDENCE MISMATCH":
        return {
          color: "#a855f7",
          bg: "rgba(168, 85, 247, 0.12)",
          border: "rgba(168, 85, 247, 0.35)",
        };
      case "STALE EVIDENCE":
        return {
          color: "#94a3b8",
          bg: "rgba(148, 163, 184, 0.12)",
          border: "rgba(148, 163, 184, 0.3)",
        };
      default:
        return {
          color: "#38bdf8",
          bg: "rgba(56, 189, 248, 0.12)",
          border: "rgba(56, 189, 248, 0.35)",
        };
    }
  };

  const getEvidenceStateBadge = (state: string) => {
    switch (state) {
      case "VERIFIED":
        return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.4)" };
      case "DEMONSTRATED":
        return { color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.4)" };
      case "PARTIAL":
        return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)" };
      case "REPEATED GAP":
        return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)" };
      default:
        return { color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.3)" };
    }
  };

  const data = engineData || runEvidenceEngine(candidateId);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#060913",
        color: "#f8fafc",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <AppNav role="student" />

      {/* SECONDARY IN-PAGE NAVIGATION */}
      <div
        style={{
          position: "sticky",
          top: 57,
          zIndex: 40,
          background: "rgba(6, 9, 19, 0.88)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "8px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#38bdf8", marginRight: 8 }}>
              DNA
            </span>
            {[
              { id: "sec-identity", key: "overview", label: "Overview" },
              { id: "sec-capability", key: "skills", label: "Capability" },
              { id: "sec-evidence", key: "evidence", label: "Evidence" },
              { id: "sec-gaps", key: "gaps", label: "Gaps" },
              { id: "sec-trajectory", key: "trajectory", label: "Trajectory" },
              { id: "sec-actions", key: "actions", label: "Next Actions" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => scrollToSection(tab.id, tab.key)}
                style={{
                  background: activeNav === tab.key ? "rgba(56, 189, 248, 0.15)" : "transparent",
                  border: activeNav === tab.key ? "1px solid rgba(56, 189, 248, 0.35)" : "1px solid transparent",
                  color: activeNav === tab.key ? "#ffffff" : "#94a3b8",
                  borderRadius: 6,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: activeNav === tab.key ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span
            style={{
              fontSize: 11,
              color: "#10b981",
              fontWeight: 700,
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            ● Connected Intelligence
          </span>
        </div>
      </div>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px 100px" }}>
        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 1 — IDENTITY (WHO YOU ARE)                         */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section id="sec-identity" style={{ marginBottom: 44, scrollMarginTop: 110 }}>
          <div style={{ marginBottom: 20 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: "-0.5px",
                margin: 0,
                color: "#ffffff",
              }}
            >
              Student DNA
            </h1>
            <p style={{ fontSize: 14, color: "#94a3b8", margin: "6px 0 0" }}>
              Your continuously evolving evidence profile.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* NAME, DEGREE, ROLE & STAGE */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#ffffff" }}>
                  {data.identity.name}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                  {data.identity.degreeBranch} • <strong style={{ color: "#e2e8f0" }}>{data.identity.role}</strong>
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#38bdf8",
                  background: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  padding: "4px 12px",
                  borderRadius: 20,
                }}
              >
                Current stage: {data.identity.currentStage}
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.06)" }} />

            {/* CAREER DIRECTION & INTERESTS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.8 }}>
                  Career Direction
                </span>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", marginTop: 2 }}>
                  {data.identity.careerDirection}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.8 }}>
                  Interests
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {data.identity.interests.map((interest) => (
                    <span
                      key={interest}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#cbd5e1",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 2 — CAPABILITY (WHAT YOU CAN DO)                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section id="sec-capability" style={{ marginBottom: 44, scrollMarginTop: 110 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>
              Capability
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>
              What you have demonstrated so far.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {data.capabilities.map((cap, idx, arr) => {
              const badge = getStateStyle(cap.state);

              return (
                <div
                  key={cap.id}
                  onClick={() => setSelectedCap(cap)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: idx < arr.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Click to view Level 2 deep dive"
                >
                  <div style={{ flex: "1 1 240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#ffffff" }}>
                        {cap.name}
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        • {cap.freshness}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      {cap.summary}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 6,
                        color: badge.color,
                        backgroundColor: badge.bg,
                        border: `1px solid ${badge.border}`,
                        minWidth: 120,
                        textAlign: "center",
                        letterSpacing: 0.5,
                      }}
                    >
                      {cap.state}
                    </span>

                    <span style={{ fontSize: 12, color: "#64748b" }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, textAlign: "right" }}>
            Click any capability to inspect Level 2 evidence, projects, interviews, and confidence.
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 3 — EVIDENCE (WHAT PROVES IT)                      */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section id="sec-evidence" style={{ marginBottom: 44, scrollMarginTop: 110 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#10b981" }}>
              Evidence
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>
              Every important claim is traceable to observable proof.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {data.keyEvidence.map((ev) => {
              const badge = getEvidenceStateBadge(ev.verificationState);

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvidence(ev)}
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 12,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                    cursor: "pointer",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.4)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.transform = "none";
                  }}
                  title="Click to view Level 3 origin inspection"
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#ffffff" }}>
                        {ev.title}
                      </h3>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                          color: badge.color,
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ev.verificationState}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>
                      {ev.source}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <span>{ev.relevantCapability}</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700 }}>Inspect Proof →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 4 — GAPS (WHERE YOU HAVE GAPS)                     */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section id="sec-gaps" style={{ marginBottom: 44, scrollMarginTop: 110 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#f59e0b" }}>
              Gaps
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>
              Neutral, evidence-based identification of unresolved areas.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.gaps.map((gap) => (
              <div
                key={gap.id}
                style={{
                  backgroundColor: gap.gapType === "REPEATED GAP" ? "rgba(239, 68, 68, 0.07)" : "rgba(15, 23, 42, 0.6)",
                  border: gap.gapType === "REPEATED GAP" ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, color: gap.gapType === "REPEATED GAP" ? "#ef4444" : "#f59e0b" }}>
                      {gap.gapType === "REPEATED GAP" ? "⚠" : "•"}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                      {gap.capability}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: gap.gapType === "REPEATED GAP" ? "#ef4444" : "#f59e0b",
                      background: gap.gapType === "REPEATED GAP" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {gap.gapType}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4, lineHeight: 1.4 }}>
                  {gap.summary}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>
                  {gap.explanation}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 5 — TRAJECTORY (HOW YOU ARE CHANGING)              */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section id="sec-trajectory" style={{ marginBottom: 44, scrollMarginTop: 110 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#a855f7" }}>
              Trajectory
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>
              Capability momentum and evidence freshness over time.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {data.trajectories.map((traj, idx, arr) => (
              <div
                key={traj.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom: idx < arr.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      width: 24,
                      textAlign: "center",
                      color: traj.trend === "UP" ? "#10b981" : traj.trend === "DOWN" ? "#ef4444" : "#94a3b8",
                    }}
                  >
                    {traj.trendSymbol}
                  </span>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                      {traj.capability}
                    </span>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      {traj.context}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700 }}>
                    {traj.lastDemonstrated}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: traj.freshnessLabel.includes("Fresh")
                        ? "#10b981"
                        : traj.freshnessLabel.includes("Recent")
                        ? "#38bdf8"
                        : "#f59e0b",
                    }}
                  >
                    {traj.freshnessLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 6 — NEXT BEST ACTION (WHAT YOU SHOULD DO NEXT)     */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section id="sec-actions" style={{ marginBottom: 44, scrollMarginTop: 110 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#38bdf8" }}>
              Next Best Action
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>
              Converting current evidence into targeted next steps.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.nextActions.map((act) => (
              <div
                key={act.id}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 14,
                  padding: "18px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: "1 1 300px" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: "rgba(56, 189, 248, 0.15)",
                      border: "1px solid rgba(56, 189, 248, 0.35)",
                      color: "#38bdf8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {act.step}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#ffffff" }}>
                      {act.action}
                    </h3>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                      <strong style={{ color: "#64748b" }}>Reason: </strong>
                      {act.reason}
                    </div>
                  </div>
                </div>

                <Link
                  href={act.ctaHref}
                  style={{
                    textDecoration: "none",
                    background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.25))",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    color: "#ffffff",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {act.ctaLabel} →
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LEVEL 2: CAPABILITY INSPECTOR DRAWER                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedCap && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setSelectedCap(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              height: "100%",
              backgroundColor: "#090d1a",
              borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.8)",
              display: "flex",
              flexDirection: "column",
              color: "#f8fafc",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* DRAWER HEADER */}
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                background: "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.2) 100%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: "#38bdf8",
                  }}
                >
                  LEVEL 2 CAPABILITY DEEP DIVE
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: "4px 0 0", color: "white" }}>
                  {selectedCap.name}
                </h2>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  {selectedCap.freshness} • Confidence: <strong style={{ color: "#38bdf8" }}>{selectedCap.confidence}</strong>
                </div>
              </div>

              <button
                onClick={() => setSelectedCap(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 8,
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "6px 12px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* DRAWER BODY */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  backgroundColor: getStateStyle(selectedCap.state).bg,
                  border: `1px solid ${getStateStyle(selectedCap.state).border}`,
                  color: getStateStyle(selectedCap.state).color,
                  fontWeight: 800,
                  fontSize: 13,
                  marginBottom: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>State: {selectedCap.state}</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Zero Arbitrary Score Standard</span>
              </div>

              {/* SOURCES BREAKDOWN */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.8, marginBottom: 10 }}>
                  Evidence Source Breakdown
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Projects</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", marginTop: 2 }}>
                      {selectedCap.sourcesBreakdown.projects}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>DSA Problems</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", marginTop: 2 }}>
                      {selectedCap.sourcesBreakdown.dsaProblems}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Interviews</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", marginTop: 2 }}>
                      {selectedCap.sourcesBreakdown.interviews}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>GitHub Activity</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: selectedCap.sourcesBreakdown.githubActivity ? "#10b981" : "#64748b", marginTop: 4 }}>
                      {selectedCap.sourcesBreakdown.githubActivity ? "✓ Public Repos" : "Unobserved"}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONNECTED EVIDENCE SNIPPETS */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.8, marginBottom: 10 }}>
                  Relevant Evidence Records
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.keyEvidence
                    .filter((ev) => ev.relevantCapability.toLowerCase().includes(selectedCap.name.toLowerCase()) || selectedCap.name.toLowerCase().includes(ev.relevantCapability.toLowerCase()))
                    .map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvidence(ev)}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: 10,
                          padding: "12px 14px",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{ev.title}</span>
                          <span style={{ fontSize: 10, color: "#38bdf8", fontWeight: 700 }}>Level 3 Proof →</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{ev.source} • {ev.timestamp}</div>
                      </div>
                    ))}
                  {data.keyEvidence.filter((ev) => ev.relevantCapability.toLowerCase().includes(selectedCap.name.toLowerCase()) || selectedCap.name.toLowerCase().includes(ev.relevantCapability.toLowerCase())).length === 0 && (
                    <div style={{ fontSize: 12, color: "#64748b", padding: "12px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 8 }}>
                      No verified direct artifacts logged for this capability yet. Complete a mock interview or add a project repo to build evidence.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LEVEL 3: DEEP EVIDENCE INSPECTOR MODAL                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedEvidence && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            padding: 20,
          }}
          onClick={() => setSelectedEvidence(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 580,
              backgroundColor: "#0d1322",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: 16,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9)",
              padding: "24px 28px",
              color: "#f8fafc",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: "#38bdf8",
                  }}
                >
                  LEVEL 3 EVIDENCE ARTIFACT
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: "4px 0 0", color: "#ffffff" }}>
                  {selectedEvidence.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedEvidence(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: 6,
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px 10px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px 14px", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Source</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>{selectedEvidence.source}</div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px 14px", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Timestamp</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>{selectedEvidence.timestamp}</div>
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px 14px", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                  Original Activity / Verbatim Observation
                </div>
                <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, fontStyle: "italic" }}>
                  "{selectedEvidence.originalActivity}"
                </div>
              </div>

              <div style={{ background: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "12px 14px", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "#38bdf8", textTransform: "uppercase", fontWeight: 800, marginBottom: 4 }}>
                  Why Cognalyze Considers This Relevant
                </div>
                <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.5 }}>
                  {selectedEvidence.whyRelevant}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, fontSize: 12, color: "#64748b" }}>
                <span>Supports Capability: <strong style={{ color: "#ffffff" }}>{selectedEvidence.relevantCapability}</strong></span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 800,
                    color: getEvidenceStateBadge(selectedEvidence.verificationState).color,
                    background: getEvidenceStateBadge(selectedEvidence.verificationState).bg,
                    border: `1px solid ${getEvidenceStateBadge(selectedEvidence.verificationState).border}`,
                  }}
                >
                  {selectedEvidence.verificationState}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
