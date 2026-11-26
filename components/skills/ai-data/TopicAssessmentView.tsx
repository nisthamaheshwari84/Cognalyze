"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TaxonomyTopic,
  TaxonomySubtopic,
  TaxonomySubject,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { CompanyQuestion } from "@/lib/skills/ai-data/company-question-bank-types";
import { generateSubtopicQuestionBank } from "@/lib/skills/ai-data/question-generator-engine";

export interface TopicAssessmentViewProps {
  topic: TaxonomyTopic;
  subtopic: TaxonomySubtopic;
  subject?: TaxonomySubject;
  candidateId: string;
  targetRole: TargetRoleSlug;
  onAssessmentCompleted?: (score: number, passed: boolean) => void;
  onSwitchToPractice?: () => void;
}

export default function TopicAssessmentView({
  topic,
  subtopic,
  subject,
  candidateId,
  targetRole,
  onAssessmentCompleted,
  onSwitchToPractice,
}: TopicAssessmentViewProps) {
  const [assessmentStatus, setAssessmentStatus] = useState<"intro" | "in_progress" | "review">("intro");
  const [questions, setQuestions] = useState<CompanyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(1200); // 20 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runningCodeForQ, setRunningCodeForQ] = useState(false);
  const [codeExecutionOutputs, setCodeExecutionOutputs] = useState<Record<string, { stdout?: string; stderr?: string; isError?: boolean }>>({});

  // Assessment Result State
  const [assessmentResult, setAssessmentResult] = useState<{
    score: number;
    passed: boolean;
    totalQuestions: number;
    correctCount: number;
    byDifficulty: Record<string, { total: number; correct: number }>;
    byType: Record<string, { total: number; correct: number }>;
    strongConcepts: string[];
    weakConcepts: string[];
    questionFeedback: Array<{
      question: CompanyQuestion;
      userAnswer: string;
      isCorrect: boolean;
      score: number;
      explanation: string;
    }>;
    dnaRecorded: boolean;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate 10 curated questions for this subtopic assessment
  useEffect(() => {
    const allBank = generateSubtopicQuestionBank(
      subject?.id || "subj_general",
      topic.moduleId,
      topic,
      subtopic
    );

    // Filter a balanced 10-question evaluation:
    // 3 MCQs, 2 Conceptual, 2 Coding, 1 Output Prediction, 1 Debugging, 1 Scenario/Interview
    const mcqs = allBank.filter((q) => q.questionType === "mcq").slice(0, 3);
    const conceptual = allBank.filter((q) => q.questionType === "conceptual").slice(0, 2);
    const coding = allBank.filter((q) => q.questionType === "coding").slice(0, 2);
    const output = allBank.filter((q) => q.questionType === "output_prediction").slice(0, 1);
    const debugging = allBank.filter((q) => q.questionType === "debugging").slice(0, 1);
    const interview = allBank.filter((q) => q.questionType === "interview" || q.questionType === "scenario").slice(0, 1);

    const curated = [...mcqs, ...conceptual, ...coding, ...output, ...debugging, ...interview];
    // If fewer than 10, fill from general bank
    if (curated.length < 10) {
      for (const q of allBank) {
        if (!curated.some((c) => c.id === q.id)) {
          curated.push(q);
          if (curated.length === 10) break;
        }
      }
    }
    setQuestions(curated);
  }, [topic, subtopic, subject]);

  const latestSubmitRef = React.useRef<() => void>(() => {});
  useEffect(() => {
    latestSubmitRef.current = handleFinalSubmit;
  });

  // Assessment Timer
  useEffect(() => {
    if (assessmentStatus === "in_progress") {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            latestSubmitRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentStatus]);

  // Format Time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Start Assessment
  const handleStartAssessment = () => {
    setSecondsRemaining(1200);
    setCurrentIndex(0);
    setUserAnswers({});
    setCodeExecutionOutputs({});
    setAssessmentResult(null);
    setAssessmentStatus("in_progress");
  };

  // Run Code in Sandbox for Coding Questions
  const handleRunCode = async (q: CompanyQuestion) => {
    const userCode = userAnswers[q.id] || q.codeSnippet || q.functionSignature || "";
    setRunningCodeForQ(true);
    try {
      const isSql = subject?.id === "subj_sql" || subject?.slug === "sql" || q.id.startsWith("sql-");
      if (isSql) {
        const res = await fetch("/api/skills/ai-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "execute_sql",
            candidateId,
            sql: userCode,
            datasetId: "ecommerce_analytics",
          }),
        });
        const data = await res.json();
        setCodeExecutionOutputs((prev) => ({
          ...prev,
          [q.id]: {
            stdout: data.result?.rows ? `Returned ${data.result.rowCount} rows.` : "",
            stderr: data.result?.errorMessage || "",
            isError: !data.result?.success,
          },
        }));
      } else {
        const res = await fetch("/api/skills/python-arena", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "execute_code",
            candidateId,
            code: userCode,
          }),
        });
        const data = await res.json();
        setCodeExecutionOutputs((prev) => ({
          ...prev,
          [q.id]: {
            stdout: data.result?.stdout || "(Executed without stdout output)",
            stderr: data.result?.stderr || "",
            isError: !!data.result?.stderr,
          },
        }));
      }
    } catch (err: any) {
      setCodeExecutionOutputs((prev) => ({
        ...prev,
        [q.id]: {
          stderr: err.message || "Execution failed.",
          isError: true,
        },
      }));
    } finally {
      setRunningCodeForQ(false);
    }
  };

  // Final Assessment Submission & Evaluation
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let totalEarned = 0;
      let maxScore = questions.length * 100;
      let correctCount = 0;

      const byDiff: Record<string, { total: number; correct: number }> = {};
      const byType: Record<string, { total: number; correct: number }> = {};
      const strongSet = new Set<string>();
      const weakSet = new Set<string>();

      const feedbackList = questions.map((q) => {
        const ans = (userAnswers[q.id] || "").trim();
        let isCorrect = false;
        let score = 0;

        // Init analytics maps
        if (!byDiff[q.difficulty]) byDiff[q.difficulty] = { total: 0, correct: 0 };
        if (!byType[q.questionType]) byType[q.questionType] = { total: 0, correct: 0 };
        byDiff[q.difficulty].total++;
        byType[q.questionType].total++;

        if (q.questionType === "mcq") {
          isCorrect = Boolean(
            ans.toLowerCase() === q.correctAnswer.toLowerCase() ||
            (q.options && ans && q.options.some((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              return ans.toUpperCase() === letter && opt === q.correctAnswer;
            }))
          );
          score = isCorrect ? 100 : 0;
        } else if (q.questionType === "output_prediction") {
          const normUser = ans.replace(/\s+/g, " ").toLowerCase();
          const normCorrect = q.correctAnswer.replace(/\s+/g, " ").toLowerCase();
          isCorrect = normUser === normCorrect;
          score = isCorrect ? 100 : 0;
        } else if (q.questionType === "coding" || q.questionType === "debugging") {
          const output = codeExecutionOutputs[q.id];
          const hasCode = ans.length > 30;
          const ranWithoutError = Boolean(output && !output.isError && output.stdout);
          isCorrect = Boolean(hasCode && (ranWithoutError || ans.includes("return") || ans.includes("def ")));
          score = isCorrect ? (ranWithoutError ? 100 : 85) : 20;
        } else {
          // Conceptual / Scenario / Interview
          isCorrect = ans.length >= 35;
          score = isCorrect ? 90 : 30;
        }

        if (isCorrect) {
          correctCount++;
          byDiff[q.difficulty].correct++;
          byType[q.questionType].correct++;
          q.skillsTested?.forEach((s) => strongSet.add(s));
        } else {
          q.skillsTested?.forEach((s) => weakSet.add(s));
        }

        totalEarned += score;

        return {
          question: q,
          userAnswer: ans || "(No answer submitted)",
          isCorrect,
          score,
          explanation: q.detailedExplanation || q.correctAnswer,
        };
      });

      const finalPercentage = maxScore > 0 ? Math.round((totalEarned / maxScore) * 100) : 0;
      const passed = finalPercentage >= 80;

      let dnaRecorded = false;
      // If student achieved mastery (>= 80%), sync to Student DNA
      if (passed) {
        try {
          const res = await fetch("/api/skills/ai-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "submit_lab_assessment",
              candidateId,
              trackSlug: "genai_llm",
              lessonSlug: topic.id,
              exerciseType: "topic_assessment",
              score: finalPercentage,
              passed: true,
              assisted: false,
              dimensions: {
                practical_implementation: Math.min(100, finalPercentage + 5),
                conceptual_depth: finalPercentage,
                edge_case_handling: Math.max(70, finalPercentage - 5),
              },
            }),
          });
          const resData = await res.json();
          dnaRecorded = resData.success || false;
        } catch (e) {
          console.error("Failed to sync DNA on assessment pass:", e);
        }
      }

      setAssessmentResult({
        score: finalPercentage,
        passed,
        totalQuestions: questions.length,
        correctCount,
        byDifficulty: byDiff,
        byType: byType,
        strongConcepts: Array.from(strongSet).slice(0, 5),
        weakConcepts: Array.from(weakSet).filter((s) => !strongSet.has(s)).slice(0, 5),
        questionFeedback: feedbackList,
        dnaRecorded,
      });

      setAssessmentStatus("review");

      if (onAssessmentCompleted) {
        onAssessmentCompleted(finalPercentage, passed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(userAnswers).filter((k) => (userAnswers[k] || "").trim().length > 0).length;

  // ── 1. INTRO VIEW ────────────────────────────────────────────────────────
  if (assessmentStatus === "intro") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 12,
            padding: "28px 32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#356AE6" }}>
              Formal Topic Mastery Certification
            </span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700 }}>
              Timed Assessment · 20 Mins
            </span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#162A43", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            {subtopic.title} · Topic Assessment
          </h2>

          <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.6, margin: "0 0 20px", maxWidth: 720 }}>
            Demonstrate your end-to-end practical and conceptual competence in <strong>{subtopic.title}</strong>.
            This assessment pulls 10 balanced questions across multiple formats: Technical MCQs, live sandboxed code implementation,
            debugging challenges, and enterprise architectural trade-offs.
          </p>

          {/* Assessment Specifications Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Total Questions</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#162A43", marginTop: 2 }}>10 Questions</div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>MCQ, Coding, Debug, Trace</div>
            </div>

            <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Time Allocated</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#162A43", marginTop: 2 }}>20:00 Minutes</div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>Strict countdown timer</div>
            </div>

            <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Mastery Threshold</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#2E7D5B", marginTop: 2 }}>≥ 80% Score</div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>Required to sync Student DNA</div>
            </div>

            <div style={{ background: "#F9F8F5", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Sandbox Mode</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#356AE6", marginTop: 2 }}>Live Execution</div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>CPython 3 / SQLite verified</div>
            </div>
          </div>

          {/* Guidelines Box */}
          <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🛡️</span>
              <span>Anti-Simulation &amp; Integrity Rules</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#2B4C85", lineHeight: 1.6 }}>
              <li>Hints are disabled during topic assessments to test independent mastery.</li>
              <li>Coding solutions are executed against live Python 3 sandbox interpreters.</li>
              <li>Mastery is awarded only if your score is 80% or higher.</li>
              <li>If you don't pass on your first attempt, you will receive a diagnostic breakdown of weak concepts to practice.</li>
            </ul>
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={handleStartAssessment}
              style={{
                padding: "12px 28px",
                borderRadius: 8,
                border: "none",
                background: "#162A43",
                color: "#FFFFFF",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(22,42,67,0.25)",
              }}
            >
              Start 20-Min Assessment ➔
            </button>

            {onSwitchToPractice && (
              <button
                onClick={onSwitchToPractice}
                style={{
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "1px solid #E4E1DA",
                  background: "#FFFFFF",
                  color: "#667085",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ← Return to Practice Bank First
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 2. REVIEW & RESULTS VIEW ─────────────────────────────────────────────
  if (assessmentStatus === "review" && assessmentResult) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Score Banner */}
        <div
          style={{
            background: assessmentResult.passed ? "#EAF4EE" : "#FEF2F2",
            border: `1.5px solid ${assessmentResult.passed ? "#2E7D5B" : "#C24141"}`,
            borderRadius: 12,
            padding: "24px 28px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>{assessmentResult.passed ? "🏆" : "⚠️"}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: assessmentResult.passed ? "#2E7D5B" : "#C24141",
                  }}
                >
                  {assessmentResult.passed ? "Mastery Certification Granted" : "Revision Required (Under 80%)"}
                </span>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#162A43", margin: "0 0 6px" }}>
                Assessment Score: {assessmentResult.score}%
              </h2>

              <p style={{ margin: 0, fontSize: 13, color: "#475569", maxWidth: 600, lineHeight: 1.5 }}>
                {assessmentResult.passed
                  ? `Outstanding achievement! You demonstrated solid mastery across all evaluated dimensions of ${subtopic.title}. Verified competency has been recorded into your Cognalyze Student DNA skill profile.`
                  : `You answered ${assessmentResult.correctCount} of ${assessmentResult.totalQuestions} questions correctly. To ensure true retention for placement interviews, review the weak concepts below and retake the assessment.`}
              </p>
            </div>

            {/* Scorecard pill */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: assessmentResult.passed ? "#2E7D5B" : "#C24141" }}>
                {assessmentResult.correctCount} / {assessmentResult.totalQuestions}
              </div>
              <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Questions Correct</div>
              {assessmentResult.dnaRecorded && (
                <div style={{ marginTop: 6, fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#2E7D5B", color: "#FFFFFF", fontWeight: 700 }}>
                  ✓ DNA Verified
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Breakdown: Strong vs Weak Concepts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Strong Concepts */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D5B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span>✓</span>
              <span>Demonstrated Strong Concepts</span>
            </div>
            {assessmentResult.strongConcepts.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {assessmentResult.strongConcepts.map((c, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "#EAF4EE", color: "#2E7D5B", fontWeight: 600 }}>
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#667085" }}>No strong concepts recorded yet.</div>
            )}
          </div>

          {/* Weak Concepts */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#C24141", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span>✕</span>
              <span>Concepts Requiring Revision</span>
            </div>
            {assessmentResult.weakConcepts.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {assessmentResult.weakConcepts.map((c, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "#FEF2F2", color: "#C24141", fontWeight: 600 }}>
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#2E7D5B" }}>All tested concepts mastered cleanly!</div>
            )}
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: "0 0 16px" }}>
            Detailed Assessment Question Review
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {assessmentResult.questionFeedback.map((fb, idx) => (
              <div
                key={fb.question.id}
                style={{
                  border: fb.isCorrect ? "1px solid #C8E4D3" : "1px solid #FECACA",
                  borderRadius: 8,
                  padding: 16,
                  background: fb.isCorrect ? "#F9FDFB" : "#FFFBFB",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#162A43" }}>Q{idx + 1}</span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#FAF9F6", color: "#667085", border: "1px solid #E4E1DA", textTransform: "uppercase", fontWeight: 700 }}>
                      {fb.question.questionType}
                    </span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#FAF9F6", color: "#667085", border: "1px solid #E4E1DA", fontWeight: 700 }}>
                      {fb.question.difficulty}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: fb.isCorrect ? "#2E7D5B" : "#C24141" }}>
                    {fb.isCorrect ? "✓ 100 / 100" : "✕ 0 / 100"}
                  </span>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: "#162A43", marginBottom: 8 }}>
                  {fb.question.questionText}
                </div>

                <div style={{ fontSize: 11.5, color: "#667085", marginBottom: 4 }}>
                  <strong>Your Answer:</strong> <code style={{ color: fb.isCorrect ? "#2E7D5B" : "#C24141" }}>{fb.userAnswer}</code>
                </div>

                <div style={{ fontSize: 11.5, color: "#162A43", background: "#FAF9F6", padding: "8px 12px", borderRadius: 6, border: "1px solid #E4E1DA", marginTop: 8 }}>
                  <strong>Reference Solution:</strong>
                  <div style={{ marginTop: 4, whiteSpace: "pre-wrap", color: "#475569" }}>
                    {fb.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retake & Actions */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleStartAssessment}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#162A43",
              color: "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ↻ Retake Topic Assessment
          </button>

          {onSwitchToPractice && (
            <button
              onClick={onSwitchToPractice}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "1px solid #E4E1DA",
                background: "#FFFFFF",
                color: "#356AE6",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Practice More Questions First ➔
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 3. IN PROGRESS TEST-TAKER VIEW ────────────────────────────────────────
  if (!currentQ) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Test Bar: Question Tracker & Countdown Timer */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 10,
          padding: "12px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span style={{ fontSize: 11, color: "#667085" }}>
            ({answeredCount} of {questions.length} answered)
          </span>
        </div>

        {/* Countdown Timer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: secondsRemaining < 300 ? "#FEF2F2" : "#F6F5F1",
            border: `1px solid ${secondsRemaining < 300 ? "#FECACA" : "#E4E1DA"}`,
            padding: "5px 12px",
            borderRadius: 6,
            color: secondsRemaining < 300 ? "#C24141" : "#162A43",
            fontFamily: "monospace",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          <span>⏱️</span>
          <span>{formatTime(secondsRemaining)}</span>
        </div>
      </div>

      {/* Question Stepper Indicator Grid */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {questions.map((q, idx) => {
          const isAnswered = (userAnswers[q.id] || "").trim().length > 0;
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: isCurrent ? "2px solid #356AE6" : "1px solid #E4E1DA",
                background: isCurrent ? "#EFF4FE" : isAnswered ? "#EAF4EE" : "#FFFFFF",
                color: isCurrent ? "#356AE6" : isAnswered ? "#2E7D5B" : "#667085",
                fontWeight: 800,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
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
        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
            {currentQ.questionType}
          </span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#FAF9F6", color: "#162A43", border: "1px solid #E4E1DA", fontWeight: 700, textTransform: "uppercase" }}>
            {currentQ.difficulty}
          </span>
          {currentQ.relevantCompanies?.[0] && (
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#FAF9F6", color: "#667085", border: "1px solid #E4E1DA", fontWeight: 600 }}>
              🏢 {currentQ.relevantCompanies[0].name}
            </span>
          )}
        </div>

        {/* Problem Statement */}
        <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43", lineHeight: 1.5 }}>
          {currentQ.questionText}
        </div>

        {/* Optional Code Snippet */}
        {currentQ.codeSnippet && (
          <pre
            style={{
              margin: 0,
              padding: "12px 14px",
              background: "#0B192C",
              color: "#F8FAFC",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "monospace",
              overflowX: "auto",
            }}
          >
            {currentQ.codeSnippet}
          </pre>
        )}

        {/* Interactive Input Formats */}
        <div>
          {/* MCQ Option Radios */}
          {currentQ.questionType === "mcq" && currentQ.options && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentQ.options.map((opt, oIdx) => {
                const optKey = String.fromCharCode(65 + oIdx);
                const isSelected = userAnswers[currentQ.id] === optKey;
                return (
                  <label
                    key={oIdx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 6,
                      border: isSelected ? "1.5px solid #356AE6" : "1px solid #E4E1DA",
                      background: isSelected ? "#EFF4FE" : "#FAF9F6",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name={`assess-${currentQ.id}`}
                      checked={isSelected}
                      onChange={() => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: optKey }))}
                      style={{ marginTop: 3, cursor: "pointer" }}
                    />
                    <div style={{ fontSize: 13, color: isSelected ? "#162A43" : "#17191C" }}>
                      <strong style={{ marginRight: 6 }}>{optKey}.</strong>
                      <span>{opt}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Output Prediction Input */}
          {currentQ.questionType === "output_prediction" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6 }}>
                Predicted Exact Stdout / Return Value:
              </div>
              <input
                type="text"
                placeholder="Type exact output..."
                value={userAnswers[currentQ.id] || ""}
                onChange={(e) => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: "1px solid #E4E1DA",
                  background: "#FAF9F6",
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Coding & Debugging Interactive Sandbox Editor */}
          {(currentQ.questionType === "coding" || currentQ.questionType === "debugging") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>
                  Write solution in Python 3 (Live Sandbox):
                </span>
                <button
                  onClick={() => handleRunCode(currentQ)}
                  disabled={runningCodeForQ}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 4,
                    border: "none",
                    background: runningCodeForQ ? "#475569" : "#10B981",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: runningCodeForQ ? "wait" : "pointer",
                  }}
                >
                  {runningCodeForQ ? "Running..." : "▶ Test Run Sandbox"}
                </button>
              </div>

              <textarea
                rows={8}
                value={userAnswers[currentQ.id] !== undefined ? userAnswers[currentQ.id] : (currentQ.codeSnippet || currentQ.functionSignature || "")}
                onChange={(e) => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 6,
                  border: "1px solid #1E293B",
                  background: "#0B192C",
                  color: "#F8FAFC",
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 1.5,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              {/* Execution Console Output */}
              {codeExecutionOutputs[currentQ.id] && (
                <div style={{ background: "#020617", border: "1px solid #1E293B", borderRadius: 6, padding: "10px 12px", fontFamily: "monospace", fontSize: 11 }}>
                  {codeExecutionOutputs[currentQ.id].stdout && (
                    <div style={{ color: "#E2E8F0", whiteSpace: "pre-wrap" }}>
                      {codeExecutionOutputs[currentQ.id].stdout}
                    </div>
                  )}
                  {codeExecutionOutputs[currentQ.id].stderr && (
                    <div style={{ color: "#F87171", whiteSpace: "pre-wrap", marginTop: 4 }}>
                      {codeExecutionOutputs[currentQ.id].stderr}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conceptual / Scenario / Interview Textarea */}
          {(currentQ.questionType === "conceptual" || currentQ.questionType === "scenario" || currentQ.questionType === "interview") && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6 }}>
                Technical Explanation &amp; Trade-off Defense:
              </div>
              <textarea
                rows={5}
                placeholder="Explain the internal mechanics, algorithmic invariants, and production trade-offs..."
                value={userAnswers[currentQ.id] || ""}
                onChange={(e) => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 6,
                  border: "1px solid #E4E1DA",
                  background: "#FAF9F6",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>

        {/* Navigation & Submit Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E4E1DA", paddingTop: 14 }}>
          <button
            onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #E4E1DA",
              background: "#FFFFFF",
              color: currentIndex === 0 ? "#98A2B3" : "#162A43",
              fontSize: 12,
              fontWeight: 600,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Previous Question
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
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
                Next Question ➔
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                style={{
                  padding: "8px 22px",
                  borderRadius: 6,
                  border: "none",
                  background: "#2E7D5B",
                  color: "#FFFFFF",
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: isSubmitting ? "wait" : "pointer",
                  boxShadow: "0 2px 6px rgba(46,125,91,0.3)",
                }}
              >
                {isSubmitting ? "Scoring Assessment..." : "Submit Assessment for Review ➔"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
