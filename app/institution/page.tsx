"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function InstitutionPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "skillgaps" | "drives" | "accreditation">("overview");

  const skillGaps = [
    { skill: "Cloud Architecture & Docker", industryDemand: 84, studentSupply: 32, gap: -52, action: "Launch hands-on AWS/Docker container capstone" },
    { skill: "PostgreSQL & Database Concurrency", industryDemand: 76, studentSupply: 48, gap: -28, action: "Add connection pooling module to database lab" },
    { skill: "Data Structures & Graph Algorithms", industryDemand: 88, studentSupply: 78, gap: -10, action: "Maintain active LeetCode cohort tracker" },
    { skill: "Distributed Caching (Redis)", industryDemand: 68, studentSupply: 24, gap: -44, action: "Introduce in-memory caching in Advanced Web Tech course" },
    { skill: "System Design & Microservices", industryDemand: 82, studentSupply: 36, gap: -46, action: "Schedule 4 Whiteboard Studio simulation days" },
  ];

  const placementDrives = [
    { company: "Stripe", role: "SWE Intern", eligibleStudents: 142, applied: 98, status: "Open (Closes Oct 28)" },
    { company: "Google", role: "Associate SWE", eligibleStudents: 88, applied: 72, status: "Screening Active" },
    { company: "Datadog", role: "Backend Engineer", eligibleStudents: 110, applied: 84, status: "Campus Visit Nov 02" },
    { company: "Microsoft", role: "Software Engineer", eligibleStudents: 160, applied: 140, status: "Upcoming Drive" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", color: "#18181B" }}>
      {/* ── 1. GLOBAL NAVIGATION ── */}
      <AppNav role="student" />

      {/* ── 2. SUB-HEADER ── */}
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
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "overview", label: "Cohort Overview" },
              { id: "skillgaps", label: "Industry Demand vs Supply" },
              { id: "drives", label: "Placement Drives" },
              { id: "accreditation", label: "NAAC / Accreditation Proofs" },
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

          <div style={{ fontSize: 12, color: "#6B6B6B" }}>
            College Placement Cell & TPO Suite
          </div>
        </div>
      </div>

      {/* ── 3. WORKSPACE BODY ── */}
      <main
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "28px 20px 80px",
        }}
      >
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#176B5B", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                INSTITUTIONAL PLACEMENT COCKPIT
              </span>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0", color: "#111111" }}>
                School of Engineering & Technology • 2026 Batch
              </h1>
              <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 0" }}>
                Total Enrolled: 480 Candidates • 18 Visiting Enterprise Recruiters
              </p>
            </div>

            {/* Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {[
                { title: "Placement Readiness", value: "74.2%", sub: "Cohort verified for technical rounds", color: "#176B5B" },
                { title: "Active Applications", value: "1,420", sub: "Distributed across 18 drives", color: "#18181B" },
                { title: "Interview Clearance", value: "82.6%", sub: "Based on 1,240 proctored rounds", color: "#176B5B" },
                { title: "Confirmed Offers", value: "94 Offers", sub: "Average CTC: 14.8 LPA", color: "#18181B" },
              ].map((m) => (
                <div
                  key={m.title}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>{m.title}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: m.color, margin: "6px 0 2px" }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: "#6B6B6B" }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Quick Action: Urgent Intervention Required */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E7E5E4",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111111" }}>
                    Primary Cohort Deficit: Cloud & Systems
                  </h3>
                  <p style={{ fontSize: 13, color: "#6B6B6B", margin: "2px 0 0" }}>
                    Visiting campus recruiters (Stripe, Datadog) demand verified concurrency and cloud deployment proofs.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("skillgaps")}
                  style={{
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View Skill Gap Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "skillgaps" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                CURRICULUM INTELLIGENCE
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Industry Demand vs Student Supply Analysis
              </h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                Pinpointing precisely where student portfolios lack verified evidence demanded by hiring partners.
              </p>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: "#FAFAF9", borderBottom: "1px solid #E7E5E4", color: "#6B6B6B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "14px 18px" }}>Competency Area</th>
                    <th style={{ padding: "14px 18px" }}>Industry Demand</th>
                    <th style={{ padding: "14px 18px" }}>Student Supply (Verified)</th>
                    <th style={{ padding: "14px 18px" }}>Net Deficit</th>
                    <th style={{ padding: "14px 18px" }}>Recommended Academic Intervention</th>
                  </tr>
                </thead>
                <tbody>
                  {skillGaps.map((gap) => (
                    <tr key={gap.skill} style={{ borderBottom: "1px solid #E7E5E4" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 600 }}>{gap.skill}</td>
                      <td style={{ padding: "14px 18px" }}>{gap.industryDemand}% of visiting roles</td>
                      <td style={{ padding: "14px 18px" }}>{gap.studentSupply}% of batch</td>
                      <td style={{ padding: "14px 18px", color: "#B45309", fontWeight: 700 }}>{gap.gap}%</td>
                      <td style={{ padding: "14px 18px", color: "#176B5B", fontWeight: 500 }}>{gap.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "drives" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                CAMPUS PLACEMENT PIPELINES
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Active Placement Drives
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {placementDrives.map((drive) => (
                <div
                  key={drive.company}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: 18,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}>{drive.company} — {drive.role}</div>
                    <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
                      Eligible: {drive.eligibleStudents} students • Applied: {drive.applied} candidates
                    </div>
                  </div>
                  <span
                    style={{
                      backgroundColor: "#EBF5F3",
                      color: "#176B5B",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {drive.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "accreditation" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                COMPLIANCE & NAAC AUDIT RECORDS
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Cryptographic Evidence & Outcome Attainment Export
              </h2>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
              <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6, margin: "0 0 16px" }}>
                All student interview assessments, code verification digests, and placement offer letters are cryptographically signed and stored in compliance with national accreditation bodies.
              </p>
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
                Export Audit-Ready PDF Dossier (NAAC Criteria 5.2.1)
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
