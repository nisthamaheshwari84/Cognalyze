"use client";

import React, { useState, useEffect } from "react";
import {
  generateCanonicalNotesForTopic,
  generatePersonalWeaknessNotes,
  CanonicalTopicNote,
  PersonalWeaknessNote
} from "@/lib/skills/ai-data/intelligent-notes-engine";

interface IntelligentNotesWorkspaceProps {
  topicId: string;
  topicTitle: string;
  candidateId?: string;
  targetRole?: string;
  onOpenAiTeacher?: (prompt: string) => void;
  onOpenPracticeDrill?: (drillTitle: string) => void;
}

export default function IntelligentNotesWorkspace({
  topicId,
  topicTitle,
  candidateId = "student-demo",
  targetRole = "AI Engineer",
  onOpenAiTeacher,
  onOpenPracticeDrill
}: IntelligentNotesWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"canonical" | "weaknesses" | "cheatsheet">("canonical");
  const [canonicalNotes, setCanonicalNotes] = useState<CanonicalTopicNote | null>(null);
  const [weaknessNotes, setWeaknessNotes] = useState<PersonalWeaknessNote | null>(null);

  useEffect(() => {
    setCanonicalNotes(generateCanonicalNotesForTopic(topicId, targetRole));
    setWeaknessNotes(generatePersonalWeaknessNotes(candidateId));
  }, [topicId, targetRole, candidateId]);

  if (!canonicalNotes || !weaknessNotes) {
    return <div style={{ padding: 24, color: "#667085" }}>Loading notes...</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E1DA", overflow: "hidden" }}>
      {/* Workspace Header & Action Controls */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E4E1DA", background: "#FBFBFA", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#162A43", letterSpacing: "-0.02em" }}>
              Intelligent Notes &amp; Personal Knowledge System
            </h3>
            <span style={{ fontSize: 10, background: "#EFF4FE", color: "#356AE6", padding: "2px 8px", borderRadius: 10, fontWeight: 700, border: "1px solid #D2E0FB" }}>
              Source-Verified
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#667085" }}>
            {topicTitle} • Formatted for fast revision, concrete code patterns, and evidence-driven weak spot remediation.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handlePrint}
            style={{
              padding: "6px 12px",
              background: "#F6F5F1",
              border: "1px solid #E4E1DA",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              color: "#162A43",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span>🖨️</span>
            <span>Print / Export PDF</span>
          </button>

          {onOpenAiTeacher && (
            <button
              onClick={() => onOpenAiTeacher(`Can you walk me through the key interview questions from the notes for ${topicTitle}?`)}
              style={{
                padding: "6px 12px",
                background: "#356AE6",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                color: "#FFFFFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>🤖</span>
              <span>Review with AI Mentor</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #E4E1DA", background: "#FFFFFF" }}>
        {[
          { id: "canonical", label: "📚 Canonical Learning Notes (Type A)", count: undefined },
          { id: "weaknesses", label: "🔍 Personal Weakness & Evidence Notes (Type B)", count: weaknessNotes.totalWeaknessesDetected },
          { id: "cheatsheet", label: "⚡ Tier-1 Interview Cheat Sheet", count: canonicalNotes.interviewCheatSheet.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "12px 18px",
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #356AE6" : "2px solid transparent",
              background: "transparent",
              color: activeTab === tab.id ? "#356AE6" : "#667085",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span style={{ fontSize: 10, background: activeTab === tab.id ? "#EFF4FE" : "#F1EFE9", color: activeTab === tab.id ? "#356AE6" : "#667085", padding: "1px 6px", borderRadius: 8, fontWeight: 800 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{ padding: 24, background: "#FAF9F5" }}>
        {/* ── 1. CANONICAL NOTES (TYPE A) ── */}
        {activeTab === "canonical" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Learning Objectives */}
            <div style={{ background: "#FFFFFF", padding: 18, borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                🎯 Core Learning Objectives
              </h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "#17191C", lineHeight: 1.6 }}>
                {canonicalNotes.learningObjectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Formal Definition & Mental Model */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#FFFFFF", padding: 18, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                  📖 Formal Technical Definition
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>
                  {canonicalNotes.formalDefinition}
                </p>
              </div>

              <div style={{ background: "#FFFFFF", padding: 18, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#B7791F" }}>
                  💡 Intuitive Mental Model
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>
                  {canonicalNotes.mentalModelAnalogy}
                </p>
              </div>
            </div>

            {/* Production Code Example */}
            <div style={{ background: "#FFFFFF", padding: 18, borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                  💻 Production Code Pattern
                </h4>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#356AE6", fontWeight: 700 }}>
                  Python 3.11+ Validated
                </span>
              </div>
              <pre style={{ background: "#162A43", color: "#F8FAFC", padding: 14, borderRadius: 6, fontSize: 12, overflowX: "auto", margin: "0 0 10px" }}>
                {canonicalNotes.productionCodeExample.code}
              </pre>
              <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.4 }}>
                <strong>Engineering Insight:</strong> {canonicalNotes.productionCodeExample.explanation}
              </div>
            </div>

            {/* Under the Hood Architecture */}
            <div style={{ background: "#FFFFFF", padding: 18, borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                ⚙️ Internal Architecture &amp; CPython Lifecycle
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: "#17191C", lineHeight: 1.6 }}>
                {canonicalNotes.underTheHoodArchitecture}
              </p>
            </div>

            {/* Common Traps & Antipatterns */}
            <div style={{ background: "#FFFFFF", padding: 18, borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#991B1B" }}>
                ⚠️ Common Production Traps &amp; Anti-Patterns
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {canonicalNotes.commonMistakesAndTraps.map((trap, idx) => (
                  <div key={idx} style={{ padding: 12, borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#991B1B", marginBottom: 2 }}>
                      {trap.trap}
                    </div>
                    <div style={{ fontSize: 11, color: "#17191C", marginBottom: 4 }}>
                      <strong>Why it occurs:</strong> {trap.whyItHappens}
                    </div>
                    <div style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>
                      <strong>Fix:</strong> {trap.howToAvoid}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 2. PERSONAL WEAKNESS NOTES (TYPE B) ── */}
        {activeTab === "weaknesses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Verdict Card */}
            <div style={{ background: "#FFFFFF", padding: "16px 20px", borderRadius: 8, border: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                  Diagnostic Weakness Vector Analysis
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#667085" }}>
                  {weaknessNotes.evidenceSummary} Generated on {weaknessNotes.generatedDate}.
                </p>
              </div>
              <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, background: "#FEF7ED", color: "#B7791F", border: "1px solid #F8D8A7" }}>
                {weaknessNotes.readinessVerdict}
              </span>
            </div>

            {/* Weakness Cards */}
            {weaknessNotes.weaknesses.map((w, idx) => (
              <div key={idx} style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <h5 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                      {w.weakConcept}
                    </h5>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: w.severity === "high" ? "#FEF2F2" : "#FFFBEB", color: w.severity === "high" ? "#991B1B" : "#B45309", fontWeight: 800, textTransform: "uppercase" }}>
                    {w.severity} Impact
                  </span>
                </div>

                {/* Evidence Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div style={{ padding: 10, background: "#FBFBFA", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 2 }}>
                      Observed Evidence
                    </div>
                    <div style={{ fontSize: 11, color: "#17191C", lineHeight: 1.4 }}>
                      {w.observedEvidence}
                    </div>
                  </div>

                  <div style={{ padding: 10, background: "#FBFBFA", borderRadius: 6, border: "1px solid #E4E1DA" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 2 }}>
                      What Went Wrong
                    </div>
                    <div style={{ fontSize: 11, color: "#991B1B", lineHeight: 1.4 }}>
                      {w.whatWentWrong}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: "#2E7D5B", lineHeight: 1.4, marginBottom: 12 }}>
                  <strong>Remediation Plan:</strong> {w.howToImprove}
                </div>

                {onOpenPracticeDrill && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => onOpenPracticeDrill(w.recommendedPracticeDrill)}
                      style={{
                        padding: "6px 12px",
                        background: "#162A43",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Launch Drill: {w.recommendedPracticeDrill} ➔
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── 3. INTERVIEW CHEAT SHEET ── */}
        {activeTab === "cheatsheet" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "#162A43" }}>
                ⚡ 5-Minute Tier-1 Pre-Interview Recall Cards
              </h4>
              <p style={{ margin: 0, fontSize: 11, color: "#667085" }}>
                High-yield technical questions asked by Amazon, Google, Microsoft, and high-growth AI startups.
              </p>
            </div>

            {canonicalNotes.interviewCheatSheet.map((card, idx) => (
              <div key={idx} style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1DA", padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                  Q: {card.question}
                </div>
                <div style={{ fontSize: 12, color: "#17191C", background: "#EFF4FE", padding: "10px 12px", borderRadius: 6, border: "1px solid #D2E0FB", lineHeight: 1.5, marginBottom: 8 }}>
                  <strong>Concise Ideal Response:</strong> {card.conciseAnswer}
                </div>
                <div style={{ fontSize: 11, color: "#991B1B", background: "#FEF2F2", padding: "8px 12px", borderRadius: 6, border: "1px solid #FECACA" }}>
                  ⚠️ <strong>Interviewer Follow-up Trap:</strong> {card.followUpTrap}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

