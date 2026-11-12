"use client";

import React, { useState } from "react";
import { CustomInterviewSession } from "@/lib/skills/custom-interview-engine";
import {
  X,
  Sparkles,
  Sliders,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  Terminal,
  Send,
  MessageSquare,
  AlertCircle,
  ArrowRight
} from "lucide-react";

interface CustomInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
}

export default function CustomInterviewModal({ isOpen, onClose, candidateId }: CustomInterviewModalProps) {
  // Configuration State
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["dsa", "sql", "os"]);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Medium");
  const [questionCount, setQuestionCount] = useState(3);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [format, setFormat] = useState<"coding" | "spoken" | "mixed">("mixed");
  const [preferredLanguage, setPreferredLanguage] = useState("cpp");

  // Active Session State
  const [activeSession, setActiveSession] = useState<CustomInterviewSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [defenseAnswer, setDefenseAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [defending, setDefending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleToggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleCreateSession = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/skills/custom-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          selectedSubjects,
          difficulty,
          questionCount,
          durationMinutes,
          format,
          preferredLanguage,
          targetRole: "Software Development Engineer (SDE-1)",
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        setCandidateAnswer("");
        setDefenseAnswer("");
      } else {
        setErrorMsg(data.error || "Failed to initialize interview.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const currentQ = activeSession?.questions[activeSession.currentQuestionIndex];

  const handleSubmitAnswer = async () => {
    if (!activeSession || !candidateAnswer.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/skills/custom-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_answer",
          sessionId: activeSession.sessionId,
          questionIndex: activeSession.currentQuestionIndex,
          answer: candidateAnswer,
          language: preferredLanguage
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDefense = async () => {
    if (!activeSession || !defenseAnswer.trim()) return;
    setDefending(true);
    try {
      const res = await fetch("/api/skills/custom-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_defense",
          sessionId: activeSession.sessionId,
          questionIndex: activeSession.currentQuestionIndex,
          defenseText: defenseAnswer
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit follow-up defense.");
    } finally {
      setDefending(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const res = await fetch("/api/skills/custom-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "next",
          sessionId: activeSession.sessionId
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        setCandidateAnswer("");
        setDefenseAnswer("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to advance question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162A43]/50 backdrop-blur-sm">
      <div className="bg-[#FFFFFF] border border-[#E4E1DA] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col text-[#17191C]">
        {/* Header */}
        <div className="p-6 border-b border-[#E4E1DA] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4FE] border border-[#D2E0FB] flex items-center justify-center text-[#356AE6]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#162A43] flex items-center gap-2">
                Custom Multi-Subject Interview Engine
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF4FE] text-[#356AE6] border border-[#D2E0FB]">
                  Targeted Builder
                </span>
              </h2>
              <p className="text-xs text-[#667085]">Compose custom combinations across DSA, OS, DBMS, SQL, Networks, and OOP with locked question sets.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-[#EFF4FE] text-[#667085] hover:text-[#162A43] flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {!activeSession ? (
          // SETUP CONFIGURATION VIEW
          <div className="p-8 space-y-8 bg-[#FFFFFF]">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-[#FDF0F0] border border-[#F5C6C6] text-xs text-[#C24141] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#C24141]" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Composable Subject Picker */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-3 block">
                1. Select Combination of Subjects (Select 1 or more)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { id: "dsa", label: "DSA & Algorithms", badge: "Executable Code" },
                  { id: "sql", label: "SQL Practical", badge: "Relational Engine" },
                  { id: "os", label: "Operating Systems", badge: "Core Systems" },
                  { id: "dbms", label: "DBMS & ACID", badge: "Data Systems" },
                  { id: "cn", label: "Computer Networks", badge: "Protocols" },
                  { id: "oop", label: "OOP & Design", badge: "Architecture" },
                  { id: "concurrency", label: "Concurrency", badge: "Thread Safety" },
                ].map(sub => {
                  const isChecked = selectedSubjects.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleToggleSubject(sub.id)}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isChecked
                          ? "bg-[#EFF4FE] border-[#356AE6] text-[#162A43] shadow-sm"
                          : "bg-[#FAF9F6] border-[#E4E1DA] text-[#667085] hover:border-[#356AE6]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{sub.label}</span>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-[#356AE6]" />}
                      </div>
                      <span className="text-[10px] text-[#667085] bg-[#FFFFFF] px-2 py-0.5 rounded w-fit border border-[#E4E1DA]">
                        {sub.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Difficulty */}
              <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-4 rounded-xl">
                <label className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2 block">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E1DA] rounded-lg px-3 py-2 text-sm text-[#162A43] focus:outline-none focus:border-[#356AE6]"
                >
                  <option value="Easy">Easy (L3 Foundational)</option>
                  <option value="Medium">Medium (L4 Core Mid-Tier)</option>
                  <option value="Hard">Hard (L5 Senior FAANG)</option>
                  <option value="Mixed">Mixed (Progressive Ladder)</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-4 rounded-xl">
                <label className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2 block">
                  Question Count: <span className="text-[#356AE6] font-bold">{questionCount} Questions</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-[#356AE6] mt-2"
                />
                <div className="flex justify-between text-[11px] text-[#667085] mt-1">
                  <span>2 Questions</span>
                  <span>5 Questions</span>
                </div>
              </div>

              {/* Duration & Language */}
              <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-4 rounded-xl">
                <label className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2 block">
                  Coding Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E1DA] rounded-lg px-3 py-2 text-sm text-[#162A43] focus:outline-none focus:border-[#356AE6]"
                >
                  <option value="cpp">C++ (clang++ -std=c++20)</option>
                  <option value="python">Python 3 (/usr/bin/python3)</option>
                  <option value="javascript">JavaScript (Node.js vm)</option>
                </select>
              </div>
            </div>

            {/* Launch Button */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E4E1DA]">
              <div className="text-xs text-[#667085] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />
                <span>Question set locks upon creation; final scorecard reveals only after all questions are completed.</span>
              </div>
              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#356AE6] hover:bg-[#2858C7] text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Generating Frozen Question Set..." : "Begin Locked Interview Session"}
              </button>
            </div>
          </div>
        ) : activeSession.state === "COMPLETED" && activeSession.finalEvaluation ? (
          // FINAL SCORECARD VIEW (REVEALED ONLY AFTER ALL QUESTIONS FINISHED)
          <div className="p-8 space-y-6 bg-[#FFFFFF]">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF4EE] border border-[#C8E4D3] text-[#2E7D5B] text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" />
                All Questions Evaluated
              </div>
              <h3 className="text-2xl font-black text-[#162A43]">Final Technical Evaluation Scorecard</h3>
              <p className="text-xs text-[#667085]">Based on recorded code executions, query tests, and Socratic follow-up defense evidence.</p>
            </div>

            {/* Score Banner */}
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E4E1DA] flex items-center justify-around text-center">
              <div>
                <div className="text-4xl font-black text-[#356AE6]">{activeSession.finalEvaluation.overallScore}%</div>
                <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider mt-1">Overall Match Score</div>
              </div>
              <div className="h-12 w-[1px] bg-[#E4E1DA]" />
              <div>
                <div className={`text-2xl font-black ${
                  activeSession.finalEvaluation.verdict === "Strong Hire" ? "text-[#2E7D5B]" :
                  activeSession.finalEvaluation.verdict === "Hire" ? "text-[#356AE6]" : "text-[#B7791F]"
                }`}>
                  {activeSession.finalEvaluation.verdict}
                </div>
                <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider mt-1">Hiring Committee Verdict</div>
              </div>
            </div>

            {/* Evidence Summary list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-3">Recorded Evidence Breakdown</h4>
              <div className="space-y-2">
                {activeSession.finalEvaluation.evidenceSummary.map((ev, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] text-xs text-[#17191C] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E1DA] flex justify-end">
              <button
                onClick={() => setActiveSession(null)}
                className="px-6 py-2.5 rounded-xl bg-[#162A43] hover:bg-[#233F63] text-white font-semibold text-xs transition"
              >
                Configure New Interview
              </button>
            </div>
          </div>
        ) : (
          // ACTIVE QUESTION SIMULATION VIEW
          <div className="p-8 space-y-6 bg-[#FFFFFF]">
            {/* Session Status Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E1DA]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#356AE6] bg-[#EFF4FE] border border-[#D2E0FB] px-3 py-1 rounded-full uppercase tracking-wider">
                  Question {(activeSession.currentQuestionIndex + 1)} of {activeSession.questions.length}
                </span>
                <span className="text-xs text-[#667085] font-semibold uppercase tracking-wider">
                  [{currentQ?.subject.toUpperCase()}] {currentQ?.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#B7791F] bg-[#FEF7ED] px-3 py-1 rounded-full border border-[#F8D8A7]">
                <Clock className="w-3.5 h-3.5" />
                <span>Timer Active</span>
              </div>
            </div>

            {/* Problem Statement Card */}
            <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-[#162A43] flex items-center gap-2">
                <span>{currentQ?.title}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#FFFFFF] text-[#667085] border border-[#E4E1DA]">
                  {currentQ?.difficulty}
                </span>
              </h3>
              <div className="text-xs text-[#17191C] leading-relaxed whitespace-pre-line font-sans">
                {currentQ?.statement}
              </div>
            </div>

            {/* Candidate Submission Area */}
            {currentQ?.status === "unanswered" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#667085] flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#356AE6]" />
                    <span>Your Solution / Answer</span>
                  </label>
                  <span className="text-xs text-[#667085]">Provide complete implementation or structured conceptual response</span>
                </div>
                <textarea
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  rows={8}
                  placeholder="Write your code or technical explanation here..."
                  className="w-full bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl p-4 font-mono text-xs text-[#1E293B] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#356AE6] transition leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !candidateAnswer.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#356AE6] hover:bg-[#2858C7] text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? "Evaluating..." : "Submit Answer"}
                  </button>
                </div>
              </div>
            ) : (
              // SUBMITTED STATE -> SHOW FOLLOW-UP DEFENSE CHALLENGE
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-[#EAF4EE] border border-[#C8E4D3] text-xs text-[#2E7D5B] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                    <span>Answer Submitted: <strong>{currentQ?.candidateSubmission?.verdict}</strong> ({currentQ?.candidateSubmission?.score}% Score)</span>
                  </div>
                </div>

                {/* Socratic Technical Defense Prompt */}
                <div className="p-5 rounded-2xl bg-[#FEF7ED] border border-[#F8D8A7] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#B7791F] uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4" />
                    Interviewer Follow-Up Challenge
                  </div>
                  <p className="text-sm font-semibold text-[#162A43]">
                    &ldquo;{currentQ?.followUpPrompt.question}&rdquo;
                  </p>
                  <p className="text-xs text-[#667085] italic">
                    Reason: {currentQ?.followUpPrompt.whyAsked}
                  </p>

                  {currentQ?.status !== "completed" ? (
                    <div className="space-y-3 pt-2">
                      <textarea
                        value={defenseAnswer}
                        onChange={(e) => setDefenseAnswer(e.target.value)}
                        rows={4}
                        placeholder="State your technical justification, invariants, and trade-off rationale..."
                        className="w-full bg-[#FFFFFF] border border-[#E4E1DA] rounded-xl p-3 font-sans text-xs text-[#17191C] focus:outline-none focus:border-[#356AE6]"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleSubmitDefense}
                          disabled={defending || !defenseAnswer.trim()}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#B7791F] hover:bg-[#975A16] text-white font-bold text-xs transition disabled:opacity-50"
                        >
                          {defending ? "Verifying..." : "Defend Technical Reasoning"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#FFFFFF] border border-[#E4E1DA] rounded-xl text-xs text-[#17191C] space-y-1">
                      <div className="text-[#2E7D5B] font-semibold">Defense Recorded:</div>
                      <div>{currentQ?.candidateFollowUpDefense?.defenseText}</div>
                    </div>
                  )}
                </div>

                {/* Next Question Navigation */}
                {currentQ?.status === "completed" && (
                  <div className="pt-4 border-t border-[#E4E1DA] flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#162A43] hover:bg-[#233F63] text-white font-bold text-xs shadow-sm transition"
                    >
                      <span>
                        {activeSession.currentQuestionIndex < activeSession.questions.length - 1
                          ? "Proceed to Next Question"
                          : "Finalize & Generate Bar-Raiser Scorecard"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
