"use client";

import React, { useState, useEffect, useCallback } from "react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import {
  TaxonomyTopic,
  getTaxonomyTopicById,
  ExternalResource,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import {
  TeachingStageNumber,
  ContentLanguage,
  TeachingStagePayload,
  getTopicStagePayload,
  evaluateStudentExplanation,
  StudentExplanationEvaluation,
} from "@/lib/skills/ai-data/deep-teaching-engine";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";

export interface EightStageLearningWorkspaceProps {
  topicId: string;
  candidateId: string;
  targetRole: TargetRoleSlug;
  initialLanguage?: ContentLanguage;
  onLanguageChange?: (newLang: ContentLanguage) => void;
  onTopicComplete?: (topicId: string) => void;
}

export type CanonicalStageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CanonicalStageConfig {
  num: CanonicalStageNumber;
  title: string;
  shortTitle: string;
  icon: string;
  badge: string;
}

export const CANONICAL_EIGHT_STAGES: CanonicalStageConfig[] = [
  { num: 1, title: "Context & Intuition", shortTitle: "Context", icon: "💡", badge: "Stage 1" },
  { num: 2, title: "Deep Concept", shortTitle: "Deep Concept", icon: "🔬", badge: "Stage 2" },
  { num: 3, title: "Visual Demo", shortTitle: "Visual Demo", icon: "👁️", badge: "Stage 3" },
  { num: 4, title: "Worked Example", shortTitle: "Worked Example", icon: "👨‍🏫", badge: "Stage 4" },
  { num: 5, title: "Experiment", shortTitle: "Experiment", icon: "🧪", badge: "Stage 5" },
  { num: 6, title: "Guided Practice", shortTitle: "Practice", icon: "🛠️", badge: "Stage 6" },
  { num: 7, title: "Debugging", shortTitle: "Debugging", icon: "🐛", badge: "Stage 7" },
  { num: 8, title: "Independent Challenge", shortTitle: "Challenge", icon: "🚀", badge: "Stage 8" },
];

export default function EightStageLearningWorkspace({
  topicId,
  candidateId,
  targetRole,
  initialLanguage = "english",
  onLanguageChange,
  onTopicComplete,
}: EightStageLearningWorkspaceProps) {
  const [activeStage, setActiveStage] = useState<CanonicalStageNumber>(1);
  const [completedStages, setCompletedStages] = useState<number[]>([1]);
  const [language, setLanguage] = useState<ContentLanguage>(initialLanguage);
  const [stagePayload, setStagePayload] = useState<TeachingStagePayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Audio / Speech State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Interactive Execution States
  const [codeContent, setCodeContent] = useState<string>("");
  const [executionOutput, setExecutionOutput] = useState<{ stdout?: string; stderr?: string; timeMs?: number; passed?: boolean } | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [revealedHints, setRevealedHints] = useState<number>(0);

  // Visual Demo state
  const [demoStep, setDemoStep] = useState<number>(0);

  // Challenge Completion & DNA Sync State
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState<boolean>(false);
  const [challengeSuccess, setChallengeSuccess] = useState<boolean>(false);

  // Active External Resource Modal
  const [activeExternalModal, setActiveExternalModal] = useState<ExternalResource | null>(null);

  const topic: TaxonomyTopic | null = getTaxonomyTopicById(topicId);

  // Load Stage Payload
  const loadStageData = useCallback(async (stNum: CanonicalStageNumber, lang: ContentLanguage) => {
    setLoading(true);
    setExecutionOutput(null);
    setChallengeSuccess(false);
    try {
      // Map Canonical 1..8 to engine TeachingStageNumber 1..10
      const payload = getTopicStagePayload(topicId, stNum as TeachingStageNumber, lang, targetRole);
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

  // Language Toggle
  const handleLanguageToggle = (newLang: ContentLanguage) => {
    setLanguage(newLang);
    if (onLanguageChange) onLanguageChange(newLang);
    fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_language_preference", candidateId, language: newLang }),
    }).catch((err) => console.warn("Failed to persist language preference:", err));
  };

  // Stage Progression Handler
  const goToStage = (stNum: CanonicalStageNumber) => {
    setActiveStage(stNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markStageCompleted = (stNum: CanonicalStageNumber) => {
    if (!completedStages.includes(stNum)) {
      const updated = [...completedStages, stNum];
      setCompletedStages(updated);
      fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_stage_progress", candidateId, topicId, stageNumber: stNum }),
      }).catch((err) => console.warn("Failed to persist stage progression:", err));
    }
  };

  const advanceNextStage = () => {
    markStageCompleted(activeStage);
    if (activeStage < 8) {
      goToStage((activeStage + 1) as CanonicalStageNumber);
    } else {
      // Stage 8 Complete -> Complete Topic and Synchronize to Student DNA
      handleCompleteTopic();
    }
  };

  const handleCompleteTopic = async () => {
    setIsSubmittingChallenge(true);
    markStageCompleted(8);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_stage_progress",
          candidateId,
          topicId,
          stageNumber: 8,
          isTopicComplete: true,
          targetRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChallengeSuccess(true);
        if (onTopicComplete) onTopicComplete(topicId);
      }
    } catch (err) {
      console.error("Error finalizing topic completion:", err);
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  // Text-to-Speech narration
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

  // Execute Sandbox Code
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
          challengeSlug: topicId,
          stageNumber: activeStage,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setExecutionOutput({
          stdout: data.result.stdout || "Execution successful with zero output.",
          stderr: data.result.errorMessage,
          timeMs: data.result.executionTimeMs || 14,
          passed: data.result.passed,
        });
        if (data.result.passed) {
          markStageCompleted(activeStage);
        }
      } else {
        setExecutionOutput({
          stderr: data.error || "Execution error: please check syntax and invariants.",
          timeMs: 10,
          passed: false,
        });
      }
    } catch (err: any) {
      setExecutionOutput({ stderr: err.message, timeMs: 5, passed: false });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!topic) {
    return (
      <div style={{ padding: 40, textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43" }}>Topic Not Found</h3>
        <p style={{ fontSize: 12, color: "#667085" }}>The requested curriculum topic ({topicId}) could not be resolved.</p>
      </div>
    );
  }

  const roleMeta = topic.roleRelevance[targetRole] || { importance: "CORE", why: "Foundational software engineering invariant." };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── TOP TOPIC HEADER & METADATA BAR ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 10,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {topic.trackId.replace(/_/g, " ").toUpperCase()}
            </span>
            <span style={{ color: "#E4E1DA" }}>·</span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 4,
                background: "#EFF4FE",
                color: "#356AE6",
                border: "1px solid #D2E0FB",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {topic.difficulty}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 4,
                background: "#EAF4EE",
                color: "#2E7D5B",
                border: "1px solid #C8E4D3",
                fontWeight: 700,
              }}
            >
              ⏱ {topic.estimatedMinutes} mins
            </span>
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "#162A43", margin: "2px 0 0", letterSpacing: "-0.02em" }}>
            {topic.title}
          </h2>
          <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0" }}>
            Target Role Relevance: <strong style={{ color: "#162A43" }}>{roleMeta.importance}</strong> — {roleMeta.why}
          </p>
        </div>

        {/* Language Preference Toggle & Teacher Voice Control */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "#F6F5F1",
              padding: 3,
              borderRadius: 8,
              border: "1px solid #E4E1DA",
            }}
          >
            <button
              onClick={() => handleLanguageToggle("english")}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "none",
                background: language === "english" ? "#162A43" : "transparent",
                color: language === "english" ? "#FFFFFF" : "#667085",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageToggle("hinglish")}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "none",
                background: language === "hinglish" ? "#162A43" : "transparent",
                color: language === "hinglish" ? "#FFFFFF" : "#667085",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
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
              padding: "6px 12px",
              borderRadius: 6,
              background: isSpeaking ? "#FEF7ED" : "#EFF4FE",
              border: isSpeaking ? "1px solid #F8D8A7" : "1px solid #D2E0FB",
              color: isSpeaking ? "#B7791F" : "#356AE6",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span>{isSpeaking ? "⏹ Stop Teacher" : "🔊 Listen"}</span>
          </button>
        </div>
      </div>

      {/* ── CANONICAL 8-STAGE HORIZONTAL PROGRESSION RIBBON ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 10,
          padding: "10px 14px",
          display: "flex",
          gap: 6,
          overflowX: "auto",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {CANONICAL_EIGHT_STAGES.map((st) => {
          const isActive = activeStage === st.num;
          const isDone = completedStages.includes(st.num);

          return (
            <button
              key={st.num}
              onClick={() => goToStage(st.num)}
              style={{
                flex: "1 0 auto",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 7,
                border: isActive ? "1px solid #162A43" : "1px solid transparent",
                background: isActive ? "#162A43" : isDone ? "#F0FDF4" : "#FAF9F6",
                color: isActive ? "#FFFFFF" : isDone ? "#166534" : "#475467",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  background: isActive ? "#FFFFFF" : isDone ? "#22C55E" : "#E4E1DA",
                  color: isActive ? "#162A43" : isDone ? "#FFFFFF" : "#667085",
                }}
              >
                {isDone ? "✓" : st.num}
              </span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", opacity: 0.8 }}>
                  {st.badge}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: isActive ? 800 : 600 }}>
                  {st.shortTitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── MAIN 2-COLUMN STAGE WORKSPACE ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>Loading Stage {activeStage} Content...</div>
        </div>
      ) : stagePayload ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 16 }}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: PEDAGOGICAL CONCEPT / INSTRUCTION PANEL           */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Core Stage Content Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: 22,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Stage Header */}
              <div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: "#356AE6",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  STAGE {activeStage} OF 8 · {CANONICAL_EIGHT_STAGES[activeStage - 1].title.toUpperCase()}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#162A43", margin: "2px 0 6px" }}>
                  {stagePayload.content.title}
                </h3>
                <p style={{ fontSize: 12.5, color: "#475467", lineHeight: 1.6, margin: 0 }}>
                  {stagePayload.content.description}
                </p>
              </div>

              {/* Stage Body Markdown */}
              <div
                style={{
                  fontSize: 12.5,
                  color: "#17191C",
                  lineHeight: 1.65,
                  borderTop: "1px solid #E4E1DA",
                  paddingTop: 12,
                }}
              >
                <MarkdownRenderer content={stagePayload.content.bodyMarkdown} />
              </div>

              {/* Stage 1: Context & Intuition Insights */}
              {activeStage === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                  <div style={{ padding: 12, borderRadius: 8, background: "#EFF4FE", border: "1px solid #D2E0FB" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                      Why This Exists
                    </div>
                    <p style={{ fontSize: 11.5, color: "#162A43", margin: 0, lineHeight: 1.45 }}>
                      {topic.contextAndIntuition.whyExists}
                    </p>
                  </div>
                  <div style={{ padding: 12, borderRadius: 8, background: "#FEF7ED", border: "1px solid #F8D8A7" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#B7791F", textTransform: "uppercase", marginBottom: 4 }}>
                      What Engineers Did Before
                    </div>
                    <p style={{ fontSize: 11.5, color: "#162A43", margin: 0, lineHeight: 1.45 }}>
                      {topic.contextAndIntuition.whatWasUsedBefore}
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 2: Deep Concept Internal Mechanics */}
              {activeStage === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                  <div style={{ padding: 14, borderRadius: 8, background: "#FAF9F6", border: "1px solid #E4E1DA" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 6 }}>
                      Engine Mechanics & Execution Flow
                    </div>
                    <p style={{ fontSize: 12, color: "#475467", margin: 0, lineHeight: 1.55 }}>
                      {topic.deepExplanation.internalMechanics}
                    </p>
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, background: "#EFF4FE", border: "1px solid #D2E0FB" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 6 }}>
                      Production Engineering Invariant
                    </div>
                    <p style={{ fontSize: 12, color: "#162A43", margin: 0, lineHeight: 1.55 }}>
                      {topic.deepExplanation.realWorldUsage}
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 4: Annotated Production Implementation */}
              {activeStage === 4 && stagePayload.content.codeSnippet && (
                <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                    Production Annotated Implementation
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 11.5,
                      fontFamily: "monospace",
                      color: "#162A43",
                      overflowX: "auto",
                      lineHeight: 1.55,
                    }}
                  >
                    {stagePayload.content.codeSnippet}
                  </pre>
                </div>
              )}

              {/* Stage 6 & 7: Progressive Hints */}
              {(activeStage === 6 || activeStage === 7) && stagePayload.content.hints && stagePayload.content.hints.length > 0 && (
                <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#667085", textTransform: "uppercase" }}>
                      Engineering Hints ({revealedHints}/{stagePayload.content.hints.length})
                    </span>
                    {revealedHints < stagePayload.content.hints.length && (
                      <button
                        onClick={() => setRevealedHints(revealedHints + 1)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#356AE6",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        + Reveal Hint {revealedHints + 1}
                      </button>
                    )}
                  </div>
                  {stagePayload.content.hints.slice(0, revealedHints).map((h, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: "#EFF4FE",
                        border: "1px solid #D2E0FB",
                        fontSize: 11.5,
                        color: "#162A43",
                        marginBottom: 6,
                      }}
                    >
                      💡 <strong>Hint {i + 1}:</strong> {h}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* External Learning Resources Card */}
            {topic.externalResources && topic.externalResources.length > 0 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: "16px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📺</span>
                    <span>Curated External Resources</span>
                  </h4>
                  <span style={{ fontSize: 10, color: "#667085" }}>CampusX &amp; Official Docs</span>
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
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>{res.title}</span>
                          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700 }}>
                            {res.creatorOrOrg}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>
                          {res.whyRecommended}
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
                          whiteSpace: "nowrap",
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

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: STAGE-SPECIFIC INTERACTIVE WORKSPACE            */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* STAGE 1: ARCHITECTURE OVERVIEW & CONCEPTS MAPPING */}
            {activeStage === 1 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
                    Target Competencies Covered
                  </h4>
                  <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>
                    Verified Invariants
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {topic.conceptsCovered.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 7,
                        background: "#FAF9F6",
                        border: "1px solid #E4E1DA",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ color: "#356AE6", fontWeight: 800 }}>•</span>
                      <span style={{ fontSize: 12, color: "#162A43", fontWeight: 600 }}>{c}</span>
                    </div>
                  ))}
                </div>

                <div style={{ padding: 14, borderRadius: 8, background: "#EFF4FE", border: "1px solid #D2E0FB", marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                    Practical Engineering Outcome
                  </div>
                  <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.5 }}>
                    {topic.practicalOutcome}
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: DEEP CONCEPT COMMON MISTAKES & MEMORY INVARIANTS */}
            {activeStage === 2 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
                    Common Pitfalls &amp; Production Misconceptions
                  </h4>
                  <span style={{ fontSize: 11, color: "#C24141", fontWeight: 700 }}>
                    Critical Traps
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(topic.deepExplanation.commonMistakes || []).map((mistake, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: "#FEF2F2",
                        border: "1px solid #FCA5A5",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", textTransform: "uppercase" }}>
                        ⚠️ Trap #{i + 1}
                      </div>
                      <p style={{ fontSize: 12, color: "#7F1D1D", margin: 0, lineHeight: 1.45 }}>
                        {mistake}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 3: INTERACTIVE VISUAL DEMO */}
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
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
                    Execution State &amp; Dimension Visualizer
                  </h4>
                  <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 700 }}>
                    Step {demoStep + 1} of 3
                  </span>
                </div>

                <div style={{ padding: 24, borderRadius: 8, background: "#FAF9F6", border: "1px solid #E4E1DA", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>
                    {demoStep === 0 ? "📐" : demoStep === 1 ? "🔄" : "⚡"}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                    {demoStep === 0
                      ? "Phase 1: Shape Inspection & Memory Layout"
                      : demoStep === 1
                      ? "Phase 2: Dimension Alignment & Stride Computation"
                      : "Phase 3: SIMD Vectorized Execution / Evaluation"}
                  </div>
                  <p style={{ fontSize: 11.5, color: "#667085", maxWidth: 380, margin: "6px auto 14px", lineHeight: 1.45 }}>
                    {demoStep === 0
                      ? "Verifying contiguous row-major memory buffers and zero-copy view constraints."
                      : demoStep === 1
                      ? "Comparing trailing dimensions from right to left; singular dimensions expanded without data replication."
                      : "Zero-copy vectorized kernel executes in L1/L2 CPU cache."}
                  </p>

                  <div style={{ display: "inline-flex", gap: 8 }}>
                    <button
                      onClick={() => setDemoStep(Math.max(0, demoStep - 1))}
                      disabled={demoStep === 0}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "1px solid #E4E1DA",
                        background: "#FFFFFF",
                        color: demoStep === 0 ? "#98A2B3" : "#162A43",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: demoStep === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      ← Previous Phase
                    </button>
                    <button
                      onClick={() => setDemoStep(Math.min(2, demoStep + 1))}
                      disabled={demoStep === 2}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: demoStep === 2 ? "#E4E1DA" : "#356AE6",
                        color: demoStep === 2 ? "#98A2B3" : "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: demoStep === 2 ? "not-allowed" : "pointer",
                      }}
                    >
                      Next Phase →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: WORKED EXAMPLE LINE-BY-LINE ANNOTATIONS */}
            {activeStage === 4 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
                    Line-by-Line Engineering Invariants
                  </h4>
                  <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 700 }}>
                    Step Walkthrough
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ padding: "10px 12px", borderRadius: 6, background: "#FAF9F6", border: "1px solid #E4E1DA" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase" }}>Line 1-3: Initialization</div>
                    <div style={{ fontSize: 11.5, color: "#162A43", marginTop: 2 }}>Importing modules and preparing zero-copy contiguous buffers.</div>
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: 6, background: "#FAF9F6", border: "1px solid #E4E1DA" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase" }}>Line 4-8: Core Transformation</div>
                    <div style={{ fontSize: 11.5, color: "#162A43", marginTop: 2 }}>Enforcing shape compatibility and applying vectorized operations.</div>
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: 6, background: "#FAF9F6", border: "1px solid #E4E1DA" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase" }}>Line 9-12: Invariant Check</div>
                    <div style={{ fontSize: 11.5, color: "#162A43", marginTop: 2 }}>Asserting expected dimensions and verifying output state.</div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 5, 6, 7, 8: INTERACTIVE CODE SANDBOX & RUNNER */}
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
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
                    {activeStage === 5
                      ? "Interactive Experiment Playground"
                      : activeStage === 6
                      ? "Guided Coding Sandbox"
                      : activeStage === 7
                      ? "Bug Diagnostic & Fix Workspace"
                      : "Independent Verification Assessment"}
                  </h4>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#FAF9F6", color: "#667085", border: "1px solid #E4E1DA", fontWeight: 700 }}>
                    Python / Pyodide Sandbox
                  </span>
                </div>

                {/* Code Textarea */}
                <div style={{ position: "relative" }}>
                  <textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    rows={12}
                    style={{
                      width: "100%",
                      fontFamily: "monospace",
                      fontSize: 12,
                      lineHeight: 1.5,
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid #E4E1DA",
                      background: "#162A43",
                      color: "#F6F5F1",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Execution Button */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={() => {
                      if (activeStage === 5 || activeStage === 6 || activeStage === 8) {
                        setCodeContent(stagePayload.content.starterCode || "");
                      } else if (activeStage === 7) {
                        setCodeContent(stagePayload.content.brokenCode || "");
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#667085",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reset Starter Code
                  </button>

                  <button
                    onClick={handleExecuteSandbox}
                    disabled={isExecuting}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 6,
                      background: isExecuting ? "#98A2B3" : "#356AE6",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isExecuting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 1px 2px rgba(53, 106, 230, 0.2)",
                    }}
                  >
                    <span>{isExecuting ? "Executing..." : "▶ Run & Evaluate"}</span>
                  </button>
                </div>

                {/* Execution Console Output */}
                {executionOutput && (
                  <div
                    style={{
                      borderRadius: 8,
                      padding: 12,
                      background: executionOutput.stderr ? "#FEF2F2" : "#F0FDF4",
                      border: `1px solid ${executionOutput.stderr ? "#FCA5A5" : "#86EFAC"}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color: executionOutput.stderr ? "#991B1B" : "#166534",
                        }}
                      >
                        {executionOutput.stderr ? "Execution Error / Trace" : "Execution Standard Output (stdout)"}
                      </span>
                      <span style={{ fontSize: 10, color: "#667085" }}>
                        ⏱ {executionOutput.timeMs}ms
                      </span>
                    </div>

                    <pre
                      style={{
                        margin: 0,
                        fontFamily: "monospace",
                        fontSize: 11,
                        lineHeight: 1.45,
                        color: executionOutput.stderr ? "#7F1D1D" : "#14532D",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {executionOutput.stderr || executionOutput.stdout}
                    </pre>
                  </div>
                )}

                {/* Stage 8 Success & DNA Sync Banner */}
                {activeStage === 8 && challengeSuccess && (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      background: "#F0FDF4",
                      border: "1px solid #86EFAC",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16 }}>🎉</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>
                        Topic Mastered &amp; Student DNA Synchronized!
                      </span>
                    </div>
                    <p style={{ fontSize: 11.5, color: "#14532D", margin: 0 }}>
                      Evidence of mastery for <strong>{topic.title}</strong> has been logged into your verifiable skill portfolio.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── STAGE NAVIGATION CONTROLS (PREVIOUS / NEXT) ── */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <button
                onClick={() => goToStage((activeStage - 1) as CanonicalStageNumber)}
                disabled={activeStage === 1}
                style={{
                  padding: "7px 16px",
                  borderRadius: 6,
                  border: "1px solid #E4E1DA",
                  background: "#FFFFFF",
                  color: activeStage === 1 ? "#98A2B3" : "#162A43",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: activeStage === 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Previous Stage
              </button>

              <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>
                Stage {activeStage} of 8
              </div>

              {activeStage < 8 ? (
                <button
                  onClick={advanceNextStage}
                  style={{
                    padding: "7px 18px",
                    borderRadius: 6,
                    border: "none",
                    background: "#162A43",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Next Stage →
                </button>
              ) : (
                <button
                  onClick={handleCompleteTopic}
                  disabled={isSubmittingChallenge}
                  style={{
                    padding: "7px 20px",
                    borderRadius: 6,
                    border: "none",
                    background: "#2E7D5B",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isSubmittingChallenge ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmittingChallenge ? "Finalizing..." : "Complete & Verify DNA ✓"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
