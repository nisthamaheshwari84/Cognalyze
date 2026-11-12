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
    <div className={`p-4 rounded-xl border text-xs leading-relaxed bg-[#FFFFFF] ${
      type === "why_advancing"
        ? "border-[#C8E4D3] text-[#17191C]"
        : "border-[#E4E1DA] text-[#17191C]"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E4E1DA]">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${descriptor.badgeClass}`}>
            {descriptor.glyph} {descriptor.label}
          </span>
          <span className="font-bold text-[#162A43] text-sm">{requirementName}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#667085] font-mono">
          {type === "why_advancing" ? "Supporting Evidence" : "Evaluation Context"}
        </span>
      </div>

      {/* Verbatim Evidence Quotes */}
      {verbatimQuotes.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] uppercase font-bold text-[#667085] block mb-1">CITED VERBATIM PROOF:</span>
          <div className="space-y-1.5">
            {verbatimQuotes.map((quote, idx) => (
              <blockquote
                key={idx}
                className="pl-3 border-l-2 border-[#356AE6] bg-[#EFF4FE] py-1.5 pr-2 rounded text-[#162A43] font-mono text-[11px]"
              >
                &ldquo;{quote}&rdquo;
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* Interpretation */}
      <div className="mt-3">
        <span className="text-[10px] uppercase font-bold text-[#667085] block mb-0.5">ESTABLISHED INTERPRETATION:</span>
        <p className="text-[#17191C]">{interpretation}</p>
      </div>

      {/* Remaining Uncertainty */}
      {remainingUncertainty && (
        <div className="mt-3 p-2.5 rounded bg-[#FEF7ED] border border-[#F8D8A7] text-[#B7791F]">
          <span className="text-[10px] uppercase font-bold text-[#B7791F] block mb-0.5">REMAINING UNCERTAINTY:</span>
          <p>{remainingUncertainty}</p>
        </div>
      )}

      {/* Proposed Validation */}
      {proposedValidation && (
        <div className="mt-3 p-2.5 rounded bg-[#EFF4FE] border border-[#D2E0FB] text-[#356AE6]">
          <span className="text-[10px] uppercase font-bold text-[#356AE6] block mb-0.5">RECOMMENDED VALIDATION:</span>
          <p>{proposedValidation}</p>
        </div>
      )}

      {/* Recruiter-Only Internal Notes (Strictly hidden from candidate view) */}
      {!isCandidateFacing && recruiterNotes && (
        <div className="mt-3 pt-2 border-t border-[#E4E1DA] text-[11px] text-[#667085]">
          <span className="font-semibold text-[#162A43]">Internal Recruiter Note: </span>
          <span>{recruiterNotes}</span>
        </div>
      )}
    </div>
  );
}
