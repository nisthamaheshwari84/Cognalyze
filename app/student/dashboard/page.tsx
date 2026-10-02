"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";
import CompanyLogo from "@/components/CompanyLogo";
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
  const { isDark } = useTheme();
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [loading, setLoading] = useState(true);

  // Authenticated Student Profile State
  const [profile, setProfile] = useState({
    fullName: "",
    firstName: "",
    college: "",
    degree: "",
    branch: "",
    graduationYear: "",
    avatarInitials: ""
  });

  // Student DNA Status (Section 5, 29, 37)
  const [dnaStatus, setDnaStatus] = useState<{
    completionPercentage: number;
    profileCompleted: boolean;
    status: "NOT_STARTED" | "IN_PROGRESS" | "PARTIAL" | "COMPLETE";
  }>({
    completionPercentage: 0,
    profileCompleted: false,
    status: "NOT_STARTED"
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
      let activeCId = cId;
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated && (sessionData.studentProfile || sessionData.user)) {
          if (sessionData.user?.id) {
            activeCId = sessionData.user.id;
            setCandidateId(activeCId);
            if (typeof window !== "undefined") {
              localStorage.setItem("cognalyze_student_id", activeCId);
            }
          }
          const sp = sessionData.studentProfile || {};
          const fullName = sp.fullName || sessionData.user?.fullName || "Student";
          const parts = fullName.trim().split(" ");
          const firstName = parts[0] || "Student";
          const initials =
            parts.length > 1 && parts[0] && parts[parts.length - 1]
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
              : (parts[0]?.[0] || "S").toUpperCase();
          setProfile({
            fullName,
            firstName,
            college: sp.college || "",
            degree: sp.degree || "",
            branch: sp.branch || "",
            graduationYear: sp.graduationYear || "",
            avatarInitials: initials
          });

          // Calculate DNA completion status
          const pct = sp.profileCompletionPercentage || (sp.profileCompleted ? 100 : 0);
          setDnaStatus({
            completionPercentage: pct,
            profileCompleted: !!sp.profileCompleted,
            status: pct >= 80 ? "COMPLETE" : pct >= 40 ? "PARTIAL" : pct > 0 ? "IN_PROGRESS" : "NOT_STARTED"
          });
        }
      }

      // 2. Student DNA & Intelligence (Strictly authenticated session user)
      const dnaRes = await fetch(`/api/student/dna?candidateId=${activeCId}`);
      if (dnaRes.ok) {
        const dnaData = await dnaRes.json();
        if (dnaData.intelligence) {
          setIntelligence(dnaData.intelligence);
        }
      }

      // 3. Placement Calendar Events
      const calRes = await fetch(`/api/student/calendar?candidateId=${activeCId}`);
      if (calRes.ok) {
        const calData = await calRes.json();
        if (calData.events) {
          setCalendarEvents(calData.events);
        }
      }

      // 4. Opportunities Recommendations
      const recRes = await fetch(`/api/recommendations?candidateId=${activeCId}&limit=3`);
      if (recRes.ok) {
        const recData = await recRes.json();
        if (recData.recommendations) {
          setRecommendations(recData.recommendations);
        }
      }

      // 5. Applications Count
      const appRes = await fetch(`/api/applications?candidateId=${activeCId}`);
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
        backgroundColor: isDark ? "#07111F" : "#F6F5F1",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        transition: "background-color 0.15s ease, color 0.15s ease"
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
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: isDark ? "#4C8DFF" : "#356AE6",
                marginBottom: 4
              }}
            >
              STUDENT OVERVIEW
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: isDark ? "#F2F6FC" : "#162A43",
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: "-0.5px"
              }}
            >
              Welcome, {profile.firstName || "Student"}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: isDark ? "#B6C4D6" : "#667085",
                margin: "4px 0 0",
                fontWeight: 500
              }}
            >
              Your learning. Your evidence. Your future.
            </p>
          </div>

          {/* Header Action Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setUpdateProfileModalOpen(true)}
              style={{
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 7,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: isDark ? "#DCE7F5" : "#17191C",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 2px rgba(16, 24, 40, 0.04)"
              }}
            >
              Update Profile
            </button>

            <Link
              href="/student/dna"
              style={{
                textDecoration: "none",
                backgroundColor: isDark ? "#3478F6" : "#356AE6",
                color: "#ffffff",
                borderRadius: 7,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 2px rgba(53, 106, 230, 0.2)",
                transition: "background-color 0.15s ease"
              }}
            >
              View Student DNA →
            </Link>
          </div>
        </div>

        {/* ── YOUR STUDENT DNA: CORE BUILDER CARD (Sections 5, 29, 37) ── */}
        <div
          style={{
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
            border: isDark ? "1px solid #223750" : (dnaStatus.completionPercentage >= 80 ? "1px solid #C8E4D3" : "1px solid #E4E1DA"),
            borderRadius: 10,
            padding: "24px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
            boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16, 24, 40, 0.04)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ maxWidth: 660 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: isDark
                    ? (dnaStatus.completionPercentage >= 80 ? "#5ED19D" : "#73A6FF")
                    : (dnaStatus.completionPercentage >= 80 ? "#2E7D5B" : "#356AE6"),
                  background: isDark
                    ? (dnaStatus.completionPercentage >= 80 ? "rgba(53,185,130,0.12)" : "rgba(76,141,255,0.12)")
                    : (dnaStatus.completionPercentage >= 80 ? "#EAF4EE" : "#EEF4FD"),
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: isDark
                    ? (dnaStatus.completionPercentage >= 80 ? "1px solid rgba(53,185,130,0.25)" : "1px solid rgba(76,141,255,0.25)")
                    : (dnaStatus.completionPercentage >= 80 ? "1px solid #C8E4D3" : "1px solid #D1E2FB")
                }}
              >
                STUDENT DNA
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDark
                    ? (dnaStatus.completionPercentage >= 80 ? "#35B982" : "#B6C4D6")
                    : (dnaStatus.completionPercentage >= 80 ? "#2E7D5B" : "#667085")
                }}
              >
                {dnaStatus.completionPercentage >= 80
                  ? "✓ Student DNA Ready & Active"
                  : dnaStatus.completionPercentage > 0
                  ? `${dnaStatus.completionPercentage}% complete · Developing`
                  : "Not started · Ready to build"}
              </span>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: "0 0 6px" }}>
              {dnaStatus.completionPercentage >= 80
                ? "Your Student DNA is powering personalized intelligence"
                : dnaStatus.completionPercentage > 0
                ? "Complete your profile to unlock deeper personalized insights"
                : "Build your profile to get personalized career intelligence"}
            </h2>

            <p style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085", margin: "0 0 14px", lineHeight: 1.5 }}>
              {dnaStatus.completionPercentage >= 80
                ? "Your verified capabilities, projects, and coursework are synchronized across the platform."
                : "Build your profile whenever you're ready to get personalized insights:"}
            </p>

            {/* Benefits List */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "6px 14px",
                fontSize: 12,
                color: isDark ? "#B6C4D6" : "#17191C"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: isDark ? "#4C8DFF" : "#356AE6" }}>•</span> Skill insights & evidence breakdown
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: isDark ? "#4C8DFF" : "#356AE6" }}>•</span> Skill gaps & target role roadmaps
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: isDark ? "#4C8DFF" : "#356AE6" }}>•</span> High-fit opportunities matching
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: isDark ? "#4C8DFF" : "#356AE6" }}>•</span> Resume ATS & claim verification
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: isDark ? "#4C8DFF" : "#356AE6" }}>•</span> Personalized interview preparation
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: isDark ? "#4C8DFF" : "#356AE6" }}>•</span> Recruiter recommendation priority
              </div>
            </div>
          </div>

          {/* Action / Progress Control */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#8292A8" : "#667085" }}>
                DNA Progress: <strong style={{ color: isDark ? "#F2F6FC" : "#162A43" }}>{dnaStatus.completionPercentage}%</strong>
              </div>
              <div style={{ width: 180, height: 6, background: isDark ? "#16283F" : "#E4E1DA", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(dnaStatus.completionPercentage, 5)}%`,
                    background: dnaStatus.completionPercentage >= 80 ? (isDark ? "#35B982" : "#2E7D5B") : (isDark ? "#3478F6" : "#356AE6"),
                    borderRadius: 3,
                    transition: "width 0.4s ease"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {dnaStatus.completionPercentage < 100 ? (
                <Link
                  href="/student/onboarding"
                  style={{
                    textDecoration: "none",
                    background: isDark ? "#3478F6" : "#356AE6",
                    color: "#ffffff",
                    borderRadius: 7,
                    padding: "9px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 2px rgba(16, 24, 40, 0.05)",
                    transition: "background 0.15s ease"
                  }}
                >
                  <span>{dnaStatus.completionPercentage === 0 ? "Build Student DNA" : "Continue Building DNA"}</span>
                  <span>→</span>
                </Link>
              ) : (
                <Link
                  href="/student/dna"
                  style={{
                    textDecoration: "none",
                    background: isDark ? "#35B982" : "#2E7D5B",
                    color: "#ffffff",
                    borderRadius: 7,
                    padding: "9px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 2px rgba(16, 24, 40, 0.05)",
                    transition: "background 0.15s ease"
                  }}
                >
                  <span>View Full Student DNA</span>
                  <span>→</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── PLACEMENT CALENDAR: COMPACT MODULE ── */}
        <Link
          href="/student/calendar"
          style={{
            textDecoration: "none",
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
            border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
            borderRadius: 10,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16, 24, 40, 0.04)",
            transition: "border-color 0.15s ease, background-color 0.15s ease"
          }}
          title="Open Placement Calendar"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 7,
                backgroundColor: isDark ? "#13243A" : "#F6F5F1",
                border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0
              }}
            >
              📅
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: isDark ? "#F2F6FC" : "#162A43" }}>
                Placement Calendar
              </div>
              <div style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085", marginTop: 2 }}>
                {calendarEvents.length > 0 ? calendarEvents.length : 11} upcoming events · 3 applications opening soon
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", marginLeft: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#8292A8" : "#98A2B3", textTransform: "uppercase", letterSpacing: 0.5 }}>
              NEXT SCHEDULED
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? "#F2F6FC" : "#17191C", marginTop: 2 }}>
              {nextEventTitle} · {nextEventDate}
            </div>
            <div style={{ fontSize: 12, color: isDark ? "#4C8DFF" : "#356AE6", marginTop: 2, fontWeight: 600 }}>
              View calendar →
            </div>
          </div>
        </Link>

        {/* ── STUDENT PROFILE / STUDENT DNA SUMMARY ── */}
        <div
          style={{
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
            border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
            borderRadius: 10,
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 20,
            boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16, 24, 40, 0.04)"
          }}
        >
          {/* Left: Identity, Skills & Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 7,
                  backgroundColor: isDark ? "#13243A" : "#162A43",
                  border: isDark ? "1px solid #2A435F" : "none",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0
                }}
              >
                {profile.avatarInitials}
              </div>

              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#F2F6FC" : "#17191C" }}>
                  {profile.fullName}
                </div>
                <div style={{ fontSize: 13, color: isDark ? "#9FB0C5" : "#667085", marginTop: 2 }}>
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
                    backgroundColor: isDark ? "#13243A" : "#F8F9FA",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    color: isDark ? "#DDE8F5" : "#17191C",
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: 5
                  }}
                >
                  ✓ {skill}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setResumeModalOpen(true)}
                style={{
                  backgroundColor: isDark ? "#3478F6" : "#356AE6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 7,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 2px rgba(16, 24, 40, 0.05)",
                  transition: "background 0.15s ease"
                }}
              >
                Upload / Update Resume
              </button>

              <button
                onClick={() => setEditDnaModalOpen(true)}
                style={{
                  backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 7,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: isDark ? "#DCE7F5" : "#17191C",
                  cursor: "pointer",
                  transition: "background 0.15s ease"
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
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: isDark ? "#8FA2B8" : "#98A2B3"
              }}
            >
              PROFILE STATUS
            </span>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: isDark
                  ? (isStronglyVerified ? "#35B982" : "#4C8DFF")
                  : (isStronglyVerified ? "#2E7D5B" : "#356AE6"),
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6
              }}
            >
              <span>●</span> {isStronglyVerified ? "Strongly Verified" : "Evidence Building"}
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085", marginTop: 2 }}>
              Resume, projects & skills connected
            </div>
            <div
              style={{
                fontSize: 12,
                color: isDark ? "#B6C4D6" : "#667085",
                marginTop: 8,
                padding: "4px 8px",
                borderRadius: 5,
                backgroundColor: isDark ? "#13243A" : "#F6F5F1",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
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
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
              borderRadius: 10,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
              boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16, 24, 40, 0.04)"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>🧬</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                  My Student DNA
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#8292A8" : "#98A2B3", textTransform: "uppercase" }}>
                    Skills
                  </div>
                  <div style={{ color: isDark ? "#F2F6FC" : "#17191C", fontWeight: 500, marginTop: 2 }}>
                    Python · AI/ML · Web · GenAI
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#8292A8" : "#98A2B3", textTransform: "uppercase" }}>
                    Projects
                  </div>
                  <div style={{ color: isDark ? "#F2F6FC" : "#17191C", fontWeight: 500, marginTop: 2 }}>
                    3 verified projects
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#8292A8" : "#98A2B3", textTransform: "uppercase" }}>
                    Evidence Sources
                  </div>
                  <div style={{ color: isDark ? "#B6C4D6" : "#667085", marginTop: 2 }}>
                    GitHub · Projects · Hackathons · DSA
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#8292A8" : "#98A2B3", textTransform: "uppercase" }}>
                    Target Direction
                  </div>
                  <div style={{ color: isDark ? "#4C8DFF" : "#356AE6", fontWeight: 600, marginTop: 2 }}>
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
                fontWeight: 600,
                color: isDark ? "#4C8DFF" : "#356AE6",
                paddingTop: 12,
                borderTop: isDark ? "1px solid rgba(36, 58, 85, 0.7)" : "1px solid #E4E1DA",
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
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
              borderRadius: 10,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
              boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16, 24, 40, 0.04)"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>🎯</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                  Learning & Gaps
                </h3>
              </div>

              <div style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", marginBottom: 12 }}>
                Prioritized next actions based on target role DNA
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Priority 1 */}
                <div
                  style={{
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    borderRadius: 7,
                    padding: "10px 12px",
                    border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#EAB65A" : "#B7791F", textTransform: "uppercase" }}>
                      Priority 1: Strengthen DSA
                    </span>
                    <Link
                      href="/student/dsa-tracker"
                      style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#4C8DFF" : "#356AE6", textDecoration: "none" }}
                    >
                      Continue →
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: isDark ? "#AFC0D4" : "#667085", marginTop: 4 }}>
                    Arrays / Trees need more demonstrated code evidence.
                  </div>
                </div>

                {/* Priority 2 */}
                <div
                  style={{
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    borderRadius: 7,
                    padding: "10px 12px",
                    border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#EAB65A" : "#356AE6", textTransform: "uppercase" }}>
                      Priority 2: Build ML Evidence
                    </span>
                    <Link
                      href="/student/skills"
                      style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#4C8DFF" : "#356AE6", textDecoration: "none" }}
                    >
                      View gap →
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: isDark ? "#AFC0D4" : "#667085", marginTop: 4 }}>
                    Target role requires stronger ML project evidence.
                  </div>
                </div>

                {/* Priority 3 */}
                <div
                  style={{
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    borderRadius: 7,
                    padding: "10px 12px",
                    border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#EAB65A" : "#2E7D5B", textTransform: "uppercase" }}>
                      Priority 3: Interview Prep
                    </span>
                    <Link
                      href="/interview"
                      style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#4C8DFF" : "#356AE6", textDecoration: "none" }}
                    >
                      Prepare →
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: isDark ? "#AFC0D4" : "#667085", marginTop: 4 }}>
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
                fontWeight: 600,
                color: isDark ? "#4C8DFF" : "#356AE6",
                paddingTop: 12,
                borderTop: isDark ? "1px solid rgba(36, 58, 85, 0.7)" : "1px solid #E4E1DA",
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
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
              borderRadius: 10,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
              boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16, 24, 40, 0.04)"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>✦</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                  Opportunities
                </h3>
              </div>

              <div style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", marginBottom: 12 }}>
                Relevant opportunities matched to verified evidence
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendations.slice(0, 3).map((rec, idx) => {
                  const opp = rec.opportunity;
                  const matchLabels = ["Strong profile relevance", "Relevant to current skills", "Moderate relevance"];
                  const matchLabel = matchLabels[idx] || "Matched";
                  return (
                    <div
                      key={rec.opportunity_id}
                      style={{
                        backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                        borderRadius: 7,
                        padding: "10px 12px",
                        border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <CompanyLogo companyName={opp.organizer} size={30} />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: isDark ? "#F2F6FC" : "#17191C",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            {opp.title.slice(0, 24)}...
                          </div>
                          <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", marginTop: 2 }}>
                            {opp.organizer} · {matchLabel}
                          </div>
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
                          backgroundColor: isDark ? "#101F34" : "#FFFFFF",
                          border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                          borderRadius: 5,
                          color: isDark ? "#4C8DFF" : "#356AE6",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "5px 10px",
                          flexShrink: 0,
                          transition: "all 0.15s ease"
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
                fontWeight: 600,
                color: isDark ? "#4C8DFF" : "#356AE6",
                paddingTop: 12,
                borderTop: isDark ? "1px solid rgba(36, 58, 85, 0.7)" : "1px solid #E4E1DA",
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
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
              borderRadius: 10,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
              boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16, 24, 40, 0.04)"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>↗</span>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                    My Applications
                  </h3>
                </div>
                <span style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085" }}>
                  Active applications & outcomes
                </span>
              </div>

              {/* Stats Strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  marginBottom: 14,
                  backgroundColor: isDark ? "#13243A" : "#F6F5F1",
                  padding: "10px 14px",
                  borderRadius: 7,
                  border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                  textAlign: "center"
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                    {applicationsCount}
                  </div>
                  <div style={{ fontSize: 11, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase" }}>
                    Applied
                  </div>
                </div>
                <div style={{ borderLeft: isDark ? "1px solid #263D57" : "1px solid #E4E1DA", borderRight: isDark ? "1px solid #263D57" : "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#4C8DFF" : "#356AE6" }}>
                    3
                  </div>
                  <div style={{ fontSize: 11, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase" }}>
                    Interviews
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#35B982" : "#2E7D5B" }}>
                    1
                  </div>
                  <div style={{ fontSize: 11, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase" }}>
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
                    borderRadius: 7,
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                    gap: 10
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CompanyLogo companyName="Flipkart" size={26} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#F2F6FC" : "#17191C" }}>
                      Flipkart GRiD 7.0
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isDark ? "#F0C978" : "#B7791F",
                      backgroundColor: isDark ? "rgba(234,182,90,0.12)" : "#FEF7ED",
                      border: isDark ? "1px solid rgba(234,182,90,0.25)" : "1px solid #FDE68A",
                      padding: "2px 8px",
                      borderRadius: 5
                    }}
                  >
                    Assessment pending
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: 7,
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                    gap: 10
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CompanyLogo companyName="Google" size={26} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#F2F6FC" : "#17191C" }}>
                      Google STEP Intern
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isDark ? "#73A6FF" : "#356AE6",
                      backgroundColor: isDark ? "rgba(76,141,255,0.12)" : "#EEF4FD",
                      border: isDark ? "1px solid rgba(76,141,255,0.25)" : "1px solid #D1E2FB",
                      padding: "2px 8px",
                      borderRadius: 5
                    }}
                  >
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
                fontWeight: 600,
                color: isDark ? "#4C8DFF" : "#356AE6",
                paddingTop: 12,
                borderTop: isDark ? "1px solid rgba(36, 58, 85, 0.7)" : "1px solid #E4E1DA",
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
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
              borderRadius: 10,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
              boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16, 24, 40, 0.04)"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🎯</span>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                    Interview / Preparation
                  </h3>
                </div>
                <span style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085" }}>
                  Active practice arenas
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Module 1: FAANG Interview */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 7,
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#EAF0F8" : "#17191C" }}>
                      FAANG Mock Interview
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#9FB0C5" : "#667085", marginTop: 2 }}>
                      Focus: ML fundamentals · 3 topics pending
                    </div>
                  </div>
                  <Link
                    href="/interview"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isDark ? "#73A6FF" : "#356AE6",
                      textDecoration: "none",
                      padding: "4px 10px",
                      borderRadius: 5,
                      backgroundColor: isDark ? "rgba(76,141,255,0.12)" : "#EEF4FD",
                      border: isDark ? "1px solid rgba(76,141,255,0.25)" : "1px solid #D1E2FB"
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
                    borderRadius: 7,
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#EAF0F8" : "#17191C" }}>
                      DSA Tracker (Striver Sheet)
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#9FB0C5" : "#667085", marginTop: 2 }}>
                      Focus: Binary Trees · 12 problems this week
                    </div>
                  </div>
                  <Link
                    href="/student/dsa-tracker"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isDark ? "#5ED19D" : "#2E7D5B",
                      textDecoration: "none",
                      padding: "4px 10px",
                      borderRadius: 5,
                      backgroundColor: isDark ? "rgba(53,185,130,0.12)" : "#EAF4EE",
                      border: isDark ? "1px solid rgba(53,185,130,0.25)" : "1px solid #C8E4D3"
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
                    borderRadius: 7,
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#EAF0F8" : "#17191C" }}>
                      Campus Recruitment Sim
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#9FB0C5" : "#667085", marginTop: 2 }}>
                      Latest session: Aptitude & Technical cleared
                    </div>
                  </div>
                  <Link
                    href="/student/simulation"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isDark ? "#73A6FF" : "#162A43",
                      textDecoration: "none",
                      padding: "4px 10px",
                      borderRadius: 5,
                      backgroundColor: isDark ? "rgba(76,141,255,0.12)" : "#F6F5F1",
                      border: isDark ? "1px solid rgba(76,141,255,0.25)" : "1px solid #E4E1DA"
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
                fontWeight: 600,
                color: isDark ? "#4C8DFF" : "#356AE6",
                paddingTop: 12,
                borderTop: isDark ? "1px solid rgba(36, 58, 85, 0.7)" : "1px solid #E4E1DA",
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
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
            border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
            borderRadius: 10,
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16, 24, 40, 0.04)",
            transition: "border-color 0.15s ease, background-color 0.15s ease"
          }}
          title="Open Career Journey"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16 }}>🗺️</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", letterSpacing: 0.5 }}>
                  CAREER JOURNEY:
                </span>
                <span style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085" }}>
                  Career Intent → Build Evidence → Opportunities → Applications → Outcomes
                </span>
              </div>
              <div style={{ fontSize: 12, color: isDark ? "#4C8DFF" : "#356AE6", marginTop: 2 }}>
                Current stage: <strong style={{ color: isDark ? "#F2F6FC" : "#162A43" }}>BUILD EVIDENCE</strong> · Next: Complete 2 ML projects + strengthen DSA
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#4C8DFF" : "#356AE6", marginLeft: "auto" }}>
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

      {/* 5. Floating Cognalyze AI Mentor Launcher */}
      <Link
        href="/student/ai-mentor"
        title="Cognalyze AI Mentor"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 90,
          width: 52,
          height: 52,
          borderRadius: "50%",
          backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
          border: `1.5px solid ${isDark ? "#3478F6" : "#356AE6"}`,
          boxShadow: isDark
            ? "0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px rgba(52, 120, 246, 0.3)"
            : "0 6px 20px rgba(53, 106, 230, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          transition: "transform 150ms ease"
        }}
        className="hover:scale-105"
      >
        <span style={{ fontSize: 24 }} role="img" aria-label="Cognalyze AI Mentor">
          🤖
        </span>
        <span
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#35B982",
            border: `2px solid ${isDark ? "#0E1B2E" : "#FFFFFF"}`
          }}
        />
      </Link>
    </div>
  );
}
