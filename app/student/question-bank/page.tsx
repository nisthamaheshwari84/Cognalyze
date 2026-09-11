"use client";

import React, { useState } from "react";
import AppNav from "@/components/AppNav";
import {
  SEED_CS_INTERVIEW_QUESTIONS,
  SEED_BEHAVIORAL_QUESTIONS,
  SEED_APTITUDE_QUESTIONS
} from "@/lib/skill-hub-store";

export default function StudentQuestionBankPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | "cs" | "behavioral" | "aptitude">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const csQuestions = SEED_CS_INTERVIEW_QUESTIONS.map(q => ({
    id: q.id,
    type: "CS Technical",
    title: q.question,
    domain: q.domain.toUpperCase(),
    difficulty: q.difficulty,
    expectedPoints: q.expected_points,
    idealAnswer: q.ideal_answer,
    followUp: q.follow_up
  }));

  const hrQuestions = SEED_BEHAVIORAL_QUESTIONS.map(q => ({
    id: q.id,
    type: "Behavioral HR",
    title: q.question,
    domain: q.track_type === "service_hr" ? "Service HR" : "FAANG STAR (LP)",
    difficulty: "Medium",
    expectedPoints: [
      `Situation: ${q.star_rubric.situation}`,
      `Task: ${q.star_rubric.task}`,
      `Action: ${q.star_rubric.action}`,
      `Result: ${q.star_rubric.result}`
    ],
    idealAnswer: q.ideal_response,
    followUp: q.context_tip
  }));

  const aptQuestions = SEED_APTITUDE_QUESTIONS.map(q => ({
    id: q.id,
    type: "Aptitude",
    title: q.question,
    domain: q.category.replace(/_/g, " ").toUpperCase(),
    difficulty: q.difficulty,
    expectedPoints: [
      `Correct: Option ${q.correct_option_index + 1} (${q.options[q.correct_option_index]})`,
      ...q.options
    ],
    idealAnswer: q.explanation,
    followUp: q.shortcut_tip || `Company: ${q.company_tag}`
  }));

  const allQuestions = [...csQuestions, ...hrQuestions, ...aptQuestions];

  const filteredQuestions = allQuestions.filter(q => {
    if (activeCategory === "cs" && q.type !== "CS Technical") return false;
    if (activeCategory === "behavioral" && q.type !== "Behavioral HR") return false;
    if (activeCategory === "aptitude" && q.type !== "Aptitude") return false;

    if (searchQuery.trim()) {
      const qText = (q.title + " " + q.domain + " " + q.type).toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#818cf8", fontWeight: 800 }}>
                PLACEMENT ARCHIVE
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {allQuestions.length} Verified Questions
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              📚 Placement Question Bank Archive
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 650, lineHeight: 1.5 }}>
              Search real campus questions asked in TCS iON, Infosys, Amazon, and Google drives. Study ideal solutions and grading rubrics.
            </p>
          </div>

          {/* Search Bar */}
          <div style={{ minWidth: 280 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by topic, SQL, deadlock, bond..."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "white",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { key: "all", label: `All Questions (${allQuestions.length})` },
            { key: "cs", label: `CS Fundamentals (${csQuestions.length})` },
            { key: "behavioral", label: `Behavioral & HR (${hrQuestions.length})` },
            { key: "aptitude", label: `Aptitude Papers (${aptQuestions.length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key as any)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: activeCategory === tab.key ? "#6366f1" : "rgba(255, 255, 255, 0.05)",
                color: activeCategory === tab.key ? "white" : "#94a3b8"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* QUESTION LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredQuestions.map((q) => {
            const isExpanded = expandedId === q.id;
            return (
              <div
                key={q.id}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: isExpanded ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  transition: "all 0.15s ease"
                }}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", gap: 16 }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontWeight: 800,
                          background: q.type === "CS Technical" ? "rgba(56,189,248,0.15)" : q.type === "Behavioral HR" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                          color: q.type === "CS Technical" ? "#38bdf8" : q.type === "Behavioral HR" ? "#fbbf24" : "#f87171"
                        }}
                      >
                        {q.type}
                      </span>
                      <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700 }}>
                        {q.domain}
                      </span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                        • Difficulty: {q.difficulty}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", margin: 0, lineHeight: 1.45 }}>
                      {q.title}
                    </h3>
                  </div>

                  <button
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "none",
                      color: "#94a3b8",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      flexShrink: 0
                    }}
                  >
                    {isExpanded ? "Collapse ▲" : "View Answer ▼"}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    {/* Rubric Points */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>
                        Interviewer Evaluation Points:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {q.expectedPoints?.map((pt: string, idx: number) => (
                          <span key={idx} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "rgba(99,102,241,0.1)", color: "#c7d2fe" }}>
                            ✓ {pt}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Ideal Answer / Solution */}
                    <div style={{ padding: "14px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: 11, color: "#34d399", fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>
                        Gold Standard Solution / Answer:
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: q.type === "CS Technical" ? "monospace" : "inherit" }}>
                        {q.idealAnswer}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
