"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SolutionBreakdown {
  optimal_approach: string;
  complexity: string;
  common_pitfalls: string;
  sample_answer: string;
}

interface Question {
  id: string;
  company_or_event: string;
  role?: string;
  question_text: string;
  question_type: string;
  difficulty?: string;
  frequency?: string;
  tags?: string[];
  upvotes: number;
  upvoted_by: string[];
  created_at: string;
  solution_breakdown?: SolutionBreakdown;
}

const TOP_COMPANIES = [
  "All",
  "Google",
  "Amazon",
  "Meta",
  "Microsoft",
  "Apple",
  "Netflix",
  "Uber",
  "Nvidia",
  "Goldman Sachs",
  "Razorpay",
  "Flipkart",
  "Atlassian",
  "Smart India Hackathon"
];

export default function StudentCommunityPage() {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  // 50-Year FAANG Recruiter Consultation State
  const [consultingQuestion, setConsultingQuestion] = useState<Question | null>(null);
  const [consultationText, setConsultationText] = useState("");
  const [consultingLoading, setConsultingLoading] = useState(false);
  const [consultationResult, setConsultationResult] = useState<any>(null);

  // AI Generator Modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiCompany, setAiCompany] = useState("Nvidia");
  const [aiRole, setAiRole] = useState("Software Development Engineer (SDE-1)");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Contribute Question state
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState("technical");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(stored);
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community/questions");
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    // Optimistic UI update
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          const hasUpvoted = q.upvoted_by?.includes(candidateId);
          const nextUpvotes = hasUpvoted ? Math.max(0, q.upvotes - 1) : q.upvotes + 1;
          const nextUpvotedBy = hasUpvoted
            ? q.upvoted_by.filter(id => id !== candidateId)
            : [...(q.upvoted_by || []), candidateId];
          return { ...q, upvotes: nextUpvotes, upvoted_by: nextUpvotedBy };
        }
        return q;
      })
    );

    try {
      await fetch("/api/community/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          student_id: candidateId
        })
      });
    } catch (err) {
      console.error("Upvote error:", err);
    }
  };

  const toggleSolution = (id: string) => {
    setExpandedSolutions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickAiGenerate = async (targetCompany?: string) => {
    const comp = targetCompany || (companyFilter === "All" ? "Google" : companyFilter);
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_ai_questions",
          company: comp,
          role: "Software Development Engineer (SDE-1 / L4)",
          count: 3
        })
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(prev => [...data.questions, ...prev]);
        setCompanyFilter(comp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleOpenConsultation = async (q: Question) => {
    setConsultingQuestion(q);
    setConsultationText("");
    setConsultationResult(null);
    setConsultingLoading(true);

    // Fetch initial bar raiser rubric and breakdown automatically
    try {
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "faang_recruiter_consult",
          question_text: q.question_text,
          company: q.company_or_event,
          role: q.role || "Software Engineer",
          candidate_response: ""
        })
      });
      const data = await res.json();
      if (data.consultation) {
        setConsultationResult(data.consultation);
      }
    } catch (err) {
      console.error("Recruiter consult error:", err);
    } finally {
      setConsultingLoading(false);
    }
  };

  const handleSubmitCandidateCritique = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultingQuestion || !consultationText.trim()) return;

    setConsultingLoading(true);
    try {
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "faang_recruiter_consult",
          question_text: consultingQuestion.question_text,
          company: consultingQuestion.company_or_event,
          role: consultingQuestion.role || "Software Engineer",
          candidate_response: consultationText.trim()
        })
      });
      const data = await res.json();
      if (data.consultation) {
        setConsultationResult(data.consultation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConsultingLoading(false);
    }
  };

  const handleGenerateAiQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCompany.trim()) return;

    setGeneratingAi(true);
    try {
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_ai_questions",
          company: aiCompany,
          role: aiRole,
          count: 3
        })
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(prev => [...data.questions, ...prev]);
        setCompanyFilter(aiCompany);
        setShowAiModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_or_event: newCompany,
          role: newRole || "Engineering Candidate",
          question_text: newText,
          question_type: newType,
          student_id: candidateId
        })
      });

      if (res.ok) {
        setShowModal(false);
        setNewCompany("");
        setNewRole("");
        setNewText("");
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (companyFilter !== "All") {
      const matchComp = q.company_or_event.toLowerCase().includes(companyFilter.toLowerCase());
      if (!matchComp) return false;
    }
    if (typeFilter !== "all" && q.question_type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const inText = q.question_text.toLowerCase().includes(s);
      const inComp = q.company_or_event.toLowerCase().includes(s);
      const inRole = q.role?.toLowerCase().includes(s);
      const inTags = (q.tags || []).some(t => t.toLowerCase().includes(s));
      if (!inText && !inComp && !inRole && !inTags) return false;
    }
    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05060e",
        color: "#f3f4f6",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
        overflowX: "hidden"
      }}
    >
      {/* AMBIENT BACKGROUND GLOWS */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          position: "fixed",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 380,
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,158,11,0.18) 0%, rgba(239,68,68,0.08) 50%, transparent 80%)",
          pointerEvents: "none"
        }}
      />

      {/* NAVBAR */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(5,6,15,0.85)",
          backdropFilter: "blur(20px)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/student" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
            ← Back to Dashboard
          </Link>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
          <div>
            <div style={{ fontSize: 14, color: "#fbbf24", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
              <span>💡</span>
              <span>FAANG & HACKATHON QUESTION BANK</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              Verified Questions with Complete Solution Breakdowns & Pitfalls
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* AI Generator Button */}
          <button
            onClick={() => setShowAiModal(true)}
            style={{
              padding: "7px 14px",
              background: "linear-gradient(135deg,#6366f1,#a855f7)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 0 15px rgba(99,102,241,0.3)"
            }}
          >
            <span>✨ AI Question Generator</span>
          </button>

          {/* User Contribute Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "7px 14px",
              background: "linear-gradient(135deg,#f59e0b,#ef4444)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            + Contribute Question
          </button>
        </div>
      </nav>

      {/* CONTAINER */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1240, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        
        {/* HERO HEADER */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 14px",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 999,
              marginBottom: 14
            }}
          >
            <span style={{ fontSize: 11, letterSpacing: 2, color: "#fde68a", fontWeight: 800 }}>
              AUTHENTIC FAANG & TIER-1 REPOSITORY
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: 900, margin: "0 0 0.75rem", color: "white", letterSpacing: -1 }}>
            Master Every Question Recruiters Ask
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", maxWidth: 680, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            Real technical coding, system design, and hackathon defense questions asked at Google, Amazon, Flipkart, and SIH — accompanied by step-by-step optimal approaches and candidate pitfall warnings.
          </p>

          {/* Search bar */}
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <input
              type="text"
              placeholder="Search by topic, algorithm, or company (e.g. 'Idempotency', 'Trie', 'Redis', 'Uber')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.85rem 1.25rem",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
                color: "white",
                fontSize: 13,
                outline: "none",
                backdropFilter: "blur(12px)"
              }}
            />
          </div>
        </div>

        {/* COMPANY FILTER PILLS */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 800, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
            Filter by Company / Challenge:
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TOP_COMPANIES.map((c) => {
              const active = companyFilter.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => setCompanyFilter(c)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 10,
                    border: active ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.08)",
                    background: active ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.02)",
                    color: active ? "#fbbf24" : "rgba(255,255,255,0.7)",
                    fontSize: 12,
                    fontWeight: active ? 800 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Quick AI Question Generator Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "8px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              <span>⚡ Need more fresh questions?</span>
              <span style={{ color: "#a5b4fc" }}>Targeting <strong>{companyFilter === "All" ? "Top FAANG" : companyFilter}</strong>?</span>
            </div>

            <button
              onClick={() => handleQuickAiGenerate()}
              disabled={generatingAi}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid rgba(99,102,241,0.5)",
                background: "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(168,85,247,0.3) 100%)",
                color: "white",
                fontSize: 11,
                fontWeight: 800,
                cursor: generatingAi ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>{generatingAi ? "⏳ Synthesizing Fresh 2026 Questions..." : `🔄 Auto-Discover 3 Live Questions for ${companyFilter === "All" ? "Top FAANG" : companyFilter}`}</span>
            </button>
          </div>
        </div>

        {/* CATEGORY TABS & TOTAL COUNT */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", padding: 3, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { key: "all", label: "All Questions" },
              { key: "technical", label: "Technical & DSA" },
              { key: "system-design", label: "System Design" },
              { key: "hackathon-pitch", label: "Hackathon Defense" },
              { key: "behavioral", label: "Behavioral & Culture" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: typeFilter === tab.key ? "rgba(245,158,11,0.3)" : "transparent",
                  color: typeFilter === tab.key ? "#fde68a" : "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
            Showing {filteredQuestions.length} Questions
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div style={{ textAlign: "center", padding: "5rem 2rem", color: "rgba(255,255,255,0.4)" }}>
            <div style={{ fontSize: 32, marginBottom: 8, animation: "bounce 1s infinite" }}>⚡</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>Loading Question Repository...</div>
          </div>
        )}

        {/* QUESTIONS LIST */}
        {!loading && filteredQuestions.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>No questions match this filter.</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              Click <strong>"✨ AI Question Generator"</strong> above to generate authentic questions for this company!
            </div>
          </div>
        )}

        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredQuestions.map((q) => {
              const hasUpvoted = q.upvoted_by?.includes(candidateId);
              const isExpanded = !!expandedSolutions[q.id];
              const sol = q.solution_breakdown;

              return (
                <div
                  key={q.id}
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(245,158,11,0.02) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    backdropFilter: "blur(16px)",
                    transition: "all 0.2s"
                  }}
                >
                  {/* Top Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    {/* Upvote Button */}
                    <button
                      onClick={() => handleUpvote(q.id)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 48,
                        padding: "8px 0",
                        background: hasUpvoted ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.04)",
                        border: hasUpvoted ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        cursor: "pointer",
                        color: hasUpvoted ? "#fbbf24" : "rgba(255,255,255,0.7)",
                        flexShrink: 0
                      }}
                    >
                      <span style={{ fontSize: 13 }}>▲</span>
                      <span style={{ fontSize: 12, fontWeight: 900, marginTop: 2 }}>{q.upvotes}</span>
                    </button>

                    {/* Question Meta & Title */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        {/* Company Badge */}
                        <span
                          style={{
                            fontSize: 11,
                            padding: "3px 10px",
                            background: "rgba(245,158,11,0.18)",
                            color: "#fbbf24",
                            borderRadius: 6,
                            fontWeight: 800
                          }}
                        >
                          🏢 {q.company_or_event}
                        </span>

                        {q.role && (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                            • {q.role}
                          </span>
                        )}

                        {q.difficulty && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              background:
                                q.difficulty === "Elite"
                                  ? "rgba(239,68,68,0.2)"
                                  : q.difficulty === "Hard"
                                  ? "rgba(245,158,11,0.2)"
                                  : "rgba(16,185,129,0.2)",
                              color:
                                q.difficulty === "Elite"
                                  ? "#fca5a5"
                                  : q.difficulty === "Hard"
                                  ? "#fde68a"
                                  : "#6ee7b7",
                              borderRadius: 4,
                              fontWeight: 800
                            }}
                          >
                            {q.difficulty}
                          </span>
                        )}

                        {q.frequency && (
                          <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>
                            ✓ {q.frequency}
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: 10,
                            textTransform: "uppercase",
                            padding: "2px 8px",
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 6,
                            color: "rgba(255,255,255,0.5)",
                            marginLeft: "auto",
                            fontWeight: 700
                          }}
                        >
                          {q.question_type}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.45, margin: "0 0 10px" }}>
                        {q.question_text}
                      </h3>

                      {/* Tech Tags */}
                      {q.tags && q.tags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          {q.tags.map((t, i) => (
                            <span key={i} style={{ fontSize: 10, padding: "2px 7px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#94a3b8" }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Bar: Reveal Solution, Recruiter Consult & Practice Interview */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <button
                          onClick={() => toggleSolution(q.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: isExpanded ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.12)",
                            background: isExpanded ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.04)",
                            color: isExpanded ? "#fbbf24" : "rgba(255,255,255,0.8)",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer"
                          }}
                        >
                          {isExpanded ? "▲ Hide Solution & Approach" : "⚡ Reveal FAANG Approach & Solution"}
                        </button>

                        <button
                          onClick={() => handleOpenConsultation(q)}
                          style={{
                            padding: "6px 13px",
                            borderRadius: 8,
                            border: "1px solid rgba(245,158,11,0.5)",
                            background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%)",
                            color: "#fde68a",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <span>👨‍💼 Consult 50-Yr FAANG Recruiter</span>
                          <span style={{ fontSize: 9, background: "#f59e0b", color: "#000", padding: "1px 5px", borderRadius: 4, fontWeight: 900 }}>BAR RAISER</span>
                        </button>

                        <button
                          onClick={() => {
                            router.push(`/student/practice-interview?question=${encodeURIComponent(q.question_text)}&role=${encodeURIComponent(q.company_or_event + " " + (q.role || "SDE"))}`);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "white",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <span>🎙️ Practice Answering with Alex</span>
                          <span>➔</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE SOLUTION DRAWER */}
                  {isExpanded && sol && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "1.25rem",
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(245,158,11,0.25)",
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        animation: "fadeIn 0.2s ease"
                      }}
                    >
                      {/* Optimal Approach */}
                      <div>
                        <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
                          🧠 OPTIMAL ARCHITECTURAL / ALGORITHMIC APPROACH
                        </div>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.55, margin: 0 }}>
                          {sol.optimal_approach}
                        </p>
                      </div>

                      {/* Complexity */}
                      {sol.complexity && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(16,185,129,0.1)", borderRadius: 8 }}>
                          <span style={{ fontSize: 11, color: "#34d399", fontWeight: 800 }}>⚡ COMPLEXITY:</span>
                          <span style={{ fontSize: 12, color: "#a7f3d0", fontWeight: 600 }}>{sol.complexity}</span>
                        </div>
                      )}

                      {/* Common Pitfalls */}
                      {sol.common_pitfalls && (
                        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.08)", borderLeft: "3px solid #ef4444", borderRadius: "0 8px 8px 0" }}>
                          <div style={{ fontSize: 10, color: "#fca5a5", fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>
                            ⚠️ COMMON INTERVIEW TRAPS & PITFALLS:
                          </div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                            {sol.common_pitfalls}
                          </div>
                        </div>
                      )}

                      {/* Sample Winning Response */}
                      {sol.sample_answer && (
                        <div style={{ padding: "0.75rem 1rem", background: "rgba(99,102,241,0.08)", borderLeft: "3px solid #818cf8", borderRadius: "0 8px 8px 0" }}>
                          <div style={{ fontSize: 10, color: "#c7d2fe", fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>
                            💬 FAANG CANDIDATE SAMPLE ANSWER:
                          </div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.55 }}>
                            "{sol.sample_answer}"
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL 1: AI DYNAMIC QUESTION GENERATOR */}
      {showAiModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div style={{ maxWidth: 520, width: "100%", background: "#0b0c1e", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 22, padding: "2rem", boxShadow: "0 0 50px rgba(99,102,241,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                ✨
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "white" }}>
                  AI On-Demand Question Generator
                </h3>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  Powered by Groq LLM • Generates authentic questions with optimal solutions
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              Interviewing for a company not currently listed? Enter any company (e.g. <em>Nvidia, Apple, Swiggy, Cred, Netflix, Salesforce</em>) and we will synthesize real technical & architectural questions.
            </p>

            <form onSubmit={handleGenerateAiQuestions} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, display: "block", marginBottom: 4 }}>COMPANY NAME</label>
                <input
                  type="text"
                  required
                  value={aiCompany}
                  onChange={e => setAiCompany(e.target.value)}
                  placeholder="e.g. Nvidia, Apple, Swiggy, Cred"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 13, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, display: "block", marginBottom: 4 }}>TARGET ROLE</label>
                <input
                  type="text"
                  value={aiRole}
                  onChange={e => setAiRole(e.target.value)}
                  placeholder="e.g. SDE-1, Full Stack Intern, Backend Systems"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 13, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  style={{ padding: "0.75rem 1.25rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: 10, cursor: "pointer", fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingAi}
                  style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "white", border: "none", borderRadius: 10, fontWeight: 800, cursor: generatingAi ? "wait" : "pointer", fontSize: 12 }}
                >
                  {generatingAi ? "Generating Questions & Solutions..." : "Generate 3 Questions ➔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: 50-YEAR FAANG RECRUITER CONSULTATION DRAWER */}
      {consultingQuestion && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 120, padding: "1rem" }}>
          <div
            style={{
              maxWidth: 780,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "linear-gradient(135deg, #090a18 0%, #05060e 100%)",
              border: "1px solid rgba(245,158,11,0.35)",
              borderRadius: 24,
              padding: "2rem",
              boxShadow: "0 0 60px rgba(245,158,11,0.15)",
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 20px rgba(245,158,11,0.4)" }}>
                  👨‍💼
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "white" }}>
                      50-Year FAANG Recruiter & Bar Raiser
                    </h2>
                    <span style={{ fontSize: 9, padding: "2px 7px", background: "rgba(245,158,11,0.25)", color: "#fbbf24", border: "1px solid #f59e0b", borderRadius: 6, fontWeight: 900, letterSpacing: 0.5 }}>
                      EXECUTIVE SUITE
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                    Consulting on <strong>{consultingQuestion.company_or_event}</strong> • {consultingQuestion.role || "Software Engineer"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setConsultingQuestion(null)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  color: "white",
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>
            </div>

            {/* The Question Card */}
            <div style={{ padding: "1rem 1.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                Target Interview Question:
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1.45 }}>
                {consultingQuestion.question_text}
              </div>
            </div>

            {/* Loading Indicator */}
            {consultingLoading && (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "rgba(255,255,255,0.5)" }}>
                <div style={{ fontSize: 32, marginBottom: 8, animation: "bounce 1s infinite" }}>⚡</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>
                  Bar Raiser Review in Progress...
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                  Auditing solution structure against 10,000+ FAANG hire/no-hire calibration rubrics
                </div>
              </div>
            )}

            {/* Recruiter Evaluation Display */}
            {!consultingLoading && consultationResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: "2rem" }}>
                {/* Verdict & Bar Raiser Score Card */}
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: 16,
                    background:
                      consultationResult.verdict === "STRONG HIRE"
                        ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05))"
                        : consultationResult.verdict === "LEAN HIRE"
                        ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.05))"
                        : consultationResult.verdict === "LEAN NO HIRE"
                        ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.05))"
                        : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))",
                    border:
                      consultationResult.verdict === "STRONG HIRE"
                        ? "1px solid rgba(16,185,129,0.4)"
                        : consultationResult.verdict === "LEAN HIRE"
                        ? "1px solid rgba(59,130,246,0.4)"
                        : consultationResult.verdict === "LEAN NO HIRE"
                        ? "1px solid rgba(245,158,11,0.4)"
                        : "1px solid rgba(239,68,68,0.4)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>BAR RAISER VERDICT:</span>
                      <span
                        style={{
                          fontSize: 12,
                          padding: "3px 10px",
                          borderRadius: 6,
                          fontWeight: 900,
                          background:
                            consultationResult.verdict === "STRONG HIRE"
                              ? "#10b981"
                              : consultationResult.verdict === "LEAN HIRE"
                              ? "#3b82f6"
                              : consultationResult.verdict === "LEAN NO HIRE"
                              ? "#f59e0b"
                              : "#ef4444",
                          color: "#000"
                        }}
                      >
                        {consultationResult.verdict}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>RECRUITER CALIBRATION SCORE:</span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#fbbf24" }}>
                        {consultationResult.bar_raiser_score} / 100
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: "white", lineHeight: 1.4 }}>
                    "{consultationResult.recruiter_headline}"
                  </div>
                </div>

                {/* Exact Executive Opening Script */}
                {consultationResult.exact_executive_script && (
                  <div style={{ padding: "1.25rem", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14 }}>
                    <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800, letterSpacing: 0.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>💬 EXECUTIVE OPENING SCRIPT (WORD-FOR-WORD WHAT TO SAY IN THE FIRST 60 SECONDS):</span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                      "{consultationResult.exact_executive_script}"
                    </p>
                  </div>
                )}

                {/* Secret Rubric */}
                {consultationResult.interviewer_secret_rubric && (
                  <div style={{ padding: "1rem 1.25rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 14 }}>
                    <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
                      🕵️ WHAT THE INTERVIEWER IS SECRETLY GRADING BEHIND THE SCENES:
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                      {consultationResult.interviewer_secret_rubric}
                    </div>
                  </div>
                )}

                {/* Two Column Breakdown: Impressed vs Red Flags */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                  {consultationResult.what_impressed_me && consultationResult.what_impressed_me.length > 0 && (
                    <div style={{ padding: "1rem", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14 }}>
                      <div style={{ fontSize: 11, color: "#34d399", fontWeight: 800, marginBottom: 8 }}>
                        ✨ WHAT IMPRESSED ME:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                        {consultationResult.what_impressed_me.map((point: string, i: number) => (
                          <li key={i} style={{ marginBottom: 4 }}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {consultationResult.critical_red_flags_and_blindspots && consultationResult.critical_red_flags_and_blindspots.length > 0 && (
                    <div style={{ padding: "1rem", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14 }}>
                      <div style={{ fontSize: 11, color: "#f87171", fontWeight: 800, marginBottom: 8 }}>
                        🚩 CRITICAL RED FLAGS & BLINDSPOTS:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                        {consultationResult.critical_red_flags_and_blindspots.map((point: string, i: number) => (
                          <li key={i} style={{ marginBottom: 4 }}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 50-Yr Golden Rule */}
                {consultationResult.golden_rule_50yr_recruiter && (
                  <div style={{ padding: "0.85rem 1.25rem", background: "rgba(245,158,11,0.1)", borderLeft: "4px solid #f59e0b", borderRadius: "0 12px 12px 0" }}>
                    <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>
                      👑 50-YEAR FAANG RECRUITER'S GOLDEN RULE:
                    </div>
                    <div style={{ fontSize: 12, color: "white", fontWeight: 600, lineHeight: 1.5 }}>
                      {consultationResult.golden_rule_50yr_recruiter}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Candidate Solution Submission & Live Critique Form */}
            <form onSubmit={handleSubmitCandidateCritique} style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: "white", fontWeight: 800 }}>
                  📝 Pitch Your Approach or Paste Code to the Recruiter:
                </label>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Live AI Bar-Raiser Feedback</span>
              </div>

              <textarea
                rows={4}
                value={consultationText}
                onChange={(e) => setConsultationText(e.target.value)}
                placeholder="e.g. 'I will use a two-pointer approach after sorting by start time. When intervals overlap, I update the max end bound. Time complexity is O(N log N)...'"
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical",
                  marginBottom: 10
                }}
              />

              {/* Quick sample inserts */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>QUICK TEMPLATES:</span>
                {[
                  "I'll first state constraints and validate empty/null edge cases.",
                  "Using a Min-Heap of size K for streaming ingestion in O(log K).",
                  "I implement an atomic Redis Lua script to eliminate race conditions."
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setConsultationText(txt)}
                    style={{
                      fontSize: 10,
                      padding: "3px 8px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      color: "#cbd5e1",
                      cursor: "pointer"
                    }}
                  >
                    + "{txt.slice(0, 32)}..."
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/student/practice-interview?question=${encodeURIComponent(consultingQuestion.question_text)}&role=${encodeURIComponent(consultingQuestion.company_or_event + " " + (consultingQuestion.role || "SDE"))}`);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "#34d399",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>🎙️ Voice Practice with Alex</span>
                  <span>➔</span>
                </button>

                <button
                  type="submit"
                  disabled={consultingLoading || !consultationText.trim()}
                  style={{
                    padding: "8px 20px",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "#000",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: consultingLoading || !consultationText.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  {consultingLoading ? "Evaluating Pitch..." : "⚡ Grade My Solution (Bar Raiser Verdict)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER CONTRIBUTE QUESTION */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div style={{ maxWidth: 520, width: "100%", background: "#0b0718", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "2rem" }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px" }}>Contribute an Interview Question</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: "1.25rem" }}>
              Help your peers prepare. Share questions you faced in technical or hackathon rounds.
            </p>

            <form onSubmit={handleAddQuestion} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, display: "block", marginBottom: 4 }}>COMPANY OR EVENT</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="e.g. Flipkart, Google, Smart India Hackathon"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, display: "block", marginBottom: 4 }}>ROLE / TRACK</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  placeholder="e.g. SDE-1 Intern, FinTech Track"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, display: "block", marginBottom: 4 }}>QUESTION TYPE</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, outline: "none" }}
                >
                  <option value="technical">Technical Coding / Core</option>
                  <option value="system-design">System Design & Architecture</option>
                  <option value="hackathon-pitch">Hackathon Jury Pitch</option>
                  <option value="behavioral">Behavioral & Culture</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, display: "block", marginBottom: 4 }}>QUESTION TEXT</label>
                <textarea
                  rows={4}
                  required
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="Paste the exact question and any nuances or constraints..."
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, outline: "none", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "0.75rem 1.25rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: 10, cursor: "pointer", fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: submitting ? "wait" : "pointer", fontSize: 13 }}
                >
                  {submitting ? "Submitting..." : "Submit Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
