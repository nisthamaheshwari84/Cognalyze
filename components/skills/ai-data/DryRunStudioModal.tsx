"use client";

import React, { useState } from "react";
import {
  DryRunTrace,
  DryRunStep,
  CANONICAL_DRY_RUN_TRACES,
  listAvailableDryRunTraces
} from "@/lib/skills/ai-data/dry-run-visualizer";

interface DryRunStudioModalProps {
  initialTraceId?: string;
  onClose?: () => void;
}

export default function DryRunStudioModal({
  initialTraceId = "rolling-average-trace",
  onClose
}: DryRunStudioModalProps) {
  const [selectedTraceId, setSelectedTraceId] = useState<string>(initialTraceId);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const availableTraces = listAvailableDryRunTraces();
  const currentTrace: DryRunTrace = CANONICAL_DRY_RUN_TRACES[selectedTraceId] || CANONICAL_DRY_RUN_TRACES["rolling-average-trace"];
  const currentStep: DryRunStep = currentTrace.steps[currentStepIndex] || currentTrace.steps[0];

  const codeLines = currentTrace.codeOrStructure.split("\n");

  const toggleSpeech = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser. Please read the action summary.");
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

  const handleNextStep = () => {
    if (currentStepIndex < currentTrace.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      if (isPlayingAudio && typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
        toggleSpeech(currentTrace.steps[nextIdx].spokenNarration);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      if (isPlayingAudio && typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
        toggleSpeech(currentTrace.steps[prevIdx].spokenNarration);
      }
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E4E1DA] rounded-xl shadow-sm p-6 space-y-6 my-6 text-[#17191C]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4E1DA] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF4FE] text-[#356AE6] border border-[#D2E0FB]">
              Visual Dry-Run Studio
            </span>
            <span className="text-xs text-[#667085]">Line-by-Line Execution &amp; Memory Watch</span>
          </div>
          <h3 className="text-xl font-bold text-[#162A43] mt-1">{currentTrace.title}</h3>
        </div>

        {/* Trace Switcher */}
        <div className="flex items-center gap-3">
          <select
            value={selectedTraceId}
            onChange={(e) => {
              if (isPlayingAudio && typeof window !== "undefined") {
                window.speechSynthesis?.cancel();
                setIsPlayingAudio(false);
              }
              setSelectedTraceId(e.target.value);
              setCurrentStepIndex(0);
            }}
            className="p-2 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] text-xs text-[#162A43] focus:outline-none focus:border-[#356AE6]"
          >
            {availableTraces.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.totalSteps} steps)
              </option>
            ))}
          </select>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#667085] hover:text-[#162A43] text-xs px-2.5 py-1.5 rounded bg-[#FAF9F6] border border-[#E4E1DA]"
            >
              Close ✕
            </button>
          )}
        </div>
      </div>

      {/* Stepper Control Toolbar */}
      <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E4E1DA] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            disabled={currentStepIndex === 0}
            onClick={handlePrevStep}
            className="px-3 py-1.5 rounded bg-[#FFFFFF] border border-[#E4E1DA] hover:bg-[#EFF4FE] disabled:opacity-40 text-[#162A43] font-medium"
          >
            ◀ Step Back
          </button>
          <button
            disabled={currentStepIndex >= currentTrace.steps.length - 1}
            onClick={handleNextStep}
            className="px-3 py-1.5 rounded bg-[#356AE6] hover:bg-[#2858C7] disabled:opacity-40 text-white font-medium shadow-sm transition-colors"
          >
            Step Forward ▶
          </button>
          <span className="text-[#667085] ml-2">
            Step <strong>{currentStepIndex + 1}</strong> of <strong>{currentTrace.steps.length}</strong>
          </span>
        </div>

        {/* Audio Synthesis Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSpeech(currentStep.spokenNarration)}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
              isPlayingAudio
                ? "bg-[#C24141] text-white animate-pulse"
                : "bg-[#EFF4FE] hover:bg-[#DCE7FB] text-[#356AE6] border border-[#D2E0FB]"
            }`}
          >
            {isPlayingAudio ? "⏸ Pause Narration" : "🔊 Spoken Narration"}
          </button>
        </div>
      </div>

      {/* Spoken Narration & Action Summary Banner */}
      <div className="p-4 rounded-lg bg-[#EFF4FE] border border-[#D2E0FB] space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-[#356AE6] uppercase tracking-wide">
          <span>Step Action:</span>
          <span>{currentStep.actionSummary}</span>
        </div>
        <p className="text-xs text-[#162A43] italic">&ldquo;{currentStep.spokenNarration}&rdquo;</p>
      </div>

      {/* Main Grid: Code Line Viewer (Left) + Variable State Watch (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Visualizer */}
        <div className="rounded-xl border border-[#E4E1DA] overflow-hidden bg-[#FAF9F6] flex flex-col">
          <div className="px-4 py-2 bg-[#F0EFEA] border-b border-[#E4E1DA] text-xs text-[#667085] flex justify-between items-center">
            <span className="font-semibold text-[#162A43]">Source Code ({currentTrace.languageOrStudio})</span>
            <span className="font-mono text-[#356AE6] font-bold">Current Line: {currentStep.lineNumber}</span>
          </div>
          <div className="p-3 font-mono text-xs overflow-x-auto space-y-0.5">
            {codeLines.map((line, idx) => {
              const lineNum = idx + 1;
              const isCurrent = lineNum === currentStep.lineNumber;
              return (
                <div
                  key={lineNum}
                  className={`flex items-center px-2 py-0.5 rounded transition-colors ${
                    isCurrent
                      ? "bg-[#EFF4FE] border-l-4 border-[#356AE6] text-[#162A43] font-bold"
                      : "text-[#1E293B] hover:bg-[#F0EFEA]"
                  }`}
                >
                  <span className="w-8 select-none text-[#98A2B3] text-right pr-3">{lineNum}</span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Variable Watch Table */}
        <div className="rounded-xl border border-[#E4E1DA] overflow-hidden bg-[#FFFFFF] flex flex-col">
          <div className="px-4 py-2 bg-[#F0EFEA] border-b border-[#E4E1DA] text-xs text-[#667085] flex justify-between items-center">
            <span className="font-semibold text-[#162A43]">Variable Watch Inspector</span>
            <span className="font-mono text-[#2E7D5B] font-bold">{currentStep.variables.length} in scope</span>
          </div>
          <div className="p-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E1DA] text-[#667085]">
                  <th className="pb-2 font-medium">Variable</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Current Value</th>
                  <th className="pb-2 font-medium">Delta / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DA]">
                {currentStep.variables.map((v, i) => (
                  <tr
                    key={i}
                    className={`transition-colors ${
                      v.hasChanged ? "bg-[#EAF4EE] text-[#2E7D5B] font-semibold" : "text-[#17191C]"
                    }`}
                  >
                    <td className="py-2 font-mono text-[#356AE6] font-bold">{v.name}</td>
                    <td className="py-2 text-[#667085]">{v.type}</td>
                    <td className="py-2 font-mono text-[#17191C]">{v.value}</td>
                    <td className="py-2 text-[#667085] text-[11px]">{v.notes || (v.hasChanged ? "Modified this step" : "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Complexity & Final Output */}
      <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 text-[#162A43]">
          <span>Time: <strong className="text-[#2E7D5B]">{currentTrace.executionComplexitySummary.timeComplexity}</strong></span>
          <span>Space: <strong className="text-[#2E7D5B]">{currentTrace.executionComplexitySummary.spaceComplexity}</strong></span>
        </div>
        <div className="text-[#667085]">
          Expected Final Output: <strong className="text-[#162A43] font-mono">{currentTrace.finalOutput}</strong>
        </div>
      </div>
    </div>
  );
}
