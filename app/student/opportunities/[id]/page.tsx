"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSafeOpportunityUrl,
  formatOpportunitySchedule,
  getOpportunityPortalInfo,
  getQualitativeFitLabel,
  getFitLabelStyle,
  getVerificationBadge,
  computeOpportunityRequirements,
  computeFitEvidence,
  type QualitativeFitLabel,
  type OpportunityRequirements,
  type FitEvidence,
  type ProvenanceClaim,
  type EvidenceLabel
} from "@/lib/ai/placement-intelligence";

interface ProjectCard {
  id: string;
  title: string;
  tagline: string;
  problem_statement: string;
  target_user?: string;
  observed_pain?: string;
  existing_gap?: string;
  why_it_fits_you?: {
    aligned_skills: string[];
    required_capabilities: string[];
    explanation: string;
  };
  architecture: string;
  tech_stack: string[];
  winning_moat: string;
  mvp_timeline: Array<{ hours: string; task: string }>;
  demo_wow_factor: string;
  potential_judge_question: string;
}

interface AgentCritique {
  agent_id: string;
  agent_name: string;
  agent_role: string;
  agent_avatar: string;
  verdict: string;
  fact?: string;
  inference?: string;
  concern?: string;
  recommendation?: string;
  critique?: string;
  tactical_advice?: string;
  score?: number;
}

interface CouncilEvaluation {
  overall_verdict: "🔥 HIGH CONVICTION (BUILD IMMEDIATELY)" | "⚠️ VIABLE WITH CRITICAL PIVOTS" | "❌ UNVIABLE (PIVOT TO ALTERNATIVE)" | any;
  consensus_score?: number;
  executive_summary: string;
  consensus?: {
    strongest_evidence?: string;
    major_concern?: string;
    technical_risk?: string;
    research_gap?: string;
    differentiation_concern?: string;
    recommended_change?: string;
  };
  validated_problem?: string;
  unfair_moat: string;
  fatal_pitfalls: string[];
  tactical_sprint_plan: Array<{ phase: string; hours: string; deliverable: string }>;
  agents: AgentCritique[];
}

function downloadBlueprintPDF(proj: ProjectCard, opportunityTitle: string, council?: CouncilEvaluation | null) {
  const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>${proj.title} — Blueprint</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', -apple-system, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
  h1 { font-size: 22px; color: #1e1b4b; margin-bottom: 4px; }
  h2 { font-size: 16px; color: #4338ca; margin: 20px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
  h3 { font-size: 13px; color: #6366f1; margin: 12px 0 4px; }
  p, li { font-size: 13px; color: #334155; }
  .tagline { font-size: 14px; color: #6366f1; font-style: italic; margin-bottom: 12px; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 20px; }
  .section { margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  .tech-tag { display: inline-block; font-size: 11px; padding: 2px 8px; background: #eef2ff; color: #4338ca; border-radius: 4px; margin: 2px; font-weight: 600; }
  .timeline-row { display: flex; gap: 12px; margin: 4px 0; }
  .timeline-hours { font-weight: 700; color: #d97706; min-width: 60px; font-size: 12px; }
  .timeline-task { font-size: 12px; }
  .council-agent { padding: 10px; margin: 8px 0; background: #fafafa; border-radius: 8px; border: 1px solid #e2e8f0; }
  .agent-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .agent-name { font-weight: 700; font-size: 12px; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<h1>${proj.title}</h1>
<div class="tagline">${proj.tagline}</div>
<div class="meta">Generated for: ${opportunityTitle} • ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

<h2>Authentic Real-World Problem</h2>
<div class="section"><p>${proj.problem_statement}</p></div>

${proj.target_user ? `<h2>Target User & Observed Friction</h2><div class="section"><p><strong>Target User:</strong> ${proj.target_user}</p><p><strong>Observed Friction:</strong> ${proj.observed_pain || 'N/A'}</p></div>` : ''}

<h2>Winning Moat & Differentiation</h2>
<div class="section"><p>${proj.winning_moat}</p></div>

<h2>System Architecture</h2>
<div class="section"><p>${proj.architecture}</p></div>

<h2>Tech Stack</h2>
<div class="section">${(proj.tech_stack || []).map(t => '<span class="tech-tag">' + t + '</span>').join(' ')}</div>

<h2>36-Hour MVP Timeline</h2>
<div class="section">
${(proj.mvp_timeline || []).map(s => '<div class="timeline-row"><span class="timeline-hours">' + s.hours + '</span><span class="timeline-task">' + s.task + '</span></div>').join('')}
</div>

<h2>Live Demo WOW Factor</h2>
<div class="section"><p>${proj.demo_wow_factor}</p></div>

<h2>Judge Defense Question</h2>
<div class="section"><p>${proj.potential_judge_question}</p></div>

${council ? `<h2>6-Agent Council Review</h2><div class="section"><p><strong>Verdict:</strong> ${council.overall_verdict}</p><p><strong>Summary:</strong> ${council.executive_summary}</p><h3>Critical Unfair Moat</h3><p>${council.unfair_moat}</p><h3>Fatal Pitfalls</h3><ul>${(council.fatal_pitfalls || []).map(p => '<li>' + p + '</li>').join('')}</ul><h3>Agent Breakdowns</h3>${(council.agents || []).map(a => `<div class="council-agent"><div class="agent-header"><span class="agent-name">${a.agent_avatar} ${a.agent_name} (${a.agent_role})</span><span>${a.verdict}</span></div>${a.fact ? `<p><strong>FACT:</strong> ${a.fact}</p>` : ''}${a.concern ? `<p><strong>CONCERN:</strong> ${a.concern}</p>` : ''}${a.recommendation ? `<p><strong>RECOMMENDATION:</strong> ${a.recommendation}</p>` : ''}</div>`).join('')}</div>` : ''}

<div class="footer">Generated by Cognalyze — Placement Intelligence & Evidence Platform</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

export default function OpportunityDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const opportunityId = resolvedParams.id;

  const [opportunity, setOpportunity] = useState<any>(null);
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stageProgress, setStageProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Council Evaluation State
  const [councilEvaluating, setCouncilEvaluating] = useState(false);
  const [councilProgress, setCouncilProgress] = useState("");
  const [activeCouncilResult, setActiveCouncilResult] = useState<CouncilEvaluation | null>(null);
  const [evaluatedProjectTitle, setEvaluatedProjectTitle] = useState("");
  const [showCouncilModal, setShowCouncilModal] = useState(false);

  // Evidence Provenance Modal State
  const [showWhyMatchModal, setShowWhyMatchModal] = useState(false);

  // Application Pipeline State
  const [applicationStage, setApplicationStage] = useState<"Bookmarked" | "Applied" | "Interviewing" | "Offer" | "Rejected" | null>(null);

  // Student DNA & Team Formation State
  const [studentDNA, setStudentDNA] = useState<any>(null);
  const [teammateMatches, setTeammateMatches] = useState<any[]>([]);
  const [selectedTeammates, setSelectedTeammates] = useState<string[]>([]);
  const [teamSimulation, setTeamSimulation] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamInviteSent, setTeamInviteSent] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    loadOpportunity(stored);
    loadApplicationStatus(stored);
    loadStudentDNA(stored);
  }, [opportunityId]);

  const loadStudentDNA = async (cId: string) => {
    try {
      const res = await fetch(`/api/student/dna?candidateId=${cId}`);
      const data = await res.json();
      if (data.dna) {
        setStudentDNA(data.dna);
      }
    } catch (err) {
      console.error("Student DNA fetch error:", err);
    }
  };

  const loadTeamMatches = async (cId: string) => {
    setLoadingTeam(true);
    try {
      const matchRes = await fetch("/api/teams/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: cId,
          psId: "ps-flipkart-concurrency-locking"
        })
      });
      const matchData = await matchRes.json();
      if (matchData.teammate_matches) {
        setTeammateMatches(matchData.teammate_matches);
      }

      await runTeamSimulation(cId, []);
    } catch (err) {
      console.error("Team match error:", err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const runTeamSimulation = async (cId: string, teammates: string[]) => {
    try {
      const simRes = await fetch("/api/teams/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psId: "ps-flipkart-concurrency-locking",
          memberIds: [cId, ...teammates]
        })
      });
      const simData = await simRes.json();
      if (simData.simulation) {
        setTeamSimulation(simData.simulation);
      }
    } catch (err) {
      console.error("Team simulation error:", err);
    }
  };

  const toggleTeammate = async (teammateId: string) => {
    let next: string[];
    if (selectedTeammates.includes(teammateId)) {
      next = selectedTeammates.filter(id => id !== teammateId);
    } else {
      next = [...selectedTeammates, teammateId];
    }
    setSelectedTeammates(next);
    await runTeamSimulation(candidateId, next);
  };

  const handleSendTeamInvite = async (teammateId: string, teammateName: string) => {
    setTeamInviteSent(prev => ({ ...prev, [teammateId]: true }));
    try {
      await fetch("/api/student/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: teammateId,
          sourceFeature: "team_formation",
          notificationType: "team_invite",
          title: "Team Syndicate Invitation",
          body: `You have been invited by ${candidateId} to form a syndicate for ${opportunity?.title || 'Hackathon'}.`,
          linkUrl: `/student/opportunities/${opportunityId}`
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadApplicationStatus = async (cId: string) => {
    try {
      const res = await fetch(`/api/applications?candidateId=${cId}`);
      const data = await res.json();
      if (data.applications && Array.isArray(data.applications)) {
        const found = data.applications.find((a: any) => a.opportunity_id === opportunityId);
        if (found) {
          setApplicationStage(found.stage);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBookmark = async () => {
    if (applicationStage === "Bookmarked") {
      setApplicationStage(null);
      try {
        await fetch(`/api/applications?candidateId=${candidateId}&opportunityId=${opportunityId}`, {
          method: "DELETE"
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setApplicationStage("Bookmarked");
      try {
        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId, opportunityId, stage: "Bookmarked" })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkApplied = async () => {
    setApplicationStage("Applied");
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, opportunityId, stage: "Applied" })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadOpportunity = async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/opportunities/ingest");
      const data = await res.json();
      const match = (data.opportunities || []).find((o: any) => o.id === opportunityId);
      if (match) {
        setOpportunity(match);
      }

      // Fetch existing suggestions if cached
      const sugRes = await fetch(`/api/suggest-projects/${opportunityId}?candidateId=${cId}`);
      const sugData = await sugRes.json();
      if (sugData.suggestions?.projects && sugData.suggestions.projects.length > 0) {
        setProjects(sugData.suggestions.projects);
        loadTeamMatches(cId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProjects = async () => {
    setGenerating(true);
    setError(null);
    setStageProgress("Stage 1: Official Context & Themes Extraction...");

    try {
      setTimeout(() => setStageProgress("Stage 2: Architecting authentic real-world problem blueprints..."), 3500);
      setTimeout(() => setStageProgress("Stage 3: Research validation & Student DNA grounding..."), 7500);

      const res = await fetch(`/api/suggest-projects/${opportunityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate problem directions");

      if (data.projects) {
        setProjects(data.projects);
        loadTeamMatches(candidateId);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong generating suggestions");
    } finally {
      setGenerating(false);
      setStageProgress("");
    }
  };

  const runCouncilEvaluation = async (
    problemStatement: string,
    projectTitle: string,
    techStack: string[] | string
  ) => {
    setCouncilEvaluating(true);
    setCouncilProgress("Assembling 6 AI Review Agents...");
    setShowCouncilModal(true);
    setEvaluatedProjectTitle(projectTitle);
    setActiveCouncilResult(null);

    try {
      setTimeout(() => setCouncilProgress("Agent 1 (Problem Researcher) auditing authentic problem depth..."), 2000);
      setTimeout(() => setCouncilProgress("Agent 2 (User Advocate) testing target user friction & presentation appeal..."), 4500);
      setTimeout(() => setCouncilProgress("Agent 3 (Technical Architect) testing 36h feasibility, latency & scale..."), 7000);
      setTimeout(() => setCouncilProgress("Agent 4 (Innovation Analyst) analyzing existing tools & market gap..."), 9500);
      setTimeout(() => setCouncilProgress("Agent 5 (Impact & Viability Analyst) evaluating operational feasibility..."), 12000);
      setTimeout(() => setCouncilProgress("Agent 6 (Hackathon Judge) scoring official rubric alignment & podium moat..."), 14500);

      const res = await fetch("/api/opportunities/council-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunity_title: opportunity?.title || "Target Opportunity",
          opportunity_type: opportunity?.type || "hackathon",
          project_title: projectTitle,
          problem_statement: problemStatement,
          tech_stack: Array.isArray(techStack) ? techStack : techStack.split(",").map(s => s.trim())
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Council evaluation failed");

      if (data.evaluation) {
        setActiveCouncilResult(data.evaluation);
      }
    } catch (err: any) {
      console.error(err);
      setCouncilProgress(`Evaluation failed: ${err.message || "Unknown error"}`);
    } finally {
      setCouncilEvaluating(false);
    }
  };

  const safeUrl = opportunity
    ? getSafeOpportunityUrl(opportunity.source_url, opportunity.organizer, opportunity.title)
    : "https://unstop.com/hackathons";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#06030f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "rgba(255,255,255,0.7)" }}>
        <span style={{ fontSize: 28, animation: "pulse 1.5s infinite" }}>🔍</span>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Scanning Opportunity Intelligence...</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Grounding requirements in verified sources & Student DNA.</div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div style={{ minHeight: "100vh", background: "#06030f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "rgba(255,255,255,0.8)", padding: 24, textAlign: "center" }}>
        <span style={{ fontSize: 40 }}>⚠️</span>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Opportunity Unavailable</h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", maxWidth: 460, margin: 0 }}>
          This opportunity may have expired, been archived, or official confirmation is pending.
        </p>
        <Link href="/student/opportunities" style={{ marginTop: 8, padding: "8px 16px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#c7d2fe", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
          ← Back to Opportunity Intelligence
        </Link>
      </div>
    );
  }

  const portal = opportunity
    ? getOpportunityPortalInfo(opportunity.source_url, opportunity.organizer, opportunity.title)
    : { name: "Verified Portal", badgeBg: "rgba(99,102,241,0.2)", badgeColor: "#818cf8", isVerified: true };

  const verBadge = opportunity ? getVerificationBadge(opportunity) : null;
  const oppReqs: OpportunityRequirements = opportunity ? computeOpportunityRequirements(opportunity) : ({} as any);
  const fitEvidence = opportunity && studentDNA ? computeFitEvidence({
    candidate_id: candidateId,
    skills: (studentDNA?.skills || []).map((s: any) => ({ name: s.name, level: s.level, evidence: s.evidence })),
    target_roles: studentDNA?.target_roles || [],
    target_companies_or_events: [],
    availability: studentDNA?.availability || "15-20 hrs/week",
    risk_appetite: "Moderate",
    profile_summary: studentDNA?.profile_summary || ""
  } as any, opportunity) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#06030f", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Top Navbar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,3,15,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/student/opportunities" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            ← Opportunities
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 700, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {opportunity?.title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Quick Access to Canonical Student DNA */}
          <Link
            href="/student/dna"
            style={{
              fontSize: 12,
              color: "#a5b4fc",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 8,
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.3)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 5
            }}
          >
            🧬 View My Student DNA ↗
          </Link>

          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            style={{
              fontSize: 12,
              color: applicationStage === "Bookmarked" ? "#fbbf24" : "rgba(255,255,255,0.7)",
              background: applicationStage === "Bookmarked" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
              border: applicationStage === "Bookmarked" ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.1)",
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            {applicationStage === "Bookmarked" ? "★ Saved" : "☆ Save"}
          </button>

          {/* Mark Applied Button */}
          <button
            onClick={handleMarkApplied}
            style={{
              fontSize: 12,
              color: applicationStage === "Applied" ? "#34d399" : "rgba(255,255,255,0.7)",
              background: applicationStage === "Applied" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
              border: applicationStage === "Applied" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.1)",
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            {applicationStage === "Applied" ? "✓ Applied" : "Mark Applied"}
          </button>

          <Link
            href={`/student/practice-interview?opportunityId=${opportunityId}`}
            style={{ fontSize: 12, color: "#38bdf8", textDecoration: "none", padding: "6px 14px", borderRadius: 8, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", fontWeight: 700 }}
          >
            🎤 Mock Interview
          </Link>

          <a
            href={safeUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: "white", textDecoration: "none", padding: "6px 14px", borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#a855f7)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
          >
            Apply on Official Portal ↗
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "2rem 1.5rem" }}>
        
        {/* Source Discrepancy Banner (If Any) */}
        {oppReqs?.hasDiscrepancy && (
          <div style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)", borderRadius: 14, padding: "12px 18px", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#fdba74" }}>
              <span style={{ fontSize: 18 }}>⚠</span>
              <div>
                <strong>Source Discrepancy:</strong> {oppReqs.discrepancyNote || "Conflicting information found between aggregator and official portal."}
              </div>
            </div>
            <a href={safeUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: "4px 10px", background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 6, color: "#fed7aa", textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap" }}>
              View Official Source ↗
            </a>
          </div>
        )}

        {/* ── 1. OPPORTUNITY HERO ── */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2rem", marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", padding: "3px 8px", background: "rgba(99,102,241,0.15)", color: "#818cf8", borderRadius: 6, fontWeight: 800 }}>
              {opportunity?.type || "Hackathon"}
            </span>
            <span style={{ fontSize: 10, padding: "3px 8px", background: "rgba(245,158,11,0.15)", color: "#fbbf24", borderRadius: 6, fontWeight: 800 }}>
              {opportunity?.tier}
            </span>
            
            {/* Official Verification Badge */}
            {verBadge && (
              <span style={{ fontSize: 10, padding: "3px 8px", background: verBadge.bgColor, color: verBadge.color, borderRadius: 6, fontWeight: 800, border: `1px solid ${verBadge.color}33`, display: "inline-flex", alignItems: "center", gap: 4 }}>
                {verBadge.icon} {verBadge.label}
              </span>
            )}

            {/* Portal Source Badge */}
            <span style={{ fontSize: 10, padding: "3px 8px", background: portal.badgeBg, color: portal.badgeColor, borderRadius: 6, fontWeight: 800, border: `1px solid ${portal.badgeColor}33` }}>
              Source: {portal.name.replace(" Verified", "").replace(" Official", "")}
            </span>

            {/* Pipeline Stage Badge */}
            {applicationStage && (
              <span style={{ fontSize: 10, padding: "3px 8px", background: applicationStage === "Applied" ? "rgba(16,185,129,0.2)" : "rgba(168,85,247,0.2)", color: applicationStage === "Applied" ? "#34d399" : "#c084fc", borderRadius: 6, fontWeight: 800, border: `1px solid ${applicationStage === "Applied" ? "#10b981" : "#a855f7"}44` }}>
                {applicationStage === "Applied" ? "✓ Applied in Pipeline" : `📋 Pipeline: ${applicationStage}`}
              </span>
            )}
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>• {opportunity?.organizer}</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 10px", color: "white" }}>
            {opportunity?.title}
          </h1>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
            {opportunity?.extracted_context?.summary || opportunity?.eligibility}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {opportunity?.extracted_context?.prize_pool && (
              <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, color: "#34d399", fontWeight: 700 }}>
                🏆 {opportunity.extracted_context.prize_pool}
              </span>
            )}
            {opportunity && (
              <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, color: "#fbbf24", fontWeight: 700 }}>
                📅 {formatOpportunitySchedule(opportunity).label}
              </span>
            )}
            <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 8, color: "#60a5fa", fontWeight: 600 }}>
              👥 Team: {oppReqs.teamSize}
            </span>
            <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 8, color: "#c084fc", fontWeight: 600 }}>
              🌐 Mode: {oppReqs.mode}
            </span>
          </div>
        </div>

        {/* ── 2. YOUR OPPORTUNITY FIT (PRIMARY PERSONALIZED SECTION) ── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(99,102,241,0.06) 100%)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 18,
            padding: "1.5rem 1.75rem",
            marginBottom: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26 }}>🎯</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "white", display: "flex", alignItems: "center", gap: 10 }}>
                  YOUR OPPORTUNITY FIT
                  {fitEvidence && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontWeight: 800,
                        background: getFitLabelStyle(fitEvidence.label).bgColor,
                        color: getFitLabelStyle(fitEvidence.label).color,
                        border: `1px solid ${getFitLabelStyle(fitEvidence.label).borderColor}`
                      }}
                    >
                      {fitEvidence.label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  {fitEvidence?.whySummary || "Calculated against your single canonical Student DNA."}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Evidence Provenance Button */}
              <button
                onClick={() => setShowWhyMatchModal(true)}
                style={{
                  fontSize: 12,
                  color: "#38bdf8",
                  background: "rgba(56,189,248,0.1)",
                  border: "1px solid rgba(56,189,248,0.3)",
                  padding: "6px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>🔍</span> Why this match?
              </button>

              <Link
                href="/student/dna"
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.8)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "6px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 700
                }}
              >
                View My Student DNA ↗
              </Link>
            </div>
          </div>

          {/* Insufficient DNA notice or 3-column evidence breakdown */}
          {!studentDNA || (studentDNA.skills || []).length === 0 ? (
            <div style={{ padding: "14px 18px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 12, color: "#fde68a" }}>
                ⚠️ <strong>Student DNA is incomplete:</strong> Add verified projects or GitHub commits to your profile to unlock precise evidence-backed match analysis.
              </div>
              <Link href="/student/dna" style={{ fontSize: 11, padding: "5px 12px", background: "rgba(245,158,11,0.2)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 6, textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap" }}>
                Enhance Profile →
              </Link>
            </div>
          ) : fitEvidence ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
              {/* Strengths */}
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>✓</span> YOUR STRENGTHS ({fitEvidence.strengths.length})
                </div>
                {fitEvidence.strengths.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {fitEvidence.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#a7f3d0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(16,185,129,0.08)", padding: "5px 8px", borderRadius: 6 }}>
                        <span style={{ fontWeight: 700 }}>✓ {s.skill}</span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>{s.level || "Proficient"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>No exact core strengths matched</div>
                )}
              </div>

              {/* Partial Fit */}
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#60a5fa", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>◐</span> PARTIAL FIT ({fitEvidence.partial.length})
                </div>
                {fitEvidence.partial.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {fitEvidence.partial.map((p, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#bfdbfe", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(59,130,246,0.08)", padding: "5px 8px", borderRadius: 6 }}>
                        <span style={{ fontWeight: 700 }}>◐ {p.skill}</span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>{p.reason}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>No intermediate partial skills</div>
                )}
              </div>

              {/* Skills to Strengthen */}
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚠</span> SKILLS TO STRENGTHEN ({fitEvidence.gaps.length})
                </div>
                {fitEvidence.gaps.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {fitEvidence.gaps.map((g, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#fde68a", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(245,158,11,0.08)", padding: "5px 8px", borderRadius: 6 }}>
                        <span style={{ fontWeight: 700 }}>⚠ {g.skill}</span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>Team matchable</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#34d399" }}>All required capabilities covered ✓</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* ── 3. OPPORTUNITY REQUIREMENTS (REPLACES OPPORTUNITY DNA) ── */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: "1.5rem 1.75rem",
            marginBottom: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "white", display: "flex", alignItems: "center", gap: 8 }}>
                📋 OPPORTUNITY REQUIREMENTS
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                Official format constraints, domain relevance, and required engineering capabilities.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "3px 9px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", fontWeight: 700 }}>
                Level: {oppReqs.experienceLevel}
              </span>
              <span style={{ fontSize: 11, padding: "3px 9px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", fontWeight: 700 }}>
                Team: {oppReqs.teamSize}
              </span>
              {oppReqs.duration !== "Not specified" && (
                <span style={{ fontSize: 11, padding: "3px 9px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fbbf24", fontWeight: 700 }}>
                  ⏱ {oppReqs.duration}
                </span>
              )}
              <a
                href={safeUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, padding: "3px 9px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, color: "#a5b4fc", textDecoration: "none", fontWeight: 700 }}
              >
                View Official Source ↗
              </a>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {/* Required Capabilities with Explicit vs Inferred labels */}
            <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "#38bdf8", fontWeight: 800, letterSpacing: 0.5, marginBottom: 8 }}>
                REQUIRED CAPABILITIES
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(oppReqs.requiredCapabilities || []).length > 0 ? (
                  oppReqs.requiredCapabilities.map((rc, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        padding: "3px 8px",
                        background: rc.type === "explicit" ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.05)",
                        color: rc.type === "explicit" ? "#7dd3fc" : "rgba(255,255,255,0.8)",
                        borderRadius: 6,
                        border: rc.type === "explicit" ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(255,255,255,0.1)",
                        fontWeight: 700
                      }}
                    >
                      {rc.name} <span style={{ opacity: 0.6, fontSize: 9 }}>({rc.evidenceLabel})</span>
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Standard engineering stack</span>
                )}
              </div>
            </div>

            {/* Themes & Problem Tracks */}
            <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "#34d399", fontWeight: 800, letterSpacing: 0.5, marginBottom: 8 }}>
                THEMES &amp; PROBLEM TRACKS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(oppReqs.themes || []).length > 0 ? (
                  oppReqs.themes.map((t, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "3px 8px", background: "rgba(16,185,129,0.12)", color: "#a7f3d0", borderRadius: 6, border: "1px solid rgba(16,185,129,0.25)", fontWeight: 700 }}>
                      📌 {t}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Open track / Any domain</span>
                )}
              </div>
            </div>

            {/* Official Constraints & Eligibility */}
            <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 800, letterSpacing: 0.5, marginBottom: 8 }}>
                OFFICIAL CONSTRAINTS &amp; ELIGIBILITY
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                {(oppReqs.officialConstraints || []).map((oc, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>• {oc}</div>
                ))}
                <div>• Verification: <strong style={{ color: "#34d399" }}>{oppReqs.verificationStatus}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. PROBLEM STUDIO (RESEARCH-FIRST) ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.25rem 1.75rem", marginBottom: "2rem" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>💡 PROBLEM STUDIO</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
              Find authentic, research-first problem directions grounded in official requirements and your Student DNA.
            </p>
          </div>

          <button
            onClick={handleGenerateProjects}
            disabled={generating}
            style={{ padding: "0.85rem 1.8rem", background: generating ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#6366f1,#a855f7)", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: generating ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
          >
            {generating ? (
              <>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "white", animation: "pulse 1s infinite" }} />
                {stageProgress}
              </>
            ) : projects.length > 0 ? "Regenerate Problem Directions ↻" : "Explore Problem Directions ⚡"}
          </button>
        </div>

        {error && (
          <div style={{ padding: "1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, color: "#f87171", fontSize: 13, marginBottom: "2rem" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Generated Problem Blueprints */}
        {projects.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                  Validated Problem Blueprints ({projects.length})
                </h2>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  Grounded in official opportunity themes and personalized against your verified skills.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              {projects.map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                        PROBLEM DIRECTION #{idx + 1}
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px", color: "white" }}>{proj.title}</h3>
                      <div style={{ fontSize: 13, color: "#a5b4fc", fontWeight: 600 }}>{proj.tagline}</div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => runCouncilEvaluation(proj.problem_statement, proj.title, proj.tech_stack)}
                        style={{ padding: "8px 14px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.35)", color: "#c7d2fe", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        🤖 6-Agent Council Review
                      </button>
                      <button
                        onClick={() => downloadBlueprintPDF(proj, opportunity?.title || 'Hackathon', activeCouncilResult && evaluatedProjectTitle === proj.title ? activeCouncilResult : null)}
                        style={{ padding: "8px 14px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: "#a7f3d0", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        📄 Download Blueprint
                      </button>
                    </div>
                  </div>

                  {/* ── WHY THIS PROBLEM FITS YOU ── */}
                  <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 800, letterSpacing: 0.5, marginBottom: 6 }}>
                      WHY THIS PROBLEM FITS YOU
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                      {proj.why_it_fits_you?.explanation ? (
                        <div>{proj.why_it_fits_you.explanation}</div>
                      ) : (
                        <div>This direction directly leverages your demonstrated skills and provides portfolio depth for this track.</div>
                      )}
                      <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap", fontSize: 11 }}>
                        {proj.why_it_fits_you?.aligned_skills && proj.why_it_fits_you.aligned_skills.length > 0 && (
                          <div style={{ color: "#34d399" }}>
                            <strong>✓ Aligns with:</strong> {proj.why_it_fits_you.aligned_skills.join(", ")}
                          </div>
                        )}
                        {proj.why_it_fits_you?.required_capabilities && proj.why_it_fits_you.required_capabilities.length > 0 && (
                          <div style={{ color: "#fbbf24" }}>
                            <strong>⚠ Requires:</strong> {proj.why_it_fits_you.required_capabilities.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Problem & Moat */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>AUTHENTIC REAL-WORLD PROBLEM</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{proj.problem_statement}</div>
                      {proj.observed_pain && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                          <strong>Observed Friction:</strong> {proj.observed_pain}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "1rem", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
                      <div style={{ fontSize: 10, color: "#34d399", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>WINNING MOAT &amp; DIFFERENTIATION</div>
                      <div style={{ fontSize: 12, color: "#a7f3d0", lineHeight: 1.5 }}>{proj.winning_moat}</div>
                      {proj.existing_gap && (
                        <div style={{ fontSize: 11, color: "#86efac", marginTop: 6 }}>
                          <strong>Unsolved Gap:</strong> {proj.existing_gap}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Architecture & Tech Stack */}
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>SYSTEM ARCHITECTURE</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, marginBottom: 8 }}>{proj.architecture}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(proj.tech_stack || []).map((t, i) => (
                        <span key={i} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, color: "#a5b4fc", fontWeight: 700 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 36-Hour MVP Timeline */}
                  {proj.mvp_timeline && proj.mvp_timeline.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>36-HOUR BUILD TIMELINE</div>
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${proj.mvp_timeline.length}, 1fr)`, gap: 10 }}>
                        {proj.mvp_timeline.map((step, i) => (
                          <div key={i} style={{ padding: "0.75rem 1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                            <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 800, marginBottom: 4 }}>⏱ {step.hours}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{step.task}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WOW Factor & Judge Defense */}
                  <div style={{ padding: "0.85rem 1.15rem", background: "rgba(99,102,241,0.06)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "#c7d2fe" }}>
                      ✨ <strong style={{ color: "white" }}>Live Demo WOW Factor:</strong> {proj.demo_wow_factor}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                      🎤 <strong style={{ color: "#fbbf24" }}>Judge Defense Question:</strong> {proj.potential_judge_question}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. TEAM COVERAGE (REPLACES TEAM DNA) ── */}
        <div
          style={{
            marginTop: "1.5rem",
            background: "linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(10,15,29,0.95) 100%)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#34d399", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                <span>👥</span> TEAM COVERAGE
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 900, color: "white", margin: "0 0 4px" }}>
                Syndicate Capability Coverage
              </h3>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                Compare required opportunity capabilities with your verified profile and opted-in candidate teammates.
              </div>
            </div>

            <Link
              href="/post"
              style={{
                padding: "8px 14px",
                background: "rgba(52,211,153,0.15)",
                border: "1px solid rgba(52,211,153,0.35)",
                color: "#6ee7b7",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              📢 Post to Collaboration Feed
            </Link>
          </div>

          {/* Skill Diagnostic Breakdown */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              background: "rgba(0,0,0,0.3)",
              borderRadius: 14,
              padding: "1.25rem",
              border: "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>✓</span> YOUR COVERAGE ({fitEvidence?.strengths.length || 0})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(fitEvidence?.strengths || []).map((s, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 9px", background: "rgba(16,185,129,0.15)", color: "#a7f3d0", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, fontWeight: 700 }}>
                    ✓ {s.skill}
                  </span>
                ))}
                {(!fitEvidence?.strengths || fitEvidence.strengths.length === 0) && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Add skills in your profile</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>⚠</span> MISSING CAPABILITIES ({fitEvidence?.gaps.length || 0})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(fitEvidence?.gaps || []).map((g, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 9px", background: "rgba(245,158,11,0.12)", color: "#fde68a", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, fontWeight: 700 }}>
                    ⚠ {g.skill}
                  </span>
                ))}
                {(!fitEvidence?.gaps || fitEvidence.gaps.length === 0) && (
                  <span style={{ fontSize: 11, color: "#34d399" }}>All required skills covered ✓</span>
                )}
              </div>
            </div>
          </div>

          {/* Team Coverage Simulation */}
          {teamSimulation && (
            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                borderRadius: 14,
                padding: "1.25rem 1.5rem",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>
                    COMBINED SYNDICATE COVERAGE
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "white" }}>
                    Coverage Progress:{" "}
                    <span style={{ color: teamSimulation.overall_team_coverage_pct >= 50 ? "#34d399" : "#fbbf24" }}>
                      {teamSimulation.overall_team_coverage_pct}%
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginLeft: 8 }}>
                      ({teamSimulation.members_count} member{teamSimulation.members_count > 1 ? "s" : ""})
                    </span>
                  </div>
                </div>

                {teamSimulation.next_best_skill && (
                  <div style={{ fontSize: 11, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#fde68a", padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>
                    💡 Recommended Next Capability: <strong>{teamSimulation.next_best_skill.skill}</strong> (+{teamSimulation.next_best_skill.potential_coverage_boost_pct}%)
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${teamSimulation.overall_team_coverage_pct}%`,
                    background: teamSimulation.overall_team_coverage_pct >= 50 ? "linear-gradient(90deg, #059669, #34d399)" : "linear-gradient(90deg, #d97706, #fbbf24)",
                    borderRadius: 999,
                    transition: "width 0.4s ease"
                  }}
                />
              </div>

              {/* Team Coverage Synthesis */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
                    TEAM STRENGTHS
                  </div>
                  <div style={{ fontSize: 12, color: "white", fontWeight: 700 }}>
                    {selectedTeammates.length > 0 ? "Cross-Functional Architecture" : "Solo Builder (Core Strengths)"}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    {selectedTeammates.length > 0 ? `${selectedTeammates.length + 1} synchronized developers` : "Select teammates to expand role coverage"}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 10, color: "#34d399", fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
                    ROLE COVERAGE
                  </div>
                  <div style={{ fontSize: 12, color: "white", fontWeight: 700 }}>
                    {teamSimulation.overall_team_coverage_pct >= 60 ? "Balanced Team" : "Forming Syndicate"}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    Roles: Systems Architect, Frontend/API, Data/ML
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
                    TEAM RISKS
                  </div>
                  <div style={{ fontSize: 12, color: "white", fontWeight: 700 }}>
                    {teamSimulation.next_best_skill ? `Gap: ${teamSimulation.next_best_skill.skill}` : "Zero High-Severity Gaps"}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    Derived from official requirements
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Opted-In Teammates Cards */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 10 }}>
              Recommended Teammates ({teammateMatches.length} Opted-In Candidates)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {teammateMatches.map((teammate, idx) => {
                const isSelected = selectedTeammates.includes(teammate.candidate_id);
                const inviteSent = teamInviteSent[teammate.candidate_id];

                return (
                  <div
                    key={idx}
                    style={{
                      background: isSelected ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                      border: isSelected ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                            {teammate.avatar || "🚀"}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{teammate.name}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{(teammate.target_roles || []).join(", ")}</div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399" }}>
                            {(teammate.covered_gaps || []).length > 0 
                              ? `Fills ${(teammate.covered_gaps || []).length} gap${(teammate.covered_gaps || []).length > 1 ? "s" : ""}`
                              : "Complementary"}
                          </div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>EVIDENCE FIT</div>
                        </div>
                      </div>

                      {/* Gaps Covered */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 800, marginBottom: 4 }}>
                          PLUGS YOUR CAPABILITY GAPS:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(teammate.covered_gaps || []).map((g: string, gi: number) => (
                            <span key={gi} style={{ fontSize: 10, padding: "2px 7px", background: "rgba(52,211,153,0.15)", color: "#a7f3d0", borderRadius: 4, fontWeight: 700 }}>
                              ✓ {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "8px 10px", lineHeight: 1.4 }}>
                        💬 {teammate.mutual_growth_narrative}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => toggleTeammate(teammate.candidate_id)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: 8,
                          border: "none",
                          background: isSelected ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg, #059669, #34d399)",
                          color: isSelected ? "#fca5a5" : "white",
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        {isSelected ? "✕ Remove from Simulator" : "+ Add to Team Simulator"}
                      </button>

                      <button
                        onClick={() => handleSendTeamInvite(teammate.candidate_id, teammate.name)}
                        disabled={inviteSent}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.15)",
                          background: inviteSent ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)",
                          color: inviteSent ? "#34d399" : "white",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: inviteSent ? "default" : "pointer"
                        }}
                      >
                        {inviteSent ? "✓ Invite Sent" : "🤝 Invite"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── MODAL 1: EVIDENCE PROVENANCE DRAWER ("Why this match?") ── */}
      {showWhyMatchModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#0c081e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 22, width: "100%", maxWidth: 740, maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)" }}>
            <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0c081e", zIndex: 5 }}>
              <div>
                <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 800, letterSpacing: 1 }}>
                  EVIDENCE-FIRST PROVENANCE
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "white" }}>
                  Why Cognalyze Recommended This Opportunity
                </div>
              </div>
              <button
                onClick={() => setShowWhyMatchModal(false)}
                style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.6)", width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                Every recommendation claim is traceable to your verified artifacts, declared goals, or official opportunity terms. No AI-manufactured statistics.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(fitEvidence?.provenance || []).map((p, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#818cf8" }}>
                        {idx + 1}. {p.category}
                      </span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 800, background: p.evidenceLabel === "✓ Verified" ? "rgba(16,185,129,0.15)" : p.evidenceLabel === "◐ User Declared" ? "rgba(245,158,11,0.15)" : "rgba(168,85,247,0.15)", color: p.evidenceLabel === "✓ Verified" ? "#34d399" : p.evidenceLabel === "◐ User Declared" ? "#fbbf24" : "#c084fc", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {p.evidenceLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 4 }}>
                      {p.claim}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                      <strong>Proof / Source:</strong> {p.evidence}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                      Source: {p.sourceName} ({p.sourceType})
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <Link
                  href="/student/dna"
                  style={{
                    fontSize: 12,
                    color: "white",
                    background: "linear-gradient(135deg,#6366f1,#a855f7)",
                    padding: "8px 16px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 800
                  }}
                >
                  Manage My Student DNA →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: 6-AGENT COUNCIL REVIEW ── */}
      {showCouncilModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(14px)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(0.5rem, 2vw, 1.5rem)" }}>
          <div style={{ background: "#0c081e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 24, width: "100%", maxWidth: 960, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0c081e", zIndex: 5 }}>
              <div>
                <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 800, letterSpacing: 1 }}>
                  6-AGENT COUNCIL REVIEW
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "white" }}>
                  {evaluatedProjectTitle || "Problem Blueprint Evaluation"}
                </div>
              </div>

              <button
                onClick={() => setShowCouncilModal(false)}
                style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.6)", width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              
              {councilEvaluating && (
                <div style={{ padding: "3.5rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, border: "4px solid rgba(99,102,241,0.2)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                    {councilProgress}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", maxWidth: 500 }}>
                    Our 6 AI analytical agents are evaluating the problem statement across problem validity, user impact, technical feasibility, market gap, operational viability, and judge rubric alignment.
                  </div>
                </div>
              )}

              {!councilEvaluating && activeCouncilResult && (
                <>
                  {/* Verdict Banner */}
                  <div style={{
                    padding: "1.5rem",
                    borderRadius: 16,
                    border: String(activeCouncilResult.overall_verdict).includes("HIGH CONVICTION") || String(activeCouncilResult.overall_verdict).includes("100% WORTH IT")
                      ? "1px solid rgba(16,185,129,0.4)"
                      : String(activeCouncilResult.overall_verdict).includes("PIVOT")
                      ? "1px solid rgba(245,158,11,0.4)"
                      : "1px solid rgba(239,68,68,0.4)",
                    background: String(activeCouncilResult.overall_verdict).includes("HIGH CONVICTION") || String(activeCouncilResult.overall_verdict).includes("100% WORTH IT")
                      ? "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,3,15,0.8))"
                      : String(activeCouncilResult.overall_verdict).includes("PIVOT")
                      ? "linear-gradient(135deg,rgba(245,158,11,0.12),rgba(6,3,15,0.8))"
                      : "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(6,3,15,0.8))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16
                  }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                        COUNCIL CONSENSUS VERDICT
                      </div>
                      <div style={{ fontSize: 19, fontWeight: 900, color: "white", marginBottom: 6 }}>
                        {activeCouncilResult.overall_verdict}
                      </div>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
                        {activeCouncilResult.executive_summary}
                      </p>
                    </div>

                    {activeCouncilResult.validated_problem && (
                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", maxWidth: 300 }}>
                        <div style={{ fontSize: 10, color: "#34d399", fontWeight: 800, marginBottom: 2 }}>VALIDATED PROBLEM</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{activeCouncilResult.validated_problem}</div>
                      </div>
                    )}
                  </div>

                  {/* Council Consensus Breakdown */}
                  {activeCouncilResult.consensus && (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.25rem" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", letterSpacing: 0.5, marginBottom: 10 }}>
                        COUNCIL CONSENSUS FINDINGS
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                        {activeCouncilResult.consensus.strongest_evidence && (
                          <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#a7f3d0" }}>
                            <strong>Strongest Evidence:</strong> {activeCouncilResult.consensus.strongest_evidence}
                          </div>
                        )}
                        {activeCouncilResult.consensus.major_concern && (
                          <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#fca5a5" }}>
                            <strong>Major Concern:</strong> {activeCouncilResult.consensus.major_concern}
                          </div>
                        )}
                        {activeCouncilResult.consensus.technical_risk && (
                          <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#fde68a" }}>
                            <strong>Technical Risk:</strong> {activeCouncilResult.consensus.technical_risk}
                          </div>
                        )}
                        {activeCouncilResult.consensus.recommended_change && (
                          <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#c7d2fe" }}>
                            <strong>Recommended Pivot:</strong> {activeCouncilResult.consensus.recommended_change}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 6 Analytical Agent Details with FACT / INFERENCE / CONCERN / RECOMMENDATION */}
                  <div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>
                      🤖 INDEPENDENT AGENT ANALYSES ({activeCouncilResult.agents.length} Roles)
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {activeCouncilResult.agents.map((ag, aIdx) => (
                        <div
                          key={aIdx}
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 14,
                            padding: "1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 22 }}>{ag.agent_avatar}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
                                  {ag.agent_name}
                                </div>
                                <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 600 }}>
                                  {ag.agent_role}
                                </div>
                              </div>
                            </div>

                            <span style={{ fontSize: 11, padding: "3px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
                              {ag.verdict}
                            </span>
                          </div>

                          {ag.fact && (
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 8 }}>
                              <strong style={{ color: "#38bdf8" }}>FACT: </strong> {ag.fact}
                            </div>
                          )}

                          {ag.inference && (
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 8 }}>
                              <strong style={{ color: "#c084fc" }}>INFERENCE: </strong> {ag.inference}
                            </div>
                          )}

                          {ag.concern && (
                            <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.5, background: "rgba(239,68,68,0.06)", padding: "8px 12px", borderRadius: 8 }}>
                              <strong style={{ color: "#f87171" }}>CONCERN: </strong> {ag.concern}
                            </div>
                          )}

                          {ag.recommendation && (
                            <div style={{ fontSize: 12, color: "#a7f3d0", lineHeight: 1.5, background: "rgba(16,185,129,0.06)", padding: "8px 12px", borderRadius: 8 }}>
                              <strong style={{ color: "#34d399" }}>RECOMMENDATION: </strong> {ag.recommendation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
