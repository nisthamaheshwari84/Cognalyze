"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  EducationalLayer4VisualDryRun,
  SimulationFrame
} from "@/lib/skills/learn/content-schemas";
import VisualArrayTrack from "./VisualArrayTrack";
import VariableRegisterBank from "./VariableRegisterBank";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  AlertTriangle,
  Info,
  CheckCircle2,
  Code2,
  Sliders,
  Layers
} from "lucide-react";

export interface LearnVisualPlayerProps {
  visualDryRun: EducationalLayer4VisualDryRun;
  language: "en" | "hinglish";
  className?: string;
}

export default function LearnVisualPlayer({
  visualDryRun,
  language,
  className = ""
}: LearnVisualPlayerProps) {
  const [selectedDataset, setSelectedDataset] = useState<"default" | "edge">("default");
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5, 1, 1.5, 2
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active dataset and frames
  const activeDatasetObj =
    selectedDataset === "edge" && visualDryRun.edgeCaseDataset
      ? visualDryRun.edgeCaseDataset
      : visualDryRun.defaultInputDataset;

  const frames: SimulationFrame[] =
    selectedDataset === "edge" && visualDryRun.edgeCaseDataset
      ? visualDryRun.edgeCaseDataset.stepByStepFrames
      : visualDryRun.stepByStepFrames;

  const currentFrame: SimulationFrame = frames[currentFrameIndex] || frames[0];

  // Derive array state for current frame (fallback to default raw data if frame has no custom elements)
  const elements = currentFrame.arrayState || activeDatasetObj.data.map((val, idx) => ({
    index: idx,
    value: val,
    state: "unvisited" as const
  }));

  // Step Navigation handlers
  const handleNext = useCallback(() => {
    setCurrentFrameIndex((prev) => {
      if (prev < frames.length - 1) {
        return prev + 1;
      } else {
        setIsPlaying(false);
        return prev;
      }
    });
  }, [frames.length]);

  const handlePrev = useCallback(() => {
    setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
  }, []);

  const handleDatasetChange = (ds: "default" | "edge") => {
    setIsPlaying(false);
    setSelectedDataset(ds);
    setCurrentFrameIndex(0);
  };

  // Auto-play loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(1800 / playbackSpeed);
      timerRef.current = setTimeout(() => {
        if (currentFrameIndex < frames.length - 1) {
          handleNext();
        } else {
          setIsPlaying(false);
        }
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentFrameIndex, frames.length, playbackSpeed, handleNext]);

  return (
    <div
      className={`bg-white border border-[#E4E1DA] rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col space-y-5 ${className}`}
    >
      {/* ── HEADER & DATASET SELECTOR ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Interactive Dry-Run Engine
            </span>
            <span className="flex items-center text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <Code2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Line {currentFrame.codeLineNumber}
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {currentFrame.title[language] || currentFrame.title.en}
          </h4>
        </div>

        {/* Dataset Switcher */}
        {visualDryRun.edgeCaseDataset && (
          <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200/90 rounded-xl">
            <button
              type="button"
              onClick={() => handleDatasetChange("default")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedDataset === "default"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Canonical Mixed Array
            </button>
            <button
              type="button"
              onClick={() => handleDatasetChange("edge")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedDataset === "edge"
                  ? "bg-white text-amber-800 shadow-xs border border-amber-300/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All-Negative Edge Case
            </button>
          </div>
        )}
      </div>

      {/* ── VISUAL ARRAY & POINTER TRACK ───────────────────────── */}
      <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-2 sm:p-4">
        <VisualArrayTrack
          elements={elements}
          pointers={currentFrame.pointers}
        />
      </div>

      {/* ── VARIABLE ACCUMULATORS & REGISTERS ───────────────────── */}
      <VariableRegisterBank variables={currentFrame.variables} />

      {/* ── EXPLANATION & CALLOUT CARDS ─────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col space-y-3">
        <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
          {currentFrame.explanation[language] || currentFrame.explanation.en}
        </div>

        {currentFrame.calloutAlert && (
          <div
            className={`flex items-start space-x-3 p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm font-medium ${
              currentFrame.calloutAlert.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : currentFrame.calloutAlert.type === "warning"
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : currentFrame.calloutAlert.type === "decision"
                ? "bg-purple-50 border-purple-300 text-purple-900"
                : "bg-blue-50 border-blue-300 text-blue-900"
            }`}
          >
            {currentFrame.calloutAlert.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : currentFrame.calloutAlert.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div>
              {currentFrame.calloutAlert.message[language] ||
                currentFrame.calloutAlert.message.en}
            </div>
          </div>
        )}
      </div>

      {/* ── CONTROLS: TIMELINE SCRUBBER & PLAYBACK ──────────────── */}
      <div className="flex flex-col space-y-3 pt-2 border-t border-slate-100">
        {/* Frame Progress Bar / Scrubber */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
            Step {currentFrameIndex + 1} / {frames.length}
          </span>
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={currentFrameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentFrameIndex(Number(e.target.value));
            }}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#162A43]"
          />
        </div>

        {/* Buttons: Step Back, Play/Pause, Step Forward, Reset, Speed */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2">
            {/* Step Back */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentFrameIndex === 0}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
              title="Previous Step"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#162A43] hover:bg-[#1E3A5F] text-white font-bold text-xs sm:text-sm shadow-sm transition"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play Simulation</span>
                </>
              )}
            </button>

            {/* Step Forward */}
            <button
              type="button"
              onClick={handleNext}
              disabled={currentFrameIndex === frames.length - 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
              title="Next Step"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
              title="Reset to Start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200/90 p-1 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center">
              <Sliders className="w-3 h-3 mr-1" />
              Speed:
            </span>
            {[0.5, 1, 1.5, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition ${
                  playbackSpeed === spd
                    ? "bg-[#162A43] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
