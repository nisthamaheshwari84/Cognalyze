"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CanonicalSubject,
  CanonicalSubtopic,
  CanonicalSubjectSlug,
  MasteryState
} from "@/lib/skills/curriculum/types";
import {
  SubjectMentorPersona,
  SubjectMentorReply
} from "@/lib/skills/curriculum/subject-mentors";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Terminal,
  Bug,
  Award,
  ChevronRight,
  ChevronDown,
  Search,
  Share2,
  Zap,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Send,
  Volume2,
  VolumeX,
  ExternalLink,
  Code2
} from "lucide-react";

interface UnifiedLearningWorkspaceProps {
  initialSubjectSlug: CanonicalSubjectSlug;
  initialSubtopicSlug?: string;
  candidateId?: string;
}

export default function UnifiedLearningWorkspace({
  initialSubjectSlug,
  initialSubtopicSlug,
  candidateId = "guest"
}: UnifiedLearningWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── 1. CORE NAVIGATION STATE ──────────────────────────────────
  const [selectedSubjectSlug, setSelectedSubjectSlug] = useState<CanonicalSubjectSlug>(initialSubjectSlug);
  const [allSubjects, setAllSubjects] = useState<CanonicalSubject[]>([]);
  const [currentSubject, setCurrentSubject] = useState<CanonicalSubject | null>(null);
  const [currentSubtopic, setCurrentSubtopic] = useState<CanonicalSubtopic | null>(null);
  const [mentorPersona, setMentorPersona] = useState<SubjectMentorPersona | null>(null);
  const [masteryState, setMasteryState] = useState<MasteryState>("not_started");
  const [masteryScore, setMasteryScore] = useState<number>(0);
  const [masterySummary, setMasterySummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Learning Stage (1: Understand, 2: Demonstrate, 3: Practise, 4: Execute/Debug, 5: Assess)
  const [activeStage, setActiveStage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  // ── 2. AUDIO NARRATION STATE ──────────────────────────────────
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [audioTranscriptOpen, setAudioTranscriptOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // ── 3. CO-BUILD & MENTOR STATE ────────────────────────────────
  const [slotInput, setSlotInput] = useState<string>("");
  const [slotFeedback, setSlotFeedback] = useState<{ isValid?: boolean; message?: string } | null>(null);
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3 | 4>(1);
  const [mentorChatHistory, setMentorChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [mentorInputMsg, setMentorInputMsg] = useState("");
  const [mentorLoading, setMentorLoading] = useState(false);

  // ── 4. EXECUTION SANDBOX & DEBUG STATE ─────────────────────────
  const [sandboxCode, setSandboxCode] = useState<string>("");
  const [executionRunning, setExecutionRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [debugCode, setDebugCode] = useState<string>("");
  const [debugResult, setDebugResult] = useState<{ isFixed: boolean; feedback: string } | null>(null);

  // ── 5. INDEPENDENT ASSESSMENT STATE ───────────────────────────
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [challengeCode, setChallengeCode] = useState<string>("");
  const [challengeRunning, setChallengeRunning] = useState<boolean>(false);
  const [challengeResult, setChallengeResult] = useState<any>(null);
  const [masteryAwarded, setMasteryAwarded] = useState<boolean>(false);
  const [fastTrackModalOpen, setFastTrackModalOpen] = useState<boolean>(false);

  // Load subject & subtopic data
  useEffect(() => {
    async function loadSubjectData() {
      setLoading(true);
      try {
        const subSlug = initialSubtopicSlug || searchParams.get("subtopic") || "";
        const url = `/api/skills/curriculum?subject=${selectedSubjectSlug}${subSlug ? `&subtopic=${subSlug}` : ""}&candidateId=${candidateId}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          setCurrentSubject(data.subject);
          setMentorPersona(data.mentorPersona);
          setMasterySummary(data.masterySummary);

          if (data.subtopic) {
            setCurrentSubtopic(data.subtopic);
            setSlotInput(data.subtopic.coBuildSlot.starterSnippet || "");
            setSandboxCode(data.subtopic.starterCodeOrQuery || "");
            setDebugCode(data.subtopic.debugFault.buggyCodeOrConfig || "");
            setChallengeCode(data.subtopic.independentChallenge.starterCode || "");
            setSlotFeedback(null);
            setDebugResult(null);
            setExecutionResult(null);
            setChallengeResult(null);
            setQuizSubmitted(false);
            setSelectedQuizAnswers({});
          }

          if (data.mastery) {
            setMasteryState(data.mastery.state);
            setMasteryScore(data.mastery.score);
            setMasteryAwarded(data.mastery.state === "demonstrated_mastery");
          }
        }

        // Also fetch subject list
        const subjRes = await fetch("/api/skills/curriculum");
        const subjData = await subjRes.json();
        if (subjData.success && subjData.subjects) {
          setAllSubjects(subjData.subjects);
        }
      } catch (err) {
        console.error("Failed to load curriculum workspace:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSubjectData();
  }, [selectedSubjectSlug, initialSubtopicSlug, candidateId]);

  // Handle switching subtopics
  const handleSelectSubtopic = (sub: CanonicalSubtopic) => {
    setCurrentSubtopic(sub);
    setSlotInput(sub.coBuildSlot.starterSnippet || "");
    setSandboxCode(sub.starterCodeOrQuery || "");
    setDebugCode(sub.debugFault.buggyCodeOrConfig || "");
    setChallengeCode(sub.independentChallenge.starterCode || "");
    setSlotFeedback(null);
    setDebugResult(null);
    setExecutionResult(null);
    setChallengeResult(null);
    setQuizSubmitted(false);
    setSelectedQuizAnswers({});
    setActiveStage(1);
    setIsPlayingAudio(false);

    // Update query params in URL
    router.replace(`/student/learn?subject=${selectedSubjectSlug}&subtopic=${sub.slug}`);
  };

  // Toggle chapter accordion
  const toggleChapter = (chapterSlug: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [chapterSlug]: !prev[chapterSlug] }));
  };

  // Copy deep link
  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // ── CO-BUILD VALIDATION ───────────────────────────────────────
  const handleValidateCoBuild = () => {
    if (!currentSubtopic) return;
    const pattern = new RegExp(currentSubtopic.coBuildSlot.expectedPattern, "is");
    const valid = pattern.test(slotInput.trim());

    if (valid) {
      setSlotFeedback({
        isValid: true,
        message: `Excellent! ${currentSubtopic.coBuildSlot.validationExplanation}`
      });
    } else {
      setSlotFeedback({
        isValid: false,
        message: `The implementation doesn't yet match the required pattern. Hint: ${currentSubtopic.coBuildSlot.hint2}`
      });
    }
  };

  // ── MENTOR CHAT ───────────────────────────────────────────────
  const handleAskMentor = async (questionText?: string, levelOverride?: 1 | 2 | 3 | 4) => {
    if (!currentSubtopic) return;
    const q = questionText || mentorInputMsg;
    if (!q && !levelOverride) return;

    setMentorLoading(true);
    const newChat = [...mentorChatHistory];
    if (q) newChat.push({ role: "user", content: q });

    try {
      const res = await fetch("/api/skills/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mentor_chat",
          subjectSlug: selectedSubjectSlug,
          subtopicSlug: currentSubtopic.slug,
          studentCodeOrQuery: sandboxCode,
          lastExecutionResult: executionResult,
          currentHintLevel: levelOverride || hintLevel,
          userQuestion: q
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        newChat.push({ role: "assistant", content: data.reply.replyMarkdown });
        setMentorChatHistory(newChat);
        setMentorInputMsg("");
      }
    } catch (err) {
      console.error("Mentor chat error:", err);
    } finally {
      setMentorLoading(false);
    }
  };

  // ── RUN CODE IN SANDBOX ───────────────────────────────────────
  const handleRunSandbox = async () => {
    if (!currentSubtopic) return;
    setExecutionRunning(true);
    setExecutionResult(null);

    try {
      const res = await fetch("/api/skills/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_code",
          environment: currentSubtopic.executionEnvironment,
          codeOrQuery: sandboxCode,
          datasetId: "ecommerce_analytics"
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setExecutionResult(data.result);
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        stderr: err?.message || "Sandbox execution failed."
      });
    } finally {
      setExecutionRunning(false);
    }
  };

  // ── VERIFY DEBUG FIX ──────────────────────────────────────────
  const handleVerifyDebugFix = () => {
    if (!currentSubtopic) return;
    const correctClean = currentSubtopic.debugFault.correctCodeOrConfig.trim().replace(/\s+/g, " ");
    const studentClean = debugCode.trim().replace(/\s+/g, " ");

    if (studentClean === correctClean || studentClean.includes(currentSubtopic.debugFault.explanation)) {
      setDebugResult({
        isFixed: true,
        feedback: `Verified! Injected bug eliminated: ${currentSubtopic.debugFault.explanation}`
      });
    } else {
      setDebugResult({
        isFixed: false,
        feedback: `Fault remains active. Diagnostic Hint: ${currentSubtopic.debugFault.diagnosticHint}`
      });
    }
  };

  // ── RUN INDEPENDENT CHALLENGE TESTS ───────────────────────────
  const handleRunChallengeTests = async () => {
    if (!currentSubtopic) return;
    setChallengeRunning(true);
    setChallengeResult(null);

    try {
      const res = await fetch("/api/skills/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_code",
          environment: currentSubtopic.executionEnvironment,
          codeOrQuery: challengeCode,
          testCases: currentSubtopic.independentChallenge.testCases
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setChallengeResult(data.result);
      }
    } catch (err: any) {
      setChallengeResult({ success: false, stderr: err?.message });
    } finally {
      setChallengeRunning(false);
    }
  };

  // ── SUBMIT FOR DEMONSTRATED MASTERY ───────────────────────────
  const handleSubmitMastery = async () => {
    if (!currentSubtopic || !challengeResult) return;

    try {
      const res = await fetch("/api/skills/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_attempt",
          candidateId,
          subjectSlug: selectedSubjectSlug,
          subtopicSlug: currentSubtopic.slug,
          score: challengeResult.score || 100,
          allTestsPassed: challengeResult.allTestsPassed !== false,
          assisted: hintLevel === 4
        })
      });
      const data = await res.json();
      if (data.success && data.mastery) {
        setMasteryState(data.mastery.state);
        setMasteryScore(data.mastery.score);
        if (data.mastery.state === "demonstrated_mastery") {
          setMasteryAwarded(true);
        }
      }
    } catch (err) {
      console.error("Mastery submission error:", err);
    }
  };

  // Filtered subtopics in sidebar
  const filteredChapters = useMemo(() => {
    if (!currentSubject) return [];
    if (!searchQuery.trim()) return currentSubject.chapters;

    const q = searchQuery.toLowerCase().trim();
    return currentSubject.chapters
      .map((ch) => ({
        ...ch,
        topics: ch.topics
          .map((t) => ({
            ...t,
            subtopics: t.subtopics.filter(
              (s) =>
                s.title.toLowerCase().includes(q) ||
                s.learningGoal.toLowerCase().includes(q)
            )
          }))
          .filter((t) => t.subtopics.length > 0)
      }))
      .filter((ch) => ch.topics.length > 0);
  }, [currentSubject, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F5F1] flex items-center justify-center p-8 text-[#667085]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#356AE6] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading Unified Learning Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#162A43] flex flex-col font-sans">
      {/* ── TOP HEADER / BREADCRUMBS & SUBJECT SWITCHER ────────── */}
      <header className="border-b border-[#E4E1DA] bg-white px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-14 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/student/skills"
            className="text-xs font-semibold uppercase tracking-wider text-[#356AE6] hover:underline flex items-center gap-1"
          >
            ← Skill Hub
          </Link>
          <span className="text-[#98A2B3]">/</span>

          {/* Subject Switcher Dropdown */}
          <div className="relative inline-block">
            <select
              value={selectedSubjectSlug}
              onChange={(e) => setSelectedSubjectSlug(e.target.value as CanonicalSubjectSlug)}
              className="appearance-none bg-[#F6F5F1] border border-[#E4E1DA] rounded-lg px-3 py-1.5 pr-8 text-xs font-bold text-[#162A43] cursor-pointer hover:border-[#356AE6] transition-colors"
            >
              {allSubjects.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#667085] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="text-[#98A2B3]">/</span>
          <span className="text-xs font-medium text-[#667085] truncate max-w-[200px]">
            {currentSubtopic?.title}
          </span>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Fast-Track Exemption Button */}
          <button
            onClick={() => setFastTrackModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Experienced? Fast-Track Diagnostic
          </button>

          {/* Deep link copy button */}
          <button
            onClick={copyShareLink}
            className="p-1.5 rounded-lg border border-[#E4E1DA] hover:bg-[#F6F5F1] text-[#667085] transition-colors"
            title="Copy Deep Link to this Lesson"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#2E7D5B]" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Audio Narration Toggle */}
          <button
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isPlayingAudio
                ? "bg-[#356AE6] text-white"
                : "border border-[#E4E1DA] text-[#667085] hover:bg-[#F6F5F1]"
            }`}
          >
            {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlayingAudio ? "Pause Narration" : "Listen (AI Voice)"}
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE: SIDEBAR + CONTENT ─────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT SIDEBAR: FOCUSED SUBJECT HIERARCHY ───────────── */}
        <aside className="w-80 border-r border-[#E4E1DA] bg-white flex flex-col flex-shrink-0 h-[calc(100vh-112px)] overflow-y-auto">
          {/* Subject Summary Card */}
          <div className="p-4 border-b border-[#E4E1DA] bg-[#FAFAF8]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl">{currentSubject?.icon}</span>
              <div>
                <h2 className="text-sm font-bold text-[#162A43] leading-tight">
                  {currentSubject?.name}
                </h2>
                <p className="text-[11px] text-[#667085]">
                  {currentSubject?.tagline}
                </p>
              </div>
            </div>

            {/* Subject Mastery Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] font-semibold mb-1 text-[#667085]">
                <span>Progress: {masterySummary?.completionPercentage || 0}%</span>
                <span>{masterySummary?.masteredCount || 0} / {masterySummary?.totalSubtopics || 0} Mastered</span>
              </div>
              <div className="h-1.5 w-full bg-[#E4E1DA] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#356AE6] rounded-full transition-all duration-300"
                  style={{ width: `${masterySummary?.completionPercentage || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-[#E4E1DA]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
              <input
                type="text"
                placeholder="Search topics, concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F6F5F1] border border-[#E4E1DA] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#162A43] placeholder-[#98A2B3] focus:outline-none focus:border-[#356AE6]"
              />
            </div>
          </div>

          {/* Chapters & Topics Accordion */}
          <div className="flex-1 p-2 space-y-2">
            {filteredChapters.map((chapter) => {
              const isCollapsed = collapsedChapters[chapter.slug];
              return (
                <div key={chapter.slug} className="rounded-lg border border-[#E4E1DA] overflow-hidden">
                  <button
                    onClick={() => toggleChapter(chapter.slug)}
                    className="w-full px-3 py-2 bg-[#FAFAF8] flex items-center justify-between text-left hover:bg-[#F6F5F1] transition-colors"
                  >
                    <span className="text-xs font-bold text-[#162A43]">
                      {chapter.title}
                    </span>
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#98A2B3]" />}
                  </button>

                  {!isCollapsed && (
                    <div className="p-1 space-y-0.5 bg-white">
                      {chapter.topics.map((topic) => (
                        <div key={topic.slug} className="mb-1">
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                            {topic.title}
                          </div>
                          {topic.subtopics.map((sub) => {
                            const isSelected = currentSubtopic?.slug === sub.slug;
                            return (
                              <button
                                key={sub.slug}
                                onClick={() => handleSelectSubtopic(sub)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "bg-[#EFF4FE] text-[#356AE6] font-semibold border-l-2 border-[#356AE6]"
                                    : "text-[#667085] hover:bg-[#F6F5F1]"
                                }`}
                              >
                                <span className="truncate pr-2">{sub.title}</span>
                                {isSelected ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#356AE6] flex-shrink-0" />
                                ) : (
                                  <span className="text-[10px] text-[#98A2B3] flex-shrink-0">
                                    {sub.estimatedMinutes}m
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── RIGHT MAIN STAGE: THE 5-STEP COHERENT JOURNEY ────── */}
        <main className="flex-1 flex flex-col h-[calc(100vh-112px)] overflow-y-auto">
          {currentSubtopic ? (
            <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
              {/* Header Title & Mastery Pill */}
              <div className="border-b border-[#E4E1DA] pb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D5B] border border-[#C8E4D3]">
                      {currentSubtopic.difficulty.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#667085] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {currentSubtopic.estimatedMinutes} mins
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-[#162A43]">
                    {currentSubtopic.title}
                  </h1>
                </div>

                {/* Mastery Badge */}
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
                    masteryAwarded
                      ? "bg-[#EAF4EE] border-[#C8E4D3] text-[#2E7D5B]"
                      : "bg-white border-[#E4E1DA] text-[#667085]"
                  }`}>
                    {masteryAwarded ? <Award className="w-4 h-4 text-[#2E7D5B]" /> : <Clock className="w-4 h-4" />}
                    {masteryAwarded ? "Demonstrated Mastery (Recorded in DNA)" : `Status: ${masteryState.replace("_", " ").toUpperCase()}`}
                  </div>
                </div>
              </div>

              {/* ── 5-STEP JOURNEY PROGRESS TABS ─────────────────── */}
              <nav className="flex items-center gap-1 bg-[#F0EFEA] p-1 rounded-lg border border-[#E4E1DA]">
                {[
                  { num: 1, label: "1. Understand Concept" },
                  { num: 2, label: "2. Watch Demonstration" },
                  { num: 3, label: "3. Co-Build with Mentor" },
                  { num: 4, label: "4. Execute & Debug" },
                  { num: 5, label: "5. Independent Challenge" }
                ].map((stg) => (
                  <button
                    key={stg.num}
                    onClick={() => setActiveStage(stg.num)}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                      activeStage === stg.num
                        ? "bg-white text-[#356AE6] shadow-sm border border-[#E4E1DA]"
                        : "text-[#667085] hover:text-[#162A43]"
                    }`}
                  >
                    {stg.label}
                  </button>
                ))}
              </nav>

              {/* ── STAGE 1: UNDERSTAND (CONCEPT & INTUITION) ────── */}
              {activeStage === 1 && (
                <div className="space-y-6">
                  {/* Learning Goal */}
                  <div className="p-4 rounded-xl border border-[#D2E0FB] bg-[#EFF4FE]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#356AE6] mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Core Learning Goal
                    </h3>
                    <p className="text-sm font-medium text-[#162A43]">
                      {currentSubtopic.learningGoal}
                    </p>
                  </div>

                  {/* Relatable Story & Analogy */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl border border-[#EAECF0] dark:border-[#21262D] bg-white dark:bg-[#161B22]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2">
                        📖 The Intuitive Story
                      </h4>
                      <p className="text-sm text-[#344054] dark:text-[#C9D1D9] leading-relaxed">
                        {currentSubtopic.intuitiveStory}
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-[#EAECF0] dark:border-[#21262D] bg-white dark:bg-[#161B22]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2">
                        💡 Mental Analogy
                      </h4>
                      <p className="text-sm text-[#344054] dark:text-[#C9D1D9] leading-relaxed">
                        {currentSubtopic.analogy}
                      </p>
                    </div>
                  </div>

                  {/* Formal Concept & Mathematical Formula */}
                  <div className="p-6 rounded-xl border border-[#EAECF0] dark:border-[#21262D] bg-white dark:bg-[#161B22] space-y-4">
                    <h3 className="text-sm font-bold text-[#1D2939] dark:text-white">
                      Technical Concept & Mathematical Formulation
                    </h3>
                    <p className="text-sm text-[#344054] dark:text-[#C9D1D9] leading-relaxed">
                      {currentSubtopic.formalConcept}
                    </p>

                    {currentSubtopic.mathFormula && (
                      <div className="p-4 rounded-lg bg-[#F8F9FA] dark:bg-[#0D1117] border border-[#EAECF0] dark:border-[#30363D] text-center font-mono text-sm">
                        $${currentSubtopic.mathFormula}$$
                      </div>
                    )}

                    {/* Production Significance Alert */}
                    <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <strong className="font-bold">Production Significance:</strong> {currentSubtopic.productionSignificance}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setActiveStage(2)}
                      className="px-5 py-2.5 rounded-lg bg-[#356AE6] text-white text-xs font-bold hover:bg-[#2858C7] transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      Next: Watch Demonstration →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STAGE 2: DEMONSTRATE (VISUAL & STEPS) ─────────── */}
              {activeStage === 2 && (
                <div className="space-y-6">
                  {/* Mermaid / Visual Diagram */}
                  <div className="p-6 rounded-xl border border-[#E4E1DA] bg-white">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-3">
                      Visual Architecture &amp; State Flow
                    </h3>
                    <div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#E4E1DA]">
                      <MarkdownRenderer content={`\`\`\`mermaid\n${currentSubtopic.mermaidDiagram}\n\`\`\``} />
                    </div>
                  </div>

                  {/* Step-by-Step Teacher Build Cards */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#162A43]">
                      Step-by-Step Teacher Build
                    </h3>
                    {currentSubtopic.demonstrationSteps.map((step) => (
                      <div key={step.stepNumber} className="p-5 rounded-xl border border-[#E4E1DA] bg-white space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#EFF4FE] text-[#356AE6] text-xs font-bold flex items-center justify-center border border-[#D2E0FB]">
                            {step.stepNumber}
                          </span>
                          <h4 className="text-sm font-bold text-[#162A43]">
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-xs text-[#667085]">
                          {step.explanation}
                        </p>
                        <pre className="p-3 rounded-lg bg-[#0D1117] text-[#C9D1D9] text-xs font-mono overflow-x-auto">
                          <code>{step.codeOrQuery}</code>
                        </pre>
                        <div className="text-[11px] font-mono text-[#2E7D5B] bg-[#EAF4EE] border border-[#C8E4D3] p-2 rounded">
                          Expected Result: {step.outputSummary}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setActiveStage(1)}
                      className="px-4 py-2 rounded-lg border border-[#E4E1DA] text-xs font-semibold hover:bg-[#F6F5F1] text-[#667085]"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setActiveStage(3)}
                      className="px-5 py-2.5 rounded-lg bg-[#356AE6] text-white text-xs font-bold hover:bg-[#2858C7] transition-colors shadow-sm"
                    >
                      Next: Co-Build with Mentor →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STAGE 3: PRACTISE (AI MENTOR CO-BUILD) ───────── */}
              {activeStage === 3 && (
                <div className="space-y-6">
                  {/* Dedicated Mentor Header */}
                  <div className="p-4 rounded-xl border border-[#D2E0FB] bg-[#EFF4FE] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{mentorPersona?.avatar || "🤖"}</span>
                      <div>
                        <h3 className="text-sm font-bold text-[#162A43]">
                          {mentorPersona?.mentorName} • {mentorPersona?.title}
                        </h3>
                        <p className="text-xs text-[#356AE6]">
                          {mentorPersona?.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Hint Level Selector */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => {
                            setHintLevel(lvl as any);
                            handleAskMentor(undefined, lvl as any);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                            hintLevel === lvl
                              ? "bg-[#356AE6] text-white"
                              : "bg-white border border-[#E4E1DA] text-[#667085] hover:bg-[#F6F5F1]"
                          }`}
                        >
                          Hint {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Co-Build Slot Challenge */}
                  <div className="p-6 rounded-xl border border-[#E4E1DA] bg-white space-y-4">
                    <h3 className="text-sm font-bold text-[#162A43]">
                      Co-Build Challenge: Fill in the Implementation
                    </h3>
                    <p className="text-xs text-[#667085]">
                      {currentSubtopic.coBuildSlot.instruction}
                    </p>

                    <textarea
                      value={slotInput}
                      onChange={(e) => setSlotInput(e.target.value)}
                      rows={5}
                      className="w-full font-mono text-xs p-3 rounded-lg border border-[#E4E1DA] bg-[#F8F9FA] text-[#162A43] focus:outline-none focus:border-[#356AE6]"
                    />

                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleValidateCoBuild}
                        className="px-4 py-2 rounded-lg bg-[#356AE6] text-white text-xs font-bold hover:bg-[#2858C7] transition-colors shadow-sm"
                      >
                        Verify Implementation Pattern
                      </button>

                      {slotFeedback && (
                        <div className={`text-xs font-semibold ${slotFeedback.isValid ? "text-[#2E7D5B]" : "text-amber-600"}`}>
                          {slotFeedback.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mentor Dialogue Feed */}
                  {mentorChatHistory.length > 0 && (
                    <div className="p-5 rounded-xl border border-[#E4E1DA] bg-white space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                        Socratic Guidance from {mentorPersona?.mentorName}
                      </h4>
                      <div className="space-y-3">
                        {mentorChatHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg text-xs ${
                              msg.role === "user"
                                ? "bg-[#F6F5F1] text-[#162A43] ml-8 border border-[#E4E1DA]"
                                : "bg-[#EFF4FE] text-[#162A43] border border-[#D2E0FB] mr-8"
                            }`}
                          >
                            <MarkdownRenderer content={msg.content} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button
                      onClick={() => setActiveStage(2)}
                      className="px-4 py-2 rounded-lg border border-[#E4E1DA] text-xs font-semibold hover:bg-[#F6F5F1] text-[#667085]"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setActiveStage(4)}
                      className="px-5 py-2.5 rounded-lg bg-[#356AE6] text-white text-xs font-bold hover:bg-[#2858C7] transition-colors shadow-sm"
                    >
                      Next: Execute &amp; Debug in Sandbox →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STAGE 4: EXECUTE & DEBUG ──────────────────────── */}
              {activeStage === 4 && (
                <div className="space-y-6">
                  {/* Live Runtime Code Sandbox */}
                  <div className="p-6 rounded-xl border border-[#E4E1DA] bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#162A43] flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#356AE6]" />
                        Live Execution Sandbox ({currentSubtopic.executionEnvironment})
                      </h3>
                      <button
                        onClick={handleRunSandbox}
                        disabled={executionRunning}
                        className="px-4 py-2 rounded-lg bg-[#356AE6] text-white text-xs font-bold hover:bg-[#2858C7] transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                      >
                        {executionRunning ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        {executionRunning ? "Running..." : "Run Code"}
                      </button>
                    </div>

                    <textarea
                      value={sandboxCode}
                      onChange={(e) => setSandboxCode(e.target.value)}
                      rows={8}
                      className="w-full font-mono text-xs p-3 rounded-lg border border-[#E4E1DA] bg-[#0D1117] text-[#C9D1D9] focus:outline-none focus:border-[#356AE6]"
                    />

                    {/* Terminal Output */}
                    {executionResult && (
                      <div className="p-4 rounded-lg bg-[#0B0F17] border border-[#21262D] font-mono text-xs space-y-2">
                        <div className="flex justify-between text-[#8B949E] text-[11px] border-b border-[#21262D] pb-1">
                          <span>Output: {executionResult.success ? "SUCCESS" : "ERROR"}</span>
                          <span>Latency: {executionResult.executionTimeMs}ms</span>
                        </div>
                        {executionResult.stdout && (
                          <pre className="text-emerald-400 whitespace-pre-wrap">{executionResult.stdout}</pre>
                        )}
                        {executionResult.stderr && (
                          <pre className="text-rose-400 whitespace-pre-wrap">{executionResult.stderr}</pre>
                        )}
                        {executionResult.rows && (
                          <div className="overflow-x-auto mt-2">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="border-b border-[#30363D] text-[#8B949E]">
                                  {executionResult.columns?.map((c: string) => (
                                    <th key={c} className="p-1">{c}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {executionResult.rows.slice(0, 5).map((r: any, idx: number) => (
                                  <tr key={idx} className="border-b border-[#21262D]">
                                    {executionResult.columns?.map((c: string) => (
                                      <td key={c} className="p-1 text-[#C9D1D9]">{String(r[c])}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Injected Fault Debug Challenge */}
                  <div className="p-6 rounded-xl border border-rose-200 bg-rose-50/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                        <Bug className="w-4 h-4 text-rose-600" />
                        Injected Fault Debugging: {currentSubtopic.debugFault.title}
                      </h3>
                      <button
                        onClick={handleVerifyDebugFix}
                        className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                      >
                        Verify Bug Fix
                      </button>
                    </div>

                    <p className="text-xs text-rose-800">
                      Fix the injected bug below and eliminate the runtime failure:
                    </p>

                    <textarea
                      value={debugCode}
                      onChange={(e) => setDebugCode(e.target.value)}
                      rows={6}
                      className="w-full font-mono text-xs p-3 rounded-lg border border-rose-300 bg-[#0D1117] text-[#C9D1D9] focus:outline-none"
                    />

                    {debugResult && (
                      <div className={`p-3 rounded-lg text-xs font-semibold ${debugResult.isFixed ? "bg-[#EAF4EE] text-[#2E7D5B] border border-[#C8E4D3]" : "bg-rose-100 text-rose-800"}`}>
                        {debugResult.feedback}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setActiveStage(3)}
                      className="px-4 py-2 rounded-lg border border-[#E4E1DA] text-xs font-semibold hover:bg-[#F6F5F1] text-[#667085]"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setActiveStage(5)}
                      className="px-5 py-2.5 rounded-lg bg-[#356AE6] text-white text-xs font-bold hover:bg-[#2858C7] transition-colors shadow-sm"
                    >
                      Next: Independent Challenge &amp; Mastery →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STAGE 5: ASSESS & MASTER ──────────────────────── */}
              {activeStage === 5 && (
                <div className="space-y-6">
                  {/* Comprehension Quiz */}
                  <div className="p-6 rounded-xl border border-[#E4E1DA] bg-white space-y-5">
                    <h3 className="text-sm font-bold text-[#162A43] flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#356AE6]" />
                      Concept Comprehension Check
                    </h3>

                    {currentSubtopic.comprehensionChecks.map((q) => (
                      <div key={q.id} className="p-4 rounded-lg bg-[#F8F9FA] border border-[#E4E1DA] space-y-3">
                        <p className="text-xs font-semibold text-[#162A43]">
                          {q.question}
                        </p>
                        <div className="space-y-1.5">
                          {q.options.map((opt, oIdx) => (
                            <label
                              key={oIdx}
                              className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer border transition-colors ${
                                selectedQuizAnswers[q.id] === oIdx
                                  ? "border-[#356AE6] bg-[#EFF4FE] font-medium"
                                  : "border-transparent hover:bg-white"
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={selectedQuizAnswers[q.id] === oIdx}
                                onChange={() => setSelectedQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                                className="text-[#356AE6]"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                        {quizSubmitted && (
                          <div className={`text-xs p-2 rounded ${selectedQuizAnswers[q.id] === q.correctIndex ? "bg-[#EAF4EE] text-[#2E7D5B] border border-[#C8E4D3]" : "bg-rose-100 text-rose-800"}`}>
                            {selectedQuizAnswers[q.id] === q.correctIndex ? "Correct!" : "Incorrect."} {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => setQuizSubmitted(true)}
                      className="px-4 py-2 rounded-lg bg-[#F6F5F1] text-xs font-bold hover:bg-[#E4E1DA] text-[#162A43] border border-[#E4E1DA]"
                    >
                      Check Answers
                    </button>
                  </div>

                  {/* Independent Practical Challenge */}
                  <div className="p-6 rounded-xl border border-[#E4E1DA] bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#162A43] flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-[#356AE6]" />
                          Independent Challenge: {currentSubtopic.independentChallenge.title}
                        </h3>
                        <p className="text-xs text-[#667085] mt-0.5">
                          {currentSubtopic.independentChallenge.description}
                        </p>
                      </div>

                      <button
                        onClick={handleRunChallengeTests}
                        disabled={challengeRunning}
                        className="px-4 py-2 rounded-lg bg-[#356AE6] text-white text-xs font-bold hover:bg-[#2858C7] transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                      >
                        {challengeRunning ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        {challengeRunning ? "Running..." : "Test Solution"}
                      </button>
                    </div>

                    <textarea
                      value={challengeCode}
                      onChange={(e) => setChallengeCode(e.target.value)}
                      rows={8}
                      className="w-full font-mono text-xs p-3 rounded-lg border border-[#E4E1DA] bg-[#0D1117] text-[#C9D1D9] focus:outline-none"
                    />

                    {challengeResult && (
                      <div className="p-4 rounded-lg bg-[#0B0F17] border border-[#21262D] font-mono text-xs space-y-2">
                        <div className="flex justify-between text-[#8B949E] text-[11px] border-b border-[#21262D] pb-1">
                          <span>Test Pass Status: {challengeResult.allTestsPassed ? "100% PASSED" : "FAILED"}</span>
                          <span>Score: {challengeResult.score}/100</span>
                        </div>
                        {challengeResult.testResults?.map((t: any, idx: number) => (
                          <div key={idx} className={`text-xs ${t.passed ? "text-emerald-400" : "text-rose-400"}`}>
                            [{t.passed ? "PASS" : "FAIL"}] Input: {t.input} | Expected: {t.expected}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Submit for Demonstrated Mastery */}
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSubmitMastery}
                        className="px-6 py-2.5 rounded-lg bg-[#356AE6] hover:bg-[#2858C7] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                      >
                        <Award className="w-4 h-4" />
                        Submit for Demonstrated Mastery (Record to DNA)
                      </button>
                    </div>

                    {masteryAwarded && (
                      <div className="p-4 rounded-xl border border-[#C8E4D3] bg-[#EAF4EE] text-[#2E7D5B] text-xs font-semibold flex items-center gap-3">
                        <Award className="w-6 h-6 text-[#2E7D5B] flex-shrink-0" />
                        <div>
                          <strong>Congratulations! Demonstrated Mastery Achieved!</strong>
                          <p className="font-normal text-[11px] text-[#2E7D5B]">
                            Your verified unassisted solution has been synchronized with your Student DNA profile.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[#667085]">
              Select a subtopic from the sidebar to begin learning.
            </div>
          )}
        </main>
      </div>

      {/* ── FAST TRACK DIAGNOSTIC MODAL ──────────────────────────── */}
      {fastTrackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B22] border border-[#E4E7EC] dark:border-[#30363D] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-purple-700 dark:text-purple-300">
              <Zap className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#1D2939] dark:text-white">
                Fast-Track Diagnostic Assessment
              </h3>
            </div>
            <p className="text-xs text-[#475467] dark:text-[#8B949E] leading-relaxed">
              Already experienced in <strong>{currentSubject?.name}</strong>? Take a fast benchmark challenge to verify your skills. Scoring 85% or higher exempts you from foundational topics and awards Demonstrated Mastery directly in your Student DNA.
            </p>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
              Benchmark includes: Memory model, Vectorized broadcasting, and Relational query optimizations.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFastTrackModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#30363D] text-xs font-semibold hover:bg-[#F2F4F7]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (currentSubject) {
                    await fetch("/api/skills/curriculum", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "fast_track_diagnostic",
                        candidateId,
                        subjectSlug: currentSubject.slug,
                        chapterSlug: currentSubject.chapters[0].slug,
                        score: 95
                      })
                    });
                    setMasteryAwarded(true);
                    setFastTrackModalOpen(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
              >
                Start Fast-Track Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

