"use client";

import React, { useState } from "react";
import AppNav from "@/components/AppNav";
import { BarChart3, TrendingUp, CheckCircle2, AlertTriangle, Layers, ShieldCheck, ArrowRight } from "lucide-react";

export default function RecruiterAnalyticsPage() {
  const [selectedDrive, setSelectedDrive] = useState("Drive 2026-A: Senior Fullstack & Distributed");

  const drives = [
    "Drive 2026-A: Senior Fullstack & Distributed",
    "Drive 2026-B: ML / LLM Platform Engineers",
    "Drive 2026-C: Campus Graduate SDE Cohort"
  ];

  const funnelStages = [
    { name: "Candidates Ingested", count: 148, pct: "100%", subtext: "Total submitted" },
    { name: "Evidence Parsed", count: 142, pct: "96%", subtext: "Structure extracted" },
    { name: "Claims Unverified", count: 26, pct: "18%", subtext: "Insufficient proof" },
    { name: "Evidence Qualified", count: 34, pct: "23%", subtext: "8+ verified skills" },
    { name: "Final Review", count: 14, pct: "9.5%", subtext: "Direct interview ready" }
  ];

  const scoreBuckets = [
    { range: "90 - 100% Match (Tier 1 Evidence)", count: 14, pct: 10, color: "#2E7D5B" },
    { range: "75 - 89% Match (Strong Core Evidence)", count: 48, pct: 34, color: "#356AE6" },
    { range: "60 - 74% Match (Partial Verification)", count: 42, pct: 30, color: "#B7791F" },
    { range: "Below 60% Match (Critical Skill Gaps)", count: 38, pct: 26, color: "#667085" }
  ];

  const missingSkillsCohort = [
    { skill: "Distributed Caching & Invalidation (Redis)", frequency: "68% of candidates missing", count: 101 },
    { skill: "Production Kafka Partitioning & Recovery", frequency: "54% of candidates missing", count: 80 },
    { skill: "Transaction Isolation Levels (MVCC/ACID)", frequency: "46% of candidates missing", count: 68 },
    { skill: "System SPOF & Circuit Breaking", frequency: "39% of candidates missing", count: 58 }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px 96px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#EFF4FE", color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                COHORT TELEMETRY
              </span>
              <span style={{ fontSize: 12, color: "#667085" }}>
                148 Candidates Analyzed
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: "#162A43", margin: 0, letterSpacing: "-0.3px" }}>
              Hiring Intelligence & Funnel Analytics
            </h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "6px 0 0", maxWidth: 640, lineHeight: 1.5 }}>
              Evidence-first conversion analysis across your hiring pipeline. Verified signal density, requirement coverage, and cohort-wide gap telemetry.
            </p>
          </div>

          <select
            value={selectedDrive}
            onChange={e => setSelectedDrive(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 7,
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              color: "#162A43",
              fontSize: 13,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {drives.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* SECTION 18 STATS SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Evidence Coverage</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#162A43", marginTop: 4 }}>91%</div>
            <div style={{ fontSize: 12, color: "#2E7D5B", fontWeight: 500, marginTop: 4 }}>↑ 6% higher than cohort benchmark</div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Skill Verification</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#162A43", marginTop: 4 }}>8 / 10</div>
            <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>Required must-have skills verified</div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Projects with Evidence</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#162A43", marginTop: 4 }}>6 / 7</div>
            <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>Repo activity or live deployment verified</div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>Screening Accuracy</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#162A43", marginTop: 4 }}>98.4%</div>
            <div style={{ fontSize: 12, color: "#2E7D5B", fontWeight: 500, marginTop: 4 }}>Audit trail zero contradiction rate</div>
          </div>
        </div>

        {/* HIRING FUNNEL YIELD */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "22px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Cohort Screening Funnel
            </div>
            <div style={{ fontSize: 12, color: "#667085" }}>
              Progressive evidence filtering
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 12 }}>
            {funnelStages.map((stage, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FAF9F6",
                  border: "1px solid #E4E1DA",
                  borderRadius: 8,
                  padding: "14px 16px"
                }}
              >
                <div style={{ fontSize: 11, color: "#667085", marginBottom: 4, fontWeight: 600 }}>
                  Stage {idx + 1}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#162A43", margin: "2px 0 2px" }}>
                  {stage.count}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#17191C", marginBottom: 2 }}>
                  {stage.name}
                </div>
                <div style={{ fontSize: 11, color: "#667085" }}>
                  {stage.pct} • {stage.subtext}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCORE DISTRIBUTION & SKILL DEFICITS SPLIT */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 540px), 1fr))", gap: 20 }}>
          
          {/* Score Distribution */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "22px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#162A43", marginBottom: 4 }}>
              Candidate Match Distribution
            </div>
            <p style={{ fontSize: 12, color: "#667085", margin: "0 0 18px" }}>
              Restrained evidence scoring tiers calibrated to role requirement depth.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {scoreBuckets.map((b, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#17191C", marginBottom: 5 }}>
                    <span style={{ fontWeight: 500 }}>{b.range}</span>
                    <strong style={{ color: "#162A43" }}>{b.count} ({b.pct}%)</strong>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "#F6F5F1", overflow: "hidden", border: "1px solid #E4E1DA" }}>
                    <div style={{ height: "100%", width: `${b.pct}%`, background: b.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Skills Cohort-Wide */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "22px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#162A43", marginBottom: 4 }}>
              Drive-Wide Technical Skill Deficits
            </div>
            <p style={{ fontSize: 12, color: "#667085", margin: "0 0 16px" }}>
              Most frequent unverified or missing requirements across candidate submissions:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {missingSkillsCohort.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 7,
                    background: "#FAF9F6",
                    border: "1px solid #E4E1DA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#17191C" }}>
                    {s.skill}
                  </span>
                  <span style={{ fontSize: 11, color: "#B7791F", fontWeight: 600, background: "#FEF8EC", border: "1px solid #F9E4B7", padding: "2px 7px", borderRadius: 5 }}>
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
