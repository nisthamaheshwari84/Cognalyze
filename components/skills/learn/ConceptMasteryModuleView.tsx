"use client";

import React, { useState } from "react";
import { LearningModule } from "@/lib/skills/learn/content-schemas";
import DualLanguageToggle from "./DualLanguageToggle";
import LearnVisualPlayer from "./LearnVisualPlayer";
import SocraticDerivationWidget from "./SocraticDerivationWidget";
import DiagnosticQuizWidget from "./DiagnosticQuizWidget";
import {
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Code2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Zap,
  ArrowRight
} from "lucide-react";

export interface ConceptMasteryModuleViewProps {
  module: LearningModule;
  onNavigateToPractice?: (problemId: string) => void;
  className?: string;
}

export default function ConceptMasteryModuleView({
  module,
  onNavigateToPractice,
  className = ""
}: ConceptMasteryModuleViewProps) {
  const [language, setLanguage] = useState<"en" | "hinglish">("en");
  const [activeTab, setActiveTab] = useState<
    "overview" | "visualizer" | "socratic" | "invariants" | "pitfalls" | "quiz" | "code"
  >("overview");

  const cppSnippet = module.annotatedCodeSnippets?.find((s) => s.language === "cpp");

  return (
    <div className={`w-full flex flex-col space-y-6 ${className}`}>
      {/* ── MODULE BANNER & LANGUAGE TOGGLE ──────────────────────── */}
      <div className="bg-white border border-[#E4E1DA] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
                Step 3: Problems on Arrays
              </span>
              <span className="px-2 py-0.5 rounded-md font-bold bg-purple-50 text-purple-700 border border-purple-200 text-[11px]">
                Kadane's Algorithm
              </span>
              <span className="px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase text-[10px]">
                {module.difficulty}
              </span>
              <span className="flex items-center text-slate-500 font-semibold text-xs ml-1">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {module.estimatedReadTimeMinutes} min read
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#162A43] tracking-tight">
              {module.title[language] || module.title.en}
            </h1>
          </div>

          {/* Bilingual Switcher */}
          <div className="shrink-0 self-start md:self-auto">
            <DualLanguageToggle language={language} onToggle={setLanguage} />
          </div>
        </div>

        {/* Navigation Tabs (Never truncates: adaptive full/short labels with sleek pill strip) */}
        <div className="pt-4 border-t border-slate-100 mt-4">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Overview & Genesis", short: "Overview", icon: BookOpen },
              { id: "visualizer", label: "Interactive Visualizer", short: "Visualizer", icon: Zap },
              { id: "socratic", label: "Socratic Derivation", short: "Socratic", icon: Sparkles },
              { id: "invariants", label: "Invariants & Proof", short: "Invariants", icon: ShieldCheck },
              { id: "pitfalls", label: "Pitfalls & Patterns", short: "Pitfalls", icon: AlertTriangle },
              { id: "quiz", label: "Understanding Check", short: "Quiz", icon: TrendingUp },
              { id: "code", label: "C++20 Implementation", short: "C++ Code", icon: Code2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all duration-150 ${
                    isActive
                      ? "bg-[#162A43] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-300" : "text-slate-500"}`} />
                  <span className="hidden xl:inline">{tab.label}</span>
                  <span className="xl:hidden">{tab.short}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW & GENESIS (LAYERS 1 & 2) ─────────────── */}
      {activeTab === "overview" && (
        <div className="flex flex-col space-y-6 animate-fade-in">
          {/* Layer 1: Why It Exists */}
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Layer 1: Why This Concept Exists (Genesis & Naive Failures)</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-[#162A43]">
              {module.layer1WhyExists.coreProblemStatement[language] ||
                module.layer1WhyExists.coreProblemStatement.en}
            </h3>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {module.layer1WhyExists.historicalGenesis[language] ||
                module.layer1WhyExists.historicalGenesis.en}
            </p>

            {/* Breakthrough Callout */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5 text-blue-950">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                The Core Breakthrough
              </div>
              <p className="text-sm sm:text-base leading-relaxed font-medium">
                {module.layer1WhyExists.breakthroughInsight[language] ||
                  module.layer1WhyExists.breakthroughInsight.en}
              </p>
            </div>

            {/* Complexity Table */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Algorithmic Scalability Thresholds
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">Approach</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Space</th>
                      <th className="p-3">Scales Up To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {module.layer1WhyExists.complexityComparisonTable.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          row.approachName.includes("Kadane")
                            ? "bg-blue-50/70 text-blue-950 font-bold"
                            : "text-slate-800"
                        }
                      >
                        <td className="p-3 font-semibold">{row.approachName}</td>
                        <td className="p-3 font-mono font-bold">{row.timeComplexity}</td>
                        <td className="p-3 font-mono">{row.spaceComplexity}</td>
                        <td className="p-3 text-slate-600">{row.scalabilityThreshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Layer 2: Intuition & Analogy */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Layer 2: Intuition & Mental Model</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-amber-950">
              {module.layer2Intuition.primaryAnalogy.metaphorTitle[language] ||
                module.layer2Intuition.primaryAnalogy.metaphorTitle.en}
            </h3>

            <p className="text-sm sm:text-base text-amber-900 leading-relaxed">
              {module.layer2Intuition.primaryAnalogy.narrativeExplanation[language] ||
                module.layer2Intuition.primaryAnalogy.narrativeExplanation.en}
            </p>

            {/* Metaphor Mapping Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {module.layer2Intuition.primaryAnalogy.mappingToAlgorithmicElements.map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-amber-200 rounded-xl p-3.5 space-y-1.5 shadow-xs"
                  >
                    <div className="text-xs font-black text-amber-800">
                      {item.realWorldEntity}
                    </div>
                    <div className="text-xs font-mono font-bold text-blue-700">
                      ➔ {item.algorithmEquivalent}
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed">
                      {item.roleExplanation[language] || item.roleExplanation.en}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INTERACTIVE VISUALIZER (LAYER 4) ──────────────── */}
      {activeTab === "visualizer" && (
        <div className="animate-fade-in">
          <LearnVisualPlayer
            visualDryRun={module.layer4VisualDryRun}
            language={language}
          />
        </div>
      )}

      {/* ── TAB 3: SOCRATIC DERIVATION (LAYER 5) ─────────────────── */}
      {activeTab === "socratic" && (
        <div className="animate-fade-in">
          <SocraticDerivationWidget
            derivation={module.layer5SocraticDerivation}
            language={language}
          />
        </div>
      )}

      {/* ── TAB 4: INVARIANTS & PROOF (LAYERS 3 & 6) ─────────────── */}
      {activeTab === "invariants" && (
        <div className="flex flex-col space-y-6 animate-fade-in">
          {/* Layer 3: Algorithmic Invariants */}
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Layer 3: Algorithmic Invariants & Induction Basis</span>
            </div>

            <div className="space-y-4">
              {module.layer3Invariants.loopInvariants.map((inv, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#162A43]">{inv.name}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Loop Invariant #{idx + 1}
                    </span>
                  </div>

                  <div className="bg-[#0B132B] p-3.5 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto shadow-inner">
                    {inv.formalStatement}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 font-medium">
                    {inv.plainEnglishExplanation[language] || inv.plainEnglishExplanation.en}
                  </p>
                </div>
              ))}
            </div>

            {/* Inductive Proof */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 text-xs sm:text-sm text-slate-700 space-y-2">
              <div className="font-bold text-[#162A43] uppercase tracking-wider text-xs">
                Formal Inductive Proof Basis
              </div>
              <p className="leading-relaxed">
                {module.layer3Invariants.inductiveProofBasis[language] ||
                  module.layer3Invariants.inductiveProofBasis.en}
              </p>
            </div>
          </div>

          {/* Layer 6: Complexity Derivations */}
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Layer 6: Time & Space Complexity Formal Derivations</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time Complexity */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Time Complexity
                  </span>
                  <span className="text-base font-mono font-black text-blue-700">
                    {module.layer6Complexity.timeComplexity.worstCase.notation}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {module.layer6Complexity.timeComplexity.worstCase.formalDerivation[language] ||
                    module.layer6Complexity.timeComplexity.worstCase.formalDerivation.en}
                </p>
              </div>

              {/* Space Complexity */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Auxiliary Space
                  </span>
                  <span className="text-base font-mono font-black text-emerald-700">
                    {module.layer6Complexity.spaceComplexity.auxiliarySpace.notation}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {module.layer6Complexity.spaceComplexity.whyLessSpaceIsImpossible[language] ||
                    module.layer6Complexity.spaceComplexity.whyLessSpaceIsImpossible.en}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: PITFALLS & PATTERNS (LAYERS 7 & 8) ────────────── */}
      {activeTab === "pitfalls" && (
        <div className="flex flex-col space-y-6 animate-fade-in">
          {/* Layer 7: Mistake Traps */}
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-600">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Layer 7: Common Pitfalls & Off-by-One Traps</span>
            </div>

            <div className="space-y-4">
              {module.layer7CommonPitfalls.mistakeTraps.map((trap) => (
                <div
                  key={trap.trapId}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3"
                >
                  <h4 className="text-sm sm:text-base font-black text-[#162A43]">
                    {trap.title[language] || trap.title.en}
                  </h4>

                  <p className="text-xs text-rose-700 font-semibold italic">
                    False Assumption: {trap.falseAssumption[language] || trap.falseAssumption.en}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                    {/* Buggy */}
                    <div className="bg-rose-50/70 border border-rose-300 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-rose-800 mb-1">
                        Buggy Implementation
                      </div>
                      <pre className="text-xs font-mono text-rose-900 overflow-x-auto whitespace-pre font-bold">
                        {trap.buggyCodeSnippet}
                      </pre>
                    </div>

                    {/* Correct */}
                    <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-emerald-800 mb-1">
                        Corrected Pattern
                      </div>
                      <pre className="text-xs font-mono text-emerald-900 overflow-x-auto whitespace-pre font-bold">
                        {trap.correctCodeSnippet}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layer 8: Pattern Recognition */}
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-600">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Layer 8: Pattern Recognition Triggers & Counter-Signals</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clues */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Trigger Keywords</div>
                {module.layer8PatternTriggers.primaryTriggers.map((trig, idx) => (
                  <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-purple-800">
                      {trig.clueDescription[language] || trig.clueDescription.en}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {trig.examplePhrases.map((phrase, pIdx) => (
                        <span key={pIdx} className="bg-white px-2 py-0.5 rounded text-[11px] text-slate-700 border border-slate-200 font-semibold shadow-xs">
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Counter-Signals */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">When NOT to Use (Counter-Signals)</div>
                {module.layer8PatternTriggers.counterSignals.map((cs, idx) => (
                  <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-amber-800">
                      {cs.misleadingClue[language] || cs.misleadingClue.en}
                    </div>
                    <div className="text-slate-600 leading-relaxed">
                      {cs.whyThisAlgorithmFailsHere[language] || cs.whyThisAlgorithmFailsHere.en}
                    </div>
                    <div className="text-[11px] text-emerald-800 font-mono font-bold pt-1">
                      ➔ Use: {cs.alternativePatternRecommended}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: DIAGNOSTIC QUIZ (LAYER 9) ─────────────────────── */}
      {activeTab === "quiz" && (
        <div className="animate-fade-in">
          <DiagnosticQuizWidget
            rubric={module.layer9VerificationRubric}
            language={language}
          />
        </div>
      )}

      {/* ── TAB 7: C++20 CODE & BRIDGE TO PRACTICE (LAYER 10) ─────── */}
      {activeTab === "code" && (
        <div className="flex flex-col space-y-6 animate-fade-in">
          {/* C++20 Annotated Code */}
          {cppSnippet && (
            <div className="bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  <span>Production C++20 Implementation</span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {cppSnippet.standardVersion}
                </span>
              </div>

              <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-4 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto whitespace-pre shadow-inner">
                {cppSnippet.fullSourceCode}
              </div>

              {/* Line Annotations */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Line-by-Line Architectural Insights
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {cppSnippet.lineAnnotations.map((ann, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl text-xs flex items-start space-x-2.5"
                    >
                      <span className="font-mono text-blue-700 font-bold shrink-0">
                        Line {ann.lineNumber}:
                      </span>
                      <span className="text-slate-700 font-medium">
                        {ann.annotation[language] || ann.annotation.en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Layer 10: Bridge to Practice */}
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Layer 10: Bridge to Problem Practice</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {module.layer10BridgeToPractice.canonicalPracticeProblems.map((prob) => (
                <div
                  key={prob.problemId}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="text-xs font-black text-[#162A43] mb-1">
                      {prob.title}
                    </div>
                    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {prob.difficulty}
                    </span>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {prob.conceptApplicationNotes[language] || prob.conceptApplicationNotes.en}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToPractice && onNavigateToPractice(prob.problemId)}
                    className="w-full py-2 px-3 rounded-xl bg-[#356AE6] hover:bg-[#2557CA] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition"
                  >
                    <span>Solve in Practice Tab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
