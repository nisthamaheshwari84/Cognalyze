"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CompanyTrack, SkillDomain, SkillResource } from "@/lib/skill-hub-store";

export default function SkillPracticeHubPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [allTracks, setAllTracks] = useState<CompanyTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Array<"service_mass" | "service_elite" | "product_mid" | "product_faang">>([
    "service_mass",
    "product_mid"
  ]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFocalTrack, setActiveFocalTrack] = useState<string>("service_mass");
  const [savingTracks, setSavingTracks] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    fetchTracksAndDomains(stored);
  }, []);

  const fetchTracksAndDomains = async (cId: string) => {
    setLoading(true);
    try {
      const tracksRes = await fetch(`/api/skills/tracks?candidateId=${cId}`);
      const tracksData = await tracksRes.json();
      if (tracksData.tracks) {
        setAllTracks(tracksData.tracks);
        if (tracksData.studentTracks && tracksData.studentTracks.length > 0) {
          setSelectedTracks(tracksData.studentTracks);
          setActiveFocalTrack(tracksData.studentTracks[0]);
        }
      }

      // Fetch domains
      const domainsRes = await fetch(`/api/skills/domains?candidateId=${cId}`);
      const domainsData = await domainsRes.json();
      if (domainsData.domains) {
        setDomains(domainsData.domains);
      }
    } catch (err) {
      console.error("Error loading Skill Hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrack = async (slug: "service_mass" | "service_elite" | "product_mid" | "product_faang") => {
    let nextTracks: Array<"service_mass" | "service_elite" | "product_mid" | "product_faang">;
    if (selectedTracks.includes(slug)) {
      if (selectedTracks.length === 1) {
        // Prevent deselecting all tracks
        return;
      }
      nextTracks = selectedTracks.filter(t => t !== slug);
    } else {
      nextTracks = [...selectedTracks, slug];
    }

    setSelectedTracks(nextTracks);
    if (!nextTracks.includes(activeFocalTrack as any)) {
      setActiveFocalTrack(nextTracks[0]);
    }

    setSavingTracks(true);
    try {
      await fetch("/api/skills/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, targetTracks: nextTracks })
      });

      // Refresh domains based on new track selection
      const domainsRes = await fetch(`/api/skills/domains?candidateId=${candidateId}&tracks=${nextTracks.join(",")}`);
      const domainsData = await domainsRes.json();
      if (domainsData.domains) {
        setDomains(domainsData.domains);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTracks(false);
    }
  };

  const activeTrackDetails = allTracks.find(t => t.slug === activeFocalTrack) || allTracks[0];

  const hasServiceTrack = selectedTracks.includes("service_mass") || selectedTracks.includes("service_elite");
  const hasProductTrack = selectedTracks.includes("product_mid") || selectedTracks.includes("product_faang");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(16px)", padding: "16px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Link href="/student" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Placement Copilot
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 700 }}>Track-Aware Skill Practice Hub</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🎯</span>
              <span>Skill Practice Hub • Track-Aware Preparation</span>
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
              Grounded in 2026 hiring patterns. Branching on company track — not college tier.
            </p>
          </div>

          {/* Quick Hub Navigation Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link href="/student/skills/aptitude" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, backgroundColor: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.35)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                🧮 Aptitude Simulator
              </button>
            </Link>
            <Link href="/student/skills/communication" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.35)", color: "#34d399", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                🎙️ Spoken English Studio
              </button>
            </Link>
            <Link href="/student/skills/patterns" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, backgroundColor: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.35)", color: "#fbbf24", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                🏛️ Company Pattern Banks
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── 1. TARGET COMPANY TRACKS SELECTOR (MULTI-SELECT DRIVER) ── */}
        <div style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.5) 100%)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 18, padding: "20px 24px", marginBottom: 28, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(99,102,241,0.25)", color: "#c7d2fe", borderRadius: 6, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  PRIMARY FILTERING ENGINE
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {selectedTracks.length} Track{selectedTracks.length > 1 ? "s" : ""} Selected {selectedTracks.length > 1 ? "(Hedging Strategy Active)" : ""}
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "white" }}>
                Select Your Target Company Tracks
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.6)", maxWidth: 740, lineHeight: 1.5 }}>
                Multi-select the tracks you are actually interviewing for. Your curriculum and practice weights will dynamically adapt — never forcing irrelevant 500-question LeetCode grinds on service mass rounds, and never showing aptitude gates on FAANG prep.
              </p>
            </div>

            {/* Hedging Badge */}
            {hasServiceTrack && hasProductTrack && (
              <div style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🛡️</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399" }}>Hedging Strategy Enabled</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Balancing Mass Service Safety + Product Ambition</div>
                </div>
              </div>
            )}
          </div>

          {/* 4 Interactive Track Selection Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 14 }}>
            {allTracks.map(track => {
              const isSelected = selectedTracks.includes(track.slug);
              const isFocal = activeFocalTrack === track.slug;

              const badgeColor =
                track.slug === "service_mass"
                  ? "#38bdf8"
                  : track.slug === "service_elite"
                  ? "#818cf8"
                  : track.slug === "product_mid"
                  ? "#34d399"
                  : "#fbbf24";

              return (
                <div
                  key={track.slug}
                  onClick={() => toggleTrack(track.slug)}
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(15,23,42,0.85) 100%)"
                      : "rgba(15, 23, 42, 0.4)",
                    border: isSelected ? `2px solid ${badgeColor}` : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: 16,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                    boxShadow: isSelected ? `0 6px 20px -5px rgba(0,0,0,0.6)` : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: `${badgeColor}25`, color: badgeColor, fontWeight: 800 }}>
                      {track.typical_ctc_range}
                    </span>
                    <span style={{ fontSize: 14, color: isSelected ? badgeColor : "rgba(255,255,255,0.3)" }}>
                      {isSelected ? "✓ Active" : "+ Add"}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px", color: "white" }}>
                    {track.name}
                  </h3>

                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, margin: "0 0 10px", minHeight: 32 }}>
                    {track.description}
                  </p>

                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span>Target: </span>
                    <strong style={{ color: "rgba(255,255,255,0.8)" }}>{track.target_companies.slice(0, 3).join(", ")}...</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 2. REAL ROUND FUNNEL VISUALIZER (2026 Process Verification) ── */}
        {activeTrackDetails && (
          <div style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "white" }}>
                    Hiring Funnel Anatomy: {activeTrackDetails.name}
                  </h3>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Verified against real 2026 recruitment drives. Click track pill to preview round breakdown.
                  </div>
                </div>
              </div>

              {/* Track Switcher for Funnel Preview */}
              <div style={{ display: "flex", gap: 6, background: "rgba(0,0,0,0.3)", padding: 3, borderRadius: 8, overflowX: "auto", maxWidth: "100%" }}>
                {allTracks.map(t => (
                  <button
                    key={t.slug}
                    onClick={() => setActiveFocalTrack(t.slug)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: activeFocalTrack === t.slug ? "#6366f1" : "transparent",
                      color: activeFocalTrack === t.slug ? "white" : "rgba(255,255,255,0.6)",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {t.slug.replace("_", " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Funnel Stages Timeline */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
              {activeTrackDetails.round_structure.map((round) => (
                <div
                  key={round.round_number}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: round.is_hard_gate ? "rgba(239, 68, 68, 0.08)" : "rgba(255,255,255,0.03)",
                    border: round.is_hard_gate ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 700 }}>
                        Round {round.round_number}
                      </span>
                      {round.is_hard_gate && (
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(239,68,68,0.2)", color: "#f87171", fontWeight: 800 }}>
                          ⚠️ HARD GATE
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 4px", color: "white" }}>
                      {round.name}
                    </h4>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.4, margin: "0 0 10px" }}>
                      {round.description}
                    </p>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                    <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700, marginBottom: 4 }}>
                      📉 {round.typical_elimination_rate}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                      Focus: {round.key_focus_areas[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 3. DYNAMIC DOMAIN BREAKDOWN (FILTERED BY SELECTED TRACKS) ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "white" }}>
                Active Practice Domains ({domains.length})
              </h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
                Dynamically weighted based on your {selectedTracks.length} target company tracks.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 18 }}>
            {domains.map(dom => {
              const isGate = dom.gating_priority === "critical_gate";
              const isHighFilter = dom.gating_priority === "high_filter";

              return (
                <div
                  key={dom.slug}
                  style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: isGate ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 14,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
                  }}
                >
                  <div>
                    {/* Card Top: Badges & Depth */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{dom.icon}</span>
                        <span style={{ fontSize: 10, textTransform: "uppercase", padding: "2px 8px", borderRadius: 6, fontWeight: 800, background: isGate ? "rgba(239,68,68,0.15)" : isHighFilter ? "rgba(245,158,11,0.15)" : "rgba(99,102,241,0.15)", color: isGate ? "#f87171" : isHighFilter ? "#fbbf24" : "#a5b4fc" }}>
                          {dom.gating_priority.replace("_", " ")}
                        </span>
                      </div>

                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: dom.depth === "interview_deep" ? "rgba(168,85,247,0.2)" : "rgba(56,189,248,0.15)", color: dom.depth === "interview_deep" ? "#c084fc" : "#38bdf8", fontWeight: 700 }}>
                        {dom.depth === "interview_deep" ? "⚡ Interview Deep" : "📘 Basic Tier"}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 6px", color: "white" }}>
                      {dom.name}
                    </h4>

                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: "0 0 12px" }}>
                      {dom.description}
                    </p>

                    {/* Resources List Summary */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {dom.resources?.map((res: SkillResource) => (
                        <div
                          key={res.id}
                          style={{
                            padding: "8px 10px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: 11
                          }}
                        >
                          <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                            {res.title}
                          </span>
                          <span style={{ fontSize: 9, color: "#94a3b8", padding: "1px 6px", background: "rgba(255,255,255,0.06)", borderRadius: 4 }}>
                            {res.company_tag || "General"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Action Link — ZERO DEAD ENDS */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                    {dom.slug === "aptitude_reasoning" ? (
                      <Link href="/student/skills/aptitude" style={{ textDecoration: "none" }}>
                        <button style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}>
                          Launch NQT Aptitude Exam ➔
                        </button>
                      </Link>
                    ) : dom.slug === "communication_english" ? (
                      <Link href="/student/skills/communication" style={{ textDecoration: "none" }}>
                        <button style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 15px rgba(16,185,129,0.3)" }}>
                          Open Spoken English Studio ➔
                        </button>
                      </Link>
                    ) : dom.slug === "cs_fundamentals" ? (
                      <Link href="/student/skills/cs-interview" style={{ textDecoration: "none" }}>
                        <button style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#38bdf8,#0284c7)", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 15px rgba(56,189,248,0.3)" }}>
                          Enter CS Technical Round ➔
                        </button>
                      </Link>
                    ) : dom.slug === "system_design" ? (
                      <Link href="/student/skills/system-design" style={{ textDecoration: "none" }}>
                        <button style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#a855f7,#7c3aed)", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 15px rgba(168,85,247,0.3)" }}>
                          Enter System Design Room ➔
                        </button>
                      </Link>
                    ) : dom.slug === "behavioral_hr" ? (
                      <Link href="/student/skills/behavioral" style={{ textDecoration: "none" }}>
                        <button style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 15px rgba(245,158,11,0.3)" }}>
                          Enter Behavioral HR Room ➔
                        </button>
                      </Link>
                    ) : (
                      <Link href="/student/dsa-tracker" style={{ textDecoration: "none" }}>
                        <button style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          Open DSA Coding Tracker ➔
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
