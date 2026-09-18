"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import GlobalEvidenceDrawer from "@/components/student/GlobalEvidenceDrawer";
import AskCognalyzeModal from "@/components/student/AskCognalyzeModal";
import { StudentDNAProfile, StudentCapability, EvidenceItem } from "@/lib/intelligence/student-intelligence";

export default function StudentDNAPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [profile, setProfile] = useState<StudentDNAProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"all" | "verified" | "developing" | "unproven" | "conflicts">("all");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCap, setSelectedCap] = useState<string | null>(null);
  const [askModalOpen, setAskModalOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") || "student-demo" : "student-demo";
    setCandidateId(stored);
    loadDNA(stored);
  }, []);

  const loadDNA = async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/dna?candidateId=${cId}`);
      const data = await res.json();
      if (data.intelligence) {
        setProfile(data.intelligence);
      }
    } catch (err) {
      console.error("Failed to load DNA:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhy = (capName: string) => {
    setSelectedCap(capName);
    setDrawerOpen(true);
  };

  const allCapabilities = profile?.capabilities ? Object.values(profile.capabilities) : [];

  const filteredCapabilities = allCapabilities.filter(c => {
    if (filterTab === "verified") return c.evidenceLevel === 4 || c.verifiedEvidenceCount > 0;
    if (filterTab === "developing") return c.proficiencyState === "Developing" || c.evidenceLevel === 2;
    if (filterTab === "unproven") return c.proficiencyState === "Claimed" || c.evidenceLevel <= 1;
    if (filterTab === "conflicts") return c.hasConflict;
    return true;
  });

  const getBadgeStyle = (level: number) => {
    switch (level) {
      case 4:
        return { label: "VERIFIED", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.4)" };
      case 3:
        return { label: "ASSESSED", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)" };
      case 2:
        return { label: "DEMONSTRATED", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.4)" };
      case 1:
        return { label: "CLAIMED", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)" };
      default:
        return { label: "INSUFFICIENT EVIDENCE", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.4)" };
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#818cf8" }}>
                EVIDENCE-BASED CAREER INTELLIGENCE
              </span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", fontWeight: 700 }}>
                ● Zero Fabrication Standard
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "white" }}>
              My Student DNA
            </h1>
            <p style={{ fontSize: 14, color: "#94a3b8", margin: "4px 0 0", maxWidth: 640 }}>
              Every capability is traceable to real artifacts, code repositories, assessments, and interview transcripts. No arbitrary aggregate scores.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setAskModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                border: "none",
                borderRadius: 10,
                color: "white",
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>🧠</span> Ask Why
            </button>
            <Link
              href="/student/journey"
              style={{
                textDecoration: "none",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 10,
                color: "white",
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>🗺️</span> View Journey
            </Link>
          </div>
        </div>

        {/* STATS / HONEST STATUS BANNER */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.4) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 28,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.8 }}>
              DNA Status
            </span>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", marginTop: 4 }}>
              {profile?.isBuilding ? "YOUR DNA IS BUILDING" : "ACTIVE INTELLIGENCE"}
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Target: {profile?.intent.primaryGoal || "Engineering"}
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.8 }}>
              Evidence Records
            </span>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#38bdf8", marginTop: 2 }}>
              {profile?.totalEvidenceCount || 0}
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Total across all source types
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.8 }}>
              Verified / Assessed
            </span>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#10b981", marginTop: 2 }}>
              {profile?.verifiedEvidenceCount || 0}
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Direct evaluation or corroborated
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.8 }}>
              Target Role Gaps
            </span>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#f59e0b", marginTop: 2 }}>
              {profile?.gaps?.length || 0}
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Capabilities requiring more evidence
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* CAPABILITIES MATRIX & FILTER TABS                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "white" }}>
                Capabilities Matrix ({filteredCapabilities.length})
              </h2>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Independent capability dimensions showing proficiency state, confidence, and latest evidence date.
              </span>
            </div>

            {/* FILTER TABS */}
            <div style={{ display: "flex", background: "rgba(15, 23, 42, 0.8)", padding: 4, borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              {[
                { id: "all", label: "All" },
                { id: "verified", label: "Verified / Assessed" },
                { id: "developing", label: "Developing" },
                { id: "unproven", label: "Claimed Only" },
                { id: "conflicts", label: "Conflicts" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: filterTab === tab.id ? "rgba(99, 102, 241, 0.3)" : "transparent",
                    color: filterTab === tab.id ? "white" : "#94a3b8",
                    transition: "all 0.15s ease"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* CAPABILITY CARDS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {filteredCapabilities.map(cap => {
              const badge = getBadgeStyle(cap.evidenceLevel);

              return (
                <div
                  key={cap.name}
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    border: cap.hasConflict ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 14
                  }}
                >
                  <div>
                    {/* TOP STATUS */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: 0.8,
                          padding: "2px 8px",
                          borderRadius: 4,
                          color: badge.color,
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {badge.label}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: cap.confidence === "HIGH" ? "#10b981" : cap.confidence === "MEDIUM" ? "#f59e0b" : "#ef4444"
                        }}
                      >
                        {cap.confidence} Confidence
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "white" }}>
                        {cap.name}
                      </h3>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#818cf8" }}>
                        {cap.proficiencyState}
                      </span>
                    </div>

                    {/* CONFLICT ALERT */}
                    {cap.hasConflict && (
                      <div
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: 6,
                          padding: "8px 10px",
                          fontSize: 11,
                          color: "#fca5a5",
                          marginBottom: 8
                        }}
                      >
                        ⚠️ {cap.conflictReason}
                      </div>
                    )}

                    {/* SOURCES CHIPS */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {cap.evidenceSources.map(src => (
                        <span
                          key={src}
                          style={{
                            fontSize: 10,
                            color: "#cbd5e1",
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: 4,
                            padding: "2px 6px"
                          }}
                        >
                          {src}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      Latest evidence: {new Date(cap.latestEvidenceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>

                  {/* FOOTER ACTION */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {cap.evidenceCount} records ({cap.verifiedEvidenceCount} verified)
                    </span>

                    <button
                      onClick={() => handleOpenWhy(cap.name)}
                      style={{
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "1px solid rgba(99, 102, 241, 0.35)",
                        color: "#a5b4fc",
                        borderRadius: 6,
                        padding: "4px 12px",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      Why? View Evidence →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TARGET ROLE BENCHMARK ALIGNMENT                            */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            padding: "24px",
            marginBottom: 28
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "white" }}>
                Target Role Alignment: {profile?.targetProfile.roleName}
              </h2>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {profile?.targetProfile.sourceNote}
              </span>
            </div>

            <span style={{ fontSize: 11, color: "#64748b" }}>
              Core • Important • Preferred Breakdown
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {/* CORE */}
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.3)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#ef4444", textTransform: "uppercase", marginBottom: 10 }}>
                Core Capabilities (Essential)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {profile?.targetProfile.coreCapabilities.map(capName => {
                  const studentCap = profile.capabilities[capName];
                  const hasEvidence = studentCap && studentCap.evidenceLevel >= 2;
                  return (
                    <div key={capName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                      <span style={{ color: hasEvidence ? "#e2e8f0" : "#94a3b8" }}>{capName}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: hasEvidence ? "#10b981" : "#f59e0b" }}>
                        {hasEvidence ? `✓ ${studentCap.levelName}` : "⚠ Gap"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* IMPORTANT */}
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.3)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 10 }}>
                Important Capabilities
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {profile?.targetProfile.importantCapabilities.map(capName => {
                  const studentCap = profile.capabilities[capName];
                  const hasEvidence = studentCap && studentCap.evidenceLevel >= 2;
                  return (
                    <div key={capName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                      <span style={{ color: hasEvidence ? "#e2e8f0" : "#94a3b8" }}>{capName}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: hasEvidence ? "#10b981" : "#f59e0b" }}>
                        {hasEvidence ? `✓ ${studentCap.levelName}` : "Developing"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PREFERRED */}
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.3)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#a855f7", textTransform: "uppercase", marginBottom: 10 }}>
                Preferred / Advanced
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {profile?.targetProfile.preferredCapabilities.map(capName => {
                  const studentCap = profile.capabilities[capName];
                  const hasEvidence = studentCap && studentCap.evidenceLevel >= 2;
                  return (
                    <div key={capName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                      <span style={{ color: hasEvidence ? "#e2e8f0" : "#94a3b8" }}>{capName}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: hasEvidence ? "#10b981" : "#64748b" }}>
                        {hasEvidence ? `✓ ${studentCap.levelName}` : "Unobserved"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* CAREER MEMORY PATTERNS                                     */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            padding: "24px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "white" }}>
                Career Memory Insights
              </h2>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Synthesized across your recorded interview evaluations and application outcomes.
              </span>
            </div>

            <span style={{ fontSize: 11, color: "#64748b" }}>
              Corroboration Threshold: ≥ 2 Occurrences
            </span>
          </div>

          {profile?.memoryPatterns && profile.memoryPatterns.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {profile.memoryPatterns.map(pattern => (
                <div
                  key={pattern.capability}
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                  }}
                >
                  <span style={{ fontSize: 18 }}>💡</span>
                  <div style={{ fontSize: 13, color: "#fef3c7" }}>
                    {pattern.insight}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 10, fontSize: 13, color: "#94a3b8" }}>
              No recurring patterns detected yet. Cognalyze adheres to the strict credibility rule: single outcomes are recorded, but recurring patterns are only asserted after multiple corroborated evaluations.
            </div>
          )}
        </div>
      </main>

      {/* GLOBAL EVIDENCE DRAWER */}
      <GlobalEvidenceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        capabilityName={selectedCap}
        candidateId={candidateId}
      />

      {/* ASK COGNALYZE MODAL */}
      <AskCognalyzeModal
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        candidateId={candidateId}
        onOpenEvidenceDrawer={handleOpenWhy}
      />
    </div>
  );
}
