"use client";

import React, { useState, useMemo } from "react";
import {
  getAllCurriculumSteps,
  getCurriculumStepById,
  getCurriculumMicroConceptById,
  getCurriculumCoverageStats
} from "@/lib/skills/learn/curriculum-registry";
import {
  getLearningModuleByMicroConceptId,
  getAllLearningModules
} from "@/lib/skills/learn/module-registry";
import { getFearPointById } from "@/lib/skills/learn/fear-points-registry";
import {
  diagnosePrerequisiteBreakdown,
  MicroRemediationCard
} from "@/lib/skills/learn/remediation-graph";
import ConceptMasteryModuleView from "./ConceptMasteryModuleView";
import SocraticMentorDrawer from "./SocraticMentorDrawer";
import MicroRemediationModal from "./MicroRemediationModal";
import {
  BookOpen,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Bot,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  Code2
} from "lucide-react";

export interface ConceptMasteryHubProps {
  initialStepId?: string;
  initialMicroConceptId?: string;
  onNavigateToPractice?: (problemId: string) => void;
  className?: string;
}

export default function ConceptMasteryHub({
  initialStepId = "step-3",
  initialMicroConceptId = "mc-3-2-1-1",
  onNavigateToPractice,
  className = ""
}: ConceptMasteryHubProps) {
  const steps = useMemo(() => getAllCurriculumSteps(), []);
  const coverageStats = useMemo(() => getCurriculumCoverageStats(), []);

  const [selectedStepId, setSelectedStepId] = useState<string>(initialStepId);
  const [selectedMicroConceptId, setSelectedMicroConceptId] = useState<string>(initialMicroConceptId);
  const [isSocraticDrawerOpen, setIsSocraticDrawerOpen] = useState<boolean>(false);
  const [activeRemediationCard, setActiveRemediationCard] = useState<MicroRemediationCard | null>(null);

  // Active entities
  const activeStep = useMemo(() => getCurriculumStepById(selectedStepId) || steps[0], [selectedStepId, steps]);
  const activeMicroConcept = useMemo(
    () => getCurriculumMicroConceptById(selectedMicroConceptId),
    [selectedMicroConceptId]
  );
  const activePublishedModule = useMemo(
    () => getLearningModuleByMicroConceptId(selectedMicroConceptId),
    [selectedMicroConceptId]
  );

  return (
    <div className={`w-full flex flex-col space-y-5 ${className}`}>
      {/* ── TOP HUB HEADER & STATS (High-Density, Modern Hero) ────────── */}
      <div className="bg-gradient-to-r from-[#162A43] via-[#1A3353] to-[#1E3E66] border border-[#23456F] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-blue-300 mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-300" />
            <span>DSA Concept Mastery Platform (Striver + Love Babbar Union)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Comprehensive Concept Intelligence &amp; Algorithmic Verification
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span className="bg-white/10 text-white/90 px-2.5 py-0.5 rounded-md border border-white/15 font-semibold text-[11px]">
              {coverageStats.totalSteps} Canonical Steps
            </span>
            <span className="bg-white/10 text-white/90 px-2.5 py-0.5 rounded-md border border-white/15 font-semibold text-[11px]">
              {coverageStats.totalSubtopics} Subtopics
            </span>
            <span className="bg-white/10 text-white/90 px-2.5 py-0.5 rounded-md border border-white/15 font-semibold text-[11px]">
              {coverageStats.totalMicroConcepts} Micro-Concepts
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-400/30 font-bold text-[11px]">
              Zero Hidden Prerequisites
            </span>
          </div>
        </div>

        {/* Socratic Mentor Action Button */}
        <button
          type="button"
          onClick={() => setIsSocraticDrawerOpen(true)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm hover:shadow transition shrink-0 self-start md:self-center"
        >
          <Bot className="w-4 h-4" />
          <span>Ask Socratic AI Mentor</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </button>
      </div>

      {/* ── TWO-COLUMN WORKSPACE: LEFT NAV + MAIN CONTENT ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT CURRICULUM ROADMAP NAVIGATOR (4 COLS on lg, 3.5 on xl) ──────────── */}
        <div className="lg:col-span-4 xl:col-span-3.5 bg-white border border-[#E4E1DA] rounded-xl p-4 max-h-[calc(100vh-140px)] overflow-y-auto sticky top-24 shadow-xs flex flex-col space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              17-Step Roadmap Explorer
            </span>
            <span className="text-[10px] font-mono text-[#356AE6] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {activeStep.shortTitle}
            </span>
          </div>

          {/* Step Dropdown / Accordion */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Select Canonical Step
            </label>
            <div className="relative">
              <select
                value={selectedStepId}
                onChange={(e) => {
                  const newStepId = e.target.value;
                  setSelectedStepId(newStepId);
                  const stepObj = getCurriculumStepById(newStepId);
                  const firstSub = stepObj?.topics[0]?.subtopics[0];
                  const firstMc = firstSub?.microConcepts[0];
                  if (firstMc) setSelectedMicroConceptId(firstMc.id);
                }}
                className="w-full appearance-none bg-[#F8F9FA] border border-[#E4E1DA] text-xs text-slate-900 rounded-lg p-2.5 pr-8 font-bold focus:outline-none focus:border-[#356AE6] cursor-pointer"
              >
                {steps.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.icon} Step {st.stepNumber}: {st.shortTitle}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                ▼
              </span>
            </div>
          </div>

          {/* Step Description */}
          <p className="text-[11px] text-slate-600 leading-relaxed italic border-b border-slate-100 pb-2.5">
            {activeStep.description}
          </p>

          {/* Hierarchical Subtopics & Micro-Concepts List */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
            {activeStep.topics.map((topic) => (
              <div key={topic.id} className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  {topic.title}
                </div>

                {topic.subtopics.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-[#F8F9FA] border border-[#E4E1DA] rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-black text-[#162A43]">
                      <span>{sub.title}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        {sub.difficulty}
                      </span>
                    </div>

                    {/* Micro-Concepts List */}
                    <div className="flex flex-col space-y-1.5 pt-1">
                      {sub.microConcepts.map((mc) => {
                        const isSelected = selectedMicroConceptId === mc.id;
                        const hasPublishedModule = !!getLearningModuleByMicroConceptId(mc.id);

                        return (
                          <button
                            key={mc.id}
                            type="button"
                            onClick={() => setSelectedMicroConceptId(mc.id)}
                            className={`w-full text-left p-2 rounded-xl text-xs transition-all duration-150 flex items-center justify-between space-x-2 border ${
                              isSelected
                                ? "bg-[#162A43] text-white font-bold border-[#162A43] shadow-xs"
                                : "bg-white text-slate-700 border-slate-200/80 hover:border-blue-300 hover:text-[#162A43]"
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              {hasPublishedModule ? (
                                <CheckCircle2
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected ? "text-white" : "text-emerald-600"
                                  }`}
                                />
                              ) : (
                                <BookOpen
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected ? "text-white" : "text-slate-400"
                                  }`}
                                />
                              )}
                              <span className="truncate">{mc.title}</span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              {hasPublishedModule && (
                                <span
                                  className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                                    isSelected
                                      ? "bg-white/20 text-white"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  Ready
                                </span>
                              )}
                              <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT VIEW (8 COLS on lg, 8.5 on xl, min-w-0 prevents blowout) ── */}
        <div className="lg:col-span-8 xl:col-span-8.5 min-w-0 flex flex-col space-y-5">
          {activePublishedModule ? (
            /* Render Full 10-Layer Concept Mastery Module */
            <ConceptMasteryModuleView
              module={activePublishedModule}
              onNavigateToPractice={onNavigateToPractice}
            />
          ) : activeMicroConcept ? (
            /* Render Structured Syllabus Union Preview for in-development module */
            <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in shadow-sm">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {activeStep.title}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                    {activeMicroConcept.difficulty}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Syllabus Union Node
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-[#162A43]">
                  {activeMicroConcept.title}
                </h2>
              </div>

              {/* Learning Objectives */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Learning Objectives & Invariants to Master</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
                  {activeMicroConcept.learningObjectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold shrink-0">➔</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prerequisites DAG Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Prerequisite Dependency Requirements (DAG Verified)</span>
                </div>
                {activeMicroConcept.prerequisites.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeMicroConcept.prerequisites.map((pId) => {
                      const pNode = getCurriculumMicroConceptById(pId);
                      return (
                        <button
                          key={pId}
                          type="button"
                          onClick={() => setSelectedMicroConceptId(pId)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:border-blue-500 hover:text-blue-700 transition shadow-2xs flex items-center space-x-1.5"
                        >
                          <span>{pNode ? pNode.title : pId}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Foundational concept. Zero external prerequisites required.
                  </p>
                )}
              </div>

              {/* Associated Fear Points */}
              {activeMicroConcept.associatedMisconceptions.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Cataloged Beginner Pitfalls & Fear Points</span>
                  </div>
                  <div className="space-y-2">
                    {activeMicroConcept.associatedMisconceptions.map((fpId) => {
                      const fp = getFearPointById(fpId);
                      if (!fp) return null;
                      return (
                        <div
                          key={fpId}
                          className="bg-white border border-amber-200 p-3 rounded-xl text-xs space-y-1 shadow-2xs"
                        >
                          <div className="font-bold text-amber-900">{fp.title}</div>
                          <div className="text-slate-600">{fp.difficultyReason}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fast Forward to Kadane Pilot Module Card */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-0.5">
                    Production Golden Standard Ready
                  </div>
                  <div className="text-sm font-bold text-[#162A43]">
                    Step 3: Kadane's Algorithm Module is 100% Published & Interactive
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Try the interactive visual dry-run player, dual-mode Hinglish/English toggle, and Socratic evaluation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStepId("step-3");
                    setSelectedMicroConceptId("mc-3-2-1-1");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#356AE6] hover:bg-[#2557CA] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition shrink-0"
                >
                  <span>Open Kadane Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Select a micro-concept from the roadmap navigator on the left.
            </div>
          )}
        </div>
      </div>

      {/* ── SOCRATIC MENTOR DRAWER ──────────────────────────────── */}
      <SocraticMentorDrawer
        microConceptId={selectedMicroConceptId}
        conceptTitle={activeMicroConcept?.title || activeStep.title}
        language="en"
        isOpen={isSocraticDrawerOpen}
        onClose={() => setIsSocraticDrawerOpen(false)}
      />

      {/* ── MICRO-REMEDIATION MODAL ─────────────────────────────── */}
      {activeRemediationCard && (
        <MicroRemediationModal
          card={activeRemediationCard}
          language="en"
          isOpen={!!activeRemediationCard}
          onClose={() => setActiveRemediationCard(null)}
        />
      )}
    </div>
  );
}
