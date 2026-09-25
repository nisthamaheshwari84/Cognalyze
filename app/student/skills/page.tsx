"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CompanyTrack, SkillDomain } from "@/lib/skill-hub-store";
import {
  generateSessionBrief,
  getDomainStatus,
  getStudentProfile,
  getDailyAdaptivePlan,
  getDomainReadiness,
  SessionBrief
} from "@/lib/skills/adaptive-engine";
import SessionBriefModal from "@/components/skills/SessionBriefModal";

export default function SkillPracticeHubPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [allTracks, setAllTracks] = useState<CompanyTrack[]>([]);
  const [selectedTrackSlug, setSelectedTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");
  const [domains, setDomains] = useState<SkillDomain[]>([]);
  const [loading, setLoading] = useState(true);

  // Progressive Disclosure: Hiring Funnel Collapsed by default
  const [funnelExpanded, setFunnelExpanded] = useState(false);
  const [expandedRoundIdx, setExpandedRoundIdx] = useState<number | null>(null);

  // Progressive Disclosure: "Why?" popover state per domain
  const [activeWhyDomain, setActiveWhyDomain] = useState<string | null>(null);

  // Progressive Disclosure: Explore Tracks Modal
  const [exploreTracksOpen, setExploreTracksOpen] = useState(false);

  // Contextual Session Brief Modal state
  const [activeBrief, setActiveBrief] = useState<SessionBrief | null>(null);
  const [briefTargetHref, setBriefTargetHref] = useState<string>("/student/skills/cs-interview");
  const [isBriefOpen, setIsBriefOpen] = useState(false);

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
          setSelectedTrackSlug(tracksData.studentTracks[0]);
        }
      }

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

  const handleSelectTrack = async (slug: "service_mass" | "service_elite" | "product_mid" | "product_faang") => {
    setSelectedTrackSlug(slug);
    try {
      await fetch("/api/skills/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, targetTracks: [slug] })
      });

      const domainsRes = await fetch(`/api/skills/domains?candidateId=${candidateId}&tracks=${slug}`);
      const domainsData = await domainsRes.json();
      if (domainsData.domains) {
        setDomains(domainsData.domains);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchCandidateProfile = (newId: string) => {
    setCandidateId(newId);
    if (typeof window !== "undefined") {
      localStorage.setItem("cognalyze_student_id", newId);
    }
    fetchTracksAndDomains(newId);
  };

  const openSessionBrief = (domainSlug: string, href: string) => {
    const brief = generateSessionBrief(selectedTrackSlug, domainSlug, candidateId);
    setActiveBrief(brief);
    setBriefTargetHref(`${href}?track=${selectedTrackSlug}&candidateId=${candidateId}`);
    setIsBriefOpen(true);
  };

  const openFunnelRoundBrief = (roundName: string) => {
    let domainSlug = "cs_fundamentals";
    let targetHref = "/student/skills/cs-interview";

    const nameLower = roundName.toLowerCase();
    if (nameLower.includes("aptitude") || nameLower.includes("online test") || nameLower.includes("nqt")) {
      domainSlug = "aptitude_reasoning";
      targetHref = "/student/skills/aptitude";
    } else if (nameLower.includes("system design") || nameLower.includes("architecture")) {
      domainSlug = "system_design";
      targetHref = "/student/skills/system-design";
    } else if (nameLower.includes("behavioral") || nameLower.includes("hr") || nameLower.includes("bar-raiser")) {
      domainSlug = "behavioral_hr";
      targetHref = "/student/skills/behavioral";
    } else if (nameLower.includes("coding") || nameLower.includes("dsa")) {
      domainSlug = "dsa_coding";
      targetHref = "/student/skills/dsa";
    }

    const brief = generateSessionBrief(selectedTrackSlug, domainSlug, candidateId);
    setActiveBrief(brief);
    setBriefTargetHref(`${targetHref}?track=${selectedTrackSlug}&candidateId=${candidateId}`);
    setIsBriefOpen(true);
  };

  const activeTrackDetails = allTracks.find(t => t.slug === selectedTrackSlug) || allTracks[2] || allTracks[0];
  const currentProfile = getStudentProfile(candidateId);
  const dailyPlan = getDailyAdaptivePlan(candidateId, selectedTrackSlug);

  // ══════════════════════════════════════════════════════════════════════
  // LEVEL 2: DYNAMIC "WHAT TO PRACTICE NOW" (SINGLE DOMINANT RECOMMENDATION)
  // ══════════════════════════════════════════════════════════════════════
  let recommendedNow = {
    domainName: "System Design",
    domainSlug: "system_design",
    focusTitle: "Failure Recovery & Cache Invalidation",
    reason: "Your architecture is strong, but your last two sessions showed difficulty handling service failure under high concurrency.",
    estimatedMinutes: 25,
    difficulty: selectedTrackSlug === "product_faang" ? "L5 Senior FAANG" : "L4 Mid-Tier",
    targetHref: "/student/skills/system-design"
  };

  if (candidateId === "student_a") {
    recommendedNow = {
      domainName: "DSA Coding Arena",
      domainSlug: "dsa_coding",
      focusTitle: "Sliding Window Pattern Recognition",
      reason: "Your recent submissions show hesitation identifying the sliding-window invariant under interview time constraints.",
      estimatedMinutes: 30,
      difficulty: "L4 Mid-Tier",
      targetHref: "/student/skills/dsa"
    };
  } else if (candidateId === "student_b") {
    recommendedNow = {
      domainName: "CS Fundamentals",
      domainSlug: "cs_fundamentals",
      focusTitle: "SQL Optimization & B-Tree Leftmost Prefix",
      reason: "Algorithms are verified, but your last technical session had gaps in composite index ordering and execution plans.",
      estimatedMinutes: 20,
      difficulty: "L4 Mid-Tier",
      targetHref: "/student/skills/cs-interview"
    };
  } else if (selectedTrackSlug === "service_mass") {
    recommendedNow = {
      domainName: "Aptitude & Speed Assessment",
      domainSlug: "aptitude_reasoning",
      focusTitle: "Percentages & Speed Calculation Under 60s",
      reason: "Mass campus hiring rounds eliminate 65%+ on initial quantitative speed gates. Practice 60s rapid calculation.",
      estimatedMinutes: 20,
      difficulty: "L3 Foundational",
      targetHref: "/student/skills/aptitude"
    };
  }

  // 6 Primary Practice Domains
  const domainCardConfig = [
    { slug: "dsa_coding", name: "DSA Coding", icon: "⚡", href: "/student/skills/dsa" },
    { slug: "cs_fundamentals", name: "CS Fundamentals", icon: "💻", href: "/student/skills/cs-interview" },
    { slug: "system_design", name: "System Design", icon: "🏗️", href: "/student/skills/system-design" },
    { slug: "behavioral_hr", name: "Behavioral & HR", icon: "🤝", href: "/student/skills/behavioral" },
    { slug: "aptitude_reasoning", name: "Aptitude & Reasoning", icon: "🧮", href: "/student/skills/aptitude" },
    { slug: "communication_english", name: "Spoken English", icon: "🎙️", href: "/student/skills/communication" }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── LEVEL 1: CLEAN HEADER (NO CLUTTER) ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(16px)", padding: "16px 24px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Link href="/student" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                ← Placement Copilot
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#818cf8", fontSize: 12, fontWeight: 700 }}>Practice Hub</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "white", letterSpacing: "-0.4px" }}>
              Skill Practice Hub
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
              Adaptive preparation based on your target track and current performance.
            </p>
          </div>

          {/* Compact Contextual Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            
            {/* Target Track Dropdown Control */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255, 255, 255, 0.04)", padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Target:</span>
              <select
                value={selectedTrackSlug}
                onChange={e => handleSelectTrack(e.target.value as any)}
                style={{
                  background: "transparent",
                  color: "#38bdf8",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="service_mass" style={{ background: "#0f172a", color: "white" }}>Service Mass (₹3.5–4.5 LPA)</option>
                <option value="service_elite" style={{ background: "#0f172a", color: "white" }}>Service Elite (₹6.5–9.5 LPA)</option>
                <option value="product_mid" style={{ background: "#0f172a", color: "white" }}>Product & Mid-Tier (₹12–24 LPA)</option>
                <option value="product_faang" style={{ background: "#0f172a", color: "white" }}>Tier-1 Product & FAANG (₹28L+)</option>
              </select>
            </div>

            {/* Profile Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255, 255, 255, 0.04)", padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Profile:</span>
              <select
                value={candidateId}
                onChange={e => handleSwitchCandidateProfile(e.target.value)}
                style={{
                  background: "transparent",
                  color: "#a5b4fc",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="student-demo" style={{ background: "#0f172a", color: "white" }}>Nistha (Demo)</option>
                <option value="student_a" style={{ background: "#0f172a", color: "white" }}>Student A (Strong SQL, Weak DSA)</option>
                <option value="student_b" style={{ background: "#0f172a", color: "white" }}>Student B (Strong DSA, Weak SQL)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── COMPACT TRACK CONTEXT STRIP & EXPLORE BUTTON ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10, padding: "10px 14px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc", fontWeight: 800 }}>
              {activeTrackDetails?.name || "Product Track"}
            </span>
            <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>
              {activeTrackDetails?.typical_ctc_range || "₹12–24 LPA"}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.65)" }}>
              {activeTrackDetails?.description ? activeTrackDetails.description.slice(0, 85) + "..." : "Adaptive preparation customized for this career tier."}
            </span>
          </div>

          <button
            onClick={() => setExploreTracksOpen(true)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "transparent",
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Explore All 4 Tracks ▾
          </button>
        </div>

        {/* ── LEVEL 2: WHAT TO PRACTICE NOW (SINGLE DOMINANT ACTION) ── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            borderRadius: 18,
            padding: "24px 28px",
            marginBottom: 28,
            boxShadow: "0 12px 35px -5px rgba(0, 0, 0, 0.6)",
            position: "relative"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(99, 102, 241, 0.25)", color: "#c7d2fe", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  RECOMMENDED FOR YOU RIGHT NOW
                </span>
                <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>
                  {recommendedNow.domainName}
                </span>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px", color: "white" }}>
                {recommendedNow.focusTitle}
              </h2>

              <p style={{ margin: 0, fontSize: 13, color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.5, maxWidth: 680 }}>
                {recommendedNow.reason}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, fontSize: 11, color: "#94a3b8" }}>
                <span>⏱️ <strong>{recommendedNow.estimatedMinutes} mins</strong></span>
                <span>•</span>
                <span>Level: <strong style={{ color: "#c7d2fe" }}>{recommendedNow.difficulty}</strong></span>
                <span>•</span>
                <span style={{ color: "#34d399" }}>Adaptive live follow-up probe included</span>
              </div>
            </div>

            {/* THE DOMINANT CTA */}
            <div style={{ alignSelf: "center" }}>
              <button
                onClick={() => openSessionBrief(recommendedNow.domainSlug, recommendedNow.targetHref)}
                style={{
                  padding: "13px 28px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(99, 102, 241, 0.45)",
                  transition: "all 0.15s ease"
                }}
              >
                <span>Start Practice</span>
                <span style={{ fontSize: 16 }}>➔</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── LEVEL 2.5: TODAY'S ADAPTIVE LEARNING PLAN (Section 50) ── */}
        <div style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.6))", border: "1px solid rgba(129, 140, 248, 0.35)", borderRadius: 16, padding: "20px 24px", marginBottom: 28, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(129, 140, 248, 0.25)", color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  📅 TODAY&apos;S ADAPTIVE LEARNING PLAN
                </span>
                <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>
                  Evidence-Driven Sequence
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "white" }}>
                {dailyPlan.focusTitle}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                {dailyPlan.whyToday}
              </p>
            </div>
          </div>

          {/* 4 Steps: 1. Learn ➔ 2. Practice ➔ 3. Interview ➔ 4. Re-test */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {dailyPlan.steps.map((st) => (
              <Link key={st.stepNumber} href={st.targetHref} style={{ textDecoration: "none" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", transition: "all 0.15s ease" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: st.type === "learn" ? "#38bdf8" : st.type === "practice" ? "#a855f7" : st.type === "coach" ? "#fbbf24" : st.type === "interview" ? "#10b981" : "#f43f5e" }}>
                        Step {st.stepNumber}: {st.type === "learn" ? "💡 Learn" : st.type === "practice" ? "🛠️ Practice" : st.type === "coach" ? "🎓 Coach" : st.type === "interview" ? "🎯 Interview" : "🔄 Re-test"}
                      </span>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>{st.durationMins}m</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 4, lineHeight: 1.3 }}>
                      {st.title}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                      {st.description}
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>
                    <span>{st.domainName}</span>
                    <span>Launch ➔</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── LEVEL 3: CHOOSE PRACTICE DOMAIN (COMPACT 2/3 COLUMN GRID) ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "white", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Practice Domains &amp; Evidence Readiness
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Select a specific skill domain. Each card targets your verified Student DNA evidence and readiness state.
              </p>
            </div>

            {/* Quick reference link to Company Patterns */}
            <Link href="/student/skills/patterns" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, cursor: "pointer" }}>
                🏛️ Company Patterns Bank ➔
              </span>
            </Link>
          </div>

          {/* Clean Compact Cards Grid with Readiness Badges & Mode Switchers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: 14 }}>
            {domainCardConfig.map(dom => {
              const domainStatus = getDomainStatus(candidateId, dom.slug, selectedTrackSlug);
              const readiness = getDomainReadiness(candidateId, dom.slug);
              const isWhyOpen = activeWhyDomain === dom.slug;

              return (
                <div
                  key={dom.slug}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                    transition: "border 0.15s ease"
                  }}
                >
                  <div>
                    {/* Card Top: Icon, Name & Single Primary Readiness Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{dom.icon}</span>
                        <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "white" }}>
                          {dom.name}
                        </h4>
                      </div>

                      {/* Evidence Readiness Status */}
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 6,
                          background: `${readiness.statusColor}20`,
                          color: readiness.statusColor,
                          border: `1px solid ${readiness.statusColor}40`,
                          fontWeight: 800
                        }}
                      >
                        {readiness.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Compact One-Line Focus */}
                    <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.8)", marginBottom: 4 }}>
                      <span style={{ color: "#94a3b8", fontWeight: 600 }}>Focus: </span>
                      <strong style={{ color: "white" }}>{domainStatus.focusToday.split("&")[0].trim()}</strong>
                    </div>

                    {/* Evidence Reason (Section 49) */}
                    <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.4, marginBottom: 8 }}>
                      {readiness.reason}
                    </div>

                    {/* Progressive Disclosure: Small [Why?] Toggle */}
                    {isWhyOpen ? (
                      <div style={{ marginTop: 6, padding: "8px 10px", background: "rgba(255, 255, 255, 0.03)", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.08)", fontSize: 11, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontWeight: 800, color: "#818cf8" }}>Why this:</span>
                          <button onClick={() => setActiveWhyDomain(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 10, cursor: "pointer" }}>✕</button>
                        </div>
                        {domainStatus.whyRecommended}
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveWhyDomain(dom.slug)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#818cf8",
                          fontSize: 11,
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                          fontWeight: 600
                        }}
                      >
                        Why this? ▾
                      </button>
                    )}
                  </div>

                  {/* Mode Quick Jump Row: [Learn] [Practice] [Interview] */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10, borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Link
                        href={`${dom.href}?mode=learn`}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          borderRadius: 6,
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "#cbd5e1",
                          fontSize: 10,
                          fontWeight: 700,
                          textAlign: "center",
                          textDecoration: "none"
                        }}
                      >
                        💡 Learn
                      </Link>
                      <Link
                        href={`${dom.href}?mode=practice`}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          borderRadius: 6,
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "#cbd5e1",
                          fontSize: 10,
                          fontWeight: 700,
                          textAlign: "center",
                          textDecoration: "none"
                        }}
                      >
                        🛠️ Practice
                      </Link>
                      <Link
                        href={`${dom.href}?mode=interview`}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          borderRadius: 6,
                          background: readiness.status === "READY" ? "rgba(16,185,129,0.15)" : "rgba(255, 255, 255, 0.04)",
                          border: readiness.status === "READY" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                          color: readiness.status === "READY" ? "#34d399" : "#cbd5e1",
                          fontSize: 10,
                          fontWeight: 700,
                          textAlign: "center",
                          textDecoration: "none"
                        }}
                      >
                        🎯 Interview
                      </Link>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>
                        Recommended: <strong style={{ color: readiness.statusColor }}>{readiness.recommendedModeLabel}</strong>
                      </span>

                      <button
                        onClick={() => openSessionBrief(dom.slug, dom.href)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          background: "rgba(255, 255, 255, 0.08)",
                          color: "white",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <span>Start Session</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── LEVEL 4: HIRING FUNNEL (COLLAPSIBLE ON DEMAND) ── */}
        {activeTrackDetails && (
          <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, overflow: "hidden", marginBottom: 32 }}>
            
            {/* Collapsible Header */}
            <div
              onClick={() => setFunnelExpanded(!funnelExpanded)}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                background: funnelExpanded ? "rgba(255, 255, 255, 0.03)" : "transparent"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
                    Hiring Funnel · {activeTrackDetails.name}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>
                    ({activeTrackDetails.round_structure?.length || 4} hiring rounds)
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700 }}>
                  {funnelExpanded ? "Hide Funnel ↑" : "View Funnel ↓"}
                </span>
              </div>
            </div>

            {/* Expanded Accordion Rounds */}
            {funnelExpanded && (
              <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "14px 0 12px" }}>
                  Real rounds verified against 2026 hiring drives. Click any round to inspect or launch round practice.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeTrackDetails.round_structure?.map((round, idx) => {
                    const isExpanded = expandedRoundIdx === idx;

                    return (
                      <div
                        key={round.round_number}
                        style={{
                          borderRadius: 10,
                          background: isExpanded ? "rgba(99, 102, 241, 0.1)" : "rgba(255, 255, 255, 0.02)",
                          border: isExpanded ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255, 255, 255, 0.06)",
                          padding: 12
                        }}
                      >
                        <div
                          onClick={() => setExpandedRoundIdx(isExpanded ? null : idx)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(255, 255, 255, 0.08)", color: "white", fontWeight: 700 }}>
                              Round {round.round_number}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                              {round.name}
                            </span>
                            {round.is_hard_gate && (
                              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(239, 68, 68, 0.2)", color: "#f87171", fontWeight: 800 }}>
                                HARD GATE
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                              {round.typical_elimination_rate}
                            </span>
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* Accordion Expanded Detail */}
                        {isExpanded && (
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.5 }}>
                              {round.description}
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "#a5b4fc" }}>
                                Key Focus: {round.key_focus_areas?.[0] || "Foundational reasoning"}
                              </span>
                              <button
                                onClick={() => openFunnelRoundBrief(round.name)}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 6,
                                  border: "none",
                                  background: "linear-gradient(135deg, #6366f1, #38bdf8)",
                                  color: "white",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: "pointer"
                                }}
                              >
                                Practice This Round ➔
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── ON-DEMAND MODAL: EXPLORE TRACKS (PROGRESSIVE DISCLOSURE) ── */}
      {exploreTracksOpen && (
        <div
          onClick={() => setExploreTracksOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              background: "#0c1322",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 18,
              padding: 24,
              color: "white",
              maxHeight: "85vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>
                  Compare Target Hiring Tracks
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                  Selecting a track adapts session difficulty, follow-ups, and question depth across all practice domains.
                </p>
              </div>
              <button
                onClick={() => setExploreTracksOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allTracks.map(track => {
                const isSelected = track.slug === selectedTrackSlug;
                return (
                  <div
                    key={track.slug}
                    onClick={() => {
                      handleSelectTrack(track.slug as any);
                      setExploreTracksOpen(false);
                    }}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: isSelected ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.02)",
                      border: isSelected ? "2px solid #818cf8" : "1px solid rgba(255, 255, 255, 0.08)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 14 }}>{track.name}</strong>
                        <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>{track.typical_ctc_range}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.4 }}>
                        {track.description}
                      </div>
                    </div>

                    <button
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: isSelected ? "#6366f1" : "rgba(255, 255, 255, 0.08)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {isSelected ? "✓ Active" : "Select Track"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTEXTUAL SESSION BRIEF MODAL ── */}
      <SessionBriefModal
        brief={activeBrief}
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        targetHref={briefTargetHref}
      />
    </div>
  );
}
