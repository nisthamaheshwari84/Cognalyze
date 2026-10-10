"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { MultiSourceCandidateProfile } from "@/lib/recruiter-store";
import { RoleDNA } from "@/lib/ai/role-dna";
import { CandidateScreeningDossier, RequirementAssessmentItem } from "@/lib/screening/candidate-screening-engine";
import {
  evaluateCandidateRisks,
  analyzeProjectOwnership,
  getPiiMinimizedProfile,
  CandidateRiskAnalysis,
  ProjectOwnershipAnalysis,
} from "@/lib/recruiter/recruiter-intelligence";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  GitBranch,
  ExternalLink,
  Layers,
  FileText,
  Sparkles
} from "lucide-react";

export default function CandidateEvidencePassportPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = typeof params?.id === "string" ? params.id : "";

  const [candidate, setCandidate] = useState<MultiSourceCandidateProfile | null>(null);
  const [role, setRole] = useState<RoleDNA | null>(null);
  const [dossier, setDossier] = useState<CandidateScreeningDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Section 20-23: Role-Specific Student DNA Snapshot & Controlled Refresh
  const [dnaSnapshot, setDnaSnapshot] = useState<any | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotRefreshing, setSnapshotRefreshing] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshReason, setRefreshReason] = useState("");
  const [activeSnapshotTab, setActiveSnapshotTab] = useState<"snapshot" | "passport">("snapshot");

  // Section 40: Blind Technical Screening (PII-Minimized Review)
  const [blindMode, setBlindMode] = useState(false);

  // Progressive Disclosure: [WHY?] and [SHOW PROOF] Drawer
  const [inspectedReq, setInspectedReq] = useState<RequirementAssessmentItem | null>(null);
  const [proofDrawerOpen, setProofDrawerOpen] = useState(false);

  // Project Ownership Verification
  const [activeProject, setActiveProject] = useState<string>("");
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectOwnershipAnalysis | null>(null);

  // Risks
  const [riskAnalysis, setRiskAnalysis] = useState<CandidateRiskAnalysis | null>(null);

  // Recruiter Override / Quick Decision state
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedVerdict, setSelectedVerdict] = useState<"Advance" | "Hold" | "Decline">("Advance");
  const [overrideReason, setOverrideReason] = useState("");
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    loadCandidateData();
  }, [candidateId]);

  async function loadCandidateData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recruiter/candidates/${candidateId}`);
      const data = await res.json();
      if (data.success && data.candidate) {
        setCandidate(data.candidate);
        setDossier(data.dossier || data.candidate.screeningDossier || null);

        // Fetch Role DNA
        if (data.candidate.appliedRoleId) {
          const roleRes = await fetch(`/api/recruiter/roles/${data.candidate.appliedRoleId}`);
          const roleData = await roleRes.json();
          if (roleData.success && roleData.role) {
            setRole(roleData.role);
          }
        }

        // Risks
        const risks = evaluateCandidateRisks(data.candidate);
        setRiskAnalysis(risks);

        // Project ownership analysis
        const projName = data.candidate.studentProjects?.[0]?.title || data.candidate.githubData?.repos?.[0]?.name || "Core Project";
        setActiveProject(projName);
        const proj = analyzeProjectOwnership(data.candidate, projName);
        setProjectAnalysis(proj);
      } else {
        setError(data.error || "Failed to load candidate passport.");
      }
    } catch (err: any) {
      console.error("Error loading candidate passport:", err);
      setError("Network error connecting to candidate intelligence API.");
    } finally {
      setLoading(false);
    }

    // Load point-in-time role-specific Student DNA snapshot
    loadDNASnapshot();
  }

  async function loadDNASnapshot() {
    setSnapshotLoading(true);
    try {
      const snapRes = await fetch(`/api/recruiter/candidates/${candidateId}/dna-snapshot`);
      const snapData = await snapRes.json();
      if (snapData.success && snapData.snapshot) {
        setDnaSnapshot(snapData.snapshot);
      }
    } catch (e) {
      console.error("Error loading Student DNA Snapshot:", e);
    } finally {
      setSnapshotLoading(false);
    }
  }

  async function handleRefreshSnapshot() {
    if (!dnaSnapshot) return;
    setSnapshotRefreshing(true);
    try {
      const res = await fetch(`/api/recruiter/candidates/${candidateId}/dna-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: candidate?.appliedRoleId,
          reason: refreshReason.trim() || "Candidate updated verified GitHub codebase and completed assessments."
        }),
      });
      const data = await res.json();
      if (data.success && data.snapshot) {
        setDnaSnapshot(data.snapshot);
        setShowRefreshModal(false);
        setRefreshReason("");
        alert(`Snapshot refreshed to Version ${data.snapshot.snapshotVersion}! Historical version audit trail appended.`);
      } else {
        alert(data.error || "Failed to refresh snapshot");
      }
    } catch (e: any) {
      alert("Error refreshing snapshot: " + e.message);
    } finally {
      setSnapshotRefreshing(false);
    }
  }

  const handleInspectProof = (req: RequirementAssessmentItem) => {
    setInspectedReq(req);
    setProofDrawerOpen(true);
  };

  const handleSaveDecision = async () => {
    if (!candidate) return;
    setDecisionSaving(true);
    setDecisionSuccess(null);
    try {
      const res = await fetch("/api/recruiter/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          roleId: candidate.appliedRoleId,
          verdict: selectedVerdict,
          stage: selectedVerdict === "Advance" ? "Technical Interview" : selectedVerdict === "Hold" ? "Hold - Gathering Evidence" : "Rejected",
          overrideReason: overrideReason.trim() ? overrideReason : undefined,
          isOverride: Boolean(overrideReason.trim()),
          rationale: `Recruiter decision: ${selectedVerdict}. ${overrideReason ? `Override reason: ${overrideReason}` : "Aligned with multi-source evidence."}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDecisionSuccess(`Decision logged successfully: Candidate moved to ${selectedVerdict}.`);
        setCandidate((prev) => prev ? { ...prev, currentStage: selectedVerdict === "Advance" ? "Interviewing" : selectedVerdict === "Hold" ? "Hold - Gathering Evidence" : "Rejected" } : null);
        setTimeout(() => setShowDecisionModal(false), 1200);
      } else {
        alert(data.error || "Failed to record decision.");
      }
    } catch (err: any) {
      alert("Error saving decision: " + err.message);
    } finally {
      setDecisionSaving(false);
    }
  };

  const displayCand = candidate ? (blindMode ? getPiiMinimizedProfile(candidate) : candidate) : null;

  const getSnapshotStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return { color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3", label: "VERIFIED" };
      case "DEMONSTRATED":
        return { color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB", label: "DEMONSTRATED" };
      case "PARTIALLY_CORROBORATED":
        return { color: "#B7791F", bg: "#FEF8EC", border: "#F9E4B7", label: "PARTIAL PROOF" };
      case "SELF-REPORTED":
      case "SELF_REPORTED":
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "SELF-REPORTED" };
      case "UNVERIFIED":
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "UNVERIFIED" };
      case "CONFLICTING":
        return { color: "#C24141", bg: "#FDF2F2", border: "#F8D7DA", label: "CONFLICTING" };
      case "UNKNOWN":
      default:
        return { color: "#98A2B3", bg: "#FAFAFA", border: "#E4E1DA", label: "UNKNOWN" };
    }
  };

  const getMatchStateBadge = (state: string) => {
    switch (state) {
      case "SUPPORTED":
      case "VERIFIED":
      case "DEMONSTRATED":
        return { color: "var(--color-success)", bg: "var(--color-success-bg)", border: "var(--color-success)", label: state };
      case "PARTIAL":
      case "PARTIALLY_SUPPORTED":
      case "DEVELOPING":
        return { color: "var(--color-warning)", bg: "#FEF7ED", border: "#F8D8A7", label: state };
      case "MISSING":
      case "INSUFFICIENT_EVIDENCE":
        return { color: "var(--text-secondary)", bg: "var(--bg-canvas)", border: "var(--border-subtle)", label: "INSUFFICIENT EVIDENCE" };
      case "CONFLICTING":
      case "EVIDENCE_MISMATCH":
        return { color: "var(--color-error)", bg: "#FDF2F2", border: "#F8C8C8", label: state };
      default:
        return { color: "var(--brand-cobalt)", bg: "#EFF4FE", border: "#D2E0FB", label: state };
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}>
        <AppNav role="recruiter" />
        <div style={{ maxWidth: 1100, margin: "80px auto", textAlign: "center", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          Loading Candidate Evidence Passport...
        </div>
      </div>
    );
  }

  if (error || !displayCand) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}>
        <AppNav role="recruiter" />
        <div style={{ maxWidth: 800, margin: "80px auto", textAlign: "center", padding: 32, background: "var(--surface)", border: "1px solid #F8C8C8", borderRadius: 10 }}>
          <h2 style={{ color: "var(--color-error)" }}>Candidate Not Found</h2>
          <p style={{ color: "var(--text-secondary)" }}>{error || "Could not retrieve the requested candidate record."}</p>
          <Link href="/recruiter/candidates" style={{ color: "var(--brand-cobalt)", textDecoration: "none", fontWeight: 700 }}>
            ← Back to Candidate Pool
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* BREADCRUMB & CONTROLS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <Link href="/recruiter" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Command Center</Link>
            <span>/</span>
            <Link href="/recruiter/candidates" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Candidates</Link>
            <span>/</span>
            <span style={{ color: "var(--brand-navy)", fontWeight: 700 }}>Evidence Passport</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Blind Screening Toggle */}
            <button
              onClick={() => setBlindMode(!blindMode)}
              style={{
                background: blindMode ? "#162A43" : "var(--surface)",
                border: `1px solid ${blindMode ? "#162A43" : "var(--border-subtle)"}`,
                borderRadius: 7,
                padding: "7px 14px",
                color: blindMode ? "#FFFFFF" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              <span>{blindMode ? "👁️‍🗨️ Blind Mode (ON)" : "👁️ Blind Mode (OFF)"}</span>
            </button>

            <button
              onClick={() => setShowDecisionModal(true)}
              style={{
                background: "var(--brand-cobalt)",
                border: "none",
                borderRadius: 7,
                padding: "8px 18px",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(53, 106, 230, 0.3)",
              }}
            >
              ⚖️ Log Recruiter Decision
            </button>

            <Link
              href={`/recruiter/decision-room?candidate=${candidate?.id}&role=${candidate?.appliedRoleId}`}
              style={{
                textDecoration: "none",
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 7,
                padding: "8px 16px",
                color: "var(--brand-navy)",
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              Open in Decision Room →
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* HEADER PASSPORT HERO                                       */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 10,
            padding: "24px 28px",
            marginBottom: 28,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "var(--brand-cobalt)",
                    background: "var(--color-info-bg)",
                    padding: "2px 8px",
                    borderRadius: 5,
                    border: "1px solid #D2E0FB",
                  }}
                >
                  Candidate Evidence Passport
                </span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  Persistent multi-source verified record
                </span>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "var(--brand-navy)", letterSpacing: "-0.02em" }}>
                {displayCand.name}
              </h1>

              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                Applied for: <strong style={{ color: "var(--brand-navy)" }}>{displayCand.appliedRoleTitle}</strong> • Stage:{" "}
                <span style={{ color: "var(--brand-cobalt)", fontWeight: 700 }}>{displayCand.currentStage}</span> • Source:{" "}
                <span style={{ color: "var(--text-primary)" }}>{displayCand.sourceType}</span>
              </div>
            </div>

            {/* QUICK STATS */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>Verified Repos</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-success)", marginTop: 2 }}>
                  {displayCand.githubData?.verifiedReposCount || 0}
                </div>
              </div>

              <div style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>Algorithmic DSA</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--brand-cobalt)", marginTop: 2 }}>
                  {displayCand.leetCodeProfile?.problemsSolved || 0}
                </div>
              </div>

              <div style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>Assessed Rounds</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--brand-navy)", marginTop: 2 }}>
                  {(displayCand.priorCognalyzeInterviewHistory || []).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SNAPSHOT VS PASSPORT TABS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setActiveSnapshotTab("snapshot")}
              style={{
                background: activeSnapshotTab === "snapshot" ? "var(--brand-navy)" : "var(--surface)",
                border: `1px solid ${activeSnapshotTab === "snapshot" ? "var(--brand-navy)" : "var(--border-subtle)"}`,
                color: activeSnapshotTab === "snapshot" ? "#FFFFFF" : "var(--brand-navy)",
                padding: "8px 16px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🧬 Role-Specific Student DNA Snapshot
              {dnaSnapshot && (
                <span style={{ fontSize: 10, background: activeSnapshotTab === "snapshot" ? "#356AE6" : "#EAF4EE", color: activeSnapshotTab === "snapshot" ? "#FFFFFF" : "#2E7D5B", padding: "1px 6px", borderRadius: 4 }}>
                  v{dnaSnapshot.snapshotVersion}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSnapshotTab("passport")}
              style={{
                background: activeSnapshotTab === "passport" ? "var(--brand-navy)" : "var(--surface)",
                border: `1px solid ${activeSnapshotTab === "passport" ? "var(--brand-navy)" : "var(--border-subtle)"}`,
                color: activeSnapshotTab === "passport" ? "#FFFFFF" : "var(--brand-navy)",
                padding: "8px 16px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📑 Multi-Source Screening Passport
            </button>
          </div>

          {activeSnapshotTab === "snapshot" && dnaSnapshot && (
            <button
              onClick={() => setShowRefreshModal(true)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--brand-cobalt)",
                color: "var(--brand-cobalt)",
                padding: "6px 14px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={13} className={snapshotRefreshing ? "animate-spin" : ""} />
              Controlled Refresh (v{dnaSnapshot.snapshotVersion + 1})
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* VIEW A: ROLE-SPECIFIC STUDENT DNA SNAPSHOT (SECTION 20-23) */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeSnapshotTab === "snapshot" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {snapshotLoading && !dnaSnapshot ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" }}>
                  Retrieving Point-in-Time Student DNA Snapshot...
                </div>
              </div>
            ) : dnaSnapshot ? (
              <>
                {/* 1. SNAPSHOT PROVENANCE & SUMMARY CARD */}
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    padding: "22px 26px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", background: "#EAF4EE", border: "1px solid #C8E4D3", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>
                          Frozen Point-in-Time Snapshot
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          Snapshot ID: <strong style={{ color: "var(--brand-navy)" }}>{dnaSnapshot.id}</strong>
                        </span>
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--brand-navy)", margin: 0 }}>
                        Candidate DNA Alignment for {displayCand.appliedRoleTitle}
                      </h2>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                        Applied on {new Date(dnaSnapshot.createdAt).toLocaleString()} • Student DNA v{dnaSnapshot.studentDNAVersion} • Resume: {dnaSnapshot.resumeRef}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", borderRadius: 7, padding: "8px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Alignment Score</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--brand-cobalt)", marginTop: 2 }}>{dnaSnapshot.roleAlignmentScore}%</div>
                      </div>
                      <div style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", borderRadius: 7, padding: "8px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Confidence</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-success)", marginTop: 2 }}>{dnaSnapshot.assessmentConfidence}%</div>
                      </div>
                      <div style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", borderRadius: 7, padding: "8px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Evidence Coverage</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--brand-navy)", marginTop: 2 }}>{dnaSnapshot.evidenceCoverage}%</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#F9F8F5", padding: "14px 16px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 4 }}>
                      Role-Specific Candidate Summary:
                    </div>
                    <div style={{ fontSize: 13, color: "var(--brand-navy)", lineHeight: 1.5 }}>
                      {dnaSnapshot.candidateSummary}
                    </div>
                  </div>
                </div>

                {/* 2. REQUIREMENT-BY-REQUIREMENT ALIGNMENT TABLE */}
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    padding: "22px 26px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--brand-navy)", margin: 0, textTransform: "uppercase" }}>
                        Requirement-by-Requirement Technical Alignment
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "3px 0 0" }}>
                        Evidence-evaluated status for each requirement specified in the job description.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {dnaSnapshot.requirementAssessments.map((req: any, idx: number) => {
                      const sBadge = getSnapshotStatusBadge(req.alignmentStatus);
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: "#FAF9F6",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: 8,
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 12,
                          }}
                        >
                          <div style={{ maxWidth: 640 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" }}>
                                {req.requirementName}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: req.requirementType === "MUST_HAVE" ? "var(--color-error)" : "var(--brand-cobalt)",
                                  background: req.requirementType === "MUST_HAVE" ? "#FDF2F2" : "#EFF4FE",
                                  border: `1px solid ${req.requirementType === "MUST_HAVE" ? "#F8C8C8" : "#D2E0FB"}`,
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                {req.requirementType === "MUST_HAVE" ? "Must-Have" : "Preferred"}
                              </span>
                            </div>

                            <div style={{ fontSize: 12, color: "var(--brand-navy)", marginTop: 6, lineHeight: 1.4 }}>
                              <strong>Evidence Citation:</strong> {req.supportingEvidence}
                            </div>

                            {req.uncertaintyOrLimitation && (
                              <div style={{ fontSize: 11, color: "var(--color-warning)", marginTop: 4, fontStyle: "italic" }}>
                                Note: {req.uncertaintyOrLimitation}
                              </div>
                            )}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: sBadge.color,
                                backgroundColor: sBadge.bg,
                                border: `1px solid ${sBadge.border}`,
                                padding: "3px 8px",
                                borderRadius: 5,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {sBadge.label}
                            </span>
                            <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                              Confidence: {req.confidence}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. TWO COLUMNS: VERIFIED CAPABILITIES VS SELF-REPORTED (UNVERIFIED) CLAIMS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                  {/* LEFT: VERIFIED SKILLS */}
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      padding: "20px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-success)", textTransform: "uppercase" }}>
                        ✓ Relevant Demonstrated Skills
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Artifact-backed</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {dnaSnapshot.relevantDemonstratedSkills.map((s: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            background: "#FBFDFB",
                            border: "1px solid #C8E4D3",
                            borderRadius: 6,
                            padding: "8px 12px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>{s.skillName}</div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                              Level: {s.demonstratedLevel}/5 • {s.evidenceCount} proof signals
                            </div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#2E7D5B", background: "#EAF4EE", border: "1px solid #C8E4D3", padding: "2px 6px", borderRadius: 4 }}>
                            {s.verificationState}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: SELF-REPORTED (UNVERIFIED) CLAIMS */}
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      padding: "20px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-warning)", textTransform: "uppercase" }}>
                        ○ Unverified Claims &amp; Resume Statements
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Pending Corroboration</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {dnaSnapshot.unverifiedClaims.map((c: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            background: "#FEF8EC",
                            border: "1px solid #F9E4B7",
                            borderRadius: 6,
                            padding: "8px 12px",
                            fontSize: 12,
                            color: "var(--brand-navy)",
                            lineHeight: 1.4,
                          }}
                        >
                          <strong>{c.claim}:</strong> <span style={{ color: "var(--text-secondary)" }}>{c.source} ({c.status})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. UNCERTAIN REQUIREMENTS & LIMITATIONS */}
                {dnaSnapshot.missingOrUncertainRequirements.length > 0 && (
                  <div
                    style={{
                      background: "#FDFDFD",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      padding: "18px 22px",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--brand-navy)", textTransform: "uppercase", marginBottom: 6 }}>
                      Uncertain / Unassessed Requirements
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: 1.4 }}>
                      The following requirements lack sufficient concrete evidence in the candidate's public artifacts. Cognalyze treats these as unknown opportunities for interview probing, rather than proven incompetence.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {dnaSnapshot.missingOrUncertainRequirements.map((u: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            background: "#F6F5F1",
                            border: "1px solid #E4E1DA",
                            borderRadius: 6,
                            padding: "6px 10px",
                            fontSize: 11,
                            color: "var(--brand-navy)",
                          }}
                        >
                          <strong>○ {u.requirement}:</strong> <span style={{ color: "var(--text-secondary)" }}>{u.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. HISTORICAL REFRESH AUDIT TRAIL */}
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    padding: "20px 24px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--brand-navy)", margin: 0, textTransform: "uppercase" }}>
                        Snapshot Version History &amp; Controlled Refresh Audit Trail
                      </h4>
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                        Strict historical immutability: Snapshot versions are frozen at trigger-time and never overwritten silently.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dnaSnapshot.refreshAuditHistory.map((h: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          background: "#FAF9F6",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 6,
                          padding: "8px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 11,
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 800, color: "var(--brand-cobalt)", marginRight: 8 }}>
                            v{h.version}
                          </span>
                          <span style={{ color: "var(--brand-navy)" }}>{h.reason}</span>
                        </div>
                        <div style={{ color: "var(--text-secondary)" }}>
                          Triggered by {h.triggeredBy} • {new Date(h.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* VIEW B: SCREENING PASSPORT & PROVENANCE (ORIGINAL VIEWS)   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeSnapshotTab === "passport" && (
          <div>
        {/* SECTION 2: EVIDENCE PROVENANCE & INDEPENDENCE              */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase", color: "var(--brand-navy)", margin: 0 }}>
                Evidence Provenance &amp; Independence
              </h2>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Strict invariant: Repeated self-reported claims are never counted as independent proofs.
              </span>
            </div>
            <span style={{ fontSize: 11, color: "var(--color-success)", fontWeight: 700 }}>Auditable Provenance Chain</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-warning)", textTransform: "uppercase", marginBottom: 4 }}>
                A. SELF_REPORTED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
                Resume &amp; Profile Statements
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                Unverified claims extracted directly from candidate submission. Low independent weight.
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-cobalt)", textTransform: "uppercase", marginBottom: 4 }}>
                B. OBSERVED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
                GitHub &amp; LeetCode Activity
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                {displayCand.githubData?.verifiedReposCount || 0} public repositories, commit patterns, and algorithmic solution records.
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-cobalt)", textTransform: "uppercase", marginBottom: 4 }}>
                C. EVALUATED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
                Cognalyze Mock Interviews
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                Direct question-and-answer transcripts evaluating runtime defense and architectural reasoning.
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", marginBottom: 4 }}>
                D. VERIFIED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
                Code Walkthrough &amp; Deployment
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                Ownership verification questions answered and live API deployment endpoints substantiated.
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 3: ROLE REQUIREMENT MAPPING & [WHY?] [SHOW PROOF]  */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase", color: "var(--brand-navy)", margin: 0 }}>
                Role Requirement Mapping (Role DNA)
              </h2>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Target Role: {role?.title || displayCand.appliedRoleTitle} • Zero arbitrary scoring
              </span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Click [SHOW PROOF] to inspect</span>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            {(dossier?.assessments || []).map((req, idx, arr) => {
              const badge = getMatchStateBadge(req.evidenceState);

              return (
                <div
                  key={req.requirementId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: idx < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: "1 1 320px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" }}>
                        {req.requirementText}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                        [{req.category}]
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.4 }}>
                      {req.sourceText || req.candidateEvidence || req.assessmentExplanation || "Evidence evaluated against role expectations."}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 5,
                        color: badge.color,
                        backgroundColor: badge.bg,
                        border: `1px solid ${badge.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badge.label}
                    </span>

                    <button
                      onClick={() => handleInspectProof(req)}
                      style={{
                        background: "var(--color-info-bg)",
                        border: "1px solid #D2E0FB",
                        color: "var(--brand-cobalt)",
                        borderRadius: 7,
                        padding: "5px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      SHOW PROOF ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 4: PROJECT INTELLIGENCE & OWNERSHIP                */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase", color: "var(--brand-navy)", margin: 0 }}>
                Project Intelligence &amp; Ownership Verification
              </h2>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Template detection signals and candidate-specific generated architectural questions.
              </span>
            </div>
            <span style={{ fontSize: 11, color: "var(--color-success)", fontWeight: 700 }}>Zero Unsupported Accusations</span>
          </div>

          {projectAnalysis && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--brand-navy)" }}>
                  Project: {projectAnalysis.projectTitle}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 5,
                    background: projectAnalysis.templateDependenceSignal === "CLEAN_ORIGINAL" ? "var(--color-success-bg)" : "#FEF7ED",
                    color: projectAnalysis.templateDependenceSignal === "CLEAN_ORIGINAL" ? "#2E7D5B" : "var(--color-warning)",
                    border: `1px solid ${projectAnalysis.templateDependenceSignal === "CLEAN_ORIGINAL" ? "var(--color-success)" : "#F8D8A7"}`,
                  }}
                >
                  {projectAnalysis.templateDependenceSignal.replace(/_/g, " ")}
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>
                  Signals Observed
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {projectAnalysis.signalsObserved.map((sig, sIdx) => (
                    <div key={sIdx} style={{ fontSize: 12, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--brand-cobalt)" }}>•</span> {sig}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-cobalt)", textTransform: "uppercase", marginBottom: 8 }}>
                  Candidate-Specific Generated Verification Questions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projectAnalysis.generatedQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      style={{
                        background: "#F9F8F5",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 13,
                        color: "var(--text-primary)",
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <span style={{ color: "var(--brand-cobalt)", fontWeight: 800 }}>Q{qIdx + 1}:</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 5: FALSE POSITIVE & NEGATIVE RISKS                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase", color: "var(--brand-navy)", margin: 0 }}>
                Risk Analysis (False Positive &amp; False Negative)
              </h2>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Detecting polished resumes with weak verification vs. concise resumes with strong demonstrated code.
              </span>
            </div>
          </div>

          {riskAnalysis && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              {/* False Positive Risk */}
              <div style={{ background: "var(--surface)", border: "1px solid #F8D8A7", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-warning)", textTransform: "uppercase" }}>
                    False Positive Risk
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#FEF7ED", color: "var(--color-warning)", border: "1px solid #F8D8A7" }}>
                    {riskAnalysis.falsePositiveRisk.level} RISK
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {riskAnalysis.falsePositiveRisk.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      • {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* False Negative Risk */}
              <div style={{ background: "var(--surface)", border: "1px solid #C8E4D3", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-success)", textTransform: "uppercase" }}>
                    False Negative Risk (Hidden Strengths)
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid #C8E4D3" }}>
                    {riskAnalysis.falseNegativeRisk.level} RISK
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {riskAnalysis.falseNegativeRisk.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      • {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    )}
      </main>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SHOW PROOF / WHY? DRAWER                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {proofDrawerOpen && inspectedReq && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: "rgba(22, 42, 67, 0.45)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setProofDrawerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 580,
              height: "100%",
              backgroundColor: "var(--surface)",
              borderLeft: "1px solid var(--border-subtle)",
              boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.12)",
              display: "flex",
              flexDirection: "column",
              color: "var(--text-primary)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--brand-cobalt)" }}>
                  EVIDENCE PROVENANCE PROOF
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 0", color: "var(--brand-navy)" }}>
                  {inspectedReq.requirementText}
                </h3>
              </div>
              <button
                onClick={() => setProofDrawerOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>
                  Why did Cognalyze conclude this?
                </div>
                <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
                  {inspectedReq.assessmentExplanation || inspectedReq.whyChain?.assessment || "Capability evaluated against role requirements using multi-source cross-checks."}
                </div>
              </div>

              <div style={{ background: "var(--color-info-bg)", border: "1px solid #D2E0FB", padding: "14px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-cobalt)", textTransform: "uppercase", marginBottom: 4 }}>
                  Observed Fact / Verbatim Artifact
                </div>
                <div style={{ fontSize: 12, color: "var(--brand-navy)", lineHeight: 1.5, fontStyle: "italic" }}>
                  &ldquo;{inspectedReq.sourceText || inspectedReq.candidateEvidence || "No verbatim quotation available"}&rdquo;
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, fontSize: 12, color: "var(--text-secondary)" }}>
                <span>Requirement Category: <strong style={{ color: "var(--brand-navy)" }}>{inspectedReq.category}</strong></span>
                <span>Evidence State: <strong style={{ color: "var(--brand-cobalt)" }}>{inspectedReq.evidenceState}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LOG RECRUITER DECISION & OVERRIDE MODAL                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showDecisionModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(22, 42, 67, 0.45)",
            backdropFilter: "blur(6px)",
            padding: 20,
          }}
          onClick={() => setShowDecisionModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: "24px 28px",
              color: "var(--text-primary)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--brand-navy)" }}>
                Log Recruiter Decision &amp; Audit Trail
              </h3>
              <button
                onClick={() => setShowDecisionModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {decisionSuccess ? (
              <div style={{ padding: "16px", background: "var(--color-success-bg)", border: "1px solid #C8E4D3", borderRadius: 8, color: "var(--color-success)", textAlign: "center", fontWeight: 600 }}>
                ✓ {decisionSuccess}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-navy)", display: "block", marginBottom: 6 }}>
                    Decision Verdict:
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["Advance", "Hold", "Decline"] as const).map((v) => {
                      const isSelected = selectedVerdict === v;
                      let activeBg = "#356AE6";
                      if (v === "Advance") activeBg = "#2E7D5B";
                      if (v === "Hold") activeBg = "#B7791F";
                      if (v === "Decline") activeBg = "#C24141";

                      return (
                        <button
                          key={v}
                          onClick={() => setSelectedVerdict(v)}
                          style={{
                            flex: 1,
                            padding: "9px",
                            borderRadius: 7,
                            border: isSelected ? `1px solid ${activeBg}` : "1px solid var(--border-subtle)",
                            background: isSelected ? activeBg : "var(--bg-canvas)",
                            color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-navy)", display: "block", marginBottom: 6 }}>
                    Recruiter Override / Justification Reason (Required if overriding recommendation):
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Strong domain experience not fully captured in GitHub repositories; moving to interview."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 7,
                      background: "var(--bg-canvas)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => setShowDecisionModal(false)}
                    style={{ padding: "8px 16px", borderRadius: 7, background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDecision}
                    disabled={decisionSaving}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 7,
                      background: "var(--brand-cobalt)",
                      border: "none",
                      color: "white",
                      fontWeight: 700,
                      cursor: decisionSaving ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 6px rgba(53, 106, 230, 0.3)"
                    }}
                  >
                    {decisionSaving ? "Saving to Audit Trail..." : "Commit Decision"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* CONTROLLED SNAPSHOT REFRESH MODAL (HISTORICAL VERSIONING)  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showRefreshModal && dnaSnapshot && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(22, 42, 67, 0.45)",
            backdropFilter: "blur(4px)",
            padding: 20,
          }}
          onClick={() => setShowRefreshModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              backgroundColor: "var(--surface)",
              borderRadius: 12,
              border: "1px solid var(--border-subtle)",
              padding: "24px 28px",
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.16)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--brand-cobalt)", textTransform: "uppercase" }}>
                  Controlled Snapshot Re-Assessment
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--brand-navy)", margin: "4px 0 0" }}>
                  Refresh Student DNA Snapshot to v{dnaSnapshot.snapshotVersion + 1}
                </h3>
              </div>
              <button
                onClick={() => setShowRefreshModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px" }}>
              In accordance with historical integrity rules, the current snapshot (v{dnaSnapshot.snapshotVersion}) will be preserved in the audit trail. Re-evaluating now will pull the candidate's latest verified artifacts and recalculate role alignment.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-navy)", display: "block", marginBottom: 6 }}>
                Reason for Re-Assessment (Audit Logged):
              </label>
              <textarea
                value={refreshReason}
                onChange={(e) => setRefreshReason(e.target.value)}
                placeholder="e.g., Candidate pushed new production repository, finished interview round, or updated portfolio."
                rows={3}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: 7,
                  border: "1px solid var(--border-subtle)",
                  padding: "10px",
                  fontSize: 12,
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-canvas)",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowRefreshModal(false)}
                style={{ padding: "8px 16px", borderRadius: 7, background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleRefreshSnapshot}
                disabled={snapshotRefreshing}
                style={{
                  padding: "8px 20px",
                  borderRadius: 7,
                  background: "var(--brand-cobalt)",
                  border: "none",
                  color: "white",
                  fontWeight: 700,
                  cursor: snapshotRefreshing ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <RefreshCw size={13} className={snapshotRefreshing ? "animate-spin" : ""} />
                {snapshotRefreshing ? "Re-Evaluating Evidence..." : "Commit Re-Assessment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
