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
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700, textTransform: "uppercase" }}>
                INTERVIEW INTELLIGENCE
              </span>
              <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>
                Candidate-Specific Gap Prober
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em", color: "#162A43" }}>
              🎤 Precision Interview Question Generator
            </h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "8px 0 0", maxWidth: 650, lineHeight: 1.5 }}>
              Generate razor-sharp questions that target the exact discrepancies between a candidate&apos;s resume claims and your job requirements.
            </p>
          </div>

          <button
            onClick={handlePreload}
            style={{
              padding: "8px 14px",
              borderRadius: 7,
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              color: "#162A43",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
            }}
          >
            💡 Preload Demo Case
          </button>
        </div>

        {/* INPUT SPLIT VIEW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 450px), 1fr))", gap: 16, marginBottom: 24 }}>
          {/* JD Input */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 8 }}>
              1. Job Description &amp; Technical Requirements:
            </label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste job requirements, core architecture expectations..."
              rows={6}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 7,
                background: "#F6F5F1",
                border: "1px solid #E4E1DA",
                color: "#17191C",
                fontSize: 12,
                lineHeight: 1.5,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit"
              }}
            />
          </div>

          {/* Resume Input */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 8 }}>
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
                borderRadius: 7,
                background: "#F6F5F1",
                border: "1px solid #E4E1DA",
                color: "#17191C",
                fontSize: 12,
                lineHeight: 1.5,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit"
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <button
            onClick={handleGenerate}
            disabled={generating || !candidateResume.trim() || !jdText.trim()}
            style={{
              padding: "12px 28px",
              borderRadius: 7,
              border: "none",
              background: generating || !candidateResume.trim() || !jdText.trim() ? "#E4E1DA" : "#356AE6",
              color: generating || !candidateResume.trim() || !jdText.trim() ? "#98A2B3" : "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              cursor: generating || !candidateResume.trim() || !jdText.trim() ? "not-allowed" : "pointer",
              boxShadow: generating || !candidateResume.trim() || !jdText.trim() ? "none" : "0 2px 8px rgba(53, 106, 230, 0.35)",
              transition: "all 0.15s ease"
            }}
          >
            {generating ? "Analyzing Discrepancies & Generating Probes..." : "Generate 5 Targeted Gap Questions ➔"}
          </button>
        </div>

        {/* GENERATED QUESTIONS LIST */}
        {questions.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>
              Targeted Interview Questions &amp; Evaluation Guide
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 10,
                    padding: "20px 24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#162A43" }}>
                      Q{idx + 1}: {q.question}
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "#FDF2F2", color: "#C24141", border: "1px solid #F8C8C8", fontWeight: 700 }}>
                      {q.difficulty}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "#356AE6", fontWeight: 600, marginBottom: 14 }}>
                    🎯 Why Ask: {q.why}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 12 }}>
                    <div style={{ padding: "12px 14px", borderRadius: 8, background: "#EAF4EE", border: "1px solid #C8E4D3" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", marginBottom: 4 }}>
                        ✓ GREEN FLAG (What to Listen For):
                      </div>
                      <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.4 }}>
                        {q.lookFor}
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", borderRadius: 8, background: "#FDF2F2", border: "1px solid #F8C8C8" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#C24141", marginBottom: 4 }}>
                        ⚠️ RED FLAG (Superficial Answer):
                      </div>
                      <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.4 }}>
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
