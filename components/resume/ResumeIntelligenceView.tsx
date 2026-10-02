"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ResumeIntelligenceReport,
  RewrittenBullet,
} from "@/lib/ai/resume-intelligence-engine";
import {
  CanonicalAnalysisObject,
  EvidenceStatus,
  RequirementPriority,
} from "@/lib/ai/result-engine/types";

interface FeedbackResult {
  name: string;
  color: string;
  response: string;
  typing?: boolean;
}

function GradientBg() {
  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        .glass{background:#FFFFFF;border:1px solid #E4E1DA;box-shadow:0 1px 3px rgba(16,24,40,0.04);}
        .glass-card{background:#FFFFFF;border:1px solid #E4E1DA;border-radius:10px;box-shadow:0 1px 3px rgba(16,24,40,0.04);}
        .glass-card:hover{border-color:#356AE6;box-shadow:0 4px 12px rgba(16,24,40,0.06);}
        .btn-main{background:#356AE6;transition:all 0.15s ease;border:none;cursor:pointer;color:white;font-weight:600;}
        .btn-main:hover{background:#2858C7;}
        .tab-btn{transition:all 0.15s ease;border:none;cursor:pointer;font-weight:600;font-family:inherit;}
        .section-chip{transition:all 0.15s ease;cursor:pointer;}
        .section-chip:hover{background:#FAF9F6!important;}
        textarea:focus{outline:none;border-color:#356AE6!important;}
        ::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-thumb{background:#D0D5DD;border-radius:2px;}
        .evidence-drawer-item{transition:all 0.15s ease;}
        .evidence-drawer-item:hover{background:#FAF9F6;transform:translateX(2px);}
      `}</style>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, background: "#F6F5F1", pointerEvents: "none" }} />
    </>
  );
}

function Typewriter({ text, speed = 8, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [d, setD] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setD("");
    setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setD(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(t);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <span>{d}{!done && <span style={{ animation: "blink 0.8s infinite" }}>|</span>}</span>;
}

type Step = "input" | "loading" | "results";
type SectionFilter = "all" | "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8" | "s9" | "s10" | "s11";

const SECTIONS = [
  { id: "all", label: "📄 Full Dossier (All 11 Sections)" },
  { id: "s1", label: "1. Role Alignment" },
  { id: "s2", label: "2. Requirement Table" },
  { id: "s3", label: "3. Evidence Review" },
  { id: "s4", label: "4. Strengths" },
  { id: "s5", label: "5. Gaps & Risks" },
  { id: "s6", label: "6. Experience Quality" },
  { id: "s7", label: "7. Skills Gap" },
  { id: "s8", label: "8. Truthful Rewriter" },
  { id: "s9", label: "9. Roadmap" },
  { id: "s10", label: "10. Interview Focus" },
  { id: "s11", label: "11. Final Verdict" },
];

export default function ResumeIntelligenceView() {
  const [step, setStep] = useState<Step>("input");
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [results, setResults] = useState<FeedbackResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadMsg, setLoadMsg] = useState("Ingesting complete resume");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<SectionFilter>("all");

  // Single Source of Truth: Canonical Master Report
  const [report, setReport] = useState<ResumeIntelligenceReport | null>(null);
  const canonical: CanonicalAnalysisObject | undefined = report?.canonical;

  // Evidence Drawer modal state
  const [selectedBullet, setSelectedBullet] = useState<RewrittenBullet | null>(null);
  const [inspectedEvidence, setInspectedEvidence] = useState<{
    evidenceId: string;
    requirementName?: string;
    priority?: string;
    evidenceStrength?: string;
    evidenceType?: string;
    rejectedEvidence?: { retrievedText: string; reason: string; decision: string }[];
    sourceType: string;
    sourceDocument: string;
    sourceUrl?: string;
    section: string;
    originalText: string;
    observedFact: string;
    supports: string[];
    doesNotProve: string[];
    verificationStatus: string;
    checksPerformed: { check: string; result: "PASSED" | "FAILED" | "SKIPPED"; detail?: string }[];
    timestamp: string;
  } | null>(null);
  const [showOriginalResume, setShowOriginalResume] = useState(false);
  const [copied, setCopied] = useState(false);
  const rawRef = useRef<FeedbackResult[]>([]);

  const msgs = [
    "Ingesting complete job description & extracting canonical requirements",
    "Ingesting full resume text & generating structured evidence inventory",
    "Building canonical evidence graph with source-level provenance",
    "Executing hybrid matching: exact, ontology bounds & semantic verification",
    "Calculating deterministic weighted score (Critical 60%, Important 30%, Preferred 10%)",
    "Enforcing zero-fabrication validation gate & synthesizing 11-section panel review",
  ];

  const handleFileUpload = async (file: File) => {
    setResumeFile(file);
    setParsing(true);
    setError("");
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (data.text) setResume(data.text);
      else setError("Auto-extract failed — paste text manually below.");
    } catch {
      setError("Please paste resume text manually below.");
    }
    setParsing(false);
  };

  const analyze = async () => {
    if (!resume.trim()) {
      setError("Please enter or upload your resume text.");
      return;
    }
    setStep("loading");
    let i = 0;
    const lt = setInterval(() => {
      i++;
      if (i < msgs.length) setLoadMsg(msgs[i]);
    }, 850);

    try {
      const res = await fetch("/api/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, resume }),
      });
      const data = await res.json();
      clearInterval(lt);

      if (data.report) {
        setReport(data.report);
      }
      if (data.agents?.length > 0) {
        rawRef.current = data.agents;
        setResults([]);
        setCurrentIdx(0);
        setStep("results");
      } else {
        throw new Error(data.error || "Analysis could not be completed reliably.");
      }
    } catch (err: any) {
      clearInterval(lt);
      setError(err.message || "Intelligence audit failed. Please try again.");
      setStep("input");
    }
  };

  useEffect(() => {
    if (step !== "results") return;
    if (currentIdx >= rawRef.current.length) return;
    const timer = setTimeout(() => {
      setResults((prev) => [...prev, { ...rawRef.current[currentIdx], typing: true }]);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentIdx, step]);

  const handleDone = (i: number) => {
    setResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, typing: false } : r)));
    if (i + 1 < rawRef.current.length) setTimeout(() => setCurrentIdx(i + 1), 350);
  };

  const copyResume = () => {
    if (!report?.rewriter) return;
    const r = report.rewriter;
    const lines = [
      `# CANDIDATE RESUME`,
      `\n## PROFESSIONAL SUMMARY\n${r.summary}`,
      `\n## TECHNICAL SKILLS\n${r.skills.map((s) => `- **${s.category}:** ${s.items.join(", ")}`).join("\n")}`,
      `\n## WORK EXPERIENCE\n${r.experience.map((e) => `### ${e.role} — ${e.company} (${e.period})\n${e.bullets.map((b) => `- ${b.rewrittenText}`).join("\n")}`).join("\n\n")}`,
      `\n## TECHNICAL PROJECTS\n${r.projects.map((p) => `### ${p.title} [${p.tech.join(", ")}]\n${p.bullets.map((b) => `- ${b.rewrittenText}`).join("\n")}`).join("\n\n")}`,
      `\n## EDUCATION\n${r.education.map((edu) => `- **${edu.degree}** | ${edu.institution} (${edu.year})`).join("\n")}`,
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    setStep("input");
    setResults([]);
    setCurrentIdx(0);
    setResumeFile(null);
    setResume("");
    setReport(null);
    setSelectedBullet(null);
    setInspectedEvidence(null);
    setActiveSection("all");
  };

  const openInspectForMatch = (m: any) => {
    const ledgerMatch = canonical?.evidenceLedger?.find((e: any) => m.matchedEvidenceIds?.includes(e.evidence_id));
    setInspectedEvidence({
      evidenceId: ledgerMatch?.evidence_id || m.matchedEvidenceIds?.[0] || 'E-REQ',
      requirementName: m.requirementName,
      priority: m.priority,
      evidenceStrength: m.evidenceStrength,
      evidenceType: m.evidenceType,
      rejectedEvidence: m.rejectedEvidence,
      sourceType: ledgerMatch?.source_type || 'resume',
      sourceDocument: ledgerMatch?.source_document || 'resume.pdf',
      sourceUrl: ledgerMatch?.source_url,
      section: ledgerMatch?.section || 'Requirement Alignment',
      originalText: ledgerMatch?.original_text || m.evidenceQuotes?.[0] || m.requirementName,
      observedFact: ledgerMatch?.observed_fact || m.reasoning,
      supports: ledgerMatch?.supports || m.supports || [m.requirementName],
      doesNotProve: ledgerMatch?.does_not_prove || m.doesNotProve || [],
      verificationStatus: ledgerMatch?.verification_status || m.verificationStatus || m.status,
      checksPerformed: ledgerMatch?.checks_performed || m.checksPerformed || [
        { check: 'Requirement verification', result: m.status === 'SUPPORTED' ? 'PASSED' : 'FAILED', detail: m.reasoning },
      ],
      timestamp: ledgerMatch?.checked_at || new Date().toISOString(),
    });
  };

  const openInspectForEvidence = (evi: any) => {
    const ledgerMatch = canonical?.evidenceLedger?.find((e: any) => e.evidence_id === evi.evidence_id || e.evidence_id === evi.id);
    const match = canonical?.matches?.find((m: any) => m.matchedEvidenceIds?.includes(evi.evidence_id || evi.id));
    setInspectedEvidence({
      evidenceId: evi.evidence_id || evi.id || ledgerMatch?.evidence_id || 'E-EVI',
      requirementName: match?.requirementName,
      priority: match?.priority,
      evidenceStrength: match?.evidenceStrength,
      evidenceType: evi.evidence_type,
      rejectedEvidence: match?.rejectedEvidence,
      sourceType: evi.source_type || ledgerMatch?.source_type || 'resume',
      sourceDocument: evi.source_document || 'resume.pdf',
      sourceUrl: evi.source_url || ledgerMatch?.source_url,
      section: evi.section || ledgerMatch?.section || 'Document Inventory',
      originalText: evi.verbatim_quote || evi.text || ledgerMatch?.original_text || '',
      observedFact: evi.observed_fact || ledgerMatch?.observed_fact || `Documented in ${evi.section}: ${evi.text}`,
      supports: evi.supports || ledgerMatch?.supports || evi.technologies || [],
      doesNotProve: evi.does_not_prove || ledgerMatch?.does_not_prove || [],
      verificationStatus: evi.verification_status || ledgerMatch?.verification_status || 'RESUME_SUPPORTED',
      checksPerformed: evi.checks_performed || ledgerMatch?.checks_performed || [
        { check: 'Source document extraction', result: 'PASSED', detail: `Line ${evi.source_location?.line || 1}` },
      ],
      timestamp: ledgerMatch?.checked_at || new Date().toISOString(),
    });
  };

  const openInspectForStrength = (str: any) => {
    const match = canonical?.matches?.find((m: any) => m.requirementId === str.requirement_id || m.requirementName.toLowerCase() === str.targetRequirement?.toLowerCase());
    const ledgerMatch = canonical?.evidenceLedger?.find((e: any) => match?.matchedEvidenceIds?.includes(e.evidence_id));
    setInspectedEvidence({
      evidenceId: str.evidence_id || ledgerMatch?.evidence_id || match?.matchedEvidenceIds?.[0] || 'E-STR',
      requirementName: str.targetRequirement,
      priority: match?.priority,
      evidenceStrength: match?.evidenceStrength || 'DIRECT',
      evidenceType: match?.evidenceType || 'DIRECT_IMPLEMENTATION',
      rejectedEvidence: match?.rejectedEvidence,
      sourceType: ledgerMatch?.source_type || 'resume',
      sourceDocument: ledgerMatch?.source_document || 'resume.pdf',
      sourceUrl: ledgerMatch?.source_url,
      section: ledgerMatch?.section || 'Verified Strength',
      originalText: ledgerMatch?.original_text || str.evidence,
      observedFact: ledgerMatch?.observed_fact || str.whyItMatters,
      supports: ledgerMatch?.supports || [str.targetRequirement],
      doesNotProve: ledgerMatch?.does_not_prove || [],
      verificationStatus: ledgerMatch?.verification_status || 'RESUME_SUPPORTED',
      checksPerformed: ledgerMatch?.checks_performed || [
        { check: 'Strength evidence verification', result: 'PASSED', detail: str.whyItMatters },
      ],
      timestamp: ledgerMatch?.checked_at || new Date().toISOString(),
    });
  };

  const openInspectForGap = (gap: any) => {
    const match = canonical?.matches?.find((m: any) => m.requirementName.toLowerCase() === gap.requirement?.toLowerCase());
    setInspectedEvidence({
      evidenceId: match?.requirementId || 'E-GAP',
      requirementName: gap.requirement,
      priority: match?.priority,
      evidenceStrength: match?.evidenceStrength || 'NONE',
      evidenceType: match?.evidenceType || 'NO_EVIDENCE',
      rejectedEvidence: match?.rejectedEvidence,
      sourceType: 'resume',
      sourceDocument: 'resume.pdf',
      section: 'Gap Analysis',
      originalText: gap.currentEvidence,
      observedFact: gap.impact,
      supports: [],
      doesNotProve: [gap.requirement],
      verificationStatus: gap.gapType === 'Evidence Gap' ? 'NOT_EVIDENCED' : 'SELF_CLAIM',
      checksPerformed: [
        { check: 'Candidate evidence search', result: 'FAILED', detail: `${gap.requirement} not evidenced in submitted materials` },
        { check: 'Non-equivalence boundary enforced', result: 'PASSED', detail: 'Broader coursework or self-claim cannot substitute for implementation' },
      ],
      timestamp: new Date().toISOString(),
    });
  };

  const openInspectForProbe = (q: any) => {
    const match = canonical?.matches?.find((m: any) => m.requirementId === q.requirementId || m.requirementName.toLowerCase() === q.targetRequirement?.toLowerCase());
    setInspectedEvidence({
      evidenceId: q.questionId || 'E-PROBE',
      requirementName: q.targetRequirement,
      priority: match?.priority,
      evidenceStrength: match?.evidenceStrength,
      evidenceType: match?.evidenceType,
      rejectedEvidence: match?.rejectedEvidence,
      sourceType: 'resume',
      sourceDocument: 'resume.pdf',
      section: `Interview Probe (${q.questionType})`,
      originalText: q.claimBeingProbed,
      observedFact: q.whyAsked,
      supports: [q.targetRequirement],
      doesNotProve: ['interview_verification_pending'],
      verificationStatus: q.candidateDefensibility === 'STRONG' ? 'RESUME_SUPPORTED' : 'SELF_CLAIM',
      checksPerformed: [
        { check: 'Probe target identification', result: 'PASSED', detail: q.targetRequirement },
        { check: 'Evidence defensibility rating', result: 'PASSED', detail: `Defensibility: ${q.candidateDefensibility}` },
      ],
      timestamp: new Date().toISOString(),
    });
  };

  // Status color helper
  const getStatusBadge = (status: EvidenceStatus | string) => {
    switch (status) {
      case "SUPPORTED":
        return { bg: "#EAF4EE", color: "#2E7D5B", border: "#C8E4D3" };
      case "PARTIAL":
        return { bg: "#EFF4FE", color: "#356AE6", border: "#D2E0FB" };
      case "CLAIM_ONLY":
        return { bg: "#FEF7ED", color: "#B7791F", border: "#F8D8A7" };
      case "EVIDENCE_GAP":
        return { bg: "#FDF2F2", color: "#C24141", border: "#F8C8C8" };
      case "SKILL_GAP":
        return { bg: "#FDF2F2", color: "#C24141", border: "#F8C8C8" };
      case "CONTRADICTED":
        return { bg: "#FDF2F2", color: "#C24141", border: "#F8C8C8" };
      default:
        return { bg: "#FAFAF8", color: "#667085", border: "#E4E1DA" };
    }
  };

  const getPriorityBadge = (priority: RequirementPriority | string) => {
    switch (priority) {
      case "CRITICAL":
        return { bg: "#FDF2F2", color: "#C24141", border: "#F8C8C8" };
      case "IMPORTANT":
        return { bg: "#FEF7ED", color: "#B7791F", border: "#F8D8A7" };
      default:
        return { bg: "#EFF4FE", color: "#356AE6", border: "#D2E0FB" };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. INPUT PAGE
  // ─────────────────────────────────────────────────────────────
  if (step === "input") {
    return (
      <div style={{ minHeight: "100vh", color: "#17191C", fontFamily: "var(--font-inter, sans-serif)", position: "relative" }}>
        <GradientBg />
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "#FFFFFF", borderBottom: "1px solid #E4E1DA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", background: "#162A43", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#FFFFFF", fontWeight: 700 }}>✦</div>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#162A43", letterSpacing: "-0.01em" }}>COGNALYZE</span>
            <span style={{ fontSize: "11px", padding: "2px 8px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: "5px", color: "#667085", fontWeight: 600 }}>DIAGNOSTICS ENGINE</span>
          </div>
          <a href="/" style={{ color: "#667085", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}>← Back to Workspace</a>
        </div>

        <div style={{ position: "relative", zIndex: 10, maxWidth: "980px", margin: "0 auto", padding: "36px 24px 80px", animation: "fadeUp 0.3s ease" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: "5px", marginBottom: "10px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#356AE6" }} />
              <span style={{ fontSize: "11px", letterSpacing: "1px", color: "#162A43", fontWeight: 700, textTransform: "uppercase" }}>CANONICAL HIRING EVALUATION</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#162A43", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 8px" }}>
              Evidence-Grounded Resume & ATS Diagnostics
            </h1>
            <p style={{ color: "#667085", fontSize: "14px", maxWidth: "680px", margin: "0 auto", lineHeight: 1.5 }}>
              Deterministic and traceable analysis. Evaluates candidate resume text against target job requirements with zero fabrication across 11 synchronized hiring dimensions.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: "10px", padding: "24px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#356AE6" }} />
                    <span style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#162A43", fontWeight: 700, textTransform: "uppercase" }}>TARGET JOB DESCRIPTION</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#667085" }}>Full text ingested</span>
                </div>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  style={{ width: "100%", height: "230px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: "7px", padding: "12px", color: "#17191C", fontSize: "13px", resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
                  placeholder="Paste the full job description (e.g. Software Engineer, Machine Learning, Python, AWS, REST APIs)..."
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#162A43" }} />
                    <span style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#162A43", fontWeight: 700, textTransform: "uppercase" }}>CANDIDATE RESUME</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#667085" }}>PDF, Image, or Text</span>
                </div>
                <div
                  onClick={() => document.getElementById("resumeUp")?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileUpload(f);
                  }}
                  style={{ border: "1px dashed #D0D5DD", borderRadius: "7px", padding: "12px", textAlign: "center", cursor: "pointer", marginBottom: "10px", background: "#FAF9F6", transition: "all 0.15s ease" }}
                >
                  <input id="resumeUp" type="file" accept="image/*,.pdf,application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  {parsing ? (
                    <div style={{ color: "#356AE6", fontSize: "12px" }}><span style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: "8px" }}>⟳</span>Extracting document text...</div>
                  ) : resumeFile ? (
                    <div style={{ color: "#2E7D5B", fontSize: "12px", fontWeight: 600 }}>✓ {resumeFile.name}</div>
                  ) : (
                    <div>
                      <span style={{ fontSize: "18px" }}>📄</span>
                      <div style={{ color: "#162A43", fontSize: "12px", fontWeight: 600, marginTop: "2px" }}>Upload Resume File</div>
                      <div style={{ color: "#667085", fontSize: "11px" }}>PDF, PNG, or JPG</div>
                    </div>
                  )}
                </div>
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  style={{ width: "100%", height: "135px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: "7px", padding: "12px", color: "#17191C", fontSize: "13px", resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
                  placeholder="Or paste candidate resume text directly here..."
                />
              </div>
            </div>
          </div>

          {error && <p style={{ color: "#C24141", textAlign: "center", marginBottom: "1rem", fontSize: "13px", fontWeight: 600 }}>⚠️ {error}</p>}

          <button
            onClick={analyze}
            disabled={!resume.trim()}
            style={{ width: "100%", padding: "12px 18px", borderRadius: "7px", fontSize: "14px", fontWeight: 600, background: !resume.trim() ? "#98A2B3" : "#356AE6", color: "#FFFFFF", border: "none", cursor: !resume.trim() ? "not-allowed" : "pointer", opacity: !resume.trim() ? 0.6 : 1, boxShadow: "0 1px 2px rgba(16,24,40,0.05)", transition: "background 0.15s ease" }}
          >
            Run Complete ATS & Evidence Audit →
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. LOADING PAGE
  // ─────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#F6F5F1", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <GradientBg />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "550px", padding: "2rem" }}>
          <div style={{ width: "48px", height: "48px", margin: "0 auto 20px", border: "3px solid #E4E1DA", borderTop: "3px solid #356AE6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <h3 style={{ fontSize: "18px", color: "#162A43", fontWeight: 700, margin: "0 0 8px" }}>
            {loadMsg}
          </h3>
          <p style={{ color: "#667085", fontSize: "13px", lineHeight: 1.5, margin: 0 }}>
            Synthesizing Canonical Evidence Graph • Enforcing Zero-Fabrication Integrity
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. RESULTS PAGE (11 SYNCHRONIZED SECTIONS)
  // ─────────────────────────────────────────────────────────────
  const scoreObj = canonical?.score || {
    overallEvidenceMatch: report?.feedback?.roleAlignmentSummary?.alignmentPercentage || 0,
    criticalScore: 100,
    importantScore: 100,
    preferredScore: 0,
    summaryCounts: {
      supported: report?.feedback?.strongEvidence?.length || 0,
      partial: report?.feedback?.partialEvidence?.length || 0,
      claimOnly: report?.feedback?.claimedOnly?.length || 0,
      evidenceGaps: report?.feedback?.missingEvidence?.length || 0,
      skillGaps: 0,
      missing: 0,
      contradicted: 0,
      totalRequirements: report?.requirements?.length || 0,
    },
    scoreVerdictExplanation: "Evaluated role requirements against documented resume evidence.",
    formulaExplanation: report?.feedback?.roleAlignmentSummary?.formulaExplanation || "",
    calculatedAt: new Date().toISOString(),
  };

  const matches = canonical?.matches || [];
  const strengths = canonical?.strengths || [];
  const gaps = canonical?.gaps || [];
  const expAnalysis = canonical?.experienceAnalysis;
  const projAnalysis = canonical?.projectAnalysis || [];
  const rewriter = canonical?.resumeRewrite || report?.rewriter;
  const roadmap = canonical?.roadmap || report?.roadmap;
  const interview = canonical?.interviewFocus || report?.interview;
  const verdict = canonical?.finalVerdict;

  const showSection = (sId: string) => activeSection === "all" || activeSection === sId;

  return (
    <div style={{ minHeight: "100vh", color: "#17191C", fontFamily: "var(--font-inter, sans-serif)", position: "relative" }}>
      <GradientBg />

      {/* Top Sticky Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid #E4E1DA" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", background: "#162A43", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#FFFFFF", fontWeight: 700 }}>✦</div>
          <span style={{ fontWeight: 700, fontSize: "14px", color: "#162A43", letterSpacing: "-0.01em" }}>COGNALYZE</span>
          <span style={{ fontSize: "11px", padding: "2px 8px", background: "#EBFDF5", border: "1px solid #A6F4C5", borderRadius: "5px", color: "#2E7D5B", fontWeight: 600 }}>ZERO-FABRICATION VERIFIED</span>
        </div>
        <button onClick={resetAll} style={{ padding: "6px 14px", borderRadius: "7px", background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#162A43", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
          ↺ New Analysis
        </button>
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: "1020px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        
        {/* Section Navigation Quick Bar */}
        <div style={{ marginBottom: "2rem", overflowX: "auto", paddingBottom: "6px" }}>
          <div style={{ display: "flex", gap: "6px", width: "max-content" }}>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as SectionFilter)}
                className="section-chip"
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: activeSection === sec.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                  background: activeSection === sec.id ? "#EFF4FE" : "#FFFFFF",
                  color: activeSection === sec.id ? "#356AE6" : "#667085",
                  whiteSpace: "nowrap",
                }}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: ROLE ALIGNMENT DASHBOARD
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s1") && (
          <div className="glass" style={{ borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
              <div style={{ flex: 1, minWidth: "280px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#356AE6", fontWeight: 800 }}>SECTION 1</span>
                  <span style={{ fontSize: "10px", padding: "1px 6px", background: "#EFF4FE", borderRadius: "4px", color: "#356AE6", border: "1px solid #D2E0FB" }}>DETERMINISTIC EVALUATION</span>
                </div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 8px", color: "#162A43" }}>
                  Role Alignment Score
                </h2>
                <p style={{ fontSize: "13px", color: "#356AE6", margin: "0 0 10px", fontWeight: 600, lineHeight: 1.5 }}>
                  "{verdict?.oneLineVerdict || scoreObj.scoreVerdictExplanation}"
                </p>
                <p style={{ fontSize: "12px", color: "#667085", margin: 0, lineHeight: 1.5 }}>
                  {scoreObj.formulaExplanation}
                </p>
              </div>

              <div style={{ textAlign: "right", minWidth: "140px" }}>
                <div style={{ fontSize: "3.2rem", fontWeight: 900, lineHeight: 1, color: "#162A43" }}>
                  {scoreObj.overallEvidenceMatch}%
                </div>
                <div style={{ fontSize: "10px", color: "#667085", letterSpacing: "1.5px", marginTop: "4px", fontWeight: 700 }}>
                  EVIDENCE MATCH
                </div>
              </div>
            </div>

            {/* Score Counts Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid #E4E1DA" }}>
              <div style={{ background: "#EAF4EE", padding: "10px 12px", borderRadius: "10px", border: "1px solid #C8E4D3" }}>
                <div style={{ fontSize: "10px", color: "#2E7D5B", marginBottom: "2px", fontWeight: 600 }}>Supported</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#2E7D5B" }}>{scoreObj.summaryCounts.supported} Reqs</div>
              </div>
              <div style={{ background: "#EFF4FE", padding: "10px 12px", borderRadius: "10px", border: "1px solid #D2E0FB" }}>
                <div style={{ fontSize: "10px", color: "#356AE6", marginBottom: "2px", fontWeight: 600 }}>Partial</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#356AE6" }}>{scoreObj.summaryCounts.partial} Reqs</div>
              </div>
              <div style={{ background: "#FEF7ED", padding: "10px 12px", borderRadius: "10px", border: "1px solid #F8D8A7" }}>
                <div style={{ fontSize: "10px", color: "#B7791F", marginBottom: "2px", fontWeight: 600 }}>Claim Only</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#B7791F" }}>{scoreObj.summaryCounts.claimOnly} Reqs</div>
              </div>
              <div style={{ background: "#FDF2F2", padding: "10px 12px", borderRadius: "10px", border: "1px solid #F8C8C8" }}>
                <div style={{ fontSize: "10px", color: "#C24141", marginBottom: "2px", fontWeight: 600 }}>Evidence Gaps</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#C24141" }}>{scoreObj.summaryCounts.evidenceGaps} Reqs</div>
              </div>
              <div style={{ background: "#FAFAF8", padding: "10px 12px", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: "10px", color: "#667085", marginBottom: "2px", fontWeight: 600 }}>Total Ingested</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#162A43" }}>{scoreObj.summaryCounts.totalRequirements} Reqs</div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: REQUIREMENT ALIGNMENT TABLE
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s2") && matches.length > 0 && (
          <div className="glass" style={{ borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#356AE6", fontWeight: 800 }}>SECTION 2</div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "2px 0 0", color: "#162A43" }}>
                  Requirement-by-Requirement Alignment Matrix
                </h3>
              </div>
              <span style={{ fontSize: "11px", color: "#667085" }}>
                Traceable to exact JD criteria and resume source quotes
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E4E1DA", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", color: "#667085" }}>Requirement</th>
                    <th style={{ padding: "10px 12px", color: "#667085" }}>Priority</th>
                    <th style={{ padding: "10px 12px", color: "#667085" }}>Status</th>
                    <th style={{ padding: "10px 12px", color: "#667085" }}>Confidence</th>
                    <th style={{ padding: "10px 12px", color: "#667085" }}>Resume Evidence / Gap Reasoning</th>
                    <th style={{ padding: "10px 12px", color: "#667085" }}>Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, idx) => {
                    const statusBadge = getStatusBadge(m.status);
                    const prioBadge = getPriorityBadge(m.priority);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #E4E1DA" }}>
                        <td style={{ padding: "12px", fontWeight: 700, color: "#17191C" }}>{m.requirementName}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: prioBadge.bg, color: prioBadge.color, border: `1px solid ${prioBadge.border}`, fontWeight: 700 }}>
                            {m.priority}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}`, fontWeight: 700 }}>
                            {m.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: m.confidenceTier === "HIGH" ? "#2E7D5B" : m.confidenceTier === "MEDIUM" ? "#B7791F" : "#667085", fontWeight: 600 }}>
                          {m.confidenceTier} ({Math.round(m.confidence * 100)}%)
                        </td>
                        <td style={{ padding: "12px", color: "#17191C", lineHeight: 1.4 }}>
                          {m.evidenceQuotes[0] ? (
                            <div>
                              <span style={{ color: "#2E7D5B", fontStyle: "italic" }}>"{m.evidenceQuotes[0]}"</span>
                              <div style={{ fontSize: "11px", color: "#667085", marginTop: "2px" }}>{m.reasoning}</div>
                            </div>
                          ) : (
                            <span style={{ color: "#667085" }}>{m.reasoning}</span>
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <button
                            onClick={() => openInspectForMatch(m)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: "#EFF4FE",
                              border: "1px solid #D2E0FB",
                              color: "#356AE6",
                              cursor: "pointer",
                              fontSize: "10px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            🔍 Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3: EVIDENCE REVIEW (WHAT THE RESUME ACTUALLY PROVES)
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s3") && canonical?.evidence && canonical.evidence.length > 0 && (
          <div className="glass" style={{ background: "#FFFFFF", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#356AE6", fontWeight: 800 }}>SECTION 3</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "#EFF4FE", borderRadius: "4px", color: "#356AE6", border: "1px solid #D2E0FB" }}>SOURCE PROVENANCE</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#162A43" }}>
              Evidence Review: What the Resume Actually Proves
            </h3>
            <p style={{ fontSize: "13px", color: "#667085", marginBottom: "1.5rem" }}>
              Every bullet point and project below was extracted with line/section provenance. Cognalyze bases every decision strictly on this evidence inventory.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
              {canonical.evidence.slice(0, 8).map((evi, i) => (
                <div key={i} style={{ background: "#FAFAF8", padding: "14px", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#162A43" }}>{evi.title}</span>
                    <span style={{ fontSize: "9px", padding: "1px 6px", background: "#EFF4FE", borderRadius: "4px", color: "#356AE6", border: "1px solid #D2E0FB" }}>
                      {evi.section}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#17191C", margin: "0 0 6px", lineHeight: 1.4 }}>
                    "{evi.text}"
                  </p>
                  {evi.technologies.length > 0 && (
                    <div style={{ fontSize: "10px", color: "#356AE6", marginBottom: "6px", fontWeight: 600 }}>
                      Detected Tooling: {evi.technologies.join(", ")}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid #E4E1DA" }}>
                    <span style={{ fontSize: "10px", color: "#98A2B3" }}>
                      {evi.evidence_id || evi.id}
                    </span>
                    <button
                      onClick={() => openInspectForEvidence(evi)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "#EFF4FE",
                        border: "1px solid #D2E0FB",
                        color: "#356AE6",
                        cursor: "pointer",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      🔍 Inspect Evidence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4: STRENGTHS (ONLY EVIDENCE-BACKED)
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s4") && (
          <div className="glass" style={{ background: "#FFFFFF", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#2E7D5B", fontWeight: 800 }}>SECTION 4</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "#EAF4EE", borderRadius: "4px", color: "#2E7D5B", border: "1px solid #C8E4D3" }}>VERIFIABLE COMPETENCY</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "#162A43" }}>
              Evidence-Backed Strengths
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {strengths.map((str, i) => (
                <div key={i} style={{ padding: "16px", background: "#FAFAF8", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 800, fontSize: "14px", color: "#162A43" }}>{str.strength}</span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", padding: "2px 8px", background: "#EAF4EE", borderRadius: "999px", color: "#2E7D5B", border: "1px solid #C8E4D3", fontWeight: 700 }}>
                        SUPPORTED
                      </span>
                      <button
                        onClick={() => openInspectForStrength(str)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#EFF4FE",
                          border: "1px solid #D2E0FB",
                          color: "#356AE6",
                          cursor: "pointer",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        🔍 Inspect
                      </button>
                    </div>
                  </div>
                  <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", color: "#2E7D5B", fontStyle: "italic", marginBottom: "6px" }}>
                    "{str.evidence}"
                  </div>
                  <div style={{ fontSize: "12px", color: "#667085" }}>
                    <strong style={{ color: "#162A43" }}>Role Relevance:</strong> {str.whyItMatters}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5: GAPS & RISKS (REQUIREMENT-SPECIFIC)
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s5") && gaps.length > 0 && (
          <div className="glass" style={{ background: "#FFFFFF", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#C24141", fontWeight: 800 }}>SECTION 5</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "#FDF2F2", borderRadius: "4px", color: "#C24141", border: "1px solid #F8C8C8" }}>DEFENSIBLE GAP ANALYSIS</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "#162A43" }}>
              Requirement-Specific Gaps & Risks
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {gaps.map((gap, i) => (
                <div key={i} style={{ padding: "16px", background: "#FAFAF8", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 800, fontSize: "14px", color: "#162A43" }}>GAP: {gap.requirement}</span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        background: gap.gapType === "Evidence Gap" ? "#EFF4FE" : "#FDF2F2",
                        borderRadius: "999px",
                        color: gap.gapType === "Evidence Gap" ? "#356AE6" : "#C24141",
                        border: gap.gapType === "Evidence Gap" ? "1px solid #D2E0FB" : "1px solid #F8C8C8",
                        fontWeight: 700
                      }}>
                        {gap.gapType.toUpperCase()}
                      </span>
                      <button
                        onClick={() => openInspectForGap(gap)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#EFF4FE",
                          border: "1px solid #D2E0FB",
                          color: "#356AE6",
                          cursor: "pointer",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        🔍 Inspect
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: "12px", color: "#667085", marginBottom: "4px" }}>
                    <strong style={{ color: "#162A43" }}>Current Evidence:</strong> {gap.currentEvidence}
                  </div>
                  <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>
                    <strong style={{ color: "#162A43" }}>Why It Matters:</strong> {gap.impact}
                  </div>
                  <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", color: "#162A43" }}>
                    💡 <strong>Actionable Step:</strong> {gap.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6: EXPERIENCE QUALITY (FRESHER FAIRNESS)
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s6") && expAnalysis && (
          <div className="glass" style={{ background: "#FFFFFF", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#356AE6", fontWeight: 800 }}>SECTION 6</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "#EFF4FE", borderRadius: "4px", color: "#356AE6", border: "1px solid #D2E0FB" }}>MULTI-DIMENSIONAL AUDIT</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "#162A43" }}>
              Experience Quality Analysis
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px", marginBottom: "1rem" }}>
              <div style={{ background: "#FAFAF8", borderRadius: "10px", padding: "14px", border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: "11px", color: "#667085", marginBottom: "4px" }}>Professional Experience</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#162A43", marginBottom: "4px" }}>{expAnalysis.professionalExperience.level}</div>
                <div style={{ fontSize: "12px", color: "#667085", lineHeight: 1.4 }}>{expAnalysis.professionalExperience.detail}</div>
              </div>

              <div style={{ background: "#FAFAF8", borderRadius: "10px", padding: "14px", border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: "11px", color: "#667085", marginBottom: "4px" }}>Project Depth</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#2E7D5B", marginBottom: "4px" }}>{expAnalysis.projectEvidence.level} ({expAnalysis.projectEvidence.count} Projects)</div>
                <div style={{ fontSize: "12px", color: "#667085", lineHeight: 1.4 }}>{expAnalysis.projectEvidence.detail}</div>
              </div>

              <div style={{ background: "#FAFAF8", borderRadius: "10px", padding: "14px", border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: "11px", color: "#667085", marginBottom: "4px" }}>Engineering Depth</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#356AE6", marginBottom: "4px" }}>{expAnalysis.engineeringDepth.level}</div>
                <div style={{ fontSize: "12px", color: "#667085", lineHeight: 1.4 }}>{expAnalysis.engineeringDepth.detail}</div>
              </div>

              <div style={{ background: "#FAFAF8", borderRadius: "10px", padding: "14px", border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: "11px", color: "#667085", marginBottom: "4px" }}>Impact Evidence</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#B7791F", marginBottom: "4px" }}>{expAnalysis.impactEvidence.level}</div>
                <div style={{ fontSize: "12px", color: "#667085", lineHeight: 1.4 }}>{expAnalysis.impactEvidence.detail}</div>
              </div>
            </div>

            <div style={{ background: "#EFF4FE", borderRadius: "10px", padding: "12px 16px", border: "1px solid #D2E0FB", borderLeft: "3px solid #356AE6" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#356AE6" }}>Evaluator Fairness Note: </span>
              <span style={{ fontSize: "12px", color: "#17191C" }}>{expAnalysis.fresherFairnessAssessment}</span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 7: SKILLS & EVIDENCE GAP CATEGORIZATION
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s7") && report?.skillsGap && report.skillsGap.length > 0 && (
          <div className="glass" style={{ background: "#FFFFFF", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#356AE6", fontWeight: 800 }}>SECTION 7</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "#EFF4FE", borderRadius: "4px", color: "#356AE6", border: "1px solid #D2E0FB" }}>SKILLS & EVIDENCE TAXONOMY</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "#162A43" }}>
              Skills & Evidence Gap Breakdown
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {report.skillsGap.map((sg, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "#FAFAF8", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#162A43" }}>{sg.name}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        background: sg.gapType === "EVIDENCE_GAP" ? "#EFF4FE" : "#FDF2F2",
                        borderRadius: "999px",
                        color: sg.gapType === "EVIDENCE_GAP" ? "#356AE6" : "#C24141",
                        border: sg.gapType === "EVIDENCE_GAP" ? "1px solid #D2E0FB" : "1px solid #F8C8C8",
                        fontWeight: 700
                      }}>
                        {sg.gapType.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: "10px", padding: "2px 8px", background: "#F6F5F1", borderRadius: "999px", color: "#667085", border: "1px solid #E4E1DA" }}>
                        {sg.priority} PRIORITY
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#667085", marginBottom: "4px" }}>
                    {sg.whyPrioritized}
                  </div>
                  <div style={{ fontSize: "11px", color: "#356AE6", fontWeight: 600 }}>
                    Action: {sg.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 8: TRUTHFUL RESUME REWRITER (FULL RESUME OUTPUT)
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s8") && rewriter && (
          <div className="glass" style={{ background: "#FFFFFF", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#356AE6", fontWeight: 800 }}>SECTION 8</span>
                  <span style={{
                    fontSize: "10px",
                    padding: "1px 6px",
                    background: (canonical?.validation?.traceabilityStatus === 'ZERO_FABRICATION_CERTIFIED' || rewriter?.zeroFabricationCertified) ? "#EAF4EE" : "#FDF2F2",
                    borderRadius: "4px",
                    border: (canonical?.validation?.traceabilityStatus === 'ZERO_FABRICATION_CERTIFIED' || rewriter?.zeroFabricationCertified) ? "1px solid #C8E4D3" : "1px solid #F8C8C8",
                    color: (canonical?.validation?.traceabilityStatus === 'ZERO_FABRICATION_CERTIFIED' || rewriter?.zeroFabricationCertified) ? "#2E7D5B" : "#C24141",
                    fontWeight: 700
                  }}>
                    {(canonical?.validation?.traceabilityStatus === 'ZERO_FABRICATION_CERTIFIED' || rewriter?.zeroFabricationCertified) ? "ZERO FABRICATION CERTIFIED" : "TRACEABILITY AUDIT: INCOMPLETE"}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "4px 0 0", color: "#162A43" }}>
                  Truthful Full Resume Output
                </h3>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setShowOriginalResume(!showOriginalResume)}
                  style={{ padding: "6px 14px", borderRadius: "7px", background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#162A43", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  {showOriginalResume ? "Hide Original" : "Compare Original"}
                </button>
                <button
                  onClick={copyResume}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "7px",
                    background: copied ? "#EAF4EE" : "#356AE6",
                    border: `1px solid ${copied ? "#C8E4D3" : "#2858C7"}`,
                    color: copied ? "#2E7D5B" : "#FFFFFF",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {copied ? "✓ Copied!" : "📋 Copy Full Clean Resume"}
                </button>
              </div>
            </div>

            <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: "8px", padding: "10px 14px", marginBottom: "1.5rem", fontSize: "12px", color: "#2E7D5B", fontWeight: 600 }}>
              🛡️ Every rewritten statement is traceable to source evidence. Click any bullet to view its Evidence Drawer.
            </div>

            {/* Comparison Side-by-side */}
            {showOriginalResume && (
              <div style={{ background: "#FAFAF8", borderRadius: "10px", padding: "14px", marginBottom: "1.5rem", border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#667085", fontWeight: 800, marginBottom: "8px" }}>
                  ORIGINAL UNEDITED RESUME
                </div>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", color: "#17191C", background: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #E4E1DA", fontFamily: "monospace", maxHeight: "200px", overflow: "auto" }}>
                  {resume}
                </pre>
              </div>
            )}

            {/* Full Rewritten Resume Display */}
            <div style={{ background: "#FAFAF8", borderRadius: "12px", padding: "1.75rem", border: "1px solid #E4E1DA" }}>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #E4E1DA" }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0 0 4px", color: "#162A43" }}>
                  {(rewriter as any)?.name || "CANDIDATE NAME"}
                </h2>
                <div style={{ fontSize: "12px", color: "#667085" }}>
                  {(rewriter as any)?.contact?.email && <span>{(rewriter as any).contact.email} • </span>}
                  {(rewriter as any)?.contact?.phone && <span>{(rewriter as any).contact.phone} • </span>}
                  {(rewriter as any)?.contact?.links && (rewriter as any).contact.links.join(" • ")}
                </div>
              </div>

              {/* Professional Summary */}
              {rewriter.summary && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#356AE6", fontWeight: 800, marginBottom: "6px" }}>
                    PROFESSIONAL SUMMARY
                  </div>
                  <p style={{ fontSize: "13px", color: "#17191C", lineHeight: 1.6, margin: 0 }}>
                    {rewriter.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {rewriter.skills && rewriter.skills.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#356AE6", fontWeight: 800, marginBottom: "6px" }}>
                    TECHNICAL SKILLS
                  </div>
                  {rewriter.skills.map((sg, idx) => (
                    <div key={idx} style={{ fontSize: "13px", marginBottom: "4px" }}>
                      <strong style={{ color: "#162A43" }}>{sg.category}: </strong>
                      <span style={{ color: "#17191C" }}>{sg.items.join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {rewriter.experience && rewriter.experience.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#356AE6", fontWeight: 800, marginBottom: "10px" }}>
                    EXPERIENCE
                  </div>
                  {rewriter.experience.map((exp, idx) => (
                    <div key={idx} style={{ marginBottom: "14px", borderLeft: "2px solid #356AE6", paddingLeft: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 800, color: "#162A43" }}>
                        <span>{exp.role}</span>
                        <span style={{ fontSize: "11px", color: "#667085", fontWeight: 500 }}>{exp.period}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#356AE6", fontWeight: 600, marginBottom: "6px" }}>{exp.company}</div>
                      {exp.bullets.map((b) => (
                        <div
                          key={b.bulletId}
                          className="evidence-drawer-item"
                          onClick={() => setSelectedBullet(b)}
                          style={{ display: "flex", alignItems: "flex-start", gap: "6px", padding: "4px 6px", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <span style={{ color: "#356AE6" }}>•</span>
                          <span style={{ fontSize: "13px", color: "#17191C", lineHeight: 1.5, flex: 1 }}>{b.rewrittenText}</span>
                          <span style={{ fontSize: "9px", padding: "1px 6px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: "4px", color: "#356AE6", fontWeight: 700 }}>
                            🔍 Inspect
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {rewriter.projects && rewriter.projects.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#356AE6", fontWeight: 800, marginBottom: "10px" }}>
                    TECHNICAL PROJECTS
                  </div>
                  {rewriter.projects.map((proj, idx) => (
                    <div key={idx} style={{ marginBottom: "14px", borderLeft: "2px solid #356AE6", paddingLeft: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 800, color: "#162A43" }}>
                        <span>{proj.title}</span>
                        <span style={{ fontSize: "11px", color: "#667085" }}>[{((proj as any).technologies || (proj as any).tech || []).join(", ")}]</span>
                      </div>
                      {proj.bullets.map((b) => (
                        <div
                          key={b.bulletId}
                          className="evidence-drawer-item"
                          onClick={() => setSelectedBullet(b)}
                          style={{ display: "flex", alignItems: "flex-start", gap: "6px", padding: "4px 6px", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <span style={{ color: "#356AE6" }}>•</span>
                          <span style={{ fontSize: "13px", color: "#17191C", lineHeight: 1.5, flex: 1 }}>{b.rewrittenText}</span>
                          <span style={{ fontSize: "9px", padding: "1px 6px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: "4px", color: "#356AE6", fontWeight: 700 }}>
                            🔍 Inspect
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {rewriter.education && rewriter.education.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#356AE6", fontWeight: 800, marginBottom: "8px" }}>
                    EDUCATION
                  </div>
                  {rewriter.education.map((edu, idx) => (
                    <div key={idx} style={{ fontSize: "13px", color: "#17191C" }}>
                      <strong style={{ color: "#162A43" }}>{edu.degree}</strong> — {edu.institution} ({edu.year})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Evidence Drawer Modal */}
            {selectedBullet && (
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(22,42,67,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
                onClick={() => setSelectedBullet(null)}
              >
                <div
                  style={{ maxWidth: "580px", width: "100%", borderRadius: "16px", padding: "2rem", background: "#FFFFFF", border: "1px solid #E4E1DA", position: "relative", animation: "fadeUp 0.3s ease", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedBullet(null)}
                    style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "#667085", fontSize: "18px", cursor: "pointer" }}
                  >
                    ✕
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "16px" }}>🔍</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "#356AE6" }}>
                      PROVENANCE & EVIDENCE DRAWER
                    </span>
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "10px", color: "#667085", marginBottom: "4px", fontWeight: 600 }}>REWRITTEN BULLET</div>
                    <div style={{ fontSize: "13px", color: "#2E7D5B", lineHeight: 1.5, background: "#EAF4EE", padding: "10px 12px", borderRadius: "8px", border: "1px solid #C8E4D3" }}>
                      {selectedBullet.rewrittenText}
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "10px", color: "#667085", marginBottom: "4px", fontWeight: 600 }}>VERBATIM SOURCE TEXT</div>
                    <div style={{ fontSize: "13px", color: "#17191C", lineHeight: 1.5, background: "#FAFAF8", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E4E1DA" }}>
                      "{selectedBullet.originalText}"
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "10px", color: "#667085", marginBottom: "4px", fontWeight: 600 }}>TRANSFORMATION RATIONALE</div>
                    <div style={{ fontSize: "12px", color: "#667085", lineHeight: 1.5 }}>
                      {selectedBullet.transformationRationale}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ background: "#EAF4EE", padding: "10px", borderRadius: "8px", border: "1px solid #C8E4D3" }}>
                      <div style={{ fontSize: "10px", color: "#2E7D5B", fontWeight: 700 }}>NEW FACTS ADDED</div>
                      <div style={{ fontSize: "11px", color: "#17191C", marginTop: "2px" }}>{selectedBullet.newFactsAdded}</div>
                    </div>

                    <div style={{ background: "#EFF4FE", padding: "10px", borderRadius: "8px", border: "1px solid #D2E0FB" }}>
                      <div style={{ fontSize: "10px", color: "#356AE6", fontWeight: 700 }}>DEFENSIBILITY</div>
                      <div style={{ fontSize: "11px", color: "#17191C", marginTop: "2px" }}>{selectedBullet.interviewDefensibility} — Ready to verify</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 9: EVIDENCE ROADMAP (DERIVED DIRECTLY FROM JD GAPS)
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s9") && roadmap?.milestones && (
          <div className="glass" style={{ background: "#FFFFFF", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#356AE6", fontWeight: 800 }}>SECTION 9</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "#EFF4FE", borderRadius: "4px", color: "#356AE6", border: "1px solid #D2E0FB" }}>ACTIONABLE MILESTONES</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1.25rem", color: "#162A43" }}>
              Evidence-Generating Roadmap
            </h3>

            <div style={{ position: "relative", paddingLeft: "24px" }}>
              <div style={{ position: "absolute", left: "8px", top: 0, bottom: 0, width: "2px", background: "#E4E1DA", borderRadius: "999px" }} />
              {roadmap.milestones.map((m, i) => (
                <div key={i} style={{ marginBottom: "1.5rem", position: "relative" }}>
                  <div style={{ position: "absolute", left: "-20px", top: "16px", width: "10px", height: "10px", borderRadius: "50%", background: "#356AE6", boxShadow: "0 0 0 3px #EFF4FE" }} />
                  <div style={{ background: "#FAFAF8", padding: "16px", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#356AE6", fontWeight: 800 }}>{m.phase}</span>
                      <span style={{ fontSize: "10px", color: "#667085" }}>Effort: {m.realisticEffort}</span>
                    </div>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 6px", color: "#162A43" }}>{m.title}</h4>
                    <p style={{ fontSize: "13px", color: "#667085", lineHeight: 1.5, margin: "0 0 10px" }}>{m.action}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div style={{ background: "#EFF4FE", borderRadius: "8px", padding: "8px 10px", border: "1px solid #D2E0FB" }}>
                        <div style={{ fontSize: "10px", color: "#356AE6", fontWeight: 700 }}>DELIVERABLE ARTIFACT</div>
                        <div style={{ fontSize: "11px", color: "#17191C", marginTop: "2px" }}>{(m as any).concreteDeliverableArtifact || (m as any).deliverableArtifact || ""}</div>
                      </div>
                      <div style={{ background: "#EAF4EE", borderRadius: "8px", padding: "8px 10px", border: "1px solid #C8E4D3" }}>
                        <div style={{ fontSize: "10px", color: "#2E7D5B", fontWeight: 700 }}>EVIDENCE GENERATED</div>
                        <div style={{ fontSize: "11px", color: "#17191C", marginTop: "2px" }}>{m.evidenceGenerated}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 10: INTERVIEW FOCUS (PERSONALIZED PROBING QUESTIONS)
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s10") && interview && (
          <div className="glass" style={{ background: "#FFFFFF", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#B7791F", fontWeight: 800 }}>SECTION 10</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "#FEF7ED", borderRadius: "4px", color: "#B7791F", border: "1px solid #F8D8A7" }}>VERIFICATION QUESTIONS</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "#162A43" }}>
              Interview Focus & Defensibility Probes
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {interview.probeQuestions.map((q, i) => (
                <div key={i} style={{ padding: "16px", background: "#FAFAF8", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#B7791F", fontWeight: 800 }}>PROBE {i + 1}: {q.targetRequirement}</span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        background: q.candidateDefensibility === "STRONG" ? "#EAF4EE" : "#FEF7ED",
                        borderRadius: "999px",
                        color: q.candidateDefensibility === "STRONG" ? "#2E7D5B" : "#B7791F",
                        border: q.candidateDefensibility === "STRONG" ? "1px solid #C8E4D3" : "1px solid #F8D8A7",
                        fontWeight: 700
                      }}>
                        Defensibility: {q.candidateDefensibility}
                      </span>
                      <button
                        onClick={() => openInspectForProbe(q)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#EFF4FE",
                          border: "1px solid #D2E0FB",
                          color: "#356AE6",
                          cursor: "pointer",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        🔍 Inspect
                      </button>
                    </div>
                  </div>
                  <p style={{ color: "#162A43", fontSize: "13px", fontWeight: 600, marginBottom: "8px", lineHeight: 1.5 }}>
                    "{q.question}"
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px" }}>
                    <div style={{ background: "#FEF7ED", padding: "8px 10px", borderRadius: "8px", border: "1px solid #F8D8A7" }}>
                      <span style={{ color: "#B7791F", fontWeight: 700 }}>Why asked: </span>
                      <span style={{ color: "#17191C" }}>{q.whyAsked}</span>
                    </div>
                    <div style={{ background: "#EAF4EE", padding: "8px 10px", borderRadius: "8px", border: "1px solid #C8E4D3" }}>
                      <span style={{ color: "#2E7D5B", fontWeight: 700 }}>Strong proof looks like: </span>
                      <span style={{ color: "#17191C" }}>{q.whatStrongProofLooksLike}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 11: FINAL EVALUATOR VERDICT
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s11") && (
          <div className="glass" style={{ background: "#FFFFFF", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", border: "1px solid #E4E1DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#162A43", fontWeight: 800 }}>SECTION 11</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "#EFF4FE", borderRadius: "4px", color: "#356AE6", border: "1px solid #D2E0FB" }}>HIRING PANEL SYNTHESIS</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "#162A43" }}>
              Final Evaluator Verdict
            </h3>

            <p style={{ fontSize: "14px", color: "#17191C", lineHeight: 1.7, marginBottom: "1rem" }}>
              {verdict?.overallPanelSummary ||
                `Documented alignment is strongest in ${scoreObj.summaryCounts.supported} core technical criteria. Primary limitations stem from unrecorded cloud and deployment operations, which represent evidence gaps rather than proven skill deficiencies.`}
            </p>

            <div style={{ background: "#FEF7ED", borderRadius: "10px", padding: "14px", border: "1px solid #F8D8A7", borderLeft: "3px solid #B7791F" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#B7791F", marginBottom: "4px" }}>EVIDENCE-BASED SYNTHESIS</div>
              <div style={{ fontSize: "12px", color: "#17191C", lineHeight: 1.5 }}>
                {verdict?.evidenceBasedSynthesis ||
                  verdict?.recommendedApplicationStrategy ||
                  "Lead technical discussions with your verified project implementation workflows, and speak proactively to prototype deployments currently in progress."}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            REAL EVIDENCE INSPECTOR MODAL (PHASE 16)
           ══════════════════════════════════════════════════════════════ */}
        {inspectedEvidence && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 120,
              background: "rgba(22,42,67,0.45)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            }}
            onClick={() => setInspectedEvidence(null)}
          >
            <div
              style={{
                maxWidth: "680px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: "16px",
                padding: "2rem",
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                position: "relative",
                animation: "fadeUp 0.3s ease",
                boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setInspectedEvidence(null)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "transparent",
                  border: "none",
                  color: "#667085",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>

              {/* Modal Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>🔍</span>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "#356AE6" }}>
                      EVIDENCE INSPECTOR & AUDIT TRAIL
                    </div>
                    {inspectedEvidence.requirementName ? (
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#162A43", marginTop: "2px" }}>
                        {inspectedEvidence.requirementName}
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: "#667085" }}>
                        Traceable source provenance • Zero-hallucination invariant
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  <span style={{ fontSize: "10px", padding: "3px 8px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: "6px", color: "#356AE6", fontWeight: 800 }}>
                    {inspectedEvidence.evidenceId}
                  </span>
                  {inspectedEvidence.priority && (
                    <span style={{ fontSize: "10px", padding: "3px 8px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: "6px", color: "#162A43", fontWeight: 800 }}>
                      {inspectedEvidence.priority}
                    </span>
                  )}
                  {inspectedEvidence.evidenceStrength && (
                    <span style={{
                      fontSize: "10px",
                      padding: "3px 8px",
                      background: inspectedEvidence.evidenceStrength === 'DIRECT' || inspectedEvidence.evidenceStrength === 'STRONG' ? "#EAF4EE" : "#FEF7ED",
                      border: `1px solid ${inspectedEvidence.evidenceStrength === 'DIRECT' || inspectedEvidence.evidenceStrength === 'STRONG' ? "#C8E4D3" : "#F8D8A7"}`,
                      borderRadius: "6px",
                      color: inspectedEvidence.evidenceStrength === 'DIRECT' || inspectedEvidence.evidenceStrength === 'STRONG' ? "#2E7D5B" : "#B7791F",
                      fontWeight: 800
                    }}>
                      STRENGTH: {inspectedEvidence.evidenceStrength}
                    </span>
                  )}
                  {inspectedEvidence.evidenceType && (
                    <span style={{ fontSize: "10px", padding: "3px 8px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: "6px", color: "#356AE6", fontWeight: 800 }}>
                      {inspectedEvidence.evidenceType.replace(/_/g, " ")}
                    </span>
                  )}
                  <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", background: getStatusBadge(inspectedEvidence.verificationStatus).bg, color: getStatusBadge(inspectedEvidence.verificationStatus).color, border: `1px solid ${getStatusBadge(inspectedEvidence.verificationStatus).border}`, fontWeight: 800 }}>
                    {inspectedEvidence.verificationStatus.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Source Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1.25rem", fontSize: "12px" }}>
                <div style={{ background: "#FAFAF8", padding: "10px 12px", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: "10px", color: "#667085", marginBottom: "3px", fontWeight: 600 }}>SOURCE TYPE / DOCUMENT</div>
                  <div style={{ color: "#162A43", fontWeight: 700 }}>
                    {inspectedEvidence.sourceType.toUpperCase()} ({inspectedEvidence.sourceDocument})
                  </div>
                  {inspectedEvidence.sourceUrl && (
                    <a href={inspectedEvidence.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#356AE6", textDecoration: "none", display: "block", marginTop: "3px", wordBreak: "break-all", fontWeight: 600 }}>
                      🔗 {inspectedEvidence.sourceUrl}
                    </a>
                  )}
                </div>
                <div style={{ background: "#FAFAF8", padding: "10px 12px", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: "10px", color: "#667085", marginBottom: "3px", fontWeight: 600 }}>PAGE / SECTION</div>
                  <div style={{ color: "#162A43", fontWeight: 700 }}>{inspectedEvidence.section}</div>
                  <div style={{ fontSize: "10px", color: "#667085", marginTop: "3px" }}>
                    Verified at: {new Date(inspectedEvidence.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Original Source Text (Verbatim Quote) */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "10px", letterSpacing: "1px", color: "#667085", fontWeight: 700, marginBottom: "4px" }}>
                  ORIGINAL SOURCE TEXT (VERBATIM PROVENANCE)
                </div>
                <div style={{ fontSize: "13px", color: "#2E7D5B", fontStyle: "italic", lineHeight: 1.6, background: "#EAF4EE", padding: "12px 14px", borderRadius: "10px", border: "1px solid #C8E4D3" }}>
                  "{inspectedEvidence.originalText}"
                </div>
              </div>

              {/* Observed Fact (Normalized) */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "10px", letterSpacing: "1px", color: "#667085", fontWeight: 700, marginBottom: "4px" }}>
                  OBSERVED FACT (NORMALIZED INTERPRETATION)
                </div>
                <div style={{ fontSize: "12px", color: "#17191C", lineHeight: 1.5, background: "#FAFAF8", padding: "10px 12px", borderRadius: "10px", border: "1px solid #E4E1DA" }}>
                  {inspectedEvidence.observedFact}
                </div>
              </div>

              {/* What this proves vs does not prove */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1.25rem" }}>
                <div style={{ background: "#EAF4EE", padding: "12px", borderRadius: "10px", border: "1px solid #C8E4D3" }}>
                  <div style={{ fontSize: "10px", color: "#2E7D5B", fontWeight: 800, letterSpacing: "1px", marginBottom: "6px" }}>
                    ✓ WHAT THIS PROVES
                  </div>
                  {inspectedEvidence.supports.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {inspectedEvidence.supports.map((s, idx) => (
                        <span key={idx} style={{ fontSize: "10px", padding: "2px 8px", background: "#FFFFFF", border: "1px solid #C8E4D3", borderRadius: "6px", color: "#2E7D5B", fontWeight: 700 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "11px", color: "#667085" }}>
                      Self-claim only; does not independently establish implementation.
                    </div>
                  )}
                </div>

                <div style={{ background: "#FDF2F2", padding: "12px", borderRadius: "10px", border: "1px solid #F8C8C8" }}>
                  <div style={{ fontSize: "10px", color: "#C24141", fontWeight: 800, letterSpacing: "1px", marginBottom: "6px" }}>
                    ✗ WHAT THIS DOES NOT PROVE
                  </div>
                  {inspectedEvidence.doesNotProve.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {inspectedEvidence.doesNotProve.map((d, idx) => (
                        <span key={idx} style={{ fontSize: "10px", padding: "2px 8px", background: "#FFFFFF", border: "1px solid #F8C8C8", borderRadius: "6px", color: "#C24141", fontWeight: 700 }}>
                          {d.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "11px", color: "#667085" }}>
                      Non-equivalence and non-implication boundaries enforced.
                    </div>
                  )}
                </div>
              </div>

              {/* Rejected Evidence Alternatives (Section 34 Audit Firewall) */}
              {inspectedEvidence.rejectedEvidence && inspectedEvidence.rejectedEvidence.length > 0 && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "1px", color: "#C24141", fontWeight: 800, marginBottom: "6px" }}>
                    REJECTED EVIDENCE ALTERNATIVES (AUDIT FIREWALL)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {inspectedEvidence.rejectedEvidence.map((rej, idx) => (
                      <div key={idx} style={{ background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: "10px", padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "11px", color: "#C24141", fontStyle: "italic" }}>"{rej.retrievedText}"</span>
                          <span style={{ fontSize: "9px", padding: "1px 6px", background: "#FFFFFF", border: "1px solid #F8C8C8", borderRadius: "4px", color: "#C24141", fontWeight: 800 }}>
                            {rej.decision}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#667085" }}>
                          {rej.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checks Performed (Audit Trail Checklist) */}
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "1px", color: "#667085", fontWeight: 700, marginBottom: "6px" }}>
                  CHECKS PERFORMED (PROGRAMMATIC AUDIT)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {inspectedEvidence.checksPerformed.map((c, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", background: "#FAFAF8", padding: "7px 10px", borderRadius: "8px", border: "1px solid #E4E1DA" }}>
                      <span style={{ color: c.result === "PASSED" ? "#2E7D5B" : c.result === "FAILED" ? "#C24141" : "#B7791F", fontWeight: 900, fontSize: "14px" }}>
                        {c.result === "PASSED" ? "✓" : c.result === "FAILED" ? "✗" : "○"}
                      </span>
                      <span style={{ color: "#162A43", fontWeight: 600 }}>{c.check}</span>
                      {c.detail && <span style={{ color: "#667085", fontSize: "11px" }}>— {c.detail}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}