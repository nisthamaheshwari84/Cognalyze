"use client";

import React from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function RecruiterDashboardPage() {
  const kpis = [
    { label: "Active Roles", value: "3 Roles", desc: "SDE-2, ML Engineer, Frontend Lead", color: "#818cf8" },
    { label: "Resumes Evaluated", value: "148 Resumes", desc: "Batch & single drive intake", color: "#38bdf8" },
    { label: "Offers Recommended", value: "18 Candidates", desc: "Top 12% committee clearance", color: "#34d399" },
    { label: "Keyword Stuffers Flagged", value: "24 Resumes", desc: "Mihir Bansal test detected", color: "#f87171" }
  ];

  const modules = [
    {
      title: "JD Intelligence",
      desc: "Parse job descriptions into structured requirements, uncover hidden expectations and absolute dealbreakers.",
      href: "/recruiter/jobs",
      icon: "💼",
      tag: "Requirements Engine",
      color: "#6366f1"
    },
    {
      title: "Candidate Analysis & Ranking",
      desc: "Bulk upload resumes (PDF, TXT, CSV), run Two-Pass ranking, and trigger 5-Agent adversarial debates.",
      href: "/recruiter/candidates",
      icon: "👥",
      tag: "Two-Pass Ranker",
      color: "#a855f7"
    },
    {
      title: "Interview Intelligence",
      desc: "Generate sharp, candidate-specific interview questions probing exact profile gaps, claims, and missing skills.",
      href: "/recruiter/interviews",
      icon: "🎤",
      tag: "Gap-Probing Questions",
      color: "#ec4899"
    },
    {
      title: "Hiring Analytics",
      desc: "Analyze cohort score distributions, hiring committee verdicts, skills scarcity, and pipeline conversion yields.",
      href: "/recruiter/analytics",
      icon: "📈",
      tag: "Cohort Telemetry",
      color: "#06b6d4"
    }
  ];

  const recentDrives = [
    { title: "Senior Fullstack Engineer (Next.js + Distributed)", applicants: 42, topPick: "Rahul Verma (94%)", status: "Evaluation Complete" },
    { title: "Machine Learning & LLM Engineer", applicants: 68, topPick: "Anika Sharma (96%)", status: "Committee Deliberating" },
    { title: "Cloud Backend Infrastructure (Go / Kafka)", applicants: 38, topPick: "Vikram Malhotra (89%)", status: "Active Intake" }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1350, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HERO BANNER */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: 20,
            padding: "32px",
            marginBottom: 32
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div style={{ maxWidth: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(168,85,247,0.2)", color: "#d8b4fe", fontWeight: 800 }}>
                  ADVERSARIAL AI HIRING COMMITTEE
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Enterprise Recruiter Suite
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: 900, margin: "0 0 10px", letterSpacing: "-1px" }}>
                Enterprise Talent Intelligence & Cohort Ranking
              </h1>

              <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6, margin: "0 0 20px" }}>
                Evaluate candidates the way elite engineering committees hire: through structured 5-agent debate, evidence-backed DNA profiling, and two-pass cohort benchmarking instead of shallow keyword matching.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  href="/recruiter/candidates"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #a855f7, #6366f1)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: "0 4px 15px rgba(168,85,247,0.3)"
                  }}
                >
                  👥 Batch Rank Resumes
                </Link>
                <Link
                  href="/recruiter/jobs"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700
                  }}
                >
                  💼 Define New Job Criteria
                </Link>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, minWidth: 320 }}>
              {kpis.map(kpi => (
                <div
                  key={kpi.label}
                  style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    padding: "16px"
                  }}
                >
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{kpi.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: kpi.color, margin: "4px 0 2px" }}>{kpi.value}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{kpi.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 CORE RECRUITER MODULES */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Recruiter Core Modules
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
            {modules.map(m => (
              <Link
                key={m.href}
                href={m.href}
                style={{
                  textDecoration: "none",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{m.icon}</span>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: m.color, fontWeight: 800, border: `1px solid ${m.color}30` }}>
                      {m.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 6px" }}>
                    {m.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                    {m.desc}
                  </p>
                </div>
                <div style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: m.color, display: "flex", alignItems: "center", gap: 4 }}>
                  Open Module ➔
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ACTIVE HIRING DRIVES */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
              Active Placement & Hiring Drives
            </div>
            <Link href="/recruiter/candidates" style={{ color: "#a855f7", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              View All Cohorts ➔
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentDrives.map((d, i) => (
              <div
                key={i}
                style={{
                  padding: "18px 22px",
                  borderRadius: 14,
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16
                }}
              >
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 4px" }}>
                    {d.title}
                  </h4>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {d.applicants} applicants ingested • Top Candidate: <strong style={{ color: "#38bdf8" }}>{d.topPick}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: 700 }}>
                    {d.status}
                  </span>
                  <Link
                    href="/recruiter/candidates"
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    Open Cohort
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
