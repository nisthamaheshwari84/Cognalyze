"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BehavioralQuestionFull,
  MicroLearnScenario,
  SingleImprovementEvaluation,
  CoachDiagnosticResult,
  SimpleCandidateProgress,
  GroundedInterviewReview
} from "@/lib/skills/behavioral-curriculum";

function BehavioralHRContent() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [trackSlug, setTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");

  // Core Modes: Home, Learn, Practice, Coach, Interview, Bank
  const [mode, setMode] = useState<"home" | "learn" | "practice" | "coach" | "interview" | "bank">("home");
  const [activeTrackType, setActiveTrackType] = useState<"faang_star" | "service_hr">("faang_star");

  // Data Stores
  const [questions, setQuestions] = useState<BehavioralQuestionFull[]>([]);
  const [loading, setLoading] = useState(true);

  // ── HOME GATEWAY STATE ──
  const [homeProgress, setHomeProgress] = useState<SimpleCandidateProgress | null>(null);
  const [quickQuestion, setQuickQuestion] = useState<BehavioralQuestionFull | null>(null);

  // ── LEARN MODE STATE ──
  const [learnScenarios, setLearnScenarios] = useState<MicroLearnScenario[]>([]);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [chosenOption, setChosenOption] = useState<"A" | "B" | null>(null);
  const [showTryItPrompt, setShowTryItPrompt] = useState(false);
  const [learnAnswer, setLearnAnswer] = useState("");
  const [learnEvaluating, setLearnEvaluating] = useState(false);
  const [learnFeedback, setLearnFeedback] = useState<SingleImprovementEvaluation | null>(null);

  // ── PRACTICE MODE STATE ──
  const [practiceQuestion, setPracticeQuestion] = useState<BehavioralQuestionFull | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceEvaluating, setPracticeEvaluating] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<SingleImprovementEvaluation | null>(null);
  const [showDetailedDiagnostic, setShowDetailedDiagnostic] = useState(false);
  const [recentlyPracticedIds, setRecentlyPracticedIds] = useState<string[]>([]);

  // ── COACH MODE STATE ──
  const [coachDraft, setCoachDraft] = useState("");
  const [coachDiagnosis, setCoachDiagnosis] = useState<CoachDiagnosticResult | null>(null);
  const [coachAnalyzing, setCoachAnalyzing] = useState(false);
  const [coachLog, setCoachLog] = useState<{
    sender: "coach" | "candidate";
    text: string;
    headline?: string;
    suggestion?: string;
    quote?: string;
  }[]>([]);
  const [coachReplyInput, setCoachReplyInput] = useState("");

  // ── INTERVIEW MODE STATE ──
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<BehavioralQuestionFull[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewTurn, setInterviewTurn] = useState<"initial" | "followup">("initial");
  const [activeFollowUpQuestion, setActiveFollowUpQuestion] = useState<string | null>(null);
  const [candidateResponse, setCandidateResponse] = useState("");
  const [interviewEvaluating, setInterviewEvaluating] = useState(false);
  const [interviewEvaluations, setInterviewEvaluations] = useState<SingleImprovementEvaluation[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [finalReview, setFinalReview] = useState<GroundedInterviewReview | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);

  const [conversationHistory, setConversationHistory] = useState<Array<{
    speaker: "interviewer" | "candidate";
    text: string;
    isFollowUp?: boolean;
  }>>([]);

  // ── PROCTORING & AUDIO ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ── BANK MODE FILTER STATE ──
  const [bankSearch, setBankSearch] = useState("");
  const [bankCompetencyFilter, setBankCompetencyFilter] = useState("all");

  // Audio Speech Synthesis
  const speakText = (text: string) => {
    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v =>
        v.name.includes("Female") ||
        v.name.includes("Samantha") ||
        v.lang.includes("en-IN") ||
        v.lang.includes("en-US")
      );
      if (femaleVoice) utterance.voice = femaleVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  // Initial Data Load
  useEffect(() => {
    const storedId =
      searchParams.get("candidateId") ||
      (typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") : null) ||
      "student-demo";
    setCandidateId(storedId);

    const paramTrack = (searchParams.get("track") as any) || "product_mid";
    setTrackSlug(paramTrack);
    if (paramTrack === "service_mass" || paramTrack === "service_elite") {
      setActiveTrackType("service_hr");
    } else {
      setActiveTrackType("faang_star");
    }

    const queryMode = searchParams.get("mode") as any;
    if (queryMode && ["home", "learn", "practice", "coach", "interview", "bank"].includes(queryMode)) {
      setMode(queryMode);
    }

    async function loadData() {
      setLoading(true);
      try {
        const [homeRes, scenariosRes, bankRes] = await Promise.all([
          fetch(`/api/skills/behavioral?mode=home&candidateId=${storedId}`),
          fetch(`/api/skills/behavioral?mode=learn_scenarios`),
          fetch(`/api/skills/behavioral?mode=bank&candidateId=${storedId}`)
        ]);

        const homeData = await homeRes.json();
        const scenariosData = await scenariosRes.json();
        const bankData = await bankRes.json();

        if (homeData.success) {
          setHomeProgress(homeData.progress);
          setQuickQuestion(homeData.quickQuestion);
          if (homeData.quickQuestion && !practiceQuestion) {
            setPracticeQuestion(homeData.quickQuestion);
          }
        }

        if (scenariosData.scenarios) {
          setLearnScenarios(scenariosData.scenarios);
        }

        if (bankData.questions && bankData.questions.length > 0) {
          setQuestions(bankData.questions);
          if (!practiceQuestion) {
            setPracticeQuestion(bankData.questions[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load behavioral data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  // Tab switch detection (proctoring during interview)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && interviewStarted && !sessionCompleted) {
        setTabSwitchCount(prev => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [interviewStarted, sessionCompleted]);

  // Camera stream for interview mode
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (mode === "interview" && interviewStarted && !sessionCompleted) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { width: 320, height: 240 }, audio: false })
          .then(s => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              setCameraActive(true);
            }
          })
          .catch(() => {
            setCameraActive(false);
          });
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
        setCameraActive(false);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [mode, interviewStarted, sessionCompleted]);

  // Web Speech recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = "en-IN";

        recog.onresult = (event: any) => {
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + " ";
          }
          const cleaned = fullTranscript.trim();
          if (mode === "practice") {
            setPracticeAnswer(cleaned);
          } else if (mode === "learn") {
            setLearnAnswer(cleaned);
          } else if (mode === "interview") {
            setCandidateResponse(cleaned);
          }
        };

        recog.onerror = () => {
          setIsRecording(false);
        };
        recog.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, [mode]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not available in this browser. Please type your response.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  };

  // ── HOME ACTIONS ──
  const handleStartQuickPractice = () => {
    if (quickQuestion) {
      setPracticeQuestion(quickQuestion);
    }
    setPracticeAnswer("");
    setPracticeFeedback(null);
    setMode("practice");
  };

  const handleStartWeakSpotPractice = () => {
    if (homeProgress?.workOnNext?.recommendedQuestion) {
      setPracticeQuestion(homeProgress.workOnNext.recommendedQuestion);
    }
    setPracticeAnswer("");
    setPracticeFeedback(null);
    setMode("practice");
  };

  // ── PRACTICE ACTIONS ──
  const handlePracticeSubmit = async () => {
    if (!practiceAnswer.trim()) {
      alert("Please provide an answer before submitting.");
      return;
    }
    if (!practiceQuestion) return;

    setPracticeEvaluating(true);
    try {
      const res = await fetch("/api/skills/behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          questionId: practiceQuestion.id,
          candidateResponse: practiceAnswer,
          candidateId,
          trackSlug,
          isInterview: false
        })
      });

      const data = await res.json();
      if (data.evaluation) {
        setPracticeFeedback(data.evaluation);
        setRecentlyPracticedIds(prev => [practiceQuestion.id, ...prev.slice(0, 4)]);
      }
    } catch (e) {
      alert("Failed to evaluate answer. Please try again.");
    } finally {
      setPracticeEvaluating(false);
    }
  };

  const handleNextPracticeQuestion = async () => {
    setPracticeEvaluating(true);
    try {
      const res = await fetch(
        `/api/skills/behavioral?mode=next_practice_question&candidateId=${candidateId}&currentQuestionId=${practiceQuestion?.id || ""}`
      );
      const data = await res.json();
      if (data.question) {
        setPracticeQuestion(data.question);
        setPracticeAnswer("");
        setPracticeFeedback(null);
        setShowDetailedDiagnostic(false);
      }
    } catch (e) {
      if (questions.length > 0) {
        setPracticeQuestion(questions[Math.floor(Math.random() * questions.length)]);
      }
    } finally {
      setPracticeEvaluating(false);
    }
  };

  const handleSendPracticeToCoach = () => {
    setCoachDraft(practiceAnswer);
    setMode("coach");
    handleCoachAnalyze(practiceAnswer);
  };

  // ── LEARN ACTIONS ──
  const activeScenario = learnScenarios[activeScenarioIdx] || learnScenarios[0];

  const handleSelectLearnOption = (opt: "A" | "B") => {
    setChosenOption(opt);
    setShowTryItPrompt(true);
  };

  const handleLearnSubmit = async () => {
    if (!learnAnswer.trim()) {
      alert("Please speak or type your answer before submitting.");
      return;
    }
    setLearnEvaluating(true);
    try {
      const res = await fetch("/api/skills/behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          questionId: activeScenario?.sampleQuestionId || "learn-q",
          candidateResponse: learnAnswer,
          candidateId,
          trackSlug,
          isInterview: false
        })
      });
      const data = await res.json();
      if (data.evaluation) {
        setLearnFeedback(data.evaluation);
      }
    } catch (e) {
      alert("Failed to evaluate learn answer.");
    } finally {
      setLearnEvaluating(false);
    }
  };

  const handleNextLearnScenario = () => {
    const nextIdx = (activeScenarioIdx + 1) % (learnScenarios.length || 1);
    setActiveScenarioIdx(nextIdx);
    setChosenOption(null);
    setShowTryItPrompt(false);
    setLearnAnswer("");
    setLearnFeedback(null);
  };

  // ── COACH ACTIONS ──
  const handleCoachAnalyze = async (draftToAnalyze: string) => {
    const text = draftToAnalyze.trim();
    if (!text) {
      alert("Please enter your answer draft to receive coaching.");
      return;
    }
    setCoachAnalyzing(true);
    try {
      const res = await fetch("/api/skills/behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "coach",
          candidateResponse: text,
          candidateId
        })
      });
      const data = await res.json();
      if (data.diagnosis) {
        setCoachDiagnosis(data.diagnosis);
        setCoachLog([
          {
            sender: "coach",
            text: data.diagnosis.followUpPrompt,
            headline: data.diagnosis.headline,
            suggestion: data.diagnosis.actionableSuggestion,
            quote: data.diagnosis.quoteEvidence
          }
        ]);
      }
    } catch (e) {
      alert("Error analyzing answer draft.");
    } finally {
      setCoachAnalyzing(false);
    }
  };

  const handleCoachReply = async () => {
    if (!coachReplyInput.trim()) return;
    const reply = coachReplyInput.trim();
    setCoachReplyInput("");

    setCoachLog(prev => [...prev, { sender: "candidate", text: reply }]);
    setCoachAnalyzing(true);

    try {
      const res = await fetch("/api/skills/behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          candidateResponse: `${coachDraft}\n\nAddendum: ${reply}`,
          candidateId,
          trackSlug
        })
      });
      const data = await res.json();
      const evalData = data.evaluation;

      setCoachLog(prev => [
        ...prev,
        {
          sender: "coach",
          headline: "That makes your answer much stronger.",
          suggestion: evalData?.tryThis || "Now synthesize that into your polished final story.",
          text: evalData?.adaptiveFollowUp || "How would you explain the outcome in one crisp closing sentence?"
        }
      ]);
    } catch (e) {
      setCoachLog(prev => [
        ...prev,
        {
          sender: "coach",
          text: "That strengthens your narrative significantly! Always make sure your personal actions and final results are clear."
        }
      ]);
    } finally {
      setCoachAnalyzing(false);
    }
  };

  // ── INTERVIEW ACTIONS ──
  const handleStartInterview = async () => {
    setInterviewEvaluating(true);
    try {
      const res = await fetch(
        `/api/skills/behavioral?mode=interview_set&candidateId=${candidateId}&trackType=${activeTrackType}&count=3`
      );
      const data = await res.json();
      const selected = data.questions && data.questions.length > 0 ? data.questions : questions.slice(0, 3);

      setInterviewQuestions(selected);
      setCurrentQuestionIndex(0);
      setInterviewTurn("initial");
      setActiveFollowUpQuestion(null);
      setCandidateResponse("");
      setInterviewEvaluations([]);
      setTabSwitchCount(0);
      setTimeLeft(selected.length * 240);

      const firstQ = selected[0];
      const greeting = `Hello, I'm Priya Sharma. Welcome to your interview. Let's start with our first question: ${firstQ.question}`;

      setConversationHistory([
        {
          speaker: "interviewer",
          text: greeting
        }
      ]);

      setInterviewStarted(true);
      setSessionCompleted(false);
      setFinalReview(null);

      speakText(greeting);
    } catch (e) {
      alert("Failed to start interview session. Please try again.");
    } finally {
      setInterviewEvaluating(false);
    }
  };

  const handleInterviewSubmit = async () => {
    if (!candidateResponse.trim()) {
      alert("Please provide an answer before submitting.");
      return;
    }

    const currentQ = interviewQuestions[currentQuestionIndex];
    if (!currentQ) return;

    const answerText = candidateResponse.trim();
    setCandidateResponse("");
    setInterviewEvaluating(true);

    setConversationHistory(prev => [...prev, { speaker: "candidate", text: answerText }]);

    try {
      const res = await fetch("/api/skills/behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          questionId: currentQ.id,
          candidateResponse: answerText,
          candidateId,
          trackSlug,
          isInterview: true,
          turn: interviewTurn
        })
      });

      const data = await res.json();
      const evalItem: SingleImprovementEvaluation = data.evaluation;
      const updatedEvals = [...interviewEvaluations, evalItem];
      setInterviewEvaluations(updatedEvals);

      if (interviewTurn === "initial" && evalItem.adaptiveFollowUp) {
        setInterviewTurn("followup");
        setActiveFollowUpQuestion(evalItem.adaptiveFollowUp);
        setConversationHistory(prev => [
          ...prev,
          {
            speaker: "interviewer",
            text: evalItem.adaptiveFollowUp,
            isFollowUp: true
          }
        ]);
        speakText(evalItem.adaptiveFollowUp);
      } else {
        const nextQIndex = currentQuestionIndex + 1;
        if (nextQIndex < interviewQuestions.length) {
          setCurrentQuestionIndex(nextQIndex);
          setInterviewTurn("initial");
          setActiveFollowUpQuestion(null);

          const nextQ = interviewQuestions[nextQIndex];
          const nextPrompt = `Thank you. Moving to question ${nextQIndex + 1}: ${nextQ.question}`;
          setConversationHistory(prev => [
            ...prev,
            {
              speaker: "interviewer",
              text: nextPrompt
            }
          ]);
          speakText(nextPrompt);
        } else {
          finishInterview(updatedEvals);
        }
      }
    } catch (e) {
      alert("Error evaluating response. Continuing interview...");
    } finally {
      setInterviewEvaluating(false);
    }
  };

  const finishInterview = async (evals: SingleImprovementEvaluation[]) => {
    setSessionCompleted(true);
    setInterviewEvaluating(true);
    try {
      const res = await fetch("/api/skills/behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_finish",
          evaluationsHistory: evals
        })
      });
      const data = await res.json();
      if (data.review) {
        setFinalReview(data.review);
      }
    } catch (e) {
      console.warn("Failed to generate interview review", e);
    } finally {
      setInterviewEvaluating(false);
    }

    const completionMsg =
      "That concludes our interview. Thank you for your responses. I have compiled your review with specific excerpts from what you said.";
    setConversationHistory(prev => [...prev, { speaker: "interviewer", text: completionMsg }]);
    speakText(completionMsg);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* ── TOP NAV HEADER ── */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href={`/student/skills?candidateId=${candidateId}&track=${trackSlug}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#667085", textDecoration: "none", fontWeight: 600 }}
            >
              ← Hub
            </Link>
            <span style={{ color: "#E4E1DA" }}>/</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🎯</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#162A43", letterSpacing: "-0.02em" }}>
                Cognalyze Behavioral &amp; Leadership Prep
              </span>
            </div>
          </div>

          {/* Mode Tabs */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2, background: "#F6F5F1", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA" }}>
            {[
              { id: "home", label: "⚡ Home" },
              { id: "learn", label: "💡 Learn" },
              { id: "practice", label: "🛠️ Practice" },
              { id: "coach", label: "🎓 Coach" },
              { id: "interview", label: "🎤 Interview" },
              { id: "bank", label: "📚 Question Bank" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as any)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === tab.id ? "#162A43" : "transparent",
                  color: mode === tab.id ? "#FFFFFF" : "#667085",
                  fontSize: 12,
                  fontWeight: mode === tab.id ? 700 : 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Voice Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              border: "1px solid #E4E1DA",
              background: soundEnabled ? "#EAF4EE" : "#FFFFFF",
              color: soundEnabled ? "#2E7D5B" : "#667085",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            {soundEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main style={{ maxWidth: 1050, margin: "0 auto", padding: "28px 20px" }}>
        {loading && (
          <div style={{ padding: 60, textAlign: "center", color: "#667085", fontSize: 14 }}>
            Loading interview experience...
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODE 1: HOME (Simple Gateway Screen)
        ══════════════════════════════════════════════════════════════════════ */}
        {!loading && mode === "home" && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#162A43", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                GET BETTER AT INTERVIEWS
              </h1>
              <p style={{ fontSize: 14, color: "#667085", margin: 0 }}>
                Practice. Get evidence-based feedback. Try again.
              </p>
            </div>

            {/* 4 Gateway Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16, marginBottom: 28 }}>
              {/* Card 1: Quick Practice */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.04)"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#162A43" }}>
                      Quick Practice
                    </h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#667085", margin: "0 0 16px", lineHeight: 1.5 }}>
                    Answer a single question. Get one specific improvement. Revise immediately.
                  </p>
                  {quickQuestion && (
                    <div style={{ background: "#F6F5F1", padding: "10px 12px", borderRadius: 7, border: "1px solid #E4E1DA", fontSize: 12, color: "#475467", marginBottom: 16, fontStyle: "italic" }}>
                      &ldquo;{quickQuestion.question}&rdquo;
                    </div>
                  )}
                </div>
                <button
                  onClick={handleStartQuickPractice}
                  style={{
                    width: "100%",
                    padding: "9px 16px",
                    borderRadius: 7,
                    border: "none",
                    background: "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Start Practice ➔
                </button>
              </div>

              {/* Card 2: Work on Weak Spot */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #F8D8A7",
                  borderRadius: 10,
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.04)"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>🎯</span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#B7791F" }}>
                      Work on your weak spot
                    </h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#475467", margin: "0 0 14px", lineHeight: 1.5 }}>
                    &ldquo;{homeProgress?.workOnNext?.reason || "Your project answers could be more specific about your individual contribution."}&rdquo;
                  </p>
                  <div style={{ fontSize: 11, color: "#667085", marginBottom: 16 }}>
                    Target: <strong style={{ color: "#162A43" }}>{homeProgress?.workOnNext?.title || "Personal Specificity"}</strong>
                  </div>
                </div>
                <button
                  onClick={handleStartWeakSpotPractice}
                  style={{
                    width: "100%",
                    padding: "9px 16px",
                    borderRadius: 7,
                    border: "1px solid #F8D8A7",
                    background: "#FEF7ED",
                    color: "#B7791F",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Practice This Weak Spot ➔
                </button>
              </div>

              {/* Card 3: Mock Interview */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.04)"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>🎤</span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#162A43" }}>
                      Mock Interview
                    </h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#667085", margin: "0 0 16px", lineHeight: 1.5 }}>
                    A realistic conversational interview. Interviewer listens and asks adaptive follow-ups before delivering a final review.
                  </p>
                  <div style={{ fontSize: 11, color: "#667085", marginBottom: 16 }}>
                    3 Core Questions • Adaptive Probes • Audio Speech
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMode("interview");
                    handleStartInterview();
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 16px",
                    borderRadius: 7,
                    border: "none",
                    background: "#162A43",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Start Mock Interview ➔
                </button>
              </div>

              {/* Card 4: Micro-Learn */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.04)"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>💡</span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#162A43" }}>
                      Learn while you practice
                    </h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#667085", margin: "0 0 16px", lineHeight: 1.5 }}>
                    Quick 2-minute interactive scenarios. Choose between A and B, understand why, and practice immediately.
                  </p>
                  <div style={{ fontSize: 11, color: "#667085", marginBottom: 16 }}>
                    No 500-word lectures • 100% interactive
                  </div>
                </div>
                <button
                  onClick={() => setMode("learn")}
                  style={{
                    width: "100%",
                    padding: "9px 16px",
                    borderRadius: 7,
                    border: "1px solid #E4E1DA",
                    background: "#FFFFFF",
                    color: "#162A43",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Explore Lessons ➔
                </button>
              </div>
            </div>

            {/* Simple Progress Section */}
            {homeProgress && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "22px 24px", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: 0 }}>
                    📈 YOUR INTERVIEW PROGRESS
                  </h2>
                  <span style={{ fontSize: 12, color: "#667085" }}>
                    {homeProgress.totalAnswers} answers practiced so far
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", marginBottom: 8 }}>
                      ✓ YOU&apos;RE GETTING BETTER AT:
                    </div>
                    {homeProgress.gettingBetterAt.map((pt, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: "#14532D", marginBottom: 4 }}>• {pt}</div>
                    ))}
                  </div>

                  <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#B7791F", marginBottom: 8 }}>
                      🎯 WORK ON NEXT:
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#78350F", marginBottom: 4 }}>
                      {homeProgress.workOnNext.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.4 }}>
                      {homeProgress.workOnNext.reason}
                    </div>
                  </div>
                </div>

                {/* Evidence-Based History Shift */}
                {homeProgress.improvementDetected && (
                  <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 12, fontSize: 12, color: "#162A43", lineHeight: 1.5 }}>
                    <strong style={{ color: "#356AE6" }}>💡 Improvement detected across answers:</strong>
                    <div style={{ marginTop: 4 }}>Earlier: {homeProgress.improvementDetected.earlier}</div>
                    <div style={{ color: "#2E7D5B", fontWeight: 700, marginTop: 2 }}>Now: {homeProgress.improvementDetected.now}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODE 2: LEARN ("Learn While You Practice")
        ══════════════════════════════════════════════════════════════════════ */}
        {!loading && mode === "learn" && activeScenario && (
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {/* Lesson Selector Pills */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 20 }}>
              {learnScenarios.map((sc, idx) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setActiveScenarioIdx(idx);
                    setChosenOption(null);
                    setShowTryItPrompt(false);
                    setLearnAnswer("");
                    setLearnFeedback(null);
                  }}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 7,
                    border: activeScenarioIdx === idx ? "1px solid #162A43" : "1px solid #E4E1DA",
                    background: activeScenarioIdx === idx ? "#162A43" : "#FFFFFF",
                    color: activeScenarioIdx === idx ? "#FFFFFF" : "#667085",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span>{sc.icon} </span>
                  <span>{sc.competencyTitle}</span>
                </button>
              ))}
            </div>

            {/* Interactive Lesson Card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "26px 30px", marginBottom: 20, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                  {activeScenario.icon} {activeScenario.competencyTitle} · 2 Min Practice
                </span>
                <span style={{ fontSize: 11, color: "#667085" }}>
                  Lesson {activeScenarioIdx + 1} of {learnScenarios.length}
                </span>
              </div>

              {/* Scenario */}
              <div style={{ fontSize: 17, fontWeight: 800, color: "#162A43", lineHeight: 1.4, marginBottom: 20 }}>
                &ldquo;{activeScenario.scenario}&rdquo;
              </div>

              {/* Options A vs B */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <button
                  onClick={() => handleSelectLearnOption("A")}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 8,
                    border: chosenOption === "A"
                      ? (activeScenario.optionA.isPreferred ? "2px solid #2E7D5B" : "2px solid #C24141")
                      : "1px solid #E4E1DA",
                    background: chosenOption === "A"
                      ? (activeScenario.optionA.isPreferred ? "#EAF4EE" : "#FDF2F2")
                      : "#F6F5F1",
                    color: chosenOption === "A"
                      ? (activeScenario.optionA.isPreferred ? "#14532D" : "#7F1D1D")
                      : "#17191C",
                    fontSize: 13,
                    lineHeight: 1.5,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10
                  }}
                >
                  <strong style={{ color: "#356AE6" }}>A:</strong>
                  <span>{activeScenario.optionA.text}</span>
                </button>

                <button
                  onClick={() => handleSelectLearnOption("B")}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 8,
                    border: chosenOption === "B"
                      ? (activeScenario.optionB.isPreferred ? "2px solid #2E7D5B" : "2px solid #C24141")
                      : "1px solid #E4E1DA",
                    background: chosenOption === "B"
                      ? (activeScenario.optionB.isPreferred ? "#EAF4EE" : "#FDF2F2")
                      : "#F6F5F1",
                    color: chosenOption === "B"
                      ? (activeScenario.optionB.isPreferred ? "#14532D" : "#7F1D1D")
                      : "#17191C",
                    fontSize: 13,
                    lineHeight: 1.5,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10
                  }}
                >
                  <strong style={{ color: "#B7791F" }}>B:</strong>
                  <span>{activeScenario.optionB.text}</span>
                </button>
              </div>

              {/* Reveal: Why & Key Idea */}
              {chosenOption && (
                <div style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 8, padding: "16px 18px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#162A43", marginBottom: 4 }}>
                    WHY?
                  </div>
                  <p style={{ fontSize: 13, color: "#475467", lineHeight: 1.5, margin: "0 0 14px" }}>
                    {activeScenario.why}
                  </p>

                  <div style={{ fontSize: 11, fontWeight: 900, color: "#356AE6", marginBottom: 4 }}>
                    KEY IDEA
                  </div>
                  <p style={{ fontSize: 13, color: "#162A43", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
                    &ldquo;{activeScenario.keyIdea}&rdquo;
                  </p>
                </div>
              )}

              {/* Immediate Prompt: Try It Yourself */}
              {showTryItPrompt && (
                <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                      Now try it yourself:
                    </div>
                    <button
                      onClick={toggleRecording}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: isRecording ? "1px solid #C24141" : "1px solid #E4E1DA",
                        background: isRecording ? "#FDF2F2" : "#FFFFFF",
                        color: isRecording ? "#C24141" : "#475467",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {isRecording ? "🔴 Listening..." : "🎙️ Speak"}
                    </button>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 800, color: "#162A43", marginBottom: 10 }}>
                    &ldquo;{activeScenario.tryItQuestion}&rdquo;
                  </div>

                  <textarea
                    value={learnAnswer}
                    onChange={e => setLearnAnswer(e.target.value)}
                    placeholder="Speak or type your answer here... Tell a real story about what you did."
                    rows={6}
                    style={{
                      width: "100%",
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 8,
                      padding: 14,
                      color: "#17191C",
                      fontSize: 13,
                      lineHeight: 1.5,
                      outline: "none",
                      marginBottom: 12,
                      boxSizing: "border-box"
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#667085" }}>
                      {learnAnswer.trim() ? `${learnAnswer.trim().split(/\s+/).length} words` : "Speak or type"}
                    </span>
                    <button
                      onClick={handleLearnSubmit}
                      disabled={learnEvaluating || !learnAnswer.trim()}
                      style={{
                        padding: "9px 20px",
                        borderRadius: 7,
                        border: "none",
                        background: learnEvaluating ? "#98A2B3" : "#356AE6",
                        color: "#FFFFFF",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: learnEvaluating ? "not-allowed" : "pointer"
                      }}
                    >
                      {learnEvaluating ? "Checking..." : "Submit Answer ➔"}
                    </button>
                  </div>

                  {/* Immediate Feedback */}
                  {learnFeedback && (
                    <div style={{ marginTop: 18, background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 18 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", marginBottom: 4 }}>
                        ✓ WHAT WORKED
                      </div>
                      <div style={{ fontSize: 13, color: "#14532D", marginBottom: 14 }}>
                        {learnFeedback.whatWorked}
                      </div>

                      <div style={{ fontSize: 11, fontWeight: 800, color: "#B7791F", marginBottom: 4 }}>
                        🎯 ONE THING TO IMPROVE
                      </div>
                      <div style={{ fontSize: 13, color: "#78350F", marginBottom: 6 }}>
                        {learnFeedback.oneThingToImprove}
                      </div>

                      <div style={{ background: "#F6F5F1", padding: "8px 12px", borderRadius: 6, fontSize: 12, color: "#475467", marginBottom: 14, fontStyle: "italic" }}>
                        Your answer: {learnFeedback.evidenceQuote}
                      </div>

                      <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", marginBottom: 4 }}>
                        TRY THIS:
                      </div>
                      <div style={{ fontSize: 13, color: "#162A43", marginBottom: 16 }}>
                        {learnFeedback.tryThis}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button
                          onClick={() => {
                            setLearnFeedback(null);
                          }}
                          style={{
                            padding: "7px 14px",
                            borderRadius: 6,
                            border: "1px solid #E4E1DA",
                            background: "#FFFFFF",
                            color: "#475467",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          🎙️ Try Again
                        </button>
                        <button
                          onClick={handleNextLearnScenario}
                          style={{
                            padding: "7px 16px",
                            borderRadius: 6,
                            border: "none",
                            background: "#356AE6",
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Next Lesson ➔
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODE 3: PRACTICE (Single Question, "ONE Thing to Improve")
        ══════════════════════════════════════════════════════════════════════ */}
        {!loading && mode === "practice" && practiceQuestion && (
          <div style={{ maxWidth: 820, margin: "0 auto", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "26px 30px", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
            {/* Top Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 4, fontWeight: 800 }}>
                  INTERVIEW PRACTICE
                </span>
                <span style={{ fontSize: 11, color: "#667085" }}>
                  Focus: <strong>{practiceQuestion.competency_id.replace(/_/g, " ").toUpperCase()}</strong>
                </span>
              </div>
              <button
                onClick={handleNextPracticeQuestion}
                disabled={practiceEvaluating}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #E4E1DA",
                  background: "#FFFFFF",
                  color: "#475467",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                🔄 Another Question
              </button>
            </div>

            {/* The Question */}
            <div style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 8, padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#162A43", lineHeight: 1.4 }}>
                &ldquo;{practiceQuestion.question}&rdquo;
              </div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 8 }}>
                Answer naturally in your own words. Think of a real situation and what YOU personally did.
              </div>
            </div>

            {/* Answer Input Area */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>
                  YOUR ANSWER:
                </label>
                <button
                  onClick={toggleRecording}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: isRecording ? "1px solid #C24141" : "1px solid #E4E1DA",
                    background: isRecording ? "#FDF2F2" : "#FFFFFF",
                    color: isRecording ? "#C24141" : "#475467",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {isRecording ? "🔴 Listening... (Click to stop)" : "🎙️ Speak Answer"}
                </button>
              </div>

              <textarea
                value={practiceAnswer}
                onChange={e => setPracticeAnswer(e.target.value)}
                placeholder="Type or speak your answer here... Tell me what happened, what your specific role was, and what the outcome was."
                rows={8}
                style={{
                  width: "100%",
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 8,
                  padding: 14,
                  color: "#17191C",
                  fontSize: 13,
                  lineHeight: 1.6,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Submit Action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#667085" }}>
                {practiceAnswer.trim() ? `${practiceAnswer.trim().split(/\s+/).length} words` : "Empty answer"}
              </span>

              <button
                onClick={handlePracticeSubmit}
                disabled={practiceEvaluating || !practiceAnswer.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: 7,
                  border: "none",
                  background: practiceEvaluating || !practiceAnswer.trim() ? "#98A2B3" : "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: practiceEvaluating || !practiceAnswer.trim() ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.05)"
                }}
              >
                {practiceEvaluating ? "Cognalyze is analyzing..." : "Submit Answer ➔"}
              </button>
            </div>

            {/* ── THE "ONE THING TO IMPROVE" RESULT ── */}
            {practiceFeedback && (
              <div style={{ marginTop: 24, background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20 }}>
                {/* Your answer excerpt */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                    YOUR ANSWER
                  </div>
                  <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5, background: "#F6F5F1", padding: "10px 14px", borderRadius: 6, borderLeft: "3px solid #356AE6" }}>
                    &ldquo;{practiceFeedback.candidateText}&rdquo;
                  </div>
                </div>

                {/* What worked */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", marginBottom: 4 }}>
                    ✓ WHAT WORKED
                  </div>
                  <div style={{ fontSize: 13, color: "#14532D", lineHeight: 1.5 }}>
                    {practiceFeedback.whatWorked}
                  </div>
                </div>

                {/* ONE Thing to Improve */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#B7791F", marginBottom: 4 }}>
                    🎯 ONE THING TO IMPROVE
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#78350F", marginBottom: 6 }}>
                    {practiceFeedback.oneThingToImprove}
                  </div>
                  <div style={{ fontSize: 12, color: "#667085", fontStyle: "italic" }}>
                    From your answer: <strong>{practiceFeedback.evidenceQuote}</strong>
                  </div>
                </div>

                {/* Why this matters */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 4 }}>
                    WHY THIS MATTERS
                  </div>
                  <div style={{ fontSize: 12, color: "#475467", lineHeight: 1.4 }}>
                    {practiceFeedback.whyThisMatters}
                  </div>
                </div>

                {/* Try This */}
                <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", marginBottom: 4 }}>
                    TRY THIS
                  </div>
                  <div style={{ fontSize: 13, color: "#162A43", lineHeight: 1.5, fontWeight: 600 }}>
                    {practiceFeedback.tryThis}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <button
                    onClick={() => setShowDetailedDiagnostic(!showDetailedDiagnostic)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#667085",
                      fontSize: 11,
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    {showDetailedDiagnostic ? "Hide detailed feedback" : "See detailed feedback"}
                  </button>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => {
                        setPracticeFeedback(null);
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 7,
                        border: "1px solid #E4E1DA",
                        background: "#FFFFFF",
                        color: "#475467",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      🎙️ Try Again
                    </button>
                    <button
                      onClick={handleSendPracticeToCoach}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 7,
                        border: "1px solid #D2E0FB",
                        background: "#EFF4FE",
                        color: "#356AE6",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      🎓 Coach My Answer
                    </button>
                    <button
                      onClick={handleNextPracticeQuestion}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 7,
                        border: "none",
                        background: "#356AE6",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Next Question ➔
                    </button>
                  </div>
                </div>

                {/* Optional Expandable Detailed Analysis */}
                {showDetailedDiagnostic && practiceFeedback.detailedAnalysis && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #E4E1DA", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                    <div style={{ background: "#F6F5F1", padding: 8, borderRadius: 6, fontSize: 11 }}>
                      <span style={{ color: "#667085" }}>Personal &lsquo;I&rsquo; Ratio:</span>{" "}
                      <strong style={{ color: practiceFeedback.detailedAnalysis.ownershipRatio >= 45 ? "#2E7D5B" : "#B7791F" }}>
                        {practiceFeedback.detailedAnalysis.ownershipRatio}%
                      </strong>
                    </div>
                    <div style={{ background: "#F6F5F1", padding: 8, borderRadius: 6, fontSize: 11 }}>
                      <span style={{ color: "#667085" }}>Measurable Metric:</span>{" "}
                      <strong style={{ color: practiceFeedback.detailedAnalysis.metricsFound ? "#2E7D5B" : "#667085" }}>
                        {practiceFeedback.detailedAnalysis.metricsFound ? "Detected" : "Not cited"}
                      </strong>
                    </div>
                    <div style={{ background: "#F6F5F1", padding: 8, borderRadius: 6, fontSize: 11 }}>
                      <span style={{ color: "#667085" }}>Outcome/Result:</span>{" "}
                      <strong style={{ color: practiceFeedback.detailedAnalysis.resultPresent ? "#2E7D5B" : "#C24141" }}>
                        {practiceFeedback.detailedAnalysis.resultPresent ? "Included" : "Missing"}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODE 4: COACH ("Give me any answer and help me improve it")
        ══════════════════════════════════════════════════════════════════════ */}
        {!loading && mode === "coach" && (
          <div style={{ maxWidth: 780, margin: "0 auto", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "26px 30px", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
            <div style={{ marginBottom: 18, borderBottom: "1px solid #E4E1DA", paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>🎓</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: 0 }}>
                  Interview Coach
                </h2>
              </div>
              <div style={{ fontSize: 13, color: "#667085" }}>
                Bring any answer draft you already have. Cognalyze will diagnose what is missing and help you improve your own words.
              </div>
            </div>

            {/* Input Draft Area */}
            {coachLog.length === 0 ? (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#667085", display: "block", marginBottom: 6 }}>
                  PASTE OR WRITE YOUR ANSWER:
                </label>
                <textarea
                  value={coachDraft}
                  onChange={e => setCoachDraft(e.target.value)}
                  placeholder="Paste your answer draft here... (e.g. 'I worked on an AI project with my team. We made a resume screening system...')"
                  rows={8}
                  style={{
                    width: "100%",
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 8,
                    padding: 14,
                    color: "#17191C",
                    fontSize: 13,
                    lineHeight: 1.6,
                    outline: "none",
                    marginBottom: 14,
                    boxSizing: "border-box"
                  }}
                />
                <button
                  onClick={() => handleCoachAnalyze(coachDraft)}
                  disabled={coachAnalyzing || !coachDraft.trim()}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 7,
                    border: "none",
                    background: coachAnalyzing || !coachDraft.trim() ? "#98A2B3" : "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: coachAnalyzing || !coachDraft.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  {coachAnalyzing ? "Analyzing..." : "Improve My Answer ➔"}
                </button>
              </div>
            ) : (
              <div>
                {/* Socratic Refinement Dialogue */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  {coachLog.map((entry, idx) => (
                    <div key={idx}>
                      {entry.sender === "coach" ? (
                        <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 18 }}>
                          {entry.headline && (
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#162A43", marginBottom: 8 }}>
                              {entry.headline}
                            </div>
                          )}

                          {entry.quote && (
                            <div style={{ fontSize: 12, color: "#475467", marginBottom: 8 }}>
                              You said: <strong style={{ color: "#162A43" }}>{entry.quote}</strong>
                            </div>
                          )}

                          {entry.suggestion && (
                            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: 6, border: "1px solid #D2E0FB", fontSize: 13, color: "#17191C", marginBottom: 10 }}>
                              <strong style={{ color: "#356AE6" }}>Try: </strong>
                              {entry.suggestion}
                            </div>
                          )}

                          <div style={{ fontSize: 13, color: "#162A43", fontWeight: 700 }}>
                            👉 {entry.text}
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12, alignSelf: "flex-end", maxWidth: "90%" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#667085", marginBottom: 2 }}>YOU</div>
                          <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.4 }}>{entry.text}</div>
                        </div>
                      )}
                    </div>
                  ))}

                  {coachAnalyzing && (
                    <div style={{ fontSize: 12, color: "#356AE6", fontStyle: "italic" }}>
                      Coach is analyzing your response...
                    </div>
                  )}
                </div>

                {/* Reply Input */}
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={coachReplyInput}
                    onChange={e => setCoachReplyInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && coachReplyInput.trim()) {
                        handleCoachReply();
                      }
                    }}
                    placeholder="Type your revision here (e.g. 'I specifically wrote the scoring algorithm in Python...')"
                    style={{
                      flex: 1,
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 7,
                      padding: "10px 14px",
                      color: "#17191C",
                      fontSize: 12,
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={handleCoachReply}
                    disabled={coachAnalyzing || !coachReplyInput.trim()}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 7,
                      border: "none",
                      background: "#356AE6",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setCoachLog([]);
                      setCoachDraft("");
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 7,
                      border: "1px solid #E4E1DA",
                      background: "#FFFFFF",
                      color: "#667085",
                      fontSize: 11,
                      cursor: "pointer"
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODE 5: INTERVIEW (Simulate Real Interview)
        ══════════════════════════════════════════════════════════════════════ */}
        {!loading && mode === "interview" && (
          !interviewStarted ? (
            /* Pre-Interview Brief */
            <div style={{ maxWidth: 740, margin: "20px auto", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "28px 32px", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
              <div style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 4, fontWeight: 800, display: "inline-block", marginBottom: 8 }}>
                REAL MOCK INTERVIEW
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", color: "#162A43" }}>
                {activeTrackType === "service_hr" ? "Corporate Service HR Round" : "Behavioral Interview Simulation"}
              </h2>
              <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, margin: "0 0 20px" }}>
                A realistic 3-question interview without interruptions. Priya Sharma will listen to your answer and ask an adaptive follow-up. At the end, you receive a full report grounded in your actual answers.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <button
                  onClick={() => setActiveTrackType("faang_star")}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: activeTrackType === "faang_star" ? "2px solid #356AE6" : "1px solid #E4E1DA",
                    background: activeTrackType === "faang_star" ? "#EFF4FE" : "#F6F5F1",
                    color: "#162A43",
                    textAlign: "left",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#356AE6" }}>Product / Tech Track</div>
                  <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>Ownership, Disagreement, Overcoming Failure</div>
                </button>

                <button
                  onClick={() => setActiveTrackType("service_hr")}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: activeTrackType === "service_hr" ? "2px solid #356AE6" : "1px solid #E4E1DA",
                    background: activeTrackType === "service_hr" ? "#EFF4FE" : "#F6F5F1",
                    color: "#162A43",
                    textAlign: "left",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>TCS / Infosys Corporate HR</div>
                  <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>Relocation readiness, night shifts, client stability</div>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 11, color: "#667085" }}>
                  3 Core Scenarios • Adaptive Follow-ups • Grounded Review
                </div>
                <button
                  onClick={handleStartInterview}
                  disabled={interviewEvaluating}
                  style={{
                    padding: "11px 26px",
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
                  {interviewEvaluating ? "Preparing Interview..." : "Begin Interview ➔"}
                </button>
              </div>
            </div>
          ) : !sessionCompleted ? (
            /* Active Conversational Mock Interview */
            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>
              {/* Left Panel: Interviewer Panel + Camera + Live Transcript */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #E4E1DA" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#162A43", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      👩‍💼
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>Priya Sharma</div>
                      <div style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 600 }}>Question {currentQuestionIndex + 1} of {interviewQuestions.length}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: "#F6F5F1", color: "#162A43", fontWeight: 700, border: "1px solid #E4E1DA" }}>
                    ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </div>
                </div>

                {/* Camera Feed */}
                <div style={{ position: "relative", width: "100%", height: 110, background: "#111C2E", borderRadius: 7, overflow: "hidden", border: "1px solid #233752", marginBottom: 12 }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: 4, left: 6, display: "flex", alignItems: "center", gap: 4, fontSize: 10, background: "rgba(0,0,0,0.6)", color: "#FFFFFF", padding: "1px 6px", borderRadius: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cameraActive ? "#2E7D5B" : "#C24141" }} />
                    <span>{cameraActive ? "Camera Active" : "Camera Standby"}</span>
                  </div>
                </div>

                {/* Transcript */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
                  {conversationHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: item.speaker === "interviewer" ? "flex-start" : "flex-end",
                        maxWidth: "90%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: item.speaker === "interviewer"
                          ? item.isFollowUp ? "#FEF7ED" : "#EFF4FE"
                          : "#F6F5F1",
                        border: item.speaker === "interviewer"
                          ? item.isFollowUp ? "1px solid #F8D8A7" : "1px solid #D2E0FB"
                          : "1px solid #E4E1DA",
                        fontSize: 12,
                        lineHeight: 1.4,
                        color: "#17191C"
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 800, color: item.speaker === "interviewer" ? (item.isFollowUp ? "#B7791F" : "#356AE6") : "#162A43", marginBottom: 2 }}>
                        {item.speaker === "interviewer" ? (item.isFollowUp ? "⚡ PRIYA'S FOLLOW-UP" : "PRIYA") : "YOU"}
                      </div>
                      <div>{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Current Question & Answer Area */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 22, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 800 }}>
                      QUESTION {currentQuestionIndex + 1} OF {interviewQuestions.length}
                    </span>
                    <span style={{ fontSize: 11, color: "#667085" }}>
                      {interviewTurn === "initial" ? "Initial Scenario" : "Adaptive Follow-Up"}
                    </span>
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 800, color: "#162A43", lineHeight: 1.4, marginTop: 4 }}>
                    {interviewTurn === "initial"
                      ? interviewQuestions[currentQuestionIndex]?.question
                      : activeFollowUpQuestion}
                  </div>
                </div>

                {/* Answer Area */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>
                      {interviewTurn === "initial" ? "YOUR ANSWER:" : "YOUR FOLLOW-UP RESPONSE:"}
                    </label>
                    <button
                      onClick={toggleRecording}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: isRecording ? "1px solid #C24141" : "1px solid #E4E1DA",
                        background: isRecording ? "#FDF2F2" : "#FFFFFF",
                        color: isRecording ? "#C24141" : "#475467",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {isRecording ? "🔴 Listening... (Click to stop)" : "🎙️ Speak Answer"}
                    </button>
                  </div>

                  <textarea
                    value={candidateResponse}
                    onChange={e => setCandidateResponse(e.target.value)}
                    placeholder={
                      interviewTurn === "initial"
                        ? "Type or speak your answer... Describe the situation, your specific role ('I did...'), and the outcome."
                        : "Address Priya's follow-up question directly..."
                    }
                    rows={9}
                    style={{
                      width: "100%",
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 8,
                      padding: 14,
                      color: "#17191C",
                      fontSize: 13,
                      lineHeight: 1.5,
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleInterviewSubmit}
                    disabled={interviewEvaluating || !candidateResponse.trim()}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 7,
                      border: "none",
                      background: interviewEvaluating || !candidateResponse.trim() ? "#98A2B3" : "#356AE6",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: interviewEvaluating || !candidateResponse.trim() ? "not-allowed" : "pointer"
                    }}
                  >
                    {interviewEvaluating ? "Evaluating..." : interviewTurn === "initial" ? "Submit Answer ➔" : "Submit Follow-Up ➔"}
                  </button>
                </div>
              </div>
            </div>
          ) : finalReview ? (
            /* Grounded Final Interview Report */
            <div style={{ maxWidth: 760, margin: "20px auto", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "28px 32px", boxShadow: "0 1px 4px rgba(16,24,40,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #E4E1DA", paddingBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", borderRadius: 4, fontWeight: 800 }}>
                      INTERVIEW COMPLETED
                    </span>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: "6px 0 2px", color: "#162A43" }}>
                      YOUR INTERVIEW REVIEW
                    </h2>
                  </div>
                  <span style={{ fontSize: 12, color: "#667085" }}>
                    {interviewQuestions.length} scenarios evaluated
                  </span>
                </div>

                <p style={{ fontSize: 13, color: "#475467", lineHeight: 1.5, margin: "0 0 20px" }}>
                  {finalReview.overallObservation}
                </p>

                {/* What You Did Well */}
                <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D5B", marginBottom: 8 }}>
                    ✓ WHAT YOU DID WELL
                  </div>
                  {finalReview.whatYouDidWell.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 13, color: "#14532D", fontWeight: 600 }}>• {item.point}</div>
                      {item.quote && (
                        <div style={{ fontSize: 11, color: "#166534", fontStyle: "italic", marginLeft: 14 }}>
                          Evidence: {item.quote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* What to Work On */}
                <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#B7791F", marginBottom: 8 }}>
                    🎯 WHAT TO WORK ON
                  </div>
                  {finalReview.whatToWorkOn.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 13, color: "#78350F", fontWeight: 600 }}>• {item.point}</div>
                      {item.quote && (
                        <div style={{ fontSize: 11, color: "#92400E", fontStyle: "italic", marginLeft: 14 }}>
                          Evidence: {item.quote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recommended Next Practice Session */}
                {finalReview.recommendedNextPractice && (
                  <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", marginBottom: 4 }}>
                      RECOMMENDED NEXT PRACTICE
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#162A43", marginBottom: 4 }}>
                      {finalReview.recommendedNextPractice.topic}
                    </div>
                    <div style={{ fontSize: 12, color: "#475467", lineHeight: 1.4, marginBottom: 12 }}>
                      {finalReview.recommendedNextPractice.reason}
                    </div>
                    <button
                      onClick={() => {
                        const targetQ = questions.find(q => q.id === finalReview.recommendedNextPractice.suggestedQuestionId) || questions[0];
                        if (targetQ) setPracticeQuestion(targetQ);
                        setPracticeAnswer("");
                        setPracticeFeedback(null);
                        setMode("practice");
                      }}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 6,
                        border: "none",
                        background: "#356AE6",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Practice This Topic ➔
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setMode("home")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "1px solid #E4E1DA",
                      background: "#FFFFFF",
                      color: "#475467",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Back to Home
                  </button>
                  <button
                    onClick={handleStartInterview}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 6,
                      border: "none",
                      background: "#356AE6",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Take Another Interview ➔
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "#667085" }}>
                Compiling your interview review...
              </div>
            )
          )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODE 6: QUESTION BANK (Clean Searchable Catalog)
        ══════════════════════════════════════════════════════════════════════ */}
        {!loading && mode === "bank" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: 0 }}>
                  Behavioral Question Bank
                </h2>
                <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                  Browse {questions.length} real interview questions across competencies.
                </div>
              </div>

              {/* Search Bar */}
              <input
                type="text"
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                placeholder="Search questions by keyword or company..."
                style={{
                  width: 280,
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 7,
                  padding: "8px 12px",
                  color: "#17191C",
                  fontSize: 12,
                  outline: "none"
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 16 }}>
              {[
                { id: "all", label: "All Questions" },
                { id: "extreme_ownership", label: "Ownership" },
                { id: "disagree_and_commit", label: "Conflict" },
                { id: "handling_failure", label: "Mistakes" },
                { id: "leadership_initiative", label: "Leadership" },
                { id: "teamwork_conflict", label: "Teamwork" },
                { id: "prioritization_pressure", label: "Prioritization" },
                { id: "corporate_stability", label: "Corporate HR" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setBankCompetencyFilter(f.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: bankCompetencyFilter === f.id ? "1px solid #162A43" : "1px solid #E4E1DA",
                    background: bankCompetencyFilter === f.id ? "#162A43" : "#FFFFFF",
                    color: bankCompetencyFilter === f.id ? "#FFFFFF" : "#667085",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Questions Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {questions
                .filter(q => {
                  const matchSearch =
                    bankSearch === "" ||
                    q.title.toLowerCase().includes(bankSearch.toLowerCase()) ||
                    q.question.toLowerCase().includes(bankSearch.toLowerCase()) ||
                    q.company_tag.toLowerCase().includes(bankSearch.toLowerCase());
                  const matchComp = bankCompetencyFilter === "all" || q.competency_id === bankCompetencyFilter;
                  return matchSearch && matchComp;
                })
                .map(q => (
                  <div
                    key={q.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 1px 3px rgba(16,24,40,0.04)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 800 }}>
                          {q.competency_id.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, color: "#667085" }}>{q.company_tag}</span>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43", lineHeight: 1.4, marginBottom: 12 }}>
                        &ldquo;{q.question}&rdquo;
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 10, borderTop: "1px solid #E4E1DA" }}>
                      <button
                        onClick={() => {
                          setPracticeQuestion(q);
                          setPracticeAnswer("");
                          setPracticeFeedback(null);
                          setMode("practice");
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "none",
                          background: "#356AE6",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Practice This ➔
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BehavioralHRArena() {
  return (
    <React.Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#667085" }}>Loading Interview Experience...</div>}>
      <BehavioralHRContent />
    </React.Suspense>
  );
}
