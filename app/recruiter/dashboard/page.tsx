"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "matrix"
    | "jd"
    | "decisions"
    | "questions"
    | "analytics"
  >("overview");

  const [blindMode, setBlindMode] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  // Hiring Funnel metrics
  const funnel = [
    { label: "Active Roles", value: "4 Open", change: "2 Engineering, 2 Product" },
    { label: "Total Candidates", value: "184 Ingested", change: "Synced via ATS & Portals" },
    { label: "Evidence Verified", value: "48 Qualified", change: "26% Verification rate" },
    { label: "Interview Stage", value: "14 In Process", change: "Socratic Proctored Rounds" },
    { label: "Final Decision", value: "3 Ready for Offer", change: "Human review certified" },
  ];

  // Multi-Candidate Comparison Matrix Data
  const candidateMatrix = [
    {
      id: "cand-1",
      name: "Alex Rivera",
      role: "Staff Systems Engineer (L5)",
      match: 91,
      mustHaves: ["Python", "Concurrency", "Distributed DB"],
      evidence: "3 verified repos, 84 commits, 14 merged PRs",
      gaps: ["AWS Lambda"],
      experience: "3 YOE backend",
      projects: "Distributed Task Queue, Multi-Threaded Cache",
      priority: "High",
      vibeRisk: "4% (Organic)",
      fitSummary: "Exceptional system architecture and concurrency knowledge. Commit history reflects authentic multi-month development.",
      concerns: "Limited public serverless/AWS deployment evidence.",
    },
    {
      id: "cand-2",
      name: "Priya Sharma",
      role: "Senior Backend Engineer (L4)",
      match: 84,
      mustHaves: ["Python", "Node.js", "Redis"],
      evidence: "1 verified repo, LeetCode Knight (Rating 2,040)",
      gaps: ["PostgreSQL Sharding"],
      experience: "2 YOE full-stack",
      projects: "Real-time Telemetry Service",
      priority: "Medium",
      vibeRisk: "8% (Low)",
      fitSummary: "Strong algorithmic depth and clean API design. Excellent code structure.",
      concerns: "Needs verification on large-scale database connection pooling under high load.",
    },
    {
      id: "cand-3",
      name: "Rohan Mehta",
      role: "Systems Engineer (L4)",
      match: 76,
      mustHaves: ["Python", "React", "Docker"],
      evidence: "2 repos (single-burst commit timeline)",
      gaps: ["Distributed Systems", "Concurrency"],
      experience: "1.5 YOE frontend & node",
      projects: "Personal Portfolio & Blog CMS",
      priority: "Hold",
      vibeRisk: "42% (Moderate)",
      fitSummary: "Solid front-end engineering foundation. Basic backend knowledge.",
      concerns: "Single-day commit bursts suggest potential AI boilerplate dump without iterative testing.",
    },
  ];

  const getCandidateName = (cand: any) => {
    if (!blindMode) return cand.name;
    return `Candidate #${cand.id.replace(/[^0-9]/g, "").padStart(4, "0")}`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", color: "#18181B" }}>
      {/* ── 1. GLOBAL NAVIGATION ── */}
      <AppNav role="recruiter" />

      {/* ── 2. SUB-HEADER & NAVIGATION TABS ── */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E7E5E4",
          position: "sticky",
          top: 60,
          zIndex: 30,
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "overview", label: "Overview & Funnel" },
              { id: "matrix", label: "Multi-Candidate Matrix" },
              { id: "jd", label: "JD Intelligence" },
              { id: "decisions", label: "Decision Evidence Panel" },
              { id: "questions", label: "Question Generator" },
              { id: "analytics", label: "Hiring Analytics" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #18181B" : "2px solid transparent",
                  color: activeTab === tab.id ? "#18181B" : "#6B6B6B",
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  padding: "14px 12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 150ms ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Blind Screening Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 16 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#18181B",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={blindMode}
                onChange={(e) => setBlindMode(e.target.checked)}
                style={{ accentColor: "#176B5B", cursor: "pointer" }}
              />
              Blind Screening Mode (Mask PII)
            </label>
          </div>
        </div>
      </div>

      {/* ── 3. RECRUITER MAIN WORKSPACE ── */}
      <main
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "28px 20px 80px",
        }}
      >
        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW & FUNNEL                                  */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#176B5B", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  RECRUITER COMMAND CENTER
                </span>
                <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0", color: "#111111" }}>
                  Hiring Pipeline & Candidate Decisions
                </h1>
                <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 0" }}>
                  Evidence-based candidate qualification. Zero AI guesswork, zero keyword stuffing bias.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setActiveTab("matrix")}
                  style={{
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View Candidate Comparison Matrix
                </button>
              </div>
            </div>

            {/* Visual Hiring Funnel */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {funnel.map((step, idx) => (
                <div
                  key={step.label}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 8,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase" }}>
                    Stage 0{idx + 1} • {step.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#111111", margin: "6px 0 2px" }}>
                    {step.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#176B5B", fontWeight: 500 }}>
                    {step.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Two Column Layout: Action Items & Fast-Track Candidate Spotlight */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
              {/* Action Items Box */}
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#111111" }}>
                  Actions Requiring Human Recruiter Review
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { title: "Alex Rivera (Staff SWE)", reason: "Cleared Stage 4 with 91% match. Review final system design notes.", action: "Review Dossier" },
                    { title: "Priya Sharma (Senior Backend)", reason: "Passed CS Technical Round. Needs assignment of Hiring Manager interview.", action: "Assign Interviewer" },
                    { title: "Rohan Mehta (Systems SWE)", reason: "Vibe-code check flagged commit bursts. Requires code origin verification.", action: "Audit Commits" },
                  ].map((act) => (
                    <div
                      key={act.title}
                      style={{
                        padding: 14,
                        backgroundColor: "#FAFAF9",
                        border: "1px solid #E7E5E4",
                        borderRadius: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#18181B" }}>{act.title}</div>
                        <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{act.reason}</div>
                      </div>
                      <button
                        onClick={() => setActiveTab("matrix")}
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E7E5E4",
                          color: "#18181B",
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {act.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Roles Spotlight */}
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#111111" }}>
                  Active Job Specifications
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { role: "Staff Systems Engineer (L5)", team: "Infrastructure Concurrency", applicants: 48, qualified: 12 },
                    { role: "Senior Backend Engineer (L4)", team: "API Core & Billing", applicants: 62, qualified: 18 },
                    { role: "Cloud Platform Fellow", team: "Kubernetes & Telemetry", applicants: 74, qualified: 18 },
                  ].map((pos) => (
                    <div
                      key={pos.role}
                      style={{
                        padding: 14,
                        backgroundColor: "#FAFAF9",
                        border: "1px solid #E7E5E4",
                        borderRadius: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#18181B" }}>{pos.role}</div>
                        <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{pos.team}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#176B5B" }}>{pos.qualified} Verified</div>
                        <div style={{ fontSize: 11, color: "#6B6B6B" }}>of {pos.applicants} candidates</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 2: MULTI-CANDIDATE COMPARISON MATRIX                  */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "matrix" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                DECISION WORKSPACE
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Multi-Candidate Comparison Matrix
              </h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                Never make a decision on score alone. Inspect verified evidence, commit history density, and skill gaps.
              </p>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: "#FAFAF9", borderBottom: "1px solid #E7E5E4", color: "#6B6B6B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "14px 18px" }}>Candidate</th>
                    <th style={{ padding: "14px 18px" }}>Match</th>
                    <th style={{ padding: "14px 18px" }}>Must-Have Evidence</th>
                    <th style={{ padding: "14px 18px" }}>Identified Gaps</th>
                    <th style={{ padding: "14px 18px" }}>Vibe-Code Risk</th>
                    <th style={{ padding: "14px 18px" }}>Priority</th>
                    <th style={{ padding: "14px 18px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {candidateMatrix.map((cand) => (
                    <tr
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand)}
                      style={{
                        borderBottom: "1px solid #E7E5E4",
                        cursor: "pointer",
                        backgroundColor: selectedCandidate?.id === cand.id ? "#F5F5F4" : "transparent",
                      }}
                    >
                      <td style={{ padding: "16px 18px", fontWeight: 600 }}>
                        {getCandidateName(cand)}
                        <div style={{ fontSize: 12, color: "#6B6B6B", fontWeight: 400 }}>{cand.role}</div>
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <span
                          style={{
                            backgroundColor: cand.match >= 85 ? "#EBF5F3" : "#FEF3C7",
                            color: cand.match >= 85 ? "#176B5B" : "#B45309",
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          {cand.match}%
                        </span>
                      </td>
                      <td style={{ padding: "16px 18px", color: "#18181B" }}>
                        <div>{cand.mustHaves.join(", ")}</div>
                        <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 2 }}>{cand.evidence}</div>
                      </td>
                      <td style={{ padding: "16px 18px", color: "#B45309", fontWeight: 500 }}>
                        {cand.gaps.join(", ")}
                      </td>
                      <td style={{ padding: "16px 18px", color: cand.vibeRisk.includes("Low") || cand.vibeRisk.includes("Organic") ? "#176B5B" : "#B45309", fontWeight: 600 }}>
                        {cand.vibeRisk}
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <span
                          style={{
                            backgroundColor: cand.priority === "High" ? "#18181B" : "#F5F5F4",
                            color: cand.priority === "High" ? "#FFFFFF" : "#18181B",
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {cand.priority}
                        </span>
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(cand);
                            setActiveTab("decisions");
                          }}
                          style={{
                            backgroundColor: "transparent",
                            border: "1px solid #E7E5E4",
                            color: "#18181B",
                            padding: "5px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Decision Dossier ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 3: JD INTELLIGENCE                                    */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "jd" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                STRUCTURED SPECIFICATION
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Job Description Intelligence & Role Signals
              </h2>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#176B5B", textTransform: "uppercase", marginBottom: 6 }}>
                    MUST-HAVE COMPETENCIES
                  </div>
                  <ul style={{ fontSize: 13, color: "#374151", paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <li>Python (FastAPI / AsyncIO concurrency)</li>
                    <li>Distributed Relational Storage (PostgreSQL pool tuning)</li>
                    <li>Redis / In-Memory caching architectures</li>
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", marginBottom: 6 }}>
                    GOOD-TO-HAVE CAPABILITIES
                  </div>
                  <ul style={{ fontSize: 13, color: "#374151", paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <li>AWS Lambda Serverless Event Streams</li>
                    <li>Docker containerized CI/CD orchestration</li>
                    <li>Open-source contribution track record</li>
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", marginBottom: 6 }}>
                    ROLE SIGNALS & EXPECTATIONS
                  </div>
                  <ul style={{ fontSize: 13, color: "#374151", paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <li>Senior Engineering Scope (L5 equivalent)</li>
                    <li>Trade-off communication during incident reviews</li>
                    <li>Zero tolerance for unverified code assertions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 4: DECISION EVIDENCE PANEL                            */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "decisions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                STRUCTURED RECOMMENDATION
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Hiring Decision Dossier: {selectedCandidate ? getCandidateName(selectedCandidate) : "Alex Rivera"}
              </h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                Transparent pros, identified concerns, and actionable next steps.
              </p>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 24 }}>
                <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, padding: 18, backgroundColor: "#EBF5F3" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#176B5B", textTransform: "uppercase", marginBottom: 6 }}>
                    OVERALL FIT VERDICT
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#111111", marginBottom: 6 }}>
                    Strong Technical Alignment (91% Match)
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    "Demonstrates verifiable production concurrency patterns. Genuine multi-month git timeline rules out vibe-coding."
                  </div>
                </div>

                <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, padding: 18, backgroundColor: "#FAFAF9" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#B45309", textTransform: "uppercase", marginBottom: 6 }}>
                    POTENTIAL CONCERNS
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#111111", marginBottom: 6 }}>
                    Missing Serverless Cloud Evidence
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    "Resume mentions AWS Lambda, but public repositories show only local Docker deployment without cloud terraform/IaC scripts."
                  </div>
                </div>
              </div>

              {/* Recommended Next Step Box */}
              <div style={{ border: "1px solid #18181B", borderRadius: 8, padding: 20, backgroundColor: "#FFFFFF" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#18181B", textTransform: "uppercase", marginBottom: 6 }}>
                  RECOMMENDED NEXT STEP
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111111", marginBottom: 6 }}>
                  Advance to Live System Design Whiteboard Round
                </div>
                <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 16 }}>
                  Focus assessment specifically on event-driven decoupling and cache invalidation under network partitions.
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    style={{
                      backgroundColor: "#18181B",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Confirm Stage Clearance (Advance Candidate)
                  </button>
                  <button
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: "#18181B",
                      border: "1px solid #E7E5E4",
                      borderRadius: 6,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Request Additional Code Sample
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 5: QUESTION GENERATOR                                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "questions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                EVIDENCE-GROUNDED INTERVIEW PROBES
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Tailored Interview Questions for Alex Rivera
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                {
                  q: "In your distributed task queue repository, how did you prevent race conditions between workers claiming the same task without degrading Redis throughput?",
                  reason: "Tests concurrency ownership directly from candidate's code.",
                  evaluates: "Distributed lock renewals, redlock algorithm, atomic Redis lua scripts.",
                  evidence: "Repo: distributed-worker-queue • Commit 3e9500d",
                },
                {
                  q: "Your resume claims a 42% latency reduction in PostgreSQL queries. Walk me through the exact indexing or connection pool change that yielded that outcome.",
                  reason: "Validates quantified metric truthfulness.",
                  evaluates: "Query plan analysis (EXPLAIN ANALYZE), pgBouncer tuning, B-tree indexes.",
                  evidence: "Experience: Software Engineering Fellow",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: 22,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#176B5B", textTransform: "uppercase", marginBottom: 6 }}>
                    PROBE {idx + 1}
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px", color: "#111111" }}>
                    "{item.q}"
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#4B5563" }}>
                    <div>• <strong>What it tests:</strong> {item.evaluates}</div>
                    <div>• <strong>Why ask this:</strong> {item.reason}</div>
                    <div>• <strong>Candidate Evidence Link:</strong> {item.evidence}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 6: HIRING ANALYTICS                                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                PIPELINE VELOCITY
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Recruiter Analytics & Quality of Hire
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>Time to Shortlist</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#111111", margin: "8px 0" }}>2.4 Days</div>
                <div style={{ fontSize: 12, color: "#176B5B" }}>↓ 72% faster than resume-screening baseline</div>
              </div>
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>Candidate Conversion</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#111111", margin: "8px 0" }}>68.4%</div>
                <div style={{ fontSize: 12, color: "#176B5B" }}>Interview pass-rate of evidence-qualified talent</div>
              </div>
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>Top Demanded Skill</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#18181B", margin: "8px 0" }}>Distributed Systems</div>
                <div style={{ fontSize: 12, color: "#6B6B6B" }}>Featured in 82% of active engineering roles</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
