"use client";

import React, { useState } from "react";
import { X, Brain, Target, ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, Award } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { LearnerState, getLearnerState } from "@/lib/mentor/learner-model";

interface LearnerModelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
}

export default function LearnerModelDrawer({
  isOpen,
  onClose,
  studentId = "student-demo"
}: LearnerModelDrawerProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "concepts" | "misconceptions" | "interview">("overview");

  if (!isOpen) return null;

  const learner: LearnerState = getLearnerState(studentId);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          height: "100%",
          backgroundColor: isDark ? "#0A1220" : "#FFFFFF",
          borderLeft: `1px solid ${isDark ? "#223750" : "#E2E8F0"}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.4)",
          animation: "slideInRight 0.25s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Drawer Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${isDark ? "#1E2D44" : "#E2E8F0"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isDark ? "#0F1A2D" : "#F8FAFC"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#EEF4FD",
                color: "#3B82F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Brain size={18} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  margin: 0,
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  letterSpacing: "-0.01em"
                }}
              >
                Learner Cognitive Model
              </h2>
              <p
                style={{
                  fontSize: 11,
                  color: isDark ? "#94A3B8" : "#64748B",
                  margin: "2px 0 0"
                }}
              >
                Persistent mastery, misconceptions & interview signals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: isDark ? "#94A3B8" : "#64748B",
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${isDark ? "#1E2D44" : "#E2E8F0"}`,
            background: isDark ? "#0B1526" : "#FFFFFF"
          }}
        >
          {[
            { key: "overview", label: "Overview" },
            { key: "concepts", label: "Concepts" },
            { key: "misconceptions", label: "Misconceptions" },
            { key: "interview", label: "Interview Readiness" }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? (isDark ? "#60A5FA" : "#2563EB") : isDark ? "#94A3B8" : "#64748B",
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? (isDark ? "#3B82F6" : "#2563EB") : "transparent"}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Drawer Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Target Role Card */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 8,
                  backgroundColor: isDark ? "#101D33" : "#F0F7FF",
                  border: `1px solid ${isDark ? "#1E3A5F" : "#BAE6FD"}`
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Target size={14} color="#3B82F6" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#3B82F6", textTransform: "uppercase" }}>
                    Placement Target & Knowledge Level
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#FFFFFF" : "#0F172A" }}>
                  {learner.targetRole}
                </div>
                <div style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#475467", marginTop: 2 }}>
                  Level: <strong style={{ color: isDark ? "#38BDF8" : "#0284C7" }}>{learner.knowledgeLevel.toUpperCase()}</strong> · Active Goal: {learner.currentGoal}
                </div>
              </div>

              {/* Learning Preferences */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  backgroundColor: isDark ? "#0E1829" : "#F8FAFC",
                  border: `1px solid ${isDark ? "#1E2D44" : "#E2E8F0"}`
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#94A3B8" : "#64748B" }}>
                  Active Pedagogy Settings
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: isDark ? "#1E2D44" : "#E2E8F0",
                      color: isDark ? "#E2E8F0" : "#1E293B"
                    }}
                  >
                    Strategy: {learner.learningPreferences.explanationStyle}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: isDark ? "#1E2D44" : "#E2E8F0",
                      color: isDark ? "#E2E8F0" : "#1E293B"
                    }}
                  >
                    Pace: {learner.learningPreferences.pace}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: isDark ? "#1E2D44" : "#E2E8F0",
                      color: isDark ? "#E2E8F0" : "#1E293B"
                    }}
                  >
                    Language: {learner.learningPreferences.language.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Active Project Verified Defense Profile */}
              {learner.activeProjects.length > 0 && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    backgroundColor: isDark ? "#0E1829" : "#F8FAFC",
                    border: `1px solid ${isDark ? "#1E2D44" : "#E2E8F0"}`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <ShieldCheck size={14} color="#10B981" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#34D399" : "#059669" }}>
                      VERIFIED PROJECT IN STUDENT DNA
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#F1F5F9" : "#1E293B" }}>
                    {learner.activeProjects[0].name}
                  </div>
                  <div style={{ fontSize: 11.5, color: isDark ? "#94A3B8" : "#64748B", marginTop: 4 }}>
                    {learner.activeProjects[0].architecture}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {learner.activeProjects[0].technologies.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 3,
                          background: isDark ? "#1B2A3F" : "#E0E7FF",
                          color: isDark ? "#93C5FD" : "#3730A3"
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONCEPTS & MASTERY */}
          {activeTab === "concepts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.04em" }}>
                  MASTERED CONCEPTS ({learner.masteredConcepts.length})
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {learner.masteredConcepts.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        backgroundColor: isDark ? "rgba(16, 185, 129, 0.08)" : "#ECFDF5",
                        border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.2)" : "#A7F3D0"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12.5,
                        color: isDark ? "#E2E8F0" : "#065F46"
                      }}
                    >
                      <CheckCircle2 size={14} color="#10B981" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.04em" }}>
                  IDENTIFIED GAPS & DEVELOPING AREAS ({learner.weakConcepts.length})
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {learner.weakConcepts.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        backgroundColor: isDark ? "rgba(245, 158, 11, 0.08)" : "#FFFBEB",
                        border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.2)" : "#FDE68A"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12.5,
                        color: isDark ? "#E2E8F0" : "#92400E"
                      }}
                    >
                      <AlertTriangle size={14} color="#F59E0B" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MISCONCEPTIONS */}
          {activeTab === "misconceptions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#64748B", margin: 0 }}>
                Observed cognitive traps. The Mentor automatically guides you past these without merely saying "wrong":
              </p>
              {learner.misconceptions.map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    backgroundColor: isDark ? "#101D33" : "#F8FAFC",
                    border: `1px solid ${isDark ? "#1E3A5F" : "#E2E8F0"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#F87171" : "#DC2626" }}>
                      {m.concept}
                    </span>
                    <span style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#64748B" }}>
                      Observed {m.frequency}x
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: isDark ? "#CBD5E1" : "#334155" }}>
                    {m.misconception}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        padding: "1px 6px",
                        borderRadius: 3,
                        background: m.corrected
                          ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                          : isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                        color: m.corrected ? "#10B981" : "#EF4444",
                        fontWeight: 600
                      }}
                    >
                      {m.corrected ? "Corrected in practice" : "Needs reinforcement"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: INTERVIEW READINESS */}
          {activeTab === "interview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#64748B", margin: 0 }}>
                Evidence-grounded readiness matrix across 6 performance pillars:
              </p>
              {learner.interviewReadinessSignals.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: isDark ? "#0E1829" : "#F8FAFC",
                    border: `1px solid ${isDark ? "#1E2D44" : "#E2E8F0"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: isDark ? "#F8FAFC" : "#0F172A",
                        textTransform: "capitalize"
                      }}
                    >
                      {item.area} Interview
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        backgroundColor:
                          item.status === "ready"
                            ? isDark ? "rgba(16, 185, 129, 0.18)" : "#D1FAE5"
                            : isDark ? "rgba(245, 158, 11, 0.18)" : "#FEF3C7",
                        color: item.status === "ready" ? "#10B981" : "#D97706"
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: isDark ? "#94A3B8" : "#64748B" }}>
                    {item.notes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: `1px solid ${isDark ? "#1E2D44" : "#E2E8F0"}`,
            background: isDark ? "#0B1526" : "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <span style={{ fontSize: 11, color: isDark ? "#64748B" : "#94A3B8" }}>
            Updated in real-time from practice turns
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              backgroundColor: isDark ? "#1E2D44" : "#E2E8F0",
              color: isDark ? "#F1F5F9" : "#1E293B",
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
