"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "profile"
    | "resume"
    | "dna"
    | "opportunities"
    | "interview"
    | "ats"
    | "roadmap"
    | "calendar"
    | "settings"
  >("overview");

  // Dynamic Student Profile state from Session
  const [profile, setProfile] = useState({
    fullName: "",
    firstName: "",
    college: "",
    degree: "",
    branch: "",
    graduationYear: "",
    avatarInitials: "",
  });

  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);
  const [expandedEvidenceIdx, setExpandedEvidenceIdx] = useState<number | null>(0);
  const [atsView, setAtsView] = useState<"side-by-side" | "diff">("side-by-side");
  const [selectedMilestone, setSelectedMilestone] = useState<number>(2); // Default to Project phase

  // Opportunities filter
  const [oppFilter, setOppFilter] = useState<string>("All");

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            const sp = data.studentProfile || {};
            const user = data.user || {};
            const fullName = sp.fullName || user.fullName || user.email?.split("@")[0] || "Candidate";
            const parts = fullName.trim().split(" ");
            const firstName = parts[0] || "Candidate";
            const initials =
              parts.length > 1
                ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                : parts[0]?.slice(0, 2).toUpperCase() || "CD";

            setProfile({
              fullName,
              firstName,
              college: sp.college || "School of Engineering & Technology",
              degree: sp.degree || "B.Tech",
              branch: sp.branch || "Computer Science",
              graduationYear: sp.graduationYear || "2026",
              avatarInitials: initials,
            });
          } else {
            setProfile({
              fullName: "Candidate",
              firstName: "Candidate",
              college: "School of Engineering & Technology",
              degree: "B.Tech",
              branch: "Computer Science",
              graduationYear: "2026",
              avatarInitials: "CD",
            });
          }
        }
      } catch (err) {
        console.error("Session load error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, []);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Opportunities list
  const opportunities = [
    {
      id: "opp-1",
      company: "Stripe",
      role: "Software Engineering Intern • Infrastructure",
      location: "San Francisco, CA (Hybrid)",
      type: "Internship",
      deadline: "Oct 28, 2026",
      match: 88,
      matchedSkills: ["Python", "Distributed Systems", "PostgreSQL"],
      missingSkills: ["AWS Lambda"],
      reason: "High concurrency and connection pooling proof aligns with infrastructure team needs.",
      nextAction: "Complete Event-Driven Architecture Studio module.",
    },
    {
      id: "opp-2",
      company: "Google",
      role: "Associate Software Engineer • Cloud Platform",
      location: "Mountain View, CA / Remote",
      type: "Full-Time",
      deadline: "Nov 15, 2026",
      match: 84,
      matchedSkills: ["Data Structures", "Algorithms", "System Design"],
      missingSkills: ["Go"],
      reason: "Top 8% LeetCode rating and clean graph traversal proofs satisfy technical bar.",
      nextAction: "Practice CS Fundamentals Round with Alex.",
    },
    {
      id: "opp-3",
      company: "Datadog",
      role: "Backend Engineer • Observability & Telemetry",
      location: "New York, NY",
      type: "Full-Time",
      deadline: "Nov 02, 2026",
      match: 79,
      matchedSkills: ["Python", "FastAPI", "Prometheus"],
      missingSkills: ["Kafka Streams"],
      reason: "Strong performance quantification in previous project telemetry.",
      nextAction: "Add microservice streaming demonstration to portfolio.",
    },
  ];

  const filteredOpportunities =
    oppFilter === "All"
      ? opportunities
      : opportunities.filter((o) => o.type.toLowerCase().includes(oppFilter.toLowerCase()));

  // Career Roadmap Milestones
  const milestones = [
    {
      step: 1,
      title: "Current Position",
      state: "Completed",
      date: "Aug 2026",
      goal: "Foundational CS & Multi-Tier App Architecture",
      skills: ["Data Structures", "Relational DBs", "REST APIs"],
      action: "Verified with 3 production repositories.",
    },
    {
      step: 2,
      title: "Skill Gap Closure",
      state: "In Progress",
      date: "Sep 2026",
      goal: "Master Concurrency & Asynchronous Event Processing",
      skills: ["Redis Caching", "Thread Pools", "Idempotent Webhooks"],
      action: "Active: 2 modules remaining in Skill Hub.",
    },
    {
      step: 3,
      title: "Capstone Production Project",
      state: "Upcoming",
      date: "Oct 2026",
      goal: "Build High-Throughput Ingestion Engine (>20k rps)",
      skills: ["FastAPI", "PostgreSQL Sharding", "Docker"],
      action: "Project spec auto-generated from target role requirements.",
    },
    {
      step: 4,
      title: "Targeted Internship",
      state: "Upcoming",
      date: "Jan 2027",
      goal: "Cloud Infrastructure Engineering Fellowship",
      skills: ["Production Monitoring", "CI/CD", "On-Call Simulation"],
      action: "Direct pipeline match with Stripe & Datadog.",
    },
    {
      step: 5,
      title: "Placement Outcome",
      state: "Upcoming",
      date: "May 2027",
      goal: "Tier-1 Software Engineer Offer",
      skills: ["System Design", "Leadership Principles", "Behavioral STAR"],
      action: "Final FAANG interview readiness certification.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", color: "#18181B" }}>
      {/* ── 1. GLOBAL NAVIGATION ── */}
      <AppNav role="student" />

      {/* ── 2. SUB-HEADER & WORKSPACE TABS ── */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E7E5E4",
          position: "sticky",
          top: 60,
          zIndex: 30,
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {/* Workspace Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "overview", label: "Overview" },
              { id: "profile", label: "My Profile" },
              { id: "resume", label: "Resume Intelligence" },
              { id: "dna", label: "Candidate DNA" },
              { id: "opportunities", label: "Opportunity Tracker" },
              { id: "interview", label: "Interview Studio" },
              { id: "ats", label: "ATS Optimization" },
              { id: "roadmap", label: "Career Roadmap" },
              { id: "calendar", label: "Placement Calendar" },
              { id: "settings", label: "Settings & Privacy" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #18181B" : "2px solid transparent",
                  color: activeTab === tab.id ? "#18181B" : "#6B6B6B",
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  padding: "14px 12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 150ms ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Action */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 16 }} className="hidden sm:flex">
            <Link
              href="/interview"
              style={{
                backgroundColor: "#18181B",
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Start Mock Interview ➔
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. WORKSPACE CONTAINER ── */}
      <main
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "28px 20px 80px",
        }}
      >
        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW                                           */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Top Bar Greeting */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#176B5B",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  Candidate Intelligence Dashboard
                </span>
                <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0", color: "#111111" }}>
                  {getGreeting()}, {profile.firstName || "Candidate"}
                </h1>
                <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 0" }}>
                  {profile.degree} in {profile.branch} • Class of {profile.graduationYear}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setActiveTab("resume")}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    color: "#18181B",
                    borderRadius: 6,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Upload New Resume
                </button>
                <button
                  onClick={() => setActiveTab("opportunities")}
                  style={{
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Explore Matched Roles
                </button>
              </div>
            </div>

            {/* 4 Animated Metric Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { title: "Career Readiness", value: "78%", sub: "Top quartile of engineering cohort", color: "#176B5B", progress: 78 },
                { title: "Resume Strength", value: "84%", sub: "12 verified action-oriented metrics", color: "#18181B", progress: 84 },
                { title: "Skill Coverage", value: "71%", sub: "18 verified technical competencies", color: "#18181B", progress: 71 },
                { title: "Interview Readiness", value: "68%", sub: "Completed 4 technical & system rounds", color: "#18181B", progress: 68 },
              ].map((m) => (
                <div
                  key={m.title}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: "20px 22px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>{m.title}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: m.color, margin: "6px 0" }}>{m.value}</div>
                  <div style={{ height: 4, backgroundColor: "#F5F5F4", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ width: `${m.progress}%`, height: "100%", backgroundColor: m.color === "#176B5B" ? "#176B5B" : "#18181B" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#6B6B6B" }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Middle Section: Candidate DNA + Placement Calendar Preview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
              {/* Candidate DNA */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E7E5E4",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111111" }}>
                      Candidate DNA Breakdown
                    </h3>
                    <p style={{ fontSize: 12, color: "#6B6B6B", margin: "2px 0 0" }}>
                      Editorial competency evaluation based on verified proofs
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("dna")}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#176B5B",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    View Details ➔
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { cat: "Technical Depth", score: 86, desc: "3 verified repos with unit test coverage" },
                    { cat: "Problem Solving", score: 82, desc: "Consistent LeetCode submission history" },
                    { cat: "Communication", score: 78, desc: "Clear STAR articulation in mock recordings" },
                    { cat: "Leadership & Initiative", score: 72, desc: "Open-source maintainer contribution" },
                    { cat: "Project Depth", score: 88, desc: "Low vibe-code probability (96% organic)" },
                    { cat: "Industry Exposure", score: 65, desc: "Needs additional production cloud proofs" },
                  ].map((dna) => (
                    <div key={dna.cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: "#18181B" }}>{dna.cat}</span>
                        <span style={{ color: "#6B6B6B" }}>{dna.score}% • {dna.desc}</span>
                      </div>
                      <div style={{ height: 6, backgroundColor: "#F5F5F4", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${dna.score}%`,
                            height: "100%",
                            backgroundColor: dna.score >= 85 ? "#176B5B" : "#18181B",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Placement Calendar Card */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E7E5E4",
                  borderRadius: 12,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111111" }}>
                        Upcoming Placement Deadlines
                      </h3>
                      <p style={{ fontSize: 12, color: "#6B6B6B", margin: "2px 0 0" }}>
                        Algorithmic schedule synced with company application windows
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("calendar")}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#176B5B",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Open Calendar ➔
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { date: "Oct 15", company: "Stripe", role: "Software Engineering Intern", tag: "Application Deadline" },
                      { date: "Oct 22", company: "Google", role: "Early Career Technical Round", tag: "Technical Screen" },
                      { date: "Nov 02", company: "Datadog", role: "Campus Placement Drive", tag: "Campus Visit" },
                    ].map((cal) => (
                      <div
                        key={cal.company}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          backgroundColor: "#FAFAF9",
                          border: "1px solid #E7E5E4",
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E7E5E4",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              textAlign: "center",
                            }}
                          >
                            {cal.date}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{cal.company}</div>
                            <div style={{ fontSize: 11, color: "#6B6B6B" }}>{cal.role}</div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#18181B",
                            backgroundColor: "#F5F5F4",
                            padding: "3px 8px",
                            borderRadius: 4,
                          }}
                        >
                          {cal.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #E7E5E4", fontSize: 12, color: "#6B6B6B" }}>
                  Next priority: <strong>Stripe application closes in 18 days</strong>.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 2: RESUME INTELLIGENCE                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "resume" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                SCORE ➔ EVIDENCE ➔ ACTION
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Resume Intelligence & Verifiable Claims
              </h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                Every score is backed by extracted evidence. Click any row to expand supporting proof.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
              {/* Left: Resume Preview / Document View */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E7E5E4",
                  borderRadius: 12,
                  padding: 28,
                  fontFamily: "serif",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ borderBottom: "1px solid #18181B", paddingBottom: 12, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "sans-serif" }}>
                    {profile.fullName || "Candidate Resume"}
                  </h3>
                  <div style={{ fontSize: 12, color: "#6B6B6B", fontFamily: "sans-serif", marginTop: 4 }}>
                    {profile.college} • {profile.degree} in {profile.branch} (Class of {profile.graduationYear})
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif", color: "#18181B", marginBottom: 6 }}>
                    TECHNICAL EXPERIENCE
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "sans-serif" }}>
                    Software Engineering Fellow • Open-Source Distributed Systems
                  </div>
                  <div style={{ fontSize: 11, color: "#6B6B6B", fontFamily: "sans-serif", marginBottom: 6 }}>
                    June 2026 – Present
                  </div>
                  <ul style={{ fontSize: 13, color: "#374151", paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <li>
                      Architected high-throughput asynchronous API endpoints using Python (FastAPI) and PostgreSQL, handling 25,000 queries per second.
                    </li>
                    <li>
                      Implemented multi-tier caching with Redis, reducing database connection pool exhaustion by 42%.
                    </li>
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif", color: "#18181B", marginBottom: 6 }}>
                    VERIFIED PROJECTS
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "sans-serif" }}>
                    Distributed Task Queue (Python, Redis, Docker)
                  </div>
                  <ul style={{ fontSize: 13, color: "#374151", paddingLeft: 18, margin: "6px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
                    <li>
                      Engineered distributed worker cluster with exponential backoff and dead-letter queues. Verified across 84 organic commits.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right: Analysis & Evidence Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  {
                    title: "Skill Coverage — 82%",
                    matched: ["Python", "PostgreSQL", "Redis", "FastAPI"],
                    missing: ["Docker Compose", "AWS Lambda"],
                    evidence: "Python appears in 3 verified repos (84 commits). Redis caching confirmed in project test suite.",
                    action: "Add containerized deployment file (Dockerfile) to complete cloud infrastructure evidence.",
                  },
                  {
                    title: "ATS Compatibility — 89%",
                    matched: ["Clean typography", "Single-column layout", "Standard section headers"],
                    missing: ["None"],
                    evidence: "100% parse rate with zero table or icon interference. All dates correctly formatted.",
                    action: "Maintain current single-column format for enterprise ATS compliance.",
                  },
                  {
                    title: "Evidence Density — High (4 Verified Proofs)",
                    matched: ["GitHub API", "LeetCode Contest Rating", "Live URL Verification"],
                    missing: ["Hackathon Placement Certificate"],
                    evidence: "No self-proclaimed claims ungrounded; all code links resolve to verified commit hashes.",
                    action: "Ready for direct submission to recruiter review boards.",
                  },
                  {
                    title: "Impact & Clarity — 84%",
                    matched: ["Latency reduced by 42%", "25k qps scale metric"],
                    missing: ["Cost optimization figure"],
                    evidence: "All bullet points start with strong action verbs and contain measurable engineering outputs.",
                    action: "Optional: specify dollar savings or infrastructure node count.",
                  },
                ].map((item, idx) => (
                  <div
                    key={item.title}
                    onClick={() => setExpandedEvidenceIdx(expandedEvidenceIdx === idx ? null : idx)}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E7E5E4",
                      borderRadius: 10,
                      padding: "16px 20px",
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111111" }}>{item.title}</h4>
                      <span style={{ fontSize: 13, color: "#6B6B6B" }}>
                        {expandedEvidenceIdx === idx ? "▲" : "▼"}
                      </span>
                    </div>

                    {expandedEvidenceIdx === idx && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F5F5F4" }}>
                        <div style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 12 }}>
                          <div>
                            <span style={{ color: "#6B6B6B" }}>Matched: </span>
                            <strong style={{ color: "#176B5B" }}>{item.matched.join(", ")}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#6B6B6B" }}>Missing: </span>
                            <strong style={{ color: "#B45309" }}>{item.missing.join(", ")}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: "#18181B", marginBottom: 6, lineHeight: 1.4 }}>
                          <strong>Evidence:</strong> {item.evidence}
                        </div>
                        <div style={{ fontSize: 12, color: "#176B5B", fontWeight: 600 }}>
                          ➔ <strong>Action:</strong> {item.action}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 3: CANDIDATE DNA                                      */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "dna" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                COMPETENCY MATRIX
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Candidate DNA Analysis
              </h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                Objective 6-dimensional evaluation based on evidence, not self-reported tags.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {[
                {
                  dim: "Technical Skills",
                  score: "88%",
                  sub: "Algorithms, Concurrency & Backend",
                  proof: "3 public repositories, 84 commits, 14 pull requests. Strong Python & SQL foundation.",
                  status: "Verified",
                },
                {
                  dim: "Problem Solving",
                  score: "82%",
                  sub: "Data Structures & Algorithmic Rigor",
                  proof: "LeetCode rating 1,840. High accuracy in Trees, Graphs, and Dynamic Programming.",
                  status: "Verified",
                },
                {
                  dim: "Communication",
                  score: "78%",
                  sub: "STAR Method & Structured Reasoning",
                  proof: "Mock interview speech transcript scored with low filler-word frequency and clear trade-off rationale.",
                  status: "Verified",
                },
                {
                  dim: "Leadership & Initiative",
                  score: "72%",
                  sub: "Peer Mentorship & Project Ownership",
                  proof: "Active collaborator on 2 community open-source repos with reviewed community PRs.",
                  status: "Developing",
                },
                {
                  dim: "Project Depth",
                  score: "94%",
                  sub: "Organic Code Timeline & Authenticity",
                  proof: "Low vibe-code probability (96% organic commit distribution across 4 months).",
                  status: "Exceptional",
                },
                {
                  dim: "Industry Exposure",
                  score: "68%",
                  sub: "Production Cloud & CI/CD Tooling",
                  proof: "Missing dedicated Docker Compose & AWS deployment configs in repository root.",
                  status: "Action Required",
                },
              ].map((dna) => (
                <div
                  key={dna.dim}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: 20,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111111" }}>{dna.dim}</h4>
                      <div style={{ fontSize: 12, color: "#6B6B6B" }}>{dna.sub}</div>
                    </div>
                    <span
                      style={{
                        backgroundColor: dna.score >= "85%" ? "#EBF5F3" : "#F5F5F4",
                        color: dna.score >= "85%" ? "#176B5B" : "#18181B",
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {dna.score}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5, margin: "12px 0 0" }}>
                    <strong>Evidence:</strong> {dna.proof}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 4: OPPORTUNITY TRACKER                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "opportunities" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                  EVIDENCE-MATCHED OPPORTUNITIES
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                  Opportunity Discovery & Fit Intelligence
                </h2>
                <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                  Matches calculated against verified claims, not keyword repetition.
                </p>
              </div>

              {/* Filter tabs */}
              <div style={{ display: "flex", backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", padding: 2, borderRadius: 6 }}>
                {["All", "Internship", "Full-Time"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setOppFilter(f)}
                    style={{
                      backgroundColor: oppFilter === f ? "#18181B" : "transparent",
                      color: oppFilter === f ? "#FFFFFF" : "#6B6B6B",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 12,
                    padding: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 20,
                  }}
                >
                  <div style={{ maxWidth: 740 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#111111" }}>{opp.role}</h3>
                      <span style={{ fontSize: 11, backgroundColor: "#F5F5F4", color: "#6B6B6B", padding: "2px 8px", borderRadius: 4 }}>
                        {opp.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 12 }}>
                      <strong>{opp.company}</strong> • {opp.location} • Deadline: {opp.deadline}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                      <div>
                        <strong style={{ color: "#176B5B" }}>Matched Skills:</strong> {opp.matchedSkills.join(", ")}
                      </div>
                      <div>
                        <strong style={{ color: "#B45309" }}>Missing Skills:</strong> {opp.missingSkills.join(", ")}
                      </div>
                      <div style={{ color: "#4B5563" }}>
                        <strong>Why it matches:</strong> {opp.reason}
                      </div>
                      <div style={{ color: "#176B5B", fontWeight: 600 }}>
                        ➔ <strong>Recommended Action:</strong> {opp.nextAction}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                    <div
                      style={{
                        backgroundColor: "#EBF5F3",
                        border: "1px solid #9DD0C7",
                        color: "#176B5B",
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontSize: 18,
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      {opp.match}% Match
                    </div>
                    <Link
                      href="/interview"
                      style={{
                        backgroundColor: "#18181B",
                        color: "#FFFFFF",
                        textDecoration: "none",
                        borderRadius: 6,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Prepare Interview ➔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 5: ATS OPTIMIZATION                                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "ats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                PARSER & COMPLIANCE RIGOR
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                ATS Optimization & Job Description Cross-Referencing
              </h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                Side-by-side comparison between your resume assertions and target JD requirements.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
              {/* Left: Target Job Description */}
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", marginBottom: 6 }}>
                  TARGET JOB SPECIFICATION
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>
                  Staff Backend Engineer • High-Throughput Ingestion
                </h3>
                <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div><strong>Required Core:</strong> Python 3.11+, PostgreSQL concurrency, connection pooling.</div>
                  <div><strong>Required Scale:</strong> Experience building endpoints handling &gt;10k rps with sub-50ms p99 latency.</div>
                  <div><strong>System Design:</strong> Microservices, Redis caching layer, event-driven message queuing.</div>
                </div>
              </div>

              {/* Right: Resume Cross-Check */}
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase", marginBottom: 6 }}>
                  RESUME EVIDENCE ALIGNMENT (89% COMPLIANT)
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>
                  Before ➔ After Optimization Suggestions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                  <div style={{ padding: 12, backgroundColor: "#FAFAF9", border: "1px solid #E7E5E4", borderRadius: 6 }}>
                    <div style={{ color: "#991B1B", fontWeight: 700, marginBottom: 4 }}>Before:</div>
                    <div style={{ color: "#6B6B6B", fontStyle: "italic" }}>"Managed databases and optimized backend code."</div>
                  </div>
                  <div style={{ padding: 12, backgroundColor: "#EBF5F3", border: "1px solid #9DD0C7", borderRadius: 6 }}>
                    <div style={{ color: "#176B5B", fontWeight: 700, marginBottom: 4 }}>After (ATS Verified):</div>
                    <div style={{ color: "#18181B" }}>
                      "Configured PostgreSQL connection pool parameters and query indexing, reducing p99 response times from 140ms to 42ms under load."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 6: INTERVIEW STUDIO                                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "interview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                  PROCTORED ASSESSMENT & SOCRATIC COACH
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                  Technical Interview Studio
                </h2>
                <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                  Conducted by Alex, Google Staff Engineer Persona. Grounded directly in your repository commits.
                </p>
              </div>
              <Link
                href="/interview"
                style={{
                  backgroundColor: "#18181B",
                  color: "#FFFFFF",
                  textDecoration: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Launch Live Interview Room ➔
              </Link>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 24 }}>
                <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, padding: 16, backgroundColor: "#FAFAF9" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase" }}>Focus Area</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111111", marginTop: 4 }}>
                    Distributed Systems & Concurrency
                  </div>
                </div>
                <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, padding: 16, backgroundColor: "#FAFAF9" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase" }}>Interviewer Persona</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111111", marginTop: 4 }}>
                    Alex • Staff SWE (12 YOE at Google)
                  </div>
                </div>
                <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, padding: 16, backgroundColor: "#FAFAF9" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase" }}>Target Difficulty</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#176B5B", marginTop: 4 }}>
                    FAANG L5 (Senior Software Engineer)
                  </div>
                </div>
              </div>

              {/* Sample Question Grounding Box */}
              <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, padding: 20, backgroundColor: "#FFFFFF" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#176B5B", textTransform: "uppercase", marginBottom: 6 }}>
                  INTERVIEW PROBE SPECIFICATION
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px", color: "#111111" }}>
                  "In your distributed task queue repo, how did you handle worker heartbeat timeouts without causing duplicate execution?"
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#4B5563" }}>
                  <div>• <strong>Why this question matters:</strong> Verifies whether the candidate personally engineered the locking mechanism or relied on boilerplate.</div>
                  <div>• <strong>Resume Evidence Cross-Reference:</strong> Pull Request #14 ("Add Redis distributed redlock with TTL renewal").</div>
                  <div>• <strong>Evaluator Rubric:</strong> Technical depth (30%), edge-case handling (30%), communication clarity (20%), trade-off articulation (20%).</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 7: CAREER ROADMAP                                     */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "roadmap" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                PROGRESSIVE MILESTONES
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Career Roadmap: Current Position ➔ Placement Outcome
              </h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                Click any milestone to inspect actionable learning criteria and evidence tasks.
              </p>
            </div>

            {/* Horizontal Timeline (Desktop) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {milestones.map((m, idx) => (
                <div
                  key={m.step}
                  onClick={() => setSelectedMilestone(idx)}
                  style={{
                    backgroundColor: selectedMilestone === idx ? "#18181B" : "#FFFFFF",
                    color: selectedMilestone === idx ? "#FFFFFF" : "#18181B",
                    border: selectedMilestone === idx ? "1px solid #18181B" : "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: 16,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: selectedMilestone === idx ? "#9DD0C7" : "#176B5B" }}>
                      PHASE 0{m.step}
                    </span>
                    <span style={{ fontSize: 11, color: selectedMilestone === idx ? "#A1A1AA" : "#6B6B6B" }}>
                      {m.date}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>{m.title}</h4>
                  <div style={{ fontSize: 12, color: selectedMilestone === idx ? "#D6D3D1" : "#6B6B6B", lineHeight: 1.4 }}>
                    {m.goal}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Milestone Detail */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                ACTIVE MILESTONE SPECIFICATION
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111111", margin: "4px 0 10px" }}>
                Phase 0{milestones[selectedMilestone].step}: {milestones[selectedMilestone].title}
              </h3>
              <p style={{ fontSize: 14, color: "#4B5563", margin: "0 0 16px" }}>
                <strong>Objective:</strong> {milestones[selectedMilestone].goal}
              </p>
              <div style={{ fontSize: 13, color: "#18181B", marginBottom: 8 }}>
                <strong>Required Competencies:</strong> {milestones[selectedMilestone].skills.join(", ")}
              </div>
              <div style={{ fontSize: 13, color: "#176B5B", fontWeight: 600 }}>
                ➔ <strong>Concrete Next Action:</strong> {milestones[selectedMilestone].action}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 8: PLACEMENT CALENDAR                                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "calendar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                TIMELINE SYNCHRONIZATION
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Placement Calendar & Drive Deadlines
              </h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                Synchronized with visiting campus recruiters and national hackathon schedules.
              </p>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { date: "Oct 15, 2026", company: "Stripe", event: "SWE Intern Application Deadline", status: "Closing in 18 days" },
                  { date: "Oct 22, 2026", company: "Google", event: "Early Career Technical Round Simulation", status: "Registered" },
                  { date: "Nov 02, 2026", company: "Datadog", event: "Campus Placement Assessment Drive", status: "Shortlist Pending" },
                  { date: "Nov 18, 2026", company: "Microsoft", event: "College Placement Drive Technical Day", status: "Upcoming" },
                ].map((ev) => (
                  <div
                    key={ev.event}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      backgroundColor: "#FAFAF9",
                      border: "1px solid #E7E5E4",
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#18181B" }}>{ev.company} — {ev.event}</div>
                      <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{ev.date}</div>
                    </div>
                    <span
                      style={{
                        backgroundColor: "#EBF5F3",
                        color: "#176B5B",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 9: PROFILE                                            */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                STUDENT DOSSIER
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Candidate Profile & Academic Record
              </h2>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>Full Legal Name</label>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111111", marginTop: 4 }}>
                    {profile.fullName || "Candidate"}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>College / Institution</label>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111111", marginTop: 4 }}>
                    {profile.college}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>Degree & Specialization</label>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111111", marginTop: 4 }}>
                    {profile.degree} in {profile.branch}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>Graduation Cohort</label>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111111", marginTop: 4 }}>
                    {profile.graduationYear}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 10: SETTINGS & PRIVACY                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                GOVERNANCE & PRIVACY
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Data Privacy & Candidate Controls
              </h2>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { title: "Profile Visibility", desc: "Allow verified campus recruiters to view your Candidate DNA and verified evidence." },
                { title: "Resume Claim Proofs", desc: "Display cryptographic commit links and test benchmarks alongside your application." },
                { title: "Institution Placement Cell Access", desc: "Share placement drive participation data with your university TPO." },
                { title: "Data Portability & Deletion", desc: "Export your complete verified evidence dossier or request total data erasure." },
              ].map((setting) => (
                <div key={setting.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F5F5F4", paddingBottom: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111111" }}>{setting.title}</h4>
                    <p style={{ fontSize: 13, color: "#6B6B6B", margin: "2px 0 0" }}>{setting.desc}</p>
                  </div>
                  <button
                    style={{
                      backgroundColor: "#F5F5F4",
                      border: "1px solid #E7E5E4",
                      color: "#18181B",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
