"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AptitudeQuestion } from "@/lib/skill-hub-store";

export default function AptitudeSimulatorPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // Unified 4-Mode Selector
  const [mode, setMode] = useState<"learn" | "practice" | "coach" | "timed_exam">("practice");
  const [currentIdx, setCurrentIdx] = useState(0);

  // Status map: "answered" | "marked_review" | "visited" | "unvisited"
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});
  const [revealedExplanations, setRevealedExplanations] = useState<Record<string, boolean>>({});

  // Timed exam state
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  // Learn Mode state
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);
  const [checkpointAnswer, setCheckpointAnswer] = useState<number | null>(null);
  const [checkpointSubmitted, setCheckpointSubmitted] = useState(false);

  // Coach Mode state
  const [coachSocraticHint, setCoachSocraticHint] = useState<string | null>(null);

  // High-Frequency Quantitative Lessons for Learn Mode
  const learnTopics = [
    {
      id: "percentages_discounts",
      title: "1. Percentages & Successive Discounts",
      subtitle: "Fractional Multipliers & Eliminating Raw Long Division",
      formula: "Net Discount = a + b - (a × b) / 100",
      shortcut: "Convert percentages to fractions: 16.66% = 1/6, 14.28% = 1/7, 12.5% = 1/8. A 20% discount means multiplying by 4/5.",
      summary: "Mass recruiters (TCS, Infosys) rely heavily on multi-stage price changes. Avoid converting back to decimals. Use successive multiplicative factors.",
      checkpoint: {
        question: "A laptop marked at $1,000 undergoes successive discounts of 20% and 10%. What is the final selling price?",
        options: ["$700", "$720", "$750", "$680"],
        correct: 1,
        explanation: "Net discount = 20 + 10 - (20×10)/100 = 28%. Final price = 100% - 28% = 72% of $1,000 = $720. (Alternatively: 1000 × 0.8 × 0.9 = $720)."
      }
    },
    {
      id: "time_work",
      title: "2. Time & Work: LCM & Efficiency Units",
      subtitle: "Never Use 1/A + 1/B Fractions",
      formula: "Total Work Units = LCM(A's days, B's days). Daily Rate = Work / Days.",
      shortcut: "If A finishes in 12 days and B in 15 days, let Total Work = LCM(12, 15) = 60 units. A does 5 units/day, B does 4 units/day. Together = 9 units/day. Time = 60/9 = 6.67 days.",
      summary: "Converting to common unit production rates turns messy fraction arithmetic into rapid integer addition.",
      checkpoint: {
        question: "Pipe A fills a tank in 10 hours, Pipe B fills it in 15 hours, and Pipe C empties it in 30 hours. How long to fill with all open?",
        options: ["5 hours", "6 hours", "7.5 hours", "8 hours"],
        correct: 2,
        explanation: "Total capacity = LCM(10, 15, 30) = 30 units. Rate A = +3 units/hr, B = +2 units/hr, C = -1 unit/hr. Net Rate = 3 + 2 - 1 = 4 units/hr. 30 / 4 = 7.5 hours."
      }
    },
    {
      id: "slot_permutations",
      title: "3. Combinatorics: The Slot Method",
      subtitle: "Handling Conditions & Avoiding Double Counting",
      formula: "Constrained Arrangements = (Constraint Unit)! × (Remaining Slots)!",
      shortcut: "Always bundle items that 'must sit together' into a single macro-item. Place restricted elements in slots first before calculating free positions.",
      summary: "TCS and Cognizant frequently test arrangement of letters where vowels must be adjacent or numbers cannot repeat.",
      checkpoint: {
        question: "In how many ways can letters of the word 'LEADER' be arranged such that vowels are always together?",
        options: ["72", "120", "144", "240"],
        correct: 0,
        explanation: "In 'LEADER': Vowels are E, A, E (3 vowels). Consonants are L, D, R (3 consonants). Treat (E, A, E) as 1 unit. Total units = 3 + 1 = 4. Arrangements of units = 4! = 24. Internal arrangements of vowels = 3! / 2! (since E repeats twice) = 3. Total ways = 24 × 3 = 72."
      }
    },
    {
      id: "syllogisms",
      title: "4. Syllogisms & Venn Invariants",
      subtitle: "Definite Conclusions vs Possibility Traps",
      formula: "Some A are B != All A are B. Look for the minimal overlapping Venn model.",
      shortcut: "If a single valid counter-Venn diagram violates the conclusion, the conclusion DOES NOT follow logically. Complementary pair: 'Some A are B' + 'No A are B' forms an 'Either I or II' condition.",
      summary: "Logical reasoning gates test whether you accept unstated assumptions. Always test the extreme boundary case.",
      checkpoint: {
        question: "Statements: All cars are vehicles. No vehicles are airplanes. Conclusion I: No cars are airplanes. Conclusion II: Some airplanes are vehicles.",
        options: ["Only I follows", "Only II follows", "Both follow", "Neither follows"],
        correct: 0,
        explanation: "Since all cars are inside vehicles, and vehicles has zero overlap with airplanes, cars can have zero overlap with airplanes. Conclusion I definitely follows. Conclusion II directly contradicts Statement 2."
      }
    }
  ];

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    loadQuestions(selectedCompany, activeCategory);
  }, [selectedCompany, activeCategory]);

  // Mark first question as visited
  useEffect(() => {
    if (questions[currentIdx]) {
      setVisitedQuestions(prev => ({ ...prev, [questions[currentIdx].id]: true }));
    }
  }, [currentIdx, questions]);

  useEffect(() => {
    let timer: any = null;
    if (examStarted && !examSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, examSubmitted, timeLeft]);

  const loadQuestions = async (company: string, category: string) => {
    setLoading(true);
    try {
      let url = `/api/skills/aptitude?company=${encodeURIComponent(company)}&candidateId=${encodeURIComponent(candidateId || "student-demo")}`;
      if (category && category !== "all") {
        url += `&category=${encodeURIComponent(category)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIdx(0);
      } else {
        const fallbackRes = await fetch(`/api/skills/aptitude?company=${encodeURIComponent(company)}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.questions && fallbackData.questions.length > 0) {
          setQuestions(fallbackData.questions);
          setCurrentIdx(0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (examSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
    if (mode === "practice" || mode === "coach") {
      setRevealedExplanations(prev => ({ ...prev, [qId]: true }));
    }
  };

  const toggleMarkReview = (qId: string) => {
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const clearCurrentResponse = (qId: string) => {
    setUserAnswers(prev => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleGenerateFreshQuestions = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/skills/aptitude/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyTag: selectedCompany === "all" ? "TCS NQT" : selectedCompany,
          category: activeCategory === "all" ? "quantitative" : activeCategory,
          count: 5
        })
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(prev => [...data.questions, ...prev]);
        setCurrentIdx(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const submitExam = async () => {
    setExamSubmitted(true);
    try {
      const res = await fetch("/api/skills/aptitude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          answers: userAnswers,
          companyTag: selectedCompany === "all" ? "TCS NQT" : selectedCompany,
          timeSpentSeconds: 900 - timeLeft,
          questionIds: questions.map(q => q.id),
          questionKey: Object.fromEntries(
            questions.map(q => [q.id, { correctIndex: q.correct_option_index, correctText: q.options[q.correct_option_index], options: q.options }])
          )
        })
      });
      const data = await res.json();
      if (data.result) {
        setExamResult(data.result);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentQ = questions[currentIdx];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  // Status helpers for TCS iON Question Palette
  const getQuestionStatus = (qId: string) => {
    const hasAnswer = userAnswers[qId] !== undefined;
    const isMarked = markedForReview[qId];
    const isVisited = visitedQuestions[qId];

    if (hasAnswer && isMarked) return "answered_marked";
    if (hasAnswer) return "answered";
    if (isMarked) return "marked";
    if (isVisited) return "not_answered";
    return "not_visited";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "#2E7D5B"; // Green
      case "marked":
        return "#B7791F"; // Amber/Warning
      case "answered_marked":
        return "#356AE6"; // Cobalt
      case "not_answered":
        return "#C24141"; // Red
      default:
        return "#667085"; // Secondary Grey
    }
  };

  const handleCoachInspect = () => {
    if (!currentQ) return;
    const topic = currentQ.topic.toLowerCase();
    if (topic.includes("percent") || topic.includes("profit") || topic.includes("discount")) {
      setCoachSocraticHint("Coach Warning: Check whether the question asks for the marked discount or the customer's final out-of-pocket payment. Avoid converting to decimals; multiply fractional ratios directly.");
    } else if (topic.includes("work") || topic.includes("pipe") || topic.includes("time")) {
      setCoachSocraticHint("Coach Hint: Instead of fractions (1/A + 1/B), find the LCM of given days to assign total integer work units. What is the daily unit burn rate?");
    } else if (topic.includes("arrange") || topic.includes("permutation") || topic.includes("probability")) {
      setCoachSocraticHint("Coach Alert: Are there identical repeated characters or items in the set? Remember to divide the total permutation by duplicate factorials (e.g. n! / r!).");
    } else {
      setCoachSocraticHint(`Coach Strategy: For ${currentQ.topic}, eliminate the extreme outliers first. Usually 2 options are mathematical distractors differing by a sign or off-by-one ratio.`);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "14px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Link href="/student/skills" style={{ color: "#667085", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "#E4E1DA" }}>/</span>
              <span style={{ color: "#356AE6", fontSize: 13, fontWeight: 700 }}>Domain 6: Aptitude &amp; Quantitative Reasoning</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "#162A43", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🧮</span>
              <span>Aptitude, Quantitative &amp; Logical Reasoning Engine</span>
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* UNIFIED 4-MODE SELECTOR */}
            <div style={{ display: "flex", background: "#F6F5F1", padding: 3, borderRadius: 7, border: "1px solid #E4E1DA" }}>
              <button
                onClick={() => { setMode("learn"); setExamStarted(false); }}
                style={{
                  padding: "5px 12px",
                  borderRadius: 5,
                  border: "none",
                  background: mode === "learn" ? "#356AE6" : "transparent",
                  color: mode === "learn" ? "#FFFFFF" : "#667085",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                💡 Learn
              </button>
              <button
                onClick={() => { setMode("practice"); setExamStarted(false); }}
                style={{
                  padding: "5px 12px",
                  borderRadius: 5,
                  border: "none",
                  background: mode === "practice" ? "#356AE6" : "transparent",
                  color: mode === "practice" ? "#FFFFFF" : "#667085",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🛠️ Practice
              </button>
              <button
                onClick={() => { setMode("coach"); setExamStarted(false); handleCoachInspect(); }}
                style={{
                  padding: "5px 12px",
                  borderRadius: 5,
                  border: "none",
                  background: mode === "coach" ? "#356AE6" : "transparent",
                  color: mode === "coach" ? "#FFFFFF" : "#667085",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🎓 Coach
              </button>
              <button
                onClick={() => { setMode("timed_exam"); setExamStarted(true); setExamSubmitted(false); }}
                style={{
                  padding: "5px 12px",
                  borderRadius: 5,
                  border: "none",
                  background: mode === "timed_exam" ? "#C24141" : "transparent",
                  color: mode === "timed_exam" ? "#FFFFFF" : "#667085",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ⏱️ Timed Assessment
              </button>
            </div>

            {mode === "timed_exam" && (
              <div style={{ padding: "6px 12px", borderRadius: 7, background: timeLeft < 120 ? "#FDF2F2" : "#FEF7ED", border: timeLeft < 120 ? "1px solid #F8C8C8" : "1px solid #F8D8A7", color: timeLeft < 120 ? "#C24141" : "#B7791F", fontSize: 13, fontWeight: 800 }}>
                ⏳ {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* ════════════════════════════════════════════════════════════════
            1. LEARN MODE
            ════════════════════════════════════════════════════════════════ */}
        {mode === "learn" && (
          <div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                ADAPTIVE QUANT TUTOR • SPEED CALCULATION SHORTCUTS
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px", color: "#162A43" }}>
                Mastering High-Frequency Aptitude Invariants
              </h2>
              <p style={{ fontSize: 13, color: "#667085", margin: 0, lineHeight: 1.5 }}>
                Replace slow manual school arithmetic with industrial mental math formulas required to clear mass screening cutoffs.
              </p>
            </div>

            {/* Topic Pills */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
              {learnTopics.map((t, idx) => {
                const isSel = idx === selectedTopicIdx;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTopicIdx(idx);
                      setCheckpointAnswer(null);
                      setCheckpointSubmitted(false);
                    }}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 8,
                      background: isSel ? "#EFF4FE" : "#FFFFFF",
                      border: isSel ? "1px solid #356AE6" : "1px solid #E4E1DA",
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? "#356AE6" : "#162A43", marginBottom: 4 }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#667085" }}>
                      {t.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Topic Breakdown */}
            {(() => {
              const activeTopic = learnTopics[selectedTopicIdx];
              return (
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, marginBottom: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", marginTop: 0, marginBottom: 8 }}>
                    {activeTopic.title}: {activeTopic.subtitle}
                  </h3>
                  <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, marginBottom: 16 }}>
                    {activeTopic.summary}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                    <div style={{ background: "#EFF4FE", borderRadius: 8, padding: "16px", border: "1px solid #D2E0FB" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                        Key Speed Formula
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                        {activeTopic.formula}
                      </div>
                    </div>

                    <div style={{ background: "#FEF7ED", borderRadius: 8, padding: "16px", border: "1px solid #F8D8A7" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", textTransform: "uppercase", marginBottom: 4 }}>
                        Mental Math Shortcut
                      </div>
                      <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.4 }}>
                        {activeTopic.shortcut}
                      </div>
                    </div>
                  </div>

                  {/* CHECKPOINT */}
                  <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                      ⚡ Concept Checkpoint
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43", marginBottom: 14 }}>
                      {activeTopic.checkpoint.question}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      {activeTopic.checkpoint.options.map((opt, optIdx) => {
                        const isChosen = checkpointAnswer === optIdx;
                        let optBg = "#FFFFFF";
                        let optBorder = "#E4E1DA";
                        let optColor = "#17191C";

                        if (checkpointSubmitted) {
                          if (optIdx === activeTopic.checkpoint.correct) {
                            optBg = "#EAF4EE";
                            optBorder = "#C8E4D3";
                            optColor = "#2E7D5B";
                          } else if (isChosen) {
                            optBg = "#FDF2F2";
                            optBorder = "#F8C8C8";
                            optColor = "#C24141";
                          }
                        } else if (isChosen) {
                          optBg = "#EFF4FE";
                          optBorder = "#356AE6";
                          optColor = "#356AE6";
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => {
                              if (!checkpointSubmitted) setCheckpointAnswer(optIdx);
                            }}
                            style={{
                              padding: "12px 16px",
                              borderRadius: 7,
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              cursor: checkpointSubmitted ? "default" : "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                              color: optColor,
                              display: "flex",
                              alignItems: "center",
                              gap: 10
                            }}
                          >
                            <span style={{ fontWeight: 800, color: "#667085" }}>{String.fromCharCode(65 + optIdx)}.</span>
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
                          borderRadius: 7,
                          border: "none",
                          background: checkpointAnswer !== null ? "#356AE6" : "#E4E1DA",
                          color: checkpointAnswer !== null ? "white" : "#98A2B3",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: checkpointAnswer !== null ? "pointer" : "not-allowed"
                        }}
                      >
                        Submit Checkpoint Answer
                      </button>
                    ) : (
                      <div>
                        <div style={{ padding: "12px 14px", borderRadius: 8, background: checkpointAnswer === activeTopic.checkpoint.correct ? "#EAF4EE" : "#FDF2F2", border: `1px solid ${checkpointAnswer === activeTopic.checkpoint.correct ? "#C8E4D3" : "#F8C8C8"}`, marginBottom: 12, fontSize: 13, color: "#17191C" }}>
                          <strong style={{ color: checkpointAnswer === activeTopic.checkpoint.correct ? "#2E7D5B" : "#C24141" }}>
                            {checkpointAnswer === activeTopic.checkpoint.correct ? "✓ Correct!" : "✗ Review:"}
                          </strong>{" "}
                          {activeTopic.checkpoint.explanation}
                        </div>
                        <button
                          onClick={() => setMode("practice")}
                          style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "#356AE6", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
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
            2. PRACTICE & 3. COACH & 4. TIMED EXAM WORKSPACE
            ════════════════════════════════════════════════════════════════ */}
        {mode !== "learn" && (
          <div>
            {/* ── SECTION NAVIGATION BAR ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18, borderBottom: "1px solid #E4E1DA", paddingBottom: 14 }}>
              {/* Company Filter Tabs */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", maxWidth: "100%" }}>
                {[
                  { id: "all", label: "All Papers (50+ Archive)" },
                  { id: "TCS NQT", label: "🔥 TCS NQT" },
                  { id: "Infosys", label: "🏛️ Infosys InfyTQ/SP" },
                  { id: "Wipro Elite", label: "⚡ Wipro Elite" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCompany(tab.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 7,
                      border: selectedCompany === tab.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                      background: selectedCompany === tab.id ? "#EFF4FE" : "#FFFFFF",
                      color: selectedCompany === tab.id ? "#356AE6" : "#667085",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Generator & Category Section Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={handleGenerateFreshQuestions}
                  disabled={generating || examSubmitted}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 7,
                    border: "1px solid #F8D8A7",
                    background: "#FEF7ED",
                    color: "#B7791F",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: generating ? "not-allowed" : "pointer"
                  }}
                >
                  {generating ? "⚡ Synthesizing..." : "⚡ Generate 5 More Fresh Questions"}
                </button>

                <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                  {[
                    { id: "all", label: "All Sections" },
                    { id: "quantitative", label: "Quant" },
                    { id: "logical_reasoning", label: "Reasoning" },
                    { id: "verbal_ability", label: "Verbal" },
                    { id: "programming_logic", label: "Logic" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      style={{
                        padding: "6px 11px",
                        borderRadius: 6,
                        border: activeCategory === cat.id ? "1px solid #2E7D5B" : "1px solid #E4E1DA",
                        background: activeCategory === cat.id ? "#EAF4EE" : "#FFFFFF",
                        color: activeCategory === cat.id ? "#2E7D5B" : "#667085",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Coach Mode Banner */}
            {mode === "coach" && (
              <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: "14px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#B7791F", textTransform: "uppercase" }}>
                    🎓 SOCRATIC APTITUDE COACH ACTIVE
                  </div>
                  <div style={{ fontSize: 13, color: "#162A43", marginTop: 2 }}>
                    {coachSocraticHint || "Review the active question. Avoid jumping into tedious long division."}
                  </div>
                </div>
                <button
                  onClick={handleCoachInspect}
                  style={{ padding: "6px 14px", borderRadius: 7, background: "#356AE6", color: "#FFFFFF", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  Analyze Question Trap
                </button>
              </div>
            )}

            {/* Exam Scorecard */}
            {examSubmitted && examResult && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "24px", marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 10, padding: "3px 9px", background: examResult.gateStatus === "passed" ? "#EAF4EE" : "#FDF2F2", border: examResult.gateStatus === "passed" ? "1px solid #C8E4D3" : "1px solid #F8C8C8", color: examResult.gateStatus === "passed" ? "#2E7D5B" : "#C24141", borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 }}>
                      OFFICIAL NQT GATE VERDICT
                    </span>
                    <h3 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 0", color: "#162A43" }}>
                      {examResult.gateVerdict}
                    </h3>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: examResult.percentage >= 65 ? "#2E7D5B" : "#C24141" }}>
                      {examResult.percentage}%
                    </div>
                    <div style={{ fontSize: 12, color: "#667085" }}>
                      {examResult.correctCount} / {examResult.totalQuestions} Correct (Mass Cutoff: {examResult.cutoffThreshold}%)
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, marginTop: 16, borderTop: "1px solid #E4E1DA", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                      STUDENT DNA EVIDENCE
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: examResult.percentage >= 65 ? "#2E7D5B" : "#B7791F", marginTop: 2 }}>
                      {examResult.percentage >= 65 ? "✓ Quantitative & Logical Speed: DEMONSTRATED" : "⚠️ Quantitative & Logical Speed: DEVELOPING"}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserAnswers({});
                      setMarkedForReview({});
                      setRevealedExplanations({});
                      setExamSubmitted(false);
                      setExamStarted(true);
                      setTimeLeft(900);
                      handleGenerateFreshQuestions();
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 7,
                      border: "none",
                      background: "#356AE6",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Retry Differently (Fresh Question Pool) ➔
                  </button>
                </div>
              </div>
            )}

            {/* TWO-COLUMN LAYOUT (QUESTION CANVAS + PALETTE) */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 20, alignItems: "flex-start" }}>
              
              {/* LEFT: QUESTION CANVAS */}
              {currentQ ? (
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  
                  {/* Question Metadata */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, padding: "3px 8px", background: "#EFF4FE", border: "1px solid #D2E0FB", color: "#356AE6", borderRadius: 4, fontWeight: 700 }}>
                        {currentQ.company_tag}
                      </span>
                      <span style={{ fontSize: 11, padding: "3px 8px", background: "#F6F5F1", border: "1px solid #E4E1DA", color: "#162A43", borderRadius: 4, fontWeight: 600 }}>
                        {currentQ.topic}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#667085" }}>
                      Source: {currentQ.source_citation}
                    </span>
                  </div>

                  {/* Question Header & Body */}
                  <div style={{ fontSize: 12, color: "#667085", fontWeight: 700, marginBottom: 8 }}>
                    QUESTION {currentIdx + 1} OF {questions.length}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.55, color: "#162A43", margin: "0 0 24px" }}>
                    {currentQ.question}
                  </h3>

                  {/* Options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = userAnswers[currentQ.id] === idx;
                      const isCorrect = idx === currentQ.correct_option_index;
                      const showFeedback = (mode === "practice" || mode === "coach") && revealedExplanations[currentQ.id];

                      let optionBg = "#FFFFFF";
                      let optionBorder = "1px solid #E4E1DA";
                      let optionColor = "#17191C";

                      if (showFeedback) {
                        if (isCorrect) {
                          optionBg = "#EAF4EE";
                          optionBorder = "1px solid #C8E4D3";
                          optionColor = "#2E7D5B";
                        } else if (isSelected && !isCorrect) {
                          optionBg = "#FDF2F2";
                          optionBorder = "1px solid #F8C8C8";
                          optionColor = "#C24141";
                        }
                      } else if (isSelected) {
                        optionBg = "#EFF4FE";
                        optionBorder = "1px solid #356AE6";
                        optionColor = "#356AE6";
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectOption(currentQ.id, idx)}
                          style={{
                            padding: "12px 16px",
                            borderRadius: 7,
                            background: optionBg,
                            border: optionBorder,
                            color: optionColor,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            fontSize: 13,
                            fontWeight: 600,
                            transition: "all 0.15s ease"
                          }}
                        >
                          <span style={{ width: 24, height: 24, borderRadius: "50%", background: isSelected ? "#356AE6" : "#F6F5F1", color: isSelected ? "#FFFFFF" : "#667085", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation in Practice or Coach Mode */}
                  {(mode === "practice" || mode === "coach") && revealedExplanations[currentQ.id] && (
                    <div style={{ padding: "16px 18px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, marginBottom: 20 }}>
                      <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 800, marginBottom: 4 }}>
                        💡 STEP-BY-STEP MATHEMATICAL SOLUTION
                      </div>
                      <div style={{ fontSize: 13, color: "#162A43", lineHeight: 1.5, marginBottom: 8 }}>
                        {currentQ.explanation}
                      </div>
                      {currentQ.shortcut_tip && (
                        <div style={{ fontSize: 12, color: "#B7791F", fontWeight: 700, background: "#FEF7ED", padding: "6px 10px", borderRadius: 6, border: "1px solid #F8D8A7" }}>
                          ⚡ Speed Shortcut: {currentQ.shortcut_tip}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderTop: "1px solid #E4E1DA", paddingTop: 16 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => toggleMarkReview(currentQ.id)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 7,
                          border: "1px solid #F8D8A7",
                          background: markedForReview[currentQ.id] ? "#FEF7ED" : "transparent",
                          color: "#B7791F",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {markedForReview[currentQ.id] ? "✓ Marked for Review" : "Mark for Review"}
                      </button>

                      <button
                        onClick={() => clearCurrentResponse(currentQ.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 7,
                          border: "1px solid #E4E1DA",
                          background: "transparent",
                          color: "#667085",
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                      >
                        Clear Response
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentIdx === 0}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 7,
                          border: "1px solid #E4E1DA",
                          background: "#F6F5F1",
                          color: currentIdx === 0 ? "#98A2B3" : "#162A43",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: currentIdx === 0 ? "not-allowed" : "pointer"
                        }}
                      >
                        ← Previous
                      </button>

                      {currentIdx < questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentIdx(prev => prev + 1)}
                          style={{
                            padding: "8px 18px",
                            borderRadius: 7,
                            border: "none",
                            background: "#356AE6",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Save & Next →
                        </button>
                      ) : (
                        <button
                          onClick={submitExam}
                          style={{
                            padding: "8px 18px",
                            borderRadius: 7,
                            border: "none",
                            background: "#2E7D5B",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Submit Assessment ➔
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ padding: "48px 24px", textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
                  {loading ? (
                    <div style={{ color: "#667085", fontSize: 14 }}>⚡ Loading question paper...</div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                      <h3 style={{ color: "#162A43", fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>No questions found in this specific sub-category</h3>
                      <p style={{ color: "#667085", fontSize: 12, margin: "0 0 16px" }}>Generate 5 fresh questions or switch to &quot;All Sections&quot; to practice immediately.</p>
                      <button
                        onClick={handleGenerateFreshQuestions}
                        style={{ padding: "8px 18px", borderRadius: 7, background: "#356AE6", color: "#FFFFFF", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}
                      >
                        ⚡ Generate 5 Fresh Questions
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* RIGHT: QUESTION PALETTE */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>QUESTION PALETTE</span>
                  <span style={{ fontSize: 11, color: "#667085" }}>{questions.length} Items</span>
                </div>

                {/* Legend */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16, fontSize: 11, color: "#667085" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2E7D5B" }} />
                    <span>Answered ({Object.keys(userAnswers).length})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#B7791F" }} />
                    <span>Review ({Object.values(markedForReview).filter(Boolean).length})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C24141" }} />
                    <span>Not Answered</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#667085" }} />
                    <span>Not Visited</span>
                  </div>
                </div>

                {/* Grid of Numbered Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, maxHeight: 340, overflowY: "auto", paddingRight: 2 }}>
                  {questions.map((q, idx) => {
                    const status = getQuestionStatus(q.id);
                    const color = getStatusColor(status);
                    const isCurrent = idx === currentIdx;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        style={{
                          height: 36,
                          borderRadius: 6,
                          border: isCurrent ? "2px solid #356AE6" : `1px solid ${color}40`,
                          background: isCurrent ? "#EFF4FE" : `${color}15`,
                          color: isCurrent ? "#356AE6" : color,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.1s ease"
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Submit CTA */}
                <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 16, marginTop: 16 }}>
                  <button
                    onClick={submitExam}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 7,
                      border: "none",
                      background: "#2E7D5B",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Submit Assessment ➔
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
