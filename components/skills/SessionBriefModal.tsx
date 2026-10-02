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
        backgroundColor: "rgba(22, 42, 67, 0.45)",
        backdropFilter: "blur(6px)",
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
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 12,
          padding: 24,
          color: "#17191C",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  borderRadius: 5,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  background: "#EFF4FE",
                  color: "#356AE6",
                  border: "1px solid #D2E0FB"
                }}
              >
                CONTEXTUAL SESSION BRIEF
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 7px",
                  borderRadius: 5,
                  background: "#F6F5F1",
                  color: "#162A43",
                  border: "1px solid #E4E1DA",
                  fontWeight: 700
                }}
              >
                {brief.trackName}
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 7px",
                  borderRadius: 5,
                  background: "#FEF7ED",
                  color: "#B7791F",
                  border: "1px solid #F8D8A7",
                  fontWeight: 700
                }}
              >
                {brief.difficultyLevel}
              </span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.02em" }}>
              {brief.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#667085",
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
              borderRadius: 7,
              background: "#FEF7ED",
              border: "1px solid #F8D8A7",
              fontSize: 12,
              color: "#B7791F",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 500
            }}
          >
            <span>⚡</span>
            <span>{brief.candidateContextNote}</span>
          </div>
        )}

        {/* Why This Session */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            Why This Session Today
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#17191C", lineHeight: 1.5 }}>
            {brief.whyThisSession}
          </p>
        </div>

        {/* Session Goal */}
        <div style={{ marginBottom: 14, padding: "12px 14px", background: "#F6F5F1", borderRadius: 8, border: "1px solid #E4E1DA" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            🎯 Session Objective
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#17191C", lineHeight: 1.4 }}>
            {brief.sessionGoal}
          </p>
        </div>

        {/* Focus Areas */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
            Key Diagnostic Focus Areas
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {brief.focusAreas.map((area, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  padding: "4px 9px",
                  borderRadius: 5,
                  background: "#EFF4FE",
                  border: "1px solid #D2E0FB",
                  color: "#356AE6",
                  fontWeight: 600
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
            borderTop: "1px solid #E4E1DA",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: "#667085", fontWeight: 600 }}>ESTIMATED TIME</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>⏱️ {brief.estimatedMinutes} Mins</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#667085", fontWeight: 600 }}>EVIDENCE GENERATED</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B" }}>📜 Verified Live Evidence</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                border: "1px solid #E4E1DA",
                background: "#FFFFFF",
                color: "#17191C",
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
                  padding: "8px 18px",
                  borderRadius: 7,
                  border: "none",
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgba(53, 106, 230, 0.3)"
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
