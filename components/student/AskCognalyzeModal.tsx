"use client";

import React, { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface AskCognalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId?: string;
  onOpenEvidenceDrawer?: (capability: string) => void;
}

export default function AskCognalyzeModal({
  isOpen,
  onClose,
  candidateId = "student-demo",
  onOpenEvidenceDrawer
}: AskCognalyzeModalProps) {
  const { isDark } = useTheme();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<string[]>([]);
  const [hasSufficientData, setHasSufficientData] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setLoading(true);
    setAnswer(null);
    setCitations([]);

    try {
      const res = await fetch("/api/student/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: candidateId,
          question: q
        })
      });
      const data = await res.json();
      if (data.success) {
        setAnswer(data.answer);
        setCitations(data.citations || []);
        setHasSufficientData(data.hasSufficientData);
      } else {
        setAnswer("Could not process request at this time.");
      }
    } catch (err) {
      console.error(err);
      setAnswer("Error connecting to Cognalyze Intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "Why is MLOps my biggest gap?",
    "What evidence do you have for my Python skill?",
    "What should I work on next?",
    "What changed in my DNA recently?",
    "What evidence exists for System Design?"
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
          borderRadius: 16,
          border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
          boxShadow: isDark ? "0 20px 60px rgba(0, 0, 0, 0.8)" : "0 20px 60px rgba(22, 42, 67, 0.12)",
          color: isDark ? "#F2F6FC" : "#17191C",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
            background: isDark ? "#13243A" : "#FAF9F6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "linear-gradient(135deg, #356AE6, #2858C7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: "white"
              }}
            >
              🧠
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: isDark ? "#F2F6FC" : "#17191C" }}>
                Ask Cognalyze Career Intelligence
              </h3>
              <span style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085" }}>
                Strictly grounded in your stored evidence graph · Zero hallucinations
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: isDark ? "rgba(255, 255, 255, 0.06)" : "#F0EFEA",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 8,
              color: isDark ? "#B6C4D6" : "#667085",
              cursor: "pointer",
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* PROMPT INPUT */}
        <div style={{ padding: "20px 24px" }}>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAsk();
            }}
            style={{ display: "flex", gap: 10 }}
          >
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask anything: e.g. Why is MLOps my biggest gap?"
              style={{
                flex: 1,
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 10,
                padding: "12px 16px",
                color: isDark ? "#F2F6FC" : "#17191C",
                fontSize: 14,
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              style={{
                background: "linear-gradient(135deg, #356AE6, #2858C7)",
                border: "none",
                borderRadius: 10,
                color: "white",
                padding: "0 22px",
                fontWeight: 800,
                fontSize: 13,
                cursor: loading ? "wait" : "pointer",
                opacity: loading || !question.trim() ? 0.6 : 1,
                boxShadow: "0 2px 8px rgba(53, 106, 230, 0.25)"
              }}
            >
              {loading ? "Thinking..." : "Ask →"}
            </button>
          </form>

          {/* SAMPLE PROMPTS */}
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", alignSelf: "center", marginRight: 2 }}>
              Try asking:
            </span>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(q);
                  handleAsk(q);
                }}
                style={{
                  background: isDark ? "#13243A" : "#F0EFEA",
                  border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  color: isDark ? "#B6C4D6" : "#475569",
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* RESULT BOX */}
          {answer && (
            <div
              style={{
                marginTop: 20,
                padding: "18px 20px",
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                borderRadius: 12,
                border: isDark ? "1px solid rgba(52, 120, 246, 0.3)" : "1px solid #D1E2FB"
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: isDark ? "#F2F6FC" : "#17191C",
                  whiteSpace: "pre-line"
                }}
              >
                {answer}
              </div>

              {/* CITATIONS */}
              {citations.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                  <span style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                    Evidence Citations ({citations.length}):
                  </span>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {citations.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          color: isDark ? "#3478F6" : "#356AE6",
                          background: isDark ? "rgba(52, 120, 246, 0.15)" : "#EEF4FD",
                          border: isDark ? "1px solid rgba(52, 120, 246, 0.3)" : "1px solid #D1E2FB",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontWeight: 600
                        }}
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!hasSufficientData && (
                <div style={{ marginTop: 12, fontSize: 11, color: "#B7791F" }}>
                  💡 Tip: To build evidence for unobserved capabilities, try completing a mock interview or adding project repos.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
