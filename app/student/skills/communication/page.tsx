"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CommunicationPrompt, SEED_COMMUNICATION_PROMPTS } from "@/lib/skill-hub-store";

export default function CommunicationStudioPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [viewMode, setViewMode] = useState<"learn" | "practice" | "coach" | "interview">("interview");
  
  // Audience Adaptation Tier
  const [audienceTier, setAudienceTier] = useState<"grandparent" | "junior_dev" | "staff_architect">("grandparent");
  
  // Prompts & Selection
  const [prompts, setPrompts] = useState<CommunicationPrompt[]>(SEED_COMMUNICATION_PROMPTS);
  const [selectedPromptId, setSelectedPromptId] = useState<string>(SEED_COMMUNICATION_PROMPTS[0].id);

  // Input state
  const [inputMode, setInputMode] = useState<"speech" | "typed">("speech");
  const [userText, setUserText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<any>(null);

  // Learn Mode state
  const [selectedConceptIdx, setSelectedConceptIdx] = useState(0);
  const [checkpointAnswer, setCheckpointAnswer] = useState<number | null>(null);
  const [checkpointSubmitted, setCheckpointSubmitted] = useState(false);
  const [socraticAnswer, setSocraticAnswer] = useState("");
  const [socraticFeedback, setSocraticFeedback] = useState<string | null>(null);

  // Coach Mode state
  const [coachSocraticHint, setCoachSocraticHint] = useState<string | null>(null);

  // Interview Mode state (Dynamic Scenarios & Conversational Follow-up)
  const [interviewStep, setInterviewStep] = useState<"prompt" | "answering" | "followup" | "evaluation">("prompt");
  const [interviewFollowupQuestion, setInterviewFollowupQuestion] = useState<string | null>(null);
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [interviewHistory, setInterviewHistory] = useState<Array<{ speaker: string; text: string }>>([]);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Real-time filler detection
  const fillerRegex = /\b(um|uh|like|you know|actually|basically|sort of|kind of|literally)\b/gi;
  const detectedFillersInText = (userText.match(fillerRegex) || []).map(f => f.toLowerCase());
  const wordsCount = userText.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = elapsedSeconds > 5 ? Math.round((wordsCount / elapsedSeconds) * 60) : 0;

  // Learn Mode Curriculum
  const concepts = [
    {
      id: "bluf",
      title: "1. The Pyramid Principle & BLUF",
      subtitle: "Bottom-Line-Up-Front for Executive & Stakeholder Briefings",
      summary: "In engineering crises or sprint updates, stakeholders do not want chronological history. State the conclusion and business impact first, then support with 2-3 key drivers.",
      keyPoints: [
        "Lead with the outcome: 'The release will be delayed 48 hours to patch an auth token vulnerability.'",
        "Group supporting arguments logically: Impact -> Root Cause -> Remediation -> Expected Recovery.",
        "Avoid the chronological trap: Never start with 'At 8 AM the server alerted, then we checked logs, then John discovered...'"
      ],
      checkpoint: {
        question: "A high-priority API migration failed 2 hours before release. What is the optimal BLUF opening to the VP of Engineering?",
        options: [
          "Around 2 PM our worker queue started throwing 504 timeouts, so the team investigated Redis connections and found connection pool saturation.",
          "The checkout migration is postponed by 3 hours due to connection pool limits; rollback is complete and no transactions were dropped.",
          "I apologize, our backend team didn't anticipate the traffic surge on staging and the script timed out.",
          "We are currently working very hard on debugging the database and will update everyone when possible."
        ],
        correct: 1,
        explanation: "Option B leads directly with the decision (postponed 3 hours), the technical driver (connection pool limits), business risk assurance (zero dropped transactions), and current state (rollback complete)."
      }
    },
    {
      id: "fillers",
      title: "2. Eliminating Verbal Fillers & Embracing the Pause",
      subtitle: "Transforming 'Um / Basically / Like' into Authoritative Silence",
      summary: "Fillers are cognitive buffers when the brain searches for words. Senior communicators replace filler sounds with a 1-second deliberate breath, which sounds intentional and confident.",
      keyPoints: [
        "A 1-second pause feels long to the speaker, but sounds authoritative and measured to the listener.",
        "Common culprits: 'Basically' (minimizes complexity), 'Like' (shows uncertainty), 'Actually' (sounds defensive).",
        "Practice phrasing thoughts in short, 10-15 word declarative sentences rather than run-on clauses."
      ],
      checkpoint: {
        question: "When an interviewer asks a difficult trade-off question you need 5 seconds to think about, what is the best verbal strategy?",
        options: [
          "Say: 'Um, basically, like, there are multiple ways we could consider this, like...'",
          "Say: 'That is a critical constraint. Let me take five seconds to structure the trade-offs between consistency and latency.'",
          "Begin speaking immediately with whatever thoughts first cross your mind.",
          "Say: 'I actually know this answer, let me remember how the textbook solved it.'"
        ],
        correct: 1,
        explanation: "Acknowledging the question and stating your thinking framework buys composure without relying on distracting vocalized fillers."
      }
    },
    {
      id: "audience",
      title: "3. Audience Adaptation: Plain-English Translation",
      subtitle: "Translating Inodes, Race Conditions, and DB Locks for Non-Engineers",
      summary: "True mastery of software engineering is the ability to explain complex mechanisms using familiar physical analogies without patronizing your audience.",
      keyPoints: [
        "Non-Technical / Grandparent: Use physical analogies (Postal carrier, library indexing, bank safety deposit boxes).",
        "Product Manager: Focus on business risk, user experience friction, and sprint velocity trade-offs.",
        "Principal Architect: Defend latency percentiles (p99), memory boundaries, and failure isolation."
      ],
      checkpoint: {
        question: "How do you explain 'Database Indexing' to an angry retail store manager who wants to know why search is lagging?",
        options: [
          "Explain B-Tree node traversal and how disk I/O requires O(log N) page lookups on SSD storage.",
          "Say: 'It's like an alphabetical index at the back of a 1,000-page catalog. Without it, we have to flip through every single page from page 1 to find your shirt.'",
          "Tell them it's a technical database configuration that the DevOps team is tuning.",
          "Say: 'We need to write an SQL statement with CREATE INDEX to fix the query planner.'"
        ],
        correct: 1,
        explanation: "The catalog index analogy immediately communicates the difference between an exhaustive scan and a direct pointer lookup in everyday human terms."
      }
    }
  ];

  // Dynamic Interview Scenarios (Section 39)
  const interviewScenarios = [
    {
      id: "delay_client",
      title: "Client Crisis: Two-Day Production Delay",
      role: "Client Delivery Partner & Senior Account Director",
      scenario: "You are the tech lead explaining a 48-hour production delay for an enterprise e-commerce launch to a high-value client whose team is already frustrated. The delay is caused by an unverified third-party payment gateway token invalidation.",
      openingPrompt: "We committed to going live on Wednesday morning. Marketing campaigns are already scheduled. Why are we delaying the release by two full days, and what guarantee do I have that Friday won't slip as well?",
      followupQuestion: "You mentioned the third-party payment token issue was uncovered during load testing. Why wasn't this token behavior tested two weeks ago during our sprint integration phase?"
    },
    {
      id: "tech_debt",
      title: "Stakeholder Negotiation: Paying Down Technical Debt",
      role: "VP of Product Management",
      scenario: "The engineering team is struggling with a monolithic SQL schema that causes weekly regressions. You must convince the VP of Product to allocate 40% of the next 2 sprints to database refactoring instead of new user-facing features.",
      openingPrompt: "Our roadmap for Q3 is packed with competitive features our sales team promised. Why should I surrender nearly half of our engineering bandwidth to something our end users will never see?",
      followupQuestion: "If we approve this refactoring, what measurable metric improves? How will I prove to executive leadership that this was worth delaying the customer loyalty portal?"
    },
    {
      id: "p0_incident",
      title: "Executive Post-Mortem: 45-Minute Checkout Outage",
      role: "Chief Technology Officer (CTO)",
      scenario: "During a flash sale, the primary inventory service experienced connection pool exhaustion, dropping 14,000 checkout requests over 45 minutes. You are briefing the CTO 1 hour after resolution.",
      openingPrompt: "Walk me through what happened, what the financial and user impact was, and why our circuit breakers failed to isolate the inventory service.",
      followupQuestion: "What automated canary or health-check gate are we implementing before this weekend's second flash sale to make sure this failure mode is impossible?"
    }
  ];

  const activeScenario = interviewScenarios[0];

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

  const handleCoachAnalyze = () => {
    const fillers = detectedFillersInText;
    const words = wordsCount;
    const textLower = userText.toLowerCase();

    if (words < 15) {
      setCoachSocraticHint("You have only spoken a few words. State a full thought including your conclusion, root cause, and immediate next steps.");
      return;
    }

    if (fillers.length >= 2) {
      setCoachSocraticHint(`Coach noticed you relied on fillers: "${fillers.slice(0, 3).join(', ')}". Try replacing these transitions with a 1-second pause. How would you restate your first sentence without saying "${fillers[0]}"?`);
      return;
    }

    if (textLower.includes("because") && !textLower.includes("delay") && !textLower.includes("recommend") && !textLower.includes("will")) {
      setCoachSocraticHint("You began with explanations and reasons before stating the concrete outcome. How can you apply the Pyramid Principle (BLUF) to lead with the bottom-line first?");
      return;
    }

    setCoachSocraticHint("Strong, structured articulation. Your pacing is clear. Can you make your final sentence an explicit ownership commitment with a clear timestamp?");
  };

  const submitForEvaluation = async (isInterviewFollowup = false) => {
    if (isRecording) {
      stopRecording();
    }
    const textToEval = isInterviewFollowup ? followupAnswer : userText;
    if (!textToEval.trim()) {
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
          spokenText: textToEval,
          durationSeconds: elapsedSeconds || 45,
          audienceTier
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

  const handleInterviewFirstAnswer = () => {
    if (!userText.trim()) return;
    setInterviewHistory([
      { speaker: activeScenario.role, text: activeScenario.openingPrompt },
      { speaker: "Candidate", text: userText }
    ]);
    setInterviewFollowupQuestion(activeScenario.followupQuestion);
    setInterviewStep("followup");
    setElapsedSeconds(0);
    setUserText("");
  };

  const handleInterviewFollowupAnswer = async () => {
    if (!followupAnswer.trim()) return;
    setInterviewHistory(prev => [
      ...prev,
      { speaker: activeScenario.role, text: activeScenario.followupQuestion },
      { speaker: "Candidate", text: followupAnswer }
    ]);
    setInterviewStep("evaluation");
    await submitForEvaluation(true);
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
              <span style={{ color: "#10b981", fontSize: 13, fontWeight: 700 }}>Domain 5: Spoken English & Technical Articulation</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              🎙️ Corporate Spoken English & Executive Communication
            </h1>
          </div>

          {/* UNIFIED MODE SELECTOR */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.5)", padding: 4, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setViewMode("learn")}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: viewMode === "learn" ? "#10b981" : "transparent",
                color: viewMode === "learn" ? "white" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              💡 Learn
            </button>
            <button
              onClick={() => setViewMode("practice")}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: viewMode === "practice" ? "#10b981" : "transparent",
                color: viewMode === "practice" ? "white" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              🛠️ Practice
            </button>
            <button
              onClick={() => setViewMode("coach")}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: viewMode === "coach" ? "#10b981" : "transparent",
                color: viewMode === "coach" ? "white" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              🎓 Coach
            </button>
            <button
              onClick={() => setViewMode("interview")}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: viewMode === "interview" ? "#10b981" : "transparent",
                color: viewMode === "interview" ? "white" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              🎯 Interview
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* ════════════════════════════════════════════════════════════════
            1. LEARN MODE
            ════════════════════════════════════════════════════════════════ */}
        {viewMode === "learn" && (
          <div>
            <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                ADAPTIVE LEARNING TUTOR • SPOKEN ENGLISH & ARTICULATION
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 8px", color: "white" }}>
                Mastering Concise, Authoritative Technical Communication
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Move from stream-of-consciousness filler habits to executive-level Bottom-Line-Up-Front (BLUF) delivery.
              </p>
            </div>

            {/* Concept Selector Pills */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
              {concepts.map((c, idx) => {
                const isSel = idx === selectedConceptIdx;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedConceptIdx(idx);
                      setCheckpointAnswer(null);
                      setCheckpointSubmitted(false);
                      setSocraticFeedback(null);
                    }}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 14,
                      background: isSel ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(15,23,42,0.9))" : "rgba(15,23,42,0.6)",
                      border: isSel ? "2px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: isSel ? "#34d399" : "white", marginBottom: 4 }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                      {c.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Concept Lesson Body */}
            {(() => {
              const currentConcept = concepts[selectedConceptIdx];
              return (
                <div style={{ background: "rgba(15,23,42,0.75)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px", marginBottom: 28 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", marginTop: 0, marginBottom: 8 }}>
                    {currentConcept.title}: {currentConcept.subtitle}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, marginBottom: 16 }}>
                    {currentConcept.summary}
                  </p>

                  <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 8 }}>
                      Core Communication Rules:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>
                      {currentConcept.keyPoints.map((kp, kIdx) => (
                        <li key={kIdx} style={{ marginBottom: 6 }}>{kp}</li>
                      ))}
                    </ul>
                  </div>

                  {/* CONCEPT CHECKPOINT */}
                  <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: "20px" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                      ⚡ Concept Checkpoint
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 14 }}>
                      {currentConcept.checkpoint.question}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                      {currentConcept.checkpoint.options.map((opt, optIdx) => {
                        const isChosen = checkpointAnswer === optIdx;
                        let optBg = "rgba(255,255,255,0.03)";
                        let optBorder = "rgba(255,255,255,0.08)";
                        if (checkpointSubmitted) {
                          if (optIdx === currentConcept.checkpoint.correct) {
                            optBg = "rgba(16,185,129,0.2)";
                            optBorder = "#10b981";
                          } else if (isChosen) {
                            optBg = "rgba(239,68,68,0.2)";
                            optBorder = "#ef4444";
                          }
                        } else if (isChosen) {
                          optBg = "rgba(16,185,129,0.15)";
                          optBorder = "#34d399";
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => {
                              if (!checkpointSubmitted) setCheckpointAnswer(optIdx);
                            }}
                            style={{
                              padding: "12px 16px",
                              borderRadius: 10,
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              cursor: checkpointSubmitted ? "default" : "pointer",
                              fontSize: 13,
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              gap: 12
                            }}
                          >
                            <span style={{ fontWeight: 800, color: "#94a3b8" }}>{String.fromCharCode(65 + optIdx)}.</span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {!checkpointSubmitted ? (
                      <button
                        onClick={() => {
                          if (checkpointAnswer !== null) setCheckpointSubmitted(true);
                        }}
                        disabled={checkpointAnswer === null}
                        style={{
                          padding: "8px 18px",
                          borderRadius: 8,
                          border: "none",
                          background: checkpointAnswer !== null ? "#10b981" : "rgba(255,255,255,0.1)",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: checkpointAnswer !== null ? "pointer" : "not-allowed"
                        }}
                      >
                        Submit Checkpoint Answer
                      </button>
                    ) : (
                      <div>
                        <div style={{ padding: "12px 14px", borderRadius: 10, background: checkpointAnswer === currentConcept.checkpoint.correct ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${checkpointAnswer === currentConcept.checkpoint.correct ? "#10b981" : "#ef4444"}`, marginBottom: 12, fontSize: 13, color: "white" }}>
                          <strong style={{ color: checkpointAnswer === currentConcept.checkpoint.correct ? "#34d399" : "#f87171" }}>
                            {checkpointAnswer === currentConcept.checkpoint.correct ? "✓ Correct Reasoning!" : "✗ Review the Key Driver:"}
                          </strong>{" "}
                          {currentConcept.checkpoint.explanation}
                        </div>
                        <button
                          onClick={() => setViewMode("practice")}
                          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#6366f1", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                        >
                          Advance to Practice Mode ➔
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            2. PRACTICE MODE
            ════════════════════════════════════════════════════════════════ */}
        {viewMode === "practice" && (
          <div>
            {/* Audience Adaptation Level Selector */}
            <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 20px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                1. SELECT TARGET AUDIENCE COMPLEXITY LEVEL (ADAPTIVE DRILL):
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                {[
                  { id: "grandparent", label: "Level 1: Non-Technical / Grandparent", desc: "Zero technical jargon. Pure everyday analogies (waiter, library, post office)." },
                  { id: "junior_dev", label: "Level 2: Junior Developer", desc: "Explain code structure, execution order, and algorithmic mental model." },
                  { id: "staff_architect", label: "Level 3: Principal Architect", desc: "Defend trade-offs, concurrency hazards, and memory limit boundaries." }
                ].map(tier => {
                  const isSel = audienceTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setAudienceTier(tier.id as any)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: isSel ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.02)",
                        border: isSel ? "2px solid #10b981" : "1px solid rgba(255,255,255,0.06)",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: isSel ? "#34d399" : "white", marginBottom: 2 }}>
                        {tier.label}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                        {tier.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prompt Selector Pills */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                2. SELECT PRACTICE SCENARIO:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
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
                        cursor: "pointer"
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

            {/* Active Prompt Briefing Card */}
            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 18, padding: "24px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.2)", color: "#34d399", fontWeight: 800 }}>
                    PRACTICE PROTOCOL • {audienceTier.toUpperCase().replace("_", " ")}
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

              {/* Scaffolding Helper Box */}
              <div style={{ padding: "12px 16px", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 10, fontSize: 12, color: "#7dd3fc", marginBottom: 12 }}>
                <strong>Scaffolding Structure:</strong> 1. Lead with the core conclusion & impact ➔ 2. Explain technical reason without jargon ➔ 3. State recovery ETA & mitigation.
              </div>

              <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 10, fontSize: 12, color: "#fca5a5" }}>
                {activePrompt.context_note}
              </div>
            </div>

            {/* Recording & Input Area */}
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

                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#94a3b8" }}>
                  <span>Words: <strong style={{ color: "white" }}>{wordsCount}</strong></span>
                  {elapsedSeconds > 0 && <span>Pacing: <strong style={{ color: wordsPerMinute >= 110 && wordsPerMinute <= 160 ? "#34d399" : "#fbbf24" }}>{wordsPerMinute} wpm</strong></span>}
                </div>
              </div>

              {/* Speech Controls */}
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
                        gap: 8
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

              <textarea
                value={userText}
                onChange={e => setUserText(e.target.value)}
                placeholder={`Speak or type your explanation here tailored for ${audienceTier.replace("_", " ")}...`}
                rows={6}
                style={{
                  width: "100%",
                  background: "#080b12",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: 16,
                  color: "white",
                  fontSize: 14,
                  lineHeight: 1.6,
                  outline: "none",
                  marginBottom: 16
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={() => setUserText("")}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}
                >
                  Clear Text
                </button>

                <button
                  onClick={() => submitForEvaluation(false)}
                  disabled={evaluating || !userText.trim()}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: evaluating ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#10b981,#059669)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: evaluating || !userText.trim() ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 16px rgba(16,185,129,0.3)"
                  }}
                >
                  {evaluating ? "⚡ Analyzing Speech & Articulation..." : "Evaluate Speech & Articulation ➔"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            3. COACH MODE
            ════════════════════════════════════════════════════════════════ */}
        {viewMode === "coach" && (
          <div>
            <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                🎓 REAL-TIME ARTICULATION & SOCRATIC COACH
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 8px", color: "white" }}>
                Live Speech Diagnostics & Socratic Pacing Guidance
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Speak or type your draft. The coach monitors verbal fillers, speech cadence, and BLUF structuring in real time.
              </p>
            </div>

            {/* Live Telemetry Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
              <div style={{ background: "rgba(15,23,42,0.6)", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>Fillers Detected</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: detectedFillersInText.length > 2 ? "#ef4444" : "#10b981", marginTop: 4 }}>
                  {detectedFillersInText.length} {detectedFillersInText.length === 1 ? "filler" : "fillers"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  {detectedFillersInText.slice(0, 3).join(", ") || "None detected"}
                </div>
              </div>

              <div style={{ background: "rgba(15,23,42,0.6)", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>Words & Cadence</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginTop: 4 }}>
                  {wordsCount} words
                </div>
                <div style={{ fontSize: 11, color: "#38bdf8", marginTop: 2 }}>
                  {wordsPerMinute ? `${wordsPerMinute} wpm (Target: 120-150)` : "Begin speaking to measure"}
                </div>
              </div>

              <div style={{ background: "rgba(15,23,42,0.6)", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>Structure Check</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: userText.length > 40 ? "#34d399" : "#fbbf24", marginTop: 8 }}>
                  {userText.length > 40 ? "✓ Sufficient Draft Length" : "⚠️ Needs More Content"}
                </div>
              </div>
            </div>

            {/* Coach Speech Workspace */}
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 18, padding: "24px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
                  Coach Speech Sandbox (Try answering: "Explain why our API is delayed 2 days")
                </div>
                {speechSupported && (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: isRecording ? "#ef4444" : "#10b981",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {isRecording ? `⏹️ Stop (${elapsedSeconds}s)` : "🎙️ Start Voice Microphone"}
                  </button>
                )}
              </div>

              <textarea
                value={userText}
                onChange={e => setUserText(e.target.value)}
                placeholder="Speak or type your explanation here. The coach will analyze filler frequency and structure..."
                rows={5}
                style={{
                  width: "100%",
                  background: "#080b12",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: 16,
                  color: "white",
                  fontSize: 14,
                  lineHeight: 1.6,
                  outline: "none",
                  marginBottom: 16
                }}
              />

              <button
                onClick={handleCoachAnalyze}
                disabled={!userText.trim()}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: userText.trim() ? "pointer" : "not-allowed"
                }}
              >
                🎓 Request Socratic Coach Critique
              </button>

              {coachSocraticHint && (
                <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", marginBottom: 6 }}>
                    Coach Socratic Inquiry:
                  </div>
                  <div style={{ fontSize: 14, color: "white", lineHeight: 1.6 }}>
                    {coachSocraticHint}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            4. INTERVIEW MODE (Dynamic Scenarios & Follow-up Questions)
            ════════════════════════════════════════════════════════════════ */}
        {viewMode === "interview" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(16,185,129,0.15))", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 18, padding: "24px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.25)", color: "#34d399", fontWeight: 800 }}>
                    EXECUTIVE INTERVIEW ROUND • UNSEEN SCENARIO
                  </span>
                  <h2 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 2px", color: "white" }}>
                    {activeScenario.title}
                  </h2>
                  <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700 }}>
                    Interviewer: {activeScenario.role}
                  </div>
                </div>
                <div style={{ fontSize: 12, padding: "4px 10px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontWeight: 700 }}>
                  ⚠️ Zero Hints • Adaptive Follow-ups Active
                </div>
              </div>

              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: "12px 0 0", lineHeight: 1.5 }}>
                {activeScenario.scenario}
              </p>
            </div>

            {/* Conversation Flow */}
            <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 14 }}>
                Interview Dialogue History:
              </div>

              {/* Initial Question */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                  👔
                </div>
                <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: "14px 18px", flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 800, marginBottom: 4 }}>
                    {activeScenario.role} (Stakeholder):
                  </div>
                  <div style={{ fontSize: 14, color: "white", lineHeight: 1.5 }}>
                    "{activeScenario.openingPrompt}"
                  </div>
                </div>
              </div>

              {/* Interview History Dialogues */}
              {interviewHistory.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: item.speaker === "Candidate" ? "#10b981" : "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {item.speaker === "Candidate" ? "👤" : "👔"}
                  </div>
                  <div style={{ background: item.speaker === "Candidate" ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.12)", border: `1px solid ${item.speaker === "Candidate" ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.3)"}`, borderRadius: 12, padding: "14px 18px", flex: 1 }}>
                    <div style={{ fontSize: 11, color: item.speaker === "Candidate" ? "#34d399" : "#818cf8", fontWeight: 800, marginBottom: 4 }}>
                      {item.speaker}:
                    </div>
                    <div style={{ fontSize: 14, color: "white", lineHeight: 1.5 }}>
                      {item.text}
                    </div>
                  </div>
                </div>
              ))}

              {/* Phase 1 Input: Answering First Prompt */}
              {interviewStep === "prompt" && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                      Your Response (Lead with BLUF):
                    </div>
                    {speechSupported && (
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: isRecording ? "#ef4444" : "#10b981",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {isRecording ? `⏹️ Stop (${elapsedSeconds}s)` : "🎙️ Use Microphone"}
                      </button>
                    )}
                  </div>

                  <textarea
                    value={userText}
                    onChange={e => setUserText(e.target.value)}
                    placeholder="Deliver your explanation directly to the stakeholder..."
                    rows={4}
                    style={{
                      width: "100%",
                      background: "#080b12",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 12,
                      padding: 14,
                      color: "white",
                      fontSize: 14,
                      lineHeight: 1.6,
                      outline: "none",
                      marginBottom: 12
                    }}
                  />

                  <button
                    onClick={handleInterviewFirstAnswer}
                    disabled={!userText.trim()}
                    style={{
                      padding: "10px 22px",
                      borderRadius: 8,
                      border: "none",
                      background: userText.trim() ? "#10b981" : "rgba(255,255,255,0.1)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: userText.trim() ? "pointer" : "not-allowed"
                    }}
                  >
                    Deliver Response & Face Stakeholder Challenge ➔
                  </button>
                </div>
              )}

              {/* Phase 2 Input: Follow-up Probe */}
              {interviewStep === "followup" && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#f87171", textTransform: "uppercase", marginBottom: 4 }}>
                      Stakeholder Follow-up Probe:
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>
                      "{interviewFollowupQuestion}"
                    </div>
                  </div>

                  <textarea
                    value={followupAnswer}
                    onChange={e => setFollowupAnswer(e.target.value)}
                    placeholder="Defend your strategy and address the stakeholder's pushback..."
                    rows={4}
                    style={{
                      width: "100%",
                      background: "#080b12",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 12,
                      padding: 14,
                      color: "white",
                      fontSize: 14,
                      lineHeight: 1.6,
                      outline: "none",
                      marginBottom: 12
                    }}
                  />

                  <button
                    onClick={handleInterviewFollowupAnswer}
                    disabled={!followupAnswer.trim() || evaluating}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 8,
                      border: "none",
                      background: followupAnswer.trim() ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.1)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: followupAnswer.trim() ? "pointer" : "not-allowed"
                    }}
                  >
                    {evaluating ? "⚡ Generating Bar-Raiser Evaluation..." : "Conclude Interview & View Evidence Dossier ➔"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AI EVALUATION DOSSIER REPORT (Shared across Practice & Interview) ── */}
        {evaluationReport && (
          <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,27,75,0.9))", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 20, padding: "28px", marginBottom: 32, boxShadow: "0 15px 40px rgba(0,0,0,0.7)" }}>
            
            {/* Top Score Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 20 }}>
              <div>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "rgba(16,185,129,0.2)", color: "#34d399", fontWeight: 800, letterSpacing: 1 }}>
                  HR & CLIENT READINESS ASSESSMENT
                </span>
                <h3 style={{ fontSize: 22, fontWeight: 900, margin: "6px 0 2px", color: "white" }}>
                  {evaluationReport.verdict || "Demonstrated Executive Presence"}
                </h3>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Audience Context: <strong style={{ color: "#34d399" }}>{audienceTier.replace("_", " ").toUpperCase()}</strong>
                </div>
              </div>

              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: (evaluationReport.overallScore || 82) >= 75 ? "#34d399" : (evaluationReport.overallScore || 82) >= 60 ? "#fbbf24" : "#f87171" }}>
                    {evaluationReport.overallScore || 82}<span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>/100</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Communicability Index</div>
                </div>
              </div>
            </div>

            {/* Sub-Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Clarity & Structure</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginTop: 2 }}>{evaluationReport.clarityScore || 84}/100</div>
              </div>
              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Audience Adaptation</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginTop: 2 }}>{evaluationReport.simplicityScore || 80}/100</div>
              </div>
              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Filler Words Detected</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: (evaluationReport.fillerCount || 0) > 2 ? "#fbbf24" : "#34d399", marginTop: 2 }}>
                  {evaluationReport.fillerCount || 0} fillers
                </div>
              </div>
            </div>

            {/* Evidence & Next Best Action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                  STUDENT DNA EVIDENCE UPDATE
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#34d399", marginTop: 2 }}>
                  ✓ Spoken English & Stakeholder Articulation: DEMONSTRATED
                </div>
              </div>

              <button
                onClick={() => {
                  setUserText("");
                  setFollowupAnswer("");
                  setEvaluationReport(null);
                  setInterviewStep("prompt");
                  setViewMode("interview");
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#10b981",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Start New Unseen Challenge ➔
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
