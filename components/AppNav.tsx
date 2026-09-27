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
              recruiterProfile: data.recruiterProfile,
            });
            if (data.authenticated && data.user?.id && typeof window !== "undefined") {
              localStorage.setItem("cognalyze_student_id", data.user.id);
            }
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
      if (typeof window !== "undefined") {
        localStorage.removeItem("cognalyze_student_id");
      }
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
    { href: "/student/dashboard", label: "Overview", icon: "📊" },
    { href: "/student/resume", label: "Resume Intelligence", icon: "📄" },
    { href: "/student/skills", label: "Skill DNA", icon: "🎯" },
    { href: "/student/opportunities", label: "Opportunities", icon: "💼" },
    { href: "/interview", label: "Interview Studio", icon: "🎙️" },
    { href: "/student/calendar", label: "Calendar", icon: "📅" },
  ];

  const recruiterTopLinks = [
    { href: "/recruiter/dashboard", label: "Overview", icon: "📊" },
    { href: "/recruiter/candidates", label: "Candidates", icon: "👥" },
    { href: "/recruiter/roles", label: "JD Intelligence", icon: "📋" },
    { href: "/recruiter/decision-room", label: "Decision Room", icon: "⚖️" },
    { href: "/recruiter/analytics", label: "Analytics", icon: "📈" },
  ];

  const topLinks = role === "recruiter" ? recruiterTopLinks : studentTopLinks;

  const studentFeatureCategories: NavCategory[] = [
    {
      category: "Profile & Evidence Intelligence",
      items: [
        { href: "/student/dashboard", label: "Student Command Center", icon: "📊" },
        { href: "/student/profile", label: "Candidate Dossier & Profile", icon: "👤" },
        { href: "/student/dna", label: "Candidate DNA Analysis", icon: "🧬" },
        { href: "/student/evidence", label: "Verified Evidence Locker", icon: "🛡️" },
        { href: "/student/resume", label: "Resume Intelligence & Proofs", icon: "📄", badge: "Verified" },
      ],
    },
    {
      category: "Adaptive Skill & Learning Hub",
      items: [
        { href: "/student/skills", label: "Adaptive Skill Practice Hub", icon: "🎯" },
        { href: "/student/skills/cs-interview", label: "CS Fundamentals Round", icon: "💻" },
        { href: "/student/skills/system-design", label: "System Design Studio", icon: "🏗️" },
        { href: "/student/skills/behavioral", label: "STAR Behavioral Preparation", icon: "🤝" },
        { href: "/student/dsa-tracker", label: "DSA Algorithmic Problem Tracker", icon: "⚡" },
      ],
    },
    {
      category: "Interview & Assessment Simulators",
      items: [
        { href: "/interview", label: "FAANG Mock Interview Studio", icon: "🎙️", badge: "Proctored" },
        { href: "/interview?secure=true", label: "Secure Proctored Assessment", icon: "🛡️" },
        { href: "/student/mentor", label: "Socratic AI Mentor", icon: "💬" },
        { href: "/student/gd-practice", label: "Group Discussion Arena", icon: "👥" },
        { href: "/student/interview-prep/history", label: "Past Dossiers & Feedback", icon: "🕒" },
      ],
    },
    {
      category: "Opportunities & Pipeline",
      items: [
        { href: "/student/opportunities", label: "Verified Opportunities", icon: "🎯" },
        { href: "/student/applications", label: "Application Tracker", icon: "📝" },
        { href: "/student/calendar", label: "Placement Drive Calendar", icon: "📅" },
      ],
    },
  ];

  const recruiterFeatureCategories: NavCategory[] = [
    {
      category: "Sourcing & Evidence Pipeline",
      items: [
        { href: "/recruiter/dashboard", label: "Recruiter Command Center", icon: "📊" },
        { href: "/recruiter/candidates", label: "Verified Candidate Pool", icon: "👥" },
        { href: "/recruiter/roles", label: "Job Description Intelligence", icon: "📋" },
        { href: "/recruiter/jobs", label: "Manage Active Openings", icon: "💼" },
      ],
    },
    {
      category: "Decision Support & Analytics",
      items: [
        { href: "/recruiter/decision-room", label: "Decision Room & Multi-Matrix", icon: "⚖️", badge: "Audit" },
        { href: "/recruiter/quality-of-hire", label: "Quality of Hire Tracker", icon: "📈" },
        { href: "/recruiter/analytics", label: "Hiring Funnel Analytics", icon: "📉" },
        { href: "/recruiter/interviews", label: "Candidate Interview Records", icon: "🎙️" },
      ],
    },
  ];

  const categories = role === "recruiter" ? recruiterFeatureCategories : studentFeatureCategories;

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          !drawerSearch ||
          item.label.toLowerCase().includes(drawerSearch.toLowerCase()) ||
          cat.category.toLowerCase().includes(drawerSearch.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const handleSwitchRole = async (targetRole: "student" | "recruiter") => {
    setSwitching(true);
    try {
      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
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

  const displayName =
    session.studentProfile?.fullName ||
    session.recruiterProfile?.fullName ||
    session.user?.fullName ||
    session.user?.email?.split("@")[0] ||
    "User";

  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E7E5E4",
          height: 60,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            width: "100%",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Left Brand & Drawer Trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              title="Toggle Navigation Menu"
              aria-label="Navigation Menu"
              style={{
                backgroundColor: drawerOpen ? "#F5F5F4" : "#FFFFFF",
                border: "1px solid #E7E5E4",
                color: "#18181B",
                width: 34,
                height: 34,
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                transition: "all 150ms ease",
              }}
            >
              ☰
            </button>

            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  backgroundColor: "#18181B",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                C
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#18181B", letterSpacing: "0.4px" }}>
                  COGNALYZE
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#176B5B",
                    backgroundColor: "#EBF5F3",
                    border: "1px solid #9DD0C7",
                    borderRadius: 4,
                    padding: "1px 6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {role}
                </span>
              </div>
            </Link>
          </div>

          {/* Center Quick Navigation Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            className="hidden md:flex"
          >
            {topLinks.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/student/dashboard" &&
                  item.href !== "/recruiter/dashboard" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#18181B" : "#6B6B6B",
                    backgroundColor: isActive ? "#F5F5F4" : "transparent",
                    transition: "all 150ms ease",
                  }}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Role Switcher & Auth Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Quick Mode Switcher */}
            <button
              onClick={() => handleSwitchRole(role === "recruiter" ? "student" : "recruiter")}
              disabled={switching}
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E7E5E4",
                color: "#18181B",
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: switching ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>⇄</span>
              <span>{role === "recruiter" ? "Student Mode" : "Recruiter Mode"}</span>
            </button>

            {/* Profile Avatar & Name */}
            {session.authenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 8px",
                    borderRadius: 6,
                    backgroundColor: "#FAFAF9",
                    border: "1px solid #E7E5E4",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      backgroundColor: "#18181B",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {userInitials}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#18181B",
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayName}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Sign out"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#6B6B6B",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: "4px 6px",
                  }}
                >
                  Exit
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <Link
                  href="/login"
                  style={{
                    textDecoration: "none",
                    color: "#18181B",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 12px",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  style={{
                    textDecoration: "none",
                    backgroundColor: "#18181B",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: 6,
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── COLLAPSIBLE DRAWER ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 998,
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(4px)",
            transition: "opacity 0.2s ease",
          }}
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 320,
          maxWidth: "85vw",
          zIndex: 999,
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E7E5E4",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #E7E5E4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
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
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.4px" }}>
              COGNALYZE {role.toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#6B6B6B",
              fontSize: 16,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Feature Search */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #E7E5E4", backgroundColor: "#FAFAF9" }}>
          <input
            type="text"
            placeholder="Search features..."
            value={drawerSearch}
            onChange={(e) => setDrawerSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              fontSize: 12,
              border: "1px solid #E7E5E4",
              borderRadius: 6,
              outline: "none",
              backgroundColor: "#FFFFFF",
              color: "#18181B",
            }}
          />
        </div>

        {/* Categories List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {filteredCategories.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 8,
                }}
              >
                {group.category}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
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
                        padding: "8px 10px",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#18181B" : "#4B5563",
                        backgroundColor: isActive ? "#F5F5F4" : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13 }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontWeight: 600,
                            backgroundColor: "#EBF5F3",
                            color: "#176B5B",
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

        {/* Drawer Footer */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #E7E5E4",
            backgroundColor: "#FAFAF9",
          }}
        >
          <button
            onClick={() => {
              handleSwitchRole(role === "recruiter" ? "student" : "recruiter");
              setDrawerOpen(false);
            }}
            disabled={switching}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #E7E5E4",
              backgroundColor: "#FFFFFF",
              color: "#18181B",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Switch to {role === "recruiter" ? "Student Mode" : "Recruiter Mode"}
          </button>
        </div>
      </aside>
    </>
  );
}
