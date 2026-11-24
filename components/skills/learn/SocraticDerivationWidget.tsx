"use client";

import React, { useState } from "react";
import { EducationalLayer5SocraticDerivation } from "@/lib/skills/learn/content-schemas";
import {
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export interface SocraticDerivationWidgetProps {
  derivation: EducationalLayer5SocraticDerivation;
  language: "en" | "hinglish";
  className?: string;
}

export default function SocraticDerivationWidget({
  derivation,
  language,
  className = ""
}: SocraticDerivationWidgetProps) {
  // Track selected thought option per step: { [stepIndex]: optionId }
  const [selectedThoughts, setSelectedThoughts] = useState<Record<number, string>>({});

  // Track revealed hint levels per step: { [stepIndex]: Set<1 | 2 | 3> }
  const [revealedHints, setRevealedHints] = useState<Record<number, number>>({});

  const handleSelectThought = (stepIdx: number, optId: string) => {
    setSelectedThoughts((prev) => ({ ...prev, [stepIdx]: optId }));
  };

  const handleToggleHint = (stepIdx: number, level: number) => {
    setRevealedHints((prev) => {
      const currentLevel = prev[stepIdx] || 0;
      return {
        ...prev,
        [stepIdx]: currentLevel >= level ? level - 1 : level
      };
    });
  };

  return (
    <div
      className={`bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col space-y-6 ${className}`}
    >
      {/* ── HEADER & GOAL ────────────────────────────────────────── */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Socratic Guided Self-Derivation</span>
        </div>
        <h3 className="text-lg sm:text-xl font-black text-[#162A43]">
          {derivation.derivationGoal[language] || derivation.derivationGoal.en}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Don't just memorize the code. Follow these progressive thought experiments to invent the algorithm yourself.
        </p>
      </div>

      {/* ── PROGRESSIVE DILEMMA STEPS ───────────────────────────── */}
      <div className="flex flex-col space-y-6">
        {derivation.guidedSteps.map((step) => {
          const selectedOptId = selectedThoughts[step.stepIndex];
          const selectedOption = step.thoughtOptions.find((o) => o.optionId === selectedOptId);
          const currentHintLevel = revealedHints[step.stepIndex] || 0;

          return (
            <div
              key={step.stepIndex}
              className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col space-y-4"
            >
              {/* Question & Scenario */}
              <div>
                <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200 mb-2">
                  Dilemma #{step.stepIndex}
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {step.promptQuestion[language] || step.promptQuestion.en}
                </h4>
                <div className="text-xs text-slate-500 italic mt-1">
                  Context: {step.contextSituation[language] || step.contextSituation.en}
                </div>
              </div>

              {/* Thought Options */}
              <div className="flex flex-col space-y-2">
                <span className="text-xs font-bold text-slate-600">
                  Select your intuition:
                </span>
                {step.thoughtOptions.map((opt) => {
                  const isSelected = selectedOptId === opt.optionId;
                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      onClick={() => handleSelectThought(step.stepIndex, opt.optionId)}
                      className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all duration-150 flex items-start space-x-3 ${
                        isSelected
                          ? !opt.isOptimalThought
                            ? "bg-amber-50 border-2 border-amber-500 text-amber-950 font-bold shadow-xs"
                            : "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-xs"
                          : "bg-white border-slate-200 text-slate-800 hover:border-purple-300 hover:bg-purple-50/30 shadow-xs"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isSelected ? (
                          !opt.isOptimalThought ? (
                            <XCircle className="w-4 h-4 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div>{opt.text[language] || opt.text.en}</div>
                        {isSelected && (
                          <div className="mt-2 text-xs font-normal border-t border-slate-200/60 pt-2 text-slate-700">
                            {opt.feedback[language] || opt.feedback.en}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Progressive Hint Progression (3 Tiers) */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span>Progressive Socratic Hints (Need a mental push?)</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleHint(step.stepIndex, 1)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      currentHintLevel >= 1
                        ? "bg-amber-100 border-amber-300 text-amber-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Level 1: Gentle Nudge
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleHint(step.stepIndex, 2)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      currentHintLevel >= 2
                        ? "bg-amber-100 border-amber-300 text-amber-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Level 2: Structural Invariant
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleHint(step.stepIndex, 3)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      currentHintLevel >= 3
                        ? "bg-purple-100 border-purple-300 text-purple-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Level 3: Breakthrough Reveal
                  </button>
                </div>

                {/* Expanded Hint Cards */}
                {currentHintLevel >= 1 && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-950 font-medium">
                    <span className="font-bold">Gentle Nudge: </span>
                    {step.hintProgression.level1GentleNudge[language] ||
                      step.hintProgression.level1GentleNudge.en}
                  </div>
                )}
                {currentHintLevel >= 2 && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-950 font-medium">
                    <span className="font-bold">Structural Invariant: </span>
                    {step.hintProgression.level2StructuralHint[language] ||
                      step.hintProgression.level2StructuralHint.en}
                  </div>
                )}
                {currentHintLevel >= 3 && (
                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-xs text-purple-950 font-medium">
                    <span className="font-bold">Breakthrough Reveal: </span>
                    {step.hintProgression.level3BreakthroughReveal[language] ||
                      step.hintProgression.level3BreakthroughReveal.en}
                  </div>
                )}
              </div>

              {/* Socratic Resolution Note */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950 font-medium">
                <span className="font-bold text-emerald-800">Resolution Insight: </span>
                {step.socraticResolution[language] || step.socraticResolution.en}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
