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
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px 80px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "var(--color-info-bg)", color: "var(--brand-cobalt)", border: "1px solid #D2E0FB", fontWeight: 700, textTransform: "uppercase" }}>
                JD Intelligence Engine
              </span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>
                Strategy Audit • Fact vs Inference • What-If Simulation
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em", color: "var(--brand-navy)" }}>
              💼 Job Description Strategy &amp; Calibration Audit
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "8px 0 0", maxWidth: 780, lineHeight: 1.5 }}>
              Audit hiring feasibility before screening applicants: evaluate 100% adaptive Role DNA, distinguish hard conflicts from calibration tensions, verify unstated inferences, and optimize candidate pool yield.
            </p>
          </div>

          <Link
            href="/recruiter/candidates"
            onClick={handleMatchCandidatesClick}
            style={{
              padding: "10px 18px",
              borderRadius: 7,
              background: "var(--brand-cobalt)",
              color: "white",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 6px rgba(53, 106, 230, 0.3)"
            }}
          >
            Match Candidates to Criteria ➔
          </Link>
        </div>

        {rewriteNotification && (
          <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 7, background: "var(--color-success-bg)", border: "1px solid #C8E4D3", color: "var(--color-success)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
            <span>✓</span>
            <span>{rewriteNotification}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 500px), 1fr))", gap: 20, alignItems: "start" }}>
          
          {/* LEFT: INPUT FORM */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
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
                      background: "var(--bg-canvas)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--brand-navy)",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
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
                borderRadius: 7,
                background: "var(--bg-canvas)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: 12.5,
                lineHeight: 1.55,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "monospace"
              }}
            />

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
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
                      borderRadius: 7,
                      border: "1px solid var(--border-subtle)",
                      background: "var(--surface)",
                      color: "var(--text-secondary)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleParse}
                  disabled={parsing || !jdText.trim()}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 7,
                    border: "none",
                    background: parsing || !jdText.trim() ? "var(--border-subtle)" : "var(--brand-cobalt)",
                    color: parsing || !jdText.trim() ? "#98A2B3" : "var(--surface)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: parsing || !jdText.trim() ? "not-allowed" : "pointer",
                    boxShadow: parsing || !jdText.trim() ? "none" : "0 2px 6px rgba(53, 106, 230, 0.3)"
                  }}
                >
                  {parsing ? "Auditing Strategy with AI..." : "Audit Hiring Strategy ➔"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 7, background: "#FDF2F2", border: "1px solid #F8C8C8", color: "var(--color-error)", fontSize: 12, fontWeight: 600 }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* RIGHT: STRUCTURED REQUIREMENTS DOSSIER */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--brand-navy)", margin: 0 }}>
                Hiring Strategy &amp; Feasibility Dossier
              </h3>
              {parsedJd && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid #C8E4D3", fontWeight: 700 }}>
                    ✓ Citations Verified
                  </span>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "var(--color-info-bg)", color: "var(--brand-cobalt)", border: "1px solid #D2E0FB", fontWeight: 700 }}>
                    100% DNA Balance
                  </span>
                </div>
              )}
            </div>

            {!parsedJd ? (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💼</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" }}>No Hiring Strategy Audited Yet</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, maxWidth: 380, margin: "4px auto 0" }}>
                  Select a sample above or paste your custom job description, then click &ldquo;Audit Hiring Strategy&rdquo; to run the calibration audit.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                
                {/* ── LAYER 1: EXECUTIVE SUMMARY ── */}
                <div style={{ background: "#F9F8F5", borderRadius: 8, padding: 16, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--brand-cobalt)", fontWeight: 700 }}>AUDITED ROLE &amp; PROFILE:</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--brand-navy)" }}>{parsedJd.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{parsedJd.company} • Experience: {parsedJd.minYearsExperience}–{parsedJd.maxYearsExperience} Years</div>
                    </div>

                    {/* Quality Gauge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>JD QUALITY</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: qualityScore >= 80 ? "#2E7D5B" : qualityScore >= 65 ? "#B7791F" : "var(--color-error)" }}>
                          {qualityScore >= 80 ? "High Clarity" : qualityScore >= 65 ? "Needs Calibration" : "High Sourcing Risk"}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: qualityScore >= 80 ? "#2E7D5B" : qualityScore >= 65 ? "#B7791F" : "var(--color-error)",
                        minWidth: 42,
                        textAlign: "center"
                      }}>
                        {qualityScore}
                      </div>
                    </div>
                  </div>

                  {/* Quick Metric Pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: hardConflicts.length > 0 ? "#FDF2F2" : "var(--surface)", border: `1px solid ${hardConflicts.length > 0 ? "#F8C8C8" : "var(--border-subtle)"}`, padding: "6px 10px", borderRadius: 7, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: hardConflicts.length > 0 ? "#C24141" : "var(--text-secondary)" }}>{hardConflicts.length}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>Hard Conflicts</div>
                    </div>

                    <div style={{ background: potentialTensions.length > 0 ? "#FEF7ED" : "var(--surface)", border: `1px solid ${potentialTensions.length > 0 ? "#F8D8A7" : "var(--border-subtle)"}`, padding: "6px 10px", borderRadius: 7, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: potentialTensions.length > 0 ? "#B7791F" : "var(--text-secondary)" }}>{potentialTensions.length}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>Potential Tensions</div>
                    </div>

                    <div style={{ background: parsedJd.ambiguous_requirements.length > 0 ? "#FEF7ED" : "var(--surface)", border: `1px solid ${parsedJd.ambiguous_requirements.length > 0 ? "#F8D8A7" : "var(--border-subtle)"}`, padding: "6px 10px", borderRadius: 7, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: parsedJd.ambiguous_requirements.length > 0 ? "#B7791F" : "var(--text-secondary)" }}>{parsedJd.ambiguous_requirements.length}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>Ambiguities</div>
                    </div>

                    <div style={{ background: "var(--color-info-bg)", border: "1px solid #D2E0FB", padding: "6px 10px", borderRadius: 7, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--brand-cobalt)" }}>{parsedJd.audited_requirements.length}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>Audited Skills</div>
                    </div>
                  </div>

                  {/* Role Summary Quote */}
                  <p style={{ fontSize: 12.5, color: "var(--text-primary)", margin: 0, lineHeight: 1.5, fontStyle: "italic", borderLeft: "3px solid #356AE6", paddingLeft: 10 }}>
                    &ldquo;{parsedJd.role_summary}&rdquo;
                  </p>
                </div>

                {/* ── LAYER 2: ROLE DNA ── */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: "var(--brand-navy)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Role DNA — Weighted Evaluation Dimensions (100% Target)
                    </div>
                    <span style={{ fontSize: 11, color: "var(--color-success)", fontWeight: 700 }}>
                      Sum: {parsedJd.evaluation_dimensions.reduce((a, b) => a + b.weight_pct, 0)}%
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {parsedJd.evaluation_dimensions.map((dim, idx) => (
                      <div key={idx} style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
                            {dim.dimension}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--brand-cobalt)", background: "var(--color-info-bg)", border: "1px solid #D2E0FB", padding: "2px 8px", borderRadius: 5 }}>
                            {dim.weight_pct}%
                          </span>
                        </div>
                        
                        <div style={{ width: "100%", height: 6, background: "var(--border-subtle)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                          <div
                            style={{
                              width: `${Math.min(100, dim.weight_pct)}%`,
                              height: "100%",
                              background: "var(--brand-cobalt)",
                              borderRadius: 99
                            }}
                          />
                        </div>

                        <div style={{ fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.45 }}>
                          <strong style={{ color: "var(--brand-navy)" }}>Evidence &amp; Justification:</strong> {dim.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── CONTRADICTION & TENSION DETECTOR ── */}
                {parsedJd.tensions && parsedJd.tensions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "var(--brand-navy)", fontWeight: 800, textTransform: "uppercase" }}>
                      ⚖️ Contradiction &amp; Tension Detector ({parsedJd.tensions.length})
                    </div>

                    {parsedJd.tensions.map((t, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: t.severity === "hard_conflict" ? "#FDF2F2" : "#FEF7ED",
                          border: `1px solid ${t.severity === "hard_conflict" ? "#F8C8C8" : "#F8D8A7"}`,
                          borderRadius: 8,
                          padding: "12px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 5,
                            background: t.severity === "hard_conflict" ? "#FDF2F2" : "#FEF7ED",
                            color: t.severity === "hard_conflict" ? "#C24141" : "var(--color-warning)",
                            border: `1px solid ${t.severity === "hard_conflict" ? "#F8C8C8" : "#F8D8A7"}`
                          }}>
                            {t.severity === "hard_conflict" ? "🔴 HARD CONFLICT" : "🟡 POTENTIAL CALIBRATION TENSION"}
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0" }}>
                          <div style={{ fontSize: 11, background: "var(--surface)", border: "1px solid var(--border-subtle)", padding: 8, borderRadius: 6, color: "var(--text-primary)" }}>
                            <strong>Statement A:</strong> &ldquo;{t.statement_a}&rdquo;
                          </div>
                          <div style={{ fontSize: 11, background: "var(--surface)", border: "1px solid var(--border-subtle)", padding: 8, borderRadius: 6, color: "var(--text-primary)" }}>
                            <strong>Statement B:</strong> &ldquo;{t.statement_b}&rdquo;
                          </div>
                        </div>

                        <div style={{ fontSize: 11.5, color: "var(--text-primary)", marginTop: 4 }}>
                          <strong>Analysis:</strong> {t.why_tension}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--brand-cobalt)", marginTop: 4, fontWeight: 600 }}>
                          <strong>Recommended Recruiter Action:</strong> {t.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── AMBIGUITY DETECTOR WITH 1-CLICK REWRITES ── */}
                {parsedJd.ambiguous_requirements && parsedJd.ambiguous_requirements.length > 0 && (
                  <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--color-warning)", fontWeight: 800, marginBottom: 8 }}>
                      ⚠️ AMBIGUITY DETECTOR — Actionable Rewrites ({parsedJd.ambiguous_requirements.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {parsedJd.ambiguous_requirements.map((amb, idx) => (
                        <div key={idx} style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border-subtle)", borderLeft: "3px solid #B7791F" }}>
                          <div style={{ fontSize: 12, color: "var(--brand-navy)", fontWeight: 700 }}>
                            Vague Phrase: &ldquo;{amb.quoted_text}&rdquo;
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "4px 0" }}>
                            <strong style={{ color: "var(--color-warning)" }}>Why Ambiguous:</strong> {amb.why_ambiguous}
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8, background: "#F9F8F5", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
                            <div style={{ fontSize: 11.5, color: "var(--color-success)", flex: 1, minWidth: 200 }}>
                              <strong>Drop-in Rewrite:</strong> &ldquo;{amb.suggested_rewrite}&rdquo;
                            </div>
                            <button
                              onClick={() => handleApplyRewrite(amb.quoted_text, amb.suggested_rewrite)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: "var(--color-success)",
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

                {/* ── FACT VS INFERENCE ── */}
                {parsedJd.implicit_expectations && parsedJd.implicit_expectations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--brand-navy)", fontWeight: 800, marginBottom: 8 }}>
                      💡 FACT VS INFERENCE AUDIT (Implicit Expectations):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {parsedJd.implicit_expectations.map((imp, idx) => (
                        <div key={idx} style={{ background: "var(--color-info-bg)", border: "1px solid #D2E0FB", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--brand-navy)" }}>
                              {imp.expectation}
                            </span>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: imp.confidence === "Explicit" ? "var(--color-success-bg)" : "#EFF4FE",
                              color: imp.confidence === "Explicit" ? "#2E7D5B" : "var(--brand-cobalt)",
                              border: `1px solid ${imp.confidence === "Explicit" ? "var(--color-success)" : "#D2E0FB"}`
                            }}>
                              {imp.confidence}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                            <strong>Inferred From:</strong> &ldquo;{imp.inferred_from}&rdquo;
                          </div>
                          <div style={{ fontSize: 11, color: "var(--brand-cobalt)", marginTop: 3, fontWeight: 600 }}>
                            <strong>Hiring Team Action:</strong> {imp.recruiter_action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── AUDITED REQUIREMENTS & CRITICALITY MATRIX ── */}
                <div>
                  <div style={{ fontSize: 12, color: "var(--brand-navy)", fontWeight: 800, marginBottom: 8 }}>
                    📋 REQUIREMENT CRITICALITY &amp; AUDIT MATRIX ({parsedJd.audited_requirements.length}):
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 8 }}>
                    {parsedJd.audited_requirements.map((req, idx) => (
                      <div key={idx} style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--brand-navy)" }}>{req.name}</span>
                          <span style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: req.criticality === "High" ? "#FDF2F2" : req.criticality === "Medium" ? "#FEF7ED" : "var(--color-success-bg)",
                            color: req.criticality === "High" ? "#C24141" : req.criticality === "Medium" ? "#B7791F" : "var(--color-success)",
                            border: `1px solid ${req.criticality === "High" ? "#F8C8C8" : req.criticality === "Medium" ? "#F8D8A7" : "var(--color-success)"}`
                          }}>
                            {req.criticality} Criticality
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: req.type.includes("Must") ? "#C24141" : "var(--brand-cobalt)", fontWeight: 700 }}>
                          {req.type}
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--text-secondary)", marginTop: 3 }}>
                          {req.rationale}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── WHAT-IF HIRING CRITERIA SIMULATOR ── */}
                {parsedJd.what_if_options && parsedJd.what_if_options.length > 0 && (
                  <div style={{ background: "#F9F8F5", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--brand-navy)", fontWeight: 800, marginBottom: 4 }}>
                      WHAT-IF HIRING CRITERIA SIMULATOR
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10 }}>
                      Simulate candidate pool expansion and quality impact by adjusting non-critical constraints.
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {parsedJd.what_if_options.map((opt, idx) => {
                        const isRelaxed = !!simulatedRelaxations[idx];
                        return (
                          <div
                            key={idx}
                            style={{
                              background: isRelaxed ? "var(--color-success-bg)" : "var(--surface)",
                              border: `1px solid ${isRelaxed ? "var(--color-success)" : "var(--border-subtle)"}`,
                              borderRadius: 8,
                              padding: "10px 12px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 8
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 220 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: isRelaxed ? "#2E7D5B" : "var(--brand-navy)" }}>
                                {opt.change_description}
                              </div>
                              <div style={{ fontSize: 10.5, color: "var(--text-secondary)", marginTop: 2 }}>
                                {opt.reasoning}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--color-success)" }}>
                                  +{opt.pool_increase_pct}% Pool
                                </div>
                                <div style={{ fontSize: 9.5, color: opt.quality_impact === "Minimal Risk" ? "#2E7D5B" : "var(--color-warning)", fontWeight: 600 }}>
                                  {opt.quality_impact}
                                </div>
                              </div>
                              <button
                                onClick={() => setSimulatedRelaxations(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 6,
                                  background: isRelaxed ? "#2E7D5B" : "var(--surface)",
                                  border: `1px solid ${isRelaxed ? "#2E7D5B" : "var(--border-subtle)"}`,
                                  color: isRelaxed ? "#FFFFFF" : "var(--brand-navy)",
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
                <div style={{ paddingTop: 12, borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    Audited strategy ready for applicant screening
                  </span>
                  <Link
                    href="/recruiter/candidates"
                    onClick={handleMatchCandidatesClick}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 7,
                      background: "var(--brand-cobalt)",
                      color: "white",
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 700
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
