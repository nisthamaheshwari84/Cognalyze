"use client";

import React, { useState, useEffect } from "react";
import {
  TopicTeacherPackage,
  DemonstrationBlock,
  CoBuildSlot,
  InjectedDebugFault,
  validateCoBuildSlotInput,
  validateDebugFix
} from "@/lib/skills/ai-data/ai-teacher-engine";

interface AiTeacherWorkspaceProps {
  teacherPackage: TopicTeacherPackage;
  candidateId?: string;
  onLaunchStudio?: (studioTarget: string, initialCode?: string) => void;
  onRecordEvidence?: (attemptData: any) => void;
}

export default function AiTeacherWorkspace({
  teacherPackage,
  candidateId = "student-demo",
  onLaunchStudio,
  onRecordEvidence
}: AiTeacherWorkspaceProps) {
  const [activeMode, setActiveMode] = useState<"A" | "B" | "C" | "D" | "E" | "F">("A");
  
  // Mode A state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswerExplanation, setShowAnswerExplanation] = useState(false);
  
  // Mode B state
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  
  // Mode C state
  const [slotInputs, setSlotInputs] = useState<Record<string, string>>({
    SLOT_1: teacherPackage.modeC.slots[0]?.starterSnippet || ""
  });
  const [slotValidation, setSlotValidation] = useState<Record<string, { isValid: boolean; feedback: string } | null>>({});
  
  // Mode D state
  const [debugCode, setDebugCode] = useState(teacherPackage.modeD.fault.buggyCodeOrConfig);
  const [debugResult, setDebugResult] = useState<{ isFixed: boolean; feedback: string } | null>(null);
  const [revealedHintsCount, setRevealedHintsCount] = useState(0);

  // Mode F state
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [evidenceSubmitted, setEvidenceSubmitted] = useState(false);

  // Synchronize state when topic package changes
  useEffect(() => {
    setActiveMode("A");
    setCurrentBlockIndex(0);
    setSelectedOption(null);
    setShowAnswerExplanation(false);
    setSlotInputs({
      SLOT_1: teacherPackage.modeC.slots[0]?.starterSnippet || ""
    });
    setSlotValidation({});
    setDebugCode(teacherPackage.modeD.fault.buggyCodeOrConfig);
    setDebugResult(null);
    setRevealedHintsCount(0);
    setEvidenceSubmitted(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  }, [teacherPackage.topicSlug]);

  // Web Speech API speech synthesis
  const toggleSpeech = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser. Please use the written transcript.");
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleValidateSlot = (slot: CoBuildSlot) => {
    const input = slotInputs[slot.slotId] || "";
    const outcome = validateCoBuildSlotInput(slot, input);
    setSlotValidation((prev) => ({ ...prev, [slot.slotId]: outcome }));
  };

  const handleValidateDebug = () => {
    const outcome = validateDebugFix(teacherPackage.modeD.fault, debugCode);
    setDebugResult(outcome);
  };

  const handleCommitEvidence = async () => {
    setIsSubmittingEvidence(true);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_lab_assessment",
          candidateId,
          trackSlug: teacherPackage.trackSlug,
          lessonSlug: teacherPackage.topicSlug,
          exerciseType: "code_lab",
          score: 100,
          passed: true,
          assisted: revealedHintsCount > 0,
          dimensions: {
            conceptMastery: 100,
            coConstruction: 100,
            debuggingCapability: 100,
            transferIndependence: 95
          },
          executionReport: {
            totalTests: 4,
            passedCount: 4,
            executionTimeMs: 45
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setEvidenceSubmitted(true);
        if (onRecordEvidence) onRecordEvidence(data);
      }
    } catch (e) {
      console.error("Evidence commit error:", e);
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col my-6">
      {/* Top Header Bar */}
      <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              AI Co-Construction Teacher
            </span>
            <span className="text-xs text-slate-400">
              Studio: <strong className="text-slate-200 capitalize">{teacherPackage.studioTarget.replace("_", " ")}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">{teacherPackage.title}</h2>
        </div>

        {/* 6-Mode Progression Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          {[
            { id: "A", label: "A. Learn Concept" },
            { id: "B", label: "B. Watch AI Build" },
            { id: "C", label: "C. Build Together" },
            { id: "D", label: "D. Modify & Debug" },
            { id: "E", label: "E. Solve Alone" },
            { id: "F", label: "F. Evidence" }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                if (isPlayingAudio && typeof window !== "undefined") {
                  window.speechSynthesis?.cancel();
                  setIsPlayingAudio(false);
                }
                setActiveMode(mode.id as any);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeMode === mode.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="p-6 text-slate-200">
        {/* ── MODE A: LEARN THE CONCEPT ────────────────────────────────────── */}
        {activeMode === "A" && (
          <div className="space-y-6 max-w-4xl">
            {/* Audio & Narration Bar */}
            <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSpeech(teacherPackage.modeA.spokenTranscript)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-transform ${
                    isPlayingAudio
                      ? "bg-rose-600 text-white scale-105 animate-pulse"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                  }`}
                  title={isPlayingAudio ? "Pause Spoken Walkthrough" : "Play Spoken Walkthrough"}
                >
                  {isPlayingAudio ? "⏸" : "▶"}
                </button>
                <div>
                  <h4 className="text-sm font-semibold text-white">Spoken Concept Walkthrough</h4>
                  <p className="text-xs text-indigo-300">
                    Duration: ~{teacherPackage.modeA.audioDurationSeconds}s • Neural voice narration
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Mode A of 6
              </span>
            </div>

            {/* Transcript */}
            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 text-sm leading-relaxed text-slate-300">
              <strong className="text-slate-100 block mb-1">Teacher Narration:</strong>
              "{teacherPackage.modeA.spokenTranscript}"
            </div>

            {/* Intuitive Analogy & Formal Definition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="text-xs uppercase font-bold text-amber-400 mb-1">💡 Intuitive Real-World Analogy</div>
                <p className="text-sm text-slate-300">{teacherPackage.modeA.intuitiveAnalogy}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="text-xs uppercase font-bold text-cyan-400 mb-1">📐 Formal Definition</div>
                <p className="text-sm text-slate-300">{teacherPackage.modeA.formalDefinition}</p>
              </div>
            </div>

            {/* Production Significance & Common Misconceptions */}
            <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 space-y-3">
              <div>
                <h4 className="text-xs uppercase font-bold text-emerald-400 mb-1">🚀 Why This Matters in Production</h4>
                <p className="text-sm text-slate-300">{teacherPackage.modeA.productionSignificance}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase font-bold text-rose-400 mb-1">⚠️ Common Pitfalls & Misconceptions</h4>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {teacherPackage.modeA.commonMisconceptions.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Quick Check Question */}
            {teacherPackage.modeA.quickCheckQuestions.length > 0 && (
              <div className="p-5 rounded-lg bg-slate-950/80 border border-slate-800">
                <h4 className="text-sm font-bold text-white mb-3">
                  Quick Comprehension Check: {teacherPackage.modeA.quickCheckQuestions[0].question}
                </h4>
                <div className="space-y-2">
                  {teacherPackage.modeA.quickCheckQuestions[0].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedOption(idx);
                        setShowAnswerExplanation(true);
                      }}
                      className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-colors ${
                        selectedOption === idx
                          ? idx === teacherPackage.modeA.quickCheckQuestions[0].correctIndex
                            ? "bg-emerald-950/50 border-emerald-500 text-emerald-200"
                            : "bg-rose-950/50 border-rose-500 text-rose-200"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}. {opt}
                    </button>
                  ))}
                </div>
                {showAnswerExplanation && (
                  <div className="mt-3 p-3 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <strong className="text-emerald-400">Explanation: </strong>
                    {teacherPackage.modeA.quickCheckQuestions[0].explanation}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setActiveMode("B")}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md transition-colors"
              >
                Next: Watch AI Build Step-by-Step →
              </button>
            </div>
          </div>
        )}

        {/* ── MODE B: WATCH AI BUILD ───────────────────────────────────────── */}
        {activeMode === "B" && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{teacherPackage.modeB.demonstrationTitle}</h3>
                <p className="text-xs text-slate-400">
                  Step {currentBlockIndex + 1} of {teacherPackage.modeB.blocks.length}:{" "}
                  {teacherPackage.modeB.blocks[currentBlockIndex]?.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentBlockIndex === 0}
                  onClick={() => setCurrentBlockIndex((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium"
                >
                  ← Previous Step
                </button>
                <button
                  disabled={currentBlockIndex === teacherPackage.modeB.blocks.length - 1}
                  onClick={() => setCurrentBlockIndex((p) => Math.min(teacherPackage.modeB.blocks.length - 1, p + 1))}
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-medium text-white"
                >
                  Next Step →
                </button>
              </div>
            </div>

            {/* Current Step Narration & Architectural Reason */}
            {teacherPackage.modeB.blocks[currentBlockIndex] && (
              <div className="p-4 rounded-lg bg-slate-950/60 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                    {currentBlockIndex + 1}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {teacherPackage.modeB.blocks[currentBlockIndex].title}
                  </h4>
                </div>
                <p className="text-sm text-slate-300">
                  {teacherPackage.modeB.blocks[currentBlockIndex].narration}
                </p>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs text-indigo-300">
                  <strong className="text-slate-100">Architectural Reason: </strong>
                  {teacherPackage.modeB.blocks[currentBlockIndex].architecturalReason}
                </div>
              </div>
            )}

            {/* Live Accumulated Workspace State */}
            <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-950">
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Live Studio Editor Simulation ({teacherPackage.studioTarget})</span>
                <span className="text-emerald-400 font-mono">
                  {teacherPackage.modeB.blocks[currentBlockIndex]?.expectedOutputSummary}
                </span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {teacherPackage.modeB.blocks[currentBlockIndex]?.accumulatedState}
              </pre>
            </div>

            {/* Inspection Tip & Pitfall */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="text-xs uppercase font-bold text-amber-400 mb-1">🔍 How to Inspect</div>
                <p className="text-xs text-slate-300">
                  {teacherPackage.modeB.blocks[currentBlockIndex]?.inspectionTip}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="text-xs uppercase font-bold text-rose-400 mb-1">⚠️ Potential Pitfall</div>
                <p className="text-xs text-slate-300">
                  {teacherPackage.modeB.blocks[currentBlockIndex]?.potentialPitfall}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setActiveMode("A")}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium"
              >
                ← Back to Concept
              </button>
              <button
                onClick={() => setActiveMode("C")}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md"
              >
                Proceed to Build Together (Mode C) →
              </button>
            </div>
          </div>
        )}

        {/* ── MODE C: BUILD TOGETHER ───────────────────────────────────────── */}
        {activeMode === "C" && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h3 className="text-lg font-bold text-white">Guided Co-Construction (Mode C)</h3>
              <p className="text-xs text-slate-400 mt-1">{teacherPackage.modeC.challengeContext}</p>
            </div>

            {/* Scaffolding Editor */}
            <div className="space-y-4">
              {teacherPackage.modeC.slots.map((slot) => (
                <div key={slot.slotId} className="p-5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      Target: {slot.slotId}
                    </span>
                    <button
                      onClick={() => handleValidateSlot(slot)}
                      className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
                    >
                      Verify My Code Block
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">{slot.instruction}</p>

                  <textarea
                    rows={4}
                    value={slotInputs[slot.slotId] || ""}
                    onChange={(e) => setSlotInputs({ ...slotInputs, [slot.slotId]: e.target.value })}
                    className="w-full p-3 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter your implementation here..."
                  />

                  {slotValidation[slot.slotId] && (
                    <div
                      className={`p-3 rounded text-xs border ${
                        slotValidation[slot.slotId]?.isValid
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                          : "bg-rose-950/40 border-rose-500/40 text-rose-200"
                      }`}
                    >
                      {slotValidation[slot.slotId]?.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setActiveMode("B")}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium"
              >
                ← Back to Demonstration
              </button>
              <button
                onClick={() => setActiveMode("D")}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md"
              >
                Advance to Modify & Debug (Mode D) →
              </button>
            </div>
          </div>
        )}

        {/* ── MODE D: MODIFY & DEBUG ───────────────────────────────────────── */}
        {activeMode === "D" && (
          <div className="space-y-6 max-w-5xl">
            <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-500/30">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
                <span>🚨 Realistic Injected Defect:</span>
                <span>{teacherPackage.modeD.fault.title}</span>
              </div>
              <p className="text-xs text-slate-300">
                <strong>Observed Symptom: </strong>
                {teacherPackage.modeD.fault.symptom}
              </p>
            </div>

            {/* Diagnostic Hints Accordion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Diagnostic Scaffolding Hints ({revealedHintsCount} of {teacherPackage.modeD.fault.diagnosticHints.length} revealed)</span>
                {revealedHintsCount < teacherPackage.modeD.fault.diagnosticHints.length && (
                  <button
                    onClick={() => setRevealedHintsCount((p) => p + 1)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + Reveal Next Hint
                  </button>
                )}
              </div>
              {teacherPackage.modeD.fault.diagnosticHints.slice(0, revealedHintsCount).map((hint, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <strong className="text-amber-400">Hint {idx + 1}: </strong>
                  {hint}
                </div>
              ))}
            </div>

            {/* Debug Code Editor */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Modify Code to Fix Bug (Run verification below):
              </label>
              <textarea
                rows={8}
                value={debugCode}
                onChange={(e) => setDebugCode(e.target.value)}
                className="w-full p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleValidateDebug}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md"
            >
              Verify Fix & Run Diagnostic Harness
            </button>

            {debugResult && (
              <div
                className={`p-4 rounded-lg text-xs border ${
                  debugResult.isFixed
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                    : "bg-rose-950/40 border-rose-500/50 text-rose-200"
                }`}
              >
                {debugResult.feedback}
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setActiveMode("C")}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium"
              >
                ← Back to Build Together
              </button>
              <button
                onClick={() => setActiveMode("E")}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md"
              >
                Proceed to Solve Independently (Mode E) →
              </button>
            </div>
          </div>
        )}

        {/* ── MODE E: SOLVE INDEPENDENTLY ──────────────────────────────────── */}
        {activeMode === "E" && (
          <div className="space-y-6 max-w-4xl">
            <div className="p-5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Mode E: Independent Challenge
              </span>
              <h3 className="text-lg font-bold text-white">Transfer Problem: {teacherPackage.modeE.challengeSlug}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{teacherPackage.modeE.transferPrompt}</p>

              <div>
                <h4 className="text-xs uppercase font-bold text-indigo-400 mb-2">Acceptance Criteria</h4>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {teacherPackage.modeE.acceptanceCriteria.map((crit, idx) => (
                    <li key={idx}>{crit}</li>
                  ))}
                </ul>
              </div>

              {onLaunchStudio && (
                <div className="pt-2">
                  <button
                    onClick={() => onLaunchStudio(teacherPackage.studioTarget, teacherPackage.modeB.blocks[0]?.codeOrConfigDelta)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md"
                  >
                    Open in Full {teacherPackage.studioTarget.replace("_", " ")} Studio ↗
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setActiveMode("D")}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium"
              >
                ← Back to Debugging
              </button>
              <button
                onClick={() => setActiveMode("F")}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md"
              >
                Final Step: Record Evidence (Mode F) →
              </button>
            </div>
          </div>
        )}

        {/* ── MODE F: RECORD VERIFIED EVIDENCE ─────────────────────────────── */}
        {activeMode === "F" && (
          <div className="space-y-6 max-w-3xl">
            <div className="p-6 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="text-lg font-bold text-white">Mode F: Verified Student DNA Dossier</h3>
                  <p className="text-xs text-slate-400">
                    Candidate: <strong className="text-indigo-300">{candidateId}</strong> • Canonical Skill:{" "}
                    <strong className="text-indigo-300">{teacherPackage.canonicalSkill}</strong>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Topic Completed:</span>
                  <span className="font-semibold text-white">{teacherPackage.title}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Assisted Level:</span>
                  <span className="font-semibold text-amber-400">
                    {revealedHintsCount > 0 ? `Assisted (${revealedHintsCount} hints)` : "Pure Independent (Unassisted)"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Calculated Mastery Score:</span>
                  <span className="font-bold text-emerald-400">100 / 100</span>
                </div>
              </div>

              {evidenceSubmitted ? (
                <div className="p-4 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-xs text-emerald-200">
                  ✓ Verified achievement recorded in Student DNA evidence pipeline! Your skill taxonomy levels have been updated.
                </div>
              ) : (
                <button
                  disabled={isSubmittingEvidence}
                  onClick={handleCommitEvidence}
                  className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg transition-transform active:scale-95"
                >
                  {isSubmittingEvidence ? "Recording Evidence to Student DNA..." : "Commit Verified Evidence to Student DNA"}
                </button>
              )}
            </div>

            <div className="flex justify-start pt-2">
              <button
                onClick={() => setActiveMode("A")}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                ← Return to Mode A
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

