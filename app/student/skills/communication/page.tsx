"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  COMMUNICATION_LESSONS,
  COMMUNICATION_QUESTION_BANK,
  CommunicationQuestion,
  CommunicationLesson,
  CommunicationCategory,
  CommunicationEvaluationReport,
  InterviewMessage
} from "@/lib/skills/communication-engine";

function CommunicationArenaContent() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [activeMode, setActiveMode] = useState<"learn" | "practice" | "coach" | "interview">("practice");

  // ── LEARN MODE STATE ──
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);

  // ── PRACTICE MODE STATE ──
  const [selectedCategory, setSelectedCategory] = useState<CommunicationCategory | "all">("all");
  const [currentQuestion, setCurrentQuestion] = useState<CommunicationQuestion>(COMMUNICATION_QUESTION_BANK[0]);
  const [practiceInputMode, setPracticeInputMode] = useState<"speech" | "typed">("typed");
  const [practiceText, setPracticeText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [practiceReport, setPracticeReport] = useState<CommunicationEvaluationReport | null>(null);

  // ── COACH MODE STATE ──
  const [coachQuestion, setCoachQuestion] = useState<CommunicationQuestion>(COMMUNICATION_QUESTION_BANK[0]);
  const [coachInputText, setCoachInputText] = useState("");
  const [coachReport, setCoachReport] = useState<CommunicationEvaluationReport | null>(null);
  const [coachEvaluating, setCoachEvaluating] = useState(false);

  // ── INTERVIEW MODE STATE ──
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewTurn, setInterviewTurn] = useState(0);
  const [interviewHistory, setInterviewHistory] = useState<InterviewMessage[]>([]);
  const [interviewCurrentInput, setInterviewCurrentInput] = useState("");
  const [interviewEvaluating, setInterviewEvaluating] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [interviewReport, setInterviewReport] = useState<CommunicationEvaluationReport | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Initialize candidate & query mode
  useEffect(() => {
    const queryCandidateId = searchParams.get("candidateId");
    const stored = queryCandidateId || localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);

    const queryMode = searchParams.get("mode") as any;
    if (queryMode && ["learn", "practice", "coach", "interview"].includes(queryMode)) {
      setActiveMode(queryMode);
    }

    // Initialize Web Speech API for voice recording
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = "en-IN";

        recog.onresult = (event: any) => {
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + " ";
          }
          if (activeMode === "interview") {
            setInterviewCurrentInput(fullTranscript.trim());
          } else {
            setPracticeText(fullTranscript.trim());
          }
        };

        recog.onerror = (err: any) => {
          console.warn("Speech recognition error:", err);
          setIsRecording(false);
        };

        recog.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, [searchParams, activeMode]);

  // Voice recording handlers
  const startRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Speech recognition is not available on this browser. Please use the typed response tab.");
      return;
    }
    if (activeMode === "interview") {
      setInterviewCurrentInput("");
    } else {
      setPracticeText("");
      setPracticeReport(null);
    }
    setRecordingSeconds(0);
    setIsRecording(true);

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Speech recognition already running or error:", e);
    }

    timerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Switch category in practice
  const handleCategoryChange = (cat: CommunicationCategory | "all") => {
    setSelectedCategory(cat);
    const pool = cat === "all" ? COMMUNICATION_QUESTION_BANK : COMMUNICATION_QUESTION_BANK.filter(q => q.category === cat);
    if (pool.length > 0) {
      const randomQ = pool[Math.floor(Math.random() * pool.length)];
      setCurrentQuestion(randomQ);
      setPracticeText("");
      setPracticeReport(null);
    }
  };

  // Next question in practice
  const handleNextPracticeQuestion = () => {
    const pool = selectedCategory === "all"
      ? COMMUNICATION_QUESTION_BANK
      : COMMUNICATION_QUESTION_BANK.filter(q => q.category === selectedCategory);
    const otherQuestions = pool.filter(q => q.id !== currentQuestion.id);
    const nextQ = otherQuestions.length > 0
      ? otherQuestions[Math.floor(Math.random() * otherQuestions.length)]
      : pool[0];
    setCurrentQuestion(nextQ);
    setPracticeText("");
    setPracticeReport(null);
  };

  // Submit practice response for evidence-based evaluation
  const handleSubmitPractice = async () => {
    if (isRecording) stopRecording();
    const text = practiceText.trim();
    if (!text || text.length < 15) {
      alert("Please provide a meaningful answer of at least 15 characters before submitting.");
      return;
    }

    setEvaluating(true);
    setPracticeReport(null);

    try {
      const res = await fetch("/api/skills/communication-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          candidateId,
          questionId: currentQuestion.id,
          spokenText: text,
          durationSeconds: recordingSeconds || 45
        })
      });

      const data = await res.json();
      if (data.report) {
        setPracticeReport(data.report);
      }
    } catch (err) {
      console.error("Evaluation submission error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  // Submit Coach analysis
  const handleCoachAnalyze = async () => {
    const text = coachInputText.trim();
    if (!text || text.length < 15) {
      alert("Please provide a response of at least 15 characters for the coach to analyze.");
      return;
    }

    setCoachEvaluating(true);
    setCoachReport(null);

    try {
      const res = await fetch("/api/skills/communication-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          candidateId,
          questionId: coachQuestion.id,
          spokenText: text,
          durationSeconds: 60
        })
      });

      const data = await res.json();
      if (data.report) {
        setCoachReport(data.report);
      }
    } catch (err) {
      console.error("Coach analysis error:", err);
    } finally {
      setCoachEvaluating(false);
    }
  };

  // ── MOCK INTERVIEW ACTIONS ──
  const startNewInterview = () => {
    setInterviewStarted(true);
    setInterviewFinished(false);
    setInterviewTurn(0);
    setInterviewReport(null);
    setInterviewCurrentInput("");
    setInterviewHistory([
      {
        speaker: "interviewer",
        text: "Hello! Welcome to your technical communication screening. To start, walk me through your engineering background and tell me about yourself."
      }
    ]);
  };

  const handleSendInterviewAnswer = async () => {
    if (isRecording) stopRecording();
    const answer = interviewCurrentInput.trim();
    if (!answer) return;

    const updatedHistory: InterviewMessage[] = [
      ...interviewHistory,
      { speaker: "candidate", text: answer }
    ];
    setInterviewHistory(updatedHistory);
    setInterviewCurrentInput("");
    setInterviewEvaluating(true);

    try {
      const nextTurnNum = interviewTurn + 1;
      setInterviewTurn(nextTurnNum);

      const res = await fetch("/api/skills/communication-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_next",
          candidateId,
          interviewHistory: updatedHistory,
          spokenText: answer,
          turnNumber: nextTurnNum
        })
      });

      const data = await res.json();
      if (data.interviewerText) {
        setInterviewHistory(prev => [
          ...prev,
          { speaker: "interviewer", text: data.interviewerText }
        ]);

        if (data.isFinalTurn || nextTurnNum >= 3) {
          finishInterview(updatedHistory);
        }
      }
    } catch (err) {
      console.error("Interview turn error:", err);
    } finally {
      setInterviewEvaluating(false);
    }
  };

  const finishInterview = async (historyToFinish?: InterviewMessage[]) => {
    setInterviewEvaluating(true);
    const hist = historyToFinish || interviewHistory;

    try {
      const res = await fetch("/api/skills/communication-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_finish",
          candidateId,
          interviewHistory: hist
        })
      });

      const data = await res.json();
      if (data.report) {
        setInterviewReport(data.report);
        setInterviewFinished(true);
      }
    } catch (err) {
      console.error("Interview finish error:", err);
    } finally {
      setInterviewEvaluating(false);
    }
  };

  const activeLesson = COMMUNICATION_LESSONS[selectedLessonIdx] || COMMUNICATION_LESSONS[0];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "14px 24px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Link href="/student/skills" style={{ color: "#667085", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "#98A2B3" }}>/</span>
              <span style={{ color: "#356AE6", fontSize: 12, fontWeight: 700 }}>Domain: Spoken English & Articulation</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🎙️</span>
              <span>Communication & Spoken English Arena</span>
            </h1>
          </div>

          {/* 4 PRIMARY MODES */}
          <div style={{ display: "flex", background: "#F6F5F1", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA", gap: 2 }}>
            <button
              onClick={() => setActiveMode("learn")}
              style={{
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: activeMode === "learn" ? "#162A43" : "transparent",
                color: activeMode === "learn" ? "#FFFFFF" : "#667085",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              💡 Learn
            </button>
            <button
              onClick={() => setActiveMode("practice")}
              style={{
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: activeMode === "practice" ? "#162A43" : "transparent",
                color: activeMode === "practice" ? "#FFFFFF" : "#667085",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              🛠️ Practice
            </button>
            <button
              onClick={() => setActiveMode("coach")}
              style={{
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: activeMode === "coach" ? "#162A43" : "transparent",
                color: activeMode === "coach" ? "#FFFFFF" : "#667085",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              🎓 Coach
            </button>
            <button
              onClick={() => setActiveMode("interview")}
              style={{
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: activeMode === "interview" ? "#356AE6" : "transparent",
                color: activeMode === "interview" ? "#FFFFFF" : "#667085",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              🎙️ Mock Interview
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 20px" }}>

        {/* ════════════════════════════════════════════════════════════════
            1. LEARN MODE: PRACTICAL PLACEMENT LESSONS
            ════════════════════════════════════════════════════════════════ */}
        {activeMode === "learn" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#162A43", margin: "0 0 6px" }}>
                Placement Communication Playbook
              </h2>
              <p style={{ color: "#667085", fontSize: 13, margin: 0 }}>
                10 concise lessons on how to articulate technical engineering choices, handle HR questions, and eliminate filler words.
              </p>
            </div>

            {/* Lesson Selector Pills */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 20 }}>
              {COMMUNICATION_LESSONS.map((lesson, idx) => {
                const isSelected = idx === selectedLessonIdx;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLessonIdx(idx)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 7,
                      border: isSelected ? "1px solid #162A43" : "1px solid #E4E1DA",
                      background: isSelected ? "#162A43" : "#FFFFFF",
                      color: isSelected ? "#FFFFFF" : "#475467",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: "0 1px 2px rgba(16,24,40,0.03)"
                    }}
                  >
                    {lesson.title}
                  </button>
                );
              })}
            </div>

            {/* Active Lesson Card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "26px", boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
                CONCEPT
              </div>
              <p style={{ fontSize: 15, color: "#17191C", lineHeight: 1.6, margin: "0 0 24px", fontWeight: 500 }}>
                {activeLesson.concept}
              </p>

              {/* Weak vs Improved Comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div style={{ background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 8, padding: "16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#C24141", textTransform: "uppercase", marginBottom: 6 }}>
                    ✗ Weak Response (What recruiters dislike)
                  </div>
                  <div style={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.5, fontStyle: "italic" }}>
                    &ldquo;{activeLesson.weakExample}&rdquo;
                  </div>
                </div>

                <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: "16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", textTransform: "uppercase", marginBottom: 6 }}>
                    ✓ Improved Response (What gets you hired)
                  </div>
                  <div style={{ fontSize: 13, color: "#14532D", lineHeight: 1.5 }}>
                    &ldquo;{activeLesson.improvedExample}&rdquo;
                  </div>
                </div>
              </div>

              {/* Why It Works */}
              <div style={{ background: "#F6F5F1", borderRadius: 8, padding: "16px 20px", marginBottom: 24, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 8 }}>
                  WHY IT WORKS
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#475467", fontSize: 13, lineHeight: 1.6 }}>
                  {activeLesson.whyItWorks.map((pt, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{pt}</li>
                  ))}
                </ul>
              </div>

              {/* Try It Call-to-Action */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: "16px 20px", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 2 }}>
                    TRY IT NOW
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>
                    &ldquo;{activeLesson.tryItQuestion.prompt}&rdquo;
                  </div>
                </div>
                <button
                  onClick={() => {
                    const matchedQ = COMMUNICATION_QUESTION_BANK.find(q => q.id === activeLesson.tryItQuestion.questionId) || COMMUNICATION_QUESTION_BANK[0];
                    setCurrentQuestion(matchedQ);
                    setActiveMode("practice");
                    setPracticeText("");
                    setPracticeReport(null);
                  }}
                  style={{
                    padding: "9px 18px",
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
                  Practice This Question ➔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            2. PRACTICE MODE: ANSWER REAL INTERVIEW QUESTIONS
            ════════════════════════════════════════════════════════════════ */}
        {activeMode === "practice" && (
          <div>
            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 18 }}>
              {[
                { id: "all", label: "All Questions (40+)" },
                { id: "self_intro", label: "Self Introduction" },
                { id: "project", label: "Project Explanation" },
                { id: "hr", label: "HR & Motivation" },
                { id: "behavioral", label: "Behavioral" },
                { id: "situational", label: "Situational" },
                { id: "technical", label: "Technical Concepts" },
                { id: "client", label: "Client Briefings" },
                { id: "corporate", label: "Corporate Updates" }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id as any)}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 7,
                    border: selectedCategory === cat.id ? "1px solid #162A43" : "1px solid #E4E1DA",
                    background: selectedCategory === cat.id ? "#162A43" : "#FFFFFF",
                    color: selectedCategory === cat.id ? "#FFFFFF" : "#667085",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 1px 2px rgba(16,24,40,0.02)"
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Question Workspace */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "26px", marginBottom: 24, boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
              {/* Question Meta */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, padding: "3px 9px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 5, fontWeight: 700 }}>
                    {currentQuestion.categoryLabel}
                  </span>
                  <span style={{ fontSize: 11, padding: "3px 9px", background: "#F6F5F1", color: "#667085", border: "1px solid #E4E1DA", borderRadius: 5, fontWeight: 600 }}>
                    {currentQuestion.topic}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#356AE6", fontWeight: 700 }}>
                  ⏱️ Target: {currentQuestion.targetDurationSeconds} seconds
                </div>
              </div>

              {/* Question Statement */}
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#162A43", margin: "0 0 12px", lineHeight: 1.4 }}>
                &ldquo;{currentQuestion.question}&rdquo;
              </h2>

              {/* Framework Hint */}
              <div style={{ fontSize: 12, color: "#475467", background: "#F6F5F1", padding: "10px 14px", borderRadius: 7, marginBottom: 20, border: "1px solid #E4E1DA" }}>
                <strong style={{ color: "#162A43" }}>Strategy:</strong> {currentQuestion.idealFramework} • {currentQuestion.tips}
              </div>

              {/* Input Mode Selector */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => setPracticeInputMode("typed")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: practiceInputMode === "typed" ? "1px solid #162A43" : "1px solid #E4E1DA",
                    background: practiceInputMode === "typed" ? "#162A43" : "#FFFFFF",
                    color: practiceInputMode === "typed" ? "#FFFFFF" : "#667085",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ⌨️ Type Answer
                </button>
                <button
                  onClick={() => setPracticeInputMode("speech")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: practiceInputMode === "speech" ? "1px solid #162A43" : "1px solid #E4E1DA",
                    background: practiceInputMode === "speech" ? "#162A43" : "#FFFFFF",
                    color: practiceInputMode === "speech" ? "#FFFFFF" : "#667085",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  🎙️ Speak Answer (Web Speech)
                </button>
              </div>

              {/* Speech Mode Interface */}
              {practiceInputMode === "speech" && (
                <div style={{ padding: "18px", borderRadius: 8, background: "#F6F5F1", border: "1px solid #E4E1DA", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 7,
                            border: "none",
                            background: "#C24141",
                            color: "#FFFFFF",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFFFFF" }} />
                          Start Voice Recording
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 7,
                            border: "none",
                            background: "#B7791F",
                            color: "#FFFFFF",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <span style={{ width: 8, height: 8, background: "#FFFFFF" }} />
                          Stop Recording ({recordingSeconds}s)
                        </button>
                      )}
                      {isRecording && (
                        <span style={{ fontSize: 12, color: "#C24141", fontWeight: 600 }}>
                          ● Recording speech in progress...
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#667085" }}>
                      Words captured: {practiceText.trim().split(/\s+/).filter(Boolean).length}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: practiceText ? "#17191C" : "#98A2B3", minHeight: 70, lineHeight: 1.5, background: "#FFFFFF", padding: "12px 14px", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                    {practiceText || "Your live transcribed speech will appear here. Press 'Start Voice Recording' and answer naturally."}
                  </div>
                </div>
              )}

              {/* Typed Input Area */}
              {practiceInputMode === "typed" && (
                <div style={{ marginBottom: 18 }}>
                  <textarea
                    rows={5}
                    value={practiceText}
                    onChange={e => setPracticeText(e.target.value)}
                    placeholder="Type your response here as you would articulate it in an actual technical screening or HR round..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 7,
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      color: "#17191C",
                      fontSize: 13,
                      lineHeight: 1.6,
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, fontSize: 11, color: "#667085" }}>
                    <span>Word Count: {practiceText.trim().split(/\s+/).filter(Boolean).length} words</span>
                    <span>Aim for ~80–140 words for a crisp 60s pitch</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderTop: "1px solid #E4E1DA", paddingTop: 16 }}>
                <button
                  onClick={handleNextPracticeQuestion}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 7,
                    border: "1px solid #E4E1DA",
                    background: "#FFFFFF",
                    color: "#475467",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Skip to Another Question ➔
                </button>

                <button
                  onClick={handleSubmitPractice}
                  disabled={evaluating || !practiceText.trim()}
                  style={{
                    padding: "9px 24px",
                    borderRadius: 7,
                    border: "none",
                    background: evaluating || !practiceText.trim() ? "#98A2B3" : "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: evaluating || !practiceText.trim() ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(16,24,40,0.05)"
                  }}
                >
                  {evaluating ? "⚡ Analyzing Speech Evidence..." : "Submit Answer for Review ➔"}
                </button>
              </div>
            </div>

            {/* ── EVIDENCE-FIRST PRACTICE EVALUATION REPORT ── */}
            {practiceReport && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "26px", marginBottom: 28, boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
                {/* Header Verdict */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12, borderBottom: "1px solid #E4E1DA", paddingBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, padding: "3px 9px", background: practiceReport.verdict === "Strong" ? "#EAF4EE" : "#FEF7ED", color: practiceReport.verdict === "Strong" ? "#2E7D5B" : "#B7791F", border: `1px solid ${practiceReport.verdict === "Strong" ? "#C8E4D3" : "#F8D8A7"}`, borderRadius: 5, fontWeight: 800, letterSpacing: 0.8 }}>
                      EVIDENCE-GROUNDED VERDICT: {practiceReport.verdict.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: "6px 0 0", color: "#162A43" }}>
                      Your Communication Review
                    </h3>
                    <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
                      {practiceReport.summary}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: practiceReport.overallScore >= 75 ? "#2E7D5B" : practiceReport.overallScore >= 60 ? "#B7791F" : "#C24141" }}>
                      {practiceReport.overallScore}<span style={{ fontSize: 16, color: "#98A2B3" }}>/100</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#667085" }}>
                      {practiceReport.totalWords} words • ~{practiceReport.speechPaceWpm || 120} WPM
                    </div>
                  </div>
                </div>

                {/* Dimension Scores */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 22 }}>
                  {practiceReport.dimensions.map((dim, i) => (
                    <div key={i} style={{ background: "#F6F5F1", borderRadius: 8, padding: "12px 14px", border: "1px solid #E4E1DA" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>{dim.dimension}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: dim.score >= 75 ? "#2E7D5B" : "#B7791F" }}>{dim.score}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#667085", lineHeight: 1.4 }}>
                        {dim.reason}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evidence: What Worked vs What Can Improve */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
                  {/* Strengths */}
                  <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: "18px" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D5B", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>✓</span> WHAT WORKED (VERIFIED FROM YOUR WORDS)
                    </div>
                    {practiceReport.strengths.length > 0 ? (
                      practiceReport.strengths.map((s, idx) => (
                        <div key={idx} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#14532D", marginBottom: 3 }}>
                            {s.claim}
                          </div>
                          {s.evidence && (
                            <div style={{ fontSize: 12, color: "#166534", background: "#FFFFFF", padding: "6px 10px", borderRadius: 6, border: "1px solid #C8E4D3", marginBottom: 3, fontStyle: "italic" }}>
                              &ldquo;{s.evidence}&rdquo;
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "#15803D" }}>
                            {s.reason}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12, color: "#667085" }}>Response was too brief to verify distinct positive traits.</div>
                    )}
                  </div>

                  {/* Improvements */}
                  <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: "18px" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#B7791F", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>⚠</span> WHAT TO IMPROVE (GROUNDED GAPS)
                    </div>
                    {practiceReport.weaknesses.length > 0 ? (
                      practiceReport.weaknesses.map((w, idx) => (
                        <div key={idx} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#78350F", marginBottom: 3 }}>
                            {w.claim}
                          </div>
                          {w.evidence && (
                            <div style={{ fontSize: 12, color: "#92400E", background: "#FFFFFF", padding: "6px 10px", borderRadius: 6, border: "1px solid #F8D8A7", marginBottom: 3, fontStyle: "italic" }}>
                              &ldquo;{w.evidence}&rdquo;
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "#A16207", marginBottom: 2 }}>
                            {w.reason}
                          </div>
                          {w.recommendation && (
                            <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 600 }}>
                              Fix: {w.recommendation}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12, color: "#2E7D5B" }}>No major communication anti-patterns detected. Excellent structure!</div>
                    )}
                  </div>
                </div>

                {/* Vocal Fillers (Only shown if detected) */}
                {practiceReport.detectedFillers.length > 0 && (
                  <div style={{ background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 8, padding: "14px 18px", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#C24141", textTransform: "uppercase", marginBottom: 6 }}>
                      VOCAL FILLERS DETECTED IN YOUR TRANSCRIPT
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      {practiceReport.detectedFillers.map((f, i) => (
                        <span key={i} style={{ padding: "4px 10px", borderRadius: 5, background: "#FFFFFF", border: "1px solid #F8C8C8", color: "#C24141", fontSize: 12, fontWeight: 700 }}>
                          &ldquo;{f.word}&rdquo; ({f.count}x)
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#7F1D1D" }}>
                      Replace these filler hesitations with a 1-second deliberate silent breath.
                    </div>
                  </div>
                )}

                {/* Bottom CTA Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => {
                      setPracticeText("");
                      setPracticeReport(null);
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 7,
                      border: "1px solid #E4E1DA",
                      background: "#FFFFFF",
                      color: "#475467",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Try Again on Same Question ↺
                  </button>

                  <button
                    onClick={handleNextPracticeQuestion}
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
                    Next Question ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            3. COACH MODE: IMPROVE A SPECIFIC ANSWER
            ════════════════════════════════════════════════════════════════ */}
        {activeMode === "coach" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#162A43", margin: "0 0 6px" }}>
                Answer Improvement Coach
              </h2>
              <p style={{ color: "#667085", fontSize: 13, margin: 0 }}>
                Paste or speak your current draft answer to see what is already working and how to refine it into an executive-level response.
              </p>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "26px", marginBottom: 24, boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
              {/* Question selector */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  SELECT QUESTION TO REFINE:
                </label>
                <select
                  value={coachQuestion.id}
                  onChange={e => {
                    const q = COMMUNICATION_QUESTION_BANK.find(item => item.id === e.target.value) || COMMUNICATION_QUESTION_BANK[0];
                    setCoachQuestion(q);
                    setCoachReport(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 7,
                    background: "#F6F5F1",
                    border: "1px solid #E4E1DA",
                    color: "#17191C",
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                >
                  {COMMUNICATION_QUESTION_BANK.map(q => (
                    <option key={q.id} value={q.id}>
                      [{q.categoryLabel}] {q.question}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475467", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  YOUR DRAFT ANSWER:
                </label>
                <textarea
                  rows={5}
                  value={coachInputText}
                  onChange={e => setCoachInputText(e.target.value)}
                  placeholder="Paste or write your answer here. e.g.: 'I'm pursuing BTech in Computer Science and I built Cognalyze to automate resumes...'"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 7,
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    color: "#17191C",
                    fontSize: 13,
                    lineHeight: 1.6,
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>

              <button
                onClick={handleCoachAnalyze}
                disabled={coachEvaluating || !coachInputText.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: 7,
                  border: "none",
                  background: coachEvaluating || !coachInputText.trim() ? "#98A2B3" : "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: coachEvaluating || !coachInputText.trim() ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.05)"
                }}
              >
                {coachEvaluating ? "⚡ Inspecting Answer Evidence..." : "Analyze & Improve My Answer ➔"}
              </button>
            </div>

            {/* Coach Report */}
            {coachReport && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "24px", marginBottom: 28, boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginBottom: 14 }}>
                  COACH EVIDENCE AUDIT:
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: "16px" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D5B", marginBottom: 8 }}>
                      ✓ WHAT IS ALREADY WORKING:
                    </div>
                    {coachReport.strengths.map((s, idx) => (
                      <div key={idx} style={{ marginBottom: 10, fontSize: 12, color: "#14532D" }}>
                        <strong style={{ color: "#166534" }}>• {s.claim}:</strong>
                        <div style={{ color: "#15803D", fontStyle: "italic", marginTop: 2, background: "#FFFFFF", padding: "4px 8px", borderRadius: 5, border: "1px solid #C8E4D3" }}>&ldquo;{s.evidence}&rdquo;</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: "16px" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#B7791F", marginBottom: 8 }}>
                      ⚠ HOW TO ELEVATE THIS ANSWER:
                    </div>
                    {coachReport.weaknesses.map((w, idx) => (
                      <div key={idx} style={{ marginBottom: 10, fontSize: 12, color: "#78350F" }}>
                        <strong style={{ color: "#92400E" }}>• {w.claim}:</strong>
                        <div style={{ color: "#A16207", fontStyle: "italic", marginTop: 2, background: "#FFFFFF", padding: "4px 8px", borderRadius: 5, border: "1px solid #F8D8A7" }}>&ldquo;{w.evidence}&rdquo;</div>
                        <div style={{ color: "#356AE6", marginTop: 3, fontWeight: 600 }}>→ Fix: {w.recommendation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            4. INTERVIEW MODE: CONVERSATIONAL MOCK INTERVIEW
            ════════════════════════════════════════════════════════════════ */}
        {activeMode === "interview" && (
          <div>
            {!interviewStarted ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🎙️</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#162A43", margin: "0 0 10px" }}>
                  Interactive Placement Mock Interview
                </h2>
                <p style={{ color: "#667085", fontSize: 14, maxWidth: 600, margin: "0 auto 24px", lineHeight: 1.6 }}>
                  Simulates a genuine multi-turn placement screening round. The interviewer will listen to your answers and ask dynamic follow-ups based directly on what you say. Detailed evaluation is presented at the end.
                </p>

                <button
                  onClick={startNewInterview}
                  style={{
                    padding: "11px 26px",
                    borderRadius: 7,
                    border: "none",
                    background: "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(16,24,40,0.05)"
                  }}
                >
                  Start Mock Interview Session ➔
                </button>
              </div>
            ) : !interviewFinished ? (
              <div>
                {/* Active Interview Conversation Container */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid #E4E1DA", paddingBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2E7D5B" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>Senior Engineering Hiring Manager</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>
                      Turn {interviewTurn + 1} of 3
                    </span>
                  </div>

                  {/* Message History */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 380, overflowY: "auto", paddingRight: 4, marginBottom: 20 }}>
                    {interviewHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: msg.speaker === "candidate" ? "flex-end" : "flex-start",
                          maxWidth: "80%",
                          background: msg.speaker === "candidate" ? "#EFF4FE" : "#F6F5F1",
                          border: msg.speaker === "candidate" ? "1px solid #D2E0FB" : "1px solid #E4E1DA",
                          borderRadius: 8,
                          padding: "12px 16px"
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 800, color: msg.speaker === "candidate" ? "#356AE6" : "#162A43", textTransform: "uppercase", marginBottom: 4 }}>
                          {msg.speaker === "candidate" ? "You (Candidate)" : "Interviewer"}
                        </div>
                        <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5 }}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {interviewEvaluating && (
                      <div style={{ alignSelf: "flex-start", fontSize: 12, color: "#667085", fontStyle: "italic" }}>
                        Interviewer is reflecting on your answer and preparing next question...
                      </div>
                    )}
                  </div>

                  {/* Candidate Input Area */}
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          disabled={interviewEvaluating}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: "#C24141",
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: interviewEvaluating ? "not-allowed" : "pointer"
                          }}
                        >
                          🎙️ Speak Answer
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: "#B7791F",
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Stop Recording ({recordingSeconds}s)
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={3}
                      value={interviewCurrentInput}
                      onChange={e => setInterviewCurrentInput(e.target.value)}
                      placeholder="Type or speak your answer to the interviewer..."
                      disabled={interviewEvaluating}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 7,
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        color: "#17191C",
                        fontSize: 13,
                        lineHeight: 1.5,
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        resize: "vertical"
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      <button
                        onClick={() => finishInterview()}
                        disabled={interviewEvaluating || interviewHistory.length < 2}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 6,
                          border: "1px solid #E4E1DA",
                          background: "#FFFFFF",
                          color: "#667085",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: interviewEvaluating ? "not-allowed" : "pointer"
                        }}
                      >
                        Finish & View Diagnostic Report ➔
                      </button>

                      <button
                        onClick={handleSendInterviewAnswer}
                        disabled={interviewEvaluating || !interviewCurrentInput.trim()}
                        style={{
                          padding: "9px 20px",
                          borderRadius: 7,
                          border: "none",
                          background: interviewEvaluating || !interviewCurrentInput.trim() ? "#98A2B3" : "#356AE6",
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: interviewEvaluating || !interviewCurrentInput.trim() ? "not-allowed" : "pointer"
                        }}
                      >
                        Send Answer ➔
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── COMPREHENSIVE END-OF-INTERVIEW REPORT ── */
              interviewReport && (
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "26px", marginBottom: 28, boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid #E4E1DA", paddingBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 10, padding: "3px 9px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 5, fontWeight: 800, letterSpacing: 0.8 }}>
                        INTERVIEW READINESS: {interviewReport.verdict.toUpperCase()}
                      </span>
                      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "6px 0 0", color: "#162A43" }}>
                        Mock Interview Diagnostic Report
                      </h2>
                      <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
                        {interviewReport.summary}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 36, fontWeight: 800, color: interviewReport.overallScore >= 75 ? "#2E7D5B" : "#B7791F" }}>
                        {interviewReport.overallScore}<span style={{ fontSize: 16, color: "#98A2B3" }}>/100</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#667085" }}>
                        Multi-Turn Candidate Speech Evidence
                      </div>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                    {interviewReport.dimensions.map((d, i) => (
                      <div key={i} style={{ background: "#F6F5F1", borderRadius: 7, padding: "12px", border: "1px solid #E4E1DA" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>{d.dimension}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: d.score >= 75 ? "#2E7D5B" : "#B7791F" }}>{d.score}%</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#667085" }}>{d.reason}</div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths vs Growth Areas */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: "16px" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D5B", marginBottom: 10 }}>
                        ✓ DEMONSTRATED STRENGTHS (EXACT QUOTES)
                      </div>
                      {interviewReport.strengths.map((s, idx) => (
                        <div key={idx} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#14532D" }}>{s.claim}</div>
                          {s.evidence && (
                            <div style={{ fontSize: 12, color: "#166534", background: "#FFFFFF", padding: "4px 8px", borderRadius: 5, border: "1px solid #C8E4D3", margin: "4px 0", fontStyle: "italic" }}>
                              &ldquo;{s.evidence}&rdquo;
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "#15803D" }}>{s.reason}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: "16px" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#B7791F", marginBottom: 10 }}>
                        ⚠ SPECIFIC GROWTH AREAS
                      </div>
                      {interviewReport.weaknesses.map((w, idx) => (
                        <div key={idx} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#78350F" }}>{w.claim}</div>
                          {w.evidence && (
                            <div style={{ fontSize: 12, color: "#92400E", background: "#FFFFFF", padding: "4px 8px", borderRadius: 5, border: "1px solid #F8D8A7", margin: "4px 0", fontStyle: "italic" }}>
                              &ldquo;{w.evidence}&rdquo;
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "#A16207" }}>{w.reason}</div>
                          {w.recommendation && (
                            <div style={{ fontSize: 11, color: "#356AE6", marginTop: 2 }}>→ Fix: {w.recommendation}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      onClick={startNewInterview}
                      style={{
                        padding: "10px 22px",
                        borderRadius: 7,
                        border: "none",
                        background: "#356AE6",
                        color: "#FFFFFF",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Start Fresh Mock Interview ➔
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default function CommunicationArenaPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#667085" }}>Loading Communication Arena...</div>}>
      <CommunicationArenaContent />
    </React.Suspense>
  );
}
