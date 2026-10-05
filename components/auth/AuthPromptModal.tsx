"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Lock, Sparkles, X, ArrowRight, UserCheck } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: "dna" | "profile" | "resume" | "application" | "general";
  redirectPath?: string;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  title = "Build Your Student DNA",
  description = "Create a personalized career intelligence profile with verified evidence, skill maps, and tailored opportunities.",
  feature = "dna",
  redirectPath = "/student/dashboard"
}: AuthPromptModalProps) {
  const { isDark } = useTheme();

  // Escape key to dismiss cleanly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const loginRedirect = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  const signupRedirect = `/signup?role=student&redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(10, 18, 30, 0.65)",
        backdropFilter: "blur(6px)",
        padding: 16,
        animation: "fadeIn 0.15s ease-out"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          backgroundColor: isDark ? "#0F1A2A" : "#FFFFFF",
          borderRadius: 12,
          border: isDark ? "1px solid #1E344F" : "1px solid #E4E1DA",
          boxShadow: isDark
            ? "0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            : "0 24px 48px -12px rgba(20, 30, 50, 0.15), 0 2px 6px rgba(0,0,0,0.04)",
          padding: 28,
          position: "relative",
          color: isDark ? "#F2F6FC" : "#17191C"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            color: isDark ? "#8FA0B8" : "#8A909A",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <X size={18} />
        </button>

        {/* Feature Icon Header */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: isDark ? "#172A42" : "#EEF4FF",
            border: isDark ? "1px solid #23436B" : "1px solid #D0E1FD",
            color: isDark ? "#60A5FA" : "#2563EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18
          }}
        >
          {feature === "dna" ? (
            <Sparkles size={22} />
          ) : feature === "profile" ? (
            <UserCheck size={22} />
          ) : (
            <Lock size={22} />
          )}
        </div>

        {/* Title & Description */}
        <h3
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 8px",
            color: isDark ? "#F2F6FC" : "#17191C",
            letterSpacing: "-0.01em"
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.55,
            color: isDark ? "#9FB0C5" : "#555E68",
            margin: "0 0 22px"
          }}
        >
          {description}
        </p>

        {/* Value Highlights */}
        <div
          style={{
            backgroundColor: isDark ? "#142236" : "#F7F6F2",
            border: isDark ? "1px solid #1C334F" : "1px solid #ECE9E1",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 7
          }}
        >
          <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, color: isDark ? "#D2DFEE" : "#32383E" }}>
            <span style={{ color: "#10B981" }}>✓</span>
            <span>Personalized requirement gap radar & evidence mapping</span>
          </div>
          <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, color: isDark ? "#D2DFEE" : "#32383E" }}>
            <span style={{ color: "#10B981" }}>✓</span>
            <span>Private application pipeline with milestone reminders</span>
          </div>
          <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, color: isDark ? "#D2DFEE" : "#32383E" }}>
            <span style={{ color: "#10B981" }}>✓</span>
            <span>Zero cross-user data leakage guarantee</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            href={loginRedirect}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "11px 16px",
              backgroundColor: isDark ? "#2563EB" : "#17191C",
              color: "#FFFFFF",
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 13.5,
              textDecoration: "none",
              transition: "opacity 0.15s ease",
              boxSizing: "border-box"
            }}
          >
            <span>Sign In / Sign Up</span>
            <ArrowRight size={15} />
          </Link>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px 16px",
              backgroundColor: "transparent",
              border: isDark ? "1px solid #233A54" : "1px solid #D6D2C8",
              color: isDark ? "#B0C2D6" : "#4A525A",
              borderRadius: 7,
              fontWeight: 500,
              fontSize: 13,
              cursor: "pointer",
              transition: "background-color 0.15s ease"
            }}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
