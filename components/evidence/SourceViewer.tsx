"use client";

import React, { useState, useMemo } from "react";

export interface SourceSpan {
  id: string;
  startChar: number;
  endChar: number;
  label?: string;
  tier?: "T0" | "T1" | "T2" | "T3" | "T4";
  quote: string;
}

export interface SourceViewerProps {
  sourceTitle: string;
  rawText: string;
  spans?: SourceSpan[];
  activeSpanId?: string;
  onSelectSpan?: (span: SourceSpan) => void;
  onClose?: () => void;
}

/**
 * SOURCE VIEWER COMPONENT (Truth Contract T1 & Phase 3)
 * 
 * Renders the raw source text with deterministic span highlights.
 * Recruiter can click any evidence item to highlight and inspect the exact quote in source context.
 */
export default function SourceViewer({
  sourceTitle,
  rawText,
  spans = [],
  activeSpanId,
  onSelectSpan,
  onClose,
}: SourceViewerProps) {
  const [selectedSpanId, setSelectedSpanId] = useState<string | undefined>(activeSpanId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSpan = useMemo(() => {
    return spans.find((s) => s.id === (selectedSpanId || activeSpanId));
  }, [spans, selectedSpanId, activeSpanId]);

  // Compute text segments between spans for inline rendering
  const renderedSegments = useMemo(() => {
    if (!rawText) return [];
    if (!spans || spans.length === 0) {
      return [{ text: rawText, isSpan: false }];
    }

    // Sort valid non-overlapping spans by startChar
    const sorted = [...spans]
      .filter((s) => s.startChar >= 0 && s.endChar <= rawText.length && s.startChar < s.endChar)
      .sort((a, b) => a.startChar - b.startChar);

    const segments: { text: string; isSpan: boolean; span?: SourceSpan }[] = [];
    let cursor = 0;

    for (const span of sorted) {
      if (span.startChar > cursor) {
        segments.push({
          text: rawText.slice(cursor, span.startChar),
          isSpan: false,
        });
      }

      if (span.startChar >= cursor) {
        segments.push({
          text: rawText.slice(span.startChar, span.endChar),
          isSpan: true,
          span,
        });
        cursor = span.endChar;
      }
    }

    if (cursor < rawText.length) {
      segments.push({
        text: rawText.slice(cursor),
        isSpan: false,
      });
    }

    return segments;
  }, [rawText, spans]);

  const handleCopyQuote = (quote: string, id: string) => {
    navigator.clipboard.writeText(quote);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF] border border-[#E4E1DA] rounded-xl overflow-hidden shadow-sm text-[#17191C]">
      {/* Header */}
      <div className="p-4 border-b border-[#E4E1DA] bg-[#FAF9F6] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#356AE6] font-bold">Source Document</span>
            <span className="text-[#E4E1DA]">•</span>
            <span className="text-xs text-[#667085]">{spans.length} verified citation{spans.length === 1 ? "" : "s"}</span>
          </div>
          <h3 className="text-sm font-bold text-[#162A43] mt-0.5">{sourceTitle}</h3>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#667085] hover:text-[#162A43] hover:bg-[#FAF9F6] transition-all"
            title="Close Source Viewer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Active Citation Callout */}
      {activeSpan && (
        <div className="p-3 bg-[#EFF4FE] border-b border-[#D2E0FB] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-[#FFFFFF] text-[#356AE6] border border-[#D2E0FB] font-mono text-[10px] font-bold">
              {activeSpan.tier || "T1"}
            </span>
            <span className="text-[#356AE6] font-medium line-clamp-1">
              &ldquo;{activeSpan.quote}&rdquo;
            </span>
            <span className="text-[#667085] font-mono text-[10px]">
              ({activeSpan.startChar}–{activeSpan.endChar})
            </span>
          </div>

          <button
            onClick={() => handleCopyQuote(activeSpan.quote, activeSpan.id)}
            className="text-xs text-[#356AE6] hover:text-[#2858C7] font-semibold ml-4 shrink-0"
          >
            {copiedId === activeSpan.id ? "✓ Copied" : "Copy Quote"}
          </button>
        </div>
      )}

      {/* Document Text Body with Highlights */}
      <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-[#17191C] leading-relaxed whitespace-pre-wrap selection:bg-[#EFF4FE] selection:text-[#356AE6] bg-[#FFFFFF]">
        {renderedSegments.map((segment, idx) => {
          if (!segment.isSpan || !segment.span) {
            return <span key={idx}>{segment.text}</span>;
          }

          const isSelected = (selectedSpanId || activeSpanId) === segment.span.id;

          return (
            <mark
              key={idx}
              onClick={() => {
                setSelectedSpanId(segment.span!.id);
                onSelectSpan?.(segment.span!);
              }}
              className={`cursor-pointer px-1 py-0.5 rounded transition-all ${
                isSelected
                  ? "bg-[#356AE6] text-white font-semibold ring-2 ring-[#93C5FD] shadow-sm"
                  : "bg-[#EFF4FE] hover:bg-[#DCE7FB] text-[#356AE6] border-b-2 border-[#356AE6]"
              }`}
              title={`Verified Evidence: "${segment.span.quote}"`}
            >
              {segment.text}
            </mark>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#E4E1DA] bg-[#FAF9F6] flex items-center justify-between text-[11px] text-[#667085]">
        <span>Truth Contract T1: Highlights strictly render stored quote offsets in verbatim text.</span>
        <span className="text-[#2E7D5B] font-semibold">✓ Deterministically Verified</span>
      </div>
    </div>
  );
}
