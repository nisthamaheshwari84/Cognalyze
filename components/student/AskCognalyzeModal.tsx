"use client";

import React, { useState } from "react";

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
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          backgroundColor: "#090d1a",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.9)",
          color: "#f8fafc",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16
              }}
            >
              🧠
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "white" }}>
                Ask Cognalyze Career Intelligence
              </h3>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Strictly grounded in your stored evidence graph · Zero hallucinations
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 8,
              color: "#94a3b8",
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
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 10,
                padding: "12px 16px",
                color: "white",
                fontSize: 14,
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none",
                borderRadius: 10,
                color: "white",
                padding: "0 20px",
                fontWeight: 800,
                fontSize: 13,
                cursor: loading ? "wait" : "pointer",
                opacity: loading || !question.trim() ? 0.6 : 1
              }}
            >
              {loading ? "Thinking..." : "Ask →"}
            </button>
          </form>

          {/* SAMPLE PROMPTS */}
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#64748b", alignSelf: "center", marginRight: 2 }}>
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
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 6,
                  padding: "4px 10px",
                  color: "#cbd5e1",
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
                backgroundColor: "rgba(15, 23, 42, 0.7)",
                borderRadius: 12,
                border: "1px solid rgba(99, 102, 241, 0.25)"
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#f1f5f9",
                  whiteSpace: "pre-line"
                }}
              >
                {answer}
              </div>

              {/* CITATIONS */}
              {citations.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Evidence Citations ({citations.length}):
                  </span>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {citations.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          color: "#818cf8",
                          background: "rgba(99, 102, 241, 0.1)",
                          border: "1px solid rgba(99, 102, 241, 0.25)",
                          borderRadius: 4,
                          padding: "2px 8px"
                        }}
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!hasSufficientData && (
                <div style={{ marginTop: 12, fontSize: 11, color: "#f59e0b" }}>
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
