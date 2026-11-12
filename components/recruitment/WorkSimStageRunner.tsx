"use client";

import React, { useState } from "react";
import { BlueprintStageDefinition, StudentRecruitmentJourney } from "@/lib/recruitment/types";
import { WorkSimulationScenario } from "@/lib/recruitment/assessment-types";

interface WorkSimStageRunnerProps {
  stage: BlueprintStageDefinition;
  journey: StudentRecruitmentJourney;
  workSimulationScenarios?: WorkSimulationScenario[];
  onAttemptSubmitted: (updatedJourney: StudentRecruitmentJourney) => void;
}

export default function WorkSimStageRunner({
  stage,
  journey,
  workSimulationScenarios = [],
  onAttemptSubmitted,
}: WorkSimStageRunnerProps) {
  const [chosenOptions, setChosenOptions] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scenario = workSimulationScenarios[0];

  const handleSelectOption = (scenarioId: string, optionId: string) => {
    setChosenOptions((prev) => ({ ...prev, [scenarioId]: optionId }));
  };

  const handleSubmit = async () => {
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const evalRes = await fetch("/api/recruitment/assessments/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          submissionData: { chosenOptions },
        }),
      });

      const evalData = await evalRes.json();
      if (!evalData.success) {
        throw new Error(evalData.error || "Simulation evaluation failed");
      }

      const evaluation = evalData.evaluation;
      setResult(evaluation);

      const journeyRes = await fetch(`/api/recruitment/journeys/${journey.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          rawScore: evaluation.rawScore,
          maxScore: evaluation.maxScore,
          durationSeconds: 180,
          telemetry: evaluation.telemetry,
          rubricEvaluations: evaluation.rubricEvaluations,
          evaluatorFeedback: evaluation.evaluatorFeedback,
        }),
      });

      const journeyData = await journeyRes.json();
      if (journeyData.success) {
        onAttemptSubmitted(journeyData.updatedJourney);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit work simulation.");
    } finally {
      setIsRunning(false);
    }
  };

  if (!scenario) {
    return (
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 text-center text-sm text-stone-500">
        No active workplace scenario loaded for this stage.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#E4E1DA] gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              Work Simulation & Leadership Assessment
            </span>
            <span className="text-xs text-stone-500">
              Role-Play Decision Engine • Passing Cutoff: {stage.passingThresholdScore || 70}%
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#162A43]">{scenario.scenarioTitle}</h3>
        </div>
      </div>

      {/* Workplace Narrative */}
      <div className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 leading-relaxed">
        <span className="font-bold text-[#162A43] block mb-1">Context Brief:</span>
        {scenario.contextNarrative}
      </div>

      {/* Team Communications Stream */}
      <div className="space-y-3 mb-6">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
          Simulated Team Communications
        </span>
        {scenario.emailsOrChats.map((msg, i) => (
          <div key={i} className="p-4 border border-stone-200 rounded-xl bg-white shadow-xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-[#162A43]">{msg.sender} <span className="text-stone-400 font-normal">({msg.role})</span></span>
              <span className="text-stone-400 text-[11px]">{msg.timestamp}</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">{msg.content}</p>
          </div>
        ))}
      </div>

      {/* Decision Prompt & Options */}
      <div className="pt-4 border-t border-stone-200">
        <h4 className="text-sm font-bold text-[#162A43] mb-4">
          {scenario.decisionPrompt}
        </h4>

        <div className="space-y-3">
          {scenario.options.map((opt) => {
            const isSelected = chosenOptions[scenario.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(scenario.id, opt.id)}
                className={`w-full p-4 rounded-xl border text-left text-xs transition flex items-start gap-3 ${
                  isSelected
                    ? "border-[#356AE6] bg-[#356AE6]/5 text-[#162A43] ring-1 ring-[#356AE6]"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected ? "border-[#356AE6] bg-[#356AE6]" : "border-stone-300"
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="leading-relaxed">{opt.text}</div>
              </button>
            );
          })}
        </div>
      </div>

      {result && (
        <div className={`mt-6 p-4 rounded-xl border ${
          result.stagePassed ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-800"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {result.stagePassed ? "✓ Leadership Evaluation Cleared" : "✗ Low Leadership Alignment"}
            </span>
            <span className="text-xs font-bold">Score: {result.percentageScore}%</span>
          </div>
          <p className="text-xs mt-1">{result.evaluatorFeedback}</p>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {errorMsg}
        </div>
      )}

      <div className="flex justify-end pt-6 mt-6 border-t border-[#E4E1DA]">
        <button
          onClick={handleSubmit}
          disabled={isRunning || !chosenOptions[scenario.id]}
          className="px-6 py-2.5 bg-[#162A43] hover:bg-[#0F1E31] text-white font-medium text-xs rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          {isRunning ? "Evaluating Alignment..." : "Confirm Engineering Decision →"}
        </button>
      </div>
    </div>
  );
}

