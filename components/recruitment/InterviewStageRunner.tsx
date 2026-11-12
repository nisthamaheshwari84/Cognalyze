"use client";

import React, { useState, useEffect } from "react";
import { BlueprintStageDefinition, StudentRecruitmentJourney } from "@/lib/recruitment/types";
import { generateStageInterviewConfig, evaluateInterviewResponse, StageInterviewConfig } from "@/lib/recruitment/interview-adapter";

interface InterviewStageRunnerProps {
  stage: BlueprintStageDefinition;
  journey: StudentRecruitmentJourney;
  onAttemptSubmitted: (updatedJourney: StudentRecruitmentJourney) => void;
}

export default function InterviewStageRunner({
  stage,
  journey,
  onAttemptSubmitted,
}: InterviewStageRunnerProps) {
  const [interviewConfig, setInterviewConfig] = useState<StageInterviewConfig | null>(null);
  const [responseContent, setResponseContent] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const config = generateStageInterviewConfig(journey.companyId, stage, "Candidate");
    setInterviewConfig(config);
  }, [journey.companyId, stage]);

  const handleSubmit = async () => {
    if (!responseContent.trim()) return;
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const evalResult = evaluateInterviewResponse(responseContent, stage.targetCompetencies);
      setEvaluation(evalResult);

      const journeyRes = await fetch(`/api/recruitment/journeys/${journey.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          rawScore: evalResult.score,
          maxScore: 100,
          durationSeconds: 300,
          telemetry: { starBreakdown: evalResult.starBreakdown },
          rubricEvaluations: {
            behavioral_competency: evalResult.score,
            communication_clarity: evalResult.starBreakdown.resultPresent ? 90 : 70,
          },
          evaluatorFeedback: `STAR Structure: ${evalResult.strengths.join(" ")}`,
        }),
      });

      const journeyData = await journeyRes.json();
      if (journeyData.success) {
        onAttemptSubmitted(journeyData.updatedJourney);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit interview response.");
    } finally {
      setIsRunning(false);
    }
  };

  if (!interviewConfig) return null;

  return (
    <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#E4E1DA] gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
              {interviewConfig.interviewerRole}
            </span>
            <span className="text-xs text-stone-500">
              STAR Behavioral & Technical Probe • Passing Cutoff: {stage.passingThresholdScore || 70}%
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#162A43]">{stage.title}</h3>
        </div>
      </div>

      {/* Interviewer Persona Card & Opening Question */}
      <div className="mb-6 p-5 bg-gradient-to-br from-stone-50 to-stone-100/60 border border-stone-200 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#162A43] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {journey.companyId.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-bold text-[#162A43]">{interviewConfig.interviewerRole}</div>
            <div className="text-[11px] text-stone-500">{interviewConfig.companyName} Engineering Interview Panel</div>
          </div>
        </div>

        <p className="text-sm font-medium text-stone-800 leading-relaxed bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          "{interviewConfig.openingQuestion}"
        </p>

        {interviewConfig.sampleProbingQuestions.length > 0 && (
          <div className="mt-3 text-[11px] text-stone-500 flex items-center gap-1.5">
            <span className="font-semibold text-stone-600">Probing Focus:</span>
            <span>{interviewConfig.focusCompetencies.join(", ").replace(/_/g, " ")}</span>
          </div>
        )}
      </div>

      {/* Candidate Response Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#162A43] uppercase tracking-wider">
            Your Response (Use STAR Framework: Situation, Task, Action, Result)
          </label>
          <span className="text-[11px] text-stone-400">
            {responseContent.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        <textarea
          value={responseContent}
          onChange={(e) => setResponseContent(e.target.value)}
          rows={6}
          className="w-full p-4 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] leading-relaxed"
          placeholder="Structure your answer clearly:
1. Situation: Describe the technical context and project challenge.
2. Task: What were you specifically responsible for solving?
3. Action: Detail your concrete technical decisions, code, and implementation.
4. Result: Share the measurable outcome and architectural impact..."
        />
      </div>

      {/* STAR Telemetry Diagnostics */}
      {evaluation && (
        <div className="mt-6 p-4 rounded-xl border border-stone-200 bg-stone-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#162A43] uppercase tracking-wider">
              STAR Method Diagnostic Telemetry
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              evaluation.score >= 70 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}>
              Score: {evaluation.score}%
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Situation", present: evaluation.starBreakdown.situationPresent },
              { label: "Task", present: evaluation.starBreakdown.taskPresent },
              { label: "Action", present: evaluation.starBreakdown.actionPresent },
              { label: "Result", present: evaluation.starBreakdown.resultPresent },
            ].map((s, i) => (
              <div key={i} className={`p-2 rounded-lg border text-center text-[11px] ${
                s.present ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" : "bg-white border-stone-200 text-stone-400"
              }`}>
                {s.present ? "✓" : "○"} {s.label}
              </div>
            ))}
          </div>

          {evaluation.strengths.length > 0 && (
            <div className="text-xs text-emerald-800 mb-1">
              <span className="font-bold">Strengths:</span> {evaluation.strengths.join(" ")}
            </div>
          )}

          {evaluation.growthAreas.length > 0 && (
            <div className="text-xs text-amber-800">
              <span className="font-bold">Refinement Tip:</span> {evaluation.growthAreas.join(" ")}
            </div>
          )}
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
          disabled={isRunning || !responseContent.trim()}
          className="px-6 py-2.5 bg-[#162A43] hover:bg-[#0F1E31] text-white font-medium text-xs rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          {isRunning ? "Evaluating STAR Telemetry..." : "Submit Response to Interviewer →"}
        </button>
      </div>
    </div>
  );
}

