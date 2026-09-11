"use client";

import React, { useState } from "react";
import AppNav from "@/components/AppNav";

interface InterviewQuestion {
  question: string;
  why: string;
  lookFor: string;
  redFlagAnswer: string;
  difficulty: "Hard" | "Medium" | "Bar-Raiser";
}

export default function RecruiterInterviewsPage() {
  const [candidateResume, setCandidateResume] = useState("");
  const [jdText, setJdText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

  const handleGenerate = async () => {
    if (!candidateResume.trim() || !jdText.trim()) return;
    setGenerating(true);
    setQuestions([]);

    try {
      const res = await fetch("/api/predict-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: candidateResume, jd: jdText })
      });
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions.map((q: any) => ({
          question: q.question,
          why: q.why || "Probes claimed experience vs demonstrated depth",
          lookFor: q.lookFor || "Quantified business metrics, architectural trade-offs",
          redFlagAnswer: q.redFlag || "Vague generalizations without technical specifics",
          difficulty: q.difficulty || "Hard"
        })));
      }
    } catch (err) {
      console.error("Error generating interview questions:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePreload = () => {
    setJdText(`Senior Backend Engineer (Kafka + Distributed Systems)
Requirements: 4+ years building high-throughput event-driven microservices. Deep expertise in partition keys, consumer group rebalancing, schema registry, and PostgreSQL transaction isolation.`);
    setCandidateResume(`Software Engineer at Mid-Size Fintech (3 years)
- Built user onboarding service with Node.js and Express.
- Wrote SQL queries for customer profiles.
- Claimed: "Led distributed Kafka architecture processing 10M events daily."`);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(236,72,153,0.2)", color: "#f472b6", fontWeight: 800 }}>
                INTERVIEW INTELLIGENCE
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Candidate-Specific Gap Prober
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              🎤 Precision Interview Question Generator
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 650, lineHeight: 1.5 }}>
              Generate razor-sharp questions that target the exact discrepancies between a candidate&apos;s resume claims and your job requirements.
            </p>
          </div>

          <button
            onClick={handlePreload}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#cbd5e1",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            💡 Preload Demo Case
          </button>
        </div>

        {/* INPUT SPLIT VIEW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 450px), 1fr))", gap: 20, marginBottom: 24 }}>
          {/* JD Input */}
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "20px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#a855f7", marginBottom: 8 }}>
              1. Job Description & Technical Requirements:
            </label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste job requirements, core architecture expectations..."
              rows={6}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "white",
                fontSize: 12,
                lineHeight: 1.5,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Resume Input */}
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "20px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#38bdf8", marginBottom: 8 }}>
              2. Candidate Resume Text / Claimed Experience:
            </label>
            <textarea
              value={candidateResume}
              onChange={e => setCandidateResume(e.target.value)}
              placeholder="Paste candidate resume or bullet points to probe..."
              rows={6}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "white",
                fontSize: 12,
                lineHeight: 1.5,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <button
            onClick={handleGenerate}
            disabled={generating || !candidateResume.trim() || !jdText.trim()}
            style={{
              padding: "12px 32px",
              borderRadius: 10,
              border: "none",
              background: generating ? "rgba(236,72,153,0.4)" : "linear-gradient(135deg, #ec4899, #a855f7)",
              color: "white",
              fontSize: 14,
              fontWeight: 800,
              cursor: generating || !candidateResume.trim() || !jdText.trim() ? "not-allowed" : "pointer",
              boxShadow: "0 4px 20px rgba(236,72,153,0.3)"
            }}
          >
            {generating ? "AI Committee is Analyzing Gaps..." : "Generate 5 Targeted Gap Questions ➔"}
          </button>
        </div>

        {/* GENERATED QUESTIONS LIST */}
        {questions.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
              Targeted Interview Questions & Evaluation Guide
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 16,
                    padding: "22px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                      Q{idx + 1}: {q.question}
                    </div>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(239,68,68,0.15)", color: "#f87171", fontWeight: 800 }}>
                      {q.difficulty}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "#c084fc", fontWeight: 700, marginBottom: 12 }}>
                    🎯 Why Ask: {q.why}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 12 }}>
                    <div style={{ padding: "12px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", marginBottom: 4 }}>
                        ✓ GREEN FLAG (What to Listen For):
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                        {q.lookFor}
                      </div>
                    </div>

                    <div style={{ padding: "12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#f87171", marginBottom: 4 }}>
                        ⚠️ RED FLAG (Superficial Answer):
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                        {q.redFlagAnswer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
