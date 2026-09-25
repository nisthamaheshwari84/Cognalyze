"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { RoleDNA } from "@/lib/ai/role-dna";
import {
  CandidateScreeningDossier,
  RequirementAssessmentItem,
  EvidenceMatchState,
  RecruiterCorrection
} from "@/lib/screening/candidate-screening-engine";
import { MultiSourceCandidateProfile } from "@/lib/recruiter-store";
import { BatchProcessingItemError, BatchDeduplicationAlert } from "@/lib/screening/batch-screener";
import PipelineEvidenceView from "@/components/evidence/PipelineEvidenceView";
import { CandidateDecision, Evidence } from "@/lib/evidence/types";

export default function RecruiterCandidatesPage() {
  // Navigation & Mode
  const [activeMode, setActiveMode] = useState<"open_roles" | "analyze">("open_roles");
  const [analyzeTab, setAnalyzeTab] = useState<"single" | "batch">("single");

  // Data State
  const [roles, setRoles] = useState<RoleDNA[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [candidates, setCandidates] = useState<MultiSourceCandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleMetrics, setRoleMetrics] = useState<{
    totalApplicants: number;
    analyzedCount: number;
    needsAttentionCount: number;
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [coverageFilter, setCoverageFilter] = useState<string>("ALL");
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);
  const [blindMode, setBlindMode] = useState(false);

  // Multi-select for Side-by-Side Comparison
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Dossier Drawer / Modal
  const [activeDossierCandidate, setActiveDossierCandidate] = useState<MultiSourceCandidateProfile | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [expandedWhyId, setExpandedWhyId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"pipeline_evidence" | "dossier">("pipeline_evidence");
  const [pipelineDecisions, setPipelineDecisions] = useState<CandidateDecision[]>([]);
  const [pipelineEvidence, setPipelineEvidence] = useState<Evidence[]>([]);

  // Recruiter Correction form state
  const [correctingReqId, setCorrectingReqId] = useState<string | null>(null);
  const [correctedState, setCorrectedState] = useState<EvidenceMatchState>("SUPPORTED");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionSaving, setCorrectionSaving] = useState(false);

  // Mode B: Single Candidate form state
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singlePhone, setSinglePhone] = useState("");
  const [singleResumeText, setSingleResumeText] = useState("");
  const [singleScreening, setSingleScreening] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);

  // Mode B: Batch Upload state
  const [batchRole, setBatchRole] = useState<string>("");
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchRawText, setBatchRawText] = useState("");
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ processed: number; total: number } | null>(null);
  const [batchSummary, setBatchSummary] = useState<{
    totalSubmitted: number;
    successfullyAnalyzed: number;
    failedItems: BatchProcessingItemError[];
    duplicates: BatchDeduplicationAlert[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Roles and Candidate Pool
  useEffect(() => {
    loadRolesAndCandidates();
  }, []);

  async function loadRolesAndCandidates() {
    setLoading(true);
    try {
      // 1. Load roles
      const rolesRes = await fetch("/api/recruiter/roles");
      const rolesData = await rolesRes.json();
      const loadedRoles: RoleDNA[] = rolesData.roles || [];
      setRoles(loadedRoles);

      const defaultRoleId = loadedRoles.length > 0 ? loadedRoles[0].id : "";
      setSelectedRoleId(defaultRoleId);
      setBatchRole(defaultRoleId);

      // 2. Load candidates
      if (defaultRoleId) {
        await loadCandidatesForRole(defaultRoleId);
      } else {
        const candRes = await fetch("/api/recruiter/candidates");
        const candData = await candRes.json();
        setCandidates(candData.candidates || []);
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCandidatesForRole(roleId: string) {
    try {
      const res = await fetch(`/api/recruiter/candidates?roleId=${encodeURIComponent(roleId)}&metrics=true`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates || []);
        setRoleMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error("Failed to load candidates for role", err);
    }
  }

  const handleRoleChange = (newRoleId: string) => {
    setSelectedRoleId(newRoleId);
    setSelectedCandidateIds([]);
    loadCandidatesForRole(newRoleId);
  };

  // Inspect Dossier for a candidate
  const handleInspectDossier = async (cand: MultiSourceCandidateProfile) => {
    setActiveDossierCandidate(cand);
    setExpandedWhyId(null);
    setCorrectingReqId(null);
    setDrawerTab("pipeline_evidence");

    // Fetch pipeline evidence and decisions for this candidate
    try {
      const pRes = await fetch(`/api/pipeline/evidence?candidateId=${encodeURIComponent(cand.id)}`);
      const pData = await pRes.json();
      if (pData.success && Array.isArray(pData.decisions) && pData.decisions.length > 0) {
        setPipelineDecisions(pData.decisions);
        setPipelineEvidence(pData.evidence || []);
      } else if (cand.screeningDossier) {
        // Synthesize stage 1 decision from existing assessments
        const synEvidence: Evidence[] = [];
        const synCriteria = cand.screeningDossier.assessments.map((a) => {
          const evId = `ev_${cand.id}_${a.requirementId}`;
          if (a.sourceText) {
            synEvidence.push({
              id: evId,
              source_type: "resume_text",
              source_ref: a.sourceSection || "resume:line",
              quote_or_fact: a.sourceText,
              extracted_at: cand.screeningDossier?.analyzedAt || new Date().toISOString(),
            });
          }
          return {
            criterion: a.requirementText,
            verdict: (a.evidenceState === "SUPPORTED"
              ? "met"
              : a.evidenceState === "PARTIALLY_SUPPORTED"
              ? "partial"
              : a.evidenceState === "EVIDENCE_NOT_FOUND"
              ? "not_met"
              : "insufficient_evidence") as any,
            evidence_ids: a.sourceText ? [evId] : [],
            reasoning: a.assessmentExplanation,
          };
        });

        const synDecision: CandidateDecision = {
          candidate_id: cand.id,
          stage: "resume_jd_match",
          outcome: cand.screeningDossier.coverageCounts.supportedCount >= 1 ? "advance" : "hold",
          criteria_results: synCriteria,
          overall_confidence: "high",
          created_at: cand.screeningDossier.analyzedAt || new Date().toISOString(),
        };

        setPipelineDecisions([synDecision]);
        setPipelineEvidence(synEvidence);
      } else {
        setPipelineDecisions([]);
        setPipelineEvidence([]);
      }
    } catch {
      setPipelineDecisions([]);
      setPipelineEvidence([]);
    }

    // If dossier isn't loaded or need fresh one, fetch via /api/recruiter/candidates/[id]
    if (!cand.screeningDossier) {
      setDossierLoading(true);
      try {
        const res = await fetch(`/api/recruiter/candidates/${encodeURIComponent(cand.id)}`);
        const data = await res.json();
        if (data.success && data.candidate) {
          setActiveDossierCandidate(data.candidate);
          // Also update in list
          setCandidates(prev => prev.map(c => c.id === data.candidate.id ? data.candidate : c));
        }
      } catch (err) {
        console.error("Failed to load dossier", err);
      } finally {
        setDossierLoading(false);
      }
    }
  };

  // Submit recruiter correction
  const handleSaveCorrection = async () => {
    if (!activeDossierCandidate || !correctingReqId || !correctionReason.trim()) return;

    setCorrectionSaving(true);
    try {
      const currentReq = activeDossierCandidate.screeningDossier?.assessments.find(
        a => a.requirementId === correctingReqId
      );

      const res = await fetch(`/api/recruiter/candidates/${encodeURIComponent(activeDossierCandidate.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recruiter_correction",
          correction: {
            requirementId: correctingReqId,
            originalState: currentReq?.evidenceState || "EVIDENCE_NOT_FOUND",
            correctedState,
            reason: correctionReason.trim()
          }
        })
      });

      const data = await res.json();
      if (data.success && data.candidate) {
        setActiveDossierCandidate(data.candidate);
        setCandidates(prev => prev.map(c => c.id === data.candidate.id ? data.candidate : c));
        setCorrectingReqId(null);
        setCorrectionReason("");
      }
    } catch (err) {
      console.error("Correction failed", err);
    } finally {
      setCorrectionSaving(false);
    }
  };

  // Toggle selection for comparison
  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidateIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      } else {
        if (prev.length >= 4) {
          alert("You can compare up to 4 candidates at a time.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Run Side-by-Side Comparison
  const handleOpenComparison = async () => {
    if (selectedCandidateIds.length < 2) {
      alert("Please select at least 2 candidates to compare.");
      return;
    }

    setComparing(true);
    setComparisonLoading(true);
    try {
      const res = await fetch("/api/recruiter/candidates/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: selectedRoleId,
          candidateIds: selectedCandidateIds
        })
      });

      const data = await res.json();
      if (data.success) {
        setComparisonData(data);
      } else {
        alert(data.error || "Failed to generate comparison matrix.");
        setComparing(false);
      }
    } catch (err) {
      console.error("Comparison request failed", err);
      setComparing(false);
    } finally {
      setComparisonLoading(false);
    }
  };

  // Mode B: Single candidate screening
  const handleSingleScreenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim() || !singleResumeText.trim() || !batchRole) {
      setSingleError("Candidate name, target role, and resume text are required.");
      return;
    }

    setSingleScreening(true);
    setSingleError(null);

    try {
      const res = await fetch("/api/recruiter/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: singleName.trim(),
          email: singleEmail.trim(),
          phone: singlePhone.trim(),
          appliedRoleId: batchRole,
          resumeText: singleResumeText.trim(),
          sourceType: "bulk_upload"
        })
      });

      const data = await res.json();
      if (data.success && data.candidate) {
        // Refresh candidate list and open dossier
        setSelectedRoleId(batchRole);
        await loadCandidatesForRole(batchRole);
        setActiveDossierCandidate(data.candidate);
        setActiveMode("open_roles");
        // Reset single form
        setSingleName("");
        setSingleEmail("");
        setSinglePhone("");
        setSingleResumeText("");
      } else {
        setSingleError(data.error || "Failed to screen candidate.");
      }
    } catch (err: any) {
      setSingleError(err.message || "Network error occurred.");
    } finally {
      setSingleScreening(false);
    }
  };

  // Mode B: Batch Upload Trigger
  const handleBatchScreenSubmit = async () => {
    if (!batchRole) {
      alert("Please select a target role first.");
      return;
    }

    let itemsToProcess: { id?: string; name: string; email?: string; rawText: string }[] = [];

    if (batchRawText.trim()) {
      // Try to parse JSON array or line-delimited items
      try {
        const parsed = JSON.parse(batchRawText);
        if (Array.isArray(parsed)) {
          itemsToProcess = parsed.map((p, idx) => ({
            id: p.id || `batch-${idx + 1}`,
            name: p.name || `Candidate ${idx + 1}`,
            email: p.email,
            rawText: p.rawText || p.resume || JSON.stringify(p)
          }));
        }
      } catch {
        // Delimited by double newline
        const blocks = batchRawText.split(/\n\s*\n---\s*\n|\n\s*\n={3,}\s*\n/);
        itemsToProcess = blocks.map((blk, idx) => {
          const lines = blk.trim().split("\n");
          const name = lines[0].replace(/^Name:\s*/i, "").trim() || `Candidate ${idx + 1}`;
          return {
            id: `batch-${Date.now()}-${idx + 1}`,
            name,
            rawText: blk.trim()
          };
        });
      }
    } else if (batchFiles.length > 0) {
      // Read files as text
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        const text = await file.text();
        const candidateName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        itemsToProcess.push({
          id: `file-${Date.now()}-${i + 1}`,
          name: candidateName,
          rawText: text
        });
      }
    } else {
      alert("Please upload resume files or paste candidate text.");
      return;
    }

    if (itemsToProcess.length === 0) {
      alert("No valid candidate resumes found in the input.");
      return;
    }

    setBatchProcessing(true);
    setBatchProgress({ processed: 0, total: itemsToProcess.length });
    setBatchSummary(null);

    try {
      const res = await fetch("/api/recruiter/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliedRoleId: batchRole,
          batch: itemsToProcess
        })
      });

      const data = await res.json();
      if (data.success && data.batchResult) {
        setBatchSummary({
          totalSubmitted: data.batchResult.totalSubmitted,
          successfullyAnalyzed: data.batchResult.successfullyAnalyzed,
          failedItems: data.batchResult.failedItems || [],
          duplicates: data.batchResult.duplicates || []
        });
        setBatchProgress({
          processed: data.batchResult.totalSubmitted,
          total: data.batchResult.totalSubmitted
        });
        // Reload role candidates
        await loadCandidatesForRole(batchRole);
      } else {
        alert(data.error || "Batch screening encountered an issue.");
      }
    } catch (err: any) {
      alert("Batch screening failed: " + err.message);
    } finally {
      setBatchProcessing(false);
    }
  };

  // Preset demo batch loader (Deterministic, strictly realistic evidence without simulation)
  const handleLoadDemoBatch = (count: number) => {
    const demoCandidates = [
      {
        name: "Devon Chen",
        email: "devon.chen@alum.mit.edu",
        rawText: `Devon Chen
Email: devon.chen@alum.mit.edu | Location: Remote
Experience:
- Senior Distributed Systems Engineer at CloudCore Technologies (2022 - 2026)
  Designed and operated distributed microservices in Go and Rust processing 85,000 requests/second.
  Managed database scaling with PostgreSQL 15, designing connection pooling and partition strategies.
  Architected asynchronous event streaming pipeline using Apache Kafka with strict exactly-once semantics.
  Configured production Kubernetes clusters via Helm and Terraform.
Education:
- B.S. in Computer Science, Massachusetts Institute of Technology (2018 - 2022)`
      },
      {
        name: "Sarah Al-Mansoor",
        email: "sarah.mansoor@techmail.io",
        rawText: `Sarah Al-Mansoor
Software Engineer specializing in High-Throughput Services
Experience:
- Backend Engineer at Nexus Data Corp (2023 - 2026)
  Developed microservices in Go (Golang) and Java.
  Implemented database migrations on MySQL clusters. Note: Used MySQL for all core transaction storage.
  Led adoption of Docker containerization across 14 internal tools.
Projects:
- Telemetry Broker (2024): Open-source event dispatcher written in Go with Docker compose configuration.`
      },
      {
        name: "Marcus Vance",
        email: "marcus.vance@eng-solutions.com",
        rawText: `Marcus Vance
Staff Site Reliability & Platform Engineer
Experience:
- Platform Lead at Apex Networks (2021 - 2026)
  Engineered multi-region Kubernetes clusters on AWS (EKS) across 6 availability zones.
  Maintained PostgreSQL high-availability replication clusters with Patroni and pgBouncer.
  Wrote custom Kubernetes operators in Go for automated failover.
  Quantified improvement: Reduced service downtime by 42% over 3 years.
Education:
- M.S. in Software Engineering, University of Washington (2019 - 2021)`
      },
      {
        name: "Aisha Patel",
        email: "aisha.patel@devhub.net",
        rawText: `Aisha Patel
Frontend & Full Stack Developer
Experience:
- Fullstack Engineer at Vista Web Labs (2023 - 2026)
  Built responsive web applications with TypeScript, Next.js, React, and Tailwind CSS.
  Integrated REST and GraphQL APIs. Explored basic Go endpoints during hackathon.
  Used MongoDB for document storage and Redis for caching.
  No production PostgreSQL or Kubernetes experience.`
      },
      {
        name: "Carlos Mendez",
        email: "carlos.mendez@cloudsystems.org",
        rawText: `Carlos Mendez
Distributed Infrastructure Engineer
Experience:
- Systems Engineer at Stratos Data (2022 - 2025)
  Developed concurrent data pipelines in Go handling 100M events daily.
  Extensive database tuning with PostgreSQL, optimizing queries and index schemas.
  Configured CI/CD deployment pipelines to Kubernetes using GitHub Actions and ArgoCD.
Contradiction note:
  Summary says: "Over 8 years of production Go experience."
  Experience section indicates graduation in 2022 with 3 years total engineering tenure.`
      }
    ];

    const selected = demoCandidates.slice(0, count);
    setBatchRawText(JSON.stringify(selected, null, 2));
  };

  // Filter candidates list
  const filteredCandidates = candidates.filter(cand => {
    // Search query
    const matchesSearch =
      !searchQuery.trim() ||
      cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Coverage Filter
    if (coverageFilter !== "ALL") {
      const cov = cand.screeningDossier?.overallCoverage;
      if (cov !== coverageFilter) return false;
    }

    // Needs attention only
    if (needsAttentionOnly) {
      const counts = cand.screeningDossier?.coverageCounts;
      if (!counts) return false;
      if (counts.needsReviewCount === 0 && counts.conflictingCount === 0) return false;
    }

    return true;
  });

  const selectedRoleObj = roles.find(r => r.id === selectedRoleId);

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F17", color: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <AppNav role="recruiter" />

      {/* Main Container */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px 80px" }}>
        
        {/* Top Header & Context */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 999, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#c7d2fe", letterSpacing: "0.5px" }}>
                CANDIDATE SCREENING ENGINE • FEATURE 2
              </span>
            </div>
            <h1 style={{ fontSize: "2.1rem", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
              Candidate Pool & Screening
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "6px 0 0", maxWidth: 740, lineHeight: 1.5 }}>
              Evidence-grounded applicant screening against confirmed job requirements. Traceable assessments, section-level provenance quotes, zero arbitrary 0–100 scores, zero autonomous hiring verdicts.
            </p>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: "flex", background: "#131b2b", padding: 4, borderRadius: 10, border: "1px solid #1e293b" }}>
            <button
              onClick={() => setActiveMode("open_roles")}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: activeMode === "open_roles" ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent",
                color: activeMode === "open_roles" ? "#fff" : "#94a3b8",
                border: "none",
                transition: "all 0.15s ease"
              }}
            >
              Mode A: Open Roles ({roles.length})
            </button>
            <button
              onClick={() => setActiveMode("analyze")}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: activeMode === "analyze" ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent",
                color: activeMode === "analyze" ? "#fff" : "#94a3b8",
                border: "none",
                transition: "all 0.15s ease"
              }}
            >
              Mode B: Analyze Candidates
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MODE A: OPEN ROLES & APPLICANTS
        ───────────────────────────────────────────────────────────── */}
        {activeMode === "open_roles" && (
          <div>
            {/* Role Selector & Metrics Banner */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: "18px 22px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, borderBottom: "1px solid #1f2937", paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label htmlFor="role-select" style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Active Position:</label>
                  <select
                    id="role-select"
                    value={selectedRoleId}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    style={{
                      background: "#1e293b",
                      color: "#f8fafc",
                      border: "1px solid #334155",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.department || "Engineering"}) • v{r.version || 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Link
                    href={`/recruiter/roles`}
                    style={{
                      fontSize: 12,
                      color: "#a5b4fc",
                      textDecoration: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.25)"
                    }}
                  >
                    View Role Requirements ({selectedRoleObj?.tieredRequirements?.length || 0}) →
                  </Link>
                  <Link
                    href={`/recruiter/decision-room`}
                    style={{
                      fontSize: 12,
                      color: "#34d399",
                      textDecoration: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: "rgba(52,211,153,0.1)",
                      border: "1px solid rgba(52,211,153,0.25)",
                      fontWeight: 600
                    }}
                  >
                    Open Decision Room →
                  </Link>
                </div>
              </div>

              {/* Real Applicant Metrics Strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div style={{ background: "#0f172a", padding: "12px 16px", borderRadius: 8, border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Total Applicants</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", marginTop: 4 }}>
                    {roleMetrics?.totalApplicants ?? candidates.length}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Applied to position</div>
                </div>

                <div style={{ background: "#0f172a", padding: "12px 16px", borderRadius: 8, border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 500 }}>Analyzed Candidates</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>
                    {roleMetrics?.analyzedCount ?? candidates.filter(c => !!c.screeningDossier).length}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    Screened against confirmed v{selectedRoleObj?.version || 1} requirements
                  </div>
                </div>

                <div style={{ background: "#0f172a", padding: "12px 16px", borderRadius: 8, border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: 12, color: "#fb7185", fontWeight: 500 }}>Needs Attention</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#fb7185", marginTop: 4 }}>
                    {roleMetrics?.needsAttentionCount ?? candidates.filter(c => (c.screeningDossier?.coverageCounts?.needsReviewCount || 0) > 0 || (c.screeningDossier?.coverageCounts?.conflictingCount || 0) > 0).length}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    Contradictions or ambiguous claims flagged
                  </div>
                </div>

                <div style={{ background: "#0f172a", padding: "12px 16px", borderRadius: 8, border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: 12, color: "#a855f7", fontWeight: 500 }}>Requirements Benchmark</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#c084fc", marginTop: 4 }}>
                    {selectedRoleObj?.tieredRequirements?.length || 0}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Confirmed role requirements</div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 280, maxWidth: 440 }}>
                <input
                  type="text"
                  placeholder="Search applicants by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#131b2b",
                    color: "#f8fafc",
                    border: "1px solid #1e293b",
                    padding: "9px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {/* Coverage Filter */}
                <select
                  value={coverageFilter}
                  onChange={(e) => setCoverageFilter(e.target.value)}
                  style={{
                    background: "#131b2b",
                    color: "#94a3b8",
                    border: "1px solid #1e293b",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="ALL">All Evidence Coverage Tiers</option>
                  <option value="STRONG EVIDENCE COVERAGE">Strong Evidence Coverage</option>
                  <option value="PARTIAL EVIDENCE COVERAGE">Partial Evidence Coverage</option>
                  <option value="LIMITED EVIDENCE">Limited Evidence</option>
                  <option value="NEEDS HUMAN REVIEW">Needs Human Review</option>
                </select>

                {/* Needs Attention Toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#cbd5e1", cursor: "pointer", background: "#131b2b", padding: "8px 12px", borderRadius: 8, border: "1px solid #1e293b" }}>
                  <input
                    type="checkbox"
                    checked={needsAttentionOnly}
                    onChange={(e) => setNeedsAttentionOnly(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>Needs Attention Only</span>
                </label>

                {/* Blind Technical Screening Toggle (Section 40) */}
                <button
                  type="button"
                  onClick={() => setBlindMode(!blindMode)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: blindMode ? "#38bdf8" : "#cbd5e1",
                    background: blindMode ? "rgba(56,189,248,0.12)" : "#131b2b",
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: `1px solid ${blindMode ? "rgba(56,189,248,0.4)" : "#1e293b"}`,
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>{blindMode ? "👁️ Blind Mode: ON" : "👁️‍🗨️ Blind Mode: OFF"}</span>
                </button>

                {/* Compare Selected Floating/Action Button */}
                {selectedCandidateIds.length >= 2 && (
                  <button
                    onClick={handleOpenComparison}
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <span>⚡ Compare Selected ({selectedCandidateIds.length}) Side-by-Side</span>
                  </button>
                )}
              </div>
            </div>

            {/* Candidate Pool Table */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>
                    <th style={{ padding: "14px 16px", width: 44 }}>
                      <input
                        type="checkbox"
                        checked={selectedCandidateIds.length > 0 && selectedCandidateIds.length === filteredCandidates.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCandidateIds(filteredCandidates.slice(0, 4).map(c => c.id));
                          } else {
                            setSelectedCandidateIds([]);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ padding: "14px 16px" }}>Candidate & Source</th>
                    <th style={{ padding: "14px 16px" }}>Requirements Assessed</th>
                    <th style={{ padding: "14px 16px" }}>Evidence Breakdown</th>
                    <th style={{ padding: "14px 16px" }}>Coverage Status</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Screening Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                        No candidates match the current role or filter settings.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((cand) => {
                      const dossier = cand.screeningDossier;
                      const counts = dossier?.coverageCounts;
                      const isSelected = selectedCandidateIds.includes(cand.id);

                      return (
                        <tr
                          key={cand.id}
                          style={{
                            borderBottom: "1px solid #1e293b",
                            background: isSelected ? "rgba(99,102,241,0.06)" : "transparent",
                            transition: "background 0.15s ease"
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: "14px 16px" }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectCandidate(cand.id)}
                              style={{ cursor: "pointer" }}
                            />
                          </td>

                          {/* Name & Contact */}
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Link
                                href={`/recruiter/candidates/${cand.id}`}
                                style={{
                                  fontWeight: 700,
                                  color: "#60a5fa",
                                  fontSize: 14,
                                  textDecoration: "none"
                                }}
                                className="hover:underline"
                              >
                                {blindMode ? `Candidate #${cand.id.slice(-4).toUpperCase()}` : cand.name}
                              </Link>
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                              {blindMode ? "Contact redacted (Blind Screening)" : cand.email}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: cand.sourceType === "student_application" ? "rgba(16,185,129,0.15)" : "rgba(148,163,184,0.15)",
                                  color: cand.sourceType === "student_application" ? "#6ee7b7" : "#cbd5e1",
                                  border: `1px solid ${cand.sourceType === "student_application" ? "rgba(16,185,129,0.3)" : "rgba(148,163,184,0.3)"}`
                                }}
                              >
                                {cand.sourceType === "student_application" ? "Cognalyze Student App" : "Direct / Batch Upload"}
                              </span>
                            </div>
                          </td>

                          {/* Requirements Assessed */}
                          <td style={{ padding: "14px 16px" }}>
                            {counts ? (
                              <div>
                                <span style={{ fontWeight: 700, color: "#f8fafc" }}>
                                  {counts.totalAssessed} / {counts.totalAssessed}
                                </span>{" "}
                                <span style={{ color: "#94a3b8", fontSize: 12 }}>assessed</span>
                                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                  against v{dossier?.roleVersion || 1}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#f59e0b", fontSize: 12 }}>Awaiting Assessment</span>
                            )}
                          </td>

                          {/* Evidence Breakdown Pills */}
                          <td style={{ padding: "14px 16px" }}>
                            {counts ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                <span
                                  title="Supported: Direct verifiable evidence located"
                                  style={{
                                    fontSize: 11,
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                    background: "rgba(16,185,129,0.12)",
                                    color: "#34d399",
                                    border: "1px solid rgba(16,185,129,0.3)",
                                    fontWeight: 600
                                  }}
                                >
                                  {counts.supportedCount} Supported
                                </span>

                                {counts.partialCount > 0 && (
                                  <span
                                    title="Partially Supported: Some evidence found, full scope not established"
                                    style={{
                                      fontSize: 11,
                                      padding: "2px 8px",
                                      borderRadius: 6,
                                      background: "rgba(245,158,11,0.12)",
                                      color: "#fbbf24",
                                      border: "1px solid rgba(245,158,11,0.3)",
                                      fontWeight: 600
                                    }}
                                  >
                                    {counts.partialCount} Partial
                                  </span>
                                )}

                                {counts.notFoundCount > 0 && (
                                  <span
                                    title="Evidence Not Found in submitted materials (never assumes absence)"
                                    style={{
                                      fontSize: 11,
                                      padding: "2px 8px",
                                      borderRadius: 6,
                                      background: "rgba(100,116,139,0.12)",
                                      color: "#94a3b8",
                                      border: "1px solid rgba(100,116,139,0.3)",
                                      fontWeight: 600
                                    }}
                                  >
                                    {counts.notFoundCount} Not Found
                                  </span>
                                )}

                                {(counts.needsReviewCount > 0 || counts.conflictingCount > 0) && (
                                  <span
                                    title="Needs Human Attention: Contradictions or ambiguity detected"
                                    style={{
                                      fontSize: 11,
                                      padding: "2px 8px",
                                      borderRadius: 6,
                                      background: "rgba(244,63,94,0.15)",
                                      color: "#fb7185",
                                      border: "1px solid rgba(244,63,94,0.35)",
                                      fontWeight: 700
                                    }}
                                  >
                                    {counts.needsReviewCount + counts.conflictingCount} Review
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "#64748b", fontSize: 12 }}>—</span>
                            )}
                          </td>

                          {/* Overall Coverage */}
                          <td style={{ padding: "14px 16px" }}>
                            {dossier ? (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background:
                                    dossier.overallCoverage === "STRONG EVIDENCE COVERAGE"
                                      ? "rgba(16,185,129,0.15)"
                                      : dossier.overallCoverage === "PARTIAL EVIDENCE COVERAGE"
                                      ? "rgba(56,189,248,0.15)"
                                      : dossier.overallCoverage === "LIMITED EVIDENCE"
                                      ? "rgba(148,163,184,0.15)"
                                      : "rgba(244,63,94,0.15)",
                                  color:
                                    dossier.overallCoverage === "STRONG EVIDENCE COVERAGE"
                                      ? "#34d399"
                                      : dossier.overallCoverage === "PARTIAL EVIDENCE COVERAGE"
                                      ? "#38bdf8"
                                      : dossier.overallCoverage === "LIMITED EVIDENCE"
                                      ? "#94a3b8"
                                      : "#fb7185",
                                  border: `1px solid ${
                                    dossier.overallCoverage === "STRONG EVIDENCE COVERAGE"
                                      ? "rgba(16,185,129,0.35)"
                                      : dossier.overallCoverage === "PARTIAL EVIDENCE COVERAGE"
                                      ? "rgba(56,189,248,0.35)"
                                      : dossier.overallCoverage === "LIMITED EVIDENCE"
                                      ? "rgba(148,163,184,0.35)"
                                      : "rgba(244,63,94,0.35)"
                                  }`
                                }}
                              >
                                {dossier.overallCoverage}
                              </span>
                            ) : (
                              <span style={{ color: "#64748b", fontSize: 12 }}>—</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                              <Link
                                href={`/recruiter/candidates/${cand.id}`}
                                style={{
                                  background: "rgba(99,102,241,0.15)",
                                  color: "#a5b4fc",
                                  border: "1px solid rgba(99,102,241,0.35)",
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4
                                }}
                              >
                                Evidence Passport ↗
                              </Link>
                              <button
                                onClick={() => handleInspectDossier(cand)}
                                style={{
                                  background: "#1e293b",
                                  color: "#f8fafc",
                                  border: "1px solid #334155",
                                  padding: "6px 14px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease"
                                }}
                              >
                                Inspect Dossier
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            MODE B: ANALYZE CANDIDATES (SINGLE OR BATCH UPLOAD)
        ───────────────────────────────────────────────────────────── */}
        {activeMode === "analyze" && (
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            {/* Sub-tab Switcher */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid #1f2937", paddingBottom: 12 }}>
              <button
                onClick={() => setAnalyzeTab("single")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: analyzeTab === "single" ? "rgba(99,102,241,0.2)" : "transparent",
                  color: analyzeTab === "single" ? "#a5b4fc" : "#94a3b8",
                  border: analyzeTab === "single" ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent"
                }}
              >
                1. Single Candidate Analysis
              </button>
              <button
                onClick={() => setAnalyzeTab("batch")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: analyzeTab === "batch" ? "rgba(99,102,241,0.2)" : "transparent",
                  color: analyzeTab === "batch" ? "#a5b4fc" : "#94a3b8",
                  border: analyzeTab === "batch" ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent"
                }}
              >
                2. Batch Upload (10 – 1000 Resumes)
              </button>
            </div>

            {/* Target Role Selector for Mode B */}
            <div style={{ background: "#111827", padding: "16px 20px", borderRadius: 10, border: "1px solid #1f2937", marginBottom: 24 }}>
              <label htmlFor="batch-role-select" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
                Target Role for Evidence Assessment:
              </label>
              <select
                id="batch-role-select"
                value={batchRole}
                onChange={(e) => setBatchRole(e.target.value)}
                style={{
                  width: "100%",
                  background: "#1e293b",
                  color: "#f8fafc",
                  border: "1px solid #334155",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  outline: "none"
                }}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.department}) — {r.tieredRequirements?.length || 0} Confirmed Requirements (v{r.version || 1})
                  </option>
                ))}
              </select>
            </div>

            {/* Single Candidate Form */}
            {analyzeTab === "single" && (
              <form onSubmit={handleSingleScreenSubmit} style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
                  Analyze Single Candidate Resume
                </h3>

                {singleError && (
                  <div style={{ padding: "10px 14px", borderRadius: 6, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", color: "#fb7185", fontSize: 13, marginBottom: 16 }}>
                    {singleError}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>
                      Candidate Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Liam Vance"
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        background: "#1e293b",
                        color: "#f8fafc",
                        border: "1px solid #334155",
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: 13,
                        outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>
                      Candidate Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. liam.vance@example.com"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#1e293b",
                        color: "#f8fafc",
                        border: "1px solid #334155",
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: 13,
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>
                    Resume Text / Content *
                  </label>
                  <textarea
                    rows={12}
                    placeholder="Paste candidate's resume text, work experience, projects, and education..."
                    value={singleResumeText}
                    onChange={(e) => setSingleResumeText(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      background: "#0f172a",
                      color: "#f8fafc",
                      border: "1px solid #334155",
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 13,
                      lineHeight: 1.5,
                      fontFamily: "monospace",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button
                    type="submit"
                    disabled={singleScreening}
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                      color: "#fff",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: singleScreening ? "not-allowed" : "pointer",
                      opacity: singleScreening ? 0.7 : 1
                    }}
                  >
                    {singleScreening ? "Evaluating Evidence..." : "Run Evidence Screening →"}
                  </button>
                </div>
              </form>
            )}

            {/* Batch Upload Form */}
            {analyzeTab === "batch" && (
              <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                      High-Volume Candidate Intake
                    </h3>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
                      Upload resumes in bulk or paste candidate payloads. Deterministic assessment, automatic deduplication, and failure isolation.
                    </p>
                  </div>

                  {/* Preset Demo Loaders for Easy Testing */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleLoadDemoBatch(3)}
                      style={{
                        background: "#1e293b",
                        color: "#cbd5e1",
                        border: "1px solid #334155",
                        padding: "5px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: "pointer"
                      }}
                    >
                      Load 3 Demo Resumes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadDemoBatch(5)}
                      style={{
                        background: "#1e293b",
                        color: "#cbd5e1",
                        border: "1px solid #334155",
                        padding: "5px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: "pointer"
                      }}
                    >
                      Load 5 Demo Resumes
                    </button>
                  </div>
                </div>

                {/* File Upload Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed #334155",
                    borderRadius: 10,
                    padding: "32px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(15,23,42,0.6)",
                    marginBottom: 16
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.pdf,.docx,.json"
                    onChange={(e) => {
                      if (e.target.files) {
                        setBatchFiles(Array.from(e.target.files));
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>
                    {batchFiles.length > 0
                      ? `${batchFiles.length} file(s) selected`
                      : "Click to upload candidate resume files (TXT, PDF, DOCX)"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Supports batches from 10 to 1000 candidates with failure-safe isolation
                  </div>
                </div>

                {/* Raw Text / JSON Area */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>
                    Or Paste Batch Candidates (JSON Array or Delimited Text):
                  </label>
                  <textarea
                    rows={8}
                    placeholder={`[\n  {\n    "name": "Devon Chen",\n    "email": "devon@example.com",\n    "rawText": "Experience: Senior Backend..."\n  }\n]`}
                    value={batchRawText}
                    onChange={(e) => setBatchRawText(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#0f172a",
                      color: "#f8fafc",
                      border: "1px solid #334155",
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "monospace",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Real-time Progress Bar */}
                {batchProcessing && batchProgress && (
                  <div style={{ background: "#0f172a", padding: 16, borderRadius: 8, border: "1px solid #1e293b", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "#38bdf8", fontWeight: 600 }}>Analyzing Resumes Deterministically...</span>
                      <span style={{ color: "#f8fafc", fontWeight: 700 }}>
                        {batchProgress.processed} / {batchProgress.total} analyzed
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${(batchProgress.processed / batchProgress.total) * 100}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #6366f1, #38bdf8)",
                          transition: "width 0.2s ease"
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Batch Outcome Summary & Failure Isolation */}
                {batchSummary && (
                  <div style={{ background: "#0f172a", padding: 18, borderRadius: 10, border: "1px solid #1e293b", marginBottom: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px", color: "#34d399" }}>
                      ✓ Batch Screening Complete
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div style={{ background: "#131b2b", padding: "10px 14px", borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Successfully Analyzed</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399" }}>
                          {batchSummary.successfullyAnalyzed}
                        </div>
                      </div>
                      <div style={{ background: "#131b2b", padding: "10px 14px", borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Duplicates Isolated</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>
                          {batchSummary.duplicates.length}
                        </div>
                      </div>
                      <div style={{ background: "#131b2b", padding: "10px 14px", borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Corrupted / Needing Review</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fb7185" }}>
                          {batchSummary.failedItems.length}
                        </div>
                      </div>
                    </div>

                    {batchSummary.duplicates.length > 0 && (
                      <div style={{ fontSize: 12, color: "#fbbf24", marginBottom: 8 }}>
                        ⚠️ {batchSummary.duplicates.length} duplicate submissions were identified and merged without duplicate evaluations.
                      </div>
                    )}

                    {batchSummary.failedItems.length > 0 && (
                      <div style={{ fontSize: 12, color: "#fb7185" }}>
                        ⚠️ {batchSummary.failedItems.length} files could not be evaluated (e.g. unreadable or missing text) and were safely isolated.
                      </div>
                    )}

                    <div style={{ marginTop: 14 }}>
                      <button
                        onClick={() => {
                          setSelectedRoleId(batchRole);
                          setActiveMode("open_roles");
                        }}
                        style={{
                          background: "#1e293b",
                          color: "#f8fafc",
                          border: "1px solid #334155",
                          padding: "8px 16px",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        View Evaluated Candidates in Pool →
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleBatchScreenSubmit}
                    disabled={batchProcessing}
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                      color: "#fff",
                      border: "none",
                      padding: "10px 24px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: batchProcessing ? "not-allowed" : "pointer",
                      opacity: batchProcessing ? 0.7 : 1
                    }}
                  >
                    {batchProcessing ? "Screening Batch..." : "Start Batch Screening →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            CANDIDATE SCREENING DOSSIER SLIDE-OVER / MODAL
        ───────────────────────────────────────────────────────────── */}
        {activeDossierCandidate && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              justifyContent: "flex-end",
              zIndex: 100
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 780,
                height: "100%",
                background: "#0d131f",
                borderLeft: "1px solid #1f2937",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #1f2937",
                  background: "#111827",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: "0.5px" }}>
                      EVIDENCE-GROUNDED CANDIDATE DOSSIER
                    </span>
                    <span style={{ color: "#475569" }}>•</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      Target Role: {activeDossierCandidate.appliedRoleTitle} (v{activeDossierCandidate.screeningDossier?.roleVersion || 1})
                    </span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                    {activeDossierCandidate.name}
                  </h2>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    {activeDossierCandidate.email} {activeDossierCandidate.phone ? `• ${activeDossierCandidate.phone}` : ""}
                  </div>
                </div>

                <button
                  onClick={() => setActiveDossierCandidate(null)}
                  style={{
                    background: "transparent",
                    color: "#94a3b8",
                    border: "none",
                    fontSize: 22,
                    cursor: "pointer",
                    padding: 4
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {/* View Switcher: Pipeline Evidence vs Screening Overview */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "1px solid #1f2937", paddingBottom: 12 }}>
                  <button
                    onClick={() => setDrawerTab("pipeline_evidence")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: drawerTab === "pipeline_evidence" ? "1px solid #6366f1" : "1px solid #334155",
                      background: drawerTab === "pipeline_evidence" ? "rgba(99,102,241,0.2)" : "#0f172a",
                      color: drawerTab === "pipeline_evidence" ? "#a5b4fc" : "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>🛡️ Fact-Level Evidence Pipeline</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "#10b981", color: "#022c22", fontWeight: 800 }}>
                      AUDITABLE
                    </span>
                  </button>
                  <button
                    onClick={() => setDrawerTab("dossier")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: drawerTab === "dossier" ? "1px solid #6366f1" : "1px solid #334155",
                      background: drawerTab === "dossier" ? "rgba(99,102,241,0.2)" : "#0f172a",
                      color: drawerTab === "dossier" ? "#a5b4fc" : "#94a3b8",
                    }}
                  >
                    📋 Traditional Screening Dossier
                  </button>
                </div>

                {dossierLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                    Evaluating candidate evidence against confirmed requirements...
                  </div>
                ) : drawerTab === "pipeline_evidence" ? (
                  <PipelineEvidenceView
                    candidateId={activeDossierCandidate.id}
                    candidateName={activeDossierCandidate.name}
                    decisions={pipelineDecisions}
                    evidenceList={pipelineEvidence}
                  />
                ) : activeDossierCandidate.screeningDossier ? (
                  <div>
                    {/* Coverage Summary Card */}
                    <div style={{ background: "#111827", borderRadius: 10, border: "1px solid #1f2937", padding: 18, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                          ASSESSMENT COVERAGE SUMMARY
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 6,
                            background: "rgba(99,102,241,0.15)",
                            color: "#a5b4fc",
                            border: "1px solid rgba(99,102,241,0.3)"
                          }}
                        >
                          {activeDossierCandidate.screeningDossier.overallCoverage}
                        </span>
                      </div>

                      {/* Pill Counters */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", fontWeight: 600 }}>
                          {activeDossierCandidate.screeningDossier.coverageCounts.supportedCount} Supported
                        </span>
                        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)", fontWeight: 600 }}>
                          {activeDossierCandidate.screeningDossier.coverageCounts.partialCount} Partially Supported
                        </span>
                        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)", fontWeight: 600 }}>
                          {activeDossierCandidate.screeningDossier.coverageCounts.notFoundCount} Evidence Not Found
                        </span>
                        {(activeDossierCandidate.screeningDossier.coverageCounts.needsReviewCount > 0 || activeDossierCandidate.screeningDossier.coverageCounts.conflictingCount > 0) && (
                          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(244,63,94,0.15)", color: "#fb7185", border: "1px solid rgba(244,63,94,0.3)", fontWeight: 700 }}>
                            {activeDossierCandidate.screeningDossier.coverageCounts.needsReviewCount + activeDossierCandidate.screeningDossier.coverageCounts.conflictingCount} Flags Needing Review
                          </span>
                        )}
                      </div>

                      {/* Narrative Summary */}
                      <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
                        {activeDossierCandidate.screeningDossier.narrativeSummary}
                      </p>
                    </div>

                    {/* Contradictions / Red Flags if any */}
                    {activeDossierCandidate.screeningDossier.detectedContradictions && activeDossierCandidate.screeningDossier.detectedContradictions.length > 0 && (
                      <div style={{ background: "rgba(244,63,94,0.08)", borderRadius: 10, border: "1px solid rgba(244,63,94,0.3)", padding: 16, marginBottom: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fb7185", marginBottom: 8 }}>
                          ⚠️ Discrepancies & Contradictions Flagged in Submitted Materials
                        </div>
                        {activeDossierCandidate.screeningDossier.detectedContradictions.map((c, idx) => (
                          <div key={idx} style={{ fontSize: 12, color: "#fda4af", marginBottom: 6, lineHeight: 1.4 }}>
                            • <strong>{c.topic}</strong>: {c.reason}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Requirement-Level Assessments */}
                    <div style={{ marginBottom: 12 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px", color: "#f8fafc" }}>
                        Requirement-Level Evidence Verification
                      </h4>

                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {activeDossierCandidate.screeningDossier.assessments.map((reqItem) => {
                          const isWhyOpen = expandedWhyId === reqItem.requirementId;
                          const isCorrecting = correctingReqId === reqItem.requirementId;

                          return (
                            <div
                              key={reqItem.requirementId}
                              style={{
                                background: "#111827",
                                borderRadius: 10,
                                border: "1px solid #1f2937",
                                padding: 16
                              }}
                            >
                              {/* Header: Requirement text & badges */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                                <div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                                    {reqItem.category}
                                  </span>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", marginTop: 2 }}>
                                    {reqItem.requirementText}
                                  </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                  {/* Match State Badge */}
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 800,
                                      padding: "3px 8px",
                                      borderRadius: 6,
                                      background:
                                        reqItem.evidenceState === "SUPPORTED"
                                          ? "rgba(16,185,129,0.15)"
                                          : reqItem.evidenceState === "PARTIALLY_SUPPORTED"
                                          ? "rgba(245,158,11,0.15)"
                                          : reqItem.evidenceState === "EVIDENCE_NOT_FOUND"
                                          ? "rgba(100,116,139,0.15)"
                                          : "rgba(244,63,94,0.15)",
                                      color:
                                        reqItem.evidenceState === "SUPPORTED"
                                          ? "#34d399"
                                          : reqItem.evidenceState === "PARTIALLY_SUPPORTED"
                                          ? "#fbbf24"
                                          : reqItem.evidenceState === "EVIDENCE_NOT_FOUND"
                                          ? "#94a3b8"
                                          : "#fb7185",
                                      border: `1px solid ${
                                        reqItem.evidenceState === "SUPPORTED"
                                          ? "rgba(16,185,129,0.3)"
                                          : reqItem.evidenceState === "PARTIALLY_SUPPORTED"
                                          ? "rgba(245,158,11,0.3)"
                                          : reqItem.evidenceState === "EVIDENCE_NOT_FOUND"
                                          ? "rgba(100,116,139,0.3)"
                                          : "rgba(244,63,94,0.3)"
                                      }`
                                    }}
                                  >
                                    {reqItem.evidenceState.replace(/_/g, " ")}
                                  </span>

                                  {/* Depth Badge */}
                                  <span style={{ fontSize: 10, color: "#64748b" }}>
                                    Depth: {reqItem.evidenceDepth.replace(/_/g, " ")}
                                  </span>
                                </div>
                              </div>

                              {/* Candidate Evidence Quote */}
                              <div
                                style={{
                                  background: "#0b0f17",
                                  borderLeft: "3px solid #6366f1",
                                  padding: "10px 14px",
                                  borderRadius: "0 6px 6px 0",
                                  fontSize: 12,
                                  color: "#cbd5e1",
                                  marginBottom: 10,
                                  lineHeight: 1.5,
                                  fontStyle: reqItem.candidateEvidence.includes("No ") ? "italic" : "normal"
                                }}
                              >
                                <strong>Evidence Quote:</strong> “{reqItem.candidateEvidence}”
                                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                                  Source Section: {reqItem.sourceSection}
                                </div>
                              </div>

                              {/* Explanation */}
                              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginBottom: 10 }}>
                                {reqItem.assessmentExplanation}
                              </div>

                              {/* Action Row: [Why?] & Recruiter Correction */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #1e293b" }}>
                                <button
                                  onClick={() => setExpandedWhyId(isWhyOpen ? null : reqItem.requirementId)}
                                  style={{
                                    background: isWhyOpen ? "rgba(99,102,241,0.2)" : "#1e293b",
                                    color: isWhyOpen ? "#c7d2fe" : "#94a3b8",
                                    border: "1px solid #334155",
                                    padding: "4px 10px",
                                    borderRadius: 5,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                  }}
                                >
                                  <span>[Why?]</span>
                                  <span>{isWhyOpen ? "Hide Audit Chain" : "Trace Audit Chain"}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    if (isCorrecting) {
                                      setCorrectingReqId(null);
                                    } else {
                                      setCorrectingReqId(reqItem.requirementId);
                                      setCorrectedState(reqItem.evidenceState);
                                      setCorrectionReason("");
                                    }
                                  }}
                                  style={{
                                    background: "transparent",
                                    color: "#a5b4fc",
                                    border: "none",
                                    fontSize: 11,
                                    cursor: "pointer",
                                    textDecoration: "underline"
                                  }}
                                >
                                  {isCorrecting ? "Cancel Override" : "Recruiter Override"}
                                </button>
                              </div>

                              {/* Expandable [Why?] Audit Chain */}
                              {isWhyOpen && (
                                <div
                                  style={{
                                    marginTop: 12,
                                    background: "#080d1a",
                                    borderRadius: 8,
                                    border: "1px solid #2d3748",
                                    padding: 14
                                  }}
                                >
                                  <div style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", marginBottom: 8, letterSpacing: "0.5px" }}>
                                    DETERMINISTIC 4-STEP AUDIT CHAIN
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                                    <div>
                                      <span style={{ color: "#64748b" }}>1. Role Requirement:</span>{" "}
                                      <span style={{ color: "#f8fafc" }}>{reqItem.whyChain.roleRequirement}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: "#64748b" }}>2. Candidate Evidence:</span>{" "}
                                      <span style={{ color: "#e2e8f0" }}>“{reqItem.whyChain.candidateEvidence}”</span>
                                    </div>
                                    <div>
                                      <span style={{ color: "#64748b" }}>3. Assessment Rule:</span>{" "}
                                      <span style={{ color: "#cbd5e1" }}>{reqItem.whyChain.assessment}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: "#64748b" }}>4. Source Provenance:</span>{" "}
                                      <span style={{ color: "#38bdf8" }}>{reqItem.whyChain.sourceSection}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Inline Recruiter Correction Form */}
                              {isCorrecting && (
                                <div
                                  style={{
                                    marginTop: 12,
                                    background: "#131b2b",
                                    borderRadius: 8,
                                    border: "1px solid #3b82f6",
                                    padding: 14
                                  }}
                                >
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#93c5fd", marginBottom: 8 }}>
                                    Recruiter Override & Calibration Audit
                                  </div>
                                  <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                                    <div style={{ flex: 1 }}>
                                      <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                                        Corrected State:
                                      </label>
                                      <select
                                        value={correctedState}
                                        onChange={(e) => setCorrectedState(e.target.value as EvidenceMatchState)}
                                        style={{
                                          width: "100%",
                                          background: "#0f172a",
                                          color: "#f8fafc",
                                          border: "1px solid #334155",
                                          padding: "6px 10px",
                                          borderRadius: 6,
                                          fontSize: 12
                                        }}
                                      >
                                        <option value="SUPPORTED">SUPPORTED</option>
                                        <option value="PARTIALLY_SUPPORTED">PARTIALLY_SUPPORTED</option>
                                        <option value="EVIDENCE_NOT_FOUND">EVIDENCE_NOT_FOUND</option>
                                        <option value="CONFLICTING">CONFLICTING</option>
                                        <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div style={{ marginBottom: 10 }}>
                                    <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                                      Required Audit Rationale:
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Explain verified justification for changing match state..."
                                      value={correctionReason}
                                      onChange={(e) => setCorrectionReason(e.target.value)}
                                      style={{
                                        width: "100%",
                                        background: "#0f172a",
                                        color: "#f8fafc",
                                        border: "1px solid #334155",
                                        padding: "6px 10px",
                                        borderRadius: 6,
                                        fontSize: 12
                                      }}
                                    />
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                    <button
                                      type="button"
                                      onClick={() => setCorrectingReqId(null)}
                                      style={{
                                        background: "transparent",
                                        color: "#94a3b8",
                                        border: "none",
                                        fontSize: 12,
                                        cursor: "pointer"
                                      }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={correctionSaving || !correctionReason.trim()}
                                      onClick={handleSaveCorrection}
                                      style={{
                                        background: "#2563eb",
                                        color: "#fff",
                                        border: "none",
                                        padding: "5px 12px",
                                        borderRadius: 5,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: correctionSaving ? "not-allowed" : "pointer"
                                      }}
                                    >
                                      {correctionSaving ? "Saving..." : "Save Override"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                    No screening dossier found for this candidate.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SIDE-BY-SIDE CANDIDATE COMPARISON MODAL
        ───────────────────────────────────────────────────────────── */}
        {comparing && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(6px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 110,
              padding: 24
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 1200,
                maxHeight: "90vh",
                background: "#0d131f",
                borderRadius: 14,
                border: "1px solid #1f2937",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid #1f2937",
                  background: "#111827",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                    Side-by-Side Candidate Comparison Matrix
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    Role: {comparisonData?.role?.title || selectedRoleObj?.title} (v{comparisonData?.role?.version || 1}) • {comparisonData?.candidates?.length || selectedCandidateIds.length} Candidates Evaluated
                  </div>
                </div>

                <button
                  onClick={() => {
                    setComparing(false);
                    setComparisonData(null);
                  }}
                  style={{
                    background: "transparent",
                    color: "#94a3b8",
                    border: "none",
                    fontSize: 22,
                    cursor: "pointer",
                    padding: 4
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Comparison Matrix Table */}
              <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
                {comparisonLoading ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                    Generating standardized comparison matrix across confirmed role requirements...
                  </div>
                ) : comparisonData ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#111827", borderBottom: "2px solid #1f2937" }}>
                        <th style={{ padding: "14px 16px", width: 280, color: "#94a3b8" }}>
                          Role Requirement
                        </th>
                        {comparisonData.candidates.map((c: any) => (
                          <th key={c.id} style={{ padding: "14px 16px", color: "#f8fafc", minWidth: 240 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 14, fontWeight: 700 }}>
                                {blindMode ? `Candidate #${c.id.slice(-4).toUpperCase()}` : c.name}
                              </div>
                              <Link
                                href={`/recruiter/candidates/${c.id}`}
                                target="_blank"
                                style={{
                                  fontSize: 11,
                                  color: "#a5b4fc",
                                  textDecoration: "none",
                                  background: "rgba(99,102,241,0.15)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  border: "1px solid rgba(99,102,241,0.3)"
                                }}
                              >
                                Passport ↗
                              </Link>
                            </div>
                            <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>
                              {c.overallCoverage}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.matrix.map((row: any) => (
                        <tr key={row.requirementId} style={{ borderBottom: "1px solid #1e293b" }}>
                          <td style={{ padding: "14px 16px", verticalAlign: "top", background: "#0b0f17" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                              {row.category}
                            </span>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", marginTop: 2 }}>
                              {row.requirementText}
                            </div>
                          </td>

                          {row.candidates.map((cell: any) => (
                            <td key={cell.candidateId} style={{ padding: "14px 16px", verticalAlign: "top" }}>
                              <div style={{ marginBottom: 6 }}>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background:
                                      cell.evidenceState === "SUPPORTED"
                                        ? "rgba(16,185,129,0.15)"
                                        : cell.evidenceState === "PARTIALLY_SUPPORTED"
                                        ? "rgba(245,158,11,0.15)"
                                        : cell.evidenceState === "EVIDENCE_NOT_FOUND"
                                        ? "rgba(100,116,139,0.15)"
                                        : "rgba(244,63,94,0.15)",
                                    color:
                                      cell.evidenceState === "SUPPORTED"
                                        ? "#34d399"
                                        : cell.evidenceState === "PARTIALLY_SUPPORTED"
                                        ? "#fbbf24"
                                        : cell.evidenceState === "EVIDENCE_NOT_FOUND"
                                        ? "#94a3b8"
                                        : "#fb7185"
                                  }}
                                >
                                  {cell.evidenceState.replace(/_/g, " ")}
                                </span>
                              </div>

                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#cbd5e1",
                                  lineHeight: 1.4,
                                  background: "#080d1a",
                                  padding: "8px 10px",
                                  borderRadius: 6,
                                  borderLeft: "2px solid #6366f1"
                                }}
                              >
                                “{cell.candidateEvidence}”
                                <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                                  Source: {cell.sourceSection}
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}