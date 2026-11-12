"use client";

import React from "react";
import { BlueprintStageDefinition, StudentRecruitmentJourney } from "@/lib/recruitment/types";

interface JourneyStageStepperProps {
  stages: BlueprintStageDefinition[];
  journey: StudentRecruitmentJourney | null;
  activeStageId: string;
  onSelectStage: (stageId: string) => void;
}

export default function JourneyStageStepper({
  stages,
  journey,
  activeStageId,
  onSelectStage,
}: JourneyStageStepperProps) {
  const getStageStatus = (stage: BlueprintStageDefinition) => {
    if (!journey) return "NOT_STARTED";
    const progress = journey.stageProgress[stage.id];
    if (progress && progress.status === "PASSED") return "PASSED";
    if (progress && progress.status === "FAILED") return "FAILED";

    // Check if dependencies are satisfied
    const depsMet = stage.dependsOn.every(
      (depId) => journey.stageProgress[depId]?.status === "PASSED"
    );

    if (!depsMet) return "LOCKED";
    if (journey.currentStageId === stage.id) return "IN_PROGRESS";
    return "UNLOCKED";
  };

  const getFormatBadge = (format: string) => {
    switch (format) {
      case "coding":
        return { label: "Code Lab", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "sql":
        return { label: "SQL Lab", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "aptitude":
        return { label: "Cognitive", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "interview":
        return { label: "AI Interview", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "work_simulation":
        return { label: "Work Sim", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "peer_discussion":
      case "group_discussion":
        return { label: "Group Case", color: "bg-orange-50 text-orange-700 border-orange-200" };
      default:
        return { label: "Evaluation", color: "bg-stone-50 text-stone-700 border-stone-200" };
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E4E1DA] rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E1DA] gap-2 mb-6">
        <div>
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            DAG Stage Progression Engine
          </span>
          <h3 className="text-lg font-bold text-[#162A43]">
            Recruitment Stages ({stages.length} Verified Rounds)
          </h3>
        </div>
        {journey && (
          <div className="flex items-center gap-3">
            <div className="text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
              <span className="text-stone-400 mr-1.5">Journey Score:</span>
              <span className="font-bold text-[#162A43]">{journey.overallScore}%</span>
            </div>
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
              journey.status === "OFFER_EXTENDED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : journey.status === "DID_NOT_PASS"
                ? "bg-rose-50 text-rose-700 border-rose-300"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {journey.status === "OFFER_EXTENDED"
                ? "🎉 Offer Extended"
                : journey.status === "DID_NOT_PASS"
                ? "Did Not Pass"
                : "Active Candidate Loop"}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {stages.map((stage, idx) => {
          const status = getStageStatus(stage);
          const isSelected = stage.id === activeStageId;
          const formatBadge = getFormatBadge(stage.assessmentFormat);
          const score = journey?.stageProgress[stage.id]?.percentageScore;

          let cardBorder = "border-[#E4E1DA] bg-white";
          let badgeEl = null;

          if (status === "PASSED") {
            cardBorder = isSelected
              ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20"
              : "border-emerald-300 bg-emerald-50/10";
            badgeEl = (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                ✓ Passed ({score}%)
              </span>
            );
          } else if (status === "FAILED") {
            cardBorder = isSelected
              ? "border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/20"
              : "border-rose-300 bg-rose-50/10";
            badgeEl = (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                ✗ Failed ({score}%)
              </span>
            );
          } else if (status === "IN_PROGRESS") {
            cardBorder = "border-[#356AE6] ring-2 ring-[#356AE6]/20 bg-blue-50/20";
            badgeEl = (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md animate-pulse">
                ● Current Stage
              </span>
            );
          } else if (status === "LOCKED") {
            cardBorder = "border-stone-200 bg-stone-50/60 opacity-60 cursor-not-allowed";
            badgeEl = (
              <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                🔒 Locked
              </span>
            );
          } else {
            // UNLOCKED
            cardBorder = isSelected
              ? "border-[#356AE6] ring-2 ring-[#356AE6]/20 bg-white"
              : "border-stone-300 hover:border-stone-400 bg-white cursor-pointer";
            badgeEl = (
              <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                Ready to Attempt
              </span>
            );
          }

          return (
            <div
              key={stage.id}
              onClick={() => {
                if (status !== "LOCKED") {
                  onSelectStage(stage.id);
                }
              }}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between text-left ${cardBorder}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Round {stage.order}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${formatBadge.color}`}>
                    {formatBadge.label}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#162A43] line-clamp-2 leading-snug mb-1">
                  {stage.title}
                </h4>

                <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                  {stage.formatDescription}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between mt-auto">
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  ⏱ {stage.durationMinutes}m
                </span>
                {badgeEl}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

