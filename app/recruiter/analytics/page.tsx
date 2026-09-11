"use client";

import React, { useState } from "react";
import AppNav from "@/components/AppNav";

export default function RecruiterAnalyticsPage() {
  const [selectedDrive, setSelectedDrive] = useState("Drive 2026-A: Senior Fullstack & Distributed");

  const drives = [
    "Drive 2026-A: Senior Fullstack & Distributed",
    "Drive 2026-B: ML / LLM Platform Engineers",
    "Drive 2026-C: Campus Graduate SDE Cohort"
  ];

  const funnelStages = [
    { name: "Resumes Ingested", count: 148, pct: "100%", color: "#818cf8" },
    { name: "Parsed & Evaluated", count: 142, pct: "96%", color: "#38bdf8" },
    { name: "Keyword Stuffers Detected", count: 26, pct: "18% rejected", color: "#f87171" },
    { name: "Committee Clearances", count: 34, pct: "23%", color: "#fbbf24" },
    { name: "Direct Offer Recommended", count: 14, pct: "9.5%", color: "#34d399" }
  ];

  const scoreBuckets = [
    { range: "90 - 100% (Exceptional / FAANG Bar-Raiser)", count: 14, pct: 10, color: "#34d399" },
    { range: "75 - 89% (Solid Hire / Strong Core)", count: 48, pct: 34, color: "#38bdf8" },
    { range: "60 - 74% (Borderline / 45-Min Screen Needed)", count: 42, pct: 30, color: "#fbbf24" },
    { range: "Below 60% (Skill Gaps / Rejected)", count: 38, pct: 26, color: "#f87171" }
  ];

  const missingSkillsCohort = [
    { skill: "Distributed Caching & Invalidation (Redis)", frequency: "68% of candidates missing" },
    { skill: "Production Kafka Partitioning & Recovery", frequency: "54% of candidates missing" },
    { skill: "Transaction Isolation Levels (MVCC/ACID)", frequency: "46% of candidates missing" },
    { skill: "System SPOF & Circuit Breaking", frequency: "39% of candidates missing" }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(6,182,212,0.2)", color: "#22d3ee", fontWeight: 800 }}>
                COHORT TELEMETRY
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                148 Total Applications
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              📈 Hiring Analytics & Funnel Yield
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 650, lineHeight: 1.5 }}>
              Aggregated committee statistics across your talent pool. Track conversion ratios, score distribution, and cohort-wide skill gaps.
            </p>
          </div>

          <select
            value={selectedDrive}
            onChange={e => setSelectedDrive(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              outline: "none"
            }}
          >
            {drives.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* HIRING FUNNEL YIELD */}
        <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
            Cohort Funnel Conversion Stages
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 14 }}>
            {funnelStages.map((stage, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: "16px"
                }}
              >
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                  Stage {idx + 1}
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: stage.color, margin: "2px 0 4px" }}>
                  {stage.count}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 4 }}>
                  {stage.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                  {stage.pct}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCORE DISTRIBUTION & SKILL DEFICITS SPLIT */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: 24 }}>
          
          {/* Score Distribution */}
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 16px" }}>
              Candidate Score Percentiles
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {scoreBuckets.map((b, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 6 }}>
                    <span>{b.range}</span>
                    <strong style={{ color: b.color }}>{b.count} ({b.pct}%)</strong>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${b.pct}%`, background: b.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Skills Cohort-Wide */}
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 16px" }}>
              Drive-Wide Technical Skill Deficits
            </h3>

            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>
              The most frequent missing competencies identified across this applicant cohort by the AI Committee:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {missingSkillsCohort.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fca5a5" }}>
                    {s.skill}
                  </span>
                  <span style={{ fontSize: 11, color: "#f87171", fontWeight: 700 }}>
                    {s.frequency}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
