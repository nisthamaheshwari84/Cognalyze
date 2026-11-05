"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";
import {
  InterviewQuestion,
  InterviewSession,
  InterviewEvaluationReport
} from "@/lib/skills/ai-data/interview-engine";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";

const PROVENANCE_LABELS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  verified_historical: { label: "Verified Historical Question", bg: "#EFF6FF", color: "#1D4ED8", border: "#3B82F6" },
  reported_historical: { label: "Reported Historical Question", bg: "#F5F3FF", color: "#6D28D9", border: "#8B5CF6" },
  role_pattern: { label: "Standard Industry Pattern", bg: "#ECFDF5", color: "#047857", border: "#10B981" },
  cognalyze_original: { label: "Cognalyze Original Simulation", bg: "#FFFBEB", color: "#B45309", border: "#F59E0B" }
};

const roleProfilesList = Object.values(TARGET_ROLE_PROFILES);

function InterviewStudioContent() {
  const { isDark } = useTheme();

  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [selectedRole, setSelectedRole] = useState<TargetRoleSlug>("ai_engineer");

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, { answerText: string; submittedAt: string; followUpAnswer?: string }>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(45 * 60);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [report, setReport] = useState<InterviewEvaluationReport | null>(null);

  useEffect(() => {
    async function initUser() {
      try {
        const sessRes = await fetch("/api/auth/session");
        const sess = await sessRes.json();
        if (sess.authenticated && sess.user?.id) {
          setCandidateId(sess.user.id);
        }
      } catch {
        // Fallback default
      }
    }
    initUser();
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeftSeconds]);

  const activeQuestion: InterviewQuestion | undefined = useMemo(() => {
    if (!session || !session.questions || session.questions.length === 0) return undefined;
    return session.questions[activeQuestionIdx];
  }, [session, activeQuestionIdx]);

  const handleStartInterview = async () => {
    setReport(null);
    setAnswers({});
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_interview",
          candidateId,
          role: selectedRole
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setActiveQuestionIdx(0);
        setTimeLeftSeconds(data.session.questions.length * 8 * 60); // 8 mins per question
        setTimerActive(true);
      } else {
        alert(data.error || "Failed to start interview");
      }
    } catch (err: any) {
      alert("Error starting interview: " + err.message);
    }
  };

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || {}),
        answerText: val,
        submittedAt: new Date().toISOString()
      }
    }));
  };

  const handleFollowUpChange = (qId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { answerText: "", submittedAt: new Date().toISOString() }),
        followUpAnswer: val
      }
    }));
  };

  const handleSubmitInterview = async () => {
    if (!session) return;
    setSubmitting(true);
    setTimerActive(false);
    try {
      const sessionPayload: InterviewSession = {
        ...session,
        answers,
        status: "COMPLETED"
      };

      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_interview",
          session: sessionPayload
        })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        alert(data.error || "Failed to evaluate interview");
      }
    } catch (err: any) {
      alert("Interview submission error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#0A0F1D" : "#F7F9FC",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <AppNav role="student" />

      {/* ── TOP HEADER / BREADCRUMB ── */}
      <header
        style={{
          borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
          backgroundColor: isDark ? "#0E1726" : "#FFFFFF",
          padding: "12px 24px",
          position: "sticky",
          top: 56,
          zIndex: 30
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Link href="/student/skills/ai-data" style={{ color: "#667085", textDecoration: "none", fontSize: 11.5, fontWeight: 600 }}>
                ← AI, Data & Intelligence Arena
              </Link>
              <span style={{ color: "#98A2B3" }}>/</span>
              <span style={{ color: "#356AE6", fontSize: 11.5, fontWeight: 700 }}>Technical Interview Simulation</span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: isDark ? "#FFFFFF" : "#162A43", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🎯</span> Technical Interview Simulation &amp; Dossier Assessment
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {session && timerActive && (
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  padding: "6px 14px",
                  borderRadius: 6,
                  backgroundColor: timeLeftSeconds < 300 ? "#FEF2F2" : (isDark ? "#16253C" : "#EFF4FE"),
                  color: timeLeftSeconds < 300 ? "#EF4444" : "#356AE6",
                  border: `1px solid ${timeLeftSeconds < 300 ? "#EF4444" : "#356AE6"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>⏱</span>
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>
            )}

            {!session && (
              <button
                onClick={handleStartInterview}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "8px 18px",
                  borderRadius: 6,
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                ▶ Start Interview Session
              </button>
            )}

            {session && !report && (
              <button
                onClick={handleSubmitInterview}
                disabled={submitting}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "8px 18px",
                  borderRadius: 6,
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer"
                }}
              >
                {submitting ? "Evaluating Dossier..." : "✓ Submit Interview Evaluation"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN STUDIO CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px" }}>
        
        {/* ── CONFIGURATION PANEL (BEFORE INTERVIEW STARTS) ── */}
        {!session && (
          <div
            style={{
              maxWidth: 720,
              margin: "30px auto",
              backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              borderRadius: 10,
              padding: 24,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px 0", color: isDark ? "#FFFFFF" : "#162A43" }}>
              Configure Technical Interview Assessment
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 20px 0" }}>
              Simulates a multi-stage technical interview with authentic questions, adaptive follow-ups, and a 100-point rubric dossier report.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>
                  Target Role Profile
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {roleProfilesList.map((rp) => (
                    <button
                      key={rp.slug}
                      onClick={() => setSelectedRole(rp.slug)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 6,
                        border: `2px solid ${selectedRole === rp.slug ? "#356AE6" : (isDark ? "#22334A" : "#E2E8F0")}`,
                        backgroundColor: selectedRole === rp.slug ? (isDark ? "#16253C" : "#EFF4FE") : (isDark ? "#0E1726" : "#FFFFFF"),
                        textAlign: "left",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: selectedRole === rp.slug ? "#356AE6" : (isDark ? "#FFFFFF" : "#1E293B") }}>
                        {rp.title}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>
                        {rp.salaryTier}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartInterview}
                style={{
                  marginTop: 10,
                  padding: "12px 20px",
                  borderRadius: 6,
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Begin Timed Technical Assessment ➔
              </button>
            </div>
          </div>
        )}

        {/* ── ACTIVE INTERVIEW EXAMINATION VIEW ── */}
        {session && !report && activeQuestion && (
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18 }}>
            
            {/* Left Question Navigation Bar */}
            <div
              style={{
                backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                borderRadius: 8,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                height: "fit-content"
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B", marginBottom: 4 }}>
                Assessment Questions ({session.questions.length})
              </div>

              {session.questions.map((q, idx) => {
                const hasAnswer = (answers[q.id]?.answerText || "").trim().length > 20;
                const isCurrent = idx === activeQuestionIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIdx(idx)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: `1px solid ${isCurrent ? "#356AE6" : (isDark ? "#22334A" : "#E2E8F0")}`,
                      backgroundColor: isCurrent ? (isDark ? "#16253C" : "#EFF4FE") : "transparent",
                      color: isCurrent ? "#356AE6" : (isDark ? "#FFFFFF" : "#1E293B"),
                      textAlign: "left",
                      fontSize: 11.5,
                      fontWeight: 600,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    <span>Question {idx + 1}</span>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: hasAnswer ? "#10B981" : "#CBD5E1"
                      }}
                    />
                  </button>
                );
              })}

              <hr style={{ borderColor: isDark ? "#1E2A3B" : "#F1F5F9", margin: "8px 0" }} />

              <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>
                Answer each question thoroughly with technical architecture, formulas, and trade-offs where applicable.
              </div>
            </div>

            {/* Right Question & Answer Workspace */}
            <div
              style={{
                backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                borderRadius: 8,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}
            >
              {/* Question Meta Header */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 4,
                      backgroundColor: "#356AE6",
                      color: "#FFFFFF"
                    }}
                  >
                    QUESTION {activeQuestionIdx + 1} OF {session.questions.length}
                  </span>

                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 4,
                      backgroundColor: isDark ? "#233857" : "#E2E8F0",
                      color: isDark ? "#CBD5E1" : "#475569"
                    }}
                  >
                    {activeQuestion.category.toUpperCase()}
                  </span>

                  {/* Provenance Badge */}
                  {PROVENANCE_LABELS[activeQuestion.provenance.type] && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: `1px solid ${PROVENANCE_LABELS[activeQuestion.provenance.type].border}`,
                        backgroundColor: PROVENANCE_LABELS[activeQuestion.provenance.type].bg,
                        color: PROVENANCE_LABELS[activeQuestion.provenance.type].color
                      }}
                      title={activeQuestion.provenance.sourceName}
                    >
                      🛡️ {PROVENANCE_LABELS[activeQuestion.provenance.type].label}: {activeQuestion.provenance.sourceName}
                    </span>
                  )}
                </div>

                {/* Scenario Context */}
                {activeQuestion.scenario && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                      fontSize: 12,
                      color: isDark ? "#CBD5E1" : "#475569",
                      marginBottom: 10,
                      borderLeft: "3px solid #356AE6"
                    }}
                  >
                    <strong>Scenario Context:</strong> {activeQuestion.scenario}
                  </div>
                )}

                {/* Prompt */}
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px 0", color: isDark ? "#FFFFFF" : "#162A43", lineHeight: 1.4 }}>
                  {activeQuestion.prompt}
                </h2>

                {/* Follow Up Probe Question */}
                {activeQuestion.followUpPrompt && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#1A261E" : "#F0FDF4",
                      border: "1px solid #86EFAC",
                      fontSize: 11.5,
                      color: isDark ? "#86EFAC" : "#166534"
                    }}
                  >
                    <strong>Adaptive Follow-up Probe:</strong> {activeQuestion.followUpPrompt}
                  </div>
                )}
              </div>

              {/* Answer Input Area */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B" }}>
                    Your Technical Answer &amp; Architectural Defense:
                  </label>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>
                    {(answers[activeQuestion.id]?.answerText || "").length} characters
                  </span>
                </div>

                <textarea
                  value={answers[activeQuestion.id]?.answerText || ""}
                  onChange={(e) => handleAnswerChange(activeQuestion.id, e.target.value)}
                  rows={8}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontFamily: "monospace",
                    backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                    border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                    color: isDark ? "#FFFFFF" : "#1E293B",
                    resize: "vertical",
                    lineHeight: 1.5
                  }}
                  placeholder="Structure your answer clearly: 1. Core architectural approach, 2. Formula / algorithm, 3. Edge cases and trade-offs..."
                />

                {/* Optional Follow-up Answer */}
                {activeQuestion.followUpPrompt && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4 }}>
                      Response to Follow-up Probe:
                    </label>
                    <textarea
                      value={answers[activeQuestion.id]?.followUpAnswer || ""}
                      onChange={(e) => handleFollowUpChange(activeQuestion.id, e.target.value)}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontFamily: "monospace",
                        backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                        border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                        color: isDark ? "#FFFFFF" : "#1E293B",
                        resize: "vertical"
                      }}
                      placeholder="Address the follow-up edge case or trade-off..."
                    />
                  </div>
                )}
              </div>

              {/* Bottom Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <button
                  onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                  disabled={activeQuestionIdx === 0}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 14px",
                    borderRadius: 4,
                    backgroundColor: isDark ? "#16253C" : "#F1F5F9",
                    color: isDark ? "#FFFFFF" : "#1E293B",
                    border: "none",
                    cursor: activeQuestionIdx === 0 ? "not-allowed" : "pointer"
                  }}
                >
                  ← Previous Question
                </button>

                {activeQuestionIdx < session.questions.length - 1 ? (
                  <button
                    onClick={() => setActiveQuestionIdx((prev) => prev + 1)}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "6px 16px",
                      borderRadius: 4,
                      backgroundColor: "#356AE6",
                      color: "#FFFFFF",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitInterview}
                    disabled={submitting}
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "7px 18px",
                      borderRadius: 4,
                      backgroundColor: "#10B981",
                      color: "#FFFFFF",
                      border: "none",
                      cursor: submitting ? "not-allowed" : "pointer"
                    }}
                  >
                    {submitting ? "Evaluating..." : "Finish & Submit Evaluation"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 100-POINT DOSSIER EVALUATION REPORT VIEW ── */}
        {report && (
          <div
            style={{
              maxWidth: 960,
              margin: "20px auto",
              backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              borderRadius: 10,
              padding: 24,
              boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
            }}
          >
            {/* Header Result Card */}
            <div
              style={{
                padding: 16,
                borderRadius: 8,
                backgroundColor: report.totalScore >= 70 ? (isDark ? "#162E20" : "#ECFDF5") : (isDark ? "#3B1818" : "#FEF2F2"),
                border: `1px solid ${report.totalScore >= 70 ? "#10B981" : "#EF4444"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: report.totalScore >= 70 ? "#10B981" : "#EF4444" }}>
                  {report.verdict.replace(/_/g, " ")}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  Role Evaluation: <strong style={{ color: isDark ? "#FFFFFF" : "#1E293B" }}>{report.role}</strong> • Session: {report.sessionId}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: report.totalScore >= 70 ? "#10B981" : "#EF4444" }}>
                  {report.totalScore} / 100
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
                  Composite Dossier Score
                </div>
              </div>
            </div>

            {/* Rubric Breakdown */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B", marginBottom: 10 }}>
                Dossier Dimension Rubric Breakdown
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {Object.entries(report.rubricBreakdown).map(([dim, val]) => (
                  <div
                    key={dim}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                      border: `1px solid ${isDark ? "#2A3F5F" : "#E2E8F0"}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      <span style={{ textTransform: "capitalize", color: isDark ? "#FFFFFF" : "#1E293B" }}>
                        {dim.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span style={{ color: "#356AE6" }}>{val} / 25 pts</span>
                    </div>
                    <div style={{ width: "100%", height: 6, backgroundColor: isDark ? "#233857" : "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${(val / 25) * 100}%`, height: "100%", backgroundColor: val >= 18 ? "#10B981" : "#F59E0B", borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Question Detailed Feedback */}
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B", marginBottom: 10 }}>
              Per-Question Performance &amp; Evaluation Notes
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {report.questionDossiers.map((qf, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    borderRadius: 6,
                    backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                    border: `1px solid ${isDark ? "#2A3F5F" : "#E2E8F0"}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                      Question {i + 1}: {qf.prompt.slice(0, 80)}...
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 4,
                        backgroundColor: qf.score >= 70 ? "#ECFDF5" : "#FEF2F2",
                        color: qf.score >= 70 ? "#047857" : "#B91C1C"
                      }}
                    >
                      {qf.score} / 100 pts
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>
                    Provenance: <strong>{qf.provenance}</strong>
                  </div>

                  <div style={{ fontSize: 11.5, color: isDark ? "#CBD5E1" : "#475569" }}>
                    <strong>Feedback:</strong> {qf.feedback}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                onClick={() => {
                  setSession(null);
                  setReport(null);
                }}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "10px 24px",
                  borderRadius: 6,
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Take Another Interview Simulation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewStudioPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading Interview Studio...</div>}>
      <InterviewStudioContent />
    </Suspense>
  );
}
