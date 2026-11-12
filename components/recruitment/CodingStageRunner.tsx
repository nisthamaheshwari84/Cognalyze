"use client";

import React, { useState } from "react";
import { BlueprintStageDefinition, StudentRecruitmentJourney } from "@/lib/recruitment/types";
import { CodingAssessmentProblem } from "@/lib/recruitment/assessment-types";

interface CodingStageRunnerProps {
  stage: BlueprintStageDefinition;
  journey: StudentRecruitmentJourney;
  codingProblem?: CodingAssessmentProblem;
  onAttemptSubmitted: (updatedJourney: StudentRecruitmentJourney) => void;
}

export default function CodingStageRunner({
  stage,
  journey,
  codingProblem,
  onAttemptSubmitted,
}: CodingStageRunnerProps) {
  const [code, setCode] = useState(
    codingProblem?.starterCode?.python ||
      `def solution():\n    # Implement your optimal solution here\n    pass\n`
  );
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const existingAttempt = journey.stageProgress[stage.id];

  const handleRunAndSubmit = async () => {
    setIsRunning(true);
    setErrorMsg(null);

    try {
      // 1. Evaluate code in real sandbox
      const evalRes = await fetch("/api/recruitment/assessments/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          submissionData: { code },
        }),
      });

      const evalData = await evalRes.json();
      if (!evalData.success) {
        throw new Error(evalData.error || "Evaluation failed");
      }

      const evaluation = evalData.evaluation;
      setResult(evaluation);

      // 2. Submit attempt to journey progression engine
      const journeyRes = await fetch(`/api/recruitment/journeys/${journey.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          rawScore: evaluation.rawScore,
          maxScore: evaluation.maxScore,
          durationSeconds: evaluation.telemetry?.executionTimeMs ? Math.round(evaluation.telemetry.executionTimeMs / 1000) : 45,
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
      setErrorMsg(err.message || "Failed to execute submission.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Problem Statement */}
        <div className="lg:w-1/2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {codingProblem?.difficulty || "MEDIUM"}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {codingProblem?.category || "Algorithmic Problem Solving"}
              </span>
              <span className="text-xs text-stone-400">• Passing Cutoff: {stage.passingThresholdScore || 75}%</span>
            </div>

            <h3 className="text-xl font-bold text-[#162A43] mb-3">
              {codingProblem?.title || stage.title}
            </h3>

            <div className="prose prose-sm text-stone-700 max-w-none mb-4 whitespace-pre-line leading-relaxed">
              {codingProblem?.descriptionMarkdown || stage.instructions}
            </div>

            {codingProblem?.constraints && (
              <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
                  Input Constraints
                </span>
                <ul className="list-disc pl-4 text-xs text-stone-600 space-y-0.5">
                  {codingProblem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {codingProblem?.examples && codingProblem.examples.length > 0 && (
              <div className="space-y-2 mb-4">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider block">
                  Example Test Cases
                </span>
                {codingProblem.examples.map((ex, idx) => (
                  <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono">
                    <div className="text-stone-500">Input: <span className="text-[#162A43]">{ex.input}</span></div>
                    <div className="text-stone-500 mt-1">Output: <span className="text-emerald-700 font-bold">{ex.output}</span></div>
                    {ex.explanation && (
                      <div className="text-stone-500 font-sans text-[11px] mt-1.5 italic">{ex.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Outcomes / Diagnostics Panel */}
          {result && (
            <div className={`mt-4 p-4 rounded-xl border ${
              result.stagePassed ? "bg-emerald-50/50 border-emerald-300" : "bg-rose-50/50 border-rose-300"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {result.stagePassed ? "✓ Submission Verified Passed" : "✗ Submission Did Not Meet Threshold"}
                </span>
                <span className="text-xs font-bold">
                  Score: {result.percentageScore}% (Cutoff: {result.passingThreshold}%)
                </span>
              </div>
              <p className="text-xs text-stone-700 mb-2">{result.evaluatorFeedback}</p>
              {result.telemetry?.executionTimeMs && (
                <div className="text-[11px] text-stone-500 font-mono">
                  Execution Time: {result.telemetry.executionTimeMs}ms • Real Python 3 Sandbox
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right: Code Editor & Execution Actions */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#162A43]">Python 3 (Cpython 3.11)</span>
              <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                Sandboxed • CPU limit: 3000ms
              </span>
            </div>
            {existingAttempt && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                existingAttempt.status === "PASSED" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
              }`}>
                Previous Attempt: {existingAttempt.percentageScore}% ({existingAttempt.status})
              </span>
            )}
          </div>

          <div className="relative flex-1 min-h-[360px] bg-stone-900 rounded-xl overflow-hidden border border-stone-800 font-mono text-xs shadow-inner">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 bg-transparent text-emerald-400 font-mono text-xs resize-none focus:outline-none"
              placeholder="# Write your optimal Python solution here..."
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-between pt-4 mt-2">
            <button
              onClick={() => setCode(codingProblem?.starterCode?.python || "")}
              className="text-xs text-stone-500 hover:text-stone-800 underline"
            >
              Reset to Starter Code
            </button>
            <button
              onClick={handleRunAndSubmit}
              disabled={isRunning}
              className="px-6 py-2.5 bg-[#162A43] hover:bg-[#0F1E31] text-white font-medium text-xs rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Executing Sandboxed Test Suite...</span>
                </>
              ) : (
                <span>Run & Submit to Recruiter Pipeline →</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

