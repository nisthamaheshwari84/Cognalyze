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
        return { label: "Verified", color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3" };
      case "Strong":
      case "Demonstrated":
        return { label: "Demonstrated", color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB" };
      case "Developing":
        return { label: "Developing", color: "#B7791F", bg: "#FEF7ED", border: "#F8D8A7" };
      case "Claimed":
        return { label: "Claimed", color: "#667085", bg: "#FAF9F6", border: "#E4E1DA" };
      case "Contradicted":
      case "Gap":
        return { label: "Gap / Contradicted", color: "#C24141", bg: "#FDF2F2", border: "#F8C8C8" };
      default:
        return { label: "Insufficient Evidence", color: "#98A2B3", bg: "#FAF9F6", border: "#E4E1DA" };
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
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      {/* HEADER SECTION */}
      <div style={{ borderBottom: "1px solid #E4E1DA", background: "#FFFFFF" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "1.5rem 2rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: 1, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                  EVIDENCE-FIRST CAREER OS
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", background: "#EAF4EE", color: "#2E7D5B", borderRadius: 5, border: "1px solid #C8E4D3", fontWeight: 600 }}>
                  Claim ≠ Evidence Engine Active
                </span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.3px", margin: 0, color: "#162A43" }}>
                Evidence Graph & Verification Hub
              </h1>
              <p style={{ color: "#667085", fontSize: 13, marginTop: 4, margin: 0, maxWidth: 680 }}>
                Every meaningful claim about your skills is linked to observable proof across code, mock interviews, and assessments.
              </p>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: "flex", background: "#FAF9F6", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA", gap: 3 }}>
              {[
                { id: "graph", label: "Evidence Graph" },
                { id: "claims", label: "Claim vs Evidence Auditor" },
                { id: "skills", label: "Verified Capabilities" }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: activeTab === t.id ? "1px solid #E4E1DA" : "1px solid transparent",
                    background: activeTab === t.id ? "#FFFFFF" : "transparent",
                    color: activeTab === t.id ? "#162A43" : "#667085",
                    fontSize: 12,
                    fontWeight: activeTab === t.id ? 600 : 500,
                    cursor: "pointer",
                    boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                    transition: "all 0.15s ease"
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
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "2rem" }}>
        
        {/* ── TAB 1: CONNECTED EVIDENCE GRAPH ── */}
        {activeTab === "graph" && (
          <div>
            {/* FILTER BAR */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>STATUS:</span>
                {["ALL", "Verified", "Demonstrated", "Developing", "Claimed"].map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusFilter(st)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: selectedStatusFilter === st ? 600 : 500,
                      cursor: "pointer",
                      border: selectedStatusFilter === st ? "1px solid #356AE6" : "1px solid #E4E1DA",
                      background: selectedStatusFilter === st ? "#EFF4FE" : "#FFFFFF",
                      color: selectedStatusFilter === st ? "#356AE6" : "#667085"
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>NODE TYPE:</span>
                {["ALL", "skill", "project", "interview", "assessment", "github"].map(ty => (
                  <button
                    key={ty}
                    onClick={() => setSelectedTypeFilter(ty)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: selectedTypeFilter === ty ? 600 : 500,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      border: selectedTypeFilter === ty ? "1px solid #356AE6" : "1px solid #E4E1DA",
                      background: selectedTypeFilter === ty ? "#EFF4FE" : "#FFFFFF",
                      color: selectedTypeFilter === ty ? "#356AE6" : "#667085"
                    }}
                  >
                    {ty}
                  </button>
                ))}
              </div>
            </div>

            {/* VISUAL GRAPH CANVAS / CARD MATRIX */}
            {filteredNodes.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#162A43", marginBottom: 6 }}>No evidence nodes recorded yet</div>
                <p style={{ fontSize: 13, color: "#667085", maxWidth: 440, margin: "0 auto 16px" }}>
                  Add your skills and projects in your profile to generate your connected evidence graph.
                </p>
                <Link href="/student/profile" style={{ display: "inline-block", padding: "8px 18px", borderRadius: 7, background: "#356AE6", color: "#FFFFFF", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
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
                      background: isSelected ? "#EFF4FE" : "#FFFFFF",
                      border: `1px solid ${isSelected ? "#356AE6" : "#E4E1DA"}`,
                      borderRadius: 10,
                      padding: "16px 18px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 0 0 1px #356AE6" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, letterSpacing: 0.5, color: "#98A2B3", fontWeight: 700, textTransform: "uppercase" }}>
                          {node.type}
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#162A43", marginTop: 2 }}>
                          {node.label}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: "2px 7px", borderRadius: 4 }}>
                        {badge.label}
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: "#667085", lineHeight: 1.5, margin: "0 0 12px" }}>
                      {node.details}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #E4E1DA", paddingTop: 10 }}>
                      <span style={{ fontSize: 11, color: "#98A2B3" }}>
                        🔗 {node.connections.length} linked sources
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWhyModal(node.label);
                        }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid #D2E0FB",
                          background: "#EFF4FE",
                          color: "#356AE6",
                          fontSize: 11,
                          fontWeight: 600,
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
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, color: "#356AE6", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                THE CENTRAL CANONICAL PRINCIPLE
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "#162A43", letterSpacing: "-0.2px" }}>
                Claim ≠ Evidence
              </h2>
              <p style={{ color: "#667085", fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
                A student stating "I know distributed systems" is merely a claim. Solving 30 problems, defending Redis eviction policies, and handling regional network partitions during an interactive simulation is evidence. Cognalyze continuously validates every resume claim.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {resumeClaims.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#162A43", marginBottom: 6 }}>No resume claims recorded yet</div>
                  <p style={{ fontSize: 13, color: "#667085", maxWidth: 440, margin: "0 auto 16px" }}>
                    Build your Student DNA by adding your projects and skills to generate verifiable claim-to-evidence records.
                  </p>
                  <Link href="/student/profile" style={{ display: "inline-block", padding: "8px 18px", borderRadius: 7, background: "#356AE6", color: "#FFFFFF", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
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
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: "18px 22px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 10, color: "#98A2B3", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                          {item.source}
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#162A43", marginTop: 2 }}>
                          "{item.claim}"
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: "2px 8px", borderRadius: 4 }}>
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, background: "#FAF9F6", padding: 14, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: 0.5, color: "#2E7D5B", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
                          ✓ OBSERVABLE EVIDENCE
                        </div>
                        <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>
                          {item.evidence}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: 0.5, color: "#B7791F", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
                          ⚠️ GAP / UNVERIFIED COMPONENT
                        </div>
                        <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>
                          {item.gap}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                      <span style={{ fontSize: 11, color: "#667085" }}>
                        Verdict: <strong style={{ color: badge.color }}>{item.verdict}</strong>
                      </span>
                      <button
                        onClick={() => handleOpenWhyModal("DSA & Problem Solving")}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: "1px solid #E4E1DA",
                          background: "#FAF9F6",
                          color: "#162A43",
                          fontSize: 11,
                          fontWeight: 600,
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
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#162A43" }}>
                          {capName}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: statusBadge.color, background: statusBadge.bg, border: `1px solid ${statusBadge.border}`, padding: "2px 7px", borderRadius: 4 }}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#667085", marginBottom: 12 }}>
                        <span>Coverage: <strong style={{ color: "#162A43" }}>{cap.coverage || "Medium"}</strong></span>
                        <span>•</span>
                        <span>Depth: <strong style={{ color: "#356AE6" }}>{cap.depthLevel || "Explain"}</strong></span>
                        <span>•</span>
                        <span>Verified: <strong style={{ color: "#2E7D5B" }}>{cap.verifiedEvidenceCount}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #E4E1DA", paddingTop: 10 }}>
                      <span style={{ fontSize: 11, color: "#98A2B3" }}>
                        {cap.evidenceCount} evidence items logged
                      </span>
                      <button
                        onClick={() => handleOpenWhyModal(capName)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid #D2E0FB",
                          background: "#EFF4FE",
                          color: "#356AE6",
                          fontSize: 11,
                          fontWeight: 600,
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(22, 42, 67, 0.45)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, maxWidth: 620, width: "100%", padding: "24px 28px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(22, 42, 67, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, letterSpacing: 1, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                  CANONICAL DIAGNOSTIC TRACE
                </span>
                <h2 style={{ fontSize: 17, fontWeight: 600, margin: "4px 0 0", color: "#162A43" }}>
                  Why is {whyModalData.capability} marked as "{whyModalData.status}"?
                </h2>
              </div>
              <button
                onClick={() => setWhyModalData(null)}
                style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#667085", width: 28, height: 28, borderRadius: 6, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            {/* REASONING CARD */}
            <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>
                ANALYSIS & REASONING
              </div>
              <p style={{ fontSize: 12.5, color: "#162A43", lineHeight: 1.5, margin: 0 }}>
                {whyModalData.reasoning}
              </p>
            </div>

            {/* STRENGTHS & GAPS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
                  ✓ OBSERVED STRENGTHS
                </div>
                {whyModalData.demonstratedStrengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#2E7D5B", marginBottom: 4 }}>
                    • {s}
                  </div>
                ))}
              </div>

              <div style={{ background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: "#C24141", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
                  ⚠️ MISSING EVIDENCE / GAPS
                </div>
                {whyModalData.observedGaps.map((g, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#C24141", marginBottom: 4 }}>
                    • {g}
                  </div>
                ))}
              </div>
            </div>

            {/* SUPPORTING EVIDENCE LIST */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 0.5, color: "#667085", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                SUPPORTING EVIDENCE ARTIFACTS ({whyModalData.supportingEvidence.length})
              </div>
              {whyModalData.supportingEvidence.map(item => (
                <div key={item.id} style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, padding: "10px 12px", marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#162A43" }}>{item.claim}</span>
                    <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 600 }}>{item.level}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", lineHeight: 1.4 }}>
                    "{item.extractedSnippet}"
                  </div>
                  <div style={{ fontSize: 10, color: "#98A2B3", marginTop: 4 }}>
                    Source: {item.sourceType} · {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>

            {/* RECOMMENDED NEXT ACTION */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: "12px 16px" }}>
              <div>
                <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>RECOMMENDED NEXT ACTION</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#162A43", marginTop: 2 }}>
                  {whyModalData.recommendedNextAction}
                </div>
              </div>
              <Link
                href="/student/skills"
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
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
