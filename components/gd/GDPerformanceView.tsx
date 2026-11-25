"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Award,
  Clock,
  Dna,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Flame,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Circle,
  X,
  FileText,
  Sparkles,
  BookOpen
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";
import { GDThemeTokens, GDArenaTabId } from "./gd-theme";
import type { GDPerformanceAnalytics } from "@/lib/gd/performance-analytics";
import type { GDComprehensiveReport, GDEvaluationDimension } from "@/lib/gd/types";

export interface GDPerformanceSummaryItem {
  sessionId: string;
  topicTitle: string;
  format: string;
  difficulty: string;
  overallScore: number;
  hiringVerdict?: string;
  speakingTurnCount?: number;
  dnaSynced?: boolean;
  createdAt: string;
  dimensions?: GDEvaluationDimension[];
  fullReport?: GDComprehensiveReport | null;
}

export interface GDConductStandingView {
  suspended: boolean;
  expiresAt?: string | null;
  reason?: string | null;
  appealToken?: string | null;
  warningHistoryCount: number;
}

export interface GDDisciplinaryRecordView {
  id: string;
  sessionId: string;
  warningNumber: number;
  severity: string;
  violationCategory: string;
  appealStatus: string;
  createdAt: string;
}

interface GDPerformanceViewProps {
  T: GDThemeTokens;
  sessions: GDPerformanceSummaryItem[];
  analytics?: GDPerformanceAnalytics | null;
  conductStanding?: GDConductStandingView | null;
  disciplinaryRecords?: GDDisciplinaryRecordView[];
  loading: boolean;
  authenticated: boolean;
  onSwitchTab: (tab: GDArenaTabId) => void;
}

const FALLBACK_EIGHT_DIMENSIONS = [
  "Clarity & Articulation",
  "Content & Domain Relevance",
  "Logical Structuring",
  "Active Listening & Engagement",
  "Critical Thinking",
  "Collaboration & Consensus",
  "Leadership & Floor Initiative",
  "Professional Conduct"
];

export default function GDPerformanceView({
  T,
  sessions,
  analytics,
  conductStanding,
  disciplinaryRecords = [],
  loading,
  authenticated,
  onSwitchTab
}: GDPerformanceViewProps) {
  const [selectedSession, setSelectedSession] = useState<GDPerformanceSummaryItem | null>(null);

  const completedCount = analytics?.completedSessionsCount ?? sessions.length;
  const averageScore =
    analytics?.compositeAverage !== undefined
      ? analytics.compositeAverage
      : completedCount > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completedCount)
      : null;
  const bestScore =
    analytics?.peakScore !== undefined
      ? analytics.peakScore
      : completedCount > 0
      ? Math.max(...sessions.map((s) => s.overallScore || 0))
      : null;

  const scoreDelta = analytics?.scoreDelta ?? null;
  const scoreTrend = analytics?.scoreTrend ?? [];
  const dimensionAverages = analytics?.dimensionAverages ?? [];
  const weakestDimensions = analytics?.weakestDimensions ?? [];
  const skillsSummary = analytics?.skillsLabSummary ?? {
    totalTracks: 12,
    attemptedTracks: 0,
    masteredTracks: 0,
    averageDrillScore: null
  };
  const streakDays = analytics?.practiceStreakDays ?? 0;
  const activeDaysTotal = analytics?.activeDaysTotal ?? 0;
  const milestones = analytics?.milestones ?? [];

  const assessedDimensionsChartData = dimensionAverages
    .filter((d) => d.averageScore !== null)
    .map((d) => ({
      name: d.shortLabel,
      fullName: d.label,
      score: d.averageScore as number,
      assessedCount: d.assessedCount
    }));

  const standingSuspended = Boolean(conductStanding?.suspended);
  const warningCount = conductStanding?.warningHistoryCount ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Top KPI Cards — Zero Fabricated Numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        {/* 1. Completed Sessions */}
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: 16,
            boxShadow: T.shadowCard
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase" }}>
            Completed GD Sessions
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, marginTop: 4 }}>
            {loading ? "—" : completedCount}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
            {bestScore !== null ? `Peak score: ${bestScore}/100` : "Verified evaluated rounds"}
          </div>
        </div>

        {/* 2. Composite Average + Delta */}
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: 16,
            boxShadow: T.shadowCard
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase" }}>
            Composite Average
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary }}>
              {averageScore !== null ? `${averageScore}/100` : "No score yet"}
            </span>
            {scoreDelta !== null && scoreDelta !== 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: scoreDelta > 0 ? T.success : T.warning,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2
                }}
              >
                {scoreDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
            Across evaluated 8-dimension rubrics
          </div>
        </div>

        {/* 3. Skills Lab Mastery */}
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: 16,
            boxShadow: T.shadowCard
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase" }}>
            Skills Lab Mastery
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, marginTop: 4 }}>
            {loading ? "—" : `${skillsSummary.masteredTracks}/${skillsSummary.totalTracks}`}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
            {skillsSummary.attemptedTracks > 0 && skillsSummary.averageDrillScore !== null
              ? `${skillsSummary.attemptedTracks} practiced · Avg best ${skillsSummary.averageDrillScore}/100`
              : "Micro-drills mastered (75+ score)"}
          </div>
        </div>

        {/* 4. Practice Streak & Conduct */}
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: 16,
            boxShadow: T.shadowCard
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase" }}>
            Streak &amp; Conduct
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Flame size={17} style={{ color: streakDays > 0 ? T.warning : T.textMuted }} />
              {streakDays}d
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
                backgroundColor: standingSuspended ? T.dangerSoft : warningCount > 0 ? T.warningSoft : T.successSoft,
                color: standingSuspended ? T.danger : warningCount > 0 ? T.warning : T.success,
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              {standingSuspended ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
              {standingSuspended ? "Suspended" : warningCount > 0 ? `${warningCount} Warning(s)` : "Good Standing"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
            {activeDaysTotal > 0 ? `${activeDaysTotal} total active practice day(s)` : "Synced with moderation logs"}
          </div>
        </div>
      </div>

      {/* Main Analytics Charts & Empty State */}
      {completedCount === 0 ? (
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 32,
            boxShadow: T.shadowCard,
            textAlign: "center"
          }}
        >
          <BarChart3 size={28} style={{ color: T.accent, marginBottom: 10 }} />
          <h3 style={{ fontSize: 17, fontWeight: 800, color: T.textPrimary, margin: "0 0 8px" }}>
            {authenticated
              ? "No Evaluated GD Sessions Recorded Yet"
              : "Sign In & Complete a GD Session to Unlock Trends"}
          </h3>
          <p style={{ fontSize: 13, color: T.textSecondary, maxWidth: 560, margin: "0 auto 18px", lineHeight: 1.55 }}>
            Cognalyze never displays synthetic placeholder scores or fake trend charts. Complete a full live
            simulation and click <strong>End &amp; View Report</strong> to record evidence-grounded dimension scores
            and feed verified communication signals into your Student DNA.
          </p>

          <button
            type="button"
            onClick={() => onSwitchTab("setup")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 8,
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentSecondary})`,
              color: "#FFFFFF",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <span>Start Your First Verified GD</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <>
          {/* Real Recharts Analytics Visualizations */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            {/* Score Trend Chart */}
            <div
              style={{
                backgroundColor: T.bgCard,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 18,
                boxShadow: T.shadowCard
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
                    Score Progression Across Rounds
                  </h3>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: "3px 0 0" }}>
                    Verified session scores over chronological practice
                  </p>
                </div>
                <TrendingUp size={16} style={{ color: T.accent }} />
              </div>

              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreTrend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gdScoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.accent} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={T.accent} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: T.textMuted, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: T.bgCard,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        fontSize: 12,
                        color: T.textPrimary
                      }}
                      formatter={(val: any) => [`${val}/100`, "Composite Score"]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${label}: ${item.topicTitle}` : label;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="overallScore"
                      stroke={T.accent}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gdScoreFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 8-Dimension Competency Averages */}
            <div
              style={{
                backgroundColor: T.bgCard,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 18,
                boxShadow: T.shadowCard
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
                    Assessed Dimension Breakdown
                  </h3>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: "3px 0 0" }}>
                    Average score per evaluated competency (excludes unassessed dims)
                  </p>
                </div>
                <BarChart3 size={16} style={{ color: T.accent }} />
              </div>

              {assessedDimensionsChartData.length === 0 ? (
                <div
                  style={{
                    height: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: 16,
                    fontSize: 12,
                    color: T.textMuted
                  }}
                >
                  Speak in your next round so the AI evaluator can score individual communication dimensions.
                </div>
              ) : (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={assessedDimensionsChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: T.textMuted, fontSize: 11 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={82}
                        tick={{ fill: T.textSecondary, fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: T.bgCard,
                          border: `1px solid ${T.border}`,
                          borderRadius: 8,
                          fontSize: 12,
                          color: T.textPrimary
                        }}
                        formatter={(val: any, _name, item: any) => [
                          `${val}/100 (${item?.payload?.assessedCount || 1} round${
                            (item?.payload?.assessedCount || 1) > 1 ? "s" : ""
                          })`,
                          item?.payload?.fullName || "Score"
                        ]}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {assessedDimensionsChartData.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={
                              entry.score >= 78
                                ? T.success
                                : entry.score >= 60
                                ? T.accent
                                : T.warning
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Targeted Skills Lab Focus Recommendations (if weak assessed dimensions exist) */}
          {weakestDimensions.length > 0 && (
            <div
              style={{
                backgroundColor: T.bgCard,
                border: `1px solid ${T.accentBorder}`,
                borderRadius: 12,
                padding: 18,
                boxShadow: T.shadowCard
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={16} style={{ color: T.accent }} />
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
                    Targeted Improvement Plan → Skills Lab
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onSwitchTab("skills-lab")}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.accent,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <span>Open Skills Lab</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
                {weakestDimensions.map((dim) => (
                  <div
                    key={dim.dimension}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: T.bgSubtle,
                      border: `1px solid ${T.border}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{dim.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: T.warning }}>
                        {dim.averageScore}/100
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
                      Recommended drill: <strong style={{ color: T.textSecondary }}>{dim.recommendedSkillTitle}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Session History (Clickable Report Inspection) */}
          <div
            style={{
              backgroundColor: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 20,
              boxShadow: T.shadowCard
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
                Verified Session History
              </h3>
              <span style={{ fontSize: 11, color: T.textMuted }}>
                Click any session to inspect rubric scores &amp; AI rewrites
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sessions.map((s) => (
                <button
                  type="button"
                  key={s.sessionId}
                  onClick={() => setSelectedSession(s)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 8,
                    backgroundColor: T.bgSubtle,
                    border: `1px solid ${T.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    cursor: "pointer"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{s.topicTitle}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      <span>{s.format}</span>
                      <span>·</span>
                      <span>{s.difficulty}</span>
                      <span>·</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Clock size={11} />
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                      {s.dnaSynced && (
                        <>
                          <span>·</span>
                          <span style={{ color: T.accent, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Dna size={11} /> DNA Synced
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {s.hiringVerdict && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          backgroundColor: T.accentSoft,
                          color: T.accent
                        }}
                      >
                        {s.hiringVerdict}
                      </span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary }}>
                      {s.overallScore}/100
                    </span>
                    <FileText size={14} style={{ color: T.textMuted }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Milestones & Conduct Record */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 14 }}>
        {/* Milestones */}
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 18,
            boxShadow: T.shadowCard
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Award size={16} style={{ color: T.accent }} />
            <h3 style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
              Student Readiness Milestones
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {milestones.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${m.earned ? T.success : T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  {m.earned ? (
                    <CheckCircle2 size={15} style={{ color: T.success, marginTop: 2, flexShrink: 0 }} />
                  ) : (
                    <Circle size={15} style={{ color: T.textMuted, marginTop: 2, flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{m.description}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: m.earned ? T.success : T.textMuted,
                    whiteSpace: "nowrap"
                  }}
                >
                  {m.progressLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 8-Dimension Rubric & Conduct History */}
        <div
          style={{
            backgroundColor: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 18,
            boxShadow: T.shadowCard
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={16} style={{ color: T.accent }} />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
                8-Dimension Framework &amp; Conduct
              </h3>
            </div>
            <span style={{ fontSize: 11, color: T.textMuted, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Dna size={12} style={{ color: T.accent }} />
              Student DNA Map
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 14 }}>
            {(dimensionAverages.length > 0
              ? dimensionAverages
              : FALLBACK_EIGHT_DIMENSIONS.map((label) => ({
                  dimension: label,
                  label,
                  averageScore: null as number | null
                }))
            ).map((dim) => (
              <div
                key={dim.dimension}
                style={{
                  padding: "9px 11px",
                  borderRadius: 8,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${T.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: T.textPrimary }}>{dim.label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: dim.averageScore !== null ? T.accent : T.textMuted }}>
                  {dim.averageScore !== null ? `${dim.averageScore}` : "—"}
                </span>
              </div>
            ))}
          </div>

          {disciplinaryRecords.length > 0 && (
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 6 }}>
                Moderation Incidents ({disciplinaryRecords.length})
              </div>
              {disciplinaryRecords.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    fontSize: 11,
                    color: T.textSecondary,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0"
                  }}
                >
                  <span>
                    {rec.severity} · {rec.violationCategory}
                  </span>
                  <span style={{ color: T.textMuted }}>{rec.appealStatus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session Report Inspection Modal */}
      {selectedSession && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            backgroundColor: "rgba(15, 23, 42, 0.58)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
          onClick={() => setSelectedSession(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 740,
              maxHeight: "86vh",
              overflowY: "auto",
              backgroundColor: T.bgCard,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 14,
              padding: 22,
              boxShadow: T.shadowCard
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase" }}>
                  Verified Evaluation Report
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: T.textPrimary, margin: "4px 0 4px" }}>
                  {selectedSession.topicTitle}
                </h3>
                <div style={{ fontSize: 12, color: T.textMuted }}>
                  {selectedSession.format} · {selectedSession.difficulty} ·{" "}
                  {new Date(selectedSession.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close report modal"
                onClick={() => setSelectedSession(null)}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  backgroundColor: T.bgSubtle,
                  color: T.textPrimary,
                  cursor: "pointer"
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 10,
                backgroundColor: T.bgSubtle,
                border: `1px solid ${T.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>COMPOSITE SCORE</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: T.textPrimary }}>
                  {selectedSession.overallScore}/100
                </div>
              </div>
              {selectedSession.hiringVerdict && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "6px 12px",
                    borderRadius: 8,
                    backgroundColor: T.accentSoft,
                    color: T.accent
                  }}
                >
                  Verdict: {selectedSession.hiringVerdict}
                </span>
              )}
            </div>

            {selectedSession.fullReport?.verdictSummary && (
              <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.55, marginTop: 14 }}>
                {selectedSession.fullReport.verdictSummary}
              </p>
            )}

            {Array.isArray(selectedSession.dimensions || selectedSession.fullReport?.dimensions) && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.textPrimary, marginBottom: 8 }}>
                  Dimension Scores
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                  {(selectedSession.dimensions || selectedSession.fullReport?.dimensions || []).map((d) => (
                    <div
                      key={d.dimension}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: T.bgSubtle,
                        border: `1px solid ${T.border}`
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: T.textPrimary }}>
                        <span>{d.label}</span>
                        <span>{d.verdict === "insufficient_evidence" ? "N/A" : `${d.score}/100`}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{d.feedback}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSession.fullReport?.weakestContributions &&
              selectedSession.fullReport.weakestContributions.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.textPrimary, marginBottom: 8 }}>
                    AI Coach Rewrites
                  </div>
                  {selectedSession.fullReport.weakestContributions.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: T.bgSubtle,
                        border: `1px solid ${T.border}`,
                        marginBottom: 8
                      }}
                    >
                      <div style={{ fontSize: 11, color: T.textMuted }}>Your statement: “{item.quote}”</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginTop: 6 }}>
                        Executive rewrite: “{item.recruiterRewrite}”
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {selectedSession.fullReport?.targetedImprovementPlan &&
              selectedSession.fullReport.targetedImprovementPlan.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.textPrimary, marginBottom: 6 }}>
                    Action Plan
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                    {selectedSession.fullReport.targetedImprovementPlan.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
