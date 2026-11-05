"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  generateDryRunSimulation,
  DryRunSimulation,
  VisualFrame,
  VisualArrayElement,
  VisualPointer,
  VisualLinkedListNode,
  VisualStackItem,
  VisualDpTable,
  AlgorithmCurriculum
} from "@/lib/skills/dsa-visualizer";

interface DsaVisualizerProps {
  problemId: string;
  problemTitle: string;
}

export function DsaVisualizer({ problemId, problemTitle }: DsaVisualizerProps) {
  const [simulation, setSimulation] = useState<DryRunSimulation>(() =>
    generateDryRunSimulation(problemId)
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hinglishMode, setHinglishMode] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const [activeTab, setActiveTab] = useState<"intuition" | "simulation" | "transfer">("simulation");
  const [userPrediction, setUserPrediction] = useState<Record<number, string>>({});
  const [showTransferSolution, setShowTransferSolution] = useState(false);
  const [testMissingTarget, setTestMissingTarget] = useState(false);

  // Check speech synthesis support on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setAudioSupported(false);
    }
  }, []);

  // Update simulation when problem or testMissingTarget changes
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    const customInput = testMissingTarget && simulation.algorithmType === "binary_search"
      ? { array: [1, 3, 5, 7, 9, 11, 13, 15], target: 8 }
      : undefined;

    const sim = generateDryRunSimulation(problemId, customInput);
    setSimulation(sim);
    setCurrentStep(0);
    setIsPlaying(false);
    setUserPrediction({});
  }, [problemId, testMissingTarget]);

  const frame: VisualFrame = simulation.frames[currentStep] || simulation.frames[0];
  const curriculum: AlgorithmCurriculum = simulation.curriculum;

  // Robust Speech Synthesis with User Gesture Enforcement & Accurate Speaking State
  const speakCurrentFrame = useCallback(
    (stepIdx: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      if (!audioEnabled) return;

      const current = simulation.frames[stepIdx] || simulation.frames[0];
      const textToSpeak = hinglishMode
        ? current.spokenNarrationHinglish || current.spokenNarration
        : current.spokenNarration;

      if (!textToSpeak) return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = playbackSpeed;

      // Select natural voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        if (hinglishMode) {
          const inVoice = voices.find(
            (v) =>
              v.lang.toLowerCase().includes("hi-in") ||
              v.lang.toLowerCase().includes("en-in")
          );
          if (inVoice) utterance.voice = inVoice;
        } else {
          const enVoice = voices.find((v) => v.lang.startsWith("en"));
          if (enVoice) utterance.voice = enVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        console.warn("Speech synthesis error handled gracefully:", e);
      };

      window.speechSynthesis.speak(utterance);
    },
    [audioEnabled, hinglishMode, playbackSpeed, simulation.frames]
  );

  // Trigger narration whenever current step changes
  useEffect(() => {
    if (audioEnabled) {
      speakCurrentFrame(currentStep);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, [currentStep, audioEnabled, speakCurrentFrame]);

  // Autoplay animation timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      // Pause if current step has an uncompleted prediction
      if (frame.prediction && !userPrediction[currentStep]) {
        setIsPlaying(false);
        return;
      }

      const stepDuration = Math.max(1400, Math.round(2600 / playbackSpeed));
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= simulation.frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, stepDuration);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, simulation.frames.length, frame.prediction, userPrediction, currentStep]);

  const handleStepJump = (step: number) => {
    if (step >= 0 && step < simulation.frames.length) {
      setCurrentStep(step);
    }
  };

  const toggleAudio = () => {
    if (!audioSupported) return;
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    if (!nextState && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (nextState) {
      speakCurrentFrame(currentStep);
    }
  };

  const copyTranscript = () => {
    const text = simulation.frames
      .map(
        (f) =>
          `[Step ${f.stepIndex + 1}] ${f.title}\nEnglish: ${f.spokenNarration}\nHinglish: ${f.spokenNarrationHinglish}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Color mapping helper for Array cells
  const getCellBg = (highlight?: string) => {
    switch (highlight) {
      case "mid":
        return "#EFF4FE";
      case "low":
        return "#EAF4EE";
      case "high":
        return "#FDF2F2";
      case "active":
        return "#FFF7EB";
      case "matched":
        return "#ECFDF3";
      case "discarded":
        return "#F2F4F7";
      case "sorted":
        return "#F0F9FF";
      default:
        return "#FFFFFF";
    }
  };

  const getCellBorder = (highlight?: string) => {
    switch (highlight) {
      case "mid":
        return "2px solid #356AE6";
      case "low":
        return "2px solid #2E7D5B";
      case "high":
        return "2px solid #C24141";
      case "active":
        return "2px solid #B7791F";
      case "matched":
        return "2px solid #12B76A";
      case "discarded":
        return "1px dashed #D0D5DD";
      default:
        return "1px solid #E4E1DA";
    }
  };

  const codeLines = simulation.codeSnippet.split("\n");

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        border: "1px solid #E4E1DA",
        padding: 20,
        marginTop: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}
    >
      {/* ── HEADER & GLOBAL CONTROLS ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
          borderBottom: "1px solid #EFECE6",
          paddingBottom: 14
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎬</span>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: 0 }}>
              Visual Dry-Run Studio: {simulation.problemTitle}
            </h3>
            <span
              style={{
                fontSize: 10,
                background: "#EFF4FE",
                color: "#356AE6",
                padding: "3px 8px",
                borderRadius: 6,
                fontWeight: 700,
                textTransform: "uppercase"
              }}
            >
              {simulation.algorithmType.replace(/_/g, " ")}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0 0" }}>
            {simulation.initialInputDescription}
          </p>
        </div>

        {/* Audio, Language & Speed Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Truthful Audio Narration Toggle */}
          <button
            onClick={toggleAudio}
            type="button"
            title={audioSupported ? "Toggle voice narration" : "Speech not supported in browser"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${!audioEnabled ? "#D0D5DD" : isSpeaking ? "#12B76A" : "#356AE6"}`,
              background: !audioEnabled ? "#FFFFFF" : isSpeaking ? "#ECFDF3" : "#EFF4FE",
              color: !audioEnabled ? "#475467" : isSpeaking ? "#027A48" : "#356AE6",
              fontSize: 11,
              fontWeight: 700,
              cursor: audioSupported ? "pointer" : "not-allowed",
              transition: "all 150ms ease"
            }}
          >
            <span>
              {!audioEnabled
                ? "🔇 Narration Muted"
                : isSpeaking
                ? "🔊 Speaking..."
                : "🔈 Narration Ready (Idle)"}
            </span>
          </button>

          {/* Speed Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#8292AA", fontWeight: 600 }}>Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid #E4E1DA",
                background: "#FFFFFF",
                fontSize: 11,
                fontWeight: 700,
                color: "#162A43",
                cursor: "pointer"
              }}
            >
              <option value={0.75}>0.75x</option>
              <option value={1.0}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setHinglishMode(!hinglishMode)}
            type="button"
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid #E4E1DA",
              background: hinglishMode ? "#EFF4FE" : "#F6F5F1",
              color: hinglishMode ? "#356AE6" : "#667085",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {hinglishMode ? "🇮🇳 Hinglish Mode" : "🌐 English Mode"}
          </button>

          {/* Copy Transcript Button */}
          <button
            onClick={copyTranscript}
            type="button"
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid #E4E1DA",
              background: "#FFFFFF",
              color: copiedTranscript ? "#12B76A" : "#667085",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {copiedTranscript ? "✓ Copied!" : "📋 Copy Transcript"}
          </button>
        </div>
      </div>

      {/* ── 3-STAGE PEDAGOGICAL NAVIGATION TABS ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#F4F5F7",
          padding: 4,
          borderRadius: 8,
          marginBottom: 16
        }}
      >
        <button
          onClick={() => setActiveTab("intuition")}
          type="button"
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            background: activeTab === "intuition" ? "#FFFFFF" : "transparent",
            color: activeTab === "intuition" ? "#162A43" : "#64748B",
            fontWeight: activeTab === "intuition" ? 800 : 600,
            fontSize: 12,
            boxShadow: activeTab === "intuition" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 150ms ease"
          }}
        >
          🎓 1. Concept & Intuition (Analogy & Proof)
        </button>
        <button
          onClick={() => setActiveTab("simulation")}
          type="button"
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            background: activeTab === "simulation" ? "#FFFFFF" : "transparent",
            color: activeTab === "simulation" ? "#356AE6" : "#64748B",
            fontWeight: activeTab === "simulation" ? 800 : 600,
            fontSize: 12,
            boxShadow: activeTab === "simulation" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 150ms ease"
          }}
        >
          💻 2. Guided Dry-Run Studio (Interactive Execution)
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          type="button"
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            background: activeTab === "transfer" ? "#FFFFFF" : "transparent",
            color: activeTab === "transfer" ? "#8A38F5" : "#64748B",
            fontWeight: activeTab === "transfer" ? 800 : 600,
            fontSize: 12,
            boxShadow: activeTab === "transfer" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 150ms ease"
          }}
        >
          🎯 3. Independent Transfer Lab (Generalization)
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: CONCEPT & INTUITION (PHASES 1, 2, 3, 4)
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "intuition" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Phase 1: Problem Understanding */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>📘</span>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Phase 1: Problem Understanding & Real-World Impact
              </h4>
            </div>
            <p style={{ fontSize: 12, color: "#334155", lineHeight: 1.6, margin: "0 0 10px 0" }}>
              {curriculum.problemUnderstanding.plainLanguage}
            </p>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                padding: 12,
                marginTop: 8
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Why this algorithm matters in production systems:
              </span>
              <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, margin: 0 }}>
                {curriculum.problemUnderstanding.whyItMatters}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {curriculum.problemUnderstanding.realWorldUseCases.map((uc, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: "#EFF6FF",
                      color: "#1D4ED8",
                      padding: "2px 8px",
                      borderRadius: 4
                    }}
                  >
                    • {uc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Phase 2: Intuitive Analogy / Story */}
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 10,
              padding: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#92400E", margin: 0 }}>
                Phase 2: Intuitive Story — {curriculum.analogy.title}
              </h4>
            </div>
            <p style={{ fontSize: 12, color: "#78350F", lineHeight: 1.6, margin: "0 0 10px 0" }}>
              {curriculum.analogy.scenario}
            </p>
            <div style={{ background: "#FFFFFF", border: "1px solid #FCD34D", borderRadius: 8, padding: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309" }}>Algorithmic Parallel: </span>
              <span style={{ fontSize: 11, color: "#78350F" }}>{curriculum.analogy.connection}</span>
            </div>
          </div>

          {/* Phase 3: Approach Comparison (Big-O Tradeoffs) */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 10,
              padding: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>⚖️</span>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
                Phase 3: Approach Comparison & Why This Strategy Works
              </h4>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Naive Approach */}
              <div style={{ background: "#FDF2F2", border: "1px solid #FECDCA", borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#B42318", textTransform: "uppercase" }}>
                  Naive Alternative
                </span>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginTop: 4 }}>
                  {curriculum.approachComparison.naive.name}
                </div>
                <div style={{ fontSize: 11, color: "#B42318", fontWeight: 700, marginTop: 4 }}>
                  Time: {curriculum.approachComparison.naive.timeComplexity} | Space: {curriculum.approachComparison.naive.spaceComplexity}
                </div>
                <p style={{ fontSize: 11, color: "#5F6368", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                  {curriculum.approachComparison.naive.whySuboptimal}
                </p>
              </div>

              {/* Optimal Approach */}
              <div style={{ background: "#ECFDF3", border: "1px solid #A6F4C5", borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#027A48", textTransform: "uppercase" }}>
                  Selected Optimal Approach
                </span>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginTop: 4 }}>
                  {curriculum.approachComparison.optimal.name}
                </div>
                <div style={{ fontSize: 11, color: "#027A48", fontWeight: 700, marginTop: 4 }}>
                  Time: {curriculum.approachComparison.optimal.timeComplexity} | Space: {curriculum.approachComparison.optimal.spaceComplexity}
                </div>
                <p style={{ fontSize: 11, color: "#5F6368", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                  {curriculum.approachComparison.optimal.keyInsight}
                </p>
              </div>
            </div>
          </div>

          {/* Phase 4: Technical Invariants & Common Pitfalls */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🛡️</span>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Phase 4: Loop Invariant & Defensive Engineering
              </h4>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1E293B", marginBottom: 4 }}>
                Formal Loop Invariant:
              </div>
              <code style={{ fontSize: 11, color: "#2563EB", fontWeight: 700 }}>
                {curriculum.technicalDetails.loopInvariant}
              </code>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                Termination Condition: <strong>{curriculum.technicalDetails.terminationCondition}</strong>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", textTransform: "uppercase" }}>
                Common Pitfalls & Bugs to Avoid in Interviews:
              </span>
              {curriculum.technicalDetails.commonPitfalls.map((pitfall, i) => (
                <div key={i} style={{ fontSize: 11, color: "#475569", display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ color: "#DC2626", fontWeight: 800 }}>⚠️</span>
                  <span>{pitfall}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                onClick={() => setActiveTab("simulation")}
                type="button"
                style={{
                  background: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Launch Interactive Simulation Studio ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: GUIDED DRY-RUN STUDIO (PHASES 5, 6, 7)
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "simulation" && (
        <div>
          {/* Dual-Language Narration Banner */}
          <div
            style={{
              background: "#F6F5F1",
              border: "1px solid #E4E1DA",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>🎙️</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase" }}>
                  Teacher-Quality Pedagogical Narration
                </span>
              </div>
              <span style={{ fontSize: 10, color: "#8292AA", fontWeight: 700 }}>
                Step {frame.stepIndex + 1} of {simulation.totalSteps}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#162A43", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              {hinglishMode ? frame.hinglishDescription : frame.description}
            </p>
          </div>

          {/* Optional Binary Search Negative Case Toggle */}
          {simulation.algorithmType === "binary_search" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#F8FAFC",
                border: "1px dashed #CBD5E1",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 14
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>🔍</span>
                <span style={{ fontSize: 11, color: "#334155", fontWeight: 700 }}>
                  Test Edge Case: Target NOT in array (demonstrates low &gt; high termination returning -1)
                </span>
              </div>
              <button
                onClick={() => setTestMissingTarget(!testMissingTarget)}
                type="button"
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: `1px solid ${testMissingTarget ? "#356AE6" : "#CBD5E1"}`,
                  background: testMissingTarget ? "#EFF6FF" : "#FFFFFF",
                  color: testMissingTarget ? "#1D4ED8" : "#475569",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {testMissingTarget ? "✓ Testing Target 8 (Not Found)" : "Switch to Missing Target (8)"}
              </button>
            </div>
          )}

          {/* Interactive Prediction Checkpoint (Phase 6 & 7) */}
          {frame.prediction && (
            <div
              style={{
                background: "#FDF4FF",
                border: "2px solid #D946EF",
                borderRadius: 10,
                padding: 14,
                marginBottom: 16
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>🤔</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#86198F", textTransform: "uppercase" }}>
                  Interactive Prediction Checkpoint (Active Participation)
                </span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#701A75", margin: "0 0 10px 0" }}>
                {hinglishMode && frame.prediction.hinglishPrompt
                  ? frame.prediction.hinglishPrompt
                  : frame.prediction.prompt}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {frame.prediction.options.map((opt) => {
                  const isSelected = userPrediction[currentStep] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setUserPrediction((prev) => ({ ...prev, [currentStep]: opt.id }))}
                      type="button"
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: `1px solid ${
                          isSelected
                            ? opt.isCorrect
                              ? "#10B981"
                              : "#EF4444"
                            : "#E5E7EB"
                        }`,
                        background: isSelected
                          ? opt.isCorrect
                            ? "#ECFDF5"
                            : "#FEF2F2"
                          : "#FFFFFF",
                        color: isSelected
                          ? opt.isCorrect
                            ? "#065F46"
                            : "#991B1B"
                          : "#1F2937",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 120ms ease"
                      }}
                    >
                      {opt.text}
                      {isSelected && (
                        <div style={{ marginTop: 4, fontSize: 10, fontWeight: 600 }}>
                          {opt.isCorrect ? "✅ " : "❌ "}
                          {opt.explanation}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TWO-COLUMN MAIN STUDIO AREA ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16
            }}
          >
            {/* LEFT COLUMN: Data Structure Visual Canvas */}
            <div
              style={{
                background: "#FAFAF9",
                borderRadius: 10,
                border: "1px solid #EFECE6",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 280
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#8292AA",
                  textTransform: "uppercase",
                  alignSelf: "flex-start",
                  marginBottom: 12
                }}
              >
                Structure: {frame.structureType.replace(/_/g, " ")}
              </span>

              {/* 1. ARRAY VIEW */}
              {frame.structureType === "array" && frame.array && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* Pointers Row */}
                  <div style={{ display: "flex", gap: 8, minHeight: 24, marginBottom: 4 }}>
                    {frame.array.map((_, idx) => {
                      const ptr = frame.pointers?.find((p) => p.index === idx);
                      return (
                        <div key={`p-${idx}`} style={{ width: 44, textAlign: "center" }}>
                          {ptr && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: ptr.color,
                                background: "#FFFFFF",
                                padding: "2px 4px",
                                borderRadius: 4,
                                border: `1px solid ${ptr.color}`,
                                display: "inline-block"
                              }}
                            >
                              {ptr.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Array Elements Boxes */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {frame.array.map((elem) => (
                      <div
                        key={`cell-${elem.index}`}
                        style={{
                          width: 44,
                          height: 48,
                          borderRadius: 8,
                          background: getCellBg(elem.highlight),
                          border: getCellBorder(elem.highlight),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 800,
                          color: elem.highlight === "discarded" ? "#98A2B3" : "#162A43",
                          transition: "all 200ms ease"
                        }}
                      >
                        {elem.value}
                      </div>
                    ))}
                  </div>

                  {/* Indices Row */}
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {frame.array.map((_, idx) => (
                      <div key={`i-${idx}`} style={{ width: 44, textAlign: "center", fontSize: 10, color: "#8292AA", fontWeight: 700 }}>
                        {idx}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. LINKED LIST VIEW */}
              {frame.structureType === "linked_list" && frame.linkedList && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
                  {frame.linkedList.map((node, idx) => (
                    <React.Fragment key={node.id}>
                      <div
                        style={{
                          padding: "10px 16px",
                          borderRadius: 8,
                          background: node.highlight === "curr" ? "#FFF7EB" : node.highlight === "prev" ? "#EAF4EE" : "#FFFFFF",
                          border: node.highlight === "curr" ? "2px solid #B7791F" : node.highlight === "prev" ? "2px solid #2E7D5B" : "1px solid #E4E1DA",
                          textAlign: "center"
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#162A43" }}>{node.value}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: node.highlight === "curr" ? "#B7791F" : "#8292AA" }}>
                          {node.highlight === "curr" ? "curr" : node.highlight === "prev" ? "prev" : `node ${idx}`}
                        </div>
                      </div>
                      {idx < (frame.linkedList?.length || 0) - 1 && (
                        <span style={{ fontSize: 18, color: "#356AE6", fontWeight: 800 }}>→</span>
                      )}
                    </React.Fragment>
                  ))}
                  <span style={{ fontSize: 12, color: "#8292AA", fontWeight: 700, marginLeft: 4 }}>None</span>
                </div>
              )}

              {/* 3. STACK VIEW */}
              {frame.structureType === "stack" && (
                <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 6, marginTop: 20, minWidth: 160 }}>
                  <div style={{ width: 140, height: 4, background: "#162A43", borderRadius: 2 }} />
                  {(!frame.stackItems || frame.stackItems.length === 0) ? (
                    <span style={{ fontSize: 11, color: "#98A2B3", fontStyle: "italic", padding: "16px 0" }}>
                      Stack Empty []
                    </span>
                  ) : (
                    frame.stackItems.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          width: 120,
                          padding: "8px 12px",
                          borderRadius: 6,
                          background: item.highlight === "pushed" ? "#EFF4FE" : "#FFFFFF",
                          border: item.highlight === "pushed" ? "2px solid #356AE6" : "1px solid #E4E1DA",
                          textAlign: "center",
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#162A43"
                        }}
                      >
                        '{item.value}' {idx === (frame.stackItems?.length || 1) - 1 && "← TOP"}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4. DP TABLE VIEW */}
              {frame.structureType === "dp_table" && frame.dpTable && (
                <div style={{ overflowX: "auto", maxWidth: "100%", marginTop: 12 }}>
                  <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "6px 10px", color: "#8292AA", borderBottom: "1px solid #E4E1DA" }}>State</th>
                        {frame.dpTable.colLabels.map((lbl, idx) => (
                          <th key={idx} style={{ padding: "6px 10px", color: "#8292AA", borderBottom: "1px solid #E4E1DA" }}>
                            {lbl}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {frame.dpTable.cells.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td style={{ padding: "8px 10px", fontWeight: 700, color: "#162A43", borderBottom: "1px solid #EFECE6" }}>
                            {frame.dpTable?.rowLabels[rIdx]}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              style={{
                                padding: "8px 12px",
                                textAlign: "center",
                                fontWeight: 800,
                                background: cell.isCurrent ? "#EFF4FE" : cell.isComputed ? "#EAF4EE" : "#FFFFFF",
                                border: cell.isCurrent ? "2px solid #356AE6" : "1px solid #E4E1DA",
                                color: cell.isCurrent ? "#356AE6" : cell.isComputed ? "#2E7D5B" : "#8292AA"
                              }}
                            >
                              {cell.value}
                              {cell.highlightFormula && (
                                <div style={{ fontSize: 9, color: "#356AE6", marginTop: 2 }}>{cell.highlightFormula}</div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Code View & Synchronized Variables Watch */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Code Snippet with Active Line Synchronization */}
              <div
                style={{
                  background: "#0F172A",
                  borderRadius: 10,
                  padding: "14px 16px",
                  color: "#F8FAFC",
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 1.6,
                  overflowX: "auto",
                  maxHeight: 220
                }}
              >
                {codeLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isActive = lineNum === frame.codeLineNumber;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: isActive ? "rgba(59, 130, 246, 0.3)" : "transparent",
                        borderLeft: isActive ? "3px solid #38BDF8" : "3px solid transparent"
                      }}
                    >
                      <span style={{ width: 22, color: isActive ? "#38BDF8" : "#64748B", textAlign: "right" }}>
                        {lineNum}
                      </span>
                      <span style={{ color: isActive ? "#FFFFFF" : "#CBD5E1", fontWeight: isActive ? 700 : 400 }}>
                        {line}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* FIXED State Variables Watch Table: Zero 'undefined' */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 8,
                  border: "1px solid #E4E1DA",
                  padding: 12
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#8292AA", textTransform: "uppercase" }}>
                    Variables Watch & Mutated State
                  </span>
                  <span style={{ fontSize: 10, color: "#12B76A", fontWeight: 700 }}>
                    Active Invariant Monitored ✓
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(frame.stateVariables || {}).map(([varName, varState]) => {
                    const isDetailedObj = typeof varState === "object" && varState !== null && "value" in varState;
                    const rawValue = isDetailedObj ? varState.value : varState;
                    const displayVal =
                      rawValue === undefined || rawValue === null ? "— (uninitialized)" : String(rawValue);
                    const isChanged = isDetailedObj
                      ? Boolean(varState.hasChanged)
                      : frame.changedVariables?.includes(varName) ?? false;

                    return (
                      <div
                        key={varName}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: isChanged ? "#FFF7EB" : "#F8F9FA",
                          border: `1px solid ${isChanged ? "#F59E0B" : "#E4E1DA"}`
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#475467" }}>{varName}:</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: isChanged ? "#B45309" : "#162A43" }}>
                          {displayVal}
                        </span>
                        {isChanged && (
                          <span style={{ fontSize: 9, background: "#F59E0B", color: "#FFFFFF", padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>
                            UPDATED
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── TIMELINE SCRUBBER & PLAYBACK CONTROLS ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              borderTop: "1px solid #EFECE6",
              paddingTop: 14
            }}
          >
            {/* Timeline Range Slider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, color: "#8292AA", fontWeight: 700, minWidth: 40 }}>Step 1</span>
              <input
                type="range"
                min={0}
                max={simulation.frames.length - 1}
                value={currentStep}
                onChange={(e) => handleStepJump(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: "#356AE6", cursor: "pointer" }}
              />
              <span style={{ fontSize: 11, color: "#162A43", fontWeight: 800, minWidth: 60, textAlign: "right" }}>
                {currentStep + 1} / {simulation.totalSteps}
              </span>
            </div>

            {/* Buttons Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => handleStepJump(0)}
                  disabled={currentStep === 0}
                  type="button"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    background: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: currentStep === 0 ? "not-allowed" : "pointer",
                    opacity: currentStep === 0 ? 0.5 : 1
                  }}
                >
                  ⏮ Reset
                </button>
                <button
                  onClick={() => handleStepJump(currentStep - 1)}
                  disabled={currentStep === 0}
                  type="button"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    background: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: currentStep === 0 ? "not-allowed" : "pointer",
                    opacity: currentStep === 0 ? 0.5 : 1
                  }}
                >
                  ◀ Previous
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  type="button"
                  style={{
                    padding: "6px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: isPlaying ? "#F04438" : "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {isPlaying ? "⏸ Pause Simulation" : "▶ Play Step-by-Step"}
                </button>
                <button
                  onClick={() => handleStepJump(currentStep + 1)}
                  disabled={currentStep === simulation.frames.length - 1}
                  type="button"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    background: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: currentStep === simulation.frames.length - 1 ? "not-allowed" : "pointer",
                    opacity: currentStep === simulation.frames.length - 1 ? 0.5 : 1
                  }}
                >
                  Next ▶
                </button>
              </div>

              <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>
                {frame.title} ({frame.actionType.toUpperCase()})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3: INDEPENDENT TRANSFER LAB (PHASE 8)
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "transfer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "#F5F3FF",
              border: "1px solid #DDD6FE",
              borderRadius: 10,
              padding: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>🎯</span>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#5B21B6", margin: 0 }}>
                Phase 8: Independent Transfer Challenge — {curriculum.transferLab.title}
              </h4>
            </div>
            <p style={{ fontSize: 12, color: "#4C1D95", lineHeight: 1.6, margin: "0 0 12px 0" }}>
              {curriculum.transferLab.prompt}
            </p>
            <div style={{ background: "#FFFFFF", border: "1px solid #C4B5FD", borderRadius: 8, padding: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>Sample Input: </span>
              <code style={{ fontSize: 11, color: "#1E1B4B" }}>{curriculum.transferLab.initialArrayOrInput}</code>
            </div>

            <div style={{ background: "#EDE9FE", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#5B21B6", display: "block", marginBottom: 4 }}>
                Conceptual Bridge from Current Algorithm:
              </span>
              <p style={{ fontSize: 11, color: "#4C1D95", lineHeight: 1.5, margin: 0 }}>
                {curriculum.transferLab.conceptualBridge}
              </p>
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>
                💡 Key Question: {curriculum.transferLab.keyQuestion}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>
                Target Complexity: <strong>{curriculum.transferLab.complexityTarget}</strong>
              </span>
              <button
                onClick={() => setShowTransferSolution(!showTransferSolution)}
                type="button"
                style={{
                  background: showTransferSolution ? "#7C3AED" : "#FFFFFF",
                  color: showTransferSolution ? "#FFFFFF" : "#7C3AED",
                  border: "1px solid #7C3AED",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {showTransferSolution ? "Hide Solution Breakdown" : "Reveal Solution & Approach"}
              </button>
            </div>

            {showTransferSolution && (
              <div
                style={{
                  marginTop: 14,
                  background: "#0F172A",
                  borderRadius: 8,
                  padding: 14,
                  color: "#F8FAFC",
                  fontFamily: "monospace",
                  fontSize: 11,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap"
                }}
              >
                {curriculum.transferLab.solutionBreakdown}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
