"use client";

import React, { useState, useMemo } from "react";
import {
  TaxonomyTopic,
  TaxonomySubtopic,
  TaxonomySubject,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";
import { CompanyQuestion } from "@/lib/skills/ai-data/company-question-bank-types";
import { generateSubtopicQuestionBank } from "@/lib/skills/ai-data/question-generator-engine";

export interface TopicInterviewPrepViewProps {
  topic: TaxonomyTopic;
  subtopic: TaxonomySubtopic;
  subject?: TaxonomySubject;
  candidateId: string;
  targetRole: TargetRoleSlug;
  onOpenAiMentor?: () => void;
}

export default function TopicInterviewPrepView({
  topic,
  subtopic,
  subject,
  candidateId,
  targetRole,
  onOpenAiMentor,
}: TopicInterviewPrepViewProps) {
  const roleProfile = TARGET_ROLE_PROFILES[targetRole];
  const roleRelevance = topic.roleRelevance?.[targetRole];

  // Fetch interview and scenario questions for this subtopic
  const interviewQuestions = useMemo(() => {
    const bank = generateSubtopicQuestionBank(
      subject?.id || "subj_general",
      topic.moduleId,
      topic,
      subtopic
    );
    return bank.filter(
      (q) => q.questionType === "interview" || q.questionType === "scenario"
    );
  }, [topic, subtopic, subject]);

  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    interviewQuestions[0]?.id || ""
  );
  const [candidateDrafts, setCandidateDrafts] = useState<Record<string, string>>({});
  const [evaluatedScores, setEvaluatedScores] = useState<
    Record<string, { clarity: number; technicalDepth: number; tradeOffs: number; feedback: string }>
  >({});
  const [revealedGuides, setRevealedGuides] = useState<Record<string, boolean>>({});

  const selectedQ = interviewQuestions.find((q) => q.id === activeQuestionId) || interviewQuestions[0];

  const handleEvaluateDraft = (questionId: string) => {
    const text = (candidateDrafts[questionId] || "").trim();
    if (text.length < 20) {
      setEvaluatedScores((prev) => ({
        ...prev,
        [questionId]: {
          clarity: 40,
          technicalDepth: 35,
          tradeOffs: 30,
          feedback:
            "Your answer is too brief for an enterprise technical interview. Interleaving quantitative trade-offs, internal mechanics, and failure modes is necessary.",
        },
      }));
      return;
    }

    // Evaluate depth based on engineering keywords
    const hasComplexity = /o\(|complexity|constant|linear|overhead|cache/i.test(text);
    const hasInvariants = /memory|invariants|allocation|concurrency|mutation|thread/i.test(text);
    const hasScale = /scale|throughput|latency|distributed|partition/i.test(text);

    let depth = 60 + (hasComplexity ? 15 : 0) + (hasInvariants ? 15 : 0) + (hasScale ? 10 : 0);
    depth = Math.min(100, depth);

    setEvaluatedScores((prev) => ({
      ...prev,
      [questionId]: {
        clarity: 88,
        technicalDepth: depth,
        tradeOffs: hasScale ? 92 : 75,
        feedback:
          depth >= 85
            ? "Strong senior-level defense! You clearly highlighted concrete trade-offs and underlying architecture."
            : "Good start, but push further: mention CPU cache locality, asymptotic memory consumption, and what happens at 100x volume.",
      },
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── HEADER BANNER: ROLE-CALIBRATED INTERVIEW BAR ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 12,
          padding: "24px 28px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#356AE6" }}>
                Placement &amp; Technical Interview Arena
              </span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700 }}>
                Calibrated for {roleProfile?.title || "AI Engineer"}
              </span>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#162A43", margin: "0 0 6px" }}>
              {subtopic.title} · Interview Defense &amp; Trade-off Prober
            </h2>

            <p style={{ margin: 0, fontSize: 13, color: "#475569", maxWidth: 680, lineHeight: 1.55 }}>
              Tier-1 engineering rounds at Google, Amazon, Microsoft, and NVIDIA do not test rote definitions.
              They evaluate your ability to defend internal architectural trade-offs, explain failure modes, and handle follow-up pressure tests.
            </p>
          </div>

          {onOpenAiMentor && (
            <button
              onClick={onOpenAiMentor}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                border: "1px solid #D2E0FB",
                background: "#EFF4FE",
                color: "#356AE6",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🤖</span>
              <span>Launch AI Mock Interviewer</span>
            </button>
          )}
        </div>

        {/* Role Connection Callout */}
        {roleRelevance && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: "#FAF9F6", borderRadius: 8, borderLeft: "4px solid #356AE6" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase" }}>
              Why this topic matters for {roleProfile?.title}:
            </span>
            <div style={{ fontSize: 12, color: "#2B4C85", marginTop: 2 }}>
              {roleRelevance.why}
            </div>
          </div>
        )}
      </div>

      {/* ── TWO-COLUMN INTERVIEW EXPLORER ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 320px) 1fr", gap: 18, alignItems: "flex-start" }}>
        
        {/* Left List of Questions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Interview Scenarios ({interviewQuestions.length})
          </div>

          {interviewQuestions.map((q, idx) => {
            const isSelected = q.id === activeQuestionId || (!activeQuestionId && idx === 0);
            const comp = q.relevantCompanies?.[0]?.name || "Tier-1 Tech";
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionId(q.id)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: isSelected ? "1.5px solid #356AE6" : "1px solid #E4E1DA",
                  background: isSelected ? "#FFFFFF" : "#FAF9F6",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 2px 6px rgba(53,106,230,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#EFF4FE", color: "#356AE6", fontWeight: 700 }}>
                    {q.questionType === "interview" ? "Technical Defense" : "Architecture Scenario"}
                  </span>
                  <span style={{ fontSize: 10, color: "#667085", fontWeight: 600 }}>
                    🏢 {comp}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#162A43" : "#475569", lineHeight: 1.4 }}>
                  {q.questionText.slice(0, 90)}...
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Focused Interview Workspace */}
        {selectedQ ? (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 10,
              padding: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Question Details */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#EAF4EE", color: "#2E7D5B", fontWeight: 700, textTransform: "uppercase" }}>
                  {selectedQ.difficulty}
                </span>
                {selectedQ.relevantCompanies?.[0] && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#162A43" }}>
                    🏢 Reported at {selectedQ.relevantCompanies[0].name}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: "0 0 10px", lineHeight: 1.4 }}>
                {selectedQ.questionText}
              </h3>
            </div>

            {/* Answer Draft Textarea */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>
                  Your Verbal Interview Defense (Draft below):
                </span>
                <span style={{ fontSize: 10, color: "#94A3B8" }}>
                  Aim for clarity, trade-off trade study, and scale limits
                </span>
              </div>

              <textarea
                rows={6}
                placeholder="Structure your answer: 1) System requirements, 2) Data structure choice & internal memory layout, 3) Time/space complexity, 4) Scale failure boundary..."
                value={candidateDrafts[selectedQ.id] || ""}
                onChange={(e) => setCandidateDrafts((prev) => ({ ...prev, [selectedQ.id]: e.target.value }))}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 8,
                  border: "1px solid #E4E1DA",
                  background: "#FAF9F6",
                  fontSize: 13,
                  color: "#162A43",
                  lineHeight: 1.6,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Evaluation Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E4E1DA", paddingTop: 14 }}>
              <button
                onClick={() => setRevealedGuides((prev) => ({ ...prev, [selectedQ.id]: !prev[selectedQ.id] }))}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#356AE6",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {revealedGuides[selectedQ.id] ? "Hide Interviewer Rubric ▲" : "View Interviewer Evaluation Rubric ▼"}
              </button>

              <button
                onClick={() => handleEvaluateDraft(selectedQ.id)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 6,
                  border: "none",
                  background: "#162A43",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Score Technical Defense ➔
              </button>
            </div>

            {/* Live Evaluation Feedback */}
            {evaluatedScores[selectedQ.id] && (
              <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase" }}>
                    Interviewer Assessment
                  </span>
                  <div style={{ display: "flex", gap: 10, fontSize: 11, fontWeight: 700 }}>
                    <span style={{ color: "#356AE6" }}>Technical Depth: {evaluatedScores[selectedQ.id].technicalDepth}%</span>
                    <span style={{ color: "#2E7D5B" }}>Trade-off Awareness: {evaluatedScores[selectedQ.id].tradeOffs}%</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#2B4C85", lineHeight: 1.5 }}>
                  {evaluatedScores[selectedQ.id].feedback}
                </div>
              </div>
            )}

            {/* Interviewer Model Guide Accordion */}
            {revealedGuides[selectedQ.id] && (
              <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>
                  Interviewer Scoring Guide &amp; Ideal Defense
                </div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {selectedQ.detailedExplanation}
                </div>
                {selectedQ.correctAnswer && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "#EAF4EE", borderRadius: 6, border: "1px solid #C8E4D3", fontSize: 11.5, color: "#2E7D5B" }}>
                    <strong>Key Talking Points:</strong>
                    <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                      {selectedQ.correctAnswer}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 36, textAlign: "center", color: "#667085" }}>
            Select an interview question on the left to begin practice.
          </div>
        )}
      </div>
    </div>
  );
}

