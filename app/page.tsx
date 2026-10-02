"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Code2,
  ArrowRight,
  GitPullRequest,
  Dna,
  Users,
  Compass,
  FileCheck
} from "lucide-react";
import { Button, Badge, Card, WhyDisclosure } from "@/components/ui/design-system";

export default function Home() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
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

  const handleSelect = async (section: "student" | "recruiter" | "post") => {
    setLoadingSection(section);
    try {
      if (section === "post") {
        window.location.href = "/post";
        return;
      }

      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: section }),
      });

      if (section === "student") {
        window.location.href = "/student/dashboard";
      } else {
        window.location.href = "/recruiter/dashboard";
      }
    } catch {
      if (section === "post") window.location.href = "/post";
      else if (section === "student") window.location.href = "/student/dashboard";
      else window.location.href = "/recruiter/dashboard";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* ── TOP HEADER (Minimal, Professional) ── */}
      <header
        style={{
          borderBottom: "1px solid #E4E1DA",
          backgroundColor: "#FFFFFF",
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ maxWidth: 1280, width: "100%", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: "#162A43",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              C
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.4px", color: "#162A43" }}>
              COGNALYZE
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/post" style={{ textDecoration: "none" }}>
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 32,
                  padding: "0 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid #E4E1DA",
                  backgroundColor: "#EEF4FD",
                  color: "#356AE6",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
                className="hover:bg-[#DCE7FB]"
                title="Browse Unified Feed"
              >
                <span>📢</span>
                <span>Feed / Post</span>
              </button>
            </Link>
            {session.authenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#667085" }}>
                  Signed in as <strong>{session.user?.name || "Member"}</strong>
                </span>
                <Link href={session.user?.role === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard"}>
                  <Button variant="primary" size="sm">
                    Open Workspace →
                  </Button>
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION (Section 24: Evidence before decisions) ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", marginBottom: 16 }}>
          <Badge variant="cobalt" icon={false}>
            EVIDENCE-FIRST HIRING & CAREER INTELLIGENCE
          </Badge>
        </div>

        <h1
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.8px",
            color: "#162A43",
            margin: "0 auto 16px",
            maxWidth: 820,
          }}
        >
          Evidence before decisions.
          <br />
          <span style={{ color: "#356AE6" }}>Understand candidates beyond the resume.</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
            color: "#667085",
            maxWidth: 640,
            margin: "0 auto 32px",
            lineHeight: 1.55,
          }}
        >
          Connect resumes, projects, GitHub activity, skills, and real verified evidence into one cohesive hiring intelligence layer.
        </p>

        {/* ── THE 3 CORE ENTRY OPTIONS (Student, Recruiter, Post) ── */}
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto 56px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: 24,
            textAlign: "left",
          }}
        >
          {/* 1. STUDENT OPTION */}
          <div
            id="option-student"
            onClick={() => handleSelect("student")}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 14,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)",
              cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
            className="hover:-translate-y-1 hover:shadow-lg hover:border-[#356AE6]"
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#EEF4FD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  🎓
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                    padding: "3px 8px",
                    borderRadius: 4,
                    backgroundColor: "#EEF4FD",
                    color: "#356AE6",
                    border: "1px solid #D2E0FB",
                  }}
                >
                  STUDENT PORTAL
                </span>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "#162A43", letterSpacing: "-0.5px" }}>
                Student
              </h2>

              <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, margin: "0 0 20px" }}>
                Track opportunities, prep for interviews, build your resume.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {[
                  "Verified Opportunities & Hackathons",
                  "100% Gated 6-Stage Recruitment Sim",
                  "Striver SDE 455 DSA Mastery Tracker",
                  "6-Template Resume Builder & ATS Diagnostics",
                ].map((feat, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475467" }}>
                    <span style={{ color: "#356AE6", fontWeight: 700, fontSize: 13 }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={loadingSection !== null}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#356AE6",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(53, 106, 230, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 150ms ease",
              }}
              className="hover:bg-[#2858C7]"
            >
              <span>{loadingSection === "student" ? "Opening Student..." : "Open Student"}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* 2. RECRUITER OPTION */}
          <div
            id="option-recruiter"
            onClick={() => handleSelect("recruiter")}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 14,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)",
              cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
            className="hover:-translate-y-1 hover:shadow-lg hover:border-[#162A43]"
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#F0EFEA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  💼
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                    padding: "3px 8px",
                    borderRadius: 4,
                    backgroundColor: "#F0EFEA",
                    color: "#162A43",
                    border: "1px solid #D1CDC4",
                  }}
                >
                  ENTERPRISE SUITE
                </span>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "#162A43", letterSpacing: "-0.5px" }}>
                Recruiter
              </h2>

              <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, margin: "0 0 20px" }}>
                Manage hiring, screen candidates, run assessments.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {[
                  "5-Agent Adversarial Hiring Committee",
                  "Two-Pass Two-Tier Candidate Ranker",
                  "JD Intelligence & Nuanced Dealbreakers",
                  "Proctored Technical & Behavioral Analytics",
                ].map((feat, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475467" }}>
                    <span style={{ color: "#162A43", fontWeight: 700, fontSize: 13 }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={loadingSection !== null}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#162A43",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(22, 42, 67, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 150ms ease",
              }}
              className="hover:opacity-90"
            >
              <span>{loadingSection === "recruiter" ? "Opening Recruiter..." : "Open Recruiter"}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* 3. POST OPTION */}
          <div
            id="option-post"
            onClick={() => handleSelect("post")}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 14,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)",
              cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
            className="hover:-translate-y-1 hover:shadow-lg hover:border-[#059669]"
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#EAF4EE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  📢
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                    padding: "3px 8px",
                    borderRadius: 4,
                    backgroundColor: "#EAF4EE",
                    color: "#059669",
                    border: "1px solid #B7DFC7",
                  }}
                >
                  SHARED COMMUNITY
                </span>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "#162A43", letterSpacing: "-0.5px" }}>
                Post
              </h2>

              <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, margin: "0 0 20px" }}>
                Browse hiring posts, opportunities, and community updates.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {[
                  "Hiring Posts with Real Student Fit-Scores",
                  "Recruiter Indicators & Potential Candidate Counts",
                  "Professional Architecture & Interview Debriefs",
                  "Hackathon & Open-Source Collaboration Requests",
                ].map((feat, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475467" }}>
                    <span style={{ color: "#059669", fontWeight: 700, fontSize: 13 }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={loadingSection !== null}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#059669",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 150ms ease",
              }}
              className="hover:bg-[#047857]"
            >
              <span>{loadingSection === "post" ? "Opening Post..." : "Open Post"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ── INTERACTIVE EVIDENCE VISUALIZATION (Section 24 & 26) ── */}
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 10,
            padding: "28px",
            boxShadow: "0 2px 8px rgba(16, 24, 40, 0.04)",
            textAlign: "left",
          }}
        >
          {/* Timeline Nodes Strip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              borderBottom: "1px solid #E4E1DA",
              paddingBottom: 16,
              overflowX: "auto",
              gap: 12,
            }}
          >
            {[
              { num: 1, label: "Candidate Claim" },
              { num: 2, label: "Evidence Corroboration" },
              { num: 3, label: "Role DNA Matching" },
              { num: 4, label: "Evidence Match (Why?)" },
              { num: 5, label: "Informed Decision" },
            ].map((step) => {
              const isSelected = activeStep === step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => setActiveStep(step.num)}
                  style={{
                    background: isSelected ? "#EEF4FD" : "transparent",
                    border: isSelected ? "1px solid #356AE6" : "1px solid transparent",
                    padding: "6px 12px",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#356AE6" : "#667085",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: isSelected ? "#356AE6" : "#E4E1DA",
                      color: isSelected ? "#FFFFFF" : "#667085",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {step.num}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Node Inspection Box */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {/* Left Box: Candidate Profile & Signals */}
            <div style={{ padding: 18, backgroundColor: "#F6F5F1", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#98A2B3", letterSpacing: "0.5px", marginBottom: 8 }}>
                CANDIDATE INTELLIGENCE
              </div>
              <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#162A43" }}>
                Aarav Sharma
              </h4>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#667085" }}>
                Pre-final Year B.Tech • Target: Backend & ML Engineer
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Python / Fast-API</span>
                  <Badge variant="verified">✓ GitHub (14 repos)</Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Distributed Systems</span>
                  <Badge variant="verified">✓ Project: Cognalyze API</Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>AWS Deployment</span>
                  <Badge variant="limited">⚠ Resume claim only</Badge>
                </div>
              </div>
            </div>

            {/* Right Box: Evidence Conclusion & Why */}
            <div style={{ padding: 18, backgroundColor: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#98A2B3", letterSpacing: "0.5px" }}>
                    ROLE FIT EVALUATION
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43" }}>
                    Senior Backend Intern
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#356AE6", lineHeight: 1 }}>
                    84%
                  </div>
                  <span style={{ fontSize: 10, color: "#98A2B3", fontWeight: 600 }}>MATCH</span>
                </div>
              </div>

              {/* Signature Why Interaction */}
              <WhyDisclosure
                title="Why 84% Match?"
                summary="8 of 10 required skills are supported by verified repositories and working microservices."
                evidenceItems={[
                  { label: "Python & Data Structures corroborated via GitHub", verified: true, source: "14 repositories" },
                  { label: "Production API implementation verified in Project", verified: true, source: "Cognalyze API" },
                  { label: "Cloud infrastructure lacks independent code commit", verified: false, source: "Self-declared" },
                ]}
                evidenceLink="/recruiter/candidates/aarav"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 CORE PILLARS (Sections 13, 14, 15) ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#162A43", margin: "0 0 8px" }}>
            Complex Engine. Simple Interface.
          </h2>
          <p style={{ fontSize: 14, color: "#667085", maxWidth: 520, margin: "0 auto" }}>
            Every screen answers: What am I looking at? Why does it matter? What evidence supports it? What should I do next?
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {/* Pillar 1: Decision Room */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: "#EEF4FD", color: "#356AE6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GitPullRequest size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#162A43" }}>
                The Decision Room
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, margin: "0 0 16px" }}>
              Progressive candidate screening without black-box AI scores. Clear funnel gating from 1,000 resumes down to the 5 top-evidence finalists.
            </p>
            <div style={{ padding: "8px 12px", background: "#F6F5F1", borderRadius: 6, fontSize: 11, color: "#162A43", fontWeight: 600 }}>
              1,000 Uploaded → 342 Qualified → 86 Matches → 5 Hired
            </div>
          </Card>

          {/* Pillar 2: Candidate & Role DNA */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: "#EAF4EE", color: "#2E7D5B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Dna size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#162A43" }}>
                Candidate & Role DNA
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, margin: "0 0 16px" }}>
              Rigorous distinction between MUST HAVE and GOOD TO HAVE requirements. Living capability profiles that update continuously as projects deploy.
            </p>
            <div style={{ padding: "8px 12px", background: "#F6F5F1", borderRadius: 6, fontSize: 11, color: "#2E7D5B", fontWeight: 600 }}>
              ✓ Verified Skills • Gaps Identified • Evidence-Backed
            </div>
          </Card>

          {/* Pillar 3: Evidence Ledger */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: "#FDF6E9", color: "#B7791F", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#162A43" }}>
                Evidence-First Trust Layer
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, margin: "0 0 16px" }}>
              Every skill claim visually links to its source: GitHub commits, LeetCode performance, live apps, or flags uncorroborated resume claims.
            </p>
            <div style={{ padding: "8px 12px", background: "#F6F5F1", borderRadius: 6, fontSize: 11, color: "#B7791F", fontWeight: 600 }}>
              Zero Hallucinations • Verifiable Provenance
            </div>
          </Card>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "32px 24px", textAlign: "center", fontSize: 12, color: "#98A2B3" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, color: "#162A43" }}>COGNALYZE</span>
            <span>• Evidence-first Career & Hiring Intelligence</span>
          </div>
          <div>Linear × Stripe × Notion standard for professional recruitment</div>
        </div>
      </footer>
    </div>
  );
}