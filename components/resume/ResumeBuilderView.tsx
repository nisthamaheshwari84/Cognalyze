"use client";
import { useState } from "react";

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  github?: string;
  location: string;
  summary: string;
  category?: string;
  sections_in_order?: string[];
  experience: {
    role: string;
    company?: string;
    organization?: string;
    duration?: string;
    dates?: string;
    location?: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
    relevant?: string;
  }[];
  skills_categorized?: {
    Languages?: string[];
    Frameworks?: string[];
    Tools?: string[];
    Cloud?: string[];
    "AI & ML"?: string[];
    AI?: string[];
    "Core Fundamentals"?: string[];
    Fundamentals?: string[];
    [key: string]: string[] | undefined;
  };
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    databases: string[];
    concepts?: string[];
  };
  projects: {
    name?: string;
    title?: string;
    link?: string;
    tech: string;
    bullets: string[];
  }[];
  certifications: string[];
  achievements: string[];
  ats_score: number;
  keywords_matched: string[];
  improvements: string[];
  advanced_metrics?: {
    recruiter_attention: number;
    skill_credibility: number;
    achievement_impact: number;
    content_quality: number;
    personal_branding: number;
    design_quality: number;
    interview_readiness: number;
    trust_score: number;
    resume_dna_score: number;
  };
}

const TEMPLATES = [
  { id: "ats-classic", name: "ATS Classic", desc: "Harvard/Wall Street style, single-column, 100% blind ATS compliant", accent: "#111827", bg: "#111827" },
  { id: "modern-tech", name: "Modern Tech", desc: "Sidebar layout, modern visual feel (Best for direct human recruiter review)", accent: "#6366f1", bg: "#1e1b4b" },
  { id: "corporate", name: "Corporate", desc: "Traditional recruiter format, serif font, single-column ATS", accent: "#1e3a5f", bg: "#1e3a5f" },
  { id: "executive", name: "Executive", desc: "Premium layout, leadership-focused, single-column ATS", accent: "#92400e", bg: "#92400e" },
  { id: "creative", name: "Creative", desc: "Visual hierarchy, gradient styling, single-column ATS", accent: "#7c3aed", bg: "#7c3aed" },
  { id: "fresher", name: "Fresher", desc: "Education & project prioritized, single-column ATS", accent: "#059669", bg: "#059669" },
  { id: "startup", name: "Startup", desc: "Bold modern typography, project focus, single-column ATS", accent: "#dc2626", bg: "#dc2626" },
];

function TemplateThumb({ t, selected, onClick }: { t: typeof TEMPLATES[0]; selected: boolean; onClick: () => void }) {
  const layouts: Record<string, React.ReactNode> = {
    "ats-classic": (
      <div style={{ padding: "6px 8px" }}>
        <div style={{ textAlign: "center", borderBottom: "1.5px solid #111827", paddingBottom: 2, marginBottom: 4 }}>
          <div style={{ height: 3, background: "#111827", width: "16px", margin: "0 auto 2px", borderRadius: 0.5 }} />
          <div style={{ height: 1.5, background: "rgba(0,0,0,0.2)", width: "24px", margin: "0 auto" }} />
        </div>
        {[14, 10, 12, 8, 10].map((w, i) => (
          <div key={i} style={{ height: 2, background: "rgba(0,0,0,0.12)", width: `${w}px`, borderRadius: 0.5, marginBottom: 2 }} />
        ))}
      </div>
    ),
    "modern-tech": (
      <div style={{ display: "flex", height: "100%", gap: 2 }}>
        <div style={{ width: "35%", background: t.bg, borderRadius: "2px 0 0 2px", padding: "4px 3px" }}>
          {[16, 8, 6, 6, 6].map((w, i) => <div key={i} style={{ height: 2, background: "rgba(255,255,255,0.6)", width: `${w}px`, borderRadius: 1, marginBottom: i === 0 ? 3 : 2 }} />)}
        </div>
        <div style={{ flex: 1, padding: "4px 3px" }}>
          {[14, 10, 8, 8, 6, 8, 8, 6].map((w, i) => <div key={i} style={{ height: 2, background: i === 0 ? t.accent : "rgba(0,0,0,0.15)", width: `${w}px`, borderRadius: 1, marginBottom: 2 }} />)}
        </div>
      </div>
    ),
    "corporate": (
      <div style={{ padding: "4px 5px" }}>
        <div style={{ textAlign: "center", borderBottom: `1.5px solid ${t.accent}`, paddingBottom: 3, marginBottom: 3 }}>
          {[12, 8, 10].map((w, i) => <div key={i} style={{ height: 2, background: i === 0 ? t.accent : "rgba(0,0,0,0.2)", width: `${w}px`, borderRadius: 1, marginBottom: 1, margin: "0 auto 1px" }} />)}
        </div>
        {[14, 10, 8, 8, 10, 8, 8].map((w, i) => <div key={i} style={{ height: 2, background: i % 3 === 0 ? t.accent : "rgba(0,0,0,0.12)", width: `${w}px`, borderRadius: 1, marginBottom: 2 }} />)}
      </div>
    ),
    "executive": (
      <div style={{ padding: "4px 3px 4px 7px", borderLeft: `3px solid ${t.accent}` }}>
        {[16, 8, 10, 6, 12, 8, 8, 6, 10, 8].map((w, i) => <div key={i} style={{ height: 2, background: i === 0 ? "#1c1c1c" : i === 1 ? t.accent : "rgba(0,0,0,0.12)", width: `${w}px`, borderRadius: 1, marginBottom: 2 }} />)}
      </div>
    ),
    "creative": (
      <div>
        <div style={{ background: `linear-gradient(135deg,${t.accent},#a855f7)`, padding: "5px 4px", borderRadius: "3px 3px 0 0" }}>
          {[14, 8, 10].map((w, i) => <div key={i} style={{ height: 2, background: "rgba(255,255,255,0.8)", width: `${w}px`, borderRadius: 1, marginBottom: 1 }} />)}
        </div>
        <div style={{ padding: "3px 4px" }}>
          {[12, 8, 8, 6, 10, 8].map((w, i) => <div key={i} style={{ height: 2, background: i === 0 ? t.accent : "rgba(0,0,0,0.12)", width: `${w}px`, borderRadius: 1, marginBottom: 2 }} />)}
        </div>
      </div>
    ),
    "fresher": (
      <div style={{ padding: "4px 5px" }}>
        <div style={{ background: "#ecfdf5", border: `1.5px solid ${t.accent}`, borderRadius: 3, padding: "3px 3px", marginBottom: 3 }}>
          {[12, 8, 9].map((w, i) => <div key={i} style={{ height: 2, background: i === 0 ? t.accent : "rgba(0,0,0,0.15)", width: `${w}px`, borderRadius: 1, marginBottom: 1 }} />)}
        </div>
        {[12, 8, 8, 6, 10, 8].map((w, i) => <div key={i} style={{ height: 2, background: i % 3 === 0 ? t.accent : "rgba(0,0,0,0.12)", width: `${w}px`, borderRadius: 1, marginBottom: 2 }} />)}
      </div>
    ),
    "startup": (
      <div style={{ padding: "4px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `2px solid #111`, paddingBottom: 3, marginBottom: 3 }}>
          <div>{[14, 8].map((w, i) => <div key={i} style={{ height: 2, background: i === 0 ? "#111" : t.accent, width: `${w}px`, borderRadius: 1, marginBottom: 1 }} />)}</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>{[8, 6].map((w, i) => <div key={i} style={{ height: 1.5, background: "rgba(0,0,0,0.2)", width: `${w}px`, borderRadius: 1 }} />)}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 3 }}>
          {[6, 8, 5, 7].map((w, i) => <div key={i} style={{ height: 5, background: "#111", width: `${w}px`, borderRadius: 1 }} />)}
        </div>
        {[12, 8, 8].map((w, i) => <div key={i} style={{ height: 2, background: "rgba(0,0,0,0.12)", width: `${w}px`, borderRadius: 1, marginBottom: 2 }} />)}
      </div>
    ),
  };

  return (
    <div onClick={onClick} style={{ cursor: "pointer", borderRadius: 14, border: `2px solid ${selected ? (t.id === "ats-classic" ? "#6366f1" : t.accent) : "rgba(255,255,255,0.08)"}`, background: selected ? `${t.id === "ats-classic" ? "#6366f1" : t.accent}10` : "rgba(255,255,255,0.02)", transition: "all 0.2s", overflow: "hidden" }}>
      <div style={{ height: 80, background: "white", margin: "8px 8px 0", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
        {layouts[t.id]}
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: selected ? "white" : "rgba(255,255,255,0.6)", marginBottom: 2 }}>{t.name}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>{t.desc}</div>
      </div>
    </div>
  );
}

export default function ResumePage() {
  const [step, setStep] = useState<"input" | "loading" | "result">("input");
  const [targetRole, setTargetRole] = useState("");
  const [experience, setExperience] = useState("");
  const [category, setCategory] = useState("auto");
  const [ambiguousAlert, setAmbiguousAlert] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [background, setBackground] = useState("");
  const [template, setTemplate] = useState("ats-classic");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [certifications, setCertifications] = useState("");
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [error, setError] = useState("");

  const build = async () => {
    if (!targetRole || !background) return;
    setStep("loading");
    setError("");
    setAmbiguousAlert(false);

    try {
      const res = await fetch("/api/build-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords,
          targetRole,
          experience,
          background,
          template,
          linkedin,
          github,
          certifications,
          category: category !== "auto" ? category : undefined,
        }),
      });

      const data = await res.json();

      if (data.ambiguous) {
        setAmbiguousAlert(true);
        setError("Recruiter Check: Your career stage could not be determined automatically. Please select your exact Career Stage below.");
        setStep("input");
        return;
      }

      if (data.error) throw new Error(data.error);

      setResume(data);
      setStep("result");
    } catch (e: any) {
      setError(e.message);
      setStep("input");
    }
  };

  const tpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];

  const downloadPDF = () => {
    if (!resume) return;
    const win = window.open("", "_blank");
    if (!win) return;

    const css: Record<string, string> = {
      "ats-classic": `
        body{font-family:'Georgia',Times,serif;font-size:9.5pt;color:#111827;line-height:1.45;margin:0;}
        .wrap{max-width:760px;margin:0 auto;padding:26px 36px;}
        .hd{text-align:center;margin-bottom:12px;}
        .name{font-size:18pt;font-weight:700;letter-spacing:-0.5px;color:#111827;margin-bottom:4px;text-transform:uppercase;}
        .ci{font-size:8.5pt;color:#4b5563;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;}
        .sm{font-size:9pt;color:#374151;line-height:1.5;margin-bottom:12px;text-align:justify;}
        .mt{font-size:9pt;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #111827;padding-bottom:2px;margin:12px 0 6px;}
        .jh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;}
        .jt{font-weight:700;font-size:9.5pt;color:#111827;}
        .co{font-weight:700;font-size:9.5pt;color:#374151;}
        .du{font-size:8.5pt;color:#4b5563;font-style:italic;}
        li{font-size:9pt;color:#374151;line-height:1.45;margin-bottom:2px;}
        .skills-row{font-size:9pt;margin-bottom:3px;color:#374151;}
        .skills-label{font-weight:700;color:#111827;}
        .ch{display:inline-block;margin-right:10px;font-size:8.5pt;}
        .clearfix::after{content:'';display:table;clear:both;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`,
      "modern-tech": `
        body{font-family:'Segoe UI',Arial,sans-serif;font-size:9pt;color:#1f2937;margin:0;}
        .wrap{display:grid;grid-template-columns:215px 1fr;min-height:100vh;}
        .sidebar{background:#1e1b4b;color:white;padding:24px 18px;}
        .main{padding:24px 28px;}
        .name{font-size:17pt;font-weight:800;color:white;letter-spacing:-0.5px;line-height:1.1;margin-bottom:3px;}
        .title{font-size:9.5pt;color:#a5b4fc;font-weight:500;margin-bottom:16px;}
        .ci{font-size:8pt;color:#c7d2fe;margin-bottom:5px;display:flex;align-items:center;gap:5px;}
        .st{font-size:7.5pt;font-weight:700;color:#a5b4fc;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid rgba(165,180,252,0.25);padding-bottom:3px;margin:14px 0 6px;}
        .sk{font-size:8pt;color:#e0e7ff;margin-bottom:3px;}
        .mt{font-size:9pt;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1.5px solid #6366f1;padding-bottom:3px;margin:14px 0 7px;}
        .jh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;flex-wrap:wrap;}
        .jt{font-weight:700;font-size:9.5pt;color:#1f2937;}
        .co{color:#6366f1;font-weight:600;font-size:9pt;}
        .du{font-size:7.5pt;color:#9ca3af;}
        li{font-size:8.5pt;color:#374151;line-height:1.5;margin-bottom:1.5px;}
        .sm{font-size:9pt;color:#374151;line-height:1.65;padding:8px 10px;background:#f5f3ff;border-left:3px solid #6366f1;border-radius:0 3px 3px 0;margin-bottom:12px;}
        .ch{display:inline-block;background:#ede9fe;color:#6366f1;font-size:7.5pt;padding:1px 6px;border-radius:3px;margin:1px;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`,
      "corporate": `
        body{font-family:'Times New Roman',serif;font-size:10pt;color:#000;margin:0;}
        .wrap{max-width:760px;margin:0 auto;padding:28px 38px;}
        .hd{text-align:center;border-bottom:2px solid #1e3a5f;padding-bottom:10px;margin-bottom:14px;}
        .name{font-size:21pt;font-weight:700;color:#1e3a5f;}
        .title{font-size:10.5pt;font-style:italic;color:#1e3a5f;margin:3px 0 6px;}
        .ci{font-size:8pt;color:#444;display:flex;justify-content:center;gap:14px;flex-wrap:wrap;}
        .mt{font-size:9.5pt;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #1e3a5f;padding-bottom:2px;margin:12px 0 6px;}
        .jt{font-weight:700;font-size:9.5pt;}
        .co{font-weight:600;}
        .du{font-size:8.5pt;color:#555;float:right;}
        li{font-size:9pt;line-height:1.5;margin-bottom:1.5px;}
        .sm{font-size:9pt;line-height:1.6;margin-bottom:10px;}
        .skills-row{font-size:9pt;margin-bottom:3px;}
        .ch{display:inline-block;font-size:8.5pt;margin-right:12px;}
        .clearfix::after{content:'';display:table;clear:both;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`,
      "executive": `
        body{font-family:Georgia,serif;font-size:9.5pt;color:#1c1c1c;margin:0;}
        .wrap{max-width:760px;margin:0 auto;padding:26px 36px;}
        .hd{border-left:4px solid #92400e;padding-left:14px;margin-bottom:16px;}
        .name{font-size:23pt;font-weight:700;letter-spacing:-1px;line-height:1;}
        .title{font-size:11pt;color:#92400e;font-weight:400;margin:4px 0 6px;letter-spacing:0.5px;}
        .ci{font-size:7.5pt;color:#666;display:flex;gap:12px;flex-wrap:wrap;}
        .tl{font-size:9.5pt;color:#555;font-style:italic;line-height:1.6;margin:10px 0;padding:8px 12px;border:1px solid #d6b896;background:#fdf8f3;border-radius:3px;}
        .mt{font-size:8.5pt;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:2.5px;margin:14px 0 6px;border-bottom:1px solid #d6b896;padding-bottom:3px;}
        .jt{font-weight:700;font-size:9.5pt;color:#1c1c1c;}
        .co{color:#92400e;}
        .du{font-size:8pt;color:#888;float:right;}
        li{font-size:9pt;line-height:1.55;margin-bottom:2px;}
        .skills-row{font-size:9pt;margin-bottom:3px;}
        .ch{display:inline-block;border:1px solid #d6b896;padding:1px 7px;font-size:8pt;color:#92400e;margin:2px;border-radius:2px;}
        .clearfix::after{content:'';display:table;clear:both;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`,
      "creative": `
        body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:9pt;color:#1a1a1a;margin:0;}
        .hd{background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;padding:24px 30px;}
        .name{font-size:25pt;font-weight:900;letter-spacing:-1.5px;color:white;}
        .title{font-size:11pt;color:rgba(255,255,255,0.85);font-weight:300;margin:3px 0 7px;letter-spacing:2px;text-transform:uppercase;}
        .ci{font-size:8pt;color:rgba(255,255,255,0.8);display:flex;gap:12px;flex-wrap:wrap;}
        .bd{padding:22px 30px;}
        .mt{font-size:10pt;font-weight:900;color:#7c3aed;margin:14px 0 7px;display:flex;align-items:center;gap:7px;}
        .mt::after{content:'';flex:1;height:1.5px;background:linear-gradient(90deg,#7c3aed25,transparent);}
        .jt{font-weight:800;font-size:9.5pt;color:#1a1a1a;}
        .co{color:#7c3aed;font-weight:600;font-size:9pt;}
        .du{font-size:7.5pt;color:#9ca3af;}
        li{font-size:8.5pt;color:#374151;line-height:1.5;margin-bottom:2px;}
        .sm{font-size:9pt;line-height:1.65;color:#374151;padding:8px 10px;background:#faf5ff;border-radius:6px;margin-bottom:12px;}
        .st{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;}
        .sg{background:#f3e8ff;color:#7c3aed;padding:2px 9px;border-radius:999px;font-size:8pt;font-weight:600;}
        .ch{display:inline-block;border:1.5px solid #c4b5fd;color:#7c3aed;padding:1px 9px;font-size:7.5pt;border-radius:999px;margin:2px;}
        @media print{
          body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          .hd{background:none !important;background-color:transparent !important;color:#7c3aed !important;border-bottom:2px solid #7c3aed !important;padding:16px 0 !important;}
          .name{color:#7c3aed !important;}
          .title{color:#a855f7 !important;}
          .ci{color:#4b5563 !important;}
        }`,
      "fresher": `
        body{font-family:'Segoe UI',Arial,sans-serif;font-size:9.5pt;color:#1f2937;margin:0;}
        .wrap{max-width:760px;margin:0 auto;padding:22px 30px;}
        .hd{text-align:center;background:#ecfdf5;border:2px solid #059669;border-radius:8px;padding:14px;margin-bottom:14px;}
        .name{font-size:20pt;font-weight:800;color:#064e3b;}
        .title{font-size:9.5pt;color:#059669;font-weight:600;margin:2px 0 6px;}
        .ci{font-size:8pt;color:#374151;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;}
        .mt{display:inline-block;font-size:8.5pt;font-weight:700;color:#064e3b;text-transform:uppercase;letter-spacing:1.5px;background:#ecfdf5;padding:2px 8px;border-radius:4px;margin:10px 0 6px;}
        .ec{background:#f0fdf4;border:1px solid #a7f3d0;border-radius:6px;padding:8px 10px;margin-bottom:6px;}
        .jt{font-weight:700;font-size:9.5pt;color:#064e3b;}
        .co{color:#059669;font-size:9pt;}
        .du{font-size:7.5pt;color:#9ca3af;float:right;}
        li{font-size:8.5pt;color:#374151;line-height:1.45;margin-bottom:2px;}
        .sm{font-size:9pt;line-height:1.6;margin-bottom:10px;}
        .skills-row{font-size:9pt;margin-bottom:3px;}
        .ch{display:inline-block;background:#d1fae5;border:1px solid #6ee7b7;color:#065f46;padding:2px 7px;border-radius:3px;font-size:7.5pt;margin:2px;}
        .clearfix::after{content:'';display:table;clear:both;}
        @media print{
          body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          .hd{background:transparent !important;border:2px solid #059669 !important;padding:12px !important;}
          .ec{background:transparent !important;border:1px solid #6ee7b7 !important;}
        }`,
      "startup": `
        body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:9pt;color:#111;margin:0;}
        .wrap{max-width:760px;margin:0 auto;padding:20px 28px;}
        .hd{border-bottom:3px solid #111;padding-bottom:10px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:8px;}
        .nb .name{font-size:24pt;font-weight:900;letter-spacing:-1.5px;color:#111;line-height:1;}
        .nb .title{font-size:10pt;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:3px;}
        .cb{font-size:7.5pt;color:#555;text-align:right;line-height:1.5;}
        .sm{font-size:9pt;line-height:1.6;padding:7px 9px;background:#fff5f5;border-left:3px solid #dc2626;margin-bottom:10px;}
        .mt{font-size:7.5pt;font-weight:900;letter-spacing:2.5px;text-transform:uppercase;color:#111;border-top:1.5px solid #111;padding-top:3px;margin:12px 0 6px;}
        .jt{font-weight:900;font-size:9.5pt;}
        .co{color:#dc2626;font-weight:700;}
        .du{font-size:7.5pt;color:#888;float:right;}
        li{font-size:8.5pt;line-height:1.5;margin-bottom:2px;}
        .st{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;}
        .sg{background:#111;color:white;padding:2px 8px;font-size:7.5pt;font-weight:700;border-radius:2px;}
        .pn{font-weight:900;font-size:9.5pt;text-transform:uppercase;letter-spacing:0.5px;}
        .pt{font-size:7.5pt;color:#dc2626;font-weight:700;}
        .skills-row{font-size:8.5pt;margin-bottom:3px;}
        .ch{display:inline-block;border:1.5px solid #111;padding:1px 6px;font-size:7.5pt;font-weight:700;margin:2px;}
        .clearfix::after{content:'';display:table;clear:both;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`
    };

    const buildContent = () => {
      if (!resume) return "";
      const r = resume;

      const formatAch = (s: string) => {
        const idx = s.indexOf(":");
        return idx !== -1 ? `<strong>${s.slice(0, idx)}</strong>:${s.slice(idx + 1)}` : s;
      };

      const renderSectionHTML = (sec: string) => {
        const s = sec.toLowerCase();

        if (s.includes("summary") && r.summary) {
          return template === "executive"
            ? `<div class="tl">${r.summary}</div>`
            : `<div class="sm">${r.summary}</div>`;
        }

        if (s.includes("education") && r.education?.length) {
          return `
            <div class="mt">Education</div>
            ${r.education.map(e => `
              <div class="edu-block" style="margin-bottom:8px">
                <div class="jh">
                  <div><span class="jt">${e.degree}</span>${e.institution ? ` · <span class="co">${e.institution}</span>` : ""}</div>
                  ${e.year || e.gpa ? `<span class="du">${[e.year, e.gpa && `GPA: ${e.gpa}`].filter(Boolean).join(" · ")}</span>` : ""}
                </div>
                ${e.relevant ? `<div style="font-size:8pt;color:#4b5563;margin-top:2px;"><strong>Relevant Coursework: </strong>${e.relevant}</div>` : ""}
              </div>
            `).join("")}
          `;
        }

        if (s.includes("project") && r.projects?.length) {
          return `
            <div class="mt">Projects</div>
            ${r.projects.map(p => `
              <div class="proj-block" style="margin-bottom:12px">
                <div class="jh">
                  <div><span class="jt">${p.title || p.name}</span>${p.tech ? ` <span style="font-size:8pt;font-weight:normal;color:#4b5563;font-style:italic;">| ${p.tech}</span>` : ""}</div>
                  ${p.link ? `<span class="du">${p.link}</span>` : ""}
                </div>
                <ul style="padding-left:14px;margin-top:3px">${p.bullets.map(b => `<li style="margin-bottom:3px;">${b}</li>`).join("")}</ul>
              </div>
            `).join("")}
          `;
        }

        if (s.includes("experience") && r.experience?.length) {
          return `
            <div class="mt">Experience</div>
            ${r.experience.map(e => `
              <div class="exp-block" style="margin-bottom:12px">
                <div class="jh">
                  <div><span class="jt">${e.role}</span>${(e.organization || e.company) ? ` · <span class="co">${e.organization || e.company}</span>` : ""}</div>
                  <span class="du">${[e.dates || e.duration, e.location].filter(Boolean).join(" · ")}</span>
                </div>
                <ul style="padding-left:14px;margin-top:3px">${e.bullets.map(b => `<li style="margin-bottom:3px;">${b}</li>`).join("")}</ul>
              </div>
            `).join("")}
          `;
        }

        if (s.includes("skill")) {
          const cat = r.skills_categorized || {};
          const categories = [
            { label: "Programming Languages", items: cat.Languages || r.skills?.languages || [] },
            { label: "Frameworks & Web", items: cat.Frameworks || r.skills?.frameworks || [] },
            { label: "AI, ML & GenAI", items: cat["AI & ML"] || cat.AI || r.skills?.concepts || [] },
            { label: "Developer Tools", items: cat.Tools || r.skills?.tools || [] },
            { label: "Cloud & Databases", items: cat.Cloud || r.skills?.databases || [] },
            { label: "Core Fundamentals", items: cat["Core Fundamentals"] || cat.Fundamentals || [] },
          ].filter(c => c.items && c.items.length > 0);

          if (!categories.length) return "";

          return `
            <div class="mt">Technical Skills</div>
            <div style="margin-bottom:8px">
              ${categories.map(c => `<div class="skills-row"><strong>${c.label}: </strong>${c.items.join(", ")}</div>`).join("")}
            </div>
          `;
        }

        if (s.includes("cert") && r.certifications?.length) {
          return `
            <div class="mt">Certifications</div>
            <div style="margin-bottom:6px">${r.certifications.map(cert => `<span class="ch">• ${cert}</span>`).join("")}</div>
          `;
        }

        if (s.includes("achieve") && r.achievements?.length) {
          return `
            <div class="mt">Key Focus & Academic Initiatives</div>
            <ul style="padding-left:14px;margin-top:2px">${r.achievements.map(a => `<li>${formatAch(a)}</li>`).join("")}</ul>
          `;
        }

        return "";
      };

      // Order of sections: dynamically driven by r.sections_in_order
      const order = r.sections_in_order && r.sections_in_order.length > 0
        ? r.sections_in_order
        : ["Education", "Skills", "Projects", "Achievements"];

      if (template === "modern-tech") {
        const cat = r.skills_categorized || {};
        const categories = [
          { label: "Languages", items: cat.Languages || r.skills?.languages || [] },
          { label: "Frameworks", items: cat.Frameworks || r.skills?.frameworks || [] },
          { label: "AI & ML", items: cat["AI & ML"] || cat.AI || r.skills?.concepts || [] },
          { label: "Tools", items: cat.Tools || r.skills?.tools || [] },
          { label: "Cloud & DB", items: cat.Cloud || r.skills?.databases || [] },
          { label: "Fundamentals", items: cat["Core Fundamentals"] || cat.Fundamentals || [] },
        ].filter(c => c.items && c.items.length > 0);

        return `
          <div class="wrap">
            <div class="sidebar">
              <div class="name">${r.name}</div>
              <div class="title">${r.title}</div>
              ${[r.email && `✉ ${r.email}`, r.phone && `📱 ${r.phone}`, r.location && `📍 ${r.location}`, r.linkedin && `🔗 ${r.linkedin}`, r.github && `⌨ ${r.github}`].filter(Boolean).map(ci => `<div class="ci">${ci}</div>`).join("")}
              ${categories.map(s => `
                <div class="st">${s.label}</div>
                ${s.items.map(sk => `<div class="sk">• ${sk}</div>`).join("")}
              `).join("")}
              ${r.certifications?.length ? `<div class="st">Certifications</div>${r.certifications.map(cert => `<div class="sk" style="font-size:7.5pt">🏆 ${cert}</div>`).join("")}` : ""}
            </div>
            <div class="main">
              ${r.summary ? `<div class="sm">${r.summary}</div>` : ""}
              ${order.filter(sec => !sec.toLowerCase().includes("skill") && !sec.toLowerCase().includes("cert") && !sec.toLowerCase().includes("summary")).map(sec => renderSectionHTML(sec)).join("")}
            </div>
          </div>
        `;
      }

      const contactItems = [r.email && `✉ ${r.email}`, r.phone && `📱 ${r.phone}`, r.location && `📍 ${r.location}`, r.linkedin && `🔗 ${r.linkedin}`, r.github && `⌨ ${r.github}`].filter(Boolean);

      return `
        <div class="wrap">
          <div class="hd">
            <div class="name">${r.name}</div>
            ${r.title ? `<div class="title" style="margin-bottom:3px;">${r.title}</div>` : ""}
            <div class="ci">${contactItems.join(" &nbsp;|&nbsp; ")}</div>
          </div>
          ${order.map(sec => renderSectionHTML(sec)).join("")}
        </div>
      `;
    };

    const a4Base = `@page{size:A4;margin:14mm 16mm;}html,body{width:210mm;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.exp-block,.proj-block,.edu-block{page-break-inside:avoid;}ul{page-break-inside:avoid;}`;
    win.document.write(`<!DOCTYPE html><html><head><title>${resume.name} — Resume</title><style>*{margin:0;padding:0;box-sizing:border-box;} ul{padding-left:14px;} .clearfix::after{content:'';display:table;clear:both;} ${a4Base} ${css[template] || css["ats-classic"]}</style></head><body>${buildContent()}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06030f", color: "white", fontFamily: "-apple-system,sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        textarea:focus,input:focus,select:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.4);border-radius:2px;}
      `}</style>

      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366f1,#a855f7)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📄</div>
          <span style={{ fontWeight: 800, background: "linear-gradient(135deg,#fff,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>COGNALYZE</span>
          <span style={{ fontSize: 10, padding: "2px 8px", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 20, color: "rgba(99,102,241,0.8)" }}>RESUME BUILDER</span>
        </div>
        <a href="/" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none", fontSize: 13 }}>← Back</a>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "3rem 2rem" }}>

        {/* INPUT */}
        {step === "input" && (
          <div style={{ animation: "fadeUp 0.6s ease" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: "rgba(99,102,241,0.8)", marginBottom: 10, fontWeight: 600 }}>AI RESUME BUILDER</div>
              <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: -2, lineHeight: 1.1, marginBottom: 10, background: "linear-gradient(135deg,#fff 30%,#a5b4fc 60%,#ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                True ATS Compliance.<br />Recruiter Verified Quality.
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Grounded strictly in your background — zero fake metrics, zero buzzwords, 100% interview-defensible.</p>
            </div>

            {/* Template selector */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.4)", marginBottom: 12, fontWeight: 600 }}>SELECT TEMPLATE (7 STYLES)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10, marginBottom: 12 }}>
                {TEMPLATES.map(t => <TemplateThumb key={t.id} t={t} selected={template === t.id} onClick={() => setTemplate(t.id)} />)}
              </div>

              {template === "modern-tech" && (
                <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#a5b4fc" }}>
                  <span>🏷️</span>
                  <span><strong>Modern Tech Advisory:</strong> Features a visual sidebar panel ideal for direct human recruiter review, referrals, and portfolio applications. For blind automated ATS corporate portals, <strong>ATS Classic</strong> is recommended.</span>
                </div>
              )}
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2rem", marginBottom: 14 }}>
              
              {/* Target role, experience, and category */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#6366f1", marginBottom: 8, fontWeight: 700 }}>TARGET ROLE *</div>
                  <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Senior ML Engineer at Google" style={{ width: "100%", padding: "11px 14px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, color: "white", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.2)"} />
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#a855f7", marginBottom: 8, fontWeight: 700 }}>YEARS OF EXPERIENCE</div>
                  <input value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 3 years or Final Year Student" style={{ width: "100%", padding: "11px 14px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, color: "white", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#a855f7"} onBlur={e => e.target.style.borderColor = "rgba(168,85,247,0.2)"} />
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#38bdf8", marginBottom: 8, fontWeight: 700 }}>CAREER STAGE / CATEGORY</div>
                  <select
                    value={category}
                    onChange={e => { setCategory(e.target.value); setAmbiguousAlert(false); }}
                    style={{ width: "100%", padding: "11px 14px", background: "rgba(56,189,248,0.06)", border: ambiguousAlert ? "2px solid #ef4444" : "1px solid rgba(56,189,248,0.2)", borderRadius: 12, color: "white", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none", cursor: "pointer" }}
                  >
                    <option value="auto" style={{ background: "#0f172a", color: "white" }}>⚡ Auto-Detect (Recruiter Analysis)</option>
                    <option value="fresher" style={{ background: "#0f172a", color: "white" }}>🎓 Fresher / Student (Education & Projects prioritized)</option>
                    <option value="1-3years" style={{ background: "#0f172a", color: "white" }}>🚀 1-3 Years Experience (Experience & Projects balanced)</option>
                    <option value="senior" style={{ background: "#0f172a", color: "white" }}>💼 3+ Years / Senior (Experience prioritized, no fluff)</option>
                    <option value="career-switcher" style={{ background: "#0f172a", color: "white" }}>🔄 Career Switcher (Transferable skills elevated)</option>
                  </select>
                </div>
              </div>

              {ambiguousAlert && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, padding: "12px 16px", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: 10, color: "#fca5a5", fontSize: 13 }}>
                  <span>⚠️</span>
                  <span><strong>Recruiter Check:</strong> Your career stage could not be determined unambiguously. Please select your specific <strong>Career Stage</strong> above to apply the correct section hierarchy.</span>
                </div>
              )}

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#00ff88", marginBottom: 8, fontWeight: 700 }}>KEYWORDS (comma separated)</div>
                <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Python, Machine Learning, AWS, React, System Design, Docker, PostgreSQL..." style={{ width: "100%", padding: "11px 14px", background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 12, color: "white", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#00ff88"} onBlur={e => e.target.style.borderColor = "rgba(0,255,136,0.2)"} />
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 5 }}>💡 Target keywords are incorporated naturally only where truthfully applicable to your background</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#38bdf8", marginBottom: 8, fontWeight: 700 }}>LINKEDIN ACCOUNT</div>
                  <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="e.g. linkedin.com/in/username" style={{ width: "100%", padding: "11px 14px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 12, color: "white", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#38bdf8"} onBlur={e => e.target.style.borderColor = "rgba(56,189,248,0.2)"} />
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#94a3b8", marginBottom: 8, fontWeight: 700 }}>GITHUB ACCOUNT</div>
                  <input value={github} onChange={e => setGithub(e.target.value)} placeholder="e.g. github.com/username" style={{ width: "100%", padding: "11px 14px", background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, color: "white", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#94a3b8"} onBlur={e => e.target.style.borderColor = "rgba(148,163,184,0.2)"} />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#fbbf24", marginBottom: 8, fontWeight: 700 }}>CERTIFICATIONS (comma separated)</div>
                <input value={certifications} onChange={e => setCertifications(e.target.value)} placeholder="e.g. AWS Solutions Architect, Google Cloud Professional Data Engineer" style={{ width: "100%", padding: "11px 14px", background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, color: "white", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#fbbf24"} onBlur={e => e.target.style.borderColor = "rgba(251,191,36,0.2)"} />
              </div>

              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#ec4899", marginBottom: 8, fontWeight: 700 }}>YOUR BACKGROUND * — be detailed for best results</div>
                <textarea value={background} onChange={e => setBackground(e.target.value)} rows={8} placeholder={`Example:\nName: Priya Sharma. CS student at IIT Delhi, 3rd year. Interned at Flipkart — built recommendation engine, increased CTR by 18%. Built AI chatbot used by 5000+ college students. Won TechFest IIT Bombay 2024 (national hackathon). Skills: Python, ML, React, SQL. Applying for ML Engineer roles at FAANG companies.`} style={{ width: "100%", background: "rgba(236,72,153,0.05)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 14, padding: 14, color: "rgba(255,255,255,0.85)", fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#ec4899"} onBlur={e => e.target.style.borderColor = "rgba(236,72,153,0.2)"} />
              </div>
            </div>

            {/* AI capabilities */}
            <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)", borderRadius: 14, padding: "1.1rem 1.4rem", marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#00ff88", marginBottom: 10, fontWeight: 600 }}>AI OPTIMIZES AUTOMATICALLY</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
                {[
                  "Highlights metrics you provide — never invents numbers",
                  "Injects all keywords naturally throughout",
                  "Uses precise, accurate action verbs matched to what you actually did",
                  "Removes weak phrases that fail ATS",
                  "Optimizes section order for your role & career stage",
                  "7 ATS & recruiter-tailored templates"
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ color: "#00ff88", fontSize: 11, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && <p style={{ color: "#ff4466", textAlign: "center", marginBottom: 12, fontSize: 13 }}>⚠ {error}</p>}

            <button onClick={build} disabled={!targetRole || !background} style={{ width: "100%", padding: "1rem", borderRadius: 14, border: "none", background: !targetRole || !background ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7)", color: "white", fontSize: 15, fontWeight: 800, letterSpacing: 3, cursor: !targetRole || !background ? "not-allowed" : "pointer", opacity: !targetRole || !background ? 0.4 : 1, boxShadow: targetRole && background ? "0 0 50px rgba(99,102,241,0.3)" : "none", transition: "all 0.3s" }}>
              ✨ BUILD MY RESUME →
            </button>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "8rem 0" }}>
            <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 2rem" }}>
              <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(99,102,241,0.2)", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <div style={{ position: "absolute", inset: 14, border: "2px solid rgba(168,85,247,0.15)", borderBottom: "2px solid #a855f7", borderRadius: "50%", animation: "spin 0.7s linear infinite reverse" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✨</div>
            </div>
            <div style={{ fontSize: 14, letterSpacing: 3, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Building your recruiter-defensible resume...</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Applying 50-year FAANG screening rules · Enforcing truthful metrics · Structuring for {template}</div>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && resume && (
          <div style={{ animation: "fadeUp 0.6s ease" }}>
            {/* Stats bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.8rem", fontWeight: 900, color: resume.ats_score >= 85 ? "#00ff88" : "#fbbf24", lineHeight: 1 }}>{resume.ats_score}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 2 }}>ATS SCORE</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ padding: "4px 12px", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 999, fontSize: 12, color: "#00ff88", fontWeight: 600 }}>
                    {resume.keywords_matched?.length || 0} keywords matched
                  </div>
                  <div style={{ padding: "4px 12px", background: `${tpl.accent}15`, border: `1px solid ${tpl.accent}30`, borderRadius: 999, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                    {tpl.name} template {resume.category ? `· ${resume.category.toUpperCase()}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep("input")} style={{ padding: "0.7rem 1.5rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13 }}>↺ Rebuild</button>
                <button onClick={downloadPDF} style={{ padding: "0.7rem 1.75rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}>
                  ↓ Download PDF
                </button>
              </div>
            </div>

            {/* Improvements */}
            {resume.improvements?.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: "0.8rem 1.2rem", marginBottom: "1.2rem", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 9, color: "rgba(99,102,241,0.8)", fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>FAANG RECRUITER VERIFIED:</span>
                {resume.improvements.map((imp, i) => <span key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: "#a5b4fc" }}>✓</span> {imp}</span>)}
              </div>
            )}

            {/* Advanced AI Quality Metrics Dashboard */}
            {resume.advanced_metrics && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "2rem" }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#a5b4fc", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📊</span> Advanced AI Resume Quality Analytics
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                  {[
                    { label: "Recruiter Attention Score", key: "recruiter_attention", desc: "First 6-10 sec scan speed, visual flow, and layout optimization." },
                    { label: "Skill Credibility Score", key: "skill_credibility", desc: "Technical skill evidence and validation density." },
                    { label: "Achievement Impact Score", key: "achievement_impact", desc: "STAR/XYZ formatted metrics and outcome orientation." },
                    { label: "Content Quality Score", key: "content_quality", desc: "Grammar, spelling, and precision action verbs usage." },
                    { label: "Personal Branding Score", key: "personal_branding", desc: "Professional summary value proposition & profile presence." },
                    { label: "Design Quality Score", key: "design_quality", desc: "Consistent formatting, typography cohesion, and structure." },
                    { label: "Interview Readiness Score", key: "interview_readiness", desc: "How effectively content prepares for technical questioning." },
                    { label: "Trust Score", key: "trust_score", desc: "Fact grounding authenticity level (no fake exaggeration)." },
                    { label: "Resume DNA Score", key: "resume_dna_score", desc: "Role suitability rating mapped to industry career progressions." },
                  ].map((m) => {
                    const score = resume.advanced_metrics?.[m.key as keyof typeof resume.advanced_metrics] ?? 0;
                    const color = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={m.key} style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{m.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color }}>{score}%</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                            <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 2 }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.3 }}>{m.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Preview — A4 proportions */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
              <div style={{ width: 794, minHeight: 1123, background: "white", color: "#1a1a1a", borderRadius: 4, boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)", overflow: "hidden", fontFamily: template === "corporate" || template === "executive" || template === "ats-classic" ? "'Georgia',serif" : "'Segoe UI',Arial,sans-serif", fontSize: "9.5pt", lineHeight: 1.4, transformOrigin: "top center" }}>

              {/* ATS Classic — Harvard style */}
              {template === "ats-classic" && (
                <div style={{ padding: "36px 44px" }}>
                  <div style={{ textAlign: "center", marginBottom: 16, borderBottom: "1.5px solid #111827", paddingBottom: 10 }}>
                    <div style={{ fontSize: "20pt", fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{resume.name}</div>
                    {resume.title && <div style={{ fontSize: "10pt", fontWeight: 600, color: "#374151", marginBottom: 6 }}>{resume.title}</div>}
                    <div style={{ fontSize: "8.5pt", color: "#4b5563", display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                      {[resume.email && `✉ ${resume.email}`, resume.phone && `📱 ${resume.phone}`, resume.location && `📍 ${resume.location}`, resume.linkedin && `🔗 ${resume.linkedin}`, resume.github && `⌨ ${resume.github}`].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}
                    </div>
                  </div>
                  <PreviewContent resume={resume} accent="#111827" template={template} />
                </div>
              )}

              {/* Modern Tech — sidebar layout */}
              {template === "modern-tech" && (() => {
                const cat = resume.skills_categorized || {};
                const categories = [
                  { label: "Languages", items: cat.Languages || resume.skills?.languages || [] },
                  { label: "Frameworks", items: cat.Frameworks || resume.skills?.frameworks || [] },
                  { label: "AI & ML", items: cat["AI & ML"] || cat.AI || resume.skills?.concepts || [] },
                  { label: "Tools", items: cat.Tools || resume.skills?.tools || [] },
                  { label: "Cloud & DB", items: cat.Cloud || resume.skills?.databases || [] },
                  { label: "Fundamentals", items: cat["Core Fundamentals"] || cat.Fundamentals || [] },
                ].filter(s => s.items && s.items.length > 0);

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: 1123, width: "100%", height: "100%" }}>
                    <div style={{ background: "#1e1b4b", color: "white", padding: "30px 20px", display: "flex", flexDirection: "column" }}>
                      <div style={{ fontSize: "17pt", fontWeight: 800, color: "white", letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 4 }}>{resume.name}</div>
                      <div style={{ fontSize: "9.5pt", color: "#a5b4fc", fontWeight: 500, marginBottom: 18 }}>{resume.title}</div>
                      {[resume.email, resume.phone, resume.location, resume.linkedin, resume.github].filter(Boolean).map((c, i) => <div key={i} style={{ fontSize: "8pt", color: "#c7d2fe", marginBottom: 5, wordBreak: "break-all" }}>{c}</div>)}
                      {categories.map(s => (
                        <div key={s.label} style={{ marginTop: 14 }}>
                          <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: 1.5, borderBottom: "1px solid rgba(165,180,252,0.25)", paddingBottom: 3, marginBottom: 6 }}>{s.label}</div>
                          {s.items.map((sk, i) => <div key={i} style={{ fontSize: "8pt", color: "#e0e7ff", marginBottom: 2.5 }}>• {sk}</div>)}
                        </div>
                      ))}
                      {resume.certifications?.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: 2, borderBottom: "1px solid rgba(165,180,252,0.25)", paddingBottom: 3, marginBottom: 8 }}>Certifications</div>
                          {resume.certifications.map((c, i) => <div key={i} style={{ fontSize: "7.5pt", color: "#e0e7ff", marginBottom: 3 }}>🏆 {c}</div>)}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "30px 32px" }}>
                      <PreviewContent resume={resume} accent="#6366f1" template={template} />
                    </div>
                  </div>
                );
              })()}

              {/* Creative — gradient header */}
              {template === "creative" && (
                <>
                  <div style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "white", padding: "26px 32px" }}>
                    <div style={{ fontSize: "25pt", fontWeight: 900, letterSpacing: -2, color: "white" }}>{resume.name}</div>
                    <div style={{ fontSize: "11pt", color: "rgba(255,255,255,0.8)", fontWeight: 300, margin: "3px 0 8px", letterSpacing: 2, textTransform: "uppercase" }}>{resume.title}</div>
                    <div style={{ fontSize: "8pt", color: "rgba(255,255,255,0.7)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {[resume.email && `✉ ${resume.email}`, resume.phone && `📱 ${resume.phone}`, resume.location && `📍 ${resume.location}`, resume.linkedin && `🔗 ${resume.linkedin}`, resume.github && `⌨ ${resume.github}`].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}
                    </div>
                  </div>
                  <div style={{ padding: "24px 32px" }}>
                    <PreviewContent resume={resume} accent="#7c3aed" template={template} />
                  </div>
                </>
              )}

              {/* Fresher — card header */}
              {template === "fresher" && (
                <div style={{ padding: "24px 32px" }}>
                  <div style={{ textAlign: "center", background: "#ecfdf5", border: "2px solid #059669", borderRadius: 10, padding: 18, marginBottom: 18 }}>
                    <div style={{ fontSize: "21pt", fontWeight: 800, color: "#064e3b" }}>{resume.name}</div>
                    <div style={{ fontSize: "10pt", color: "#059669", fontWeight: 600, margin: "3px 0 7px" }}>{resume.title}</div>
                    <div style={{ fontSize: "8pt", color: "#374151", display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                      {[resume.email && `✉ ${resume.email}`, resume.phone && `📱 ${resume.phone}`, resume.location && `📍 ${resume.location}`, resume.linkedin && `🔗 ${resume.linkedin}`, resume.github && `⌨ ${resume.github}`].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}
                    </div>
                  </div>
                  <PreviewContent resume={resume} accent="#059669" template={template} />
                </div>
              )}

              {/* Startup — bold header */}
              {template === "startup" && (
                <div style={{ padding: "22px 30px" }}>
                  <div style={{ borderBottom: "3.5px solid #111", paddingBottom: 12, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: "25pt", fontWeight: 900, letterSpacing: -2, color: "#111", lineHeight: 1 }}>{resume.name}</div>
                      <div style={{ fontSize: "10.5pt", color: "#dc2626", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>{resume.title}</div>
                    </div>
                    <div style={{ fontSize: "8pt", color: "#555", textAlign: "right", lineHeight: 1.6 }}>
                      {[resume.email && `✉ ${resume.email}`, resume.phone && `📱 ${resume.phone}`, resume.location && `📍 ${resume.location}`, resume.linkedin && `🔗 ${resume.linkedin}`, resume.github && `⌨ ${resume.github}`].filter(Boolean).map((c, i) => <div key={i}>{c}</div>)}
                    </div>
                  </div>
                  <PreviewContent resume={resume} accent="#dc2626" template={template} />
                </div>
              )}

              {/* Corporate & Executive */}
              {(template === "corporate" || template === "executive") && (
                <div style={{ padding: template === "executive" ? "30px 40px" : "32px 40px" }}>
                  {template === "executive" ? (
                    <div style={{ borderLeft: "4px solid #92400e", paddingLeft: 16, marginBottom: 18 }}>
                      <div style={{ fontSize: "24pt", fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>{resume.name}</div>
                      <div style={{ fontSize: "11.5pt", color: "#92400e", fontWeight: 400, margin: "4px 0 7px", letterSpacing: 0.5 }}>{resume.title}</div>
                      <div style={{ fontSize: "7.5pt", color: "#666", display: "flex", gap: 14, flexWrap: "wrap" }}>{[resume.email && `✉ ${resume.email}`, resume.phone && `📱 ${resume.phone}`, resume.location && `📍 ${resume.location}`, resume.linkedin && `🔗 ${resume.linkedin}`, resume.github && `⌨ ${resume.github}`].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}</div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", borderBottom: "2px solid #1e3a5f", paddingBottom: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: "21pt", fontWeight: 700, color: "#1e3a5f" }}>{resume.name}</div>
                      <div style={{ fontSize: "10.5pt", fontStyle: "italic", color: "#1e3a5f", margin: "3px 0 6px" }}>{resume.title}</div>
                      <div style={{ fontSize: "8pt", color: "#444", display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>{[resume.email && `✉ ${resume.email}`, resume.phone && `📱 ${resume.phone}`, resume.location && `📍 ${resume.location}`, resume.linkedin && `🔗 ${resume.linkedin}`, resume.github && `⌨ ${resume.github}`].filter(Boolean).map((c, i) => <span key={i}>{c}</span>)}</div>
                    </div>
                  )}
                  <PreviewContent resume={resume} accent={template === "executive" ? "#92400e" : "#1e3a5f"} template={template} />
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewContent({ resume, accent, template }: { resume: ResumeData; accent: string; template: string }) {
  const isCreative = template === "creative";
  const isStartup = template === "startup";
  const isMT = template === "modern-tech";

  const formatAch = (s: string) => {
    const idx = s.indexOf(":");
    return idx !== -1 ? (
      <span>
        <strong>{s.slice(0, idx)}</strong>:{s.slice(idx + 1)}
      </span>
    ) : (
      s
    );
  };

  const SecTitle = ({ children }: { children: string }) => (
    <div style={{ fontSize: isStartup ? "7.5pt" : isMT ? "9pt" : isCreative ? "10pt" : "9.5pt", fontWeight: isStartup ? 900 : 700, color: accent, textTransform: "uppercase", letterSpacing: isStartup ? 3 : isCreative ? 0.5 : 1.5, borderBottom: isCreative ? "none" : isStartup ? `1.5px solid #111` : `1px solid ${accent}30`, paddingBottom: isCreative ? 0 : 3, margin: `${isStartup ? 12 : 14}px 0 ${isStartup ? 6 : 8}px`, ...(isCreative ? { display: "flex", alignItems: "center", gap: 6 } : {}) }}>
      {children}
    </div>
  );

  const order = resume.sections_in_order && resume.sections_in_order.length > 0
    ? resume.sections_in_order
    : ["Education", "Projects", "Skills", "Experience", "Certifications", "Achievements"];

  const renderSection = (sec: string) => {
    const s = sec.toLowerCase();

    if (s.includes("summary") && resume.summary) {
      if (isMT) return null; // modern-tech displays summary in main
      return (
        <div key={sec} style={{ fontSize: "9pt", color: "#374151", lineHeight: 1.65, marginBottom: 12, padding: isCreative ? "10px 12px" : isStartup ? "8px 10px" : 0, background: isCreative ? "#faf5ff" : isStartup ? "#fff5f5" : "transparent", borderLeft: isStartup ? "3px solid #dc2626" : "none", borderRadius: isCreative ? 6 : 0 }}>
          {resume.summary}
        </div>
      );
    }

    if (s.includes("education") && resume.education?.length > 0) {
      return (
        <div key={sec} style={{ marginBottom: 14 }}>
          <SecTitle>Education</SecTitle>
          {resume.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "9.5pt", color: "#1a1a1a" }}>{e.degree}</span>
                  {e.institution && (
                    <>
                      <span style={{ color: "#6b7280", fontSize: "9pt" }}> · </span>
                      <span style={{ color: accent, fontSize: "9pt", fontWeight: 600 }}>{e.institution}</span>
                    </>
                  )}
                </div>
                {(e.year || e.gpa) && (
                  <span style={{ fontSize: "7.5pt", color: "#9ca3af" }}>{[e.year, e.gpa && `GPA: ${e.gpa}`].filter(Boolean).join(" · ")}</span>
                )}
              </div>
              {e.relevant && (
                <div style={{ fontSize: "8pt", color: "#4b5563", marginTop: 2 }}>
                  <strong>Relevant Coursework: </strong>{e.relevant}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (s.includes("project") && resume.projects?.length > 0) {
      return (
        <div key={sec} style={{ marginBottom: 14 }}>
          <SecTitle>Projects</SecTitle>
          {resume.projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 3 }}>
                <span style={{ fontWeight: isStartup ? 900 : 700, fontSize: isStartup ? "9.5pt" : "9.5pt", color: "#1a1a1a", textTransform: isStartup ? "uppercase" : "none", letterSpacing: isStartup ? 0.5 : 0 }}>{p.title || p.name}</span>
                {p.link && <span style={{ fontSize: "7.5pt", color: "#9ca3af", marginLeft: 6 }}>{p.link}</span>}
                {p.tech && <span style={{ fontSize: "8pt", color: "#6b7280", fontStyle: "italic", marginLeft: 6 }}>| {p.tech}</span>}
              </div>
              <ul style={{ paddingLeft: 14, margin: 0 }}>
                {p.bullets.map((b, j) => <li key={j} style={{ fontSize: "8.5pt", color: "#374151", lineHeight: 1.55, marginBottom: 3 }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    if (s.includes("experience") && resume.experience?.length > 0) {
      return (
        <div key={sec} style={{ marginBottom: 14 }}>
          <SecTitle>Experience</SecTitle>
          {resume.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", marginBottom: 3 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "9.5pt", color: "#1a1a1a" }}>{exp.role}</span>
                  {(exp.organization || exp.company) && (
                    <>
                      <span style={{ color: "#6b7280", fontSize: "9pt" }}> · </span>
                      <span style={{ color: accent, fontWeight: 600, fontSize: "9pt" }}>{exp.organization || exp.company}</span>
                    </>
                  )}
                </div>
                <span style={{ fontSize: "7.5pt", color: "#9ca3af" }}>{[exp.dates || exp.duration, exp.location].filter(Boolean).join(" · ")}</span>
              </div>
              <ul style={{ paddingLeft: 14, margin: 0 }}>
                {exp.bullets.map((b, j) => <li key={j} style={{ fontSize: "8.5pt", color: "#374151", lineHeight: 1.55, marginBottom: 3 }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    if (s.includes("skill") && !isMT) {
      const cat = resume.skills_categorized || {};
      const categories = [
        { label: "Programming Languages", items: cat.Languages || resume.skills?.languages || [] },
        { label: "Frameworks & Web", items: cat.Frameworks || resume.skills?.frameworks || [] },
        { label: "AI, ML & GenAI", items: cat["AI & ML"] || cat.AI || resume.skills?.concepts || [] },
        { label: "Developer Tools", items: cat.Tools || resume.skills?.tools || [] },
        { label: "Cloud & Databases", items: cat.Cloud || resume.skills?.databases || [] },
        { label: "Core Fundamentals", items: cat["Core Fundamentals"] || cat.Fundamentals || [] },
      ].filter(c => c.items && c.items.length > 0);

      if (!categories.length) return null;

      return (
        <div key={sec} style={{ marginBottom: 14 }}>
          <SecTitle>Technical Skills</SecTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {categories.map(c => (
              <div key={c.label} style={{ fontSize: "8.8pt", lineHeight: 1.5, color: "#374151" }}>
                <strong style={{ color: "#111827" }}>{c.label}: </strong>{c.items.join(", ")}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (s.includes("cert") && resume.certifications?.length > 0 && !isMT) {
      return (
        <div key={sec} style={{ marginBottom: 12 }}>
          <SecTitle>Certifications</SecTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {resume.certifications.map((cert, i) => (
              <span key={i} style={{ fontSize: "8pt", background: `${accent}10`, border: `1px solid ${accent}25`, borderRadius: 3, padding: "2px 8px", color: accent }}>{cert}</span>
            ))}
          </div>
        </div>
      );
    }

    if (s.includes("achieve") && resume.achievements?.length > 0) {
      return (
        <div key={sec} style={{ marginBottom: 14 }}>
          <SecTitle>Key Focus & Academic Initiatives</SecTitle>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {resume.achievements.map((a, i) => (
              <li key={i} style={{ fontSize: "8.8pt", color: "#374151", lineHeight: 1.55, marginBottom: 3 }}>
                {formatAch(a)}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* If modern-tech, summary displays at top of main */}
      {isMT && resume.summary && (
        <div style={{ fontSize: "9pt", color: "#374151", lineHeight: 1.65, padding: "8px 10px", background: "#f5f3ff", borderLeft: "3px solid #6366f1", borderRadius: "0 3px 3px 0", marginBottom: 12 }}>
          {resume.summary}
        </div>
      )}

      {/* Render sections in order */}
      {order.map(sec => renderSection(sec))}
    </>
  );
}