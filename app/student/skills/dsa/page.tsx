"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  generateSessionBrief,
  PostSessionFeedback,
  SessionBrief
} from "@/lib/skills/adaptive-engine";
import SessionBriefModal from "@/components/skills/SessionBriefModal";
import {
  STRIVER_STEPS,
  getAllStriverProblems,
  getStriverProblemById,
  generateDsaInterviewSession,
  getTargetedReTestProblem,
  StriverProblemFull,
  StriverStep,
  DsaInterviewQuestionItem
} from "@/lib/skills/striver-curriculum";
import {
  getStudentDsaFocus,
  getStudentDsaSummary,
  getStudentStriverProgress,
  updateStudentStriverStatus
} from "@/lib/skills/candidate-history";

export type DSAMode = "learn" | "practice" | "coach" | "interview";

function DSACodingArenaContent() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [trackSlug, setTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");

  // Mode Selector: Learn | Practice | Coach | Interview
  const [mode, setMode] = useState<DSAMode>("practice");
  const [selectedLanguage, setSelectedLanguage] = useState<"python" | "javascript" | "cpp" | "java">("python");

  // Striver Roadmap Navigation State
  const [selectedStepId, setSelectedStepId] = useState<string>("step-3");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [problemsList, setProblemsList] = useState<StriverProblemFull[]>([]);
  const [activeProblem, setActiveProblem] = useState<StriverProblemFull>(() => getStriverProblemById("maximum-subarray-sum-kadane-s-algorithm"));

  // Dynamic Candidate State & Striver Progress
  const [dsaSummary, setDsaSummary] = useState(() => getStudentDsaSummary("student-demo"));
  const [currentFocus, setCurrentFocus] = useState(() => getStudentDsaFocus("student-demo"));
  const [candidateProgressMap, setCandidateProgressMap] = useState<Record<string, any>>({});

  // Learn Mode State
  const [revealedSolution, setRevealedSolution] = useState(false);
  const [activeLearnSection, setActiveLearnSection] = useState<"concept" | "bruteforce" | "optimal" | "dryrun">("concept");
  const [checkpointSubmitted, setCheckpointSubmitted] = useState(false);
  const [selectedCheckpointOption, setSelectedCheckpointOption] = useState<number | null>(null);

  // Practice & Code Editor State
  const [code, setCode] = useState("");
  const [runningTests, setRunningTests] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [testOutput, setTestOutput] = useState<{
    passed: boolean;
    score: number;
    passedCount: number;
    totalTests: number;
    message: string;
    results?: Array<{ input: string; expected: string; actual: string; passed: boolean; isHidden?: boolean }>;
  } | null>(null);
  const [postFeedback, setPostFeedback] = useState<PostSessionFeedback | null>(null);
  const [lastSubmissionVerdict, setLastSubmissionVerdict] = useState<string | null>(null);

  // Socratic Coach Mode State
  const [coachLog, setCoachLog] = useState<{ sender: "coach" | "candidate"; text: string }[]>([
    {
      sender: "coach",
      text: "Hello! I am your Socratic Algorithmic Coach. I observe your approach and invariants. How are you formulating your data structure or boundary conditions?"
    }
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [activeHintLevel, setActiveHintLevel] = useState<number>(0);

  // Interview Mode State
  const [interviewQuestions, setInterviewQuestions] = useState<DsaInterviewQuestionItem[]>([]);
  const [currentInterviewIdx, setCurrentInterviewIdx] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewTimeLeft, setInterviewTimeLeft] = useState(1800); // 30 minutes
  const [interviewerFollowUp, setInterviewerFollowUp] = useState<string | null>(null);
  const [candidateFollowUpResponse, setCandidateFollowUpResponse] = useState("");
  const [interviewQuestionResults, setInterviewQuestionResults] = useState<Array<{
    problemId: string;
    title: string;
    score: number;
    passedCount: number;
    totalTests: number;
    verdict: string;
  }>>([]);
  const [interviewCompleted, setInterviewCompleted] = useState(false);

  // Proctoring State
  const [proctoringActive, setProctoringActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [tabSwitchViolations, setTabSwitchViolations] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Session Brief Modal
  const [sessionBrief, setSessionBrief] = useState<SessionBrief | null>(null);
  const [isBriefOpen, setIsBriefOpen] = useState(false);

  // ── 1. INITIALIZATION ──────────────────────────────────────────────────────
  useEffect(() => {
    const storedId = searchParams.get("candidateId") || localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(storedId);

    const paramTrack = (searchParams.get("track") as any) || "product_mid";
    setTrackSlug(paramTrack);

    const queryMode = (searchParams.get("mode") as DSAMode) || null;
    if (queryMode && ["learn", "practice", "coach", "interview"].includes(queryMode)) {
      setMode(queryMode);
    }

    const queryProblemId = searchParams.get("problemId");
    if (queryProblemId) {
      const p = getStriverProblemById(queryProblemId);
      setActiveProblem(p);
      setSelectedStepId(p.step_id);
    }

    // Refresh dynamic focus & progress
    refreshCandidateData(storedId);

    const brief = generateSessionBrief(paramTrack, "dsa_coding", storedId);
    setSessionBrief(brief);
  }, [searchParams]);

  const refreshCandidateData = (cid: string) => {
    const summary = getStudentDsaSummary(cid);
    setDsaSummary(summary);
    const focus = getStudentDsaFocus(cid);
    setCurrentFocus(focus);
    const progress = getStudentStriverProgress(cid);
    setCandidateProgressMap(progress);
  };

  // Sync problems list when step, subtopic, or search changes
  useEffect(() => {
    const list = getAllStriverProblems({
      stepId: selectedStepId,
      subtopic: selectedSubtopic,
      search: searchQuery
    });
    setProblemsList(list);
  }, [selectedStepId, selectedSubtopic, searchQuery]);

  // Sync starter code when active problem or language changes
  useEffect(() => {
    if (activeProblem) {
      const starter = activeProblem.starterCode[selectedLanguage] || activeProblem.starterCode.python;
      setCode(starter);
      setTestOutput(null);
      setPostFeedback(null);
      setRevealedSolution(false);
      setInterviewerFollowUp(null);
      setCandidateFollowUpResponse("");
      setActiveHintLevel(0);
      setCheckpointSubmitted(false);
      setSelectedCheckpointOption(null);
    }
  }, [activeProblem, selectedLanguage]);

  // Interview Timer Countdown
  useEffect(() => {
    let timer: any = null;
    if (mode === "interview" && interviewStarted && !interviewCompleted && interviewTimeLeft > 0) {
      timer = setInterval(() => {
        setInterviewTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, interviewStarted, interviewCompleted, interviewTimeLeft]);

  // Proctoring: Camera & Tab Visibility Change
  useEffect(() => {
    if (mode === "interview" && interviewStarted && !interviewCompleted) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { width: 240, height: 180 }, audio: false })
          .then(stream => {
            setCameraStream(stream);
            setProctoringActive(true);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch(() => {
            setProctoringActive(false);
          });
      }

      const handleVisibilityChange = () => {
        if (document.hidden) {
          setTabSwitchViolations(prev => prev + 1);
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (cameraStream) {
          cameraStream.getTracks().forEach(t => t.stop());
        }
      };
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
    }
  }, [mode, interviewStarted, interviewCompleted]);

  // Start Live Multi-Question Interview
  const handleStartInterview = (count: number = 3) => {
    const questions = generateDsaInterviewSession(candidateId, trackSlug, count);
    setInterviewQuestions(questions);
    setCurrentInterviewIdx(0);
    if (questions.length > 0) {
      setActiveProblem(questions[0].problem);
    }
    setInterviewQuestionResults([]);
    setInterviewStarted(true);
    setInterviewCompleted(false);
    setInterviewTimeLeft(count * 600); // 10 mins per question
    setTabSwitchViolations(0);
    setTestOutput(null);
    setPostFeedback(null);
  };

  // ── 2. RUN CODE (PUBLIC TEST CASES) ────────────────────────────────────────
  const handleRunCode = async () => {
    setRunningTests(true);
    try {
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run",
          problemId: activeProblem.id,
          code,
          language: selectedLanguage,
          candidateId,
          trackSlug
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestOutput({
          passed: data.passed,
          score: data.score,
          passedCount: data.passedCount,
          totalTests: data.totalTests,
          message: data.message,
          results: data.results
        });
        if (mode === "interview" && !interviewerFollowUp) {
          setInterviewerFollowUp(
            data.passed
              ? `Your implementation passed public cases with ${activeProblem.time_complexity} time. How would your algorithm adapt if the input stream scale increases 10x?`
              : `Your solution failed on sample inputs. What invariant or edge condition is missing from your pointer logic?`
          );
        }
      } else {
        setTestOutput({
          passed: false,
          score: 0,
          passedCount: 0,
          totalTests: data.totalTests || activeProblem.publicTestCases.length,
          message: data.message || data.error || "Execution failed.",
          results: data.results
        });
      }
    } catch (err: any) {
      setTestOutput({
        passed: false,
        score: 0,
        passedCount: 0,
        totalTests: activeProblem.publicTestCases.length,
        message: "Network or execution error: " + err.message
      });
    } finally {
      setRunningTests(false);
    }
  };

  // ── 3. SUBMIT CODE (FULL TEST SUITE + SCORING) ─────────────────────────────
  const handleSubmitCode = async () => {
    setEvaluating(true);
    try {
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          problemId: activeProblem.id,
          code,
          language: selectedLanguage,
          candidateId,
          trackSlug,
          timeSpentSeconds: 180,
          isInterview: mode === "interview"
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestOutput({
          passed: data.passed,
          score: data.score,
          passedCount: data.passedCount,
          totalTests: data.totalTests,
          message: data.message,
          results: data.results
        });
        setLastSubmissionVerdict(data.verdict);
        if (data.postFeedback) {
          setPostFeedback(data.postFeedback);
        }

        refreshCandidateData(candidateId);

        if (mode === "interview") {
          const qResult = {
            problemId: activeProblem.id,
            title: activeProblem.title,
            score: data.score,
            passedCount: data.passedCount,
            totalTests: data.totalTests,
            verdict: data.verdict
          };
          setInterviewQuestionResults(prev => [...prev, qResult]);
        }
      } else {
        setTestOutput({
          passed: false,
          score: 0,
          passedCount: 0,
          totalTests: data.totalTests || activeProblem.publicTestCases.length,
          message: data.message || data.error || "Submission failed.",
          results: data.results
        });
      }
    } catch (err: any) {
      console.error("Submission error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextInterviewQuestion = () => {
    const nextIdx = currentInterviewIdx + 1;
    if (nextIdx < interviewQuestions.length) {
      setCurrentInterviewIdx(nextIdx);
      setActiveProblem(interviewQuestions[nextIdx].problem);
      setTestOutput(null);
      setInterviewerFollowUp(null);
      setCandidateFollowUpResponse("");
    } else {
      handleFinishInterview();
    }
  };

  const handleFinishInterview = () => {
    setInterviewCompleted(true);
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  };

  const handleStartReTest = (topicId: string, currentProbId: string) => {
    const reTestProb = getTargetedReTestProblem(candidateId, topicId, currentProbId);
    setActiveProblem(reTestProb);
    setSelectedStepId(reTestProb.step_id);
    setMode("practice");
    setPostFeedback(null);
    setTestOutput(null);
  };

  const handleMarkAsLearned = () => {
    updateStudentStriverStatus(candidateId, activeProblem.id, "learned");
    refreshCandidateData(candidateId);
  };

  const handleAskCoach = () => {
    if (!coachInput.trim()) return;
    const userMsg = coachInput.trim();
    setCoachLog(prev => [...prev, { sender: "candidate", text: userMsg }]);
    setCoachInput("");

    setTimeout(() => {
      let reply = `In ${activeProblem.title}, consider what invariant must hold true at every element.`;
      if (userMsg.toLowerCase().includes("loop") || userMsg.toLowerCase().includes("nested")) {
        reply = "Nested loops compare every pair in O(N²). Can a hash map or frequency array record past elements so you can query in O(1)?";
      } else if (userMsg.toLowerCase().includes("pointer") || userMsg.toLowerCase().includes("window")) {
        reply = "If using two pointers, define when the left pointer moves forward. Does moving the right pointer strictly increase the constraint?";
      } else if (userMsg.toLowerCase().includes("edge") || userMsg.toLowerCase().includes("empty")) {
        reply = "Always check: What if the array has length 1? What if all numbers are negative? Does your initialization guard against empty inputs?";
      }
      setCoachLog(prev => [...prev, { sender: "coach", text: reply }]);
    }, 600);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentStep = STRIVER_STEPS.find(s => s.id === selectedStepId) || STRIVER_STEPS[2];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "12px 24px", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Link href="/student/skills" style={{ color: "#667085", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                  ← Skill Practice Hub
                </Link>
                <span style={{ color: "#98A2B3" }}>/</span>
                <span style={{ color: "#356AE6", fontSize: 12, fontWeight: 700 }}>DSA Arena (Striver A2Z)</span>
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.02em" }}>
                <span>⚡</span>
                <span>DSA Algorithmic Problem Solving &amp; Striver Curriculum Arena</span>
              </h1>
            </div>

            {/* Mode Selector Tabs */}
            <div style={{ display: "flex", background: "#F6F5F1", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA", gap: 2 }}>
              {[
                { id: "learn", label: "💡 Learn" },
                { id: "practice", label: "🛠️ Practice" },
                { id: "coach", label: "🎓 Coach" },
                { id: "interview", label: "🎯 Interview" }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id as DSAMode);
                    setPostFeedback(null);
                    setTestOutput(null);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: mode === m.id ? "#162A43" : "transparent",
                    color: mode === m.id ? "#FFFFFF" : "#667085",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value as any)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                color: "#17191C",
                padding: "6px 10px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                outline: "none"
              }}
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript (Node VM)</option>
              <option value="cpp">C++ 20</option>
              <option value="java">Java 17</option>
            </select>

            <span style={{ fontSize: 11, padding: "4px 9px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 6, fontWeight: 700 }}>
              🏛️ {trackSlug.replace("_", " ").toUpperCase()} BAR
            </span>
          </div>

        </div>
      </header>

      {/* Dynamic Focus Strip */}
      <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E4E1DA", padding: "8px 24px" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#667085" }}>Current Focus:</span>
            <strong style={{ color: "#162A43" }}>{currentFocus.topic}</strong>
            <span style={{ color: "#E4E1DA" }}>|</span>
            <span style={{ color: "#475467" }}>{currentFocus.reason}</span>
            <span style={{ color: "#E4E1DA" }}>|</span>
            <span style={{ color: "#2E7D5B", fontWeight: 700 }}>
              📊 Striver Progress: {dsaSummary.totalSolved} / {dsaSummary.totalAvailable} Solved
            </span>
          </div>

          {mode === "interview" && interviewStarted && !interviewCompleted && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {proctoringActive && (
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", fontWeight: 700 }}>
                  ● PROCTORING ACTIVE
                </span>
              )}
              {tabSwitchViolations > 0 && (
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#FDF2F2", color: "#C24141", border: "1px solid #F8C8C8", fontWeight: 700 }}>
                  ⚠️ {tabSwitchViolations} Tab Switch
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: interviewTimeLeft < 300 ? "#C24141" : "#B7791F", fontWeight: 700 }}>
                <span>⏱️ {formatTimer(interviewTimeLeft)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "18px 24px" }}>

        {/* ══════════════════════════════════════════════════════════════
            MODE 1: LEARN MODE (Full Striver Roadmap + 10-Step Curriculum)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "learn" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, marginBottom: 24 }}>
            
            {/* Left: Striver Roadmap Steps & Problems Browser */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, height: "calc(100vh - 180px)", overflowY: "auto", position: "sticky", top: 80, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Striver A2Z Roadmap</span>
                <span style={{ fontSize: 11, color: "#667085" }}>17 Steps</span>
              </div>

              {/* Step Selector Dropdown */}
              <select
                value={selectedStepId}
                onChange={e => {
                  setSelectedStepId(e.target.value);
                  setSelectedSubtopic("all");
                }}
                style={{
                  width: "100%",
                  background: "#F6F5F1",
                  border: "1px solid #E4E1DA",
                  color: "#17191C",
                  padding: "7px 10px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  outline: "none",
                  marginBottom: 10,
                  cursor: "pointer"
                }}
              >
                {STRIVER_STEPS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.title} ({s.problemCount} Qs)
                  </option>
                ))}
              </select>

              {/* Subtopic Filters */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                <button
                  onClick={() => setSelectedSubtopic("all")}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 5,
                    border: selectedSubtopic === "all" ? "1px solid #162A43" : "1px solid #E4E1DA",
                    background: selectedSubtopic === "all" ? "#162A43" : "#FFFFFF",
                    color: selectedSubtopic === "all" ? "#FFFFFF" : "#667085",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  All
                </button>
                {currentStep.subtopics.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubtopic(sub)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 5,
                      border: selectedSubtopic === sub ? "1px solid #162A43" : "1px solid #E4E1DA",
                      background: selectedSubtopic === sub ? "#162A43" : "#FFFFFF",
                      color: selectedSubtopic === sub ? "#FFFFFF" : "#667085",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Search Filter */}
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search problem title..."
                style={{
                  width: "100%",
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 6,
                  padding: "6px 8px",
                  color: "#17191C",
                  fontSize: 12,
                  outline: "none",
                  marginBottom: 10,
                  boxSizing: "border-box"
                }}
              />

              {/* Problems List in Selected Step */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "calc(100vh - 360px)", overflowY: "auto" }}>
                {problemsList.map(p => {
                  const prog = candidateProgressMap[p.id];
                  const isSolved = prog?.status === "solved";
                  const isLearned = prog?.status === "learned";
                  const isRevision = prog?.status === "needs_revision";
                  const isSelected = activeProblem.id === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveProblem(p)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 7,
                        background: isSelected ? "#EFF4FE" : "#FFFFFF",
                        border: isSelected ? "1px solid #356AE6" : "1px solid #E4E1DA",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#162A43" : "#17191C" }}>{p.title}</div>
                        <div style={{ fontSize: 10, color: "#667085" }}>{p.subtopic_title}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {isSolved ? (
                          <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 800 }}>✓</span>
                        ) : isLearned ? (
                          <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 800 }}>💡</span>
                        ) : isRevision ? (
                          <span style={{ fontSize: 10, color: "#C24141", fontWeight: 800 }}>⚠️</span>
                        ) : null}
                        <span style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: p.difficulty === "easy" ? "#EAF4EE" : p.difficulty === "medium" ? "#FEF7ED" : "#FDF2F2",
                          color: p.difficulty === "easy" ? "#2E7D5B" : p.difficulty === "medium" ? "#B7791F" : "#C24141",
                          border: `1px solid ${p.difficulty === "easy" ? "#C8E4D3" : p.difficulty === "medium" ? "#F8D8A7" : "#F8C8C8"}`,
                          fontWeight: 700
                        }}>
                          {p.difficulty[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: 10-Step Interactive Tutorial for Active Problem */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
              
              {/* Problem Title & Step Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 5, fontWeight: 700 }}>
                      {activeProblem.step_title}
                    </span>
                    <span style={{ fontSize: 11, color: "#667085" }}>{activeProblem.subtopic_title}</span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#162A43" }}>
                    {activeProblem.title}
                  </h2>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleMarkAsLearned}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 7,
                      border: "1px solid #D2E0FB",
                      background: "#EFF4FE",
                      color: "#356AE6",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ✓ Mark as Learned
                  </button>
                  <button
                    onClick={() => setMode("practice")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 7,
                      border: "none",
                      background: "#356AE6",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(16,24,40,0.05)"
                    }}
                  >
                    Solve in Practice ➔
                  </button>
                </div>
              </div>

              {/* 1. Problem Description */}
              <div style={{ padding: "14px 18px", borderRadius: 8, background: "#F6F5F1", border: "1px solid #E4E1DA", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 6 }}>
                  1. Problem Statement
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#17191C", lineHeight: 1.6 }}>
                  {activeProblem.description}
                </p>
                <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12, color: "#475467" }}>
                  <span>⏱️ Target: <strong style={{ color: "#162A43" }}>{activeProblem.time_complexity}</strong></span>
                  <span>📦 Space: <strong style={{ color: "#162A43" }}>{activeProblem.space_complexity}</strong></span>
                  <span>🏢 Companies: <strong style={{ color: "#162A43" }}>{activeProblem.companies.slice(0, 4).join(", ") || "FAANG"}</strong></span>
                </div>
              </div>

              {/* Interactive Learning Sub-Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[
                  { id: "concept", label: "2. Pattern & Concept" },
                  { id: "bruteforce", label: "3. Brute Force vs Optimal" },
                  { id: "dryrun", label: "4. Step-by-Step Dry Run" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLearnSection(tab.id as any)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: activeLearnSection === tab.id ? "1px solid #162A43" : "1px solid #E4E1DA",
                      background: activeLearnSection === tab.id ? "#162A43" : "#FFFFFF",
                      color: activeLearnSection === tab.id ? "#FFFFFF" : "#667085",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Learning Tab Content */}
              {activeLearnSection === "concept" && (
                <div style={{ padding: "14px 18px", borderRadius: 8, background: "#EFF4FE", border: "1px solid #D2E0FB", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                    {activeProblem.concept.patternName}
                  </div>
                  <p style={{ fontSize: 13, color: "#17191C", lineHeight: 1.6, margin: "0 0 10px" }}>
                    {activeProblem.concept.intuition}
                  </p>
                  <div style={{ fontSize: 12, color: "#162A43", background: "#FFFFFF", padding: 10, borderRadius: 6, border: "1px solid #D2E0FB" }}>
                    <strong>Key Invariant:</strong> {activeProblem.concept.codeExplanation}
                  </div>
                </div>
              )}

              {activeLearnSection === "bruteforce" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: 14, borderRadius: 8, background: "#FDF2F2", border: "1px solid #F8C8C8" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#C24141", marginBottom: 6 }}>
                      Naive / Brute Force Approach
                    </div>
                    <p style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.5, margin: 0 }}>
                      {activeProblem.concept.bruteForce}
                    </p>
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, background: "#EAF4EE", border: "1px solid #C8E4D3" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D5B", marginBottom: 6 }}>
                      Optimized Striver Approach
                    </div>
                    <p style={{ fontSize: 12, color: "#14532D", lineHeight: 1.5, margin: 0 }}>
                      {activeProblem.concept.optimalApproach}
                    </p>
                  </div>
                </div>
              )}

              {activeLearnSection === "dryrun" && (
                <div style={{ padding: "14px 18px", borderRadius: 8, background: "#F6F5F1", border: "1px solid #E4E1DA", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 8 }}>
                    Example Walkthrough on Input: <code>{activeProblem.concept.dryRun.input}</code>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#17191C" }}>
                    {activeProblem.concept.dryRun.steps.map((st, i) => (
                      <div key={i} style={{ padding: "6px 10px", borderRadius: 6, background: "#FFFFFF", border: "1px solid #E4E1DA" }}>
                        {st}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, color: "#2E7D5B" }}>
                    Final Output: {activeProblem.concept.dryRun.output}
                  </div>
                </div>
              )}

              {/* Checkpoint Question */}
              <div style={{ padding: "14px 18px", borderRadius: 8, background: "#EFF4FE", border: "1px solid #D2E0FB", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", marginBottom: 6 }}>
                  PATTERN CHECKPOINT
                </div>
                <div style={{ fontSize: 13, color: "#162A43", fontWeight: 700, marginBottom: 8 }}>
                  What is the target time complexity for an optimal solution on &ldquo;{activeProblem.title}&rdquo;?
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["O(N²)", activeProblem.time_complexity, "O(2^N)"].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCheckpointOption(idx);
                        setCheckpointSubmitted(true);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: selectedCheckpointOption === idx ? "2px solid #356AE6" : "1px solid #E4E1DA",
                        background: selectedCheckpointOption === idx ? (opt === activeProblem.time_complexity ? "#EAF4EE" : "#FDF2F2") : "#FFFFFF",
                        color: "#17191C",
                        fontSize: 12,
                        cursor: "pointer"
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {checkpointSubmitted && (
                  <div style={{ marginTop: 8, fontSize: 11, color: selectedCheckpointOption === 1 ? "#2E7D5B" : "#B7791F", fontWeight: 700 }}>
                    {selectedCheckpointOption === 1
                      ? `✓ Correct! Optimal complexity is ${activeProblem.time_complexity}.`
                      : `The optimal target is ${activeProblem.time_complexity}.`}
                  </div>
                )}
              </div>

              {/* Reveal Reference Solution */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={() => setRevealedSolution(!revealedSolution)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    background: "#FFFFFF",
                    color: "#667085",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {revealedSolution ? "Hide Reference Solution" : "Reveal Reference Solution"}
                </button>

                <button
                  onClick={() => setMode("practice")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 7,
                    border: "none",
                    background: "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Solve Independently in Practice ➔
                </button>
              </div>

              {revealedSolution && (
                <pre style={{ marginTop: 12, padding: 14, borderRadius: 8, background: "#162A43", color: "#FFFFFF", fontSize: 12, overflowX: "auto", border: "1px solid #233752", fontFamily: "monospace" }}>
                  {activeProblem.referenceSolution[selectedLanguage] || activeProblem.referenceSolution.python}
                </pre>
              )}

            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 2 & 3: PRACTICE & COACH MODE (Blank Editor + Real Runner)
            ══════════════════════════════════════════════════════════════ */}
        {(mode === "practice" || mode === "coach") && (
          <div style={{ display: "grid", gridTemplateColumns: mode === "coach" ? "1fr 340px" : "1fr 280px", gap: 18, marginBottom: 24 }}>
            
            {/* Left: Code Editor & Challenge */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              {/* Challenge Header Card with Striver Problem Dropdown */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      background: activeProblem.difficulty === "easy" ? "#EAF4EE" : activeProblem.difficulty === "medium" ? "#FEF7ED" : "#FDF2F2",
                      color: activeProblem.difficulty === "easy" ? "#2E7D5B" : activeProblem.difficulty === "medium" ? "#B7791F" : "#C24141",
                      border: `1px solid ${activeProblem.difficulty === "easy" ? "#C8E4D3" : activeProblem.difficulty === "medium" ? "#F8D8A7" : "#F8C8C8"}`,
                      borderRadius: 4,
                      fontWeight: 800
                    }}>
                      {activeProblem.difficulty.toUpperCase()}
                    </span>
                    <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#162A43" }}>
                      {activeProblem.title}
                    </h2>
                  </div>

                  {/* Problem Dropdown Selector across Striver sheet */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Striver Problem:</span>
                    <select
                      value={activeProblem.id}
                      onChange={e => {
                        const p = getStriverProblemById(e.target.value);
                        setActiveProblem(p);
                      }}
                      style={{
                        background: "#F6F5F1",
                        color: "#162A43",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        padding: "5px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        outline: "none",
                        cursor: "pointer",
                        maxWidth: 260
                      }}
                    >
                      {problemsList.slice(0, 60).map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.difficulty})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475467", lineHeight: 1.5 }}>
                  {activeProblem.description}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, color: "#667085" }}>
                  <span>Step: <strong style={{ color: "#162A43" }}>{activeProblem.step_title}</strong></span>
                  <span>•</span>
                  <span>Subtopic: <strong style={{ color: "#162A43" }}>{activeProblem.subtopic_title}</strong></span>
                  <span>•</span>
                  <span style={{ color: "#356AE6", fontWeight: 600 }}>Target: {activeProblem.time_complexity} Time</span>
                </div>
              </div>

              {/* Code Editor */}
              <div style={{ background: "#162A43", border: "1px solid #233752", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(16,24,40,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111C2E", padding: "8px 16px", borderBottom: "1px solid #233752" }}>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, fontFamily: "monospace" }}>
                    solution.{selectedLanguage === "python" ? "py" : selectedLanguage === "javascript" ? "js" : selectedLanguage === "cpp" ? "cpp" : "java"}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setCode(activeProblem.starterCode[selectedLanguage] || activeProblem.starterCode.python)}
                      style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid #233752", background: "transparent", color: "#94A3B8", fontSize: 10, cursor: "pointer" }}
                    >
                      Reset Starter
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={runningTests}
                      style={{
                        padding: "5px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: "#2E7D5B",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: runningTests ? "not-allowed" : "pointer"
                      }}
                    >
                      {runningTests ? "Running Tests..." : "▶ Run Tests"}
                    </button>
                    <button
                      onClick={handleSubmitCode}
                      disabled={evaluating}
                      style={{
                        padding: "5px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: "#356AE6",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: evaluating ? "not-allowed" : "pointer"
                      }}
                    >
                      {evaluating ? "Evaluating..." : "Submit Solution ➔"}
                    </button>
                  </div>
                </div>

                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  rows={14}
                  placeholder="# Write your solution here"
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "#FFFFFF",
                    fontFamily: "monospace",
                    fontSize: 13,
                    lineHeight: 1.6,
                    padding: 16,
                    border: "none",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Real Test Output Diagnostics */}
              {testOutput && (
                <div style={{ background: "#FFFFFF", border: testOutput.passed ? "1px solid #C8E4D3" : "1px solid #F8C8C8", borderRadius: 10, padding: 14, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: testOutput.passed ? "#2E7D5B" : "#C24141" }}>
                      <span>{testOutput.passed ? "✓" : "✗"}</span>
                      <span>{testOutput.message}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: testOutput.passed ? "#2E7D5B" : "#C24141" }}>
                      Score: {testOutput.score}% ({testOutput.passedCount}/{testOutput.totalTests} tests)
                    </span>
                  </div>

                  {testOutput.results && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
                      {testOutput.results.map((r, i) => (
                        <div key={i} style={{ padding: "6px 10px", borderRadius: 6, background: "#F6F5F1", border: r.passed ? "1px solid #C8E4D3" : "1px solid #F8C8C8", fontSize: 11 }}>
                          <div style={{ color: r.passed ? "#2E7D5B" : "#C24141", fontWeight: 700, marginBottom: 2 }}>
                            {r.passed ? "✓ Passed" : "✗ Failed"} {r.isHidden ? "(Hidden Case)" : ""}
                          </div>
                          <div>Input: <code>{r.input}</code></div>
                          <div>Expected: <code>{r.expected}</code></div>
                          <div>Got: <code style={{ color: r.passed ? "#2E7D5B" : "#C24141" }}>{r.actual}</code></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right: Socratic Coach Panel (Coach Mode) OR Hints (Practice Mode) */}
            {mode === "coach" ? (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>🎓</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>Socratic Algorithmic Coach</div>
                      <div style={{ fontSize: 10, color: "#667085" }}>Progressive hints without revealing answers</div>
                    </div>
                  </div>

                  {/* Progressive Hint Reveal Buttons */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                    {[1, 2, 3].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setActiveHintLevel(lvl)}
                        style={{
                          flex: 1,
                          padding: "5px",
                          borderRadius: 5,
                          border: activeHintLevel >= lvl ? "1px solid #356AE6" : "1px solid #E4E1DA",
                          background: activeHintLevel >= lvl ? "#EFF4FE" : "#F6F5F1",
                          color: activeHintLevel >= lvl ? "#356AE6" : "#667085",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Hint {lvl}
                      </button>
                    ))}
                  </div>

                  {activeHintLevel > 0 && (
                    <div style={{ padding: "8px 10px", borderRadius: 6, background: "#EFF4FE", border: "1px solid #D2E0FB", fontSize: 12, color: "#162A43", lineHeight: 1.4, marginBottom: 12 }}>
                      {activeProblem.hints[activeHintLevel - 1] || "Focus on avoiding redundant recalculation."}
                    </div>
                  )}

                  <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {coachLog.map((c, i) => (
                      <div key={i} style={{ padding: "8px 10px", borderRadius: 7, background: c.sender === "coach" ? "#EFF4FE" : "#F6F5F1", border: c.sender === "coach" ? "1px solid #D2E0FB" : "1px solid #E4E1DA", fontSize: 12, lineHeight: 1.4, color: "#17191C" }}>
                        <strong style={{ color: c.sender === "coach" ? "#356AE6" : "#162A43" }}>{c.sender === "coach" ? "🎓 Coach: " : "👤 You: "}</strong>
                        {c.text}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    value={coachInput}
                    onChange={e => setCoachInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAskCoach()}
                    placeholder="Ask about your approach..."
                    style={{
                      flex: 1,
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 6,
                      padding: "6px 10px",
                      color: "#17191C",
                      fontSize: 12,
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={handleAskCoach}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Ask
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 10 }}>
                  Practice Scaffolding &amp; Hints
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeProblem.hints.map((hint, idx) => (
                    <div key={idx} style={{ padding: "8px 10px", borderRadius: 6, background: "#F6F5F1", border: "1px solid #E4E1DA", fontSize: 12, color: "#475467", lineHeight: 1.4 }}>
                      {hint}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleStartReTest(activeProblem.topic_id, activeProblem.id)}
                  style={{
                    width: "100%",
                    marginTop: 18,
                    padding: "9px",
                    borderRadius: 7,
                    border: "1px solid #D2E0FB",
                    background: "#EFF4FE",
                    color: "#356AE6",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  🔄 Try Another in {activeProblem.subtopic_title}
                </button>

                <button
                  onClick={() => setMode("interview")}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: "9px",
                    borderRadius: 7,
                    border: "none",
                    background: "#162A43",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Ready: Multi-Question Interview ➔
                </button>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 4: INTERVIEW MODE (Multi-Question Loop + Proctoring)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "interview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!interviewStarted ? (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 28, textAlign: "center", maxWidth: 680, margin: "20px auto", boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
                <span style={{ fontSize: 32 }}>🎯</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "8px 0 6px" }}>
                  Realistic Multi-Question Technical Interview Simulation
                </h2>
                <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: "0 0 18px" }}>
                  You will solve a sequence of 3 fresh Striver algorithmic problems under real interview conditions. Proctoring detects tab switches and webcam state. Solutions and hints are disabled.
                </p>

                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button
                    onClick={() => handleStartInterview(2)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 7,
                      border: "1px solid #E4E1DA",
                      background: "#FFFFFF",
                      color: "#475467",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Short (2 Questions • 20 Mins)
                  </button>
                  <button
                    onClick={() => handleStartInterview(3)}
                    style={{
                      padding: "9px 24px",
                      borderRadius: 7,
                      border: "none",
                      background: "#356AE6",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(16,24,40,0.05)"
                    }}
                  >
                    Standard Loop (3 Questions • 30 Mins) ➔
                  </button>
                </div>
              </div>
            ) : interviewCompleted ? (
              /* Final Multi-Question Bar-Raiser Dossier */
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, marginBottom: 24, boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 4, fontWeight: 800, textTransform: "uppercase" }}>
                      INTERVIEW SCORECARD
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "4px 0 0" }}>
                      Multi-Question Technical Interview Evaluation
                    </h3>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: "#356AE6" }}>
                      {interviewQuestionResults.length > 0
                        ? Math.round(interviewQuestionResults.reduce((a, b) => a + b.score, 0) / interviewQuestionResults.length)
                        : 0}%
                    </span>
                    <div style={{ fontSize: 11, color: "#667085" }}>Overall Performance</div>
                  </div>
                </div>

                {/* Per-Question Results Breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 18 }}>
                  {interviewQuestionResults.map((r, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 8, background: "#F6F5F1", border: r.score >= 70 ? "1px solid #C8E4D3" : "1px solid #F8C8C8" }}>
                      <div style={{ fontSize: 10, color: "#667085" }}>Round {i + 1}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 4 }}>{r.title}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: r.score >= 70 ? "#2E7D5B" : "#C24141", fontWeight: 700 }}>{r.verdict}</span>
                        <span style={{ color: "#475467" }}>{r.score}% ({r.passedCount}/{r.totalTests} tests)</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Proctoring Report */}
                <div style={{ padding: 12, borderRadius: 8, background: "#F6F5F1", border: "1px solid #E4E1DA", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: tabSwitchViolations === 0 ? "#2E7D5B" : "#B7791F" }}>🛡️ Integrity &amp; Proctoring Verification</span>
                    <div style={{ fontSize: 11, color: "#667085" }}>
                      {tabSwitchViolations === 0
                        ? "Zero tab-switch violations detected. Continuous session integrity maintained."
                        : `Flagged: ${tabSwitchViolations} tab-switch events detected during active interview.`}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tabSwitchViolations === 0 ? "#2E7D5B" : "#B7791F" }}>
                    {tabSwitchViolations === 0 ? "Integrity 100%" : "Integrity Flagged"}
                  </span>
                </div>

                {/* Next Action / Targeted Re-Test */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #E4E1DA" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                      RECOMMENDED NEXT ACTION
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                      {interviewQuestionResults.some(r => r.score < 70)
                        ? "Targeted Re-Test Drill on Failed Algorithmic Concept"
                        : "Advance to Higher-Scale System Design Interview"}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const failed = interviewQuestionResults.find(r => r.score < 70);
                      if (failed) {
                        handleStartReTest("arrays-hashing", failed.problemId);
                      } else {
                        setMode("practice");
                      }
                    }}
                    style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Start Targeted Re-Test ➔
                  </button>
                </div>
              </div>
            ) : (
              /* Active Multi-Question Interview Screen */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
                
                {/* Editor & Question Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                        Question {currentInterviewIdx + 1} of {interviewQuestions.length}: {activeProblem.title} ({activeProblem.difficulty})
                      </div>
                      <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 700 }}>
                        Target: {activeProblem.time_complexity}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#475467", marginBottom: 12 }}>
                      {activeProblem.description}
                    </div>

                    <div style={{ background: "#162A43", border: "1px solid #233752", borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
                      <textarea
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        rows={14}
                        placeholder="# Write your solution here"
                        style={{ width: "100%", background: "transparent", color: "#FFFFFF", fontFamily: "monospace", fontSize: 12, padding: 14, border: "none", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        onClick={handleRunCode}
                        disabled={runningTests}
                        style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #C8E4D3", background: "#EAF4EE", color: "#2E7D5B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        {runningTests ? "Running Tests..." : "▶ Run Visible Tests"}
                      </button>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={handleSubmitCode}
                          disabled={evaluating}
                          style={{ padding: "7px 16px", borderRadius: 6, border: "1px solid #D2E0FB", background: "#EFF4FE", color: "#356AE6", fontSize: 11, fontWeight: 700, cursor: evaluating ? "not-allowed" : "pointer" }}
                        >
                          {evaluating ? "Evaluating..." : "Evaluate Question ➔"}
                        </button>

                        <button
                          onClick={handleNextInterviewQuestion}
                          style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          {currentInterviewIdx + 1 < interviewQuestions.length ? "Next Question ➔" : "Finish Interview ➔"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Real Test Diagnostics during Interview */}
                  {testOutput && (
                    <div style={{ background: "#FFFFFF", border: testOutput.passed ? "1px solid #C8E4D3" : "1px solid #F8C8C8", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: testOutput.passed ? "#2E7D5B" : "#C24141" }}>
                        {testOutput.passed ? "✓" : "✗"} Score: {testOutput.score}% ({testOutput.passedCount}/{testOutput.totalTests} tests passed)
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Live Interviewer Dialogue & Proctoring Preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  
                  {/* Proctoring Video Feed */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 12, textAlign: "center", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                      <span>● LIVE PROCTORING</span>
                      <span>HD WEBCAM</span>
                    </div>
                    <div style={{ width: "100%", height: 130, background: "#111C2E", borderRadius: 7, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </div>

                  {/* Interviewer Follow-up Challenge */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 10 }}>
                      🏛️ Bar-Raiser Dialogue
                    </div>
                    {interviewerFollowUp ? (
                      <div>
                        <div style={{ padding: "10px 12px", borderRadius: 7, background: "#EFF4FE", border: "1px solid #D2E0FB", fontSize: 12, color: "#162A43", lineHeight: 1.5, marginBottom: 12 }}>
                          <strong>Interviewer:</strong> &ldquo;{interviewerFollowUp}&rdquo;
                        </div>
                        <textarea
                          value={candidateFollowUpResponse}
                          onChange={e => setCandidateFollowUpResponse(e.target.value)}
                          placeholder="Defend your time complexity derivation and explain edge-case handling..."
                          rows={4}
                          style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 7, padding: 10, color: "#17191C", fontSize: 12, outline: "none", marginBottom: 8, boxSizing: "border-box" }}
                        />
                        <button
                          onClick={() => {
                            setInterviewerFollowUp(null);
                          }}
                          style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          Submit Defense ➔
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.5 }}>
                        Run visible tests or submit code to trigger the interviewer&apos;s trade-off challenge. The interviewer probes into memory limits and streaming adaptations.
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            POST-SESSION DIAGNOSTIC EVALUATION DOSSIER
            ══════════════════════════════════════════════════════════════ */}
        {postFeedback && mode !== "interview" && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(16,24,40,0.06)", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <span style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  background: (testOutput?.score || 0) >= 70 ? "#EAF4EE" : "#FDF2F2",
                  color: (testOutput?.score || 0) >= 70 ? "#2E7D5B" : "#C24141",
                  border: `1px solid ${(testOutput?.score || 0) >= 70 ? "#C8E4D3" : "#F8C8C8"}`,
                  borderRadius: 4,
                  fontWeight: 800,
                  textTransform: "uppercase"
                }}>
                  VERDICT: {lastSubmissionVerdict || "Evaluated"}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "4px 0 0" }}>
                  {activeProblem.title} • Diagnostic Result
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: (testOutput?.score || 0) >= 70 ? "#2E7D5B" : "#C24141" }}>
                  {testOutput?.score || 0}%
                </span>
                <div style={{ fontSize: 11, color: "#667085" }}>
                  Passed {testOutput?.passedCount || 0} of {testOutput?.totalTests || 0} Test Cases
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 8, background: "#EAF4EE", border: "1px solid #C8E4D3" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", marginBottom: 4 }}>
                  ✓ VERIFIED DEMONSTRATED SKILLS
                </div>
                {postFeedback.demonstrated.map((d, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#14532D", lineHeight: 1.4 }}>• {d}</div>
                ))}
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: "#FEF7ED", border: "1px solid #F8D8A7" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#B7791F", marginBottom: 4 }}>
                  ⚠️ TARGET WEAKNESSES &amp; EDGE GAPS
                </div>
                {postFeedback.weaknesses.map((w, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#78350F", lineHeight: 1.4 }}>• {w}</div>
                ))}
              </div>
            </div>

            {/* Targeted Re-Test / Next Practice Action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #E4E1DA" }}>
              <div>
                <div style={{ fontSize: 10, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                  RECOMMENDED NEXT PRACTICE ACTION
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                  {(testOutput?.score || 0) < 70
                    ? `Targeted Re-Test: Practice a different problem in ${activeProblem.subtopic_title}`
                    : `Advance to higher difficulty problem in ${currentStep.title}`}
                </div>
              </div>

              <button
                onClick={() => handleStartReTest(activeProblem.topic_id, activeProblem.id)}
                style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                Start Targeted Re-Test ➔
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Pre-Session Brief Modal */}
      {sessionBrief && (
        <SessionBriefModal
          isOpen={isBriefOpen}
          onClose={() => setIsBriefOpen(false)}
          brief={sessionBrief}
          onStartSession={() => setIsBriefOpen(false)}
          targetHref="/student/skills/dsa"
        />
      )}

    </div>
  );
}

export default function DSACodingArenaPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1" }} />}>
      <DSACodingArenaContent />
    </React.Suspense>
  );
}
