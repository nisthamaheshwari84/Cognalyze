"use client";

import React, { useEffect } from "react";
import Link from "next/link";

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
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
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
          maxWidth: 540,
          backgroundColor: "#0f172a",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(15, 23, 42, 0.8)"
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: 0.8 }}>
              {opportunity.organizer}
            </span>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>
              {opportunity.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Explainable Match Rationale */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              backgroundColor: "rgba(37, 99, 235, 0.12)",
              border: "1px solid rgba(37, 99, 235, 0.3)"
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 0.6 }}>
              ✦ Why Cognalyze Matched You
            </div>
            <div style={{ fontSize: 13, color: "#93c5fd", fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>
              {opportunity.matchReason}
            </div>
          </div>

          {/* Verified Evidence vs Needs Gaps */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>
              Verified Skills Supporting This Match
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {opportunity.verifiedTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 6,
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                    border: "1px solid rgba(16, 185, 129, 0.3)"
                  }}
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>

          {opportunity.missingTags.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>
                Suggested Capabilities to Strengthen
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {opportunity.missingTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 6,
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                      color: "#fbbf24",
                      border: "1px solid rgba(245, 158, 11, 0.3)"
                    }}
                  >
                    ⚠ {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {opportunity.deadline && (
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              <strong style={{ color: "#e2e8f0" }}>Deadline:</strong> {opportunity.deadline}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Link
              href={opportunity.sourceUrl || "/student/opportunities"}
              target={opportunity.sourceUrl?.startsWith("http") ? "_blank" : undefined}
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 10,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                textAlign: "center",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)"
              }}
            >
              Open Application / Portal ↗
            </Link>
            <Link
              href="/student/opportunities"
              onClick={onClose}
              style={{
                padding: "11px 18px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#cbd5e1",
                fontSize: 13,
                fontWeight: 700,
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
