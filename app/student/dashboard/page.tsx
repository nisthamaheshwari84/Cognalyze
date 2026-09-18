"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import GlobalEvidenceDrawer from "@/components/student/GlobalEvidenceDrawer";
import AskCognalyzeModal from "@/components/student/AskCognalyzeModal";
import { StudentDNAProfile, StudentCapability } from "@/lib/intelligence/student-intelligence";

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

export default function StudentDashboardOverview() {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [intelligence, setIntelligence] = useState<StudentDNAProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawer state
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [editingIntent, setEditingIntent] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState("AI/ML Engineer");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") || "student-demo" : "student-demo";
    setCandidateId(stored);
    loadData(stored);
  }, []);

  const loadData = async (cId: string) => {
    setLoading(true);
    try {
      const dnaRes = await fetch(`/api/student/dna?candidateId=${cId}`);
      const dnaData = await dnaRes.json();
      if (dnaData.intelligence) {
        setIntelligence(dnaData.intelligence);
        setSelectedGoal(dnaData.intelligence.intent.primaryGoal);
      }

      const recRes = await fetch(`/api/recommendations?candidateId=${cId}&limit=4`);
      const recData = await recRes.json();
      if (recData.recommendations) {
        setRecommendations(recData.recommendations);
      }
    } catch (err) {
      console.error("Error loading student intelligence data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async (newGoal: string) => {
    setSelectedGoal(newGoal);
    setEditingIntent(false);
    try {
      const res = await fetch(`/api/student/dna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          careerIntent: {
            primaryGoal: newGoal
          }
        })
      });
      const data = await res.json();
      if (data.intelligence) {
        setIntelligence(data.intelligence);
      }
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  };

  const handleOpenWhy = (capabilityName: string) => {
    setSelectedCapability(capabilityName);
    setEvidenceDrawerOpen(true);
  };

  // Extract categorized capabilities
  const capabilities = intelligence?.capabilities ? Object.values(intelligence.capabilities) : [];
  const strongCapabilities = capabilities.filter(c => c.evidenceLevel >= 3 || c.proficiencyState === "Strong" || c.proficiencyState === "Mastered");
  const buildingCapabilities = capabilities.filter(c => c.evidenceLevel === 2 || c.proficiencyState === "Developing");
  const needsEvidenceGaps = intelligence?.gaps ? intelligence.gaps.slice(0, 4) : [];
  const biggestGap = intelligence?.gaps?.[0] || null;
  const nextAction = intelligence?.nextBestActions?.[0] || null;
  const recentChanges = intelligence?.recentChanges || [];

  const existingModules = [
    { title: "FAANG Mock Interview", icon: "🎙️", href: "/interview", color: "#ec4899", desc: "Interactive AI face & voice interview" },
    { title: "Recruitment Sim", icon: "🏆", href: "/student/simulation", color: "#8b5cf6", desc: "5-stage campus placement simulation" },
    { title: "Resume Workspace", icon: "📄", href: "/student/resume", color: "#f43f5e", desc: "ATS builder & keyword diagnostics" },
    { title: "DSA Tracker", icon: "⚡", href: "/student/dsa-tracker", color: "#10b981", desc: "Striver SDE Sheet & problem solving" },
    { title: "Opportunity Tracker", icon: "🎯", href: "/student/opportunities", color: "#6366f1", desc: "Verified corporate drives & hackathons" },
    { title: "Application Kanban", icon: "📋", href: "/student/applications", color: "#a855f7", desc: "Pipeline tracker & prep milestones" },
    { title: "Question Bank", icon: "📚", href: "/student/question-bank", color: "#06b6d4", desc: "CS Core questions & HR STAR bank" },
    { title: "Placement Calendar", icon: "📅", href: "/student/calendar", color: "#f59e0b", desc: "Drive deadlines & interview sync" }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 24px" }}>
        
        {/* ══════════════════════════════════════════════════════════ */}
        {/* TOP BAR: CAREER INTENT & COMMAND CENTER ACTIONS           */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.4) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            padding: "24px 28px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#818cf8" }}>
                COGNALYZE CAREER INTELLIGENCE SYSTEM
              </span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", fontWeight: 700 }}>
                ● Continuous Pipeline Active
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: "white" }}>
                Good morning, {intelligence?.intent.primaryGoal || "Engineer"}
              </h1>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>Target Direction:</span>
                <span
                  onClick={() => setEditingIntent(true)}
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#38bdf8",
                    background: "rgba(56, 189, 248, 0.1)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    padding: "3px 10px",
                    borderRadius: 6,
                    cursor: "pointer"
                  }}
                  title="Click to switch target direction"
                >
                  {intelligence?.intent.primaryGoal || "AI/ML Engineer"} ▾
                </span>

                <span style={{ fontSize: 12, color: "#64748b" }}>
                  • {intelligence?.intent.experienceTarget || "Internship"} ({intelligence?.intent.timeline || "Next 6 months"})
                </span>
              </div>
            </div>
          </div>

          {/* QUICK COMMAND BUTTONS */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
                gap: 8,
                boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)"
              }}
            >
              <span>🧠</span> Ask Cognalyze
            </button>

            <Link
              href="/student/dna"
              style={{
                textDecoration: "none",
                background: "rgba(255, 255, 255, 0.05)",
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
              <span>🧬</span> My DNA
            </Link>

            <Link
              href="/student/journey"
              style={{
                textDecoration: "none",
                background: "rgba(255, 255, 255, 0.05)",
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
              <span>🗺️</span> Career Journey
            </Link>
          </div>
        </div>

        {/* TARGET DIRECTION SELECTOR MODAL */}
        {editingIntent && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20
            }}
            onClick={() => setEditingIntent(false)}
          >
            <div
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 14,
                padding: 24,
                width: "100%",
                maxWidth: 460,
                color: "white"
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 800 }}>Select Career Direction</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 18px", lineHeight: 1.4 }}>
                Target role expectations, required evidence levels, and recommended actions will adapt automatically.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["AI/ML Engineer", "Full Stack Engineer", "Backend / Distributed Systems"].map(role => (
                  <button
                    key={role}
                    onClick={() => handleUpdateGoal(role)}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: selectedGoal === role ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.08)",
                      background: selectedGoal === role ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>{role}</span>
                    {selectedGoal === role && <span style={{ color: "#818cf8" }}>✓ Active</span>}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 20, textAlign: "right" }}>
                <button
                  onClick={() => setEditingIntent(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    borderRadius: 8,
                    color: "white",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* GRID LAYOUT: PROFILE SNAPSHOT & NEXT BEST ACTION           */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, marginBottom: 24 }}>
          
          {/* 1. PROFILE SNAPSHOT (WHAT COGNALYZE KNOWS) */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "white" }}>
                    Profile Snapshot
                  </h2>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    {intelligence?.totalEvidenceCount || 0} total evidence records ({intelligence?.verifiedEvidenceCount || 0} verified)
                  </span>
                </div>

                <Link
                  href="/student/dna"
                  style={{ fontSize: 11, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}
                >
                  View Full DNA →
                </Link>
              </div>

              {/* STRONG EVIDENCE */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#10b981", letterSpacing: 0.8, marginBottom: 8 }}>
                  ✓ Strong Evidence (Assessed / Verified)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {strongCapabilities.length > 0 ? (
                    strongCapabilities.map(cap => (
                      <div
                        key={cap.name}
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          border: "1px solid rgba(16, 185, 129, 0.35)",
                          borderRadius: 8,
                          padding: "6px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#d1fae5"
                        }}
                      >
                        <span>{cap.name}</span>
                        <button
                          onClick={() => handleOpenWhy(cap.name)}
                          style={{
                            background: "rgba(16, 185, 129, 0.2)",
                            border: "none",
                            borderRadius: 4,
                            color: "#10b981",
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 6px",
                            cursor: "pointer"
                          }}
                          title="View evidence provenance"
                        >
                          Why?
                        </button>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: "#64748b" }}>None yet. Complete a test or mock interview.</span>
                  )}
                </div>
              </div>

              {/* BUILDING / DEMONSTRATED */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#a855f7", letterSpacing: 0.8, marginBottom: 8 }}>
                  ⚡ Building / Demonstrated (Artifact Exists)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {buildingCapabilities.length > 0 ? (
                    buildingCapabilities.map(cap => (
                      <div
                        key={cap.name}
                        style={{
                          backgroundColor: "rgba(168, 85, 247, 0.12)",
                          border: "1px solid rgba(168, 85, 247, 0.35)",
                          borderRadius: 8,
                          padding: "6px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#f3e8ff"
                        }}
                      >
                        <span>{cap.name}</span>
                        <button
                          onClick={() => handleOpenWhy(cap.name)}
                          style={{
                            background: "rgba(168, 85, 247, 0.2)",
                            border: "none",
                            borderRadius: 4,
                            color: "#c084fc",
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 6px",
                            cursor: "pointer"
                          }}
                        >
                          Why?
                        </button>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: "#64748b" }}>No demonstrated artifacts currently tracked.</span>
                  )}
                </div>
              </div>

              {/* NEEDS EVIDENCE (GAPS) */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#f59e0b", letterSpacing: 0.8, marginBottom: 8 }}>
                  ⚠️ Needs Evidence for {intelligence?.intent.primaryGoal || "Target Role"}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {needsEvidenceGaps.map(gap => (
                    <div
                      key={gap.id}
                      style={{
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#fef3c7"
                      }}
                    >
                      <span>{gap.capability}</span>
                      <button
                        onClick={() => handleOpenWhy(gap.capability)}
                        style={{
                          background: "rgba(245, 158, 11, 0.2)",
                          border: "none",
                          borderRadius: 4,
                          color: "#f59e0b",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          cursor: "pointer"
                        }}
                      >
                        Why?
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Principle: Absence of evidence is not lack of skill.
              </span>
              <button
                onClick={() => setAskModalOpen(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#818cf8",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Inspect reasoning →
              </button>
            </div>
          </div>

          {/* 2. NEXT BEST ACTION & BIGGEST GAP */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: 16,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              {/* BIGGEST GAP CALLOUT */}
              {biggestGap && (
                <div
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    marginBottom: 16
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#f87171" }}>
                      CURRENT PRIMARY GAP: {biggestGap.capability}
                    </span>
                    <span style={{ fontSize: 10, color: "#fca5a5", textTransform: "uppercase", fontWeight: 700 }}>
                      {biggestGap.importance} requirement
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#fecaca", lineHeight: 1.4 }}>
                    {biggestGap.description}
                  </div>
                </div>
              )}

              {/* NEXT BEST ACTION */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "#6366f1" }}>
                  RECOMMENDED NEXT ACTION
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0", color: "white" }}>
                  {nextAction?.title || "Complete Baseline Evidence Evaluation"}
                </h3>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, margin: "0 0 16px" }}>
                  {nextAction?.whyThisAction || "Take an assessment, add a project repository, or complete a mock interview to establish your profile baseline."}
                </p>

                {/* 4 ACTION PATHS (BUILD, PRACTICE, VERIFY, LEARN) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {nextAction?.options?.map((opt, idx) => (
                    <Link
                      key={idx}
                      href={opt.ctaHref}
                      style={{
                        textDecoration: "none",
                        backgroundColor: "rgba(30, 41, 59, 0.5)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        transition: "all 0.15s ease"
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", textTransform: "uppercase" }}>
                        {opt.label}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.3 }}>
                        {opt.description}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", marginTop: 4 }}>
                        {opt.ctaLabel} →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Targeting: {intelligence?.intent.primaryGoal || "AI/ML Engineer"}
              </span>
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>
                High Return on Effort
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* RECENT DNA CHANGES ("WHY DID MY DNA CHANGE?")              */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            padding: "24px",
            marginBottom: 24
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "white" }}>
                Recent DNA Changes
              </h2>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Live change log showing how recent actions updated your capability graph and opportunity alignment.
              </span>
            </div>

            <span style={{ fontSize: 11, color: "#64748b" }}>
              Event-Driven Recalculation
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentChanges.slice(0, 3).map((change, idx) => (
              <div
                key={change.id || idx}
                style={{
                  backgroundColor: "rgba(30, 41, 59, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: 12,
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#818cf8" }}>
                      {change.triggerEvent}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      • {new Date(change.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.4 }}>
                    {change.newEvidence}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    <strong>After:</strong> {change.afterSummary}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {change.affectedOpportunitiesDelta > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#10b981",
                        background: "rgba(16, 185, 129, 0.12)",
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid rgba(16, 185, 129, 0.25)"
                      }}
                    >
                      +{change.affectedOpportunitiesDelta} Opportunities Aligned
                    </span>
                  )}

                  <button
                    onClick={() => handleOpenWhy(change.affectedCapabilities[0] || "Python")}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 8,
                      color: "#cbd5e1",
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    View Evidence
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* RELEVANT OPPORTUNITIES ALIGNED WITH CURRENT DNA            */}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "white" }}>
                Opportunities Aligned With Your Evidence
              </h2>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Recommendations mapped directly to your verified capabilities & unresolved gaps.
              </span>
            </div>

            <Link
              href="/student/opportunities"
              style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, textDecoration: "none" }}
            >
              View All 50+ Drives →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {recommendations.map(rec => {
              const opp = rec.opportunity;
              return (
                <div
                  key={rec.opportunity_id}
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 12,
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#818cf8", textTransform: "uppercase" }}>
                        {opp.organizer}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: rec.fit_score >= 80 ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                          color: rec.fit_score >= 80 ? "#10b981" : "#818cf8"
                        }}
                      >
                        {rec.fit_score >= 80 ? "STRONG ALIGNMENT" : "DEVELOPING FIT"}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 8px", color: "white", lineHeight: 1.3 }}>
                      {opp.title}
                    </h4>

                    {/* MATCHING TAGS WITH EVIDENCE TICKS */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                      {rec.matching_tags.slice(0, 3).map(t => (
                        <span
                          key={t}
                          style={{
                            fontSize: 10,
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#34d399",
                            border: "1px solid rgba(16, 185, 129, 0.25)",
                            borderRadius: 4,
                            padding: "2px 6px"
                          }}
                        >
                          ✓ {t}
                        </span>
                      ))}
                      {rec.missing_tags.slice(0, 1).map(t => (
                        <span
                          key={t}
                          style={{
                            fontSize: 10,
                            background: "rgba(245, 158, 11, 0.1)",
                            color: "#fbbf24",
                            border: "1px solid rgba(245, 158, 11, 0.25)",
                            borderRadius: 4,
                            padding: "2px 6px"
                          }}
                        >
                          ⚠ Needs {t}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                      {rec.reasoning.slice(0, 120)}...
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <Link
                      href={`/student/opportunities`}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        textDecoration: "none",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 0",
                        borderRadius: 6,
                        backgroundColor: "#4f46e5",
                        color: "white"
                      }}
                    >
                      Apply Now
                    </Link>

                    <button
                      onClick={() => handleOpenWhy(rec.matching_tags[0] || "Python")}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 10px",
                        borderRadius: 6,
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#cbd5e1",
                        cursor: "pointer"
                      }}
                    >
                      Why?
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* CONNECTED CAREER TOOLS DOCK                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: 1 }}>
              CONNECTED PIPELINE MODULES & ARENAS
            </span>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              All modules feed evidence into Student DNA
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {existingModules.map(mod => (
              <Link
                key={mod.href}
                href={mod.href}
                style={{
                  textDecoration: "none",
                  backgroundColor: "rgba(15, 23, 42, 0.45)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.15s ease"
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${mod.color}20`,
                    border: `1px solid ${mod.color}50`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0
                  }}
                >
                  {mod.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
                    {mod.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {mod.desc}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* GLOBAL EVIDENCE DRAWER */}
      <GlobalEvidenceDrawer
        isOpen={evidenceDrawerOpen}
        onClose={() => setEvidenceDrawerOpen(false)}
        capabilityName={selectedCapability}
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
