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

export default function CandidateEvidencePassportPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = typeof params?.id === "string" ? params.id : "";

  const [candidate, setCandidate] = useState<MultiSourceCandidateProfile | null>(null);
  const [role, setRole] = useState<RoleDNA | null>(null);
  const [dossier, setDossier] = useState<CandidateScreeningDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getMatchStateBadge = (state: string) => {
    switch (state) {
      case "SUPPORTED":
      case "VERIFIED":
      case "DEMONSTRATED":
        return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.4)", label: state };
      case "PARTIAL":
      case "PARTIALLY_SUPPORTED":
      case "DEVELOPING":
        return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)", label: state };
      case "MISSING":
      case "INSUFFICIENT_EVIDENCE":
        return { color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.3)", label: "INSUFFICIENT EVIDENCE" };
      case "CONFLICTING":
      case "EVIDENCE_MISMATCH":
        return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)", label: state };
      default:
        return { color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.3)", label: state };
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc" }}>
        <AppNav role="recruiter" />
        <div style={{ maxWidth: 1100, margin: "80px auto", textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          Loading Candidate Evidence Passport...
        </div>
      </div>
    );
  }

  if (error || !displayCand) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc" }}>
        <AppNav role="recruiter" />
        <div style={{ maxWidth: 800, margin: "80px auto", textAlign: "center", padding: 32, background: "rgba(239, 68, 68, 0.08)", borderRadius: 16 }}>
          <h2 style={{ color: "#fca5a5" }}>Candidate Not Found</h2>
          <p style={{ color: "#94a3b8" }}>{error || "Could not retrieve the requested candidate record."}</p>
          <Link href="/recruiter/candidates" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}>
            ← Back to Candidate Pool
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* BREADCRUMB & CONTROLS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8" }}>
            <Link href="/recruiter" style={{ color: "#94a3b8", textDecoration: "none" }}>Command Center</Link>
            <span>/</span>
            <Link href="/recruiter/candidates" style={{ color: "#94a3b8", textDecoration: "none" }}>Candidates</Link>
            <span>/</span>
            <span style={{ color: "#f8fafc", fontWeight: 700 }}>Evidence Passport</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Section 40: Blind Screening Toggle */}
            <button
              onClick={() => setBlindMode(!blindMode)}
              style={{
                background: blindMode ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${blindMode ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.12)"}`,
                borderRadius: 8,
                padding: "6px 14px",
                color: blindMode ? "#d8b4fe" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{blindMode ? "👁️‍🗨️ Blind Mode (ON)" : "👁️ Blind Mode (OFF)"}</span>
            </button>

            <button
              onClick={() => setShowDecisionModal(true)}
              style={{
                background: "linear-gradient(135deg, #a855f7, #6366f1)",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                color: "white",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(168, 85, 247, 0.35)",
              }}
            >
              ⚖️ Log Recruiter Decision
            </button>

            <Link
              href={`/recruiter/decision-room?candidate=${candidate?.id}&role=${candidate?.appliedRoleId}`}
              style={{
                textDecoration: "none",
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                borderRadius: 8,
                padding: "8px 16px",
                color: "#fde68a",
                fontSize: 13,
                fontWeight: 700,
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
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.5) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            padding: "24px 28px",
            marginBottom: 28,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: "#38bdf8",
                    background: "rgba(56, 189, 248, 0.12)",
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                  }}
                >
                  CANDIDATE EVIDENCE PASSPORT
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Persistent multi-source verified record
                </span>
              </div>

              <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: "#ffffff" }}>
                {displayCand.name}
              </h1>

              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                Applied for: <strong style={{ color: "#e2e8f0" }}>{displayCand.appliedRoleTitle}</strong> • Stage:{" "}
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>{displayCand.currentStage}</span> • Source:{" "}
                <span style={{ color: "#cbd5e1" }}>{displayCand.sourceType}</span>
              </div>
            </div>

            {/* QUICK STATS */}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>Verified Repos</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981", marginTop: 2 }}>
                  {displayCand.githubData?.verifiedReposCount || 0}
                </div>
              </div>

              <div style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>Algorithmic DSA</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#38bdf8", marginTop: 2 }}>
                  {displayCand.leetCodeProfile?.problemsSolved || 0}
                </div>
              </div>

              <div style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>Assessed Rounds</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#a855f7", marginTop: 2 }}>
                  {(displayCand.priorCognalyzeInterviewHistory || []).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 2: EVIDENCE PROVENANCE & INDEPENDENCE (SEC 3, 16) */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#818cf8", margin: 0 }}>
                EVIDENCE PROVENANCE & INDEPENDENCE
              </h2>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Strict invariant: Repeated self-reported claims are never counted as independent proofs.
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>Auditable Provenance Chain</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", marginBottom: 4 }}>
                A. SELF_REPORTED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                Resume & Profile Statements
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>
                Unverified claims extracted directly from candidate submission. Low independent weight.
              </div>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 4 }}>
                B. OBSERVED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                GitHub & LeetCode Activity
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>
                {displayCand.githubData?.verifiedReposCount || 0} public repositories, commit patterns, and algorithmic solution records.
              </div>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#a855f7", textTransform: "uppercase", marginBottom: 4 }}>
                C. EVALUATED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                Cognalyze Mock Interviews
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>
                Direct question-and-answer transcripts evaluating runtime defense and architectural reasoning.
              </div>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", textTransform: "uppercase", marginBottom: 4 }}>
                D. VERIFIED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                Code Walkthrough & Deployment
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>
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
              <h2 style={{ fontSize: 15, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#f8fafc", margin: 0 }}>
                ROLE REQUIREMENT MAPPING (ROLE DNA)
              </h2>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Target Role: {role?.title || displayCand.appliedRoleTitle} • Zero arbitrary scoring
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#64748b" }}>Click [WHY?] or [SHOW PROOF] to inspect</span>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, overflow: "hidden" }}>
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
                    borderBottom: idx < arr.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: "1 1 320px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                        {req.requirementText}
                      </span>
                      <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                        [{req.category}]
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, lineHeight: 1.4 }}>
                      {req.sourceText || req.candidateEvidence || req.assessmentExplanation || "Evidence evaluated against role expectations."}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 6,
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
                        background: "rgba(56, 189, 248, 0.1)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        color: "#38bdf8",
                        borderRadius: 6,
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
        {/* SECTION 4: PROJECT INTELLIGENCE & OWNERSHIP (SEC 18, 19, 20) */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#38bdf8", margin: 0 }}>
                PROJECT INTELLIGENCE & OWNERSHIP VERIFICATION
              </h2>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Sections 18, 19 & 20: Template detection signals and candidate-specific generated architectural questions.
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>Zero Unsupported Accusations</span>
          </div>

          {projectAnalysis && (
            <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}>
                  Project: {projectAnalysis.projectTitle}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: projectAnalysis.templateDependenceSignal === "CLEAN_ORIGINAL" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: projectAnalysis.templateDependenceSignal === "CLEAN_ORIGINAL" ? "#10b981" : "#f59e0b",
                    border: `1px solid ${projectAnalysis.templateDependenceSignal === "CLEAN_ORIGINAL" ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)"}`,
                  }}
                >
                  {projectAnalysis.templateDependenceSignal.replace(/_/g, " ")}
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>
                  Signals Observed
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {projectAnalysis.signalsObserved.map((sig, sIdx) => (
                    <div key={sIdx} style={{ fontSize: 12, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#38bdf8" }}>•</span> {sig}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 8 }}>
                  Candidate-Specific Generated Verification Questions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projectAnalysis.generatedQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 13,
                        color: "#e2e8f0",
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <span style={{ color: "#38bdf8", fontWeight: 800 }}>Q{qIdx + 1}:</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 5: FALSE POSITIVE & NEGATIVE RISKS (SEC 27)        */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#f59e0b", margin: 0 }}>
                FALSE POSITIVE & FALSE NEGATIVE RISK ANALYSIS (SECTION 27)
              </h2>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Detecting polished resumes with weak verification vs. concise resumes with strong demonstrated code.
              </span>
            </div>
          </div>

          {riskAnalysis && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* False Positive Risk */}
              <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase" }}>
                    False Positive Risk
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(245, 158, 11, 0.15)", color: "#fde68a" }}>
                    {riskAnalysis.falsePositiveRisk.level} RISK
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {riskAnalysis.falsePositiveRisk.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.4 }}>
                      • {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* False Negative Risk */}
              <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>
                    False Negative Risk (Hidden Strengths)
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(16, 185, 129, 0.15)", color: "#a7f3d0" }}>
                    {riskAnalysis.falseNegativeRisk.level} RISK
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {riskAnalysis.falseNegativeRisk.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.4 }}>
                      • {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
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
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setProofDrawerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 580,
              height: "100%",
              backgroundColor: "#090d1a",
              borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.8)",
              display: "flex",
              flexDirection: "column",
              color: "#f8fafc",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "24px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#38bdf8" }}>
                  EVIDENCE PROVENANCE PROOF
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: "4px 0 0", color: "#ffffff" }}>
                  {inspectedReq.requirementText}
                </h3>
              </div>
              <button
                onClick={() => setProofDrawerOpen(false)}
                style={{ background: "rgba(255, 255, 255, 0.08)", border: "none", color: "#94a3b8", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "14px", borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>
                  Why did Cognalyze conclude this?
                </div>
                <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>
                  {inspectedReq.assessmentExplanation || inspectedReq.whyChain?.assessment || "Capability evaluated against role requirements using multi-source cross-checks."}
                </div>
              </div>

              <div style={{ background: "rgba(56, 189, 248, 0.06)", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "14px", borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 4 }}>
                  Observed Fact / Verbatim Artifact
                </div>
                <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5, fontStyle: "italic" }}>
                  "{inspectedReq.sourceText || inspectedReq.candidateEvidence || "No verbatim quotation available"}"
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, fontSize: 12, color: "#64748b" }}>
                <span>Requirement Category: <strong>{inspectedReq.category}</strong></span>
                <span>Evidence State: <strong style={{ color: "#38bdf8" }}>{inspectedReq.evidenceState}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LOG RECRUITER DECISION & OVERRIDE MODAL (SEC 36, 37)        */}
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
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            padding: 20,
          }}
          onClick={() => setShowDecisionModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              backgroundColor: "#0d1322",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              borderRadius: 16,
              padding: "24px 28px",
              color: "#f8fafc",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>
                Log Recruiter Decision & Audit Trail
              </h3>
              <button
                onClick={() => setShowDecisionModal(false)}
                style={{ background: "rgba(255, 255, 255, 0.08)", border: "none", color: "#94a3b8", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {decisionSuccess ? (
              <div style={{ padding: "20px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: 10, color: "#6ee7b7", textAlign: "center" }}>
                ✓ {decisionSuccess}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 6 }}>
                    Decision Verdict:
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["Advance", "Hold", "Decline"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVerdict(v)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: 8,
                          border: selectedVerdict === v ? "1px solid #a855f7" : "1px solid rgba(255, 255, 255, 0.1)",
                          background: selectedVerdict === v ? "rgba(168, 85, 247, 0.25)" : "rgba(255, 255, 255, 0.04)",
                          color: selectedVerdict === v ? "#ffffff" : "#94a3b8",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 6 }}>
                    Recruiter Override / Justification Reason (Required if overriding AI recommendation):
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Strong domain experience not fully captured in GitHub repositories; moving to interview."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      background: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "white",
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => setShowDecisionModal(false)}
                    style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#94a3b8", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDecision}
                    disabled={decisionSaving}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #a855f7, #6366f1)",
                      border: "none",
                      color: "white",
                      fontWeight: 800,
                      cursor: decisionSaving ? "not-allowed" : "pointer",
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
    </div>
  );
}
