"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { ParsedJobRequirements } from "@/lib/intelligence/jd-extractor";

export default function RecruiterJobsPage() {
  const [jdText, setJdText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedJd, setParsedJd] = useState<ParsedJobRequirements | null>(null);
  const [rewriteNotification, setRewriteNotification] = useState<string | null>(null);
  const [simulatedRelaxations, setSimulatedRelaxations] = useState<Record<number, boolean>>({});

  const sampleJds = [
    {
      title: "Senior Backend Engineer (Calibration Nuance)",
      label: "Sample 1: Senior Backend",
      text: `Role: Senior Backend Engineer
Company: ScalePay Distributed Systems
Experience: 3-6 years of professional software engineering experience
About the Role:
We are looking for a Senior Backend Engineer to architect mission-critical payment settlement engines. We are more interested in demonstrated engineering ability and architectural judgment than the sheer number of technologies listed on your resume.

Key Responsibilities:
- Design distributed ledger settlement pipelines capable of processing 10,000 transactions per second.
- Reason about trade-offs, fault tolerance, and consensus in high-throughput database systems.
- Identify and resolve performance, reliability, and scalability bottlenecks across microservices.

Core Must-Have Requirements:
- 3+ years experience building backend services in Go, Java, or C++.
- Strong proficiency in distributed systems, concurrency primitives, and ACID transaction boundaries.
- Strong understanding of data structures and algorithms.

Preferred Qualifications:
- Experience with Apache Kafka, Redis, Docker, and Kubernetes.
- Familiarity with AWS Aurora and Prometheus telemetry.

Deal-Breakers:
- Inability to explain failure modes in distributed systems or absence of production backend experience.`
    },
    {
      title: "Research ML Scientist (Theory Focus)",
      label: "Sample 2: Research Scientist",
      text: `Role: Senior Research Scientist — Generative AI
Company: DeepMind Foundation Labs
Experience: 2-5 years
About the Role:
We are looking for a Research Scientist to invent novel transformer architectures and multi-modal generative pretraining paradigms. This role focuses on exploratory mathematical research, theoretical scaling laws, and publishing at premier peer-reviewed venues (NeurIPS, ICML, ICLR).

Core Responsibilities:
- Formulate original mathematical hypotheses on latent space representations and diffusion-based sampling dynamics.
- Design proof-of-concept architectures evaluated on novel synthetic benchmarks.
- Author top-tier academic publications and present research at international computer science symposiums.

Must-Have Requirements:
- Ph.D. in Computer Science, Applied Mathematics, or Machine Learning with first-author papers at NeurIPS/ICML.
- Strong mathematical foundations in stochastic calculus, optimization theory, and linear algebra.
- Fluent implementation of novel algorithmic architectures in PyTorch or JAX.

Nice-to-Have:
- Postdoctoral research fellowship experience or best paper award citations.

Deal-Breakers:
- Candidates seeking routine enterprise software deployment or CRUD backend development.`
    },
    {
      title: "Hard Conflicts & Extreme Ambiguity",
      label: "Sample 3: Hard Conflicts & Vague",
      text: `Role: Entry-Level Fullstack Wizard
Company: QuickLaunch Disruptor
Experience: Entry-level position, 0-1 years experience
Workplace Policy: 100% Fully Remote position.
Office Attendance: Must work from Bengaluru headquarters office 5 days a week for in-person whiteboarding.

Key Requirements:
- Must have 5+ years of production Kubernetes cluster management and AWS cloud architecture.
- Must have strong experience with AI and deep knowledge of everything machine learning.
- Candidate must be a recent college graduate ready to learn.
- Must possess rockstar guru vibes and high energy.
- Needs strong communication skills.`
    }
  ];

  const handleParse = async () => {
    if (!jdText.trim()) return;
    setParsing(true);
    setError(null);
    setRewriteNotification(null);
    setSimulatedRelaxations({});
    try {
      const res = await fetch("/api/recruiter/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data: ParsedJobRequirements = await res.json();
      setParsedJd(data);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("cognalyze_active_jd", jdText);
      }
    } catch (err: any) {
      console.error("Error extracting JD requirements:", err);
      setError(err?.message || "Failed to analyze job description.");
    } finally {
      setParsing(false);
    }
  };

  const handleApplyRewrite = (quoted: string, rewrite: string) => {
    if (!quoted || !rewrite) return;
    const cleanQuote = quoted.replace(/^["']|["']$/g, "").trim();
    if (jdText.includes(cleanQuote)) {
      const updated = jdText.replace(cleanQuote, rewrite);
      setJdText(updated);
      setRewriteNotification(`Applied Rewrite: Substituted "${cleanQuote}" with "${rewrite}"`);
      setTimeout(() => setRewriteNotification(null), 4000);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("cognalyze_active_jd", updated);
      }
    } else {
      setRewriteNotification(`Could not find exact text "${cleanQuote}" in editor.`);
      setTimeout(() => setRewriteNotification(null), 3000);
    }
  };

  const handleMatchCandidatesClick = () => {
    if (typeof window !== "undefined" && jdText.trim()) {
      sessionStorage.setItem("cognalyze_active_jd", jdText);
    }
  };

  const hardConflicts = (parsedJd?.tensions || []).filter(t => t.severity === "hard_conflict");
  const potentialTensions = (parsedJd?.tensions || []).filter(t => t.severity === "potential_tension");
  const qualityScore = parsedJd?.quality_audit?.score ?? 75;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(168,85,247,0.2)", color: "#d8b4fe", fontWeight: 800 }}>
                JD INTELLIGENCE ENGINE v2.1
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Strategy Audit • Fact vs Inference • What-If Simulation
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              💼 Job Description Strategy & Calibration Audit
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 780, lineHeight: 1.5 }}>
              Audit hiring feasibility before screening applicants: evaluate 100% adaptive Role DNA, distinguish hard conflicts from calibration tensions, verify unstated inferences, and optimize candidate pool yield.
            </p>
          </div>

          <Link
            href="/recruiter/candidates"
            onClick={handleMatchCandidatesClick}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
              color: "white",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 14px rgba(168,85,247,0.3)"
            }}
          >
            Match Candidates to Criteria ➔
          </Link>
        </div>

        {rewriteNotification && (
          <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 8, background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.4)", color: "#86efac", fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
            <span>✨</span>
            <span>{rewriteNotification}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 500px), 1fr))", gap: 24, alignItems: "start" }}>
          
          {/* LEFT: INPUT FORM */}
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                Job Description Source Text:
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {sampleJds.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setJdText(s.text);
                      setError(null);
                    }}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#cbd5e1",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste complete role description, responsibilities, requirements, and qualifications here..."
              rows={18}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 10,
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#f1f5f9",
                fontSize: 12.5,
                lineHeight: 1.55,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "monospace"
              }}
            />

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {jdText.length} characters • {jdText.split(/\s+/).filter(Boolean).length} words
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {jdText && (
                  <button
                    onClick={() => {
                      setJdText("");
                      setParsedJd(null);
                      setError(null);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                      color: "#94a3b8",
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleParse}
                  disabled={parsing || !jdText.trim()}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    border: "none",
                    background: parsing ? "rgba(168,85,247,0.4)" : "linear-gradient(135deg, #a855f7, #6366f1)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: parsing || !jdText.trim() ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.25)"
                  }}
                >
                  {parsing ? "Auditing Strategy with AI..." : "Audit Hiring Strategy ➔"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 12 }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* RIGHT: STRUCTURED REQUIREMENTS DOSSIER */}
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>
                Hiring Strategy & Feasibility Dossier
              </h3>
              {parsedJd && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}>
                    ✓ Citations Verified
                  </span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(59,130,246,0.15)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }}>
                    100% DNA Balance
                  </span>
                </div>
              )}
            </div>

            {!parsedJd ? (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>No Hiring Strategy Audited Yet</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, maxWidth: 380, margin: "4px auto 0" }}>
                  Select a sample above or paste your custom job description, then click "Audit Hiring Strategy" to run the 3-tier calibration audit.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                
                {/* ── LAYER 1: 10-SECOND EXECUTIVE SUMMARY ── */}
                <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#c084fc", fontWeight: 800 }}>AUDITED ROLE & PROFILE:</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{parsedJd.title}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{parsedJd.company} • Experience: {parsedJd.minYearsExperience}–{parsedJd.maxYearsExperience} Years</div>
                    </div>

                    {/* Quality Gauge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>JD QUALITY</div>
                        <div style={{ fontSize: 10, color: qualityScore >= 80 ? "#4ade80" : qualityScore >= 65 ? "#fbbf24" : "#f87171" }}>
                          {qualityScore >= 80 ? "High Clarity" : qualityScore >= 65 ? "Needs Calibration" : "High Sourcing Risk"}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: qualityScore >= 80 ? "#4ade80" : qualityScore >= 65 ? "#fbbf24" : "#f87171",
                        minWidth: 42,
                        textAlign: "center"
                      }}>
                        {qualityScore}
                      </div>
                    </div>
                  </div>

                  {/* 10-Second Quick Metric Pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: hardConflicts.length > 0 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${hardConflicts.length > 0 ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`, padding: "6px 10px", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: hardConflicts.length > 0 ? "#f87171" : "#94a3b8" }}>{hardConflicts.length}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Hard Conflicts</div>
                    </div>

                    <div style={{ background: potentialTensions.length > 0 ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${potentialTensions.length > 0 ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)"}`, padding: "6px 10px", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: potentialTensions.length > 0 ? "#fbbf24" : "#94a3b8" }}>{potentialTensions.length}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Potential Tensions</div>
                    </div>

                    <div style={{ background: parsedJd.ambiguous_requirements.length > 0 ? "rgba(250,204,21,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${parsedJd.ambiguous_requirements.length > 0 ? "rgba(250,204,21,0.3)" : "rgba(255,255,255,0.06)"}`, padding: "6px 10px", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: parsedJd.ambiguous_requirements.length > 0 ? "#facc15" : "#94a3b8" }}>{parsedJd.ambiguous_requirements.length}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Ambiguities</div>
                    </div>

                    <div style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", padding: "6px 10px", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#60a5fa" }}>{parsedJd.audited_requirements.length}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Audited Skills</div>
                    </div>
                  </div>

                  {/* Role Summary Quote */}
                  <p style={{ fontSize: 12.5, color: "#e2e8f0", margin: 0, lineHeight: 1.5, fontStyle: "italic", borderLeft: "3px solid #a855f7", paddingLeft: 10 }}>
                    "{parsedJd.role_summary}"
                  </p>
                </div>

                {/* ── LAYER 2: ROLE DNA (GUARANTEED 100%) ── */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: "#a855f7", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      🧬 Role DNA — Weighted Evaluation Dimensions (100% Target)
                    </div>
                    <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>
                      Sum: {parsedJd.evaluation_dimensions.reduce((a, b) => a + b.weight_pct, 0)}%
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {parsedJd.evaluation_dimensions.map((dim, idx) => (
                      <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#f8fafc" }}>
                            {dim.dimension}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 900, color: "#c084fc", background: "rgba(168,85,247,0.18)", padding: "2px 8px", borderRadius: 6 }}>
                            {dim.weight_pct}%
                          </span>
                        </div>
                        
                        <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                          <div
                            style={{
                              width: `${Math.min(100, dim.weight_pct)}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, #a855f7, #6366f1)",
                              borderRadius: 99
                            }}
                          />
                        </div>

                        <div style={{ fontSize: 11.5, color: "#cbd5e1", lineHeight: 1.45 }}>
                          <strong style={{ color: "#94a3b8" }}>Evidence & Justification:</strong> {dim.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 3-TIER CONTRADICTION & TENSION DETECTOR ── */}
                {parsedJd.tensions && parsedJd.tensions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 800, textTransform: "uppercase" }}>
                      ⚖️ Contradiction & Tension Detector ({parsedJd.tensions.length})
                    </div>

                    {parsedJd.tensions.map((t, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: t.severity === "hard_conflict" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                          border: `1px solid ${t.severity === "hard_conflict" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                          borderRadius: 8,
                          padding: "12px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: t.severity === "hard_conflict" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)",
                            color: t.severity === "hard_conflict" ? "#fca5a5" : "#fde68a"
                          }}>
                            {t.severity === "hard_conflict" ? "🔴 HARD CONFLICT" : "🟡 POTENTIAL CALIBRATION TENSION"}
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0" }}>
                          <div style={{ fontSize: 11, background: "rgba(0,0,0,0.3)", padding: 6, borderRadius: 4, color: "#cbd5e1" }}>
                            <strong>Statement A:</strong> "{t.statement_a}"
                          </div>
                          <div style={{ fontSize: 11, background: "rgba(0,0,0,0.3)", padding: 6, borderRadius: 4, color: "#cbd5e1" }}>
                            <strong>Statement B:</strong> "{t.statement_b}"
                          </div>
                        </div>

                        <div style={{ fontSize: 11.5, color: "#e2e8f0", marginTop: 4 }}>
                          <strong>Analysis:</strong> {t.why_tension}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#67e8f9", marginTop: 4 }}>
                          <strong>Recommended Recruiter Action:</strong> {t.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── AMBIGUITY DETECTOR WITH 1-CLICK REWRITES ── */}
                {parsedJd.ambiguous_requirements && parsedJd.ambiguous_requirements.length > 0 && (
                  <div style={{ background: "rgba(250, 204, 21, 0.08)", border: "1px solid rgba(250, 204, 21, 0.25)", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, color: "#facc15", fontWeight: 800, marginBottom: 8 }}>
                      ⚠️ AMBIGUITY DETECTOR — Actionable Rewrites ({parsedJd.ambiguous_requirements.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {parsedJd.ambiguous_requirements.map((amb, idx) => (
                        <div key={idx} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "10px 12px", borderLeft: "3px solid #facc15" }}>
                          <div style={{ fontSize: 12, color: "#fef08a", fontWeight: 700 }}>
                            Vague Phrase: "{amb.quoted_text}"
                          </div>
                          <div style={{ fontSize: 11.5, color: "#e2e8f0", margin: "4px 0" }}>
                            <strong style={{ color: "#fbbf24" }}>Why Ambiguous:</strong> {amb.why_ambiguous}
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8, background: "rgba(255,255,255,0.04)", padding: "6px 10px", borderRadius: 6 }}>
                            <div style={{ fontSize: 11.5, color: "#86efac", flex: 1, minWidth: 200 }}>
                              <strong>Drop-in Rewrite:</strong> "{amb.suggested_rewrite}"
                            </div>
                            <button
                              onClick={() => handleApplyRewrite(amb.quoted_text, amb.suggested_rewrite)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: "linear-gradient(135deg, #10b981, #059669)",
                                color: "white",
                                border: "none",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              Apply Rewrite ✨
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── FACT VS INFERENCE (IMPLICIT EXPECTATIONS) ── */}
                {parsedJd.implicit_expectations && parsedJd.implicit_expectations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 800, marginBottom: 8 }}>
                      💡 FACT VS INFERENCE AUDIT (Implicit Expectations):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {parsedJd.implicit_expectations.map((imp, idx) => (
                        <div key={idx} style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#bae6fd" }}>
                              {imp.expectation}
                            </span>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: imp.confidence === "Explicit" ? "rgba(34,197,94,0.2)" : imp.confidence === "Strong Inference" ? "rgba(56,189,248,0.2)" : "rgba(168,85,247,0.2)",
                              color: imp.confidence === "Explicit" ? "#86efac" : imp.confidence === "Strong Inference" ? "#7dd3fc" : "#d8b4fe"
                            }}>
                              {imp.confidence}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            <strong>Inferred From:</strong> "{imp.inferred_from}"
                          </div>
                          <div style={{ fontSize: 11, color: "#a5f3fc", marginTop: 3 }}>
                            <strong>Hiring Team Action:</strong> {imp.recruiter_action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── AUDITED REQUIREMENTS & CRITICALITY MATRIX ── */}
                <div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 800, marginBottom: 8 }}>
                    📋 REQUIREMENT CRITICALITY & AUDIT MATRIX ({parsedJd.audited_requirements.length}):
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 8 }}>
                    {parsedJd.audited_requirements.map((req, idx) => (
                      <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{req.name}</span>
                          <span style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: req.criticality === "High" ? "rgba(239,68,68,0.2)" : req.criticality === "Medium" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)",
                            color: req.criticality === "High" ? "#fca5a5" : req.criticality === "Medium" ? "#fde68a" : "#86efac"
                          }}>
                            {req.criticality} Criticality
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: req.type.includes("Must") ? "#f87171" : "#38bdf8", fontWeight: 700 }}>
                          {req.type}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 3 }}>
                          {req.rationale}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── WHAT-IF HIRING CRITERIA SIMULATOR ── */}
                {parsedJd.what_if_options && parsedJd.what_if_options.length > 0 && (
                  <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 800, marginBottom: 4 }}>
                      🧠 WHAT-IF HIRING CRITERIA SIMULATOR
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>
                      Simulate candidate pool expansion and quality impact by adjusting non-critical constraints.
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {parsedJd.what_if_options.map((opt, idx) => {
                        const isRelaxed = !!simulatedRelaxations[idx];
                        return (
                          <div
                            key={idx}
                            style={{
                              background: isRelaxed ? "rgba(16, 185, 129, 0.12)" : "rgba(0,0,0,0.3)",
                              border: `1px solid ${isRelaxed ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.06)"}`,
                              borderRadius: 8,
                              padding: "8px 12px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 8
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 220 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: isRelaxed ? "#86efac" : "white" }}>
                                {opt.change_description}
                              </div>
                              <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>
                                {opt.reasoning}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 13, fontWeight: 900, color: "#34d399" }}>
                                  +{opt.pool_increase_pct}% Pool
                                </div>
                                <div style={{ fontSize: 9.5, color: opt.quality_impact === "Minimal Risk" ? "#86efac" : "#fbbf24" }}>
                                  {opt.quality_impact}
                                </div>
                              </div>
                              <button
                                onClick={() => setSimulatedRelaxations(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  background: isRelaxed ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.08)",
                                  border: `1px solid ${isRelaxed ? "#10b981" : "rgba(255,255,255,0.15)"}`,
                                  color: isRelaxed ? "#86efac" : "#cbd5e1",
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  cursor: "pointer"
                                }}
                              >
                                {isRelaxed ? "Simulated ✓" : "Simulate"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    Audited strategy ready for applicant screening
                  </span>
                  <Link
                    href="/recruiter/candidates"
                    onClick={handleMatchCandidatesClick}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #a855f7, #6366f1)",
                      color: "white",
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 800
                    }}
                  >
                    Proceed to Candidate Screening ➔
                  </Link>
                </div>

              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
