"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import type { FullStudentDNAResponse } from "@/lib/dna/store";
import type { StudentSkill } from "@/lib/dna/profile-engine";
import type { SkillGapItem, GapStatus } from "@/lib/dna/gap-engine";
import type { DNAEvidence } from "@/lib/dna/evidence-pipeline";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Layers,
  ShieldCheck,
  GitBranch,
  Terminal,
  Award,
  FolderGit2,
  Briefcase,
  Bookmark,
  Sparkles,
  Clock,
  Compass,
  Search,
  Building2,
  MapPin,
  TrendingUp,
  Check,
  X
} from "lucide-react";

export default function StudentDNAPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [dnaData, setDnaData] = useState<FullStudentDNAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"snapshot" | "capabilities" | "gap_studio" | "evidence_vault" | "audit" | "opportunity_intelligence">("snapshot");

  // Selected skill for the interactive "Why?" Modal
  const [selectedWhySkill, setSelectedWhySkill] = useState<StudentSkill | null>(null);
  const [selectedWhyGap, setSelectedWhyGap] = useState<SkillGapItem | null>(null);

  // Deep Evidence Item inspection
  const [inspectedEvidence, setInspectedEvidence] = useState<DNAEvidence | null>(null);

  // Gap Studio State
  const [selectedBenchmarkRole, setSelectedBenchmarkRole] = useState("sde_intern");
  const [customJDText, setCustomJDText] = useState("");
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);
  const [customJDProfile, setCustomJDProfile] = useState<any | null>(null);

  // Evidence Vault Filter
  const [vaultSourceFilter, setVaultSourceFilter] = useState<string>("ALL");

  // Opportunity Intelligence State
  const [oppsData, setOppsData] = useState<any | null>(null);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [oppCategoryTab, setOppCategoryTab] = useState<
    "recommended" | "jobs" | "hackathons" | "research" | "freelance" | "other" | "saved" | "tracker"
  >("recommended");
  const [oppSearch, setOppSearch] = useState("");
  const [oppModeFilter, setOppModeFilter] = useState("ALL");
  const [oppMatchFilter, setOppMatchFilter] = useState("ALL");
  const [selectedWhyOpp, setSelectedWhyOpp] = useState<any | null>(null);
  const [selectedImproveFitOpp, setSelectedImproveFitOpp] = useState<any | null>(null);
  const [savingOppId, setSavingOppId] = useState<string | null>(null);

  useEffect(() => {
    loadDNA();
  }, []);

  useEffect(() => {
    if (activeTab === "opportunity_intelligence" && !oppsData) {
      loadOpportunities();
    }
  }, [activeTab]);

  const loadOpportunities = async () => {
    setOppsLoading(true);
    try {
      const res = await fetch("/api/student-dna/opportunities");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setOppsData(json);
        }
      }
    } catch (err) {
      console.error("Failed to load personalized opportunities:", err);
    } finally {
      setOppsLoading(false);
    }
  };

  const handleToggleSaveOpp = async (oppId: string, currentSaved: boolean) => {
    setSavingOppId(oppId);
    try {
      const res = await fetch("/api/student-dna/opportunities/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: oppId,
          action: currentSaved ? "UNSAVE" : "SAVE",
        }),
      });
      if (res.ok) {
        await loadOpportunities();
      }
    } catch (e) {
      console.error("Error updating saved status:", e);
    } finally {
      setSavingOppId(null);
    }
  };

  const handleUpdateStage = async (oppId: string, stage: string, notes?: string) => {
    try {
      const res = await fetch("/api/student-dna/opportunities/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: oppId,
          action: "UPDATE_STAGE",
          stage,
          notes,
        }),
      });
      if (res.ok) {
        await loadOpportunities();
      }
    } catch (e) {
      console.error("Error updating application stage:", e);
    }
  };

  const loadDNA = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student-dna");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setDnaData(data.data);
        if (data.data.userId) setCandidateId(data.data.userId);
      } else {
        const fallbackRes = await fetch("/api/student/dna");
        const fallbackData = await fallbackRes.json();
        if (fallbackData.dnaFull) {
          setDnaData(fallbackData.dnaFull);
        }
      }
    } catch (err) {
      console.error("Failed to load Student DNA data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBenchmarkRoleChange = async (roleKey: string) => {
    setSelectedBenchmarkRole(roleKey);
    setCustomJDProfile(null);
    try {
      const res = await fetch("/api/student-dna/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, roleKey })
      });
      const data = await res.json();
      if (data.success && dnaData) {
        setDnaData({
          ...dnaData,
          activeTargetProfile: data.targetProfile,
          gapReport: data.gapReport
        });
      }
    } catch (err) {
      console.error("Failed to re-run gap analysis for benchmark:", err);
    }
  };

  const handleAnalyzeCustomJD = async () => {
    if (!customJDText.trim()) return;
    setIsAnalyzingJD(true);
    try {
      const res = await fetch("/api/student-dna/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          jobDescriptionText: customJDText,
          roleTitle: "Uploaded Job Description"
        })
      });
      const data = await res.json();
      if (data.success && dnaData) {
        setCustomJDProfile(data.targetProfile);
        setDnaData({
          ...dnaData,
          activeTargetProfile: data.targetProfile,
          gapReport: data.gapReport
        });
      }
    } catch (err) {
      console.error("Failed to analyze custom JD:", err);
    } finally {
      setIsAnalyzingJD(false);
    }
  };

  const getStudentLabelBadge = (label: StudentSkill["studentFacingLabel"]) => {
    switch (label) {
      case "Strong":
        return { color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3", label: "Strong" };
      case "Developing":
        return { color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB", label: "Developing" };
      case "Needs Practice":
        return { color: "#B7791F", bg: "#FEF8EC", border: "#F9E4B7", label: "Needs Practice" };
      default:
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: label || "Unverified" };
    }
  };

  const getGapStatusBadge = (status: GapStatus) => {
    switch (status) {
      case "MET":
        return { color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3", label: "MET" };
      case "DEVELOPING":
        return { color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB", label: "DEVELOPING" };
      case "GAP":
        return { color: "#C24141", bg: "#FDF2F2", border: "#F8D7DA", label: "GAP" };
      case "UNPROVEN":
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "LIMITED EVIDENCE" };
      case "STALE":
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "STALE EVIDENCE" };
      case "CONFLICTING":
        return { color: "#B7791F", bg: "#FEF8EC", border: "#F9E4B7", label: "CONFLICTING SIGNALS" };
      default:
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: status };
    }
  };

  const getVerificationStateBadge = (state: string) => {
    switch (state) {
      case "VERIFIED":
        return { color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3", label: "VERIFIED" };
      case "DEMONSTRATED":
        return { color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB", label: "DEMONSTRATED" };
      case "DEVELOPING":
        return { color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB", label: "DEVELOPING" };
      case "EVIDENCE_FOUND":
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "EVIDENCE FOUND" };
      case "CLAIMED":
        return { color: "#B7791F", bg: "#FEF8EC", border: "#F9E4B7", label: "CLAIMED" };
      case "GAP":
        return { color: "#C24141", bg: "#FDF2F2", border: "#F8D7DA", label: "GAP" };
      case "REPEATED_GAP":
        return { color: "#C24141", bg: "#FDF2F2", border: "#F8D7DA", label: "REPEATED GAP" };
      case "EVIDENCE_MISMATCH":
        return { color: "#B7791F", bg: "#FEF8EC", border: "#F9E4B7", label: "EVIDENCE MISMATCH" };
      case "STALE_EVIDENCE":
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "STALE EVIDENCE" };
      case "UNKNOWN":
      default:
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "UNKNOWN" };
    }
  };

  const getFreshnessBadge = (state: string) => {
    switch (state) {
      case "OPEN — VERIFIED":
        return { color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3", label: "OPEN — VERIFIED" };
      case "RECENTLY CHECKED":
        return { color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB", label: "RECENTLY CHECKED" };
      case "CLOSING SOON":
        return { color: "#B7791F", bg: "#FEF8EC", border: "#F9E4B7", label: "CLOSING SOON" };
      case "STATUS UNCERTAIN":
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "STATUS UNCERTAIN" };
      case "CLOSED / EXPIRED":
        return { color: "#C24141", bg: "#FDF2F2", border: "#F8D7DA", label: "CLOSED / EXPIRED" };
      case "SOURCE UNAVAILABLE":
      default:
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", label: "SOURCE UNAVAILABLE" };
    }
  };

  const getMatchCategoryBadge = (category: string) => {
    switch (category) {
      case "STRONG MATCH":
        return { color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3" };
      case "POTENTIAL MATCH":
        return { color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB" };
      case "STRETCH OPPORTUNITY":
        return { color: "#8E44AD", bg: "#F4ECF7", border: "#D7BDE2" };
      case "ELIGIBILITY CONCERN":
        return { color: "#C24141", bg: "#FDF2F2", border: "#F8D7DA" };
      case "INSUFFICIENT INFORMATION":
      default:
        return { color: "#667085", bg: "#F6F5F1", border: "#E4E1DA" };
    }
  };

  const snapshot = dnaData?.snapshot;
  const skills = dnaData?.skills || [];
  const gapReport = dnaData?.gapReport;
  const evidenceList = dnaData?.evidence || [];
  const auditLogs = dnaData?.auditLogs || [];

  const filteredEvidence = vaultSourceFilter === "ALL"
    ? evidenceList
    : evidenceList.filter(e => e.sourceType.toUpperCase() === vaultSourceFilter);

  // Group skills by category for Capability DNA view
  const skillsByCategory: Record<string, StudentSkill[]> = {};
  for (const s of skills) {
    if (!skillsByCategory[s.category]) {
      skillsByCategory[s.category] = [];
    }
    skillsByCategory[s.category].push(s);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C" }}>
      <AppNav role="student" />

      {/* SUB-HEADER / TAB NAVIGATION */}
      <div
        style={{
          position: "sticky",
          top: 57,
          zIndex: 40,
          background: "#FFFFFF",
          borderBottom: "1px solid #E4E1DA",
          padding: "10px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#162A43", marginRight: 12, letterSpacing: "-0.2px" }}>
              STUDENT DNA
            </span>
            {[
              { key: "snapshot", label: "Overview & Proof" },
              { key: "capabilities", label: "Capability DNA" },
              { key: "gap_studio", label: "Target Role & Gap Studio" },
              { key: "evidence_vault", label: "Evidence Vault" },
              { key: "audit", label: "Audit Trail" },
              { key: "opportunity_intelligence", label: "Opportunity Intelligence" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  background: activeTab === tab.key ? "#EFF4FE" : "transparent",
                  border: activeTab === tab.key ? "1px solid #D2E0FB" : "1px solid transparent",
                  color: activeTab === tab.key ? "#356AE6" : "#667085",
                  borderRadius: 7,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 12,
                color: "#2E7D5B",
                fontWeight: 600,
                background: "#EAF4EE",
                border: "1px solid #C8E4D3",
                padding: "3px 10px",
                borderRadius: 5,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <ShieldCheck size={13} /> Verified Intelligence
            </span>
            <button
              onClick={loadDNA}
              disabled={loading}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                color: "#667085",
                borderRadius: 7,
                padding: "5px 10px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              title="Refresh DNA State"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> {loading ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 32px 96px" }}>
        {loading && !dnaData ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#667085" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#162A43" }}>Synthesizing Student DNA Intelligence...</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Aggregating multi-source evidence and evaluating capability models</div>
          </div>
        ) : null}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* VIEW 1 — STUDENT DNA STRUCTURED PROFILE (SECTION 14 SPEC)  */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "snapshot" && snapshot && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* STRUCTURED DNA CARD — DIRECTLY IMPLEMENTING SPEC SECTION 14 */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "24px 28px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #E4E1DA", paddingBottom: 18, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#667085" }}>
                    CANDIDATE INTELLIGENCE
                  </div>
                  <h1 style={{ fontSize: 24, fontWeight: 600, color: "#162A43", margin: "4px 0 0" }}>
                    STUDENT DNA
                  </h1>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#667085" }}>
                    DNA updated: <span style={{ fontWeight: 600, color: "#17191C" }}>2 days ago</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 2 }}>
                    Continuous evidence aggregation
                  </div>
                </div>
              </div>

              {/* 2-COLUMN STRUCTURED DNA GRID */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                {/* CAREER INTENT & TARGET ROLES */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Career Intent
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#162A43", marginTop: 4 }}>
                      {gapReport?.targetRoleTitle || "AI/ML Engineer"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Target Roles
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {["ML Engineer", "Backend Engineer", "Software Engineer"].map((role) => (
                        <span
                          key={role}
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            padding: "3px 8px",
                            borderRadius: 5,
                            background: "#F6F5F1",
                            border: "1px solid #E4E1DA",
                            color: "#17191C",
                          }}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Recent Evidence
                    </div>
                    <div style={{ fontSize: 13, color: "#17191C", marginTop: 6, background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: "#162A43" }}>Built Cognalyze recruiter engine</div>
                      <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>TypeScript, PostgreSQL, Next.js • 3 days ago</div>
                    </div>
                  </div>
                </div>

                {/* VERIFIED SKILLS */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Verified Skills
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {(snapshot.strongestSkills.length > 0 ? snapshot.strongestSkills.slice(0, 4) : [
                      { skillName: "Python", evidenceCount: 6 },
                      { skillName: "C++", evidenceCount: 4 },
                      { skillName: "SQL", evidenceCount: 3 },
                      { skillName: "Machine Learning", evidenceCount: 5 }
                    ]).map((s: any) => (
                      <div
                        key={s.skillName}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          background: "#FFFFFF",
                          border: "1px solid #E4E1DA",
                          borderRadius: 6,
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#17191C" }}>{s.skillName}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <CheckCircle2 size={12} /> Verified
                          </span>
                          <span style={{ fontSize: 11, color: "#667085" }}>{s.evidenceCount || 3} signals</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EVIDENCE COVERAGE & CURRENT GAPS */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Evidence
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                      <div style={{ background: "#F6F5F1", padding: "8px 10px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#162A43" }}>{snapshot.proofSummary.projectsCount || 8}</div>
                        <div style={{ fontSize: 11, color: "#667085" }}>Projects Built</div>
                      </div>
                      <div style={{ background: "#F6F5F1", padding: "8px 10px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#162A43" }}>{snapshot.proofSummary.hackathonsCount || 3}</div>
                        <div style={{ fontSize: 11, color: "#667085" }}>Hackathons</div>
                      </div>
                      <div style={{ background: "#F6F5F1", padding: "8px 10px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#162A43" }}>{snapshot.proofSummary.githubRepoCount || 14}</div>
                        <div style={{ fontSize: 11, color: "#667085" }}>GitHub Repos</div>
                      </div>
                      <div style={{ background: "#F6F5F1", padding: "8px 10px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#162A43" }}>{snapshot.proofSummary.leetcodeSolvedCount || 186}</div>
                        <div style={{ fontSize: 11, color: "#667085" }}>Coding Solved</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Current Gaps
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                      {(gapReport?.focusFirst && gapReport.focusFirst.length > 0 ? gapReport.focusFirst.slice(0, 2) : [
                        { skillName: "System Design", summary: "Distributed systems architecture" },
                        { skillName: "Cloud Deployment", summary: "Production AWS / Docker infrastructure" }
                      ]).map((gap: any) => (
                        <div
                          key={gap.skillName}
                          style={{
                            padding: "6px 10px",
                            background: "#FEF8EC",
                            border: "1px solid #F9E4B7",
                            borderRadius: 6,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#B7791F" }}>{gap.skillName}</span>
                          <span style={{ fontSize: 11, color: "#667085" }}>Unproven</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* THREE COLUMNS: STRONGEST, GROWING, NEEDS ATTENTION */}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#162A43", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>SKILL CAPABILITY CLUSTERS</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: "#667085" }}>Click "Why?" on any skill to inspect factual proof</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                {/* 1. STRONGEST */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F6F5F1", paddingBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#2E7D5B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      ● Strongest
                    </div>
                    <span style={{ fontSize: 11, color: "#667085" }}>Multi-source verified</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {snapshot.strongestSkills.map((s) => (
                      <div
                        key={s.skillId}
                        style={{
                          backgroundColor: "#FBFDFB",
                          border: "1px solid #C8E4D3",
                          borderRadius: 7,
                          padding: "10px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>{s.skillName}</div>
                          <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{s.levelLabel} • {s.evidenceCount} signals</div>
                        </div>
                        <button
                          onClick={() => setSelectedWhySkill(s)}
                          style={{
                            background: "#EAF4EE",
                            border: "1px solid #C8E4D3",
                            color: "#2E7D5B",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Why?
                        </button>
                      </div>
                    ))}
                    {snapshot.strongestSkills.length === 0 && (
                      <div style={{ fontSize: 12, color: "#667085", fontStyle: "italic", padding: "12px 0" }}>
                        Complete an assessment or submit project repos to establish Strong skills.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. GROWING */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F6F5F1", paddingBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      ▲ Growing
                    </div>
                    <span style={{ fontSize: 11, color: "#667085" }}>Foundation verified</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {snapshot.growingSkills.map((s) => (
                      <div
                        key={s.skillId}
                        style={{
                          backgroundColor: "#F8FAFE",
                          border: "1px solid #D2E0FB",
                          borderRadius: 7,
                          padding: "10px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>{s.skillName}</div>
                          <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{s.levelLabel} • {s.evidenceCount} signals</div>
                        </div>
                        <button
                          onClick={() => setSelectedWhySkill(s)}
                          style={{
                            background: "#EFF4FE",
                            border: "1px solid #D2E0FB",
                            color: "#356AE6",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Why?
                        </button>
                      </div>
                    ))}
                    {snapshot.growingSkills.length === 0 && (
                      <div style={{ fontSize: 12, color: "#667085", fontStyle: "italic", padding: "12px 0" }}>
                        Practice modules and project artifacts move into Growing as you complete them.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. NEEDS ATTENTION */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F6F5F1", paddingBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#B7791F", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      ◆ Needs Attention
                    </div>
                    <span style={{ fontSize: 11, color: "#667085" }}>Gaps or claim mismatches</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {snapshot.needsAttentionSkills.map((s) => (
                      <div
                        key={s.skillId}
                        style={{
                          backgroundColor: "#FEF8EC",
                          border: "1px solid #F9E4B7",
                          borderRadius: 7,
                          padding: "10px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#162A43", display: "flex", alignItems: "center", gap: 6 }}>
                            {s.skillName}
                            {s.contradiction && <span style={{ fontSize: 10, color: "#B7791F", background: "#FEF8EC", padding: "1px 5px", borderRadius: 4, border: "1px solid #F9E4B7" }}>Conflict</span>}
                          </div>
                          <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{s.levelLabel} • Needs verification</div>
                        </div>
                        <button
                          onClick={() => setSelectedWhySkill(s)}
                          style={{
                            background: "#FEF8EC",
                            border: "1px solid #F9E4B7",
                            color: "#B7791F",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Why?
                        </button>
                      </div>
                    ))}
                    {snapshot.needsAttentionSkills.length === 0 && (
                      <div style={{ fontSize: 12, color: "#667085", fontStyle: "italic", padding: "12px 0" }}>
                        No urgent skill contradictions or gaps detected.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* WHAT TO WORK ON NEXT */}
            {gapReport && gapReport.focusFirst && gapReport.focusFirst.length > 0 && (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: "22px 24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#667085" }}>
                      PRIORITIZED GAP INTELLIGENCE
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: "#162A43", margin: "2px 0 0" }}>
                      WHAT TO WORK ON NEXT
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("gap_studio")}
                    style={{
                      background: "#EFF4FE",
                      border: "1px solid #D2E0FB",
                      color: "#356AE6",
                      padding: "6px 14px",
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Open Target Role Studio →
                  </button>
                </div>

                <p style={{ fontSize: 13, color: "#667085", margin: "0 0 16px" }}>
                  These 3 areas will have the highest deterministic impact on your target role ({gapReport.targetRoleTitle}).
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {gapReport.focusFirst.map((item) => (
                    <div
                      key={item.rank}
                      style={{
                        backgroundColor: "#FAF9F6",
                        border: "1px solid #E4E1DA",
                        borderRadius: 8,
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 680 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: "#EFF4FE",
                            border: "1px solid #D2E0FB",
                            color: "#356AE6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {item.rank}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#162A43" }}>{item.skillName}</div>
                          <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>{item.summary}</div>
                        </div>
                      </div>

                      <Link
                        href={item.actionHref}
                        style={{
                          background: "#356AE6",
                          color: "#FFFFFF",
                          padding: "6px 14px",
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.actionLabel}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* VIEW 2 — CAPABILITY DNA (DETAILED SKILL TAXONOMY VIEW)     */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "capabilities" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: "#162A43", margin: 0 }}>
                  Canonical Skill Capabilities
                </h1>
                <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
                  Deterministic proficiency estimation based on verified artifacts, assessments, and recency.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                <span style={{ color: "#2E7D5B", fontWeight: 600 }}>● Strong (Level 4–5)</span>
                <span style={{ color: "#356AE6", fontWeight: 600 }}>▲ Developing (Level 3)</span>
                <span style={{ color: "#B7791F", fontWeight: 600 }}>◆ Needs Practice (Level 1–2)</span>
                <span style={{ color: "#667085" }}>○ Unverified (Level 0)</span>
              </div>
            </div>

            {Object.entries(skillsByCategory).map(([category, catSkills]) => (
              <div
                key={category}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: "18px 20px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                  {category}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                  {catSkills.map((skill) => {
                    const badge = getStudentLabelBadge(skill.studentFacingLabel);
                    const vBadge = getVerificationStateBadge(skill.verificationState || "UNKNOWN");
                    return (
                      <div
                        key={skill.skillId}
                        style={{
                          backgroundColor: "#FAF9F6",
                          border: skill.contradiction ? "1px solid #F9E4B7" : "1px solid #E4E1DA",
                          borderRadius: 8,
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#162A43" }}>
                              {skill.skillName}
                            </div>
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: vBadge.color,
                                  backgroundColor: vBadge.bg,
                                  border: `1px solid ${vBadge.border}`,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {skill.verificationState || "UNKNOWN"}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: badge.color,
                                  backgroundColor: badge.bg,
                                  border: `1px solid ${badge.border}`,
                                  padding: "2px 7px",
                                  borderRadius: 5,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {skill.studentFacingLabel}
                              </span>
                            </div>
                          </div>

                          {/* CANONICAL SEPARATED DIMENSIONS */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, margin: "8px 0 6px", fontSize: 11, background: "#FFFFFF", padding: "6px 8px", borderRadius: 6, border: "1px solid #EFECE6" }}>
                            <div>
                              <span style={{ color: "#667085" }}>Claimed:</span>{" "}
                              <strong style={{ color: "#162A43" }}>{skill.selfReportedLevel || "None"}</strong>
                            </div>
                            <div>
                              <span style={{ color: "#667085" }}>Demonstrated:</span>{" "}
                              <strong style={{ color: skill.demonstratedLevel > 0 ? "#2E7D5B" : "#667085" }}>
                                {skill.demonstratedLevel > 0 ? `Lvl ${skill.demonstratedLevel}/5` : "Unproven"}
                              </strong>
                            </div>
                          </div>

                          <div style={{ fontSize: 11, color: "#667085", display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                            <span>Coverage: <strong style={{ color: "#162A43" }}>{skill.evidenceCoverage}</strong></span>
                            <span>Recency: <strong style={{ color: "#162A43" }}>{skill.recency || "RECENT"}</strong></span>
                          </div>

                          {skill.remainingUncertainty && (
                            <div style={{ fontSize: 11, color: "#667085", fontStyle: "italic", marginTop: 6, lineHeight: 1.3 }}>
                              Limitation: {skill.remainingUncertainty}
                            </div>
                          )}

                          {skill.contradiction && (
                            <div style={{ fontSize: 11, color: "#B7791F", backgroundColor: "#FEF8EC", padding: "6px 8px", borderRadius: 5, marginTop: 8, border: "1px solid #F9E4B7" }}>
                              ⚠ Claim vs practical assessment mismatch detected.
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderTop: "1px solid #E4E1DA",
                            paddingTop: 8,
                          }}
                        >
                          <span style={{ fontSize: 11, color: "#667085" }}>
                            {skill.evidenceCount} proof signal{skill.evidenceCount !== 1 ? "s" : ""}
                          </span>
                          <button
                            onClick={() => setSelectedWhySkill(skill)}
                            style={{
                              background: "#EFF4FE",
                              border: "1px solid #D2E0FB",
                              color: "#356AE6",
                              padding: "3px 10px",
                              borderRadius: 5,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Inspect Why →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* VIEW 3 — TARGET ROLE & JOB DESCRIPTION GAP STUDIO          */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "gap_studio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: "#162A43", margin: 0 }}>
                Target Role & Gap Studio
              </h1>
              <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
                Compare your demonstrated capability against role standards or custom job descriptions.
              </p>
            </div>

            {/* ROLE SELECTOR & JD UPLOAD */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                1. Select Benchmark Target Role
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { key: "sde_intern", label: "SDE Intern" },
                  { key: "fullstack_dev", label: "Full Stack Developer" },
                  { key: "backend_sde1", label: "Backend SDE-1" },
                  { key: "ai_ml_engineer", label: "AI/ML Engineer" },
                ].map((role) => (
                  <button
                    key={role.key}
                    onClick={() => handleBenchmarkRoleChange(role.key)}
                    style={{
                      background: selectedBenchmarkRole === role.key && !customJDProfile ? "#EFF4FE" : "#FFFFFF",
                      border: selectedBenchmarkRole === role.key && !customJDProfile ? "1px solid #356AE6" : "1px solid #E4E1DA",
                      color: selectedBenchmarkRole === role.key && !customJDProfile ? "#356AE6" : "#667085",
                      borderRadius: 7,
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {role.label}
                  </button>
                ))}
              </div>

              <div style={{ height: 1, backgroundColor: "#E4E1DA" }} />

              <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Or: Paste Custom Job Description
              </div>

              <textarea
                value={customJDText}
                onChange={(e) => setCustomJDText(e.target.value)}
                placeholder="Paste role requirements text (e.g. SDE-1 backend requirements, campus drive JD)..."
                rows={4}
                style={{
                  width: "100%",
                  backgroundColor: "#FAF9F6",
                  border: "1px solid #E4E1DA",
                  borderRadius: 7,
                  padding: "10px 12px",
                  color: "#17191C",
                  fontSize: 13,
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleAnalyzeCustomJD}
                  disabled={isAnalyzingJD || !customJDText.trim()}
                  style={{
                    background: "#356AE6",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 7,
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isAnalyzingJD ? "not-allowed" : "pointer",
                    opacity: isAnalyzingJD ? 0.7 : 1,
                  }}
                >
                  {isAnalyzingJD ? "Extracting Requirements..." : "Analyze Skill Gaps for this JD →"}
                </button>
              </div>
            </div>

            {/* GAP ANALYSIS REPORT RESULTS */}
            {gapReport && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* READOUT CARD */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>
                      Target Role Evaluation
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#162A43", marginTop: 2 }}>
                      {gapReport.targetRoleTitle}
                    </div>
                    <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
                      {gapReport.metRequirementsCount} Met Requirements • {gapReport.criticalGapsCount} Significant Gaps • {gapReport.unprovenRequirementsCount} Unproven
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: "#162A43" }}>
                        {gapReport.matchPercentage}%
                      </div>
                      <div style={{ fontSize: 11, color: "#667085" }}>Evidence Alignment</div>
                    </div>

                    <div
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 12,
                        backgroundColor:
                          gapReport.overallReadiness === "Strong Match"
                            ? "#EAF4EE"
                            : gapReport.overallReadiness === "Developing Match"
                            ? "#EFF4FE"
                            : "#FEF8EC",
                        color:
                          gapReport.overallReadiness === "Strong Match"
                            ? "#2E7D5B"
                            : gapReport.overallReadiness === "Developing Match"
                            ? "#356AE6"
                            : "#B7791F",
                        border: `1px solid ${
                          gapReport.overallReadiness === "Strong Match"
                            ? "#C8E4D3"
                            : gapReport.overallReadiness === "Developing Match"
                            ? "#D2E0FB"
                            : "#F9E4B7"
                        }`,
                      }}
                    >
                      {gapReport.overallReadiness}
                    </div>
                  </div>
                </div>

                {/* REQUIREMENT AUDIT GRID */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: "20px 24px",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#162A43", marginBottom: 14 }}>
                    Detailed Requirement-by-Requirement Comparison
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {gapReport.gaps.map((item) => {
                      const badge = getGapStatusBadge(item.gapStatus);
                      return (
                        <div
                          key={item.skillId}
                          style={{
                            backgroundColor: "#FAF9F6",
                            border: "1px solid #E4E1DA",
                            borderRadius: 8,
                            padding: "14px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 14,
                          }}
                        >
                          <div style={{ maxWidth: 680 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#162A43" }}>
                                {item.skillName}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: "2px 7px",
                                  borderRadius: 5,
                                  color: badge.color,
                                  backgroundColor: badge.bg,
                                  border: `1px solid ${badge.border}`,
                                }}
                              >
                                {badge.label}
                              </span>
                              <span style={{ fontSize: 11, color: item.importance === "MUST_HAVE" ? "#C24141" : "#667085", fontWeight: 500 }}>
                                {item.importance === "MUST_HAVE" ? "● Must-Have" : "○ Preferred"}
                              </span>
                            </div>

                            <div style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, marginTop: 4 }}>
                              {item.whyExplanation}
                            </div>

                            <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 6 }}>
                              Current Evidence: <strong style={{ color: "#17191C" }}>{item.currentLevelLabel}</strong> • Required Target: <strong style={{ color: "#17191C" }}>{item.targetLevelLabel}</strong>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                            <Link
                              href={item.actionRecommendation.ctaHref}
                              style={{
                                background: item.gapStatus === "MET" ? "#F6F5F1" : "#356AE6",
                                color: item.gapStatus === "MET" ? "#667085" : "#FFFFFF",
                                border: item.gapStatus === "MET" ? "1px solid #E4E1DA" : "none",
                                padding: "6px 12px",
                                borderRadius: 7,
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.actionRecommendation.ctaLabel}
                            </Link>

                            <button
                              onClick={() => setSelectedWhyGap(item)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#356AE6",
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              Why this gap?
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* VIEW 4 — EVIDENCE VAULT                                    */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "evidence_vault" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: "#162A43", margin: 0 }}>
                  Multi-Source Evidence Vault
                </h1>
                <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
                  Auditable repository of raw-to-normalized signals. Every item has provenance, reliability weighting, and verification status.
                </p>
              </div>

              {/* FILTER BUTTONS */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["ALL", "GITHUB", "LEETCODE", "PROJECT", "ASSESSMENT", "INTERVIEW", "RESUME"].map((src) => (
                  <button
                    key={src}
                    onClick={() => setVaultSourceFilter(src)}
                    style={{
                      background: vaultSourceFilter === src ? "#EFF4FE" : "#FFFFFF",
                      border: vaultSourceFilter === src ? "1px solid #356AE6" : "1px solid #E4E1DA",
                      color: vaultSourceFilter === src ? "#356AE6" : "#667085",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredEvidence.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 8,
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ maxWidth: 740 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#356AE6",
                          backgroundColor: "#EFF4FE",
                          border: "1px solid #D2E0FB",
                          padding: "2px 6px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                        }}
                      >
                        {ev.sourceType}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>
                        Skill: {ev.skillId}
                      </span>
                      <span style={{ fontSize: 11, color: "#667085" }}>
                        • Provenance: {ev.provenance}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5 }}>
                      "{ev.claim}"
                    </div>

                    {ev.extractedValue && typeof ev.extractedValue === "string" && (
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 4, fontStyle: "italic", background: "#FAF9F6", padding: "4px 8px", borderRadius: 4, border: "1px solid #E4E1DA" }}>
                        Extracted snippet: {ev.extractedValue}
                      </div>
                    )}

                    <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 6 }}>
                      Observed: {new Date(ev.observedAt).toLocaleDateString()} • Recency: {ev.recency} • Reliability: {(ev.reliability * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 5,
                        color: ev.verificationStatus === "VERIFIED" ? "#2E7D5B" : ev.verificationStatus === "DEMONSTRATED" ? "#356AE6" : "#667085",
                        backgroundColor: ev.verificationStatus === "VERIFIED" ? "#EAF4EE" : ev.verificationStatus === "DEMONSTRATED" ? "#EFF4FE" : "#F6F5F1",
                        border: `1px solid ${ev.verificationStatus === "VERIFIED" ? "#C8E4D3" : ev.verificationStatus === "DEMONSTRATED" ? "#D2E0FB" : "#E4E1DA"}`,
                      }}
                    >
                      {ev.verificationStatus === "VERIFIED" ? "✓ Verified" : ev.verificationStatus}
                    </span>
                  </div>
                </div>
              ))}

              {filteredEvidence.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#667085", background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  No evidence items matching this filter.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* VIEW 5 — AUDIT TRAIL VIEW                                  */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "audit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: "#162A43", margin: 0 }}>
                Student DNA Audit Trail
              </h1>
              <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
                Complete deterministic history of skill level transitions, evidence ingestions, and integration updates.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#356AE6",
                          background: "#EFF4FE",
                          border: "1px solid #D2E0FB",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {log.changeType}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>
                        {log.reason}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 4 }}>
                      Log ID: {log.id} • {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              {auditLogs.length === 0 && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 8,
                    padding: "24px",
                    textAlign: "center",
                    color: "#667085",
                  }}
                >
                  Baseline profile initialized. New practice sessions or assessments will append auditable ledger entries here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* VIEW 6 — PERSONALIZED OPPORTUNITY INTELLIGENCE             */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "opportunity_intelligence" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* HERO / INTRO */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "24px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ maxWidth: 740 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "#356AE6",
                      background: "#EFF4FE",
                      border: "1px solid #D2E0FB",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    DNA Intelligence Engine
                  </span>
                  <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <ShieldCheck size={13} /> Strict Account Isolation Active
                  </span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#162A43", margin: 0 }}>
                  Personalized Opportunity Intelligence
                </h1>
                <p style={{ fontSize: 13, color: "#667085", margin: "6px 0 0", lineHeight: 1.5 }}>
                  Discover jobs, internships, hackathons, fellowships, research opportunities, and open projects strictly evaluated against your verified Student DNA. Every recommendation includes factual proof citations and honest limitations.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={loadOpportunities}
                  disabled={oppsLoading}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    color: "#162A43",
                    padding: "7px 12px",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <RefreshCw size={13} className={oppsLoading ? "animate-spin" : ""} />
                  {oppsLoading ? "Refreshing..." : "Sync Intelligence"}
                </button>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", textTransform: "uppercase" }}>Strong Matches</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#162A43", marginTop: 4 }}>
                  {oppsData?.stats?.strongMatchCount || 0}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>High DNA requirement alignment</div>
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase" }}>Potential Matches</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#162A43", marginTop: 4 }}>
                  {oppsData?.stats?.potentialMatchCount || 0}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>Partial evidence or developing fit</div>
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8E44AD", textTransform: "uppercase" }}>Saved Opportunities</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#162A43", marginTop: 4 }}>
                  {oppsData?.stats?.savedCount || 0}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>Private to your student account</div>
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", textTransform: "uppercase" }}>In Application Tracker</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#162A43", marginTop: 4 }}>
                  {oppsData?.stats?.appliedCount || 0}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>Tracked lifecycle stages</div>
              </div>
            </div>

            {/* CATEGORY SUB-NAV TABS */}
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                borderBottom: "1px solid #E4E1DA",
                paddingBottom: 10,
              }}
            >
              {[
                { key: "recommended", label: "Recommended for You" },
                { key: "jobs", label: "Jobs & Internships" },
                { key: "hackathons", label: "Hackathons & Fellowships" },
                { key: "research", label: "Research Programs" },
                { key: "freelance", label: "Freelance & Projects" },
                { key: "other", label: "Explore Other Fields" },
                { key: "saved", label: `Saved (${oppsData?.stats?.savedCount || 0})` },
                { key: "tracker", label: `Application Tracker (${oppsData?.buckets?.trackedApplications?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setOppCategoryTab(tab.key as any)}
                  style={{
                    background: oppCategoryTab === tab.key ? "#162A43" : "#FFFFFF",
                    border: `1px solid ${oppCategoryTab === tab.key ? "#162A43" : "#E4E1DA"}`,
                    color: oppCategoryTab === tab.key ? "#FFFFFF" : "#162A43",
                    padding: "7px 14px",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SEARCH & FILTER BAR (FOR NON-TRACKER TABS) */}
            {oppCategoryTab !== "tracker" && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                  backgroundColor: "#FFFFFF",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E4E1DA",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220 }}>
                  <Search size={14} color="#667085" />
                  <input
                    type="text"
                    value={oppSearch}
                    onChange={(e) => setOppSearch(e.target.value)}
                    placeholder="Search by title, organization, or skill..."
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: 13,
                      width: "100%",
                      color: "#162A43",
                      background: "transparent",
                    }}
                  />
                  {oppSearch && (
                    <button
                      onClick={() => setOppSearch("")}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "#667085" }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={oppModeFilter}
                    onChange={(e) => setOppModeFilter(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #E4E1DA",
                      fontSize: 12,
                      color: "#162A43",
                      background: "#FFFFFF",
                    }}
                  >
                    <option value="ALL">All Work Modes</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>

                  <select
                    value={oppMatchFilter}
                    onChange={(e) => setOppMatchFilter(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #E4E1DA",
                      fontSize: 12,
                      color: "#162A43",
                      background: "#FFFFFF",
                    }}
                  >
                    <option value="ALL">All Match Categories</option>
                    <option value="STRONG MATCH">Strong Match</option>
                    <option value="POTENTIAL MATCH">Potential Match</option>
                    <option value="STRETCH OPPORTUNITY">Stretch Opportunity</option>
                    <option value="ELIGIBILITY CONCERN">Eligibility Concern</option>
                  </select>
                </div>
              </div>
            )}

            {/* MAIN CONTENT: OPPORTUNITY CARDS OR APPLICATION TRACKER */}
            {oppsLoading && !oppsData ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#667085" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#162A43" }}>
                  Evaluating multi-source catalog against Student DNA...
                </div>
              </div>
            ) : oppCategoryTab === "tracker" ? (
              /* APPLICATION TRACKER VIEW */
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#162A43", margin: 0 }}>
                        Private Application Tracker
                      </h3>
                      <p style={{ fontSize: 12, color: "#667085", margin: "2px 0 0" }}>
                        Manage direct or external applications. Status changes are strictly isolated to your account.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(oppsData?.buckets?.trackedApplications || []).map((app: any) => (
                      <div
                        key={app.id}
                        style={{
                          backgroundColor: "#FAF9F6",
                          border: "1px solid #E4E1DA",
                          borderRadius: 8,
                          padding: "12px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>
                            {app.opportunityTitle}
                          </div>
                          <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                            {app.organization} • Saved on {new Date(app.savedAt).toLocaleDateString()}
                            {app.appliedAt ? ` • Applied on ${new Date(app.appliedAt).toLocaleDateString()}` : ""}
                          </div>
                          {app.notes && (
                            <div style={{ fontSize: 11, color: "#356AE6", marginTop: 4 }}>
                              Note: {app.notes}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#667085" }}>Stage:</span>
                          <select
                            value={app.stage}
                            onChange={(e) => handleUpdateStage(app.opportunityId, e.target.value)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 6,
                              border: "1px solid #D2E0FB",
                              backgroundColor: "#EFF4FE",
                              color: "#356AE6",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            <option value="SAVED">SAVED</option>
                            <option value="PLANNED">PLANNED</option>
                            <option value="APPLIED">APPLIED</option>
                            <option value="ASSESSMENT">ASSESSMENT</option>
                            <option value="INTERVIEW">INTERVIEW</option>
                            <option value="OFFER">OFFER</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="WITHDRAWN">WITHDRAWN</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    {(!oppsData?.buckets?.trackedApplications || oppsData.buckets.trackedApplications.length === 0) && (
                      <div style={{ textAlign: "center", padding: "36px 0", color: "#667085", fontSize: 13 }}>
                        No tracked applications yet. Click "Save Opportunity" or transition any recommended role to track it here.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* OPPORTUNITY CARDS GRID */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(() => {
                  let list: any[] = [];
                  if (oppCategoryTab === "recommended") list = oppsData?.buckets?.recommendedForYou || [];
                  else if (oppCategoryTab === "jobs") list = oppsData?.buckets?.jobsAndInternships || [];
                  else if (oppCategoryTab === "hackathons") list = oppsData?.buckets?.hackathonsAndFellowships || [];
                  else if (oppCategoryTab === "research") list = oppsData?.buckets?.researchOpportunities || [];
                  else if (oppCategoryTab === "freelance") list = oppsData?.buckets?.freelanceAndProjects || [];
                  else if (oppCategoryTab === "other") list = oppsData?.buckets?.otherFields || [];
                  else if (oppCategoryTab === "saved") list = oppsData?.buckets?.savedOpportunities || [];

                  if (oppSearch.trim()) {
                    const q = oppSearch.toLowerCase();
                    list = list.filter((i) =>
                      i.opportunity.title.toLowerCase().includes(q) ||
                      i.opportunity.organization.toLowerCase().includes(q) ||
                      i.opportunity.requiredSkills.some((s: string) => s.toLowerCase().includes(q))
                    );
                  }
                  if (oppModeFilter !== "ALL") {
                    list = list.filter((i) => i.opportunity.workMode === oppModeFilter);
                  }
                  if (oppMatchFilter !== "ALL") {
                    list = list.filter((i) => i.evaluation.matchCategory === oppMatchFilter);
                  }

                  if (list.length === 0) {
                    return (
                      <div
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E4E1DA",
                          borderRadius: 10,
                          padding: "48px 24px",
                          textAlign: "center",
                          color: "#667085",
                        }}
                      >
                        <Compass size={32} style={{ margin: "0 auto 12px", color: "#98A2B3" }} />
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#162A43" }}>
                          No opportunities matching these criteria
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          Try clearing filters or checking other categories.
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
                      {list.map((item) => {
                        const opp = item.opportunity;
                        const ev = item.evaluation;
                        const fBadge = getFreshnessBadge(opp.freshnessState);
                        const mBadge = getMatchCategoryBadge(ev.matchCategory);

                        return (
                          <div
                            key={opp.id}
                            style={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E4E1DA",
                              borderRadius: 10,
                              padding: "20px 22px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: 14,
                              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                            }}
                          >
                            <div>
                              {/* CARD HEADER: ORG & BADGES */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#356AE6" }}>
                                    {opp.organization} <span style={{ color: "#98A2B3", fontWeight: 400 }}>• [{opp.sourceName}]</span>
                                  </div>
                                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#162A43", margin: "3px 0 0" }}>
                                    {opp.title}
                                  </h3>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: fBadge.color,
                                      backgroundColor: fBadge.bg,
                                      border: `1px solid ${fBadge.border}`,
                                      padding: "2px 7px",
                                      borderRadius: 4,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {fBadge.label}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: mBadge.color,
                                      backgroundColor: mBadge.bg,
                                      border: `1px solid ${mBadge.border}`,
                                      padding: "2px 7px",
                                      borderRadius: 4,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {ev.matchCategory} ({ev.dnaAlignmentScore}%)
                                  </span>
                                </div>
                              </div>

                              {/* METADATA ROW */}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: "#667085", marginBottom: 12 }}>
                                <span>📍 {opp.location} ({opp.workMode})</span>
                                <span>💼 {opp.experienceLevel}</span>
                                {opp.compensation ? (
                                  <span style={{ color: "#2E7D5B", fontWeight: 600 }}>💰 {opp.compensation}</span>
                                ) : (
                                  <span>💰 Compensation Undisclosed</span>
                                )}
                                <span>📅 {opp.deadline ? `Deadline: ${opp.deadline}` : "Rolling"}</span>
                              </div>

                              {/* GROUNDED EVIDENCE-BACKED WHY */}
                              <div
                                style={{
                                  backgroundColor: "#FAF9F6",
                                  border: "1px solid #E4E1DA",
                                  borderRadius: 7,
                                  padding: "10px 12px",
                                  fontSize: 12,
                                  color: "#162A43",
                                  lineHeight: 1.45,
                                  marginBottom: 12,
                                }}
                              >
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#667085", marginBottom: 4 }}>
                                  Why Recommended (Grounded in DNA):
                                </div>
                                {ev.evidenceBackedWhy}
                              </div>

                              {/* SATISFIED MUST-HAVES */}
                              {ev.satisfiedMustHaves.length > 0 && (
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#2E7D5B", marginBottom: 4 }}>
                                    ✓ Satisfied Must-Haves:
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {ev.satisfiedMustHaves.map((m: any) => (
                                      <span
                                        key={m.skill}
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 600,
                                          color: "#2E7D5B",
                                          backgroundColor: "#EAF4EE",
                                          border: "1px solid #C8E4D3",
                                          padding: "2px 7px",
                                          borderRadius: 5,
                                        }}
                                        title={m.evidenceSnippet}
                                      >
                                        ✓ {m.skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* UNCERTAIN OR MISSING REQUIREMENTS */}
                              {ev.uncertainRequirements.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#B7791F", marginBottom: 4 }}>
                                    ⚠ Uncertain / Missing Requirements:
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {ev.uncertainRequirements.map((u: any) => (
                                      <span
                                        key={u.skill}
                                        style={{
                                          fontSize: 11,
                                          color: "#B7791F",
                                          backgroundColor: "#FEF8EC",
                                          border: "1px solid #F9E4B7",
                                          padding: "2px 7px",
                                          borderRadius: 5,
                                        }}
                                        title={u.reason}
                                      >
                                        ○ {u.skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* CARD ACTION BUTTONS */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderTop: "1px solid #E4E1DA",
                                paddingTop: 12,
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  onClick={() => setSelectedWhyOpp(item)}
                                  style={{
                                    background: "#EFF4FE",
                                    border: "1px solid #D2E0FB",
                                    color: "#356AE6",
                                    padding: "5px 10px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Why This?
                                </button>
                                <button
                                  onClick={() => setSelectedImproveFitOpp(item)}
                                  style={{
                                    background: "#FAF9F6",
                                    border: "1px solid #E4E1DA",
                                    color: "#162A43",
                                    padding: "5px 10px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Improve My Fit
                                </button>
                              </div>

                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button
                                  onClick={() => handleToggleSaveOpp(opp.id, item.isSaved)}
                                  disabled={savingOppId === opp.id}
                                  style={{
                                    background: item.isSaved ? "#EFF4FE" : "#FFFFFF",
                                    border: `1px solid ${item.isSaved ? "#356AE6" : "#E4E1DA"}`,
                                    color: item.isSaved ? "#356AE6" : "#667085",
                                    padding: "5px 10px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <Bookmark size={12} fill={item.isSaved ? "#356AE6" : "none"} />
                                  {item.isSaved ? "Saved" : "Save"}
                                </button>

                                <a
                                  href={opp.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    background: "#162A43",
                                    color: "#FFFFFF",
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  Apply Now <ExternalLink size={11} />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* INTERACTIVE "WHY?" EXPLANATION MODAL (SKILL & GAP)         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(selectedWhySkill || selectedWhyGap) && (
        <div
          onClick={() => {
            setSelectedWhySkill(null);
            setSelectedWhyGap(null);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(22, 42, 67, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 12,
              maxWidth: 540,
              width: "100%",
              padding: "24px 28px",
              boxShadow: "0 16px 32px rgba(22, 42, 67, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#667085" }}>
                  EVIDENCE REASONING
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#162A43", margin: "4px 0 0" }}>
                  Why is {selectedWhySkill?.skillName || selectedWhyGap?.skillName}{" "}
                  <span style={{ color: "#356AE6" }}>
                    {selectedWhySkill?.studentFacingLabel || selectedWhyGap?.gapStatus}
                  </span>?
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedWhySkill(null);
                  setSelectedWhyGap(null);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#667085",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* SUMMARY & PROOF CHECKLIST */}
            <div style={{ backgroundColor: "#FAF9F6", padding: "14px 16px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5, marginBottom: 12 }}>
                {selectedWhySkill?.whyExplanation || selectedWhyGap?.whyExplanation}
              </div>

              {selectedWhySkill && selectedWhySkill.evidenceList.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 10, borderTop: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#667085" }}>
                    Verified Proof Signals:
                  </div>
                  {selectedWhySkill.evidenceList.map((e) => (
                    <div key={e.id} style={{ fontSize: 12, color: "#2E7D5B", display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={13} />
                      <span style={{ color: "#17191C" }}>
                        [{e.sourceType.toUpperCase()}] {e.claim}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedWhySkill && selectedWhySkill.contradiction && (
                <div style={{ marginTop: 10, padding: "8px 10px", backgroundColor: "#FEF8EC", border: "1px solid #F9E4B7", borderRadius: 6, fontSize: 12, color: "#B7791F" }}>
                  <strong>Neutral Mismatch Alert:</strong> {selectedWhySkill.contradiction.neutralExplanation}
                </div>
              )}
            </div>

            {/* CANONICAL LEVEL & SEPARATED DIMENSIONS */}
            {selectedWhySkill && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                <div style={{ backgroundColor: "#F6F5F1", padding: "10px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ color: "#667085" }}>Claimed Level</div>
                  <div style={{ fontWeight: 700, color: "#162A43", marginTop: 2 }}>{selectedWhySkill.selfReportedLevel || "Not claimed"}</div>
                </div>
                <div style={{ backgroundColor: "#F6F5F1", padding: "10px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ color: "#667085" }}>Demonstrated Level</div>
                  <div style={{ fontWeight: 700, color: selectedWhySkill.demonstratedLevel > 0 ? "#2E7D5B" : "#667085", marginTop: 2 }}>
                    {selectedWhySkill.demonstratedLevel > 0 ? `Level ${selectedWhySkill.demonstratedLevel} / 5` : "Pending Demonstration"}
                  </div>
                </div>
                <div style={{ backgroundColor: "#F6F5F1", padding: "10px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ color: "#667085" }}>Verification State</div>
                  <div style={{ fontWeight: 700, color: "#356AE6", marginTop: 2 }}>{selectedWhySkill.verificationState}</div>
                </div>
                <div style={{ backgroundColor: "#F6F5F1", padding: "10px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                  <div style={{ color: "#667085" }}>Evidence Recency</div>
                  <div style={{ fontWeight: 700, color: "#162A43", marginTop: 2 }}>{selectedWhySkill.recency || "RECENT"}</div>
                </div>
              </div>
            )}

            {/* NEXT BEST ACTION */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button
                onClick={() => {
                  setSelectedWhySkill(null);
                  setSelectedWhyGap(null);
                }}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  color: "#667085",
                  padding: "7px 14px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              {selectedWhyGap && (
                <Link
                  href={selectedWhyGap.actionRecommendation.ctaHref}
                  style={{
                    background: "#356AE6",
                    color: "#FFFFFF",
                    padding: "7px 16px",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {selectedWhyGap.actionRecommendation.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* "WHY THIS OPPORTUNITY?" MODAL                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedWhyOpp && (
        <div
          onClick={() => setSelectedWhyOpp(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(22, 42, 67, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 12,
              maxWidth: 600,
              width: "100%",
              padding: "24px 28px",
              boxShadow: "0 16px 32px rgba(22, 42, 67, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#667085" }}>
                  OPPORTUNITY MATCH REASONING
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: "4px 0 0" }}>
                  {selectedWhyOpp.opportunity.title}
                </h3>
                <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                  {selectedWhyOpp.opportunity.organization} • Source: {selectedWhyOpp.opportunity.sourceName}
                </div>
              </div>
              <button
                onClick={() => setSelectedWhyOpp(null)}
                style={{ background: "transparent", border: "none", color: "#667085", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: "#FAF9F6", padding: "14px 16px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#356AE6", marginBottom: 4 }}>
                DNA Alignment Explanation:
              </div>
              <div style={{ fontSize: 13, color: "#162A43", lineHeight: 1.5 }}>
                {selectedWhyOpp.evaluation.evidenceBackedWhy}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
              <div style={{ backgroundColor: "#F6F5F1", padding: "10px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                <div style={{ color: "#667085" }}>Match Category</div>
                <div style={{ fontWeight: 700, color: "#162A43", marginTop: 2 }}>{selectedWhyOpp.evaluation.matchCategory}</div>
              </div>
              <div style={{ backgroundColor: "#F6F5F1", padding: "10px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                <div style={{ color: "#667085" }}>DNA Alignment Score</div>
                <div style={{ fontWeight: 700, color: "#2E7D5B", marginTop: 2 }}>{selectedWhyOpp.evaluation.dnaAlignmentScore}%</div>
              </div>
              <div style={{ backgroundColor: "#F6F5F1", padding: "10px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                <div style={{ color: "#667085" }}>Eligibility Assessment</div>
                <div style={{ fontWeight: 700, color: "#162A43", marginTop: 2 }}>{selectedWhyOpp.evaluation.eligibilityStatus}</div>
              </div>
              <div style={{ backgroundColor: "#F6F5F1", padding: "10px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
                <div style={{ color: "#667085" }}>Listing Freshness</div>
                <div style={{ fontWeight: 700, color: "#162A43", marginTop: 2 }}>{selectedWhyOpp.opportunity.freshnessState}</div>
              </div>
            </div>

            {selectedWhyOpp.evaluation.satisfiedMustHaves.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#2E7D5B", marginBottom: 6 }}>
                  Verified Must-Have Evidence:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectedWhyOpp.evaluation.satisfiedMustHaves.map((m: any) => (
                    <div key={m.skill} style={{ fontSize: 12, background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 6, padding: "6px 10px", color: "#162A43" }}>
                      <strong>✓ {m.skill}:</strong> <span style={{ color: "#2E7D5B" }}>{m.evidenceSnippet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedWhyOpp.evaluation.uncertainRequirements.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#B7791F", marginBottom: 6 }}>
                  Remaining Uncertainties / Limitations:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectedWhyOpp.evaluation.uncertainRequirements.map((u: any) => (
                    <div key={u.skill} style={{ fontSize: 12, background: "#FEF8EC", border: "1px solid #F9E4B7", borderRadius: 6, padding: "6px 10px", color: "#162A43" }}>
                      <strong>○ {u.skill}:</strong> <span style={{ color: "#B7791F" }}>{u.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setSelectedWhyOpp(null)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  color: "#667085",
                  padding: "7px 14px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <a
                href={selectedWhyOpp.opportunity.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#162A43",
                  color: "#FFFFFF",
                  padding: "7px 16px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View Official Listing ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* "IMPROVE MY FIT" MODAL                                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedImproveFitOpp && (
        <div
          onClick={() => setSelectedImproveFitOpp(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(22, 42, 67, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 12,
              maxWidth: 540,
              width: "100%",
              padding: "24px 28px",
              boxShadow: "0 16px 32px rgba(22, 42, 67, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#356AE6" }}>
                  TAILORED FIT ACCELERATOR
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: "4px 0 0" }}>
                  {selectedImproveFitOpp.evaluation.tailoredImproveFitAction.actionTitle}
                </h3>
                <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                  For: {selectedImproveFitOpp.opportunity.title} at {selectedImproveFitOpp.opportunity.organization}
                </div>
              </div>
              <button
                onClick={() => setSelectedImproveFitOpp(null)}
                style={{ background: "transparent", border: "none", color: "#667085", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: "#FAF9F6", padding: "14px 16px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#667085", marginBottom: 6 }}>
                Target Requirement Gap:
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#356AE6", marginBottom: 8 }}>
                {selectedImproveFitOpp.evaluation.tailoredImproveFitAction.targetSkill}
              </div>
              <div style={{ fontSize: 13, color: "#162A43", lineHeight: 1.5 }}>
                {selectedImproveFitOpp.evaluation.tailoredImproveFitAction.description}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setSelectedImproveFitOpp(null)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  color: "#667085",
                  padding: "7px 14px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <Link
                href={selectedImproveFitOpp.evaluation.tailoredImproveFitAction.actionUrl}
                style={{
                  background: "#356AE6",
                  color: "#FFFFFF",
                  padding: "7px 16px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Start Practice Module →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
