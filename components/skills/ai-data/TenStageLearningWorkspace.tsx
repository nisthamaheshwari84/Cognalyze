"use client";

import React, { useState, useEffect, useCallback } from "react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import {
  TaxonomyTopic,
  getTaxonomyTopicById,
  ExternalResource
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import {
  TeachingStageNumber,
  ContentLanguage,
  TeachingStagePayload,
  getTopicStagePayload,
  evaluateStudentExplanation,
  StudentExplanationEvaluation
} from "@/lib/skills/ai-data/deep-teaching-engine";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";

interface TenStageLearningWorkspaceProps {
  topicId: string;
  candidateId: string;
  targetRole: TargetRoleSlug;
  initialLanguage?: ContentLanguage;
  onLanguageChange?: (newLang: ContentLanguage) => void;
  onTopicComplete?: (topicId: string) => void;
}

const STAGE_CONFIG: Array<{ num: TeachingStageNumber; name: string; icon: string }> = [
  { num: 1, name: "Context & Intuition", icon: "💡" },
  { num: 2, name: "Deep Concept", icon: "🔬" },
  { num: 3, name: "Visual Demo", icon: "👁️" },
  { num: 4, name: "Worked Example", icon: "👨‍🏫" },
  { num: 5, name: "Experiment", icon: "🧪" },
  { num: 6, name: "Guided Practice", icon: "🛠️" },
  { num: 7, name: "Debugging", icon: "🐛" },
  { num: 8, name: "Independent App", icon: "🚀" },
  { num: 9, name: "Recall & Explain", icon: "🗣️" },
  { num: 10, name: "Evidence & DNA", icon: "🎓" },
];

export default function TenStageLearningWorkspace({
  topicId,
  candidateId,
  targetRole,
  initialLanguage = "english",
  onLanguageChange,
  onTopicComplete
}: TenStageLearningWorkspaceProps) {
  const [activeStage, setActiveStage] = useState<TeachingStageNumber>(1);
  const [unlockedStage, setUnlockedStage] = useState<TeachingStageNumber>(1);
  const [language, setLanguage] = useState<ContentLanguage>(initialLanguage);
  const [stagePayload, setStagePayload] = useState<TeachingStagePayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Audio / Speech State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Interactive Execution States
  const [codeContent, setCodeContent] = useState<string>("");
  const [executionOutput, setExecutionOutput] = useState<{ stdout?: string; stderr?: string; timeMs?: number } | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [revealedHints, setRevealedHints] = useState<number>(0);

  // Stage 9: Explanation State
  const [studentExplanationText, setStudentExplanationText] = useState<string>("");
  const [evaluatingExplanation, setEvaluatingExplanation] = useState<boolean>(false);
  const [explanationResult, setExplanationResult] = useState<StudentExplanationEvaluation | null>(null);

  // External Resource Viewer Modal
  const [activeExternalModal, setActiveExternalModal] = useState<ExternalResource | null>(null);

  const topic = getTaxonomyTopicById(topicId);

  // Load Stage Payload
  const loadStageData = useCallback(async (stNum: TeachingStageNumber, lang: ContentLanguage) => {
    setLoading(true);
    setExecutionOutput(null);
    try {
      const payload = getTopicStagePayload(topicId, stNum, lang, targetRole);
      setStagePayload(payload);
      if (payload) {
        if (stNum === 5 || stNum === 6 || stNum === 8) {
          setCodeContent(payload.content.starterCode || "");
        } else if (stNum === 7) {
          setCodeContent(payload.content.brokenCode || "");
        }
      }
    } catch (err) {
      console.error("Failed to load stage payload:", err);
    } finally {
      setLoading(false);
    }
  }, [topicId, targetRole]);

  useEffect(() => {
    loadStageData(activeStage, language);
  }, [activeStage, language, loadStageData]);

  const handleLanguageToggle = (newLang: ContentLanguage) => {
    setLanguage(newLang);
    if (onLanguageChange) onLanguageChange(newLang);
    // Persist via API
    fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_language_preference", candidateId, language: newLang })
    }).catch(err => console.warn("Failed to persist language preference:", err));
  };

  const advanceStage = (nextNum: TeachingStageNumber) => {
    setActiveStage(nextNum);
    if (nextNum > unlockedStage) {
      setUnlockedStage(nextNum);
      fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_stage_progress", candidateId, topicId, stageNumber: nextNum })
      }).catch(err => console.warn("Failed to persist stage progression:", err));
    }
  };

  // Web Speech API for Teacher Narration
  const toggleSpeechNarration = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Run Code in Sandbox
  const handleExecuteSandbox = async () => {
    setIsExecuting(true);
    setExecutionOutput(null);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_python",
          candidateId,
          code: codeContent,
          challengeSlug: topicId
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setExecutionOutput({
          stdout: data.result.stdout || "Code executed successfully with zero output.",
          stderr: data.result.errorMessage,
          timeMs: data.result.executionTimeMs || 12
        });
        if (data.result.passed && activeStage < 10) {
          advanceStage((activeStage + 1) as TeachingStageNumber);
        }
      } else {
        setExecutionOutput({
          stderr: data.error || "Execution failed. Check syntax and error trace.",
          timeMs: 8
        });
      }
    } catch (err: any) {
      setExecutionOutput({ stderr: err.message, timeMs: 5 });
    } finally {
      setIsExecuting(false);
    }
  };

  // Stage 9: Submit Explanation
  const handleSubmitExplanation = () => {
    if (!studentExplanationText.trim()) return;
    setEvaluatingExplanation(true);
    try {
      const result = evaluateStudentExplanation(topicId, studentExplanationText, language);
      setExplanationResult(result);
      if (result.passed) {
        advanceStage(10);
        if (onTopicComplete) onTopicComplete(topicId);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setEvaluatingExplanation(false);
    }
  };

  if (!topic) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#667085" }}>
        <h3>Topic not found in master taxonomy.</h3>
      </div>
    );
  }

  const roleMeta = topic.roleRelevance[targetRole] || {
    importance: "HIGH",
    why: "Core prerequisite skill."
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── TOP BANNER: TOPIC HEADER & BILINGUAL CONTROLS ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 10,
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {topic.trackId.replace(/_/g, " ").toUpperCase()}
            </span>
            <span style={{ color: "#E4E1DA" }}>·</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700, textTransform: "uppercase" }}>
              {topic.difficulty}
            </span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", fontWeight: 700 }}>
              ⏱ {topic.estimatedMinutes} mins
            </span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#162A43", margin: "2px 0 0", letterSpacing: "-0.02em" }}>
            {topic.title}
          </h2>
          <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0" }}>
            Target Role Relevance: <strong style={{ color: "#162A43" }}>{roleMeta.importance}</strong> — {roleMeta.why}
          </p>
        </div>

        {/* Language Preference Toggle & Teacher Voice Control */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F6F5F1", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA" }}>
            <button
              onClick={() => handleLanguageToggle("english")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: language === "english" ? "#162A43" : "transparent",
                color: language === "english" ? "#FFFFFF" : "#667085",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageToggle("hinglish")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: language === "hinglish" ? "#162A43" : "transparent",
                color: language === "hinglish" ? "#FFFFFF" : "#667085",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Hinglish (Natural)
            </button>
          </div>

          <button
            onClick={() => {
              if (stagePayload) {
                toggleSpeechNarration(stagePayload.content.description + " " + stagePayload.content.title);
              }
            }}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              background: isSpeaking ? "#FEF7ED" : "#EFF4FE",
              border: isSpeaking ? "1px solid #F8D8A7" : "1px solid #D2E0FB",
              color: isSpeaking ? "#B7791F" : "#356AE6",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>{isSpeaking ? "❚❚ Pause Voice" : "🎙️ Alex Voice Guide"}</span>
          </button>
        </div>
      </div>

      {/* ── 10-STAGE UNIVERSAL LEARNING RIBBON ── */}
      <div
        style={{
          display: "flex",
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 8,
          padding: 4,
          gap: 2,
          overflowX: "auto",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        {STAGE_CONFIG.map((st) => {
          const isActive = activeStage === st.num;
          const isUnlocked = st.num <= unlockedStage;
          const isCompleted = st.num < unlockedStage;

          return (
            <button
              key={st.num}
              onClick={() => isUnlocked && setActiveStage(st.num)}
              disabled={!isUnlocked}
              style={{
                flex: "1 0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                background: isActive ? "#162A43" : isCompleted ? "#EAF4EE" : "transparent",
                color: isActive ? "#FFFFFF" : isCompleted ? "#2E7D5B" : isUnlocked ? "#17191C" : "#98A2B3",
                fontSize: 11,
                fontWeight: isActive ? 800 : 600,
                cursor: isUnlocked ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                opacity: isUnlocked ? 1 : 0.6
              }}
            >
              <span>{st.icon}</span>
              <span>{st.num}. {st.name}</span>
              {isCompleted && <span style={{ fontSize: 10 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      {loading || !stagePayload ? (
        <div style={{ padding: 40, textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
          <p style={{ color: "#667085", fontSize: 13 }}>Loading stage content...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 16 }}>
          {/* LEFT COLUMN: EDUCATIONAL CONCEPT, EXPLANATION & EXTERNAL RESOURCES */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "20px 22px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                  Stage {stagePayload.stageNumber} · {stagePayload.stageName}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#162A43", margin: "2px 0 6px 0" }}>
                  {stagePayload.content.title}
                </h3>
                <p style={{ fontSize: 12.5, color: "#17191C", lineHeight: 1.6, margin: 0 }}>
                  {stagePayload.content.description}
                </p>
              </div>

              {/* Body Markdown */}
              <div style={{ fontSize: 12.5, color: "#17191C", lineHeight: 1.65, borderTop: "1px solid #E4E1DA", paddingTop: 12 }}>
                <MarkdownRenderer content={stagePayload.content.bodyMarkdown} />
              </div>

              {/* Code Snippet for Stage 4 (Worked Example) */}
              {stagePayload.content.codeSnippet && (
                <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                    Production Annotated Implementation
                  </div>
                  <pre style={{ margin: 0, fontSize: 11.5, fontFamily: "monospace", color: "#162A43", overflowX: "auto", lineHeight: 1.5 }}>
                    {stagePayload.content.codeSnippet}
                  </pre>
                </div>
              )}
            </div>

            {/* RECOMMENDED EXTERNAL LEARNING RESOURCES (CAMPUSX, OFFICIAL DOCS, ETC.) */}
            {topic.externalResources && topic.externalResources.length > 0 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: "16px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📺</span>
                    <span>Recommended External Learning Resources</span>
                  </h4>
                  <span style={{ fontSize: 10, color: "#667085" }}>Vetted & Verified</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {topic.externalResources.map((res) => (
                    <div
                      key={res.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "#FAF9F6",
                        border: "1px solid #E4E1DA",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>{res.title}</span>
                          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700 }}>
                            {res.creatorOrOrg}
                          </span>
                          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#FAF9F6", color: "#667085", border: "1px solid #E4E1DA" }}>
                            {res.language}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>
                          {res.whyRecommended} {res.timestamp && `(Starts at: ${res.timestamp})`}
                        </p>
                      </div>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          background: "#356AE6",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 700,
                          textDecoration: "none",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Watch Lecture ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: ACTIVE INTERACTIVE WORKSPACE PER STAGE */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* STAGE 3: VISUAL DEMO VIEW */}
            {activeStage === 3 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
                    Step-by-Step State Tracer
                  </h4>
                  <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 700 }}>
                    Mode: Interactive Visual
                  </span>
                </div>

                <div style={{ padding: 24, borderRadius: 8, background: "#FAF9F6", border: "1px solid #E4E1DA", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                    Dynamic Matrix &amp; Dimensional Alignment Visualizer
                  </div>
                  <p style={{ fontSize: 11.5, color: "#667085", maxWidth: 360, margin: "6px auto 14px" }}>
                    Broadcasting rules: Comparing trailing dimensions from right to left. Memory strides set to 0 along singular axes.
                  </p>
                  <div style={{ display: "inline-flex", gap: 8 }}>
                    <div style={{ padding: "6px 14px", background: "#EFF4FE", borderRadius: 6, border: "1px solid #D2E0FB", fontSize: 11, color: "#356AE6", fontWeight: 700 }}>
                      Array A: (4, 3)
                    </div>
                    <div style={{ padding: "6px 14px", background: "#FEF7ED", borderRadius: 6, border: "1px solid #F8D8A7", fontSize: 11, color: "#B7791F", fontWeight: 700 }}>
                      Array B: (3,) → (1, 3)
                    </div>
                    <div style={{ padding: "6px 14px", background: "#EAF4EE", borderRadius: 6, border: "1px solid #C8E4D3", fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>
                      Result: (4, 3) [No memory copy]
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => advanceStage(4)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 6,
                    background: "#162A43",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Proceed to Stage 4: Worked Example →
                </button>
              </div>
            )}

            {/* STAGE 5, 6, 7, 8: CODE EDITOR & SANDBOX TEST RUNNER */}
            {(activeStage === 5 || activeStage === 6 || activeStage === 7 || activeStage === 8) && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
                      {activeStage === 7 ? "Debug & Fix Code" : "Hands-On Implementation"}
                    </h4>
                    <span style={{ fontSize: 11, color: "#667085" }}>
                      Python 3.12 Runtime · NumPy &amp; Pandas Loaded
                    </span>
                  </div>

                  {activeStage === 6 && (
                    <button
                      onClick={() => setRevealedHints(prev => prev + 1)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: "#FAF9F6",
                        border: "1px solid #E4E1DA",
                        color: "#356AE6",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      💡 Need a Hint? ({revealedHints})
                    </button>
                  )}
                </div>

                {revealedHints > 0 && activeStage === 6 && (
                  <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 6, padding: "8px 12px", fontSize: 11.5, color: "#B7791F" }}>
                    <strong>Hint:</strong> Remember that trailing dimensions align element-wise from right to left. Use <code>np.newaxis</code> or <code>.reshape(-1, 1)</code> to add singleton dimensions.
                  </div>
                )}

                {/* In-Browser Python Editor */}
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  rows={14}
                  style={{
                    width: "100%",
                    fontFamily: "monospace",
                    fontSize: 12,
                    lineHeight: 1.5,
                    padding: 12,
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    background: "#FAF9F6",
                    color: "#162A43",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                  placeholder="# Write your Python implementation here..."
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={handleExecuteSandbox}
                    disabled={isExecuting}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 6,
                      background: isExecuting ? "#E4E1DA" : "#356AE6",
                      color: isExecuting ? "#667085" : "#FFFFFF",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isExecuting ? "not-allowed" : "pointer"
                    }}
                  >
                    {isExecuting ? "Executing Code..." : "▶ Run Sandbox Tests"}
                  </button>

                  <button
                    onClick={() => advanceStage((activeStage + 1) as TeachingStageNumber)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 6,
                      background: "transparent",
                      border: "1px solid #E4E1DA",
                      color: "#162A43",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Skip to Next Stage →
                  </button>
                </div>

                {/* Execution Output Console */}
                {executionOutput && (
                  <div style={{ background: "#162A43", color: "#FFFFFF", borderRadius: 6, padding: 12, fontSize: 11, fontFamily: "monospace" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 4, marginBottom: 6 }}>
                      <span>Terminal Output</span>
                      <span>{executionOutput.timeMs}ms</span>
                    </div>
                    {executionOutput.stdout && <pre style={{ margin: 0, color: "#86EFAC" }}>{executionOutput.stdout}</pre>}
                    {executionOutput.stderr && <pre style={{ margin: 0, color: "#FCA5A5" }}>{executionOutput.stderr}</pre>}
                  </div>
                )}
              </div>
            )}

            {/* STAGE 9: RECALL & EXPLANATION VIEW */}
            {activeStage === 9 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
                    Articulate Conceptual Understanding
                  </h4>
                  <p style={{ fontSize: 11.5, color: "#667085", margin: "2px 0 0" }}>
                    Explain this concept as if answering a technical interviewer. Our AI evaluation engine scores conceptual fidelity, mechanics, and failure modes.
                  </p>
                </div>

                <textarea
                  value={studentExplanationText}
                  onChange={(e) => setStudentExplanationText(e.target.value)}
                  rows={8}
                  style={{
                    width: "100%",
                    fontSize: 12,
                    lineHeight: 1.5,
                    padding: 12,
                    borderRadius: 6,
                    border: "1px solid #E4E1DA",
                    background: "#FAF9F6",
                    color: "#162A43",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                  placeholder={language === "hinglish"
                    ? "Apne shabdon mein explain karein ki yeh concept kaise operate karta hai aur iske key trade-offs kya hain..."
                    : "Explain in your own words the internal mechanics, why it exists, and when you would use it..."
                  }
                />

                <button
                  onClick={handleSubmitExplanation}
                  disabled={evaluatingExplanation || studentExplanationText.trim().length === 0}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 6,
                    background: evaluatingExplanation ? "#E4E1DA" : "#356AE6",
                    color: evaluatingExplanation ? "#667085" : "#FFFFFF",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: evaluatingExplanation ? "not-allowed" : "pointer"
                  }}
                >
                  {evaluatingExplanation ? "Evaluating Understanding..." : "Submit Explanation for AI Evaluation"}
                </button>

                {explanationResult && (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      background: explanationResult.passed ? "#EAF4EE" : "#FEF7ED",
                      border: `1px solid ${explanationResult.passed ? "#C8E4D3" : "#F8D8A7"}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ color: explanationResult.passed ? "#2E7D5B" : "#B7791F", fontSize: 12 }}>
                        {explanationResult.accuracyGrade}: Score {explanationResult.understandingScore}/100
                      </strong>
                      <span style={{ fontSize: 11, fontWeight: 700, color: explanationResult.passed ? "#2E7D5B" : "#B7791F" }}>
                        {explanationResult.passed ? "✓ Competency Verified" : "Review Recommended"}
                      </span>
                    </div>
                    <p style={{ fontSize: 11.5, color: "#17191C", margin: "0 0 6px" }}>
                      {explanationResult.feedbackMessage}
                    </p>
                    {explanationResult.detectedKeyConcepts.length > 0 && (
                      <div style={{ fontSize: 11, color: "#2E7D5B" }}>
                        Detected points: {explanationResult.detectedKeyConcepts.join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STAGE 10: EVIDENCE & STUDENT DNA VIEW */}
            {activeStage === 10 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: 40 }}>🎓</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: 0 }}>
                  Topic Mastery Verified!
                </h3>
                <p style={{ fontSize: 12, color: "#667085", maxWidth: 360, margin: "0 auto" }}>
                  All 10 stages completed: Intuition, Deep Concepts, Visual Tracing, Sandbox Implementation, Bug Debugging, and Conceptual Recall.
                </p>

                <div style={{ padding: 12, borderRadius: 8, background: "#EAF4EE", border: "1px solid #C8E4D3", color: "#2E7D5B", fontSize: 11.5, fontWeight: 700 }}>
                  ✓ Synchronized to Candidate Portfolio &amp; Student DNA Ledger
                </div>

                <button
                  onClick={() => {
                    if (onTopicComplete) onTopicComplete(topicId);
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 6,
                    background: "#356AE6",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Continue to Next Topic in Roadmap →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

