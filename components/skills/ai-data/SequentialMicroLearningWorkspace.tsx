"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TaxonomyTopic,
  TaxonomySubject,
  TaxonomyModule,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TargetRoleSlug, TopicMasteryRecord, LearningPhaseId } from "@/lib/skills/ai-data/types";
import type { TopicMicroLearningPackage } from "@/lib/skills/ai-data/micro-learning-engine";
import type { ComprehensionChallenge } from "@/lib/skills/ai-data/comprehension-engine";
import type { PracticalLabSpec, PracticalLabEvaluation } from "@/lib/skills/ai-data/practical-lab-engine";
import type { TopicAssessmentBundle, TopicAssessmentReport } from "@/lib/skills/ai-data/assessment-engine";

export interface SequentialMicroLearningWorkspaceProps {
  topic: TaxonomyTopic;
  subject: TaxonomySubject;
  module: TaxonomyModule;
  candidateId: string;
  activeRole: TargetRoleSlug;
  language: "english" | "hinglish";
  masteryRecord?: TopicMasteryRecord;
  isLocked?: boolean;
  lockReason?: string;
  onLanguageChange: (lang: "english" | "hinglish") => void;
  onNavigateTopic: (topicId: string) => void;
  onOpenAiMentor: () => void;
  onContextUpdate?: (ctx: {
    subtopicTitle?: string;
    learningPhase?: LearningPhaseId;
    userCode?: string;
    executionStdout?: string;
    executionStderr?: string;
    weakConcepts?: string[];
    assessmentScore?: number | null;
  }) => void;
  onRefreshContext: () => Promise<void>;
}

type WorkspaceStep = "micro_learn" | "comprehension" | "practical_lab" | "assessment";

export default function SequentialMicroLearningWorkspace({
  topic,
  subject,
  module,
  candidateId,
  activeRole,
  language,
  masteryRecord,
  isLocked = false,
  lockReason,
  onLanguageChange,
  onNavigateTopic,
  onOpenAiMentor,
  onContextUpdate,
  onRefreshContext,
}: SequentialMicroLearningWorkspaceProps) {
  const [step, setStep] = useState<WorkspaceStep>("micro_learn");
  const [loading, setLoading] = useState(true);
  const [microPkg, setMicroPkg] = useState<TopicMicroLearningPackage | null>(null);
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [showDeepInternals, setShowDeepInternals] = useState(false);

  // Micro-example sandbox
  const [exampleCode, setExampleCode] = useState("");
  const [exampleRunning, setExampleRunning] = useState(false);
  const [exampleOutput, setExampleOutput] = useState<{ stdout?: string; stderr?: string; rows?: unknown[]; columns?: string[] } | null>(null);

  // Micro-check state
  const [selectedMicroOption, setSelectedMicroOption] = useState("");
  const [recallText, setRecallText] = useState("");
  const [microCheckResult, setMicroCheckResult] = useState<{ passed: boolean; feedback: string } | null>(null);

  // Phase 4 Comprehension
  const [compSuite, setCompSuite] = useState<ComprehensionChallenge[]>([]);
  const [compAnswers, setCompAnswers] = useState<Record<string, string>>({});
  const [compResults, setCompResults] = useState<Record<string, { passed: boolean; feedback: string; stdout?: string; stderr?: string }>>({});

  // Phase 5 Practical Lab
  const [practicalLab, setPracticalLab] = useState<PracticalLabSpec | null>(null);
  const [labCode, setLabCode] = useState("");
  const [labRunning, setLabRunning] = useState(false);
  const [labResult, setLabResult] = useState<PracticalLabEvaluation | null>(null);

  // Phase 6 Topic Assessment
  const [assessment, setAssessment] = useState<TopicAssessmentBundle | null>(null);
  const [asmtAnswers, setAsmtAnswers] = useState<Record<string, string | string[]>>({});
  const [asmtSubmitting, setAsmtSubmitting] = useState(false);
  const [asmtReport, setAsmtReport] = useState<TopicAssessmentReport | null>(null);

  // 5-Gate Mastery status
  const [gates, setGates] = useState<Array<{ label: string; met: boolean }>>([]);

  const loadTopicBundle = useCallback(async () => {
    try {
      const [microRes, asmtRes] = await Promise.all([
        fetch("/api/skills/ai-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_micro_learning",
            candidateId,
            topicId: topic.id,
            targetRole: activeRole,
            language,
          }),
        }).then((r) => r.json()),
        fetch("/api/skills/ai-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_topic_assessment",
            candidateId,
            topicId: topic.id,
          }),
        }).then((r) => r.json()),
      ]);

      setActiveSubIdx(0);
      setStep("micro_learn");
      setExampleOutput(null);
      setMicroCheckResult(null);
      setSelectedMicroOption("");
      setRecallText("");
      setCompResults({});
      setLabResult(null);
      setAsmtReport(null);

      if (microRes.success && microRes.microPackage) {
        setMicroPkg(microRes.microPackage);
        const firstSub = microRes.microPackage.subtopicUnits?.[0];
        setExampleCode(firstSub?.runnableCodeExample?.code || "");
        setCompSuite(microRes.comprehensionSuite || []);
        const compDefaults: Record<string, string> = {};
        for (const c of microRes.comprehensionSuite || []) {
          if (c.starterFixCode) compDefaults[c.id] = c.starterFixCode;
        }
        setCompAnswers(compDefaults);
        setPracticalLab(microRes.practicalLab || null);
        setLabCode(microRes.practicalLab?.starterCode || "");
        setGates(microRes.masteryGate?.gates || []);
      }

      if (asmtRes.success && asmtRes.assessment) {
        setAssessment(asmtRes.assessment);
        const defaults: Record<string, string | string[]> = {};
        for (const item of asmtRes.assessment.items) {
          if (item.starterCode) defaults[item.id] = item.starterCode;
        }
        setAsmtAnswers(defaults);
      }
    } finally {
      setLoading(false);
    }
  }, [candidateId, topic.id, activeRole, language]);

  useEffect(() => {
    void loadTopicBundle();
  }, [loadTopicBundle]);

  const activeUnit = microPkg?.subtopicUnits?.[activeSubIdx] || microPkg?.subtopicUnits?.[0];

  const handleSelectSubtopic = (idx: number) => {
    setActiveSubIdx(idx);
    const nextUnit = microPkg?.subtopicUnits?.[idx];
    if (nextUnit) {
      setExampleCode(nextUnit.runnableCodeExample.code);
    }
    setExampleOutput(null);
    setMicroCheckResult(null);
    setSelectedMicroOption("");
  };

  useEffect(() => {
    if (!activeUnit) return;
    const phaseMap: Record<WorkspaceStep, LearningPhaseId> = {
      micro_learn: "understand",
      comprehension: "comprehend",
      practical_lab: "practical_lab",
      assessment: "assess",
    };

    onContextUpdate?.({
      subtopicTitle: activeUnit.title,
      learningPhase: phaseMap[step],
      userCode: step === "practical_lab" ? labCode : exampleCode,
      executionStdout: step === "practical_lab" ? labResult?.stdout : exampleOutput?.stdout,
      executionStderr: step === "practical_lab" ? labResult?.stderr : exampleOutput?.stderr,
      weakConcepts: masteryRecord?.weakConcepts,
      assessmentScore: asmtReport?.scorePercent ?? masteryRecord?.assessmentScore,
    });
  }, [
    activeUnit,
    step,
    labCode,
    exampleCode,
    labResult?.stdout,
    labResult?.stderr,
    exampleOutput?.stdout,
    exampleOutput?.stderr,
    masteryRecord?.weakConcepts,
    masteryRecord?.assessmentScore,
    asmtReport?.scorePercent,
    onContextUpdate,
  ]);

  // Persist user's exact learning position cleanly
  useEffect(() => {
    if (!activeUnit || isLocked) return;
    const phaseMap: Record<WorkspaceStep, LearningPhaseId> = {
      micro_learn: "understand",
      comprehension: "comprehend",
      practical_lab: "practical_lab",
      assessment: "assess",
    };
    fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_learning_position",
        candidateId,
        subjectId: subject.id,
        moduleId: module.id,
        topicId: topic.id,
        subtopicId: activeUnit.subtopicId,
        phase: phaseMap[step],
      }),
    }).catch(() => {});
  }, [candidateId, subject.id, module.id, topic.id, activeUnit, step, isLocked]);

  const handleRunMicroExample = async () => {
    if (!activeUnit) return;
    setExampleRunning(true);
    setExampleOutput(null);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run_micro_example",
          candidateId,
          language: activeUnit.runnableCodeExample.language,
          code: exampleCode,
        }),
      });
      const data = await res.json();
      setExampleOutput(data.result || { stderr: data.error });
      onContextUpdate?.({
        userCode: exampleCode,
        executionStdout: data.result?.stdout,
        executionStderr: data.result?.stderr,
      });
    } finally {
      setExampleRunning(false);
    }
  };

  const handleSubmitMicroCheck = async (useOwnWords = false) => {
    if (!activeUnit) return;
    const res = await fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_micro_check",
        candidateId,
        topicId: topic.id,
        subtopicId: activeUnit.subtopicId,
        selectedOptionId: useOwnWords ? undefined : selectedMicroOption,
        explanationText: useOwnWords ? recallText : undefined,
        language,
      }),
    });
    const data = await res.json();
    if (data.success && data.evaluation) {
      setMicroCheckResult(data.evaluation);
      await loadTopicBundle();
      await onRefreshContext();
    }
  };

  const handleSubmitComprehension = async (c: ComprehensionChallenge) => {
    const res = await fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_comprehension",
        candidateId,
        topicId: topic.id,
        challengeId: c.id,
        selectedOptionId: c.kind !== "debug_fix" ? compAnswers[c.id] : undefined,
        userFixCode: c.kind === "debug_fix" ? compAnswers[c.id] : undefined,
      }),
    });
    const data = await res.json();
    if (data.success && data.evaluation) {
      setCompResults((prev) => ({ ...prev, [c.id]: data.evaluation }));
      if (data.evaluation.passed) {
        await loadTopicBundle();
        await onRefreshContext();
      }
    }
  };

  const handleRunPracticalLab = async () => {
    setLabRunning(true);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_practical_lab",
          candidateId,
          topicId: topic.id,
          submissionText: labCode,
        }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setLabResult(data.evaluation);
        onContextUpdate?.({
          userCode: labCode,
          executionStdout: data.evaluation.stdout,
          executionStderr: data.evaluation.stderr,
        });
        await loadTopicBundle();
        await onRefreshContext();
      }
    } finally {
      setLabRunning(false);
    }
  };

  const handleSubmitAssessment = async () => {
    setAsmtSubmitting(true);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_topic_assessment",
          candidateId,
          topicId: topic.id,
          answers: asmtAnswers,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setAsmtReport(data.report);
        await loadTopicBundle();
        await onRefreshContext();
      }
    } finally {
      setAsmtSubmitting(false);
    }
  };

  const isHinglish = language === "hinglish";
  const statusLabel = masteryRecord?.status?.replace(/_/g, " ").toUpperCase() || "NOT STARTED";

  return (
    <div className="p-5 sm:p-7 max-w-5xl mx-auto w-full space-y-6 font-sans">
      {/* ── GUIDED NAVIGATION BAR ── */}
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-500 flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-[#162A43]">{subject.title}</span>
            <span>→</span>
            <span>{module.title}</span>
            <span>→</span>
            <span className="font-bold text-[#6D28D9]">{topic.title}</span>
            {activeUnit && (
              <>
                <span>→</span>
                <span className="font-semibold text-stone-700">{activeUnit.title}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Bilingual Switcher */}
            <div className="flex bg-[#FAF9F6] border border-[#E4E1DA] rounded-lg p-0.5 text-[11px] font-bold">
              {(["english", "hinglish"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2.5 py-1 rounded-md capitalize transition ${
                    language === lang ? "bg-[#6D28D9] text-white" : "text-stone-600 hover:text-[#162A43]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Sequential Topic Header + Prev/Next */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#162A43]">{topic.title}</h1>
            <p className="text-xs text-stone-600 mt-0.5">{microPkg?.roleWhy}</p>
            {microPkg?.connectionToPrevious && (
              <p className="text-[11px] text-[#6D28D9] font-medium mt-1">
                ↳ {microPkg.connectionToPrevious}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {microPkg?.previousTopic && (
              <button
                onClick={() => onNavigateTopic(microPkg.previousTopic!.id)}
                className="px-3 py-1.5 rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] text-xs font-semibold text-stone-700 hover:border-stone-400"
              >
                ← Prev
              </button>
            )}
            <button
              onClick={onOpenAiMentor}
              className="px-3 py-1.5 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] text-xs font-bold text-[#5B21B6]"
            >
              Ask AI Mentor
            </button>
            {microPkg?.nextTopic && (
              <button
                onClick={() => onNavigateTopic(microPkg.nextTopic!.id)}
                className="px-3 py-1.5 rounded-lg bg-[#162A43] text-white text-xs font-bold"
              >
                Next Topic →
              </button>
            )}
          </div>
        </div>

        {/* 5-Gate Mastery Bar */}
        {gates.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
            {gates.map((g) => (
              <span
                key={g.label}
                className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border ${
                  g.met
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-[#FAF9F6] border-[#E4E1DA] text-stone-500"
                }`}
              >
                {g.met ? "✓ " : "○ "}{g.label}
              </span>
            ))}
          </div>
        )}

        {/* Phase Tabs: Understand/Observe/Try -> Comprehend -> Lab -> Assess */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: "micro_learn", label: "1. Understand & Try (Micro-Steps)" },
            { id: "comprehension", label: "2. Code Comprehension & Debug" },
            { id: "practical_lab", label: "3. Practical Laboratory" },
            { id: "assessment", label: "4. Assessment & Mastery Gate" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStep(tab.id as WorkspaceStep)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                step === tab.id
                  ? "bg-[#6D28D9] text-white border-[#6D28D9] shadow-sm"
                  : "bg-[#FAF9F6] text-stone-700 border-[#E4E1DA] hover:border-[#6D28D9]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prerequisite Gate Banner if Topic is Locked */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
          <div className="font-bold text-sm">🔒 Sequential Prerequisite Required</div>
          <p>{lockReason || "Complete the prerequisite topic's assessment and practical lab before advancing to this topic."}</p>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-[#E4E1DA] rounded-2xl p-8 text-center text-xs text-stone-500">
          Loading micro-learning curriculum, sandbox challenges, and mastery gates...
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PHASE 1: MICRO-LEARNING SUBTOPIC WORKSPACE                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {!loading && step === "micro_learn" && microPkg && activeUnit && (
        <div className="space-y-5">
          {/* Subtopic Stepper */}
          <div className="flex flex-wrap gap-2">
            {microPkg.subtopicUnits.map((u, idx) => {
              const done = masteryRecord?.conceptStepsCompleted?.includes(u.subtopicId);
              return (
                <button
                  key={u.subtopicId}
                  onClick={() => handleSelectSubtopic(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                    activeSubIdx === idx
                      ? "bg-[#162A43] text-white border-[#162A43]"
                      : done
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-white border-[#E4E1DA] text-stone-700 hover:border-[#6D28D9]"
                  }`}
                >
                  {done ? "✓ " : `Step ${idx + 1}: `}{u.title}
                </button>
              );
            })}
          </div>

          {/* 10-Part Human-Centric Subtopic Card */}
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D28D9]">
                  Subtopic {activeSubIdx + 1} of {microPkg.subtopicUnits.length} • ~{activeUnit.estimatedMinutes} min
                </span>
                <h2 className="text-lg font-bold text-[#162A43]">{activeUnit.title}</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeUnit.concepts.map((c) => (
                  <span key={c} className="text-[10.5px] font-semibold px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E4E1DA] text-stone-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* 1. What is it? & 2. Why does it matter? */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-[#6D28D9]">1. What is it?</div>
                <p className="text-xs text-[#17191C] leading-relaxed">
                  {isHinglish ? activeUnit.whatIsIt.hinglish : activeUnit.whatIsIt.english}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-[#162A43]">2. Why does it matter?</div>
                <p className="text-xs text-[#17191C] leading-relaxed">
                  {isHinglish ? activeUnit.whyItMatters.hinglish : activeUnit.whyItMatters.english}
                </p>
              </div>
            </div>

            {/* 3. Where used & 5. Real-World Analogy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#E4E1DA] space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-stone-500">3. Where is it used?</div>
                <ul className="list-disc pl-4 text-xs text-stone-700 space-y-1">
                  {activeUnit.whereUsed.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F3FF]/60 border border-[#DDD6FE] space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-[#5B21B6]">4. Real-World Analogy</div>
                <p className="text-xs text-[#162A43] leading-relaxed">
                  {isHinglish ? activeUnit.realWorldAnalogy.hinglish : activeUnit.realWorldAnalogy.english}
                </p>
              </div>
            </div>

            {/* 4. How does it work? + Progressive Disclosure */}
            <div className="p-4 rounded-xl bg-white border border-[#E4E1DA] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#162A43]">5. How does it work?</span>
                <button
                  onClick={() => setShowDeepInternals((v) => !v)}
                  className="text-[11px] font-bold text-[#6D28D9] hover:underline"
                >
                  {showDeepInternals ? "Hide Deeper Technical Internals ▲" : "Explore Deeper Technical Internals ▼"}
                </button>
              </div>
              <p className="text-xs text-stone-800 leading-relaxed">
                {isHinglish ? activeUnit.howItWorksSimple.hinglish : activeUnit.howItWorksSimple.english}
              </p>
              {showDeepInternals && (
                <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] text-xs text-stone-700 whitespace-pre-wrap">
                  {activeUnit.howItWorksDeep}
                </div>
              )}
            </div>

            {/* 6. Small Practical Example + 7. Runnable Code Sandbox */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] space-y-3">
              <div className="text-[11px] font-bold uppercase text-[#162A43]">6. Small Practical &amp; Runnable Code Example</div>
              <p className="text-xs text-stone-700">{activeUnit.smallPracticalExample}</p>
              <textarea
                value={exampleCode}
                onChange={(e) => setExampleCode(e.target.value)}
                rows={7}
                className="w-full p-3 rounded-xl border border-[#CBD5E1] bg-white font-mono text-xs text-[#162A43] outline-none"
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[11px] text-stone-500">{activeUnit.runnableCodeExample.expectedBehavior}</span>
                <button
                  onClick={handleRunMicroExample}
                  disabled={exampleRunning}
                  className="px-4 py-2 rounded-xl bg-[#162A43] hover:bg-black text-white text-xs font-bold transition"
                >
                  {exampleRunning ? "Executing..." : `Run ${activeUnit.runnableCodeExample.language.toUpperCase()} Example ▶`}
                </button>
              </div>
              {exampleOutput && (
                <div className="p-3 rounded-xl bg-white border border-[#E4E1DA] font-mono text-xs space-y-1">
                  {exampleOutput.stdout && <div className="text-emerald-800 whitespace-pre-wrap">{exampleOutput.stdout}</div>}
                  {exampleOutput.stderr && <div className="text-rose-700 whitespace-pre-wrap">{exampleOutput.stderr}</div>}
                  {exampleOutput.rows && (
                    <div className="overflow-x-auto text-[11px]">
                      Returned {exampleOutput.rows.length} rows: {JSON.stringify(exampleOutput.rows.slice(0, 4))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 8. Common Mistakes & 9. Key Takeaways */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-rose-800">7. Common Mistakes to Avoid</div>
                <ul className="list-disc pl-4 text-xs text-rose-900 space-y-1">
                  {activeUnit.commonMistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-emerald-800">8. Key Takeaways</div>
                <ul className="list-disc pl-4 text-xs text-emerald-900 space-y-1">
                  {activeUnit.keyTakeaways.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 10. Quick 1-Minute Knowledge Micro-Check */}
            <div className="p-4 rounded-xl bg-[#F5F3FF]/40 border border-[#DDD6FE] space-y-3">
              <div className="text-[11px] font-bold uppercase text-[#5B21B6]">
                9. Quick 1-Minute Micro-Check ({activeUnit.microCheck.kind.replace(/_/g, " ")})
              </div>
              <p className="text-xs font-bold text-[#162A43]">{activeUnit.microCheck.questionPrompt}</p>
              {activeUnit.microCheck.codeSnippet && (
                <pre className="p-2.5 rounded-lg bg-white border border-[#E4E1DA] font-mono text-[11px] overflow-x-auto">
                  {activeUnit.microCheck.codeSnippet}
                </pre>
              )}
              <div className="space-y-1.5">
                {activeUnit.microCheck.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer ${
                      selectedMicroOption === opt.id ? "bg-white border-[#6D28D9] font-semibold" : "bg-white/80 border-[#E4E1DA]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={activeUnit.microCheck.id}
                      checked={selectedMicroOption === opt.id}
                      onChange={() => setSelectedMicroOption(opt.id)}
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => handleSubmitMicroCheck(false)}
                  disabled={!selectedMicroOption}
                  className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-bold disabled:opacity-50"
                >
                  Verify Answer
                </button>
              </div>

              {/* Own-Words Micro-Explanation (feeds Explanation gate!) */}
              <div className="pt-2 border-t border-[#DDD6FE] space-y-2">
                <label className="block text-[11px] font-bold text-[#162A43]">
                  Or Explain {activeUnit.title} in Your Own Words (unlocks Conceptual Defense):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={recallText}
                    onChange={(e) => setRecallText(e.target.value)}
                    placeholder="Write 1–2 sentences explaining why this works..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#E4E1DA] bg-white text-xs"
                  />
                  <button
                    onClick={() => handleSubmitMicroCheck(true)}
                    disabled={recallText.trim().length < 15}
                    className="px-3.5 py-1.5 rounded-lg bg-[#162A43] text-white text-xs font-bold disabled:opacity-50"
                  >
                    Check Explanation
                  </button>
                </div>
              </div>

              {microCheckResult && (
                <div
                  className={`p-3 rounded-lg border text-xs font-medium ${
                    microCheckResult.passed
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  {microCheckResult.passed ? "✓ " : "✗ "}{microCheckResult.feedback}
                </div>
              )}
            </div>

            {/* Subtopic / Next Phase CTA */}
            <div className="flex justify-between items-center pt-2">
              {activeSubIdx < microPkg.subtopicUnits.length - 1 ? (
                <button
                  onClick={() => setActiveSubIdx((i) => i + 1)}
                  className="px-4 py-2 bg-[#162A43] text-white text-xs font-bold rounded-xl"
                >
                  Next Subtopic Step →
                </button>
              ) : (
                <button
                  onClick={() => setStep("comprehension")}
                  className="px-4 py-2 bg-[#6D28D9] text-white text-xs font-bold rounded-xl"
                >
                  Proceed to Step 2: Code Comprehension &amp; Debug →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PHASE 2: CODE COMPREHENSION & DEBUGGING                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {!loading && step === "comprehension" && (
        <div className="space-y-4">
          {compSuite.map((c) => {
            const res = compResults[c.id];
            return (
              <div key={c.id} className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#F5F3FF] text-[#6D28D9]">
                    {c.kind.replace(/_/g, " ")}
                  </span>
                  {res && (
                    <span className={`text-xs font-bold ${res.passed ? "text-emerald-700" : "text-rose-700"}`}>
                      {res.passed ? "✓ Verified" : "✗ Try Again"}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-[#162A43]">{c.title}</h3>
                <p className="text-xs text-stone-700">{c.prompt}</p>
                {c.kind !== "debug_fix" ? (
                  <>
                    <pre className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] font-mono text-xs overflow-x-auto">
                      {c.codeSnippet}
                    </pre>
                    <div className="space-y-1.5">
                      {c.options?.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer ${
                            compAnswers[c.id] === opt.id ? "bg-[#F5F3FF] border-[#6D28D9]" : "bg-white border-[#E4E1DA]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={c.id}
                            checked={compAnswers[c.id] === opt.id}
                            onChange={() => setCompAnswers((prev) => ({ ...prev, [c.id]: opt.id }))}
                          />
                          <span>{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <textarea
                    value={compAnswers[c.id] ?? c.starterFixCode ?? ""}
                    onChange={(e) => setCompAnswers((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    rows={6}
                    className="w-full p-3 rounded-xl border border-[#CBD5E1] bg-[#FAF9F6] font-mono text-xs text-[#162A43]"
                  />
                )}

                <button
                  onClick={() => handleSubmitComprehension(c)}
                  className="px-4 py-2 bg-[#6D28D9] text-white text-xs font-bold rounded-xl"
                >
                  {c.kind === "debug_fix" ? "Run & Verify Debug Fix ▶" : "Check Reasoning"}
                </button>

                {res && (
                  <div className={`p-3 rounded-xl border text-xs ${res.passed ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"}`}>
                    <div>{res.feedback}</div>
                    {res.stdout && <div className="font-mono text-[11px] mt-1">{res.stdout}</div>}
                    {res.stderr && <div className="font-mono text-[11px] mt-1">{res.stderr}</div>}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end">
            <button onClick={() => setStep("practical_lab")} className="px-5 py-2.5 bg-[#162A43] text-white text-xs font-bold rounded-xl">
              Proceed to Step 3: Practical Laboratory →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PHASE 3: PRACTICAL LABORATORY                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {!loading && step === "practical_lab" && practicalLab && (
        <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#6D28D9] bg-[#F5F3FF] px-2 py-0.5 rounded">
                {practicalLab.labType.replace(/_/g, " ")}
              </span>
              <h2 className="text-lg font-bold text-[#162A43] mt-1">{practicalLab.title}</h2>
            </div>
            {masteryRecord?.labPassed && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ✓ Lab Verified
              </span>
            )}
          </div>

          <p className="text-xs text-stone-700">{practicalLab.objective}</p>
          {practicalLab.datasetSummary && (
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] text-xs text-stone-700">
              <strong>Dataset / Environment:</strong> {practicalLab.datasetSummary}
            </div>
          )}

          <ul className="list-disc pl-5 text-xs text-stone-700 space-y-1">
            {practicalLab.instructions.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>

          <textarea
            value={labCode}
            onChange={(e) => setLabCode(e.target.value)}
            rows={10}
            className="w-full p-3.5 rounded-xl border border-[#CBD5E1] bg-[#FAF9F6] font-mono text-xs text-[#162A43]"
          />

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={handleRunPracticalLab}
              disabled={labRunning}
              className="px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl"
            >
              {labRunning ? "Evaluating Lab..." : "Submit & Evaluate Lab ▶"}
            </button>
            <button
              onClick={() => setStep("assessment")}
              className="px-4 py-2 bg-[#162A43] text-white text-xs font-bold rounded-xl"
            >
              Proceed to Step 4: Topic Assessment →
            </button>
          </div>

          {labResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${labResult.passed ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
              <div className="font-bold">
                {labResult.passed ? "✓ PASSED" : "Needs Improvement"} — Score: {labResult.score}%
              </div>
              <div>{labResult.feedback}</div>
              {labResult.stdout && <pre className="font-mono text-[11px] whitespace-pre-wrap">{labResult.stdout}</pre>}
              {labResult.stderr && <pre className="font-mono text-[11px] text-rose-700 whitespace-pre-wrap">{labResult.stderr}</pre>}
              {labResult.improvementSuggestions.length > 0 && (
                <ul className="list-disc pl-4">
                  {labResult.improvementSuggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PHASE 4: ASSESSMENT ENGINE & TARGETED REMEDIATION                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {!loading && step === "assessment" && assessment && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#162A43]">Topic Mastery Assessment: {assessment.topicTitle}</h2>
                <p className="text-xs text-stone-600">
                  Pass Threshold: {assessment.passThresholdPercent}% • Includes Conceptual, Multi-Select, Trace, Scenario, Live Coding, and Viva Explanation.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F5F3FF] text-[#6D28D9]">
                {assessment.items.length} Evaluated Tasks
              </span>
            </div>

            <div className="space-y-4">
              {assessment.items.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] space-y-2.5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-[#6D28D9]">
                    <span>Q{idx + 1} • {item.format.replace(/_/g, " ").toUpperCase()} • {item.conceptTag}</span>
                    <span>{item.weightPoints} pts</span>
                  </div>
                  <p className="text-xs font-bold text-[#162A43]">{item.prompt}</p>
                  {item.codeSnippet && (
                    <pre className="p-2.5 rounded-lg bg-white border border-[#E4E1DA] font-mono text-[11px] overflow-x-auto">
                      {item.codeSnippet}
                    </pre>
                  )}

                  {(item.format === "mcq" || item.format === "scenario") && item.options && (
                    <div className="space-y-1.5">
                      {item.options.map((opt) => (
                        <label key={opt.id} className="flex items-start gap-2 p-2 rounded-lg border bg-white border-[#E4E1DA] text-xs cursor-pointer">
                          <input
                            type="radio"
                            name={item.id}
                            checked={asmtAnswers[item.id] === opt.id}
                            onChange={() => setAsmtAnswers((p) => ({ ...p, [item.id]: opt.id }))}
                          />
                          <span>{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {item.format === "multi_select" && item.options && (
                    <div className="space-y-1.5">
                      {item.options.map((opt) => {
                        const arr = Array.isArray(asmtAnswers[item.id]) ? (asmtAnswers[item.id] as string[]) : [];
                        const checked = arr.includes(opt.id);
                        return (
                          <label key={opt.id} className="flex items-start gap-2 p-2 rounded-lg border bg-white border-[#E4E1DA] text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked ? arr.filter((x) => x !== opt.id) : [...arr, opt.id];
                                setAsmtAnswers((p) => ({ ...p, [item.id]: next }));
                              }}
                            />
                            <span>{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {item.format === "output_prediction" && (
                    <input
                      type="text"
                      placeholder="Enter exact predicted output..."
                      value={String(asmtAnswers[item.id] || "")}
                      onChange={(e) => setAsmtAnswers((p) => ({ ...p, [item.id]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#E4E1DA] bg-white font-mono text-xs"
                    />
                  )}

                  {(item.format === "coding" || item.format === "debugging") && (
                    <textarea
                      rows={6}
                      value={String(asmtAnswers[item.id] ?? item.starterCode ?? "")}
                      onChange={(e) => setAsmtAnswers((p) => ({ ...p, [item.id]: e.target.value }))}
                      className="w-full p-3 rounded-lg border border-[#CBD5E1] bg-white font-mono text-xs"
                    />
                  )}

                  {(item.format === "viva" || item.format === "short_answer") && (
                    <textarea
                      rows={3}
                      placeholder="Explain in your own words..."
                      value={String(asmtAnswers[item.id] || "")}
                      onChange={(e) => setAsmtAnswers((p) => ({ ...p, [item.id]: e.target.value }))}
                      className="w-full p-3 rounded-lg border border-[#E4E1DA] bg-white text-xs"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmitAssessment}
              disabled={asmtSubmitting}
              className="px-6 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              {asmtSubmitting ? "Evaluating Code & Answers..." : "Submit Assessment & Verify Mastery"}
            </button>

            {asmtReport && (
              <div className={`p-5 rounded-2xl border space-y-3 ${asmtReport.passed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-300"}`}>
                <div className="flex items-center justify-between">
                  <div className="text-base font-bold text-[#162A43]">
                    Assessment Score: {asmtReport.scorePercent}% ({asmtReport.earnedPoints}/{asmtReport.maxPoints} pts)
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${asmtReport.passed ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}>
                    {asmtReport.passed ? "PASSED — UNLOCKED NEXT" : "REMEDIATION REQUIRED"}
                  </span>
                </div>

                {asmtReport.remediationPlan.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-amber-900">Targeted Remediation Plan (Before Retake):</div>
                    {asmtReport.remediationPlan.map((rem, i) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-[#162A43]">{rem.concept}</div>
                          <div className="text-stone-600">{rem.targetedExercise}</div>
                        </div>
                        <button
                          onClick={() => setStep(rem.actionTab === "learn" ? "micro_learn" : rem.actionTab === "comprehend" ? "comprehension" : "practical_lab")}
                          className="px-3 py-1.5 bg-[#162A43] text-white rounded-lg text-[11px] font-bold shrink-0"
                        >
                          Practice Now →
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  {asmtReport.itemFeedback.map((fb) => (
                    <div key={fb.questionId} className="p-2.5 bg-white rounded-lg border border-[#E4E1DA] text-xs">
                      <span className={fb.passed ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                        {fb.passed ? "✓ " : "✗ "}{fb.conceptTag} ({fb.earnedPoints}/{fb.maxPoints}):
                      </span>{" "}
                      {fb.feedback}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
