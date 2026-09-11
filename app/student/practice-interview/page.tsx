"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { saveSession } from "@/lib/interview-session-store";

interface Msg {
  role: "user" | "assistant";
  content: string;
  time: string;
  isFollowUp?: boolean;
}

type ExperienceMode = "fresher" | "1-3yr" | "experienced" | "career-switcher";

const EXPERIENCE_MODES: Array<{
  id: ExperienceMode;
  title: string;
  badge: string;
  description: string;
  icon: string;
}> = [
  {
    id: "fresher",
    title: "Fresher / Student",
    badge: "0 Years / College",
    description: "Evaluated on academic projects, CS core fundamentals, DSA & hackathons. No corporate jargon expected.",
    icon: "🎓",
  },
  {
    id: "1-3yr",
    title: "Early Career",
    badge: "1 - 3 Years Exp",
    description: "Balanced mix of code ownership, debugging production incidents, and feature lifecycle trade-offs.",
    icon: "💻",
  },
  {
    id: "experienced",
    title: "Experienced Engineer",
    badge: "3+ Years Exp",
    description: "High-level architecture, scalability bottlenecks, cross-team technical leadership, and business metrics.",
    icon: "🏛️",
  },
  {
    id: "career-switcher",
    title: "Career Switcher",
    badge: "Transition Track",
    description: "Evaluated on transferable domain skills, self-taught rigor, rapid ramp-up ability, and motivation.",
    icon: "🔄",
  },
];

function PracticeInterviewContent() {
  const searchParams = useSearchParams();
  const opportunityId = searchParams.get("opportunityId") || "";

  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);

  const [role, setRole] = useState("Software Development Engineer (SDE Intern)");
  const [topic, setTopic] = useState("Distributed Systems, Concurrency & API Architecture");
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>("fresher");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [currentScore, setCurrentScore] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // Adaptive engine state
  const [sessionState, setSessionState] = useState<any>(null);
  const [lastAssessment, setLastAssessment] = useState<any>(null);
  const [activeQuestionMeta, setActiveQuestionMeta] = useState<any>(null);
  const [ended, setEnded] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load student profile & target opportunity
  useEffect(() => {
    const cId = localStorage.getItem("cognalyze_student_id") || "student-demo";
    fetch(`/api/student/onboarding?candidateId=${cId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setStudentProfile(data.profile);
          if (data.profile.target_roles?.[0]) {
            setRole(data.profile.target_roles[0]);
          }
          if (data.profile.experience_level) {
            setExperienceMode(data.profile.experience_level);
          }
        }
      })
      .catch(console.error);

    if (opportunityId) {
      fetch("/api/opportunities/ingest")
        .then((res) => res.json())
        .then((data) => {
          const match = (data.opportunities || []).find((o: any) => o.id === opportunityId);
          if (match) {
            setOpportunity(match);
            setRole(`${match.organizer} — ${match.title}`);
            setTopic(match.tags?.join(", ") || match.domain_tags?.join(", ") || "System Design & Algorithms");
          }
        })
        .catch(console.error);
    }
  }, [opportunityId]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.onresult = (event: any) => {
          let str = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            str += event.results[i][0].transcript;
          }
          setInput(str);
        };
        rec.onend = () => setIsListening(false);
        rec.onerror = () => setIsListening(false);
        recognitionRef.current = rec;
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Voice output
  const speakVoice = useCallback(
    (text: string) => {
      if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 1.02;
        utt.pitch = 0.95;
        window.speechSynthesis.speak(utt);
      } catch (e) {
        console.warn("TTS error:", e);
      }
    },
    [soundEnabled]
  );

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your response.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const startPractice = async () => {
    setStarted(true);
    setLoading(true);

    const candidateSkills = studentProfile?.skills?.map((s: any) => s.name).join(", ") || "Full Stack & Distributed Systems";
    const candidateProjects = studentProfile?.past_projects?.map((p: any) => `${p.title} (${p.tech_stack?.join(", ") || ""})`).join("; ") || "Production pipelines & distributed telemetry";

    const jdContext = `Target Opportunity: ${opportunity?.title || role}. Organizer: ${opportunity?.organizer || "FAANG / Tier 1"}. Focus: ${topic}. Key Requirements: Production scalability, edge-case failure modes, deep technical trade-offs.`;
    const resumeContext = `Candidate Skills: ${candidateSkills}. Past Projects: ${candidateProjects}. Target Roles: ${studentProfile?.target_roles?.join(", ") || role}.`;

    try {
      const chatRes = await fetch("/api/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          jd: jdContext,
          resume: resumeContext,
          qNumber: 0,
          experienceMode,
        }),
      });

      const chatData = await chatRes.json();
      const firstMsg = chatData.message || `Welcome to your practice interview for ${opportunity?.title || role}! Let's dive in: Looking at your background in ${candidateSkills}, walk me through the most technically demanding project you've completed.`;

      if (chatData.session_state) {
        setSessionState(chatData.session_state);
      }
      setActiveQuestionMeta({
        question_targets: chatData.question_targets,
        question_type: chatData.question_type,
        difficulty_level: chatData.difficulty_level,
        is_follow_up: chatData.is_follow_up,
      });

      setMessages([
        {
          role: "assistant",
          content: firstMsg,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isFollowUp: false,
        },
      ]);
      speakVoice(firstMsg);
    } catch (e) {
      console.error(e);
      setMessages([
        {
          role: "assistant",
          content: `Welcome to the ${opportunity?.title || role} technical round. Given your background in ${candidateSkills}, how would you approach the core bottleneck in this track?`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || ended) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: Msg = {
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const candidateSkills = studentProfile?.skills?.map((s: any) => s.name).join(", ") || "Full Stack & Distributed Systems";
    const candidateProjects = studentProfile?.past_projects?.map((p: any) => `${p.title} (${p.tech_stack?.join(", ") || ""})`).join("; ") || "Real-world pipelines";

    const jdContext = `Target Opportunity: ${opportunity?.title || role}. Organizer: ${opportunity?.organizer || "FAANG / Tier 1"}. Focus: ${topic}.`;
    const resumeContext = `Candidate Skills: ${candidateSkills}. Past Projects: ${candidateProjects}.`;

    try {
      const chatRes = await fetch("/api/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          jd: jdContext,
          resume: resumeContext,
          qNumber: updated.filter((m) => m.role === "assistant").length + 1,
          experienceMode,
          sessionState,
        }),
      });

      const chatData = await chatRes.json();
      const asstMsg: Msg = {
        role: "assistant",
        content: chatData.message || "That's a thoughtful approach. How do you defend against data consistency issues when network partitions happen?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isFollowUp: chatData.is_follow_up || false,
      };

      setMessages((prev) => [...prev, asstMsg]);
      speakVoice(asstMsg.content);

      if (chatData.answer_assessment) {
        setLastAssessment(chatData.answer_assessment);
      }
      if (chatData.session_state) {
        setSessionState(chatData.session_state);
      }
      setActiveQuestionMeta({
        question_targets: chatData.question_targets,
        question_type: chatData.question_type,
        difficulty_level: chatData.difficulty_level,
        is_follow_up: chatData.is_follow_up,
      });

      // Fetch live evaluation
      const scoreRes = await fetch("/api/interview-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          jd: jdContext,
          resume: resumeContext,
        }),
      });
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setCurrentScore(scoreData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndAndSave = async () => {
    setEnded(true);
    const candidateId = localStorage.getItem("cognalyze_student_id") || "student-demo";
    const distribution = sessionState?.answer_distribution || {
      strong: 0,
      adequate: 0,
      shallow: 0,
      off_topic: 0,
    };
    const overallScore = currentScore?.overall || 78;
    const weakTopics = sessionState?.consecutive_shallow > 0
      ? sessionState.topics_covered.slice(-2)
      : [];

    const saved = await saveSession({
      candidate_id: candidateId,
      session_type: "mock_interview",
      experience_mode: experienceMode,
      target_role: role,
      target_company: opportunity?.organizer || "FAANG / Tier 1",
      opportunity_id: opportunityId || undefined,
      topics_covered: sessionState?.topics_covered || [topic],
      answer_distribution: distribution,
      security_flags: { tab_switches: 0, face_violations: 0 },
      overall_score: overallScore,
      weak_topics_identified: weakTopics,
    });

    setSavedSessionId(saved.id);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06030f", color: "#f3f4f6", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,3,15,0.85)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/student" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
            ← Dashboard
          </Link>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
          <div>
            <div style={{ fontSize: 13, color: "#34d399", fontWeight: 800, letterSpacing: 0.5 }}>ADAPTIVE TECHNICAL INTERVIEW</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              {opportunity ? `Tailored for ${opportunity.title}` : "FAANG Bar-Raiser Practice Arena"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/student/interview-prep/history"
            style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#c7d2fe", textDecoration: "none", fontWeight: 600 }}
          >
            📊 Prep History
          </Link>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: soundEnabled ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: soundEnabled ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.1)", color: soundEnabled ? "#34d399" : "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 700 }}
          >
            {soundEnabled ? "🔊 Voice TTS On" : "🔇 Voice TTS Muted"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "1.75rem 1.5rem" }}>
        {!started ? (
          <div style={{ maxWidth: 720, margin: "2rem auto", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>🎯</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: 2 }}>GENUINE ADAPTIVE PROBING</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, letterSpacing: -0.5 }}>
              {opportunity ? `Interview Preparation: ${opportunity.title}` : "Personalized Technical Bar-Raiser"}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Alex assesses every answer in real time. Give a surface-level response and he probes deeper into implementation and trade-offs. Give a strong answer and he advances difficulty and topic.
            </p>

            {/* Experience Mode Selector */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                1. SELECT YOUR EXPERIENCE TRACK
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {EXPERIENCE_MODES.map((m) => {
                  const active = experienceMode === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setExperienceMode(m.id)}
                      style={{
                        padding: "1rem",
                        borderRadius: 14,
                        border: `1.5px solid ${active ? "#10b981" : "rgba(255,255,255,0.08)"}`,
                        background: active ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{m.icon}</span>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: active ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)", color: active ? "#34d399" : "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                          {m.badge}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: active ? "white" : "#e2e8f0", marginBottom: 4 }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                        {m.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {studentProfile && (
              <div style={{ padding: "1rem 1.2rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 14, marginBottom: "1.5rem" }}>
                <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                  DETECTED CANDIDATE CONTEXT
                </div>
                <div style={{ fontSize: 12, color: "white", fontWeight: 700, marginBottom: 4 }}>
                  Skills: {studentProfile.skills?.map((s: any) => s.name).join(", ")}
                </div>
                {studentProfile.past_projects?.[0] && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                    Primary Project: <strong>{studentProfile.past_projects[0].title}</strong> ({studentProfile.past_projects[0].tech_stack?.join(", ")})
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.75rem" }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, display: "block", marginBottom: 6 }}>TARGET POSITION / EVENT</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, display: "block", marginBottom: 6 }}>TECHNICAL FOCUS & THEMES</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <button
              onClick={startPractice}
              style={{ width: "100%", padding: "1rem", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 0 25px rgba(16,185,129,0.3)" }}
            >
              Start Adaptive Interview ({EXPERIENCE_MODES.find((m) => m.id === experienceMode)?.title}) ➔
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 390px", gap: "1.5rem", height: "calc(100vh - 105px)" }}>
            {/* Chat Stream */}
            <div style={{ display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
                  <span style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>Adaptive Mock Round</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(255,255,255,0.06)", borderRadius: 999, color: "rgba(255,255,255,0.6)" }}>
                    {experienceMode}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!ended ? (
                    <button
                      onClick={handleEndAndSave}
                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#f87171", cursor: "pointer", fontWeight: 600 }}
                    >
                      End & Save Session
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>Session Saved ✓</span>
                  )}
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Alex • FAANG Staff</span>
                </div>
              </div>

              {/* Active question indicator banner */}
              {activeQuestionMeta && (
                <div style={{ padding: "6px 1.5rem", background: activeQuestionMeta.is_follow_up ? "rgba(245,158,11,0.08)" : "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: activeQuestionMeta.is_follow_up ? "#fbbf24" : "#a5b4fc", fontWeight: 700 }}>
                    {activeQuestionMeta.is_follow_up ? "🔍 DEEP PROBE: Following up on previous answer" : `🎯 FOCUS: ${activeQuestionMeta.question_type || "Technical"}`}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>
                    Difficulty: <strong style={{ color: "#34d399" }}>{activeQuestionMeta.difficulty_level || "medium"}</strong>
                  </span>
                </div>
              )}

              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {messages.map((m, i) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 10, width: "100%" }}>
                        {!isUser && (
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: m.isFollowUp ? "linear-gradient(135deg,#d97706,#f59e0b)" : "linear-gradient(135deg,#059669,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                            {m.isFollowUp ? "🔍" : "👔"}
                          </div>
                        )}
                        <div
                          style={{
                            maxWidth: "82%",
                            padding: "0.95rem 1.3rem",
                            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: isUser ? "linear-gradient(135deg,#4f46e5,#6366f1)" : m.isFollowUp ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.05)",
                            border: isUser ? "none" : m.isFollowUp ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.08)",
                            fontSize: 14,
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                            color: isUser ? "white" : "#e2e8f0",
                          }}
                        >
                          {m.content}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: isUser ? "0 4px 0 0" : "0 0 0 44px" }}>
                        {m.time} {m.isFollowUp && "• follow-up probe"}
                      </span>
                    </div>
                  );
                })}
                {loading && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#a5b4fc", fontSize: 13, padding: "0.5rem 0" }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#a5b4fc", animation: "pulse 1s infinite" }} />
                    <span>Alex is assessing your answer and preparing next question...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={toggleMic}
                  disabled={ended}
                  style={{ width: 42, height: 42, borderRadius: 12, border: isListening ? "2px solid #ef4444" : "1px solid rgba(255,255,255,0.15)", background: isListening ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", color: isListening ? "#f87171" : "white", fontSize: 16, cursor: ended ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  title="Speak via Microphone"
                >
                  {isListening ? "🔴" : "🎤"}
                </button>
                <textarea
                  rows={2}
                  value={input}
                  disabled={ended}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={ended ? "Interview ended. Check your session history." : "Speak or type your technical explanation... (Enter to send)"}
                  style={{ flex: 1, padding: "0.85rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "white", fontSize: 13, outline: "none", resize: "none" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || ended}
                  style={{ padding: "0 1.5rem", height: 42, background: input.trim() && !ended ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.06)", color: "white", border: "none", borderRadius: 12, fontWeight: 700, cursor: input.trim() && !ended ? "pointer" : "not-allowed" }}
                >
                  Send ➔
                </button>
              </div>
            </div>

            {/* Live Feedback Sidebar */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Live Answer Assessment Card */}
              <div>
                <div style={{ fontSize: 10, color: "#34d399", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                  REAL-TIME ANSWER ASSESSMENT
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "2px 0 0" }}>Adaptive Engine Feedback</h3>
              </div>

              {lastAssessment ? (
                <div style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Answer Quality:</span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        background:
                          lastAssessment.answer_quality === "strong"
                            ? "rgba(16,185,129,0.2)"
                            : lastAssessment.answer_quality === "adequate"
                            ? "rgba(245,158,11,0.2)"
                            : "rgba(239,68,68,0.2)",
                        color:
                          lastAssessment.answer_quality === "strong"
                            ? "#34d399"
                            : lastAssessment.answer_quality === "adequate"
                            ? "#fbbf24"
                            : "#f87171",
                      }}
                    >
                      {lastAssessment.answer_quality}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, marginBottom: 10 }}>
                    {lastAssessment.reasoning}
                  </div>

                  <div style={{ padding: "8px 10px", borderRadius: 8, background: lastAssessment.next_action === "follow_up_probe" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{lastAssessment.next_action === "follow_up_probe" ? "🔍" : "➡️"}</span>
                    <span style={{ color: lastAssessment.next_action === "follow_up_probe" ? "#fbbf24" : "#34d399", fontWeight: 700 }}>
                      {lastAssessment.next_action === "follow_up_probe" ? "Alex is probing deeper on this topic" : "Alex is moving to a new topic"}
                    </span>
                  </div>

                  {lastAssessment.topics_demonstrated?.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {lastAssessment.topics_demonstrated.map((t: string, idx: number) => (
                        <span key={idx} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(255,255,255,0.06)", borderRadius: 6, color: "rgba(255,255,255,0.7)" }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "rgba(255,255,255,0.3)", fontSize: 12, background: "rgba(255,255,255,0.02)", borderRadius: 12 }}>
                  Answer Alex&apos;s question to see real-time answer quality assessment.
                </div>
              )}

              {/* Running session stats */}
              {sessionState && (
                <div style={{ padding: "0.85rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>
                    SESSION DISTRIBUTION
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
                    <div style={{ padding: "6px 2px", background: "rgba(16,185,129,0.08)", borderRadius: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#34d399" }}>
                        {sessionState.answer_distribution?.strong || 0}
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Strong</div>
                    </div>
                    <div style={{ padding: "6px 2px", background: "rgba(245,158,11,0.08)", borderRadius: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#fbbf24" }}>
                        {sessionState.answer_distribution?.adequate || 0}
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Adequate</div>
                    </div>
                    <div style={{ padding: "6px 2px", background: "rgba(249,115,22,0.08)", borderRadius: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#f97316" }}>
                        {sessionState.answer_distribution?.shallow || 0}
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Shallow</div>
                    </div>
                    <div style={{ padding: "6px 2px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#f87171" }}>
                        {sessionState.answer_distribution?.off_topic || 0}
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Off-topic</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Scoring */}
              {currentScore && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.85rem 1rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14 }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#34d399" }}>{currentScore.overall || 82}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                      <div>Current Response Score</div>
                      <div style={{ fontSize: 10, color: "#34d399", fontWeight: 700 }}>{currentScore.hiringSignal || "SOLID TECHNICAL FIT"}</div>
                    </div>
                  </div>

                  {currentScore.evidence?.strengths?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: "#34d399", fontWeight: 700, marginBottom: 4 }}>✓ DEMONSTRATED STRENGTHS</div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                        {currentScore.evidence.strengths.slice(0, 3).map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentScore.evidence?.improvements?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700, marginBottom: 4 }}>⚠️ TO LEVEL UP</div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                        {currentScore.evidence.improvements.slice(0, 3).map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {ended && (
                <div style={{ padding: "1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#34d399", marginBottom: 4 }}>
                    Session Concluded & Saved!
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
                    Your responses have been recorded in your prep history.
                  </div>
                  <Link
                    href="/student/interview-prep/history"
                    style={{ display: "inline-block", padding: "6px 14px", borderRadius: 8, background: "#10b981", color: "white", textDecoration: "none", fontSize: 12, fontWeight: 700 }}
                  >
                    View Prep History ➔
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentPracticeInterviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#05070e", color: "white", padding: "3rem", textAlign: "center" }}>Loading Practice Arena...</div>}>
      <PracticeInterviewContent />
    </Suspense>
  );
}
