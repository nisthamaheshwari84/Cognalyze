"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CuratedCodingChallenge,
  getAllCuratedChallenges,
  getChallengesForTopic,
  getChallengeById,
  CodingDifficulty,
  CodingCategory,
  CodingTestCase,
} from "@/lib/skills/ai-data/curated-coding-library";
import {
  TAXONOMY_SUBJECTS,
  TaxonomySubject,
  TaxonomyTopic,
  getAllCurriculumTopicsFlat,
  getTaxonomyTopicById,
  getTopicLocation,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface GlobalCodingArenaProps {
  initialTopicId?: string;
  candidateId?: string;
  onNavigateToTopic?: (topicId: string) => void;
  onEvidenceRecorded?: (challenge: CuratedCodingChallenge, score: number) => void;
}

type TimerMode = "learning" | "practice" | "interview";

export default function GlobalCodingArena({
  initialTopicId,
  candidateId = "student-demo",
  onNavigateToTopic,
  onEvidenceRecorded,
}: GlobalCodingArenaProps) {
  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || "ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // All challenges
  const allChallenges = useMemo(() => getAllCuratedChallenges(), []);

  // Available topics for current subject selection
  const availableTopics = useMemo(() => {
    if (selectedSubjectId === "ALL") {
      return TAXONOMY_SUBJECTS.flatMap((s: TaxonomySubject) => s.modules.flatMap((m) => m.topics));
    }
    const subj = TAXONOMY_SUBJECTS.find((s: TaxonomySubject) => s.id === selectedSubjectId);
    return subj ? subj.modules.flatMap((m) => m.topics) : [];
  }, [selectedSubjectId]);

  // Sync initialTopicId if prop changes
  useEffect(() => {
    if (initialTopicId && initialTopicId !== "ALL") {
      setSelectedTopicId(initialTopicId);
      const loc = getTopicLocation(initialTopicId);
      if (loc) {
        setSelectedSubjectId(loc.subject.id);
      }
      const topicChallenges = getChallengesForTopic(initialTopicId);
      if (topicChallenges.length > 0) {
        setActiveChallengeId(topicChallenges[0].id);
      }
    } else {
      setSelectedSubjectId("ALL");
      setSelectedTopicId("ALL");
    }
  }, [initialTopicId]);

  // Filtered challenges list
  const filteredChallenges = useMemo(() => {
    return allChallenges.filter((c: CuratedCodingChallenge) => {
      const matchSubject = selectedSubjectId === "ALL" || c.subjectId === selectedSubjectId;
      const matchTopic = selectedTopicId === "ALL" || c.topicId === selectedTopicId;
      const matchDiff = selectedDifficulty === "ALL" || c.difficulty === selectedDifficulty;
      const matchCat = selectedCategory === "ALL" || c.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.problemStatement.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchTopic && matchDiff && matchCat && matchSearch;
    });
  }, [allChallenges, selectedSubjectId, selectedTopicId, selectedDifficulty, selectedCategory, searchQuery]);

  // Active Selected Challenge (Strictly from filteredChallenges if non-empty, else null)
  const [activeChallengeId, setActiveChallengeId] = useState<string>(allChallenges[0]?.id || "");

  const activeChallenge = useMemo(() => {
    if (filteredChallenges.length === 0) return null;
    const found = filteredChallenges.find((c) => c.id === activeChallengeId);
    return found || filteredChallenges[0];
  }, [activeChallengeId, filteredChallenges]);

  // Code editor state
  const [userCode, setUserCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"problem" | "hints" | "solution" | "history">("problem");

  // Timer mode & state
  const [timerMode, setTimerMode] = useState<TimerMode>("practice");
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>("");
  const [executionResult, setExecutionResult] = useState<{
    passed: boolean;
    passedTests: number;
    totalTests: number;
    testOutcomes: Array<{
      testId: string;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
      errorMessage?: string;
      isHidden?: boolean;
    }>;
    executionTimeMs: number;
    telemetry?: Record<string, any>;
  } | null>(null);

  // Submission history
  const [submissionHistory, setSubmissionHistory] = useState<
    Array<{
      timestamp: string;
      passed: boolean;
      passedTests: number;
      totalTests: number;
      codeSnippet: string;
      durationSeconds: number;
    }>
  >([]);

  // Update starter code when active challenge changes
  useEffect(() => {
    if (activeChallenge) {
      setUserCode(activeChallenge.starterCode);
      setExecutionResult(null);
      setTimerSeconds(0);
      setIsTimerRunning(timerMode !== "learning");
    }
  }, [activeChallenge, timerMode]);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Run or Submit Code
  const handleRunCode = async (isSubmission: boolean = false) => {
    if (!activeChallenge) return;
    setIsExecuting(true);

    try {
      // Execute challenge against sandboxed backend API
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_coding_challenge",
          challengeId: activeChallenge.id,
          userCode,
          candidateId,
          isSubmission,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.result) {
        throw new Error(data.error || "Sandbox execution failed");
      }
      const result = data.result;
      setExecutionResult(result);

      if (isSubmission) {
        const histItem = {
          timestamp: new Date().toLocaleTimeString(),
          passed: result.passed,
          passedTests: result.passedTests,
          totalTests: result.totalTests,
          codeSnippet: userCode.slice(0, 100),
          durationSeconds: timerSeconds,
        };
        setSubmissionHistory((prev) => [histItem, ...prev]);

        // If passed, record evidence
        if (result.passed && onEvidenceRecorded) {
          const score = Math.round((result.passedTests / result.totalTests) * 100);
          onEvidenceRecorded(activeChallenge, score);
        }
      }
    } catch (err: any) {
      const totalCount =
        (activeChallenge.sampleCases?.length || 0) +
        (activeChallenge.hiddenTestCases?.length || 0) || 1;
      setExecutionResult({
        passed: false,
        passedTests: 0,
        totalTests: totalCount,
        testOutcomes: [
          {
            testId: "err",
            input: "N/A",
            expectedOutput: "N/A",
            actualOutput: err.message || "Execution failed",
            passed: false,
            errorMessage: err.message,
          },
        ],
        executionTimeMs: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getDifficultyBadge = (diff: CodingDifficulty) => {
    switch (diff) {
      case "beginner":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Beginner</span>;
      case "intermediate":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Intermediate</span>;
      case "advanced":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Advanced</span>;
      case "placement":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Tier-1 Interview</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] bg-[#F6F5F1] text-stone-900 font-sans">
      {/* ── TOP ARENA TOOLBAR ── */}
      <div className="bg-white border-b border-[#E4E1DA] px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#356AE6]/10 text-[#356AE6] flex items-center justify-center font-bold text-sm">
            ⚡
          </div>
          <div>
            <h1 className="text-base font-bold text-[#162A43] tracking-tight">
              Cognalyze Coding Arena
            </h1>
            <p className="text-[11px] text-stone-500">
              570 Curated Challenges • Python 3 &amp; Relational SQL Sandboxes • Hidden Test Validation
            </p>
          </div>
        </div>

        {/* Timer Mode Selector & Timer Display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            {(["learning", "practice", "interview"] as TimerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setTimerMode(mode)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition ${
                  timerMode === mode ? "bg-white text-[#162A43] shadow-sm" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-[#162A43] flex items-center gap-1.5">
            <span>⏱</span>
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {activeChallenge && onNavigateToTopic && (
            <button
              onClick={() => onNavigateToTopic(activeChallenge.topicId)}
              className="px-3 py-1.5 rounded-xl border border-[#356AE6] text-[#356AE6] hover:bg-[#356AE6]/5 text-xs font-semibold transition"
            >
              Study This Topic →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN WORKSPACE: SPLIT PANE ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: Challenge Directory & Filters */}
        <div className="w-full lg:w-80 border-r border-[#E4E1DA] bg-white p-4 flex flex-col gap-3 shrink-0 overflow-y-auto max-h-[calc(100vh-180px)]">
          {/* Search Box */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 570 problems..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E1DA] focus:outline-none focus:border-[#356AE6] bg-stone-50"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Subject ({TAXONOMY_SUBJECTS.length})
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedTopicId("ALL");
              }}
              className="w-full p-2 text-xs rounded-lg border border-[#E4E1DA] bg-white text-stone-700"
            >
              <option value="ALL">All Subjects</option>
              {TAXONOMY_SUBJECTS.map((s: TaxonomySubject) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Topic ({availableTopics.length})
              </label>
              {selectedTopicId !== "ALL" && (
                <button
                  onClick={() => setSelectedTopicId("ALL")}
                  className="text-[10px] font-bold text-[#356AE6] hover:underline"
                >
                  Clear Topic
                </button>
              )}
            </div>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-[#E4E1DA] bg-white text-stone-700"
            >
              <option value="ALL">
                {selectedSubjectId === "ALL" ? "All Topics Across Arena" : "All Topics in this Subject"}
              </option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Difficulty
            </label>
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {["ALL", "beginner", "intermediate", "placement"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`py-1 rounded-md border text-center font-bold capitalize transition ${
                    selectedDifficulty === diff
                      ? "bg-[#162A43] text-white border-[#162A43]"
                      : "bg-white text-stone-600 border-[#E4E1DA] hover:border-stone-400"
                  }`}
                >
                  {diff === "ALL" ? "All" : diff.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>

          {/* Challenge Cards List */}
          <div className="pt-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Problems ({filteredChallenges.length})
              </div>
              {(selectedSubjectId !== "ALL" || selectedTopicId !== "ALL" || selectedDifficulty !== "ALL" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedSubjectId("ALL");
                    setSelectedTopicId("ALL");
                    setSelectedDifficulty("ALL");
                    setSelectedCategory("ALL");
                    setSearchQuery("");
                  }}
                  className="text-[10px] text-[#356AE6] font-semibold hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {filteredChallenges.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-dashed border-[#E4E1DA]">
                <p className="font-bold text-stone-700 mb-1">No questions match your filters</p>
                <p className="text-[11px] text-stone-400 mb-3">Adjust your subject, topic, or difficulty criteria.</p>
                <button
                  onClick={() => {
                    setSelectedSubjectId("ALL");
                    setSelectedTopicId("ALL");
                    setSelectedDifficulty("ALL");
                    setSelectedCategory("ALL");
                    setSearchQuery("");
                  }}
                  className="px-3 py-1.5 bg-[#162A43] text-white rounded-lg text-xs font-semibold hover:bg-black transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredChallenges.map((c: CuratedCodingChallenge) => {
                  const isSelected = activeChallenge?.id === c.id;
                  const isSolved = submissionHistory.some((s) => s.passed && activeChallenge?.id === c.id);
                  const topicTitle = getTaxonomyTopicById(c.topicId)?.title || c.topicId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveChallengeId(c.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                        isSelected
                          ? "border-[#356AE6] bg-[#356AE6]/5 ring-1 ring-[#356AE6]/30 shadow-sm"
                          : "border-[#E4E1DA] bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-[#162A43] truncate flex items-center gap-1.5">
                          {isSolved && <span className="text-emerald-500 font-bold">✔</span>}
                          {c.title}
                        </span>
                        {getDifficultyBadge(c.difficulty)}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate capitalize flex items-center justify-between">
                        <span className="truncate">{c.category.replace(/_/g, " ")} • {topicTitle}</span>
                        {c.targetCompanies?.[0] && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded shrink-0">
                            {c.targetCompanies[0]}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Problem Statement & Tabs */}
        {activeChallenge ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="w-full lg:w-1/2 border-r border-[#E4E1DA] bg-white p-6 overflow-y-auto max-h-[calc(100vh-180px)] flex flex-col">
              {/* Header */}
              <div className="pb-4 border-b border-[#E4E1DA] mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {getDifficultyBadge(activeChallenge.difficulty)}
                    <span className="text-[11px] font-semibold text-stone-500 capitalize">
                      {activeChallenge.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">ID: {activeChallenge.id}</span>
                </div>
                <h2 className="text-lg font-bold text-[#162A43]">{activeChallenge.title}</h2>
              </div>

              {/* Sub-tabs: Problem / Hints / Reference Solution / History */}
              <div className="flex items-center gap-1 pb-3 mb-4 border-b border-[#E4E1DA] text-xs">
                {(["problem", "hints", "solution", "history"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition ${
                      activeTab === tab
                        ? "bg-[#162A43] text-white"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab 1: Problem Statement */}
              {activeTab === "problem" && (
                <div className="space-y-4 text-xs leading-relaxed text-stone-700">
                  <MarkdownRenderer content={activeChallenge.problemStatement} />

                  {/* Input / Output Formats */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <div>
                      <span className="font-bold text-[#162A43] block mb-0.5">Input Format:</span>
                      <p className="text-stone-600">{activeChallenge.inputFormat}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#162A43] block mb-0.5">Output Format:</span>
                      <p className="text-stone-600">{activeChallenge.outputFormat}</p>
                    </div>
                  </div>

                  {/* Constraints */}
                  {activeChallenge.constraints && activeChallenge.constraints.length > 0 && (
                    <div>
                      <span className="font-bold text-[#162A43] block mb-1">Constraints:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                        {activeChallenge.constraints.map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Examples */}
                  {activeChallenge.sampleCases && activeChallenge.sampleCases.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="font-bold text-[#162A43] block">Sample Cases:</span>
                      {activeChallenge.sampleCases.map((ex: CodingTestCase, i: number) => (
                        <div key={i} className="p-3 bg-stone-50 rounded-xl border border-stone-200 font-mono text-[11px]">
                          <div><span className="text-stone-500 font-bold">Input: </span>{ex.input}</div>
                          <div><span className="text-stone-500 font-bold">Expected Output: </span>{ex.expectedOutput}</div>
                          {ex.explanation && (
                            <div className="text-stone-500 font-sans mt-1 text-[11px]">
                              <span className="font-bold">Explanation: </span>{ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Target Companies */}
                  {activeChallenge.targetCompanies && activeChallenge.targetCompanies.length > 0 && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
                      <span className="font-bold">Target Hiring Companies: </span>
                      {activeChallenge.targetCompanies.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Hints */}
              {activeTab === "hints" && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-[#162A43]">Problem Solving Hints</h4>
                  {activeChallenge.hints && activeChallenge.hints.length > 0 ? (
                    activeChallenge.hints.map((h: string, i: number) => (
                      <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                        <span className="font-bold mr-1">Hint {i + 1}:</span> {h}
                      </div>
                    ))
                  ) : (
                    <p className="text-stone-500">Think about boundary cases and optimal Big-O bounds.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Reference Solution */}
              {activeTab === "solution" && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-[#162A43]">Verified Reference Solution</h4>
                  <pre className="p-4 bg-stone-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto">
                    {activeChallenge.referenceSolution}
                  </pre>
                  {activeChallenge.bugRootCauseExplanation && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px]">
                      <span className="font-bold">Debugging Injected Bug: </span>
                      {activeChallenge.bugRootCauseExplanation}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: History */}
              {activeTab === "history" && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-[#162A43]">Past Submissions ({submissionHistory.length})</h4>
                  {submissionHistory.length === 0 ? (
                    <p className="text-stone-500">No submissions yet for this session.</p>
                  ) : (
                    submissionHistory.map((s, idx) => (
                      <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className={`font-bold ${s.passed ? "text-emerald-700" : "text-rose-700"}`}>
                            {s.passed ? "PASSED" : "FAILED"}
                          </span>
                          <span className="text-stone-500 ml-2">
                            ({s.passedTests}/{s.totalTests} tests)
                          </span>
                        </div>
                        <div className="text-stone-400 text-[10px]">
                          {s.timestamp} • {s.durationSeconds}s
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Code Editor & Execution Runner */}
            <div className="w-full lg:w-1/2 bg-stone-900 flex flex-col max-h-[calc(100vh-180px)] overflow-hidden">
              {/* Editor Header Bar */}
              <div className="bg-stone-800 px-4 py-2 flex items-center justify-between border-b border-stone-700 text-xs text-stone-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-mono font-bold text-white">solution.py</span>
                  <span className="text-stone-400">(/usr/bin/python3 sandbox)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserCode(activeChallenge.starterCode)}
                    className="px-2 py-1 rounded text-[11px] text-stone-400 hover:text-white hover:bg-stone-700"
                  >
                    Reset Starter Code
                  </button>
                </div>
              </div>

              {/* Code Editor Textarea */}
              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full p-4 bg-stone-900 text-stone-100 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                rows={16}
              />

              {/* Run / Submit Actions Bar */}
              <div className="bg-stone-800 px-4 py-3 flex items-center justify-between border-t border-stone-700">
                <div className="text-[11px] text-stone-400">
                  {(activeChallenge.sampleCases?.length || 0) + (activeChallenge.hiddenTestCases?.length || 0)} Test Cases (including hidden edge cases)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunCode(false)}
                    disabled={isExecuting}
                    className="px-4 py-1.5 rounded-xl border border-stone-600 text-stone-200 hover:bg-stone-700 text-xs font-semibold transition disabled:opacity-50"
                  >
                    {isExecuting ? "Executing..." : "Run Public Tests"}
                  </button>
                  <button
                    onClick={() => handleRunCode(true)}
                    disabled={isExecuting}
                    className="px-5 py-1.5 rounded-xl bg-[#356AE6] hover:bg-[#2855C7] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    Submit Solution →
                  </button>
                </div>
              </div>

              {/* Execution Results Drawer */}
              {executionResult && (
                <div className="bg-stone-950 border-t border-stone-800 p-4 max-h-48 overflow-y-auto font-mono text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${executionResult.passed ? "text-emerald-400" : "text-rose-400"}`}>
                        {executionResult.passed ? "✔ ALL TESTS PASSED" : "✖ FAILED SOME TEST CASES"}
                      </span>
                      <span className="text-stone-400 text-[11px]">
                        ({executionResult.passedTests}/{executionResult.totalTests} passed in {executionResult.executionTimeMs}ms)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {executionResult.testOutcomes.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg text-[11px] ${
                          t.passed ? "bg-emerald-950/40 text-emerald-300" : "bg-rose-950/40 text-rose-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Test #{idx + 1} {t.isHidden ? "(Hidden)" : ""}</span>
                          <span>{t.passed ? "PASSED" : "FAILED"}</span>
                        </div>
                        {!t.isHidden && (
                          <div className="mt-1 text-[10px] text-stone-400">
                            <div>Input: {t.input}</div>
                            <div>Expected: {t.expectedOutput}</div>
                            <div>Actual: {t.actualOutput}</div>
                          </div>
                        )}
                        {t.errorMessage && (
                          <div className="mt-1 text-rose-400 text-[10px]">Error: {t.errorMessage}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#F6F5F1]">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-base font-bold text-[#162A43] mb-1">No Problem Selected</h3>
            <p className="text-xs text-stone-500 max-w-sm mb-4">
              There are no coding challenges matching your current search or filter criteria. Reset your filters to browse available problems.
            </p>
            <button
              onClick={() => {
                setSelectedSubjectId("ALL");
                setSelectedTopicId("ALL");
                setSelectedDifficulty("ALL");
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#356AE6] hover:bg-[#2855C7] text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              Reset Filters & Show All 570 Problems
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
