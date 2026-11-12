"use client";

import React, { useState } from "react";
import { BlueprintStageDefinition, StudentRecruitmentJourney } from "@/lib/recruitment/types";
import { AptitudeQuestion } from "@/lib/recruitment/assessment-types";

interface AptitudeStageRunnerProps {
  stage: BlueprintStageDefinition;
  journey: StudentRecruitmentJourney;
  aptitudeQuestions?: AptitudeQuestion[];
  onAttemptSubmitted: (updatedJourney: StudentRecruitmentJourney) => void;
}

export default function AptitudeStageRunner({
  stage,
  journey,
  aptitudeQuestions = [],
  onAttemptSubmitted,
}: AptitudeStageRunnerProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
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
          submissionData: { answers },
        }),
      });

      const evalData = await evalRes.json();
      if (!evalData.success) {
        throw new Error(evalData.error || "Aptitude evaluation failed");
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
          durationSeconds: 120,
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
      setErrorMsg(err.message || "Failed to submit aptitude answers.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#E4E1DA] gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Timed Cognitive Assessment
            </span>
            <span className="text-xs text-stone-500">
              Negative Marking (-0.25) • Passing Cutoff: {stage.passingThresholdScore || 65}%
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#162A43]">{stage.title}</h3>
        </div>

        <div className="text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
          Answered: {Object.keys(answers).length} / {aptitudeQuestions.length}
        </div>
      </div>

      <div className="space-y-6">
        {aptitudeQuestions.map((q, idx) => (
          <div key={q.id} className="p-5 border border-stone-200 rounded-xl bg-stone-50/50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-[#356AE6] uppercase tracking-wider">
                Question {idx + 1} • {q.section}
              </span>
              <span className="text-[10px] text-stone-400 bg-white px-2 py-0.5 rounded border border-stone-200">
                {q.topicTag.replace(/_/g, " ")}
              </span>
            </div>

            <p className="text-sm font-medium text-[#162A43] mb-4 leading-relaxed">
              {q.questionText}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {q.options.map((opt, optIdx) => {
                const isSelected = answers[q.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(q.id, optIdx)}
                    className={`p-3 rounded-xl border text-left text-xs transition flex items-center gap-3 ${
                      isSelected
                        ? "border-[#356AE6] bg-[#356AE6]/10 text-[#162A43] font-semibold ring-1 ring-[#356AE6]"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                      isSelected ? "border-[#356AE6] bg-[#356AE6] text-white" : "border-stone-300 text-stone-500"
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className={`mt-6 p-4 rounded-xl border ${
          result.stagePassed ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-800"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {result.stagePassed ? "✓ Cognitive Cutoff Cleared" : "✗ Did Not Meet Sectional Cutoff"}
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
          disabled={isRunning || Object.keys(answers).length === 0}
          className="px-6 py-2.5 bg-[#162A43] hover:bg-[#0F1E31] text-white font-medium text-xs rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          {isRunning ? "Scoring Assessment..." : "Submit Cognitive Section →"}
        </button>
      </div>
    </div>
  );
}

