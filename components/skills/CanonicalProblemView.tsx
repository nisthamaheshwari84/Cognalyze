"use client";

import React, { useState } from "react";
import { CanonicalProblem } from "@/lib/skills/dsa-canonical-problems";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface Props {
  problem: CanonicalProblem;
  selectedLanguage: "cpp" | "python" | "javascript" | "java";
}

export default function CanonicalProblemView({ problem, selectedLanguage }: Props) {
  const [hintsExpanded, setHintsExpanded] = useState<Record<number, boolean>>({});

  const toggleHint = (idx: number) => {
    setHintsExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getSignature = () => {
    switch (selectedLanguage) {
      case "cpp":
        return problem.cppSignature;
      case "python":
        return problem.pythonSignature;
      case "javascript":
        return problem.jsSignature;
      case "java":
        return problem.javaSignature;
      default:
        return problem.cppSignature;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 1. Header & Badges */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 5, fontWeight: 700 }}>
              {problem.step_title}
            </span>
            <span style={{ fontSize: 11, color: "#667085" }}>{problem.subtopic_title}</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.01em" }}>
            {problem.title}
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10,
            padding: "3px 8px",
            borderRadius: 5,
            fontWeight: 800,
            textTransform: "uppercase",
            background: problem.difficulty === "easy" ? "#EAF4EE" : problem.difficulty === "medium" ? "#FEF7ED" : "#FDF2F2",
            color: problem.difficulty === "easy" ? "#2E7D5B" : problem.difficulty === "medium" ? "#B7791F" : "#C24141",
            border: `1px solid ${problem.difficulty === "easy" ? "#C8E4D3" : problem.difficulty === "medium" ? "#F8D8A7" : "#F8C8C8"}`
          }}>
            {problem.difficulty}
          </span>
          <span style={{ fontSize: 11, color: "#475467", background: "#F6F5F1", padding: "3px 8px", borderRadius: 5, border: "1px solid #E4E1DA" }}>
            ⏱️ {problem.time_complexity}
          </span>
          <span style={{ fontSize: 11, color: "#475467", background: "#F6F5F1", padding: "3px 8px", borderRadius: 5, border: "1px solid #E4E1DA" }}>
            📦 {problem.space_complexity}
          </span>
        </div>
      </div>

      {/* 2. Full Description */}
      <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.6 }}>
        <MarkdownRenderer content={problem.fullDescription} />
      </div>

      {/* 3. Expected Contract & Signature */}
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475467", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 }}>
          Expected Function Signature ({selectedLanguage.toUpperCase()})
        </div>
        <code style={{ fontSize: 12, fontFamily: "monospace", color: "#0F172A", fontWeight: 600 }}>
          {getSignature()}
        </code>
      </div>

      {/* 4. Input & Output Format */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
        <div style={{ background: "#F6F5F1", padding: "10px 12px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
          <div style={{ fontWeight: 700, color: "#162A43", marginBottom: 2 }}>Input Format:</div>
          <div style={{ color: "#475467", lineHeight: 1.4 }}>{problem.inputFormat}</div>
        </div>
        <div style={{ background: "#F6F5F1", padding: "10px 12px", borderRadius: 7, border: "1px solid #E4E1DA" }}>
          <div style={{ fontWeight: 700, color: "#162A43", marginBottom: 2 }}>Output Format:</div>
          <div style={{ color: "#475467", lineHeight: 1.4 }}>{problem.outputFormat}</div>
        </div>
      </div>

      {/* 5. Constraints */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#92400E", marginBottom: 4, textTransform: "uppercase" }}>
          Constraints &amp; Numerical Bounds
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#78350F", lineHeight: 1.5 }}>
          {problem.constraints.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      {/* 6. Concrete Examples */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase" }}>
          Examples
        </div>
        {problem.examples.map((ex, i) => (
          <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: "#162A43", marginBottom: 4 }}>Example {i + 1}:</div>
            <div style={{ fontFamily: "monospace", color: "#334155", marginBottom: 2 }}>
              <strong>Input:</strong> {ex.input}
            </div>
            <div style={{ fontFamily: "monospace", color: "#166534", marginBottom: 4 }}>
              <strong>Output:</strong> {ex.output}
            </div>
            <div style={{ color: "#64748B", fontSize: 11, lineHeight: 1.4 }}>
              <strong>Explanation:</strong> {ex.explanation}
            </div>
          </div>
        ))}
      </div>

      {/* 7. Boundary Conditions & Assumptions */}
      {problem.edgeCases && problem.edgeCases.length > 0 && (
        <div style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 8, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#334155", marginBottom: 4, textTransform: "uppercase" }}>
            Critical Edge Cases &amp; Invariants
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#475467", lineHeight: 1.5 }}>
            {problem.edgeCases.map((ec, i) => (
              <li key={i}>{ec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 8. Progressive Hints */}
      {problem.hints && problem.hints.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase" }}>
            Progressive Socratic Hints
          </div>
          {problem.hints.map((hint, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 7, overflow: "hidden" }}>
              <button
                onClick={() => toggleHint(idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: hintsExpanded[idx] ? "#F8FAFC" : "#FFFFFF",
                  border: "none",
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#356AE6",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>💡 Hint {idx + 1}</span>
                <span style={{ fontSize: 10, color: "#64748B" }}>{hintsExpanded[idx] ? "▲ Hide" : "▼ Reveal"}</span>
              </button>
              {hintsExpanded[idx] && (
                <div style={{ padding: "8px 12px", fontSize: 12, color: "#475467", lineHeight: 1.5, borderTop: "1px solid #E4E1DA", background: "#F8FAFC" }}>
                  <MarkdownRenderer content={hint} compact />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
