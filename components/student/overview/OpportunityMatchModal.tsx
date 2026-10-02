"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import CompanyLogo from "@/components/CompanyLogo";

interface OpportunityMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: {
    title: string;
    organizer: string;
    matchReason: string;
    verifiedTags: string[];
    missingTags: string[];
    deadline?: string;
    sourceUrl?: string;
    opportunityId?: string;
  } | null;
}

export default function OpportunityMatchModal({
  isOpen,
  onClose,
  opportunity
}: OpportunityMatchModalProps) {
  const { isDark } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !opportunity) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: isDark ? "rgba(7, 17, 31, 0.75)" : "rgba(22, 42, 67, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
          borderRadius: 12,
          border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
          boxShadow: isDark ? "0 20px 40px -10px rgba(0, 0, 0, 0.4)" : "0 20px 40px -10px rgba(22, 42, 67, 0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CompanyLogo companyName={opportunity.organizer} size={36} />
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#4C8DFF" : "#356AE6", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {opportunity.organizer}
              </span>
              <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", marginTop: 2 }}>
                {opportunity.title}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
              backgroundColor: isDark ? "#13243A" : "#F6F5F1",
              color: isDark ? "#B6C4D6" : "#667085",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Explainable Match Rationale */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 8,
              backgroundColor: isDark ? "rgba(76, 141, 255, 0.12)" : "#EEF4FD",
              border: isDark ? "1px solid rgba(76, 141, 255, 0.25)" : "1px solid #D1E2FB"
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#73A6FF" : "#356AE6", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Why this match?
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#F2F6FC" : "#162A43", fontWeight: 500, marginTop: 4, lineHeight: 1.5 }}>
              {opportunity.matchReason}
            </div>
          </div>

          {/* Verified Evidence */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>
              Verified Capabilities Supporting Match
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {opportunity.verifiedTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 9px",
                    borderRadius: 5,
                    backgroundColor: isDark ? "rgba(53, 185, 130, 0.12)" : "#EAF4EE",
                    color: isDark ? "#5ED19D" : "#2E7D5B",
                    border: isDark ? "1px solid rgba(53, 185, 130, 0.25)" : "1px solid #C8E4D3"
                  }}
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>

          {opportunity.missingTags.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>
                Open Gaps to Strengthen
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {opportunity.missingTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 9px",
                      borderRadius: 5,
                      backgroundColor: isDark ? "rgba(234, 182, 90, 0.12)" : "#FEF7ED",
                      color: isDark ? "#F0C978" : "#B7791F",
                      border: isDark ? "1px solid rgba(234, 182, 90, 0.25)" : "1px solid #FDE68A"
                    }}
                  >
                    ⚠ {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {opportunity.deadline && (
            <div style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085" }}>
              <strong style={{ color: isDark ? "#F2F6FC" : "#162A43" }}>Deadline:</strong> {opportunity.deadline}
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: "flex", gap: 10, marginTop: 6, paddingTop: 14, borderTop: isDark ? "1px solid #223750" : "1px solid #E4E1DA" }}>
            <Link
              href={opportunity.sourceUrl || "/student/opportunities"}
              target={opportunity.sourceUrl?.startsWith("http") ? "_blank" : undefined}
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 7,
                backgroundColor: isDark ? "#3478F6" : "#356AE6",
                color: "#ffffff",
                textAlign: "center",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 2px rgba(16, 24, 40, 0.05)"
              }}
            >
              Open Application Portal →
            </Link>
            <Link
              href="/student/opportunities"
              onClick={onClose}
              style={{
                padding: "10px 16px",
                borderRadius: 7,
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                color: isDark ? "#DCE7F5" : "#17191C",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center"
              }}
            >
              All Matches
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
