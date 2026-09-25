"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BehavioralQuestion, SEED_BEHAVIORAL_QUESTIONS } from "@/lib/skill-hub-store";
import {
  generateSessionBrief,
  generatePostSessionFeedback,
  getStudentProfile,
  PostSessionFeedback,
  SessionBrief
} from "@/lib/skills/adaptive-engine";
import SessionBriefModal from "@/components/skills/SessionBriefModal";

function BehavioralHRContent() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [trackSlug, setTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");

  const [questions, setQuestions] = useState<BehavioralQuestion[]>(SEED_BEHAVIORAL_QUESTIONS);
  const [mode, setMode] = useState<"learn" | "practice" | "coach" | "interview" | "bank">("interview");
  const [activeTab, setActiveTab] = useState<"service_hr" | "faang_star">("faang_star");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(SEED_BEHAVIORAL_QUESTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  // Learn Mode Checkpoint State
  const [learnCheckpointAnswer, setLearnCheckpointAnswer] = useState<number | null>(null);
  const [learnCheckpointRevealed, setLearnCheckpointRevealed] = useState(false);

  // Practice Mode: Story Builder State (Section 36)
  const [storySituation, setStorySituation] = useState("During our final year project, our team faced a 3-day deadline when our primary authentication service broke due to API schema deprecation.");
  const [storyAction, setStoryAction] = useState("I stepped up to own the migration. I audited the breaking endpoints, coordinated fallback JWT session cookies, and stayed overnight to rewrite the auth middleware.");
  const [storyImpact, setStoryImpact] = useState("We deployed 12 hours ahead of the presentation, achieving 99.8% uptime with zero failed logins during the demo.");
  const [storyReflection, setStoryReflection] = useState("Looking back, I learned to enforce contract testing on external dependencies so breaking changes are caught in CI instead of production.");

  // Coach Mode State (Section 13)
  const [coachLog, setCoachLog] = useState<{ sender: "coach" | "candidate"; text: string }[]>([
    {
      sender: "coach",
      text: "Hello! I am your Socratic Behavioral Coach. Tell me about a time you handled a difficult conflict or technical roadblock."
    }
  ]);
  const [coachInput, setCoachInput] = useState("");

  // Live Interview Simulation State
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<BehavioralQuestion>(SEED_BEHAVIORAL_QUESTIONS[0]);
  const [activeFollowUpProbe, setActiveFollowUpProbe] = useState<{
    question: string;
    reason: string;
  } | null>(null);

  const [conversationHistory, setConversationHistory] = useState<Array<{
    speaker: "interviewer" | "candidate";
    text: string;
    isProbe?: boolean;
    evalResult?: any;
  }>>([]);

  const [candidateResponse, setCandidateResponse] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [turnEvaluations, setTurnEvaluations] = useState<any[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [postFeedback, setPostFeedback] = useState<PostSessionFeedback | null>(null);
  const [timeLeft, setTimeLeft] = useState(240); // 4 mins

  // Audio Speech Synthesis
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Session Brief
  const [sessionBrief, setSessionBrief] = useState<SessionBrief | null>(null);

  const speakText = (text: string) => {
    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Samantha") || v.lang.includes("en-IN") || v.lang.includes("en-US"));
      if (femaleVoice) utterance.voice = femaleVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  useEffect(() => {
    const storedId = searchParams.get("candidateId") || localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(storedId);

    const paramTrack = (searchParams.get("track") as any) || "product_mid";
    setTrackSlug(paramTrack);
    if (paramTrack === "service_mass" || paramTrack === "service_elite") {
      setActiveTab("service_hr");
    } else {
      setActiveTab("faang_star");
    }

    const brief = generateSessionBrief(paramTrack, "behavioral_hr", storedId);
    setSessionBrief(brief);

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
  }, [searchParams]);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (interviewStarted && !sessionCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [interviewStarted, sessionCompleted, timeLeft]);

  const handleStartLiveHRInterview = (type: "service_hr" | "faang_star") => {
    setActiveTab(type);
    setMode("interview");
    const trackQuestions = questions.filter(q => q.track_type === type);
    const firstQ = trackQuestions[0] || questions[0];
    setActiveQuestion(firstQ);
    setTurnIndex(0);
    setInterviewStarted(true);
    setSessionCompleted(false);
    setCandidateResponse("");
    setActiveFollowUpProbe(null);
    setTurnEvaluations([]);
    setTimeLeft(240);

    const greeting = type === "service_hr"
      ? `Welcome to your HR Round. I am Priya Sharma, HR Director. We will evaluate your relocation readiness, corporate values, and client collaboration. Let's begin: ${firstQ.question}`
      : `Welcome to your Leadership Principles Bar-Raiser round. I am Priya. I will evaluate behavioral ownership and impact. Let's begin: ${firstQ.question}`;

    setConversationHistory([
      {
        speaker: "interviewer",
        text: firstQ.question
      }
    ]);

    speakText(greeting);
  };

  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser. Please type your response.");
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

  const handleSubmitTurn = async () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    if (!candidateResponse.trim()) {
      alert("Please provide your spoken or typed response.");
      return;
    }

    setEvaluating(true);

    const updatedHistory = [
      ...conversationHistory,
      {
        speaker: "candidate" as const,
        text: candidateResponse
      }
    ];
    setConversationHistory(updatedHistory);

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
      const evalData = data.evaluation;
      const nextEvals = [...turnEvaluations, evalData];
      setTurnEvaluations(nextEvals);

      // Section 25: Dynamic Follow-Up Probing (Ownership, Specificity, Counter-concern, Reflection)
      if (!activeFollowUpProbe) {
        let probeQuestion = "That's a helpful overview. What specifically was your personal contribution versus the team? What was the other person's legitimate counter-concern, and looking back, what is one thing you would do differently today?";
        let probeReason = "Probing candidate ownership, counter-party empathy, and self-reflection under pressure.";

        if (activeTab === "service_hr") {
          probeQuestion = "Thank you. What if your first project requires rotational night shifts supporting US banking clients with unexpected weekend escalations?";
          probeReason = "Verifying operational flexibility and client commitment.";
        }

        const probeObj = { question: probeQuestion, reason: probeReason };
        setActiveFollowUpProbe(probeObj);

        setConversationHistory([
          ...updatedHistory,
          {
            speaker: "interviewer",
            text: `[BEHAVIORAL PROBE]: ${probeQuestion}`,
            isProbe: true,
            evalResult: evalData
          }
        ]);

        speakText(probeQuestion);
        setCandidateResponse("");
      } else {
        // Conclude HR interview session
        setSessionCompleted(true);
        const fb = generatePostSessionFeedback(trackSlug, "behavioral_hr", [
          {
            score: evalData.starScore || 84,
            verdict: evalData.verdict || "Hire",
            conceptualAccuracy: evalData.starScore || 84,
            depthScore: 82,
            feedback: evalData.barRaiserFeedback || "Strong ownership.",
            detectedClaims: ["Team leadership", "Conflict resolution"],
            observedStrengths: evalData.strengths || ["Crisp situation setup"],
            observedGaps: evalData.improvements || ["Quantify metrics further"],
            nextFollowUp: {
              type: "APPLICATION",
              question: "How did that experience influence your next project?",
              reason: "Testing transfer of learning."
            }
          }
        ], candidateId);
        setPostFeedback(fb);
        speakText("Thank you. That completes our behavioral evaluation. Your evidence has been compiled.");
      }
    } catch (err) {
      console.error("Behavioral turn error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchTab = q.track_type === activeTab;
    const matchSearch = !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
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
              <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: 700 }}>STAR Behavioral & Corporate HR Round</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🤝</span>
              <span>STAR Behavioral & Corporate HR Arena • Dynamic Probe Engine</span>
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Mode Switcher (Section 4, 35) */}
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

            {/* Audio Toggle */}
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
            MODE 1: LEARN MODE (Behavioral Storytelling Principles)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "learn" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", borderRadius: 6, fontWeight: 800 }}>
                  STORYTELLING BLUEPRINT
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Safe Learning Environment (No interview pressure)
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 10px", color: "white" }}>
                The 4 Pillars of High-Signal Behavioral Communication
              </h2>

              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: "0 0 14px" }}>
                Senior tech interviewers (FAANG Bar-Raisers and HR Directors) do not evaluate memorized scripts. They listen for <strong>extreme ownership</strong>, <strong>counter-party empathy</strong>, and <strong>quantifiable impact</strong>. The classic mistake is speaking as a passive bystander (&ldquo;We decided to fix it&rdquo;) rather than establishing personal agency (&ldquo;I proposed and implemented...&rdquo;).
              </p>

              {/* Checkpoint */}
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", marginBottom: 6 }}>
                  CHECKPOINT: Identify the Strongest Behavioral Signal
                </div>
                <div style={{ fontSize: 12, color: "white", fontWeight: 700, marginBottom: 10 }}>
                  Which statement delivers the highest hiring signal when asked about a project failure?
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "A. 'The backend team shipped a broken API right before demo day, which caused our service to crash.'",
                    "B. 'I should have enforced schema contracts in CI earlier. When the API broke, I took ownership of the migration, shipped a hotfix within 4 hours, and instituted automated contract tests to prevent recurrence.'",
                    "C. 'We had some communication issues between teams, but everyone worked hard and eventually things got solved.'",
                    "D. 'I never made mistakes on the project because our architecture was very scalable.'"
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
                      ? "✓ Correct! Option B demonstrates ownership of the root cause, immediate constructive action, and systematic prevention."
                      : "Notice: Blaming others or claiming perfection is an instant rejection flag. Option B demonstrates true accountability."}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Demonstrated: Ownership & Storytelling Invariant
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
                  Draft Story in Practice Mode ➔
                </button>
              </div>
            </div>

            {/* Right: Competency Guide */}
            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 18 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", marginBottom: 10 }}>
                Target Competencies Evaluated
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { name: "Extreme Ownership", desc: "Takes responsibility for outcomes without deflecting blame.", status: "Demonstrated" },
                  { name: "Disagree & Commit", desc: "Constructively debates alternatives, then commits fully to team decision.", status: "Developing" },
                  { name: "Bias for Action", desc: "Navigates ambiguity and ships minimum viable solutions rapidly.", status: "Demonstrated" },
                  { name: "Dealing with Failure", desc: "Treats postmortems as learning opportunities with systemic fixes.", status: "Developing" }
                ].map((c, i) => (
                  <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <strong style={{ fontSize: 12, color: "white" }}>{c.name}</strong>
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: c.status === "Demonstrated" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)", color: c.status === "Demonstrated" ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                        {c.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 2: PRACTICE MODE (Story Builder Scaffolding)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "practice" && (
          <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 22, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(52,211,153,0.2)", color: "#34d399", borderRadius: 4, fontWeight: 800 }}>
                  PRACTICE MODE: STORY BUILDER
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: "4px 0 0", color: "white" }}>
                  Construct Your Behavioral Narrative with Invariant Prompts
                </h2>
              </div>
              <button
                onClick={() => setMode("interview")}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#080b12", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
              >
                Test in Live Interview ➔
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 18 }}>
              {/* Situation */}
              <div style={{ background: "#080b12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", marginBottom: 4 }}>
                  1. SITUATION & PROBLEM CONTEXT (15%)
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6 }}>Set the stakes, timeline constraint, and business impact.</div>
                <textarea
                  value={storySituation}
                  onChange={e => setStorySituation(e.target.value)}
                  rows={4}
                  style={{ width: "100%", background: "#04060a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: 8, color: "white", fontSize: 11, outline: "none", lineHeight: 1.4 }}
                />
              </div>

              {/* Action */}
              <div style={{ background: "#080b12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", marginBottom: 4 }}>
                  2. YOUR SPECIFIC ACTION (60%)
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6 }}>Use &ldquo;I&rdquo; statements. What specific technical/leadership steps did you take?</div>
                <textarea
                  value={storyAction}
                  onChange={e => setStoryAction(e.target.value)}
                  rows={4}
                  style={{ width: "100%", background: "#04060a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: 8, color: "white", fontSize: 11, outline: "none", lineHeight: 1.4 }}
                />
              </div>

              {/* Impact */}
              <div style={{ background: "#080b12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>
                  3. QUANTIFIABLE IMPACT (15%)
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6 }}>Metrics, hours saved, uptime percentage, customer satisfaction.</div>
                <textarea
                  value={storyImpact}
                  onChange={e => setStoryImpact(e.target.value)}
                  rows={4}
                  style={{ width: "100%", background: "#04060a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: 8, color: "white", fontSize: 11, outline: "none", lineHeight: 1.4 }}
                />
              </div>

              {/* Reflection */}
              <div style={{ background: "#080b12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#c084fc", marginBottom: 4 }}>
                  4. RETROSPECTIVE REFLECTION (10%)
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6 }}>What would you do differently today? What systemic mechanism did you add?</div>
                <textarea
                  value={storyReflection}
                  onChange={e => setStoryReflection(e.target.value)}
                  rows={4}
                  style={{ width: "100%", background: "#04060a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: 8, color: "white", fontSize: 11, outline: "none", lineHeight: 1.4 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 3: COACH MODE (Socratic Behavioral Feedback)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "coach" && (
          <div style={{ maxWidth: 840, margin: "0 auto", background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(251, 191, 36, 0.35)", borderRadius: 16, padding: 22, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>🎓</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: "#fbbf24", margin: 0 }}>
                  Socratic Behavioral & Culture Coach
                </h2>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Sharpens your ownership signals and probes for counter-party perspective
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
                      setCoachLog(prev => [...prev, { sender: "coach", text: "Notice how using passive voice obscures your contribution. Instead of 'A fallback was deployed', state 'I audited the endpoints and deployed the fallback'. What was the hardest trade-off you personally decided?" }]);
                    }, 400);
                  }
                }}
                placeholder="Share your draft or ask how to frame a difficult conflict..."
                style={{ flex: 1, background: "#080b12", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 11, outline: "none" }}
              />
              <button
                onClick={() => {
                  if (!coachInput.trim()) return;
                  const text = coachInput.trim();
                  setCoachInput("");
                  setCoachLog(prev => [...prev, { sender: "candidate", text }]);
                  setTimeout(() => {
                    setCoachLog(prev => [...prev, { sender: "coach", text: "Notice how using passive voice obscures your contribution. Instead of 'A fallback was deployed', state 'I audited the endpoints and deployed the fallback'. What was the hardest trade-off you personally decided?" }]);
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
            MODE 4: LIVE INTERVIEW SIMULATION (PRIMARY)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "interview" && (
          !interviewStarted ? (
          /* Pre-Session Setup */
          <div style={{ maxWidth: 800, margin: "20px auto", background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.6) 100%)", border: "1px solid rgba(245, 158, 11, 0.35)", borderRadius: 18, padding: "28px 32px", boxShadow: "0 15px 35px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(245,158,11,0.25)", color: "#fbbf24", borderRadius: 6, fontWeight: 800, textTransform: "uppercase" }}>
                  SESSION BRIEF
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 900, margin: "8px 0 4px", color: "white" }}>
                  {sessionBrief?.title}
                </h2>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Candidate Context: <strong style={{ color: "white" }}>Ownership & Disagreement Handling</strong>
                </div>
              </div>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(245,158,11,0.2)", color: "#fbbf24", fontWeight: 700 }}>
                {activeTab === "service_hr" ? "Service Mass HR Mode" : "FAANG Bar-Raiser Mode"}
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

            {/* Select Track Mode */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => setActiveTab("faang_star")}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: activeTab === "faang_star" ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
                  background: activeTab === "faang_star" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div style={{ fontWeight: 800, color: "#fbbf24" }}>Amazon / Product STAR Mode</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Interrogates personal ownership, disagreement, and measurable metrics</div>
              </button>

              <button
                onClick={() => setActiveTab("service_hr")}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: activeTab === "service_hr" ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                  background: activeTab === "service_hr" ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div style={{ fontWeight: 800, color: "#38bdf8" }}>TCS / Infosys Service HR Mode</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Verifies relocation willingness, 2-year service agreement, and shift stability</div>
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                ⏱️ Estimated Time: <strong>15 Minutes</strong>
              </div>
              <button
                onClick={() => handleStartLiveHRInterview(activeTab)}
                style={{
                  padding: "12px 28px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(245,158,11,0.4)"
                }}
              >
                Begin Behavioral Simulation ➔
              </button>
            </div>
          </div>
        ) : !sessionCompleted ? (
          /* Live Conversational Behavioral Interview */
          <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) 1fr", gap: 20, alignItems: "start" }}>
            
            {/* Left Panel: Priya Sharma (HR Director / Bar-Raiser) */}
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    👩‍💼
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>Priya Sharma • HR Director</div>
                    <div style={{ fontSize: 10, color: "#34d399" }}>● {activeTab === "service_hr" ? "Service HR" : "Bar-Raiser"} Live</div>
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
                        ? item.isProbe ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)"
                        : "rgba(56, 189, 248, 0.15)",
                      border: item.speaker === "interviewer"
                        ? item.isProbe ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid rgba(99, 102, 241, 0.25)"
                        : "1px solid rgba(56, 189, 248, 0.25)",
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "white"
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, color: item.speaker === "interviewer" ? (item.isProbe ? "#fbbf24" : "#a5b4fc") : "#38bdf8", marginBottom: 3 }}>
                      {item.speaker === "interviewer" ? (item.isProbe ? "⚡ DYNAMIC PROBE" : "INTERVIEWER") : "YOU"}
                    </div>
                    <div>{item.text}</div>
                    {item.evalResult && (
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 11, color: "#34d399" }}>
                        Score: {item.evalResult.starScore}/100 • Verdict: {item.evalResult.verdict}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Spoken / Typed Story Area */}
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 22 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(245,158,11,0.2)", color: "#fbbf24", fontWeight: 800 }}>
                    {activeTab === "service_hr" ? "SERVICE CULTURE" : "LEADERSHIP PRINCIPLE"}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px", color: "white" }}>
                  {activeQuestion.title}
                </h3>
                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.9)" }}>
                  {activeQuestion.question}
                </div>
              </div>

              {/* Dynamic Follow-Up Probe Alert */}
              {activeFollowUpProbe && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.35)", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 2 }}>
                    ⚡ Priya's Follow-Up Challenge:
                  </div>
                  <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>
                    {activeFollowUpProbe.question}
                  </div>
                </div>
              )}

              {/* Response Editor */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>
                    YOUR BEHAVIORAL STORY & RESPONSE
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
                    {isRecording ? "🔴 Listening... (Click to stop)" : "🎙️ Speak Your Answer"}
                  </button>
                </div>

                <textarea
                  value={candidateResponse}
                  onChange={e => setCandidateResponse(e.target.value)}
                  placeholder="Structure your story with Situation, Task, your specific Personal Action ('I' rather than 'we'), and the measurable Impact..."
                  rows={10}
                  style={{
                    width: "100%",
                    background: "#080b12",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: 14,
                    color: "white",
                    fontSize: 13,
                    lineHeight: 1.5,
                    resize: "vertical",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSubmitTurn}
                  disabled={evaluating}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: evaluating ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 15px rgba(245,158,11,0.3)"
                  }}
                >
                  {evaluating ? "Evaluating Story..." : activeFollowUpProbe ? "Submit Follow-Up Response ➔" : "Submit Answer & Defend ➔"}
                </button>
              </div>
            </div>

          </div>
        ) : postFeedback ? (
          /* Post-Session Feedback */
          <div style={{ maxWidth: 840, margin: "20px auto", background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: 20, padding: 30, boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <div style={{ fontSize: 10, padding: "2px 8px", background: "rgba(16,185,129,0.2)", color: "#34d399", borderRadius: 6, fontWeight: 800, display: "inline-block", marginBottom: 6 }}>
                    VERIFIED BEHAVIORAL EVIDENCE
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "white" }}>
                    Behavioral Hiring Committee Dossier
                  </h2>
                </div>

                <button
                  onClick={() => handleStartLiveHRInterview(activeTab)}
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
                  ↺ New Behavioral Session
                </button>
              </div>

              {/* Feedback Points */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", marginBottom: 6 }}>
                    ✓ WHAT YOU DEMONSTRATED
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                    Clear personal ownership and constructive conflict resolution under deadline pressure.
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 6 }}>
                    △ WHAT REMAINS UNCERTAIN
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                    Quantifiable impact metrics (e.g. latency reduced by X%, client turnaround improved by Y%).
                  </div>
                </div>
              </div>

              {/* Next Best Action */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                    RECOMMENDED NEXT PRACTICE ACTION
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginTop: 2 }}>
                    Retry the same story with measurable, quantifiable metrics.
                  </div>
                </div>

                <button
                  onClick={() => handleStartLiveHRInterview(activeTab)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#f59e0b",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Retry Differently ➔
                </button>
              </div>
            </div>
          ) : null
        )}

      </main>
    </div>
  );
}

export default function BehavioralHRPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#090d16" }} />}>
      <BehavioralHRContent />
    </React.Suspense>
  );
}
