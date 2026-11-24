"use client";

import React, { useState, useMemo } from "react";
import {
  getAllCurriculumSteps,
  getCurriculumStepById,
  getCurriculumMicroConceptById,
  getCurriculumCoverageStats
} from "@/lib/skills/learn/curriculum-registry";
import {
  getStudentConceptMastery,
  isConceptNodeUnlocked,
  ConceptMasterySummary
} from "@/lib/skills/learn/mastery-store";
import {
  Layers,
  CheckCircle2,
  Lock,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ExternalLink
} from "lucide-react";

export interface ConceptKnowledgeGraphProps {
  candidateId?: string;
  onSelectConcept?: (microConceptId: string, stepId: string) => void;
  className?: string;
}

export default function ConceptKnowledgeGraph({
  candidateId = "guest",
  onSelectConcept,
  className = ""
}: ConceptKnowledgeGraphProps) {
  const steps = useMemo(() => getAllCurriculumSteps(), []);
  const stats = useMemo(() => getCurriculumCoverageStats(), []);
  const [selectedStepFilter, setSelectedStepFilter] = useState<string>("all");

  // Load candidate mastery state
  const masterySummary: ConceptMasterySummary = useMemo(
    () => getStudentConceptMastery(candidateId),
    [candidateId]
  );

  const filteredSteps = useMemo(() => {
    if (selectedStepFilter === "all") return steps;
    return steps.filter((s) => s.id === selectedStepFilter);
  }, [steps, selectedStepFilter]);

  return (
    <div className={`w-full flex flex-col space-y-6 ${className}`}>
      {/* ── TOP STATS & KPI BANNER ───────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#162A43] via-[#1A3353] to-[#1E3E66] border border-[#23456F] rounded-2xl p-5 sm:p-7 shadow-sm text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-300 mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-300" />
              <span>DAG Prerequisite Knowledge Graph & Retention</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Concept Mastery & Verification Matrix
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Unlike problem practice counts, conceptual mastery measures verified understanding of invariants, memory models, and algorithmic failure modes across all 17 canonical steps.
            </p>
          </div>

          {/* Metric Cards Row */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-white/10 border border-white/15 p-3 sm:p-4 rounded-xl flex flex-col items-center min-w-[120px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Concepts Mastered
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-300 mt-0.5">
                {masterySummary.totalUnderstoodCount}{" "}
                <span className="text-xs font-normal text-slate-300">
                  / {masterySummary.totalAvailableConcepts}
                </span>
              </span>
            </div>

            <div className="bg-white/10 border border-white/15 p-3 sm:p-4 rounded-xl flex flex-col items-center min-w-[100px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Mastery Rate
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-blue-300 mt-0.5">
                {masterySummary.overallMasteryPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-white/10 mt-5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-300">Filter Step:</span>
            <select
              value={selectedStepFilter}
              onChange={(e) => setSelectedStepFilter(e.target.value)}
              className="bg-white/15 border border-white/20 text-xs text-white rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="all" className="text-slate-900 bg-white">All 17 Steps ({stats.totalMicroConcepts} Concepts)</option>
              {steps.map((st) => (
                <option key={st.id} value={st.id} className="text-slate-900 bg-white">
                  {st.icon} Step {st.stepNumber}: {st.shortTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 text-emerald-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Mastered (Verified)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-blue-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span>Unlocked & Ready</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Locked (Prerequisites Pending)</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── STEP-BY-STEP KNOWLEDGE GRAPH NODES ───────────────────── */}
      <div className="flex flex-col space-y-6">
        {filteredSteps.map((step) => {
          // Calculate step-level concept mastery
          let stepTotalConcepts = 0;
          let stepMasteredConcepts = 0;

          step.topics.forEach((t) => {
            t.subtopics.forEach((sub) => {
              sub.microConcepts.forEach((mc) => {
                stepTotalConcepts++;
                if (masterySummary.understoodConceptIds.includes(mc.id)) {
                  stepMasteredConcepts++;
                }
              });
            });
          });

          const stepPercentage = Math.round(
            (stepMasteredConcepts / Math.max(1, stepTotalConcepts)) * 100
          );

          return (
            <div
              key={step.id}
              className="bg-white border border-[#E4E1DA] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
            >
              {/* Step Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">{step.icon}</span>
                  <div>
                    <h3 className="text-base font-black text-[#162A43]">
                      Step {step.stepNumber}: {step.title}
                    </h3>
                    <p className="text-xs text-slate-500">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {stepMasteredConcepts} / {stepTotalConcepts} Concepts
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      stepPercentage === 100
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : stepPercentage > 0
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {stepPercentage}% Mastered
                  </span>
                </div>
              </div>

              {/* Topics & Micro-Concept Node Network */}
              <div className="space-y-4 pt-1">
                {step.topics.map((topic) => (
                  <div key={topic.id} className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                      {topic.title}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {topic.subtopics.flatMap((sub) =>
                        sub.microConcepts.map((mc) => {
                          const status = isConceptNodeUnlocked(
                            mc.id,
                            masterySummary.understoodConceptIds
                          );

                          return (
                            <div
                              key={mc.id}
                              onClick={() => {
                                if (status.isUnlocked && onSelectConcept) {
                                  onSelectConcept(mc.id, step.id);
                                }
                              }}
                              className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between space-y-2.5 ${
                                status.isMastered
                                  ? "bg-emerald-50/70 border-2 border-emerald-500 hover:border-emerald-600 cursor-pointer shadow-xs"
                                  : status.isUnlocked
                                  ? "bg-white border-2 border-blue-300 hover:border-blue-600 hover:bg-blue-50/30 cursor-pointer shadow-xs"
                                  : "bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-[#162A43] leading-snug">
                                  {mc.title}
                                </span>

                                {status.isMastered ? (
                                  <span className="flex items-center text-[10px] font-bold text-emerald-800 shrink-0 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                    Mastered
                                  </span>
                                ) : status.isUnlocked ? (
                                  <span className="flex items-center text-[10px] font-bold text-blue-700 shrink-0 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                    Ready
                                  </span>
                                ) : (
                                  <span className="flex items-center text-[10px] font-semibold text-slate-500 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    <Lock className="w-3 h-3 mr-1 text-slate-400" />
                                    Locked
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                                <span className="font-mono font-bold uppercase text-slate-400 text-[10px]">
                                  {mc.difficulty}
                                </span>

                                {status.isUnlocked ? (
                                  <span className="text-[#356AE6] font-bold hover:underline flex items-center space-x-1">
                                    <span>Learn Concept</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <span
                                    className="text-slate-400 text-[10px] truncate max-w-[140px]"
                                    title={`Requires: ${status.missingPrerequisites
                                      .map((m) => m.title)
                                      .join(", ")}`}
                                  >
                                    Req: {status.missingPrerequisites[0]?.title || "Step 1"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
