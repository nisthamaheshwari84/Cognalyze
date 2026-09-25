"use client";

import React from "react";
import Link from "next/link";
import { SessionBrief } from "@/lib/skills/adaptive-engine";

interface SessionBriefModalProps {
  brief: SessionBrief | null;
  isOpen: boolean;
  onClose: () => void;
  onStartSession?: () => void;
  targetHref: string;
}

export default function SessionBriefModal({
  brief,
  isOpen,
  onClose,
  onStartSession,
  targetHref
}: SessionBriefModalProps) {
  if (!isOpen || !brief) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          border: "1px solid rgba(99, 102, 241, 0.35)",
          borderRadius: 20,
          padding: 28,
          color: "#f8fafc",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  background: "rgba(99, 102, 241, 0.25)",
                  color: "#c7d2fe",
                  border: "1px solid rgba(99, 102, 241, 0.3)"
                }}
              >
                CONTEXTUAL SESSION BRIEF
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  fontWeight: 700
                }}
              >
                {brief.trackName}
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "rgba(168, 85, 247, 0.15)",
                  color: "#c084fc",
                  fontWeight: 700
                }}
              >
                {brief.difficultyLevel}
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "white" }}>
              {brief.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#94a3b8",
              fontSize: 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Candidate Context Alert if present */}
        {brief.candidateContextNote && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              fontSize: 12,
              color: "#fbbf24",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span>⚡</span>
            <span>{brief.candidateContextNote}</span>
          </div>
        )}

        {/* Why This Session */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Why This Session Today
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.5 }}>
            {brief.whyThisSession}
          </p>
        </div>

        {/* Session Goal */}
        <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(255, 255, 255, 0.03)", borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.07)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            🎯 Session Objective
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.4 }}>
            {brief.sessionGoal}
          </p>
        </div>

        {/* Focus Areas */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Key Diagnostic Focus Areas
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {brief.focusAreas.map((area, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "#c7d2fe"
                }}
              >
                ✓ {area}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Meta */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 16,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>ESTIMATED TIME</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>⏱️ {brief.estimatedMinutes} Mins</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>EVIDENCE GENERATED</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399" }}>📜 Verified Live Evidence</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <Link href={targetHref} style={{ textDecoration: "none" }}>
              <button
                onClick={() => {
                  if (onStartSession) onStartSession();
                  onClose();
                }}
                style={{
                  padding: "10px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)"
                }}
              >
                <span>Start Personalized Session</span>
                <span>➔</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
