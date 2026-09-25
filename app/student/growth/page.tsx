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
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER: ONE QUESTION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.2)", color: "#6ee7b7", fontWeight: 800, textTransform: "uppercase" }}>
                Targeted Capability Growth
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Factual Gap Engine
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              How do I grow?
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 750, lineHeight: 1.5 }}>
              Compare your verified capabilities against real target role requirements. The Next-Best-Evidence engine generates exact practice exercises to turn uncertainties into proven capabilities.
            </p>
          </div>

          {/* Target Role Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(15, 23, 42, 0.6)", padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Target Role:</span>
            <select
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 12 }}
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── GAP SUMMARY METRIC CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div style={{ padding: "20px", borderRadius: 14, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#6ee7b7", textTransform: "uppercase", marginBottom: 4 }}>
              Proven Capabilities
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>
              {provenCount} Requirements
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              Fully backed by verified code repositories and algorithmic submissions.
            </div>
          </div>

          <div style={{ padding: "20px", borderRadius: 14, background: "rgba(234, 179, 8, 0.08)", border: "1px solid rgba(234, 179, 8, 0.2)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#fde047", textTransform: "uppercase", marginBottom: 4 }}>
              Targeted Growth Areas
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>
              {missingCount} Validations
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              Uncertainties that can be resolved with focused mini work samples.
            </div>
          </div>
        </div>

        {/* ── NEXT BEST EVIDENCE PLAN ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>
              Requirement Fulfillment & Growth Actions
            </h2>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Ordered by highest return on effort
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {gaps.map(gap => {
              const isProven = gap.status === "proven";
              const isUncertain = gap.status === "uncertain";
              const badgeColor = isProven ? "#10b981" : isUncertain ? "#3b82f6" : "#f59e0b";

              return (
                <div
                  key={gap.id}
                  style={{
                    padding: "20px 24px",
                    borderRadius: 14,
                    background: "rgba(15, 23, 42, 0.7)",
                    border: `1px solid ${isProven ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16
                  }}
                >
                  <div style={{ maxWidth: 750 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${badgeColor}20`, color: badgeColor, fontWeight: 800 }}>
                        {gap.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {gap.category === "core" ? "Core Requirement" : "Trainable Capability"}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "2px 0 6px" }}>
                      {gap.requirementName}
                    </h3>

                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                      Current Evidence: <strong style={{ color: "#cbd5e1" }}>{gap.currentEvidence}</strong>
                    </div>

                    {!isProven && (
                      <div style={{ fontSize: 12, color: "#a5b4fc", background: "rgba(99,102,241,0.1)", padding: "6px 12px", borderRadius: 6, display: "inline-block" }}>
                        💡 Recommended Step: {gap.recommendedValidation}
                      </div>
                    )}
                  </div>

                  <div>
                    <Link
                      href={gap.actionUrl}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 8,
                        background: isProven ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #6366f1, #a855f7)",
                        border: isProven ? "1px solid rgba(255,255,255,0.1)" : "none",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-block"
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
        <div style={{ padding: "24px", borderRadius: 16, background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 4px" }}>
            Evidence Practice Tools
          </h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 18px" }}>
            Preserved interactive training environments to validate your capabilities under real-world scenarios.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <Link
              href="/student/practice-interview"
              style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>🎙️</div>
              <strong style={{ fontSize: 14, color: "white", display: "block" }}>Mock Interview Simulator</strong>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Practice structural questions with real-time feedback</span>
            </Link>

            <Link
              href="/student/dsa-tracker"
              style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>🧠</div>
              <strong style={{ fontSize: 14, color: "white", display: "block" }}>DSA & Algorithmic Tracker</strong>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Track problem solving streaks and verified submissions</span>
            </Link>

            <Link
              href="/student/opportunities"
              style={{ padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>🎯</div>
              <strong style={{ fontSize: 14, color: "white", display: "block" }}>Opportunity Matcher</strong>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Browse open roles matched to your verified capabilities</span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
