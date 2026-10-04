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
import { VerificationTrustBar, VerifiedApplyButton } from "@/components/opportunity/verification-trust-bar";

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
  demo_moment?: {
    what_judge_sees: string;
    why_it_proves_success: string;
    requirement_demonstrated: string;
  };
  demo_wow_factor?: string;
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
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #17191C; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; background: #FFFFFF; }
  h1 { font-size: 22px; color: #162A43; margin-bottom: 4px; font-weight: 700; }
  h2 { font-size: 15px; color: #162A43; margin: 20px 0 8px; border-bottom: 1px solid #E4E1DA; padding-bottom: 4px; font-weight: 600; }
  h3 { font-size: 13px; color: #356AE6; margin: 12px 0 4px; font-weight: 600; }
  p, li { font-size: 13px; color: #334155; }
  .tagline { font-size: 14px; color: #667085; font-style: italic; margin-bottom: 12px; }
  .meta { font-size: 11px; color: #98A2B3; margin-bottom: 20px; }
  .section { margin-bottom: 16px; padding: 12px; background: #FAF9F6; border-radius: 8px; border: 1px solid #E4E1DA; }
  .tech-tag { display: inline-block; font-size: 11px; padding: 2px 8px; background: #EFF4FE; color: #356AE6; border-radius: 4px; margin: 2px; font-weight: 600; border: 1px solid #D2E0FB; }
  .timeline-row { display: flex; gap: 12px; margin: 4px 0; }
  .timeline-hours { font-weight: 700; color: #B7791F; min-width: 60px; font-size: 12px; }
  .timeline-task { font-size: 12px; }
  .council-agent { padding: 10px; margin: 8px 0; background: #FAF9F6; border-radius: 8px; border: 1px solid #E4E1DA; }
  .agent-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .agent-name { font-weight: 700; font-size: 12px; color: #162A43; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #E4E1DA; font-size: 10px; color: #98A2B3; text-align: center; }
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

<h2>MVP Timeline Schedule</h2>
<div class="section">
${(proj.mvp_timeline || []).map(s => '<div class="timeline-row"><span class="timeline-hours">' + s.hours + '</span><span class="timeline-task">' + s.task + '</span></div>').join('')}
</div>

<h2>Demo Moment & Proof of Concept</h2>
<div class="section">
${proj.demo_moment ? `<p><strong>What Judge Sees:</strong> ${proj.demo_moment.what_judge_sees}</p><p><strong>Why It Proves Success:</strong> ${proj.demo_moment.why_it_proves_success}</p><p><strong>Requirement Demonstrated:</strong> ${proj.demo_moment.requirement_demonstrated}</p>` : `<p>${proj.demo_wow_factor || "Live interactive execution demonstrating problem resolution."}</p>`}
</div>

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
      <div style={{ minHeight: "100vh", background: "#F6F5F1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "#162A43" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E4E1DA", borderTopColor: "#356AE6", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "#162A43" }}>Scanning Opportunity Intelligence...</div>
        <div style={{ fontSize: 12, color: "#667085" }}>Grounding requirements in verified sources & Student DNA.</div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div style={{ minHeight: "100vh", background: "#F6F5F1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#162A43", padding: 24, textAlign: "center" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "36px 32px", maxWidth: 460 }}>
          <span style={{ fontSize: 36 }}>⚠️</span>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "14px 0 8px", color: "#162A43" }}>Opportunity Unavailable</h2>
          <p style={{ fontSize: 13, color: "#667085", margin: "0 0 20px", lineHeight: 1.5 }}>
            This opportunity may have expired, been archived, or official confirmation is pending.
          </p>
          <Link href="/student/opportunities" style={{ padding: "8px 18px", background: "#356AE6", color: "#FFFFFF", borderRadius: 7, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
            ← Back to Opportunities
          </Link>
        </div>
      </div>
    );
  }

  const portal = opportunity
    ? getOpportunityPortalInfo(opportunity.source_url, opportunity.organizer, opportunity.title)
    : { name: "Verified Portal", badgeBg: "#EFF4FE", badgeColor: "#356AE6", isVerified: true };

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
    <div style={{ minHeight: "100vh", background: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Top Navbar */}
      <div style={{ borderBottom: "1px solid #E4E1DA", padding: "0.85rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/student/opportunities" style={{ color: "#667085", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            ← Opportunities
          </Link>
          <span style={{ color: "#E4E1DA" }}>/</span>
          <span style={{ fontSize: 13, color: "#162A43", fontWeight: 600, maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {opportunity?.title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Quick Access to Canonical Student DNA */}
          <Link
            href="/student/dna"
            style={{
              fontSize: 12,
              color: "#356AE6",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 7,
              background: "#EFF4FE",
              border: "1px solid #D2E0FB",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5
            }}
          >
            Student DNA ↗
          </Link>

          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            style={{
              fontSize: 12,
              color: applicationStage === "Bookmarked" ? "#B7791F" : "#667085",
              background: applicationStage === "Bookmarked" ? "#FEF7ED" : "#FFFFFF",
              border: applicationStage === "Bookmarked" ? "1px solid #F8D8A7" : "1px solid #E4E1DA",
              padding: "6px 12px",
              borderRadius: 7,
              cursor: "pointer",
              fontWeight: 600,
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
              color: applicationStage === "Applied" ? "#2E7D5B" : "#667085",
              background: applicationStage === "Applied" ? "#EAF4EE" : "#FFFFFF",
              border: applicationStage === "Applied" ? "1px solid #C8E4D3" : "1px solid #E4E1DA",
              padding: "6px 12px",
              borderRadius: 7,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            {applicationStage === "Applied" ? "✓ Applied" : "Mark Applied"}
          </button>

          <Link
            href={`/student/practice-interview?opportunityId=${opportunityId}`}
            style={{ fontSize: 12, color: "#162A43", textDecoration: "none", padding: "6px 14px", borderRadius: 7, background: "#FAF9F6", border: "1px solid #E4E1DA", fontWeight: 600 }}
          >
            Mock Interview
          </Link>

          <VerifiedApplyButton
            url={safeUrl}
            sourceUrl={opportunity?.source_url}
            opportunityId={opportunityId}
            title={opportunity?.title}
            organizer={opportunity?.organizer}
            status={opportunity?.status || "ACTIVE"}
            label="Official Portal ↗"
            style={{ fontSize: 12, padding: "6px 14px", borderRadius: 7 }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "2rem 1.5rem" }}>
        
        {/* Source Discrepancy Banner (If Any) */}
        {oppReqs?.hasDiscrepancy && (
          <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 10, padding: "12px 18px", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#B7791F" }}>
              <span style={{ fontSize: 16 }}>⚠</span>
              <div>
                <strong>Source Discrepancy:</strong> {oppReqs.discrepancyNote || "Conflicting information found between aggregator and official portal."}
              </div>
            </div>
            <a href={safeUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: "4px 10px", background: "#FFFFFF", border: "1px solid #F8D8A7", borderRadius: 6, color: "#B7791F", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
              View Official Source ↗
            </a>
          </div>
        )}

        {/* EVIDENCE-FIRST TRUST BAR */}
        <VerificationTrustBar
          source={portal.name}
          sourceUrl={opportunity?.source_url}
          applicationUrl={safeUrl}
          lastChecked="Just now"
          status={opportunity?.status || "VERIFIED_ACTIVE"}
          classification={opportunity?.type?.toUpperCase() || "HACKATHON"}
          verifiedFields={["Title", "Organizer", "Registration Schedule", "Eligibility", "Team Constraints"]}
          inferredFields={["Suggested Problem Spaces", "Architecture Blueprints", "Personalized Match Fit"]}
        />

        {/* ── 1. OPPORTUNITY HERO ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "24px", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", padding: "2px 8px", background: "#FAF9F6", color: "#162A43", borderRadius: 5, fontWeight: 700, border: "1px solid #E4E1DA" }}>
              {opportunity?.type || "Hackathon"}
            </span>
            <span style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", borderRadius: 5, fontWeight: 700, border: "1px solid #D2E0FB" }}>
              {opportunity?.tier || "Tier 1"}
            </span>
            
            {/* Official Verification Badge */}
            {verBadge && (
              <span style={{ fontSize: 10, padding: "2px 8px", background: "#EAF4EE", color: "#2E7D5B", borderRadius: 5, fontWeight: 600, border: "1px solid #C8E4D3", display: "inline-flex", alignItems: "center", gap: 4 }}>
                {verBadge.icon} {verBadge.label}
              </span>
            )}

            {/* Portal Source Badge */}
            <span style={{ fontSize: 10, padding: "2px 8px", background: "#FAF9F6", color: "#667085", borderRadius: 5, fontWeight: 600, border: "1px solid #E4E1DA" }}>
              Source: {portal.name.replace(" Verified", "").replace(" Official", "")}
            </span>

            {/* Pipeline Stage Badge */}
            {applicationStage && (
              <span style={{ fontSize: 10, padding: "2px 8px", background: applicationStage === "Applied" ? "#EAF4EE" : "#EFF4FE", color: applicationStage === "Applied" ? "#2E7D5B" : "#356AE6", borderRadius: 5, fontWeight: 600, border: `1px solid ${applicationStage === "Applied" ? "#C8E4D3" : "#D2E0FB"}` }}>
                {applicationStage === "Applied" ? "✓ Applied in Pipeline" : `Pipeline: ${applicationStage}`}
              </span>
            )}
            <span style={{ fontSize: 12, color: "#667085" }}>• {opportunity?.organizer}</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 10px", color: "#162A43", letterSpacing: "-0.3px" }}>
            {opportunity?.title}
          </h1>

          <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
            {opportunity?.extracted_context?.summary || opportunity?.eligibility}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {opportunity?.extracted_context?.prize_pool && (
              <span style={{ fontSize: 11, padding: "3px 10px", background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 6, color: "#2E7D5B", fontWeight: 600 }}>
                🏆 {opportunity.extracted_context.prize_pool}
              </span>
            )}
            {opportunity && (
              <span style={{ fontSize: 11, padding: "3px 10px", background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 6, color: "#B7791F", fontWeight: 600 }}>
                📅 {formatOpportunitySchedule(opportunity).label}
              </span>
            )}
            <span style={{ fontSize: 11, padding: "3px 10px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 6, color: "#356AE6", fontWeight: 600 }}>
              👥 Team: {oppReqs.teamSize}
            </span>
            <span style={{ fontSize: 11, padding: "3px 10px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 6, color: "#162A43", fontWeight: 600 }}>
              🌐 Mode: {oppReqs.mode}
            </span>
          </div>
        </div>

        {/* ── 2. YOUR OPPORTUNITY FIT (PRIMARY PERSONALIZED SECTION) ── */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 10,
            padding: "24px",
            marginBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🎯</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43", display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.2px" }}>
                  YOUR OPPORTUNITY FIT
                  {fitEvidence && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 5,
                        fontWeight: 600,
                        background: getFitLabelStyle(fitEvidence.label).bgColor,
                        color: getFitLabelStyle(fitEvidence.label).color,
                        border: `1px solid ${getFitLabelStyle(fitEvidence.label).borderColor}`
                      }}
                    >
                      {fitEvidence.label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
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
                  color: "#356AE6",
                  background: "#EFF4FE",
                  border: "1px solid #D2E0FB",
                  padding: "6px 14px",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontWeight: 600,
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
                  color: "#162A43",
                  background: "#FAF9F6",
                  border: "1px solid #E4E1DA",
                  padding: "6px 12px",
                  borderRadius: 7,
                  textDecoration: "none",
                  fontWeight: 600
                }}
              >
                View Student DNA ↗
              </Link>
            </div>
          </div>

          {/* Insufficient DNA notice or 3-column evidence breakdown */}
          {!studentDNA || (studentDNA.skills || []).length === 0 ? (
            <div style={{ padding: "14px 18px", background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 12, color: "#B7791F" }}>
                ⚠️ <strong>Student DNA is incomplete:</strong> Add verified projects or GitHub commits to your profile to unlock precise evidence-backed match analysis.
              </div>
              <Link href="/student/dna" style={{ fontSize: 11, padding: "5px 12px", background: "#FFFFFF", color: "#B7791F", border: "1px solid #F8D8A7", borderRadius: 6, textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
                Enhance Profile →
              </Link>
            </div>
          ) : fitEvidence ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
              {/* Strengths */}
              <div style={{ background: "#FAF9F6", borderRadius: 8, padding: "14px 16px", border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", marginBottom: 10, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }}>
                  <span>✓</span> YOUR STRENGTHS ({fitEvidence.strengths.length})
                </div>
                {fitEvidence.strengths.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {fitEvidence.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#162A43", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                        <span style={{ fontWeight: 600, color: "#2E7D5B" }}>✓ {s.skill}</span>
                        <span style={{ fontSize: 11, color: "#667085" }}>{s.level || "Proficient"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#98A2B3" }}>No exact core strengths matched</div>
                )}
              </div>

              {/* Partial Fit */}
              <div style={{ background: "#FAF9F6", borderRadius: 8, padding: "14px 16px", border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", marginBottom: 10, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }}>
                  <span>◐</span> PARTIAL FIT ({fitEvidence.partial.length})
                </div>
                {fitEvidence.partial.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {fitEvidence.partial.map((p, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#162A43", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                        <span style={{ fontWeight: 600, color: "#356AE6" }}>◐ {p.skill}</span>
                        <span style={{ fontSize: 11, color: "#667085" }}>{p.reason}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#98A2B3" }}>No intermediate partial skills</div>
                )}
              </div>

              {/* Skills to Strengthen */}
              <div style={{ background: "#FAF9F6", borderRadius: 8, padding: "14px 16px", border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", marginBottom: 10, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }}>
                  <span>⚠</span> SKILLS TO STRENGTHEN ({fitEvidence.gaps.length})
                </div>
                {fitEvidence.gaps.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {fitEvidence.gaps.map((g, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#162A43", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                        <span style={{ fontWeight: 600, color: "#B7791F" }}>⚠ {g.skill}</span>
                        <span style={{ fontSize: 11, color: "#667085" }}>Team matchable</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#2E7D5B" }}>All required capabilities covered ✓</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        {/* ── 3. OPPORTUNITY REQUIREMENTS ── */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 10,
            padding: "24px",
            marginBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.2px" }}>
                📋 OPPORTUNITY REQUIREMENTS
              </div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                Official format constraints, domain relevance, and required engineering capabilities.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "3px 9px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 6, color: "#162A43", fontWeight: 600 }}>
                Level: {oppReqs.experienceLevel}
              </span>
              <span style={{ fontSize: 11, padding: "3px 9px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 6, color: "#162A43", fontWeight: 600 }}>
                Team: {oppReqs.teamSize}
              </span>
              {oppReqs.duration !== "Not specified" && (
                <span style={{ fontSize: 11, padding: "3px 9px", background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 6, color: "#B7791F", fontWeight: 600 }}>
                  ⏱ {oppReqs.duration}
                </span>
              )}
              <a
                href={safeUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, padding: "3px 9px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 6, color: "#356AE6", textDecoration: "none", fontWeight: 600 }}
              >
                View Official Source ↗
              </a>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {/* Required Capabilities */}
            <div style={{ background: "#FAF9F6", borderRadius: 8, padding: "12px 14px", border: "1px solid #E4E1DA" }}>
              <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                REQUIRED CAPABILITIES
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(oppReqs.requiredCapabilities || []).length > 0 ? (
                  oppReqs.requiredCapabilities.map((rc, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        padding: "3px 8px",
                        background: rc.type === "explicit" ? "#EFF4FE" : "#FAF9F6",
                        color: rc.type === "explicit" ? "#356AE6" : "#162A43",
                        borderRadius: 5,
                        border: rc.type === "explicit" ? "1px solid #D2E0FB" : "1px solid #E4E1DA",
                        fontWeight: 600
                      }}
                    >
                      {rc.name} <span style={{ opacity: 0.6, fontSize: 10 }}>({rc.evidenceLabel})</span>
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: "#98A2B3" }}>Standard engineering stack</span>
                )}
              </div>
            </div>

            {/* Themes & Problem Tracks */}
            <div style={{ background: "#FAF9F6", borderRadius: 8, padding: "12px 14px", border: "1px solid #E4E1DA" }}>
              <div style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                THEMES &amp; PROBLEM TRACKS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(oppReqs.themes || []).length > 0 ? (
                  oppReqs.themes.map((t, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "3px 8px", background: "#EAF4EE", color: "#2E7D5B", borderRadius: 5, border: "1px solid #C8E4D3", fontWeight: 600 }}>
                      📌 {t}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: "#98A2B3" }}>Open track / Any domain</span>
                )}
              </div>
            </div>

            {/* Official Constraints & Eligibility */}
            <div style={{ background: "#FAF9F6", borderRadius: 8, padding: "12px 14px", border: "1px solid #E4E1DA" }}>
              <div style={{ fontSize: 11, color: "#B7791F", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                OFFICIAL CONSTRAINTS &amp; ELIGIBILITY
              </div>
              <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>
                {(oppReqs.officialConstraints || []).map((oc, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>• {oc}</div>
                ))}
                <div>• Verification: <strong style={{ color: "#2E7D5B" }}>{oppReqs.verificationStatus}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. PROBLEM STUDIO (RESEARCH-FIRST) ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 24px", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: "#162A43", letterSpacing: "-0.2px" }}>💡 PROBLEM STUDIO</h3>
            <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>
              Find authentic, research-first problem directions grounded in official requirements and your Student DNA.
            </p>
          </div>

          <button
            onClick={handleGenerateProjects}
            disabled={generating}
            style={{ padding: "8px 18px", background: "#356AE6", color: "#FFFFFF", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: generating ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
          >
            {generating ? (
              <>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#FFFFFF", animation: "pulse 1s infinite" }} />
                {stageProgress}
              </>
            ) : projects.length > 0 ? "Regenerate Problem Directions ↻" : "Explore Problem Directions"}
          </button>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 8, color: "#C24141", fontSize: 13, marginBottom: "1.5rem" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Generated Problem Blueprints */}
        {projects.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#162A43", letterSpacing: "-0.2px" }}>
                  Validated Problem Blueprints ({projects.length})
                </h2>
                <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                  Grounded in official opportunity themes and personalized against your verified skills.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {projects.map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>
                        PROBLEM DIRECTION #{idx + 1}
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px", color: "#162A43", letterSpacing: "-0.2px" }}>{proj.title}</h3>
                      <div style={{ fontSize: 13, color: "#667085", fontWeight: 500 }}>{proj.tagline}</div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => runCouncilEvaluation(proj.problem_statement, proj.title, proj.tech_stack)}
                        style={{ padding: "6px 12px", background: "#EFF4FE", border: "1px solid #D2E0FB", color: "#356AE6", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        6-Agent Council Review
                      </button>
                      <button
                        onClick={() => downloadBlueprintPDF(proj, opportunity?.title || 'Hackathon', activeCouncilResult && evaluatedProjectTitle === proj.title ? activeCouncilResult : null)}
                        style={{ padding: "6px 12px", background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#162A43", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        Download Blueprint
                      </button>
                    </div>
                  </div>

                  {/* ── WHY THIS PROBLEM FITS YOU ── */}
                  <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>
                      WHY THIS PROBLEM FITS YOU
                    </div>
                    <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>
                      {proj.why_it_fits_you?.explanation ? (
                        <div>{proj.why_it_fits_you.explanation}</div>
                      ) : (
                        <div>This direction directly leverages your demonstrated skills and provides portfolio depth for this track.</div>
                      )}
                      <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap", fontSize: 11 }}>
                        {proj.why_it_fits_you?.aligned_skills && proj.why_it_fits_you.aligned_skills.length > 0 && (
                          <div style={{ color: "#2E7D5B", fontWeight: 600 }}>
                            <strong>✓ Aligns with:</strong> {proj.why_it_fits_you.aligned_skills.join(", ")}
                          </div>
                        )}
                        {proj.why_it_fits_you?.required_capabilities && proj.why_it_fits_you.required_capabilities.length > 0 && (
                          <div style={{ color: "#B7791F", fontWeight: 600 }}>
                            <strong>⚠ Requires:</strong> {proj.why_it_fits_you.required_capabilities.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Problem & Moat */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                    <div style={{ padding: "12px 14px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>AUTHENTIC REAL-WORLD PROBLEM</div>
                      <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>{proj.problem_statement}</div>
                      {proj.observed_pain && (
                        <div style={{ fontSize: 11, color: "#667085", marginTop: 6 }}>
                          <strong>Observed Friction:</strong> {proj.observed_pain}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "12px 14px", background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>WINNING MOAT &amp; DIFFERENTIATION</div>
                      <div style={{ fontSize: 12, color: "#2E7D5B", lineHeight: 1.5 }}>{proj.winning_moat}</div>
                      {proj.existing_gap && (
                        <div style={{ fontSize: 11, color: "#2E7D5B", marginTop: 6 }}>
                          <strong>Unsolved Gap:</strong> {proj.existing_gap}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Architecture & Tech Stack */}
                  <div>
                    <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>SYSTEM ARCHITECTURE</div>
                    <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5, marginBottom: 8 }}>{proj.architecture}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(proj.tech_stack || []).map((t, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 5, color: "#356AE6", fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 36-Hour MVP Timeline */}
                  {proj.mvp_timeline && proj.mvp_timeline.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>36-HOUR BUILD TIMELINE</div>
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: 8 }}>
                        {proj.mvp_timeline.map((step, i) => (
                          <div key={i} style={{ padding: "10px 12px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7 }}>
                            <div style={{ fontSize: 11, color: "#B7791F", fontWeight: 700, marginBottom: 4 }}>⏱ {step.hours}</div>
                            <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.4 }}>{step.task}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Demo Moment & Judge Defense */}
                  <div style={{ padding: "12px 14px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    {proj.demo_moment ? (
                      <div style={{ fontSize: 12, color: "#162A43", display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#356AE6" }}>
                          🎯 DEMO MOMENT:
                        </div>
                        <div><strong>What Judge Sees:</strong> {proj.demo_moment.what_judge_sees}</div>
                        <div><strong>Why It Proves Success:</strong> {proj.demo_moment.why_it_proves_success}</div>
                        <div><strong>Requirement Demonstrated:</strong> {proj.demo_moment.requirement_demonstrated}</div>
                      </div>
                    ) : proj.demo_wow_factor ? (
                      <div style={{ fontSize: 12, color: "#162A43" }}>
                        🎯 <strong style={{ color: "#356AE6" }}>Demo Moment:</strong> {proj.demo_wow_factor}
                      </div>
                    ) : null}
                    <div style={{ fontSize: 12, color: "#162A43", borderTop: "1px dashed #D2E0FB", paddingTop: 6 }}>
                      🎤 <strong style={{ color: "#B7791F" }}>Judge Defense Question:</strong> {proj.potential_judge_question}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. TEAM COVERAGE ── */}
        <div
          style={{
            marginTop: "1.5rem",
            background: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 10,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#356AE6", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
                <span>👥</span> TEAM COVERAGE
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#162A43", margin: "0 0 4px", letterSpacing: "-0.2px" }}>
                Syndicate Capability Coverage
              </h3>
              <div style={{ fontSize: 12, color: "#667085" }}>
                Compare required opportunity capabilities with your verified profile and opted-in candidate teammates.
              </div>
            </div>

            <Link
              href="/post"
              style={{
                padding: "6px 12px",
                background: "#EFF4FE",
                border: "1px solid #D2E0FB",
                color: "#356AE6",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
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
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
              background: "#FAF9F6",
              borderRadius: 8,
              padding: "16px",
              border: "1px solid #E4E1DA"
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", marginBottom: 8, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }}>
                <span>✓</span> YOUR COVERAGE ({fitEvidence?.strengths.length || 0})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(fitEvidence?.strengths || []).map((s, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", borderRadius: 5, fontWeight: 600 }}>
                    ✓ {s.skill}
                  </span>
                ))}
                {(!fitEvidence?.strengths || fitEvidence.strengths.length === 0) && (
                  <span style={{ fontSize: 12, color: "#98A2B3" }}>Add skills in your profile</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", marginBottom: 8, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }}>
                <span>⚠</span> MISSING CAPABILITIES ({fitEvidence?.gaps.length || 0})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(fitEvidence?.gaps || []).map((g, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#FEF7ED", color: "#B7791F", border: "1px solid #F8D8A7", borderRadius: 5, fontWeight: 600 }}>
                    ⚠ {g.skill}
                  </span>
                ))}
                {(!fitEvidence?.gaps || fitEvidence.gaps.length === 0) && (
                  <span style={{ fontSize: 12, color: "#2E7D5B" }}>All required skills covered ✓</span>
                )}
              </div>
            </div>
          </div>

          {/* Team Coverage Simulation */}
          {teamSimulation && (
            <div
              style={{
                background: "#FAF9F6",
                borderRadius: 8,
                padding: "16px",
                border: "1px solid #E4E1DA"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", letterSpacing: 0.5, textTransform: "uppercase" }}>
                    COMBINED SYNDICATE COVERAGE
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43" }}>
                    Coverage Progress:{" "}
                    <span style={{ color: teamSimulation.overall_team_coverage_pct >= 50 ? "#2E7D5B" : "#B7791F" }}>
                      {teamSimulation.overall_team_coverage_pct}%
                    </span>
                    <span style={{ fontSize: 12, color: "#667085", fontWeight: 500, marginLeft: 8 }}>
                      ({teamSimulation.members_count} member{teamSimulation.members_count > 1 ? "s" : ""})
                    </span>
                  </div>
                </div>

                {teamSimulation.next_best_skill && (
                  <div style={{ fontSize: 11, background: "#FEF7ED", border: "1px solid #F8D8A7", color: "#B7791F", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>
                    💡 Recommended Next Capability: <strong>{teamSimulation.next_best_skill.skill}</strong> (+{teamSimulation.next_best_skill.potential_coverage_boost_pct}%)
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{ width: "100%", height: 6, background: "#E4E1DA", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${teamSimulation.overall_team_coverage_pct}%`,
                    background: teamSimulation.overall_team_coverage_pct >= 50 ? "#2E7D5B" : "#B7791F",
                    borderRadius: 999,
                    transition: "width 0.4s ease"
                  }}
                />
              </div>

              {/* Team Coverage Synthesis */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>
                    TEAM STRENGTHS
                  </div>
                  <div style={{ fontSize: 12, color: "#162A43", fontWeight: 600 }}>
                    {selectedTeammates.length > 0 ? "Cross-Functional Architecture" : "Solo Builder (Core Strengths)"}
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                    {selectedTeammates.length > 0 ? `${selectedTeammates.length + 1} synchronized developers` : "Select teammates to expand role coverage"}
                  </div>
                </div>

                <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>
                    ROLE COVERAGE
                  </div>
                  <div style={{ fontSize: 12, color: "#162A43", fontWeight: 600 }}>
                    {teamSimulation.overall_team_coverage_pct >= 60 ? "Balanced Team" : "Forming Syndicate"}
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                    Roles: Systems Architect, Frontend/API, Data/ML
                  </div>
                </div>

                <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 10, color: "#B7791F", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>
                    TEAM RISKS
                  </div>
                  <div style={{ fontSize: 12, color: "#162A43", fontWeight: 600 }}>
                    {teamSimulation.next_best_skill ? `Gap: ${teamSimulation.next_best_skill.skill}` : "Zero High-Severity Gaps"}
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                    Derived from official requirements
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Opted-In Teammates Cards */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43", marginBottom: 10 }}>
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
                      background: isSelected ? "#EFF4FE" : "#FFFFFF",
                      border: isSelected ? "1px solid #356AE6" : "1px solid #E4E1DA",
                      borderRadius: 8,
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 7, background: "#F6F5F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                            {teammate.avatar || "🚀"}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>{teammate.name}</div>
                            <div style={{ fontSize: 11, color: "#667085" }}>{(teammate.target_roles || []).join(", ")}</div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B" }}>
                            {(teammate.covered_gaps || []).length > 0 
                              ? `Fills ${(teammate.covered_gaps || []).length} gap${(teammate.covered_gaps || []).length > 1 ? "s" : ""}`
                              : "Complementary"}
                          </div>
                          <div style={{ fontSize: 10, color: "#667085", fontWeight: 600 }}>EVIDENCE FIT</div>
                        </div>
                      </div>

                      {/* Gaps Covered */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
                          PLUGS YOUR CAPABILITY GAPS:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(teammate.covered_gaps || []).map((g: string, gi: number) => (
                            <span key={gi} style={{ fontSize: 10, padding: "2px 7px", background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", borderRadius: 4, fontWeight: 600 }}>
                              ✓ {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: "#667085", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 6, padding: "8px 10px", lineHeight: 1.4 }}>
                        💬 {teammate.mutual_growth_narrative}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => toggleTeammate(teammate.candidate_id)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: 7,
                          border: isSelected ? "1px solid #F8C8C8" : "none",
                          background: isSelected ? "#FDF2F2" : "#356AE6",
                          color: isSelected ? "#C24141" : "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {isSelected ? "✕ Remove from Simulator" : "+ Add to Simulator"}
                      </button>

                      <button
                        onClick={() => handleSendTeamInvite(teammate.candidate_id, teammate.name)}
                        disabled={inviteSent}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 7,
                          border: "1px solid #E4E1DA",
                          background: inviteSent ? "#EAF4EE" : "#FAF9F6",
                          color: inviteSent ? "#2E7D5B" : "#162A43",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: inviteSent ? "default" : "pointer"
                        }}
                      >
                        {inviteSent ? "✓ Invite Sent" : "Invite"}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(22, 42, 67, 0.45)", backdropFilter: "blur(6px)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, width: "100%", maxWidth: 740, maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(22, 42, 67, 0.15)" }}>
            <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid #E4E1DA", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#FAF9F6", zIndex: 5 }}>
              <div>
                <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  EVIDENCE-FIRST PROVENANCE
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#162A43" }}>
                  Why Cognalyze Recommended This Opportunity
                </div>
              </div>
              <button
                onClick={() => setShowWhyMatchModal(false)}
                style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#667085", width: 28, height: 28, borderRadius: 6, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.5, background: "#EFF4FE", padding: "10px 14px", borderRadius: 7, border: "1px solid #D2E0FB" }}>
                Every recommendation claim is traceable to your verified artifacts, declared goals, or official opportunity terms. No AI-manufactured statistics.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(fitEvidence?.provenance || []).map((p, idx) => (
                  <div key={idx} style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6" }}>
                        {idx + 1}. {p.category}
                      </span>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 600, background: p.evidenceLabel === "✓ Verified" ? "#EAF4EE" : p.evidenceLabel === "◐ User Declared" ? "#FEF7ED" : "#EFF4FE", color: p.evidenceLabel === "✓ Verified" ? "#2E7D5B" : p.evidenceLabel === "◐ User Declared" ? "#B7791F" : "#356AE6", border: `1px solid ${p.evidenceLabel === "✓ Verified" ? "#C8E4D3" : p.evidenceLabel === "◐ User Declared" ? "#F8D8A7" : "#D2E0FB"}` }}>
                        {p.evidenceLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#162A43", marginBottom: 4 }}>
                      {p.claim}
                    </div>
                    <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.5 }}>
                      <strong>Proof / Source:</strong> {p.evidence}
                    </div>
                    <div style={{ fontSize: 10, color: "#98A2B3", marginTop: 4 }}>
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
                    color: "#FFFFFF",
                    background: "#356AE6",
                    padding: "6px 14px",
                    borderRadius: 7,
                    textDecoration: "none",
                    fontWeight: 600
                  }}
                >
                  Manage Student DNA →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: 6-AGENT COUNCIL REVIEW ── */}
      {showCouncilModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(22, 42, 67, 0.45)", backdropFilter: "blur(6px)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, width: "100%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(22, 42, 67, 0.15)" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid #E4E1DA", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#FAF9F6", zIndex: 5 }}>
              <div>
                <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  6-AGENT COUNCIL REVIEW
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#162A43" }}>
                  {evaluatedProjectTitle || "Problem Blueprint Evaluation"}
                </div>
              </div>

              <button
                onClick={() => setShowCouncilModal(false)}
                style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#667085", width: 28, height: 28, borderRadius: 6, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              {councilEvaluating && (
                <div style={{ padding: "3rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, border: "3px solid #E4E1DA", borderTopColor: "#356AE6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#162A43" }}>
                    {councilProgress}
                  </div>
                  <div style={{ fontSize: 12, color: "#667085", maxWidth: 480 }}>
                    Our 6 analytical agents are evaluating the problem statement across problem validity, user impact, technical feasibility, market gap, operational viability, and judge rubric alignment.
                  </div>
                </div>
              )}

              {!councilEvaluating && activeCouncilResult && (
                <>
                  {/* Verdict Banner */}
                  <div style={{
                    padding: "1.25rem",
                    borderRadius: 8,
                    border: String(activeCouncilResult.overall_verdict).includes("HIGH CONVICTION") || String(activeCouncilResult.overall_verdict).includes("100% WORTH IT")
                      ? "1px solid #C8E4D3"
                      : String(activeCouncilResult.overall_verdict).includes("PIVOT")
                      ? "1px solid #F8D8A7"
                      : "1px solid #F8C8C8",
                    background: String(activeCouncilResult.overall_verdict).includes("HIGH CONVICTION") || String(activeCouncilResult.overall_verdict).includes("100% WORTH IT")
                      ? "#EAF4EE"
                      : String(activeCouncilResult.overall_verdict).includes("PIVOT")
                      ? "#FEF7ED"
                      : "#FDF2F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 14
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#667085", marginBottom: 4 }}>
                        COUNCIL CONSENSUS VERDICT
                      </div>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: String(activeCouncilResult.overall_verdict).includes("HIGH CONVICTION") || String(activeCouncilResult.overall_verdict).includes("100% WORTH IT")
                          ? "#2E7D5B"
                          : String(activeCouncilResult.overall_verdict).includes("PIVOT")
                          ? "#B7791F"
                          : "#C24141",
                        marginBottom: 6
                      }}>
                        {activeCouncilResult.overall_verdict}
                      </div>
                      <p style={{ fontSize: 13, color: "#17191C", margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
                        {activeCouncilResult.executive_summary}
                      </p>
                    </div>

                    {activeCouncilResult.validated_problem && (
                      <div style={{ background: "#FFFFFF", padding: "10px 14px", borderRadius: 7, border: "1px solid #E4E1DA", maxWidth: 300 }}>
                        <div style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700, marginBottom: 2 }}>VALIDATED PROBLEM</div>
                        <div style={{ fontSize: 11, color: "#17191C", lineHeight: 1.4 }}>{activeCouncilResult.validated_problem}</div>
                      </div>
                    )}
                  </div>

                  {/* Council Consensus Breakdown */}
                  {activeCouncilResult.consensus && (
                    <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                        COUNCIL CONSENSUS FINDINGS
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                        {activeCouncilResult.consensus.strongest_evidence && (
                          <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#2E7D5B" }}>
                            <strong>Strongest Evidence:</strong> {activeCouncilResult.consensus.strongest_evidence}
                          </div>
                        )}
                        {activeCouncilResult.consensus.major_concern && (
                          <div style={{ background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#C24141" }}>
                            <strong>Major Concern:</strong> {activeCouncilResult.consensus.major_concern}
                          </div>
                        )}
                        {activeCouncilResult.consensus.technical_risk && (
                          <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#B7791F" }}>
                            <strong>Technical Risk:</strong> {activeCouncilResult.consensus.technical_risk}
                          </div>
                        )}
                        {activeCouncilResult.consensus.recommended_change && (
                          <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#356AE6" }}>
                            <strong>Recommended Pivot:</strong> {activeCouncilResult.consensus.recommended_change}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 6 Analytical Agent Details with FACT / INFERENCE / CONCERN / RECOMMENDATION */}
                  <div>
                    <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>
                      🤖 INDEPENDENT AGENT ANALYSES ({activeCouncilResult.agents.length} Roles)
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {activeCouncilResult.agents.map((ag, aIdx) => (
                        <div
                          key={aIdx}
                          style={{
                            background: "#FAF9F6",
                            border: "1px solid #E4E1DA",
                            borderRadius: 8,
                            padding: "14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 18 }}>{ag.agent_avatar}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>
                                  {ag.agent_name}
                                </div>
                                <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 500 }}>
                                  {ag.agent_role}
                                </div>
                              </div>
                            </div>

                            <span style={{ fontSize: 11, padding: "2px 8px", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 5, color: "#162A43", fontWeight: 600 }}>
                              {ag.verdict}
                            </span>
                          </div>

                          {ag.fact && (
                            <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5, background: "#FFFFFF", padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                              <strong style={{ color: "#356AE6" }}>FACT: </strong> {ag.fact}
                            </div>
                          )}

                          {ag.inference && (
                            <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5, background: "#FFFFFF", padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                              <strong style={{ color: "#162A43" }}>INFERENCE: </strong> {ag.inference}
                            </div>
                          )}

                          {ag.concern && (
                            <div style={{ fontSize: 12, color: "#C24141", lineHeight: 1.5, background: "#FDF2F2", padding: "6px 10px", borderRadius: 6, border: "1px solid #F8C8C8" }}>
                              <strong style={{ color: "#C24141" }}>CONCERN: </strong> {ag.concern}
                            </div>
                          )}

                          {ag.recommendation && (
                            <div style={{ fontSize: 12, color: "#2E7D5B", lineHeight: 1.5, background: "#EAF4EE", padding: "6px 10px", borderRadius: 6, border: "1px solid #C8E4D3" }}>
                              <strong style={{ color: "#2E7D5B" }}>RECOMMENDATION: </strong> {ag.recommendation}
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
