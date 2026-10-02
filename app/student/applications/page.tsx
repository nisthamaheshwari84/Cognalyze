"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";
import { getSafeOpportunityUrl, getOpportunityPortalInfo } from "@/lib/ai/placement-intelligence";
import CompanyLogo from "@/components/CompanyLogo";

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
  const { isDark } = useTheme();
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#07111F" : "#F6F5F1",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        transition: "background-color 150ms ease",
      }}
    >
      <AppNav role="student" />

      <main style={{ maxWidth: 1350, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: 5,
                  backgroundColor: isDark ? "#13243A" : "#EFF4FE",
                  color: isDark ? "#4C8DFF" : "#356AE6",
                  border: `1px solid ${isDark ? "#2A435F" : "#D2E0FB"}`,
                }}
              >
                APPLICATIONS PIPELINE
              </span>
              <span style={{ fontSize: 12, color: isDark ? "#8292A8" : "#667085" }}>
                {applications.length} active opportunities tracked
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 2px", color: isDark ? "#F2F6FC" : "#162A43", letterSpacing: "-0.3px" }}>
              Placement Kanban Pipeline
            </h1>
            <p style={{ fontSize: 13, color: isDark ? "#8292A8" : "#667085", margin: 0 }}>
              Track applications from bookmark to offer. Drag or update stages to progress your hiring pipeline.
            </p>
          </div>
          <button
            onClick={() => loadApplications(candidateId)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "7px 14px",
              backgroundColor: isDark ? "#13243A" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 7,
              color: isDark ? "#F2F6FC" : "#162A43",
              cursor: "pointer",
              boxShadow: isDark ? "none" : "0 1px 2px rgba(16, 24, 40, 0.04)",
              transition: "all 150ms ease",
            }}
          >
            ↻ Refresh Pipeline
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
                    borderRadius: 8,
                    border: isSelected ? "1.5px solid #356AE6" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                    backgroundColor: isSelected
                      ? (isDark ? "rgba(52, 120, 246, 0.16)" : "#EFF4FE")
                      : (isDark ? "#0E1B2E" : "#FFFFFF"),
                    color: isSelected ? (isDark ? "#4C8DFF" : "#356AE6") : (isDark ? "#B6C4D6" : "#667085"),
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                >
                  <span>{stage}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 999,
                      backgroundColor: isSelected ? "#356AE6" : isDark ? "#13243A" : "#F0EFEA",
                      color: isSelected ? "#FFFFFF" : isDark ? "#B6C4D6" : "#667085",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Kanban Board Grid */}
        <div style={{ display: isMobile ? "flex" : "grid", flexDirection: "column", gridTemplateColumns: !isMobile ? "repeat(5, 1fr)" : undefined, gap: 14, alignItems: "flex-start" }}>
          {STAGES.filter(s => !isMobile || s === activeMobileStage).map(stage => {
            const stageApps = applications.filter(a => a.stage === stage);
            const stageColor =
              stage === "Offer"
                ? "#2E7D5B"
                : stage === "Interviewing"
                ? "#B7791F"
                : stage === "Applied"
                ? "#356AE6"
                : stage === "Bookmarked"
                ? "#667085"
                : "#C24141";

            const stageBg =
              stage === "Offer"
                ? (isDark ? "rgba(53, 185, 130, 0.12)" : "#EAF4EE")
                : stage === "Interviewing"
                ? (isDark ? "rgba(234, 182, 90, 0.12)" : "#FEF7ED")
                : stage === "Applied"
                ? (isDark ? "rgba(52, 120, 246, 0.12)" : "#EFF4FE")
                : stage === "Bookmarked"
                ? (isDark ? "#13243A" : "#F6F5F1")
                : (isDark ? "rgba(233, 104, 114, 0.12)" : "#FDF2F2");

            return (
              <div
                key={stage}
                style={{
                  backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  minHeight: 460,
                  boxShadow: isDark ? "none" : "0 1px 3px rgba(16, 24, 40, 0.04)"
                }}
              >
                {/* Column Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: stageColor }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>{stage}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 7px",
                      backgroundColor: stageBg,
                      color: stageColor,
                      borderRadius: 999,
                      border: `1px solid ${stageColor}33`,
                    }}
                  >
                    {stageApps.length}
                  </span>
                </div>

                {/* Cards */}
                {stageApps.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: isDark ? "#8292A8" : "#98A2B3", fontSize: 12 }}>
                    No opportunities in {stage}
                  </div>
                ) : (
                  stageApps.map((app, i) => {
                    const safeUrl = app.opportunity
                      ? getSafeOpportunityUrl(app.opportunity.source_url, app.opportunity.organizer, app.opportunity.title)
                      : "https://unstop.com/competitions";
                    const portal = app.opportunity
                      ? getOpportunityPortalInfo(app.opportunity.source_url, app.opportunity.organizer, app.opportunity.title)
                      : { name: "Verified Portal", badgeBg: isDark ? "#13243A" : "#EFF4FE", badgeColor: "#356AE6" };

                    return (
                      <div
                        key={app.id || i}
                        style={{
                          backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                          border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                          borderRadius: 9,
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          boxShadow: isDark ? "none" : "0 1px 2px rgba(16, 24, 40, 0.03)",
                          transition: "all 150ms ease"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
                            <CompanyLogo
                              companyName={app.opportunity?.organizer || "Company"}
                              sourceUrl={app.opportunity?.source_url}
                              size={28}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                                <span style={{ fontSize: 10, textTransform: "uppercase", color: stageColor, fontWeight: 700 }}>
                                  {app.opportunity?.tier || "Tier 1"} • {app.opportunity?.organizer || "Organizer"}
                                </span>
                                <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, backgroundColor: isDark ? "#0E1B2E" : "#EFF4FE", color: isDark ? "#4C8DFF" : "#356AE6", fontWeight: 700, border: `1px solid ${isDark ? "#223750" : "#D2E0FB"}` }}>
                                  ✓ {portal.name}
                                </span>
                              </div>
                              <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.35 }}>
                                {app.opportunity?.title || app.opportunity_id}
                              </h4>
                            </div>
                          </div>
                        </div>

                        {app.notes && (
                          <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", padding: "5px 8px", backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF", borderRadius: 6, border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                            📝 {app.notes}
                          </div>
                        )}

                        {/* Move Actions & Direct Links */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, paddingTop: 8, gap: 6 }}>
                          <select
                            value={app.stage}
                            onChange={e => handleStageChange(app.id, e.target.value as any)}
                            style={{
                              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                              border: `1px solid ${isDark ? "#223750" : "#D1CDC4"}`,
                              color: isDark ? "#F2F6FC" : "#17191C",
                              fontSize: 11,
                              padding: "4px 8px",
                              borderRadius: 6,
                              outline: "none",
                              minHeight: 28,
                              cursor: "pointer"
                            }}
                          >
                            {STAGES.map(s => (
                              <option key={s} value={s} style={{ backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF", color: isDark ? "#F2F6FC" : "#17191C" }}>
                                {s}
                              </option>
                            ))}
                          </select>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <a
                              href={safeUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: 11, color: isDark ? "#35B982" : "#2E7D5B", textDecoration: "none", fontWeight: 700 }}
                            >
                              Portal ↗
                            </a>
                            <Link
                              href={`/student/opportunities/${app.opportunity_id}`}
                              style={{ fontSize: 11, color: isDark ? "#4C8DFF" : "#356AE6", textDecoration: "none", fontWeight: 700 }}
                            >
                              Blueprint ➔
                            </Link>
                            <button
                              onClick={() => handleDelete(app.id)}
                              title="Remove from pipeline"
                              style={{
                                background: "none",
                                border: "none",
                                color: isDark ? "#8292A8" : "#98A2B3",
                                cursor: "pointer",
                                fontSize: 11,
                                padding: "2px 4px"
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
      </main>
    </div>
  );
}
