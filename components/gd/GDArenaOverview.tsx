"use client";

import React from "react";
import Link from "next/link";
import {
  Play,
  Users,
  Sparkles,
  Target,
  ShieldCheck,
  ArrowRight,
  Compass,
  Clock,
  CheckCircle2,
  Dna,
  BarChart3
} from "lucide-react";
import {
  GDThemeTokens,
  GDArenaTabId,
  GD_EXPERIENCE_MODES,
  GD_SKILLS_LAB_TRACKS
} from "./gd-theme";
import { GDTopicItem } from "@/lib/group-discussion-data";

export interface StudentDNASummaryView {
  authenticated: boolean;
  targetRole: string;
  topSkills: string[];
  skillGaps: string[];
  gdSessionsCompleted: number;
  lastGdScore: number | null;
}

interface GDArenaOverviewProps {
  T: GDThemeTokens;
  isDark: boolean;
  dnaSummary: StudentDNASummaryView;
  recommendedTopics: GDTopicItem[];
  onSwitchTab: (tab: GDArenaTabId) => void;
  onStartTopicPrep: (topic: GDTopicItem) => void;
  onLaunchLiveWithTopic: (topicTitle: string, format?: string) => void;
}

export default function GDArenaOverview({
  T,
  isDark,
  dnaSummary,
  recommendedTopics,
  onSwitchTab,
  onStartTopicPrep,
  onLaunchLiveWithTopic
}: GDArenaOverviewProps) {
  const spotlightTopics = recommendedTopics.slice(0, 3);
  const featuredDrills = GD_SKILLS_LAB_TRACKS.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── HERO + STUDENT DNA READINESS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16
        }}
      >
        {/* Main Arena Action Card */}
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 24,
            boxShadow: T.shadowCard,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 18
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 999,
                  backgroundColor: T.accentSoft,
                  color: T.accent,
                  border: `1px solid ${T.accentBorder}`
                }}
              >
                STUDENT ARENA WORKSPACE
              </span>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>
                AI Panel + Friends Multiplayer
              </span>
            </div>

            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: T.textPrimary,
                margin: "0 0 8px",
                letterSpacing: "-0.3px"
              }}
            >
              Train Real-Time Group Discussion Command
            </h2>
            <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.55, margin: 0 }}>
              Debate adaptive AI participant personas under an active Evaluator & Moderator, join private multiplayer
              Friends GD rooms, or isolate specific discussion instincts inside the 12-track GD Skills Lab.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              onClick={() => onSwitchTab("setup")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 16px",
                borderRadius: 8,
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentSecondary})`,
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <Play size={14} />
              <span>Configure & Start GD</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab("friends")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: T.bgSubtle,
                color: T.textPrimary,
                border: `1px solid ${T.borderStrong}`,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <Users size={14} style={{ color: T.accent }} />
              <span>Friends GD Room</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab("skills-lab")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: T.bgSubtle,
                color: T.textPrimary,
                border: `1px solid ${T.border}`,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <Target size={14} style={{ color: T.info }} />
              <span>Open Skills Lab</span>
            </button>
          </div>
        </div>

        {/* Student DNA Communication Bridge Card */}
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 24,
            boxShadow: T.shadowCard,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 16
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: T.accentSoft,
                    color: T.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Dna size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>
                    Student DNA Calibration
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>
                    {dnaSummary.authenticated ? "Connected to your Student DNA profile" : "Role calibration active"}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  backgroundColor: dnaSummary.authenticated ? T.successSoft : T.infoSoft,
                  color: dnaSummary.authenticated ? T.success : T.info
                }}
              >
                {dnaSummary.authenticated ? "DNA Synced" : "Sign-In Recommended"}
              </span>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                backgroundColor: T.bgSubtle,
                border: `1px solid ${T.border}`,
                marginBottom: 12
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                Target Role Lens
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                {dnaSummary.targetRole}
              </div>
              {dnaSummary.topSkills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {dnaSummary.topSkills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        backgroundColor: T.bgCard,
                        border: `1px solid ${T.border}`,
                        color: T.textSecondary
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                backgroundColor: T.bgSubtle,
                border: `1px solid ${T.border}`
              }}
            >
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Verified GD Rounds</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, marginTop: 2 }}>
                {dnaSummary.gdSessionsCompleted}
              </div>
            </div>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                backgroundColor: T.bgSubtle,
                border: `1px solid ${T.border}`
              }}
            >
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Latest Score</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, marginTop: 2 }}>
                {dnaSummary.lastGdScore !== null ? `${dnaSummary.lastGdScore}/100` : "No session yet"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPERIENCE MODES ── */}
      <div
        style={{
          backgroundColor: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 20,
          boxShadow: T.shadowCard
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
              Simulation Formats & Panel Dynamics
            </h3>
            <p style={{ fontSize: 12, color: T.textMuted, margin: "3px 0 0" }}>
              Choose how fiercely AI peers challenge premises, balance turns, and steer synthesis.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSwitchTab("setup")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 6,
              backgroundColor: T.accentSoft,
              color: T.accent,
              border: `1px solid ${T.accentBorder}`,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <span>Customize Room</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12
          }}
        >
          {GD_EXPERIENCE_MODES.map((mode) => (
            <div
              key={mode.id}
              style={{
                padding: 14,
                borderRadius: 10,
                backgroundColor: T.bgSubtle,
                border: `1px solid ${T.border}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 8
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{mode.label}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, marginTop: 2 }}>{mode.tagline}</div>
                <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.45, margin: "8px 0 0" }}>
                  {mode.panelDynamics}
                </p>
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                <strong>Best for:</strong> {mode.bestFor}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SPOTLIGHT TOPICS + QUICK SKILLS LAB ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16
        }}
      >
        {/* Role-Aligned Topics */}
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 20,
            boxShadow: T.shadowCard
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Compass size={16} style={{ color: T.accent }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
                Role-Focused Discussion Prompts
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSwitchTab("topics")}
              style={{
                background: "transparent",
                border: "none",
                color: T.accent,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Browse All →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {spotlightTopics.map((topic) => (
              <div
                key={topic.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${T.border}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>{topic.category}</span>
                  <span style={{ fontSize: 11, color: T.textMuted, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} />
                    {topic.timeLimitMinutes}m · {topic.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, lineHeight: 1.4, marginBottom: 8 }}>
                  {topic.title}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => onStartTopicPrep(topic)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      backgroundColor: T.bgCard,
                      border: `1px solid ${T.borderStrong}`,
                      color: T.textPrimary,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Draft Arguments
                  </button>
                  <button
                    type="button"
                    onClick={() => onLaunchLiveWithTopic(topic.title)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      backgroundColor: T.accentSoft,
                      border: `1px solid ${T.accentBorder}`,
                      color: T.accent,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Start Live GD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Lab & Conduct Shortcut */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              backgroundColor: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 20,
              boxShadow: T.shadowCard
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} style={{ color: T.accentSecondary }} />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
                  GD Skills Lab Starter Drills
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSwitchTab("skills-lab")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.accent,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                All 12 Tracks →
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {featuredDrills.map((drill) => (
                <div
                  key={drill.id}
                  onClick={() => onSwitchTab("skills-lab")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    backgroundColor: T.bgSubtle,
                    border: `1px solid ${T.border}`,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{drill.title}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>
                      {drill.category} · {drill.difficulty} · {drill.durationMinutes} mins
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: T.textMuted, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              backgroundColor: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 18,
              boxShadow: T.shadowCard,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck size={18} style={{ color: T.success }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>
                  Constructive Disagreement Protected
                </div>
                <div style={{ fontSize: 11, color: T.textMuted }}>
                  Polite debate & technical pushback are encouraged. Review conduct rules anytime.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => onSwitchTab("performance")}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${T.border}`,
                  color: T.textSecondary,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <BarChart3 size={12} />
                <span>Performance</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchTab("guidelines")}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${T.border}`,
                  color: T.textSecondary,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <CheckCircle2 size={12} />
                <span>Guidelines</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note strictly scoped to student workflow */}
      {isDark !== undefined && (
        <div style={{ fontSize: 11, color: T.textMuted, textAlign: "right" }}>
          <Link href="/student/gd-practice" style={{ color: T.accent, textDecoration: "none", fontWeight: 600 }}>
            Direct Link: Live Simulation Room →
          </Link>
        </div>
      )}
    </div>
  );
}
