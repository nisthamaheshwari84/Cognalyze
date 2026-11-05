"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ComprehensionChallenge,
  PracticeMode,
  LearningCheckpoint,
  InterviewStage,
} from "@/lib/skills/code-comprehension/challenge-factory";
import {
  CodebaseManifest,
} from "@/lib/skills/code-comprehension/codebase-library";
import { ComprehensionFinalAssessment } from "@/lib/skills/code-comprehension/assessment-engine";

export default function CodeComprehensionLabPage() {
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [challenges, setChallenges] = useState<ComprehensionChallenge[]>([]);
  const [allCodebases, setAllCodebases] = useState<CodebaseManifest[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<ComprehensionChallenge | null>(null);
  const [codebase, setCodebase] = useState<CodebaseManifest | null>(null);
  const [fileTree, setFileTree] = useState<Array<{ path: string; name: string; isDirectory: boolean; language: string; sizeBytes: number }>>([]);
  
  // Workspace State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("practice");
  const [activeFile, setActiveFile] = useState<string>("");
  const [activeFileContent, setActiveFileContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [fileEdited, setFileEdited] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Array<{ path: string; lineNumber: number; lineContent: string }>>([]);

  // Active Tab: Editor | Architecture | Tests
  const [activeMainTab, setActiveMainTab] = useState<"editor" | "architecture" | "tests">("editor");

  // Terminal & Test Execution
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [testReport, setTestReport] = useState<any | null>(null);

  // AI Tutor State
  const [tutorOpen, setTutorOpen] = useState<boolean>(true);
  const [tutorLevel, setTutorLevel] = useState<"hint" | "guided" | "full">("guided");
  const [tutorMessages, setTutorMessages] = useState<Array<{ sender: "candidate" | "tutor"; text: string }>>([
    {
      sender: "tutor",
      text: "Welcome to the Code Comprehension Lab! You have full access to investigate the multi-file project. Open files from the explorer, trace data flow, or ask me for contextual guidance."
    }
  ]);
  const [tutorInput, setTutorInput] = useState<string>("");
  const [askingTutor, setAskingTutor] = useState<boolean>(false);

  // Mode 1: Guided Learning Checkpoints
  const [checkpoints, setCheckpoints] = useState<LearningCheckpoint[]>([]);
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState<number>(0);
  const [selectedCheckpointOption, setSelectedCheckpointOption] = useState<number | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState<any | null>(null);
  const [verifyingCheckpoint, setVerifyingCheckpoint] = useState<boolean>(false);

  // Mode 3: Senior Engineer Interview Simulation
  const [interviewStages, setInterviewStages] = useState<InterviewStage[]>([]);
  const [activeInterviewStageIndex, setActiveInterviewStageIndex] = useState<number>(0);
  const [interviewSecondsLeft, setInterviewSecondsLeft] = useState<number>(1500); // 25 mins
  const [interviewTimerActive, setInterviewTimerActive] = useState<boolean>(true);
  const [candidateDefenseText, setCandidateDefenseText] = useState<string>("");
  const [submittingDefense, setSubmittingDefense] = useState<boolean>(false);
  const [defenseResult, setDefenseResult] = useState<any | null>(null);

  // Codebase Library Modal
  const [codebaseModalOpen, setCodebaseModalOpen] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  // Investigation & 100-Point Assessment Submission
  const [studentExplanation, setStudentExplanation] = useState<string>("");
  const [submittingAssessment, setSubmittingAssessment] = useState<boolean>(false);
  const [finalAssessment, setFinalAssessment] = useState<ComprehensionFinalAssessment | null>(null);
  const [dnaSyncStatus, setDnaSyncStatus] = useState<any | null>(null);

  const tutorBottomRef = useRef<HTMLDivElement>(null);

  // Initialize challenges & codebases
  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch("/api/auth/session");
        const authData = await authRes.json();
        if (authData?.user?.id) {
          setCandidateId(authData.user.id);
        }

        const res = await fetch("/api/skills/code-comprehension");
        const data = await res.json();
        if (data.success) {
          if (data.codebases) setAllCodebases(data.codebases);
          if (data.challenges?.length > 0) {
            setChallenges(data.challenges);
            loadChallenge(data.challenges[0].id);
          }
        }
      } catch (err) {
        console.warn("Failed to load initial challenges:", err);
      }
    }
    init();
  }, []);

  // Interview timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (practiceMode === "interview" && interviewTimerActive && interviewSecondsLeft > 0) {
      timer = setInterval(() => {
        setInterviewSecondsLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [practiceMode, interviewTimerActive, interviewSecondsLeft]);

  useEffect(() => {
    tutorBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tutorMessages]);

  const loadChallenge = async (challengeId: string) => {
    try {
      const res = await fetch(`/api/skills/code-comprehension?challengeId=${challengeId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedChallenge(data.challenge);
        setCodebase(data.codebase);
        setFileTree(data.fileTree);
        setCheckpoints(data.checkpoints || []);
        setInterviewStages(data.interviewStages || []);
        setActiveCheckpointIndex(0);
        setSelectedCheckpointOption(null);
        setCheckpointFeedback(null);
        setActiveInterviewStageIndex(0);
        setDefenseResult(null);
        setCandidateDefenseText("");
        setFinalAssessment(null);
        setTestReport(null);

        // Auto-start or load active session
        const sessRes = await fetch("/api/skills/code-comprehension", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start_session",
            challengeId,
            practiceMode,
          }),
        });
        const sessData = await sessRes.json();
        if (sessData.success) {
          setSessionId(sessData.session.id);
          const initialFile = data.challenge.relevantFiles[0] || "README.md";
          loadFile(sessData.session.id, initialFile);
        }
      }
    } catch (err) {
      console.error("Error loading challenge:", err);
    }
  };

  const loadFile = async (sId: string, path: string) => {
    setActiveFile(path);
    setIsEditing(false);
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_file",
          sessionId: sId,
          filePath: path,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveFileContent(data.content || "");
      }
    } catch (err) {
      console.error("Error loading file content:", err);
    }
  };

  const handleSaveFile = async () => {
    if (!sessionId || !activeFile) return;
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_file",
          sessionId,
          filePath: activeFile,
          content: activeFileContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFileEdited(false);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error saving file:", err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codebase || !searchQuery.trim()) return;
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          codebaseId: codebase.id,
          query: searchQuery,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error("Error searching codebase:", err);
    }
  };

  const handleRunTests = async () => {
    if (!selectedChallenge || !sessionId) return;
    setRunningTests(true);
    setActiveMainTab("tests");
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run_tests",
          sessionId,
          challengeId: selectedChallenge.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestReport(data.report);
      }
    } catch (err) {
      console.error("Error running tests:", err);
    } finally {
      setRunningTests(false);
    }
  };

  // Verify Guided Learning Checkpoint
  const handleVerifyCheckpoint = async () => {
    if (!selectedChallenge || selectedCheckpointOption === null) return;
    const currentCheckpoint = checkpoints[activeCheckpointIndex];
    if (!currentCheckpoint) return;

    setVerifyingCheckpoint(true);
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_checkpoint",
          challengeId: selectedChallenge.id,
          checkpointId: currentCheckpoint.id,
          selectedOptionIndex: selectedCheckpointOption,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckpointFeedback(data);
      }
    } catch (err) {
      console.error("Error verifying checkpoint:", err);
    } finally {
      setVerifyingCheckpoint(false);
    }
  };

  // Submit Senior Engineer Interview Defense
  const handleSubmitDefense = async () => {
    if (!selectedChallenge || !candidateDefenseText.trim()) return;
    const currentStage = interviewStages[activeInterviewStageIndex];
    if (!currentStage) return;

    setSubmittingDefense(true);
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_defense",
          challengeId: selectedChallenge.id,
          stageNumber: currentStage.stageNumber,
          candidateDefense: candidateDefenseText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDefenseResult(data);
      }
    } catch (err) {
      console.error("Error submitting interview defense:", err);
    } finally {
      setSubmittingDefense(false);
    }
  };

  const handleAskTutor = async (promptOverride?: string) => {
    const q = promptOverride || tutorInput;
    if (!q.trim() || !selectedChallenge || !sessionId) return;

    setTutorMessages(prev => [...prev, { sender: "candidate", text: q }]);
    if (!promptOverride) setTutorInput("");
    setAskingTutor(true);

    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ask_tutor",
          sessionId,
          challengeId: selectedChallenge.id,
          question: q,
          assistanceLevel: tutorLevel,
          activeFile,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTutorMessages(prev => [
          ...prev,
          { sender: "tutor", text: data.tutorResponse.reply },
        ]);
      }
    } catch (err) {
      console.error("Error querying AI Tutor:", err);
    } finally {
      setAskingTutor(false);
    }
  };

  const handleSubmitFinalAssessment = async () => {
    if (!selectedChallenge || !sessionId || !studentExplanation.trim()) return;
    setSubmittingAssessment(true);
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_assessment",
          sessionId,
          challengeId: selectedChallenge.id,
          studentExplanation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFinalAssessment(data.assessment);
        setDnaSyncStatus(data.dnaSync);
      }
    } catch (err) {
      console.error("Error submitting final assessment:", err);
    } finally {
      setSubmittingAssessment(false);
    }
  };

  // Filter codebases in modal
  const filteredCodebases = allCodebases.filter(cb => {
    const matchCategory = categoryFilter === "all" || cb.category === categoryFilter;
    const matchDifficulty = difficultyFilter === "all" || cb.difficulty === difficultyFilter;
    return matchCategory && matchDifficulty;
  });

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      <AppNav />

      {/* ── TOP HEADER / TOOLBAR ── */}
      <header style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border-subtle)", padding: "10px 24px", flexShrink: 0 }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/student/skills" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 600 }}>
              ← Skills Hub
            </Link>
            <span style={{ color: "var(--border-subtle)" }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15 }}>🔬</span>
              <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                Code Comprehension Lab
              </h1>
            </div>

            {/* Challenge Dropdown Selector */}
            <select
              value={selectedChallenge?.id || ""}
              onChange={(e) => loadChallenge(e.target.value)}
              style={{
                backgroundColor: "var(--surface-subtle)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                padding: "6px 12px",
                borderRadius: "var(--radius-btn)",
                fontSize: 12,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
                maxWidth: 320,
              }}
            >
              {challenges.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.mode.toUpperCase()}] {c.title} ({c.difficulty})
                </option>
              ))}
            </select>

            {/* Codebase Library Modal Trigger */}
            <button
              onClick={() => setCodebaseModalOpen(true)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-subtle)",
                color: "var(--brand-cobalt)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>📚 Systems Library</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* 3-Mode Selector */}
            <div style={{ display: "flex", background: "var(--surface-subtle)", padding: 3, borderRadius: 8, border: "1px solid var(--border-subtle)", gap: 2 }}>
              {(["learn", "practice", "interview"] as PracticeMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setPracticeMode(m)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: practiceMode === m ? "var(--brand-navy)" : "transparent",
                    color: practiceMode === m ? "#FFFFFF" : "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "capitalize",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {m === "learn" ? "💡 Guided Learning" : m === "practice" ? "🛠️ Practice" : "🎯 Interview Sim"}
                </button>
              ))}
            </div>

            {/* Run Tests Button */}
            <button
              onClick={handleRunTests}
              disabled={runningTests}
              style={{
                padding: "6px 16px",
                borderRadius: "var(--radius-btn)",
                border: "none",
                background: "var(--color-success)",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: runningTests ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 1px 3px rgba(46, 125, 91, 0.25)",
                transition: "all 0.15s ease"
              }}
            >
              <span>{runningTests ? "⌛ Executing Sandbox..." : "▶ Run Tests"}</span>
            </button>

            {/* AI Tutor Toggle */}
            <button
              onClick={() => setTutorOpen(!tutorOpen)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-btn)",
                border: tutorOpen ? "1px solid var(--brand-cobalt)" : "1px solid var(--border-subtle)",
                background: tutorOpen ? "var(--color-info-bg)" : "var(--surface)",
                color: tutorOpen ? "var(--brand-cobalt)" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease"
              }}
            >
              <span>🤖 AI Tutor</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── OBJECTIVE & REPO CONTEXT STRIP ── */}
      {selectedChallenge && codebase && (
        <div style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border-subtle)", padding: "8px 24px" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>📁 {codebase.title}</span>
              <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--color-info-bg)", color: "var(--brand-cobalt)", border: "1px solid var(--border-subtle)", borderRadius: 5, fontWeight: 700 }}>
                {codebase.category.toUpperCase()} • {codebase.language.toUpperCase()} • {codebase.difficulty.toUpperCase()}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                Snapshot: <code style={{ color: "var(--text-primary)", background: "var(--surface-subtle)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border-subtle)", fontFamily: "monospace", fontSize: 11 }}>{codebase.immutableSnapshot.slice(0, 14)}...</code>
              </span>
              <span style={{ color: "var(--border-subtle)" }}>|</span>
              <span style={{ color: "var(--text-secondary)" }}>⏱️ Target: <strong style={{ color: "var(--text-primary)" }}>{selectedChallenge.timeExpectationMinutes} mins</strong></span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Objective: </span>
              <strong style={{ color: "var(--color-warning)" }}>{selectedChallenge.learningObjectives[0]}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 1: GUIDED LEARNING VIEW ── */}
      {practiceMode === "learn" && selectedChallenge && (
        <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", width: "100%", flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-cobalt)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Mode 1: Guided Engineering Comprehension
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                {selectedChallenge.title}
              </h2>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Step {activeCheckpointIndex + 1} of {checkpoints.length}
            </div>
          </div>

          {/* 3-Stage Progress Stepper */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {checkpoints.map((cp, idx) => {
              const isCurrent = idx === activeCheckpointIndex;
              const isPast = idx < activeCheckpointIndex;
              return (
                <div
                  key={cp.id}
                  onClick={() => {
                    setActiveCheckpointIndex(idx);
                    setSelectedCheckpointOption(null);
                    setCheckpointFeedback(null);
                  }}
                  style={{
                    padding: "12px 16px",
                    background: isCurrent ? "var(--color-info-bg)" : "var(--surface)",
                    border: isCurrent ? "2px solid var(--brand-cobalt)" : "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isPast ? "var(--color-success)" : isCurrent ? "var(--brand-cobalt)" : "var(--surface-subtle)",
                    color: isPast || isCurrent ? "#FFFFFF" : "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                  }}>
                    {isPast ? "✓" : idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                      Stage {cp.stepNumber}: {cp.stage}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {cp.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Checkpoint Card */}
          {checkpoints[activeCheckpointIndex] && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, padding: "3px 8px", background: "var(--surface-subtle)", color: "var(--text-secondary)", borderRadius: 4, fontWeight: 700 }}>
                    Core Concept: {checkpoints[activeCheckpointIndex].concept}
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 12, marginBottom: 8, color: "var(--text-primary)" }}>
                    {checkpoints[activeCheckpointIndex].question}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    if (sessionId) {
                      loadFile(sessionId, checkpoints[activeCheckpointIndex].fileCitation.filePath);
                      setPracticeMode("practice");
                      setActiveMainTab("editor");
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "var(--surface-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--brand-cobalt)",
                    cursor: "pointer",
                  }}
                >
                  🔍 View {checkpoints[activeCheckpointIndex].fileCitation.filePath} ({checkpoints[activeCheckpointIndex].fileCitation.lineRange})
                </button>
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
                {checkpoints[activeCheckpointIndex].options.map((opt, optIdx) => {
                  const isSelected = selectedCheckpointOption === optIdx;
                  return (
                    <label
                      key={optIdx}
                      onClick={() => setSelectedCheckpointOption(optIdx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        borderRadius: 8,
                        border: isSelected ? "2px solid var(--brand-cobalt)" : "1px solid var(--border-subtle)",
                        background: isSelected ? "var(--color-info-bg)" : "var(--surface-subtle)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="checkpoint-option"
                        checked={isSelected}
                        onChange={() => setSelectedCheckpointOption(optIdx)}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: isSelected ? 700 : 500 }}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={handleVerifyCheckpoint}
                  disabled={selectedCheckpointOption === null || verifyingCheckpoint}
                  style={{
                    padding: "10px 24px",
                    background: selectedCheckpointOption === null ? "var(--border-subtle)" : "var(--brand-navy)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: selectedCheckpointOption === null ? "not-allowed" : "pointer",
                  }}
                >
                  {verifyingCheckpoint ? "Verifying..." : "Verify Understanding"}
                </button>

                {checkpointFeedback && activeCheckpointIndex < checkpoints.length - 1 && (
                  <button
                    onClick={() => {
                      setActiveCheckpointIndex(prev => prev + 1);
                      setSelectedCheckpointOption(null);
                      setCheckpointFeedback(null);
                    }}
                    style={{
                      padding: "10px 20px",
                      background: "var(--color-success)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Next Checkpoint →
                  </button>
                )}

                {checkpointFeedback && activeCheckpointIndex === checkpoints.length - 1 && (
                  <button
                    onClick={() => setPracticeMode("practice")}
                    style={{
                      padding: "10px 20px",
                      background: "var(--color-success)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Proceed to Open Practice Lab 🚀
                  </button>
                )}
              </div>

              {/* Feedback Banner */}
              {checkpointFeedback && (
                <div style={{
                  marginTop: 20,
                  padding: "16px",
                  borderRadius: 8,
                  border: checkpointFeedback.isCorrect ? "1px solid #A3D9A5" : "1px solid #FFCDD2",
                  background: checkpointFeedback.isCorrect ? "#E8F5E9" : "#FFEBEE",
                  color: "#1E293B",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{checkpointFeedback.isCorrect ? "✅" : "⚠️"}</span>
                    <strong style={{ fontSize: 14, color: checkpointFeedback.isCorrect ? "#2E7D32" : "#C62828" }}>
                      {checkpointFeedback.isCorrect ? "Correct Verification!" : "Incorrect Analysis"}
                    </strong>
                  </div>
                  <p style={{ margin: "4px 0 8px 0", fontSize: 13, lineHeight: 1.5 }}>
                    {checkpointFeedback.explanation}
                  </p>
                  {!checkpointFeedback.isCorrect && (
                    <div style={{ fontSize: 12, color: "#616161", marginTop: 6 }}>
                      💡 <strong>Hint:</strong> {checkpointFeedback.hint}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODE 3: SENIOR ENGINEER INTERVIEW SIMULATION VIEW ── */}
      {practiceMode === "interview" && selectedChallenge && (
        <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", width: "100%", flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Mode 3: Senior Technical Interviewer Simulation
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                {selectedChallenge.title}
              </h2>
            </div>

            {/* Countdown Timer Strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: 14 }}>⏱️</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Time Remaining
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: interviewSecondsLeft < 300 ? "var(--color-danger)" : "var(--text-primary)", fontFamily: "monospace" }}>
                  {formatTimer(interviewSecondsLeft)}
                </div>
              </div>
              <button
                onClick={() => setInterviewTimerActive(!interviewTimerActive)}
                style={{
                  padding: "4px 8px",
                  background: "var(--surface-subtle)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {interviewTimerActive ? "Pause" : "Resume"}
              </button>
            </div>
          </div>

          {/* 3-Stage Progress */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {interviewStages.map((stage, idx) => (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveInterviewStageIndex(idx);
                  setDefenseResult(null);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: activeInterviewStageIndex === idx ? "2px solid var(--brand-cobalt)" : "1px solid var(--border-subtle)",
                  background: activeInterviewStageIndex === idx ? "var(--color-info-bg)" : "var(--surface)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Stage {stage.stageNumber}: {stage.title}
              </button>
            ))}
          </div>

          {/* Senior Interviewer Technical Prompt Card */}
          {interviewStages[activeInterviewStageIndex] && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "24px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--brand-navy)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>
                  👨‍💼
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                    Senior Staff Engineer Interviewer
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    Evaluating Architectural Depth, Concurrency Boundaries & Production Hardening
                  </div>
                </div>
              </div>

              <div style={{ padding: "16px", background: "var(--surface-subtle)", borderRadius: 8, borderLeft: "4px solid var(--brand-cobalt)", marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, fontWeight: 600, color: "var(--text-primary)" }}>
                  &ldquo;{interviewStages[activeInterviewStageIndex].question}&rdquo;
                </p>
              </div>

              {/* Candidate Defense Textarea */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                    Your Architectural Defense & Reasoning:
                  </label>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {candidateDefenseText.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={candidateDefenseText}
                  onChange={(e) => setCandidateDefenseText(e.target.value)}
                  placeholder="Articulate your technical response citing data flow, failure modes, concurrency guarantees, and system invariants..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "var(--surface-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={handleSubmitDefense}
                  disabled={!candidateDefenseText.trim() || submittingDefense}
                  style={{
                    padding: "10px 24px",
                    background: !candidateDefenseText.trim() ? "var(--border-subtle)" : "var(--brand-navy)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: !candidateDefenseText.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {submittingDefense ? "Interviewer Evaluating..." : "Submit Technical Defense"}
                </button>

                {defenseResult && activeInterviewStageIndex < interviewStages.length - 1 && (
                  <button
                    onClick={() => {
                      setActiveInterviewStageIndex(prev => prev + 1);
                      setCandidateDefenseText("");
                      setDefenseResult(null);
                    }}
                    style={{
                      padding: "10px 20px",
                      background: "var(--color-success)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Advance to Stage {activeInterviewStageIndex + 2} →
                  </button>
                )}
              </div>

              {/* Defense Result & Adaptive Probe */}
              {defenseResult && (
                <div style={{ marginTop: 24, padding: "20px", background: "var(--surface-subtle)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{defenseResult.passed ? "🎯" : "⚠️"}</span>
                      <strong style={{ fontSize: 14, color: defenseResult.passed ? "var(--color-success)" : "var(--color-warning)" }}>
                        Interviewer Evaluation Score: {defenseResult.score} / 100
                      </strong>
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 8px", background: defenseResult.passed ? "#E8F5E9" : "#FFF3E0", color: defenseResult.passed ? "#2E7D32" : "#E65100", borderRadius: 4, fontWeight: 700 }}>
                      {defenseResult.passed ? "PASSED STAGE" : "NEEDS REFINEMENT"}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 12px 0", color: "var(--text-primary)" }}>
                    {defenseResult.feedback}
                  </p>

                  {/* Matched Concepts */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                    {defenseResult.matchedKeywords?.map((kw: string, i: number) => (
                      <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#E8F5E9", color: "#2E7D32", borderRadius: 4, fontWeight: 600 }}>
                        ✓ {kw}
                      </span>
                    ))}
                    {defenseResult.missingKeywords?.map((kw: string, i: number) => (
                      <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", borderRadius: 4 }}>
                        ○ {kw}
                      </span>
                    ))}
                  </div>

                  {/* Adaptive Follow-up Probe */}
                  <div style={{ padding: "12px 16px", background: "var(--surface)", borderRadius: 6, borderLeft: "3px solid var(--color-warning)" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-warning)", textTransform: "uppercase", marginBottom: 4 }}>
                      Interviewer Adaptive Follow-up Probe:
                    </div>
                    <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--text-primary)" }}>
                      &ldquo;{defenseResult.followUpProbe}&rdquo;
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: OPEN PRACTICE & INVESTIGATION LAB (3-COLUMN IDE) ── */}
      {practiceMode === "practice" && (
        <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden", height: "calc(100vh - 128px)" }}>
          
          {/* LEFT COLUMN: FILE EXPLORER & SEARCH */}
          <div style={{ width: 270, backgroundColor: "var(--surface)", borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            
            {/* Codebase Search */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--surface-subtle)" }}>
              <form onSubmit={handleSearch} style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  placeholder="Search repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 11,
                    color: "var(--text-primary)",
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "var(--surface-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--text-primary)"
                  }}
                >
                  🔍
                </button>
              </form>
            </div>

            {/* Search Results Drawer */}
            {searchResults.length > 0 && (
              <div style={{ maxHeight: 150, overflowY: "auto", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-subtle)", padding: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>{searchResults.length} matches</span>
                  <button onClick={() => setSearchResults([])} style={{ border: "none", background: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 10 }}>clear</button>
                </div>
                {searchResults.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (sessionId) loadFile(sessionId, m.path);
                    }}
                    style={{ fontSize: 11, padding: "3px 6px", cursor: "pointer", borderRadius: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    <span style={{ color: "var(--brand-cobalt)", fontWeight: 700 }}>L{m.lineNumber}</span> <span style={{ color: "var(--text-primary)" }}>{m.path}</span>
                  </div>
                ))}
              </div>
            )}

            {/* File Tree */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", padding: "4px 8px", letterSpacing: "0.05em" }}>
                Files ({fileTree.length})
              </div>
              {fileTree.map(f => {
                const isActive = activeFile === f.path;
                return (
                  <div
                    key={f.path}
                    onClick={() => {
                      if (sessionId) loadFile(sessionId, f.path);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                      backgroundColor: isActive ? "var(--color-info-bg)" : "transparent",
                      color: isActive ? "var(--brand-cobalt)" : "var(--text-primary)",
                      fontWeight: isActive ? 700 : 500,
                      marginBottom: 2,
                      transition: "all 0.1s ease"
                    }}
                  >
                    <span>{f.path.endsWith(".test.ts") ? "🧪" : f.path.endsWith(".ts") ? "📄" : "📝"}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.path}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER COLUMN: CODE EDITOR / ARCHITECTURE / TESTS */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, backgroundColor: "var(--surface-subtle)" }}>
            
            {/* Tab Navigation Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border-subtle)", padding: "0 16px" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setActiveMainTab("editor")}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderBottom: activeMainTab === "editor" ? "2px solid var(--brand-cobalt)" : "2px solid transparent",
                    background: "none",
                    color: activeMainTab === "editor" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  📝 Code Editor {activeFile ? `(${activeFile})` : ""}
                </button>
                <button
                  onClick={() => setActiveMainTab("architecture")}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderBottom: activeMainTab === "architecture" ? "2px solid var(--brand-cobalt)" : "2px solid transparent",
                    background: "none",
                    color: activeMainTab === "architecture" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  🗺️ Architecture & Topology
                </button>
                <button
                  onClick={() => setActiveMainTab("tests")}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderBottom: activeMainTab === "tests" ? "2px solid var(--brand-cobalt)" : "2px solid transparent",
                    background: "none",
                    color: activeMainTab === "tests" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  🧪 Test Harness {testReport ? `(${testReport.passedCount}/${testReport.totalTests})` : ""}
                </button>
              </div>

              {/* Editor Save Controls */}
              {activeMainTab === "editor" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveFile}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "var(--radius-btn)",
                          border: "none",
                          background: "var(--color-success)",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        💾 Save Changes
                      </button>
                      <button
                        onClick={() => {
                          if (sessionId && activeFile) loadFile(sessionId, activeFile);
                          setIsEditing(false);
                        }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-btn)",
                          border: "1px solid var(--border-subtle)",
                          background: "var(--surface)",
                          color: "var(--text-secondary)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "var(--radius-btn)",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--surface)",
                        color: "var(--text-primary)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      ✏️ Edit File
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* TAB CONTENT: 1. CODE EDITOR */}
            {activeMainTab === "editor" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 12 }}>
                <div style={{ flex: 1, backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "6px 12px", borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--surface-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      {activeFile || "No file selected"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {activeFileContent.split("\n").length} lines
                    </span>
                  </div>
                  
                  {isEditing ? (
                    <textarea
                      value={activeFileContent}
                      onChange={(e) => {
                        setActiveFileContent(e.target.value);
                        setFileEdited(true);
                      }}
                      style={{
                        flex: 1,
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "var(--surface)",
                        color: "var(--text-primary)",
                        fontFamily: "monospace",
                        fontSize: 12,
                        lineHeight: 1.5,
                        border: "none",
                        outline: "none",
                        resize: "none"
                      }}
                    />
                  ) : (
                    <div style={{ flex: 1, overflow: "auto", padding: "12px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.5 }}>
                      <pre style={{ margin: 0 }}>
                        {activeFileContent.split("\n").map((line, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 16 }}>
                            <span style={{ color: "var(--text-secondary)", width: 35, textAlign: "right", userSelect: "none" }}>{idx + 1}</span>
                            <span style={{ color: "var(--text-primary)" }}>{line}</span>
                          </div>
                        ))}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. ARCHITECTURE TOPOLOGY */}
            {activeMainTab === "architecture" && codebase && (
              <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
                      System Architecture Topology: {codebase.title}
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                      Interactive component graph showing dependency contracts, communication protocols, and execution boundaries.
                    </p>
                  </div>

                  {/* Nodes Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
                    {codebase.architecture.nodes.map(node => (
                      <div
                        key={node.id}
                        style={{
                          backgroundColor: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 8,
                          padding: 14,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-cobalt)" }}>
                            {node.name}
                          </span>
                          <span style={{ fontSize: 10, padding: "2px 6px", background: "var(--surface-subtle)", borderRadius: 4, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                            {node.type}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                          {node.description}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                          <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                            {node.filePath}
                          </span>
                          <button
                            onClick={() => {
                              if (sessionId && node.filePath) {
                                loadFile(sessionId, node.filePath);
                                setActiveMainTab("editor");
                              }
                            }}
                            style={{
                              border: "none",
                              background: "none",
                              color: "var(--brand-cobalt)",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Inspect →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Edges & Call Chains */}
                  <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px 0", color: "var(--text-primary)" }}>
                      Protocol Contracts & Invariants
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {codebase.architecture.edges.map((edge, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, padding: "8px 12px", background: "var(--surface-subtle)", borderRadius: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <code style={{ fontWeight: 700, color: "var(--brand-cobalt)" }}>{edge.from}</code>
                            <span>→</span>
                            <code style={{ fontWeight: 700, color: "var(--brand-cobalt)" }}>{edge.to}</code>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "var(--text-secondary)" }}>{edge.protocol}</span>
                            <span style={{ padding: "2px 6px", borderRadius: 4, background: "var(--surface)", color: "var(--text-primary)", fontWeight: 600 }}>
                              {edge.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. TEST HARNESS & LOGS */}
            {activeMainTab === "tests" && (
              <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                <div style={{ maxWidth: 850, margin: "0 auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
                        Verification Sandbox Test Suite
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                        Ephemeral Node.js VM execution environment validating invariants against your working tree.
                      </p>
                    </div>
                    <button
                      onClick={handleRunTests}
                      disabled={runningTests}
                      style={{
                        padding: "6px 16px",
                        background: "var(--color-success)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "var(--radius-btn)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {runningTests ? "Executing..." : "Re-run Test Suite"}
                    </button>
                  </div>

                  {testReport ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Score Summary Card */}
                      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Overall Invariant Score</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: testReport.score === 100 ? "var(--color-success)" : "var(--color-warning)" }}>
                            {testReport.score}%
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Passed Assertions</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                            {testReport.passedCount} / {testReport.totalTests} tests
                          </div>
                        </div>
                      </div>

                      {/* Test Cases List */}
                      {testReport.results.map((r: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: "var(--surface)",
                            border: r.passed ? "1px solid var(--border-subtle)" : "1px solid var(--color-danger)",
                            borderRadius: 8,
                            padding: 14
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span>{r.passed ? "✅" : "❌"}</span>
                              <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>{r.name}</strong>
                            </div>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{r.durationMs}ms</span>
                          </div>
                          <p style={{ margin: "4px 0", fontSize: 12, color: "var(--text-secondary)" }}>
                            {r.output}
                          </p>
                          {r.error && (
                            <div style={{ marginTop: 8, padding: 8, background: "var(--surface-subtle)", borderRadius: 6, fontSize: 11, fontFamily: "monospace", color: "var(--color-danger)" }}>
                              {r.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                      <p style={{ fontSize: 13, margin: 0 }}>Click &ldquo;Run Tests&rdquo; to execute the test harness against this codebase.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: AI ENGINEERING TUTOR */}
          {tutorOpen && (
            <div style={{ width: 330, backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
              
              {/* Tutor Header */}
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--surface-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🤖</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>AI Engineering Tutor</span>
                </div>
                
                {/* Assistance Level Selector */}
                <select
                  value={tutorLevel}
                  onChange={(e) => setTutorLevel(e.target.value as any)}
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px"
                  }}
                >
                  <option value="hint">Hint Mode</option>
                  <option value="guided">Guided</option>
                  <option value="full">Direct</option>
                </select>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {tutorMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.sender === "candidate" ? "flex-end" : "flex-start",
                      maxWidth: "88%",
                      backgroundColor: msg.sender === "candidate" ? "var(--brand-navy)" : "var(--surface-subtle)",
                      color: msg.sender === "candidate" ? "#FFFFFF" : "var(--text-primary)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      lineHeight: 1.4
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
                {askingTutor && (
                  <div style={{ alignSelf: "flex-start", backgroundColor: "var(--surface-subtle)", padding: "6px 12px", borderRadius: 8, fontSize: 11, color: "var(--text-secondary)" }}>
                    Thinking...
                  </div>
                )}
                <div ref={tutorBottomRef} />
              </div>

              {/* Quick Prompts */}
              <div style={{ padding: "6px 12px", borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--surface)", display: "flex", gap: 6, overflowX: "auto" }}>
                <button
                  onClick={() => handleAskTutor("Explain how the data flows from route to database.")}
                  style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid var(--border-subtle)", background: "var(--surface-subtle)", color: "var(--text-secondary)", fontSize: 10, whiteSpace: "nowrap", cursor: "pointer" }}
                >
                  Trace Flow
                </button>
                <button
                  onClick={() => handleAskTutor("What are the security invariants here?")}
                  style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid var(--border-subtle)", background: "var(--surface-subtle)", color: "var(--text-secondary)", fontSize: 10, whiteSpace: "nowrap", cursor: "pointer" }}
                >
                  Security
                </button>
                <button
                  onClick={() => handleAskTutor("Where is the root-cause bug in this flow?")}
                  style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid var(--border-subtle)", background: "var(--surface-subtle)", color: "var(--text-secondary)", fontSize: 10, whiteSpace: "nowrap", cursor: "pointer" }}
                >
                  Find Bug
                </button>
              </div>

              {/* Chat Input */}
              <div style={{ padding: 10, borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--surface-subtle)" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Ask tutor about this code..."
                    value={tutorInput}
                    onChange={(e) => setTutorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAskTutor();
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 11,
                      color: "var(--text-primary)",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={() => handleAskTutor()}
                    style={{
                      background: "var(--brand-navy)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUBMISSION DRAWER (BOTTOM BAR IN PRACTICE MODE) ── */}
      {practiceMode === "practice" && (
        <div style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border-subtle)", padding: "10px 24px", flexShrink: 0 }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                Ready to submit your engineering investigation?
              </span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Evaluated against Cognalyze&apos;s 100-point rubric and synced to Student DNA.
              </span>
            </div>
            <button
              onClick={() => {
                const modal = document.getElementById("submission-modal");
                if (modal) modal.style.display = "flex";
              }}
              style={{
                padding: "8px 20px",
                background: "var(--brand-navy)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-btn)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(22, 42, 67, 0.2)"
              }}
            >
              Submit 100-Point Assessment
            </button>
          </div>
        </div>
      )}

      {/* ── CODEBASE LIBRARY EXPLORER MODAL ── */}
      {codebaseModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 24,
        }}>
          <div style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            width: "100%",
            maxWidth: 1000,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
                  📚 Production Systems Library
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
                  Explore verified, multi-file production systems spanning SaaS, E-Commerce, AI Applications, and Fintech.
                </p>
              </div>
              <button
                onClick={() => setCodebaseModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: 18, color: "var(--text-secondary)", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Filter Pills */}
            <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>Category:</span>
                {["all", "saas", "ecommerce", "ai_app", "fintech"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      border: categoryFilter === cat ? "1px solid var(--brand-cobalt)" : "1px solid var(--border-subtle)",
                      background: categoryFilter === cat ? "var(--color-info-bg)" : "var(--surface)",
                      color: categoryFilter === cat ? "var(--brand-cobalt)" : "var(--text-secondary)",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      textTransform: "uppercase"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>Difficulty:</span>
                {["all", "beginner", "intermediate", "advanced", "senior"].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      border: difficultyFilter === diff ? "1px solid var(--brand-cobalt)" : "1px solid var(--border-subtle)",
                      background: difficultyFilter === diff ? "var(--color-info-bg)" : "var(--surface)",
                      color: difficultyFilter === diff ? "var(--brand-cobalt)" : "var(--text-secondary)",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Systems Grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
              {filteredCodebases.map(cb => (
                <div
                  key={cb.id}
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--color-info-bg)", color: "var(--brand-cobalt)", borderRadius: 4, fontWeight: 700, textTransform: "uppercase" }}>
                        {cb.category}
                      </span>
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--surface-subtle)", color: "var(--text-secondary)", borderRadius: 4, fontWeight: 600, textTransform: "capitalize" }}>
                        {cb.difficulty}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
                      {cb.title}
                    </h4>

                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                      {cb.summary}
                    </p>

                    <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-secondary)", flexWrap: "wrap" }}>
                      <span>💻 {cb.language} ({cb.framework})</span>
                      <span>•</span>
                      <span>🧩 {cb.architecture.nodes.length} Components</span>
                      <span>•</span>
                      <span>📦 {Object.keys(cb.files).length} Files</span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <code style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      {cb.immutableSnapshot.slice(0, 16)}...
                    </code>
                    <button
                      onClick={() => {
                        const matchingChallenge = challenges.find(c => c.codebaseId === cb.id) || challenges[0];
                        loadChallenge(matchingChallenge.id);
                        setCodebaseModalOpen(false);
                      }}
                      style={{
                        padding: "6px 14px",
                        background: "var(--brand-navy)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Launch Investigation →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 100-POINT RUBRIC SUBMISSION MODAL ── */}
      <div
        id="submission-modal"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}
      >
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              Submit Engineering Defense
            </h3>
            <button
              onClick={() => {
                const modal = document.getElementById("submission-modal");
                if (modal) modal.style.display = "none";
              }}
              style={{ background: "none", border: "none", fontSize: 16, color: "var(--text-secondary)", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
            Synthesize your findings. Cite relevant line numbers, explain data flow or concurrency invariants, and state why your solution satisfies production requirements.
          </p>

          <textarea
            rows={8}
            placeholder="Write your root-cause diagnosis, code reasoning, or audit review..."
            value={studentExplanation}
            onChange={(e) => setStudentExplanation(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              backgroundColor: "var(--surface-subtle)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-primary)",
              outline: "none",
              marginBottom: 16,
              fontFamily: "inherit"
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => {
                const modal = document.getElementById("submission-modal");
                if (modal) modal.style.display = "none";
              }}
              style={{
                padding: "8px 16px",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-btn)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitFinalAssessment}
              disabled={submittingAssessment || !studentExplanation.trim()}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-btn)",
                border: "none",
                background: "var(--brand-navy)",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: submittingAssessment || !studentExplanation.trim() ? "not-allowed" : "pointer"
              }}
            >
              {submittingAssessment ? "Evaluating Evidence..." : "Confirm & Evaluate"}
            </button>
          </div>
        </div>
      </div>

      {/* ── FINAL SCORECARD OVERLAY ── */}
      {finalAssessment && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: 20
        }}>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", padding: 28, boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>🏆</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "8px 0 4px 0", color: "var(--text-primary)" }}>
                Assessment Complete
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                Immutable Evidence Report • Synced to Student DNA
              </p>
            </div>

            {/* Score Banner */}
            <div style={{ backgroundColor: "var(--surface-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 16, display: "flex", justifyContent: "space-around", textAlign: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Composite Score</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: finalAssessment.overallScore >= 70 ? "var(--color-success)" : "var(--color-warning)" }}>
                  {finalAssessment.overallScore} / 100
                </div>
              </div>
              <div style={{ borderLeft: "1px solid var(--border-subtle)" }} />
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Performance Tier</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8, color: "var(--brand-cobalt)", textTransform: "capitalize" }}>
                  {finalAssessment.hiringSignal}
                </div>
              </div>
            </div>

            {/* Dimension Breakdown */}
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px 0", color: "var(--text-primary)" }}>
              7-Dimension Rubric Ratings
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {Object.entries(finalAssessment.dimensions).map(([key, dim]) => (
                <div key={key} style={{ padding: "8px 12px", background: "var(--surface-subtle)", borderRadius: 6, fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</span>
                    <span style={{ fontWeight: 700, color: "var(--brand-cobalt)" }}>{dim.earnedPoints}/{dim.maxPoints} pts</span>
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Rating: {dim.rating}/4 ({dim.status})</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => setFinalAssessment(null)}
                style={{
                  padding: "10px 24px",
                  background: "var(--brand-navy)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "var(--radius-btn)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Return to Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
