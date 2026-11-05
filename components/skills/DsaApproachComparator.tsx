"use client";

import React, { useState } from "react";
import { getApproachComparison, ProblemApproachComparison, ApproachDetail } from "@/lib/skills/dsa-approach-comparator";

interface DsaApproachComparatorProps {
  problemId: string;
  problemTitle: string;
  selectedLanguage: "cpp" | "python" | "javascript" | "java";
  onApplyCode?: (code: string) => void;
}

export function DsaApproachComparator({
  problemId,
  problemTitle,
  selectedLanguage,
  onApplyCode
}: DsaApproachComparatorProps) {
  const comparison: ProblemApproachComparison = getApproachComparison(problemId, problemTitle);
  const [selectedTier, setSelectedTier] = useState<"brute_force" | "better" | "optimal">("optimal");
  const [activeLang, setActiveLang] = useState<"cpp" | "python" | "javascript" | "java">(selectedLanguage);

  const activeApproach: ApproachDetail =
    comparison.approaches.find(a => a.tier === selectedTier) || comparison.approaches[0];

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "brute_force":
        return { label: "Brute Force", bg: "#FDF2F2", text: "#C24141", border: "#F8C8C8" };
      case "better":
        return { label: "Improved / Better", bg: "#FFF7EB", text: "#B7791F", border: "#FEE4E2" };
      case "optimal":
        return { label: "Optimal Lower Bound", bg: "#ECFDF3", text: "#027A48", border: "#A6F4C5" };
      default:
        return { label: tier, bg: "#F2F4F7", text: "#344054", border: "#D0D5DD" };
    }
  };

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", padding: 18, marginTop: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚖️</span>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: 0 }}>
              Approach Comparison Lab: {comparison.problemTitle}
            </h3>
          </div>
          <p style={{ fontSize: 11, color: "#667085", margin: "4px 0 0 0" }}>
            {comparison.summary}
          </p>
        </div>

        {/* Language Tabs */}
        <div style={{ display: "flex", background: "#F6F5F1", padding: 2, borderRadius: 6, border: "1px solid #E4E1DA" }}>
          {(["cpp", "python", "java", "javascript"] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                border: "none",
                background: activeLang === lang ? "#162A43" : "transparent",
                color: activeLang === lang ? "#FFFFFF" : "#667085",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase"
              }}
            >
              {lang === "cpp" ? "C++" : lang === "javascript" ? "JS" : lang}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Tier Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {comparison.approaches.map(app => {
          const badge = getTierBadge(app.tier);
          const isSelected = selectedTier === app.tier;
          return (
            <div
              key={app.tier}
              onClick={() => setSelectedTier(app.tier)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: isSelected ? "2px solid #356AE6" : "1px solid #E4E1DA",
                background: isSelected ? "#F8F9FC" : "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isSelected ? "0 2px 6px rgba(53, 106, 230, 0.12)" : "none"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: badge.bg,
                    color: badge.text,
                    border: `1px solid ${badge.border}`
                  }}
                >
                  {badge.label}
                </span>
                {isSelected && <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 800 }}>✓ Active</span>}
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                {app.name}
              </div>

              <div style={{ display: "flex", gap: 6, fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: "#356AE6" }}>Time: {app.timeComplexity}</span>
                <span style={{ color: "#667085" }}>•</span>
                <span style={{ color: "#027A48" }}>Space: {app.spaceComplexity}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Approach Detailed Breakdown */}
      <div style={{ background: "#F6F5F1", borderRadius: 8, border: "1px solid #E4E1DA", padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0 }}>
            {activeApproach.name} — Implementation &amp; Invariants
          </h4>
          {onApplyCode && (
            <button
              onClick={() => {
                const snippet = activeApproach.codeSnippets[activeLang] || activeApproach.codeSnippets.python;
                onApplyCode(snippet);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                border: "1px solid #D0D5DD",
                background: "#FFFFFF",
                color: "#162A43",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              📋 Load Code into Editor
            </button>
          )}
        </div>

        {/* Intuition & Bottleneck */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#027A48", textTransform: "uppercase" }}>Core Intuition</span>
            <p style={{ fontSize: 11, color: "#344054", margin: "4px 0 0 0", lineHeight: 1.4 }}>
              {activeApproach.intuition}
            </p>
          </div>
          <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#C24141", textTransform: "uppercase" }}>Bottleneck &amp; Tradeoff</span>
            <p style={{ fontSize: 11, color: "#344054", margin: "4px 0 0 0", lineHeight: 1.4 }}>
              {activeApproach.tradeoffBottleneck}
            </p>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div style={{ background: "#17191C", borderRadius: 6, padding: 12, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#98A2B3", textTransform: "uppercase", fontWeight: 700 }}>
              {activeLang} Solution
            </span>
            <span style={{ fontSize: 10, color: "#667085" }}>
              Technique: {activeApproach.keyTechnique}
            </span>
          </div>
          <pre style={{ margin: 0, color: "#F6F5F1", fontSize: 12, fontFamily: "monospace", lineHeight: 1.5 }}>
            {activeApproach.codeSnippets[activeLang] || activeApproach.codeSnippets.python}
          </pre>
        </div>
      </div>
    </div>
  );
}

