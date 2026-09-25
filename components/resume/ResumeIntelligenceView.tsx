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
        @keyframes blob1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,-40px) scale(1.1)}66%{transform:translate(-30px,60px) scale(0.9)}}
        @keyframes blob2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-80px,40px) scale(1.2)}66%{transform:translate(50px,-60px) scale(0.85)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(25px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-15px)}to{opacity:1;transform:translateX(0)}}
        .glass{background:rgba(255,255,255,0.035);backdrop-filter:blur(36px);border:1px solid rgba(255,255,255,0.08);}
        .glass-card{background:rgba(15,23,42,0.65);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);border-radius:18px;}
        .glass-card:hover{border-color:rgba(168,85,247,0.35);box-shadow:0 12px 30px rgba(0,0,0,0.4);}
        .btn-main{background:linear-gradient(135deg,#ec4899,#8b5cf6,#6366f1);transition:all 0.3s;border:none;cursor:pointer;color:white;font-weight:800;letter-spacing:1.5px;}
        .btn-main:hover{transform:translateY(-2px);box-shadow:0 16px 36px rgba(236,72,153,0.35);}
        .tab-btn{transition:all 0.2s;border:none;cursor:pointer;font-weight:700;font-family:inherit;}
        .section-chip{transition:all 0.2s;cursor:pointer;}
        .section-chip:hover{background:rgba(255,255,255,0.12)!important;}
        textarea:focus{outline:none;}
        ::-webkit-scrollbar{width:6px;height:6px;}::-webkit-scrollbar-thumb{background:rgba(168,85,247,0.35);border-radius:4px;}
        .evidence-drawer-item{transition:all 0.2s ease;}
        .evidence-drawer-item:hover{background:rgba(255,255,255,0.06);transform:translateX(4px);}
      `}</style>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, background: "#06030f" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle,rgba(236,72,153,0.12) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(90px)", animation: "blob1 12s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "55%", height: "55%", background: "radial-gradient(circle,rgba(168,85,247,0.16) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(90px)", animation: "blob2 15s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(236,72,153,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(236,72,153,0.025) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,#ec4899,#a855f7,#6366f1,transparent)" }} />
      </div>
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
    setActiveSection("all");
  };

  // Status color helper
  const getStatusBadge = (status: EvidenceStatus | string) => {
    switch (status) {
      case "SUPPORTED":
        return { bg: "rgba(0,255,136,0.15)", color: "#00ff88", border: "rgba(0,255,136,0.3)" };
      case "PARTIAL":
        return { bg: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "rgba(56,189,248,0.3)" };
      case "CLAIM_ONLY":
        return { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" };
      case "EVIDENCE_GAP":
        return { bg: "rgba(244,114,182,0.15)", color: "#f472b6", border: "rgba(244,114,182,0.3)" };
      case "SKILL_GAP":
        return { bg: "rgba(239,68,68,0.15)", color: "#ef4444", border: "rgba(239,68,68,0.3)" };
      case "CONTRADICTED":
        return { bg: "rgba(220,38,38,0.2)", color: "#dc2626", border: "rgba(220,38,38,0.4)" };
      default:
        return { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.15)" };
    }
  };

  const getPriorityBadge = (priority: RequirementPriority | string) => {
    switch (priority) {
      case "CRITICAL":
        return { bg: "rgba(239,68,68,0.15)", color: "#ef4444" };
      case "IMPORTANT":
        return { bg: "rgba(56,189,248,0.15)", color: "#38bdf8" };
      default:
        return { bg: "rgba(168,85,247,0.15)", color: "#c084fc" };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. INPUT PAGE
  // ─────────────────────────────────────────────────────────────
  if (step === "input") {
    return (
      <div style={{ minHeight: "100vh", color: "white", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", position: "relative" }}>
        <GradientBg />
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#ec4899,#a855f7)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>✦</div>
            <span style={{ fontWeight: 800, background: "linear-gradient(135deg,#fff,#f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>COGNALYZE</span>
            <span style={{ fontSize: "10px", padding: "2px 8px", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "20px", color: "rgba(236,72,153,0.8)", fontWeight: 700 }}>RESULT ENGINE v3.0</span>
          </div>
          <a href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "13px" }}>← Back to Workspace</a>
        </div>

        <div style={{ position: "relative", zIndex: 10, maxWidth: "960px", margin: "0 auto", padding: "3rem 2rem", animation: "fadeUp 0.6s ease" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "999px", marginBottom: "1rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ec4899", boxShadow: "0 0 8px #ec4899" }} />
              <span style={{ fontSize: "11px", letterSpacing: "2px", color: "#f472b6", fontWeight: 700 }}>CANONICAL HIRING PANEL EVALUATION</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.2rem)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.15, marginBottom: "1rem", background: "linear-gradient(135deg,#fff 30%,#f9a8d4 70%,#a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Evidence-Grounded Result Engine
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", maxWidth: "680px", margin: "0 auto", lineHeight: 1.6 }}>
              Personalized. Traceable. Deterministic. Evaluates your resume against target job requirements with absolute zero fabrication and 11 synchronized hiring dimensions.
            </p>
          </div>

          <div className="glass" style={{ borderRadius: "24px", padding: "2.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ec4899", boxShadow: "0 0 8px #ec4899" }} />
                    <span style={{ fontSize: "11px", letterSpacing: "2px", color: "#ec4899", fontWeight: 700 }}>TARGET JOB DESCRIPTION</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Full text ingested</span>
                </div>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  style={{ width: "100%", height: "230px", background: "rgba(236,72,153,0.04)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: "16px", padding: "16px", color: "rgba(255,255,255,0.9)", fontSize: "13px", resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
                  placeholder="Paste the full job description (e.g. Software Engineer, Machine Learning, Python, AWS, REST APIs)..."
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 8px #a855f7" }} />
                    <span style={{ fontSize: "11px", letterSpacing: "2px", color: "#a855f7", fontWeight: 700 }}>YOUR RESUME</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>PDF, Image, or Text</span>
                </div>
                <div
                  onClick={() => document.getElementById("resumeUp")?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileUpload(f);
                  }}
                  style={{ border: "2px dashed rgba(168,85,247,0.3)", borderRadius: "14px", padding: "14px", textAlign: "center", cursor: "pointer", marginBottom: "10px", background: "rgba(168,85,247,0.03)", transition: "all 0.2s" }}
                >
                  <input id="resumeUp" type="file" accept="image/*,.pdf,application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  {parsing ? (
                    <div style={{ color: "#a855f7", fontSize: "12px" }}><span style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: "8px" }}>⟳</span>Extracting complete text...</div>
                  ) : resumeFile ? (
                    <div style={{ color: "#00ff88", fontSize: "12px", fontWeight: 600 }}>✓ {resumeFile.name}</div>
                  ) : (
                    <div>
                      <span style={{ fontSize: "20px" }}>📄</span>
                      <div style={{ color: "rgba(168,85,247,0.9)", fontSize: "12px", fontWeight: 700, marginTop: "2px" }}>Upload Resume File</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>PDF, PNG, or JPG</div>
                    </div>
                  )}
                </div>
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  style={{ width: "100%", height: "135px", background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "16px", padding: "16px", color: "rgba(255,255,255,0.9)", fontSize: "13px", resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
                  placeholder="Or paste your complete resume text here..."
                />
              </div>
            </div>
          </div>

          {error && <p style={{ color: "#ff4466", textAlign: "center", marginBottom: "1rem", fontSize: "13px" }}>⚠ {error}</p>}

          <button
            className="btn-main"
            onClick={analyze}
            disabled={!resume.trim()}
            style={{ width: "100%", padding: "1.1rem", borderRadius: "16px", fontSize: "15px", letterSpacing: "2px", opacity: !resume.trim() ? 0.4 : 1, cursor: !resume.trim() ? "not-allowed" : "pointer" }}
          >
            RUN COMPLETE RESULT ENGINE AUDIT →
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
      <div style={{ minHeight: "100vh", background: "#06030f", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <GradientBg />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "550px", padding: "2rem" }}>
          <div style={{ position: "relative", width: "90px", height: "90px", margin: "0 auto 2rem" }}>
            <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(236,72,153,0.2)", borderTop: "2px solid #ec4899", borderRadius: "50%", animation: "spin 1.2s linear infinite" }} />
            <div style={{ position: "absolute", inset: "12px", border: "2px solid rgba(168,85,247,0.15)", borderBottom: "2px solid #a855f7", borderRadius: "50%", animation: "spin 0.8s linear infinite reverse" }} />
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>✦</span>
          </div>
          <div style={{ fontSize: "13px", letterSpacing: "2px", color: "rgba(255,255,255,0.9)", fontWeight: 700, marginBottom: "8px" }}>
            {loadMsg.toUpperCase()}
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: 1.5 }}>
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
    <div style={{ minHeight: "100vh", color: "white", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", position: "relative" }}>
      <GradientBg />

      {/* Top Sticky Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(6,3,15,0.85)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "30px", background: "linear-gradient(135deg,#ec4899,#a855f7)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>✦</div>
          <span style={{ fontWeight: 800, background: "linear-gradient(135deg,#fff,#f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>COGNALYZE</span>
          <span style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "20px", color: "#00ff88", fontWeight: 700 }}>ZERO-FABRICATION VERIFIED</span>
        </div>
        <button onClick={resetAll} style={{ padding: "0.45rem 1.1rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
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
                  border: activeSection === sec.id ? "1px solid #ec4899" : "1px solid rgba(255,255,255,0.08)",
                  background: activeSection === sec.id ? "rgba(236,72,153,0.2)" : "rgba(255,255,255,0.03)",
                  color: activeSection === sec.id ? "#f472b6" : "rgba(255,255,255,0.6)",
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
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
              <div style={{ flex: 1, minWidth: "280px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#a855f7", fontWeight: 800 }}>SECTION 1</span>
                  <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(168,85,247,0.15)", borderRadius: "4px", color: "#d8b4fe" }}>DETERMINISTIC EVALUATION</span>
                </div>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0 0 8px", color: "white" }}>
                  Role Alignment Score
                </h2>
                <p style={{ fontSize: "13px", color: "#38bdf8", margin: "0 0 10px", fontWeight: 600, lineHeight: 1.5 }}>
                  "{verdict?.oneLineVerdict || scoreObj.scoreVerdictExplanation}"
                </p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>
                  {scoreObj.formulaExplanation}
                </p>
              </div>

              <div style={{ textAlign: "right", minWidth: "140px" }}>
                <div style={{ fontSize: "3.2rem", fontWeight: 900, lineHeight: 1, background: "linear-gradient(135deg,#00ff88,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {scoreObj.overallEvidenceMatch}%
                </div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px", marginTop: "4px" }}>
                  EVIDENCE MATCH
                </div>
              </div>
            </div>

            {/* Score Counts Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ background: "rgba(0,255,136,0.06)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(0,255,136,0.15)" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>Supported</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#00ff88" }}>{scoreObj.summaryCounts.supported} Reqs</div>
              </div>
              <div style={{ background: "rgba(56,189,248,0.06)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(56,189,248,0.15)" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>Partial</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#38bdf8" }}>{scoreObj.summaryCounts.partial} Reqs</div>
              </div>
              <div style={{ background: "rgba(251,191,36,0.06)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(251,191,36,0.15)" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>Claim Only</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#fbbf24" }}>{scoreObj.summaryCounts.claimOnly} Reqs</div>
              </div>
              <div style={{ background: "rgba(244,114,182,0.06)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(244,114,182,0.15)" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>Evidence Gaps</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#f472b6" }}>{scoreObj.summaryCounts.evidenceGaps} Reqs</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>Total Ingested</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "white" }}>{scoreObj.summaryCounts.totalRequirements} Reqs</div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: REQUIREMENT ALIGNMENT TABLE
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s2") && matches.length > 0 && (
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(56,189,248,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#38bdf8", fontWeight: 800 }}>SECTION 2</div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "2px 0 0", color: "white" }}>
                  Requirement-by-Requirement Alignment Matrix
                </h3>
              </div>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                Traceable to exact JD criteria and resume source quotes
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>Requirement</th>
                    <th style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>Priority</th>
                    <th style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>Status</th>
                    <th style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>Confidence</th>
                    <th style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>Resume Evidence / Gap Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, idx) => {
                    const statusBadge = getStatusBadge(m.status);
                    const prioBadge = getPriorityBadge(m.priority);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "12px", fontWeight: 700, color: "white" }}>{m.requirementName}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: prioBadge.bg, color: prioBadge.color, fontWeight: 700 }}>
                            {m.priority}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}`, fontWeight: 700 }}>
                            {m.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: m.confidenceTier === "HIGH" ? "#00ff88" : m.confidenceTier === "MEDIUM" ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>
                          {m.confidenceTier} ({Math.round(m.confidence * 100)}%)
                        </td>
                        <td style={{ padding: "12px", color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
                          {m.evidenceQuotes[0] ? (
                            <div>
                              <span style={{ color: "#34d399", fontStyle: "italic" }}>"{m.evidenceQuotes[0]}"</span>
                              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{m.reasoning}</div>
                            </div>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.5)" }}>{m.reasoning}</span>
                          )}
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
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(167,139,250,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#a78bfa", fontWeight: 800 }}>SECTION 3</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(167,139,250,0.15)", borderRadius: "4px", color: "#c4b5fd" }}>SOURCE PROVENANCE</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "white" }}>
              Evidence Review: What the Resume Actually Proves
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>
              Every bullet point and project below was extracted with line/section provenance. Cognalyze bases every decision strictly on this evidence inventory.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
              {canonical.evidence.slice(0, 8).map((evi, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.025)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "white" }}>{evi.title}</span>
                    <span style={{ fontSize: "9px", padding: "1px 6px", background: "rgba(167,139,250,0.15)", borderRadius: "4px", color: "#c4b5fd" }}>
                      {evi.section}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "0 0 6px", lineHeight: 1.4 }}>
                    "{evi.text}"
                  </p>
                  {evi.technologies.length > 0 && (
                    <div style={{ fontSize: "10px", color: "#38bdf8" }}>
                      Detected Tooling: {evi.technologies.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4: STRENGTHS (ONLY EVIDENCE-BACKED)
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s4") && (
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(0,255,136,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#00ff88", fontWeight: 800 }}>SECTION 4</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(0,255,136,0.15)", borderRadius: "4px", color: "#00ff88" }}>VERIFIABLE COMPETENCY</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "white" }}>
              Evidence-Backed Strengths
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {strengths.map((str, i) => (
                <div key={i} style={{ padding: "14px 16px", background: "rgba(0,255,136,0.04)", borderRadius: "14px", border: "1px solid rgba(0,255,136,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 800, fontSize: "14px", color: "white" }}>{str.strength}</span>
                    <span style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(0,255,136,0.15)", borderRadius: "999px", color: "#00ff88", fontWeight: 700 }}>
                      SUPPORTED
                    </span>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", color: "#34d399", fontStyle: "italic", marginBottom: "6px" }}>
                    "{str.evidence}"
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                    <strong>Role Relevance:</strong> {str.whyItMatters}
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
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(255,68,102,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#ff4466", fontWeight: 800 }}>SECTION 5</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(255,68,102,0.15)", borderRadius: "4px", color: "#ff4466" }}>DEFENSIBLE GAP ANALYSIS</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "white" }}>
              Requirement-Specific Gaps & Risks
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {gaps.map((gap, i) => (
                <div key={i} style={{ padding: "16px", background: "rgba(255,68,102,0.03)", borderRadius: "14px", border: "1px solid rgba(255,68,102,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 800, fontSize: "14px", color: "white" }}>GAP: {gap.requirement}</span>
                    <span style={{ fontSize: "10px", padding: "2px 8px", background: gap.gapType === "Evidence Gap" ? "rgba(56,189,248,0.15)" : "rgba(255,68,102,0.15)", borderRadius: "999px", color: gap.gapType === "Evidence Gap" ? "#38bdf8" : "#ff4466", fontWeight: 700 }}>
                      {gap.gapType.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}>
                    <strong>Current Evidence:</strong> {gap.currentEvidence}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
                    <strong>Why It Matters:</strong> {gap.impact}
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", color: "#38bdf8" }}>
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
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(167,139,250,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#a78bfa", fontWeight: 800 }}>SECTION 6</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(167,139,250,0.15)", borderRadius: "4px", color: "#c4b5fd" }}>MULTI-DIMENSIONAL AUDIT</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "white" }}>
              Experience Quality Analysis
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px", marginBottom: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>Professional Experience</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "4px" }}>{expAnalysis.professionalExperience.level}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{expAnalysis.professionalExperience.detail}</div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>Project Depth</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#00ff88", marginBottom: "4px" }}>{expAnalysis.projectEvidence.level} ({expAnalysis.projectEvidence.count} Projects)</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{expAnalysis.projectEvidence.detail}</div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>Engineering Depth</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8", marginBottom: "4px" }}>{expAnalysis.engineeringDepth.level}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{expAnalysis.engineeringDepth.detail}</div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>Impact Evidence</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#fbbf24", marginBottom: "4px" }}>{expAnalysis.impactEvidence.level}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{expAnalysis.impactEvidence.detail}</div>
              </div>
            </div>

            <div style={{ background: "rgba(167,139,250,0.08)", borderRadius: "12px", padding: "12px 16px", borderLeft: "3px solid #a78bfa" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#c4b5fd" }}>Evaluator Fairness Note: </span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>{expAnalysis.fresherFairnessAssessment}</span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 7: SKILLS & EVIDENCE GAP CATEGORIZATION
           ══════════════════════════════════════════════════════════════ */}
        {showSection("s7") && report?.skillsGap && report.skillsGap.length > 0 && (
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(56,189,248,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#38bdf8", fontWeight: 800 }}>SECTION 7</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(56,189,248,0.15)", borderRadius: "4px", color: "#38bdf8" }}>SKILLS & EVIDENCE TAXONOMY</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "white" }}>
              Skills & Evidence Gap Breakdown
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {report.skillsGap.map((sg, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.025)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "white" }}>{sg.name}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span style={{ fontSize: "10px", padding: "2px 8px", background: sg.gapType === "EVIDENCE_GAP" ? "rgba(56,189,248,0.15)" : "rgba(239,68,68,0.15)", borderRadius: "999px", color: sg.gapType === "EVIDENCE_GAP" ? "#38bdf8" : "#ef4444", fontWeight: 700 }}>
                        {sg.gapType.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", color: "rgba(255,255,255,0.5)" }}>
                        {sg.priority} PRIORITY
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
                    {sg.whyPrioritized}
                  </div>
                  <div style={{ fontSize: "11px", color: "#38bdf8" }}>
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
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#a855f7", fontWeight: 800 }}>SECTION 8</span>
                  <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(0,255,136,0.15)", borderRadius: "4px", color: "#00ff88", fontWeight: 700 }}>
                    ZERO FABRICATION CERTIFIED
                  </span>
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "2px 0 0", color: "white" }}>
                  Truthful Full Resume Output
                </h3>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setShowOriginalResume(!showOriginalResume)}
                  style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  {showOriginalResume ? "Hide Original" : "Compare Original"}
                </button>
                <button
                  onClick={copyResume}
                  style={{ padding: "6px 14px", borderRadius: "8px", background: copied ? "rgba(0,255,136,0.2)" : "rgba(168,85,247,0.2)", border: `1px solid ${copied ? "rgba(0,255,136,0.4)" : "rgba(168,85,247,0.4)"}`, color: copied ? "#00ff88" : "#d8b4fe", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
                >
                  {copied ? "✓ Copied!" : "📋 Copy Full Clean Resume"}
                </button>
              </div>
            </div>

            <div style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "12px", padding: "10px 14px", marginBottom: "1.5rem", fontSize: "12px", color: "#00ff88" }}>
              🛡️ Every rewritten statement is traceable to source evidence. Click any bullet to view its Evidence Drawer.
            </div>

            {/* Comparison Side-by-side */}
            {showOriginalResume && (
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "14px", padding: "14px", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: "11px", letterSpacing: "2px", color: "rgba(255,255,255,0.4)", fontWeight: 800, marginBottom: "8px" }}>
                  ORIGINAL UNEDITED RESUME
                </div>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace", maxHeight: "200px", overflow: "auto" }}>
                  {resume}
                </pre>
              </div>
            )}

            {/* Full Rewritten Resume Display */}
            <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: "16px", padding: "1.75rem", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0 0 4px", color: "white" }}>
                  {(rewriter as any)?.name || "CANDIDATE NAME"}
                </h2>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                  {(rewriter as any)?.contact?.email && <span>{(rewriter as any).contact.email} • </span>}
                  {(rewriter as any)?.contact?.phone && <span>{(rewriter as any).contact.phone} • </span>}
                  {(rewriter as any)?.contact?.links && (rewriter as any).contact.links.join(" • ")}
                </div>
              </div>

              {/* Professional Summary */}
              {rewriter.summary && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#a855f7", fontWeight: 800, marginBottom: "6px" }}>
                    PROFESSIONAL SUMMARY
                  </div>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 }}>
                    {rewriter.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {rewriter.skills && rewriter.skills.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#a855f7", fontWeight: 800, marginBottom: "6px" }}>
                    TECHNICAL SKILLS
                  </div>
                  {rewriter.skills.map((sg, idx) => (
                    <div key={idx} style={{ fontSize: "13px", marginBottom: "4px" }}>
                      <strong style={{ color: "#d8b4fe" }}>{sg.category}: </strong>
                      <span style={{ color: "rgba(255,255,255,0.8)" }}>{sg.items.join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {rewriter.experience && rewriter.experience.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#a855f7", fontWeight: 800, marginBottom: "10px" }}>
                    EXPERIENCE
                  </div>
                  {rewriter.experience.map((exp, idx) => (
                    <div key={idx} style={{ marginBottom: "12px", borderLeft: "2px solid rgba(168,85,247,0.4)", paddingLeft: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 800, color: "white" }}>
                        <span>{exp.role}</span>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{exp.period}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#38bdf8", marginBottom: "6px" }}>{exp.company}</div>
                      {exp.bullets.map((b) => (
                        <div
                          key={b.bulletId}
                          className="evidence-drawer-item"
                          onClick={() => setSelectedBullet(b)}
                          style={{ display: "flex", alignItems: "flex-start", gap: "6px", padding: "4px 6px", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <span style={{ color: "#a855f7" }}>•</span>
                          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5, flex: 1 }}>{b.rewrittenText}</span>
                          <span style={{ fontSize: "9px", padding: "1px 5px", background: "rgba(168,85,247,0.15)", borderRadius: "4px", color: "#d8b4fe" }}>
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
                  <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#a855f7", fontWeight: 800, marginBottom: "10px" }}>
                    TECHNICAL PROJECTS
                  </div>
                  {rewriter.projects.map((proj, idx) => (
                    <div key={idx} style={{ marginBottom: "12px", borderLeft: "2px solid rgba(56,189,248,0.4)", paddingLeft: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 800, color: "white" }}>
                        <span>{proj.title}</span>
                        <span style={{ fontSize: "11px", color: "#38bdf8" }}>[{((proj as any).technologies || (proj as any).tech || []).join(", ")}]</span>
                      </div>
                      {proj.bullets.map((b) => (
                        <div
                          key={b.bulletId}
                          className="evidence-drawer-item"
                          onClick={() => setSelectedBullet(b)}
                          style={{ display: "flex", alignItems: "flex-start", gap: "6px", padding: "4px 6px", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <span style={{ color: "#38bdf8" }}>•</span>
                          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5, flex: 1 }}>{b.rewrittenText}</span>
                          <span style={{ fontSize: "9px", padding: "1px 5px", background: "rgba(56,189,248,0.15)", borderRadius: "4px", color: "#7dd3fc" }}>
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
                  <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#a855f7", fontWeight: 800, marginBottom: "8px" }}>
                    EDUCATION
                  </div>
                  {rewriter.education.map((edu, idx) => (
                    <div key={idx} style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                      <strong>{edu.degree}</strong> — {edu.institution} ({edu.year})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Evidence Drawer Modal */}
            {selectedBullet && (
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
                onClick={() => setSelectedBullet(null)}
              >
                <div
                  className="glass"
                  style={{ maxWidth: "580px", width: "100%", borderRadius: "22px", padding: "2rem", border: "1px solid rgba(168,85,247,0.4)", position: "relative", animation: "fadeUp 0.3s ease" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedBullet(null)}
                    style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "18px", cursor: "pointer" }}
                  >
                    ✕
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "16px" }}>🔍</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "#a855f7" }}>
                      PROVENANCE & EVIDENCE DRAWER
                    </span>
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>REWRITTEN BULLET</div>
                    <div style={{ fontSize: "13px", color: "#00ff88", lineHeight: 1.5, background: "rgba(0,255,136,0.06)", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0,255,136,0.15)" }}>
                      {selectedBullet.rewrittenText}
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>VERBATIM SOURCE TEXT</div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "10px" }}>
                      "{selectedBullet.originalText}"
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>TRANSFORMATION RATIONALE</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                      {selectedBullet.transformationRationale}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ background: "rgba(0,255,136,0.05)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,255,136,0.12)" }}>
                      <div style={{ fontSize: "10px", color: "#00ff88", fontWeight: 700 }}>NEW FACTS ADDED</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>{selectedBullet.newFactsAdded}</div>
                    </div>

                    <div style={{ background: "rgba(56,189,248,0.05)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(56,189,248,0.12)" }}>
                      <div style={{ fontSize: "10px", color: "#38bdf8", fontWeight: 700 }}>DEFENSIBILITY</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>{selectedBullet.interviewDefensibility} — Ready to verify</div>
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
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(99,102,241,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#818cf8", fontWeight: 800 }}>SECTION 9</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(99,102,241,0.15)", borderRadius: "4px", color: "#818cf8" }}>ACTIONABLE MILESTONES</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1.25rem", color: "white" }}>
              Evidence-Generating Roadmap
            </h3>

            <div style={{ position: "relative", paddingLeft: "24px" }}>
              <div style={{ position: "absolute", left: "8px", top: 0, bottom: 0, width: "2px", background: "linear-gradient(180deg,#6366f1,#ec4899)", borderRadius: "999px" }} />
              {roadmap.milestones.map((m, i) => (
                <div key={i} style={{ marginBottom: "1.5rem", position: "relative" }}>
                  <div style={{ position: "absolute", left: "-20px", top: "16px", width: "10px", height: "10px", borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 8px #6366f1" }} />
                  <div style={{ background: "rgba(255,255,255,0.025)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#818cf8", fontWeight: 800 }}>{m.phase}</span>
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Effort: {m.realisticEffort}</span>
                    </div>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 6px", color: "white" }}>{m.title}</h4>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5, margin: "0 0 10px" }}>{m.action}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: "8px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "10px", color: "#818cf8", fontWeight: 700 }}>DELIVERABLE ARTIFACT</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>{(m as any).concreteDeliverableArtifact || (m as any).deliverableArtifact || ""}</div>
                      </div>
                      <div style={{ background: "rgba(0,255,136,0.06)", borderRadius: "8px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "10px", color: "#00ff88", fontWeight: 700 }}>EVIDENCE GENERATED</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>{m.evidenceGenerated}</div>
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
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2.5rem", border: "1px solid rgba(251,191,36,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#fbbf24", fontWeight: 800 }}>SECTION 10</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(251,191,36,0.15)", borderRadius: "4px", color: "#fbbf24" }}>VERIFICATION QUESTIONS</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "white" }}>
              Interview Focus & Defensibility Probes
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {interview.probeQuestions.map((q, i) => (
                <div key={i} style={{ padding: "16px", background: "rgba(251,191,36,0.03)", borderRadius: "14px", border: "1px solid rgba(251,191,36,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 800 }}>PROBE {i + 1}: {q.targetRequirement}</span>
                    <span style={{ fontSize: "10px", padding: "2px 8px", background: q.candidateDefensibility === "STRONG" ? "rgba(0,255,136,0.15)" : "rgba(251,191,36,0.15)", borderRadius: "999px", color: q.candidateDefensibility === "STRONG" ? "#00ff88" : "#fbbf24", fontWeight: 700 }}>
                      Defensibility: {q.candidateDefensibility}
                    </span>
                  </div>
                  <p style={{ color: "white", fontSize: "13px", fontWeight: 600, marginBottom: "8px", lineHeight: 1.5 }}>
                    "{q.question}"
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px" }}>
                    <div style={{ background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: "8px" }}>
                      <span style={{ color: "#fbbf24", fontWeight: 700 }}>Why asked: </span>
                      <span style={{ color: "rgba(255,255,255,0.65)" }}>{q.whyAsked}</span>
                    </div>
                    <div style={{ background: "rgba(0,255,136,0.025)", padding: "8px 10px", borderRadius: "8px" }}>
                      <span style={{ color: "#00ff88", fontWeight: 700 }}>Strong proof looks like: </span>
                      <span style={{ color: "rgba(255,255,255,0.65)" }}>{q.whatStrongProofLooksLike}</span>
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
          <div className="glass" style={{ borderRadius: "22px", padding: "2rem", marginBottom: "2rem", border: "1px solid rgba(236,72,153,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#ec4899", fontWeight: 800 }}>SECTION 11</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(236,72,153,0.15)", borderRadius: "4px", color: "#f472b6" }}>HIRING PANEL SYNTHESIS</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem", color: "white" }}>
              Final Evaluator Verdict
            </h3>

            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", lineHeight: 1.7, marginBottom: "1rem" }}>
              {verdict?.overallPanelSummary ||
                `Documented alignment is strongest in ${scoreObj.summaryCounts.supported} core technical criteria. Primary limitations stem from unrecorded cloud and deployment operations, which represent evidence gaps rather than proven skill deficiencies.`}
            </p>

            <div style={{ background: "rgba(236,72,153,0.06)", borderRadius: "12px", padding: "14px", borderLeft: "3px solid #ec4899" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#f472b6", marginBottom: "4px" }}>RECOMMENDED APPLICATION STRATEGY</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                {verdict?.recommendedApplicationStrategy ||
                  "Lead technical discussions with your verified project implementation workflows, and speak proactively to prototype deployments currently in progress."}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}