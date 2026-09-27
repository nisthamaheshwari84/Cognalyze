"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AppNavProps {
  role?: "student" | "recruiter" | "admin";
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
  description?: string;
}

interface NavCategory {
  category: string;
  icon: string;
  items: NavItem[];
}

export default function AppNav({ role = "student" }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [switching, setSwitching] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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
              recruiterProfile: data.recruiterProfile
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
  }, [pathname]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    if (drawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({ loading: false, authenticated: false });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const studentTopLinks = [
    { href: "/student/dashboard", label: "Home", icon: "🏠" },
    { href: "/student/journey", label: "Journey", icon: "🗺️" },
    { href: "/student/skills", label: "Practice", icon: "⚡" },
    { href: "/student/interview-prep", label: "Interviews", icon: "🎙️" },
    { href: "/student/opportunities", label: "Opportunities", icon: "🎯" },
    { href: "/student/evidence", label: "Evidence", icon: "📊" },
    { href: "/student/dna", label: "Student DNA", icon: "🧬" }
  ];

  const recruiterTopLinks = [
    { href: "/recruiter/pipeline", label: "Pipeline", icon: "⚡" },
    { href: "/recruiter/roles", label: "Roles", icon: "📋" },
    { href: "/recruiter/candidates", label: "Candidates", icon: "👥" },
    { href: "/recruiter/decision-room", label: "Decisions", icon: "⚖️" },
    { href: "/recruiter/quality-of-hire", label: "Outcomes", icon: "📈" },
    { href: "/recruiter/organization", label: "Org & Mobility", icon: "🏢" },
    { href: "/post", label: "Network", icon: "🌐" }
  ];

  const topLinks = role === "recruiter" ? recruiterTopLinks : studentTopLinks;

  // ══════════════════════════════════════════════════════════════════════
  // CATEGORIZED FEATURES FOR COLLAPSIBLE DRAWER
  // ══════════════════════════════════════════════════════════════════════

  const studentFeatureCategories: NavCategory[] = [
    {
      category: "Core Career & Intelligence",
      icon: "🧭",
      items: [
        { href: "/student/dashboard", label: "Overview Dashboard", icon: "🏠", badge: "Live" },
        { href: "/student/journey", label: "Career Journey & Intent", icon: "🗺️" },
        { href: "/student/dna", label: "Student DNA & Roles", icon: "🧬", badge: "Core" },
        { href: "/student/evidence", label: "Verified Evidence Portfolio", icon: "📊" },
        { href: "/student/growth", label: "Growth Radar & Gap Engine", icon: "📈" },
        { href: "/student/calendar", label: "Placement Calendar & Deadlines", icon: "📅" },
        { href: "/student/resume", label: "Resume Studio & ATS Score", icon: "📄" },
        { href: "/student/passport", label: "Placement Passport", icon: "🛂" },
        { href: "/student/profile", label: "Profile & Verification", icon: "👤" }
      ]
    },
    {
      category: "Skill Practice Hub & Arenas",
      icon: "⚡",
      items: [
        { href: "/student/skills", label: "Adaptive Skill Practice Hub", icon: "🎯", badge: "Upgraded" },
        { href: "/student/skills/cs-interview", label: "CS Fundamentals Technical Round", icon: "💻", badge: "Adaptive" },
        { href: "/student/skills/system-design", label: "System Design Whiteboard Arena", icon: "🏗️", badge: "Canvas" },
        { href: "/student/skills/behavioral", label: "STAR Behavioral & HR Studio", icon: "🤝" },
        { href: "/student/skills/communication", label: "Spoken English & Communication", icon: "🎙️" },
        { href: "/student/skills/aptitude", label: "Mass Aptitude Exam Arena", icon: "🧮" },
        { href: "/student/skills/patterns", label: "Company Hiring Pattern Banks", icon: "🏛️" },
        { href: "/student/dsa-tracker", label: "DSA Algorithmic Problem Tracker", icon: "⚡" }
      ]
    },
    {
      category: "Interview & Assessment Simulators",
      icon: "🎙️",
      items: [
        { href: "/interview", label: "Proctored AI Technical Interview", icon: "🎙️", badge: "Proctored" },
        { href: "/secure-interview", label: "Secure Proctored Assessment", icon: "🛡️" },
        { href: "/student/gd-practice", label: "Group Discussion (GD) Arena", icon: "👥" },
        { href: "/student/mentor", label: "Cognalyze Voice AI Mentor", icon: "🤖" },
        { href: "/student/assessment-arena", label: "Full Assessment Arena", icon: "🏆" },
        { href: "/student/simulation", label: "Placement Day Simulation", icon: "🕹️" },
        { href: "/student/question-bank", label: "Master Question Bank", icon: "📚" },
        { href: "/student/interview-prep/history", label: "Past Interview Dossiers & History", icon: "🕒" }
      ]
    },
    {
      category: "Opportunities, Pipeline & Community",
      icon: "🎯",
      items: [
        { href: "/student/opportunities", label: "Verified Jobs & Hackathons", icon: "🎯", badge: "Hot" },
        { href: "/student/applications", label: "Application Pipeline Tracker", icon: "📝" },
        { href: "/student/community", label: "Placement Community & Discussion", icon: "💬" },
        { href: "/student/collaboration", label: "Peer Collaboration & Projects", icon: "🤝" },
        { href: "/post", label: "Network & Project Showcase", icon: "🌐" }
      ]
    }
  ];

  const recruiterFeatureCategories: NavCategory[] = [
    {
      category: "Pipeline & Sourcing",
      icon: "⚡",
      items: [
        { href: "/recruiter/dashboard", label: "Recruiter Overview", icon: "📊" },
        { href: "/recruiter/pipeline", label: "Candidate Live Pipeline", icon: "⚡", badge: "Live" },
        { href: "/recruiter/roles", label: "Evidence-Grounded Roles", icon: "📋" },
        { href: "/recruiter/candidates", label: "Verified Candidate Pool", icon: "👥" },
        { href: "/recruiter/jobs", label: "Manage Job Openings", icon: "💼" },
        { href: "/post", label: "Campus Network & Sourcing", icon: "🌐" }
      ]
    },
    {
      category: "Hiring Intelligence & Governance",
      icon: "⚖️",
      items: [
        { href: "/recruiter/decision-room", label: "Decision Room & AI Council", icon: "⚖️", badge: "Council" },
        { href: "/recruiter/quality-of-hire", label: "Quality of Hire & Retention", icon: "📈" },
        { href: "/recruiter/organization", label: "Org Capability & Mobility", icon: "🏢" },
        { href: "/recruiter/analytics", label: "Hiring Analytics & Funnels", icon: "📉" },
        { href: "/recruiter/interviews", label: "Proctored Candidate Interviews", icon: "🎙️" }
      ]
    }
  ];

  const categories = role === "recruiter" ? recruiterFeatureCategories : studentFeatureCategories;

  const filteredCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !drawerSearch ||
      item.label.toLowerCase().includes(drawerSearch.toLowerCase()) ||
      cat.category.toLowerCase().includes(drawerSearch.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  const handleSwitchRole = async (targetRole: "student" | "recruiter") => {
    setSwitching(true);
    try {
      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole })
      });
      if (targetRole === "recruiter") {
        router.push("/recruiter/dashboard");
      } else {
        router.push("/student/dashboard");
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to switch role:", err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10, 15, 29, 0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 20px"
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap"
          }}
        >
          {/* Top-Left: Hamburger Button ☰ + Brand Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            
            {/* Top-left ☰ Button */}
            <button
              id="top-left-hamburger-btn"
              onClick={() => setDrawerOpen(!drawerOpen)}
              title="Open Feature Drawer (☰)"
              aria-label="Toggle navigation drawer"
              style={{
                background: drawerOpen ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.06)",
                border: drawerOpen ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(255, 255, 255, 0.12)",
                color: drawerOpen ? "#a5b4fc" : "#e2e8f0",
                width: 36,
                height: 36,
                borderRadius: 8,
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                padding: 0
              }}
            >
              ☰
            </button>

            {/* Brand / Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: role === "recruiter"
                    ? "linear-gradient(135deg, #a855f7, #6366f1)"
                    : "linear-gradient(135deg, #6366f1, #06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  color: "white",
                  fontSize: 16,
                  boxShadow: "0 0 15px rgba(99,102,241,0.3)"
                }}
              >
                {role === "recruiter" ? "👔" : "⚡"}
              </div>
              <div>
                <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>
                  COGNALYZE
                </span>
                <span
                  style={{
                    fontSize: 10,
                    marginLeft: 6,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontWeight: 800,
                    background: role === "recruiter" ? "rgba(168,85,247,0.2)" : "rgba(99,102,241,0.2)",
                    color: role === "recruiter" ? "#d8b4fe" : "#818cf8",
                    border: `1px solid ${role === "recruiter" ? "rgba(168,85,247,0.4)" : "rgba(99,102,241,0.4)"}`
                  }}
                >
                  {role === "recruiter" ? "RECRUITER" : "STUDENT"}
                </span>
              </div>
            </Link>
          </div>

          {/* Top Quick Navigation Links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {topLinks.map(item => {
              const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "white" : "rgba(255, 255, 255, 0.65)",
                    background: isActive
                      ? role === "recruiter"
                        ? "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(99,102,241,0.2))"
                        : "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.2))"
                      : "transparent",
                    border: isActive
                      ? `1px solid ${role === "recruiter" ? "rgba(168,85,247,0.4)" : "rgba(99,102,241,0.4)"}`
                      : "1px solid transparent",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Tools, Auth & Role Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Switch Section Button */}
            <Link
              href="/?switch=true"
              title="Switch Platform Section"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 11px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#c7d2fe",
                transition: "all 0.15s ease"
              }}
            >
              <span>⇄</span>
              <span>Switch</span>
            </Link>

            {/* Quick Role Toggle Button */}
            <button
              onClick={() => handleSwitchRole(role === "recruiter" ? "student" : "recruiter")}
              disabled={switching}
              title={role === "recruiter" ? "Toggle to Student Mode" : "Toggle to Recruiter Mode"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 11px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: switching ? "not-allowed" : "pointer",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#cbd5e1",
                transition: "all 0.15s ease"
              }}
            >
              <span>{switching ? "..." : role === "recruiter" ? "Student Mode" : "Recruiter Mode"}</span>
            </button>

            {/* Quick Notification Bell */}
            <Link
              href={role === "recruiter" ? "/recruiter/dashboard" : "/student/calendar"}
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94a3b8",
                fontSize: 13
              }}
            >
              🔔
            </Link>

            {/* Vertical Divider */}
            <div style={{ width: 1, height: 20, background: "rgba(255, 255, 255, 0.12)", margin: "0 2px" }} />

            {/* Authentication Actions */}
            {session.authenticated && session.user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 9px",
                    borderRadius: 20,
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)"
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: role === "recruiter" ? "#a855f7" : "#6366f1",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    {(session.studentProfile?.fullName?.[0] || session.recruiterProfile?.fullName?.[0] || session.user.email?.[0] || "U").toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#e2e8f0",
                      maxWidth: 110,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {session.studentProfile?.fullName || session.recruiterProfile?.fullName || session.user.email?.split("@")[0]}
                  </span>
                </div>

                <button
                  id="appnav-sign-out"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Sign out of your account"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 11px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: loggingOut ? "not-allowed" : "pointer",
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.28)",
                    color: "#fca5a5",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>{loggingOut ? "..." : "Sign Out"}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Link
                  id="appnav-sign-in"
                  href="/login"
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    color: "#ffffff",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>Sign In</span>
                </Link>

                <Link
                  id="appnav-sign-up"
                  href="/signup"
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 13px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    color: "#ffffff",
                    boxShadow: "0 0 12px rgba(99, 102, 241, 0.35)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          COLLAPSIBLE LEFT DRAWER (Top-Left ☰ → Categorized Features)
          ══════════════════════════════════════════════════════════════ */}
      
      {/* Dark Backdrop Blur Overlay */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 998,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.25s ease"
        }}
      />

      {/* Left Drawer Container */}
      <aside
        id="cognalyze-collapsible-drawer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 340,
          maxWidth: "85vw",
          zIndex: 999,
          backgroundColor: "#0a0f1d",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "10px 0 40px rgba(0, 0, 0, 0.8)",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
          color: "#f8fafc"
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(15, 23, 42, 0.7)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: role === "recruiter" ? "linear-gradient(135deg,#a855f7,#6366f1)" : "linear-gradient(135deg,#6366f1,#06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "white",
                fontSize: 14
              }}
            >
              {role === "recruiter" ? "👔" : "⚡"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.3px", color: "white" }}>
                COGNALYZE
              </div>
              <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 700 }}>
                {role === "recruiter" ? "Recruiter Operating System" : "Student Career Intelligence"}
              </div>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(false)}
            title="Close Drawer (Esc)"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#94a3b8",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Real-time Feature Search Input */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", background: "rgba(15, 23, 42, 0.3)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 8,
              padding: "6px 12px"
            }}
          >
            <span style={{ fontSize: 12, color: "#94a3b8" }}>🔍</span>
            <input
              type="text"
              placeholder="Search all features..."
              value={drawerSearch}
              onChange={e => setDrawerSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "white",
                fontSize: 12,
                width: "100%"
              }}
            />
            {drawerSearch && (
              <button
                onClick={() => setDrawerSearch("")}
                style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categorized Features Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
          {filteredCategories.map((group, groupIdx) => (
            <div key={groupIdx} style={{ marginBottom: 20 }}>
              {/* Category Title */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                  paddingLeft: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>{group.icon}</span>
                <span>{group.category}</span>
              </div>

              {/* Category Links */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {group.items.map(item => {
                  const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href + "/"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      style={{
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "white" : "rgba(255, 255, 255, 0.75)",
                        background: isActive ? "rgba(99, 102, 241, 0.2)" : "transparent",
                        border: isActive ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid transparent",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ fontSize: 14 }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 800,
                            background:
                              item.badge === "Live"
                                ? "rgba(16,185,129,0.2)"
                                : item.badge === "Upgraded"
                                ? "rgba(99,102,241,0.25)"
                                : item.badge === "Adaptive"
                                ? "rgba(56,189,248,0.2)"
                                : "rgba(245,158,11,0.2)",
                            color:
                              item.badge === "Live"
                                ? "#34d399"
                                : item.badge === "Upgraded"
                                ? "#c7d2fe"
                                : item.badge === "Adaptive"
                                ? "#38bdf8"
                                : "#fbbf24"
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer: Role Switch & Profile Identity */}
        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(15, 23, 42, 0.85)",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
          {/* Quick Switch to Recruiter / Student Mode */}
          <button
            onClick={() => {
              handleSwitchRole(role === "recruiter" ? "student" : "recruiter");
              setDrawerOpen(false);
            }}
            disabled={switching}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            <span>⇄</span>
            <span>Switch to {role === "recruiter" ? "Student Mode" : "Recruiter Mode"}</span>
          </button>

          {/* User Signout or Sign In */}
          {session.authenticated && session.user ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                Signed in as <strong style={{ color: "white" }}>{session.user.email?.split("@")[0]}</strong>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f87171",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "7px 10px",
                  borderRadius: 6,
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setDrawerOpen(false)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "7px 10px",
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
