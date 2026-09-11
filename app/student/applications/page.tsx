"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { getSafeOpportunityUrl, getOpportunityPortalInfo } from "@/lib/ai/placement-intelligence";

interface Application {
  id: string;
  opportunity_id: string;
  stage: "Bookmarked" | "Applied" | "Interviewing" | "Offer" | "Rejected";
  notes?: string;
  updated_at: string;
  opportunity?: any;
}

const STAGES: Array<"Bookmarked" | "Applied" | "Interviewing" | "Offer" | "Rejected"> = [
  "Bookmarked",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected"
];

export default function StudentApplicationsPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileStage, setActiveMobileStage] = useState<Application["stage"]>("Bookmarked");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 850);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    loadApplications(stored);
  }, []);

  const loadApplications = async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?candidateId=${cId}`);
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (appId: string, newStage: Application["stage"]) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, stage: newStage } : a));
    try {
      await fetch(`/api/applications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, stage: newStage })
      });
    } catch (e) {
      console.error("Failed to update stage:", e);
    }
  };

  const moveStage = async (opportunityId: string, nextStage: Application["stage"]) => {
    setApplications(prev =>
      prev.map(app => (app.opportunity_id === opportunityId ? { ...app, stage: nextStage } : app))
    );
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          opportunityId,
          stage: nextStage
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (appId: string) => {
    setApplications(prev => prev.filter(a => a.id !== appId));
    try {
      await fetch(`/api/applications?id=${appId}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete application:", e);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06030f", color: "white", fontFamily: "-apple-system,sans-serif" }}>
      <AppNav role="student" />

      <div style={{ maxWidth: 1350, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>Placement Kanban Pipeline</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>
              Track applications from bookmark to offer. Drag or click arrows to progress stages.
            </p>
          </div>
          <button
            onClick={() => loadApplications(candidateId)}
            style={{ fontSize: 11, padding: "5px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Mobile Stage Selector Tabs */}
        {isMobile && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16, maxWidth: "100%" }}>
            {STAGES.map(stage => {
              const count = applications.filter(a => a.stage === stage).length;
              const isSelected = activeMobileStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveMobileStage(stage)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: isSelected ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                    background: isSelected ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                    color: isSelected ? "white" : "rgba(255,255,255,0.7)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                >
                  <span>{stage}</span>
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: isSelected ? "#6366f1" : "rgba(255,255,255,0.1)", color: "white" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Kanban Board Grid */}
        <div style={{ display: isMobile ? "flex" : "grid", flexDirection: "column", gridTemplateColumns: !isMobile ? "repeat(5, 1fr)" : undefined, gap: "1rem", alignItems: "flex-start" }}>
          {STAGES.filter(s => !isMobile || s === activeMobileStage).map(stage => {
            const stageApps = applications.filter(a => a.stage === stage);
            const stageColor =
              stage === "Offer"
                ? "#00ff88"
                : stage === "Interviewing"
                ? "#fbbf24"
                : stage === "Applied"
                ? "#818cf8"
                : stage === "Bookmarked"
                ? "#94a3b8"
                : "#f87171";

            return (
              <div
                key={stage}
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem", minHeight: 400 }}
              >
                {/* Column Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: stageColor }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{stage}</span>
                  </div>
                  <span style={{ fontSize: 11, padding: "2px 7px", background: "rgba(255,255,255,0.05)", borderRadius: 999, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                    {stageApps.length}
                  </span>
                </div>

                {/* Cards */}
                {stageApps.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
                    No opportunities in {stage}
                  </div>
                ) : (
                  stageApps.map((app, i) => {
                    const safeUrl = app.opportunity
                      ? getSafeOpportunityUrl(app.opportunity.source_url, app.opportunity.organizer, app.opportunity.title)
                      : "https://unstop.com/competitions";
                    const portal = app.opportunity
                      ? getOpportunityPortalInfo(app.opportunity.source_url, app.opportunity.organizer, app.opportunity.title)
                      : { name: "Verified Portal", badgeBg: "rgba(99,102,241,0.2)", badgeColor: "#818cf8" };

                    return (
                      <div
                        key={app.id || i}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 9, textTransform: "uppercase", color: stageColor, fontWeight: 800 }}>
                              {app.opportunity?.tier || "Tier 1"} • {app.opportunity?.organizer || "Organizer"}
                            </span>
                            <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: portal.badgeBg, color: portal.badgeColor, fontWeight: 700 }}>
                              ✓ {portal.name}
                            </span>
                          </div>
                          <h4 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 4px", color: "white" }}>
                            {app.opportunity?.title || app.opportunity_id}
                          </h4>
                        </div>

                        {app.notes && (
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", padding: "4px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                            📝 {app.notes}
                          </div>
                        )}

                        {/* Move Actions & Direct Links */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8, gap: 6 }}>
                          <select
                            value={app.stage}
                            onChange={e => handleStageChange(app.id, e.target.value as any)}
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 11, padding: "4px 8px", borderRadius: 6, outline: "none", minHeight: 32 }}
                          >
                            {STAGES.map(s => (
                              <option key={s} value={s} style={{ background: "#111" }}>
                                {s}
                              </option>
                            ))}
                          </select>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <a
                              href={safeUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: 10, color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}
                            >
                              Portal ↗
                            </a>
                            <Link
                              href={`/student/opportunities/${app.opportunity_id}`}
                              style={{ fontSize: 10, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}
                            >
                              Blueprint ➔
                            </Link>
                            <button
                              onClick={() => handleDelete(app.id)}
                              title="Remove from pipeline"
                              style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.3)",
                                cursor: "pointer",
                                fontSize: 11,
                                padding: "2px"
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
