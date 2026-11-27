"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AssessmentArea,
  SupportedLanguage,
  AnyInterviewQuestion,
  QuestionCandidateAnswer,
  UpgradedFinalScorecard
} from "@/lib/skills/dsa-interview-types";
import { DsaInterviewSession, InterviewQuestionState } from "@/lib/skills/dsa-interview-store";
import { DSA_ROADMAP_STEPS } from "@/lib/skills/dsa-curriculum";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface DsaUpgradedInterviewViewProps {
  candidateId: string;
  selectedStepId: string;
  selectedLanguage: SupportedLanguage;
  setSelectedLanguage: (lang: SupportedLanguage) => void;
  onSelectStep: (stepId: string) => void;
  onExitInterview: () => void;
}

export function DsaUpgradedInterviewView({
  candidateId,
  selectedStepId,
  selectedLanguage,
  setSelectedLanguage,
  onSelectStep,
  onExitInterview
}: DsaUpgradedInterviewViewProps) {
  // Configuration State
  const [targetCompany, setTargetCompany] = useState("General");
  const [targetRole, setTargetRole] = useState<"intern" | "fresher" | "experienced">("fresher");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [questionCount, setQuestionCount] = useState<5 | 6 | 7>(6);
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Active Session State
  const [session, setSession] = useState<DsaInterviewSession | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Current Question Input States
  const [code, setCode] = useState("");
  const [runningTests, setRunningTests] = useState(false);
  const [testOutput, setTestOutput] = useState<any>(null);

  // Heterogeneous Answer State
  const [reasoningDefense, setReasoningDefense] = useState("");
  const [debugPatchCode, setDebugPatchCode] = useState("");
  const [debugLineNumber, setDebugLineNumber] = useState("");
  const [debugRootCause, setDebugRootCause] = useState("");
  const [comprehensionOutput, setComprehensionOutput] = useState("");
  const [comprehensionTrace, setComprehensionTrace] = useState("");
  const [complexityTime, setComplexityTime] = useState("O(N)");
  const [complexitySpace, setComplexitySpace] = useState("O(1)");
  const [complexityTradeOff, setComplexityTradeOff] = useState("");
  const [adaptiveDefense, setAdaptiveDefense] = useState("");
  const [answerSavedNotice, setAnswerSavedNotice] = useState<string | null>(null);

  // Proctoring
  const [proctoringActive, setProctoringActive] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Adjust duration default when question count changes
  useEffect(() => {
    if (questionCount === 5) setDurationMinutes(45);
    else if (questionCount === 7) setDurationMinutes(75);
    else setDurationMinutes(60);
  }, [questionCount]);

  // Check for active in-progress session on mount (refresh restoration)
  useEffect(() => {
    let isMounted = true;
    async function checkActiveSession() {
      try {
        const res = await fetch(`/api/skills/dsa?mode=interview_session&candidateId=${encodeURIComponent(candidateId || "guest")}`);
        const data = await res.json();
        if (isMounted && data.success && data.session && data.session.status === "in_progress") {
          const s: DsaInterviewSession = data.session;
          setSession(s);
          setSessionStarted(true);
          const remainingSecs = Math.max(0, Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 1000));
          setTimeLeft(remainingSecs || s.durationMinutes * 60);
          loadQuestionState(s, s.currentQuestionIndex);
        }
      } catch (err) {
        console.warn("Could not restore active interview session:", err);
      }
    }
    checkActiveSession();
    return () => { isMounted = false; };
  }, [candidateId]);

  // Countdown timer
  useEffect(() => {
    let timer: any = null;
    if (sessionStarted && !sessionCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinalizeInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionStarted, sessionCompleted, timeLeft]);

  // Tab switch proctoring telemetry
  useEffect(() => {
    if (sessionStarted && !sessionCompleted) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setTabSwitches(prev => prev + 1);
          if (session) {
            fetch("/api/skills/dsa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "interview_telemetry",
                sessionId: session.sessionId,
                type: "tab_switch",
                details: "Candidate navigated away from assessment window."
              })
            }).catch(() => {});
          }
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  }, [sessionStarted, sessionCompleted, session]);

  // Load question draft into inputs
  const loadQuestionState = (s: DsaInterviewSession, qIdx: number) => {
    const q = s.questions[qIdx];
    if (!q) return;

    setAnswerSavedNotice(null);
    setTestOutput(q.testResults || null);

    const bq = q.blueprintQuestion as any;
    if (q.area === "live_coding") {
      setCode(q.submittedCode || bq?.starterCode?.[selectedLanguage] || "");
    } else if (q.area === "debugging") {
      setDebugPatchCode(q.submittedCode || bq?.buggyCode || "");
      setDebugLineNumber(q.candidateAnswer?.identifiedBugLine ? String(q.candidateAnswer.identifiedBugLine) : "");
      setDebugRootCause(q.candidateAnswer?.identifiedRootCause || "");
    } else if (q.area === "code_comprehension") {
      setComprehensionOutput(q.candidateAnswer?.predictedOutput || "");
      setComprehensionTrace(q.candidateAnswer?.variableTrace || "");
    } else if (q.area === "technical_reasoning") {
      setReasoningDefense(q.candidateAnswer?.invariantDefense || q.candidateAnswer?.explanation || "");
    } else if (q.area === "complexity_optimization") {
      setComplexityTime(q.candidateAnswer?.submittedTimeComplexity || "O(N)");
      setComplexitySpace(q.candidateAnswer?.submittedSpaceComplexity || "O(1)");
      setComplexityTradeOff(q.candidateAnswer?.optimizationDefense || "");
    } else if (q.area === "adaptive_followup") {
      setAdaptiveDefense(q.candidateAnswer?.followUpResponse || q.followUpQuestion?.candidateResponse || "");
    }
  };

  // Start Session
  const handleStartSession = async () => {
    setLoading(true);
    setEvaluationError(null);
    try {
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_create",
          candidateId: candidateId || "guest",
          targetCompany,
          targetRole,
          difficulty,
          questionCount,
          durationMinutes,
          stepId: selectedStepId,
          language: selectedLanguage
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        const s: DsaInterviewSession = data.session;
        setSession(s);
        setSessionStarted(true);
        setSessionCompleted(false);
        setTimeLeft(s.durationMinutes * 60);
        setTabSwitches(0);
        loadQuestionState(s, 0);
      } else {
        setEvaluationError(data.error || "Failed to initialize interview blueprint.");
      }
    } catch (err: any) {
      setEvaluationError(err.message || "Network error starting interview.");
    } finally {
      setLoading(false);
    }
  };

  // Run visible tests for coding/debugging
  const handleRunTests = async () => {
    if (!session) return;
    const q = session.questions[session.currentQuestionIndex];
    if (!q) return;

    setRunningTests(true);
    try {
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run",
          problemId: q.problemId,
          code: q.area === "debugging" ? debugPatchCode : code,
          language: selectedLanguage,
          candidateId
        })
      });
      const data = await res.json();
      setTestOutput(data);
    } catch (err: any) {
      setTestOutput({ passed: false, score: 0, message: "Execution error: " + err.message });
    } finally {
      setRunningTests(false);
    }
  };

  // Submit Answer for Current Question
  const handleSubmitCurrentAnswer = async () => {
    if (!session) return;
    const qIdx = session.currentQuestionIndex;
    const q = session.questions[qIdx];
    if (!q) return;

    setEvaluating(true);
    try {
      if (q.area === "live_coding") {
        const res = await fetch("/api/skills/dsa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "interview_submit_code",
            sessionId: session.sessionId,
            questionIndex: qIdx,
            code,
            language: selectedLanguage
          })
        });
        const data = await res.json();
        if (data.session) setSession(data.session);
        if (data.testResults) setTestOutput(data.testResults);
        setAnswerSavedNotice("Live Coding Submission Recorded ✓");
      } else {
        // Heterogeneous submission
        let payload: Partial<QuestionCandidateAnswer> = {
          area: q.area,
          language: selectedLanguage
        };

        if (q.area === "debugging") {
          payload.code = debugPatchCode;
          payload.identifiedBugLine = parseInt(debugLineNumber, 10) || undefined;
          payload.identifiedRootCause = debugRootCause;
        } else if (q.area === "code_comprehension") {
          payload.predictedOutput = comprehensionOutput;
          payload.variableTrace = comprehensionTrace;
        } else if (q.area === "technical_reasoning") {
          payload.invariantDefense = reasoningDefense;
        } else if (q.area === "complexity_optimization") {
          payload.submittedTimeComplexity = complexityTime;
          payload.submittedSpaceComplexity = complexitySpace;
          payload.optimizationDefense = complexityTradeOff;
        } else if (q.area === "adaptive_followup") {
          payload.followUpResponse = adaptiveDefense;
        }

        const res = await fetch("/api/skills/dsa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "interview_submit_answer",
            sessionId: session.sessionId,
            questionIndex: qIdx,
            answerPayload: payload
          })
        });
        const data = await res.json();
        if (data.session) setSession(data.session);
        setAnswerSavedNotice("Answer & Evidence Recorded ✓");
      }
    } catch (err: any) {
      setEvaluationError("Failed to save answer: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  // Next Question
  const handleNextQuestion = async () => {
    if (!session) return;
    try {
      await handleSubmitCurrentAnswer();
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_next",
          sessionId: session.sessionId
        })
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        loadQuestionState(data.session, data.session.currentQuestionIndex);
      }
    } catch (err) {
      console.error("Error advancing question:", err);
    }
  };

  // Finalize Interview
  const handleFinalizeInterview = async () => {
    if (!session) return;
    setEvaluating(true);
    setEvaluationError(null);
    try {
      await handleSubmitCurrentAnswer();
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_finalize",
          sessionId: session.sessionId
        })
      });
      const data = await res.json();
      if (data.session && data.session.finalScorecard) {
        setSession(data.session);
        setSessionCompleted(true);
      } else {
        setEvaluationError(data.error || "Failed to finalize scorecard.");
      }
    } catch (err: any) {
      setEvaluationError("Final evaluation failed: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  // Area helper styling
  const getAreaBadge = (area?: AssessmentArea) => {
    switch (area) {
      case "technical_reasoning":
        return { label: "🧠 Technical Reasoning & Invariants", bg: "#F3E8FF", color: "#6B21A8", border: "#D8B4FE" };
      case "live_coding":
        return { label: "💻 Live Coding & Implementation", bg: "#EFF4FE", color: "#2563EB", border: "#BFDBFE" };
      case "debugging":
        return { label: "🐞 Real Debugging Lab", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" };
      case "code_comprehension":
        return { label: "🔍 Code Comprehension & Tracing", bg: "#CCFBF1", color: "#0F766E", border: "#99F6E4" };
      case "complexity_optimization":
        return { label: "⚡ Complexity Analysis & Proof", bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" };
      case "adaptive_followup":
        return { label: "🔮 Adaptive Technical Probe", bg: "#FFE4E6", color: "#9F1239", border: "#FECDD3" };
      default:
        return { label: "📝 Technical Question", bg: "#F3F4F6", color: "#374151", border: "#E5E7EB" };
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1: SETUP SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (!sessionStarted) {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: 32, maxWidth: 680, margin: "20px auto", boxShadow: "0 2px 8px rgba(16,24,40,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 40 }}>🎯</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#162A43", margin: "8px 0 6px" }}>
            Cognalyze Technical Interview Simulation
          </h2>
          <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: 0 }}>
            Realistic 5 to 7 question interview rounds with multi-language execution, defect debugging, execution tracing, Big-O proofs, and repeat-prevention intelligence.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {/* Company & Role */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Target Company Context
              </label>
              <select
                value={targetCompany}
                onChange={e => setTargetCompany(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E4E1DA", background: "#F6F5F1", fontSize: 12.5, fontWeight: 600, outline: "none" }}
              >
                <option value="General">General (FAANG/Tier-1 Standard)</option>
                <option value="Google">Google (Algorithms & Scale)</option>
                <option value="Amazon">Amazon (Pragmatic Architecture & DSA)</option>
                <option value="Microsoft">Microsoft (Data Structures & Systems)</option>
                <option value="Meta">Meta (Speed, Trees & Concurrency)</option>
                <option value="Uber">Uber (Graphs & High Throughput)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Target Role Level
              </label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value as any)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E4E1DA", background: "#F6F5F1", fontSize: 12.5, fontWeight: 600, outline: "none" }}
              >
                <option value="fresher">Graduate / Entry-Level (Fresher)</option>
                <option value="intern">Software Engineering Intern</option>
                <option value="experienced">Experienced SDE (2+ Years)</option>
              </select>
            </div>
          </div>

          {/* Question Count & Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Interview Format & Length
              </label>
              <select
                value={questionCount}
                onChange={e => setQuestionCount(parseInt(e.target.value, 10) as any)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E4E1DA", background: "#F6F5F1", fontSize: 12.5, fontWeight: 600, outline: "none" }}
              >
                <option value={6}>6 Questions (Standard 60-min Loop, All 6 Areas) ★</option>
                <option value={5}>5 Questions (Targeted 45-min Round)</option>
                <option value={7}>7 Questions (Comprehensive 75-min Bar-Raiser)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Programming Language
              </label>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value as any)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E4E1DA", background: "#F6F5F1", fontSize: 12.5, fontWeight: 600, outline: "none" }}
              >
                <option value="cpp">C++ 20 (Clang++ / G++)</option>
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node VM)</option>
                <option value="java">Java (Authentic JDK Runtime)</option>
              </select>
            </div>
          </div>

          {/* Step / Curriculum Focus */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Curriculum / Roadmap Step
            </label>
            <select
              value={selectedStepId}
              onChange={e => onSelectStep(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E4E1DA", background: "#F6F5F1", fontSize: 12.5, fontWeight: 600, outline: "none" }}
            >
              {DSA_ROADMAP_STEPS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.title} ({s.problemCount} Qs)
                </option>
              ))}
            </select>
          </div>

          {/* Six Area Verification Banner */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#334155", marginBottom: 6, textTransform: "uppercase" }}>
              ✓ Six Mandatory Assessment Areas Covered:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11.5, color: "#475467" }}>
              <div>• 1. Technical Reasoning & Invariants</div>
              <div>• 2. Live Coding (Executable Tests)</div>
              <div>• 3. Debugging Lab (Fault Isolation)</div>
              <div>• 4. Code Comprehension & Tracing</div>
              <div>• 5. Complexity & Optimization Proofs</div>
              <div>• 6. Adaptive Interviewer Probes</div>
            </div>
          </div>
        </div>

        {evaluationError && (
          <div style={{ background: "#FEF2F2", border: "1px solid #F87171", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: "#991B1B" }}>
            ⚠️ {evaluationError}
          </div>
        )}

        <button
          onClick={handleStartSession}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 8,
            border: "none",
            background: "#356AE6",
            color: "#FFFFFF",
            fontSize: 13.5,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 4px rgba(53,106,230,0.25)"
          }}
        >
          {loading ? "Generating Non-Repeating Blueprint..." : "Start Locked Technical Interview ➔"}
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2: FINAL SCORECARD DOSSIER
  // ══════════════════════════════════════════════════════════════════════════
  if (sessionCompleted && session?.finalScorecard) {
    const sc = session.finalScorecard;
    const comps = sc.areaCompetencies;

    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: 30, marginBottom: 24, boxShadow: "0 2px 8px rgba(16,24,40,0.06)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
          <div>
            <span style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 4, fontWeight: 800, textTransform: "uppercase" }}>
              AUTHENTICATED TECHNICAL INTERVIEW DOSSIER
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#162A43", margin: "6px 0 3px" }}>
              {session.targetCompany || "Technical"} • {(session.targetRole || "fresher").toUpperCase()} Evaluation Report
            </h2>
            <div style={{ fontSize: 12, color: "#667085" }}>
              Session ID: {session.sessionId} • Language: {session.language.toUpperCase()} • {session.questions.length} Questions Evaluated
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: sc.overallScore >= 70 ? "#2E7D5B" : sc.overallScore >= 55 ? "#B7791F" : "#C24141" }}>
              {sc.overallScore}%
            </div>
            <span style={{
              fontSize: 12,
              padding: "3px 10px",
              borderRadius: 5,
              fontWeight: 800,
              background: sc.overallScore >= 70 ? "#EAF4EE" : sc.overallScore >= 55 ? "#FEF7ED" : "#FDF2F2",
              color: sc.overallScore >= 70 ? "#2E7D5B" : sc.overallScore >= 55 ? "#B7791F" : "#C24141"
            }}>
              VERDICT: {sc.verdict.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 6-Area Mandatory Competency Breakdown */}
        {comps && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 10 }}>
              Mandatory Six-Area Competency Evaluation
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {[
                { title: "Technical Reasoning", data: comps.technicalReasoning, icon: "🧠" },
                { title: "Live Coding", data: comps.liveCoding, icon: "💻" },
                { title: "Debugging Lab", data: comps.debugging, icon: "🐞" },
                { title: "Code Comprehension", data: comps.codeComprehension, icon: "🔍" },
                { title: "Complexity & Big-O", data: comps.complexityOptimization, icon: "⚡" },
                { title: "Adaptive Probing", data: comps.adaptiveFollowUp, icon: "🔮" }
              ].map((c, i) => (
                <div key={i} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>
                      {c.icon} {c.title}
                    </span>
                    <strong style={{ fontSize: 13, color: c.data.score >= c.data.maxPoints * 0.7 ? "#166534" : "#991B1B" }}>
                      {c.data.score} / {c.data.maxPoints} pts
                    </strong>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>
                    {c.data.evidence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-Question Breakdown */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 10 }}>
            Question-by-Question Performance Dossier
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {sc.questionSummaries.map((qs, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: qs.score >= 70 ? "1px solid #C8E4D3" : "1px solid #F8C8C8", borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>Round {i + 1}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: qs.score >= 70 ? "#2E7D5B" : "#C24141" }}>
                    {qs.verdict} ({qs.score}%)
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>{qs.title}</div>
                <div style={{ fontSize: 11, color: "#475467", lineHeight: 1.4 }}>
                  {qs.specificFeedback}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "#2E7D5B", marginBottom: 6 }}>
              ✓ DEMONSTRATED STRENGTHS
            </div>
            {sc.strengths.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: "#14532D", lineHeight: 1.4, marginBottom: 3 }}>• {s}</div>
            ))}
          </div>

          <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "#B7791F", marginBottom: 6 }}>
              ⚠️ AREAS FOR TARGETED PRACTICE
            </div>
            {sc.weaknesses.map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: "#78350F", lineHeight: 1.4, marginBottom: 3 }}>• {w}</div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #E4E1DA" }}>
          <div>
            <div style={{ fontSize: 10, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>Recommended Next Step</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>{sc.recommendation}</div>
          </div>
          <button
            onClick={() => {
              setSessionStarted(false);
              setSessionCompleted(false);
              setSession(null);
              onExitInterview();
            }}
            style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
          >
            Back to Practice Arena ➔
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 3: ACTIVE LOCKED MULTI-QUESTION ROUND
  // ══════════════════════════════════════════════════════════════════════════
  if (!session) return null;
  const currQ = session.questions[session.currentQuestionIndex];
  const bq = currQ?.blueprintQuestion as any;
  const currentArea = currQ?.area || "live_coding";
  const badge = getAreaBadge(currentArea);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
      {/* Left Column: Current Question Interactive Arena */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        
        {/* Progress Header */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {session.questions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  padding: "4px 10px",
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  background: idx === session.currentQuestionIndex ? "#162A43" : q.status === "completed" || q.status === "submitted" ? "#EAF4EE" : "#F6F5F1",
                  color: idx === session.currentQuestionIndex ? "#FFFFFF" : q.status === "completed" || q.status === "submitted" ? "#2E7D5B" : "#667085",
                  border: `1px solid ${idx === session.currentQuestionIndex ? "#162A43" : "#E4E1DA"}`
                }}
              >
                Q{idx + 1}: {q.title.slice(0, 14)}... {q.status === "completed" || q.status === "submitted" ? "✓" : ""}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#667085" }}>
              Question {session.currentQuestionIndex + 1} of {session.questions.length}
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              color: timeLeft < 300 ? "#C24141" : "#162A43",
              background: "#F6F5F1",
              padding: "4px 8px",
              borderRadius: 6
            }}>
              ⏱ {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Question Details Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 4,
              fontWeight: 800,
              textTransform: "uppercase",
              background: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`
            }}>
              {badge.label}
            </span>
            <span style={{ fontSize: 11, color: "#667085" }}>
              Difficulty: <strong style={{ color: "#162A43" }}>{currQ.difficulty.toUpperCase()}</strong>
            </span>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: "4px 0 8px" }}>
            {currQ.title}
          </h3>

          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 10 }}>
            {bq?.prompt || bq?.scenario || currQ.title}
          </div>

          {/* Area-Specific Guidance Blocks */}
          {currentArea === "debugging" && bq?.observedSymptom && (
            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 7, padding: 10, marginBottom: 12 }}>
              <strong style={{ fontSize: 11, color: "#92400E", display: "block" }}>⚠️ OBSERVED FAILING BEHAVIOR:</strong>
              <div style={{ fontSize: 12, color: "#78350F" }}>{bq.observedSymptom}</div>
              {bq.failingTestCase && (
                <div style={{ fontSize: 11, color: "#78350F", marginTop: 4, fontFamily: "monospace" }}>
                  Failing input: {bq.failingTestCase.input} → Expected: {bq.failingTestCase.expected}
                </div>
              )}
            </div>
          )}

          {currentArea === "code_comprehension" && bq?.executionTraceTarget && (
            <div style={{ background: "#CCFBF1", border: "1px solid #99F6E4", borderRadius: 7, padding: 10, marginBottom: 12 }}>
              <strong style={{ fontSize: 11, color: "#0F766E", display: "block" }}>🔍 TRACE TARGET:</strong>
              <div style={{ fontSize: 12, color: "#134E4A" }}>{bq.executionTraceTarget}</div>
            </div>
          )}

          {currentArea === "adaptive_followup" && bq?.constraintsAdjustment && (
            <div style={{ background: "#FFE4E6", border: "1px solid #FECDD3", borderRadius: 7, padding: 10, marginBottom: 12 }}>
              <strong style={{ fontSize: 11, color: "#9F1239", display: "block" }}>🔮 CHANGED CONSTRAINTS:</strong>
              <div style={{ fontSize: 12, color: "#881337" }}>{bq.constraintsAdjustment}</div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            DYNAMIC INPUT AREA BASED ON QUESTION TYPE
            ══════════════════════════════════════════════════════════════════ */}

        {/* 1. LIVE CODING: Code Editor + Visible Runner */}
        {currentArea === "live_coding" && (
          <div style={{ background: "#162A43", border: "1px solid #233752", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111C2E", padding: "8px 16px", borderBottom: "1px solid #233752" }}>
              <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, fontFamily: "monospace" }}>
                solution.{selectedLanguage === "cpp" ? "cpp" : selectedLanguage === "python" ? "py" : selectedLanguage === "java" ? "java" : "js"}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleRunTests}
                  disabled={runningTests}
                  style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2E7D5B", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: runningTests ? "not-allowed" : "pointer" }}
                >
                  {runningTests ? "Compiling..." : "▶ Run Visible Tests"}
                </button>
                <button
                  onClick={handleSubmitCurrentAnswer}
                  disabled={evaluating}
                  style={{ padding: "5px 16px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: evaluating ? "not-allowed" : "pointer" }}
                >
                  {evaluating ? "Evaluating..." : "Evaluate Question ➔"}
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              rows={14}
              style={{ width: "100%", background: "transparent", color: "#FFFFFF", fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.5, padding: 14, border: "none", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* 2. DEBUGGING LAB: Buggy Code Viewer + Patch Editor + Root Cause */}
        {currentArea === "debugging" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>
                FAULTY CODE SNIPPET (EXAMINE FOR DEFECT):
              </div>
              <pre style={{ margin: 0, color: "#F87171", fontFamily: "monospace", fontSize: 12, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                {bq?.buggyCode}
              </pre>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                IDENTIFIED DEFECT LOCATION & ROOT CAUSE:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, marginBottom: 10 }}>
                <input
                  type="text"
                  placeholder="Bug line # (e.g. 14)"
                  value={debugLineNumber}
                  onChange={e => setDebugLineNumber(e.target.value)}
                  style={{ padding: 8, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12, outline: "none" }}
                />
                <input
                  type="text"
                  placeholder="Brief summary of root cause (e.g. boundary doesn't contract when low == high)"
                  value={debugRootCause}
                  onChange={e => setDebugRootCause(e.target.value)}
                  style={{ padding: 8, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12, outline: "none" }}
                />
              </div>

              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                CORRECTED PATCH CODE:
              </div>
              <textarea
                value={debugPatchCode}
                onChange={e => setDebugPatchCode(e.target.value)}
                placeholder="Paste or write the corrected code here..."
                rows={8}
                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA", fontFamily: "monospace", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={handleRunTests}
                  disabled={runningTests}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #E4E1DA", background: "#F6F5F1", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                >
                  {runningTests ? "Verifying..." : "▶ Test Patch"}
                </button>
                <button
                  onClick={handleSubmitCurrentAnswer}
                  disabled={evaluating}
                  style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                >
                  {evaluating ? "Saving..." : "Record Patch & Diagnosis ➔"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. CODE COMPREHENSION: Code Snippet + Prediction + Trace */}
        {currentArea === "code_comprehension" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>
                CODE SNIPPET TO TRACE (DO NOT EXECUTE):
              </div>
              <pre style={{ margin: 0, color: "#38BDF8", fontFamily: "monospace", fontSize: 12, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                {bq?.codeSnippet}
              </pre>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                PREDICTED OUTPUT / TERMINATION RESULT:
              </div>
              <input
                type="text"
                placeholder="e.g. Collision at step 4 on node 5 / [[1,2],[1],[2],[]]"
                value={comprehensionOutput}
                onChange={e => setComprehensionOutput(e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
              />

              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                STEP-BY-STEP VARIABLE TRACE & CALL-STACK EVOLUTION:
              </div>
              <textarea
                value={comprehensionTrace}
                onChange={e => setComprehensionTrace(e.target.value)}
                placeholder="Document pointer values or call stack frames at each iteration..."
                rows={6}
                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={handleSubmitCurrentAnswer}
                  disabled={evaluating}
                  style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                >
                  {evaluating ? "Saving..." : "Record Tracing Evidence ➔"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. TECHNICAL REASONING: Invariant Proof */}
        {currentArea === "technical_reasoning" && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
              INVARIANT DEFENSE & CORRECTNESS PROOF:
            </div>
            <textarea
              value={reasoningDefense}
              onChange={e => setReasoningDefense(e.target.value)}
              placeholder="State the mathematical invariant, monotonicity rule, or boundary contraction proof..."
              rows={9}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12.5, lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                onClick={handleSubmitCurrentAnswer}
                disabled={evaluating}
                style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                {evaluating ? "Saving..." : "Record Invariant Defense ➔"}
              </button>
            </div>
          </div>
        )}

        {/* 5. COMPLEXITY & OPTIMIZATION: Big-O Inputs + Trade-offs */}
        {currentArea === "complexity_optimization" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bq?.codeSnippet && (
              <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 12 }}>
                <pre style={{ margin: 0, color: "#A7F3D0", fontFamily: "monospace", fontSize: 12, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                  {bq.codeSnippet}
                </pre>
              </div>
            )}

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#162A43", display: "block", marginBottom: 4 }}>
                    TIME COMPLEXITY:
                  </label>
                  <select
                    value={complexityTime}
                    onChange={e => setComplexityTime(e.target.value)}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12, outline: "none" }}
                  >
                    <option value="O(1)">O(1) Constant</option>
                    <option value="O(log N)">O(log N) Logarithmic</option>
                    <option value="O(N)">O(N) Linear</option>
                    <option value="O(N log N)">O(N log N) Linearithmic</option>
                    <option value="O(N^2)">O(N^2) Quadratic</option>
                    <option value="O(N * log(Range))">O(N * log(Range)) Answer Space</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#162A43", display: "block", marginBottom: 4 }}>
                    AUXILIARY SPACE COMPLEXITY:
                  </label>
                  <select
                    value={complexitySpace}
                    onChange={e => setComplexitySpace(e.target.value)}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12, outline: "none" }}
                  >
                    <option value="O(1)">O(1) Constant Auxiliary</option>
                    <option value="O(log N)">O(log N) Stack Frame Space</option>
                    <option value="O(N)">O(N) Linear Auxiliary Space</option>
                    <option value="O(N^2)">O(N^2) Matrix Space</option>
                  </select>
                </div>
              </div>

              <label style={{ fontSize: 11, fontWeight: 800, color: "#162A43", display: "block", marginBottom: 4 }}>
                BOTTLENECK EXPLANATION & ARCHITECTURAL TRADE-OFFS:
              </label>
              <textarea
                value={complexityTradeOff}
                onChange={e => setComplexityTradeOff(e.target.value)}
                placeholder="Explain the dominant loop bottleneck and justify when sorting is preferred over hash maps..."
                rows={6}
                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={handleSubmitCurrentAnswer}
                  disabled={evaluating}
                  style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                >
                  {evaluating ? "Saving..." : "Record Complexity Proof ➔"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. ADAPTIVE FOLLOW-UP: Responsive Defense */}
        {currentArea === "adaptive_followup" && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
              ADAPTIVE TECHNICAL RESPONSE:
            </div>
            <textarea
              value={adaptiveDefense}
              onChange={e => setAdaptiveDefense(e.target.value)}
              placeholder="Explain how your solution adapts to altered constraints, memory limits, or duplicate keys..."
              rows={8}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 12.5, lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                onClick={handleSubmitCurrentAnswer}
                disabled={evaluating}
                style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                {evaluating ? "Saving..." : "Record Adaptive Defense ➔"}
              </button>
            </div>
          </div>
        )}

        {/* Execution Diagnostics Preview */}
        {testOutput && (
          <div style={{ background: "#FFFFFF", border: testOutput.passed ? "1px solid #C8E4D3" : "1px solid #F8C8C8", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: testOutput.passed ? "#2E7D5B" : "#C24141" }}>
                {testOutput.verdict || (testOutput.passed ? "PASSED" : "FAILED")}
              </span>
              <span style={{ fontSize: 11, color: "#667085" }}>
                Score: {testOutput.score}% ({testOutput.passedCount}/{testOutput.totalTests} tests)
              </span>
            </div>
            {testOutput.message && (
              <div style={{ fontSize: 11.5, color: "#374151", marginTop: 4 }}>{testOutput.message}</div>
            )}
          </div>
        )}

        {answerSavedNotice && (
          <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#065F46", fontWeight: 700 }}>
            {answerSavedNotice}
          </div>
        )}

        {/* Navigation Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: "#667085" }}>
            Answers autosave on advancing. Round questions are locked.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {session.currentQuestionIndex < session.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                disabled={evaluating}
                style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: "#162A43", color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Next Round ({session.currentQuestionIndex + 2} of {session.questions.length}) ➔
              </button>
            ) : (
              <button
                onClick={handleFinalizeInterview}
                disabled={evaluating}
                style={{ padding: "10px 24px", borderRadius: 7, border: "none", background: "#2E7D5B", color: "#FFFFFF", fontSize: 12.5, fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 4px rgba(46,125,91,0.25)" }}
              >
                {evaluating ? "Calculating 100-pt Rubric..." : "Finalize & Generate Dossier ➔"}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Proctoring & Multi-Area Round Tracker */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        
        {/* Proctoring Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 12, textAlign: "center", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
            <span>● PROCTORED ROUND</span>
            <span>{session.targetCompany} BAR</span>
          </div>
          <div style={{ width: "100%", height: 110, background: "#111C2E", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 11 }}>
            Webcam & Focus Telemetry Monitored
          </div>
          <div style={{ fontSize: 10, color: tabSwitches > 0 ? "#C24141" : "#667085", marginTop: 6 }}>
            Tab switches: {tabSwitches} {tabSwitches > 2 ? "(FLAGGED)" : ""}
          </div>
        </div>

        {/* Round Competency Tracker */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 14, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 8 }}>
            Interview Competency Blueprint
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {session.questions.map((q, idx) => {
              const qBadge = getAreaBadge(q.area);
              const isCurrent = idx === session.currentQuestionIndex;
              const isDone = q.status === "completed" || q.status === "submitted";

              return (
                <div
                  key={idx}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 6,
                    background: isCurrent ? "#F1F5F9" : isDone ? "#F0FDF4" : "#FFFFFF",
                    border: `1px solid ${isCurrent ? "#94A3B8" : isDone ? "#BBF7D0" : "#E2E8F0"}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? "#0F172A" : "#475467" }}>
                      Round {idx + 1}: {qBadge.label.split(" ")[0]} {q.title.slice(0, 16)}...
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isDone ? "#166534" : "#94A3B8" }}>
                      {isDone ? "SAVED ✓" : isCurrent ? "ACTIVE" : "PENDING"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
