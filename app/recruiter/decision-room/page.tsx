"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  DecisionRoomDossier,
  DecisionRequirementMatch,
  InspectedProjectEvidence,
  VerificationTask,
  DiscoveredEvidenceSource,
  DecisionEvidenceState
} from "@/lib/decision-room/decision-engine";

type DecisionTab =
  | "candidate"
  | "evidence"
  | "role_match"
  | "projects"
  | "gaps_conflicts"
  | "verify"
  | "decide";

export default function RecruiterDecisionRoomPage() {
  // Navigation & Active Data State
  const [dossier, setDossier] = useState<DecisionRoomDossier | null>(null);
  const [candidatesList, setCandidatesList] = useState<{ id: string; name: string; email: string; currentStage: string }[]>([]);
  const [rolesList, setRolesList] = useState<{ id: string; title: string; version: number }[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<DecisionTab>("candidate");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Progressive Disclosure: [Why?] Drawer
  const [activeWhyMatch, setActiveWhyMatch] = useState<DecisionRequirementMatch | null>(null);

  // Blind Technical Screening Mode (Section 40)
  const [blindMode, setBlindMode] = useState(false);

  // Recruiter Decision & Override State (Section 37, 58)
  const [decisionStage, setDecisionStage] = useState<string>("Technical Interview");
  const [decisionVerdict, setDecisionVerdict] = useState<"Advance" | "Request Verification" | "Hold" | "Not Proceeding" | "Hire">("Advance");
  const [isOverride, setIsOverride] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [recruiterNote, setRecruiterNote] = useState<string>("");
  const [savingDecision, setSavingDecision] = useState<boolean>(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  // Candidate Comparison Modal
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareCandidateIds, setCompareCandidateIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Fetch initial dossier & lists
  useEffect(() => {
    loadDossier();
  }, []);

  async function loadDossier(candidateId?: string, roleId?: string) {
    setLoading(true);
    setStatusMessage(null);
    try {
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const targetCandidateId = candidateId || urlParams?.get("candidate") || urlParams?.get("candidateId") || "";
      const targetRoleId = roleId || urlParams?.get("role") || urlParams?.get("roleId") || "";

      let url = "/api/recruiter/decision-room";
      const params = new URLSearchParams();
      if (targetCandidateId) params.set("candidateId", targetCandidateId);
      if (targetRoleId) params.set("roleId", targetRoleId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.dossier) {
        setDossier(data.dossier);
        setSelectedCandidateId(data.dossier.candidateId);
        setSelectedRoleId(data.dossier.roleId);
        setCandidatesList(data.candidatesList || []);
        setRolesList(data.rolesList || []);
        setDecisionStage(data.dossier.currentStage || "Technical Interview");

        // Pre-select verified evidence IDs
        const preselected = data.dossier.requirementsMatch
          .filter((m: DecisionRequirementMatch) => m.evidenceState === "SUPPORTED" || m.evidenceState === "CORROBORATED")
          .map((m: DecisionRequirementMatch) => m.requirementId);
        setSelectedEvidenceIds(preselected);
      } else {
        setStatusMessage(data.error || "Failed to load Decision Room data.");
      }
    } catch (err: any) {
      console.error("Decision Room fetch failed", err);
      setStatusMessage("Network error connecting to Decision Room API.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Candidate or Role Change
  const handleSwitchCandidate = (newId: string) => {
    setSelectedCandidateId(newId);
    loadDossier(newId, selectedRoleId);
  };

  const handleSwitchRole = (newRoleId: string) => {
    setSelectedRoleId(newRoleId);
    loadDossier(selectedCandidateId, newRoleId);
  };

  // Refresh Evidence Trigger
  const handleRefreshEvidence = async () => {
    if (!dossier) return;
    setRefreshing(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/recruiter/decision-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refresh_evidence",
          candidateId: dossier.candidateId,
          roleId: dossier.roleId
        })
      });
      const data = await res.json();
      if (data.success && data.dossier) {
        setDossier(data.dossier);
        setStatusMessage("✓ Evidence refreshed from external connectors without altering prior decisions.");
      }
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Submit Recruiter Decision
  const handleSaveDecision = async () => {
    if (!dossier) return;
    if (isOverride && !overrideReason.trim()) {
      alert("Override reason is strictly required when overriding the system recommendation.");
      return;
    }

    setSavingDecision(true);
    setDecisionSuccess(null);
    try {
      const res = await fetch("/api/recruiter/decision-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_decision",
          candidateId: dossier.candidateId,
          roleId: dossier.roleId,
          stage: decisionStage,
          verdict: decisionVerdict,
          supportingEvidenceIds: selectedEvidenceIds,
          recruiterNote: recruiterNote.trim(),
          isOverride,
          recruiterOverrideReason: overrideReason.trim(),
          decidedBy: "Recruiter / Hiring Committee"
        })
      });
      const data = await res.json();
      if (data.success) {
        setDecisionSuccess(data.message || `✓ Decision recorded: Candidate transitioned to stage "${data.stage}".`);
        // Refresh local dossier
        setDossier(prev => prev ? { ...prev, currentStage: data.stage } : null);
        if (isOverride) {
          setIsOverride(false);
          setOverrideReason("");
        }
      } else {
        alert(data.error || "Failed to record decision.");
      }
    } catch (err: any) {
      alert("Error saving decision: " + err.message);
    } finally {
      setSavingDecision(false);
    }
  };

  // Open Candidate Comparison
  const handleOpenComparison = async () => {
    if (!dossier) return;
    const initialList = [dossier.candidateId, ...candidatesList.filter(c => c.id !== dossier.candidateId).slice(0, 2).map(c => c.id)];
    setCompareCandidateIds(initialList);
    setShowCompareModal(true);
    await loadComparison(initialList, dossier.roleId);
  };

  const loadComparison = async (ids: string[], roleId: string) => {
    setCompareLoading(true);
    try {
      const res = await fetch("/api/recruiter/decision-room/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, candidateIds: ids })
      });
      const data = await res.json();
      if (data.success) {
        setComparisonData(data);
      }
    } catch (err) {
      console.error("Comparison load failed", err);
    } finally {
      setCompareLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0F17", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        <AppNav role="recruiter" />
        <main style={{ maxWidth: 1400, margin: "80px auto", textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Loading Candidate Decision Room...</div>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>Retrieving verified sources, repository artifacts, and confirmed role requirements.</p>
        </main>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0F17", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        <AppNav role="recruiter" />
        <main style={{ maxWidth: 1400, margin: "80px auto", textAlign: "center" }}>
          <h2>No Candidate Selected</h2>
          <p style={{ color: "#94a3b8" }}>{statusMessage || "Please select an applicant to inspect."}</p>
          <Link href="/recruiter/candidates" style={{ color: "#818cf8", textDecoration: "underline" }}>
            Return to Candidate Pool →
          </Link>
        </main>
      </div>
    );
  }

  const counts = dossier.coverageCounts;

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F17", color: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <AppNav role="recruiter" />

      {/* Main Container */}
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* ─────────────────────────────────────────────────────────────
            FIRST-SCREEN: CANDIDATE HEADER STRIP (Section 40)
        ───────────────────────────────────────────────────────────── */}
        <div style={{ background: "#111827", borderRadius: 14, border: "1px solid #1f2937", padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
                  DECISION ROOM • INVESTIGATION WORKSPACE
                </span>

                {dossier.isDemoData && (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>
                    DEMO DATA
                  </span>
                )}

                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Applied: {new Date(dossier.appliedAt).toLocaleDateString()}
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>•</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Evidence v{dossier.evidenceVersion}
                </span>
              </div>

              {/* Candidate Switcher Dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <select
                  value={dossier.candidateId}
                  onChange={(e) => handleSwitchCandidate(e.target.value)}
                  style={{
                    background: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 18,
                    fontWeight: 800,
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  {candidatesList.map(c => (
                    <option key={c.id} value={c.id}>
                      {blindMode ? `Candidate #${c.id.slice(-4).toUpperCase()}` : c.name} ({c.currentStage})
                    </option>
                  ))}
                </select>

                <span style={{ fontSize: 14, color: "#94a3b8" }}>evaluating for:</span>

                {/* Role Switcher Dropdown */}
                <select
                  value={dossier.roleId}
                  onChange={(e) => handleSwitchRole(e.target.value)}
                  style={{
                    background: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.title} (v{r.version})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
                {blindMode ? "Identity & contact blinded for unbiased technical evaluation" : `${dossier.email} ${dossier.phone ? `• ${dossier.phone}` : ""}`} • Current Stage: <strong style={{ color: "#38bdf8" }}>{dossier.currentStage}</strong>
              </div>
            </div>

            {/* Quick Actions: Evidence Passport, Blind Mode, Compare & Refresh */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Link
                href={`/recruiter/candidates/${dossier.candidateId}`}
                style={{
                  background: "rgba(99,102,241,0.15)",
                  color: "#a5b4fc",
                  border: "1px solid rgba(99,102,241,0.35)",
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                Evidence Passport ↗
              </Link>

              <button
                onClick={() => setBlindMode(!blindMode)}
                style={{
                  background: blindMode ? "rgba(56,189,248,0.15)" : "#1e293b",
                  color: blindMode ? "#38bdf8" : "#cbd5e1",
                  border: `1px solid ${blindMode ? "rgba(56,189,248,0.4)" : "#334155"}`,
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {blindMode ? "👁️ Blind Mode: ON" : "👁️‍🗨️ Blind Mode: OFF"}
              </button>

              <button
                onClick={handleRefreshEvidence}
                disabled={refreshing}
                style={{
                  background: "#1e293b",
                  color: "#cbd5e1",
                  border: "1px solid #334155",
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: refreshing ? "not-allowed" : "pointer"
                }}
              >
                {refreshing ? "Refreshing..." : "↻ Refresh Evidence"}
              </button>

              <button
                onClick={handleOpenComparison}
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ⚡ Compare Candidates
              </button>
            </div>
          </div>

          {statusMessage && (
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", fontSize: 12 }}>
              {statusMessage}
            </div>
          )}

          {/* Source Footprint & Requirement Summary Bar */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1f2937", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16, alignItems: "center" }}>
            
            {/* Source Footprint Pills */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase" }}>
                Active Evidence Footprint
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: dossier.sourceFootprint.resume ? "rgba(16,185,129,0.15)" : "#1e293b", color: dossier.sourceFootprint.resume ? "#34d399" : "#64748b" }}>
                  Resume {dossier.sourceFootprint.resume ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: dossier.sourceFootprint.github ? "rgba(16,185,129,0.15)" : "#1e293b", color: dossier.sourceFootprint.github ? "#34d399" : "#64748b" }}>
                  GitHub {dossier.sourceFootprint.github ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: dossier.sourceFootprint.linkedin ? "rgba(16,185,129,0.15)" : "#1e293b", color: dossier.sourceFootprint.linkedin ? "#34d399" : "#64748b" }}>
                  LinkedIn {dossier.sourceFootprint.linkedin ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: dossier.sourceFootprint.leetcode ? "rgba(16,185,129,0.15)" : "#1e293b", color: dossier.sourceFootprint.leetcode ? "#34d399" : "#64748b" }}>
                  LeetCode {dossier.sourceFootprint.leetcode ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: dossier.sourceFootprint.hackathon ? "rgba(16,185,129,0.15)" : "#1e293b", color: dossier.sourceFootprint.hackathon ? "#34d399" : "#64748b" }}>
                  Hackathons {dossier.sourceFootprint.hackathon ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: dossier.sourceFootprint.projects ? "rgba(16,185,129,0.15)" : "#1e293b", color: dossier.sourceFootprint.projects ? "#34d399" : "#64748b" }}>
                  Repositories ({dossier.inspectedProjects.length})
                </span>
              </div>
            </div>

            {/* Confirmed Role Requirement Counts */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase" }}>
                Confirmed Role Match Status ({counts.totalAssessed} Requirements)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
                  {counts.supportedCount} Supported
                </span>
                {counts.partialCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
                    {counts.partialCount} Partial
                  </span>
                )}
                {counts.notFoundCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(100,116,139,0.15)", color: "#94a3b8" }}>
                    {counts.notFoundCount} Not Found
                  </span>
                )}
                {counts.conflictingCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(244,63,94,0.15)", color: "#fb7185" }}>
                    {counts.conflictingCount} Conflicting
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Highlights Strip */}
          <div style={{ marginTop: 14, background: "#0a0f1d", padding: "10px 14px", borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span style={{ color: "#34d399", fontWeight: 700 }}>✓ Strongest Evidence:</span>{" "}
              <span style={{ color: "#cbd5e1" }}>{dossier.topHighlights.strongestVerifiedEvidence}</span>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span style={{ color: "#fbbf24", fontWeight: 700 }}>⚠ Verification Gap:</span>{" "}
              <span style={{ color: "#cbd5e1" }}>{dossier.topHighlights.biggestVerificationGap}</span>
            </div>
            {dossier.topHighlights.importantConflict && (
              <div style={{ flex: 1, minWidth: 260 }}>
                <span style={{ color: "#fb7185", fontWeight: 700 }}>⚠️ Discrepancy:</span>{" "}
                <span style={{ color: "#fda4af" }}>{dossier.topHighlights.importantConflict}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PRIMARY 7-TAB NAVIGATION (Section 72 Rule)
        ───────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, background: "#111827", padding: 4, borderRadius: 10, border: "1px solid #1f2937", marginBottom: 20, overflowX: "auto" }}>
          {[
            { id: "candidate", label: "1. Candidate" },
            { id: "evidence", label: "2. Evidence Discovery" },
            { id: "role_match", label: `3. Role Match (${dossier.requirementsMatch.length})` },
            { id: "projects", label: `4. Projects & Work (${dossier.inspectedProjects.length})` },
            { id: "gaps_conflicts", label: "5. Gaps & Conflicts" },
            { id: "verify", label: `6. Verify (${dossier.verificationTasks.length})` },
            { id: "decide", label: "7. Decide & Audit" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DecisionTab)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: activeTab === tab.id ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#94a3b8",
                border: "none",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: CANDIDATE OVERVIEW (Sections 20, 21, 31, 32)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "candidate" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 1. WHY THIS CANDIDATE IS HERE (Section 21) */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>🎯</span>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                  Why This Candidate Is Here (Stage: {dossier.currentStage})
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>
                Cognalyze advanced this candidate based on substantiated criteria from the confirmed role version. No unsupported claims or arbitrary scores.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dossier.whyThisCandidateIsHere?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: item.isWarning ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)",
                      border: `1px solid ${item.isWarning ? "rgba(245,158,11,0.25)" : "rgba(16,185,129,0.25)"}`,
                      fontSize: 13,
                      color: item.isWarning ? "#fde68a" : "#a7f3d0"
                    }}
                  >
                    <span>{item.isWarning ? "⚠️" : "✓"}</span>
                    <span>{item.bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. NEEDS YOUR ATTENTION (Section 32) */}
            {dossier.needsAttention && dossier.needsAttention.length > 0 && (
              <div style={{ background: "#111827", borderRadius: 12, border: "1px solid rgba(244,63,94,0.3)", padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>🚨</span>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#fda4af" }}>
                    Needs Your Attention ({dossier.needsAttention.length} Items Requiring Human Judgment)
                  </h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                  {dossier.needsAttention.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#1c1917",
                        border: "1px solid rgba(244,63,94,0.25)",
                        borderRadius: 8,
                        padding: 14
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>
                        {item.issueTitle}
                      </div>
                      <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>
                        {item.description}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                        <strong>Why it matters:</strong> {item.whyItMatters}
                      </div>
                      <div style={{ fontSize: 11, color: "#38bdf8", background: "rgba(56,189,248,0.1)", padding: "6px 10px", borderRadius: 6 }}>
                        <strong>Suggested verification:</strong> {item.suggestedVerification}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Professional Profile & Evidence Timeline */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
              {/* Left: Summary & Experience */}
              <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Professional Profile</h3>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 16px" }}>
                  {dossier.summary}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: "#0f172a", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Claimed Tenure</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", marginTop: 2 }}>
                      ~{dossier.claimedExperienceYears} Years
                    </div>
                  </div>
                  <div style={{ background: "#0f172a", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Documented In Resume</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8", marginTop: 2 }}>
                      ~{dossier.documentedExperienceYears} Years
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 700, margin: "16px 0 10px" }}>What Cognalyze Cannot Verify (Section 31)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {dossier.whatCognalyzeCannotVerify?.map((limit, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#64748b" }}>•</span>
                      <span>{limit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Evidence-Backed Timeline */}
              <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Evidence-Backed Timeline</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {dossier.timeline.map((evt, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start", borderLeft: "2px solid #6366f1", paddingLeft: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8" }}>{evt.year}</span>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{evt.title}</div>
                        {evt.organization && <div style={{ fontSize: 12, color: "#94a3b8" }}>{evt.organization}</div>}
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Source: {evt.source}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: EVIDENCE DISCOVERY
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "evidence" && (
          <div>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                Active external discovery across permitted developer sources. Ambiguous profiles with common names are never automatically attached.
              </p>
              <button
                onClick={handleRefreshEvidence}
                disabled={refreshing}
                style={{
                  background: "#1e293b",
                  color: "#cbd5e1",
                  border: "1px solid #334155",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                {refreshing ? "Re-checking Sources..." : "Re-check Sources"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              {dossier.discoveredSources.map(src => (
                <div
                  key={src.sourceId}
                  style={{
                    background: "#111827",
                    borderRadius: 10,
                    border: "1px solid #1f2937",
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                        {src.sourceCategory.replace(/_/g, " ")}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background:
                            src.identityStatus === "VERIFIED"
                              ? "rgba(16,185,129,0.15)"
                              : src.identityStatus === "AMBIGUOUS"
                              ? "rgba(244,63,94,0.15)"
                              : "rgba(100,116,139,0.15)",
                          color:
                            src.identityStatus === "VERIFIED"
                              ? "#34d399"
                              : src.identityStatus === "AMBIGUOUS"
                              ? "#fb7185"
                              : "#94a3b8"
                        }}
                      >
                        {src.identityStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>
                      {src.sourceName}
                    </div>

                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: "#818cf8", textDecoration: "underline", display: "block", marginTop: 2, wordBreak: "break-all" }}
                      >
                        {src.url}
                      </a>
                    )}

                    <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 8, lineHeight: 1.4 }}>
                      {src.evidenceSummary}
                    </p>

                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      Identity: {src.identityReason}
                    </div>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #1f2937", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                    <span>Items: {src.evidenceItemsCount}</span>
                    <span>Last checked: {new Date(src.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: ROLE MATCH (Confirmed Requirements vs. Evidence)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "role_match" && (
          <div>
            <div style={{ marginBottom: 14, fontSize: 13, color: "#94a3b8" }}>
              Matched against confirmed role: <strong>{dossier.roleTitle}</strong> (v{dossier.roleVersion}). Controlled 10 evidence states; absence of evidence is never evidence of absence.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dossier.requirementsMatch.map(reqMatch => (
                <div
                  key={reqMatch.requirementId}
                  style={{
                    background: "#111827",
                    borderRadius: 10,
                    border: "1px solid #1f2937",
                    padding: 16
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                        {reqMatch.tier} • {reqMatch.category}
                      </span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", marginTop: 2 }}>
                        {reqMatch.requirementName}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background:
                            reqMatch.evidenceState === "SUPPORTED" || reqMatch.evidenceState === "CORROBORATED"
                              ? "rgba(16,185,129,0.15)"
                              : reqMatch.evidenceState === "PARTIALLY_SUPPORTED" || reqMatch.evidenceState === "CANDIDATE_REPORTED"
                              ? "rgba(245,158,11,0.15)"
                              : reqMatch.evidenceState === "EVIDENCE_NOT_FOUND"
                              ? "rgba(100,116,139,0.15)"
                              : "rgba(244,63,94,0.15)",
                          color:
                            reqMatch.evidenceState === "SUPPORTED" || reqMatch.evidenceState === "CORROBORATED"
                              ? "#34d399"
                              : reqMatch.evidenceState === "PARTIALLY_SUPPORTED" || reqMatch.evidenceState === "CANDIDATE_REPORTED"
                              ? "#fbbf24"
                              : reqMatch.evidenceState === "EVIDENCE_NOT_FOUND"
                              ? "#94a3b8"
                              : "#fb7185"
                        }}
                      >
                        {reqMatch.evidenceState.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: 10, color: "#64748b" }}>
                        Depth: {reqMatch.evidenceDepth}
                      </span>
                    </div>
                  </div>

                  {/* Verbatim Candidate Quote */}
                  <div style={{ background: "#0b0f17", borderLeft: "3px solid #6366f1", padding: "8px 12px", borderRadius: "0 6px 6px 0", fontSize: 12, color: "#cbd5e1", marginBottom: 8, lineHeight: 1.5 }}>
                    <strong>Candidate Evidence:</strong> “{reqMatch.candidateEvidence}”
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                      Source: {reqMatch.sourceName} ({reqMatch.sourceLocation})
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.4, marginBottom: 8 }}>
                    {reqMatch.assessmentReasoning}
                  </div>

                  {reqMatch.evidenceGap && (
                    <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 8 }}>
                      ⚠ Verification Gap: {reqMatch.evidenceGap}
                    </div>
                  )}

                  {/* Interactive [Why?] Provenance Button */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setActiveWhyMatch(reqMatch)}
                      style={{
                        background: "#1e293b",
                        color: "#a5b4fc",
                        border: "1px solid #334155",
                        padding: "4px 10px",
                        borderRadius: 5,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      [Why?] Inspect Audit Chain →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: PROJECTS & WORK ANALYSIS (Code, Tests, CI/CD, AI Indicators)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "projects" && (
          <div>
            <div style={{ marginBottom: 14, fontSize: 13, color: "#94a3b8" }}>
              Inspected repositories and platform artifacts. Examines dependency declarations, test suites, architecture patterns, and commit history without fake certainty.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {dossier.inspectedProjects.map(proj => (
                <div
                  key={proj.projectId}
                  style={{
                    background: "#111827",
                    borderRadius: 12,
                    border: "1px solid #1f2937",
                    padding: 20
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                        {proj.name}
                      </h4>
                      <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>
                        {proj.claimedDescription}
                      </p>
                    </div>

                    {proj.repositoryUrl && (
                      <a
                        href={proj.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12,
                          color: "#818cf8",
                          textDecoration: "underline"
                        }}
                      >
                        Inspect Repo ↗
                      </a>
                    )}
                  </div>

                  {/* Technical Depth & Technologies */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>
                      Verified Technical Implementation
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {proj.technologies.map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 12,
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: "#0f172a",
                            border: "1px solid #1e293b",
                            color: "#f8fafc"
                          }}
                        >
                          <strong>{t.name}</strong> • <span style={{ color: "#38bdf8" }}>{t.depth}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Architecture & Engineering Footprint */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#0b0f17", padding: 12, borderRadius: 8, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Architecture Patterns</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginTop: 2 }}>
                        {proj.architecturePatterns.join(", ") || "Standard Application"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Tests & CI/CD</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginTop: 2 }}>
                        {proj.testSuiteEvidence?.hasTests ? `✓ ${proj.testSuiteEvidence.testFilesCount} Test Files (${proj.testSuiteEvidence.framework})` : "No tests detected"} • {proj.deploymentEvidence?.hasDocker ? "Docker ✓" : "No Docker"}
                      </div>
                    </div>
                  </div>

                  {/* AI-Assistance Indicators & Counter-Signals (Section 13) */}
                  <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", padding: 12, borderRadius: 8, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: "#a5b4fc", marginBottom: 4 }}>
                      Authorship & Development Pattern Analysis
                    </div>
                    <p style={{ color: "#cbd5e1", margin: "0 0 6px", lineHeight: 1.5 }}>
                      {proj.aiAssistanceAnalysis.summary}
                    </p>
                    {proj.aiAssistanceAnalysis.counterSignals.map((cs, i) => (
                      <div key={i} style={{ color: "#34d399", fontSize: 11 }}>
                        • Counter-signal: {cs}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 5: GAPS & CONFLICTS ("What Cognalyze Knows" Ledger)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "gaps_conflicts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Left: What Cognalyze Knows */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 14px", color: "#f8fafc" }}>
                What Cognalyze Knows
              </h3>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", marginBottom: 6 }}>
                  VERIFIED ({dossier.whatCognalyzeKnows.verified.length})
                </div>
                {dossier.whatCognalyzeKnows.verified.map((v, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4, lineHeight: 1.4 }}>
                    ✓ {v}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>
                  CANDIDATE-REPORTED ONLY ({dossier.whatCognalyzeKnows.candidateReported.length})
                </div>
                {dossier.whatCognalyzeKnows.candidateReported.map((c, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#fde68a", marginBottom: 4, lineHeight: 1.4 }}>
                    • {c}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>
                  EVIDENCE NOT FOUND ({dossier.whatCognalyzeKnows.unverified.length})
                </div>
                {dossier.whatCognalyzeKnows.unverified.map((u, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4, lineHeight: 1.4 }}>
                    — {u}
                  </div>
                ))}
              </div>

              {dossier.whatCognalyzeKnows.conflicting.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fb7185", marginBottom: 6 }}>
                    CONFLICTING DISCREPANCIES ({dossier.whatCognalyzeKnows.conflicting.length})
                  </div>
                  {dossier.whatCognalyzeKnows.conflicting.map((cf, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#fda4af", marginBottom: 4, lineHeight: 1.4 }}>
                      ⚠️ {cf}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Candidate Claim Ledger */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 14px", color: "#f8fafc" }}>
                Candidate Claim Ledger
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dossier.claimLedger.map(item => (
                  <div key={item.claimId} style={{ background: "#0f172a", padding: 12, borderRadius: 8, border: "1px solid #1e293b" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: "#f8fafc" }}>{item.claimText}</span>
                      <span style={{ fontSize: 10, color: "#818cf8" }}>{item.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                      Source: {item.source} ({item.provenance})
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      Corroboration: {item.externalCorroboration}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 6: VERIFICATION CENTER (Targeted Recruiter Probes)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "verify" && (
          <div>
            <div style={{ marginBottom: 14, fontSize: 13, color: "#94a3b8" }}>
              Targeted verification questions derived strictly from evidence gaps and role-critical uncertainties. Zero generic trivia questions.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {dossier.verificationTasks.map((task, idx) => (
                <div
                  key={task.taskId}
                  style={{
                    background: "#111827",
                    borderRadius: 12,
                    border: "1px solid #1f2937",
                    padding: 18
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>
                      Item {idx + 1}: Verify {task.claimOrGap} Depth
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: task.priority === "HIGH" ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)",
                        color: task.priority === "HIGH" ? "#fb7185" : "#fbbf24"
                      }}
                    >
                      {task.priority} PRIORITY
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#0b0f17", padding: 12, borderRadius: 8, marginBottom: 10, fontSize: 12 }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Existing Evidence:</span>{" "}
                      <span style={{ color: "#cbd5e1" }}>{task.existingEvidence}</span>
                    </div>
                    <div>
                      <span style={{ color: "#fbbf24" }}>What is Missing:</span>{" "}
                      <span style={{ color: "#fde68a" }}>{task.missingEvidence}</span>
                    </div>
                  </div>

                  <div style={{ background: "rgba(99,102,241,0.08)", borderLeft: "3px solid #6366f1", padding: 10, borderRadius: "0 6px 6px 0", fontSize: 13, color: "#e2e8f0" }}>
                    <strong>Suggested Interview Probe:</strong> {task.suggestedProbeQuestion}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 7: DECIDE & AUDIT TRAIL (Human Decision Action)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "decide" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
            {/* Left: Recruiter Decision Workspace */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 14px", color: "#f8fafc" }}>
                Record Hiring Decision
              </h3>

              {decisionSuccess && (
                <div style={{ padding: "10px 14px", borderRadius: 6, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", fontSize: 13, marginBottom: 16 }}>
                  {decisionSuccess}
                </div>
              )}

              {/* System Evidence Recommendation Box */}
              <div style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 8,
                background: "rgba(56,189,248,0.08)",
                border: "1px solid rgba(56,189,248,0.25)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Evidence-Based System Recommendation
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", marginTop: 2 }}>
                    {(dossier.whatCognalyzeKnows?.verified?.length || 0) >= 3 && (dossier.whatCognalyzeKnows?.conflicting?.length || 0) === 0
                      ? "Advance to Technical Interview"
                      : ((dossier.whatCognalyzeKnows?.conflicting?.length || 0) > 0 || (dossier.needsAttention?.length || 0) > 0)
                      ? "Request Verification / Address Active Conflicts"
                      : "Hold — Insufficient Direct Implementation Evidence"}
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isOverride ? "#f43f5e" : "#94a3b8", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isOverride}
                    onChange={(e) => setIsOverride(e.target.checked)}
                  />
                  <span style={{ fontWeight: 700 }}>Override Recommendation</span>
                </label>
              </div>

              {/* Conditional Recruiter Override Warning & Reason Input */}
              {isOverride && (
                <div style={{
                  marginBottom: 16,
                  padding: "14px",
                  borderRadius: 8,
                  background: "rgba(244,63,94,0.1)",
                  border: "1px solid rgba(244,63,94,0.35)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fb7185", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                    <span>⚠️ Recruiter Override Active (Section 37)</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 8, lineHeight: 1.4 }}>
                    Cognalyze requires a documented rationale whenever a human decision diverges from the verified evidence trail. This reason is immutably logged for auditability and calibration.
                  </div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f87171", marginBottom: 4, textTransform: "uppercase" }}>
                    Mandatory Override Reason *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Strong verified domain experience not fully captured in submitted code repository..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#0b0f19",
                      color: "#f8fafc",
                      border: "1px solid rgba(244,63,94,0.4)",
                      padding: 8,
                      borderRadius: 6,
                      fontSize: 12,
                      outline: "none"
                    }}
                  />
                </div>
              )}

              {/* Action / Verdict */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
                  Recruiter Action / Verdict:
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["Advance", "Request Verification", "Hold", "Not Proceeding", "Hire"] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setDecisionVerdict(v);
                        if (v === "Advance") setDecisionStage("Technical Interview");
                        if (v === "Request Verification") setDecisionStage("Verification");
                        if (v === "Hold") setDecisionStage("Hold - Gathering Evidence");
                        if (v === "Not Proceeding") setDecisionStage("Rejected");
                        if (v === "Hire") setDecisionStage("Hired");
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        background: decisionVerdict === v ? "#6366f1" : "#1e293b",
                        color: decisionVerdict === v ? "#fff" : "#cbd5e1",
                        border: "1px solid #334155"
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Stage */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
                  Transition to Stage:
                </label>
                <select
                  value={decisionStage}
                  onChange={(e) => setDecisionStage(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontSize: 13
                  }}
                >
                  {dossier.allowedStages.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Supporting Evidence Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
                  Select Supporting Evidence to Cite in Decision Record:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto", background: "#0f172a", padding: 10, borderRadius: 6, border: "1px solid #1e293b" }}>
                  {dossier.requirementsMatch.map(m => (
                    <label key={m.requirementId} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#cbd5e1", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedEvidenceIds.includes(m.requirementId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvidenceIds(prev => [...prev, m.requirementId]);
                          } else {
                            setSelectedEvidenceIds(prev => prev.filter(id => id !== m.requirementId));
                          }
                        }}
                      />
                      <span>{m.requirementName} ({m.evidenceState})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Recruiter Rationale Note */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
                  Recruiter Rationale Note:
                </label>
                <textarea
                  rows={4}
                  placeholder="State the evidence-based rationale for this decision..."
                  value={recruiterNote}
                  onChange={(e) => setRecruiterNote(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#0f172a",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    padding: 10,
                    borderRadius: 6,
                    fontSize: 12,
                    lineHeight: 1.5,
                    outline: "none"
                  }}
                />
              </div>

              <button
                onClick={handleSaveDecision}
                disabled={savingDecision}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: savingDecision ? "not-allowed" : "pointer"
                }}
              >
                {savingDecision ? "Recording Decision..." : "Record & Transition Candidate →"}
              </button>
            </div>

            {/* Right: Immutable Decision History */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 14px", color: "#f8fafc" }}>
                Immutable Decision History
              </h3>

              {dossier.decisionJournal ? (
                <div style={{ background: "#0f172a", padding: 14, borderRadius: 8, border: "1px solid #1e293b", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: "#34d399" }}>Latest Action: {dossier.decisionJournal.verdict}</span>
                    <span style={{ color: "#64748b" }}>{new Date(dossier.decisionJournal.decidedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.4 }}>
                    “{dossier.decisionJournal.rationale || "No human note recorded."}”
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                    Decided by: {dossier.decisionJournal.decidedBy} • {dossier.decisionJournal.citedEvidenceIds.length} cited items
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", marginBottom: 12 }}>
                  No prior decisions recorded for this candidate yet.
                </div>
              )}

              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                Cognalyze maintains an append-only audit trail linking human decisions to the exact snapshot of candidate evidence and role version available at deliberation time.
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PROGRESSIVE DISCLOSURE: [Why?] AUDIT DRAWER (Section 52)
        ───────────────────────────────────────────────────────────── */}
        {activeWhyMatch && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              justifyContent: "flex-end",
              zIndex: 100
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 620,
                height: "100%",
                background: "#0d131f",
                borderLeft: "1px solid #1f2937",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: "0.5px" }}>
                    TRACEABLE AUDIT CHAIN
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "2px 0 0", color: "#f8fafc" }}>
                    Why: {activeWhyMatch.requirementName} ({activeWhyMatch.evidenceState})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveWhyMatch(null)}
                  style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "#111827", padding: 14, borderRadius: 8, border: "1px solid #1f2937" }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>1. ROLE REQUIREMENT</div>
                  <div style={{ fontSize: 13, color: "#f8fafc", marginTop: 4 }}>
                    {activeWhyMatch.whyAuditChain.roleRequirement}
                  </div>
                </div>

                <div style={{ background: "#111827", padding: 14, borderRadius: 8, border: "1px solid #1f2937" }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>2. CANDIDATE EVIDENCE LOCATED</div>
                  <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4, fontStyle: "italic" }}>
                    “{activeWhyMatch.whyAuditChain.candidateEvidence}”
                  </div>
                  <div style={{ fontSize: 11, color: "#38bdf8", marginTop: 4 }}>
                    Provenance: {activeWhyMatch.whyAuditChain.sourceProvenance}
                  </div>
                </div>

                <div style={{ background: "#111827", padding: 14, borderRadius: 8, border: "1px solid #1f2937" }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>3. ASSESSMENT LOGIC</div>
                  <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>
                    {activeWhyMatch.whyAuditChain.assessmentRule}
                  </div>
                </div>

                <div style={{ background: "#111827", padding: 14, borderRadius: 8, border: "1px solid #1f2937" }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>4. IDENTIFIED LIMITATIONS / GAPS</div>
                  <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 4 }}>
                    {activeWhyMatch.whyAuditChain.limitations}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            CANDIDATE COMPARISON MODAL (Section 24)
        ───────────────────────────────────────────────────────────── */}
        {showCompareModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(6px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 110,
              padding: 24
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 1200,
                maxHeight: "90vh",
                background: "#0d131f",
                borderRadius: 14,
                border: "1px solid #1f2937",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                    Side-by-Side Candidate Evidence Comparison
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    Comparing verifiable evidence against confirmed role requirements without arbitrary scores.
                  </div>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
                {compareLoading ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                    Generating evidence comparison matrix...
                  </div>
                ) : comparisonData ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#111827", borderBottom: "2px solid #1f2937" }}>
                        <th style={{ padding: "14px 16px", width: 280, color: "#94a3b8" }}>
                          Role Requirement
                        </th>
                        {comparisonData.candidates.map((c: any) => (
                          <th key={c.id} style={{ padding: "14px 16px", color: "#f8fafc", minWidth: 220 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>
                              Stage: {c.currentStage}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.requirementRows.map((row: any) => (
                        <tr key={row.requirementId} style={{ borderBottom: "1px solid #1e293b" }}>
                          <td style={{ padding: "14px 16px", verticalAlign: "top", background: "#0b0f17" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                              {row.tier}
                            </span>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", marginTop: 2 }}>
                              {row.requirementName}
                            </div>
                          </td>

                          {row.candidates.map((cell: any) => (
                            <td key={cell.candidateId} style={{ padding: "14px 16px", verticalAlign: "top" }}>
                              <div style={{ marginBottom: 4 }}>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: cell.evidenceState.includes("SUPPORTED") ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                                    color: cell.evidenceState.includes("SUPPORTED") ? "#34d399" : "#94a3b8"
                                  }}
                                >
                                  {cell.evidenceState}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.4, background: "#080d1a", padding: "6px 8px", borderRadius: 4 }}>
                                “{cell.candidateEvidence}”
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
