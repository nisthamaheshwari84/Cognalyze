"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { PreparationCategory, CrossOpportunityOptimization } from "@/lib/skills/preparations/types";

interface ArenaSummary {
  id: string;
  slug: string;
  title: string;
  shortName: string;
  companyOrOrg: string;
  category: PreparationCategory;
  categoryLabel: string;
  tagline: string;
  badge: string;
  icon: string;
  stipendOrPrize: string;
  duration: string;
  applicationDeadline: string;
  eventOrProgramDates?: string;
  cycleYear?: number;
  cycleStatus?: string;
  dateVerificationStatus?: "verified_official" | "estimated_from_previous_cycle" | "rolling";
  cycleNotes?: string;
  officialUrl: string;
  matchCoveragePercentage: number;
  alreadyDemonstratedSkills: string[];
  missingSkills: string[];
  recommendedStartingLevel: string;
  isEnrolled: boolean;
  userProgress?: {
    level: string;
    completedTasksCount: number;
    lastActiveAt: string;
  } | null;
}

export default function PreparationsCatalogView() {
  const [arenas, setArenas] = useState<ArenaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForOptimizer, setSelectedForOptimizer] = useState<string[]>([]);
  const [optimizerData, setOptimizerData] = useState<CrossOpportunityOptimization | null>(null);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [optimizerLoading, setOptimizerLoading] = useState(false);

  useEffect(() => {
    async function loadArenas() {
      setLoading(true);
      try {
        const res = await fetch("/api/skills/preparations");
        const data = await res.json();
        if (data.success && data.arenas) {
          setArenas(data.arenas);
          // Pre-select first 2 for optimizer demo
          if (data.arenas.length >= 2) {
            setSelectedForOptimizer([data.arenas[0].id, data.arenas[1].id]);
          }
        }
      } catch (err) {
        console.error("Failed to load preparation arenas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadArenas();
  }, []);

  const filteredArenas = useMemo(() => {
    return arenas.filter(a => {
      const matchesCategory = selectedCategory === "ALL" || a.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.companyOrOrg.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [arenas, selectedCategory, searchQuery]);

  const enrolledArenas = useMemo(() => {
    return arenas.filter(a => a.isEnrolled || (a.userProgress && a.userProgress.completedTasksCount > 0));
  }, [arenas]);

  const toggleOptimizerSelection = (id: string) => {
    setSelectedForOptimizer(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 3) return [...prev.slice(1), id];
        return [...prev, id];
      }
    });
  };

  const runCrossOptimizer = async () => {
    if (selectedForOptimizer.length === 0) return;
    setOptimizerLoading(true);
    setIsOptimizerOpen(true);
    try {
      const res = await fetch("/api/skills/preparations/cross-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arenaIds: selectedForOptimizer }),
      });
      const data = await res.json();
      if (data.success && data.optimization) {
        setOptimizerData(data.optimization);
      }
    } catch (e) {
      console.error("Optimizer error:", e);
    } finally {
      setOptimizerLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      {/* Top Breadcrumb & Header */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "16px 24px", position: "sticky", top: 56, zIndex: 20 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 4 }}>
              <Link href="/student" style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}>← Student Dashboard</Link>
              <span style={{ color: "#98A2B3" }}>/</span>
              <Link href="/student/skills" style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}>Skill Practice Hub</Link>
              <span style={{ color: "#98A2B3" }}>/</span>
              <span style={{ color: "#356AE6", fontWeight: 700 }}>Preparations Arena</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.03em" }}>
              Career Launch &amp; Opportunity Preparations
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#667085" }}>
              Dedicated preparation environments for GSoC, Flipkart GRID, Amazon HackOn, Walmart Sparkathon, and Top SDE/AI Internships.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={runCrossOptimizer}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "#162A43",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(22,42,67,0.15)",
              }}
            >
              ⚡ Cross-Target Optimizer ({selectedForOptimizer.length})
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "24px auto", padding: "0 24px 60px" }}>
        {/* Institutional Hero Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #162A43 0%, #0F172A 100%)",
            color: "#FFFFFF",
            borderRadius: 12,
            padding: "24px 28px",
            marginBottom: 28,
            boxShadow: "0 4px 14px rgba(22,42,67,0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: "rgba(53,106,230,0.25)", color: "#93C5FD", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
              <span>🎯</span> EVIDENCE-GROUNDED OPPORTUNITY PREPARATION
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              From Zero to Verified Contributor, Finalist &amp; Candidate
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>
              Every program has its own dedicated arena: custom multi-phase roadmaps, verified eligibility, real project blueprints, open-source issue guidance, and mock OA evaluations. Choose your target below to launch your personalized journey.
            </p>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.06)", padding: "12px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF" }}>{arenas.length}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Curated Arenas</div>
            </div>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.06)", padding: "12px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#34D399" }}>4 Tiers</div>
              <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Beginner to Adv</div>
            </div>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.06)", padding: "12px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#60A5FA" }}>100%</div>
              <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Skill Hub Synced</div>
            </div>
          </div>
        </div>

        {/* Active Enrolled Pathways (If any) */}
        {enrolledArenas.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: "0 0 12px" }}>
              Active Preparation Pathways ({enrolledArenas.length})
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
              {enrolledArenas.map(arena => (
                <div
                  key={arena.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1.5px solid #356AE6",
                    borderRadius: 10,
                    padding: "16px 18px",
                    boxShadow: "0 2px 6px rgba(53,106,230,0.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{arena.icon}</span>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#162A43" }}>{arena.shortName}</h4>
                        <span style={{ fontSize: 11, color: "#667085" }}>{arena.companyOrOrg}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6" }}>
                      {arena.userProgress?.level.replace("_", " ").toUpperCase() || "ACTIVE"}
                    </span>
                  </div>

                  <div style={{ margin: "10px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: "#667085", fontWeight: 600 }}>Milestones Demonstrated</span>
                      <strong style={{ color: "#162A43" }}>{arena.userProgress?.completedTasksCount || 0} completed</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <span style={{ fontSize: 11, color: "#667085" }}>
                      {arena.userProgress?.completedTasksCount || 0} milestone(s) verified
                    </span>
                    <Link
                      href={`/student/skills/preparations/${arena.slug}`}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        background: "#356AE6",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Resume Prep ➔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All Opportunities" },
              { id: "OPEN_SOURCE", label: "🌐 Open Source (GSoC)" },
              { id: "COMPANY_HACKATHON", label: "🏆 Company Hackathons" },
              { id: "COMPANY_HIRING", label: "💼 Company Hiring (SDE)" },
              { id: "SPECIALIZED_INTERNSHIP", label: "🧠 Specialized Internships" },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: selectedCategory === cat.id ? "1.5px solid #162A43" : "1px solid #E4E1DA",
                  background: selectedCategory === cat.id ? "#162A43" : "#FFFFFF",
                  color: selectedCategory === cat.id ? "#FFFFFF" : "#667085",
                  transition: "all 0.15s ease",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", minWidth: 260 }}>
            <input
              type="text"
              placeholder="Search by company, role, program..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 30px",
                borderRadius: 7,
                border: "1px solid #E4E1DA",
                background: "#FFFFFF",
                fontSize: 12,
                color: "#17191C",
                outline: "none",
              }}
            />
            <span style={{ position: "absolute", left: 10, top: 9, fontSize: 12, color: "#98A2B3" }}>🔍</span>
          </div>
        </div>

        {/* Arenas Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#667085", fontSize: 14 }}>
            Loading preparation environments...
          </div>
        ) : filteredArenas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
            <span style={{ fontSize: 36 }}>🔍</span>
            <h4 style={{ fontSize: 16, fontWeight: 800, margin: "12px 0 6px", color: "#162A43" }}>No preparation arenas match your filter</h4>
            <p style={{ margin: 0, fontSize: 12, color: "#667085" }}>Try resetting your category or search query.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
            {filteredArenas.map(arena => {
              const isSelected = selectedForOptimizer.includes(arena.id);

              return (
                <div
                  key={arena.id}
                  style={{
                    background: "#FFFFFF",
                    border: isSelected ? "2px solid #356AE6" : "1px solid #E4E1DA",
                    borderRadius: 12,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 14,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 28 }}>{arena.icon}</span>
                        <div>
                          <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                            {arena.companyOrOrg}
                          </div>
                          <h4 style={{ fontSize: 16, fontWeight: 800, margin: "1px 0 0", color: "#162A43", letterSpacing: "-0.02em" }}>
                            {arena.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleOptimizerSelection(arena.id)}
                        title={isSelected ? "Remove from Multi-Target Optimizer" : "Add to Multi-Target Optimizer"}
                        style={{
                          background: isSelected ? "#356AE6" : "#F6F5F1",
                          color: isSelected ? "#FFFFFF" : "#667085",
                          border: isSelected ? "none" : "1px solid #E4E1DA",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {isSelected ? "✓ Compared" : "+ Compare"}
                      </button>
                    </div>

                    {/* Tagline */}
                    <p style={{ fontSize: 12, color: "#667085", margin: "0 0 12px", lineHeight: 1.5 }}>
                      {arena.tagline}
                    </p>

                    {/* Verified Stipend / Reward Badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#F8FAFC", borderRadius: 7, border: "1px solid #E2E8F0", marginBottom: 12 }}>
                      <span style={{ fontSize: 14 }}>💰</span>
                      <div>
                        <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Verified Reward / Stipend</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>{arena.stipendOrPrize}</div>
                      </div>
                    </div>

                    {/* Cycle & Timeline Notice */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "7px 10px", background: "#F8FAFC", borderRadius: 7, border: "1px solid #E2E8F0", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                          {arena.cycleYear || 2027} Cycle ({arena.dateVerificationStatus === "estimated_from_previous_cycle" ? "Estimated Estimate" : arena.dateVerificationStatus === "rolling" ? "Rolling" : "Official"})
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{arena.eventOrProgramDates || arena.duration}</div>
                      </div>
                    </div>

                    {/* Student DNA Evidence Match */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: "#667085", fontWeight: 600 }}>Required Competency Evidence Coverage</span>
                        <strong style={{ color: arena.matchCoveragePercentage >= 50 ? "#2E7D5B" : "#B7791F" }}>
                          {arena.alreadyDemonstratedSkills.length} / {arena.alreadyDemonstratedSkills.length + arena.missingSkills.length} Verified
                        </strong>
                      </div>
                      <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${arena.matchCoveragePercentage}%`,
                            background: arena.matchCoveragePercentage >= 50 ? "#2E7D5B" : "#B7791F",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: "#667085" }}>
                          Calibrated Starting Tier: <strong style={{ color: "#162A43" }}>{arena.recommendedStartingLevel.replace("_", " ").toUpperCase()}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Launch */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #E4E1DA" }}>
                    <div style={{ fontSize: 11, color: "#667085" }}>
                      ⏳ Duration: <strong style={{ color: "#162A43" }}>{arena.duration}</strong>
                    </div>

                    <Link
                      href={`/student/skills/preparations/${arena.slug}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 7,
                        background: "#356AE6",
                        color: "#FFFFFF",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 2px 4px rgba(53,106,230,0.2)",
                      }}
                    >
                      Enter Arena ➔
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Multi-Opportunity Optimizer Modal */}
        {isOptimizerOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15,23,42,0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
              padding: 20,
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                maxWidth: 780,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "24px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43" }}>
                    ⚡ Cross-Target Preparation Optimizer
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#667085" }}>
                    Synthesizing shared foundations across {selectedForOptimizer.length} target programs without duplicate study.
                  </p>
                </div>
                <button
                  onClick={() => setIsOptimizerOpen(false)}
                  style={{ background: "transparent", border: "none", fontSize: 16, cursor: "pointer", color: "#667085" }}
                >
                  ✕
                </button>
              </div>

              {optimizerLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#667085" }}>
                  Calculating optimal shared curriculum...
                </div>
              ) : optimizerData ? (
                <div>
                  {/* Time savings banner */}
                  <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: 13, color: "#2E7D5B" }}>
                        🚀 Estimated {optimizerData.timeSavingsWeeks} Weeks Saved through Shared Skill Reuse
                      </strong>
                      <div style={{ fontSize: 11, color: "#2E7D5B", marginTop: 2 }}>
                        Total estimated preparation time reduced to {optimizerData.estimatedTotalWeeks} weeks across all target programs.
                      </div>
                    </div>
                  </div>

                  {/* Shared Foundations */}
                  <div style={{ marginBottom: 18 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>
                      Shared Foundation Curriculum (Common to Multiple Targets)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                      {optimizerData.sharedFoundations.map(s => (
                        <div key={s.skill} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 7, padding: "8px 12px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>{s.skill}</div>
                          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                            Reused in: {s.applicableArenas.join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4-Week Balanced Schedule */}
                  <div style={{ marginBottom: 18 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>
                      Balanced Execution Plan
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {optimizerData.weeklyBalancedSchedule.map(w => (
                        <div key={w.weekNumber} style={{ border: "1px solid #E4E1DA", borderRadius: 8, padding: "12px 14px", background: "#FFFFFF" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <strong style={{ fontSize: 13, color: "#356AE6" }}>Week {w.weekNumber}: {w.focus}</strong>
                          </div>
                          <div style={{ fontSize: 11, color: "#667085", marginBottom: 6 }}>
                            <strong>Common Foundation: </strong>{w.sharedTasks.join(" · ")}
                          </div>
                          <div style={{ fontSize: 11, color: "#162A43" }}>
                            <strong>Opportunity Milestones: </strong>
                            {w.opportunityTasks.map(t => `${t.arenaId}: ${t.task}`).join(" | ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", marginTop: 14 }}>
                    <button
                      onClick={() => setIsOptimizerOpen(false)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 7,
                        background: "#162A43",
                        color: "#FFFFFF",
                        fontSize: 12,
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Close Optimizer
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

