"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AppNavProps {
  role?: "student" | "recruiter" | "admin";
}

export default function AppNav({ role = "student" }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const studentLinks = [
    { href: "/student/dashboard", label: "Overview", icon: "🏠" },
    { href: "/post", label: "Post / Feed", icon: "📢" },
    { href: "/interview", label: "FAANG Interview", icon: "🎙️" },
    { href: "/student/simulation", label: "Recruitment Sim", icon: "🏆" },
    { href: "/student/opportunities", label: "Opportunities", icon: "🎯" },
    { href: "/student/resume", label: "Resume", icon: "📄" },
    { href: "/student/dsa-tracker", label: "DSA Tracker", icon: "⚡" },
    { href: "/student/interview-prep", label: "All Arenas", icon: "📚" },
    { href: "/student/applications", label: "Applications", icon: "📋" },
    { href: "/student/calendar", label: "Calendar", icon: "📅" }
  ];

  const recruiterLinks = [
    { href: "/recruiter/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/post", label: "Post / Feed", icon: "📢" },
    { href: "/recruiter/jobs", label: "Jobs (JD)", icon: "💼" },
    { href: "/recruiter/candidates", label: "Candidates & Ranking", icon: "👥" },
    { href: "/recruiter/interviews", label: "Interview Intelligence", icon: "🎤" },
    { href: "/recruiter/analytics", label: "Hiring Analytics", icon: "📈" }
  ];

  const links = role === "recruiter" ? recruiterLinks : studentLinks;

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
        {/* Brand / Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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

        {/* Dynamic Navigation Links per Role */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {links.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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

        {/* Right Tools & Role Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Switch Section Button (Takes user back to Three-Way Landing Router) */}
          <Link
            href="/?switch=true"
            title="Switch Platform Section"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              color: "#c7d2fe",
              transition: "all 0.15s ease"
            }}
          >
            <span>⇄</span>
            <span>Switch Section</span>
          </Link>

          {/* Quick Role Toggle Button */}
          <button
            onClick={() => handleSwitchRole(role === "recruiter" ? "student" : "recruiter")}
            disabled={switching}
            title={role === "recruiter" ? "Toggle to Student Mode" : "Toggle to Recruiter Mode"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
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
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#94a3b8",
              fontSize: 14
            }}
          >
            🔔
          </Link>
        </div>
      </div>
    </header>
  );
}
