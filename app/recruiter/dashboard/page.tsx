"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

interface ActionItem {
  id: string;
  type: string;
  title: string;
  candidateId: string;
  candidateName: string;
  roleId: string;
  roleTitle: string;
  urgency: "Immediate" | "High" | "Normal";
  dueText: string;
  actionUrl: string;
}

interface OpenPosition {
  id: string;
  title: string;
  department: string;
  seniority: string;
  targetHires: number;
  applicantsCount: number;
  criticalRequirementsCount: number;
}

interface PipelineCandidate {
  id: string;
  name: string;
  roleTitle: string;
  sourceType: string;
  currentStage: string;
  appliedAt: string;
}

export default function RecruiterCommandCenterPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    activePositions: 3,
    totalCandidates: 3,
    pendingActionItems: 3,
    pendingEvaluations: 1,
    conflictsCount: 0,
    decisionRoomCount: 1,
    completed90DayReviews: 3
  });
  const [actionQueue, setActionQueue] = useState<ActionItem[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<PipelineCandidate[]>([]);

  useEffect(() => {
    async function loadCommandCenter() {
      try {
        const res = await fetch("/api/recruiter/command-center");
        const data = await res.json();
        if (data.success && data.commandCenter) {
          setKpis(data.commandCenter.kpis);
          setActionQueue(data.commandCenter.actionQueue);
          setOpenPositions(data.commandCenter.openPositions);
          setRecentCandidates(data.commandCenter.recentCandidates);
        }
      } catch (err) {
        console.error("Failed to load command center telemetry:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCommandCenter();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER / HERO */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.16) 0%, rgba(99, 102, 241, 0.10) 50%, rgba(6, 182, 212, 0.06) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.35)",
            borderRadius: 20,
            padding: "28px 32px",
            marginBottom: 32,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div style={{ maxWidth: 740 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(168,85,247,0.25)", color: "#e9d5ff", fontWeight: 800, border: "1px solid rgba(168,85,247,0.4)" }}>
                  ⚡ PHASE 0 RECRUITER COMMAND CENTER
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Autonomous Talent Intelligence Lifecycle
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 900, margin: "0 0 10px", letterSpacing: "-1px" }}>
                Talent Operations Command Center
              </h1>

              <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.72)", lineHeight: 1.6, margin: "0 0 20px" }}>
                End-to-end evidence-based hiring engine: from Role DNA architecture and multi-source candidate intelligence to live work-sample verification, conflict resolution, and the 90-day Quality-of-Hire learning loop.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  href="/recruiter/roles"
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #a855f7, #6366f1)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: "0 4px 15px rgba(168,85,247,0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>🧬</span> Create Role DNA
                </Link>

                <Link
                  href="/recruiter/candidates"
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.07)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>👥</span> Candidate Discovery Pool
                </Link>

                <Link
                  href="/recruiter/decision-room"
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    color: "#fde68a",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>⚖️</span> Open Decision Room
                </Link>

                <Link
                  href="/recruiter/quality-of-hire"
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    color: "#a7f3d0",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>📈</span> 30/60/90 Quality Loop
                </Link>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, minWidth: 320 }}>
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Active Role DNAs</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#818cf8", margin: "4px 0 2px" }}>{kpis.activePositions} Roles</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Calibrated with outcomes</div>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Total Talent Pool</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#38bdf8", margin: "4px 0 2px" }}>{kpis.totalCandidates} Ingested</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Bulk + Student synced</div>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Action Queue Items</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24", margin: "4px 0 2px" }}>{kpis.pendingActionItems} Actions</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Requires recruiter sign-off</div>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>90-Day Cohorts</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#34d399", margin: "4px 0 2px" }}>{kpis.completed90DayReviews} Hires</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Quality Loop Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION QUEUE SECTION (Pending Work Samples, Conflicts, Decision Room) ── */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <h2 style={{ fontSize: 16, color: "#f8fafc", fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Priority Action Queue ({actionQueue.length})
              </h2>
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Real-time pending lifecycle events</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {actionQueue.length === 0 ? (
              <div style={{ padding: 24, background: "rgba(15,23,42,0.6)", borderRadius: 12, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                🎉 Action queue is completely clear. All candidates are in stable stages.
              </div>
            ) : (
              actionQueue.map(item => {
                const isUrgent = item.urgency === "Immediate";
                const isHigh = item.urgency === "High";
                const badgeBg = isUrgent ? "rgba(239, 68, 68, 0.2)" : isHigh ? "rgba(245, 158, 11, 0.2)" : "rgba(99, 102, 241, 0.2)";
                const badgeColor = isUrgent ? "#fca5a5" : isHigh ? "#fde68a" : "#c7d2fe";

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "rgba(15, 23, 42, 0.7)",
                      border: `1px solid ${isUrgent ? "rgba(239, 68, 68, 0.35)" : "rgba(255, 255, 255, 0.08)"}`,
                      borderRadius: 14,
                      padding: "18px 22px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 16
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: badgeBg, color: badgeColor, fontWeight: 800 }}>
                          {item.urgency.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          {item.dueText} • Candidate: <strong style={{ color: "#f8fafc" }}>{item.candidateName}</strong>
                        </span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", margin: "0 0 2px" }}>
                        {item.title}
                      </h3>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Role: {item.roleTitle}
                      </div>
                    </div>

                    <Link
                      href={item.actionUrl}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: isUrgent ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #6366f1, #a855f7)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
                      }}
                    >
                      Resolve Action ➔
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ── TWO-COLUMN VIEW: OPEN POSITIONS & CANDIDATE PIPELINE ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 550px), 1fr))", gap: 24 }}>
          
          {/* OPEN POSITIONS (ROLE DNA) */}
          <section style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 2px" }}>
                  💼 Open Positions (Role DNAs)
                </h2>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Tiered requirement schemas with outcome milestones</div>
              </div>

              <Link
                href="/recruiter/roles"
                style={{ fontSize: 12, color: "#c084fc", textDecoration: "none", fontWeight: 700 }}
              >
                + Define New Role ➔
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {openPositions.map(pos => (
                <div
                  key={pos.id}
                  style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: 12,
                    padding: "16px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                        {pos.title}
                      </h4>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {pos.department} • Seniority: {pos.seniority} • Target Hires: {pos.targetHires}
                      </div>
                    </div>

                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(168,85,247,0.15)", color: "#d8b4fe", fontWeight: 700 }}>
                      {pos.applicantsCount} in pipeline
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>
                      🛡️ {pos.criticalRequirementsCount} Critical Dealbreakers
                    </span>
                    <Link
                      href={`/recruiter/candidates?roleId=${pos.id}`}
                      style={{ fontSize: 11, color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}
                    >
                      View Candidates ➔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CANDIDATE DISCOVERY POOL VIEW */}
          <section style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 2px" }}>
                  👥 Candidate Discovery Intake
                </h2>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Multi-source profiles from bulk upload & student applications</div>
              </div>

              <Link
                href="/recruiter/candidates"
                style={{ fontSize: 12, color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}
              >
                View Full Pool ➔
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentCandidates.map(cand => {
                const isStudentApp = cand.sourceType === "student_application";
                return (
                  <div
                    key={cand.id}
                    style={{
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: 12,
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>
                          {cand.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 800,
                            background: isStudentApp ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                            color: isStudentApp ? "#6ee7b7" : "#a5b4fc"
                          }}
                        >
                          {isStudentApp ? "STUDENT APP" : "BULK UPLOAD"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        Applied for: {cand.roleTitle}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, marginBottom: 4 }}>
                        {cand.currentStage}
                      </div>
                      <Link
                        href={`/recruiter/decision-room?candidate=${cand.id}`}
                        style={{
                          fontSize: 11,
                          color: "#c084fc",
                          textDecoration: "none",
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: "rgba(168,85,247,0.1)"
                        }}
                      >
                        Evidence Dossier ➔
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

      </main>
    </div>
  );
}
