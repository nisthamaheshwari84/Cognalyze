"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CSInterviewQuestion, SEED_CS_INTERVIEW_QUESTIONS } from "@/lib/skill-hub-store";

export default function CSInterviewPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [questions, setQuestions] = useState<CSInterviewQuestion[]>(SEED_CS_INTERVIEW_QUESTIONS);
  const [mode, setMode] = useState<"interview" | "bank">("interview");
  const [targetCompanyTrack, setTargetCompanyTrack] = useState<"service" | "product">("service");
  
  // Bank Mode state
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(SEED_CS_INTERVIEW_QUESTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingFresh, setGeneratingFresh] = useState(false);

  // Live Interview Simulation state
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<CSInterviewQuestion[]>([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [roundEvaluations, setRoundEvaluations] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins per question

  // Audio & Voice Speech Synthesis
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Candidate Answer State
  const [answerMode, setAnswerMode] = useState<"code" | "speech">("code");
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  // Speech output helper (Interviewer speaks aloud)
  const speakText = (text: string) => {
    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.95; // slightly deeper interviewer tone
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB") || v.lang.includes("en-IN"));
      if (englishVoice) utterance.voice = englishVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);

    // Initialize Web Speech API for voice dictation
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = "en-IN";

        recog.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + " ";
          }
          setCandidateAnswer(transcript.trim());
        };

        recog.onerror = () => setIsRecording(false);
        recog.onend = () => setIsRecording(false);
        recognitionRef.current = recog;
      }
    }
  }, []);

  // Timer countdown during live mock interview
  useEffect(() => {
    let timer: any = null;
    if (interviewStarted && !roundCompleted && !evalResult && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [interviewStarted, roundCompleted, evalResult, timeLeft]);

  // Filtered list for Bank Mode
  const filteredQuestions = questions.filter(q => {
    const matchDomain = selectedDomain === "all" || q.domain === selectedDomain;
    const matchSearch = !searchQuery || q.topic.toLowerCase().includes(searchQuery.toLowerCase()) || q.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDomain && matchSearch;
  });

  const activeQuestion = mode === "interview" && interviewStarted
    ? interviewQuestions[currentRoundIdx] || questions[0]
    : questions.find(q => q.id === selectedQuestionId) || filteredQuestions[0] || questions[0];

  // Start Live Mock Interview Simulation
  const handleStartLiveInterview = (track: "service" | "product") => {
    setTargetCompanyTrack(track);
    setMode("interview");
    
    // Pick 3 high-yield questions across distinct domains: DBMS, OOP, and OS/Networks
    const dbmsQ = questions.find(q => q.domain === "dbms") || questions[0];
    const oopQ = questions.find(q => q.domain === "oop") || questions[1];
    const sysQ = questions.find(q => q.domain === "os" || q.domain === "networks") || questions[2];
    
    const picked = [dbmsQ, oopQ, sysQ];
    setInterviewQuestions(picked);
    setCurrentRoundIdx(0);
    setRoundCompleted(false);
    setRoundEvaluations([]);
    setInterviewStarted(true);
    setCandidateAnswer("");
    setEvalResult(null);
    setTimeLeft(300);

    const greeting = `Welcome to your Technical Screening interview. I am Alex, and I will be assessing your CS Fundamentals and problem solving today. We have 3 technical rounds prepared. Let's begin with Question 1: ${picked[0].topic}. ${picked[0].question}`;
    speakText(greeting);
  };

  const handleNextInterviewQuestion = () => {
    if (currentRoundIdx + 1 < interviewQuestions.length) {
      const nextIdx = currentRoundIdx + 1;
      setCurrentRoundIdx(nextIdx);
      setCandidateAnswer("");
      setEvalResult(null);
      setTimeLeft(300);
      const nextQ = interviewQuestions[nextIdx];
      speakText(`Next question. Domain: ${nextQ.domain.toUpperCase()}. ${nextQ.question}`);
    } else {
      setRoundCompleted(true);
      speakText("That concludes all 3 technical questions. Let's compile your final hiring assessment dossier.");
    }
  };

  const handleGenerateFreshQuestion = async () => {
    setGeneratingFresh(true);
    try {
      const res = await fetch("/api/skills/cs-interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: selectedDomain === "all" ? "dbms" : selectedDomain,
          companyTag: targetCompanyTrack === "service" ? "TCS Digital / Infosys" : "Amazon SDE",
          difficulty: "medium"
        })
      });
      const data = await res.json();
      if (data.question) {
        setQuestions(prev => [data.question, ...prev]);
        setSelectedQuestionId(data.question.id);
        setCandidateAnswer("");
        setEvalResult(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingFresh(false);
    }
  };

  const startRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Microphone speech recognition is not available in this browser. Please use the code/text editor.");
      return;
    }
    setCandidateAnswer("");
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn(e);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const handleSubmit = async () => {
    if (isRecording) stopRecording();
    if (!candidateAnswer.trim()) {
      alert("Please provide an answer or code snippet before submitting.");
      return;
    }

    setEvaluating(true);
    setEvalResult(null);

    try {
      const res = await fetch("/api/skills/cs-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          candidateAnswer,
          candidateId
        })
      });

      const data = await res.json();
      if (data.evaluation) {
        setEvalResult(data.evaluation);
        if (mode === "interview") {
          setRoundEvaluations(prev => [...prev, { question: activeQuestion, evaluation: data.evaluation }]);
        }
        // Speak feedback snippet
        speakText(`Alex's verdict: ${data.evaluation.verdict}. ${data.evaluation.feedback.split('.')[0]}`);
      }
    } catch (err) {
      console.error("CS technical submission error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  // Calculate composite interview score
  const avgScore = roundEvaluations.length > 0
    ? Math.round(roundEvaluations.reduce((acc, curr) => acc + (curr.evaluation?.score || 70), 0) / roundEvaluations.length)
    : 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── TOP NAV BAR ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(16px)", padding: "16px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Link href="/student/skills" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>CS Technical Interview Arena</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              💻 Live Technical Screening with Lead Architect Alex
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Audio Voice Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (!next && typeof window !== "undefined") window.speechSynthesis?.cancel();
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: soundEnabled ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                background: soundEnabled ? "rgba(56,189,248,0.15)" : "transparent",
                color: soundEnabled ? "#38bdf8" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>{soundEnabled ? "🔊" : "🔇"}</span>
              <span>{soundEnabled ? "Alex Voice: ON" : "Voice: Muted"}</span>
            </button>

            {/* Mode Switcher */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", padding: 3, borderRadius: 8 }}>
              <button
                onClick={() => setMode("interview")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "interview" ? "#0284c7" : "transparent",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🎙️ Live Mock Interview
              </button>
              <button
                onClick={() => setMode("bank")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "bank" ? "#0284c7" : "transparent",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                📚 Full Question Bank ({questions.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── MODE 1: LIVE INTERACTIVE MOCK INTERVIEW EXPERIENCE ── */}
        {mode === "interview" && (
          <div style={{ marginBottom: 24 }}>
            {!interviewStarted ? (
              <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(12,74,110,0.7))", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: 20, padding: "32px", textAlign: "center", boxShadow: "0 15px 40px rgba(0,0,0,0.6)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>
                  👨‍💻
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px", color: "white" }}>
                  Start a Real 3-Question Technical Interview Session
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 680, margin: "0 auto 24px", lineHeight: 1.6 }}>
                  Simulate an actual 1-on-1 technical interview for 2026 drives. Lead Interviewer Alex will assess you sequentially across DBMS, OOP, and Operating Systems/Networks with real-time feedback and a final hiring recommendation.
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleStartLiveInterview("service")}
                    style={{
                      padding: "12px 28px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #0284c7, #38bdf8)",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 4px 18px rgba(2,132,199,0.4)"
                    }}
                  >
                    🏢 Launch Service Elite Interview (TCS Digital / Infosys SP) ➔
                  </button>

                  <button
                    onClick={() => handleStartLiveInterview("product")}
                    style={{
                      padding: "12px 28px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 4px 18px rgba(79,70,229,0.4)"
                    }}
                  >
                    🚀 Launch Tier-1 Product Interview (Amazon SDE / Google) ➔
                  </button>
                </div>
              </div>
            ) : roundCompleted ? (
              /* FINAL COMPREHENSIVE HIRING DOSSIER CARD */
              <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(12,74,110,0.85))", border: "2px solid rgba(56, 189, 248, 0.4)", borderRadius: 20, padding: "32px", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 20, flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "rgba(56,189,248,0.2)", color: "#38bdf8", fontWeight: 800 }}>
                      FINAL HIRING COMMITTEE DOSSIER
                    </span>
                    <h2 style={{ fontSize: 26, fontWeight: 900, margin: "6px 0 2px", color: "white" }}>
                      Overall Verdict: {avgScore >= 80 ? "Hire (Strong Technical Foundation)" : avgScore >= 65 ? "Borderline (Needs Architecture Polish)" : "No Hire (Re-attempt Fundamentals)"}
                    </h2>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>
                      Assessed across 3 sequential rounds by Alex • Candidate: {candidateId}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 42, fontWeight: 900, color: avgScore >= 80 ? "#34d399" : avgScore >= 65 ? "#fbbf24" : "#f87171" }}>
                      {avgScore}<span style={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }}>/100</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Composite Technical Rating</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16, marginBottom: 24 }}>
                  {roundEvaluations.map((rev, idx) => (
                    <div key={idx} style={{ padding: "16px", background: "rgba(0,0,0,0.35)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 800 }}>Round {idx + 1}: {rev.question.domain.toUpperCase()}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: rev.evaluation.score >= 80 ? "#34d399" : "#fbbf24" }}>{rev.evaluation.score}/100</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 6 }}>{rev.question.topic}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{rev.evaluation.feedback}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <button
                    onClick={() => handleStartLiveInterview(targetCompanyTrack)}
                    style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #0284c7, #38bdf8)", color: "white", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer" }}
                  >
                    🔄 Retake Another Mock Session
                  </button>

                  <button
                    onClick={() => setMode("bank")}
                    style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "white", fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}
                  >
                    📚 Open Question Bank ({questions.length} Questions)
                  </button>
                </div>
              </div>
            ) : (
              /* LIVE ACTIVE INTERVIEW STATUS BAR */
              <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    👨‍💻
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 800, textTransform: "uppercase" }}>
                      Active Interview Session • Question {currentRoundIdx + 1} of {interviewQuestions.length}
                    </div>
                    <div style={{ fontSize: 13, color: "white", fontWeight: 700 }}>
                      {activeQuestion.topic} ({activeQuestion.domain.toUpperCase()})
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: timeLeft < 60 ? "#f87171" : "#38bdf8", background: "rgba(0,0,0,0.3)", padding: "6px 14px", borderRadius: 8 }}>
                    ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("End this mock interview session?")) {
                        setInterviewStarted(false);
                      }
                    }}
                    style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Exit Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODE 2: BROWSE QUESTION BANK HEADER & FILTER ── */}
        {mode === "bank" && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
              {/* Domain Filter Pills */}
              <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                {[
                  { id: "all", label: `All Topics (${questions.length})` },
                  { id: "dbms", label: `🗄️ DBMS & SQL (${questions.filter(q => q.domain === 'dbms').length})` },
                  { id: "oop", label: `🧱 OOP & Systems (${questions.filter(q => q.domain === 'oop').length})` },
                  { id: "os", label: `⚙️ Operating Systems (${questions.filter(q => q.domain === 'os').length})` },
                  { id: "networks", label: `🌐 Computer Networks (${questions.filter(q => q.domain === 'networks').length})` }
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDomain(d.id)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      background: selectedDomain === d.id ? "linear-gradient(135deg, #0284c7, #38bdf8)" : "rgba(255,255,255,0.06)",
                      color: selectedDomain === d.id ? "#ffffff" : "#94a3b8",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Question Generator Button */}
              <button
                onClick={handleGenerateFreshQuestion}
                disabled={generatingFresh}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(245,158,11,0.4)",
                  background: "rgba(245,158,11,0.15)",
                  color: "#fbbf24",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: generatingFresh ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>⚡</span>
                <span>{generatingFresh ? "Generating Live Unseen Question..." : "Generate Fresh Unseen Question"}</span>
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search across 20+ interview questions by keyword (e.g., salary, deadlock, vtable, CORS, TCP)..."
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: 10,
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        )}

        {/* ── QUESTION WORKSPACE GRID ── */}
        {(!roundCompleted || mode === "bank") && (
          <div style={{ display: "grid", gridTemplateColumns: mode === "bank" ? "360px minmax(0, 1fr)" : "1fr", gap: 20, alignItems: "start" }}>
            
            {/* LEFT: QUESTION SELECTOR (IN BANK MODE) */}
            {mode === "bank" && (
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "16px", maxHeight: "780px", overflowY: "auto" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>QUESTIONS AVAILABLE ({filteredQuestions.length})</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredQuestions.map(q => {
                    const isSelected = q.id === activeQuestion.id;
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedQuestionId(q.id);
                          setCandidateAnswer("");
                          setEvalResult(null);
                        }}
                        style={{
                          padding: "12px",
                          borderRadius: 10,
                          cursor: "pointer",
                          background: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.02)",
                          border: isSelected ? "2px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.06)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                            {q.domain}
                          </span>
                          <span style={{ fontSize: 10, color: q.difficulty === "hard" ? "#f87171" : q.difficulty === "medium" ? "#fbbf24" : "#34d399", fontWeight: 700, textTransform: "capitalize" }}>
                            {q.difficulty}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "white", lineHeight: 1.4 }}>
                          {q.topic}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RIGHT: QUESTION PROMPT, CODE/VOICE WORKSPACE & DOSSIER */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Active Question Box */}
              <div style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: 16, padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(56,189,248,0.2)", color: "#38bdf8", fontWeight: 800 }}>
                      DOMAIN: {activeQuestion.domain.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      Target: {activeQuestion.company_tag}
                    </span>
                  </div>

                  <button
                    onClick={() => speakText(`${activeQuestion.question}`)}
                    style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", fontSize: 11, cursor: "pointer" }}
                  >
                    🔊 Read Question Aloud
                  </button>
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 14px", color: "white", lineHeight: 1.5 }}>
                  {activeQuestion.question}
                </h2>

                {/* Expected Key Points Checklist */}
                <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>
                    Alex&apos;s Rubric Expectations:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {activeQuestion.expected_points.map((pt, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(56,189,248,0.1)", color: "#bae6fd" }}>
                        ✓ {pt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Answer Editor / Speech Workspace */}
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setAnswerMode("code")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: answerMode === "code" ? "#0284c7" : "rgba(255,255,255,0.05)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      💻 Code / SQL / Pseudocode IDE
                    </button>
                    <button
                      onClick={() => setAnswerMode("speech")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: answerMode === "speech" ? "#10b981" : "rgba(255,255,255,0.05)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      🎙️ Spoken Verbal Mode
                    </button>
                  </div>

                  {/* Preload Ideal Solution for Practice */}
                  <button
                    onClick={() => setCandidateAnswer(activeQuestion.ideal_answer)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.1)", color: "#7dd3fc", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    💡 Preload Production Solution
                  </button>
                </div>

                {answerMode === "speech" && (
                  <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        style={{ padding: "8px 16px", borderRadius: 8, background: "#10b981", border: "none", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                      >
                        🔴 Start Speaking to Alex
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        style={{ padding: "8px 16px", borderRadius: 8, background: "#ef4444", border: "none", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                      >
                        ⏹️ Stop Microphone
                      </button>
                    )}
                    {isRecording && (
                      <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>
                        ● Transcribing your verbal technical answer live...
                      </span>
                    )}
                  </div>
                )}

                <textarea
                  value={candidateAnswer}
                  onChange={e => setCandidateAnswer(e.target.value)}
                  placeholder={
                    activeQuestion.domain === "dbms"
                      ? "Write your complete SQL query or stored procedure here..."
                      : "Write your code, pseudocode, or detailed architectural explanation here..."
                  }
                  rows={8}
                  style={{
                    width: "100%",
                    fontFamily: answerMode === "code" ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" : "inherit",
                    fontSize: 13,
                    lineHeight: 1.6,
                    padding: "14px",
                    borderRadius: 10,
                    background: "#050811",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#f1f5f9",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    marginBottom: 14
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={() => setCandidateAnswer("")}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}
                  >
                    Clear
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={evaluating || !candidateAnswer.trim()}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 8,
                      border: "none",
                      background: evaluating ? "rgba(56,189,248,0.4)" : "linear-gradient(135deg, #0284c7, #38bdf8)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: evaluating || !candidateAnswer.trim() ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(2,132,199,0.3)"
                    }}
                  >
                    {evaluating ? "⚡ Alex is evaluating your technical answer..." : "Submit Technical Answer to Alex ➔"}
                  </button>
                </div>
              </div>

              {/* EVALUATION DOSSIER REPORT */}
              {evalResult && (
                <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(12,74,110,0.8))", border: "1px solid rgba(56,189,248,0.4)", borderRadius: 16, padding: "24px", boxShadow: "0 15px 40px rgba(0,0,0,0.7)" }}>
                  
                  {/* Header score */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(56,189,248,0.2)", color: "#38bdf8", fontWeight: 800 }}>
                        ALEX&apos;S VERDICT
                      </span>
                      <h3 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 0", color: "white" }}>
                        {evalResult.verdict}: {evalResult.score}/100
                      </h3>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Conceptual Accuracy</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#38bdf8" }}>{evalResult.conceptualAccuracy}%</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Technical Depth</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#a855f7" }}>{evalResult.depthScore}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", marginBottom: 4 }}>
                      INTERVIEWER CRITIQUE:
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: 0 }}>
                      {evalResult.feedback}
                    </p>
                  </div>

                  {/* Benchmark Code / SQL Comparison */}
                  {evalResult.correctCodeOrSyntax && (
                    <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(0,0,0,0.5)", borderRadius: 10, border: "1px solid rgba(56,189,248,0.2)" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", marginBottom: 6 }}>
                        🏆 PRODUCTION BENCHMARK SOLUTION / SYNTAX:
                      </div>
                      <pre style={{ margin: 0, padding: "10px", background: "#050811", borderRadius: 8, fontSize: 12, color: "#7dd3fc", overflowX: "auto", fontFamily: "monospace" }}>
                        {evalResult.correctCodeOrSyntax}
                      </pre>
                    </div>
                  )}

                  {/* Follow-up Question Grill */}
                  {evalResult.interviewerFollowUp && (
                    <div style={{ padding: "14px 16px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 10, marginBottom: mode === "interview" ? 16 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>
                        🔥 ALEX&apos;S FOLLOW-UP GRILLING QUESTION:
                      </div>
                      <p style={{ fontSize: 13, color: "#fef3c7", margin: 0, fontWeight: 600 }}>
                        &quot;{evalResult.interviewerFollowUp}&quot;
                      </p>
                    </div>
                  )}

                  {/* Advance to Next Question in Live Interview Mode */}
                  {mode === "interview" && interviewStarted && !roundCompleted && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={handleNextInterviewQuestion}
                        style={{
                          padding: "10px 24px",
                          borderRadius: 10,
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          color: "white",
                          fontSize: 13,
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
                        }}
                      >
                        Proceed to Next Question ({currentRoundIdx + 2} of {interviewQuestions.length}) ➔
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
