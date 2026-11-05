"use client";

import React from "react";
import { AdaptiveRecruiterQuestion } from "@/lib/roles/types";

interface AdaptiveRoleClarificationCardProps {
  questions: AdaptiveRecruiterQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
}

export default function AdaptiveRoleClarificationCard({
  questions,
  answers,
  onAnswerChange,
}: AdaptiveRoleClarificationCardProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: 24,
        padding: "20px 24px",
        background: "var(--color-info-bg)",
        border: "1px solid #D2E0FB",
        borderRadius: 10,
        boxShadow: "0 1px 3px rgba(53, 106, 230, 0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0 }}>
              Critical Role Context Clarifications ({questions.length})
            </h4>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              The Interviewer Intelligence Engine generated these questions to calibrate assessment difficulty and prevent generic questions.
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 4,
            background: "var(--surface)",
            color: "var(--brand-cobalt)",
            border: "1px solid #D2E0FB",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Adaptive Calibration
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {questions.map((q, idx) => {
          const currentAnswer = answers[q.id] || "";
          return (
            <div
              key={q.id || idx}
              style={{
                padding: "14px 16px",
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)", marginBottom: 4 }}>
                    {idx + 1}. {q.question}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, fontStyle: "italic" }}>
                    💡 Why this matters: {q.contextWhy}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "var(--surface-subtle)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {q.category.replace(/_/g, " ")}
                </span>
              </div>

              {/* Quick suggestion pills */}
              {q.suggestedAnswers && q.suggestedAnswers.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {q.suggestedAnswers.map((sug, sIdx) => {
                    const isSelected = currentAnswer === sug;
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => onAnswerChange(q.id, isSelected ? "" : sug)}
                        style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 16,
                          background: isSelected ? "var(--brand-cobalt)" : "var(--surface-subtle)",
                          color: isSelected ? "#FFFFFF" : "var(--brand-navy)",
                          border: isSelected ? "1px solid var(--brand-cobalt)" : "1px solid var(--border-subtle)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {sug}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Free-text input */}
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                placeholder="Type custom answer or select an option above..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

