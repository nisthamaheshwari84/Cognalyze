"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BehavioralQuestion, SEED_BEHAVIORAL_QUESTIONS } from "@/lib/skill-hub-store";

export default function BehavioralHRPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [questions, setQuestions] = useState<BehavioralQuestion[]>(SEED_BEHAVIORAL_QUESTIONS);
  const [mode, setMode] = useState<"interview" | "bank">("interview");
  const [activeTab, setActiveTab] = useState<"service_hr" | "faang_star">("service_hr");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(SEED_BEHAVIORAL_QUESTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingFresh, setGeneratingFresh] = useState(false);

  // Live HR Interview Simulation state
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<BehavioralQuestion[]>([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [roundEvaluations, setRoundEvaluations] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(240); // 4 mins per HR answer

  // Audio Speech Synthesis
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inputMode, setInputMode] = useState<"speech" | "typed">("typed");
  const [candidateResponse, setCandidateResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const recognitionRef = useRef<any>(null);

  const speakText = (text: string) => {
    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1; // Friendly female HR executive pitch
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Zira") || v.lang.includes("en-IN") || v.lang.includes("en-US"));
      if (femaleVoice) utterance.voice = femaleVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  useEffect(() => {
    // Setup Speech Recognition
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
          setCandidateResponse(transcript.trim());
        };

        recog.onerror = () => setIsRecording(false);
        recog.onend = () => setIsRecording(false);
        recognitionRef.current = recog;
      }
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (interviewStarted && !roundCompleted && !evalResult && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [interviewStarted, roundCompleted, evalResult, timeLeft]);

  const filteredQuestions = questions.filter(q => {
    const matchTab = q.track_type === activeTab;
    const matchSearch = !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const activeQuestion = mode === "interview" && interviewStarted
    ? interviewQuestions[currentRoundIdx] || questions[0]
    : questions.find(q => q.id === selectedQuestionId) || filteredQuestions[0] || questions[0];

  const handleStartLiveHRInterview = (track: "service_hr" | "faang_star") => {
    setActiveTab(track);
    setMode("interview");
    const trackQuestions = questions.filter(q => q.track_type === track);
    const picked = trackQuestions.slice(0, 3);
    setInterviewQuestions(picked);
    setCurrentRoundIdx(0);
    setRoundCompleted(false);
    setRoundEvaluations([]);
    setInterviewStarted(true);
    setCandidateResponse("");
    setEvalResult(null);
    setTimeLeft(240);

    const greeting = track === "service_hr"
      ? `Welcome to your HR Round. I am Priya Sharma, HR Director. We will discuss your career aspirations, company loyalty, and relocation readiness. Let's start with Question 1: ${picked[0].question}`
      : `Welcome to your Leadership Principles Bar-Raiser round. I am Priya. I will be evaluating your behavioral ownership using the STAR method. Let's begin with Question 1: ${picked[0].question}`;
    speakText(greeting);
  };

  const handleNextHRQuestion = () => {
    if (currentRoundIdx + 1 < interviewQuestions.length) {
      const nextIdx = currentRoundIdx + 1;
      setCurrentRoundIdx(nextIdx);
      setCandidateResponse("");
      setEvalResult(null);
      setTimeLeft(240);
      const nextQ = interviewQuestions[nextIdx];
      speakText(`Thank you. Moving to Question ${nextIdx + 1}: ${nextQ.question}`);
    } else {
      setRoundCompleted(true);
      speakText("That concludes our HR behavioral round. I am now compiling your final hiring committee decision dossier.");
    }
  };

  const handleGenerateFreshHRQuestion = async () => {
    setGeneratingFresh(true);
    try {
      const res = await fetch("/api/skills/behavioral/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackType: activeTab,
          companyTag: activeTab === "service_hr" ? "TCS / Infosys HR" : "Amazon Bar-Raiser"
        })
      });
      const data = await res.json();
      if (data.question) {
        setQuestions(prev => [data.question, ...prev]);
        setSelectedQuestionId(data.question.id);
        setCandidateResponse("");
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
      alert("Microphone speech recognition is not supported in this browser. Please use the typed input box.");
      return;
    }
    setCandidateResponse("");
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
    if (!candidateResponse.trim()) {
      alert("Please provide your response either by speaking or typing.");
      return;
    }

    setEvaluating(true);
    setEvalResult(null);

    try {
      const res = await fetch("/api/skills/behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          candidateResponse
        })
      });

      const data = await res.json();
      if (data.evaluation) {
        setEvalResult(data.evaluation);
        if (mode === "interview") {
          setRoundEvaluations(prev => [...prev, { question: activeQuestion, evaluation: data.evaluation }]);
        }
        speakText(`Verdict: ${data.evaluation.verdict}. ${data.evaluation.barRaiserFeedback.split('.')[0]}`);
      }
    } catch (err) {
      console.error("Behavioral evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const avgStarScore = roundEvaluations.length > 0
    ? Math.round(roundEvaluations.reduce((acc, curr) => acc + (curr.evaluation?.starScore || 70), 0) / roundEvaluations.length)
    : 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(16px)", padding: "16px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Link href="/student/skills" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: 700 }}>STAR Behavioral & HR Interview</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              🤝 Authentic HR & Leadership Round with Director Priya Sharma
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Spoken Voice Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (!next && typeof window !== "undefined") window.speechSynthesis?.cancel();
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: soundEnabled ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
                background: soundEnabled ? "rgba(245,158,11,0.15)" : "transparent",
                color: soundEnabled ? "#fbbf24" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>{soundEnabled ? "🔊" : "🔇"}</span>
              <span>{soundEnabled ? "Priya Voice: ON" : "Voice: Muted"}</span>
            </button>

            {/* Mode Switcher */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", padding: 3, borderRadius: 8 }}>
              <button
                onClick={() => setMode("interview")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "interview" ? "#d97706" : "transparent",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🎙️ Live Mock Round
              </button>
              <button
                onClick={() => setMode("bank")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "bank" ? "#d97706" : "transparent",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                📚 Full Bank ({questions.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── MODE 1: LIVE INTERACTIVE HR MOCK INTERVIEW ── */}
        {mode === "interview" && (
          <div style={{ marginBottom: 24 }}>
            {!interviewStarted ? (
              <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(69,26,3,0.7))", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "32px", textAlign: "center", boxShadow: "0 15px 40px rgba(0,0,0,0.6)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>
                  👩‍💼
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px", color: "white" }}>
                  Start an Authentic 3-Question HR Interview Round
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 680, margin: "0 auto 24px", lineHeight: 1.6 }}>
                  Experience a realistic 1-on-1 HR interview session. Priya Sharma will evaluate your corporate loyalty, team conflict resolution, and leadership ownership with spoken voice feedback and a final hiring offer verdict.
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleStartLiveHRInterview("service_hr")}
                    style={{
                      padding: "12px 28px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #d97706, #f59e0b)",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 4px 18px rgba(217,119,6,0.4)"
                    }}
                  >
                    🏢 Launch Service HR Round (TCS / Infosys / Wipro) ➔
                  </button>

                  <button
                    onClick={() => handleStartLiveHRInterview("faang_star")}
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
                    🚀 Launch Amazon 16 LPs Bar-Raiser Round ➔
                  </button>
                </div>
              </div>
            ) : roundCompleted ? (
              /* FINAL COMPREHENSIVE HR OFFER DOSSIER */
              <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(69,26,3,0.85))", border: "2px solid rgba(245,158,11,0.4)", borderRadius: 20, padding: "32px", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 20, flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "rgba(245,158,11,0.2)", color: "#fbbf24", fontWeight: 800 }}>
                      OFFICIAL HR COMMITTEE CLEARANCE
                    </span>
                    <h2 style={{ fontSize: 26, fontWeight: 900, margin: "6px 0 2px", color: "white" }}>
                      Verdict: {avgStarScore >= 80 ? "Offer Recommended (Clear Culture Fit)" : avgStarScore >= 65 ? "Borderline (Hold for Second Review)" : "Eliminated (Culture Alignment Concerns)"}
                    </h2>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>
                      Assessed across 3 HR questions by Priya Sharma • Candidate: {candidateId}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 42, fontWeight: 900, color: avgStarScore >= 80 ? "#34d399" : avgStarScore >= 65 ? "#fbbf24" : "#f87171" }}>
                      {avgStarScore}<span style={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }}>/100</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Overall Behavioral Index</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16, marginBottom: 24 }}>
                  {roundEvaluations.map((rev, idx) => (
                    <div key={idx} style={{ padding: "16px", background: "rgba(0,0,0,0.35)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800 }}>Question {idx + 1}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: rev.evaluation.starScore >= 80 ? "#34d399" : "#fbbf24" }}>{rev.evaluation.starScore}/100</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 6 }}>{rev.question.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{rev.evaluation.barRaiserFeedback}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <button
                    onClick={() => handleStartLiveHRInterview(activeTab)}
                    style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "white", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer" }}
                  >
                    🔄 Retake HR Mock Session
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
              /* LIVE ACTIVE HR STATUS BAR */
              <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    👩‍💼
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 800, textTransform: "uppercase" }}>
                      Active HR Panel • Question {currentRoundIdx + 1} of {interviewQuestions.length}
                    </div>
                    <div style={{ fontSize: 13, color: "white", fontWeight: 700 }}>
                      {activeQuestion.title}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: timeLeft < 60 ? "#f87171" : "#fbbf24", background: "rgba(0,0,0,0.3)", padding: "6px 14px", borderRadius: 8 }}>
                    ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Exit this HR interview session?")) {
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

        {/* ── MODE 2: BROWSE QUESTION BANK HEADER ── */}
        {mode === "bank" && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
              {/* Dual-Track Toggle */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    setActiveTab("service_hr");
                    const first = questions.find(q => q.track_type === "service_hr");
                    if (first) setSelectedQuestionId(first.id);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "service_hr" ? "linear-gradient(135deg, #d97706, #f59e0b)" : "rgba(255,255,255,0.06)",
                    color: activeTab === "service_hr" ? "#ffffff" : "#94a3b8"
                  }}
                >
                  🏢 Service HR Questions ({questions.filter(q => q.track_type === 'service_hr').length})
                </button>

                <button
                  onClick={() => {
                    setActiveTab("faang_star");
                    const first = questions.find(q => q.track_type === "faang_star");
                    if (first) setSelectedQuestionId(first.id);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "faang_star" ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.06)",
                    color: activeTab === "faang_star" ? "#ffffff" : "#94a3b8"
                  }}
                >
                  🚀 Product & Amazon 16 LPs ({questions.filter(q => q.track_type === 'faang_star').length})
                </button>
              </div>

              {/* Dynamic Generator Button */}
              <button
                onClick={handleGenerateFreshHRQuestion}
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
                <span>{generatingFresh ? "Generating Live Unseen HR Question..." : "Generate Fresh Unseen HR Question"}</span>
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search across 16+ HR questions (e.g., relocation, bond, deadline, client, ownership, mistake)..."
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
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                  HR QUESTIONS AVAILABLE ({filteredQuestions.length})
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredQuestions.map(q => {
                    const isSelected = q.id === activeQuestion.id;
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedQuestionId(q.id);
                          setCandidateResponse("");
                          setEvalResult(null);
                        }}
                        style={{
                          padding: "12px",
                          borderRadius: 10,
                          cursor: "pointer",
                          background: isSelected ? "rgba(245,158,11,0.15)" : "rgba(255, 255, 255, 0.02)",
                          border: isSelected ? "2px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.06)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ fontSize: 9, color: isSelected ? "#fbbf24" : "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
                          {q.principle || q.company_tag}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "white", lineHeight: 1.4 }}>
                          {q.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RIGHT: QUESTION PROMPT, STAR STUDIO & FEEDBACK */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Active Question Box */}
              <div style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 16, padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(245,158,11,0.2)", color: "#fbbf24", fontWeight: 800 }}>
                      COMPETENCY: {activeQuestion.principle?.toUpperCase() || "HR STABILITY"}
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

                <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 10, fontSize: 12, color: "#fca5a5", marginBottom: 14 }}>
                  💡 <strong>HR Context:</strong> {activeQuestion.context_tip}
                </div>

                {/* STAR Framework Indicators */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
                  <div style={{ padding: "6px", borderRadius: 8, background: "rgba(255,255,255,0.04)", fontSize: 11, color: "#cbd5e1" }}>
                    <strong style={{ color: "#38bdf8" }}>S</strong>ituation
                  </div>
                  <div style={{ padding: "6px", borderRadius: 8, background: "rgba(255,255,255,0.04)", fontSize: 11, color: "#cbd5e1" }}>
                    <strong style={{ color: "#a855f7" }}>T</strong>ask
                  </div>
                  <div style={{ padding: "6px", borderRadius: 8, background: "rgba(255,255,255,0.04)", fontSize: 11, color: "#cbd5e1" }}>
                    <strong style={{ color: "#10b981" }}>A</strong>ction (&apos;I&apos;)
                  </div>
                  <div style={{ padding: "6px", borderRadius: 8, background: "rgba(255,255,255,0.04)", fontSize: 11, color: "#cbd5e1" }}>
                    <strong style={{ color: "#f59e0b" }}>R</strong>esult (%)
                  </div>
                </div>
              </div>

              {/* Answer Response Studio */}
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setInputMode("typed")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: inputMode === "typed" ? "#f59e0b" : "rgba(255,255,255,0.05)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      ⌨️ Typed Response
                    </button>
                    <button
                      onClick={() => setInputMode("speech")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: inputMode === "speech" ? "#10b981" : "rgba(255,255,255,0.05)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      🎙️ Voice Microphone
                    </button>
                  </div>

                  {/* Preload Ideal Gold-Standard Answer */}
                  <button
                    onClick={() => setCandidateResponse(activeQuestion.ideal_response)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(245,158,11,0.4)",
                      background: "rgba(245,158,11,0.1)",
                      color: "#fbbf24",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    💡 Load Gold-Standard Example
                  </button>
                </div>

                {inputMode === "speech" && (
                  <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          background: "#10b981",
                          border: "none",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        🔴 Start Speaking to Priya
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          background: "#ef4444",
                          border: "none",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        ⏹️ Stop Microphone
                      </button>
                    )}
                    {isRecording && (
                      <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>
                        ● Transcribing your verbal explanation live...
                      </span>
                    )}
                  </div>
                )}

                <textarea
                  value={candidateResponse}
                  onChange={e => setCandidateResponse(e.target.value)}
                  placeholder="Structure your answer: S (Situation), T (Task), A (Action - use 'I' rather than 'we'), R (quantifiable Result)..."
                  rows={7}
                  style={{
                    width: "100%",
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
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    Word count: {candidateResponse.trim().split(/\s+/).filter(Boolean).length} words
                  </span>

                  <button
                    onClick={handleSubmit}
                    disabled={evaluating || !candidateResponse.trim()}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 8,
                      border: "none",
                      background: evaluating ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg, #d97706, #f59e0b)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: evaluating || !candidateResponse.trim() ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(245,158,11,0.3)"
                    }}
                  >
                    {evaluating ? "⚡ Priya is grading your STAR response..." : "Submit Answer to Priya ➔"}
                  </button>
                </div>
              </div>

              {/* EVALUATION DOSSIER REPORT */}
              {evalResult && (
                <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(69,26,3,0.8))", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 16, padding: "24px", boxShadow: "0 15px 40px rgba(0,0,0,0.7)" }}>
                  
                  {/* Header score */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.2)", color: "#fbbf24", fontWeight: 800 }}>
                        HIRING COMMITTEE DOSSIER
                      </span>
                      <h3 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 0", color: "white" }}>
                        Verdict: {evalResult.verdict} ({evalResult.starScore}/100)
                      </h3>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ textAlign: "center", padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>Situation</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#38bdf8" }}>{evalResult.situationScore}%</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>Task</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#a855f7" }}>{evalResult.taskScore}%</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>Action</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>{evalResult.actionScore}%</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>Result</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b" }}>{evalResult.resultScore}%</div>
                      </div>
                    </div>
                  </div>

                  {/* 'I' vs 'We' Ownership Critique */}
                  <div style={{ marginBottom: 14, padding: "12px 16px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>
                      👤 INDIVIDUAL OWNERSHIP (&apos;I&apos; VS &apos;WE&apos;) ANALYSIS:
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.5, margin: 0 }}>
                      {evalResult.actionOwnershipCritique}
                    </p>
                  </div>

                  {/* Committee Feedback */}
                  <div style={{ padding: "14px 16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, marginBottom: mode === "interview" ? 16 : 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>
                      PRIYA&apos;S HIRING COMMITTEE DEBRIEF:
                    </div>
                    <p style={{ fontSize: 13, color: "#fef3c7", margin: 0, lineHeight: 1.5 }}>
                      {evalResult.barRaiserFeedback}
                    </p>
                  </div>

                  {/* Advance to Next Question in Live Interview Mode */}
                  {mode === "interview" && interviewStarted && !roundCompleted && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={handleNextHRQuestion}
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
