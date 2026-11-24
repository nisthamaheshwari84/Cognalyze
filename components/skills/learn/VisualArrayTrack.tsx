"use client";

import React from "react";
import {
  ArrayElementState,
  PointerState,
  ElementVisualState
} from "@/lib/skills/learn/content-schemas";

export interface VisualArrayTrackProps {
  elements: ArrayElementState[];
  pointers?: PointerState[];
  className?: string;
}

export default function VisualArrayTrack({
  elements,
  pointers = [],
  className = ""
}: VisualArrayTrackProps) {
  // Map pointer color to Tailwind classes for clean light theme
  const getPointerColorClass = (color?: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs";
      case "amber":
        return "bg-amber-100 text-amber-800 border-amber-300 shadow-xs";
      case "rose":
        return "bg-rose-100 text-rose-800 border-rose-300 shadow-xs";
      case "purple":
        return "bg-purple-100 text-purple-800 border-purple-300 shadow-xs";
      case "cyan":
        return "bg-cyan-100 text-cyan-800 border-cyan-300 shadow-xs";
      case "blue":
      default:
        return "bg-blue-100 text-blue-800 border-blue-300 shadow-xs";
    }
  };

  // Map element visual states to clean, high-contrast light theme styles
  const getElementStyle = (state: ElementVisualState) => {
    switch (state) {
      case "active":
        return "bg-blue-50/90 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-500/20 shadow-md scale-105 font-black";
      case "included":
        return "bg-emerald-50/90 border-2 border-emerald-600 text-emerald-950 shadow-sm font-black";
      case "discarded":
        return "bg-rose-50/80 border-2 border-dashed border-rose-300 text-rose-400 line-through opacity-70";
      case "highlight":
        return "bg-amber-50 border-2 border-amber-500 text-amber-950 ring-2 ring-amber-400/40 shadow-md font-black scale-105";
      case "sorted":
        return "bg-indigo-50 border-2 border-indigo-500 text-indigo-950 font-bold";
      case "comparing":
        return "bg-purple-50 border-2 border-purple-500 text-purple-950 ring-2 ring-purple-400/30 font-bold";
      case "unvisited":
      default:
        return "bg-white border-2 border-slate-200 text-slate-800 shadow-xs hover:border-slate-300";
    }
  };

  return (
    <div className={`w-full overflow-x-auto pb-4 pt-8 px-2 scrollbar-thin scrollbar-thumb-slate-300 ${className}`}>
      <div className="flex items-end justify-center min-w-max space-x-2 sm:space-x-3.5">
        {elements.map((elem) => {
          // Find pointers currently referencing this index
          const activePointers = pointers.filter((p) => p.index === elem.index);

          return (
            <div key={elem.index} className="flex flex-col items-center group">
              {/* Pointer Container (Above Cell) */}
              <div className="h-7 mb-1.5 flex items-center justify-center">
                {activePointers.map((p, idx) => (
                  <div
                    key={idx}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border shadow-xs animate-bounce ${getPointerColorClass(
                      p.color
                    )}`}
                    title={`Pointer: ${p.name}`}
                  >
                    <span>{p.label || p.name}</span>
                    <span className="text-[9px] ml-0.5">▼</span>
                  </div>
                ))}
              </div>

              {/* Element Cell */}
              <div
                className={`relative w-12 h-14 sm:w-14 sm:h-16 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 select-none ${getElementStyle(
                  elem.state
                )}`}
              >
                <span className="text-base sm:text-lg font-mono font-bold">
                  {elem.value}
                </span>

                {/* Subscript Index */}
                <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-slate-400 font-semibold">
                  {elem.index}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
