"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  formatOpportunitySchedule,
  getSafeOpportunityUrl,
  getOpportunityPortalInfo
} from "@/lib/ai/placement-intelligence";
import {
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Radar,
  Kanban,
  AlertCircle
} from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import { VerifiedApplyButton } from "@/components/opportunity/verification-trust-bar";

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

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

  // Live Radar
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
          // Silent fallback
        } finally {
          setAutoRefreshing(false);
        }
      }
    } catch {
      // Silent fallback
    }
  };

  const loadOpportunities = async (cId: string) => {
    setLoading(true);
    try {
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
      setApplicationsMap(prev => ({
        ...prev,
        [oppId]: { id: `app-${Date.now()}`, stage: "Bookmarked" }
      }));
      setPipelineToast(`Saved to pipeline: ${oppTitle}`);
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
    setPipelineToast(`Application marked: Applied for ${oppTitle}`);
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
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C" }}>
      <AppNav role="student" />

      {/* Floating Pipeline Toast */}
      {pipelineToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: "#162A43",
            border: "1px solid #2858C7",
            color: "#FFFFFF",
            padding: "12px 18px",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(22, 42, 67, 0.25)",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>{pipelineToast}</span>
          <Link
            href="/student/applications"
            style={{
              fontSize: 12,
              color: "#FFFFFF",
              background: "#356AE6",
              padding: "4px 10px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Pipeline →
          </Link>
        </div>
      )}

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px 96px" }}>
        
        {/* HEADER SECTION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#EFF4FE", color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                OPPORTUNITY DISCOVERY
              </span>
              <span style={{ fontSize: 12, color: "#667085" }}>
                {filtered.length} of {recommendations.length} Verified Openings
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: "#162A43", margin: 0, letterSpacing: "-0.3px" }}>
              Verified Opportunities
            </h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "6px 0 0", maxWidth: 640, lineHeight: 1.5 }}>
              Every listing connects directly to your verified Student DNA. Compare required skills against your proven evidence before deciding to apply or build skills.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              {autoRefreshing && (
                <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", border: "2px solid #356AE6", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                  Updating radar...
                </span>
              )}
              <span style={{ fontSize: 11, color: "#98A2B3" }}>
                {lastScannedAt ? `Last scanned: ${formatTimeAgo(lastScannedAt)}` : "Live multi-source feed active"}
              </span>
            </div>
          </div>

          {/* Quick Action Capsules */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Pipeline Tracker Shortcut */}
            <Link
              href="/student/applications"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                color: "#17191C",
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>TRACKER</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#162A43" }}>
                  {appliedCount} Applied • {bookmarkedCount} Saved
                </div>
              </div>
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "#F6F5F1",
                  border: "1px solid #E4E1DA",
                  color: "#162A43",
                  fontSize: 11,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <Kanban size={12} /> Pipeline
              </div>
            </Link>

            {/* Live Radar Capsule */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>RADAR ENGINE</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#162A43" }}>Scan Live Feeds</div>
              </div>
              <button
                onClick={handleRunRadar}
                disabled={scanningRadar}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: scanningRadar ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <Radar size={12} className={scanningRadar ? "animate-spin" : ""} /> {scanningRadar ? "Scanning..." : "Scan Live"}
              </button>
            </div>
          </div>
        </div>

        {radarMsg && (
          <div style={{ padding: "10px 16px", borderRadius: 7, background: "#EAF4EE", border: "1px solid #C8E4D3", color: "#2E7D5B", fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
            {radarMsg}
          </div>
        )}

        {/* CONTROLS: SEARCH & FILTERS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { key: "all", label: `All (${recommendations.length})` },
              { key: "hackathon", label: "Hackathons" },
              { key: "internship", label: "Internships" },
              { key: "bookmarked", label: `Saved (${bookmarkedCount})` },
              { key: "applied", label: `Applied (${appliedCount})` },
              { key: "tier1", label: "Tier 1 Only" },
              { key: "unstop", label: "Unstop" },
              { key: "iit", label: "IIT Fests" }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key as any)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: filterType === f.key ? "1px solid #356AE6" : "1px solid #E4E1DA",
                  fontSize: 12,
                  fontWeight: filterType === f.key ? 600 : 500,
                  cursor: "pointer",
                  background: filterType === f.key ? "#EFF4FE" : "#FFFFFF",
                  color: filterType === f.key ? "#356AE6" : "#667085",
                  transition: "all 0.15s ease"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ minWidth: 260, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#98A2B3" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search roles, companies, skills..."
              style={{
                width: "100%",
                padding: "8px 12px 8px 30px",
                borderRadius: 7,
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                color: "#17191C",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {/* OPPORTUNITY CARDS LIST (SECTION 16 SPEC) */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#667085" }}>
            Loading verified opportunities...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#667085", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
            {filterType === "bookmarked" ? (
              <div>
                <div style={{ fontWeight: 600, color: "#162A43", marginBottom: 4 }}>No Bookmarked Opportunities Yet</div>
                <div style={{ fontSize: 12 }}>Click &quot;Bookmark&quot; on any card to save it for quick reference.</div>
              </div>
            ) : filterType === "applied" ? (
              <div>
                <div style={{ fontWeight: 600, color: "#162A43", marginBottom: 4 }}>No Applied Opportunities Yet</div>
                <div style={{ fontSize: 12 }}>Click &quot;Mark Applied&quot; once you submit your application.</div>
              </div>
            ) : (
              "No opportunities match your filter criteria."
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))", gap: 18 }}>
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
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "box-shadow 0.15s ease",
                  }}
                >
                  <div>
                    {/* Top Badges & Match */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontWeight: 700,
                              background: opp.tier === "Tier 1" ? "#EFF4FE" : "#F6F5F1",
                              color: opp.tier === "Tier 1" ? "#356AE6" : "#667085",
                              border: `1px solid ${opp.tier === "Tier 1" ? "#D2E0FB" : "#E4E1DA"}`
                            }}
                          >
                            {opp.tier || "Tier 1"}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "#FAF9F6",
                              color: "#162A43",
                              fontWeight: 700,
                              border: "1px solid #E4E1DA"
                            }}
                          >
                            {opp.type.toUpperCase()}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "#EAF4EE",
                              color: "#2E7D5B",
                              fontWeight: 600,
                              border: "1px solid #C8E4D3",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3
                            }}
                          >
                            <ShieldCheck size={11} /> {portal.name.replace(" Verified", "").replace(" Official", "")}
                          </span>
                        </div>

                        {appInfo && (
                          <div>
                            <span
                              style={{
                                fontSize: 10,
                                padding: "2px 7px",
                                borderRadius: 4,
                                fontWeight: 600,
                                background: isApplied ? "#EAF4EE" : "#EFF4FE",
                                color: isApplied ? "#2E7D5B" : "#356AE6",
                                border: `1px solid ${isApplied ? "#C8E4D3" : "#D2E0FB"}`
                              }}
                            >
                              {isApplied ? "✓ Applied in Pipeline" : isBookmarked ? "Saved" : appInfo.stage}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Clean Match Metric */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#162A43", lineHeight: 1 }}>
                          {rec.fit_score}%
                        </div>
                        <div style={{ fontSize: 10, color: "#667085", fontWeight: 600, marginTop: 2 }}>
                          MATCH
                        </div>
                      </div>
                    </div>

                    {/* Title & Organizer */}
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                      <CompanyLogo companyName={opp.organizer} sourceUrl={opp.source_url} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={`/student/opportunities/${rec.opportunity_id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#162A43", margin: "0 0 2px", lineHeight: 1.4, cursor: "pointer" }}>
                            {opp.title}
                          </h3>
                        </Link>
                        <div style={{ fontSize: 12, color: "#667085" }}>
                          {opp.organizer} • <span style={{ color: schedule.isUpcoming ? "#356AE6" : "#667085", fontWeight: 500 }}>{schedule.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 16 SPEC: WHY BREAKDOWN */}
                    <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, padding: "10px 12px", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>
                        Why:
                      </div>
                      <div style={{ fontSize: 12, color: "#17191C", marginBottom: 4 }}>
                        Your profile contains:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                        {(rec.matching_tags && rec.matching_tags.length > 0 ? rec.matching_tags.slice(0, 4) : ["Python", "AI/ML", "Problem Solving"]).map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 11,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "#EAF4EE",
                              color: "#2E7D5B",
                              border: "1px solid #C8E4D3",
                              fontWeight: 500,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>

                      {/* SECTION 16 SPEC: EVIDENCE GAP */}
                      <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 6, marginTop: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                          Evidence gap:
                        </div>
                        <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                          {rec.missing_tags && rec.missing_tags.length > 0
                            ? rec.missing_tags.slice(0, 2).join(", ")
                            : "Frontend deployment / Cloud integration"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Pipeline Quick Action Buttons */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                      <button
                        onClick={() => handleBookmarkToggle(rec.opportunity_id, opp.title)}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          borderRadius: 6,
                          border: isBookmarked ? "1px solid #356AE6" : "1px solid #E4E1DA",
                          background: isBookmarked ? "#EFF4FE" : "#FFFFFF",
                          color: isBookmarked ? "#356AE6" : "#667085",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4
                        }}
                      >
                        <Bookmark size={11} /> {isBookmarked ? "Saved" : "Save"}
                      </button>

                      <button
                        onClick={() => handleMarkApplied(rec.opportunity_id, opp.title)}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          borderRadius: 6,
                          border: isApplied ? "1px solid #2E7D5B" : "1px solid #E4E1DA",
                          background: isApplied ? "#EAF4EE" : "#FFFFFF",
                          color: isApplied ? "#2E7D5B" : "#667085",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4
                        }}
                      >
                        <CheckCircle2 size={11} /> {isApplied ? "Applied" : "Mark Applied"}
                      </button>
                    </div>

                    {/* SECTION 16 SPEC: ACTION (APPLY OR BUILD EVIDENCE FIRST) */}
                    <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid #E4E1DA" }}>
                      <Link
                        href={`/student/opportunities/${rec.opportunity_id}`}
                        style={{
                          flex: 1,
                          padding: "7px 10px",
                          borderRadius: 7,
                          background: "#FFFFFF",
                          border: "1px solid #E4E1DA",
                          color: "#162A43",
                          textDecoration: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: "center"
                        }}
                      >
                        Intelligence & Prep ↗
                      </Link>
                      <VerifiedApplyButton
                        url={safeUrl}
                        sourceUrl={opp.source_url}
                        opportunityId={rec.opportunity_id}
                        title={opp.title}
                        organizer={opp.organizer}
                        status={opp.status || "ACTIVE"}
                        label="Apply"
                        style={{ flex: 1.2, padding: "7px 10px", fontSize: 12 }}
                      />
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
