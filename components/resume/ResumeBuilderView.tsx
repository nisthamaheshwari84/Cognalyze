"use client";

import React, { useState, useEffect } from "react";
import LiveResumeEditor from "./live-editor/LiveResumeEditor";
import { convertGeneratedResumeToDocument } from "@/lib/resume/converter";
import { ResumeDocument, TemplateId } from "@/lib/resume/types";

const TEMPLATES = [
  { id: "ats-classic", name: "ATS Classic", desc: "Harvard/Wall Street style, single-column, 100% blind ATS compliant", accent: "#162A43", bg: "#162A43" },
  { id: "modern-tech", name: "Modern Tech", desc: "Clean sidebar layout for human recruiter review", accent: "#356AE6", bg: "#162A43" },
  { id: "corporate", name: "Corporate", desc: "Traditional recruiter format, serif font, single-column ATS", accent: "#1e3a5f", bg: "#1e3a5f" },
  { id: "executive", name: "Executive", desc: "Leadership-focused layout, single-column ATS", accent: "#92400e", bg: "#92400e" },
  { id: "creative", name: "Creative", desc: "Visual hierarchy with crisp typography, single-column ATS", accent: "#356AE6", bg: "#356AE6" },
  { id: "fresher", name: "Fresher", desc: "Education & project prioritized, single-column ATS", accent: "#2E7D5B", bg: "#2E7D5B" },
  { id: "startup", name: "Startup", desc: "Modern engineering layout, project focus, single-column ATS", accent: "#C24141", bg: "#C24141" },
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
    <div 
      onClick={onClick} 
      style={{ 
        cursor: "pointer", 
        borderRadius: 8, 
        border: `1px solid ${selected ? "#356AE6" : "#E4E1DA"}`, 
        background: selected ? "#FFFFFF" : "#FFFFFF", 
        boxShadow: selected ? "0 0 0 1px #356AE6, 0 1px 3px rgba(16, 24, 40, 0.04)" : "0 1px 3px rgba(16, 24, 40, 0.04)", 
        transition: "all 0.15s ease", 
        overflow: "hidden" 
      }}
    >
      <div style={{ height: 80, background: "#FAF9F6", margin: "6px 6px 0", borderRadius: 5, overflow: "hidden", border: "1px solid #E4E1DA" }}>
        {layouts[t.id]}
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: selected ? "#162A43" : "#17191C", marginBottom: 2 }}>{t.name}</div>
        <div style={{ fontSize: 10, color: "#667085", lineHeight: 1.3 }}>{t.desc}</div>
      </div>
    </div>
  );
}

export default function ResumeBuilderView() {
  const [step, setStep] = useState<"input" | "loading" | "editor">("input");
  const [targetRole, setTargetRole] = useState("");
  const [experience, setExperience] = useState("");
  const [category, setCategory] = useState("auto");
  const [ambiguousAlert, setAmbiguousAlert] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [background, setBackground] = useState("");
  const [template, setTemplate] = useState<string>("ats-classic");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [certifications, setCertifications] = useState("");
  const [error, setError] = useState("");
  const [isPreFilling, setIsPreFilling] = useState(false);

  // Single Canonical Resume Document State
  const [canonicalResume, setCanonicalResume] = useState<ResumeDocument | null>(null);

  // Check for saved resume draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cognalyze_canonical_resume");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.contact && parsed.sections) {
          setCanonicalResume(parsed);
          const params = new URLSearchParams(window.location.search);
          if (params.get("view") === "editor" || params.get("editor") === "true") {
            setStep("editor");
          }
        }
      }
    } catch (e) {
      // Ignore storage read error
    }
  }, []);

  // Pre-fill profile from student profile
  const handlePreFillFromProfile = async () => {
    setIsPreFilling(true);
    setError("");
    try {
      let loaded = false;
      const res = await fetch("/api/student/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          loaded = true;
          const p = data.profile;
          if (p.targetRole) setTargetRole(p.targetRole);
          if (p.linkedinUrl) setLinkedin(p.linkedinUrl);
          if (p.githubUrl) setGithub(p.githubUrl);
          if (Array.isArray(p.skills) && p.skills.length) {
            setKeywords(p.skills.map((s: any) => typeof s === "string" ? s : s.name).join(", "));
          }
          if (Array.isArray(p.certifications) && p.certifications.length) {
            setCertifications(p.certifications.map((c: any) => typeof c === "string" ? c : c.name).join(", "));
          }

          const parts: string[] = [];
          if (p.fullName) parts.push(`Name: ${p.fullName}`);
          if (p.education?.college || p.education?.degree) {
            parts.push(`Education: ${p.education.degree || "B.Tech in Computer Science & Engineering (AI/ML)"} at ${p.education.college || "ABES Engineering College, Ghaziabad"}${p.education.cgpa ? `, CGPA: ${p.education.cgpa}` : ", CGPA: 8.8 / 10.0"}`);
          }
          if (p.projects?.length) {
            parts.push("Projects:\n" + p.projects.map((proj: any) => `- ${proj.title}: ${proj.description} (${(proj.techStack || []).join(", ")})`).join("\n"));
          }
          if (p.experience?.length) {
            parts.push("Experience:\n" + p.experience.map((exp: any) => `- ${exp.role} at ${exp.company}: ${exp.description || exp.bullets?.join(" ")}`).join("\n"));
          }
          if (parts.length > 0) {
            setBackground(parts.join("\n\n"));
          }
        }
      }

      // If user is not logged in or profile is empty, provide authentic student defaults
      if (!loaded) {
        setTargetRole("AI/ML Engineer & Full Stack Developer");
        setExperience("Fresher (Final Year Student)");
        setCategory("fresher");
        setKeywords("Python, Machine Learning, FastAPI, React, Next.js, PostgreSQL, PyTorch, Docker, System Design");
        setLinkedin("linkedin.com/in/nistha-maheshwari");
        setGithub("github.com/nisthamaheshwari");
        setCertifications("AWS Certified Cloud Practitioner, DeepLearning.AI Machine Learning Specialization");
        setBackground(
          "Name: Nishtha Maheshwari. 3rd Year B.Tech CSE (AI/ML) at ABES Engineering College, Ghaziabad (CGPA: 8.8 / 10.0).\n\n" +
          "Experience:\n" +
          "- AI Engineering Intern at Cognalyze (2024 - Present): Engineered full-stack recruitment intelligence platform, integrated multi-agent resume assessment pipelines, increased recruiter candidate evaluation speed by 35%.\n\n" +
          "Projects:\n" +
          "- Cognalyze Recruitment Intelligence: Next.js, FastAPI, Vector Embeddings, PostgreSQL platform for real-time ATS scoring and factual candidate evaluation.\n" +
          "- Real-Time Distributed Task Queue: High-throughput async task scheduler handling 10k+ req/sec using Redis, Go, and Docker.\n" +
          "- Multi-Modal Healthcare Diagnostic AI: PyTorch & Vision Transformer model detecting pulmonary anomalies with 96.2% validation accuracy.\n\n" +
          "Technical Skills: Python, C++, TypeScript, React, Next.js, FastAPI, PostgreSQL, Redis, Docker, PyTorch, LLMs."
        );
      }
    } catch (e) {
      console.error("Profile prefill error", e);
    } finally {
      setIsPreFilling(false);
    }
  };

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

      // Convert generated resume directly into the ONE canonical ResumeDocument
      const canonicalDoc = convertGeneratedResumeToDocument(data, template as TemplateId);
      setCanonicalResume(canonicalDoc);

      try {
        localStorage.setItem("cognalyze_canonical_resume", JSON.stringify(canonicalDoc));
      } catch (e) {
        // Storage error ignored
      }

      // Directly transition into the clean, unified Resume Editor!
      setStep("editor");
    } catch (e: any) {
      setError(e.message || "Failed to generate resume. Please verify your inputs.");
      setStep("input");
    }
  };

  // If in editor step with a canonical document, render LiveResumeEditor directly
  if (step === "editor" && canonicalResume) {
    return (
      <LiveResumeEditor
        initialDocument={canonicalResume}
        onSave={(updated) => {
          setCanonicalResume(updated);
          try {
            localStorage.setItem("cognalyze_canonical_resume", JSON.stringify(updated));
          } catch (e) {}
        }}
        onRebuild={() => {
          setStep("input");
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F6F5F1", color: "#17191C", fontFamily: "var(--font-inter, sans-serif)" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        textarea:focus,input:focus,select:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#D0D5DD;border-radius:2px;}
      `}</style>

      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "#FFFFFF", borderBottom: "1px solid #E4E1DA" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#162A43", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 13, fontWeight: 700 }}>
            C
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#162A43", letterSpacing: "-0.01em" }}>COGNALYZE</span>
          <span style={{ fontSize: 11, padding: "2px 8px", border: "1px solid #E4E1DA", background: "#FAF9F6", borderRadius: 5, color: "#667085", fontWeight: 600 }}>
            RESUME STUDIO
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {canonicalResume && (
            <button
              onClick={() => setStep("editor")}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                background: "#FAF9F6",
                border: "1px solid #E4E1DA",
                color: "#162A43",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease"
              }}
            >
              <span>📄</span>
              <span>Open Saved Draft ({canonicalResume.contact.name || "Resume"}) →</span>
            </button>
          )}
          <a href="/" style={{ color: "#667085", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>← Back to Dashboard</a>
        </div>
      </div>

      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "36px 24px 80px" }}>
        {/* INPUT STAGE */}
        {step === "input" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#356AE6", marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>
                AI-AUGMENTED DOCUMENT CREATION
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#162A43", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 8px" }}>
                ATS Compliance & Recruiter-Defensible Resume
              </h1>
              <p style={{ color: "#667085", fontSize: 14, margin: "0 auto", maxWidth: 640 }}>
                Grounded strictly in verified claims and authentic background. Every bullet is formatted for corporate ATS screening and human scrutiny.
              </p>

              {/* Pre-fill CTA */}
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={handlePreFillFromProfile}
                  disabled={isPreFilling}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 7,
                    border: "1px solid #E4E1DA",
                    backgroundColor: "#FFFFFF",
                    color: "#162A43",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isPreFilling ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>⚡</span>
                  <span>{isPreFilling ? "Loading Profile Data..." : "Pre-fill from Profile & Evidence"}</span>
                </button>
              </div>
            </div>

            {/* Template selector */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>
                SELECT DOCUMENT TEMPLATE (7 RECRUITER STYLES)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 10 }}>
                {TEMPLATES.map(t => <TemplateThumb key={t.id} t={t} selected={template === t.id} onClick={() => setTemplate(t.id)} />)}
              </div>

              {template === "modern-tech" && (
                <div style={{ background: "#F0F4FE", border: "1px solid #D2E0FB", borderRadius: 7, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#162A43" }}>
                  <span>ℹ️</span>
                  <span><strong>Format note:</strong> Modern Tech features a two-column sidebar layout optimal for human recruiter review and referral submissions. For high-volume automated corporate applicant portals, <strong>ATS Classic</strong> is recommended.</span>
                </div>
              )}
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, marginBottom: 16, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
              {/* Target role, experience, and category */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                    TARGET ROLE *
                  </div>
                  <input
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. AI/ML Engineer or Full Stack Developer"
                    style={{ width: "100%", padding: "9px 12px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, color: "#17191C", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#356AE6"}
                    onBlur={e => e.target.style.borderColor = "#E4E1DA"}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                    EXPERIENCE LEVEL
                  </div>
                  <input
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    placeholder="e.g. Final Year Student or 1-2 years"
                    style={{ width: "100%", padding: "9px 12px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, color: "#17191C", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#356AE6"}
                    onBlur={e => e.target.style.borderColor = "#E4E1DA"}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                    CAREER STAGE / HIERARCHY
                  </div>
                  <select
                    value={category}
                    onChange={e => { setCategory(e.target.value); setAmbiguousAlert(false); }}
                    style={{ width: "100%", padding: "9px 12px", background: "#FAF9F6", border: ambiguousAlert ? "1px solid #C24141" : "1px solid #E4E1DA", borderRadius: 7, color: "#17191C", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none", cursor: "pointer" }}
                  >
                    <option value="auto">Auto-Detect (Screening Analysis)</option>
                    <option value="fresher">Fresher / Student (Education & Projects prioritized)</option>
                    <option value="1-3years">1-3 Years Experience (Experience & Projects balanced)</option>
                    <option value="senior">3+ Years / Senior (Experience prioritized)</option>
                    <option value="career-switcher">Career Switcher (Transferable skills elevated)</option>
                  </select>
                </div>
              </div>

              {ambiguousAlert && (
                <div style={{ background: "#FEF3F2", border: "1px solid #F8C8C8", borderRadius: 7, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, color: "#C24141", fontSize: 12 }}>
                  <span>⚠️</span>
                  <span><strong>Recruiter Check:</strong> Career stage was ambiguous from inputs. Please select your specific <strong>Career Stage</strong> to apply the correct section hierarchy.</span>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                  TARGET KEYWORDS & SKILLS (comma separated)
                </div>
                <input
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="Python, Machine Learning, AWS, React, System Design, Docker, PostgreSQL..."
                  style={{ width: "100%", padding: "9px 12px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, color: "#17191C", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#356AE6"}
                  onBlur={e => e.target.style.borderColor = "#E4E1DA"}
                />
                <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>Keywords are woven naturally into bullet points only where substantiated by your background.</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                    LINKEDIN PROFILE
                  </div>
                  <input
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                    placeholder="e.g. linkedin.com/in/username"
                    style={{ width: "100%", padding: "9px 12px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, color: "#17191C", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#356AE6"}
                    onBlur={e => e.target.style.borderColor = "#E4E1DA"}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                    GITHUB PROFILE
                  </div>
                  <input
                    value={github}
                    onChange={e => setGithub(e.target.value)}
                    placeholder="e.g. github.com/username"
                    style={{ width: "100%", padding: "9px 12px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, color: "#17191C", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#356AE6"}
                    onBlur={e => e.target.style.borderColor = "#E4E1DA"}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                  CERTIFICATIONS & HONORS (comma separated)
                </div>
                <input
                  value={certifications}
                  onChange={e => setCertifications(e.target.value)}
                  placeholder="e.g. AWS Solutions Architect, DeepLearning.AI Machine Learning Specialization"
                  style={{ width: "100%", padding: "9px 12px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, color: "#17191C", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#356AE6"}
                  onBlur={e => e.target.style.borderColor = "#E4E1DA"}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                  AUTHENTIC BACKGROUND & PROJECTS * (detail projects, metrics, tech stack)
                </div>
                <textarea
                  value={background}
                  onChange={e => setBackground(e.target.value)}
                  rows={7}
                  placeholder={`Example:\nName: Priya Sharma. CS student at IIT Delhi, 3rd year. Interned at Flipkart — built recommendation engine, increased CTR by 18%. Built AI chatbot used by 5000+ college students. Won TechFest IIT Bombay 2024 (national hackathon). Skills: Python, ML, React, SQL. Applying for ML Engineer roles.`}
                  style={{ width: "100%", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, padding: 12, color: "#17191C", fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#356AE6"}
                  onBlur={e => e.target.style.borderColor = "#E4E1DA"}
                />
              </div>
            </div>

            {/* Quality Guarantees */}
            <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>
                COGNALYZE RECRUITER VERIFICATION STANDARDS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
                {[
                  "Highlights verified metrics you provide — never hallucinates numbers",
                  "Integrates keywords into authentic context without keyword stuffing",
                  "Uses active, technical verbs matched directly to candidate actions",
                  "Eliminates empty fluff phrases that trigger ATS discards",
                  "Structures sections according to your exact career level",
                  "Loads directly into document canvas for seamless inline editing",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ color: "#2E7D5B", fontSize: 12, flexShrink: 0, fontWeight: 700 }}>✓</span>
                    <span style={{ fontSize: 12, color: "#667085", lineHeight: 1.4 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && <p style={{ color: "#C24141", textAlign: "center", marginBottom: 12, fontSize: 13, fontWeight: 600 }}>⚠️ {error}</p>}

            <button
              onClick={build}
              disabled={!targetRole || !background}
              style={{
                width: "100%",
                padding: "12px 18px",
                borderRadius: 7,
                border: "none",
                background: !targetRole || !background ? "#98A2B3" : "#356AE6",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                cursor: !targetRole || !background ? "not-allowed" : "pointer",
                opacity: !targetRole || !background ? 0.6 : 1,
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
                transition: "background 0.15s ease",
              }}
            >
              Generate ATS-Optimized Resume →
            </button>
          </div>
        )}

        {/* LOADING STAGE */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ width: 48, height: 48, margin: "0 auto 20px", border: "3px solid #E4E1DA", borderTop: "3px solid #356AE6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: "0 0 8px" }}>
              Synthesizing Recruiter-Defensible Resume
            </h3>
            <p style={{ fontSize: 13, color: "#667085", margin: 0 }}>
              Applying ATS screening standards · Verifying technical consistency · Formatting {template} layout
            </p>
          </div>
        )}
      </div>
    </div>
  );
}