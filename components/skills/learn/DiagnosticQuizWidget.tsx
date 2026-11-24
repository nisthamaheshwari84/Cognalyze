"use client";

import React, { useState } from "react";
import { EducationalLayer9VerificationRubric } from "@/lib/skills/learn/content-schemas";
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  ShieldCheck
} from "lucide-react";

export interface DiagnosticQuizWidgetProps {
  rubric: EducationalLayer9VerificationRubric;
  language: "en" | "hinglish";
  className?: string;
}

export default function DiagnosticQuizWidget({
  rubric,
  language,
  className = ""
}: DiagnosticQuizWidgetProps) {
  // Track selected options: { [questionId]: optionId }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const handleSelectAnswer = (qId: string, optId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = rubric.diagnosticQuestions.filter((q) => {
    const selectedOptId = selectedAnswers[q.id];
    const opt = q.options?.find((o) => o.optionId === selectedOptId);
    return opt?.isCorrect;
  }).length;

  return (
    <div
      className={`bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col space-y-6 ${className}`}
    >
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Understanding Verification Rubric</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#162A43]">
            Diagnostic Self-Assessment & Misconception Check
          </h3>
        </div>

        {/* Score Pill */}
        {rubric.diagnosticQuestions.length > 0 && (
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl self-start sm:self-center">
            <Award className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-900">
              Verified: {correctCount} / {rubric.diagnosticQuestions.length}
            </span>
          </div>
        )}
      </div>

      {/* ── ESSENTIAL CORE IDEAS (RUBRIC MATRIX) ─────────────────── */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span>Essential Conceptual Pillars (Passing Score: {rubric.minimumPassingMasteryScore}%)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rubric.essentialCoreIdeas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-extrabold text-[#162A43]">
                  {idea.conceptLabel}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0 font-bold">
                  {idea.weightPercentage}% Weight
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {idea.semanticExpectation[language] || idea.semanticExpectation.en}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {idea.requiredKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-semibold"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DIAGNOSTIC ASSESSMENT QUESTIONS ───────────────────────── */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Targeted Multiple-Choice Invariant Checks
        </div>

        {rubric.diagnosticQuestions.map((q, idx) => {
          const selectedOptId = selectedAnswers[q.id];
          const selectedOption = q.options?.find((o) => o.optionId === selectedOptId);

          return (
            <div
              key={q.id}
              className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-start space-x-2">
                <span className="font-mono text-xs font-bold text-slate-500 px-2 py-0.5 bg-white border border-slate-200 rounded">
                  Q{idx + 1}
                </span>
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {q.questionPrompt[language] || q.questionPrompt.en}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {q.options?.map((opt) => {
                  const isSelected = selectedOptId === opt.optionId;
                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      onClick={() => handleSelectAnswer(q.id, opt.optionId)}
                      className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all duration-150 flex items-start space-x-3 ${
                        isSelected
                          ? opt.isCorrect
                            ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-xs"
                            : "bg-rose-50 border-2 border-rose-500 text-rose-950 font-bold shadow-xs"
                          : "bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/20 shadow-xs"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isSelected ? (
                          opt.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          )
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div>{opt.text[language] || opt.text.en}</div>
                        {isSelected && (
                          <div
                            className={`mt-2 text-xs pt-2 border-t font-normal ${
                              opt.isCorrect
                                ? "border-emerald-200 text-emerald-800"
                                : "border-rose-200 text-rose-800"
                            }`}
                          >
                            {opt.explanation[language] || opt.explanation.en}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Misconception Alert if wrong answer selected */}
              {selectedOption && !selectedOption.isCorrect && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-950 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Conceptual Breakdown: </span>
                    {selectedOption.explanation[language] || selectedOption.explanation.en}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
