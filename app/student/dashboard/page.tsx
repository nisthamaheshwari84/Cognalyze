"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { formatOpportunitySchedule } from "@/lib/ai/placement-intelligence";

interface Recommendation {
  opportunity_id: string;
  fit_score: number;
  matching_tags: string[];
  missing_tags: string[];
  reasoning: string;
  status: string;
  opportunity: {
    id: string;
    title: string;
    type: string;
    organizer: string;
    organizer_type: string;
    tags: string[];
    domain_tags: string[];
    tier: string;
    deadline: string | null;
    eligibility: string;
    source_url?: string;
  };
}

export default function StudentDashboardOverview() {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    loadData(stored);
  }, []);

  const loadData = async (cId: string) => {
    setLoading(true);
    try {
      const profRes = await fetch(`/api/student/onboarding?candidateId=${cId}`);
      const profData = await profRes.json();
      if (profData.profile) {
        setProfile(profData.profile);
      }

      const recRes = await fetch(`/api/recommendations?candidateId=${cId}&limit=6`);
      const recData = await recRes.json();
      if (recData.recommendations) {
        setRecommendations(recData.recommendations);
      }
    } catch (err) {
      console.error("Error loading student dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const studentModules = [
    {
      title: "FAANG AI Mock Interview",
      desc: "Flagship 1-on-1 with Alex: interactive 3D face, live voice speech TTS/STT, camera face oval, and 7-axis precision scoring.",
      href: "/interview",
      icon: "🎙️",
      tag: "Alex AI · Vision & Voice",
      color: "#ec4899"
    },
    {
      title: "Full Recruitment Simulation",
      desc: "5-round end-to-end recruitment journey: Resume screening, OA coding, GD debate, Tech & HR interviews.",
      href: "/student/simulation",
      icon: "🏆",
      tag: "Flagship 5-Stage",
      color: "#8b5cf6"
    },
    {
      title: "Opportunity Tracker",
      desc: "50+ verified campus drives, internships, and hackathons with algorithmic fit scores.",
      href: "/student/opportunities",
      icon: "🎯",
      tag: "Live Drives",
      color: "#6366f1"
    },
    {
      title: "Resume Workspace",
      desc: "Build ATS-optimized resumes with 6 templates + run deep keyword & evidence diagnostics.",
      href: "/student/resume",
      icon: "📄",
      tag: "Builder + ATS Check",
      color: "#f43f5e"
    },
    {
      title: "DSA Tracker",
      desc: "Structured Striver SDE Sheet progression, company readiness score & revision queues.",
      href: "/student/dsa-tracker",
      icon: "⚡",
      tag: "SDE Sheet Ready",
      color: "#10b981"
    },
    {
      title: "All Prep Arenas",
      desc: "Audio interviews with Alex (CS), Priya (HR), System Design Studio, Aptitude Papers & GD Arena.",
      href: "/student/interview-prep",
      icon: "🏛️",
      tag: "6 Interactive Arenas",
      color: "#38bdf8"
    },
    {
      title: "Application Pipeline",
      desc: "Track status across Applied, Online Assessment, Technical Screen, and Offer stages.",
      href: "/student/applications",
      icon: "📋",
      tag: "Pipeline Kanban",
      color: "#a855f7"
    },
    {
      title: "Placement Calendar",
      desc: "Real-time deadlines, interview slots, exam dates with iCal & Google Calendar export.",
      href: "/student/calendar",
      icon: "📅",
      tag: "Sync & Export",
      color: "#f59e0b"
    },
    {
      title: "Question Bank Archive",
      desc: "21+ CS core technical questions, 16+ HR STAR dilemmas & 42+ company aptitude papers.",
      href: "/student/question-bank",
      icon: "📚",
      tag: "Searchable Bank",
      color: "#06b6d4"
    }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HERO BANNER */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: 20,
            padding: "32px",
            marginBottom: 32,
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div style={{ maxWidth: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#818cf8", fontWeight: 800 }}>
                  STUDENT PLACEMENT COPILOT
                </span>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,0.15)", color: "#34d399", fontWeight: 700 }}>
                  Active Candidate: {profile?.anonymized_name || candidateId}
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: 900, margin: "0 0 10px", letterSpacing: "-1px" }}>
                Welcome to Your Placement Command Center
              </h1>

              <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6, margin: "0 0 20px" }}>
                Track-aware campus readiness designed to balance Mass Service safety (TCS, Infosys, Wipro) with Product ambition (Amazon, Google, Razorpay). Select a workspace below to begin your prep.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  href="/interview"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 800,
                    boxShadow: "0 4px 15px rgba(236,72,153,0.4)"
                  }}
                >
                  🎙️ FAANG AI Mock Interview (Live Vision & Voice)
                </Link>
                <Link
                  href="/student/simulation"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 800,
                    boxShadow: "0 4px 15px rgba(99,102,241,0.3)"
                  }}
                >
                  🏆 Full Pipeline Sim
                </Link>
                <Link
                  href="/student/interview-prep"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  🏛️ All Arenas
                </Link>
                <Link
                  href="/student/opportunities"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700
                  }}
                >
                  🎯 Matched Drives
                </Link>
              </div>
            </div>

            {/* Quick Metrics Capsule */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minWidth: 220
              }}
            >
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                Live Readiness Stats
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#38bdf8" }}>50+</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Verified Campus Openings</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#34d399" }}>4/5</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Active Mock Arenas Ready</div>
              </div>
            </div>
          </div>
        </div>

        {/* 7 CORE STUDENT WORKSPACES */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Student Placement Modules
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 350px), 1fr))", gap: 16 }}>
            {studentModules.map(m => (
              <Link
                key={m.href}
                href={m.href}
                style={{
                  textDecoration: "none",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{m.icon}</span>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: m.color, fontWeight: 800, border: `1px solid ${m.color}30` }}>
                      {m.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 6px" }}>
                    {m.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                    {m.desc}
                  </p>
                </div>
                <div style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: m.color, display: "flex", alignItems: "center", gap: 4 }}>
                  Open Workspace ➔
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* TOP RECOMMENDED OPPORTUNITIES PREVIEW */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
              Top Algorithmic Matches For You
            </div>
            <Link href="/student/opportunities" style={{ color: "#818cf8", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              View All 50+ Drives ➔
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 16 }}>
            {recommendations.slice(0, 3).map(rec => (
              <div
                key={rec.opportunity_id}
                style={{
                  padding: "18px",
                  borderRadius: 14,
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16
                }}
              >
                <div>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#818cf8", fontWeight: 800 }}>
                    {rec.opportunity.tier || "Tier 1"}
                  </span>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: "white", margin: "6px 0 2px" }}>
                    {rec.opportunity.title}
                  </h4>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {rec.opportunity.organizer}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: rec.fit_score >= 80 ? "#34d399" : "#fbbf24" }}>
                    {rec.fit_score}%
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>MATCH</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
