"use client";

import React, { useState } from "react";
import { CandidateDecision, Evidence, CriterionVerdict } from "@/lib/evidence/types";
import { DeepReviewOutput } from "@/lib/evidence/deep-review-agent";
import { GithubEvidenceDossier } from "@/lib/evidence/github-agent";
import { LeetcodeEvidenceDossier } from "@/lib/evidence/leetcode-agent";

interface PipelineEvidenceViewProps {
  candidateId: string;
  candidateName: string;
  decisions?: CandidateDecision[];
  evidenceList?: Evidence[];
  deepReviewOutput?: DeepReviewOutput | null;
  githubDossier?: GithubEvidenceDossier | null;
  leetcodeDossier?: LeetcodeEvidenceDossier | null;
  onRefresh?: () => void;
}

export default function PipelineEvidenceView({
  candidateId,
  candidateName,
  decisions = [],
  evidenceList = [],
  deepReviewOutput,
  githubDossier,
  leetcodeDossier,
  onRefresh,
}: PipelineEvidenceViewProps) {
  const [activeStageTab, setActiveStageTab] = useState<
    "resume_jd_match" | "github_review" | "deep_review" | "all_evidence"
  >("resume_jd_match");

  // Lookup evidence map by ID
  const evidenceMap = React.useMemo(() => {
    const map = new Map<string, Evidence>();
    for (const ev of evidenceList) {
      map.set(ev.id, ev);
    }
    return map;
  }, [evidenceList]);

  // Find decision for currently selected stage
  const currentDecision = decisions.find((d) => d.stage === activeStageTab);

  const getVerdictStyle = (verdict: CriterionVerdict) => {
    switch (verdict) {
      case "met":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "partial":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "not_met":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "insufficient_evidence":
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getOutcomeStyle = (outcome?: "advance" | "reject" | "hold") => {
    switch (outcome) {
      case "advance":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "hold":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "reject":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  return (
    <div className="space-y-6 text-sm text-slate-200">
      {/* Header Pipeline Ribbon */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-850 to-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Evidence Operating System Pipeline
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">
            Ground-Truth Audit for {candidateName}
          </h3>
          <p className="text-xs text-slate-400">
            ID: <code className="text-slate-300">{candidateId}</code> • Zero-hallucination verification
          </p>
        </div>

        {/* Confidence & Quick Outcome */}
        {currentDecision && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Stage Outcome</div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mt-0.5 uppercase tracking-wider ${getOutcomeStyle(
                  currentDecision.outcome
                )}`}
              >
                {currentDecision.outcome}
              </span>
            </div>
            <div className="text-right pl-3 border-l border-slate-700">
              <div className="text-[10px] uppercase font-bold text-slate-400">Confidence</div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold mt-0.5 capitalize ${
                  currentDecision.overall_confidence === "high"
                    ? "text-emerald-400 bg-emerald-950/60"
                    : currentDecision.overall_confidence === "medium"
                    ? "text-amber-400 bg-amber-950/60"
                    : "text-slate-400 bg-slate-800"
                }`}
              >
                {currentDecision.overall_confidence}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stage Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveStageTab("resume_jd_match")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeStageTab === "resume_jd_match"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          Stage 1: Resume vs JD
        </button>
        <button
          onClick={() => setActiveStageTab("github_review")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeStageTab === "github_review"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          Stage 2a: GitHub & LeetCode
        </button>
        <button
          onClick={() => setActiveStageTab("deep_review")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeStageTab === "deep_review"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          Stage 2b: Deep Authenticity Check
        </button>
        <button
          onClick={() => setActiveStageTab("all_evidence")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ml-auto ${
            activeStageTab === "all_evidence"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          All Raw Evidence ({evidenceList.length})
        </button>
      </div>

      {/* STAGE 1: RESUME MATCH CONTENT */}
      {activeStageTab === "resume_jd_match" && (
        <div className="space-y-4">
          {currentDecision ? (
            <>
              {currentDecision.rejection_summary && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                  <span className="font-bold">Stage Rejection Reason:</span> {currentDecision.rejection_summary}
                </div>
              )}

              <div className="grid gap-3">
                {currentDecision.criteria_results.map((c, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-white tracking-wide">
                          {c.criterion}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">{c.reasoning}</p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-medium border uppercase tracking-wider shrink-0 ${getVerdictStyle(
                          c.verdict
                        )}`}
                      >
                        {c.verdict.replace("_", " ")}
                      </span>
                    </div>

                    {/* Underpinning Evidence Quotes */}
                    {c.evidence_ids.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Underlying Provenance
                        </div>
                        {c.evidence_ids.map((id) => {
                          const ev = evidenceMap.get(id);
                          if (!ev) {
                            return (
                              <div key={id} className="text-xs text-slate-500 italic">
                                Evidence record [{id}] verified in audit pool.
                              </div>
                            );
                          }
                          return (
                            <div
                              key={id}
                              className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex flex-col gap-1"
                            >
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="font-mono text-indigo-400 font-medium">
                                  {ev.source_ref}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(ev.extracted_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <blockquote className="border-l-2 border-indigo-500 pl-2 text-slate-200 italic font-mono text-[11px] leading-relaxed">
                                &ldquo;{ev.quote_or_fact}&rdquo;
                              </blockquote>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 text-xs">
              No Stage 1 Resume Match decision has been generated for this candidate yet.
            </div>
          )}
        </div>
      )}

      {/* STAGE 2A: GITHUB & LEETCODE CONTENT */}
      {activeStageTab === "github_review" && (
        <div className="space-y-4">
          {githubDossier && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  GitHub Profile: @{githubDossier.username}
                </h4>
                <div className="text-xs text-slate-400 space-x-3">
                  <span>
                    <strong className="text-white">{githubDossier.originalRepos}</strong> original
                  </span>
                  <span>
                    <strong className="text-white">{githubDossier.forkedRepos}</strong> forks
                  </span>
                  <span>
                    <strong className="text-white">{githubDossier.activeMonthsLast12}</strong>/12 active months
                  </span>
                </div>
              </div>

              {/* Flags */}
              <div className="grid sm:grid-cols-2 gap-2 pt-2">
                {githubDossier.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                      flag.type === "green"
                        ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                        : "bg-rose-950/20 border-rose-800/40 text-rose-300"
                    }`}
                  >
                    <span className="font-bold">{flag.type === "green" ? "✓" : "⚠"}</span>
                    <div>
                      <div className="font-semibold">{flag.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{flag.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leetcodeDossier && leetcodeDossier.found && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  LeetCode: @{leetcodeDossier.username}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rating:{" "}
                  <strong className="text-white">{leetcodeDossier.contestRating ?? "Unrated"}</strong>
                  {leetcodeDossier.contestGlobalRanking && ` (Top ${leetcodeDossier.contestGlobalRanking})`}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200">
                  Total: <strong className="text-white">{leetcodeDossier.totalSolved}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300">
                  Easy: <strong>{leetcodeDossier.easySolved}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-950/60 text-amber-300">
                  Med: <strong>{leetcodeDossier.mediumSolved}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-rose-950/60 text-rose-300">
                  Hard: <strong>{leetcodeDossier.hardSolved}</strong>
                </span>
              </div>
            </div>
          )}

          {currentDecision && (
            <div className="grid gap-3 pt-2">
              {currentDecision.criteria_results.map((c, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-semibold text-white">{c.criterion}</span>
                    <p className="text-xs text-slate-400 mt-1">{c.reasoning}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-medium border uppercase tracking-wider shrink-0 ${getVerdictStyle(
                      c.verdict
                    )}`}
                  >
                    {c.verdict.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STAGE 2B: DEEP REVIEW CONTENT */}
      {activeStageTab === "deep_review" && (
        <div className="space-y-4">
          {deepReviewOutput ? (
            <>
              {deepReviewOutput.human_review_notes && (
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200">
                  <span className="font-bold text-indigo-300">Verification Analyst Summary:</span>{" "}
                  {deepReviewOutput.human_review_notes}
                </div>
              )}

              <div className="grid gap-4">
                {deepReviewOutput.per_project_results.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Project: {p.project_name}
                        </h4>
                        {p.matched_repo_url && (
                          <a
                            href={p.matched_repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-indigo-400 hover:underline font-mono"
                          >
                            {p.matched_repo_url}
                          </a>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {p.step1_claim_match.verdict}
                      </span>
                    </div>

                    {/* Vibe Coding / Low Engagement Detection */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Commit Pattern & Authenticity:</span>
                        <span className="font-semibold text-slate-200">
                          {p.step2_vibe_coding_signal.verdict.replace(/_/g, " ")}
                        </span>
                      </div>
                      {p.step2_vibe_coding_signal.evidence_quotes.length > 0 && (
                        <div className="text-[11px] font-mono text-slate-400 pt-1">
                          Citations: &ldquo;{p.step2_vibe_coding_signal.evidence_quotes.join(" | ")}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Learning Reflection Check */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Design & Trade-off Reflection:</span>
                        <span className="font-semibold text-slate-200">
                          {p.step3_learning_reflection.verdict.replace(/_/g, " ")}
                        </span>
                      </div>
                      {p.step3_learning_reflection.evidence_quotes.length > 0 && (
                        <div className="text-[11px] font-mono text-slate-400 pt-1">
                          Citations: &ldquo;{p.step3_learning_reflection.evidence_quotes.join(" | ")}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 text-xs">
              Deep Project & Skill Verification has not been initiated for this candidate yet.
            </div>
          )}
        </div>
      )}

      {/* ALL RAW EVIDENCE TABLE */}
      {activeStageTab === "all_evidence" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Immutable provenance entries extracted by deterministic engines and Groq at temperature 0:
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-850 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {ev.source_type}
                  </span>
                  <span className="text-slate-500 font-mono">{ev.source_ref}</span>
                </div>
                <div className="text-slate-200 italic mt-1 font-mono text-[11px]">
                  &ldquo;{ev.quote_or_fact}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
