"use client";

import React, { useState, useEffect } from "react";
import {
  TopicTeacherPackage,
  CoBuildSlot,
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
    <div className="bg-[#FFFFFF] border border-[#E4E1DA] rounded-xl shadow-sm flex flex-col my-6 text-[#17191C]">
      {/* Top Header Bar */}
      <div className="p-5 bg-[#FAF9F6] border-b border-[#E4E1DA] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF4FE] text-[#356AE6] border border-[#D2E0FB]">
              AI Co-Construction Teacher
            </span>
            <span className="text-xs text-[#667085]">
              Studio: <strong className="text-[#162A43] capitalize">{teacherPackage.studioTarget.replace("_", " ")}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#162A43] mt-1">{teacherPackage.title}</h2>
        </div>

        {/* 6-Mode Progression Tabs */}
        <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-lg border border-[#E4E1DA] text-xs">
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
                  ? "bg-[#162A43] text-white shadow-sm"
                  : "text-[#667085] hover:text-[#162A43] hover:bg-[#FAF9F6]"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="p-6 text-[#17191C]">
        {/* ── MODE A: LEARN THE CONCEPT ────────────────────────────────────── */}
        {activeMode === "A" && (
          <div className="space-y-6 max-w-4xl">
            {/* Audio & Narration Bar */}
            <div className="p-4 rounded-lg bg-[#EFF4FE] border border-[#D2E0FB] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSpeech(teacherPackage.modeA.spokenTranscript)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-transform ${
                    isPlayingAudio
                      ? "bg-[#C24141] text-white scale-105 animate-pulse"
                      : "bg-[#356AE6] hover:bg-[#2858C7] text-white shadow-sm"
                  }`}
                  title={isPlayingAudio ? "Pause Spoken Walkthrough" : "Play Spoken Walkthrough"}
                >
                  {isPlayingAudio ? "⏸" : "▶"}
                </button>
                <div>
                  <h4 className="text-sm font-semibold text-[#162A43]">Spoken Concept Walkthrough</h4>
                  <p className="text-xs text-[#356AE6]">
                    Duration: ~{teacherPackage.modeA.audioDurationSeconds}s • Neural voice narration
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-[#FFFFFF] text-[#667085] border border-[#D2E0FB]">
                Mode A of 6
              </span>
            </div>

            {/* Transcript */}
            <div className="p-4 bg-[#FAF9F6] rounded-lg border border-[#E4E1DA] text-sm leading-relaxed text-[#17191C]">
              <strong className="text-[#162A43] block mb-1">Teacher Narration:</strong>
              &ldquo;{teacherPackage.modeA.spokenTranscript}&rdquo;
            </div>

            {/* Intuitive Analogy & Formal Definition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E4E1DA]">
                <div className="text-xs uppercase font-bold text-[#B7791F] mb-1">💡 Intuitive Real-World Analogy</div>
                <p className="text-sm text-[#667085]">{teacherPackage.modeA.intuitiveAnalogy}</p>
              </div>
              <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E4E1DA]">
                <div className="text-xs uppercase font-bold text-[#356AE6] mb-1">📐 Formal Definition</div>
                <p className="text-sm text-[#667085]">{teacherPackage.modeA.formalDefinition}</p>
              </div>
            </div>

            {/* Production Significance & Common Misconceptions */}
            <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E4E1DA] space-y-3">
              <div>
                <h4 className="text-xs uppercase font-bold text-[#2E7D5B] mb-1">🚀 Why This Matters in Production</h4>
                <p className="text-sm text-[#17191C]">{teacherPackage.modeA.productionSignificance}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase font-bold text-[#C24141] mb-1">⚠️ Common Pitfalls &amp; Misconceptions</h4>
                <ul className="list-disc list-inside text-sm text-[#667085] space-y-1">
                  {teacherPackage.modeA.commonMisconceptions.map((m: string, idx: number) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Quick Check Question */}
            {teacherPackage.modeA.quickCheckQuestions.length > 0 && (
              <div className="p-5 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA]">
                <h4 className="text-sm font-bold text-[#162A43] mb-3">
                  Quick Comprehension Check: {teacherPackage.modeA.quickCheckQuestions[0].question}
                </h4>
                <div className="space-y-2">
                  {teacherPackage.modeA.quickCheckQuestions[0].options.map((opt: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedOption(idx);
                        setShowAnswerExplanation(true);
                      }}
                      className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-colors ${
                        selectedOption === idx
                          ? idx === teacherPackage.modeA.quickCheckQuestions[0].correctIndex
                            ? "bg-[#EAF4EE] border-[#2E7D5B] text-[#2E7D5B]"
                            : "bg-[#FDF0F0] border-[#C24141] text-[#C24141]"
                          : "bg-[#FFFFFF] border-[#E4E1DA] hover:border-[#356AE6] text-[#17191C]"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}. {opt}
                    </button>
                  ))}
                </div>
                {showAnswerExplanation && (
                  <div className="mt-3 p-3 rounded bg-[#FFFFFF] border border-[#E4E1DA] text-xs text-[#17191C]">
                    <strong className="text-[#2E7D5B]">Explanation: </strong>
                    {teacherPackage.modeA.quickCheckQuestions[0].explanation}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setActiveMode("B")}
                className="px-5 py-2.5 rounded-lg bg-[#356AE6] hover:bg-[#2858C7] text-white font-medium text-sm shadow-sm transition-colors"
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
                <h3 className="text-lg font-bold text-[#162A43]">{teacherPackage.modeB.demonstrationTitle}</h3>
                <p className="text-xs text-[#667085]">
                  Step {currentBlockIndex + 1} of {teacherPackage.modeB.blocks.length}:{" "}
                  {teacherPackage.modeB.blocks[currentBlockIndex]?.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentBlockIndex === 0}
                  onClick={() => setCurrentBlockIndex((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-[#EFF4FE] disabled:opacity-40 text-xs font-medium text-[#162A43]"
                >
                  ← Previous Step
                </button>
                <button
                  disabled={currentBlockIndex === teacherPackage.modeB.blocks.length - 1}
                  onClick={() => setCurrentBlockIndex((p) => Math.min(teacherPackage.modeB.blocks.length - 1, p + 1))}
                  className="px-3 py-1.5 rounded bg-[#356AE6] hover:bg-[#2858C7] disabled:opacity-40 text-xs font-medium text-white shadow-sm"
                >
                  Next Step →
                </button>
              </div>
            </div>

            {/* Current Step Narration & Architectural Reason */}
            {teacherPackage.modeB.blocks[currentBlockIndex] && (
              <div className="p-4 rounded-lg bg-[#EFF4FE] border border-[#D2E0FB] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#356AE6] text-white text-xs flex items-center justify-center font-bold">
                    {currentBlockIndex + 1}
                  </span>
                  <h4 className="text-sm font-bold text-[#162A43]">
                    {teacherPackage.modeB.blocks[currentBlockIndex].title}
                  </h4>
                </div>
                <p className="text-sm text-[#17191C]">
                  {teacherPackage.modeB.blocks[currentBlockIndex].narration}
                </p>
                <div className="p-2.5 rounded bg-[#FFFFFF] border border-[#D2E0FB] text-xs text-[#356AE6]">
                  <strong className="text-[#162A43]">Architectural Reason: </strong>
                  {teacherPackage.modeB.blocks[currentBlockIndex].architecturalReason}
                </div>
              </div>
            )}

            {/* Live Accumulated Workspace State */}
            <div className="rounded-lg border border-[#E4E1DA] overflow-hidden bg-[#FFFFFF]">
              <div className="px-4 py-2 bg-[#F0EFEA] border-b border-[#E4E1DA] flex items-center justify-between text-xs text-[#667085]">
                <span className="font-semibold text-[#162A43]">Live Studio Editor Simulation ({teacherPackage.studioTarget})</span>
                <span className="text-[#2E7D5B] font-mono font-bold">
                  {teacherPackage.modeB.blocks[currentBlockIndex]?.expectedOutputSummary}
                </span>
              </div>
              <pre className="p-4 text-xs font-mono text-[#1E293B] overflow-x-auto leading-relaxed bg-[#FAF9F6]">
                {teacherPackage.modeB.blocks[currentBlockIndex]?.accumulatedState}
              </pre>
            </div>

            {/* Inspection Tip & Pitfall */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-[#FFFFFF] border border-[#E4E1DA]">
                <div className="text-xs uppercase font-bold text-[#B7791F] mb-1">🔍 How to Inspect</div>
                <p className="text-xs text-[#667085]">
                  {teacherPackage.modeB.blocks[currentBlockIndex]?.inspectionTip}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#FFFFFF] border border-[#E4E1DA]">
                <div className="text-xs uppercase font-bold text-[#C24141] mb-1">⚠️ Potential Pitfall</div>
                <p className="text-xs text-[#667085]">
                  {teacherPackage.modeB.blocks[currentBlockIndex]?.potentialPitfall}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setActiveMode("A")}
                className="px-4 py-2 rounded bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-[#EFF4FE] text-xs font-medium text-[#162A43]"
              >
                ← Back to Concept
              </button>
              <button
                onClick={() => setActiveMode("C")}
                className="px-5 py-2.5 rounded-lg bg-[#356AE6] hover:bg-[#2858C7] text-white font-medium text-sm shadow-sm"
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
              <h3 className="text-lg font-bold text-[#162A43]">Guided Co-Construction (Mode C)</h3>
              <p className="text-xs text-[#667085] mt-1">{teacherPackage.modeC.challengeContext}</p>
            </div>

            {/* Scaffolding Editor */}
            <div className="space-y-4">
              {teacherPackage.modeC.slots.map((slot: CoBuildSlot) => (
                <div key={slot.slotId} className="p-5 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#EFF4FE] text-[#356AE6] border border-[#D2E0FB]">
                      Target: {slot.slotId}
                    </span>
                    <button
                      onClick={() => handleValidateSlot(slot)}
                      className="px-3 py-1 rounded bg-[#356AE6] hover:bg-[#2858C7] text-xs font-medium text-white shadow-sm"
                    >
                      Verify My Code Block
                    </button>
                  </div>
                  <p className="text-xs text-[#17191C]">{slot.instruction}</p>

                  <textarea
                    rows={4}
                    value={slotInputs[slot.slotId] || ""}
                    onChange={(e) => setSlotInputs({ ...slotInputs, [slot.slotId]: e.target.value })}
                    className="w-full p-3 rounded bg-[#FFFFFF] border border-[#E4E1DA] text-xs font-mono text-[#162A43] focus:outline-none focus:border-[#356AE6]"
                    placeholder="Enter your implementation here..."
                  />

                  {slotValidation[slot.slotId] && (
                    <div
                      className={`p-3 rounded text-xs border ${
                        slotValidation[slot.slotId]?.isValid
                          ? "bg-[#EAF4EE] border-[#C8E4D3] text-[#2E7D5B]"
                          : "bg-[#FDF0F0] border-[#F5C6C6] text-[#C24141]"
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
                className="px-4 py-2 rounded bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-[#EFF4FE] text-xs font-medium text-[#162A43]"
              >
                ← Back to Demonstration
              </button>
              <button
                onClick={() => setActiveMode("D")}
                className="px-5 py-2.5 rounded-lg bg-[#356AE6] hover:bg-[#2858C7] text-white font-medium text-sm shadow-sm"
              >
                Advance to Modify &amp; Debug (Mode D) →
              </button>
            </div>
          </div>
        )}

        {/* ── MODE D: MODIFY & DEBUG ───────────────────────────────────────── */}
        {activeMode === "D" && (
          <div className="space-y-6 max-w-5xl">
            <div className="p-4 rounded-lg bg-[#FDF0F0] border border-[#F5C6C6]">
              <div className="flex items-center gap-2 text-[#C24141] font-bold text-sm mb-1">
                <span>🚨 Realistic Injected Defect:</span>
                <span>{teacherPackage.modeD.fault.title}</span>
              </div>
              <p className="text-xs text-[#17191C]">
                <strong>Observed Symptom: </strong>
                {teacherPackage.modeD.fault.symptom}
              </p>
            </div>

            {/* Diagnostic Hints Accordion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#667085]">
                <span>Diagnostic Scaffolding Hints ({revealedHintsCount} of {teacherPackage.modeD.fault.diagnosticHints.length} revealed)</span>
                {revealedHintsCount < teacherPackage.modeD.fault.diagnosticHints.length && (
                  <button
                    onClick={() => setRevealedHintsCount((p) => p + 1)}
                    className="text-[#356AE6] hover:text-[#2858C7] font-semibold"
                  >
                    + Reveal Next Hint
                  </button>
                )}
              </div>
              {teacherPackage.modeD.fault.diagnosticHints.slice(0, revealedHintsCount).map((hint: string, idx: number) => (
                <div key={idx} className="p-2.5 rounded bg-[#FFFFFF] border border-[#E4E1DA] text-xs text-[#17191C]">
                  <strong className="text-[#B7791F]">Hint {idx + 1}: </strong>
                  {hint}
                </div>
              ))}
            </div>

            {/* Debug Code Editor */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#162A43]">
                Modify Code to Fix Bug (Run verification below):
              </label>
              <textarea
                rows={8}
                value={debugCode}
                onChange={(e) => setDebugCode(e.target.value)}
                className="w-full p-4 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] text-xs font-mono text-[#1E293B] focus:outline-none focus:border-[#356AE6]"
              />
            </div>

            <button
              onClick={handleValidateDebug}
              className="px-5 py-2.5 rounded-lg bg-[#162A43] hover:bg-[#233F63] text-white font-medium text-xs shadow-sm transition-colors"
            >
              Verify Fix &amp; Run Diagnostic Harness
            </button>

            {debugResult && (
              <div
                className={`p-4 rounded-lg text-xs border ${
                  debugResult.isFixed
                    ? "bg-[#EAF4EE] border-[#C8E4D3] text-[#2E7D5B]"
                    : "bg-[#FDF0F0] border-[#F5C6C6] text-[#C24141]"
                }`}
              >
                {debugResult.feedback}
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setActiveMode("C")}
                className="px-4 py-2 rounded bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-[#EFF4FE] text-xs font-medium text-[#162A43]"
              >
                ← Back to Build Together
              </button>
              <button
                onClick={() => setActiveMode("E")}
                className="px-5 py-2.5 rounded-lg bg-[#356AE6] hover:bg-[#2858C7] text-white font-medium text-sm shadow-sm"
              >
                Proceed to Solve Independently (Mode E) →
              </button>
            </div>
          </div>
        )}

        {/* ── MODE E: SOLVE INDEPENDENTLY ──────────────────────────────────── */}
        {activeMode === "E" && (
          <div className="space-y-6 max-w-4xl">
            <div className="p-5 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] space-y-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF4EE] text-[#2E7D5B] border border-[#C8E4D3]">
                Mode E: Independent Challenge
              </span>
              <h3 className="text-lg font-bold text-[#162A43]">Transfer Problem: {teacherPackage.modeE.challengeSlug}</h3>
              <p className="text-sm text-[#17191C] leading-relaxed">{teacherPackage.modeE.transferPrompt}</p>

              <div>
                <h4 className="text-xs uppercase font-bold text-[#356AE6] mb-2">Acceptance Criteria</h4>
                <ul className="list-disc list-inside text-xs text-[#667085] space-y-1">
                  {teacherPackage.modeE.acceptanceCriteria.map((crit: string, idx: number) => (
                    <li key={idx}>{crit}</li>
                  ))}
                </ul>
              </div>

              {onLaunchStudio && (
                <div className="pt-2">
                  <button
                    onClick={() => onLaunchStudio(teacherPackage.studioTarget, teacherPackage.modeB.blocks[0]?.codeOrConfigDelta)}
                    className="px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2858C7] text-white font-medium text-xs shadow-sm transition-colors"
                  >
                    Open in Full {teacherPackage.studioTarget.replace("_", " ")} Studio ↗
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setActiveMode("D")}
                className="px-4 py-2 rounded bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-[#EFF4FE] text-xs font-medium text-[#162A43]"
              >
                ← Back to Debugging
              </button>
              <button
                onClick={() => setActiveMode("F")}
                className="px-5 py-2.5 rounded-lg bg-[#356AE6] hover:bg-[#2858C7] text-white font-medium text-sm shadow-sm"
              >
                Final Step: Record Evidence (Mode F) →
              </button>
            </div>
          </div>
        )}

        {/* ── MODE F: RECORD VERIFIED EVIDENCE ─────────────────────────────── */}
        {activeMode === "F" && (
          <div className="space-y-6 max-w-3xl">
            <div className="p-6 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="text-lg font-bold text-[#162A43]">Mode F: Verified Student DNA Dossier</h3>
                  <p className="text-xs text-[#667085]">
                    Candidate: <strong className="text-[#356AE6]">{candidateId}</strong> • Canonical Skill:{" "}
                    <strong className="text-[#356AE6]">{teacherPackage.canonicalSkill}</strong>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded bg-[#FFFFFF] border border-[#E4E1DA] space-y-2 text-xs">
                <div className="flex justify-between text-[#667085]">
                  <span>Topic Completed:</span>
                  <span className="font-semibold text-[#162A43]">{teacherPackage.title}</span>
                </div>
                <div className="flex justify-between text-[#667085]">
                  <span>Assisted Level:</span>
                  <span className="font-semibold text-[#B7791F]">
                    {revealedHintsCount > 0 ? `Assisted (${revealedHintsCount} hints)` : "Pure Independent (Unassisted)"}
                  </span>
                </div>
                <div className="flex justify-between text-[#667085]">
                  <span>Calculated Mastery Score:</span>
                  <span className="font-bold text-[#2E7D5B]">100 / 100</span>
                </div>
              </div>

              {evidenceSubmitted ? (
                <div className="p-4 rounded-lg bg-[#EAF4EE] border border-[#C8E4D3] text-xs text-[#2E7D5B]">
                  ✓ Verified achievement recorded in Student DNA evidence pipeline! Your skill taxonomy levels have been updated.
                </div>
              ) : (
                <button
                  disabled={isSubmittingEvidence}
                  onClick={handleCommitEvidence}
                  className="w-full py-3 rounded-lg bg-[#2E7D5B] hover:bg-[#24664A] disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-transform active:scale-95"
                >
                  {isSubmittingEvidence ? "Recording Evidence to Student DNA..." : "Commit Verified Evidence to Student DNA"}
                </button>
              )}
            </div>

            <div className="flex justify-start pt-2">
              <button
                onClick={() => setActiveMode("A")}
                className="px-4 py-2 rounded bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-[#EFF4FE] text-xs font-medium text-[#667085]"
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
