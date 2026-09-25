"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import ResumeUploadModal from "@/components/student/overview/ResumeUploadModal";
import EditStudentDnaModal from "@/components/student/overview/EditStudentDnaModal";
import UpdateProfileModal from "@/components/student/overview/UpdateProfileModal";
import OpportunityMatchModal from "@/components/student/overview/OpportunityMatchModal";
import { StudentDNAProfile } from "@/lib/intelligence/student-intelligence";
import { CalendarEventItem } from "@/app/api/student/calendar/route";

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
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [loading, setLoading] = useState(true);

  // Authenticated Student Profile State
  const [profile, setProfile] = useState({
    fullName: "Nistha Maheshwari",
    firstName: "Nistha",
    college: "ABES Engineering College",
    degree: "B.Tech",
    branch: "CSE · AI & ML",
    graduationYear: "2026",
    avatarInitials: "NM"
  });

  // Intelligence & Backend Data
  const [intelligence, setIntelligence] = useState<StudentDNAProfile | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [applicationsCount, setApplicationsCount] = useState<number>(12);

  // Modals State
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [editDnaModalOpen, setEditDnaModalOpen] = useState(false);
  const [updateProfileModalOpen, setUpdateProfileModalOpen] = useState(false);
  const [selectedOppForModal, setSelectedOppForModal] = useState<any | null>(null);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("cognalyze_student_id") || "student-demo"
        : "student-demo";
    setCandidateId(stored);
    loadAllData(stored);
  }, []);

  const loadAllData = async (cId: string) => {
    setLoading(true);
    try {
      // 1. Session & Student Profile
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated && sessionData.studentProfile) {
          const sp = sessionData.studentProfile;
          const fullName = sp.fullName || "Nistha Maheshwari";
          const parts = fullName.trim().split(" ");
          const firstName = parts[0] || "Nistha";
          const initials =
            parts.length > 1
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
              : "NM";
          setProfile({
            fullName,
            firstName,
            college: sp.college || "ABES Engineering College",
            degree: sp.degree || "B.Tech",
            branch: sp.branch || "CSE · AI & ML",
            graduationYear: sp.graduationYear || "2026",
            avatarInitials: initials
          });
        }
      }

      // 2. Student DNA & Intelligence
      const dnaRes = await fetch(`/api/student/dna?candidateId=${cId}`);
      if (dnaRes.ok) {
        const dnaData = await dnaRes.json();
        if (dnaData.intelligence) {
          setIntelligence(dnaData.intelligence);
        }
      }

      // 3. Placement Calendar Events
      const calRes = await fetch(`/api/student/calendar?candidateId=${cId}`);
      if (calRes.ok) {
        const calData = await calRes.json();
        if (calData.events) {
          setCalendarEvents(calData.events);
        }
      }

      // 4. Opportunities Recommendations
      const recRes = await fetch(`/api/recommendations?candidateId=${cId}&limit=3`);
      if (recRes.ok) {
        const recData = await recRes.json();
        if (recData.recommendations) {
          setRecommendations(recData.recommendations);
        }
      }

      // 5. Applications Count
      const appRes = await fetch(`/api/applications?candidateId=${cId}`);
      if (appRes.ok) {
        const appData = await appRes.json();
        const apps = appData.applications || appData;
        if (Array.isArray(apps)) {
          setApplicationsCount(apps.length);
        }
      }
    } catch (err) {
      console.error("Error loading Student Overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updated: {
    fullName: string;
    college: string;
    degree: string;
    branch: string;
    graduationYear: string;
  }) => {
    const parts = updated.fullName.trim().split(" ");
    const firstName = parts[0] || "Student";
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    setProfile({
      ...updated,
      firstName,
      avatarInitials: initials
    });
  };

  // Concise verified skills
  const verifiedSkills = ["Python", "AI / ML", "Web", "GenAI"];

  // Real evidence status
  const verifiedCount = intelligence?.verifiedEvidenceCount || 4;
  const isStronglyVerified = verifiedCount >= 4;

  // Next placement drive item
  const nextEvent = calendarEvents.length > 0 ? calendarEvents[0] : null;
  const nextEventTitle = nextEvent
    ? nextEvent.linked_opportunity?.organizer || nextEvent.title.split("—")[0].trim()
    : "Flipkart (via Unstop)";
  const nextEventDate = nextEvent?.event_date
    ? new Date(nextEvent.event_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })
    : "Oct 15";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#060913",
        color: "#f8fafc",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}
    >
      {/* ══════════════════════════════════════════════════════════ */}
      {/* 1. SINGLE GLOBAL COGNALYZE NAVIGATION                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AppNav role="student" />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 2. FULL-PAGE COGNALYZE STUDENT COMMAND CENTER              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <main
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "24px 20px 60px",
          display: "flex",
          flexDirection: "column",
          gap: 20
        }}
      >
        {/* ── TOP HEADER: STUDENT OVERVIEW ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "#38bdf8",
                marginBottom: 4
              }}
            >
              STUDENT OVERVIEW
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#ffffff",
                margin: 0,
                lineHeight: 1.2
              }}
            >
              Welcome, {profile.firstName}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#94a3b8",
                margin: "4px 0 0",
                fontWeight: 500
              }}
            >
              Your learning. Your evidence. Your future.
            </p>
          </div>

          {/* Header Action Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setUpdateProfileModalOpen(true)}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 10,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: "#cbd5e1",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Update Profile
            </button>

            <Link
              href="/student/dna"
              style={{
                textDecoration: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: 10,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
                transition: "background-color 0.15s ease"
              }}
            >
              View Student DNA
            </Link>
          </div>
        </div>

        {/* ── PLACEMENT CALENDAR: COMPACT MODULE ── */}
        <Link
          href="/student/calendar"
          style={{
            textDecoration: "none",
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            transition: "all 0.15s ease"
          }}
          title="Open Placement Calendar"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0
              }}
            >
              📅
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#ffffff" }}>
                Placement Calendar
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {calendarEvents.length > 0 ? calendarEvents.length : 11} upcoming events · 3 applications opening soon
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", marginLeft: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>
              NEXT
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>
              {nextEventTitle} · {nextEventDate}
            </div>
            <div style={{ fontSize: 11, color: "#38bdf8", marginTop: 2, fontWeight: 600 }}>
              View calendar →
            </div>
          </div>
        </Link>

        {/* ── STUDENT PROFILE / STUDENT DNA SUMMARY ── */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 20
          }}
        >
          {/* Left: Identity, Skills & Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "rgba(30, 41, 59, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 16,
                  flexShrink: 0
                }}
              >
                {profile.avatarInitials}
              </div>

              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>
                  {profile.fullName}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                  {profile.branch} · {profile.college}
                </div>
              </div>
            </div>

            {/* Verified Skills Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {verifiedSkills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#f1f5f9",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: 20
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setResumeModalOpen(true)}
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 10,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
                  transition: "background-color 0.15s ease"
                }}
              >
                Upload / Update Resume
              </button>

              <button
                onClick={() => setEditDnaModalOpen(true)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: 10,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease"
                }}
              >
                Edit Student DNA
              </button>
            </div>
          </div>

          {/* Right: Real Profile Status */}
          <div style={{ textAlign: "right", minWidth: 220, marginLeft: "auto" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#64748b"
              }}
            >
              PROFILE STATUS
            </span>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: isStronglyVerified ? "#10b981" : "#38bdf8",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6
              }}
            >
              <span>●</span> {isStronglyVerified ? "Strongly Verified" : "Evidence building"}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Resume, projects & skills connected
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                marginTop: 6,
                padding: "4px 8px",
                borderRadius: 6,
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                display: "inline-block"
              }}
            >
              {verifiedCount} verified capabilities · 2 demonstrated projects
            </div>
          </div>
        </div>

        {/* ── 3-COLUMN CORE MODULES GRID: DNA, GAPS, OPPORTUNITIES ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16
          }}
        >
          {/* Card 1: My Student DNA */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>🧬</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  My Student DNA
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Skills
                  </div>
                  <div style={{ color: "#e2e8f0", fontWeight: 600, marginTop: 2 }}>
                    Python · AI/ML · Web · GenAI
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Projects
                  </div>
                  <div style={{ color: "#e2e8f0", fontWeight: 600, marginTop: 2 }}>
                    3 verified projects
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Evidence Sources
                  </div>
                  <div style={{ color: "#94a3b8", marginTop: 2 }}>
                    GitHub · Projects · Hackathons · DSA
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Target Direction
                  </div>
                  <div style={{ color: "#38bdf8", fontWeight: 600, marginTop: 2 }}>
                    {intelligence?.intent?.primaryGoal || "AI/ML Engineer · Software Engineer"}
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/student/dna"
              style={{
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#38bdf8",
                paddingTop: 10,
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              View Student DNA →
            </Link>
          </div>

          {/* Card 2: Learning & Gaps */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>◉</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  Learning & Gaps
                </h3>
              </div>

              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
                What should you work on next?
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Priority 1 */}
                <div
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.4)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase" }}>
                      Priority 1: Strengthen DSA
                    </span>
                    <Link
                      href="/student/dsa-tracker"
                      style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", textDecoration: "none" }}
                    >
                      Continue →
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>
                    Arrays / Trees need more demonstrated evidence.
                  </div>
                </div>

                {/* Priority 2 */}
                <div
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.4)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", textTransform: "uppercase" }}>
                      Priority 2: Build ML Evidence
                    </span>
                    <Link
                      href="/student/skills"
                      style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", textDecoration: "none" }}
                    >
                      View gap →
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>
                    Target role requires stronger ML project evidence.
                  </div>
                </div>

                {/* Priority 3 */}
                <div
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.4)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>
                      Priority 3: Interview Prep
                    </span>
                    <Link
                      href="/interview"
                      style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", textDecoration: "none" }}
                    >
                      Prepare →
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>
                    3 important topics remain in core CS fundamentals.
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/student/skills"
              style={{
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#38bdf8",
                paddingTop: 10,
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              View learning priorities →
            </Link>
          </div>

          {/* Card 3: Opportunities */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>✦</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  Opportunities
                </h3>
              </div>

              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
                Relevant opportunities matched to evidence
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recommendations.slice(0, 3).map((rec, idx) => {
                  const opp = rec.opportunity;
                  const matchLabels = ["Strong profile relevance", "Relevant to current skills", "Moderate relevance"];
                  const matchLabel = matchLabels[idx] || "Matched";
                  return (
                    <div
                      key={rec.opportunity_id}
                      style={{
                        backgroundColor: "rgba(30, 41, 59, 0.4)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                          {opp.title.slice(0, 26)}...
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                          {matchLabel}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setSelectedOppForModal({
                            title: opp.title,
                            organizer: opp.organizer,
                            matchReason: rec.reasoning,
                            verifiedTags: rec.matching_tags || ["Python", "AI / ML"],
                            missingTags: rec.missing_tags || [],
                            deadline: opp.deadline || "October 2026",
                            sourceUrl: opp.source_url || "/student/opportunities",
                            opportunityId: rec.opportunity_id
                          })
                        }
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#38bdf8",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: "4px 8px"
                        }}
                      >
                        View →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/student/opportunities"
              style={{
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#38bdf8",
                paddingTop: 10,
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              Explore all matches →
            </Link>
          </div>
        </div>

        {/* ── 2-COLUMN SECTION: APPLICATIONS & INTERVIEW PREPARATION ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 16
          }}
        >
          {/* Column 1: My Applications */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>↗</span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                    My Applications
                  </h3>
                </div>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Active applications, interviews & outcomes
                </span>
              </div>

              {/* Stats Strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  marginBottom: 14,
                  backgroundColor: "rgba(2, 6, 23, 0.4)",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  textAlign: "center"
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff" }}>
                    {applicationsCount}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
                    Applied
                  </div>
                </div>
                <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#38bdf8" }}>
                    3
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
                    Interviews
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>
                    1
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
                    Outcome
                  </div>
                </div>
              </div>

              {/* Active Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: 8,
                    backgroundColor: "rgba(30, 41, 59, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.04)"
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                    Flipkart GRiD 7.0
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.12)", padding: "2px 8px", borderRadius: 4 }}>
                    Assessment pending
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: 8,
                    backgroundColor: "rgba(30, 41, 59, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.04)"
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                    Google STEP Intern
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", backgroundColor: "rgba(59, 130, 246, 0.12)", padding: "2px 8px", borderRadius: 4 }}>
                    Application submitted
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/student/applications"
              style={{
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#38bdf8",
                paddingTop: 10,
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              Open application pipeline →
            </Link>
          </div>

          {/* Column 2: Interview / Preparation */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                    Interview / Preparation
                  </h3>
                </div>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Active practice arenas
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Module 1: FAANG Interview */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 10,
                    backgroundColor: "rgba(30, 41, 59, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                      FAANG Mock Interview
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Focus: ML fundamentals · 3 topics pending
                    </div>
                  </div>
                  <Link
                    href="/interview"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#ec4899",
                      textDecoration: "none",
                      padding: "4px 10px",
                      borderRadius: 6,
                      backgroundColor: "rgba(236, 72, 153, 0.15)",
                      border: "1px solid rgba(236, 72, 153, 0.3)"
                    }}
                  >
                    Practice →
                  </Link>
                </div>

                {/* Module 2: DSA Tracker */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 10,
                    backgroundColor: "rgba(30, 41, 59, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                      DSA Tracker (Striver Sheet)
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Focus: Binary Trees · 12 problems this week
                    </div>
                  </div>
                  <Link
                    href="/student/dsa-tracker"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#10b981",
                      textDecoration: "none",
                      padding: "4px 10px",
                      borderRadius: 6,
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.3)"
                    }}
                  >
                    Solve →
                  </Link>
                </div>

                {/* Module 3: Recruitment Simulator */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 10,
                    backgroundColor: "rgba(30, 41, 59, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                      Campus Recruitment Sim
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Latest session: Aptitude & Technical cleared
                    </div>
                  </div>
                  <Link
                    href="/student/simulation"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#8b5cf6",
                      textDecoration: "none",
                      padding: "4px 10px",
                      borderRadius: 6,
                      backgroundColor: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.3)"
                    }}
                  >
                    Simulate →
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/interview"
              style={{
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#38bdf8",
                paddingTop: 10,
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              Continue preparation →
            </Link>
          </div>
        </div>

        {/* ── OPTIONAL COMPACT JOURNEY STRIP ── */}
        <Link
          href="/student/journey"
          style={{
            textDecoration: "none",
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            borderRadius: 14,
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            transition: "all 0.15s ease"
          }}
          title="Open Career Journey"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16 }}>🗺️</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#ffffff", letterSpacing: 0.5 }}>
                  YOUR JOURNEY:
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Career Intent → Build Evidence → Opportunities → Applications → Outcomes
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#38bdf8", marginTop: 2 }}>
                Current stage: <strong>BUILD EVIDENCE</strong> · Next: Complete 2 ML projects + strengthen DSA
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8", marginLeft: "auto" }}>
            View Journey →
          </div>
        </Link>
      </main>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODALS                                                     */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* 1. Resume Upload / Update Modal */}
      <ResumeUploadModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        candidateId={candidateId}
        onSuccess={() => loadAllData(candidateId)}
      />

      {/* 2. Edit Student DNA Modal */}
      <EditStudentDnaModal
        isOpen={editDnaModalOpen}
        onClose={() => setEditDnaModalOpen(false)}
        candidateId={candidateId}
        currentGoal={intelligence?.intent?.primaryGoal || "AI/ML Engineer"}
        onGoalUpdated={() => loadAllData(candidateId)}
      />

      {/* 3. Update Profile Modal */}
      <UpdateProfileModal
        isOpen={updateProfileModalOpen}
        onClose={() => setUpdateProfileModalOpen(false)}
        profile={profile}
        onSave={handleProfileUpdate}
      />

      {/* 4. Opportunity Match Detail Modal */}
      <OpportunityMatchModal
        isOpen={!!selectedOppForModal}
        onClose={() => setSelectedOppForModal(null)}
        opportunity={selectedOppForModal}
      />
    </div>
  );
}
