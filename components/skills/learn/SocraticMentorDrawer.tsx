"use client";

import React, { useState } from "react";
import {
  FreeTextEvaluationResponse,
  SocraticTutorResponse
} from "@/lib/skills/learn/socratic-evaluator";
import {
  Sparkles,
  MessageSquare,
  FileCheck,
  Send,
  X,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  Loader2,
  RotateCcw
} from "lucide-react";

export interface SocraticMentorDrawerProps {
  microConceptId: string;
  conceptTitle: string;
  language: "en" | "hinglish";
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function SocraticMentorDrawer({
  microConceptId,
  conceptTitle,
  language,
  isOpen,
  onClose,
  className = ""
}: SocraticMentorDrawerProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "evaluate">("chat");

  // ── Socratic Chat State ──
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        language === "hinglish"
          ? `Namaste! Main aapka Socratic AI Mentor hoon. "${conceptTitle}" ke kisi bhi concept, invariant ya intuition ke baare me puchiye. Main aapko seedha answer dene ke bajaye aisi intuition dunga jisse aap khud derive kar sakein!`
          : `Hello! I'm your Socratic AI Mentor for "${conceptTitle}". Ask me anything about the intuition, loop invariants, or edge cases. I'll guide you to deduce the answer through mental models rather than spoon-feeding!`
    }
  ]);
  const [userInput, setUserInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // ── Free-Text Evaluation State ──
  const [explanationText, setExplanationText] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<FreeTextEvaluationResponse | null>(null);

  if (!isOpen) return null;

  // Handle Socratic Chat Send
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || userInput;
    if (!text.trim() || isChatLoading) return;

    const newMessages = [...chatMessages, { role: "user" as const, content: text.trim() }];
    setChatMessages(newMessages);
    setUserInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/learn/socratic-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          microConceptId,
          conceptTitle,
          language,
          conversationHistory: newMessages.map((m) => ({
            role: m.role,
            content: m.content
          })),
          userMessage: text.trim()
        })
      });

      if (res.ok) {
        const data: SocraticTutorResponse = await res.json();
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply }
        ]);
      } else {
        throw new Error("Tutor API failed");
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            language === "hinglish"
              ? "Sochiye: Agar kisi subarray ka running sum negative ho jaye, toh kya wo aane wale elements ki value badhayega ya ghatayega?"
              : "Consider this: If a contiguous subarray produces a negative running sum, can appending it to any future positive sequence ever help?"
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Free-Text Understanding Evaluation
  const handleEvaluate = async () => {
    if (!explanationText.trim() || isEvaluating) return;
    setIsEvaluating(true);

    try {
      const res = await fetch("/api/learn/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          microConceptId,
          conceptTitle,
          language,
          userExplanation: explanationText.trim()
        })
      });

      if (res.ok) {
        const data: FreeTextEvaluationResponse = await res.json();
        setEvaluationResult(data);
      }
    } catch (err) {
      console.error("Evaluation failed", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-xl bg-white border-l border-[#E4E1DA] shadow-2xl flex flex-col h-full ${className}`}
      >
        {/* ── DRAWER HEADER ────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#F8F9FA] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-[#162A43]">
                  Socratic AI Mentor
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                  {language.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[280px] sm:max-w-sm">
                {conceptTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── MODE TABS ────────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center space-x-2 pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === "chat"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Socratic Inquiry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("evaluate")}
            className={`flex items-center space-x-2 pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === "evaluate"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Verify Explanation</span>
          </button>
        </div>

        {/* ── TAB 1: SOCRATIC CHAT ──────────────────────────────────── */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-2.5 ${
                    msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                      msg.role === "user"
                        ? "bg-[#162A43] text-white"
                        : "bg-purple-100 border border-purple-200 text-purple-800"
                    }`}
                  >
                    {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-[#162A43] text-white rounded-tr-none shadow-xs"
                        : "bg-slate-100 border border-slate-200/80 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center space-x-2 text-xs text-purple-600 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span>Socratic Mentor is reflecting...</span>
                </div>
              )}
            </div>

            {/* Suggested Starter Prompts */}
            {chatMessages.length <= 2 && (
              <div className="px-4 pb-2">
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center">
                  <Lightbulb className="w-3 h-3 text-amber-500 mr-1" />
                  Try asking:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Why do we reset when currSum < 0?",
                    "What if all elements are negative?",
                    "Difference between subsequence and subarray?"
                  ].map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder={
                    language === "hinglish"
                      ? "Puchiye: 'Agar saare numbers negative hon toh kya hoga?'..."
                      : "Ask: 'Why don't we reset when an individual number is negative?'..."
                  }
                  className="flex-1 bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-600"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!userInput.trim() || isChatLoading}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: FREE-TEXT VERIFICATION ────────────────────────── */}
        {activeTab === "evaluate" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
                Proof of Understanding Rubric
              </div>
              <h4 className="text-sm sm:text-base font-black text-[#162A43]">
                Explain {conceptTitle} in your own words
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Explain why a negative running sum is discarded, how currSum differs from maxSum, and how edge cases (like all-negative numbers) are handled. No need to memorize formulas!
              </p>
            </div>

            <textarea
              rows={5}
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              placeholder={
                language === "hinglish"
                  ? "Jaise: Kadane's algorithm me hum array ko ek baar traverse karte hain. Jab bhi running sum 0 se niche chala jata hai..."
                  : "E.g. In Kadane's algorithm, we perform a single linear scan. Whenever the cumulative running sum drops below zero, it acts as a penalty..."
              }
              className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 rounded-2xl p-4 focus:outline-none focus:border-blue-600 leading-relaxed font-medium"
            />

            <button
              type="button"
              onClick={handleEvaluate}
              disabled={!explanationText.trim() || isEvaluating}
              className="w-full py-3 rounded-xl bg-[#356AE6] hover:bg-[#2557CA] disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xs transition"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Conceptual Mastery...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Verify My Conceptual Understanding</span>
                </>
              )}
            </button>

            {/* Evaluation Results Card */}
            {evaluationResult && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
                {/* Score Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-2xl font-black font-mono ${
                        evaluationResult.isPassing ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {evaluationResult.overallMasteryScore}%
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Mastery Score</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      evaluationResult.isPassing
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {evaluationResult.isPassing ? "Concepts Understood" : "Needs Revision"}
                  </span>
                </div>

                {/* Socratic Feedback */}
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {evaluationResult.socraticFeedback}
                </div>

                {/* Criteria Breakdown */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Pillar Breakdown
                  </div>
                  {evaluationResult.criteriaResults.map((crit) => (
                    <div
                      key={crit.criterionId}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex flex-col space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {crit.conceptLabel} ({crit.weightPercentage}%)
                        </span>
                        {crit.isUnderstood ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {crit.missingNuance}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Thought Challenge */}
                {evaluationResult.followUpThoughtChallenge && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900">
                    <span className="font-bold text-purple-800 block mb-1">
                      Mentor's Follow-up Riddle:
                    </span>
                    {evaluationResult.followUpThoughtChallenge}
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
