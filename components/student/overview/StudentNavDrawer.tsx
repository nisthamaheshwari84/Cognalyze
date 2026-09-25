"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface StudentNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  avatarInitials?: string;
}

export default function StudentNavDrawer({
  isOpen,
  onClose,
  studentName = "Nistha Maheshwari",
  avatarInitials = "NM"
}: StudentNavDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navItems = [
    { href: "/student/dashboard", label: "Overview", icon: "🏠" },
    { href: "/student/dna", label: "Student DNA", icon: "🧬" },
    { href: "/student/skills", label: "Learning & Gaps", icon: "◒" },
    { href: "/student/opportunities", label: "Opportunities", icon: "✦" },
    { href: "/student/applications", label: "Applications", icon: "↗" },
    { href: "/student/journey", label: "Journey", icon: "🗺️" },
    { href: "/student/calendar", label: "Placement Calendar", icon: "📅" },
    { href: "/student/mentor", label: "Mentor", icon: "🧠" }
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 310,
          maxWidth: "85vw",
          height: "100%",
          backgroundColor: "#ffffff",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 20px",
          borderRight: "1px solid #e2e8f0",
          animation: "slideInLeft 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 16
                }}
              >
                ⚡
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                  COGNALYZE
                </div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                  Career Operating System
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700
              }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, paddingLeft: 8 }}>
              Navigation
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === "/student/dashboard" && pathname === "/student");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 12,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#2563eb" : "#334155",
                    backgroundColor: isActive ? "#eff6ff" : "transparent",
                    border: isActive ? "1px solid #dbeafe" : "1px solid transparent",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#2563eb" }} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer / Student Identity */}
        <div style={{ paddingTop: 18, borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "#1e293b",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13
              }}
            >
              {avatarInitials}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {studentName}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Student Account
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/student/profile"
              onClick={onClose}
              style={{
                flex: 1,
                textAlign: "center",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 0",
                borderRadius: 8,
                backgroundColor: "#f1f5f9",
                color: "#334155"
              }}
            >
              Account
            </Link>
            <Link
              href="/recruiter/dashboard"
              onClick={onClose}
              style={{
                flex: 1,
                textAlign: "center",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 0",
                borderRadius: 8,
                backgroundColor: "#f8fafc",
                color: "#64748b",
                border: "1px solid #e2e8f0"
              }}
            >
              Recruiter Mode
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
