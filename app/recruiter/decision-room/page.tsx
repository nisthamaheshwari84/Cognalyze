"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { RoleDNA } from "@/lib/ai/role-dna";
import { CandidateDNA, EvidenceNode } from "@/lib/ai/evidence-graph";
import { MatchEngineResult, MinimumProofPlan } from "@/lib/ai/minimum-proof";
import { WorkSampleMiniTask, WorkSampleEvaluationResult } from "@/lib/ai/work-sample";
import { GeneratedInterviewQuestion, CandidateInterviewHistory } from "@/lib/ai/interview-memory";
import { DetectedConflict } from "@/lib/ai/conflict-detector";
import { TalentRecoveryResult } from "@/lib/ai/talent-recovery";
import { MultiSourceCandidateProfile } from "@/lib/recruiter-store";

export type FlowStage = 
  | "role_dna"
  | "candidate_intel"
  | "evidence_graph"
  | "match_split"
  | "minimum_proof"
  | "work_sample"
  | "interviews"
  | "conflicts"
  | "decision";

export default function RecruiterDecisionRoomPage() {
  const [candidates, setCandidates] = useState<MultiSourceCandidateProfile[]>([]);
  const [roles, setRoles] = useState<RoleDNA[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState<FlowStage>("role_dna");
  const [showFlowVisualizer, setShowFlowVisualizer] = useState(true);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Computed state
  const [candidateDna, setCandidateDna] = useState<CandidateDNA | null>(null);
  const [evidenceNodes, setEvidenceNodes] = useState<EvidenceNode[]>([]);
  const [matchResult, setMatchResult] = useState<MatchEngineResult | null>(null);
  const [minimumProofPlan, setMinimumProofPlan] = useState<MinimumProofPlan | null>(null);
  
  // Work sample studio
  const [activeTask, setActiveTask] = useState<WorkSampleMiniTask | null>(null);
  const [sampleSubmission, setSampleSubmission] = useState("");
  const [evaluationResult, setEvaluationResult] = useState<WorkSampleEvaluationResult | null>(null);
  const [evaluatingSample, setEvaluatingSample] = useState(false);

  // Interview memory
  const [interviewQuestions, setInterviewQuestions] = useState<GeneratedInterviewQuestion[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<CandidateInterviewHistory | null>(null);

  // Interview Scorecard Logging state
  const [activeFeedbackQuestionId, setActiveFeedbackQuestionId] = useState<string | null>(null);
  const [feedbackInterviewerName, setFeedbackInterviewerName] = useState("Staff Engineering Lead");
  const [feedbackRoundType, setFeedbackRoundType] = useState<"system_design" | "coding" | "behavioral" | "deep_dive">("system_design");
  const [feedbackRating, setFeedbackRating] = useState<number>(8);
  const [feedbackInsights, setFeedbackInsights] = useState("");
  const [feedbackStrengths, setFeedbackStrengths] = useState("");
  const [feedbackRedFlags, setFeedbackRedFlags] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Conflicts
  const [conflicts, setConflicts] = useState<DetectedConflict[]>([]);

  // Decision & Talent Recovery
  const [decisionVerdict, setDecisionVerdict] = useState<"Hire" | "Hold" | "Reject" | null>(null);
  const [decisionRationale, setDecisionRationale] = useState("");
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);
  const [talentRecovery, setTalentRecovery] = useState<TalentRecoveryResult | null>(null);

  // Load candidates and roles
  useEffect(() => {
    async function init() {
      try {
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        let paramCandidateId = urlParams?.get("candidateId");
        let paramRoleId = urlParams?.get("roleId");

        // Continuity fallback: check localStorage if not explicitly in URL
        if (!paramCandidateId && typeof window !== "undefined") {
          paramCandidateId = localStorage.getItem("cognalyze_active_candidate_id");
        }
        if (!paramRoleId && typeof window !== "undefined") {
          paramRoleId = localStorage.getItem("cognalyze_active_role_id");
        }

        const [candRes, roleRes] = await Promise.all([
          fetch("/api/recruiter/candidates"),
          fetch("/api/recruiter/roles")
        ]);
        const candData = await candRes.json();
        const roleData = await roleRes.json();

        if (roleData.success && roleData.roles.length > 0) {
          setRoles(roleData.roles);
          if (paramRoleId && roleData.roles.some((r: any) => r.id === paramRoleId)) {
            setSelectedRoleId(paramRoleId);
          } else {
            setSelectedRoleId(roleData.roles[0].id);
          }
        }

        if (candData.success && candData.candidates.length > 0) {
          setCandidates(candData.candidates);
          if (paramCandidateId && candData.candidates.some((c: any) => c.id === paramCandidateId)) {
            setSelectedCandidateId(paramCandidateId);
          } else {
            setSelectedCandidateId(candData.candidates[0].id);
          }
        }
      } catch (err) {
        console.error("Init failure:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Sync active selection to localStorage
  useEffect(() => {
    if (selectedCandidateId && typeof window !== "undefined") {
      localStorage.setItem("cognalyze_active_candidate_id", selectedCandidateId);
    }
  }, [selectedCandidateId]);

  useEffect(() => {
    if (selectedRoleId && typeof window !== "undefined") {
      localStorage.setItem("cognalyze_active_role_id", selectedRoleId);
    }
  }, [selectedRoleId]);

  // Compute analysis whenever candidate or role changes
  useEffect(() => {
    if (!selectedCandidateId || !selectedRoleId) return;

    async function runAnalysis() {
      setAnalyzing(true);
      setDecisionMessage(null);
      setTalentRecovery(null);
      try {
        // 1. Evidence Graph
        const evRes = await fetch("/api/recruiter/evidence-graph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: selectedCandidateId, roleId: selectedRoleId })
        });
        const evData = await evRes.json();
        if (evData.success) {
          setCandidateDna(evData.candidateDNA);
          setEvidenceNodes(evData.evidenceNodes);
        }

        // 2. Match Engine & Minimum Proof
        const matchRes = await fetch("/api/recruiter/match-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: selectedCandidateId, roleId: selectedRoleId })
        });
        const mData = await matchRes.json();
        if (mData.success) {
          setMatchResult(mData.match);
          setMinimumProofPlan(mData.minimumProofPlan);
        }

        // 3. Conflicts
        const confRes = await fetch("/api/recruiter/conflict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: selectedCandidateId, roleId: selectedRoleId })
        });
        const confData = await confRes.json();
        if (confData.success && confData.conflictResult) {
          setConflicts(confData.conflictResult.conflicts || []);
        }

        // 4. Interview memory
        const intRes = await fetch("/api/recruiter/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate_questions", candidateId: selectedCandidateId, roleId: selectedRoleId })
        });
        const intData = await intRes.json();
        if (intData.success) {
          setInterviewQuestions(intData.suggestedQuestions || []);
        }

        // Default Work Sample generator for top critical gap
        const targetRole = roles.find(r => r.id === selectedRoleId);
        const topCritReq = targetRole?.tieredRequirements.find(r => r.tier === "Critical") || targetRole?.tieredRequirements[0];
        if (topCritReq) {
          const wsRes = await fetch("/api/recruiter/work-sample", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "generate", roleId: selectedRoleId, requirementId: topCritReq.id, candidateId: selectedCandidateId })
          });
          const wsData = await wsRes.json();
          if (wsData.success) {
            setActiveTask(wsData.task);
          }
        }
      } catch (err) {
        console.error("Analysis pipeline error:", err);
      } finally {
        setAnalyzing(false);
      }
    }

    runAnalysis();
  }, [selectedCandidateId, selectedRoleId, roles]);

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const selectedRole = roles.find(r => r.id === selectedRoleId);

  // Evaluate Work Sample
  const handleEvaluateWorkSample = async () => {
    if (!activeTask || !sampleSubmission.trim()) return;
    setEvaluatingSample(true);

    try {
      const res = await fetch("/api/recruiter/work-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          candidateId: selectedCandidateId,
          task: activeTask,
          submissionText: sampleSubmission
        })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluationResult(data.evaluation);
        // Refresh evidence graph to show promotion from Unknown to Known
        const evRes = await fetch("/api/recruiter/evidence-graph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: selectedCandidateId, roleId: selectedRoleId })
        });
        const evData = await evRes.json();
        if (evData.success) {
          setCandidateDna(evData.candidateDNA);
          setEvidenceNodes(evData.evidenceNodes);
        }
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setEvaluatingSample(false);
    }
  };

  // Submit Final Committee Verdict
  const handleSubmitVerdict = async (verdict: "Hire" | "Hold" | "Reject") => {
    setDecisionVerdict(verdict);
    setDecisionMessage(null);

    try {
      const res = await fetch("/api/recruiter/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          roleId: selectedRoleId,
          verdict,
          rationale: decisionRationale
        })
      });
      const data = await res.json();
      if (data.success) {
        setDecisionMessage(data.message);
        if (verdict === "Hold" && data.triggeredWorkSampleTask) {
          setActiveTask(data.triggeredWorkSampleTask);
          setActiveTab("work_sample");
        }
        if (verdict === "Reject" && data.talentRecovery) {
          setTalentRecovery(data.talentRecovery);
        }
      }
    } catch (err: any) {
      setDecisionMessage(`Error executing decision: ${err.message}`);
    }
  };

  const handleSaveInterviewFeedback = async (q: GeneratedInterviewQuestion) => {
    if (!feedbackInsights.trim()) return;
    setSavingFeedback(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch("/api/recruiter/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_feedback",
          candidateId: selectedCandidateId,
          roleId: selectedRoleId,
          feedback: {
            roundNumber: (interviewHistory?.roundsCompleted || 0) + 1,
            interviewerName: feedbackInterviewerName,
            roundType: feedbackRoundType,
            questionAsked: q.questionText,
            coveredRequirementId: q.requirementId,
            rating: feedbackRating,
            keyInsights: feedbackInsights,
            redFlags: feedbackRedFlags ? feedbackRedFlags.split(",").map(s => s.trim()).filter(Boolean) : [],
            strengths: feedbackStrengths ? feedbackStrengths.split(",").map(s => s.trim()).filter(Boolean) : []
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage(`✓ Scorecard for ${q.requirementName} recorded permanently to candidate memory!`);
        setActiveFeedbackQuestionId(null);
        setFeedbackInsights("");
        setFeedbackStrengths("");
        setFeedbackRedFlags("");
        // Reload interview questions
        const intRes = await fetch("/api/recruiter/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate_questions", candidateId: selectedCandidateId, roleId: selectedRoleId })
        });
        const intData = await intRes.json();
        if (intData.success) {
          setInterviewQuestions(intData.suggestedQuestions || []);
          if (data.updatedHistory) {
            setInterviewHistory(data.updatedHistory);
          }
        }
      }
    } catch (err: any) {
      setFeedbackMessage(`Error saving feedback: ${err.message}`);
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        
        {/* TOP CONTROL BAR: CANDIDATE & ROLE SELECTOR */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            padding: "18px 24px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.2)", color: "#fde68a", fontWeight: 800 }}>
                ⚖️ PHASE 10 DECISION ROOM
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Evidence Synthesis & Action Engine</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
              Hiring Committee Deliberation Room
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 10, color: "#818cf8", fontWeight: 800, display: "block", marginBottom: 2 }}>SELECT CANDIDATE ({candidates.length})</label>
              <select
                value={selectedCandidateId}
                onChange={e => setSelectedCandidateId(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(99,102,241,0.4)", color: "white", fontSize: 12, fontWeight: 700, maxWidth: 260 }}
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.appliedRoleTitle || "Candidate"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 10, color: "#c084fc", fontWeight: 800, display: "block", marginBottom: 2 }}>TARGET ROLE DNA ({roles.length})</label>
              <select
                value={selectedRoleId}
                onChange={e => setSelectedRoleId(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(168,85,247,0.4)", color: "white", fontSize: 12, fontWeight: 700, maxWidth: 280 }}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.department})</option>
                ))}
              </select>
            </div>

            <div style={{ alignSelf: "flex-end" }}>
              <Link
                href={`/recruiter/candidates?roleId=${selectedRoleId}`}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <span>←</span> Screening Pool
              </Link>
            </div>
          </div>
        </div>

        {/* CANDIDATE DNA HERO SUMMARY */}
        {candidateDna && selectedCandidate && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: "20px 24px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: 0 }}>
                  {candidateDna.name}
                </h2>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", fontWeight: 800 }}>
                  STAGE: {selectedCandidate.currentStage.toUpperCase()}
                </span>
                {selectedCandidate.githubData && (
                  <span style={{ fontSize: 11, color: "#38bdf8" }}>
                    GitHub: @{selectedCandidate.githubData.handle} ({selectedCandidate.githubData.verifiedReposCount} repos)
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 6px", maxWidth: 780 }}>
                {candidateDna.capabilitySummary}
              </p>

              {candidateDna.hiddenTalents.length > 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(234, 179, 8, 0.15)", color: "#facc15", fontWeight: 800 }}>
                    ⭐ HIDDEN TALENT DETECTED
                  </span>
                  <span style={{ fontSize: 12, color: "#fef08a" }}>
                    {candidateDna.hiddenTalents[0].competency}: {candidateDna.hiddenTalents[0].strategicValue}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "center", padding: "10px 18px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 800 }}>GROWTH VELOCITY</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#34d399" }}>{candidateDna.growthVelocityScore}/100</div>
              </div>

              <div style={{ textAlign: "center", padding: "10px 18px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 800 }}>OVERALL FIT</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#818cf8" }}>{candidateDna.overallScore}%</div>
              </div>
            </div>
          </div>
        )}

        {/* ── INTERACTIVE ARCHITECTURE WORKFLOW PIPELINE ── */}
        <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 16, padding: "18px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(168,85,247,0.25)", color: "#e9d5ff", fontWeight: 800 }}>
                🧭 END-TO-END RECRUITER PIPELINE
              </span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Step-by-step continuous execution matching the architecture flowchart
              </span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  const stages: FlowStage[] = ["role_dna", "candidate_intel", "evidence_graph", "match_split", "minimum_proof", "work_sample", "interviews", "conflicts", "decision"];
                  const idx = stages.indexOf(activeTab);
                  if (idx > 0) setActiveTab(stages[idx - 1]);
                }}
                disabled={activeTab === "role_dna"}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  background: activeTab === "role_dna" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: activeTab === "role_dna" ? "#64748b" : "white",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: activeTab === "role_dna" ? "not-allowed" : "pointer"
                }}
              >
                ◀ Previous Stage
              </button>
              <button
                onClick={() => {
                  const stages: FlowStage[] = ["role_dna", "candidate_intel", "evidence_graph", "match_split", "minimum_proof", "work_sample", "interviews", "conflicts", "decision"];
                  const idx = stages.indexOf(activeTab);
                  if (idx < stages.length - 1) setActiveTab(stages[idx + 1]);
                }}
                disabled={activeTab === "decision"}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  background: activeTab === "decision" ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #a855f7, #6366f1)",
                  border: "none",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: activeTab === "decision" ? "not-allowed" : "pointer"
                }}
              >
                Next Stage ▶
              </button>
            </div>
          </div>

          {/* Visual Horizontal Flow Nodes */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            {[
              { id: "role_dna" as FlowStage, label: "Role DNA", icon: "🧬", num: "1", sub: "Outcomes & Tiers" },
              { id: "candidate_intel" as FlowStage, label: "Candidate Intel", icon: "🔎", num: "2", sub: "10-Source Dossier" },
              { id: "evidence_graph" as FlowStage, label: "Evidence Graph", icon: "🕸️", num: "3", sub: "Claim ➔ Source ➔ Proof" },
              { id: "match_split" as FlowStage, label: "3-Way Match Split", icon: "⚖️", num: "4", sub: "Strong / Partial / Unknown" },
              { id: "minimum_proof" as FlowStage, label: "Minimum Proof", icon: "🎯", num: "5", sub: "Uncertainty Strategy" },
              { id: "work_sample" as FlowStage, label: "Work Sample", icon: "🧪", num: "6", sub: "Live AI Rubric" },
              { id: "interviews" as FlowStage, label: "Interview Memory", icon: "🎤", num: "7", sub: "Scorecard Logging" },
              { id: "conflicts" as FlowStage, label: "Conflict Detector", icon: "🚨", num: "8", sub: `${conflicts.length} Discrepancies` },
              { id: "decision" as FlowStage, label: "Decision Room", icon: "🏛️", num: "9", sub: "Hire / Hold / Reject" }
            ].map((st, i, arr) => {
              const isActive = activeTab === st.id;
              return (
                <React.Fragment key={st.id}>
                  <button
                    onClick={() => setActiveTab(st.id)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: isActive ? "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(99,102,241,0.25))" : "rgba(0,0,0,0.3)",
                      border: `1px solid ${isActive ? "rgba(168,85,247,0.6)" : "rgba(255,255,255,0.08)"}`,
                      textAlign: "left",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      minWidth: 140,
                      transition: "all 0.15s ease",
                      boxShadow: isActive ? "0 0 16px rgba(168,85,247,0.25)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13 }}>{st.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: isActive ? "#e9d5ff" : "#cbd5e1" }}>
                        {st.num}. {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: isActive ? "#c084fc" : "#64748b" }}>
                      {st.sub}
                    </div>
                  </button>
                  {i < arr.length - 1 && (
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, userSelect: "none" }}>➔</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── STAGE 1: ROLE ARCHITECT & ROLE DNA ── */}
        {activeTab === "role_dna" && selectedRole && (
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(168,85,247,0.2)", color: "#d8b4fe", fontWeight: 800 }}>
                  STAGE 1: ROLE ARCHITECT & ROLE DNA
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "6px 0 2px" }}>
                  {selectedRole.title} ({selectedRole.seniority})
                </h3>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Department: {selectedRole.department} • Target Hires: {selectedRole.targetHires} • Uncertainty Threshold: {Math.round(selectedRole.uncertaintyThreshold * 100)}%
                </div>
              </div>

              <button
                onClick={() => setActiveTab("candidate_intel")}
                style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #a855f7, #6366f1)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Proceed to Candidate Intel ➔
              </button>
            </div>

            {/* Target Business Outcomes */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 8 }}>
                Target Business Outcomes
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {selectedRole.businessOutcomes.map((bo, idx) => (
                  <div key={bo.id || idx} style={{ padding: "14px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: bo.impactSeverity === "Critical" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)", color: bo.impactSeverity === "Critical" ? "#f87171" : "#fbbf24", fontWeight: 800 }}>
                        {bo.impactSeverity.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{bo.timeframe}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 4 }}>{bo.outcome}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Metric: {bo.metric}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4-Tier Requirements Table */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 8 }}>
                4-Tier Requirements Hierarchy & Evidence Needed
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedRole.tieredRequirements.map(req => {
                  const tierColor = req.tier === "Critical" ? "#f87171" : req.tier === "Important" ? "#fbbf24" : req.tier === "Preferred" ? "#34d399" : "#60a5fa";
                  return (
                    <div key={req.id} style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${tierColor}20`, color: tierColor, fontWeight: 800 }}>
                            {req.tier.toUpperCase()} {req.dealBreakerIfMissing ? "• DEALBREAKER" : ""}
                          </span>
                          <strong style={{ fontSize: 13, color: "white" }}>{req.name}</strong>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>({req.category})</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#cbd5e1" }}>{req.description}</div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#38bdf8" }}>{req.weightPct}% Weight</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>Proof: {req.verificationMethod}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 2: CANDIDATE INTELLIGENCE (10 SOURCES) ── */}
        {activeTab === "candidate_intel" && selectedCandidate && (
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(56,189,248,0.2)", color: "#38bdf8", fontWeight: 800 }}>
                  STAGE 2: CANDIDATE INTELLIGENCE
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "6px 0 2px" }}>
                  10-Source Intelligence Dossier for {selectedCandidate.name}
                </h3>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Intake Channel: {selectedCandidate.sourceType === "student_application" ? "Cognalyze Student Platform" : "Bulk Resume Upload"} • Applied: {new Date(selectedCandidate.appliedAt).toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={() => setActiveTab("evidence_graph")}
                style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #a855f7, #6366f1)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Proceed to Evidence Graph ➔
              </button>
            </div>

            {/* 10-Source Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
              {/* 1. Resume */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#a855f7", marginBottom: 6 }}>1. 📄 RESUME DOSSIER</div>
                <div style={{ fontSize: 12, color: "#cbd5e1", maxHeight: 90, overflowY: "auto", fontFamily: "monospace", background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6 }}>
                  {selectedCandidate.resumeText || "No resume text attached."}
                </div>
              </div>

              {/* 2. Student DNA */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", marginBottom: 6 }}>2. 🧬 STUDENT DNA & PROFILE</div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  {candidateDna?.capabilitySummary || "Cross-disciplinary builder profile synchronized."}
                </div>
              </div>

              {/* 3. GitHub */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", marginBottom: 6 }}>3. 🐙 GITHUB REPOSITORIES</div>
                {selectedCandidate.githubData ? (
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                    <div><strong>@{selectedCandidate.githubData.handle}</strong> ({selectedCandidate.githubData.verifiedReposCount} verified repos)</div>
                    <div style={{ color: "#94a3b8", marginTop: 4 }}>
                      Top Repo: {selectedCandidate.githubData.repos[0]?.name} ({selectedCandidate.githubData.repos[0]?.languages.join(", ")})
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>No GitHub account linked</div>
                )}
              </div>

              {/* 4. LinkedIn Reference */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#60a5fa", marginBottom: 6 }}>4. 💼 LINKEDIN ATTESTED PROFILE</div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  {selectedCandidate.linkedInUrl ? (
                    <a href={selectedCandidate.linkedInUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "none" }}>
                      {selectedCandidate.linkedInUrl} ↗
                    </a>
                  ) : "Candidate has not attested a LinkedIn URL"}
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Ethical reference link — zero scraping policy</div>
                </div>
              </div>

              {/* 5. LeetCode */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 6 }}>5. ⚡ LEETCODE PROBLEM SOLVING</div>
                {selectedCandidate.leetCodeProfile ? (
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                    <strong>@{selectedCandidate.leetCodeProfile.username}</strong>: {selectedCandidate.leetCodeProfile.problemsSolved} Problems Solved
                    <div style={{ color: "#facc15", marginTop: 2 }}>Badge: {selectedCandidate.leetCodeProfile.rankingBadge}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>No LeetCode profile submitted</div>
                )}
              </div>

              {/* 6. Hackathons */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#f472b6", marginBottom: 6 }}>6. 🏆 HACKATHON ACHIEVEMENTS</div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  {selectedCandidate.hackathonRecords && selectedCandidate.hackathonRecords.length > 0
                    ? selectedCandidate.hackathonRecords.join(" • ")
                    : "No competitive hackathons recorded"}
                </div>
              </div>

              {/* 7. Student Projects */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#2dd4bf", marginBottom: 6 }}>7. 💻 STUDENT PROJECTS</div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  {selectedCandidate.studentProjects && selectedCandidate.studentProjects.length > 0 ? (
                    selectedCandidate.studentProjects.map((p, idx) => (
                      <div key={idx} style={{ marginBottom: 4 }}>
                        <strong>{p.title}</strong>: {p.tech.join(", ")}
                      </div>
                    ))
                  ) : "No independent projects logged"}
                </div>
              </div>

              {/* 8. Certifications & Learning */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", marginBottom: 6 }}>8. 📜 CERTIFICATIONS & LEARNING</div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  {selectedCandidate.certifications && selectedCandidate.certifications.length > 0
                    ? selectedCandidate.certifications.join(", ")
                    : "Continuous learning verified through repository commits"}
                </div>
              </div>

              {/* 9. Assessments */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", marginBottom: 6 }}>9. 📊 ASSESSMENTS & WORK SAMPLES</div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  {selectedCandidate.workSampleResults && Object.keys(selectedCandidate.workSampleResults).length > 0 ? (
                    Object.entries(selectedCandidate.workSampleResults).map(([k, v]) => (
                      <div key={k} style={{ color: v.passed ? "#6ee7b7" : "#fde68a" }}>
                        ✓ {k}: Score {v.score}/100 ({v.output})
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "#94a3b8" }}>No work samples submitted yet</span>
                  )}
                </div>
              </div>

              {/* 10. Previous Interviews */}
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#ec4899", marginBottom: 6 }}>10. 🎙️ PREVIOUS INTERVIEWS & MEMORY</div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  {selectedCandidate.priorCognalyzeInterviewHistory && selectedCandidate.priorCognalyzeInterviewHistory.length > 0 ? (
                    selectedCandidate.priorCognalyzeInterviewHistory.map((h, idx) => (
                      <div key={idx}>
                        <strong>{h.roleEvaluatedFor}</strong>: Score {h.score}/100 — &ldquo;{h.feedback}&rdquo;
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "#94a3b8" }}>No previous Cognalyze interview rounds recorded</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 3: EVIDENCE GRAPH (CLAIM ➔ SOURCE ➔ PROOF) & CANDIDATE DNA ── */}
        {activeTab === "evidence_graph" && (
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(168,85,247,0.2)", color: "#d8b4fe", fontWeight: 800 }}>
                  STAGE 3: EVIDENCE GRAPH
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "6px 0 2px" }}>
                  Claim ➔ Source ➔ Proof Verification Network
                </h3>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Synthesizes candidate claims against verified artifacts and calculates empirical uncertainty
                </div>
              </div>

              <button
                onClick={() => setActiveTab("match_split")}
                style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #a855f7, #6366f1)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Proceed to Match & 3-Way Split ➔
              </button>
            </div>

            {/* Evidence Nodes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {evidenceNodes.map(node => {
                const isKnown = node.uncertaintyStatus === "known";
                const isPartial = node.uncertaintyStatus === "partially_known";
                const badgeColor = isKnown ? "#34d399" : isPartial ? "#fbbf24" : "#f87171";
                const badgeBg = isKnown ? "rgba(16,185,129,0.2)" : isPartial ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)";

                return (
                  <div
                    key={node.requirementId}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 12,
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.06)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: badgeBg, color: badgeColor, fontWeight: 800 }}>
                          {node.uncertaintyStatus.toUpperCase()}
                        </span>
                        <strong style={{ fontSize: 14, color: "white" }}>{node.requirementName}</strong>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>({node.tier.toUpperCase()})</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#cbd5e1" }}>Confidence: {Math.round(node.confidenceScore * 100)}%</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 12, marginBottom: 8 }}>
                      <div style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                        <strong style={{ color: "#38bdf8" }}>Candidate Claim:</strong>
                        <div style={{ color: "#cbd5e1", marginTop: 3 }}>{node.claim}</div>
                      </div>
                      <div style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                        <strong style={{ color: "#34d399" }}>Source Artifact:</strong>
                        <div style={{ color: "#cbd5e1", marginTop: 3 }}>
                          {node.source.toUpperCase()}: &ldquo;{node.proofLocation}&rdquo;
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 6 }}>
                      {node.verbatimProof ? `Verified Verbatim Proof: "${node.verbatimProof}"` : `Proof Type: ${node.proofType}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STAGE 4: 3-WAY EVIDENCE SPLIT ── */}
        {activeTab === "match_split" && matchResult && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#6ee7b7", marginBottom: 2 }}>🟢 STRONG EVIDENCE (KNOWN)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#34d399" }}>{matchResult.evidenceSplit.strong.length} Verified</div>
                <div style={{ fontSize: 11, color: "#a7f3d0" }}>Backed by code commits or work samples</div>
              </div>

              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fde68a", marginBottom: 2 }}>🟡 PARTIAL EVIDENCE</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24" }}>{matchResult.evidenceSplit.partial.length} Mentioned</div>
                <div style={{ fontSize: 11, color: "#fef08a" }}>Resume claims or coursework without live proof</div>
              </div>

              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fca5a5", marginBottom: 2 }}>🔴 UNKNOWN / MISSING</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#f87171" }}>{matchResult.evidenceSplit.unknown.length} Gaps</div>
                <div style={{ fontSize: 11, color: "#fecaca" }}>Zero verifiable presence in candidate dossier</div>
              </div>
            </div>

            {/* REQUIREMENTS BREAKDOWN TABLE */}
            <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "20px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "white", margin: "0 0 14px" }}>
                Role DNA Requirement Traceability & Proof Locations
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...matchResult.evidenceSplit.strong, ...matchResult.evidenceSplit.partial, ...matchResult.evidenceSplit.unknown].map(item => {
                  const isStrong = item.status === "Strong";
                  const isPartial = item.status === "Partial";
                  const statusBg = isStrong ? "rgba(16,185,129,0.2)" : isPartial ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)";
                  const statusColor = isStrong ? "#34d399" : isPartial ? "#fbbf24" : "#f87171";

                  return (
                    <div
                      key={item.requirementId}
                      style={{
                        padding: "14px 18px",
                        borderRadius: 10,
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "#cbd5e1", fontWeight: 800 }}>
                            {item.tier.toUpperCase()} {item.dealBreaker ? "• DEALBREAKER" : ""}
                          </span>
                          <strong style={{ fontSize: 13, color: "white" }}>{item.name}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          Proof Location: <span style={{ color: "#38bdf8" }}>{item.proofLocation}</span>
                        </div>
                        {item.verbatimSnippet && (
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, fontStyle: "italic" }}>
                            &ldquo;{item.verbatimSnippet}&rdquo;
                          </div>
                        )}
                      </div>

                      <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: statusBg, color: statusColor, fontWeight: 800 }}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MINIMUM PROOF ENGINE ── */}
        {activeTab === "minimum_proof" && minimumProofPlan && (
          <div>
            <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: 14, color: "#c7d2fe" }}>
                    🎯 Minimum Proof Prioritization Logic
                  </strong>
                  <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
                    {minimumProofPlan.prioritizationIntegrityCheck.explanation}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#cbd5e1" }}>
                  Est. Total Verification Time: <strong style={{ color: "#38bdf8" }}>{minimumProofPlan.totalTimeEstimateMinutes} mins</strong>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {minimumProofPlan.proposals.map(p => (
                <div
                  key={p.priorityRank}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    border: `1px solid ${p.tier === "Critical" ? "rgba(239, 68, 68, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
                    borderRadius: 12,
                    padding: "18px 22px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: p.tier === "Critical" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)", color: p.tier === "Critical" ? "#fca5a5" : "#fde68a", fontWeight: 800 }}>
                        RANK #{p.priorityRank} • {p.gapSeverity.toUpperCase()}
                      </span>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0 }}>
                        {p.requirementName}
                      </h4>
                    </div>

                    <span style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700 }}>
                      ⏱️ ~{p.estimatedMinutesToVerify} mins • {p.recommendedMethod.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {p.proposedTaskOrQuestion}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      Uncertainty Reduction Impact: +{p.uncertaintyReductionImpact}%
                    </span>
                    <button
                      onClick={() => setActiveTab("work_sample")}
                      style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", color: "#e9d5ff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Launch Verification Studio ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: WORK SAMPLE STUDIO ── */}
        {activeTab === "work_sample" && (
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            {activeTask ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(168,85,247,0.2)", color: "#d8b4fe", fontWeight: 800 }}>
                      WORK SAMPLE CHALLENGE • {activeTask.triggerContext.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "6px 0 2px" }}>
                      {activeTask.title}
                    </h3>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      Tied to Role DNA Critical Requirement: <strong style={{ color: "#38bdf8" }}>{activeTask.requirementName}</strong>
                    </div>
                  </div>

                  <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>
                    ⏳ Limit: {activeTask.timeLimitMinutes} mins
                  </span>
                </div>

                {/* Scenario Context */}
                <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginBottom: 4 }}>PRODUCTION SCENARIO CONTEXT</div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.5 }}>
                    {activeTask.scenarioContext}
                  </p>
                </div>

                {/* Technical Task Details */}
                <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginBottom: 4 }}>TECHNICAL DELIVERABLE EXPECTATIONS</div>
                  <pre style={{ fontSize: 12, color: "#cbd5e1", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
                    {activeTask.technicalTask}
                  </pre>
                </div>

                {/* Candidate Submission Input */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>
                      CANDIDATE CODE / ARCHITECTURAL SUBMISSION
                    </label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {activeTask.starterCodeOrTemplate && (
                        <button
                          type="button"
                          onClick={() => setSampleSubmission(activeTask.starterCodeOrTemplate || "")}
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          📋 Reset Starter Code
                        </button>
                      )}
                      <label style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#e9d5ff", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        📂 Upload Code File
                        <input
                          type="file"
                          accept=".go,.ts,.js,.py,.sql,.java,.cpp,.txt"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const text = await file.text();
                              setSampleSubmission(text);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    value={sampleSubmission}
                    onChange={e => setSampleSubmission(e.target.value)}
                    placeholder="Enter or paste candidate's code or architectural solution here..."
                    style={{ width: "100%", padding: "14px", borderRadius: 8, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)", color: "#38bdf8", fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: 1.5, boxSizing: "border-box" }}
                  />
                </div>

                <button
                  onClick={handleEvaluateWorkSample}
                  disabled={evaluatingSample || !sampleSubmission.trim()}
                  style={{
                    padding: "11px 22px",
                    borderRadius: 8,
                    background: evaluatingSample ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #10b981, #059669)",
                    border: "none",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: evaluatingSample ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  {evaluatingSample ? (
                    <>
                      <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
                      <span>Running Principal Staff AI Code Review (Groq LLaMA 3.3 70B)...</span>
                    </>
                  ) : (
                    <>⚡ Run Principal Staff AI Code Review</>
                  )}
                </button>

                {/* Evaluation Results Box */}
                {evaluationResult && (
                  <div style={{ marginTop: 20, padding: "20px", borderRadius: 12, background: evaluationResult.passed ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", border: `1px solid ${evaluationResult.passed ? "rgba(16,185,129,0.35)" : "rgba(245,158,11,0.35)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{evaluationResult.passed ? "🏆" : "⚠️"}</span>
                        <div>
                          <strong style={{ fontSize: 15, color: evaluationResult.passed ? "#6ee7b7" : "#fde68a" }}>
                            {evaluationResult.passed ? "VERIFIED PASS" : "CONDITIONAL / PARTIAL"} — Score: {evaluationResult.score}/100
                          </strong>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>Verdict: {evaluationResult.interviewerVerdict}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(0,0,0,0.4)", color: "white", fontWeight: 800, border: "1px solid rgba(255,255,255,0.1)" }}>
                        EVIDENCE STATUS: {evaluationResult.updatedEvidenceState.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: "white", margin: "0 0 14px", lineHeight: 1.5 }}>
                      {evaluationResult.decisionImpact}
                    </p>

                    {/* Rubric Breakdown Grid */}
                    {evaluationResult.rubricBreakdown && evaluationResult.rubricBreakdown.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginBottom: 6 }}>DETAILED RUBRIC SCORECARD</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                          {evaluationResult.rubricBreakdown.map((r, i) => (
                            <div key={i} style={{ background: "rgba(0,0,0,0.3)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                                <span style={{ color: "#cbd5e1" }}>{r.criterion}</span>
                                <span style={{ color: r.scoreAwarded === r.maxScore ? "#34d399" : "#fde68a" }}>{r.scoreAwarded}/{r.maxScore}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{r.feedback}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic", background: "rgba(0,0,0,0.25)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <strong>Verbatim Technical Proof:</strong> &ldquo;{evaluationResult.verbatimProof}&rdquo;
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                Generating targeted work sample...
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: INTERVIEW INTELLIGENCE & MEMORY ── */}
        {activeTab === "interviews" && (
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(236,72,153,0.2)", color: "#f472b6", fontWeight: 800 }}>
                  PHASE 8 INTERVIEW MEMORY
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "white", margin: "6px 0 2px" }}>
                  Precision Gap Probing Questions (Non-Repetitive)
                </h3>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  These questions explicitly target unresolved unknowns from the Evidence Graph and avoid repeating questions asked in previous rounds.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>ROUNDS COMPLETED</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#f472b6" }}>{interviewHistory?.roundsCompleted || 0}</div>
                </div>
                <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>LOCKED IN MEMORY</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#38bdf8" }}>{interviewHistory?.questionHistory?.length || 0}</div>
                </div>
              </div>
            </div>

            {feedbackMessage && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7", fontSize: 12, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{feedbackMessage}</span>
                <button onClick={() => setFeedbackMessage(null)} style={{ background: "transparent", border: "none", color: "#6ee7b7", cursor: "pointer" }}>✕</button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {interviewQuestions.map((q, idx) => {
                const isLogging = activeFeedbackQuestionId === (q.questionId || String(idx));
                return (
                  <div
                    key={q.questionId || idx}
                    style={{
                      padding: "18px 22px",
                      borderRadius: 12,
                      background: "rgba(0,0,0,0.3)",
                      border: isLogging ? "1px solid rgba(236,72,153,0.5)" : "1px solid rgba(255,255,255,0.06)",
                      transition: "border 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#f472b6" }}>
                        PROBING GAP: {q.requirementName} ({q.tier.toUpperCase()})
                      </span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>
                          {q.reasonForSelection}
                        </span>
                        <button
                          onClick={() => setActiveFeedbackQuestionId(isLogging ? null : (q.questionId || String(idx)))}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: isLogging ? "rgba(255,255,255,0.1)" : "rgba(236,72,153,0.18)",
                            border: `1px solid ${isLogging ? "rgba(255,255,255,0.2)" : "rgba(236,72,153,0.4)"}`,
                            color: isLogging ? "white" : "#f472b6",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          {isLogging ? "✕ Cancel Scorecard" : "📝 Log Interview Scorecard"}
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 10 }}>
                      &ldquo;{q.questionText}&rdquo;
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
                      <div>
                        <strong style={{ color: "#34d399" }}>What Strong Answers Look Like:</strong>
                        <div style={{ color: "#a7f3d0", marginTop: 2, lineHeight: 1.4 }}>{q.whatStrongLookLike}</div>
                      </div>
                      <div>
                        <strong style={{ color: "#f87171" }}>Red Flag Responses:</strong>
                        <div style={{ color: "#fecaca", marginTop: 2, lineHeight: 1.4 }}>{q.redFlagAnswer}</div>
                      </div>
                    </div>

                    {/* Interactive Scorecard Form */}
                    {isLogging && (
                      <div style={{ marginTop: 16, padding: "16px", borderRadius: 10, background: "rgba(236,72,153,0.05)", border: "1px solid rgba(236,72,153,0.2)" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#f472b6", marginBottom: 12 }}>
                          INTERVIEWER SCORECARD LOGGING
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
                          <div>
                            <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 3 }}>INTERVIEWER NAME</label>
                            <input
                              type="text"
                              value={feedbackInterviewerName}
                              onChange={e => setFeedbackInterviewerName(e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, boxSizing: "border-box" }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 3 }}>ROUND TYPE</label>
                            <select
                              value={feedbackRoundType}
                              onChange={e => setFeedbackRoundType(e.target.value as any)}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, boxSizing: "border-box" }}
                            >
                              <option value="system_design">System Design & Architecture</option>
                              <option value="coding">Live Technical Coding</option>
                              <option value="deep_dive">Deep Dive Portfolio & Code Audit</option>
                              <option value="behavioral">Engineering Principles & Behavioral</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 3 }}>SCORE (1-10)</label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={feedbackRating}
                              onChange={e => setFeedbackRating(Number(e.target.value))}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, boxSizing: "border-box" }}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 3 }}>CANDIDATE RESPONSE & KEY INSIGHTS</label>
                          <textarea
                            rows={3}
                            value={feedbackInsights}
                            onChange={e => setFeedbackInsights(e.target.value)}
                            placeholder="Enter candidate's explanation, architecture choices, and depth demonstrated..."
                            style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, boxSizing: "border-box" }}
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                          <div>
                            <label style={{ fontSize: 10, color: "#34d399", fontWeight: 700, display: "block", marginBottom: 3 }}>KEY STRENGTHS OBSERVED</label>
                            <input
                              type="text"
                              value={feedbackStrengths}
                              onChange={e => setFeedbackStrengths(e.target.value)}
                              placeholder="e.g. Understood partition rebalances, clear lock management"
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, color: "#f87171", fontWeight: 700, display: "block", marginBottom: 3 }}>RED FLAGS / GAPS DETECTED</label>
                            <input
                              type="text"
                              value={feedbackRedFlags}
                              onChange={e => setFeedbackRedFlags(e.target.value)}
                              placeholder="e.g. Hesitant on split-brain scenarios, hand-waving rollback"
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, boxSizing: "border-box" }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleSaveInterviewFeedback(q)}
                          disabled={savingFeedback || !feedbackInsights.trim()}
                          style={{
                            padding: "9px 18px",
                            borderRadius: 8,
                            background: "linear-gradient(135deg, #ec4899, #db2777)",
                            border: "none",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: savingFeedback ? "not-allowed" : "pointer"
                          }}
                        >
                          {savingFeedback ? "Saving to Candidate Memory..." : "💾 Save Scorecard to Candidate Permanent Memory"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 5: CONFLICT DETECTOR ── */}
        {activeTab === "conflicts" && (
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.2)", color: "#fca5a5", fontWeight: 800 }}>
                PHASE 9 CONFLICT DETECTOR & LOOPBACK
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "white", margin: "6px 0 2px" }}>
                Claim vs Proof Discrepancies ({conflicts.length} Detected)
              </h3>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Discrepancies automatically trigger a Phase 7 Targeted Verification challenge scoped specifically to the disputed competency.
              </div>
            </div>

            {conflicts.length === 0 ? (
              <div style={{ padding: 24, borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#6ee7b7", fontSize: 13, textAlign: "center" }}>
                ✓ No contradictions or panelist disagreements detected for this candidate.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {conflicts.map(c => (
                  <div
                    key={c.id}
                    style={{
                      padding: "18px 22px",
                      borderRadius: 12,
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(239, 68, 68, 0.35)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.2)", color: "#f87171", fontWeight: 800 }}>
                        {c.conflictType.toUpperCase().replace(/_/g, " ")} • {c.severity} SEVERITY
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>Competency: {c.requirementName}</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12, marginBottom: 12 }}>
                      <div style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
                        <strong style={{ color: "#38bdf8" }}>Statement A:</strong>
                        <div style={{ color: "#cbd5e1", marginTop: 2 }}>{c.statementA}</div>
                      </div>
                      <div style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
                        <strong style={{ color: "#f87171" }}>Statement B:</strong>
                        <div style={{ color: "#cbd5e1", marginTop: 2 }}>{c.statementB}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                      <span style={{ fontSize: 12, color: "#fbbf24" }}>
                        🔁 Loopback Action: {c.suggestedAction}
                      </span>
                      {c.targetedVerificationTask && (
                        <button
                          onClick={() => {
                            setActiveTask(c.targetedVerificationTask!);
                            setActiveTab("work_sample");
                          }}
                          style={{ padding: "6px 14px", borderRadius: 6, background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          Execute Loopback Probe ➔
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 6: DECISION JOURNAL & TALENT RECOVERY ── */}
        {activeTab === "decision" && (
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(168,85,247,0.2)", color: "#d8b4fe", fontWeight: 800 }}>
                PHASE 10 & 11 COMMITTEE SYNTHESIS
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "6px 0 2px" }}>
                Final Decision & Talent Recovery Execution
              </h3>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Record definitive committee verdict. &ldquo;Hold&rdquo; loops back into Phase 7 verification. &ldquo;Reject&rdquo; triggers Phase 11 Talent Recovery across other open positions.
              </div>
            </div>

            {decisionMessage && (
              <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#c7d2fe", marginBottom: 20, fontSize: 13, fontWeight: 700 }}>
                {decisionMessage}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 6 }}>
                COMMITTEE DECISION JOURNAL RATIONALE
              </label>
              <textarea
                rows={3}
                value={decisionRationale}
                onChange={e => setDecisionRationale(e.target.value)}
                placeholder="Document evidence-based justification for this verdict..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13 }}
              />
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <button
                onClick={() => handleSubmitVerdict("Hire")}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                }}
              >
                🏆 Record Verdict: HIRE (Enter 30/60/90 Loop)
              </button>

              <button
                onClick={() => handleSubmitVerdict("Hold")}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  border: "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(245,158,11,0.3)"
                }}
              >
                ⏳ Record Verdict: HOLD (Loop to Phase 7 Verification)
              </button>

              <button
                onClick={() => handleSubmitVerdict("Reject")}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  border: "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(239,68,68,0.3)"
                }}
              >
                ❌ Record Verdict: REJECT (Trigger Talent Recovery)
              </button>
            </div>

            {/* PHASE 12 & 13 HIRE BRANCH */}
            {decisionVerdict === "Hire" && (
              <div style={{ marginTop: 24, padding: "22px", borderRadius: 14, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.35)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>🏆</span>
                    <h4 style={{ fontSize: 16, fontWeight: 900, color: "#6ee7b7", margin: 0 }}>
                      HIRE BRANCH: 30/60/90 Retention Outcome & Learning Loop
                    </h4>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, maxWidth: 700, lineHeight: 1.5 }}>
                    Candidate successfully extended an offer! Now enrolled into empirical Day 30 Onboarding, Day 60 Autonomy, and Day 90 Business Outcome milestones to feed retention learnings back into future Role DNAs.
                  </p>
                </div>

                <Link
                  href="/recruiter/quality-of-hire"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 800,
                    boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                  }}
                >
                  Enter 30/60/90 Quality-of-Hire Loop ➔
                </Link>
              </div>
            )}

            {/* PHASE 7/10 HOLD LOOPBACK BRANCH */}
            {decisionVerdict === "Hold" && (
              <div style={{ marginTop: 24, padding: "22px", borderRadius: 14, background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.35)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>⏳</span>
                    <h4 style={{ fontSize: 16, fontWeight: 900, color: "#fde68a", margin: 0 }}>
                      HOLD BRANCH: More Evidence via Targeted Verification Loopback
                    </h4>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, maxWidth: 700, lineHeight: 1.5 }}>
                    Committee requires empirical proof on critical gaps before rendering final judgment. An automated Phase 7 verification mini-task has been scoped specifically to the candidate&apos;s highest-uncertainty requirement.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("work_sample")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(245,158,11,0.3)"
                  }}
                >
                  Open Targeted Verification Challenge ➔
                </button>
              </div>
            )}

            {/* PHASE 11 TALENT RECOVERY RESULTS */}
            {talentRecovery && (
              <div style={{ marginTop: 24, padding: "20px", borderRadius: 14, background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>♻️</span>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0 }}>
                      Phase 11 Talent Recovery: Alternative Open Role Matches ({talentRecovery.eligibleAlternativeRolesCount})
                    </h4>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      Cross-matching rejected candidate&apos;s verified Candidate DNA against other open Role DNAs
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {talentRecovery.recoveredMatches.map((rec, idx) => (
                    <div
                      key={rec.targetRoleId}
                      style={{
                        padding: "14px 18px",
                        borderRadius: 10,
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.2)", color: "#6ee7b7", fontWeight: 800 }}>
                            {rec.compatibilityScore}% COMPATIBILITY
                          </span>
                          <strong style={{ fontSize: 14, color: "white" }}>{rec.targetRoleTitle}</strong>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>({rec.department})</span>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "0 0 4px" }}>
                          {rec.recommendationNarrative}
                        </p>
                        <div style={{ fontSize: 11, color: "#38bdf8" }}>
                          Transferred Skills: {rec.strongSkillsTransferred.join(", ")}
                        </div>
                      </div>

                      <button
                        onClick={() => alert(`Transferred ${talentRecovery.candidateName} to ${rec.targetRoleTitle} pipeline!`)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 6,
                          background: "linear-gradient(135deg, #6366f1, #a855f7)",
                          border: "none",
                          color: "white",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Route Candidate ➔
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
