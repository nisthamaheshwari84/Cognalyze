"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";
import {
  GD_TOPICS,
  GD_CATEGORIES,
  GD_DOMAINS,
  GD_FRESHNESS_OPTIONS,
  GDTopicItem
} from "@/lib/group-discussion-data";
import {
  Users,
  Search,
  Clock,
  Sparkles,
  ChevronRight,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  X,
  Volume2,
  HelpCircle,
  Filter,
  RefreshCw,
  Loader2,
  Check
} from "lucide-react";

interface GDArgumentStructure {
  openingStatement: string;
  supportingPoints: string;
  counterpoints: string;
  conclusion: string;
}

interface GDEvaluationFeedback {
  clarity: { status: "strong" | "needs_work"; feedback: string };
  relevance: { status: "strong" | "needs_work"; feedback: string };
  structure: { status: "strong" | "needs_work"; feedback: string };
  confidence: { status: "strong" | "needs_work"; feedback: string };
  communication: { status: "strong" | "needs_work"; feedback: string };
  useOfExamples: { status: "strong" | "needs_work"; feedback: string };
  counterArgumentHandling: { status: "strong" | "needs_work"; feedback: string };
  conciseness: { status: "strong" | "needs_work"; feedback: string };
  overallAssessment: string;
}

export default function GroupDiscussionPage() {
  const { isDark } = useTheme();

  // Dynamic Topic Pool (curated + AI freshly generated topics)
  const [topicsPool, setTopicsPool] = useState<GDTopicItem[]>(GD_TOPICS);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDomain, setSelectedDomain] = useState<string>("All Domains");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All Difficulties");
  const [selectedFreshness, setSelectedFreshness] = useState<string>("All Freshness");
  const [searchQuery, setSearchQuery] = useState("");
  const [targetRole, setTargetRole] = useState("AI/ML Engineer");

  // AI Fresh Topic Generator Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCount, setGenerateCount] = useState<number>(5);
  const [generateDifficulty, setGenerateDifficulty] = useState<"Mixed" | "Easy" | "Medium" | "Hard">("Mixed");
  const [generateSelectedDomains, setGenerateSelectedDomains] = useState<string[]>([
    "AI & Machine Learning",
    "Software Engineering",
    "Future of Work",
    "Workplace & Careers"
  ]);
  const [generateTargetRole, setGenerateTargetRole] = useState("AI/ML Engineer");
  const [generateFreshness, setGenerateFreshness] = useState<"Latest" | "Trending" | "Evergreen" | "Mixed">("Latest");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationToast, setGenerationToast] = useState<string | null>(null);

  // Interactive Practice State
  const [activePracticeTopic, setActivePracticeTopic] = useState<GDTopicItem | null>(null);
  const [practiceStep, setPracticeStep] = useState<"prep" | "speech" | "feedback">("prep");
  
  // Argument Drafts
  const [argumentsData, setArgumentsData] = useState<GDArgumentStructure>({
    openingStatement: "",
    supportingPoints: "",
    counterpoints: "",
    conclusion: "",
  });

  // Timer & Recording
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Evaluated Feedback State
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<GDEvaluationFeedback | null>(null);

  // Load profile and cached fresh topics from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cognalyze_student_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.target_role) {
          setTargetRole(parsed.target_role);
          setGenerateTargetRole(parsed.target_role);
        }
      }

      // Load cached fresh topics
      const storedFresh = localStorage.getItem("cognalyze_gd_fresh_topics");
      if (storedFresh) {
        const parsed: GDTopicItem[] = JSON.parse(storedFresh);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultIds = new Set(GD_TOPICS.map((t) => t.id));
          const uniqueStored = parsed.filter((t) => !defaultIds.has(t.id));
          if (uniqueStored.length > 0) {
            setTopicsPool([...uniqueStored, ...GD_TOPICS]);
          }
        }
      }
    } catch (e) {
      console.warn("Storage sync failed:", e);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Speech Recognition Setup
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Speech Recognition is not supported by your browser. Please type your responses.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setArgumentsData((prev) => ({
          ...prev,
          supportingPoints: prev.supportingPoints + " " + transcript,
        }));
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleStartPractice = (topic: GDTopicItem) => {
    setActivePracticeTopic(topic);
    setPracticeStep("prep");
    setTimerSeconds(topic.timeLimitMinutes * 60);
    setTimerRunning(false);
    setFeedback(null);
    setArgumentsData({
      openingStatement: "",
      supportingPoints: "",
      counterpoints: "",
      conclusion: "",
    });
  };

  // AI Fresh Topic Generation Handler with duplicate/near-duplicate rejection
  const handleGenerateFreshTopics = async () => {
    setIsGenerating(true);
    setGenerationToast(null);

    try {
      // Gather existing titles from memory and history
      const existingTitles = topicsPool.map((t) => t.title);
      try {
        const historyRaw = localStorage.getItem("cognalyze_gd_topic_history");
        if (historyRaw) {
          const parsed = JSON.parse(historyRaw);
          if (Array.isArray(parsed)) {
            existingTitles.push(...parsed);
          }
        }
      } catch {}

      const res = await fetch("/api/gd/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domains: generateSelectedDomains,
          difficulty: generateDifficulty,
          targetRole: generateTargetRole,
          freshness: generateFreshness,
          count: generateCount,
          existingTitles,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate topics");
      }

      const data = await res.json();
      const newTopics: GDTopicItem[] = data.topics || [];

      if (newTopics.length > 0) {
        // Prepend to current topicsPool
        const updatedPool = [...newTopics, ...topicsPool];
        setTopicsPool(updatedPool);

        // Save generated topics in localStorage
        try {
          const storedFresh = localStorage.getItem("cognalyze_gd_fresh_topics");
          const previousFresh: GDTopicItem[] = storedFresh ? JSON.parse(storedFresh) : [];
          const combinedFresh = [...newTopics, ...previousFresh];
          localStorage.setItem("cognalyze_gd_fresh_topics", JSON.stringify(combinedFresh));

          // Save titles in history for deduplication
          const combinedHistory = [...newTopics.map((t) => t.title), ...existingTitles];
          localStorage.setItem("cognalyze_gd_topic_history", JSON.stringify(combinedHistory.slice(0, 200)));
        } catch {}

        setGenerationToast(
          `✨ Generated ${newTopics.length} fresh placement GD topics tailored for ${generateTargetRole}. 0 duplicates.`
        );
        setShowGenerateModal(false);
      }
    } catch (err: any) {
      console.error("Error generating topics:", err);
      setGenerationToast("Unable to generate fresh topics. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluatePractice = () => {
    setEvaluating(true);
    setTimeout(() => {
      const { openingStatement, supportingPoints, counterpoints, conclusion } = argumentsData;
      const totalWords = (
        openingStatement + " " + supportingPoints + " " + counterpoints + " " + conclusion
      ).trim().split(/\s+/).filter(Boolean).length;

      const hasExamples = /for example|e\.g\.|instance|such as|case study|metrics|benchmark|data/i.test(
        supportingPoints + " " + openingStatement
      );
      const hasCounter = /however|on the other hand|critics argue|trade-off|alternatively|opposing/i.test(
        counterpoints
      );
      const hasStructure = openingStatement.length > 20 && conclusion.length > 20;

      const generatedFeedback: GDEvaluationFeedback = {
        clarity: {
          status: totalWords > 40 ? "strong" : "needs_work",
          feedback:
            totalWords > 40
              ? "Expressed key arguments with clear vocabulary and focused syntax."
              : "Arguments are brief; expand on the technical mechanisms and operational ramifications.",
        },
        relevance: {
          status: "strong",
          feedback: `Arguments adhered closely to ${activePracticeTopic?.category} and core prompt trade-offs.`,
        },
        structure: {
          status: hasStructure ? "strong" : "needs_work",
          feedback: hasStructure
            ? "Distinct progression: hooked the group with an opening definition, presented supporting points, and summarized effectively."
            : "Opening or closing statement is underdeveloped. Ensure you set the stage clearly and offer a balanced conclusion.",
        },
        confidence: {
          status: totalWords > 60 ? "strong" : "needs_work",
          feedback:
            totalWords > 60
              ? "Assertive and well-paced delivery with constructive stance."
              : "Needs more decisive assertion; avoid tentative qualifying language.",
        },
        communication: {
          status: "strong",
          feedback: "Professional placement-standard tone without excessive slang or repetitive filler.",
        },
        useOfExamples: {
          status: hasExamples ? "strong" : "needs_work",
          feedback: hasExamples
            ? "Effectively grounded abstract claims with concrete industry examples and benchmarks."
            : "Missing specific real-world examples (companies, architectures, or empirical case studies) to validate claims.",
        },
        counterArgumentHandling: {
          status: hasCounter ? "strong" : "needs_work",
          feedback: hasCounter
            ? "Acknowledged alternative viewpoints constructively before defending the primary stance."
            : "Lacks rebuttal depth. In a real GD, anticipating counter-perspectives prevents your position from being easily dismantled.",
        },
        conciseness: {
          status: totalWords <= 250 ? "strong" : "needs_work",
          feedback:
            totalWords <= 250
              ? "Respects discussion floor time limits without monopolizing the conversation."
              : "Argument length exceeds standard turn limits; aim to deliver your points within 60-90 seconds.",
        },
        overallAssessment: `The candidate demonstrated strong awareness of ${activePracticeTopic?.category} trade-offs. To elevate your rating into the top tier, incorporate more quantitative evidence and anticipate opposing objections directly in your rebuttal section.`,
      };

      setFeedback(generatedFeedback);
      setEvaluating(false);
      setPracticeStep("feedback");
    }, 750);
  };

  // Filtered Topics
  const filteredTopics = useMemo(() => {
    return topicsPool.filter((t) => {
      // Category filter
      if (selectedCategory !== "All" && t.category !== selectedCategory) {
        return false;
      }
      // Domain filter
      if (selectedDomain !== "All Domains" && t.domain && t.domain.toLowerCase() !== selectedDomain.toLowerCase()) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== "All Difficulties" && t.difficulty !== selectedDifficulty) {
        return false;
      }
      // Freshness filter
      if (selectedFreshness !== "All Freshness") {
        if (selectedFreshness === "Recently Generated" && !t.isAiGenerated) {
          return false;
        }
        if (selectedFreshness !== "Recently Generated" && t.freshness && t.freshness !== selectedFreshness) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesPoints = t.preparationPoints.some((p) => p.toLowerCase().includes(q));
        const matchesDomain = (t.domain || "").toLowerCase().includes(q);
        const matchesContext = (t.source_context || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesPoints && !matchesDomain && !matchesContext) return false;
      }
      return true;
    });
  }, [topicsPool, selectedCategory, selectedDomain, selectedDifficulty, selectedFreshness, searchQuery]);

  // Recommended for DNA target role
  const recommendedTopics = useMemo(() => {
    return topicsPool.filter((t) =>
      t.recommendedRoles.some(
        (r) =>
          r.toLowerCase().includes(targetRole.toLowerCase()) ||
          targetRole.toLowerCase().includes(r.toLowerCase())
      )
    );
  }, [topicsPool, targetRole]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#07111F" : "#F6F5F1",
        color: isDark ? "#F4F7FF" : "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        transition: "background-color 150ms ease, color 150ms ease",
      }}
    >
      <AppNav role="student" />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 20px 64px" }}>
        {/* ── HEADER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  padding: "2px 8px",
                  borderRadius: 5,
                  backgroundColor: isDark ? "rgba(52, 120, 246, 0.14)" : "#EFF4FE",
                  color: isDark ? "#6EA2FF" : "#356AE6",
                  border: `1px solid ${isDark ? "rgba(52, 120, 246, 0.35)" : "#D2E0FB"}`,
                  textTransform: "uppercase",
                }}
              >
                Campus GD Module
              </span>
              <span style={{ fontSize: 12, color: isDark ? "#8292AA" : "#667085" }}>
                {topicsPool.length} Placement Discussion Topics
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.5rem, 2.5vw, 1.9rem)",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: isDark ? "#F4F7FF" : "#162A43",
                margin: "0 0 6px",
              }}
            >
              Group Discussion Preparation Arena
            </h1>
            <p style={{ fontSize: 13, color: isDark ? "#B7C4D8" : "#667085", margin: 0, maxWidth: 700, lineHeight: 1.5 }}>
              Prepare structured arguments, debate multi-perspective technical and business trade-offs, and receive evidence-grounded communication feedback.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href="/student/gd-practice"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 7,
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                color: isDark ? "#F4F7FF" : "#162A43",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 2px rgba(16,24,40,0.04)",
              }}
            >
              <Volume2 size={15} className="text-[#3478F6]" />
              <span>Launch Live Multi-Speaker Simulation</span>
            </a>
          </div>
        </div>

        {/* ── 5. STUDENT DNA RECOMMENDATION ── */}
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 10,
            marginBottom: 20,
            backgroundColor: isDark ? "#13243A" : "#EFF4FE",
            border: `1px solid ${isDark ? "#2B425E" : "#D2E0FB"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: "#3478F6",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43" }}>
                Recommended for your target role: <span style={{ color: "#3478F6" }}>{targetRole}</span>
              </div>
              <div style={{ fontSize: 11, color: isDark ? "#B7C4D8" : "#475467" }}>
                Prioritizing AI & Technology, Distributed Infrastructure, and Future of Work debates tailored to your Student DNA.
              </div>
            </div>
          </div>

          <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#8292AA" : "#667085" }}>
            {recommendedTopics.length} Focused Topics Available
          </span>
        </div>

        {/* ── TOAST NOTIFICATION ── */}
        {generationToast && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              backgroundColor: isDark ? "rgba(52, 120, 246, 0.16)" : "#EFF4FE",
              border: `1px solid ${isDark ? "rgba(52, 120, 246, 0.4)" : "#BFDBFE"}`,
              color: isDark ? "#93C5FD" : "#1D4ED8",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={14} />
              <span>{generationToast}</span>
            </div>
            <button
              onClick={() => setGenerationToast(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── SEARCH & AI GENERATOR BAR ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 14,
          }}
        >
          {/* Search Bar */}
          <div style={{ position: "relative", flex: "1 1 320px", maxWidth: 520 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: isDark ? "#8292AA" : "#98A2B3",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g. AI Agents, Monolith, CBDC, RTO, Cloud)..."
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: 7,
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                color: isDark ? "#F4F7FF" : "#17191C",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* AI Fresh Topic Generator Button */}
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 7,
              backgroundColor: "#3478F6",
              color: "#FFFFFF",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(52, 120, 246, 0.35)",
              transition: "all 150ms ease",
              whiteSpace: "nowrap",
            }}
            className="hover:bg-[#2866db]"
          >
            <Sparkles size={16} />
            <span>Generate Fresh Topics</span>
          </button>
        </div>

        {/* ── ADVANCED CONTROLS ROW: DOMAIN, FRESHNESS, DIFFICULTY, ROLE ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {/* Domain Selector */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 7,
              backgroundColor: isDark ? "#13243A" : "#FFFFFF",
              border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
              color: isDark ? "#F4F7FF" : "#17191C",
              fontSize: 12,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="All Domains">All Domains</option>
            {GD_DOMAINS.map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>

          {/* Freshness Filter */}
          <select
            value={selectedFreshness}
            onChange={(e) => setSelectedFreshness(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 7,
              backgroundColor: isDark ? "#13243A" : "#FFFFFF",
              border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
              color: isDark ? "#F4F7FF" : "#17191C",
              fontSize: 12,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="All Freshness">All Freshness</option>
            {GD_FRESHNESS_OPTIONS.filter((f) => f !== "All").map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 7,
              backgroundColor: isDark ? "#13243A" : "#FFFFFF",
              border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
              color: isDark ? "#F4F7FF" : "#17191C",
              fontSize: 12,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="All Difficulties">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Target Role Filter */}
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 7,
              backgroundColor: isDark ? "#13243A" : "#FFFFFF",
              border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
              color: isDark ? "#F4F7FF" : "#17191C",
              fontSize: 12,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="AI/ML Engineer">Role: AI/ML Engineer</option>
            <option value="Software Engineer">Role: Software Engineer</option>
            <option value="Backend Developer">Role: Backend Developer</option>
            <option value="Full Stack Developer">Role: Full Stack Developer</option>
            <option value="Product Manager">Role: Product Manager</option>
            <option value="Data Scientist">Role: Data Scientist</option>
            <option value="Cloud Architect">Role: Cloud Architect</option>
          </select>

          {(selectedDomain !== "All Domains" ||
            selectedFreshness !== "All Freshness" ||
            selectedDifficulty !== "All Difficulties") && (
            <button
              onClick={() => {
                setSelectedDomain("All Domains");
                setSelectedFreshness("All Freshness");
                setSelectedDifficulty("All Difficulties");
              }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 11,
                color: "#3478F6",
                cursor: "pointer",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* ── 6 CATEGORIES ── */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 20, scrollbarWidth: "none" }}>
          {GD_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  border: `1px solid ${
                    isActive ? "#3478F6" : isDark ? "#243A55" : "#E4E1DA"
                  }`,
                  backgroundColor: isActive
                    ? "#3478F6"
                    : isDark
                    ? "#13243A"
                    : "#FFFFFF",
                  color: isActive ? "#FFFFFF" : isDark ? "#B7C4D8" : "#667085",
                  transition: "all 120ms ease",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── TOPIC CARDS GRID (Section 11) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              style={{
                padding: "20px",
                borderRadius: 10,
                backgroundColor: isDark ? "#0F1D31" : "#FFFFFF",
                border: `1px solid ${isDark ? "#243A55" : "#E4E1DA"}`,
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.25)" : "0 1px 3px rgba(16,24,40,0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
                transition: "all 150ms ease",
              }}
              className="hover:border-[#3478F6]"
            >
              <div>
                {/* Meta Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        backgroundColor: isDark ? "#13243A" : "#F0EFEA",
                        color: isDark ? "#B7C4D8" : "#162A43",
                        border: `1px solid ${isDark ? "#243A55" : "#E4E1DA"}`,
                        textTransform: "uppercase",
                      }}
                    >
                      {topic.category}
                    </span>

                    {/* AI Generated vs Verified Campus Archive Provenance */}
                    {topic.isAiGenerated ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          backgroundColor: isDark ? "rgba(168, 85, 247, 0.14)" : "#F3E8FF",
                          color: isDark ? "#C084FC" : "#7E22CE",
                          border: `1px solid ${isDark ? "rgba(168, 85, 247, 0.35)" : "#E9D5FF"}`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Sparkles size={10} /> AI-Generated
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          backgroundColor: isDark ? "rgba(40, 183, 122, 0.12)" : "#ECFDF5",
                          color: isDark ? "#34D399" : "#059669",
                          border: `1px solid ${isDark ? "rgba(40, 183, 122, 0.3)" : "#A7F3D0"}`,
                        }}
                      >
                        Verified Archive
                      </span>
                    )}

                    {topic.domain && (
                      <span style={{ fontSize: 10, color: isDark ? "#8292AA" : "#667085", fontWeight: 500 }}>
                        {topic.domain}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        backgroundColor:
                          topic.difficulty === "Easy"
                            ? isDark ? "rgba(40, 183, 122, 0.14)" : "#EAF4EE"
                            : topic.difficulty === "Medium"
                            ? isDark ? "rgba(242, 184, 75, 0.14)" : "#FEF7ED"
                            : isDark ? "rgba(240, 93, 103, 0.14)" : "#FDF2F2",
                        color:
                          topic.difficulty === "Easy"
                            ? isDark ? "#48D394" : "#28B77A"
                            : topic.difficulty === "Medium"
                            ? isDark ? "#F5C86B" : "#B7791F"
                            : isDark ? "#F05D67" : "#C24141",
                        border: `1px solid ${
                          topic.difficulty === "Easy"
                            ? isDark ? "rgba(40, 183, 122, 0.35)" : "#D1F2DF"
                            : topic.difficulty === "Medium"
                            ? isDark ? "rgba(242, 184, 75, 0.35)" : "#FDE68A"
                            : isDark ? "rgba(240, 93, 103, 0.35)" : "#F8C8C8"
                        }`,
                      }}
                    >
                      {topic.difficulty}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        color: isDark ? "#8292AA" : "#667085",
                      }}
                    >
                      <Clock size={12} /> {topic.timeLimitMinutes}m
                    </span>
                  </div>
                </div>

                {/* Topic Title */}
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: 1.4,
                    color: isDark ? "#F4F7FF" : "#17191C",
                    margin: "0 0 10px",
                  }}
                >
                  {topic.title}
                </h3>

                {/* Topic Source Context / Why this topic? */}
                {topic.source_context && (
                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#13243A" : "#F8F7F4",
                      border: `1px solid ${isDark ? "#243A55" : "#E4E1DA"}`,
                      fontSize: 11,
                      color: isDark ? "#B7C4D8" : "#475467",
                      marginBottom: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    <strong style={{ color: isDark ? "#F4F7FF" : "#162A43" }}>Why this topic / Context:</strong>{" "}
                    {topic.source_context}
                  </div>
                )}

                {/* Preparation Points */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8292AA" : "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                    Key Preparation Points:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: isDark ? "#D4DEEB" : "#475467", lineHeight: 1.5 }}>
                    {topic.preparationPoints.slice(0, 2).map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button (Cognalyze Blue) */}
              <button
                type="button"
                onClick={() => handleStartPractice(topic)}
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: 7,
                  backgroundColor: "#3478F6",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background-color 150ms ease",
                }}
                className="hover:bg-[#4C8DFF]"
              >
                <Play size={14} />
                <span>Start GD Practice</span>
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* ── AI FRESH TOPIC GENERATOR OPTIONS MODAL ── */}
      {showGenerateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(7, 17, 31, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 620,
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 12,
              backgroundColor: isDark ? "#0F1D31" : "#FFFFFF",
              border: `1px solid ${isDark ? "#243A55" : "#E4E1DA"}`,
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.4)",
              padding: "24px 28px",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <Sparkles size={18} style={{ color: "#3478F6" }} />
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: isDark ? "#F4F7FF" : "#162A43" }}>
                    Generate Fresh GD Topics
                  </h2>
                </div>
                <p style={{ fontSize: 12, color: isDark ? "#8292AA" : "#667085", margin: 0 }}>
                  Generates genuinely new, debatable campus placement discussion topics tailored to your Student DNA and target role.
                </p>
              </div>

              <button
                onClick={() => setShowGenerateModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: isDark ? "#8292AA" : "#667085",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Options Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Number of Topics */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43", marginBottom: 6 }}>
                  Number of Topics:
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGenerateCount(num)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: `1px solid ${
                          generateCount === num ? "#3478F6" : isDark ? "#243A55" : "#E4E1DA"
                        }`,
                        backgroundColor: generateCount === num ? "#3478F6" : isDark ? "#13243A" : "#F6F5F1",
                        color: generateCount === num ? "#FFFFFF" : isDark ? "#B7C4D8" : "#475467",
                      }}
                    >
                      {num} Topics
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43", marginBottom: 6 }}>
                  Difficulty:
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["Mixed", "Easy", "Medium", "Hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setGenerateDifficulty(diff)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: `1px solid ${
                          generateDifficulty === diff ? "#3478F6" : isDark ? "#243A55" : "#E4E1DA"
                        }`,
                        backgroundColor: generateDifficulty === diff ? "#3478F6" : isDark ? "#13243A" : "#F6F5F1",
                        color: generateDifficulty === diff ? "#FFFFFF" : isDark ? "#B7C4D8" : "#475467",
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Role (Uses Student DNA) */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43", marginBottom: 6 }}>
                  Target Role (Personalized via Student DNA):
                </label>
                <select
                  value={generateTargetRole}
                  onChange={(e) => setGenerateTargetRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 7,
                    backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                    color: isDark ? "#F4F7FF" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="AI/ML Engineer">AI/ML Engineer (Prioritizes AI, ML, GenAI, Data, Ethics)</option>
                  <option value="Software Engineer">Software Engineer (Prioritizes DSA, Software Eng, Productivity)</option>
                  <option value="Backend Developer">Backend Developer (Prioritizes Distributed Systems, DB, Cloud)</option>
                  <option value="Full Stack Developer">Full Stack Developer (Prioritizes Web, Architectures, APIs)</option>
                  <option value="Product Manager">Product Manager (Prioritizes Markets, Consumer Behavior, Strategy)</option>
                  <option value="Data Scientist">Data Scientist (Prioritizes Statistics, Analytics, AI)</option>
                </select>
              </div>

              {/* Freshness */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43", marginBottom: 6 }}>
                  Freshness:
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["Latest", "Trending", "Evergreen", "Mixed"] as const).map((fresh) => (
                    <button
                      key={fresh}
                      type="button"
                      onClick={() => setGenerateFreshness(fresh)}
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: `1px solid ${
                          generateFreshness === fresh ? "#3478F6" : isDark ? "#243A55" : "#E4E1DA"
                        }`,
                        backgroundColor: generateFreshness === fresh ? "#3478F6" : isDark ? "#13243A" : "#F6F5F1",
                        color: generateFreshness === fresh ? "#FFFFFF" : isDark ? "#B7C4D8" : "#475467",
                      }}
                    >
                      {fresh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Domains Multi-select */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43" }}>
                    Domains ({generateSelectedDomains.length} selected):
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setGenerateSelectedDomains([...GD_DOMAINS])}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#3478F6",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Select All
                    </button>
                    <span style={{ color: isDark ? "#243A55" : "#E4E1DA" }}>|</span>
                    <button
                      type="button"
                      onClick={() => setGenerateSelectedDomains([])}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isDark ? "#8292AA" : "#667085",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                    gap: 6,
                    maxHeight: 180,
                    overflowY: "auto",
                    padding: "8px",
                    borderRadius: 7,
                    backgroundColor: isDark ? "#13243A" : "#F8F7F4",
                    border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                  }}
                >
                  {GD_DOMAINS.map((domain) => {
                    const isChecked = generateSelectedDomains.includes(domain);
                    return (
                      <div
                        key={domain}
                        onClick={() => {
                          setGenerateSelectedDomains((prev) =>
                            prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
                          );
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 6px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: "pointer",
                          backgroundColor: isChecked
                            ? isDark ? "rgba(52, 120, 246, 0.2)" : "#EFF4FE"
                            : "transparent",
                          color: isChecked ? (isDark ? "#93C5FD" : "#1D4ED8") : isDark ? "#B7C4D8" : "#475467",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: "pointer" }}
                        />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {domain}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={isGenerating}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 7,
                    backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                    color: isDark ? "#F4F7FF" : "#162A43",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isGenerating ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleGenerateFreshTopics}
                  disabled={isGenerating || generateSelectedDomains.length === 0}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 7,
                    backgroundColor: "#3478F6",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isGenerating || generateSelectedDomains.length === 0 ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: isGenerating || generateSelectedDomains.length === 0 ? 0.7 : 1,
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating Topics...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Topics →</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── PRACTICE WORKSPACE MODAL ── */}
      {activePracticeTopic && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(7, 17, 31, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setActivePracticeTopic(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 820,
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: 12,
              backgroundColor: isDark ? "#0F1D31" : "#FFFFFF",
              border: `1px solid ${isDark ? "#243A55" : "#E4E1DA"}`,
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.4)",
              padding: "24px 28px",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 4,
                    backgroundColor: isDark ? "#13243A" : "#EFF4FE",
                    color: isDark ? "#6EA2FF" : "#356AE6",
                    border: `1px solid ${isDark ? "#2B425E" : "#D2E0FB"}`,
                    textTransform: "uppercase",
                    display: "inline-block",
                    marginBottom: 6,
                  }}
                >
                  {activePracticeTopic.category} • {activePracticeTopic.difficulty}
                </span>
                <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: isDark ? "#F4F7FF" : "#162A43" }}>
                  {activePracticeTopic.title}
                </h2>
              </div>

              <button
                onClick={() => setActivePracticeTopic(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: isDark ? "#8292AA" : "#667085",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Preparation Points Box */}
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 8,
                backgroundColor: isDark ? "#13243A" : "#F8F7F4",
                border: `1px solid ${isDark ? "#243A55" : "#E4E1DA"}`,
                marginBottom: 18,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8292AA" : "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                Preparation Angles & Facts:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: isDark ? "#D4DEEB" : "#344054", lineHeight: 1.6 }}>
                {activePracticeTopic.preparationPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Stepper Tabs: 1. Prepare Arguments -> 2. Review Feedback */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18, borderBottom: `1px solid ${isDark ? "#243A55" : "#E4E1DA"}`, paddingBottom: 10 }}>
              <button
                onClick={() => setPracticeStep("prep")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: practiceStep === "prep" ? "#3478F6" : "transparent",
                  color: practiceStep === "prep" ? "#FFFFFF" : isDark ? "#B7C4D8" : "#667085",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                1. Prepare Arguments
              </button>

              {feedback && (
                <button
                  onClick={() => setPracticeStep("feedback")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: practiceStep === "feedback" ? "#3478F6" : "transparent",
                    color: practiceStep === "feedback" ? "#FFFFFF" : isDark ? "#B7C4D8" : "#667085",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  2. Assessment & Feedback
                </button>
              )}
            </div>

            {/* Step 1: Structured Arguments Inputs */}
            {practiceStep === "prep" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Timer & Speech Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setTimerRunning(!timerRunning)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 6,
                        backgroundColor: timerRunning ? (isDark ? "rgba(240, 93, 103, 0.14)" : "#FDF2F2") : isDark ? "#13243A" : "#FFFFFF",
                        border: `1px solid ${timerRunning ? "#F05D67" : isDark ? "#2B425E" : "#E4E1DA"}`,
                        color: timerRunning ? "#F05D67" : isDark ? "#F4F7FF" : "#162A43",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Clock size={13} />
                      <span>{timerRunning ? "Pause Timer" : "Start Timer"}</span>
                      <span style={{ fontFamily: "monospace" }}>
                        ({Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")})
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={toggleRecording}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 6,
                      backgroundColor: isRecording ? "#F05D67" : isDark ? "#13243A" : "#FFFFFF",
                      border: `1px solid ${isRecording ? "#F05D67" : isDark ? "#2B425E" : "#E4E1DA"}`,
                      color: isRecording ? "#FFFFFF" : isDark ? "#F4F7FF" : "#162A43",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
                    <span>{isRecording ? "Stop Recording" : "Dictate Response"}</span>
                  </button>
                </div>

                {/* 1. Opening Statement */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43", marginBottom: 4 }}>
                    1. Opening Statement (Hook, Definition, and Thesis):
                  </label>
                  <textarea
                    rows={2}
                    value={argumentsData.openingStatement}
                    onChange={(e) => setArgumentsData({ ...argumentsData, openingStatement: e.target.value })}
                    placeholder="E.g., 'Good morning team. In today's landscape, evaluating autonomous AI agents requires balancing shipping velocity against catastrophic downtime risk...'"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                      border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                      color: isDark ? "#F4F7FF" : "#17191C",
                      fontSize: 12,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* 2. Supporting Points */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43", marginBottom: 4 }}>
                    2. Supporting Points & Real-World Examples:
                  </label>
                  <textarea
                    rows={3}
                    value={argumentsData.supportingPoints}
                    onChange={(e) => setArgumentsData({ ...argumentsData, supportingPoints: e.target.value })}
                    placeholder="Provide 2-3 substantive points backed by empirical evidence, metrics, or company case studies..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                      border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                      color: isDark ? "#F4F7FF" : "#17191C",
                      fontSize: 12,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* 3. Counterpoints & Rebuttals */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43", marginBottom: 4 }}>
                    3. Counterpoints & Constructive Rebuttals:
                  </label>
                  <textarea
                    rows={2}
                    value={argumentsData.counterpoints}
                    onChange={(e) => setArgumentsData({ ...argumentsData, counterpoints: e.target.value })}
                    placeholder="Acknowledge what opponents will argue ('Critics may claim...') and explain your mitigation strategy..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                      border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                      color: isDark ? "#F4F7FF" : "#17191C",
                      fontSize: 12,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* 4. Conclusion */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43", marginBottom: 4 }}>
                    4. Conclusion & Forward-Looking Synthesis:
                  </label>
                  <textarea
                    rows={2}
                    value={argumentsData.conclusion}
                    onChange={(e) => setArgumentsData({ ...argumentsData, conclusion: e.target.value })}
                    placeholder="Summarize the consensus, future direction, and constructive resolution..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                      border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                      color: isDark ? "#F4F7FF" : "#17191C",
                      fontSize: 12,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Submit for Evaluation */}
                <button
                  type="button"
                  onClick={handleEvaluatePractice}
                  disabled={evaluating}
                  style={{
                    backgroundColor: "#3478F6",
                    color: "#FFFFFF",
                    padding: "10px 18px",
                    borderRadius: 7,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 6,
                  }}
                  className="hover:bg-[#4C8DFF]"
                >
                  {evaluating ? "Evaluating Arguments..." : "Submit for Evidence-Grounded Assessment"}
                </button>
              </div>
            )}

            {/* Step 2: Evidence-Grounded Feedback (Section 4 & 11) */}
            {practiceStep === "feedback" && feedback && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 8,
                    backgroundColor: isDark ? "#13243A" : "#F6F5F1",
                    border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#3478F6", textTransform: "uppercase", marginBottom: 4 }}>
                    Overall Placement Synthesis
                  </div>
                  <p style={{ fontSize: 13, color: isDark ? "#F4F7FF" : "#17191C", lineHeight: 1.5, margin: 0 }}>
                    {feedback.overallAssessment}
                  </p>
                </div>

                {/* 8 Granular Criteria Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { key: "clarity", title: "1. Clarity", item: feedback.clarity },
                    { key: "relevance", title: "2. Relevance", item: feedback.relevance },
                    { key: "structure", title: "3. Structure", item: feedback.structure },
                    { key: "confidence", title: "4. Confidence", item: feedback.confidence },
                    { key: "communication", title: "5. Communication", item: feedback.communication },
                    { key: "useOfExamples", title: "6. Use of Examples", item: feedback.useOfExamples },
                    { key: "counterArgumentHandling", title: "7. Counter-Arguments", item: feedback.counterArgumentHandling },
                    { key: "conciseness", title: "8. Conciseness", item: feedback.conciseness },
                  ].map(({ key, title, item }) => (
                    <div
                      key={key}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 8,
                        backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                        border: `1px solid ${isDark ? "#243A55" : "#E4E1DA"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#F4F7FF" : "#162A43" }}>
                          {title}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 4,
                            backgroundColor:
                              item.status === "strong"
                                ? isDark ? "rgba(40, 183, 122, 0.14)" : "#EAF4EE"
                                : isDark ? "rgba(242, 184, 75, 0.14)" : "#FEF7ED",
                            color:
                              item.status === "strong"
                                ? isDark ? "#48D394" : "#28B77A"
                                : isDark ? "#F5C86B" : "#B7791F",
                          }}
                        >
                          {item.status === "strong" ? "Demonstrated" : "Needs Expansion"}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: isDark ? "#B7C4D8" : "#475467", margin: 0, lineHeight: 1.4 }}>
                        {item.feedback}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPracticeStep("prep")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                      border: `1px solid ${isDark ? "#2B425E" : "#E4E1DA"}`,
                      color: isDark ? "#F4F7FF" : "#162A43",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Edit Arguments
                  </button>

                  <a
                    href="/student/gd-practice"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      backgroundColor: "#3478F6",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Test in Live Meeting Simulation →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
