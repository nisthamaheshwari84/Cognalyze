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
      <div style={{ minHeight: "100vh", background: "#F6F5F1", color: "#17191C", fontFamily: "var(--font-inter, sans-serif)" }}>
        <AppNav role="recruiter" />
        <main style={{ maxWidth: 1400, margin: "80px auto", textAlign: "center", color: "#667085" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#162A43" }}>Loading Candidate Decision Room...</div>
          <p style={{ fontSize: 13, color: "#667085", marginTop: 8 }}>Retrieving verified sources, repository artifacts, and confirmed role requirements.</p>
        </main>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div style={{ minHeight: "100vh", background: "#F6F5F1", color: "#17191C", fontFamily: "var(--font-inter, sans-serif)" }}>
        <AppNav role="recruiter" />
        <main style={{ maxWidth: 1400, margin: "80px auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#162A43" }}>No Candidate Selected</h2>
          <p style={{ color: "#667085", margin: "8px 0 16px" }}>{statusMessage || "Please select an applicant to inspect."}</p>
          <Link href="/recruiter/candidates" style={{ color: "#356AE6", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
            Return to Candidate Pool →
          </Link>
        </main>
      </div>
    );
  }

  const counts = dossier.coverageCounts;

  return (
    <div style={{ minHeight: "100vh", background: "#F6F5F1", color: "#17191C", fontFamily: "var(--font-inter, sans-serif)" }}>
      <AppNav role="recruiter" />

      {/* Main Container */}
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 13: PROGRESSIVE SCREENING WORKSPACE FUNNEL
        ───────────────────────────────────────────────────────────── */}
        <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Decision Room • Progressive Screening
              </span>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43", marginTop: 2 }}>
                Screening Pipeline: 1,000 Candidates Processed
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#667085" }}>
              Stage: <strong>UPLOAD → PARSE → SCREEN → COMPARE → VERIFY → DECIDE</strong>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
            {[
              { count: "1,000", label: "Uploaded", sub: "Candidate records parsed", active: false },
              { count: "342", label: "Evidence-Qualified", sub: "Req. skills & role alignment", active: false },
              { count: "86", label: "Strong Matches", sub: "Verified repo / project proof", active: false },
              { count: "18", label: "Shortlisted", sub: "Zero fatal gap conflicts", active: false },
              { count: "5", label: "Final Review", sub: `Current: ${dossier.candidateName}`, active: true }
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  background: step.active ? "#EEF4FD" : "#FAF9F6",
                  border: step.active ? "1.5px solid #356AE6" : "1px solid #E4E1DA",
                  borderRadius: 7,
                  padding: "10px 14px",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 700, color: step.active ? "#356AE6" : "#162A43" }}>
                  {step.count}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: step.active ? "#162A43" : "#17191C", marginTop: 2 }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                  {step.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            FIRST-SCREEN: CANDIDATE HEADER STRIP (Section 40)
        ───────────────────────────────────────────────────────────── */}
        <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: "#EEF4FD", color: "#356AE6", border: "1px solid #D1E2FB" }}>
                  DECISION ROOM • INVESTIGATION WORKSPACE
                </span>

                {dossier.isDemoData && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: "#FEF7ED", color: "#B7791F", border: "1px solid #FDE68A" }}>
                    DEMO DATA
                  </span>
                )}

                <span style={{ fontSize: 12, color: "#667085" }}>
                  Applied: {new Date(dossier.appliedAt).toLocaleDateString()}
                </span>
                <span style={{ fontSize: 12, color: "#E4E1DA" }}>•</span>
                <span style={{ fontSize: 12, color: "#667085" }}>
                  Evidence v{dossier.evidenceVersion}
                </span>
              </div>

              {/* Candidate Switcher Dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <select
                  value={dossier.candidateId}
                  onChange={(e) => handleSwitchCandidate(e.target.value)}
                  style={{
                    background: "#FFFFFF",
                    color: "#17191C",
                    border: "1px solid #E4E1DA",
                    padding: "7px 12px",
                    borderRadius: 7,
                    fontSize: 16,
                    fontWeight: 700,
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

                <span style={{ fontSize: 13, color: "#667085" }}>evaluating for:</span>

                {/* Role Switcher Dropdown */}
                <select
                  value={dossier.roleId}
                  onChange={(e) => handleSwitchRole(e.target.value)}
                  style={{
                    background: "#FFFFFF",
                    color: "#17191C",
                    border: "1px solid #E4E1DA",
                    padding: "7px 12px",
                    borderRadius: 7,
                    fontSize: 13,
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

              <div style={{ fontSize: 13, color: "#667085", marginTop: 6 }}>
                {blindMode ? "Identity & contact blinded for unbiased technical evaluation" : `${dossier.email} ${dossier.phone ? `• ${dossier.phone}` : ""}`} • Current Stage: <strong style={{ color: "#356AE6" }}>{dossier.currentStage}</strong>
              </div>
            </div>

            {/* Quick Actions: Evidence Passport, Blind Mode, Compare & Refresh */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Link
                href={`/recruiter/candidates/${dossier.candidateId}`}
                style={{
                  background: "#FFFFFF",
                  color: "#17191C",
                  border: "1px solid #E4E1DA",
                  padding: "7px 14px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.15s ease"
                }}
              >
                Evidence Passport →
              </Link>

              <button
                onClick={() => setBlindMode(!blindMode)}
                style={{
                  background: blindMode ? "#EEF4FD" : "#FFFFFF",
                  color: blindMode ? "#356AE6" : "#17191C",
                  border: `1px solid ${blindMode ? "#D1E2FB" : "#E4E1DA"}`,
                  padding: "7px 14px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {blindMode ? "Blind Mode: ON" : "Blind Mode: OFF"}
              </button>

              <button
                onClick={handleRefreshEvidence}
                disabled={refreshing}
                style={{
                  background: "#FFFFFF",
                  color: "#17191C",
                  border: "1px solid #E4E1DA",
                  padding: "7px 14px",
                  borderRadius: 7,
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
                  background: "#356AE6",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)"
                }}
              >
                Compare Candidates
              </button>
            </div>
          </div>

          {statusMessage && (
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 5, background: "#EAF4EE", border: "1px solid #C8E4D3", color: "#2E7D5B", fontSize: 12 }}>
              {statusMessage}
            </div>
          )}

          {/* Source Footprint & Requirement Summary Bar */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #E4E1DA", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16, alignItems: "center" }}>
            
            {/* Source Footprint Pills */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, textTransform: "uppercase" }}>
                Active Evidence Footprint
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 5, background: dossier.sourceFootprint.resume ? "#EAF4EE" : "#F6F5F1", color: dossier.sourceFootprint.resume ? "#2E7D5B" : "#98A2B3", border: `1px solid ${dossier.sourceFootprint.resume ? "#C8E4D3" : "#E4E1DA"}` }}>
                  Resume {dossier.sourceFootprint.resume ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 5, background: dossier.sourceFootprint.github ? "#EAF4EE" : "#F6F5F1", color: dossier.sourceFootprint.github ? "#2E7D5B" : "#98A2B3", border: `1px solid ${dossier.sourceFootprint.github ? "#C8E4D3" : "#E4E1DA"}` }}>
                  GitHub {dossier.sourceFootprint.github ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 5, background: dossier.sourceFootprint.linkedin ? "#EAF4EE" : "#F6F5F1", color: dossier.sourceFootprint.linkedin ? "#2E7D5B" : "#98A2B3", border: `1px solid ${dossier.sourceFootprint.linkedin ? "#C8E4D3" : "#E4E1DA"}` }}>
                  LinkedIn {dossier.sourceFootprint.linkedin ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 5, background: dossier.sourceFootprint.leetcode ? "#EAF4EE" : "#F6F5F1", color: dossier.sourceFootprint.leetcode ? "#2E7D5B" : "#98A2B3", border: `1px solid ${dossier.sourceFootprint.leetcode ? "#C8E4D3" : "#E4E1DA"}` }}>
                  LeetCode {dossier.sourceFootprint.leetcode ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 5, background: dossier.sourceFootprint.hackathon ? "#EAF4EE" : "#F6F5F1", color: dossier.sourceFootprint.hackathon ? "#2E7D5B" : "#98A2B3", border: `1px solid ${dossier.sourceFootprint.hackathon ? "#C8E4D3" : "#E4E1DA"}` }}>
                  Hackathons {dossier.sourceFootprint.hackathon ? "✓" : "—"}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 5, background: dossier.sourceFootprint.projects ? "#EAF4EE" : "#F6F5F1", color: dossier.sourceFootprint.projects ? "#2E7D5B" : "#98A2B3", border: `1px solid ${dossier.sourceFootprint.projects ? "#C8E4D3" : "#E4E1DA"}` }}>
                  Repositories ({dossier.inspectedProjects.length})
                </span>
              </div>
            </div>

            {/* Confirmed Role Requirement Counts */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, textTransform: "uppercase" }}>
                Confirmed Role Match Status ({counts.totalAssessed} Requirements)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3" }}>
                  {counts.supportedCount} Supported
                </span>
                {counts.partialCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "#FEF7ED", color: "#B7791F", border: "1px solid #FDE68A" }}>
                    {counts.partialCount} Partial
                  </span>
                )}
                {counts.notFoundCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "#F6F5F1", color: "#667085", border: "1px solid #E4E1DA" }}>
                    {counts.notFoundCount} Not Found
                  </span>
                )}
                {counts.conflictingCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "#FEECEB", color: "#C24141", border: "1px solid #F8C8C6" }}>
                    {counts.conflictingCount} Conflicting
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Highlights Strip */}
          <div style={{ marginTop: 14, background: "#FAF9F6", padding: "10px 14px", borderRadius: 7, border: "1px solid #E4E1DA", display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span style={{ color: "#2E7D5B", fontWeight: 700 }}>✓ Strongest Evidence:</span>{" "}
              <span style={{ color: "#17191C" }}>{dossier.topHighlights.strongestVerifiedEvidence}</span>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span style={{ color: "#B7791F", fontWeight: 700 }}>⚠ Verification Gap:</span>{" "}
              <span style={{ color: "#17191C" }}>{dossier.topHighlights.biggestVerificationGap}</span>
            </div>
            {dossier.topHighlights.importantConflict && (
              <div style={{ flex: 1, minWidth: 260 }}>
                <span style={{ color: "#C24141", fontWeight: 700 }}>⚠️ Discrepancy:</span>{" "}
                <span style={{ color: "#C24141" }}>{dossier.topHighlights.importantConflict}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PRIMARY 7-TAB NAVIGATION
        ───────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, background: "#FFFFFF", padding: 4, borderRadius: 7, border: "1px solid #E4E1DA", marginBottom: 16, overflowX: "auto" }}>
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
                padding: "8px 16px",
                borderRadius: 5,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: activeTab === tab.id ? "#162A43" : "transparent",
                color: activeTab === tab.id ? "#FFFFFF" : "#667085",
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 1. WHY THIS CANDIDATE IS HERE (Section 21) */}
            <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: 20, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>🎯</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#162A43" }}>
                  Why This Candidate Is Here (Stage: {dossier.currentStage})
                </h3>
              </div>
              <p style={{ fontSize: 13, color: "#667085", margin: "0 0 12px", lineHeight: 1.5 }}>
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
                      padding: "10px 14px",
                      borderRadius: 7,
                      background: item.isWarning ? "#FEF7ED" : "#EAF4EE",
                      border: `1px solid ${item.isWarning ? "#FDE68A" : "#C8E4D3"}`,
                      fontSize: 13,
                      color: item.isWarning ? "#B7791F" : "#2E7D5B"
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{item.isWarning ? "⚠" : "✓"}</span>
                    <span style={{ color: "#17191C" }}>{item.bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. NEEDS YOUR ATTENTION (Section 32) */}
            {dossier.needsAttention && dossier.needsAttention.length > 0 && (
              <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #F8C8C6", padding: 20, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>🚨</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#C24141" }}>
                    Needs Your Attention ({dossier.needsAttention.length} Items Requiring Human Judgment)
                  </h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                  {dossier.needsAttention.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#FEECEB",
                        border: "1px solid #F8C8C6",
                        borderRadius: 7,
                        padding: 14
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#C24141", marginBottom: 4 }}>
                        {item.issueTitle}
                      </div>
                      <div style={{ fontSize: 12, color: "#17191C", marginBottom: 6 }}>
                        {item.description}
                      </div>
                      <div style={{ fontSize: 12, color: "#667085", marginBottom: 8 }}>
                        <strong style={{ color: "#162A43" }}>Why it matters:</strong> {item.whyItMatters}
                      </div>
                      <div style={{ fontSize: 12, color: "#162A43", background: "#FFFFFF", border: "1px solid #E4E1DA", padding: "6px 10px", borderRadius: 5 }}>
                        <strong>Suggested verification:</strong> {item.suggestedVerification}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Professional Profile & Evidence Timeline */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
              {/* Left: Summary & Experience */}
              <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: 20, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px", color: "#162A43" }}>Professional Profile</h3>
                <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: "0 0 16px" }}>
                  {dossier.summary}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", padding: 12, borderRadius: 7 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#667085", textTransform: "uppercase" }}>Claimed Tenure</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#162A43", marginTop: 2 }}>
                      ~{dossier.claimedExperienceYears} Years
                    </div>
                  </div>
                  <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", padding: 12, borderRadius: 7 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#667085", textTransform: "uppercase" }}>Documented In Resume</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#356AE6", marginTop: 2 }}>
                      ~{dossier.documentedExperienceYears} Years
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 8px", color: "#162A43" }}>What Cognalyze Cannot Verify</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {dossier.whatCognalyzeCannotVerify?.map((limit, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: "#667085", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#98A2B3" }}>•</span>
                      <span>{limit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Evidence-Backed Timeline */}
              <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: 20, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", color: "#162A43" }}>Evidence-Backed Timeline</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {dossier.timeline.map((evt, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start", borderLeft: "2px solid #356AE6", paddingLeft: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6" }}>{evt.year}</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#17191C" }}>{evt.title}</div>
                        {evt.organization && <div style={{ fontSize: 12, color: "#667085" }}>{evt.organization}</div>}
                        <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 2 }}>Source: {evt.source}</div>
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
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <p style={{ fontSize: 13, color: "#667085", margin: 0 }}>
                Active external discovery across permitted developer sources. Ambiguous profiles with common names are never automatically attached.
              </p>
              <button
                onClick={handleRefreshEvidence}
                disabled={refreshing}
                style={{
                  background: "#FFFFFF",
                  color: "#17191C",
                  border: "1px solid #E4E1DA",
                  padding: "6px 12px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {refreshing ? "Re-checking Sources..." : "Re-check Sources"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
              {dossier.discoveredSources.map(src => (
                <div
                  key={src.sourceId}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 10,
                    border: "1px solid #E4E1DA",
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>
                        {src.sourceCategory.replace(/_/g, " ")}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 5,
                          background:
                            src.identityStatus === "VERIFIED"
                              ? "#EAF4EE"
                              : src.identityStatus === "AMBIGUOUS"
                              ? "#FEECEB"
                              : "#F6F5F1",
                          color:
                            src.identityStatus === "VERIFIED"
                              ? "#2E7D5B"
                              : src.identityStatus === "AMBIGUOUS"
                              ? "#C24141"
                              : "#667085",
                          border: `1px solid ${
                            src.identityStatus === "VERIFIED"
                              ? "#C8E4D3"
                              : src.identityStatus === "AMBIGUOUS"
                              ? "#F8C8C6"
                              : "#E4E1DA"
                          }`
                        }}
                      >
                        {src.identityStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>
                      {src.sourceName}
                    </div>

                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: "#356AE6", textDecoration: "none", display: "block", marginTop: 2, wordBreak: "break-all", fontWeight: 500 }}
                      >
                        {src.url} ↗
                      </a>
                    )}

                    <p style={{ fontSize: 12, color: "#667085", marginTop: 8, lineHeight: 1.4 }}>
                      {src.evidenceSummary}
                    </p>

                    <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 4 }}>
                      Identity: {src.identityReason}
                    </div>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#667085" }}>
                    <span>Items: <strong>{src.evidenceItemsCount}</strong></span>
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
            <div style={{ marginBottom: 14, fontSize: 13, color: "#667085" }}>
              Matched against confirmed role: <strong style={{ color: "#162A43" }}>{dossier.roleTitle}</strong> (v{dossier.roleVersion}). Controlled evidence states; absence of evidence is never evidence of absence.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dossier.requirementsMatch.map(reqMatch => (
                <div
                  key={reqMatch.requirementId}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 10,
                    border: "1px solid #E4E1DA",
                    padding: 18,
                    boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>
                        {reqMatch.tier} • {reqMatch.category}
                      </span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43", marginTop: 2 }}>
                        {reqMatch.requirementName}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 5,
                          background:
                            reqMatch.evidenceState === "SUPPORTED" || reqMatch.evidenceState === "CORROBORATED"
                              ? "#EAF4EE"
                              : reqMatch.evidenceState === "PARTIALLY_SUPPORTED" || reqMatch.evidenceState === "CANDIDATE_REPORTED"
                              ? "#FEF7ED"
                              : reqMatch.evidenceState === "EVIDENCE_NOT_FOUND"
                              ? "#F6F5F1"
                              : "#FEECEB",
                          color:
                            reqMatch.evidenceState === "SUPPORTED" || reqMatch.evidenceState === "CORROBORATED"
                              ? "#2E7D5B"
                              : reqMatch.evidenceState === "PARTIALLY_SUPPORTED" || reqMatch.evidenceState === "CANDIDATE_REPORTED"
                              ? "#B7791F"
                              : reqMatch.evidenceState === "EVIDENCE_NOT_FOUND"
                              ? "#667085"
                              : "#C24141",
                          border: `1px solid ${
                            reqMatch.evidenceState === "SUPPORTED" || reqMatch.evidenceState === "CORROBORATED"
                              ? "#C8E4D3"
                              : reqMatch.evidenceState === "PARTIALLY_SUPPORTED" || reqMatch.evidenceState === "CANDIDATE_REPORTED"
                              ? "#FDE68A"
                              : reqMatch.evidenceState === "EVIDENCE_NOT_FOUND"
                              ? "#E4E1DA"
                              : "#F8C8C6"
                          }`
                        }}
                      >
                        {reqMatch.evidenceState.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: 11, color: "#98A2B3" }}>
                        Depth: {reqMatch.evidenceDepth}
                      </span>
                    </div>
                  </div>

                  {/* Verbatim Candidate Quote */}
                  <div style={{ background: "#FAF9F6", borderLeft: "3px solid #356AE6", borderTop: "1px solid #E4E1DA", borderRight: "1px solid #E4E1DA", borderBottom: "1px solid #E4E1DA", padding: "10px 14px", borderRadius: "0 7px 7px 0", fontSize: 13, color: "#17191C", marginBottom: 10, lineHeight: 1.5 }}>
                    <strong>Candidate Evidence:</strong> “{reqMatch.candidateEvidence}”
                    <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>
                      Source: {reqMatch.sourceName} ({reqMatch.sourceLocation})
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, marginBottom: 10 }}>
                    {reqMatch.assessmentReasoning}
                  </div>

                  {reqMatch.evidenceGap && (
                    <div style={{ fontSize: 12, color: "#B7791F", marginBottom: 10 }}>
                      ⚠ Verification Gap: {reqMatch.evidenceGap}
                    </div>
                  )}

                  {/* Interactive [Why?] Provenance Button */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setActiveWhyMatch(reqMatch)}
                      style={{
                        background: "#EEF4FD",
                        color: "#356AE6",
                        border: "1px solid #D1E2FB",
                        padding: "5px 12px",
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Why this match? Inspect Audit Chain →
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
            <div style={{ marginBottom: 14, fontSize: 13, color: "#667085" }}>
              Inspected repositories and platform artifacts. Examines dependency declarations, test suites, architecture patterns, and commit history.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {dossier.inspectedProjects.map(proj => (
                <div
                  key={proj.projectId}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 10,
                    border: "1px solid #E4E1DA",
                    padding: 20,
                    boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#162A43" }}>
                        {proj.name}
                      </h4>
                      <p style={{ fontSize: 13, color: "#667085", margin: "2px 0 0" }}>
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
                          color: "#356AE6",
                          textDecoration: "none",
                          fontWeight: 600
                        }}
                      >
                        Inspect Repo ↗
                      </a>
                    )}
                  </div>

                  {/* Technical Depth & Technologies */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                      Verified Technical Implementation
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {proj.technologies.map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 12,
                            padding: "4px 10px",
                            borderRadius: 5,
                            background: "#FAF9F6",
                            border: "1px solid #E4E1DA",
                            color: "#17191C"
                          }}
                        >
                          <strong>{t.name}</strong> • <span style={{ color: "#356AE6" }}>{t.depth}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Architecture & Engineering Footprint */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#FAF9F6", border: "1px solid #E4E1DA", padding: 12, borderRadius: 7, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#667085", textTransform: "uppercase" }}>Architecture Patterns</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#17191C", marginTop: 2 }}>
                        {proj.architecturePatterns.join(", ") || "Standard Application"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#667085", textTransform: "uppercase" }}>Tests & CI/CD</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#17191C", marginTop: 2 }}>
                        {proj.testSuiteEvidence?.hasTests ? `✓ ${proj.testSuiteEvidence.testFilesCount} Test Files (${proj.testSuiteEvidence.framework})` : "No tests detected"} • {proj.deploymentEvidence?.hasDocker ? "Docker ✓" : "No Docker"}
                      </div>
                    </div>
                  </div>

                  {/* AI-Assistance Indicators & Counter-Signals */}
                  <div style={{ background: "#EEF4FD", border: "1px solid #D1E2FB", padding: 12, borderRadius: 7, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: "#356AE6", marginBottom: 4 }}>
                      Authorship & Development Pattern Analysis
                    </div>
                    <p style={{ color: "#17191C", margin: "0 0 6px", lineHeight: 1.5 }}>
                      {proj.aiAssistanceAnalysis.summary}
                    </p>
                    {proj.aiAssistanceAnalysis.counterSignals.map((cs, i) => (
                      <div key={i} style={{ color: "#2E7D5B", fontSize: 11, fontWeight: 500 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Left: What Cognalyze Knows */}
            <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: 20, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px", color: "#162A43" }}>
                What Cognalyze Knows
              </h3>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", textTransform: "uppercase", marginBottom: 6 }}>
                  VERIFIED ({dossier.whatCognalyzeKnows.verified.length})
                </div>
                {dossier.whatCognalyzeKnows.verified.map((v, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#17191C", marginBottom: 4, lineHeight: 1.4 }}>
                    ✓ {v}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", textTransform: "uppercase", marginBottom: 6 }}>
                  CANDIDATE-REPORTED ONLY ({dossier.whatCognalyzeKnows.candidateReported.length})
                </div>
                {dossier.whatCognalyzeKnows.candidateReported.map((c, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#B7791F", marginBottom: 4, lineHeight: 1.4 }}>
                    • {c}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                  EVIDENCE NOT FOUND ({dossier.whatCognalyzeKnows.unverified.length})
                </div>
                {dossier.whatCognalyzeKnows.unverified.map((u, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#667085", marginBottom: 4, lineHeight: 1.4 }}>
                    — {u}
                  </div>
                ))}
              </div>

              {dossier.whatCognalyzeKnows.conflicting.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#C24141", textTransform: "uppercase", marginBottom: 6 }}>
                    CONFLICTING DISCREPANCIES ({dossier.whatCognalyzeKnows.conflicting.length})
                  </div>
                  {dossier.whatCognalyzeKnows.conflicting.map((cf, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#C24141", marginBottom: 4, lineHeight: 1.4 }}>
                      ⚠️ {cf}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Candidate Claim Ledger */}
            <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: 20, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px", color: "#162A43" }}>
                Candidate Claim Ledger
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dossier.claimLedger.map(item => (
                  <div key={item.claimId} style={{ background: "#FAF9F6", padding: 12, borderRadius: 7, border: "1px solid #E4E1DA" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: "#17191C" }}>{item.claimText}</span>
                      <span style={{ fontSize: 11, color: "#356AE6" }}>{item.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
                      Source: {item.source} ({item.provenance})
                    </div>
                    <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 2 }}>
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
            <div style={{ marginBottom: 14, fontSize: 13, color: "#667085" }}>
              Targeted verification questions derived strictly from evidence gaps and role-critical uncertainties. Zero generic trivia questions.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {dossier.verificationTasks.map((task, idx) => (
                <div
                  key={task.taskId}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 10,
                    border: "1px solid #E4E1DA",
                    padding: 18,
                    boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43" }}>
                      Item {idx + 1}: Verify {task.claimOrGap} Depth
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 5,
                        background: task.priority === "HIGH" ? "#FEECEB" : "#FEF7ED",
                        color: task.priority === "HIGH" ? "#C24141" : "#B7791F",
                        border: `1px solid ${task.priority === "HIGH" ? "#F8C8C6" : "#FDE68A"}`
                      }}
                    >
                      {task.priority} PRIORITY
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#FAF9F6", border: "1px solid #E4E1DA", padding: 12, borderRadius: 7, marginBottom: 10, fontSize: 12 }}>
                    <div>
                      <span style={{ color: "#667085", fontWeight: 600 }}>Existing Evidence:</span>{" "}
                      <span style={{ color: "#17191C" }}>{task.existingEvidence}</span>
                    </div>
                    <div>
                      <span style={{ color: "#B7791F", fontWeight: 600 }}>What is Missing:</span>{" "}
                      <span style={{ color: "#B7791F" }}>{task.missingEvidence}</span>
                    </div>
                  </div>

                  <div style={{ background: "#EEF4FD", borderLeft: "3px solid #356AE6", borderTop: "1px solid #D1E2FB", borderRight: "1px solid #D1E2FB", borderBottom: "1px solid #D1E2FB", padding: 12, borderRadius: "0 7px 7px 0", fontSize: 13, color: "#17191C" }}>
                    <strong style={{ color: "#356AE6" }}>Suggested Interview Probe:</strong> {task.suggestedProbeQuestion}
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
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
            {/* Left: Recruiter Decision Workspace */}
            <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: 22, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 14px", color: "#162A43" }}>
                Record Hiring Decision
              </h3>

              {decisionSuccess && (
                <div style={{ padding: "10px 14px", borderRadius: 7, background: "#EAF4EE", border: "1px solid #C8E4D3", color: "#2E7D5B", fontSize: 13, marginBottom: 16 }}>
                  {decisionSuccess}
                </div>
              )}

              {/* System Evidence Recommendation Box */}
              <div style={{
                marginBottom: 16,
                padding: "14px 16px",
                borderRadius: 7,
                background: "#EEF4FD",
                border: "1px solid #D1E2FB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Evidence-Based System Recommendation
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43", marginTop: 2 }}>
                    {(dossier.whatCognalyzeKnows?.verified?.length || 0) >= 3 && (dossier.whatCognalyzeKnows?.conflicting?.length || 0) === 0
                      ? "Advance to Technical Interview"
                      : ((dossier.whatCognalyzeKnows?.conflicting?.length || 0) > 0 || (dossier.needsAttention?.length || 0) > 0)
                      ? "Request Verification / Address Active Conflicts"
                      : "Hold — Insufficient Direct Implementation Evidence"}
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isOverride ? "#C24141" : "#667085", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isOverride}
                    onChange={(e) => setIsOverride(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600 }}>Override Recommendation</span>
                </label>
              </div>

              {/* Conditional Recruiter Override Warning & Reason Input */}
              {isOverride && (
                <div style={{
                  marginBottom: 16,
                  padding: "14px",
                  borderRadius: 7,
                  background: "#FEECEB",
                  border: "1px solid #F8C8C6"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#C24141", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                    <span>⚠ Recruiter Override Active</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#17191C", marginBottom: 8, lineHeight: 1.4 }}>
                    Cognalyze requires a documented rationale whenever a human decision diverges from the verified evidence trail. This reason is immutably logged for auditability and calibration.
                  </div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#C24141", marginBottom: 4, textTransform: "uppercase" }}>
                    Mandatory Override Reason *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Strong verified domain experience not fully captured in submitted code repository..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#FFFFFF",
                      color: "#17191C",
                      border: "1px solid #F8C8C6",
                      padding: "8px 12px",
                      borderRadius: 7,
                      fontSize: 12,
                      outline: "none"
                    }}
                  />
                </div>
              )}

              {/* Action / Verdict */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#667085", marginBottom: 6 }}>
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
                        padding: "7px 14px",
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: decisionVerdict === v ? "#356AE6" : "#FFFFFF",
                        color: decisionVerdict === v ? "#FFFFFF" : "#17191C",
                        border: `1px solid ${decisionVerdict === v ? "#356AE6" : "#E4E1DA"}`,
                        transition: "all 0.15s ease"
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Stage */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#667085", marginBottom: 6 }}>
                  Transition to Stage:
                </label>
                <select
                  value={decisionStage}
                  onChange={(e) => setDecisionStage(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#FAF9F6",
                    color: "#17191C",
                    border: "1px solid #E4E1DA",
                    padding: "8px 12px",
                    borderRadius: 7,
                    fontSize: 13,
                    outline: "none"
                  }}
                >
                  {dossier.allowedStages.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Supporting Evidence Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#667085", marginBottom: 6 }}>
                  Select Supporting Evidence to Cite in Decision Record:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto", background: "#FAF9F6", padding: 12, borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  {dossier.requirementsMatch.map(m => (
                    <label key={m.requirementId} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#17191C", cursor: "pointer" }}>
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#667085", marginBottom: 6 }}>
                  Recruiter Rationale Note:
                </label>
                <textarea
                  rows={4}
                  placeholder="State the evidence-based rationale for this decision..."
                  value={recruiterNote}
                  onChange={(e) => setRecruiterNote(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#FAF9F6",
                    color: "#17191C",
                    border: "1px solid #E4E1DA",
                    padding: 10,
                    borderRadius: 7,
                    fontSize: 13,
                    lineHeight: 1.5,
                    outline: "none"
                  }}
                />
              </div>

              <button
                onClick={handleSaveDecision}
                disabled={savingDecision}
                style={{
                  background: "#356AE6",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: savingDecision ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)"
                }}
              >
                {savingDecision ? "Recording Decision..." : "Record & Transition Candidate →"}
              </button>
            </div>

            {/* Right: Immutable Decision History */}
            <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: 22, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 14px", color: "#162A43" }}>
                Immutable Decision History
              </h3>

              {dossier.decisionJournal ? (
                <div style={{ background: "#FAF9F6", padding: 14, borderRadius: 7, border: "1px solid #E4E1DA", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: "#2E7D5B" }}>Latest Action: {dossier.decisionJournal.verdict}</span>
                    <span style={{ color: "#667085" }}>{new Date(dossier.decisionJournal.decidedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.4 }}>
                    “{dossier.decisionJournal.rationale || "No human note recorded."}”
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", marginTop: 6 }}>
                    Decided by: {dossier.decisionJournal.decidedBy} • {dossier.decisionJournal.citedEvidenceIds.length} cited items
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#667085", fontStyle: "italic", marginBottom: 12 }}>
                  No prior decisions recorded for this candidate yet.
                </div>
              )}

              <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.5 }}>
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
              background: "rgba(22, 42, 67, 0.45)",
              backdropFilter: "blur(4px)",
              display: "flex",
              justifyContent: "flex-end",
              zIndex: 100
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 600,
                height: "100%",
                background: "#FFFFFF",
                borderLeft: "1px solid #E4E1DA",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "-10px 0 30px rgba(22, 42, 67, 0.15)"
              }}
            >
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", letterSpacing: "0.5px" }}>
                    TRACEABLE AUDIT CHAIN
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "2px 0 0", color: "#162A43" }}>
                    Why: {activeWhyMatch.requirementName} ({activeWhyMatch.evidenceState})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveWhyMatch(null)}
                  style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #E4E1DA", background: "#FAF9F6", color: "#667085", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#FAF9F6", padding: 14, borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>1. ROLE REQUIREMENT</div>
                  <div style={{ fontSize: 13, color: "#162A43", marginTop: 4, fontWeight: 600 }}>
                    {activeWhyMatch.whyAuditChain.roleRequirement}
                  </div>
                </div>

                <div style={{ background: "#FAF9F6", padding: 14, borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>2. CANDIDATE EVIDENCE LOCATED</div>
                  <div style={{ fontSize: 13, color: "#17191C", marginTop: 4, fontStyle: "italic" }}>
                    “{activeWhyMatch.whyAuditChain.candidateEvidence}”
                  </div>
                  <div style={{ fontSize: 11, color: "#356AE6", marginTop: 4, fontWeight: 500 }}>
                    Provenance: {activeWhyMatch.whyAuditChain.sourceProvenance}
                  </div>
                </div>

                <div style={{ background: "#FAF9F6", padding: 14, borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>3. ASSESSMENT LOGIC</div>
                  <div style={{ fontSize: 13, color: "#667085", marginTop: 4, lineHeight: 1.4 }}>
                    {activeWhyMatch.whyAuditChain.assessmentRule}
                  </div>
                </div>

                <div style={{ background: "#FAF9F6", padding: 14, borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>4. IDENTIFIED LIMITATIONS / GAPS</div>
                  <div style={{ fontSize: 13, color: "#B7791F", marginTop: 4 }}>
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
              background: "rgba(22, 42, 67, 0.45)",
              backdropFilter: "blur(4px)",
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
                background: "#FFFFFF",
                borderRadius: 12,
                border: "1px solid #E4E1DA",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 20px 40px -10px rgba(22, 42, 67, 0.18)"
              }}
            >
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#162A43" }}>
                    Side-by-Side Candidate Evidence Comparison
                  </h3>
                  <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                    Comparing verifiable evidence against confirmed role requirements without arbitrary scores.
                  </div>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #E4E1DA", background: "#FAF9F6", color: "#667085", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
                {compareLoading ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#667085" }}>
                    Generating evidence comparison matrix...
                  </div>
                ) : comparisonData ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#FAF9F6", borderBottom: "2px solid #E4E1DA" }}>
                        <th style={{ padding: "12px 16px", width: 280, color: "#667085", fontWeight: 700, textTransform: "uppercase", fontSize: 11 }}>
                          Role Requirement
                        </th>
                        {comparisonData.candidates.map((c: any) => (
                          <th key={c.id} style={{ padding: "12px 16px", color: "#162A43", minWidth: 220 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "#356AE6", marginTop: 2 }}>
                              Stage: {c.currentStage}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.requirementRows.map((row: any) => (
                        <tr key={row.requirementId} style={{ borderBottom: "1px solid #E4E1DA" }}>
                          <td style={{ padding: "14px 16px", verticalAlign: "top", background: "#FFFFFF" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>
                              {row.tier}
                            </span>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43", marginTop: 2 }}>
                              {row.requirementName}
                            </div>
                          </td>

                          {row.candidates.map((cell: any) => (
                            <td key={cell.candidateId} style={{ padding: "14px 16px", verticalAlign: "top" }}>
                              <div style={{ marginBottom: 6 }}>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 7px",
                                    borderRadius: 5,
                                    background: cell.evidenceState.includes("SUPPORTED") ? "#EAF4EE" : "#F6F5F1",
                                    color: cell.evidenceState.includes("SUPPORTED") ? "#2E7D5B" : "#667085",
                                    border: `1px solid ${cell.evidenceState.includes("SUPPORTED") ? "#C8E4D3" : "#E4E1DA"}`
                                  }}
                                >
                                  {cell.evidenceState}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.4, background: "#FAF9F6", border: "1px solid #E4E1DA", padding: "8px 10px", borderRadius: 5 }}>
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
