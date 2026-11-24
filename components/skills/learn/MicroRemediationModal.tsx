"use client";

import React, { useState } from "react";
import { MicroRemediationCard } from "@/lib/skills/learn/remediation-graph";
import {
  LifeBuoy,
  X,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from "lucide-react";

export interface MicroRemediationModalProps {
  card: MicroRemediationCard;
  language: "en" | "hinglish";
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function MicroRemediationModal({
  card,
  language,
  isOpen,
  onClose,
  className = ""
}: MicroRemediationModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedOpt = card.quickCheckQuestion.options.find(
    (o) => o.optionId === selectedOptionId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-2xl bg-white border border-amber-300 rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 ${className}`}
      >
        {/* ── HEADER ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Targeted Prerequisite Repair (2-Min Micro-Lesson)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#162A43] mt-0.5">
                {card.title[language] || card.title.en}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Foundational Source: {card.rootCauseTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── PREREQUISITE GAP ALERT ──────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Conceptual Breakdown: </span>
            {card.explanation[language] || card.explanation.en}
          </div>
        </div>

        {/* ── CORE MICRO LESSON EXPLANATION ───────────────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Root Intuition & Visual Analogy</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
            {card.visualAnalogy[language] || card.visualAnalogy.en}
          </p>
        </div>

        {/* ── INTERACTIVE 1-QUESTION VERIFICATION CHECK ────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Verify Quick Comprehension
          </div>
          <div className="text-sm font-bold text-slate-900 leading-snug">
            {card.quickCheckQuestion.prompt[language] ||
              card.quickCheckQuestion.prompt.en}
          </div>

          <div className="space-y-2 pt-1">
            {card.quickCheckQuestion.options.map((opt) => {
              const isSelected = selectedOptionId === opt.optionId;
              return (
                <button
                  key={opt.optionId}
                  type="button"
                  onClick={() => setSelectedOptionId(opt.optionId)}
                  className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all duration-150 flex items-start space-x-3 ${
                    isSelected
                      ? opt.isCorrect
                        ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-xs"
                        : "bg-rose-50 border-2 border-rose-500 text-rose-950 font-bold shadow-xs"
                      : "bg-white border-slate-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50/20 shadow-xs"
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
                  <div>{opt.text[language] || opt.text.en}</div>
                </button>
              );
            })}
          </div>

          {/* Answer Feedback */}
          {selectedOpt && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium animate-fade-in ${
                selectedOpt.isCorrect
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <span className="font-bold">
                {selectedOpt.isCorrect ? "Correct! " : "Notice: "}
              </span>
              {selectedOpt.explanation[language] || selectedOpt.explanation.en}
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS ───────────────────────────────────────── */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#162A43] hover:bg-[#1E3A5F] text-white text-xs sm:text-sm font-bold shadow-xs transition"
          >
            I Understand, Resume Learning
          </button>
        </div>
      </div>
    </div>
  );
}
