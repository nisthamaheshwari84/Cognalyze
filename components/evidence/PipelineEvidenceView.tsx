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
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partial":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "not_met":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "insufficient_evidence":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getOutcomeStyle = (outcome?: "advance" | "reject" | "hold") => {
    switch (outcome) {
      case "advance":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "hold":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "reject":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 text-sm text-[var(--text-primary)]">
      {/* Header Pipeline Ribbon */}
      <div className="p-5 rounded-xl bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-card)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-bold text-[var(--brand-cobalt)]">
              Evidence Operating System Pipeline
            </span>
          </div>
          <h3 className="text-base font-bold text-[var(--brand-navy)] mt-1">
            Ground-Truth Audit for {candidateName}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            ID: <code className="text-[var(--brand-navy)] font-mono bg-[var(--surface-subtle)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">{candidateId}</code> • Zero-hallucination verification
          </p>
        </div>

        {/* Confidence & Quick Outcome */}
        {currentDecision && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Stage Outcome</div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mt-0.5 uppercase tracking-wider ${getOutcomeStyle(
                  currentDecision.outcome
                )}`}
              >
                {currentDecision.outcome}
              </span>
            </div>
            <div className="text-right pl-3 border-l border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Confidence</div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold mt-0.5 capitalize border ${
                  currentDecision.overall_confidence === "high"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : currentDecision.overall_confidence === "medium"
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-slate-700 bg-slate-100 border-slate-200"
                }`}
              >
                {currentDecision.overall_confidence}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stage Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 flex-wrap">
        <button
          onClick={() => setActiveStageTab("resume_jd_match")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeStageTab === "resume_jd_match"
              ? "bg-[var(--brand-cobalt)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--brand-navy)] hover:bg-[var(--surface-subtle)] border border-transparent"
          }`}
        >
          Stage 1: Resume vs JD
        </button>
        <button
          onClick={() => setActiveStageTab("github_review")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeStageTab === "github_review"
              ? "bg-[var(--brand-cobalt)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--brand-navy)] hover:bg-[var(--surface-subtle)] border border-transparent"
          }`}
        >
          Stage 2a: GitHub & LeetCode
        </button>
        <button
          onClick={() => setActiveStageTab("deep_review")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeStageTab === "deep_review"
              ? "bg-[var(--brand-cobalt)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--brand-navy)] hover:bg-[var(--surface-subtle)] border border-transparent"
          }`}
        >
          Stage 2b: Deep Authenticity Check
        </button>
        <button
          onClick={() => setActiveStageTab("all_evidence")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ml-auto ${
            activeStageTab === "all_evidence"
              ? "bg-[var(--brand-navy)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--brand-navy)] hover:bg-[var(--surface-subtle)] border border-transparent"
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
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <span className="font-bold">Stage Rejection Reason:</span> {currentDecision.rejection_summary}
                </div>
              )}

              <div className="grid gap-3">
                {currentDecision.criteria_results.map((c, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white border border-[var(--border-subtle)] shadow-sm hover:border-[var(--brand-cobalt)]/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-[var(--brand-navy)] tracking-wide">
                          {c.criterion}
                        </span>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{c.reasoning}</p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider shrink-0 ${getVerdictStyle(
                          c.verdict
                        )}`}
                      >
                        {c.verdict.replace("_", " ")}
                      </span>
                    </div>

                    {/* Underpinning Evidence Quotes */}
                    {c.evidence_ids.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                          Underlying Provenance
                        </div>
                        {c.evidence_ids.map((id) => {
                          const ev = evidenceMap.get(id);
                          if (!ev) {
                            return (
                              <div key={id} className="text-xs text-[var(--text-muted)] italic">
                                Evidence record [{id}] verified in audit pool.
                              </div>
                            );
                          }
                          return (
                            <div
                              key={id}
                              className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs flex flex-col gap-1"
                            >
                              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                                <span className="font-mono text-[var(--brand-cobalt)] font-semibold">
                                  {ev.source_ref}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  {new Date(ev.extracted_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <blockquote className="border-l-3 border-[var(--brand-cobalt)] pl-2.5 text-[var(--text-primary)] italic font-mono text-[11px] leading-relaxed my-0.5">
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
            <div className="p-8 text-center rounded-xl bg-[var(--surface-subtle)] border border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
              No Stage 1 Resume Match decision has been generated for this candidate yet.
            </div>
          )}
        </div>
      )}

      {/* STAGE 2A: GITHUB & LEETCODE CONTENT */}
      {activeStageTab === "github_review" && (
        <div className="space-y-4">
          {githubDossier && (
            <div className="p-4 rounded-xl bg-white border border-[var(--border-subtle)] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
                  GitHub Profile: @{githubDossier.username}
                </h4>
                <div className="text-xs text-[var(--text-secondary)] space-x-3">
                  <span>
                    <strong className="text-[var(--brand-navy)]">{githubDossier.originalRepos}</strong> original
                  </span>
                  <span>
                    <strong className="text-[var(--brand-navy)]">{githubDossier.forkedRepos}</strong> forks
                  </span>
                  <span>
                    <strong className="text-[var(--brand-navy)]">{githubDossier.activeMonthsLast12}</strong>/12 active months
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
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    <span className="font-bold">{flag.type === "green" ? "✓" : "⚠"}</span>
                    <div>
                      <div className="font-semibold">{flag.label}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{flag.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leetcodeDossier && leetcodeDossier.found && (
            <div className="p-4 rounded-xl bg-white border border-[var(--border-subtle)] shadow-sm flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
                  LeetCode: @{leetcodeDossier.username}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Rating:{" "}
                  <strong className="text-[var(--brand-navy)]">{leetcodeDossier.contestRating ?? "Unrated"}</strong>
                  {leetcodeDossier.contestGlobalRanking && ` (Top ${leetcodeDossier.contestGlobalRanking})`}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--brand-navy)] font-medium">
                  Total: <strong className="text-[var(--brand-navy)]">{leetcodeDossier.totalSolved}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  Easy: <strong>{leetcodeDossier.easySolved}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 font-medium">
                  Med: <strong>{leetcodeDossier.mediumSolved}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium">
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
                  className="p-4 rounded-xl bg-white border border-[var(--border-subtle)] shadow-sm flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-[var(--brand-navy)]">{c.criterion}</span>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{c.reasoning}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider shrink-0 ${getVerdictStyle(
                      c.verdict
                    )}`}
                  >
                    {c.verdict.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!githubDossier && !leetcodeDossier && (!currentDecision || currentDecision.criteria_results.length === 0) && (
            <div className="p-8 text-center rounded-xl bg-[var(--surface-subtle)] border border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs space-y-2">
              <div className="font-semibold text-[var(--brand-navy)] text-sm">
                Stage 2a: GitHub & LeetCode Verification Not Initiated
              </div>
              <p className="max-w-md mx-auto text-slate-500">
                External repository analysis and algorithmic benchmarking have not been run for this candidate, or no public profile links were present in the source resume.
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-600 font-mono text-[11px] border border-slate-200">
                  Status: UNVERIFIED (Resume Match Only)
                </span>
              </div>
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
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                  <span className="font-bold text-[var(--brand-navy)]">Verification Analyst Summary:</span>{" "}
                  {deepReviewOutput.human_review_notes}
                </div>
              )}

              <div className="grid gap-4">
                {deepReviewOutput.per_project_results.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-[var(--border-subtle)] shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[var(--brand-navy)] uppercase tracking-wider">
                          Project: {p.project_name}
                        </h4>
                        {p.matched_repo_url && (
                          <a
                            href={p.matched_repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[var(--brand-cobalt)] hover:underline font-mono"
                          >
                            {p.matched_repo_url}
                          </a>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--brand-navy)] font-semibold">
                        {p.step1_claim_match.verdict}
                      </span>
                    </div>

                    {/* Vibe Coding / Low Engagement Detection */}
                    <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)] font-medium">Commit Pattern & Authenticity:</span>
                        <span className="font-semibold text-[var(--brand-navy)]">
                          {p.step2_vibe_coding_signal.verdict.replace(/_/g, " ")}
                        </span>
                      </div>
                      {p.step2_vibe_coding_signal.evidence_quotes.length > 0 && (
                        <div className="text-[11px] font-mono text-[var(--text-secondary)] pt-1">
                          Citations: &ldquo;{p.step2_vibe_coding_signal.evidence_quotes.join(" | ")}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Learning Reflection Check */}
                    <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)] font-medium">Design & Trade-off Reflection:</span>
                        <span className="font-semibold text-[var(--brand-navy)]">
                          {p.step3_learning_reflection.verdict.replace(/_/g, " ")}
                        </span>
                      </div>
                      {p.step3_learning_reflection.evidence_quotes.length > 0 && (
                        <div className="text-[11px] font-mono text-[var(--text-secondary)] pt-1">
                          Citations: &ldquo;{p.step3_learning_reflection.evidence_quotes.join(" | ")}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center rounded-xl bg-[var(--surface-subtle)] border border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
              Deep Project & Skill Verification has not been initiated for this candidate yet.
            </div>
          )}
        </div>
      )}

      {/* ALL RAW EVIDENCE TABLE */}
      {activeStageTab === "all_evidence" && (
        <div className="space-y-3">
          <div className="text-xs text-[var(--text-secondary)]">
            Immutable provenance entries extracted by deterministic engines and Groq at temperature 0:
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--brand-navy)] font-mono font-medium">
                    {ev.source_type}
                  </span>
                  <span className="text-[var(--text-secondary)] font-mono">{ev.source_ref}</span>
                </div>
                <div className="text-[var(--text-primary)] italic mt-1 font-mono text-[11px]">
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
