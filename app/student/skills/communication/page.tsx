"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CommunicationPrompt, SEED_COMMUNICATION_PROMPTS } from "@/lib/skill-hub-store";

export default function CommunicationStudioPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [prompts, setPrompts] = useState<CommunicationPrompt[]>(SEED_COMMUNICATION_PROMPTS);
  const [selectedPromptId, setSelectedPromptId] = useState<string>(SEED_COMMUNICATION_PROMPTS[0].id);
  const [inputMode, setInputMode] = useState<"speech" | "typed">("speech");
  const [userText, setUserText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);

    // Initialize Web Speech API
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
          setUserText(fullTranscript.trim());
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
  }, []);

  const activePrompt = prompts.find(p => p.id === selectedPromptId) || prompts[0];

  const startRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use the typed input mode.");
      return;
    }
    setUserText("");
    setElapsedSeconds(0);
    setIsRecording(true);
    setEvaluationReport(null);

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn(e);
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
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

  const submitForEvaluation = async () => {
    if (isRecording) {
      stopRecording();
    }
    if (!userText.trim()) {
      alert("Please provide your response either by speaking or typing.");
      return;
    }

    setEvaluating(true);
    setEvaluationReport(null);

    try {
      const res = await fetch("/api/skills/communication-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          promptId: activePrompt.id,
          spokenText: userText,
          durationSeconds: elapsedSeconds || 45
        })
      });

      const data = await res.json();
      if (data.report) {
        setEvaluationReport(data.report);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(16px)", padding: "16px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Link href="/student/skills" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#10b981", fontSize: 13, fontWeight: 700 }}>Corporate Communication & Spoken English Studio</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              🎙️ Plain-English & Communication Arena
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", fontWeight: 700 }}>
              ⚠️ Eliminates 40%+ Technical Candidates
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── PROMPT SELECTOR CAROUSEL / PILLS ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            SELECT PRACTICE CHALLENGE:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 12 }}>
            {prompts.map(p => {
              const isSelected = p.id === activePrompt.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPromptId(p.id);
                    setUserText("");
                    setEvaluationReport(null);
                    setElapsedSeconds(0);
                  }}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: isSelected ? "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(15,23,42,0.9) 100%)" : "rgba(15, 23, 42, 0.6)",
                    border: isSelected ? "2px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ fontSize: 10, color: isSelected ? "#34d399" : "#94a3b8", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>
                    {p.type.replace(/_/g, " ")} • {p.target_duration_seconds}s Target
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 4px", color: "white" }}>
                    {p.title}
                  </h4>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    {p.target_role}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ACTIVE PROMPT BRIEFING CARD ── */}
        <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 18, padding: "24px", marginBottom: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <div>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.2)", color: "#34d399", fontWeight: 800 }}>
                EXPLAIN-IN-PLAIN-ENGLISH PROTOCOL
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "6px 0 0", color: "white" }}>
                {activePrompt.title}
              </h2>
            </div>
            <div style={{ fontSize: 12, color: "#cbd5e1", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 8 }}>
              ⏱️ Target: ~{activePrompt.target_duration_seconds} seconds
            </div>
          </div>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: "0 0 16px" }}>
            {activePrompt.prompt_text}
          </p>

          <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 10, fontSize: 12, color: "#fca5a5" }}>
            {activePrompt.context_note}
          </div>
        </div>

        {/* ── SPEECH / TEXT INPUT WORKSPACE ── */}
        <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 18, padding: "24px", marginBottom: 28 }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setInputMode("speech")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: inputMode === "speech" ? "#10b981" : "rgba(255,255,255,0.05)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>🎙️</span>
                <span>Voice Microphone</span>
              </button>

              <button
                onClick={() => setInputMode("typed")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: inputMode === "typed" ? "#6366f1" : "rgba(255,255,255,0.05)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>⌨️</span>
                <span>Typed Explanation</span>
              </button>
            </div>

            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Word Count: {userText.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </div>

          {/* Voice Mic Controls */}
          {inputMode === "speech" && (
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg,#10b981,#059669)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
                  }}
                >
                  <span>🔴</span>
                  <span>Start Voice Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "2px solid #ef4444",
                    background: "rgba(239,68,68,0.2)",
                    color: "#f87171",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    animation: "pulse 1.5s infinite"
                  }}
                >
                  <span>⏹️ Stop Recording ({elapsedSeconds}s)</span>
                </button>
              )}

              {isRecording && (
                <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>
                  ● Listening to speech... Speak clearly in natural conversational English.
                </span>
              )}
            </div>
          )}

          {/* Speech Text Area */}
          <textarea
            value={userText}
            onChange={e => setUserText(e.target.value)}
            placeholder={
              inputMode === "speech"
                ? "Your live transcribed speech will appear here automatically when you speak into the microphone. You can also edit it before submitting."
                : "Type your plain-English explanation or 90-second self-introduction here. Strive for intuitive analogies and zero technical jargon..."
            }
            rows={5}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              fontSize: 14,
              lineHeight: 1.6,
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              marginBottom: 16
            }}
          />

          {/* Submit CTA */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => setUserText("")}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}
            >
              Clear Text
            </button>

            <button
              onClick={submitForEvaluation}
              disabled={evaluating || !userText.trim()}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                background: evaluating ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#6366f1,#a855f7)",
                color: "white",
                fontSize: 13,
                fontWeight: 800,
                cursor: evaluating || !userText.trim() ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)"
              }}
            >
              {evaluating ? "⚡ Analyzing Corporate Communicability..." : "Evaluate Speech & Articulation ➔"}
            </button>
          </div>
        </div>

        {/* ── AI EVALUATION DOSSIER REPORT ── */}
        {evaluationReport && (
          <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,27,75,0.9))", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 20, padding: "28px", marginBottom: 32, boxShadow: "0 15px 40px rgba(0,0,0,0.7)" }}>
            
            {/* Top Score Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 20 }}>
              <div>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "rgba(16,185,129,0.2)", color: "#34d399", fontWeight: 800, letterSpacing: 1 }}>
                  HR & CLIENT READINESS ASSESSMENT
                </span>
                <h3 style={{ fontSize: 22, fontWeight: 900, margin: "6px 0 2px", color: "white" }}>
                  {evaluationReport.verdict}
                </h3>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Tested on Corporate Spoken English & Plain-Language Translation
                </div>
              </div>

              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: evaluationReport.overallScore >= 75 ? "#34d399" : evaluationReport.overallScore >= 60 ? "#fbbf24" : "#f87171" }}>
                    {evaluationReport.overallScore}<span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>/100</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Communicability Index</div>
                </div>
              </div>
            </div>

            {/* Sub-Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Clarity & Flow</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginTop: 2 }}>{evaluationReport.clarityScore || 80}/100</div>
              </div>
              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Simplicity & Jargon Avoidance</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginTop: 2 }}>{evaluationReport.simplicityScore || 75}/100</div>
              </div>
              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Filler Hesitations Detected</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: evaluationReport.fillerCount > 2 ? "#fbbf24" : "#34d399", marginTop: 2 }}>
                  {evaluationReport.fillerCount} {evaluationReport.fillerCount === 1 ? "filler" : "fillers"}
                </div>
              </div>
            </div>

            {/* Jargon Warning if detected */}
            {evaluationReport.detectedJargon && evaluationReport.detectedJargon.length > 0 && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#f87171", marginBottom: 2 }}>
                  ⚠️ FORBIDDEN TECHNICAL JARGON DETECTED:
                </div>
                <div style={{ fontSize: 12, color: "#fecaca" }}>
                  You used terms like: <strong>{evaluationReport.detectedJargon.join(", ")}</strong>. Remember, a non-technical interviewer or grandparent cannot picture these terms. Replace them with concrete everyday metaphors.
                </div>
              </div>
            )}

            {/* Strengths and Improvements */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 16, marginBottom: 20 }}>
              <div style={{ padding: "14px 16px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", marginBottom: 6 }}>
                  ✓ WHAT WORKED WELL:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  {evaluationReport.strengths?.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: "14px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 6 }}>
                  ⚡ STRATEGIC VERBAL ADJUSTMENTS:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  {evaluationReport.areasForImprovement?.map((imp: string, idx: number) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Winning Sample Comparison */}
            <div style={{ padding: "16px 20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", letterSpacing: 0.5, marginBottom: 6 }}>
                🏆 BENCHMARK GOLD STANDARD RESPONSE:
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                &quot;{activePrompt.sample_winning_response}&quot;
              </p>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
