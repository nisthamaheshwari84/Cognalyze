"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { RoleDNA } from "@/lib/ai/role-dna";

interface CareerGapItem {
  id: string;
  requirementName: string;
  category: "core" | "trainable";
  status: "proven" | "uncertain" | "missing";
  currentEvidence: string;
  recommendedValidation: string;
  actionUrl: string;
  actionLabel: string;
}

export default function StudentGrowthPage() {
  const [roles, setRoles] = useState<RoleDNA[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Sample gap analysis mapped to target role
  const [gaps, setGaps] = useState<CareerGapItem[]>([
    {
      id: "gap-k8s",
      requirementName: "Kubernetes Operator & Controller Automation",
      category: "trainable",
      status: "missing",
      currentEvidence: "No manifests or controller code detected in GitHub repositories",
      recommendedValidation: "Complete 20-minute Kubernetes operator simulation or submit sample Helm chart",
      actionUrl: "/student/practice-interview?focus=kubernetes",
      actionLabel: "Start Practice Simulation"
    },
    {
      id: "gap-otel",
      requirementName: "OpenTelemetry Distributed Tracing & Metric Export",
      category: "trainable",
      status: "uncertain",
      currentEvidence: "Claimed in resume work history; code sample lacks exporter instrumentation",
      recommendedValidation: "Instrument trace propagation in a sample microservice repository",
      actionUrl: "/student/practice-interview?focus=observability",
      actionLabel: "Verify with Interview Probe"
    },
    {
      id: "gap-raft",
      requirementName: "Distributed Consensus & Raft Protocol",
      category: "core",
      status: "proven",
      currentEvidence: "Verified via authored GitHub repository 'raft-consensus-go' with unit tests",
      recommendedValidation: "Proven — no further validation required",
      actionUrl: "/student/passport",
      actionLabel: "View in Passport"
    },
    {
      id: "gap-dsa",
      requirementName: "Concurrency & Algorithmic Foundations",
      category: "core",
      status: "proven",
      currentEvidence: "Verified 480 LeetCode submissions with top 1.2% contest rating",
      recommendedValidation: "Proven — meets day-one technical bar",
      actionUrl: "/student/dsa-tracker",
      actionLabel: "Review DSA Progress"
    }
  ]);

  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await fetch("/api/recruiter/roles");
        const data = await res.json();
        if (data.success && data.roles) {
          setRoles(data.roles);
          if (data.roles.length > 0) {
            setSelectedRoleId(data.roles[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load roles for growth planner:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  const provenCount = gaps.filter(g => g.status === "proven").length;
  const missingCount = gaps.filter(g => g.status !== "proven").length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER: ONE QUESTION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", fontWeight: 700, textTransform: "uppercase" }}>
                Targeted Capability Growth
              </span>
              <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>
                Factual Gap Engine
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em", color: "#162A43" }}>
              How do I grow?
            </h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "8px 0 0", maxWidth: 750, lineHeight: 1.5 }}>
              Compare your verified capabilities against real target role requirements. The Next-Best-Evidence engine generates exact practice exercises to turn uncertainties into proven capabilities.
            </p>
          </div>

          {/* Target Role Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFFFF", padding: "8px 14px", borderRadius: 10, border: "1px solid #E4E1DA", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>Target Role:</span>
            <select
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                background: "#F6F5F1",
                border: "1px solid #E4E1DA",
                color: "#17191C",
                fontSize: 12,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── GAP SUMMARY METRIC CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div style={{ padding: "20px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #C8E4D3", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Proven Capabilities
              </span>
              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, background: "#EAF4EE", color: "#2E7D5B", fontWeight: 700 }}>
                Verified
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#162A43", letterSpacing: "-0.02em" }}>
              {provenCount} <span style={{ fontSize: 16, fontWeight: 600, color: "#667085" }}>Requirements</span>
            </div>
            <div style={{ fontSize: 12, color: "#667085", marginTop: 6, lineHeight: 1.4 }}>
              Fully backed by verified code repositories and algorithmic submissions.
            </div>
          </div>

          <div style={{ padding: "20px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #F8D8A7", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Targeted Growth Areas
              </span>
              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, background: "#FEF7ED", color: "#B7791F", fontWeight: 700 }}>
                Actionable
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#162A43", letterSpacing: "-0.02em" }}>
              {missingCount} <span style={{ fontSize: 16, fontWeight: 600, color: "#667085" }}>Validations</span>
            </div>
            <div style={{ fontSize: 12, color: "#667085", marginTop: 6, lineHeight: 1.4 }}>
              Uncertainties that can be resolved with focused mini work samples.
            </div>
          </div>
        </div>

        {/* ── NEXT BEST EVIDENCE PLAN ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: 0, letterSpacing: "-0.02em" }}>
                Requirement Fulfillment &amp; Growth Actions
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#667085" }}>
                Ordered by highest return on effort to prove your target competency.
              </p>
            </div>
            <span style={{ fontSize: 12, color: "#667085", fontWeight: 600 }}>
              {gaps.length} Requirements Tracked
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {gaps.map(gap => {
              const isProven = gap.status === "proven";
              const isUncertain = gap.status === "uncertain";
              const badgeBg = isProven ? "#EAF4EE" : isUncertain ? "#EFF4FE" : "#FEF7ED";
              const badgeBorder = isProven ? "#C8E4D3" : isUncertain ? "#D2E0FB" : "#F8D8A7";
              const badgeColor = isProven ? "#2E7D5B" : isUncertain ? "#356AE6" : "#B7791F";

              return (
                <div
                  key={gap.id}
                  style={{
                    padding: "18px 22px",
                    borderRadius: 10,
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16
                  }}
                >
                  <div style={{ maxWidth: 750, flex: 1, minWidth: 280 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor, fontWeight: 700, textTransform: "uppercase" }}>
                        {gap.status}
                      </span>
                      <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>
                        {gap.category === "core" ? "Core Requirement" : "Trainable Capability"}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: "0 0 6px" }}>
                      {gap.requirementName}
                    </h3>

                    <div style={{ fontSize: 12, color: "#667085", marginBottom: !isProven ? 8 : 0 }}>
                      Current Evidence: <strong style={{ color: "#17191C", fontWeight: 600 }}>{gap.currentEvidence}</strong>
                    </div>

                    {!isProven && (
                      <div style={{ fontSize: 12, color: "#356AE6", background: "#EFF4FE", border: "1px solid #D2E0FB", padding: "6px 12px", borderRadius: 7, display: "inline-block", fontWeight: 500 }}>
                        💡 Recommended Step: {gap.recommendedValidation}
                      </div>
                    )}
                  </div>

                  <div>
                    <Link
                      href={gap.actionUrl}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 7,
                        background: isProven ? "#FFFFFF" : "#356AE6",
                        border: isProven ? "1px solid #E4E1DA" : "1px solid #356AE6",
                        color: isProven ? "#17191C" : "#FFFFFF",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-block",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {gap.actionLabel} ➔
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PRACTICE MODULE SHORTCUTS ── */}
        <div style={{ padding: "24px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #E4E1DA", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: "0 0 4px" }}>
            Evidence Practice Tools
          </h2>
          <p style={{ fontSize: 12, color: "#667085", margin: "0 0 18px" }}>
            Interactive simulation environments to convert uncertainties into verified candidate credentials.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <Link
              href="/student/practice-interview"
              style={{ padding: "16px", borderRadius: 10, background: "#F9F8F5", border: "1px solid #E4E1DA", textDecoration: "none", color: "inherit", transition: "all 0.15s ease" }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>🎙️</div>
              <strong style={{ fontSize: 14, color: "#162A43", display: "block", fontWeight: 700 }}>Mock Interview Simulator</strong>
              <span style={{ fontSize: 11, color: "#667085", marginTop: 2, display: "block" }}>Practice structural questions with real-time feedback</span>
            </Link>

            <Link
              href="/student/dsa-tracker"
              style={{ padding: "16px", borderRadius: 10, background: "#F9F8F5", border: "1px solid #E4E1DA", textDecoration: "none", color: "inherit", transition: "all 0.15s ease" }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>🧠</div>
              <strong style={{ fontSize: 14, color: "#162A43", display: "block", fontWeight: 700 }}>DSA &amp; Algorithmic Tracker</strong>
              <span style={{ fontSize: 11, color: "#667085", marginTop: 2, display: "block" }}>Track problem solving streaks and verified submissions</span>
            </Link>

            <Link
              href="/student/opportunities"
              style={{ padding: "16px", borderRadius: 10, background: "#F9F8F5", border: "1px solid #E4E1DA", textDecoration: "none", color: "inherit", transition: "all 0.15s ease" }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>🎯</div>
              <strong style={{ fontSize: 14, color: "#162A43", display: "block", fontWeight: 700 }}>Opportunity Matcher</strong>
              <span style={{ fontSize: 11, color: "#667085", marginTop: 2, display: "block" }}>Browse open roles matched to your verified capabilities</span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
