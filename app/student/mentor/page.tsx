"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ConversationalMessage,
  LearningTwinState,
  LanguageCode,
  MentorSessionRecord,
  VoiceState,
  StructuredEvaluationResult,
  MentorEvidenceRecord,
  VisualCanvasPayload,
  LearningSurfaceState,
  SessionLearningState
} from "@/lib/mentor/types";

export default function MentorPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [learningTwin, setLearningTwin] = useState<LearningTwinState | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationalMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  // Real-time 8-State Conversational Machine
  const [conversationalState, setConversationalState] = useState<VoiceState>("IDLE");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("hinglish");
  const [dontGiveAnswerMode, setDontGiveAnswerMode] = useState(false);
  const [activeVisualCanvas, setActiveVisualCanvas] = useState<VisualCanvasPayload | null>(null);
  const [activeLearningSurface, setActiveLearningSurface] = useState<LearningSurfaceState | null>(null);
  const [sessionLearningState, setSessionLearningState] = useState<SessionLearningState | null>(null);
  const [lastInterruption, setLastInterruption] = useState<boolean>(false);

  // History & Evidence Drawers
  const [historySessions, setHistorySessions] = useState<MentorSessionRecord[]>([]);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [activeWhyModal, setActiveWhyModal] = useState<StructuredEvaluationResult | null>(null);
  const [sessionEvidenceList, setSessionEvidenceList] = useState<MentorEvidenceRecord[]>([]);

  // Speech Recognition & Synthesis references
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isListeningRef = useRef<boolean>(false);
  const voiceEnabledRef = useRef<boolean>(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  // Initial load
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("cognalyze_student_id") || "student-demo"
        : "student-demo";
    setCandidateId(stored);
    loadActiveSession(stored);
    loadHistory(stored);

    // Initialize Speech Synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize Speech Recognition
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const recog = new SR();
        recog.continuous = false;
        recog.interimResults = true;
        recog.lang = selectedLanguage === "hi" ? "hi-IN" : "en-US";

        recog.onstart = () => {
          isListeningRef.current = true;
          // BARGE-IN INTERRUPTION: If mentor was speaking when user starts talking, halt audio immediately!
          if (synthRef.current && synthRef.current.speaking) {
            stopSpeaking();
            setLastInterruption(true);
            setConversationalState("INTERRUPTED");
            setTimeout(() => setConversationalState("LISTENING"), 300);
          } else {
            setConversationalState("LISTENING");
          }
        };

        recog.onresult = (event: any) => {
          // Instant interruption trigger if audio was playing
          if (synthRef.current && synthRef.current.speaking) {
            stopSpeaking();
            setLastInterruption(true);
            setConversationalState("INTERRUPTED");
          }

          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const finalTranscript = event.results[i][0].transcript;
              setInputText("");
              handleSendMessage(finalTranscript);
            } else {
              interimTranscript += event.results[i][0].transcript;
              setInputText(interimTranscript);
            }
          }
        };

        recog.onerror = (e: any) => {
          console.warn("[SpeechRecognition] Event error:", e.error);
          isListeningRef.current = false;
          if (conversationalState === "LISTENING") {
            setConversationalState("IDLE");
          }
        };

        recog.onend = () => {
          isListeningRef.current = false;
          if (conversationalState === "LISTENING") {
            setConversationalState("WAITING_FOR_STUDENT");
          }
        };

        recognitionRef.current = recog;
      }
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load session from backend
  const loadActiveSession = async (cId: string) => {
    try {
      const res = await fetch(`/api/mentor/session?candidateId=${cId}&createIfMissing=false`);
      if (res.ok) {
        const data = await res.json();
        if (data.learningTwin) {
          setLearningTwin(data.learningTwin);
          setSelectedLanguage(data.learningTwin.activeGoal.preferredLanguage || "hinglish");
          setDontGiveAnswerMode(Boolean(data.learningTwin.dontGiveAnswerMode));
          if (data.learningTwin.sessionEvidence) {
            setSessionEvidenceList(data.learningTwin.sessionEvidence);
          }
        }
        if (data.activeSession && data.activeSession.messages?.length > 0) {
          setCurrentSessionId(data.activeSession.id);
          setMessages(data.activeSession.messages);
          // Set last active visual canvas or learning surface if present
          const lastMentorMsg = [...data.activeSession.messages].reverse().find((m: any) => m.role === "mentor" && (m.metadata?.learningSurface || m.metadata?.visualCanvas));
          if (lastMentorMsg) {
            if (lastMentorMsg.metadata?.learningSurface) {
              setActiveLearningSurface(lastMentorMsg.metadata.learningSurface);
            }
            if (lastMentorMsg.metadata?.visualCanvas) {
              setActiveVisualCanvas(lastMentorMsg.metadata.visualCanvas);
            }
            if (lastMentorMsg.metadata?.sessionLearningState) {
              setSessionLearningState(lastMentorMsg.metadata.sessionLearningState);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load mentor session:", err);
    }
  };

  const loadHistory = async (cId: string) => {
    try {
      const res = await fetch(`/api/mentor/history?candidateId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.sessions) {
          setHistorySessions(data.sessions);
        }
      }
    } catch (err) {
      console.error("Failed to load mentor history:", err);
    }
  };

  // Instant interruption & speech cancellation
  const stopSpeaking = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
    }
  };

  // Re-arm speech recognition for hands-free conversational loop
  const armRecognition = () => {
    if (!recognitionRef.current || !voiceEnabledRef.current || isListeningRef.current) return;
    try {
      recognitionRef.current.lang = selectedLanguage === "hi" ? "hi-IN" : "en-US";
      recognitionRef.current.start();
    } catch (err) {
      // Ignore if already active
    }
  };

  // Speak AI response naturally
  const speakText = (text: string) => {
    if (!synthRef.current || !voiceEnabled) {
      setConversationalState("WAITING_FOR_STUDENT");
      return;
    }

    stopSpeaking();

    // Strip markdown tags for natural conversational speech
    const cleanText = text
      .replace(/[*#`_~]/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!cleanText) {
      setConversationalState("WAITING_FOR_STUDENT");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best natural voice based on language
    const voices = synthRef.current.getVoices();
    if (selectedLanguage === "hi") {
      utterance.lang = "hi-IN";
      const hindiVoice = voices.find((v) => v.lang.includes("hi"));
      if (hindiVoice) utterance.voice = hindiVoice;
    } else {
      utterance.lang = "en-IN";
      const naturalVoice =
        voices.find((v) => v.lang.includes("en-IN")) ||
        voices.find((v) => v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Google"));
      if (naturalVoice) utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setConversationalState("SPEAKING");
    };

    // When speaking completes naturally -> enter WAITING_FOR_STUDENT & arm hands-free listening
    utterance.onend = () => {
      setConversationalState("WAITING_FOR_STUDENT");
      // Hands-free turn-taking: automatically listen for student response
      setTimeout(() => {
        armRecognition();
      }, 400);
    };

    utterance.onerror = () => {
      setConversationalState("WAITING_FOR_STUDENT");
    };

    synthRef.current.speak(utterance);
  };

  // Toggle voice input recording
  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.");
      return;
    }

    stopSpeaking();

    if (isListeningRef.current || conversationalState === "LISTENING") {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      isListeningRef.current = false;
      setConversationalState("IDLE");
    } else {
      setVoiceEnabled(true);
      armRecognition();
    }
  };

  // Send message turn
  const handleSendMessage = async (textOverride?: string) => {
    const text = textOverride || inputText.trim();
    if (!text || loading) return;

    stopSpeaking();
    setInputText("");

    const wasInterrupted = lastInterruption;
    setLastInterruption(false);

    const userMsg: ConversationalMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setConversationalState("PROCESSING");

    try {
      const res = await fetch("/api/mentor/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          userMessage: text,
          sessionId: currentSessionId,
          messages: newMessages,
          interruptionContext: wasInterrupted ? { wasInterrupted: true } : undefined,
          sessionLearningState
        })
      });

      if (res.ok) {
        const data = await res.json();
        setConversationalState("RESPONDING");

        const spokenContent = data.spokenResponse || data.mentorResponse || "";
        const visualCanvas = data.visualCanvas || null;
        if (visualCanvas) {
          setActiveVisualCanvas(visualCanvas);
        }
        if (data.learningSurface) {
          setActiveLearningSurface(data.learningSurface);
        }
        if (data.sessionLearningState) {
          setSessionLearningState(data.sessionLearningState);
        }

        const mentorMsg: ConversationalMessage = {
          id: `mnt-${Date.now()}`,
          role: "mentor",
          content: spokenContent,
          timestamp: new Date().toISOString(),
          metadata: {
            hintLevel: data.availableHints?.currentLevel,
            whyContext: data.whyExplanation,
            evaluation: data.evaluation,
            intent: data.intent?.intent,
            topic: data.intent?.topic,
            teachingAction: data.teachingAction,
            decisionRationale: data.decisionContext?.minimumInterventionRationale,
            visualCanvas,
            learningSurface: data.learningSurface,
            sessionLearningState: data.sessionLearningState
          }
        };

        setMessages((prev) => [...prev, mentorMsg]);

        // Speak natural turn
        speakText(spokenContent);

        if (data.learningTwin) {
          setLearningTwin(data.learningTwin);
        }
        if (data.evidenceGenerated) {
          setSessionEvidenceList((prev) => [data.evidenceGenerated, ...prev]);
        }
        if (data.intent?.language) {
          setSelectedLanguage(data.intent.language);
        }
        if (data.intent?.forbidDirectAnswer) {
          setDontGiveAnswerMode(true);
        }

        loadHistory(candidateId);
      } else {
        setConversationalState("ERROR_RECOVERY");
      }
    } catch (err) {
      console.error("Failed to submit turn:", err);
      setConversationalState("ERROR_RECOVERY");
    } finally {
      setLoading(false);
    }
  };

  // Start fresh conversation session
  const handleStartNewSession = async () => {
    stopSpeaking();
    try {
      if (currentSessionId && messages.length > 0) {
        await fetch("/api/mentor/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            action: "exit",
            sessionId: currentSessionId,
            messages
          })
        });
      }

      const res = await fetch("/api/mentor/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          action: "new",
          sessionOptions: {
            language: selectedLanguage,
            title: "New Conversation"
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.activeSession) {
          setCurrentSessionId(data.activeSession.id);
        }
        setMessages([]);
        setActiveVisualCanvas(null);
        setSessionEvidenceList([]);
        setConversationalState("IDLE");
        loadHistory(candidateId);
      }
    } catch (err) {
      console.error("Failed to start new session:", err);
      setMessages([]);
      setActiveVisualCanvas(null);
    }
  };

  // Resume an archived session
  const handleResumeSession = async (session: MentorSessionRecord) => {
    stopSpeaking();
    try {
      const res = await fetch("/api/mentor/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          action: "resume",
          sessionId: session.id
        })
      });
      if (res.ok) {
        setCurrentSessionId(session.id);
        setMessages(session.messages || []);
        if (session.language) setSelectedLanguage(session.language);
        setHistoryDrawerOpen(false);
        setConversationalState("IDLE");
      }
    } catch (err) {
      console.error("Failed to resume session:", err);
    }
  };

  // Clean exit to dashboard
  const handleExitSession = async () => {
    stopSpeaking();
    try {
      if (currentSessionId && messages.length > 0) {
        await fetch("/api/mentor/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            action: "exit",
            sessionId: currentSessionId,
            messages
          })
        });
      }
    } catch (err) {
      console.error("Failed to cleanly exit session:", err);
    } finally {
      window.location.href = "/student/dashboard";
    }
  };

  // Toggle "Don't give me the answer"
  const handleToggleDontGiveAnswer = async () => {
    const newVal = !dontGiveAnswerMode;
    setDontGiveAnswerMode(newVal);
    try {
      await fetch("/api/mentor/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          updates: { dontGiveAnswerMode: newVal }
        })
      });
    } catch (_) {}
  };

  // State visuals & copy
  const getStateInfo = () => {
    switch (conversationalState) {
      case "LISTENING":
        return {
          label: "Listening to you...",
          color: "#06b6d4",
          bg: "rgba(6, 182, 212, 0.15)",
          border: "rgba(6, 182, 212, 0.4)",
          pulseScale: "scale(1.18)"
        };
      case "PROCESSING":
      case "RESPONDING":
        return {
          label: "Thinking & deciding next teaching move...",
          color: "#a855f7",
          bg: "rgba(168, 85, 247, 0.15)",
          border: "rgba(168, 85, 247, 0.4)",
          pulseScale: "scale(1.08)"
        };
      case "SPEAKING":
        return {
          label: "Mentor Speaking (tap to interrupt)...",
          color: "#10b981",
          bg: "rgba(16, 185, 129, 0.15)",
          border: "rgba(16, 185, 129, 0.4)",
          pulseScale: "scale(1.15)"
        };
      case "INTERRUPTED":
        return {
          label: "Interrupted. Listening to your point...",
          color: "#f59e0b",
          bg: "rgba(245, 158, 11, 0.15)",
          border: "rgba(245, 158, 11, 0.4)",
          pulseScale: "scale(1.05)"
        };
      case "WAITING_FOR_STUDENT":
        return {
          label: "Your turn to think & respond...",
          color: "#fbbf24",
          bg: "rgba(251, 191, 36, 0.12)",
          border: "rgba(251, 191, 36, 0.35)",
          pulseScale: "scale(1.04)"
        };
      case "ERROR_RECOVERY":
        return {
          label: "Reconnecting gracefully...",
          color: "#f43f5e",
          bg: "rgba(244, 63, 94, 0.15)",
          border: "rgba(244, 63, 94, 0.4)",
          pulseScale: "scale(1)"
        };
      case "IDLE":
      default:
        return {
          label: "Ready to converse. Tap mic or type below.",
          color: "#6366f1",
          bg: "rgba(99, 102, 241, 0.15)",
          border: "rgba(99, 102, 241, 0.35)",
          pulseScale: "scale(1)"
        };
    }
  };

  const stateInfo = getStateInfo();
  const isHeroState = messages.length === 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Top Application Navigation */}
      <AppNav role="student" />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MINIMAL MENTOR HEADER                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          backgroundColor: "rgba(8, 12, 24, 0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "10px 24px"
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Identity & Presence Chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: stateInfo.bg,
                border: `2px solid ${stateInfo.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 12px ${stateInfo.bg}`
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: stateInfo.color }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: "#f1f5f9" }}>COGNALYZE MENTOR</div>
              <div style={{ fontSize: 11, color: stateInfo.color, fontWeight: 500 }}>{stateInfo.label}</div>
            </div>
          </div>

          {/* Contextual Actions & Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Language Selector */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
              {(["hinglish", "en", "hi"] as LanguageCode[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: selectedLanguage === lang ? "rgba(99, 102, 241, 0.25)" : "transparent",
                    color: selectedLanguage === lang ? "#818cf8" : "#94a3b8",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase"
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Hands-Free Voice Toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? "Voice Output Active (Hands-free speech enabled)" : "Muted (Text only)"}
              style={{
                background: voiceEnabled ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                border: voiceEnabled ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: voiceEnabled ? "#34d399" : "#94a3b8",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>{voiceEnabled ? "🔊 Spoken" : "🔇 Muted"}</span>
            </button>

            {/* History Drawer Toggle */}
            <button
              onClick={() => setHistoryDrawerOpen(true)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#cbd5e1",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              📜 Archive
            </button>

            {/* New Session */}
            <button
              onClick={handleStartNewSession}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#cbd5e1",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              ✨ Reset
            </button>

            {/* Clean Exit to Student Dashboard */}
            <button
              onClick={handleExitSession}
              title="End session and return to Dashboard"
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ✕ Exit
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MAIN CONVERSATIONAL STAGE                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 1100, width: "100%", margin: "0 auto", padding: "20px 24px" }}>
        
        {/* Central Conversational Presence (Hero Stage when starting or active) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: isHeroState ? "60px 20px 30px" : "20px 20px 10px",
            transition: "all 0.3s ease"
          }}
        >
          {/* Audio-Reactive Ethereal Orb */}
          <div
            onClick={handleToggleMic}
            title={conversationalState === "SPEAKING" ? "Tap to interrupt mentor" : "Tap to speak with mentor"}
            style={{
              width: isHeroState ? 130 : 70,
              height: isHeroState ? 130 : 70,
              borderRadius: "50%",
              background:
                conversationalState === "SPEAKING"
                  ? "radial-gradient(circle, #34d399 0%, #059669 70%, #064e3b 100%)"
                  : conversationalState === "LISTENING"
                  ? "radial-gradient(circle, #22d3ee 0%, #0891b2 70%, #164e63 100%)"
                  : conversationalState === "INTERRUPTED"
                  ? "radial-gradient(circle, #fbbf24 0%, #d97706 70%, #78350f 100%)"
                  : conversationalState === "WAITING_FOR_STUDENT"
                  ? "radial-gradient(circle, #fde047 0%, #ca8a04 70%, #713f12 100%)"
                  : "radial-gradient(circle, #818cf8 0%, #4f46e5 70%, #312e81 100%)",
              boxShadow: `0 0 ${isHeroState ? "45px" : "25px"} ${stateInfo.bg}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: stateInfo.pulseScale,
              transition: "transform 0.25s ease, box-shadow 0.25s ease"
            }}
          >
            <span style={{ fontSize: isHeroState ? 34 : 20 }}>
              {conversationalState === "SPEAKING" ? "🔊" : conversationalState === "LISTENING" ? "🎙️" : "🧠"}
            </span>
          </div>

          {/* State & Guidance Prompt */}
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <div style={{ fontSize: isHeroState ? 22 : 14, fontWeight: 700, color: "#f8fafc" }}>
              {isHeroState ? "What are we working on?" : stateInfo.label}
            </div>
            {isHeroState && (
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                Speak naturally or type below. No modes or forms required.
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* CONVERSATION & WORKSPACE CANVAS                            */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: activeVisualCanvas ? "1.2fr 1fr" : "1fr", gap: 20, marginTop: 10 }}>
          
          {/* Stream of Spoken Conversational Turns */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "calc(100vh - 340px)", overflowY: "auto", paddingRight: 8 }}>
            {messages.map((msg, idx) => {
              const isMentor = msg.role === "mentor";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignSelf: isMentor ? "flex-start" : "flex-end",
                    maxWidth: isMentor ? "92%" : "80%"
                  }}
                >
                  <div
                    style={{
                      background: isMentor ? "rgba(15, 23, 42, 0.85)" : "linear-gradient(135deg, #6366f1, #4f46e5)",
                      border: isMentor ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
                      borderRadius: 12,
                      padding: "14px 18px",
                      color: "white",
                      fontSize: 14,
                      lineHeight: 1.6,
                      boxShadow: isMentor ? "0 4px 18px rgba(0,0,0,0.2)" : "0 4px 12px rgba(99, 102, 241, 0.25)",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {isMentor && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", letterSpacing: 0.5 }}>COGNALYZE MENTOR</span>
                          {msg.metadata?.teachingAction && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(99, 102, 241, 0.15)",
                                border: "1px solid rgba(99, 102, 241, 0.25)",
                                color: "#a5b4fc",
                                fontWeight: 700,
                                letterSpacing: 0.4
                              }}
                              title={msg.metadata.decisionRationale || "Minimum Effective Intervention selected"}
                            >
                              {msg.metadata.teachingAction}
                            </span>
                          )}
                        </div>
                        {voiceEnabled && (
                          <button
                            onClick={() => speakText(msg.content)}
                            title="Listen to this turn again"
                            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 11 }}
                          >
                            🔊 Listen
                          </button>
                        )}
                      </div>
                    )}
                    {msg.content}
                  </div>

                  {/* Contextual Action Pills (Rendered only on the latest turn) */}
                  {isMentor && idx === messages.length - 1 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, paddingLeft: 2 }}>
                      {/* Dynamic Surface Action Pills if defined by Adaptive Engine */}
                      {activeLearningSurface?.actionPills?.map((pill, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(pill.actionQuery)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 9px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            background: "rgba(99, 102, 241, 0.18)",
                            border: "1px solid rgba(99, 102, 241, 0.35)",
                            color: "#c7d2fe"
                          }}
                        >
                          <span>{pill.label}</span>
                        </button>
                      ))}

                      {/* Standard Fallback Action Pills */}
                      <button
                        onClick={() => handleSendMessage("Give me a hint. Guide my reasoning.")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 9px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: "rgba(245, 158, 11, 0.12)",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          color: "#fbbf24"
                        }}
                      >
                        <span>💡</span>
                        <span>Need a hint?</span>
                      </button>

                      <button
                        onClick={() => handleSendMessage("Explain this using a real-world analogy.")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 9px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: "rgba(56, 189, 248, 0.12)",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          color: "#38bdf8"
                        }}
                      >
                        <span>🔄</span>
                        <span>Analogy</span>
                      </button>

                      <button
                        onClick={handleToggleDontGiveAnswer}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 9px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: dontGiveAnswerMode ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.04)",
                          border: dontGiveAnswerMode ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: dontGiveAnswerMode ? "#34d399" : "#94a3b8"
                        }}
                      >
                        <span>{dontGiveAnswerMode ? "🛡️" : "🔓"}</span>
                        <span>{dontGiveAnswerMode ? "Don't Give Answer (ON)" : "Don't Give Answer"}</span>
                      </button>

                      <button
                        onClick={() => handleSendMessage("Just give me the solution and complete code.")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 9px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: "rgba(239, 68, 68, 0.12)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#f87171"
                        }}
                      >
                        <span>📋</span>
                        <span>Show solution</span>
                      </button>

                      {msg.metadata?.evaluation && (
                        <button
                          onClick={() => setActiveWhyModal(msg.metadata?.evaluation || null)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 9px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            background: "rgba(255, 255, 255, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            color: "#cbd5e1"
                          }}
                        >
                          <span>🔍</span>
                          <span>Why this evaluation?</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* ADAPTIVE LEARNING SURFACE WORKSPACE                        */}
          {/* ══════════════════════════════════════════════════════════ */}
          {(activeLearningSurface || activeVisualCanvas) && (
            <div
              style={{
                background: "rgba(10, 16, 32, 0.92)",
                border: "1px solid rgba(99, 102, 241, 0.35)",
                borderRadius: 14,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                maxHeight: "calc(100vh - 340px)",
                overflowY: "auto",
                boxShadow: "0 8px 30px rgba(0,0,0,0.45)"
              }}
            >
              {/* Workspace Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#818cf8", letterSpacing: 0.5 }}>
                      {activeLearningSurface?.surfaceType === "problem_solving"
                        ? "⚡ LEETCODE WORKSPACE"
                        : activeLearningSurface?.surfaceType === "code_debugging"
                        ? "🔍 DEBUGGING WORKSPACE"
                        : activeLearningSurface?.surfaceType === "system_design"
                        ? "🏛️ SYSTEM DESIGN CANVAS"
                        : activeLearningSurface?.surfaceType === "interview"
                        ? "🎯 MOCK INTERVIEW SIMULATION"
                        : activeLearningSurface?.surfaceType === "quiz_prediction"
                        ? "⚡ PREDICTION CHECKPOINT"
                        : activeLearningSurface?.surfaceType === "visual_interactive"
                        ? "📐 VISUAL EXPLORER"
                        : "🧠 CONCEPT WORKSPACE"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", marginTop: 2 }}>
                    {activeLearningSurface?.title || activeVisualCanvas?.title}
                  </div>
                  {activeLearningSurface?.subtitle && (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{activeLearningSurface.subtitle}</div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setActiveLearningSurface(null);
                    setActiveVisualCanvas(null);
                  }}
                  style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}
                >
                  ✕
                </button>
              </div>

              {/* 1. CONCEPT SURFACE */}
              {activeLearningSurface?.surfaceType === "concept" && activeLearningSurface.conceptVisual && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Visual Call Stack / Pipeline */}
                  <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 10, padding: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {activeLearningSurface.conceptVisual.diagramType === "call_stack" ? "Execution Call Stack (Top to Bottom)" : "Concept Flow"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {activeLearningSurface.conceptVisual.nodes.map((node) => {
                        const isActive = node.id === activeLearningSurface.conceptVisual?.activeNodeId || node.status === "active";
                        return (
                          <div
                            key={node.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              borderRadius: 8,
                              background: isActive ? "rgba(99, 102, 241, 0.22)" : "rgba(255,255,255,0.03)",
                              border: isActive ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.06)",
                              fontSize: 12
                            }}
                          >
                            <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? "#ffffff" : "#cbd5e1" }}>
                              {isActive ? "👉 " : "• "} {node.label}
                            </span>
                            {node.value && (
                              <span style={{ fontSize: 11, color: isActive ? "#38bdf8" : "#94a3b8", fontFamily: "monospace" }}>
                                {node.value}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Analogy Box */}
                  {activeLearningSurface.conceptVisual.analogySnippet && (
                    <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", marginBottom: 4 }}>💡 ANALOGY MENTAL MODEL</div>
                      <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.5 }}>
                        {activeLearningSurface.conceptVisual.analogySnippet}
                      </div>
                    </div>
                  )}

                  {/* Prediction Checkpoint */}
                  {activeLearningSurface.quizCheckpoint && (
                    <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>🎯 PREDICTION CHECKPOINT</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#f8fafc", marginBottom: 10 }}>
                        {activeLearningSurface.quizCheckpoint.question}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {activeLearningSurface.quizCheckpoint.options.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleSendMessage(`Option ${opt.id}: ${opt.text}`)}
                            style={{
                              textAlign: "left",
                              padding: "7px 10px",
                              borderRadius: 6,
                              background: "rgba(0,0,0,0.3)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "#e2e8f0",
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <span style={{ fontWeight: 700, color: "#818cf8" }}>{opt.id}.</span>
                            <span>{opt.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. PROBLEM-SOLVING (LEETCODE) SURFACE */}
              {activeLearningSurface?.surfaceType === "problem_solving" && activeLearningSurface.problemWorkspace && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Progressive Steps Indicator */}
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {["Understanding", "Constraints", "Approach", "Code", "Testing"].map((stepName, sIdx) => {
                      const currentStep = (activeLearningSurface.progressiveStep || "problem_understanding").toLowerCase();
                      const isCurrent = currentStep.includes(stepName.toLowerCase());
                      return (
                        <div
                          key={sIdx}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            background: isCurrent ? "rgba(99, 102, 241, 0.3)" : "rgba(255,255,255,0.04)",
                            border: isCurrent ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.06)",
                            color: isCurrent ? "#c7d2fe" : "#64748b",
                            textTransform: "uppercase"
                          }}
                        >
                          {sIdx + 1}. {stepName}
                        </div>
                      );
                    })}
                  </div>

                  {/* Problem Description & Examples */}
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: "#ffffff", marginBottom: 6 }}>Problem Statement:</div>
                    {activeLearningSurface.problemWorkspace.description}
                  </div>

                  {/* Constraints */}
                  {activeLearningSurface.problemWorkspace.constraints?.length > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>CONSTRAINTS:</div>
                      {activeLearningSurface.problemWorkspace.constraints.map((c, cIdx) => (
                        <div key={cIdx} style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>• {c}</div>
                      ))}
                    </div>
                  )}

                  {/* Code Workspace */}
                  {activeLearningSurface.problemWorkspace.codeStarter && (
                    <pre
                      style={{
                        background: "rgba(0,0,0,0.5)",
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 11,
                        color: "#34d399",
                        fontFamily: "monospace",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.4,
                        border: "1px solid rgba(16, 185, 129, 0.2)"
                      }}
                    >
                      {activeLearningSurface.problemWorkspace.codeStarter}
                    </pre>
                  )}
                </div>
              )}

              {/* 3. DEBUGGING SURFACE */}
              {activeLearningSurface?.surfaceType === "code_debugging" && activeLearningSurface.debuggingWorkspace && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: 8, padding: 10, fontSize: 11, color: "#fca5a5" }}>
                    ⚠️ {activeLearningSurface.debuggingWorkspace.errorLog || "Runtime Exception Detected"}
                  </div>

                  {/* Code with Line Highlighting */}
                  <pre
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#e2e8f0",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.5,
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    {activeLearningSurface.debuggingWorkspace.codeSnippet}
                  </pre>

                  {/* Variable Inspector */}
                  {activeLearningSurface.debuggingWorkspace.variableInspector && (
                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", marginBottom: 6 }}>RUNTIME VARIABLE INSPECTOR:</div>
                      {activeLearningSurface.debuggingWorkspace.variableInspector.map((v, vIdx) => (
                        <div key={vIdx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#cbd5e1", padding: "3px 0" }}>
                          <span style={{ fontFamily: "monospace" }}>{v.name}</span>
                          <span style={{ color: "#f87171", fontFamily: "monospace" }}>{v.actualValue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. SYSTEM DESIGN SURFACE */}
              {activeLearningSurface?.surfaceType === "system_design" && activeLearningSurface.systemDesignCanvas && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Traffic Banner */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>Scale Tier:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>{activeLearningSurface.systemDesignCanvas.trafficQps.toLocaleString()} QPS ({activeLearningSurface.systemDesignCanvas.scaleTier})</span>
                  </div>

                  {/* Component Topology */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {activeLearningSurface.systemDesignCanvas.activeComponents.map((comp) => {
                      const isBottleneck = comp.status === "bottleneck";
                      const isOverloaded = comp.status === "overloaded";
                      return (
                        <div
                          key={comp.id}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            background: isBottleneck ? "rgba(239, 68, 68, 0.15)" : isOverloaded ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.03)",
                            border: isBottleneck ? "1px solid #ef4444" : isOverloaded ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.06)",
                            fontSize: 11
                          }}
                        >
                          <div style={{ fontWeight: 700, color: isBottleneck ? "#fca5a5" : "#f8fafc" }}>{comp.name}</div>
                          <div style={{ fontSize: 10, color: isBottleneck ? "#ef4444" : "#94a3b8", textTransform: "capitalize", marginTop: 2 }}>
                            Status: {comp.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottleneck Alert */}
                  {activeLearningSurface.systemDesignCanvas.currentBottleneck && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: 10, fontSize: 11, color: "#f87171" }}>
                      🚨 Bottleneck: {activeLearningSurface.systemDesignCanvas.currentBottleneck}
                    </div>
                  )}
                </div>
              )}

              {/* 5. INTERVIEW SURFACE */}
              {activeLearningSurface?.surfaceType === "interview" && activeLearningSurface.interviewWorkspace && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 8, padding: 10, fontSize: 11, color: "#a5b4fc", fontWeight: 700 }}>
                    QUESTION {activeLearningSurface.interviewWorkspace.questionIndex} OF {activeLearningSurface.interviewWorkspace.totalQuestions}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", lineHeight: 1.5 }}>
                    {activeLearningSurface.interviewWorkspace.currentQuestion}
                  </div>

                  {/* Live Rubric Indicator */}
                  <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 6 }}>INTERVIEW EVALUATION RUBRICS:</div>
                    {activeLearningSurface.interviewWorkspace.evaluationRubric.map((r, rIdx) => (
                      <div key={rIdx} style={{ fontSize: 11, color: "#cbd5e1", padding: "3px 0" }}>
                        <span style={{ fontWeight: 600 }}>• {r.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. VISUAL INTERACTIVE & QUIZ / FALLBACK CANVAS */}
              {(!activeLearningSurface || (activeLearningSurface.surfaceType !== "concept" && activeLearningSurface.surfaceType !== "problem_solving" && activeLearningSurface.surfaceType !== "code_debugging" && activeLearningSurface.surfaceType !== "system_design" && activeLearningSurface.surfaceType !== "interview")) && activeVisualCanvas && (
                <pre
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#e2e8f0",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                    overflowX: "auto"
                  }}
                >
                  {activeVisualCanvas.content}
                </pre>
              )}

              {activeVisualCanvas?.highlightSnippet && (
                <div style={{ marginTop: 10, fontSize: 11, color: "#fbbf24", background: "rgba(245, 158, 11, 0.1)", padding: "6px 10px", borderRadius: 6 }}>
                  👉 Focus Area: {activeVisualCanvas.highlightSnippet}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* CONVERSATIONAL INPUT & BARGE-IN MICROPHONE                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            marginTop: 16,
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 14,
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 4px 25px rgba(0,0,0,0.3)"
          }}
        >
          {/* Audio Input Mic */}
          <button
            onClick={handleToggleMic}
            title={conversationalState === "LISTENING" ? "Listening (tap to stop)" : "Speak to Mentor"}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: conversationalState === "LISTENING" ? "#ef4444" : "rgba(99, 102, 241, 0.2)",
              border: conversationalState === "LISTENING" ? "1px solid #f87171" : "1px solid rgba(99, 102, 241, 0.4)",
              color: conversationalState === "LISTENING" ? "white" : "#a5b4fc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 16
            }}
          >
            {conversationalState === "LISTENING" ? "⏹️" : "🎙️"}
          </button>

          {/* Natural Speech / Text Fallback Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              conversationalState === "LISTENING"
                ? "Listening... (or type here)"
                : conversationalState === "SPEAKING"
                ? "Mentor speaking... (say 'Wait' or speak to interrupt)"
                : "Ask, explain, or say what you want to learn..."
            }
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: 14,
              outline: "none",
              padding: "6px 4px"
            }}
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
            style={{
              background: inputText.trim() ? "#4f46e5" : "rgba(255,255,255,0.05)",
              color: inputText.trim() ? "white" : "#64748b",
              border: "none",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: inputText.trim() ? "pointer" : "default"
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* HISTORY & EVIDENCE DRAWER                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {historyDrawerOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: 380,
            background: "#0a0f20",
            borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
            zIndex: 50,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Conversation Archive</h3>
            <button
              onClick={() => setHistoryDrawerOpen(false)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {historySessions.length === 0 ? (
              <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginTop: 40 }}>No past sessions recorded yet.</div>
            ) : (
              historySessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => handleResumeSession(sess)}
                  style={{
                    background: sess.id === currentSessionId ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
                    border: sess.id === currentSessionId ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 8,
                    padding: 12,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{sess.title || "Mentor Session"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {sess.messages?.length || 0} turns • {new Date(sess.startedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* WHY EVALUATION PROVENANCE MODAL                             */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeWhyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            style={{
              background: "#0c1326",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: 14,
              maxWidth: 500,
              width: "100%",
              padding: 24,
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#818cf8" }}>Evidence Justification (Why?)</div>
              <button
                onClick={() => setActiveWhyModal(null)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: "#94a3b8" }}>Demonstrated Concept: </span>
                <span style={{ fontWeight: 600 }}>{activeWhyModal.concept}</span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: "#94a3b8" }}>Demonstrated State: </span>
                <span style={{ fontWeight: 600, color: "#34d399" }}>{activeWhyModal.demonstratedState}</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={{ color: "#94a3b8" }}>Assistance Level: </span>
                <span>{activeWhyModal.assistanceLevel}</span>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, borderLeft: "3px solid #818cf8", fontSize: 12 }}>
                {activeWhyModal.whyExplanation}
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setActiveWhyModal(null)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
