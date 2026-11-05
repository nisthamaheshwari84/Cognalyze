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
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-6 my-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Visual Dry-Run Studio
            </span>
            <span className="text-xs text-slate-400">Line-by-Line Execution & Memory Watch</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">{currentTrace.title}</h3>
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
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded bg-slate-800"
            >
              Close ✕
            </button>
          )}
        </div>
      </div>

      {/* Stepper Control Toolbar */}
      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            disabled={currentStepIndex === 0}
            onClick={handlePrevStep}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium"
          >
            ◀ Step Back
          </button>
          <button
            disabled={currentStepIndex >= currentTrace.steps.length - 1}
            onClick={handleNextStep}
            className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium"
          >
            Step Forward ▶
          </button>
          <span className="text-slate-400 ml-2">
            Step <strong>{currentStepIndex + 1}</strong> of <strong>{currentTrace.steps.length}</strong>
          </span>
        </div>

        {/* Audio Synthesis Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSpeech(currentStep.spokenNarration)}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
              isPlayingAudio
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40"
            }`}
          >
            {isPlayingAudio ? "⏸ Pause Narration" : "🔊 Spoken Narration"}
          </button>
        </div>
      </div>

      {/* Spoken Narration & Action Summary Banner */}
      <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/30 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wide">
          <span>Step Action:</span>
          <span>{currentStep.actionSummary}</span>
        </div>
        <p className="text-xs text-slate-300 italic">"{currentStep.spokenNarration}"</p>
      </div>

      {/* Main Grid: Code Line Viewer (Left) + Variable State Watch (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Visualizer */}
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 flex flex-col">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 flex justify-between">
            <span>Source Code ({currentTrace.languageOrStudio})</span>
            <span className="font-mono text-cyan-400">Current Line: {currentStep.lineNumber}</span>
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
                      ? "bg-cyan-500/20 border-l-4 border-cyan-400 text-cyan-200 font-bold"
                      : "text-slate-400 hover:bg-slate-900/50"
                  }`}
                >
                  <span className="w-8 select-none text-slate-600 text-right pr-3">{lineNum}</span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Variable Watch Table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 flex flex-col">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 flex justify-between">
            <span>Variable Watch Inspector</span>
            <span className="font-mono text-emerald-400">{currentStep.variables.length} in scope</span>
          </div>
          <div className="p-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-2 font-medium">Variable</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Current Value</th>
                  <th className="pb-2 font-medium">Delta / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {currentStep.variables.map((v, i) => (
                  <tr
                    key={i}
                    className={`transition-colors ${
                      v.hasChanged ? "bg-emerald-500/10 text-emerald-300 font-semibold" : "text-slate-300"
                    }`}
                  >
                    <td className="py-2 font-mono text-cyan-300">{v.name}</td>
                    <td className="py-2 text-slate-400">{v.type}</td>
                    <td className="py-2 font-mono">{v.value}</td>
                    <td className="py-2 text-slate-400 text-[11px]">{v.notes || (v.hasChanged ? "Modified this step" : "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Complexity & Final Output */}
      <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <span>Time: <strong className="text-emerald-400">{currentTrace.executionComplexitySummary.timeComplexity}</strong></span>
          <span>Space: <strong className="text-emerald-400">{currentTrace.executionComplexitySummary.spaceComplexity}</strong></span>
        </div>
        <div className="text-slate-400">
          Expected Final Output: <strong className="text-white font-mono">{currentTrace.finalOutput}</strong>
        </div>
      </div>
    </div>
  );
}

