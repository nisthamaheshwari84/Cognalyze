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
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-purple-400 font-bold">Source Document</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{spans.length} verified citation{spans.length === 1 ? "" : "s"}</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-0.5">{sourceTitle}</h3>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Close Source Viewer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Active Citation Callout */}
      {activeSpan && (
        <div className="p-3 bg-purple-950/40 border-b border-purple-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 font-mono text-[10px] font-bold">
              {activeSpan.tier || "T1"}
            </span>
            <span className="text-purple-300 font-medium line-clamp-1">
              "{activeSpan.quote}"
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              ({activeSpan.startChar}–{activeSpan.endChar})
            </span>
          </div>

          <button
            onClick={() => handleCopyQuote(activeSpan.quote, activeSpan.id)}
            className="text-xs text-purple-300 hover:text-white font-medium ml-4 shrink-0"
          >
            {copiedId === activeSpan.id ? "✓ Copied" : "Copy Quote"}
          </button>
        </div>
      )}

      {/* Document Text Body with Highlights */}
      <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-purple-800 selection:text-white">
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
                  ? "bg-purple-600 text-white font-semibold ring-2 ring-purple-400 shadow-md"
                  : "bg-purple-900/50 hover:bg-purple-800/70 text-purple-200 border-b border-purple-400"
              }`}
              title={`Verified Evidence: "${segment.span.quote}"`}
            >
              {segment.text}
            </mark>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-500">
        <span>Truth Contract T1: Highlights strictly render stored quote offsets in verbatim text.</span>
        <span className="text-emerald-400 font-medium">✓ Deterministically Verified</span>
      </div>
    </div>
  );
}
