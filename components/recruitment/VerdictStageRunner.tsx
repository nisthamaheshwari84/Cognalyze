"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BlueprintStageDefinition, StudentRecruitmentJourney } from "@/lib/recruitment/types";
import { getRemediationTopicsForWeaknesses } from "@/lib/recruitment/remediation-map";
import { getCompanyById } from "@/lib/recruitment/company-registry";

interface VerdictStageRunnerProps {
  stage: BlueprintStageDefinition;
  journey: StudentRecruitmentJourney;
  onAttemptSubmitted: (updatedJourney: StudentRecruitmentJourney) => void;
}

export default function VerdictStageRunner({
  stage,
  journey,
  onAttemptSubmitted,
}: VerdictStageRunnerProps) {
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [dnaSyncStatus, setDnaSyncStatus] = useState<string | null>(null);

  const company = getCompanyById(journey.companyId);
  const companyName = company ? company.name : journey.companyId.toUpperCase();

  const weakCompetencies = Object.entries(journey.competencyScores)
    .filter(([_, score]) => score < 75)
    .map(([comp]) => comp);

  const remediationTopics = getRemediationTopicsForWeaknesses(weakCompetencies);

  const isOffer = journey.status === "OFFER_EXTENDED" || journey.overallScore >= 75;

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const journeyRes = await fetch(`/api/recruitment/journeys/${journey.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          rawScore: journey.overallScore,
          maxScore: 100,
          durationSeconds: 60,
          telemetry: { committeeVerdict: isOffer ? "OFFER_EXTENDED" : "DID_NOT_PASS" },
          rubricEvaluations: journey.competencyScores,
          evaluatorFeedback: isOffer
            ? `Consensus Offer extended for ${companyName} ${journey.roleFamily.toUpperCase()}.`
            : `Did not meet final leveling threshold for ${companyName}.`,
        }),
      });

      const data = await journeyRes.json();
      if (data.success) {
        onAttemptSubmitted(data.updatedJourney);
        setDnaSyncStatus("Verified dossier synced to Student DNA.");
      }
    } catch (err: any) {
      console.error("Failed to finalize verdict:", err);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm">
      <div className="text-center max-w-xl mx-auto py-6">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm ${
          isOffer ? "bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50" : "bg-stone-100 text-stone-700 ring-8 ring-stone-50"
        }`}>
          {isOffer ? "🏆" : "📋"}
        </div>

        <span className="text-xs font-semibold text-[#356AE6] uppercase tracking-wider block mb-1">
          Hiring Committee Consensus
        </span>

        <h3 className="text-2xl font-bold text-[#162A43] mb-2">
          {isOffer ? `Offer Extended: ${companyName} ${journey.roleFamily.toUpperCase()}` : `Review Completed: ${companyName}`}
        </h3>

        <p className="text-sm text-stone-600 mb-6">
          {isOffer
            ? `Congratulations! You have demonstrated verified technical excellence across all rounds of the ${companyName} hiring bar.`
            : `You have completed all assessment rounds. Review your dimensional breakdown and remediate identified skill gaps below.`}
        </p>

        {/* Journey Score Box */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl mb-6 flex items-center justify-around">
          <div>
            <span className="text-xs text-stone-500 block">Overall Score</span>
            <span className="text-2xl font-black text-[#162A43]">{journey.overallScore}%</span>
          </div>
          <div className="h-8 w-px bg-stone-200" />
          <div>
            <span className="text-xs text-stone-500 block">Status</span>
            <span className={`text-sm font-bold ${isOffer ? "text-emerald-700" : "text-stone-700"}`}>
              {journey.status.replace(/_/g, " ")}
            </span>
          </div>
          <div className="h-8 w-px bg-stone-200" />
          <div>
            <span className="text-xs text-stone-500 block">Evidence Integrity</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              Verified Sandboxed
            </span>
          </div>
        </div>

        {/* Competency Scores Breakdown */}
        {Object.keys(journey.competencyScores).length > 0 && (
          <div className="text-left mb-6">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-3">
              Dimensional Competency Evaluation
            </span>
            <div className="space-y-2.5">
              {Object.entries(journey.competencyScores).map(([comp, score]) => (
                <div key={comp} className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-800 capitalize">{comp.replace(/_/g, " ")}</span>
                    <span className="font-bold text-[#162A43]">{score}%</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 75 ? "bg-emerald-600" : score >= 60 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remediation Recommendations */}
        {remediationTopics.length > 0 && (
          <div className="text-left mb-6 p-5 bg-amber-50/60 border border-amber-200 rounded-xl">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block mb-1">
              Skill Remediation Pathways (Skill Practice Hub)
            </span>
            <p className="text-xs text-amber-800 mb-3">
              Targeted modules to close performance gaps before your next interview cycle:
            </p>
            <div className="space-y-2">
              {remediationTopics.map((topic, i) => (
                <div key={i} className="p-3 bg-white border border-amber-200 rounded-lg flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#162A43]">{topic.topicTitle}</div>
                    <div className="text-[11px] text-stone-500">{topic.reason}</div>
                  </div>
                  <Link
                    href={topic.practiceUrl}
                    className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-md whitespace-nowrap transition"
                  >
                    Practice Now →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {dnaSyncStatus && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium">
            ✓ {dnaSyncStatus}
          </div>
        )}

        <button
          onClick={handleFinalize}
          disabled={isFinalizing}
          className="w-full sm:w-auto px-8 py-3 bg-[#162A43] hover:bg-[#0F1E31] text-white font-medium text-xs rounded-xl shadow-sm transition disabled:opacity-50"
        >
          {isFinalizing ? "Recording Official Verdict..." : "Confirm & Finalize Placement Record"}
        </button>
      </div>
    </div>
  );
}

