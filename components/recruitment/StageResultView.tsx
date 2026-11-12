"use client";

import React from "react";
import Link from "next/link";
import {
  BlueprintStageDefinition,
  StageProgressItem,
  StudentRecruitmentJourney,
} from "@/lib/recruitment/types";

interface StageResultViewProps {
  stageDef: BlueprintStageDefinition;
  stageProgress: StageProgressItem;
  journey: StudentRecruitmentJourney;
  nextStageDef: BlueprintStageDefinition | null;
  onContinueToNextStage: () => void;
  onViewFinalDossier: () => void;
}

export default function StageResultView({
  stageDef,
  stageProgress,
  journey,
  nextStageDef,
  onContinueToNextStage,
  onViewFinalDossier,
}: StageResultViewProps) {
  const isPassed = stageProgress.status === "PASSED";
  const threshold = stageDef.passingThresholdScore ?? 70;

  return (
    <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 sm:p-8 shadow-sm max-w-3xl mx-auto my-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-6 border-b border-[#E4E1DA]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Stage {stageDef.order} of Evaluation
            </span>
            <span>•</span>
            <span className="text-[11px] font-semibold text-stone-600">
              {stageDef.title}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#162A43]">
            Stage Attempt Evaluation Report
          </h2>
        </div>

        <div>
          {isPassed ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              STAGE PASSED
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              THRESHOLD NOT MET
            </span>
          )}
        </div>
      </div>

      {/* Score & Threshold Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-[#E4E1DA]">
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Achieved Score
          </div>
          <div className={`text-3xl font-black ${isPassed ? "text-emerald-700" : "text-rose-700"}`}>
            {stageProgress.percentageScore}%
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            {stageProgress.rawScore} / {stageProgress.maxScore} points
          </div>
        </div>

        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Hiring Bar Cutoff
          </div>
          <div className="text-3xl font-black text-[#162A43]">
            {threshold}%
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            Standard enterprise minimum
          </div>
        </div>

        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Journey Status
          </div>
          <div className="text-lg font-bold text-[#162A43] mt-2">
            {journey.status.replace(/_/g, " ")}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            Overall: {journey.overallScore}% average
          </div>
        </div>
      </div>

      {/* Evaluator Feedback */}
      {stageProgress.evaluatorFeedback && (
        <div className="py-5 border-b border-[#E4E1DA]">
          <h4 className="text-xs font-bold text-[#162A43] uppercase tracking-wider mb-2">
            Assessment Feedback & Technical Observations
          </h4>
          <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">
            {stageProgress.evaluatorFeedback}
          </p>
        </div>
      )}

      {/* Target Competencies Scored */}
      <div className="py-5 border-b border-[#E4E1DA]">
        <h4 className="text-xs font-bold text-[#162A43] uppercase tracking-wider mb-3">
          Competency Evaluation Breakdown
        </h4>
        <div className="space-y-2">
          {stageDef.targetCompetencies.map((comp) => {
            const score = journey.competencyScores[comp] ?? stageProgress.percentageScore;
            return (
              <div key={comp} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700 capitalize">
                  {comp.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-3 w-1/2">
                  <div className="flex-1 bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${score >= 70 ? "bg-[#356AE6]" : "bg-amber-500"}`}
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                  <span className="font-bold text-[#162A43] w-10 text-right">{score}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {!isPassed && (
            <Link
              href="/student/skills"
              className="text-xs font-semibold text-[#356AE6] hover:underline"
            >
              ← Practice Remediation in Skill Practice Hub
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isPassed && nextStageDef ? (
            <button
              onClick={onContinueToNextStage}
              className="px-6 py-2.5 bg-[#356AE6] hover:bg-[#2855C7] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>Continue to Stage {nextStageDef.order}: {nextStageDef.title}</span>
              <span>→</span>
            </button>
          ) : (
            <button
              onClick={onViewFinalDossier}
              className="px-6 py-2.5 bg-[#162A43] hover:bg-[#1a3352] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>View Full Recruitment Dossier & Verdict</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

