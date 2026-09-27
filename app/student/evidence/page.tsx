"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  getStudentIntelligenceProfile,
  getCapabilityWhy,
  StudentDNAProfile,
  CapabilityWhyExplanation,
  EpistemicStatus
} from "@/lib/intelligence/student-intelligence";

interface EvidenceNode {
  id: string;
  label: string;
  type: "skill" | "project" | "github" | "interview" | "assessment" | "claim";
  status: EpistemicStatus;
  coverage: "High" | "Medium" | "Low";
  verified: boolean;
  connections: string[]; // Connected node IDs
  details: string;
  provenance: string;
  date: string;
}

export default function EvidenceHubPage() {
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [intelligence, setIntelligence] = useState<StudentDNAProfile | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedNode, setSelectedNode] = useState<EvidenceNode | null>(null);
  const [whyModalData, setWhyModalData] = useState<CapabilityWhyExplanation | null>(null);
  const [activeTab, setActiveTab] = useState<"graph" | "claims" | "skills">("graph");

  const [evidenceNodes, setEvidenceNodes] = useState<EvidenceNode[]>([]);
  const [resumeClaims, setResumeClaims] = useState<any[]>([]);

  useEffect(() => {
    async function loadStudentEvidence() {
      try {
        const sessRes = await fetch("/api/auth/session");
        const sess = await sessRes.json();
        const cId = (sess.authenticated && sess.user?.id) ? sess.user.id : "student-demo";
        setCandidateId(cId);

        const profile = getStudentIntelligenceProfile(cId);
        setIntelligence(profile);

        const dnaRes = await fetch("/api/student/dna");
        if (dnaRes.ok) {
          const dnaData = await dnaRes.json();
          if (dnaData.dna) {
            const dynamicNodes: EvidenceNode[] = [];
            const claims: any[] = [];

            // 1. Projects
            (dnaData.dna.projects || []).forEach((p: any, idx: number) => {
              dynamicNodes.push({
                id: `node-proj-${idx}`,
                label: p.title || `Project ${idx + 1}`,
                type: "project",
                status: p.github_verified ? "Verified" : "Demonstrated",
                coverage: "High",
                verified: !!p.github_verified,
                connections: [],
                details: p.description || `Built with ${(p.tech_stack || []).join(", ")}.`,
                provenance: p.github_url || "Student Project Portfolio",
                date: "Recorded"
              });

              claims.push({
                claim: `Built ${p.title} with ${(p.tech_stack || []).join(", ")}`,
                source: "Project Portfolio",
                status: p.github_verified ? "Verified" : "Demonstrated",
                evidence: p.description || "Project implementation recorded.",
                gap: p.github_url ? "None. Verifiable repository linked." : "Repository link pending.",
                verdict: p.github_verified ? "Claim Fully Verified" : "Claim Demonstrated"
              });
            });

            // 2. Skills
            (dnaData.dna.skills || []).forEach((s: any, idx: number) => {
              dynamicNodes.push({
                id: `node-skill-${idx}`,
                label: s.name,
                type: "skill",
                status: s.evidence ? "Demonstrated" : "Developing",
                coverage: s.evidence ? "High" : "Medium",
                verified: !!s.verified_on_github,
                connections: [],
                details: s.evidence || `Skill declared at ${s.level} proficiency. Project implementation pending.`,
                provenance: s.verified_on_github ? "GitHub Activity Sync" : "Student Profile",
                date: "Declared"
              });
            });

            // 3. GitHub
            if (dnaData.dna.github_enrichment?.username) {
              dynamicNodes.push({
                id: "node-gh",
                label: `GitHub: ${dnaData.dna.github_enrichment.username}`,
                type: "github",
                status: "Verified",
                coverage: "High",
                verified: true,
                connections: [],
                details: `${dnaData.dna.github_enrichment.repoCount || 0} public repositories. Top languages: ${(dnaData.dna.github_enrichment.topLanguages || []).join(", ")}`,
                provenance: "GitHub API Sync v3",
                date: "Real-time sync"
              });
            }

            setEvidenceNodes(dynamicNodes);
            setResumeClaims(claims);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load evidence:", err);
      }
    }
    loadStudentEvidence();
  }, []);

  const getStatusBadge = (status: EpistemicStatus) => {
    switch (status) {
      case "Verified":
        return { label: "Verified", color: "#00ff88", bg: "rgba(0,255,136,0.12)", border: "rgba(0,255,136,0.3)" };
      case "Strong":
      case "Demonstrated":
        return { label: "Demonstrated", color: "#38bdf8", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.3)" };
      case "Developing":
        return { label: "Developing", color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" };
      case "Claimed":
        return { label: "Claimed", color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)" };
      case "Contradicted":
      case "Gap":
        return { label: "Gap / Contradicted", color: "#f43f5e", bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.3)" };
      default:
        return { label: "Insufficient Evidence", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.15)" };
    }
  };

  const handleOpenWhyModal = (capName: string) => {
    if (!intelligence) return;
    const why = getCapabilityWhy(intelligence, capName);
    setWhyModalData(why);
  };

  const filteredNodes = evidenceNodes.filter(node => {
    if (selectedStatusFilter !== "ALL" && node.status !== selectedStatusFilter) return false;
    if (selectedTypeFilter !== "ALL" && node.type !== selectedTypeFilter) return false;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#04030d", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      {/* HEADER SECTION */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.75rem 2rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 9, letterSpacing: 2, color: "#818cf8", fontWeight: 800, textTransform: "uppercase" }}>
                  EVIDENCE-FIRST CAREER OS
                </span>
                <span style={{ fontSize: 9, padding: "2px 8px", background: "rgba(0,255,136,0.12)", color: "#00ff88", borderRadius: 999, border: "1px solid rgba(0,255,136,0.3)", fontWeight: 700 }}>
                  ● CLAIM ≠ EVIDENCE ENGINE ACTIVE
                </span>
              </div>
              <h1 style={{ fontSize: "1.9rem", fontWeight: 900, letterSpacing: -1, margin: 0 }}>
                Evidence Graph & Verification Hub
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4, margin: 0 }}>
                Every meaningful claim about your skills is linked to observable proof across code, mock interviews, and assessments.
              </p>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", gap: 4 }}>
              {[
                { id: "graph", label: "🕸️ Evidence Graph" },
                { id: "claims", label: "🔍 Claim vs Evidence Auditor" },
                { id: "skills", label: "🧬 Verified Capabilities" }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 9,
                    border: "none",
                    background: activeTab === t.id ? "rgba(99,102,241,0.2)" : "transparent",
                    color: activeTab === t.id ? "white" : "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
        
        {/* ── TAB 1: CONNECTED EVIDENCE GRAPH ── */}
        {activeTab === "graph" && (
          <div>
            {/* FILTER BAR */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>STATUS:</span>
                {["ALL", "Verified", "Demonstrated", "Developing", "Claimed"].map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusFilter(st)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: selectedStatusFilter === st ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                      background: selectedStatusFilter === st ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.02)",
                      color: selectedStatusFilter === st ? "white" : "rgba(255,255,255,0.5)"
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>NODE TYPE:</span>
                {["ALL", "skill", "project", "interview", "assessment", "github"].map(ty => (
                  <button
                    key={ty}
                    onClick={() => setSelectedTypeFilter(ty)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      border: selectedTypeFilter === ty ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.08)",
                      background: selectedTypeFilter === ty ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.02)",
                      color: selectedTypeFilter === ty ? "white" : "rgba(255,255,255,0.5)"
                    }}
                  >
                    {ty}
                  </button>
                ))}
              </div>
            </div>

            {/* VISUAL GRAPH CANVAS / CARD MATRIX */}
            {filteredNodes.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>No evidence nodes recorded yet</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", maxWidth: 440, margin: "0 auto 16px" }}>
                  Add your skills and projects in your profile to generate your connected evidence graph.
                </p>
                <Link href="/student/profile" style={{ display: "inline-block", padding: "8px 18px", borderRadius: 8, background: "#176B5B", color: "white", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  + Add Skills & Projects
                </Link>
              </div>
            ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
              {filteredNodes.map(node => {
                const badge = getStatusBadge(node.status);
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{
                      background: isSelected ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.025)",
                      border: `1px solid ${isSelected ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 14,
                      padding: "16px 18px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: isSelected ? "0 0 25px rgba(99,102,241,0.2)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: 9, letterSpacing: 1.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase" }}>
                          {node.type}
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "white", marginTop: 2 }}>
                          {node.label}
                        </div>
                      </div>
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: "2px 8px", borderRadius: 6 }}>
                        {badge.label}
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: "0 0 12px" }}>
                      {node.details}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                        🔗 {node.connections.length} linked sources
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWhyModal(node.label);
                        }}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(129,140,248,0.3)",
                          background: "rgba(99,102,241,0.1)",
                          color: "#a5b4fc",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Inspect "Why?" ↗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* ── TAB 2: CLAIM VS EVIDENCE AUDITOR ── */}
        {activeTab === "claims" && (
          <div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#818cf8", fontWeight: 800, marginBottom: 4 }}>
                THE CENTRAL CANONICAL PRINCIPLE
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 8px" }}>
                Claim ≠ Evidence
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
                A student stating "I know distributed systems" is merely a claim. Solving 30 problems, defending Redis eviction policies, and handling regional network partitions during an interactive simulation is evidence. Cognalyze continuously validates every resume claim.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {resumeClaims.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.12)" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>No resume claims recorded yet</div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", maxWidth: 440, margin: "0 auto 16px" }}>
                    Build your Student DNA by adding your projects and skills to generate verifiable claim-to-evidence records.
                  </p>
                  <Link href="/student/profile" style={{ display: "inline-block", padding: "8px 18px", borderRadius: 8, background: "#176B5B", color: "white", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                    + Complete Student Profile
                  </Link>
                </div>
              ) : (
                resumeClaims.map((item, idx) => {
                const badge = getStatusBadge(item.status as any);
                return (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "18px 22px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: 1 }}>
                          {item.source}
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "white", marginTop: 2 }}>
                          "{item.claim}"
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: "3px 10px", borderRadius: 6 }}>
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "rgba(0,0,0,0.25)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <div style={{ fontSize: 9, letterSpacing: 1.2, color: "#00ff88", fontWeight: 800, marginBottom: 4 }}>
                          ✓ OBSERVABLE EVIDENCE
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                          {item.evidence}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, letterSpacing: 1.2, color: "#f87171", fontWeight: 800, marginBottom: 4 }}>
                          ⚠️ GAP / UNVERIFIED COMPONENT
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                          {item.gap}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        Verdict: <strong style={{ color: badge.color }}>{item.verdict}</strong>
                      </span>
                      <button
                        onClick={() => handleOpenWhyModal("DSA & Problem Solving")}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(255,255,255,0.8)",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Deep Audit Trace →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        )}

        {/* ── TAB 3: VERIFIED CAPABILITIES TABLE ── */}
        {activeTab === "skills" && intelligence && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
              {Object.entries(intelligence.capabilities).map(([capName, cap]) => {
                const statusBadge = getStatusBadge(cap.epistemicStatus || cap.proficiencyState as any);
                return (
                  <div
                    key={capName}
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>
                          {capName}
                        </span>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: statusBadge.color, background: statusBadge.bg, border: `1px solid ${statusBadge.border}`, padding: "2px 8px", borderRadius: 6 }}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>
                        <span>Coverage: <strong style={{ color: "white" }}>{cap.coverage || "Medium"}</strong></span>
                        <span>•</span>
                        <span>Depth: <strong style={{ color: "#a5b4fc" }}>{cap.depthLevel || "Explain"}</strong></span>
                        <span>•</span>
                        <span>Verified: <strong style={{ color: "#00ff88" }}>{cap.verifiedEvidenceCount}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                        {cap.evidenceCount} evidence items logged
                      </span>
                      <button
                        onClick={() => handleOpenWhyModal(capName)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 7,
                          border: "1px solid rgba(129,140,248,0.3)",
                          background: "rgba(99,102,241,0.12)",
                          color: "#a5b4fc",
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Inspect "Why?" ↗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: TRANSPARENT "WHY?" DIAGNOSTIC DRAWER ── */}
      {whyModalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#0a0815", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, maxWidth: 620, width: "100%", padding: "2rem", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, letterSpacing: 2, color: "#818cf8", fontWeight: 800 }}>
                  CANONICAL DIAGNOSTIC TRACE
                </span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: "4px 0 0" }}>
                  Why is {whyModalData.capability} marked as "{whyModalData.status}"?
                </h2>
              </div>
              <button
                onClick={() => setWhyModalData(null)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* REASONING CARD */}
            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
                ANALYSIS & REASONING
              </div>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 }}>
                {whyModalData.reasoning}
              </p>
            </div>

            {/* STRENGTHS & GAPS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 9.5, color: "#00ff88", fontWeight: 800, marginBottom: 6 }}>
                  ✓ OBSERVED STRENGTHS
                </div>
                {whyModalData.demonstratedStrengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    • {s}
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 9.5, color: "#f87171", fontWeight: 800, marginBottom: 6 }}>
                  ⚠️ MISSING EVIDENCE / GAPS
                </div>
                {whyModalData.observedGaps.map((g, i) => (
                  <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    • {g}
                  </div>
                ))}
              </div>
            </div>

            {/* SUPPORTING EVIDENCE LIST */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 8 }}>
                SUPPORTING EVIDENCE ARTIFACTS ({whyModalData.supportingEvidence.length})
              </div>
              {whyModalData.supportingEvidence.map(item => (
                <div key={item.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{item.claim}</span>
                    <span style={{ fontSize: 9, color: "#38bdf8", fontWeight: 700 }}>{item.level}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                    "{item.extractedSnippet}"
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                    Source: {item.sourceType} · {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>

            {/* RECOMMENDED NEXT ACTION */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px" }}>
              <div>
                <span style={{ fontSize: 9, color: "#818cf8", fontWeight: 800 }}>RECOMMENDED NEXT ACTION</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: "white", marginTop: 2 }}>
                  {whyModalData.recommendedNextAction}
                </div>
              </div>
              <Link
                href="/student/skills"
                style={{
                  padding: "8px 16px",
                  borderRadius: 9,
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  whiteSpace: "nowrap"
                }}
              >
                Start Practice →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
