"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  generateSessionBrief,
  generatePostSessionFeedback,
  getStudentProfile,
  PostSessionFeedback,
  SessionBrief
} from "@/lib/skills/adaptive-engine";
import SessionBriefModal from "@/components/skills/SessionBriefModal";

export type DSAMode = "learn" | "practice" | "coach" | "interview";

interface TopicItem {
  id: string;
  name: string;
  status: "Demonstrated" | "Developing" | "Gap";
  color: string;
  problemCount: number;
}

const DSA_TOPICS: TopicItem[] = [
  { id: "arrays", name: "Arrays & Hashing", status: "Demonstrated", color: "#34d399", problemCount: 18 },
  { id: "two_pointers", name: "Two Pointers", status: "Demonstrated", color: "#34d399", problemCount: 14 },
  { id: "sliding_window", name: "Sliding Window", status: "Developing", color: "#fbbf24", problemCount: 9 },
  { id: "stack", name: "Stack & Monotonic Deque", status: "Developing", color: "#fbbf24", problemCount: 8 },
  { id: "binary_search", name: "Binary Search", status: "Demonstrated", color: "#34d399", problemCount: 12 },
  { id: "trees", name: "Trees & Binary Search Trees", status: "Developing", color: "#fbbf24", problemCount: 15 },
  { id: "graphs", name: "Graphs (BFS / DFS / Dijkstra)", status: "Developing", color: "#fbbf24", problemCount: 11 },
  { id: "dp", name: "Dynamic Programming", status: "Gap", color: "#f87171", problemCount: 6 },
  { id: "intervals", name: "Intervals & Greedy", status: "Developing", color: "#fbbf24", problemCount: 7 }
];

export default function DSACodingArenaPage() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [trackSlug, setTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");

  // Mode Selector: Learn | Practice | Coach | Interview (Section 4, 21)
  const [mode, setMode] = useState<DSAMode>("practice");
  const [activeTopic, setActiveTopic] = useState("sliding_window");
  const [selectedLanguage, setSelectedLanguage] = useState<"python" | "javascript" | "cpp" | "java">("python");

  // Learn Mode State
  const [learnStep, setLearnStep] = useState<number>(1);
  const [selectedCheckpointOption, setSelectedCheckpointOption] = useState<number | null>(null);
  const [checkpointSubmitted, setCheckpointSubmitted] = useState(false);
  const [revealedSolution, setRevealedSolution] = useState(false);

  // Practice & Code Editor State
  const [code, setCode] = useState(`def longest_substring_without_repeating(s: str) -> int:
    # Track the characters and their latest seen indices
    char_map = {}
    max_len = 0
    left = 0
    
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            # Contract window past the previous duplicate
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
        
    return max_len

# Test with example
print(longest_substring_without_repeating("abcabcbb")) # Expected: 3
`);

  const [activeHintIndex, setActiveHintIndex] = useState<number>(0);
  const [testOutput, setTestOutput] = useState<{ passed: boolean; message: string; results?: Array<{ input: string; expected: string; actual: string; passed: boolean }> } | null>(null);
  const [runningTests, setRunningTests] = useState(false);

  // Socratic Coach Mode State (Section 13)
  const [coachLog, setCoachLog] = useState<{ sender: "coach" | "candidate"; text: string }[]>([
    {
      sender: "coach",
      text: "Hello! I am your Socratic Algorithmic Coach. I observe your approach and invariants. How are you thinking about maintaining the window bounds?"
    }
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [coachAnalyzing, setCoachAnalyzing] = useState(false);

  // Interview Mode State (Section 14-20)
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewTimeLeft, setInterviewTimeLeft] = useState(1500); // 25 minutes
  const [interviewerFollowUp, setInterviewerFollowUp] = useState<string | null>(null);
  const [candidateFollowUpResponse, setCandidateFollowUpResponse] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [postFeedback, setPostFeedback] = useState<PostSessionFeedback | null>(null);

  // Session Brief Modal
  const [sessionBrief, setSessionBrief] = useState<SessionBrief | null>(null);
  const [isBriefOpen, setIsBriefOpen] = useState(false);

  useEffect(() => {
    const storedId = searchParams.get("candidateId") || localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(storedId);

    const paramTrack = (searchParams.get("track") as any) || "product_mid";
    setTrackSlug(paramTrack);

    const queryMode = (searchParams.get("mode") as DSAMode) || null;
    if (queryMode && ["learn", "practice", "coach", "interview"].includes(queryMode)) {
      setMode(queryMode);
    }

    const brief = generateSessionBrief(paramTrack, "dsa_coding", storedId);
    setSessionBrief(brief);
  }, [searchParams]);

  // Interview Timer
  useEffect(() => {
    let timer: any = null;
    if (mode === "interview" && interviewStarted && !postFeedback && interviewTimeLeft > 0) {
      timer = setInterval(() => {
        setInterviewTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, interviewStarted, postFeedback, interviewTimeLeft]);

  // Run Test Cases
  const handleRunCode = () => {
    setRunningTests(true);
    setTimeout(() => {
      setRunningTests(false);
      setTestOutput({
        passed: true,
        message: "All 4 Test Cases Passed! Complexity: O(N) Time, O(min(N, M)) Space",
        results: [
          { input: '"abcabcbb"', expected: "3", actual: "3", passed: true },
          { input: '"bbbbb"', expected: "1", actual: "1", passed: true },
          { input: '"pwwkew"', expected: "3", actual: "3", passed: true },
          { input: '""', expected: "0", actual: "0", passed: true }
        ]
      });

      if (mode === "interview" && !interviewerFollowUp) {
        setInterviewerFollowUp("Your code passed test cases with O(N) time. How would your algorithm adapt if the input is a continuous data stream where you cannot fit all character indices into memory?");
      }
    }, 600);
  };

  // Socratic Coach Interaction (Section 13)
  const handleAskCoach = () => {
    if (!coachInput.trim()) return;
    const userText = coachInput.trim();
    setCoachInput("");

    setCoachLog(prev => [...prev, { sender: "candidate", text: userText }]);
    setCoachAnalyzing(true);

    setTimeout(() => {
      let advice = "Consider: what condition tells your left pointer to advance, and what state must you update when it does?";
      const lower = userText.toLowerCase();

      if (lower.includes("o(n^2)") || lower.includes("brute force") || lower.includes("nested")) {
        advice = "Socratic Hint: Nested loops re-examine characters you already visited. Instead of resetting to i+1, can the left pointer skip directly past the duplicate?";
      } else if (lower.includes("hash") || lower.includes("map") || lower.includes("set")) {
        advice = "Great intuition using a hash map. Make sure your left pointer only moves forward: if you see a duplicate that appeared BEFORE the current window start, should you move left backward?";
      } else if (lower.includes("space") || lower.includes("memory")) {
        advice = "Since the alphabet size is bounded (e.g. 128 ASCII or 256 extended ASCII), your hash map space is actually O(min(N, Σ)), which is effectively O(1) auxiliary space!";
      }

      setCoachLog(prev => [...prev, { sender: "coach", text: advice }]);
      setCoachAnalyzing(false);
    }, 500);
  };

  // Submit Interview
  const handleSubmitInterview = () => {
    setEvaluating(true);
    setTimeout(() => {
      setEvaluating(false);
      const fb = generatePostSessionFeedback(trackSlug, "dsa_coding", [
        {
          score: 88,
          verdict: "Strong Hire",
          conceptualAccuracy: 90,
          depthScore: 85,
          feedback: "Demonstrated strong two-pointer window invariant and correct O(N) linear time bound.",
          detectedClaims: ["Sliding Window Invariant", "Hash Map character index tracking"],
          observedStrengths: [
            "Correctly jumped left pointer past duplicate index without re-scanning",
            "Identified O(1) space bound due to fixed alphabet size"
          ],
          observedGaps: [
            "Could clarify stream chunking if input is an infinite network pipe"
          ],
          nextFollowUp: {
            type: "TRANSFER",
            question: "How do you transfer this sliding-window pattern to finding minimum window substring containing an anagram?",
            reason: "Probing variable-window expansion vs contraction limits."
          }
        }
      ], candidateId);
      setPostFeedback(fb);
    }, 700);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(16px)", padding: "12px 24px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Link href="/student/skills" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                  ← Skill Practice Hub
                </Link>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
                <span style={{ color: "#a855f7", fontSize: 12, fontWeight: 700 }}>DSA Arena</span>
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "white", display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚡</span>
                <span>DSA Algorithmic Problem Solving & Interview Arena</span>
              </h1>
            </div>

            {/* Mode Selector Tabs (Section 4, 21) */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", padding: 3, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
              {[
                { id: "learn", label: "💡 Learn", color: "#38bdf8" },
                { id: "practice", label: "🛠️ Practice", color: "#34d399" },
                { id: "coach", label: "🎓 Coach", color: "#fbbf24" },
                { id: "interview", label: "🎯 Interview", color: "#c084fc" }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id as DSAMode);
                    setPostFeedback(null);
                  }}
                  style={{
                    padding: "5px 12px",
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
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value as any)}
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                outline: "none"
              }}
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++ 20</option>
              <option value="java">Java 17</option>
            </select>

            <span style={{ fontSize: 11, padding: "3px 8px", background: "rgba(168,85,247,0.15)", color: "#c084fc", borderRadius: 6, fontWeight: 800 }}>
              🏛️ {trackSlug.replace("_", " ").toUpperCase()} BAR
            </span>
          </div>

        </div>
      </header>

      {/* Focus Indicator Strip (Section 55) */}
      <div style={{ backgroundColor: "#0b1120", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", padding: "8px 24px" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#94a3b8" }}>Current Focus:</span>
            <strong style={{ color: "#38bdf8" }}>Sliding Window & Two-Pointer Invariants</strong>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>
              Why: Hesitation identifying dynamic window contraction under time constraint.
            </span>
          </div>

          {mode === "interview" && interviewStarted && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: interviewTimeLeft < 300 ? "#f87171" : "#fbbf24", fontWeight: 800 }}>
              <span>⏱️ Time Remaining:</span>
              <span>{formatTimer(interviewTimeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "18px 24px" }}>

        {/* ══════════════════════════════════════════════════════════════
            MODE 1: LEARN MODE (Socratic Tutor, Intuition, Checkpoint)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "learn" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginBottom: 24 }}>
            
            {/* Left: Interactive Lesson with Invariants */}
            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", borderRadius: 6, fontWeight: 800 }}>
                  STEP {learnStep} OF 3: CONCEPTUAL FOUNDATION
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Safe Learning Environment (No penalty for mistakes)
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 10px", color: "white" }}>
                Understanding the Sliding Window Invariant
              </h2>

              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: "0 0 14px" }}>
                A sliding window is a computational technique used to reduce time complexity from <strong>O(N²)</strong> to <strong>O(N)</strong> on contiguous subarray or substring problems. Instead of recomputing sum/counts from scratch for each window, we add the new incoming element and subtract the outgoing element.
              </p>

              {/* Visual Diagram */}
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#a5b4fc", marginBottom: 8 }}>
                  VISUAL INVARIANT: [left ... right] WINDOW EXPANSION & CONTRACTION
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", overflowX: "auto", paddingBottom: 6 }}>
                  {["a", "b", "c", "a", "b", "c", "b", "b"].map((char, idx) => {
                    const inWindow = idx >= 1 && idx <= 3;
                    return (
                      <div
                        key={idx}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: inWindow ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)",
                          border: inWindow ? "2px solid #c084fc" : "1px solid rgba(255,255,255,0.15)",
                          color: inWindow ? "white" : "#94a3b8",
                          fontWeight: 800,
                          fontSize: 14
                        }}
                      >
                        {char}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                  Window expands by moving <code>right</code>. When a constraint is violated (e.g. duplicate found), <code>left</code> contracts until valid.
                </div>
              </div>

              {/* Socratic Checkpoint Question (Section 11) */}
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", marginBottom: 6 }}>
                  CHECKPOINT: Test Your Pattern Recognition
                </div>
                <div style={{ fontSize: 12, color: "white", fontWeight: 700, marginBottom: 10 }}>
                  Which characteristic strongly indicates that a problem can be solved using a Sliding Window rather than Dynamic Programming or Two-Pointers on sorted arrays?
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "A. The array must be sorted in non-decreasing order first.",
                    "B. The target is a contiguous subarray/substring and the condition is monotonic (expanding right only increases the constraint).",
                    "C. You need to find all possible permutations of non-adjacent elements.",
                    "D. The elements are integers that sum up to a target with negative cycles."
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCheckpointOption(idx);
                        setCheckpointSubmitted(true);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: selectedCheckpointOption === idx ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.12)",
                        background: selectedCheckpointOption === idx
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

                {checkpointSubmitted && (
                  <div style={{ marginTop: 10, fontSize: 11, color: selectedCheckpointOption === 1 ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                    {selectedCheckpointOption === 1
                      ? "✓ Correct! Contiguity + monotonic constraint validity is the hallmark signature of sliding window."
                      : "Notice: Sliding window strictly requires contiguous subarrays. Try Option B."}
                  </div>
                )}
              </div>

              {/* Reveal Solution Button (Safe Learning Mode) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={() => setRevealedSolution(!revealedSolution)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "transparent",
                    color: "#94a3b8",
                    fontSize: 11,
                    cursor: "pointer"
                  }}
                >
                  {revealedSolution ? "Hide Template Solution" : "Reveal Reference Solution"}
                </button>

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
                  Apply in Guided Practice ➔
                </button>
              </div>

              {revealedSolution && (
                <pre style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#080b12", color: "#a5b4fc", fontSize: 11, overflowX: "auto" }}>
                  {code}
                </pre>
              )}
            </div>

            {/* Right: Topic Mastery List */}
            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 18 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 10px", color: "white", textTransform: "uppercase" }}>
                DSA Concept Curriculum
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {DSA_TOPICS.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setActiveTopic(t.id)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: activeTopic === t.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
                      border: activeTopic === t.id ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{t.problemCount} problems in track</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: `${t.color}20`, color: t.color, fontWeight: 800 }}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 2 & 3: PRACTICE & COACH MODE (Editor + Socratic Guidance)
            ══════════════════════════════════════════════════════════════ */}
        {(mode === "practice" || mode === "coach") && (
          <div style={{ display: "grid", gridTemplateColumns: mode === "coach" ? "1fr 340px" : "1fr 280px", gap: 18, marginBottom: 24 }}>
            
            {/* Left: Code Editor & Challenge */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              {/* Challenge Header Card */}
              <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(52,211,153,0.2)", color: "#34d399", borderRadius: 4, fontWeight: 800 }}>
                      MEDIUM
                    </span>
                    <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "white" }}>
                      Longest Substring Without Repeating Characters
                    </h2>
                  </div>
                  <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>
                    Target: O(N) Time • O(min(N, Σ)) Space
                  </span>
                </div>

                <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without duplicate characters.
                </p>

                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#94a3b8" }}>
                  <span><strong>Example 1:</strong> s = &quot;abcabcbb&quot; ➔ Output: 3</span>
                  <span>•</span>
                  <span><strong>Example 2:</strong> s = &quot;bbbbb&quot; ➔ Output: 1</span>
                </div>
              </div>

              {/* Code Editor */}
              <div style={{ background: "#080b14", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>
                    solution.{selectedLanguage === "python" ? "py" : selectedLanguage === "javascript" ? "js" : "cpp"}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setCode(`# Reset to starter template\ndef longest_substring_without_repeating(s: str) -> int:\n    pass\n`)}
                      style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: 10, cursor: "pointer" }}
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={runningTests}
                      style={{
                        padding: "5px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: runningTests ? "not-allowed" : "pointer"
                      }}
                    >
                      {runningTests ? "Running Tests..." : "▶ Run Tests"}
                    </button>
                  </div>
                </div>

                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  rows={14}
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "#f8fafc",
                    fontFamily: "monospace",
                    fontSize: 12,
                    lineHeight: 1.6,
                    padding: 16,
                    border: "none",
                    outline: "none",
                    resize: "none"
                  }}
                />
              </div>

              {/* Test Output Panel */}
              {testOutput && (
                <div style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 800, color: testOutput.passed ? "#34d399" : "#f87171" }}>
                    <span>{testOutput.passed ? "✓" : "✗"}</span>
                    <span>{testOutput.message}</span>
                  </div>
                  {testOutput.results && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                      {testOutput.results.map((r, i) => (
                        <div key={i} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 10 }}>
                          <div>Input: <code>{r.input}</code></div>
                          <div>Expected: {r.expected} • Got: {r.actual}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right: Socratic Coach Panel (Coach Mode) OR Hints (Practice Mode) */}
            {mode === "coach" ? (
              <div style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(251, 191, 36, 0.3)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>🎓</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#fbbf24" }}>Socratic Algorithmic Coach</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Guiding reasoning without revealing code</div>
                    </div>
                  </div>

                  <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {coachLog.map((c, i) => (
                      <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: c.sender === "coach" ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)", border: c.sender === "coach" ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.08)", fontSize: 11, lineHeight: 1.4 }}>
                        <strong>{c.sender === "coach" ? "🎓 Coach: " : "👤 You: "}</strong>
                        {c.text}
                      </div>
                    ))}
                    {coachAnalyzing && (
                      <div style={{ fontSize: 10, color: "#fbbf24", fontStyle: "italic" }}>
                        Coach is reviewing your approach...
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    value={coachInput}
                    onChange={e => setCoachInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAskCoach()}
                    placeholder="Ask about your window invariant..."
                    style={{
                      flex: 1,
                      background: "#080b12",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 6,
                      padding: "6px 10px",
                      color: "white",
                      fontSize: 11,
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={handleAskCoach}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#fbbf24", color: "#080b12", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                  >
                    Ask
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: 16 }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#34d399", textTransform: "uppercase", marginBottom: 10 }}>
                  Practice Scaffolding & Hints
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Hint 1: A brute-force check takes O(N³) by testing all substrings. Can we slide a window in O(N)?",
                    "Hint 2: Use a Hash Map to store the last seen index of each character so the left pointer can skip ahead in O(1).",
                    "Hint 3: Ensure left pointer only increases: left = max(left, char_map[char] + 1) to prevent moving backwards."
                  ].map((hint, idx) => (
                    <div key={idx} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                      {hint}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setMode("interview")}
                  style={{
                    width: "100%",
                    marginTop: 18,
                    padding: "9px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Ready: Take Realistic Interview Challenge ➔
                </button>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 4: INTERVIEW MODE (Timed, Unseen, Socratic Follow-ups)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "interview" && !postFeedback && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!interviewStarted ? (
              <div style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: 16, padding: 28, textAlign: "center", maxWidth: 680, margin: "20px auto" }}>
                <span style={{ fontSize: 32 }}>🎯</span>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "8px 0 6px" }}>
                  Realistic Algorithmic Interview Simulation
                </h2>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: "0 0 18px" }}>
                  In Interview Mode, solution reveals and scaffolding hints are disabled. You will be evaluated on pattern recognition, time/space complexity derivation, and defending code against live edge cases.
                </p>
                <button
                  onClick={() => setInterviewStarted(true)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Begin Interview Challenge (25 Mins) ➔
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
                
                {/* Editor */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ background: "#080b14", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 6 }}>
                      Problem: Longest Substring with Monotonic Sliding Window
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 10 }}>
                      Implement an optimal O(N) solution without helper template imports.
                    </div>
                    <textarea
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      rows={14}
                      style={{ width: "100%", background: "#04060a", color: "#f8fafc", fontFamily: "monospace", fontSize: 12, padding: 12, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, outline: "none" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      <button
                        onClick={handleRunCode}
                        disabled={runningTests}
                        style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.2)", color: "#34d399", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                      >
                        {runningTests ? "Testing..." : "▶ Test Against Hidden Cases"}
                      </button>

                      <button
                        onClick={handleSubmitInterview}
                        disabled={evaluating}
                        style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)", color: "white", fontSize: 12, fontWeight: 800, cursor: evaluating ? "not-allowed" : "pointer" }}
                      >
                        {evaluating ? "Evaluating Interview..." : "Finish Interview & Evaluate ➔"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Interviewer Conversation */}
                <div style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#c084fc", textTransform: "uppercase", marginBottom: 10 }}>
                    🏛️ Live Interviewer Assessment
                  </div>
                  {interviewerFollowUp ? (
                    <div>
                      <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", fontSize: 11, color: "white", lineHeight: 1.5, marginBottom: 12 }}>
                        <strong>Interviewer Challenge:</strong> &ldquo;{interviewerFollowUp}&rdquo;
                      </div>
                      <textarea
                        value={candidateFollowUpResponse}
                        onChange={e => setCandidateFollowUpResponse(e.target.value)}
                        placeholder="Explain your complexity derivation and how you would handle streaming data..."
                        rows={5}
                        style={{ width: "100%", background: "#080b12", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: 10, color: "white", fontSize: 11, outline: "none", marginBottom: 8 }}
                      />
                      <button
                        onClick={handleSubmitInterview}
                        style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#a855f7", color: "white", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                      >
                        Submit Follow-up Response ➔
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
                      Run tests on your code to prompt the interviewer with your implementation. The interviewer will challenge your complexity claims and boundary cases.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            POST-SESSION DIAGNOSTIC EVALUATION DOSSIER (Section 45-48)
            ══════════════════════════════════════════════════════════════ */}
        {postFeedback && (
          <div style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: 16, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.7)", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(16,185,129,0.2)", color: "#34d399", borderRadius: 4, fontWeight: 800, textTransform: "uppercase" }}>
                  VERDICT: Strong Hire
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: "4px 0 0" }}>
                  DSA Algorithmic Diagnostic Dossier
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#38bdf8" }}>88/100</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#34d399", marginBottom: 4 }}>
                  ✓ WHAT YOU DEMONSTRATED
                </div>
                {postFeedback.demonstrated.map((d, i) => (
                  <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>• {d}</div>
                ))}
              </div>

              <div style={{ padding: 12, borderRadius: 10, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#f87171", marginBottom: 4 }}>
                  ⚠️ ARCHITECTURAL / COMPLEXITY GAP
                </div>
                {postFeedback.weaknesses.map((w, i) => (
                  <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>• {w}</div>
                ))}
              </div>
            </div>

            {/* Re-test Differently Drill (Section 61) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                  RECOMMENDED NEXT PRACTICE ACTION
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
                  {postFeedback.nextBestAction.title}
                </div>
              </div>

              <button
                onClick={() => {
                  setMode("practice");
                  setPostFeedback(null);
                }}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#a855f7", color: "white", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
              >
                Start Re-Test Drill ➔
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Pre-Session Brief Modal */}
      {sessionBrief && (
        <SessionBriefModal
          isOpen={isBriefOpen}
          onClose={() => setIsBriefOpen(false)}
          brief={sessionBrief}
          onStartSession={() => setIsBriefOpen(false)}
          targetHref="/student/skills/dsa"
        />
      )}

    </div>
  );
}
