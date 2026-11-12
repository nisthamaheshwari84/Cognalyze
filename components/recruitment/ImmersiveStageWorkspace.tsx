"use client";

import React, { useState, useEffect } from "react";
import {
  BlueprintStageDefinition,
  StudentRecruitmentJourney,
  RecruitmentBlueprint,
} from "@/lib/recruitment/types";
import { StageAssessmentBundle } from "@/lib/recruitment/assessment-types";
import CodingStageRunner from "./CodingStageRunner";
import SqlStageRunner from "./SqlStageRunner";
import AptitudeStageRunner from "./AptitudeStageRunner";
import WorkSimStageRunner from "./WorkSimStageRunner";
import InterviewStageRunner from "./InterviewStageRunner";
import VerdictStageRunner from "./VerdictStageRunner";

interface ImmersiveStageWorkspaceProps {
  stageDef: BlueprintStageDefinition;
  journey: StudentRecruitmentJourney;
  blueprint: RecruitmentBlueprint;
  stageBundle: StageAssessmentBundle | null;
  onAttemptSubmitted: (updatedJourney: StudentRecruitmentJourney) => void;
  onExitWorkspace: () => void;
}

export default function ImmersiveStageWorkspace({
  stageDef,
  journey,
  blueprint,
  stageBundle,
  onAttemptSubmitted,
  onExitWorkspace,
}: ImmersiveStageWorkspaceProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    stageDef.durationMinutes * 60
  );
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Timer countdown
  useEffect(() => {
    setSecondsRemaining(stageDef.durationMinutes * 60);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stageDef.id, stageDef.durationMinutes]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimeLow = secondsRemaining < 300; // < 5 minutes

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] animate-in fade-in duration-200">
      {/* Immersive Dedicated Stage Top Bar */}
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-4 sm:px-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Breadcrumb & Stage Identity */}
        <div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1">
            <span className="font-semibold text-stone-700">{blueprint.companyId.toUpperCase()}</span>
            <span>›</span>
            <span>{blueprint.roleFamily.toUpperCase()}</span>
            <span>›</span>
            <span className="text-[#356AE6] font-bold">Stage {stageDef.order} of {blueprint.stages.length}</span>
          </div>
          <h2 className="text-lg font-bold text-[#162A43]">
            {stageDef.title}
          </h2>
        </div>

        {/* Center: Stage Format Badge & Competencies */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md border border-stone-200">
            {stageDef.assessmentFormat.replace(/_/g, " ")}
          </span>
          <span className="text-[11px] text-stone-500 font-medium">
            Passing Bar: {stageDef.passingThresholdScore ?? 70}%
          </span>
        </div>

        {/* Right: Timer & Exit Action */}
        <div className="flex items-center gap-4">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${
              isTimeLow
                ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                : "bg-stone-50 border-stone-200 text-[#162A43]"
            }`}
          >
            <span>⏱</span>
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowExitConfirm(true)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:border-stone-400 bg-white transition"
          >
            Pause / Exit
          </button>
        </div>
      </div>

      {/* Main Dedicated Stage Execution Area */}
      <div className="flex-1">
        {/* 1. Algorithmic Coding */}
        {(stageDef.assessmentFormat === "coding" || stageDef.stageType === "algorithmic_coding") && (
          <CodingStageRunner
            stage={stageDef}
            journey={journey}
            codingProblem={stageBundle?.codingProblems?.[0]}
            onAttemptSubmitted={onAttemptSubmitted}
          />
        )}

        {/* 2. SQL Database Assessment */}
        {(stageDef.assessmentFormat === "sql" || stageDef.stageType === "sql_database") && (
          <SqlStageRunner
            stage={stageDef}
            journey={journey}
            sqlProblem={stageBundle?.sqlProblems?.[0]}
            onAttemptSubmitted={onAttemptSubmitted}
          />
        )}

        {/* 3. Cognitive Aptitude */}
        {(stageDef.assessmentFormat === "aptitude" || stageDef.stageType === "quantitative_aptitude") && (
          <AptitudeStageRunner
            stage={stageDef}
            journey={journey}
            aptitudeQuestions={stageBundle?.aptitudeQuestions}
            onAttemptSubmitted={onAttemptSubmitted}
          />
        )}

        {/* 4. Work Simulation */}
        {stageDef.assessmentFormat === "work_simulation" && (
          <WorkSimStageRunner
            stage={stageDef}
            journey={journey}
            workSimulationScenarios={stageBundle?.workSimulationScenarios}
            onAttemptSubmitted={onAttemptSubmitted}
          />
        )}

        {/* 5. Interviews */}
        {(stageDef.assessmentFormat === "interview" ||
          stageDef.assessmentFormat === "peer_discussion" ||
          stageDef.assessmentFormat === "communication_assessment" ||
          stageDef.stageType.includes("interview") ||
          stageDef.stageType === "group_discussion" ||
          stageDef.stageType === "verbal_ability" ||
          stageDef.stageType === "case_study") && (
          <InterviewStageRunner
            stage={stageDef}
            journey={journey}
            onAttemptSubmitted={onAttemptSubmitted}
          />
        )}

        {/* 6. Verdict */}
        {(stageDef.stageType === "holistic_verdict" || stageDef.assessmentFormat === "document_review") && (
          <VerdictStageRunner
            stage={stageDef}
            journey={journey}
            onAttemptSubmitted={onAttemptSubmitted}
          />
        )}
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E4E1DA] animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-[#162A43] mb-2">Pause Assessment Session?</h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Your journey progress and completed stage scores are permanently preserved. You can resume this stage at any time.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
              >
                Keep Assessing
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onExitWorkspace();
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#162A43] hover:bg-[#1a3352] text-white rounded-xl transition"
              >
                Exit to Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

