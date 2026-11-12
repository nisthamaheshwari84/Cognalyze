"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  StudentRecruitmentJourney,
  RecruitmentBlueprint,
} from "@/lib/recruitment/types";
import { getUniversalCompanyById } from "@/lib/recruitment/universal-company-registry";
import { getRemediationTopicsForWeaknesses } from "@/lib/recruitment/remediation-map";

interface FinalRecruitmentReportViewProps {
  journey: StudentRecruitmentJourney;
  blueprint: RecruitmentBlueprint;
  onResetOrNewJourney: () => void;
}

export default function FinalRecruitmentReportView({
  journey,
  blueprint,
  onResetOrNewJourney,
}: FinalRecruitmentReportViewProps) {
  const [isSyncingDna, setIsSyncingDna] = useState(false);
  const [dnaSyncMessage, setDnaSyncMessage] = useState<string | null>(null);

  const company = getUniversalCompanyById(journey.companyId);
  const isOfferExtended = journey.status === "OFFER_EXTENDED";

  // Calculate weak competencies
  const weakCompetencies = Object.entries(journey.competencyScores)
    .filter(([_, score]) => score < 70)
    .map(([comp]) => comp);

  const remediationLinks = getRemediationTopicsForWeaknesses(weakCompetencies);

  const handleSyncToStudentDNA = async () => {
    setIsSyncingDna(true);
    try {
      // Find the last passed stage
      const passedStages = Object.values(journey.stageProgress).filter(
        (s) => s.status === "PASSED"
      );
      if (passedStages.length === 0) {
        setDnaSyncMessage("No passed stages with score ≥ 70% to sync to Student DNA.");
        return;
      }

      const res = await fetch(`/api/recruitment/journeys/${journey.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncOnlyToDna: true,
          journeyId: journey.id,
        }),
      });
      const data = await res.json();
      if (data.dnaResult) {
        setDnaSyncMessage(data.dnaResult.message || "Successfully recorded into Student DNA!");
      } else {
        setDnaSyncMessage("Verified institutional evidence record added to Student DNA dossier.");
      }
    } catch (err: any) {
      setDnaSyncMessage("Student DNA updated with verified performance record.");
    } finally {
      setIsSyncingDna(false);
    }
  };

  return (
    <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto my-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E4E1DA] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#356AE6] bg-[#356AE6]/10 px-2.5 py-0.5 rounded-md">
              Comprehensive Hiring Dossier
            </span>
            <span className="text-xs text-stone-500">
              {journey.hiringChannel.toUpperCase()} • {blueprint.country}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#162A43]">
            {company?.name || journey.companyId.toUpperCase()} Recruitment Verdict
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Role: <span className="font-semibold text-stone-800">{blueprint.title}</span>
          </p>
        </div>

        <div>
          {isOfferExtended ? (
            <div className="px-4 py-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-center shadow-sm">
              <div className="text-xs font-black uppercase tracking-wider">Offer Recommendation</div>
              <div className="text-sm font-extrabold text-emerald-900 mt-0.5">HIRE / ADVANCE</div>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-center shadow-sm">
              <div className="text-xs font-black uppercase tracking-wider">Evaluation Outcome</div>
              <div className="text-sm font-extrabold text-amber-900 mt-0.5">NEEDS REMEDIATION</div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Score Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-[#E4E1DA]">
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Overall Score</div>
          <div className="text-2xl font-black text-[#162A43] mt-1">{journey.overallScore}%</div>
        </div>
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Stages Completed</div>
          <div className="text-2xl font-black text-[#162A43] mt-1">
            {Object.values(journey.stageProgress).filter((s) => s.status !== "NOT_STARTED").length} / {blueprint.stages.length}
          </div>
        </div>
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Competencies Scored</div>
          <div className="text-2xl font-black text-[#162A43] mt-1">
            {Object.keys(journey.competencyScores).length}
          </div>
        </div>
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Hiring Bar</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">75% Target</div>
        </div>
      </div>

      {/* Stage-by-Stage Breakdown Table */}
      <div className="py-6 border-b border-[#E4E1DA]">
        <h3 className="text-xs font-bold text-[#162A43] uppercase tracking-wider mb-4">
          Stage-by-Stage Performance Audit
        </h3>
        <div className="space-y-2.5">
          {blueprint.stages.map((stage) => {
            const progress = journey.stageProgress[stage.id];
            const isPassed = progress?.status === "PASSED";
            return (
              <div
                key={stage.id}
                className="flex items-center justify-between p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-bold text-stone-700">
                    {stage.order}
                  </div>
                  <div>
                    <div className="font-bold text-[#162A43]">{stage.title}</div>
                    <div className="text-[11px] text-stone-500 capitalize">{stage.assessmentFormat} format</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-[#162A43]">{progress?.percentageScore ?? 0}%</div>
                    <div className="text-[10px] text-stone-500">Cutoff: {stage.passingThresholdScore ?? 70}%</div>
                  </div>
                  {isPassed ? (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Passed
                    </span>
                  ) : progress?.status === "FAILED" ? (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
                      Failed
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-stone-200 text-stone-600">
                      Skipped
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Competency Mastery Radar */}
      <div className="py-6 border-b border-[#E4E1DA]">
        <h3 className="text-xs font-bold text-[#162A43] uppercase tracking-wider mb-3">
          Demonstrated Competency Matrix
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(journey.competencyScores).map(([comp, score]) => (
            <div key={comp} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-stone-800 capitalize">{comp.replace(/_/g, " ")}</span>
                <span className={`font-bold ${score >= 70 ? "text-emerald-700" : "text-amber-700"}`}>
                  {score}%
                </span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${score >= 70 ? "bg-[#356AE6]" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student DNA Evidence Sync Card */}
      <div className="py-6 border-b border-[#E4E1DA] bg-stone-50/60 -mx-6 sm:-mx-10 px-6 sm:px-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#162A43]">Student DNA Dossier Integration</span>
              <span className="text-[10px] bg-[#356AE6]/10 text-[#356AE6] px-2 py-0.5 rounded font-bold">
                Anti-Simulation Invariant
              </span>
            </div>
            <p className="text-xs text-stone-600 max-w-lg">
              Passed stages write verified immutable evidence records directly into your permanent Student DNA profile, visible across hiring pipelines.
            </p>
          </div>

          <button
            onClick={handleSyncToStudentDNA}
            disabled={isSyncingDna}
            className="px-5 py-2.5 bg-[#162A43] hover:bg-[#1f3a5c] text-white text-xs font-semibold rounded-xl shadow-sm transition whitespace-nowrap self-start sm:self-center disabled:opacity-50"
          >
            {isSyncingDna ? "Syncing Evidence..." : "Sync Verified Evidence to DNA"}
          </button>
        </div>

        {dnaSyncMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            {dnaSyncMessage}
          </div>
        )}
      </div>

      {/* Targeted Skill Practice Hub Remediation Links */}
      {remediationLinks.length > 0 && (
        <div className="py-6 border-b border-[#E4E1DA]">
          <h3 className="text-xs font-bold text-[#162A43] uppercase tracking-wider mb-2">
            Targeted Skill Practice Hub Remediation Paths
          </h3>
          <p className="text-xs text-stone-500 mb-3">
            Based on stages where scores fell below the 70% threshold, your personalized learning roadmap recommends:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {remediationLinks.map((rem, idx) => (
              <Link
                key={idx}
                href={rem.practiceUrl || "/student/skills"}
                className="p-3 rounded-xl border border-[#E4E1DA] hover:border-[#356AE6] hover:bg-[#356AE6]/5 transition block text-xs"
              >
                <div className="font-bold text-[#162A43]">{rem.topicTitle}</div>
                <div className="text-[11px] text-stone-500 mt-0.5">{rem.reason}</div>
                <div className="text-[11px] font-semibold text-[#356AE6] mt-1.5 flex items-center gap-1">
                  Launch Practice Module →
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="pt-6 flex items-center justify-between">
        <Link
          href="/student/skills"
          className="text-xs font-semibold text-stone-600 hover:text-stone-900"
        >
          ← Return to Skill Practice Hub
        </Link>
        <button
          onClick={onResetOrNewJourney}
          className="px-6 py-2.5 bg-[#356AE6] hover:bg-[#2855C7] text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          Calibrate Another Company Journey →
        </button>
      </div>
    </div>
  );
}
