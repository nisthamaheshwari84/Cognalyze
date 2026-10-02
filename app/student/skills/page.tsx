"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CompanyTrack, SkillDomain } from "@/lib/skill-hub-store";
import {
  generateSessionBrief,
  getDomainStatus,
  getStudentProfile,
  registerStudentAdaptiveProfile,
  getDailyAdaptivePlan,
  getDomainReadiness,
  SessionBrief
} from "@/lib/skills/adaptive-engine";
import SessionBriefModal from "@/components/skills/SessionBriefModal";
import { getAdaptiveRecommendation } from "@/lib/skills/candidate-history";
import AppNav from "@/components/AppNav";

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
  const [briefTargetHref, setBriefTargetHref] = useState<string>("");
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [userProfileName, setUserProfileName] = useState<string>("");

  useEffect(() => {
    async function initUser() {
      try {
        const sessRes = await fetch("/api/auth/session");
        const sess = await sessRes.json();
        if (sess.authenticated && sess.user?.id) {
          setCandidateId(sess.user.id);
          const name = sess.studentProfile?.fullName || sess.user.fullName || "My Profile";
          setUserProfileName(name);

          if (typeof window !== "undefined") {
            localStorage.setItem("cognalyze_student_id", sess.user.id);
          }

          if (sess.studentProfile) {
            const strong = (sess.studentProfile.skills || [])
              .filter((s: any) => s.level === "Advanced" || s.level === "Expert")
              .map((s: any) => s.name || s);
            const weak = (sess.studentProfile.skills || [])
              .filter((s: any) => s.level === "Beginner")
              .map((s: any) => s.name || s);
            const claims = (sess.studentProfile.projects || []).map((p: any) => `Built ${p.title || p.name || "Project"}`);

            registerStudentAdaptiveProfile({
              id: sess.user.id,
              name,
              strongAreas: strong.length > 0 ? strong : ["Core Problem Solving"],
              weakAreas: weak.length > 0 ? weak : ["System Depth"],
              verifiedClaims: claims,
            });
          }

          fetchTracksAndDomains(sess.user.id);
          return;
        }
      } catch (e) {
        // Fallback
      }
      fetchTracksAndDomains("student-demo");
    }
    initUser();
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
    if (nameLower.includes("communication") || nameLower.includes("spoken english") || nameLower.includes("english")) {
      domainSlug = "communication_english";
      targetHref = "/student/skills/communication";
    } else if (nameLower.includes("aptitude") || nameLower.includes("online test") || nameLower.includes("nqt") || nameLower.includes("reasoning")) {
      domainSlug = "aptitude_reasoning";
      targetHref = "/student/skills/aptitude";
    } else if (nameLower.includes("system design") || nameLower.includes("architecture") || nameLower.includes("lld") || nameLower.includes("hld")) {
      domainSlug = "system_design";
      targetHref = "/student/skills/system-design";
    } else if (nameLower.includes("behavioral") || nameLower.includes("culture") || nameLower.includes("leadership") || nameLower.includes("bar-raiser")) {
      domainSlug = "behavioral_hr";
      targetHref = "/student/skills/behavioral";
    } else if (nameLower.includes("coding") || nameLower.includes("dsa") || nameLower.includes("algorithmic") || nameLower.includes("phone screen") || nameLower.includes("oa")) {
      domainSlug = "dsa_coding";
      targetHref = "/student/skills/dsa";
    } else if (nameLower.includes("hr")) {
      domainSlug = "behavioral_hr";
      targetHref = "/student/skills/behavioral";
    } else {
      domainSlug = "cs_fundamentals";
      targetHref = "/student/skills/cs-interview";
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
  const recommendedNow = getAdaptiveRecommendation(candidateId, selectedTrackSlug);

  // 6 Primary Practice Domains
  const domainCardConfig = [
    { slug: "dsa_coding", name: "DSA Coding", icon: "⚡", href: "/student/skills/dsa" },
    { slug: "cs_fundamentals", name: "CS Fundamentals", icon: "💻", href: "/student/skills/cs-interview" },
    { slug: "system_design", name: "System Design", icon: "🏗️", href: "/student/skills/system-design" },
    { slug: "behavioral_hr", name: "Behavioral & HR", icon: "🤝", href: "/student/skills/behavioral" },
    { slug: "aptitude_reasoning", name: "Aptitude & Reasoning", icon: "🧮", href: "/student/skills/aptitude" },
    { slug: "communication_english", name: "Spoken English", icon: "🎙️", href: "/student/skills/communication" }
  ];

  const getReadinessSemanticStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case "READY":
      case "VERIFIED":
      case "HIGH":
        return { bg: "#EAF4EE", text: "#2E7D5B", border: "#C8E4D3" };
      case "NEEDS_WORK":
      case "MODERATE":
      case "PRACTICING":
        return { bg: "#FEF7ED", text: "#B7791F", border: "#F8D8A7" };
      case "IN_PROGRESS":
      case "ACTIVE":
        return { bg: "#EFF4FE", text: "#356AE6", border: "#D2E0FB" };
      default:
        return { bg: "#F6F5F1", text: "#667085", border: "#E4E1DA" };
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />
      {/* ── LEVEL 1: CLEAN HEADER ── */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "14px 24px", position: "sticky", top: 56, zIndex: 30, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Link href="/student" style={{ color: "#667085", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                ← Placement Copilot
              </Link>
              <span style={{ color: "#98A2B3" }}>/</span>
              <span style={{ color: "#356AE6", fontSize: 12, fontWeight: 700 }}>Practice Hub</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.03em" }}>
              Skill Practice Hub
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#667085" }}>
              Adaptive preparation calibrated to target hiring tiers and verified evidence.
            </p>
          </div>

          {/* Contextual Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            
            {/* Target Track Dropdown Control */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F6F5F1", padding: "6px 12px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
              <span style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>Target:</span>
              <select
                value={selectedTrackSlug}
                onChange={e => handleSelectTrack(e.target.value as any)}
                style={{
                  background: "transparent",
                  color: "#162A43",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="service_mass" style={{ background: "#FFFFFF", color: "#17191C" }}>Service Mass (₹3.5–4.5 LPA)</option>
                <option value="service_elite" style={{ background: "#FFFFFF", color: "#17191C" }}>Service Elite (₹6.5–9.5 LPA)</option>
                <option value="product_mid" style={{ background: "#FFFFFF", color: "#17191C" }}>Product &amp; Mid-Tier (₹12–24 LPA)</option>
                <option value="product_faang" style={{ background: "#FFFFFF", color: "#17191C" }}>Tier-1 Product &amp; FAANG (₹28L+)</option>
              </select>
            </div>

            {/* Profile Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F6F5F1", padding: "6px 12px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
              <span style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>Profile:</span>
              <select
                value={candidateId}
                onChange={e => handleSwitchCandidateProfile(e.target.value)}
                style={{
                  background: "transparent",
                  color: "#162A43",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {userProfileName && (
                  <option value={candidateId} style={{ background: "#FFFFFF", color: "#17191C" }}>
                    {userProfileName} (My DNA)
                  </option>
                )}
                <option value="student-demo" style={{ background: "#FFFFFF", color: "#17191C" }}>Standard Benchmark</option>
                <option value="student_a" style={{ background: "#FFFFFF", color: "#17191C" }}>Benchmark A (SQL Focus)</option>
                <option value="student_b" style={{ background: "#FFFFFF", color: "#17191C" }}>Benchmark B (DSA Focus)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── COMPACT TRACK CONTEXT STRIP & EXPLORE BUTTON ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10, padding: "10px 16px", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700 }}>
              {activeTrackDetails?.name || "Product Track"}
            </span>
            <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>
              {activeTrackDetails?.typical_ctc_range || "₹12–24 LPA"}
            </span>
            <span style={{ fontSize: 12, color: "#667085" }}>
              {activeTrackDetails?.description ? activeTrackDetails.description.slice(0, 85) + "..." : "Adaptive preparation customized for this career tier."}
            </span>
          </div>

          <button
            onClick={() => setExploreTracksOpen(true)}
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "1px solid #E4E1DA",
              background: "#FFFFFF",
              color: "#17191C",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Explore All 4 Tracks ▾
          </button>
        </div>

        {/* ── LEVEL 2: WHAT TO PRACTICE NOW (SINGLE DOMINANT ACTION) ── */}
        <div
          style={{
            background: "#162A43",
            borderRadius: 12,
            padding: "24px 28px",
            marginBottom: 24,
            boxShadow: "0 4px 16px rgba(22, 42, 67, 0.15)",
            position: "relative",
            color: "#FFFFFF"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "rgba(255, 255, 255, 0.15)", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.25)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Recommended For You Right Now
                </span>
                <span style={{ fontSize: 11, color: "#93C5FD", fontWeight: 700 }}>
                  {recommendedNow.domainName}
                </span>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px", color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {recommendedNow.focusTitle}
              </h2>

              <p style={{ margin: 0, fontSize: 13, color: "#D2E0FB", lineHeight: 1.5, maxWidth: 680 }}>
                {recommendedNow.reason}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, fontSize: 11, color: "#94A3B8" }}>
                <span>⏱️ <strong style={{ color: "#FFFFFF" }}>{recommendedNow.estimatedMinutes} mins</strong></span>
                <span>•</span>
                <span>Level: <strong style={{ color: "#FFFFFF" }}>{recommendedNow.difficulty}</strong></span>
                <span>•</span>
                <span style={{ color: "#86EFAC" }}>✓ Adaptive live follow-up probe included</span>
              </div>
            </div>

            {/* THE DOMINANT CTA */}
            <div style={{ alignSelf: "center" }}>
              <button
                onClick={() => openSessionBrief(recommendedNow.domainSlug, recommendedNow.targetHref)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 7,
                  border: "none",
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(53, 106, 230, 0.35)",
                  transition: "all 0.15s ease"
                }}
              >
                <span>Start Practice</span>
                <span style={{ fontSize: 14 }}>➔</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── LEVEL 2.5: TODAY'S ADAPTIVE LEARNING PLAN ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 24px", marginBottom: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700, textTransform: "uppercase" }}>
                  📅 Today&apos;s Adaptive Learning Plan
                </span>
                <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>
                  Evidence-Driven Sequence
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.02em" }}>
                {dailyPlan.focusTitle}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#667085" }}>
                {dailyPlan.whyToday}
              </p>
            </div>
          </div>

          {/* 4 Steps: 1. Learn ➔ 2. Practice ➔ 3. Interview ➔ 4. Re-test */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {dailyPlan.steps.map((st) => {
              const stepColor = st.type === "learn" ? "#356AE6" : st.type === "practice" ? "#B7791F" : st.type === "coach" ? "#356AE6" : st.type === "interview" ? "#2E7D5B" : "#C24141";
              const stepLabel = st.type === "learn" ? "💡 Learn" : st.type === "practice" ? "🛠️ Practice" : st.type === "coach" ? "🎓 Coach" : st.type === "interview" ? "🎯 Interview" : "🔄 Re-test";

              return (
                <Link key={st.stepNumber} href={st.targetHref} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", transition: "all 0.15s ease" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: stepColor }}>
                          Step {st.stepNumber}: {stepLabel}
                        </span>
                        <span style={{ fontSize: 10, color: "#667085" }}>{st.durationMins}m</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43", marginBottom: 4, lineHeight: 1.3 }}>
                        {st.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#667085", lineHeight: 1.4 }}>
                        {st.description}
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#356AE6", fontWeight: 700 }}>
                      <span>{st.domainName}</span>
                      <span>Launch ➔</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── LEVEL 3: CHOOSE PRACTICE DOMAIN (COMPACT 2/3 COLUMN GRID) ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.02em" }}>
                Practice Domains &amp; Evidence Readiness
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#667085" }}>
                Select a specific skill domain. Each card targets verified Student DNA evidence and readiness.
              </p>
            </div>

            {/* Quick reference link to Company Patterns */}
            <Link href="/student/skills/patterns" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 700, cursor: "pointer" }}>
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
              const badgeStyle = getReadinessSemanticStyle(readiness.status);

              return (
                <div
                  key={dom.slug}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    transition: "border 0.15s ease"
                  }}
                >
                  <div>
                    {/* Card Top: Icon, Name & Single Primary Readiness Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{dom.icon}</span>
                        <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#162A43" }}>
                          {dom.name}
                        </h4>
                      </div>

                      {/* Evidence Readiness Status */}
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 5,
                          background: badgeStyle.bg,
                          color: badgeStyle.text,
                          border: `1px solid ${badgeStyle.border}`,
                          fontWeight: 700,
                          textTransform: "uppercase"
                        }}
                      >
                        {readiness.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Compact One-Line Focus */}
                    <div style={{ fontSize: 12, color: "#17191C", marginBottom: 4 }}>
                      <span style={{ color: "#667085", fontWeight: 600 }}>Focus: </span>
                      <strong style={{ color: "#162A43", fontWeight: 700 }}>{domainStatus.focusToday.split("&")[0].trim()}</strong>
                    </div>

                    {/* Evidence Reason */}
                    <div style={{ fontSize: 11, color: "#667085", lineHeight: 1.4, marginBottom: 8 }}>
                      {readiness.reason}
                    </div>

                    {/* Progressive Disclosure: Small [Why?] Toggle */}
                    {isWhyOpen ? (
                      <div style={{ marginTop: 6, padding: "8px 10px", background: "#F6F5F1", borderRadius: 7, border: "1px solid #E4E1DA", fontSize: 11, color: "#17191C", lineHeight: 1.4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, color: "#356AE6" }}>Why this:</span>
                          <button onClick={() => setActiveWhyDomain(null)} style={{ background: "transparent", border: "none", color: "#667085", fontSize: 10, cursor: "pointer" }}>✕</button>
                        </div>
                        {domainStatus.whyRecommended}
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveWhyDomain(dom.slug)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#356AE6",
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10, borderTop: "1px solid #E4E1DA" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Link
                        href={`${dom.href}?mode=learn`}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          borderRadius: 7,
                          background: "#F6F5F1",
                          border: "1px solid #E4E1DA",
                          color: "#17191C",
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
                          padding: "6px 8px",
                          borderRadius: 7,
                          background: "#F6F5F1",
                          border: "1px solid #E4E1DA",
                          color: "#17191C",
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
                          padding: "6px 8px",
                          borderRadius: 7,
                          background: readiness.status === "READY" ? "#EAF4EE" : "#F6F5F1",
                          border: readiness.status === "READY" ? "1px solid #C8E4D3" : "1px solid #E4E1DA",
                          color: readiness.status === "READY" ? "#2E7D5B" : "#17191C",
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
                      <span style={{ fontSize: 10, color: "#667085" }}>
                        Recommended: <strong style={{ color: badgeStyle.text }}>{readiness.recommendedModeLabel}</strong>
                      </span>

                      <button
                        onClick={() => openSessionBrief(dom.slug, dom.href)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 7,
                          border: "none",
                          background: "#356AE6",
                          color: "#FFFFFF",
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
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, overflow: "hidden", marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            
            {/* Collapsible Header */}
            <div
              onClick={() => setFunnelExpanded(!funnelExpanded)}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                background: funnelExpanded ? "#F9F8F5" : "#FFFFFF"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                    Hiring Funnel · {activeTrackDetails.name}
                  </span>
                  <span style={{ fontSize: 11, color: "#667085", marginLeft: 8 }}>
                    ({activeTrackDetails.round_structure?.length || 4} hiring rounds)
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 700 }}>
                  {funnelExpanded ? "Hide Funnel ↑" : "View Funnel ↓"}
                </span>
              </div>
            </div>

            {/* Expanded Accordion Rounds */}
            {funnelExpanded && (
              <div style={{ padding: "0 20px 20px", borderTop: "1px solid #E4E1DA" }}>
                <p style={{ fontSize: 12, color: "#667085", margin: "14px 0 12px" }}>
                  Real rounds verified against hiring drives. Click any round to inspect or launch round practice.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeTrackDetails.round_structure?.map((round, idx) => {
                    const isExpanded = expandedRoundIdx === idx;

                    return (
                      <div
                        key={round.round_number}
                        style={{
                          borderRadius: 8,
                          background: isExpanded ? "#EFF4FE" : "#F9F8F5",
                          border: isExpanded ? "1px solid #356AE6" : "1px solid #E4E1DA",
                          padding: 12
                        }}
                      >
                        <div
                          onClick={() => setExpandedRoundIdx(isExpanded ? null : idx)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700 }}>
                              Round {round.round_number}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                              {round.name}
                            </span>
                            {round.is_hard_gate && (
                              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FDF2F2", color: "#C24141", border: "1px solid #F8C8C8", fontWeight: 800 }}>
                                HARD GATE
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 11, color: "#B7791F", fontWeight: 700 }}>
                              {round.typical_elimination_rate}
                            </span>
                            <span style={{ fontSize: 12, color: "#667085" }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* Accordion Expanded Detail */}
                        {isExpanded && (
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #E4E1DA" }}>
                            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#667085", lineHeight: 1.5 }}>
                              {round.description}
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 600 }}>
                                Key Focus: {round.key_focus_areas?.[0] || "Foundational reasoning"}
                              </span>
                              <button
                                onClick={() => openFunnelRoundBrief(round.name)}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 7,
                                  border: "none",
                                  background: "#356AE6",
                                  color: "#FFFFFF",
                                  fontSize: 11,
                                  fontWeight: 700,
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
            background: "rgba(22, 42, 67, 0.45)",
            backdropFilter: "blur(6px)",
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
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 12,
              padding: 24,
              color: "#17191C",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#162A43" }}>
                  Compare Target Hiring Tracks
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#667085" }}>
                  Selecting a track adapts session difficulty, follow-ups, and question depth across all practice domains.
                </p>
              </div>
              <button
                onClick={() => setExploreTracksOpen(false)}
                style={{ background: "transparent", border: "none", color: "#667085", fontSize: 16, cursor: "pointer" }}
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
                      borderRadius: 10,
                      background: isSelected ? "#EFF4FE" : "#F9F8F5",
                      border: isSelected ? "2px solid #356AE6" : "1px solid #E4E1DA",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 14, color: "#162A43" }}>{track.name}</strong>
                        <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>{track.typical_ctc_range}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.4 }}>
                        {track.description}
                      </div>
                    </div>

                    <button
                      style={{
                        padding: "6px 12px",
                        borderRadius: 7,
                        border: isSelected ? "none" : "1px solid #E4E1DA",
                        background: isSelected ? "#356AE6" : "#FFFFFF",
                        color: isSelected ? "#FFFFFF" : "#17191C",
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
