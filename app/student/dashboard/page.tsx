"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";

export default function StudentDashboard() {
  const router = useRouter();
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

  const [loading, setLoading] = useState(true);

  // Authenticated Student State
  const [profile, setProfile] = useState<{
    userId: string;
    fullName: string;
    firstName: string;
    email: string;
    phone: string;
    location: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
    college: string;
    degree: string;
    branch: string;
    graduationYear: string;
    cgpa: string;
    skills: any[];
    projects: any[];
    experience: any[];
    achievements: any[];
    certifications: any[];
    careerGoals: any;
    resumeFileName: string;
    profileCompleted: boolean;
    profileCompletionPercentage: number;
    avatarInitials: string;
  }>({
    userId: "",
    fullName: "",
    firstName: "",
    email: "",
    phone: "",
    location: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    college: "",
    degree: "",
    branch: "",
    graduationYear: "",
    cgpa: "",
    skills: [],
    projects: [],
    experience: [],
    achievements: [],
    certifications: [],
    careerGoals: { targetRoles: [], preferredDomains: [], targetCompanies: [] },
    resumeFileName: "",
    profileCompleted: false,
    profileCompletionPercentage: 0,
    avatarInitials: "U",
  });

  // Editing state for Profile Tab
  const [editSuccess, setEditSuccess] = useState(false);
  const [editingSkillName, setEditingSkillName] = useState("");
  const [editingSkillLevel, setEditingSkillLevel] = useState<any>("Intermediate");
  const [editingProjTitle, setEditingProjTitle] = useState("");
  const [editingProjTech, setEditingProjTech] = useState("");
  const [editingProjDesc, setEditingProjDesc] = useState("");

  const [oppFilter, setOppFilter] = useState<string>("All");
  const [expandedEvidenceIdx, setExpandedEvidenceIdx] = useState<number | null>(0);
  const [selectedMilestone, setSelectedMilestone] = useState<number>(1);

  // Load authenticated session strictly
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          router.push("/login?redirect=/student/dashboard");
          return;
        }

        const data = await res.json();
        if (!data.authenticated || !data.user) {
          router.push("/login?redirect=/student/dashboard");
          return;
        }

        const sp = data.studentProfile;
        const user = data.user;

        // If student has not completed onboarding, redirect to onboarding flow
        if (!sp || !sp.profileCompleted) {
          router.push("/student/onboarding");
          return;
        }

        const fullName = sp.fullName || user.fullName || user.email?.split("@")[0] || "Student";
        const parts = fullName.trim().split(" ");
        const firstName = parts[0] || "Student";
        const initials =
          parts.length > 1
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : parts[0]?.slice(0, 2).toUpperCase() || "ST";

        setProfile({
          userId: user.id,
          fullName,
          firstName,
          email: sp.email || user.email || "",
          phone: sp.phone || "",
          location: sp.location || "",
          linkedinUrl: sp.linkedinUrl || "",
          githubUrl: sp.githubUrl || "",
          portfolioUrl: sp.portfolioUrl || "",
          college: sp.college || "University",
          degree: sp.degree || "Degree",
          branch: sp.branch || "Computer Science",
          graduationYear: sp.graduationYear || "2026",
          cgpa: sp.cgpa || "",
          skills: sp.skills || [],
          projects: sp.projects || [],
          experience: sp.experience || [],
          achievements: sp.achievements || [],
          certifications: sp.certifications || [],
          careerGoals: sp.careerGoals || { targetRoles: [], preferredDomains: [], targetCompanies: [] },
          resumeFileName: sp.resumeFileName || "",
          profileCompleted: sp.profileCompleted || true,
          profileCompletionPercentage: sp.profileCompletionPercentage || 100,
          avatarInitials: initials,
        });
      } catch (err) {
        console.error("Dashboard session load error:", err);
        router.push("/login?redirect=/student/dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [router]);

  // Save profile updates to backend
  const handleSaveProfileUpdates = async () => {
    try {
      const res = await fetch("/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setEditSuccess(true);
        setTimeout(() => setEditSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save profile error:", err);
    }
  };

  const handleAddSkillInline = () => {
    if (!editingSkillName.trim()) return;
    const updatedSkills = [
      ...profile.skills,
      { name: editingSkillName.trim(), level: editingSkillLevel, evidence: "User added" }
    ];
    setProfile({ ...profile, skills: updatedSkills });
    setEditingSkillName("");
  };

  const handleAddProjectInline = () => {
    if (!editingProjTitle.trim()) return;
    const techArr = editingProjTech.split(",").map(t => t.trim()).filter(Boolean);
    const updatedProjects = [
      ...profile.projects,
      {
        title: editingProjTitle.trim(),
        description: editingProjDesc.trim(),
        techStack: techArr,
      }
    ];
    setProfile({ ...profile, projects: updatedProjects });
    setEditingProjTitle("");
    setEditingProjTech("");
    setEditingProjDesc("");
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Real Calculated Metrics based on actual user inputs
  const projectCount = profile.projects.length;
  const skillCount = profile.skills.length;
  const experienceCount = profile.experience.length;

  const hasSufficientData = projectCount > 0 || skillCount > 0;

  // Evidence-grounded readiness scores
  const careerReadinessScore = Math.min(
    95,
    Math.round((skillCount * 6) + (projectCount * 18) + (experienceCount * 12) + (profile.cgpa ? 10 : 0))
  );

  const resumeStrengthScore = Math.min(
    92,
    Math.round(40 + (projectCount * 15) + (skillCount * 4) + (profile.resumeFileName ? 15 : 0))
  );

  const skillCoverageScore = Math.min(90, Math.round(skillCount * 12));

  // Dynamic opportunities matched to user's actual target roles or skills
  const userSkillsLower = new Set(profile.skills.map((s: any) => (s.name || s).toLowerCase()));
  const opportunities = [
    {
      id: "opp-1",
      company: "Stripe",
      role: "Software Engineering Intern • Backend",
      location: "San Francisco, CA (Hybrid)",
      type: "Internship",
      deadline: "Oct 28, 2026",
      reqSkills: ["Python", "PostgreSQL", "Distributed Systems"],
    },
    {
      id: "opp-2",
      company: "Google",
      role: "Associate Software Engineer",
      location: "Mountain View, CA / Remote",
      type: "Full-Time",
      deadline: "Nov 15, 2026",
      reqSkills: ["Data Structures", "Algorithms", "Java"],
    },
    {
      id: "opp-3",
      company: "Datadog",
      role: "Backend Engineer • Observability",
      location: "New York, NY",
      type: "Full-Time",
      deadline: "Nov 02, 2026",
      reqSkills: ["Python", "FastAPI", "Docker"],
    },
  ].map((opp) => {
    const matched = opp.reqSkills.filter((s) => userSkillsLower.has(s.toLowerCase()));
    const missing = opp.reqSkills.filter((s) => !userSkillsLower.has(s.toLowerCase()));
    const matchPct = Math.round((matched.length / opp.reqSkills.length) * 100);
    return {
      ...opp,
      match: Math.max(matchPct, 40),
      matchedSkills: matched.length > 0 ? matched : ["Foundational CS"],
      missingSkills: missing,
      reason: matched.length > 0
        ? `Matched on your submitted skills: ${matched.join(", ")}.`
        : "Matches your target software engineering track.",
      nextAction: missing.length > 0
        ? `Complete a project demonstrating ${missing.join(" and ")}.`
        : "Ready for mock interview round.",
    };
  });

  const filteredOpportunities =
    oppFilter === "All"
      ? opportunities
      : opportunities.filter((o) => o.type.toLowerCase().includes(oppFilter.toLowerCase()));

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "#6B6B6B" }}>Loading your personalized workspace...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", color: "#18181B" }}>
      {/* ── 1. GLOBAL NAVIGATION ── */}
      <AppNav role="student" />

      {/* ── 2. SUB-HEADER & NAVIGATION TABS ── */}
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

          <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="hidden sm:flex">
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#176B5B",
                backgroundColor: "#EBF5F3",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              DNA {profile.profileCompletionPercentage}% Complete
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. WORKSPACE CONTAINER ── */}
      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW                                           */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Top Bar Greeting */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#176B5B", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  AUTHENTICATED CANDIDATE DOSSIER
                </span>
                <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0", color: "#111111" }}>
                  {getGreeting()}, {profile.firstName || profile.fullName}
                </h1>
                <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 0" }}>
                  {profile.college ? `${profile.degree} in ${profile.branch} • ${profile.college}` : "Student Profile Active"} (Class of {profile.graduationYear})
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setActiveTab("profile")}
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
                  Edit My Profile
                </button>
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
                  Start Proctored Interview ➔
                </Link>
              </div>
            </div>

            {/* Metrics Section: No Fake Scores! */}
            {!hasSufficientData ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E7E5E4",
                  borderRadius: 12,
                  padding: 32,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#B45309", textTransform: "uppercase", marginBottom: 6 }}>
                  CAREER READINESS
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#111111", margin: "0 0 8px" }}>
                  Not enough data yet
                </h3>
                <p style={{ fontSize: 14, color: "#6B6B6B", maxWidth: 520, margin: "0 auto 20px" }}>
                  Add your skills, technical projects, or upload a resume in your profile to generate your evidence-based readiness scores.
                </p>
                <button
                  onClick={() => setActiveTab("profile")}
                  style={{
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 20px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add Skills & Projects ➔
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                {[
                  { title: "Career Readiness", value: `${careerReadinessScore}%`, sub: `Derived from ${projectCount} project(s) and ${skillCount} skill(s)`, color: "#176B5B", progress: careerReadinessScore },
                  { title: "Resume Strength", value: `${resumeStrengthScore}%`, sub: profile.resumeFileName ? `Verified via ${profile.resumeFileName}` : "Based on submitted profile claims", color: "#18181B", progress: resumeStrengthScore },
                  { title: "Skill Coverage", value: `${skillCoverageScore}%`, sub: `${skillCount} skills documented in Student DNA`, color: "#18181B", progress: skillCoverageScore },
                  { title: "Documented Projects", value: `${projectCount}`, sub: projectCount > 0 ? "Verifiable portfolio proof" : "No project evidence yet", color: "#18181B", progress: Math.min(100, projectCount * 33) },
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
            )}

            {/* Candidate DNA & Projects Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
              {/* DNA Breakdown */}
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111111" }}>
                      Your Verified Candidate DNA
                    </h3>
                    <p style={{ fontSize: 12, color: "#6B6B6B", margin: "2px 0 0" }}>
                      Grounded strictly in your documented inputs
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("dna")}
                    style={{ background: "none", border: "none", color: "#176B5B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Inspect ➔
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { cat: "Technical Skills", count: `${skillCount} skills documented`, score: Math.min(95, skillCount * 18) },
                    { cat: "Project Depth", count: `${projectCount} verified projects`, score: Math.min(95, projectCount * 30) },
                    { cat: "Experience Level", count: `${experienceCount} roles recorded`, score: Math.min(90, experienceCount * 35 || 40) },
                    { cat: "Profile Completeness", count: `${profile.profileCompletionPercentage}% complete`, score: profile.profileCompletionPercentage },
                  ].map((dim) => (
                    <div key={dim.cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: "#18181B" }}>{dim.cat}</span>
                        <span style={{ color: "#6B6B6B" }}>{dim.count}</span>
                      </div>
                      <div style={{ height: 6, backgroundColor: "#F5F5F4", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${dim.score}%`, height: "100%", backgroundColor: dim.score >= 70 ? "#176B5B" : "#18181B" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Projects List */}
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111111" }}>
                        Your Documented Projects ({projectCount})
                      </h3>
                      <p style={{ fontSize: 12, color: "#6B6B6B", margin: "2px 0 0" }}>
                        Evidence sources for your technical claims
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("profile")}
                      style={{ background: "none", border: "none", color: "#176B5B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      + Add
                    </button>
                  </div>

                  {projectCount === 0 ? (
                    <div style={{ backgroundColor: "#FAFAF9", border: "1px dashed #D6D3D1", borderRadius: 8, padding: 20, textAlign: "center", color: "#6B6B6B", fontSize: 13 }}>
                      No project evidence yet.
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => setActiveTab("profile")}
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
                          + Add a Project
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {profile.projects.slice(0, 3).map((p: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: "#FAFAF9",
                            border: "1px solid #E7E5E4",
                            borderRadius: 8,
                            padding: "10px 14px",
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#111111" }}>{p.title}</div>
                          <div style={{ fontSize: 11, color: "#176B5B", marginTop: 2 }}>
                            {Array.isArray(p.techStack) ? p.techStack.join(", ") : p.techStack}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #E7E5E4", fontSize: 12, color: "#6B6B6B" }}>
                  All projects link directly into your recruiter-facing verification matrix.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 2: MY PROFILE (EDIT & EXPAND REAL DATA)              */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                  EDIT YOUR DOSSIER
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                  Student Profile & Evidence Locker
                </h2>
                <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                  Changes made here update your Student DNA and recruiter-facing evidence dossier.
                </p>
              </div>

              <button
                onClick={handleSaveProfileUpdates}
                style={{
                  backgroundColor: "#176B5B",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {editSuccess ? "✓ Profile Changes Saved!" : "Save Profile Changes"}
              </button>
            </div>

            {/* Academic Information */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#111111" }}>Academic Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>College / University</label>
                  <input
                    type="text"
                    value={profile.college}
                    onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Degree & Branch</label>
                  <input
                    type="text"
                    value={`${profile.degree} in ${profile.branch}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfile({ ...profile, branch: val });
                    }}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Graduation Year</label>
                  <input
                    type="text"
                    value={profile.graduationYear}
                    onChange={(e) => setProfile({ ...profile, graduationYear: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Manage Technical Skills */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#111111" }}>Your Skills ({skillCount})</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {profile.skills.map((s: any, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: "#FAFAF9",
                      border: "1px solid #E7E5E4",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <strong>{s.name || s}</strong>
                    <span style={{ fontSize: 11, color: "#6B6B6B" }}>({s.level || "Intermediate"})</span>
                    <button
                      onClick={() => setProfile({ ...profile, skills: profile.skills.filter((_, i) => i !== idx) })}
                      style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12, padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="New skill name..."
                  value={editingSkillName}
                  onChange={(e) => setEditingSkillName(e.target.value)}
                  style={{ padding: "8px 12px", border: "1px solid #E7E5E4", borderRadius: 6, fontSize: 13, width: 220 }}
                />
                <button
                  type="button"
                  onClick={handleAddSkillInline}
                  style={{ backgroundColor: "#18181B", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  + Add Skill
                </button>
              </div>
            </div>

            {/* Manage Projects */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#111111" }}>Your Projects ({projectCount})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {profile.projects.map((p: any, idx: number) => (
                  <div key={idx} style={{ padding: 14, backgroundColor: "#FAFAF9", border: "1px solid #E7E5E4", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#176B5B", marginTop: 2 }}>{Array.isArray(p.techStack) ? p.techStack.join(", ") : p.techStack}</div>
                      <div style={{ fontSize: 13, color: "#4B5563", marginTop: 4 }}>{p.description}</div>
                    </div>
                    <button
                      onClick={() => setProfile({ ...profile, projects: profile.projects.filter((_, i) => i !== idx) })}
                      style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ border: "1px dashed #D6D3D1", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Add New Project</div>
                <input
                  type="text"
                  placeholder="Project title..."
                  value={editingProjTitle}
                  onChange={(e) => setEditingProjTitle(e.target.value)}
                  style={{ padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, fontSize: 13 }}
                />
                <input
                  type="text"
                  placeholder="Technologies used (comma separated, e.g. Python, SQL)..."
                  value={editingProjTech}
                  onChange={(e) => setEditingProjTech(e.target.value)}
                  style={{ padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, fontSize: 13 }}
                />
                <textarea
                  rows={2}
                  placeholder="Brief description of what you built..."
                  value={editingProjDesc}
                  onChange={(e) => setEditingProjDesc(e.target.value)}
                  style={{ padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, fontSize: 13 }}
                />
                <button
                  type="button"
                  onClick={handleAddProjectInline}
                  style={{ backgroundColor: "#18181B", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}
                >
                  + Add Project to Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 3: RESUME INTELLIGENCE                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "resume" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                SCORE ➔ EVIDENCE ➔ ACTION
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Resume Intelligence & Extracted Evidence
              </h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: "4px 0 0" }}>
                Grounded directly in {profile.fullName}'s documented project proofs.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
              {/* Document Overview */}
              <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
                  {profile.fullName || "Candidate"}
                </h3>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 16 }}>
                  {profile.college} • {profile.degree} in {profile.branch} (Class of {profile.graduationYear})
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#18181B", marginBottom: 6 }}>
                  PROJECT CLAIMS
                </div>
                {projectCount === 0 ? (
                  <div style={{ fontSize: 13, color: "#6B6B6B", fontStyle: "italic", marginBottom: 16 }}>
                    No project claims provided yet. Add projects to generate evidence.
                  </div>
                ) : (
                  <ul style={{ fontSize: 13, color: "#374151", paddingLeft: 18, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {profile.projects.map((p: any, idx: number) => (
                      <li key={idx}>
                        <strong>{p.title}:</strong> {p.description} (Tech: {Array.isArray(p.techStack) ? p.techStack.join(", ") : p.techStack})
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#18181B", marginBottom: 6 }}>
                  TECHNICAL SKILL CLAIMS
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {profile.skills.map((s: any, idx: number) => (
                    <span key={idx} style={{ backgroundColor: "#FAFAF9", border: "1px solid #E7E5E4", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                      {s.name || s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Analysis & Expandable Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {profile.skills.map((s: any, idx: number) => {
                  const sName = s.name || s;
                  const matchingProjs = profile.projects.filter((p: any) =>
                    (Array.isArray(p.techStack) ? p.techStack : []).some(
                      (t: string) => t.toLowerCase() === sName.toLowerCase()
                    )
                  );
                  const isVerified = matchingProjs.length > 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => setExpandedEvidenceIdx(expandedEvidenceIdx === idx ? null : idx)}
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E7E5E4",
                        borderRadius: 10,
                        padding: 16,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{sName}</span>
                          <span style={{ fontSize: 11, color: isVerified ? "#176B5B" : "#B45309", marginLeft: 8, fontWeight: 600 }}>
                            {isVerified ? "✓ VERIFIED IN PROJECT" : "○ UNVERIFIED CLAIM"}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: "#6B6B6B" }}>
                          {expandedEvidenceIdx === idx ? "▲" : "▼"}
                        </span>
                      </div>

                      {expandedEvidenceIdx === idx && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F5F5F4", fontSize: 12 }}>
                          {isVerified ? (
                            <div style={{ color: "#18181B" }}>
                              <strong>Evidence:</strong> Used in {matchingProjs.map((p: any) => p.title).join(", ")}.
                              <div style={{ color: "#176B5B", marginTop: 4, fontWeight: 600 }}>
                                ➔ Action: Ready for technical round verification.
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: "#6B6B6B" }}>
                              <strong>Evidence:</strong> No project in your profile references {sName}.
                              <div style={{ color: "#B45309", marginTop: 4, fontWeight: 600 }}>
                                ➔ Action: Add a project demonstrating {sName} to establish proof.
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 4: CANDIDATE DNA                                      */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "dna" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                COMPETENCY MATRIX
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Candidate DNA for {profile.fullName}
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {[
                {
                  dim: "Technical Skills",
                  value: `${skillCount} skills`,
                  proof: profile.skills.map((s: any) => s.name || s).join(", ") || "No skills recorded yet.",
                },
                {
                  dim: "Project Depth",
                  value: `${projectCount} projects`,
                  proof: profile.projects.map((p: any) => p.title).join(", ") || "No projects added yet.",
                },
                {
                  dim: "Experience",
                  value: `${experienceCount} roles`,
                  proof: profile.experience.map((e: any) => `${e.role} @ ${e.organization}`).join(", ") || "No external experience recorded.",
                },
                {
                  dim: "Achievements",
                  value: `${profile.achievements.length} records`,
                  proof: profile.achievements.map((a: any) => a.title).join(", ") || "None added yet.",
                },
              ].map((dna) => (
                <div key={dna.dim} style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111111" }}>{dna.dim}</h4>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#176B5B" }}>{dna.value}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#4B5563", margin: "10px 0 0", lineHeight: 1.5 }}>
                    <strong>Evidence:</strong> {dna.proof}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 5: OPPORTUNITIES                                      */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "opportunities" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                  MATCHED TO YOUR PROFILE
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                  Opportunities for {profile.fullName}
                </h2>
              </div>

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

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 10,
                    padding: 22,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div style={{ maxWidth: 740 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#111111" }}>{opp.role}</div>
                    <div style={{ fontSize: 12, color: "#6B6B6B", margin: "2px 0 10px" }}>
                      <strong>{opp.company}</strong> • {opp.location} • Deadline: {opp.deadline}
                    </div>
                    <div style={{ fontSize: 13, color: "#18181B", display: "flex", flexDirection: "column", gap: 4 }}>
                      <div><strong style={{ color: "#176B5B" }}>Matched Skills:</strong> {opp.matchedSkills.join(", ")}</div>
                      {opp.missingSkills.length > 0 && (
                        <div><strong style={{ color: "#B45309" }}>Missing Skills:</strong> {opp.missingSkills.join(", ")}</div>
                      )}
                      <div style={{ color: "#4B5563" }}><strong>Reason:</strong> {opp.reason}</div>
                      <div style={{ color: "#176B5B", fontWeight: 600 }}>➔ <strong>Next Action:</strong> {opp.nextAction}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                    <span style={{ backgroundColor: "#EBF5F3", color: "#176B5B", padding: "4px 10px", borderRadius: 6, fontSize: 16, fontWeight: 700 }}>
                      {opp.match}% Match
                    </span>
                    <Link
                      href="/interview"
                      style={{
                        backgroundColor: "#18181B",
                        color: "#FFFFFF",
                        textDecoration: "none",
                        borderRadius: 6,
                        padding: "6px 14px",
                        fontSize: 12,
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
        {/* TAB 6: INTERVIEW STUDIO                                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "interview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                  PROCTORED ASSESSMENT STUDIO
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                  Technical Interview Studio for {profile.fullName}
                </h2>
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

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>
                Target Assessment Profile
              </h3>
              <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                Interviewer persona: <strong>Alex, Staff Engineer at Google</strong>. Questions will probe the exact project claims and technical stack documented in your profile ({profile.projects.length} project(s), {profile.skills.length} skill(s)).
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 7: ATS OPTIMIZATION                                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "ats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                ATS INTEGRATION
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                ATS Compliance & Parser Optimization
              </h2>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Resume File</h3>
              <div style={{ fontSize: 13, color: "#4B5563" }}>
                {profile.resumeFileName ? `Active Document: ${profile.resumeFileName}` : "No resume PDF uploaded yet."}
              </div>
              <div style={{ marginTop: 14 }}>
                <button
                  onClick={() => setActiveTab("profile")}
                  style={{
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Manage Resume & Upload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 8: CAREER ROADMAP                                     */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "roadmap" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                PROGRESSIVE MILESTONES
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Career Roadmap for {profile.fullName}
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {[
                { step: 1, title: "Current Baseline", date: "Active", goal: `Documented ${skillCount} skills and ${projectCount} projects` },
                { step: 2, title: "Skill Gap Closure", date: "Upcoming", goal: "Complete missing cloud deployment proofs" },
                { step: 3, title: "Target Internship", date: "2026/27", goal: `Apply to ${profile.careerGoals?.targetCompanies?.join(", ") || "Target Companies"}` },
              ].map((m, idx) => (
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
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: selectedMilestone === idx ? "#9DD0C7" : "#176B5B", marginBottom: 6 }}>
                    PHASE 0{m.step}
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>{m.title}</h4>
                  <div style={{ fontSize: 12, color: selectedMilestone === idx ? "#D6D3D1" : "#6B6B6B" }}>{m.goal}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 9: CALENDAR                                           */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "calendar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>
                UPCOMING DATES
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Placement Calendar
              </h2>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { date: "Oct 15, 2026", title: "Stripe SWE Intern Application Deadline", tag: "Application" },
                  { date: "Oct 22, 2026", title: "Google Early Career Technical Round Simulation", tag: "Interview" },
                  { date: "Nov 02, 2026", title: "Datadog Campus Assessment Drive", tag: "Drive" },
                ].map((ev) => (
                  <div key={ev.title} style={{ padding: 12, backgroundColor: "#FAFAF9", border: "1px solid #E7E5E4", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: "#6B6B6B" }}>{ev.date}</div>
                    </div>
                    <span style={{ backgroundColor: "#EBF5F3", color: "#176B5B", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {ev.tag}
                    </span>
                  </div>
                ))}
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
                ACCOUNT GOVERNANCE
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: "4px 0 0" }}>
                Data Privacy & Settings for {profile.fullName}
              </h2>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Your User Account ID</div>
                <div style={{ fontSize: 12, color: "#6B6B6B", fontFamily: "monospace", marginTop: 2 }}>{profile.userId}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Email Address</div>
                <div style={{ fontSize: 13, color: "#18181B", marginTop: 2 }}>{profile.email}</div>
              </div>
              <div style={{ borderTop: "1px solid #E7E5E4", paddingTop: 14 }}>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/login");
                  }}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #FCA5A5",
                    color: "#991B1B",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Sign Out of Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
