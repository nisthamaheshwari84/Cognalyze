"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import {
  ContributionWorkspaceState,
  InterviewModeType,
  PersistedInterviewSession,
  PreparationArena,
  RoadmapNodeMasteryState,
  StartingLevel,
  StudentArenaState,
} from "@/lib/skills/preparations/types";
import { ProposalEvaluationResult } from "@/lib/skills/preparations/proposal-evaluator";
import { OrchestratedArenaContext } from "@/lib/skills/preparations/orchestrator";
import { DiscoveredIssueOpportunity } from "@/lib/skills/preparations/github-discovery-engine";
import {
  GeneratedAssessmentSession,
  AssessmentEvaluationFeedback,
} from "@/lib/skills/preparations/autonomous-assessment-engine";

interface Props {
  arenaSlug: string;
}

export type ArenaWorkspaceTab =
  | "command_center"
  | "roadmap"
  | "opensource"
  | "projects"
  | "mock_assessment"
  | "interview"
  | "experiences"
  | "proposal";

export default function DedicatedArenaWorkspace({ arenaSlug }: Props) {
  const searchParams = useSearchParams();
  const [orchestrated, setOrchestrated] = useState<OrchestratedArenaContext | null>(null);
  const [arena, setArena] = useState<PreparationArena | null>(null);
  const [studentState, setStudentState] = useState<StudentArenaState | null>(null);
  const [activeLevel, setActiveLevel] = useState<StartingLevel>("beginner");
  const [activeTab, setActiveTab] = useState<ArenaWorkspaceTab>("command_center");
  const [loading, setLoading] = useState(true);
  const [statusBanner, setStatusBanner] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);

  // Open Source Filtering & 10-Stage Contribution Workspace Modal
  const [ossFilterClass, setOssFilterClass] = useState<string>("ALL");
  const [ossFilterDiff, setOssFilterDiff] = useState<string>("ALL");
  const [ossRefreshing, setOssRefreshing] = useState(false);
  const [activeIssue, setActiveIssue] = useState<DiscoveredIssueOpportunity | null>(null);
  const [workspaceSteps, setWorkspaceSteps] = useState<number[]>([]);
  const [workspaceNotes, setWorkspaceNotes] = useState("");
  const [workspacePrUrl, setWorkspacePrUrl] = useState("");
  const [verifyingPr, setVerifyingPr] = useState(false);

  // Proposal State
  const [proposalText, setProposalText] = useState("");
  const [isEvaluatingProposal, setIsEvaluatingProposal] = useState(false);
  const [proposalResult, setProposalResult] = useState<ProposalEvaluationResult | null>(null);

  // Autonomous Assessment State
  const [autonomousSession, setAutonomousSession] = useState<GeneratedAssessmentSession | null>(null);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentEvaluationFeedback | null>(null);

  // Conversational Interview Studio State
  const [interviewMode, setInterviewMode] = useState<InterviewModeType>("technical_interview");
  const [activeInterview, setActiveInterview] = useState<PersistedInterviewSession | null>(null);
  const [interviewInput, setInterviewInput] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Experience & Video Intelligence Filters
  const [expStageFilter, setExpStageFilter] = useState<string>("ALL");
  const [expFormatFilter, setExpFormatFilter] = useState<string>("ALL");
  const [inspectingVideoUrl, setInspectingVideoUrl] = useState<string | null>(null);

  // Agent Trace Visibility
  const [showAgentTrace, setShowAgentTrace] = useState(false);

  // Diagnostic Modal State
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [selectedDiagnosticAnswers, setSelectedDiagnosticAnswers] = useState<Record<string, StartingLevel>>({});

  useEffect(() => {
    const paramTab = searchParams.get("tab") as ArenaWorkspaceTab | null;
    if (
      paramTab &&
      [
        "command_center",
        "roadmap",
        "opensource",
        "projects",
        "mock_assessment",
        "interview",
        "experiences",
        "proposal",
      ].includes(paramTab)
    ) {
      setActiveTab(paramTab);
    }
  }, [searchParams]);

  const loadArena = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`);
      const data = await res.json();
      if (data.success && data.orchestratedContext) {
        const ctx: OrchestratedArenaContext = data.orchestratedContext;
        setOrchestrated(ctx);
        setArena(ctx.arena);
        setStudentState(ctx.studentState);
        setActiveLevel(ctx.activeLevel || "beginner");
        if (ctx.readyMockAssessmentSession) {
          setAutonomousSession(ctx.readyMockAssessmentSession);
        }
        if (ctx.studentState?.proposalDraft) {
          setProposalText(ctx.studentState.proposalDraft);
        } else if (ctx.proposalGuidance?.suggestedScaffoldMarkdown) {
          setProposalText(ctx.proposalGuidance.suggestedScaffoldMarkdown);
        }
        if (ctx.studentState?.proposalEvaluation) {
          setProposalResult(ctx.studentState.proposalEvaluation as ProposalEvaluationResult);
        }
        if (ctx.interviewHistory && ctx.interviewHistory.length > 0 && ctx.interviewHistory[0].status === "active") {
          setActiveInterview(ctx.interviewHistory[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load arena:", err);
      setStatusBanner({ type: "error", text: "Unable to load preparation arena. Please refresh." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArena();
  }, [arenaSlug]);

  const handleLevelChange = async (newLevel: StartingLevel) => {
    setActiveLevel(newLevel);
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_level", level: newLevel }),
      });
      const data = await res.json();
      if (data.success) {
        setStudentState(data.studentState);
        await loadArena();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoadmapNodeUpdate = async (nodeId: string, nextState: RoadmapNodeMasteryState) => {
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_roadmap_node", nodeId, masteryState: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner({ type: "success", text: `Updated learning node status to '${nextState.replace("_", " ")}'.` });
        await loadArena();
      } else {
        setStatusBanner({ type: "error", text: data.error || "Unable to update node." });
      }
    } catch {
      setStatusBanner({ type: "error", text: "Failed to save roadmap node state." });
    }
  };

  const openContributionWorkspace = (issue: DiscoveredIssueOpportunity) => {
    setActiveIssue(issue);
    const existing: ContributionWorkspaceState | undefined = orchestrated?.contributionWorkspaces.find(
      w => w.issueId === issue.id
    );
    setWorkspaceSteps(existing?.completedStepIds || []);
    setWorkspaceNotes(existing?.notes || "");
    setWorkspacePrUrl(existing?.prUrl || "");
  };

  const handleSaveWorkspaceOrVerifyPR = async () => {
    if (!activeIssue) return;
    setVerifyingPr(true);
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_github_pr",
          issueId: activeIssue.id,
          repoFullName: activeIssue.repository,
          issueNumber: activeIssue.issueNumber,
          issueTitle: activeIssue.title,
          issueUrl: activeIssue.issueUrl,
          completedStepIds: workspaceSteps,
          notes: workspaceNotes,
          prUrl: workspacePrUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (workspacePrUrl.trim()) {
          const detail = data.prVerificationDetail;
          setStatusBanner({
            type: detail?.verified ? "success" : "info",
            text: detail?.verified
              ? `GitHub verified PR status: ${detail.status.replace("verified_", "").toUpperCase()} (${detail.title || workspacePrUrl})`
              : detail?.reason || "Workspace saved; PR could not be verified on GitHub yet.",
          });
        } else {
          setStatusBanner({ type: "success", text: "Contribution workspace progress saved." });
        }
        await loadArena();
      }
    } catch {
      setStatusBanner({ type: "error", text: "Failed saving contribution workspace." });
    } finally {
      setVerifyingPr(false);
    }
  };

  const handleRefreshGitHubDiscovery = async () => {
    setOssRefreshing(true);
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh_github_discovery" }),
      });
      const data = await res.json();
      if (data.success && data.githubDiscovery && orchestrated) {
        setOrchestrated({ ...orchestrated, githubDiscovery: data.githubDiscovery });
        setStatusBanner({
          type: "info",
          text: `Discovered ${data.githubDiscovery.totalDiscovered} open opportunities (${data.githubDiscovery.sourceMode}).`,
        });
      }
    } catch {
      setStatusBanner({ type: "error", text: "GitHub discovery refresh failed." });
    } finally {
      setOssRefreshing(false);
    }
  };

  const handleActivateProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate_project", projectId }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner({ type: "success", text: "Project added to your active execution track." });
        await loadArena();
      }
    } catch {}
  };

  const handleStartAutonomousAssessment = async () => {
    setIsGeneratingAssessment(true);
    setAssessmentResult(null);
    setAssessmentAnswers({});
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_autonomous_assessment" }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setAutonomousSession(data.session);
      }
    } catch {
      setStatusBanner({ type: "error", text: "Could not synthesize personalized assessment." });
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  const handleEvaluateAutonomousAssessment = async () => {
    if (!autonomousSession) return;
    setIsSubmittingAssessment(true);
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_autonomous_assessment",
          session: autonomousSession,
          responses: assessmentAnswers,
        }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setAssessmentResult(data.evaluation);
        await loadArena();
      }
    } catch {
      setStatusBanner({ type: "error", text: "Assessment submission failed." });
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const handleStartInterview = async () => {
    setInterviewLoading(true);
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_interview_session", mode: interviewMode }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveInterview(data.session);
        setInterviewInput("");
      }
    } catch {
      setStatusBanner({ type: "error", text: "Unable to initialize technical interview session." });
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleSubmitInterviewTurn = async () => {
    if (!activeInterview || !interviewInput.trim()) return;
    setInterviewLoading(true);
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_interview_turn",
          sessionId: activeInterview.sessionId,
          studentResponse: interviewInput,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveInterview(data.session);
        setInterviewInput("");
        await loadArena();
      }
    } catch {
      setStatusBanner({ type: "error", text: "Failed submitting interview response." });
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleInspectVideo = async (url: string) => {
    setInspectingVideoUrl(url);
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inspect_video_resource", url }),
      });
      const data = await res.json();
      if (data.success && data.inspection) {
        setStatusBanner({ type: "info", text: data.inspection.diagnosticNote });
        await loadArena();
      }
    } catch {} finally {
      setInspectingVideoUrl(null);
    }
  };

  const handleEvaluateProposal = async () => {
    if (!proposalText.trim()) return;
    setIsEvaluatingProposal(true);
    try {
      const res = await fetch(`/api/skills/preparations/${arenaSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review_proposal", proposalText }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setProposalResult(data.evaluation);
        setStudentState(data.studentState);
      }
    } catch {
      setStatusBanner({ type: "error", text: "Proposal evaluation failed." });
    } finally {
      setIsEvaluatingProposal(false);
    }
  };

  const filteredIssues = useMemo(() => {
    const list = orchestrated?.githubDiscovery.opportunities || [];
    return list.filter(i => {
      if (ossFilterClass !== "ALL" && i.classification !== ossFilterClass) return false;
      if (ossFilterDiff !== "ALL" && i.difficulty !== ossFilterDiff) return false;
      return true;
    });
  }, [orchestrated, ossFilterClass, ossFilterDiff]);

  const filteredExperiences = useMemo(() => {
    const list = orchestrated?.experienceIntelligence.resources || [];
    return list.filter(r => {
      if (expStageFilter !== "ALL" && r.preparationStage !== expStageFilter) return false;
      if (expFormatFilter !== "ALL" && r.resourceType !== expFormatFilter) return false;
      return true;
    });
  }, [orchestrated, expStageFilter, expFormatFilter]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1" }}>
        <AppNav role="student" />
        <div style={{ textAlign: "center", padding: "100px 0", color: "#667085", fontSize: 14 }}>
          Synchronizing Student DNA, cycle schedule, and preparation intelligence...
        </div>
      </div>
    );
  }

  if (!arena || !orchestrated) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1" }}>
        <AppNav role="student" />
        <div style={{ textAlign: "center", padding: "100px 0", color: "#667085" }}>
          Preparation Arena not found.{" "}
          <Link href="/student/skills/preparations" style={{ color: "#356AE6", fontWeight: 700 }}>
            Return to Preparations Catalog
          </Link>
        </div>
      </div>
    );
  }

  const {
    commandCenter,
    studentDNA,
    eightPillarProgress,
    dependencyRoadmap,
    githubDiscovery,
    rankedProjects,
    assessmentHistory,
    interviewHistory,
    experienceIntelligence,
    proposalGuidance,
    agentTraceLedger,
    interviewTrackConfig,
  } = orchestrated;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      {/* Sticky Subheader Navigation */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "10px 24px", position: "sticky", top: 56, zIndex: 20 }}>
        <div style={{ maxWidth: 1260, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <Link href="/student/skills/preparations" style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}>
              ← All Preparation Arenas
            </Link>
            <span style={{ color: "#98A2B3" }}>/</span>
            <span style={{ color: "#356AE6", fontWeight: 700 }}>{arena.shortName}</span>
            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569", fontWeight: 700 }}>
              {arena.cycleYear || 2027} Cycle
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => setShowAgentTrace(prev => !prev)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                background: showAgentTrace ? "#162A43" : "#F6F5F1",
                border: "1px solid #E4E1DA",
                color: showAgentTrace ? "#FFFFFF" : "#162A43",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🤖 Orchestrator Trace ({agentTraceLedger.length})
            </button>
            <a
              href={arena.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 6,
                background: "#F6F5F1",
                border: "1px solid #E4E1DA",
                color: "#162A43",
                fontSize: 11,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              🏛️ Official Guidelines ↗
            </a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1260, margin: "20px auto", padding: "0 24px 64px" }}>
        {statusBanner && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 16px",
              borderRadius: 8,
              background: statusBanner.type === "error" ? "#FEF2F2" : statusBanner.type === "success" ? "#EAF4EE" : "#EFF4FE",
              border: `1px solid ${statusBanner.type === "error" ? "#FECACA" : statusBanner.type === "success" ? "#BBF7D0" : "#BFDBFE"}`,
              color: "#162A43",
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{statusBanner.text}</span>
            <button
              onClick={() => setStatusBanner(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 800, color: "#64748B" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Expandable Multi-Agent Reasoning & Trace Ledger */}
        {showAgentTrace && (
          <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginBottom: 8 }}>
              Multi-Agent Orchestration Ledger (Shared Context &amp; Provenance)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
              {agentTraceLedger.map(tr => (
                <div key={tr.id} style={{ fontSize: 11, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#162A43" }}>
                    <span>{tr.agentName} → {tr.agentDecision}</span>
                    <span style={{ color: tr.executionStatus === "executed" ? "#2E7D5B" : "#B7791F" }}>{tr.executionStatus}</span>
                  </div>
                  <div style={{ color: "#475569", marginTop: 2 }}>
                    <strong>Input Evidence:</strong> {tr.inputEvidence} | <strong>Reasoning:</strong> {tr.reasoningSummary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact Arena Identity & Evidence Header */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "20px 24px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <span style={{ fontSize: 38 }}>{arena.icon}</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>{arena.companyOrOrg}</span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700 }}>
                    {arena.categoryLabel}
                  </span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569", fontWeight: 700 }}>
                    {commandCenter.cycleStatusSummary}
                  </span>
                </div>
                <h1 style={{ fontSize: 21, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.02em" }}>
                  {arena.title}
                </h1>
                {arena.cycleNotes && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#667085" }}>
                    {arena.cycleNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Honest Evidence Coverage Badge (NO fabricated score) */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 14px" }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>DNA Readiness Stage</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                  {eightPillarProgress.applicationReadiness.status}
                </div>
              </div>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 14px" }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Verified Competencies</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: studentDNA.evidenceCoverage.verifiedCount > 0 ? "#2E7D5B" : "#B7791F" }}>
                  {studentDNA.evidenceCoverage.verifiedCount} / {studentDNA.evidenceCoverage.requiredCount} Verified
                </div>
              </div>
            </div>
          </div>

          {/* Preparation Tier Calibrator */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Execution Tier:</span>
              {(["absolute_beginner", "beginner", "intermediate", "advanced"] as StartingLevel[]).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => handleLevelChange(lvl)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: activeLevel === lvl ? "1.5px solid #162A43" : "1px solid #E4E1DA",
                    background: activeLevel === lvl ? "#162A43" : "#FFFFFF",
                    color: activeLevel === lvl ? "#FFFFFF" : "#667085",
                    textTransform: "capitalize",
                  }}
                >
                  {lvl.replace("_", " ")}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsDiagnosticOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "#356AE6",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Recalibrate Level Diagnostic ➔
            </button>
          </div>
        </div>

        {/* Streamlined 8-Module Navigation */}
        <div style={{ display: "flex", gap: 6, borderBottom: "1px solid #E4E1DA", marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { id: "command_center", label: "⚡ Command Center" },
            { id: "roadmap", label: `🗺️ Learning Graph (${eightPillarProgress.learning.verifiedNodes}/${eightPillarProgress.learning.totalNodes})` },
            { id: "opensource", label: `🌐 Open Source (${githubDiscovery.totalDiscovered})` },
            { id: "projects", label: `🛠️ Ranked Projects (${rankedProjects.length})` },
            { id: "mock_assessment", label: `📝 Autonomous Assessment` },
            { id: "interview", label: `🎙️ Interview Studio (${interviewHistory.length})` },
            { id: "experiences", label: `📚 Real Experiences (${experienceIntelligence.resources.length})` },
            { id: "proposal", label: "📄 Proposal & Application" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ArenaWorkspaceTab)}
              style={{
                padding: "9px 14px",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #356AE6" : "3px solid transparent",
                background: "transparent",
                color: activeTab === tab.id ? "#162A43" : "#667085",
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODULE 1: AUTONOMOUS PREPARATION COMMAND CENTER                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "command_center" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Primary Autonomous Recommendation CTA */}
            <div
              style={{
                background: "linear-gradient(135deg, #162A43 0%, #1E3A5F 100%)",
                borderRadius: 12,
                padding: "22px 26px",
                color: "#FFFFFF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 18,
              }}
            >
              <div style={{ maxWidth: 720 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#93C5FD", letterSpacing: "0.06em" }}>
                  Recommended Next Step • ~{commandCenter.primaryNextAction.estimatedMinutes} Minutes
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 800, margin: "4px 0 6px", color: "#FFFFFF" }}>
                  {commandCenter.primaryNextAction.title}
                </h2>
                <p style={{ fontSize: 12, margin: 0, color: "#E2E8F0", lineHeight: 1.5 }}>
                  <strong>Why:</strong> {commandCenter.primaryNextAction.whyRecommended}{" "}
                  <strong>Done criteria:</strong> {commandCenter.primaryNextAction.description}
                </p>
              </div>
              <Link
                href={commandCenter.primaryNextAction.targetHref}
                style={{
                  padding: "12px 22px",
                  borderRadius: 8,
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {commandCenter.primaryNextAction.actionLabel} ➔
              </Link>
            </div>

            {/* Five Questions Grid: Target, Student DNA, Blockers, Today's Plan, Progress */}
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
              {/* Question 4: What should I do today? */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "20px" }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px", color: "#162A43" }}>
                  Today&apos;s Dynamic Execution Plan
                </h3>
                <p style={{ fontSize: 12, color: "#667085", margin: "0 0 14px" }}>
                  Calibrated directly from your Student DNA gaps, open roadmap prerequisites, and target selection criteria.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {commandCenter.dailyTasks.map(task => (
                    <div
                      key={task.id}
                      style={{
                        border: task.completed ? "1px solid #BBF7D0" : "1px solid #E4E1DA",
                        background: task.completed ? "#F0FDF4" : "#FAFAFA",
                        borderRadius: 8,
                        padding: "14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: task.priority === "HIGH" ? "#FEE2E2" : "#EFF4FE", color: task.priority === "HIGH" ? "#DC2626" : "#356AE6" }}>
                              {task.priority}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>{task.category}</span>
                            <span style={{ fontSize: 10, color: "#64748B" }}>• ~{task.estimatedMinutes}m</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>{task.title}</div>
                          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                            <strong>Why:</strong> {task.reasonForRecommendation}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                            <strong>Completion Criteria:</strong> {task.completionCriteria}
                          </div>
                          <div style={{ fontSize: 11, color: "#2E7D5B", marginTop: 2 }}>
                            <strong>Expected Evidence:</strong> {task.expectedOutcome}
                          </div>
                        </div>
                        <Link
                          href={task.targetHref}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 6,
                            background: "#162A43",
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: 700,
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.actionLabel} ➔
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions 1, 2, 3: Target, Student DNA, Blockers */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Q1: Target Opportunity */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>1. Target &amp; Cycle Status</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#162A43", marginTop: 4 }}>{arena.shortName} ({arena.cycleYear || 2027})</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{commandCenter.cycleStatusSummary}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>
                    <strong>Eligibility:</strong> {arena.eligibility.degreesAllowed.slice(0, 3).join(", ")} • {arena.eligibility.otherRequirements[0]}
                  </div>
                </div>

                {/* Q2: Student Intelligence Summary */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>2. Student DNA Summary</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>
                      Confidence: {studentDNA.confidenceAndFreshness.confidence}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#162A43", marginTop: 8 }}>
                    <strong style={{ color: "#2E7D5B" }}>Verified Skills ({studentDNA.verifiedSkills.length}):</strong>{" "}
                    {studentDNA.verifiedSkills.length > 0 ? studentDNA.verifiedSkills.map(v => v.skill).join(", ") : "None verified yet"}
                  </div>
                  <div style={{ fontSize: 11, color: "#162A43", marginTop: 4 }}>
                    <strong style={{ color: "#356AE6" }}>Demonstrated ({studentDNA.demonstratedSkills.length}):</strong>{" "}
                    {studentDNA.demonstratedSkills.length > 0 ? studentDNA.demonstratedSkills.map(d => d.skill).join(", ") : "None yet"}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                    <strong>Self-Reported / Claimed Only ({studentDNA.inferredOrClaimedSkills.length}):</strong>{" "}
                    {studentDNA.inferredOrClaimedSkills.length > 0 ? studentDNA.inferredOrClaimedSkills.map(c => c.skill).join(", ") : "None"}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                    <strong>GitHub:</strong> {studentDNA.githubConnected ? `Connected (${studentDNA.githubUsername || "Active"})` : "Not linked yet"} •{" "}
                    <strong>Languages:</strong> {studentDNA.programmingLanguages.join(", ") || "Not verified"}
                  </div>
                </div>

                {/* Q3: What is preventing selection? */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#B7791F", textTransform: "uppercase" }}>3. What Is Preventing Selection</div>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                    {commandCenter.whatIsPreventingSelection.map((blocker, idx) => (
                      <li key={idx}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Question 5: Meaningful 8-Pillar Progress Tracking */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px", color: "#162A43" }}>
                5. Preparation Progress Across All 8 Dimensions
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                {[
                  { label: "Learning Graph", value: eightPillarProgress.learning.summary },
                  { label: "Projects", value: eightPillarProgress.projects.summary },
                  { label: "Repo Understanding", value: eightPillarProgress.repositoryUnderstanding.summary },
                  { label: "Open Source PRs", value: eightPillarProgress.contributions.summary },
                  { label: "Assessments", value: eightPillarProgress.assessments.summary },
                  { label: "Technical Interviews", value: eightPillarProgress.interviews.summary },
                  { label: "Proposal / Application", value: eightPillarProgress.proposalDevelopment.summary },
                  { label: "Overall Readiness", value: eightPillarProgress.applicationReadiness.status },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43", marginTop: 4 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODULE 2: DYNAMIC DEPENDENCY-GRAPH LEARNING ROADMAP               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "roadmap" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "18px 22px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#162A43" }}>
                Dependency-Based Personalized Learning Graph
              </h3>
              <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0" }}>
                Mastery distinguishes <strong>Not Started → Learning → Practiced → Demonstrated → Independently Verified</strong>. Opening resources never fakes verification.
              </p>
            </div>

            {dependencyRoadmap.map(node => (
              <div
                key={node.id}
                style={{
                  background: "#FFFFFF",
                  border: node.masteryState === "independently_verified" ? "1.5px solid #2E7D5B" : "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>Stage {node.phaseNumber}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: node.masteryState === "independently_verified" ? "#EAF4EE" : node.masteryState === "demonstrated" ? "#EFF4FE" : "#F1F5F9",
                          color: node.masteryState === "independently_verified" ? "#2E7D5B" : node.masteryState === "demonstrated" ? "#356AE6" : "#475569",
                          textTransform: "uppercase",
                        }}
                      >
                        {node.masteryState.replace(/_/g, " ")}
                      </span>
                      {node.isBlockedByPrerequisites && (
                        <span style={{ fontSize: 10, color: "#B7791F", fontWeight: 700 }}>
                          🔒 Complete Stage {node.phaseNumber - 1} first
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#162A43" }}>{node.title}</h4>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(["learning", "practiced", "demonstrated"] as RoadmapNodeMasteryState[]).map(st => (
                      <button
                        key={st}
                        onClick={() => handleRoadmapNodeUpdate(node.id, st)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 5,
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                          border: node.masteryState === st ? "1.5px solid #356AE6" : "1px solid #E4E1DA",
                          background: node.masteryState === st ? "#EFF4FE" : "#FFFFFF",
                          color: node.masteryState === st ? "#356AE6" : "#64748B",
                          textTransform: "capitalize",
                        }}
                      >
                        Mark {st}
                      </button>
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: 12, color: "#475569", margin: "8px 0 12px", lineHeight: 1.5 }}>{node.learningObjective}</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 11 }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontWeight: 800, color: "#162A43", marginBottom: 4 }}>Recommended Resources</div>
                    {node.recommendedResources.map((r, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>
                        <a href={r.url} target={r.url.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ color: "#356AE6", fontWeight: 700, textDecoration: "none" }}>
                          {r.title} ↗
                        </a>{" "}
                        <span style={{ color: "#64748B" }}>({r.provenanceNote})</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontWeight: 800, color: "#162A43", marginBottom: 4 }}>Verification &amp; Practical Drills</div>
                    <div style={{ color: "#475569", marginBottom: 6 }}>
                      <strong>Criteria:</strong> {node.verificationCriteria}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {node.practicalExercises.map((ex, i) => (
                        <Link
                          key={i}
                          href={ex.targetHref}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 5,
                            background: "#162A43",
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          {ex.label} ➔
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODULE 3: OPEN SOURCE DISCOVERY & 10-STAGE WORKSPACE              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "opensource" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#162A43" }}>
                    Open Source Intelligence &amp; Real Issue Discovery
                  </h3>
                  <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0" }}>
                    Source mode: <strong>{githubDiscovery.sourceMode}</strong> • {githubDiscovery.repositoriesAnalyzed} repositories analyzed •{" "}
                    {githubDiscovery.rateLimitRemaining !== undefined ? `GitHub Rate Remaining: ${githubDiscovery.rateLimitRemaining}` : "Cached / Catalog Aware"}
                  </p>
                  {githubDiscovery.warning && (
                    <p style={{ fontSize: 11, color: "#B7791F", margin: "4px 0 0" }}>
                      ⚠️ {githubDiscovery.warning}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRefreshGitHubDiscovery}
                  disabled={ossRefreshing}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 7,
                    background: "#162A43",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {ossRefreshing ? "Querying GitHub API..." : "↻ Refresh Live GitHub Discovery"}
                </button>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <select value={ossFilterClass} onChange={e => setOssFilterClass(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12 }}>
                  <option value="ALL">All Classifications</option>
                  <option value="Good First Issue">Good First Issue</option>
                  <option value="Bug Fix">Bug Fix</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Feature Development">Feature Development</option>
                  <option value="Testing">Testing</option>
                  <option value="Performance Optimization">Performance Optimization</option>
                  <option value="Developer Tooling">Developer Tooling</option>
                  <option value="Security & Reliability">Security &amp; Reliability</option>
                </select>
                <select value={ossFilterDiff} onChange={e => setOssFilterDiff(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12 }}>
                  <option value="ALL">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <span style={{ fontSize: 12, color: "#64748B", alignSelf: "center" }}>
                  Showing {filteredIssues.length} active opportunities (closed issues excluded)
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 14 }}>
              {filteredIssues.slice(0, 30).map(issue => (
                <div key={issue.id} style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6" }}>{issue.repository} #{issue.issueNumber}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: issue.openStatus === "open" ? "#EAF4EE" : "#F1F5F9", color: issue.openStatus === "open" ? "#2E7D5B" : "#475569", fontWeight: 700 }}>
                          {issue.openStatus === "open" ? "Open (Live Verified)" : "Catalog Target"}
                        </span>
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700 }}>
                          {issue.classification}
                        </span>
                      </div>
                    </div>

                    <h4 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 6px", color: "#162A43" }}>{issue.title}</h4>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>
                      Difficulty: <strong>{issue.difficulty}</strong> • Effort: <strong>{issue.estimatedEffort}</strong> • Repo Health: <strong>{issue.repoHealth.activityStatus}</strong>
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#334155" }}>
                      <strong>Compatibility Rationale:</strong> {issue.compatibility.explainableReasons.join(" ")}
                      {issue.compatibility.missingPrerequisites.length > 0 && (
                        <div style={{ color: "#B7791F", marginTop: 4 }}>
                          <strong>Missing Prerequisites:</strong> {issue.compatibility.missingPrerequisites.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                    <a href={issue.issueUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textDecoration: "none" }}>
                      View Issue on GitHub ↗
                    </a>
                    <button
                      onClick={() => openContributionWorkspace(issue)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        background: "#162A43",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Open 10-Stage Workspace ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODULE 4: RANKED PROJECT INTELLIGENCE                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {rankedProjects.map(proj => (
              <div key={proj.id} style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6" }}>{proj.category}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569" }}>{proj.difficulty}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B" }}>~{proj.estimatedDays} Days</span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43" }}>{proj.title}</h3>
                  </div>

                  <button
                    onClick={() => handleActivateProject(proj.id)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 6,
                      background: "#162A43",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Track Active Project
                  </button>
                </div>

                <p style={{ fontSize: 13, color: "#475569", margin: "0 0 10px", lineHeight: 1.5 }}>{proj.problemStatement}</p>
                <div style={{ fontSize: 11, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, padding: "8px 12px", color: "#166534", marginBottom: 14 }}>
                  <strong>Why it matches your Student DNA:</strong> {proj.matchReason}{" "}
                  {proj.missingPrerequisites.length > 0 && `| Skills to learn while building: ${proj.missingPrerequisites.join(", ")}.`}
                </div>

                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>Architecture &amp; Components</div>
                <div style={{ border: "1px solid #E4E1DA", borderRadius: 6, overflow: "hidden", marginBottom: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", textAlign: "left", color: "#475569" }}>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #E4E1DA" }}>Component</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #E4E1DA" }}>Technology</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #E4E1DA" }}>Responsibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proj.systemComponents.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < proj.systemComponents.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: "#162A43" }}>{row.component}</td>
                          <td style={{ padding: "8px 12px", color: "#356AE6" }}>{row.technology}</td>
                          <td style={{ padding: "8px 12px", color: "#475569" }}>{row.responsibility}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ fontSize: 11, color: "#475569" }}>
                  <strong>Testing Strategy:</strong> {proj.testingStrategy} • <strong>OSS Relevance:</strong> {proj.openSourceRelevance}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODULE 5: AUTONOMOUS PERSONALIZED ASSESSMENT ENGINE               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "mock_assessment" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#162A43" }}>
                  Autonomous Personalized Assessment Engine
                </h3>
                <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0" }}>
                  No topic or difficulty selectors required. Cognalyze dynamically targets your missing DNA competencies.
                </p>
              </div>
              <button
                onClick={handleStartAutonomousAssessment}
                disabled={isGeneratingAssessment}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {isGeneratingAssessment ? "Synthesizing Assessment..." : "START MY PERSONALIZED ASSESSMENT"}
              </button>
            </div>

            {autonomousSession && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#162A43" }}>{autonomousSession.assessmentTitle}</h4>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      Targeted Gaps: {autonomousSession.targetedSkillGaps.join(", ")} • {autonomousSession.durationMinutes} mins • Generator: {autonomousSession.generatedBy || "adaptive"}
                    </div>
                  </div>
                  <Link href={autonomousSession.routedExistingArenaHref} style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textDecoration: "none" }}>
                    Open Full Coding Sandbox ➔
                  </Link>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {autonomousSession.questions.map((q, idx) => (
                    <div key={q.id} style={{ border: "1px solid #E4E1DA", borderRadius: 8, padding: "16px", background: "#FAFAFA" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>Q{idx + 1}. {q.question}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", whiteSpace: "nowrap", marginLeft: 8 }}>{q.marks} pts</span>
                      </div>

                      {q.options ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {q.options.map(opt => (
                            <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, background: assessmentAnswers[q.id] === opt ? "#EFF4FE" : "#FFFFFF", border: assessmentAnswers[q.id] === opt ? "1px solid #356AE6" : "1px solid #E4E1DA", fontSize: 12, cursor: "pointer" }}>
                              <input type="radio" name={q.id} checked={assessmentAnswers[q.id] === opt} onChange={() => setAssessmentAnswers(prev => ({ ...prev, [q.id]: opt }))} />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          rows={4}
                          value={assessmentAnswers[q.id] || ""}
                          onChange={e => setAssessmentAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Write your technical reasoning, edge cases, or verification code..."
                          style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #E4E1DA", fontFamily: "monospace", fontSize: 12 }}
                        />
                      )}
                    </div>
                  ))}
                  <div style={{ textAlign: "right" }}>
                    <button
                      onClick={handleEvaluateAutonomousAssessment}
                      disabled={isSubmittingAssessment}
                      style={{ padding: "11px 26px", borderRadius: 8, background: "#162A43", color: "#FFFFFF", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer" }}
                    >
                      {isSubmittingAssessment ? "Evaluating & Syncing Student DNA..." : "Submit & Generate Diagnostic Report ➔"}
                    </button>
                  </div>
                </div>

                {assessmentResult && (
                  <div style={{ marginTop: 20, padding: "18px", borderRadius: 10, background: assessmentResult.passed ? "#EAF4EE" : "#FEF7ED", border: `1px solid ${assessmentResult.passed ? "#BBF7D0" : "#FCD34D"}` }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: assessmentResult.passed ? "#2E7D5B" : "#B7791F" }}>
                      {assessmentResult.verdict.replace(/_/g, " ")} — {assessmentResult.totalScore} / {assessmentResult.maxScore} ({assessmentResult.percentage}%)
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                      {assessmentResult.conceptBreakdown.map((cb, idx) => (
                        <div key={idx} style={{ fontSize: 11, background: "#FFFFFF", padding: "8px 10px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                          <strong>{cb.status}:</strong> {cb.concept} ({cb.score}/{cb.maxScore}) — {cb.explanation}
                        </div>
                      ))}
                    </div>
                    {assessmentResult.weakAreaRemediationLinks.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {assessmentResult.weakAreaRemediationLinks.map((rem, idx) => (
                          <Link key={idx} href={rem.targetHref} style={{ padding: "6px 12px", borderRadius: 6, background: "#162A43", color: "#FFFFFF", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                            {rem.actionLabel} ➔
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Persisted Assessment History */}
            {assessmentHistory.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "18px" }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 10px", color: "#162A43" }}>Persisted Assessment History ({assessmentHistory.length})</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {assessmentHistory.map(att => (
                    <div key={att.sessionId} style={{ fontSize: 12, padding: "10px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <span><strong>{att.verdict?.replace(/_/g, " ")}</strong> ({att.percentage}%) • Gaps: {att.targetedWeakConcepts.join(", ")}</span>
                      <span style={{ color: "#64748B", fontSize: 11 }}>{new Date(att.completedAt || att.startedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODULE 6: AUTONOMOUS CONVERSATIONAL TECHNICAL INTERVIEW STUDIO    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "interview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#162A43" }}>
                    Autonomous Conversational Technical Interview Studio
                  </h3>
                  <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0" }}>
                    Adaptive follow-up interviewer calibrated to your Student DNA, target organization ({arena.companyOrOrg}), and contributions.
                  </p>
                </div>
                <Link href={interviewTrackConfig.directHref} style={{ padding: "8px 14px", borderRadius: 6, background: "#F6F5F1", border: "1px solid #E4E1DA", color: "#162A43", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                  Open Full Video Interview Arena ↗
                </Link>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
                <select value={interviewMode} onChange={e => setInterviewMode(e.target.value as InterviewModeType)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12 }}>
                  <option value="technical_interview">Technical Systems Interview</option>
                  <option value="open_source_contribution">Open-Source Contribution Walkthrough</option>
                  <option value="project_deep_dive">Project Architecture Deep Dive</option>
                  <option value="debugging_interview">Production Debugging Interview</option>
                  <option value="architecture_discussion">Scalability &amp; Reliability Design</option>
                  <option value="behavioral_lp">Behavioral &amp; Ownership</option>
                </select>

                <button
                  onClick={handleStartInterview}
                  disabled={interviewLoading}
                  style={{ padding: "8px 18px", borderRadius: 7, background: "#356AE6", color: "#FFFFFF", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  {interviewLoading ? "Initializing..." : "Start Conversational Interview ➔"}
                </button>
              </div>
            </div>

            {activeInterview && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "22px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 12 }}>
                  Context: {activeInterview.targetContextSummary} • Status: {activeInterview.status.toUpperCase()}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                  {activeInterview.turns.map(t => (
                    <div key={t.turnNumber} style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px", background: "#F8FAFC" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6" }}>Turn {t.turnNumber} • Focus: {t.focusCompetency}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43", marginTop: 4 }}>{t.interviewerQuestion}</div>
                      {t.studentResponse && (
                        <div style={{ marginTop: 8, padding: "8px 10px", background: "#FFFFFF", borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12, color: "#334155" }}>
                          <strong>Your Response:</strong> {t.studentResponse}
                        </div>
                      )}
                      {t.evaluation && (
                        <div style={{ marginTop: 8, fontSize: 11, color: "#475569" }}>
                          <strong>Scores:</strong> Correctness {t.evaluation.technicalCorrectness}/10 • Reasoning {t.evaluation.reasoningQuality}/10 • Clarity {t.evaluation.communicationClarity}/10 • Depth {t.evaluation.depth}/10
                          <div style={{ marginTop: 2 }}>{t.evaluation.coachingFeedback}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {activeInterview.status === "active" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <textarea
                      rows={4}
                      value={interviewInput}
                      onChange={e => setInterviewInput(e.target.value)}
                      placeholder="Explain your reasoning, edge cases, complexity, and architecture trade-offs..."
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #E4E1DA", fontSize: 12 }}
                    />
                    <div style={{ textAlign: "right" }}>
                      <button
                        onClick={handleSubmitInterviewTurn}
                        disabled={interviewLoading || !interviewInput.trim()}
                        style={{ padding: "9px 20px", borderRadius: 7, background: "#162A43", color: "#FFFFFF", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}
                      >
                        {interviewLoading ? "Evaluating & Generating Follow-up..." : "Submit Response ➔"}
                      </button>
                    </div>
                  </div>
                )}

                {activeInterview.finalReport && (
                  <div style={{ marginTop: 14, padding: "16px", borderRadius: 10, background: "#EAF4EE", border: "1px solid #BBF7D0" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                      Interview Report Verdict: {activeInterview.finalReport.overallVerdict}
                    </div>
                    <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>
                      <strong>Strengths:</strong> {activeInterview.finalReport.keyStrengths.join(" | ")}
                    </div>
                    <div style={{ fontSize: 12, color: "#B7791F", marginTop: 4 }}>
                      <strong>Improvement Priorities:</strong> {activeInterview.finalReport.criticalGaps.join(" | ")}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODULE 7: REAL-WORLD EXPERIENCE, VIDEO & JOURNEY INTELLIGENCE     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "experiences" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Playbook Adaptation & Source Coverage */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#162A43" }}>
                    Research-Driven Experience &amp; Video Intelligence
                  </h3>
                  <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 0" }}>
                    {experienceIntelligence.personalizedPlaybook.adaptationReason}
                  </p>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
                  <strong>Source Coverage:</strong> {experienceIntelligence.sourceCoverageReport.totalResources} Verified Sources •{" "}
                  {experienceIntelligence.sourceCoverageReport.verifiedAccessibleCount} URL-Checked •{" "}
                  {experienceIntelligence.sourceCoverageReport.transcriptAnalyzedVideosCount} Transcript-Analyzed Videos
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <select value={expStageFilter} onChange={e => setExpStageFilter(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12 }}>
                  <option value="ALL">All Preparation Stages</option>
                  <option value="Organization & Problem Selection">Organization &amp; Problem Selection</option>
                  <option value="Codebase Exploration & First PR">Codebase Exploration &amp; First PR</option>
                  <option value="Online Assessment & DSA">Online Assessment &amp; DSA</option>
                  <option value="System Architecture & Prototype">System Architecture &amp; Prototype</option>
                  <option value="Proposal & Application">Proposal &amp; Application</option>
                  <option value="Technical Interview">Technical Interview</option>
                </select>
                <select value={expFormatFilter} onChange={e => setExpFormatFilter(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12 }}>
                  <option value="ALL">All Formats</option>
                  <option value="official_documentation">Official Documentation</option>
                  <option value="article_blog">Articles &amp; Engineering Blogs</option>
                  <option value="youtube_video">Videos &amp; Walkthroughs</option>
                  <option value="github_repo_guide">Repository Guides</option>
                </select>
              </div>
            </div>

            {/* Resources List with Trust Provenance & Timestamp Video Inspection */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {filteredExperiences.map(res => (
                <div key={res.id} style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#EAF4EE", color: "#2E7D5B" }}>
                        {res.trustClassification}
                      </span>
                      <span style={{ fontSize: 10, color: "#64748B", fontWeight: 700 }}>
                        {res.programYear} • {res.preparationStage}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 4px", color: "#162A43" }}>{res.title}</h4>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>Author/Source: {res.authorOrSpeaker}</div>

                    <div style={{ fontSize: 11, background: "#EFF4FE", padding: "6px 10px", borderRadius: 6, color: "#1E40AF", marginBottom: 8 }}>
                      <strong>Why recommended for you:</strong> {res.whyRecommendedForStudent}
                    </div>

                    <ul style={{ margin: "0 0 8px", paddingLeft: 16, fontSize: 11, color: "#334155", lineHeight: 1.45 }}>
                      {res.keyTakeaways.map((kt, idx) => <li key={idx}>{kt}</li>)}
                    </ul>

                    {res.resourceType === "youtube_video" && (
                      <div style={{ fontSize: 11, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 10px", marginBottom: 8 }}>
                        <div>
                          <strong>Transcript Analysis:</strong>{" "}
                          {res.transcriptStatus === "verified_captions"
                            ? "Verified Captions Extracted"
                            : res.transcriptStatus === "unavailable"
                            ? "Transcript unavailable (captions not exposed; not fabricated)"
                            : "Not analyzed yet — click Verify Captions"}
                        </div>
                        {res.videoTimestamps && res.videoTimestamps.length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                            {res.videoTimestamps.map((ts, tIdx) => (
                              <a key={tIdx} href={ts.watchAtTimestampUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#162A43", color: "#FFFFFF", textDecoration: "none" }}>
                                ▶ {ts.formattedTime} {ts.topic.slice(0, 24)}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #F1F5F9", flexWrap: "wrap", gap: 8 }}>
                    <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textDecoration: "none" }}>
                      Open Original Source ↗
                    </a>
                    <div style={{ display: "flex", gap: 8 }}>
                      {res.resourceType === "youtube_video" && (
                        <button
                          onClick={() => handleInspectVideo(res.url)}
                          disabled={inspectingVideoUrl === res.url}
                          style={{ padding: "5px 10px", borderRadius: 5, background: "#F6F5F1", border: "1px solid #E4E1DA", color: "#162A43", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                        >
                          {inspectingVideoUrl === res.url ? "Inspecting..." : "Verify Video Captions"}
                        </button>
                      )}
                      {res.recommendedPracticeArenaHref && (
                        <Link href={res.recommendedPracticeArenaHref} style={{ padding: "5px 10px", borderRadius: 5, background: "#162A43", color: "#FFFFFF", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
                          {res.recommendedPracticeArenaLabel || "Practice Skill"} ➔
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reconstructed Journeys */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "20px" }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px", color: "#162A43" }}>Reconstructed Program Pathways &amp; Lessons</h4>
              {experienceIntelligence.reconstructedJourneys.map(j => (
                <div key={j.id} style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px", background: "#F8FAFC", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>{j.candidateLabel}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                    <strong>Starting Level:</strong> {j.startingSkillLevel} • <strong>Duration:</strong> {j.preparationDuration} • <strong>Outcome:</strong> {j.outcome}
                  </div>
                  <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
                    <strong>Key Lessons:</strong> {j.lessonsLearned.join(" | ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODULE 8: PROPOSAL & APPLICATION INTELLIGENCE                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "proposal" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "#162A43" }}>
                Organization-Aware Proposal Studio ({proposalGuidance.organizationName})
              </h3>
              <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 10px" }}>
                {proposalGuidance.officialRequirementsNote}
              </p>

              <textarea
                rows={18}
                value={proposalText}
                onChange={e => setProposalText(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #E4E1DA", fontSize: 12, fontFamily: "monospace", lineHeight: 1.5 }}
              />

              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#667085" }}>
                  {proposalText.trim().split(/\s+/).filter(Boolean).length} words • Verified Contribution PRs Linked: {proposalGuidance.verifiedContributionEvidenceCount}
                </span>
                <button
                  onClick={handleEvaluateProposal}
                  disabled={isEvaluatingProposal || proposalText.trim().length < 20}
                  style={{ padding: "8px 18px", borderRadius: 7, background: "#162A43", color: "#FFFFFF", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  {isEvaluatingProposal ? "Auditing Proposal..." : "Run AI Rubric Review ➔"}
                </button>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#162A43" }}>Rubric Feedback</h3>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "#FEF7ED", color: "#B7791F" }}>
                  AI Recommendation Only — Not Official Mentor Feedback
                </span>
              </div>

              {proposalResult ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 8, background: proposalResult.verdict === "STRONG_SUBMISSION" ? "#EAF4EE" : "#FEF7ED", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Audit Verdict</div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{proposalResult.verdict.replace(/_/g, " ")}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{proposalResult.overallScore}/100</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    {proposalResult.rubricScores.map((r, i) => (
                      <div key={i} style={{ border: "1px solid #E4E1DA", borderRadius: 7, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                          <span>{r.criterion}</span>
                          <span style={{ color: "#356AE6" }}>{r.score}/{r.maxScore}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{r.feedback}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, background: "#F8FAFC", padding: "12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <strong>Actionable Advice:</strong> {proposalResult.actionableFeedback}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#667085", fontSize: 12 }}>
                  Draft your proposal on the left and click &apos;Run AI Rubric Review&apos; for feasibility and milestone checks.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 10-STAGE CONTRIBUTION WORKSPACE & PR VERIFIER MODAL */}
        {activeIssue && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 110, padding: 20 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 14, maxWidth: 740, width: "100%", maxHeight: "88vh", overflowY: "auto", padding: "24px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6" }}>10-STAGE CONTRIBUTION WORKSPACE • {activeIssue.repository}</span>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: "2px 0", color: "#162A43" }}>#{activeIssue.issueNumber} {activeIssue.title}</h3>
                </div>
                <button onClick={() => setActiveIssue(null)} style={{ background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}>✕</button>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px", marginBottom: 14, fontSize: 12 }}>
                <div><strong>Test Suite:</strong> <code>{activeIssue.testRequirements}</code></div>
                <div style={{ marginTop: 4 }}><strong>Suggested First Steps:</strong> {activeIssue.suggestedFirstSteps.join(" → ")}</div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 8 }}>Interactive 10-Stage Execution Plan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {activeIssue.contributionWorkspacePlan.map(stage => {
                  const checked = workspaceSteps.includes(stage.stageNumber);
                  return (
                    <label key={stage.stageNumber} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 6, background: checked ? "#F0FDF4" : "#FAFAFA", border: `1px solid ${checked ? "#BBF7D0" : "#E4E1DA"}`, fontSize: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setWorkspaceSteps(prev =>
                            prev.includes(stage.stageNumber) ? prev.filter(x => x !== stage.stageNumber) : [...prev, stage.stageNumber]
                          )
                        }
                      />
                      <div>
                        <strong style={{ color: "#162A43" }}>{stage.stageNumber}. {stage.stageTitle}</strong>
                        <div style={{ fontSize: 11, color: "#475569" }}>{stage.guidance}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* GitHub PR Verification Input */}
              <div style={{ background: "#EFF4FE", border: "1px solid #BFDBFE", borderRadius: 8, padding: "12px", marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#1E40AF", marginBottom: 4 }}>
                  Verify Submitted Pull Request URL (Checked directly via GitHub REST API)
                </label>
                <input
                  type="url"
                  value={workspacePrUrl}
                  onChange={e => setWorkspacePrUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/pull/123"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12 }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 4 }}>Investigation &amp; Architecture Notes</label>
                <textarea rows={3} value={workspaceNotes} onChange={e => setWorkspaceNotes(e.target.value)} placeholder="Record root cause trace, test output, or maintainer feedback..." style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12 }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setActiveIssue(null)} style={{ padding: "8px 16px", borderRadius: 6, background: "#F6F5F1", border: "1px solid #E4E1DA", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Close
                </button>
                <button
                  onClick={handleSaveWorkspaceOrVerifyPR}
                  disabled={verifyingPr}
                  style={{ padding: "8px 18px", borderRadius: 6, background: "#162A43", color: "#FFFFFF", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {verifyingPr ? "Saving & Checking GitHub..." : workspacePrUrl.trim() ? "Save & Verify PR on GitHub" : "Save Workspace Progress"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Level Calibration Modal */}
        {isDiagnosticOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: 20 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 12, maxWidth: 540, width: "100%", padding: "24px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "#162A43" }}>Starting Level Diagnostic</h3>
              <p style={{ fontSize: 12, color: "#667085", margin: "0 0 16px" }}>Select the option reflecting your current preparation tier.</p>

              {arena.diagnosticQuestions.map(q => (
                <div key={q.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43", marginBottom: 8 }}>{q.question}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map(opt => (
                      <label key={opt.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "8px 12px", borderRadius: 6, border: selectedDiagnosticAnswers[q.id] === opt.recommendedLevel ? "1.5px solid #356AE6" : "1px solid #E4E1DA", cursor: "pointer" }}>
                        <input type="radio" name={q.id} checked={selectedDiagnosticAnswers[q.id] === opt.recommendedLevel} onChange={() => setSelectedDiagnosticAnswers(prev => ({ ...prev, [q.id]: opt.recommendedLevel }))} />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsDiagnosticOpen(false)} style={{ padding: "8px 16px", borderRadius: 6, background: "#F6F5F1", border: "1px solid #E4E1DA", color: "#667085", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const vals = Object.values(selectedDiagnosticAnswers);
                    if (vals.length > 0) handleLevelChange(vals[0]);
                    setIsDiagnosticOpen(false);
                  }}
                  style={{ padding: "8px 18px", borderRadius: 6, background: "#356AE6", color: "#FFFFFF", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Apply Calibration
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
