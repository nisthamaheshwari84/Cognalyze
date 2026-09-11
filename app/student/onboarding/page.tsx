"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

const ONBOARDING_QUESTIONS = [
  {
    key: "intro",
    prompt: "👋 Welcome to Cognalyze Placement Intelligence! Let's get your profile set up so we can match you with the top hackathons, paid internships, and fellowships.\n\nTo start: What's your name, your college, year of graduation, and major?"
  },
  {
    key: "skills",
    prompt: "Great! What is your core technical stack? List languages, frameworks, databases, or tools you're most confident with (e.g. React, Next.js, Node.js, Python, PyTorch, PostgreSQL)."
  },
  {
    key: "projects",
    prompt: "Tell me about your best 1-2 projects or hackathon builds. What did you build, what stack was used, and what was the hardest part or outcome?"
  },
  {
    key: "targets",
    prompt: "What are your target roles and dream opportunities? (e.g., SDE Intern, AI Engineer, Full Stack Developer, Smart India Hackathon, Flipkart GRiD, YC startups)"
  },
  {
    key: "availability",
    prompt: "What is your availability right now? (e.g. Immediate part-time, Summer 2026/2027 full-time, 15-20 hours/week during college semester)"
  }
];

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-0",
      role: "assistant",
      content: ONBOARDING_QUESTIONS[0].prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [profilePreview, setProfilePreview] = useState<any>(null);
  const [candidateId, setCandidateId] = useState("student-demo");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate or retrieve persistent student candidate id
    const stored = localStorage.getItem("cognalyze_student_id");
    if (stored) {
      setCandidateId(stored);
    } else {
      const generated = "stud_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("cognalyze_student_id", generated);
      setCandidateId(generated);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSynthesizing]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSynthesizing) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const nextAnswers = {
      ...answers,
      [ONBOARDING_QUESTIONS[currentStep].key]: text
    };
    setAnswers(nextAnswers);
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const nextStep = currentStep + 1;
    if (nextStep < ONBOARDING_QUESTIONS.length) {
      setCurrentStep(nextStep);
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: "asst-" + Date.now(),
            role: "assistant",
            content: ONBOARDING_QUESTIONS[nextStep].prompt,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }, 500);
    } else {
      // Completed all questions — synthesize profile
      setCurrentStep(nextStep);
      setIsSynthesizing(true);
      setMessages(prev => [
        ...prev,
        {
          id: "synth-" + Date.now(),
          role: "assistant",
          content: "⚡ Analyzing your responses and synthesizing your Placement Intelligence Profile with Groq AI...",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);

      try {
        const res = await fetch("/api/student/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            answers: nextAnswers
          })
        });

        const data = await res.json();
        if (data.profile) {
          setProfilePreview(data.profile);
          setMessages(prev => [
            ...prev,
            {
              id: "done-" + Date.now(),
              role: "assistant",
              content: `🎉 Profile synthesized successfully!\n\nSummary: ${data.profile.profile_summary}\n\nTop Skills: ${(data.profile.skills || []).map((s: any) => s.name).join(", ")}\n\nYou are now ready to view matched hackathons and internships.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
          ]);
        }
      } catch (err: any) {
        console.error("Onboarding error:", err);
      } finally {
        setIsSynthesizing(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06030f", color: "#f3f4f6", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,3,15,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#6366f1,#a855f7)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>⚡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>COGNALYZE</div>
            <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 700, letterSpacing: 1.5 }}>STUDENT ONBOARDING</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/student" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
            Skip to Dashboard →
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem", height: "calc(100vh - 80px)" }}>
        
        {/* Chat Section */}
        <div style={{ display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
          {/* Progress Bar */}
          <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Step {Math.min(currentStep + 1, ONBOARDING_QUESTIONS.length)} of {ONBOARDING_QUESTIONS.length}
            </span>
            <div style={{ width: 140, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#a855f7)", transition: "width 0.4s ease" }} />
            </div>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {messages.map(m => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 10 }}>
                  {!isUser && (
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
                      🤖
                    </div>
                  )}
                  <div style={{ maxWidth: "80%", padding: "0.9rem 1.25rem", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "linear-gradient(135deg,#4f46e5,#6366f1)" : "rgba(255,255,255,0.05)", border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", color: isUser ? "#ffffff" : "#e2e8f0" }}>
                    {m.content}
                    <div style={{ fontSize: 10, opacity: 0.4, marginTop: 6, textAlign: isUser ? "right" : "left" }}>{m.timestamp}</div>
                  </div>
                </div>
              );
            })}
            {isSynthesizing && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚡</div>
                <div style={{ padding: "0.75rem 1.25rem", borderRadius: 18, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#6366f1", animation: "pulse 1s infinite" }}></span>
                  Parsing skills, projects & alignment with LLM...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,3,15,0.6)" }}>
            {currentStep < ONBOARDING_QUESTIONS.length ? (
              <div style={{ display: "flex", gap: 10 }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response here... (Press Enter to send)"
                  rows={2}
                  style={{ flex: 1, padding: "0.85rem 1.15rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "white", fontSize: 13, outline: "none", resize: "none" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isSynthesizing}
                  style={{ padding: "0 1.5rem", background: input.trim() ? "linear-gradient(135deg,#6366f1,#a855f7)" : "rgba(255,255,255,0.06)", color: "white", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: input.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}
                >
                  Send ➔
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button
                  onClick={() => router.push("/student")}
                  style={{ padding: "0.85rem 2.2rem", background: "linear-gradient(135deg,#00ff88,#10b981)", color: "#06030f", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 0 25px rgba(0,255,136,0.3)" }}
                >
                  Go to Student Dashboard 🚀
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Profile Extraction Preview Sidebar */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto" }}>
          <div>
            <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>REAL-TIME INTELLIGENCE</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Placement Profile</h3>
          </div>

          {profilePreview ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "1rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600, marginBottom: 4 }}>PROFILE SUMMARY</div>
                <div style={{ fontSize: 13, color: "#f3f4f6", lineHeight: 1.5 }}>{profilePreview.profile_summary}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>IDENTIFIED SKILLS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(profilePreview.skills || []).map((s: any, idx: number) => (
                    <span key={idx} style={{ fontSize: 11, padding: "3px 9px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#38bdf8" }}>
                      {s.name} <span style={{ opacity: 0.5, fontSize: 10 }}>({s.level})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>TARGET ROLES</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(profilePreview.target_roles || []).map((r: string, idx: number) => (
                    <span key={idx} style={{ fontSize: 11, padding: "3px 9px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, color: "#34d399" }}>
                      🎯 {r}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: "0.85rem", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Risk Appetite:</span>
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>{profilePreview.risk_appetite}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🧬</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Profile synthesizing in progress</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Answer the questions on the left to generate your DNA match vectors.</div>
            </div>
          )}

          <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            🔒 Stored securely in Supabase with student-isolated Row Level Security.
          </div>
        </div>

      </div>
    </div>
  );
}
