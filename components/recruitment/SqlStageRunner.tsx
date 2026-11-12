"use client";

import React, { useState } from "react";
import { BlueprintStageDefinition, StudentRecruitmentJourney } from "@/lib/recruitment/types";
import { SqlAssessmentProblem } from "@/lib/recruitment/assessment-types";

interface SqlStageRunnerProps {
  stage: BlueprintStageDefinition;
  journey: StudentRecruitmentJourney;
  sqlProblem?: SqlAssessmentProblem;
  onAttemptSubmitted: (updatedJourney: StudentRecruitmentJourney) => void;
}

export default function SqlStageRunner({
  stage,
  journey,
  sqlProblem,
  onAttemptSubmitted,
}: SqlStageRunnerProps) {
  const [sql, setSql] = useState(
    sqlProblem?.starterSql ||
      `-- Write your production SQL query here\nSELECT * FROM users;\n`
  );
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const existingAttempt = journey.stageProgress[stage.id];

  const handleRunAndSubmit = async () => {
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const evalRes = await fetch("/api/recruitment/assessments/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          submissionData: { sqlQuery: sql },
        }),
      });

      const evalData = await evalRes.json();
      if (!evalData.success) {
        throw new Error(evalData.error || "SQL Evaluation failed");
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
          durationSeconds: evaluation.telemetry?.executionTimeMs ? Math.round(evaluation.telemetry.executionTimeMs / 1000) : 30,
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
      setErrorMsg(err.message || "Failed to execute SQL submission.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Problem & Schema */}
        <div className="lg:w-1/2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                SQL Lab (In-Memory SQLite)
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {sqlProblem?.difficulty || "MEDIUM"}
              </span>
              <span className="text-xs text-stone-400">• Passing Cutoff: {stage.passingThresholdScore || 70}%</span>
            </div>

            <h3 className="text-xl font-bold text-[#162A43] mb-3">
              {sqlProblem?.title || stage.title}
            </h3>

            <div className="prose prose-sm text-stone-700 max-w-none mb-4 whitespace-pre-line leading-relaxed">
              {sqlProblem?.descriptionMarkdown || stage.instructions}
            </div>

            {sqlProblem?.schemaDocumentation && (
              <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
                  Relational Schema Definition
                </span>
                <pre className="text-xs font-mono text-stone-700 whitespace-pre-wrap">
                  {sqlProblem.schemaDocumentation}
                </pre>
              </div>
            )}
          </div>

          {result && (
            <div className={`mt-4 p-4 rounded-xl border ${
              result.stagePassed ? "bg-emerald-50/50 border-emerald-300" : "bg-rose-50/50 border-rose-300"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {result.stagePassed ? "✓ SQL Query Verified & Passed" : "✗ Query Failed Validation"}
                </span>
                <span className="text-xs font-bold">Score: {result.percentageScore}%</span>
              </div>
              <p className="text-xs text-stone-700 mb-2">{result.evaluatorFeedback}</p>
              {result.telemetry?.userRowCount !== undefined && (
                <div className="text-[11px] text-stone-500 font-mono">
                  Returned {result.telemetry.userRowCount} rows in {result.telemetry.executionTimeMs}ms
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

        {/* Right: SQL Editor */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#162A43]">SQL Query Runner (ANSI / SQLite)</span>
              <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                Live Query Execution
              </span>
            </div>
            {existingAttempt && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Score: {existingAttempt.percentageScore}%
              </span>
            )}
          </div>

          <div className="relative flex-1 min-h-[340px] bg-stone-900 rounded-xl overflow-hidden border border-stone-800 font-mono text-xs shadow-inner">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="w-full h-full p-4 bg-transparent text-emerald-400 font-mono text-xs resize-none focus:outline-none"
              placeholder="-- Write your SQL query here..."
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-between pt-4 mt-2">
            <button
              onClick={() => setSql(sqlProblem?.starterSql || "")}
              className="text-xs text-stone-500 hover:text-stone-800 underline"
            >
              Reset Starter Query
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
                  <span>Running Live Query...</span>
                </>
              ) : (
                <span>Execute & Verify SQL →</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

