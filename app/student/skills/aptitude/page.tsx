"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AptitudeQuestion } from "@/lib/skill-hub-store";

export default function AptitudeSimulatorPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [mode, setMode] = useState<"practice" | "timed_exam">("practice");
  const [currentIdx, setCurrentIdx] = useState(0);

  // Status map: "answered" | "marked_review" | "visited" | "unvisited"
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});
  const [revealedExplanations, setRevealedExplanations] = useState<Record<string, boolean>>({});

  // Timed exam state
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    loadQuestions(selectedCompany, activeCategory);
  }, [selectedCompany, activeCategory]);

  // Mark first question as visited
  useEffect(() => {
    if (questions[currentIdx]) {
      setVisitedQuestions(prev => ({ ...prev, [questions[currentIdx].id]: true }));
    }
  }, [currentIdx, questions]);

  useEffect(() => {
    let timer: any = null;
    if (examStarted && !examSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, examSubmitted, timeLeft]);

  const loadQuestions = async (company: string, category: string) => {
    setLoading(true);
    try {
      let url = `/api/skills/aptitude?company=${company}`;
      if (category && category !== "all") {
        url += `&category=${category}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIdx(0);
      } else {
        // Fallback to all company questions so user is never blocked
        const fallbackRes = await fetch(`/api/skills/aptitude?company=${company}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.questions && fallbackData.questions.length > 0) {
          setQuestions(fallbackData.questions);
          setCurrentIdx(0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (examSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
    if (mode === "practice") {
      setRevealedExplanations(prev => ({ ...prev, [qId]: true }));
    }
  };

  const toggleMarkReview = (qId: string) => {
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const clearCurrentResponse = (qId: string) => {
    setUserAnswers(prev => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleGenerateFreshQuestions = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/skills/aptitude/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyTag: selectedCompany === "all" ? "TCS NQT" : selectedCompany,
          category: activeCategory === "all" ? "quantitative" : activeCategory,
          count: 5
        })
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(prev => [...data.questions, ...prev]);
        setCurrentIdx(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const submitExam = async () => {
    setExamSubmitted(true);
    try {
      const res = await fetch("/api/skills/aptitude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          answers: userAnswers,
          companyTag: selectedCompany === "all" ? "TCS NQT" : selectedCompany,
          timeSpentSeconds: 900 - timeLeft
        })
      });
      const data = await res.json();
      if (data.result) {
        setExamResult(data.result);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentQ = questions[currentIdx];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  // Status helpers for TCS iON Question Palette
  const getQuestionStatus = (qId: string) => {
    const hasAnswer = userAnswers[qId] !== undefined;
    const isMarked = markedForReview[qId];
    const isVisited = visitedQuestions[qId];

    if (hasAnswer && isMarked) return "answered_marked";
    if (hasAnswer) return "answered";
    if (isMarked) return "marked";
    if (isVisited) return "not_answered";
    return "not_visited";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "#10b981"; // Green
      case "marked":
        return "#a855f7"; // Purple
      case "answered_marked":
        return "#6366f1"; // Indigo
      case "not_answered":
        return "#ef4444"; // Red
      default:
        return "#64748b"; // Grey
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(16px)", padding: "14px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
              <Link href="/student/skills" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 700 }}>TCS iON / Infosys Assessment Engine</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🧮</span>
              <span>Mass Service Aptitude Exam Arena</span>
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Dynamic Question Generator Button */}
            <button
              onClick={handleGenerateFreshQuestions}
              disabled={generating || examSubmitted}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid rgba(245,158,11,0.4)",
                background: generating ? "rgba(245,158,11,0.1)" : "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.2))",
                color: "#fbbf24",
                fontSize: 12,
                fontWeight: 800,
                cursor: generating ? "not-allowed" : "pointer"
              }}
            >
              {generating ? "⚡ Synthesizing 5 New NQT Questions..." : "⚡ Generate 5 More Fresh Questions"}
            </button>

            {/* Mode Switcher */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", padding: 3, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
              <button
                onClick={() => { setMode("practice"); setExamStarted(false); }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "practice" ? "#6366f1" : "transparent",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Practice Mode
              </button>
              <button
                onClick={() => { setMode("timed_exam"); setExamStarted(true); setExamSubmitted(false); }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "timed_exam" ? "#ef4444" : "transparent",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ⏱️ Timed Exam
              </button>
            </div>

            {mode === "timed_exam" && (
              <div style={{ padding: "6px 12px", borderRadius: 8, background: timeLeft < 120 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)", border: timeLeft < 120 ? "1px solid #ef4444" : "1px solid #fbbf24", color: timeLeft < 120 ? "#f87171" : "#fbbf24", fontSize: 13, fontWeight: 900 }}>
                ⏳ {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px" }}>

        {/* ── SECTION NAVIGATION BAR (TCS iON STYLE) ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 14 }}>
          {/* Company Filter Tabs */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", maxWidth: "100%" }}>
            {[
              { id: "all", label: "All Papers (50+ Archive)" },
              { id: "TCS NQT", label: "🔥 TCS NQT" },
              { id: "Infosys", label: "🏛️ Infosys InfyTQ/SP" },
              { id: "Wipro Elite", label: "⚡ Wipro Elite" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCompany(tab.id)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: selectedCompany === tab.id ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                  background: selectedCompany === tab.id ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.03)",
                  color: selectedCompany === tab.id ? "white" : "rgba(255,255,255,0.6)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Section Filter */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", maxWidth: "100%" }}>
            {[
              { id: "all", label: "All Sections" },
              { id: "quantitative", label: "Quant Ability" },
              { id: "logical_reasoning", label: "Reasoning" },
              { id: "verbal_ability", label: "Verbal" },
              { id: "programming_logic", label: "Logic & Code" }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: "6px 11px",
                  borderRadius: 6,
                  border: activeCategory === cat.id ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.05)",
                  background: activeCategory === cat.id ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.02)",
                  color: activeCategory === cat.id ? "#34d399" : "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── EXAM SCORECARD (IF TIMED EXAM SUBMITTED) ── */}
        {examSubmitted && examResult && (
          <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,27,75,0.9))", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 18, padding: "24px", marginBottom: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.7)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontSize: 10, padding: "3px 9px", background: examResult.gateStatus === "passed" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: examResult.gateStatus === "passed" ? "#34d399" : "#f87171", borderRadius: 6, fontWeight: 800, letterSpacing: 1 }}>
                  OFFICIAL NQT GATE VERDICT
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 0", color: "white" }}>
                  {examResult.gateVerdict}
                </h3>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: examResult.percentage >= 65 ? "#34d399" : "#f87171" }}>
                  {examResult.percentage}%
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {examResult.correctCount} / {examResult.totalQuestions} Correct (Mass Cutoff: {examResult.cutoffThreshold}%)
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
              {Object.entries(examResult.categoryScores || {}).map(([cat, score]: [string, any]) => (
                <div key={cat} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "capitalize" }}>{cat.replace("_", " ")}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "white", marginTop: 2 }}>
                    {score.correct} / {score.total} <span style={{ fontSize: 11, color: "#94a3b8" }}>({Math.round((score.correct / score.total) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TWO-COLUMN TCS iON TEST LAYOUT (QUESTION CANVAS + PALETTE) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 20, alignItems: "flex-start" }}>
          
          {/* LEFT: QUESTION CANVAS */}
          {currentQ ? (
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 18, padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
              
              {/* Question Metadata */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, padding: "3px 8px", background: "rgba(99,102,241,0.2)", color: "#a5b4fc", borderRadius: 6, fontWeight: 700 }}>
                    {currentQ.company_tag}
                  </span>
                  <span style={{ fontSize: 11, padding: "3px 8px", background: "rgba(255,255,255,0.05)", color: "#cbd5e1", borderRadius: 6, fontWeight: 600 }}>
                    {currentQ.topic}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Source: {currentQ.source_citation}
                </span>
              </div>

              {/* Question Header & Body */}
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>
                QUESTION {currentIdx + 1} OF {questions.length}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.55, color: "white", margin: "0 0 24px" }}>
                {currentQ.question}
              </h3>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {currentQ.options.map((opt, idx) => {
                  const isSelected = userAnswers[currentQ.id] === idx;
                  const isCorrect = idx === currentQ.correct_option_index;
                  const showFeedback = mode === "practice" && revealedExplanations[currentQ.id];

                  let optionBg = "rgba(255,255,255,0.03)";
                  let optionBorder = "1px solid rgba(255,255,255,0.08)";
                  let optionColor = "#f8fafc";

                  if (showFeedback) {
                    if (isCorrect) {
                      optionBg = "rgba(16,185,129,0.15)";
                      optionBorder = "1px solid #10b981";
                      optionColor = "#34d399";
                    } else if (isSelected && !isCorrect) {
                      optionBg = "rgba(239,68,68,0.15)";
                      optionBorder = "1px solid #ef4444";
                      optionColor = "#f87171";
                    }
                  } else if (isSelected) {
                    optionBg = "rgba(99,102,241,0.2)";
                    optionBorder = "1px solid #6366f1";
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        background: optionBg,
                        border: optionBorder,
                        color: optionColor,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        transition: "all 0.15s ease"
                      }}
                    >
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: isSelected ? "#6366f1" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation in Practice Mode */}
              {mode === "practice" && revealedExplanations[currentQ.id] && (
                <div style={{ padding: "16px 18px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 800, marginBottom: 4 }}>
                    💡 STEP-BY-STEP MATHEMATICAL SOLUTION
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, marginBottom: 8 }}>
                    {currentQ.explanation}
                  </div>
                  {currentQ.shortcut_tip && (
                    <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700, background: "rgba(245,158,11,0.1)", padding: "6px 10px", borderRadius: 8 }}>
                      ⚡ NQT Speed Shortcut: {currentQ.shortcut_tip}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Actions (Save & Next, Mark Review, Clear) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => toggleMarkReview(currentQ.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid rgba(168,85,247,0.4)",
                      background: markedForReview[currentQ.id] ? "rgba(168,85,247,0.25)" : "transparent",
                      color: "#c084fc",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {markedForReview[currentQ.id] ? "✓ Marked for Review" : "🟣 Mark for Review"}
                  </button>

                  <button
                    onClick={() => clearCurrentResponse(currentQ.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                      color: "#94a3b8",
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    Clear Response
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentIdx === 0}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.03)",
                      color: currentIdx === 0 ? "rgba(255,255,255,0.3)" : "white",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: currentIdx === 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    ← Previous
                  </button>

                  {currentIdx < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx(prev => prev + 1)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: "none",
                        background: "linear-gradient(135deg,#6366f1,#a855f7)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      Save & Next →
                    </button>
                  ) : (
                    <button
                      onClick={submitExam}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: "none",
                        background: "linear-gradient(135deg,#10b981,#059669)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      Submit Exam ➔
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ padding: "48px 24px", textAlign: "center", background: "rgba(15,23,42,0.8)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)" }}>
              {loading ? (
                <div style={{ color: "#94a3b8", fontSize: 14 }}>⚡ Loading question paper...</div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                  <h3 style={{ color: "white", fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>No questions found in this specific sub-category</h3>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 16px" }}>Generate 5 fresh AI questions or switch to &quot;All Sections&quot; to practice immediately.</p>
                  <button
                    onClick={handleGenerateFreshQuestions}
                    style={{ padding: "8px 18px", borderRadius: 8, background: "#f59e0b", color: "#000", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer" }}
                  >
                    ⚡ Generate 5 Fresh Questions
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RIGHT: TCS iON QUESTION PALETTE */}
          <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 18, padding: "18px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "white", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>QUESTION PALETTE</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{questions.length} Items</span>
            </div>

            {/* Legend */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16, fontSize: 10, color: "#94a3b8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                <span>Answered ({Object.keys(userAnswers).length})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#a855f7" }} />
                <span>Review ({Object.values(markedForReview).filter(Boolean).length})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                <span>Not Answered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#64748b" }} />
                <span>Not Visited</span>
              </div>
            </div>

            {/* Grid of Numbered Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, maxHeight: 340, overflowY: "auto", paddingRight: 2 }}>
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q.id);
                const color = getStatusColor(status);
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      height: 36,
                      borderRadius: 8,
                      border: isCurrent ? "2px solid white" : `1px solid ${color}60`,
                      background: `${color}25`,
                      color: isCurrent ? "white" : color,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.1s ease"
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Quick Submit CTA */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, marginTop: 16 }}>
              <button
                onClick={submitExam}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
                }}
              >
                Submit Section & Review ➔
              </button>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
