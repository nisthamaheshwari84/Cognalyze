"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [activePreviewTab, setActivePreviewTab] = useState<"student" | "recruiter" | "institution">("student");
  const [walkthroughRole, setWalkthroughRole] = useState<"student" | "recruiter">("student");
  const [activeWalkthroughStep, setActiveWalkthroughStep] = useState(0);
  const [expandedEvidence, setExpandedEvidence] = useState<number | null>(0);
  const [expandedEcosystemStage, setExpandedEcosystemStage] = useState<number>(3); // default SKILLS
  const [atsTab, setAtsTab] = useState<"before" | "after">("after");

  const [session, setSession] = useState<{
    loading: boolean;
    authenticated: boolean;
    user?: any;
    studentProfile?: any;
    recruiterProfile?: any;
  }>({ loading: true, authenticated: false });

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSession({
              loading: false,
              authenticated: !!data.authenticated,
              user: data.user,
              studentProfile: data.studentProfile,
              recruiterProfile: data.recruiterProfile,
            });
          }
        } else {
          if (isMounted) setSession({ loading: false, authenticated: false });
        }
      } catch {
        if (isMounted) setSession({ loading: false, authenticated: false });
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLaunchRole = async (targetRole: "student" | "recruiter") => {
    try {
      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      if (targetRole === "student") {
        router.push("/student/dashboard");
      } else {
        router.push("/recruiter/dashboard");
      }
    } catch {
      router.push(targetRole === "student" ? "/student/dashboard" : "/recruiter/dashboard");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({ loading: false, authenticated: false });
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Walkthrough steps definition
  const studentSteps = [
    {
      num: "01",
      title: "Resume Uploaded",
      desc: "Raw PDF or Word file is parsed into semantic nodes: projects, roles, claims, and timeline.",
      badge: "Input Extraction",
      detail: "Segmented 4 projects, 2 internships, 18 technical assertions with commit cross-references.",
    },
    {
      num: "02",
      title: "Resume Analyzed",
      desc: "Structural integrity, impact quantification, clarity, and ATS parsing readiness are scored.",
      badge: "Format & Impact",
      detail: "84/100 strength score. 12 action-oriented bullet points verified with measurable outcomes.",
    },
    {
      num: "03",
      title: "Evidence Extracted",
      desc: "Every skill claim is grounded by querying actual GitHub commits, PRs, and LeetCode activity.",
      badge: "Zero-Vibe Check",
      detail: "Python validated across 3 public repos (84 commits). Redis caching validated via test suites.",
    },
    {
      num: "04",
      title: "Opportunity Matched",
      desc: "Candidate competency profile is scored against live roles using algorithmic match parameters.",
      badge: "91% Match",
      detail: "Staff Backend @ Stripe: Matched distributed systems & PostgreSQL; gap identified in AWS Lambda.",
    },
    {
      num: "05",
      title: "Skill Gap Identified",
      desc: "Concrete deficiencies are surfaced with targeted learning materials and project assignments.",
      badge: "Gap Analysis",
      detail: "Missing: Event-driven architecture. Recommended: Build Kafka message streaming microservice.",
    },
    {
      num: "06",
      title: "Interview Prepared",
      desc: "Adaptive Socratic interview simulations generate targeted follow-ups based on candidate's code.",
      badge: "Socratic Coach",
      detail: "Alex (Staff Engineer persona) probes cache invalidation edge cases from candidate's real repo.",
    },
    {
      num: "07",
      title: "Career Action Generated",
      desc: "Insights transform into a personalized 5-step daily plan: Learn ➔ Practice ➔ Coach ➔ Interview ➔ Re-test.",
      badge: "Execution Plan",
      detail: "Daily milestone generated: Complete 2 Graph problems, review DB sharding rubric, re-run mock.",
    },
  ];

  const recruiterSteps = [
    {
      num: "01",
      title: "Job Description Ingested",
      desc: "Recruiter inputs raw job post. Cognalyze parses requirements, team context, and level expectations.",
      badge: "JD Parser",
      detail: "Extracted 5 Must-Have competencies, 4 Good-to-Have tools, and senior engineering scope signals.",
    },
    {
      num: "02",
      title: "Requirements Extracted",
      desc: "Converts text requirements into testable evidence contracts instead of keyword matching.",
      badge: "Evidence Rubrics",
      detail: "Contract: 'Distributed Systems' requires production concurrency or verified multithreaded repos.",
    },
    {
      num: "03",
      title: "Resumes Evaluated",
      desc: "Candidate applications are screened against verified evidence with anti-vibe coding detection.",
      badge: "Integrity Screening",
      detail: "Single-shot AI code dumps and fake repos flagged; authentic commit histories prioritized.",
    },
    {
      num: "04",
      title: "Candidates Compared",
      desc: "Recruiter comparison matrix displays normalized scores, evidence depth, and verified claims.",
      badge: "Decision Matrix",
      detail: "Candidate A (91%) vs Candidate B (84%) vs Candidate C (78%) side-by-side with verified signals.",
    },
    {
      num: "05",
      title: "Evidence Surfaced",
      desc: "Direct proof: commit timeline links, verbatim interview quotes, and problem-solving benchmarks.",
      badge: "Audit Proof",
      detail: "Candidate quote: 'We partitioned PostgreSQL by tenant ID to prevent connection pool exhaustion.'",
    },
    {
      num: "06",
      title: "Interview Questions Generated",
      desc: "Tailored interview probes generated directly from candidate's specific repos and reported gaps.",
      badge: "Probe Generator",
      detail: "'In your ecommerce repo, walk me through how you handled out-of-order webhook deliveries.'",
    },
    {
      num: "07",
      title: "Decision Support",
      desc: "Human-in-the-loop structured recommendation with transparent pros, concerns, and next steps.",
      badge: "Hiring Verdict",
      detail: "Recommendation: Advance to System Design Round. Focus evaluation on cloud infrastructure depth.",
    },
  ];

  const activeSteps = walkthroughRole === "student" ? studentSteps : recruiterSteps;

  // Ecosystem stages
  const ecosystemStages = [
    { name: "STUDENT", label: "Talent Entry", desc: "Authenticated candidate profile initialized with verified academic and professional credentials." },
    { name: "PROFILE", label: "Evidence Dossier", desc: "Aggregated GitHub, LeetCode, hackathon, and verified project records." },
    { name: "RESUME", label: "Semantic Parsing", desc: "Decomposed into verifiable claims, impact metrics, and ATS-compliant structures." },
    { name: "SKILLS", label: "Candidate DNA", desc: "6-dimensional competency mapping: Technical, Problem Solving, Systems, Leadership, Depth, Exposure." },
    { name: "OPPORTUNITIES", label: "Algorithmic Match", desc: "Scored against verified job descriptions, hackathons, and fellowship requirements." },
    { name: "INTERVIEWS", label: "Adaptive Studio", desc: "Socratic simulations and proctored technical rounds with real-time rubric evaluation." },
    { name: "HIRING", label: "Evidence Decision", desc: "Recruiters evaluate candidate proof matrices with human-in-the-loop audit logs." },
    { name: "CAREER OUTCOME", label: "Continuous Growth", desc: "Placement transition, quality-of-hire tracking, and progressive skill upskilling." },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", color: "#18181B" }}>
      {/* ── 1. GLOBAL NAVIGATION BAR ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #E7E5E4",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo & Wordmark */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                backgroundColor: "#18181B",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              C
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  color: "#18181B",
                  lineHeight: "18px",
                }}
              >
                COGNALYZE
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#6B6B6B",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                Hiring & Career Intelligence
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
            }}
            className="hidden md:flex"
          >
            <a
              href="#product-preview"
              style={{ fontSize: 14, fontWeight: 500, color: "#18181B", textDecoration: "none" }}
            >
              Product
            </a>
            <a
              href="#student-flow"
              style={{ fontSize: 14, fontWeight: 500, color: "#6B6B6B", textDecoration: "none" }}
            >
              For Students
            </a>
            <a
              href="#recruiter-flow"
              style={{ fontSize: 14, fontWeight: 500, color: "#6B6B6B", textDecoration: "none" }}
            >
              For Recruiters
            </a>
            <a
              href="#institution-section"
              style={{ fontSize: 14, fontWeight: 500, color: "#6B6B6B", textDecoration: "none" }}
            >
              For Institutions
            </a>
            <a
              href="#philosophy"
              style={{ fontSize: 14, fontWeight: 500, color: "#6B6B6B", textDecoration: "none" }}
            >
              Philosophy
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {session.authenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => handleLaunchRole("student")}
                  style={{
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "transform 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  Open Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: "transparent",
                    color: "#6B6B6B",
                    border: "1px solid #E7E5E4",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Link
                  href="/login"
                  style={{
                    color: "#18181B",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid transparent",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  style={{
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "8px 16px",
                    borderRadius: 8,
                    transition: "transform 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "72px 24px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Editorial Subtitle Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#F5F5F4",
            border: "1px solid #E7E5E4",
            borderRadius: 9999,
            padding: "5px 14px",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#176B5B",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#18181B",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
            }}
          >
            Evidence-Driven Career & Hiring Intelligence
          </span>
        </div>

        {/* Hero Headline */}
        <h1
          style={{
            fontSize: "clamp(36px, 5.5vw, 62px)",
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-1.5px",
            color: "#111111",
            maxWidth: 880,
            margin: "0 0 20px",
          }}
        >
          Turn career data into decisions.
        </h1>

        {/* Hero Supporting Copy */}
        <p
          style={{
            fontSize: "clamp(16px, 1.8vw, 19px)",
            fontWeight: 400,
            lineHeight: 1.55,
            color: "#6B6B6B",
            maxWidth: 680,
            margin: "0 0 32px",
          }}
        >
          Cognalyze brings resumes, opportunities, skills, interviews, and hiring intelligence into one evidence-driven career platform.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => handleLaunchRole("student")}
            style={{
              backgroundColor: "#18181B",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "13px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 150ms ease, box-shadow 150ms ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
          >
            Explore Cognalyze
          </button>
          <a
            href="#walkthrough"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#18181B",
              textDecoration: "none",
              border: "1px solid #E7E5E4",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
              transition: "background-color 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F5F4")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
          >
            See how it works
          </a>
        </div>

        {/* Trust Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 36,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 13, color: "#6B6B6B", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#176B5B", fontWeight: 700 }}>✓</span> 100% Verifiable Claims
          </span>
          <span style={{ fontSize: 13, color: "#6B6B6B", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#176B5B", fontWeight: 700 }}>✓</span> Anti-Vibe Coding Detection
          </span>
          <span style={{ fontSize: 13, color: "#6B6B6B", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#176B5B", fontWeight: 700 }}>✓</span> Zero Keyword Speculation
          </span>
        </div>
      </section>

      {/* ── 3. HERO INTERACTIVE DASHBOARD PREVIEW ── */}
      <section
        id="product-preview"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E7E5E4",
            borderRadius: 14,
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
          }}
        >
          {/* Top Window Bar */}
          <div
            style={{
              backgroundColor: "#F8F8F7",
              borderBottom: "1px solid #E7E5E4",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {/* Window Dots & Context */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#E7E5E4" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#E7E5E4" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#E7E5E4" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", letterSpacing: "0.3px" }}>
                COGNALYZE PLATFORM INTERFACE • LIVE VIEW
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: "flex",
                backgroundColor: "#EFEFEF",
                padding: 3,
                borderRadius: 8,
                gap: 2,
              }}
            >
              <button
                onClick={() => setActivePreviewTab("student")}
                style={{
                  backgroundColor: activePreviewTab === "student" ? "#FFFFFF" : "transparent",
                  color: activePreviewTab === "student" ? "#18181B" : "#6B6B6B",
                  boxShadow: activePreviewTab === "student" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                Candidate Dossier (Student)
              </button>
              <button
                onClick={() => setActivePreviewTab("recruiter")}
                style={{
                  backgroundColor: activePreviewTab === "recruiter" ? "#FFFFFF" : "transparent",
                  color: activePreviewTab === "recruiter" ? "#18181B" : "#6B6B6B",
                  boxShadow: activePreviewTab === "recruiter" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                Multi-Candidate Matrix (Recruiter)
              </button>
              <button
                onClick={() => setActivePreviewTab("institution")}
                style={{
                  backgroundColor: activePreviewTab === "institution" ? "#FFFFFF" : "transparent",
                  color: activePreviewTab === "institution" ? "#18181B" : "#6B6B6B",
                  boxShadow: activePreviewTab === "institution" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                Cohort Supply vs Demand (Institution)
              </button>
            </div>
          </div>

          {/* Interactive Workspace Body */}
          <div style={{ padding: "28px" }}>
            {activePreviewTab === "student" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
                {/* Column 1: Candidate Readiness & DNA */}
                <div
                  style={{
                    backgroundColor: "#FAFAF9",
                    border: "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: 20,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        CANDIDATE PROFILE
                      </span>
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 0", color: "#111111" }}>
                        Alex R. • Senior SWE Track
                      </h3>
                    </div>
                    <span
                      style={{
                        backgroundColor: "#EBF5F3",
                        color: "#176B5B",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      84% Readiness
                    </span>
                  </div>

                  {/* 6-Dimension Candidate DNA */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#6B6B6B" }}>Technical Depth</span>
                      <span style={{ fontWeight: 600 }}>88% • 3 production repos</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: "#E7E5E4", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: "88%", height: "100%", backgroundColor: "#176B5B" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#6B6B6B" }}>Problem Solving</span>
                      <span style={{ fontWeight: 600 }}>82% • 240+ LeetCode Medium/Hard</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: "#E7E5E4", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: "82%", height: "100%", backgroundColor: "#18181B" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#6B6B6B" }}>System Design & Concurrency</span>
                      <span style={{ fontWeight: 600 }}>76% • Verified caching layer</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: "#E7E5E4", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: "76%", height: "100%", backgroundColor: "#18181B" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#6B6B6B" }}>Project Authenticity</span>
                      <span style={{ fontWeight: 600, color: "#176B5B" }}>96% • Organic commit timeline</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: "#E7E5E4", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: "96%", height: "100%", backgroundColor: "#176B5B" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E7E5E4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#6B6B6B" }}>Evidence density: <strong>4 Verified Sources</strong></span>
                    <button
                      onClick={() => handleLaunchRole("student")}
                      style={{
                        backgroundColor: "#18181B",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      View Full Dossier
                    </button>
                  </div>
                </div>

                {/* Column 2: Verifiable Evidence Chain */}
                <div
                  style={{
                    backgroundColor: "#FAFAF9",
                    border: "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: 20,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    SCORE ➔ EVIDENCE ➔ ACTION
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 16px", color: "#111111" }}>
                    Resume Intelligence & Proof
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Item 1 */}
                    <div
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E7E5E4",
                        borderRadius: 8,
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Python & PostgreSQL Architecture</span>
                        <span style={{ fontSize: 11, color: "#176B5B", fontWeight: 700, backgroundColor: "#EBF5F3", padding: "2px 8px", borderRadius: 4 }}>
                          VERIFIED
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#6B6B6B", margin: "0 0 6px", lineHeight: 1.4 }}>
                        <strong>Evidence:</strong> Appears in 3 production repositories with 84 commits and 14 merged pull requests.
                      </p>
                      <div style={{ fontSize: 11, color: "#18181B", fontWeight: 500 }}>
                        ➔ Action: Ready for L5 Technical Bar without further verification.
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E7E5E4",
                        borderRadius: 8,
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Docker & Kubernetes Deployment</span>
                        <span style={{ fontSize: 11, color: "#B45309", fontWeight: 700, backgroundColor: "#FEF3C7", padding: "2px 8px", borderRadius: 4 }}>
                          CLAIMED (UNVERIFIED)
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#6B6B6B", margin: "0 0 6px", lineHeight: 1.4 }}>
                        <strong>Evidence:</strong> Claimed on resume but no CI/CD configuration files found in linked repositories.
                      </p>
                      <div style={{ fontSize: 11, color: "#B45309", fontWeight: 500 }}>
                        ➔ Action: Add Dockerfile and GitHub Actions workflow to verify.
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#6B6B6B" }}>
                    <span>ATS Compatibility: <strong>89% Match</strong></span>
                    <span style={{ color: "#176B5B" }}>Zero Keyword Penalties</span>
                  </div>
                </div>

                {/* Column 3: Opportunity Match & Recruiter Decision */}
                <div
                  style={{
                    backgroundColor: "#FAFAF9",
                    border: "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: 20,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    MATCH ➔ REASON ➔ GAP ➔ ACTION
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 16px", color: "#111111" }}>
                    Opportunity Match
                  </h3>

                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E7E5E4",
                      borderRadius: 8,
                      padding: "14px",
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#18181B" }}>Staff Backend Engineer</div>
                        <div style={{ fontSize: 12, color: "#6B6B6B" }}>Stripe • Concurrency Team</div>
                      </div>
                      <span
                        style={{
                          backgroundColor: "#EBF5F3",
                          color: "#176B5B",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        91% Match
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#18181B", marginBottom: 6 }}>
                      <strong>Why:</strong> Strong multi-threaded DB connection pooling proof matches high-throughput requirements.
                    </div>
                    <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 6 }}>
                      <strong>Gap:</strong> Missing AWS Lambda serverless execution track record.
                    </div>
                    <div style={{ fontSize: 11, color: "#176B5B", fontWeight: 600 }}>
                      ➔ Next Action: Complete Event-Driven Architecture Module in Interview Studio.
                    </div>
                  </div>

                  {/* Recruiter Signal Box */}
                  <div
                    style={{
                      backgroundColor: "#F5F5F4",
                      borderLeft: "3px solid #18181B",
                      padding: "10px 12px",
                      borderRadius: "0 6px 6px 0",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#18181B", textTransform: "uppercase", marginBottom: 2 }}>
                      Recruiter Decision Engine Signal
                    </div>
                    <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.4 }}>
                      "Candidate exhibits high technical authenticity. Recommend advancing to live System Design round with priority flag."
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "recruiter" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111111" }}>
                      Multi-Candidate Comparison Matrix
                    </h3>
                    <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 0" }}>
                      Role: Staff Systems Engineer (L5) • 3 candidates ranked by verifiable evidence
                    </p>
                  </div>
                  <button
                    onClick={() => handleLaunchRole("recruiter")}
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
                    Open Recruiter Suite
                  </button>
                </div>

                <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F8F8F7", borderBottom: "1px solid #E7E5E4", color: "#6B6B6B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <th style={{ padding: "12px 16px" }}>Candidate</th>
                        <th style={{ padding: "12px 16px" }}>Match</th>
                        <th style={{ padding: "12px 16px" }}>Must-Have Skills</th>
                        <th style={{ padding: "12px 16px" }}>Verifiable Evidence</th>
                        <th style={{ padding: "12px 16px" }}>Skill Gaps</th>
                        <th style={{ padding: "12px 16px" }}>Vibe-Code Risk</th>
                        <th style={{ padding: "12px 16px" }}>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #E7E5E4", backgroundColor: "#FFFFFF" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                          Candidate A (Alex R.)
                          <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 400 }}>ABESEC • CSE</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ backgroundColor: "#EBF5F3", color: "#176B5B", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>
                            91%
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#18181B" }}>
                          ✓ Python, Distributed DB, Concurrency
                        </td>
                        <td style={{ padding: "14px 16px", color: "#6B6B6B" }}>
                          3 repos, 84 commits, live test benchmarks
                        </td>
                        <td style={{ padding: "14px 16px", color: "#6B6B6B" }}>
                          AWS Lambda
                        </td>
                        <td style={{ padding: "14px 16px", color: "#176B5B", fontWeight: 600 }}>
                          Low (4%)
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ backgroundColor: "#18181B", color: "#FFFFFF", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            Fast-Track Round 2
                          </span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #E7E5E4", backgroundColor: "#FAFAF9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                          Candidate B (Priya S.)
                          <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 400 }}>DTU • IT</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ backgroundColor: "#EBF5F3", color: "#176B5B", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>
                            84%
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#18181B" }}>
                          ✓ Python, Node.js, Redis
                        </td>
                        <td style={{ padding: "14px 16px", color: "#6B6B6B" }}>
                          1 repo (12 PRs), LeetCode Knight (2040)
                        </td>
                        <td style={{ padding: "14px 16px", color: "#6B6B6B" }}>
                          PostgreSQL sharding
                        </td>
                        <td style={{ padding: "14px 16px", color: "#176B5B", fontWeight: 600 }}>
                          Low (8%)
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ backgroundColor: "#E7E5E4", color: "#18181B", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            Technical Screen
                          </span>
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: "#FFFFFF" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                          Candidate C (Rohan M.)
                          <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 400 }}>NSUT • ECE</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ backgroundColor: "#FEF3C7", color: "#B45309", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>
                            76%
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#18181B" }}>
                          ✓ Python, React (Missing: Concurrency)
                        </td>
                        <td style={{ padding: "14px 16px", color: "#6B6B6B" }}>
                          2 repos (single-day commit bursts)
                        </td>
                        <td style={{ padding: "14px 16px", color: "#6B6B6B" }}>
                          Distributed Systems
                        </td>
                        <td style={{ padding: "14px 16px", color: "#B45309", fontWeight: 600 }}>
                          Moderate (42%)
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ backgroundColor: "#F5F5F4", color: "#6B6B6B", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                            Hold for Review
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePreviewTab === "institution" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111111" }}>
                      Institutional Placement Readiness & Skill Supply Analysis
                    </h3>
                    <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 0" }}>
                      Cohort: 2026 Batch (480 Students) • Industry Demand vs Cohort Evidence
                    </p>
                  </div>
                  <Link
                    href="/institution"
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
                    Explore Institution Portal
                  </Link>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                  <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, padding: 16, backgroundColor: "#FFFFFF" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase" }}>Cohort Placement Readiness</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "#111111", margin: "8px 0" }}>74.2%</div>
                    <div style={{ fontSize: 12, color: "#176B5B", fontWeight: 500 }}>↑ +14% after automated evidence coaching</div>
                  </div>
                  <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, padding: 16, backgroundColor: "#FFFFFF" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase" }}>Primary Deficit</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#B45309", margin: "8px 0" }}>System Design & Cloud</div>
                    <div style={{ fontSize: 12, color: "#6B6B6B" }}>Only 28% of cohort has verified distributed proofs</div>
                  </div>
                  <div style={{ border: "1px solid #E7E5E4", borderRadius: 8, padding: 16, backgroundColor: "#FFFFFF" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase" }}>Verified Interview Clearance</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "#176B5B", margin: "8px 0" }}>82.6%</div>
                    <div style={{ fontSize: 12, color: "#6B6B6B" }}>Based on 1,240 proctored technical evaluations</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. PRODUCT PHILOSOPHY SECTION ── */}
      <section
        id="philosophy"
        style={{
          borderTop: "1px solid #E7E5E4",
          borderBottom: "1px solid #E7E5E4",
          backgroundColor: "#FFFFFF",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ maxWidth: 720, marginBottom: 54 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#176B5B", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              PRODUCT PHILOSOPHY
            </span>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 700,
                letterSpacing: "-1px",
                color: "#111111",
                margin: "8px 0 16px",
              }}
            >
              Less guessing. More evidence.
            </h2>
            <p style={{ fontSize: 16, color: "#6B6B6B", lineHeight: 1.6, margin: 0 }}>
              Traditional hiring and career advice relies on keyword matching, self-proclaimed skills, and arbitrary filters. Cognalyze replaces speculation with verifiable data.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            {/* Principle 01 */}
            <div
              style={{
                borderLeft: "2px solid #18181B",
                paddingLeft: 24,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: "#18181B", marginBottom: 12, letterSpacing: "-0.5px" }}>
                01 — Evidence
              </div>
              <p style={{ fontSize: 15, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                Every important recommendation is connected to actual candidate or opportunity data. No score exists without an underlying proof point.
              </p>
            </div>

            {/* Principle 02 */}
            <div
              style={{
                borderLeft: "2px solid #18181B",
                paddingLeft: 24,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: "#18181B", marginBottom: 12, letterSpacing: "-0.5px" }}>
                02 — Context
              </div>
              <p style={{ fontSize: 15, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                Skills are evaluated in context rather than as isolated keywords. We examine commit histories, project complexity, and interview reasoning depth.
              </p>
            </div>

            {/* Principle 03 */}
            <div
              style={{
                borderLeft: "2px solid #18181B",
                paddingLeft: 24,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: "#18181B", marginBottom: 12, letterSpacing: "-0.5px" }}>
                03 — Action
              </div>
              <p style={{ fontSize: 15, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                Insights turn into concrete next steps. Instead of generic advice, Cognalyze prescribes exact projects, problem sets, and interview preparations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. THE COGNALYZE ECOSYSTEM (INTERACTIVE) ── */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#176B5B", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            CONNECTED WORKSPACE
          </span>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 700, letterSpacing: "-0.8px", color: "#111111", margin: "8px 0 12px" }}>
            The Cognalyze Ecosystem
          </h2>
          <p style={{ fontSize: 15, color: "#6B6B6B", margin: 0 }}>
            Not an isolated set of tools. An integrated progression where every stage informs the next.
          </p>
        </div>

        {/* Horizontal Ecosystem Flow */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 8,
            marginBottom: 28,
          }}
        >
          {ecosystemStages.map((stage, idx) => (
            <button
              key={stage.name}
              onClick={() => setExpandedEcosystemStage(idx)}
              style={{
                backgroundColor: expandedEcosystemStage === idx ? "#18181B" : "#FFFFFF",
                color: expandedEcosystemStage === idx ? "#FFFFFF" : "#18181B",
                border: expandedEcosystemStage === idx ? "1px solid #18181B" : "1px solid #E7E5E4",
                borderRadius: 8,
                padding: "12px 10px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: expandedEcosystemStage === idx ? "#9DD0C7" : "#176B5B", letterSpacing: "0.5px" }}>
                STAGE 0{idx + 1}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                {stage.name}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Stage Detail Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E7E5E4",
            borderRadius: 12,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {ecosystemStages[expandedEcosystemStage].label}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111111", margin: "4px 0 8px" }}>
              Stage 0{expandedEcosystemStage + 1}: {ecosystemStages[expandedEcosystemStage].name}
            </h3>
            <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0, maxWidth: 640 }}>
              {ecosystemStages[expandedEcosystemStage].desc}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => handleLaunchRole("student")}
              style={{
                backgroundColor: "#18181B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 6,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Launch in Workspace ➔
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. DUAL PRODUCT WALKTHROUGH ── */}
      <section
        id="walkthrough"
        style={{
          borderTop: "1px solid #E7E5E4",
          backgroundColor: "#F8F8F7",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Section Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 40 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#176B5B", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                END-TO-END METHODOLOGY
              </span>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 700, letterSpacing: "-0.8px", color: "#111111", margin: "8px 0 0" }}>
                Product Walkthrough
              </h2>
            </div>

            {/* Toggle: Student vs Recruiter */}
            <div
              style={{
                display: "flex",
                backgroundColor: "#E7E5E4",
                padding: 3,
                borderRadius: 8,
              }}
            >
              <button
                onClick={() => {
                  setWalkthroughRole("student");
                  setActiveWalkthroughStep(0);
                }}
                style={{
                  backgroundColor: walkthroughRole === "student" ? "#FFFFFF" : "transparent",
                  color: walkthroughRole === "student" ? "#18181B" : "#6B6B6B",
                  boxShadow: walkthroughRole === "student" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                For Students (01 - 07)
              </button>
              <button
                onClick={() => {
                  setWalkthroughRole("recruiter");
                  setActiveWalkthroughStep(0);
                }}
                style={{
                  backgroundColor: walkthroughRole === "recruiter" ? "#FFFFFF" : "transparent",
                  color: walkthroughRole === "recruiter" ? "#18181B" : "#6B6B6B",
                  boxShadow: walkthroughRole === "recruiter" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                For Recruiters (01 - 07)
              </button>
            </div>
          </div>

          {/* Stepper Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
            {/* Left: Step Selector List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeSteps.map((step, idx) => (
                <div
                  key={step.num}
                  onClick={() => setActiveWalkthroughStep(idx)}
                  style={{
                    backgroundColor: activeWalkthroughStep === idx ? "#FFFFFF" : "transparent",
                    border: activeWalkthroughStep === idx ? "1px solid #18181B" : "1px solid #E7E5E4",
                    borderRadius: 8,
                    padding: "14px 18px",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: activeWalkthroughStep === idx ? "#176B5B" : "#A1A1AA",
                        fontFamily: "monospace",
                      }}
                    >
                      {step.num}
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#18181B" }}>{step.title}</div>
                      <div style={{ fontSize: 12, color: "#6B6B6B" }}>{step.badge}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 16, color: activeWalkthroughStep === idx ? "#18181B" : "#D6D3D1" }}>
                    ➔
                  </span>
                </div>
              ))}
            </div>

            {/* Right: Step Execution Showcase Panel */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E7E5E4",
                borderRadius: 12,
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                    EXECUTION STEP {activeSteps[activeWalkthroughStep].num}
                  </span>
                  <span style={{ backgroundColor: "#F5F5F4", color: "#18181B", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    {activeSteps[activeWalkthroughStep].badge}
                  </span>
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "0 0 12px" }}>
                  {activeSteps[activeWalkthroughStep].title}
                </h3>
                <p style={{ fontSize: 15, color: "#4B5563", lineHeight: 1.6, margin: "0 0 24px" }}>
                  {activeSteps[activeWalkthroughStep].desc}
                </p>

                {/* Evidence Box */}
                <div
                  style={{
                    backgroundColor: "#FAFAF9",
                    border: "1px solid #E7E5E4",
                    borderRadius: 8,
                    padding: 18,
                    marginBottom: 24,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", marginBottom: 6 }}>
                    Grounded Output Example
                  </div>
                  <div style={{ fontSize: 13, color: "#18181B", lineHeight: 1.5, fontFamily: "monospace" }}>
                    {activeSteps[activeWalkthroughStep].detail}
                  </div>
                </div>
              </div>

              {/* Navigation between steps */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E7E5E4", paddingTop: 16 }}>
                <button
                  disabled={activeWalkthroughStep === 0}
                  onClick={() => setActiveWalkthroughStep(Math.max(0, activeWalkthroughStep - 1))}
                  style={{
                    backgroundColor: "transparent",
                    color: activeWalkthroughStep === 0 ? "#D6D3D1" : "#18181B",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: activeWalkthroughStep === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Previous Step
                </button>
                <button
                  disabled={activeWalkthroughStep === activeSteps.length - 1}
                  onClick={() => setActiveWalkthroughStep(Math.min(activeSteps.length - 1, activeWalkthroughStep + 1))}
                  style={{
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: activeWalkthroughStep === activeSteps.length - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Next Step →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FEATURE DEEP DIVE: RESUME INTELLIGENCE & ATS ── */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 760, marginBottom: 44 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#176B5B", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            EVIDENCE-BASED RESUME ENGINE
          </span>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 700, letterSpacing: "-0.8px", color: "#111111", margin: "8px 0 12px" }}>
            Resume Intelligence: Score ➔ Evidence ➔ Action
          </h2>
          <p style={{ fontSize: 15, color: "#6B6B6B", margin: 0 }}>
            Every score has supporting evidence. Not a black-box percentage, but exact project references and clear corrective actions.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {/* Left: Interactive Evidence Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                title: "Skill Coverage — 82%",
                matched: ["Python", "React", "PostgreSQL"],
                missing: ["Docker", "AWS"],
                evidence: "Python appears in 3 projects and 2 experience entries with 84 commits.",
                action: "Add container deployment proof to project README.",
              },
              {
                title: "Impact Quantification — 78%",
                matched: ["Latency reduced by 35%", "50K daily active queries"],
                missing: ["Cost reduction metric"],
                evidence: "Quantified performance gains in experience section; project bullets lack scale indicators.",
                action: "Specify throughput or dataset volume in project descriptions.",
              },
              {
                title: "Authentic Commit Timeline — 94%",
                matched: ["Multi-month organic development", "Meaningful git diffs"],
                missing: ["None"],
                evidence: "Commits spread across 4 months with continuous unit testing and peer code reviews.",
                action: "Ready for senior recruiter technical verification.",
              },
            ].map((item, idx) => (
              <div
                key={item.title}
                onClick={() => setExpandedEvidence(expandedEvidence === idx ? null : idx)}
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
                  <span style={{ fontSize: 14, color: "#6B6B6B" }}>
                    {expandedEvidence === idx ? "▲" : "▼"}
                  </span>
                </div>

                {expandedEvidence === idx && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F5F5F4" }}>
                    <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 12 }}>
                      <div>
                        <span style={{ color: "#6B6B6B" }}>Matched: </span>
                        <strong style={{ color: "#176B5B" }}>{item.matched.join(", ")}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#6B6B6B" }}>Missing: </span>
                        <strong style={{ color: "#B45309" }}>{item.missing.join(", ")}</strong>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#18181B", marginBottom: 8, lineHeight: 1.4 }}>
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

          {/* Right: ATS Before vs After Workspace */}
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
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase" }}>
                  ATS OPTIMIZATION WORKSPACE
                </span>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: "2px 0 0", color: "#111111" }}>
                  Side-by-Side Verification
                </h4>
              </div>
              <div style={{ display: "flex", backgroundColor: "#F5F5F4", padding: 2, borderRadius: 6 }}>
                <button
                  onClick={() => setAtsTab("before")}
                  style={{
                    backgroundColor: atsTab === "before" ? "#FFFFFF" : "transparent",
                    color: atsTab === "before" ? "#18181B" : "#6B6B6B",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Before
                </button>
                <button
                  onClick={() => setAtsTab("after")}
                  style={{
                    backgroundColor: atsTab === "after" ? "#FFFFFF" : "transparent",
                    color: atsTab === "after" ? "#18181B" : "#6B6B6B",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  After (Evidence-Optimized)
                </button>
              </div>
            </div>

            {atsTab === "before" ? (
              <div style={{ backgroundColor: "#FAFAF9", border: "1px dashed #D6D3D1", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>
                  VAGUE & UNVERIFIABLE BULLET
                </div>
                <p style={{ fontSize: 13, color: "#6B6B6B", margin: 0, fontStyle: "italic" }}>
                  "Worked on backend APIs using Python and helped the database run faster for users."
                </p>
                <div style={{ marginTop: 12, fontSize: 11, color: "#B45309" }}>
                  ⚠ Deficit: No metric, no tool specificity, fails ATS parsing for PostgreSQL & redis keywords.
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: "#EBF5F3", border: "1px solid #9DD0C7", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", marginBottom: 6 }}>
                  GROUNDED & ATS-VERIFIED BULLET
                </div>
                <p style={{ fontSize: 13, color: "#18181B", margin: 0, lineHeight: 1.4 }}>
                  "Engineered asynchronous Python (FastAPI) ingestion pipelines backed by PostgreSQL connection pooling, reducing API p99 latency by 38% under 25,000 req/sec."
                </p>
                <div style={{ marginTop: 12, fontSize: 11, color: "#176B5B", fontWeight: 600 }}>
                  ✓ Passed: 100% matched to Staff JD requirements with verifiable GitHub test benchmarks.
                </div>
              </div>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E7E5E4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#6B6B6B" }}>ATS Compatibility Jump: <strong>54% ➔ 91%</strong></span>
              <button
                onClick={() => handleLaunchRole("student")}
                style={{
                  backgroundColor: "#18181B",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Analyze My Resume ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. INSTITUTION & COLLEGE EXPERIENCE ── */}
      <section
        id="institution-section"
        style={{
          borderTop: "1px solid #E7E5E4",
          borderBottom: "1px solid #E7E5E4",
          backgroundColor: "#FFFFFF",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 40 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#176B5B", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                UNIVERSITIES & PLACEMENT CELLS
              </span>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 700, letterSpacing: "-0.8px", color: "#111111", margin: "8px 0 0" }}>
                Institution Intelligence
              </h2>
            </div>
            <Link
              href="/institution"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#18181B",
                textDecoration: "none",
                border: "1px solid #E7E5E4",
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              View Institution Dashboard ➔
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div style={{ border: "1px solid #E7E5E4", borderRadius: 10, padding: 24, backgroundColor: "#FAFAF9" }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#111111", margin: "0 0 8px" }}>
                Cohort Skill Gap Analysis
              </h4>
              <p style={{ fontSize: 13, color: "#6B6B6B", margin: "0 0 16px", lineHeight: 1.5 }}>
                Directly compare what visiting campus recruiters demand vs what your student body has actually demonstrated.
              </p>
              <div style={{ fontSize: 12, color: "#18181B", display: "flex", flexDirection: "column", gap: 6 }}>
                <div>• Industry Demand: <strong>Cloud Architecture (84%)</strong></div>
                <div>• Student Supply: <strong>Verified Proofs (28%)</strong></div>
                <div style={{ color: "#B45309", fontWeight: 600 }}>➔ Automated Curriculum Intervention Generated</div>
              </div>
            </div>

            <div style={{ border: "1px solid #E7E5E4", borderRadius: 10, padding: 24, backgroundColor: "#FAFAF9" }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#111111", margin: "0 0 8px" }}>
                Automated Placement Drives
              </h4>
              <p style={{ fontSize: 13, color: "#6B6B6B", margin: "0 0 16px", lineHeight: 1.5 }}>
                Sync company criteria directly with eligible candidate dossiers. Eliminate spreadsheet errors and manual shortlisting.
              </p>
              <div style={{ fontSize: 12, color: "#18181B", display: "flex", flexDirection: "column", gap: 6 }}>
                <div>• 1-Click Shortlist Generation</div>
                <div>• Automated Candidate Integrity Audit</div>
                <div style={{ color: "#176B5B", fontWeight: 600 }}>➔ 80% Reduction in TPO Operations Time</div>
              </div>
            </div>

            <div style={{ border: "1px solid #E7E5E4", borderRadius: 10, padding: 24, backgroundColor: "#FAFAF9" }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#111111", margin: "0 0 8px" }}>
                Accreditation & NAAC Proofs
              </h4>
              <p style={{ fontSize: 13, color: "#6B6B6B", margin: "0 0 16px", lineHeight: 1.5 }}>
                Export audit-ready outcome attainment reports with cryptographic verification chains for institutional compliance.
              </p>
              <div style={{ fontSize: 12, color: "#18181B", display: "flex", flexDirection: "column", gap: 6 }}>
                <div>• Outcome Attainment Matrices</div>
                <div>• Longitudinal Salary & Placement Records</div>
                <div style={{ color: "#176B5B", fontWeight: 600 }}>➔ 100% Verifiable Compliance Data</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. CALL TO ACTION ── */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "96px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(30px, 4.5vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-1px",
            color: "#111111",
            margin: "0 0 16px",
          }}
        >
          Start making decisions with evidence.
        </h2>
        <p style={{ fontSize: 16, color: "#6B6B6B", maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.5 }}>
          Join universities, candidates, and hiring managers using Cognalyze to replace guesswork with verified talent intelligence.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => handleLaunchRole("student")}
            style={{
              backgroundColor: "#18181B",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "13px 26px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Launch Student Portal
          </button>
          <button
            onClick={() => handleLaunchRole("recruiter")}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#18181B",
              border: "1px solid #E7E5E4",
              borderRadius: 8,
              padding: "13px 26px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Launch Recruiter Workspace
          </button>
        </div>
      </section>

      {/* ── 10. EDITORIAL FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid #E7E5E4",
          backgroundColor: "#FFFFFF",
          padding: "48px 24px 36px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 36,
            marginBottom: 36,
          }}
        >
          {/* Brand Info */}
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  backgroundColor: "#18181B",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                C
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.5px" }}>COGNALYZE</span>
            </div>
            <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.5, margin: 0 }}>
              The evidence-driven career development and hiring intelligence platform. Built for students, hiring teams, and academic institutions.
            </p>
          </div>

          {/* Links Columns */}
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#18181B", textTransform: "uppercase", marginBottom: 12 }}>
                Workspaces
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <li><Link href="/student/dashboard" style={{ color: "#6B6B6B", textDecoration: "none" }}>Student Command Center</Link></li>
                <li><Link href="/recruiter/dashboard" style={{ color: "#6B6B6B", textDecoration: "none" }}>Recruiter Intelligence</Link></li>
                <li><Link href="/institution" style={{ color: "#6B6B6B", textDecoration: "none" }}>Institution Experience</Link></li>
                <li><Link href="/interview" style={{ color: "#6B6B6B", textDecoration: "none" }}>Technical Interview Studio</Link></li>
              </ul>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#18181B", textTransform: "uppercase", marginBottom: 12 }}>
                Methodology
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <li><a href="#philosophy" style={{ color: "#6B6B6B", textDecoration: "none" }}>Evidence vs Keywords</a></li>
                <li><a href="#walkthrough" style={{ color: "#6B6B6B", textDecoration: "none" }}>Anti-Vibe Coding</a></li>
                <li><a href="#walkthrough" style={{ color: "#6B6B6B", textDecoration: "none" }}>Socratic Assessment</a></li>
                <li><a href="#product-preview" style={{ color: "#6B6B6B", textDecoration: "none" }}>Zero-Hallucination Contract</a></li>
              </ul>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#18181B", textTransform: "uppercase", marginBottom: 12 }}>
                Compliance
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <li><span style={{ color: "#6B6B6B" }}>SOC2 Type II Aligned</span></li>
                <li><span style={{ color: "#6B6B6B" }}>Zero AI Data Sharing</span></li>
                <li><span style={{ color: "#6B6B6B" }}>Audit-Grade Transcripts</span></li>
                <li><span style={{ color: "#6B6B6B" }}>Cryptographic Evidence</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            borderTop: "1px solid #E7E5E4",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12,
            color: "#A1A1AA",
          }}
        >
          <div>© {new Date().getFullYear()} Cognalyze Technologies Inc. All rights reserved.</div>
          <div style={{ display: "flex", gap: 16 }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}