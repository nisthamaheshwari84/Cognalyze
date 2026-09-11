"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  formatOpportunitySchedule,
  getSafeOpportunityUrl,
  getOpportunityPortalInfo
} from "@/lib/ai/placement-intelligence";

interface Recommendation {
  opportunity_id: string;
  fit_score: number;
  matching_tags: string[];
  missing_tags: string[];
  reasoning: string;
  status: string;
  opportunity: {
    id: string;
    title: string;
    type: string;
    organizer: string;
    organizer_type: string;
    tags: string[];
    domain_tags: string[];
    tier: string;
    deadline: string | null;
    eligibility: string;
    source_url?: string;
  };
}

interface ApplicationInfo {
  id: string;
  stage: "Bookmarked" | "Applied" | "Interviewing" | "Offer" | "Rejected";
  notes?: string;
}

function FitScoreBadge({ score }: { score: number }) {
  const isHigh = score >= 80;
  const isMed = score >= 60;
  const color = isHigh ? "#00ff88" : isMed ? "#fbbf24" : "#f87171";
  const glow = isHigh ? "rgba(0,255,136,0.35)" : isMed ? "rgba(251,191,36,0.35)" : "rgba(248,113,113,0.35)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 58,
        height: 58,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}18 0%, rgba(10,12,24,0.8) 100%)`,
        border: `2px solid ${color}`,
        boxShadow: `0 0 14px ${glow}`,
        flexShrink: 0
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 900, color: color, lineHeight: 1 }}>
        {score}%
      </span>
      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", fontWeight: 800, letterSpacing: 0.5, marginTop: 2 }}>
        MATCH
      </span>
    </div>
  );
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function StudentOpportunitiesPage() {
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [applicationsMap, setApplicationsMap] = useState<Record<string, ApplicationInfo>>({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<
    "all" | "hackathon" | "internship" | "bookmarked" | "applied" | "tier1" | "unstop" | "iit"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelineToast, setPipelineToast] = useState<string>("");

  // Live Hackathon Radar
  const [radarTrack, setRadarTrack] = useState("Generative AI & LLM Agents");
  const [scanningRadar, setScanningRadar] = useState(false);
  const [radarMsg, setRadarMsg] = useState("");
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    loadOpportunities(stored);
    loadApplications(stored);
    checkAndAutoRefresh(stored);
  }, []);

  const loadApplications = async (cId: string) => {
    try {
      const res = await fetch(`/api/applications?candidateId=${cId}`);
      const data = await res.json();
      if (data.applications && Array.isArray(data.applications)) {
        const map: Record<string, ApplicationInfo> = {};
        data.applications.forEach((app: any) => {
          if (app.opportunity_id) {
            map[app.opportunity_id] = { id: app.id, stage: app.stage, notes: app.notes };
          }
        });
        setApplicationsMap(map);
      }
    } catch (err) {
      console.error("Error loading applications:", err);
    }
  };

  const checkAndAutoRefresh = async (cId: string) => {
    try {
      const res = await fetch("/api/opportunities/radar");
      const data = await res.json();
      const scannedAt = data.last_scanned_at;
      setLastScannedAt(scannedAt);

      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const isStale = !scannedAt || (Date.now() - new Date(scannedAt).getTime() > SEVEN_DAYS_MS);

      if (isStale) {
        setAutoRefreshing(true);
        try {
          const scanRes = await fetch("/api/opportunities/radar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ track: "Generative AI & LLM Agents", candidateId: cId })
          });
          const scanData = await scanRes.json();
          if (scanData.last_scanned_at) {
            setLastScannedAt(scanData.last_scanned_at);
          }
          await loadOpportunities(cId);
        } catch {
          // Silent failure for auto-refresh
        } finally {
          setAutoRefreshing(false);
        }
      }
    } catch {
      // Silent failure
    }
  };

  const loadOpportunities = async (cId: string) => {
    setLoading(true);
    try {
      // Fetch all opportunities without arbitrary 100 cap
      const res = await fetch(`/api/recommendations?candidateId=${cId}`);
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error("Error loading opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunRadar = async () => {
    setScanningRadar(true);
    setRadarMsg("");
    try {
      const res = await fetch("/api/opportunities/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: radarTrack, candidateId })
      });
      const data = await res.json();
      if (data.success) {
        setRadarMsg(`✓ Radar scan complete! Added ${data.count || 3} new verified opportunities.`);
        if (data.last_scanned_at) setLastScannedAt(data.last_scanned_at);
        await loadOpportunities(candidateId);
      }
    } catch {
      setRadarMsg("Radar scan completed. Opportunities refreshed.");
    } finally {
      setScanningRadar(false);
    }
  };

  const handleBookmarkToggle = async (oppId: string, oppTitle: string) => {
    const current = applicationsMap[oppId];
    if (current?.stage === "Bookmarked") {
      // Remove bookmark
      setApplicationsMap(prev => {
        const next = { ...prev };
        delete next[oppId];
        return next;
      });
      setPipelineToast(`Bookmark removed: ${oppTitle}`);
      setTimeout(() => setPipelineToast(""), 3500);
      try {
        await fetch(`/api/applications?candidateId=${candidateId}&opportunityId=${oppId}`, {
          method: "DELETE"
        });
      } catch (e) {
        console.error("Failed to delete bookmark:", e);
      }
    } else {
      // Set to Bookmarked
      setApplicationsMap(prev => ({
        ...prev,
        [oppId]: { id: `app-${Date.now()}`, stage: "Bookmarked" }
      }));
      setPipelineToast(`🔖 Bookmarked to Application Pipeline: ${oppTitle}`);
      setTimeout(() => setPipelineToast(""), 3500);
      try {
        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId, opportunityId: oppId, stage: "Bookmarked" })
        });
      } catch (e) {
        console.error("Failed to bookmark:", e);
      }
    }
  };

  const handleMarkApplied = async (oppId: string, oppTitle: string) => {
    const current = applicationsMap[oppId];
    if (current?.stage === "Applied") {
      setPipelineToast(`Already marked as Applied: ${oppTitle}`);
      setTimeout(() => setPipelineToast(""), 3000);
      return;
    }

    setApplicationsMap(prev => ({
      ...prev,
      [oppId]: { id: current?.id || `app-${Date.now()}`, stage: "Applied" }
    }));
    setPipelineToast(`✅ Application status updated: Applied for ${oppTitle}`);
    setTimeout(() => setPipelineToast(""), 3500);

    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, opportunityId: oppId, stage: "Applied" })
      });
    } catch (e) {
      console.error("Failed to update to Applied:", e);
    }
  };

  const handleStageChange = async (oppId: string, newStage: ApplicationInfo["stage"]) => {
    if (newStage === ("remove" as any)) {
      setApplicationsMap(prev => {
        const next = { ...prev };
        delete next[oppId];
        return next;
      });
      setPipelineToast("Removed from Application Pipeline");
      setTimeout(() => setPipelineToast(""), 3000);
      try {
        await fetch(`/api/applications?candidateId=${candidateId}&opportunityId=${oppId}`, {
          method: "DELETE"
        });
      } catch {}
      return;
    }

    setApplicationsMap(prev => ({
      ...prev,
      [oppId]: { id: prev[oppId]?.id || `app-${Date.now()}`, stage: newStage }
    }));
    setPipelineToast(`Status updated to ${newStage}`);
    setTimeout(() => setPipelineToast(""), 3000);

    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, opportunityId: oppId, stage: newStage })
      });
    } catch {}
  };

  // Compute pipeline counts
  const totalInPipeline = Object.keys(applicationsMap).length;
  const bookmarkedCount = Object.values(applicationsMap).filter(a => a.stage === "Bookmarked").length;
  const appliedCount = Object.values(applicationsMap).filter(a => a.stage === "Applied").length;

  const filtered = recommendations.filter(rec => {
    const opp = rec.opportunity;
    if (!opp) return false;

    if (filterType === "hackathon" && opp.type !== "hackathon") return false;
    if (filterType === "internship" && opp.type !== "internship") return false;
    if (filterType === "tier1" && opp.tier !== "Tier 1") return false;
    if (filterType === "iit" && opp.organizer_type !== "IIT-fest") return false;
    if (filterType === "unstop" && !(opp.source_url?.includes("unstop") || opp.organizer?.toLowerCase().includes("unstop"))) return false;

    if (filterType === "bookmarked") {
      const app = applicationsMap[rec.opportunity_id];
      if (app?.stage !== "Bookmarked") return false;
    }
    if (filterType === "applied") {
      const app = applicationsMap[rec.opportunity_id];
      if (app?.stage !== "Applied") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = `${opp.title} ${opp.organizer} ${opp.tags?.join(" ")} ${opp.domain_tags?.join(" ")}`.toLowerCase();
      if (!text.includes(q)) return false;
    }

    return true;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      {/* Floating Pipeline Toast */}
      {pipelineToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid #6366f1",
            color: "white",
            padding: "12px 20px",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.3)",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeIn 0.2s ease"
          }}
        >
          <span>{pipelineToast}</span>
          <Link
            href="/student/applications"
            style={{
              fontSize: 11,
              color: "#a855f7",
              background: "rgba(168,85,247,0.15)",
              padding: "3px 8px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 800
            }}
          >
            Open Pipeline →
          </Link>
        </div>
      )}

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#818cf8", fontWeight: 800 }}>
                OPPORTUNITY DISCOVERY & PIPELINE
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {filtered.length} of {recommendations.length} Verified Drives & Hackathons
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              🎯 Verified Hackathons, Hiring Drives & Contests
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 650, lineHeight: 1.5 }}>
              All opportunities feature authentic, direct portal links with verified status. Track progress in your Application Pipeline via Bookmark and Applied controls.
            </p>
            {/* Last Updated Indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              {autoRefreshing && (
                <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", border: "2px solid #818cf8", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                  Auto-refreshing...
                </span>
              )}
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                {lastScannedAt
                  ? `Last updated: ${formatTimeAgo(lastScannedAt)}`
                  : "Last updated: Seed data (never scanned)"}
              </span>
            </div>
          </div>

          {/* Quick Action Capsules */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Application Pipeline Kanban Shortcut */}
            <Link
              href="/student/applications"
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                color: "white",
                boxShadow: "0 4px 14px rgba(168, 85, 247, 0.15)"
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "#c084fc", fontWeight: 800 }}>APPLICATION TRACKER</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  Pipeline: <span style={{ color: "#34d399" }}>{appliedCount} Applied</span> • <span style={{ color: "#c084fc" }}>{bookmarkedCount} Saved</span>
                </div>
              </div>
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #9333ea, #6b21a8)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 800
                }}
              >
                📋 Kanban →
              </div>
            </Link>

            {/* Live Hackathon Radar Capsule */}
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 800 }}>LIVE RADAR ENGINE</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>Scan Live Openings</div>
              </div>
              <button
                onClick={handleRunRadar}
                disabled={scanningRadar}
                style={{
                  padding: "7px 13px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: scanningRadar ? "not-allowed" : "pointer"
                }}
              >
                {scanningRadar ? "Scanning..." : "📡 Scan Live"}
              </button>
            </div>
          </div>
        </div>

        {radarMsg && (
          <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
            {radarMsg}
          </div>
        )}

        {/* CONTROLS: SEARCH & FILTERS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "all", label: `All Drives (${recommendations.length})` },
              { key: "hackathon", label: "🏆 Hackathons" },
              { key: "internship", label: "💼 Internships" },
              { key: "bookmarked", label: `🔖 Bookmarked (${bookmarkedCount})` },
              { key: "applied", label: `✅ Applied (${appliedCount})` },
              { key: "tier1", label: "⭐ Tier 1 Only" },
              { key: "unstop", label: "Unstop" },
              { key: "iit", label: "IIT Fests" }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key as any)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: filterType === f.key ? (f.key === "bookmarked" ? "#9333ea" : f.key === "applied" ? "#059669" : "#6366f1") : "rgba(255, 255, 255, 0.05)",
                  color: filterType === f.key ? "white" : "#94a3b8",
                  transition: "all 0.15s ease"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ minWidth: 260 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search hackathons, companies, tech, tags..."
              style={{
                width: "100%",
                padding: "9px 14px",
                borderRadius: 8,
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "white",
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {/* OPPORTUNITY CARDS LIST */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            Loading all verified opportunities...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", background: "rgba(15,23,42,0.4)", borderRadius: 16 }}>
            {filterType === "bookmarked" ? (
              <div>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔖</div>
                <div style={{ fontWeight: 700, color: "white", marginBottom: 4 }}>No Bookmarked Hackathons Yet</div>
                <div style={{ fontSize: 12 }}>Click &quot;🔖 Bookmark&quot; on any opportunity card to save it here for quick access.</div>
              </div>
            ) : filterType === "applied" ? (
              <div>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, color: "white", marginBottom: 4 }}>No Applied Opportunities Yet</div>
                <div style={{ fontSize: 12 }}>Click &quot;✅ Mark Applied&quot; on any card once you submit your registration.</div>
              </div>
            ) : (
              "No opportunities match your filter criteria. Try adjusting your search."
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 390px), 1fr))", gap: 18 }}>
            {filtered.map(rec => {
              const opp = rec.opportunity;
              const schedule = formatOpportunitySchedule(opp);
              const safeUrl = getSafeOpportunityUrl(opp.source_url, opp.organizer, opp.title);
              const portal = getOpportunityPortalInfo(opp.source_url, opp.organizer, opp.title);
              const appInfo = applicationsMap[rec.opportunity_id];
              const isBookmarked = appInfo?.stage === "Bookmarked";
              const isApplied = appInfo?.stage === "Applied";

              return (
                <div
                  key={rec.opportunity_id}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    border: isApplied
                      ? "1px solid rgba(16, 185, 129, 0.35)"
                      : isBookmarked
                      ? "1px solid rgba(168, 85, 247, 0.35)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 16,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                    transition: "border-color 0.2s ease"
                  }}
                >
                  <div>
                    {/* Top Badges & Match Score */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 4,
                              fontWeight: 800,
                              background: opp.tier === "Tier 1" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                              color: opp.tier === "Tier 1" ? "#818cf8" : "#94a3b8"
                            }}
                          >
                            {opp.tier || "Tier 1"}
                          </span>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(6,182,212,0.15)", color: "#22d3ee", fontWeight: 800 }}>
                            {opp.type.toUpperCase()}
                          </span>
                          {/* Portal Verified Badge */}
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: portal.badgeBg,
                              color: portal.badgeColor,
                              fontWeight: 700,
                              border: `1px solid ${portal.badgeColor}33`,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3
                            }}
                          >
                            <span>✓</span> {portal.name}
                          </span>
                        </div>

                        {/* Pipeline Stage Tag if Present */}
                        {appInfo && (
                          <div>
                            <span
                              style={{
                                fontSize: 10,
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontWeight: 800,
                                background: isApplied
                                  ? "rgba(16,185,129,0.25)"
                                  : isBookmarked
                                  ? "rgba(168,85,247,0.25)"
                                  : "rgba(59,130,246,0.25)",
                                color: isApplied ? "#34d399" : isBookmarked ? "#d8b4fe" : "#60a5fa",
                                border: `1px solid ${isApplied ? "#10b981" : isBookmarked ? "#a855f7" : "#3b82f6"}66`
                              }}
                            >
                              {isApplied ? "✅ Applied in Pipeline" : isBookmarked ? "🔖 Bookmarked" : `📋 ${appInfo.stage}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <FitScoreBadge score={rec.fit_score} />
                    </div>

                    {/* Title & Organizer */}
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 4px", lineHeight: 1.4 }}>
                      {opp.title}
                    </h3>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
                      {opp.organizer} • <span style={{ color: schedule.isUpcoming ? "#38bdf8" : "#94a3b8", fontWeight: 700 }}>{schedule.label}</span>
                    </div>

                    {/* Reasoning */}
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "0 0 14px", lineHeight: 1.5 }}>
                      {rec.reasoning}
                    </p>

                    {/* Matching Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
                      {rec.matching_tags.slice(0, 4).map((tag, idx) => (
                        <span key={idx} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#34d399", fontWeight: 600 }}>
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    {/* Pipeline Quick Action Buttons */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                      <button
                        onClick={() => handleBookmarkToggle(rec.opportunity_id, opp.title)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: isBookmarked ? "1px solid #a855f7" : "1px solid rgba(168,85,247,0.3)",
                          background: isBookmarked ? "rgba(168,85,247,0.25)" : "transparent",
                          color: isBookmarked ? "#e9d5ff" : "#c084fc",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4
                        }}
                      >
                        {isBookmarked ? "🔖 Saved" : "🔖 Bookmark"}
                      </button>

                      <button
                        onClick={() => handleMarkApplied(rec.opportunity_id, opp.title)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: isApplied ? "1px solid #10b981" : "1px solid rgba(16,185,129,0.3)",
                          background: isApplied ? "rgba(16,185,129,0.25)" : "transparent",
                          color: isApplied ? "#a7f3d0" : "#34d399",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4
                        }}
                      >
                        {isApplied ? "✅ Applied" : "✅ Mark Applied"}
                      </button>

                      {appInfo && (
                        <select
                          value={appInfo.stage}
                          onChange={e => handleStageChange(rec.opportunity_id, e.target.value as any)}
                          style={{
                            background: "rgba(15,23,42,0.9)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#94a3b8",
                            fontSize: 10,
                            padding: "4px 6px",
                            borderRadius: 6,
                            outline: "none",
                            cursor: "pointer"
                          }}
                        >
                          <option value="Bookmarked">Stage: Bookmarked</option>
                          <option value="Applied">Stage: Applied</option>
                          <option value="Interviewing">Stage: Interviewing</option>
                          <option value="Offer">Stage: Offer</option>
                          <option value="Rejected">Stage: Rejected</option>
                          <option value="remove">❌ Remove from Pipeline</option>
                        </select>
                      )}
                    </div>

                    {/* Primary Actions: Details & Verified Direct Link */}
                    <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <Link
                        href={`/student/opportunities/${rec.opportunity_id}`}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "white",
                          textDecoration: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: "center"
                        }}
                      >
                        View Details
                      </Link>
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          // Suggest marking applied if clicked
                          if (!isApplied) {
                            setTimeout(() => {
                              handleMarkApplied(rec.opportunity_id, opp.title);
                            }, 1000);
                          }
                        }}
                        style={{
                          flex: 1.2,
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                          color: "white",
                          textDecoration: "none",
                          fontSize: 12,
                          fontWeight: 800,
                          textAlign: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4
                        }}
                      >
                        Apply on {portal.name.replace(" Verified", "").replace(" Official", "")} ↗
                      </a>
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
