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
        return { color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3", label: state };
      case "PARTIAL":
      case "PARTIALLY_SUPPORTED":
      case "DEVELOPING":
        return { color: "#B7791F", bg: "#FEF7ED", border: "#F8D8A7", label: state };
      case "MISSING":
      case "INSUFFICIENT_EVIDENCE":
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "INSUFFICIENT EVIDENCE" };
      case "CONFLICTING":
      case "EVIDENCE_MISMATCH":
        return { color: "#C24141", bg: "#FDF2F2", border: "#F8C8C8", label: state };
      default:
        return { color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB", label: state };
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C" }}>
        <AppNav role="recruiter" />
        <div style={{ maxWidth: 1100, margin: "80px auto", textAlign: "center", color: "#667085" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          Loading Candidate Evidence Passport...
        </div>
      </div>
    );
  }

  if (error || !displayCand) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C" }}>
        <AppNav role="recruiter" />
        <div style={{ maxWidth: 800, margin: "80px auto", textAlign: "center", padding: 32, background: "#FFFFFF", border: "1px solid #F8C8C8", borderRadius: 10 }}>
          <h2 style={{ color: "#C24141" }}>Candidate Not Found</h2>
          <p style={{ color: "#667085" }}>{error || "Could not retrieve the requested candidate record."}</p>
          <Link href="/recruiter/candidates" style={{ color: "#356AE6", textDecoration: "none", fontWeight: 700 }}>
            ← Back to Candidate Pool
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* BREADCRUMB & CONTROLS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#667085" }}>
            <Link href="/recruiter" style={{ color: "#667085", textDecoration: "none" }}>Command Center</Link>
            <span>/</span>
            <Link href="/recruiter/candidates" style={{ color: "#667085", textDecoration: "none" }}>Candidates</Link>
            <span>/</span>
            <span style={{ color: "#162A43", fontWeight: 700 }}>Evidence Passport</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Blind Screening Toggle */}
            <button
              onClick={() => setBlindMode(!blindMode)}
              style={{
                background: blindMode ? "#162A43" : "#FFFFFF",
                border: `1px solid ${blindMode ? "#162A43" : "#E4E1DA"}`,
                borderRadius: 7,
                padding: "7px 14px",
                color: blindMode ? "#FFFFFF" : "#667085",
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
                background: "#356AE6",
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
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 7,
                padding: "8px 16px",
                color: "#162A43",
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
            background: "#FFFFFF",
            border: "1px solid #E4E1DA",
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
                    color: "#356AE6",
                    background: "#EFF4FE",
                    padding: "2px 8px",
                    borderRadius: 5,
                    border: "1px solid #D2E0FB",
                  }}
                >
                  Candidate Evidence Passport
                </span>
                <span style={{ fontSize: 11, color: "#667085" }}>
                  Persistent multi-source verified record
                </span>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.02em" }}>
                {displayCand.name}
              </h1>

              <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
                Applied for: <strong style={{ color: "#162A43" }}>{displayCand.appliedRoleTitle}</strong> • Stage:{" "}
                <span style={{ color: "#356AE6", fontWeight: 700 }}>{displayCand.currentStage}</span> • Source:{" "}
                <span style={{ color: "#17191C" }}>{displayCand.sourceType}</span>
              </div>
            </div>

            {/* QUICK STATS */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>Verified Repos</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#2E7D5B", marginTop: 2 }}>
                  {displayCand.githubData?.verifiedReposCount || 0}
                </div>
              </div>

              <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>Algorithmic DSA</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#356AE6", marginTop: 2 }}>
                  {displayCand.leetCodeProfile?.problemsSolved || 0}
                </div>
              </div>

              <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>Assessed Rounds</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#162A43", marginTop: 2 }}>
                  {(displayCand.priorCognalyzeInterviewHistory || []).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 2: EVIDENCE PROVENANCE & INDEPENDENCE              */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase", color: "#162A43", margin: 0 }}>
                Evidence Provenance &amp; Independence
              </h2>
              <span style={{ fontSize: 12, color: "#667085" }}>
                Strict invariant: Repeated self-reported claims are never counted as independent proofs.
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>Auditable Provenance Chain</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", textTransform: "uppercase", marginBottom: 4 }}>
                A. SELF_REPORTED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                Resume &amp; Profile Statements
              </div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 4, lineHeight: 1.4 }}>
                Unverified claims extracted directly from candidate submission. Low independent weight.
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                B. OBSERVED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                GitHub &amp; LeetCode Activity
              </div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 4, lineHeight: 1.4 }}>
                {displayCand.githubData?.verifiedReposCount || 0} public repositories, commit patterns, and algorithmic solution records.
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                C. EVALUATED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                Cognalyze Mock Interviews
              </div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 4, lineHeight: 1.4 }}>
                Direct question-and-answer transcripts evaluating runtime defense and architectural reasoning.
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", textTransform: "uppercase", marginBottom: 4 }}>
                D. VERIFIED
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                Code Walkthrough &amp; Deployment
              </div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 4, lineHeight: 1.4 }}>
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
              <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase", color: "#162A43", margin: 0 }}>
                Role Requirement Mapping (Role DNA)
              </h2>
              <span style={{ fontSize: 12, color: "#667085" }}>
                Target Role: {role?.title || displayCand.appliedRoleTitle} • Zero arbitrary scoring
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#667085" }}>Click [SHOW PROOF] to inspect</span>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
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
                    borderBottom: idx < arr.length - 1 ? "1px solid #E4E1DA" : "none",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: "1 1 320px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>
                        {req.requirementText}
                      </span>
                      <span style={{ fontSize: 10, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                        [{req.category}]
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#667085", marginTop: 3, lineHeight: 1.4 }}>
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
                        background: "#EFF4FE",
                        border: "1px solid #D2E0FB",
                        color: "#356AE6",
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
              <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase", color: "#162A43", margin: 0 }}>
                Project Intelligence &amp; Ownership Verification
              </h2>
              <span style={{ fontSize: 12, color: "#667085" }}>
                Template detection signals and candidate-specific generated architectural questions.
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>Zero Unsupported Accusations</span>
          </div>

          {projectAnalysis && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#162A43" }}>
                  Project: {projectAnalysis.projectTitle}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 5,
                    background: projectAnalysis.templateDependenceSignal === "CLEAN_ORIGINAL" ? "#EAF4EE" : "#FEF7ED",
                    color: projectAnalysis.templateDependenceSignal === "CLEAN_ORIGINAL" ? "#2E7D5B" : "#B7791F",
                    border: `1px solid ${projectAnalysis.templateDependenceSignal === "CLEAN_ORIGINAL" ? "#C8E4D3" : "#F8D8A7"}`,
                  }}
                >
                  {projectAnalysis.templateDependenceSignal.replace(/_/g, " ")}
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                  Signals Observed
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {projectAnalysis.signalsObserved.map((sig, sIdx) => (
                    <div key={sIdx} style={{ fontSize: 12, color: "#17191C", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#356AE6" }}>•</span> {sig}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 8 }}>
                  Candidate-Specific Generated Verification Questions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projectAnalysis.generatedQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      style={{
                        background: "#F9F8F5",
                        border: "1px solid #E4E1DA",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 13,
                        color: "#17191C",
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <span style={{ color: "#356AE6", fontWeight: 800 }}>Q{qIdx + 1}:</span>
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
              <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase", color: "#162A43", margin: 0 }}>
                Risk Analysis (False Positive &amp; False Negative)
              </h2>
              <span style={{ fontSize: 12, color: "#667085" }}>
                Detecting polished resumes with weak verification vs. concise resumes with strong demonstrated code.
              </span>
            </div>
          </div>

          {riskAnalysis && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              {/* False Positive Risk */}
              <div style={{ background: "#FFFFFF", border: "1px solid #F8D8A7", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#B7791F", textTransform: "uppercase" }}>
                    False Positive Risk
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#FEF7ED", color: "#B7791F", border: "1px solid #F8D8A7" }}>
                    {riskAnalysis.falsePositiveRisk.level} RISK
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {riskAnalysis.falsePositiveRisk.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#667085", lineHeight: 1.4 }}>
                      • {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* False Negative Risk */}
              <div style={{ background: "#FFFFFF", border: "1px solid #C8E4D3", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#2E7D5B", textTransform: "uppercase" }}>
                    False Negative Risk (Hidden Strengths)
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3" }}>
                    {riskAnalysis.falseNegativeRisk.level} RISK
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {riskAnalysis.falseNegativeRisk.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#667085", lineHeight: 1.4 }}>
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
              backgroundColor: "#FFFFFF",
              borderLeft: "1px solid #E4E1DA",
              boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.12)",
              display: "flex",
              flexDirection: "column",
              color: "#17191C",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "24px", borderBottom: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#356AE6" }}>
                  EVIDENCE PROVENANCE PROOF
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 0", color: "#162A43" }}>
                  {inspectedReq.requirementText}
                </h3>
              </div>
              <button
                onClick={() => setProofDrawerOpen(false)}
                style={{ background: "transparent", border: "none", color: "#667085", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", padding: "14px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                  Why did Cognalyze conclude this?
                </div>
                <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5 }}>
                  {inspectedReq.assessmentExplanation || inspectedReq.whyChain?.assessment || "Capability evaluated against role requirements using multi-source cross-checks."}
                </div>
              </div>

              <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", padding: "14px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                  Observed Fact / Verbatim Artifact
                </div>
                <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.5, fontStyle: "italic" }}>
                  &ldquo;{inspectedReq.sourceText || inspectedReq.candidateEvidence || "No verbatim quotation available"}&rdquo;
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, fontSize: 12, color: "#667085" }}>
                <span>Requirement Category: <strong style={{ color: "#162A43" }}>{inspectedReq.category}</strong></span>
                <span>Evidence State: <strong style={{ color: "#356AE6" }}>{inspectedReq.evidenceState}</strong></span>
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
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 12,
              padding: "24px 28px",
              color: "#17191C",
              boxShadow: "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43" }}>
                Log Recruiter Decision &amp; Audit Trail
              </h3>
              <button
                onClick={() => setShowDecisionModal(false)}
                style={{ background: "transparent", border: "none", color: "#667085", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {decisionSuccess ? (
              <div style={{ padding: "16px", background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, color: "#2E7D5B", textAlign: "center", fontWeight: 600 }}>
                ✓ {decisionSuccess}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#162A43", display: "block", marginBottom: 6 }}>
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
                            border: isSelected ? `1px solid ${activeBg}` : "1px solid #E4E1DA",
                            background: isSelected ? activeBg : "#F6F5F1",
                            color: isSelected ? "#FFFFFF" : "#667085",
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
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#162A43", display: "block", marginBottom: 6 }}>
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
                      background: "#F6F5F1",
                      border: "1px solid #E4E1DA",
                      color: "#17191C",
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
                    style={{ padding: "8px 16px", borderRadius: 7, background: "transparent", border: "1px solid #E4E1DA", color: "#667085", cursor: "pointer", fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDecision}
                    disabled={decisionSaving}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 7,
                      background: "#356AE6",
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
    </div>
  );
}
