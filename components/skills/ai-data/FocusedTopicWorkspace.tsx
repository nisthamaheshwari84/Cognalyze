"use client";

import React, { useState, useEffect, useMemo } from "react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import {
  TaxonomyTopic,
  TaxonomySubject,
  TaxonomyModule,
  TaxonomySubtopic,
  getNextAndPreviousTopic,
  getTopicLocation,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";
import CompanyPracticeEngine from "@/components/skills/ai-data/CompanyPracticeEngine";
import TopicAssessmentView from "@/components/skills/ai-data/TopicAssessmentView";
import TopicInterviewPrepView from "@/components/skills/ai-data/TopicInterviewPrepView";
import TopicMasteryDnaView from "@/components/skills/ai-data/TopicMasteryDnaView";
import InteractiveDiagramStudio from "@/components/skills/ai-data/visual-studio/InteractiveDiagramStudio";
import ConversationalAiTeacher from "@/components/skills/ai-data/ConversationalAiTeacher";
import IntelligentNotesWorkspace from "@/components/skills/ai-data/IntelligentNotesWorkspace";
import PersonalizedRoadmapView from "@/components/skills/ai-data/PersonalizedRoadmapView";

export type FocusedWorkspaceTab = "learn" | "practice" | "revise" | "apply";

export interface FocusedTopicWorkspaceProps {
  topic: TaxonomyTopic;
  subject: TaxonomySubject;
  module: TaxonomyModule;
  candidateId: string;
  activeRole: TargetRoleSlug;
  isCompleted: boolean;
  onTopicComplete: (topicId: string) => void;
  onNavigateTopic: (topicId: string) => void;
  onOpenAiMentor: () => void;
  onOpenCodingArena?: (topicId: string) => void;
}

export default function FocusedTopicWorkspace({
  topic,
  subject,
  module,
  candidateId,
  activeRole,
  isCompleted,
  onTopicComplete,
  onNavigateTopic,
  onOpenAiMentor,
  onOpenCodingArena,
}: FocusedTopicWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<FocusedWorkspaceTab>("learn");
  const [showVisualStudio, setShowVisualStudio] = useState<boolean>(false);
  const [practiceSubTab, setPracticeSubTab] = useState<"questions" | "assessment">("questions");
  const [reviseSubTab, setReviseSubTab] = useState<"notes" | "interview">("notes");
  const [language, setLanguage] = useState<"english" | "hinglish">("english");
  const [code, setCode] = useState<string>(
    topic.starterCode ||
      `# Python Practice for: ${topic.title}\n\ndef solution():\n    print("Hello from Cognalyze AI & Data Arena!")\n\nsolution()\n`
  );
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    stdout?: string;
    stderr?: string;
    executionTimeMs?: number;
    rowCount?: number;
    rows?: any[];
    columns?: string[];
    isError?: boolean;
  } | null>(null);

  const [isVerifyingDna, setIsVerifyingDna] = useState(false);
  const [dnaSyncSuccess, setDnaSyncSuccess] = useState(isCompleted);

  // Subtopics resolution
  const subtopics: TaxonomySubtopic[] = useMemo(() => {
    if (topic.subtopics && topic.subtopics.length > 0) {
      return topic.subtopics.map((st: TaxonomySubtopic | string, idx) =>
        typeof st === "string"
          ? { id: `${topic.id}-sub-${idx + 1}`, title: st, order: idx + 1, concepts: [st] }
          : st
      );
    }
    return [
      {
        id: `${topic.id}-sub-1`,
        title: topic.title,
        order: 1,
        concepts: topic.conceptsCovered || [topic.title],
      },
    ];
  }, [topic]);

  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>(subtopics[0]?.id || "");

  // Update active subtopic when topic changes
  useEffect(() => {
    if (subtopics.length > 0) {
      setSelectedSubtopicId(subtopics[0].id);
    }
  }, [subtopics]);

  const activeSubtopic = subtopics.find((s) => s.id === selectedSubtopicId) || subtopics[0];

  // Determine whether this is a SQL topic or Python/general topic
  const isSqlTopic = subject.id === "subj_sql" || subject.slug === "sql" || topic.id.startsWith("sql-");

  // Reset code and state when topic changes
  useEffect(() => {
    if (isSqlTopic) {
      setCode(
        topic.starterCode ||
          `-- SQL Query for: ${topic.title}\nSELECT \n  customer_id, \n  COUNT(order_id) AS total_orders,\n  SUM(total_amount) AS lifetime_spend\nFROM orders\nGROUP BY customer_id\nORDER BY lifetime_spend DESC\nLIMIT 10;`
      );
    } else {
      setCode(
        topic.starterCode ||
          `# Practical Implementation for: ${topic.title}\n\ndef inspect_concept():\n    print("Executing ${topic.title}...")\n    # Implement your verification below\n    return True\n\nif __name__ == "__main__":\n    result = inspect_concept()\n    print(f"Outcome: {result}")\n`
      );
    }
    setExecutionResult(null);
    setDnaSyncSuccess(isCompleted);
  }, [topic.id, isSqlTopic, isCompleted]);

  // Sequential previous and next topic
  const nav = getNextAndPreviousTopic(topic.id);
  const roleRelevance = topic.roleRelevance?.[activeRole];
  const roleProfile = TARGET_ROLE_PROFILES[activeRole];

  // Execute Code / SQL in Sandbox
  const handleExecute = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    try {
      if (isSqlTopic) {
        const res = await fetch("/api/skills/ai-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "execute_sql",
            candidateId,
            sql: code,
            datasetId: "ecommerce_analytics",
          }),
        });
        const data = await res.json();
        if (data.result) {
          setExecutionResult({
            rows: data.result.rows || [],
            columns: data.result.columns || [],
            rowCount: data.result.rowCount ?? (data.result.rows ? data.result.rows.length : 0),
            executionTimeMs: data.result.executionTimeMs || 12,
            isError: !data.result.success,
            stderr: data.result.errorMessage,
          });
        } else {
          setExecutionResult({
            isError: true,
            stderr: data.error || "Execution failed.",
          });
        }
      } else {
        const res = await fetch("/api/skills/python-arena", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "execute_code",
            candidateId,
            code,
          }),
        });
        const data = await res.json();
        if (data.result) {
          setExecutionResult({
            stdout: data.result.stdout || "(Program finished without stdout)",
            stderr: data.result.stderr || "",
            executionTimeMs: data.result.executionTimeMs || 15,
            isError: !!data.result.stderr,
          });
        } else {
          setExecutionResult({
            isError: true,
            stderr: data.error || "Python execution sandbox error.",
          });
        }
      }
    } catch (err: any) {
      setExecutionResult({
        isError: true,
        stderr: err.message || "Network execution error.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Verify Mastery & Update Student DNA
  const handleVerifyMastery = async () => {
    setIsVerifyingDna(true);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_lab_assessment",
          candidateId,
          trackSlug: "genai_llm",
          lessonSlug: topic.id,
          exerciseType: isSqlTopic ? "sql_lab" : "code_lab",
          score: 100,
          passed: true,
          assisted: false,
          dimensions: {
            practical_implementation: 95,
            edge_case_handling: 90,
            execution_speed: 95,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDnaSyncSuccess(true);
        onTopicComplete(topic.id);
      }
    } catch (err) {
      console.error("Failed to sync Student DNA:", err);
    } finally {
      setIsVerifyingDna(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", maxWidth: 1060, margin: "0 auto", width: "100%" }}>
      
      {/* ── TOP HEADER BREADCRUMBS & NAVIGATION ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#667085", fontWeight: 600, marginBottom: 4 }}>
            <span>{subject.icon} {subject.title}</span>
            <span>/</span>
            <span>{module.title}</span>
            <span>/</span>
            <span style={{ color: "#356AE6", fontWeight: 700 }}>Topic {topic.order}</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px", color: "#162A43", letterSpacing: "-0.03em" }}>
            {topic.title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 4,
                background: topic.difficulty === "beginner" ? "#EAF4EE" : topic.difficulty === "intermediate" ? "#EFF4FE" : "#FEF7ED",
                color: topic.difficulty === "beginner" ? "#2E7D5B" : topic.difficulty === "intermediate" ? "#356AE6" : "#B7791F",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {topic.difficulty}
            </span>
            <span style={{ fontSize: 11, color: "#667085" }}>
              ⏱️ {topic.estimatedMinutes} mins
            </span>
            {roleRelevance && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: roleRelevance.importance === "CRITICAL" ? "#FEE2E2" : "#F3F4F6",
                  color: roleRelevance.importance === "CRITICAL" ? "#991B1B" : "#4B5563",
                  fontWeight: 700,
                }}
                title={roleRelevance.why}
              >
                ★ {roleRelevance.importance} for {roleProfile?.title || "Role"}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls: Language Toggle & AI Mentor Launcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", background: "#F6F5F1", borderRadius: 6, padding: 2, border: "1px solid #E4E1DA" }}>
            <button
              onClick={() => setLanguage("english")}
              style={{
                padding: "4px 10px",
                borderRadius: 4,
                border: "none",
                background: language === "english" ? "#FFFFFF" : "transparent",
                color: language === "english" ? "#162A43" : "#667085",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("hinglish")}
              style={{
                padding: "4px 10px",
                borderRadius: 4,
                border: "none",
                background: language === "hinglish" ? "#FFFFFF" : "transparent",
                color: language === "hinglish" ? "#162A43" : "#667085",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Hinglish
            </button>
          </div>

          <button
            onClick={onOpenAiMentor}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #D2E0FB",
              background: "#EFF4FE",
              color: "#356AE6",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span>🤖</span>
            <span>AI Mentor</span>
          </button>
        </div>
      </div>

      {/* ── WORKSPACE FOCUS NAVIGATION TABS ── */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #E4E1DA",
          gap: 6,
          marginBottom: 22,
          background: "#FFFFFF",
          padding: "6px 10px 0",
          borderRadius: 8,
          border: "1px solid #E4E1DA",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("learn")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderBottom: activeTab === "learn" ? "2.5px solid #356AE6" : "2.5px solid transparent",
            background: "transparent",
            color: activeTab === "learn" ? "#162A43" : "#667085",
            fontSize: 13,
            fontWeight: activeTab === "learn" ? 800 : 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <span>📖</span>
          <span>1. Learn &amp; Mechanics</span>
        </button>

        <button
          onClick={() => setActiveTab("practice")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderBottom: activeTab === "practice" ? "2.5px solid #356AE6" : "2.5px solid transparent",
            background: "transparent",
            color: activeTab === "practice" ? "#162A43" : "#667085",
            fontSize: 13,
            fontWeight: activeTab === "practice" ? 800 : 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <span>⚡</span>
          <span>2. Practise &amp; Challenges</span>
        </button>

        <button
          onClick={() => setActiveTab("revise")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderBottom: activeTab === "revise" ? "2.5px solid #356AE6" : "2.5px solid transparent",
            background: "transparent",
            color: activeTab === "revise" ? "#162A43" : "#667085",
            fontSize: 13,
            fontWeight: activeTab === "revise" ? 800 : 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <span>📝</span>
          <span>3. Revise &amp; Notes</span>
        </button>

        <button
          onClick={() => setActiveTab("apply")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderBottom: activeTab === "apply" ? "2.5px solid #356AE6" : "2.5px solid transparent",
            background: "transparent",
            color: activeTab === "apply" ? "#162A43" : "#667085",
            fontSize: 13,
            fontWeight: activeTab === "apply" ? 800 : 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <span>🚀</span>
          <span>4. Apply &amp; Evidence</span>
          {dnaSyncSuccess && (
            <span style={{ fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "#2E7D5B", color: "#FFFFFF", fontWeight: 700 }}>
              ✓
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: LEARN & CONCEPT WORKSPACE ── */}
      {activeTab === "learn" && (
        <>
          {/* Learning Objectives */}
          {topic.learningObjectives && topic.learningObjectives.length > 0 && (
            <div
              style={{
                background: "#F6F5F1",
                border: "1px solid #E4E1DA",
                borderRadius: 8,
                padding: "14px 18px",
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#162A43", marginBottom: 6 }}>
                🎯 What You Will Understand &amp; Build
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
                {topic.learningObjectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Visual Studio Inline Tool */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 8,
              padding: "12px 18px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🎨</span>
              <div>
                <strong style={{ fontSize: 13, color: "#162A43", display: "block" }}>
                  Interactive Visual Diagram Studio
                </strong>
                <span style={{ fontSize: 11, color: "#667085" }}>
                  Inspect live memory layouts, CPython bytecode objects, and dataflow execution traces.
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowVisualStudio((prev) => !prev)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "1px solid #356AE6",
                background: showVisualStudio ? "#162A43" : "#EFF4FE",
                color: showVisualStudio ? "#FFFFFF" : "#356AE6",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {showVisualStudio ? "Hide Visual Studio" : "Open Visual Studio"}
            </button>
          </div>

          {showVisualStudio && (
            <div style={{ marginBottom: 28 }}>
              <InteractiveDiagramStudio topicTitle={topic.title} />
            </div>
          )}

          {/* SECTION 1: CONTEXT, INTUITION & REAL-WORLD ANALOGY */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>💡</span>
              <span>Intuitive Context &amp; Why It Exists</span>
            </h2>
            
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#17191C", lineHeight: 1.65 }}>
                {language === "hinglish" && topic.contextAndIntuition?.hinglish
                  ? topic.contextAndIntuition.hinglish
                  : topic.contextAndIntuition?.english || "This concept forms a core building block in modern AI, ML, and data pipelines."}
              </p>

              {topic.contextAndIntuition?.whyExists && (
                <div style={{ padding: "10px 14px", background: "#EFF4FE", borderRadius: 7, borderLeft: "4px solid #356AE6", marginBottom: 12 }}>
                  <strong style={{ fontSize: 11.5, color: "#162A43" }}>Why It Was Engineered: </strong>
                  <span style={{ fontSize: 12, color: "#2B4C85" }}>{topic.contextAndIntuition.whyExists}</span>
                </div>
              )}

              {topic.contextAndIntuition?.whatWasUsedBefore && (
                <div style={{ fontSize: 11.5, color: "#667085", lineHeight: 1.5 }}>
                  <strong>What was used before: </strong> {topic.contextAndIntuition.whatWasUsedBefore}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: HOW IT WORKS INTERNALLY & DEEP MECHANICS */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🔬</span>
              <span>Internal Mechanics &amp; Architecture</span>
            </h2>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 13.5, color: "#17191C", lineHeight: 1.7, marginBottom: 16 }}>
                <MarkdownRenderer
                  content={
                    language === "hinglish" && topic.deepExplanation?.hinglish
                      ? topic.deepExplanation.hinglish
                      : topic.deepExplanation?.english || "Detailed technical explanation."
                  }
                />
              </div>

              {topic.deepExplanation?.internalMechanics && (
                <div style={{ background: "#0B192C", borderRadius: 8, padding: "12px 16px", color: "#E2E8F0", fontFamily: "monospace", fontSize: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#38BDF8", fontWeight: 700, marginBottom: 4 }}>
                    Execution Lifecycle / Data Flow
                  </div>
                  {topic.deepExplanation.internalMechanics}
                </div>
              )}

              {topic.deepExplanation?.realWorldUsage && (
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                  <strong style={{ color: "#162A43" }}>🏢 Production Industry Usage: </strong>
                  {topic.deepExplanation.realWorldUsage}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: SUBTOPIC BREAKDOWN */}
          {subtopics && subtopics.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📑</span>
                  <span>Independent Subtopics (Each with 50 Questions)</span>
                </h2>
                <button
                  onClick={() => setActiveTab("practice")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#356AE6",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Start Practice Bank ➔
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                {subtopics.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubtopicId(sub.id);
                      setActiveTab("practice");
                    }}
                    style={{
                      background: selectedSubtopicId === sub.id ? "#EFF4FE" : "#F9F8F5",
                      border: selectedSubtopicId === sub.id ? "1.5px solid #356AE6" : "1px solid #E4E1DA",
                      borderRadius: 8,
                      padding: "12px 14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>
                        {sub.order}. {sub.title}
                      </div>
                      <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 700 }}>50 Qs</span>
                    </div>
                    {sub.concepts && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {sub.concepts.map((c, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 9.5,
                              padding: "1px 6px",
                              borderRadius: 3,
                              background: "#FFFFFF",
                              border: "1px solid #E4E1DA",
                              color: "#667085",
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 4: INTERACTIVE CODE / SQL SANDBOX */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚡</span>
                <span>Interactive {isSqlTopic ? "SQL" : "Python"} Sandbox (Real Execution)</span>
              </h2>
              <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>
                ● Live Environment Ready
              </span>
            </div>

            <div style={{ background: "#0B192C", borderRadius: 10, overflow: "hidden", border: "1px solid #1E293B", boxShadow: "0 4px 14px rgba(11,25,44,0.15)" }}>
              {/* Editor Header Bar */}
              <div style={{ padding: "8px 16px", background: "#0F172A", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{isSqlTopic ? "🗄️" : "🐍"}</span>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace", fontWeight: 600 }}>
                    {isSqlTopic ? "sqlite://sandbox_database" : "cpython-3.11-sandbox"}
                  </span>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={isRunning}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: isRunning ? "#475569" : "#10B981",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isRunning ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 6px rgba(16,185,129,0.3)",
                  }}
                >
                  <span>{isRunning ? "⏳ Executing..." : isSqlTopic ? "▶ Execute SQL" : "▶ Run Code"}</span>
                </button>
              </div>

              {/* Textarea Code Input */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={10}
                spellCheck={false}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "#0B192C",
                  color: "#F8FAFC",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />

              {/* Execution Output Console */}
              {executionResult && (
                <div style={{ borderTop: "1px solid #1E293B", background: "#020617", padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 11 }}>
                    <span style={{ color: executionResult.isError ? "#F87171" : "#34D399", fontWeight: 700 }}>
                      {executionResult.isError ? "✕ Execution Produced Error" : "✓ Execution Succeeded"}
                    </span>
                    <span style={{ color: "#64748B" }}>
                      Execution time: {executionResult.executionTimeMs}ms
                    </span>
                  </div>

                  {/* Stdout / Stderr for Python */}
                  {!isSqlTopic && (
                    <>
                      {executionResult.stdout && (
                        <pre style={{ margin: 0, color: "#E2E8F0", fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
                          {executionResult.stdout}
                        </pre>
                      )}
                      {executionResult.stderr && (
                        <pre style={{ margin: "6px 0 0", color: "#FCA5A5", fontFamily: "monospace", fontSize: 11.5, whiteSpace: "pre-wrap" }}>
                          {executionResult.stderr}
                        </pre>
                      )}
                    </>
                  )}

                  {/* Tabular Output for SQL */}
                  {isSqlTopic && executionResult.rows && executionResult.rows.length > 0 && (
                    <div style={{ overflowX: "auto", maxHeight: 220, marginTop: 6 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, color: "#E2E8F0", fontFamily: "monospace" }}>
                        <thead>
                          <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155" }}>
                            {executionResult.columns?.map((col) => (
                              <th key={col} style={{ padding: "6px 10px", textAlign: "left", color: "#93C5FD" }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {executionResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: "1px solid #1E293B" }}>
                              {executionResult.columns?.map((col) => (
                                <td key={col} style={{ padding: "5px 10px" }}>
                                  {String(row[col] ?? "NULL")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ fontSize: 10, color: "#64748B", marginTop: 6 }}>
                        Showing {executionResult.rowCount} returned record(s).
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 5: COMMON MISTAKES & INTERVIEW CONNECTIONS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 28 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span>⚠️</span>
                <span>Common Developer Mistakes</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                {(topic.deepExplanation?.commonMistakes || [
                  "Confusing pass-by-reference with pass-by-object-reference semantics.",
                  "Neglecting memory overhead in unvectorized loops.",
                  "Ignoring data leakage across train and test splits.",
                ]).map((mis, i) => (
                  <li key={i}>{mis}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🏢</span>
                <span>How Top Companies Test This</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                Interviews at Google, Meta, Uber, and Stripe evaluate whether you understand the trade-offs of this concept under production constraints, rather than mere textbook definitions.
              </p>
              <div style={{ marginTop: 10, padding: "8px 10px", background: "#F6F5F1", borderRadius: 6, fontSize: 11, color: "#162A43", fontWeight: 600 }}>
                💡 Tip: Always explain time complexity, memory allocation, and failure modes when defending your implementation.
              </div>
            </div>
          </div>

          {/* SECTION 6: FAST TRACK ACTIONS */}
          <div
            style={{
              background: dnaSyncSuccess ? "#EAF4EE" : "#FFFFFF",
              border: dnaSyncSuccess ? "1.5px solid #2E7D5B" : "1.5px solid #356AE6",
              borderRadius: 10,
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 36,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>🎓</span>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: dnaSyncSuccess ? "#2E7D5B" : "#356AE6" }}>
                  {dnaSyncSuccess ? "Verified Student DNA Evidence" : "Demonstrate Practical Mastery"}
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "#162A43" }}>
                {dnaSyncSuccess ? "Competency Verified & Recorded" : `Ready to Practice ${topic.title}?`}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#667085", maxWidth: 540, lineHeight: 1.5 }}>
                {dnaSyncSuccess
                  ? "Your practical execution has been verified and permanently registered in your Cognalyze Student DNA skill profile."
                  : "Jump into the 50-question Practice Bank or take the 20-minute Topic Assessment to certify your mastery."}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setActiveTab("practice");
                  setPracticeSubTab("questions");
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 7,
                  border: "1px solid #356AE6",
                  background: "#FFFFFF",
                  color: "#356AE6",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Open Practice Bank (50 Qs)
              </button>
              <button
                onClick={() => {
                  setActiveTab("practice");
                  setPracticeSubTab("assessment");
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 7,
                  border: "none",
                  background: "#162A43",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Take Assessment ➔
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── SECTION B: PRACTISE & IMPLEMENTATION ── */}
      {activeTab === "practice" && (
        <div style={{ marginBottom: 36 }}>
          {/* Quick Launch Banner for Topic-Linked Coding Arena */}
          <div
            style={{
              background: "linear-gradient(90deg, #EFF4FE 0%, #E8EEFB 100%)",
              border: "1px solid #D2E0FB",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>⚡</span>
                <strong style={{ fontSize: 14, color: "#162A43" }}>
                  Topic-Linked Coding Arena: {topic.title}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
                Practice sandboxed Python 3 / SQL test cases, debugging challenges, and interview questions.
              </p>
            </div>
            {onOpenCodingArena && (
              <button
                onClick={() => onOpenCodingArena(topic.id)}
                style={{
                  padding: "9px 20px",
                  borderRadius: 10,
                  background: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(53,106,230,0.25)",
                  transition: "all 0.15s ease",
                }}
              >
                Practise This Topic in Full Coding Arena ⚡
              </button>
            )}
          </div>

          {/* Sub-toggle between Practice Questions and Timed Assessment */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => setPracticeSubTab("questions")}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid " + (practiceSubTab === "questions" ? "#162A43" : "#E4E1DA"),
                background: practiceSubTab === "questions" ? "#162A43" : "#FFFFFF",
                color: practiceSubTab === "questions" ? "#FFFFFF" : "#162A43",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🛠️ Practice Questions &amp; Output Prediction
            </button>
            <button
              onClick={() => setPracticeSubTab("assessment")}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid " + (practiceSubTab === "assessment" ? "#162A43" : "#E4E1DA"),
                background: practiceSubTab === "assessment" ? "#162A43" : "#FFFFFF",
                color: practiceSubTab === "assessment" ? "#FFFFFF" : "#162A43",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⏱️ Timed Topic Assessment
            </button>
          </div>

          {practiceSubTab === "questions" ? (
            <CompanyPracticeEngine
              topic={topic}
              subject={subject}
              candidateId={candidateId}
              targetRole={activeRole}
              onQuestionCompleted={(qId, isCorrect) => {
                if (isCorrect) {
                  // Telemetry
                }
              }}
            />
          ) : (
            <TopicAssessmentView
              topic={topic}
              subtopic={activeSubtopic}
              subject={subject}
              candidateId={candidateId}
              targetRole={activeRole}
              onAssessmentCompleted={(score, passed) => {
                if (passed) {
                  setDnaSyncSuccess(true);
                  onTopicComplete(topic.id);
                }
              }}
              onSwitchToPractice={() => setPracticeSubTab("questions")}
            />
          )}
        </div>
      )}

      {/* ── SECTION C: REVISE & NOTES ── */}
      {activeTab === "revise" && (
        <div style={{ marginBottom: 36 }}>
          {/* Sub-toggle between Notes and Interview Prep */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => setReviseSubTab("notes")}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid " + (reviseSubTab === "notes" ? "#162A43" : "#E4E1DA"),
                background: reviseSubTab === "notes" ? "#162A43" : "#FFFFFF",
                color: reviseSubTab === "notes" ? "#FFFFFF" : "#162A43",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📝 Canonical Notes &amp; Personal Weaknesses
            </button>
            <button
              onClick={() => setReviseSubTab("interview")}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid " + (reviseSubTab === "interview" ? "#162A43" : "#E4E1DA"),
                background: reviseSubTab === "interview" ? "#162A43" : "#FFFFFF",
                color: reviseSubTab === "interview" ? "#FFFFFF" : "#162A43",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🎯 Interview Defense &amp; Company Questions
            </button>
          </div>

          {reviseSubTab === "notes" ? (
            <IntelligentNotesWorkspace
              topicId={topic.id}
              topicTitle={topic.title}
              candidateId={candidateId}
              targetRole={roleProfile?.title || "AI Engineer"}
              onOpenAiTeacher={() => onOpenAiMentor()}
              onOpenPracticeDrill={() => setActiveTab("practice")}
            />
          ) : (
            <TopicInterviewPrepView
              topic={topic}
              subtopic={activeSubtopic}
              subject={subject}
              candidateId={candidateId}
              targetRole={activeRole}
              onOpenAiMentor={onOpenAiMentor}
            />
          )}
        </div>
      )}

      {/* ── SECTION D: APPLY & EVIDENCE ── */}
      {activeTab === "apply" && (
        <div style={{ marginBottom: 36 }}>
          <TopicMasteryDnaView
            topic={topic}
            subtopic={activeSubtopic}
            subject={subject}
            candidateId={candidateId}
            targetRole={activeRole}
            isCompleted={dnaSyncSuccess}
            onRetakeAssessment={() => {
              setActiveTab("practice");
              setPracticeSubTab("assessment");
            }}
          />
        </div>
      )}

      {/* ── BOTTOM SEQUENTIAL NAVIGATION ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E4E1DA", paddingTop: 20 }}>
        {nav.previous ? (
          <button
            onClick={() => onNavigateTopic(nav.previous!.topic.id)}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #E4E1DA",
              background: "#FFFFFF",
              color: "#162A43",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>← Previous:</span>
            <span style={{ color: "#667085", fontWeight: 500, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {nav.previous.topic.title}
            </span>
          </button>
        ) : <div />}

        {nav.next ? (
          <button
            onClick={() => onNavigateTopic(nav.next!.topic.id)}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#162A43",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Next:</span>
            <span style={{ color: "#93C5FD", fontWeight: 600, maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {nav.next.topic.title}
            </span>
            <span>➔</span>
          </button>
        ) : <div />}
      </div>
    </div>
  );
}
