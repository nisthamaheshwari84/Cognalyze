"use client";

import React from "react";
import { RequirementState, getRequirementStatusDescriptor } from "@/lib/copy/language";

export interface ExplainEvidenceProps {
  mode?: "recruiter" | "candidate";
  type: "why_advancing" | "why_not_advancing";
  requirementName: string;
  state: RequirementState;
  verbatimQuotes?: string[];
  interpretation: string;
  remainingUncertainty?: string;
  proposedValidation?: string;
  recruiterNotes?: string; // Hidden in candidate mode
}

/**
 * SHARED <Explain /> COMPONENT (PART 8)
 * 
 * Recruiter variant shows full internal context, evidence provenance, and uncertainty.
 * Candidate variant strictly hides internal notes and comparisons, delivering honest actionable guidance.
 */
export default function Explain({
  mode = "recruiter",
  type,
  requirementName,
  state,
  verbatimQuotes = [],
  interpretation,
  remainingUncertainty,
  proposedValidation,
  recruiterNotes,
}: ExplainEvidenceProps) {
  const isCandidateFacing = mode === "candidate";
  const descriptor = getRequirementStatusDescriptor(state);

  return (
    <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
      type === "why_advancing"
        ? "bg-slate-900/60 border-emerald-500/30 text-slate-200"
        : "bg-slate-900/60 border-slate-700 text-slate-300"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${descriptor.badgeClass}`}>
            {descriptor.glyph} {descriptor.label}
          </span>
          <span className="font-bold text-white text-sm">{requirementName}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
          {type === "why_advancing" ? "Supporting Evidence" : "Evaluation Context"}
        </span>
      </div>

      {/* Verbatim Evidence Quotes */}
      {verbatimQuotes.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">CITED VERBATIM PROOF:</span>
          <div className="space-y-1.5">
            {verbatimQuotes.map((quote, idx) => (
              <blockquote
                key={idx}
                className="pl-3 border-l-2 border-purple-500/60 bg-purple-950/20 py-1 pr-2 rounded text-slate-200 font-mono text-[11px]"
              >
                "{quote}"
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* Interpretation */}
      <div className="mt-3">
        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">ESTABLISHED INTERPRETATION:</span>
        <p className="text-slate-300">{interpretation}</p>
      </div>

      {/* Remaining Uncertainty */}
      {remainingUncertainty && (
        <div className="mt-3 p-2.5 rounded bg-amber-950/20 border border-amber-500/30 text-amber-200">
          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">REMAINING UNCERTAINTY:</span>
          <p>{remainingUncertainty}</p>
        </div>
      )}

      {/* Proposed Validation */}
      {proposedValidation && (
        <div className="mt-3 p-2.5 rounded bg-purple-950/20 border border-purple-500/30 text-purple-200">
          <span className="text-[10px] uppercase font-bold text-purple-400 block mb-0.5">RECOMMENDED VALIDATION:</span>
          <p>{proposedValidation}</p>
        </div>
      )}

      {/* Recruiter-Only Internal Notes (Strictly hidden from candidate view) */}
      {!isCandidateFacing && recruiterNotes && (
        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">Internal Recruiter Note: </span>
          <span>{recruiterNotes}</span>
        </div>
      )}
    </div>
  );
}
