"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearUserSessionStorage } from "@/lib/client-storage-cleanup";
import {
  LayoutDashboard,
  GitPullRequest,
  Briefcase,
  Users,
  ShieldCheck,
  Video,
  Compass,
  Map,
  Dna,
  FileCheck,
  FileText,
  Settings,
  HelpCircle,
  Search,
  Bell,
  CheckCircle2,
  Menu,
  X,
  ArrowLeftRight,
  LogOut,
  Sparkles,
  Target,
  Award,
  Code2,
  Moon,
  MessageSquare,
  Bot,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface AppNavProps {
  role?: "student" | "recruiter" | "admin";
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

// Module-level in-memory session cache to prevent redundant HTTP waterfall on every route transition
let cachedAppNavSession: any = null;
let lastAppNavSessionFetch = 0;
const SESSION_CACHE_TTL = 30_000; // 30 seconds

export default function AppNav({ role = "student" }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<{
    loading: boolean;
    authenticated: boolean;
    user?: any;
    studentProfile?: any;
    recruiterProfile?: any;
  }>(() => {
    if (cachedAppNavSession) {
      return {
        loading: false,
        authenticated: !!cachedAppNavSession.authenticated,
        user: cachedAppNavSession.user,
        studentProfile: cachedAppNavSession.studentProfile,
        recruiterProfile: cachedAppNavSession.recruiterProfile,
      };
    }
    return { loading: true, authenticated: false };
  });

  useEffect(() => {
    let isMounted = true;
    const now = Date.now();

    // Use cached session if fresh, avoiding redundant /api/auth/session requests on every route change
    if (cachedAppNavSession && now - lastAppNavSessionFetch < SESSION_CACHE_TTL) {
      return;
    }

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          cachedAppNavSession = data;
          lastAppNavSessionFetch = Date.now();
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
  }, []); // Run on mount, not on every pathname change

  // Close sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    cachedAppNavSession = null;
    lastAppNavSessionFetch = 0;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (typeof window !== "undefined") {
        clearUserSessionStorage();
      }
      setSession({ loading: false, authenticated: false });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSwitchRole = async (targetRole: "student" | "recruiter") => {
    setSwitching(true);
    cachedAppNavSession = null;
    lastAppNavSessionFetch = 0;
    try {
      const demoRes = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      if (demoRes.ok) {
        window.location.href = targetRole === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard";
        return;
      }

      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      window.location.href = targetRole === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard";
    } catch (err) {
      console.error("Failed to switch role:", err);
      window.location.href = targetRole === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard";
    } finally {
      setSwitching(false);
    }
  };

  // Section 7 Navigation Specifications
  const recruiterNavItems: NavItem[] = [
    { href: "/recruiter/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/recruiter/decision-room", label: "Decision Room", icon: GitPullRequest, badge: "Flagship" },
    { href: "/recruiter/roles", label: "Roles", icon: Briefcase },
    { href: "/recruiter/candidates", label: "Candidates", icon: Users },
    { href: "/recruiter/quality-of-hire", label: "Evidence", icon: ShieldCheck },
    { href: "/recruiter/interviews", label: "Interviews", icon: Video },
    { href: "/post", label: "Post Feed", icon: MessageSquare },
    { href: "/student/opportunities", label: "Opportunities", icon: Compass },
  ];

  const studentNavItems: NavItem[] = [
    { href: "/student/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/student/journey", label: "Journey", icon: Map },
    { href: "/student/dna", label: "Student DNA", icon: Dna, badge: "Live" },
    { href: "/student/opportunities", label: "Opportunities", icon: Compass },
    { href: "/student/applications", label: "Applications", icon: FileCheck },
    { href: "/resume", label: "Resume", icon: FileText },
    { href: "/interview", label: "Interviews", icon: Video },
    { href: "/skill-practice", label: "Skill Practice Hub", icon: Target },
    { href: "/recruitment-simulation", label: "Recruitment Simulation", icon: Award },
    { href: "/dsa-tracker", label: "DSA Tracker", icon: Code2 },
    { href: "/question-bank", label: "Question Bank", icon: HelpCircle },
    { href: "/group-discussion", label: "Group Discussion", icon: MessageSquare },
    { href: "/student/ai-mentor", label: "Cognalyze AI Mentor", icon: Bot, badge: "✦ New" },
  ];

  const navItems = role === "recruiter" ? recruiterNavItems : studentNavItems;

  const isItemActive = (href: string) => {
    if (href === "/student/dashboard") {
      return pathname === "/student/dashboard" || pathname === "/student";
    }
    if (href === "/skill-practice") {
      return (
        pathname === "/skill-practice" ||
        pathname.startsWith("/skill-practice/") ||
        pathname === "/student/skills" ||
        pathname.startsWith("/student/skills/")
      );
    }
    if (href === "/recruitment-simulation") {
      return (
        pathname === "/recruitment-simulation" ||
        pathname.startsWith("/recruitment-simulation/") ||
        pathname === "/student/simulation" ||
        pathname.startsWith("/student/simulation/")
      );
    }
    if (href === "/dsa-tracker") {
      return (
        pathname === "/dsa-tracker" ||
        pathname.startsWith("/dsa-tracker/") ||
        pathname === "/student/dsa-tracker" ||
        pathname.startsWith("/student/dsa-tracker/")
      );
    }
    if (href === "/question-bank") {
      return (
        pathname === "/question-bank" ||
        pathname.startsWith("/question-bank/") ||
        pathname === "/student/question-bank" ||
        pathname.startsWith("/student/question-bank/")
      );
    }
    if (href === "/group-discussion") {
      return (
        pathname === "/group-discussion" ||
        pathname.startsWith("/group-discussion/") ||
        pathname === "/student/gd-practice" ||
        pathname.startsWith("/student/gd-practice/")
      );
    }
    if (href === "/student/ai-mentor") {
      return (
        pathname === "/student/ai-mentor" ||
        pathname.startsWith("/student/ai-mentor/") ||
        pathname === "/student/mentor" ||
        pathname.startsWith("/student/mentor/")
      );
    }
    if (href === "/resume") {
      return (
        pathname === "/resume" ||
        pathname.startsWith("/resume/") ||
        pathname === "/student/resume" ||
        pathname.startsWith("/student/resume/")
      );
    }
    if (href === "/interview") {
      return (
        pathname === "/interview" ||
        pathname.startsWith("/interview/") ||
        pathname.startsWith("/secure-interview")
      );
    }
    return (
      pathname === href ||
      (href !== "/student/dashboard" &&
        href !== "/recruiter/dashboard" &&
        pathname.startsWith(href + "/"))
    );
  };

  // Determine current page title
  const getPageTitle = () => {
    if (pathname.includes("/skill-practice") || pathname.includes("/student/skills")) {
      return "Skill Practice Hub";
    }
    if (pathname.includes("/recruitment-simulation") || pathname.includes("/student/simulation")) {
      return "Recruitment Simulation";
    }
    if (pathname.includes("/dsa-tracker")) {
      return "DSA Tracker";
    }
    if (pathname.includes("/question-bank") || pathname.includes("/student/question-bank")) {
      return "Question Bank";
    }
    if (pathname.includes("/group-discussion") || pathname.includes("/student/gd-practice")) {
      return "Group Discussion";
    }
    if (pathname.includes("/ai-mentor") || pathname.includes("/student/mentor")) {
      return "Cognalyze AI Mentor";
    }
    const current = navItems.find((item) => isItemActive(item.href));
    if (current) return current.label;
    if (pathname.includes("/resume")) return "Resume Studio";
    if (pathname.includes("/interview") || pathname.includes("/secure-interview")) return "Technical Interview";
    if (pathname.includes("/dna")) return "Student DNA";
    if (pathname.includes("/decision-room")) return "Decision Room";
    return role === "recruiter" ? "Recruiter Intelligence" : "Career Intelligence";
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. TOP NAVIGATION BAR (Section 8)                        */}
      {/* ======================================================== */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: isDark ? "#0A1626" : "#FFFFFF",
          borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          boxShadow: isDark ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "0 1px 2px rgba(16, 24, 40, 0.03)",
          transition: "background-color 150ms ease, border-color 150ms ease",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1440, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          {/* Left: Sidebar Trigger + Logo + Page Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Sidebar Trigger (Mobile & Desktop) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 6,
                border: `1px solid ${isDark ? "#1C3048" : "#E4E1DA"}`,
                background: isDark ? "#142339" : "#F6F5F1",
                color: isDark ? "#F1F5F9" : "#162A43",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              aria-label="Toggle Navigation Sidebar"
              id="sidebar-toggle-btn"
              title="Toggle Navigation Sidebar"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            {/* Brand Logo & Mark */}
            <Link
              href={role === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard"}
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
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
                  letterSpacing: "-0.5px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                C
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "-0.3px",
                    color: isDark ? "#FFFFFF" : "#162A43",
                  }}
                >
                  COGNALYZE
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "1px 5px",
                    borderRadius: 4,
                    backgroundColor: isDark ? "#142339" : "#F0EFEA",
                    color: isDark ? "#94A3B8" : "#667085",
                    border: `1px solid ${isDark ? "#1C3048" : "#E4E1DA"}`,
                    textTransform: "uppercase",
                  }}
                >
                  {role}
                </span>
              </div>
            </Link>

            {/* Subtle Divider */}
            <div style={{ width: 1, height: 16, backgroundColor: isDark ? "#1C3048" : "#E4E1DA" }} className="hidden sm:block" />

            {/* Page Context */}
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: isDark ? "#94A3B8" : "#667085",
              }}
              className="hidden sm:block"
            >
              {getPageTitle()}
            </span>
          </div>

          {/* Center / Search Input (Section 8 & 29) */}
          <div style={{ flex: "1 1 auto", maxWidth: 360 }} className="hidden md:block">
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  color: "#98A2B3",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates, roles, evidence..."
                style={{
                  width: "100%",
                  height: 32,
                  paddingLeft: 32,
                  paddingRight: 10,
                  fontSize: 12,
                  borderRadius: 7,
                  border: `1px solid ${isDark ? "#263D57" : "#E4E1DA"}`,
                  backgroundColor: isDark ? "#101F34" : "#F6F5F1",
                  color: isDark ? "#EAF0F8" : "#17191C",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "all 150ms ease",
                }}
                className="focus:border-[#356AE6] focus:ring-1 focus:ring-[#356AE6]"
              />
            </div>
          </div>

          {/* Right Tools: Role Toggle, Notifications, Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Direct Post Feed Button */}
            <Link
              href="/post"
              style={{ textDecoration: "none" }}
              title="Browse Community Post & Hiring Feed"
            >
              <button
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 28,
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "#1C3048" : "#E4E1DA"}`,
                  backgroundColor: isDark ? "rgba(53, 106, 230, 0.15)" : "#EEF4FD",
                  color: "#356AE6",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
                className="hover:bg-[#DCE7FB]"
              >
                <span>📢</span>
                <span>Post Feed</span>
              </button>
            </Link>

            {/* Quick Role Switch Button */}
            <button
              onClick={() => handleSwitchRole(role === "recruiter" ? "student" : "recruiter")}
              disabled={switching}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 28,
                padding: "0 9px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                border: `1px solid ${isDark ? "#1C3048" : "#E4E1DA"}`,
                backgroundColor: isDark ? "#142339" : "#F6F5F1",
                color: isDark ? "#F1F5F9" : "#162A43",
                cursor: switching ? "not-allowed" : "pointer",
                transition: "all 150ms ease",
              }}
              title={`Switch to ${role === "recruiter" ? "Student" : "Recruiter"} Workspace`}
            >
              <ArrowLeftRight size={11} color="#667085" />
              <span>{switching ? "Switching..." : role === "recruiter" ? "Student Mode" : "Recruiter Mode"}</span>
            </button>

            {/* Notifications Bell */}
            <Link
              href={role === "recruiter" ? "/recruiter/dashboard" : "/student/calendar"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 6,
                border: `1px solid ${isDark ? "#1C3048" : "#E4E1DA"}`,
                backgroundColor: isDark ? "#142339" : "#FFFFFF",
                color: isDark ? "#94A3B8" : "#667085",
                textDecoration: "none",
                position: "relative",
                transition: "all 150ms ease",
              }}
              title="Notifications"
            >
              <Bell size={14} />
              <span
                style={{
                  position: "absolute",
                  top: 7,
                  right: 7,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: "#356AE6",
                }}
              />
            </Link>

            {/* Profile Info & Status Badge (Section 8) */}
            {session.authenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 6, borderLeft: `1px solid ${isDark ? "#1C3048" : "#E4E1DA"}` }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: "#162A43",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  {role === "recruiter"
                    ? session.recruiterProfile?.company_name?.[0] || "R"
                    : session.user?.fullName?.[0] || session.user?.name?.[0] || "S"}
                </div>

                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }} className="hidden sm:flex">
                  <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#F1F5F9" : "#17191C" }}>
                    {role === "recruiter"
                      ? session.recruiterProfile?.company_name || "Apex Hiring"
                      : session.user?.fullName || session.user?.name || "Student"}
                  </span>
                  <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                    <CheckCircle2 size={9} />
                    {role === "recruiter" ? "Verified Recruiter" : "Active Profile"}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 6, borderLeft: `1px solid ${isDark ? "#1C3048" : "#E4E1DA"}` }}>
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 14px",
                    borderRadius: 6,
                    backgroundColor: isDark ? "#2563EB" : "#17191C",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SIDEBAR NAVIGATION DRAWER / OVERLAY (Section 7)       */}
      {/* Background: #162A43 (Deep Navy), Outline Lucide Icons   */}
      {/* ======================================================== */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(10, 15, 29, 0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: 270,
              maxWidth: "85vw",
              backgroundColor: isDark ? "#0A1729" : "#162A43",
              color: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              boxShadow: "4px 0 24px rgba(0, 0, 0, 0.25)",
              animation: "fadeIn 150ms ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div
              style={{
                height: 56,
                padding: "0 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: isDark ? "1px solid #223750" : "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    backgroundColor: "#356AE6",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  C
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px", color: "white" }}>
                  COGNALYZE
                </span>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#98A2B3",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close Sidebar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Role Header Indicator */}
            <div style={{ padding: "16px 20px 8px" }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.8px",
                  color: "#98A2B3",
                  textTransform: "uppercase",
                }}
              >
                {role === "recruiter" ? "RECRUITER WORKSPACE" : "STUDENT WORKSPACE"}
              </div>
            </div>

            {/* Navigation Items (Section 7) - Visual continuity without divider after Interviews */}
            <div
              style={{
                flex: 1,
                padding: "8px 12px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 3,
                scrollbarWidth: "none",
              }}
            >
              {navItems.map((item) => {
                const isActive = isItemActive(item.href);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 7,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#F2F6FC" : (isDark ? "#B6C4D6" : "#CBD5E1"),
                      backgroundColor: isActive ? (isDark ? "rgba(52, 120, 246, 0.14)" : "rgba(255, 255, 255, 0.08)") : "transparent",
                      borderLeft: isActive ? "3px solid #3478F6" : "3px solid transparent",
                      transition: "all 150ms ease",
                    }}
                    className={isDark ? "hover:bg-[#13243A] hover:text-[#F2F6FC]" : "hover:bg-[rgba(255,255,255,0.05)] hover:text-white"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <IconComponent size={16} className={isActive ? (isDark ? "text-[#8FB5FF]" : "text-[#356AE6]") : (isDark ? "text-[#91A5BB]" : "text-[#94A3B8]")} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 4,
                          backgroundColor: item.badge.includes("New")
                            ? isDark
                              ? "#13243A"
                              : "#EFF4FE"
                            : "#356AE6",
                          color: item.badge.includes("New")
                            ? isDark
                              ? "#BFD4FF"
                              : "#356AE6"
                            : "#FFFFFF",
                          border: item.badge.includes("New")
                            ? isDark
                              ? "1px solid #2A435F"
                              : "1px solid #D2E0FB"
                            : "none",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Lower Section: Preferences (Dark Mode), Settings & Sign Out */}
            <div
              style={{
                padding: "12px",
                borderTop: isDark ? "1px solid #223750" : "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {/* Dark Mode Toggle */}
              <div
                onClick={toggleTheme}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleTheme();
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#CBD5E1",
                  backgroundColor: "transparent",
                  transition: "all 150ms ease",
                  userSelect: "none",
                }}
                className="hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                title="Toggle Dark Mode"
                id="sidebar-dark-mode-toggle"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Moon size={16} className={isDark ? "text-[#356AE6]" : "text-[#94A3B8]"} />
                  <span>Dark Mode</span>
                </div>

                {/* Compact Toggle Switch on the right side */}
                <div
                  style={{
                    width: 32,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: isDark ? "#356AE6" : "rgba(255, 255, 255, 0.2)",
                    position: "relative",
                    transition: "background-color 200ms ease",
                    display: "flex",
                    alignItems: "center",
                    padding: "2px",
                    boxSizing: "border-box",
                  }}
                  role="switch"
                  aria-checked={isDark}
                  aria-label="Dark mode toggle switch"
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: "#FFFFFF",
                      transform: isDark ? "translateX(14px)" : "translateX(0px)",
                      transition: "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.35)",
                    }}
                  />
                </div>
              </div>

              {/* Auth-dependent Actions */}
              {session.authenticated ? (
                <>
                  <Link
                    href="/student/profile"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 7,
                      color: "#CBD5E1",
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: "none",
                      transition: "all 150ms ease",
                    }}
                    className="hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                  >
                    <Settings size={16} className="text-[#94A3B8]" />
                    <span>Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 7,
                      color: "#F87171",
                      fontSize: 13,
                      fontWeight: 500,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 150ms ease",
                    }}
                    className="hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    <LogOut size={16} />
                    <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
                  </button>
                </>
              ) : (
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 7,
                    backgroundColor: "#2563EB",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 150ms ease",
                    justifyContent: "center",
                    marginTop: 4
                  }}
                >
                  <Sparkles size={16} />
                  <span>Sign In / Sign Up</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
