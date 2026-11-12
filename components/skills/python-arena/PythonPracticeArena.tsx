"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MASTER_PYTHON_CURRICULUM_PARTS,
  PythonCurriculumPart,
  SubtopicCurriculumItem,
  getAllPythonSubtopics,
} from "@/lib/skills/python-arena/python-curriculum-registry";
import {
  CuratedPythonQuestion,
  CURATED_PYTHON_QUESTIONS,
} from "@/lib/skills/python-arena/python-question-bank";
import {
  PythonExecutionResult,
  SingleTestOutcome,
} from "@/lib/skills/python-arena/execution-engine";
import {
  PythonCandidateProgress,
  PythonSubmissionRecord,
} from "@/lib/skills/python-arena/submission-store";

export type PythonArenaTab =
  | "learn"
  | "practice"
  | "challenges"
  | "interview"
  | "assessments"
  | "progress";

interface PythonPracticeArenaProps {
  candidateId?: string;
  initialTab?: PythonArenaTab;
  initialSubtopicId?: string;
  initialQuestionId?: string;
}

export default function PythonPracticeArena({
  candidateId = "student-demo",
  initialTab = "learn",
  initialSubtopicId,
  initialQuestionId,
}: PythonPracticeArenaProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<PythonArenaTab>(initialTab);

  // Curriculum State
  const [selectedPartId, setSelectedPartId] = useState<string>("part_a");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>(
    initialSubtopicId || "py-foundations-what-is-python"
  );

  // Question & Challenge State
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    initialQuestionId || "py-q-placements-01"
  );
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Code Editor & Execution State
  const [userCode, setUserCode] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<PythonExecutionResult | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<"testcases" | "stdout" | "diagnostics">("testcases");

  // AI Mentor & Socratic Hints State
  const [hintTier, setHintTier] = useState<number>(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<any | null>(null);
  const [diagnosing, setDiagnosing] = useState<boolean>(false);

  // Student Progress & Persistence
  const [progress, setProgress] = useState<PythonCandidateProgress | null>(null);
  const [submissions, setSubmissions] = useState<PythonSubmissionRecord[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [aiPromptInput, setAiPromptInput] = useState<string>("");
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [notesModalOpen, setNotesModalOpen] = useState<boolean>(false);
  const [notesMode, setNotesMode] = useState<"quick_revision" | "complete_engineering" | "interview_cheatsheet">("quick_revision");
  const [generatedNotesHtml, setGeneratedNotesHtml] = useState<string | null>(null);

  // Active items
  const activeSubtopic: SubtopicCurriculumItem = useMemo(() => {
    return (
      getAllPythonSubtopics().find((s) => s.id === selectedSubtopicId) ||
      getAllPythonSubtopics()[0]
    );
  }, [selectedSubtopicId]);

  const activeQuestion: CuratedPythonQuestion = useMemo(() => {
    return (
      CURATED_PYTHON_QUESTIONS.find((q) => q.id === selectedQuestionId) ||
      CURATED_PYTHON_QUESTIONS[0]
    );
  }, [selectedQuestionId]);

  // Load question code when question changes
  useEffect(() => {
    if (activeQuestion) {
      setUserCode(activeQuestion.starterCode);
      setExecResult(null);
      setCurrentHint(null);
      setHintTier(0);
      setDiagnosis(null);
    }
  }, [activeQuestion]);

  // Sync candidate progress
  useEffect(() => {
    fetchProgress();
  }, [candidateId]);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`/api/skills/python-arena?action=get_progress&candidateId=${candidateId}`);
      const data = await res.json();
      if (data.success) {
        setProgress(data.progress);
      }
    } catch {
      // Fallback
    }
  };

  // Run Sample Tests
  const handleRunSamples = async () => {
    setIsRunning(true);
    setExecResult(null);
    try {
      const res = await fetch("/api/skills/python-arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_code",
          candidateId,
          questionId: activeQuestion.id,
          code: userCode,
          mode: "run_samples",
          isAssisted: hintTier > 0,
          hintsUsedCount: hintTier,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setExecResult(data.result);
      }
    } catch (err: any) {
      setExecResult({
        success: false,
        status: "runtime_error",
        stdout: "",
        stderr: err.message || "Failed to reach execution runner.",
        executionTimeMs: 0,
        errorMessage: "Network or execution error.",
      });
    } finally {
      setIsRunning(false);
      setActiveConsoleTab("testcases");
    }
  };

  // Full Submit with Hidden Tests & DNA Recording
  const handleSubmitCode = async () => {
    setIsRunning(true);
    setExecResult(null);
    try {
      const res = await fetch("/api/skills/python-arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_code",
          candidateId,
          questionId: activeQuestion.id,
          code: userCode,
          mode: "submit",
          isAssisted: hintTier > 0,
          hintsUsedCount: hintTier,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setExecResult(data.result);
        fetchProgress();
      }
    } catch (err: any) {
      setExecResult({
        success: false,
        status: "runtime_error",
        stdout: "",
        stderr: err.message || "Submission failed",
        executionTimeMs: 0,
        errorMessage: "Submission error",
      });
    } finally {
      setIsRunning(false);
      setActiveConsoleTab("testcases");
    }
  };

  // Socratic Hint Progression
  const handleRequestHint = async () => {
    const nextTier = Math.min(hintTier + 1, 5);
    setHintLoading(true);
    try {
      const res = await fetch("/api/skills/python-arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_hint",
          questionId: activeQuestion.id,
          requestedTier: nextTier,
        }),
      });
      const data = await res.json();
      if (data.success && data.hint) {
        setHintTier(nextTier);
        setCurrentHint(data.hint.hintContent);
      }
    } finally {
      setHintLoading(false);
    }
  };

  // Diagnose Code Attempt
  const handleDiagnose = async () => {
    if (!execResult) return;
    setDiagnosing(true);
    try {
      const res = await fetch("/api/skills/python-arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "diagnose_code",
          questionId: activeQuestion.id,
          code: userCode,
          execResult,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDiagnosis(data.diagnosis);
        setActiveConsoleTab("diagnostics");
      }
    } finally {
      setDiagnosing(false);
    }
  };

  // Generate Notes
  const handleOpenNotes = async (mode: "quick_revision" | "complete_engineering" | "interview_cheatsheet") => {
    setNotesMode(mode);
    setNotesModalOpen(true);
    try {
      const res = await fetch("/api/skills/python-arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_notes",
          candidateId,
          subtopicId: activeSubtopic.id,
          mode,
        }),
      });
      const data = await res.json();
      if (data.success && data.document) {
        setGeneratedNotesHtml(data.document.htmlContent);
      }
    } catch {
      // Ignore
    }
  };

  // AI Generate Questions
  const handleGenerateAiQuestions = async () => {
    if (!aiPromptInput.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/skills/python-arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_ai_questions",
          candidateId,
          prompt: aiPromptInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiPromptInput("");
        setCreateModalOpen(false);
        setActiveTab("practice");
      }
    } finally {
      setAiGenerating(false);
    }
  };

  // Filtered Question List
  const filteredQuestions = useMemo(() => {
    return CURATED_PYTHON_QUESTIONS.filter((q) => {
      if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
      if (companyFilter !== "all" && q.provenance.company.toLowerCase() !== companyFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.title.toLowerCase().includes(query) ||
          q.problemStatement.toLowerCase().includes(query) ||
          q.canonicalSkill.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [difficultyFilter, companyFilter, searchQuery]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── TOP HEADER RIBBON ── */}
      <header
        style={{
          borderBottom: "1px solid #E4E1DA",
          backgroundColor: "#FFFFFF",
          padding: "12px 24px",
          position: "sticky",
          top: 0,
          zIndex: 30,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Left Title & Strategy Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/student/skills"
              style={{
                fontSize: 12,
                color: "#667085",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Skill Practice Hub
            </Link>
            <span style={{ color: "#E4E1DA" }}>/</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🐍</span>
                <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.02em" }}>
                  Python Practice &amp; Placement Arena
                </h1>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "#EFF4FE",
                    color: "#356AE6",
                    border: "1px solid #D2E0FB",
                    fontWeight: 700,
                  }}
                >
                  Production Grade
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#667085" }}>
                Foundations to Advanced Engineering · Real Sandboxed Python 3 · Hidden Tests · Student DNA
              </p>
            </div>
          </div>

          {/* Primary 6-Tab Focused Navigation Ribbon */}
          <div
            style={{
              display: "flex",
              background: "#F6F5F1",
              padding: 3,
              borderRadius: 8,
              border: "1px solid #E4E1DA",
              gap: 2,
              overflowX: "auto",
            }}
          >
            {[
              { id: "learn", label: "Learn Python", icon: "📖" },
              { id: "practice", label: "Practice Questions", icon: "📝" },
              { id: "challenges", label: "Coding Challenges", icon: "⚡" },
              { id: "interview", label: "Interview Prep", icon: "🏢" },
              { id: "assessments", label: "Mock Assessments", icon: "⏱️" },
              { id: "progress", label: "My Progress", icon: "📊" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as PythonArenaTab)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: isActive ? "#162A43" : "transparent",
                    color: isActive ? "#FFFFFF" : "#667085",
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action: Create Question */}
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              background: "#356AE6",
              color: "#FFFFFF",
              border: "none",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>+</span>
            <span>Create Question</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "20px 24px 60px" }}>

        {/* ========================================================================= */}
        {/* TAB 1: LEARN PYTHON (7-PART PROGRESSIVE CURRICULUM) */}
        {/* ========================================================================= */}
        {activeTab === "learn" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
            {/* Left: 7-Part Subtopic Navigator */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 16,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  Curriculum Hierarchy
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {MASTER_PYTHON_CURRICULUM_PARTS.map((part) => {
                    const isPartActive = selectedPartId === part.id;
                    return (
                      <div key={part.id} style={{ display: "flex", flexDirection: "column" }}>
                        <button
                          onClick={() => setSelectedPartId(part.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 10px",
                            borderRadius: 6,
                            background: isPartActive ? "#EFF4FE" : "transparent",
                            color: isPartActive ? "#356AE6" : "#162A43",
                            border: isPartActive ? "1px solid #D2E0FB" : "1px solid transparent",
                            fontWeight: isPartActive ? 700 : 600,
                            fontSize: 11,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span>{part.title}</span>
                          <span style={{ fontSize: 10, color: "#667085" }}>{part.topics.reduce((acc, t) => acc + t.subtopics.length, 0)} sub</span>
                        </button>

                        {/* Expand topics if part active */}
                        {isPartActive && (
                          <div style={{ marginLeft: 10, borderLeft: "2px solid #E4E1DA", paddingLeft: 8, marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                            {part.topics.map((t) => (
                              <div key={t.id} style={{ marginTop: 4 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", marginBottom: 2 }}>
                                  {t.title}
                                </div>
                                {t.subtopics.map((s) => {
                                  const isSubActive = selectedSubtopicId === s.id;
                                  return (
                                    <button
                                      key={s.id}
                                      onClick={() => setSelectedSubtopicId(s.id)}
                                      style={{
                                        display: "block",
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "4px 8px",
                                        borderRadius: 4,
                                        background: isSubActive ? "#162A43" : "transparent",
                                        color: isSubActive ? "#FFFFFF" : "#17191C",
                                        border: "none",
                                        fontSize: 11,
                                        fontWeight: isSubActive ? 700 : 500,
                                        cursor: "pointer",
                                      }}
                                    >
                                      {s.title}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Active Subtopic Detailed Learning Experience */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Subtopic Banner Card */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                      {activeSubtopic.partTitle} · {activeSubtopic.topicTitle}
                    </span>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "4px 0 6px 0" }}>
                      {activeSubtopic.title}
                    </h2>
                    <p style={{ fontSize: 12, color: "#667085", margin: 0, lineHeight: 1.5 }}>
                      {activeSubtopic.summary}
                    </p>
                  </div>

                  {/* Contextual Actions Toolbar */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleOpenNotes("quick_revision")}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "#EFF4FE",
                        color: "#356AE6",
                        border: "1px solid #D2E0FB",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      📑 Quick Revision
                    </button>
                    <button
                      onClick={() => handleOpenNotes("complete_engineering")}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "#FAF9F6",
                        color: "#162A43",
                        border: "1px solid #E4E1DA",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      📘 Complete Notes
                    </button>
                    <button
                      onClick={() => handleOpenNotes("interview_cheatsheet")}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "#FEF7ED",
                        color: "#B7791F",
                        border: "1px solid #F8D8A7",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      🎯 Interview Sheet
                    </button>
                    <button
                      onClick={() => setActiveTab("challenges")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: "#162A43",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ⚡ Open Coding Lab
                    </button>
                  </div>
                </div>

                {/* Important Definitions */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 8 }}>
                    🔑 Key Definitions &amp; Invariants
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
                    {activeSubtopic.definitions.map((d, i) => (
                      <div key={i} style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 6, padding: "10px 12px" }}>
                        <strong style={{ fontSize: 11, color: "#356AE6" }}>{d.term}:</strong>
                        <p style={{ fontSize: 11, color: "#667085", margin: "4px 0 0", lineHeight: 1.4 }}>{d.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Syntax Blueprint */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                    📐 Canonical Syntax Blueprint
                  </div>
                  <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 6, padding: 12, fontFamily: "monospace", fontSize: 11, color: "#1E293B" }}>
                    <pre style={{ margin: 0 }}>{activeSubtopic.syntaxBlueprint}</pre>
                  </div>
                </div>

                {/* Worked Examples with Verified Output */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 8 }}>
                    💻 Real Worked Example (CPython Verified)
                  </div>
                  {activeSubtopic.workedExamples.map((ex, i) => (
                    <div key={i} style={{ border: "1px solid #E4E1DA", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ background: "#F6F5F1", padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#162A43", borderBottom: "1px solid #E4E1DA" }}>
                        {ex.title}
                      </div>
                      <div style={{ background: "#FAF9F6", padding: 12, fontFamily: "monospace", fontSize: 11, color: "#1E293B" }}>
                        <pre style={{ margin: 0 }}>{ex.code}</pre>
                      </div>
                      <div style={{ background: "#EAF4EE", borderTop: "1px solid #C8E4D3", padding: "8px 12px", fontSize: 11 }}>
                        <strong style={{ color: "#2E7D5B" }}>✓ Verified Output:</strong>
                        <pre style={{ margin: "4px 0 0", fontFamily: "monospace", color: "#2E7D5B" }}>{ex.expectedOutput}</pre>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Common Pitfalls & Mistakes */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#C24141", marginBottom: 8 }}>
                    ⚠️ Common Mistakes &amp; Gotchas
                  </div>
                  {activeSubtopic.commonMistakes.map((m, i) => (
                    <div key={i} style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 6, padding: 10, marginBottom: 8, fontSize: 11 }}>
                      <div style={{ color: "#C24141", fontWeight: 700 }}>✕ Mistake: {m.mistake}</div>
                      <div style={{ color: "#2E7D5B", fontWeight: 700, marginTop: 4 }}>✓ Fix: {m.correction}</div>
                      <div style={{ color: "#B7791F", marginTop: 2 }}><em>Why: {m.whyItFails}</em></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PRACTICE QUESTIONS (FILTERABLE QUESTION BANK) */}
        {/* ========================================================================= */}
        {activeTab === "practice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Search & Filter Bar */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Search questions by concept or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    fontSize: 11,
                    width: 240,
                    outline: "none",
                  }}
                />

                {/* Difficulty Filter */}
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    fontSize: 11,
                    background: "#FAF9F6",
                    color: "#162A43",
                    fontWeight: 600,
                  }}
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                {/* Company Filter */}
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    fontSize: 11,
                    background: "#FAF9F6",
                    color: "#162A43",
                    fontWeight: 600,
                  }}
                >
                  <option value="all">All Companies</option>
                  <option value="google">Google</option>
                  <option value="amazon">Amazon</option>
                  <option value="microsoft">Microsoft</option>
                  <option value="uber">Uber</option>
                  <option value="adobe">Adobe</option>
                  <option value="atlassian">Atlassian</option>
                  <option value="flipkart">Flipkart</option>
                </select>
              </div>

              <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>
                Showing <strong>{filteredQuestions.length}</strong> verified questions
              </div>
            </div>

            {/* Questions Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 14 }}>
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: 16,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: q.difficulty === "beginner" ? "#EAF4EE" : q.difficulty === "intermediate" ? "#EFF4FE" : "#FEF7ED",
                          color: q.difficulty === "beginner" ? "#2E7D5B" : q.difficulty === "intermediate" ? "#356AE6" : "#B7791F",
                        }}
                      >
                        {q.difficulty}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#667085", background: "#FAF9F6", border: "1px solid #E4E1DA", padding: "1px 6px", borderRadius: 4 }}>
                        🏢 {q.provenance.company}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 6px 0" }}>
                      {q.title}
                    </h3>
                    <p style={{ fontSize: 11, color: "#667085", margin: 0, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {q.problemStatement}
                    </p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E4E1DA", paddingTop: 10 }}>
                    <div style={{ fontSize: 10, color: "#667085" }}>
                      Time: <strong style={{ color: "#162A43" }}>{q.timeComplexity}</strong> · Space: <strong style={{ color: "#162A43" }}>{q.spaceComplexity}</strong>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedQuestionId(q.id);
                        setActiveTab("challenges");
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        background: "#356AE6",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Solve Challenge ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CODING CHALLENGES (FULL-SCREEN CODE RUNNER & TEST HARNESS) */}
        {/* ========================================================================= */}
        {activeTab === "challenges" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: 16 }}>
            {/* Left: Problem Statement & Socratic Hints */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                {/* Header tags */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                      {activeQuestion.difficulty}
                    </span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#FAF9F6", color: "#667085", border: "1px solid #E4E1DA", fontWeight: 700 }}>
                      🏢 {activeQuestion.provenance.company}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700 }}>
                    ✓ {activeQuestion.provenance.verificationStatus}
                  </span>
                </div>

                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#162A43", margin: "0 0 10px 0" }}>
                  {activeQuestion.title}
                </h2>
                <p style={{ fontSize: 12, color: "#17191C", lineHeight: 1.6, margin: "0 0 14px 0", whiteSpace: "pre-line" }}>
                  {activeQuestion.problemStatement}
                </p>

                {/* Constraints */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                    Constraints:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: "#667085", lineHeight: 1.5 }}>
                    {activeQuestion.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Examples */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                    Examples:
                  </div>
                  {activeQuestion.examples.map((ex, i) => (
                    <div key={i} style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 6, padding: "8px 12px", marginBottom: 8, fontSize: 11 }}>
                      <div><strong>Input:</strong> <code>{ex.input}</code></div>
                      <div><strong>Output:</strong> <code>{ex.output}</code></div>
                      <div style={{ color: "#667085", marginTop: 2 }}><em>{ex.explanation}</em></div>
                    </div>
                  ))}
                </div>

                {/* Socratic Hint Box */}
                <div style={{ marginTop: 16, borderTop: "1px solid #E4E1DA", paddingTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>💡</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#162A43" }}>
                        Socratic AI Mentor Hints ({hintTier}/5)
                      </span>
                    </div>
                    <button
                      onClick={handleRequestHint}
                      disabled={hintLoading || hintTier >= 5}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: hintTier >= 5 ? "#E4E1DA" : "#EFF4FE",
                        color: hintTier >= 5 ? "#667085" : "#356AE6",
                        border: "1px solid #D2E0FB",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: hintTier >= 5 ? "not-allowed" : "pointer",
                      }}
                    >
                      {hintLoading ? "Thinking..." : hintTier === 0 ? "Get Hint 1 (Concept)" : hintTier < 5 ? `Get Hint ${hintTier + 1}` : "Solution Revealed"}
                    </button>
                  </div>

                  {currentHint && (
                    <div style={{ marginTop: 10, padding: 12, borderRadius: 6, background: "#EFF4FE", border: "1px solid #D2E0FB", fontSize: 11, color: "#162A43", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                      {currentHint}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Code Editor & Execution Console */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Code Editor Container */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Editor Header Bar */}
                <div
                  style={{
                    background: "#FAF9F6",
                    borderBottom: "1px solid #E4E1DA",
                    padding: "8px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#162A43" }}>solution.py</span>
                    <span style={{ fontSize: 10, color: "#667085" }}>Python 3.9 (Sandboxed)</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setUserCode(activeQuestion.starterCode)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        color: "#667085",
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ↺ Reset
                    </button>
                  </div>
                </div>

                {/* Textarea Code Input */}
                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  spellCheck={false}
                  style={{
                    width: "100%",
                    height: 320,
                    padding: 16,
                    fontFamily: "monospace",
                    fontSize: 12,
                    lineHeight: 1.5,
                    border: "none",
                    outline: "none",
                    color: "#1E293B",
                    background: "#FFFFFF",
                    resize: "vertical",
                  }}
                />

                {/* Action Buttons Bar */}
                <div
                  style={{
                    background: "#FAF9F6",
                    borderTop: "1px solid #E4E1DA",
                    padding: "10px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleRunSamples}
                      disabled={isRunning}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        color: "#162A43",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: isRunning ? "not-allowed" : "pointer",
                      }}
                    >
                      {isRunning ? "Running..." : "▶ Run Sample Tests"}
                    </button>
                    <button
                      onClick={handleSubmitCode}
                      disabled={isRunning}
                      style={{
                        padding: "6px 16px",
                        borderRadius: 6,
                        background: "#356AE6",
                        border: "none",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: isRunning ? "not-allowed" : "pointer",
                      }}
                    >
                      {isRunning ? "Evaluating..." : "Submit &amp; Test (Hidden Tests)"}
                    </button>
                  </div>

                  {execResult && !execResult.testPassed && (
                    <button
                      onClick={handleDiagnose}
                      disabled={diagnosing}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: "#FEF7ED",
                        border: "1px solid #F8D8A7",
                        color: "#B7791F",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {diagnosing ? "Analyzing..." : "🔍 Diagnose My Error"}
                    </button>
                  )}
                </div>
              </div>

              {/* Execution Console & Test Outcomes */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                {/* Console Ribbon */}
                <div
                  style={{
                    background: "#FAF9F6",
                    borderBottom: "1px solid #E4E1DA",
                    padding: "6px 16px",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <button
                    onClick={() => setActiveConsoleTab("testcases")}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 11,
                      fontWeight: activeConsoleTab === "testcases" ? 800 : 600,
                      color: activeConsoleTab === "testcases" ? "#356AE6" : "#667085",
                      cursor: "pointer",
                    }}
                  >
                    Test Cases ({execResult ? `${execResult.passedCount}/${execResult.totalCount}` : "Ready"})
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab("stdout")}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 11,
                      fontWeight: activeConsoleTab === "stdout" ? 800 : 600,
                      color: activeConsoleTab === "stdout" ? "#356AE6" : "#667085",
                      cursor: "pointer",
                    }}
                  >
                    Console Output
                  </button>
                  {diagnosis && (
                    <button
                      onClick={() => setActiveConsoleTab("diagnostics")}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 11,
                        fontWeight: activeConsoleTab === "diagnostics" ? 800 : 600,
                        color: activeConsoleTab === "diagnostics" ? "#B7791F" : "#667085",
                        cursor: "pointer",
                      }}
                    >
                      AI Diagnostics
                    </button>
                  )}
                </div>

                {/* Console Content Area */}
                <div style={{ padding: 16 }}>
                  {activeConsoleTab === "testcases" && (
                    <div>
                      {!execResult ? (
                        <p style={{ fontSize: 11, color: "#667085", margin: 0 }}>
                          Run sample tests or submit to evaluate against public and hidden test cases.
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div
                            style={{
                              padding: "8px 12px",
                              borderRadius: 6,
                              background: execResult.testPassed ? "#EAF4EE" : "#FDF0F0",
                              border: execResult.testPassed ? "1px solid #C8E4D3" : "1px solid #F5C6C6",
                              color: execResult.testPassed ? "#2E7D5B" : "#C24141",
                              fontSize: 12,
                              fontWeight: 700,
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>
                              {execResult.testPassed
                                ? "✓ All Test Cases Passed (Score: 100%)"
                                : `✕ ${execResult.errorMessage || "Test suite failed."}`}
                            </span>
                            <span>{execResult.executionTimeMs}ms</span>
                          </div>

                          {execResult.testOutcomes?.map((to, i) => (
                            <div
                              key={to.testId}
                              style={{
                                background: "#FAF9F6",
                                border: "1px solid #E4E1DA",
                                borderRadius: 6,
                                padding: "8px 12px",
                                fontSize: 11,
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong>
                                  Test Case {i + 1} {to.isHidden ? "(Hidden Test Case)" : ""}
                                </strong>
                                <span style={{ color: to.passed ? "#2E7D5B" : "#C24141", fontWeight: 700 }}>
                                  {to.passed ? "Passed" : "Failed"}
                                </span>
                              </div>
                              <div style={{ color: "#667085", marginTop: 4 }}>
                                Expected: <code>{to.expected}</code> · Actual: <code>{to.actual}</code>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeConsoleTab === "stdout" && (
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#1E293B" }}>
                      {execResult?.stdout ? (
                        <pre style={{ margin: 0 }}>{execResult.stdout}</pre>
                      ) : execResult?.stderr ? (
                        <pre style={{ margin: 0, color: "#C24141" }}>{execResult.stderr}</pre>
                      ) : (
                        <span style={{ color: "#667085" }}>Standard output is empty.</span>
                      )}
                    </div>
                  )}

                  {activeConsoleTab === "diagnostics" && diagnosis && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 11 }}>
                      <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", padding: 12, borderRadius: 6 }}>
                        <strong style={{ color: "#B7791F", fontSize: 12 }}>{diagnosis.summary}</strong>
                        <p style={{ margin: "4px 0 0", color: "#162A43" }}>{diagnosis.rootCause}</p>
                      </div>
                      <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", padding: 12, borderRadius: 6 }}>
                        <strong style={{ color: "#356AE6" }}>Suggested Action:</strong>
                        <p style={{ margin: "4px 0 0", color: "#162A43" }}>{diagnosis.suggestedAction}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INTERVIEW PREPARATION (COMPANY SPECIFIC BANKS) */}
        {/* ========================================================================= */}
        {activeTab === "interview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: 20,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "0 0 6px 0" }}>
                Company-Specific Technical Interview Sets
              </h2>
              <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>
                Authentic, verified technical problems asked in Online Assessments and Technical Interviews across Tier-1 tech giants.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
              {[
                { company: "Google", desc: "Hash maps, two-pointers, and amortized complexity drills.", count: 18 },
                { company: "Amazon", desc: "Sliding window, string parsing, and customer stream aggregations.", count: 24 },
                { company: "Microsoft", desc: "Data structure invariants, anagram grouping, and sorting.", count: 16 },
                { company: "Uber", desc: "Real-time log spike detection, sliding window algorithms.", count: 12 },
                { company: "Adobe", desc: "Python memory rebinding, dunder protocols, and OOP.", count: 14 },
                { company: "Flipkart", desc: "Machine coding, LRU caches, and clean architecture.", count: 15 },
              ].map((comp) => (
                <div
                  key={comp.company}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: 16,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: "0 0 4px 0" }}>
                      🏢 {comp.company} Interview Track
                    </h3>
                    <p style={{ fontSize: 11, color: "#667085", margin: 0 }}>{comp.desc}</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6" }}>{comp.count} Questions</span>
                    <button
                      onClick={() => {
                        setCompanyFilter(comp.company.toLowerCase());
                        setActiveTab("practice");
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        background: "#162A43",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Practice Set ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MOCK ASSESSMENTS (TIMED ROUNDS) */}
        {/* ========================================================================= */}
        {activeTab === "assessments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: 20,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "0 0 6px 0" }}>
                Timed Placement Assessments
              </h2>
              <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>
                Simulate genuine 45-minute placement screening assessments with randomized test suites, strict timeouts, and zero hint assistance.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14 }}>
              {[
                { title: "Python Core Engineering Assessment", duration: "45 mins", questions: 3, difficulty: "Intermediate" },
                { title: "Placement Problem Solving Screening", duration: "60 mins", questions: 2, difficulty: "Advanced" },
                { title: "CPython Internals & OOP Mastery Exam", duration: "30 mins", questions: 4, difficulty: "Expert" },
              ].map((asm, i) => (
                <div
                  key={i}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: 18,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 14,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                      {asm.difficulty} · {asm.duration}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: "4px 0 6px 0" }}>
                      {asm.title}
                    </h3>
                    <p style={{ fontSize: 11, color: "#667085", margin: 0 }}>
                      Contains {asm.questions} rigorous coding challenges. Scored automatically on test case accuracy and execution speed.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("challenges")}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 6,
                      background: "#356AE6",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Start Timed Assessment ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: MY PROGRESS & STUDENT DNA EVIDENCE */}
        {/* ========================================================================= */}
        {activeTab === "progress" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Analytics Header Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16 }}>
                <span style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Questions Attempted</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#162A43", marginTop: 4 }}>
                  {progress?.totalQuestionsAttempted || 0}
                </div>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16 }}>
                <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700, textTransform: "uppercase" }}>Questions Solved</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#2E7D5B", marginTop: 4 }}>
                  {progress?.totalQuestionsSolved || 0}
                </div>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16 }}>
                <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>Solve Rate</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#356AE6", marginTop: 4 }}>
                  {progress?.solveRatePercent || 0}%
                </div>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16 }}>
                <span style={{ fontSize: 10, color: "#B7791F", fontWeight: 700, textTransform: "uppercase" }}>DNA Evidence Records</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#B7791F", marginTop: 4 }}>
                  {progress?.dnaEvidenceCount || 0}
                </div>
              </div>
            </div>

            {/* Weak Concepts Card */}
            {progress?.weakConcepts && progress.weakConcepts.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#C24141", margin: "0 0 10px 0" }}>
                  ⚠️ Identified Weak Areas &amp; Recurring Error Patterns
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {progress.weakConcepts.map((wc, i) => (
                    <div key={i} style={{ background: "#FDF0F0", border: "1px solid #F5C6C6", borderRadius: 6, padding: "8px 12px", fontSize: 11 }}>
                      <strong>{wc.concept}:</strong> {wc.errorCount} failures. <em>Last error: {wc.lastError}</em>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Submissions Table */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 12px 0" }}>
                Recent Python Submissions
              </h3>
              {progress?.recentSubmissions && progress.recentSubmissions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {progress.recentSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "#FAF9F6",
                        border: "1px solid #E4E1DA",
                        fontSize: 11,
                      }}
                    >
                      <div>
                        <strong>{sub.questionTitle}</strong>
                        <div style={{ color: "#667085", fontSize: 10 }}>
                          {new Date(sub.submittedAt).toLocaleTimeString()} · Execution: {sub.executionTimeMs}ms
                        </div>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: sub.status === "passed" ? "#2E7D5B" : "#C24141",
                        }}
                      >
                        {sub.status === "passed" ? "✓ Passed (100%)" : "✕ Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 11, color: "#667085", margin: 0 }}>
                  No submissions yet. Solve challenges to build verifiable Student DNA evidence.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── CREATE QUESTION / AI GENERATOR MODAL ── */}
      {createModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 10,
              border: "1px solid #E4E1DA",
              maxWidth: 560,
              width: "100%",
              padding: 24,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: 0 }}>
                🤖 Natural-Language Question Generator
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#667085" }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#667085", margin: "0 0 14px 0" }}>
              Request custom practice sets using plain English. The AI engine synthesizes full problem specifications, test cases, and solutions into your private vault.
            </p>
            <textarea
              value={aiPromptInput}
              onChange={(e) => setAiPromptInput(e.target.value)}
              placeholder="e.g. Create 3 intermediate Python questions on dictionaries and sliding windows with real-world scenarios and hidden test cases..."
              style={{
                width: "100%",
                height: 100,
                padding: 12,
                borderRadius: 6,
                border: "1px solid #E4E1DA",
                fontSize: 12,
                marginBottom: 14,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setCreateModalOpen(false)}
                style={{ padding: "6px 14px", borderRadius: 6, background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#667085", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAiQuestions}
                disabled={aiGenerating}
                style={{ padding: "6px 16px", borderRadius: 6, background: "#356AE6", color: "#FFFFFF", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                {aiGenerating ? "Generating..." : "Generate Practice Set"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVISION NOTES VIEWER MODAL ── */}
      {notesModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 10,
              border: "1px solid #E4E1DA",
              maxWidth: 800,
              width: "100%",
              height: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #E4E1DA",
                background: "#FAF9F6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: 13, color: "#162A43" }}>{activeSubtopic.title} Notes</strong>
                <span style={{ fontSize: 11, color: "#667085", marginLeft: 8 }}>Mode: {notesMode}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    background: "#356AE6",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🖨️ Print / Save PDF
                </button>
                <button
                  onClick={() => setNotesModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#667085" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Iframe */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              {generatedNotesHtml ? (
                <iframe
                  srcDoc={generatedNotesHtml}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Revision Notes"
                />
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#667085", fontSize: 12 }}>
                  Generating authentic revision notes...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

