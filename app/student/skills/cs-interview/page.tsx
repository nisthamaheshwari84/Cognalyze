"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CSInterviewQuestion, SEED_CS_INTERVIEW_QUESTIONS } from "@/lib/skill-hub-store";
import {
  generateSessionBrief,
  getAdaptiveQuestion,
  generatePostSessionFeedback,
  getStudentProfile,
  AdaptiveQuestionItem,
  AdaptiveEvaluationResult,
  PostSessionFeedback,
  SessionBrief
} from "@/lib/skills/adaptive-engine";
import SessionBriefModal from "@/components/skills/SessionBriefModal";

export default function CSInterviewPage() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [trackSlug, setTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");

  const [mode, setMode] = useState<"learn" | "practice" | "coach" | "interview" | "bank">("interview");
  const [selectedLearnTopic, setSelectedLearnTopic] = useState<"btree" | "isolation" | "process" | "tcp">("btree");
  const [learnCheckpointAnswer, setLearnCheckpointAnswer] = useState<number | null>(null);
  const [learnCheckpointRevealed, setLearnCheckpointRevealed] = useState(false);
  const [coachLog, setCoachLog] = useState<{ sender: "coach" | "candidate"; text: string }[]>([
    {
      sender: "coach",
      text: "Hello! I am your Socratic CS Fundamentals Coach. I observe your query structures and concurrency reasoning. What trade-off are you analyzing?"
    }
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [sessionBrief, setSessionBrief] = useState<SessionBrief | null>(null);
  const [showBriefModal, setShowBriefModal] = useState(false);

  // Bank Mode state
  const [questions, setQuestions] = useState<CSInterviewQuestion[]>(SEED_CS_INTERVIEW_QUESTIONS);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(SEED_CS_INTERVIEW_QUESTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  // Live Adaptive Interview State
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestionItem | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    speaker: "interviewer" | "candidate";
    text: string;
    codeSnippet?: string;
    type?: string;
    evaluation?: AdaptiveEvaluationResult;
  }>>([]);

  const [activeFollowUpPrompt, setActiveFollowUpPrompt] = useState<{
    type: string;
    question: string;
    reason: string;
  } | null>(null);

  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [turnEvaluations, setTurnEvaluations] = useState<AdaptiveEvaluationResult[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [postFeedback, setPostFeedback] = useState<PostSessionFeedback | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 min per question

  // Audio Speech Synthesis
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speech output helper
  const speakText = (text: string) => {
    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB") || v.lang.includes("en-IN"));
      if (englishVoice) utterance.voice = englishVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  useEffect(() => {
    const storedId = searchParams.get("candidateId") || localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(storedId);

    const paramTrack = searchParams.get("track") as any;
    const initialTrack = paramTrack || "product_mid";
    setTrackSlug(initialTrack);

    // Generate Session Brief
    const brief = generateSessionBrief(initialTrack, "cs_fundamentals", storedId);
    setSessionBrief(brief);

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
  }, [searchParams]);

  // Timer countdown during live mock interview
  useEffect(() => {
    let timer: any = null;
    if (interviewStarted && !sessionCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [interviewStarted, sessionCompleted, timeLeft]);

  // Start Live Adaptive Interview
  const handleStartAdaptiveSession = (isRetry: boolean = false) => {
    const firstQ = getAdaptiveQuestion(trackSlug, "cs_fundamentals", 0, undefined, candidateId, isRetry);
    setCurrentQuestion(firstQ);
    setTurnIndex(0);
    setInterviewStarted(true);
    setSessionCompleted(false);
    setPostFeedback(null);
    setTurnEvaluations([]);
    setActiveFollowUpPrompt(null);
    setCandidateAnswer("");
    setTimeLeft(300);

    const greeting = `Hello, I am Alex, Lead Technical Interviewer for your ${trackSlug.replace("_", " ")} round. Let's begin with our first problem: ${firstQ.topic}. ${firstQ.question}`;
    
    setConversationHistory([
      {
        speaker: "interviewer",
        text: `${firstQ.topic}: ${firstQ.question}`
      }
    ]);

    speakText(greeting);
  };

  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser. Please type or paste your response in the editor.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Submit Answer / Code for Adaptive Evaluation & Follow-Up
  const handleSubmitTurn = async () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    if (!candidateAnswer.trim()) {
      alert("Please provide your answer, query, or technical reasoning.");
      return;
    }

    setEvaluating(true);

    // Append candidate turn to history
    const updatedHistory = [
      ...conversationHistory,
      {
        speaker: "candidate" as const,
        text: candidateAnswer,
        codeSnippet: candidateAnswer.includes("SELECT") || candidateAnswer.includes("class") || candidateAnswer.includes("def ") ? candidateAnswer : undefined
      }
    ];
    setConversationHistory(updatedHistory);

    try {
      const res = await fetch("/api/skills/cs-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion?.id,
          questionText: currentQuestion?.question,
          candidateAnswer,
          candidateId,
          trackSlug,
          turnIndex
        })
      });

      const data = await res.json();
      const evalData: AdaptiveEvaluationResult = data.evaluation;
      const nextEvals = [...turnEvaluations, evalData];
      setTurnEvaluations(nextEvals);

      // Section 8 & 9: Real-time Follow-Up Probe!
      if (evalData.nextFollowUp && !activeFollowUpPrompt) {
        setActiveFollowUpPrompt(evalData.nextFollowUp);
        const followUpText = evalData.nextFollowUp.question;
        
        setConversationHistory([
          ...updatedHistory,
          {
            speaker: "interviewer",
            text: `[${evalData.nextFollowUp.type} PROBE]: ${followUpText}`,
            type: evalData.nextFollowUp.type,
            evaluation: evalData
          }
        ]);

        speakText(followUpText);
        setCandidateAnswer("");
      } else {
        // We already followed up or evaluated turn 2. Proceed to next question or conclude.
        if (turnIndex < 1) {
          // Advance to Turn 2 (Adaptive OS/Concurrency or Deeper DB)
          const nextQ = getAdaptiveQuestion(trackSlug, "cs_fundamentals", 1, candidateAnswer, candidateId);
          setCurrentQuestion(nextQ);
          setTurnIndex(prev => prev + 1);
          setActiveFollowUpPrompt(null);
          setCandidateAnswer("");
          setTimeLeft(300);

          setConversationHistory(prev => [
            ...prev,
            {
              speaker: "interviewer",
              text: `Next technical focus: ${nextQ.topic}. ${nextQ.question}`
            }
          ]);

          speakText(`Good explanation. Let's move to our next problem. ${nextQ.question}`);
        } else {
          // Conclude interview session and compile Post-Session Feedback (Section 34, 35)
          setSessionCompleted(true);
          const feedback = generatePostSessionFeedback(trackSlug, "cs_fundamentals", nextEvals, candidateId);
          setPostFeedback(feedback);
          speakText("That concludes our technical screening round. I have synthesized your evidence and prepared your post-session dossier.");
        }
      }
    } catch (err) {
      console.error("CS Turn evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleGenerateFreshUnseen = () => {
    const fresh = getAdaptiveQuestion(trackSlug, "cs_fundamentals", turnIndex, undefined, candidateId, true);
    setCurrentQuestion(fresh);
    setCandidateAnswer("");
    setActiveFollowUpPrompt(null);
    setConversationHistory(prev => [
      ...prev,
      {
        speaker: "interviewer",
        text: `[FRESH UNSEEN SCENARIO]: ${fresh.topic}. ${fresh.question}`
      }
    ]);
    speakText(fresh.question);
  };

  const profile = getStudentProfile(candidateId);

  // Bank Filtered Questions
  const filteredQuestions = questions.filter(q => {
    const matchDomain = selectedDomain === "all" || q.domain === selectedDomain;
    const matchSearch = !searchQuery || q.topic.toLowerCase().includes(searchQuery.toLowerCase()) || q.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDomain && matchSearch;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(16px)", padding: "14px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Link href="/student/skills" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 700 }}>Adaptive Technical Round</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
              <span>💻</span>
              <span>CS Fundamentals • Live Technical Interview Arena</span>
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Track Indicator */}
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", fontWeight: 800 }}>
              🎯 {trackSlug.replace("_", " ").toUpperCase()} TRACK
            </span>

            {/* Mode Switcher (Section 4) */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", padding: 3, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
              {[
                { id: "learn", label: "💡 Learn", color: "#38bdf8" },
                { id: "practice", label: "🛠️ Practice", color: "#34d399" },
                { id: "coach", label: "🎓 Coach", color: "#fbbf24" },
                { id: "interview", label: "🎯 Interview", color: "#c084fc" },
                { id: "bank", label: "📚 Bank", color: "#94a3b8" }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 7,
                    border: "none",
                    background: mode === m.id ? "rgba(255,255,255,0.12)" : "transparent",
                    color: mode === m.id ? m.color : "#94a3b8",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Audio Voice Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                background: soundEnabled ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                border: soundEnabled ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.1)",
                color: soundEnabled ? "#34d399" : "#94a3b8",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 700
              }}
            >
              {soundEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>

        {/* ══════════════════════════════════════════════════════════════
            MODE 1: LEARN MODE (Socratic CS Tutor, Invariant Checkpoints)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "learn" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", borderRadius: 6, fontWeight: 800 }}>
                  CONCEPTUAL LESSON
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Safe Learning Mode • Explain ➔ Checkpoint ➔ Advance
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 10px", color: "white" }}>
                {selectedLearnTopic === "btree" && "B-Tree Composite Indexing & The Leftmost Prefix Rule"}
                {selectedLearnTopic === "isolation" && "Database Transaction Isolation Levels & Deadlock Interleaving"}
                {selectedLearnTopic === "process" && "Process vs Thread Concurrency & Memory Segments"}
                {selectedLearnTopic === "tcp" && "TCP 3-Way Handshake & Congestion Control Windows"}
              </h2>

              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: "0 0 14px" }}>
                {selectedLearnTopic === "btree" && "A composite B-Tree index on (A, B, C) sorts records lexicographically by A first, then B within identical A's, then C. Because the tree is structured like a phonebook (LastName, FirstName), querying solely on B and C prevents the database from performing a direct B-Tree point seek."}
                {selectedLearnTopic === "isolation" && "The ANSI SQL standard defines four isolation levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable. Deadlocks occur when two transactions concurrently acquire locks in reverse topological order (e.g. Tx1 locks Row A then wants Row B; Tx2 locks Row B then wants Row A)."}
                {selectedLearnTopic === "process" && "A process owns an independent virtual address space containing Text, Data, Heap, and Stack. Threads share the same address space and Heap, but each thread possesses its own private Call Stack and Program Counter, requiring synchronization primitives (mutexes, semaphores) to guard shared heap memory."}
                {selectedLearnTopic === "tcp" && "TCP guarantees reliable in-order byte streams via SYN, SYN-ACK, ACK. Congestion control dynamically sizes the Congestion Window (CWND) using Slow Start, Congestion Avoidance (Additive Increase / Multiplicative Decrease), and Fast Retransmit upon receiving 3 duplicate ACKs."}
              </p>

              {/* Socratic Checkpoint */}
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", marginBottom: 6 }}>
                  CHECKPOINT: Invariant Verification
                </div>
                <div style={{ fontSize: 12, color: "white", fontWeight: 700, marginBottom: 10 }}>
                  Given a composite index on <code>(status, created_at, user_id)</code>, which query can fully execute a range index scan without a full table scan?
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "A. SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '1 day';",
                    "B. SELECT * FROM orders WHERE status = 'SHIPPED' AND created_at >= '2026-01-01';",
                    "C. SELECT * FROM orders WHERE user_id = 42;",
                    "D. SELECT * FROM orders WHERE created_at = '2026-01-01' AND user_id = 42;"
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLearnCheckpointAnswer(idx);
                        setLearnCheckpointRevealed(true);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: learnCheckpointAnswer === idx ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.12)",
                        background: learnCheckpointAnswer === idx
                          ? (idx === 1 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)")
                          : "rgba(0,0,0,0.3)",
                        color: "white",
                        fontSize: 11,
                        textAlign: "left",
                        cursor: "pointer"
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {learnCheckpointRevealed && (
                  <div style={{ marginTop: 10, fontSize: 11, color: learnCheckpointAnswer === 1 ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                    {learnCheckpointAnswer === 1
                      ? "✓ Correct! Query B satisfies the leftmost prefix: 'status' is matched with equality, allowing a direct range scan on 'created_at'."
                      : "Notice: The index must be traversed from the leftmost column. Without filtering on 'status', the database cannot seek into the tree."}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Demonstrated: Conceptual Invariant Verified
                </span>
                <button
                  onClick={() => setMode("practice")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Apply in Guided Scenario Practice ➔
                </button>
              </div>
            </div>

            {/* Right: Topics List */}
            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 18 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", marginBottom: 10 }}>
                CS Fundamentals Modules
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { id: "btree", title: "B-Tree Leftmost Prefix", status: "Developing", tag: "DBMS" },
                  { id: "isolation", title: "Transaction Isolation & Deadlocks", status: "Demonstrated", tag: "DBMS" },
                  { id: "process", title: "Process vs Thread Memory", status: "Demonstrated", tag: "OS" },
                  { id: "tcp", title: "TCP Handshake & Congestion", status: "Developing", tag: "Networks" }
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedLearnTopic(item.id as any);
                      setLearnCheckpointAnswer(null);
                      setLearnCheckpointRevealed(false);
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: selectedLearnTopic === item.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                      border: selectedLearnTopic === item.id ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{item.title}</div>
                      <div style={{ fontSize: 10, color: "#818cf8" }}>{item.tag}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: item.status === "Demonstrated" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)", color: item.status === "Demonstrated" ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 2: PRACTICE MODE (Guided Scenarios & Scaffolding)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "practice" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 22 }}>
              <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(52,211,153,0.2)", color: "#34d399", borderRadius: 4, fontWeight: 800 }}>
                GUIDED SCENARIO CHALLENGE
              </span>
              <h2 style={{ fontSize: 17, fontWeight: 900, margin: "8px 0 6px", color: "white" }}>
                Diagnose Slow Composite Query with EXPLAIN ANALYZE
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: "0 0 12px" }}>
                A table with 5,000,000 order records is taking 1,850ms to execute:
                <code>SELECT * FROM orders WHERE tenant_id = 902 AND status = &apos;PAID&apos; ORDER BY created_at DESC LIMIT 50;</code>
              </p>

              <div style={{ padding: "10px 14px", background: "#080b12", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>Current Index:</div>
                <code style={{ fontSize: 12, color: "#38bdf8" }}>CREATE INDEX idx_orders_status ON orders(status);</code>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4, fontWeight: 700 }}>
                  Write your proposed optimal index & explain execution plan changes:
                </label>
                <textarea
                  placeholder="CREATE INDEX idx_optimal ON orders(tenant_id, status, created_at DESC);&#10;&#10;Explanation: tenant_id has high selectivity. Putting (tenant_id, status) first satisfies equality filters, and created_at DESC matches the ORDER BY clause, eliminating an expensive in-memory sort node."
                  rows={6}
                  style={{ width: "100%", background: "#04060a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: 10, color: "white", fontSize: 12, outline: "none", lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#34d399" }}>
                  Demonstrates Application Evidence
                </span>
                <button
                  onClick={() => setMode("interview")}
                  style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                >
                  Ready for Interview Round ➔
                </button>
              </div>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 18 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: "#34d399", textTransform: "uppercase", marginBottom: 10 }}>
                Practice Scaffolding Hints
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Hint 1: Check the equality columns first. Indexes should order equality constraints before range and sort columns.",
                  "Hint 2: Including 'created_at DESC' in the index eliminates the need for an external quicksort buffer.",
                  "Hint 3: Consider index-only scans (covering index) by appending selected projection columns."
                ].map((hint, idx) => (
                  <div key={idx} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                    {hint}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 3: COACH MODE (Socratic Technical Feedback)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "coach" && (
          <div style={{ maxWidth: 840, margin: "0 auto", background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(251, 191, 36, 0.35)", borderRadius: 16, padding: 22, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>🎓</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: "#fbbf24", margin: 0 }}>
                  Socratic CS Fundamentals Coach
                </h2>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Discuss query plans, transaction isolation, and locking trade-offs without giving away answers
                </div>
              </div>
            </div>

            <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {coachLog.map((c, i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: c.sender === "coach" ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)", border: c.sender === "coach" ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.08)", fontSize: 12, lineHeight: 1.5 }}>
                  <strong>{c.sender === "coach" ? "🎓 Coach: " : "👤 You: "}</strong>
                  {c.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={coachInput}
                onChange={e => setCoachInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && coachInput.trim()) {
                    const text = coachInput.trim();
                    setCoachInput("");
                    setCoachLog(prev => [...prev, { sender: "candidate", text }]);
                    setTimeout(() => {
                      setCoachLog(prev => [...prev, { sender: "coach", text: "Notice how column selectivity impacts your index tree traversal. If tenant_id has 10,000 distinct values while status has only 3, which one drastically prunes the search space first?" }]);
                    }, 400);
                  }
                }}
                placeholder="Ask about your index plan or transaction locking order..."
                style={{ flex: 1, background: "#080b12", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 11, outline: "none" }}
              />
              <button
                onClick={() => {
                  if (!coachInput.trim()) return;
                  const text = coachInput.trim();
                  setCoachInput("");
                  setCoachLog(prev => [...prev, { sender: "candidate", text }]);
                  setTimeout(() => {
                    setCoachLog(prev => [...prev, { sender: "coach", text: "Notice how column selectivity impacts your index tree traversal. If tenant_id has 10,000 distinct values while status has only 3, which one drastically prunes the search space first?" }]);
                  }, 400);
                }}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#fbbf24", color: "#080b12", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
              >
                Ask Coach
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 4: LIVE ADAPTIVE INTERVIEW SIMULATION (PRIMARY)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "interview" && (
          <div>
            {!interviewStarted ? (
              /* Pre-Session Brief Card (Section 33) */
              <div style={{ maxWidth: 800, margin: "20px auto", background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.6) 100%)", border: "1px solid rgba(99, 102, 241, 0.35)", borderRadius: 18, padding: "28px 32px", boxShadow: "0 15px 35px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(99,102,241,0.25)", color: "#c7d2fe", borderRadius: 6, fontWeight: 800, textTransform: "uppercase" }}>
                      SESSION BRIEF
                    </span>
                    <h2 style={{ fontSize: 22, fontWeight: 900, margin: "8px 0 4px", color: "white" }}>
                      {sessionBrief?.title}
                    </h2>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      Candidate: <strong style={{ color: "#38bdf8" }}>{profile.name}</strong> • Track: <strong style={{ color: "#a5b4fc" }}>{sessionBrief?.trackName}</strong>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(168,85,247,0.2)", color: "#c084fc", fontWeight: 700 }}>
                    {sessionBrief?.difficultyLevel}
                  </span>
                </div>

                <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>
                    Why This Session
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
                    {sessionBrief?.whyThisSession}
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>
                    Key Focus Areas
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sessionBrief?.focusAreas.map((f, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(99,102,241,0.15)", color: "#c7d2fe", border: "1px solid rgba(99,102,241,0.3)" }}>
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    ⏱️ Estimated Time: <strong>{sessionBrief?.estimatedMinutes} Minutes</strong>
                  </div>
                  <button
                    onClick={() => handleStartAdaptiveSession(false)}
                    style={{
                      padding: "12px 28px",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)"
                    }}
                  >
                    <span>Begin Adaptive Interview</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            ) : !sessionCompleted ? (
              /* Active Adaptive Interview Simulation (Section 13, 14) */
              <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) 1fr", gap: 20, alignItems: "start" }}>
                
                {/* Left Panel: Lead Interviewer & Conversational Transcript */}
                <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        👨‍💻
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>Alex • Lead Interviewer</div>
                        <div style={{ fontSize: 10, color: "#34d399" }}>● Live Session Active</div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "#fbbf24", fontWeight: 700 }}>
                      ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                    </div>
                  </div>

                  {/* Conversation Feed */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
                    {conversationHistory.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: item.speaker === "interviewer" ? "flex-start" : "flex-end",
                          maxWidth: "90%",
                          padding: "10px 14px",
                          borderRadius: 12,
                          background: item.speaker === "interviewer"
                            ? item.type ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)"
                            : "rgba(56, 189, 248, 0.15)",
                          border: item.speaker === "interviewer"
                            ? item.type ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid rgba(99, 102, 241, 0.25)"
                            : "1px solid rgba(56, 189, 248, 0.25)",
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: "white"
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 800, color: item.speaker === "interviewer" ? (item.type ? "#fbbf24" : "#a5b4fc") : "#38bdf8", marginBottom: 3 }}>
                          {item.speaker === "interviewer" ? (item.type ? `⚡ INTERVIEWER ${item.type} PROBE` : "INTERVIEWER") : "YOU"}
                        </div>
                        <div>{item.text}</div>
                        {item.evaluation && (
                          <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 11, color: "#34d399" }}>
                            Score: {item.evaluation.score}/100 • Verdict: {item.evaluation.verdict}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Bar */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
                    <button
                      onClick={handleGenerateFreshUnseen}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.04)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      ✨ Fresh Scenario
                    </button>
                    <button
                      onClick={() => {
                        setSessionCompleted(true);
                        const feedback = generatePostSessionFeedback(trackSlug, "cs_fundamentals", turnEvaluations, candidateId);
                        setPostFeedback(feedback);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(239, 68, 68, 0.2)",
                        color: "#f87171",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      End Early
                    </button>
                  </div>
                </div>

                {/* Right Panel: Active Question & Interactive Code / Query IDE */}
                <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 22 }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", fontWeight: 800 }}>
                        {currentQuestion?.domain.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        Depth: <strong>{currentQuestion?.depthLevel}</strong>
                      </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px", color: "white" }}>
                      {currentQuestion?.topic}
                    </h3>
                    <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.9)", whiteSpace: "pre-line" }}>
                      {currentQuestion?.question}
                    </div>
                  </div>

                  {/* Active Follow-Up Alert Banner if Interviewer Interrupted */}
                  {activeFollowUpPrompt && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.35)", marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 2 }}>
                        ⚡ Interviewer Interjected: [{activeFollowUpPrompt.type}]
                      </div>
                      <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>
                        {activeFollowUpPrompt.question}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                        Reason: {activeFollowUpPrompt.reason}
                      </div>
                    </div>
                  )}

                  {/* Code / Technical Answer Editor */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>
                        CODE / SQL / ARCHITECTURAL EXPLANATION
                      </div>
                      <button
                        onClick={toggleRecording}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: isRecording ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.15)",
                          background: isRecording ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                          color: isRecording ? "#f87171" : "white",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {isRecording ? "🔴 Listening... (Click to stop)" : "🎙️ Dictate Spoken Answer"}
                      </button>
                    </div>

                    <textarea
                      value={candidateAnswer}
                      onChange={e => setCandidateAnswer(e.target.value)}
                      placeholder="Write your SQL query, Python/Java solution, or walk through your architectural trade-offs here..."
                      rows={12}
                      style={{
                        width: "100%",
                        background: "#080b12",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        padding: 14,
                        color: "#38bdf8",
                        fontFamily: "'Fira Code', 'Courier New', monospace",
                        fontSize: 13,
                        lineHeight: 1.5,
                        resize: "vertical",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Submission Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                      Pro-tip: Explicitly justify your trade-offs to trigger deeper L5 questions.
                    </div>

                    <button
                      onClick={handleSubmitTurn}
                      disabled={evaluating}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: evaluating ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 15px rgba(99,102,241,0.3)"
                      }}
                    >
                      {evaluating ? "Interviewer Evaluating..." : activeFollowUpPrompt ? "Submit Follow-Up Response ➔" : "Submit Answer & Defend ➔"}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Post-Session Feedback & Evidence Dossier (Section 34, 35, 38) */
              postFeedback && (
                <div style={{ maxWidth: 900, margin: "20px auto", background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(99, 102, 241, 0.35)", borderRadius: 20, padding: 30, boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
                  
                  {/* Dossier Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div>
                      <div style={{ fontSize: 10, padding: "2px 8px", background: "rgba(16,185,129,0.2)", color: "#34d399", borderRadius: 6, fontWeight: 800, display: "inline-block", marginBottom: 6 }}>
                        VERIFIED EVIDENCE DOSSIER
                      </div>
                      <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "white" }}>
                        Post-Session Technical Diagnostic Dossier
                      </h2>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                        Track: <strong style={{ color: "white" }}>{postFeedback.trackName}</strong> • Domain: <strong style={{ color: "#818cf8" }}>{postFeedback.domainName}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartAdaptiveSession(false)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.05)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      ↺ New Session
                    </button>
                  </div>

                  {/* Section 34: What You Demonstrated vs Uncertain vs Weak */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
                    
                    {/* Demonstrated */}
                    <div style={{ padding: 16, borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase", marginBottom: 8 }}>
                        ✓ WHAT YOU DEMONSTRATED
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                        {postFeedback.demonstrated.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Uncertain */}
                    <div style={{ padding: 16, borderRadius: 12, background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", marginBottom: 8 }}>
                        △ WHAT REMAINS UNCERTAIN
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                        {postFeedback.uncertain.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div style={{ padding: 16, borderRadius: 12, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#f87171", textTransform: "uppercase", marginBottom: 8 }}>
                        ⚠️ WHAT WAS WEAK
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                        {postFeedback.weaknesses.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Why Reasoning */}
                  <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", marginBottom: 4 }}>
                      WHY THIS EVALUATION
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                      {postFeedback.whyReasoning}
                    </p>
                  </div>

                  {/* Section 38: Personalized Retry ("RETRY DIFFERENTLY") */}
                  <div style={{ padding: 18, borderRadius: 14, background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)", border: "1px solid rgba(168,85,247,0.35)", marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, padding: "2px 8px", background: "rgba(168,85,247,0.3)", color: "#e9d5ff", borderRadius: 6, fontWeight: 800, display: "inline-block", marginBottom: 4 }}>
                          ADAPTIVE RETRY
                        </div>
                        <h4 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px", color: "white" }}>
                          {postFeedback.retryScenario.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                          {postFeedback.retryScenario.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleStartAdaptiveSession(true)}
                        style={{
                          padding: "10px 18px",
                          borderRadius: 8,
                          border: "none",
                          background: "#a855f7",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        {postFeedback.retryScenario.ctaLabel}
                      </button>
                    </div>
                  </div>

                  {/* Section 37: Next Best Action Recommendation */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                        RECOMMENDED NEXT PRACTICE ACTION
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginTop: 2 }}>
                        {postFeedback.nextBestAction.title}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                        {postFeedback.nextBestAction.reason}
                      </div>
                    </div>

                    <Link href={postFeedback.nextBestAction.ctaHref} style={{ textDecoration: "none" }}>
                      <button
                        style={{
                          padding: "10px 22px",
                          borderRadius: 10,
                          border: "none",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span>{postFeedback.nextBestAction.ctaLabel}</span>
                      </button>
                    </Link>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 2: REFERENCE QUESTION BANK (SECONDARY LAYER)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "bank" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "white" }}>
                  CS Fundamentals Reference Knowledge Bank
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  Reference layer used as raw diagnostic material by the adaptive engine.
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Filter by keyword (e.g. index, deadlock, OOP)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    color: "white",
                    fontSize: 12,
                    outline: "none",
                    width: 260
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
              {filteredQuestions.map(q => (
                <div
                  key={q.id}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 16
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", fontWeight: 700 }}>
                      {q.domain.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>
                      {q.company_tag || "General"}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 6px", color: "white" }}>
                    {q.topic}
                  </h4>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4, margin: "0 0 10px" }}>
                    {q.question}
                  </p>
                  <button
                    onClick={() => {
                      setMode("interview");
                      handleStartAdaptiveSession(false);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "rgba(99,102,241,0.2)",
                      color: "#c7d2fe",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Practice in Live Interview ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
