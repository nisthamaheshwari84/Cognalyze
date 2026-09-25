"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

type ProfileTab = "basic" | "academic" | "skills" | "interests" | "projects" | "experience" | "links" | "preferences";

export default function StudentProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("basic");
  const [candidateId, setCandidateId] = useState("student-demo");
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State initialized with grounded student data
  const [basicInfo, setBasicInfo] = useState({
    fullName: "Nistha Maheshwari",
    email: "nistha@cognalyze.ai",
    phone: "+91 98765 43210",
    location: "Bengaluru, Karnataka, India",
    bio: "3rd Year Computer Science student passionate about full-stack engineering, distributed systems, and agentic AI."
  });

  const [academicInfo, setAcademicInfo] = useState({
    university: "National Institute of Technology",
    degree: "B.Tech in Computer Science & Engineering",
    graduationYear: "2026",
    cgpa: "8.85 / 10.0",
    semester: "6th Semester"
  });

  const [skillsList, setSkillsList] = useState([
    { name: "TypeScript", level: "Advanced", source: "Verified GitHub & Projects" },
    { name: "React / Next.js", level: "Advanced", source: "Verified Projects" },
    { name: "Python", level: "Intermediate", source: "Verified Assessment (88%)" },
    { name: "PostgreSQL", level: "Advanced", source: "Verified Projects" },
    { name: "Distributed Systems", level: "Intermediate", source: "Demonstrated Code" },
    { name: "FastAPI", level: "Intermediate", source: "Verified Projects" }
  ]);

  const [interests, setInterests] = useState([
    "Applied AI & Agentic Systems",
    "Distributed High-Concurrency Systems",
    "Fintech & Payment Infrastructure",
    "Cloud Architecture & DevOps"
  ]);

  const [projectsList, setProjectsList] = useState([
    {
      title: "Autonomous Payment Recovery Agent",
      tech: "Next.js, Python, LangChain, Razorpay API",
      desc: "Intelligent AI agent detecting churn patterns and automating recovery workflows with webhook verification.",
      link: "https://github.com/demo/autonomous-payment-agent"
    },
    {
      title: "Distributed Edge Sensor Pipeline",
      tech: "Go, MQTT, PostgreSQL, Docker",
      desc: "Real-time telemetry collection and anomaly detection for IoT industrial sensors with sub-50ms latency.",
      link: "https://github.com/demo/edge-sensor-pipeline"
    }
  ]);

  const [experienceList, setExperienceList] = useState([
    {
      role: "Software Engineering Intern",
      organization: "FinTech Innovations Lab",
      duration: "May 2025 – July 2025",
      details: "Engineered high-throughput event processing pipelines using Kafka and optimized PostgreSQL indices."
    },
    {
      role: "Finalist — Smart India Hackathon",
      organization: "Ministry of Railways & AICTE",
      duration: "October 2024",
      details: "Architected real-time railway sensor anomaly detection system selected for national finals."
    }
  ]);

  const [linksInfo, setLinksInfo] = useState({
    github: "https://github.com/nisthamaheshwari85",
    linkedin: "https://linkedin.com/in/nistha-maheshwari",
    leetcode: "https://leetcode.com/u/nisthadev",
    portfolio: "https://nistha.dev"
  });

  const [preferences, setPreferences] = useState({
    teamMatchingOptIn: true,
    notificationDigest: "daily",
    remoteOnly: false,
    targetHorizon: "Summer 2026 Internship & PPI"
  });

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") || "student-demo" : "student-demo";
    setCandidateId(stored);
    loadProfile(stored);
  }, []);

  const loadProfile = async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/dna?candidateId=${cId}`);
      const data = await res.json();
      if (data.intelligence?.intent) {
        setPreferences(prev => ({
          ...prev,
          targetHorizon: data.intelligence.intent.timeline || prev.targetHorizon
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const tabs: Array<{ id: ProfileTab; label: string; icon: string }> = [
    { id: "basic", label: "Basic Information", icon: "👤" },
    { id: "academic", label: "Academic", icon: "🎓" },
    { id: "skills", label: "Skills", icon: "⚡" },
    { id: "interests", label: "Interests", icon: "🎯" },
    { id: "projects", label: "Projects", icon: "💻" },
    { id: "experience", label: "Experience", icon: "💼" },
    { id: "links", label: "Links", icon: "🔗" },
    { id: "preferences", label: "Preferences & Settings", icon: "⚙️" }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: "2px solid rgba(255,255,255,0.2)" }}>
              🚀
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "white", margin: 0 }}>
                  {basicInfo.fullName}
                </h1>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)", fontWeight: 800 }}>
                  STUDENT
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                {academicInfo.degree} • {academicInfo.university}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {savedSuccess && (
              <span style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>
                ✓ Profile saved successfully
              </span>
            )}
            <button
              onClick={handleSave}
              style={{
                padding: "8px 20px",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                border: "none",
                borderRadius: 8,
                color: "white",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Save Changes
            </button>
            <Link
              href="/student/dna"
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              View Student DNA ↗
            </Link>
          </div>
        </div>

        {/* Tabbed Layout: Left Clean Tabs, Right Content */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, alignItems: "flex-start" }}>
          
          {/* Tabs Sidebar */}
          <div style={{ background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: activeTab === tab.id ? "rgba(99, 102, 241, 0.2)" : "transparent",
                  color: activeTab === tab.id ? "white" : "rgba(255, 255, 255, 0.7)",
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.12s ease"
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panel */}
          <div style={{ background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px 28px" }}>
            
            {/* 1. Basic Information */}
            {activeTab === "basic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "0 0 8px" }}>Basic Information</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>FULL NAME</label>
                    <input
                      type="text"
                      value={basicInfo.fullName}
                      onChange={e => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={basicInfo.email}
                      onChange={e => setBasicInfo({ ...basicInfo, email: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>PHONE NUMBER</label>
                    <input
                      type="text"
                      value={basicInfo.phone}
                      onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>LOCATION</label>
                    <input
                      type="text"
                      value={basicInfo.location}
                      onChange={e => setBasicInfo({ ...basicInfo, location: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>PROFESSIONAL BIO</label>
                  <textarea
                    rows={3}
                    value={basicInfo.bio}
                    onChange={e => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none", resize: "vertical" }}
                  />
                </div>
              </div>
            )}

            {/* 2. Academic Information */}
            {activeTab === "academic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "0 0 8px" }}>Academic Information</h2>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>UNIVERSITY / COLLEGE</label>
                  <input
                    type="text"
                    value={academicInfo.university}
                    onChange={e => setAcademicInfo({ ...academicInfo, university: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>DEGREE &amp; MAJOR</label>
                  <input
                    type="text"
                    value={academicInfo.degree}
                    onChange={e => setAcademicInfo({ ...academicInfo, degree: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>GRADUATION YEAR</label>
                    <input
                      type="text"
                      value={academicInfo.graduationYear}
                      onChange={e => setAcademicInfo({ ...academicInfo, graduationYear: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>CGPA / PERCENTAGE</label>
                    <input
                      type="text"
                      value={academicInfo.cgpa}
                      onChange={e => setAcademicInfo({ ...academicInfo, cgpa: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>CURRENT SEMESTER</label>
                    <input
                      type="text"
                      value={academicInfo.semester}
                      onChange={e => setAcademicInfo({ ...academicInfo, semester: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Skills */}
            {activeTab === "skills" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: 0 }}>Skills &amp; Provenance</h2>
                  <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>✓ Evidence-grounded</span>
                </div>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                  These skills are reflected in your Student DNA. Add or update declared proficiencies.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {skillsList.map((skill, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{skill.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Source: {skill.source}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderRadius: 4, fontWeight: 700 }}>
                        {skill.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Interests */}
            {activeTab === "interests" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "0 0 8px" }}>Engineering Interests</h2>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                  Used to personalize opportunity matching and recommend hackathon tracks.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {interests.map((interest, idx) => (
                    <span key={idx} style={{ padding: "6px 14px", background: "rgba(99,102,241,0.15)", color: "#c7d2fe", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                      📌 {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Projects */}
            {activeTab === "projects" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "0 0 8px" }}>Projects &amp; Portfolios</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {projectsList.map((p, idx) => (
                    <div key={idx} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>{p.title}</div>
                        <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#38bdf8", textDecoration: "none" }}>GitHub ↗</a>
                      </div>
                      <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600, marginBottom: 6 }}>{p.tech}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Experience */}
            {activeTab === "experience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "0 0 8px" }}>Experience &amp; Achievements</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {experienceList.map((exp, idx) => (
                    <div key={idx} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>{exp.role}</div>
                        <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>{exp.duration}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 600, marginBottom: 6 }}>{exp.organization}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{exp.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Links */}
            {activeTab === "links" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "0 0 8px" }}>Socials &amp; Code Links</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>GITHUB PROFILE</label>
                    <input
                      type="url"
                      value={linksInfo.github}
                      onChange={e => setLinksInfo({ ...linksInfo, github: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>LINKEDIN URL</label>
                    <input
                      type="url"
                      value={linksInfo.linkedin}
                      onChange={e => setLinksInfo({ ...linksInfo, linkedin: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>LEETCODE PROFILE</label>
                    <input
                      type="url"
                      value={linksInfo.leetcode}
                      onChange={e => setLinksInfo({ ...linksInfo, leetcode: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>PORTFOLIO WEBSITE</label>
                    <input
                      type="url"
                      value={linksInfo.portfolio}
                      onChange={e => setLinksInfo({ ...linksInfo, portfolio: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 8. Preferences & Settings */}
            {activeTab === "preferences" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "0 0 8px" }}>Preferences &amp; Account Settings</h2>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Team Matching Opt-In</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Allow verified candidates to discover and invite you for hackathon syndicates.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.teamMatchingOptIn}
                    onChange={e => setPreferences({ ...preferences, teamMatchingOptIn: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "#6366f1", cursor: "pointer" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>TARGET PLACEMENT HORIZON</label>
                  <input
                    type="text"
                    value={preferences.targetHorizon}
                    onChange={e => setPreferences({ ...preferences, targetHorizon: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                  />
                </div>

                <div style={{ padding: "14px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#c7d2fe", marginBottom: 4 }}>Need Help or Account Reset?</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
                    Contact campus support or switch to Recruiter Command Center for recruitment testing.
                  </div>
                  <Link href="/?switch=true" style={{ fontSize: 11, color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}>
                    Switch Platform Section ↗
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
