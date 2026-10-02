"use client";
import { useState } from "react";
import Link from "next/link";

const sections = [
  {
    icon: "⚖️",
    title: "What is COGNALYZE?",
    content: `COGNALYZE is an institutional-grade hiring intelligence platform that evaluates engineering talent through structured adversarial debate and verified code evidence rather than shallow keyword matching.

COGNALYZE solves the fundamental failure mode of traditional recruitment: top-tier builders get rejected because their resume doesn't match a legacy ATS keyword list, while keyword-stuffed candidates pass without real capability.

The architectural insight: High-conviction talent decisions come from structured examination and adversarial scrutiny. When Champion, Skeptic, Futurist, Pattern Breaker, and Culture Oracle evaluate a candidate against explicit role DNA, hiring teams gain clarity and precision impossible with legacy resume parsers.`
  },
  {
    icon: "🎯",
    title: "Evidence Before Decisions",
    content: `Anika had exactly the low-level systems capability the engineering team required. But her previous title was "Data Analyst" rather than "Distributed Systems Engineer." Legacy ATS systems buried her at ranking #412.

The Pattern Breaker agent audited her verified GitHub repositories and commit history. The Champion agent quantified production impact. The Skeptic probed edge-case system boundaries. The hiring intelligence layer ranked her in the top 3 candidates.

This is the purpose of COGNALYZE: surfacing extraordinary capability that keyword filters systematically discard.`
  }
];

const features = [
  {
    category: "FOR HIRING TEAMS",
    color: "#162A43",
    tagBg: "#F6F5F1",
    tagBorder: "#E4E1DA",
    items: [
      { name: "5-Agent AI Committee", desc: "Champion, Skeptic, Futurist, Pattern Breaker & Culture Oracle debate candidate evidence", icon: "⚡" },
      { name: "ATS Match Diagnostics", desc: "Real-time semantic matching against Job Architecture with percentage and gap breakdown", icon: "🎯" },
      { name: "Skills Matrix & Verification", desc: "Must-have vs nice-to-have capabilities verified against public GitHub activity", icon: "📊" },
      { name: "Evidence-Backed Flags", desc: "Calibrated strengths and inquiry points referencing specific project artifacts", icon: "🚩" },
      { name: "Candidate DNA Profiling", desc: "Multi-dimensional evaluation: Technical Depth, Architecture, Verification & Problem Solving", icon: "🧬" },
      { name: "Calibrated Inquiries", desc: "Role-specific technical questions designed to probe genuine capability boundaries", icon: "🎤" },
      { name: "Compensation Banding", desc: "Market-aligned compensation ranges indexed to verified experience and role scope", icon: "💰" },
      { name: "Comparative Decision Rooms", desc: "Side-by-side cohort benchmarking with traceable rationale for shortlists", icon: "👥" },
      { name: "Deterministic Verdicts", desc: "Clear hiring recommendations (Advance, Hold, Pass) with confidence metrics", icon: "✅" },
    ]
  },
  {
    category: "FOR CANDIDATES & BUILDERS",
    color: "#356AE6",
    tagBg: "#EFF4FE",
    tagBorder: "#D2E0FB",
    items: [
      { name: "Unfiltered Diagnostic Feedback", desc: "Adversarial committee feedback explaining exactly where evidence was convincing or lacking", icon: "💬" },
      { name: "Skills Gap Analysis", desc: "Direct mapping of current evidence against target role DNA with targeted learning paths", icon: "📈" },
      { name: "Institutional Resume Polish", desc: "Evidence-verified bullet quantification and structural alignment without keyword stuffing", icon: "✍️" },
      { name: "6-Month Career Milestones", desc: "Structured, evidence-grounded technical progression plan targeting specific seniorities", icon: "🗺️" },
      { name: "Predictive Interview Inquiries", desc: "Targeted technical challenges anticipating questions top engineering teams ask", icon: "🎯" },
    ]
  },
  {
    category: "ASSESSMENT ARENA & SIMULATION",
    color: "#2E7D5B",
    tagBg: "#EAF4EE",
    tagBorder: "#C8E4D3",
    items: [
      { name: "Structured Technical Simulation", desc: "Adaptive technical inquiry across Behavioral, System Design, and Algorithms", icon: "👔" },
      { name: "Multi-Dimension Scoring", desc: "Accuracy, Communication, Depth, Production Judgment, and Problem Solving scored per turn", icon: "📊" },
      { name: "Evidence-Grounded Feedback", desc: "Traceable critique referencing exact algorithmic choices and trade-off explanations", icon: "🎯" },
      { name: "Exemplary Response Models", desc: "Institutional-standard architectural explanations showing ideal production considerations", icon: "💡" },
      { name: "Production GD Simulation", desc: "Interactive round-table debate with adversarial AI peers testing team reasoning", icon: "👥" },
      { name: "Comprehensive Final Scorecard", desc: "Detailed hire recommendations with competency breakdowns and interviewer documentation", icon: "🏆" },
    ]
  },
  {
    category: "RESUME INTELLIGENCE",
    color: "#B7791F",
    tagBg: "#FEF7ED",
    tagBorder: "#F8D8A7",
    items: [
      { name: "Institutional Clean Layouts", desc: "Executive, Systems Engineering, Modern Tech, and Academic formats built for clarity", icon: "📄" },
      { name: "Evidence Quantification", desc: "Converts ambiguous task bullets into metric-driven production impact statements", icon: "📈" },
      { name: "ATS Diagnostic Audit", desc: "Comprehensive structural and semantic compliance inspection prior to submission", icon: "🎯" },
      { name: "Verified PDF Generation", desc: "Crisp vector export guaranteed to parse cleanly across institutional ATS systems", icon: "⬇️" },
    ]
  }
];

const techStack = [
  { name: "Next.js 14 App Router", desc: "Server Components & Dynamic Edge Routes", icon: "▲" },
  { name: "TypeScript", desc: "Strict end-to-end type safety", icon: "TS" },
  { name: "Llama 3.3 70B & 8B", desc: "Multi-agent evaluation & fast streaming", icon: "⚡" },
  { name: "Vision AI Analysis", desc: "Visual assessment & interview signal capture", icon: "👁" },
  { name: "Web Speech API", desc: "Native browser speech synthesis & recognition", icon: "🎤" },
  { name: "Institutional Design System", desc: "Enterprise typography, tokens & accessible contrast", icon: "🎨" },
];

export default function AboutPage() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* Navigation Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.875rem 2rem",
          borderBottom: "1px solid #E4E1DA",
          position: "sticky",
          top: 0,
          backgroundColor: "#FFFFFF",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#162A43",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.5px",
            }}
          >
            COGNALYZE
          </Link>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#356AE6",
              backgroundColor: "#EFF4FE",
              border: "1px solid #D2E0FB",
              padding: "2px 8px",
              borderRadius: 4,
              letterSpacing: "0.5px",
            }}
          >
            PLATFORM ARCHITECTURE
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/recruiter" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: "1px solid #E4E1DA",
                backgroundColor: "#FFFFFF",
                color: "#162A43",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              For Hiring Teams
            </button>
          </Link>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#356AE6",
                color: "#FFFFFF",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Home
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "4rem 2rem 2.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            color: "#356AE6",
            marginBottom: 12,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Institutional Evidence-First Hiring
        </div>
        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: -1.5,
            lineHeight: 1.15,
            marginBottom: 16,
            color: "#162A43",
          }}
        >
          Complex Engine. Simple Interface.
        </h1>
        <p
          style={{
            fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
            color: "#667085",
            maxWidth: 680,
            margin: "0 auto 2.5rem",
            lineHeight: 1.6,
          }}
        >
          The evidence-first career and hiring intelligence layer. 5 adversarial agents debate engineering candidates against verified code proof to surface talent that legacy keyword filters discard.
        </p>

        {/* Metric Badges */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            ["⚖️ 5-Agent Committee", "Adversarial evaluation"],
            ["🎯 Evidence-First", "Verified repo commits"],
            ["📊 7-Dimension Score", "Objective rubric"],
            ["🧬 Role DNA Match", "Zero keyword stuffing"],
            ["📄 Institutional Export", "Clean vector ATS PDF"]
          ].map(([title, sub], i) => (
            <div
              key={i}
              style={{
                padding: "10px 18px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 8,
                textAlign: "center",
                boxShadow: "0 1px 3px rgba(22, 42, 67, 0.04)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>{title}</div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 2rem 5rem" }}>
        {/* About Sections Accordion */}
        <div style={{ marginBottom: "3.5rem" }}>
          {sections.map((s, i) => (
            <div
              key={i}
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{
                marginBottom: 12,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 12,
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(22, 42, 67, 0.03)",
              }}
            >
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#162A43" }}>{s.title}</span>
                </div>
                <span style={{ color: "#667085", fontSize: 14 }}>{expanded === i ? "▲" : "▼"}</span>
              </div>
              {expanded === i && (
                <div
                  style={{
                    padding: "0 1.5rem 1.5rem",
                    borderTop: "1px solid #E4E1DA",
                    backgroundColor: "#FAFAF8",
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      color: "#667085",
                      lineHeight: 1.7,
                      marginTop: "1rem",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {s.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Feature Categories */}
        {features.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
              <div style={{ height: 3, width: 28, backgroundColor: cat.color, borderRadius: 2 }} />
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  color: cat.color,
                  margin: 0,
                }}
              >
                {cat.category}
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {cat.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "1.1rem 1.25rem",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    boxShadow: "0 1px 3px rgba(22, 42, 67, 0.03)",
                    transition: "border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#356AE6")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E4E1DA")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#162A43" }}>{item.name}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#667085", lineHeight: 1.5, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Tech Stack */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
            <div style={{ height: 3, width: 28, backgroundColor: "#356AE6", borderRadius: 2 }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: 0.5, color: "#162A43", margin: 0 }}>
              TECHNICAL FOUNDATION
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {techStack.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: "1rem 1.25rem",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  boxShadow: "0 1px 3px rgba(22, 42, 67, 0.03)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    backgroundColor: "#EFF4FE",
                    border: "1px solid #D2E0FB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#356AE6",
                    flexShrink: 0,
                  }}
                >
                  {t.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#162A43" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Principles */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 14,
            padding: "2rem",
            marginBottom: "3.5rem",
            boxShadow: "0 1px 4px rgba(22, 42, 67, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#162A43", margin: 0 }}>
              AI EVALUATION PRINCIPLES
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {[
              "Never hallucinate skills or unverified experience",
              "Every observation traced to inspectable code evidence",
              "Deterministic, rubric-based evaluation — not a black box",
              "Consistent answer quality yields consistent score range",
              "Zero generic advice; feedback references specific artifacts",
              "Explainable decisions with verifiable competency breakdown"
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#2E7D5B", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12.5, color: "#667085", lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div
          style={{
            textAlign: "center",
            padding: "3rem 2rem",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 16,
            boxShadow: "0 2px 8px rgba(22, 42, 67, 0.04)",
          }}
        >
          <h2 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: -0.5, marginBottom: "0.75rem", color: "#162A43" }}>
            Start Using COGNALYZE
          </h2>
          <p style={{ color: "#667085", marginBottom: "2rem", fontSize: 14, maxWidth: 520, margin: "0 auto 2rem" }}>
            Institutional hiring and talent intelligence for modern engineering teams and candidates.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/recruiter" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#162A43",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "background 0.15s ease",
                }}
              >
                ⚡ Recruiter Workspace
              </button>
            </Link>
            <Link href="/student" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "background 0.15s ease",
                }}
              >
                Candidate Workspace
              </button>
            </Link>
            <Link href="/student/interview-prep" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: 8,
                  border: "1px solid #E4E1DA",
                  backgroundColor: "#FFFFFF",
                  color: "#162A43",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                🎤 Mock Interview
              </button>
            </Link>
            <Link href="/resume" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: 8,
                  border: "1px solid #E4E1DA",
                  backgroundColor: "#FFFFFF",
                  color: "#162A43",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                📄 Resume Builder
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}